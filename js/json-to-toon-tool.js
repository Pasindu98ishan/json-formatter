// JSON to TOON Converter Tool
// TOON = Token-Oriented Object Notation (emerging experimental serialization style)
// Spec implemented: 2-space indent, inline tabular arrays for uniform object arrays
// with scalar fields, dashed-list fallback for mixed/non-uniform arrays.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

const TOON_SPECIAL_CHARS = /[:,#\[\]{}"\n\t]/;
const TOON_LITERAL_LOOKALIKE = /^(null|true|false|-?\d+(\.\d+)?([eE][+-]?\d+)?)$/;

function needsQuoting(str) {
    if (str === '') return true;
    if (str !== str.trim()) return true;
    if (TOON_SPECIAL_CHARS.test(str)) return true;
    if (TOON_LITERAL_LOOKALIKE.test(str)) return true;
    return false;
}

function formatScalar(value) {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') {
        if (!isFinite(value)) return 'null';
        return JSON.stringify(value);
    }
    if (typeof value === 'string') {
        return needsQuoting(value) ? JSON.stringify(value) : value;
    }
    return JSON.stringify(value);
}

function isScalar(v) {
    return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

function isUniformObjectArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    let fields = null;
    for (const item of arr) {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) return null;
        const keys = Object.keys(item);
        if (fields === null) {
            fields = keys;
        } else {
            if (keys.length !== fields.length) return null;
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] !== fields[i]) return null;
            }
        }
        for (const k of fields) {
            if (!isScalar(item[k])) return null;
        }
    }
    return fields;
}

function formatInlineScalarArray(arr) {
    return '[' + arr.map(formatScalar).join(', ') + ']';
}

function formatTabularArray(arr, fields, depth, keyPrefix) {
    const pad = '  '.repeat(depth);
    const header = pad + (keyPrefix || '') + '[' + arr.length + ']{' + fields.join(',') + '}:';
    const rowPad = '  '.repeat(depth + 1);
    const rows = arr.map(item =>
        rowPad + fields.map(f => formatScalar(item[f])).join(',')
    );
    return [header].concat(rows).join('\n');
}

function formatDashedArray(arr, depth, seen) {
    const pad = '  '.repeat(depth);
    return arr.map(item => {
        if (isScalar(item)) {
            return pad + '- ' + formatScalar(item);
        }
        if (Array.isArray(item)) {
            if (seen.has(item)) throw new Error('Circular reference detected');
            seen.add(item);
            try {
                if (item.length === 0) return pad + '- []';
                if (item.every(isScalar)) return pad + '- ' + formatInlineScalarArray(item);
                const inner = formatDashedArray(item, depth + 1, seen);
                return pad + '-\n' + inner;
            } finally {
                seen.delete(item);
            }
        }
        if (seen.has(item)) throw new Error('Circular reference detected');
        seen.add(item);
        try {
            const entries = Object.entries(item);
            if (entries.length === 0) return pad + '- {}';
            const lines = [];
            entries.forEach(([k, v], idx) => {
                const linePad = idx === 0 ? pad + '- ' : pad + '  ';
                if (isScalar(v)) {
                    lines.push(linePad + k + ': ' + formatScalar(v));
                } else if (Array.isArray(v)) {
                    if (v.length === 0) {
                        lines.push(linePad + k + ': []');
                    } else if (v.every(isScalar)) {
                        lines.push(linePad + k + ': ' + formatInlineScalarArray(v));
                    } else {
                        const fields = isUniformObjectArray(v);
                        if (fields) {
                            lines.push(formatTabularArray(v, fields, depth + 1, k));
                        } else {
                            lines.push(linePad + k + ':');
                            lines.push(formatDashedArray(v, depth + 2, seen));
                        }
                    }
                } else {
                    if (Object.keys(v).length === 0) {
                        lines.push(linePad + k + ': {}');
                    } else {
                        lines.push(linePad + k + ':');
                        lines.push(formatObject(v, depth + 2, seen));
                    }
                }
            });
            return lines.join('\n');
        } finally {
            seen.delete(item);
        }
    }).join('\n');
}

function formatObject(obj, depth, seen) {
    if (seen.has(obj)) throw new Error('Circular reference detected');
    seen.add(obj);
    try {
        const pad = '  '.repeat(depth);
        const entries = Object.entries(obj);
        if (entries.length === 0) return pad + '{}';
        const lines = [];
        for (const [k, v] of entries) {
            if (isScalar(v)) {
                lines.push(pad + k + ': ' + formatScalar(v));
            } else if (Array.isArray(v)) {
                if (v.length === 0) {
                    lines.push(pad + k + ': []');
                    continue;
                }
                if (v.every(isScalar)) {
                    lines.push(pad + k + ': ' + formatInlineScalarArray(v));
                    continue;
                }
                const fields = isUniformObjectArray(v);
                if (fields) {
                    lines.push(formatTabularArray(v, fields, depth, k));
                    continue;
                }
                lines.push(pad + k + ':');
                lines.push(formatDashedArray(v, depth + 1, seen));
            } else {
                if (Object.keys(v).length === 0) {
                    lines.push(pad + k + ': {}');
                } else {
                    lines.push(pad + k + ':');
                    lines.push(formatObject(v, depth + 1, seen));
                }
            }
        }
        return lines.join('\n');
    } finally {
        seen.delete(obj);
    }
}

function formatTopLevelArray(arr, seen) {
    if (arr.length === 0) return '[]';
    if (arr.every(isScalar)) return formatInlineScalarArray(arr);
    const fields = isUniformObjectArray(arr);
    if (fields) return formatTabularArray(arr, fields, 0, '');
    return formatDashedArray(arr, 0, seen);
}

function convertJsonToToon(parsed) {
    const seen = new WeakSet();
    if (isScalar(parsed)) return formatScalar(parsed);
    if (Array.isArray(parsed)) return formatTopLevelArray(parsed, seen);
    return formatObject(parsed, 0, seen);
}

function estimateTokenReduction(charSavingsPct) {
    if (charSavingsPct < 10) return null;
    const center = Math.round((0.7 * charSavingsPct) / 5) * 5;
    const low = Math.max(0, center - 5);
    const high = Math.min(70, center + 5);
    return { low, high };
}

const EXAMPLES = [
    {
        "products": [
            { "sku": "A-100", "name": "Notebook", "price": 12.5, "in_stock": true },
            { "sku": "A-101", "name": "Pen",      "price": 1.99, "in_stock": true },
            { "sku": "A-102", "name": "Eraser",   "price": 0.75, "in_stock": false }
        ],
        "currency": "USD"
    },
    {
        "service": "api-gateway",
        "version": "2.4.1",
        "routes": { "users": "/v1/users", "orders": "/v1/orders" },
        "limits": { "rate_per_min": 600, "burst": 120 },
        "features": ["auth", "logging", "metrics"]
    }
];

document.addEventListener('DOMContentLoaded', function () {
    const inputJSON = document.getElementById('inputJSON');
    const outputTOON = document.getElementById('outputTOON');
    const convertBtn = document.getElementById('convertBtn');
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearBtn = document.getElementById('clearBtn');
    const savingsIndicator = document.getElementById('savingsIndicator');
    let exampleIndex = 0;

    function showNotification(message, type) {
        const bg = type === 'error' ? '#f8d7da' : '#d4edda';
        const color = type === 'error' ? '#721c24' : '#155724';
        const note = document.createElement('div');
        note.textContent = message;
        note.style.cssText = `position:fixed;top:20px;right:20px;background:${bg};color:${color};padding:12px 18px;border-radius:6px;z-index:10000;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15)`;
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    }

    function updateSavingsIndicator(jsonLen, toonLen) {
        if (!savingsIndicator) return;
        const saved = jsonLen - toonLen;
        const pct = jsonLen > 0 ? (saved / jsonLen) * 100 : 0;
        const pctRounded = Math.round(pct);

        let html = '';
        if (saved <= 0) {
            html = `<div><em>This payload is ${Math.abs(pctRounded)}% larger as TOON (${Math.abs(saved).toLocaleString()} chars extra). TOON shines on repetitive arrays of objects &mdash; small or highly nested payloads may not benefit.</em></div>`;
        } else {
            html = `<div><strong>Saved ${saved.toLocaleString()} chars (~${pctRounded}% smaller)</strong> vs minified JSON</div>`;
            const tokenRange = estimateTokenReduction(pct);
            if (tokenRange) {
                html += `<div>Estimated LLM token reduction: ~${tokenRange.low}&ndash;${tokenRange.high}% (varies by tokenizer)</div>`;
            }
        }
        html += `<div style="font-size:12px;font-style:italic;opacity:0.75;margin-top:4px;">Token counts depend on tokenizer (OpenAI BPE, Anthropic, Gemini, local). Run an actual tokenizer for exact numbers.</div>`;
        savingsIndicator.innerHTML = html;
        savingsIndicator.style.display = 'block';
    }

    function runConversion() {
        const input = inputJSON.value.trim();
        if (!input) {
            showNotification('Please enter JSON to convert.', 'error');
            return;
        }
        let parsed;
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            outputTOON.value = '';
            if (savingsIndicator) savingsIndicator.style.display = 'none';
            showNotification('Invalid JSON: ' + e.message, 'error');
            return;
        }
        try {
            const toon = convertJsonToToon(parsed);
            outputTOON.value = toon;
            const minifiedJsonLen = JSON.stringify(parsed).length;
            updateSavingsIndicator(minifiedJsonLen, toon.length);
            trackEvent('convert_to_toon', { input_len: input.length });
            showNotification('Converted to TOON successfully.', 'success');
        } catch (e) {
            outputTOON.value = '';
            if (savingsIndicator) savingsIndicator.style.display = 'none';
            showNotification('Conversion failed: ' + e.message, 'error');
        }
    }

    if (inputJSON) {
        inputJSON.addEventListener('paste', () => {
            trackEvent('tool_start', { tool: 'json_to_toon' });
        });
    }

    if (convertBtn) convertBtn.addEventListener('click', runConversion);

    if (loadExampleBtn) {
        loadExampleBtn.addEventListener('click', function () {
            const idx = exampleIndex % EXAMPLES.length;
            inputJSON.value = JSON.stringify(EXAMPLES[idx], null, 2);
            trackEvent('load_toon_example', { index: idx });
            exampleIndex++;
            runConversion();
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!outputTOON.value) { showNotification('Nothing to copy.', 'error'); return; }
            copyToClipboard(outputTOON.value)
                .then(() => { trackEvent('copy_output', { tool: 'json_to_toon' }); showNotification('Copied to clipboard!', 'success'); })
                .catch(() => showNotification('Unable to copy.', 'error'));
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!outputTOON.value) { showNotification('Nothing to download.', 'error'); return; }
            downloadFile(outputTOON.value, 'output.toon', 'text/plain');
            trackEvent('download_output', { tool: 'json_to_toon' });
            showNotification('Download started.', 'success');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            inputJSON.value = '';
            outputTOON.value = '';
            if (savingsIndicator) savingsIndicator.style.display = 'none';
            inputJSON.focus();
        });
    }

    initDragDrop('inputJSON', function (content) {
        inputJSON.value = content;
        trackEvent('tool_start', { tool: 'json_to_toon' });
    }, ['.json', '.txt']);
});
