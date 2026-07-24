// JSON Minifier Tool Page
// Uses formatter.js for minification and beautification.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputJSON = document.getElementById('outputJSON');
    const minifyBtn = document.getElementById('minifyBtn');
    const beautifyBtn = document.getElementById('beautifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const errorContainer = document.getElementById('errorContainer');
    const minifyStats = document.getElementById('minifyStats');
    const statOriginal = document.getElementById('statOriginal');
    const statMinified = document.getElementById('statMinified');
    const statSaved = document.getElementById('statSaved');

    function byteLength(str) {
        return new Blob([str]).size;
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function updateStats(original, minified) {
        if (!minifyStats) return;
        const origBytes = byteLength(original);
        const minBytes = byteLength(minified);
        const saved = origBytes > 0 ? Math.max(0, (1 - minBytes / origBytes) * 100) : 0;
        statOriginal.textContent = formatBytes(origBytes);
        statMinified.textContent = formatBytes(minBytes);
        statSaved.textContent = saved.toFixed(1) + '%';
        minifyStats.style.display = 'flex';
    }

    function hideStats() {
        if (minifyStats) minifyStats.style.display = 'none';
    }

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

    function runMinify(value, silent) {
        resetStatus();
        outputJSON.value = '';
        hideStats();
        if (!value) {
            if (!silent) showMessage('Please enter JSON to minify.', false);
            return;
        }
        try {
            const minified = minifyJSON(value);
            outputJSON.value = minified;
            updateStats(value, minified);
            trackEvent('minify_json');
            if (!silent) showMessage('JSON minified successfully.', true);
        } catch (error) {
            if (!silent) showMessage(error.message, false);
        }
    }

    if (minifyBtn) {
        minifyBtn.addEventListener('click', function () {
            runMinify(inputJSON.value.trim(), false);
        });
    }

    // Auto-minify as the user types or pastes (silent — no error toast on partial input).
    if (inputJSON) {
        const autoMinify = debounce(function () {
            runMinify(inputJSON.value.trim(), true);
        }, 300);
        inputJSON.addEventListener('input', autoMinify);
    }

    if (beautifyBtn) {
        beautifyBtn.addEventListener('click', function () {
            const value = inputJSON.value.trim();
            resetStatus();
            outputJSON.value = '';
            hideStats();

            if (!value) {
                showMessage('Please enter JSON to beautify.', false);
                return;
            }

            try {
                outputJSON.value = beautifyJSON(value, 2);
                trackEvent('beautify_json');
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
                .then(() => { showToast('Copied!'); trackEvent('copy_output', { tool: 'minifier' }); })
                .catch(() => showMessage('Unable to copy output.', false));
        });
    }

    if (inputJSON) {
        inputJSON.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (minifyBtn) minifyBtn.click();
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!outputJSON.value) {
                showMessage('Nothing to download.', false);
                return;
            }
            downloadFile(outputJSON.value, 'json-output.json', 'application/json');
            trackEvent('download_output', { tool: 'minifier' });
            showMessage('Download started.', true);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            inputJSON.value = '';
            outputJSON.value = '';
            resetStatus();
            hideStats();
            inputJSON.focus();
        });
    }

    if (inputJSON) {
        inputJSON.addEventListener('paste', () => trackEvent('tool_start', { tool: 'json_minifier' }));
    }

    initDragDrop('inputJSON', function(content) {
        inputJSON.value = content;
        trackEvent('tool_start', { tool: 'json_minifier' });
    }, ['.json', '.txt']);
});
