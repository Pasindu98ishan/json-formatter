// Chmod Calculator Tool — pure JS, no dependencies (utils.js provides copyToClipboard/showToast)

function trackEvent(action, params = {}) {
    if (typeof gtag === 'function') gtag('event', action, params);
}

document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('permGrid');
    if (!grid) return; // bail if markup absent

    var CLASSES = ['owner', 'group', 'other'];
    var PERMS = ['r', 'w', 'x'];          // 4, 2, 1
    var PERM_VALUE = { r: 4, w: 2, x: 1 };
    var SPECIAL = ['setuid', 'setgid', 'sticky']; // 4, 2, 1
    var SPECIAL_VALUE = { setuid: 4, setgid: 2, sticky: 1 };

    // Plain-English verb list for each of the 8 per-class states (0–7).
    var STATE_WORDS = {
        0: 'cannot access it',
        1: 'can execute only',
        2: 'can write only',
        3: 'can write and execute',
        4: 'can read only',
        5: 'can read and execute',
        6: 'can read and write',
        7: 'can read, write, and execute'
    };
    var CLASS_LABEL = { owner: 'Owner', group: 'Group', other: 'Others' };

    // --- DOM refs ---
    function permBox(cls, p) { return document.getElementById('perm-' + cls + '-' + p); }
    function specialBox(s) { return document.getElementById('special-' + s); }

    var numericOut   = document.getElementById('numericOut');
    var symbolicOut  = document.getElementById('symbolicOut');
    var explainOut   = document.getElementById('explainOut');
    var numericInput = document.getElementById('numericInput');
    var cmdNumeric   = document.getElementById('cmdNumeric');
    var cmdRecursive = document.getElementById('cmdRecursive');
    var cmdSymbolic  = document.getElementById('cmdSymbolic');
    var errorBox     = document.getElementById('errorContainer');

    // --- Read current state from checkboxes ---
    function classDigit(cls) {
        var d = 0;
        PERMS.forEach(function (p) { if (permBox(cls, p).checked) d += PERM_VALUE[p]; });
        return d;
    }
    function specialDigit() {
        var d = 0;
        SPECIAL.forEach(function (s) { if (specialBox(s).checked) d += SPECIAL_VALUE[s]; });
        return d;
    }

    // --- Numeric (octal) ---
    function computeNumeric() {
        var spec = specialDigit();
        var body = '' + classDigit('owner') + classDigit('group') + classDigit('other');
        return spec > 0 ? (spec + body) : body;
    }

    // --- Symbolic display: rwxr-xr-x, with s/S/t/T on the execute slots ---
    function classTriple(cls, specialFlag, isSticky) {
        var r = permBox(cls, 'r').checked ? 'r' : '-';
        var w = permBox(cls, 'w').checked ? 'w' : '-';
        var xOn = permBox(cls, 'x').checked;
        var x;
        if (isSticky) {
            // sticky bit affects the "other" execute slot: t (exec on) / T (exec off)
            x = specialFlag ? (xOn ? 't' : 'T') : (xOn ? 'x' : '-');
        } else {
            // setuid/setgid affect owner/group execute slot: s (exec on) / S (exec off)
            x = specialFlag ? (xOn ? 's' : 'S') : (xOn ? 'x' : '-');
        }
        return r + w + x;
    }
    function computeSymbolic() {
        return classTriple('owner', specialBox('setuid').checked, false) +
               classTriple('group', specialBox('setgid').checked, false) +
               classTriple('other', specialBox('sticky').checked, true);
    }

    // --- Plain-English explanation (covers all 8 states per class) ---
    function explain() {
        return CLASSES.map(function (cls) {
            return CLASS_LABEL[cls] + ' ' + STATE_WORDS[classDigit(cls)] + '.';
        }).join(' ');
    }

    // --- Symbolic command (ABSOLUTE form with '=' — true equivalent of the octal) ---
    function classSymbols(cls) {
        var s = '';
        PERMS.forEach(function (p) { if (permBox(cls, p).checked) s += p; });
        return s; // '' when the class has no permissions
    }
    function symbolicCommand() {
        // Always emit all three classes, including empty ones (o=) so it equals the number.
        return 'u=' + classSymbols('owner') +
               ',g=' + classSymbols('group') +
               ',o=' + classSymbols('other');
    }

    // --- Render everything from current checkbox state ---
    function render(syncNumericInput) {
        var num = computeNumeric();
        if (numericOut)  numericOut.textContent = num;
        if (symbolicOut) symbolicOut.textContent = computeSymbolic();
        if (explainOut)  explainOut.textContent = explain();
        if (cmdNumeric)   cmdNumeric.textContent   = 'chmod ' + num + ' file';
        if (cmdRecursive) cmdRecursive.textContent = 'chmod -R ' + num + ' folder';
        if (cmdSymbolic)  cmdSymbolic.textContent  = 'chmod ' + symbolicCommand() + ' file';
        if (syncNumericInput && numericInput) numericInput.value = num;
        clearError();
    }

    // --- Apply a numeric mode to the checkboxes ---
    function applyNumeric(str) {
        var digits = str.split('').map(Number);
        var spec = 0, o, g, ot;
        if (digits.length === 4) {
            spec = digits[0]; o = digits[1]; g = digits[2]; ot = digits[3];
        } else if (digits.length === 3) {
            o = digits[0]; g = digits[1]; ot = digits[2];
        } else {
            return false;
        }
        var all = [spec, o, g, ot];
        for (var i = 0; i < all.length; i++) { if (all[i] < 0 || all[i] > 7) return false; }

        specialBox('setuid').checked = (spec & 4) !== 0;
        specialBox('setgid').checked = (spec & 2) !== 0;
        specialBox('sticky').checked = (spec & 1) !== 0;
        var map = { owner: o, group: g, other: ot };
        CLASSES.forEach(function (cls) {
            permBox(cls, 'r').checked = (map[cls] & 4) !== 0;
            permBox(cls, 'w').checked = (map[cls] & 2) !== 0;
            permBox(cls, 'x').checked = (map[cls] & 1) !== 0;
        });
        return true;
    }

    // --- Error helper ---
    function showError(msg) {
        if (!errorBox) return;
        errorBox.style.display = 'block';
        errorBox.textContent = '⚠️ ' + msg;
    }
    function clearError() {
        if (errorBox) errorBox.style.display = 'none';
    }

    // --- Wire up ---
    CLASSES.forEach(function (cls) {
        PERMS.forEach(function (p) {
            var box = permBox(cls, p);
            if (box) box.addEventListener('change', function () { render(true); });
        });
    });
    SPECIAL.forEach(function (s) {
        var box = specialBox(s);
        if (box) box.addEventListener('change', function () { render(true); });
    });

    if (numericInput) {
        numericInput.addEventListener('input', function () {
            var v = numericInput.value.trim();
            if (v === '') { clearError(); return; }
            if (!/^[0-7]{3,4}$/.test(v)) {
                showError('Enter a 3- or 4-digit octal mode (each digit 0–7), e.g. 755 or 4755.');
                return;
            }
            if (applyNumeric(v)) {
                render(false); // don't clobber what the user is typing
            } else {
                showError('Invalid mode. Each digit must be 0–7.');
            }
        });
    }

    // Copy buttons: [data-copy] points at the element whose textContent to copy
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = document.getElementById(btn.getAttribute('data-copy'));
            if (!target) return;
            var text = target.textContent.trim();
            if (!text) return;
            copyToClipboard(text).then(function () {
                if (typeof showToast === 'function') showToast('Copied!');
                trackEvent('chmod_copy', { what: btn.getAttribute('data-copy') });
            }).catch(function () {});
        });
    });

    // Initial state: default to 755 (a sane, common example)
    if (!applyNumeric('755')) applyNumeric('644');
    render(true);
    trackEvent('tool_start', { tool: 'chmod' });
});
