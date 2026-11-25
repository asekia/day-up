# Declarative Textbook Data Schema, Visual Diagrams & Delivery Checks

## 1. Top-Level JSON Schema

Single chapter file (`chN.json`):

```json
{
  "id": "ch1",
  "num": 1,
  "title": "Chapter title (do NOT prefix with 'Chapter 1')",
  "objectives": [
    "Understand ...",
    "Master ...",
    "Master ..."
  ],
  "roadmap": "First this chapter introduces ..., then derives ..., and finally verifies ... in practice.",
  "sections": [
    { "type": "h3", "text": "Section Title" },
    { "type": "p", "text": "Concrete opening paragraph setting up the real problem before naming concepts." }
  ],
  "exercises": {
    "single_choice": [
      {
        "q": "Practical diagnostic or quantitative question stem.",
        "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
        "answer": "B",
        "ref": "§1.1",
        "explain": "Concise, grounded explanation citing the chapter mechanism."
      }
    ],
    "short_answer": [
      {
        "q": "Engineering practice, calculation, or real-world diagnostic prompt.",
        "ref": "§1.1",
        "answer": "Concise, verifiable reference solution."
      }
    ]
  },
  "references": [
    "Author/Org. Verified Primary Source Title (Year). https://..."
  ]
}
```

Book metadata file (`course.json`) inside `--data-dir` **must include the full book `syllabus`** so unwritten chapters appear cleanly as `Upcoming` in the left TOC sidebar:

```json
{
  "title": "Book Title",
  "subtitle": "Core progression arc subtitle",
  "version": "v1.0",
  "date": "2026-11-25",
  "syllabus": [
    {
      "id": "ch1",
      "num": 1,
      "part": "Part I · Foundations & Minimal Loop",
      "title": "Chapter 1 Title",
      "prerequisite": "None",
      "bridgeToNext": "Exact open bottleneck leading into Chapter 2",
      "capstoneDeliverable": "Concrete hands-on deliverable",
      "sections": ["1.1 ...", "1.2 ...", "1.3 ...", "1.4 ..."]
    }
  ]
}
```

### Live Progress Files (`progress.json` & `progress_report.md`)

When served via `scripts/study_server.py`, the reader persists live state to `<book_dir>/progress.json` and `<book_dir>/progress_report.md`:
- `active_location` / `active_anchor`: current reading position;
- `unlocked_chapters` / `upcoming_syllabus`: unlocked vs. upcoming chapters;
- `mastered_sections`: sections checked as mastered;
- `doubt_sections`: sections flagged with learner doubts and notes;
- `quiz_summary`: completion count, accuracy, and exact `wrong_questions` list with section `ref`.

---

## 2. Allowed Content Blocks (`sections` Array Items)

| `type` | Required / Optional Fields | Print-Book Rendering & Usage Guidelines |
|---|---|---|
| `h3` | `text`, `id?` | Bold left-aligned section heading, auto-numbered `N.y` and added to TOC (never hand-number) |
| `h4` | `text` | Indented bold subsection heading, auto-numbered `1.` `2.` (never hand-number) |
| `p` | `text` | Clean serif body paragraph; supports `**bold**`, `` `code` ``, `$inline math$`, `{{term:Term|Gloss}}`, `{{fig:ID}}`, `{{tab:ID}}`, `{{eq:ID}}` |
| `side_figure` | `text` or `paragraphs[]`, `id?`, `caption`, `svg?`, `src?` | **Side-by-side layout (text left, visual right)**: **strictly for ultra-simple visuals (`viewBox` width ≤ 260, ≤ 5 short labels)**; use full-width `figure` or `animated-diagram` for complex diagrams |
| `figure` | `id?`, `caption`, `svg?`, `src?`, `output?` | Full-width monochrome vector diagram or command output figure, auto-numbered; whenever `id` is set, cite in prose via `{{fig:ID}}` |
| `syntax` | `text` | Clean indented plain-text grammar/format line (borderless), e.g., `scheme://[user:pass@]host[:port]/path` |
| `code` | `lang`, `text`, `result?`, `resultId?`, `output?`, `svg?` | Calm hairline-ruled code block (subtle copy button); setting `result` + `resultId` auto-renders a numbered output figure |
| `enum` | `items[]`, `style?("square")`, `depth?(1-4)` | `style:"square"` renders print-book open checkboxes `□`—ideal for symbol-by-symbol equation breakdowns and per-API code explanations |
| `table` | `id?`, `caption?`, `head[]`, `rows[][]` | Classic three-line academic table (auto-numbered); cite in prose via `{{tab:ID}}` |
| `eq` | `id?`, `text`, `num?` | Display equation block supporting zero-dependency LaTeX (`\frac{a}{b}`, `_{sub}`, `^{sup}`, `\mathbb{E}`, `\sum`, etc.) numbered `(N.k)` on the right; **always follow with symbol breakdown & small-number verification** |
| `def` / `prop` / `note` / `ex` | `label?`, `text`, `proof?` | Minimal left-hairline callout (**no loud colored fill**); use sparingly (≤ 35% of chapter blocks) |
| `term` | `name`, `def`, `hidden?` | Glossary entry appended to the book-wide glossary index (`hidden:true` indexes without taking page space) |
| `sim` | `kind`, ... | Restrained interactive modules: `animated-diagram` (play/pause/step frames, auto-numbered figure), `step-walkthrough` (interactive step-by-step state trace), `formula-explorer` (interactive curve/slider lab), `margin-simulator` |
| `slot` | `text` | Dashed placeholder block for content to be filled |

---

## 3. Static Diagrams & Animated Diagrams (Clear, Never Gaudy)

- **Static conceptual/structural diagrams (`side_figure` / `figure`)**: Use `currentColor` for strokes/text and `none` or `var(--paper)` for fills to preserve calm print typography.
- **Dynamic process diagrams (`sim` with `"kind": "animated-diagram"`)**: Use proactively whenever teaching flows, pointer/memory movement, protocol exchanges, gradient steps, or state transitions:
  - Draw the static skeleton in `currentColor` and highlight only the active moving element with the single accent `var(--link)`;
  - Built-in classes `class="svg-flow"` (flowing dashed line) and `class="svg-pulse"` (gentle focus pulse) plus native SVG `<animate>` / `<animateMotion>` are supported and gracefully respect `prefers-reduced-motion`;
  - Automatically numbered as a figure and cited in prose via `{{fig:ID}}`.

```json
{
  "type": "sim",
  "kind": "animated-diagram",
  "id": "http-cycle",
  "title": "Animated Diagram: One Complete HTTP Request–Response Round Trip",
  "caption": "Step-by-step HTTP message exchange between browser and server",
  "intervalMs": 2200,
  "frames": [
    {
      "short": "Parse URL",
      "title": "Browser splits the URL and keeps the fragment locally",
      "svg": "<svg viewBox='0 0 600 150'>...</svg>",
      "caption": "The browser strips `#intro` locally and extracts the host and path."
    }
  ]
}
```

---

## 4. Automated Delivery Checks (`scripts/validate_chapter.py`)

- **Banned clichés**: `"in conclusion"`, `"needless to say"`, `"it is worth noting"`, `"obviously"`, `"undoubtedly"`, `"as we all know"`, `"it goes without saying"` (and their direct equivalents in any target language).
- **Built-in structural & pedagogical gates**:
  - Every section starts with a narrative paragraph `p` (never drops a bare box or formula cold);
  - Every chapter includes real visual diagrams, ≤ 35% callout density, closed-loop `{{fig:}}`/`{{tab:}}`/`{{eq:}}` references, and valid exercise `ref` pointers;
  - Enforces concept budget (≤ 4 new terms per section), zero forward-referenced or naked jargon, zero unexplained code APIs or printed output labels, zero skipped derivations, and grounded practical quizzes.
