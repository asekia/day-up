<p align="center">
  <img src="assets/banner.svg" width="100%" alt="day-up" />
</p>

# day-up

把任意想学的主题，一步步生成为纸书排版的本地交互式教材，并收进统一书架的 Agent Skill。

## 效果

- **按书立纲、逐章解锁**：开课前简短了解你的基础，联网核实近期资料后规划完整全书大纲（8~20 章），每次只写透当前一章，读完自测后再解锁下一章。
- **人话推演、拒绝跳步**：从具体场景一步步推到概念、公式与实操，限制单节新概念数量，配齐动静态原理图、悬停词条与课后练习。
- **纸书阅读与划词伴学**：生成零外部依赖的单文件网页，支持连贯滚读 / 仿真翻页切换、三色护眼主题，不懂的句子直接划选即可向当前 Agent 追问。
- **单端口个人书架**：所有生成的教材统一归入 `~/.day-up/library/`，在同一个本地书架集中浏览、打标签、搜索与追踪学习进度。

## 安装

使用 `skills` CLI 一键安装（支持 Claude Code、Codex、Cursor、Gemini CLI、OpenCode、dsh、zcode 等）：

```bash
npx skills add asekia/day-up -g
```

或者手动克隆到对应 Agent 的 `skills` 目录：

```bash
git clone https://github.com/asekia/day-up.git ~/.claude/skills/day-up
```

> 运行仅依赖系统自带 `Python 3.8+`，无需额外安装第三方库。

## 使用

安装后直接在对话里告诉 Agent 你想学什么即可（或输入 `/day-up` 触发）：

```text
用 day-up 手把手教我微观经济学，从零基础讲到能看懂现实政策分析
```

```text
用 day-up 出一本 Flow Matching 与现代图像生成实战教材
```

```text
第 1 章读完了，先解答我标疑问的小节，再继续解锁第 2 章
```

## License

[MIT](./LICENSE)
