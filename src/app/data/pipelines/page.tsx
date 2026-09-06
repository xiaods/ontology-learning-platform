'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { objectTypes, pipelineStages } from '@/data/ontology-model';

// ── Data Definitions ──────────────────────────────────────────────

interface SourceSystem {
  id: string;
  name: string;
  icon: string;
  color: string;
  table: string;
  fields: { name: string; type: string; example: string }[];
}

const sourceSystems: SourceSystem[] = [
  {
    id: 'sap', name: 'SAP ERP', icon: '🗄️', color: '#3b82f6', table: 'MARA+MARC',
    fields: [
      { name: 'MATNR', type: 'CHAR(18)', example: '000000000000123456' },
      { name: 'MAKTX', type: 'CHAR(40)', example: 'Medical Grade Silicone' },
      { name: 'MEINS', type: 'CHAR(3)', example: 'KG' },
      { name: 'LABST', type: 'DEC(13,3)', example: '1240.000' },
      { name: 'WERKS', type: 'CHAR(4)', example: '1000' },
    ],
  },
  {
    id: 'wms', name: 'WMS', icon: '📦', color: '#10b981', table: 'inventory_table',
    fields: [
      { name: 'item_id', type: 'VARCHAR', example: 'RM-123456' },
      { name: 'warehouse_qty', type: 'INTEGER', example: '1240' },
      { name: 'reorder_point', type: 'INTEGER', example: '500' },
      { name: 'location', type: 'VARCHAR', example: 'A-12-3' },
    ],
  },
  {
    id: 'mes', name: 'MES System', icon: '⚙️', color: '#f59e0b', table: 'production_lines',
    fields: [
      { name: 'line_id', type: 'VARCHAR', example: 'LINE-A' },
      { name: 'line_name', type: 'VARCHAR', example: 'Surgical Gloves Line A' },
      { name: 'max_capacity', type: 'INTEGER', example: '10000' },
      { name: 'current_state', type: 'ENUM', example: 'ACTIVE' },
      { name: 'util_pct', type: 'INTEGER', example: '87' },
    ],
  },
  {
    id: 'kafka', name: 'Kafka Stream', icon: '📡', color: '#ef4444', table: 'supply.events',
    fields: [
      { name: 'event.disruption_id', type: 'VARCHAR', example: 'DIS-2024-017' },
      { name: 'event.severity', type: 'VARCHAR', example: 'HIGH' },
      { name: 'event.material_id', type: 'VARCHAR', example: 'RM-123456,RM-789012' },
      { name: 'event.timestamp', type: 'TIMESTAMP', example: '2024-01-15T08:23:00Z' },
    ],
  },
];

interface TransformRule {
  sourceField: string;
  targetProperty: string;
  transform: string;
  transformDesc: string;
}

const predefinedPipelines: {
  id: string;
  sourceId: string;
  targetObject: string;
  rules: TransformRule[];
}[] = [
  {
    id: 'sap-rawmat', sourceId: 'sap', targetObject: 'RawMaterial',
    rules: [
      { sourceField: 'MATNR', targetProperty: 'materialCode', transform: 'strip + prefix', transformDesc: 'Strip leading zeros, add "RM-" prefix' },
      { sourceField: 'MAKTX', targetProperty: 'name', transform: 'direct', transformDesc: 'Direct mapping, no transformation' },
      { sourceField: 'MEINS', targetProperty: 'unit', transform: 'direct', transformDesc: 'Direct mapping' },
      { sourceField: 'LABST', targetProperty: 'stockLevel', transform: 'cast', transformDesc: 'Cast DEC(13,3) to Decimal' },
    ],
  },
  {
    id: 'sap-supplier', sourceId: 'sap', targetObject: 'Supplier',
    rules: [
      { sourceField: 'LIFNR', targetProperty: 'supplierCode', transform: 'strip + prefix', transformDesc: 'Strip leading zeros, add "SUP-" prefix' },
      { sourceField: 'NAME1', targetProperty: 'name', transform: 'direct', transformDesc: 'Direct mapping' },
      { sourceField: 'REGIO', targetProperty: 'region', transform: 'direct', transformDesc: 'Direct mapping' },
    ],
  },
  {
    id: 'wms-rawmat', sourceId: 'wms', targetObject: 'RawMaterial',
    rules: [
      { sourceField: 'item_id', targetProperty: 'materialCode', transform: 'join', transformDesc: 'Join key — matches SAP materialCode' },
      { sourceField: 'warehouse_qty', targetProperty: 'stockLevel', transform: 'cast', transformDesc: 'Cast INTEGER to Decimal' },
      { name: 'reorder_point', targetProperty: 'minThreshold', transform: 'cast', transformDesc: 'Cast INTEGER to Decimal' },
    ] as any,
  },
  {
    id: 'mes-line', sourceId: 'mes', targetObject: 'ProductionLine',
    rules: [
      { sourceField: 'line_id', targetProperty: 'lineCode', transform: 'direct', transformDesc: 'Direct mapping' },
      { sourceField: 'line_name', targetProperty: 'name', transform: 'direct', transformDesc: 'Direct mapping' },
      { sourceField: 'max_capacity', targetProperty: 'capacity', transform: 'unit', transformDesc: 'Add unit suffix "/day"' },
      { sourceField: 'current_state', targetProperty: 'status', transform: 'enum', transformDesc: 'ACTIVE→Active, IDLE→Idle, etc.' },
    ],
  },
];

// ── Simulation Engine ──────────────────────────────────────────────

interface DataRecord {
  id: number;
  data: Record<string, string>;
  stage: number; // -1=not started, 0-4=pipeline stage, 5=completed
  status: 'pending' | 'processing' | 'done' | 'error';
}

function generateDataRecord(source: SourceSystem, id: number): DataRecord {
  const data: Record<string, string> = {};
  source.fields.forEach(f => {
    if (f.example === 'ACTIVE' || f.example === 'IDLE' || f.example === 'MAINTENANCE') {
      data[f.name] = ['ACTIVE', 'IDLE', 'MAINTENANCE'][Math.floor(Math.random() * 3)];
    } else if (f.name === 'MATNR' || f.name === 'LIFNR') {
      data[f.name] = String(Math.floor(Math.random() * 999999)).padStart(18, '0');
    } else if (f.type.includes('INT') || f.type.includes('DEC')) {
      data[f.name] = String(Math.floor(Math.random() * 9999));
    } else {
      data[f.name] = f.example;
    }
  });
  return { id, data, stage: -1, status: 'pending' };
}

function applyTransform(value: string, transform: string): string {
  switch (transform) {
    case 'strip + prefix':
      if (value.startsWith('0')) {
        const stripped = value.replace(/^0+/, '');
        return value.length >= 10 ? 'SUP-' + stripped : 'RM-' + stripped;
      }
      return 'RM-' + value;
    case 'cast': {
      const num = parseFloat(value);
      return isNaN(num) ? value : String(num);
    }
    case 'enum':
      const maps: Record<string, string> = { ACTIVE: 'Active', IDLE: 'Idle', MAINTENANCE: 'Maintenance', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
      return maps[value] || value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    case 'unit':
      return value + '/day';
    case 'join':
      return value;
    default:
      return value;
  }
}

function transformRecord(record: DataRecord, rules: TransformRule[]): Record<string, string> {
  const result: Record<string, string> = {};
  rules.forEach(rule => {
    if (record.data[rule.sourceField] !== undefined) {
      result[rule.targetProperty] = applyTransform(record.data[rule.sourceField], rule.transform);
    }
  });
  return result;
}

// ── Component ──────────────────────────────────────────────────────

export default function PipelineBuilderPage() {
  const [activeTab, setActiveTab] = useState<'learn' | 'simulate' | 'build'>('learn');

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pipeline Builder</h1>
        <p className="text-sm text-gray-400">交互式管道学习 — 理解数据如何从源系统流向本体</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-900 p-1 border border-gray-800">
        {[
          { id: 'learn' as const, label: '📖 管道原理', desc: '理解每个阶段' },
          { id: 'simulate' as const, label: '🔬 实时模拟', desc: '看数据流动' },
          { id: 'build' as const, label: '🛠 构建管道', desc: '动手配置' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-3 text-left transition-all ${
              activeTab === tab.id
                ? 'bg-gray-800 ring-1 ring-gray-600'
                : 'hover:bg-gray-800/50'
            }`}
          >
            <div className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.label}</div>
            <div className={`text-xs ${activeTab === tab.id ? 'text-gray-400' : 'text-gray-600'}`}>{tab.desc}</div>
          </button>
        ))}
      </div>

      {activeTab === 'learn' && <LearnView />}
      {activeTab === 'simulate' && <SimulateView />}
      {activeTab === 'build' && <BuildView />}
    </div>
  );
}

// ── Learn View: Explain each pipeline stage ────────────────────────

function LearnView() {
  const [activeStage, setActiveStage] = useState(0);

  const stageDetails = [
    {
      ...pipelineStages[0],
      examples: [
        { source: 'SAP ERP', action: 'SQL: SELECT MATNR, MAKTX, MEINS, LABST FROM MARA JOIN MARC' },
        { source: 'WMS', action: 'SQL: SELECT item_id, warehouse_qty, reorder_point FROM inventory_table' },
        { source: 'Kafka', action: 'Subscribe to topic: supply.events (streaming)' },
      ],
      keyPoint: '从源系统原始读取，不做任何修改',
    },
    {
      ...pipelineStages[1],
      examples: [
        { source: 'MATNR: 000000000000123456', action: '→ strip zeros → "123456" → prefix "RM-" → "RM-123456"' },
        { source: 'MEINS: KG', action: '→ direct map → "KG"' },
        { source: 'current_state: ACTIVE', action: '→ enum map → "Active"' },
      ],
      keyPoint: '字段重命名 + 类型转换 + 格式标准化',
    },
    {
      ...pipelineStages[2],
      examples: [
        { source: 'materialCode: RM-123456', action: '✓ check not null, format matches RM-XXXXXX' },
        { source: 'LABST: 1240', action: '✓ check numeric, range ≥ 0' },
        { source: 'util_pct: 87', action: '✓ check range 0-100' },
      ],
      keyPoint: '确保数据质量，拒绝不合格记录',
    },
    {
      ...pipelineStages[3],
      examples: [
        { source: 'RawMaterial object', action: 'INSERT or UPDATE ontology object' },
        { source: 'materialCode = RM-123456', action: 'Upsert: if exists update, else create' },
        { source: 'batch: 50 records', action: 'Transaction commit every 50 records' },
      ],
      keyPoint: '写入本体对象存储，支持 upsert',
    },
    {
      ...pipelineStages[4],
      examples: [
        { source: 'RawMaterial.name', action: 'Build search index (full-text)' },
        { source: 'RawMaterial.materialCode', action: 'Build lookup index (exact match)' },
        { source: 'Link: RawMaterial→Supplier', action: 'Update relationship cache' },
      ],
      keyPoint: '更新搜索和关系索引，使数据可查询',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Stage selector */}
      <div className="space-y-2">
        {stageDetails.map((stage, i) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(i)}
            className={`w-full rounded-lg p-3 text-left transition-all ${
              activeStage === i
                ? 'bg-gray-800 ring-1 ring-blue-500'
                : 'bg-gray-900 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
                activeStage === i ? 'bg-blue-900/30' : 'bg-gray-800'
              }`}>
                {stage.icon}
              </div>
              <div>
                <div className={`text-sm font-medium ${activeStage === i ? 'text-white' : 'text-gray-300'}`}>{stage.name}</div>
                <div className="text-xs text-gray-500">{stage.description}</div>
              </div>
              <div className={`ml-auto text-xs font-mono ${activeStage === i ? 'text-blue-400' : 'text-gray-600'}`}>Stage {i + 1}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Stage detail */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/30 text-2xl">
              {stageDetails[activeStage].icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Stage {activeStage + 1}: {stageDetails[activeStage].name}</h3>
              <p className="text-sm text-gray-400">{stageDetails[activeStage].description}</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-blue-900/10 border border-blue-800/50 px-4 py-3">
            <div className="text-xs text-blue-400 font-medium mb-1">💡 核心要点</div>
            <div className="text-sm text-gray-300">{stageDetails[activeStage].keyPoint}</div>
          </div>

          <div className="text-xs text-gray-500 mb-2 font-medium">具体示例</div>
          <div className="space-y-2">
            {stageDetails[activeStage].examples.map((ex, i) => (
              <div key={i} className="rounded-lg bg-gray-800 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-gray-700 text-gray-400 text-xs">{ex.source}</span>
                </div>
                <code className="text-xs text-emerald-400 font-mono">{ex.action}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline flow diagram */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            {stageDetails.map((stage, i) => (
              <div key={stage.id} className="flex items-center">
                <div className={`flex flex-col items-center ${i === activeStage ? '' : 'opacity-40'}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    i === activeStage ? 'bg-blue-600 text-white' : i < activeStage ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-500'
                  }`}>
                    {i < activeStage ? '✓' : stage.icon}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 whitespace-nowrap">{stage.name}</div>
                </div>
                {i < stageDetails.length - 1 && (
                  <div className={`mx-2 h-0.5 w-8 ${i < activeStage ? 'bg-emerald-600' : 'bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Simulate View: Real-time data flow simulation ──────────────────

function SimulateView() {
  const [selectedPipeline, setSelectedPipeline] = useState(0);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [throughput, setThroughput] = useState<Record<string, number>>({});
  const recordIdRef = useRef(0);

  const pipeline = predefinedPipelines[selectedPipeline];
  const source = sourceSystems.find(s => s.id === pipeline.sourceId)!;
  const target = objectTypes.find(o => o.name === pipeline.targetObject)!;

  // Generate new records
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const newRecord = generateSource(source, recordIdRef.current++);
      setRecords(prev => [...prev.slice(-30), { ...newRecord, stage: 0, status: 'processing' }]);
    }, 1200 / speed);
    return () => clearInterval(interval);
  }, [isRunning, speed, source]);

  // Advance records through stages
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRecords(prev => prev.map(r => {
        if (r.status === 'done' || r.status === 'error') return r;
        const newStage = r.stage + 1;
        if (newStage >= 5) {
          return { ...r, stage: 5, status: 'done' };
        }
        return { ...r, stage: newStage };
      }));
    }, 800 / speed);
    return () => clearInterval(interval);
  }, [isRunning, speed]);

  // Update throughput
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRecords(prev => {
        const done = prev.filter(r => r.status === 'done').length;
        setThroughput(t => ({ ...t, [pipeline.id]: done }));
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, pipeline.id]);

  // Cleanup done records
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRecords(prev => prev.filter(r => r.status !== 'done').slice(-20));
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const transformedResult = records.length > 0
    ? transformRecord(records[records.length - 1], pipeline.rules)
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-gray-500">Pipeline</div>
            <div className="text-sm text-white font-medium">{source.icon} {source.name} → {target.icon} {target.name}</div>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <div className="text-xs text-gray-500">Records Processed</div>
            <div className="text-sm text-emerald-400 font-mono">{throughput[pipeline.id] || 0}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Speed:</span>
            {[1, 2, 5].map(s => (
              <button key={s} onClick={() => setSpeed(s)} className={`rounded px-2 py-1 text-xs ${speed === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {s}x
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`btn ${isRunning ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isRunning ? '⏸ 暂停' : '▶ 开始'}
          </button>
          <button
            onClick={() => { setRecords([]); setThroughput({}); }}
            className="btn-secondary text-xs"
          >
            ↺ 重置
          </button>
        </div>
      </div>

      {/* Pipeline selector */}
      <div className="flex gap-2 overflow-x-auto">
        {predefinedPipelines.map((p, i) => {
          const src = sourceSystems.find(s => s.id === p.sourceId)!;
          const tgt = objectTypes.find(o => o.name === p.targetObject)!;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedPipeline(i); setRecords([]); setThroughput({}); }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-all ${
                selectedPipeline === i ? 'bg-gray-800 ring-1 ring-blue-500 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <span>{src.icon}</span>
              <span>{src.name}</span>
              <span className="text-gray-600">→</span>
              <span>{tgt.icon} {tgt.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main simulation area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Pipeline stages visualization */}
        {[0, 1, 2, 3, 4].map(stageIdx => {
          const stage = pipelineStages[stageIdx];
          const stageRecords = records.filter(r => r.stage === stageIdx);
          const isActive = isRunning && stageRecords.length > 0;

          return (
            <div key={stage.id} className="flex flex-col">
              <div className={`rounded-xl border p-3 transition-all ${
                isActive ? 'border-blue-700 bg-blue-900/10' : 'border-gray-800 bg-gray-900'
              }`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{stage.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-white">{stage.name}</div>
                    <div className="text-xs text-gray-500">{stage.description}</div>
                  </div>
                </div>

                {/* Records in this stage */}
                <div className="space-y-1 min-h-24">
                  {stageRecords.slice(-4).map(r => (
                    <div key={r.id} className="rounded bg-gray-800 px-2 py-1 font-mono text-xs text-gray-400 truncate">
                      {r.id}: {Object.values(r.data)[0]?.toString().slice(0, 12) || '...'}
                    </div>
                  ))}
                  {stageRecords.length === 0 && (
                    <div className="text-xs text-gray-700 text-center py-3">等待数据...</div>
                  )}
                </div>

                {/* Record count */}
                <div className="mt-2 text-xs text-gray-600 text-right">
                  {stageRecords.length} 条处理中
                </div>
              </div>

              {/* Arrow to next stage */}
              {stageIdx < 4 && (
                <div className="flex justify-center py-1">
                  <div className={`text-lg ${isRunning ? 'text-blue-500 animate-pulse' : 'text-gray-700'}`}>↓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live data transform preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Source record */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span>{source.icon}</span>
            <span className="text-sm font-medium text-white">最新源记录</span>
            <span className="text-xs text-gray-500 font-mono">{source.table}</span>
          </div>
          {records.length > 0 ? (
            <div className="rounded-lg bg-gray-800 p-3 font-mono text-xs space-y-1">
              {Object.entries(records[records.length - 1].data).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-blue-400">{key}</span>
                  <span className="text-gray-300">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-center py-4">点击「开始」模拟数据流</div>
          )}
        </div>

        {/* Transformed result */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span>{target.icon}</span>
            <span className="text-sm font-medium text-white">转换结果</span>
            <span className="text-xs text-gray-500 font-mono">{target.name} (Ontology)</span>
          </div>
          {transformedResult ? (
            <div className="rounded-lg bg-gray-800 p-3 font-mono text-xs space-y-1">
              {Object.entries(transformedResult).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-emerald-400">{key}</span>
                  <span className="text-gray-300">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-center py-4">等待转换...</div>
          )}
        </div>
      </div>

      {/* Transform rules for this pipeline */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">此管道的转换规则</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {pipeline.rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-800 p-2 text-xs">
              <code className="text-blue-400 font-mono">{rule.sourceField}</code>
              <span className="text-gray-600">⚡</span>
              <span className="text-amber-400">{rule.transform}</span>
              <span className="text-gray-600">→</span>
              <code className="text-emerald-400 font-mono">{rule.targetProperty}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Build View: Interactive pipeline builder ───────────────────────

function BuildView() {
  const [step, setStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [rules, setRules] = useState<TransformRule[]>([]);
  const [previewRecord, setPreviewRecord] = useState<DataRecord | null>(null);

  const source = sourceSystems.find(s => s.id === selectedSource);
  const target = objectTypes.find(o => o.id === selectedTarget);

  // Generate preview when rules change
  useEffect(() => {
    if (source && rules.length > 0) {
      const record = generateSource(source, 0);
      setPreviewRecord(record);
    }
  }, [source, rules]);

  const addRule = (sourceField: string, targetProperty: string) => {
    const targetProp = target?.properties.find(p => p.name === targetProperty);
    const transforms = ['direct', 'strip + prefix', 'cast', 'enum', 'unit'];
    const transform = targetProp?.type === 'Decimal' ? 'cast' : 'direct';
    setRules([...rules, {
      sourceField,
      targetProperty,
      transform,
      transformDesc: transform === 'direct' ? 'Direct mapping' : 'Auto-detected transform',
    }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const transformedPreview = previewRecord ? transformRecord(previewRecord, rules) : null;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {['选择源', '选择目标', '映射字段', '验证测试'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === i ? 'bg-blue-600 text-white' : i < step ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-500'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`text-xs ${step === i ? 'text-white' : 'text-gray-500'}`}>{label}</span>
            {i < 3 && <div className={`mx-2 h-px w-8 ${i < step ? 'bg-emerald-600' : 'bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Select source */}
      {step === 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sourceSystems.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelectedSource(s.id); setRules([]); }}
              className={`rounded-xl border p-5 text-left transition-all ${
                selectedSource === s.id
                  ? 'border-blue-600 bg-blue-900/10 ring-1 ring-blue-600'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{s.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{s.table}</div>
                </div>
                <div className="ml-auto h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              </div>
              <div className="space-y-1">
                {s.fields.slice(0, 4).map(f => (
                  <div key={f.name} className="flex items-center gap-2 text-xs">
                    <code className="text-blue-400 font-mono">{f.name}</code>
                    <span className="text-gray-600">{f.type}</span>
                    <span className="ml-auto text-gray-500 font-mono">{f.example}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
          {selectedSource && (
            <div className="md:col-span-2 flex justify-end">
              <button onClick={() => setStep(1)} className="btn-primary">下一步: 选择目标 →</button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select target */}
      {step === 1 && (
        <div>
          <div className="mb-4 rounded-lg bg-gray-900 border border-gray-800 p-3 flex items-center gap-3">
            <span className="text-lg">{source?.icon}</span>
            <span className="text-sm text-white">{source?.name}</span>
            <span className="text-gray-600">→</span>
            <span className="text-sm text-gray-500">选择目标本体对象...</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {objectTypes.map(obj => (
              <button
                key={obj.id}
                onClick={() => { setSelectedTarget(obj.id); setRules([]); }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedTarget === obj.id
                    ? 'border-emerald-600 bg-emerald-900/10 ring-1 ring-emerald-600'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xl">{obj.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{obj.name}</div>
                    <div className="text-xs text-gray-500">{obj.properties.length} properties</div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {obj.properties.slice(0, 3).map(p => (
                    <div key={p.name} className="flex items-center gap-1.5 text-xs">
                      <code className="text-emerald-400 font-mono">{p.name}</code>
                      <span className="text-gray-600">{p.type}</span>
                    </div>
                  ))}
                  {obj.properties.length > 3 && (
                    <div className="text-xs text-gray-600">+{obj.properties.length - 3} more...</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(0)} className="btn-secondary">← 返回</button>
            {selectedTarget && <button onClick={() => setStep(2)} className="btn-primary">下一步: 映射字段 →</button>}
          </div>
        </div>
      )}

      {/* Step 2: Map fields */}
      {step === 2 && source && target && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">字段映射 — 将源字段拖到目标属性</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Source fields */}
              <div>
                <div className="mb-2 text-xs text-blue-400 font-medium">源字段 ({source.name})</div>
                <div className="space-y-1">
                  {source.fields.map(f => {
                    const isMapped = rules.some(r => r.sourceField === f.name);
                    return (
                      <div key={f.name} className={`rounded-lg p-2 text-xs ${isMapped ? 'bg-blue-900/20 border border-blue-800' : 'bg-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          <code className="text-blue-400 font-mono">{f.name}</code>
                          <span className="text-gray-600">{f.type}</span>
                        </div>
                        <div className="text-gray-500 font-mono text-xs">e.g. {f.example}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mapping arrows */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="text-xs text-gray-500 mb-2">映射关系</div>
                {rules.length === 0 && <div className="text-xs text-gray-700">点击下方开始映射</div>}
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs w-full">
                    <code className="text-blue-400 font-mono truncate flex-1">{rule.sourceField}</code>
                    <span className="text-amber-400">{rule.transform === 'direct' ? '→' : '⚡'}</span>
                    <code className="text-emerald-400 font-mono truncate flex-1">{rule.targetProperty}</code>
                    <button onClick={() => removeRule(i)} className="text-gray-600 hover:text-red-400">✕</button>
                  </div>
                ))}
              </div>

              {/* Target properties */}
              <div>
                <div className="mb-2 text-xs text-emerald-400 font-medium">目标属性 ({target.name})</div>
                <div className="space-y-1">
                  {target.properties.map(p => {
                    const mappedRule = rules.find(r => r.targetProperty === p.name);
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          // Find first unmapped source field
                          const unmapped = source.fields.find(f => !rules.some(r => r.sourceField === f.name));
                          if (unmapped) addRule(unmapped.name, p.name);
                        }}
                        className={`w-full rounded-lg p-2 text-left text-xs transition-all ${
                          mappedRule
                            ? 'bg-emerald-900/20 border border-emerald-800'
                            : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-400 font-mono">{p.name}</code>
                          <span className="text-gray-600">{p.type}</span>
                        </div>
                        {mappedRule ? (
                          <div className="text-xs text-gray-500">← {mappedRule.sourceField}</div>
                        ) : (
                          <div className="text-xs text-gray-700">点击映射</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">← 返回</button>
            {rules.length > 0 && <button onClick={() => setStep(3)} className="btn-primary">下一步: 验证测试 →</button>}
          </div>
        </div>
      )}

      {/* Step 3: Test & validate */}
      {step === 3 && previewRecord && source && target && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-800 bg-emerald-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400">✓</span>
              <span className="text-sm font-medium text-emerald-300">管道配置完成！以下是转换测试结果：</span>
            </div>
            <div className="text-xs text-gray-400">
              {source.icon} {source.name} → {target.icon} {target.name} · {rules.length} 条映射规则
            </div>
          </div>

          {/* Before/After comparison */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-3 text-xs text-blue-400 font-medium">源数据 (Before)</div>
              <div className="rounded-lg bg-gray-800 p-3 font-mono text-xs space-y-1">
                {Object.entries(previewRecord.data).map(([key, val]) => {
                  const isMapped = rules.some(r => r.sourceField === key);
                  return (
                    <div key={key} className={`flex justify-between ${isMapped ? '' : 'opacity-30'}`}>
                      <span className="text-blue-400">{key}</span>
                      <span className="text-gray-300">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-3 text-xs text-emerald-400 font-medium">转换结果 (After)</div>
              <div className="rounded-lg bg-gray-800 p-3 font-mono text-xs space-y-1">
                {transformedPreview && Object.entries(transformedPreview).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-emerald-400">{key}</span>
                    <span className="text-gray-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transform detail */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-3 text-xs text-amber-400 font-medium">转换详情</div>
            <div className="space-y-2">
              {rules.map((rule, i) => {
                const sourceVal = previewRecord.data[rule.sourceField];
                const resultVal = transformedPreview?.[rule.targetProperty];
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-800 p-2 text-xs">
                    <code className="text-blue-400 font-mono w-32 truncate">{rule.sourceField}</code>
                    <span className="text-gray-500 font-mono truncate max-w-24">{sourceVal}</span>
                    <span className="text-amber-400 px-1">⚡</span>
                    <span className="text-amber-400 text-xs">{rule.transform}</span>
                    <span className="text-gray-600">→</span>
                    <code className="text-emerald-400 font-mono w-32 truncate">{rule.targetProperty}</code>
                    <span className="text-gray-500 font-mono truncate max-w-24">{resultVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-secondary">↺ 重新开始</button>
            <button onClick={() => { setStep(0); setSelectedSource(null); setSelectedTarget(null); setRules([]); }} className="btn-primary">✓ 创建新管道</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper
function generateSource(source: SourceSystem, id: number): DataRecord {
  return generateDataRecord(source, id);
}
