// Ontology Platform Data Model - Medical Supply Chain Demo (Onyx-inspired)

export interface PropertyDefinition {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  codex?: string;
}

export interface ObjectType {
  id: string;
  name: string;
  description: string;
  primaryKey: string;
  properties: PropertyDefinition[];
  recordCount: number;
  dataSources: string[];
  color: string;
  icon: string;
}

export interface LinkType {
  id: string;
  name: string;
  description: string;
  sourceObject: string;
  targetObject: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  properties?: PropertyDefinition[];
}

export interface ActionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ActionType {
  id: string;
  name: string;
  description: string;
  targetObject: string;
  parameters: ActionParameter[];
  effects: string[];
  requireReview: boolean;
}

export interface InterfaceType {
  id: string;
  name: string;
  description: string;
  properties: PropertyDefinition[];
  implementedBy: string[];
}

// =============================================
// Demo Data: Medical Supply Chain Ontology
// =============================================

export const objectTypes: ObjectType[] = [
  {
    id: 'raw-material',
    name: 'RawMaterial',
    description: '制造产品所需的原材料，包括化学原料、金属、塑料等',
    primaryKey: 'materialId',
    recordCount: 1247,
    dataSources: ['SAP ERP', 'WMS'],
    color: '#3b82f6',
    icon: '🧪',
    properties: [
      { name: 'materialId', type: 'String', description: '原材料唯一标识', required: true },
      { name: 'name', type: 'String', description: '原材料名称', required: true },
      { name: 'category', type: 'String', description: '类别：化学/金属/塑料/生物' },
      { name: 'unitOfMeasure', type: 'String', description: '计量单位：kg/L/个' },
      { name: 'shelfLifeDays', type: 'Integer', description: '保质期（天）' },
      { name: 'hazmatClass', type: 'String', description: '危险品等级', codex: 'hazmat-codex' },
      { name: 'currentStock', type: 'Double', description: '当前库存量' },
      { name: 'minStockLevel', type: 'Double', description: '最低库存警戒线' },
      { name: 'qualityGrade', type: 'String', description: '质量等级：A/B/C' },
    ],
  },
  {
    id: 'supplier',
    name: 'Supplier',
    description: '原材料供应商，分布于全球各地',
    primaryKey: 'supplierId',
    recordCount: 89,
    dataSources: ['Supplier Portal', 'SAP ERP'],
    color: '#10b981',
    icon: '🏭',
    properties: [
      { name: 'supplierId', type: 'String', description: '供应商唯一标识', required: true },
      { name: 'name', type: 'String', description: '供应商名称', required: true },
      { name: 'country', type: 'String', description: '所在国家' },
      { name: 'reliabilityScore', type: 'Double', description: '可靠性评分 0-100' },
      { name: 'leadTimeDays', type: 'Integer', description: '平均交货天数' },
      { name: 'certification', type: 'String', description: '认证：ISO9001/GMP/FDA', codex: 'cert-codex' },
      { name: 'isActive', type: 'Boolean', description: '是否活跃' },
    ],
  },
  {
    id: 'purchase-order',
    name: 'PurchaseOrder',
    description: '原材料采购订单',
    primaryKey: 'orderId',
    recordCount: 5632,
    dataSources: ['SAP ERP'],
    color: '#8b5cf6',
    icon: '📋',
    properties: [
      { name: 'orderId', type: 'String', description: '订单唯一标识', required: true },
      { name: 'orderDate', type: 'DateTime', description: '下单日期' },
      { name: 'expectedDeliveryDate', type: 'DateTime', description: '预计交付日期' },
      { name: 'status', type: 'String', description: '状态', codex: 'po-status-codex' },
      { name: 'totalValue', type: 'Double', description: '订单总金额' },
      { name: 'currency', type: 'String', description: '货币：USD/EUR/CNY' },
      { name: 'paymentTerms', type: 'String', description: '付款条款' },
      { name: 'approvalStatus', type: 'String', description: '审批状态' },
    ],
  },
  {
    id: 'production-line',
    name: 'ProductionLine',
    description: '生产流水线，负责将原料转化为成品',
    primaryKey: 'lineId',
    recordCount: 12,
    dataSources: ['MES System'],
    color: '#f59e0b',
    icon: '⚙️',
    properties: [
      { name: 'lineId', type: 'String', description: '产线唯一标识', required: true },
      { name: 'name', type: 'String', description: '产线名称' },
      { name: 'capacityPerDay', type: 'Integer', description: '日产能' },
      { name: 'utilizationRate', type: 'Double', description: '利用率 0-1' },
      { name: 'status', type: 'String', description: '状态：Running/Maintenance/Idle' },
      { name: 'lastMaintenanceDate', type: 'DateTime', description: '上次维护日期' },
    ],
  },
  {
    id: 'product',
    name: 'Product',
    description: '最终医疗产品，如注射器、输液管、手术手套',
    primaryKey: 'productId',
    recordCount: 156,
    dataSources: ['PLM', 'SAP ERP'],
    color: '#ef4444',
    icon: '💊',
    properties: [
      { name: 'productId', type: 'String', description: '产品唯一标识', required: true },
      { name: 'name', type: 'String', description: '产品名称' },
      { name: 'category', type: 'String', description: '类别：注射/输液/手术/诊断' },
      { name: 'unitPrice', type: 'Double', description: '单价' },
      { name: 'regulatoryApproval', type: 'String', description: '监管批准：FDA/CE/NMPA' },
      { name: 'isActive', type: 'Boolean', description: '是否在售' },
    ],
  },
  {
    id: 'bill-of-materials',
    name: 'BillOfMaterials',
    description: '产品物料清单，定义产品与原料的用量关系',
    primaryKey: 'bomId',
    recordCount: 1560,
    dataSources: ['PLM'],
    color: '#ec4899',
    icon: '📐',
    properties: [
      { name: 'bomId', type: 'String', description: 'BOM唯一标识', required: true },
      { name: 'version', type: 'String', description: '版本号' },
      { name: 'quantityPerUnit', type: 'Double', description: '单位产品所需原料量' },
      { name: 'scrapRate', type: 'Double', description: '损耗率 0-1' },
      { name: 'effectiveDate', type: 'DateTime', description: '生效日期' },
    ],
  },
  {
    id: 'supply-disruption',
    name: 'SupplyDisruption',
    description: '供应中断事件，由系统自动检测或人工创建',
    primaryKey: 'disruptionId',
    recordCount: 234,
    dataSources: ['Event Stream', 'Manual Entry'],
    color: '#f97316',
    icon: '⚠️',
    properties: [
      { name: 'disruptionId', type: 'String', description: '中断事件唯一标识', required: true },
      { name: 'detectedAt', type: 'DateTime', description: '检测时间' },
      { name: 'severity', type: 'String', description: '严重程度：Critical/High/Medium/Low' },
      { name: 'estimatedImpact', type: 'Double', description: '预计影响金额' },
      { name: 'status', type: 'String', description: '状态：Active/Resolved/Escalated' },
      { name: 'resolutionTime', type: 'DateTime', description: '解决时间' },
    ],
  },
  {
    id: 'decision-log',
    name: 'DecisionLog',
    description: '决策审计日志，记录每个决策的输入、输出和依据',
    primaryKey: 'logId',
    recordCount: 8921,
    dataSources: ['Auto-generated'],
    color: '#6366f1',
    icon: '📝',
    properties: [
      { name: 'logId', type: 'String', description: '日志唯一标识', required: true },
      { name: 'timestamp', type: 'DateTime', description: '决策时间' },
      { name: 'decision', type: 'String', description: '决策内容' },
      { name: 'rationale', type: 'String', description: '决策依据' },
      { name: 'confidence', type: 'Double', description: '置信度 0-1' },
      { name: 'outcome', type: 'String', description: '执行结果：Success/Pending/Failed' },
    ],
  },
];

export const linkTypes: LinkType[] = [
  {
    id: 'supplied-by',
    name: 'suppliedBy',
    description: '供应商供应原材料',
    sourceObject: 'supplier',
    targetObject: 'raw-material',
    cardinality: 'many-to-many',
    properties: [
      { name: 'unitCost', type: 'Double', description: '单位成本' },
      { name: 'contractExpiry', type: 'DateTime', description: '合同到期日' },
    ],
  },
  {
    id: 'ordered-in',
    name: 'orderedIn',
    description: '原材料在采购订单中被订购',
    sourceObject: 'raw-material',
    targetObject: 'purchase-order',
    cardinality: 'many-to-many',
    properties: [
      { name: 'quantity', type: 'Double', description: '订购数量' },
      { name: 'unitPrice', type: 'Double', description: '成交单价' },
    ],
  },
  {
    id: 'produces',
    name: 'produces',
    description: '产线生产产品',
    sourceObject: 'production-line',
    targetObject: 'product',
    cardinality: 'one-to-many',
  },
  {
    id: 'contains',
    name: 'contains',
    description: 'BOM 包含原料',
    sourceObject: 'bill-of-materials',
    targetObject: 'raw-material',
    cardinality: 'one-to-many',
  },
  {
    id: 'belongs-to',
    name: 'belongsTo',
    description: 'BOM 属于产品',
    sourceObject: 'bill-of-materials',
    targetObject: 'product',
    cardinality: 'many-to-one',
  },
  {
    id: 'disrupts',
    name: 'disrupts',
    description: '中断事件影响原料',
    sourceObject: 'supply-disruption',
    targetObject: 'raw-material',
    cardinality: 'one-to-many',
  },
  {
    id: 'documents-decision',
    name: 'documentsDecision',
    description: '决策日志记录与中断事件的关联',
    sourceObject: 'decision-log',
    targetObject: 'supply-disruption',
    cardinality: 'many-to-one',
  },
];

export const actionTypes: ActionType[] = [
  {
    id: 'declare-disruption',
    name: 'Declare Supply Disruption',
    description: '声明供应中断事件，触发影响评估和响应流程',
    targetObject: 'supply-disruption',
    requireReview: true,
    parameters: [
      { name: 'materialId', type: 'String', description: '受影响原料ID', required: true },
      { name: 'severity', type: 'String', description: '严重程度', required: true },
      { name: 'estimatedDuration', type: 'Integer', description: '预计持续天数', required: false },
    ],
    effects: ['创建 SupplyDisruption 对象', '触发影响评估 Function', '通知采购团队'],
  },
  {
    id: 'recommend-alternative',
    name: 'Recommend Alternative Source',
    description: '为受影响原料推荐替代供应商或替代原料',
    targetObject: 'raw-material',
    requireReview: false,
    parameters: [
      { name: 'materialId', type: 'String', description: '原料ID', required: true },
      { name: 'preferredRegion', type: 'String', description: '偏好地区', required: false },
      { name: 'maxLeadTime', type: 'Integer', description: '最大可接受交期', required: false },
    ],
    effects: ['查询合格替代供应商', '生成替代方案报告', '计算成本差异'],
  },
  {
    id: 'execute-emergency-po',
    name: 'Execute Emergency Purchase',
    description: '执行紧急采购，自动创建采购订单',
    targetObject: 'purchase-order',
    requireReview: true,
    parameters: [
      { name: 'materialId', type: 'String', description: '原料ID', required: true },
      { name: 'supplierId', type: 'String', description: '供应商ID', required: true },
      { name: 'quantity', type: 'Double', description: '采购数量', required: true },
      { name: 'justification', type: 'String', description: '紧急采购理由', required: true },
    ],
    effects: ['创建 PurchaseOrder 对象', '触发审批工作流', '通知供应商'],
  },
  {
    id: 'reroute-production',
    name: 'Reroute Production',
    description: '重新路由生产计划到备用产线',
    targetObject: 'production-line',
    requireReview: true,
    parameters: [
      { name: 'productId', type: 'String', description: '产品ID', required: true },
      { name: 'fromLineId', type: 'String', description: '原产线ID', required: true },
      { name: 'toLineId', type: 'String', description: '目标产线ID', required: true },
    ],
    effects: ['更新生产排程', '验证目标产线产能', '通知生产主管'],
  },
  {
    id: 'resolve-disruption',
    name: 'Resolve Disruption',
    description: '标记供应中断已解决，恢复正常流程',
    targetObject: 'supply-disruption',
    requireReview: false,
    parameters: [
      { name: 'disruptionId', type: 'String', description: '中断事件ID', required: true },
      { name: 'resolutionNotes', type: 'String', description: '解决说明', required: false },
    ],
    effects: ['更新 Disruption 状态', '恢复常规采购', '生成事件报告'],
  },
  {
    id: 'transfer-employee',
    name: 'Transfer Employee',
    description: '跨部门调动员工（通用示例）',
    targetObject: 'production-line',
    requireReview: true,
    parameters: [
      { name: 'employeeId', type: 'String', description: '员工ID', required: true },
      { name: 'fromDepartment', type: 'String', description: '原部门', required: true },
      { name: 'toDepartment', type: 'String', description: '目标部门', required: true },
      { name: 'effectiveDate', type: 'DateTime', description: '生效日期', required: true },
    ],
    effects: ['更新员工记录', '通知 HR 系统', '更新权限'],
  },
];

export const interfaceTypes: InterfaceType[] = [
  {
    id: 'identifiable',
    name: 'Identifiable',
    description: '具有唯一标识的对象',
    implementedBy: ['raw-material', 'supplier', 'purchase-order', 'production-line', 'product', 'bill-of-materials', 'supply-disruption', 'decision-log'],
    properties: [
      { name: 'createdAt', type: 'DateTime', description: '创建时间' },
      { name: 'updatedAt', type: 'DateTime', description: '更新时间' },
    ],
  },
  {
    id: 'auditable',
    name: 'Auditable',
    description: '需要审计追踪的对象',
    implementedBy: ['purchase-order', 'supply-disruption', 'decision-log'],
    properties: [
      { name: 'createdBy', type: 'String', description: '创建者' },
      { name: 'lastModifiedBy', type: 'String', description: '最后修改者' },
    ],
  },
  {
    id: 'status-trackable',
    name: 'StatusTrackable',
    description: '具有生命周期状态的对象',
    implementedBy: ['purchase-order', 'production-line', 'supply-disruption'],
    properties: [
      { name: 'status', type: 'String', description: '当前状态' },
      { name: 'statusUpdatedAt', type: 'DateTime', description: '状态更新时间' },
    ],
  },
];

export const pipelineStages = [
  { id: 'extract', name: 'Extract', description: '从源系统抽取数据', icon: '📥' },
  { id: 'transform', name: 'Transform', description: '清洗、标准化、关联', icon: '🔄' },
  { id: 'validate', name: 'Validate', description: '数据质量校验', icon: '✓' },
  { id: 'load', name: 'Load', description: '加载到 Ontology', icon: '📤' },
  { id: 'index', name: 'Index', description: '构建索引和关系', icon: '🔍' },
];
