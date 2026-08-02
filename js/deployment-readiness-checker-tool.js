// ============================================
// DEPLOYMENT READINESS CHECKER
// Paste a package.json (and optionally a .env / .env.example and .gitignore)
// and get a scored, per-category readiness report with actionable fixes.
//
// 100% client-side. No network calls, nothing you paste leaves the browser —
// which matters because people paste real .env files here.
//
// Architecture: one "inspector" per input type. The engine runs them in a
// fixed order (package.json -> framework detection -> .gitignore -> .env ->
// dependency) so cross-inspector state (e.g. whether .gitignore ignores .env)
// exists before it is read. Each inspector pushes findings shaped:
//   { id, category, severity, status, points, title, detail, fix, docsLink? }
// status: 'pass' (✅, full points), 'fail' (deducts points), 'note' (advisory,
// no score impact). A category's budget is the sum of pass+fail points that
// actually ran, so an input you didn't paste is simply "not checked", never a
// zero. The published rubric on the page is generated from these same checks.
// ============================================
(function () {
    'use strict';

    var BASE = 'https://jsondevtools.org/';
    var DOCS = {
        jsonSyntax:   BASE + 'errors/expecting-property-name-double-quotes.html',
        jsonErrors:   BASE + 'blog/common-json-errors.html',
        envVar:       BASE + 'errors/process-env-undefined.html',
        envFormat:    BASE + 'blog/env-file-format.html',
        docker:       BASE + 'docker-image-optimizer.html',
        npmResolve:   BASE + 'errors/npm-eresolve-unable-to-resolve-dependency-tree.html',
        health:       BASE + 'blog/health-check-endpoint-express-nestjs-nextjs.html',
        pillar:       BASE + 'blog/node-production-readiness-checklist.html',
        status200:    BASE + 'http-status/200.html',
        status503:    BASE + 'http-status/503.html'
    };

    var CATEGORIES = ['Scripts', 'Configuration', 'Documentation', 'Security', 'Docker', 'CI'];

    var SEV = {
        high: { label: 'High',   icon: '❌', order: 0 },
        med:  { label: 'Medium', icon: '⚠️', order: 1 },
        info: { label: 'Info',   icon: 'ℹ️', order: 2 },
        ok:   { label: 'Pass',   icon: '✅', order: 3 }
    };

    // ---------- secret-shape detection ----------
    // Reuses the proven shapes from the Log Redactor. These match a VALUE (the
    // right-hand side of KEY=VALUE), so they are anchored with ^…$ where useful.
    var SECRET_SHAPES = [
        { label: 'AWS access key ID', rx: /^(?:AKIA|ASIA|ABIA|ACCA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA)[0-9A-Z]{16}$/ },
        { label: 'JWT',               rx: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/ },
        { label: 'Stripe key',        rx: /^[spr]k_(?:live|test)_[A-Za-z0-9]{16,}$/ },
        { label: 'GitHub token',      rx: /^(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{22,255})$/ },
        { label: 'Google API key',    rx: /^AIza[0-9A-Za-z_-]{35}$/ },
        { label: 'Slack token',       rx: /^xox[baprse]-[A-Za-z0-9-]{10,}$/ },
        { label: 'npm token',         rx: /^npm_[A-Za-z0-9]{36,}$/ },
        { label: 'API key (sk-…)',    rx: /^sk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,}$/ }
    ];
    // Connection strings / URLs that embed user:password@host.
    var URL_CREDS = /^[a-z][a-z0-9+.-]*:\/\/[^\/\s:@'"]+:[^\/\s@'"]+@/i;
    var PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;

    // Values that are obviously placeholders, not real secrets.
    var PLACEHOLDER_RX = /^(?:x{3,}|changeme|change[-_]?me|your[-_ ]?[a-z0-9_ -]*|<[^>]*>|\{\{?[^}]*\}?\}|replace[-_ ]?me|placeholder|example|dummy|todo|tbd|secret|password|pwd|token|api[-_]?key|value|none|null|n\/a)$/i;

    function isPlaceholder(v) {
        if (!v) return true; // empty value == unset
        return PLACEHOLDER_RX.test(v.trim());
    }

    // Shannon entropy in bits per character.
    function entropy(s) {
        if (!s) return 0;
        var freq = {}, i;
        for (i = 0; i < s.length; i++) freq[s[i]] = (freq[s[i]] || 0) + 1;
        var e = 0;
        Object.keys(freq).forEach(function (k) {
            var p = freq[k] / s.length;
            e -= p * (Math.log(p) / Math.log(2));
        });
        return e;
    }

    // Key names that signal the VALUE is meant to be a secret. Used to gate the
    // ambiguous high-entropy heuristic so ordinary config (URLs, snake_case
    // words) isn't flagged just for looking random.
    var SECRETISH_KEY = /(password|passwd|pwd|secret|token|api[_-]?key|apikey|access[_-]?key|private[_-]?key|client[_-]?secret|credentials?|auth[_-]?token|session[_-]?key|encryption[_-]?key)/i;

    // Return a human label if the value looks like a secret, else null.
    // `key` (the variable name) gates the generic heuristic only.
    function looksSecret(value, key) {
        if (!value) return null;
        var v = value.trim().replace(/^["']|["']$/g, '');
        if (!v || isPlaceholder(v)) return null;
        if (PRIVATE_KEY.test(v)) return 'private key';
        if (URL_CREDS.test(v)) return 'credentials in a connection string';
        // Vendor-shaped tokens are unambiguous regardless of the variable name.
        for (var i = 0; i < SECRET_SHAPES.length; i++) {
            if (SECRET_SHAPES[i].rx.test(v)) return SECRET_SHAPES[i].label;
        }
        // A plain URL/URI with no embedded credentials is not a secret.
        if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return null;
        // Generic high-entropy is ambiguous — only apply it when the KEY name
        // signals a secret. This stops plain URLs and ordinary snake_case config
        // values (WELCOME_MESSAGE=this_is_a_config_value) from being flagged.
        if (key && SECRETISH_KEY.test(key)) {
            var charsets = 0;
            if (/[a-z]/.test(v)) charsets++;
            if (/[A-Z]/.test(v)) charsets++;
            if (/[0-9]/.test(v)) charsets++;
            if (/[^A-Za-z0-9]/.test(v)) charsets++;
            if (v.length >= 16 && charsets >= 2 && !/\s/.test(v) && entropy(v) >= 3.3) {
                return 'high-entropy string';
            }
        }
        return null;
    }

    // ---------- parsers ----------
    function parsePackageJson(text) {
        if (!text || !text.trim()) return { present: false };
        try {
            var obj = JSON.parse(text);
            // Valid JSON that isn't an object (null, array, number, string, bool)
            // is not a usable package.json — route it into the friendly invalid path
            // instead of letting o.private / o.dependencies throw later.
            if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
                return { present: true, error: 'package.json must be a JSON object, but this parsed as ' +
                    (Array.isArray(obj) ? 'an array' : obj === null ? 'null' : typeof obj) + '.' };
            }
            return { present: true, obj: obj };
        } catch (e) {
            return { present: true, error: e.message };
        }
    }

    // Parse a .env-style file into { pairs:[{key,value,line}], dupes:[key], malformed:[{line,raw}] }
    function parseEnv(text) {
        var pairs = [], seen = {}, dupes = [], malformed = [];
        if (!text || !text.trim()) return { present: false, pairs: pairs, dupes: dupes, malformed: malformed };
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            if (trimmed === '' || trimmed.charAt(0) === '#') continue;
            var m = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
            if (!m) {
                malformed.push({ line: i + 1, raw: trimmed });
                continue;
            }
            var key = m[1];
            var value = m[2].trim();
            if (seen[key]) { if (dupes.indexOf(key) === -1) dupes.push(key); }
            seen[key] = true;
            pairs.push({ key: key, value: value, line: i + 1 });
        }
        return { present: true, pairs: pairs, dupes: dupes, malformed: malformed };
    }

    function parseGitignore(text) {
        var patterns = [];
        if (!text || !text.trim()) return { present: false, patterns: patterns };
        text.split('\n').forEach(function (line) {
            var t = line.trim();
            if (t === '' || t.charAt(0) === '#') return;
            patterns.push(t.replace(/^\//, '').replace(/\/$/, ''));
        });
        return { present: true, patterns: patterns };
    }

    function gitignoreMatches(patterns, name) {
        // Lightweight matcher good enough for the fixed names we test.
        return patterns.some(function (p) {
            if (p === name) return true;
            if (p === name + '*' || p === name + '.*') return true;
            if (p === '*' ) return true;
            if (p.charAt(0) === '*' && name.slice(-(p.length - 1)) === p.slice(1)) return true; // *.env
            if (p.slice(-1) === '*' && name.slice(0, p.length - 1) === p.slice(0, -1)) return true; // .env*
            return false;
        });
    }

    // ---------- inspectors ----------
    // Each returns an array of findings. A finding:
    //  { id, category, severity, status:'pass'|'fail'|'note', points, title, detail, fix, docsLink? }
    function has(obj, path) {
        var v = obj;
        var parts = path.split('.');
        for (var i = 0; i < parts.length; i++) {
            if (v == null || typeof v !== 'object') return false;
            v = v[parts[i]];
        }
        return v !== undefined && v !== null && v !== '';
    }

    var DEFAULT_TEST_SCRIPT = /no test specified/i;

    // Dependencies that imply a compile/bundle step, so a missing `build` script
    // is a real (medium) risk. Without any of these, no build script is needed.
    var COMPILE_DEPS = [
        'typescript', 'ts-node', 'webpack', 'rollup', 'esbuild', 'vite', 'parcel',
        '@swc/core', 'swc', 'tsup', 'microbundle', 'snowpack', '@babel/core',
        'next', 'nuxt', '@angular/core', '@angular/cli', 'svelte', '@sveltejs/kit',
        'astro', 'gatsby', '@remix-run/dev'
    ];

    // Best-effort ESM detection from package.json alone (no source is pasted).
    // Signals: a `module` field, a `.mjs` entrypoint/script, or an `import`
    // condition in `exports`. Absent these, we treat `type` as advisory only.
    function detectEsm(o) {
        if (!o) return false;
        if (o.module) return true;
        var blob = (o.main || '') + ' ' + (o.bin ? JSON.stringify(o.bin) : '') + ' ' + JSON.stringify(o.scripts || '');
        if (/\.mjs\b/.test(blob)) return true;
        if (o.exports && /"import"\s*:/.test(JSON.stringify(o.exports))) return true;
        return false;
    }

    function inspectPackageJson(ctx) {
        var out = [];
        var pkg = ctx.pkg;
        if (!pkg.present) return out; // package.json is the primary input; nothing to check
        if (pkg.error) {
            out.push({
                id: 'pkg-invalid', category: 'Configuration', severity: 'high', status: 'fail', points: 25,
                title: 'package.json is not valid JSON',
                detail: 'The parser failed: ' + pkg.error + '. Nothing else about package.json could be checked until it parses.',
                fix: 'Fix the JSON syntax (a trailing comma and unquoted keys are the usual causes). Paste it into a JSON validator to pinpoint the line.',
                docsLink: DOCS.jsonSyntax
            });
            return out;
        }
        var o = pkg.obj;
        var scripts = (o && o.scripts) || {};

        // Three-tier model:
        //  scored() — high/med checks that actually move the score (deploy-breakers
        //             and conditional real risks). Shows ✅ on pass, deducts on fail.
        //  advise() — info-tier hygiene. Shown ONLY when missing, as a quiet note,
        //             and NEVER scored (0 points), so tidy-metadata can't dominate
        //             a "will it deploy" readiness score.
        function scored(cond, sev, points, f) {
            f.severity = cond ? 'ok' : sev;
            f.status = cond ? 'pass' : 'fail';
            f.points = points;
            out.push(f);
        }
        function advise(cond, f) {
            if (cond) return;
            f.severity = 'info'; f.status = 'note'; f.points = 0;
            out.push(f);
        }

        var hasCompileDep = COMPILE_DEPS.some(function (d) { return ctx.deps[d]; });

        // ---- Scripts ----
        scored(!!scripts.start, 'high', 12, {
            id: 'script-start', category: 'Scripts',
            title: 'A "start" script for production',
            failTitle: 'No "start" script — the host can\'t boot your app',
            detail: 'Hosts (Heroku, Render, Railway, App Runner, most PaaS) run `npm start` to boot your app. Without a `start` script the platform has nothing to launch.',
            fix: 'Add `"start": "node server.js"` (point it at your real entrypoint, not `nodemon`/`ts-node-dev`).'
        });
        // build: only relevant when something in the project needs compiling.
        if (scripts.build) {
            scored(true, 'med', 6, {
                id: 'script-build', category: 'Scripts',
                title: 'A "build" script', detail: 'A build step is defined.', fix: ''
            });
        } else if (hasCompileDep) {
            scored(false, 'med', 6, {
                id: 'script-build', category: 'Scripts',
                title: 'No "build" script, but this project needs compiling',
                detail: 'Your dependencies include a compiler or bundler (e.g. TypeScript, Vite, webpack, or a framework build), so CI and your host need a `build` step to produce runnable output before `start`.',
                fix: 'Add a `"build"` script (e.g. `"build": "tsc"` or your bundler/framework build command).'
            });
        } // else: no compile-implying deps — a build script isn\'t needed, so nothing is reported.
        advise(!!scripts.test && !DEFAULT_TEST_SCRIPT.test(scripts.test), {
            id: 'script-test', category: 'Scripts',
            title: 'Add a real "test" script',
            detail: scripts.test && DEFAULT_TEST_SCRIPT.test(scripts.test)
                ? 'The `test` script is still the npm placeholder ("Error: no test specified"), so `npm test` in CI tests nothing.'
                : 'No `test` script means CI has nothing to run to catch a regression before it ships.',
            fix: 'Wire `"test"` to your runner (`"test": "vitest run"`, `"jest"`, `"node --test"`, …).'
        });
        advise(!!scripts.lint, {
            id: 'script-lint', category: 'Scripts',
            title: 'Add a "lint" script',
            detail: 'A `lint` script lets CI catch style and error-prone patterns before they merge.',
            fix: 'Add `"lint": "eslint ."` (or your linter of choice).'
        });

        // ---- Configuration ----
        scored(has(o, 'name') && has(o, 'version'), 'high', 4, {
            id: 'cfg-name-version', category: 'Configuration',
            title: 'name and version fields',
            failTitle: 'Missing name or version field',
            detail: 'A missing `name` or `version` breaks tooling that reads them (some hosts, lockfile resolution, publishing).',
            fix: 'Add both: `"name": "my-app"`, `"version": "1.0.0"`.'
        });
        scored(has(o, 'engines.node'), 'high', 8, {
            id: 'cfg-engines', category: 'Configuration',
            title: 'engines.node declared',
            failTitle: 'engines.node is not declared',
            detail: 'Without `engines.node`, a host is free to run your app on whatever Node version it defaults to — a version mismatch is a classic "works locally, crashes in prod" bug.',
            fix: 'Pin a range: `"engines": { "node": ">=20 <21" }` and match it to your host.',
            docsLink: DOCS.pillar
        });
        // type: only a warning when ESM is actually in use; otherwise a quiet note.
        if (has(o, 'type')) {
            // declared — nothing to report
        } else if (detectEsm(o)) {
            scored(false, 'med', 4, {
                id: 'cfg-type', category: 'Configuration',
                title: 'type not set, but this package looks like ESM',
                detail: 'ESM signals are present (a `.mjs` file, a `module` field, or an `import` condition in `exports`) but `"type"` is omitted, so Node defaults to CommonJS — the source of "Cannot use import statement outside a module" at runtime.',
                fix: 'Add `"type": "module"`.'
            });
        } else {
            advise(false, {
                id: 'cfg-type', category: 'Configuration',
                title: 'Consider declaring "type" (module / commonjs)',
                detail: 'Setting `"type"` explicitly removes any ambiguity about which module system your files use.',
                fix: 'Add `"type": "module"` or `"type": "commonjs"`.'
            });
        }
        advise(has(o, 'packageManager'), {
            id: 'cfg-pm', category: 'Configuration',
            title: 'Consider pinning packageManager (Corepack)',
            detail: 'Pinning `packageManager` makes every machine and CI runner use the same package manager and version, avoiding lockfile churn.',
            fix: 'Add `"packageManager": "npm@10.8.1"` (or pnpm/yarn at your version).'
        });
        advise(o.private === true || has(o, 'publishConfig'), {
            id: 'cfg-private', category: 'Configuration',
            title: 'Consider "private": true (accidental-publish guard)',
            detail: 'An application is not a library. Without `"private": true`, a stray `npm publish` can push your app — and any secrets in it — to the public registry.',
            fix: 'Add `"private": true` unless this package is genuinely meant to be published.'
        });

        // ---- Documentation (advisory only — tidy metadata has ~no bearing on
        // whether the app runs in production, so none of these are scored) ----
        advise(has(o, 'license'), {
            id: 'doc-license', category: 'Documentation',
            title: 'Add a license field',
            detail: 'A missing `license` leaves usage rights ambiguous and makes npm warn on install.',
            fix: 'Add an SPDX id: `"license": "MIT"` (or `"UNLICENSED"` for a closed-source app).'
        });
        advise(has(o, 'repository'), {
            id: 'doc-repo', category: 'Documentation',
            title: 'Add a repository field',
            detail: 'Links the package to its source — useful for teammates, tooling, and provenance.',
            fix: 'Add `"repository": { "type": "git", "url": "..." }`.'
        });
        advise(has(o, 'description'), {
            id: 'doc-description', category: 'Documentation',
            title: 'Add a description',
            detail: 'A one-line description documents intent for anyone (including future you) reading the manifest.',
            fix: 'Add a short `"description"`.'
        });
        advise(has(o, 'author') || has(o, 'contributors'), {
            id: 'doc-author', category: 'Documentation',
            title: 'Add an author', detail: 'Records ownership/contact.',
            fix: 'Add `"author": "Your Name <email>"`.'
        });

        return out;
    }

    // Framework detection — runs after package.json parse. Advisory notes only
    // (points 0): we cannot see your source, so these are recommendations, never
    // pass/fail. This is the differentiator: context-aware readiness advice.
    var FRAMEWORKS = [
        {
            dep: 'express', name: 'Express',
            title: 'Express detected — add a health-check route',
            detail: 'Load balancers and orchestrators poll a health endpoint to decide whether to send traffic. Express has none by default.',
            fix: 'Add `app.get("/health", (req, res) => res.status(200).json({ status: "ok" }))` and point your platform\'s health check at it.',
            docsLink: DOCS.health
        },
        {
            dep: '@nestjs/core', name: 'NestJS',
            title: 'NestJS detected — use @nestjs/terminus for health checks',
            detail: 'Terminus is the official Nest health-check module; it exposes readiness/liveness endpoints with built-in indicators (DB, disk, memory).',
            fix: 'Install `@nestjs/terminus` and expose a `/health` controller with the relevant health indicators.',
            docsLink: DOCS.health
        },
        {
            dep: 'next', name: 'Next.js',
            title: 'Next.js detected — consider output: "standalone"',
            detail: 'The standalone output traces only the files your server actually needs, producing a much smaller, self-contained deploy (ideal for Docker).',
            fix: 'Set `output: "standalone"` in `next.config.js`, and add a health route under `app/health/route.ts` (or `pages/api/health`).',
            docsLink: DOCS.health
        },
        {
            dep: 'vite', name: 'Vite',
            title: 'Vite detected — this builds a static bundle',
            detail: 'A Vite app compiles to static assets. It needs a static host or a separate server to serve `dist/` — there is no long-running Node process unless you added one.',
            fix: 'Deploy the `dist/` output to a static host/CDN, or serve it behind your API. A Node `start` script only applies to the API side.',
            docsLink: DOCS.pillar
        }
    ];

    function inspectFrameworks(ctx) {
        var out = [];
        if (!ctx.pkg.present || ctx.pkg.error) return out;
        FRAMEWORKS.forEach(function (fw) {
            if (ctx.deps[fw.dep]) {
                ctx.frameworks.push(fw.name);
                out.push({
                    id: 'fw-' + fw.dep, category: 'Scripts', severity: 'info', status: 'note', points: 0,
                    title: fw.title, detail: fw.detail, fix: fw.fix, docsLink: fw.docsLink
                });
            }
        });
        return out;
    }

    function inspectGitignore(ctx) {
        var out = [];
        var gi = ctx.gitignore;
        if (!gi.present) return out;
        // scored: real risk if committed. advisory: hygiene, shown only when missing.
        var checks = [
            { name: '.env',         tier: 'scored', sev: 'high', points: 10, alt: null,    why: 'A committed `.env` leaks every secret in it to anyone with repo access — the single most common credential leak.' },
            { name: 'node_modules', tier: 'scored', sev: 'med',  points: 4,  alt: null,    why: 'Committing `node_modules` bloats the repo and causes platform-specific binary conflicts.' },
            { name: 'dist',         tier: 'advise', sev: 'info', points: 0,  alt: 'build', why: 'Build output (`dist`/`build`) should be generated, not committed.' },
            { name: 'coverage',     tier: 'advise', sev: 'info', points: 0,  alt: null,    why: 'Coverage reports are generated artifacts.' },
            { name: '.DS_Store',    tier: 'advise', sev: 'info', points: 0,  alt: null,    why: 'macOS `.DS_Store` files are noise in a repo.' }
        ];
        checks.forEach(function (c) {
            var ignored = gitignoreMatches(gi.patterns, c.name) || (c.alt && gitignoreMatches(gi.patterns, c.alt));
            var label = 'Ignores `' + c.name + '`' + (c.alt ? '/`' + c.alt + '`' : '');
            if (c.tier === 'advise') {
                if (!ignored) out.push({
                    id: 'gi-' + c.name, category: 'Security', severity: 'info', status: 'note', points: 0,
                    title: 'Consider ignoring `' + c.name + '`' + (c.alt ? '/`' + c.alt + '`' : ''),
                    detail: c.why, fix: 'Add `' + c.name + '` to your `.gitignore`.'
                });
                return;
            }
            out.push({
                id: 'gi-' + c.name, category: 'Security', severity: ignored ? 'ok' : c.sev,
                status: ignored ? 'pass' : 'fail', points: c.points,
                title: label, failTitle: '`' + c.name + '`' + (c.alt ? '/`' + c.alt + '`' : '') + ' is not gitignored',
                detail: c.why, fix: 'Add `' + c.name + '` to your `.gitignore`.'
            });
        });
        return out;
    }

    function inspectEnv(ctx) {
        var out = [];
        var env = ctx.env, ex = ctx.envExample;

        // Secrets in .env.example — ALWAYS high, because .env.example is committed.
        if (ex.present) {
            ex.pairs.forEach(function (p) {
                var label = looksSecret(p.value, p.key);
                if (label) {
                    out.push({
                        id: 'ex-secret-' + p.key, category: 'Security', severity: 'high', status: 'fail', points: 8,
                        title: 'Possible ' + label + ' committed in .env.example (' + p.key + ')',
                        detail: '`.env.example` is meant to be committed and shared. A real-looking value here (line ' + p.line + ') means a secret is in version control.',
                        fix: 'Replace the value with a placeholder, e.g. `' + p.key + '=your-' + p.key.toLowerCase() + '-here`. Rotate the key if it was ever committed.',
                        docsLink: DOCS.envFormat
                    });
                }
            });
        }

        if (env.present) {
            // Secret in .env: severity depends on whether .env is gitignored.
            // A real .env holding secrets is doing its job — only a problem when
            // it can be committed. envIgnored === true -> info; false -> high;
            // null (no .gitignore pasted) -> info (we can't confirm the risk).
            var exposable = ctx.envIgnored === false;
            env.pairs.forEach(function (p) {
                var label = looksSecret(p.value, p.key);
                if (label) {
                    if (exposable) {
                        out.push({
                            id: 'env-secret-' + p.key, category: 'Security', severity: 'high', status: 'fail', points: 8,
                            title: 'Secret in .env, and .env is NOT gitignored (' + p.key + ')',
                            detail: 'Line ' + p.line + ' looks like a ' + label + ', and your pasted `.gitignore` does not ignore `.env` — so this secret can be committed.',
                            fix: 'Add `.env` to `.gitignore` now, and rotate the credential if it was already committed.',
                            docsLink: DOCS.envFormat
                        });
                    } else {
                        out.push({
                            id: 'env-secret-' + p.key, category: 'Security', severity: 'info', status: 'note', points: 0,
                            title: 'Real secret detected in .env (' + p.key + ') — expected',
                            detail: 'Line ' + p.line + ' looks like a ' + label + '. That is normal for a real `.env`' +
                                (ctx.envIgnored === true ? ', and your `.gitignore` correctly ignores `.env`.' : '. Paste your `.gitignore` too so this tool can confirm `.env` is not committed.'),
                            fix: ctx.envIgnored === true ? 'Nothing to do — keep it out of version control and pass it at runtime.' : 'Make sure `.env` is listed in `.gitignore`.'
                        });
                    }
                } else if (isPlaceholder(p.value) && p.value.trim() !== '') {
                    out.push({
                        id: 'env-placeholder-' + p.key, category: 'Security', severity: 'med', status: 'fail', points: 2,
                        title: 'Placeholder value shipped in .env (' + p.key + ')',
                        detail: 'Line ' + p.line + ' still holds a placeholder (`' + p.value + '`). A real `.env` used at runtime with an unset value usually means a broken deploy, not a documented example.',
                        fix: 'Set a real value in `.env`, and move the placeholder to `.env.example` instead.',
                        docsLink: DOCS.envVar
                    });
                }
            });

            // Duplicate keys / malformed lines (per file).
            if (env.dupes.length) {
                out.push({
                    id: 'env-dupes', category: 'Security', severity: 'med', status: 'fail', points: 3,
                    title: 'Duplicate keys in .env',
                    detail: 'These keys appear more than once: ' + env.dupes.join(', ') + '. Most loaders keep the last one, silently overriding the earlier value.',
                    fix: 'Remove the duplicates so each key is defined exactly once.',
                    docsLink: DOCS.envFormat
                });
            }
            if (env.malformed.length) {
                out.push({
                    id: 'env-malformed', category: 'Security', severity: 'med', status: 'fail', points: 3,
                    title: env.malformed.length + ' malformed line' + (env.malformed.length === 1 ? '' : 's') + ' in .env',
                    detail: 'Lines that are not `KEY=value`, a comment, or blank (first at line ' + env.malformed[0].line + ': `' + env.malformed[0].raw.slice(0, 48) + '`) are ignored or throw depending on the loader.',
                    fix: 'Use `KEY=value` per line; quote values containing spaces; prefix comments with `#`.',
                    docsLink: DOCS.envFormat
                });
            }
        }

        // ---- Documentation drift (both directions, distinct findings) ----
        // Only when BOTH files are present.
        if (env.present && ex.present) {
            var envKeys = env.pairs.map(function (p) { return p.key; });
            var exKeys = ex.pairs.map(function (p) { return p.key; });
            var undocumented = envKeys.filter(function (k) { return exKeys.indexOf(k) === -1; });
            var unset = exKeys.filter(function (k) { return envKeys.indexOf(k) === -1; });

            // Undocumented keys are a hygiene issue → advisory only (not scored).
            if (undocumented.length) {
                out.push({
                    id: 'doc-drift-undocumented', category: 'Documentation',
                    severity: 'info', status: 'note', points: 0,
                    title: 'Some .env keys are not documented in .env.example',
                    detail: 'These keys exist in `.env` but are missing from `.env.example`, so a teammate cloning the repo won\'t know to set them: ' + undocumented.join(', ') + '.',
                    fix: 'Add the missing keys to `.env.example` with placeholder values.'
                });
            }
            out.push({
                id: 'doc-drift-unset', category: 'Configuration',
                severity: unset.length ? 'med' : 'ok',
                status: unset.length ? 'fail' : 'pass', points: 5,
                title: 'Every documented variable is set in .env',
                failTitle: 'Documented variables are missing from .env',
                detail: unset.length
                    ? 'These keys are documented in `.env.example` but missing from your `.env` — likely required vars you haven\'t set: ' + unset.join(', ') + '.'
                    : 'Every key in `.env.example` is present in `.env`.',
                fix: 'Set the missing variables in your `.env` before deploying.',
                docsLink: DOCS.envVar
            });
        }

        return out;
    }

    function inspectDependencies(ctx) {
        var out = [];
        if (!ctx.pkg.present || ctx.pkg.error) return out;
        var o = ctx.pkg.obj;
        var deps = o.dependencies || {};
        var devDeps = o.devDependencies || {};

        // Dev-only tools that shouldn't live in production dependencies — a real
        // but non-deploy-breaking hygiene issue, so advisory (info) only.
        ['nodemon', 'ts-node-dev', 'jest', 'vitest', 'eslint', 'typescript', 'webpack', '@types/node'].forEach(function (tool) {
            if (deps[tool] && !devDeps[tool]) {
                out.push({
                    id: 'dep-devinprod-' + tool, category: 'Security', severity: 'info', status: 'note', points: 0,
                    title: '`' + tool + '` is in dependencies, not devDependencies',
                    detail: '`' + tool + '` is a development tool. In `dependencies` it gets installed into production images, bloating them and widening the attack surface.',
                    fix: 'Move it to `devDependencies` (`npm install -D ' + tool + '`) and install prod deps with `npm ci --omit=dev`.',
                    docsLink: DOCS.npmResolve
                });
            }
        });

        // dotenv presence advisory — INFO only. We can't see source usage, so the
        // only signal is "a .env was pasted at all". Many runtimes load .env
        // natively, so this is never a hard fail.
        if (ctx.env.present && !deps.dotenv && !devDeps.dotenv) {
            out.push({
                id: 'dep-dotenv', category: 'Configuration', severity: 'info', status: 'note', points: 0,
                title: 'You pasted a .env but `dotenv` isn\'t a dependency',
                detail: 'If you load environment variables manually, you need a loader. If your runtime loads `.env` natively (Node `--env-file`, Next.js, Vite, Deno), ignore this.',
                fix: 'Add `dotenv` only if you call `require("dotenv").config()` yourself.'
            });
        }

        // npm registry deprecated/duplicate check is deferred (fully-offline V1).
        // TODO(phase-later): optional, opt-in, disclosed npm-registry lookup of
        // package NAMES only. Do not wire any network call here.

        return out;
    }

    // Advisory tiles for categories we don't deeply score in V1.
    function inspectDockerCI(ctx) {
        return [
            {
                id: 'docker-advisory', category: 'Docker', severity: 'info', status: 'note', points: 0,
                title: 'Dockerfile analysis lives in a dedicated tool',
                detail: 'This checker focuses on your app manifest. For image size, layer caching, non-root USER and base-image pinning, use the Docker Image Optimizer.',
                fix: 'Open the Docker Image Optimizer and paste your Dockerfile.',
                docsLink: DOCS.docker
            },
            {
                id: 'ci-advisory', category: 'CI', severity: 'info', status: 'note', points: 0,
                title: 'CI checks are coming in a later pass',
                detail: 'A GitHub Actions inspector (npm ci, tests, lint, caching, build verify) is planned but not part of this version.',
                fix: 'For now, make sure your pipeline runs `npm ci`, your `test` and `lint` scripts, and a build.',
                docsLink: DOCS.pillar
            }
        ];
    }

    // ---------- engine ----------
    function analyze(inputs) {
        inputs = inputs || {};
        var pkg = parsePackageJson(inputs.pkg || '');
        var env = parseEnv(inputs.env || '');
        var envExample = parseEnv(inputs.envExample || '');
        var gitignore = parseGitignore(inputs.gitignore || '');

        if (!pkg.present && !env.present && !envExample.present && !gitignore.present) {
            return { error: 'Paste at least a package.json (a .env / .env.example and .gitignore are optional).' };
        }

        var deps = {};
        if (pkg.present && !pkg.error && pkg.obj) {
            Object.keys(pkg.obj.dependencies || {}).forEach(function (k) { deps[k] = true; });
            Object.keys(pkg.obj.devDependencies || {}).forEach(function (k) { deps[k] = true; });
        }

        var envIgnored = gitignore.present ? gitignoreMatches(gitignore.patterns, '.env') : null;

        var ctx = {
            pkg: pkg, env: env, envExample: envExample, gitignore: gitignore,
            deps: deps, frameworks: [], envIgnored: envIgnored
        };

        // Fixed order so cross-inspector state exists before it is read.
        var findings = []
            .concat(inspectPackageJson(ctx))
            .concat(inspectFrameworks(ctx))
            .concat(inspectGitignore(ctx))
            .concat(inspectEnv(ctx))
            .concat(inspectDependencies(ctx))
            .concat(inspectDockerCI(ctx));

        // ---- scoring ----
        var cat = {};
        CATEGORIES.forEach(function (c) {
            cat[c] = { name: c, budget: 0, deduct: 0, pass: 0, fail: 0, notes: 0, highFail: 0, checked: false };
        });
        findings.forEach(function (f) {
            var c = cat[f.category];
            if (f.status === 'pass' || f.status === 'fail') { c.budget += f.points; c.checked = true; }
            if (f.status === 'fail') { c.deduct += f.points; c.fail++; if (f.severity === 'high') c.highFail++; }
            if (f.status === 'pass') c.pass++;
            if (f.status === 'note') c.notes++;
        });
        CATEGORIES.forEach(function (c) {
            var o = cat[c];
            o.score = Math.max(0, o.budget - o.deduct);
        });
        var totBudget = 0, totScore = 0;
        CATEGORIES.forEach(function (c) {
            var o = cat[c];
            if (o.checked) { totBudget += o.budget; totScore += o.score; }
        });
        // "No scored checks ran" (e.g. only a clean .env pasted) is an advisory
        // state, NOT a failing grade — don't render a red F/0 for a valid file.
        var advisoryOnly = totBudget === 0;
        var score = advisoryOnly ? null : Math.round(totScore / totBudget * 100);
        var grade = advisoryOnly ? '—' : (score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F');

        // sort findings: fails first (by severity), then notes, then passes
        var statusOrder = { fail: 0, note: 1, pass: 2 };
        findings.sort(function (a, b) {
            var s = statusOrder[a.status] - statusOrder[b.status];
            if (s !== 0) return s;
            return SEV[a.severity].order - SEV[b.severity].order;
        });

        var counts = { high: 0, med: 0, info: 0, pass: 0 };
        findings.forEach(function (f) {
            if (f.status === 'pass') counts.pass++;
            else if (f.status === 'fail') counts[f.severity]++;
            else if (f.status === 'note') counts.info++;
        });

        return {
            findings: findings, categories: cat, categoryOrder: CATEGORIES,
            score: score, grade: grade, advisoryOnly: advisoryOnly, counts: counts, frameworks: ctx.frameworks
        };
    }

    // ---------- rendering ----------
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function md(s) {
        return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    function catStatus(o) {
        if (!o.checked) return o.notes ? { icon: 'ℹ️', label: 'Advisory' } : { icon: '➖', label: 'Not checked' };
        if (o.fail === 0) return { icon: '✅', label: 'Good' };
        if (o.highFail > 0) return { icon: '❌', label: 'Needs work' };
        return { icon: '⚠️', label: 'Review' };
    }

    function render(result) {
        var wrap = document.getElementById('drcResultsWrap');
        var summary = document.getElementById('drcSummary');
        var grid = document.getElementById('drcCategoryGrid');
        var list = document.getElementById('drcFindings');
        wrap.style.display = 'block';
        grid.innerHTML = '';
        list.innerHTML = '';

        if (result.error) {
            summary.innerHTML = '<span class="drc-badge drc-badge-high">Nothing to analyze</span> ' + esc(result.error);
            return;
        }

        var c = result.counts;
        var fwNote = result.frameworks.length ? ' &middot; detected: ' + esc(result.frameworks.join(', ')) : '';
        if (result.advisoryOnly) {
            summary.innerHTML =
                '<span class="drc-grade drc-grade-advisory">&mdash;</span>' +
                '<span class="drc-summary-text"><strong>Advisory only — no scored checks ran</strong> for what you pasted. ' +
                'The notes below are suggestions; add a <code>package.json</code> (and a <code>.gitignore</code> / <code>.env</code>) to get a readiness score.' + fwNote + '</span>';
        } else {
            summary.innerHTML =
                '<span class="drc-grade drc-grade-' + result.grade + '">' + result.grade + '</span>' +
                '<span class="drc-summary-text"><strong>' + result.score + '/100 deployment readiness</strong> &mdash; ' +
                c.high + ' high &middot; ' + c.med + ' medium &middot; ' + c.pass + ' passing' + fwNote + '.</span>';
        }

        result.categoryOrder.forEach(function (name) {
            var o = result.categories[name];
            var st = catStatus(o);
            var meta = o.checked ? (o.score + '/' + o.budget + ' pts') : (o.notes ? 'advisory' : 'no input');
            var tile = document.createElement('div');
            tile.className = 'drc-cat-tile' + (o.checked ? '' : ' drc-cat-off');
            tile.innerHTML =
                '<span class="drc-cat-icon">' + st.icon + '</span>' +
                '<span class="drc-cat-name">' + esc(name) + '</span>' +
                '<span class="drc-cat-meta">' + esc(meta) + '</span>';
            grid.appendChild(tile);
        });

        result.findings.forEach(function (f) {
            var li = document.createElement('li');
            li.className = 'drc-finding drc-status-' + f.status + ' drc-sev-' + f.severity;
            var link = f.docsLink ? ' <a class="drc-f-doc" href="' + esc(f.docsLink) + '" target="_blank" rel="noopener">Learn more &rarr;</a>' : '';
            var fixLine = f.status === 'pass' ? '' :
                '<p class="drc-f-fix"><strong>Fix:</strong> ' + md(f.fix) + link + '</p>';
            li.innerHTML =
                '<div class="drc-f-head">' +
                    '<span class="drc-f-icon">' + SEV[f.severity].icon + '</span>' +
                    '<span class="drc-f-title">' + esc(f.status === 'fail' && f.failTitle ? f.failTitle : f.title) + '</span>' +
                    '<span class="drc-f-cat">' + esc(f.category) + '</span>' +
                '</div>' +
                '<p class="drc-f-detail">' + md(f.detail) + '</p>' +
                fixLine;
            list.appendChild(li);
        });
    }

    function buildReport(result) {
        if (result.error) return 'Deployment Readiness Checker\n\n' + result.error + '\n';
        var lines = [
            'Deployment Readiness Checker report (100% in-browser, nothing uploaded)',
            result.advisoryOnly
                ? 'Result: advisory only — no scored checks ran for what you pasted'
                : 'Score: ' + result.score + '/100  (grade ' + result.grade + ')',
            'Findings: ' + result.counts.high + ' high, ' + result.counts.med + ' medium, ' +
                result.counts.info + ' info, ' + result.counts.pass + ' passing',
            ''
        ];
        lines.push('Per category:');
        result.categoryOrder.forEach(function (name) {
            var o = result.categories[name];
            lines.push('  - ' + name + ': ' + (o.checked ? o.score + '/' + o.budget + ' pts' : (o.notes ? 'advisory' : 'not checked')));
        });
        lines.push('');
        result.findings.filter(function (f) { return f.status !== 'pass'; }).forEach(function (f, i) {
            var t = (f.status === 'fail' && f.failTitle) ? f.failTitle : f.title;
            lines.push((i + 1) + '. [' + SEV[f.severity].label.toUpperCase() + '][' + f.category + '] ' + t);
            lines.push('   Why: ' + f.detail.replace(/`/g, ''));
            if (f.status !== 'pass') lines.push('   Fix: ' + f.fix.replace(/`/g, ''));
            if (f.docsLink) lines.push('   Docs: ' + f.docsLink);
            lines.push('');
        });
        lines.push('Generated by jsondevtools.org/deployment-readiness-checker.html');
        return lines.join('\n');
    }

    var SAMPLE = {
        pkg: [
            '{',
            '  "name": "my-api",',
            '  "version": "1.0.0",',
            '  "scripts": {',
            '    "start": "node server.js",',
            '    "dev": "nodemon server.js",',
            '    "test": "echo \\"Error: no test specified\\" && exit 1"',
            '  },',
            '  "dependencies": {',
            '    "express": "^4.19.2",',
            '    "nodemon": "^3.1.0"',
            '  }',
            '}'
        ].join('\n'),
        env: [
            'PORT=3000',
            'DATABASE_URL=postgres://admin:s3cr3tpw@db.example.com:5432/prod',
            'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'JWT_SECRET=changeme'
        ].join('\n'),
        envExample: [
            'PORT=3000',
            'DATABASE_URL=postgres://user:password@localhost:5432/db'
        ].join('\n'),
        gitignore: [
            'node_modules',
            'dist'
        ].join('\n')
    };

    // Node-only export for tests; browsers skip this.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            analyze: analyze, parseEnv: parseEnv, parseGitignore: parseGitignore,
            looksSecret: looksSecret, isPlaceholder: isPlaceholder, buildReport: buildReport,
            SAMPLE: SAMPLE
        };
        return;
    }

    // ---------- wiring ----------
    document.addEventListener('DOMContentLoaded', function () {
        var ids = { pkg: 'pkgInput', env: 'envInput', envExample: 'envExampleInput', gitignore: 'gitignoreInput' };
        var lastResult = null;
        var optional = document.getElementById('drcOptional');
        var optionalSummary = optional ? optional.querySelector('.drc-optional-summary') : null;

        // Keep the summary's aria-expanded in sync with the details' open state
        // (covers native summary clicks and programmatic opens alike).
        function syncOptionalAria() {
            if (optionalSummary && optional) {
                optionalSummary.setAttribute('aria-expanded', optional.open ? 'true' : 'false');
            }
        }
        if (optional) {
            optional.addEventListener('toggle', syncOptionalAria);
            syncOptionalAria();
        }
        function openOptional() {
            if (optional && !optional.open) { optional.open = true; syncOptionalAria(); }
        }

        // Route a file to the right textarea by its name (optional files
        // auto-expand the disclosure so content never lands in a hidden box).
        function targetForFilename(name) {
            name = (name || '').toLowerCase();
            if (name.indexOf('.env.example') !== -1 || name.indexOf('.env.sample') !== -1) return ids.envExample;
            if (name.indexOf('.env') !== -1) return ids.env;
            if (name.indexOf('gitignore') !== -1) return ids.gitignore;
            return ids.pkg;
        }
        function loadIntoTarget(target, content) {
            var el = document.getElementById(target);
            if (!el) return;
            el.value = content;
            if (target !== ids.pkg) openOptional();
            run();
        }

        function collect() {
            return {
                pkg: (document.getElementById(ids.pkg) || {}).value || '',
                env: (document.getElementById(ids.env) || {}).value || '',
                envExample: (document.getElementById(ids.envExample) || {}).value || '',
                gitignore: (document.getElementById(ids.gitignore) || {}).value || ''
            };
        }

        function run() {
            var inputs = collect();
            if (!inputs.pkg.trim() && !inputs.env.trim() && !inputs.envExample.trim() && !inputs.gitignore.trim()) {
                showToast('Paste a package.json first');
                return;
            }
            // Never let an unexpected inspector error silently kill the render —
            // surface a friendly message instead of leaving the panel blank.
            try {
                lastResult = analyze(inputs);
            } catch (e) {
                lastResult = { error: 'Something went wrong analyzing that input. Please check it and try again.' };
                if (typeof console !== 'undefined' && console.error) console.error('DRC analyze error:', e);
            }
            render(lastResult);
            document.getElementById('drcResultsWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        document.getElementById('analyzeBtn').addEventListener('click', run);
        document.getElementById('sampleBtn').addEventListener('click', function () {
            document.getElementById(ids.pkg).value = SAMPLE.pkg;
            document.getElementById(ids.env).value = SAMPLE.env;
            document.getElementById(ids.envExample).value = SAMPLE.envExample;
            document.getElementById(ids.gitignore).value = SAMPLE.gitignore;
            openOptional(); // the sample fills optional fields — don't hide them
            run();
        });
        document.getElementById('copyBtn').addEventListener('click', function () {
            if (!lastResult) { showToast('Analyze first'); return; }
            copyToClipboard(buildReport(lastResult)).then(function () { showToast('Report copied'); });
        });
        document.getElementById('downloadBtn').addEventListener('click', function () {
            if (!lastResult) { showToast('Analyze first'); return; }
            downloadFile(buildReport(lastResult), 'deployment-readiness-report.txt', 'text/plain');
        });
        document.getElementById('clearBtn').addEventListener('click', function () {
            Object.keys(ids).forEach(function (k) {
                var el = document.getElementById(ids[k]);
                if (el) el.value = '';
            });
            lastResult = null;
            document.getElementById('drcResultsWrap').style.display = 'none';
        });

        // The primary (package.json) box is the always-visible drop zone, so it
        // routes a dropped file BY FILENAME — dropping a .env here while the
        // optional section is collapsed still auto-expands and lands correctly.
        var pkgEl = document.getElementById(ids.pkg);
        if (pkgEl) {
            pkgEl.addEventListener('dragover', function (e) { e.preventDefault(); pkgEl.classList.add('drag-over'); });
            pkgEl.addEventListener('dragleave', function (e) { if (!pkgEl.contains(e.relatedTarget)) pkgEl.classList.remove('drag-over'); });
            pkgEl.addEventListener('drop', function (e) {
                e.preventDefault();
                pkgEl.classList.remove('drag-over');
                var f = e.dataTransfer.files[0];
                if (!f) return;
                getFileFromUpload(f).then(function (content) { loadIntoTarget(targetForFilename(f.name), content); });
            });
        }
        // Optional boxes keep the simple utils.js drag-drop (they only receive a
        // drop when expanded, and a drop onto a specific box is unambiguous).
        if (typeof initDragDrop === 'function') {
            initDragDrop(ids.env, function (c) { loadIntoTarget(ids.env, c); });
            initDragDrop(ids.envExample, function (c) { loadIntoTarget(ids.envExample, c); });
            initDragDrop(ids.gitignore, function (c) { loadIntoTarget(ids.gitignore, c); });
        }
        var fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var f = fileInput.files[0];
                if (!f) return;
                getFileFromUpload(f).then(function (content) { loadIntoTarget(targetForFilename(f.name), content); });
                fileInput.value = '';
            });
        }

        // If anything prefilled an optional field before load, start expanded.
        if (optional && !optional.open &&
            (document.getElementById(ids.env).value.trim() ||
             document.getElementById(ids.envExample).value.trim() ||
             document.getElementById(ids.gitignore).value.trim())) {
            openOptional();
        }
    });
})();
