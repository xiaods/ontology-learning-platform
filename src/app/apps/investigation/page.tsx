'use client';

import { useState, useMemo } from 'react';
import { objectTypes, linkTypes } from '@/data/ontology-model';

interface QueryResult {
  id: string;
  [key: string]: string | number | boolean;
}

export default function InvestigationPage() {
  const [selectedObject, setSelectedObject] = useState('raw-material');
  const [searchField, setSearchField] = useState('name');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const object = objectTypes.find(o => o.id === selectedObject);

  const runSearch = () => {
    if (!object) return;
    setIsSearching(true);

    // Simulate search with generated results
    setTimeout(() => {
      const numResults = Math.floor(Math.random() * 8) + 3;
      const mockResults: QueryResult[] = Array.from({ length: numResults }, (_, i) => {
        const record: QueryResult = { id: `${selectedObject}-${i + 1}` };
        object.properties.forEach(p => {
          if (p.name === 'name') record[p.name] = `${searchValue || 'Item'} ${String.fromCharCode(65 + i)}`;
          else if (p.type === 'String') record[p.name] = `value_${i + 1}`;
          else if (p.type === 'Integer') record[p.name] = Math.floor(Math.random() * 1000);
          else if (p.type === 'Double') record[p.name] = parseFloat((Math.random() * 100).toFixed(2));
          else if (p.type === 'Boolean') record[p.name] = Math.random() > 0.5;
          else record[p.name] = `2024-0${Math.floor(Math.random() * 9) + 1}-15`;
        });
        return record;
      });
      setResults(mockResults);
      setIsSearching(false);
    }, 800);
  };

  const expandResult = (resultId: string) => {
    // Simulate expanding to show related objects
    const related = linkTypes.filter(l => l.sourceObject === selectedObject || l.targetObject === selectedObject);
    return related;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Investigation</h1>
        <p className="text-sm text-gray-400">实例探索 — 查询和分析 Ontology 中的具体数据</p>
      </div>

      {/* Search Panel */}
      <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <div className="mb-3 flex items-center gap-3">
          <select
            value={selectedObject}
            onChange={e => { setSelectedObject(e.target.value); setResults(null); }}
            className="input max-w-xs"
          >
            {objectTypes.map(obj => (
              <option key={obj.id} value={obj.id}>{obj.icon} {obj.name}</option>
            ))}
          </select>
          <select
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            className="input max-w-xs"
          >
            {object?.properties.map(p => (
              <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
            ))}
          </select>
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search value..."
            className="input flex-1"
            onKeyDown={e => e.key === 'Enter' && runSearch()}
          />
          <button onClick={runSearch} disabled={isSearching} className="btn-primary">
            {isSearching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {/* Object info */}
        {object && (
          <div className="flex items-center gap-3 rounded bg-gray-800 p-2 text-xs">
            <span className="text-lg">{object.icon}</span>
            <span className="font-medium text-gray-300">{object.name}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">{object.description}</span>
            <span className="ml-auto text-gray-500">{object.recordCount.toLocaleString()} total records</span>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="mb-6">
          <div className="mb-2 text-sm text-gray-400">
            Found <span className="font-medium text-white">{results.length}</span> results
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  {object?.properties.slice(0, 6).map(p => (
                    <th key={p.name} className="px-3 py-2 text-left text-xs font-medium text-gray-400">
                      <div className="flex items-center gap-1">
                        {p.name}
                        {p.name === object.primaryKey && <span className="text-amber-500">🔑</span>}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {results.map(result => (
                  <ResultRow key={result.id} result={result} object={object!} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Relationship Explorer */}
      {results && results.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Relationship Explorer</h3>
          <p className="mb-3 text-xs text-gray-400">
            点击结果行查看关联对象 — 基于 Link Type 定义的关联关系
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {linkTypes
              .filter(l => l.sourceObject === selectedObject || l.targetObject === selectedObject)
              .map(link => {
                const relatedObjId = link.sourceObject === selectedObject ? link.targetObject : link.sourceObject;
                const relatedObj = objectTypes.find(o => o.id === relatedObjId);
                return (
                  <div key={link.id} className="rounded-lg border border-gray-800 bg-gray-800 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className="badge badge-link">{link.name}</span>
                      <span className="text-gray-500">{link.cardinality}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{relatedObj?.icon}</span>
                      <span className="text-sm text-gray-300">{relatedObj?.name}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
          <div className="text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-2 text-sm text-gray-500">Select an Object Type and search to explore instances</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ result, object }: { result: QueryResult; object: typeof objectTypes[0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        {object.properties.slice(0, 6).map(p => (
          <td key={p.name} className="px-3 py-2">
            <span className="text-xs text-gray-300">
              {typeof result[p.name] === 'boolean'
                ? (result[p.name] ? '✓ true' : '✗ false')
                : String(result[p.name] || '—')
              }
            </span>
          </td>
        ))}
        <td className="px-3 py-2">
          <span className="text-xs text-blue-400 hover:text-blue-300">
            {expanded ? '▼ Collapse' : '▶ Expand'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-gray-800/30 px-6 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {object.properties.slice(6).map(p => (
                <div key={p.name} className="text-xs">
                  <span className="text-gray-500">{p.name}: </span>
                  <span className="text-gray-300">{String(result[p.name] || '—')}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
