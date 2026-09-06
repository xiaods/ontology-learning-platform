# 本体智能教学平台 (Ontology Intelligence Platform)

基于 Palantir Ontology 产品能力的交互式演示平台。以医疗供应链（Onyx 场景）为案例，完整展示本体建模、数据集成到应用构建的全链路产品能力。

## 项目背景

本项目源于《AI 本体论与共享模型》课程研究。当 AI Agent 从演示走向生产，企业面临的最大瓶颈不是模型能力，而是**语义基础设施的缺失**。本体论——这门从 1990 年代就存在的 AI 学科——恰好解决这些问题。

Palantir 的 Ontology 平台将本体论从学术论文推向工业级实践。本项目是对其产品能力的交互式演示，帮助组织建立「语义可推理」的数据基础设施认知。

## 平台模块

### 本体建模 (Ontology Modeling)

| 模块 | 路径 | 能力 |
|------|------|------|
| Ontology Explorer | `/` | 可视化本体图谱，点击节点查看详情 |
| Object Types | `/ontology/objects` | 对象类型 CRUD、属性定义、主键配置 |
| Link Types | `/ontology/links` | 关系类型、基数约束、关系矩阵 |
| Action Types | `/ontology/actions` | 操作类型、参数定义、执行效果 |
| Interface Types | `/ontology/interfaces` | 共享属性契约、多态实现 |

### 数据集成 (Data Integration)

| 模块 | 路径 | 能力 |
|------|------|------|
| Data Sources | `/data/sources` | 数据源管理、同步状态监控 |
| Pipeline Builder | `/data/pipelines` | 可视化管道构建、ETL 配置 |

### 应用构建 (Application Building)

| 模块 | 路径 | 能力 |
|------|------|------|
| Workshop | `/apps/workshop` | 应用组装台，组件拖拽配置 |
| Investigation | `/apps/investigation` | 实例查询、关联探索、数据分析 |

## 演示场景：Onyx 医疗供应链

平台以 Palantir 公开的 Onyx 医疗制造商案例为演示场景：

- **8 个 Object Type**：RawMaterial, Supplier, PurchaseOrder, ProductionLine, Product, BillOfMaterials, SupplyDisruption, DecisionLog
- **7 个 Link Type**：suppliedBy, orderedIn, produces, contains, belongsTo, disrupts, documentsDecision
- **6 个 Action Type**：Declare Disruption → Recommend Alternative → Execute Emergency PO → Reroute Production → Resolve Disruption
- **完整决策闭环**：检测 → 评估 → 决策 → 执行 → 恢复

## 技术栈

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** 暗色主题
- **SVG** 可视化图谱（无外部依赖）
- **静态导出**，无需后端服务

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build && npm start
```

访问 `http://localhost:3000`

## 项目结构

```
├── src/
│   ├── app/                        # Next.js App Router 页面
│   │   ├── page.tsx                # Ontology Explorer（首页）
│   │   ├── layout.tsx              # 根布局 + 暗色主题
│   │   ├── globals.css             # Tailwind 全局样式
│   │   ├── ontology/               # 本体建模模块
│   │   │   ├── objects/            # Object Types 管理
│   │   │   ├── links/              # Link Types 管理
│   │   │   ├── actions/            # Action Types 管理
│   │   │   └── interfaces/         # Interface Types 管理
│   │   ├── data/                   # 数据集成模块
│   │   │   ├── sources/            # 数据源管理
│   │   │   └── pipelines/          # 管道构建器
│   │   └── apps/                   # 应用构建模块
│   │       ├── workshop/           # 应用组装台
│   │       └── investigation/      # 实例探索查询
│   ├── components/
│   │   └── Layout.tsx              # 侧边栏导航 + 顶栏
│   └── data/
│       └── ontology-model.ts       # 本体数据定义
├── textbook/                       # 课程教材
│   ├── palantir-ontology-course.md # 主课程文档
│   ├── 讲师手册.md
│   ├── PPT大纲.md
│   ├── 案例库.md
│   └── ...
├── materials/                      # 分节课程笔记
│   ├── section1/                   # 核心概念
│   ├── section2/                   # 共享模型
│   ├── section3/                   # Palantir 设计
│   └── section4/                   # 落地实施
└── docs/
    └── superpowers/specs/          # 平台设计文档
```

## 教材内容

平台基于以下四节课程材料构建：

| 章节 | 内容 | 对应平台能力 |
|------|------|-------------|
| 第一节 | 核心本体概念（Gruber 定义、五要素、辨析光谱） | Object/Link/Action 原语 |
| 第二节 | 共享模型（语义漂移、多 Agent 协同契约） | Link Types、Interface Types |
| 第三节 | Palantir 设计（三大原语、四层架构、反模式） | Ontology Explorer 可视化 |
| 第四节 | 落地实施（Onyx 案例、成熟度模型） | Workshop、Investigation |

## 设计原则

1. **建模现实，而非系统**：Object Type 对应真实世界实体
2. **关系即一等公民**：Link Type 拥有独立属性和约束
3. **操作可复用可审计**：Action Type 封装参数、效果、审批
4. **接口定义契约**：Interface Type 保证跨对象一致性
5. **从数据到决策闭环**：Pipeline → Ontology → Application → Decision

## License

本项目仅供教学演示使用。
