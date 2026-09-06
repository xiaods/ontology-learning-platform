'use client';

import { useState, useEffect, useRef } from 'react';
import { objectTypes, pipelineStages } from '@/data/ontology-model';

interface FieldMapping {
  sourceField: string;
  sourceExample: string;
  transform: string;
  targetProperty: string;
  targetType: string;
  result: string;
}

interface SourceMapping {
  targetObject: string;
  fields: FieldMapping[];
  sampleSource: Record<string, string>;
  sampleResult: Record<string, string>;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSync: string;
  frequency: string;
  endpoint: string;
  icon: string;
  color: string;
  mappings: SourceMapping[];
}

const sources: DataSource[] = [
  {
    id: 'sap', name: 'SAP ERP', type: 'Database', status: 'connected', lastSync: '2 min ago', frequency: '5 min',
    endpoint: 'sap-erp.prod:3306/MDM', icon: '🗄️', color: '#3b82f6',
    mappings: [
      {
        targetObject: 'RawMaterial',
        sampleSource: { MATNR: '000000000000123456', MAKTX: 'Medical Grade Silicone', MEINS: 'KG', LABST: '1240', WERKS: '1000' },
        sampleResult: { materialCode: 'RM-123456', name: 'Medical Grade Silicone', unit: 'KG', stockLevel: '1240', plant: '1000' },
        fields: [
          { sourceField: 'MATNR', sourceExample: '000000000000123456', transform: 'strip zeros + prefix "RM-"', targetProperty: 'materialCode', targetType: 'String', result: 'RM-123456' },
          { sourceField: 'MAKTX', sourceExample: 'Medical Grade Silicone', transform: 'direct map', targetProperty: 'name', targetType: 'String', result: 'Medical Grade Silicone' },
          { sourceField: 'MEINS', sourceExample: 'KG', transform: 'direct map', targetProperty: 'unit', targetType: 'String', result: 'KG' },
          { sourceField: 'LABST', sourceExample: '1240', transform: 'cast Decimal', targetProperty: 'stockLevel', targetType: 'Decimal', result: '1240' },
        ],
      },
      {
        targetObject: 'Supplier',
        sampleSource: { LIFNR: '000000000100001234', NAME1: 'Acme Polymer Inc.', REGIO: 'CN-SH', STCEG: '91310101MA1FL2QX3X' },
        sampleResult: { supplierCode: 'SUP-1234', name: 'Acme Polymer Inc.', region: 'CN-SH', taxId: '91310101MA1FL2QX3X' },
        fields: [
          { sourceField: 'LIFNR', sourceExample: '000000000100001234', transform: 'strip zeros + prefix "SUP-"', targetProperty: 'supplierCode', targetType: 'String', result: 'SUP-1234' },
          { sourceField: 'NAME1', sourceExample: 'Acme Polymer Inc.', transform: 'direct map', targetProperty: 'name', targetType: 'String', result: 'Acme Polymer Inc.' },
          { sourceField: 'REGIO', sourceExample: 'CN-SH', transform: 'direct map', targetProperty: 'region', targetType: 'String', result: 'CN-SH' },
          { sourceField: 'STCEG', sourceExample: '91310101MA1FL2QX3X', transform: 'direct map', targetProperty: 'taxId', targetType: 'String', result: '91310101MA1FL2QX3X' },
        ],
      },
    ],
  },
  {
    id: 'wms', name: 'WMS', type: 'Database', status: 'connected', lastSync: '5 min ago', frequency: '15 min',
    endpoint: 'wms-db.prod:5432/inventory', icon: '📦', color: '#10b981',
    mappings: [
      {
        targetObject: 'RawMaterial',
        sampleSource: { item_id: 'RM-123456', warehouse_qty: '1240', reorder_point: '500', location: 'A-12-3' },
        sampleResult: { materialCode: 'RM-123456', stockLevel: '1240', minThreshold: '500', storageLocation: 'A-12-3' },
        fields: [
          { sourceField: 'item_id', sourceExample: 'RM-123456', transform: 'direct map (join key)', targetProperty: 'materialCode', targetType: 'String', result: 'RM-123456' },
          { sourceField: 'warehouse_qty', sourceExample: '1240', transform: 'cast Decimal', targetProperty: 'stockLevel', targetType: 'Decimal', result: '1240' },
          { sourceField: 'reorder_point', sourceExample: '500', transform: 'cast Decimal', targetProperty: 'minThreshold', targetType: 'Decimal', result: '500' },
        ],
      },
    ],
  },
  {
    id: 'mes', name: 'MES System', type: 'API', status: 'connected', lastSync: '30 min ago', frequency: 'On-change',
    endpoint: 'mes.prod/api/v2', icon: '⚙️', color: '#f59e0b',
    mappings: [
      {
        targetObject: 'ProductionLine',
        sampleSource: { line_id: 'LINE-A', line_name: 'Surgical Gloves Line A', max_capacity: '10000', current_state: 'ACTIVE', util_pct: '87' },
        sampleResult: { lineCode: 'LINE-A', name: 'Surgical Gloves Line A', capacity: '10000/day', status: 'Active', utilization: '87%' },
        fields: [
          { sourceField: 'line_id', sourceExample: 'LINE-A', transform: 'direct map', targetProperty: 'lineCode', targetType: 'String', result: 'LINE-A' },
          { sourceField: 'line_name', sourceExample: 'Surgical Gloves Line A', transform: 'direct map', targetProperty: 'name', targetType: 'String', result: 'Surgical Gloves Line A' },
          { sourceField: 'max_capacity', sourceExample: '10000', transform: 'unit: units/day', targetProperty: 'capacity', targetType: 'String', result: '10000/day' },
          { sourceField: 'current_state', sourceExample: 'ACTIVE', transform: 'enum map (ACTIVE→Active)', targetProperty: 'status', targetType: 'String', result: 'Active' },
          { sourceField: 'util_pct', sourceExample: '87', transform: 'percentage', targetProperty: 'utilization', targetType: 'String', result: '87%' },
        ],
      },
    ],
  },
  {
    id: 'kafka', name: 'Kafka Event Stream', type: 'Stream', status: 'syncing', lastSync: '实时', frequency: 'Continuous',
    endpoint: 'kafka.prod:9092/supply.events', icon: '📡', color: '#ef4444',
    mappings: [
      {
        targetObject: 'SupplyDisruption',
        sampleSource: { 'event.disruption_id': 'DIS-2024-017', 'event.severity': 'HIGH', 'event.material_id': 'RM-123456,RM-789012', 'event.timestamp': '2024-01-15T08:23:00Z' },
        sampleResult: { disruptionCode: 'DIS-2024-017', severity: 'High', affectedMaterials: 'RM-123456, RM-789012', detectedAt: '2024-01-15 08:23' },
        fields: [
          { sourceField: 'event.disruption_id', sourceExample: 'DIS-2024-017', transform: 'direct map', targetProperty: 'disruptionCode', targetType: 'String', result: 'DIS-2024-017' },
          { sourceField: 'event.severity', sourceExample: 'HIGH', transform: 'enum map (HIGH→High)', targetProperty: 'severity', targetType: 'String', result: 'High' },
          { sourceField: 'event.material_id', sourceExample: 'RM-123456,RM-789012', transform: 'split array', targetProperty: 'affectedMaterials', targetType: 'List<String>', result: '[RM-123456, RM-789012]' },
          { sourceField: 'event.timestamp', sourceExample: '2024-01-15T08:23:00Z', transform: 'ISO 8601 parse + format', targetProperty: 'detectedAt', targetType: 'DateTime', result: '2024-01-15 08:23' },
        ],
      },
    ],
  },
];

interface Particle {
  id: number;
  sourceIdx: number;
  targetIdx: number;
  progress: number;
}

export default function DataSourcesPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<number>(0);
  const [isFlowing, setIsFlowing] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'transform'>('blueprint');
  const [transformStep, setTransformStep] = useState(0);
  const particleId = useRef(0);

  const currentSource = sources.find(s => s.id === selectedSource) || sources[0];
  const currentMapping = currentSource?.mappings[selectedMapping] || currentSource?.mappings[0];

  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(p => ({ ...p, progress: p.progress + 0.015 })).filter(p => p.progress <= 1);
        if (updated.length < 15) {
          const sIdx = Math.floor(Math.random() * sources.length);
          const tIdx = Math.floor(Math.random() * objectTypes.length);
          updated.push({ id: particleId.current++, sourceIdx: sIdx, targetIdx: tIdx, progress: 0 });
        }
        return updated;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isFlowing]);

  // Auto-advance transform steps
  useEffect(() => {
    if (activeTab !== 'transform' || !currentMapping) return;
    const interval = setInterval(() => {
      setTransformStep(prev => (prev + 1) % currentMapping.fields.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab, currentMapping]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Sources Blueprint</h1>
          <p className="text-sm text-gray-400">字段如何从外部系统转换为本体对象 — 完整转换链路</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('blueprint')} className={`btn ${activeTab === 'blueprint' ? 'btn-primary' : 'btn-secondary'}`}>🔗 蓝图</button>
          <button onClick={() => setActiveTab('transform')} className={`btn ${activeTab === 'transform' ? 'btn-primary' : 'btn-secondary'}`}>⚡ 字段转换</button>
        </div>
      </div>

      {activeTab === 'blueprint' && (
        <div className="space-y-6">
          {/* Blueprint SVG */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <svg className="w-full" viewBox="0 0 900 440" style={{ height: 440 }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="900" height="440" fill="#080c14" />
              {Array.from({ length: 45 }).map((_, i) => (
                <line key={`g${i}`} x1={i * 20} y1="0" x2={i * 20} y2="440" stroke="#0f1620" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 22 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 20} x2="900" y2={i * 20} stroke="#0f1620" strokeWidth="0.5" />
              ))}

              <text x="120" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">SOURCE</text>
              <text x="400" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">PIPELINE</text>
              <text x="700" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">ONTOLOGY</text>

              {/* Pipeline */}
              <rect x="330" y="35" width="140" height="390" rx="8" fill="#111827" stroke="#1f2937" />
              {pipelineStages.map((stage, i) => {
                const y = 55 + i * 74;
                return (
                  <g key={stage.id}>
                    <rect x="345" y={y} width="110" height="58" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                    <text x="400" y={y + 20} fontSize="13" textAnchor="middle">{stage.icon}</text>
                    <text x="400" y={y + 36} fontSize="8.5" fill="#d1d5db" textAnchor="middle">{stage.name}</text>
                    <text x="400" y={y + 50} fontSize="6.5" fill="#6b7280" textAnchor="middle">{stage.description}</text>
                    {isFlowing && (
                      <rect x="345" y={y} width="110" height="58" rx="6" fill="#3b82f6" opacity="0">
                        <animate attributeName="opacity" values="0;0.12;0" dur={`${1 + i * 0.15}s`} repeatCount="indefinite" />
                      </rect>
                    )}
                  </g>
                );
              })}

              {/* Sources */}
              {sources.map((source, i) => {
                const y = 50 + i * 68;
                const isSelected = selectedSource === source.id;
                return (
                  <g key={source.id} className="cursor-pointer" onClick={() => { setSelectedSource(source.id); setSelectedMapping(0); }}>
                    {isSelected && <rect x="15" y={y - 4} width="210" height="60" rx="8" fill={source.color} opacity="0.08" />}
                    <rect x="15" y={y - 4} width="210" height="60" rx="8"
                      fill={isSelected ? source.color + '15' : '#111827'}
                      stroke={isSelected ? source.color : '#1f2937'} strokeWidth={isSelected ? 2 : 1} />
                    <text x="35" y={y + 18} fontSize="15">{source.icon}</text>
                    <text x="55" y={y + 14} fontSize="9.5" fill="#e5e7eb" fontWeight="bold">{source.name}</text>
                    <circle cx="35" cy={y + 38} r="3" fill={source.status === 'connected' ? '#10b981' : '#3b82f6'} />
                    <text x="44" y={y + 41} fontSize="7" fill="#6b7280">{source.lastSync} · {source.mappings.length} mappings</text>
                    <line x1="225" y1={y + 28} x2="330" y2={y + 28}
                      stroke={isSelected ? source.color : '#1f2937'}
                      strokeWidth={isSelected ? 1.5 : 0.5} strokeDasharray={isSelected ? '' : '3 3'} opacity={isSelected ? 0.6 : 0.25} />
                  </g>
                );
              })}

              {/* Ontology */}
              {objectTypes.slice(0, 6).map((obj, i) => {
                const y = 50 + i * 60;
                const isHighlighted = currentSource?.mappings.some(m => m.targetObject === obj.name);
                return (
                  <g key={obj.id}>
                    <rect x="580" y={y - 4} width="180" height="50" rx="6"
                      fill={isHighlighted ? obj.color + '15' : '#111827'}
                      stroke={isHighlighted ? obj.color : '#1f2937'} strokeWidth={isHighlighted ? 2 : 1} />
                    <text x="598" y={y + 22} fontSize="12">{obj.icon}</text>
                    <text x="616" y={y + 18} fontSize="9" fill="#d1d5db" fontWeight="bold">{obj.name}</text>
                    <text x="616" y={y + 32} fontSize="7" fill="#6b7280">{obj.recordCount.toLocaleString()} records</text>
                    <line x1="470" y1={y + 22} x2="580" y2={y + 22}
                      stroke={isHighlighted ? obj.color : '#1f2937'}
                      strokeWidth={isHighlighted ? 1 : 0.5} strokeDasharray={isHighlighted ? '' : '3 3'} opacity={isHighlighted ? 0.5 : 0.15} />
                  </g>
                );
              })}

              {/* Particles */}
              {particles.map(p => {
                const sx = 225, ex = 580;
                const sy = 50 + p.sourceIdx * 68 + 28;
                const ty = 50 + p.targetIdx * 60 + 22;
                const x = sx + (ex - sx) * p.progress;
                const y = sy + (ty - sy) * p.progress;
                return <circle key={p.id} cx={x} cy={y} r="3" fill={sources[p.sourceIdx]?.color || '#666'} opacity="0.7" filter="url(#glow)" />;
              })}
            </svg>
          </div>

          {/* Source cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {sources.map(source => (
              <div
                key={source.id}
                onClick={() => { setSelectedSource(source.id); setSelectedMapping(0); }}
                className={`card-hover ${selectedSource === source.id ? 'border-blue-600 ring-1 ring-blue-600' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{source.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-200 truncate">{source.name}</div>
                    <div className="text-xs text-gray-500">{source.type}</div>
                  </div>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                </div>
                <div className="rounded bg-gray-800 px-2 py-1 font-mono text-xs text-blue-400 truncate">{source.endpoint}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {source.mappings.map((m, i) => (
                    <span key={i} className="badge bg-gray-800 text-gray-500 text-xs">{m.targetObject}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transform' && currentMapping && (
        <div className="space-y-6">
          {/* Source selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => { setSelectedSource(source.id); setSelectedMapping(0); }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-all ${
                  selectedSource === source.id ? 'bg-blue-900/30 ring-1 ring-blue-500 text-blue-300' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span>{source.icon}</span>
                <span>{source.name}</span>
              </button>
            ))}
          </div>

          {/* Mapping selector */}
          {currentSource && currentSource.mappings.length > 1 && (
            <div className="flex gap-2">
              {currentSource.mappings.map((m, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedMapping(i); setTransformStep(0); }}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                    selectedMapping === i ? 'bg-emerald-900/30 ring-1 ring-emerald-500 text-emerald-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  → {m.targetObject}
                </button>
              ))}
            </div>
          )}

          {/* Transform visualization */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Source data */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{currentSource?.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">Source: {currentSource?.name}</div>
                  <div className="text-xs text-gray-500">Raw data from external system</div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-2 text-xs text-gray-500 font-mono">TABLE: {currentMapping.targetObject.toUpperCase()}</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {Object.keys(currentMapping.sampleSource).map(key => (
                          <th key={key} className="px-2 py-1.5 text-left text-blue-400 font-mono">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.values(currentMapping.sampleSource).map((val, i) => (
                          <td key={i} className="px-2 py-1.5 font-mono text-gray-300">{val}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transform rules */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="text-sm font-semibold text-white">Transform Rules</div>
                  <div className="text-xs text-gray-500">Field-level mapping & conversion</div>
                </div>
              </div>
              <div className="space-y-2">
                {currentMapping.fields.map((field, i) => (
                  <div
                    key={i}
                    onClick={() => setTransformStep(i)}
                    className={`rounded-lg p-3 cursor-pointer transition-all ${
                      transformStep === i ? 'bg-amber-900/20 ring-1 ring-amber-500' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-blue-400 text-xs font-mono">{field.sourceField}</code>
                      <span className="text-gray-600">→</span>
                      <code className="text-emerald-400 text-xs font-mono">{field.targetProperty}</code>
                    </div>
                    <div className="text-xs text-amber-400 mb-1">{field.transform}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{field.sourceExample}</span>
                      <span className="text-gray-600">⇒</span>
                      <span className="text-emerald-300 font-medium">{field.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resulting ontology object */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{objectTypes.find(o => o.name === currentMapping.targetObject)?.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">Ontology: {currentMapping.targetObject}</div>
                  <div className="text-xs text-gray-500">Resulting object instance</div>
                </div>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <div className="mb-2 text-xs text-gray-500 font-mono">OBJECT: {currentMapping.targetObject}</div>
                <div className="space-y-1.5">
                  {Object.entries(currentMapping.sampleResult).map(([key, val]) => {
                    const isActive = currentMapping.fields[transformStep]?.targetProperty === key;
                    return (
                      <div key={key} className={`flex items-center justify-between rounded px-2 py-1.5 text-xs transition-all ${
                        isActive ? 'bg-emerald-900/30 ring-1 ring-emerald-500' : ''
                      }`}>
                        <code className="text-gray-400 font-mono">{key}</code>
                        <code className={`font-mono ${isActive ? 'text-emerald-300 font-bold' : 'text-gray-300'}`}>{val}</code>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-step transform animation */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Step-by-Step Transform</h3>
              <div className="flex gap-1">
                {currentMapping.fields.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTransformStep(i)}
                    className={`h-2 w-6 rounded-full transition-all ${transformStep === i ? 'bg-blue-500' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {/* Source value */}
              <div className="flex-shrink-0 rounded-lg bg-blue-900/20 border border-blue-800 p-3 w-48">
                <div className="mb-1 text-xs text-blue-400 font-mono">{currentMapping.fields[transformStep]?.sourceField}</div>
                <div className="text-lg font-mono text-white">{currentMapping.fields[transformStep]?.sourceExample}</div>
                <div className="mt-1 text-xs text-gray-500">Source value</div>
              </div>

              {/* Transform arrow */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="text-2xl text-amber-500">⚡</div>
                <div className="rounded bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400 whitespace-nowrap">
                  {currentMapping.fields[transformStep]?.transform}
                </div>
              </div>

              {/* Result value */}
              <div className="flex-shrink-0 rounded-lg bg-emerald-900/20 border border-emerald-800 p-3 w-48">
                <div className="mb-1 text-xs text-emerald-400 font-mono">{currentMapping.fields[transformStep]?.targetProperty}</div>
                <div className="text-lg font-mono text-white">{currentMapping.fields[transformStep]?.result}</div>
                <div className="mt-1 text-xs text-gray-500">Ontology value</div>
              </div>

              {/* Ontology object preview */}
              <div className="flex-shrink-0 rounded-lg bg-gray-800 border border-gray-700 p-3 w-56">
                <div className="mb-2 text-xs text-gray-500">→ Goes into</div>
                <div className="flex items-center gap-2">
                  <span>{objectTypes.find(o => o.name === currentMapping.targetObject)?.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-white">{currentMapping.targetObject}</div>
                    <div className="text-xs text-gray-500 font-mono">{currentMapping.fields[transformStep]?.targetProperty}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
