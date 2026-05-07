// JSON Diff Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function diffJSON(left, right, path) {
    path = path || '';
    const results = [];

    if (typeof left !== typeof right || Array.isArray(left) !== Array.isArray(right)) {
        results.push({ path: path || '(root)', type: 'changed', left: left, right: right });
        return results;
    }

    if (typeof left !== 'object' || left === null) {
        if (left !== right) {
            results.push({ path: path || '(root)', type: 'changed', left: left, right: right });
        }
        return results;
    }

    if (left === null && right === null) return results;

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    const allKeys = Array.from(new Set([...leftKeys, ...rightKeys])).sort();

    allKeys.forEach(function (key) {
        const keyPath = path ? path + '.' + key : key;
        const inLeft = Object.prototype.hasOwnProperty.call(left, key);
        const inRight = Object.prototype.hasOwnProperty.call(right, key);

        if (!inLeft) {
            results.push({ path: keyPath, type: 'added', right: right[key] });
        } else if (!inRight) {
            results.push({ path: keyPath, type: 'removed', left: left[key] });
        } else if (typeof left[key] === 'object' && left[key] !== null &&
                   typeof right[key] === 'object' && right[key] !== null &&
                   Array.isArray(left[key]) === Array.isArray(right[key])) {
            const nested = diffJSON(left[key], right[key], keyPath);
            nested.forEach(function (r) { results.push(r); });
        } else if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) {
            results.push({ path: keyPath, type: 'changed', left: left[key], right: right[key] });
        }
    });

    return results;
}

function formatValue(val) {
    if (val === undefined) return '';
    return JSON.stringify(val, null, 2);
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderDiff(results) {
    if (results.length === 0) {
        return '<div class="diff-equal">✓ No differences found — the two JSON values are identical.</div>';
    }

    let html = '<table class="diff-table"><thead><tr><th>Path</th><th>Type</th><th>Left (A)</th><th>Right (B)</th></tr></thead><tbody>';
    results.forEach(function (r) {
        const rowClass = 'diff-row-' + r.type;
        const typeLabel = r.type === 'added' ? '+ Added' : r.type === 'removed' ? '− Removed' : '~ Changed';
        const leftVal = r.type === 'added' ? '<em style="color:var(--secondary-color)">—</em>' : '<pre class="diff-val">' + escapeHtml(formatValue(r.left)) + '</pre>';
        const rightVal = r.type === 'removed' ? '<em style="color:var(--secondary-color)">—</em>' : '<pre class="diff-val">' + escapeHtml(formatValue(r.right)) + '</pre>';
        html += '<tr class="' + rowClass + '"><td><code>' + escapeHtml(r.path) + '</code></td><td>' + typeLabel + '</td><td>' + leftVal + '</td><td>' + rightVal + '</td></tr>';
    });
    html += '</tbody></table>';

    const counts = { added: 0, removed: 0, changed: 0 };
    results.forEach(function (r) { counts[r.type]++; });
    const summary = '<div class="diff-summary">' +
        (counts.added ? '<span class="diff-badge diff-badge-added">+' + counts.added + ' added</span> ' : '') +
        (counts.removed ? '<span class="diff-badge diff-badge-removed">−' + counts.removed + ' removed</span> ' : '') +
        (counts.changed ? '<span class="diff-badge diff-badge-changed">~' + counts.changed + ' changed</span>' : '') +
        '</div>';

    return summary + html;
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = '⚠️ ' + msg; el.style.display = 'block'; }
}

function clearErrors() {
    ['errorA', 'errorB'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const swapBtn = document.getElementById('swapBtn');

    if (compareBtn) compareBtn.addEventListener('click', handleCompare);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (swapBtn) swapBtn.addEventListener('click', handleSwap);

    document.getElementById('outputSection').style.display = 'none';

    ['jsonA', 'jsonB'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('paste', () => trackEvent('tool_start', { tool: 'json_diff' }));
    });
});

function handleCompare() {
    clearErrors();
    const textA = document.getElementById('jsonA').value.trim();
    const textB = document.getElementById('jsonB').value.trim();

    let valid = true;
    let parsedA, parsedB;

    if (!textA) { showError('errorA', 'Paste JSON in the left panel (A).'); valid = false; }
    else {
        try { parsedA = JSON.parse(textA); }
        catch (e) { showError('errorA', 'Invalid JSON: ' + e.message); valid = false; }
    }

    if (!textB) { showError('errorB', 'Paste JSON in the right panel (B).'); valid = false; }
    else {
        try { parsedB = JSON.parse(textB); }
        catch (e) { showError('errorB', 'Invalid JSON: ' + e.message); valid = false; }
    }

    if (!valid) return;

    const results = diffJSON(parsedA, parsedB);
    document.getElementById('diffOutput').innerHTML = renderDiff(results);
    document.getElementById('outputSection').style.display = 'block';
    trackEvent('compare_json_diff', { differences: results.length });
}

function handleClear() {
    document.getElementById('jsonA').value = '';
    document.getElementById('jsonB').value = '';
    document.getElementById('outputSection').style.display = 'none';
    clearErrors();
}

function handleSwap() {
    const a = document.getElementById('jsonA');
    const b = document.getElementById('jsonB');
    const tmp = a.value;
    a.value = b.value;
    b.value = tmp;
}
