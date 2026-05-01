// JSON Validator Tool Page
// Uses validator.js and utilities for clipboard operations.

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputText = document.getElementById('outputText');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
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

    if (validateBtn) {
        validateBtn.addEventListener('click', function () {
            const value = inputJSON.value.trim();
            resetStatus();
            outputText.value = '';

            if (!value) {
                showMessage('Please enter JSON data to validate.', false);
                return;
            }

            const result = validateJSONDetailed(value);
            if (result.valid) {
                outputText.value = result.message;
                showMessage(result.message, true);
            } else {
                const lineInfo = result.line ? ` at line ${result.line}` : '';
                outputText.value = `${result.message}${lineInfo}`;
                showMessage(result.message + lineInfo, false);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!outputText.value) {
                showMessage('Nothing to copy.', false);
                return;
            }
            copyToClipboard(outputText.value)
                .then(() => showMessage('Copied to clipboard!', true))
                .catch(() => showMessage('Unable to copy result to clipboard.', false));
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            inputJSON.value = '';
            outputText.value = '';
            resetStatus();
            inputJSON.focus();
        });
    }
});
