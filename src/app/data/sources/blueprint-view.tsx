'use client';

import { objectTypes, pipelineStages } from '@/data/ontology-model';
import { DataSource, dataSources } from './sources-data';
import { Particle } from './page';

interface BlueprintViewProps {
  particles: Particle[];
  isFlowing: boolean;
  selectedSource: DataSource | null;
  onSelectSource: (s: DataSource | null) => void;
  selectedMapping: number | null;
  onSelectMapping: (m: number | null) => void;
}

export function BlueprintView({ particles, isFlowing, selectedSource, onSelectSource, selectedMapping, onSelectMapping }: BlueprintViewProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      <svg className="w-full" viewBox="0 0 1000 520" style={{ height: 520 }}>
        <defs>
          <filter id="ds-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ds-glow-strong">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width="1000" height="520" fill="#080c14" />
        {Array.from({ length: 50 }).map((_, i) => (
          <line key={`vg${i}`} x1={i * 20} y1="0" x2={i * 20} y2="520" stroke="#0f1620" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 26 }).map((_, i) => (
          <line key={`hg${i}`} x1="0" y1={i * 20} x2="1000" y2={i * 20} stroke="#0f1620" strokeWidth="0.5" />
        ))}

        <text x="130" y="24" fontSize="11" fill="#4b5563" textAnchor="middle" fontFamily="system-ui" fontWeight="bold">SOURCE SYSTEMS</text>
        <text x="430" y="24" fontSize="11" fill="#4b5563" textAnchor="middle" fontFamily="system-ui" fontWeight="bold">PIPELINE</text>
        <text x="750" y="24" fontSize="11" fill="#4b5563" textAnchor="middle" fontFamily="system-ui" fontWeight="bold">ONTOLOGY</text>
        <text x="910" y="24" fontSize="11" fill="#4b5563" textAnchor="middle" fontFamily="system-ui" fontWeight="bold">APPS</text>

        {/* Pipeline column */}
        <rect x="370" y="40" width="120" height="460" rx="8" fill="#111827" stroke="#1f2937" />
        {pipelineStages.map((stage, i) => {
          const y = 60 + i * 88;
          return (
            <g key={stage.id}>
              <rect x="380" y={y} width="100" height="72" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1" />
              <text x="430" y={y + 22} fontSize="14" textAnchor="middle">{stage.icon}</text>
              <text x="430" y={y + 40} fontSize="8.5" fill="#d1d5db" textAnchor="middle" fontFamily="system-ui">{stage.name}</text>
              <text x="430" y={y + 54} fontSize="7" fill="#6b7280" textAnchor="middle" fontFamily="system-ui">{stage.description}</text>
              {isFlowing && (
                <rect x="380" y={y} width="100" height="72" rx="6" fill="#3b82f6" opacity="0">
                  <animate attributeName="opacity" values="0;0.15;0" dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" />
                </rect>
              )}
            </g>
          );
        })}

        {/* Source systems */}
        {dataSources.map((source, i) => {
          const y = 55 + i * 75;
          const isSelected = selectedSource?.id === source.id;
          return (
            <g key={source.id} className="cursor-pointer" onClick={() => onSelectSource(isSelected ? null : source)}>
              {isSelected && (
                <rect x="20" y={y - 4} width="220" height="68" rx="8" fill={source.color} opacity="0.08" filter="url(#ds-glow-strong)" />
              )}
              <rect x="20" y={y - 4} width="220" height="68" rx="8"
                fill={isSelected ? source.color + '15' : '#111827'}
                stroke={isSelected ? source.color : '#1f2937'}
                strokeWidth={isSelected ? 2 : 1} />
              <text x="42" y={y + 22} fontSize="18">{source.icon}</text>
              <text x="66" y={y + 18} fontSize="10.5" fill="#e5e7eb" fontFamily="system-ui" fontWeight="bold">{source.name}</text>
              <rect x="66" y={y + 26} width={source.type.length * 5.5 + 8} height="14" rx="3" fill={source.color + '20'} stroke={source.color + '40'} strokeWidth="0.5" />
              <text x={70 + source.type.length * 2.75} y={y + 36} fontSize="7" fill={source.color} textAnchor="middle" fontFamily="system-ui">{source.type}</text>
              <circle cx="42" cy={y + 46} r="4" fill={source.status === 'connected' ? '#10b981' : source.status === 'syncing' ? '#3b82f6' : '#ef4444'}>
                {source.status === 'syncing' && (
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                )}
              </circle>
              <text x="52" y={y + 49} fontSize="8" fill="#6b7280" fontFamily="system-ui">{source.lastSync}</text>
              <text x="220" y={y + 49} fontSize="7.5" fill="#4b5563" textAnchor="end" fontFamily="system-ui">{source.objects.length} objects</text>

              {source.objects.map((obj, oi) => (
                <line key={oi} x1="240" y1={y + 30} x2="370" y2={y + 30}
                  stroke={isSelected ? source.color : '#1f2937'}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  strokeDasharray={isSelected ? '' : '3 3'}
                  opacity={isSelected ? 0.6 : 0.3} />
              ))}
            </g>
          );
        })}

        {/* Ontology objects */}
        {objectTypes.map((obj, i) => {
          const y = 55 + i * 52;
          const isHighlighted = selectedSource?.objects.some(o => o.objectId === obj.id);
          return (
            <g key={obj.id}>
              <rect x="640" y={y - 4} width="200" height="44" rx="6"
                fill={isHighlighted ? obj.color + '15' : '#111827'}
                stroke={isHighlighted ? obj.color : '#1f2937'}
                strokeWidth={isHighlighted ? 2 : 1} />
              <text x="660" y={y + 20} fontSize="14">{obj.icon}</text>
              <text x="680" y={y + 17} fontSize="9.5" fill="#d1d5db" fontFamily="system-ui" fontWeight="bold">{obj.name}</text>
              <text x="680" y={y + 30} fontSize="7" fill="#6b7280" fontFamily="system-ui">{obj.recordCount.toLocaleString()} records · {obj.properties.length} props</text>
              <line x1="490" y1={y + 18} x2="640" y2={y + 18}
                stroke={isHighlighted ? obj.color : '#1f2937'}
                strokeWidth={isHighlighted ? 1 : 0.5}
                strokeDasharray={isHighlighted ? '' : '3 3'}
                opacity={isHighlighted ? 0.5 : 0.2} />
              <line x1="840" y1={y + 18} x2="880" y2={y + 18}
                stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
            </g>
          );
        })}

        {/* Apps column */}
        <rect x="880" y="40" width="100" height="460" rx="8" fill="#111827" stroke="#1f2937" />
        <text x="930" y="64" fontSize="9" fill="#6b7280" textAnchor="middle" fontFamily="system-ui">Applications</text>
        {[
          { name: 'Workshop', icon: '🛠️' },
          { name: 'Investigation', icon: '🔍' },
          { name: 'Workflow', icon: '🎬' },
          { name: 'Dashboards', icon: '📊' },
          { name: 'Alerts', icon: '🔔' },
        ].map((app, i) => {
          const y = 90 + i * 50;
          return (
            <g key={app.name}>
              <rect x="892" y={y} width="76" height="38" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1" />
              <text x="930" y={y + 18} fontSize="12" textAnchor="middle">{app.icon}</text>
              <text x="930" y={y + 32} fontSize="7.5" fill="#9ca3af" textAnchor="middle" fontFamily="system-ui">{app.name}</text>
            </g>
          );
        })}

        {/* Data flow particles */}
        {particles.filter(p => {
          const si = dataSources.findIndex(s => s.id === p.sourceId);
          const ti = objectTypes.findIndex(o => o.id === p.targetObject);
          return si >= 0 && ti >= 0;
        }).map(p => {
          const sourceIdx = dataSources.findIndex(s => s.id === p.sourceId);
          const targetIdx = objectTypes.findIndex(o => o.id === p.targetObject);
          const sourceY = 55 + sourceIdx * 75 + 30;
          const targetY = 55 + targetIdx * 52 + 18;
          const x = 240 + (640 - 240) * p.progress;
          const y = sourceY + (targetY - sourceY) * p.progress;
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r="4" fill={p.color} opacity="0.7" filter="url(#ds-glow)" />
              <circle cx={x} cy={y} r="2" fill="#fff" opacity="0.9" />
            </g>
          );
        })}
      </svg>

      {/* Selected Source Detail */}
      {selectedSource && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedSource.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{selectedSource.name}</h3>
              <div className="text-xs text-gray-400">
                <span className="rounded bg-gray-800 px-2 py-0.5 mr-2">{selectedSource.type}</span>
                <span className="mr-3">Endpoint: <code className="text-blue-400">{selectedSource.endpoint}</code></span>
                <span>Frequency: {selectedSource.frequency}</span>
              </div>
            </div>
            <span className={`badge ${selectedSource.status === 'connected' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-blue-900/50 text-blue-400'}`}>
              {selectedSource.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSource.objects.map((obj, i) => (
              <button
                key={i}
                onClick={() => onSelectMapping(selectedMapping === i ? null : i)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                  selectedMapping === i
                    ? 'bg-blue-900/30 ring-1 ring-blue-500 text-blue-300'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {objectTypes.find(o => o.id === obj.objectId)?.icon} → {objectTypes.find(o => o.id === obj.objectId)?.name}
                <span className="ml-1 text-gray-600">({obj.fieldMappings.length} fields)</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
