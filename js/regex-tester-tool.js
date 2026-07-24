// Regex Tester Tool — live match highlighting + capture groups, 100% client-side.
// Uses the browser's native RegExp engine.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Run a pattern against text and return { matches: [...], error: null } or { error: msg }.
// Exposed for testing.
function runRegex(pattern, flags, text) {
    let re;
    try {
        re = new RegExp(pattern, flags);
    } catch (e) {
        return { error: e.message, matches: [] };
    }
    const matches = [];
    if (pattern === '') return { error: null, matches };

    if (re.global || re.sticky) {
        let m;
        let guard = 0;
        while ((m = re.exec(text)) !== null) {
            matches.push(snapshot(m));
            if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width infinite loop
            if (++guard > 100000) break;
        }
    } else {
        const m = re.exec(text);
        if (m) matches.push(snapshot(m));
    }
    return { error: null, matches };
}

function snapshot(m) {
    return {
        match: m[0],
        index: m.index,
        groups: m.slice(1),
        named: m.groups ? { ...m.groups } : null
    };
}

if (typeof window !== 'undefined') {
    window.runRegex = runRegex;
}

document.addEventListener('DOMContentLoaded', function () {
    const patternInput = document.getElementById('patternInput');
    const testInput = document.getElementById('testInput');
    const highlight = document.getElementById('highlightOutput');
    const matchList = document.getElementById('matchList');
    const statusEl = document.getElementById('regexStatus');
    const flagBoxes = Array.from(document.querySelectorAll('.flag-box'));
    if (!patternInput) return;

    function getFlags() {
        return flagBoxes.filter(b => b.checked).map(b => b.value).join('');
    }

    function render() {
        const pattern = patternInput.value;
        const text = testInput.value;
        const flags = getFlags();
        const result = runRegex(pattern, flags, text);

        if (result.error) {
            statusEl.textContent = '✗ ' + result.error;
            statusEl.className = 'regex-status err';
            highlight.innerHTML = escapeHtml(text);
            matchList.innerHTML = '';
            patternInput.style.borderColor = '#dc3545';
            return;
        }
        patternInput.style.borderColor = '';

        // Build highlighted text.
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

        // Status + match list.
        const n = result.matches.length;
        statusEl.textContent = pattern === '' ? 'Enter a pattern to begin.'
            : n === 0 ? 'No matches.' : `✓ ${n} match${n === 1 ? '' : 'es'}`;
        statusEl.className = 'regex-status ' + (n > 0 ? 'ok' : 'muted');

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
    }

    patternInput.addEventListener('input', render);
    testInput.addEventListener('input', render);
    flagBoxes.forEach(b => b.addEventListener('change', render));

    const copyBtn = document.getElementById('copyRegexBtn');
    if (copyBtn) copyBtn.addEventListener('click', function () {
        const literal = '/' + patternInput.value + '/' + getFlags();
        copyToClipboard(literal).then(() => showToast('Copied ' + literal));
        trackEvent('copy_output', { tool: 'regex_tester' });
    });

    patternInput.addEventListener('input', () => trackEvent('tool_start', { tool: 'regex_tester' }), { once: true });

    render();
});
