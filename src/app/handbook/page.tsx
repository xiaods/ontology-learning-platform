'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  knowledgePoints,
  knowledgeGroups,
  maturityLevels,
  type KnowledgeGroup,
  type KnowledgePoint,
} from '@/data/handbook-knowledge';
import { stageKnowledge } from '@/data/handbook-journey-map';
import { objectTypes, linkTypes, actionTypes, interfaceTypes } from '@/data/ontology-model';

const chapterTitles: Record<number, string> = {
  1: 'Ontology 到底是什么',
  3: '四位一体的决策模型',
  4: '语义元素与动力元素',
  5: 'Ontology System 系统架构',
  6: '与相似概念的区别',
  7: '完整案例：关键物料突然断供',
  8: 'AI Agent 如何接入 Ontology',
  9: '如何落地建设',
  10: '常见误区与反模式',
  11: '成熟度与验收标准',
};

const groupOrder: KnowledgeGroup[] = ['semantic', 'dynamic', 'model', 'governance'];

/** Which demo page best shows each knowledge point, derived from its relations. */
function demoSuggestion(point: KnowledgePoint): { href: string; label: string } | null {
  if (point.relatedObjects?.length) return { href: '/ontology/objects', label: 'Object Types' };
  if (point.relatedLinks?.length) return { href: '/ontology/links', label: 'Link Types' };
  if (point.relatedActions?.length) return { href: '/ontology/actions', label: 'Action Types' };
  if (point.relatedInterfaces?.length) return { href: '/ontology/interfaces', label: 'Interface Types' };
  return null;
}

/** Stages whose knowledge list includes this point, for the reverse link. */
const stagesByPoint = stageKnowledge.reduce<Record<string, number[]>>((acc, stage) => {
  stage.pointIds.forEach(id => { (acc[id] ??= []).push(stage.stageIndex); });
  return acc;
}, {});

export default function HandbookPage() {
  const [group, setGroup] = useState<KnowledgeGroup | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(knowledgePoints[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return knowledgePoints.filter(p => {
      if (group !== 'all' && p.group !== group) return false;
      if (!q) return true;
      return p.term.toLowerCase().includes(q)
        || p.definition.toLowerCase().includes(q)
        || p.chapterTitle.includes(query.trim());
    });
  }, [group, query]);

  const selected = knowledgePoints.find(p => p.id === selectedId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">本体知识地图</h1>
          <p className="mt-1 text-sm text-gray-400">
            {knowledgePoints.length} 个知识点，来自《可执行本体工程手册》12 章，每个都指向本平台中能看到它的演示。
          </p>
        </div>
        <a
          href="https://github.com/awch-D/Executable-Ontology-Handbook"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          手册原文 ↗
        </a>
      </div>

      {/* Maturity ladder */}
      <section className="mb-5 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">L0–L5 成熟度：这个演示走到哪一步</h2>
          <span className="text-xs text-gray-500">教学归纳模型，非官方等级</span>
        </div>
        <ol className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {maturityLevels.map(level => (
            <li key={level.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
              <span className="text-xs font-bold text-blue-400">{level.id}</span>
              <p className="mt-1 text-sm font-medium text-white">{level.name}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{level.detail}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs leading-5 text-gray-500">
          本平台演示完整覆盖 L0–L3；L4 的人机协同与 L5 的受控自治未在演示中实现，仅在章节说明中讨论。
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* List */}
        <div className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索知识点、术语或章节…"
            className="input"
            aria-label="搜索知识点"
          />
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...groupOrder] as const).map(key => (
              <button
                key={key}
                onClick={() => setGroup(key)}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  group === key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {key === 'all' ? '全部' : knowledgeGroups[key].label}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            {filtered.map(point => (
              <button
                key={point.id}
                onClick={() => setSelectedId(point.id)}
                className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                  selected?.id === point.id
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: knowledgeGroups[point.group].color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium text-gray-200">{point.term}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{point.definition}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-xs text-gray-500">
                没有匹配的知识点，试试其它关键词。
              </p>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="badge text-xs"
                  style={{
                    backgroundColor: `${knowledgeGroups[selected.group].color}22`,
                    color: knowledgeGroups[selected.group].color,
                  }}
                >
                  {knowledgeGroups[selected.group].label}
                </span>
                <span className="badge bg-gray-800 text-gray-400 text-xs">
                  第 {String(selected.chapter).padStart(2, '0')} 章 · {chapterTitles[selected.chapter] ?? selected.chapterTitle}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold text-white">{selected.term}</h2>
              <p className="mt-2 text-sm leading-7 text-gray-300">{selected.definition}</p>

              <div className="mt-4 rounded-lg border-l-4 border-amber-600 bg-amber-950/20 p-3">
                <p className="text-xs leading-6 text-amber-200/90">
                  <span className="font-semibold">容易错在：</span>{selected.why}
                </p>
              </div>

              {/* Related model entities */}
              {(() => {
                const objects = (selected.relatedObjects ?? [])
                  .map(id => objectTypes.find(o => o.id === id)).filter(Boolean);
                const links = (selected.relatedLinks ?? [])
                  .map(id => linkTypes.find(l => l.id === id)).filter(Boolean);
                const actions = (selected.relatedActions ?? [])
                  .map(id => actionTypes.find(a => a.id === id)).filter(Boolean);
                const interfaces = (selected.relatedInterfaces ?? [])
                  .map(id => interfaceTypes.find(i => i.id === id)).filter(Boolean);
                if (!objects.length && !links.length && !actions.length && !interfaces.length) return null;
                return (
                  <div className="mt-4 border-t border-gray-800 pt-4">
                    <h3 className="mb-2 text-xs font-semibold text-white">在本平台模型中看到它</h3>
                    <div className="space-y-2">
                      {objects.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">对象：</span>
                          {objects.map(o => (
                            <Link key={o!.id} href="/ontology/objects" className="badge badge-object text-xs hover:brightness-125">
                              {o!.icon} {o!.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {links.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">关系：</span>
                          {links.map(l => (
                            <Link key={l!.id} href="/ontology/links" className="badge badge-link text-xs hover:brightness-125">
                              {l!.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {actions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">操作：</span>
                          {actions.map(a => (
                            <Link key={a!.id} href="/ontology/actions" className="badge badge-action text-xs hover:brightness-125">
                              ⚡ {a!.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {interfaces.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-gray-500">接口：</span>
                          {interfaces.map(i => (
                            <Link key={i!.id} href="/ontology/interfaces" className="badge badge-interface text-xs hover:brightness-125">
                              {i!.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Reverse link into the journey */}
              <div className="mt-4 border-t border-gray-800 pt-4">
                <h3 className="mb-2 text-xs font-semibold text-white">在端到端演示中看它生效</h3>
                {(stagesByPoint[selected.id] ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(stagesByPoint[selected.id] ?? []).map(index => {
                      const stage = stageKnowledge[index];
                      return (
                        <Link
                          key={index}
                          href="/#ontology-graph"
                          className="rounded-md border border-blue-900 bg-blue-950/40 px-2 py-1 text-xs text-blue-200 hover:border-blue-600"
                        >
                          第 {index + 1} 步 · {stage.stageTitle}（{stage.maturity}）
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs leading-5 text-gray-500">
                    该知识点属于治理与落地范畴，演示中没有对应阶段；请阅读手册第 {selected.chapter} 章。
                  </p>
                )}
                {demoSuggestion(selected) && (
                  <Link
                    href={demoSuggestion(selected)!.href}
                    className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-200"
                  >
                    打开 {demoSuggestion(selected)!.label} ↗
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Attribution */}
      <section className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-white">知识来源与边界</h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-6 text-gray-400">
          <li>
            知识点提炼自 <a href="https://github.com/awch-D/Executable-Ontology-Handbook" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-200">Executable Ontology Handbook</a>（Apache-2.0，独立社区教学项目，与 Palantir 无隶属或授权关系）。
          </li>
          <li>本页为教学提炼，不是手册原文；术语与定义以手册和其引用的一手资料为准。</li>
          <li>手册中的成熟度模型、授权阶梯与实施清单属教学归纳，不代表 Palantir 官方产品承诺。</li>
          <li>本平台演示为浏览器内模拟，未连接真实 ERP、数据源或 AI 服务。</li>
        </ul>
      </section>
    </div>
  );
}
