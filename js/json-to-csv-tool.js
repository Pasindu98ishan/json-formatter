// JSON to CSV Tool
// Configurable delimiter, Excel-compatible BOM/CRLF output, array handling
// strategies and column selection.

function trackEvent(action, params) {
    if (typeof gtag === 'function') gtag('event', action, params || {});
}

var CSV_DEFAULTS = {
    delimiter: ',',
    flattenSeparator: '.',
    arrayMode: 'join',      // 'join' | 'columns' | 'rows'
    arrayJoiner: ' | ',
    lineEnding: '\n',       // '\n' | '\r\n'
    addBom: false,
    includeHeader: true,
    columns: null           // null = all detected columns, else an ordered subset
};

// Flatten nested objects into dotted keys. Arrays are handled by the caller's
// chosen strategy, so they are left in place here.
function flattenObject(obj, prefix, separator) {
    var result = {};
    prefix = prefix || '';
    separator = separator || '.';
    Object.keys(obj).forEach(function (key) {
        var fullKey = prefix ? prefix + separator + key : key;
        var val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, fullKey, separator));
        } else {
            result[fullKey] = val;
        }
    });
    return result;
}

// Expand a row's arrays according to the chosen strategy. Returns an array of
// rows, because 'rows' mode can turn one record into several.
function applyArrayStrategy(flatRow, opts) {
    var arrayKeys = Object.keys(flatRow).filter(function (k) { return Array.isArray(flatRow[k]); });
    if (arrayKeys.length === 0) return [flatRow];

    if (opts.arrayMode === 'columns') {
        var expanded = {};
        Object.keys(flatRow).forEach(function (k) {
            var v = flatRow[k];
            if (!Array.isArray(v)) { expanded[k] = v; return; }
            v.forEach(function (item, i) {
                var base = k + opts.flattenSeparator + i;
                if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
                    Object.assign(expanded, flattenObject(item, base, opts.flattenSeparator));
                } else {
                    expanded[base] = Array.isArray(item) ? JSON.stringify(item) : item;
                }
            });
        });
        return [expanded];
    }

    if (opts.arrayMode === 'rows') {
        // One row per element of the longest array; scalars repeat down.
        var maxLen = arrayKeys.reduce(function (m, k) { return Math.max(m, flatRow[k].length); }, 0);
        if (maxLen === 0) {
            var emptied = {};
            Object.keys(flatRow).forEach(function (k) {
                emptied[k] = Array.isArray(flatRow[k]) ? '' : flatRow[k];
            });
            return [emptied];
        }
        var rows = [];
        for (var i = 0; i < maxLen; i++) {
            var row = {};
            Object.keys(flatRow).forEach(function (k) {
                var v = flatRow[k];
                if (!Array.isArray(v)) { row[k] = v; return; }
                var item = v[i];
                if (item === undefined) { row[k] = ''; return; }
                if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
                    Object.assign(row, flattenObject(item, k, opts.flattenSeparator));
                } else {
                    row[k] = item;
                }
            });
            rows.push(row);
        }
        return rows;
    }

    // 'join' (default): collapse each array into a single cell.
    var joined = {};
    Object.keys(flatRow).forEach(function (k) {
        var v = flatRow[k];
        if (!Array.isArray(v)) { joined[k] = v; return; }
        joined[k] = v.map(function (item) {
            return item !== null && typeof item === 'object' ? JSON.stringify(item) : item;
        }).join(opts.arrayJoiner);
    });
    return [joined];
}

// A field must be quoted if it contains the delimiter, a quote, or any newline.
// The delimiter is a parameter, so semicolon and tab files quote correctly too.
function csvEscape(value, delimiter) {
    if (value === null || value === undefined) return '';
    var str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (str.indexOf(delimiter) !== -1 || str.indexOf('"') !== -1 ||
        str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Accepts a JSON array, a single object, or NDJSON / JSONL text.
function parseInput(text) {
    var trimmed = String(text).trim();
    if (!trimmed) throw new Error('Please enter JSON data');

    try {
        var parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return { data: parsed, format: 'json' };
        if (parsed !== null && typeof parsed === 'object') return { data: [parsed], format: 'json' };
        throw new Error('JSON must be an object or array of objects');
    } catch (e) {
        // Not a single JSON document — try newline-delimited JSON.
        var lines = trimmed.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
        if (lines.length > 1) {
            var records = [];
            for (var i = 0; i < lines.length; i++) {
                try { records.push(JSON.parse(lines[i])); }
                catch (inner) { throw e; }   // report the original error
            }
            return { data: records, format: 'ndjson' };
        }
        throw e;
    }
}

function buildRows(data, opts) {
    var rows = [];
    data.forEach(function (record) {
        if (record !== null && typeof record === 'object' && !Array.isArray(record)) {
            var flat = flattenObject(record, '', opts.flattenSeparator);
            applyArrayStrategy(flat, opts).forEach(function (r) { rows.push(r); });
        } else {
            rows.push({ value: record });
        }
    });
    return rows;
}

function collectHeaders(rows) {
    var headers = [];
    rows.forEach(function (row) {
        Object.keys(row).forEach(function (k) {
            if (headers.indexOf(k) === -1) headers.push(k);
        });
    });
    return headers;
}

function toCSV(rows, headers, options) {
    var opts = Object.assign({}, CSV_DEFAULTS, options || {});
    var eol = opts.lineEnding;
    var out = '';

    if (opts.includeHeader) {
        out += headers.map(function (h) { return csvEscape(h, opts.delimiter); }).join(opts.delimiter) + eol;
    }
    rows.forEach(function (row) {
        out += headers.map(function (h) {
            return csvEscape(row[h] !== undefined ? row[h] : '', opts.delimiter);
        }).join(opts.delimiter) + eol;
    });

    // Excel only reads UTF-8 correctly when the file starts with a BOM;
    // without it, accented characters arrive as mojibake.
    if (opts.addBom) out = '﻿' + out;
    return out;
}

function convert(text, options) {
    var opts = Object.assign({}, CSV_DEFAULTS, options || {});
    var parsed = parseInput(text);
    var rows = buildRows(parsed.data, opts);
    var allHeaders = collectHeaders(rows);
    var headers = opts.columns && opts.columns.length
        ? opts.columns.filter(function (c) { return allHeaders.indexOf(c) !== -1; })
        : allHeaders;
    return {
        csv: toCSV(rows, headers, opts),
        rows: rows,
        headers: headers,
        allHeaders: allHeaders,
        format: parsed.format
    };
}

// --- DOM wiring --------------------------------------------------------

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', function () {
    var inputJSON = document.getElementById('inputJSON');
    if (!inputJSON) return;

    var outputCSV = document.getElementById('outputCSV');
    var convertBtn = document.getElementById('convertBtn');
    var clearBtn = document.getElementById('clearBtn');
    var copyBtn = document.getElementById('copyBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var tablePreview = document.getElementById('tablePreview');
    var tableStats = document.getElementById('tableStats');
    var previewTable = document.getElementById('previewTable');
    var jsonFileInput = document.getElementById('jsonFileInput');
    var columnPicker = document.getElementById('columnPicker');
    var columnWrap = document.getElementById('columnWrap');

    var selectedColumns = null;   // null until the user changes the selection
    var lastAllHeaders = [];

    function el(id) { return document.getElementById(id); }

    function readOptions() {
        var delim = el('delimiterSelect') ? el('delimiterSelect').value : ',';
        if (delim === 'tab') delim = '\t';
        else if (delim === 'custom') {
            delim = el('customDelimiter') && el('customDelimiter').value ? el('customDelimiter').value[0] : ',';
        }
        return {
            delimiter: delim,
            flattenSeparator: el('flattenSeparator') && el('flattenSeparator').value ? el('flattenSeparator').value : '.',
            arrayMode: el('arrayMode') ? el('arrayMode').value : 'join',
            arrayJoiner: el('arrayJoiner') && el('arrayJoiner').value !== '' ? el('arrayJoiner').value : ' | ',
            lineEnding: el('crlf') && el('crlf').checked ? '\r\n' : '\n',
            addBom: el('addBom') ? el('addBom').checked : false,
            includeHeader: el('includeHeader') ? el('includeHeader').checked : true,
            columns: selectedColumns
        };
    }

    function buildTable(rows, headers) {
        previewTable.innerHTML = '';

        var thead = document.createElement('thead');
        var hr = document.createElement('tr');
        headers.forEach(function (h) {
            var th = document.createElement('th');
            th.textContent = h;
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        previewTable.appendChild(thead);

        var tbody = document.createElement('tbody');
        var limit = Math.min(rows.length, 200);
        for (var i = 0; i < limit; i++) {
            var row = rows[i];
            var tr = document.createElement('tr');
            headers.forEach(function (h) {
                var td = document.createElement('td');
                var val = row[h];
                var text = (val === null || val === undefined) ? ''
                    : (typeof val === 'object' ? JSON.stringify(val) : String(val));
                td.textContent = text;
                td.title = text;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
        previewTable.appendChild(tbody);

        var rowLabel = rows.length === 1 ? '1 row' : rows.length + ' rows';
        tableStats.textContent = rowLabel + ' · ' + headers.length + ' columns';
        if (rows.length > 200) tableStats.textContent += ' (showing first 200)';

        tablePreview.style.display = '';
    }

    // Column checkboxes are rebuilt only when the underlying key set changes,
    // so the user's selection survives an option tweak.
    function buildColumnPicker(allHeaders) {
        if (!columnPicker || !columnWrap) return;
        var same = allHeaders.length === lastAllHeaders.length &&
            allHeaders.every(function (h, i) { return lastAllHeaders[i] === h; });
        if (same) return;

        lastAllHeaders = allHeaders.slice();
        selectedColumns = null;
        columnPicker.innerHTML = '';

        allHeaders.forEach(function (h) {
            var id = 'col_' + h.replace(/[^\w-]/g, '_');
            var label = document.createElement('label');
            label.className = 'jc-col';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = true;
            cb.value = h;
            cb.id = id;
            cb.addEventListener('change', function () {
                selectedColumns = Array.from(columnPicker.querySelectorAll('input:checked'))
                    .map(function (i) { return i.value; });
                if (selectedColumns.length === allHeaders.length) selectedColumns = null;
                run();
            });
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + h));
            columnPicker.appendChild(label);
        });
        columnWrap.style.display = 'block';
    }

    function run() {
        try {
            var opts = readOptions();
            var result = convert(inputJSON.value, opts);

            outputCSV.value = result.csv;
            buildColumnPicker(result.allHeaders);
            buildTable(result.rows, result.headers);

            trackEvent('convert_to_csv', {
                rows: result.rows.length,
                delimiter: opts.delimiter,
                array_mode: opts.arrayMode,
                source_format: result.format
            });
            return true;
        } catch (error) {
            outputCSV.value = 'Error: ' + error.message;
            tablePreview.style.display = 'none';
            if (columnWrap) columnWrap.style.display = 'none';
            lastAllHeaders = [];
            return false;
        }
    }

    convertBtn.addEventListener('click', function () {
        if (run()) showToast('Converted successfully');
        else showToast('Conversion failed');
    });

    var reRun = typeof debounce === 'function' ? debounce(function () {
        if (inputJSON.value.trim()) run();
    }, 200) : function () {};

    ['delimiterSelect', 'customDelimiter', 'flattenSeparator', 'arrayMode', 'arrayJoiner',
     'crlf', 'addBom', 'includeHeader'].forEach(function (id) {
        var e = el(id);
        if (!e) return;
        e.addEventListener('change', reRun);
        if (e.tagName === 'INPUT' && e.type === 'text') e.addEventListener('input', reRun);
    });

    function syncVisibility() {
        if (el('customDelimiter') && el('delimiterSelect')) {
            el('customDelimiter').style.display = el('delimiterSelect').value === 'custom' ? 'inline-block' : 'none';
        }
        if (el('arrayJoiner') && el('arrayMode')) {
            el('arrayJoiner').style.display = el('arrayMode').value === 'join' ? 'inline-block' : 'none';
        }
    }
    ['delimiterSelect', 'arrayMode'].forEach(function (id) {
        if (el(id)) el(id).addEventListener('change', syncVisibility);
    });
    syncVisibility();

    clearBtn.addEventListener('click', function () {
        inputJSON.value = '';
        outputCSV.value = '';
        tablePreview.style.display = 'none';
        if (columnWrap) columnWrap.style.display = 'none';
        lastAllHeaders = [];
        selectedColumns = null;
        inputJSON.focus();
    });

    copyBtn.addEventListener('click', function () {
        if (!outputCSV.value) { showToast('Nothing to copy'); return; }
        copyToClipboard(outputCSV.value).then(function () {
            showToast('Copied to clipboard!');
            trackEvent('copy_output', { tool: 'csv' });
        });
    });

    downloadBtn.addEventListener('click', function () {
        if (!outputCSV.value) { showToast('Nothing to download'); return; }
        var d = readOptions().delimiter;
        var name = d === '\t' ? 'data.tsv' : 'data.csv';
        downloadFile(outputCSV.value, name, 'text/csv;charset=utf-8;');
        trackEvent('download_output', { tool: 'csv' });
        showToast('Downloaded!');
    });

    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            getFileFromUpload(file).then(function (content) {
                inputJSON.value = content;
                run();
            }).catch(function () { showToast('Error reading file'); });
        });
    }

    initDragDrop('inputJSON', function (content) {
        inputJSON.value = content;
        run();
    }, ['.json', '.txt', '.ndjson', '.jsonl']);

    inputJSON.addEventListener('paste', function () {
        trackEvent('tool_start', { tool: 'json_to_csv' });
    }, { once: true });
});
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        convert, toCSV, csvEscape, flattenObject, applyArrayStrategy,
        parseInput, buildRows, collectHeaders, CSV_DEFAULTS
    };
}
