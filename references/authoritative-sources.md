# 各行业权威报刊、官方文档与高口碑博客信源库（23 大类全覆盖）

> 本文件供 `day-up` Skill 在编写每一章前**主动调用搜索工具（`search_web`）**时定向检索使用。
> 检索原则：**先查一手官方/学术/国际或国家标准定口径，再查一线实战博客拿真实案例、直觉比喻与踩坑记录**；所有写入章节 `references` 的链接必须是本次实际检索核实过的真实页面，严禁编造 URL。

---

## 紧跟时代检索三轮法与冷门领域兜底策略

> **防过时硬规矩**：禁止只搜泛泛的静态定义，必须主动核查近 12~18 个月的版本变化、标准修订与废弃清单，把**当代最新主流做法**写成正文主线，绝不把过时接口或淘汰框架当成今日最佳实践！

- **第 1 轮 · 锚定当前年份的最新权威口径**：`<主题关键词> <当前年份> OR latest OR release OR guideline site:<官方文档或权威期刊域名>`
- **第 2 轮 · 排查已废弃/被取代的旧做法**：`<主题关键词> deprecated OR migration OR "replaced by" OR 新旧对比 <当前年份>`
- **第 3 轮 · 查近期一线实战与踩坑复盘**：`<主题关键词> 实战 OR postmortem OR production <当前年份> site:<博客域名>`
- **查可视化图示与直觉类比**：`<主题关键词> visual guide OR illustrated OR explained`
- **冷门/新兴交叉领域动态兜底法**（若主题未落入下述 23 类）：按顺序执行 3 步发现信源——① 搜最新修订的国家/国际标准（`GB/T`、`ISO`、`IEC`、`IEEE`、`RFC`、`gov.cn`）；② 搜顶尖高校近两年公开课讲义（`site:edu` / `syllabus` / `lecture notes` + 当前年份）；③ 搜该行业顶级协会年度报告或一线从业者近期实战复盘。

---

## 1. 人工智能、机器学习与大模型（AI / ML / LLM）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 学术预印本 | arXiv (cs.CL / cs.LG / cs.AI) | https://arxiv.org | 原始论文公式、实验数据与一手出处 |
| 官方文档 | Hugging Face Docs & Blog | https://huggingface.co/blog | 开源模型训练、PEFT/TRL/Transformers 实操 |
| 官方研究博客 | Anthropic Research & Engineering | https://www.anthropic.com/research | 对齐、Agent、长上下文与工程实践 |
| 官方研究博客 | OpenAI Research | https://openai.com/research | 前沿模型机制与评测口径 |
| 官方研究博客 | Google DeepMind Blog | https://deepmind.google/discover/blog/ | 算法突破与科学计算 AI |
| 顶级个人博客 | Lil'Log (Lilian Weng) | https://lilianweng.github.io | 系统级综述（Agent、RLHF、扩散模型等） |
| 顶级个人博客 | Jay Alammar (Illustrated Series) | https://jalammar.github.io | 图解 Transformer / Attention / LLM 直觉 |
| 顶级个人博客 | Sebastian Raschka (Ahead of AI) | https://magazine.sebastianraschka.com | LLM 架构拆解与实操代码对照 |
| 开源教材/博客 | Nathan Lambert (RLHF Book / Interconnects) | https://rlhfbook.com / https://www.interconnects.ai | 后训练、SFT/DPO/RLVR 权威教材与动态 |
| 互动期刊 | Distill | https://distill.pub | 可视化机器学习原理解析 |
| 中文行业媒体 | 机器之心 / PaperWeekly | https://www.jiqizhixin.com | 中文前沿解读与论文追踪（建议回溯原论文核验） |

---

## 2. 软件工程、编程语言与前后端开发（CS / Web / Software Engineering）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 权威文档 | MDN Web Docs | https://developer.mozilla.org | HTTP、HTML/CSS/JS、浏览器 API 黄金标准 |
| 官方文档 | Python / Rust / Go / TypeScript Docs | https://docs.python.org / https://doc.rust-lang.org / https://go.dev/doc | 语言语义、标准库与内存模型权威定义 |
| 经典架构博客 | Martin Fowler | https://martinfowler.com | 软件架构、重构、微服务与领域驱动设计 |
| 图解技术博客 | Julia Evans (Wizard Zines) | https://jvns.ca | Linux、Git、网络、DNS、HTTP 极佳图解与切入点 |
| 前端专家博客 | Dan Abramov (Overreacted) | https://overreacted.io | React 心智模型与底层渲染原理 |
| 前端专家博客 | Josh W. Comeau | https://www.joshwcomeau.com | CSS 布局、渲染引擎与交互直觉图解 |
| Web 性能官方 | Google web.dev | https://web.dev | 浏览器渲染管线、Core Web Vitals、现代 Web |
| 大厂工程博客 | Stripe / Netflix / Discord / Dropbox Engineering | https://stripe.com/blog/engineering / https://netflixtechblog.com | 高并发、支付幂等、稳定性与真实故障复盘 |
| 中文工程博客 | 美团技术团队 | https://tech.meituan.com | 高并发后端、Java/JVM、中间件与业务架构实战 |
| 中文经典博客 | 酷壳 CoolShell（陈皓） | https://coolshell.cn | 分布式系统、C/C++、Linux 与工程方法论 |
| 中文经典博客 | 阮一峰的网络日志 | https://www.ruanyifeng.com/blog | Web 协议、前端标准与清晰入门讲解 |

---

## 3. 计算机网络、操作系统、数据库与云原生（Infra / OS / DB / Cloud）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 国际标准 | IETF RFC Datatracker | https://datatracker.ietf.org | HTTP/1.1/2/3、TCP、TLS、DNS、OAuth 原始规范 |
| 内核文档 | Linux Kernel Documentation | https://docs.kernel.org | 进程调度、虚拟内存、eBPF、文件系统一手口径 |
| 官方文档 | PostgreSQL / MySQL / Redis / Kubernetes | https://www.postgresql.org/docs / https://kubernetes.io/docs | 事务隔离、索引机制、容器编排权威文档 |
| 顶级网络博客 | Cloudflare Blog | https://blog.cloudflare.com | BGP、TLS、QUIC/HTTP3、DDoS 与全球网络实测 |
| 系统性能大师 | Brendan Gregg's Blog | https://www.brendangregg.com | Linux 性能剖析、火焰图、eBPF 与观测方法 |
| 数据库专著站 | Use The Index, Luke! | https://use-the-index-luke.com | SQL B+ 树索引与执行计划极佳图解教材 |
| 云架构文库 | AWS Builders' Library | https://aws.amazon.com/builders-library | 分布式重试、背压、超时、容错实战范本 |
| 开源社区 | CNCF Blog | https://www.cncf.io/blog | 云原生生态、Service Mesh、可观测性标准 |

---

## 4. 网络安全与密码学（Cybersecurity & Cryptography）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 行业权威标准 | OWASP Foundation | https://owasp.org | Web 安全 Top 10、漏洞机理与防护清单 |
| 国家标准机构 | NIST CSRC | https://csrc.nist.gov | 密码算法标准（AES/SHA/后量子密码）、零信任框架 |
| 互动安全教材 | PortSwigger Web Security Academy | https://portswigger.net/web-security | XSS、SQLi、CSRF、SSRF 等高质量原理与实验 |
| 顶级安全研究 | Google Project Zero | https://googleprojectzero.blogspot.com | 内存安全、浏览器/内核零日漏洞深度剖析 |
| 密码学专家博客 | Schneier on Security (Bruce Schneier) | https://www.schneier.com | 密码学思维、安全治理与威胁建模 |
| 安全新闻调查 | Krebs on Security | https://krebsonsecurity.com | 真实安全事件、攻击链与行业案例 |
| 中文安全社区 | 先知社区 / 看雪论坛 | https://xz.aliyun.com / https://bbs.kanxue.com | 逆向工程、漏洞复现与攻防实操 |

---

## 5. 游戏开发、计算机图形学与音视频（Game Dev / Graphics / Media）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 行业顶级大会 | GDC Vault | https://www.gdcvault.com | 游戏架构、物理引擎、渲染管线与关卡设计演讲 |
| 行业媒体 | Game Developer (原 Gamasutra) | https://www.gamedeveloper.com | 开发者深度复盘与玩法机制拆解 |
| 图形学教材 | LearnOpenGL / Scratchapixel | https://learnopengl.com / https://www.scratchapixel.com | 渲染管线、光栅化、光线追踪与着色器手把手教材 |
| 图形学大师博客 | Inigo Quilez | https://iquilezles.org | SDF、程序化建模、Shader 数学与几何直觉 |
| 互动算法神站 | Red Blob Games | https://www.redblobgames.com | A* 寻路、六边形网格、概率与地图生成交互图解 |
| 引擎与编解码文档 | Unreal / Unity / Godot / FFmpeg Docs | https://docs.godotengine.org / https://ffmpeg.org/documentation.html | 引擎工作流、音视频封装/编解码（H.264/AV1/WebRTC） |

---

## 6. 数据分析、统计学、量化与可视化（Data / Statistics / Quant / DataViz）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 互动统计教材 | Seeing Theory (Brown Univ.) | https://seeing-theory.brown.edu | 概率分布、贝叶斯推断、回归分析直观图解 |
| 统计学家博客 | Statistical Modeling (Andrew Gelman) | https://statmodeling.stat.columbia.edu | 贝叶斯统计、因果推断与实验设计常见误区 |
| 权威开源书 | R for Data Science / Python Data Science Handbook | https://r4ds.hadley.nz | 数据清洗、探索性分析与建模规范流程 |
| 可视化专家站 | FlowingData / Observable | https://flowingdata.com / https://observablehq.com | 图表选型原则、叙事可视化与 D3 实战 |
| 统计问答库 | Cross Validated (Stats StackExchange) | https://stats.stackexchange.com | 假设检验、A/B 测试与统计概念严谨辨析 |
| 量化与数据实战 | Kaggle Learn / QuantConnect Docs | https://www.kaggle.com/learn / https://www.quantconnect.com/docs | 特征工程、回测框架与量化策略风险控制 |

---

## 7. 数学、物理与自然科学（Math / Physics / Natural Sciences）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 顶级科学期刊 | Nature | https://www.nature.com | 自然科学前沿发现与综述文章 |
| 顶级科学期刊 | Science (AAAS) | https://www.science.org | 跨学科重大研究成果 |
| 顶级科学深度媒体 | Quanta Magazine | https://www.quantamagazine.org | 数学、理论物理、计算理论的一流可读性深度报道 |
| 公开课程库 | MIT OpenCourseWare | https://ocw.mit.edu | 线性代数、微积分、算法、物理经典大学讲义 |
| 视觉数学标杆 | 3Blue1Brown | https://www.3blue1brown.com | 线性代数、微积分、傅里叶变换几何直觉 |
| 数学家博客 | What's new (Terence Tao) | https://terrytao.wordpress.com | 严谨数学思想、证明策略与分析学笔记 |
| 数学工具手册 | Paul's Online Math Notes / Wolfram MathWorld | https://tutorial.math.lamar.edu / https://mathworld.wolfram.com | 微积分/微分方程例题步骤与定义核查 |
| 中文科普期刊 | 返朴 / 赛先生 | https://www.ifanp.com | 科学家执笔的高质量中文数理前沿解读 |

---

## 8. 硬件、电子电路、嵌入式与半导体（EE / Hardware / Chips）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 权威工程杂志 | IEEE Spectrum | https://spectrum.ieee.org | 芯片架构、机器人、通信、能源与前沿硬件 |
| 半导体深度分析 | SemiAnalysis / Chips and Cheese | https://www.semianalysis.com / https://chipsandcheese.com | GPU/CPU 微架构实测、制程、HBM 与互连分析 |
| 电路开源教材 | All About Circuits | https://www.allaboutcircuits.com/textbook | 模拟/数字电路、电源、信号处理经典图文教程 |
| 芯片官方文档 | ARM Developer / RISC-V / ESP-IDF Docs | https://developer.arm.com / https://riscv.org / https://docs.espressif.com | 指令集手册、外设驱动与嵌入式开发规范 |
| 硬件极客社区 | Hackaday | https://hackaday.com | PCB 设计、传感器与动手实战项目拆解 |

---

## 9. 机械工程、机器人、自动控制与制造（Mechanical / Robotics / Control）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 国际权威学会 | ASME（美国机械工程师学会） | https://www.asme.org | 机械设计标准、热力学、流体与制造工程 |
| 机器人官方文档 | ROS 2 Documentation | https://docs.ros.org | 机器人节点通信、SLAM、运动规划与仿真 |
| 控制理论教程 | MathWorks Control & Simulink Docs | https://www.mathworks.com/help | PID、状态空间、卡尔曼滤波与控制系统直观案例 |
| 工程参数手册 | The Engineering ToolBox | https://www.engineeringtoolbox.com | 材料物性、力学公式、流体与传热可核验查表 |
| 行业动态媒体 | The Robot Report | https://www.therobotreport.com | 工业机器人、具身智能与自动化落地案例 |

---

## 10. 航空航天、交通运输与汽车工程（Aerospace / Automotive / Autonomous Driving）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 航天一手报告 | NASA Technical Reports Server (NTRS) | https://ntrs.nasa.gov | 轨道力学、空气动力学、推进与航天器工程报告 |
| 欧洲航天局 | ESA (European Space Agency) | https://www.esa.int | 航天任务、卫星通信与地球观测科普与技术文档 |
| 汽车工程标准 | SAE International | https://www.sae.org | 自动驾驶分级（L0–L5）、车规标准与动力系统规范 |
| 自动驾驶开源 | Autoware Documentation | https://autowarefoundation.github.io/autoware-documentation | 感知、定位、规划控制全栈自动驾驶架构 |
| 行业深度媒体 | SpaceNews / 盖世汽车 | https://spacenews.com / https://auto.gasgoo.com | 商业航天与新能源汽车产业链进展 |

---

## 11. 建筑、土木工程、城市规划与地理空间（Architecture / Civil / GIS）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 土木权威学会 | ASCE（美国土木工程师学会） | https://www.asce.org | 结构力学、桥梁隧道、岩土与抗震规范 |
| 全球建筑媒体 | ArchDaily / Dezeen | https://www.archdaily.com / https://www.dezeen.com | 建筑设计案例、构造详图与空间理念 |
| 中文建筑平台 | 谷德设计网（gooood） | https://www.gooood.cn | 建筑、景观与室内高质量图纸与项目解读 |
| 地理信息文档 | QGIS / PostGIS / OSGeo Docs | https://docs.qgis.org / https://postgis.net/documentation | 坐标系、矢量/栅格分析与空间数据库实战 |
| 地球观测数据 | USGS / NASA Earthdata | https://www.usgs.gov / https://www.earthdata.nasa.gov | 地质、遥感影像与地理空间基准数据 |

---

## 12. 能源、双碳气候、化学与材料科学（Energy / Climate / Chemistry / Materials）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 权威能源机构 | IEA（国际能源署） | https://www.iea.org | 光伏、储能、电网、化石能源转型权威报告与数据 |
| 权威气候报告 | IPCC / Carbon Brief | https://www.ipcc.ch / https://www.carbonbrief.org | 气候科学评估、碳排放核算与能源政策拆解 |
| 化学权威标准 | IUPAC Gold Book / ACS Publications | https://goldbook.iupac.org / https://pubs.acs.org | 化学术语标准定义、有机/无机反应与化工文献 |
| 化合物与材料库 | PubChem / Materials Project | https://pubchem.ncbi.nlm.nih.gov / https://next-gen.materialsproject.org | 分子结构、理化性质、晶体结构与电池材料数据 |

---

## 13. 生物医学、临床健康与生命科学（Medicine / Biotech / Health）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 生物医学检索库 | PubMed (NIH / NLM) | https://pubmed.ncbi.nlm.nih.gov | 同行评审医学论文与临床试验一手证据 |
| 顶级医学期刊 | NEJM / The Lancet | https://www.nejm.org / https://www.thelancet.com | 权威临床指南、循证医学突破 |
| 权威公共卫生 | WHO / CDC | https://www.who.int / https://www.cdc.gov | 流行病学口径、疫苗与公共卫生规范 |
| 权威医学教材 | 默沙东诊疗手册（MSD Manuals） | https://www.msdmanuals.cn | 疾病机制、症状与诊断路径的严谨中文教材级说明 |
| 临床科普标杆 | Mayo Clinic | https://www.mayoclinic.org | 清晰通俗的临床健康原理解释 |
| 中文医学平台 | 丁香园 | https://www.dxy.cn | 中文临床诊疗指南解读与医学科普 |

---

## 14. 农业、食品科学、营养与运动科学（Agriculture / Food / Nutrition / Sports）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 全球粮农权威 | FAO（联合国粮农组织） | https://www.fao.org | 现代农业、土壤生态、粮食系统权威数据与手册 |
| 营养成分基准 | USDA FoodData Central | https://fdc.nal.usda.gov | 食物宏量/微量营养素权威可核验数据库 |
| 循证营养与补剂 | Examine | https://examine.com | 基于随机对照试验汇总的营养学与健康证据 |
| 食品科学实证 | Serious Eats (The Food Lab) | https://www.seriouseats.com | 美拉德反应、乳化、热传导等烹饪食品科学实验 |
| 运动科学权威 | ACSM / Stronger By Science | https://www.acsm.org / https://www.strongerbyscience.com | 运动生理、力量与耐力训练的循证指南 |

---

## 15. 金融、经济、投资与商业管理（Finance / Economics / Business）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 权威财经报刊 | The Economist（经济学人） | https://www.economist.com | 全球宏观经济、产业格局与政策深度分析 |
| 权威财经报刊 | Financial Times（金融时报） | https://www.ft.com | 资本市场、央行政策与国际金融报道 |
| 权威财经报刊 | The Wall Street Journal | https://www.wsj.com | 商业动态、企业财报与金融监管 |
| 管理权威期刊 | Harvard Business Review（哈佛商业评论） | https://hbr.org | 战略管理、组织行为与商业案例方法论 |
| 宏观数据机构 | FRED (Federal Reserve) / IMF / World Bank | https://fred.stlouisfed.org / https://www.imf.org / https://data.worldbank.org | 可核验的宏观经济、利率、通胀与全球指标 |
| 经济学术库 | NBER（美国国家经济研究局） | https://www.nber.org | 经济学实证研究工作论文 |
| 估值大师博客 | Musings on Markets (Aswath Damodaran) | https://aswathdamodaran.blogspot.com | 公司估值、DCF、资本成本实战拆解 |
| 金融概念百科 | Investopedia | https://www.investopedia.com | 金融衍生品、财务报表、会计指标清晰定义与例子 |
| 中文权威财经 | 财新网 / 国家统计局 | https://www.caixin.com / https://www.stats.gov.cn | 中国宏观经济、金融监管与权威统计口径 |

---

## 16. 会计、税务、审计与企业财务实务（Accounting / Tax / Audit）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 国际会计准则 | IFRS Foundation / FASB | https://www.ifrs.org / https://www.fasb.org | 国际财务报告准则（IFRS）与美国 GAAP 原文 |
| 中国财税官方 | 财政部会计司 / 国家税务总局 | https://kjs.mof.gov.cn / https://www.chinatax.gov.cn | 中国企业会计准则、增值税/所得税现行法规 |
| 审计行业协会 | 中国注册会计师协会（CICPA） | https://www.cicpa.org.cn | 审计准则、内控指引与实务问答 |
| 会计入门教材 | AccountingCoach | https://www.accountingcoach.com | 复式记账、三张报表勾稽关系清晰实例讲解 |

---

## 17. 供应链、运营、市场营销与增长（Supply Chain / Operations / Marketing）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 顶级管理咨询 | McKinsey Insights / BCG Publications | https://www.mckinsey.com/featured-insights / https://www.bcg.com/publications | 行业调研、供应链韧性、定价与增长框架 |
| 增长与留存实战 | Reforge Blog | https://www.reforge.com/blog | 增长飞轮、获客留存、变现模型与指标拆解 |
| 营销与搜索数据 | Think with Google / Ahrefs Blog | https://www.thinkwithgoogle.com / https://ahrefs.com/blog | 消费者洞察、SEO、内容分发与转化漏斗实证 |
| 供应链行业媒体 | Supply Chain Dive | https://www.supplychaindive.com | 库存管理、跨境物流、采购与仓储实战案例 |
| 中文营销案例 | 数英网（Digitaling） | https://www.digitaling.com | 本土品牌营销、投放与创意拆解 |

---

## 18. 产品设计、交互体验与视觉传播（Product / UX / Design）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| UX 研究权威 | Nielsen Norman Group (NN/g) | https://www.nngroup.com | 可用性研究、信息架构、实证 UX 原则 |
| 官方设计规范 | Apple HIG / Google Material Design | https://developer.apple.com/design/human-interface-guidelines / https://m3.material.io | 平台交互规范、无障碍对比度与组件行为 |
| 心理学法则库 | Laws of UX | https://lawsofux.com | 菲茨定律、希克定律、格式塔原则等图文总结 |
| 设计与前端期刊 | Smashing Magazine / A List Apart | https://www.smashingmagazine.com / https://alistapart.com | 响应式排版、设计系统与网页无障碍实践 |
| 产品战略专栏 | Lenny's Newsletter / Stratechery | https://www.lennysnewsletter.com / https://stratechery.com | 增长指标、PMF、科技商业模式分析 |
| 中文产品社区 | 人人都是产品经理 | https://www.woshipm.com | 中文互联网产品拆解与业务场景参考 |

---

## 19. 法律、合规与公共政策（Law & Policy）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 中国官方法规 | 国家法律法规数据库 | https://flk.npc.gov.cn | 全国人大与行政法规最权威现行条文 |
| 中国司法判例 | 中国裁判文书网 | https://wenshu.court.gov.cn | 真实司法裁判口径与案例实证 |
| 美国法律百科 | Cornell LII (Legal Information Institute) | https://www.law.cornell.edu | 美国法典、判例与法学词典开源权威站 |
| 欧盟法规库 | EUR-Lex | https://eur-lex.europa.eu | GDPR、EU AI Act 等欧盟法规原文 |
| 中文法律库 | 北大法宝 | https://www.pkulaw.com | 法规修订对照与司法解释检索 |

---

## 20. 人文社科、历史、心理学与写作（Humanities / Psychology / Writing）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 哲学权威辞典 | Stanford Encyclopedia of Philosophy (SEP) | https://plato.stanford.edu | 哲学、逻辑、伦理学同行评审级百科全书 |
| 心理学权威 | American Psychological Association (APA) | https://www.apa.org | 认知心理学、行为科学与实验方法口径 |
| 实证数据图谱 | Our World in Data | https://ourworldindata.org | 全球历史、人口、能源、健康可核验图表与数据 |
| 深度思想报刊 | Aeon / The Atlantic / The New Yorker | https://aeon.co / https://www.theatlantic.com / https://www.newyorker.com | 历史、社会、文化与长篇非虚构写作范本 |
| 经典随笔博客 | Paul Graham Essays | https://paulgraham.com/articles.html | 清晰写作、逻辑推演与创业思维范本 |

---

## 21. 教育学、学习科学与语言学习（Education / Learning Science / Languages）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 教育研究库 | ERIC (US Dept. of Education) / OECD Education | https://eric.ed.gov / https://www.oecd.org/education | 教学法实证研究、课程设计与国际教育评估 |
| 教学实践媒体 | Edutopia | https://www.edutopia.org | 课堂脚手架、形成性评价与项目式学习方法 |
| 认知与记忆笔记 | Andy Matuschak's Working Notes | https://notes.andymatuschak.org | 间隔重复、助记媒介与深度学习交互设计 |
| 权威语言词典 | Cambridge / Oxford Learner's / 汉典 | https://dictionary.cambridge.org / https://www.zdic.net | 英语/汉语词源、精准释义与地道搭配核查 |

---

## 22. 摄影、影视制作、音乐理论与数字艺术（Photography / Film / Music / Art）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 摄影光学教材 | Cambridge in Colour / DPReview | https://www.cambridgeincolour.com / https://www.dpreview.com | 曝光三角、色彩管理、镜头光学与器材实测 |
| 影视制作社区 | No Film School | https://nofilmschool.com | 分镜、布光、剪辑节奏与调色实战拆解 |
| 乐理开源教材 | MusicTheory.net / Open Music Theory | https://www.musictheory.net / https://viva.pressbooks.pub/openmusictheory | 音程、和弦、调式、对位与曲式交互式教程 |
| 音频制作权威 | Sound On Sound | https://www.soundonsound.com | 混音、EQ、压缩器、合成器与声学原理 |
| 3D 数字艺术 | Blender Official Manual | https://docs.blender.org/manual | 建模、拓扑、材质节点与渲染管线权威文档 |

---

## 23. 开源大学教材与跨学科综合核验（Open Textbooks & Cross-Check）

| 类别 | 名称 | 域名 / 链接 | 适用场景 |
|---|---|---|---|
| 免费大学教材 | OpenStax (Rice University) | https://openstax.org | 物理、化学、生物、经济、统计等同行评审大学教材 |
| 学术引文检索 | Google Scholar / Semantic Scholar | https://scholar.google.com / https://www.semanticscholar.org | 跨学科查找高引综述与一手出处 |
| 线索起点 | Wikipedia | https://en.wikipedia.org / https://zh.wikipedia.org | 仅作概念全景与参考文献索引起点，**正文结论必须回溯一手出处核验** |
