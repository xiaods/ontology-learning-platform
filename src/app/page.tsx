'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { objectTypes, linkTypes, actionTypes, interfaceTypes } from '@/data/ontology-model';

// Layout positions for the ontology graph
const nodePositions: Record<string, { x: number; y: number }> = {
  'raw-material': { x: 150, y: 200 },
  'supplier': { x: 150, y: 460 },
  'purchase-order': { x: 450, y: 460 },
  'production-line': { x: 750, y: 200 },
  'product': { x: 600, y: 100 },
  'bill-of-materials': { x: 450, y: 200 },
  'supply-disruption': { x: 300, y: 330 },
  'decision-log': { x: 600, y: 330 },
};

interface Particle {
  id: number;
  linkIndex: number;
  progress: number;
  speed: number;
  color: string;
}

export default function OntologyExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const [animatingFlow, setAnimatingFlow] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flowMode, setFlowMode] = useState<'none' | 'all' | 'from-selected'>('none');
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [pulseNodes, setPulseNodes] = useState<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  const selectedObject = useMemo(() =>
    objectTypes.find(o => o.id === selectedNode), [selectedNode]
  );

  const connectedLinks = useMemo(() => {
    if (!selectedNode) return [];
    return linkTypes.filter(l => l.sourceObject === selectedNode || l.targetObject === selectedNode);
  }, [selectedNode]);

  // BFS path finding
  const findPath = useCallback((from: string, to: string): string[] => {
    const queue: string[][] = [[from]];
    const visited = new Set([from]);
    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      if (current === to) return path;
      for (const link of linkTypes) {
        let next: string | null = null;
        if (link.sourceObject === current) next = link.targetObject;
        else if (link.targetObject === current) next = link.sourceObject;
        if (next && !visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
    return [];
  }, []);

  // Animate particles along links
  useEffect(() => {
    if (!animatingFlow) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        let updated = prev.map(p => ({
          ...p,
          progress: p.progress + p.speed,
        })).filter(p => p.progress <= 1);

        // Spawn new particles
        if (updated.length < 30 && Math.random() > 0.3) {
          const linksToUse = flowMode === 'from-selected' && selectedNode
            ? linkTypes.filter(l => l.sourceObject === selectedNode)
            : linkTypes;
          if (linksToUse.length > 0) {
            const linkIdx = Math.floor(Math.random() * linksToUse.length);
            updated.push({
              id: particleIdRef.current++,
              linkIndex: linkTypes.indexOf(linksToUse[linkIdx]),
              progress: 0,
              speed: 0.008 + Math.random() * 0.012,
              color: linksToUse[linkIdx].sourceObject === selectedNode ? '#60a5fa' : '#34d399',
            });
          }
        }
        return updated;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [animatingFlow, flowMode, selectedNode]);

  // Pulse animation for path nodes
  useEffect(() => {
    if (highlightedPath.length === 0) return;
    const interval = setInterval(() => {
      setPulseNodes(new Set(highlightedPath));
      setTimeout(() => setPulseNodes(new Set()), 600);
    }, 1200);
    return () => clearInterval(interval);
  }, [highlightedPath]);

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
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const offset = 25;
    const cx = midX + (-dy / len) * offset;
    const cy = midY + (dx / len) * offset;
    return { path: `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`, cx, cy };
  }, [getNodePosition]);

  const getPointOnPath = useCallback((path: string, progress: number) => {
    const parts = path.match(/M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)/);
    if (!parts) return { x: 0, y: 0 };
    const [, x1, y1, cx, cy, x2, y2] = parts.map(Number);
    const t = progress;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    return { x, y };
  }, []);

  const handleFindPath = () => {
    if (searchFrom && searchTo) {
      const path = findPath(searchFrom, searchTo);
      setHighlightedPath(path);
      setAnimatingFlow(true);
      setFlowMode('all');
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (searchFrom && !searchTo) {
      setSearchTo(nodeId);
    } else {
      setSearchFrom(nodeId);
      setSearchTo(null);
      setHighlightedPath([]);
    }
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ontology Explorer</h1>
          <p className="text-sm text-gray-400">交互式本体图谱 — 数据流可视化</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAnimatingFlow(!animatingFlow); setFlowMode('all'); }}
            className={`btn ${animatingFlow ? 'btn-primary' : 'btn-secondary'}`}
          >
            {animatingFlow ? '⏸ 停止流动' : '▶ 数据流动'}
          </button>
          <button
            onClick={() => { setSearchFrom(null); setSearchTo(null); setHighlightedPath([]); setSelectedNode(null); }}
            className="btn-secondary"
          >
            清除选择
          </button>
        </div>
      </div>

      {/* Path Finder */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-xs text-gray-500">路径查找:</span>
        <span className={`badge ${searchFrom ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
          {searchFrom ? objectTypes.find(o => o.id === searchFrom)?.name : '选择起点'}
        </span>
        <span className="text-gray-600">→</span>
        <span className={`badge ${searchTo ? 'bg-emerald-900/50 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
          {searchTo ? objectTypes.find(o => o.id === searchTo)?.name : '选择终点'}
        </span>
        {searchFrom && searchTo && (
          <>
            <button onClick={handleFindPath} className="btn-primary">追踪路径</button>
            {highlightedPath.length > 0 && (
              <span className="text-xs text-emerald-400">
                {highlightedPath.length - 1} 跳: {highlightedPath.map(id => objectTypes.find(o => o.id === id)?.name).join(' → ')}
              </span>
            )}
          </>
        )}
        <span className="ml-auto text-xs text-gray-600">点击节点选择起/终点</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Graph Canvas */}
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900" style={{ height: 540 }}>
            {/* Grid */}
            <svg className="absolute inset-0 h-full w-full opacity-10">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <svg className="relative h-full w-full" viewBox="0 0 900 540">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="glow-strong">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Link edges */}
              {linkTypes.map((link, i) => {
                const { path } = getLinkPath(link);
                const isHighlighted = selectedNode && (link.sourceObject === selectedNode || link.targetObject === selectedNode);
                const isInPath = highlightedPath.length > 0 && (
                  highlightedPath.includes(link.sourceObject) && highlightedPath.includes(link.targetObject) &&
                  Math.abs(highlightedPath.indexOf(link.sourceObject) - highlightedPath.indexOf(link.targetObject)) === 1
                );

                return (
                  <g key={link.id}>
                    {/* Glow background for highlighted */}
                    {(isHighlighted || isInPath) && (
                      <path d={path} fill="none" stroke={isInPath ? '#34d399' : '#60a5fa'} strokeWidth="6" opacity="0.2" filter="url(#glow-strong)" />
                    )}
                    <path
                      d={path}
                      fill="none"
                      stroke={isInPath ? '#34d399' : isHighlighted ? '#60a5fa' : '#374151'}
                      strokeWidth={isInPath ? 3 : isHighlighted ? 2 : 1}
                      strokeDasharray={isInPath ? '' : isHighlighted ? '' : '4 4'}
                      className="transition-all duration-300"
                    />
                    {/* Cardinality label */}
                    <text
                      x={getLinkPath(link).cx}
                      y={getLinkPath(link).cy - 8}
                      fontSize="8"
                      fill={isInPath ? '#34d399' : '#6b7280'}
                      textAnchor="middle"
                      className="select-none"
                    >
                      {link.cardinality}
                    </text>
                  </g>
                );
              })}

              {/* Data flow particles */}
              {particles.map(particle => {
                const link = linkTypes[particle.linkIndex];
                if (!link) return null;
                const { path } = getLinkPath(link);
                const point = getPointOnPath(path, particle.progress);
                return (
                  <g key={particle.id}>
                    <circle cx={point.x} cy={point.y} r="4" fill={particle.color} opacity="0.8" filter="url(#glow)" />
                    <circle cx={point.x} cy={point.y} r="2" fill="#fff" opacity="0.9" />
                  </g>
                );
              })}

              {/* Object nodes */}
              {objectTypes.map(obj => {
                const pos = getNodePosition(obj.id);
                const isSelected = selectedNode === obj.id;
                const isHovered = hoveredNode === obj.id;
                const isConnected = selectedNode && linkTypes.some(
                  l => (l.sourceObject === selectedNode && l.targetObject === obj.id) ||
                       (l.targetObject === selectedNode && l.sourceObject === obj.id)
                );
                const isSearchFrom = searchFrom === obj.id;
                const isSearchTo = searchTo === obj.id;
                const isInPath = highlightedPath.includes(obj.id);
                const isPulsing = pulseNodes.has(obj.id);
                const dimmed = selectedNode && !isSelected && !isConnected && !isInPath;

                return (
                  <g
                    key={obj.id}
                    className="cursor-pointer"
                    style={{ opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.3s' }}
                    onClick={() => handleNodeClick(obj.id)}
                    onMouseEnter={() => setHoveredNode(obj.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Pulse ring */}
                    {isPulsing && (
                      <circle cx={pos.x} cy={pos.y} r="45" fill="none" stroke={obj.color} strokeWidth="2" opacity="0.6">
                        <animate attributeName="r" from="35" to="55" dur="0.6s" repeatCount="1" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="0.6s" repeatCount="1" />
                      </circle>
                    )}

                    {/* Selection ring */}
                    {(isSelected || isSearchFrom || isSearchTo) && (
                      <rect
                        x={pos.x - 60} y={pos.y - 35} width="120" height="70" rx="10"
                        fill="none"
                        stroke={isSearchFrom ? '#60a5fa' : isSearchTo ? '#34d399' : obj.color}
                        strokeWidth="2" strokeDasharray="6 3"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1s" repeatCount="indefinite" />
                      </rect>
                    )}

                    {/* Node background */}
                    <rect
                      x={pos.x - 52} y={pos.y - 28} width="104" height="56" rx="8"
                      fill={isSelected ? obj.color + '30' : isHovered ? obj.color + '15' : '#111827'}
                      stroke={isInPath ? '#34d399' : isSelected ? obj.color : isHovered ? obj.color + '80' : '#374151'}
                      strokeWidth={isSelected || isInPath ? 2 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />

                    {/* Icon */}
                    <text x={pos.x - 38} y={pos.y + 4} fontSize="14" className="select-none">{obj.icon}</text>

                    {/* Name */}
                    <text x={pos.x - 20} y={pos.y + 3} fontSize="9.5" fill={isSelected ? '#fff' : '#d1d5db'} fontFamily="system-ui" className="select-none" fontWeight={isSelected ? 'bold' : 'normal'}>
                      {obj.name.length > 14 ? obj.name.slice(0, 14) + '…' : obj.name}
                    </text>

                    {/* Record count */}
                    <text x={pos.x - 20} y={pos.y + 16} fontSize="7.5" fill="#6b7280" fontFamily="system-ui" className="select-none">
                      {obj.recordCount.toLocaleString()} records
                    </text>

                    {/* Search indicator */}
                    {isSearchFrom && (
                      <circle cx={pos.x + 45} cy={pos.y - 22} r="8" fill="#3b82f6" />
                    )}
                    {isSearchFrom && (
                      <text x={pos.x + 45} y={pos.y - 19} fontSize="9" textAnchor="middle" fill="#fff" className="select-none" fontWeight="bold">A</text>
                    )}
                    {isSearchTo && (
                      <circle cx={pos.x + 45} cy={pos.y - 22} r="8" fill="#10b981" />
                    )}
                    {isSearchTo && (
                      <text x={pos.x + 45} y={pos.y - 19} fontSize="9" textAnchor="middle" fill="#fff" className="select-none" fontWeight="bold">B</text>
                    )}
                  </g>
                );
              })}

              {/* Action indicators */}
              {showActions && actionTypes.slice(0, 5).map((action) => {
                const targetPos = getNodePosition(action.targetObject);
                const angle = (actionTypes.indexOf(action) * 0.9) + 2.5;
                const radius = 65;
                const ax = targetPos.x + Math.cos(angle) * radius;
                const ay = targetPos.y + Math.sin(angle) * radius;
                return (
                  <g key={action.id} className="cursor-pointer" onClick={() => setSelectedNode(action.targetObject)}>
                    <rect x={ax - 7} y={ay - 7} width="14" height="14" rx="3" fill="#111827" stroke="#f59e0b" strokeWidth="1" opacity="0.8" />
                    <text x={ax} y={ay + 3.5} fontSize="8" textAnchor="middle" className="select-none">⚡</text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-lg bg-gray-900/95 px-3 py-2 text-xs border border-gray-800">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-blue-500 bg-blue-900/30"></span>Object</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-amber-500 bg-amber-900/30"></span>Action</span>
              <span className="flex items-center gap-1.5"><span className="h-6 w-4 border-t-2 border-dashed border-gray-500"></span>Link</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400"></span>Data Flow</span>
            </div>

            {/* Live stats */}
            <div className="absolute top-3 right-3 rounded-lg bg-gray-900/95 px-3 py-2 text-xs border border-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">活跃节点</span>
                <span className="font-bold text-emerald-400">{objectTypes.length}</span>
                <span className="text-gray-700">|</span>
                <span className="text-gray-500">连接</span>
                <span className="font-bold text-blue-400">{linkTypes.length}</span>
                {particles.length > 0 && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span className="text-gray-500">粒子</span>
                    <span className="font-bold text-amber-400">{particles.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-3">
          {selectedObject ? (
            <>
              {/* Object Detail */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{selectedObject.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-white">{selectedObject.name}</h3>
                    <span className="badge badge-object text-xs">Object Type</span>
                  </div>
                </div>
                <p className="mb-3 text-xs text-gray-400">{selectedObject.description}</p>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded bg-gray-800 p-2 text-center">
                    <div className="text-sm font-bold text-blue-400">{selectedObject.recordCount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Records</div>
                  </div>
                  <div className="rounded bg-gray-800 p-2 text-center">
                    <div className="text-sm font-bold text-emerald-400">{selectedObject.properties.length}</div>
                    <div className="text-xs text-gray-500">Properties</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedObject.dataSources.map(ds => (
                    <span key={ds} className="badge bg-gray-800 text-gray-400 text-xs">{ds}</span>
                  ))}
                </div>
              </div>

              {/* Connected Links */}
              {connectedLinks.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <h4 className="mb-2 text-xs font-semibold text-white">关系连接</h4>
                  <div className="space-y-1.5">
                    {connectedLinks.map(link => {
                      const related = link.sourceObject === selectedNode
                        ? objectTypes.find(o => o.id === link.targetObject)
                        : objectTypes.find(o => o.id === link.sourceObject);
                      return (
                        <button
                          key={link.id}
                          onClick={() => handleNodeClick(link.sourceObject === selectedNode ? link.targetObject : link.sourceObject)}
                          className="flex w-full items-center gap-2 rounded bg-gray-800 p-2 text-xs hover:bg-gray-700 transition-colors"
                        >
                          <span className="badge badge-link text-xs">{link.name}</span>
                          <span className="text-gray-500">{link.sourceObject === selectedNode ? '→' : '←'}</span>
                          <span className="text-gray-300 truncate">{related?.name}</span>
                          <span className="ml-auto text-gray-600 text-xs">{link.cardinality}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {actionTypes.filter(a => a.targetObject === selectedNode).length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <h4 className="mb-2 text-xs font-semibold text-white">可用操作</h4>
                  <div className="space-y-1.5">
                    {actionTypes.filter(a => a.targetObject === selectedNode).map(action => (
                      <div key={action.id} className="flex items-center gap-2 rounded bg-gray-800 p-2 text-xs">
                        <span className="badge badge-action text-xs">⚡ {action.name}</span>
                        {action.requireReview && <span className="text-amber-500" title="需审批">🔒</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Default state */
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">本体概览</h3>
              <div className="space-y-2">
                {[
                  { label: 'Object Types', value: objectTypes.length, color: 'text-blue-400' },
                  { label: 'Link Types', value: linkTypes.length, color: 'text-emerald-400' },
                  { label: 'Action Types', value: actionTypes.length, color: 'text-amber-400' },
                  { label: 'Interface Types', value: interfaceTypes.length, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded bg-gray-800 p-2">
                    <span className="text-xs text-gray-400">{s.label}</span>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded bg-gray-800/50 p-2 text-xs text-gray-500">
                💡 点击图谱节点查看详情，或选择起/终点追踪数据路径
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h4 className="mb-2 text-xs font-semibold text-white">快速导航</h4>
            <div className="space-y-1.5">
              <Link href="/ontology/objects" className="btn-secondary w-full justify-center text-xs">Object Types 管理</Link>
              <Link href="/data/pipelines" className="btn-secondary w-full justify-center text-xs">Pipeline Builder</Link>
              <Link href="/apps/workshop" className="btn-secondary w-full justify-center text-xs">Workshop 应用</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
