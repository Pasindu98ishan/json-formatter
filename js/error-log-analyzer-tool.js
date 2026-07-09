// ============================================
// ERROR LOG ANALYZER
// Paste a raw stack trace / console error / log line and get routed to the
// matching page in the site's own /errors/ reference cluster.
//
// 100% client-side. The signature database lives in data/error-signatures.json
// (one record per /errors/ page). HARD maintenance rule: every new error page
// must add a signature entry there, or this tool falls behind the cluster.
// ============================================

(function () {
    'use strict';

    var SIG_URL = 'data/error-signatures.json';
    var ERR_BASE = 'errors/';
    var MAX_RESULTS = 6;

    var signatures = [];
    var state = 'loading'; // 'loading' | 'ready' | 'error'

    var els = {};

    var SAMPLE = "Uncaught TypeError: Cannot read properties of undefined (reading 'name')\n" +
        "    at renderUser (app.js:42:17)\n" +
        "    at App (app.js:88:5)\n" +
        "    at renderWithHooks (react-dom.development.js:14985:18)";

    document.addEventListener('DOMContentLoaded', function () {
        els.input = document.getElementById('logInput');
        els.results = document.getElementById('analyzerResults');
        els.status = document.getElementById('analyzerStatus');
        els.analyzeBtn = document.getElementById('analyzeBtn');
        els.clearBtn = document.getElementById('clearBtn');
        els.sampleBtn = document.getElementById('sampleBtn');
        if (!els.input || !els.results) return;

        var run = (typeof debounce === 'function') ? debounce(analyze, 220) : analyze;
        els.input.addEventListener('input', run);

        if (els.analyzeBtn) els.analyzeBtn.addEventListener('click', analyze);
        if (els.clearBtn) els.clearBtn.addEventListener('click', function () {
            els.input.value = '';
            renderEmpty();
            els.input.focus();
        });
        if (els.sampleBtn) els.sampleBtn.addEventListener('click', function () {
            els.input.value = SAMPLE;
            analyze();
            els.input.focus();
        });

        loadSignatures();
    });

    function loadSignatures() {
        setStatus('Loading error database…');
        fetch(SIG_URL, { cache: 'no-cache' })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var list = (data && data.signatures) || [];
                signatures = list.map(function (s) {
                    try { s._rx = new RegExp(s.pattern, 'i'); }
                    catch (e) { s._rx = null; }
                    return s;
                });
                state = 'ready';
                setStatus(signatures.length + ' known errors indexed · nothing you paste leaves your browser.');
                // Prefill from ?q= if present, else analyze whatever is already there.
                // Note: some static dev servers (e.g. `npx serve`) redirect *.html?q=
                // to the extensionless path and drop the query string, so this only
                // testable with a server that preserves .html URLs (matches production).
                var q = (typeof getQueryParam === 'function') ? getQueryParam('q') : null;
                if (q && !els.input.value) els.input.value = q;
                if (els.input.value.trim()) analyze(); else renderEmpty();
            })
            .catch(function () {
                state = 'error';
                setStatus('');
                renderLoadError();
            });
    }

    function analyze() {
        if (state !== 'ready') return;
        var text = els.input.value || '';
        if (!text.trim()) { renderEmpty(); return; }

        var matches = [];
        for (var i = 0; i < signatures.length; i++) {
            var s = signatures[i];
            if (!s._rx) continue;
            s._rx.lastIndex = 0;
            var m = s._rx.exec(text);
            if (m) matches.push({ sig: s, len: m[0].length, at: m.index, matched: m[0] });
        }

        matches.sort(function (a, b) {
            var wa = (a.sig.w == null) ? 1 : a.sig.w;
            var wb = (b.sig.w == null) ? 1 : b.sig.w;
            if (wb !== wa) return wb - wa;          // higher weight first
            if (b.len !== a.len) return b.len - a.len; // longer, more specific match first
            return a.at - b.at;                      // earlier in the text first
        });

        render(matches, text);
    }

    // Best-effort parse of "ErrorType: message" or a net::ERR_* token from the
    // pasted text, used for the header line and the no-match case.
    function parseError(text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var net = line.match(/net::(ERR_[A-Z0-9_]+)/);
            if (net) return { type: net[1], message: '' };
            var m = line.match(/\b([A-Za-z_][\w.]*(?:Error|Exception|Warning|Warn))\b\s*[:\-]?\s*(.*)$/);
            if (m) return { type: m[1], message: (m[2] || '').trim() };
            // TypeScript-style code
            var ts = line.match(/\b(TS\d{3,5})\b\s*[:\-]?\s*(.*)$/);
            if (ts) return { type: ts[1], message: (ts[2] || '').trim() };
            // fall back to the first non-empty line
            return { type: '', message: line };
        }
        return { type: '', message: '' };
    }

    function render(matches, text) {
        clear(els.results);

        if (!matches.length) {
            renderNoMatch(text);
            return;
        }

        var parsed = parseError(text);
        var head = document.createElement('p');
        head.className = 'ela-resulthead';
        var lead = matches.length === 1 ? 'Found a match' : 'Found ' + matches.length + ' matching references';
        if (parsed.type) {
            head.appendChild(document.createTextNode(lead + ' for '));
            var code = document.createElement('code');
            code.textContent = parsed.type;
            head.appendChild(code);
            head.appendChild(document.createTextNode(':'));
        } else {
            head.appendChild(document.createTextNode(lead + ' in the error reference:'));
        }
        els.results.appendChild(head);

        var list = document.createElement('div');
        list.className = 'ela-cards';
        var shown = Math.min(matches.length, MAX_RESULTS);
        for (var i = 0; i < shown; i++) {
            list.appendChild(card(matches[i], i === 0));
        }
        els.results.appendChild(list);

        if (matches.length > shown) {
            var more = document.createElement('p');
            more.className = 'ela-more';
            more.textContent = '+ ' + (matches.length - shown) + ' more. Refine the pasted text for a tighter match.';
            els.results.appendChild(more);
        }

        appendBrowseFooter();
    }

    function card(match, isBest) {
        var s = match.sig;
        var a = document.createElement('a');
        a.className = 'ela-card' + (isBest ? ' ela-card-best' : '');
        a.href = ERR_BASE + s.slug;

        var top = document.createElement('div');
        top.className = 'ela-card-top';
        if (isBest) {
            var badge = document.createElement('span');
            badge.className = 'ela-badge';
            badge.textContent = 'Best match';
            top.appendChild(badge);
        }
        if (s.language) {
            var lang = document.createElement('span');
            lang.className = 'ela-lang';
            lang.textContent = s.language;
            top.appendChild(lang);
        }
        a.appendChild(top);

        var title = document.createElement('div');
        title.className = 'ela-card-title';
        title.textContent = s.label;
        a.appendChild(title);

        // Show the exact snippet of the user's text that matched, so the
        // routing is transparent.
        if (match.matched) {
            var why = document.createElement('div');
            why.className = 'ela-card-why';
            why.appendChild(document.createTextNode('matched '));
            var mk = document.createElement('mark');
            mk.textContent = trim(match.matched, 60);
            why.appendChild(mk);
            a.appendChild(why);
        }

        var cta = document.createElement('span');
        cta.className = 'ela-card-cta';
        cta.textContent = 'Read the cause & fix →';
        a.appendChild(cta);
        return a;
    }

    function renderNoMatch(text) {
        var parsed = parseError(text);
        var box = document.createElement('div');
        box.className = 'ela-nomatch';

        var h = document.createElement('p');
        h.className = 'ela-nomatch-head';
        h.textContent = 'No exact match in the reference yet.';
        box.appendChild(h);

        if (parsed.type || parsed.message) {
            var p = document.createElement('p');
            p.className = 'ela-nomatch-parsed';
            p.appendChild(document.createTextNode('Detected: '));
            if (parsed.type) {
                var c = document.createElement('code');
                c.textContent = parsed.type;
                p.appendChild(c);
            }
            if (parsed.message) {
                p.appendChild(document.createTextNode(parsed.type ? ' — ' : ''));
                var span = document.createElement('span');
                span.textContent = trim(parsed.message, 140);
                p.appendChild(span);
            }
            box.appendChild(p);
        }

        var browse = document.createElement('p');
        browse.className = 'ela-nomatch-cta';
        var link = document.createElement('a');
        link.href = 'errors.html';
        link.className = 'btn btn-primary';
        link.textContent = 'Browse all error references →';
        browse.appendChild(link);
        box.appendChild(browse);

        els.results.appendChild(box);
    }

    function appendBrowseFooter() {
        var f = document.createElement('p');
        f.className = 'ela-browse';
        f.appendChild(document.createTextNode('Not the one? '));
        var a = document.createElement('a');
        a.href = 'errors.html';
        a.textContent = 'Browse all error references';
        f.appendChild(a);
        f.appendChild(document.createTextNode('.'));
        els.results.appendChild(f);
    }

    function renderEmpty() {
        clear(els.results);
        var p = document.createElement('p');
        p.className = 'ela-hint';
        p.textContent = 'Paste an error message or stack trace above to find the matching fix.';
        els.results.appendChild(p);
    }

    function renderLoadError() {
        clear(els.results);
        var box = document.createElement('div');
        box.className = 'ela-nomatch';
        var h = document.createElement('p');
        h.className = 'ela-nomatch-head';
        h.textContent = 'Could not load the error database.';
        box.appendChild(h);
        var p = document.createElement('p');
        p.textContent = 'You can still browse the full reference directly.';
        box.appendChild(p);
        var browse = document.createElement('p');
        browse.className = 'ela-nomatch-cta';
        var link = document.createElement('a');
        link.href = 'errors.html';
        link.className = 'btn btn-primary';
        link.textContent = 'Browse all error references →';
        browse.appendChild(link);
        box.appendChild(browse);
        els.results.appendChild(box);
    }

    // ---- small helpers ----
    function setStatus(msg) {
        if (els.status) els.status.textContent = msg || '';
    }
    function clear(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }
    function trim(str, n) {
        str = String(str);
        return str.length > n ? str.slice(0, n - 1) + '…' : str;
    }
})();
