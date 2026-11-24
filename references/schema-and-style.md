# 声明式课件数据协议、黑白配图与讲述规范

## 1. 顶层结构

单章文件（`chN.json`）：

```json
{
  "id": "ch1",
  "num": 1,
  "title": "章节标题（不要手写“第 1 章”）",
  "objectives": [
    "了解……",
    "掌握……",
    "掌握……"
  ],
  "roadmap": "本章先向读者介绍……，再介绍……，最后介绍……。",
  "sections": [
    { "type": "h3", "text": "HTTP 基本原理" },
    { "type": "p", "text": "本节我们会详细了解 HTTP 的基本原理，了解从往浏览器中输入 URL 到获取网页内容之间都发生了什么。" }
  ],
  "exercises": {
    "single_choice": [
      {
        "q": "题干内容（  ）。",
        "options": ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
        "answer": "B",
        "ref": "§1.1",
        "explain": "一句话解析。"
      }
    ],
    "short_answer": [
      {
        "q": "简答题题干。",
        "ref": "§1.1",
        "answer": "简洁、可核验的参考答案。"
      }
    ]
  },
  "references": [
    "可选：一手文献或官方文档条目。"
  ]
}
```

完整课程目录（`--data-dir`）中的 `course.json` 必须包含**全书目录大纲 `syllabus`**，以便未生成章节以 `待学` 状态显示在左侧目录，做到按目录逐章学习而非一次性灌完：

```json
{
  "title": "课程总标题",
  "subtitle": "主线副标题",
  "version": "v1.0",
  "date": "2026-11-20",
  "syllabus": [
    { "id": "ch1", "num": 1, "title": "第一章标题", "sections": ["小节一", "小节二"] },
    { "id": "ch2", "num": 2, "title": "第二章标题（待学）", "sections": ["小节一", "小节二"] }
  ]
}
```

### 伴学实时进度文件（`progress.json`）

当通过 `scripts/study_server.py --dir <course_dir>` 启动伴学服务时，阅读器会自动将用户以下数据实时落盘到 `<course_dir>/progress.json` 与可读摘要 `<course_dir>/progress_report.md`：
- `active_location` / `active_anchor`：当前阅读位置；
- `unlocked_chapters` / `upcoming_syllabus`：全书目录解锁与各章掌握进度；
- `mastered_sections`：用户勾记为“已掌握”的小节清单；
- `doubt_sections`：用户标记为“有疑问”的小节及具体卡壳备注；
- `quiz_summary`：单选题作答数、正确率及 `wrong_questions` 精确错题列表（含出处 `ref`）。

---

## 2. 全部合法内容块（`sections` 数组元素）

| `type` | 必填/可选字段 | 素雅纸书渲染形态与使用原则 |
|---|---|---|
| `h3` | `text`, `id?` | 左对齐粗黑体小节标题，自动编号 `N.y` 并进左侧书签目录（禁止手写节号） |
| `h4` | `text` | 缩进 `2em` 的粗黑体子节标题，自动编号 `1.` `2.`（禁止手写编号） |
| `p` | `text` | 首行缩进 `2em` 的宋体正文段落；支持 `**粗体**`、`` `代码` ``、`{{term:词|释义}}`、`{{fig:ID}}`、`{{tab:ID}}`、`{{eq:ID}}` |
| `side_figure` | `text` 或 `paragraphs[]`, `id?`, `caption`, `svg?`, `src?` | **图文并排（左文右图）**：**仅限简单小图（SVG `viewBox` 宽度 ≤ 260、文字 ≤ 5 个短词）**，复杂流程图必须改用全宽 `figure` 或 `animated-diagram` |
| `figure` | `id?`, `caption`, `svg?`, `src?`, `output?` | 全宽独立黑白线稿图或命令执行输出图，自动编号 `图 N-k`；有 `id` 时正文必用 `{{fig:ID}}` 引用 |
| `syntax` | `text` | 纯文本缩进语法/格式规范行（无边框无标题栏），如 `scheme://[username:password@]hostname[:port]...` |
| `code` | `lang`, `text`, `result?`, `resultId?`, `output?`, `svg?` | 素雅上下细线代码块（缩进无行号，右上角低调复制钮）；附 `result` 时自动生成 `图 N-k` |
| `enum` | `items[]`, `style?("square")`, `depth?(1-4)` | `style:"square"` 渲染纸书空心方框 `□` 逐项拆解（强烈用于公式逐符号拆解与代码/格式逐字段拆解） |
| `table` | `id?`, `caption?`, `head[]`, `rows[][]` | 经典黑白三线表（自动编号 `表 N-k`）；有 `id` 时正文必用 `{{tab:ID}}` 引用 |
| `eq` | `id?`, `text`, `num?` | 出版级独立公式块（支持 `\frac{a}{b}`、`_{sub}`、`^{sup}`、`\mathbb{E}`、`\sum` 等零依赖真上下标排版，右端编号 `(N.k)`）；**每个 `eq` 后必须紧跟逐符号精拆与手算深讲** |
| `def` / `prop` / `note` / `ex` | `label?`, `text`, `proof?` | 极简黑白细左线块（**无彩色底框**）；仅在真正需要独立标出定义/定理/实测例时克制使用，勿堆砌 |
| `term` | `name`, `def`, `hidden?` | 补充术语条目（自动汇总入附录“全书术语索引”；`hidden:true` 仅入索引不占正文版面） |
| `sim` | `kind`, … | 克制版交互与动态图模块：`animated-diagram`（难点动态过程图，支持播放/暂停/逐帧/自动编号 `图 N-k`）、`step-walkthrough`（分步推演，每步可配 `svg`）、`formula-explorer`（声明式公式曲线）、`margin-simulator` |
| `slot` | `text` | 待补充内容虚线占位框 |

---

## 3. 静态线图与难点动态图规范（直观但不花哨）

在 `side_figure`、`figure` 或 `sim(kind:"animated-diagram")` 中绘制教学图时，按**静/动分工**：

- **静态概念/包含关系图（`side_figure` / `figure`）**：描边与文字统一用 `currentColor`，填充只用 `none` 或 `var(--paper)`，保持纸书素雅感。
- **难点动态过程图（`sim` 设 `"kind": "animated-diagram"`）**：当知识点涉及**流动、移动、分裂、状态切换或难以靠文字想象的动态机制**时，主动使用动态图（不要只用死板的静态黑白线图）：
  - 用 `currentColor` 画静态骨架，用**单一点睛色 `var(--link)`** 突出当前正在移动的数据包/指针/激活节点，避免五颜六色杂乱；
  - 可直接使用内置动画类 `class="svg-flow"`（流动虚线）、`class="svg-pulse"`（呼吸聚焦）以及 SVG 原生 `<animate>` / `<animateMotion>`，并在 `prefers-reduced-motion` 下自动降级为手动切帧；
  - 自动按 `图 N-k` 编号，正文同样用 `{{fig:ID}}` 引用。

```json
{
  "type": "sim",
  "kind": "animated-diagram",
  "id": "http-cycle",
  "title": "动态图解：一次 HTTP 请求与响应的完整往返",
  "caption": "浏览器与服务器之间 HTTP 报文动态往返过程",
  "intervalMs": 2200,
  "frames": [
    {
      "short": "解析地址",
      "title": "浏览器拆解 URL 并暂存锚点",
      "svg": "<svg viewBox='0 0 600 150'>...</svg>",
      "caption": "浏览器先把 `#intro` 留在本地，再提取主机名与路径。"
    }
  ]
}
```

---

## 4. 合格教材讲述模板（对照复查）

写每一节时，按如下自查节奏组织段落：

1. **切入点段**：`本节我们会详细了解 XX 的基本原理，了解从 A 到 B 之间都发生了什么。了解这些内容有助于进一步掌握 YY。`
2. **概念 + 真实例子段**：`我们先了解一下 A。A 的全称为……，即……它是什么意思呢？举例来说，[真实可触碰的例子]……通过这个例子可以看到……`
3. **设问对比 + 图文并排段（`side_figure`）**：`A 是 B 的子集……那么，怎样的 B 不是 A 呢？除了 A，还包括 C……它们的关系可以用 {{fig:rel}} 表示。`
4. **现实取舍段**：`在实际工程中，C 用得很少……所以我们日常习惯直接称……`
5. **格式/代码 + 最简对照 + `□` 逐项拆解**：`但 XX 也不是随便写的，基本格式如下：` → `syntax`/`code` → `其中中括号表示可选，比如 [最简例子] 只包含……这里分别介绍各部分的含义：` → `enum(style:"square")` 逐项拆解。

---

## 5. 禁用词与交付检查

- **禁用词**：`总而言之`、`不难发现`、`值得注意的是`、`综上所述`、`显而易见`、`毋庸置疑`、`众所周知`。
- **结构检查（已内置于 `validate_chapter.py`）**：
  - 每节开头必须是叙事切入段落 `p`（不能一上来就丢孤立框或公式）；
  - 每章至少包含 1 张真实示意图（`figure`/`side_figure` 含 `svg` 或 `src`），建议每节 1 张；
  - `def`/`prop`/`note`/`ex` 提示块占比不超过全章内容块的 35%，确保连贯阅读体验；
  - 所有 `{{fig:}}`/`{{tab:}}`/`{{eq:}}` 交叉引用闭环，所有习题 `ref` 指向本章真实小节。
