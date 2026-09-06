'use client';

import { useState, useEffect, useRef } from 'react';
import { pipelineStages, objectTypes } from '@/data/ontology-model';

interface DataFlow {
  id: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  progress: number;
  color: string;
  label: string;
}

const dataFlows = [
  { source: 'SAP ERP', target: 'RawMaterial', color: '#3b82f6', records: 1247 },
  { source: 'WMS', target: 'RawMaterial', color: '#10b981', records: 3421 },
  { source: 'Supplier Portal', target: 'Supplier', color: '#8b5cf6', records: 89 },
  { source: 'MES', target: 'ProductionLine', color: '#f59e0b', records: 12 },
  { source: 'PLM', target: 'Product', color: '#ef4444', records: 156 },
  { source: 'Kafka', target: 'SupplyDisruption', color: '#ec4899', records: 234 },
];

export default function PipelineBuilderPage() {
  const [isFlowing, setIsFlowing] = useState(false);
  const [particles, setParticles] = useState<DataFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<number | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, number>>({});
  const animRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  // Animate data flow particles
  useEffect(() => {
    if (!isFlowing) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        let updated = prev.map(p => ({ ...p, progress: p.progress + 0.015 })).filter(p => p.progress <= 1);

        if (updated.length < 20) {
          const flow = dataFlows[Math.floor(Math.random() * dataFlows.length)];
          updated.push({
            id: particleIdRef.current++,
            sourceX: 100,
            sourceY: 200,
            targetX: 600,
            targetY: 200,
            progress: 0,
            color: flow.color,
            label: `${flow.source} → ${flow.target}`,
          });
        }
        return updated;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isFlowing]);

  // Update sync status animation
  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      setSyncStatus(prev => {
        const next = { ...prev };
        dataFlows.forEach(f => {
          next[f.source] = (next[f.source] || 0) + Math.floor(Math.random() * 50);
        });
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isFlowing]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Builder</h1>
          <p className="text-sm text-gray-400">数据管道构建器 — 源系统到 Ontology 的数据流</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFlowing(!isFlowing)}
            className={`btn ${isFlowing ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isFlowing ? '⏸ 停止流动' : '▶ 模拟数据流'}
          </button>
          <button onClick={() => setShowBuilder(!showBuilder)} className="btn-secondary">
            {showBuilder ? '查看管道' : '+ 新建管道'}
          </button>
        </div>
      </div>

      {/* Data Flow Visualization */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">实时数据流</h3>

        <div className="relative" style={{ height: 280 }}>
          <svg className="h-full w-full" viewBox="0 0 800 280">
            <defs>
              <filter id="flow-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Source systems (left) */}
            <text x="50" y="20" fontSize="10" fill="#6b7280" fontFamily="system-ui">Source Systems</text>
            {dataFlows.map((flow, i) => {
              const y = 50 + i * 40;
              const isSelected = selectedFlow === i;
              return (
                <g
                  key={flow.source}
                  className="cursor-pointer"
                  onClick={() => setSelectedFlow(isSelected ? null : i)}
                >
                  <rect
                    x="20" y={y - 14} width="140" height="32" rx="6"
                    fill={isSelected ? flow.color + '30' : '#1f2937'}
                    stroke={isSelected ? flow.color : '#374151'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text x="90" y={y + 4} fontSize="9" fill="#d1d5db" textAnchor="middle" fontFamily="system-ui">
                    {flow.source}
                  </text>
                  {isFlowing && (
                    <circle cx="160" cy={y} r="3" fill={flow.color} opacity="0.8">
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Pipeline stage (center) */}
            <rect x="280" y="30" width="240" height="220" rx="8" fill="#111827" stroke="#374151" />
            <text x="400" y="50" fontSize="9" fill="#6b7280" textAnchor="middle" fontFamily="system-ui">PIPELINE</text>
            {pipelineStages.map((stage, i) => {
              const y = 75 + i * 38;
              return (
                <g key={stage.id}>
                  <rect x="295" y={y - 12} width="210" height="30" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                  <text x="310" y={y + 3} fontSize="12">{stage.icon}</text>
                  <text x="330" y={y + 2} fontSize="8.5" fill="#d1d5db" fontFamily="system-ui">{stage.name}</text>
                  <text x="330" y={y + 14} fontSize="7" fill="#6b7280" fontFamily="system-ui">{stage.description}</text>
                  {isFlowing && (
                    <rect x="295" y={y - 12} width="210" height="30" rx="4" fill="#3b82f6" opacity="0.1">
                      <animate attributeName="opacity" values="0;0.2;0" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
                    </rect>
                  )}
                </g>
              );
            })}

            {/* Ontology objects (right) */}
            <text x="620" y="20" fontSize="10" fill="#6b7280" fontFamily="system-ui">Ontology Objects</text>
            {objectTypes.slice(0, 6).map((obj, i) => {
              const y = 50 + i * 40;
              return (
                <g key={obj.id}>
                  <rect
                    x="580" y={y - 14} width="160" height="32" rx="6"
                    fill="#1f2937"
                    stroke={obj.color + '60'}
                    strokeWidth="1"
                  />
                  <text x="660" y={y + 4} fontSize="9" fill="#d1d5db" textAnchor="middle" fontFamily="system-ui">
                    {obj.icon} {obj.name}
                  </text>
                </g>
              );
            })}

            {/* Connection lines */}
            {dataFlows.map((flow, i) => {
              const sourceY = 50 + i * 40;
              const targetObj = objectTypes.find(o => o.name === flow.target);
              const targetIdx = objectTypes.slice(0, 6).findIndex(o => o.name === flow.target);
              const targetY = targetIdx >= 0 ? 50 + targetIdx * 40 : 140;

              return (
                <line
                  key={flow.source}
                  x1="160" y1={sourceY}
                  x2="580" y2={targetY}
                  stroke={flow.color}
                  strokeWidth="1"
                  opacity="0.3"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Animated particles */}
            {particles.map(p => {
              const x = p.sourceX + (p.targetX - p.sourceX) * p.progress;
              const y = p.sourceY + (p.targetY - p.sourceY) * p.progress;
              return (
                <g key={p.id}>
                  <circle cx={x} cy={y} r="4" fill={p.color} opacity="0.7" filter="url(#flow-glow)" />
                  <circle cx={x} cy={y} r="2" fill="#fff" opacity="0.9" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {showBuilder ? (
        <PipelineBuilderForm onClose={() => setShowBuilder(false)} />
      ) : (
        <>
          {/* Pipeline List */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dataFlows.map((flow, i) => (
              <div
                key={i}
                onClick={() => setSelectedFlow(selectedFlow === i ? null : i)}
                className={`card-hover ${selectedFlow === i ? 'border-blue-600' : ''}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-200">{flow.source} → {flow.target}</span>
                  <span className={`badge ${isFlowing ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                    {isFlowing ? '●' : '○'} {isFlowing ? 'streaming' : 'idle'}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="rounded bg-gray-800 px-2 py-0.5">{flow.source}</span>
                  <span>→</span>
                  <span className="rounded bg-gray-800 px-2 py-0.5">{flow.target}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {syncStatus[flow.source] ? syncStatus[flow.source].toLocaleString() : flow.records.toLocaleString()} records
                  </span>
                  <span style={{ color: flow.color }} className="font-mono">
                    {isFlowing ? `${(Math.random() * 5 + 2).toFixed(1)}ms` : '—'}
                  </span>
                </div>

                {/* Expanded detail */}
                {selectedFlow === i && (
                  <div className="mt-3 border-t border-gray-800 pt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Stage Progress:</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500 animate-pulse" style={{ width: isFlowing ? '73%' : '100%' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-gray-800 p-2">
                        <div className="text-gray-500">Throughput</div>
                        <div className="font-bold text-emerald-400">{isFlowing ? Math.floor(Math.random() * 200 + 100) : 0}/s</div>
                      </div>
                      <div className="rounded bg-gray-800 p-2">
                        <div className="text-gray-500">Latency</div>
                        <div className="font-bold text-blue-400">{isFlowing ? (Math.random() * 3 + 1).toFixed(1) : '—'}ms</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="stat">
              <div className="text-xs text-gray-500">Total Pipelines</div>
              <div className="text-2xl font-bold text-white">{dataFlows.length}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Active Streams</div>
              <div className="text-2xl font-bold text-emerald-400">{isFlowing ? dataFlows.length : 0}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-blue-400">{dataFlows.reduce((sum, f) => sum + f.records, 0).toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Avg Latency</div>
              <div className="text-2xl font-bold text-purple-400">{isFlowing ? '<5ms' : '—'}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PipelineBuilderForm({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [transformType, setTransformType] = useState('direct');

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">New Pipeline</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-col items-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 ${source ? 'border-blue-500 bg-blue-900/20' : 'border-dashed border-gray-600'} text-2xl`}>
            {source ? '📦' : '?'}
          </div>
          <div className="mt-1 text-xs text-gray-400">Source</div>
        </div>
        <div className="h-px w-16 bg-gray-600"></div>
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-amber-500 bg-amber-900/20 text-2xl">
            🔄
          </div>
          <div className="mt-1 text-xs text-gray-400">Transform</div>
        </div>
        <div className="h-px w-16 bg-gray-600"></div>
        <div className="flex flex-col items-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 ${target ? 'border-emerald-500 bg-emerald-900/20' : 'border-dashed border-gray-600'} text-2xl`}>
            {target ? objectTypes.find(o => o.id === target)?.icon || '🔷' : '?'}
          </div>
          <div className="mt-1 text-xs text-gray-400">Target</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="label">Data Source</label>
          <select value={source} onChange={e => setSource(e.target.value)} className="input mt-1">
            <option value="">Select source...</option>
            <option value="sap-erp">SAP ERP</option>
            <option value="wms">WMS</option>
            <option value="mes">MES</option>
            <option value="plm">PLM</option>
            <option value="supplier-portal">Supplier Portal</option>
            <option value="kafka">Kafka Event Stream</option>
          </select>
        </div>
        <div>
          <label className="label">Transform Type</label>
          <select value={transformType} onChange={e => setTransformType(e.target.value)} className="input mt-1">
            <option value="direct">Direct Mapping</option>
            <option value="aggregate">Aggregate</option>
            <option value="join">Join / Lookup</option>
            <option value="filter">Filter</option>
            <option value="custom">Custom Function</option>
          </select>
        </div>
        <div>
          <label className="label">Target Object Type</label>
          <select value={target} onChange={e => setTarget(e.target.value)} className="input mt-1">
            <option value="">Select target...</option>
            {objectTypes.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.icon} {obj.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="btn-primary">Create Pipeline</button>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
