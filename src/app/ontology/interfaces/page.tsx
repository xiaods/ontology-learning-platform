'use client';

import { interfaceTypes, objectTypes } from '@/data/ontology-model';

export default function InterfaceTypesPage() {
  const getObjectName = (id: string) => objectTypes.find(o => o.id === id)?.name || id;
  const getObjectColor = (id: string) => objectTypes.find(o => o.id === id)?.color || '#6b7280';

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Interface Types</h1>
        <p className="text-sm text-gray-400">定义共享属性契约，多个 Object Type 可实现同一 Interface</p>
      </div>

      <div className="space-y-6">
        {interfaceTypes.map(iface => (
          <div key={iface.id} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="badge badge-interface">🧩 {iface.name}</span>
              <span className="text-xs text-gray-500">implemented by {iface.implementedBy.length} types</span>
            </div>
            <p className="mb-4 text-sm text-gray-400">{iface.description}</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Interface Properties */}
              <div>
                <h4 className="mb-2 text-xs font-semibold text-gray-500">Interface Properties</h4>
                <div className="space-y-1">
                  {iface.properties.map(prop => (
                    <div key={prop.name} className="flex items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-xs">
                      <code className="text-purple-300">{prop.name}</code>
                      <span className="text-gray-600">:</span>
                      <span className="text-emerald-400">{prop.type}</span>
                      <span className="ml-auto text-gray-500">{prop.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementing Types */}
              <div>
                <h4 className="mb-2 text-xs font-semibold text-gray-500">Implemented By</h4>
                <div className="flex flex-wrap gap-2">
                  {iface.implementedBy.map(objId => (
                    <div
                      key={objId}
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: getObjectColor(objId) + '20',
                        color: getObjectColor(objId),
                        border: `1px solid ${getObjectColor(objId)}40`
                      }}
                    >
                      {getObjectName(objId)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Concept explanation */}
      <div className="mt-8 rounded-xl border border-purple-900/50 bg-purple-900/10 p-5">
        <h3 className="mb-2 text-sm font-semibold text-purple-300">💡 Interface Types 的作用</h3>
        <p className="text-xs text-gray-400">
          Interface Types 定义了一组共享属性契约。多个 Object Type 可以实现同一个 Interface，
          确保跨对象的一致性。例如，所有实现 Auditable 的对象都自动具有 createdBy 和 lastModifiedBy 属性，
          便于统一审计和权限管理。
        </p>
      </div>
    </div>
  );
}
