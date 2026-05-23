const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak
} = require('docx');
const fs = require('fs');

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:    '1B2A4A',
  blue:    '2563EB',
  lblue:   '93C5FD',
  green:   '16A34A',
  amber:   'D97706',
  red:     'DC2626',
  orange:  'EA580C',
  bglight: 'EFF6FF',
  bggreen: 'F0FDF4',
  rowalt:  'F8F9FA',
  border:  'E2E8F0',
  dark:    '1E293B',
  gray:    '94A3B8',
  white:   'FFFFFF',
};

function scoreColor(n) {
  if (n >= 8) return C.green;
  if (n >= 5) return C.amber;
  return C.red;
}
function scoreLabel(n) {
  if (n >= 8) return 'Strong';
  if (n >= 5) return 'On Track';
  return 'Needs Work';
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hRun(text, size, color, bold, italic) {
  return new TextRun({ text, size: size * 2, color: color || C.dark, bold: !!bold, italics: !!italic, font: 'Arial' });
}
function para(runs, align, spaceBefore, spaceAfter, shading) {
  const opts = {
    children: Array.isArray(runs) ? runs : [runs],
    alignment: align || AlignmentType.LEFT,
    spacing: { before: spaceBefore || 0, after: spaceAfter || 120 },
  };
  if (shading) opts.shading = { type: ShadingType.SOLID, color: shading, fill: shading };
  return new Paragraph(opts);
}
function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 48, color: C.navy, font: 'Arial' })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy } },
  });
}
function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: C.blue, font: 'Arial' })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}
function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: C.dark, font: 'Arial' })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
  });
}
function bodyPara(text, bold) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, bold: !!bold, font: 'Arial', color: C.dark })],
    spacing: { before: 0, after: 100 },
  });
}
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Arial', color: C.dark })],
    bullet: { level: 0 },
    spacing: { before: 0, after: 80 },
  });
}
function cell(text, opts = {}) {
  const { bg, color, bold, size, align, italic, width } = opts;
  const run = new TextRun({
    text: String(text), bold: !!bold, size: (size || 11) * 2,
    color: color || C.dark, italics: !!italic, font: 'Arial',
  });
  const cellOpts = {
    children: [new Paragraph({
      children: [run],
      alignment: align || AlignmentType.LEFT,
      spacing: { before: 60, after: 60 },
    })],
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  };
  if (bg) cellOpts.shading = { type: ShadingType.SOLID, color: bg, fill: bg };
  if (width) cellOpts.width = { size: width, type: WidthType.DXA };
  return new TableCell(cellOpts);
}

function noBorder() {
  const n = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: n, bottom: n, left: n, right: n };
}
function thinBorder() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: C.border };
  return { top: b, bottom: b, left: b, right: b };
}

// ── Status cell helper ─────────────────────────────────────────────────────
function statusCell(text) {
  let bg = C.green, label = text;
  if (text === 'Needs Attention') bg = C.amber;
  if (text === 'Missing' || text === 'Critical') bg = C.red;
  if (text === 'Good') bg = C.green;
  return cell(label, { bg, color: C.white, bold: true, size: 10, align: AlignmentType.CENTER });
}

// ── Simple 2-or-3 col findings table ──────────────────────────────────────
function findingsTable(rows) {
  const headers = new TableRow({
    children: [
      cell('Signal', { bg: C.navy, color: C.white, bold: true, size: 10, width: 2400 }),
      cell('Finding', { bg: C.navy, color: C.white, bold: true, size: 10, width: 5200 }),
      cell('Status', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1600, align: AlignmentType.CENTER }),
    ],
    tableHeader: true,
  });
  const dataRows = rows.map((r, i) => new TableRow({
    children: [
      cell(r[0], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 10, width: 2400 }),
      cell(r[1], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 10, width: 5200 }),
      statusCell(r[2]),
    ],
  }));
  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    rows: [headers, ...dataRows],
    borders: { ...thinBorder() },
  });
}

// ── Cover page ─────────────────────────────────────────────────────────────
function coverPage() {
  const spacer = (lines) => new Paragraph({
    children: [new TextRun({ text: ' ', size: 22 })],
    spacing: { before: 0, after: lines },
    shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
  });

  const scoreRow1 = new TableRow({ children: [
    cell('SEO', { bg: scoreColor(6), color: C.white, bold: true, size: 10, align: AlignmentType.CENTER }),
    cell('GEO', { bg: scoreColor(5), color: C.white, bold: true, size: 10, align: AlignmentType.CENTER }),
    cell('AEO', { bg: scoreColor(5), color: C.white, bold: true, size: 10, align: AlignmentType.CENTER }),
  ]});
  const scoreRow2 = new TableRow({ children: [
    cell('6', { bg: scoreColor(6), color: C.white, bold: true, size: 32, align: AlignmentType.CENTER }),
    cell('5', { bg: scoreColor(5), color: C.white, bold: true, size: 32, align: AlignmentType.CENTER }),
    cell('5', { bg: scoreColor(5), color: C.white, bold: true, size: 32, align: AlignmentType.CENTER }),
  ]});
  const scoreRow3 = new TableRow({ children: [
    cell('On Track', { bg: scoreColor(6), color: C.white, italic: true, size: 9, align: AlignmentType.CENTER }),
    cell('Needs Work', { bg: scoreColor(5), color: C.white, italic: true, size: 9, align: AlignmentType.CENTER }),
    cell('Needs Work', { bg: scoreColor(5), color: C.white, italic: true, size: 9, align: AlignmentType.CENTER }),
  ]});

  const scoreTable = new Table({
    width: { size: 6000, type: WidthType.DXA },
    rows: [scoreRow1, scoreRow2, scoreRow3],
    borders: { ...noBorder() },
  });

  return [
    spacer(1800),
    new Paragraph({
      children: [hRun('jsondevtools.org', 36, C.white, true)],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
      spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [hRun('SEO / GEO / AEO Audit Report', 18, C.lblue)],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
      spacing: { before: 0, after: 100 },
    }),
    new Paragraph({
      children: [hRun('FULL AUDIT', 11, C.white)],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
      spacing: { before: 0, after: 400 },
    }),
    new Table({
      width: { size: 6000, type: WidthType.DXA },
      rows: [scoreRow1, scoreRow2, scoreRow3],
      borders: { ...noBorder() },
      float: { horizontalAnchor: 'margin', absoluteHorizontalPosition: 1680, absoluteVerticalPosition: 0 },
    }),
    spacer(600),
    spacer(1800),
    new Paragraph({
      children: [hRun('2026-05-21', 9, C.gray)],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [hRun('Powered by Claude Code — JSON Dev Tools Internal Audit', 9, C.gray)],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy },
      spacing: { before: 0, after: 0 },
    }),
    new Paragraph({ children: [new PageBreak()], shading: { type: ShadingType.SOLID, color: C.navy, fill: C.navy } }),
  ];
}

// ── Executive summary ──────────────────────────────────────────────────────
function execSummary() {
  const summaryBox = new Table({
    width: { size: 9200, type: WidthType.DXA },
    rows: [new TableRow({ children: [new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'JSON Dev Tools (jsondevtools.org) is a well-structured developer utility site with strong URL architecture, a comprehensive 103-page sitemap, and an impressive 55+ article blog library targeting hyper-specific developer error queries. The site\'s clearest strength is its long-tail content strategy — articles targeting exact error messages like "JSON.parse Unexpected token o" are natural fits for featured snippets and voice search. The most urgent issue is the complete absence of author attribution across all blog content, which limits E-E-A-T signals critical for AI-powered engines. Schema markup (FAQPage, BreadcrumbList, WebApplication) exists in the local codebase but was undetected on the live site, suggesting deployment may be pending. Fixing this gap and adding author identity signals would produce the fastest GEO and AEO score improvements.', size: 22, font: 'Arial', color: C.dark })],
          spacing: { before: 80, after: 80 },
        }),
      ],
      shading: { type: ShadingType.SOLID, color: C.bglight, fill: C.bglight },
      margins: { top: 140, bottom: 140, left: 180, right: 180 },
    })]})],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: C.blue },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
      left: { style: BorderStyle.SINGLE, size: 8, color: C.blue },
      right: { style: BorderStyle.NONE, size: 0, color: C.white },
    },
  });

  const scoreTableRows = [
    new TableRow({ children: [
      cell('Dimension', { bg: C.navy, color: C.white, bold: true, size: 10 }),
      cell('Score', { bg: C.navy, color: C.white, bold: true, size: 10, align: AlignmentType.CENTER }),
      cell('Status', { bg: C.navy, color: C.white, bold: true, size: 10, align: AlignmentType.CENTER }),
      cell('Key Takeaway', { bg: C.navy, color: C.white, bold: true, size: 10 }),
    ], tableHeader: true }),
    new TableRow({ children: [
      cell('SEO', { size: 11, bold: true }),
      cell('6 / 10', { bg: scoreColor(6), color: C.white, bold: true, align: AlignmentType.CENTER }),
      cell('On Track', { bg: scoreColor(6), color: C.white, italic: true, align: AlignmentType.CENTER, size: 10 }),
      cell('Strong titles & URLs; meta descriptions and schema unconfirmed on live site', { size: 10 }),
    ]}),
    new TableRow({ children: [
      cell('GEO', { size: 11, bold: true, bg: C.rowalt }),
      cell('5 / 10', { bg: scoreColor(5), color: C.white, bold: true, align: AlignmentType.CENTER }),
      cell('Needs Work', { bg: scoreColor(5), color: C.white, italic: true, align: AlignmentType.CENTER, size: 10 }),
      cell('Author bylines missing on all 55+ blog posts; no social profile entity links', { size: 10, bg: C.rowalt }),
    ]}),
    new TableRow({ children: [
      cell('AEO', { size: 11, bold: true }),
      cell('5 / 10', { bg: scoreColor(5), color: C.white, bold: true, align: AlignmentType.CENTER }),
      cell('Needs Work', { bg: scoreColor(5), color: C.white, italic: true, align: AlignmentType.CENTER, size: 10 }),
      cell('FAQPage schema not live; excellent long-tail content already in place', { size: 10 }),
    ]}),
    new TableRow({ children: [
      cell('Combined', { size: 11, bold: true, bg: C.rowalt }),
      cell('16 / 30', { bg: C.navy, color: C.white, bold: true, align: AlignmentType.CENTER }),
      cell('', { bg: C.rowalt }),
      cell('Foundation is solid — targeted fixes will move scores quickly', { size: 10, bg: C.rowalt }),
    ]}),
  ];

  return [
    h1('Executive Summary'),
    summaryBox,
    para([hRun(' ', 6)]),
    new Table({ width: { size: 9200, type: WidthType.DXA }, rows: scoreTableRows, borders: { ...thinBorder() } }),
  ];
}

// ── Pages audited ──────────────────────────────────────────────────────────
function pagesAudited() {
  const pages = [
    ['https://jsondevtools.org/', 'Homepage', 'H1 present; ~450 words; no schema detected on live site'],
    ['https://jsondevtools.org/about.html', 'About', 'Author (Pasindu Ishan) identified; ~350 words; no meta description'],
    ['https://jsondevtools.org/contact.html', 'Contact', 'Email only; no contact form; no NAP schema'],
    ['https://jsondevtools.org/formatter.html', 'Tool — JSON Formatter', 'Good title; FAQ section present; schema unconfirmed live'],
    ['https://jsondevtools.org/json-validator.html', 'Tool — JSON Validator', 'Strong content; FAQPage in local source; needs live verification'],
    ['https://jsondevtools.org/json-schema-validator.html', 'Tool — Schema Validator', '~2,100 words — gold standard page; keyword table; 6 FAQs'],
    ['https://jsondevtools.org/json-diff.html', 'Tool — JSON Diff', '~420 words — thinnest tool page; no schema detected'],
    ['https://jsondevtools.org/json-tools.html', 'Tool Hub / Directory', '~620 words; 26 internal links; good navigation hub'],
    ['https://jsondevtools.org/blog/index.html', 'Blog Index', '55 articles listed; no schema on index page'],
    ['https://jsondevtools.org/blog/how-to-format-json.html', 'Blog Article', 'Updated May 2026; ~850 words; no author byline; no schema'],
    ['https://jsondevtools.org/blog/common-json-errors.html', 'Blog Article', '~550 words; good error targeting; no author attribution'],
    ['https://jsondevtools.org/blog/jsonpath-guide.html', 'Blog Article', '~1,200 words; practical use cases (AWS, K8s, Grafana); no schema'],
    ['https://jsondevtools.org/blog/yaml-vs-json.html', 'Blog Article', '~1,200 words; comparison tables present; no author'],
    ['https://jsondevtools.org/blog/json-schema-required-keyword.html', 'Blog Article', '~1,200 words; excellent technical depth; no schema markup'],
    ['https://jsondevtools.org/robots.txt', 'robots.txt', 'Allows all; sitemap pointer present — correctly configured'],
    ['https://jsondevtools.org/sitemap.xml', 'Sitemap', '103 URLs across tools, blog, and static pages'],
    ['https://jsondevtools.org/blog/what-is-json.html', 'Blog Article', '404 — page not found; linked from sitemap (broken)'],
  ];

  const headerRow = new TableRow({ children: [
    cell('URL', { bg: C.navy, color: C.white, bold: true, size: 10, width: 3400 }),
    cell('Page Type', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1800 }),
    cell('Notes', { bg: C.navy, color: C.white, bold: true, size: 10, width: 4000 }),
  ], tableHeader: true });

  const dataRows = pages.map((r, i) => new TableRow({ children: [
    cell(r[0], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 3400 }),
    cell(r[1], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 1800 }),
    cell(r[2], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 4000 }),
  ]}));

  return [
    h1('Pages Audited'),
    new Table({ width: { size: 9200, type: WidthType.DXA }, rows: [headerRow, ...dataRows], borders: { ...thinBorder() } }),
  ];
}

// ── SEO Section ───────────────────────────────────────────────────────────
function seoSection() {
  return [
    h1('SEO Analysis  —  6 / 10'),

    h2('Technical On-Page'),
    findingsTable([
      ['Title Tags', 'Strong across tool pages: "JSON Validator Online – Validate & Fix JSON Errors Free" (50 chars), "JSON Diff Online – Compare Two JSON Objects Free" (48 chars). About page title "About – JSON Dev Tools" is thin (22 chars, no keyword).', 'Good'],
      ['Meta Descriptions', 'Not captured on any page during live crawl. Confirmed present in local source for tool pages. Must verify deployment — 103 pages with missing descriptions would significantly reduce SERP click-through rates.', 'Needs Attention'],
      ['H1 Tags', 'All tool pages have a single, keyword-relevant H1. Homepage H1 is "Free Online Developer Tools" — descriptive and clean. No missing or duplicate H1s detected.', 'Good'],
      ['Heading Hierarchy', 'Tool pages use H1 → H2 (How it works / When to use / FAQ / Related Tools) structure consistently. Blog articles follow H1 → H2 logical flow. No heading stuffing detected.', 'Good'],
      ['URL Structure', 'Clean, keyword-rich URLs: /json-validator.html, /json-schema-validator.html, /blog/common-json-errors.html. No stop words or parameters. Excellent.', 'Good'],
      ['Canonical Tags', 'Present in local source (e.g., <link rel="canonical" href="https://jsondevtools.org/json-validator.html">) but not confirmed live. Verify deployment to prevent potential duplicate content issues.', 'Needs Attention'],
      ['Robots Meta', 'No accidental noindex detected. robots.txt allows all crawlers with sitemap pointer. Clean configuration.', 'Good'],
      ['Viewport / Mobile', 'Viewport meta present in local source. Assumed live — verify on mobile PageSpeed Insights.', 'Good'],
      ['Image Alt Text', 'No images detected on any crawled page — primarily a text/tool site. No alt text gaps identified.', 'Good'],
      ['Open Graph / Twitter', 'OG tags (og:title, og:description, og:url, og:type) and twitter:card present in local source but not captured on live crawl. Verify deployment for social sharing previews.', 'Needs Attention'],
      ['Internal Linking', 'Excellent — tool pages link to related tools and blog posts. Blog articles link back to relevant tools via "Try it →" CTAs. json-tools.html hub page has 26 internal links. Related Guides sections on all tool pages.', 'Good'],
      ['Sitemap', '103 URLs covering all tools, blog articles, and static pages. Properly referenced in robots.txt. One 404 detected: /blog/what-is-json.html — remove from sitemap.', 'Needs Attention'],
    ]),

    h2('Content Quality'),
    findingsTable([
      ['Word Count — Tool Pages', 'JSON Schema Validator: ~2,100 words (excellent). JSON Validator: ~520 words. Formatter: ~450 words. JSON Diff: ~420 words. Several pages are below the 500-word threshold for competitive SERP performance.', 'Needs Attention'],
      ['Word Count — Blog', 'JSONPath Guide, YAML vs JSON, JSON Schema required: ~1,200 words each (solid). "Common JSON Errors": ~550 words — could be expanded. "How to Format JSON": ~850 words — acceptable.', 'Good'],
      ['Keyword Signals', 'Primary topics clearly established on all tool pages. Semantic terms ("pretty-print", "beautify", "minify") present on formatter page. Blog articles use natural language matching likely search queries.', 'Good'],
      ['Content Freshness', 'Blog articles show "Updated May 2026" with estimated read times — positive freshness signal. Tool pages omit dates appropriately (evergreen tools).', 'Good'],
      ['Readability', 'Good use of subheadings, bullet lists, and code blocks across blog. Tool pages use structured sections (How it Works / When to Use). JSON Schema Validator has a keyword reference table — best-practice layout.', 'Good'],
      ['Content Depth', 'JSON Schema Validator is the gold standard at ~2,100 words with keyword tables, error guides, and 6 FAQs. Most other tool pages are 400-550 words — SEO opportunity to expand with more examples and use cases.', 'Needs Attention'],
    ]),

    h2('Structured Data'),
    findingsTable([
      ['Schema Markup — Live', 'Zero schema markup detected on any page during live crawl. This is the most critical technical SEO gap — it blocks rich results in Google (FAQ dropdowns, breadcrumbs, site links).', 'Missing'],
      ['Schema in Local Source', 'FAQPage, BreadcrumbList, and WebApplication JSON-LD present in local source for all tool pages. Deployment appears pending. Priority: verify these are live ASAP.', 'Needs Attention'],
      ['FAQPage Schema', 'HTML <details> FAQ sections present on all tool pages. FAQPage ld+json exists in local code with 5-6 questions per page. Once live, eligible for FAQ rich results in Google.', 'Needs Attention'],
      ['Schema Types Used', 'Local source uses: BreadcrumbList, WebApplication, FAQPage. Missing: Organization, Article (blog posts), Person (author). Adding these would significantly strengthen entity signals.', 'Needs Attention'],
    ]),
  ];
}

// ── GEO Section ───────────────────────────────────────────────────────────
function geoSection() {
  return [
    h1('GEO Analysis  —  5 / 10'),
    bodyPara('GEO (Generative Engine Optimization) measures how well a site is positioned to be cited and synthesized by AI-powered search engines such as Perplexity, ChatGPT Search, Google AI Overviews, and Gemini. These engines reward clear entity signals, factual density, author credibility, and structured content.'),

    h2('E-E-A-T Assessment'),
    findingsTable([
      ['Author Identity', 'Site creator "Pasindu Ishan" is named on the About page with location (Sri Lanka) and role (software developer). However, zero blog articles display an author byline — 55+ posts are effectively anonymous to AI engines and Google quality raters.', 'Needs Attention'],
      ['Author Credentials', 'Author described only as "a software developer" — no certifications, portfolio links, GitHub profile, LinkedIn, or years of experience stated. AI engines weight cited sources by verifiable expertise.', 'Needs Attention'],
      ['About Page Quality', 'About page exists and explains purpose, creator, and privacy commitment (~350 words). Missing: author photo, social links, professional background, and any schema markup. No meta description.', 'Needs Attention'],
      ['Contact Information', 'Personal Gmail address (pasindu98ishan@gmail.com) provided — functional but reduces perceived legitimacy vs. a domain email. No phone, address, or contact form. No ContactPoint schema.', 'Needs Attention'],
      ['Trust Signals', '"Your data never leaves your device" is a strong, repeated trust signal that differentiates from server-based tools. Missing: user testimonials, GitHub star counts, usage statistics, press mentions, or any social proof.', 'Needs Attention'],
      ['Organization Schema', 'Not detected on live site. Local source may have BreadcrumbList/WebApplication but no Organization or Person schema. AI engines use Organization schema to build the brand entity graph.', 'Missing'],
    ]),

    h2('Content for AI Synthesis'),
    findingsTable([
      ['Factual Density', 'Blog articles contain specific technical facts, code examples, and concrete guidance (e.g., exact JSON Schema draft versions supported, specific error messages with fixes). Strong for AI citation.', 'Good'],
      ['Clear Claims', 'Privacy value proposition is stated plainly and repeatedly: "your data never leaves your device." Tool functionality described concisely on each page. AI engines can extract these clearly.', 'Good'],
      ['External Citations', 'No links to external authoritative sources (MDN, RFC specs, ECMA, JSON Schema org). Blog articles would benefit from citing the specifications they reference. AI engines weight well-sourced content higher.', 'Missing'],
      ['Comprehensiveness', 'JSON Schema Validator page is comprehensive. JSONPath Guide covers all major syntax with practical examples. Some tool pages at 400-500 words leave key questions unanswered.', 'Needs Attention'],
      ['Entity Clarity', 'Brand name "JSON Dev Tools" used consistently across all pages. Domain name matches brand. Creator name used only on About page — should appear on all blog content for entity association.', 'Needs Attention'],
      ['Original Perspective', 'Privacy-first positioning is a genuine differentiator. Blog covers error-specific queries others avoid. Missing: original data (usage stats, error frequency data), surveys, or unique research AI engines prefer to cite.', 'Needs Attention'],
    ]),

    h2('Technical GEO'),
    findingsTable([
      ['HTTPS / Security', 'Site runs on HTTPS — confirmed. This is a baseline trust requirement for AI engine citation.', 'Good'],
      ['Crawlability', 'robots.txt allows all crawlers including AI engine bots (GPTBot, PerplexityBot, etc.). No blocking rules. Clean.', 'Good'],
      ['JavaScript Rendering', 'Tools are JS-rendered but content sections (FAQs, info sections) are in static HTML — crawlable. Tool UI functionality would not be visible to crawlers, which is expected for web apps.', 'Good'],
      ['Social / Entity Links', 'No links to GitHub, Twitter/X, LinkedIn, or any social profiles on the site. These same-as links are how AI engines connect the site to a known entity in the knowledge graph.', 'Missing'],
      ['Brand Consistency', 'Domain (jsondevtools.org) and brand name (JSON Dev Tools) are consistent. No conflicting brand names detected.', 'Good'],
    ]),
  ];
}

// ── AEO Section ───────────────────────────────────────────────────────────
function aeoSection() {
  return [
    h1('AEO Analysis  —  5 / 10'),
    bodyPara('AEO (Answer Engine Optimization) measures how well content is structured to appear in featured snippets, People Also Ask boxes, and voice search results — where search engines extract a direct, concise answer rather than a list of links.'),

    h2('Featured Snippet Eligibility'),
    findingsTable([
      ['Direct Answer Paragraphs', 'Several blog articles open with definition-style sentences: "Formatting (also called pretty-printing or beautifying) parses your JSON and re-prints it with consistent indentation." This is snippet-eligible if placed directly below a question heading.', 'Needs Attention'],
      ['Definition Patterns', '"JSONPath is the tool for that job when extracting values from nested JSON" — clear definitional statement. "The `required` keyword validates property presence, not value validity" — excellent definition. Could be surfaced more prominently.', 'Good'],
      ['List / Step Content', '"The four core formatting rules" as a numbered list is snippet-eligible. Error articles use numbered problem lists. JSON Schema Required article has structured sub-sections per pattern.', 'Good'],
      ['Table Content', 'JSON Schema Validator has a keyword reference table. YAML vs JSON has a comparison table. JSON to TypeScript has a type-mapping table. All are eligible for table snippets.', 'Good'],
    ]),

    h2('Structured Answer Formats'),
    findingsTable([
      ['FAQ Schema — Live', 'FAQPage JSON-LD not detected on live site. This is the highest-impact AEO gap — FAQ rich results appear directly under search results and dramatically increase SERP real estate.', 'Missing'],
      ['FAQ Schema — Local', 'FAQPage ld+json present in local source for all tool pages (5-6 questions each). Once deployed, all major tool pages would be eligible for Google FAQ rich results.', 'Needs Attention'],
      ['FAQ HTML Structure', 'HTML <details>/<summary> FAQ sections present on all tool pages and most blog articles. Questions are specific and practical ("How do I fix JSON validation errors?", "Does YAML to JSON preserve data types?").', 'Good'],
      ['HowTo Schema', 'No HowTo schema detected anywhere. Blog articles like "How to Format JSON Properly" with numbered step sections are natural candidates. Missing opportunity for HowTo rich results.', 'Missing'],
      ['Question-Phrased Headings', 'Tool page FAQs use question headings consistently. Blog articles use question-phrased H2s: "What JSON formatting actually does", "When to format vs when to minify". Good AEO hygiene.', 'Good'],
      ['Speakable Schema', 'No SpeakableSpecification markup detected. Privacy statement and tool descriptions are concise enough to be voice-search-friendly but are not marked up for voice assistants.', 'Missing'],
    ]),

    h2('Voice Search Readiness'),
    findingsTable([
      ['Long-Tail Query Targeting', 'Outstanding. Blog targets exact-match voice queries: "JSON.parse returns string not object", "Why is my API returning HTML instead of JSON", "unexpected end of JSON input". These are precisely how developers phrase voice searches.', 'Good'],
      ['Conversational Language', 'Blog articles use accessible, direct language. "The answer comes down to who reads the file" (YAML vs JSON). Tool pages are functional but could be more conversational in introductory paragraphs.', 'Good'],
      ['Error Message Targeting', 'Multiple articles target exact browser console error strings ("Unexpected token o", "Unexpected token <", "JSON trailing comma error"). These match voice queries verbatim — strong featured snippet signals.', 'Good'],
      ['Local Signals', 'Not applicable — developer tools site, no local business signals needed.', 'Good'],
    ]),
  ];
}

// ── Priority recommendations ───────────────────────────────────────────────
function priorityRecs() {
  const rows = [
    ['🔴 Critical', 'Deploy and verify schema markup (FAQPage, BreadcrumbList, WebApplication) to live site', 'SEO + AEO', 'Low', 'Very High'],
    ['🔴 Critical', 'Add author byline (Pasindu Ishan + link to About page) to all 55+ blog articles', 'GEO', 'Low', 'Very High'],
    ['🟠 High', 'Verify meta descriptions are live on all 103 pages; write any that are missing', 'SEO', 'Medium', 'High'],
    ['🟠 High', 'Add Organization schema to homepage with name, URL, logo, sameAs social profile links', 'GEO', 'Low', 'High'],
    ['🟠 High', 'Fix 404: /blog/what-is-json.html — either create the page or remove from sitemap', 'SEO', 'Low', 'Medium'],
    ['🟠 High', 'Add Article schema to all blog posts (headline, datePublished, dateModified, author)', 'GEO + SEO', 'Medium', 'High'],
    ['🟡 Medium', 'Add HowTo schema to step-by-step blog articles (How to Format JSON, etc.)', 'AEO', 'Medium', 'Medium'],
    ['🟡 Medium', 'Expand thin tool pages (JSON Diff ~420 words, Formatter ~450 words) with more examples', 'SEO', 'Medium', 'Medium'],
    ['🟡 Medium', 'Add external authoritative citations to blog posts (JSON RFC, MDN, JSON Schema org)', 'GEO', 'Low', 'Medium'],
    ['🟡 Medium', 'Upgrade About page: add photo, LinkedIn/GitHub link, specific credentials, expand to 800+ words', 'GEO', 'Low', 'Medium'],
    ['🟡 Medium', 'Add "about.html" meta description and expand title to include keywords', 'SEO', 'Low', 'Medium'],
    ['🟢 Quick Win', 'Add LinkedIn/GitHub/Twitter profile links to footer and About page (entity graph)', 'GEO', 'Very Low', 'Medium'],
    ['🟢 Quick Win', 'Replace personal Gmail with domain email (contact@jsondevtools.org) on contact page', 'GEO', 'Very Low', 'Low'],
    ['🟢 Quick Win', 'Verify Open Graph and Twitter Card tags are live by testing with social media link previewers', 'SEO', 'Very Low', 'Medium'],
    ['🟢 Quick Win', 'Add canonical tags to blog articles to prevent any duplicate content issues', 'SEO', 'Very Low', 'Low'],
  ];

  const priColors = { '🔴 Critical': C.red, '🟠 High': C.orange, '🟡 Medium': C.amber, '🟢 Quick Win': C.green };

  const headerRow = new TableRow({ children: [
    cell('Priority', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1500 }),
    cell('Issue', { bg: C.navy, color: C.white, bold: true, size: 10, width: 4500 }),
    cell('Dimension', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1200 }),
    cell('Effort', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1000 }),
    cell('Impact', { bg: C.navy, color: C.white, bold: true, size: 10, width: 1000 }),
  ], tableHeader: true });

  const dataRows = rows.map((r, i) => {
    const bg = priColors[r[0]] || C.amber;
    return new TableRow({ children: [
      cell(r[0], { bg, color: C.white, bold: true, size: 9, width: 1500, align: AlignmentType.CENTER }),
      cell(r[1], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 10, width: 4500 }),
      cell(r[2], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 1200 }),
      cell(r[3], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 1000 }),
      cell(r[4], { bg: i % 2 === 0 ? C.white : C.rowalt, size: 9, width: 1000, bold: r[4] === 'Very High' }),
    ]});
  });

  return [
    h1('Priority Recommendations'),
    new Table({ width: { size: 9200, type: WidthType.DXA }, rows: [headerRow, ...dataRows], borders: { ...thinBorder() } }),
  ];
}

// ── Strengths section ──────────────────────────────────────────────────────
function strengthsSection() {
  const strengths = [
    ["Long-Tail Blog Strategy", "55+ articles targeting exact developer error strings ('JSON.parse Unexpected token o', 'Unexpected token <') — these match voice queries verbatim and are prime featured snippet candidates."],
    ["Privacy-First Positioning", '"Your data never leaves your device" is stated on every tool page. This is a genuine differentiator vs. server-based tools and a strong, crawlable trust signal.'],
    ["URL Architecture", "Clean, keyword-rich URLs across all 103 pages. No parameters, no stop words. /json-schema-validator.html and /blog/common-json-errors.html are textbook examples."],
    ["JSON Schema Validator Depth", "~2,100 words with keyword reference table, error interpretation guide, code patterns, and 6 FAQs. This page is the gold standard for the site — every tool page should aspire to this depth."],
    ["Sitemap Coverage", "103-URL sitemap with full coverage of tools, blog, and static pages. Robots.txt is clean and properly references the sitemap. Solid technical foundation."],
    ["FAQ Sections on All Tools", "Every tool page has a structured FAQ section with 4-6 practical questions. HTML structure is good; once FAQPage schema is live, all pages become eligible for Google FAQ rich results simultaneously."],
    ["Blog Content Quality", "JSONPath Guide (~1,200 words with AWS/K8s/Grafana examples), YAML vs JSON (~1,200 words with comparison tables), and JSON Schema required (~1,200 words with nuanced technical depth) are legitimately useful reference articles."],
    ["Internal Linking Network", "Tool pages link to related tools and blog posts; blog articles link back to tools via CTA buttons; json-tools.html acts as a hub with 26 internal links. Link equity flows well across the site."],
  ];

  const headerRow = new TableRow({ children: [
    cell('Strength', { bg: C.green, color: C.white, bold: true, size: 10, width: 2400 }),
    cell('Evidence', { bg: C.green, color: C.white, bold: true, size: 10, width: 6800 }),
  ], tableHeader: true });

  const dataRows = strengths.map((s, i) => new TableRow({ children: [
    cell(s[0], { bg: i % 2 === 0 ? C.bggreen : C.white, bold: true, size: 10, width: 2400 }),
    cell(s[1], { bg: i % 2 === 0 ? C.bggreen : C.white, size: 10, width: 6800 }),
  ]}));

  return [
    h1("What's Working Well"),
    new Table({ width: { size: 9200, type: WidthType.DXA }, rows: [headerRow, ...dataRows], borders: { ...thinBorder() } }),
  ];
}

// ── Glossary ───────────────────────────────────────────────────────────────
function glossary() {
  return [
    h1('Glossary'),
    h3('SEO — Search Engine Optimization'),
    bodyPara('The practice of improving a website so that Google, Bing, and similar search engines rank it higher in results pages. SEO covers technical factors (site speed, structured data, crawlability), on-page content (title tags, headings, keyword usage), and off-page authority (backlinks from other sites).'),
    h3('GEO — Generative Engine Optimization'),
    bodyPara('An emerging discipline focused on being cited and synthesized by AI-powered search engines like Perplexity, ChatGPT Search, and Google AI Overviews. These engines do not show a list of links — they generate a written answer and cite their sources. GEO focuses on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness), factual content density, author credentials, and structured entity signals.'),
    h3('AEO — Answer Engine Optimization'),
    bodyPara('Optimizing for featured snippets, People Also Ask boxes, and voice search results — where a search engine extracts and displays a direct answer from a page rather than just listing the page as a result. AEO relies on FAQ schema markup, question-phrased headings, concise answer paragraphs (40-60 words), and HowTo schema for step-by-step content.'),
    h3('E-E-A-T'),
    bodyPara("Google's quality framework: Experience (first-hand use of the topic), Expertise (subject matter knowledge), Authoritativeness (recognized by others in the field), and Trustworthiness (accurate, honest, secure). Strong E-E-A-T signals are increasingly important as AI-generated content floods the web."),
    h3('Schema Markup / Structured Data'),
    bodyPara('Machine-readable code (usually JSON-LD in a <script> tag) that tells search engines and AI engines what a page is about — is it an FAQ? A tutorial? A software application? Schema markup enables rich results in Google (FAQ dropdowns, breadcrumbs, star ratings) and helps AI engines recognize and correctly describe the site.'),
  ];
}

// ── Header / Footer ────────────────────────────────────────────────────────
function makeHeader() {
  return new Header({ children: [
    new Table({
      width: { size: 9200, type: WidthType.DXA },
      rows: [new TableRow({ children: [
        cell('jsondevtools.org', { size: 9, color: C.navy, bold: true, width: 4600 }),
        cell('SEO / GEO / AEO Audit Report', { size: 9, color: C.gray, align: AlignmentType.RIGHT, width: 4600 }),
      ]})],
      borders: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.navy }, top: { style: BorderStyle.NONE, size: 0, color: C.white }, left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
    }),
  ]});
}
function makeFooter() {
  return new Footer({ children: [
    new Table({
      width: { size: 9200, type: WidthType.DXA },
      rows: [new TableRow({ children: [
        cell('Powered by Claude Code — JSON Dev Tools Internal Audit', { size: 9, color: C.gray, width: 6000 }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Page ', size: 18, font: 'Arial', color: C.gray }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Arial', color: C.gray })], alignment: AlignmentType.RIGHT })],
          width: { size: 3200, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        }),
      ]})],
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border }, bottom: { style: BorderStyle.NONE, size: 0, color: C.white }, left: { style: BorderStyle.NONE, size: 0, color: C.white }, right: { style: BorderStyle.NONE, size: 0, color: C.white } },
    }),
  ]});
}

// ── Build document ─────────────────────────────────────────────────────────
const doc = new Document({
  sections: [
    // Cover (no header/footer)
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: coverPage(),
    },
    // Main content
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      headers: { default: makeHeader() },
      footers: { default: makeFooter() },
      children: [
        ...execSummary(),
        para([hRun(' ', 6)]),
        ...pagesAudited(),
        para([hRun(' ', 6)]),
        ...seoSection(),
        para([hRun(' ', 6)]),
        ...geoSection(),
        para([hRun(' ', 6)]),
        ...aeoSection(),
        para([hRun(' ', 6)]),
        ...priorityRecs(),
        para([hRun(' ', 6)]),
        ...strengthsSection(),
        para([hRun(' ', 6)]),
        ...glossary(),
      ],
    },
  ],
});

const outPath = 'c:\\Users\\PC\\Documents\\PROJECT\\json-formatter\\seo-audit-jsondevtools-2026-05-21.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('DOCX written to: ' + outPath);
}).catch(e => { console.error('Error:', e); process.exit(1); });
