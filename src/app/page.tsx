'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { objectTypes, linkTypes, actionTypes, interfaceTypes } from '@/data/ontology-model';

interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  icon: string;
  type: 'object' | 'action' | 'interface';
}

// Layout positions for the ontology graph
const nodePositions: Record<string, { x: number; y: number }> = {
  'raw-material': { x: 150, y: 200 },
  'supplier': { x: 150, y: 450 },
  'purchase-order': { x: 450, y: 450 },
  'production-line': { x: 750, y: 200 },
  'product': { x: 600, y: 100 },
  'bill-of-materials': { x: 450, y: 200 },
  'supply-disruption': { x: 300, y: 320 },
  'decision-log': { x: 600, y: 320 },
};

export default function OntologyExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [showInterfaces, setShowInterfaces] = useState(false);

  const selectedObject = useMemo(() =>
    objectTypes.find(o => o.id === selectedNode),
    [selectedNode]
  );

  const selectedActions = useMemo(() =>
    actionTypes.filter(a => a.targetObject === selectedNode),
    [selectedNode]
  );

  const connectedLinks = useMemo(() =>
    linkTypes.filter(l => l.sourceObject === selectedNode || l.targetObject === selectedNode),
    [selectedNode]
  );

  const getNodePosition = useCallback((objectId: string) => {
    return nodePositions[objectId] || { x: 400, y: 300 };
  }, []);

  const getLinkPath = useCallback((link: typeof linkTypes[0]) => {
    const source = getNodePosition(link.sourceObject);
    const target = getNodePosition(link.targetObject);
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    // Offset control point perpendicular to the line
    const offset = 30;
    const cx = midX + (-dy / Math.sqrt(dx * dx + dy * dy)) * offset;
    const cy = midY + (dx / Math.sqrt(dx * dx + dy * dy)) * offset;
    return `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`;
  }, [getNodePosition]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ontology Explorer</h1>
          <p className="text-sm text-gray-400">交互式本体图谱 — 点击节点查看详情</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showActions}
              onChange={(e) => setShowActions(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800"
            />
            Actions
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={showInterfaces}
              onChange={(e) => setShowInterfaces(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800"
            />
            Interfaces
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Graph Canvas */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900" style={{ height: 560 }}>
            {/* Grid background */}
            <svg className="absolute inset-0 h-full w-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* SVG Graph */}
            <svg className="relative h-full w-full" viewBox="0 0 900 560">
              {/* Link edges */}
              {linkTypes.map((link) => {
                const isHighlighted = hoveredNode === link.sourceObject || hoveredNode === link.targetObject ||
                  (selectedNode && (link.sourceObject === selectedNode || link.targetObject === selectedNode));
                return (
                  <g key={link.id}>
                    <path
                      d={getLinkPath(link)}
                      fill="none"
                      stroke={isHighlighted ? '#60a5fa' : '#4b5563'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={isHighlighted ? '' : '4 4'}
                      className="transition-all duration-200"
                    />
                    {/* Arrow marker */}
                    {isHighlighted && (
                      <circle
                        cx={getNodePosition(link.targetObject).x}
                        cy={getNodePosition(link.targetObject).y}
                        r="3"
                        fill="#60a5fa"
                      />
                    )}
                  </g>
                );
              })}

              {/* Object nodes */}
              {objectTypes.map((obj) => {
                const pos = getNodePosition(obj.id);
                const isSelected = selectedNode === obj.id;
                const isHovered = hoveredNode === obj.id;
                const isConnected = selectedNode && linkTypes.some(
                  l => (l.sourceObject === selectedNode && l.targetObject === obj.id) ||
                       (l.targetObject === selectedNode && l.sourceObject === obj.id)
                );
                const dimmed = selectedNode && !isSelected && !isConnected;

                return (
                  <g
                    key={obj.id}
                    className="cursor-pointer transition-opacity duration-200"
                    style={{ opacity: dimmed ? 0.3 : 1 }}
                    onClick={() => setSelectedNode(isSelected ? null : obj.id)}
                    onMouseEnter={() => setHoveredNode(obj.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Node background */}
                    <rect
                      x={pos.x - 55}
                      y={pos.y - 30}
                      width="110"
                      height="60"
                      rx="8"
                      fill={isSelected ? obj.color : isHovered ? `${obj.color}33` : '#1f2937'}
                      stroke={isSelected ? obj.color : isHovered ? obj.color : '#374151'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-all duration-200"
                    />
                    {/* Icon */}
                    <text
                      x={pos.x - 40}
                      y={pos.y + 5}
                      fontSize="16"
                      className="select-none"
                    >
                      {obj.icon}
                    </text>
                    {/* Name */}
                    <text
                      x={pos.x - 20}
                      y={pos.y + 4}
                      fontSize="10"
                      fill={isSelected ? '#fff' : '#d1d5db'}
                      fontFamily="system-ui"
                      className="select-none"
                    >
                      {obj.name.length > 12 ? obj.name.slice(0, 12) + '…' : obj.name}
                    </text>
                    {/* Record count */}
                    <text
                      x={pos.x - 20}
                      y={pos.y + 18}
                      fontSize="8"
                      fill="#6b7280"
                      fontFamily="system-ui"
                      className="select-none"
                    >
                      {obj.recordCount.toLocaleString()} records
                    </text>
                  </g>
                );
              })}

              {/* Action indicators */}
              {showActions && actionTypes.map((action) => {
                const targetPos = getNodePosition(action.targetObject);
                const angle = Math.random() * Math.PI * 2; // In real layout, calculate proper position
                const radius = 70;
                const ax = targetPos.x + Math.cos(angle) * radius;
                const ay = targetPos.y + Math.sin(angle) * radius;
                return (
                  <g key={action.id} className="cursor-pointer">
                    <rect
                      x={ax - 8}
                      y={ay - 8}
                      width="16"
                      height="16"
                      rx="4"
                      fill="#1f2937"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x={ax}
                      y={ay + 4}
                      fontSize="10"
                      textAnchor="middle"
                      className="select-none"
                    >
                      ⚡
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-lg bg-gray-900/90 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-blue-500 bg-blue-900/50"></span>
                Object Type
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-amber-500 bg-amber-900/50"></span>
                Action Type
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-6 w-6 border-t-2 border-dashed border-gray-500"></span>
                Link Type
              </span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedObject ? (
            <>
              {/* Object Detail */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{selectedObject.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{selectedObject.name}</h3>
                    <span className="badge badge-object">Object Type</span>
                  </div>
                </div>
                <p className="mb-3 text-xs text-gray-400">{selectedObject.description}</p>
                <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-gray-800 p-2">
                    <div className="text-gray-500">Records</div>
                    <div className="font-semibold text-white">{selectedObject.recordCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded bg-gray-800 p-2">
                    <div className="text-gray-500">Properties</div>
                    <div className="font-semibold text-white">{selectedObject.properties.length}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="label mb-1">Primary Key</div>
                  <code className="text-xs text-blue-400">{selectedObject.primaryKey}</code>
                </div>
                <div className="mb-3">
                  <div className="label mb-1">Data Sources</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedObject.dataSources.map(ds => (
                      <span key={ds} className="badge bg-gray-800 text-gray-400">{ds}</span>
                    ))}
                  </div>
                </div>
                <Link href={`/ontology/objects?id=${selectedObject.id}`} className="btn-secondary w-full justify-center text-center">
                  View Full Definition →
                </Link>
              </div>

              {/* Connected Links */}
              {connectedLinks.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Relationships</h4>
                  <div className="space-y-2">
                    {connectedLinks.map(link => (
                      <div key={link.id} className="flex items-center gap-2 rounded bg-gray-800 p-2 text-xs">
                        <span className="badge badge-link">{link.name}</span>
                        <span className="text-gray-500">
                          {link.sourceObject === selectedNode ? '→' : '←'}
                        </span>
                        <span className="text-gray-300">
                          {link.sourceObject === selectedNode
                            ? objectTypes.find(o => o.id === link.targetObject)?.name
                            : objectTypes.find(o => o.id === link.sourceObject)?.name
                          }
                        </span>
                        <span className="ml-auto text-gray-600">{link.cardinality}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions on this Object */}
              {selectedActions.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                  <h4 className="mb-2 text-sm font-semibold text-white">Actions</h4>
                  <div className="space-y-2">
                    {selectedActions.map(action => (
                      <div key={action.id} className="flex items-center gap-2 rounded bg-gray-800 p-2 text-xs">
                        <span className="badge badge-action">⚡ {action.name}</span>
                        {action.requireReview && (
                          <span className="text-amber-500" title="Requires Review">🔒</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Default state */
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">本体概览</h3>
              <div className="space-y-3">
                <div className="stat flex items-center justify-between">
                  <span className="text-xs text-gray-400">Object Types</span>
                  <span className="text-lg font-bold text-blue-400">{objectTypes.length}</span>
                </div>
                <div className="stat flex items-center justify-between">
                  <span className="text-xs text-gray-400">Link Types</span>
                  <span className="text-lg font-bold text-emerald-400">{linkTypes.length}</span>
                </div>
                <div className="stat flex items-center justify-between">
                  <span className="text-xs text-gray-400">Action Types</span>
                  <span className="text-lg font-bold text-amber-400">{actionTypes.length}</span>
                </div>
                <div className="stat flex items-center justify-between">
                  <span className="text-xs text-gray-400">Interface Types</span>
                  <span className="text-lg font-bold text-purple-400">{interfaceTypes.length}</span>
                </div>
              </div>
              <div className="mt-4 rounded bg-gray-800 p-3 text-xs text-gray-400">
                💡 点击图谱中的节点查看对象详情、关系和操作定义
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h4 className="mb-2 text-sm font-semibold text-white">Quick Actions</h4>
            <div className="space-y-2">
              <Link href="/ontology/objects" className="btn-secondary w-full justify-center">Manage Object Types</Link>
              <Link href="/ontology/links" className="btn-secondary w-full justify-center">Manage Link Types</Link>
              <Link href="/ontology/actions" className="btn-secondary w-full justify-center">Manage Action Types</Link>
              <Link href="/data/pipelines" className="btn-secondary w-full justify-center">Pipeline Builder</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
