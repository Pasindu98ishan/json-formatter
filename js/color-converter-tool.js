// Color Converter Tool — HEX ↔ RGB ↔ HSL, 100% client-side.
// Exposes pure conversion helpers on window for testing; wires the UI on DOMContentLoaded.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

/* ---------- Pure conversion helpers ---------- */

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

// Parse a HEX string (#rgb, #rgba, #rrggbb, #rrggbbaa) → {r,g,b,a} or null.
function parseHex(str) {
    if (typeof str !== 'string') return null;
    let s = str.trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]+$/.test(s)) return null;
    if (s.length === 3 || s.length === 4) {
        s = s.split('').map(c => c + c).join('');
    }
    if (s.length !== 6 && s.length !== 8) return null;
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
}

// Parse an rgb()/rgba() string → {r,g,b,a} or null.
function parseRgb(str) {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i);
    if (!m) return null;
    const r = clamp(Math.round(parseFloat(m[1])), 0, 255);
    const g = clamp(Math.round(parseFloat(m[2])), 0, 255);
    const b = clamp(Math.round(parseFloat(m[3])), 0, 255);
    let a = 1;
    if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r, g, b, a: clamp(a, 0, 1) };
}

// Parse an hsl()/hsla() string → {r,g,b,a} or null.
function parseHsl(str) {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i);
    if (!m) return null;
    const h = ((parseFloat(m[1]) % 360) + 360) % 360;
    const s = clamp(parseFloat(m[2]), 0, 100) / 100;
    const l = clamp(parseFloat(m[3]), 0, 100) / 100;
    let a = 1;
    if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    const rgb = hslToRgb(h, s, l);
    return { r: rgb.r, g: rgb.g, b: rgb.b, a: clamp(a, 0, 1) };
}

function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function toHex(n) { return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0'); }

function formatHex({ r, g, b, a }) {
    let hex = '#' + toHex(r) + toHex(g) + toHex(b);
    if (a != null && a < 1) hex += toHex(a * 255);
    return hex;
}
function formatRgb({ r, g, b, a }) {
    return (a != null && a < 1)
        ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(2)})`
        : `rgb(${r}, ${g}, ${b})`;
}
function formatHsl({ r, g, b, a }) {
    const { h, s, l } = rgbToHsl(r, g, b);
    return (a != null && a < 1)
        ? `hsla(${h}, ${s}%, ${l}%, ${+a.toFixed(2)})`
        : `hsl(${h}, ${s}%, ${l}%)`;
}

// Relative luminance → pick readable text color for a swatch.
function readableTextColor({ r, g, b }) {
    const srgb = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return lum > 0.5 ? '#000000' : '#ffffff';
}

if (typeof window !== 'undefined') {
    Object.assign(window, { parseHex, parseRgb, parseHsl, hslToRgb, rgbToHsl, formatHex, formatRgb, formatHsl });
}

/* ---------- UI wiring ---------- */

document.addEventListener('DOMContentLoaded', function () {
    const hexInput = document.getElementById('hexInput');
    const rgbInput = document.getElementById('rgbInput');
    const hslInput = document.getElementById('hslInput');
    const picker = document.getElementById('colorPicker');
    const swatch = document.getElementById('colorSwatch');
    const swatchText = document.getElementById('swatchText');
    const shadesRow = document.getElementById('shadesRow');
    if (!hexInput) return; // not on this page

    function setError(input, bad) {
        input.style.borderColor = bad ? '#dc3545' : '';
    }

    function render(color, sourceEl) {
        // Update the inputs that are NOT the one being edited.
        if (sourceEl !== hexInput) hexInput.value = formatHex(color);
        if (sourceEl !== rgbInput) rgbInput.value = formatRgb(color);
        if (sourceEl !== hslInput) hslInput.value = formatHsl(color);
        const solid = { r: color.r, g: color.g, b: color.b };
        if (picker) picker.value = '#' + toHex(color.r) + toHex(color.g) + toHex(color.b);
        if (swatch) {
            swatch.style.background = formatRgb(color);
            swatchText.style.color = readableTextColor(solid);
            swatchText.textContent = formatHex(color).toUpperCase();
        }
        renderShades(solid);
    }

    function renderShades(color) {
        if (!shadesRow) return;
        const { h, s } = rgbToHsl(color.r, color.g, color.b);
        shadesRow.innerHTML = '';
        [90, 75, 60, 45, 30, 15].forEach(l => {
            const rgb = hslToRgb(h, s / 100, l / 100);
            const hex = formatHex({ r: rgb.r, g: rgb.g, b: rgb.b, a: 1 });
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'shade-cell';
            cell.style.background = hex;
            cell.title = `${hex} — click to copy`;
            cell.setAttribute('aria-label', `Shade ${hex}, click to copy`);
            cell.addEventListener('click', function () {
                copyToClipboard(hex).then(() => showToast('Copied ' + hex));
            });
            shadesRow.appendChild(cell);
        });
    }

    function handle(input, parser) {
        input.addEventListener('input', function () {
            const color = parser(input.value);
            if (color) { setError(input, false); render(color, input); }
            else { setError(input, input.value.trim() !== ''); }
        });
    }

    handle(hexInput, parseHex);
    handle(rgbInput, parseRgb);
    handle(hslInput, parseHsl);

    if (picker) {
        picker.addEventListener('input', function () {
            const color = parseHex(picker.value);
            if (color) render(color, null);
            trackEvent('tool_start', { tool: 'color_converter' });
        });
    }

    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', function () {
            const el = document.getElementById(btn.getAttribute('data-copy'));
            if (el && el.value) copyToClipboard(el.value).then(() => showToast('Copied!'));
        });
    });

    // Initial color.
    render(parseHex('#3b82f6'), null);
});
