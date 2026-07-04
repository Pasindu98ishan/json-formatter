// Timestamp Converter Tool
// Adds IANA timezone support (both directions), bulk conversion, output
// format toggles (ISO / RFC 2822 / locale / relative), and a seconds-vs-
// milliseconds auto-detect indicator — all on top of the original
// Timestamp <-> Date conversion.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

// ---------- Timezone list ----------

const CURATED_ZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage',
    'America/Sao_Paulo', 'America/Mexico_City', 'America/Toronto', 'America/Bogota',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid', 'Europe/Moscow', 'Europe/Istanbul',
    'Africa/Cairo', 'Africa/Johannesburg',
    'Asia/Dubai', 'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Shanghai',
    'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore',
    'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland'
];

// The timezone control is a searchable text input (typeahead via <datalist>)
// rather than a plain <select>, since Intl.supportedValuesOf('timeZone') can
// return several hundred zones — scrolling a dropdown that long is painful.
let VALID_ZONES = new Set();

function populateTimezones(inputEl, datalistEl) {
    let zones = null;
    try {
        if (typeof Intl.supportedValuesOf === 'function') zones = Intl.supportedValuesOf('timeZone');
    } catch (e) { zones = null; }
    const list = (zones && zones.length) ? zones : CURATED_ZONES;
    const ordered = ['UTC'].concat(list.filter(z => z !== 'UTC'));
    VALID_ZONES = new Set(ordered);
    datalistEl.innerHTML = ordered.map(z => '<option value="' + z + '">').join('');
    inputEl.value = 'UTC';
}

// Validates the free-text timezone input against the known zone list
// (case-insensitively) so a typo can't silently break a conversion or throw
// inside Intl.DateTimeFormat. Returns the canonical zone string, or null.
function getValidZone(inputEl) {
    const raw = (inputEl.value || '').trim();
    if (VALID_ZONES.has(raw)) return raw;
    const found = Array.from(VALID_ZONES).find(function (z) { return z.toLowerCase() === raw.toLowerCase(); });
    if (found) { inputEl.value = found; return found; }
    return null;
}

// ---------- Formatting helpers ----------

function offsetPartToISO(gmtStr) {
    if (!gmtStr || gmtStr === 'GMT') return '+00:00';
    const m = gmtStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return '+00:00';
    return m[1] + m[2].padStart(2, '0') + ':' + (m[3] || '00').padStart(2, '0');
}

function offsetPartToRFC(gmtStr) {
    if (!gmtStr || gmtStr === 'GMT') return '+0000';
    const m = gmtStr.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return '+0000';
    return m[1] + m[2].padStart(2, '0') + (m[3] || '00').padStart(2, '0');
}

function partsToMap(parts) {
    const map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    return map;
}

function isoStringInZone(date, tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const p = partsToMap(parts);
    const hour = p.hour === '24' ? '00' : p.hour;
    return p.year + '-' + p.month + '-' + p.day + 'T' + hour + ':' + p.minute + ':' + p.second +
        offsetPartToISO(p.timeZoneName);
}

function rfc2822InZone(date, tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const p = partsToMap(parts);
    const hour = p.hour === '24' ? '00' : p.hour;
    return p.weekday + ', ' + p.day + ' ' + p.month + ' ' + p.year + ' ' + hour + ':' + p.minute + ':' + p.second +
        ' ' + offsetPartToRFC(p.timeZoneName);
}

function relativeFormat(date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffSec = (date.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
    if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
    return rtf.format(Math.round(diffSec / 31536000), 'year');
}

function formatInZone(date, tz, kind) {
    if (kind === 'rfc2822') return tz === 'UTC' ? date.toUTCString() : rfc2822InZone(date, tz);
    if (kind === 'locale') return date.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
    if (kind === 'relative') return relativeFormat(date);
    return isoStringInZone(date, tz); // 'iso' default
}

// Reads the UTC offset (in minutes) that `tz` observes AT a given instant.
// Returns null if the browser can't resolve an offset for this zone.
function getOffsetMinutesAt(instantMs, tz) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset', hour: '2-digit' }).formatToParts(instantMs);
    const tzPart = parts.find(function (p) { return p.type === 'timeZoneName'; });
    if (!tzPart) return null;
    const m = tzPart.value.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
    if (!m) return 0; // bare "GMT" (UTC) has zero offset
    return parseInt(m[1], 10) * 60 + (m[1].charAt(0) === '-' ? -1 : 1) * parseInt(m[2] || '0', 10);
}

// Converts a wall-clock date/time AS OBSERVED IN a given IANA zone into a
// true UTC instant. There is no native API for this (Intl.DateTimeFormat only
// *formats* a Date into a zone) — the standard trick: build a provisional
// UTC timestamp from the raw components, read that zone's offset AT that
// moment, then subtract the offset. A single pass can pick the WRONG offset
// for wall-clock times that fall on the DST transition day itself (the
// provisional instant, reinterpreted in the target zone, can land just
// before the transition even though the intended wall time is just after
// it) — so re-check the offset at the resulting candidate and, if it
// differs, redo once more with the corrected offset (fixed-point iteration).
function zonedWallTimeToUtcMs(y, mo, d, h, mi, s, tz) {
    const provisional = Date.UTC(y, mo - 1, d, h, mi, s || 0);
    let offset;
    try {
        offset = getOffsetMinutesAt(provisional, tz);
    } catch (e) {
        return { utcMs: new Date(y, mo - 1, d, h, mi, s || 0).getTime(), fallback: true };
    }
    if (offset === null) return { utcMs: new Date(y, mo - 1, d, h, mi, s || 0).getTime(), fallback: true };

    let utcMs = provisional - offset * 60000;
    const offset2 = getOffsetMinutesAt(utcMs, tz);
    if (offset2 !== null && offset2 !== offset) {
        utcMs = provisional - offset2 * 60000; // re-resolve using the offset that actually applies at the candidate instant
    }
    return { utcMs: utcMs, fallback: false };
}

function detectUnit(rawValue) {
    const digits = String(rawValue).replace(/[^0-9]/g, '').length;
    return digits >= 13 ? 'ms' : 'seconds';
}

function convertBulkLine(line, tz, outputFormat, forceMs) {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/^-?\d+$/.test(trimmed)) {
        const unit = forceMs ? 'ms' : detectUnit(trimmed);
        const num = parseInt(trimmed, 10);
        const ms = unit === 'ms' ? num : num * 1000;
        const date = new Date(ms);
        if (isNaN(date.getTime())) return 'invalid: ' + line;
        return formatInZone(date, tz, outputFormat);
    }
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return 'invalid: ' + line;
    return String(Math.floor(parsed.getTime() / 1000));
}

document.addEventListener('DOMContentLoaded', function () {
    const timestamp = document.getElementById('timestamp');
    const dateOutput = document.getElementById('dateOutput');
    const dateInput = document.getElementById('dateInput');
    const timestampOutput = document.getElementById('timestampOutput');
    const toDateBtn = document.getElementById('toDateBtn');
    const toTimestampBtn = document.getElementById('toTimestampBtn');
    const nowBtn = document.getElementById('nowBtn');
    const copyBtn = document.getElementById('copyBtn');
    const currentTimestampSpan = document.getElementById('currentTimestamp');
    const tzSelect = document.getElementById('tzSelect');
    const outputFormatSelect = document.getElementById('outputFormatSelect');
    const unitDetected = document.getElementById('unitDetected');
    const unitOverride = document.getElementById('unitOverride');
    const bulkInput = document.getElementById('bulkInput');
    const bulkOutput = document.getElementById('bulkOutput');
    const bulkConvertBtn = document.getElementById('bulkConvertBtn');
    const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
    const errorContainer = document.getElementById('errorContainer');

    function showMessage(msg, success) {
        if (!errorContainer) return;
        errorContainer.style.display = 'block';
        errorContainer.style.backgroundColor = success ? '#d4edda' : '#f8d7da';
        errorContainer.style.color = success ? '#155724' : '#721c24';
        errorContainer.style.borderColor = success ? '#c3e6cb' : '#f5c6cb';
        errorContainer.textContent = msg;
        if (success) setTimeout(function () { errorContainer.style.display = 'none'; }, 3000);
    }

    const tzOptions = document.getElementById('tzOptions');
    if (tzSelect && tzOptions) populateTimezones(tzSelect, tzOptions);

    function updateCurrentTimestamp() {
        currentTimestampSpan.textContent = Math.floor(Date.now() / 1000);
    }
    updateCurrentTimestamp();
    setInterval(updateCurrentTimestamp, 1000);

    function updateUnitIndicator() {
        if (!unitDetected) return;
        unitDetected.textContent = 'detected: ' + detectUnit(timestamp.value || '');
    }
    if (timestamp) {
        timestamp.addEventListener('input', updateUnitIndicator);
        updateUnitIndicator();
    }

    // Convert Timestamp to Date
    toDateBtn.addEventListener('click', function () {
        const ts = parseInt(timestamp.value, 10);
        if (isNaN(ts)) { showMessage('Please enter a valid Unix timestamp.'); return; }
        const unit = (unitOverride && unitOverride.checked) ? 'ms' : detectUnit(timestamp.value);
        const ms = unit === 'ms' ? ts : ts * 1000;
        const date = new Date(ms);
        const tz = tzSelect ? getValidZone(tzSelect) : 'UTC';
        if (!tz) { showMessage('Unknown timezone "' + tzSelect.value + '" — pick one from the list (e.g. UTC, America/New_York, Asia/Tokyo).'); return; }
        const fmt = outputFormatSelect ? outputFormatSelect.value : 'iso';
        dateOutput.value = formatInZone(date, tz, fmt);
        showMessage('Converted timestamp to date.', true);
        trackEvent('convert_timestamp_to_date', { tz: tz, format: fmt });
    });

    // Get Current Time
    nowBtn.addEventListener('click', function () {
        const now = Math.floor(Date.now() / 1000);
        timestamp.value = now;
        if (unitOverride) unitOverride.checked = false;
        updateUnitIndicator();
        const tz = (tzSelect && getValidZone(tzSelect)) || 'UTC';
        const fmt = outputFormatSelect ? outputFormatSelect.value : 'iso';
        dateOutput.value = formatInZone(new Date(now * 1000), tz, fmt);
        showMessage('Current timestamp: ' + now, true);
    });

    // Convert Date to Timestamp (timezone-aware)
    toTimestampBtn.addEventListener('click', function () {
        if (!dateInput.value) { showMessage('Please enter a date and time.'); return; }
        const parts = dateInput.value.split('T');
        const dateParts = parts[0].split('-').map(Number);
        const timeParts = (parts[1] || '00:00').split(':').map(Number);
        const tz = tzSelect ? getValidZone(tzSelect) : 'UTC';
        if (!tz) { showMessage('Unknown timezone "' + tzSelect.value + '" — pick one from the list (e.g. UTC, America/New_York, Asia/Tokyo).'); return; }
        const result = zonedWallTimeToUtcMs(
            dateParts[0], dateParts[1], dateParts[2],
            timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0, tz
        );
        timestampOutput.value = Math.floor(result.utcMs / 1000);
        if (result.fallback) {
            showMessage('Your browser could not resolve that timezone\'s offset — used your local timezone instead.');
        } else {
            showMessage('Converted date to timestamp.', true);
        }
        trackEvent('convert_date_to_timestamp', { tz: tz });
    });

    // Copy Timestamp
    copyBtn.addEventListener('click', function () {
        if (!timestampOutput.value) { showMessage('Nothing to copy.'); return; }
        copyToClipboard(timestampOutput.value)
            .then(function () { showMessage('Copied to clipboard!', true); })
            .catch(function () { showMessage('Unable to copy to clipboard.'); });
    });

    // Bulk conversion
    if (bulkConvertBtn) {
        bulkConvertBtn.addEventListener('click', function () {
            const lines = (bulkInput.value || '').split('\n');
            const tz = (tzSelect && getValidZone(tzSelect)) || 'UTC';
            const fmt = outputFormatSelect ? outputFormatSelect.value : 'iso';
            const forceMs = !!(unitOverride && unitOverride.checked);
            const results = lines.map(function (line) { return convertBulkLine(line, tz, fmt, forceMs); });
            bulkOutput.value = results.join('\n');
            trackEvent('bulk_convert_timestamp', { count: lines.length });
        });
    }

    if (bulkDownloadBtn) {
        bulkDownloadBtn.addEventListener('click', function () {
            const inputs = (bulkInput.value || '').split('\n');
            const outputs = (bulkOutput.value || '').split('\n');
            if (!outputs.length || !outputs[0]) { showMessage('Run "Convert All" first.'); return; }
            let csv = 'input,output\n';
            for (let i = 0; i < inputs.length; i++) {
                const inVal = (inputs[i] || '').replace(/"/g, '""');
                const outVal = (outputs[i] || '').replace(/"/g, '""');
                csv += '"' + inVal + '","' + outVal + '"\n';
            }
            downloadFile(csv, 'timestamp-results.csv', 'text/csv');
            trackEvent('download_bulk_timestamp_results');
        });
    }

    // Real-time conversion on Enter key
    timestamp.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') toDateBtn.click();
    });

    dateInput.addEventListener('change', function () {
        toTimestampBtn.click();
    });
});
