# Authoritative Sources & High-Signal Reference Directory (23 Domains)

> Used by `day-up` to run targeted `search_web` verification before writing every chapter.
> **Core principle**: Anchor technical definitions and current versions on **primary standards, official docs, and peer-reviewed journals first**, then consult **practitioner blogs for grounded examples, visual intuition, and real postmortems**. Every URL placed in `references` must be actually retrieved and verified—**never fabricate URLs**.

---

## 3-Round Freshness Protocol & Niche-Field Fallback

> **Anti-Staleness Rule**: Never search only generic static definitions. Actively check releases, standard revisions, and deprecations from the past 12–18 months so **today's mainstream practice forms the chapter's main track** (never teach deprecated APIs or legacy frameworks as current best practice).

- **Round 1 · Anchor to current-year authoritative standards**: `<topic> <current_year> OR latest OR release OR guideline site:<official_doc_or_journal>`
- **Round 2 · Audit deprecations & migrations**: `<topic> deprecated OR migration OR "replaced by" <current_year>`
- **Round 3 · Real-world practitioner cases & postmortems**: `<topic> production OR postmortem OR case study <current_year> site:<practitioner_blog>`
- **Visual guides & intuition**: `<topic> visual guide OR illustrated OR explained`
- **Niche / emerging discipline fallback** (if outside the 23 domains below): ① Search current international/national standards (`ISO`, `IEC`, `IEEE`, `RFC`, official `.gov`); ② Search recent top university lecture notes (`site:edu` + `syllabus` / `lecture notes` + current year); ③ Search leading industry association annual reports or recent practitioner postmortems.

---

## 1. AI, Machine Learning & LLMs
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Preprints | arXiv (cs.CL / cs.LG / cs.AI) | https://arxiv.org | Original paper equations, experiments, primary citations |
| Official Docs | Hugging Face Docs & Blog | https://huggingface.co/blog | Open-model training, Transformers / Diffusers / PEFT / TRL |
| Research Blog | Anthropic Research & Engineering | https://www.anthropic.com/research | Alignment, Agents, long context, engineering practice |
| Research Blog | OpenAI Research | https://openai.com/research | Frontier model mechanisms & evaluation standards |
| Research Blog | Google DeepMind Blog | https://deepmind.google/discover/blog/ | Algorithmic breakthroughs & AI for science |
| Top Blog | Lil'Log (Lilian Weng) | https://lilianweng.github.io | Systematic surveys (Agents, RLHF, Diffusion, etc.) |
| Visual Blog | Jay Alammar (Illustrated Series) | https://jalammar.github.io | Visual Transformer / Attention / LLM intuition |
| Technical Blog | Sebastian Raschka (Ahead of AI) | https://magazine.sebastianraschka.com | LLM architecture breakdowns & code walkthroughs |
| Open Textbook | Nathan Lambert (RLHF Book / Interconnects) | https://rlhfbook.com / https://www.interconnects.ai | Post-training, SFT / DPO / RLVR standards & updates |
| Visual Journal | Distill | https://distill.pub | Interactive visual ML explanations |

## 2. Software Engineering, Programming Languages & Web
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Web Standard | MDN Web Docs | https://developer.mozilla.org | HTTP, HTML/CSS/JS, Browser APIs gold standard |
| Language Docs | Python / Rust / Go / TypeScript Docs | https://docs.python.org / https://doc.rust-lang.org / https://go.dev/doc | Official semantics, stdlib & memory models |
| Architecture | Martin Fowler | https://martinfowler.com | Software architecture, refactoring, DDD, distributed patterns |
| Visual Zines | Julia Evans (Wizard Zines) | https://jvns.ca | Linux, Git, DNS, HTTP crystal-clear diagrams & hooks |
| Frontend Deep | Dan Abramov (Overreacted) / Josh W. Comeau | https://overreacted.io / https://www.joshwcomeau.com | React mental models, CSS layout & rendering engine intuition |
| Web Perf | Google web.dev | https://web.dev | Browser rendering pipeline, Core Web Vitals, modern Web |
| Eng. Blogs | Stripe / Netflix / Discord / Dropbox Engineering | https://stripe.com/blog/engineering / https://netflixtechblog.com | High concurrency, idempotency, reliability & real postmortems |
| Chinese Eng. | Meituan Tech / CoolShell / Ruan Yifeng | https://tech.meituan.com / https://coolshell.cn / https://www.ruanyifeng.com/blog | Production backend systems, distributed engineering, clean primers |

## 3. Networking, Operating Systems, Databases & Cloud Native
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Standards | IETF RFC Datatracker | https://datatracker.ietf.org | HTTP/1.1/2/3, TCP, TLS, DNS, OAuth primary specs |
| Kernel Docs | Linux Kernel Documentation | https://docs.kernel.org | Scheduling, virtual memory, eBPF, filesystems |
| Official Docs | PostgreSQL / MySQL / Redis / Kubernetes | https://www.postgresql.org/docs / https://kubernetes.io/docs | Transaction isolation, indexing, container orchestration |
| Networking | Cloudflare Blog | https://blog.cloudflare.com | BGP, TLS, QUIC/HTTP3, DDoS & global network measurements |
| Performance | Brendan Gregg's Blog | https://www.brendangregg.com | Linux performance profiling, flame graphs, eBPF |
| DB Indexing | Use The Index, Luke! | https://use-the-index-luke.com | Visual SQL B-Tree indexing & execution plans |
| Distributed | AWS Builders' Library | https://aws.amazon.com/builders-library | Retries, backpressure, timeouts & fault tolerance |
| Cloud Native | CNCF Blog | https://www.cncf.io/blog | Cloud-native ecosystem, service mesh, observability |

## 4. Cybersecurity & Cryptography
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Web Security | OWASP Foundation | https://owasp.org | Web Top 10, vulnerability mechanics & defense checklists |
| Crypto Specs | NIST CSRC | https://csrc.nist.gov | AES / SHA / post-quantum crypto standards & Zero Trust |
| Interactive Lab | PortSwigger Web Security Academy | https://portswigger.net/web-security | XSS, SQLi, CSRF, SSRF mechanisms & hands-on labs |
| Zero-Day | Google Project Zero | https://googleprojectzero.blogspot.com | Memory safety, browser & kernel vulnerability research |
| Security Blog | Schneier on Security / Krebs on Security | https://www.schneier.com / https://krebsonsecurity.com | Threat modeling, cryptography & real incident analyses |

## 5. Game Development, Computer Graphics & Media
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Talks & Press | GDC Vault / Game Developer | https://www.gdcvault.com / https://www.gamedeveloper.com | Engine architecture, physics, level design & postmortems |
| Graphics Texts | LearnOpenGL / Scratchapixel | https://learnopengl.com / https://www.scratchapixel.com | Rendering pipelines, rasterization, ray tracing, shaders |
| Math & Algos | Inigo Quilez / Red Blob Games | https://iquilezles.org / https://www.redblobgames.com | SDFs, shader math, A* pathfinding & interactive geometry |
| Engine/Codec | Godot / Unreal / Unity / FFmpeg Docs | https://docs.godotengine.org / https://ffmpeg.org/documentation.html | Engine workflows, H.264/AV1/WebRTC media pipelines |

## 6. Data Science, Statistics, Quant & Visualization
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Visual Stats | Seeing Theory (Brown Univ.) | https://seeing-theory.brown.edu | Probability, Bayesian inference & regression visuals |
| Stats Blog | Statistical Modeling (Andrew Gelman) | https://statmodeling.stat.columbia.edu | Bayesian modeling, causal inference & experimental pitfalls |
| Open Books | R for Data Science / Python Data Science Handbook | https://r4ds.hadley.nz | Data cleaning, EDA & reproducible modeling workflows |
| DataViz | FlowingData / Observable | https://flowingdata.com / https://observablehq.com | Chart selection principles & narrative visualization |
| Q&A & Quant | Cross Validated / Kaggle Learn / QuantConnect | https://stats.stackexchange.com / https://www.kaggle.com/learn | Hypothesis testing, A/B testing & quantitative risk control |

## 7. Mathematics, Physics & Natural Sciences
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Top Journals | Nature / Science (AAAS) | https://www.nature.com / https://www.science.org | Frontier natural-science discoveries & reviews |
| Science Media | Quanta Magazine | https://www.quantamagazine.org | Deep, ultra-readable math, theoretical physics & CS reporting |
| Open Courses | MIT OpenCourseWare | https://ocw.mit.edu | Classic university lecture notes in linear algebra, calculus, physics |
| Visual Math | 3Blue1Brown | https://www.3blue1brown.com | Geometric intuition for linear algebra, calculus & Fourier |
| Math Blogs | What's new (Terence Tao) / Paul's Online Math Notes | https://terrytao.wordpress.com / https://tutorial.math.lamar.edu | Proof strategies, worked calculus/ODE examples & definitions |

## 8. Electrical Engineering, Hardware, Embedded & Semiconductors
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Eng. Magazine | IEEE Spectrum | https://spectrum.ieee.org | Chips, robotics, communications & frontier hardware |
| Chip Analysis | SemiAnalysis / Chips and Cheese | https://www.semianalysis.com / https://chipsandcheese.com | GPU/CPU microarchitecture, HBM & interconnect benchmarks |
| Open Textbook | All About Circuits | https://www.allaboutcircuits.com/textbook | Analog/digital circuits, power & signal processing |
| Vendor Docs | ARM / RISC-V / ESP-IDF / Hackaday | https://developer.arm.com / https://riscv.org / https://hackaday.com | ISA specs, embedded drivers & hands-on PCB projects |

## 9. Mechanical Engineering, Robotics & Control
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Standards | ASME | https://www.asme.org | Mechanical design, thermodynamics, fluids & manufacturing |
| Robotics | ROS 2 Documentation / The Robot Report | https://docs.ros.org / https://www.therobotreport.com | Node graphs, SLAM, motion planning & industrial robotics |
| Control & Ref | MathWorks Control Docs / Engineering ToolBox | https://www.mathworks.com/help / https://www.engineeringtoolbox.com | PID, state-space, Kalman filters & verifiable property tables |

## 10. Aerospace, Transportation & Automotive
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Space Reports | NASA NTRS / ESA | https://ntrs.nasa.gov / https://www.esa.int | Orbital mechanics, aerodynamics, propulsion & space systems |
| Auto & AD | SAE International / Autoware Docs / SpaceNews | https://www.sae.org / https://autowarefoundation.github.io/autoware-documentation | Autonomy levels (L0–L5), full-stack perception/planning |

## 11. Architecture, Civil Engineering & Geospatial (GIS)
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Civil & Arch | ASCE / ArchDaily / Dezeen | https://www.asce.org / https://www.archdaily.com / https://www.dezeen.com | Structural engineering, seismic codes & architectural details |
| GIS & Earth | QGIS / PostGIS / USGS / NASA Earthdata | https://docs.qgis.org / https://postgis.net/documentation / https://www.usgs.gov | Coordinate systems, spatial SQL & remote-sensing data |

## 12. Energy, Climate, Chemistry & Materials
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Energy/Climate | IEA / IPCC / Carbon Brief | https://www.iea.org / https://www.ipcc.ch / https://www.carbonbrief.org | Solar, storage, grid transition & carbon accounting |
| Chem/Materials | IUPAC Gold Book / ACS / PubChem / Materials Project | https://goldbook.iupac.org / https://pubchem.ncbi.nlm.nih.gov / https://next-gen.materialsproject.org | Chemical nomenclature, molecular & crystal/battery data |

## 13. Medicine, Clinical Health & Life Sciences
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Primary Index | PubMed (NIH / NLM) | https://pubmed.ncbi.nlm.nih.gov | Peer-reviewed clinical trials & biomedical evidence |
| Top Journals | NEJM / The Lancet | https://www.nejm.org / https://www.thelancet.com | Clinical guidelines & evidence-based breakthroughs |
| Public Health | WHO / CDC | https://www.who.int / https://www.cdc.gov | Epidemiology, vaccines & public-health standards |
| Clinical Refs | MSD Manuals / Mayo Clinic | https://www.msdmanuals.com / https://www.mayoclinic.org | Rigorous disease pathophysiology, symptoms & diagnostics |

## 14. Agriculture, Food Science, Nutrition & Sports Science
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Food/Agri | FAO / USDA FoodData Central | https://www.fao.org / https://fdc.nal.usda.gov | Global agriculture & verifiable nutrient composition data |
| Evidence | Examine / Serious Eats (Food Lab) / ACSM / Stronger By Science | https://examine.com / https://www.seriouseats.com / https://www.strongerbyscience.com | RCT nutrition evidence, food chemistry & exercise physiology |

## 15. Finance, Economics, Investing & Business
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Financial Press | The Economist / Financial Times / WSJ / HBR | https://www.economist.com / https://www.ft.com / https://hbr.org | Macroeconomics, markets, strategy & business cases |
| Macro Data | FRED / IMF / World Bank / NBER | https://fred.stlouisfed.org / https://data.worldbank.org / https://www.nber.org | Verifiable rates, inflation, GDP & empirical economics papers |
| Valuation | Musings on Markets (Damodaran) / Investopedia | https://aswathdamodaran.blogspot.com / https://www.investopedia.com | DCF valuation, cost of capital & financial statements |

## 16. Accounting, Tax & Audit
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Standards | IFRS Foundation / FASB | https://www.ifrs.org / https://www.fasb.org | International IFRS & US GAAP primary texts |
| Primers | AccountingCoach / National Tax Authorities | https://www.accountingcoach.com | Double-entry bookkeeping & three-statement linkages |

## 17. Supply Chain, Operations, Marketing & Growth
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Strategy/Growth | McKinsey Insights / BCG / Reforge Blog | https://www.mckinsey.com/featured-insights / https://www.reforge.com/blog | Pricing, retention loops, growth & supply-chain frameworks |
| Marketing/Ops | Think with Google / Ahrefs Blog / Supply Chain Dive | https://www.thinkwithgoogle.com / https://ahrefs.com/blog / https://www.supplychaindive.com | Conversion funnels, SEO & logistics case studies |

## 18. Product Design, UX & Visual Communication
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| UX Research | Nielsen Norman Group (NN/g) / Laws of UX | https://www.nngroup.com / https://lawsofux.com | Empirical usability research, information architecture & psychology |
| Design Systems | Apple HIG / Material Design / Smashing Magazine | https://developer.apple.com/design/human-interface-guidelines / https://m3.material.io | Accessibility, interaction specs & typography systems |
| Product | Lenny's Newsletter / Stratechery | https://www.lennysnewsletter.com / https://stratechery.com | PMF, product metrics & tech business strategy |

## 19. Law, Compliance & Public Policy
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Statutes/Cases | Cornell LII / EUR-Lex / National Legislative Databases | https://www.law.cornell.edu / https://eur-lex.europa.eu / https://flk.npc.gov.cn | Primary statutes (US Code, GDPR, EU AI Act, PRC statutes) & case law |

## 20. Humanities, History, Psychology & Writing
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Academic | Stanford Encyclopedia of Philosophy / APA | https://plato.stanford.edu / https://www.apa.org | Peer-reviewed philosophy, logic & cognitive psychology |
| Data & Essays | Our World in Data / Aeon / The Atlantic / Paul Graham | https://ourworldindata.org / https://aeon.co / https://paulgraham.com/articles.html | Historical empirical data, deep essays & clear reasoning |

## 21. Education, Learning Science & Languages
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Learning Sci | ERIC / OECD Education / Edutopia / Andy Matuschak | https://eric.ed.gov / https://www.edutopia.org / https://notes.andymatuschak.org | Pedagogy research, scaffolding, spaced repetition & mnemonic media |
| Dictionaries | Cambridge / Oxford Learner's | https://dictionary.cambridge.org | Etymology, precise definitions & idiomatic usage |

## 22. Photography, Film, Music Theory & 3D Art
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Photo/Film | Cambridge in Colour / DPReview / No Film School | https://www.cambridgeincolour.com / https://nofilmschool.com | Exposure, optics, color management, lighting & editing |
| Music & 3D | Open Music Theory / Sound On Sound / Blender Manual | https://viva.pressbooks.pub/openmusictheory / https://www.soundonsound.com / https://docs.blender.org/manual | Harmony, mixing acoustics & 3D rendering pipelines |

## 23. Open University Textbooks & Cross-Disciplinary Verification
| Category | Source | Domain / URL | Best For |
|---|---|---|---|
| Open Texts | OpenStax (Rice University) | https://openstax.org | Peer-reviewed university textbooks (physics, econ, bio, stats) |
| Citation Index | Google Scholar / Semantic Scholar | https://scholar.google.com / https://www.semanticscholar.org | High-citation surveys & primary literature lookup |
| Starting Index | Wikipedia | https://en.wikipedia.org | Orientation & citation starting point only—**verify claims at primary sources** |
