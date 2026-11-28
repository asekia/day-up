#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
交互式教材课件单文件构建脚本（通用、零依赖）
用法示例：
  1) 从数据目录构建（自动读取 course.json 与按 num 排序的 ch*.json）：
     python3 build_courseware.py --data-dir ./data --out ./index.html
  2) 从单个完整课程 JSON 构建：
     python3 build_courseware.py --course-file ./my_course.json --out ./my_course.html
  3) 从指定章节文件构建（自动补全 course 元信息）：
     python3 build_courseware.py --title "Rust 所有权实战" --subtitle "内存安全核心" --chapters ch1.json ch2.json --out ./rust.html
"""

import argparse
import html
import json
import sys
from datetime import date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_ASSETS = SCRIPT_DIR.parent / "assets"

sys.path.insert(0, str(SCRIPT_DIR))
import validate_chapter  # noqa: E402


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def build_data_payload(args):
    if args.course_file:
        payload = load_json(Path(args.course_file))
        if "chapters" not in payload or not isinstance(payload["chapters"], list):
            raise ValueError("--course-file 必须包含 chapters 数组")
        return payload

    course_meta = {
        "title": args.title or "交互式教材课件",
        "subtitle": args.subtitle or "",
        "version": args.version or "v1.0",
        "date": str(date.today()),
    }
    syllabus = []
    chapters = []

    if args.data_dir:
        ddir = Path(args.data_dir)
        cfile = ddir / "course.json"
        if cfile.exists():
            loaded_meta = load_json(cfile)
            if isinstance(loaded_meta, dict):
                if isinstance(loaded_meta.get("syllabus"), list):
                    syllabus = loaded_meta["syllabus"]
                meta_part = loaded_meta.get("course", {k: v for k, v in loaded_meta.items() if k != "syllabus"})
                course_meta.update(meta_part)
        sfile = ddir / "syllabus.json"
        if sfile.exists():
            loaded_syl = load_json(sfile)
            if isinstance(loaded_syl, list):
                syllabus = loaded_syl
            elif isinstance(loaded_syl, dict) and isinstance(loaded_syl.get("syllabus"), list):
                syllabus = loaded_syl["syllabus"]
        for p in sorted(ddir.glob("ch*.json")):
            chapters.append(load_json(p))

    if args.syllabus:
        loaded_syl = load_json(Path(args.syllabus))
        if isinstance(loaded_syl, list):
            syllabus = loaded_syl
        elif isinstance(loaded_syl, dict) and isinstance(loaded_syl.get("syllabus"), list):
            syllabus = loaded_syl["syllabus"]

    if args.chapters:
        for ch_path in args.chapters:
            chapters.append(load_json(Path(ch_path)))

    if not chapters:
        raise ValueError("未提供任何章节 JSON（请使用 --data-dir、--chapters 或 --course-file）")

    chapters.sort(key=lambda c: (c.get("num", 999), str(c.get("id", ""))))
    payload = {
        "course": course_meta,
        "chapters": chapters,
    }
    if syllabus:
        payload["syllabus"] = syllabus
    return payload


def main():
    parser = argparse.ArgumentParser(description="构建单文件交互式教材 HTML")
    parser.add_argument("--data-dir", help="包含 course.json 与 ch*.json 的目录")
    parser.add_argument("--course-file", help="完整课程 JSON 文件（含 course 与 chapters）")
    parser.add_argument("--chapters", nargs="+", help="一个或多个章节 JSON 文件")
    parser.add_argument("--syllabus", help="全书目录大纲 JSON 文件（含待学章节清单）")
    parser.add_argument("--title", help="课程标题（未提供 course.json 时使用）")
    parser.add_argument("--subtitle", help="课程副标题")
    parser.add_argument("--version", default="v1.0", help="版本号")
    parser.add_argument("--framework-dir", help="自定义模板目录（默认使用 skill 内置 assets/）")
    parser.add_argument("--out", required=True, help="输出的 HTML 文件路径")
    parser.add_argument("--skip-validate", action="store_true", help="跳过章节校验")
    args = parser.parse_args()

    payload = build_data_payload(args)

    if not args.skip_validate:
        all_errors = []
        all_warnings = []
        for ch in payload["chapters"]:
            e, w = validate_chapter.validate_chapter(ch, ch.get("id", "chapter"))
            all_errors.extend(e)
            all_warnings.extend(w)
        for w in all_warnings:
            print(f"[WARN]  {w}")
        if all_errors:
            for e in all_errors:
                print(f"[ERROR] {e}")
            print(f"\n构建中止：发现 {len(all_errors)} 个校验错误。请先修复或使用 --skip-validate。")
            sys.exit(1)

    fw_dir = Path(args.framework_dir) if args.framework_dir else SKILL_ASSETS
    tpl = (fw_dir / "template.html").read_text(encoding="utf-8")
    css = (fw_dir / "courseware.css").read_text(encoding="utf-8")
    math_path = fw_dir / "mathRenderer.js"
    math_js = math_path.read_text(encoding="utf-8") + "\n" if math_path.exists() else ""
    js = math_js + (fw_dir / "courseware.js").read_text(encoding="utf-8")

    # 防止 JSON 字符串中的 </script> 提前闭合 script 标签
    data_json = json.dumps(payload, ensure_ascii=False, indent=2).replace("</", "<\\/")
    page_title = html.escape(payload.get("course", {}).get("title", "交互式教材课件"))

    out_html = (
        tpl.replace("{{PAGE_TITLE}}", page_title)
        .replace("{{INLINE_CSS}}", css)
        .replace("{{INLINE_DATA}}", data_json)
        .replace("{{INLINE_JS}}", js)
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_html, encoding="utf-8", newline="\n")

    size_kb = out_path.stat().st_size / 1024
    print(f"构建成功：{out_path}")
    print(f"章节数：{len(payload['chapters'])}  |  文件大小：{size_kb:.1f} KB（零外部依赖，双击可开）")
    if size_kb > 300:
        print("[提示] 单文件超过 300 KB，后续可考虑按框架拆分加载。")


if __name__ == "__main__":
    main()
