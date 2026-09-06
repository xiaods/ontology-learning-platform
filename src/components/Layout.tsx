'use client';

import Link from 'next/link';
import { useState } from 'react';

const navSections = [
  {
    label: '本体建模',
    items: [
      { href: '/', label: 'Ontology Explorer', icon: '🧠', desc: '可视化本体图谱' },
      { href: '/ontology/objects', label: 'Object Types', icon: '🔷', desc: '对象类型定义' },
      { href: '/ontology/links', label: 'Link Types', icon: '🔗', desc: '关系类型定义' },
      { href: '/ontology/actions', label: 'Action Types', icon: '⚡', desc: '操作类型定义' },
      { href: '/ontology/interfaces', label: 'Interface Types', icon: '🧩', desc: '接口与共享属性' },
    ],
  },
  {
    label: '数据集成',
    items: [
      { href: '/data/sources', label: 'Data Sources', icon: '📦', desc: '数据源管理' },
      { href: '/data/pipelines', label: 'Pipeline Builder', icon: '🔄', desc: '数据管道构建' },
    ],
  },
  {
    label: '应用构建',
    items: [
      { href: '/apps/workflow', label: 'Workflow Simulator', icon: '🎬', desc: 'Action 流程模拟' },
      { href: '/apps/workshop', label: 'Workshop', icon: '🛠️', desc: '应用组装台' },
      { href: '/apps/investigation', label: 'Investigation', icon: '🔍', desc: '实例探索查询' },
    ],
  },
];

export function TopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          O
        </div>
        <h1 className="text-base font-semibold text-white">Ontology Platform</h1>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Demo</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          8 Objects · 7 Links · 6 Actions
        </span>
      </div>
    </header>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen border-r border-gray-800 bg-gray-900 pt-14 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-xs text-gray-400 hover:bg-gray-700"
      >
        {collapsed ? '→' : '←'}
      </button>

      <nav className="h-full overflow-y-auto px-2 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-800 ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0 text-base">{item.icon}</span>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-300 group-hover:text-white">{item.label}</div>
                        <div className="truncate text-xs text-gray-600 group-hover:text-gray-400">{item.desc}</div>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
