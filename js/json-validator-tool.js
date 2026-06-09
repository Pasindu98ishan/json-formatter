// JSON Validator Tool Page
// Uses validator.js and utilities for clipboard operations.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputText = document.getElementById('outputText');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const errorContainer = document.getElementById('errorContainer');

    function showMessage(message, success = false, hint = '', raw = '') {
        if (!errorContainer) return;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
        errorContainer.style.color = success ? '#155724' : '#721c24';
        errorContainer.style.borderColor = success ? '#c3e6cb' : '#f5c6cb';

        let html = (success ? '✓ ' : '⚠️ ') + escapeHtml(message);
        if (hint) {
            html += `<div style="margin-top:6px;font-size:0.9em;opacity:0.9;font-weight:400;">${escapeHtml(hint)}</div>`;
        }
        if (raw && raw !== message) {
            html += `<details style="margin-top:6px;font-size:0.8em;opacity:0.7;"><summary style="cursor:pointer;">Technical details</summary><code style="display:block;margin-top:4px;font-family:monospace;">${escapeHtml(raw)}</code></details>`;
        }
        errorContainer.innerHTML = html;

        if (success) {
            setTimeout(() => {
                if (errorContainer) errorContainer.style.display = 'none';
            }, 3000);
        }
    }

    function resetStatus() {
        if (!errorContainer) return;
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }

    // Core validation, callable from the button or the auto-validate listener.
    // When called automatically (opts.auto), an empty input is a no-op rather
    // than showing the "please enter JSON" prompt.
    function runValidate(opts) {
        opts = opts || {};
        const value = inputJSON.value.trim();
        resetStatus();
        outputText.value = '';

        if (!value) {
            if (!opts.auto) showMessage('Please enter JSON data to validate.', false);
            return;
        }

        try {
            JSON.parse(value);
            // Valid — build a useful summary for the output pane
            const stats = (typeof getJSONStats === 'function') ? getJSONStats(value) : null;
            const lines = ['✓ Valid JSON — no errors found.'];
            if (stats) {
                lines.push('');
                lines.push(`Keys:    ${stats.keys}`);
                lines.push(`Objects: ${stats.objects}`);
                lines.push(`Arrays:  ${stats.arrays}`);
                lines.push(`Depth:   ${stats.depth}`);
                if (stats.size) lines.push(`Size:    ${stats.size}`);
            }
            outputText.value = lines.join('\n');
            showMessage('Valid JSON! No errors found.', true);
            trackEvent('validate_json', { result: 'valid', auto: !!opts.auto });
        } catch (e) {
            // Route through the same normalizer the formatter uses
            const norm = (typeof normalizeJSONError === 'function')
                ? normalizeJSONError(value, e.message)
                : { title: e.message, hint: '', line: 0, column: 0, rawMessage: e.message };

            const lines = ['✗ Invalid JSON', '', norm.title];
            if (norm.hint) {
                lines.push('');
                lines.push('→ ' + norm.hint);
            }
            if (norm.line) {
                lines.push('');
                lines.push(`Location: line ${norm.line}, column ${norm.column}`);
            }
            if (norm.rawMessage && norm.rawMessage !== norm.title) {
                lines.push('');
                lines.push('Technical: ' + norm.rawMessage);
            }
            outputText.value = lines.join('\n');
            showMessage(norm.title, false, norm.hint, norm.rawMessage);
            trackEvent('validate_json', { result: 'invalid', auto: !!opts.auto });
        }
    }

    if (validateBtn) {
        validateBtn.addEventListener('click', function () { runValidate(); });
    }

    // ── Auto-validate (default on; persisted) ─────────────────────────────────
    function isAutoValidateOn() {
        return localStorage.getItem('validator_auto_validate') !== 'false';
    }
    if (inputJSON) {
        const debouncedAutoValidate = debounce(function () {
            if (isAutoValidateOn()) runValidate({ auto: true });
        }, 500);
        inputJSON.addEventListener('input', debouncedAutoValidate);
    }
    const autoValidateToggle = document.getElementById('autoValidateToggle');
    if (autoValidateToggle) {
        autoValidateToggle.checked = isAutoValidateOn();
        autoValidateToggle.addEventListener('change', function () {
            localStorage.setItem('validator_auto_validate', autoValidateToggle.checked ? 'true' : 'false');
            if (autoValidateToggle.checked) runValidate({ auto: true });
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!outputText.value) {
                showMessage('Nothing to copy.', false);
                return;
            }
            copyToClipboard(outputText.value)
                .then(() => { showToast('Copied!'); trackEvent('copy_output', { tool: 'validator' }); })
                .catch(() => showMessage('Unable to copy result to clipboard.', false));
        });
    }

    if (inputJSON) {
        inputJSON.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (validateBtn) validateBtn.click();
            }
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

    if (inputJSON) {
        inputJSON.addEventListener('paste', () => trackEvent('tool_start', { tool: 'json_validator' }));
    }

    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', () => window.cmUndo?.());
    if (redoBtn) redoBtn.addEventListener('click', () => window.cmRedo?.());

    const jsonFileInput = document.getElementById('jsonFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn && jsonFileInput) {
        uploadBtn.addEventListener('click', () => jsonFileInput.click());
    }
    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                inputJSON.value = evt.target.result;
                outputText.value = '';
                resetStatus();
                trackEvent('upload_json', { tool: 'validator' });
            };
            reader.onerror = function() { showMessage('Error reading file.', false); };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    initDragDrop('inputJSON', function(content) {
        inputJSON.value = content;
        trackEvent('tool_start', { tool: 'json_validator' });
        inputJSON.dispatchEvent(new Event('input'));
    }, ['.json', '.txt']);
});
