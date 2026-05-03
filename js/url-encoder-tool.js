// URL Encoder/Decoder Tool

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

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        const bgColor = type === 'error' ? '#f44336' : '#4CAF50';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-in-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    encodeBtn.addEventListener('click', function () {
        const input = inputText.value;
        if (!input) { showNotification('Please enter text to encode.', 'error'); return; }
        try {
            outputText.value = encodeURIComponent(input);
            trackEvent('encode_url');
            showNotification('URL encoded successfully.');
        } catch (error) {
            outputText.value = 'Error: ' + error.message;
            showNotification('Encoding failed.', 'error');
        }
    });

    decodeBtn.addEventListener('click', function () {
        const input = inputText.value;
        if (!input) { showNotification('Please enter encoded text to decode.', 'error'); return; }
        try {
            outputText.value = decodeURIComponent(input);
            trackEvent('decode_url');
            showNotification('URL decoded successfully.');
        } catch (error) {
            outputText.value = 'Error: Invalid URL encoding.';
            showNotification('Decoding failed.', 'error');
        }
    });

    copyBtn.addEventListener('click', function () {
        if (!outputText.value) { showNotification('Nothing to copy.', 'error'); return; }
        if (typeof copyToClipboard === 'function') {
            copyToClipboard(outputText.value)
                .then(() => { trackEvent('copy_output', { tool: 'url-encoder' }); showNotification('Copied to clipboard!'); })
                .catch(() => showNotification('Unable to copy to clipboard.', 'error'));
        } else {
            outputText.select();
            document.execCommand('copy');
            trackEvent('copy_output', { tool: 'url-encoder' });
            showNotification('Copied to clipboard!');
        }
    });

    downloadBtn.addEventListener('click', function () {
        if (!outputText.value) { showNotification('Nothing to download.', 'error'); return; }
        if (typeof downloadFile === 'function') {
            downloadFile(outputText.value, 'url_output.txt', 'text/plain');
        } else {
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputText.value));
            element.setAttribute('download', 'url_output.txt');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
        trackEvent('download_output', { tool: 'url-encoder' });
        showNotification('Download started.');
    });

    clearBtn.addEventListener('click', function () {
        inputText.value = '';
        outputText.value = '';
        inputText.focus();
    });

    if (typeof initDragDrop === 'function') {
        initDragDrop('inputText', function (content) {
            inputText.value = content;
        }, ['.txt', '.json', '.csv', '.xml', '.html']);
    }
});
