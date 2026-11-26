# Cross-Disciplinary Classic Textbook Narrative, Plain-Language Standards & Practical Exercises

> Applies to **every discipline** (not just programming—equally covers math, physics, economics, finance, medicine, biology, law, history, psychology, design, and arts). Designed to eliminate four classic AI textbook failures: **① PPT-card listing instead of causal progression**, **② em-dash/parenthesis nesting and podcast cliffhangers**, **③ theory-only opening chapters lacking hands-on artifacts**, and **④ naked concepts, black-box numbers, unexplained code APIs, and shallow rote quizzes**.

---

## 1. Why Classic Textbooks Read Effortlessly Across All Disciplines

Whether opening *The Feynman Lectures on Physics*, Gilbert Strang's *Introduction to Linear Algebra*, Mankiw's *Principles of Economics*, Pathoma, Wang Zejian's civil-law method, or *Crafting Interpreters*, they share one core craft:

1. **Reader Assumption ("Smart Zero-Background Roommate" — Mankiw Standard)**:
   Treat the reader as highly intelligent with zero prior jargon in this field—never talk down, and never assume they already memorized any acronym, formula, or domain phrase.
2. **Narrative Spine ("Socratic Causal Zipper", Never PPT Card Lists)**:
   Every section progresses smoothly through **Real Friction → Intuition → Formal Concept → Hands-On Artifact → Counterfactual Break-Test → Zipper Bridge to Next Section**:
   - **Problem First (Zero Cliffhangers)**: Open with a concrete observable puzzle—a counterintuitive economic outcome, a clinical complaint, a real lawsuit fact pattern, a physical paradox, or a real error/output;
   - **Intuition Before Formalism**: Build the visual/mental model in plain speech before introducing symbols, equations, statutes, or code. Never introduce a term before creating the need for it;
   - **Immediate Concrete Artifact**: Right after the concept clicks, ground it in a genuine hands-on artifact for that discipline (never talk abstractly for 2,000 words without practice);
   - **Break It & Verify**: Point to the critical line/premise and ask *"What immediately collapses or flips if we delete this line, change this assumption, or skip this test?"*, then check with tiny concrete numbers or real facts;
   - **Zipper Transition**: Expose the new boundary this method cannot handle at section end, and let the next section's opening sentence pick it up directly.

---

## 2. Cross-Disciplinary "Hands-On Every Chapter" Matrix

**Never write theory-only opening chapters that postpone practice to the final chapter!** From Chapter 1 onward, **every chapter must include ≥ 2 genuine hands-on artifacts** paired with **key-step breakdown + counterfactual break-test + small concrete verification**:

| Discipline | Classic Benchmarks | Required Hands-On Artifacts (≥ 2 per chapter; no fake toys!) | Required Counterfactual Break-Test |
|---|---|---|---|
| **CS / AI / Systems / Networking** | *Crafting Interpreters*, *DDIA*, *CSAPP* | **10–30 line real runnable code + real protocol traces/configs + real output** (no 0-code chapters, no hardcoded `fakeBrain` scripts) | Exact error or wrong output if a key guard/line (zero-grad, timeout, lock, mask, sign) is deleted or flipped |
| **Math / Statistics / Physics / Eng.** | *Feynman Lectures*, Strang, Griffiths | **Complete hand-worked examples + geometric/force diagrams + tiny numerical checks from start to finish** (zero `"easily seen"` leaps) | Exact step where a theorem/formula breaks if an assumption (non-zero determinant, independence, zero friction) fails |
| **Economics / Finance / Accounting** | Mankiw, Damodaran, classic accounting texts | **Line-by-line schedules/financial tables (`table`) + empirical policy/business case decompositions** | Which rows/curves shift and why when a shock hits (rent cap, +100bp rate hike, inventory method switch) |
| **Medicine / Biology / Psychology** | *Pathoma*, *Guyton*, Campbell, Kahneman | **Real clinical case differentials** (complaint → vitals/labs → pathophysiology chain → exclusion table) or classic control vs. treatment data | Which skipped test causes fatal misdiagnosis? Which altered control variable flips the experimental conclusion? |
| **Law / Public Policy** | Continental claim-basis & common-law casebooks | **Full real-case syllogism** (facts → issue → element-by-element statutory check `□` → holding) | How changing one key fact (fault, timing, causation, burden of proof) immediately reverses the verdict |
| **History / Philosophy / Design / Arts** | *Guns, Germs, and Steel*, *Design of Everyday Things* | **Primary-source / artifact close reading** (raw quotes, geographic/chronological tables, before/after UI or musical harmony breakdown) | How removing one geographic constraint, logical premise, or UI signifier collapses the historical outcome or usability |

---

## 3. Prose & Rhythm Rules (Eliminate AI Tone)

1. **Short direct sentences; zero parenthetical nesting**: Keep sentences concise (one idea per sentence); break long parenthetical clauses into separate sentences.
2. **At most 1 em-dash (`—` / `——`) per paragraph**: Use periods instead of chaining three clauses with em-dashes.
3. **Never recite code or formulas inline inside prose**: Put code in `code`, equations in `eq`, comparisons/schedules in `table`; keep prose fluent and readable.
4. **Ban podcast cliffhangers and authority name-dropping**: Never open with *"The fastest way to learn X is..."* or *"As a famous engineering blog once put it..."*—digest ideas completely and speak directly as the author; place sources in `references`.
5. **No cheap metaphors replacing real mechanisms**: Limit light analogies to half a sentence; never spend a full paragraph on "brain/hands/whiteboard" analogies instead of the real mechanism.
6. **Breathable paragraphs + `h4` hierarchy**: Keep paragraphs compact (90–220 CJK chars / ~50–110 English words, never > 280 CJK chars); use `h4` subsections whenever an `h3` exceeds ~600 CJK chars (~350 words).

---

## 4. Zero-Jump Textbook Laws: Concept Budget, Anti-Defensive Derivation & Level-Matched Code

### 1. Concept Budget, Full-Depth-or-Omit & Zero Self-Coined Terms
- **Hard cap of ≤ 3 new core concepts per section**: Never casually name-drop side terms. Prefer deleting non-core jargon in favor of plain action words, or deferring it to its dedicated chapter.
- **Full-Depth-or-Omit (zero drive-by or postscript concepts)**: Never tack on a 1–2 sentence *"Finally, add one more parameter..."* note at the end of a section without full derivation. Every concept, parameter, or mechanism kept in the chapter must be explained completely (**failure without it → exact formula/mechanism → small-number or real-case walkthrough → trade-off/boundary**); if it does not merit that depth here, delete it and defer it to a later chapter.
- **Zero self-coined "lore terms" or invented nicknames**: Never mint cutesy or metaphorical quoted aliases (e.g., `"The Packer"`, `"Filter Mask"`, `"Four-Piece Suit"`, `"Training Trilogy"`, `"Average Cat"`, or arbitrary invented demo labels). Stick strictly to **standard authoritative terminology** + **literal everyday prose**.
- **Zero naked concepts, printed output labels, or forward references**: Every new concept, acronym, code `print(...)` label, or symbol **must be explained right before or where it first appears**. Never use a term naked early and define it later; prose must read smoothly without clicking any popover.
- **Zero black-box magic numbers**: Every example score, metric, probability, price, or lab value must state **① who computed/measured it, ② how inputs produced it, ③ its scale and normal bounds**.
- **No doubled term markers**: Never repeat a word right before `{{term:Word|...}}`; write **~20–50 English words (or 25–90 CJK chars)** of genuine micro-lesson explanation inside every gloss.

### 2. Ban "Defensive Textbook Writing": Zero-Jump Derivations & Level-Matched Code
**What is "Defensive Textbook Writing"?** Afraid of appearing insufficiently rigorous, the author dumps advanced safeguards and formal caveats (`try/finally`, `clamp`, *"variational extremum"*, legal provisos, rare differentials) before the reader grasps the main path, then skips actual reasoning with *"rearranging gives / obviously / inevitably leads to."*

Enforce five iron rules across every discipline (see [Human Voice & Logic](./human-voice-and-logic.md) Section 5 for full cross-disciplinary examples):
1. **Minimal happy path first; guards and exceptions second**: Finish the baseline mechanism first, then ask *"What if something goes wrong halfway?"* to introduce `try/finally`, statutory provisos, differentials, or edge corrections naturally.
2. **Ban two-step causal leaps & hand-waving phrases**: Expand every `A → B → C`, voice the reader's silent objections, show the naive intuition failing first, and add 1-sentence recaps every 2–3 steps.
3. **Zero-jump formulas + small-number verification**: Explain the concept behind each `eq` first → `□` symbol-by-symbol unpack → write every key intermediate algebraic step (never consecutive `eq` blocks with a 1-line bridge) + hand-verify with 2–3 tiny numbers.
4. **Level-matched per-function code breakdown (Zero Black-Box APIs)**:
   - **Always read `learner_profile.json`'s `coding_level` first**:
   - When `coding_level` is `none` or `basic`, **every custom function and every non-trivial library API/method called in a code block** (e.g., `manual_seed`, `nn.Sequential`, `nn.Linear`, `nn.SiLU`, `optim.Adam`, `randn` vs. `rand`, `torch.full`, `torch.cat`, boolean mask `~mask`, `with torch.no_grad()`, `try/finally`) **must be explicitly explained in a grouped `□` breakdown** covering **① what it does, ② what its key arguments mean, ③ what value/shape it returns**, plus what breaks if a critical line is deleted or flipped. Never explain only 3 lines and leave 10 APIs mysterious!
   - When `coding_level` is `proficient`, skip basic syntax (`for`/`print`), but still explain domain/framework-specific APIs and hidden sign/convention traps.
5. **Counterfactual boundary checks (all disciplines)**: Explicitly verify where and why the result collapses if one term, code line, case fact, physiological assumption, or economic constraint is altered.

---

## 5. Four-Dimensional Coverage, Live Q&A & High-Depth Practical Quizzes

### 1. Four-Dimensional Section Coverage
Every core section addresses: **① Why** (real friction before it existed), **② What + Artifact + Diagram** (internal causality + hands-on artifact + static/animated visual), **③ Contrast & Trade-offs** (difference from confusable concepts, cost, failure boundaries), and **④ Reality Check** (real-world application & top pitfalls).

### 2. Four-Step Live Q&A Method (When Learner Asks "I Don't Get It")
1. **Hit causality in sentence 1 (never paraphrase/repeat the textbook)**: Switch immediately to tiny concrete numbers, a real counterexample, or what breaks without it;
2. **Ban vague hand-waving**: Never say *"sort of / handled under the hood / more elegant"*—name exactly which step turns what into what;
3. **10-second verification prompt**: Close with 1 ultra-light boundary check question;
4. **Fold key blind spots back**: Update `learner_profile.json` and patch `chN.json` if a foundational gap surfaced.

### 3. Practical, Deeply Grounded Quiz Standards (All Disciplines — Zero Passing-Mention Traps, Zero Shallow Rote Recall!)
1. **100% Deep Knowledge Grounding (Zero Passing-Mention Questions, Zero Untaught Acronyms)**:
   - Audit every concept, parameter, acronym, variable, and API across **`q`, all 4 `options`, `answer`, AND `explain`** against the exact section cited by `ref`;
   - **Never test a drive-by or postscript mention**: A concept merely name-dropped in 1–2 sentences without formula/mechanism/walkthrough (e.g., tacking `shift` or `use_dynamic_shifting` onto the final paragraph, or slipping an untaught acronym like `OOM` into `explain`) **MUST NOT** be tested! Either promote that concept into a full-depth subsection with formula + concrete numbers, or remove it from the quiz and defer it to the chapter that actually teaches it.
2. **Engineering Practice & Real-World Theoretical Depth (Ban Rote Definition Quizzes)**:
   - Ban shallow recall stems (*"Which of the following defines X?"*, *"List 3 differences between A and B"*);
   - **≥ 70% of single-choice and 100% of short-answer questions** must be **practical scenarios, fault diagnosis, quantitative calculations, counterfactual debugging, or real-world trade-off decisions**:
     - **CS / AI / Systems**: Given a real training anomaly, OOM crash, inverted-sign divergence, or architecture choice under business constraints, diagnose root cause, verify numerically, and fix;
     - **Math / Physics / Engineering**: Given a broken assumption or concrete boundary numbers, pinpoint where a derivation fails or compute the exact value/error;
     - **Economics / Finance / Accounting**: Given a concrete policy shock or statement change, calculate shortage/tax incidence/margins and explain downstream effects;
     - **Medicine / Biology / Psychology**: Given concrete patient vitals/labs or altered experimental controls, trace pathophysiology and prioritize fatal differentials;
     - **Law / History / Philosophy / Design**: Given a perturbed fact pattern, missing historical constraint, or altered UI feedback, deduce step-by-step why the holding or outcome flips.

---

## 6. Pre-Delivery Editorial Checklist (All Disciplines)

- [ ] **Smooth-Read Check**: Any podcast cliffhangers, > 1 em-dash per paragraph, > 36-char parenthetical nesting, inline code recitations, or name-dropped blog quotes?
- [ ] **Causal Zipper Check**: Does each section open by catching the previous section's open boundary? Any concept appearing without prior need?
- [ ] **Hands-On & Per-API Breakdown Check**: ≥ 2 real hands-on artifacts? Matched to `learner_profile.json`, is every non-trivial function/API called in code and every printed output label explained clearly?
- [ ] **Full-Depth-or-Omit & Zero-Coined-Terms Check**: Zero 1–2 sentence drive-by/postscript concept mentions? Zero self-coined quoted nicknames or playful aliases (only standard domain terms + literal everyday prose)?
- [ ] **Anti-Defensive & Concept-Budget Check**: ≤ 3 new core concepts per section? Zero naked acronyms, printed labels, or forward references? Zero skipped formula/causal leaps?
- [ ] **Deep Quiz Grounding & Depth Check**: Was every single concept, parameter, identifier, and acronym across `q`, `options`, `answer`, and `explain` taught in **full depth** inside its cited `ref` section (zero passing-mention traps or untaught acronyms)? Are ≥ 70% of MCQs and 100% of short-answers real engineering/domain diagnostic or quantitative problems?
