// Hash Generator Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

async function hashWithSubtle(algorithm, text) {
    const data = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest(algorithm, data);
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', function () {
    const inputText = document.getElementById('inputText');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const hashBtn = document.getElementById('hashBtn');
    const output = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');
    const errorContainer = document.getElementById('errorContainer');

    function showErr(msg) {
        if (!errorContainer) return;
        errorContainer.textContent = '⚠️ ' + msg;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.color = '#721c24';
        errorContainer.style.borderColor = '#f5c6cb';
    }

    function clearErr() {
        if (errorContainer) errorContainer.style.display = 'none';
    }

    async function computeHash() {
        const text = inputText.value;
        const algorithm = algorithmSelect.value;
        clearErr();
        output.value = '';

        if (!text) { showErr('Enter text to hash.'); return; }

        try {
            let hash;
            if (algorithm === 'MD5') {
                if (typeof md5 === 'undefined') {
                    showErr('MD5 library not loaded. Please refresh and try again.');
                    return;
                }
                hash = md5(text);
            } else {
                hash = await hashWithSubtle(algorithm, text);
            }
            output.value = hash;
            trackEvent('generate_hash', { algorithm });
        } catch (e) {
            showErr('Hash generation failed: ' + e.message);
        }
    }

    if (hashBtn) hashBtn.addEventListener('click', computeHash);

    if (inputText) {
        inputText.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                computeHash();
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!output.value) return;
            copyToClipboard(output.value)
                .then(() => showToast('Copied!'))
                .catch(() => {});
        });
    }
});
