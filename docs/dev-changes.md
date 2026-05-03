# Dev Changes — Growth Implementation Plan

Ordered by impact-to-effort ratio. Each item references exact files and functions.

---

## 1. Remove Legal Page Disclaimer Notes

**Impact:** Low risk / must-do before any traffic  
**Files:** `blog/privacy-policy.html:132`, `blog/terms-of-service.html:156`

Both files contain a visible note at the bottom:
> "Note: This is a template. Please customize it according to your specific needs and consult with a legal professional if needed."

**Fix:** Delete that `<p>` tag from both files.

---

## 2. Indentation Selector (2 / 4 / 8 spaces)

**Impact:** High — differentiating UX; `beautifyJSON(str, indent)` already supports it  
**Files:** `formatter.html`, `js/app.js`

### formatter.html
Replace the existing button group (lines 111–118):

```html
<div class="button-group">
    <button id="formatBtn" class="btn btn-primary">Format</button>
    <select id="indentSelect" class="btn btn-secondary" aria-label="Indentation size" style="padding:8px 12px;">
        <option value="2" selected>2 spaces</option>
        <option value="4">4 spaces</option>
        <option value="8">8 spaces</option>
    </select>
    <button id="minifyBtn" class="btn btn-secondary">Minify</button>
    <button id="validateBtn" class="btn btn-secondary">Validate</button>
    <button id="copyBtn" class="btn btn-secondary">Copy</button>
    <button id="downloadBtn" class="btn btn-secondary">Download</button>
    <button id="clearBtn" class="btn btn-secondary">Clear</button>
</div>
```

### js/app.js
In `initializeEventListeners()`, add the select reference:
```js
const indentSelect = document.getElementById('indentSelect');
```

In `handleFormat()`, replace `formatJSON(input)` with:
```js
const indent = parseInt(document.getElementById('indentSelect')?.value || '2');
const formatted = beautifyJSON(input, indent);
```

---

## 3. Sort Keys Toggle

**Impact:** High — heavily requested in tool comparisons; `sortJSONKeys()` already exists at `js/formatter.js:109`  
**Files:** `formatter.html`, `js/app.js`

### formatter.html
Add a checkbox after the indentation selector in the button group:
```html
<label class="btn btn-secondary" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
    <input type="checkbox" id="sortKeysToggle"> Sort Keys
</label>
```

### js/app.js
In `handleFormat()`, after getting `formatted`, add:
```js
const sortKeys = document.getElementById('sortKeysToggle')?.checked;
const result = sortKeys ? sortJSONKeys(formatted) : formatted;
setOutput(result);
treeViewer.render(result);
```

---

## 4. "Try Sample JSON" Button

**Impact:** High for new users — reduces friction on first visit, improves bounce rate  
**Files:** `formatter.html`, `js/app.js`

### formatter.html
Add button to the button group:
```html
<button id="sampleBtn" class="btn btn-secondary">Try Sample</button>
```

### js/app.js
In `initializeEventListeners()`:
```js
const sampleBtn = document.getElementById('sampleBtn');
if (sampleBtn) sampleBtn.addEventListener('click', handleSample);
```

Add the handler:
```js
const SAMPLE_JSON = JSON.stringify({
    "user": {
        "id": 1,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "roles": ["admin", "editor"],
        "address": {
            "city": "New York",
            "country": "US"
        }
    },
    "createdAt": "2026-01-15T10:30:00Z",
    "active": true
}, null, 2);

function handleSample() {
    document.getElementById('inputJSON').value = SAMPLE_JSON;
    const formatted = beautifyJSON(SAMPLE_JSON, 2);
    setOutput(formatted);
    treeViewer.render(formatted);
    clearError();
    trackEvent('load_sample_json');
}
```

---

## 5. BreadcrumbList JSON-LD Schema

**Impact:** Medium SEO — enables breadcrumb display in Google SERPs  
**Files:** All 8 tool pages + `blog/` article template

Add this `<script type="application/ld+json">` block to each tool page's `<head>`, after the existing schemas. Replace `PAGE_NAME` and `PAGE_URL` per file:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://pasindu98ishan.github.io/json-formatter/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "PAGE_NAME",
      "item": "https://pasindu98ishan.github.io/json-formatter/PAGE_URL"
    }
  ]
}
```

**Pages and their values:**

| File | PAGE_NAME | PAGE_URL |
|---|---|---|
| `formatter.html` | JSON Formatter | formatter.html |
| `json-validator.html` | JSON Validator | json-validator.html |
| `json-minifier.html` | JSON Minifier | json-minifier.html |
| `base64.html` | Base64 Encoder | base64.html |
| `url-encoder.html` | URL Encoder | url-encoder.html |
| `timestamp.html` | Timestamp Converter | timestamp.html |
| `json-to-csv.html` | JSON to CSV | json-to-csv.html |
| `json-to-yaml.html` | JSON to YAML | json-to-yaml.html |

For blog posts, use 3-level breadcrumb (Home > Blog > Article Title).

---

## 6. URL-to-JSON Fetcher

**Impact:** High — enables pasting an API URL directly, a top competitor differentiator  
**Files:** `formatter.html`, `js/app.js`

### formatter.html
Add a fetch row above the main editor, inside `<section id="formatter">`:
```html
<div class="url-fetcher" style="margin-bottom:12px;display:flex;gap:8px;">
    <input type="url" id="fetchUrl" placeholder="Paste API URL to fetch JSON (e.g. https://api.example.com/data)"
        style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;">
    <button id="fetchBtn" class="btn btn-secondary">Fetch</button>
</div>
```

### js/app.js
In `initializeEventListeners()`:
```js
const fetchBtn = document.getElementById('fetchBtn');
if (fetchBtn) fetchBtn.addEventListener('click', handleFetch);
```

Add the handler:
```js
async function handleFetch() {
    const url = document.getElementById('fetchUrl').value.trim();
    if (!url) { showError('Enter a URL to fetch'); return; }

    try {
        clearError();
        showSuccess('Fetching...');
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const text = await res.text();
        document.getElementById('inputJSON').value = text;
        const formatted = beautifyJSON(text, 2);
        setOutput(formatted);
        treeViewer.render(formatted);
        clearError();
        trackEvent('fetch_url_json');
    } catch (e) {
        showError('Fetch failed: ' + e.message + '. Check CORS — the API must allow browser requests.');
    }
}
```

> **Note:** Browser CORS restrictions apply. Public APIs with `Access-Control-Allow-Origin: *` work. Private APIs won't work client-side — document this limitation visibly in the UI.

---

## 7. JSON Share Link (LZ-string URL compression)

**Impact:** Very high — viral sharing mechanism; zero backend required  
**Files:** `formatter.html`, `js/app.js`

### Step 1: Add LZ-string library
In `formatter.html`, before the closing `</body>`, add:
```html
<script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
```

### Step 2: Add Share button in formatter.html
```html
<button id="shareBtn" class="btn btn-secondary">Share</button>
```

### Step 3: Add Share Link input row (shows after clicking Share)
```html
<div id="shareContainer" style="display:none;margin-top:10px;">
    <input type="text" id="shareUrl" readonly
        style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px;font-size:13px;"
        aria-label="Shareable URL">
    <small style="color:var(--text-light);">Copy this URL to share your JSON</small>
</div>
```

### Step 4: js/app.js — Wire share button
```js
const shareBtn = document.getElementById('shareBtn');
if (shareBtn) shareBtn.addEventListener('click', handleShare);
```

Add handlers:
```js
function handleShare() {
    const text = getOutput();
    if (!text) { showError('Format JSON first to create a share link.'); return; }

    const compressed = LZString.compressToEncodedURIComponent(text);
    const url = `${location.origin}${location.pathname}?j=${compressed}`;
    document.getElementById('shareUrl').value = url;
    document.getElementById('shareContainer').style.display = 'block';
    navigator.clipboard.writeText(url).then(() => showSuccess('Share link copied!'));
    trackEvent('share_json');
}

function loadSharedJSON() {
    const params = new URLSearchParams(location.search);
    const compressed = params.get('j');
    if (!compressed) return;
    try {
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        if (!json) return;
        document.getElementById('inputJSON').value = json;
        const formatted = beautifyJSON(json, 2);
        setOutput(formatted);
        treeViewer.render(formatted);
    } catch (e) { /* silent — malformed share link */ }
}
```

### Step 5: Call `loadSharedJSON()` on page load
In `DOMContentLoaded` handler, add:
```js
loadSharedJSON();
```

---

## CSS additions for url-fetcher (css/styles.css)

```css
.url-fetcher input[type="url"] {
    background-color: var(--light-bg);
    color: var(--text-dark);
}
body.dark-mode .url-fetcher input[type="url"] {
    background-color: #2d2d2d;
    color: #e0e0e0;
    border-color: #555;
}
```

---

## Implementation Order

1. Legal disclaimer removal — 5 minutes
2. Indentation selector — 30 minutes
3. Sort Keys toggle — 20 minutes
4. Try Sample button — 20 minutes
5. BreadcrumbList schema — 45 minutes (8 files)
6. URL fetcher — 45 minutes
7. JSON Share Link — 1 hour

**Total estimated time: ~4 hours**
