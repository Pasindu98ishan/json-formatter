// UUID Generator Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    const generateBtn = document.getElementById('generateBtn');
    const generateBulkBtn = document.getElementById('generateBulkBtn');
    const bulkCount = document.getElementById('bulkCount');
    const bulkOutput = document.getElementById('output');
    const singleOutput = document.getElementById('singleOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const countBadge = document.getElementById('uuidCountBadge');

    let currentSingle = '';

    function setSingle(uuid) {
        currentSingle = uuid;
        if (singleOutput) singleOutput.textContent = uuid;
    }

    function renderBulk(uuids) {
        bulkOutput.innerHTML = uuids.map(u =>
            `<div class="uuid-list-item">${u}</div>`
        ).join('');
        bulkOutput.classList.add('has-content');
        if (copyAllBtn) copyAllBtn.style.display = '';
        if (countBadge) countBadge.textContent = uuids.length + ' UUIDs generated';
    }

    function getBulkText() {
        return Array.from(bulkOutput.querySelectorAll('.uuid-list-item'))
            .map(el => el.textContent).join('\n');
    }

    // Generate one on load
    setSingle(crypto.randomUUID());

    if (generateBtn) {
        generateBtn.addEventListener('click', function () {
            setSingle(crypto.randomUUID());
            trackEvent('generate_uuid', { count: 1 });
        });
    }

    if (generateBulkBtn) {
        generateBulkBtn.addEventListener('click', function () {
            const count = Math.min(parseInt(bulkCount.value) || 10, 100);
            renderBulk(Array.from({ length: count }, () => crypto.randomUUID()));
            trackEvent('generate_uuid', { count });
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!currentSingle) return;
            copyToClipboard(currentSingle)
                .then(() => showToast('Copied!'))
                .catch(() => {});
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', function () {
            const text = getBulkText();
            if (!text) return;
            copyToClipboard(text)
                .then(() => showToast('All UUIDs copied!'))
                .catch(() => {});
        });
    }
});
