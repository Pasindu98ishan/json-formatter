// ============================================================================
// mock-data-faker.js — zero-dependency, deterministic mock-data engine
// ----------------------------------------------------------------------------
// Context-aware generators write/read a per-row RowContext so values cohere
// (email/username derive from the row's name; city/state/zip share one tuple;
// updatedAt never precedes createdAt). All randomness routes through a single
// seedable PRNG stream so a given seed reproduces byte-identical output across
// runs, machines, and chunk sizes.
//
// Dual-export (browser global + CommonJS) — mirrors js/http-status-data.js.
// ============================================================================
(function (root, factory) {
    var api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.MockDataFaker = api;
})(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    // ── Determinism: PRNG ────────────────────────────────────────────────────
    // xmur3 string hash → 32-bit seed; mulberry32 → float stream in [0, 1).
    function xmur3(str) {
        var h = 1779033703 ^ str.length;
        for (var i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function () {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return (h ^= h >>> 16) >>> 0;
        };
    }

    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function makeRng(intState) {
        var s = mulberry32(intState);
        return {
            next: s,
            int: function (min, max) { return Math.floor(s() * (max - min + 1)) + min; },
            float: function (min, max, dec) {
                var v = s() * (max - min) + min;
                return dec == null ? v : Number(v.toFixed(dec));
            },
            pick: function (arr) { return arr[Math.floor(s() * arr.length)]; },
            bool: function (p) { return s() < (p == null ? 0.5 : p); }
        };
    }

    function rngUuidV4(rng) {
        var b = [];
        for (var i = 0; i < 16; i++) b.push(rng.int(0, 255));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var h = b.map(function (x) { return (x + 0x100).toString(16).slice(1); });
        return h[0] + h[1] + h[2] + h[3] + '-' + h[4] + h[5] + '-' + h[6] + h[7] +
               '-' + h[8] + h[9] + '-' + h[10] + h[11] + h[12] + h[13] + h[14] + h[15];
    }

    // ── Bundled en-US data (coherent location tuples are the centrepiece) ─────
    var DATA = {
        firstNames: ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
            'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
            'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
            'Anthony', 'Margaret', 'Mark', 'Sandra', 'Ava', 'Liam', 'Olivia', 'Noah', 'Emma', 'Sophia',
            'Mateo', 'Amara', 'Wei', 'Priya', 'Yuki', 'Omar', 'Chen', 'Fatima', 'Diego', 'Nina',
            'Leo', 'Hannah', 'Ethan', 'Grace', 'Lucas', 'Mia', 'Henry', 'Zoe', 'Samuel', 'Layla',
            'Jack', 'Aria', 'Owen', 'Chloe', 'Caleb', 'Ruby', 'Isaac', 'Maya', 'Gabriel', 'Aaliyah'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
            'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark',
            'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
            'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts', 'Patel', 'Kim', 'Singh', 'Okafor', 'Rossi', 'Mueller', 'Kowalski', 'Haddad'],
        domains: ['example.com', 'example.org', 'mail.com', 'test.dev', 'acme.io', 'demo.app',
            'mailbox.net', 'inbox.co', 'corp.example', 'webmail.example', 'fastmail.test', 'mailbox.dev',
            'hey.test', 'post.example', 'maildrop.io', 'sample.io', 'devmail.co', 'mybox.app',
            'getmail.test', 'zmail.example'],
        // city ↔ state ↔ zip ↔ country ↔ lat ↔ lng kept consistent within each row
        locations: [
            { city: 'New York', state: 'NY', zip: '10001', country: 'US', lat: 40.7128, lng: -74.0060 },
            { city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US', lat: 34.0522, lng: -118.2437 },
            { city: 'Chicago', state: 'IL', zip: '60601', country: 'US', lat: 41.8781, lng: -87.6298 },
            { city: 'Houston', state: 'TX', zip: '77001', country: 'US', lat: 29.7604, lng: -95.3698 },
            { city: 'Phoenix', state: 'AZ', zip: '85001', country: 'US', lat: 33.4484, lng: -112.0740 },
            { city: 'Philadelphia', state: 'PA', zip: '19101', country: 'US', lat: 39.9526, lng: -75.1652 },
            { city: 'San Antonio', state: 'TX', zip: '78201', country: 'US', lat: 29.4241, lng: -98.4936 },
            { city: 'San Diego', state: 'CA', zip: '92101', country: 'US', lat: 32.7157, lng: -117.1611 },
            { city: 'Dallas', state: 'TX', zip: '75201', country: 'US', lat: 32.7767, lng: -96.7970 },
            { city: 'Seattle', state: 'WA', zip: '98101', country: 'US', lat: 47.6062, lng: -122.3321 },
            { city: 'Denver', state: 'CO', zip: '80201', country: 'US', lat: 39.7392, lng: -104.9903 },
            { city: 'Boston', state: 'MA', zip: '02101', country: 'US', lat: 42.3601, lng: -71.0589 },
            { city: 'Austin', state: 'TX', zip: '73301', country: 'US', lat: 30.2672, lng: -97.7431 },
            { city: 'Portland', state: 'OR', zip: '97201', country: 'US', lat: 45.5152, lng: -122.6784 },
            { city: 'Miami', state: 'FL', zip: '33101', country: 'US', lat: 25.7617, lng: -80.1918 },
            { city: 'Atlanta', state: 'GA', zip: '30301', country: 'US', lat: 33.7490, lng: -84.3880 },
            { city: 'Nashville', state: 'TN', zip: '37201', country: 'US', lat: 36.1627, lng: -86.7816 },
            { city: 'Detroit', state: 'MI', zip: '48201', country: 'US', lat: 42.3314, lng: -83.0458 },
            { city: 'Minneapolis', state: 'MN', zip: '55401', country: 'US', lat: 44.9778, lng: -93.2650 },
            { city: 'Las Vegas', state: 'NV', zip: '89101', country: 'US', lat: 36.1699, lng: -115.1398 },
            { city: 'Sacramento', state: 'CA', zip: '95814', country: 'US', lat: 38.5816, lng: -121.4944 },
            { city: 'Columbus', state: 'OH', zip: '43215', country: 'US', lat: 39.9612, lng: -82.9988 },
            { city: 'Charlotte', state: 'NC', zip: '28202', country: 'US', lat: 35.2271, lng: -80.8431 },
            { city: 'Indianapolis', state: 'IN', zip: '46201', country: 'US', lat: 39.7684, lng: -86.1581 },
            { city: 'Kansas City', state: 'MO', zip: '64101', country: 'US', lat: 39.0997, lng: -94.5786 }
        ],
        // generic street names that exist in essentially every US city (no city-specific landmarks),
        // so a fabricated street stays plausible alongside any location tuple.
        streets: ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm St', 'Washington Ave',
            'Lakeview Rd', 'Park Ave', 'Hillcrest Dr', 'Riverside Dr', '2nd St', '5th Ave', 'Highland Ave',
            'Meadow Ln', 'Birch St', 'Willow Way', 'Forest Dr', 'Church St', 'Spring St'],
        companies: ['Acme Corp', 'Globex', 'Initech', 'Umbrella LLC', 'Stark Industries', 'Wayne Enterprises',
            'Hooli', 'Vandelay Industries', 'Soylent Co', 'Cyberdyne Systems', 'Wonka Industries', 'Massive Dynamic',
            'Aperture Labs', 'Tyrell Corp', 'Nakatomi Trading', 'Pied Piper', 'Gekko & Co', 'Oscorp', 'Bluth Company', 'Prestige Worldwide'],
        jobTitles: ['Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer', 'DevOps Engineer',
            'QA Engineer', 'Project Manager', 'Account Executive', 'Marketing Specialist', 'Support Engineer',
            'Engineering Manager', 'Solutions Architect', 'Data Scientist', 'Sales Director', 'Business Analyst',
            'Content Strategist', 'Site Reliability Engineer', 'Customer Success Manager', 'Finance Manager', 'Operations Lead'],
        words: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
            'eiusmod', 'tempor', 'incididunt', 'labore', 'magna', 'aliqua', 'enim', 'minim', 'veniam', 'quis',
            'nostrud', 'ullamco', 'laboris', 'aliquip', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'reprehenderit',
            'voluptate', 'velit', 'esse', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
            'proident', 'sunt', 'culpa', 'officia', 'deserunt', 'mollit', 'anim', 'est', 'laborum', 'perspiciatis',
            'unde', 'omnis', 'iste', 'natus', 'accusantium', 'doloremque'],
        colors: ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'teal', 'magenta', 'cyan', 'lime', 'navy', 'maroon'],
        currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'SEK']
    };

    // ── Small helpers ────────────────────────────────────────────────────────
    function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    function pad(n, len) { var s = String(n); while (s.length < len) s = '0' + s; return s; }
    function toISO(ms) { return new Date(ms).toISOString(); }
    // Standalone so `paragraph` doesn't reach into the GENERATORS literal (survives registry overrides).
    function makeSentence(rng, n) {
        var out = [];
        for (var i = 0; i < n; i++) out.push(rng.pick(DATA.words));
        var s = out.join(' ');
        return s.charAt(0).toUpperCase() + s.slice(1) + '.';
    }
    var DAY = 86400000;
    var FIXED_EPOCH = 1577836800000; // 2020-01-01T00:00:00Z — deterministic anchor base

    // ── Generator registry (context-aware) ───────────────────────────────────
    var GENERATORS = {
        uuid: function (ctx, o, rng, e) {
            if (!e.seeded && root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
            return rngUuidV4(rng);
        },
        id: function (ctx, o, rng) { return rng.int(o.min != null ? o.min : 1, o.max != null ? o.max : 100000); },
        int: function (ctx, o, rng) { return rng.int(o.min != null ? o.min : 0, o.max != null ? o.max : 1000); },
        float: function (ctx, o, rng) { return rng.float(o.min != null ? o.min : 0, o.max != null ? o.max : 1000, o.decimals != null ? o.decimals : 2); },
        price: function (ctx, o, rng) { return rng.float(o.min != null ? o.min : 1, o.max != null ? o.max : 999, 2); },
        boolean: function (ctx, o, rng) { return rng.bool(o.trueChance); },

        firstName: function (ctx) { return ctx.firstName(); },
        lastName: function (ctx) { return ctx.lastName(); },
        fullName: function (ctx) { return ctx.firstName() + ' ' + ctx.lastName(); },
        username: function (ctx, o, rng) { return slug(ctx.firstName()) + slug(ctx.lastName()) + rng.int(1, 999); },
        email: function (ctx) { return slug(ctx.firstName()) + '.' + slug(ctx.lastName()) + '@' + ctx.domain(); },
        domain: function (ctx) { return ctx.domain(); },
        url: function (ctx) { return 'https://' + ctx.domain(); },
        avatarUrl: function (ctx) { return 'https://' + ctx.domain() + '/avatars/' + slug(ctx.firstName()) + slug(ctx.lastName()) + '.png'; },
        // NOTE: US (+1) format only. Multi-locale phone formats are a v2 concern (see roadmap).
        phone: function (ctx, o, rng) { return '+1-' + rng.int(200, 999) + '-' + pad(rng.int(0, 999), 3) + '-' + pad(rng.int(0, 9999), 4); },

        ipv4: function (ctx, o, rng) { return rng.int(1, 255) + '.' + rng.int(0, 255) + '.' + rng.int(0, 255) + '.' + rng.int(1, 254); },
        ipv6: function (ctx, o, rng) { var p = []; for (var i = 0; i < 8; i++) p.push(pad(rng.int(0, 65535).toString(16), 4)); return p.join(':'); },
        mac: function (ctx, o, rng) { var p = []; for (var i = 0; i < 6; i++) p.push(pad(rng.int(0, 255).toString(16), 2)); return p.join(':'); },

        country: function (ctx) { return ctx.locationTuple().country; },
        city: function (ctx) { return ctx.locationTuple().city; },
        state: function (ctx) { return ctx.locationTuple().state; },
        zip: function (ctx) { return ctx.locationTuple().zip; },
        latitude: function (ctx) { return ctx.locationTuple().lat; },
        longitude: function (ctx) { return ctx.locationTuple().lng; },
        streetAddress: function (ctx, o, rng) { return rng.int(1, 9999) + ' ' + rng.pick(DATA.streets); },

        datetime: function (ctx, o, rng) { return toISO(ctx.baseTimestamp() + rng.int(0, DAY)); },
        date: function (ctx, o, rng) { return toISO(ctx.baseTimestamp() + rng.int(0, DAY)).slice(0, 10); },
        time: function (ctx, o, rng) { return pad(rng.int(0, 23), 2) + ':' + pad(rng.int(0, 59), 2) + ':' + pad(rng.int(0, 59), 2); },
        timestamp: function (ctx, o, rng) { return Math.floor((ctx.baseTimestamp() + rng.int(0, DAY)) / 1000); },

        // generic catch-all string — used by the sample-inference tie-break when a field's
        // type disagrees across samples (e.g. sometimes an email, sometimes an int).
        string: function (ctx, o, rng) { var w = rng.pick(DATA.words); return w.charAt(0).toUpperCase() + w.slice(1) + ' ' + rng.int(100, 9999); },
        word: function (ctx, o, rng) { return rng.pick(DATA.words); },
        words: function (ctx, o, rng) {
            var n = o.count != null ? o.count : rng.int(2, 5), out = [];
            for (var i = 0; i < n; i++) out.push(rng.pick(DATA.words));
            return out.join(' ');
        },
        sentence: function (ctx, o, rng) { return makeSentence(rng, o.words != null ? o.words : rng.int(5, 12)); },
        paragraph: function (ctx, o, rng) {
            var n = o.sentences != null ? o.sentences : rng.int(3, 5), out = [];
            for (var i = 0; i < n; i++) out.push(makeSentence(rng, rng.int(5, 12)));
            return out.join(' ');
        },
        company: function (ctx, o, rng) { return rng.pick(DATA.companies); },
        jobTitle: function (ctx, o, rng) { return rng.pick(DATA.jobTitles); },
        color: function (ctx, o, rng) { return rng.pick(DATA.colors); },
        currency: function (ctx, o, rng) { return rng.pick(DATA.currencies); },

        enum: function (ctx, o, rng) {
            var values = (o.values && o.values.length) ? o.values : ['A', 'B', 'C'];
            return rng.pick(values);
        },
        constant: function (ctx, o) { return o.value != null ? o.value : null; },
        'null': function () { return null; }
    };

    // UI metadata: dropdown grouping for the field picker (value must be a registry key).
    var GENERATOR_LIST = [
        { group: 'Identity', items: ['uuid', 'id', 'firstName', 'lastName', 'fullName', 'username', 'email', 'phone', 'avatarUrl'] },
        { group: 'Internet', items: ['url', 'domain', 'ipv4', 'ipv6', 'mac'] },
        { group: 'Location', items: ['country', 'city', 'state', 'zip', 'streetAddress', 'latitude', 'longitude'] },
        { group: 'Date & time', items: ['datetime', 'date', 'time', 'timestamp'] },
        { group: 'Numbers', items: ['int', 'float', 'price', 'boolean'] },
        { group: 'Text', items: ['string', 'word', 'words', 'sentence', 'paragraph', 'company', 'jobTitle', 'color', 'currency'] },
        { group: 'Structural', items: ['enum', 'constant', 'null', 'object', 'array'] }
    ];

    // ── Declarative coherence rules (extensible; matched by field NAME) ───────
    // A rule's formula(ctx, rng, engine) wins over the field's generator.
    // dependsOn entries that are SIBLING field names create ordering edges
    // (topologically sorted, with cycle detection); identity dependsOn
    // (firstName/lastName/domain/locationTuple) are satisfied lazily by ctx.
    function locProp(prop) {
        return function (ctx) { return ctx.locationTuple()[prop]; };
    }
    var DEFAULT_RULES = [
        { target: ['fullName'], dependsOn: ['firstName', 'lastName'], formula: function (ctx) { return ctx.firstName() + ' ' + ctx.lastName(); } },
        { target: ['email'], dependsOn: ['firstName', 'lastName', 'domain'], formula: function (ctx) { return slug(ctx.firstName()) + '.' + slug(ctx.lastName()) + '@' + ctx.domain(); } },
        { target: ['username', 'userName'], dependsOn: ['firstName', 'lastName'], formula: function (ctx, rng) { return slug(ctx.firstName()) + slug(ctx.lastName()) + rng.int(1, 999); } },
        { target: ['city'], dependsOn: ['locationTuple'], formula: locProp('city') },
        { target: ['state'], dependsOn: ['locationTuple'], formula: locProp('state') },
        { target: ['zip', 'zipCode', 'postalCode'], dependsOn: ['locationTuple'], formula: locProp('zip') },
        { target: ['country'], dependsOn: ['locationTuple'], formula: locProp('country') },
        { target: ['lat', 'latitude'], dependsOn: ['locationTuple'], formula: locProp('lat') },
        { target: ['lng', 'lon', 'longitude'], dependsOn: ['locationTuple'], formula: locProp('lng') },
        { target: ['updatedAt', 'updated_at'], dependsOn: ['createdAt', 'created_at'], formula: function (ctx, rng) {
            var base = ctx.fields.createdAt != null ? ctx.fields.createdAt : ctx.fields.created_at;
            var t = base ? Date.parse(base) : NaN;
            if (isNaN(t)) t = ctx.baseTimestamp();
            return toISO(t + rng.int(0, 30 * DAY));
        } }
        // NOTE: avatarUrl has no coherence rule — the avatarUrl generator already derives from
        // ctx.firstName/lastName/domain, so a rule would be an exact duplicate (was BUG-10).
    ];

    function buildRuleIndex(rules) {
        var idx = {};
        rules.forEach(function (rule) {
            rule.target.forEach(function (name) { idx[name] = rule; });
        });
        return idx;
    }

    // ── Compile a MockSchema level: resolve per-field rule + topo order ───────
    // MockSchema = [{ name, generator, options, nullChance }]
    //   generator 'object' → options.fields (MockSchema)
    //   generator 'array'  → options.item ({ generator, options, nullChance }), options.count (int | {min,max})
    function compileLevel(fields, ruleIndex) {
        var names = fields.map(function (f) { return f.name; });
        var nameSet = {};
        names.forEach(function (n) { nameSet[n] = true; });

        fields.forEach(function (f) {
            f._rule = ruleIndex[f.name] || null;
            if (f.generator === 'object' && f.options && f.options.fields) {
                f._compiled = compileLevel(f.options.fields, ruleIndex);
            } else if (f.generator === 'array' && f.options && f.options.item) {
                var item = f.options.item;
                if (item.generator === 'object' && item.options && item.options.fields) {
                    item._compiled = compileLevel(item.options.fields, ruleIndex);
                } else {
                    item._rule = ruleIndex[item.name] || null;
                }
            }
        });

        // Edges: X → Y when field Y's rule dependsOn a SIBLING field X.
        var indeg = {}, adj = {};
        names.forEach(function (n) { indeg[n] = 0; adj[n] = []; });
        fields.forEach(function (f) {
            if (!f._rule) return;
            f._rule.dependsOn.forEach(function (dep) {
                if (nameSet[dep] && dep !== f.name) {
                    adj[dep].push(f.name);
                    indeg[f.name]++;
                }
            });
        });

        // Kahn topological sort (stable: seed the queue in declared order).
        var queue = [], order = [];
        names.forEach(function (n) { if (indeg[n] === 0) queue.push(n); });
        while (queue.length) {
            var n = queue.shift();
            order.push(n);
            adj[n].forEach(function (m) { if (--indeg[m] === 0) queue.push(m); });
        }
        if (order.length !== names.length) {
            var stuck = names.filter(function (n) { return order.indexOf(n) === -1; });
            throw new Error('Circular coherence dependency involving: ' + stuck.join(', '));
        }

        var byName = {};
        fields.forEach(function (f) { byName[f.name] = f; });
        return { fields: fields, order: order.map(function (n) { return byName[n]; }) };
    }

    // ── Per-row context (lazy identity, cached; nested objects share identity) ─
    function makeRowContext(rng, engine, parent) {
        var cache = parent ? parent._cache : {};
        var fields = {};
        function once(key, fn) { if (!(key in cache)) cache[key] = fn(); return cache[key]; }
        var ctx = {
            _cache: cache,
            rng: rng,
            fields: fields,
            firstName: function () { return once('firstName', function () { return rng.pick(DATA.firstNames); }); },
            lastName: function () { return once('lastName', function () { return rng.pick(DATA.lastNames); }); },
            domain: function () { return once('domain', function () { return rng.pick(DATA.domains); }); },
            locationTuple: function () { return once('loc', function () { return rng.pick(DATA.locations); }); },
            personId: function () { return once('personId', function () { return rng.int(1, 1000000000); }); },
            baseTimestamp: function () { return once('baseTs', function () { return engine.anchorTime - rng.int(0, 730 * DAY); }); }
        };
        ctx.child = function () { return makeRowContext(rng, engine, ctx); };
        return ctx;
    }

    function resolveCount(count, rng) {
        if (count == null) return rng.int(1, 3);
        if (typeof count === 'number') return count < 0 ? 0 : count;
        var min = count.min != null ? count.min : 0;
        var max = count.max != null ? count.max : 3;
        if (min < 0) min = 0;
        if (max < min) max = min; // guard against a user setting Min > Max (was BUG-04)
        return rng.int(min, max);
    }

    function produceValue(field, ctx, rng, engine) {
        if (field.generator === 'object') {
            return buildObject(field._compiled, ctx.child(), rng, engine);
        }
        if (field.generator === 'array') {
            var n = resolveCount(field.options && field.options.count, rng);
            var item = field.options && field.options.item;
            var arr = [];
            for (var i = 0; i < n; i++) arr.push(produceItem(item, ctx, rng, engine));
            return arr;
        }
        var gen = GENERATORS[field.generator] || GENERATORS.word;
        return gen(ctx, field.options || {}, rng, engine);
    }

    function produceField(field, ctx, rng, engine) {
        var value = field._rule ? field._rule.formula(ctx, rng, engine) : produceValue(field, ctx, rng, engine);
        // Always draw for nullChance (when set) so per-row draw counts stay constant.
        if (field.nullChance) value = (rng.next() < field.nullChance) ? null : value;
        return value;
    }

    function produceItem(item, ctx, rng, engine) {
        if (!item) return null;
        if (item.generator === 'object') return buildObject(item._compiled, ctx.child(), rng, engine);
        var value = item._rule ? item._rule.formula(ctx, rng, engine)
                               : (GENERATORS[item.generator] || GENERATORS.word)(ctx, item.options || {}, rng, engine);
        if (item.nullChance) value = (rng.next() < item.nullChance) ? null : value;
        return value;
    }

    function buildObject(compiled, ctx, rng, engine) {
        // Compute in topological order so a field can read a sibling's value…
        compiled.order.forEach(function (field) {
            ctx.fields[field.name] = produceField(field, ctx, rng, engine);
        });
        // …but emit keys in the schema's declared order (stable key ordering).
        var out = {};
        compiled.fields.forEach(function (field) { out[field.name] = ctx.fields[field.name]; });
        return out;
    }

    // ── Public: streaming session (chunk-safe) + one-shot generate ────────────
    function createSession(schema, opts) {
        opts = opts || {};
        if (!Array.isArray(schema)) throw new Error('MockSchema must be an array of fields.');

        var seeded = opts.seed != null && String(opts.seed).length > 0;
        var seedStr = seeded ? String(opts.seed) : null;
        var rng = makeRng(seeded ? xmur3(seedStr)() : ((Math.random() * 4294967296) >>> 0));

        var anchorTime;
        if (seeded) anchorTime = FIXED_EPOCH + (xmur3('ts:' + seedStr)() % (1825 * DAY)); // within ~5y of epoch
        else anchorTime = Date.now();

        var engine = { seeded: seeded, anchorTime: anchorTime, rng: rng };
        var ruleIndex = buildRuleIndex(opts.rules || DEFAULT_RULES);
        var compiled = compileLevel(schema, ruleIndex); // throws on cycle

        return {
            engine: engine,
            // Generate the next k rows, advancing the single shared RNG stream.
            nextRows: function (k) {
                var rows = [];
                for (var i = 0; i < k; i++) rows.push(buildObject(compiled, makeRowContext(rng, engine), rng, engine));
                return rows;
            }
        };
    }

    function generate(schema, opts) {
        opts = opts || {};
        var count = opts.count != null ? opts.count : 10;
        return createSession(schema, opts).nextRows(count);
    }

    return {
        createSession: createSession,
        generate: generate,
        GENERATORS: GENERATORS,
        GENERATOR_LIST: GENERATOR_LIST,
        DEFAULT_RULES: DEFAULT_RULES,
        DATA: DATA,
        _internal: { xmur3: xmur3, mulberry32: mulberry32, compileLevel: compileLevel, slug: slug }
    };
});
