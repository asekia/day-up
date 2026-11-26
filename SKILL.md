---
name: day-up
description: >-
  Use this skill whenever the user asks to learn a topic step-by-step, requests
  an interactive textbook or study webpage, or wants a hands-on courseware lesson
  for any technical or conceptual subject (e.g., "teach me...", "create an
  interactive textbook", "walk me through...", "turn these notes into a course",
  "use day-up to teach me...", in any language). Profiles the
  learner first, verifies up-to-date authoritative sources, creates a structured
  8-20 chapter book syllabus, teaches one chapter at a time with progressive
  plain-language derivations and static/animated diagrams, tracks live progress,
  doubts, and quiz mistakes via progress.json, and compiles a zero-dependency
  print-inspired interactive textbook HTML inside a fixed single-port library.
---

# Day-Up: Print-Inspired Interactive Textbook & Companion Study Skill

This skill standardizes teaching any subject like a classic published textbook: **design a full book syllabus, unlock one chapter at a time, and track live mastery**. The Agent maintains the syllabus and learner profile, writes only the active chapter in full depth, and compiles it via the built-in zero-dependency engine into a **calm monochrome print-inspired reader (Continuous Scroll / Paged Book modes)** with live progress, doubt markers, and closed-loop exercises.

> **Scope & Language**: Works across **any discipline**—computer science, AI, math, physics, economics, finance, medicine, law, history, psychology, or design. **Always write the textbook, diagrams, quizzes, and companion Q&A in the user's language (English, Chinese, etc.).**

---

## 1. Freshness & Authoritative Source Verification (Never Write Outdated Material)

Before drafting any syllabus or chapter, **never rely solely on stale pretraining memory** (which produces deprecated APIs, obsolete frameworks, superseded statutes, or outdated clinical guidelines). Consult [Authoritative Sources & Search Directory](./references/authoritative-sources.md) and run **3 targeted `search_web` rounds**:

1. **Round 1 (Anchor to current-year authoritative standards & versions)**: Explicitly include the current year or `latest / release / standard / guideline / SOTA` to verify official docs, stable releases, current laws, clinical guidelines, or mainstream paradigms from the past 12–18 months.
2. **Round 2 (Audit deprecations & old-to-new migrations)**: Search explicitly for APIs, libraries, methods, or standards deprecated or replaced over the past two years. **Teach today's mainstream practice as the primary narrative**; mention legacy approaches only as historical contrast clearly labeled as obsolete.
3. **Round 3 (Recent practitioner case studies & postmortems)**: Search respected engineering/domain blogs and empirical case studies from the past two years for grounded inputs/outputs, failure logs, and trade-off numbers.
4. **Source grading, dating & zero fabrication**:
   - Primary standards, peer-reviewed papers, and official docs set technical accuracy; key versions, metrics, and conclusions must come from live verification or local execution;
   - Record the real current `date` in `course.json` and include 3–8 actually verified sources in each chapter's `references` (`Org/Author. Title (Year). URL`). **Never fabricate URLs.**

---

## 2. Book-Level Mastery Architecture, Progressive Unlock & Fixed Single-Port Library

1. **Build a 4-Stage Mastery Syllabus (`course.json`) first and pass automated syllabus validation**:
   - **Never dump an entire 8–20 chapter book at once, and never produce a shallow 3–4 chapter pamphlet!**
   - Read [Book Architecture & 4-Stage Mastery Syllabus](./references/book-architecture.md) first. Plan **8–20 chapters (hard ceiling: 20 chapters)** scaled comprehensively to the subject's depth across 4 progressive parts: **Part I Foundations & Minimal Loop (Ch. 1–3) → Part II Core Mechanism Evolution (Ch. 4–10, thorough coverage of key branches) → Part III Deep Water: Evaluation, Debugging & Trade-offs (2–4 ch.) → Part IV End-to-End Capstone & Mastery Transfer (final 1–3 ch.)**. Only explicit crash courses may use 4–6 chapters and must declare `"scope": "quick"`;
   - Every entry in `course.json`'s `syllabus` must define `part`, `prerequisite`, `bridgeToNext` (exact bottleneck motivating the next chapter), `capstoneDeliverable` (concrete hands-on artifact), and 4–6 progressive sections, passing `python3 ./scripts/validateSyllabus.py <course_dir>/data/course.json` with 0 errors;
   - Unwritten chapters appear softly as `Upcoming` in the left sidebar so the learner sees the full map while focusing deeply on the current chapter.
2. **Unlock one chapter at a time**:
   - Generate and compile only Chapter 1 (`ch1.json`) in the initial round;
   - After the learner finishes the chapter and quiz, resolve doubts/mistakes first, then append `ch2.json`, `ch3.json`, ... and recompile the same `index.html`.
3. **Fixed Single Library Directory + Fixed Single-Port Bookshelf (Never Open Separate Ports per Session!)**:
   - **One canonical library root**: Regardless of which conversation or workspace triggers `day-up`, **always store every generated book under `~/.day-up/library/<book-slug>/`** (never scatter books into random project folders or invent per-session library directories). Each book keeps its own isolated subdirectory (`index.html`, `data/`, `progress.json`, `progress_report.md`, `learner_profile.json`, `agent_chat.json`);
   - **One fixed persistent port (`http://127.0.0.1:18770/`, shared across all sessions in one browser window)**:
     ```bash
     python3 ./scripts/study_server.py --agent-cmd "<current host CLI non-interactive command>"
     ```
     - **Never invent random ports (`18771`, `18772`, `8080`, etc.)**. On startup, `study_server.py` checks `~/.day-up/server.json` and port `18770` (bypassing local proxies)—if the unified bookshelf is already running, it mounts any new book into the running instance and exits cleanly without opening a second port;
     - Visiting `http://127.0.0.1:18770/` opens the unified bookshelf for every book created across sessions (search, tags, bookmarks, progress, offline HTML export), with a `‹ Library` button in every book's topbar;
     - Existing books created elsewhere can be mounted without moving files via `python3 ./scripts/study_server.py --add /path/to/old_book`.
   - **Live progress persistence & offline fallback**: Checking section mastery, marking doubts, or answering quizzes writes live to `<book_dir>/progress.json` and `progress_report.md` (and supports manual export when opened offline via `file://`);
   - **Always read progress before advancing**: Whenever the user says "next chapter / I finished / review my progress", **read `<book_dir>/progress.json` (or `progress_report.md`) first**:
     1. Address every marked `doubt_sections` note and `wrong_questions` gap;
     2. Only after confirming understanding, author and unlock the next chapter.

---

## 3. Visual & Typography Standards (Calm, Breathable, Real Math, Zero Clutter)

1. **No loud colored boxes or nested borders fragmenting the page**: Use calm editorial typography (`16.5px / 1.85` line height, generous margins), bold left-aligned section headings (`1.1`), indented subsection headings (`1.`), and clean short paragraphs.
2. **Short breathable paragraphs + `h4` hierarchy**: Keep paragraphs to **90–220 CJK chars (or ~50–110 English words, 3–5 lines)**; never write walls of text over 280 CJK chars (~160 words). Any `h3` section exceeding ~600 CJK chars (~350 words) **must** use `h4` subsections.
3. **Purposeful static & animated visuals with strict sizing**:
   - Use `side_figure` (text left, diagram right) **only for ultra-simple diagrams** (`viewBox` width ≤ 260, ≤ 5 short labels); never squeeze complex flowcharts into narrow sidebars;
   - Use full-width `figure` for structured architecture/flow diagrams; proactively use `sim(kind:"animated-diagram")` (play/pause/step-frame, single accent `var(--link)`) for dynamic processes (protocol round-trips, gradient steps, state transitions, causal propagation). Include ≥ 2 real diagrams per chapter, referenced in prose via `{{fig:ID}}`.
4. **True mathematical typesetting**: Both `eq` blocks and inline `$...$` support standard LaTeX subscripts, superscripts, and fractions (e.g., `\mathbb{E}_{y\sim\pi}[r_\phi(x,y)] - \beta D_{\mathrm{KL}}(\pi \Vert \pi_{\mathrm{ref}})`, `\frac{a}{b}`), rendered cleanly with zero external dependencies.

---

## 4. Classic Textbook Pedagogy, Plain Human Voice & Hands-On Standards (All Disciplines)

Before writing any chapter, **read both** [Cross-Disciplinary Pedagogy & Hands-On Standards](./references/pedagogy-and-style.md) and [Plain Human Voice, Progressive Reasoning & Concept Budget](./references/human-voice-and-logic.md), enforcing all six non-negotiable standards (**across every discipline, not just coding**):

- **Draft a Chapter Causal Spine before writing JSON (eliminates disjointed sections)**:
  - **Never write `chN.json` cold from top to bottom!** Lock each section's 3-part spine first: **[Bottleneck inherited from previous section] → [1 core mechanism + concrete hands-on artifact] → [New boundary handed to next section]**;
  - If swapping two adjacent sections still reads fine, there is no real causal progression—reorder them. Every section after Section 1 must open its first 1–2 sentences by picking up the exact open question left at the end of the previous section.
- **Situation → Step-by-Step Process → Name Last + Actor-Action-Visible-Change prose (eliminates robotic AI voice)**:
  - Never open by dumping an abstract definition or verdict! Lay out **who is where, with what constraints, trying to do what** in 2–3 sentences, walk step-by-step through what changes and where it gets stuck, and only name the formal term once the reader already sees why it must exist;
  - **Kill nominalized AI filler**: Favor concrete actors, active verbs, and visible outcomes; ban bureaucratic filler (`"serves as a paradigm"`, `"leverages... to facilitate"`, `"aims to optimize"`, `"inherently exhibits"`, `"empowers"`, `"holistic dimension"`, `"it is worth noting that"`, and their equivalents in whatever language you write);
  - **Control sentence rhythm**: Short, direct sentences; **at most 1 em-dash (`——` / `—`) per paragraph**; no sprawling parenthetical nesting; no podcast cliffhanger hooks; no name-dropping random blog quotes for authority (put citations in `references`); never recite multi-line code/equations inline inside prose; never substitute shallow metaphors for real mechanisms.
- **Every Chapter Must Include Hands-On Practice (eliminates theory-only opening chapters)**:
  - **Programming / AI / Systems / Networking**: ≥ 2 real, complete, runnable core code snippets / protocol traces per chapter (10–30 lines; no 0-code theory chapters, no scripted `fakeBrain` toys);
  - **Math / Physics / Engineering**: ≥ 2 complete step-by-step worked examples + geometric/physical diagrams + tiny concrete numerical checks from start to finish;
  - **Economics / Finance / Accounting / Business**: ≥ 2 real line-by-line accounting/financial/supply-demand tables (`table`) or empirical policy/business decompositions;
  - **Medicine / Biology / Psychology**: ≥ 2 concrete clinical case differential diagnoses (chief complaint → vitals/labs → pathophysiology chain → exclusion table) or classic experiment control/treatment breakdowns;
  - **Law / History / Philosophy / Design / Arts**: ≥ 2 real case-law element-by-element analyses (facts → issue → statutory elements → holding) or primary-source / before-and-after artifact critiques;
  - Follow every artifact with a **`□` key-step breakdown + counterfactual "what breaks if we delete/change this step?" analysis**.
- **Concept Budget + Full-Depth-or-Omit + Zero Self-Coined Terms (eliminates half-explained concepts & invented jargon)**:
  - **Hard cap of ≤ 3 new core concepts per section (warn above 4)**: Never casually name-drop side concepts! For any non-core concept (whether domain compound words, lowercase technical jargon like `logits / sigmoid / on-policy / placebo`, or symbols like `η`): **first choice—delete the term and describe the action in plain words**; second choice—defer to its dedicated chapter;
  - **Full-Depth-or-Omit (zero drive-by / postscript concepts)**: Never tack on a 1–2 sentence *"Finally, note one more parameter/concept..."* postscript (e.g., mentioning `shift`, `use_dynamic_shifting`, or `distillation` in passing without derivation). Every concept, parameter, or mechanism kept in a chapter must receive full 4-part coverage (**what fails without it → exact formula/mechanism → small-number walkthrough → trade-off/boundary**); otherwise **delete it from this chapter and defer it**;
  - **Zero self-coined "lore terms" or invented nicknames**: Never invent cutesy, proprietary, or metaphorical quoted aliases (e.g., `"The Packer"`, `"Filter Mask"`, `"Four-Piece Suit"`, `"Training Trilogy"`, `"Average Cat"`, or custom experiment labels). Use **only** ① authoritative standard domain terminology (fully taught) and ② literal everyday prose. Brief analogies may describe an *action* in half a sentence, never mint a recurring custom noun;
  - **Zero naked terms, zero forward references & zero black-box numbers**: Every new concept, acronym, code `print(...)` label, or symbol **must be explained right where (or right before) it first appears**, never used naked early and defined later. Every concrete score, metric, probability, price, or lab value must state **who computed/measured it, how inputs became that number, and its scale/normal bounds**. Never double a term before `{{term:...}}` (❌ `LLM{{term:LLM|...}}`), and write **~20–50 English words (or 25–90 CJK chars)** of genuine micro-lesson content inside every term gloss.
- **Ban "Defensive Textbook Writing" & Require Level-Matched Code/Formula Derivations (All Disciplines)**:
  - **Happy path first, guards/exceptions second**: Never cram defensive caveats (`try/finally`, legal provisos, rare differentials, edge-case qualifiers) into the first pass before the reader understands the baseline path. Complete the minimal core first, then ask *"What happens if something goes wrong mid-way?"* to introduce the guard naturally;
  - **Zero-jump micro-steps + voice the reader's silent doubt**: Never skip two causal links (`A → C` must expand into `A → B → C`). Ban hand-waving phrases across all disciplines (`easily seen`, `obviously follows`, `by simple rearrangement`, `inevitably leads to`, `needless to say`, `self-evident`, and their equivalents in any target language). Show the naive attempt hitting a wall, explicitly voice the reader's likely objection, and recap briefly every 2–3 steps;
  - **Zero-jump formulas & level-matched per-API code breakdown**: Every core `eq` must explain the concept first → `□` symbol-by-symbol breakdown → explicit intermediate algebraic steps (never consecutive `eq` blocks with a 1-line bridge) + 2–3 small-number hand verification. For code, **consult `learner_profile.json`**: when `coding_level` is `none` or `basic`, **explain EVERY custom function and EVERY non-trivial library API/method called in the code** (purpose, arguments, return shape)—never cherry-pick 3 lines and leave 10 functions unexplained!
- **Practical, Deeply Grounded Quizzes Across All Disciplines (Zero Passing-Mention Traps, Zero Shallow Rote Recall)**:
  - Ban AI clichés; include 5–7 single-choice + 3–4 short-answer questions per chapter with valid `ref` links;
  - **100% Deep Knowledge Grounding (never test passing mentions)**: Every concept, parameter, acronym, variable, symbol, and API appearing in `q`, `options`, `answer`, OR `explain` must be **taught in full depth inside the cited `ref` section** (backed by mechanism + formula/code/worked numbers)—never test a term only mentioned in passing or tacked onto a 2-sentence postscript (e.g., testing `shift` without having derived its formula and numeric effect in `ref`), and never introduce an untaught acronym (like `OOM`) inside an answer/explanation;
  - **Engineering Practice & Real-World Theoretical Depth**: At least **70% of single-choice and 100% of short-answer questions** must test **practical debugging, real-world scenario diagnosis, quantitative calculation, counterfactual fault injection, or case/policy trade-offs**—never populate quizzes with shallow "Which is the definition of X?" rote recall.

---

## 5. Standard Execution Workflow

### Phase A: Learner Profiling & Book Setup (First Request)
1. **Brief profiling (`learner_profile.json`)**: Read [Learner Profiling & Dynamic Adaptation](./references/learner-adaptation.md). If the user hasn't stated their background, ask ≤ 3 concise questions (prefer `ask_question`) covering: **① subject familiarity, ② coding/math/domain practice level, ③ learning goal** (skip dimensions already stated). Save to `~/.day-up/library/<book-slug>/learner_profile.json`.
2. **Verify current sources, plan an 8–20 chapter mastery syllabus & validate it**:
   - Consult [Book Architecture](./references/book-architecture.md) and [Authoritative Sources](./references/authoritative-sources.md); run `search_web` to anchor current standards and chapter progression;
   - Create `~/.day-up/library/<book-slug>/data/course.json` (8–20 chapters, 4-stage progression, with `part`, `prerequisite`, `bridgeToNext`, `capstoneDeliverable`, and 4–6 sections per chapter) and validate with 0 errors:
     ```bash
     python3 ./scripts/validateSyllabus.py ~/.day-up/library/<book-slug>/data/course.json
     ```
   - Present the syllabus (including part goals and capstone deliverable) to the user for confirmation before drafting Chapter 1.
3. **Draft the Chapter 1 causal spine, research live sources & author `ch1.json`**:
   - Lock Chapter 1's section-by-section causal spine per [Human Voice & Logic](./references/human-voice-and-logic.md);
   - Run targeted `search_web` per section for authoritative standards and recent real-world cases; author `ch1.json` strictly matching `learner_profile.json`, [Pedagogy & Style](./references/pedagogy-and-style.md), [Schema & Style](./references/schema-and-style.md), and real verified `references`.
4. **Zero-background reader audit + automated chapter validation (0 errors, clear warnings)**:
   - Read `ch1.json` as a fresh reader: verify zero half-explained drive-by/postscript concepts, zero self-coined quoted nicknames, every acronym/code API/output label/magic number/derivation step is fully explained, and every tested quiz concept/parameter/acronym was taught in full depth inside its cited `ref` section;
   - Run the validator:
     ```bash
     python3 ./scripts/validate_chapter.py ~/.day-up/library/<book-slug>/data/ch1.json
     ```
5. **Compile into the fixed unified library directory**:
   ```bash
   python3 ./scripts/build_courseware.py \
     --data-dir ~/.day-up/library/<book-slug>/data \
     --out ~/.day-up/library/<book-slug>/index.html
   ```
6. **Start or reuse the fixed single-port bookshelf (`18770`, never open a second port)**:
   - Pass the active host CLI's non-interactive invocation command via `--agent-cmd` (verify with a minimal test if unsure; `{prompt}` passes as an argument, otherwise via `stdin`):
     ```bash
     python3 ./scripts/study_server.py --agent-cmd "<current host CLI non-interactive command>"
     ```
   - If the unified bookshelf is already running on `18770`, `study_server.py` detects and reuses it automatically (zero extra ports); omit `--agent-cmd` if no standalone CLI exists (the UI seamlessly uses `agent_chat.json` bridge mode).
   - Share the bookshelf URL `http://127.0.0.1:18770/` and direct book URL `http://127.0.0.1:18770/books/<book-slug>/`.

### Phase B: Read Progress → Adapt Level → Close Gaps → Unlock Next Chapter
1. **Read live state**: Read `<book_dir>/progress.json` (or `progress_report.md`) and `learner_profile.json` to inspect mastered sections, doubt notes, and quiz mistakes.
2. **Resolve doubts & adapt difficulty**: Give targeted, plain-language explanations for all doubts/mistakes; update `learner_profile.json` per [Learner Adaptation](./references/learner-adaptation.md) (slow down and unpack finer if struggling; accelerate and deepen if acing it) and confirm the pacing for the next chapter in one sentence.
3. **Draft & unlock Chapter `N+1`**: Lock its causal spine → verify live sources → author `ch(N+1).json` → run `validate_chapter.py` → recompile `index.html` via `build_courseware.py` → tell the user to refresh their existing browser tab.

### Phase C: Inline Glossary Popovers, Companion Agent & Direct Q&A Rules
- **Interactive glossary & highlight-to-ask**: Every registered term automatically gains subtle inline highlights (hover to preview, click to pin + `✦ Explain Deeper`); highlighting any passage pops up `✦ Ask`.
- **Single active-Agent companion pane (zero dropdown clutter)**:
  - The right pane connects directly to the active Agent bound via `--agent-cmd` (showing uniformly as `Current Agent`, with automatic UTF-8, ANSI-strip, Windows `.cmd`/`.exe` unwrapping, non-Git compatibility, and nested-session env cleanup) or falls back cleanly to the `agent_chat.json` bridge (`reply_agent.py`).
- **Plain human-voice direct Q&A rules (apply both in main chat and in the companion pane)**:
  1. **Progressive reasoning, zero defensive leaps**: Lay out a minimal scenario in 1–2 sentences, walk step-by-step (`A → B → C`) through the baseline before introducing exceptions or guards, and never recite dictionary definitions or repeat the textbook verbatim;
  2. **Respect concept budget & ban AI filler**: Never drop unexplained extra jargon the user didn't ask about; explain unavoidable new terms inline in half a sentence; ban robotic filler and limit to ≤ 1 em-dash per paragraph;
  3. **Concrete proof + current-era check**: Anchor every answer with 2–3 tiny numbers, a concrete example, or "what breaks if we remove it", noting modern replacements if the asked method is outdated;
  4. **Quick 10-second verification**: End with 1 light check question; if a major blind spot surfaced, update `learner_profile.json` and patch the current chapter JSON when helpful.
