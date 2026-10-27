'use client';

import { useState } from 'react';
import type { KnowledgePoint } from '@/data/handbook-knowledge';
import { knowledgeGroups } from '@/data/handbook-knowledge';

/** Compact knowledge-point card: term + definition, expandable for the "why". */
export function KnowledgeCard({ point, defaultOpen = false }: { point: KnowledgePoint; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const group = knowledgeGroups[point.group];

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-gray-100">{point.term}</span>
          <span className="mt-0.5 block text-xs leading-5 text-gray-400">{point.definition}</span>
        </span>
        <span className="shrink-0 text-xs text-gray-600" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 border-t border-gray-800 pt-2 pl-4">
          <p className="text-xs leading-5 text-amber-200/90">
            <span className="font-medium">容易错在：</span>
            {point.why}
          </p>
          <p className="text-xs text-gray-600">
            手册第 {String(point.chapter).padStart(2, '0')} 章 · {point.chapterTitle}
          </p>
        </div>
      )}
    </div>
  );
}

/** The per-stage teaching strip embedded in OntologyJourney. */
export function StageKnowledgeStrip({
  points,
  maturity,
  checkQuestion,
  boundary,
}: {
  points: KnowledgePoint[];
  maturity: string;
  checkQuestion: string;
  boundary: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="mt-4 rounded-lg border border-blue-900/60 bg-blue-950/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-blue-300">这一步对应哪些本体知识点</span>
        <span className="badge bg-blue-900/60 text-blue-200 text-xs">{maturity}</span>
      </div>
      <div className="space-y-1.5">
        {points.map(p => <KnowledgeCard key={p.id} point={p} />)}
      </div>
      <div className="mt-2 border-t border-blue-900/40 pt-2">
        <p className="text-xs leading-5 text-gray-300">
          <span className="text-blue-300">想一想：</span>{checkQuestion}
        </p>
        {showAnswer && (
          <p className="mt-1 text-xs leading-5 text-gray-400">
            答案散见上方知识点。演示只覆盖了最小闭环，{boundary}
          </p>
        )}
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="mt-1 text-xs text-blue-400 hover:text-blue-200"
        >
          {showAnswer ? '收起边界说明' : '这一步没有演示什么？'}
        </button>
      </div>
    </div>
  );
}
