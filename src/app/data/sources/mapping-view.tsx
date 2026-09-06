'use client';

import { objectTypes } from '@/data/ontology-model';
import { DataSource } from './sources-data';

interface MappingViewProps {
  selectedSource: DataSource | null;
  onSelectSource: (s: DataSource | null) => void;
  selectedMapping: number | null;
  onSelectMapping: (m: number | null) => void;
  selectedObject: { objectId: string; fieldMappings: { source: string; target: string; transform?: string }[] } | null;
}

export function MappingView({ selectedSource, onSelectSource, selectedMapping, onSelectMapping, selectedObject }: MappingViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Source list */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 p-3">
          <h3 className="text-xs font-semibold text-white">Source Systems</h3>
        </div>
        <div className="p-2 space-y-1">
          {[
            { id: 'sap', name: 'SAP ERP', icon: '🗄️', color: '#3b82f6', count: 4 },
            { id: 'wms', name: 'WMS', icon: '📦', color: '#10b981', count: 1 },
            { id: 'mes', name: 'MES System', icon: '⚙️', color: '#f59e0b', count: 1 },
            { id: 'plm', name: 'PLM', icon: '📐', color: '#8b5cf6', count: 2 },
            { id: 'supplier-portal', name: 'Supplier Portal', icon: '🌐', color: '#ec4899', count: 1 },
            { id: 'kafka', name: 'Kafka Event Stream', icon: '📡', color: '#ef4444', count: 1 },
          ].map(source => (
            <button
              key={source.id}
              onClick={() => { onSelectSource({ id: source.id } as DataSource); onSelectMapping(null); }}
              className={`w-full flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-all ${
                selectedSource?.id === source.id ? 'bg-blue-900/20 ring-1 ring-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              <span>{source.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-200 truncate">{source.name}</div>
                <div className="text-gray-500">{source.count} targets</div>
              </div>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
            </button>
          ))}
        </div>
      </div>

      {/* Mapping detail */}
      <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900">
        {selectedSource && selectedMapping !== null && selectedObject ? (
          <div className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">{selectedSource.icon}</span>
              <span className="text-gray-500">→</span>
              <span className="text-lg">{objectTypes.find(o => o.id === selectedObject.objectId)?.icon}</span>
              <div>
                <h3 className="font-semibold text-white">
                  {selectedSource.name} → {objectTypes.find(o => o.id === selectedObject.objectId)?.name}
                </h3>
                <p className="text-xs text-gray-400">{selectedObject.fieldMappings.length} field mappings</p>
              </div>
            </div>

            {/* Mapping table */}
            <div className="overflow-hidden rounded-lg border border-gray-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-3 py-2 text-left text-gray-400 font-medium">Source Field</th>
                    <th className="px-3 py-2 text-center text-gray-400 font-medium">Transform</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium">Target Property</th>
                    <th className="px-3 py-2 text-left text-gray-400 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedObject.fieldMappings.map((mapping, i) => {
                    const prop = objectTypes.find(o => o.id === selectedObject.objectId)?.properties.find(p => p.name === mapping.target);
                    return (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="px-3 py-2">
                          <code className="text-blue-400">{mapping.source}</code>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {mapping.transform ? (
                            <span className="rounded bg-amber-900/30 px-2 py-0.5 text-amber-400">{mapping.transform}</span>
                          ) : (
                            <span className="text-gray-600">direct</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-emerald-400">{mapping.target}</code>
                        </td>
                        <td className="px-3 py-2 text-gray-500">{prop?.type || 'String'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual mapping flow */}
            <div className="mt-4 rounded-lg bg-gray-800 p-3">
              <div className="mb-2 text-xs text-gray-500">Mapping Flow</div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {selectedObject.fieldMappings.map((mapping, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <div className="rounded bg-blue-900/30 px-2 py-1 text-xs text-blue-300 font-mono whitespace-nowrap">{mapping.source}</div>
                      <div className="text-xs text-gray-600 my-0.5">↓</div>
                      {mapping.transform && (
                        <>
                          <div className="rounded bg-amber-900/30 px-1.5 py-0.5 text-xs text-amber-400 whitespace-nowrap">{mapping.transform}</div>
                          <div className="text-xs text-gray-600 my-0.5">↓</div>
                        </>
                      )}
                      <div className="rounded bg-emerald-900/30 px-2 py-1 text-xs text-emerald-300 font-mono whitespace-nowrap">{mapping.target}</div>
                    </div>
                    {i < selectedObject.fieldMappings.length - 1 && (
                      <span className="text-gray-700 mx-1">|</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center p-8">
            <div className="mb-3 text-4xl opacity-30">📋</div>
            <p className="text-sm text-gray-500">Select a source system and mapping to view field-level details</p>
          </div>
        )}
      </div>
    </div>
  );
}
