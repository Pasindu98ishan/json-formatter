// CRON Expression Generator & Tester — pure JS, no external libraries.
(function () {
    'use strict';

    var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DOW_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // ── Field matching ──────────────────────────────────────────────────────

    function matchField(value, expr, min) {
        expr = expr.trim();
        if (expr === '*') return true;
        if (expr.indexOf(',') !== -1) {
            return expr.split(',').some(function(p) { return matchField(value, p.trim(), min); });
        }
        if (expr.indexOf('/') !== -1) {
            var parts = expr.split('/');
            var range = parts[0], step = parseInt(parts[1], 10);
            if (isNaN(step) || step <= 0) return false;
            if (range === '*') return (value - min) % step === 0;
            if (range.indexOf('-') !== -1) {
                var bounds = range.split('-');
                var lo = parseInt(bounds[0], 10), hi = parseInt(bounds[1], 10);
                return value >= lo && value <= hi && (value - lo) % step === 0;
            }
            var base = parseInt(range, 10);
            return value >= base && (value - base) % step === 0;
        }
        if (expr.indexOf('-') !== -1) {
            var ab = expr.split('-');
            return value >= parseInt(ab[0], 10) && value <= parseInt(ab[1], 10);
        }
        return value === parseInt(expr, 10);
    }

    function cronMatches(date, fields) {
        var min = date.getMinutes(), hr = date.getHours();
        var dom = date.getDate(), mon = date.getMonth() + 1, dow = date.getDay();
        var domWild = fields.dom === '*', dowWild = fields.dow === '*';
        var dayOk;
        if (domWild && dowWild)  dayOk = true;
        else if (domWild)        dayOk = matchField(dow, fields.dow, 0);
        else if (dowWild)        dayOk = matchField(dom, fields.dom, 1);
        else                     dayOk = matchField(dom, fields.dom, 1) || matchField(dow, fields.dow, 0);
        return matchField(min, fields.minute, 0) && matchField(hr, fields.hour, 0) &&
               matchField(mon, fields.month, 1) && dayOk;
    }

    // ── Next-runs calculator ─────────────────────────────────────────────────

    function nextRuns(fields, count) {
        var runs = [], now = new Date();
        var cur = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
        var limit = 525960; // 1 year
        for (var i = 0; runs.length < count && i < limit; i++, cur = new Date(cur.getTime() + 60000)) {
            if (cronMatches(cur, fields)) runs.push(new Date(cur));
        }
        return runs;
    }

    // ── Description builder ──────────────────────────────────────────────────

    function describeValue(v, names) {
        var n = parseInt(v, 10);
        return names && names[n] ? names[n] : v;
    }

    function describeField(expr, unit, names) {
        expr = expr.trim();
        if (expr === '*' || expr === '*/1') return 'every ' + unit;
        if (/^\*\/\d+$/.test(expr)) return 'every ' + expr.split('/')[1] + ' ' + unit + 's';
        if (/^\d+-\d+\/\d+$/.test(expr)) {
            var p = expr.split('/'), r = p[0].split('-');
            return 'every ' + p[1] + ' ' + unit + 's from ' + describeValue(r[0], names) + ' through ' + describeValue(r[1], names);
        }
        if (/^\d+-\d+$/.test(expr)) {
            var r2 = expr.split('-');
            return describeValue(r2[0], names) + ' through ' + describeValue(r2[1], names);
        }
        if (expr.indexOf(',') !== -1) return expr.split(',').map(function(p) { return describeValue(p.trim(), names); }).join(', ');
        return describeValue(expr, names);
    }

    function describeCron(fields) {
        var parts = [];
        // Time
        if (fields.minute === '*' && fields.hour === '*') {
            parts.push('every minute');
        } else if (fields.minute === '0' && fields.hour === '*') {
            parts.push('at the start of every hour');
        } else if (fields.hour === '*') {
            parts.push('at minute ' + fields.minute + ' of every hour');
        } else if (/^\d+$/.test(fields.hour) && /^\d+$/.test(fields.minute)) {
            parts.push('at ' + fields.hour.padStart(2, '0') + ':' + fields.minute.padStart(2, '0'));
        } else {
            parts.push('at ' + describeField(fields.minute, 'minute') + ' past ' + describeField(fields.hour, 'hour'));
        }
        // Day
        if (fields.dom !== '*' || fields.dow !== '*') {
            if (fields.dom !== '*' && fields.dow === '*') {
                parts.push('on day ' + describeField(fields.dom, 'day') + ' of the month');
            } else if (fields.dom === '*' && fields.dow !== '*') {
                parts.push('on ' + describeField(fields.dow, 'weekday', DOW_NAMES));
            } else {
                parts.push('on day ' + describeField(fields.dom, 'day') + ' or ' + describeField(fields.dow, 'weekday', DOW_NAMES));
            }
        }
        // Month
        if (fields.month !== '*') parts.push('in ' + describeField(fields.month, 'month', MONTH_NAMES));
        var s = parts.join(', ');
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ── Validation ───────────────────────────────────────────────────────────

    function validateField(expr, min, max, label) {
        if (!expr || !expr.trim()) return label + ': cannot be empty';
        var ok = false;
        for (var v = min; v <= max; v++) { if (matchField(v, expr, min)) { ok = true; break; } }
        if (!ok) return label + ': "' + expr.trim() + '" matches no valid values (' + min + '–' + max + ')';
        return null;
    }

    function validateCron(fields) {
        return [
            validateField(fields.minute, 0, 59, 'Minute'),
            validateField(fields.hour,   0, 23, 'Hour'),
            validateField(fields.dom,    1, 31, 'Day-of-month'),
            validateField(fields.month,  1, 12, 'Month'),
            validateField(fields.dow,    0,  6, 'Day-of-week'),
        ].filter(Boolean);
    }

    // ── UI ───────────────────────────────────────────────────────────────────

    function trackEvent(action, params) {
        if (typeof gtag === 'function') gtag('event', action, params || {});
    }

    document.addEventListener('DOMContentLoaded', function () {
        var cronInput    = document.getElementById('cronInput');
        var parseBtn     = document.getElementById('parseBtn');
        var copyBtn      = document.getElementById('copyCronBtn');
        var descEl       = document.getElementById('cronDescription');
        var runsEl       = document.getElementById('nextRunsList');
        var errorEl      = document.getElementById('cronError');

        var fieldInputs = {
            minute : document.getElementById('cronMinute'),
            hour   : document.getElementById('cronHour'),
            dom    : document.getElementById('cronDay'),
            month  : document.getElementById('cronMonth'),
            dow    : document.getElementById('cronWeekday'),
        };

        function pad(n) { return String(n).padStart(2, '0'); }

        function formatDate(d) {
            return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
                   ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':00';
        }

        function showError(msg) {
            if (!errorEl) return;
            errorEl.textContent = msg || '';
            errorEl.style.display = msg ? 'block' : 'none';
        }

        function render(fields) {
            var errs = validateCron(fields);
            if (errs.length) {
                showError(errs[0]);
                if (descEl) descEl.textContent = '';
                if (runsEl) runsEl.innerHTML = '';
                return;
            }
            showError('');
            if (descEl) descEl.textContent = describeCron(fields);
            if (runsEl) {
                var runs = nextRuns(fields, 5);
                runsEl.innerHTML = runs.length
                    ? runs.map(function(d) { return '<li class="cron-run-item">' + formatDate(d) + '</li>'; }).join('')
                    : '<li class="cron-run-item">No runs found in the next year.</li>';
            }
        }

        function parseCron(expr) {
            var parts = expr.trim().split(/\s+/);
            if (parts.length !== 5) return null;
            return { minute: parts[0], hour: parts[1], dom: parts[2], month: parts[3], dow: parts[4] };
        }

        function syncFromExpression() {
            if (!cronInput) return;
            var fields = parseCron(cronInput.value);
            if (!fields) {
                showError('Expression must have exactly 5 space-separated fields: minute hour day month weekday');
                if (descEl) descEl.textContent = '';
                if (runsEl) runsEl.innerHTML = '';
                return;
            }
            Object.keys(fieldInputs).forEach(function(k) {
                if (fieldInputs[k]) fieldInputs[k].value = fields[k];
            });
            render(fields);
        }

        function syncFromFields() {
            var fields = {};
            Object.keys(fieldInputs).forEach(function(k) {
                fields[k] = fieldInputs[k] ? (fieldInputs[k].value.trim() || '*') : '*';
            });
            var expr = fields.minute + ' ' + fields.hour + ' ' + fields.dom + ' ' + fields.month + ' ' + fields.dow;
            if (cronInput) cronInput.value = expr;
            render(fields);
        }

        if (cronInput) {
            cronInput.addEventListener('input', syncFromExpression);
            cronInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); syncFromExpression(); }
            });
        }
        if (parseBtn) parseBtn.addEventListener('click', syncFromExpression);

        Object.values(fieldInputs).forEach(function(el) {
            if (el) el.addEventListener('input', syncFromFields);
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var val = cronInput ? cronInput.value.trim() : '';
                if (!val) return;
                var p = (typeof copyToClipboard === 'function')
                    ? copyToClipboard(val)
                    : navigator.clipboard.writeText(val);
                p.then(function() { if (typeof showToast === 'function') showToast('Copied!'); }).catch(function(){});
                trackEvent('copy_output', { tool: 'cron' });
            });
        }

        document.querySelectorAll('[data-cron-preset]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var preset = this.getAttribute('data-cron-preset');
                if (cronInput) cronInput.value = preset;
                syncFromExpression();
                trackEvent('tool_start', { tool: 'cron', preset: preset });
            });
        });

        // Init
        syncFromExpression();
    });
})();
