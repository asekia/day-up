#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Full-book syllabus (course.json) architecture and mastery-progression validator (zero dependencies).
Usage: python3 validateSyllabus.py path/to/course.json
"""

import json
import sys
from pathlib import Path

REQUIRED_CHAPTER_FIELDS = (
    ("part", "missing 'part' (e.g., 'Part I · Foundations & Minimal Closed Loop')"),
    ("prerequisite", "missing 'prerequisite'"),
    ("bridgeToNext", "missing 'bridgeToNext' causal handoff"),
    ("capstoneDeliverable", "missing 'capstoneDeliverable'"),
)
DEEP_STAGE_CUES = (
    "评测", "诊断", "排障", "调优", "权衡", "翻车", "避坑", "误差", "误区", "风险", "危机", "成本",
    "eval", "diagnos", "debug", "troubleshoot", "optimiz", "trade-off", "tradeoff",
    "pitfall", "error", "risk", "cost", "failure", "benchmark", "boundary", "pitfalls",
)
CAPSTONE_CUES = (
    "综合", "实战", "项目", "流水线", "端到端", "研判", "大案例", "迁移", "落地", "系统",
    "capstone", "project", "pipeline", "end-to-end", "case study", "production",
    "system", "transfer", "practicum", "synthesis", "hands-on", "workshop",
)


def loadCourseJson(filePath):
    return json.loads(Path(filePath).read_text(encoding="utf-8"))


def checkChapterCount(syllabus, scope, label):
    count = len(syllabus)
    minCount = 4 if scope == "quick" else 8
    if count < minCount:
        return [f"[{label}] Only {count} chapters (mastery textbooks require 8-20 chapters; quick overviews must set scope='quick')"], []
    if count > 20:
        return [f"[{label}] {count} chapters exceeds the 20-chapter maximum (keep within 8-20 chapters)"], []
    return [], []


def checkPartStages(syllabus, scope, label):
    parts = {str(ch.get("part") or "").strip() for ch in syllabus if ch.get("part")}
    minParts = 2 if scope == "quick" else 3
    if len(parts) < minParts:
        return [], [f"[{label}] Only {len(parts)} distinct part(s); mastery textbooks should follow a 4-stage climb (Foundations -> Evolution -> Deep Diagnostics -> Capstone)"]
    return [], []


def checkChapterNumbering(syllabus, label):
    nums = [ch.get("num") for ch in syllabus]
    expected = list(range(nums[0], nums[0] + len(nums))) if nums and isinstance(nums[0], int) else []
    if nums != expected:
        return [f"[{label}] Non-contiguous chapter numbering: {nums}"], []
    return [], []


def checkSingleChapter(ch, label):
    errors, warnings = [], []
    tag = f"[{label} Ch.{ch.get('num', '?')}]"
    for field, msg in REQUIRED_CHAPTER_FIELDS:
        if not str(ch.get(field) or "").strip():
            warnings.append(f"{tag} {msg}")
    secs = ch.get("sections") or []
    if not isinstance(secs, list) or len(secs) < 4:
        warnings.append(f"{tag} Only {len(secs) if isinstance(secs, list) else 0} section(s) (recommend 4-6 sections for proper depth)")
    return errors, warnings


def checkStageCoverage(syllabus, scope, label):
    if scope == "quick":
        return [], []
    warns = []
    allTitles = " ".join(f"{c.get('title', '')} {c.get('part', '')} {' '.join(c.get('sections') or [])}" for c in syllabus).lower()
    tailText = " ".join(f"{c.get('title', '')} {c.get('part', '')} {c.get('capstoneDeliverable', '')}" for c in syllabus[-2:]).lower()
    if not any(k in allTitles for k in DEEP_STAGE_CUES):
        warns.append(f"[{label}] Syllabus lacks deep-water diagnostic chapters (evaluation / debugging / trade-offs / failure modes)")
    if not any(k in tailText for k in CAPSTONE_CUES):
        warns.append(f"[{label}] Final chapters lack an end-to-end capstone project or full case synthesis")
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
        return [f"[{label}] Missing non-empty 'syllabus' array"], []
    scope = str(data.get("scope") or (data.get("course") or {}).get("scope") or "mastery").strip().lower()
    errors, warnings = collectBookIssues(syllabus, scope, label)
    for ch in syllabus:
        ce, cw = checkSingleChapter(ch, label)
        errors.extend(ce)
        warnings.extend(cw)
    return errors, warnings


def runCli(argv):
    if len(argv) < 2:
        print("Usage: python3 validateSyllabus.py <course.json>")
        return 2
    data = loadCourseJson(argv[1])
    errors, warnings = validateCourseSyllabus(data, argv[1])
    for w in warnings:
        print(f"  [WARN]  {w}")
    for e in errors:
        print(f"  [ERROR] {e}")
    status = "FAILED" if errors else "PASSED"
    print(f"\nSyllabus validation {status}: {len(errors)} error(s), {len(warnings)} warning(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(runCli(sys.argv))
