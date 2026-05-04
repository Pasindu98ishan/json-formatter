// CSV to JSON Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function parseCSV(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const nonEmpty = lines.filter(l => l.trim() !== '');
    if (nonEmpty.length < 2) throw new Error('CSV must have at least a header row and one data row.');

    const rows = nonEmpty.map(parseLine);
    const headers = rows[0];
    if (headers.some(h => h === '')) throw new Error('Header row contains empty column names.');

    const result = [];
    for (let i = 1; i < rows.length; i++) {
        const obj = {};
        headers.forEach(function (h, idx) {
            obj[h] = rows[i][idx] !== undefined ? rows[i][idx] : '';
        });
        result.push(obj);
    }
    return result;
}

function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') { current += '"'; i++; }
                else inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    fields.push(current);
    return fields;
}

function showError(msg) {
    const el = document.getElementById('errorContainer');
    if (el) { el.textContent = '⚠️ ' + msg; el.style.display = 'block'; }
}

function clearError() {
    const el = document.getElementById('errorContainer');
    if (el) el.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const csvInput = document.getElementById('csvInput');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const outputSection = document.getElementById('outputSection');
    const jsonOutput = document.getElementById('jsonOutput');
    const rowCount = document.getElementById('rowCount');

    if (convertBtn) convertBtn.addEventListener('click', handleConvert);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = fileInput.files[0];
            if (file) readFile(file);
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', function () {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) readFile(file);
        });
    }

    if (outputSection) outputSection.style.display = 'none';
});

function readFile(file) {
    if (!file.name.match(/\.(csv|txt)$/i)) {
        showError('Please upload a .csv or .txt file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('csvInput').value = e.target.result;
    };
    reader.readAsText(file);
}

function handleConvert() {
    clearError();
    const csv = document.getElementById('csvInput').value.trim();
    if (!csv) { showError('Paste CSV data or upload a file to convert.'); return; }

    try {
        const data = parseCSV(csv);
        const json = JSON.stringify(data, null, 2);
        document.getElementById('jsonOutput').textContent = json;
        document.getElementById('rowCount').textContent = data.length + ' record' + (data.length !== 1 ? 's' : '') + ' converted';
        document.getElementById('outputSection').style.display = 'block';
        trackEvent('convert_csv_to_json', { rows: data.length });
    } catch (e) {
        showError(e.message);
        document.getElementById('outputSection').style.display = 'none';
    }
}

function handleClear() {
    document.getElementById('csvInput').value = '';
    document.getElementById('outputSection').style.display = 'none';
    clearError();
    if (document.getElementById('fileInput')) document.getElementById('fileInput').value = '';
}

function handleCopy() {
    const text = document.getElementById('jsonOutput').textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
        const btn = document.getElementById('copyBtn');
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(function () { btn.textContent = orig; }, 2000);
        trackEvent('copy_csv_to_json_output');
    });
}

function handleDownload() {
    const text = document.getElementById('jsonOutput').textContent;
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'output.json';
    a.click();
    URL.revokeObjectURL(a.href);
    trackEvent('download_csv_to_json_output');
}
