// URL Encoder/Decoder Tool
document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Encode URL
    encodeBtn.addEventListener('click', function() {
        try {
            const input = inputText.value;
            if (!input) {
                alert('Please enter text to encode');
                return;
            }
            const encoded = encodeURIComponent(input);
            outputText.value = encoded;
            showNotification('URL encoded successfully');
        } catch (error) {
            outputText.value = 'Error: ' + error.message;
        }
    });

    // Decode URL
    decodeBtn.addEventListener('click', function() {
        try {
            const input = inputText.value;
            if (!input) {
                alert('Please enter encoded text to decode');
                return;
            }
            const decoded = decodeURIComponent(input);
            outputText.value = decoded;
            showNotification('URL decoded successfully');
        } catch (error) {
            outputText.value = 'Error: Invalid URL encoding - ' + error.message;
        }
    });

    // Clear
    clearBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        inputText.focus();
    });

    // Copy Output
    copyBtn.addEventListener('click', function() {
        if (!outputText.value) {
            alert('Nothing to copy');
            return;
        }
        outputText.select();
        document.execCommand('copy');
        showNotification('Copied to clipboard!');
    });

    // Download Output
    downloadBtn.addEventListener('click', function() {
        if (!outputText.value) {
            alert('Nothing to download');
            return;
        }
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputText.value));
        element.setAttribute('download', 'url_output.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showNotification('Downloaded!');
    });

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-in-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
});
