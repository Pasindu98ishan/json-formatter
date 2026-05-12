function trackEvent(action, params) {
    if (typeof gtag === 'function') gtag('event', action, params || {});
}

function flattenObject(obj, prefix) {
    var result = {};
    prefix = prefix || '';
    Object.keys(obj).forEach(function(key) {
        var fullKey = prefix ? prefix + '.' + key : key;
        var val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, fullKey));
        } else if (Array.isArray(val)) {
            result[fullKey] = val.map(function(item) {
                return typeof item === 'object' && item !== null ? JSON.stringify(item) : item;
            }).join(' | ');
        } else {
            result[fullKey] = val;
        }
    });
    return result;
}

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    var str = String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

document.addEventListener('DOMContentLoaded', function() {
    var inputJSON = document.getElementById('inputJSON');
    var outputCSV = document.getElementById('outputCSV');
    var convertBtn = document.getElementById('convertBtn');
    var clearBtn = document.getElementById('clearBtn');
    var copyBtn = document.getElementById('copyBtn');
    var downloadBtn = document.getElementById('downloadBtn');
    var tablePreview = document.getElementById('tablePreview');
    var tableStats = document.getElementById('tableStats');
    var previewTable = document.getElementById('previewTable');
    var jsonFileInput = document.getElementById('jsonFileInput');

    jsonFileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(event) {
            inputJSON.value = event.target.result;
            inputJSON.focus();
        };
        reader.onerror = function() {
            showNotification('Error reading file', 'error');
        };
        reader.readAsText(file);
    });

    function buildTable(flatRows, headers) {
        previewTable.innerHTML = '';

        var thead = document.createElement('thead');
        var hr = document.createElement('tr');
        headers.forEach(function(h) {
            var th = document.createElement('th');
            th.textContent = h;
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        previewTable.appendChild(thead);

        var tbody = document.createElement('tbody');
        var limit = Math.min(flatRows.length, 200);
        for (var i = 0; i < limit; i++) {
            var row = flatRows[i];
            var tr = document.createElement('tr');
            headers.forEach(function(h) {
                var td = document.createElement('td');
                var val = row[h];
                var text = (val === null || val === undefined) ? '' : String(val);
                td.textContent = text;
                td.title = text;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
        previewTable.appendChild(tbody);

        var rowLabel = flatRows.length === 1 ? '1 row' : flatRows.length + ' rows';
        tableStats.textContent = rowLabel + ' · ' + headers.length + ' columns';
        if (flatRows.length > 200) tableStats.textContent += ' (showing first 200)';

        tablePreview.style.display = '';
    }

    convertBtn.addEventListener('click', function() {
        try {
            var input = inputJSON.value.trim();
            if (!input) { alert('Please enter JSON data'); return; }

            var jsonData = JSON.parse(input);

            if (!Array.isArray(jsonData)) {
                if (typeof jsonData === 'object' && jsonData !== null) {
                    jsonData = [jsonData];
                } else {
                    throw new Error('JSON must be an object or array of objects');
                }
            }

            if (jsonData.length === 0) {
                outputCSV.value = '';
                tablePreview.style.display = 'none';
                showNotification('Empty array');
                return;
            }

            var flatRows = jsonData.map(function(row) {
                if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
                    return flattenObject(row);
                }
                return { value: row };
            });

            // Union of all keys (handles inconsistent objects)
            var headers = [];
            flatRows.forEach(function(row) {
                Object.keys(row).forEach(function(k) {
                    if (headers.indexOf(k) === -1) headers.push(k);
                });
            });

            var csv = headers.map(csvEscape).join(',') + '\n';
            flatRows.forEach(function(row) {
                csv += headers.map(function(h) {
                    return csvEscape(row[h] !== undefined ? row[h] : '');
                }).join(',') + '\n';
            });

            outputCSV.value = csv;
            buildTable(flatRows, headers);
            trackEvent('convert_to_csv');
            showNotification('Converted successfully');
        } catch (error) {
            outputCSV.value = 'Error: ' + error.message;
            tablePreview.style.display = 'none';
            showNotification('Conversion failed', 'error');
        }
    });

    clearBtn.addEventListener('click', function() {
        inputJSON.value = '';
        outputCSV.value = '';
        tablePreview.style.display = 'none';
        inputJSON.focus();
    });

    copyBtn.addEventListener('click', function() {
        if (!outputCSV.value) { alert('Nothing to copy'); return; }
        outputCSV.select();
        document.execCommand('copy');
        trackEvent('copy_output', { tool: 'csv' });
        showNotification('Copied to clipboard!');
    });

    downloadBtn.addEventListener('click', function() {
        if (!outputCSV.value) { alert('Nothing to download'); return; }
        var blob = new Blob([outputCSV.value], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'data.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        trackEvent('download_output', { tool: 'csv' });
        showNotification('Downloaded!');
    });

    initDragDrop('inputJSON', function(content) {
        inputJSON.value = content;
    }, ['.json', '.txt']);

    function showNotification(message, type) {
        var n = document.createElement('div');
        n.textContent = message;
        var bg = type === 'error' ? '#f44336' : '#4CAF50';
        n.style.cssText = 'position:fixed;top:20px;right:20px;background:' + bg + ';color:white;padding:15px 20px;border-radius:4px;z-index:10000;';
        document.body.appendChild(n);
        setTimeout(function() { n.remove(); }, 3000);
    }
});
