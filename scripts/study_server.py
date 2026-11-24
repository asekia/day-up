#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Day-Up 本地零依赖统一书库与伴学服务器（单端口管理全部教材 + 直连当前 Agent）
用法：
  1) 统一书库模式（推荐，像 Z-Lib 一样一个端口 18770 放全部教材，自动复用已运行端口）：
     python3 study_server.py
     python3 study_server.py --library /path/to/library --port 18770 --agent-cmd "<当前Agent非交互命令>"
  2) 将任意外部目录的已有教材挂载到统一书架（无需搬移文件）：
     python3 study_server.py --add /path/to/existing_book [--slug book-name]
  3) 单书兼容模式（仅预览单本教材目录）：
     python3 study_server.py --dir /path/to/single_book --port 18770
"""

import argparse
import html
import json
import mimetypes
import os
import re
import shlex
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DAYUP_TUTOR_SYSTEM = (
    "你是正在一对一陪学生读教材的资深一线导师，必须用干净、直接、像真人面对面聊天一样的人话回答追问。\n"
    "硬规矩：\n"
    "1) 循循渐进推演、杜绝防御性跳步：先用 1~2 句摆出极简主干场景，再按「A 引发 B → B 引发 C」一步一阶推演（严禁跨步说“显然/易得/由此必然导致”），先把主干讲透，最后再补例外、但书或工程护栏，严禁一上来背百科定义或复读原文；\n"
    "2) 严控概念预算、绝不顺嘴掉书袋：回答里禁止莫名冒出学生没问过的新术语或英文黑话；非核心概念直接用大白话讲动作，躲不开的新词必须在首次出现当句用半句话讲清；同时彻底禁用 AI 腔（「旨在、致力于、通过…从而实现…、进行…处理、本质上是…的体现、某种程度上、底层自动处理、大概就是」），每段最多 1 个破折号；\n"
    "3) 给一个极小具体例子或反例：用 2~3 个小数字、真实短输入或「删掉/改掉它会立刻出什么事故」把道理钉死，并顺带点明最容易混淆概念的区别；\n"
    "4) 紧跟时代：如果问到的做法近两年已被新标准/新接口替代，顺口提醒一句当前主流做法；\n"
    "5) 结尾附 1 个 10 秒能答出的极轻小反问确认学生真懂。全文紧凑清晰，220~420 字。\n"
    "正反口吻对照：\n"
    "× 坏答法：「牵涉痛旨在描述内脏缺血后通过神经会聚从而实现体表定位偏差的现象。」\n"
    "√ 好答法：「心脏和左肩皮肤的痛觉神经，进了脊髓后接在同一根往大脑报信的公共线路上。平时左肩天天被碰，大脑习惯把这条线的警报都算在左肩头上；所以心梗一爆发，大脑顺手报错了地址，病人就会觉得左肩剧痛。」"
)

HOST_CLI_FALLBACKS = [
    ("claude", ["-p"]),
    ("codex", ["exec", "--skip-git-repo-check", "-"]),
    ("gemini", ["-p", "{prompt}"]),
    ("opencode", ["run", "{prompt}"]),
    ("aider", ["--message", "{prompt}", "--no-git", "--yes"]),
]

NESTED_GUARD_ENV_KEYS = (
    "CLAUDECODE",
    "CLAUDE_CODE_ENTRYPOINT",
)

ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[a-zA-Z]")
COURSE_DATA_SCRIPT_RE = re.compile(
    r'<script[^>]+id=["\']course-data["\'][^>]*>(.*?)</script>',
    re.IGNORECASE | re.DOTALL,
)
HTML_TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def default_library_dir() -> Path:
    env_dir = os.environ.get("DAYUP_LIBRARY_DIR", "").strip()
    if env_dir:
        return Path(env_dir).expanduser().resolve()
    return (Path.home() / ".day-up" / "library").resolve()


def _strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text or "")


def _can_run_win_cmd() -> bool:
    if os.name == "nt":
        return True
    cmd_exe = shutil.which("cmd.exe")
    if not cmd_exe:
        return False
    try:
        r = subprocess.run([cmd_exe, "/c", "echo", "ok"], capture_output=True, text=True, timeout=3)
        return r.returncode == 0
    except Exception:
        return False


def _unwrap_win_cmd(cmd_path: str):
    """Windows 下将 npm .cmd 包装解包为 [bin.exe] 或 [node.exe, bin.js]，避免 cmd.exe 破坏多行中文提示词。"""
    try:
        txt = Path(cmd_path).read_text(encoding="utf-8", errors="ignore")
        base_dir = Path(cmd_path).parent

        m_exe = re.search(r'"%dp0%\\([^"]+\.exe)"', txt, flags=re.IGNORECASE)
        if m_exe:
            exe_file = base_dir / m_exe.group(1).replace("\\", os.sep)
            if exe_file.exists():
                return [str(exe_file)]

        m_js = re.search(r'"%dp0%\\([^"]+\.(?:js|mjs|cjs))"', txt, flags=re.IGNORECASE)
        if m_js:
            js_file = base_dir / m_js.group(1).replace("\\", os.sep)
            if js_file.exists():
                node_bin = base_dir / "node.exe"
                node_exe = str(node_bin) if node_bin.exists() else (shutil.which("node.exe") or shutil.which("node"))
                if node_exe:
                    return [node_exe, str(js_file)]
    except Exception:
        pass
    return None


def _resolve_cli_argv(bin_name: str, extra_args: list, win_cmd_ok: bool):
    if os.sep in bin_name or (os.altsep and os.altsep in bin_name):
        p = Path(bin_name)
        if not p.exists():
            return None
        if os.name == "nt" and str(p).lower().endswith((".cmd", ".bat")):
            unwrapped = _unwrap_win_cmd(str(p))
            return (unwrapped or ["cmd.exe", "/c", str(p)]) + list(extra_args)
        return [str(p)] + list(extra_args)

    if os.name == "nt":
        path = shutil.which(f"{bin_name}.cmd") or shutil.which(f"{bin_name}.exe") or shutil.which(bin_name)
        if not path:
            return None
        if path.lower().endswith((".cmd", ".bat")):
            unwrapped = _unwrap_win_cmd(path)
            if unwrapped:
                return unwrapped + list(extra_args)
            return ["cmd.exe", "/c", path] + list(extra_args)
        return [path] + list(extra_args)

    path = shutil.which(bin_name)
    if path:
        is_wsl_win_mount = path.startswith("/mnt/")
        if not is_wsl_win_mount:
            return [path] + list(extra_args)
        if shutil.which("node") and not path.lower().endswith(".exe"):
            return [path] + list(extra_args)
        if win_cmd_ok:
            cmd_path = shutil.which(f"{bin_name}.cmd")
            if cmd_path:
                return ["cmd.exe", "/c", f"{bin_name}.cmd"] + list(extra_args)
    elif win_cmd_ok:
        cmd_path = shutil.which(f"{bin_name}.cmd")
        if cmd_path:
            return ["cmd.exe", "/c", f"{bin_name}.cmd"] + list(extra_args)
    return None


def _get_parent_executables() -> list:
    if os.name == "nt":
        return []
    execs = []
    try:
        pid = os.getppid()
        for _ in range(8):
            if pid <= 1:
                break
            proc_dir = Path(f"/proc/{pid}")
            if not proc_dir.exists():
                break
            raw_cmd = (proc_dir / "cmdline").read_bytes().split(b"\x00")
            argv0 = raw_cmd[0].decode("utf-8", errors="ignore").lower() if raw_cmd else ""
            argv1 = (
                raw_cmd[1].decode("utf-8", errors="ignore").lower()
                if len(raw_cmd) > 1 and Path(argv0).stem in ("node", "python", "python3")
                else ""
            )
            comm = (proc_dir / "comm").read_text(encoding="utf-8", errors="ignore").strip().lower()
            execs.append(f"{comm} {argv0} {argv1}")
            stat_txt = (proc_dir / "stat").read_text(encoding="utf-8", errors="ignore")
            rp = stat_txt.rfind(")")
            if rp < 0:
                break
            fields = stat_txt[rp + 2 :].split()
            pid = int(fields[1]) if len(fields) > 1 else 0
    except Exception:
        pass
    return execs


def _matches_host_env(name: str) -> bool:
    up = name.upper()
    for k, v in os.environ.items():
        if v and (k == up or k.startswith(up + "_") or k.startswith(up + "CODE")):
            return True
    return False


def _matches_host_parent(name: str, parent_execs: list) -> bool:
    pat = re.compile(rf"(?:^|[/\\@\s\-]){re.escape(name.lower())}(?:\b|\.js|\.cmd|\.exe)")
    return any(pat.search(item) for item in parent_execs)


def _split_cmd(raw_cmd: str) -> list:
    tokens = shlex.split(raw_cmd, posix=(os.name != "nt"))
    if os.name == "nt":
        cleaned = []
        for t in tokens:
            if len(t) >= 2 and t[0] == t[-1] and t[0] in ('"', "'"):
                cleaned.append(t[1:-1])
            else:
                cleaned.append(t)
        return cleaned
    return tokens


def build_cli_entry(raw_cmd: str, win_cmd_ok: bool):
    tokens = _split_cmd(raw_cmd)
    if not tokens:
        return None
    bin_name, extra_args = tokens[0], tokens[1:]
    argv = _resolve_cli_argv(bin_name, extra_args, win_cmd_ok) or tokens
    input_mode = "arg" if "{prompt}" in argv else "stdin"
    return {
        "name": Path(bin_name).stem,
        "argv": argv,
        "input_mode": input_mode,
    }


def _load_custom_agent_configs(base_dir: Path) -> list:
    items = []
    for cfg_path in (base_dir / "agents.json", Path.home() / ".day-up" / "agents.json"):
        if not cfg_path.exists():
            continue
        try:
            raw = json.loads(cfg_path.read_text(encoding="utf-8"))
            entries = raw if isinstance(raw, list) else raw.get("agents", [])
            for it in entries:
                if isinstance(it, dict) and it.get("cmd"):
                    items.append((str(it.get("name") or "").strip(), str(it["cmd"]).strip()))
        except Exception:
            pass
    return items


def resolve_current_agent(base_dir: Path, custom_cmd: str = ""):
    """只绑定唯一一个“当前正在使用的 Agent”，不罗列多个无关 CLI。"""
    win_cmd_ok = _can_run_win_cmd()

    if custom_cmd:
        return build_cli_entry(custom_cmd, win_cmd_ok)

    parent_execs = _get_parent_executables()
    candidates = []
    for name, cmd_str in _load_custom_agent_configs(base_dir):
        entry = build_cli_entry(cmd_str, win_cmd_ok)
        if entry:
            candidates.append((name or entry["name"], entry))

    for bin_name, extra_args in HOST_CLI_FALLBACKS:
        argv = _resolve_cli_argv(bin_name, extra_args, win_cmd_ok)
        if argv:
            candidates.append((
                bin_name,
                {
                    "name": bin_name,
                    "argv": argv,
                    "input_mode": "arg" if "{prompt}" in argv else "stdin",
                },
            ))

    for match_key, entry in candidates:
        if _matches_host_env(match_key):
            return entry
    for match_key, entry in candidates:
        if _matches_host_parent(match_key, parent_execs):
            return entry

    return None


def render_markdown_report(data: dict) -> str:
    title = data.get("course_title", "交互式教材")
    updated = data.get("updated_at", "")
    loc = data.get("active_location", "书名页")
    mc = data.get("mastered_count", 0)
    tot = data.get("total_unlocked_sections", 0)
    qs = data.get("quiz_summary", {}) or {}
    acc = qs.get("accuracy_pct")
    acc_str = f"（正确率 {acc}%）" if acc is not None else ""

    lines = [
        f"# 实时学习进度档案：{title}",
        "",
        f"- 最后活跃时间：`{updated}`",
        f"- 当前阅读位置：{loc}",
        f"- 已解锁小节掌握：`{mc} / {tot}`",
        f"- 单选题自测：`{qs.get('answered', 0)} / {qs.get('total', 0)}`，答对 `{qs.get('correct', 0)}` 题{acc_str}",
        "",
        "## 一、全书目录进度",
    ]
    for c in data.get("unlocked_chapters", []):
        lines.append(
            f"- [学习中/已解锁] 第 {c.get('num')} 章《{c.get('title')}》：已掌握 {c.get('mastered_sections', 0)}/{c.get('total_sections', 0)} 节"
        )
    for u in data.get("upcoming_syllabus", []):
        lines.append(f"- [待学] 第 {u.get('num')} 章《{u.get('title')}》")

    doubts = data.get("doubt_sections", [])
    if doubts:
        lines.extend(["", "## 二、用户标记的疑问与卡壳点（AI 下一轮必须先解答）"])
        for d in doubts:
            note = f" —— {d.get('note')}" if d.get("note") else ""
            lines.append(f"- **{d.get('sec')} {d.get('title')}**{note}")

    wrongs = qs.get("wrong_questions", [])
    if wrongs:
        lines.extend(["", "## 三、错题记录（AI 需针对性复盘）"])
        for w in wrongs:
            lines.append(
                f"- [{w.get('chapter', '')} {w.get('ref', '')}] {w.get('question', '')}（用户选 `{w.get('picked')}`，正解 `{w.get('correct')}`）"
            )

    lines.append("")
    return "\n".join(lines)


def load_learner_profile(book_dir: Path) -> str:
    pf = book_dir / "learner_profile.json"
    if not pf.exists():
        return ""
    try:
        data = json.loads(pf.read_text(encoding="utf-8"))
        return "\n学习者画像：" + json.dumps(data, ensure_ascii=False)
    except Exception:
        return ""


def call_llm_api(provider: str, base: str, model: str, api_key: str, system_prompt: str, user_prompt: str) -> str:
    if provider == "gemini":
        m = model or "gemini-2.5-flash"
        root = (base or "https://generativelanguage.googleapis.com/v1beta").rstrip("/")
        url = f"{root}/models/{urllib.parse.quote(m, safe='')}:generateContent?key={urllib.parse.quote(api_key or '', safe='')}"
        payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts).strip()

    root = (base or "http://127.0.0.1:11434/v1").rstrip("/")
    url = f"{root}/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": model or "qwen2.5:7b",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.4,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return (data.get("choices", [{}])[0].get("message", {}).get("content", "") or "").strip()


def call_cli_entry(entry: dict, full_prompt: str, cwd: Path) -> str:
    argv = list(entry["argv"])
    env = os.environ.copy()
    for guard_key in NESTED_GUARD_ENV_KEYS:
        env.pop(guard_key, None)
    env.setdefault("PYTHONIOENCODING", "utf-8")
    env["NO_COLOR"] = "1"
    env["FORCE_COLOR"] = "0"

    run_kwargs = {
        "capture_output": True,
        "text": True,
        "encoding": "utf-8",
        "errors": "replace",
        "timeout": 120,
        "cwd": str(cwd),
        "env": env,
    }
    if os.name == "nt":
        run_kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0)

    if entry.get("input_mode") == "arg" or "{prompt}" in argv:
        prompt_arg = full_prompt
        if argv and argv[0].lower().endswith("cmd.exe"):
            prompt_arg = re.sub(r"[\r\n]+", " ", prompt_arg)
        argv = [prompt_arg if a == "{prompt}" else a for a in argv]
        run_kwargs["stdin"] = subprocess.DEVNULL
        proc = subprocess.run(argv, **run_kwargs)
    else:
        proc = subprocess.run(argv, input=full_prompt, **run_kwargs)

    stdout_txt = _strip_ansi(proc.stdout).strip()
    stderr_txt = _strip_ansi(proc.stderr).strip()
    if proc.returncode != 0:
        detail = stderr_txt or stdout_txt
        if stderr_txt and stdout_txt and stderr_txt != stdout_txt:
            detail = f"{stderr_txt}\n{stdout_txt}"
        if not detail:
            preview = " ".join(a if len(a) <= 40 else a[:37] + "..." for a in argv[:4])
            detail = f"无错误输出（命令：{preview}）"
        raise RuntimeError(f"当前 Agent 返回码 {proc.returncode}: {detail[:500]}")
    if not stdout_txt and stderr_txt:
        raise RuntimeError(f"当前 Agent 未返回正文：{stderr_txt[:400]}")
    return stdout_txt


# ======================== 统一书库：书籍扫描、元数据提取与书架首页 ========================

def _slugify(name: str) -> str:
    s = re.sub(r"[^\w\u4e00-\u9fff\-]+", "-", str(name or "").strip()).strip("-")
    return s.lower() or "book"


def _find_entry_html(book_dir: Path):
    for fname in ("index.html", "starter.html"):
        p = book_dir / fname
        if p.is_file():
            return p
    return None


def _read_library_registry(library_dir: Path) -> dict:
    reg_file = library_dir / "library.json"
    if reg_file.is_file():
        try:
            loaded = json.loads(reg_file.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                loaded.setdefault("books", [])
                loaded.setdefault("meta", {})
                return loaded
        except Exception:
            pass
    return {"books": [], "meta": {}}


def _write_library_registry(library_dir: Path, reg: dict):
    library_dir.mkdir(parents=True, exist_ok=True)
    reg_file = library_dir / "library.json"
    tmp = reg_file.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    tmp.replace(reg_file)


def register_book_in_library(library_dir: Path, book_dir: Path, slug_override: str = "") -> str:
    """将任意路径的教材目录登记到 <library_dir>/library.json（不移动原文件）。"""
    book_dir = book_dir.resolve()
    if not _find_entry_html(book_dir):
        raise SystemExit(f"目录中未找到 index.html 或 starter.html：{book_dir}")
    slug = _slugify(slug_override or book_dir.name)
    reg = _read_library_registry(library_dir)
    books = [b for b in reg["books"] if isinstance(b, dict) and b.get("slug") != slug]
    books.append({"slug": slug, "dir": str(book_dir)})
    reg["books"] = books
    _write_library_registry(library_dir, reg)
    return slug


def update_book_user_meta(library_dir: Path, slug: str, patch: dict) -> dict:
    """持久化书架上的收藏状态与自定义标签到 <library_dir>/library.json。"""
    reg = _read_library_registry(library_dir)
    meta_map = reg.get("meta") if isinstance(reg.get("meta"), dict) else {}
    cur = meta_map.get(slug) if isinstance(meta_map.get(slug), dict) else {}
    if "bookmarked" in patch:
        cur["bookmarked"] = bool(patch["bookmarked"])
    if "tags" in patch and isinstance(patch["tags"], list):
        cleaned = []
        for t in patch["tags"]:
            s = str(t).strip()[:24]
            if s and s not in cleaned:
                cleaned.append(s)
        cur["tags"] = cleaned[:8]
    meta_map[slug] = cur
    reg["meta"] = meta_map
    _write_library_registry(library_dir, reg)
    return cur


def _format_size(num_bytes: int) -> str:
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.2f} MB"
    return f"{max(1, num_bytes) / 1024:.1f} KB"


def _find_cover_file(book_dir: Path):
    for name in ("cover.png", "cover.jpg", "cover.jpeg", "cover.webp", "cover.svg"):
        p = book_dir / name
        if p.is_file():
            return name
    return ""


def _extract_book_meta(slug: str, book_dir: Path, entry_html: Path, user_meta: dict) -> dict:
    title = slug
    subtitle = ""
    chapters_preview = []
    unlocked_chapters = 0
    total_syllabus = 0

    course_obj = None
    for cand in (book_dir / "data" / "course.json", book_dir / "course.json"):
        if cand.is_file():
            try:
                course_obj = json.loads(cand.read_text(encoding="utf-8"))
                break
            except Exception:
                pass

    embedded = None
    try:
        raw_html = entry_html.read_text(encoding="utf-8", errors="ignore")
        m_data = COURSE_DATA_SCRIPT_RE.search(raw_html)
        if m_data:
            embedded = json.loads(m_data.group(1))
        else:
            m_title = HTML_TITLE_RE.search(raw_html)
            if m_title:
                title = html.unescape(m_title.group(1)).strip() or title
    except Exception:
        pass

    if isinstance(embedded, dict):
        cinfo = embedded.get("course") if isinstance(embedded.get("course"), dict) else {}
        title = str(cinfo.get("title") or title).strip()
        subtitle = str(cinfo.get("subtitle") or subtitle).strip()
        chs = embedded.get("chapters") if isinstance(embedded.get("chapters"), list) else []
        syl = embedded.get("syllabus") if isinstance(embedded.get("syllabus"), list) else []
        unlocked_chapters = len(chs)
        total_syllabus = max(len(syl), unlocked_chapters)
        seen_nums = set()
        for c in chs:
            if isinstance(c, dict):
                num = c.get("num")
                seen_nums.add(num)
                chapters_preview.append({"num": num, "title": str(c.get("title") or ""), "unlocked": True})
        for s in syl:
            if isinstance(s, dict) and s.get("num") not in seen_nums:
                chapters_preview.append({"num": s.get("num"), "title": str(s.get("title") or ""), "unlocked": False})
    elif isinstance(course_obj, dict):
        cinfo = course_obj.get("course") if isinstance(course_obj.get("course"), dict) else course_obj
        title = str(cinfo.get("title") or title).strip()
        subtitle = str(cinfo.get("subtitle") or subtitle).strip()
        syl = course_obj.get("syllabus") if isinstance(course_obj.get("syllabus"), list) else []
        total_syllabus = len(syl)
        for s in syl:
            if isinstance(s, dict):
                chapters_preview.append({"num": s.get("num"), "title": str(s.get("title") or ""), "unlocked": False})

    mastered = 0
    total_sec = 0
    doubt_count = 0
    active_loc = ""
    updated_at = ""
    quiz_acc = None
    prog_file = book_dir / "progress.json"
    if prog_file.is_file():
        try:
            p = json.loads(prog_file.read_text(encoding="utf-8"))
            mastered = int(p.get("mastered_count") or 0)
            total_sec = int(p.get("total_unlocked_sections") or 0)
            doubt_count = len(p.get("doubt_sections") or [])
            active_loc = str(p.get("active_location") or "")
            updated_at = str(p.get("updated_at") or "")
            qs = p.get("quiz_summary") or {}
            if qs.get("accuracy_pct") is not None:
                quiz_acc = qs.get("accuracy_pct")
        except Exception:
            pass

    st = entry_html.stat()
    mtime = max(st.st_mtime, prog_file.stat().st_mtime if prog_file.is_file() else 0)
    cover_name = _find_cover_file(book_dir)
    um = user_meta if isinstance(user_meta, dict) else {}

    return {
        "slug": slug,
        "title": title,
        "subtitle": subtitle,
        "url": f"/books/{urllib.parse.quote(slug)}/",
        "download_url": f"/books/{urllib.parse.quote(slug)}/download",
        "cover_url": f"/books/{urllib.parse.quote(slug)}/{urllib.parse.quote(cover_name)}" if cover_name else "",
        "dir": str(book_dir),
        "entry_file": entry_html.name,
        "format_size": f"HTML, {_format_size(st.st_size)}",
        "unlocked_chapters": unlocked_chapters,
        "total_chapters": total_syllabus,
        "chapters": chapters_preview[:10],
        "mastered_count": mastered,
        "total_sections": total_sec,
        "doubt_count": doubt_count,
        "quiz_accuracy": quiz_acc,
        "active_location": active_loc,
        "bookmarked": bool(um.get("bookmarked", False)),
        "tags": list(um.get("tags") or []),
        "updated_at": updated_at or datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M"),
        "mtime_ts": int(mtime),
    }


def discover_books(library_dir: Path) -> tuple:
    """动态扫描书库目录与 library.json，返回 (book_meta_list, slug_to_dir_map)。"""
    slug_to_dir = {}
    metas = []
    reg = _read_library_registry(library_dir)
    meta_map = reg.get("meta") if isinstance(reg.get("meta"), dict) else {}

    if library_dir.exists():
        for child in sorted(library_dir.iterdir()):
            if not child.is_dir() or child.name.startswith("."):
                continue
            entry = _find_entry_html(child)
            if not entry:
                continue
            slug = child.name
            slug_to_dir[slug] = child.resolve()
            metas.append(_extract_book_meta(slug, child.resolve(), entry, meta_map.get(slug, {})))

    for item in reg.get("books", []):
        if not isinstance(item, dict):
            continue
        slug = str(item.get("slug") or "").strip()
        bdir = Path(str(item.get("dir") or "")).expanduser().resolve()
        if not slug or slug in slug_to_dir or not bdir.is_dir():
            continue
        entry = _find_entry_html(bdir)
        if not entry:
            continue
        slug_to_dir[slug] = bdir
        metas.append(_extract_book_meta(slug, bdir, entry, meta_map.get(slug, {})))

    metas.sort(key=lambda m: (1 if m.get("bookmarked") else 0, m.get("mtime_ts", 0)), reverse=True)
    return metas, slug_to_dir


def render_library_home_html(library_dir: Path, books: list) -> str:
    tpl_path = Path(__file__).resolve().parent.parent / "assets" / "library.html"
    tpl = tpl_path.read_text(encoding="utf-8")
    books_json = json.dumps(books, ensure_ascii=False).replace("</", "<\\/")
    return tpl.replace("{{BOOKS_JSON}}", books_json)


def _check_existing_library_server(host: str, port: int, library_dir: Path) -> bool:
    """检查目标端口是否已有同一个 Day-Up 统一书库服务在运行，避免重复开新端口。"""
    url = f"http://{host}:{port}/api/library/health"
    try:
        with urllib.request.urlopen(url, timeout=1.2) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("ok") and data.get("service") == "day-up-library":
            running_dir = Path(str(data.get("library_dir") or "")).resolve()
            if running_dir == library_dir.resolve():
                return True
    except Exception:
        pass
    return False


# ======================== HTTP 处理器（统一书库 + 单书双兼容） ========================

def make_handler(mode: str, root_dir: Path, active_cli):
    env_provider = os.environ.get("DAYUP_PROVIDER", "openai").strip().lower()
    env_base = os.environ.get("DAYUP_API_BASE", "").strip()
    env_key = os.environ.get("DAYUP_API_KEY", "").strip()
    env_model = os.environ.get("DAYUP_MODEL", "").strip()

    def read_chat_log(book_dir: Path) -> dict:
        chat_json = book_dir / "agent_chat.json"
        if chat_json.exists():
            try:
                d = json.loads(chat_json.read_text(encoding="utf-8"))
                if isinstance(d, dict) and isinstance(d.get("messages"), list):
                    return d
            except Exception:
                pass
        return {"messages": []}

    def write_chat_log(book_dir: Path, log_obj: dict):
        chat_json = book_dir / "agent_chat.json"
        tmp = chat_json.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(log_obj, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
        tmp.replace(chat_json)

    def current_agent_status() -> dict:
        if active_cli:
            return {"mode": "cli", "label": "当前 Agent"}
        if env_base or env_key or env_model:
            return {"mode": "api", "label": "当前 Agent"}
        return {"mode": "bridge", "label": "当前 Agent"}

    class StudyHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root_dir), **kwargs)

        def log_message(self, fmt, *args):
            pass

        def _send_bytes(self, code: int, body: bytes, content_type: str):
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _send_json(self, code: int, obj: dict):
            body = json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")
            self._send_bytes(code, body, "application/json; charset=utf-8")

        def _read_json_body(self) -> dict:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(min(length, 2 * 1024 * 1024))
            return json.loads(raw.decode("utf-8"))

        def _serve_file_safe(self, base_dir: Path, rel_path: str):
            rel = urllib.parse.unquote(rel_path).lstrip("/")
            if not rel:
                target = _find_entry_html(base_dir)
                if not target:
                    self.send_error(404, "Book entry HTML not found")
                    return
            else:
                target = (base_dir / rel).resolve()
                try:
                    target.relative_to(base_dir.resolve())
                except ValueError:
                    self.send_error(403, "Forbidden")
                    return
                if target.is_dir():
                    target = _find_entry_html(target)
                if not target or not target.is_file():
                    self.send_error(404, "Not Found")
                    return
            ctype, _ = mimetypes.guess_type(str(target))
            if not ctype:
                ctype = "application/octet-stream"
            elif ctype.startswith("text/") or ctype in ("application/json", "application/javascript"):
                ctype += "; charset=utf-8"
            self._send_bytes(200, target.read_bytes(), ctype)

        def _resolve_book_route(self, path: str):
            """解析 /books/<slug>/... 路由，返回 (book_dir, subpath) 或 (None, None)。"""
            m = re.match(r"^/books/([^/]+)(?:/(.*))?$", path)
            if not m:
                return None, None
            slug = urllib.parse.unquote(m.group(1))
            sub = m.group(2) if m.group(2) is not None else ""
            _, slug_map = discover_books(root_dir)
            bdir = slug_map.get(slug)
            return bdir, sub

        def _handle_book_api_get(self, book_dir: Path, api_path: str) -> bool:
            if api_path == "/api/progress":
                data = {}
                pf = book_dir / "progress.json"
                if pf.exists():
                    try:
                        data = json.loads(pf.read_text(encoding="utf-8"))
                    except Exception:
                        data = {}
                self._send_json(200, data)
                return True
            if api_path == "/api/agent/status":
                self._send_json(200, current_agent_status())
                return True
            if api_path == "/api/agent/messages":
                self._send_json(200, read_chat_log(book_dir))
                return True
            return False

        def _handle_book_api_post(self, book_dir: Path, api_path: str) -> bool:
            if api_path == "/api/progress":
                try:
                    data = self._read_json_body()
                    if not isinstance(data, dict):
                        raise ValueError("payload must be JSON object")
                    pf = book_dir / "progress.json"
                    pmd = book_dir / "progress_report.md"
                    tmp_json = pf.with_suffix(".json.tmp")
                    tmp_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
                    tmp_json.replace(pf)
                    pmd.write_text(render_markdown_report(data), encoding="utf-8", newline="\n")
                    self._send_json(200, {"ok": True})
                except Exception as exc:
                    self._send_json(400, {"ok": False, "error": str(exc)})
                return True

            if api_path == "/api/agent/chat":
                try:
                    req_obj = self._read_json_body()
                    question = str(req_obj.get("question", "")).strip()
                    full_prompt = str(req_obj.get("full_prompt", question)).strip()
                    ctx = req_obj.get("context") or {}
                    msg_id = str(req_obj.get("id") or f"u-{int(time.time()*1000)}")
                    now_str = datetime.now().strftime("%H:%M")

                    chat_log = read_chat_log(book_dir)
                    chat_log["messages"].append({
                        "id": msg_id,
                        "role": "user",
                        "question": question,
                        "full_prompt": full_prompt,
                        "context": ctx,
                        "time": now_str,
                        "answered": False,
                    })
                    write_chat_log(book_dir, chat_log)

                    sys_prompt = DAYUP_TUTOR_SYSTEM + load_learner_profile(book_dir)
                    reply = None

                    if active_cli:
                        reply = call_cli_entry(active_cli, f"{sys_prompt}\n\n{full_prompt}", book_dir)
                    elif env_base or env_key or env_model:
                        reply = call_llm_api(
                            provider=env_provider,
                            base=env_base,
                            model=env_model,
                            api_key=env_key,
                            system_prompt=sys_prompt,
                            user_prompt=full_prompt,
                        )

                    if reply is not None:
                        reply_id = f"a-{int(time.time()*1000)}"
                        chat_log["messages"][-1]["answered"] = True
                        chat_log["messages"].append({
                            "id": reply_id,
                            "role": "assistant",
                            "source": "当前 Agent",
                            "content": reply,
                            "time": datetime.now().strftime("%H:%M"),
                        })
                        write_chat_log(book_dir, chat_log)
                        self._send_json(200, {"ok": True, "reply": reply, "reply_id": reply_id, "source": "当前 Agent"})
                    else:
                        self._send_json(200, {"ok": True, "queued": True, "chat_file": str(book_dir / "agent_chat.json")})
                except urllib.error.HTTPError as exc:
                    body = exc.read().decode("utf-8", errors="ignore")[:300]
                    self._send_json(502, {"ok": False, "error": f"HTTP {exc.code}: {body}"})
                except Exception as exc:
                    self._send_json(500, {"ok": False, "error": str(exc)})
                return True

            return False

        def do_GET(self):
            path = self.path.split("?", 1)[0]

            if mode == "library":
                if path == "/api/library/health":
                    self._send_json(200, {"ok": True, "service": "day-up-library", "library_dir": str(root_dir)})
                    return
                if path == "/api/library/books":
                    books, _ = discover_books(root_dir)
                    self._send_json(200, {"library_dir": str(root_dir), "books": books})
                    return
                if path in ("/", "/index.html"):
                    books, _ = discover_books(root_dir)
                    page = render_library_home_html(root_dir, books).encode("utf-8")
                    self._send_bytes(200, page, "text/html; charset=utf-8")
                    return
                # /books/<slug> 缺少尾斜杠时补斜杠重定向
                if re.match(r"^/books/[^/]+$", path):
                    self.send_response(302)
                    self.send_header("Location", path + "/")
                    self.end_headers()
                    return
                bdir, sub = self._resolve_book_route(path)
                if bdir is not None:
                    if sub == "download":
                        self._sendBookDownload(bdir)
                        return
                    api_sub = "/" + sub
                    if api_sub.startswith("/api/") and self._handle_book_api_get(bdir, api_sub):
                        return
                    self._serve_file_safe(bdir, sub)
                    return
                self.send_error(404, "Not Found")
                return

            # 单书模式（向后兼容 --dir）
            if self._handle_book_api_get(root_dir, path):
                return
            super().do_GET()

        def _sendBookDownload(self, bookDir: Path):
            entry = _find_entry_html(bookDir)
            if not entry:
                self.send_error(404, "Not Found")
                return
            body = entry.read_bytes()
            fname = urllib.parse.quote(f"{bookDir.name}.html")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{fname}")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            path = self.path.split("?", 1)[0]

            if mode == "library":
                if path == "/api/library/meta":
                    req = self._read_json_body()
                    slug = str(req.get("slug") or "").strip()
                    saved = update_book_user_meta(root_dir, slug, req)
                    self._send_json(200, {"ok": True, "meta": saved})
                    return
                bdir, sub = self._resolve_book_route(path)
                if bdir is not None:
                    api_sub = "/" + sub
                    if self._handle_book_api_post(bdir, api_sub):
                        return
                self.send_error(404, "Not Found")
                return

            if self._handle_book_api_post(root_dir, path):
                return
            self.send_error(404, "Not Found")

    return StudyHandler


def main():
    parser = argparse.ArgumentParser(description="Day-Up 本地统一书库与伴学服务（单端口管理全部教材）")
    parser.add_argument("--library", default="", help="统一书库根目录（默认 ~/.day-up/library，推荐单端口管理全部教材）")
    parser.add_argument("--dir", default="", help="兼容参数：单本教材目录（不传时默认启用统一书库模式）")
    parser.add_argument("--add", default="", help="将任意路径的已有教材目录挂载到统一书库（无需移动文件）")
    parser.add_argument("--slug", default="", help="配合 --add 使用的书目短名")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认 127.0.0.1")
    parser.add_argument("--port", type=int, default=18770, help="监听端口，默认 18770（统一书库固定复用同一端口）")
    parser.add_argument(
        "--agent-cmd",
        default=os.environ.get("DAYUP_AGENT_CMD", ""),
        help="当前宿主 CLI Agent 的非交互调用命令（含 {prompt} 则按参数传，否则经 stdin 传）",
    )
    args = parser.parse_args()

    # 若显式传 --dir 且未传 --library/--add，走单书向后兼容模式
    if args.dir and not args.library and not args.add:
        serve_dir = Path(args.dir).expanduser().resolve()
        if not serve_dir.exists():
            raise SystemExit(f"目录不存在：{serve_dir}")
        active_cli = resolve_current_agent(serve_dir, args.agent_cmd.strip())
        server = ThreadingHTTPServer((args.host, args.port), make_handler("single", serve_dir, active_cli))
        print(f"Day-Up 单书服务：http://{args.host}:{args.port}/", flush=True)
        if active_cli:
            print(f"右侧伴学已连接当前 Agent（{active_cli['name']}）", flush=True)
        else:
            print("右侧伴学已连接当前 Agent（对话桥接：agent_chat.json）", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
        return

    # 统一书库模式（默认）
    library_dir = Path(args.library).expanduser().resolve() if args.library else default_library_dir()
    library_dir.mkdir(parents=True, exist_ok=True)

    added_slug = ""
    if args.add:
        added_slug = register_book_in_library(library_dir, Path(args.add), args.slug)
        print(f"已挂载教材到统一书库：{added_slug} -> http://{args.host}:{args.port}/books/{added_slug}/", flush=True)

    # 幂等复用：如果同一书库已在目标端口运行，直接提示并退出，不再新开端口！
    if _check_existing_library_server(args.host, args.port, library_dir):
        print(f"Day-Up 统一书库已在运行：http://{args.host}:{args.port}/（无需新开端口，刷新书架即可见新书）", flush=True)
        return

    active_cli = resolve_current_agent(library_dir, args.agent_cmd.strip())
    server = ThreadingHTTPServer((args.host, args.port), make_handler("library", library_dir, active_cli))
    books, _ = discover_books(library_dir)
    print(f"Day-Up 统一书库已启动：http://{args.host}:{args.port}/（目录：{library_dir}，共 {len(books)} 本教材）", flush=True)
    if active_cli:
        print(f"右侧伴学已连接当前 Agent（{active_cli['name']}）", flush=True)
    else:
        print("右侧伴学已连接当前 Agent（对话桥接：agent_chat.json）", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
