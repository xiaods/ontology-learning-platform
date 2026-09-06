'use client';

import { useState, useEffect, useRef } from 'react';
import { objectTypes, pipelineStages } from '@/data/ontology-model';

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
  mappings: { target: string; fields: number }[];
}

const sources: DataSource[] = [
  { id: 'sap', name: 'SAP ERP', type: 'Database', status: 'connected', lastSync: '2 min ago', frequency: '5 min', endpoint: 'sap-erp.prod:3306', icon: '🗄️', color: '#3b82f6', mappings: [
    { target: 'RawMaterial', fields: 4 }, { target: 'Supplier', fields: 4 }, { target: 'PurchaseOrder', fields: 4 }, { target: 'Product', fields: 3 },
  ]},
  { id: 'wms', name: 'WMS', type: 'Database', status: 'connected', lastSync: '5 min ago', frequency: '15 min', endpoint: 'wms-db.prod:5432', icon: '📦', color: '#10b981', mappings: [
    { target: 'RawMaterial', fields: 3 },
  ]},
  { id: 'mes', name: 'MES System', type: 'API', status: 'connected', lastSync: '30 min ago', frequency: 'On-change', endpoint: 'mes.prod/api/v2', icon: '⚙️', color: '#f59e0b', mappings: [
    { target: 'ProductionLine', fields: 5 },
  ]},
  { id: 'plm', name: 'PLM', type: 'API', status: 'connected', lastSync: '1 hour ago', frequency: 'Nightly', endpoint: 'plm.prod/api/bom', icon: '📐', color: '#8b5cf6', mappings: [
    { target: 'Product', fields: 3 }, { target: 'BillOfMaterials', fields: 4 },
  ]},
  { id: 'supplier-portal', name: 'Supplier Portal', type: 'Web App', status: 'connected', lastSync: '1 hour ago', frequency: 'Manual', endpoint: 'suppliers.prod/export', icon: '🌐', color: '#ec4899', mappings: [
    { target: 'Supplier', fields: 4 },
  ]},
  { id: 'kafka', name: 'Kafka Event Stream', type: 'Stream', status: 'syncing', lastSync: '实时', frequency: 'Continuous', endpoint: 'kafka.prod:9092', icon: '📡', color: '#ef4444', mappings: [
    { target: 'SupplyDisruption', fields: 5 },
  ]},
];

interface Particle {
  id: number;
  sourceIdx: number;
  targetIdx: number;
  progress: number;
}

export default function DataSourcesPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isFlowing, setIsFlowing] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [logs, setLogs] = useState<{ time: string; text: string }[]>([]);
  const particleId = useRef(0);

  // Particle animation
  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(p => ({ ...p, progress: p.progress + 0.015 })).filter(p => p.progress <= 1);
        if (updated.length < 20) {
          const sIdx = Math.floor(Math.random() * sources.length);
          const tIdx = Math.floor(Math.random() * objectTypes.length);
          updated.push({ id: particleId.current++, sourceIdx: sIdx, targetIdx: tIdx, progress: 0 });
        }
        return updated;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isFlowing]);

  // Log generation
  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      const s = sources[Math.floor(Math.random() * sources.length)];
      const actions = ['extracted', 'transformed', 'validated', 'loaded'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const records = Math.floor(Math.random() * 300 + 50);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs(prev => [{ time, text: `${s.name} · ${action} ${records} records` }, ...prev].slice(0, 6));
    }, 2000);
    return () => clearInterval(interval);
  }, [isFlowing]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Sources Blueprint</h1>
          <p className="text-sm text-gray-400">外部系统 → 管道 → 本体对象 — 完整数据链路</p>
        </div>
        <button onClick={() => setIsFlowing(!isFlowing)} className={`btn ${isFlowing ? 'btn-primary' : 'btn-secondary'}`}>
          {isFlowing ? '⏸ 停止' : '▶ 流动'}
        </button>
      </div>

      {/* Blueprint SVG */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <svg className="w-full" viewBox="0 0 900 480" style={{ height: 480 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Grid */}
          <rect width="900" height="480" fill="#080c14" />
          {Array.from({ length: 45 }).map((_, i) => (
            <line key={`g${i}`} x1={i * 20} y1="0" x2={i * 20} y2="480" stroke="#0f1620" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="900" y2={i * 20} stroke="#0f1620" strokeWidth="0.5" />
          ))}

          {/* Column headers */}
          <text x="120" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">SOURCE SYSTEMS</text>
          <text x="400" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">PIPELINE</text>
          <text x="700" y="22" fontSize="10" fill="#4b5563" textAnchor="middle" fontWeight="bold">ONTOLOGY</text>

          {/* Pipeline stages */}
          <rect x="330" y="35" width="140" height="430" rx="8" fill="#111827" stroke="#1f2937" />
          {pipelineStages.map((stage, i) => {
            const y = 55 + i * 80;
            return (
              <g key={stage.id}>
                <rect x="345" y={y} width="110" height="64" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1" />
                <text x="400" y={y + 22} fontSize="14" textAnchor="middle">{stage.icon}</text>
                <text x="400" y={y + 38} fontSize="8.5" fill="#d1d5db" textAnchor="middle">{stage.name}</text>
                <text x="400" y={y + 52} fontSize="7" fill="#6b7280" textAnchor="middle">{stage.description}</text>
                {isFlowing && (
                  <rect x="345" y={y} width="110" height="64" rx="6" fill="#3b82f6" opacity="0">
                    <animate attributeName="opacity" values="0;0.12;0" dur={`${1 + i * 0.15}s`} repeatCount="indefinite" />
                  </rect>
                )}
              </g>
            );
          })}

          {/* Source systems */}
          {sources.map((source, i) => {
            const y = 50 + i * 72;
            const isSelected = selectedSource === source.id;
            return (
              <g key={source.id} className="cursor-pointer" onClick={() => setSelectedSource(isSelected ? null : source.id)}>
                {isSelected && <rect x="15" y={y - 4} width="210" height="64" rx="8" fill={source.color} opacity="0.08" />}
                <rect x="15" y={y - 4} width="210" height="64" rx="8"
                  fill={isSelected ? source.color + '15' : '#111827'}
                  stroke={isSelected ? source.color : '#1f2937'}
                  strokeWidth={isSelected ? 2 : 1} />
                <text x="35" y={y + 20} fontSize="16">{source.icon}</text>
                <text x="56" y={y + 16} fontSize="10" fill="#e5e7eb" fontWeight="bold">{source.name}</text>
                <rect x="56" y={y + 24} width={source.type.length * 5 + 8} height="13" rx="3" fill={source.color + '20'} />
                <text x={60 + source.type.length * 2.5} y={y + 33} fontSize="6.5" fill={source.color} textAnchor="middle">{source.type}</text>
                <circle cx="35" cy={y + 44} r="3.5" fill={source.status === 'connected' ? '#10b981' : '#3b82f6'}>
                  {source.status === 'syncing' && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
                </circle>
                <text x="46" y={y + 47} fontSize="7.5" fill="#6b7280">{source.lastSync} · {source.mappings.length} targets</text>
                <line x1="225" y1={y + 30} x2="330" y2={y + 30}
                  stroke={isSelected ? source.color : '#1f2937'}
                  strokeWidth={isSelected ? 1.5 : 0.5} strokeDasharray={isSelected ? '' : '3 3'} opacity={isSelected ? 0.6 : 0.25} />
              </g>
            );
          })}

          {/* Ontology objects */}
          {objectTypes.map((obj, i) => {
            const y = 50 + i * 50;
            const isHighlighted = selectedSource && sources.find(s => s.id === selectedSource)?.mappings.some(m => m.target === obj.name);
            return (
              <g key={obj.id}>
                <rect x="580" y={y - 4} width="180" height="42" rx="6"
                  fill={isHighlighted ? obj.color + '15' : '#111827'}
                  stroke={isHighlighted ? obj.color : '#1f2937'}
                  strokeWidth={isHighlighted ? 2 : 1} />
                <text x="598" y={y + 20} fontSize="13">{obj.icon}</text>
                <text x="616" y={y + 16} fontSize="9" fill="#d1d5db" fontWeight="bold">{obj.name}</text>
                <text x="616" y={y + 28} fontSize="7" fill="#6b7280">{obj.recordCount.toLocaleString()} records</text>
                <line x1="470" y1={y + 18} x2="580" y2={y + 18}
                  stroke={isHighlighted ? obj.color : '#1f2937'}
                  strokeWidth={isHighlighted ? 1 : 0.5} strokeDasharray={isHighlighted ? '' : '3 3'} opacity={isHighlighted ? 0.5 : 0.15} />
              </g>
            );
          })}

          {/* Particles */}
          {particles.map(p => {
            const sx = 225, ex = 580;
            const sy = 50 + p.sourceIdx * 72 + 30;
            const ty = 50 + p.targetIdx * 50 + 18;
            const x = sx + (ex - sx) * p.progress;
            const y = sy + (ty - sy) * p.progress;
            return (
              <circle key={p.id} cx={x} cy={y} r="3" fill={sources[p.sourceIdx].color} opacity="0.7" filter="url(#glow)" />
            );
          })}
        </svg>
      </div>

      {/* Source detail cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.map(source => {
          const isSelected = selectedSource === source.id;
          return (
            <div
              key={source.id}
              onClick={() => setSelectedSource(isSelected ? null : source.id)}
              className={`card-hover ${isSelected ? 'border-blue-600 ring-1 ring-blue-600' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{source.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{source.name}</div>
                    <div className="text-xs text-gray-500">{source.type} · {source.frequency}</div>
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: source.color }} />
              </div>

              <div className="mb-2 rounded bg-gray-800 px-2 py-1 font-mono text-xs text-blue-400">{source.endpoint}</div>

              <div className="flex flex-wrap gap-1.5">
                {source.mappings.map((m, i) => (
                  <span key={i} className="badge bg-gray-800 text-gray-400 text-xs">
                    {objectTypes.find(o => o.name === m.target)?.icon} {m.target} ({m.fields})
                  </span>
                ))}
              </div>

              {isSelected && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <div className="mb-2 text-xs text-gray-500">Field Mappings</div>
                  <div className="space-y-1">
                    {source.mappings.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-blue-900/30 px-1.5 py-0.5 font-mono text-blue-300">{m.fields} fields</span>
                        <span className="text-gray-600">→</span>
                        <span className="text-gray-300">{m.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sync logs */}
      {logs.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Sync Activity</h3>
          <div className="space-y-1.5">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-gray-600">{log.time}</span>
                <span className="text-gray-300">{log.text}</span>
                <span className="ml-auto text-emerald-500">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
