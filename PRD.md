# Stayly — 1-Page PRD (Airbnb / STR 房东 Listing 审计)

> 状态：静态审计站已上线（GitHub Pages + Formspree 真实邮件捕获）。本 PRD 锁定立项假设、MVP 范围与验证门槛，供达到流量门槛后进开发。
> 立项结论：GO（需求发现轮次#8，2026-07-22）

## 1. 楔子（Wedge）
免费「Airbnb Listing 就绪度」0–100 综合审计（标题/描述/照片/设施/定价/信任六维）→ 付费 AI 改写标题与描述。
- 不做「连账号自动改写」（规避 Airbnb 合规 + 与 AutoRank 红海重叠）；只给可复制的建议文本，房东自己粘贴。
- 差异化 GTM：freemium 订阅 $9/mo + 七站卖家工具矩阵交叉引流 + Formspree 真实邮件捕获，对标 DoctorAirbnb（$29 一次性，无订阅漏斗、无矩阵）。

## 2. 目标用户
- 核心：Airbnb 个人房东 / 短租（STR）运营者，1–20 套房源，对入住率敏感（平均 48% vs 头部 78%+）。
- 规模：Airbnb 5M+ 房东、9M+ 活跃 listing；典型美国房东年收入 ~$13.8K–15K。
- 痛点锚点：90% 旅客只看前 20 个 listing；PriceLabs 研究 10,000+ listing 仅 12% 达强内容标准，达标者本地超额 +35%。

## 3. MVP 范围（Next.js + Supabase + LLM，复用 etsy-listing-ai/mvp 骨架）
- 落地页/审计：六维评分（已在前端静态站验证，弱=35/中=61/强=90 可分化）。
- 生成页：`/rewrite` — 输入 listing 要素 → LLM 重写标题（至 50 字符上限、含地点+房型+卖点）+ 描述（500+ 字、覆盖布局/光线/地段/入住/规则）。
- 匿名埋点：`/api/audit-log` 记录审计次数与分数分布（解决静态站 demo 仅 localStorage 的「无集中度量」缺口）。
- 邮件捕获：Supabase 表 `leads`（email + source + ts），替代 Formspree 做自有漏斗。
- 单 listing 改写推理成本 < $0.02（复用 DeepSeek/低成本 LLM）。

## 4. 商业模式
- Freemium：`$0` 审计（含 3 条免费建议） → `$9/mo` 解锁 AI 改写 + 多 listing 批量 + 周报。锚定与前六站 $9 一致。
- 对标：DoctorAirbnb $29 一次性、AutoRank $9/listing/mo、Homai $49/mo → $9/mo 订阅在低价锚定且有矩阵引流下具竞争力。
- 单房东 LTV：按 6 个月留存 ≈ $54；获客靠矩阵互链 + Reddit/PH 零成本。

## 5. 验证门槛（进 MVP 硬性条件）
- 各站跑 2 周真实流量：**≥200 审计使用 + ≥50 邮箱订阅** → 进 MVP（复用 etsy-listing-ai/mvp 骨架）。
- 未达则继续内容分发 + SEO，不进开发（避免 premature MVP 浪费）。

## 6. 风险
- 直接竞品占位（DoctorAirbnb/KleoScribe）：靠免费审计漏斗 + 七站矩阵交叉引流 + 订阅制拉开。
- 房东 AI 工具采用度低于创作者：用「48% 平均入住率」痛点教育 + 免费审计降门槛。
- Airbnb 政策变动：仅给建议文本、不自动改账号，规避合规风险。

## 7. 与六站矩阵关系
- 同属「优化你的 listing 多赚钱」卖家/创作者工具矩阵；Stayly 覆盖 短租房东，与 Listora(Etsy)/BookListing(KDP)/Mockly(POD) 共享「listing 审计→AI 改写→订阅」飞轮。
- 七站 footer 互链已就位，形成内部交叉漏斗。
