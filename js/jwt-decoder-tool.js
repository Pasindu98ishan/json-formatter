// JWT Decoder Tool

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad === 1) throw new Error('Invalid base64url string length');
    if (pad) str += '='.repeat(4 - pad);
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        throw new Error('Invalid base64url encoding in token');
    }
}

function formatTimestamp(ts) {
    if (ts === undefined || ts === null || typeof ts !== 'number') return null;
    const d = new Date(ts * 1000);
    return d.toUTCString() + ' (' + d.toISOString() + ')';
}

function getTokenValidity(payload) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp !== undefined && now > payload.exp) {
        const ago = Math.round((now - payload.exp) / 60);
        return { status: 'expired', label: 'Expired', detail: ago + ' minute(s) ago' };
    }
    if (payload.nbf !== undefined && now < payload.nbf) {
        const in_ = Math.round((payload.nbf - now) / 60);
        return { status: 'not-yet-valid', label: 'Not Yet Valid', detail: 'valid in ' + in_ + ' minute(s)' };
    }
    if (payload.exp !== undefined) {
        const remaining = Math.round((payload.exp - now) / 60);
        return { status: 'active', label: 'Active', detail: 'expires in ' + remaining + ' minute(s)' };
    }
    return { status: 'active', label: 'Active', detail: 'no expiry set' };
}

function showError(msg) {
    const el = document.getElementById('errorContainer');
    if (el) { el.textContent = '⚠️ ' + msg; el.style.display = 'block'; }
}

function clearError() {
    const el = document.getElementById('errorContainer');
    if (el) el.style.display = 'none';
}

function showSection(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyHeaderBtn = document.getElementById('copyHeaderBtn');
    const copyPayloadBtn = document.getElementById('copyPayloadBtn');
    const tokenInput = document.getElementById('tokenInput');

    if (decodeBtn) decodeBtn.addEventListener('click', handleDecode);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (copyHeaderBtn) copyHeaderBtn.addEventListener('click', () => copySection('headerOutput', 'copyHeaderBtn'));
    if (copyPayloadBtn) copyPayloadBtn.addEventListener('click', () => copySection('payloadOutput', 'copyPayloadBtn'));

    showSection('outputSection', false);

    if (typeof initDragDrop === 'function') {
        initDragDrop('tokenInput', function (content) {
            tokenInput.value = content.trim();
        }, ['.txt', '.jwt']);
    }
});

function handleDecode() {
    clearError();
    const token = document.getElementById('tokenInput').value.trim();
    if (!token) { showError('Paste a JWT token to decode.'); return; }

    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('A valid JWT must have exactly 3 parts separated by dots.');

        const headerJson = JSON.parse(base64urlDecode(parts[0]));
        const payloadJson = JSON.parse(base64urlDecode(parts[1]));
        const signature = parts[2];

        const headerFormatted = JSON.stringify(headerJson, null, 2);
        const payloadFormatted = JSON.stringify(payloadJson, null, 2);

        document.getElementById('headerOutput').textContent = headerFormatted;
        document.getElementById('payloadOutput').textContent = payloadFormatted;
        document.getElementById('signatureOutput').textContent = signature;

        // Validity badge
        const validity = getTokenValidity(payloadJson);
        const badge = document.getElementById('validityBadge');
        badge.textContent = validity.label + ' — ' + validity.detail;
        badge.className = 'validity-badge validity-' + validity.status;

        // Timestamp fields
        renderTimestamps(payloadJson);

        showSection('outputSection', true);
        trackEvent('decode_jwt');
    } catch (e) {
        showError(e.message);
        showSection('outputSection', false);
    }
}

function renderTimestamps(payload) {
    const fields = [
        { key: 'exp', label: 'exp (Expiry)' },
        { key: 'iat', label: 'iat (Issued At)' },
        { key: 'nbf', label: 'nbf (Not Before)' }
    ];

    const container = document.getElementById('timestampFields');
    container.innerHTML = '';

    let hasAny = false;
    fields.forEach(function (f) {
        if (payload[f.key] !== undefined) {
            hasAny = true;
            const row = document.createElement('div');
            row.className = 'timestamp-row';
            row.innerHTML = '<span class="ts-key">' + f.label + ':</span> ' +
                '<span class="ts-val">' + payload[f.key] + '</span> &rarr; ' +
                '<span class="ts-human">' + formatTimestamp(payload[f.key]) + '</span>';
            container.appendChild(row);
        }
    });

    showSection('timestampSection', hasAny);
}

function handleClear() {
    document.getElementById('tokenInput').value = '';
    showSection('outputSection', false);
    clearError();
}

function copySection(outputId, btnId) {
    const text = document.getElementById(outputId).textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
        const btn = document.getElementById(btnId);
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(function () { btn.textContent = orig; }, 2000);
        trackEvent('copy_jwt_section', { section: outputId });
    });
}
