// Base64 Encoder/Decoder Tool
document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Encode to Base64
    encodeBtn.addEventListener('click', function() {
        try {
            const input = inputText.value;
            if (!input) {
                alert('Please enter text to encode');
                return;
            }
            const encoded = btoa(unescape(encodeURIComponent(input)));
            outputText.value = encoded;
            showNotification('Encoded to Base64 successfully');
        } catch (error) {
            outputText.value = 'Error: ' + error.message;
        }
    });

    // Decode from Base64
    decodeBtn.addEventListener('click', function() {
        try {
            const input = inputText.value;
            if (!input) {
                alert('Please enter Base64 text to decode');
                return;
            }
            const decoded = decodeURIComponent(escape(atob(input)));
            outputText.value = decoded;
            showNotification('Decoded from Base64 successfully');
        } catch (error) {
            outputText.value = 'Error: Invalid Base64 string - ' + error.message;
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
        element.setAttribute('download', 'base64_output.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showNotification('Downloaded!');
    });

    // Auto-encode on input (optional)
    inputText.addEventListener('input', function() {
        if (this.value && this.value.length < 1000) {
            // Optional: auto-update (commented out)
            // encodeBtn.click();
        }
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
