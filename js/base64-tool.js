// Base64 Encoder/Decoder Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const errorContainer = document.getElementById('errorContainer');

    function showMessage(message, success = false) {
        if (!errorContainer) return;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
        errorContainer.style.color = success ? '#155724' : '#721c24';
        errorContainer.style.borderColor = success ? '#c3e6cb' : '#f5c6cb';
        errorContainer.innerText = message;
        if (success) {
            setTimeout(() => { errorContainer.style.display = 'none'; }, 3000);
        }
    }

    function resetStatus() {
        if (!errorContainer) return;
        errorContainer.style.display = 'none';
        errorContainer.innerText = '';
    }

    encodeBtn.addEventListener('click', function () {
        const input = inputText.value;
        if (!input) { showMessage('Please enter text to encode.'); return; }
        try {
            outputText.value = btoa(unescape(encodeURIComponent(input)));
            trackEvent('encode_base64');
            showMessage('Encoded to Base64 successfully.', true);
        } catch (error) {
            showMessage('Error: ' + error.message);
        }
    });

    decodeBtn.addEventListener('click', function () {
        const input = inputText.value.trim();
        if (!input) { showMessage('Please enter Base64 text to decode.'); return; }
        try {
            outputText.value = decodeURIComponent(escape(atob(input)));
            trackEvent('decode_base64');
            showMessage('Decoded from Base64 successfully.', true);
        } catch (error) {
            showMessage('Error: Invalid Base64 string.');
        }
    });

    copyBtn.addEventListener('click', function () {
        if (!outputText.value) { showMessage('Nothing to copy.'); return; }
        copyToClipboard(outputText.value)
            .then(() => { trackEvent('copy_output', { tool: 'base64' }); showMessage('Copied to clipboard!', true); })
            .catch(() => showMessage('Unable to copy to clipboard.'));
    });

    downloadBtn.addEventListener('click', function () {
        if (!outputText.value) { showMessage('Nothing to download.'); return; }
        downloadFile(outputText.value, 'base64_output.txt', 'text/plain');
        trackEvent('download_output', { tool: 'base64' });
        showMessage('Download started.', true);
    });

    clearBtn.addEventListener('click', function () {
        inputText.value = '';
        outputText.value = '';
        resetStatus();
        inputText.focus();
    });

    if (typeof initDragDrop === 'function') {
        initDragDrop('inputText', function (content) {
            inputText.value = content;
        }, ['.txt', '.json', '.csv', '.xml', '.html']);
    }
});
