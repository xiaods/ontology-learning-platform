'use client';

import CaseSimulator from '@/components/CaseSimulator';
import { mccarthyCase } from '@/data/cases/mccarthy';

export default function McCarthyCasePage() {
  return <CaseSimulator caseStudy={mccarthyCase} />;
}
