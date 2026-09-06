'use client';

import { useState, useEffect, useCallback } from 'react';
import { objectTypes, actionTypes, linkTypes } from '@/data/ontology-model';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  action?: string;
  object?: string;
  effects: string[];
  duration: number; // ms for animation
  icon: string;
  color: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: '检测异常',
    description: 'Streaming Pipeline 监控供应商可靠性指标',
    object: 'supplier',
    effects: ['供应商可靠性评分骤降', '触发阈值告警事件'],
    duration: 2000,
    icon: '📡',
    color: '#ef4444',
  },
  {
    id: 2,
    title: '创建中断事件',
    description: 'Declare Supply Disruption — 自动创建 SupplyDisruption 对象',
    action: 'declare-disruption',
    object: 'supply-disruption',
    effects: ['创建 SupplyDisruption 实例', '记录受影响原料 (RawMaterial-Supplier)', '时间戳写入 DecisionLog'],
    duration: 2500,
    icon: '⚡',
    color: '#f59e0b',
  },
  {
    id: 3,
    title: '影响评估',
    description: 'Function 遍历 BOM 和库存，计算影响范围',
    object: 'bill-of-materials',
    effects: ['识别 3 个受影响产品', '计算 12 个产线停工风险', '评估库存仅够 5 天', '查询替代原料和供应商'],
    duration: 3000,
    icon: '🔍',
    color: '#3b82f6',
  },
  {
    id: 4,
    title: '推荐替代方案',
    description: 'Recommend Alternative Source — 生成最优替代方案',
    action: 'recommend-alternative',
    object: 'supplier',
    effects: ['找到 2 家合格替代供应商', '计算成本差异 +8%', '评估交期差异 +2 天', '生成推荐报告'],
    duration: 2500,
    icon: '💡',
    color: '#8b5cf6',
  },
  {
    id: 5,
    title: '执行紧急采购',
    description: 'Execute Emergency Purchase — 自动创建紧急采购订单',
    action: 'execute-emergency-po',
    object: 'purchase-order',
    effects: ['创建紧急 PurchaseOrder', '触发审批工作流', '通知替代供应商', '更新 DecisionLog'],
    duration: 3000,
    icon: '📋',
    color: '#10b981',
  },
  {
    id: 6,
    title: '重新路由生产',
    description: 'Reroute Production — 切换到备用产线',
    action: 'reroute-production',
    object: 'production-line',
    effects: ['更新生产排程', '验证目标产线产能', '通知生产主管', '计算新交期'],
    duration: 2500,
    icon: '🔄',
    color: '#ec4899',
  },
  {
    id: 7,
    title: '解决中断',
    description: 'Resolve Disruption — 新原料到达，恢复正常流程',
    action: 'resolve-disruption',
    object: 'supply-disruption',
    effects: ['更新 Disruption 状态为 Resolved', '恢复常规采购', '生成事件总结报告', '更新所有关联对象'],
    duration: 2000,
    icon: '✅',
    color: '#22c55e',
  },
];

export default function WorkflowSimulatorPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [showEffectIndex, setShowEffectIndex] = useState(-1);
  const [highlightedObjects, setHighlightedObjects] = useState<Set<string>>(new Set());
  const [objectPulse, setObjectPulse] = useState<Set<string>>(new Set());

  const advanceStep = useCallback(() => {
    if (currentStep < workflowSteps.length) {
      const step = workflowSteps[currentStep];
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setHighlightedObjects(new Set([...highlightedObjects, step.object!]));
      setObjectPulse(new Set([step.object!]));
      setTimeout(() => setObjectPulse(new Set()), 800);

      // Animate effects one by one
      setActiveEffects([]);
      setShowEffectIndex(0);
      step.effects.forEach((_, i) => {
        setTimeout(() => setShowEffectIndex(i), i * 400);
      });

      setTimeout(() => {
        setActiveEffects(step.effects);
      }, step.effects.length * 400);

      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, highlightedObjects]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= workflowSteps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      advanceStep();
    }, workflowSteps[currentStep].duration + workflowSteps[currentStep].effects.length * 400 + 500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, advanceStep]);

  const handlePlay = () => {
    if (currentStep >= workflowSteps.length) {
      // Reset
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setActiveEffects([]);
      setShowEffectIndex(-1);
      setHighlightedObjects(new Set());
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleStepClick = (index: number) => {
    setIsPlaying(false);
    setCurrentStep(index);
    setCompletedSteps(new Set(Array.from({ length: index }, (_, i) => i)));
    setActiveEffects([]);
    setShowEffectIndex(-1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setActiveEffects([]);
    setShowEffectIndex(-1);
    setHighlightedObjects(new Set());
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Action Workflow Simulator</h1>
          <p className="text-sm text-gray-400">Onyx 供应中断响应 — 逐步执行 Action 链</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="btn-primary"
          >
            {isPlaying ? '⏸ 暂停' : currentStep >= workflowSteps.length ? '🔄 重新播放' : currentStep === 0 ? '▶ 开始模拟' : '▶ 继续'}
          </button>
          <button onClick={handleReset} className="btn-secondary">重置</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-gray-400">进度</span>
          <span className="text-gray-400">{Math.min(currentStep, workflowSteps.length)}/{workflowSteps.length} 步骤</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(Math.min(currentStep, workflowSteps.length) / workflowSteps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workflow Steps */}
        <div className="lg:col-span-2 space-y-3">
          {workflowSteps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = currentStep === index && isPlaying;
            const isUpcoming = index >= currentStep;

            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`relative rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-900/20'
                    : isCompleted
                    ? 'border-gray-700 bg-gray-900'
                    : 'border-gray-800 bg-gray-900/50 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Step number */}
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg transition-all ${
                    isCurrent ? 'animate-pulse' : ''
                  }`} style={{ backgroundColor: step.color + '20', border: `1px solid ${step.color}40` }}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isCompleted ? 'text-gray-300' : 'text-white'}`}>
                        {step.title}
                      </h3>
                      {step.action && (
                        <span className="badge bg-amber-900/50 text-amber-300 text-xs">
                          {actionTypes.find(a => a.id === step.action)?.name}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>
                          执行中
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{step.description}</p>

                    {/* Effects animation */}
                    {isCurrent && showEffectIndex >= 0 && (
                      <div className="mt-3 space-y-1">
                        {step.effects.map((effect, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                              i <= showEffectIndex ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'
                            }`}
                          >
                            <span className="text-emerald-400">→</span>
                            <span className="text-gray-300">{effect}</span>
                            {i <= showEffectIndex && (
                              <span className="text-emerald-500 text-xs">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Completed effects summary */}
                    {isCompleted && !isCurrent && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.effects.slice(0, 2).map((effect, i) => (
                          <span key={i} className="badge bg-gray-800 text-gray-500 text-xs">✓ {effect.slice(0, 20)}</span>
                        ))}
                        {step.effects.length > 2 && (
                          <span className="text-xs text-gray-600">+{step.effects.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {index < workflowSteps.length - 1 && (
                  <div className="absolute -bottom-3 left-8 h-3 w-0.5 bg-gray-700" />
                )}
              </div>
            );
          })}
        </div>

        {/* Side Panel - Object State */}
        <div className="space-y-4">
          {/* Live Object State */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">对象状态</h3>
            <div className="space-y-2">
              {objectTypes.map(obj => {
                const isHighlighted = highlightedObjects.has(obj.id);
                const isPulsing = objectPulse.has(obj.id);
                return (
                  <div
                    key={obj.id}
                    className={`flex items-center gap-2 rounded p-2 text-xs transition-all duration-300 ${
                      isPulsing ? 'bg-blue-900/30 ring-1 ring-blue-500' :
                      isHighlighted ? 'bg-gray-800' : 'bg-gray-800/30'
                    }`}
                  >
                    <span className={`transition-transform duration-300 ${isPulsing ? 'scale-125' : ''}`}>
                      {obj.icon}
                    </span>
                    <span className={`flex-1 ${isHighlighted ? 'text-gray-200' : 'text-gray-500'}`}>
                      {obj.name}
                    </span>
                    {isHighlighted && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">执行指标</h3>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">响应时间</span>
                  <span className="text-emerald-400 font-mono">
                    {currentStep > 0 ? `~${(currentStep * 0.7).toFixed(1)}h` : '—'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(currentStep / workflowSteps.length) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">自动化率</span>
                  <span className="text-blue-400 font-mono">85%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-blue-500 w-[85%]" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">人工审批</span>
                  <span className="text-amber-400 font-mono">2 次</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-amber-500 w-[30%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="rounded-xl border border-blue-900/50 bg-blue-900/10 p-4">
            <h4 className="mb-1 text-xs font-semibold text-blue-300">💡 关键洞察</h4>
            <p className="text-xs text-gray-400">
              整个响应流程从检测到恢复仅需 4 小时（传统方式 48 小时）。
              每一步决策都被 DecisionLog 捕获，每一笔状态变化都可追溯，
              每一个操作都可复用。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
