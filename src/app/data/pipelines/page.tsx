'use client';

import { useState } from 'react';
import { pipelineStages, objectTypes } from '@/data/ontology-model';

interface Pipeline {
  id: string;
  name: string;
  source: string;
  target: string;
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  recordsProcessed: number;
}

const pipelines: Pipeline[] = [
  { id: 'p1', name: 'SAP ERP → RawMaterial', source: 'SAP ERP', target: 'RawMaterial', status: 'active', lastRun: '2 min ago', recordsProcessed: 1247 },
  { id: 'p2', name: 'WMS → RawMaterial Stock', source: 'WMS', target: 'RawMaterial', status: 'active', lastRun: '5 min ago', recordsProcessed: 3421 },
  { id: 'p3', name: 'Supplier Portal → Supplier', source: 'Supplier Portal', target: 'Supplier', status: 'active', lastRun: '1 hour ago', recordsProcessed: 89 },
  { id: 'p4', name: 'MES → ProductionLine', source: 'MES', target: 'ProductionLine', status: 'active', lastRun: '30 min ago', recordsProcessed: 12 },
  { id: 'p5', name: 'Event Stream → SupplyDisruption', source: 'Kafka', target: 'SupplyDisruption', status: 'active', lastRun: '实时', recordsProcessed: 234 },
  { id: 'p6', name: 'PLM → Product & BOM', source: 'PLM', target: 'Product', status: 'paused', lastRun: '1 day ago', recordsProcessed: 156 },
];

export default function PipelineBuilderPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline Builder</h1>
          <p className="text-sm text-gray-400">数据管道构建器 — 将源系统数据加载到 Ontology</p>
        </div>
        <button onClick={() => setShowBuilder(!showBuilder)} className="btn-primary">
          {showBuilder ? 'View Pipelines' : '+ New Pipeline'}
        </button>
      </div>

      {showBuilder ? (
        <PipelineBuilder onClose={() => setShowBuilder(false)} />
      ) : (
        <>
          {/* Pipeline List */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pipelines.map(pipeline => (
              <div
                key={pipeline.id}
                onClick={() => setSelectedPipeline(pipeline.id)}
                className={`card-hover ${selectedPipeline === pipeline.id ? 'border-blue-600' : ''}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-200">{pipeline.name}</span>
                  <span className={`badge ${
                    pipeline.status === 'active' ? 'bg-emerald-900/50 text-emerald-400' :
                    pipeline.status === 'paused' ? 'bg-amber-900/50 text-amber-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {pipeline.status === 'active' ? '●' : '○'} {pipeline.status}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="rounded bg-gray-800 px-2 py-0.5">{pipeline.source}</span>
                  <span>→</span>
                  <span className="rounded bg-gray-800 px-2 py-0.5">{pipeline.target}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>⏱ {pipeline.lastRun}</span>
                  <span>{pipeline.recordsProcessed.toLocaleString()} records</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Stages Legend */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">Pipeline Stages</h2>
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 p-4">
              {pipelineStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-lg">
                      {stage.icon}
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-300">{stage.name}</div>
                    <div className="text-xs text-gray-600">{stage.description}</div>
                  </div>
                  {i < pipelineStages.length - 1 && (
                    <div className="mx-2 h-px w-8 bg-gray-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="stat">
              <div className="text-xs text-gray-500">Total Pipelines</div>
              <div className="text-2xl font-bold text-white">{pipelines.length}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Active</div>
              <div className="text-2xl font-bold text-emerald-400">{pipelines.filter(p => p.status === 'active').length}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-blue-400">{pipelines.reduce((sum, p) => sum + p.recordsProcessed, 0).toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="text-xs text-gray-500">Avg Latency</div>
              <div className="text-2xl font-bold text-purple-400">&lt;5ms</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PipelineBuilder({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [transformType, setTransformType] = useState('direct');

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">New Pipeline</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Visual pipeline builder */}
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
          <div className="mt-1 text-xs text-gray-400">Target Object</div>
        </div>
      </div>

      {/* Configuration */}
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
