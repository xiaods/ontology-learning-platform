'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { initialSimulationState, simulationReducer } from '@/lib/simulation-state';
import type { CaseStudy, CaseParams, CaseResult } from '@/data/cases/types';
import {
  getDefaultPosition,
  getLinkPath,
  getPointOnPath,
  findShortestPath,
} from '@/lib/graph-geometry';

interface Particle {
  id: number;
  linkIndex: number;
  progress: number;
  speed: number;
  color: string;
}

const fidelityBadge: Record<string, { label: string; className: string }> = {
  fact: { label: '官方事实', className: 'bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/50' },
  'official-claim': { label: '官方声称', className: 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-700/50' },
  simulated: { label: '模拟数据', className: 'bg-gray-800 text-gray-400 ring-1 ring-gray-700' },
};

function defaultParams(caseStudy: CaseStudy): CaseParams {
  const params: CaseParams = {};
  caseStudy.parameters?.forEach(p => { params[p.id] = p.default; });
  return params;
}

export default function CaseSimulator({ caseStudy }: { caseStudy: CaseStudy }) {
  const [{ step, playing, started, approved }, dispatch] = useReducer(simulationReducer, initialSimulationState);
  const [params, setParams] = useState<CaseParams>(() => defaultParams(caseStudy));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [pulseNodes, setPulseNodes] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [animatingFlow, setAnimatingFlow] = useState(false);

  const particleIdRef = useRef(0);
  const stage = caseStudy.stages[step];

  const result: CaseResult = useMemo(() => {
    if (!caseStudy.compute) return {};
    try {
      return caseStudy.compute(params);
    } catch {
      return {};
    }
  }, [caseStudy, params]);

  const stageNodes = useMemo(() => new Set(stage.nodes), [stage]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    setParticles([]); setPulseNodes(new Set());
    setHighlightedPath([]); setSelectedNode(null); setSearchFrom(null); setSearchTo(null);
    setAuditLog([]); setAnimatingFlow(false);
  }, []);

  // Reset simulation state when switching to a different case.
  useEffect(() => {
    setParams(defaultParams(caseStudy));
    reset();
  }, [caseStudy, reset]);

  const appendAudit = useCallback((line: string) => {
    setAuditLog(prev => [...prev, `[${String(prev.length + 1).padStart(3, '0')}] ${line}`]);
  }, []);

  // Auto-play timer.
  useEffect(() => {
    if (!playing) return;
    if (stage.requiresApproval && !approved) { dispatch({ type: 'pause' }); setAnimatingFlow(false); return; }
    if (step === caseStudy.stages.length - 1) { dispatch({ type: 'pause' }); setAnimatingFlow(false); return; }
    const timer = setTimeout(() => dispatch({ type: 'next', requiresApproval: !!stage.requiresApproval, lastStep: caseStudy.stages.length - 1 }), 2400);
    return () => clearTimeout(timer);
  }, [playing, step, stage.requiresApproval, approved, caseStudy.stages.length]);

  // Particle flow.
  useEffect(() => {
    if (!animatingFlow) { setParticles([]); return; }
    const interval = setInterval(() => {
      setParticles(prev => {
        let updated = prev
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress <= 1);
        if (updated.length < 24 && Math.random() > 0.35) {
          const active = caseStudy.links.filter(
            l => stageNodes.has(l.source) && stageNodes.has(l.target),
          );
          const pool = active.length > 0 ? active : caseStudy.links;
          if (pool.length > 0) {
            const link = pool[Math.floor(Math.random() * pool.length)];
            updated.push({
              id: particleIdRef.current++,
              linkIndex: caseStudy.links.indexOf(link),
              progress: 0,
              speed: 0.008 + Math.random() * 0.012,
              color: stageNodes.has(link.source) ? '#60a5fa' : '#34d399',
            });
          }
        }
        return updated;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [animatingFlow, caseStudy.links, stageNodes]);

  // Pulse along the traced path.
  useEffect(() => {
    if (highlightedPath.length === 0) { setPulseNodes(new Set()); return; }
    let pulseTimer: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setPulseNodes(new Set(highlightedPath));
      pulseTimer = setTimeout(() => setPulseNodes(new Set()), 600);
    }, 1200);
    return () => { clearInterval(interval); clearTimeout(pulseTimer); };
  }, [highlightedPath]);

  const getNodePosition = useCallback(
    (objectId: string) => caseStudy.layout[objectId] || getDefaultPosition(objectId),
    [caseStudy.layout],
  );

  const getCaseLinkPath = useCallback(
    (link: CaseStudy['links'][0]) =>
      getLinkPath(getNodePosition(link.source), getNodePosition(link.target)),
    [getNodePosition],
  );

  const handleFindPath = () => {
    if (searchFrom && searchTo) {
      const path = findShortestPath(
        caseStudy.links.map(l => ({ source: l.source, target: l.target })),
        searchFrom,
        searchTo,
      );
      setHighlightedPath(path);
      appendAudit(`追踪路径 ${Math.max(0, path.length - 1)} 跳：${path.length ? path.join(' → ') : '无可达路径'}`);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (searchFrom && !searchTo && searchFrom !== nodeId) {
      setSearchTo(nodeId);
    } else {
      setSearchFrom(nodeId);
      setSearchTo(null);
      setHighlightedPath([]);
    }
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleParamChange = (id: string, value: number | string | boolean) => {
    setParams(prev => ({ ...prev, [id]: value }));
    reset();
    appendAudit(`参数调整 ${id} = ${String(value)}；流程已重置，需重新计算与审批`);
  };

  const goNext = () => {
    dispatch({ type: 'next', requiresApproval: !!stage.requiresApproval, lastStep: caseStudy.stages.length - 1 });
  };

  const handleApprove = () => {
    dispatch({ type: 'approve', requiresApproval: !!stage.requiresApproval });
    appendAudit(`人工审批通过：${stage.title}`);
  };

  const objectById = useCallback(
    (id: string) => caseStudy.objects.find(o => o.id === id),
    [caseStudy.objects],
  );

  const connectedLinks = useMemo(() => {
    if (!selectedNode) return [];
    return caseStudy.links.filter(l => l.source === selectedNode || l.target === selectedNode);
  }, [caseStudy.links, selectedNode]);

  const stageActions = useMemo(
    () => caseStudy.actions.filter(a => stage.nodes.includes(a.target)),
    [caseStudy.actions, stage.nodes],
  );

  const awaitingApproval = stage.requiresApproval && !approved;
  const inputValue = stage.input(params, result);
  const outputValue = stage.requiresApproval
    ? { approvalStatus: approved ? '已人工确认（模拟）' : '等待人工审批，尚未执行', proposedOutput: stage.output(params, result) }
    : stage.output(params, result);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/cases" className="hover:text-blue-400">案例库</Link>
          <span>/</span>
          <span className="text-gray-300">{caseStudy.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{caseStudy.name}</h1>
            <p className="text-sm text-gray-400">
              <span className="badge bg-gray-800 text-gray-300">{caseStudy.industry}</span>
              <span className="ml-2">{caseStudy.scenario}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {caseStudy.source.fidelity.map((f, i) => (
              <span key={i} className={`badge ${fidelityBadge[f.kind].className}`} title={f.text}>
                {fidelityBadge[f.kind].label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">{caseStudy.narrative}</p>
        <div className="mt-2 rounded-md border border-gray-800 bg-gray-900/60 p-3 text-xs leading-6 text-gray-400">
          <p className="font-semibold text-gray-300">来源与可信度</p>
          <p className="mt-1">来源：{caseStudy.source.venue}{caseStudy.source.date ? `（${caseStudy.source.date}）` : ''}</p>
          <ul className="mt-1 space-y-0.5">
            {caseStudy.source.fidelity.map((f, i) => (
              <li key={i}>
                <span className={`badge ${fidelityBadge[f.kind].className}`}>{fidelityBadge[f.kind].label}</span>
                <span className="ml-1.5">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stage progress */}
      <ol className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" aria-label="阶段进度">
        {caseStudy.stages.map((item, index) => (
          <li
            key={item.title}
            aria-current={step === index ? 'step' : undefined}
            className={`rounded-lg border p-3 ${step === index ? 'border-blue-500 bg-blue-950/60' : index < step ? 'border-emerald-900 bg-emerald-950/20' : 'border-gray-800'}`}
          >
            <span className={`text-xs ${index < step ? 'text-emerald-400' : 'text-blue-300'}`}>
              {index < step ? '✓ 已通过' : `0${index + 1}`}
            </span>
            <p className="mt-1 text-sm font-medium">{item.title}</p>
            {item.subtitle && <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>}
            {item.requiresApproval && <p className="mt-1 text-xs text-amber-500">需人工审批</p>}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Parameters + IO panels */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                {step + 1}. {stage.title}
                {stage.subtitle && <span className="ml-2 text-xs font-normal text-gray-500">{stage.subtitle}</span>}
              </h3>
              <span role="status" className={`text-xs ${awaitingApproval ? 'text-amber-300' : step === caseStudy.stages.length - 1 ? 'text-emerald-300' : playing ? 'text-blue-300' : 'text-gray-400'}`}>
                {awaitingApproval ? '等待人工审批 · 自动演示已暂停' : step === caseStudy.stages.length - 1 && !awaitingApproval ? '流程完成' : playing ? '正在演示' : '可单步查看'}
              </span>
            </div>

            {caseStudy.parameters && caseStudy.parameters.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                {caseStudy.parameters.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{p.label}</span>
                    {p.kind === 'range' && (
                      <>
                        <input
                          type="range" min={p.min} max={p.max} step={p.step}
                          value={Number(params[p.id])}
                          onChange={e => handleParamChange(p.id, Number(e.target.value))}
                          className="w-28 accent-blue-500"
                        />
                        <strong className="w-16 text-blue-300">{String(params[p.id])}</strong>
                      </>
                    )}
                    {p.kind === 'select' && (
                      <select
                        value={String(params[p.id])}
                        onChange={e => handleParamChange(p.id, e.target.value)}
                        className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 focus:border-blue-500 focus:outline-none"
                      >
                        {p.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                      </select>
                    )}
                    {p.kind === 'toggle' && (
                      <input
                        type="checkbox" checked={Boolean(params[p.id])}
                        onChange={e => handleParamChange(p.id, e.target.checked)}
                        className="accent-blue-500"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-2 text-xs text-gray-400">输入 / 上游数据</p>
                <pre
                  className="h-56 overflow-auto rounded-md border border-gray-800 bg-gray-950 p-3 text-xs leading-6 text-blue-200"
                  tabIndex={0} aria-label="输入"
                >{JSON.stringify(inputValue, null, 2)}</pre>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-xs text-gray-400">输出 / 本步产物</p>
                <pre
                  className="h-56 overflow-auto rounded-md border border-gray-800 bg-gray-950 p-3 text-xs leading-6 text-emerald-200"
                  tabIndex={0} aria-label="输出"
                >{JSON.stringify(outputValue, null, 2)}</pre>
              </div>
            </div>

            {stage.narrativeNote && (
              <p className="mt-3 text-sm leading-6 text-gray-300">{stage.narrativeNote(params, result)}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={awaitingApproval || step === caseStudy.stages.length - 1}
                onClick={() => { dispatch({ type: 'play', requiresApproval: !!stage.requiresApproval, lastStep: caseStudy.stages.length - 1 }); setAnimatingFlow(!playing); }}
              >
                {playing ? '⏸ 暂停演示' : '▶ 自动演示'}
              </button>
              <button
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={playing || awaitingApproval || step === caseStudy.stages.length - 1}
                onClick={goNext}
              >
                下一步 →
              </button>
              {awaitingApproval && (
                <button className="btn-primary" onClick={handleApprove}>模拟审批通过</button>
              )}
              <button
                className="btn-secondary"
                onClick={() => { setAnimatingFlow(!animatingFlow); }}
              >
                {animatingFlow ? '⏸ 停止数据流' : '▶ 数据流动'}
              </button>
              <button className="btn-secondary" onClick={reset}>重新开始</button>
            </div>
          </div>

          {/* Graph */}
          <p className="mb-2 text-xs text-gray-500 lg:hidden">左右滑动查看完整图谱，轻点节点查看详情。</p>
          <div id="case-graph" className="mb-3 scroll-mt-20 text-sm text-gray-400">
            本案例本体关系图
            {started && <span className="ml-3 text-blue-300">蓝色高亮：当前环节涉及的对象与关系</span>}
          </div>
          <div className="graph-viewport relative overflow-x-auto rounded-xl border border-gray-800 bg-gray-900" style={{ height: 520 }}>
            <svg className="absolute inset-0 h-full w-full opacity-10">
              <defs>
                <pattern id="case-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#case-grid)" />
            </svg>

            <svg className="relative h-full w-full min-w-[760px] lg:min-w-0" viewBox="0 0 900 520">
              <defs>
                <filter id="case-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="case-glow-strong">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {caseStudy.links.map(link => {
                const { path } = getCaseLinkPath(link);
                const isHighlighted = selectedNode && (link.source === selectedNode || link.target === selectedNode);
                const isStageLink = started && stageNodes.has(link.source) && stageNodes.has(link.target);
                const isInPath = highlightedPath.length > 0 && (
                  highlightedPath.includes(link.source) && highlightedPath.includes(link.target) &&
                  Math.abs(highlightedPath.indexOf(link.source) - highlightedPath.indexOf(link.target)) === 1
                );
                return (
                  <g key={link.id}>
                    {(isHighlighted || isInPath || isStageLink) && (
                      <path
                        d={path} fill="none"
                        stroke={isInPath ? '#34d399' : isStageLink ? '#60a5fa' : '#6b7280'}
                        strokeWidth="6" opacity="0.2" filter="url(#case-glow-strong)"
                      />
                    )}
                    <path
                      d={path} fill="none"
                      stroke={isInPath ? '#34d399' : isStageLink ? '#60a5fa' : isHighlighted ? '#9ca3af' : '#374151'}
                      strokeWidth={isInPath ? 3 : isStageLink ? 2 : 1}
                      strokeDasharray={isStageLink || isInPath ? '' : '4 4'}
                      className="transition-all duration-300"
                    />
                    <text
                      x={getCaseLinkPath(link).cx}
                      y={getCaseLinkPath(link).cy - 8}
                      fontSize="8" fill={isInPath ? '#34d399' : '#6b7280'}
                      textAnchor="middle" className="select-none"
                    >
                      {link.name}
                    </text>
                  </g>
                );
              })}

              {particles.map(particle => {
                const link = caseStudy.links[particle.linkIndex];
                if (!link) return null;
                const { path } = getCaseLinkPath(link);
                const point = getPointOnPath(path, particle.progress);
                return (
                  <g key={particle.id}>
                    <circle cx={point.x} cy={point.y} r="4" fill={particle.color} opacity="0.8" filter="url(#case-glow)" />
                    <circle cx={point.x} cy={point.y} r="2" fill="#fff" opacity="0.9" />
                  </g>
                );
              })}

              {caseStudy.objects.map(obj => {
                const pos = getNodePosition(obj.id);
                const isSelected = selectedNode === obj.id;
                const isStageNode = started && stageNodes.has(obj.id);
                const isHovered = hoveredNode === obj.id;
                const isConnected = selectedNode && caseStudy.links.some(
                  l => (l.source === selectedNode && l.target === obj.id) ||
                       (l.target === selectedNode && l.source === obj.id),
                );
                const isSearchFrom = searchFrom === obj.id;
                const isSearchTo = searchTo === obj.id;
                const isInPath = highlightedPath.includes(obj.id);
                const isPulsing = pulseNodes.has(obj.id);
                const dimmed = started
                  ? !isStageNode && !isSelected && !isConnected && !isInPath
                  : selectedNode ? !isSelected && !isConnected && !isInPath : false;

                return (
                  <g
                    key={obj.id}
                    className="cursor-pointer"
                    style={{ opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.3s' }}
                    role="button"
                    tabIndex={0}
                    aria-label={`查看对象类型 ${obj.name}`}
                    aria-pressed={selectedNode === obj.id}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleNodeClick(obj.id); } }}
                    onClick={() => handleNodeClick(obj.id)}
                    onMouseEnter={() => setHoveredNode(obj.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {isPulsing && (
                      <circle cx={pos.x} cy={pos.y} r="45" fill="none" stroke={obj.color} strokeWidth="2" opacity="0.6">
                        <animate attributeName="r" from="35" to="55" dur="0.6s" repeatCount="1" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="0.6s" repeatCount="1" />
                      </circle>
                    )}

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

                    <rect
                      x={pos.x - 52} y={pos.y - 28} width="104" height="56" rx="8"
                      fill={isSelected ? obj.color + '30' : isHovered ? obj.color + '15' : '#111827'}
                      stroke={isInPath ? '#34d399' : isStageNode ? '#60a5fa' : isSelected ? obj.color : isHovered ? obj.color + '80' : '#374151'}
                      strokeWidth={isSelected || isInPath || isStageNode ? 2 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                    <text x={pos.x - 38} y={pos.y + 4} fontSize="14" className="select-none">{obj.icon}</text>
                    <text
                      x={pos.x - 20} y={pos.y + 3} fontSize="9.5"
                      fill={isSelected ? '#fff' : '#d1d5db'} fontFamily="system-ui"
                      className="select-none" fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {obj.name.length > 14 ? obj.name.slice(0, 14) + '…' : obj.name}
                    </text>
                    <text x={pos.x - 20} y={pos.y + 16} fontSize="7.5" fill="#6b7280" fontFamily="system-ui" className="select-none">
                      {obj.recordCount.toLocaleString()} records
                    </text>

                    {isSearchFrom && (
                      <>
                        <circle cx={pos.x + 45} cy={pos.y - 22} r="8" fill="#3b82f6" />
                        <text x={pos.x + 45} y={pos.y - 19} fontSize="9" textAnchor="middle" fill="#fff" className="select-none" fontWeight="bold">A</text>
                      </>
                    )}
                    {isSearchTo && (
                      <>
                        <circle cx={pos.x + 45} cy={pos.y - 22} r="8" fill="#10b981" />
                        <text x={pos.x + 45} y={pos.y - 19} fontSize="9" textAnchor="middle" fill="#fff" className="select-none" fontWeight="bold">B</text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Path finder */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-gray-900/95 px-3 py-2 text-xs border border-gray-800">
              <span className="text-gray-500">路径查找:</span>
              <span className={`badge ${searchFrom ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-500'}`}>
                {searchFrom ? objectById(searchFrom)?.name : '选起点'}
              </span>
              <span className="text-gray-600">→</span>
              <span className={`badge ${searchTo ? 'bg-emerald-900/50 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
                {searchTo ? objectById(searchTo)?.name : '选终点'}
              </span>
              {searchFrom && searchTo && (
                <button onClick={handleFindPath} className="btn-primary">追踪</button>
              )}
              {highlightedPath.length > 0 && (
                <span className="text-emerald-400">{highlightedPath.length - 1} 跳</span>
              )}
            </div>

            {/* Legend */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 rounded-lg bg-gray-900/95 px-3 py-2 text-xs border border-gray-800">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-blue-500 bg-blue-900/30"></span>当前环节</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-gray-600 bg-gray-800"></span>Object</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400"></span>数据流</span>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-blue-300">实现这一环需要什么能力？</p>
            <h3 className="mt-2 text-base font-semibold">{stage.role}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-300">{stage.skills}</p>
            {stage.production && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500">生产落地还需实现</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">{stage.production}</p>
              </div>
            )}
          </div>

          {selectedNode && objectById(selectedNode) && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{objectById(selectedNode)!.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-white">{objectById(selectedNode)!.name}</h3>
                  <span className="badge badge-object text-xs">Object Type</span>
                </div>
              </div>
              <p className="mb-3 text-xs text-gray-400">{objectById(selectedNode)!.description}</p>
              <div className="rounded bg-gray-800 p-2 text-center">
                <div className="text-sm font-bold text-blue-400">{objectById(selectedNode)!.recordCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Records（模拟）</div>
              </div>
            </div>
          )}

          {connectedLinks.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <h4 className="mb-2 text-xs font-semibold text-white">关系连接</h4>
              <div className="space-y-1.5">
                {connectedLinks.map(link => {
                  const relatedId = link.source === selectedNode ? link.target : link.source;
                  const related = objectById(relatedId);
                  return (
                    <button
                      key={link.id}
                      onClick={() => related && handleNodeClick(relatedId)}
                      className="flex w-full items-center gap-2 rounded bg-gray-800 p-2 text-xs hover:bg-gray-700 transition-colors"
                    >
                      <span className="badge badge-link text-xs">{link.name}</span>
                      <span className="text-gray-500">{link.source === selectedNode ? '→' : '←'}</span>
                      <span className="text-gray-300 truncate">{related?.name}</span>
                      <span className="ml-auto text-gray-600 text-xs">{link.cardinality}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stageActions.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <h4 className="mb-2 text-xs font-semibold text-white">本环节可用操作</h4>
              <div className="space-y-1.5">
                {stageActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => appendAudit(`执行 Action「${action.name}」→ ${action.effects.join('；')}`)}
                    className="flex w-full items-center gap-2 rounded bg-gray-800 p-2 text-xs hover:bg-gray-700 transition-colors"
                  >
                    <span className="badge badge-action text-xs">⚡ {action.name}</span>
                    {action.requireReview && <span className="text-amber-500" title="需审批">🔒</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audit trail */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white">审计足迹</h4>
              <span className="text-xs text-gray-600">{auditLog.length} 条</span>
            </div>
            {auditLog.length === 0 ? (
              <p className="text-xs text-gray-600">执行操作、审批或追踪路径后会在此留痕。</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {auditLog.map((line, i) => (
                  <li key={i} className="rounded bg-gray-950/60 px-2 py-1.5 font-mono text-xs leading-5 text-emerald-300">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
