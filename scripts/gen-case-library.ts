// Regenerates textbook/案例库.md from src/data/cases/library.ts.
// Run: npm run gen:cases
// The markdown file is a generated artifact — edit library.ts, not the .md.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  caseLibrary,
  groupLabels,
  fidelityLabels,
  fictionalExamples,
  productDemos,
  interactiveCases,
} from '../src/data/cases/library';
import type { LibraryEntry } from '../src/data/cases/types';

const groupOrder: LibraryEntry['group'][] = [
  'aipcon-11',
  'aipcon-10',
  'blog-2026',
  'partnership',
  'ongoing',
];

const groupTitles: Record<LibraryEntry['group'], string> = {
  'aipcon-11': '一、AIPCon 11（2026 年 9 月 10 日）：登台展示 Ontology 生产部署',
  'aipcon-10': '二、AIPCon 10（2026 年 6 月 4 日）：首次公开首发的生产案例',
  'blog-2026': '三、官方博客《Connecting Agents to Decisions》（2026）：真实世界案例',
  partnership: '四、合作项目：网络安全本体（Cardinal Program）',
  ongoing: '五、延续性参考：2025 年官宣、2026 年仍在深化',
};

function tableRow(entry: LibraryEntry): string {
  const cells = [
    entry.customer,
    entry.industry,
    entry.scenario,
    fidelityLabels[entry.fidelity],
    entry.sourceDate ? `${entry.source}（${entry.sourceDate}）` : entry.source,
  ];
  return '| ' + cells.join(' | ') + ' |';
}

function render(): string {
  const lines: string[] = [];
  lines.push('# 案例库：2026 年 Palantir 本体落地案例');
  lines.push('');
  lines.push('> 本文件由 `scripts/gen-case-library.ts` 从 `src/data/cases/library.ts` 自动生成。');
  lines.push('> 事实源只有一份；修改内容请编辑 library.ts 后运行 `npm run gen:cases`。');
  lines.push('');
  lines.push(`共收录 ${caseLibrary.length} 家客户案例，其中 ${productDemos.length} 项产品能力演示另列。`);
  lines.push('');

  lines.push('## 来源与可信度分级');
  lines.push('');
  lines.push('| 级别 | 含义 |');
  lines.push('| --- | --- |');
  lines.push('| 官方事实 | 客户名称、行业与应用场景，来自 Palantir 官方新闻室或官方博客等一手信源 |');
  lines.push('| 官方声称 | 官方描述性进展或产品演示指标，无独立量化披露 |');
  lines.push('| 模拟数据 | 交互式模拟中的对象、记录数与运行结果，全部为浏览器内教学模拟 |');
  lines.push('');

  for (const group of groupOrder) {
    const entries = caseLibrary.filter(e => e.group === group);
    if (entries.length === 0) continue;
    lines.push(`## ${groupTitles[group]}`);
    lines.push('');
    lines.push('| 客户 | 行业 | 应用场景 | 可信度 | 来源 |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const e of entries) lines.push(tableRow(e));
    lines.push('');
  }

  lines.push('## 可交互教学模拟');
lines.push('');
lines.push('以下案例提供浏览器内交互式模拟，用于教学演示。模拟中的对象、记录数与运行结果均为模拟数据，不代表真实系统。');
lines.push('');
lines.push('| 案例 | 行业 | 模拟场景 |');
lines.push('| --- | --- | --- |');
  for (const c of interactiveCases) {
    const entry = caseLibrary.find(e => e.interactiveSlug === c.slug);
    const label = entry ? `${c.name}（${entry.sourceDate}）` : c.name;
    lines.push(`| ${label} | ${c.industry} | ${c.scenario} |`);
  }
lines.push('');

  lines.push('## 产品能力演示（不指明客户）');
  lines.push('');
  for (const d of productDemos) {
    lines.push(`### ${d.title}`);
    lines.push('');
    lines.push(`- 指标：${d.metrics}`);
    lines.push(`- 说明：${d.note}`);
    lines.push(`- 来源：${d.source}`);
    lines.push('');
  }

  lines.push('## 范围与边界说明');
  lines.push('');
  lines.push('1. 严格意义上「2026 年新发布且明确围绕本体」的高能见度事件，主要是 AIPCon 10、AIPCon 11 的客户登台，以及 Ontology for Cybersecurity（Cardinal Program）。');
  lines.push('2. 其余案例是 2026 年中仍在对外披露或深化的既有客户落地，不等于 2026 年新发布。');
  lines.push(`3. 官方博客中的 ${fictionalExamples.join('、')} 为虚构示例，未收录。`);
  lines.push('4. 大多数客户的量化成效（ROI、百分比提升）在公开新闻稿中未逐一披露；只有陆军软件工厂的「数月→数天」为描述性进展，4000 万文档图谱为产品演示指标。');
  lines.push('5. Walmart 与 General Motors 的 AIP 官宣发生在 2025 年，列为延续性参考。');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const outPath = resolve(process.cwd(), 'textbook/案例库.md');
  writeFileSync(outPath, render(), 'utf8');
  console.log(`✓ 已生成 ${outPath}（${caseLibrary.length} 条客户案例）`);
}

main();
