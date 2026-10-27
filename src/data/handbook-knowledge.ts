// Executable Ontology Handbook (awch-D, Apache-2.0) knowledge points, distilled
// into citable teaching data. Source: https://github.com/awch-D/Executable-Ontology-Handbook
// Each point carries its handbook chapter so the UI can always show provenance.

export type KnowledgeGroup = 'semantic' | 'dynamic' | 'model' | 'governance';

export interface KnowledgePoint {
  id: string;
  /** Handbook chapter number, 1-12. */
  chapter: number;
  /** Chapter title as published. */
  chapterTitle: string;
  term: string;
  /** The handbook's own one-line definition, kept close to source wording. */
  definition: string;
  /** What a learner gets wrong without this point. */
  why: string;
  group: KnowledgeGroup;
  /** Ids from src/data/ontology-model.ts this point explains. */
  relatedObjects?: string[];
  relatedLinks?: string[];
  relatedActions?: string[];
  relatedInterfaces?: string[];
}

export const knowledgeGroups: Record<KnowledgeGroup, { label: string; color: string; hint: string }> = {
  semantic: { label: '语义元素', color: '#3b82f6', hint: '世界“有什么”：名词与关系' },
  dynamic: { label: '动力元素', color: '#f59e0b', hint: '世界“如何变化”：逻辑与行动' },
  model: { label: '架构与边界', color: '#8b5cf6', hint: '本体在系统中处于哪一层' },
  governance: { label: '治理与成熟度', color: '#10b981', hint: '如何安全落地并持续演进' },
};

export const knowledgePoints: KnowledgePoint[] = [
  {
    id: 'kp-ontology-definition',
    chapter: 1,
    chapterTitle: 'Ontology 到底是什么',
    term: '可执行本体',
    definition:
      '企业现实的实时、受治理、可执行数字模型：业务对象与关系 + 计算与规则 + 受控行动 + 动态安全与审计。',
    why: '只建实体和关系，得到的是知识图谱；加上受控行动与审计，才成为运营系统。',
    group: 'semantic',
    relatedObjects: ['raw-material', 'supplier'],
    relatedLinks: ['supplied-by'],
  },
  {
    id: 'kp-operational-layer',
    chapter: 1,
    chapterTitle: 'Ontology 到底是什么',
    term: 'Operational Layer（运营层）',
    definition:
      'Palantir 将 Ontology 定位在数据集、虚拟表和模型之上，把数字资产连接到工厂、设备、订单等现实对象，同时包含语义元素与可执行元素。',
    why: '把本体理解成“又一层报表视图”会低估它的范围：它要承担读写、事务与行动。',
    group: 'model',
  },
  {
    id: 'kp-object-type',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Object Type（对象类型）',
    definition: '现实概念的类型定义，把底层数据映射成业务可理解的实例集合。',
    why: '直接照搬数据库表名当对象，会把某个系统的实现历史固化成业务语义。',
    group: 'semantic',
    relatedObjects: ['raw-material', 'supplier', 'purchase-order', 'production-line', 'product', 'bill-of-materials', 'supply-disruption', 'decision-log'],
  },
  {
    id: 'kp-property',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Property（属性）',
    definition: '对象的字段与状态，例如库存量、承诺日期、风险等级；应有类型、来源、业务解释与权限。',
    why: '属性没有来源与负责人，本体会在几轮迭代后失去可信度。',
    group: 'semantic',
    relatedObjects: ['raw-material', 'purchase-order'],
  },
  {
    id: 'kp-link-type',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Link Type（关系类型）',
    definition: '对象间有意义的连接，例如“供应商供应物料”“订单消耗物料”；关系使影响分析和跨对象导航成为可能。',
    why: '没有关系，就只能逐表查询；有关系，才能回答“这批原料延期会影响哪些产品”。',
    group: 'semantic',
    relatedLinks: ['supplied-by', 'ordered-in', 'produces', 'contains', 'belongs-to', 'disrupts', 'documents-decision'],
  },
  {
    id: 'kp-interface',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Interface（接口类型）',
    definition: '描述一类对象共同的形状与能力，提供类似多态的建模方式，使不同对象以一致方式被查询和操作。',
    why: '没有接口，每个对象都要单独写一套权限与校验，跨对象一致性无法保证。',
    group: 'semantic',
    relatedInterfaces: ['identifiable', 'auditable', 'status-trackable'],
  },
  {
    id: 'kp-object-set',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Object Set（对象集合）',
    definition: '按条件形成的动态业务集合，例如“未来 7 天内高风险订单”，通常是分析、应用和动作的输入。',
    why: '集合是动态查询结果而非数据副本；把它当快照保存，会让决策基于过期事实。',
    group: 'semantic',
  },
  {
    id: 'kp-metadata',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Metadata（元数据）',
    definition: '标签、描述、血缘、负责人、版本与治理信息，让本体可发现、可维护、可审计。',
    why: '缺少元数据，模型规模一大就没人敢改，也没人知道字段该找谁确认。',
    group: 'governance',
  },
  {
    id: 'kp-action-type',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Action Type（动作类型）',
    definition:
      '一次业务事务的定义：可同时修改一个或多个对象、属性和关系，并携带参数、提交条件、校验规则与副作用。',
    why: '动作是“分析系统”与“运营系统”的分水岭；没有动作，洞察无法落地。',
    group: 'dynamic',
    relatedActions: ['declare-disruption', 'execute-emergency-po', 'reroute-production', 'resolve-disruption', 'recommend-alternative'],
  },
  {
    id: 'kp-function',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Function（函数）',
    definition: '承载可演化的业务逻辑，从简单计算到多步骤编排；可连接传统算法、机器学习模型、优化器和 LLM。',
    why: '函数应输入明确、输出可验证、版本可追踪、失败可观测，否则规则会变成黑箱。',
    group: 'dynamic',
  },
  {
    id: 'kp-dynamic-security',
    chapter: 4,
    chapterTitle: '语义元素与动力元素',
    term: 'Dynamic Security（动态安全）',
    definition: '每次交互时综合数据行列权限、用户组属性、用途、标记、项目范围与动作授权。',
    why: '能看见 ≠ 能推理 ≠ 能提交 ≠ 能写回，四类权限必须分别治理。',
    group: 'governance',
  },
  {
    id: 'kp-four-part-model',
    chapter: 3,
    chapterTitle: '四位一体的决策模型',
    term: 'Data / Logic / Action / Security',
    definition:
      'Palantir 把每个运营决策拆成四要素：决策所需信息、评价方案的计算过程、把选择变成真实操作、确保读写与执行符合组织政策。',
    why: '缺任何一维都会退化：只有 Data 是报表，加上 Logic 是分析，补上 Action 才是运营，Security 让它可被企业采用。',
    group: 'model',
  },
  {
    id: 'kp-decision-record',
    chapter: 3,
    chapterTitle: '四位一体的决策模型',
    term: '一次决策的完整表达',
    definition: '谁，基于哪一版事实，调用什么逻辑，在何种权限下，选择并执行了哪个行动，最终产生什么结果。',
    why: '这是决策血缘的最小单位；缺任一项，事后都无法复盘或审计。',
    group: 'governance',
    relatedObjects: ['decision-log'],
    relatedLinks: ['documents-decision'],
  },
  {
    id: 'kp-three-layer-arch',
    chapter: 5,
    chapterTitle: 'Ontology System 系统架构',
    term: 'Language / Engine / Toolchain',
    definition:
      'Language 负责表达（对象、属性、关系、接口、动作）；Engine 负责实时读写、状态订阅、原子事务与 CDC；Toolchain 负责开发、测试、发布与治理。',
    why: '缺少任意一层，都会退化为“模型画得很好，但无法稳定运行”。',
    group: 'model',
  },
  {
    id: 'kp-writeback-loop',
    chapter: 5,
    chapterTitle: 'Ontology System 系统架构',
    term: '一次读写闭环',
    definition: '同步事实 → 形成对象 → 运行逻辑 → 提交行动 → 记录结果（决策血缘、反馈、审计、学习）。',
    why: '闭环的最后一环常被忽略；没有结果回写与审计，系统无法从执行中学习。',
    group: 'model',
    relatedObjects: ['decision-log', 'purchase-order'],
  },
  {
    id: 'kp-vs-knowledge-graph',
    chapter: 6,
    chapterTitle: '与相似概念的区别',
    term: '知识图谱 vs 可执行本体',
    definition:
      '知识图谱回答“事实怎样关联”，强在实体关系与语义检索，但常停留在可查询；可执行本体还要有受治理写回与运营动作。',
    why: '把本体项目做成知识图谱，最常见的结果是“图很漂亮，业务没人用”。',
    group: 'model',
  },
  {
    id: 'kp-vs-semantic-layer',
    chapter: 6,
    chapterTitle: '与相似概念的区别',
    term: '语义层 / 数字孪生 / BPM 的缺口',
    definition:
      '语义层通常是读优化层，不承担事务与行动；数字孪生偏实时镜像与仿真；BPM 擅长流程编排但缺全域对象模型。',
    why: '这些技术会被本体复用，但都不等同于本体；混同会导致边界与预算失控。',
    group: 'model',
  },
  {
    id: 'kp-supply-case',
    chapter: 7,
    chapterTitle: '完整案例：关键物料突然断供',
    term: '缺料七步闭环',
    definition:
      '事件进入本体 → 沿关系计算影响 → 调用逻辑资产 → 建立隔离场景 → 权限与人工复核 → 提交 Action → 沉淀决策血缘。',
    why: '知识图谱只能告诉你哪些订单受影响；可执行本体要让你评估方案、提交动作、写回并从结果学习。',
    group: 'dynamic',
    relatedObjects: ['supply-disruption', 'raw-material', 'bill-of-materials', 'product', 'purchase-order'],
    relatedActions: ['declare-disruption', 'execute-emergency-po'],
  },
  {
    id: 'kp-scenario',
    chapter: 7,
    chapterTitle: '完整案例：关键物料突然断供',
    term: 'Scenario（隔离场景）',
    definition: '与生产隔离的候选变更与仿真空间，用于评估方案对其它产品与客户的连锁影响，不改生产数据。',
    why: '把推演直接写进生产系统，等于用真实订单做实验。',
    group: 'dynamic',
  },
  {
    id: 'kp-agent-interface',
    chapter: 8,
    chapterTitle: 'AI Agent 如何接入 Ontology',
    term: 'Agent 的六类本体能力',
    definition:
      '读取业务对象、调用确定性工具、提出或执行行动、继承安全边界、保留完整审计、建立可控记忆。',
    why: 'Agent 需要的不是原始表，而是带语义、权限与操作边界的现实上下文。',
    group: 'governance',
  },
  {
    id: 'kp-agent-ladder',
    chapter: 8,
    chapterTitle: 'AI Agent 如何接入 Ontology',
    term: '五级授权阶梯',
    definition:
      '只读检索与解释 → 调用只读计算工具 → 生成可审查方案 → 暂存 Action 待人工批准 → 低风险动作自动闭环。',
    why: '不要把“能访问 LLM”误认为“能执行企业操作”；自治程度应由测试、失败成本与可逆性决定。',
    group: 'governance',
  },
  {
    id: 'kp-minimal-loop',
    chapter: 9,
    chapterTitle: '如何落地建设',
    term: '最小闭环起步',
    definition:
      '不要从“全企业本体”开局；选择一个高价值运营决策，反推最小对象、属性、链接与动作，再用真实数据验证。',
    why: '一次性全覆盖建模几乎必然超期，且缺少真实反馈来修正语义。',
    group: 'governance',
  },
  {
    id: 'kp-launch-checklist',
    chapter: 9,
    chapterTitle: '如何落地建设',
    term: '上线前十项检查',
    definition:
      '对象有定义与负责人、属性可追溯、标识去重明确、函数可验证、Action 有提交条件与幂等、读写算执行权限分离、高风险动作有人审、写回有补偿、日志可审计、已用真实事件演练。',
    why: '这些检查项覆盖了从语义正确性到行动可靠性的全部失败模式。',
    group: 'governance',
  },
  {
    id: 'kp-antipatterns',
    chapter: 10,
    chapterTitle: '常见误区与反模式',
    term: '七类典型反模式',
    definition:
      '表改名当对象、对象越多越好、只建名词不建动词、让 LLM 承担业务规则、最后再补安全、追求永不变化的全局本体、把所有自动化交给 Agent。',
    why: '大多数失败不是技术栈不够，而是本体没有成为运营契约。',
    group: 'governance',
  },
  {
    id: 'kp-maturity',
    chapter: 11,
    chapterTitle: '成熟度与验收标准',
    term: 'L0–L5 成熟度',
    definition:
      'L0 数据可见 → L1 语义对象 → L2 关系与逻辑 → L3 受控行动 → L4 人机协同 → L5 受控自治。',
    why: '这是教学归纳模型而非官方等级；它帮助判断项目实际停在哪一步，避免把 L1 说成 L4。',
    group: 'governance',
  },
];

/** Maturity levels, used by the maturity indicator on the handbook page. */
export const maturityLevels = [
  { id: 'L0', name: '数据可见', detail: '统一接入与报表，仍以表和字段为中心。', mappedStage: 0 },
  { id: 'L1', name: '语义对象', detail: '关键实体被映射为稳定业务对象。', mappedStage: 2 },
  { id: 'L2', name: '关系与逻辑', detail: '对象可导航，规则和模型可复用。', mappedStage: 3 },
  { id: 'L3', name: '受控行动', detail: 'Action 可审计写回，形成运营闭环。', mappedStage: 4 },
  { id: 'L4', name: '人机协同', detail: 'Agent 在权限内查询、计算、提出动作。', mappedStage: 5 },
  { id: 'L5', name: '受控自治', detail: '低风险闭环自动执行，并根据结果学习。', mappedStage: 5 },
];

export const knowledgeByChapter = knowledgePoints.reduce<Record<number, KnowledgePoint[]>>((acc, point) => {
  (acc[point.chapter] ??= []).push(point);
  return acc;
}, {});

export function getKnowledgePoint(id: string): KnowledgePoint | undefined {
  return knowledgePoints.find(p => p.id === id);
}
