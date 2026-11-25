#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
交互式教材课件 JSON 质量校验脚本（通用、零依赖）
检查内容结构、切入段落、图文并茂、防止提示框滥用、交叉引用闭环、习题闭环、去 AI 套话与缩写展开。
用法：
  python3 validate_chapter.py path/to/ch1.json [path/to/ch2.json ...]
  python3 validate_chapter.py path/to/course_full.json
"""

import json
import re
import sys
from pathlib import Path

ALLOWED_BLOCKS = {
    "h3", "h4", "p", "side_figure", "syntax", "enum",
    "def", "prop", "note", "ex", "code", "figure",
    "table", "eq", "term", "sim", "slot",
}

CALLOUT_BLOCKS = {"def", "prop", "note", "ex"}

FORBIDDEN_CLICHES = [
    "总而言之",
    "不难发现",
    "值得注意的是",
    "综上所述",
    "显而易见",
    "毋庸置疑",
    "众所周知",
]

IGNORED_ACRONYMS = {
    "AI", "UI", "UX", "ID", "MB", "GB", "KB", "TB", "MS", "PX",
    "OK", "IO", "OS", "PC", "VS", "AA", "WCAG", "JSON", "JSONL",
    "HTML", "CSS", "JS", "SVG", "UTF", "CLI", "TODO", "AUTO",
    "UTF8", "API", "CPU", "GPU", "GET", "POST", "PUT", "DELETE",
    "ISBN", "HTTPS",
}


def iter_chapter_blocks(ch):
    num = ch.get("num", 1)
    raw = ch.get("sections", [])
    sections = []

    if raw and isinstance(raw[0], dict) and isinstance(raw[0].get("blocks"), list):
        for idx, sec in enumerate(raw, start=1):
            sec_num = f"{num}.{idx}"
            sub_idx = 0
            subs = []
            blks = sec.get("blocks", [])
            for b in blks:
                if isinstance(b, dict) and b.get("type") == "h4":
                    sub_idx += 1
                    subs.append(f"{sec_num}.{sub_idx}")
            sections.append((sec_num, subs, blks))
    else:
        cur_num = None
        cur_subs = []
        cur_blks = []
        sec_idx = 0
        sub_idx = 0
        for b in raw:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "h3":
                if cur_num is not None:
                    sections.append((cur_num, cur_subs, cur_blks))
                sec_idx += 1
                sub_idx = 0
                cur_num = f"{num}.{sec_idx}"
                cur_subs = []
                cur_blks = []
            else:
                if cur_num is None:
                    sec_idx += 1
                    cur_num = f"{num}.{sec_idx}"
                if b.get("type") == "h4":
                    sub_idx += 1
                    cur_subs.append(f"{cur_num}.{sub_idx}")
                cur_blks.append(b)
        if cur_num is not None:
            sections.append((cur_num, cur_subs, cur_blks))

    return sections


def extract_prose_texts(ch):
    texts = []
    if isinstance(ch.get("roadmap"), str):
        texts.append(ch["roadmap"])
    for o in ch.get("objectives", []):
        if isinstance(o, str):
            texts.append(o)

    for _, _, blks in iter_chapter_blocks(ch):
        for b in blks:
            btype = b.get("type")
            if btype in ("code", "syntax"):
                if isinstance(b.get("result"), str):
                    texts.append(b["result"])
                continue
            for k in ("text", "label", "proof", "caption"):
                if isinstance(b.get(k), str):
                    texts.append(b[k])
            if isinstance(b.get("paragraphs"), list):
                for p in b["paragraphs"]:
                    if isinstance(p, str):
                        texts.append(p)
            if isinstance(b.get("items"), list):
                for it in b["items"]:
                    if isinstance(it, str):
                        texts.append(it)
                    elif isinstance(it, dict):
                        if isinstance(it.get("text"), str):
                            texts.append(it["text"])
                        for c in it.get("children", []):
                            if isinstance(c, str):
                                texts.append(c)
                            elif isinstance(c, dict) and isinstance(c.get("text"), str):
                                texts.append(c["text"])
            if isinstance(b.get("rows"), list):
                for row in b["rows"]:
                    if isinstance(row, list):
                        for cell in row:
                            if isinstance(cell, str):
                                texts.append(cell)
            if btype == "sim" and isinstance(b.get("steps"), list):
                for st in b["steps"]:
                    if isinstance(st, dict) and isinstance(st.get("explanation"), str):
                        texts.append(st["explanation"])
            if btype == "sim" and isinstance(b.get("frames"), list):
                for fr in b["frames"]:
                    if isinstance(fr, dict) and isinstance(fr.get("caption"), str):
                        texts.append(fr["caption"])
    return texts


def block_prose_text(b):
    """提取单个正文块（不含纯 code/syntax 与纯 term 术语表块）的可读文本。"""
    if not isinstance(b, dict):
        return ""
    btype = b.get("type")
    if btype in ("code", "syntax", "term"):
        return b.get("result", "") if btype == "code" and isinstance(b.get("result"), str) else ""
    parts = []
    for k in ("text", "label", "proof", "caption"):
        if isinstance(b.get(k), str):
            parts.append(b[k])
    if isinstance(b.get("paragraphs"), list):
        parts.extend(p for p in b["paragraphs"] if isinstance(p, str))
    if isinstance(b.get("items"), list):
        for it in b["items"]:
            if isinstance(it, str):
                parts.append(it)
            elif isinstance(it, dict):
                if isinstance(it.get("text"), str):
                    parts.append(it["text"])
                for c in it.get("children", []):
                    if isinstance(c, str):
                        parts.append(c)
                    elif isinstance(c, dict) and isinstance(c.get("text"), str):
                        parts.append(c["text"])
    if isinstance(b.get("rows"), list):
        for row in b["rows"]:
            if isinstance(row, list):
                parts.extend(c for c in row if isinstance(c, str))
    if btype == "sim" and isinstance(b.get("steps"), list):
        for st in b["steps"]:
            if isinstance(st, dict) and isinstance(st.get("explanation"), str):
                parts.append(st["explanation"])
    if btype == "sim" and isinstance(b.get("frames"), list):
        for fr in b["frames"]:
            if isinstance(fr, dict) and isinstance(fr.get("caption"), str):
                parts.append(fr["caption"])
    return "\n".join(parts)


def has_local_acronym_explanation(acr, text):
    """判断该缩写是否在给定局部文本中当场展开了全称或通过 {{term:...}} 给出释义。"""
    if not text:
        return False
    esc = re.escape(acr)
    patterns = [
        rf"{esc}\**\s*[（(][^）)]{{2,}}[）)]",
        rf"[（(][^）)]*{esc}[^）)]*[）)]",
        rf"\{{\{{term:[^|}}]*{esc}[^|}}]*\|[^}}]+\}}\}}",
        rf"{esc}\**\s*(?:全称|是指|指的是|即|就是|代表|叫做|称为|为)",
        rf"(?:简称|叫做|称为|记作|缩写为|即)\s*\**{esc}\b",
    ]
    return any(re.search(pat, text) for pat in patterns)


def strip_inline_code(text):
    return re.sub(r"`[^`]*`", " ", text)


def visible_text_len(text):
    """计算正文实际可见字数（扣除 {{term:词|释义}} 中不占正文版面的释义文本）"""
    if not isinstance(text, str):
        return 0
    s = re.sub(r"\{\{term:([^|}]+)\|[^}]+\}\}", r"\1", text)
    s = re.sub(r"\{\{(?:fig|tab|eq):[^}]+\}\}", "图1-1", s)
    return len(s)


def validate_chapter(ch, source_name="<input>"):
    errors = []
    warnings = []
    label = f"{source_name} ({ch.get('id', 'unknown')})"

    for req in ("id", "num", "title", "objectives", "roadmap", "sections", "exercises"):
        if req not in ch:
            errors.append(f"[{label}] 缺少必填字段：{req}")

    objs = ch.get("objectives", [])
    if not isinstance(objs, list) or not (3 <= len(objs) <= 5):
        errors.append(f"[{label}] objectives 应为 3~5 条，当前为 {len(objs) if isinstance(objs, list) else '非数组'}")
    else:
        for i, o in enumerate(objs, start=1):
            if not isinstance(o, str) or not (o.strip().startswith("了解") or o.strip().startswith("掌握")):
                errors.append(f"[{label}] objectives 第 {i} 条未以'了解'或'掌握'开头：{o!r}")

    roadmap = ch.get("roadmap", "")
    if not (isinstance(roadmap, str) and "先" in roadmap and "再" in roadmap and "最后" in roadmap):
        errors.append(f"[{label}] roadmap 应包含'先……再……最后……'结构")

    sections = iter_chapter_blocks(ch)
    if not sections:
        errors.append(f"[{label}] sections 为空")

    valid_refs = set()
    defined_figs = set()
    defined_tabs = set()
    defined_eqs = set()
    defined_terms = set()

    diagram_count = 0
    callout_count = 0
    content_block_count = 0

    for sec_num, subs, blks in sections:
        valid_refs.add(f"§{sec_num}")
        valid_refs.add(sec_num)
        for sub in subs:
            valid_refs.add(f"§{sub}")
            valid_refs.add(sub)

        first_non_heading = next((b for b in blks if b.get("type") not in ("h4", "term")), None)
        if first_non_heading and first_non_heading.get("type") not in ("p", "side_figure", "enum"):
            warnings.append(
                f"[{label}] §{sec_num} 开头直接进入 '{first_non_heading.get('type')}' 块，建议先写 1 段明确切入点再展开"
            )

        prev_blk = None
        for b in blks:
            btype = b.get("type")
            if btype not in ALLOWED_BLOCKS:
                errors.append(f"[{label}] §{sec_num} 存在非法块类型：{btype!r}")
                continue
            if btype not in ("h4", "term"):
                content_block_count += 1
            if btype in CALLOUT_BLOCKS:
                callout_count += 1
            if btype in ("figure", "side_figure"):
                if b.get("id"):
                    defined_figs.add(b["id"])
                if b.get("svg") or b.get("src"):
                    diagram_count += 1
            elif btype == "sim" and b.get("kind") == "animated-diagram":
                if b.get("id"):
                    defined_figs.add(b["id"])
                if isinstance(b.get("frames"), list) and len(b["frames"]) > 0:
                    diagram_count += 1
            elif btype == "code":
                fid = b.get("resultId") or (b.get("id") if b.get("result") else None)
                if fid:
                    defined_figs.add(fid)
                if b.get("lang") != "syntax":
                    has_lead = (
                        prev_blk is not None
                        and prev_blk.get("type") in ("p", "note", "ex", "side_figure")
                        and ("代码如下" in prev_blk.get("text", "") or "如下：" in prev_blk.get("text", ""))
                    )
                    if not has_lead and not b.get("result"):
                        warnings.append(f"[{label}] §{sec_num} 的 code 块前建议写'代码如下：'或附 result 图说明")
            elif btype == "table" and b.get("id"):
                defined_tabs.add(b["id"])
            elif btype == "eq" and b.get("id"):
                defined_eqs.add(b["id"])
            elif btype == "term" and b.get("name"):
                defined_terms.add(b["name"].strip().lower())
            prev_blk = b

    if diagram_count == 0:
        warnings.append(f"[{label}] 全章尚无配图（figure/side_figure 的 svg 或 src），教学课件应做到图文并茂")

    if content_block_count >= 6 and (callout_count / content_block_count) > 0.35:
        warnings.append(
            f"[{label}] 提示块（def/prop/note/ex）占比过高（{callout_count}/{content_block_count}），建议改为连贯自然段落以减少视觉分散"
        )

    all_texts = extract_prose_texts(ch)
    joined_prose = "\n".join(all_texts)

    for cliche in FORBIDDEN_CLICHES:
        if cliche in joined_prose:
            errors.append(f"[{label}] 正文出现禁用 AI 套话：'{cliche}'")

    used_figs = set(re.findall(r"\{\{fig:([^}]+)\}\}", joined_prose))
    used_tabs = set(re.findall(r"\{\{tab:([^}]+)\}\}", joined_prose))
    used_eqs = set(re.findall(r"\{\{eq:([^}]+)\}\}", joined_prose))

    for m in re.finditer(r"\{\{term:([^|}]+)\|([^}]+)\}\}", joined_prose):
        defined_terms.add(m.group(1).strip().lower())

    for fid in sorted(defined_figs - used_figs):
        errors.append(f"[{label}] 图 id='{fid}' 未在正文中用 {{{{fig:{fid}}}}} 引用")
    for fid in sorted(used_figs - defined_figs):
        errors.append(f"[{label}] 正文引用了不存在的图 {{{{fig:{fid}}}}}")

    for tid in sorted(defined_tabs - used_tabs):
        errors.append(f"[{label}] 表 id='{tid}' 未在正文中用 {{{{tab:{tid}}}}} 引用")
    for tid in sorted(used_tabs - defined_tabs):
        errors.append(f"[{label}] 正文引用了不存在的表 {{{{tab:{tid}}}}}")

    for eid in sorted(defined_eqs - used_eqs):
        errors.append(f"[{label}] 公式 id='{eid}' 未在正文中用 {{{{eq:{eid}}}}} 引用")
    for eid in sorted(used_eqs - defined_eqs):
        errors.append(f"[{label}] 正文引用了不存在的公式 {{{{eq:{eid}}}}}")

    # 6. 人类教科书“零跳步”核查：缩写首次出现严禁裸奔 + 黑盒魔法数字检测 + 术语释义充实度
    # （注意：按正文阅读顺序扫描，不把章末 term 术语表当作前文裸用的免死金牌！）
    def clean_for_acr(txt):
        s = strip_inline_code(txt)
        s = re.sub(r"\{\{(?:fig|tab|eq):[^}]+\}\}", " ", s)
        return s

    first_seen_acr = {}
    for sec_num, _, blks in sections:
        prev_txt = ""
        for idx, b in enumerate(blks):
            if b.get("type") == "term":
                tname = str(b.get("name", "")).strip()
                tdef = str(b.get("def", "")).strip()
                if tname and len(tdef) < 16:
                    warnings.append(
                        f"[{label}] §{sec_num} 术语 '{tname}' 的释义过短（{len(tdef)} 字），建议写成 25~90 字微型微课（讲清全称/是什么 + 输入输出或怎么工作）"
                    )
                continue

            if b.get("type") == "h4":
                continue

            cur_raw = block_prose_text(b)
            if not cur_raw:
                continue

            # 检查行内 {{term:词|释义}} 的释义充实度
            for tm in re.finditer(r"\{\{term:([^|}]+)\|([^}]+)\}\}", cur_raw):
                if len(tm.group(2).strip()) < 16:
                    warnings.append(
                        f"[{label}] §{sec_num} 行内术语 '{tm.group(1).strip()}' 释义过短（{len(tm.group(2).strip())} 字），请补清全称与作用"
                    )

            cur_clean = clean_for_acr(cur_raw)
            local_window = prev_txt + "\n" + cur_clean
            for acr in re.findall(r"\b(?:[a-z]?[A-Z]{2,}[A-Za-z0-9]*)\b", cur_clean):
                if acr in IGNORED_ACRONYMS or acr in first_seen_acr:
                    continue
                explained_here = has_local_acronym_explanation(acr, local_window)
                first_seen_acr[acr] = (sec_num, explained_here)

            # 检查疑似“黑盒魔法数字”（如“RM 打分是 {4, 2, 1}”）
            magic_m = re.search(
                r"(?:[A-Za-z0-9_\u4e00-\u9fff]{1,12}\s*)?(?:打分|得分|分数|评分|奖励|权重|概率|损失|梯度|输出|结果)\s*(?:是|为|得到|等于|分别是)\s*[\{\[\(]\s*[-+]?\d[^}\]\)\n]{0,40}[\}\]\)]",
                cur_clean,
            )
            if magic_m:
                next_raw = block_prose_text(blks[idx + 1]) if idx + 1 < len(blks) else ""
                ctx_text = cur_clean + "\n" + clean_for_acr(next_raw)
                mech_cues = (
                    "输入", "输出", "模型", "神经网络", "线性", "计算", "训练", "公式",
                    "标量", "量纲", "相对", "区间", "范围", "怎么", "由来", "来自",
                    "通过", "基于", "表示", "含义", "满分", "平移", "映射", "前向",
                )
                hit_cues = sum(1 for c in mech_cues if c in ctx_text)
                if visible_text_len(ctx_text) < 140 or hit_cues < 2:
                    warnings.append(
                        f"[{label}] §{sec_num} 出现疑似黑盒数值（'{magic_m.group(0).strip()}'），附近缺少“谁算出来的 / 输入怎么变成这个数 / 尺度边界是什么”的机制拆解，请像人类教科书一样当场讲清来历"
                    )

            prev_txt = cur_clean

    prose_no_code = clean_for_acr(joined_prose)
    for acr, (sec_num, explained_here) in sorted(first_seen_acr.items()):
        in_terms = any(acr.lower() in t for t in defined_terms)
        has_global_expand = has_local_acronym_explanation(acr, prose_no_code)
        if not explained_here:
            if not in_terms and not has_global_expand:
                warnings.append(
                    f"[{label}] 缩写 '{acr}' 在 §{sec_num} 直接裸用且全章未见展开或 {{{{term:...}}}} 收录，请补齐全称、输入输出与作用"
                )
            else:
                warnings.append(
                    f"[{label}] 缩写 '{acr}' 在 §{sec_num} 首次出现时裸奔（未在当段展开全称或讲清含义；即使后文/章末术语表有收录也属于“先用后讲”跳步），请当场补清"
                )

    ex = ch.get("exercises", {})
    if not isinstance(ex, dict):
        errors.append(f"[{label}] exercises 必须为对象")
    else:
        sc = ex.get("single_choice", [])
        sa = ex.get("short_answer", [])
        if not (5 <= len(sc) <= 7):
            warnings.append(f"[{label}] single_choice 建议 5~7 题，当前 {len(sc)} 题")
        if not (3 <= len(sa) <= 4):
            warnings.append(f"[{label}] short_answer 建议 3~4 题，当前 {len(sa)} 题")

        for i, item in enumerate(sc, start=1):
            opts = item.get("options", [])
            if len(opts) != 4:
                errors.append(f"[{label}] 单选题 {i} 选项数应为 4，当前 {len(opts)}")
            ans = str(item.get("answer", "")).strip().upper()
            if ans not in ("A", "B", "C", "D"):
                errors.append(f"[{label}] 单选题 {i} answer 无效：{ans!r}")
            ref = str(item.get("ref", "")).strip()
            if not ref or ref not in valid_refs:
                errors.append(f"[{label}] 单选题 {i} ref='{ref}' 未指向本章真实小节")

        for i, item in enumerate(sa, start=1):
            if not item.get("answer"):
                errors.append(f"[{label}] 简答题 {i} 缺少参考答案 answer")
            ref = str(item.get("ref", "")).strip()
            if not ref or ref not in valid_refs:
                errors.append(f"[{label}] 简答题 {i} ref='{ref}' 未指向本章真实小节")

    refs = ch.get("references", [])
    if not isinstance(refs, list) or len(refs) == 0:
        warnings.append(f"[{label}] references 为空：建议先通过 search_web 检索权威文档/报刊/高口碑博客，并将实际参考来源写入 references")

    # 8. Z-Lib 纸书讲述风格、每章硬实践、防叠字与排版呼吸感护栏
    dup_term = re.search(r"([A-Za-z0-9\u4e00-\u9fff]{2,})\{\{term:\1\|", joined_prose)
    if dup_term:
        errors.append(
            f"[{label}] 正文出现重复术语写法 '{dup_term.group(1)}{{{{term:{dup_term.group(1)}|...}}}}'（会渲染成叠字如 LLMLLM/NaNNaN），请删去前面的重复词"
        )

    if "其一" in joined_prose and "其二" in joined_prose and "其三" in joined_prose:
        warnings.append(f"[{label}] 正文出现'其一…其二…其三…'AI 排比模板，建议改为自然分层或 □ 列表")
    for suspense_tpl in (
        "本节我们先弄清一件事",
        "学一个新概念，最快的方法",
        "上一章留了一句话没展开",
        "突破口的钥匙",
        "给过一个很精确的说法",
    ):
        if suspense_tpl in joined_prose:
            warnings.append(f"[{label}] 出现播客/AI 卖关子模板 '{suspense_tpl}'，请直接亮出真实卡点、报文或代码切入")

    ai_zombie_patterns = [
        (r"通过[^，。；\n]{2,26}从而(?:实现|提升|达到)", "通过…从而实现…"),
        (r"进行[^，。；\n]{1,10}(?:处理|映射|度量|表征|优化)", "进行…处理/映射/度量"),
        (r"本质上是[^，。；\n]{1,20}的体现", "本质上是…的体现"),
        (r"具有[^，。；\n]{1,16}的特性", "具有…的特性"),
        (r"作为[^，。；\n]{1,16}的核心载体", "作为…的核心载体"),
        (r"(?:旨在|致力于|赋能|抓手|值得一提的是|需要指出的是)", "AI 腔公文词"),
    ]
    zombie_hits = []
    for pat, desc in ai_zombie_patterns:
        m = re.search(pat, joined_prose)
        if m:
            zombie_hits.append(f"'{m.group(0)}'({desc})")
    if zombie_hits:
        warnings.append(
            f"[{label}] 检测到 AI 名词化/公文僵尸句：{', '.join(zombie_hits[:4])}，请改用「具体主语 + 动作 + 肉眼可见结果」的人话短句重写"
        )

    abrupt_openings = ("接下来我们介绍", "下面我们介绍", "下面介绍", "本节讨论", "本节将介绍", "本节主要介绍", "在这一节中，我们")
    for s_idx, (sec_num, _, blks) in enumerate(sections):
        if s_idx == 0:
            continue
        first_p = next((b.get("text", "") for b in blks if b.get("type") == "p" and isinstance(b.get("text"), str)), "")
        for ab in abrupt_openings:
            if first_p.lstrip().startswith(ab):
                warnings.append(
                    f"[{label}] §{sec_num} 开头使用生硬切题语 '{ab}'，缺少与上一节的因果咬合，请直接承接上一节末尾留下的具体问题或新边界"
                )
                break

    example_cues = ("例如", "比如", "举例", "案例", "实测", "演示", "例 ")
    contrast_cues = ("区别", "对比", "不同于", "并非", "而不是", "限制", "代价", "失效", "缺点", "省略", "少用", "但是", "但 ")
    if not any(c in joined_prose for c in example_cues):
        warnings.append(f"[{label}] 全章未见具体举例引导词（如'例如/比如/举例'），请确认是否用真实具体例子讲清概念")
    if not any(c in joined_prose for c in contrast_cues):
        warnings.append(f"[{label}] 全章缺少横向对比、工程取舍或失效边界讨论，注意避免解释面过于狭窄")

    real_code_count = 0
    worked_artifact_count = 0
    tech_cues = ("代码", "API", "JSON", "HTTP", "SQL", "Python", "函数", "算法", "向量", "协议", "框架", "Agent")
    is_tech_chapter = sum(1 for c in tech_cues if c in joined_prose) >= 2

    for sec_num, subs, blks in sections:
        sec_text_len = 0
        has_rich = False
        for idx, b in enumerate(blks):
            bt = b.get("type")
            if bt in ("code", "figure", "side_figure", "table", "sim"):
                has_rich = True
            if bt in ("ex", "table", "eq", "sim"):
                worked_artifact_count += 1
            if bt == "code" and b.get("lang") != "syntax":
                real_code_count += 1
                worked_artifact_count += 1
                code_str = str(b.get("code") or b.get("text") or "")
                for toy_pat in ("fakeBrain", "fake_brain", "mock_llm", "演示用「演员」", "按剧本出招"):
                    if toy_pat in code_str:
                        warnings.append(
                            f"[{label}] §{sec_num} 检测到玩具剧本代码（'{toy_pat}'），请改为真实协议报文、核心数据结构或可复用算法实现"
                        )
                        break
            if bt == "p" and isinstance(b.get("text"), str):
                raw_p = b["text"]
                plen = visible_text_len(raw_p)
                sec_text_len += plen
                if plen > 280:
                    warnings.append(f"[{label}] §{sec_num} 存在 {plen} 字的超长段落（建议 90~220 字、不超过 280 字），请拆分为短段以保证纸书呼吸感")
                em_cnt = raw_p.count("——")
                if em_cnt >= 2:
                    warnings.append(f"[{label}] §{sec_num} 单段出现 {em_cnt} 个破折号 '——'，读起来费力，请拆成干净短句（每段最多 1 个破折号）")
                vis_p = re.sub(r"\{\{term:([^|}]+)\|[^}]+\}\}", r"\1", raw_p)
                long_paren = re.search(r"（[^（）]{36,}）", vis_p)
                if long_paren:
                    warnings.append(f"[{label}] §{sec_num} 段落出现长达 {len(long_paren.group(0))} 字的括号套娃解释，请拆成独立短句以降低阅读阻力")
            elif bt == "side_figure":
                sec_text_len += visible_text_len(b.get("text", ""))
                for p in b.get("paragraphs", []):
                    sec_text_len += visible_text_len(p)
                svg_str = b.get("svg", "")
                vb = re.search(r"viewBox=['\"]\s*[\d.\-]+\s+[\d.\-]+\s+([\d.]+)\s+([\d.]+)", svg_str)
                if vb and float(vb.group(1)) > 280:
                    warnings.append(
                        f"[{label}] §{sec_num} 的 side_figure SVG viewBox 宽度为 {vb.group(1)}（>280），放进窄侧栏会缩成蚂蚁字，请改用全宽 figure 或 animated-diagram"
                    )
            elif bt == "eq":
                # 检查公式后面是否紧跟深入拆解（至少 160 字讲解或带 □ 逐符号拆解列表）
                follow_len = 0
                has_enum_unpack = False
                for nb in blks[idx + 1 : idx + 4]:
                    nbt = nb.get("type")
                    if nbt in ("h4", "eq"):
                        break
                    if nbt == "p":
                        follow_len += len(nb.get("text", ""))
                    elif nbt == "enum":
                        has_enum_unpack = True
                        for it in nb.get("items", []):
                            follow_len += len(it if isinstance(it, str) else it.get("text", ""))
                    elif nbt in ("note", "ex", "prop", "def"):
                        follow_len += len(nb.get("text", ""))
                if not has_enum_unpack and follow_len < 160:
                    warnings.append(
                        f"[{label}] §{sec_num} 的公式 '{b.get('id', 'eq')}' 后续讲解偏短（{follow_len} 字且无逐符号 □ 拆解），请按四步深讲法拆清每个符号含义与具体数值推导"
                    )
            elif bt in ("enum", "def", "prop", "note", "ex"):
                sec_text_len += len(b.get("text", ""))
                for it in b.get("items", []):
                    sec_text_len += len(it if isinstance(it, str) else it.get("text", ""))
        if sec_text_len > 750 and len(subs) == 0:
            warnings.append(f"[{label}] §{sec_num} 达 {sec_text_len} 字却无 h4 子节分层，建议拆出 1. / 2. 子节改善阅读层次")
        if sec_text_len < 120 and not has_rich:
            warnings.append(f"[{label}] §{sec_num} 正文过短（仅 {sec_text_len} 字且无图表/代码），请检查是否解释面过于狭窄")

    if is_tech_chapter and real_code_count < 2:
        warnings.append(
            f"[{label}] 技术章节仅有 {real_code_count} 段真实代码实践（建议每章至少 2 段真实可落地代码 + 关键行拆解与“删掉会怎样”），切忌前几章纯空谈、最后一章才写代码"
        )
    elif not is_tech_chapter and worked_artifact_count < 2:
        warnings.append(
            f"[{label}] 非代码学科章节仅有 {worked_artifact_count} 处一手硬实操载体（建议每章至少 2 处：如完整手推例题 ex、真实数据/账表 table、临床病例/判例涵摄、核心公式推导或互动演练），切忌纯文字空谈"
        )

    counterfactual_cues = ("如果", "假如", "删掉", "去掉", "漏掉", "改掉", "否则", "一旦", "前提", "失效", "反例", "误诊", "逆转")
    if not any(c in joined_prose for c in counterfactual_cues):
        warnings.append(
            f"[{label}] 全章缺少“如果改掉/删掉/漏掉某一步会怎样”的反事实边界检验，建议补齐以贴近 Z-Lib 经典教材深度"
        )

    # 9. 单章厚度与递进节数护栏（避免薄讲义）
    total_prose_chars = sum(visible_text_len(t) for t in all_texts)
    if len(sections) < 4:
        warnings.append(f"[{label}] 全章仅有 {len(sections)} 个小节（建议 4~6 节，逐层铺开地基→机理→实操→边界）")
    if total_prose_chars < 1500:
        warnings.append(f"[{label}] 全章正文偏薄（仅 {total_prose_chars} 字，建议 2500~5500 字），请补足原理解释、一手实操与排障边界")

    warnings.extend(checkFreshnessIssues(ch, joined_prose, label))
    warnings.extend(checkSkippedDerivations(joined_prose, label))
    warnings.extend(checkConsecutiveEqs(sections, label))
    warnings.extend(checkUnexplainedCodeTokens(sections, label))
    warnings.extend(checkConceptBudget(sections, label))
    warnings.extend(checkForwardRefTerms(sections, label))
    warnings.extend(checkNakedLatinTerms(sections, label))
    warnings.extend(checkCodeApiCoverage(sections, label))
    warnings.extend(checkCodeOutputTerms(sections, label))
    warnings.extend(checkQuizGrounding(ch, sections, label))
    warnings.extend(checkQuizDepth(ch, label))
    return errors, warnings


SKIPPED_DERIV_PATTERNS = (
    r"做?变分求极值[^，。；\n]{0,20}(?:得到|可得)",
    r"(?:移项|取对数|整理|化简)[^，。；\n]{0,12}(?:即可|易得|可得|反解出)",
    r"(?:易得|显然可得|同理可得|同理可证|不难推出|容易验证|无需赘述|顾名思义)",
    r"(?:由此|从而|进而)(?:必然导致|必然引发|自然会引发)",
)

CODE_SYNTAX_WATCH = (
    ("finally", ("finally", "无论是否报错", "异常", "必定执行", "一定会执行")),
    ("no_grad", ("no_grad", "不算梯度", "关闭梯度", "反向传播", "省显存")),
    ("gather", ("gather", "按索引", "挑出", "取出对应", "下标取值")),
    ("clamp", ("clamp", "截断", "兜底", "越界", "负数")),
    ("[:, :-1", (":-1", "右移一位", "错开一位", "预测下一个", "对齐")),
)


def checkSkippedDerivations(joinedProse, label):
    """全学科跳步推导检查：拦截公式与因果论证中的跨步偷懒措辞。"""
    hits = [m.group(0) for pat in SKIPPED_DERIV_PATTERNS for m in [re.search(pat, joinedProse)] if m]
    if not hits:
        return []
    return [f"[{label}] 检测到全学科跳步/防御性省略措辞（{', '.join(hits[:3])}），请补全中间因果或代数推导步骤与具体实例验收"]


def checkConsecutiveEqs(sections, label):
    warns = []
    for secNum, _, blks in sections:
        eqPositions = [i for i, b in enumerate(blks) if b.get("type") == "eq"]
        for a, b in zip(eqPositions, eqPositions[1:]):
            mid = blks[a + 1 : b]
            midLen = sum(visible_text_len(block_prose_text(x)) for x in mid)
            hasEnum = any(x.get("type") == "enum" for x in mid)
            if midLen < 180 and not hasEnum:
                warns.append(f"[{label}] §{secNum} 公式 '{blks[a].get('id')}' 到 '{blks[b].get('id')}' 之间仅有 {midLen} 字过渡且无分步拆解，存在公式跳步")
    return warns


def checkUnexplainedCodeTokens(sections, label):
    warns = []
    for secNum, _, blks in sections:
        for idx, b in enumerate(blks):
            if b.get("type") != "code":
                continue
            codeStr = str(b.get("code") or b.get("text") or "")
            nearby = "\n".join(block_prose_text(x) for x in blks[max(0, idx - 1) : idx + 3])
            for token, cues in CODE_SYNTAX_WATCH:
                if token in codeStr and sum(1 for c in cues if c in nearby) < 2:
                    warns.append(f"[{label}] §{secNum} 代码使用了 '{token}'，但前后正文未讲清它是什么语法/为什么必须写/删掉会怎样（避免防御性编书）")
    return warns


COMMON_LATIN_ALLOW = {
    "http", "https", "json", "html", "true", "false", "none", "null",
    "python", "linux", "windows", "macos", "github", "arxiv", "bash",
    "demo", "step", "code", "text", "data", "file", "line", "user",
    "item", "list", "dict", "time", "date", "year", "name", "type",
    "model", "input", "output", "from", "with", "that", "this", "note",
    "book", "paper", "learn", "study", "table", "chart", "graph", "style",
    "class", "value", "error", "print", "write", "start", "close", "check",
    "beta", "alpha", "gamma", "delta", "sigma", "theta", "lambda", "omega",
    "logp", "probs", "float", "string", "array", "index", "count", "total",
    "prompt", "chosen", "rejected", "query", "score", "label", "labels",
    "train", "eval", "cluster", "local", "global", "server", "client",
}

LATIN_JARGON_RE = re.compile(
    r"\b(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)+|[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*|[a-z]{4,})\b"
)


def extractTermCore(rawName):
    """从 '{{term:名称|...}}' 的名称段提取主概念名。"""
    core = re.split(r"[（(]", rawName.strip(), maxsplit=1)[0].strip()
    return core if len(core) >= 2 else ""


def collectTermRegistry(sections):
    """按阅读顺序收集每条首次用 {{term:...}} 定义的概念及其坐标。"""
    reg = {}
    for sIdx, (secNum, _, blks) in enumerate(sections):
        for bIdx, b in enumerate(blks):
            txt = block_prose_text(b)
            for m in re.finditer(r"\{\{term:([^|}]+)\|", txt):
                core = extractTermCore(m.group(1))
                if core and core not in reg:
                    reg[core] = (sIdx, bIdx, secNum)
    return reg


def checkConceptBudget(sections, label):
    """检查单节新引入术语数是否超过概念预算（每节建议 <=3，超 4 告警）。"""
    warns = []
    for secNum, _, blks in sections:
        joined = "\n".join(block_prose_text(b) for b in blks)
        terms = {extractTermCore(m.group(1)) for m in re.finditer(r"\{\{term:([^|}]+)\|", joined)}
        terms.discard("")
        if len(terms) > 4:
            warns.append(f"[{label}] §{secNum} 单节引入了 {len(terms)} 个新概念（建议 ≤ 3 个、最多 4 个），存在术语堆砌风险，请把非核心概念改说大白话或拆节")
    return warns


def checkForwardRefTerms(sections, label):
    """拦截全学科“先用后讲”：正文先裸用某概念，后几节才正式定义。"""
    reg = collectTermRegistry(sections)
    warns, reported = [], set()
    for sIdx, (secNum, _, blks) in enumerate(sections):
        for bIdx, b in enumerate(blks):
            vis = re.sub(r"\{\{term:([^|}]+)\|[^}]+\}\}", r"\1", block_prose_text(b))
            for core, (dSec, dBlk, dNum) in reg.items():
                if (sIdx, bIdx) >= (dSec, dBlk) or core in reported or dSec == sIdx:
                    continue
                if core in vis and not has_local_acronym_explanation(core, vis):
                    reported.add(core)
                    warns.append(f"[{label}] 先用后讲：概念 '{core}' 在 §{secNum} 首次裸用，却直到 §{dNum} 才解释，请当场讲清或删改措辞")
    return warns


def stripProseForLatin(txt):
    """清理 URL、行内代码、LaTeX 指令、数学块引用与术语释义，仅留纯正文。"""
    s = re.sub(r"https?://\S+", " ", txt)
    s = re.sub(r"`[^`]*`|\$[^$]*\$|\\[a-zA-Z]+", " ", s)
    s = re.sub(r"\{\{(?:fig|tab|eq):[^}]+\}\}", " ", s)
    return re.sub(r"\{\{term:[^|}]+\|[^}]+\}\}", " ", s)


def collectLatinExplained(rawTxt):
    """提取在当前块中通过 {{term:...}} 或带反引号的中文定义句已解释的英文术语。"""
    found = set()
    for m in re.finditer(r"\{\{term:([^|}]+)\|([^}]+)\}\}", rawTxt):
        found.update(w.lower() for w in LATIN_JARGON_RE.findall(m.group(1)))
    for m in re.finditer(r"(?:叫|叫做|称为|记作|即|就是|英文|工程上)[^，。；\n`]{0,10}`([^`]+)`|`([^`]+)`\s*[（(]", rawTxt):
        found.update(w.lower() for w in LATIN_JARGON_RE.findall(m.group(1) or m.group(2)))
    return found


def scanBlockLatin(clean, window, known, secNum, label):
    """扫描单个块内首次裸奔的英文术语，并把已出现的记入概念账本。"""
    warns = []
    for tok in LATIN_JARGON_RE.findall(clean):
        low = tok.lower()
        explained = low in known or has_local_acronym_explanation(tok, window)
        known.add(low)
        if not explained:
            warns.append(f"[{label}] §{secNum} 英文术语 '{tok}' 首次出现时未解释（裸奔），请当场用大白话交代含义或直接改用中文日常词")
    return warns


def checkNakedLatinTerms(sections, label):
    """捕捉正文里未解释就裸奔的英文小写/连字符/驼峰术语（如 on-policy、logits、sigmoid）。"""
    known, warns = set(COMMON_LATIN_ALLOW), []
    for secNum, _, blks in sections:
        prev = ""
        for b in blks:
            if b.get("type") == "eq":
                continue
            raw = block_prose_text(b)
            known.update(collectLatinExplained(raw))
            clean = stripProseForLatin(raw)
            warns.extend(scanBlockLatin(clean, prev + "\n" + clean, known, secNum, label))
            prev = clean
    return warns


TRIVIAL_CODE_APIS = {
    "print", "range", "len", "int", "float", "str", "list", "dict", "set",
    "append", "items", "keys", "values", "get", "join", "split", "strip",
    "format", "tolist", "size", "shape", "item", "mean", "sum", "round",
}
PRACTICAL_QUIZ_CUES = (
    "如果", "假如", "删掉", "写反", "改", "报错", "异常", "故障", "崩溃",
    "排障", "诊断", "方案", "选型", "场景", "实验", "算", "代入", "验证",
    "微调", "线上", "病例", "案情", "政策", "成本", "为什么", "为何",
)
SHALLOW_QUIZ_RE = re.compile(r"(?:以下哪项是.{1,16}的定义|什么是.{1,14}[？?]|请简述.{1,20}(?:区别|特点|概念|定义)|是指[（(])")


def extractCodeApis(codeStr):
    """提取代码块中的自定义函数与非基础库函数/方法调用名。"""
    defs = re.findall(r"\bdef\s+([A-Za-z_][A-Za-z0-9_]{2,})\s*\(", codeStr)
    calls = re.findall(r"\.([A-Za-z_][A-Za-z0-9_]{2,})\s*\(", codeStr)
    seen, out = set(), []
    for name in defs + calls:
        if name not in TRIVIAL_CODE_APIS and name not in seen:
            seen.add(name)
            out.append(name)
    return out


def checkCodeApiCoverage(sections, label):
    """检查代码块中调用的库函数/自定义函数是否在前后正文逐一交代了用途。"""
    warns = []
    for secNum, _, blks in sections:
        for idx, b in enumerate(blks):
            if b.get("type") != "code" or b.get("lang") in ("bash", "syntax", "text"):
                continue
            apis = extractCodeApis(str(b.get("code") or b.get("text") or ""))
            nearby = "\n".join(block_prose_text(x) for x in blks[max(0, idx - 1) : idx + 4])
            missing = [a for a in apis if a not in nearby]
            if len(missing) >= 3:
                warns.append(f"[{label}] §{secNum} 代码调用了 {len(missing)} 个未在前后正文解释用途的函数（{', '.join(missing[:6])}），请按学习者水平逐一讲清用途与参数")
    return warns


def checkCodeOutputTerms(sections, label):
    """拦截代码 print/result 输出中冒出但正文未交代的中英文标签（如'左簇均值'/'Left cluster mean'）。"""
    warns = []
    for secNum, _, blks in sections:
        for idx, b in enumerate(blks):
            if b.get("type") != "code":
                continue
            outSrc = re.sub(r"#.*", "", str(b.get("code") or b.get("text") or "")) + "\n" + str(b.get("result") or "")
            labels = re.findall(r"([\u4e00-\u9fff]{3,8})\s*[:：]", outSrc) + re.findall(r"['\"]([A-Za-z][A-Za-z0-9 _-]{4,24})\s*[:：]", outSrc)
            nearby = "\n".join(block_prose_text(x) for i, x in enumerate(blks[max(0, idx - 2) : idx + 3]) if i != min(2, idx)).lower()
            unseen = [lb for lb in dict.fromkeys(labels) if lb.lower() not in nearby]
            if unseen:
                warns.append(f"[{label}] §{secNum} 代码输出了正文未交代含义的标签（{', '.join(unseen[:4])}），请先在正文讲清该概念再打印")
    return warns


def collectTaughtCorpus(sections):
    """拼合本章已讲授的正文与代码文本（不含习题），用于检验习题知识闭环。"""
    chunks = []
    for _, _, blks in sections:
        for b in blks:
            chunks.append(block_prose_text(b))
            if b.get("type") == "code":
                chunks.append(str(b.get("code") or b.get("text") or ""))
    return "\n".join(chunks)


def checkQuizGrounding(ch, sections, label):
    """检查习题考查的标识词/变量/接口是否确已在正文讲过，防止知识缺失假闭环。"""
    corpus = collectTaughtCorpus(sections)
    ex = ch.get("exercises") or {}
    items = (ex.get("single_choice") or []) + (ex.get("short_answer") or [])
    warns = []
    for idx, it in enumerate(items, 1):
        txt = f"{it.get('q', '')} {it.get('answer', '')}"
        snippets = re.findall(r"`([^`]+)`", txt)
        tokens = [w for sn in snippets for w in re.findall(r"\b[A-Za-z_][A-Za-z0-9_]{3,}\b", sn)]
        missing = [t for t in dict.fromkeys(tokens) if t not in corpus]
        if missing:
            warns.append(f"[{label}] 习题第 {idx} 题考查了正文未出现过的标识符（{', '.join(missing[:3])}），疑似存在知识缺失或超纲，请补回正文或改题")
    return warns


def checkQuizDepth(ch, label):
    """检查习题是否聚焦工程实践与现实问题诊断，避免停留在浅层背概念水平。"""
    ex = ch.get("exercises") or {}
    items = (ex.get("single_choice") or []) + (ex.get("short_answer") or [])
    if not items:
        return []
    shallow = [i for i, it in enumerate(items, 1) if SHALLOW_QUIZ_RE.search(str(it.get("q", "")))]
    practical = sum(1 for it in items if any(c in str(it.get("q", "")) for c in PRACTICAL_QUIZ_CUES))
    warns = []
    if shallow:
        warns.append(f"[{label}] 习题第 {shallow} 题疑似停留在浅层概念背诵，建议改写为工程实践/现实场景诊断或定量推演题")
    if practical / len(items) < 0.7:
        warns.append(f"[{label}] 实战/场景诊断类习题占比偏低（{practical}/{len(items)}），建议至少 70% 聚焦工程实践或现实理论问题")
    return warns


STALE_PATTERNS = (
    (r"openai\.ChatCompletion\.create", "已废弃旧版 OpenAI v0 接口，请改用新版 SDK / Responses API"),
    (r"\burllib2\b", "已淘汰的 Python 2 urllib2，请改用标准库 urllib.request 或 httpx"),
    (r"\bAgentExecutor\b", "旧版框架已弃用封装，请改用现代标准循环或当前主流接口"),
    (r"(?:截至\s*202[0-3]\s*年|202[0-3]\s*年最新|目前最新[（(]202[0-3])", "内容停留在旧年份口径，请重新联网核查当下最新进展"),
)


def checkFreshnessIssues(ch, joinedProse, label):
    """检查正文与代码块中是否存在已废弃 API 或明显落后时代的陈旧口径。"""
    codeChunks = [
        str(b.get("code") or b.get("text") or "")
        for _, _, blks in iter_chapter_blocks(ch)
        for b in blks
        if b.get("type") == "code"
    ]
    hay = joinedProse + "\n" + "\n".join(codeChunks)
    return [
        f"[{label}] 时效性提醒：命中 '{m.group(0)}' —— {hint}"
        for pat, hint in STALE_PATTERNS
        for m in [re.search(pat, hay)]
        if m
    ]


def main():
    if len(sys.argv) < 2:
        print("用法: python3 validate_chapter.py <chapter_or_course.json> [...]")
        sys.exit(2)

    all_errors = []
    all_warnings = []
    total_chapters = 0

    for arg in sys.argv[1:]:
        p = Path(arg)
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception as exc:
            all_errors.append(f"[{p}] JSON 解析失败：{exc}")
            continue

        if isinstance(data, dict) and isinstance(data.get("chapters"), list):
            for ch in data["chapters"]:
                total_chapters += 1
                e, w = validate_chapter(ch, str(p))
                all_errors.extend(e)
                all_warnings.extend(w)
        elif isinstance(data, dict):
            total_chapters += 1
            e, w = validate_chapter(data, str(p))
            all_errors.extend(e)
            all_warnings.extend(w)
        else:
            all_errors.append(f"[{p}] 顶层必须为 JSON 对象")

    print(f"已校验章节数：{total_chapters}")
    for w in all_warnings:
        print(f"  [WARN]  {w}")
    for e in all_errors:
        print(f"  [ERROR] {e}")

    if all_errors:
        print(f"\n校验失败：{len(all_errors)} 个错误，{len(all_warnings)} 条警告。")
        sys.exit(1)
    print(f"\n校验通过：0 个错误，{len(all_warnings)} 条警告。")
    sys.exit(0)


if __name__ == "__main__":
    main()
