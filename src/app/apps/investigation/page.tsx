'use client';

import { useState, useEffect, useMemo } from 'react';
import { objectTypes, linkTypes } from '@/data/ontology-model';

interface InstanceRecord {
  id: string;
  name: string;
  objectType: string;
  properties: Record<string, string>;
  relations: { targetId: string; linkName: string; direction: 'out' | 'in' }[];
}

// Mock instance data
const mockInstances: InstanceRecord[] = [
  {
    id: 'sup-001', name: 'Acme Polymer Inc.', objectType: 'supplier',
    properties: { reliabilityScore: '34', region: 'Southeast Asia', status: 'Disrupted', lastDelivery: '2024-01-15' },
    relations: [
      { targetId: 'rm-001', linkName: 'suppliedBy', direction: 'out' },
      { targetId: 'rm-002', linkName: 'suppliedBy', direction: 'out' },
      { targetId: 'sd-001', linkName: 'disruptedBy', direction: 'in' },
    ],
  },
  {
    id: 'rm-001', name: 'Medical Grade Silicone', objectType: 'raw-material',
    properties: { category: 'Polymer', unit: 'kg', stockLevel: '1,240', minThreshold: '500' },
    relations: [
      { targetId: 'sup-001', linkName: 'suppliedBy', direction: 'in' },
      { targetId: 'bom-001', linkName: 'contains', direction: 'out' },
      { targetId: 'bom-002', linkName: 'contains', direction: 'out' },
    ],
  },
  {
    id: 'rm-002', name: 'Titanium Alloy Ti-6Al-4V', objectType: 'raw-material',
    properties: { category: 'Metal', unit: 'kg', stockLevel: '890', minThreshold: '200' },
    relations: [
      { targetId: 'sup-001', linkName: 'suppliedBy', direction: 'in' },
      { targetId: 'bom-003', linkName: 'contains', direction: 'out' },
    ],
  },
  {
    id: 'bom-001', name: 'BOM - Surgical Gloves', objectType: 'bill-of-materials',
    properties: { productCode: 'SG-100', version: '2.3', components: '5' },
    relations: [
      { targetId: 'rm-001', linkName: 'contains', direction: 'in' },
      { targetId: 'prod-001', linkName: 'produces', direction: 'out' },
    ],
  },
  {
    id: 'bom-002', name: 'BOM - Catheter Kit', objectType: 'bill-of-materials',
    properties: { productCode: 'CK-200', version: '1.8', components: '8' },
    relations: [
      { targetId: 'rm-001', linkName: 'contains', direction: 'in' },
      { targetId: 'prod-002', linkName: 'produces', direction: 'out' },
    ],
  },
  {
    id: 'bom-003', name: 'BOM - Bone Screws', objectType: 'bill-of-materials',
    properties: { productCode: 'BS-300', version: '3.1', components: '3' },
    relations: [
      { targetId: 'rm-002', linkName: 'contains', direction: 'in' },
      { targetId: 'prod-003', linkName: 'produces', direction: 'out' },
    ],
  },
  {
    id: 'prod-001', name: 'Surgical Gloves (L)', objectType: 'product',
    properties: { sku: 'SG-L-100', category: 'Consumables', monthlyOutput: '50,000' },
    relations: [
      { targetId: 'bom-001', linkName: 'produces', direction: 'in' },
      { targetId: 'pl-001', linkName: 'belongsTo', direction: 'out' },
    ],
  },
  {
    id: 'prod-002', name: 'Catheter Kit Pro', objectType: 'product',
    properties: { sku: 'CK-P-200', category: 'Devices', monthlyOutput: '2,000' },
    relations: [
      { targetId: 'bom-002', linkName: 'produces', direction: 'in' },
      { targetId: 'pl-002', linkName: 'belongsTo', direction: 'out' },
    ],
  },
  {
    id: 'prod-003', name: 'Bone Screw 4.0mm', objectType: 'product',
    properties: { sku: 'BS-40-300', category: 'Implants', monthlyOutput: '5,000' },
    relations: [
      { targetId: 'bom-003', linkName: 'produces', direction: 'in' },
      { targetId: 'pl-003', linkName: 'belongsTo', direction: 'out' },
    ],
  },
  {
    id: 'pl-001', name: 'Production Line A', objectType: 'production-line',
    properties: { capacity: '10,000/day', status: 'Active', utilization: '87%' },
    relations: [
      { targetId: 'prod-001', linkName: 'belongsTo', direction: 'in' },
    ],
  },
  {
    id: 'pl-002', name: 'Production Line B', objectType: 'production-line',
    properties: { capacity: '500/day', status: 'Active', utilization: '92%' },
    relations: [
      { targetId: 'prod-002', linkName: 'belongsTo', direction: 'in' },
    ],
  },
  {
    id: 'pl-003', name: 'Production Line C', objectType: 'production-line',
    properties: { capacity: '1,500/day', status: 'Maintenance', utilization: '0%' },
    relations: [
      { targetId: 'prod-003', linkName: 'belongsTo', direction: 'in' },
    ],
  },
  {
    id: 'sd-001', name: 'Disruption #2024-017', objectType: 'supply-disruption',
    properties: { severity: 'High', affectedMaterials: '2', detectedAt: '2024-01-15 08:23', status: 'Active' },
    relations: [
      { targetId: 'sup-001', linkName: 'disruptedBy', direction: 'out' },
      { targetId: 'dl-001', linkName: 'documentsDecision', direction: 'out' },
    ],
  },
  {
    id: 'dl-001', name: 'Decision #47', objectType: 'decision-log',
    properties: { type: 'Emergency PO', decidedBy: 'System + Chen Wei', timestamp: '2024-01-15 09:45', outcome: 'Approved' },
    relations: [
      { targetId: 'sd-001', linkName: 'documentsDecision', direction: 'in' },
      { targetId: 'po-001', linkName: 'creates', direction: 'out' },
    ],
  },
  {
    id: 'po-001', name: 'PO-Emergency-2024-089', objectType: 'purchase-order',
    properties: { amount: '$127,500', supplier: 'Polymer Plus Co.', status: 'Pending Approval', deliveryDate: '2024-01-22' },
    relations: [
      { targetId: 'dl-001', linkName: 'creates', direction: 'in' },
    ],
  },
];

// Layout for instance graph
const graphLayout: Record<string, { x: number; y: number }> = {
  'sup-001': { x: 120, y: 150 },
  'rm-001': { x: 350, y: 80 },
  'rm-002': { x: 350, y: 220 },
  'bom-001': { x: 550, y: 50 },
  'bom-002': { x: 550, y: 150 },
  'bom-003': { x: 550, y: 250 },
  'prod-001': { x: 720, y: 50 },
  'prod-002': { x: 720, y: 150 },
  'prod-003': { x: 720, y: 250 },
  'pl-001': { x: 870, y: 50 },
  'pl-002': { x: 870, y: 150 },
  'pl-003': { x: 870, y: 250 },
  'sd-001': { x: 200, y: 320 },
  'dl-001': { x: 450, y: 370 },
  'po-001': { x: 700, y: 370 },
};

export default function InvestigationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<InstanceRecord | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [highlightedRelations, setHighlightedRelations] = useState<Set<string>>(new Set());
  const [animateExpand, setAnimateExpand] = useState(false);
  const [searchFilter, setSearchFilter] = useState('all');

  const filteredInstances = useMemo(() => {
    let results = mockInstances;
    if (searchFilter !== 'all') {
      results = results.filter(i => i.objectType === searchFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      results = results.filter(i =>
        i.name.toLowerCase().includes(lower) ||
        i.id.toLowerCase().includes(lower) ||
        Object.values(i.properties).some(v => v.toLowerCase().includes(lower))
      );
    }
    return results;
  }, [searchTerm, searchFilter]);

  const expandNode = (instance: InstanceRecord) => {
    setSelectedInstance(instance);
    setAnimateExpand(true);
    setTimeout(() => setAnimateExpand(false), 500);

    const newExpanded = new Set(expandedNodes);
    newExpanded.add(instance.id);
    instance.relations.forEach(r => newExpanded.add(r.targetId));
    setExpandedNodes(newExpanded);

    const newHighlighted = new Set<string>();
    instance.relations.forEach(r => {
      newHighlighted.add(`${instance.id}-${r.targetId}`);
    });
    setHighlightedRelations(newHighlighted);
  };

  const collapseNode = () => {
    setSelectedInstance(null);
    setExpandedNodes(new Set());
    setHighlightedRelations(new Set());
  };

  const getObjectTypeColor = (type: string) => {
    const obj = objectTypes.find(o => o.id === type);
    return obj?.color || '#6b7280';
  };

  const getObjectTypeIcon = (type: string) => {
    const obj = objectTypes.find(o => o.id === type);
    return obj?.icon || '📦';
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investigation</h1>
          <p className="text-sm text-gray-400">实例探索查询 — 关联关系可视化</p>
        </div>
        <button onClick={collapseNode} className="btn-secondary">清除选择</button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="搜索实例（名称、ID、属性）..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <select
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="input w-44"
        >
          <option value="all">All Types</option>
          {objectTypes.map(obj => (
            <option key={obj.id} value={obj.id}>{obj.icon} {obj.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Instance List */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-800 bg-gray-900">
            <div className="border-b border-gray-800 p-3">
              <span className="text-xs text-gray-500">{filteredInstances.length} 个实例</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredInstances.map(instance => (
                <button
                  key={instance.id}
                  onClick={() => expandNode(instance)}
                  className={`w-full border-b border-gray-800 p-3 text-left transition-all hover:bg-gray-800 ${
                    selectedInstance?.id === instance.id ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getObjectTypeIcon(instance.objectType)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-gray-200">{instance.name}</div>
                      <div className="text-xs text-gray-500">{instance.id}</div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="badge text-xs" style={{ backgroundColor: getObjectTypeColor(instance.objectType) + '20', color: getObjectTypeColor(instance.objectType) }}>
                      {objectTypes.find(o => o.id === instance.objectType)?.name}
                    </span>
                    <span className="text-xs text-gray-600">{instance.relations.length} links</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Relationship Graph */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden" style={{ height: 540 }}>
            {selectedInstance ? (
              <svg className="h-full w-full" viewBox="0 0 980 420">
                <defs>
                  <filter id="instance-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Background grid */}
                <rect width="980" height="420" fill="#0a0f1a" />
                {Array.from({ length: 24 }).map((_, i) => (
                  <line key={`vg${i}`} x1={i * 42} y1="0" x2={i * 42} y2="420" stroke="#111827" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`hg${i}`} x1="0" y1={i * 42} x2="980" y2={i * 42} stroke="#111827" strokeWidth="0.5" />
                ))}

                {/* Relation edges */}
                {expandedNodes.size > 0 && mockInstances
                  .filter(i => expandedNodes.has(i.id))
                  .flatMap(instance =>
                    instance.relations
                      .filter(r => expandedNodes.has(r.targetId))
                      .map(r => ({ from: instance.id, to: r.targetId, linkName: r.linkName, direction: r.direction }))
                  )
                  .filter((v, i, a) => a.findIndex(x => x.from === v.from && x.to === v.to) === i)
                  .map((edge, i) => {
                    const fromPos = graphLayout[edge.from] || { x: 0, y: 0 };
                    const toPos = graphLayout[edge.to] || { x: 0, y: 0 };
                    const isHighlighted = highlightedRelations.has(`${edge.from}-${edge.to}`);
                    const midX = (fromPos.x + toPos.x) / 2;
                    const midY = (fromPos.y + toPos.y) / 2;
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const cx = midX + (-dy / len) * 20;
                    const cy = midY + (dx / len) * 20;

                    return (
                      <g key={i}>
                        {isHighlighted && (
                          <line x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y}
                            stroke="#60a5fa" strokeWidth="3" opacity="0.2" filter="url(#instance-glow)" />
                        )}
                        <line x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y}
                          stroke={isHighlighted ? '#60a5fa' : '#1f2937'} strokeWidth={isHighlighted ? 2 : 1}
                          strokeDasharray={isHighlighted ? '' : '4 4'} />
                        <text x={cx} y={cy - 5} fontSize="7" fill={isHighlighted ? '#60a5fa' : '#374151'} textAnchor="middle" className="select-none">
                          {edge.linkName}
                        </text>
                        {isHighlighted && (
                          <circle cx={cx} cy={cy} r="2" fill="#60a5fa">
                            <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    );
                  })
                }

                {/* Instance nodes */}
                {mockInstances
                  .filter(i => expandedNodes.size === 0 || expandedNodes.has(i.id) || i.id === selectedInstance?.id)
                  .map(instance => {
                    const pos = graphLayout[instance.id] || { x: 400, y: 200 };
                    const isSelected = selectedInstance?.id === instance.id;
                    const isExpanded = expandedNodes.has(instance.id);
                    const color = getObjectTypeColor(instance.objectType);

                    return (
                      <g
                        key={instance.id}
                        className="cursor-pointer"
                        onClick={() => expandNode(instance)}
                      >
                        {/* Selection ring */}
                        {isSelected && (
                          <circle cx={pos.x} cy={pos.y} r="38" fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.4" filter="url(#instance-glow)">
                            <animate attributeName="r" values="36;42;36" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}

                        {/* Node */}
                        <circle cx={pos.x} cy={pos.y} r="30"
                          fill={isSelected ? color + '30' : '#111827'}
                          stroke={isSelected ? color : isExpanded ? color + '80' : '#374151'}
                          strokeWidth={isSelected ? 2 : 1} />

                        {/* Icon */}
                        <text x={pos.x} y={pos.y - 2} fontSize="14" textAnchor="middle" className="select-none">
                          {getObjectTypeIcon(instance.objectType)}
                        </text>

                        {/* Name */}
                        <text x={pos.x} y={pos.y + 14} fontSize="7" fill="#9ca3af" textAnchor="middle" className="select-none">
                          {instance.name.length > 18 ? instance.name.slice(0, 18) + '…' : instance.name}
                        </text>

                        {/* ID */}
                        <text x={pos.x} y={pos.y + 45} fontSize="6" fill="#4b5563" textAnchor="middle" className="select-none">
                          {instance.id}
                        </text>
                      </g>
                    );
                  })}
              </svg>
            ) : (
              /* Empty state */
              <div className="flex h-full flex-col items-center justify-center text-center p-8">
                <div className="mb-4 text-5xl opacity-30">🔍</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-400">选择一个实例开始探索</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  点击左侧列表中的实例，查看其关联关系图谱。
                  每个节点可以继续展开，探索整个关系网络。
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { icon: '📦', label: '点击实例' },
                    { icon: '🔗', label: '查看关联' },
                    { icon: '🌐', label: '展开网络' },
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{step.icon}</span>
                      <span className="text-xs text-gray-500">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected Instance Detail */}
          {selectedInstance && (
            <div className={`mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-all duration-300 ${animateExpand ? 'scale-[1.01] border-blue-700' : ''}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getObjectTypeIcon(selectedInstance.objectType)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{selectedInstance.name}</h3>
                    <span className="text-xs text-gray-500">{selectedInstance.id}</span>
                  </div>
                </div>
                <span className="badge" style={{ backgroundColor: getObjectTypeColor(selectedInstance.objectType) + '20', color: getObjectTypeColor(selectedInstance.objectType) }}>
                  {objectTypes.find(o => o.id === selectedInstance.objectType)?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Object.entries(selectedInstance.properties).map(([key, value]) => (
                  <div key={key} className="rounded bg-gray-800 p-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-xs font-medium text-gray-200 truncate">{value}</div>
                  </div>
                ))}
              </div>

              {selectedInstance.relations.length > 0 && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <div className="mb-2 text-xs text-gray-500">关联实例 ({selectedInstance.relations.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedInstance.relations.map((rel, i) => {
                      const target = mockInstances.find(inst => inst.id === rel.targetId);
                      return (
                        <button
                          key={i}
                          onClick={() => target && expandNode(target)}
                          className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs hover:bg-gray-700 transition-colors"
                        >
                          <span>{getObjectTypeIcon(rel.targetId.slice(0, 3) === 'sup' ? 'supplier' : rel.targetId.slice(0, 3) === 'rm' ? 'raw-material' : rel.targetId.slice(0, 3) === 'bom' ? 'bill-of-materials' : rel.targetId.slice(0, 3) === 'prod' ? 'product' : rel.targetId.slice(0, 3) === 'pl' ? 'production-line' : 'supply-disruption')}</span>
                          <span className="text-gray-300">{target?.name.slice(0, 20) || rel.targetId}</span>
                          <span className="text-gray-600">{rel.direction === 'out' ? '→' : '←'}</span>
                          <span className="text-blue-400 text-xs">{rel.linkName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
