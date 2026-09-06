'use client';

import { useState } from 'react';
import { linkTypes, objectTypes } from '@/data/ontology-model';

export default function LinkTypesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getObjectColor = (id: string) => objectTypes.find(o => o.id === id)?.color || '#6b7280';
  const getObjectName = (id: string) => objectTypes.find(o => o.id === id)?.name || id;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Link Types</h1>
        <p className="text-sm text-gray-400">定义对象类型之间的关系约束</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {linkTypes.map(link => (
          <div
            key={link.id}
            onClick={() => setSelectedId(link.id)}
            className={`card-hover ${selectedId === link.id ? 'border-blue-600 bg-blue-900/10' : ''}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-link">{link.name}</span>
              <span className="text-xs text-gray-500">{link.cardinality}</span>
            </div>
            <p className="mb-3 text-xs text-gray-400">{link.description}</p>

            {/* Relationship visualization */}
            <div className="flex items-center gap-2">
              <div
                className="rounded px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: getObjectColor(link.sourceObject) + '40', borderColor: getObjectColor(link.sourceObject), borderWidth: 1 }}
              >
                {getObjectName(link.sourceObject)}
              </div>
              <div className="flex flex-col items-center">
                <div className="h-px w-12 bg-gray-600"></div>
                <span className="text-xs text-gray-500">→</span>
              </div>
              <div
                className="rounded px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: getObjectColor(link.targetObject) + '40', borderColor: getObjectColor(link.targetObject), borderWidth: 1 }}
              >
                {getObjectName(link.targetObject)}
              </div>
            </div>

            {/* Properties on link */}
            {link.properties && link.properties.length > 0 && (
              <div className="mt-3 border-t border-gray-800 pt-2">
                <div className="mb-1 text-xs text-gray-500">Link Properties:</div>
                <div className="flex flex-wrap gap-1">
                  {link.properties.map(p => (
                    <span key={p.name} className="badge bg-gray-800 text-gray-400">
                      {p.name}: {p.type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Relationship Matrix */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Relationship Matrix</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-2 py-2 text-left text-gray-500">Source \ Target</th>
                {objectTypes.map(obj => (
                  <th key={obj.id} className="px-2 py-2 text-center text-gray-400" style={{ color: obj.color }}>
                    {obj.icon} {obj.name.slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {objectTypes.map(source => (
                <tr key={source.id} className="border-t border-gray-800">
                  <td className="px-2 py-2 font-medium" style={{ color: source.color }}>
                    {source.icon} {source.name.slice(0, 10)}
                  </td>
                  {objectTypes.map(target => {
                    const link = linkTypes.find(l =>
                      l.sourceObject === source.id && l.targetObject === target.id
                    );
                    return (
                      <td key={target.id} className="px-2 py-2 text-center">
                        {link ? (
                          <span className="badge badge-link text-xs">{link.cardinality.split('-')[0][0]}-{link.cardinality.split('-')[2][0]}</span>
                        ) : (
                          <span className="text-gray-700">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
