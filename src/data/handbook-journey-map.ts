// Links each OntologyJourney stage to the handbook knowledge points that explain
// it, plus the maturity level that stage demonstrates. Kept as data so the
// teaching layer stays separate from the demo's simulation logic.

export interface StageKnowledge {
  /** Zero-based index matching the stages array in OntologyJourney.tsx. */
  stageIndex: number;
  /** Mirrors the stage title; a drift guard, checked by scripts/verify-handbook.ts. */
  stageTitle: string;
  /** Knowledge point ids from handbook-knowledge.ts. */
  pointIds: string[];
  /** Maturity level id (L0–L5) this stage reaches. */
  maturity: string;
  /** The question a learner should be able to answer after this stage. */
  checkQuestion: string;
  /** What the demo deliberately does NOT do, to keep the boundary honest. */
  boundary: string;
}

export const stageKnowledge: StageKnowledge[] = [
  {
    stageIndex: 0,
    stageTitle: '接入业务数据',
    pointIds: ['kp-ontology-definition', 'kp-operational-layer', 'kp-three-layer-arch', 'kp-maturity'],
    maturity: 'L0',
    checkQuestion: '为什么“把数据接进来”还不算建好了本体？',
    boundary: '演示只接入一条模拟事件流，未覆盖 CDC、增量水位与多源对齐。',
  },
  {
    stageIndex: 1,
    stageTitle: '清洗与校验',
    pointIds: ['kp-property', 'kp-metadata', 'kp-launch-checklist'],
    maturity: 'L0',
    checkQuestion: '缺少原料 ID 时，为什么必须阻断而不是继续？',
    boundary: '质量规则为单一必填校验，未实现字段级血缘与变更检测。',
  },
  {
    stageIndex: 2,
    stageTitle: '映射本体',
    pointIds: ['kp-object-type', 'kp-link-type', 'kp-interface', 'kp-antipatterns'],
    maturity: 'L1',
    checkQuestion: '为什么不能直接把 ERP 的表名当作对象类型？',
    boundary: '对象与关系为固定示例模型，未演示版本管理与模型发布流程。',
  },
  {
    stageIndex: 3,
    stageTitle: '计算业务影响',
    pointIds: ['kp-object-set', 'kp-function', 'kp-vs-knowledge-graph', 'kp-supply-case'],
    maturity: 'L2',
    checkQuestion: '缺口 400 kg 这个数字，应该由 LLM 还是确定性逻辑算出？',
    boundary: '计算为单跳规则，未实现多级 BOM 展开与优化器候选方案。',
  },
  {
    stageIndex: 4,
    stageTitle: '审批与执行',
    pointIds: ['kp-action-type', 'kp-dynamic-security', 'kp-scenario', 'kp-agent-ladder'],
    maturity: 'L3',
    checkQuestion: '为什么“能看到原料”不等于“能提交采购单”？',
    boundary: '审批为前端模拟，未实现服务端授权、额度校验与幂等键。',
  },
  {
    stageIndex: 5,
    stageTitle: '回写与审计',
    pointIds: ['kp-writeback-loop', 'kp-decision-record', 'kp-four-part-model', 'kp-vs-semantic-layer'],
    maturity: 'L3',
    checkQuestion: '下单成功后，为什么供应风险还没有解除？',
    boundary: '回写为模拟回执，未实现失败重试、对账与到货确认联动。',
  },
];

export const stageKnowledgeByIndex: Record<number, StageKnowledge> = Object.fromEntries(
  stageKnowledge.map(s => [s.stageIndex, s]),
);
