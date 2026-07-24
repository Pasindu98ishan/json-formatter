// JWT Encoder / Signer Tool — HS256/HS384/HS512, 100% client-side via Web Crypto.
// The secret never leaves the browser. No network calls.

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

// Base64url-encode an ArrayBuffer or Uint8Array.
function base64UrlFromBytes(bytes) {
    let bin = '';
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Base64url-encode a UTF-8 string.
function base64UrlFromString(str) {
    const bytes = new TextEncoder().encode(str);
    return base64UrlFromBytes(bytes);
}

const HASH_FOR = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };

// Sign a JWT. Returns { token } or throws on bad JSON.
async function signJwt(headerObj, payloadObj, secret, alg) {
    const hash = HASH_FOR[alg] || 'SHA-256';
    const headerB64 = base64UrlFromString(JSON.stringify(headerObj));
    const payloadB64 = base64UrlFromString(JSON.stringify(payloadObj));
    const signingInput = headerB64 + '.' + payloadB64;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: { name: hash } },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
    const sigB64 = base64UrlFromBytes(sig);
    return signingInput + '.' + sigB64;
}

if (typeof window !== 'undefined') {
    Object.assign(window, { base64UrlFromString, base64UrlFromBytes, signJwt });
}

document.addEventListener('DOMContentLoaded', function () {
    const algSelect = document.getElementById('algSelect');
    const headerInput = document.getElementById('headerInput');
    const payloadInput = document.getElementById('payloadInput');
    const secretInput = document.getElementById('secretInput');
    const tokenOutput = document.getElementById('tokenOutput');
    const statusEl = document.getElementById('jwtStatus');
    const signBtn = document.getElementById('signBtn');
    const copyBtn = document.getElementById('copyTokenBtn');
    const addIatBtn = document.getElementById('addIatBtn');
    const addExpBtn = document.getElementById('addExpBtn');
    if (!payloadInput) return;

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'jwt-status ' + (kind || 'muted');
    }

    function syncHeaderAlg() {
        // Keep the header's "alg" in step with the dropdown, if header is valid JSON.
        try {
            const h = JSON.parse(headerInput.value);
            h.alg = algSelect.value;
            if (!h.typ) h.typ = 'JWT';
            headerInput.value = JSON.stringify(h, null, 2);
        } catch (_) { /* leave header as-is if user is mid-edit */ }
    }

    async function doSign() {
        tokenOutput.value = '';
        let headerObj, payloadObj;
        try {
            headerObj = JSON.parse(headerInput.value);
        } catch (e) {
            setStatus('✗ Header is not valid JSON: ' + e.message, 'err');
            return;
        }
        try {
            payloadObj = JSON.parse(payloadInput.value);
        } catch (e) {
            setStatus('✗ Payload is not valid JSON: ' + e.message, 'err');
            return;
        }
        if (!secretInput.value) {
            setStatus('✗ Enter a secret to sign with.', 'err');
            return;
        }
        try {
            const token = await signJwt(headerObj, payloadObj, secretInput.value, algSelect.value);
            tokenOutput.value = token;
            const parts = token.split('.');
            setStatus(`✓ Signed with ${algSelect.value} — ${token.length} chars (${parts[0].length}·${parts[1].length}·${parts[2].length})`, 'ok');
            trackEvent('sign_jwt', { alg: algSelect.value });
        } catch (e) {
            setStatus('✗ Signing failed: ' + e.message, 'err');
        }
    }

    function patchPayload(mutator) {
        let p;
        try { p = JSON.parse(payloadInput.value); }
        catch { setStatus('✗ Fix the payload JSON first.', 'err'); return; }
        mutator(p);
        payloadInput.value = JSON.stringify(p, null, 2);
    }

    if (signBtn) signBtn.addEventListener('click', doSign);
    if (algSelect) algSelect.addEventListener('change', function () { syncHeaderAlg(); doSign(); });
    [headerInput, payloadInput, secretInput].forEach(el =>
        el.addEventListener('input', debounce(doSign, 400))
    );

    if (addIatBtn) addIatBtn.addEventListener('click', () =>
        patchPayload(p => { p.iat = Math.floor(Date.now() / 1000); doSign(); }));
    if (addExpBtn) addExpBtn.addEventListener('click', () =>
        patchPayload(p => { p.exp = Math.floor(Date.now() / 1000) + 3600; doSign(); }));

    if (copyBtn) copyBtn.addEventListener('click', function () {
        if (!tokenOutput.value) { setStatus('Nothing to copy yet.', 'muted'); return; }
        copyToClipboard(tokenOutput.value).then(() => showToast('Token copied!'));
    });

    // Initial sign so the page shows a live example.
    doSign();
});
