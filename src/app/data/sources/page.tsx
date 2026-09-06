'use client';

import { objectTypes } from '@/data/ontology-model';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
  objects: string[];
  icon: string;
}

const dataSources: DataSource[] = [
  { id: 'sap', name: 'SAP ERP', type: 'Database', status: 'connected', lastSync: '2 min ago', objects: ['raw-material', 'supplier', 'purchase-order', 'product'], icon: '🗄️' },
  { id: 'wms', name: 'WMS', type: 'Database', status: 'connected', lastSync: '5 min ago', objects: ['raw-material'], icon: '📦' },
  { id: 'mes', name: 'MES System', type: 'API', status: 'connected', lastSync: '30 min ago', objects: ['production-line'], icon: '⚙️' },
  { id: 'plm', name: 'PLM', type: 'API', status: 'connected', lastSync: '1 hour ago', objects: ['product', 'bill-of-materials'], icon: '📐' },
  { id: 'supplier-portal', name: 'Supplier Portal', type: 'Web App', status: 'connected', lastSync: '1 hour ago', objects: ['supplier'], icon: '🌐' },
  { id: 'kafka', name: 'Kafka Event Stream', type: 'Stream', status: 'syncing', lastSync: '实时', objects: ['supply-disruption'], icon: '📡' },
];

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Data Sources</h1>
        <p className="text-sm text-gray-400">数据源管理 — 连接外部系统到 Ontology</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {dataSources.map(source => (
          <div key={source.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{source.icon}</span>
                <div>
                  <div className="font-medium text-gray-200">{source.name}</div>
                  <div className="text-xs text-gray-500">{source.type}</div>
                </div>
              </div>
              <span className={`badge ${
                source.status === 'connected' ? 'bg-emerald-900/50 text-emerald-400' :
                source.status === 'syncing' ? 'bg-blue-900/50 text-blue-400' :
                'bg-red-900/50 text-red-400'
              }`}>
                {source.status === 'connected' ? '●' : source.status === 'syncing' ? '◌' : '○'} {source.status}
              </span>
            </div>

            <div className="mb-3 text-xs text-gray-500">Last sync: {source.lastSync}</div>

            <div>
              <div className="mb-1 text-xs text-gray-500">Feeds into:</div>
              <div className="flex flex-wrap gap-1">
                {source.objects.map(objId => {
                  const obj = objectTypes.find(o => o.id === objId);
                  return obj ? (
                    <span key={objId} className="badge bg-gray-800 text-gray-400">
                      {obj.icon} {obj.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Data Integration Architecture</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['Source Systems', '→', 'Pipeline (Extract/Transform/Load)', '→', 'Ontology Object Types', '→', 'Applications & Agents'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-gray-600' : 'rounded bg-gray-800 px-2 py-1 text-gray-300'}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
