// ============================================================================
// mock-data-generator-tool.js — UI controller for the Mock Data Generator.
// Card-based field builder + searchable type picker + live preview, on top of
// the MockDataFaker engine (js/mock-data-faker.js). Three input modes
// (field picker / sample JSON / JSON Schema) all compile to a MockSchema.
// ============================================================================
(function () {
    'use strict';

    if (typeof MockDataFaker === 'undefined') return;

    var PREVIEW_ROWS = 8;
    var MAX_DEPTH = 4;          // soft nesting cap
    var SOFT_CAP = 100000;
    var HARD_CAP = 1000000;
    var CHUNK = 2000;
    var PREVIEW_CHARS = 500000;
    var HIGHLIGHT_MAX = 50000; // syntax-highlight JSON output only below this size (perf)

    // ── DOM ──────────────────────────────────────────────────────────────────
    var tabs        = Array.prototype.slice.call(document.querySelectorAll('.mdg-tab'));
    var panels      = { fields: document.getElementById('panel-fields'), sample: document.getElementById('panel-sample'), schema: document.getElementById('panel-schema') };
    var fieldsWrap  = document.getElementById('mdgFields');
    var addFieldBtn = document.getElementById('mdgAddField');
    var clearAllBtn = document.getElementById('mdgClearAll');
    var resetBtn    = document.getElementById('mdgReset');
    var sampleInput = document.getElementById('mdgSampleInput');
    var sampleEx    = document.getElementById('mdgSampleExample');
    var schemaInput = document.getElementById('mdgSchemaInput');
    var schemaEx    = document.getElementById('mdgSchemaExample');
    var rowCount    = document.getElementById('mdgRowCount');
    var seedInput   = document.getElementById('mdgSeed');
    var formatSel   = document.getElementById('mdgFormat');
    var genBtn      = document.getElementById('mdgGenerate');
    var copyBtn     = document.getElementById('mdgCopy');
    var dlBtn       = document.getElementById('mdgDownload');
    var statusEl    = document.getElementById('mdgStatus');
    var csvWarn     = document.getElementById('mdgCsvWarn');
    var output      = document.getElementById('mdgOutput');
    var pip         = document.getElementById('mdgPip');
    var progress    = document.getElementById('mdgProgress');
    var progressBar = document.getElementById('mdgProgressBar');
    // picker
    var pickerModal = document.getElementById('mdgPicker');
    var pickerPanel = pickerModal.querySelector('.mdg-modal-panel');
    var pickerTitle = document.getElementById('mdgPickerTitle');
    var pickerSearch= document.getElementById('mdgPickerSearch');
    var pickerList  = document.getElementById('mdgPickerList');
    var pickerClose = document.getElementById('mdgPickerClose');

    var activeMode = 'fields';
    var lastOutput = '';
    var dragCtx = null; // { fields, index } during a drag-reorder

    // ── Icons (inline SVG by category; emoji fallback) ───────────────────────
    function svg(inner) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }
    var ICON = {
        Common:      svg('<path d="M12 3l2.5 5.2 5.7.6-4.3 3.8 1.2 5.6L12 16l-5.1 2.9 1.2-5.6L3.8 9.4l5.7-.6z"/>'),
        Identity:    svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
        Internet:    svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>'),
        Location:    svg('<path d="M12 22s7-6.4 7-12a7 7 0 0 0-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
        'Date & time': svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
        Numbers:     svg('<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>'),
        Text:        svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
        Structural:  svg('<path d="M8 4c-2 0-3 1-3 3v2c0 1.4-1 2-2 2 1 0 2 .6 2 2v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.4 1 2 2 2-1 0-2 .6-2 2v2c0 2-1 3-3 3"/>'),
        _object:     svg('<path d="M8 4c-2 0-3 1-3 3v2c0 1.4-1 2-2 2 1 0 2 .6 2 2v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.4 1 2 2 2-1 0-2 .6-2 2v2c0 2-1 3-3 3"/>'),
        _array:      svg('<path d="M8 4H5v16h3M16 4h3v16h-3"/>')
    };
    // sliders icon for the per-field options toggle
    var SVG_SLIDERS = svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>');

    // generator → category (reverse index from GENERATOR_LIST, so new generators map automatically)
    var GEN_CATEGORY = {};
    MockDataFaker.GENERATOR_LIST.forEach(function (grp) {
        grp.items.forEach(function (g) { GEN_CATEGORY[g] = grp.group; });
    });
    function iconFor(gen) {
        if (gen === 'object') return ICON._object;
        if (gen === 'array') return ICON._array;
        return ICON[GEN_CATEGORY[gen]] || ICON.Structural;
    }

    // generator group → category-hue key (CSS vars --t-<hue> / --t-<hue>-bg)
    var GROUP_HUE = { Identity: 'person', Internet: 'id', Location: 'geo', 'Date & time': 'time', Numbers: 'num', Text: 'text', Structural: 'struct' };
    function hueFor(gen) {
        if (gen === 'object' || gen === 'array') return 'struct';
        return GROUP_HUE[GEN_CATEGORY[gen]] || 'struct';
    }
    function badgeEl(gen) {
        var b = document.createElement('span');
        b.className = 'mdg-badge';
        var h = hueFor(gen);
        b.style.background = 'var(--t-' + h + '-bg)';
        b.style.color = 'var(--t-' + h + ')';
        b.innerHTML = iconFor(gen);
        return b;
    }
    // JSON output type a generator produces (shown in the picker)
    function outType(gen) {
        if (gen === 'object') return 'object';
        if (gen === 'array') return 'array';
        if (gen === 'boolean') return 'boolean';
        if (gen === 'null') return 'null';
        if (gen === 'int' || gen === 'float' || gen === 'price' || gen === 'id' ||
            gen === 'latitude' || gen === 'longitude' || gen === 'timestamp') return 'number';
        return 'string';
    }

    // ── Friendly labels & default names ──────────────────────────────────────
    var LABEL = {
        uuid: 'UUID', id: 'ID', firstName: 'First Name', lastName: 'Last Name', fullName: 'Full Name',
        username: 'Username', email: 'Email', phone: 'Phone', avatarUrl: 'Avatar URL', url: 'URL',
        domain: 'Domain', ipv4: 'IPv4', ipv6: 'IPv6', mac: 'MAC Address', country: 'Country', city: 'City',
        state: 'State', zip: 'ZIP', streetAddress: 'Street Address', latitude: 'Latitude', longitude: 'Longitude',
        datetime: 'Date & Time', date: 'Date', time: 'Time', timestamp: 'Timestamp', int: 'Integer', float: 'Float',
        price: 'Price', boolean: 'Boolean', word: 'Word', words: 'Words', sentence: 'Sentence', paragraph: 'Paragraph',
        company: 'Company', jobTitle: 'Job Title', color: 'Color', currency: 'Currency', enum: 'Enum',
        constant: 'Constant', 'null': 'Null', object: 'Object', array: 'Array'
    };
    function titleCase(s) { return s.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }).trim(); }
    function friendlyLabel(gen) { return LABEL[gen] || titleCase(gen); }

    var NAME_DEFAULT = {
        uuid: 'id', fullName: 'name', int: 'count', float: 'amount', price: 'price', boolean: 'isActive',
        object: 'group', array: 'items', enum: 'status', constant: 'value', datetime: 'createdAt',
        date: 'date', words: 'text', word: 'text', sentence: 'text', paragraph: 'description'
    };
    function defaultName(gen) { return NAME_DEFAULT[gen] || gen; }

    var COMMON = ['fullName', 'email', 'phone', 'username', 'company', 'city', 'country', 'date', 'datetime', 'int', 'uuid', 'boolean'];

    // ── Field-picker model (a live MockSchema; data shape unchanged from v1) ──
    function defaultModel() {
        return [
            { name: 'id', generator: 'uuid', options: {}, nullChance: 0 },
            { name: 'firstName', generator: 'firstName', options: {}, nullChance: 0 },
            { name: 'lastName', generator: 'lastName', options: {}, nullChance: 0 },
            { name: 'email', generator: 'email', options: {}, nullChance: 0 },
            { name: 'age', generator: 'int', options: { min: 18, max: 80 }, nullChance: 0 },
            { name: 'isActive', generator: 'boolean', options: {}, nullChance: 0 },
            { name: 'createdAt', generator: 'datetime', options: {}, nullChance: 0 },
            { name: 'address', generator: 'object', options: { fields: [
                { name: 'city', generator: 'city', options: {}, nullChance: 0 },
                { name: 'state', generator: 'state', options: {}, nullChance: 0 },
                { name: 'zip', generator: 'zip', options: {}, nullChance: 0 }
            ] }, nullChance: 0 },
            { name: 'tags', generator: 'array', options: { item: { generator: 'word', options: {} }, count: { min: 1, max: 3 } }, nullChance: 0 }
        ];
    }
    // Field schema persists across visits. An empty array is valid (a deliberately cleared
    // builder) and is respected; only a missing/invalid value falls back to the example.
    var STORAGE_KEY = 'mdg_field_model';
    var STORAGE_VERSION = 1;
    function loadModel() {
        try {
            var saved = getFromLocalStorage(STORAGE_KEY);
            if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                // versioned envelope { v, fields } — only accept a matching version
                return (saved.v === STORAGE_VERSION && Array.isArray(saved.fields)) ? saved.fields : defaultModel();
            }
            if (Array.isArray(saved)) return saved; // legacy pre-version array — still load
        } catch (e) {}
        return defaultModel();
    }
    function saveModel() { try { saveToLocalStorage(STORAGE_KEY, { v: STORAGE_VERSION, fields: fieldModel }); } catch (e) {} }
    var fieldModel = loadModel();

    function defaultOptions(gen) {
        if (gen === 'object') return { fields: [] };
        if (gen === 'array') return { item: { generator: 'word', options: {} }, count: { min: 1, max: 3 } };
        if (gen === 'enum') return { values: ['active', 'inactive'] };
        return {};
    }
    function uniqueName(base, taken) {
        if (taken.indexOf(base) === -1) return base;
        var i = 2;
        while (taken.indexOf(base + '_' + i) !== -1) i++;
        return base + '_' + i;
    }
    function newField(gen, siblings) {
        return { name: uniqueName(defaultName(gen), siblings), generator: gen, options: defaultOptions(gen), nullChance: 0 };
    }

    // ── Small DOM helpers ────────────────────────────────────────────────────
    function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
    function iconBtn(label, title, onClick) {
        var b = el('button', 'mdg-iconbtn'); b.type = 'button'; b.textContent = label;
        b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', onClick); return b;
    }
    function numField(label, value, onChange) {
        var wrap = el('label', 'mdg-opt-field'); wrap.appendChild(document.createTextNode(label));
        var i = el('input'); i.type = 'number'; if (value != null) i.value = value;
        i.addEventListener('input', function () { onChange(i.value); });
        wrap.appendChild(i); return wrap;
    }
    function textField(label, value, wide, onChange, placeholder) {
        var wrap = el('label', 'mdg-opt-field'); wrap.appendChild(document.createTextNode(label));
        var i = el('input', wide ? 'mdg-opt-wide' : ''); i.type = 'text'; i.value = value; if (placeholder) i.placeholder = placeholder;
        i.addEventListener('input', function () { onChange(i.value); });
        wrap.appendChild(i); return wrap;
    }
    function swap(arr, i, j) { var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

    // ── Render a builder level (recursive) ───────────────────────────────────
    function renderLevel(container, fields, depth) {
        container.innerHTML = '';
        function rerender() { renderLevel(container, fields, depth); schedulePreview(); }

        if (!fields.length) {
            if (depth >= MAX_DEPTH) {
                var capNote = el('div', 'mdg-nest-note'); capNote.textContent = 'Maximum nesting depth reached.';
                container.appendChild(capNote);
                return;
            }
            var empty = el('div', 'mdg-empty');
            empty.innerHTML = '<p>No fields yet.</p>';
            var add = el('button', 'mdg-addfield'); add.type = 'button'; add.textContent = '＋ Add your first field';
            add.addEventListener('click', function () { openAddField(fields, rerender, container); });
            empty.appendChild(add);
            container.appendChild(empty);
            return;
        }

        fields.forEach(function (node, i) { container.appendChild(buildCard(node, fields, i, depth, rerender, container)); });

        if (depth >= MAX_DEPTH) {
            var note = el('div', 'mdg-nest-note'); note.textContent = 'Maximum nesting depth reached.';
            container.appendChild(note);
        } else if (depth > 0) {
            var a = el('button', 'mdg-addfield'); a.type = 'button'; a.textContent = '＋ Add field';
            a.addEventListener('click', function () { openAddField(fields, rerender, container); });
            container.appendChild(a);
        }
    }

    function buildCard(node, fields, index, depth, rerender, container) {
        var card = el('div', 'mdg-field');
        card.setAttribute('draggable', 'true');
        // Drag-to-reorder among siblings only (same `fields` array). ▲/▼ buttons remain for a11y.
        card.addEventListener('dragstart', function (e) { e.stopPropagation(); dragCtx = { fields: fields, index: index }; card.style.opacity = '0.4'; });
        card.addEventListener('dragend', function () { card.style.opacity = ''; clearDragOver(); dragCtx = null; });
        card.addEventListener('dragover', function (e) { if (dragCtx && dragCtx.fields === fields) { e.preventDefault(); e.stopPropagation(); card.classList.add('drag-over'); } });
        card.addEventListener('dragleave', function () { card.classList.remove('drag-over'); });
        card.addEventListener('drop', function (e) {
            if (!dragCtx || dragCtx.fields !== fields) return;
            e.preventDefault(); e.stopPropagation(); card.classList.remove('drag-over');
            var from = dragCtx.index;
            if (from !== index) { var it = fields.splice(from, 1)[0]; fields.splice(index, 0, it); }
            dragCtx = null; rerender();
        });

        var row = el('div', 'mdg-field-row');
        var handle = el('span', 'mdg-handle'); handle.textContent = '⠿'; handle.title = 'Drag to reorder'; handle.setAttribute('aria-hidden', 'true');

        var name = el('input', 'mdg-name'); name.value = node.name; name.setAttribute('aria-label', 'Field name');
        name.addEventListener('input', function () { node.name = name.value; schedulePreview(); });
        var colon = el('span', 'mdg-colon'); colon.textContent = ':';

        var ty = el('button', 'mdg-tysel'); ty.type = 'button';
        ty.innerHTML = friendlyLabel(node.generator) + ' <span class="caret">▾</span>';
        ty.setAttribute('aria-label', 'Change type (currently ' + friendlyLabel(node.generator) + ')');
        ty.addEventListener('click', function () {
            openPicker('Change field type', false, function (gen) { changeType(node, gen); rerender(); });
        });

        var actions = el('div', 'mdg-card-actions');
        // options toggle: reveals/collapses the Nullable + per-type options drawer (keeps rows compact)
        var optsBtn = el('button', 'mdg-iconbtn opts-toggle'); optsBtn.type = 'button';
        optsBtn.innerHTML = SVG_SLIDERS;
        optsBtn.title = 'Field options'; optsBtn.setAttribute('aria-label', 'Toggle field options'); optsBtn.setAttribute('aria-expanded', 'false');
        optsBtn.addEventListener('click', function () {
            var open = card.classList.toggle('opts-open');
            optsBtn.classList.toggle('active', open);
            optsBtn.setAttribute('aria-expanded', String(open));
        });
        actions.appendChild(optsBtn);
        actions.appendChild(iconBtn('⧉', 'Duplicate field', function () {
            var clone = deepClone(node); clone.name = uniqueName(node.name, fields.map(function (f) { return f.name; }));
            fields.splice(index + 1, 0, clone); rerender();
        }));
        actions.appendChild(iconBtn('▲', 'Move up', function () { if (index > 0) { swap(fields, index, index - 1); rerender(); } }));
        actions.appendChild(iconBtn('▼', 'Move down', function () { if (index < fields.length - 1) { swap(fields, index, index + 1); rerender(); } }));
        actions.appendChild(iconBtn('✕', 'Remove field', function () { fields.splice(index, 1); rerender(); }));

        row.appendChild(handle);
        row.appendChild(badgeEl(node.generator));
        row.appendChild(name);
        row.appendChild(colon);
        row.appendChild(ty);
        row.appendChild(el('span', 'mdg-spacer'));
        row.appendChild(actions);
        card.appendChild(row);

        var body = el('div', 'mdg-card-body');
        var nul = el('label', 'mdg-nullable');
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = node.nullChance > 0;
        cb.addEventListener('change', function () { node.nullChance = cb.checked ? 0.2 : 0; schedulePreview(); });
        nul.appendChild(cb); nul.appendChild(document.createTextNode(' Nullable'));
        body.appendChild(nul);
        addLeafOptions(body, node);
        if (node.generator === 'array') addArrayControls(body, node, rerender);
        card.appendChild(body);

        if (node.generator === 'object') {
            var nest = el('div', 'mdg-card-nest');
            renderLevel(nest, node.options.fields, depth + 1);
            card.appendChild(nest);
        } else if (node.generator === 'array' && node.options.item && node.options.item.generator === 'object') {
            var nest2 = el('div', 'mdg-card-nest');
            renderLevel(nest2, node.options.item.options.fields, depth + 1);
            card.appendChild(nest2);
        }
        return card;
    }
    function clearDragOver() { var x = document.querySelectorAll('#mdgFields .drag-over'); for (var i = 0; i < x.length; i++) x[i].classList.remove('drag-over'); }

    function addLeafOptions(body, node) {
        var g = node.generator, o = node.options;
        if (g === 'int' || g === 'float' || g === 'id' || g === 'price') {
            body.appendChild(numField('Min', o.min, function (v) { if (v === '') delete o.min; else o.min = Number(v); schedulePreview(); }));
            body.appendChild(numField('Max', o.max, function (v) { if (v === '') delete o.max; else o.max = Number(v); schedulePreview(); }));
        } else if (g === 'enum') {
            body.appendChild(textField('Values', (o.values || []).join(', '), true, function (v) {
                o.values = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean); schedulePreview();
            }, 'a, b, c'));
        } else if (g === 'constant') {
            body.appendChild(textField('Value', o.value != null ? o.value : '', false, function (v) { o.value = v; schedulePreview(); }, 'value'));
        }
    }

    function addArrayControls(body, node, rerender) {
        var wrap = el('span', 'mdg-opt-field'); wrap.appendChild(document.createTextNode('item:'));
        wrap.appendChild(badgeEl(node.options.item.generator));
        var chip = el('button', 'mdg-tysel'); chip.type = 'button';
        chip.innerHTML = friendlyLabel(node.options.item.generator) + ' <span class="caret">▾</span>';
        chip.setAttribute('aria-label', 'Change array item type (currently ' + friendlyLabel(node.options.item.generator) + ')');
        chip.addEventListener('click', function () {
            openPicker('Array item type', true, function (gen) { changeItemType(node, gen); rerender(); });
        });
        wrap.appendChild(chip); body.appendChild(wrap);

        // Min/Max items kept consistent: raising Min above Max bumps Max to match, and vice versa (was LIVE-01)
        var minWrap = numField('Min items', node.options.count.min, onMin);
        var maxWrap = numField('Max items', node.options.count.max, onMax);
        var minInput = minWrap.querySelector('input'), maxInput = maxWrap.querySelector('input');
        minInput.min = '0'; maxInput.min = '0';
        function onMin(v) {
            var m = parseInt(v, 10); if (isNaN(m) || m < 0) m = 0;
            node.options.count.min = m;
            if (node.options.count.max < m) { node.options.count.max = m; maxInput.value = m; }
            schedulePreview();
        }
        function onMax(v) {
            var m = parseInt(v, 10); if (isNaN(m) || m < 0) m = 0;
            node.options.count.max = m;
            if (node.options.count.min > m) { node.options.count.min = m; minInput.value = m; }
            schedulePreview();
        }
        body.appendChild(minWrap); body.appendChild(maxWrap);
    }

    function openAddField(fields, rerender, container) {
        openPicker('Add a field', false, function (gen) {
            var node = newField(gen, fields.map(function (f) { return f.name; }));
            fields.push(node); rerender();
            focusNewCard(container, fields.length - 1);
        });
    }
    function focusNewCard(container, index) {
        var cards = Array.prototype.filter.call(container.children, function (c) { return c.classList && c.classList.contains('mdg-field'); });
        var card = cards[index]; if (!card) return;
        var nm = card.querySelector('.mdg-name');
        if (nm) { card.scrollIntoView({ block: 'nearest' }); nm.focus(); nm.select(); }
    }

    // ── Type-change with option preservation ─────────────────────────────────
    var NUM_GENS = { int: 1, float: 1, price: 1, id: 1 };
    var DT_GENS = { date: 1, datetime: 1, time: 1, timestamp: 1 };

    function changeType(node, gen) {
        var old = node.generator, o = node.options || {};
        node.generator = gen;
        if (gen === 'object') {
            node.options = (old === 'object') ? { fields: o.fields || [] }
                : (old === 'array' && o.item && o.item.generator === 'object') ? { fields: o.item.options.fields || [] }
                : { fields: [] };
        } else if (gen === 'array') {
            if (old === 'array') node.options = o;
            else if (old === 'object') node.options = { item: { generator: 'object', options: { fields: o.fields || [] } }, count: { min: 1, max: 3 } };
            else node.options = { item: { generator: 'word', options: {} }, count: { min: 1, max: 3 } };
        } else {
            node.options = defaultOptions(gen);
            if (NUM_GENS[old] && NUM_GENS[gen]) { if (o.min != null) node.options.min = o.min; if (o.max != null) node.options.max = o.max; }
            else if (DT_GENS[old] && DT_GENS[gen]) { node.options = Object.assign({}, o); }
            // reachable: the picker lets you re-select the current type; this keeps your enum
            // values instead of resetting them to the defaults (NOT dead code — re: BUG-22).
            else if (old === 'enum' && gen === 'enum') { node.options.values = o.values || []; }
        }
        // node.nullChance preserved
    }
    function changeItemType(node, gen) {
        var item = node.options.item, old = item.generator, o = item.options || {};
        item.generator = gen;
        if (gen === 'object') { item.options = (old === 'object') ? { fields: o.fields || [] } : { fields: [] }; }
        else {
            item.options = defaultOptions(gen);
            if (NUM_GENS[old] && NUM_GENS[gen]) { if (o.min != null) item.options.min = o.min; if (o.max != null) item.options.max = o.max; }
        }
    }

    // ── Picker dialog ────────────────────────────────────────────────────────
    var pickerApply = null, pickerItemMode = false, pickerTrigger = null;
    var pickerItems = [], activeIdx = -1;

    function displayGroup(name) { return name === 'Date & time' ? 'Date & Time' : name; }
    function pickerGroups() {
        var byGroup = {};
        MockDataFaker.GENERATOR_LIST.forEach(function (g) { byGroup[g.group] = g.items; });
        var groups = [{ label: '⭐ Common', items: COMMON.slice() }];
        ['Identity', 'Internet', 'Location', 'Numbers', 'Date & time', 'Text', 'Structural'].forEach(function (name) {
            if (byGroup[name]) groups.push({ label: displayGroup(name), items: byGroup[name].slice() });
        });
        return groups;
    }
    function allowGen(gen) { return !(pickerItemMode && gen === 'array'); }

    function openPicker(title, itemMode, apply) {
        pickerApply = apply; pickerItemMode = !!itemMode; pickerTrigger = document.activeElement;
        pickerTitle.textContent = title;
        pickerSearch.value = '';
        pickerModal.hidden = false;
        document.body.style.overflow = 'hidden'; // lock background scroll while the modal is open
        renderPickerList('');
        setTimeout(function () { pickerSearch.focus(); }, 0);
    }
    function closePicker() {
        pickerModal.hidden = true;
        document.body.style.overflow = '';
        if (pickerTrigger && document.contains(pickerTrigger)) pickerTrigger.focus();
    }

    function makeItemRow(gen) {
        var row = el('div', 'mdg-picker-item'); row.setAttribute('role', 'option');
        var lb = el('span', 'mdg-pi-label'); lb.textContent = friendlyLabel(gen);
        var ky = el('span', 'mdg-pi-key'); ky.textContent = outType(gen);
        row.appendChild(badgeEl(gen)); row.appendChild(lb); row.appendChild(ky);
        row.addEventListener('click', function () { selectGen(gen); });
        return row;
    }
    function rankItem(gen, q) {
        var label = friendlyLabel(gen).toLowerCase(), key = gen.toLowerCase();
        if (label === q) return 0;
        if (label.indexOf(q) === 0) return 1;
        if (key === q || key.indexOf(q) === 0) return 2;
        if (label.indexOf(q) !== -1 || key.indexOf(q) !== -1) return 3;
        return 99;
    }
    function renderPickerList(query) {
        pickerList.innerHTML = ''; pickerItems = [];
        var groups = pickerGroups();
        if (!query) {
            groups.forEach(function (grp) {
                var items = grp.items.filter(allowGen);
                if (!items.length) return;
                var lab = el('div', 'mdg-picker-group-label'); lab.textContent = grp.label; pickerList.appendChild(lab);
                items.forEach(function (gen) { var row = makeItemRow(gen); pickerList.appendChild(row); pickerItems.push({ gen: gen, el: row }); });
            });
        } else {
            var q = query.toLowerCase(), seen = {}, uniq = [];
            groups.forEach(function (grp) { grp.items.forEach(function (gen) { if (allowGen(gen) && !seen[gen]) { seen[gen] = 1; uniq.push(gen); } }); });
            var ranked = uniq.map(function (gen) { return { gen: gen, r: rankItem(gen, q) }; })
                .filter(function (x) { return x.r < 99; })
                .sort(function (a, b) { return a.r - b.r; });
            if (!ranked.length) { pickerList.innerHTML = '<div class="mdg-picker-group-label">No matches</div>'; return; }
            ranked.forEach(function (x) { var row = makeItemRow(x.gen); pickerList.appendChild(row); pickerItems.push({ gen: x.gen, el: row }); });
        }
        activeIdx = pickerItems.length ? 0 : -1; highlight();
    }
    function highlight() {
        pickerItems.forEach(function (p, i) {
            var on = i === activeIdx;
            p.el.classList.toggle('active', on);
            if (on) p.el.scrollIntoView({ block: 'nearest' });
        });
    }
    function moveActive(d) { if (!pickerItems.length) return; activeIdx = (activeIdx + d + pickerItems.length) % pickerItems.length; highlight(); }
    function selectGen(gen) { var apply = pickerApply; closePicker(); if (apply) apply(gen); }

    pickerSearch.addEventListener('input', function () { renderPickerList(pickerSearch.value.trim()); }); // never triggers preview
    pickerSearch.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) selectGen(pickerItems[activeIdx].gen); }
        else if (e.key === 'Escape') { e.preventDefault(); closePicker(); }
    });
    pickerClose.addEventListener('click', closePicker);
    pickerModal.querySelector('.mdg-modal-overlay').addEventListener('click', closePicker);
    pickerPanel.addEventListener('keydown', function (e) { // focus trap: keep Tab within [search, close]
        if (e.key !== 'Tab') return;
        var f = [pickerSearch, pickerClose];
        var idx = f.indexOf(document.activeElement);
        e.preventDefault();
        if (idx === -1) { pickerSearch.focus(); return; } // focus escaped the modal → pull it back
        f[e.shiftKey ? (idx - 1 + f.length) % f.length : (idx + 1) % f.length].focus();
    });

    // ── Build a clean MockSchema for the engine (unchanged from v1) ──────────
    function buildField(node) {
        var f = { name: node.name || 'field', generator: node.generator, nullChance: node.nullChance || 0, options: {} };
        if (node.generator === 'object') f.options.fields = (node.options.fields || []).map(buildField);
        else if (node.generator === 'array') { f.options.item = buildItem(node.options.item || { generator: 'word', options: {} }); f.options.count = node.options.count || { min: 1, max: 3 }; }
        else f.options = cloneOptions(node.options);
        return f;
    }
    function buildItem(item) {
        if (item.generator === 'object') return { generator: 'object', options: { fields: (item.options.fields || []).map(buildField) } };
        return { generator: item.generator, options: cloneOptions(item.options || {}) };
    }
    function cloneOptions(o) { return JSON.parse(JSON.stringify(o || {})); }

    // ── Sample-JSON inference (value pattern beats key name; order-independent) ─
    var RX = {
        datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, date: /^\d{4}-\d{2}-\d{2}$/,
        uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
        uri: /^https?:\/\//i, email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/
    };
    var NUMERIC_GENS = { int: 1, float: 1, price: 1, id: 1, latitude: 1, longitude: 1, timestamp: 1 };
    function patternOf(str) {
        if (RX.uuid.test(str)) return 'uuid';
        if (RX.datetime.test(str)) return 'datetime';
        if (RX.date.test(str)) return 'date';
        if (RX.email.test(str)) return 'email';
        if (RX.uri.test(str)) return 'url';
        return null;
    }
    function keyNameString(key) {
        var k = key.toLowerCase();
        if (k.indexOf('email') !== -1) return 'email';
        if (k === 'firstname' || k === 'first_name' || k === 'givenname') return 'firstName';
        if (k === 'lastname' || k === 'last_name' || k === 'surname' || k === 'familyname') return 'lastName';
        if (k === 'name' || k === 'fullname' || k === 'full_name') return 'fullName';
        if (k.indexOf('username') !== -1 || k === 'user' || k === 'login') return 'username';
        if (k.indexOf('phone') !== -1 || k.indexOf('mobile') !== -1) return 'phone';
        if (k === 'city') return 'city';
        if (k === 'state' || k === 'province') return 'state';
        if (k.indexOf('zip') !== -1 || k.indexOf('postal') !== -1) return 'zip';
        if (k === 'country') return 'country';
        if (k.indexOf('street') !== -1 || k.indexOf('address') !== -1) return 'streetAddress';
        if (k.indexOf('avatar') !== -1) return 'avatarUrl';
        if (k === 'url' || k === 'link' || k === 'website' || k === 'homepage') return 'url';
        if (k === 'domain' || k === 'host') return 'domain';
        if (k === 'company' || k === 'employer' || k === 'organization') return 'company';
        if (k === 'jobtitle' || k === 'job_title' || k === 'job' || k === 'occupation') return 'jobTitle';
        if (k === 'color' || k === 'colour') return 'color';
        if (k === 'currency') return 'currency';
        if (k.indexOf('ip') === 0 || k === 'ipaddress') return 'ipv4';
        return null;
    }
    function keyNameNumeric(key) {
        var k = key.toLowerCase();
        if (k.indexOf('price') !== -1 || k.indexOf('amount') !== -1 || k.indexOf('cost') !== -1 || k.indexOf('total') !== -1 || k.indexOf('salary') !== -1) return 'price';
        if (k === 'lat' || k === 'latitude') return 'latitude';
        if (k === 'lng' || k === 'lon' || k === 'long' || k === 'longitude') return 'longitude';
        if (k.indexOf('timestamp') !== -1 || k === 'epoch') return 'timestamp';
        if (k === 'id' || /_id$/.test(k) || /id$/i.test(k)) return 'id';
        return null;
    }
    function classifyLeaf(v, key) {
        if (typeof v === 'boolean') return 'boolean';
        if (typeof v === 'number') { var base = Number.isInteger(v) ? 'int' : 'float'; return keyNameNumeric(key) || base; }
        if (typeof v === 'string') { var p = patternOf(v); if (p) return p; return keyNameString(key) || 'words'; }
        return 'words';
    }
    function resolveLeaf(values, key) {
        var gens = {};
        values.forEach(function (v) { gens[classifyLeaf(v, key)] = true; });
        var list = Object.keys(gens);
        if (list.length === 1) return list[0];
        var allNumeric = list.every(function (g) { return NUMERIC_GENS[g]; });
        // order-independent tie-break: all-numeric → float; otherwise widen to a generic string
        return allNumeric ? 'float' : 'string';
    }
    // Generic strings that repeat across a sample with low cardinality (status / type / category /
    // role / etc.) are almost always enums — infer them as enum with the observed values.
    function lowCardinalityEnum(values) {
        if (values.length < 3) return null;
        if (!values.every(function (v) { return typeof v === 'string'; })) return null;
        var distinct = [];
        values.forEach(function (v) { if (distinct.indexOf(v) === -1) distinct.push(v); });
        if (distinct.length >= 2 && distinct.length <= 8 && distinct.length < values.length) return distinct;
        return null;
    }
    function inferField(key, values) {
        var objs = values.filter(function (v) { return v && typeof v === 'object' && !Array.isArray(v); });
        var arrs = values.filter(function (v) { return Array.isArray(v); });
        if (objs.length && objs.length >= arrs.length) return { name: key, generator: 'object', options: { fields: inferFields(objs) }, nullChance: 0 };
        if (arrs.length) {
            var elements = [], lens = [];
            arrs.forEach(function (a) { lens.push(a.length); a.forEach(function (e) { elements.push(e); }); });
            var elemObjs = elements.filter(function (e) { return e && typeof e === 'object' && !Array.isArray(e); });
            var item;
            if (elemObjs.length) item = { generator: 'object', options: { fields: inferFields(elemObjs) } };
            else {
                var nonNull = elements.filter(function (e) { return e !== null; });
                var ig = nonNull.length ? resolveLeaf(nonNull, key) : 'word';
                if (ig === 'words') ig = 'word'; // array string items are usually single tokens (was LIVE-06)
                item = { generator: ig, options: {} };
            }
            // honour empty sample arrays: min can be 0 (was BUG-05, which forced min=1)
            var mn = lens.length ? Math.min.apply(null, lens) : 1;
            var mx = lens.length ? Math.max.apply(null, lens) : 3;
            return { name: key, generator: 'array', options: { item: item, count: { min: mn, max: Math.max(mn, mx) } }, nullChance: 0 };
        }
        // low-cardinality generic strings → enum (only when no stronger signal classified the field)
        var leafGen = resolveLeaf(values, key);
        if (leafGen === 'words') {
            var enumVals = lowCardinalityEnum(values);
            if (enumVals) return { name: key, generator: 'enum', options: { values: enumVals }, nullChance: 0 };
        }
        // numeric fields: keep generated values within the sample's observed range (was LIVE-03)
        var opts = {};
        if ((leafGen === 'int' || leafGen === 'float' || leafGen === 'price') && values.every(function (v) { return typeof v === 'number'; })) {
            opts.min = Math.min.apply(null, values);
            opts.max = Math.max.apply(null, values);
            if (leafGen === 'int') { opts.min = Math.floor(opts.min); opts.max = Math.ceil(opts.max); }
        }
        return { name: key, generator: leafGen, options: opts, nullChance: 0 };
    }
    function inferFields(objs) {
        var keys = [], seen = {};
        objs.forEach(function (o) { Object.keys(o).forEach(function (k) { if (!seen[k]) { seen[k] = true; keys.push(k); } }); });
        return keys.map(function (k) {
            var present = objs.filter(function (o) { return Object.prototype.hasOwnProperty.call(o, k); });
            var raw = present.map(function (o) { return o[k]; });
            var nonNull = raw.filter(function (v) { return v !== null; });
            var nullable = present.length < objs.length || nonNull.length < raw.length;
            var field = nonNull.length ? inferField(k, nonNull) : { name: k, generator: 'null', options: {}, nullChance: 1 };
            if (nullable && field.nullChance === 0) field.nullChance = 0.2;
            return field;
        });
    }
    function inferMockSchema(text) {
        var data = JSON.parse(text);
        var items = Array.isArray(data) ? data : [data];
        var objs = items.filter(function (o) { return o && typeof o === 'object' && !Array.isArray(o); });
        if (!objs.length) throw new Error('Paste a JSON object or an array of objects.');
        var fields = inferFields(objs);
        if (!fields.length) throw new Error('No fields found in the sample.');
        return fields;
    }

    // ── JSON Schema (minimal subset) → MockSchema (unchanged from v1) ─────────
    var FORMAT_GEN = { email: 'email', uuid: 'uuid', 'date-time': 'datetime', date: 'date', uri: 'url', ipv4: 'ipv4' };
    function schemaTypeOf(node) { if (Array.isArray(node.type)) { var t = node.type.filter(function (x) { return x !== 'null'; }); return t[0]; } return node.type; }
    // Only an explicit nullable type (e.g. ["string","null"]) is nullable. "Not required" means the
    // field may be absent, not null — and since we always emit every key, we keep it present (was LIVE-05).
    function schemaNullable(node) { return (Array.isArray(node.type) && node.type.indexOf('null') !== -1) ? 0.2 : 0; }
    function schemaObjectFields(node) {
        var props = node.properties || {}, req = node.required || [];
        return Object.keys(props).map(function (k) { return schemaNodeToField(k, props[k], req.indexOf(k) !== -1); });
    }
    function schemaItem(items) {
        items = items || {};
        if (schemaTypeOf(items) === 'object' || items.properties) return { generator: 'object', options: { fields: schemaObjectFields(items) } };
        var f = schemaNodeToField('item', items, true);
        if (f.generator === 'words') f.generator = 'word'; // array string items are usually single tokens (was LIVE-06)
        return { generator: f.generator, options: f.options };
    }
    function schemaNodeToField(name, node, isRequired) {
        var f = { name: name, options: {}, nullChance: schemaNullable(node, isRequired) };
        if (node.enum && node.enum.length) { f.generator = 'enum'; f.options = { values: node.enum }; return f; }
        var type = schemaTypeOf(node);
        if (type === 'object') { f.generator = 'object'; f.options = { fields: schemaObjectFields(node) }; return f; }
        if (type === 'array') {
            f.generator = 'array';
            var mn = node.minItems != null ? node.minItems : 1, mx = node.maxItems != null ? node.maxItems : Math.max(mn, 3);
            f.options = { item: schemaItem(node.items), count: { min: mn, max: mx } }; return f;
        }
        if (type === 'integer') { f.generator = 'int'; if (node.minimum != null) f.options.min = node.minimum; if (node.maximum != null) f.options.max = node.maximum; return f; }
        if (type === 'number') { f.generator = 'float'; if (node.minimum != null) f.options.min = node.minimum; if (node.maximum != null) f.options.max = node.maximum; return f; }
        if (type === 'boolean') { f.generator = 'boolean'; return f; }
        f.generator = (node.format && FORMAT_GEN[node.format]) || keyNameString(name) || 'words';
        return f;
    }
    function schemaToMockSchema(text) {
        var s = JSON.parse(text);
        if (s.$ref || s.components || s.openapi || s.swagger) throw new Error('OpenAPI / $ref documents are not supported yet — paste a plain JSON Schema object.');
        if (s.allOf || s.anyOf || s.oneOf) throw new Error('allOf / anyOf / oneOf are not supported yet — paste a plain JSON Schema object.'); // was LIVE-07
        if (schemaTypeOf(s) === 'array') { var item = schemaItem(s.items); if (item.generator === 'object') return item.options.fields; return [{ name: 'value', generator: item.generator, options: item.options, nullChance: 0 }]; }
        var fields = schemaObjectFields(s);
        if (!fields.length) throw new Error('Schema has no "properties" to generate from.');
        return fields;
    }

    // ── Assemble the active MockSchema ───────────────────────────────────────
    function currentSchema() {
        if (activeMode === 'sample') { var sv = sampleInput.value.trim(); if (!sv) throw new Error('Paste a JSON sample first.'); return inferMockSchema(sv); }
        if (activeMode === 'schema') { var jv = schemaInput.value.trim(); if (!jv) throw new Error('Paste a JSON Schema first.'); return schemaToMockSchema(jv); }
        if (!fieldModel.length) throw new Error('Add at least one field.');
        return fieldModel.map(buildField);
    }

    // ── Exporters (unchanged from v1) ────────────────────────────────────────
    function flatten(obj, prefix, out) {
        Object.keys(obj).forEach(function (k) {
            var key = prefix ? prefix + '.' + k : k, v = obj[k];
            if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
            else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
        });
        return out;
    }
    function csvFromRows(rows) {
        var flat = rows.map(function (r) { return flatten(r, '', {}); });
        var headers = [], seen = {};
        flat.forEach(function (o) { Object.keys(o).forEach(function (h) { if (!seen[h]) { seen[h] = true; headers.push(h); } }); });
        function esc(v) { if (v === null || v === undefined) return ''; v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
        var lines = [headers.join(',')];
        flat.forEach(function (o) { lines.push(headers.map(function (h) { return esc(o[h]); }).join(',')); });
        return lines.join('\n');
    }
    function formatRows(rows, fmt) {
        if (fmt === 'ndjson') return rows.map(function (r) { return JSON.stringify(r); }).join('\n');
        if (fmt === 'csv') return csvFromRows(rows);
        return JSON.stringify(rows, null, 2);
    }

    // ── Status + console output ──────────────────────────────────────────────
    function setStatus(kind, msg) { statusEl.innerHTML = msg; statusEl.parentNode.classList.toggle('err', kind === 'err'); }
    function setPip(state) { pip.className = 'mdg-pip' + (state ? ' ' + state : ''); }
    function nowTime() { return new Date().toLocaleTimeString(); }
    // Copy/Download act on the real output only — disable them when there's nothing to act on (was BUG-21).
    function refreshOutputButtons() {
        var empty = !lastOutput || lastOutput === '[]';
        copyBtn.disabled = empty; dlBtn.disabled = empty;
    }
    function capText(text) {
        return text.length > PREVIEW_CHARS
            ? text.slice(0, PREVIEW_CHARS) + '\n\n… truncated (' + (text.length - PREVIEW_CHARS).toLocaleString() + ' more characters). Use Download for the full file.'
            : text;
    }
    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    // COSMETIC ONLY. Runs on already-escaped text, so it can never inject markup. The regex is
    // a tinter, not a parser — odd strings (escaped quotes, weird keys) may mis-wrap a span; that
    // is a harmless visual glitch. Do NOT "harden" this into a real JSON parser.
    function highlightJson(escaped) {
        return escaped
            .replace(/("(\\.|[^"\\])*")(\s*:)?/g, function (m, str, _g, colon) {
                return colon ? '<span class="tk-key">' + str + '</span><span class="tk-punc">' + colon + '</span>'
                             : '<span class="tk-str">' + str + '</span>';
            })
            .replace(/\b(true|false|null)\b/g, '<span class="tk-bool">$1</span>')
            .replace(/(:\s*)(-?\d+\.?\d*)/g, '$1<span class="tk-num">$2</span>')
            .replace(/([{}\[\],])/g, '<span class="tk-punc">$1</span>');
    }
    // Single rule: highlight iff JSON format AND the (already-capped) displayed text is small.
    function renderDisplay(raw, fmt) {
        var displayed = capText(raw);
        var esc = escapeHtml(displayed);
        output.innerHTML = (fmt === 'json' && displayed.length < HIGHLIGHT_MAX) ? highlightJson(esc) : esc;
    }

    // ── Live preview ─────────────────────────────────────────────────────────
    function renderPreview() {
        if (activeMode === 'fields') saveModel(); // debounced via schedulePreview — persists every builder edit
        var schema;
        try { schema = currentSchema(); }
        catch (e) {
            // mode-appropriate message: friendly prompt when empty, real parse error otherwise (was LIVE-04)
            setPip('');
            var isEmpty = false, msg = e.message;
            if (activeMode === 'fields' && !fieldModel.length) { output.innerHTML = '[]'; lastOutput = '[]'; msg = 'Add a field to see a live preview.'; isEmpty = true; }
            else if (activeMode === 'sample' && !sampleInput.value.trim()) { msg = 'Paste a JSON sample to see a live preview.'; isEmpty = true; }
            else if (activeMode === 'schema' && !schemaInput.value.trim()) { msg = 'Paste a JSON Schema to see a live preview.'; isEmpty = true; }
            setStatus(isEmpty ? '' : 'err', msg);
            refreshOutputButtons();
            return;
        }
        var total = parseInt(rowCount.value, 10) || 1;
        var n = Math.min(total, PREVIEW_ROWS);
        var seed = seedInput.value.trim();
        var fmt = formatSel.value;
        var rows;
        try { rows = MockDataFaker.createSession(schema, seed ? { seed: seed } : {}).nextRows(n); }
        catch (e) { setStatus('err', e.message); return; } // e.g. circular coherence dependency
        var text = formatRows(rows, fmt);
        lastOutput = text;
        renderDisplay(text, fmt);
        setPip('preview');
        // when the requested row count exceeds the 8-row preview cap, label it "8 of N" so the count reads correctly
        var rowsLabel = total > rows.length
            ? rows.length + ' of ' + total.toLocaleString() + ' rows'
            : rows.length + ' row' + (rows.length === 1 ? '' : 's');
        setStatus('ok', '<b>Preview</b> • ' + rowsLabel + ' · ' + getJSONSize(text) + ' · updated ' + nowTime());
        refreshOutputButtons();
    }
    var schedulePreview = debounce(renderPreview, 250);

    // ── Full generation (chunked, with progress) ─────────────────────────────
    function doGenerate() {
        var schema;
        try { schema = currentSchema(); } catch (e) { setStatus('err', e.message); return; }
        var count = parseInt(rowCount.value, 10);
        if (!count || count < 1) { setStatus('err', 'Enter a row count of 1 or more.'); return; }
        if (count > HARD_CAP) { setStatus('err', 'Maximum is ' + HARD_CAP.toLocaleString() + ' rows. Lower the count.'); return; }
        var seed = seedInput.value.trim(), fmt = formatSel.value, session;
        try { session = MockDataFaker.createSession(schema, seed ? { seed: seed } : {}); } catch (e) { setStatus('err', e.message); return; }

        genBtn.disabled = true; progress.hidden = false; progressBar.style.width = '0%';
        var rows = [];
        function step() {
            try {
                rows.push.apply(rows, session.nextRows(Math.min(CHUNK, count - rows.length)));
            } catch (e) {
                // never leave the UI locked if a generator throws mid-stream (was BUG-02)
                progress.hidden = true; genBtn.disabled = false;
                setStatus('err', 'Generation failed: ' + e.message);
                return;
            }
            progressBar.style.width = Math.round(rows.length / count * 100) + '%';
            if (rows.length < count) {
                if (count > SOFT_CAP) setStatus('ok', 'Generating ' + rows.length.toLocaleString() + ' / ' + count.toLocaleString() + '…');
                setTimeout(step, 0);
            } else { progress.hidden = true; genBtn.disabled = false; finish(rows, fmt, seed); }
        }
        step();
    }
    function finish(rows, fmt, seed) {
        var text = formatRows(rows, fmt);
        lastOutput = text;
        renderDisplay(text, fmt);
        setPip('generated');
        // escape the user-supplied seed — it goes into statusEl.innerHTML (was BUG-01, XSS)
        setStatus('ok', '<b>Generated</b> • ' + rows.length.toLocaleString() + ' rows' + (seed ? ' (seed "' + escapeHtml(seed) + '")' : '') + ' · ' + getJSONSize(text));
        refreshOutputButtons();
    }

    // ── Tabs ─────────────────────────────────────────────────────────────────
    function setMode(mode) {
        if (!panels[mode]) return;
        activeMode = mode;
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-mode') === mode)); });
        Object.keys(panels).forEach(function (m) { panels[m].classList.toggle('active', m === mode); });
        // replaceState (not pushState) so tab clicks don't pile up browser-history entries (was BUG-06)
        try { var u = new URL(window.location); u.searchParams.set('mode', mode); history.replaceState({}, '', u); } catch (e) {}
        updateCsvWarn();
        renderPreview();
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); }); });
    function updateCsvWarn() { csvWarn.style.display = formatSel.value === 'csv' ? 'block' : 'none'; }

    // ── Examples ─────────────────────────────────────────────────────────────
    var SAMPLE_EXAMPLE = JSON.stringify([
        { id: 1, firstName: 'Alice', lastName: 'Ng', email: 'alice.ng@example.com', role: 'admin', signupDate: '2026-01-15', score: 87.5, active: true },
        { id: 2, firstName: 'Bob', lastName: 'Reyes', email: 'bob.reyes@example.com', role: 'user', signupDate: '2026-02-03', score: 42, active: false },
        { id: 3, firstName: 'Cara', lastName: 'Diaz', email: 'cara.diaz@example.com', role: 'user', signupDate: '2026-02-20', score: 63.2, active: true }
    ], null, 2);
    var SCHEMA_EXAMPLE = JSON.stringify({
        type: 'object',
        properties: {
            id: { type: 'integer', minimum: 1, maximum: 9999 },
            email: { type: 'string', format: 'email' },
            status: { type: 'string', enum: ['active', 'pending', 'closed'] },
            createdAt: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 }
        },
        required: ['id', 'email', 'status']
    }, null, 2);

    // ── Wire up ──────────────────────────────────────────────────────────────
    addFieldBtn.addEventListener('click', function () {
        openAddField(fieldModel, function () { renderLevel(fieldsWrap, fieldModel, 0); schedulePreview(); }, fieldsWrap);
    });
    if (clearAllBtn) clearAllBtn.addEventListener('click', function () {
        fieldModel = []; renderLevel(fieldsWrap, fieldModel, 0); saveModel(); renderPreview();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
        fieldModel = defaultModel(); renderLevel(fieldsWrap, fieldModel, 0); saveModel(); renderPreview();
    });
    sampleEx.addEventListener('click', function (e) { e.preventDefault(); sampleInput.value = SAMPLE_EXAMPLE; renderPreview(); });
    schemaEx.addEventListener('click', function (e) { e.preventDefault(); schemaInput.value = SCHEMA_EXAMPLE; renderPreview(); });

    genBtn.addEventListener('click', doGenerate);
    rowCount.addEventListener('input', schedulePreview);
    seedInput.addEventListener('input', schedulePreview);
    formatSel.addEventListener('change', function () { updateCsvWarn(); schedulePreview(); });
    sampleInput.addEventListener('input', schedulePreview);
    schemaInput.addEventListener('input', schedulePreview);

    copyBtn.addEventListener('click', function () {
        if (!lastOutput || lastOutput === '[]') { setStatus('err', 'Nothing to copy — add a field first.'); return; }
        copyToClipboard(lastOutput).then(function () {
            copyBtn.textContent = 'Copied!'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        }).catch(function () { setStatus('err', 'Copy failed — check clipboard permissions.'); }); // was BUG-03
    });
    dlBtn.addEventListener('click', function () {
        if (!lastOutput || lastOutput === '[]') { setStatus('err', 'Nothing to download — add a field first.'); return; }
        var fmt = formatSel.value;
        var ext = fmt === 'csv' ? 'csv' : (fmt === 'ndjson' ? 'ndjson' : 'json');
        var mime = fmt === 'csv' ? 'text/csv' : (fmt === 'ndjson' ? 'application/x-ndjson' : 'application/json');
        downloadFile(lastOutput, 'mock-data.' + ext, mime);
    });

    // Drag a .json file onto the sample / schema textareas to load it (was BUG-20)
    if (typeof initDragDrop === 'function') {
        initDragDrop('mdgSampleInput', function (content) { sampleInput.value = content; renderPreview(); }, ['.json']);
        initDragDrop('mdgSchemaInput', function (content) { schemaInput.value = content; renderPreview(); }, ['.json']);
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    renderLevel(fieldsWrap, fieldModel, 0);
    var startMode = (typeof getQueryParam === 'function' && getQueryParam('mode')) || 'fields';
    setMode(panels[startMode] ? startMode : 'fields'); // also renders the first preview
})();
