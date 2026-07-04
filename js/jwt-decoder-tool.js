// JWT Decoder Tool
// Decodes header/payload locally, and can optionally VERIFY the signature
// (HMAC/RSA/ECDSA) using the browser's native Web Crypto API — entirely
// client-side, using a secret or public key the user already holds.

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

// Same alphabet fix-up as base64urlDecode, but returns raw bytes (for
// signature verification instead of text decoding).
function base64urlToBytes(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = str.length % 4;
    if (pad) str += '='.repeat(4 - pad);
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
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
        return { status: 'expired', label: 'Expired', detail: ago + ' minute(s) ago', expiringSoon: false };
    }
    if (payload.nbf !== undefined && now < payload.nbf) {
        const in_ = Math.round((payload.nbf - now) / 60);
        return { status: 'not-yet-valid', label: 'Not Yet Valid', detail: 'valid in ' + in_ + ' minute(s)', expiringSoon: false };
    }
    if (payload.exp !== undefined) {
        const remainingSec = payload.exp - now;
        const remaining = Math.round(remainingSec / 60);
        return {
            status: 'active', label: 'Active', detail: 'expires in ' + remaining + ' minute(s)',
            expiringSoon: remainingSec > 0 && remainingSec <= 300 // <= 5 minutes
        };
    }
    return { status: 'active', label: 'Active', detail: 'no expiry set', expiringSoon: false };
}

// ---------- Signature verification (Web Crypto) ----------

const HMAC_HASH = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
const RSA_HASH = { RS256: 'SHA-256', RS384: 'SHA-384', RS512: 'SHA-512' };
const EC_PARAMS = {
    ES256: { hash: 'SHA-256', curve: 'P-256' },
    ES384: { hash: 'SHA-384', curve: 'P-384' },
    ES512: { hash: 'SHA-512', curve: 'P-521' } // ES512 pairs with curve P-521, not P-512
};

function algFamily(alg) {
    if (HMAC_HASH[alg]) return 'HMAC';
    if (RSA_HASH[alg]) return 'RSA';
    if (EC_PARAMS[alg]) return 'EC';
    return null;
}

// Verifies a JWT signature. Throws on malformed key input; otherwise
// resolves to true (signature matches) or false (it does not).
async function verifyJwtSignature(alg, keyInput, signingInputBytes, signatureBytes) {
    const family = algFamily(alg);
    if (!family) throw new Error('unsupported-alg');

    if (family === 'HMAC') {
        const secretBytes = new TextEncoder().encode(keyInput);
        const key = await crypto.subtle.importKey(
            'raw', secretBytes, { name: 'HMAC', hash: HMAC_HASH[alg] }, false, ['verify']
        );
        return crypto.subtle.verify('HMAC', key, signatureBytes, signingInputBytes);
    }

    let jwk;
    try { jwk = JSON.parse(keyInput); }
    catch (e) { throw new Error('Public key must be a JWK (JSON object), e.g. {"kty":"RSA","n":"...","e":"AQAB"}'); }

    if (family === 'RSA') {
        const key = await crypto.subtle.importKey(
            'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: RSA_HASH[alg] }, false, ['verify']
        );
        return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signatureBytes, signingInputBytes);
    }

    // EC (ECDSA) — JOSE signatures are the raw r||s concatenation, which is
    // exactly what SubtleCrypto's ECDSA verify expects (no DER re-encoding needed).
    const cfg = EC_PARAMS[alg];
    const key = await crypto.subtle.importKey(
        'jwk', jwk, { name: 'ECDSA', namedCurve: cfg.curve }, false, ['verify']
    );
    return crypto.subtle.verify({ name: 'ECDSA', hash: cfg.hash }, key, signatureBytes, signingInputBytes);
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

// Holds the most recently decoded token so Verify can run without re-parsing.
let lastDecoded = null; // { alg, signingInput (string), signatureB64url, fullToken }

document.addEventListener('DOMContentLoaded', function () {
    const decodeBtn = document.getElementById('decodeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyHeaderBtn = document.getElementById('copyHeaderBtn');
    const copyPayloadBtn = document.getElementById('copyPayloadBtn');
    const copyFullTokenBtn = document.getElementById('copyFullTokenBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    const tokenInput = document.getElementById('tokenInput');

    if (decodeBtn) decodeBtn.addEventListener('click', handleDecode);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
    if (copyHeaderBtn) copyHeaderBtn.addEventListener('click', () => copySection('headerOutput', 'copyHeaderBtn'));
    if (copyPayloadBtn) copyPayloadBtn.addEventListener('click', () => copySection('payloadOutput', 'copyPayloadBtn'));
    if (copyFullTokenBtn) copyFullTokenBtn.addEventListener('click', handleCopyFullToken);
    if (verifyBtn) verifyBtn.addEventListener('click', handleVerify);

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

        const expiryWarning = document.getElementById('expiryWarning');
        if (expiryWarning) expiryWarning.style.display = validity.expiringSoon ? 'inline-block' : 'none';

        // Algorithm badge
        const algBadge = document.getElementById('algBadge');
        const alg = headerJson.alg;
        if (algBadge) algBadge.textContent = alg ? ('alg: ' + alg) : 'alg: (none)';

        // Timestamp fields
        renderTimestamps(payloadJson);

        // Reset / prepare the verify section for the newly decoded token
        lastDecoded = {
            alg: alg,
            signingInput: parts[0] + '.' + parts[1],
            signatureB64url: signature,
            fullToken: token
        };
        prepareVerifySection(alg);

        showSection('outputSection', true);
        trackEvent('decode_jwt');
    } catch (e) {
        showError(e.message);
        showSection('outputSection', false);
        lastDecoded = null;
    }
}

function prepareVerifySection(alg) {
    const keyLabel = document.getElementById('verifyKeyLabel');
    const keyInput = document.getElementById('verifyKeyInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyResult = document.getElementById('verifyResult');
    const verifyNote = document.getElementById('verifyUnsupportedNote');

    if (verifyResult) { verifyResult.style.display = 'none'; verifyResult.textContent = ''; verifyResult.className = 'validity-badge'; }
    if (keyInput) keyInput.value = '';

    const family = algFamily(alg);
    if (!family) {
        if (keyLabel) keyLabel.textContent = 'Key:';
        if (keyInput) { keyInput.placeholder = ''; keyInput.disabled = true; }
        if (verifyBtn) verifyBtn.disabled = true;
        if (verifyNote) {
            verifyNote.style.display = 'block';
            verifyNote.textContent = 'Verification is not supported for alg "' + (alg || 'unknown') +
                '". Supported: HS256/384/512, RS256/384/512, ES256/384/512.';
        }
        return;
    }

    if (verifyNote) verifyNote.style.display = 'none';
    if (keyInput) keyInput.disabled = false;
    if (verifyBtn) verifyBtn.disabled = false;

    if (family === 'HMAC') {
        if (keyLabel) keyLabel.textContent = 'Secret (plain text):';
        if (keyInput) keyInput.placeholder = 'your-256-bit-secret';
    } else {
        if (keyLabel) keyLabel.textContent = 'Public Key (JWK JSON):';
        if (keyInput) keyInput.placeholder = '{"kty":"RSA","n":"...","e":"AQAB"} (PEM not supported yet)';
    }
}

async function handleVerify() {
    if (!lastDecoded) return;
    const keyInput = document.getElementById('verifyKeyInput');
    const verifyResult = document.getElementById('verifyResult');
    const verifyBtn = document.getElementById('verifyBtn');
    const key = keyInput ? keyInput.value.trim() : '';

    if (!key) { showError('Paste a secret (HS*) or a public key JWK (RS*/ES*) to verify.'); return; }
    clearError();

    if (verifyBtn) verifyBtn.disabled = true;
    if (verifyResult) {
        verifyResult.style.display = 'inline-block';
        verifyResult.className = 'validity-badge validity-not-yet-valid';
        verifyResult.textContent = 'Verifying…';
    }

    try {
        const signatureBytes = base64urlToBytes(lastDecoded.signatureB64url);
        const signingInputBytes = new TextEncoder().encode(lastDecoded.signingInput);
        const ok = await verifyJwtSignature(lastDecoded.alg, key, signingInputBytes, signatureBytes);

        if (verifyResult) {
            verifyResult.textContent = ok ? '✓ Signature Verified' : '✗ Signature Invalid';
            verifyResult.className = 'validity-badge ' + (ok ? 'validity-active' : 'validity-expired');
        }
        trackEvent('verify_jwt', { alg: lastDecoded.alg, result: ok });
    } catch (e) {
        if (verifyResult) {
            verifyResult.textContent = '⚠ Could not verify: ' + e.message;
            verifyResult.className = 'validity-badge validity-not-yet-valid';
        }
    } finally {
        if (verifyBtn) verifyBtn.disabled = false;
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
    lastDecoded = null;
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

function handleCopyFullToken() {
    if (!lastDecoded || !lastDecoded.fullToken) return;
    navigator.clipboard.writeText(lastDecoded.fullToken).then(function () {
        const btn = document.getElementById('copyFullTokenBtn');
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(function () { btn.textContent = orig; }, 2000);
        trackEvent('copy_jwt_full_token');
    });
}
