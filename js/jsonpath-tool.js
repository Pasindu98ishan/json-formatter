// JSONPath Tester Tool
// Evaluates with resultType:'all' so every match carries its path and JSON
// Pointer, which drives both the results table and source highlighting.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

var MAX_HIGHLIGHT_LINES = 4000;   // beyond this, skip highlighting for speed

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function pointerToken(token) {
    return String(token).replace(/~/g, '~0').replace(/\//g, '~1');
}

// Pretty-print JSON one line at a time, recording the JSON Pointer of the node
// each line opens. Matching those pointers against the query result is what
// lets the source view highlight exactly the matched nodes.
function buildJsonLines(value, pointer, keyLabel, depth, lines, isLast) {
    var pad = '  '.repeat(depth);
    var comma = isLast ? '' : ',';
    var label = keyLabel !== null ? '<span class="jp-key">' + escapeHtml(JSON.stringify(keyLabel)) + '</span>: ' : '';

    if (value !== null && typeof value === 'object') {
        var isArr = Array.isArray(value);
        var keys = isArr ? value.map(function (_, i) { return i; }) : Object.keys(value);

        if (keys.length === 0) {
            lines.push({ pointer: pointer, html: pad + label + (isArr ? '[]' : '{}') + comma });
            return;
        }

        lines.push({ pointer: pointer, html: pad + label + (isArr ? '[' : '{') });
        keys.forEach(function (k, i) {
            buildJsonLines(
                value[k],
                pointer + '/' + pointerToken(k),
                isArr ? null : k,
                depth + 1,
                lines,
                i === keys.length - 1
            );
        });
        lines.push({ pointer: null, html: pad + (isArr ? ']' : '}') + comma });
        return;
    }

    var rendered = JSON.stringify(value);
    var cls = value === null ? 'jp-null'
        : typeof value === 'number' ? 'jp-num'
        : typeof value === 'boolean' ? 'jp-bool' : 'jp-str';
    lines.push({
        pointer: pointer,
        html: pad + label + '<span class="' + cls + '">' + escapeHtml(rendered) + '</span>' + comma
    });
}

function renderSourceWithHighlights(data, matchedPointers) {
    var lines = [];
    buildJsonLines(data, '', null, 0, lines, true);

    if (lines.length > MAX_HIGHLIGHT_LINES) return null;

    var hits = {};
    (matchedPointers || []).forEach(function (p) { hits[p] = true; });

    return lines.map(function (l) {
        var isHit = l.pointer !== null && hits[l.pointer];
        return '<div class="jp-line' + (isHit ? ' jp-hit' : '') + '">' + l.html + '</div>';
    }).join('');
}

// JSONPath-Plus is lenient: a malformed expression like "$[" returns zero
// matches rather than throwing, which reads as "no results" when it is really
// a typo. Catch the obvious structural mistakes so the user gets a hint.
function validateExpression(path) {
    var pairs = { '[': ']', '(': ')' };
    var closers = { ']': '[', ')': '(' };
    var stack = [];
    var inString = null;

    for (var i = 0; i < path.length; i++) {
        var ch = path[i];
        if (inString) {
            if (ch === '\\') { i++; continue; }
            if (ch === inString) inString = null;
            continue;
        }
        if (ch === '"' || ch === "'") { inString = ch; continue; }
        if (pairs[ch]) stack.push(ch);
        else if (closers[ch]) {
            if (stack.pop() !== closers[ch]) {
                return 'Unbalanced "' + ch + '" in the expression.';
            }
        }
    }

    if (inString) return 'Unclosed ' + (inString === '"' ? 'double' : 'single') + ' quote in the expression.';
    if (stack.length) return 'Unclosed "' + stack[stack.length - 1] + '" in the expression.';
    if (path[0] !== '$' && path[0] !== '@') return 'Expressions normally start with $ (the document root).';
    return null;
}

// Evaluate and normalise into a shape the UI can render directly.
function evaluatePath(data, path) {
    if (typeof JSONPath === 'undefined') {
        return { error: 'The JSONPath library failed to load. Check your connection and reload.' };
    }
    var fn = typeof JSONPath.JSONPath === 'function' ? JSONPath.JSONPath : JSONPath;

    // Always computed: a malformed expression can also return a *wrong* result
    // rather than none — "$[" quietly evaluates as "$" — so the warning must
    // not depend on the match count.
    var hint = validateExpression(path);

    try {
        var all = fn({ path: path, json: data, resultType: 'all' });
        if (!all || all.length === 0) {
            return { error: null, matches: [], hint: hint };
        }
        return {
            error: null,
            hint: hint,
            matches: all.map(function (m) {
                return {
                    path: m.path,
                    pointer: m.pointer,
                    value: m.value,
                    parentProperty: m.parentProperty
                };
            })
        };
    } catch (e) {
        return { error: 'JSONPath error: ' + e.message, hint: hint };
    }
}

function formatResult(matches, mode) {
    if (mode === 'paths') {
        return matches.map(function (m) { return m.path; }).join('\n');
    }
    if (mode === 'pointers') {
        return matches.map(function (m) { return m.pointer; }).join('\n');
    }
    if (mode === 'entries') {
        var obj = {};
        matches.forEach(function (m) { obj[m.path] = m.value; });
        return JSON.stringify(obj, null, 2);
    }
    return JSON.stringify(matches.map(function (m) { return m.value; }), null, 2);
}

// Cheat-sheet entries double as click-to-run presets.
var PATH_PRESETS = [
    { expr: '$.store.book[*].author', label: 'All authors' },
    { expr: '$..author', label: 'Recursive descent' },
    { expr: '$..book[?(@.price<10)]', label: 'Filter by price' },
    { expr: '$..book[-1:]', label: 'Last element' },
    { expr: '$..book[0,1]', label: 'Union of indices' },
    { expr: '$..book[:2]', label: 'Slice' },
    { expr: '$..book[?(@.category=="fiction")]', label: 'Filter by field' },
    { expr: '$..price', label: 'Every price' },
    { expr: '$..*', label: 'Everything' }
];

var SAMPLE_JSON = JSON.stringify({
    store: {
        book: [
            { category: "reference", author: "Nigel Rees",       title: "Sayings of the Century", price: 8.95  },
            { category: "fiction",   author: "Evelyn Waugh",     title: "Sword of Honour",        price: 12.99 },
            { category: "fiction",   author: "Herman Melville",  title: "Moby Dick",              price: 8.99  },
            { category: "fiction",   author: "J. R. R. Tolkien", title: "The Lord of the Rings",  price: 22.99 }
        ],
        bicycle: { color: "red", price: 19.95 }
    }
}, null, 2);

// --- DOM wiring --------------------------------------------------------

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', function () {
    var jsonInput   = document.getElementById('jsonInput');
    if (!jsonInput) return;

    var pathInput   = document.getElementById('pathInput');
    var evaluateBtn = document.getElementById('evaluateBtn');
    var outputEl    = document.getElementById('output');
    var copyBtn     = document.getElementById('copyBtn');
    var clearBtn    = document.getElementById('clearBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var shareBtn    = document.getElementById('shareBtn');
    var errorEl     = document.getElementById('errorContainer');
    var matchBadge  = document.getElementById('matchBadge');
    var resultTable = document.getElementById('resultTable');
    var resultWrap  = document.getElementById('resultTableWrap');
    var sourceView  = document.getElementById('sourceView');
    var sourceWrap  = document.getElementById('sourceViewWrap');
    var outputMode  = document.getElementById('outputMode');
    var presetWrap  = document.getElementById('pathPresets');

    var lastResult = '';
    var lastMatches = [];

    jsonInput.value = SAMPLE_JSON;
    pathInput.value = '$.store.book[*].author';

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        outputEl.value = '';
        if (matchBadge) matchBadge.textContent = '';
        if (resultWrap) resultWrap.style.display = 'none';
        if (sourceWrap) sourceWrap.style.display = 'none';
        lastResult = '';
        lastMatches = [];
    }

    function clearError() {
        errorEl.style.display = 'none';
    }

    function renderTable(matches) {
        if (!resultTable || !resultWrap) return;
        if (!matches.length) { resultWrap.style.display = 'none'; return; }

        var rows = matches.slice(0, 500).map(function (m, i) {
            var val = typeof m.value === 'object' && m.value !== null
                ? JSON.stringify(m.value)
                : JSON.stringify(m.value);
            if (val && val.length > 160) val = val.slice(0, 160) + '…';
            return '<tr>' +
                '<td class="jp-idx">' + (i + 1) + '</td>' +
                '<td><code class="jp-path">' + escapeHtml(m.path) + '</code>' +
                '<button type="button" class="jp-copy-path" data-path="' + escapeHtml(m.path) + '" title="Copy this path">copy</button></td>' +
                '<td><code class="jp-pointer">' + escapeHtml(m.pointer) + '</code></td>' +
                '<td><code>' + escapeHtml(val) + '</code></td>' +
                '</tr>';
        }).join('');

        resultTable.innerHTML =
            '<thead><tr><th>#</th><th>Path</th><th>JSON Pointer</th><th>Value</th></tr></thead><tbody>' +
            rows + '</tbody>';
        resultWrap.style.display = 'block';

        resultTable.querySelectorAll('.jp-copy-path').forEach(function (btn) {
            btn.addEventListener('click', function () {
                copyToClipboard(btn.getAttribute('data-path')).then(function () {
                    showToast('Path copied!');
                });
            });
        });
    }

    function renderSource(data, matches) {
        if (!sourceView || !sourceWrap) return;
        var html = renderSourceWithHighlights(data, matches.map(function (m) { return m.pointer; }));
        if (html === null) {
            sourceWrap.style.display = 'none';
            return;
        }
        sourceView.innerHTML = html;
        sourceWrap.style.display = 'block';
    }

    function evaluate(track) {
        clearError();
        var jsonStr = jsonInput.value.trim();
        var path    = pathInput.value.trim();

        if (!jsonStr) { showError('Please enter JSON data.'); return; }
        if (!path)    { showError('Please enter a JSONPath expression.'); return; }

        var data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            showError('Invalid JSON: ' + e.message);
            return;
        }

        var result = evaluatePath(data, path);
        if (result.error) { showError(result.error); return; }

        lastMatches = result.matches;
        var count = result.matches.length;

        // A syntax warning is shown even when matches came back, because a
        // malformed expression can silently evaluate as something else.
        if (result.hint) {
            errorEl.textContent = '⚠️ ' + result.hint;
            errorEl.style.display = 'block';
        }

        if (count === 0) {
            outputEl.value = result.hint ? '(no matches — ' + result.hint + ')' : '(no matches)';
            if (matchBadge) matchBadge.textContent = '0 matches';
            lastResult = '';
            if (resultWrap) resultWrap.style.display = 'none';
            renderSource(data, []);
            return;
        }

        lastResult = formatResult(result.matches, outputMode ? outputMode.value : 'values');
        outputEl.value = lastResult;
        if (matchBadge) matchBadge.textContent = count + (count === 1 ? ' match' : ' matches');

        renderTable(result.matches);
        renderSource(data, result.matches);

        if (track) trackEvent('evaluate_jsonpath', { path: path, matches: count });
    }

    var liveEvaluate = typeof debounce === 'function' ? debounce(function () { evaluate(false); }, 250)
                                                     : function () { evaluate(false); };

    if (evaluateBtn) evaluateBtn.addEventListener('click', function () { evaluate(true); });
    jsonInput.addEventListener('input', liveEvaluate);
    pathInput.addEventListener('input', liveEvaluate);
    if (outputMode) outputMode.addEventListener('change', function () {
        if (lastMatches.length) {
            lastResult = formatResult(lastMatches, outputMode.value);
            outputEl.value = lastResult;
        }
    });

    [jsonInput, pathInput].forEach(function (el) {
        el.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                evaluate(true);
            }
        });
    });

    if (presetWrap) {
        PATH_PRESETS.forEach(function (p) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'jp-preset';
            btn.innerHTML = '<code>' + escapeHtml(p.expr) + '</code>';
            btn.title = p.label;
            btn.addEventListener('click', function () {
                pathInput.value = p.expr;
                evaluate(true);
                trackEvent('use_path_preset', { tool: 'jsonpath', preset: p.expr });
            });
            presetWrap.appendChild(btn);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            jsonInput.value = '';
            pathInput.value = '';
            outputEl.value  = '';
            if (matchBadge) matchBadge.textContent = '';
            if (resultWrap) resultWrap.style.display = 'none';
            if (sourceWrap) sourceWrap.style.display = 'none';
            clearError();
            lastResult = '';
            lastMatches = [];
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!lastResult) return;
            copyToClipboard(lastResult)
                .then(function () { showToast('Copied!'); })
                .catch(function () {});
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!lastResult) return;
            downloadFile(lastResult, 'jsonpath-result.json', 'application/json');
            showToast('Downloaded!');
            trackEvent('download_output', { tool: 'jsonpath' });
        });
    }

    // Deep link, so an example can be linked to from the blog and error pages.
    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            var state = { j: jsonInput.value, p: pathInput.value };
            var url = location.origin + location.pathname + '#q=' + encodeURIComponent(JSON.stringify(state));
            if (url.length > 8000) { showToast('JSON is too large to share by link'); return; }
            copyToClipboard(url).then(function () { showToast('Share link copied!'); });
            trackEvent('share_link', { tool: 'jsonpath' });
        });
    }

    if (location.hash.indexOf('#q=') === 0) {
        try {
            var state = JSON.parse(decodeURIComponent(location.hash.slice(3)));
            if (state && typeof state.j === 'string') jsonInput.value = state.j;
            if (state && typeof state.p === 'string') pathInput.value = state.p;
        } catch (e) { /* ignore a malformed link */ }
    }

    if (typeof initDragDrop === 'function') {
        initDragDrop('jsonInput', function (content) {
            jsonInput.value = content;
            evaluate(false);
        }, ['.json', '.txt']);
    }

    jsonInput.addEventListener('paste', function () {
        trackEvent('tool_start', { tool: 'jsonpath' });
    }, { once: true });

    evaluate(false);
});
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        evaluatePath, formatResult, buildJsonLines, renderSourceWithHighlights, validateExpression,
        pointerToken, PATH_PRESETS, SAMPLE_JSON
    };
}
