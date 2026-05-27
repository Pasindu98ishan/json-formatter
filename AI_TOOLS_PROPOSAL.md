# AI Prompt Generator Tools — Strategy & Design Proposal

> Source of truth for the AI prompt generator toolset on jsondevtools.org.
> All implementation decisions trace back to this document.

---

## 1. Why

The site currently targets JSON / dev-utility keywords. Search demand around AI prompt engineering has exploded since 2023 and is sustained:

| Tool | Primary keyword | Approx monthly search (US) |
|---|---|---|
| Midjourney Prompt Generator | "midjourney prompt generator" | ~40,000 |
| Anime Prompt Generator | "anime prompt generator" | ~20,000 |
| ChatGPT Prompt Generator | "chatgpt prompt generator" | ~35,000 |
| AI Image Prompt Generator | "ai image prompt generator" | ~15,000 |
| SQL Prompt Generator | "sql prompt generator" / "ai sql query generator" | ~8,000 |

These are entirely new audience pools — almost zero overlap with existing JSON-tool visitors. Same browser-only architecture, zero backend cost.

**Non-goals:** This is NOT real AI generation. No API keys, no model calls, no per-request cost. We build prompt strings users feed into their own AI tools.

---

## 2. What we're building

5 tools, shipped in 3 phases:

**Phase A (initial release):**
- `midjourney-prompt-generator.html` — image prompts with Midjourney `--ar/--stylize/--chaos/--v/--quality` parameters
- `anime-prompt-generator.html` — anime/manga aesthetic prompts (Ghibli, Shounen, Mecha, etc.)

**Phase B (after A validates):**
- `ai-image-prompt-generator.html` — generic image prompts (DALL-E, Stable Diffusion)
- `chatgpt-prompt-generator.html` — role/task structured prompts for ChatGPT and Claude

**Phase C (later, different engine shape):**
- `sql-prompt-generator.html` — schema-aware structured prompts (needs different engine; deferred)

---

## 3. The variety thesis

The core risk: **a basic "template + 5-option dropdowns" approach produces ~25 possible outputs per subject.** Ten users with similar inputs walk away with near-identical prompts. This is exactly what 100+ existing generic prompt generators online do — and they don't rank or retain.

**Our differentiator: every user gets a different prompt, every re-roll gives a different prompt, but every output stays coherent.**

Achieved by layering nine variety strategies (Section 4). Combined math: a single tool with 8 fields × 5 weighted phrasings each × 6 modifier-zone orderings × probabilistic field inclusion × 4 strength modes × bias slider × MJ params → effectively unique outputs per user per re-roll. Tens of thousands of distinct coherent prompts per input.

---

## 4. The nine strategies

### S1 — Deep option pools (30–80 per field)
Not 5 lighting options. 60+ across categories (natural, studio, dramatic, ambient, cinematic).

### S2 — Weighted synonym rendering
Each option resolves to a small pool of phrasings with weights. Common-good phrasings fire often; rare/quirky ones occasionally appear.

```js
{
    key: 'golden_hour',
    phrasings: [
        { value: 'golden hour glow',    weight: 10 },
        { value: 'warm sunset rays',    weight: 8 },
        { value: 'honey-toned light',   weight: 5 },
        { value: 'magic hour radiance', weight: 3 },
        { value: 'amber dusk haze',     weight: 1 }
    ]
}
```

Weighted random (not uniform) makes outputs feel natural — the way real users write, not the way a random generator does.

### S3 — Modifier-zone shuffling (CONSTRAINED)
**Critical constraint:** Midjourney/Stable Diffusion are sensitive to token order. Subject and Style must lead — burying them mid-prompt produces worse generations and users will blame the tool.

Lock the first two positions:
1. Core Subject — always position 1
2. Style — always position 2

Shuffle ONLY within the modifier zone (positions 3+):
- Lighting ↔ Camera ↔ Color Palette ↔ Composition ↔ Mood can swap freely
- Detail Modifiers and Rendering Style stay near the end
- Negative Prompt always last

This gives rhythm variation without breaking model performance.

### S4 — Probabilistic modifier inclusion
Not every prompt needs every field. Default probabilities (overridable by Strength mode S8 and per-field checkboxes):

| Field | Default probability |
|---|---|
| Camera angle | 70% |
| Color palette | 50% |
| Artist reference | 30% |
| Negative prompt | 40% |
| Detail modifiers | 80% |

### S5 — Re-roll button
One click → fresh random picks across Strategies 2/3/4. Same field selections, different output. Promotes iteration, turns one-shot generation into a creative companion.

### S6 — Minimal context rules (3–5 per tool)
Hard exclusions only:
- Midjourney: `style: anime` → exclude photorealistic modifiers; `style: oil painting` → exclude "8K resolution"
- Anime: `style: realistic` → exclude cel-shaded modifier

Cap at 5 rules per tool in Phase A. Add more based on real-user feedback, not speculation.

### S7 — Midjourney parameter integration (MJ-only)
SEO-critical: keywords "midjourney --ar", "midjourney --stylize", "midjourney --chaos" have meaningful volume. Support:

| Parameter | Type | Options |
|---|---|---|
| `--ar` | select | 1:1, 16:9, 9:16, 3:2, 21:9 |
| `--stylize` | slider | 0–1000 (common: 50, 250, 750) |
| `--chaos` | slider | 0–100 (default 0) |
| `--v` | select | 5.2, 6, 6.1, niji 6 |
| `--quality` | select | 0.25, 0.5, 1, 2 |

Appended to the assembled prompt. Adds SEO value, perceived expertise, advanced-user retention.

### S8 — Prompt Strength modes
A segmented control: **Simple / Detailed / Professional / Extreme**. Modulates modifier density, adjective richness, MJ-param inclusion probability, and output length.

| Mode | Modifier inclusion mult | Adjective richness | MJ params | Length |
|---|---|---|---|---|
| Simple | × 0.4 | minimal | rare | ~10 tokens |
| Detailed | × 1.0 | normal | sometimes | ~25 tokens |
| Professional | × 1.3 + photography terms | rich | always | ~45 tokens |
| Extreme | × 1.6 + maximalist | dense, layered | always + chaos boost | ~70 tokens |

Example contrast (same subject "anime warrior"):
- **Simple:** `anime warrior in cyberpunk city, neon lighting`
- **Extreme:** `cinematic anime warrior standing in a rain-soaked cyberpunk alley, neon signs reflecting in puddles, dramatic low-angle shot, volumetric haze, ultra-detailed character design, Studio Ghibli meets Blade Runner aesthetic --ar 16:9 --stylize 750 --v 6`

### S9 — Creative Bias slider
Slider: **Balanced ←→ Experimental**. Dynamically transforms weights in `pickWeighted()`.

- **Balanced (default):** weights used as-defined. Common phrasings dominate.
- **Experimental:** weights inverted/flattened. Rare modifiers surface more often, unusual combinations increase.

One slider value, applied across every pool. Makes the tool feel premium — users feel they have a creative dial.

---

## 5. Subject field — special treatment

Every other field is a dropdown. The subject field is the user's creative core input and must be **free text**. Three pieces:

1. **Free-text input** (not a dropdown). Required field.
2. **Rotating placeholder** — cycles every 4 seconds through pool examples ("a lone astronaut", "a medieval blacksmith", "a fox in a winter forest", "an ancient librarian"). Reduces blank-input paralysis. Stops cycling on focus.
3. **"Surprise me" button** — fills subject from a curated pool + randomises every other field. First-time-visitor engagement hook. Generates a complete, plausible prompt with one click.

---

## 6. Output presentation

Two-part output area. This separates us from competitors that show a plain textarea.

### 6.1 Assembled prompt
Large copyable mono-font box at the top. The thing users grab. Includes a primary Copy button.

### 6.2 Prompt breakdown
Below the assembled box, each section displayed as a labelled chip with **educational tooltip on hover**:

```
┌─ Core Subject ──────── ⓘ ──┐  hover: "The main thing your image will show.
│ a fluffy persian cat      │         Keep early in the prompt for strongest weight."
├─ Lighting ───────────── ⓘ ──┤  hover: "Controls mood and atmosphere.
│ golden hour glow          │         Placed early = stronger influence in most models."
├─ Style ──────────────── ⓘ ──┤  hover: "The visual aesthetic. Combine with
│ cinematic, shallow DOF    │         Lighting for cohesive results."
└────────────────────────────┘
```

Each chip:
- Carries `data-tooltip` from the data file (educational one-liner per section)
- Has a mini copy icon → copies just that section

**Why this matters:**
- Educational — users learn WHY the prompt is structured this way
- Dwell time — users spend longer on page → SEO signal
- Premium feel — separates us from textarea-only competitors
- Shareable — users screenshot the breakdown when sharing with friends/teams

---

## 7. Per-tool design notes

### Midjourney
- Fields: subject, style, environment, lighting, camera, mood, color palette, composition, detail modifiers
- MJ-only: parameter row (S7)
- Strength profiles tuned for image generation (photography terminology in Pro/Extreme)
- Subject placeholders: cinematic / photographic ("a lone astronaut", "a vintage racing car")

### Anime
- Fields: subject (character), style (Ghibli/Shounen/Mecha/etc.), setting, mood, art technique (cel-shading/screen tones/ink wash), color palette, character archetype
- No MJ params (different platform target)
- Strength profiles tuned for anime (less photographic terms, more stylistic vocabulary)
- Subject placeholders: anime-flavoured ("a ronin in a bamboo grove", "a mecha pilot at sunset")
- Context rule: realistic style excludes cel-shaded modifier

### AI Image (Phase B)
- Generic image prompts for DALL-E, Stable Diffusion (no platform params)
- Fields similar to Midjourney without the `--` syntax
- Audience: users not committed to a specific platform yet

### ChatGPT (Phase B)
- Structurally different: role + task + context + constraints + output format
- Fields: role (e.g., "senior backend engineer"), task description, constraints, examples, output format
- Less emphasis on phrasing variety, more on structured completeness
- Engine still reusable — just different field types and templates

### SQL (Phase C)
- Different engine shape entirely. Users have a specific schema in mind.
- Needs: schema input area, query-type select, dialect select, edge-case checklist
- Output is a structured PROMPT (to feed to ChatGPT/Claude), not a SQL query
- Defer to Phase C — design separately based on Phase A learnings

---

## 8. Phased rollout

| Phase | Tools | Eng work | Status |
|---|---|---|---|
| A.1 | (none — engine + proposal) | engine S1–S6 + test fixture + proposal doc | Plan approved |
| A.2 | Midjourney MVP | data file + page scaffold + S7 (MJ params) | Pending A.1 |
| A.3 | Premium UX on Midjourney | S8 + S9 + subject UX + breakdown chips + tooltips | Pending A.2 |
| A.4 | Anime tool | data file + page; zero engine changes | Pending A.3 |
| B | AI Image + ChatGPT | data files + pages; minor engine extensions if needed | After A validates |
| C | SQL | new engine shape | After B |

---

## 9. Success metrics

Tracked via existing Google Analytics (`trackEvent()` already wired):

- **Page views** per tool (organic search arrival)
- **Copy-button clicks per session** (intent to use)
- **Re-roll count per session** (engagement / iteration depth)
- **Surprise-Me clicks** (first-time engagement)
- **Strength-mode distribution** (which modes users gravitate to)
- **Bias-slider position changes** (advanced-user signal)
- **Return visits** within 30 days (retention)
- **Organic search rank** for target keywords (track manually via GSC)

Target after 60 days post-launch:
- 5,000+ organic visits/month across the 2 launch tools
- 30%+ of visitors click Copy at least once
- 15%+ of visitors re-roll at least once

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Duplicate-content SEO penalties | The variety engine itself solves this — every page render is textually different. Static SEO content (info, FAQ, related-tools) is uniquely written per page. |
| Ad-policy sensitivity (AdSense) | Creative + dev tools are low-risk categories. No politics, no medical, no adult content. |
| Token-order breaking model output (S3 risk) | Constraint enforced: Subject in pos 1, Style in pos 2, only modifier-zone shuffles. |
| User confusion ("is this real AI?") | Page copy clearly states "prompt generator" not "AI generator". Output is plainly a prompt string they can feed into Midjourney/ChatGPT themselves. |
| Bundle size growth | Each data file is ~500 LOC pure JS data. Loaded only on its own page. Engine is one ~400 LOC file shared across all. Total per-page cost < 30KB minified. |
