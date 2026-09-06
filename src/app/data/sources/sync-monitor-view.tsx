'use client';

import { objectTypes } from '@/data/ontology-model';
import { DataSource } from './sources-data';

interface SyncMonitorViewProps {
  syncLogs: { time: string; source: string; action: string; records: number; status: string }[];
  isFlowing: boolean;
  selectedSource: DataSource | null;
  onSelectSource: (s: DataSource | null) => void;
}

export function SyncMonitorView({ syncLogs, isFlowing, selectedSource, onSelectSource }: SyncMonitorViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Source status cards */}
      <div className="space-y-2">
        {[
          { id: 'sap', name: 'SAP ERP', icon: '🗄️', color: '#3b82f6', records: 1247 },
          { id: 'wms', name: 'WMS', icon: '📦', color: '#10b981', records: 3421 },
          { id: 'mes', name: 'MES System', icon: '⚙️', color: '#f59e0b', records: 12 },
          { id: 'plm', name: 'PLM', icon: '📐', color: '#8b5cf6', records: 156 },
          { id: 'supplier-portal', name: 'Supplier Portal', icon: '🌐', color: '#ec4899', records: 89 },
          { id: 'kafka', name: 'Kafka Event Stream', icon: '📡', color: '#ef4444', records: 234 },
        ].map(source => {
          const isSelected = selectedSource?.id === source.id;
          return (
            <button
              key={source.id}
              onClick={() => onSelectSource(isSelected ? null : { id: source.id } as DataSource)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                isSelected ? 'border-blue-600 bg-blue-900/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{source.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-200">{source.name}</div>
                  <div className="text-xs text-gray-500">{source.records.toLocaleString()} records</div>
                </div>
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: source.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Sync logs */}
      <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 p-3">
          <h3 className="text-xs font-semibold text-white">
            Sync Activity {selectedSource ? `— ${selectedSource.name}` : '(All Sources)'}
          </h3>
          <span className={`badge ${isFlowing ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
            {isFlowing ? '● live' : '○ paused'}
          </span>
        </div>

        {syncLogs.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {syncLogs.map((log, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-xs ${i === 0 ? 'animate-slide-in' : ''}`}>
                <span className="font-mono text-gray-600">{log.time}</span>
                <span className="w-28 truncate text-gray-400">{log.source}</span>
                <span className="rounded bg-gray-800 px-2 py-0.5 text-blue-300">{log.action}</span>
                <span className="font-mono text-emerald-400">{log.records}</span>
                <span className="text-gray-600">records</span>
                <span className="ml-auto text-emerald-500">✓</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center text-center p-8">
            <div className="mb-3 text-3xl opacity-30">📊</div>
            <p className="text-xs text-gray-500">
              {isFlowing ? 'Waiting for sync events...' : 'Start data flow to see sync logs'}
            </p>
          </div>
        )}

        {/* Pipeline stats */}
        <div className="border-t border-gray-800 p-4">
          <div className="mb-2 text-xs text-gray-500">Pipeline Throughput</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Extract', value: '12.4K', unit: 'rec/s' },
              { label: 'Transform', value: '11.8K', unit: 'rec/s' },
              { label: 'Validate', value: '11.6K', unit: 'rec/s' },
              { label: 'Load', value: '11.5K', unit: 'rec/s' },
            ].map(stat => (
              <div key={stat.label} className="rounded bg-gray-800 p-2 text-center">
                <div className="text-sm font-bold text-blue-400">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
