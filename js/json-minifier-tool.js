// JSON Minifier Tool Page
// Uses formatter.js for minification and beautification.

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputJSON = document.getElementById('outputJSON');
    const minifyBtn = document.getElementById('minifyBtn');
    const beautifyBtn = document.getElementById('beautifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const errorContainer = document.getElementById('errorContainer');

    function showMessage(message, success = false) {
        if (!errorContainer) return;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
        errorContainer.style.color = success ? '#155724' : '#721c24';
        errorContainer.style.borderColor = success ? '#c3e6cb' : '#f5c6cb';
        errorContainer.innerText = message;
        if (success) {
            setTimeout(() => {
                if (errorContainer) errorContainer.style.display = 'none';
            }, 3000);
        }
    }

    function resetStatus() {
        if (!errorContainer) return;
        errorContainer.style.display = 'none';
        errorContainer.innerText = '';
    }

    if (minifyBtn) {
        minifyBtn.addEventListener('click', function () {
            const value = inputJSON.value.trim();
            resetStatus();
            outputJSON.value = '';

            if (!value) {
                showMessage('Please enter JSON to minify.', false);
                return;
            }

            try {
                outputJSON.value = minifyJSON(value);
                showMessage('JSON minified successfully.', true);
            } catch (error) {
                showMessage(error.message, false);
            }
        });
    }

    if (beautifyBtn) {
        beautifyBtn.addEventListener('click', function () {
            const value = inputJSON.value.trim();
            resetStatus();
            outputJSON.value = '';

            if (!value) {
                showMessage('Please enter JSON to beautify.', false);
                return;
            }

            try {
                outputJSON.value = beautifyJSON(value, 2);
                showMessage('JSON beautified successfully.', true);
            } catch (error) {
                showMessage(error.message, false);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!outputJSON.value) {
                showMessage('Nothing to copy.', false);
                return;
            }
            copyToClipboard(outputJSON.value)
                .then(() => showMessage('Copied output to clipboard!', true))
                .catch(() => showMessage('Unable to copy output.', false));
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!outputJSON.value) {
                showMessage('Nothing to download.', false);
                return;
            }
            downloadFile(outputJSON.value, 'json-output.json', 'application/json');
            showMessage('Download started.', true);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            inputJSON.value = '';
            outputJSON.value = '';
            resetStatus();
            inputJSON.focus();
        });
    }
});
