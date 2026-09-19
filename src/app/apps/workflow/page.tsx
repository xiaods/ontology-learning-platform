'use client';

import { useState, useEffect, useCallback } from 'react';
import { objectTypes, actionTypes } from '@/data/ontology-model';

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
    description: 'Declare Supply Disruption — 审批后创建 SupplyDisruption 对象',
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
    description: 'Execute Emergency Purchase — 人工审批通过后创建模拟采购订单',
    action: 'execute-emergency-po',
    object: 'purchase-order',
    effects: ['人工审批已通过', '创建紧急 PurchaseOrder', '通知替代供应商', '更新 DecisionLog'],
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
  const [approvedSteps, setApprovedSteps] = useState<Set<number>>(new Set());
  const completedSteps = new Set(Array.from({ length: currentStep }, (_, i) => i));
  const highlightedObjects = new Set(workflowSteps.slice(0, currentStep).map(step => step.object!));
  const objectPulse = new Set<string>();
  const reviewSteps = workflowSteps.flatMap((step, index) =>
    actionTypes.find(action => action.id === step.action)?.requireReview ? [index] : []);
  const gateLabels: Record<number, string> = { 6: '模拟确认原料到货' };
  for (const index of reviewSteps) gateLabels[index] = `模拟审批${workflowSteps[index].title}`;
  const awaitingConfirmation = !!gateLabels[currentStep] && !approvedSteps.has(currentStep);

  const advanceStep = useCallback(() => {
    if (awaitingConfirmation) return;
    setCurrentStep(prev => Math.min(prev + 1, workflowSteps.length));
  }, [awaitingConfirmation]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= workflowSteps.length || awaitingConfirmation) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(advanceStep, workflowSteps[currentStep].duration);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, advanceStep, awaitingConfirmation]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setApprovedSteps(new Set());
  };
  const handlePlay = () => {
    if (currentStep >= workflowSteps.length) handleReset();
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleStepClick = (index: number) => {
    // Only revisit reached stages; never manufacture completed actions.
    if (index > currentStep) return;
    setIsPlaying(false);
    setCurrentStep(index);
    setApprovedSteps(prev => new Set([...prev].filter(value => value < index)));
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Action Workflow Simulator</h1>
          <p className="text-sm text-gray-400">Onyx 供应中断响应 — 逐步执行 Action 链</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="btn-primary disabled:opacity-40"
            disabled={awaitingConfirmation}
          >
            {isPlaying ? '⏸ 暂停' : currentStep >= workflowSteps.length ? '🔄 重新播放' : currentStep === 0 ? '▶ 开始模拟' : '▶ 继续'}
          </button>
          <button onClick={handleReset} className="btn-secondary">重置</button>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-gray-400">浏览器内教学模拟：数值为预设示例，未连接监控、审批或采购系统。声明中断、采购与改线均遵循模型审批要求；只有确认到货后才能解除中断。</p>
      <div className="mb-4 flex flex-wrap items-center gap-3" role="status">
        <span className="text-sm text-amber-300">{awaitingConfirmation ? '流程暂停，等待人工确认' : currentStep === workflowSteps.length ? '模拟流程完成' : `待执行：${workflowSteps[currentStep]?.title}`}</span>
        {awaitingConfirmation && <button className="btn-primary" onClick={() => setApprovedSteps(prev => new Set([...prev, currentStep]))}>{gateLabels[currentStep]}</button>}
        <button className="btn-secondary disabled:opacity-40" disabled={isPlaying || awaitingConfirmation || currentStep === workflowSteps.length} onClick={advanceStep}>执行当前步骤 →</button>
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
            const isCurrent = currentStep === index;
            const isUpcoming = index >= currentStep;

            return (
              <div
                key={step.id}
                role="button"
                tabIndex={index <= currentStep ? 0 : -1}
                aria-disabled={index > currentStep}
                aria-label={`回看 ${step.title}`}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleStepClick(index); } }}
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
                          {awaitingConfirmation ? '待确认' : isPlaying ? '执行中' : '待执行'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{step.description}</p>

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
                  <span className="text-gray-500">已执行步骤</span>
                  <span className="text-emerald-400 font-mono">
                    {currentStep > 0 ? `${currentStep} / ${workflowSteps.length}` : '—'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(currentStep / workflowSteps.length) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">执行模式</span>
                  <span className="text-blue-400 font-mono">教学模拟</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-blue-500 w-full" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-500">人工审批</span>
                  <span className="text-amber-400 font-mono">{reviewSteps.filter(index => approvedSteps.has(index)).length} / {reviewSteps.length} 次</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${reviewSteps.filter(index => approvedSteps.has(index)).length / reviewSteps.length * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="rounded-xl border border-blue-900/50 bg-blue-900/10 p-4">
            <h4 className="mb-1 text-xs font-semibold text-blue-300">💡 关键洞察</h4>
            <p className="text-xs text-gray-400">
              创建采购单不等于原料到货。审批、执行与到货确认是独立状态；本演示不提供真实响应时间或自动化率测量。
              生产实现应把决策输入、审批人、执行回执和失败原因写入持久化 DecisionLog。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
