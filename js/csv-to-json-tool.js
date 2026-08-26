// CSV to JSON Tool
// RFC 4180-compliant parser: single character state machine, so quoted fields
// may contain delimiters, escaped quotes ("") and real newlines.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

var DEFAULT_OPTIONS = {
    delimiter: 'auto',      // 'auto' | ',' | ';' | '\t' | '|' | any single char
    hasHeader: true,
    headerlessMode: 'keys', // 'keys' -> col1..colN, 'arrays' -> array of arrays
    inferTypes: true,
    emptyAsNull: false,
    expandNested: false,
    nestedSeparator: '.',
    skipEmptyLines: true
};

// --- delimiter detection -----------------------------------------------

// Count a candidate delimiter's occurrences outside quoted regions, on the
// first non-empty line only. The header row is the most reliable sample.
function countOutsideQuotes(line, delim) {
    var count = 0;
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { i++; continue; }
            inQuotes = !inQuotes;
        } else if (ch === delim && !inQuotes) {
            count++;
        }
    }
    return count;
}

function detectDelimiter(text) {
    var firstLine = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') { firstLine += '""'; i++; continue; }
            inQuotes = !inQuotes;
        }
        if (ch === '\n' && !inQuotes) break;
        firstLine += ch;
    }

    var candidates = [',', ';', '\t', '|'];
    var best = ',';
    var bestCount = 0;
    candidates.forEach(function (d) {
        var c = countOutsideQuotes(firstLine, d);
        if (c > bestCount) { bestCount = c; best = d; }
    });
    return bestCount > 0 ? best : ',';
}

// --- core parser -------------------------------------------------------

// Walk the entire text once. `inQuotes` survives newlines, which is exactly
// what the old line-splitting implementation could not do.
function tokenizeCSV(text, delimiter) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var fieldWasQuoted = false;
    var rowHasContent = false;

    function endField() {
        row.push(field);
        if (field !== '' || fieldWasQuoted) rowHasContent = true;
        field = '';
        fieldWasQuoted = false;
    }

    function endRow() {
        endField();
        rows.push({ fields: row, hasContent: rowHasContent });
        row = [];
        rowHasContent = false;
    }

    for (var i = 0; i < text.length; i++) {
        var ch = text[i];

        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += ch;               // newlines land here, preserved
            }
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
            fieldWasQuoted = true;
        } else if (ch === delimiter) {
            endField();
        } else if (ch === '\r') {
            if (text[i + 1] === '\n') i++;  // CRLF
            endRow();
        } else if (ch === '\n') {
            endRow();
        } else {
            field += ch;
        }
    }

    // Trailing content, but don't invent a row from a final newline.
    if (field !== '' || fieldWasQuoted || row.length > 0) endRow();

    return rows;
}

// --- value handling ----------------------------------------------------

// Only convert when the round trip is lossless. Leading zeros, oversized
// integers and "+1" stay strings so IDs and zip codes survive intact.
var NUMBER_RE = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;

function inferType(value, options) {
    if (value === '') return options.emptyAsNull ? null : '';

    var trimmed = value.trim();
    if (trimmed === '') return value;

    if (/^true$/i.test(trimmed)) return true;
    if (/^false$/i.test(trimmed)) return false;
    if (/^null$/i.test(trimmed)) return null;

    if (NUMBER_RE.test(trimmed)) {
        var num = Number(trimmed);
        if (!isFinite(num)) return value;
        // Reject anything that cannot survive a round trip through a double.
        if (Number.isInteger(num) && !Number.isSafeInteger(num)) return value;
        if (!Number.isInteger(num) && String(num) !== trimmed &&
            Number(String(num)) !== num) return value;
        return num;
    }

    return value;
}

// Inverse of flattenObject() in json-to-csv-tool.js: "user.name" rebuilds the
// nested object, and an all-digit segment rebuilds an array index.
function setNestedValue(target, pathParts, value) {
    var node = target;
    for (var i = 0; i < pathParts.length - 1; i++) {
        var part = pathParts[i];
        var nextIsIndex = /^\d+$/.test(pathParts[i + 1]);
        if (node[part] === undefined || node[part] === null || typeof node[part] !== 'object') {
            node[part] = nextIsIndex ? [] : {};
        }
        node = node[part];
    }
    node[pathParts[pathParts.length - 1]] = value;
}

// JSON keys are unique, so a repeated header would silently drop a column.
// Rename instead, and report it.
function dedupeHeaders(headers, warnings) {
    var seen = {};
    return headers.map(function (h, idx) {
        var name = h === '' ? 'column' + (idx + 1) : h;
        if (name !== h) {
            warnings.push('Column ' + (idx + 1) + ' had an empty header, named "' + name + '".');
        }
        if (Object.prototype.hasOwnProperty.call(seen, name)) {
            seen[name]++;
            var renamed = name + '_' + seen[name];
            warnings.push('Duplicate header "' + name + '" renamed to "' + renamed + '" so no column is lost.');
            return renamed;
        }
        seen[name] = 1;
        return name;
    });
}

function parseCSV(text, options) {
    var opts = Object.assign({}, DEFAULT_OPTIONS, options || {});
    var warnings = [];

    if (typeof text !== 'string') throw new Error('CSV input must be a string.');

    // A UTF-8 BOM would otherwise become part of the first header name,
    // making every lookup of that key fail downstream.
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
        warnings.push('A UTF-8 byte order mark (BOM) was removed from the start of the file.');
    }

    if (text.trim() === '') throw new Error('Paste CSV data or upload a file to convert.');

    var delimiter = opts.delimiter === 'auto' ? detectDelimiter(text) : opts.delimiter;
    if (!delimiter || delimiter.length !== 1) throw new Error('The delimiter must be a single character.');

    var rawRows = tokenizeCSV(text, delimiter);

    var rows = opts.skipEmptyLines
        ? rawRows.filter(function (r) { return r.hasContent; })
        : rawRows;

    if (rows.length === 0) throw new Error('No data rows found in the CSV.');

    var headers;
    var dataRows;

    if (opts.hasHeader) {
        if (rows.length < 2) throw new Error('CSV must have a header row and at least one data row. Untick "First row is a header" if your data has no header.');
        headers = dedupeHeaders(rows[0].fields, warnings);
        dataRows = rows.slice(1);
    } else {
        var width = rows.reduce(function (max, r) { return Math.max(max, r.fields.length); }, 0);
        headers = [];
        for (var c = 0; c < width; c++) headers.push('col' + (c + 1));
        dataRows = rows;
    }

    // Headerless "arrays" mode returns rows as arrays, no keys involved.
    if (!opts.hasHeader && opts.headerlessMode === 'arrays') {
        var arrayResult = dataRows.map(function (r) {
            return r.fields.map(function (v) {
                return opts.inferTypes ? inferType(v, opts) : v;
            });
        });
        return { data: arrayResult, headers: headers, delimiter: delimiter, warnings: warnings };
    }

    var ragged = 0;
    var result = dataRows.map(function (r) {
        if (r.fields.length !== headers.length) ragged++;
        var obj = {};
        headers.forEach(function (h, idx) {
            var raw = r.fields[idx] !== undefined ? r.fields[idx] : '';
            var value = opts.inferTypes ? inferType(raw, opts) : raw;
            if (opts.expandNested && h.indexOf(opts.nestedSeparator) !== -1) {
                setNestedValue(obj, h.split(opts.nestedSeparator), value);
            } else {
                obj[h] = value;
            }
        });
        return obj;
    });

    if (ragged > 0) {
        warnings.push(ragged + (ragged === 1 ? ' row does' : ' rows do') + ' not have exactly ' + headers.length + ' fields. Missing values were filled in as empty, extra values were ignored.');
    }

    return { data: result, headers: headers, delimiter: delimiter, warnings: warnings };
}

function formatOutput(data, format) {
    if (format === 'minified') return JSON.stringify(data);
    if (format === 'ndjson') {
        return data.map(function (row) { return JSON.stringify(row); }).join('\n');
    }
    return JSON.stringify(data, null, 2);
}

// --- DOM wiring --------------------------------------------------------

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        var els = {
            csvInput: document.getElementById('csvInput'),
            fileInput: document.getElementById('fileInput'),
            dropZone: document.getElementById('dropZone'),
            convertBtn: document.getElementById('convertBtn'),
            clearBtn: document.getElementById('clearBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            outputSection: document.getElementById('outputSection'),
            jsonOutput: document.getElementById('jsonOutput'),
            rowCount: document.getElementById('rowCount'),
            errorContainer: document.getElementById('errorContainer'),
            warnings: document.getElementById('warningContainer'),
            delimiter: document.getElementById('delimiterSelect'),
            customDelimiter: document.getElementById('customDelimiter'),
            hasHeader: document.getElementById('hasHeader'),
            headerlessMode: document.getElementById('headerlessMode'),
            headerlessWrap: document.getElementById('headerlessWrap'),
            inferTypes: document.getElementById('inferTypes'),
            emptyAsNull: document.getElementById('emptyAsNull'),
            expandNested: document.getElementById('expandNested'),
            nestedSeparator: document.getElementById('nestedSeparator'),
            outputFormat: document.getElementById('outputFormat'),
            previewWrap: document.getElementById('previewWrap'),
            previewTable: document.getElementById('previewTable'),
            detectedDelimiter: document.getElementById('detectedDelimiter')
        };

        if (!els.csvInput) return;

        var lastOutput = '';

        function readOptions() {
            var delim = els.delimiter ? els.delimiter.value : 'auto';
            if (delim === 'custom') {
                delim = els.customDelimiter && els.customDelimiter.value ? els.customDelimiter.value[0] : ',';
            } else if (delim === 'tab') {
                delim = '\t';
            }
            return {
                delimiter: delim,
                hasHeader: els.hasHeader ? els.hasHeader.checked : true,
                headerlessMode: els.headerlessMode ? els.headerlessMode.value : 'keys',
                inferTypes: els.inferTypes ? els.inferTypes.checked : true,
                emptyAsNull: els.emptyAsNull ? els.emptyAsNull.checked : false,
                expandNested: els.expandNested ? els.expandNested.checked : false,
                nestedSeparator: els.nestedSeparator && els.nestedSeparator.value ? els.nestedSeparator.value : '.'
            };
        }

        function showError(msg) {
            if (!els.errorContainer) return;
            els.errorContainer.textContent = '⚠️ ' + msg;
            els.errorContainer.style.display = 'block';
            if (els.outputSection) els.outputSection.style.display = 'none';
        }

        function clearError() {
            if (els.errorContainer) els.errorContainer.style.display = 'none';
            if (els.warnings) els.warnings.style.display = 'none';
        }

        function showWarnings(list) {
            if (!els.warnings) return;
            if (!list.length) { els.warnings.style.display = 'none'; return; }
            els.warnings.innerHTML = '<strong>Heads up</strong><ul style="margin:6px 0 0;padding-left:20px;">' +
                list.map(function (w) {
                    return '<li>' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</li>';
                }).join('') + '</ul>';
            els.warnings.style.display = 'block';
        }

        function buildPreview(data, headers) {
            if (!els.previewTable || !els.previewWrap) return;
            if (!Array.isArray(data) || data.length === 0 || Array.isArray(data[0])) {
                els.previewWrap.style.display = 'none';
                return;
            }
            // Nested expansion changes the shape, so preview the top-level keys.
            var cols = [];
            data.slice(0, 200).forEach(function (row) {
                Object.keys(row).forEach(function (k) {
                    if (cols.indexOf(k) === -1) cols.push(k);
                });
            });

            var thead = '<thead><tr>' + cols.map(function (c) {
                return '<th>' + c.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</th>';
            }).join('') + '</tr></thead>';

            var limit = Math.min(data.length, 200);
            var body = '';
            for (var i = 0; i < limit; i++) {
                body += '<tr>' + cols.map(function (c) {
                    var v = data[i][c];
                    var text = v === null ? 'null'
                        : (v === undefined ? ''
                        : (typeof v === 'object' ? JSON.stringify(v) : String(v)));
                    var cls = v === null ? ' class="cell-null"'
                        : (typeof v === 'number' ? ' class="cell-num"'
                        : (typeof v === 'boolean' ? ' class="cell-bool"' : ''));
                    return '<td' + cls + '>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</td>';
                }).join('') + '</tr>';
            }

            els.previewTable.innerHTML = thead + '<tbody>' + body + '</tbody>';
            els.previewWrap.style.display = 'block';
        }

        function describeDelimiter(d) {
            if (d === '\t') return 'Tab';
            if (d === ',') return 'Comma';
            if (d === ';') return 'Semicolon';
            if (d === '|') return 'Pipe';
            return '"' + d + '"';
        }

        function convert() {
            clearError();
            try {
                var opts = readOptions();
                var parsed = parseCSV(els.csvInput.value, opts);
                var format = els.outputFormat ? els.outputFormat.value : 'pretty';

                lastOutput = formatOutput(parsed.data, format);
                els.jsonOutput.textContent = lastOutput;

                var n = parsed.data.length;
                els.rowCount.textContent = n + ' record' + (n !== 1 ? 's' : '') + ' converted';
                if (els.detectedDelimiter) {
                    els.detectedDelimiter.textContent = 'Delimiter: ' + describeDelimiter(parsed.delimiter);
                }
                showWarnings(parsed.warnings);
                buildPreview(parsed.data, parsed.headers);
                els.outputSection.style.display = 'block';

                trackEvent('convert_csv_to_json', {
                    rows: n,
                    delimiter: parsed.delimiter,
                    infer_types: opts.inferTypes,
                    nested: opts.expandNested
                });
            } catch (e) {
                showError(e.message);
            }
        }

        // Re-run automatically once output is on screen, so toggling an option
        // shows its effect without a second click.
        var reconvert = typeof debounce === 'function' ? debounce(function () {
            if (els.outputSection && els.outputSection.style.display === 'block') convert();
        }, 200) : function () {};

        [els.delimiter, els.customDelimiter, els.hasHeader, els.headerlessMode, els.inferTypes,
         els.emptyAsNull, els.expandNested, els.nestedSeparator, els.outputFormat].forEach(function (el) {
            if (el) el.addEventListener('change', reconvert);
        });
        if (els.customDelimiter) els.customDelimiter.addEventListener('input', reconvert);
        if (els.nestedSeparator) els.nestedSeparator.addEventListener('input', reconvert);

        function syncOptionVisibility() {
            if (els.customDelimiter && els.delimiter) {
                els.customDelimiter.style.display = els.delimiter.value === 'custom' ? 'inline-block' : 'none';
            }
            if (els.headerlessWrap && els.hasHeader) {
                els.headerlessWrap.style.display = els.hasHeader.checked ? 'none' : 'flex';
            }
            if (els.nestedSeparator && els.expandNested) {
                els.nestedSeparator.style.display = els.expandNested.checked ? 'inline-block' : 'none';
            }
        }
        [els.delimiter, els.hasHeader, els.expandNested].forEach(function (el) {
            if (el) el.addEventListener('change', syncOptionVisibility);
        });
        syncOptionVisibility();

        if (els.convertBtn) els.convertBtn.addEventListener('click', convert);

        if (els.clearBtn) els.clearBtn.addEventListener('click', function () {
            els.csvInput.value = '';
            lastOutput = '';
            els.outputSection.style.display = 'none';
            if (els.previewWrap) els.previewWrap.style.display = 'none';
            clearError();
            if (els.fileInput) els.fileInput.value = '';
            els.csvInput.focus();
        });

        if (els.copyBtn) els.copyBtn.addEventListener('click', function () {
            if (!lastOutput) return;
            copyToClipboard(lastOutput).then(function () {
                showToast('Copied to clipboard!');
                trackEvent('copy_output', { tool: 'csv_to_json' });
            });
        });

        if (els.downloadBtn) els.downloadBtn.addEventListener('click', function () {
            if (!lastOutput) return;
            var isNdjson = els.outputFormat && els.outputFormat.value === 'ndjson';
            downloadFile(lastOutput,
                isNdjson ? 'output.ndjson' : 'output.json',
                isNdjson ? 'application/x-ndjson' : 'application/json');
            showToast('Downloaded!');
            trackEvent('download_output', { tool: 'csv_to_json' });
        });

        // Shared drag/drop handles the textarea; the styled drop zone forwards to it.
        initDragDrop('csvInput', function (content) {
            els.csvInput.value = content;
            convert();
        }, ['.csv', '.txt', '.tsv']);

        function readFile(file) {
            if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
                showError('Please upload a .csv, .tsv or .txt file.');
                return;
            }
            getFileFromUpload(file).then(function (content) {
                els.csvInput.value = content;
                convert();
            }).catch(function () {
                showError('Could not read that file.');
            });
        }

        if (els.fileInput) {
            els.fileInput.addEventListener('change', function () {
                if (els.fileInput.files[0]) readFile(els.fileInput.files[0]);
            });
        }

        if (els.dropZone) {
            els.dropZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                els.dropZone.classList.add('drag-over');
            });
            els.dropZone.addEventListener('dragleave', function () {
                els.dropZone.classList.remove('drag-over');
            });
            els.dropZone.addEventListener('drop', function (e) {
                e.preventDefault();
                els.dropZone.classList.remove('drag-over');
                if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]);
            });
        }

        els.csvInput.addEventListener('paste', function () {
            trackEvent('tool_start', { tool: 'csv_to_json' });
        }, { once: true });

        if (els.outputSection) els.outputSection.style.display = 'none';
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseCSV, tokenizeCSV, detectDelimiter, inferType, setNestedValue, formatOutput, dedupeHeaders };
}
