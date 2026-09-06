'use client';

import { useState } from 'react';
import { actionTypes, objectTypes } from '@/data/ontology-model';

export default function ActionTypesPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const getObjectName = (id: string) => objectTypes.find(o => o.id === id)?.name || id;
  const getObjectIcon = (id: string) => objectTypes.find(o => o.id === id)?.icon || '🔷';

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Action Types</h1>
        <p className="text-sm text-gray-400">定义对对象执行的变更操作</p>
      </div>

      {/* Action Flow - Supply Disruption Scenario */}
      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Supply Disruption Response Flow</h3>
        <div className="flex flex-wrap items-center gap-2">
          {actionTypes.slice(0, 5).map((action, i) => (
            <div key={action.id} className="flex items-center gap-2">
              <button
                onClick={() => setSelectedAction(action.id)}
                className={`rounded-lg border px-3 py-2 text-xs transition-all ${
                  selectedAction === action.id
                    ? 'border-amber-500 bg-amber-900/20 text-amber-300'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <span className="mr-1">{getObjectIcon(action.targetObject)}</span>
                {action.name}
              </button>
              {i < 4 && <span className="text-gray-600">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {actionTypes.map(action => (
          <div
            key={action.id}
            onClick={() => setSelectedAction(action.id)}
            className={`card-hover ${selectedAction === action.id ? 'border-amber-500 bg-amber-900/10' : ''}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="badge badge-action">⚡ {action.name}</span>
                {action.requireReview && (
                  <span className="text-xs text-amber-400" title="Requires Review Before Execution">🔒</span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {getObjectIcon(action.targetObject)} {getObjectName(action.targetObject)}
              </span>
            </div>

            <p className="mb-3 text-xs text-gray-400">{action.description}</p>

            {/* Parameters preview */}
            <div className="mb-2">
              <div className="mb-1 text-xs text-gray-500">Parameters:</div>
              <div className="flex flex-wrap gap-1">
                {action.parameters.map(p => (
                  <span key={p.name} className={`badge ${p.required ? 'bg-red-900/30 text-red-300' : 'bg-gray-800 text-gray-400'}`}>
                    {p.name}: {p.type} {p.required && '*'}
                  </span>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div>
              <div className="mb-1 text-xs text-gray-500">Effects:</div>
              <ul className="space-y-0.5">
                {action.effects.map((effect, i) => (
                  <li key={i} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="text-emerald-500">→</span> {effect}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
