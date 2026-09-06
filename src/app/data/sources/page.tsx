'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { objectTypes, linkTypes, pipelineStages } from '@/data/ontology-model';
import { BlueprintView } from './blueprint-view';
import { MappingView } from './mapping-view';
import { SyncMonitorView } from './sync-monitor-view';
import { dataSources, DataSource } from './sources-data';

export interface Particle {
  id: number;
  sourceId: string;
  targetObject: string;
  progress: number;
  color: string;
}

export default function DataSourcesPage() {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<number | null>(null);
  const [isFlowing, setIsFlowing] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'mapping' | 'sync'>('blueprint');
  const [syncLogs, setSyncLogs] = useState<{ time: string; source: string; action: string; records: number; status: string }[]>([]);
  const particleIdRef = useRef(0);

  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      setParticles(prev => {
        let updated = prev.map(p => ({ ...p, progress: p.progress + 0.012 })).filter(p => p.progress <= 1);
        if (updated.length < 25) {
          const source = dataSources[Math.floor(Math.random() * dataSources.length)];
          if (source.objects.length > 0) {
            const obj = source.objects[Math.floor(Math.random() * source.objects.length)];
            updated.push({ id: particleIdRef.current++, sourceId: source.id, targetObject: obj.objectId, progress: 0, color: source.color });
          }
        }
        return updated;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [isFlowing]);

  useEffect(() => {
    if (!isFlowing) return;
    const interval = setInterval(() => {
      const source = dataSources[Math.floor(Math.random() * dataSources.length)];
      const actions = ['extracted', 'transformed', 'validated', 'loaded', 'indexed'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const records = Math.floor(Math.random() * 500 + 10);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setSyncLogs(prev => [{ time, source: source.name, action, records, status: 'ok' }, ...prev].slice(0, 8));
    }, 1500);
    return () => clearInterval(interval);
  }, [isFlowing]);

  const selectedObject = useMemo(() => {
    if (!selectedSource || selectedMapping === null) return null;
    return selectedSource.objects[selectedMapping];
  }, [selectedSource, selectedMapping]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Sources Blueprint</h1>
          <p className="text-sm text-gray-400">外部系统 → 数据映射 → 本体对象 — 完整数据链路</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsFlowing(!isFlowing)} className={`btn ${isFlowing ? 'btn-primary' : 'btn-secondary'}`}>
            {isFlowing ? '⏸ 停止流动' : '▶ 数据流动'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-gray-900 p-1 border border-gray-800">
        {([
          { id: 'blueprint' as const, label: '🔗 连接蓝图', desc: '源系统→本体映射' },
          { id: 'mapping' as const, label: '📋 字段映射', desc: '字段级转换规则' },
          { id: 'sync' as const, label: '📊 同步监控', desc: '实时同步日志' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-2 text-xs transition-all ${activeTab === tab.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <div className="font-medium">{tab.label}</div>
            <div className="text-xs opacity-60">{tab.desc}</div>
          </button>
        ))}
      </div>

      {activeTab === 'blueprint' && (
        <BlueprintView
          particles={particles}
          isFlowing={isFlowing}
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
          selectedMapping={selectedMapping}
          onSelectMapping={setSelectedMapping}
        />
      )}

      {activeTab === 'mapping' && (
        <MappingView
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
          selectedMapping={selectedMapping}
          onSelectMapping={setSelectedMapping}
          selectedObject={selectedObject}
        />
      )}

      {activeTab === 'sync' && (
        <SyncMonitorView
          syncLogs={syncLogs}
          isFlowing={isFlowing}
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
        />
      )}
    </div>
  );
}
