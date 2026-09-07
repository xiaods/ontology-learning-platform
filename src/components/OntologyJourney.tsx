'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const stages = [
  { title: '接入业务数据', subtitle: '让系统里的记录进来', role: '数据工程师', skills: 'API / SQL · 增量同步 · 数据契约', deliverable: '可追溯的源数据表，保留来源、主键与采集时间。', production: '配置连接凭证、同步水位、重试和延迟告警。', href: '/data/sources', nodes: ['supplier', 'raw-material'] },
  { title: '清洗与校验', subtitle: '先保证数据可信', role: '数据工程师 + 业务专家', skills: 'ETL · 单位标准化 · 主键与外键校验', deliverable: '通过质量规则的标准数据；错误记录进入隔离区。', production: '维护质量阈值、字段变更检测和失败重跑机制。', href: '/data/pipelines', nodes: ['raw-material'] },
  { title: '映射本体', subtitle: '记录变成业务对象', role: '领域建模师 + 后端工程师', skills: '领域建模 · 实体标识 · 关系与基数约束', deliverable: '用稳定 ID 创建对象实例，并通过外键建立关系。', production: '管理模型版本、对象权限、索引和数据血缘。关系可以由数据库关联实现。', href: '/ontology/links', nodes: ['supplier', 'raw-material', 'bill-of-materials', 'product'] },
  { title: '计算业务影响', subtitle: '沿关系找到影响范围', role: '后端工程师 + 业务分析师', skills: '关系查询 · 业务规则 · 可解释计算', deliverable: '受影响产品及补货缺口，附计算依据。', production: '验证查询性能与规则边界；若加入 AI，需补充工具调用和评测，计算仍需可验证。', href: '/apps/investigation', nodes: ['supply-disruption', 'raw-material', 'bill-of-materials', 'product'] },
  { title: '审批与执行', subtitle: '把建议变成受控操作', role: '应用工程师 + 业务审批人', skills: '交互界面 · Action API · 权限与审批', deliverable: '校验操作参数，审批后创建紧急采购单。', production: '在服务端验证权限和额度，以幂等键防止重复下单。', href: '/ontology/actions', nodes: ['raw-material', 'purchase-order'] },
  { title: '回写与审计', subtitle: '把执行结果带回业务', role: '集成工程师 + 平台工程师', skills: '业务系统回写 · 状态同步 · 审计与监控', deliverable: '采购单回执、对象状态和关联决策日志。', production: '处理回写失败、重试与对账；到货确认后才能解除供应风险。', href: '/apps/workflow', nodes: ['decision-log', 'supply-disruption'] },
];

export default function OntologyJourney({ onStageChange }: { onStageChange: (nodes: string[]) => void }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [days, setDays] = useState(7);
  const [invalid, setInvalid] = useState(false);
  const [approved, setApproved] = useState(false);
  const [started, setStarted] = useState(false);
  const stage = stages[step];
  const shortage = Math.max(0, days * 100 - 300);
  const blocked = step === 1 && invalid;
  const awaitingApproval = step === 4 && shortage > 0 && !approved;

  useEffect(() => {
    if (started) onStageChange(stages[step].nodes);
  }, [step, started, onStageChange]);

  useEffect(() => {
    if (!playing) return;
    if (blocked || awaitingApproval || step === 5) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(current => current + 1), 2400);
    return () => clearTimeout(timer);
  }, [playing, step, blocked, awaitingApproval]);

  function reset() {
    setStep(0); setPlaying(false); setApproved(false); setStarted(false); onStageChange([]);
  }

  const inputs = [
    { source: '供应商 API + ERP（模拟）', eventId: 'EVT-001', material_code: invalid ? null : 'RM-001', delay_days: days, stock_kg: 300, daily_usage_kg: 100 },
    { material_code: invalid ? null : 'RM-001', stock_kg: 300, delay_days: days },
    { materialId: 'RM-001', supplierId: 'SUP-001', bomId: 'BOM-001', productId: 'PROD-001' },
    { disruptionId: 'EVT-001', materialId: 'RM-001', days, stockKg: 300, dailyUsageKg: 100 },
    { action: 'Execute Emergency Purchase', materialId: 'RM-001', supplierId: 'SUP-002', quantityKg: shortage },
    { orderId: shortage > 0 ? 'PO-DEMO-001' : null, eventId: 'EVT-001', decision: shortage > 0 ? 'approved' : 'monitor' },
  ];
  const outputs = [
    { batchId: 'BATCH-001', rows: 1, sourcePreserved: true },
    invalid ? { status: 'quarantined', error: 'material_code 缺失，无法唯一识别原料', acceptedRows: 0 } : { status: 'passed', materialId: 'RM-001', stockKg: 300, delayDays: days },
    { objects: ['RawMaterial:RM-001', 'Supplier:SUP-001', 'BillOfMaterials:BOM-001', 'Product:PROD-001'], links: ['RM-001 → suppliedBy → SUP-001', 'BOM-001 → contains → RM-001', 'BOM-001 → belongsTo → PROD-001'] },
    { relatedProduct: 'PROD-001', atRiskProducts: shortage > 0 ? 1 : 0, coverageDays: 3, shortageKg: shortage, formula: `max(0, ${days} × 100 − 300) = ${shortage} kg` },
    { status: shortage === 0 ? '无需采购，继续监控' : approved ? '已审批，模拟创建采购单' : '等待人工审批', orderId: approved && shortage > 0 ? 'PO-DEMO-001' : null },
    { writeback: shortage > 0 ? '模拟 ERP 已确认采购单' : '无采购回写', decisionLog: 'LOG-DEMO-001', disruptionStatus: shortage > 0 ? '处理中，等待到货' : '持续监控', stockKg: 300 },
  ];

  return (
    <section aria-labelledby="journey-title" className="mb-6 overflow-hidden rounded-xl border border-blue-900/70 bg-gray-900">
      <div className="border-b border-gray-800 bg-gradient-to-r from-blue-950/70 to-gray-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="mb-1 text-xs font-semibold tracking-widest text-blue-300">从数据到业务行动 · END TO END</p><h2 id="journey-title" className="text-xl font-semibold">一批原料延期，系统如何响应？</h2></div>
          <span className="badge bg-blue-950 text-blue-200">可交互教学模拟</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">跟随 RM-001 原料走完六个环节：看到数据如何进入图谱、计算缺口，再经过审批形成采购单。所有数据与执行均在浏览器内模拟，未连接真实 ERP 或 AI 服务。</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2" htmlFor="delay-days">供应中断 <input id="delay-days" type="range" min="1" max="10" value={days} onChange={e => { reset(); setDays(Number(e.target.value)); }} className="w-28 accent-blue-500" /><strong className="w-10 text-blue-300">{days} 天</strong></label>
          <label className="flex cursor-pointer items-center gap-2 text-gray-300"><input type="checkbox" checked={invalid} onChange={e => { reset(); setInvalid(e.target.checked); }} className="accent-blue-500" />注入异常：缺少原料 ID</label>
          <span className="text-xs text-gray-500">初始库存 300 kg · 每日消耗 100 kg · 单一原料 / 产品模型</span>
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-2 p-4 md:grid-cols-3 xl:grid-cols-6" aria-label="端到端进度">
        {stages.map((item, index) => <li key={item.title} aria-current={step === index ? 'step' : undefined} className={`rounded-lg border p-3 ${step === index ? 'border-blue-500 bg-blue-950/60' : index < step ? 'border-emerald-900 bg-emerald-950/20' : 'border-gray-800'}`}><span className={`text-xs ${index < step ? 'text-emerald-400' : 'text-blue-300'}`}>{index < step ? '✓ 已通过' : `0${index + 1}`}</span><p className="mt-1 text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-gray-500">{item.subtitle}</p></li>)}
      </ol>
      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-3">
        <div className="min-w-0 rounded-lg border border-gray-800 bg-gray-950/60 p-4 xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{step + 1}. {stage.title}</h3><span role="status" className={`text-xs ${blocked ? 'text-red-300' : 'text-emerald-300'}`}>{blocked ? '校验失败 · 流程阻断' : awaitingApproval ? '等待审批 · 自动演示已暂停' : step === 5 ? '演示完成' : playing ? '正在演示' : '可单步查看'}</span></div>
          <div className="grid gap-3 md:grid-cols-2">{[{ title: '输入 / 上游数据', value: inputs[step] }, { title: '输出 / 本步产物', value: outputs[step] }].map(panel => <div key={panel.title} className="min-w-0"><p className="mb-2 text-xs text-gray-400">{panel.title}</p><pre className="h-56 overflow-auto rounded-md border border-gray-800 bg-gray-950 p-3 text-xs leading-6 text-blue-200" tabIndex={0} aria-label={panel.title}>{JSON.stringify(panel.value, null, 2)}</pre></div>)}</div>
          <p className="mt-3 text-sm leading-6 text-gray-300">{blocked ? '没有原料 ID，就无法可靠关联库存与产品。修复源数据后重新校验，不能带着错误继续执行。' : step === 3 ? `库存可支撑 3 天；中断 ${days} 天产生 ${shortage} kg 缺口。${shortage > 0 ? '关联产品存在断料风险，准备紧急采购。' : '现有库存足够覆盖，无需紧急采购。'}` : stage.deliverable}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={blocked || awaitingApproval || step === 5} onClick={() => { setStarted(true); setPlaying(!playing); }}>{playing ? '暂停演示' : '▶ 自动演示'}</button>
            <button className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40" disabled={playing || blocked || awaitingApproval || step === 5} onClick={() => { setStarted(true); setStep(step + 1); }}>下一步 →</button>
            {blocked && <button className="btn-primary" onClick={() => setInvalid(false)}>补齐 RM-001 并重新校验</button>}
            {awaitingApproval && <button className="btn-primary" onClick={() => setApproved(true)}>模拟审批通过</button>}
            <button className="btn-secondary" onClick={reset}>重新开始</button>
          </div>
        </div>
        <aside className="rounded-lg border border-gray-800 p-4">
          <p className="text-xs text-blue-300">实现这一环需要什么能力？</p><h3 className="mt-2 text-base font-semibold">{stage.role}</h3><p className="mt-3 text-sm leading-6 text-gray-300">{stage.skills}</p>
          <div className="mt-4 border-t border-gray-800 pt-4"><p className="text-xs text-gray-500">生产落地还需实现</p><p className="mt-2 text-sm leading-6 text-gray-300">{stage.production}</p></div>
          <Link href={stage.href} className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-200">查看相关平台模块 ↗</Link>
          <p className="mt-4 text-xs leading-5 text-gray-500">贯穿全链路：权限控制、测试、版本管理与可观测性。团队可一人承担多种角色，交付能力需要覆盖全部环节。</p>
        </aside>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-800 px-5 py-3 text-xs text-gray-400"><span>业务结果：{step < 3 ? '等待影响计算' : `补货缺口 ${shortage} kg`}</span><span>采购单：{step >= 4 && approved && shortage > 0 ? 'PO-DEMO-001（模拟）' : '未创建'}</span><span>审计：{step === 5 ? 'LOG-DEMO-001（模拟）' : '等待闭环'}</span><a href="#ontology-graph" className="text-blue-400">↓ 查看本步涉及的本体关系</a></div>
    </section>
  );
}
