# Plain Human Voice, Step-by-Step Reasoning, Anti-Defensive Writing & Concept Budget

> Note for the Agent running `day-up`: **Merely telling yourself "write clearly and logically" does nothing.** AI defaults to writing like a dry encyclopedia—starting with broad definitions, piling up abstract nouns, and jumping across disconnected sections. Before drafting any chapter, follow this exact operational playbook: **① Chapter Causal Spine → ② Situation-Process-Name 3-Step Method → ③ Actor-Action-Visible-Change Grammar → ④ 5-Step Cross-Disciplinary Progressive Derivation → ⑤ Concept Budget & Concept Ledger**.

---

## 1. Fix Disjointed Logic: Write a "Chapter Causal Spine" Before Touching JSON

**Never write `chN.json` cold from top to bottom!** Doing so produces isolated encyclopedia entries stitched together.

Before generating chapter prose, outline every section as an interlocking zipper:

```text
Chapter N Causal Spine (each section answers 3 continuity questions):
- §N.1 [Title]
  · Concrete friction: What real situation or puzzle does the reader see first? (Never start with a definition)
  · Core resolution: Which single mechanism + hands-on artifact solves it?
  · Open tail for next section: Under what new condition does this approach break down?
- §N.2 [Title]
  · Pick up previous tail: How do the first 1–2 sentences connect directly to §N.1's open problem?
  · Core resolution: ...
  · Open tail for next section: ...
```

**Hard checks**:
1. If swapping any two sections still reads coherently, they are parallel list items rather than a causal chain—rework the outline;
2. Every section after Section 1 **must explicitly pick up the problem or boundary left at the end of the prior section** in its first two sentences. Ban abrupt transitions like `"Next we introduce X"` or `"In this section we discuss Y"`.

---

## 2. Fix Poor Situation Framing: Situation → Chronological Process → Name Last

AI's worst storytelling habit is **dropping conclusions and abstract labels up front** (e.g., *"Rent control causes resource misallocation"* or *"KL divergence prevents policy drift"*) before the reader knows what actually happened.

Always walk through any phenomenon, mechanism, or case in chronological causal order:
1. **Step 1 · Set the concrete scene (who, where, with what numbers/constraints, trying to do what)** in 2–3 crisp sentences.
2. **Step 2 · Walk through the chain of events (`who moves first → what changes → how others react → where it breaks`)** without skipping a link—each sentence's outcome is the next sentence's cause.
3. **Step 3 · Name the concept or formula last**: Only introduce the formal name once the reader is already thinking *"Oh, no wonder that happens!"*

---

## 3. Fix Robotic AI Voice: Actor–Action–Visible-Change Grammar

Robotic prose isn't caused by advanced vocabulary—it's caused by **missing concrete subjects, missing verbs, and abstract nouns spinning in empty air**. Check every sentence against three rules:

1. **Give sentences a concrete actor + active verb + visible result**:
   - ❌ Zombie sentence: *"By performing dense vector representation mapping on input queries, high-dimensional semantic similarity measurement is achieved, thereby enhancing retrieval recall."*
   - ✅ Human sentence: *"A user searches 'how to refund a ticket,' while the help doc is titled 'Voiding and Reissuing Payment Vouchers.' They share zero words, so keyword search returns nothing. Instead, the system converts each sentence into a list of coordinates; when two coordinate lists point in nearly the same direction, search pulls up that doc anyway."*
2. **Ban robotic filler words and nominalizations**:
   - **Blacklist**: `leverages... to facilitate`, `serves as a core paradigm/carrier`, `aims to optimize`, `inherently exhibits the characteristic of`, `empower`, `holistic dimension`, `it is worth noting that`, `needless to say` (and their bureaucratic equivalents in whatever language the textbook is authored in).
   - **Direct fix**: Replace *"perform computation"* with *"compute"*; *"achieve filtering"* with *"filter out"*; *"exhibits lag characteristics"* with *"takes three months to show up."*
3. **Maintain book-like rhythm**:
   - Short, clear sentences; 2–4 sentences per paragraph; **at most 1 em-dash (`—` / `——`) per paragraph**; never stuff multi-clause essays inside parentheses.

---

## 4. Cross-Disciplinary Paragraph Rewrites (Robotic AI vs. Classic Print Book)

### Example 1 · Computer Science / AI (Why Vector Search Exists)
- **❌ Robotic AI**: *"In modern RAG (Retrieval-Augmented Generation, a technical paradigm augmenting model context via external knowledge bases) systems, traditional keyword retrieval (e.g., BM25) aims to match exact lexical frequency—exhibiting an inherent limitation in capturing deep semantics—thereby reducing recall whenever queries and documents differ lexically."*
- **✅ Classic Print Book**: *"Suppose you search your company wiki for 'how to fix a wrong expense claim.' There is a handbook covering this exact issue, titled *Voiding and Reissuing Accounting Vouchers*. Keyword matching finds almost zero shared words and returns empty-handed—not because the doc is missing, but because keyword search only compares spelling, not meaning. To bridge that gap, we turn each passage into a fixed-length list of numbers called an **Embedding**. Passages with similar meaning point in similar directions, so measuring the angle between them (cosine similarity) ranks that handbook first even with zero overlapping words. Let's verify this in 12 lines of NumPy:"*

### Example 2 · Economics (Why Rent Ceilings Make Renting Harder)
- **❌ Robotic AI**: *"Price ceilings, as a classic policy instrument intervening in market equilibrium, aim to safeguard low-income welfare. However, according to supply-demand theory, setting a legal maximum below market-clearing equilibrium inevitably triggers structural imbalance, deadweight loss, black markets, and housing quality deterioration."*
- **✅ Classic Print Book**: *"Picture 100 studio apartments near a university. At \$1,000/month, 100 students want one and 100 landlords offer one—nobody waits, nothing sits empty. Now a law caps rent at \$650. Both sides recalculate immediately: students who previously shared rooms jump in, pushing demand from 100 to 160; meanwhile 40 landlords do the math, see \$650 won't cover maintenance and mortgage, and convert units to storage or personal use, shrinking supply to 60. Now 160 renters chase 60 apartments—a 100-unit shortage. Rent is cheaper on paper, yet most students cannot find a room, and landlords stop fixing leaky pipes because dozens of renters are waiting in line. Economists call a cap set below equilibrium a **Binding Price Ceiling**."*

### Example 3 · Medicine (Why Heart Attack Patients Feel Left Shoulder Pain)
- **❌ Robotic AI**: *"Referred pain is a common clinical visceral pain transmission phenomenon wherein myocardial ischemia transmits nociceptive signals via sympathetic afferents to corresponding spinal segments, converging with somatic sensory neurons to cause cortical localization bias manifesting in the left shoulder."*
- **✅ Classic Print Book**: *"A 58-year-old man walks into the ER clutching his left shoulder and inner arm, sweating cold, insisting his 'frozen shoulder flared up.' If the clinician only orders a shoulder X-ray and hands out pain patches, the patient could die within thirty minutes—his shoulder is fine; his coronary artery is blocked. Why does a starving heart hurt in the shoulder? Because pain nerves from the heart and pain nerves from the left shoulder skin enter the spinal cord (segments T1–T4) and plug into **the exact same relay neurons heading to the brain**. Your shoulder gets bumped every day, so the brain assumes alerts on that shared wire belong to the shoulder. When oxygen-starved heart muscle suddenly fires down that same wire, the brain misreads the return address. Clinicians call this **Referred Pain**."*

### Example 4 · Law (Why a Casual Favor Isn't an Enforceable Contract)
- **❌ Robotic AI**: *"Under contract law, declarations of intent distinguish legal acts from social favors. Because social favors lack intent to create legal relations, they do not form valid contracts or generate breach-of-contract damages claims."*
- **✅ Classic Print Book**: *"On Friday night, Alex tells coworker Sam, 'I'll drive you to the airport at 7 a.m. tomorrow—it's on my way.' Next morning Alex oversleeps. Sam catches a late taxi, misses the flight, and pays \$300 to rebook. Can Sam sue Alex for \$300 in breach of contract? At first glance, Alex broke a promise. Think one step further: Alex asked for nothing in return and only offered a friendly favor—never intending to take on hundreds of dollars of legal liability for oversleeping. If courts enforced every dinner invite or casual ride as a lawsuit, nobody would help a friend again. So civil law draws a firm line: did both parties show **intent to be legally bound**? Friendly favors fall outside contract law. Now **flip one fact**: if Sam prepaid \$25 for gas and agreed on a paid punctual pickup, the favor becomes a paid transport contract—and Alex can no longer walk away from that \$300 loss."*

---

## 5. Cross-Disciplinary "5-Step Progressive Derivation" & Banning Defensive Writing (All Fields!)

> Why do many textbooks still feel like jumping off cliffs even when using plain words? Because of **Defensive Writing**: afraid of looking "unrigorous," the author stuffs every exception, legal proviso, error handler (`try/finally`), and final theorem into a single compressed sentence before the reader even understands the normal path—then hides the actual reasoning behind *"obviously follows / by rearrangement / inevitably leads to."*
> Great cross-disciplinary classics—**Griffiths (Physics), Strang (Math), Mankiw (Economics), Pathoma (Medicine), Wang Zejian (Law), Fei Xiaotong (Sociology)**—all share five universal rules:

### 1. Five Universal Rules of Progressive Human Derivation
1. **Run the minimal happy path first; defer guards & exceptions**:
   - Strip away noise into a minimal model (Mankiw's one-person island, Griffiths's point charge, Pathoma's single-organ hydraulics, Law's clean baseline facts, Coding's core logic without exception scaffolding);
   - **Never mix `try/finally`, statutory provisos, rare differentials, or edge caveats into pass one.** Walk the normal path to completion first, then ask *"What if something fails halfway?"*—introducing the guard right when the reader feels the need for it.
2. **Low-step causality (ban `A → C` leaps across two links)**:
   - Always expand `A → B → C`. Ban lazy hand-waving phrases in every discipline (`easily seen`, `obviously follows`, `similarly proven`, `inevitably causes`, `naturally triggers`, `needless to say`, `by simple rearrangement`, `self-evident`, and their equivalents in any target language).
3. **Show the naive intuition hitting a wall before revealing the real step**:
   - Follow the reader's first natural guess, let them watch it break on a concrete example, and then introduce the true formula, rule, or design as the natural rescue.
4. **Voice the reader's silent objection at the exact moment it arises**:
   - Pause at turning points with genuine Socratic dialogue: *"Hearing this, you might ask: wait—if that's true, wouldn't...?"*
5. **Pause to recap every 2–3 steps + verify on tiny concrete data**:
   - Clear working memory (*"So far we've solved X; only one piece Y remains"*), then plug in 2–3 tiny numbers, one patient's labs, or one concrete case to verify end-to-end.

### 2. Cross-Disciplinary "Defensive Leap vs. Progressive Derivation" Contrasts
- **Medicine (Pathoma style — Why Left Heart Failure Causes Shortness of Breath)**:
  - ❌ *"Left ventricular systolic dysfunction reduces cardiac output and causes pulmonary venous congestion, inevitably leading to exertional dyspnea and pink frothy sputum (differentiate from asthma; note HFpEF preserves ejection fraction)."*
  - ✅ Walk the two-pump hydraulic chain: weak left ventricle leaves blood behind → upstream pulmonary veins back up → capillary hydrostatic pressure rises → fluid is physically pushed across thin walls into dry air sacs (alveoli) → oxygen crosses waterlogged sacs slowly → patient gasps when climbing stairs. Defer asthma differentiation until physical exam signs are introduced.
- **Economics (Mankiw style — Why Rate Hikes Cool Investment)**:
  - ❌ *"Under monetary transmission (excluding liquidity traps and non-rational expectations), higher policy rates inevitably raise financing costs and contract fixed investment."*
  - ✅ Do concrete math for one shoe-factory owner: a \$10M line earns \$450k/year (4.5% return). At 3% interest (\$300k), net profit is +\$150k → borrow and build. At 5% interest (\$500k), building loses \$50k/year → shelve the plan. Millions of owners and homebuyers pause simultaneously → aggregate demand cools. Only then ask: *"What if nobody borrows even at 0%?"* to bridge to the next section on liquidity traps.
- **Law (Apparent Authority — Fired Buyer Using Company Seal)**:
  - ❌ *"Although the former employee lacked actual authority, holding the genuine seal establishes apparent authority (except where the counterparty acted in bad faith or gross negligence), binding the company."*
  - ✅ Start with naive intuition (*"He was fired—why should the company pay?"*) → show the wall from the innocent supplier's view (verified genuine seal; forcing every buyer to audit HR records would paralyze commerce) → establish the baseline rule (the company failed to safeguard its seal, so it honors the deal and chases the rogue employee) → only at the end voice the objection (*"What if the supplier knew he was fired and colluded?"*) to introduce the good-faith guardrail.
- **Physics / Math (Griffiths / Strang style)**:
  - ❌ *"Taking the variational extremum under normalization yields the closed-form solution; taking logs and rearranging gives the implicit reward."*
  - ✅ Write the probability-sum-to-1 constraint → combine via undetermined multiplier → differentiate with respect to a single `π(y|x)` and set to 0 → isolate `log(π/π_ref)` → exponentiate and normalize → plug in 2 concrete candidate scores and verify `[0.881, 0.119]` sums to 1 and round-trips back to the original rewards.
- **History / Sociology (Micro-to-Macro)**:
  - ❌ *"Agrarian sedentism and kinship lineages inevitably generate a differential mode of association with elastic moral boundaries."*
  - ✅ Follow one farming household needing help at harvest or a wedding: brothers first, then multi-generation neighbors, then distant kin → picture ripples spreading outward from a stone dropped in water (thickest near center, thinnest outside) → contrast with Western "bundles of firewood" (crisp group boundaries) → now name *differential mode of association*.

---

## 6. Eliminate Random Unexplained Concepts: Concept Budget + Concept Ledger

> Exhausting textbooks usually suffer not from "too much depth," but from **casual name-dropping**: dropping 6–8 unfamiliar terms per section, defining half and leaving the rest naked, or using a term in Section 2 and defining it in Section 3.

### 1. Concept Budget (Hard Cap: ≤ 3 New Core Concepts per Section)
- Give each `h3` section a budget of **2–3 lead concepts** (never more than 4).
- For every side term that is NOT a lead concept of this section (whether a domain compound phrase, technical jargon like `logits / sigmoid / on-policy / placebo`, a printed output label like `Left cluster mean`, or a symbol like `η`), apply the **3-Way Diet**:
  1. **First choice — Delete the jargon and describe the action in plain words** (e.g., instead of dropping *"Lagrange multiplier"* naked, write *"multiply the 'probabilities sum to 1' rule by an undetermined coefficient `λ` and add it into the objective"*);
  2. **Second choice — Defer it to the chapter where it belongs** (don't tease 7 variants or Chapter 8 terms in Chapter 1);
  3. **If unavoidable — Explain it inline in one plain sentence on first sight**, never leaving it naked.

### 2. Book-Wide Concept Ledger (Zero Naked Terms, Zero Forward References)
- Track two lists while outlining: **Already-Taught Whitelist** vs. **New Lead Concepts This Section (≤ 3)**.
- **Post-draft highlighter audit**: Read from first word to last as a zero-background learner. Circle every technical noun (Chinese or English), every acronym, every symbol, and every label printed by code (`print(...)`). If it wasn't already taught earlier, either **cut it into plain language** or **explain it right on first appearance**. **Never use a concept naked in an earlier section and define it later.**
