// PX ↔ REM Converter Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    const baseInput     = document.getElementById('baseFontSize');
    const pxInput       = document.getElementById('pxInput');
    const remInput      = document.getElementById('remInput');
    const copyPxBtn     = document.getElementById('copyPxBtn');
    const copyRemBtn    = document.getElementById('copyRemBtn');

    const bulkInput     = document.getElementById('bulkInput');
    const bulkOutput    = document.getElementById('bulkOutput');
    const pxToRemBtn    = document.getElementById('pxToRemBtn');
    const remToPxBtn    = document.getElementById('remToPxBtn');
    const copyBulkBtn   = document.getElementById('copyBulkBtn');
    const clearBulkBtn  = document.getElementById('clearBulkBtn');

    const refBaseLabel  = document.getElementById('refBaseLabel');
    const refTableBody  = document.getElementById('refTableBody');

    // ── Base font size (persisted) ───────────────────────────────────────────
    function getBase() {
        const v = parseFloat(baseInput.value);
        return isFinite(v) && v > 0 ? v : 16;
    }

    function trim(n) {
        // Up to 4 decimals, strip trailing zeros, avoid scientific notation
        if (!isFinite(n)) return '';
        return parseFloat(n.toFixed(4)).toString();
    }

    function pxToRem(px, base) { return px / base; }
    function remToPx(rem, base) { return rem * base; }

    function syncFromPx() {
        const px = parseFloat(pxInput.value);
        if (!isFinite(px)) { remInput.value = ''; return; }
        remInput.value = trim(pxToRem(px, getBase()));
    }

    function syncFromRem() {
        const rem = parseFloat(remInput.value);
        if (!isFinite(rem)) { pxInput.value = ''; return; }
        pxInput.value = trim(remToPx(rem, getBase()));
    }

    // ── Reference table ──────────────────────────────────────────────────────
    const refValues = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 96];
    function renderReference() {
        const base = getBase();
        if (refBaseLabel) refBaseLabel.textContent = base;
        if (!refTableBody) return;
        refTableBody.innerHTML = refValues.map(px =>
            `<tr><td>${px}px</td><td>${trim(pxToRem(px, base))}rem</td></tr>`
        ).join('');
    }

    // ── Bulk conversion ──────────────────────────────────────────────────────
    // Replace numeric values (with optional decimals + sign) followed by unit.
    // Negative values, decimals, and zero are all handled.
    const PX_REGEX  = /(-?\d*\.?\d+)px\b/gi;
    const REM_REGEX = /(-?\d*\.?\d+)rem\b/gi;

    function convertPxToRemText(text, base) {
        return text.replace(PX_REGEX, (_m, num) => {
            const px = parseFloat(num);
            if (!isFinite(px)) return _m;
            // Preserve "0" → "0" (no unit needed in CSS, but keep with unit for safety)
            if (px === 0) return '0';
            return trim(pxToRem(px, base)) + 'rem';
        });
    }

    function convertRemToPxText(text, base) {
        return text.replace(REM_REGEX, (_m, num) => {
            const rem = parseFloat(num);
            if (!isFinite(rem)) return _m;
            if (rem === 0) return '0';
            return trim(remToPx(rem, base)) + 'px';
        });
    }

    function showError(msg) {
        const c = document.getElementById('errorContainer');
        if (!c) return;
        c.style.display = 'block';
        c.textContent = '⚠️ ' + msg;
        setTimeout(() => { c.style.display = 'none'; }, 3000);
    }

    // ── Wire it up ──────────────────────────────────────────────────────────
    if (baseInput) {
        const savedBase = localStorage.getItem('pxRemBase');
        if (savedBase && parseFloat(savedBase) > 0) baseInput.value = savedBase;

        baseInput.addEventListener('input', function () {
            const v = getBase();
            localStorage.setItem('pxRemBase', String(v));
            syncFromPx();          // re-derive rem from current px
            renderReference();
        });
    }

    if (pxInput)  pxInput.addEventListener('input', syncFromPx);
    if (remInput) remInput.addEventListener('input', syncFromRem);

    if (copyPxBtn) copyPxBtn.addEventListener('click', function () {
        const v = pxInput.value.trim();
        if (!v) return;
        copyToClipboard(v + 'px').then(() => showToast('Copied!')).catch(() => {});
    });

    if (copyRemBtn) copyRemBtn.addEventListener('click', function () {
        const v = remInput.value.trim();
        if (!v) return;
        copyToClipboard(v + 'rem').then(() => showToast('Copied!')).catch(() => {});
    });

    if (pxToRemBtn) pxToRemBtn.addEventListener('click', function () {
        const text = bulkInput.value;
        if (!text.trim()) { showError('Paste some CSS to convert.'); return; }
        bulkOutput.value = convertPxToRemText(text, getBase());
        trackEvent('convert_px_to_rem', { length: text.length });
    });

    if (remToPxBtn) remToPxBtn.addEventListener('click', function () {
        const text = bulkInput.value;
        if (!text.trim()) { showError('Paste some CSS to convert.'); return; }
        bulkOutput.value = convertRemToPxText(text, getBase());
        trackEvent('convert_rem_to_px', { length: text.length });
    });

    if (copyBulkBtn) copyBulkBtn.addEventListener('click', function () {
        if (!bulkOutput.value) return;
        copyToClipboard(bulkOutput.value).then(() => showToast('Copied!')).catch(() => {});
    });

    if (clearBulkBtn) clearBulkBtn.addEventListener('click', function () {
        bulkInput.value = '';
        bulkOutput.value = '';
        bulkInput.focus();
    });

    // Initial state — populate with sensible defaults
    if (pxInput && !pxInput.value) {
        pxInput.value = '24';
        syncFromPx();
    }
    renderReference();

    // Drag-drop a CSS file onto the bulk input
    if (typeof initDragDrop === 'function') {
        initDragDrop('bulkInput', function (content) {
            bulkInput.value = content;
            trackEvent('tool_start', { tool: 'px_to_rem' });
        }, ['.css', '.scss', '.txt']);
    }
});
