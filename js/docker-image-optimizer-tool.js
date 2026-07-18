// ============================================
// DOCKER IMAGE OPTIMIZER — static Dockerfile advisor
// 100% client-side. Parses a pasted Dockerfile and reports
// size/cache/security findings with line-anchored fixes.
// It never builds or runs anything — it only reads text.
// ============================================
(function () {
    'use strict';

    // ---------- Dockerfile parser ----------
    // Returns [{ line, cmd, args, raw, stage }] with `\` continuations folded,
    // comments stripped, and multi-stage boundaries tracked.
    function parseDockerfile(text) {
        var instructions = [];
        var lines = text.split('\n');
        var buf = '';
        var startLine = 0;
        var stage = 0;
        var stageNames = [];

        function flush() {
            var raw = buf.trim();
            buf = '';
            if (!raw) return;
            var m = raw.match(/^([A-Za-z]+)\s+([\s\S]*)$/) || raw.match(/^([A-Za-z]+)$/);
            if (!m) return;
            var cmd = m[1].toUpperCase();
            var args = (m[2] || '').trim();
            if (cmd === 'FROM') {
                stage = instructions.filter(function (i) { return i.cmd === 'FROM'; }).length;
                var asMatch = args.match(/\s+AS\s+(\S+)\s*$/i);
                if (asMatch) stageNames.push(asMatch[1].toLowerCase());
            }
            instructions.push({ line: startLine + 1, cmd: cmd, args: args, raw: raw, stage: stage });
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();
            if (!buf) {
                if (trimmed === '' || trimmed.charAt(0) === '#') continue;
                startLine = i;
            } else if (trimmed.charAt(0) === '#') {
                continue; // comment inside a continuation
            }
            if (/\\\s*$/.test(line)) {
                buf += line.replace(/\\\s*$/, ' ');
            } else {
                buf += line;
                flush();
            }
        }
        flush();

        return { instructions: instructions, stageNames: stageNames, stageCount: stage + 1 };
    }

    // ---------- helpers ----------
    function lastStage(parsed) {
        var last = parsed.stageCount - 1;
        return parsed.instructions.filter(function (i) { return i.stage === last; });
    }
    function isStageRef(parsed, imageRef) {
        return parsed.stageNames.indexOf(imageRef.toLowerCase()) !== -1;
    }
    function excerpt(raw) {
        return raw.length > 96 ? raw.slice(0, 93) + '…' : raw;
    }

    // Parse a FROM instruction's image reference into parts.
    // Handles --platform flags, registry[:port]/ prefixes (the tag colon lives
    // in the LAST path component only), and @digest pins.
    function baseImageRef(ins) {
        var ref = ins.args.replace(/^--platform=\S+\s+/i, '').split(/\s+/)[0];
        var name = ref, tag = '', digest = '';
        var di = name.indexOf('@');
        if (di !== -1) { digest = name.slice(di + 1); name = name.slice(0, di); }
        var ci = name.indexOf(':', name.lastIndexOf('/') + 1);
        if (ci !== -1) { tag = name.slice(ci + 1); name = name.slice(0, ci); }
        return { ref: ref, name: name, short: name.split('/').pop(), tag: tag, digest: digest };
    }

    // Known fat base images → slimmer suggestions (approx published sizes, amd64)
    var FAT_BASES = {
        'node':     { slim: 'node:<version>-slim (~70 MB) or node:<version>-alpine (~55 MB)', full: '~430 MB' },
        'python':   { slim: 'python:<version>-slim (~50 MB) or python:<version>-alpine (~25 MB)', full: '~350 MB' },
        'openjdk':  { slim: 'eclipse-temurin:<version>-jre (JRE-only, much smaller than the full JDK image)', full: '~230 MB+' },
        'ruby':     { slim: 'ruby:<version>-slim (~80 MB) or ruby:<version>-alpine (~35 MB)', full: '~330 MB' },
        'php':      { slim: 'php:<version>-fpm-alpine (~30 MB)', full: '~150 MB+' },
        'golang':   { slim: 'a multi-stage build: compile in golang:<version>, run in alpine/scratch/distroless', full: '~350 MB' },
        'rust':     { slim: 'a multi-stage build: compile in rust:<version>, run in debian-slim/distroless', full: '~600 MB' },
        'ubuntu':   { slim: 'ubuntu is fine as a base, but consider debian:<version>-slim or alpine if you only need a shell + packages', full: '~78 MB' },
        'maven':    { slim: 'a multi-stage build: build in maven:<version>, run in eclipse-temurin:<version>-jre', full: '~500 MB' },
        'gradle':   { slim: 'a multi-stage build: build in gradle:<version>, run in eclipse-temurin:<version>-jre', full: '~600 MB' }
    };

    var BUILD_INDICATORS = /\b(npm run build|yarn build|pnpm build|go build|cargo build|mvn package|mvn install|gradle (build|assemble)|dotnet publish|tsc\b|webpack|vite build|next build)\b/;
    var DEP_INSTALL = /\b(npm (ci|install|i)\b|yarn( install)?\b|pnpm (install|i)\b|pip3? install|composer install|bundle install|go mod download|cargo fetch|dotnet restore|mvn dependency|poetry install)\b/;

    // ---------- rules ----------
    // Each rule: { id, sev: 'high'|'med'|'info', title, run(parsed) -> [{line, raw, detail, fix}] }
    var RULES = [

        {
            id: 'latest-tag', sev: 'high', title: 'Unpinned base image (:latest or no tag)',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'FROM') return;
                    var img = baseImageRef(ins);
                    if (isStageRef(p, img.name) || img.name === 'scratch' || img.digest) return;
                    var isLatest = img.tag === 'latest';
                    if (!img.tag || isLatest) {
                        out.push({
                            line: ins.line, raw: ins.raw,
                            detail: (isLatest ? '`:latest`' : 'No tag') + ' means every build can silently pull a different image — builds stop being reproducible, caches bust unpredictably, and a breaking upstream change lands in your image unannounced.',
                            fix: 'Pin a specific version tag, e.g. `FROM ' + img.name + ':<version>` (and consider a digest pin for full reproducibility).'
                        });
                    }
                });
                return out;
            }
        },

        {
            id: 'fat-base', sev: 'high', title: 'Bloated base image — a slim variant exists',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'FROM') return;
                    var img = baseImageRef(ins);
                    if (isStageRef(p, img.name)) return;
                    var info = FAT_BASES[img.short];
                    if (!info) return;
                    if (/slim|alpine|distroless|jre|scratch/.test(img.tag)) return;
                    // In a multi-stage file, a fat image in a NON-final stage is fine — that's the point.
                    if (p.stageCount > 1 && ins.stage !== p.stageCount - 1) return;
                    out.push({
                        line: ins.line, raw: ins.raw,
                        detail: 'The full `' + img.short + '` image (' + info.full + ') ships compilers, docs and dev libraries your running container almost never needs — all of it becomes image size you pull, push and store on every deploy.',
                        fix: 'Use ' + info.slim + '.'
                    });
                });
                return out;
            }
        },

        {
            id: 'no-multistage', sev: 'med', title: 'Build step without a multi-stage build',
            run: function (p) {
                if (p.stageCount > 1) return [];
                var builds = p.instructions.filter(function (ins) {
                    return ins.cmd === 'RUN' && BUILD_INDICATORS.test(ins.args);
                });
                return builds.slice(0, 1).map(function (ins) {
                    return {
                        line: ins.line, raw: ins.raw,
                        detail: 'This Dockerfile compiles/builds in the same single stage it ships, so the final image carries the whole toolchain, dev dependencies and intermediate artifacts alongside the built output.',
                        fix: 'Split into stages: `FROM node:20 AS build` (install + build) then `FROM node:20-slim` + `COPY --from=build /app/dist ./dist`. Only the runtime stage ships.'
                    };
                });
            }
        },

        {
            id: 'apt-cleanup', sev: 'high', title: 'apt install without cache cleanup in the same layer',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/\bapt(-get)?\s+(-\S+\s+)*install\b/.test(ins.args)) return;
                    if (/rm\s+-rf\s+\/var\/lib\/apt\/lists/.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: 'The apt package cache (`/var/lib/apt/lists/`, tens of MB) is baked into this layer. Deleting it in a LATER instruction does not shrink the image — layers are additive; only cleanup inside the same RUN counts.',
                        fix: 'Append `&& rm -rf /var/lib/apt/lists/*` to this same RUN: `RUN apt-get update && apt-get install -y --no-install-recommends <pkgs> && rm -rf /var/lib/apt/lists/*`.'
                    });
                });
                return out;
            }
        },

        {
            id: 'apt-recommends', sev: 'med', title: 'apt install without --no-install-recommends',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/\bapt(-get)?\s+(-\S+\s+)*install\b/.test(ins.args)) return;
                    if (/--no-install-recommends/.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: 'By default apt also installs every "recommended" package — often doubling what lands in the image with things the container never uses.',
                        fix: 'Add `--no-install-recommends` to the install: `apt-get install -y --no-install-recommends <pkgs>`.'
                    });
                });
                return out;
            }
        },

        {
            id: 'apk-cache', sev: 'med', title: 'apk add without --no-cache',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/\bapk\s+add\b/.test(ins.args)) return;
                    if (/--no-cache/.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: 'Without `--no-cache`, apk leaves its package index in `/var/cache/apk/` inside the layer.',
                        fix: 'Use `apk add --no-cache <pkgs>` (replaces the older `apk update && … && rm -rf /var/cache/apk/*` dance).'
                    });
                });
                return out;
            }
        },

        {
            id: 'copy-order', sev: 'high', title: 'COPY . . before dependency install — kills layer caching',
            run: function (p) {
                var out = [];
                var byStage = {};
                p.instructions.forEach(function (ins) {
                    (byStage[ins.stage] = byStage[ins.stage] || []).push(ins);
                });
                Object.keys(byStage).forEach(function (s) {
                    var seq = byStage[s];
                    var copyAllAt = -1, copyAllIns = null;
                    for (var i = 0; i < seq.length; i++) {
                        var ins = seq[i];
                        if ((ins.cmd === 'COPY' || ins.cmd === 'ADD') && /^(\.|\.\/|\*)\s+/.test(ins.args + ' ') && !/--from=/.test(ins.args)) {
                            copyAllAt = i; copyAllIns = ins;
                        }
                        if (ins.cmd === 'RUN' && DEP_INSTALL.test(ins.args)) {
                            if (copyAllAt !== -1 && copyAllAt < i) {
                                out.push({
                                    line: copyAllIns.line, raw: copyAllIns.raw,
                                    detail: 'Copying the whole source tree before installing dependencies means ANY file change — a README edit, one line of app code — invalidates the copy layer and every layer after it, so dependencies reinstall from scratch on every build.',
                                    fix: 'Copy only the manifest first, install, then copy the rest: `COPY package*.json ./` → `RUN npm ci` → `COPY . .` (same pattern for requirements.txt / go.mod / Cargo.toml).'
                                });
                            }
                            break; // one report per stage
                        }
                    }
                });
                return out;
            }
        },

        {
            id: 'add-vs-copy', sev: 'info', title: 'ADD used where COPY is enough',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'ADD') return;
                    if (/^https?:\/\//.test(ins.args) || /\.(tar|tar\.gz|tgz|tar\.bz2|tar\.xz)\s/.test(ins.args + ' ')) return;
                    out.push({
                        line: ins.line, raw: ins.raw,
                        detail: '`ADD` has magic behaviors (URL download, automatic tar extraction) that surprise readers and can change behavior when a filename changes. For plain files, `COPY` says exactly what happens.',
                        fix: 'Replace `ADD` with `COPY` — reserve ADD for the rare intentional tar-extraction case.'
                    });
                });
                return out;
            }
        },

        {
            id: 'npm-ci', sev: 'med', title: 'npm install instead of npm ci (and dev deps in the image)',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN') return;
                    var isInstall = /\bnpm\s+(install|i)\b/.test(ins.args) && !/\bnpm\s+(install|i)\s+-g/.test(ins.args);
                    if (!isInstall) return;
                    var prod = /--omit=dev|--production/.test(ins.args);
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: '`npm install` can rewrite the lockfile and resolves versions non-deterministically; ' + (prod ? '' : 'without `--omit=dev` it also installs every devDependency (test runners, linters, TypeScript) into the image. '),
                        fix: 'Use `npm ci' + (prod ? '' : ' --omit=dev') + '` — installs exactly the lockfile, faster and reproducible' + (prod ? '' : ', without dev dependencies') + '. (Build in a separate stage if the build itself needs dev deps.)'
                    });
                });
                return out;
            }
        },

        {
            id: 'pip-cache', sev: 'med', title: 'pip install without --no-cache-dir',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/\bpip3?\s+install\b/.test(ins.args)) return;
                    if (/--no-cache-dir/.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: 'pip keeps downloaded wheels in its cache directory inside the layer — pure dead weight in an image that will never reinstall.',
                        fix: 'Use `pip install --no-cache-dir -r requirements.txt`.'
                    });
                });
                return out;
            }
        },

        {
            id: 'apt-upgrade', sev: 'med', title: 'apt upgrade inside the image',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/\bapt(-get)?\s+(-\S+\s+)*(dist-|full-)?upgrade\b/.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: 'Upgrading all packages in a Dockerfile makes builds non-reproducible and bloats layers with package churn. Base images ship patched — the right response to CVEs is a newer base tag.',
                        fix: 'Remove the upgrade and bump the `FROM` tag instead to pick up security patches.'
                    });
                });
                return out;
            }
        },

        {
            id: 'secret-env', sev: 'high', title: 'Secret-looking value baked into ENV/ARG',
            run: function (p) {
                var out = [];
                var secretKey = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|client[_-]?secret)/i;
                var detail = 'Values in ENV/ARG are stored in the image metadata and layers — anyone who can pull the image can read them with `docker history`. ARG values used at build time persist in intermediate layers too.';
                var fix = 'Pass secrets at runtime (`docker run -e`, compose `environment:`, or an orchestrator secret) or use BuildKit `--mount=type=secret` during builds. Scrub any log you share with the Log Redactor.';
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'ENV' && ins.cmd !== 'ARG') return;
                    // Modern form: KEY=value [KEY2=value2 ...] — scan EVERY pair,
                    // one finding per leaked key so line-anchoring stays useful.
                    var pairRe = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/g;
                    var m, sawPair = false;
                    while ((m = pairRe.exec(ins.args)) !== null) {
                        sawPair = true;
                        if (secretKey.test(m[1])) {
                            out.push({ line: ins.line, raw: m[1] + '=…', detail: detail, fix: fix });
                        }
                    }
                    // Legacy space form: ENV KEY value (single pair, ENV only).
                    if (!sawPair && ins.cmd === 'ENV') {
                        var legacy = ins.args.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+\S/);
                        if (legacy && secretKey.test(legacy[1])) {
                            out.push({ line: ins.line, raw: legacy[1] + ' …', detail: detail, fix: fix });
                        }
                    }
                });
                return out;
            }
        },

        {
            id: 'root-user', sev: 'med', title: 'Final stage runs as root (no USER)',
            run: function (p) {
                var seq = lastStage(p);
                var hasUser = seq.some(function (ins) { return ins.cmd === 'USER' && ins.args !== 'root' && ins.args !== '0'; });
                if (hasUser || seq.length === 0) return [];
                var from = seq[0];
                return [{
                    line: from.line, raw: from.raw,
                    detail: 'Without a USER instruction the container runs as root. A container escape or app compromise then has root inside the container — and on misconfigured hosts, effectively on the host.',
                    fix: 'Create and switch to an unprivileged user in the final stage: `RUN useradd -r appuser` … `USER appuser` (node images ship a ready-made `node` user).'
                }];
            }
        },

        {
            id: 'workdir-cd', sev: 'info', title: 'cd in RUN instead of WORKDIR',
            run: function (p) {
                var out = [];
                p.instructions.forEach(function (ins) {
                    if (ins.cmd !== 'RUN' || !/(^|&&|;)\s*cd\s+\//.test(ins.args)) return;
                    out.push({
                        line: ins.line, raw: excerpt(ins.raw),
                        detail: '`cd` only lasts for that single RUN — the next instruction starts back at the old directory, which is a classic source of "file not found" surprises.',
                        fix: 'Use `WORKDIR /app` once; it persists for every following instruction (and creates the directory).'
                    });
                });
                return out;
            }
        },

        {
            id: 'many-runs', sev: 'info', title: 'Many separate RUN layers',
            run: function (p) {
                var seq = lastStage(p).filter(function (ins) { return ins.cmd === 'RUN'; });
                if (seq.length <= 5) return [];
                return [{
                    line: seq[5].line, raw: seq.length + ' RUN instructions in the final stage',
                    detail: 'Each RUN is a layer. Related commands (update + install + cleanup) split across layers prevent same-layer cleanup from working and add metadata overhead.',
                    fix: 'Combine related commands with `&&` (keep UNrelated steps separate so caching still works for them).'
                }];
            }
        },

        {
            id: 'dockerignore', sev: 'info', title: 'COPY . . — make sure a .dockerignore exists',
            run: function (p) {
                var hit = null;
                p.instructions.forEach(function (ins) {
                    if (!hit && (ins.cmd === 'COPY' || ins.cmd === 'ADD') && /^(\.|\.\/)\s/.test(ins.args + ' ') && !/--from=/.test(ins.args)) hit = ins;
                });
                if (!hit) return [];
                return [{
                    line: hit.line, raw: hit.raw,
                    detail: 'A Dockerfile alone can\'t show whether a `.dockerignore` exists — but without one, `COPY . .` drags `node_modules/`, `.git/`, build output and local `.env` files into the build context and often into the image itself (a size AND secrets problem).',
                    fix: 'Add a `.dockerignore` next to the Dockerfile with at least: `node_modules`, `.git`, `dist`, `*.log`, `.env*`, `Dockerfile`.'
                }];
            }
        }
    ];

    var SEV_META = {
        high: { label: 'High', order: 0 },
        med:  { label: 'Medium', order: 1 },
        info: { label: 'Info', order: 2 }
    };

    function analyze(text) {
        var parsed = parseDockerfile(text);
        if (!parsed.instructions.some(function (i) { return i.cmd === 'FROM'; })) {
            return { error: 'No FROM instruction found — this doesn\'t look like a Dockerfile. Paste the full Dockerfile including its FROM line.' };
        }
        var findings = [];
        RULES.forEach(function (rule) {
            rule.run(parsed).forEach(function (f) {
                findings.push({ rule: rule, line: f.line, raw: f.raw, detail: f.detail, fix: f.fix });
            });
        });
        findings.sort(function (a, b) {
            var d = SEV_META[a.rule.sev].order - SEV_META[b.rule.sev].order;
            return d !== 0 ? d : a.line - b.line;
        });
        var counts = { high: 0, med: 0, info: 0 };
        findings.forEach(function (f) { counts[f.rule.sev]++; });
        var score = Math.max(0, 100 - counts.high * 12 - counts.med * 6 - counts.info * 2);
        var grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';
        return { parsed: parsed, findings: findings, counts: counts, score: score, grade: grade };
    }

    // ---------- rendering ----------
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    // Render `code` spans from backticks, everything else escaped.
    function md(s) {
        return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
    }

    function render(result) {
        var wrap = document.getElementById('doResultsWrap');
        var summary = document.getElementById('doSummary');
        var list = document.getElementById('doFindings');
        wrap.style.display = '';
        list.innerHTML = '';

        if (result.error) {
            summary.innerHTML = '<span class="do-badge do-badge-high">Not analyzable</span> ' + esc(result.error);
            return;
        }

        var c = result.counts;
        var stageNote = result.parsed.stageCount > 1 ? result.parsed.stageCount + ' stages' : 'single stage';
        summary.innerHTML =
            '<span class="do-grade do-grade-' + result.grade + '">' + result.grade + '</span>' +
            '<span><strong>' + result.score + '/100</strong> &mdash; ' +
            result.findings.length + ' finding' + (result.findings.length === 1 ? '' : 's') +
            ' (' + c.high + ' high &middot; ' + c.med + ' medium &middot; ' + c.info + ' info) &mdash; ' +
            result.parsed.instructions.length + ' instructions, ' + stageNote + '.</span>' +
            (result.findings.length === 0 ? ' Nothing to flag — this Dockerfile already follows the size and caching practices this advisor checks for. 🎉' : '');

        result.findings.forEach(function (f) {
            var li = document.createElement('li');
            li.className = 'do-finding do-sev-' + f.rule.sev;
            li.innerHTML =
                '<div class="do-f-head">' +
                    '<span class="do-badge do-badge-' + f.rule.sev + '">' + SEV_META[f.rule.sev].label + '</span>' +
                    '<span class="do-f-title">' + esc(f.rule.title) + '</span>' +
                    '<span class="do-f-line">line ' + f.line + '</span>' +
                '</div>' +
                '<code class="do-f-raw">' + esc(f.raw) + '</code>' +
                '<p class="do-f-detail">' + md(f.detail) + '</p>' +
                '<p class="do-f-fix"><strong>Fix:</strong> ' + md(f.fix) + '</p>';
            list.appendChild(li);
        });
    }

    function buildReport(result) {
        if (result.error) return 'Docker Image Optimizer report\n\n' + result.error + '\n';
        var lines = [
            'Docker Image Optimizer report (static advisor — nothing was built or run)',
            'Grade: ' + result.grade + ' (' + result.score + '/100)',
            'Findings: ' + result.findings.length + ' (' + result.counts.high + ' high, ' + result.counts.med + ' medium, ' + result.counts.info + ' info)',
            ''
        ];
        result.findings.forEach(function (f, i) {
            lines.push((i + 1) + '. [' + SEV_META[f.rule.sev].label.toUpperCase() + '] ' + f.rule.title + ' (line ' + f.line + ')');
            lines.push('   > ' + f.raw);
            lines.push('   Why: ' + f.detail.replace(/`/g, ''));
            lines.push('   Fix: ' + f.fix.replace(/`/g, ''));
            lines.push('');
        });
        lines.push('Generated by jsondevtools.org/docker-image-optimizer.html — 100% in-browser.');
        return lines.join('\n');
    }

    var SAMPLE = [
        'FROM node:latest',
        'WORKDIR /app',
        'COPY . .',
        'RUN apt-get update && apt-get install -y python3 build-essential',
        'RUN npm install',
        'ENV API_KEY=sk-live-abc123',
        'RUN npm run build',
        'EXPOSE 3000',
        'CMD ["node", "dist/server.js"]'
    ].join('\n');

    // Node-only export for tests; browsers skip this.
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { parseDockerfile: parseDockerfile, analyze: analyze };
        return;
    }

    // ---------- wiring ----------
    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('dockerfileInput');
        var lastResult = null;

        function run() {
            var text = input.value;
            if (!text.trim()) { showToast('Paste a Dockerfile first'); return; }
            lastResult = analyze(text);
            render(lastResult);
        }

        document.getElementById('analyzeBtn').addEventListener('click', run);
        document.getElementById('sampleBtn').addEventListener('click', function () {
            input.value = SAMPLE;
            run();
        });
        document.getElementById('copyBtn').addEventListener('click', function () {
            if (!lastResult) { showToast('Analyze a Dockerfile first'); return; }
            copyToClipboard(buildReport(lastResult)).then(function () { showToast('Report copied'); });
        });
        document.getElementById('downloadBtn').addEventListener('click', function () {
            if (!lastResult) { showToast('Analyze a Dockerfile first'); return; }
            downloadFile(buildReport(lastResult), 'dockerfile-report.txt', 'text/plain');
        });
        document.getElementById('clearBtn').addEventListener('click', function () {
            input.value = '';
            lastResult = null;
            document.getElementById('doResultsWrap').style.display = 'none';
        });

        var fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', function () {
            var f = fileInput.files[0];
            if (!f) return;
            getFileFromUpload(f).then(function (content) { input.value = content; run(); });
            fileInput.value = '';
        });
        initDragDrop('dockerfileInput', function (content) { input.value = content; run(); });
    });
})();
