'use client';

import { useState } from 'react';
import { objectTypes, actionTypes, linkTypes } from '@/data/ontology-model';

interface AppWidget {
  id: string;
  type: 'object-table' | 'action-button' | 'pipeline-status' | 'metric' | 'relationship-graph';
  title: string;
  config: Record<string, string>;
}

export default function WorkshopPage() {
  const [widgets, setWidgets] = useState<AppWidget[]>([
    { id: 'w1', type: 'object-table', title: 'Active Disruptions', config: { objectType: 'supply-disruption', filter: 'status = Active' } },
    { id: 'w2', type: 'action-button', title: 'Declare Disruption', config: { actionType: 'declare-disruption' } },
    { id: 'w3', type: 'metric', title: 'Open Disruptions', config: { objectType: 'supply-disruption', filter: 'status = Active', aggregate: 'count' } },
    { id: 'w4', type: 'object-table', title: 'Critical Materials', config: { objectType: 'raw-material', filter: 'currentStock < minStockLevel' } },
    { id: 'w5', type: 'action-button', title: 'Recommend Alternative', config: { actionType: 'recommend-alternative' } },
    { id: 'w6', type: 'object-table', title: 'Recent Decisions', config: { objectType: 'decision-log', sort: 'timestamp desc', limit: '10' } },
  ]);
  const [preview, setPreview] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const addWidget = (type: AppWidget['type']) => {
    const newWidget: AppWidget = {
      id: `w${Date.now()}`,
      type,
      title: type === 'object-table' ? 'New Table' : type === 'action-button' ? 'New Action' : type === 'relationship-graph' ? 'Relationship Graph' : 'New Metric',
      config: type === 'action-button' ? { actionType: actionTypes[0].id } : { objectType: objectTypes[0].id, aggregate: 'count' },
    };
    setWidgets([...widgets, newWidget]);
    setShowAddPanel(false);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Workshop</h1>
          <p className="text-sm text-gray-400">应用组装台 — 将 Ontology 能力组合为业务应用</p>
        </div>
        <div className="flex gap-2">
          <button disabled={preview} onClick={() => setShowAddPanel(!showAddPanel)} className="btn-primary">+ Add Widget</button>
          <button className="btn-secondary" onClick={() => { setPreview(!preview); setShowAddPanel(false); }}>{preview ? '返回编辑' : 'Preview'}</button>
          <button className="btn-secondary opacity-40" disabled title="当前仅支持本地教学预览，未连接发布服务">Publish（未接入）</button>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-400">本地教学组装：使用固定示例记录；筛选与排序表达式仅作配置说明，未执行查询。刷新页面会重置布局。</p>
      {/* Add Widget Panel */}
      {showAddPanel && (
        <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Add Widget</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { type: 'object-table' as const, icon: '📋', label: 'Object Table' },
              { type: 'action-button' as const, icon: '⚡', label: 'Action Button' },
              { type: 'metric' as const, icon: '📊', label: 'Metric Card' },
              { type: 'relationship-graph' as const, icon: '🔗', label: 'Relationship Graph' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => addWidget(item.type)}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-gray-300 hover:border-blue-600 hover:bg-blue-900/20"
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map(widget => (
          <div
            key={widget.id}
            className="rounded-xl border border-gray-800 bg-gray-900 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-200">{widget.title}</span>
              {!preview && <button aria-label={`移除 ${widget.title}`} onClick={() => removeWidget(widget.id)} className="text-xs text-gray-600 hover:text-red-400">✕</button>}
            </div>

            {!preview && widget.type !== 'relationship-graph' && <label className="mb-3 block text-xs text-gray-400">配置 {widget.title}
              <select className="ml-2 max-w-full rounded bg-gray-800 p-1" value={widget.config.actionType || widget.config.objectType || ''} onChange={event => {
                const value = event.target.value;
                setWidgets(previous => previous.map(item => item.id === widget.id ? { ...item, config: widget.type === 'action-button' ? { actionType: value } : { objectType: value, aggregate: 'count' } } : item));
              }}>
                {(widget.type === 'action-button' ? actionTypes : objectTypes).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>}
            {widget.type === 'relationship-graph' && <ul className="space-y-2 text-xs text-gray-300">{linkTypes.map(link => <li key={link.id}>{objectTypes.find(object => object.id === link.sourceObject)?.name} → {link.name} → {objectTypes.find(object => object.id === link.targetObject)?.name}</li>)}</ul>}
            {/* Widget content based on type */}
            {widget.type === 'object-table' && <ObjectTableWidget config={widget.config} />}
            {widget.type === 'action-button' && <ActionButtonWidget key={widget.config.actionType} config={widget.config} />}
            {widget.type === 'metric' && <MetricWidget config={widget.config} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectTableWidget({ config }: { config: Record<string, string> }) {
  const objType = objectTypes.find(o => o.id === config.objectType);
  if (!objType) return <div className="text-xs text-gray-500">No object type configured</div>;

  // Generate sample records
  const sampleRecords = Array.from({ length: 5 }, (_, i) => {
    const record: Record<string, string> = {};
    objType.properties.forEach(p => {
      if (p.type === 'String') record[p.name] = `${p.name}_${i + 1}`;
      else if (p.type === 'Integer') record[p.name] = String((i + 1) * 10);
      else if (p.type === 'Double') record[p.name] = ((i + 1) * 12.5).toFixed(2);
      else if (p.type === 'Boolean') record[p.name] = i % 2 === 0 ? 'true' : 'false';
      else record[p.name] = `2026-01-${String(i + 1).padStart(2, '0')}`;
    });
    return record;
  });

  const displayProps = objType.properties.slice(0, 4);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
        <span>{objType.icon}</span>
        <span>{objType.name}</span>
        {config.filter && <span className="ml-auto text-blue-400">{config.filter}</span>}
      </div>
      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-800">
            <tr>
              {displayProps.map(p => (
                <th key={p.name} className="px-2 py-1 text-left text-gray-400">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sampleRecords.map((record, i) => (
              <tr key={i} className="hover:bg-gray-800/50">
                {displayProps.map(p => (
                  <td key={p.name} className="px-2 py-1 text-gray-300">{record[p.name]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButtonWidget({ config }: { config: Record<string, string> }) {
  const [approved, setApproved] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const action = actionTypes.find(a => a.id === config.actionType);
  if (!action) return <div className="text-xs text-gray-500">No action configured</div>;
  const simulateAction = () => {
    if (action.requireReview && !approved) return;
    setResult(`模拟操作：${action.name}。预期效果：${action.effects[0]}。未写入业务系统。`);
  };
  return (
    <div>
      <div className="mb-2 text-xs text-gray-500">{action.description}</div>
      {action.requireReview && !approved && <button className="btn-secondary mb-2" onClick={() => setApproved(true)}>模拟审批通过</button>}
      <button
        onClick={simulateAction}
        disabled={(action.requireReview && !approved) || !!result}
        className="btn-primary w-full justify-center"
      >
        {`⚡ ${action.name}`}
      </button>
      {result && (
        <div className="mt-2 rounded bg-emerald-900/20 p-2 text-xs text-emerald-400">{result}</div>
      )}
    </div>
  );
}

function MetricWidget({ config }: { config: Record<string, string> }) {
  const objType = objectTypes.find(o => o.id === config.objectType);
  const value = objType ? 5 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="text-3xl">{objType?.icon || '📊'}</div>
      <div>
        <div className="text-xs text-gray-500">{config.objectType} ({config.aggregate})</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-emerald-400">固定示例行数，非真实业务统计</div>
      </div>
    </div>
  );
}
