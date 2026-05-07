function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function xmlNodeToObj(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue.trim() || null;
    }
    if (node.nodeType === Node.CDATA_SECTION_NODE) {
        return node.nodeValue;
    }

    const obj = {};

    if (node.attributes && node.attributes.length > 0) {
        obj['@attributes'] = {};
        for (const attr of node.attributes) {
            obj['@attributes'][attr.name] = attr.value;
        }
    }

    for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.nodeValue.trim();
            if (text) obj['#text'] = text;
        } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
            obj['#text'] = child.nodeValue;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childObj = xmlNodeToObj(child);
            const tag = child.tagName;
            if (obj[tag] !== undefined) {
                if (!Array.isArray(obj[tag])) obj[tag] = [obj[tag]];
                obj[tag].push(childObj);
            } else {
                obj[tag] = childObj;
            }
        }
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    if (keys.length === 1 && keys[0] === '#text') return obj['#text'];
    return obj;
}

function convertXmlToJson(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr.trim(), 'text/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error(err.textContent.trim().split('\n')[0]);
    const root = doc.documentElement;
    const result = {};
    result[root.tagName] = xmlNodeToObj(root);
    return result;
}

document.addEventListener('DOMContentLoaded', function () {
    const inputXML = document.getElementById('inputXML');
    const outputJSON = document.getElementById('outputJSON');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    inputXML.addEventListener('paste', function () {
        trackEvent('tool_start', { tool: 'xml_to_json' });
    });

    convertBtn.addEventListener('click', function () {
        const input = inputXML.value.trim();
        if (!input) { alert('Please enter XML data'); return; }
        try {
            const data = convertXmlToJson(input);
            outputJSON.value = JSON.stringify(data, null, 2);
            trackEvent('convert_xml_to_json');
            showNotification('Converted to JSON successfully');
        } catch (error) {
            outputJSON.value = 'Error: ' + error.message;
            showNotification('Conversion failed', 'error');
        }
    });

    initDragDrop('inputXML', function (content) {
        inputXML.value = content;
        trackEvent('tool_start', { tool: 'xml_to_json' });
    }, ['.xml', '.txt']);

    clearBtn.addEventListener('click', function () {
        inputXML.value = '';
        outputJSON.value = '';
        inputXML.focus();
    });

    copyBtn.addEventListener('click', function () {
        if (!outputJSON.value) { alert('Nothing to copy'); return; }
        outputJSON.select();
        document.execCommand('copy');
        trackEvent('copy_output', { tool: 'xml_to_json' });
        showNotification('Copied to clipboard!');
    });

    downloadBtn.addEventListener('click', function () {
        if (!outputJSON.value) { alert('Nothing to download'); return; }
        const el = document.createElement('a');
        el.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(outputJSON.value));
        el.setAttribute('download', 'data.json');
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
        trackEvent('download_output', { tool: 'xml_to_json' });
        showNotification('Downloaded!');
    });

    function showNotification(message, type = 'success') {
        const n = document.createElement('div');
        n.textContent = message;
        n.style.cssText = `position:fixed;top:20px;right:20px;background:${type === 'error' ? '#f44336' : '#4CAF50'};color:white;padding:15px 20px;border-radius:4px;z-index:10000;`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }
});
