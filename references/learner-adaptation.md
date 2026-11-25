# Learner Profiling & Dynamic Adaptation Protocol

> Ensures the Agent **profiles the learner before drafting the book** and **dynamically adjusts depth, code unpacking, and pacing between chapters** based on real mastery data—never wasting an expert's time on basics, and never burying a beginner in unexplained jargon or black-box code.

---

## 1. Brief Pre-Course Profiling (Mandatory, ≤ 3 Concise Questions)

When receiving a learning request, **do not immediately generate a full chapter**. Unless the user already stated their background, ask ≤ 3 brief questions (prefer multiple-choice `ask_question`; skip dimensions already stated):

1. **Current familiarity with the topic**
   - Complete beginner—start from scratch
   - Heard the concepts / general intuition, but haven't connected the system or practiced hands-on
   - Already using it in practice—want deeper mechanisms, edge cases, and production pitfalls
2. **Coding / hands-on & quantitative comfort** (adapt to the discipline: coding/math for CS/AI; spreadsheets/cases/statutes for finance/law/medicine)
   - Little or no coding (favor intuition, diagrams, and guided minimal walkthroughs)
   - Basic scripting (e.g., Python/JS—can follow and run 20–50 line scripts if APIs are clearly explained)
   - Proficient engineer (ready for production source paths, config diffs, and performance tuning)
3. **Primary learning goal**
   - Get hands-on quickly (practical steps and high-frequency pitfalls)
   - Master underlying principles (derivations, contrasts, and system-wide architecture)
   - Learn around a concrete project, role, or problem at hand

Persist the profile to `~/.day-up/library/<book-slug>/learner_profile.json` so every subsequent chapter reads and updates it:

```json
{
  "topic": "Course subject",
  "domain_level": "beginner | intermediate | advanced",
  "coding_level": "none | basic | proficient",
  "math_comfort": "low | medium | high",
  "goal": "hands_on | deep_understanding | project_driven",
  "preferred_language": "python",
  "skip_topics": ["Prerequisites the learner already mastered"],
  "adaptation_log": [
    { "after_chapter": 1, "signal": "quiz 50%, 1 doubt", "action": "Slow down, unpack every API call, add step-by-step small-number walkthroughs" }
  ]
}
```

---

## 2. Adaptation Matrix (Match Prose, Code Breakdown, Diagrams & Quizzes to Profile)

| Dimension | Zero / Non-Coding Background | Basic Scripting / Intermediate | Proficient / Production Engineer |
|---|---|---|---|
| **Entry Point** | Everyday concrete scenes, zero assumed jargon | Practical dev/business scenarios, skip known basics | Engineering bottlenecks, failure logs, and postmortems |
| **Code & API Breakdown** | Minimal 5–15 line runnable scripts (or zero code for non-CS); **explain every single function, library API, and parameter in plain language with input/output shapes** | 15–35 line minimal runnable scripts + real outputs; **never cherry-pick 3 lines—explain EVERY custom function and EVERY newly appearing library API/method (`nn.Linear`, `optim.Adam`, `randn` vs. `rand`, `torch.full`, boolean masks) with purpose, arguments, and return shape** | Production core implementations, source-level key paths, and benchmarks; skip basic syntax, but still explain domain-framework APIs and subtle sign/convention traps |
| **Formulas & Theory** | Core intuitive relations with plain-language translation and tiny hand-worked numbers | Full key derivations with tiny hand-verifiable numerical checks (e.g., 2–5 element cases) | Rigorous propositions/derivations focusing on hidden assumptions and failure boundaries |
| **Visuals** | Clean `side_figure` concept/relationship diagrams and step animations | Architecture diagrams + request/data-flow animated diagrams | Trade-off matrices, state machines, and interactive curve explorers |
| **Quiz Depth** | **Ban rote definition quizzes!** Everyday diagnostic mini-scenarios, tiny hand calculations, and "what breaks if we change step X?" (100% grounded in prose) | **Engineering & real-world practice**: debugging broken/omitted code lines, output diagnosis, design trade-offs, and quantitative checks (100% grounded in prose) | **Deep-water practical diagnostics**: production root-cause analysis, multi-constraint trade-offs, counterexamples, and boundary failures (100% grounded in prose) |

---

## 3. Chapter-to-Chapter Dynamic Adaptation (Driven by `progress.json`)

Before authoring Chapter `N+1`, read `<book_dir>/progress.json` to run a quick diagnostic and update `learner_profile.json`:

1. **Signal 1: Struggling (`quiz < 60%` or `≥ 2` doubt notes)**
   - Resolve every stuck point with fresh plain-language examples before unlocking the next chapter;
   - Record in `adaptation_log`: slow down next chapter (smaller sections, shorter code blocks, finer per-API breakdown, extra transition diagrams).
2. **Signal 2: Mastering effortlessly (all sections `✓ Mastered`, `quiz ≥ 90%`, or user says "too easy")**
   - Record in `adaptation_log`: speed up and deepen next chapter (trim intro scaffolding, raise engineering density, add real edge-case failures).
3. **Signal 3: Explicit user preference shift (e.g., "more code / fewer equations")**
   - Update `learner_profile.json` immediately and confirm the adjusted balance in one sentence before drafting the next chapter.
