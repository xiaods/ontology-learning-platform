import type { CaseStudy } from './types';
import { americanAirlinesCase } from './american-airlines';
import { armySoftwareFactoryCase } from './army-software-factory';
import { documentKnowledgeGraphCase } from './document-knowledge-graph';
import { mccarthyCase } from './mccarthy';

export const caseStudies: CaseStudy[] = [
  americanAirlinesCase,
  armySoftwareFactoryCase,
  documentKnowledgeGraphCase,
  mccarthyCase,
];

export const caseBySlug: Record<string, CaseStudy> = Object.fromEntries(
  caseStudies.map(c => [c.slug, c]),
);

export type { CaseStudy } from './types';
