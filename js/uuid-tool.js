// UUID Generator Tool
// Supports v4 (random, native), v7 (timestamp-sortable), v1 (timestamp+node),
// and v5 (namespace+name, deterministic, via native SHA-1) — plus format
// options (uppercase / no hyphens / braces) and bulk CSV/JSON export.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

// ---------- Pure helpers ----------

function bytesToUuidString(bytes) {
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' +
        hex.slice(16, 20) + '-' + hex.slice(20, 32);
}

function uuidToBytes(uuidStr) {
    const hex = uuidStr.replace(/-/g, '');
    if (hex.length !== 32 || /[^0-9a-fA-F]/.test(hex)) throw new Error('Invalid namespace UUID.');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
}

function applyFormat(uuidStr, fmt) {
    let out = uuidStr;
    if (fmt.uppercase) out = out.toUpperCase();
    if (fmt.noHyphens) out = out.replace(/-/g, '');
    if (fmt.braces) out = '{' + out + '}';
    return out;
}

const NAMESPACES = {
    dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
};

// ---------- Version generators ----------

// v7 (RFC 9562 §5.7): 48-bit ms timestamp + version/variant + random bits.
function generateUuidV7() {
    const ms = Date.now();
    const bytes = new Uint8Array(16);
    bytes[0] = Math.floor(ms / 2 ** 40) & 0xff;
    bytes[1] = Math.floor(ms / 2 ** 32) & 0xff;
    bytes[2] = Math.floor(ms / 2 ** 24) & 0xff;
    bytes[3] = (ms >>> 16) & 0xff;
    bytes[4] = (ms >>> 8) & 0xff;
    bytes[5] = ms & 0xff;

    const rand = crypto.getRandomValues(new Uint8Array(10));
    bytes[6] = (rand[0] & 0x0f) | 0x70; // version 7
    bytes[7] = rand[1];
    bytes[8] = (rand[2] & 0x3f) | 0x80; // variant
    bytes.set(rand.subarray(3, 10), 9);

    return bytesToUuidString(bytes);
}

// v1 (RFC 4122 §4.2): 60-bit "time" (Gregorian-epoch 100ns intervals) + clock
// sequence + node. Browsers have no real MAC, so node is randomized with the
// multicast bit set (§4.5) — this generator has ms, not true 100ns, precision.
function generateUuidV1() {
    const GREGORIAN_OFFSET_MS = 12219292800000n;
    const nowMs = BigInt(Date.now());
    const subMsTicks = BigInt(Math.floor(Math.random() * 10000));
    const ts100ns = (nowMs + GREGORIAN_OFFSET_MS) * 10000n + subMsTicks;

    const timeLow = ts100ns & 0xffffffffn;
    const timeMid = (ts100ns >> 32n) & 0xffffn;
    const timeHiAndVersion = ((ts100ns >> 48n) & 0x0fffn) | 0x1000n; // version 1

    const bytes = new Uint8Array(16);
    for (let i = 0; i < 4; i++) bytes[3 - i] = Number((timeLow >> BigInt(i * 8)) & 0xffn);
    for (let i = 0; i < 2; i++) bytes[5 - i] = Number((timeMid >> BigInt(i * 8)) & 0xffn);
    for (let i = 0; i < 2; i++) bytes[7 - i] = Number((timeHiAndVersion >> BigInt(i * 8)) & 0xffn);

    const clockSeq = crypto.getRandomValues(new Uint8Array(2));
    bytes[8] = 0x80 | (clockSeq[0] & 0x3f); // variant
    bytes[9] = clockSeq[1];

    const node = crypto.getRandomValues(new Uint8Array(6));
    node[0] |= 0x01; // mark as random/multicast node id — not a real MAC (RFC 4122 §4.5)
    bytes.set(node, 10);

    return bytesToUuidString(bytes);
}

// v5 (RFC 4122 §4.3): SHA-1(namespace bytes + name UTF-8 bytes), first 16
// bytes, version/variant set. Deterministic — same inputs, same UUID.
async function generateUuidV5(namespaceUuid, name) {
    const nsBytes = uuidToBytes(namespaceUuid);
    const nameBytes = new TextEncoder().encode(name);
    const combined = new Uint8Array(nsBytes.length + nameBytes.length);
    combined.set(nsBytes, 0);
    combined.set(nameBytes, nsBytes.length);

    const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
    const hb = new Uint8Array(hashBuffer).slice(0, 16);
    hb[6] = (hb[6] & 0x0f) | 0x50; // version 5
    hb[8] = (hb[8] & 0x3f) | 0x80; // variant

    return bytesToUuidString(hb);
}

async function generateByVersion(version, opts) {
    switch (version) {
        case 'v4': return crypto.randomUUID();
        case 'v7': return generateUuidV7();
        case 'v1': return generateUuidV1();
        case 'v5': return generateUuidV5(opts.namespace, opts.name);
        default: throw new Error('Unknown UUID version.');
    }
}

const VERSION_LABELS = { v4: 'UUID v4', v7: 'UUID v7', v1: 'UUID v1', v5: 'UUID v5' };

document.addEventListener('DOMContentLoaded', function () {
    const generateBtn = document.getElementById('generateBtn');
    const generateBulkBtn = document.getElementById('generateBulkBtn');
    const bulkCount = document.getElementById('bulkCount');
    const bulkOutput = document.getElementById('output');
    const singleOutput = document.getElementById('singleOutput');
    const copyBtn = document.getElementById('copyBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const countBadge = document.getElementById('uuidCountBadge');
    const versionSelect = document.getElementById('versionSelect');
    const versionBadge = document.getElementById('versionBadge');
    const namespaceFields = document.getElementById('namespaceFields');
    const namespaceSelect = document.getElementById('namespaceSelect');
    const customNamespaceInput = document.getElementById('customNamespaceInput');
    const nameInput = document.getElementById('nameInput');
    const fmtUppercase = document.getElementById('fmtUppercase');
    const fmtNoHyphens = document.getElementById('fmtNoHyphens');
    const fmtBraces = document.getElementById('fmtBraces');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const errorContainer = document.getElementById('errorContainer');

    let currentSingle = '';

    function showError(msg) {
        if (!errorContainer) return;
        errorContainer.textContent = msg;
        errorContainer.style.display = 'block';
    }
    function clearError() {
        if (errorContainer) errorContainer.style.display = 'none';
    }

    function currentFormat() {
        return {
            uppercase: !!(fmtUppercase && fmtUppercase.checked),
            noHyphens: !!(fmtNoHyphens && fmtNoHyphens.checked),
            braces: !!(fmtBraces && fmtBraces.checked)
        };
    }

    function currentNamespace() {
        if (!namespaceSelect) return NAMESPACES.dns;
        if (namespaceSelect.value === 'custom') return (customNamespaceInput && customNamespaceInput.value.trim()) || '';
        return NAMESPACES[namespaceSelect.value];
    }

    function needsNamespace(version) { return version === 'v5'; }

    function updateVersionUI() {
        const version = versionSelect ? versionSelect.value : 'v4';
        if (versionBadge) versionBadge.textContent = VERSION_LABELS[version] || 'UUID';
        if (namespaceFields) namespaceFields.style.display = needsNamespace(version) ? 'block' : 'none';
    }

    if (versionSelect) {
        versionSelect.addEventListener('change', function () {
            updateVersionUI();
            clearError();
        });
    }
    if (namespaceSelect) {
        namespaceSelect.addEventListener('change', function () {
            if (customNamespaceInput) customNamespaceInput.style.display = namespaceSelect.value === 'custom' ? 'inline-block' : 'none';
        });
    }

    function setSingle(uuid) {
        currentSingle = uuid;
        if (singleOutput) singleOutput.textContent = uuid;
    }

    function renderBulk(uuids) {
        bulkOutput.innerHTML = uuids.map(u =>
            `<div class="uuid-list-item">${u}</div>`
        ).join('');
        bulkOutput.classList.add('has-content');
        if (copyAllBtn) copyAllBtn.style.display = '';
        if (countBadge) countBadge.textContent = uuids.length + ' UUIDs generated';
    }

    function getBulkText() {
        return Array.from(bulkOutput.querySelectorAll('.uuid-list-item'))
            .map(el => el.textContent).join('\n');
    }
    function getBulkArray() {
        return Array.from(bulkOutput.querySelectorAll('.uuid-list-item')).map(el => el.textContent);
    }

    async function validateForGenerate(version) {
        if (needsNamespace(version)) {
            const ns = currentNamespace();
            const name = nameInput ? nameInput.value.trim() : '';
            if (!ns) { showError('Choose a namespace or enter a custom namespace UUID.'); return null; }
            if (!name) { showError('Enter a name to hash (v5 requires a namespace + name).'); return null; }
            try { uuidToBytes(ns); } catch (e) { showError('Custom namespace must be a valid UUID.'); return null; }
            return { namespace: ns, name: name };
        }
        return {};
    }

    // Generate one on load
    setSingle(crypto.randomUUID());
    updateVersionUI();

    if (generateBtn) {
        generateBtn.addEventListener('click', async function () {
            clearError();
            const version = versionSelect ? versionSelect.value : 'v4';
            const opts = await validateForGenerate(version);
            if (!opts) return;
            try {
                const raw = await generateByVersion(version, opts);
                setSingle(applyFormat(raw, currentFormat()));
                trackEvent('generate_uuid', { count: 1, version: version });
            } catch (e) {
                showError(e.message);
            }
        });
    }

    if (generateBulkBtn) {
        generateBulkBtn.addEventListener('click', async function () {
            clearError();
            const version = versionSelect ? versionSelect.value : 'v4';
            const opts = await validateForGenerate(version);
            if (!opts) return;
            const count = Math.min(parseInt(bulkCount.value) || 10, 100);
            try {
                const fmt = currentFormat();
                const uuids = [];
                for (let i = 0; i < count; i++) {
                    uuids.push(applyFormat(await generateByVersion(version, opts), fmt));
                }
                renderBulk(uuids);
                trackEvent('generate_uuid', { count, version: version });
            } catch (e) {
                showError(e.message);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (!currentSingle) return;
            copyToClipboard(currentSingle)
                .then(() => showToast('Copied!'))
                .catch(() => {});
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', function () {
            const text = getBulkText();
            if (!text) return;
            copyToClipboard(text)
                .then(() => showToast('All UUIDs copied!'))
                .catch(() => {});
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function () {
            const rows = getBulkArray();
            if (!rows.length) { showError('Generate some UUIDs first.'); return; }
            downloadFile('uuid\n' + rows.join('\n'), 'uuids.csv', 'text/csv');
            trackEvent('export_uuids', { format: 'csv', count: rows.length });
        });
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', function () {
            const rows = getBulkArray();
            if (!rows.length) { showError('Generate some UUIDs first.'); return; }
            downloadFile(JSON.stringify(rows, null, 2), 'uuids.json', 'application/json');
            trackEvent('export_uuids', { format: 'json', count: rows.length });
        });
    }
});
