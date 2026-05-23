(function () {
    'use strict';

    // ── Mode state (persisted across visits) ─────────────────────────────────
    var smartMode = localStorage.getItem('jsg_smart_mode') === 'true';

    // ── Schema inference engine ──────────────────────────────────────────────

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
                if (opts && opts.smart && value[k] === null) {
                    // Smart Mode: null means "nullable field, type unknown from this sample"
                    schema.properties[k] = {
                        type: ['null', 'string', 'number', 'boolean', 'object', 'array'],
                        description: 'Type inferred as null only — refine after seeing non-null samples'
                    };
                } else {
                    schema.properties[k] = inferSchema(value[k], opts);
                }
                if (value[k] !== null) {
                    schema.required.push(k);
                }
            });
            if (schema.required.length === 0) delete schema.required;
            return schema;
        }

        return {};
    }

    function generate(jsonText, opts) {
        var data = JSON.parse(jsonText);
        var inner = inferSchema(data, opts);
        var schema = Object.assign({ '$schema': 'https://json-schema.org/draft-07/schema#' }, inner);
        return JSON.stringify(schema, null, 2);
    }

    // ── DOM wiring ───────────────────────────────────────────────────────────

    var input          = document.getElementById('jsonInput');
    var output         = document.getElementById('schemaOutput');
    var genBtn         = document.getElementById('generateBtn');
    var clearBtn       = document.getElementById('clearBtn');
    var copyBtn        = document.getElementById('copyOutputBtn');
    var resultBox      = document.getElementById('resultBox');
    var sampleMenu     = document.getElementById('sampleMenu');
    var sampleBtn      = document.getElementById('sampleMenuBtn');
    var modeSimpleBtn  = document.getElementById('modeSimple');
    var modeSmartBtn   = document.getElementById('modeSmart');
    var smartModeBadge = document.getElementById('smartModeBadge');

    var SAMPLES = [
        {
            label: 'User object',
            desc: 'A typical user record with email and role',
            json: JSON.stringify({
                id: 1,
                name: 'Alice',
                email: 'alice@example.com',
                role: 'admin',
                active: true,
                createdAt: '2026-01-15T09:30:00Z'
            }, null, 2)
        },
        {
            label: 'Array of products',
            desc: 'E-commerce product list',
            json: JSON.stringify([
                { sku: 'WIDGET-001', name: 'Blue Widget', price: 9.99, inStock: true, tags: ['sale', 'popular'] },
                { sku: 'GADGET-002', name: 'Smart Gadget', price: 49.99, inStock: false, tags: ['new'] }
            ], null, 2)
        },
        {
            label: 'Kafka event',
            desc: 'Event message with metadata envelope',
            json: JSON.stringify({
                eventId: '550e8400-e29b-41d4-a716-446655440000',
                eventType: 'order.placed',
                timestamp: '2026-05-23T14:22:11Z',
                version: 2,
                payload: {
                    orderId: 'ORD-9981',
                    customerId: 'CUST-4421',
                    totalCents: 4999,
                    currency: 'USD'
                }
            }, null, 2)
        },
        {
            label: 'Nested address',
            desc: 'Object with a nested sub-object',
            json: JSON.stringify({
                firstName: 'Pasindu',
                lastName: 'Ishan',
                age: 28,
                address: {
                    street: '123 Main St',
                    city: 'Colombo',
                    zip: '00100',
                    country: 'LK'
                },
                phoneNumbers: ['+94771234567', '+94112345678']
            }, null, 2)
        }
    ];

    // ── Mode toggle ──────────────────────────────────────────────────────────

    function applyMode() {
        if (!modeSimpleBtn || !modeSmartBtn) return;
        modeSimpleBtn.setAttribute('aria-pressed', String(!smartMode));
        modeSmartBtn.setAttribute('aria-pressed', String(smartMode));
        modeSimpleBtn.classList.toggle('active', !smartMode);
        modeSmartBtn.classList.toggle('active', smartMode);
        if (smartModeBadge) smartModeBadge.style.display = smartMode ? 'flex' : 'none';
    }

    applyMode();

    if (modeSimpleBtn) {
        modeSimpleBtn.addEventListener('click', function () {
            smartMode = false;
            localStorage.setItem('jsg_smart_mode', 'false');
            applyMode();
        });
    }
    if (modeSmartBtn) {
        modeSmartBtn.addEventListener('click', function () {
            smartMode = true;
            localStorage.setItem('jsg_smart_mode', 'true');
            applyMode();
        });
    }

    // ── Result helpers ───────────────────────────────────────────────────────

    function showResult(type, msg) {
        resultBox.className = type === 'ok' ? 'schema-result-ok' : 'schema-result-err';
        resultBox.textContent = msg;
        resultBox.style.display = 'block';
    }

    function hideResult() {
        resultBox.style.display = 'none';
    }

    function doGenerate() {
        var raw = input.value.trim();
        if (!raw) {
            showResult('err', 'Paste a JSON value above to generate a schema.');
            return;
        }
        try {
            var schema = generate(raw, { smart: smartMode });
            output.value = schema;
            showResult('ok', '✓ Schema generated from ' + countFields(schema) + ' field(s). Copy it or open the Schema Validator to test it.');
        } catch (e) {
            output.value = '';
            showResult('err', 'Invalid JSON: ' + e.message);
        }
    }

    function countFields(schemaJson) {
        try {
            var s = JSON.parse(schemaJson);
            return s.properties ? Object.keys(s.properties).length : '?';
        } catch (e) { return '?'; }
    }

    genBtn.addEventListener('click', doGenerate);

    clearBtn.addEventListener('click', function () {
        input.value = '';
        output.value = '';
        hideResult();
        input.focus();
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

    // Sample menu
    SAMPLES.forEach(function (sample, i) {
        var btn = document.createElement('button');
        btn.className = 'example-menu-item';
        btn.innerHTML = sample.label + '<span class="desc">' + sample.desc + '</span>';
        btn.addEventListener('click', function () {
            input.value = sample.json;
            output.value = '';
            hideResult();
            closeSampleMenu();
            input.focus();
        });
        sampleMenu.appendChild(btn);
    });

    function openSampleMenu() {
        sampleMenu.setAttribute('data-open', 'true');
        sampleBtn.setAttribute('aria-expanded', 'true');
    }
    function closeSampleMenu() {
        sampleMenu.setAttribute('data-open', 'false');
        sampleBtn.setAttribute('aria-expanded', 'false');
    }
    sampleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        sampleMenu.getAttribute('data-open') === 'true' ? closeSampleMenu() : openSampleMenu();
    });
    document.addEventListener('click', closeSampleMenu);

    // Copy buttons inside code blocks
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
