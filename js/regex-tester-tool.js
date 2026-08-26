// Regex Tester Tool — live match highlighting, capture groups, replace preview
// and code generation. 100% client-side, using the browser's native RegExp engine.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Matching runs on every keystroke, so a pathological pattern must not be able
// to lock the tab. 250ms is far above any healthy pattern's cost.
var MATCH_TIME_BUDGET_MS = 250;

// Nested quantifiers over overlapping character classes are the classic
// catastrophic-backtracking shape; naming the construct beats a generic warning.
function findRiskyConstruct(pattern) {
    // Only shapes that genuinely nest a quantifier inside a quantified group.
    // A broader heuristic (e.g. "two quantified character classes") fires on
    // ordinary patterns like an email regex, so it is deliberately omitted —
    // the worker timeout is the real protection, this only labels the cause.
    var risky = [
        { re: /\(([^()]*[+*])\)[+*]/, label: 'a quantifier inside a group that is itself quantified, e.g. (a+)+' },
        { re: /\((?:[^()|]*\|)+[^()|]*\)[+*]/, label: 'a quantified alternation group, e.g. (a|a)*' },
        { re: /\((?:[^()]*\{\d+,\}?\})\)[+*]/, label: 'an open-ended repetition inside a quantified group' }
    ];
    for (var i = 0; i < risky.length; i++) {
        if (risky[i].re.test(pattern)) return risky[i].label;
    }
    return null;
}

// Run a pattern against text. Returns { matches, error, truncated, timedOut }.
// Exposed for testing.
function runRegex(pattern, flags, text, budgetMs) {
    var budget = typeof budgetMs === 'number' ? budgetMs : MATCH_TIME_BUDGET_MS;
    let re;
    try {
        re = new RegExp(pattern, flags);
    } catch (e) {
        return { error: e.message, matches: [], truncated: false, timedOut: false };
    }

    const matches = [];
    if (pattern === '') return { error: null, matches, truncated: false, timedOut: false };

    var started = Date.now();
    var timedOut = false;
    var truncated = false;

    if (re.global || re.sticky) {
        let m;
        let guard = 0;
        while ((m = re.exec(text)) !== null) {
            matches.push(snapshot(m));
            if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width infinite loop
            if (++guard > 100000) { truncated = true; break; }
            // Checked between matches: a single catastrophic exec still blocks,
            // but any repeated blow-up is caught before the tab becomes unusable.
            if ((guard & 0xFF) === 0 && Date.now() - started > budget) { timedOut = true; break; }
        }
    } else {
        const m = re.exec(text);
        if (m) matches.push(snapshot(m));
        if (Date.now() - started > budget) timedOut = true;
    }

    return { error: null, matches, truncated, timedOut };
}

function snapshot(m) {
    return {
        match: m[0],
        index: m.index,
        groups: m.slice(1),
        named: m.groups ? { ...m.groups } : null
    };
}

// --- terminable matcher ------------------------------------------------

// A time budget checked between matches is not enough: catastrophic
// backtracking happens *inside a single exec call*, which never yields, so no
// amount of checking around it can help. The only way to stay responsive is to
// run the match somewhere we can forcibly kill — a worker built from a blob,
// so no extra file and no CDN.
function buildWorkerSource() {
    return 'var MATCH_TIME_BUDGET_MS = ' + MATCH_TIME_BUDGET_MS + ';\n' +
        snapshot.toString() + '\n' +
        runRegex.toString() + '\n' +
        'self.onmessage = function (e) {\n' +
        '    var d = e.data;\n' +
        '    var r = runRegex(d.pattern, d.flags, d.text, d.budget);\n' +
        '    self.postMessage({ id: d.id, result: r });\n' +
        '};';
}

function createRegexMatcher(timeoutMs) {
    var timeout = timeoutMs || 1000;
    var supported = typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined';
    var worker = null;
    var url = null;
    var seq = 0;
    var pending = null;

    function spawn() {
        if (!url) url = URL.createObjectURL(new Blob([buildWorkerSource()], { type: 'application/javascript' }));
        worker = new Worker(url);
        worker.onmessage = function (e) {
            if (!pending || e.data.id !== pending.id) return;
            clearTimeout(pending.timer);
            var resolve = pending.resolve;
            pending = null;
            resolve(e.data.result);
        };
        worker.onerror = function () {
            if (!pending) return;
            clearTimeout(pending.timer);
            var resolve = pending.resolve;
            pending = null;
            resolve({ error: null, matches: [], truncated: false, timedOut: true });
        };
    }

    function kill() {
        if (worker) { worker.terminate(); worker = null; }
    }

    return {
        supported: supported,
        match: function (pattern, flags, text) {
            // Without workers, refuse to run a pattern whose shape is known to
            // blow up rather than freeze the page.
            if (!supported) {
                var risky = findRiskyConstruct(pattern);
                if (risky && text.length > 250) {
                    return Promise.resolve({
                        error: null, matches: [], truncated: false, timedOut: true, risky: risky
                    });
                }
                return Promise.resolve(runRegex(pattern, flags, text, MATCH_TIME_BUDGET_MS));
            }

            // A previous run still going means it is stuck: kill it.
            if (pending) {
                clearTimeout(pending.timer);
                pending.resolve({ error: null, matches: [], truncated: false, timedOut: true });
                pending = null;
                kill();
            }
            if (!worker) spawn();

            var id = ++seq;
            var self_ = this;
            return new Promise(function (resolve) {
                pending = {
                    id: id,
                    resolve: resolve,
                    timer: setTimeout(function () {
                        pending = null;
                        kill();   // the whole point: a stuck exec dies here
                        resolve({ error: null, matches: [], truncated: false, timedOut: true });
                    }, timeout)
                };
                worker.postMessage({ id: id, pattern: pattern, flags: flags, text: text, budget: timeout });
            });
        }
    };
}

// --- replace mode ------------------------------------------------------

function runReplace(pattern, flags, text, replacement) {
    try {
        var re = new RegExp(pattern, flags);
        return { error: null, output: text.replace(re, replacement) };
    } catch (e) {
        return { error: e.message, output: '' };
    }
}

// --- code generation ---------------------------------------------------

// Quoting rules differ per language and getting them wrong produces snippets
// that silently match the wrong thing, so each is handled explicitly.

// Python raw string: backslashes must NOT be doubled (r'\\d' is two literal
// backslashes, not \d). Only the surrounding quote character matters, and a
// raw string cannot end in a backslash.
function pythonLiteral(pattern) {
    var hasSingle = pattern.indexOf("'") !== -1;
    var hasDouble = pattern.indexOf('"') !== -1;
    var endsWithBackslash = /\\$/.test(pattern);

    if (!endsWithBackslash && !(hasSingle && hasDouble)) {
        var q = hasSingle ? '"' : "'";
        return 'r' + q + pattern + q;
    }
    // Fall back to a normal string, where backslashes do need doubling.
    return "'" + pattern.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

// PHP single-quoted string: only ' and a trailing \ are special. Doubling
// every backslash would still work but makes the snippet hard to read.
function phpLiteral(text) {
    return "'" + text.replace(/\\(?=')/g, '\\\\').replace(/'/g, "\\'").replace(/\\$/, '\\\\') + "'";
}

// Java has no raw strings, so every backslash really is doubled.
function javaLiteral(pattern) {
    return '"' + pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// Go raw string uses backticks and cannot contain one.
function goLiteral(pattern) {
    if (pattern.indexOf('`') === -1) return '`' + pattern + '`';
    return '"' + pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

var CODE_GENERATORS = {
    javascript: function (p, f) {
        return 'const re = /' + p + '/' + f + ';\n' +
            'const matches = ' + (f.indexOf('g') !== -1 ? 'text.match(re)' : 're.exec(text)') + ';\n' +
            'console.log(matches);';
    },
    python: function (p, f) {
        var mods = [];
        if (f.indexOf('i') !== -1) mods.push('re.IGNORECASE');
        if (f.indexOf('m') !== -1) mods.push('re.MULTILINE');
        if (f.indexOf('s') !== -1) mods.push('re.DOTALL');
        var flagArg = mods.length ? ', ' + mods.join(' | ') : '';
        return 'import re\n\n' +
            'pattern = re.compile(' + pythonLiteral(p) + flagArg + ')\n' +
            (f.indexOf('g') !== -1
                ? 'matches = pattern.findall(text)\nprint(matches)'
                : 'match = pattern.search(text)\nprint(match.group() if match else None)');
    },
    go: function (p, f) {
        var inline = '';
        if (f.indexOf('i') !== -1) inline += 'i';
        if (f.indexOf('s') !== -1) inline += 's';
        if (f.indexOf('m') !== -1) inline += 'm';
        var full = inline ? '(?' + inline + ')' + p : p;
        return 'package main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\n' +
            'func main() {\n' +
            '\tre := regexp.MustCompile(' + goLiteral(full) + ')\n' +
            (f.indexOf('g') !== -1
                ? '\tmatches := re.FindAllString(text, -1)\n'
                : '\tmatches := re.FindString(text)\n') +
            '\tfmt.Println(matches)\n}';
    },
    java: function (p, f) {
        var mods = [];
        if (f.indexOf('i') !== -1) mods.push('Pattern.CASE_INSENSITIVE');
        if (f.indexOf('m') !== -1) mods.push('Pattern.MULTILINE');
        if (f.indexOf('s') !== -1) mods.push('Pattern.DOTALL');
        var flagArg = mods.length ? ', ' + mods.join(' | ') : '';
        return 'import java.util.regex.*;\n\n' +
            'Pattern pattern = Pattern.compile(' + javaLiteral(p) + flagArg + ');\n' +
            'Matcher matcher = pattern.matcher(text);\n' +
            'while (matcher.find()) {\n    System.out.println(matcher.group());\n}';
    },
    php: function (p, f) {
        var mods = '';
        if (f.indexOf('i') !== -1) mods += 'i';
        if (f.indexOf('m') !== -1) mods += 'm';
        if (f.indexOf('s') !== -1) mods += 's';
        if (f.indexOf('u') !== -1) mods += 'u';
        var delim = p.indexOf('/') !== -1 ? '#' : '/';
        return '<?php\n$pattern = ' + phpLiteral(delim + p + delim + mods) + ';\n' +
            (f.indexOf('g') !== -1
                ? 'preg_match_all($pattern, $text, $matches);\n'
                : 'preg_match($pattern, $text, $matches);\n') +
            'print_r($matches);';
    },
    csharp: function (p, f) {
        var mods = [];
        if (f.indexOf('i') !== -1) mods.push('RegexOptions.IgnoreCase');
        if (f.indexOf('m') !== -1) mods.push('RegexOptions.Multiline');
        if (f.indexOf('s') !== -1) mods.push('RegexOptions.Singleline');
        var flagArg = mods.length ? ', ' + mods.join(' | ') : '';
        return 'using System.Text.RegularExpressions;\n\n' +
            'var regex = new Regex(@' + '"' + String(p).replace(/"/g, '""') + '"' + flagArg + ');\n' +
            'foreach (Match m in regex.Matches(text))\n{\n    Console.WriteLine(m.Value);\n}';
    }
};

function generateCode(language, pattern, flags) {
    var gen = CODE_GENERATORS[language];
    return gen ? gen(pattern, flags) : '';
}

// --- pattern library ---------------------------------------------------

var PATTERN_LIBRARY = [
    { name: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', flags: 'g',
      sample: 'Contact alice@example.com or bob.smith+tag@dev.co.uk today.\nInvalid: not-an-email, @nope.' },
    { name: 'URL', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'g',
      sample: 'Docs at https://jsondevtools.org/formatter.html and http://example.com/a?b=1.\nNot a url: ftp:/nope' },
    { name: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\b', flags: 'g',
      sample: 'Allowed: 192.168.1.1, 10.0.0.255, 8.8.8.8\nRejected: 999.1.1.1, 1.2.3' },
    { name: 'UUID v4', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', flags: 'gi',
      sample: 'id: 3f2504e0-4f89-41d3-9a0c-0305e82c3301\nbad: 3f2504e0-4f89-11d3-0a0c-0305e82c3301' },
    { name: 'ISO date', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g',
      sample: 'Released 2026-08-18, updated 2025-12-01.\nInvalid: 2026-13-01, 26-08-18' },
    { name: 'Semver', pattern: '\\bv?(\\d+)\\.(\\d+)\\.(\\d+)(?:-([\\w.]+))?\\b', flags: 'g',
      sample: 'Versions: 1.0.0, v2.14.3, 3.0.0-beta.1\nNot semver: 1.0, version-two' },
    { name: 'Hex colour', pattern: '#(?:[0-9a-f]{3}|[0-9a-f]{6})\\b', flags: 'gi',
      sample: 'Colours: #fff, #4A90E2, #ff0000\nInvalid: #12, #gggggg' },
    { name: 'Slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', flags: 'gm',
      sample: 'how-to-parse-json\nvalid-slug-123\nNot A Slug\ntrailing-' },
    { name: 'Phone (intl)', pattern: '\\+?\\d{1,3}[\\s.-]?\\(?\\d{2,4}\\)?[\\s.-]?\\d{3,4}[\\s.-]?\\d{3,4}', flags: 'g',
      sample: 'Call +1 (555) 123-4567 or 020 7946 0958.\nAlso: +94.71.234.5678' },
    { name: 'Duplicate word', pattern: '\\b(\\w+)\\s+\\1\\b', flags: 'gi',
      sample: 'This this is a a common typo pattern.\nThis one is fine.' }
];

if (typeof window !== 'undefined') {
    window.runRegex = runRegex;
}

// --- DOM wiring --------------------------------------------------------

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', function () {
    const patternInput = document.getElementById('patternInput');
    const testInput = document.getElementById('testInput');
    const highlight = document.getElementById('highlightOutput');
    const matchList = document.getElementById('matchList');
    const statusEl = document.getElementById('regexStatus');
    const flagBoxes = Array.from(document.querySelectorAll('.flag-box'));
    const replaceInput = document.getElementById('replaceInput');
    const replaceOutput = document.getElementById('replaceOutput');
    const replaceWrap = document.getElementById('replaceWrap');
    const replaceToggle = document.getElementById('replaceToggle');
    const codeLang = document.getElementById('codeLang');
    const codeOutput = document.getElementById('codeOutput');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const libraryWrap = document.getElementById('patternLibrary');
    const shareBtn = document.getElementById('shareRegexBtn');
    const copyMatchesBtn = document.getElementById('copyMatchesBtn');
    if (!patternInput) return;

    var lastMatches = [];
    var lastRunSafe = true;   // false after a timeout, so replace mode stays off
    var matcher = createRegexMatcher(1000);

    function getFlags() {
        return flagBoxes.filter(b => b.checked).map(b => b.value).join('');
    }

    function setFlags(flags) {
        flagBoxes.forEach(function (b) { b.checked = flags.indexOf(b.value) !== -1; });
    }

    function renderCode() {
        if (!codeOutput || !codeLang) return;
        codeOutput.textContent = generateCode(codeLang.value, patternInput.value, getFlags());
    }

    function renderReplace() {
        if (!replaceOutput || !replaceInput) return;
        if (replaceWrap && replaceWrap.style.display === 'none') return;
        // replace() runs on the main thread, so never feed it a pattern that
        // just proved it can hang.
        if (!lastRunSafe) {
            replaceOutput.innerHTML = '<span class="rx-placeholder">Replacement preview is paused while the pattern is too slow.</span>';
            return;
        }
        var res = runReplace(patternInput.value, getFlags(), testInput.value, replaceInput.value);
        if (res.error) {
            replaceOutput.innerHTML = '<span class="rx-placeholder">Fix the pattern to preview the replacement.</span>';
        } else {
            replaceOutput.textContent = res.output;
        }
    }

    function render() {
        const pattern = patternInput.value;
        const text = testInput.value;
        const flags = getFlags();
        matcher.match(pattern, flags, text).then(function (result) {
            paint(pattern, text, result);
        });
    }

    function paint(pattern, text, result) {
        lastRunSafe = !result.timedOut;

        if (result.error) {
            statusEl.textContent = '✗ ' + result.error;
            statusEl.className = 'rx-status err';
            highlight.innerHTML = escapeHtml(text);
            matchList.innerHTML = '';
            patternInput.style.borderColor = '#dc3545';
            lastMatches = [];
            renderCode();
            return;
        }
        patternInput.style.borderColor = '';
        lastMatches = result.matches;

        if (pattern === '' || result.matches.length === 0) {
            highlight.innerHTML = escapeHtml(text) || '<span class="rx-placeholder">Matches will be highlighted here…</span>';
        } else {
            let html = '';
            let last = 0;
            result.matches.forEach(mt => {
                html += escapeHtml(text.slice(last, mt.index));
                html += '<mark>' + escapeHtml(mt.match || '') + '</mark>';
                last = mt.index + (mt.match ? mt.match.length : 0);
            });
            html += escapeHtml(text.slice(last));
            highlight.innerHTML = html;
        }

        const n = result.matches.length;
        if (result.timedOut) {
            var risky = result.risky || findRiskyConstruct(pattern);
            statusEl.innerHTML = '⏱ Pattern stopped after 1s — this is <strong>catastrophic backtracking</strong>' +
                (risky ? ', caused by <strong>' + escapeHtml(risky) + '</strong>.' : '.') +
                ' The match was cancelled, so the page stays responsive. Try making the quantifiers non-overlapping or anchoring the pattern.';
            statusEl.className = 'rx-status err';
        } else if (result.truncated) {
            statusEl.textContent = '✓ ' + n + ' matches (stopped at the 100,000 match limit)';
            statusEl.className = 'rx-status ok';
        } else {
            statusEl.textContent = pattern === '' ? 'Enter a pattern to begin.'
                : n === 0 ? 'No matches.' : `✓ ${n} match${n === 1 ? '' : 'es'}`;
            statusEl.className = 'rx-status ' + (n > 0 ? 'ok' : 'muted');
        }

        matchList.innerHTML = '';
        result.matches.slice(0, 500).forEach((mt, i) => {
            const row = document.createElement('div');
            row.className = 'match-row';
            let inner = `<span class="match-num">${i + 1}</span><code class="match-text">${escapeHtml(mt.match) || '<em>(empty)</em>'}</code><span class="match-at">at ${mt.index}</span>`;
            if (mt.groups.length) {
                inner += '<div class="match-groups">' + mt.groups.map((g, gi) =>
                    `<span class="group-chip">$${gi + 1}: <code>${g == null ? '<em>undefined</em>' : escapeHtml(g)}</code></span>`
                ).join('') + '</div>';
            }
            if (mt.named) {
                inner += '<div class="match-groups">' + Object.entries(mt.named).map(([k, v]) =>
                    `<span class="group-chip">&lt;${escapeHtml(k)}&gt;: <code>${v == null ? '<em>undefined</em>' : escapeHtml(v)}</code></span>`
                ).join('') + '</div>';
            }
            row.innerHTML = inner;
            matchList.appendChild(row);
        });

        renderReplace();
        renderCode();
    }

    // Debounced so a slow pattern costs one run, not one per keystroke.
    var scheduleRender = typeof debounce === 'function' ? debounce(render, 120) : render;

    patternInput.addEventListener('input', scheduleRender);
    testInput.addEventListener('input', scheduleRender);
    flagBoxes.forEach(b => b.addEventListener('change', render));
    if (replaceInput) replaceInput.addEventListener('input',
        typeof debounce === 'function' ? debounce(renderReplace, 120) : renderReplace);
    if (codeLang) codeLang.addEventListener('change', renderCode);

    if (replaceToggle && replaceWrap) {
        replaceToggle.addEventListener('click', function () {
            var showing = replaceWrap.style.display !== 'none';
            replaceWrap.style.display = showing ? 'none' : 'block';
            replaceToggle.textContent = showing ? 'Show replace mode' : 'Hide replace mode';
            replaceToggle.setAttribute('aria-expanded', String(!showing));
            if (!showing) { renderReplace(); trackEvent('use_replace_mode', { tool: 'regex_tester' }); }
        });
    }

    // Pattern library: each preset loads its own sample so the tool
    // demonstrates the expression immediately.
    if (libraryWrap) {
        PATTERN_LIBRARY.forEach(function (item) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rx-preset';
            btn.textContent = item.name;
            btn.addEventListener('click', function () {
                patternInput.value = item.pattern;
                setFlags(item.flags);
                testInput.value = item.sample;
                render();
                trackEvent('use_pattern_preset', { tool: 'regex_tester', preset: item.name });
            });
            libraryWrap.appendChild(btn);
        });
    }

    const copyBtn = document.getElementById('copyRegexBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
        const literal = '/' + patternInput.value + '/' + getFlags();
        copyToClipboard(literal).then(() => showToast('Copied ' + literal));
        trackEvent('copy_output', { tool: 'regex_tester' });
    });

    if (copyCodeBtn) copyCodeBtn.addEventListener('click', function () {
        if (!codeOutput.textContent) return;
        copyToClipboard(codeOutput.textContent).then(function () {
            showToast('Code snippet copied!');
            trackEvent('copy_code_snippet', { tool: 'regex_tester', language: codeLang.value });
        });
    });

    if (copyMatchesBtn) copyMatchesBtn.addEventListener('click', function () {
        if (!lastMatches.length) { showToast('No matches to copy'); return; }
        var payload = JSON.stringify(lastMatches.map(function (m) {
            return { match: m.match, index: m.index, groups: m.groups, named: m.named };
        }), null, 2);
        copyToClipboard(payload).then(function () { showToast('Matches copied as JSON'); });
    });

    // Permalink: pattern, flags and test text travel in the URL hash.
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var state = { p: patternInput.value, f: getFlags(), t: testInput.value };
            var encoded = encodeURIComponent(JSON.stringify(state));
            var url = location.origin + location.pathname + '#r=' + encoded;
            if (url.length > 8000) { showToast('Test string is too long to share by link'); return; }
            copyToClipboard(url).then(function () { showToast('Share link copied!'); });
            trackEvent('share_link', { tool: 'regex_tester' });
        });
    }

    if (location.hash.indexOf('#r=') === 0) {
        try {
            var state = JSON.parse(decodeURIComponent(location.hash.slice(3)));
            if (state && typeof state.p === 'string') {
                patternInput.value = state.p;
                setFlags(state.f || '');
                if (typeof state.t === 'string') testInput.value = state.t;
            }
        } catch (e) { /* ignore a malformed share link */ }
    }

    patternInput.addEventListener('input', () => trackEvent('tool_start', { tool: 'regex_tester' }), { once: true });

    render();
});
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runRegex, runReplace, generateCode, findRiskyConstruct,
        buildWorkerSource, createRegexMatcher, PATTERN_LIBRARY, CODE_GENERATORS
    };
}
