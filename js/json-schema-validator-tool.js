// ============================================
// JSON SCHEMA VALIDATOR TOOL
// Uses Ajv 8 (draft-07/2019/2020) loaded from CDN in the page <head>.
// All validation runs client-side. Multiple samples teach common patterns.
// ============================================

(function() {
    'use strict';

    function trackEvent(action, params) {
        if (typeof gtag === 'function') {
            gtag('event', action, params || {});
        }
    }

    // --------------------------------------------------------------------
    // Sample schemas — progressively teach common JSON Schema patterns.
    // Each sample is paired with a valid JSON document so users see the
    // green path before exploring failure modes themselves.
    // --------------------------------------------------------------------
    const SAMPLES = [
        {
            id: 'user-basic',
            label: 'Basic user',
            description: 'A user object with required name + optional age and email.',
            json: {
                name: 'Alice',
                age: 30,
                email: 'alice@example.com'
            },
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                required: ['name'],
                properties: {
                    name:  { type: 'string', minLength: 1 },
                    age:   { type: 'integer', minimum: 0 },
                    email: { type: 'string', format: 'email' }
                }
            }
        },
        {
            id: 'product-list',
            label: 'Product list',
            description: 'An array of product objects — items keyword with nested validation.',
            json: [
                { sku: 'TSH-001', name: 'T-Shirt', price: 19.99, inStock: true },
                { sku: 'MUG-014', name: 'Coffee Mug', price: 12.50, inStock: false }
            ],
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'array',
                minItems: 1,
                items: {
                    type: 'object',
                    required: ['sku', 'name', 'price'],
                    properties: {
                        sku:     { type: 'string', pattern: '^[A-Z]{3}-\\d{3}$' },
                        name:    { type: 'string' },
                        price:   { type: 'number', exclusiveMinimum: 0 },
                        inStock: { type: 'boolean' }
                    }
                }
            }
        },
        {
            id: 'config-enum',
            label: 'Config with enum',
            description: 'A config with restricted values (enum) and a regex-validated host.',
            json: {
                env: 'production',
                logLevel: 'info',
                host: 'api.example.com',
                port: 443
            },
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                required: ['env', 'host', 'port'],
                additionalProperties: false,
                properties: {
                    env:      { type: 'string', enum: ['development', 'staging', 'production'] },
                    logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
                    host:     { type: 'string', pattern: '^[a-z0-9.-]+$' },
                    port:     { type: 'integer', minimum: 1, maximum: 65535 }
                }
            }
        },
        {
            id: 'nested-order',
            label: 'Nested order',
            description: 'A deeply nested order with shipping address and line items.',
            json: {
                orderId: 'ord_8s2m1p',
                customer: { id: 42, name: 'Jane Doe' },
                shipping: {
                    address: {
                        line1: '123 Main St',
                        city: 'Boston',
                        country: 'US',
                        postalCode: '02101'
                    }
                },
                items: [
                    { sku: 'TSH-001', qty: 2 }
                ],
                total: 39.98
            },
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                required: ['orderId', 'customer', 'shipping', 'items', 'total'],
                properties: {
                    orderId: { type: 'string', pattern: '^ord_[a-z0-9]+$' },
                    customer: {
                        type: 'object',
                        required: ['id', 'name'],
                        properties: {
                            id:   { type: 'integer' },
                            name: { type: 'string' }
                        }
                    },
                    shipping: {
                        type: 'object',
                        required: ['address'],
                        properties: {
                            address: {
                                type: 'object',
                                required: ['line1', 'city', 'country'],
                                properties: {
                                    line1:      { type: 'string' },
                                    city:       { type: 'string' },
                                    country:    { type: 'string', minLength: 2, maxLength: 2 },
                                    postalCode: { type: 'string' }
                                }
                            }
                        }
                    },
                    items: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['sku', 'qty'],
                            properties: {
                                sku: { type: 'string' },
                                qty: { type: 'integer', minimum: 1 }
                            }
                        }
                    },
                    total: { type: 'number', minimum: 0 }
                }
            }
        },
        {
            id: 'oneof-payment',
            label: 'Polymorphic payment (oneOf)',
            description: 'Payment is either a card or a bank transfer — exactly one shape.',
            json: {
                amount: 99.00,
                method: { kind: 'card', last4: '4242', brand: 'Visa' }
            },
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                required: ['amount', 'method'],
                properties: {
                    amount: { type: 'number', exclusiveMinimum: 0 },
                    method: {
                        oneOf: [
                            {
                                type: 'object',
                                required: ['kind', 'last4', 'brand'],
                                properties: {
                                    kind:  { const: 'card' },
                                    last4: { type: 'string', pattern: '^\\d{4}$' },
                                    brand: { type: 'string' }
                                }
                            },
                            {
                                type: 'object',
                                required: ['kind', 'iban'],
                                properties: {
                                    kind: { const: 'bank' },
                                    iban: { type: 'string', minLength: 15 }
                                }
                            }
                        ]
                    }
                }
            }
        },
        {
            id: 'api-response',
            label: 'Paginated API response',
            description: 'Generic API envelope with data array, page, and total count.',
            json: {
                data: [
                    { id: 1, title: 'First post' },
                    { id: 2, title: 'Second post' }
                ],
                page: 1,
                pageSize: 20,
                total: 142
            },
            schema: {
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                required: ['data', 'page', 'pageSize', 'total'],
                properties: {
                    data: {
                        type: 'array',
                        items: { type: 'object' }
                    },
                    page:     { type: 'integer', minimum: 1 },
                    pageSize: { type: 'integer', minimum: 1, maximum: 100 },
                    total:    { type: 'integer', minimum: 0 }
                }
            }
        }
    ];

    function init() {
        const jsonInput        = document.getElementById('jsonInput');
        const schemaInput      = document.getElementById('schemaInput');
        const validateBtn      = document.getElementById('validateBtn');
        const clearBtn         = document.getElementById('clearBtn');
        const resultBox        = document.getElementById('resultBox');
        const exampleMenuBtn   = document.getElementById('exampleMenuBtn');
        const exampleMenu      = document.getElementById('exampleMenu');
        const exampleMenuLabel = document.getElementById('exampleMenuLabel');

        if (!jsonInput || !schemaInput || !validateBtn) {
            console.error('[json-schema-validator] Required DOM elements missing:',
                { jsonInput: !!jsonInput, schemaInput: !!schemaInput, validateBtn: !!validateBtn });
            return;
        }

        // ----------------------------------------------------------------
        // Build example dropdown menu (one entry per sample)
        // ----------------------------------------------------------------
        if (exampleMenu) {
            exampleMenu.innerHTML = SAMPLES.map(function(s) {
                return (
                    '<button type="button" class="example-menu-item" role="menuitem" data-sample="' + s.id + '">' +
                        s.label +
                        '<span class="desc">' + s.description + '</span>' +
                    '</button>'
                );
            }).join('');

            exampleMenu.addEventListener('click', function(e) {
                const btn = e.target.closest('.example-menu-item');
                if (!btn) return;
                loadSample(btn.dataset.sample, true);
                closeMenu();
            });
        }

        function openMenu() {
            if (!exampleMenu) return;
            exampleMenu.dataset.open = 'true';
            exampleMenuBtn.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
            if (!exampleMenu) return;
            exampleMenu.dataset.open = 'false';
            exampleMenuBtn.setAttribute('aria-expanded', 'false');
        }
        if (exampleMenuBtn) {
            exampleMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (exampleMenu.dataset.open === 'true') closeMenu();
                else openMenu();
            });
            document.addEventListener('click', function(e) {
                if (exampleMenu.dataset.open !== 'true') return;
                if (!exampleMenu.contains(e.target) && e.target !== exampleMenuBtn) closeMenu();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeMenu();
            });
        }

        function loadSample(id, autoValidate) {
            const sample = SAMPLES.find(function(s) { return s.id === id; });
            if (!sample) return;
            jsonInput.value   = JSON.stringify(sample.json, null, 2);
            schemaInput.value = JSON.stringify(sample.schema, null, 2);
            if (exampleMenuLabel) exampleMenuLabel.textContent = sample.label;
            if (exampleMenu) {
                exampleMenu.querySelectorAll('.example-menu-item').forEach(function(b) {
                    b.classList.toggle('active', b.dataset.sample === id);
                });
            }
            if (autoValidate) validate();
            trackEvent('load_schema_sample', { sample: id });
        }

        // Pre-load the first sample so the panels aren't empty on first visit.
        // Don't auto-validate — user clicks Validate themselves to confirm the button works.
        loadSample(SAMPLES[0].id, false);

        // ----------------------------------------------------------------
        // Validate handler
        // ----------------------------------------------------------------
        validateBtn.addEventListener('click', validate);

        function validate() {
            if (typeof Ajv === 'undefined') {
                showError('JSON Schema library failed to load. Check your network and refresh.');
                return;
            }

            const jsonRaw   = jsonInput.value.trim();
            const schemaRaw = schemaInput.value.trim();

            if (!jsonRaw)   { showError('Please enter JSON to validate.'); return; }
            if (!schemaRaw) { showError('Please enter a JSON Schema.'); return; }

            let data, schema;
            try {
                data = JSON.parse(jsonRaw);
            } catch (e) {
                showError('Invalid JSON in the data panel: ' + e.message);
                return;
            }
            try {
                schema = JSON.parse(schemaRaw);
            } catch (e) {
                showError('Invalid JSON Schema in the schema panel: ' + e.message);
                return;
            }

            // Ajv 6 options: jsonPointers makes err.dataPath use JSON Pointer
            // format (/users/0/age) which matches what the UI displays.
            const ajv = new Ajv({ allErrors: true, jsonPointers: true });
            // Register the most common formats inline. Ajv 6 ships some built-in
            // but we re-register defensively to ensure consistent behaviour.
            try {
                ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
                ajv.addFormat('uri', /^https?:\/\/[^\s]+$/);
                ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
                ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
                ajv.addFormat('uuid', /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
            } catch (_) { /* already registered */ }

            // Ajv 6 registers draft-07 under http://; normalize https:// URIs so
            // schemas generated by modern tools still compile correctly.
            if (schema.$schema && typeof schema.$schema === 'string') {
                schema = Object.assign({}, schema, {
                    $schema: schema.$schema.replace('https://json-schema.org/', 'http://json-schema.org/')
                });
            }

            let validateFn;
            try {
                validateFn = ajv.compile(schema);
            } catch (e) {
                showError('Schema compile error: ' + e.message);
                return;
            }

            const valid = validateFn(data);
            if (valid) {
                showSuccess();
                trackEvent('validate_schema', { result: 'valid' });
            } else {
                showErrors(validateFn.errors);
                trackEvent('validate_schema', { result: 'invalid', errorCount: validateFn.errors.length });
            }
        }

        // ----------------------------------------------------------------
        // Result rendering
        // ----------------------------------------------------------------
        function showSuccess() {
            resultBox.innerHTML =
                '<div class="schema-result-ok">' +
                '<strong>&#10003; Valid</strong> &mdash; the JSON matches the schema.' +
                '</div>';
        }

        function showError(msg) {
            resultBox.innerHTML =
                '<div class="schema-result-err"><strong>Error:</strong> ' + escapeHtml(msg) + '</div>';
        }

        function showErrors(errors) {
            const head =
                '<div class="schema-result-err">' +
                '<strong>&#10005; ' + errors.length + ' validation error' +
                (errors.length === 1 ? '' : 's') + '</strong>' +
                '</div>';

            const rows = errors.map(function(err) {
                // Ajv 6 uses err.dataPath, Ajv 7+ uses err.instancePath. Support both.
                const rawPath = err.instancePath !== undefined ? err.instancePath : (err.dataPath !== undefined ? err.dataPath : '');
                const path    = rawPath || '/';
                const message = err.message || 'invalid';
                const keyword = err.keyword;
                const detail  = formatErrorDetail(err);
                return (
                    '<tr>' +
                        '<td><code>' + escapeHtml(path) + '</code></td>' +
                        '<td>' + escapeHtml(message) + (detail ? ' <span class="err-detail">(' + escapeHtml(detail) + ')</span>' : '') + '</td>' +
                        '<td><code>' + escapeHtml(keyword) + '</code></td>' +
                    '</tr>'
                );
            }).join('');

            resultBox.innerHTML = head +
                '<table class="schema-error-table">' +
                '<thead><tr><th>Path</th><th>Message</th><th>Keyword</th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
                '</table>';
        }

        function formatErrorDetail(err) {
            const p = err.params || {};
            if (p.allowedValues) return 'allowed: ' + JSON.stringify(p.allowedValues);
            if (p.missingProperty !== undefined) return 'missing: ' + p.missingProperty;
            if (p.additionalProperty !== undefined) return 'unexpected: ' + p.additionalProperty;
            if (p.type !== undefined) return 'expected ' + p.type;
            if (p.pattern !== undefined) return 'pattern: ' + p.pattern;
            if (p.limit !== undefined) return 'limit: ' + p.limit;
            if (p.format !== undefined) return 'format: ' + p.format;
            return '';
        }

        function escapeHtml(s) {
            return String(s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        // ----------------------------------------------------------------
        // Clear handler
        // ----------------------------------------------------------------
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                jsonInput.value = '';
                schemaInput.value = '';
                resultBox.innerHTML = '';
                if (exampleMenuLabel) exampleMenuLabel.textContent = 'Load example';
                if (exampleMenu) {
                    exampleMenu.querySelectorAll('.example-menu-item').forEach(function(b) {
                        b.classList.remove('active');
                    });
                }
                schemaInput.focus();
            });
        }
    }

    // Run init regardless of whether DOMContentLoaded has already fired.
    // (At end-of-body scripts the DOM is usually already parsed.)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
