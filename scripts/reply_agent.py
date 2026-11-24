#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将当前正在使用的 IDE / 对话 Agent 的答复写回课程目录的 agent_chat.json，
网页右侧“伴学 Agent”栏会在 2.5 秒内自动轮询并展示该答复。

用法：
  python3 reply_agent.py --dir /path/to/course_dir --text "这里是人话答复……"
  python3 reply_agent.py --dir /path/to/course_dir --source "Agent" --file reply.md
"""

import argparse
import json
import time
from datetime import datetime
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="向 Day-Up 网页右侧伴学栏回传 Agent 答复")
    parser.add_argument("--dir", required=True, help="课程目录（与 study_server.py --dir 一致）")
    parser.add_argument("--text", help="答复正文（Markdown）")
    parser.add_argument("--file", help="从文本文件读取答复正文")
    parser.add_argument("--source", default="当前对话 Agent", help="显示的 Agent 名称")
    args = parser.parse_args()

    content = args.text
    if args.file:
        content = Path(args.file).read_text(encoding="utf-8")
    if not content or not content.strip():
        raise SystemExit("必须通过 --text 或 --file 提供答复正文")

    chat_file = Path(args.dir).resolve() / "agent_chat.json"
    if chat_file.exists():
        try:
            data = json.loads(chat_file.read_text(encoding="utf-8"))
        except Exception:
            data = {"messages": []}
    else:
        data = {"messages": []}

    msgs = data.setdefault("messages", [])
    for m in msgs:
        if m.get("role") == "user" and not m.get("answered"):
            m["answered"] = True

    reply_id = f"a-{int(time.time() * 1000)}"
    msgs.append({
        "id": reply_id,
        "role": "assistant",
        "source": args.source,
        "content": content.strip(),
        "time": datetime.now().strftime("%H:%M"),
    })

    tmp = chat_file.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    tmp.replace(chat_file)
    print(f"已写回右侧伴学栏：{chat_file} (id={reply_id})")


if __name__ == "__main__":
    main()
