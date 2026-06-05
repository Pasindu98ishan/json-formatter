(function () {
    'use strict';

    // ── Schema inference engine (copied from json-schema-generator-tool.js) ──────
    // Kept in sync deliberately: the single-sample inference is identical; this tool
    // adds mergeSchemas() on top to fold many inferred schemas into one.

    function inferType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
        return typeof value; // string, boolean, object
    }

    function mergeTypes(schemas, opts) {
        // Collapse identical simple schemas; produce union if mixed
        var unique = [];
        schemas.forEach(function (s) {
            var already = unique.some(function (u) {
                return JSON.stringify(u) === JSON.stringify(s);
            });
            if (!already) unique.push(s);
        });
        if (unique.length === 1) return unique[0];
        // Smart Mode: collapse { type: "X" } + { type: "Y" } → { type: ["X","Y"] }
        if (opts && opts.smart) {
            var allSimple = unique.every(function (s) {
                return Object.keys(s).length === 1 && typeof s.type === 'string';
            });
            if (allSimple) return { type: unique.map(function (s) { return s.type; }) };
        }
        // Multiple distinct types — return anyOf union
        return { anyOf: unique };
    }

    function inferSchema(value, opts) {
        var type = inferType(value);

        if (type === 'null')    return { type: 'null' };
        if (type === 'boolean') return { type: 'boolean' };
        if (type === 'integer') return { type: 'integer' };
        if (type === 'number')  return { type: 'number' };

        if (type === 'string') {
            var s = { type: 'string' };
            // Hint at format
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) s.format = 'date-time';
            else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) s.format = 'date';
            else if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) s.format = 'uuid';
            else if (/^https?:\/\//i.test(value)) s.format = 'uri';
            else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) s.format = 'email';
            return s;
        }

        if (type === 'array') {
            if (value.length === 0) {
                return { type: 'array', items: {} };
            }
            // Sample all items and merge their schemas
            var itemSchemas = value.map(function (item) { return inferSchema(item, opts); });
            return {
                type: 'array',
                items: mergeTypes(itemSchemas, opts)
            };
        }

        if (type === 'object') {
            var keys = Object.keys(value);
            if (keys.length === 0) {
                return { type: 'object' };
            }
            var schema = {
                type: 'object',
                properties: {},
                required: []
            };
            keys.forEach(function (k) {
                // A null here just becomes { type: 'null' }; nullability across the whole
                // sample set is resolved later by mergeSchemas (e.g. ["string","null"]).
                schema.properties[k] = inferSchema(value[k], opts);
                if (value[k] !== null) {
                    schema.required.push(k);
                }
            });
            if (schema.required.length === 0) delete schema.required;
            return schema;
        }

        return {};
    }

    // ── Multi-sample merge ───────────────────────────────────────────────────────
    // Folds two inferred schema fragments into one. The key insight of this tool:
    // a field missing from (or null in) any sample is optional; a field whose type
    // varies across samples becomes a nullable / union type.

    function isEmpty(s) {
        return !s || (typeof s === 'object' && Object.keys(s).length === 0);
    }

    function isObjectSchema(s) {
        return s && (s.type === 'object' || (s.properties && typeof s.properties === 'object'));
    }

    function isArraySchema(s) {
        return s && (s.type === 'array' || Object.prototype.hasOwnProperty.call(s, 'items'));
    }

    // Pull every type token out of a schema fragment (type may be a string or array).
    function typeTokens(s) {
        if (!s) return [];
        if (typeof s.type === 'string') return [s.type];
        if (Array.isArray(s.type)) return s.type.slice();
        return [];
    }

    function uniq(arr) {
        var out = [];
        arr.forEach(function (x) { if (out.indexOf(x) === -1) out.push(x); });
        return out;
    }

    function dedupeSchemas(list) {
        var unique = [];
        list.forEach(function (s) {
            var already = unique.some(function (u) { return JSON.stringify(u) === JSON.stringify(s); });
            if (!already) unique.push(s);
        });
        return unique;
    }

    // Flatten an anyOf wrapper into its member alternatives; otherwise the schema is
    // its own single alternative. This is what lets a later merge see *inside* an anyOf
    // produced by an earlier merge (e.g. object|null) instead of clobbering it.
    function altsOf(s) {
        if (s && Array.isArray(s.anyOf)) return s.anyOf.slice();
        return [s];
    }

    // Merge two object schemas: union of properties, intersection of required.
    function mergeObjects(a, b, opts) {
        var aProps = a.properties || {};
        var bProps = b.properties || {};
        var allKeys = uniq(Object.keys(aProps).concat(Object.keys(bProps)));
        var props = {};
        allKeys.forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(aProps, k) &&
                Object.prototype.hasOwnProperty.call(bProps, k)) {
                props[k] = mergeSchemas(aProps[k], bProps[k], opts);
            } else {
                // Present in only one sample → keep it, but it is now optional
                // (it will not survive the required intersection below).
                props[k] = aProps[k] || bProps[k];
            }
        });
        var aReq = a.required || [];
        var bReq = b.required || [];
        var required = aReq.filter(function (k) { return bReq.indexOf(k) !== -1; });
        var merged = { type: 'object', properties: props };
        if (required.length) merged.required = required;
        return merged;
    }

    function mergeArrays(a, b, opts) {
        var aItems = a.items;
        var bItems = b.items;
        var items;
        if (isEmpty(aItems)) items = bItems || {};
        else if (isEmpty(bItems)) items = aItems;
        else items = mergeSchemas(aItems, bItems, opts);
        return { type: 'array', items: items };
    }

    function mergeSchemas(a, b, opts) {
        if (JSON.stringify(a) === JSON.stringify(b)) return a;
        // An empty {} fragment means "unknown / anything" — defer to the concrete side.
        if (isEmpty(a)) return b;
        if (isEmpty(b)) return a;

        // Flatten any anyOf operands, then sort every alternative into one of three
        // buckets: object schemas, array schemas, and plain scalars. Each bucket is
        // collapsed; buckets that can't merge (object vs scalar) stay separate as anyOf.
        var alts = altsOf(a).concat(altsOf(b));
        var objectAlt = null, arrayAlt = null, scalarTokens = [], scalarFormats = [];

        alts.forEach(function (s) {
            if (isObjectSchema(s)) {
                objectAlt = objectAlt ? mergeObjects(objectAlt, s, opts) : s;
            } else if (isArraySchema(s)) {
                arrayAlt = arrayAlt ? mergeArrays(arrayAlt, s, opts) : s;
            } else {
                typeTokens(s).forEach(function (t) { if (scalarTokens.indexOf(t) === -1) scalarTokens.push(t); });
                scalarFormats.push(s.format); // may be undefined — recorded so we can tell "no format" from "unseen"
            }
        });

        var pieces = [];
        if (objectAlt) pieces.push(objectAlt);
        if (arrayAlt) pieces.push(arrayAlt);
        if (scalarTokens.length === 1) {
            var only = { type: scalarTokens[0] };
            // Preserve a format hint only when every scalar alternative carried the same one.
            var fmt = scalarFormats[0];
            if (fmt && scalarFormats.every(function (f) { return f === fmt; })) only.format = fmt;
            pieces.push(only);
        } else if (scalarTokens.length > 1) {
            pieces.push({ type: scalarTokens });
        }

        if (pieces.length === 1) return pieces[0];
        return { anyOf: dedupeSchemas(pieces) };
    }

    // Parse every non-empty sample, infer each, fold them into one schema document.
    function generateMerged(samples, opts) {
        var inferred = samples.map(function (data) { return inferSchema(data, opts); });
        var merged = inferred.reduce(function (acc, s) {
            return acc === null ? s : mergeSchemas(acc, s, opts);
        }, null);
        if (merged === null) merged = {};
        var schema = Object.assign({ '$schema': 'https://json-schema.org/draft-07/schema#' }, merged);
        return JSON.stringify(schema, null, 2);
    }

    // ── Example sample set (demonstrates optional + nullable detection) ───────────
    var EXAMPLE_SAMPLES = [
        JSON.stringify({
            id: 1,
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1-202-555-0143',
            active: true
        }, null, 2),
        JSON.stringify({
            id: 2,
            name: 'Bob',
            email: 'bob@example.com',
            active: false,
            role: 'admin'
        }, null, 2),
        JSON.stringify({
            id: 3,
            name: 'Carol',
            email: 'carol@example.com',
            phone: null,
            active: true,
            role: 'editor'
        }, null, 2)
    ];

    // ── DOM wiring ───────────────────────────────────────────────────────────────
    var slotsWrap      = document.getElementById('sampleSlots');
    var addSampleBtn   = document.getElementById('addSampleBtn');
    var output         = document.getElementById('schemaOutput');
    var mergeBtn       = document.getElementById('mergeBtn');
    var clearAllBtn    = document.getElementById('clearAllBtn');
    var copyBtn        = document.getElementById('copyOutputBtn');
    var loadExampleBtn = document.getElementById('loadExampleBtn');
    var resultBox      = document.getElementById('resultBox');

    var MIN_SLOTS = 2;
    var MAX_SLOTS = 5;
    var slotSeq = 0;

    function slotCount() {
        return slotsWrap ? slotsWrap.querySelectorAll('.sample-slot').length : 0;
    }

    function updateSlotControls() {
        var n = slotCount();
        if (addSampleBtn) addSampleBtn.disabled = n >= MAX_SLOTS;
        slotsWrap.querySelectorAll('.sample-remove').forEach(function (btn) {
            btn.disabled = n <= MIN_SLOTS;
        });
        // Renumber the slot labels so they stay 1..n after add/remove.
        slotsWrap.querySelectorAll('.sample-slot').forEach(function (slot, i) {
            var label = slot.querySelector('.sample-label');
            if (label) label.textContent = 'Sample ' + (i + 1);
        });
    }

    function addSlot(value) {
        if (slotCount() >= MAX_SLOTS) return;
        var id = ++slotSeq;
        var slot = document.createElement('div');
        slot.className = 'sample-slot';
        slot.innerHTML =
            '<div class="sample-slot-head">' +
                '<span class="sample-label">Sample</span>' +
                '<button type="button" class="sample-remove" aria-label="Remove this sample">&times;</button>' +
            '</div>' +
            '<textarea class="sample-input" spellcheck="false" ' +
                'placeholder="Paste a JSON sample here…"></textarea>' +
            '<div class="sample-error" role="alert"></div>';
        slot.setAttribute('data-slot-id', String(id));
        if (typeof value === 'string') slot.querySelector('.sample-input').value = value;
        slot.querySelector('.sample-remove').addEventListener('click', function () {
            if (slotCount() <= MIN_SLOTS) return;
            slot.parentNode.removeChild(slot);
            updateSlotControls();
        });
        slotsWrap.appendChild(slot);
        updateSlotControls();
        return slot;
    }

    function setSlotError(slot, msg) {
        var box = slot.querySelector('.sample-error');
        if (!box) return;
        if (msg) {
            box.textContent = msg;
            box.style.display = 'block';
            slot.classList.add('has-error');
        } else {
            box.textContent = '';
            box.style.display = 'none';
            slot.classList.remove('has-error');
        }
    }

    // ── Result helpers ───────────────────────────────────────────────────────────
    function showResult(type, msg) {
        resultBox.className = type === 'ok' ? 'schema-result-ok' : 'schema-result-err';
        resultBox.textContent = msg;
        resultBox.style.display = 'block';
    }
    function hideResult() {
        resultBox.style.display = 'none';
    }

    function doMerge() {
        var slots = Array.prototype.slice.call(slotsWrap.querySelectorAll('.sample-slot'));
        var samples = [];
        var hadError = false;
        var filledCount = 0;

        slots.forEach(function (slot) {
            var ta = slot.querySelector('.sample-input');
            var raw = ta.value.trim();
            setSlotError(slot, '');
            if (!raw) return;
            filledCount++;
            try {
                samples.push(JSON.parse(raw));
            } catch (e) {
                hadError = true;
                setSlotError(slot, 'Invalid JSON: ' + e.message);
            }
        });

        if (filledCount === 0) {
            output.value = '';
            showResult('err', 'Paste at least one JSON sample to merge into a schema.');
            return;
        }
        if (samples.length === 0) {
            output.value = '';
            showResult('err', 'No valid samples — fix the JSON errors highlighted above.');
            return;
        }

        // Always emit production-friendly union types (e.g. ["string","null"] for
        // nullable fields) rather than verbose anyOf — this tool has a single output style.
        var schema = generateMerged(samples, { smart: true });
        output.value = schema;

        var fieldCount = countFields(schema);
        var msg = '✓ Schema merged from ' + samples.length + ' sample(s)';
        if (typeof fieldCount === 'number') msg += ', ' + fieldCount + ' top-level field(s)';
        msg += '.';
        if (hadError) msg += ' Some samples were skipped due to JSON errors.';
        showResult(hadError ? 'err' : 'ok', msg);
    }

    function countFields(schemaJson) {
        try {
            var s = JSON.parse(schemaJson);
            return s.properties ? Object.keys(s.properties).length : '?';
        } catch (e) { return '?'; }
    }

    // ── Init slots & listeners ───────────────────────────────────────────────────
    addSlot();
    addSlot();
    addSlot();

    if (addSampleBtn) addSampleBtn.addEventListener('click', function () { addSlot(); });

    mergeBtn.addEventListener('click', doMerge);

    clearAllBtn.addEventListener('click', function () {
        slotsWrap.innerHTML = '';
        slotSeq = 0;
        addSlot();
        addSlot();
        addSlot();
        output.value = '';
        hideResult();
        var first = slotsWrap.querySelector('.sample-input');
        if (first) first.focus();
    });

    loadExampleBtn.addEventListener('click', function () {
        slotsWrap.innerHTML = '';
        slotSeq = 0;
        EXAMPLE_SAMPLES.forEach(function (json) { addSlot(json); });
        output.value = '';
        hideResult();
    });

    copyBtn.addEventListener('click', function () {
        var text = output.value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(function () {
                copyBtn.textContent = 'Copy Schema';
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    });

    // Copy buttons inside info-section code blocks
    document.querySelectorAll('.copy-code-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var pre = btn.nextElementSibling;
            var text = pre ? pre.innerText : '';
            navigator.clipboard.writeText(text).then(function () {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });
    });
})();
