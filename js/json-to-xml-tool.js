// JSON to XML Converter Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeTag(key) {
    // XML element names: start with letter or underscore, then letters/digits/_/-/.
    let safe = key.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    if (/^[^a-zA-Z_]/.test(safe)) safe = '_' + safe;
    return safe || '_';
}

function nodeToXml(data, tag, depth) {
    const pad = '  '.repeat(depth);

    if (Array.isArray(data)) {
        // Each array element becomes a repeated child with the same tag
        return data.map(item => nodeToXml(item, tag, depth)).join('\n');
    }

    if (typeof data === 'object' && data !== null) {
        const children = Object.entries(data)
            .map(([k, v]) => nodeToXml(v, sanitizeTag(k), depth + 1))
            .join('\n');
        return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
    }

    // Primitive (string, number, boolean, null)
    const text = data === null ? '' : escapeXml(String(data));
    return `${pad}<${tag}>${text}</${tag}>`;
}

function convertJsonToXml(jsonStr) {
    const data = JSON.parse(jsonStr);
    const header = '<?xml version="1.0" encoding="UTF-8"?>';

    if (Array.isArray(data)) {
        const items = data.map(item => nodeToXml(item, 'item', 1)).join('\n');
        return `${header}\n<root>\n${items}\n</root>`;
    }

    if (typeof data === 'object' && data !== null) {
        const children = Object.entries(data)
            .map(([k, v]) => nodeToXml(v, sanitizeTag(k), 1))
            .join('\n');
        return `${header}\n<root>\n${children}\n</root>`;
    }

    // Top-level primitive
    return `${header}\n<root>${escapeXml(String(data))}</root>`;
}

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputXML = document.getElementById('outputXML');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');

    function showNotification(message, type) {
        const bg = type === 'error' ? '#f8d7da' : '#d4edda';
        const color = type === 'error' ? '#721c24' : '#155724';
        const note = document.createElement('div');
        note.textContent = message;
        note.style.cssText = `position:fixed;top:20px;right:20px;background:${bg};color:${color};padding:12px 18px;border-radius:6px;z-index:10000;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15)`;
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    }

    if (inputJSON) {
        inputJSON.addEventListener('paste', () => {
            trackEvent('tool_start', { tool: 'json_to_xml' });
        });
    }

    if (convertBtn) {
        convertBtn.addEventListener('click', function () {
            const input = inputJSON.value.trim();
            if (!input) { showNotification('Please enter JSON to convert.', 'error'); return; }

            try {
                const xml = convertJsonToXml(input);
                outputXML.value = xml;
                trackEvent('convert_to_xml');
                showNotification('Converted to XML successfully.', 'success');
            } catch (e) {
                outputXML.value = '';
                showNotification('Invalid JSON: ' + e.message, 'error');
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!outputXML.value) { showNotification('Nothing to copy.', 'error'); return; }
            copyToClipboard(outputXML.value)
                .then(() => { trackEvent('copy_output', { tool: 'json_to_xml' }); showNotification('Copied to clipboard!', 'success'); })
                .catch(() => showNotification('Unable to copy.', 'error'));
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!outputXML.value) { showNotification('Nothing to download.', 'error'); return; }
            downloadFile(outputXML.value, 'output.xml', 'application/xml');
            trackEvent('download_output', { tool: 'json_to_xml' });
            showNotification('Download started.', 'success');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            inputJSON.value = '';
            outputXML.value = '';
            inputJSON.focus();
        });
    }

    initDragDrop('inputJSON', function (content) {
        inputJSON.value = content;
        trackEvent('tool_start', { tool: 'json_to_xml' });
    }, ['.json', '.txt']);
});
