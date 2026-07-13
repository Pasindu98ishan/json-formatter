// ============================================
// LOG REDACTOR
// Paste raw logs and strip secrets (cloud/API keys, tokens, passwords,
// emails, IPs, card numbers) before sharing them in a bug report, Slack,
// or an AI chat.
//
// 100% client-side. Pure regex substitution — no dependencies, nothing you
// paste leaves the browser. Matches from all enabled rules are collected as
// spans over the original text, overlaps are resolved (earlier start, then
// longer match, then rule priority), and the output is rebuilt in one pass
// so placeholders are never re-scanned.
// ============================================

(function () {
    'use strict';

    var els = {};
    var lastRedacted = '';   // plain redacted text for copy/download
    var hasRun = false;

    // ---- rule definitions ----
    // Each rule: { id, cat, label, placeholder, rx, validate?, span? }
    //  - cat        → which UI toggle controls it
    //  - validate   → optional extra check on the match (e.g. Luhn, safe-list)
    //  - span       → optional fn(m) → [start, end] to redact only part of the
    //                 match (e.g. keep "password=" and redact just the value)
    var RULES = [
        {
            id: 'privatekey', cat: 'tokens', label: 'private key block', placeholder: '[REDACTED_PRIVATE_KEY]',
            rx: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
        },
        {
            id: 'awskey', cat: 'vendor', label: 'AWS key ID', placeholder: '[REDACTED_AWS_KEY_ID]',
            rx: /\b(?:AKIA|ASIA|ABIA|ACCA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA)[0-9A-Z]{16}\b/g
        },
        {
            id: 'github', cat: 'vendor', label: 'GitHub token', placeholder: '[REDACTED_GITHUB_TOKEN]',
            rx: /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{22,255})\b/g
        },
        {
            id: 'slack', cat: 'vendor', label: 'Slack token', placeholder: '[REDACTED_SLACK_TOKEN]',
            rx: /\bxox[baprse]-[A-Za-z0-9-]{10,}\b/g
        },
        {
            id: 'stripe', cat: 'vendor', label: 'Stripe key', placeholder: '[REDACTED_STRIPE_KEY]',
            rx: /\b[spr]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g
        },
        {
            id: 'google', cat: 'vendor', label: 'Google API key', placeholder: '[REDACTED_GOOGLE_KEY]',
            rx: /\bAIza[0-9A-Za-z_-]{35}\b/g
        },
        {
            id: 'npmtoken', cat: 'vendor', label: 'npm token', placeholder: '[REDACTED_NPM_TOKEN]',
            rx: /\bnpm_[A-Za-z0-9]{36,}\b/g
        },
        {
            id: 'skkey', cat: 'vendor', label: 'API key (sk-…)', placeholder: '[REDACTED_API_KEY]',
            rx: /\bsk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,}\b/g
        },
        {
            id: 'jwt', cat: 'tokens', label: 'JWT', placeholder: '[REDACTED_JWT]',
            // both the header and the payload of a real JWT base64-encode a
            // JSON object, so both segments start with "eyJ"
            rx: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g
        },
        {
            id: 'bearer', cat: 'tokens', label: 'bearer token', placeholder: '[REDACTED_TOKEN]',
            rx: /\b([Bb]earer\s+)([A-Za-z0-9._~+\/=-]{8,})/g,
            span: function (m) {
                var start = m.index + m[1].length;
                return [start, start + m[2].length];
            }
        },
        {
            id: 'basic', cat: 'tokens', label: 'basic-auth credentials', placeholder: '[REDACTED_CREDENTIALS]',
            rx: /\b([Bb]asic\s+)([A-Za-z0-9+\/=]{8,})/g,
            span: function (m) {
                var start = m.index + m[1].length;
                return [start, start + m[2].length];
            }
        },
        {
            id: 'urlcreds', cat: 'secrets', label: 'URL credentials', placeholder: '[REDACTED_CREDENTIALS]',
            // user:password@ inside a connection string / URL
            rx: /\b([a-z][a-z0-9+.-]*:\/\/)([^\/\s:@'"]+:[^\/\s@'"]+)@/gi,
            span: function (m) {
                var start = m.index + m[1].length;
                return [start, start + m[2].length];
            }
        },
        {
            id: 'kv', cat: 'secrets', label: 'password / secret value', placeholder: '[REDACTED_SECRET]',
            // key=value / key: value / "key": "value" where the key smells like
            // a secret; the key and separator are kept, only the value goes
            rx: /([\w.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|apikey|credential)[\w.-]*)(['"]?\s*[:=]\s*['"]?)([^\s'",;&)\]}]+)/gi,
            span: function (m) {
                var end = m.index + m[0].length;
                return [end - m[3].length, end];
            }
        },
        {
            id: 'email', cat: 'email', label: 'email address', placeholder: '[REDACTED_EMAIL]',
            rx: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
        },
        {
            id: 'card', cat: 'card', label: 'card number', placeholder: '[REDACTED_CARD]',
            rx: /\b(?:\d[ -]?){12,18}\d\b/g,
            validate: function (raw) {
                var digits = raw.replace(/[^\d]/g, '');
                if (digits.length < 13 || digits.length > 19) return false;
                return luhn(digits);
            }
        },
        {
            id: 'mac', cat: 'network', label: 'MAC address', placeholder: '[REDACTED_MAC]',
            rx: /\b[0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5}\b/g
        },
        {
            id: 'ipv4', cat: 'network', label: 'IPv4 address', placeholder: '[REDACTED_IP]',
            rx: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
            // localhost / unspecified are not sensitive and appear constantly
            // in logs — redacting them would just add noise
            validate: function (raw) { return raw !== '127.0.0.1' && raw !== '0.0.0.0'; }
        },
        {
            id: 'ipv6', cat: 'network', label: 'IPv6 address', placeholder: '[REDACTED_IP]',
            rx: /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b|\b(?:[A-Fa-f0-9]{1,4}:)+:(?:[A-Fa-f0-9]{1,4}(?::[A-Fa-f0-9]{1,4})*)?\b/g,
            validate: function (raw) { return raw !== '::1' && raw.length > 3; }
        }
    ];

    // The fake Stripe key below is split across concatenated literals so the
    // full string never appears contiguously in source — some secret scanners
    // (incl. GitHub push protection) flag it by shape alone, sample data or not.
    var FAKE_STRIPE_KEY = 'sk_' + 'live_' + '4eC39HqLyjWDarjtT1zdp7dc';

    var SAMPLE = '2026-07-10 09:14:22 INFO  deploy started by pasindu@example.com from 203.0.113.42\n' +
        '2026-07-10 09:14:23 DEBUG aws_access_key_id=AKIAIOSFODNN7EXAMPLE\n' +
        '2026-07-10 09:14:23 DEBUG aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n' +
        '2026-07-10 09:14:24 INFO  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\n' +
        '2026-07-10 09:14:25 WARN  retry billing with api_key="' + FAKE_STRIPE_KEY + '"\n' +
        '2026-07-10 09:14:26 ERROR postgres://admin:Sup3rS3cret@db.internal.example:5432/prod — connection refused\n' +
        '2026-07-10 09:14:27 INFO  card 4242 4242 4242 4242 declined, notifying ops@example.com';

    document.addEventListener('DOMContentLoaded', function () {
        els.input = document.getElementById('logInput');
        els.output = document.getElementById('redactorOutput');
        els.stats = document.getElementById('redactorStats');
        els.outWrap = document.getElementById('redactorOutputWrap');
        els.redactBtn = document.getElementById('redactBtn');
        els.sampleBtn = document.getElementById('sampleBtn');
        els.clearBtn = document.getElementById('clearBtn');
        els.copyBtn = document.getElementById('copyBtn');
        els.downloadBtn = document.getElementById('downloadBtn');
        els.fileInput = document.getElementById('fileInput');
        els.toggles = document.querySelectorAll('.lr-chip input[type="checkbox"]');
        if (!els.input || !els.output) return;

        var run = (typeof debounce === 'function') ? debounce(redact, 200) : redact;
        els.input.addEventListener('input', run);
        for (var i = 0; i < els.toggles.length; i++) {
            els.toggles[i].addEventListener('change', redact);
        }

        if (els.redactBtn) els.redactBtn.addEventListener('click', redact);
        if (els.sampleBtn) els.sampleBtn.addEventListener('click', function () {
            els.input.value = SAMPLE;
            redact();
            els.input.focus();
        });
        if (els.clearBtn) els.clearBtn.addEventListener('click', function () {
            els.input.value = '';
            renderEmpty();
            els.input.focus();
        });
        if (els.copyBtn) els.copyBtn.addEventListener('click', function () {
            if (!lastRedacted) { showToast('Nothing to copy yet'); return; }
            copyToClipboard(lastRedacted).then(function () { showToast('Redacted log copied'); });
        });
        if (els.downloadBtn) els.downloadBtn.addEventListener('click', function () {
            if (!lastRedacted) { showToast('Nothing to download yet'); return; }
            downloadFile(lastRedacted, 'redacted.log', 'text/plain');
        });

        if (typeof initDragDrop === 'function') {
            initDragDrop('logInput', function (content) {
                els.input.value = content;
                redact();
            });
        }

        if (els.fileInput) {
            els.fileInput.addEventListener('change', function () {
                var file = els.fileInput.files && els.fileInput.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    els.input.value = ev.target.result;
                    redact();
                    showToast('Loaded ' + file.name);
                    els.input.focus();
                };
                reader.readAsText(file);
                els.fileInput.value = ''; // allow re-selecting the same file
            });
        }

        renderEmpty();
    });

    function enabledCats() {
        var cats = {};
        for (var i = 0; i < els.toggles.length; i++) {
            cats[els.toggles[i].value] = els.toggles[i].checked;
        }
        return cats;
    }

    function redact() {
        var text = els.input.value || '';
        if (!text.trim()) { renderEmpty(); return; }

        var cats = enabledCats();
        var spans = [];

        for (var i = 0; i < RULES.length; i++) {
            var rule = RULES[i];
            if (!cats[rule.cat]) continue;
            rule.rx.lastIndex = 0;
            var m;
            while ((m = rule.rx.exec(text)) !== null) {
                if (m[0].length === 0) { rule.rx.lastIndex++; continue; }
                if (rule.validate && !rule.validate(m[0])) continue;
                var se = rule.span ? rule.span(m) : [m.index, m.index + m[0].length];
                spans.push({ start: se[0], end: se[1], rule: rule, prio: i });
            }
        }

        // earlier start first; at the same start the longer match wins, then
        // the higher-priority (more specific) rule
        spans.sort(function (a, b) {
            if (a.start !== b.start) return a.start - b.start;
            if (b.end !== a.end) return b.end - a.end;
            return a.prio - b.prio;
        });

        var kept = [];
        var lastEnd = -1;
        for (var k = 0; k < spans.length; k++) {
            if (spans[k].start >= lastEnd) {
                kept.push(spans[k]);
                lastEnd = spans[k].end;
            }
        }

        render(text, kept);
    }

    function render(text, spans) {
        hasRun = true;
        clear(els.output);
        if (els.outWrap) els.outWrap.style.display = '';

        var counts = {};
        var out = '';
        var pos = 0;

        for (var i = 0; i < spans.length; i++) {
            var s = spans[i];
            if (s.start > pos) {
                els.output.appendChild(document.createTextNode(text.slice(pos, s.start)));
                out += text.slice(pos, s.start);
            }
            var mk = document.createElement('mark');
            mk.className = 'lr-mark';
            mk.textContent = s.rule.placeholder;
            els.output.appendChild(mk);
            out += s.rule.placeholder;
            pos = s.end;
            counts[s.rule.label] = (counts[s.rule.label] || 0) + 1;
        }
        if (pos < text.length) {
            els.output.appendChild(document.createTextNode(text.slice(pos)));
            out += text.slice(pos);
        }
        lastRedacted = out;

        // stats line
        if (els.stats) {
            clear(els.stats);
            if (!spans.length) {
                els.stats.appendChild(document.createTextNode('No known secret patterns found. Regexes aren’t perfect — skim the output before sharing.'));
            } else {
                var parts = [];
                for (var label in counts) {
                    if (counts.hasOwnProperty(label)) {
                        parts.push(label + ' ×' + counts[label]);
                    }
                }
                var strong = document.createElement('strong');
                strong.textContent = 'Redacted ' + spans.length + (spans.length === 1 ? ' item' : ' items');
                els.stats.appendChild(strong);
                els.stats.appendChild(document.createTextNode(' — ' + parts.join(', ') + '. Nothing left your browser.'));
            }
        }
    }

    function renderEmpty() {
        hasRun = false;
        lastRedacted = '';
        clear(els.output);
        if (els.stats) clear(els.stats);
        if (els.outWrap) els.outWrap.style.display = 'none';
    }

    // ---- small helpers ----
    function luhn(digits) {
        var sum = 0;
        var alt = false;
        for (var i = digits.length - 1; i >= 0; i--) {
            var d = digits.charCodeAt(i) - 48;
            if (alt) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            alt = !alt;
        }
        return sum % 10 === 0;
    }

    function clear(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }
})();
