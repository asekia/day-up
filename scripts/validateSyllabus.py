#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全书大纲（course.json / syllabus）大局观与精通爬坡质量校验脚本（零依赖）
用法：python3 validateSyllabus.py path/to/course.json
"""

import json
import sys
from pathlib import Path

REQUIRED_CHAPTER_FIELDS = (
    ("part", "缺少所属篇目 part（如'第一篇 · 奠基与最小闭环'）"),
    ("prerequisite", "缺少前置依赖 prerequisite"),
    ("bridgeToNext", "缺少承上启下因果桥 bridgeToNext"),
    ("capstoneDeliverable", "缺少本章硬核产出 capstoneDeliverable"),
)
DEEP_STAGE_CUES = ("评测", "诊断", "排障", "调优", "权衡", "翻车", "避坑", "误差", "误区", "风险", "危机", "成本")
CAPSTONE_CUES = ("综合", "实战", "项目", "流水线", "端到端", "研判", "大案例", "迁移", "落地", "系统")


def loadCourseJson(filePath):
    return json.loads(Path(filePath).read_text(encoding="utf-8"))


def checkChapterCount(syllabus, scope, label):
    count = len(syllabus)
    minCount = 4 if scope == "quick" else 8
    if count < minCount:
        return [f"[{label}] 全书仅 {count} 章（精通型教材须规划 8~20 章；速览课需显式标 scope='quick'）"], []
    if count > 20:
        return [f"[{label}] 全书达 {count} 章，超出最多 20 章上限（请控制在 8~20 章内）"], []
    return [], []


def checkPartStages(syllabus, scope, label):
    parts = {str(ch.get("part") or "").strip() for ch in syllabus if ch.get("part")}
    minParts = 2 if scope == "quick" else 3
    if len(parts) < minParts:
        return [], [f"[{label}] 全书仅划分 {len(parts)} 个篇目（part），精通型教材建议按四阶爬坡（奠基→演进→深水排障→综合实战）"]
    return [], []


def checkChapterNumbering(syllabus, label):
    nums = [ch.get("num") for ch in syllabus]
    expected = list(range(nums[0], nums[0] + len(nums))) if nums and isinstance(nums[0], int) else []
    if nums != expected:
        return [f"[{label}] 章节编号不连续：{nums}"], []
    return [], []


def checkSingleChapter(ch, label):
    errors, warnings = [], []
    tag = f"[{label} 第 {ch.get('num', '?')} 章]"
    for field, msg in REQUIRED_CHAPTER_FIELDS:
        if not str(ch.get(field) or "").strip():
            warnings.append(f"{tag} {msg}")
    secs = ch.get("sections") or []
    if not isinstance(secs, list) or len(secs) < 4:
        warnings.append(f"{tag} 仅有 {len(secs) if isinstance(secs, list) else 0} 节（建议 4~6 节，避免单章内容单薄）")
    return errors, warnings


def checkStageCoverage(syllabus, scope, label):
    if scope == "quick":
        return [], []
    warns = []
    allTitles = " ".join(f"{c.get('title', '')} {c.get('part', '')} {' '.join(c.get('sections') or [])}" for c in syllabus)
    tailText = " ".join(f"{c.get('title', '')} {c.get('part', '')} {c.get('capstoneDeliverable', '')}" for c in syllabus[-2:])
    if not any(k in allTitles for k in DEEP_STAGE_CUES):
        warns.append(f"[{label}] 大纲缺少深水区章节（评测/诊断/排障/调优/权衡），难以把新手带到老手水平")
    if not any(k in tailText for k in CAPSTONE_CUES):
        warns.append(f"[{label}] 末尾章节缺少端到端综合实战或完整项目闭环，建议补齐第四篇综合实战章")
    return [], warns


def collectBookIssues(syllabus, scope, label):
    errors, warnings = checkChapterNumbering(syllabus, label)
    for fn in (checkChapterCount, checkPartStages, checkStageCoverage):
        e, w = fn(syllabus, scope, label)
        errors.extend(e)
        warnings.extend(w)
    return errors, warnings


def validateCourseSyllabus(data, label):
    syllabus = data.get("syllabus") or []
    if not isinstance(syllabus, list) or not syllabus:
        return [f"[{label}] 缺少非空 syllabus 全书目录数组"], []
    scope = str(data.get("scope") or (data.get("course") or {}).get("scope") or "mastery").strip().lower()
    errors, warnings = collectBookIssues(syllabus, scope, label)
    for ch in syllabus:
        ce, cw = checkSingleChapter(ch, label)
        errors.extend(ce)
        warnings.extend(cw)
    return errors, warnings


def runCli(argv):
    if len(argv) < 2:
        print("用法: python3 validateSyllabus.py <course.json>")
        return 2
    data = loadCourseJson(argv[1])
    errors, warnings = validateCourseSyllabus(data, argv[1])
    for w in warnings:
        print(f"  [WARN]  {w}")
    for e in errors:
        print(f"  [ERROR] {e}")
    status = "校验失败" if errors else "校验通过"
    print(f"\n大纲{status}：{len(errors)} 个错误，{len(warnings)} 条警告。")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(runCli(sys.argv))
