#!/usr/bin/env node
// Guard against oversized <title> and <meta name="description"> tags.
//
// Descriptions: Google truncates past ~155-160 chars.
// Titles:       Google truncates past ~60 chars; past 70 the tail is always lost.
//
// Exit code 1 on any hard failure (description > 160, title > 70).
// Titles in the 61-70 band are reported as warnings only — the site deliberately
// carries exact error strings in some titles, which cannot always be cut to 60.
//
// Usage: node scripts/check-meta-description.js [dir ...]
//        defaults to the four published page groups: . errors/ blog/ http-status/
//        "." means the root *.html files only, not a recursive walk.

const fs = require('fs');
const path = require('path');

const DESC_MAX = 160;
const DESC_MIN = 120;   // warn only: shorter than this wastes SERP real estate
const TITLE_MAX = 70;   // hard fail
const TITLE_WARN = 60;  // warn only

const DEFAULT_TARGETS = ['.', 'errors', 'blog', 'http-status'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'scripts', 'img', 'css', 'js', 'data']);

const targets = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS;

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            out.push(...walk(path.join(dir, entry.name)));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            out.push(path.join(dir, entry.name));
        }
    }
    return out;
}

// Root is listed flat: a recursive walk from "." would re-collect every subdir.
function collect(target) {
    if (!fs.existsSync(target)) return [];
    if (target === '.' || target === './') {
        return fs.readdirSync('.', { withFileTypes: true })
            .filter(e => e.isFile() && e.name.endsWith('.html'))
            .map(e => e.name);
    }
    return walk(target);
}

// Count what a human sees, not what the byte stream says: an entity is one glyph.
const ENTITIES = {
    '&mdash;': '—', '&ndash;': '–', '&amp;': '&', '&quot;': '"', '&apos;': "'",
    '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&middot;': '·',
    '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”',
    '&hellip;': '…', '&rarr;': '→', '&larr;': '←', '&harr;': '↔', '&times;': '×',
    '&rsaquo;': '›', '&lsaquo;': '‹', '&deg;': '°', '&copy;': '©',
};
function decode(s) {
    return s.replace(/&[a-zA-Z]+;|&#\d+;/g, m => ENTITIES[m] !== undefined ? ENTITIES[m] : m);
}

const descRe = /<meta\s+name="description"\s+content="([^"]*)"/i;
const titleRe = /<title>([\s\S]*?)<\/title>/i;

const fails = [];
const warns = [];
let checked = 0;
let missing = 0;

// A page can be listed by more than one target (e.g. "." plus an explicit path).
const seen = new Set();

for (const target of targets) {
    for (const file of collect(target)) {
        const key = path.resolve(file);
        if (seen.has(key)) continue;
        seen.add(key);

        const html = fs.readFileSync(file, 'utf8');

        // Meta-refresh stubs carry no SERP copy of their own by design.
        if (/<meta\s+http-equiv="refresh"/i.test(html)) continue;

        checked++;

        const dm = html.match(descRe);
        const tm = html.match(titleRe);

        if (!dm) {
            missing++;
            fails.push({ file, what: 'description', len: 0, text: '(no <meta name="description">)' });
        } else {
            const desc = decode(dm[1]).trim();
            if (desc.length > DESC_MAX) {
                fails.push({ file, what: 'description', len: desc.length, text: desc });
            } else if (desc.length < DESC_MIN) {
                warns.push({ file, what: 'description', len: desc.length, text: desc });
            }
        }

        if (!tm) {
            missing++;
            fails.push({ file, what: 'title', len: 0, text: '(no <title>)' });
        } else {
            const title = decode(tm[1]).trim();
            if (title.length > TITLE_MAX) {
                fails.push({ file, what: 'title', len: title.length, text: title });
            } else if (title.length > TITLE_WARN) {
                warns.push({ file, what: 'title', len: title.length, text: title });
            }
        }
    }
}

function report(rows, label) {
    if (!rows.length) return;
    console.log(`\n${label}`);
    for (const r of rows.sort((a, b) => b.len - a.len)) {
        console.log(`${String(r.len).padStart(3)}  ${r.what.padEnd(11)}  ${r.file}`);
        console.log(`     ${r.text.slice(0, 120)}${r.text.length > 120 ? '…' : ''}`);
    }
}

report(fails, `FAIL — description > ${DESC_MAX} or title > ${TITLE_MAX} chars:`);
report(warns, `warn — description < ${DESC_MIN} or title ${TITLE_WARN + 1}-${TITLE_MAX} chars (not blocking):`);

console.log(`\nChecked ${checked} pages across: ${targets.join(' ')}`);
console.log(`${fails.length} failures, ${warns.length} warnings.`);
if (missing) console.log(`${missing} of those failures are missing tags, not over-length ones.`);

process.exit(fails.length > 0 ? 1 : 0);
