// Base64 Encoder/Decoder Tool
// Text + file/image encoding, URL-safe (Base64URL) mode, stats, and robust decoding.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

// ========== PURE HELPERS ==========

// Convert bytes -> Base64. Chunked so large files don't blow the call stack.
function bytesToBase64(bytes, urlsafe) {
    let binary = '';
    const chunk = 0x8000; // 32 KB per String.fromCharCode call
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    const b64 = btoa(binary);
    return urlsafe ? toUrlSafe(b64) : b64;
}

// Convert a standard Base64 string -> Uint8Array.
function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

// Standard -> URL-safe alphabet, drop padding.
function toUrlSafe(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// URL-safe -> standard alphabet, re-pad to a multiple of 4.
function fromUrlSafe(b64) {
    let s = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad === 2) s += '==';
    else if (pad === 3) s += '=';
    else if (pad === 1) s = s.slice(0, -1); // stray char — best-effort trim
    return s;
}

// Robust-decode core: accepts data URIs, whitespace, URL-safe chars, missing padding.
// Returns { mime, data } where data is a clean standard-Base64 string.
function normalizeBase64(input) {
    let str = input.trim();
    let mime = '';

    const dataUri = str.match(/^data:([^;,]*)(;[^,]*)?,(.*)$/is);
    if (dataUri) {
        mime = (dataUri[1] || '').trim();
        str = dataUri[3];
        // A non-base64 data URI (percent-encoded text) — decode differently.
        if (!/;base64/i.test(dataUri[2] || '')) {
            return { mime, data: null, text: decodeURIComponent(str) };
        }
    }

    str = str.replace(/\s+/g, '');          // strip spaces/newlines
    str = fromUrlSafe(str);                  // normalize alphabet + padding
    return { mime, data: str, text: null };
}

function mimeToExt(mime) {
    const map = {
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
        'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg',
        'image/bmp': 'bmp', 'image/x-icon': 'ico', 'image/avif': 'avif',
        'application/pdf': 'pdf', 'application/zip': 'zip',
        'application/json': 'json', 'text/plain': 'txt',
        'text/html': 'html', 'text/csv': 'csv', 'application/xml': 'xml'
    };
    return map[(mime || '').toLowerCase()] || 'bin';
}

function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(2) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

// Heuristic: do these bytes look like binary (vs UTF-8 text)?
function looksBinary(bytes) {
    const len = Math.min(bytes.length, 1024);
    if (len === 0) return false;
    let suspicious = 0;
    for (let i = 0; i < len; i++) {
        const b = bytes[i];
        if (b === 0) return true;                         // NUL => binary
        // control chars other than tab/newline/carriage-return/form-feed/esc
        if (b < 32 && b !== 9 && b !== 10 && b !== 13 && b !== 12 && b !== 27) suspicious++;
    }
    return suspicious / len > 0.1;
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
    const fileInput = document.getElementById('fileInput');
    const asDataUri = document.getElementById('asDataUri');
    const statsBar = document.getElementById('statsBar');
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    const downloadDecodedBtn = document.getElementById('downloadDecodedBtn');

    // Holds the most recent decoded binary result for the "Download decoded file" button.
    let decodedBlob = null;
    let decodedName = 'decoded.bin';

    function urlsafeSelected() {
        const el = document.querySelector('input[name="b64alphabet"]:checked');
        return el ? el.value === 'urlsafe' : false;
    }

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
        if (errorContainer) { errorContainer.style.display = 'none'; errorContainer.innerText = ''; }
    }

    function hidePreview() {
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.removeAttribute('src');
        decodedBlob = null;
    }

    function showStats(parts) {
        if (!statsBar) return;
        statsBar.style.display = 'block';
        statsBar.innerHTML = parts.filter(Boolean).join('<span class="b64-dot">&middot;</span>');
    }

    function encodeStats(inBytes, outStr, urlsafe) {
        const outBytes = outStr.length; // Base64 output is ASCII: 1 char = 1 byte
        const delta = inBytes > 0 ? Math.round((outBytes / inBytes - 1) * 100) : 0;
        const padding = (outStr.match(/=+$/) || [''])[0].length;
        return showStats([
            'input: <strong>' + formatBytes(inBytes) + '</strong>',
            'output: <strong>' + formatBytes(outBytes) + '</strong>',
            'size ' + (delta >= 0 ? '+' : '') + delta + '%',
            urlsafe ? 'URL-safe (no padding)' : 'padding: ' + (padding ? '='.repeat(padding) : 'none')
        ]);
    }

    // ---------- ENCODE (text) ----------
    encodeBtn.addEventListener('click', function () {
        const input = inputText.value;
        if (!input) { showMessage('Please enter text to encode.'); return; }
        try {
            const urlsafe = urlsafeSelected();
            const bytes = new TextEncoder().encode(input); // UTF-8
            outputText.value = bytesToBase64(bytes, urlsafe);
            hidePreview();
            encodeStats(bytes.length, outputText.value, urlsafe);
            trackEvent('encode_base64', { urlsafe: urlsafe });
            showMessage('Encoded to Base64 successfully.', true);
        } catch (error) {
            showMessage('Error: ' + error.message);
        }
    });

    // ---------- DECODE ----------
    decodeBtn.addEventListener('click', function () {
        const raw = inputText.value;
        if (!raw.trim()) { showMessage('Please enter Base64 text to decode.'); return; }
        try {
            const norm = normalizeBase64(raw);

            // Non-base64 data URI (percent-encoded text)
            if (norm.data === null && norm.text !== null) {
                outputText.value = norm.text;
                hidePreview();
                showStats(['decoded from data URI (text)']);
                trackEvent('decode_base64');
                showMessage('Decoded successfully.', true);
                return;
            }

            const bytes = base64ToBytes(norm.data);
            const isBinary = (norm.mime && !/^text\/|json|xml|javascript/i.test(norm.mime)) || looksBinary(bytes);

            if (isBinary) {
                const mime = norm.mime || 'application/octet-stream';
                const ext = mimeToExt(mime);
                decodedBlob = new Blob([bytes], { type: mime });
                decodedName = 'decoded.' + ext;
                outputText.value = '[binary data — ' + formatBytes(bytes.length) +
                    (norm.mime ? ', ' + norm.mime : '') + ']\nUse "Download decoded file" below.';

                if (previewContainer && previewImg && /^image\//i.test(mime)) {
                    previewImg.src = URL.createObjectURL(decodedBlob);
                    previewContainer.style.display = 'block';
                } else {
                    if (previewImg) previewImg.removeAttribute('src');
                    if (previewContainer) previewContainer.style.display = 'block';
                }
                showStats([
                    'decoded: <strong>' + formatBytes(bytes.length) + '</strong>',
                    norm.mime ? 'type: ' + norm.mime : 'binary'
                ]);
                trackEvent('decode_base64_to_file', { mime: norm.mime || '' });
                showMessage('Decoded to a file. Download or preview below.', true);
                return;
            }

            // Text
            const text = new TextDecoder('utf-8').decode(bytes);
            outputText.value = text;
            hidePreview();
            showStats([
                'input: <strong>' + formatBytes(norm.data.replace(/=+$/, '').length) + '</strong>',
                'output: <strong>' + formatBytes(bytes.length) + '</strong>'
            ]);
            trackEvent('decode_base64');
            showMessage('Decoded from Base64 successfully.', true);
        } catch (error) {
            showMessage('Error: Invalid Base64 string.');
        }
    });

    // ---------- ENCODE (file) ----------
    function encodeFile(file) {
        const urlsafe = urlsafeSelected();
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const bytes = new Uint8Array(ev.target.result);
                let out = bytesToBase64(bytes, urlsafe);
                if (asDataUri && asDataUri.checked) {
                    const mime = file.type || 'application/octet-stream';
                    out = 'data:' + mime + ';base64,' + out;
                }
                outputText.value = out;
                inputText.value = '[file: ' + file.name + ', ' + formatBytes(file.size) + ']';
                hidePreview();
                encodeStats(file.size, urlsafe ? out.replace(/^data:[^,]*,/, '') : out.replace(/^data:[^,]*,/, ''), urlsafe);
                trackEvent('encode_file_base64', { mime: file.type || '', urlsafe: urlsafe });
                showMessage('Encoded ' + file.name + ' to Base64.', true);
            } catch (error) {
                showMessage('Error encoding file: ' + error.message);
            }
        };
        reader.onerror = function () { showMessage('Could not read the file.'); };
        reader.readAsArrayBuffer(file);
    }

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = fileInput.files && fileInput.files[0];
            if (file) encodeFile(file);
            fileInput.value = ''; // allow re-picking the same file
        });
    }

    // ---------- COPY / DOWNLOAD / CLEAR ----------
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

    if (downloadDecodedBtn) {
        downloadDecodedBtn.addEventListener('click', function () {
            if (!decodedBlob) { showMessage('No decoded file available.'); return; }
            const url = URL.createObjectURL(decodedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = decodedName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            trackEvent('download_decoded_file', { tool: 'base64' });
            showMessage('Download started.', true);
        });
    }

    clearBtn.addEventListener('click', function () {
        inputText.value = '';
        outputText.value = '';
        if (statsBar) statsBar.style.display = 'none';
        hidePreview();
        resetStatus();
        inputText.focus();
    });

    // ---------- DRAG & DROP ----------
    // Route binary files (images, PDFs, etc.) to the file-encode path; text files fill the input.
    const dropEl = inputText;
    if (dropEl) {
        dropEl.addEventListener('dragover', function (e) { e.preventDefault(); dropEl.classList.add('drag-over'); });
        dropEl.addEventListener('dragleave', function (e) { if (!dropEl.contains(e.relatedTarget)) dropEl.classList.remove('drag-over'); });
        dropEl.addEventListener('drop', function (e) {
            e.preventDefault();
            dropEl.classList.remove('drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!file) return;
            const textLike = /^(text\/|application\/(json|xml|javascript))/i.test(file.type) ||
                /\.(txt|json|csv|xml|html|md|yml|yaml)$/i.test(file.name);
            if (textLike) {
                const reader = new FileReader();
                reader.onload = function (ev) { inputText.value = ev.target.result; };
                reader.readAsText(file);
            } else {
                encodeFile(file); // image/pdf/binary -> encode
            }
        });
    }
});
