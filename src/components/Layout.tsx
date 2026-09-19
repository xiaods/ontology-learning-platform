'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

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
  {
    label: '真实案例',
    items: [
      { href: '/cases', label: '案例库', icon: '📚', desc: '2026 本体落地案例' },
      { href: '/cases/american-airlines', label: '航网运营恢复', icon: '✈️', desc: 'American Airlines' },
      { href: '/cases/army-software-factory', label: '软件工厂交付', icon: '🎖️', desc: '陆军 + Agentik' },
      { href: '/cases/document-graph', label: '文档知识图谱', icon: '📄', desc: '4000 万文档结构化' },
    ],
  },
];

export function TopBar() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) dialogRef.current?.close();
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <>
    <dialog ref={dialogRef} id="mobile-navigation" aria-labelledby="mobile-navigation-title"
      className="mobile-navigation border-r border-gray-800 bg-gray-900 text-gray-100"
      onClose={() => setMenuOpen(false)}
      onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      <div className="min-h-full p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="mobile-navigation-title" className="font-semibold">导航菜单</h2>
          <button autoFocus aria-label="关闭导航菜单" className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-800"
            onClick={() => dialogRef.current?.close()}>✕</button>
        </div>
        <nav aria-label="手机导航">
          {navSections.map(section => <div key={section.label} className="mb-5">
            <div className="mb-2 px-3 text-xs font-semibold text-gray-500">{section.label}</div>
            {section.items.map(item => <Link key={item.href} href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => dialogRef.current?.close()}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname === item.href ? 'bg-blue-900/50 text-blue-200' : 'text-gray-300 hover:bg-gray-800'}`}>
              <span aria-hidden="true">{item.icon}</span><span>{item.label}</span>
            </Link>)}
          </div>)}
        </nav>
      </div>
    </dialog>
    <header className="app-header fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-gray-900">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button aria-label="打开导航菜单" aria-expanded={menuOpen} aria-controls="mobile-navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl hover:bg-gray-800 lg:hidden"
          onClick={() => { dialogRef.current?.showModal(); setMenuOpen(true); }}>☰</button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          O
        </div>
        <h1 className="truncate text-sm font-semibold text-white sm:text-base">Ontology Platform</h1>
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Demo</span>
      </div>
      <div className="hidden items-center gap-3 text-xs text-gray-400 md:flex">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          8 Objects · 7 Links · 6 Actions
        </span>
      </div>
    </header>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden lg:block fixed left-0 top-0 z-40 h-screen border-r border-gray-800 bg-gray-900 pt-14 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-xs text-gray-400 hover:bg-gray-700"
      >
        {collapsed ? '→' : '←'}
      </button>

      <nav className="h-full overflow-hidden px-2 py-4">
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
                    className={`group flex h-8 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors hover:bg-gray-800 ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0 text-base">{item.icon}</span>
                    {!collapsed && (
                      <div className="min-w-0 flex-1 truncate font-medium text-gray-300 group-hover:text-white">{item.label}</div>
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
