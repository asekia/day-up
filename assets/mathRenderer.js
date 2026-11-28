/* Day-Up zero-dependency brace-balanced LaTeX math renderer */
(function (root) {
  "use strict";

  const SYMBOL_MAP = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
    zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
    lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", omicron: "ο", pi: "π", varpi: "ϖ",
    rho: "ρ", varrho: "ϱ", sigma: "σ", varsigma: "ς", tau: "τ", upsilon: "υ",
    phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
    Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
    Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
    odot: "⊙", otimes: "⊗", oplus: "⊕", ominus: "⊖", oslash: "⊘",
    times: "×", div: "÷", cdot: "·", cdotp: "·", cdots: "⋯", ldots: "…",
    dots: "…", vdots: "⋮", ddots: "⋱", pm: "±", mp: "∓", ast: "∗", star: "⋆",
    circ: "∘", bullet: "•", cup: "∪", cap: "∩", sqcup: "⊔", sqcap: "⊓",
    setminus: "∖", wedge: "∧", vee: "∨", land: "∧", lor: "∨", neg: "¬", lnot: "¬",
    dagger: "†", ddagger: "‡", triangle: "△", bigtriangleup: "△", bigtriangledown: "▽",
    diamond: "⋄", wr: "≀", sum: "∑", prod: "∏", coprod: "∐", int: "∫", iint: "∬",
    iiint: "∭", oint: "∮", bigcup: "⋃", bigcap: "⋂", bigoplus: "⨁", bigotimes: "⨂",
    bigodot: "⨀", bigvee: "⋁", bigwedge: "⋀",
    le: "≤", leq: "≤", leqslant: "≤", ge: "≥", geq: "≥", geqslant: "≥",
    ne: "≠", neq: "≠", approx: "≈", sim: "∼", simeq: "≃", cong: "≅", equiv: "≡",
    propto: "∝", doteq: "≐", triangleq: "≜", ll: "≪", gg: "≫",
    prec: "≺", preceq: "⪯", succ: "≻", succeq: "⪰",
    in: "∈", notin: "∉", ni: "∋", subset: "⊂", subseteq: "⊆", supset: "⊃",
    supseteq: "⊇", nsubseteq: "⊈", mid: " | ", parallel: "∥", perp: "⊥",
    bot: "⊥", top: "⊤", vdash: "⊢", models: "⊨", bowtie: "⋈", asymp: "≍",
    to: "→", rightarrow: "→", longrightarrow: "⟶", leftarrow: "←",
    longleftarrow: "⟵", gets: "←", leftrightarrow: "↔", longleftrightarrow: "⟷",
    Rightarrow: "⇒", Longrightarrow: "⟹", implies: "⟹", Leftarrow: "⇐",
    Longleftarrow: "⟸", Leftrightarrow: "⇔", Longleftrightarrow: "⟺", iff: "⟺",
    mapsto: "↦", longmapsto: "⟼", uparrow: "↑", downarrow: "↓", updownarrow: "↕",
    Uparrow: "⇑", Downarrow: "⇓", nearrow: "↗", searrow: "↘", swarrow: "↙",
    nwarrow: "↖", hookrightarrow: "↪", hookleftarrow: "↩",
    forall: "∀", exists: "∃", nexists: "∄", emptyset: "∅", varnothing: "∅",
    infty: "∞", nabla: "∇", partial: "∂", ell: "ℓ", hbar: "ℏ", imath: "ı",
    jmath: "ȷ", aleph: "ℵ", Re: "ℜ", Im: "ℑ", wp: "℘", prime: "′", angle: "∠",
    degree: "°", therefore: "∴", because: "∵", square: "□", blacksquare: "■",
    checkmark: "✓", langle: "⟨", rangle: "⟩", lfloor: "⌊", rfloor: "⌋",
    lceil: "⌈", rceil: "⌉", Vert: "‖", lVert: "‖", rVert: "‖", lvert: "|",
    rvert: "|", vert: "|", backslash: "\\",
    quad: "\u2001", qquad: "\u2001\u2001", enspace: "\u2002", thinspace: "\u2009",
    medspace: "\u2005", thickspace: "\u2004", space: " ",
    displaystyle: "", textstyle: "", scriptstyle: "", scriptscriptstyle: "",
    limits: "", nolimits: "", big: "", Big: "", bigg: "", Bigg: "",
    bigl: "", bigr: "", Bigl: "", Bigr: "", biggl: "", biggr: "",
    Biggl: "", Biggr: "", bigm: "", Bigm: "", middle: "", notag: "", nonumber: "",
  };

  const OPERATOR_SET = new Set([
    "sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan",
    "sinh", "cosh", "tanh", "coth", "log", "ln", "lg", "exp", "max", "min",
    "sup", "inf", "lim", "limsup", "liminf", "arg", "argmax", "argmin",
    "det", "dim", "ker", "deg", "gcd", "hom", "Pr", "softmax", "sigmoid",
    "ReLU", "GELU", "SiLU", "KL", "MSE", "CE", "Var", "Cov", "Std", "diag",
    "tr", "rank", "sign", "clip", "clamp", "stopgrad", "sg", "Concat",
    "Attention", "LayerNorm", "RMSNorm", "AdaLN", "MLP", "FFN",
  ]);

  const BLACKBOARD_MAP = {
    A: "𝔸", B: "𝔹", C: "ℂ", D: "𝔻", E: "𝔼", F: "𝔽", G: "𝔾", H: "ℍ", I: "𝕀",
    J: "𝕁", K: "𝕂", L: "𝕃", M: "𝕄", N: "ℕ", O: "𝕆", P: "ℙ", Q: "ℚ", R: "ℝ",
    S: "𝕊", T: "𝕋", U: "𝕌", V: "𝕍", W: "𝕎", X: "𝕏", Y: "𝕐", Z: "ℤ",
    "0": "𝟘", "1": "𝟙",
  };

  const CALLIGRAPHIC_MAP = {
    A: "𝒜", B: "ℬ", C: "𝒞", D: "𝒟", E: "ℰ", F: "ℱ", G: "𝒢", H: "ℋ", I: "ℐ",
    J: "𝒥", K: "𝒦", L: "ℒ", M: "ℳ", N: "𝒩", O: "𝒪", P: "𝒫", Q: "𝒬", R: "ℛ",
    S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱", W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵",
  };

  const FONT_CLASS_MAP = {
    mathrm: "math-op", text: "math-op", textrm: "math-op", textup: "math-op",
    operatorname: "math-op", mathbf: "math-bold", boldsymbol: "math-bold",
    bm: "math-bold", textbf: "math-bold", mathit: "math-var", textit: "math-var",
    texttt: "math-tt", mathtt: "math-tt", mathsf: "math-sf", textsf: "math-sf",
  };

  const ACCENT_MAP = {
    hat: "^", widehat: "^", tilde: "~", widetilde: "~",
    vec: "→", dot: "˙", ddot: "¨",
  };

  const BAR_CLASS_MAP = {
    bar: "math-overline", overline: "math-overline", underline: "math-underline",
  };

  const ESC_CHAR_MAP = {
    ",": "\u2009", ";": "\u2004", ":": "\u2005", "!": "", " ": " ",
    "{": "{", "}": "}", "|": "‖", "%": "%", "_": "_", "&": "&", "#": "#", "$": "$",
  };

  const ENV_DELIMS = {
    cases: ["{", "", "math-cases"],
    bmatrix: ["[", "]", "math-matrix"],
    pmatrix: ["(", ")", "math-matrix"],
    vmatrix: ["|", "|", "math-matrix"],
    Vmatrix: ["‖", "‖", "math-matrix"],
    Bmatrix: ["{", "}", "math-matrix"],
    matrix: ["", "", "math-matrix"],
    aligned: ["", "", "math-aligned"],
    align: ["", "", "math-aligned"],
    "align*": ["", "", "math-aligned"],
    gathered: ["", "", "math-aligned"],
  };

  const SKIP_ONE_ARG = new Set(["hspace", "vspace", "phantom", "hphantom", "vphantom", "color"]);

  function escHtmlMath(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function unescHtmlMath(str) {
    return String(str)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  function skipWs(src, pos) {
    while (pos < src.length && /\s/.test(src[pos])) pos += 1;
    return pos;
  }

  function readBraced(src, pos) {
    let depth = 0;
    let i = pos;
    while (i < src.length) {
      if (src[i] === "\\" && i + 1 < src.length) { i += 2; continue; }
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") {
        depth -= 1;
        if (depth === 0) return [src.slice(pos + 1, i), i + 1];
      }
      i += 1;
    }
    return [src.slice(pos + 1), src.length];
  }

  function readGroup(src, pos) {
    const p = skipWs(src, pos);
    if (p >= src.length) return ["", p];
    if (src[p] === "{") return readBraced(src, p);
    if (src[p] === "\\") {
      const m = src.slice(p).match(/^\\(?:[A-Za-z]+|.)/);
      const tok = m ? m[0] : "\\";
      return [tok, p + tok.length];
    }
    return [src[p], p + 1];
  }

  function readOptBracket(src, pos) {
    const p = skipWs(src, pos);
    if (src[p] !== "[") return [null, pos];
    const end = src.indexOf("]", p + 1);
    return end === -1 ? [null, pos] : [src.slice(p + 1, end), end + 1];
  }

  function mapCharset(raw, table) {
    return Array.from(raw).map((ch) => table[ch] || escHtmlMath(ch)).join("");
  }

  function renderFrac(src, pos) {
    const [num, p1] = readGroup(src, pos);
    const [den, p2] = readGroup(src, p1);
    const html = `<span class="math-frac"><span class="math-frac-num">${renderMathNodes(num)}</span><span class="math-frac-den">${renderMathNodes(den)}</span></span>`;
    return [html, p2];
  }

  function renderBinom(src, pos) {
    const [top, p1] = readGroup(src, pos);
    const [bot, p2] = readGroup(src, p1);
    const html = `<span class="math-binom">(<span class="math-binom-stack"><span>${renderMathNodes(top)}</span><span>${renderMathNodes(bot)}</span></span>)</span>`;
    return [html, p2];
  }

  function renderSqrt(src, pos) {
    const [idx, p1] = readOptBracket(src, pos);
    const [body, p2] = readGroup(src, p1);
    const sup = idx ? `<sup class="math-root-idx">${renderMathNodes(idx)}</sup>` : "";
    return [`<span class="math-sqrt">${sup}<span class="math-rad">√</span><span class="math-radicand">${renderMathNodes(body)}</span></span>`, p2];
  }

  function renderAccent(sym, src, pos) {
    const [body, p1] = readGroup(src, pos);
    const inner = renderMathNodes(body);
    return [`<span class="math-accent"><span class="math-accent-mark">${sym}</span><span>${inner}</span></span>`, p1];
  }

  function renderEnvRows(body, cls) {
    const rows = body.trim().split(/\\\\/).filter((r) => r.trim() !== "");
    const htmlRows = rows.map((row) => {
      const cells = row.split("&").map((c) => `<td>${renderMathNodes(c.trim())}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<table class="${cls}"><tbody>${htmlRows}</tbody></table>`;
  }

  function renderEnvironment(src, pos) {
    const [envName, p1] = readGroup(src, pos);
    const endTag = `\\end{${envName}}`;
    const endIdx = src.indexOf(endTag, p1);
    if (endIdx === -1) return ["", p1];
    const [ld, rd, cls] = ENV_DELIMS[envName] || ["", "", "math-matrix"];
    const table = renderEnvRows(src.slice(p1, endIdx), cls);
    const leftHtml = ld ? `<span class="math-delim">${ld}</span>` : "";
    const rightHtml = rd ? `<span class="math-delim">${rd}</span>` : "";
    return [`<span class="math-env">${leftHtml}${table}${rightHtml}</span>`, endIdx + endTag.length];
  }

  function renderSizedDelim(src, pos) {
    const p = skipWs(src, pos);
    if (src[p] === ".") return ["", p + 1];
    return ["", pos];
  }

  function renderFontMacro(cmd, src, pos) {
    const p0 = cmd === "operatorname" && src[pos] === "*" ? pos + 1 : pos;
    const [body, p1] = readGroup(src, p0);
    const isPlain = cmd === "text" || cmd === "textrm" || cmd === "textup";
    const inner = isPlain ? escHtmlMath(body.replace(/\\([_%&#$])/g, "$1")) : renderMathNodes(body);
    return [`<span class="${FONT_CLASS_MAP[cmd]}">${inner}</span>`, p1];
  }

  function renderStack(cls, src, pos) {
    const [top, p1] = readGroup(src, pos);
    const [base, p2] = readGroup(src, p1);
    return [`<span class="${cls}"><span class="math-stack-sub">${renderMathNodes(top)}</span><span>${renderMathNodes(base)}</span></span>`, p2];
  }

  function renderBlackboard(table) {
    return (src, pos) => {
      const [body, p1] = readGroup(src, pos);
      return [mapCharset(body, table), p1];
    };
  }

  function renderTextColor(src, pos) {
    const [, p1] = readGroup(src, pos);
    const [body, p2] = readGroup(src, p1);
    return [renderMathNodes(body), p2];
  }

  function renderSubstack(src, pos) {
    const [body, p1] = readGroup(src, pos);
    return [renderEnvRows(body, "math-aligned"), p1];
  }

  const SPECIAL_HANDLERS = {
    frac: renderFrac, tfrac: renderFrac, dfrac: renderFrac, cfrac: renderFrac,
    binom: renderBinom, tbinom: renderBinom, dbinom: renderBinom,
    sqrt: renderSqrt, begin: renderEnvironment,
    left: renderSizedDelim, right: renderSizedDelim,
    mathbb: renderBlackboard(BLACKBOARD_MAP),
    mathcal: renderBlackboard(CALLIGRAPHIC_MAP),
    textcolor: renderTextColor, substack: renderSubstack,
    overset: (s, p) => renderStack("math-overset", s, p),
    underset: (s, p) => renderStack("math-underset", s, p),
  };

  function renderCommand(cmd, src, pos) {
    if (SPECIAL_HANDLERS[cmd]) return SPECIAL_HANDLERS[cmd](src, pos);
    if (FONT_CLASS_MAP[cmd]) return renderFontMacro(cmd, src, pos);
    if (ACCENT_MAP[cmd]) return renderAccent(ACCENT_MAP[cmd], src, pos);
    if (BAR_CLASS_MAP[cmd]) {
      const [body, p1] = readGroup(src, pos);
      return [`<span class="${BAR_CLASS_MAP[cmd]}">${renderMathNodes(body)}</span>`, p1];
    }
    if (SKIP_ONE_ARG.has(cmd)) return ["", readGroup(src, pos)[1]];
    if (OPERATOR_SET.has(cmd)) return [`<span class="math-op">${cmd}</span>`, pos];
    if (cmd in SYMBOL_MAP) return [SYMBOL_MAP[cmd], pos];
    return [escHtmlMath(`\\${cmd}`), pos];
  }

  function renderBackslash(src, pos) {
    if (src[pos + 1] === "\\") return ["<br>", pos + 2];
    const m = src.slice(pos + 1).match(/^[A-Za-z]+/);
    if (m) return renderCommand(m[0], src, pos + 1 + m[0].length);
    const ch = src[pos + 1] || "";
    if (ch in ESC_CHAR_MAP) return [ESC_CHAR_MAP[ch], pos + 2];
    return [escHtmlMath(ch), pos + 2];
  }

  function renderScript(tag, src, pos) {
    const [body, nextPos] = readGroup(src, pos);
    return [`<${tag}>${renderMathNodes(body)}</${tag}>`, nextPos];
  }

  function renderMathToken(src, i) {
    const ch = src[i];
    if (ch === "\\") return renderBackslash(src, i);
    if (ch === "_" || ch === "^") return renderScript(ch === "_" ? "sub" : "sup", src, i + 1);
    if (ch === "{") { const [body, n] = readBraced(src, i); return [renderMathNodes(body), n]; }
    if (ch === "}") return ["", i + 1];
    if (ch === "~") return ["∼", i + 1];
    if (ch === "-" && src[i - 1] === " " && src[i + 1] === " ") return ["−", i + 1];
    return [escHtmlMath(ch), i + 1];
  }

  function renderMathNodes(src) {
    let out = "";
    let i = 0;
    while (i < src.length) {
      const [html, next] = renderMathToken(src, i);
      out += html;
      i = next;
    }
    return out;
  }

  function renderMath(raw, alreadyEscaped) {
    const input = raw == null ? "" : String(raw);
    return renderMathNodes(alreadyEscaped ? unescHtmlMath(input) : input);
  }

  root.dayUpRenderMath = renderMath;
  root.DAYUP_MATH_COMMANDS = {
    symbols: Object.keys(SYMBOL_MAP),
    operators: Array.from(OPERATOR_SET),
    fonts: Object.keys(FONT_CLASS_MAP),
    accents: Object.keys(ACCENT_MAP).concat(Object.keys(BAR_CLASS_MAP)),
    envs: Object.keys(ENV_DELIMS),
    special: Object.keys(SPECIAL_HANDLERS).concat(["end", "hspace", "vspace", "phantom", "hphantom", "vphantom", "color"]),
  };
})(typeof window !== "undefined" ? window : globalThis);
