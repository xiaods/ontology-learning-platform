'use client';

import { useState, useMemo } from 'react';
import { objectTypes } from '@/data/ontology-model';
import Link from 'next/link';

export default function ObjectTypesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredObjects = useMemo(() =>
    objectTypes.filter(o =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description.includes(searchQuery)
    ),
    [searchQuery]
  );

  const selectedObject = objectTypes.find(o => o.id === selectedId);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Object Types</h1>
          <p className="text-sm text-gray-400">定义真实世界实体的 schema</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          + New Object Type
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Object List */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search object types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
          <div className="space-y-2">
            {filteredObjects.map(obj => (
              <button
                key={obj.id}
                onClick={() => setSelectedId(obj.id)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  selectedId === obj.id
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{obj.icon}</span>
                  <span className="font-medium text-gray-200">{obj.name}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{obj.description.slice(0, 50)}…</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="badge bg-gray-800 text-gray-400">{obj.properties.length} props</span>
                  <span className="badge bg-gray-800 text-gray-400">{obj.recordCount} records</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / Edit Panel */}
        <div className="lg:col-span-2">
          {showAddForm ? (
            <AddObjectTypeForm onClose={() => setShowAddForm(false)} />
          ) : selectedObject ? (
            <ObjectDetail object={selectedObject} />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
              <div className="text-center">
                <div className="text-4xl">🔷</div>
                <p className="mt-2 text-sm text-gray-500">Select an Object Type to view its definition</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ObjectDetail({ object }: { object: typeof objectTypes[0] }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{object.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{object.name}</h2>
            <span className="badge badge-object">Object Type</span>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} className={editing ? 'btn-primary' : 'btn-secondary'}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-400">{object.description}</p>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{object.recordCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Records</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{object.properties.length}</div>
          <div className="text-xs text-gray-500">Properties</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{object.dataSources.length}</div>
          <div className="text-xs text-gray-500">Data Sources</div>
        </div>
      </div>

      {/* Key Info */}
      <div className="mb-4 flex gap-3">
        <div className="rounded bg-gray-800 px-3 py-1.5 text-xs">
          <span className="text-gray-500">PK: </span>
          <code className="text-blue-400">{object.primaryKey}</code>
        </div>
        <div className="flex gap-1">
          {object.dataSources.map(ds => (
            <span key={ds} className="badge bg-gray-800 text-gray-400">{ds}</span>
          ))}
        </div>
      </div>

      {/* Properties Table */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-white">Properties</h3>
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Description</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-400">Req</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Codex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {object.properties.map(prop => (
                <tr key={prop.name} className="hover:bg-gray-800/50">
                  <td className="px-3 py-2">
                    <code className="text-xs text-blue-300">{prop.name}</code>
                    {prop.name === object.primaryKey && (
                      <span className="ml-1 text-xs text-amber-500">🔑</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="badge bg-gray-800 text-emerald-400">{prop.type}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">{prop.description}</td>
                  <td className="px-3 py-2 text-center">
                    {prop.required ? <span className="text-amber-400">●</span> : <span className="text-gray-600">○</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{prop.codex || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AddObjectTypeForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryKey, setPrimaryKey] = useState('');
  const [properties, setProperties] = useState([{ name: '', type: 'String', description: '', required: false }]);

  const addProperty = () => {
    setProperties([...properties, { name: '', type: 'String', description: '', required: false }]);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">New Object Type</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input mt-1" placeholder="e.g. QualityInspection" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="input mt-1" rows={2} placeholder="What does this object represent?" />
        </div>
        <div>
          <label className="label">Primary Key</label>
          <input value={primaryKey} onChange={e => setPrimaryKey(e.target.value)} className="input mt-1" placeholder="e.g. inspectionId" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label">Properties</label>
            <button onClick={addProperty} className="text-xs text-blue-400 hover:text-blue-300">+ Add Property</button>
          </div>
          <div className="space-y-2">
            {properties.map((prop, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  value={prop.name}
                  onChange={e => {
                    const newProps = [...properties];
                    newProps[i].name = e.target.value;
                    setProperties(newProps);
                  }}
                  className="input col-span-4"
                  placeholder="name"
                />
                <select
                  value={prop.type}
                  onChange={e => {
                    const newProps = [...properties];
                    newProps[i].type = e.target.value;
                    setProperties(newProps);
                  }}
                  className="input col-span-2"
                >
                  {['String', 'Integer', 'Double', 'Boolean', 'DateTime'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  value={prop.description}
                  onChange={e => {
                    const newProps = [...properties];
                    newProps[i].description = e.target.value;
                    setProperties(newProps);
                  }}
                  className="input col-span-5"
                  placeholder="description"
                />
                <label className="col-span-1 flex items-center justify-center text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={prop.required}
                    onChange={e => {
                      const newProps = [...properties];
                      newProps[i].required = e.target.checked;
                      setProperties(newProps);
                    }}
                    className="rounded border-gray-600"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary">Create Object Type</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
