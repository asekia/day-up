/* ============================================================================
 * 交互式教材课件声明式渲染引擎（Z-Lib LITERA 图书格式 × 清华社教材排版）
 * 支持：整本连贯书卷阅读（Scroll） + 仿真书页翻页（Paged）双模式
 * 零外部依赖 · 自动编号与交叉引用 · 自动术语索引 · 可交互习题 · 通用模拟器 · AI 工作室
 * ============================================================================ */
(function () {
  "use strict";

  const UI_PREFS_KEY = "dayup_ui_prefs_v1";
  const BOOK_STATE_KEY = "dayup_book_state_v1:" + (location.pathname || "local");
  const UI_PREF_FIELDS = new Set(["mode", "fontSize", "theme", "sidebarCollapsed", "agentOpen"]);
  const PAGE_GAP = 72;

  function getBookApiBase() {
    const m = (location.pathname || "").match(/^(\/books\/[^/]+)(?:\/|$)/);
    return m ? m[1] : "";
  }

  function apiUrl(suffix) {
    return getBookApiBase() + suffix;
  }

  /* ======================== 基础工具 ======================== */
  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripLeadingSecNum(text) {
    return String(text || "")
      .replace(/^\s*\d+(?:\.\d+)*\s*[、.．:：\s]+/, "")
      .trim();
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadPrefs() {
    let ui = {};
    let book = {};
    try {
      const rawUi = localStorage.getItem(UI_PREFS_KEY);
      if (rawUi) ui = JSON.parse(rawUi) || {};
      const rawBook = localStorage.getItem(BOOK_STATE_KEY);
      if (rawBook) book = JSON.parse(rawBook) || {};
      // 兼容旧版单书本地缓存（仅当非多书 /books/ 路径且无新缓存时迁移）
      if (!rawBook && !getBookApiBase()) {
        const legacy = localStorage.getItem("courseware_reader_state_v2");
        if (legacy) book = JSON.parse(legacy) || {};
      }
    } catch (_) {
      /* 隐私模式降级 */
    }
    return Object.assign({}, ui, book);
  }

  function savePrefs(patch) {
    if (!patch || typeof patch !== "object") return;
    try {
      const uiPatch = {};
      const bookPatch = {};
      Object.keys(patch).forEach((k) => {
        if (UI_PREF_FIELDS.has(k)) uiPatch[k] = patch[k];
        else bookPatch[k] = patch[k];
      });
      if (Object.keys(uiPatch).length) {
        const curUi = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || "{}");
        localStorage.setItem(UI_PREFS_KEY, JSON.stringify(Object.assign({}, curUi, uiPatch)));
      }
      if (Object.keys(bookPatch).length) {
        const curBook = JSON.parse(localStorage.getItem(BOOK_STATE_KEY) || "{}");
        localStorage.setItem(BOOK_STATE_KEY, JSON.stringify(Object.assign({}, curBook, bookPatch)));
      }
    } catch (_) {
      /* 隐私模式降级 */
    }
  }

  function showToast(msg) {
    const el = document.getElementById("cw-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(okMsg || "已复制到剪贴板"),
        () => fallbackCopy(text, okMsg)
      );
    } else {
      fallbackCopy(text, okMsg);
    }
  }

  function fallbackCopy(text, okMsg) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(okMsg || "已复制到剪贴板");
    } catch (_) {
      showToast("复制失败，请手动选中复制");
    }
    document.body.removeChild(ta);
  }

  /* ======================== 安全数学表达式求值器（无 eval） ======================== */
  function sigmoid(u) {
    if (u >= 0) return 1 / (1 + Math.exp(-u));
    const e = Math.exp(u);
    return e / (1 + e);
  }

  function logsigmoid(u) {
    return u >= 0 ? -Math.log1p(Math.exp(-u)) : u - Math.log1p(Math.exp(u));
  }

  function evalMathExpr(expr, vars) {
    const tokens = [];
    const s = String(expr || "");
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        i++;
      } else if (/[0-9.]/.test(ch)) {
        let j = i;
        while (j < s.length && /[0-9.eE]/.test(s[j])) {
          if ((s[j] === "e" || s[j] === "E") && (s[j + 1] === "+" || s[j + 1] === "-")) {
            j += 2;
          } else {
            j++;
          }
        }
        tokens.push({ t: "num", v: parseFloat(s.slice(i, j)) });
        i = j;
      } else if (/[A-Za-z_]/.test(ch)) {
        let j = i;
        while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
        tokens.push({ t: "id", v: s.slice(i, j) });
        i = j;
      } else if ("+-*/^(),".includes(ch)) {
        tokens.push({ t: ch, v: ch });
        i++;
      } else {
        i++;
      }
    }

    let pos = 0;
    const fns = {
      exp: Math.exp, log: Math.log, ln: Math.log, log10: Math.log10,
      log2: Math.log2, log1p: Math.log1p, sqrt: Math.sqrt, abs: Math.abs,
      sin: Math.sin, cos: Math.cos, tanh: Math.tanh, min: Math.min,
      max: Math.max, pow: Math.pow, sigmoid: sigmoid, logsigmoid: logsigmoid,
    };

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function parseExpr() {
      let left = parseTerm();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        const op = consume().t;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }
    function parseTerm() {
      let left = parsePower();
      while (peek() && (peek().t === "*" || peek().t === "/")) {
        const op = consume().t;
        const right = parsePower();
        left = op === "*" ? left * right : left / right;
      }
      return left;
    }
    function parsePower() {
      let base = parseUnary();
      if (peek() && peek().t === "^") {
        consume();
        base = Math.pow(base, parsePower());
      }
      return base;
    }
    function parseUnary() {
      if (peek() && peek().t === "-") { consume(); return -parseUnary(); }
      if (peek() && peek().t === "+") { consume(); return parseUnary(); }
      return parsePrimary();
    }
    function parsePrimary() {
      const tk = peek();
      if (!tk) return 0;
      if (tk.t === "num") { consume(); return tk.v; }
      if (tk.t === "id") {
        consume();
        if (peek() && peek().t === "(") {
          consume();
          const args = [];
          if (peek() && peek().t !== ")") {
            args.push(parseExpr());
            while (peek() && peek().t === ",") { consume(); args.push(parseExpr()); }
          }
          if (peek() && peek().t === ")") consume();
          return fns[tk.v] ? fns[tk.v].apply(null, args) : NaN;
        }
        if (tk.v === "pi" || tk.v === "PI") return Math.PI;
        if (tk.v === "e" || tk.v === "E") return Math.E;
        return Object.prototype.hasOwnProperty.call(vars, tk.v) ? Number(vars[tk.v]) : 0;
      }
      if (tk.t === "(") {
        consume();
        const val = parseExpr();
        if (peek() && peek().t === ")") consume();
        return val;
      }
      consume();
      return 0;
    }

    try {
      const val = parseExpr();
      return Number.isFinite(val) ? val : NaN;
    } catch (_) {
      return NaN;
    }
  }

  /* ======================== 章节规范化与自动编号 ======================== */
  function normalizeChapter(raw) {
    const ch = deepClone(raw);
    const num = ch.num != null ? ch.num : 1;
    const chId = ch.id || "ch" + num;
    ch.id = chId;
    ch.num = num;
    ch._anchor = `book-${chId}`;

    const rawSections = Array.isArray(ch.sections) ? ch.sections : [];
    const grouped = [];
    const isStructured =
      rawSections.length > 0 && rawSections[0] && Array.isArray(rawSections[0].blocks);

    if (isStructured) {
      rawSections.forEach((sec, idx) => {
        grouped.push({
          id: sec.id || `${chId}-s${idx + 1}`,
          title: stripLeadingSecNum(sec.title || `第 ${idx + 1} 节`),
          blocks: Array.isArray(sec.blocks) ? sec.blocks : [],
        });
      });
    } else {
      let current = null;
      rawSections.forEach((blk) => {
        if (!blk || !blk.type) return;
        if (blk.type === "h3") {
          current = {
            id: blk.id || `${chId}-s${grouped.length + 1}`,
            title: stripLeadingSecNum(blk.text || `第 ${grouped.length + 1} 节`),
            blocks: [],
          };
          grouped.push(current);
        } else {
          if (!current) {
            current = { id: `${chId}-s1`, title: "导言", blocks: [] };
            grouped.push(current);
          }
          current.blocks.push(blk);
        }
      });
    }

    let figIdx = 0;
    let tabIdx = 0;
    let eqIdx = 0;
    const xrefs = { fig: {}, tab: {}, eq: {}, sec: {} };
    const terms = [];

    function collectTermsFromText(txt, secRef, anchorId) {
      if (!txt) return;
      const re = /\{\{term:([^|}]+)\|([^}]+)\}\}/g;
      let m;
      while ((m = re.exec(String(txt))) !== null) {
        terms.push({ name: m[1].trim(), def: m[2].trim(), ref: secRef, anchor: anchorId });
      }
    }

    function scanBlock(blk, secRef, anchorId) {
      if (!blk) return;
      ["text", "label", "proof", "caption"].forEach((k) => {
        if (typeof blk[k] === "string") collectTermsFromText(blk[k], secRef, anchorId);
      });
      if (Array.isArray(blk.paragraphs)) {
        blk.paragraphs.forEach((p) => collectTermsFromText(p, secRef, anchorId));
      }
      if (Array.isArray(blk.items)) {
        blk.items.forEach((it) => {
          if (typeof it === "string") collectTermsFromText(it, secRef, anchorId);
          else if (it && typeof it === "object") {
            collectTermsFromText(it.text, secRef, anchorId);
            if (Array.isArray(it.children)) {
              it.children.forEach((c) =>
                collectTermsFromText(typeof c === "string" ? c : c && c.text, secRef, anchorId)
              );
            }
          }
        });
      }
      if (Array.isArray(blk.rows)) {
        blk.rows.forEach((r) => {
          if (Array.isArray(r)) r.forEach((c) => collectTermsFromText(c, secRef, anchorId));
        });
      }
      if (blk.type === "sim" && Array.isArray(blk.frames)) {
        blk.frames.forEach((f) => {
          if (f && typeof f.caption === "string") collectTermsFromText(f.caption, secRef, anchorId);
        });
      }
      if (blk.type === "term" && blk.name && blk.def) {
        terms.push({
          name: String(blk.name).trim(),
          def: String(blk.def).trim(),
          ref: secRef,
          anchor: anchorId,
        });
      }
    }

    collectTermsFromText(ch.roadmap, `第${num}章`, ch._anchor);
    if (Array.isArray(ch.objectives)) {
      ch.objectives.forEach((o) => collectTermsFromText(o, `第${num}章`, ch._anchor));
    }

    grouped.forEach((sec, sIdx) => {
      const secNum = `${num}.${sIdx + 1}`;
      const anchor = `book-${chId}-s${sIdx + 1}`;
      sec.secNum = secNum;
      sec.anchor = anchor;
      xrefs.sec[`§${secNum}`] = anchor;
      xrefs.sec[secNum] = anchor;

      let subIdx = 0;
      sec.blocks.forEach((blk) => {
        if (blk.type === "h4") {
          subIdx++;
          blk._num = `${subIdx}.`;
          blk._fullNum = `${secNum}.${subIdx}`;
          blk._title = stripLeadingSecNum(blk.text);
          blk._anchor = `book-${chId}-s${sIdx + 1}-${subIdx}`;
          xrefs.sec[`§${blk._fullNum}`] = blk._anchor;
          xrefs.sec[blk._fullNum] = blk._anchor;
        } else if (blk.type === "figure" || blk.type === "side_figure") {
          figIdx++;
          blk._num = `${num}-${figIdx}`;
          blk._anchor = `${chId}-fig-${figIdx}`;
          if (blk.id) xrefs.fig[blk.id] = { label: `图 ${blk._num}`, anchor: blk._anchor };
        } else if (blk.type === "sim" && blk.kind === "animated-diagram") {
          figIdx++;
          blk._num = `${num}-${figIdx}`;
          blk._anchor = `${chId}-fig-${figIdx}`;
          if (blk.id) xrefs.fig[blk.id] = { label: `图 ${blk._num}`, anchor: blk._anchor };
        } else if (blk.type === "code" && blk.result) {
          figIdx++;
          blk._resultFigNum = `${num}-${figIdx}`;
          blk._resultAnchor = `${chId}-fig-${figIdx}`;
          const fid = blk.resultId || blk.id;
          if (fid) xrefs.fig[fid] = { label: `图 ${blk._resultFigNum}`, anchor: blk._resultAnchor };
        } else if (blk.type === "table") {
          tabIdx++;
          blk._num = `${num}-${tabIdx}`;
          blk._anchor = `${chId}-tab-${tabIdx}`;
          if (blk.id) xrefs.tab[blk.id] = { label: `表 ${blk._num}`, anchor: blk._anchor };
        } else if (blk.type === "eq") {
          eqIdx++;
          const labelNum = blk.num ? String(blk.num).replace(/^\(|\)$/g, "") : `${num}.${eqIdx}`;
          blk._num = labelNum;
          blk._anchor = `${chId}-eq-${eqIdx}`;
          if (blk.id) xrefs.eq[blk.id] = { label: `式 (${labelNum})`, anchor: blk._anchor };
        }
        scanBlock(blk, `§${secNum}`, anchor);
      });
    });

    ch._sections = grouped;
    ch._xrefs = xrefs;
    ch._terms = terms;
    ch._exAnchor = `book-${chId}-exercises`;
    return ch;
  }

  /* ======================== 全局状态 ======================== */
  const state = {
    originalData: null,
    data: null,
    chapters: [],
    syllabus: [],
    anchors: [],
    globalTerms: [],
    activeAnchor: null,
    activeChapterId: null,
    mode: "scroll",
    fontSize: 16.5,
    theme: "light",
    sidebarCollapsed: false,
    mobileDrawerOpen: false,
    agentOpen: false,
    agentBackend: { available: false, mode: "offline", label: "离线" },
    agentMessages: [],
    agentContext: null, // { term?, def?, quote?, section?, paragraph? }
    termAutoRegex: null,
    termDefMap: new Map(),
    collapsedChapters: {},
    quizAnswers: {},
    masteredSections: {}, // { secKey: isoTime }
    doubtSections: {},    // { secKey: { note, at } }
    liveSync: false,
    simState: { uc: 3.0, ur: -2.0, beta: 0.1, focus: "IPO" },
    paged: { pageIndex: 0, totalPages: 1, stride: 700, colWidth: 640 },
  };

  function compileCourse(courseData) {
    state.data = deepClone(courseData);
    state.chapters = (state.data.chapters || []).map(normalizeChapter);
    state.syllabus = Array.isArray(state.data.syllabus) ? deepClone(state.data.syllabus) : [];

    const anchors = [];
    state.chapters.forEach((ch) => {
      anchors.push({
        id: ch._anchor,
        chapterId: ch.id,
        label: `第 ${ch.num} 章　${ch.title}`,
      });
      ch._sections.forEach((sec) => {
        anchors.push({
          id: sec.anchor,
          chapterId: ch.id,
          label: `第 ${ch.num} 章 · ${sec.secNum} ${sec.title}`,
        });
      });
      if (
        ch.exercises &&
        ((ch.exercises.single_choice && ch.exercises.single_choice.length) ||
          (ch.exercises.short_answer && ch.exercises.short_answer.length))
      ) {
        anchors.push({
          id: ch._exAnchor,
          chapterId: ch.id,
          label: `第 ${ch.num} 章 · 本章习题`,
        });
      }
    });
    anchors.push({
      id: "book-global-index",
      chapterId: null,
      label: "附录 · 全书术语索引",
    });
    state.anchors = anchors;

    const map = new Map();
    state.chapters.forEach((ch) => {
      ch._terms.forEach((t) => {
        const key = t.name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: t.name, def: t.def, refs: [{ label: t.ref, anchor: t.anchor }] });
        } else {
          const entry = map.get(key);
          if (t.def.length > entry.def.length) entry.def = t.def;
          if (!entry.refs.some((r) => r.label === t.ref)) {
            entry.refs.push({ label: t.ref, anchor: t.anchor });
          }
        }
      });
    });
    state.globalTerms = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "zh-Hans-CN")
    );

    // 构建自动术语匹配表（即使作者只在 term 块里声明过，正文各处也能自动悬停/点击弹窗）
    const defMap = new Map();
    const keys = [];
    state.globalTerms.forEach((t) => {
      const full = t.name.trim();
      if (full.length >= 2) {
        defMap.set(full.toLowerCase(), { name: full, def: t.def });
        keys.push(full);
      }
      // 若术语写为 "SFT（Supervised Fine-Tuning）" 或 "参考模型（π_ref）"，同时注册括号前的简称
      const mShort = full.match(/^([A-Za-z0-9\-\u4e00-\u9fa5]{2,20})\s*[（(]/);
      if (mShort && mShort[1] && !defMap.has(mShort[1].toLowerCase())) {
        defMap.set(mShort[1].toLowerCase(), { name: full, def: t.def });
        keys.push(mShort[1]);
      }
    });
    const uniqueKeys = Array.from(new Set(keys)).sort((a, b) => b.length - a.length);
    state.termDefMap = defMap;
    if (uniqueKeys.length) {
      const escaped = uniqueKeys.map((k) => {
        const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return /^[A-Za-z0-9\-]+$/.test(k) ? `\\b${esc}\\b` : esc;
      });
      try {
        state.termAutoRegex = new RegExp(`(${escaped.join("|")})`, "g");
      } catch (_) {
        state.termAutoRegex = null;
      }
    } else {
      state.termAutoRegex = null;
    }
  }

  /* ======================== 零依赖出版级数学公式排版 ======================== */
  function renderMathHtml(raw, alreadyEscaped) {
    if (typeof window !== "undefined" && typeof window.dayUpRenderMath === "function") {
      return window.dayUpRenderMath(raw, alreadyEscaped);
    }
    return escHtml(raw == null ? "" : String(raw));
  }

  /* ======================== 行内标记与块渲染 ======================== */
  function renderInline(text, chapter, opts) {
    if (text == null) return "";
    const autoTerms = !(opts && opts.noAutoTerms);
    const stash = [];
    const put = (html) => {
      const idx = stash.length;
      stash.push(html);
      return `\u0000STASH${idx}\u0000`;
    };

    const protectedText = String(text).replace(/`([^`]+)`/g, (_, inner) =>
      put(`<code class="inline-code">${escHtml(inner)}</code>`)
    );

    let s = escHtml(protectedText);

    // 1. 显式术语 {{term:词|释义}}（自动防 LLM{{term:LLM|...}} 叠字，并保护进 stash）
    s = s.replace(/([A-Za-z0-9_\u4e00-\u9fff]+)\{\{term:\1\|/g, "{{term:$1|");
    s = s.replace(/\{\{term:([^|}]+)\|([^}]+)\}\}/g, (_, word, def) =>
      put(
        `<span class="term" tabindex="0" role="button" aria-label="术语 ${word}" data-term="${word}" data-def="${def}">${word}</span>`
      )
    );

    // 2. 交叉引用 {{fig:ID}} / {{tab:ID}} / {{eq:ID}}（自动防重：避免 "式 式 (1.1)" 或 "图 图 1-1"）
    const xrefs = chapter && chapter._xrefs ? chapter._xrefs : { fig: {}, tab: {}, eq: {} };
    s = s.replace(/(图|表|式)?\s*\{\{(fig|tab|eq):([^}]+)\}\}/g, (whole, prefix, kind, id) => {
      const target = xrefs[kind] && xrefs[kind][id.trim()];
      if (!target) return whole;
      const expectedPrefix = kind === "fig" ? "图" : kind === "tab" ? "表" : "式";
      const keepPrefix = prefix && prefix !== expectedPrefix ? prefix : "";
      return keepPrefix + put(
        `<a href="#${escHtml(target.anchor)}" class="xref" data-jump-anchor="${escHtml(target.anchor)}">${escHtml(target.label)}</a>`
      );
    });

    // 3. 行内公式 $...$（保护进 stash，并传 alreadyEscaped=true 避免 < > 双重转义）
    s = s.replace(/\$([^$\n]+?)\$/g, (_, expr) =>
      put(`<span class="math-inline">${renderMathHtml(expr, true)}</span>`)
    );

    // 4. 自动美化正文里裸写的常见数学下标（含 𝔼_{...}、π_sft、J_B、J_C、π_ref、D_KL 等）
    s = s.replace(/(𝔼|E|∑|Σ)_\{([^{}]+)\}/g, (_, sym, sub) =>
      put(`<span class="math-inline">${sym}<sub>${sub.replace(/~/g, "∼")}</sub></span>`)
    );
    s = s.replace(/\b(D_KL|L_DPO|L_sft|p_0|r_φ|r_θ|y_w|y_l|y_i|y_t|u_c|u_r|z_ref|m_i|J_A|J_B|J_C)\b/g, (m) => {
      const parts = m.split("_");
      return put(`<span class="math-inline">${parts[0]}<sub>${parts[1]}</sub></span>`);
    });
    s = s.replace(/(π|r|y|x|p|Σ|𝔼)_(ref|sft|rl|dpo|θ|φ|t|i|w|l|y|0|&lt;t)/g, (_, a, b) =>
      put(`<span class="math-inline">${a}<sub>${b}</sub></span>`)
    );

    // 5. 自动把已知术语表中的专有名词挂上悬停/点击弹窗（即便作者只写了 term 块或仅首次标注）
    if (autoTerms && state.termAutoRegex && state.termDefMap.size) {
      s = s.replace(state.termAutoRegex, (match) => {
        const info = state.termDefMap.get(match.toLowerCase());
        if (!info) return match;
        const safeTitle = escHtml(info.name);
        const safeDef = escHtml(info.def);
        return put(
          `<span class="term" tabindex="0" role="button" aria-label="术语 ${safeTitle}" data-term="${safeTitle}" data-def="${safeDef}">${match}</span>`
        );
      });
    }

    // 6. 粗体 **bold**
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // 7. 还原所有保护片段
    s = s.replace(/\u0000STASH(\d+)\u0000/g, (_, idx) => stash[Number(idx)] || "");
    return s;
  }

  function enumMarker(depth, idx) {
    if (depth === 2) return `（${idx + 1}）`;
    if (depth === 3) return `${idx + 1}）`;
    if (depth >= 4) return "·";
    return `${idx + 1}．`;
  }

  function renderEnumList(items, depth, chapter, style) {
    const isSquare = style === "square";
    const d = Math.max(1, Math.min(4, Number(depth) || 1));
    const lis = (items || [])
      .map((item, idx) => {
        const marker = isSquare ? "□" : enumMarker(d, idx);
        if (typeof item === "string") {
          return `<li class="tb-enum-item"><span class="tb-enum-marker">${marker}</span><div class="tb-enum-body">${renderInline(item, chapter)}</div></li>`;
        }
        const body = renderInline(item.text || "", chapter);
        const sub =
          Array.isArray(item.children) && item.children.length
            ? renderEnumList(item.children, d + 1, chapter, item.style)
            : "";
        return `<li class="tb-enum-item"><span class="tb-enum-marker">${marker}</span><div class="tb-enum-body">${body}${sub}</div></li>`;
      })
      .join("");
    return `<ol class="tb-enum ${isSquare ? "style-square" : "depth-" + d}">${lis}</ol>`;
  }

  function renderBlock(blk, chapter, simSlots) {
    switch (blk.type) {
      case "h4":
        return `<h3 class="sec-h3" id="${escHtml(blk._anchor)}">${escHtml(blk._num)} ${escHtml(blk._title)}</h3>`;
      case "p":
        return `<p class="body-p">${renderInline(blk.text, chapter)}</p>`;
      case "side_figure": {
        const paras = Array.isArray(blk.paragraphs)
          ? blk.paragraphs
          : blk.text
          ? [blk.text]
          : [];
        const textHtml = paras.map((p) => `<p class="body-p">${renderInline(p, chapter)}</p>`).join("");
        let media = "";
        if (blk.svg) media = blk.svg;
        else if (blk.src) media = `<img src="${escHtml(blk.src)}" alt="${escHtml(blk.caption || "示意图")}" loading="lazy">`;
        else media = `<div class="fig-placeholder">${escHtml(blk.caption || "示意图")}</div>`;
        return `<div class="side-fig-row">
          <div class="side-fig-text">${textHtml}</div>
          <figure class="side-fig-media" id="${escHtml(blk._anchor)}">
            ${media}
            <figcaption class="side-fig-caption">图 ${escHtml(blk._num)}　${escHtml(blk.caption || "")}</figcaption>
          </figure>
        </div>`;
      }
      case "syntax":
        return `<div class="syntax-line">${escHtml(blk.text || "")}</div>`;
      case "enum":
        return renderEnumList(blk.items, blk.depth || 1, chapter, blk.style);
      case "def":
        return `<div class="callout def"><span class="callout-label">${escHtml(blk.label || "定义")}</span>${renderInline(blk.text, chapter)}</div>`;
      case "prop": {
        const proofHtml = blk.proof
          ? `<div class="prop-proof"><span class="prop-proof-tag">证明</span>${renderInline(blk.proof, chapter)}<span class="prop-qed" aria-hidden="true">□</span></div>`
          : "";
        return `<div class="callout prop"><span class="callout-label">${escHtml(blk.label || "命题")}</span>${renderInline(blk.text, chapter)}${proofHtml}</div>`;
      }
      case "note":
        return `<div class="callout note"><span class="callout-label">${escHtml(blk.label || "注")}</span>${renderInline(blk.text, chapter)}</div>`;
      case "ex":
        return `<div class="callout ex"><span class="callout-label">${escHtml(blk.label || "例")}</span>${renderInline(blk.text, chapter)}</div>`;
      case "code": {
        if (blk.lang === "syntax") {
          return `<div class="syntax-line">${escHtml(blk.text || "")}</div>`;
        }
        const codeId = "cb-" + Math.random().toString(36).slice(2, 8);
        let html = `<div class="code-wrap">
          <button type="button" class="code-copy" data-copy-target="${codeId}">复制</button>
          <pre class="code-pre"><code id="${codeId}">${escHtml(blk.text || "")}</code></pre>
        </div>`;
        if (blk.result) {
          const figBody = blk.output
            ? `<pre class="fig-output">${escHtml(blk.output)}</pre>`
            : blk.svg
            ? blk.svg
            : `<div class="fig-placeholder">执行结果示意：${escHtml(blk.result)}</div>`;
          html += `<figure class="tb-figure" id="${escHtml(blk._resultAnchor)}">
            ${figBody}
            <figcaption class="tb-figcaption">图 ${escHtml(blk._resultFigNum)}　${escHtml(blk.result)}</figcaption>
          </figure>`;
        }
        return html;
      }
      case "figure": {
        let figContent = "";
        if (blk.svg) figContent = blk.svg;
        else if (blk.src) figContent = `<img src="${escHtml(blk.src)}" alt="${escHtml(blk.caption || "示意图")}" loading="lazy">`;
        else if (blk.output) figContent = `<pre class="fig-output">${escHtml(blk.output)}</pre>`;
        else figContent = `<div class="fig-placeholder">${escHtml(blk.placeholder || blk.caption || "图位占位框")}</div>`;
        return `<figure class="tb-figure" id="${escHtml(blk._anchor)}">
          ${figContent}
          <figcaption class="tb-figcaption">图 ${escHtml(blk._num)}　${escHtml(blk.caption || "")}</figcaption>
        </figure>`;
      }
      case "table": {
        const cap = blk.caption
          ? `<div class="tb-table-caption">表 ${escHtml(blk._num)}　${escHtml(blk.caption)}</div>`
          : `<div class="tb-table-caption">表 ${escHtml(blk._num)}</div>`;
        const ths = (blk.head || []).map((h) => `<th>${renderInline(h, chapter)}</th>`).join("");
        const trs = (blk.rows || [])
          .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, chapter)}</td>`).join("")}</tr>`)
          .join("");
        return `<div class="tb-table-wrap" id="${escHtml(blk._anchor)}">${cap}<table class="tb-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
      }
      case "eq":
        return `<div class="eq-block" id="${escHtml(blk._anchor)}"><div class="eq-formula">${renderMathHtml(blk.text || "")}</div><div class="eq-num">(${escHtml(blk._num)})</div></div>`;
      case "term":
        if (blk.hidden) return "";
        return `<div class="term-card"><strong>${escHtml(blk.name)}</strong>${renderInline(blk.def, chapter)}</div>`;
      case "sim": {
        const slotId = "sim-" + simSlots.length;
        simSlots.push({ slotId, blk, chapter });
        return `<div id="${slotId}"></div>`;
      }
      case "slot":
        return `<div class="callout slot">待补充内容：${renderInline(blk.text || "TODO", chapter)}</div>`;
      default:
        return "";
    }
  }

  function renderChapterExercisesInner(ch) {
    const sc = (ch.exercises && ch.exercises.single_choice) || [];
    const sa = (ch.exercises && ch.exercises.short_answer) || [];

    const scHtml = sc
      .map((item, i) => {
        const qKey = `${ch.id}:sc:${i}`;
        const picked = state.quizAnswers[qKey];
        const refAnchor =
          ch._xrefs.sec[item.ref] || ch._xrefs.sec[String(item.ref || "").replace(/^§/, "")];
        const refHtml = item.ref
          ? `<button type="button" class="quiz-ref" ${refAnchor ? `data-jump-anchor="${escHtml(refAnchor)}"` : ""}>（${escHtml(item.ref)}）</button>`
          : "";

        const optsHtml = (item.options || [])
          .map((opt, oi) => {
            const letter = String(opt).trim().charAt(0).toUpperCase() || String.fromCharCode(65 + oi);
            let cls = "quiz-opt";
            if (picked) {
              if (letter === String(item.answer).trim().toUpperCase()) cls += " is-correct";
              else if (letter === picked) cls += " is-wrong";
            }
            return `<button type="button" class="${cls}" data-ch-id="${escHtml(ch.id)}" data-qkey="${escHtml(qKey)}" data-letter="${escHtml(letter)}">${renderInline(opt, ch)}</button>`;
          })
          .join("");

        let fbCls = "quiz-feedback";
        let fbText = "";
        if (picked) {
          const isRight = picked === String(item.answer).trim().toUpperCase();
          fbCls += " show " + (isRight ? "is-good" : "is-bad");
          fbText =
            (isRight ? "回答正确。" : `回答有误，正确答案为 ${item.answer}。`) +
            (item.explain ? " " + item.explain : "");
        }

        return `<div class="quiz-item">
          <div class="quiz-q">${i + 1}．${renderInline(item.q, ch)}${refHtml}</div>
          <div class="quiz-opts">${optsHtml}</div>
          <div class="${fbCls}">${renderInline(fbText, ch)}</div>
        </div>`;
      })
      .join("");

    const saHtml = sa
      .map((item, i) => {
        const refAnchor =
          ch._xrefs.sec[item.ref] || ch._xrefs.sec[String(item.ref || "").replace(/^§/, "")];
        const refHtml = item.ref
          ? `<button type="button" class="quiz-ref" ${refAnchor ? `data-jump-anchor="${escHtml(refAnchor)}"` : ""}>（${escHtml(item.ref)}）</button>`
          : "";
        return `<div class="quiz-item">
          <div class="quiz-q">${i + 1}．${renderInline(item.q, ch)}${refHtml}</div>
          <details class="short-ans-details">
            <summary>显示参考答案</summary>
            <div class="short-ans-body">${renderInline(item.answer || "", ch)}</div>
          </details>
        </div>`;
      })
      .join("");

    const answeredCount = sc.filter((_, i) => state.quizAnswers[`${ch.id}:sc:${i}`]).length;
    const rightCount = sc.filter(
      (item, i) => state.quizAnswers[`${ch.id}:sc:${i}`] === String(item.answer).trim().toUpperCase()
    ).length;

    return `${
      sc.length
        ? `<div class="quiz-summary">
            <span>单选题进度：已答 <strong>${answeredCount}/${sc.length}</strong> 题，答对 <strong>${rightCount}</strong> 题</span>
            <button type="button" class="tb-btn quiz-reset-btn" data-reset-ch="${escHtml(ch.id)}">重做本章单选题</button>
          </div>
          <div class="quiz-section-title">一、单选题</div>${scHtml}`
        : ""
    }${sa.length ? `<div class="quiz-section-title">二、简答题</div>${saHtml}` : ""}`;
  }

  /* ======================== 模拟器 1：DPO Margin Simulator ======================== */
  const DPO_BENCHMARKS = [
    { key: "DPO", name: "DPO", color: "#0F766E", margin: 13.084, pCho: 0.2401, pE: 0.0186, note: "无锚无停点" },
    { key: "RPO", name: "RPO", color: "#2563EB", margin: 15.477, pCho: 0.2487, pE: 0.0021, note: "chosen 加 NLL 锚" },
    { key: "ORPO", name: "ORPO", color: "#7C3AED", margin: 11.057, pCho: 0.2470, pE: 0.0021, note: "SFT 锚 + 优势比" },
    { key: "IPO", name: "IPO", color: "#DC2626", margin: 5.000, pCho: 0.1665, pE: 0.1169, note: "停在 1/(2β)=5" },
    { key: "cDPO", name: "cDPO", color: "#D97706", margin: 10.350, pCho: 0.2297, pE: 0.0360, note: "ε=0.1 标签平滑" },
    { key: "ODPO", name: "ODPO", color: "#0891B2", margin: 14.246, pCho: 0.2427, pE: 0.0140, note: "偏移及格线 m=2" },
    { key: "SimPO", name: "SimPO", color: "#15803D", margin: 5.795, pCho: 0.1818, pE: 0.1002, note: "平均 logp + γ" },
    { key: "KTO", name: "KTO", color: "#BE185D", margin: 9.803, pCho: 0.2265, pE: 0.0410, note: "单条标签 + 参照点" },
  ];

  const LOG_P_REF = 2 * Math.log(0.2);

  function computeDpoLosses(uc, ur, beta) {
    const d = uc - ur;
    const pc = Math.min(-0.02, LOG_P_REF + uc);
    const pr = Math.min(-0.02, LOG_P_REF + ur);
    const apc = pc / 2;
    const apr = pr / 2;
    const oddsDiff = pc - Math.log(-Math.expm1(pc)) - (pr - Math.log(-Math.expm1(pr)));
    const kl = (uc + ur) / 2;
    const ipoTarget = 1 / (2 * beta);
    return {
      DPO: -logsigmoid(beta * d),
      RPO: -logsigmoid(beta * d) - 0.3 * pc,
      ORPO: -pc + 0.5 * -logsigmoid(oddsDiff),
      IPO: Math.pow(d - ipoTarget, 2) * 0.04,
      IPO_raw: Math.pow(d - ipoTarget, 2),
      cDPO: -(0.9 * logsigmoid(beta * d) + 0.1 * logsigmoid(-beta * d)),
      ODPO: -logsigmoid(beta * (d - 2.0)),
      SimPO: -logsigmoid(2.5 * (apc - apr) - 0.8),
      KTO: 1 - sigmoid(beta * (uc - kl)) + (1 - sigmoid(beta * (kl - ur))),
    };
  }

  function mountMarginSimulator(container, blk) {
    const title = (blk && blk.title) || "交互模拟器：DPO 家族损失曲线与似然位移观察器";
    const uid = container.id;
    container.innerHTML = `
      <div class="sim-box">
        <div class="sim-head">
          <h4 class="sim-title">${escHtml(title)}</h4>
          <span class="sim-sub">数据源：dpo_family_demo.py 实测公式与 200 步收敛读数</span>
        </div>
        <div class="sim-presets" role="group" aria-label="典型场景预设">
          <button type="button" class="sim-preset-btn" data-uc="3.0" data-ur="-2.0" data-beta="0.1">IPO 停手点 (Δ=5.0)</button>
          <button type="button" class="sim-preset-btn" data-uc="-1.8" data-ur="-8.8" data-beta="0.1">似然位移 (u_c&lt;0, Δ=7.0)</button>
          <button type="button" class="sim-preset-btn" data-uc="2.0" data-ur="-16.0" data-beta="0.1">过推饱和 (Δ=18.0)</button>
          <button type="button" class="sim-preset-btn" data-uc="0.0" data-ur="0.0" data-beta="0.1">初始状态 (Δ=0.0)</button>
        </div>
        <div class="sim-sliders">
          <div class="sim-ctrl">
            <label for="${uid}-uc"><span>正例对数比 u_c</span><span class="sim-val" data-v="uc"></span></label>
            <input id="${uid}-uc" data-in="uc" type="range" min="-6" max="6" step="0.1" value="${state.simState.uc}">
          </div>
          <div class="sim-ctrl">
            <label for="${uid}-ur"><span>负例对数比 u_r</span><span class="sim-val" data-v="ur"></span></label>
            <input id="${uid}-ur" data-in="ur" type="range" min="-16" max="4" step="0.1" value="${state.simState.ur}">
          </div>
          <div class="sim-ctrl">
            <label for="${uid}-beta"><span>约束强度 β</span><span class="sim-val" data-v="beta"></span></label>
            <input id="${uid}-beta" data-in="beta" type="range" min="0.05" max="0.5" step="0.05" value="${state.simState.beta}">
          </div>
        </div>
        <div class="sim-metrics" data-el="metrics"></div>
        <div class="sim-diag" data-el="diag"></div>
        <div class="sim-chart-wrap">
          <svg data-el="svg" viewBox="0 0 640 252" role="img" aria-label="DPO 家族损失随分差变化曲线"></svg>
          <div class="sim-legend" data-el="legend"></div>
        </div>
        <div style="overflow-x:auto">
          <table class="sim-table" data-el="table">
            <thead>
              <tr><th>方法</th><th>当前 Loss</th><th>|∂L/∂Δ|</th><th>demo 终态 Δ</th><th>P(chosen)</th><th>P(E)</th><th>机制特征</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;

    const elUc = container.querySelector('[data-in="uc"]');
    const elUr = container.querySelector('[data-in="ur"]');
    const elBeta = container.querySelector('[data-in="beta"]');

    function update() {
      const uc = parseFloat(elUc.value);
      const ur = parseFloat(elUr.value);
      const beta = parseFloat(elBeta.value);
      state.simState.uc = uc;
      state.simState.ur = ur;
      state.simState.beta = beta;

      const delta = uc - ur;
      const ipoStop = 1 / (2 * beta);
      const dpoGrad = beta * sigmoid(-beta * delta);

      container.querySelector('[data-v="uc"]').textContent = (uc >= 0 ? "+" : "") + uc.toFixed(1);
      container.querySelector('[data-v="ur"]').textContent = (ur >= 0 ? "+" : "") + ur.toFixed(1);
      container.querySelector('[data-v="beta"]').textContent = beta.toFixed(2);

      container.querySelector('[data-el="metrics"]').innerHTML = `
        <div class="sim-metric"><div class="sim-metric-k">当前分差 Δ = u_c − u_r</div><div class="sim-metric-v">${delta.toFixed(2)}</div></div>
        <div class="sim-metric"><div class="sim-metric-k">IPO 停手点 1/(2β)</div><div class="sim-metric-v">${ipoStop.toFixed(2)}</div></div>
        <div class="sim-metric"><div class="sim-metric-k">DPO 梯度 |∂L/∂Δ|</div><div class="sim-metric-v">${dpoGrad.toExponential(2)}</div></div>
        <div class="sim-metric"><div class="sim-metric-k">正例方向 u_c</div><div class="sim-metric-v" style="color:${uc < 0 ? "var(--bad)" : "var(--good)"}">${uc < 0 ? "下坠 (" + uc.toFixed(1) + ")" : "上升 (+" + uc.toFixed(1) + ")"}</div></div>
      `;

      const diag = container.querySelector('[data-el="diag"]');
      diag.className = "sim-diag";
      if (uc < -0.2 && delta > 1.0) {
        diag.classList.add("is-warn");
        diag.textContent = `诊断（似然位移）：正例 u_c = ${uc.toFixed(1)} 已跌破参考基线，但因负例被压得更狠（u_r = ${ur.toFixed(1)}），分差 Δ = ${delta.toFixed(1)} 仍很大。DPO 损失很低，唯有带 NLL 锚的 RPO / ORPO 会立刻抬高惩罚。`;
      } else if (Math.abs(delta - ipoStop) <= 0.35) {
        diag.classList.add("is-good");
        diag.textContent = `诊断（IPO 精准停手）：当前分差 Δ = ${delta.toFixed(2)} 正好落在 IPO 的理论停手点 1/(2β) = ${ipoStop.toFixed(2)} 处，IPO 损失归零且停止继续推大 margin；而 DPO 仍在施加正向推力。`;
      } else if (beta * delta >= 1.5 && delta > ipoStop + 0.5) {
        diag.classList.add("is-warn");
        diag.textContent = `诊断（过推与饱和）：Δ = ${delta.toFixed(2)} 已超过 1/(2β) = ${ipoStop.toFixed(2)}。DPO 梯度随 σ(−βΔ) 趋近零但永不变号；IPO 的二次项反向回拉，防止 margin 冲爆。`;
      } else {
        diag.textContent = `状态观察：拖动 u_c 或 u_r 观察 8 条损失曲线。保持 Δ 不变并同步下调 u_c、u_r，可直观看到 DPO/IPO 不动而 RPO/ORPO 上升。`;
      }

      const W = 640, H = 252, pL = 44, pR = 18, pT = 16, pB = 42;
      const xMin = -4, xMax = 20, yMin = 0, yMax = 4.5;
      const sx = (x) => pL + ((x - xMin) / (xMax - xMin)) * (W - pL - pR);
      const sy = (y) => H - pB - ((Math.min(yMax, Math.max(yMin, y)) - yMin) / (yMax - yMin)) * (H - pT - pB);

      let svg = "";
      for (let gx = -4; gx <= 20; gx += 4) {
        const x = sx(gx);
        svg += `<line x1="${x}" y1="${pT}" x2="${x}" y2="${H - pB}" stroke="var(--border)" stroke-width="1"/>`;
        svg += `<text x="${x}" y="${H - 22}" text-anchor="middle" fill="var(--muted)" font-size="11">${gx}</text>`;
      }
      for (let gy = 0; gy <= 4; gy += 1) {
        const y = sy(gy);
        svg += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
        svg += `<text x="${pL - 8}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${gy.toFixed(0)}</text>`;
      }
      svg += `<text x="${(pL + W - pR) / 2}" y="${H - 5}" text-anchor="middle" fill="var(--muted)" font-size="11.5">分差 Δ = u_c − u_r</text>`;

      if (ipoStop >= xMin && ipoStop <= xMax) {
        const ix = sx(ipoStop);
        svg += `<line x1="${ix}" y1="${pT}" x2="${ix}" y2="${H - pB}" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="4 3"/>`;
        svg += `<text x="${Math.min(W - 105, ix + 5)}" y="${pT + 12}" fill="#DC2626" font-size="11" font-weight="700">IPO 停手 Δ=${ipoStop.toFixed(1)}</text>`;
      }

      DPO_BENCHMARKS.forEach((m) => {
        const pts = [];
        for (let d = xMin; d <= xMax; d += 0.25) {
          const vals = computeDpoLosses(uc, uc - d, beta);
          const v = vals[m.key];
          if (Number.isFinite(v)) pts.push(`${sx(d).toFixed(1)},${sy(v).toFixed(1)}`);
        }
        const isFocus = state.simState.focus === m.key;
        const opacity = state.simState.focus ? (isFocus ? 1 : 0.28) : 0.85;
        svg += `<polyline fill="none" stroke="${m.color}" stroke-width="${isFocus ? 2.8 : 1.6}" opacity="${opacity}" points="${pts.join(" ")}"/>`;
      });

      const cx = sx(Math.max(xMin, Math.min(xMax, delta)));
      svg += `<line x1="${cx}" y1="${pT}" x2="${cx}" y2="${H - pB}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 2"/>`;

      const curVals = computeDpoLosses(uc, ur, beta);
      const epsH = 1e-3;
      const curValsP = computeDpoLosses(uc, ur - epsH, beta);
      const curValsM = computeDpoLosses(uc, ur + epsH, beta);

      DPO_BENCHMARKS.forEach((m) => {
        const v = curVals[m.key];
        const isFocus = state.simState.focus === m.key;
        svg += `<circle cx="${cx.toFixed(1)}" cy="${sy(v).toFixed(1)}" r="${isFocus ? 4.8 : 3.2}" fill="${m.color}" stroke="var(--paper)" stroke-width="1.2"/>`;
      });

      container.querySelector('[data-el="svg"]').innerHTML = svg;

      const leg = container.querySelector('[data-el="legend"]');
      leg.innerHTML =
        DPO_BENCHMARKS.map(
          (m) =>
            `<button type="button" class="sim-chip ${state.simState.focus === m.key ? "is-focus" : ""}" data-focus="${m.key}"><span class="sim-swatch" style="background:${m.color}"></span>${m.name}</button>`
        ).join("") +
        `<button type="button" class="sim-chip ${!state.simState.focus ? "is-focus" : ""}" data-focus="">全部清晰</button>`;

      leg.querySelectorAll(".sim-chip").forEach((btn) => {
        btn.onclick = () => {
          state.simState.focus = btn.dataset.focus || "";
          update();
        };
      });

      const tbody = container.querySelector('[data-el="table"] tbody');
      tbody.innerHTML = DPO_BENCHMARKS.map((m) => {
        const rawL = m.key === "IPO" ? curVals.IPO_raw : curVals[m.key];
        const rawLp = m.key === "IPO" ? curValsP.IPO_raw : curValsP[m.key];
        const rawLm = m.key === "IPO" ? curValsM.IPO_raw : curValsM[m.key];
        const gradAbs = Math.abs((rawLp - rawLm) / (2 * epsH));
        return `<tr class="${state.simState.focus === m.key ? "is-focus" : ""}">
          <td><span class="sim-swatch" style="background:${m.color};margin-right:5px;vertical-align:middle"></span><strong>${m.name}</strong></td>
          <td>${rawL.toFixed(4)}</td>
          <td>${gradAbs.toFixed(4)}</td>
          <td>${m.margin.toFixed(3)}</td>
          <td>${m.pCho.toFixed(4)}</td>
          <td>${m.pE.toFixed(4)}</td>
          <td>${escHtml(m.note)}</td>
        </tr>`;
      }).join("");
    }

    elUc.addEventListener("input", update);
    elUr.addEventListener("input", update);
    elBeta.addEventListener("input", update);
    container.querySelectorAll(".sim-preset-btn").forEach((btn) => {
      btn.onclick = () => {
        elUc.value = btn.dataset.uc;
        elUr.value = btn.dataset.ur;
        elBeta.value = btn.dataset.beta;
        update();
      };
    });
    update();
  }

  /* ======================== 模拟器 2：通用声明式公式探索器 ======================== */
  function mountFormulaExplorer(container, blk) {
    const sliders = Array.isArray(blk.sliders) ? blk.sliders : [];
    const curves = Array.isArray(blk.curves) ? blk.curves : [];
    const xVar = blk.xVar || "x";
    const xRange = Array.isArray(blk.xRange) ? blk.xRange : [0, 10];
    const yRange = Array.isArray(blk.yRange) ? blk.yRange : [0, 10];
    const palette = ["#0F766E", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#15803D"];
    const uid = container.id;
    const vals = {};
    sliders.forEach((s) => {
      vals[s.name] = Number(s.default != null ? s.default : s.min || 0);
    });

    container.innerHTML = `
      <div class="sim-box">
        <div class="sim-head">
          <h4 class="sim-title">${escHtml(blk.title || "交互公式探索器")}</h4>
          <span class="sim-sub">${escHtml(blk.subtitle || "拖动滑块实时观察参数影响")}</span>
        </div>
        <div class="sim-sliders">
          ${sliders
            .map(
              (s, i) => `<div class="sim-ctrl">
                <label for="${uid}-fe-${i}"><span>${escHtml(s.label || s.name)}</span><span class="sim-val" data-fv="${i}"></span></label>
                <input id="${uid}-fe-${i}" data-fi="${i}" type="range" min="${s.min}" max="${s.max}" step="${s.step || 0.1}" value="${vals[s.name]}">
              </div>`
            )
            .join("")}
        </div>
        <div class="sim-chart-wrap">
          <svg class="fe-svg" viewBox="0 0 640 220" role="img" aria-label="${escHtml(blk.title || "公式曲线")}"></svg>
          <div class="sim-legend fe-legend"></div>
        </div>
        <div class="sim-metrics fe-readout"></div>
      </div>
    `;

    function update() {
      sliders.forEach((s, i) => {
        const inp = container.querySelector(`[data-fi="${i}"]`);
        vals[s.name] = parseFloat(inp.value);
        container.querySelector(`[data-fv="${i}"]`).textContent = vals[s.name].toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
      });

      const W = 640, H = 220, pL = 44, pR = 16, pT = 16, pB = 28;
      const sx = (x) => pL + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (W - pL - pR);
      const sy = (y) => H - pB - ((Math.min(yRange[1], Math.max(yRange[0], y)) - yRange[0]) / (yRange[1] - yRange[0])) * (H - pT - pB);

      let svg = "";
      for (let k = 0; k <= 4; k++) {
        const gx = xRange[0] + ((xRange[1] - xRange[0]) * k) / 4;
        const x = sx(gx);
        svg += `<line x1="${x}" y1="${pT}" x2="${x}" y2="${H - pB}" stroke="var(--border)" stroke-width="1"/>`;
        svg += `<text x="${x}" y="${H - 8}" text-anchor="middle" fill="var(--muted)" font-size="11">${gx.toFixed(1)}</text>`;
        const gy = yRange[0] + ((yRange[1] - yRange[0]) * k) / 4;
        const y = sy(gy);
        svg += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
        svg += `<text x="${pL - 6}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11">${gy.toFixed(1)}</text>`;
      }

      const steps = 80;
      const dx = (xRange[1] - xRange[0]) / steps;
      curves.forEach((c, idx) => {
        const color = c.color || palette[idx % palette.length];
        const pts = [];
        for (let k = 0; k <= steps; k++) {
          const xv = xRange[0] + k * dx;
          const yv = evalMathExpr(c.expr, Object.assign({}, vals, { [xVar]: xv }));
          if (Number.isFinite(yv)) pts.push(`${sx(xv).toFixed(1)},${sy(yv).toFixed(1)}`);
        }
        svg += `<polyline fill="none" stroke="${color}" stroke-width="2.2" points="${pts.join(" ")}"/>`;
      });

      container.querySelector(".fe-svg").innerHTML = svg;
      container.querySelector(".fe-legend").innerHTML = curves
        .map(
          (c, idx) =>
            `<span class="sim-chip"><span class="sim-swatch" style="background:${c.color || palette[idx % palette.length]}"></span>${escHtml(c.label || c.expr)}</span>`
        )
        .join("");

      const readouts = Array.isArray(blk.readouts) ? blk.readouts : [];
      container.querySelector(".fe-readout").innerHTML = readouts
        .map((r) => {
          const v = evalMathExpr(r.expr, vals);
          return `<div class="sim-metric"><div class="sim-metric-k">${escHtml(r.label)}</div><div class="sim-metric-v">${Number.isFinite(v) ? v.toFixed(3) : "—"}</div></div>`;
        })
        .join("");
    }

    container.querySelectorAll('input[type="range"]').forEach((inp) => inp.addEventListener("input", update));
    update();
  }

  /* ======================== 模拟器 3：通用手把手步进推演器 ======================== */
  function mountStepWalkthrough(container, blk, chapter) {
    const steps = Array.isArray(blk.steps) ? blk.steps : [];
    if (!steps.length) return;
    let cur = 0;

    function render() {
      const st = steps[cur];
      const stateEntries = st.state && typeof st.state === "object" ? Object.entries(st.state) : [];
      container.innerHTML = `
        <div class="walk-box">
          <div class="walk-head">
            <h4 class="walk-title">${escHtml(blk.title || "分步推演")}</h4>
            <div class="walk-controls">
              <button type="button" class="tb-btn" data-act="prev" ${cur === 0 ? "disabled" : ""}>‹ 上一步</button>
              <span class="walk-progress">${cur + 1} / ${steps.length}</span>
              <button type="button" class="tb-btn" data-act="next" ${cur === steps.length - 1 ? "disabled" : ""}>下一步 ›</button>
            </div>
          </div>
          <div class="walk-dots">
            ${steps
              .map(
                (s, i) =>
                  `<button type="button" class="walk-dot ${i === cur ? "is-active" : ""}" data-step="${i}">步骤 ${i + 1}：${escHtml(s.short || s.title || "")}</button>`
              )
              .join("")}
          </div>
          <div class="walk-stage">
            <div class="walk-step-title">步骤 ${cur + 1}　${escHtml(st.title || "")}</div>
            ${st.svg ? `<div style="margin:6px 0 10px">${st.svg}</div>` : ""}
            ${st.code ? `<pre class="walk-code">${escHtml(st.code)}</pre>` : ""}
            ${
              stateEntries.length
                ? `<div class="walk-state">${stateEntries
                    .map(([k, v]) => `<div class="walk-kv"><div class="walk-kv-k">${escHtml(k)}</div><div class="walk-kv-v">${escHtml(v)}</div></div>`)
                    .join("")}</div>`
                : ""
            }
            <p class="walk-explain">${renderInline(st.explanation || "", chapter)}</p>
          </div>
        </div>
      `;

      const prevBtn = container.querySelector('[data-act="prev"]');
      const nextBtn = container.querySelector('[data-act="next"]');
      if (prevBtn) prevBtn.onclick = () => { if (cur > 0) { cur--; render(); recalcPaginationIfPaged(); } };
      if (nextBtn) nextBtn.onclick = () => { if (cur < steps.length - 1) { cur++; render(); recalcPaginationIfPaged(); } };
      container.querySelectorAll(".walk-dot").forEach((b) => {
        b.onclick = () => { cur = Number(b.dataset.step); render(); recalcPaginationIfPaged(); };
      });
      bindJumpLinks(container);
    }

    render();
  }

  /* ======================== 模拟器 4：难点动态图播放器（animated-diagram） ======================== */
  function mountAnimatedDiagram(container, blk, chapter) {
    const frames = Array.isArray(blk.frames) ? blk.frames : [];
    if (!frames.length) return;
    let cur = 0;
    let playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches && blk.autoplay !== false;
    let speed = 1;
    const baseMs = Math.max(800, Number(blk.intervalMs) || 2200);
    let timer = 0;

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
    }

    function startTimer() {
      stopTimer();
      if (!playing || frames.length <= 1) return;
      timer = setInterval(() => {
        cur = (cur + 1) % frames.length;
        renderFrameOnly();
      }, Math.round(baseMs / speed));
    }

    const figLabel = blk._num ? `图 ${blk._num}　${blk.caption || blk.title || ""}` : blk.caption || "";

    container.innerHTML = `
      <figure class="anim-box" id="${escHtml(blk._anchor || "")}">
        <div class="anim-head">
          <span class="anim-title">${escHtml(blk.title || blk.caption || "动态过程图解")}</span>
          <div class="anim-controls">
            <button type="button" class="tb-btn" data-act="toggle">${playing ? "⏸ 暂停" : "▶ 播放"}</button>
            <button type="button" class="tb-btn" data-act="prev">‹ 上一帧</button>
            <span class="walk-progress" data-el="counter">1 / ${frames.length}</span>
            <button type="button" class="tb-btn" data-act="next">下一帧 ›</button>
            <button type="button" class="tb-btn" data-act="speed" title="切换播放速度">1x</button>
          </div>
        </div>
        <div class="walk-dots" data-el="dots"></div>
        <div class="anim-stage" data-el="svg"></div>
        <p class="anim-frame-caption" data-el="desc"></p>
        ${figLabel ? `<figcaption class="anim-caption-fig">${escHtml(figLabel)}</figcaption>` : ""}
      </figure>
    `;

    function renderFrameOnly() {
      const f = frames[cur];
      container.querySelector('[data-el="counter"]').textContent = `${cur + 1} / ${frames.length}`;
      container.querySelector('[data-el="svg"]').innerHTML = f.svg || "";
      container.querySelector('[data-el="desc"]').innerHTML = `<strong>${escHtml(f.title || "")}：</strong>${renderInline(f.caption || "", chapter)}`;
      const dotsEl = container.querySelector('[data-el="dots"]');
      dotsEl.innerHTML = frames
        .map(
          (fr, i) =>
            `<button type="button" class="walk-dot ${i === cur ? "is-active" : ""}" data-fi="${i}">${i + 1}. ${escHtml(stripLeadingSecNum(fr.short || fr.title || ""))}</button>`
        )
        .join("");
      dotsEl.querySelectorAll(".walk-dot").forEach((b) => {
        b.onclick = () => {
          cur = Number(b.dataset.fi);
          renderFrameOnly();
          if (playing) startTimer();
        };
      });
      const tBtn = container.querySelector('[data-act="toggle"]');
      if (tBtn) tBtn.textContent = playing ? "⏸ 暂停" : "▶ 播放";
      const sBtn = container.querySelector('[data-act="speed"]');
      if (sBtn) sBtn.textContent = `${speed}x`;
      bindJumpLinks(container);
    }

    container.querySelector('[data-act="toggle"]').onclick = () => {
      playing = !playing;
      renderFrameOnly();
      if (playing) startTimer();
      else stopTimer();
    };
    container.querySelector('[data-act="prev"]').onclick = () => {
      cur = (cur - 1 + frames.length) % frames.length;
      renderFrameOnly();
      if (playing) startTimer();
    };
    container.querySelector('[data-act="next"]').onclick = () => {
      cur = (cur + 1) % frames.length;
      renderFrameOnly();
      if (playing) startTimer();
    };
    container.querySelector('[data-act="speed"]').onclick = () => {
      speed = speed === 1 ? 1.5 : speed === 1.5 ? 0.7 : 1;
      renderFrameOnly();
      if (playing) startTimer();
    };

    renderFrameOnly();
    startTimer();
  }

  /* ======================== 整本图书渲染 ======================== */
  function renderSidebar() {
    const sb = document.getElementById("cw-sidebar");
    if (!sb) return;
    const course = state.data.course || {};
    let html = `<div class="course-meta">
      <div class="course-title">${escHtml(course.title || "交互式教材")}</div>
      <div class="course-sub">${escHtml(course.subtitle || "")}${course.version ? " · " + escHtml(course.version) : ""}</div>
    </div>`;

    state.chapters.forEach((ch) => {
      const collapsed = !!state.collapsedChapters[ch.id];
      const hasEx =
        ch.exercises &&
        ((ch.exercises.single_choice && ch.exercises.single_choice.length) ||
          (ch.exercises.short_answer && ch.exercises.short_answer.length));
      html += `<div class="toc-group ${collapsed ? "is-collapsed" : ""}" data-chap="${escHtml(ch.id)}">
        <button type="button" class="toc-chap-btn" data-chap-toggle="${escHtml(ch.id)}" data-anchor="${escHtml(ch._anchor)}">
          <span>第 ${escHtml(ch.num)} 章　${escHtml(ch.title)}</span>
          <span class="toc-chevron" aria-hidden="true">▾</span>
        </button>
        <ul class="toc-sec-list">
          ${ch._sections
            .map((sec) => {
              const sk = `${ch.id}:${sec.secNum}`;
              const isDone = !!state.masteredSections[sk];
              const isDoubt = !!state.doubtSections[sk];
              const mark = isDoubt
                ? '<span class="toc-mark is-doubt" title="标记有疑问">?</span>'
                : isDone
                ? '<span class="toc-mark is-done" title="已掌握">✓</span>'
                : "";
              return `<li><button type="button" class="toc-sec-link" data-anchor="${escHtml(sec.anchor)}"><span>${escHtml(sec.secNum)}　${escHtml(sec.title)}</span>${mark}</button></li>`;
            })
            .join("")}
          ${
            hasEx
              ? `<li><button type="button" class="toc-sec-link" data-anchor="${escHtml(ch._exAnchor)}"><span>本章习题</span></button></li>`
              : ""
          }
        </ul>
      </div>`;
    });

    // 未展开的后续大纲章节（像真实图书一样展示全书目录，按学习进度逐章生成）
    const loadedIds = new Set(state.chapters.map((c) => c.id));
    const loadedNums = new Set(state.chapters.map((c) => Number(c.num)));
    const upcoming = (state.syllabus || []).filter(
      (item) => !loadedIds.has(item.id) && !loadedNums.has(Number(item.num))
    );
    upcoming.forEach((item) => {
      const subs = Array.isArray(item.sections) ? item.sections : [];
      html += `<div class="toc-upcoming-group">
        <div class="toc-upcoming-title">
          <span>第 ${escHtml(item.num)} 章　${escHtml(item.title)}</span>
          <span class="toc-upcoming-tag">待学</span>
        </div>
        ${
          subs.length
            ? `<ul class="toc-upcoming-subs">${subs
                .map((s, idx) => `<li>${escHtml(item.num)}.${idx + 1}　${escHtml(typeof s === "string" ? s : s.title || "")}</li>`)
                .join("")}</ul>`
            : ""
        }
      </div>`;
    });

    html += `<div class="toc-util-sep"></div>
      <button type="button" class="toc-util-btn" data-anchor="book-global-index">
        <span>附录 · 术语索引</span>
        <span class="toc-badge">${state.globalTerms.length}</span>
      </button>
      <button type="button" class="toc-util-btn" id="toc-open-progress">
        <span>学习大纲与进度</span>
        <span class="toc-badge" id="toc-prog-badge"></span>
      </button>`;

    sb.innerHTML = html;

    const progBtn = sb.querySelector("#toc-open-progress");
    if (progBtn) {
      progBtn.onclick = () => {
        closeMobileDrawer();
        setProgressDrawerOpen(true);
      };
    }
    updateSidebarProgressBadge();

    sb.querySelectorAll("[data-anchor]").forEach((btn) => {
      btn.onclick = (e) => {
        if (e.target.classList.contains("toc-chevron")) {
          const chId = btn.dataset.chapToggle;
          state.collapsedChapters[chId] = !state.collapsedChapters[chId];
          renderSidebar();
          highlightActiveToc();
          return;
        }
        if (btn.dataset.chapToggle) {
          state.collapsedChapters[btn.dataset.chapToggle] = false;
        }
        jumpToAnchor(btn.dataset.anchor);
        closeMobileDrawer();
      };
    });

    highlightActiveToc();
  }

  function highlightActiveToc() {
    const sb = document.getElementById("cw-sidebar");
    if (!sb) return;
    sb.querySelectorAll("[data-anchor]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.anchor === state.activeAnchor);
    });
  }

  function bindJumpLinks(root) {
    (root || document).querySelectorAll("[data-jump-anchor]").forEach((el) => {
      el.onclick = (e) => {
        e.preventDefault();
        jumpToAnchor(el.dataset.jumpAnchor, true);
      };
    });
  }

  function bindQuizHandlers(exHost, ch) {
    exHost.querySelectorAll(".quiz-opt").forEach((btn) => {
      btn.onclick = () => {
        state.quizAnswers[btn.dataset.qkey] = btn.dataset.letter;
        savePrefs({ quizAnswers: state.quizAnswers });
        exHost.innerHTML = renderChapterExercisesInner(ch);
        bindQuizHandlers(exHost, ch);
        bindJumpLinks(exHost);
        scheduleProgressSync();
        recalcPaginationIfPaged();
      };
    });
    const resetBtn = exHost.querySelector(".quiz-reset-btn");
    if (resetBtn) {
      resetBtn.onclick = () => {
        const prefix = `${ch.id}:sc:`;
        Object.keys(state.quizAnswers).forEach((k) => {
          if (k.startsWith(prefix)) delete state.quizAnswers[k];
        });
        savePrefs({ quizAnswers: state.quizAnswers });
        exHost.innerHTML = renderChapterExercisesInner(ch);
        bindQuizHandlers(exHost, ch);
        bindJumpLinks(exHost);
        scheduleProgressSync();
        recalcPaginationIfPaged();
      };
    }
  }

  function renderWholeBook() {
    const pageEl = document.getElementById("cw-page");
    if (!pageEl) return;
    const course = state.data.course || {};
    const simSlots = [];

    // 1. 书名页（扉页）
    let html = `<header class="book-title-leaf" id="book-cover">
      <div class="title-leaf-kicker">交互式教材 · 电子书阅读版</div>
      <h1 class="title-leaf-h1">${escHtml(course.title || "交互式教材")}</h1>
      ${course.subtitle ? `<p class="title-leaf-sub">${escHtml(course.subtitle)}</p>` : ""}
      <div class="title-leaf-meta">${escHtml(course.version || "v1.0")}${course.date ? "　·　" + escHtml(course.date) : ""}　·　共 ${state.chapters.length} 章　·　收录术语 ${state.globalTerms.length} 条</div>
      <div class="title-leaf-toc">
        <div class="title-leaf-toc-head">目　录</div>
        <ul>
          ${state.chapters
            .map(
              (ch) =>
                `<li><a href="#${escHtml(ch._anchor)}" class="xref" data-jump-anchor="${escHtml(ch._anchor)}">第 ${escHtml(ch.num)} 章　${escHtml(ch.title)}</a><span style="color:var(--muted)">${ch._sections.length} 节</span></li>`
            )
            .join("")}
          <li><a href="#book-global-index" class="xref" data-jump-anchor="book-global-index">附录　全书术语索引</a><span style="color:var(--muted)">${state.globalTerms.length} 条</span></li>
        </ul>
      </div>
    </header>`;

    // 2. 逐章连贯渲染
    state.chapters.forEach((ch, cIdx) => {
      const objItems = (ch.objectives || []).map((o) => `<li>${renderInline(o, ch)}</li>`).join("");
      const hasEx =
        ch.exercises &&
        ((ch.exercises.single_choice && ch.exercises.single_choice.length) ||
          (ch.exercises.short_answer && ch.exercises.short_answer.length));
      const refs = Array.isArray(ch.references) ? ch.references : [];

      const sectionsHtml = ch._sections
        .map((sec) => {
          const blocksHtml = sec.blocks.map((b) => renderBlock(b, ch, simSlots)).join("");
          const sk = `${ch.id}:${sec.secNum}`;
          return `<section class="book-section" id="${escHtml(sec.anchor)}" data-toc-anchor="${escHtml(sec.anchor)}">
            <h2 class="sec-h2">${escHtml(sec.secNum)}　${escHtml(sec.title)}</h2>
            ${blocksHtml}
            <div class="sec-check-bar" data-sec-key="${escHtml(sk)}" data-sec-title="${escHtml(sec.secNum + " " + sec.title)}"></div>
          </section>`;
        })
        .join("");

      const exHtml = hasEx
        ? `<section class="book-section" id="${escHtml(ch._exAnchor)}" data-toc-anchor="${escHtml(ch._exAnchor)}">
            <h2 class="sec-h2">本章习题</h2>
            <div class="quiz-host" data-quiz-ch="${escHtml(ch.id)}">${renderChapterExercisesInner(ch)}</div>
          </section>`
        : "";

      const refsHtml = refs.length
        ? `<section class="book-section">
            <h2 class="sec-h2">本章参考文献</h2>
            <ol class="ref-list">${refs.map((r) => `<li>${escHtml(r)}</li>`).join("")}</ol>
          </section>`
        : "";

      html += `<section class="book-chapter ${cIdx === 0 ? "is-first-chapter" : ""}" id="${escHtml(ch._anchor)}" data-toc-anchor="${escHtml(ch._anchor)}">
        <div class="running-header"><span>${escHtml(course.title || "交互式教材")}</span><span>第 ${escHtml(ch.num)} 章　${escHtml(ch.title)}</span></div>
        <header class="chapter-opener">
          <div class="chapter-num-label">第 ${escHtml(ch.num)} 章</div>
          <h2 class="chapter-main-title">${escHtml(ch.title)}</h2>
        </header>
        <section class="objectives-box" aria-label="本章学习目标">
          <div class="objectives-title">本章学习目标</div>
          <ul>${objItems}</ul>
        </section>
        <p class="roadmap-p">${renderInline(ch.roadmap || "", ch)}</p>
        ${sectionsHtml}
        ${exHtml}
        ${refsHtml}
      </section>`;
    });

    // 2.5 若大纲仍有待解锁章节，在正文末尾提示下一步学习路线
    const loadedIds2 = new Set(state.chapters.map((c) => c.id));
    const loadedNums2 = new Set(state.chapters.map((c) => Number(c.num)));
    const upcomingChaps = (state.syllabus || []).filter(
      (item) => !loadedIds2.has(item.id) && !loadedNums2.has(Number(item.num))
    );
    if (upcomingChaps.length) {
      html += `<div class="syllabus-upcoming-note">
        <strong>后续大纲章节（按进度逐章展开，不一次性堆砌）：</strong>
        ${upcomingChaps.map((u) => `第 ${escHtml(u.num)} 章《${escHtml(u.title)}》`).join("；")}。
        完成当前章节阅读与自测后，在对话中告诉 AI「继续下一章」，系统会读取你的掌握情况与错题记录，先巩固薄弱点再展开下一章。
      </div>`;
    }

    // 3. 附录：全书术语索引
    html += `<section class="book-chapter" id="book-global-index" data-toc-anchor="book-global-index">
      <div class="running-header"><span>${escHtml(course.title || "交互式教材")}</span><span>附录　全书术语索引</span></div>
      <h2 class="sec-h2">附录　全书术语索引</h2>
      <p class="body-p">以下术语表由渲染引擎根据全书正文中的术语标注自动汇总生成，共收录 <strong>${state.globalTerms.length}</strong> 个条目。点击出处小节号可直接跳转回书中对应位置。</p>
      <input type="search" id="idx-filter" class="idx-search" placeholder="按术语名称或释义关键词筛选…" aria-label="筛选术语索引">
      <div class="tb-table-wrap">
        <table class="tb-table" id="idx-table">
          <thead><tr><th style="width:24%">术语</th><th>一句话释义</th><th style="width:18%">出处小节</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>`;

    pageEl.innerHTML = html;

    // 挂载交互模拟器与步进器
    simSlots.forEach(({ slotId, blk, chapter }) => {
      const host = document.getElementById(slotId);
      if (!host) return;
      if (blk.kind === "margin-simulator") mountMarginSimulator(host, blk);
      else if (blk.kind === "formula-explorer") mountFormulaExplorer(host, blk);
      else if (blk.kind === "step-walkthrough") mountStepWalkthrough(host, blk, chapter);
      else if (blk.kind === "animated-diagram") mountAnimatedDiagram(host, blk, chapter);
      else host.innerHTML = `<div class="callout slot">未知模拟器类型：${escHtml(blk.kind || "")}</div>`;
    });

    // 绑定代码块复制
    pageEl.querySelectorAll(".code-copy").forEach((btn) => {
      btn.onclick = () => {
        const target = document.getElementById(btn.dataset.copyTarget);
        if (target) copyText(target.textContent, "代码已复制");
      };
    });

    // 绑定各章习题（原地刷新，不丢位置）
    state.chapters.forEach((ch) => {
      const host = pageEl.querySelector(`.quiz-host[data-quiz-ch="${ch.id}"]`);
      if (host) bindQuizHandlers(host, ch);
    });

    // 绑定术语索引检索
    const renderIndexRows = (q) => {
      const kw = String(q || "").trim().toLowerCase();
      const rows = state.globalTerms.filter(
        (t) => !kw || t.name.toLowerCase().includes(kw) || t.def.toLowerCase().includes(kw)
      );
      const tb = pageEl.querySelector("#idx-table tbody");
      if (!tb) return;
      tb.innerHTML = rows.length
        ? rows
            .map(
              (t) => `<tr>
                <td><strong>${escHtml(t.name)}</strong></td>
                <td>${escHtml(t.def)}</td>
                <td>${t.refs
                  .map(
                    (r) =>
                      `<a href="#${escHtml(r.anchor)}" class="xref" data-jump-anchor="${escHtml(r.anchor)}">${escHtml(r.label)}</a>`
                  )
                  .join("、")}</td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="3" style="text-align:center;color:var(--muted)">未匹配到相关术语</td></tr>`;
      bindJumpLinks(tb);
      recalcPaginationIfPaged();
    };
    renderIndexRows("");
    const idxFilter = document.getElementById("idx-filter");
    if (idxFilter) idxFilter.addEventListener("input", () => renderIndexRows(idxFilter.value));

    // <details> 展开/收起时若在翻页模式则重算页数
    pageEl.querySelectorAll("details").forEach((det) => {
      det.addEventListener("toggle", () => recalcPaginationIfPaged());
    });

    // 绑定每节末尾的“已掌握 / 有疑问”纸书铅笔勾记栏
    pageEl.querySelectorAll(".sec-check-bar").forEach((bar) => renderSectionCheckBar(bar));

    bindJumpLinks(pageEl);
    renderSidebar();

    if (state.mode === "paged") {
      requestAnimationFrame(() => layoutPagination(state.activeAnchor));
    } else {
      updateScrollReadingStatus();
    }
  }

  /* ======================== 连贯模式 ScrollSpy 与翻页模式计算 ======================== */
  function flashElement(el) {
    if (!el) return;
    el.classList.remove("jump-flash");
    void el.offsetWidth;
    el.classList.add("jump-flash");
  }

  function setActiveAnchor(anchorId) {
    if (!anchorId) return;
    state.activeAnchor = anchorId;
    const found = state.anchors.find((a) => a.id === anchorId);
    if (found && found.chapterId) state.activeChapterId = found.chapterId;
    highlightActiveToc();
    const locEl = document.getElementById("status-loc");
    if (locEl && found) locEl.textContent = found.label;
    savePrefs({ activeAnchor: anchorId });
    scheduleProgressSync();
  }

  function updateScrollReadingStatus() {
    if (state.mode !== "scroll") return;
    const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.max(0, Math.min(100, Math.round((window.scrollY / docH) * 100)));

    const pctText = document.getElementById("tb-pct");
    const pctFill = document.getElementById("tb-pct-fill");
    const pageStatus = document.getElementById("status-page");
    if (pctText) pctText.textContent = `${pct}%`;
    if (pctFill) pctFill.style.width = `${pct}%`;
    if (pageStatus) pageStatus.textContent = `连贯阅读 · ${pct}%`;

    // ScrollSpy：寻找视口顶部下方最近已滚过的目录锚点
    const probeY = window.scrollY + 110;
    let current = state.anchors[0] ? state.anchors[0].id : null;
    for (let i = 0; i < state.anchors.length; i++) {
      const el = document.getElementById(state.anchors[i].id);
      if (el && el.offsetTop <= probeY) {
        current = state.anchors[i].id;
      }
    }
    if (current && current !== state.activeAnchor) {
      setActiveAnchor(current);
    } else if (current) {
      const found = state.anchors.find((a) => a.id === current);
      const locEl = document.getElementById("status-loc");
      if (locEl && found && !locEl.textContent) locEl.textContent = found.label;
    }

    const idx = state.anchors.findIndex((a) => a.id === state.activeAnchor);
    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx < 0 || idx >= state.anchors.length - 1;
  }

  function getElementPageIndex(el) {
    const paper = document.getElementById("cw-page");
    if (!el || !paper || !state.paged.stride) return 0;
    const probe =
      el.querySelector(".running-header, .chapter-opener, .sec-h2, .sec-h3") || el;
    const rects = probe.getClientRects();
    const probeLeft = rects.length ? rects[0].left : probe.getBoundingClientRect().left;
    const relLeft = probeLeft - paper.getBoundingClientRect().left;
    return Math.max(
      0,
      Math.min(
        state.paged.totalPages - 1,
        Math.floor(Math.max(0, relLeft + 4) / state.paged.stride)
      )
    );
  }

  function layoutPagination(keepAnchorId) {
    if (state.mode !== "paged") return;
    const vp = document.getElementById("cw-viewport");
    const paper = document.getElementById("cw-page");
    if (!vp || !paper) return;

    const cs = getComputedStyle(vp);
    const colW = Math.max(
      260,
      Math.floor(vp.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
    );
    const stride = colW + PAGE_GAP;

    const prevTrans = paper.style.transition;
    paper.style.transition = "none";
    paper.style.transform = "translateX(0px)";
    paper.style.width = colW + "px";
    paper.style.columnWidth = colW + "px";
    paper.style.columnGap = PAGE_GAP + "px";

    // 强制回流后测量总列宽
    const totalW = paper.scrollWidth;
    const totalPages = Math.max(1, Math.ceil((totalW + PAGE_GAP - 2) / stride));

    state.paged.colWidth = colW;
    state.paged.stride = stride;
    state.paged.totalPages = totalPages;

    let targetPage = state.paged.pageIndex;
    if (keepAnchorId) {
      const el = document.getElementById(keepAnchorId);
      if (el) targetPage = getElementPageIndex(el);
    }
    goToPage(Math.max(0, Math.min(totalPages - 1, targetPage)), false);
    void paper.offsetWidth;
    paper.style.transition = prevTrans;
  }

  function recalcPaginationIfPaged() {
    if (state.mode !== "paged") return;
    requestAnimationFrame(() => layoutPagination(null));
  }

  function goToPage(idx, save = true) {
    const paper = document.getElementById("cw-page");
    if (!paper) return;
    const total = state.paged.totalPages;
    const clamped = Math.max(0, Math.min(total - 1, idx));
    state.paged.pageIndex = clamped;
    paper.style.transform = `translateX(${-clamped * state.paged.stride}px)`;

    const pct = Math.round(((clamped + 1) / total) * 100);
    const pctText = document.getElementById("tb-pct");
    const pctFill = document.getElementById("tb-pct-fill");
    const pageStatus = document.getElementById("status-page");
    if (pctText) pctText.textContent = `${clamped + 1}/${total}`;
    if (pctFill) pctFill.style.width = `${pct}%`;
    if (pageStatus) pageStatus.textContent = `第 ${clamped + 1} / ${total} 页 · ${pct}%`;

    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");
    const edgePrev = document.getElementById("edge-prev");
    const edgeNext = document.getElementById("edge-next");
    if (prevBtn) prevBtn.disabled = clamped <= 0;
    if (nextBtn) nextBtn.disabled = clamped >= total - 1;
    if (edgePrev) edgePrev.disabled = clamped <= 0;
    if (edgeNext) edgeNext.disabled = clamped >= total - 1;

    // 根据当前页码反推所处目录锚点
    let current = state.anchors[0] ? state.anchors[0].id : null;
    for (let i = 0; i < state.anchors.length; i++) {
      const el = document.getElementById(state.anchors[i].id);
      if (el && getElementPageIndex(el) <= clamped) {
        current = state.anchors[i].id;
      }
    }
    if (current) setActiveAnchor(current);
    if (save) savePrefs({ pagedIndex: clamped });
  }

  function jumpToAnchor(anchorId, flash = false) {
    const el = document.getElementById(anchorId);
    if (!el) return;
    if (state.mode === "paged") {
      goToPage(getElementPageIndex(el));
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (state.anchors.some((a) => a.id === anchorId)) {
        setActiveAnchor(anchorId);
      }
    }
    if (flash) flashElement(el);
  }

  /* ======================== 模式 / 主题 / 字号 / 侧栏 ======================== */
  function applyMode(mode) {
    const valid = mode === "paged" ? "paged" : "scroll";
    const anchorKeep = state.activeAnchor;
    state.mode = valid;
    document.documentElement.setAttribute("data-mode", valid);
    document.querySelectorAll("[data-set-mode]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setMode === valid));
    });
    const lblPrev = document.getElementById("lbl-prev");
    const lblNext = document.getElementById("lbl-next");
    if (lblPrev) lblPrev.textContent = valid === "paged" ? "上一页" : "上一节";
    if (lblNext) lblNext.textContent = valid === "paged" ? "下一页" : "下一节";
    savePrefs({ mode: valid });

    const paper = document.getElementById("cw-page");
    if (valid === "paged") {
      requestAnimationFrame(() => layoutPagination(anchorKeep));
    } else if (paper) {
      paper.style.transform = "";
      paper.style.width = "";
      paper.style.columnWidth = "";
      paper.style.columnGap = "";
      requestAnimationFrame(() => {
        if (anchorKeep) {
          const el = document.getElementById(anchorKeep);
          if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        }
        updateScrollReadingStatus();
      });
    }
  }

  function applyTheme(theme) {
    const valid = ["light", "sepia", "dark"].includes(theme) ? theme : "light";
    state.theme = valid;
    document.documentElement.setAttribute("data-theme", valid);
    document.querySelectorAll("[data-set-theme]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.setTheme === valid));
    });
    savePrefs({ theme: valid });
  }

  function applyFontSize(px) {
    const clamped = Math.max(14, Math.min(24, Number(px) || 16.5));
    state.fontSize = clamped;
    document.documentElement.style.setProperty("--reader-font-size", clamped + "px");
    savePrefs({ fontSize: clamped });
    recalcPaginationIfPaged();
  }

  function applySidebar() {
    const shell = document.getElementById("cw-shell");
    const scrim = document.getElementById("cw-scrim");
    if (!shell) return;
    shell.classList.toggle("sidebar-collapsed", !!state.sidebarCollapsed);
    shell.classList.toggle("mobile-drawer-open", !!state.mobileDrawerOpen);
    if (scrim && !document.getElementById("cw-progress-drawer").classList.contains("is-open")) {
      scrim.classList.toggle("is-open", !!state.mobileDrawerOpen);
      scrim.classList.remove("for-ai");
    }
    if (state.mode === "paged") {
      setTimeout(() => layoutPagination(state.activeAnchor), 200);
    }
  }

  function closeMobileDrawer() {
    if (state.mobileDrawerOpen) {
      state.mobileDrawerOpen = false;
      applySidebar();
    }
  }

  /* ======================== 专有名词交互弹窗（悬停预览 + 点击固定 + 联动右侧 Agent） ======================== */
  let pinnedTermEl = null;

  function closeTermPopover() {
    const pop = document.getElementById("cw-term-tip");
    if (pop) {
      pop.classList.remove("is-open", "is-pinned");
    }
    if (pinnedTermEl) {
      pinnedTermEl.classList.remove("is-pinned");
      pinnedTermEl = null;
    }
  }

  function findSurroundingContext(el) {
    if (!el) return { section: "", paragraph: "" };
    const secEl = el.closest(".book-section, .book-chapter");
    const h2 = secEl ? secEl.querySelector(".sec-h2, .chapter-main-title") : null;
    const paraEl = el.closest("p, li, .callout, td");
    const rawPara = paraEl ? paraEl.textContent.replace(/\s+/g, " ").trim() : "";
    return {
      section: h2 ? h2.textContent.trim() : "",
      paragraph: rawPara.slice(0, 260),
    };
  }

  function addTermToSectionDoubt(termName, targetEl) {
    const secEl = targetEl && targetEl.closest(".book-section");
    const bar = secEl ? secEl.querySelector(".sec-check-bar") : null;
    const sk = bar ? bar.dataset.secKey : state.activeAnchor || "general";
    const prev = state.doubtSections[sk] && state.doubtSections[sk].note ? state.doubtSections[sk].note + "；" : "";
    const note = prev + `专有名词「${termName}」没完全看懂`;
    state.doubtSections[sk] = { note, at: new Date().toISOString() };
    delete state.masteredSections[sk];
    savePrefs({ doubtSections: state.doubtSections, masteredSections: state.masteredSections });
    if (bar) renderSectionCheckBar(bar);
    renderSidebar();
    scheduleProgressSync();
    showToast(`已将「${termName}」记入本节疑问清单`);
  }

  function initTermTooltip() {
    const pop = document.getElementById("cw-term-tip");
    if (!pop) return;

    function positionPop(target) {
      const rect = target.getBoundingClientRect();
      const popW = Math.min(340, window.innerWidth - 24);
      let left = rect.left;
      if (left + popW > window.innerWidth - 12) left = window.innerWidth - popW - 12;
      if (left < 12) left = 12;
      let top = rect.bottom + 8;
      const estH = pop.offsetHeight || 130;
      if (top + estH > window.innerHeight - 12 && rect.top > estH + 16) {
        top = rect.top - estH - 8;
      }
      pop.style.left = left + "px";
      pop.style.top = Math.max(8, top) + "px";
    }

    function openPop(target, pin) {
      const word = target.dataset.term || target.textContent.trim();
      const def = target.dataset.def || "";
      if (!def) return;
      if (pinnedTermEl && pinnedTermEl !== target) pinnedTermEl.classList.remove("is-pinned");

      pop.innerHTML = `
        <div class="term-pop-head">
          <span class="term-pop-title">${escHtml(word)}</span>
          ${pin ? '<button type="button" class="term-pop-close" data-act="close" aria-label="关闭弹窗">×</button>' : ""}
        </div>
        <p class="term-pop-def">${renderInline(def, null, { noAutoTerms: true })}</p>
        ${
          pin
            ? `<div class="term-pop-actions">
                <button type="button" class="tb-btn tb-btn-accent" data-act="ask-agent">✦ 深入讲解</button>
                <button type="button" class="tb-btn" data-act="doubt">? 记入疑问</button>
              </div>`
            : `<div class="term-pop-hint">点击固定，可继续追问</div>`
        }
      `;
      pop.classList.add("is-open");
      pop.classList.toggle("is-pinned", !!pin);
      if (pin) {
        pinnedTermEl = target;
        target.classList.add("is-pinned");
        const closeBtn = pop.querySelector('[data-act="close"]');
        if (closeBtn) closeBtn.onclick = closeTermPopover;
        const askBtn = pop.querySelector('[data-act="ask-agent"]');
        if (askBtn) {
          askBtn.onclick = () => {
            const ctx = findSurroundingContext(target);
            closeTermPopover();
            askAgentWithContext({
              term: word,
              def,
              section: ctx.section,
              paragraph: ctx.paragraph,
              prompt: `请结合我当前正在看的这一节，用大白话+具体小例子深入讲清楚专有名词「${word}」，并说明它在这里起什么作用、和容易混淆的概念有什么区别。`,
            });
          };
        }
        const doubtBtn = pop.querySelector('[data-act="doubt"]');
        if (doubtBtn) {
          doubtBtn.onclick = () => {
            addTermToSectionDoubt(word, target);
            closeTermPopover();
          };
        }
      }
      positionPop(target);
    }

    document.addEventListener("mouseover", (e) => {
      if (pinnedTermEl) return;
      const t = e.target.closest(".term");
      if (t) openPop(t, false);
    });
    document.addEventListener("mouseout", (e) => {
      if (pinnedTermEl) return;
      if (e.target.closest(".term")) pop.classList.remove("is-open");
    });
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".term");
      if (t) {
        e.preventDefault();
        e.stopPropagation();
        if (pinnedTermEl === t) closeTermPopover();
        else openPop(t, true);
        return;
      }
      if (pinnedTermEl && !e.target.closest("#cw-term-tip")) {
        closeTermPopover();
      }
    });
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target && e.target.classList && e.target.classList.contains("term")) {
        e.preventDefault();
        openPop(e.target, true);
      }
    });
  }

  /* ======================== 划词问右侧 Agent 浮动条 ======================== */
  function initSelectionAskPill() {
    const pill = document.getElementById("cw-sel-pill");
    const paper = document.getElementById("cw-page");
    if (!pill || !paper) return;
    let pendingQuote = "";
    let pendingCtx = { section: "", paragraph: "" };

    function hidePill() {
      pill.hidden = true;
    }

    document.addEventListener("mouseup", (e) => {
      if (e.target.closest("#cw-sel-pill") || e.target.closest("#cw-term-tip") || e.target.closest("#cw-agent-pane")) return;
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) { hidePill(); return; }
        const text = sel.toString().replace(/\s+/g, " ").trim();
        if (text.length < 2 || text.length > 280) { hidePill(); return; }
        const anchorNode = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
        if (!anchorNode || !paper.contains(anchorNode)) { hidePill(); return; }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) { hidePill(); return; }

        pendingQuote = text;
        pendingCtx = findSurroundingContext(anchorNode);
        pill.hidden = false;
        const left = Math.max(12, Math.min(window.innerWidth - 130, rect.left + rect.width / 2 - 58));
        const top = Math.max(54, rect.top - 36);
        pill.style.left = left + "px";
        pill.style.top = top + "px";
      }, 10);
    });

    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest("#cw-sel-pill")) hidePill();
    });

    pill.onclick = () => {
      hidePill();
      const q = pendingQuote;
      window.getSelection && window.getSelection().removeAllRanges();
      askAgentWithContext({
        quote: q,
        section: pendingCtx.section,
        paragraph: pendingCtx.paragraph,
        prompt: `我读到这里没完全看懂：「${q}」。请直接说人话帮我拆解它的意思、背后因果，并用一个具体小例子说明。`,
      });
    };
  }

  /* ======================== 右侧伴学 Agent 对话栏 ======================== */
  function renderAgentMarkdown(md) {
    const text = String(md == null ? "" : md);
    const blocks = [];
    const fenced = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) => {
      const idx = blocks.length;
      blocks.push(`<pre><code>${escHtml(code.trimEnd())}</code></pre>`);
      return `\u0000BLK${idx}\u0000`;
    });
    const lines = fenced.split(/\n/);
    const out = lines
      .map((line) => {
        if (/^\u0000BLK\d+\u0000$/.test(line.trim())) return line.trim();
        if (!line.trim()) return "<div style='height:6px'></div>";
        return `<div>${renderInline(line, null, { noAutoTerms: true })}</div>`;
      })
      .join("");
    return out.replace(/\u0000BLK(\d+)\u0000/g, (_, idx) => blocks[Number(idx)] || "");
  }

  function applyAgentPane() {
    const shell = document.getElementById("cw-shell");
    const pane = document.getElementById("cw-agent-pane");
    const btn = document.getElementById("btn-agent-toggle");
    if (!shell || !pane) return;
    shell.classList.toggle("agent-open", !!state.agentOpen);
    pane.setAttribute("aria-hidden", String(!state.agentOpen));
    if (btn) btn.classList.toggle("is-active", !!state.agentOpen);
    savePrefs({ agentOpen: !!state.agentOpen });
    if (state.mode === "paged") {
      setTimeout(() => layoutPagination(state.activeAnchor), 220);
    }
  }

  function updateAgentBadge() {
    const badge = document.getElementById("agent-mode-badge");
    if (!badge) return;
    const b = state.agentBackend;
    if (b.available) {
      badge.className = "agent-mode-badge is-live";
      badge.textContent = b.label || "当前 Agent";
    } else {
      badge.className = "agent-mode-badge";
      badge.textContent = "离线";
    }
  }

  function renderAgentMessages() {
    const host = document.getElementById("cw-agent-msgs");
    if (!host) return;
    if (!state.agentMessages.length) {
      host.innerHTML = `<div class="agent-msg is-system">点击文中专有名词，或划选不懂的句子直接提问。</div>`;
      return;
    }
    host.innerHTML = state.agentMessages
      .map((m) => {
        const cls = m.role === "user" ? "is-user" : m.role === "assistant" ? "is-assistant" : "is-system";
        const roleLabel = m.role === "user" ? "你" : m.role === "assistant" ? (m.source || "伴学") : "提示";
        return `<div class="agent-msg ${cls}">
          <div class="agent-msg-role"><span>${escHtml(roleLabel)}</span><span>${escHtml(m.time || "")}</span></div>
          <div>${renderAgentMarkdown(m.content)}</div>
        </div>`;
      })
      .join("");
    host.scrollTop = host.scrollHeight;
  }

  function setAgentContext(ctx) {
    state.agentContext = ctx || null;
    const bar = document.getElementById("cw-agent-ctx");
    const txt = document.getElementById("agent-ctx-text");
    if (!bar || !txt) return;
    if (!ctx) {
      bar.hidden = true;
      return;
    }
    const label = ctx.term
      ? `上下文：专有名词「${ctx.term}」${ctx.section ? " · " + ctx.section : ""}`
      : ctx.quote
      ? `上下文：「${ctx.quote.slice(0, 32)}${ctx.quote.length > 32 ? "…" : ""}」`
      : ctx.section || "";
    txt.textContent = label;
    bar.hidden = !label;
  }

  function buildFullExternalPrompt(userQuestion, ctx) {
    const courseTitle = (state.data.course && state.data.course.title) || "当前课程";
    const lines = [`我正在读《${courseTitle}》${ctx && ctx.section ? "（" + ctx.section + "）" : ""}：`];
    if (ctx && ctx.term) lines.push(`- 专有名词：${ctx.term}${ctx.def ? "（书中简释：" + ctx.def + "）" : ""}`);
    if (ctx && ctx.quote) lines.push(`- 原文片段：「${ctx.quote}」`);
    if (ctx && ctx.paragraph) lines.push(`- 所在段落：${ctx.paragraph}`);
    lines.push(`- 我的追问：${userQuestion}`);
    lines.push("请像真人老师当面讲一样说人话：先摆具体情况与因果，禁止背定义和 AI 套话（禁用「旨在/通过…从而实现/某种程度上/底层自动处理」），用极小具体数字或反例讲透，结尾给 1 个 10 秒小反问。");
    return lines.join("\n");
  }

  function nowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  let agentPollTimer = 0;
  function startAgentBridgePoll() {
    if (agentPollTimer || !state.agentBackend.available) return;
    agentPollTimer = setInterval(() => {
      if (!state.agentOpen) return;
      fetch(apiUrl("/api/agent/messages"))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.messages)) return;
          const existingIds = new Set(state.agentMessages.map((m) => m.id).filter(Boolean));
          let added = false;
          data.messages.forEach((m) => {
            if (m.role === "assistant" && m.id && !existingIds.has(m.id)) {
              state.agentMessages.push({
                id: m.id,
                role: "assistant",
                source: m.source || "伴学",
                content: m.content,
                time: m.time || nowHHMM(),
              });
              added = true;
            }
          });
          if (added) renderAgentMessages();
        })
        .catch(() => {});
    }, 2500);
  }

  async function sendToAgent(userText) {
    const q = String(userText || "").trim();
    if (!q) return;
    const ctx = state.agentContext || {};
    const fullPrompt = buildFullExternalPrompt(q, ctx);
    const msgId = "u-" + Date.now();
    state.agentMessages.push({ id: msgId, role: "user", content: q, time: nowHHMM() });
    renderAgentMessages();

    if (state.agentBackend.available) {
      const thinking = { id: "t-" + Date.now(), role: "system", content: "思考中…", time: nowHHMM() };
      state.agentMessages.push(thinking);
      renderAgentMessages();
      try {
        const res = await fetch(apiUrl("/api/agent/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: msgId,
            question: q,
            full_prompt: fullPrompt,
            context: ctx,
          }),
        });
        const data = await res.json();
        state.agentMessages = state.agentMessages.filter((m) => m !== thinking);
        if (data && data.reply) {
          state.agentMessages.push({
            id: data.reply_id || "a-" + Date.now(),
            role: "assistant",
            source: data.source || state.agentBackend.label || "伴学",
            content: data.reply,
            time: nowHHMM(),
          });
        } else if (data && data.queued) {
          const hint = ctx.def ? `**文中简释（${ctx.term}）**：${ctx.def}\n\n` : "";
          state.agentMessages.push({
            role: "system",
            content: hint + "已记录提问，等待回复…",
            time: nowHHMM(),
          });
          startAgentBridgePoll();
        } else {
          state.agentMessages.push({
            role: "system",
            content: "调用失败：" + ((data && data.error) || "未知错误"),
            time: nowHHMM(),
          });
        }
      } catch (err) {
        state.agentMessages = state.agentMessages.filter((m) => m !== thinking);
        state.agentMessages.push({ role: "system", content: "请求异常：" + err.message, time: nowHHMM() });
      }
      renderAgentMessages();
      return;
    }

    copyText(fullPrompt, "已复制上下文提问");
    state.agentMessages.push({
      role: "system",
      content: (ctx.def ? `**文中简释（${ctx.term}）**：${ctx.def}\n\n` : "") + "当前为离线打开，已复制提问到剪贴板。",
      time: nowHHMM(),
    });
    renderAgentMessages();
  }

  function askAgentWithContext(ctx) {
    state.agentOpen = true;
    applyAgentPane();
    setAgentContext(ctx);
    const inp = document.getElementById("agent-input");
    if (ctx.prompt) {
      sendToAgent(ctx.prompt);
      if (inp) inp.value = "";
    } else if (inp) {
      inp.focus();
    }
  }

  function probeAgentServer() {
    if (location.protocol !== "http:" && location.protocol !== "https:") {
      updateAgentBadge();
      return;
    }
    fetch(apiUrl("/api/agent/status"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") return;
        state.agentBackend = {
          available: true,
          mode: data.mode || "bridge",
          label: data.label || "当前 Agent",
        };
        updateAgentBadge();
        startAgentBridgePoll();
      })
      .catch(() => {
        state.agentBackend = { available: false, mode: "offline", label: "离线" };
        updateAgentBadge();
      });
  }

  function initAgentPane() {
    const prefs = loadPrefs();
    state.agentOpen = !!prefs.agentOpen;

    const toggleBtn = document.getElementById("btn-agent-toggle");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        state.agentOpen = !state.agentOpen;
        applyAgentPane();
      };
    }
    const closeBtn = document.getElementById("btn-agent-close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        state.agentOpen = false;
        applyAgentPane();
      };
    }

    const clearBtn = document.getElementById("btn-agent-clear");
    if (clearBtn) {
      clearBtn.onclick = () => {
        state.agentMessages = [];
        setAgentContext(null);
        renderAgentMessages();
      };
    }

    const ctxClearBtn = document.getElementById("btn-ctx-clear");
    if (ctxClearBtn) ctxClearBtn.onclick = () => setAgentContext(null);

    const inp = document.getElementById("agent-input");
    const sendBtn = document.getElementById("btn-agent-send");

    function triggerSend() {
      if (!inp) return;
      const val = inp.value.trim();
      if (!val) return;
      inp.value = "";
      sendToAgent(val);
    }

    if (sendBtn) sendBtn.onclick = triggerSend;
    if (inp) {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          triggerSend();
        }
      });
    }

    applyAgentPane();
    updateAgentBadge();
    renderAgentMessages();
    probeAgentServer();
  }

  /* ======================== 学习进度追踪、实时同步与抽屉 ======================== */
  function renderSectionCheckBar(bar) {
    const sk = bar.dataset.secKey;
    const done = !!state.masteredSections[sk];
    const doubt = state.doubtSections[sk];
    bar.innerHTML = `
      <button type="button" class="sec-check-btn ${done ? "is-done" : ""}" data-act="done">${done ? "✓ 本节已掌握" : "□ 标记本节已掌握"}</button>
      <button type="button" class="sec-check-btn ${doubt ? "is-doubt" : ""}" data-act="doubt">${doubt ? "? 已记为有疑问" : "记为有疑问"}</button>
      ${
        doubt
          ? `<div class="sec-doubt-note">
              <input type="text" class="sec-doubt-input" placeholder="简短记下卡壳点（AI 下一轮会优先为你解答）…" value="${escHtml(doubt.note || "")}">
              <button type="button" class="sec-check-btn" data-act="save-note">保存备注</button>
            </div>`
          : ""
      }
    `;

    bar.querySelector('[data-act="done"]').onclick = () => {
      if (state.masteredSections[sk]) {
        delete state.masteredSections[sk];
      } else {
        state.masteredSections[sk] = new Date().toISOString();
        delete state.doubtSections[sk];
      }
      savePrefs({ masteredSections: state.masteredSections, doubtSections: state.doubtSections });
      renderSectionCheckBar(bar);
      renderSidebar();
      scheduleProgressSync();
      recalcPaginationIfPaged();
    };

    bar.querySelector('[data-act="doubt"]').onclick = () => {
      if (state.doubtSections[sk]) {
        delete state.doubtSections[sk];
      } else {
        state.doubtSections[sk] = { note: "", at: new Date().toISOString() };
        delete state.masteredSections[sk];
      }
      savePrefs({ masteredSections: state.masteredSections, doubtSections: state.doubtSections });
      renderSectionCheckBar(bar);
      renderSidebar();
      scheduleProgressSync();
      recalcPaginationIfPaged();
    };

    const saveBtn = bar.querySelector('[data-act="save-note"]');
    const noteInput = bar.querySelector(".sec-doubt-input");
    if (saveBtn && noteInput) {
      const commit = () => {
        if (!state.doubtSections[sk]) return;
        state.doubtSections[sk].note = noteInput.value.trim();
        state.doubtSections[sk].at = new Date().toISOString();
        savePrefs({ doubtSections: state.doubtSections });
        scheduleProgressSync();
        showToast("已记入学习疑问，AI 下一轮可读取");
      };
      saveBtn.onclick = commit;
      noteInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      });
    }
  }

  function buildProgressReportData() {
    const allSections = [];
    const masteredList = [];
    const doubtList = [];
    let qTotal = 0;
    let qAnswered = 0;
    let qCorrect = 0;
    const wrongQuestions = [];

    state.chapters.forEach((ch) => {
      ch._sections.forEach((sec) => {
        const sk = `${ch.id}:${sec.secNum}`;
        allSections.push({ key: sk, sec: sec.secNum, title: sec.title, chId: ch.id });
        if (state.masteredSections[sk]) {
          masteredList.push({ sec: sec.secNum, title: sec.title, at: state.masteredSections[sk] });
        }
        if (state.doubtSections[sk]) {
          doubtList.push({
            sec: sec.secNum,
            title: sec.title,
            note: state.doubtSections[sk].note || "",
            at: state.doubtSections[sk].at,
          });
        }
      });

      const sc = (ch.exercises && ch.exercises.single_choice) || [];
      sc.forEach((item, i) => {
        qTotal++;
        const picked = state.quizAnswers[`${ch.id}:sc:${i}`];
        const ans = String(item.answer || "").trim().toUpperCase();
        if (picked) {
          qAnswered++;
          if (picked === ans) qCorrect++;
          else {
            wrongQuestions.push({
              chapter: `第 ${ch.num} 章`,
              ref: item.ref || "",
              question: item.q,
              picked,
              correct: ans,
            });
          }
        }
      });
    });

    const curObj = state.anchors.find((a) => a.id === state.activeAnchor);
    const loadedIds = new Set(state.chapters.map((c) => c.id));
    const loadedNums = new Set(state.chapters.map((c) => Number(c.num)));
    const upcoming = (state.syllabus || [])
      .filter((u) => !loadedIds.has(u.id) && !loadedNums.has(Number(u.num)))
      .map((u) => ({ num: u.num, title: u.title, status: "待学" }));

    return {
      course_title: (state.data.course && state.data.course.title) || "交互式教材",
      updated_at: new Date().toISOString(),
      active_location: curObj ? curObj.label : "",
      active_anchor: state.activeAnchor || "",
      unlocked_chapters: state.chapters.map((ch) => ({
        id: ch.id,
        num: ch.num,
        title: ch.title,
        total_sections: ch._sections.length,
        mastered_sections: ch._sections.filter((s) => !!state.masteredSections[`${ch.id}:${s.secNum}`]).length,
      })),
      upcoming_syllabus: upcoming,
      mastered_count: masteredList.length,
      total_unlocked_sections: allSections.length,
      mastered_sections: masteredList,
      doubt_sections: doubtList,
      quiz_summary: {
        answered: qAnswered,
        correct: qCorrect,
        total: qTotal,
        accuracy_pct: qAnswered ? Math.round((qCorrect / qAnswered) * 100) : null,
        wrong_questions: wrongQuestions,
      },
      raw_state: {
        activeAnchor: state.activeAnchor,
        masteredSections: state.masteredSections,
        doubtSections: state.doubtSections,
        quizAnswers: state.quizAnswers,
      },
    };
  }

  function buildProgressMarkdown(rep) {
    const lines = [
      `# 学习情况汇报：${rep.course_title}`,
      `- 当前阅读位置：${rep.active_location || "书名页"}`,
      `- 已解锁章节掌握进度：${rep.mastered_count} / ${rep.total_unlocked_sections} 节`,
      `- 单选题自测：已答 ${rep.quiz_summary.answered}/${rep.quiz_summary.total}，正确 ${rep.quiz_summary.correct} 题${rep.quiz_summary.accuracy_pct != null ? `（正确率 ${rep.quiz_summary.accuracy_pct}%）` : ""}`,
    ];
    if (rep.doubt_sections.length) {
      lines.push("", "## 标记有疑问的小节（请先帮我重点讲解）");
      rep.doubt_sections.forEach((d) => {
        lines.push(`- ${d.sec} ${d.title}${d.note ? " —— 疑问：" + d.note : ""}`);
      });
    }
    if (rep.quiz_summary.wrong_questions.length) {
      lines.push("", "## 错题记录");
      rep.quiz_summary.wrong_questions.forEach((w) => {
        lines.push(`- [${w.chapter} ${w.ref}] ${w.question}（我选 ${w.picked}，正解 ${w.correct}）`);
      });
    }
    if (rep.upcoming_syllabus.length) {
      lines.push("", "## 后续待学大纲");
      rep.upcoming_syllabus.forEach((u) => lines.push(`- 第 ${u.num} 章：${u.title}（待学）`));
    }
    return lines.join("\n");
  }

  function updateSidebarProgressBadge() {
    const badge = document.getElementById("toc-prog-badge");
    if (!badge) return;
    const totalSec = state.chapters.reduce((acc, ch) => acc + ch._sections.length, 0);
    const doneSec = Object.keys(state.masteredSections).length;
    badge.textContent = `${doneSec}/${totalSec}`;
  }

  function updateSyncBadge() {
    const el = document.getElementById("status-sync");
    if (!el) return;
    if (state.liveSync) {
      el.className = "status-sync is-live";
      el.textContent = "● 进度已实时同步给 AI";
    } else {
      el.className = "status-sync";
      el.textContent = "本地学习模式";
    }
  }

  let syncTimer = 0;
  function scheduleProgressSync() {
    updateSidebarProgressBadge();
    if (document.getElementById("cw-progress-drawer").classList.contains("is-open")) {
      renderProgressDrawer();
    }
    if (!state.liveSync) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const payload = buildProgressReportData();
      fetch(apiUrl("/api/progress"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 350);
  }

  function probeLiveStudyServer() {
    if (location.protocol !== "http:" && location.protocol !== "https:") {
      updateSyncBadge();
      return;
    }
    fetch(apiUrl("/api/progress"), { method: "GET" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") return;
        state.liveSync = true;
        updateSyncBadge();
        const rs = data.raw_state;
        if (rs && typeof rs === "object") {
          if (rs.masteredSections && Object.keys(rs.masteredSections).length) {
            state.masteredSections = Object.assign({}, rs.masteredSections, state.masteredSections);
          }
          if (rs.doubtSections && Object.keys(rs.doubtSections).length) {
            state.doubtSections = Object.assign({}, rs.doubtSections, state.doubtSections);
          }
          if (rs.quizAnswers && Object.keys(rs.quizAnswers).length) {
            state.quizAnswers = Object.assign({}, rs.quizAnswers, state.quizAnswers);
          }
          renderWholeBook();
        }
        scheduleProgressSync();
      })
      .catch(() => {
        state.liveSync = false;
        updateSyncBadge();
      });
  }

  function renderProgressDrawer() {
    const host = document.getElementById("cw-progress-body");
    if (!host) return;
    const rep = buildProgressReportData();
    const accText =
      rep.quiz_summary.accuracy_pct != null ? `${rep.quiz_summary.accuracy_pct}%` : "未作答";

    host.innerHTML = `
      <div class="prog-summary-grid">
        <div class="prog-stat"><div class="prog-stat-k">已掌握小节</div><div class="prog-stat-v">${rep.mastered_count}/${rep.total_unlocked_sections}</div></div>
        <div class="prog-stat"><div class="prog-stat-k">习题正确率</div><div class="prog-stat-v">${accText}</div></div>
        <div class="prog-stat"><div class="prog-stat-k">待解疑问</div><div class="prog-stat-v">${rep.doubt_sections.length}</div></div>
      </div>
      <div class="ai-actions">
        <button type="button" class="tb-btn tb-btn-accent" id="btn-prog-copy">复制进度摘要</button>
        <button type="button" class="tb-btn" id="btn-prog-export">导出 progress.json</button>
      </div>
      <div class="prog-block">
        <h3>全书目录大纲进度</h3>
        <ul class="prog-list">
          ${rep.unlocked_chapters
            .map(
              (c) =>
                `<li><strong>第 ${escHtml(c.num)} 章　${escHtml(c.title)}</strong> · 已掌握 ${c.mastered_sections}/${c.total_sections} 节</li>`
            )
            .join("")}
          ${rep.upcoming_syllabus
            .map(
              (u) =>
                `<li style="color:var(--muted)">第 ${escHtml(u.num)} 章　${escHtml(u.title)} · <span>待学</span></li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="prog-block">
        <h3>标记有疑问的小节（${rep.doubt_sections.length}）</h3>
        ${
          rep.doubt_sections.length
            ? `<ul class="prog-list">${rep.doubt_sections
                .map(
                  (d) =>
                    `<li><strong>${escHtml(d.sec)} ${escHtml(d.title)}</strong>${d.note ? " — " + escHtml(d.note) : ""}</li>`
                )
                .join("")}</ul>`
            : `<p class="ai-help">暂无标记疑问。</p>`
        }
      </div>
      <div class="prog-block">
        <h3>自测错题记录（${rep.quiz_summary.wrong_questions.length}）</h3>
        ${
          rep.quiz_summary.wrong_questions.length
            ? `<ul class="prog-list">${rep.quiz_summary.wrong_questions
                .map(
                  (w) =>
                    `<li>[${escHtml(w.chapter)} ${escHtml(w.ref)}] ${escHtml(w.question)}（选 ${escHtml(w.picked)} / 正解 ${escHtml(w.correct)}）</li>`
                )
                .join("")}</ul>`
            : `<p class="ai-help">暂无错题记录。</p>`
        }
      </div>
    `;

    document.getElementById("btn-prog-copy").onclick = () => {
      copyText(buildProgressMarkdown(rep), "已复制学习进度摘要");
    };
    document.getElementById("btn-prog-export").onclick = () => {
      const blob = new Blob([JSON.stringify(rep, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "progress.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("已导出 progress.json");
    };
  }

  function setProgressDrawerOpen(open) {
    const drawer = document.getElementById("cw-progress-drawer");
    const scrim = document.getElementById("cw-scrim");
    if (!drawer) return;
    if (open) {
      renderProgressDrawer();
    }
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    if (scrim) {
      scrim.classList.toggle("is-open", open || state.mobileDrawerOpen);
      scrim.classList.toggle("for-ai", open);
    }
  }

  /* ======================== 初始化入口 ======================== */
  function init() {
    const dataEl = document.getElementById("course-data");
    let rawData = window.__COURSEWARE_DATA__;
    if (!rawData && dataEl) rawData = JSON.parse(dataEl.textContent);
    if (!rawData) {
      document.body.innerHTML = "<p style='padding:24px'>未找到课件 JSON 数据。</p>";
      return;
    }

    state.originalData = deepClone(rawData);
    compileCourse(rawData);

    const prefs = loadPrefs();
    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    applyTheme(prefs.theme || "light");
    applyFontSize(prefs.fontSize || (isMobile ? 16 : 16.5));
    state.sidebarCollapsed = !!prefs.sidebarCollapsed;
    state.quizAnswers = prefs.quizAnswers && typeof prefs.quizAnswers === "object" ? prefs.quizAnswers : {};
    state.masteredSections = prefs.masteredSections && typeof prefs.masteredSections === "object" ? prefs.masteredSections : {};
    state.doubtSections = prefs.doubtSections && typeof prefs.doubtSections === "object" ? prefs.doubtSections : {};
    state.activeAnchor =
      prefs.activeAnchor && state.anchors.some((a) => a.id === prefs.activeAnchor)
        ? prefs.activeAnchor
        : state.anchors[0] && state.anchors[0].id;

    renderWholeBook();
    applySidebar();

    // 绑定顶栏与翻页事件
    document.getElementById("btn-toc").onclick = () => {
      if (window.matchMedia("(max-width: 860px)").matches) {
        state.mobileDrawerOpen = !state.mobileDrawerOpen;
      } else {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        savePrefs({ sidebarCollapsed: state.sidebarCollapsed });
      }
      applySidebar();
    };

    function stepPrev() {
      if (state.mode === "paged") {
        goToPage(state.paged.pageIndex - 1);
      } else {
        const idx = state.anchors.findIndex((a) => a.id === state.activeAnchor);
        if (idx > 0) jumpToAnchor(state.anchors[idx - 1].id);
      }
    }

    function stepNext() {
      if (state.mode === "paged") {
        goToPage(state.paged.pageIndex + 1);
      } else {
        const idx = state.anchors.findIndex((a) => a.id === state.activeAnchor);
        if (idx >= 0 && idx < state.anchors.length - 1) jumpToAnchor(state.anchors[idx + 1].id);
      }
    }

    document.getElementById("btn-prev").onclick = stepPrev;
    document.getElementById("btn-next").onclick = stepNext;
    document.getElementById("edge-prev").onclick = stepPrev;
    document.getElementById("edge-next").onclick = stepNext;

    document.getElementById("btn-font-dec").onclick = () => applyFontSize(state.fontSize - 1);
    document.getElementById("btn-font-inc").onclick = () => applyFontSize(state.fontSize + 1);

    document.querySelectorAll("[data-set-theme]").forEach((btn) => {
      btn.onclick = () => applyTheme(btn.dataset.setTheme);
    });
    document.querySelectorAll("[data-set-mode]").forEach((btn) => {
      btn.onclick = () => applyMode(btn.dataset.setMode);
    });

    document.getElementById("btn-progress-open").onclick = () => setProgressDrawerOpen(true);
    document.getElementById("btn-progress-close").onclick = () => setProgressDrawerOpen(false);

    document.getElementById("cw-scrim").onclick = () => {
      setProgressDrawerOpen(false);
      closeMobileDrawer();
    };

    document.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (e.key === "Escape") {
        closeTermPopover();
        setProgressDrawerOpen(false);
        closeMobileDrawer();
        return;
      }
      if (state.mode === "paged" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        if (e.key === "ArrowRight" || e.key === "PageDown") {
          e.preventDefault();
          stepNext();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          stepPrev();
        }
      }
    });

    let scrollRaf = 0;
    window.addEventListener(
      "scroll",
      () => {
        if (state.mode !== "scroll") return;
        if (!scrollRaf) {
          scrollRaf = requestAnimationFrame(() => {
            scrollRaf = 0;
            updateScrollReadingStatus();
          });
        }
      },
      { passive: true }
    );

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.mode === "paged") layoutPagination(state.activeAnchor);
        else updateScrollReadingStatus();
      }, 120);
    });

    const backLibBtn = document.getElementById("btn-back-library");
    if (backLibBtn && getBookApiBase()) {
      backLibBtn.hidden = false;
    }

    initTermTooltip();
    initSelectionAskPill();
    initAgentPane();
    probeLiveStudyServer();

    // 恢复上次阅读模式与位置
    applyMode(prefs.mode || "scroll");
    if ((prefs.mode || "scroll") === "scroll" && prefs.activeAnchor) {
      requestAnimationFrame(() => {
        const el = document.getElementById(prefs.activeAnchor);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        updateScrollReadingStatus();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
