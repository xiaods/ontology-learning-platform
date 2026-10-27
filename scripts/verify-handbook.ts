import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { knowledgePoints, knowledgeGroups, maturityLevels, getKnowledgePoint } from '../src/data/handbook-knowledge';
import { stageKnowledge, stageKnowledgeByIndex } from '../src/data/handbook-journey-map';
import { objectTypes, linkTypes, actionTypes, interfaceTypes } from '../src/data/ontology-model';

// 1. Knowledge points must be unique and complete.
const ids = new Set<string>();
for (const point of knowledgePoints) {
  assert.ok(!ids.has(point.id), `duplicate knowledge point id: ${point.id}`);
  ids.add(point.id);
  assert.ok(point.term.trim(), `knowledge point ${point.id} has no term`);
  assert.ok(point.definition.trim(), `knowledge point ${point.id} has no definition`);
  assert.ok(point.why.trim(), `knowledge point ${point.id} has no "why"`);
  assert.ok(point.chapter >= 1 && point.chapter <= 12, `knowledge point ${point.id} has chapter outside 1-12`);
  assert.ok(knowledgeGroups[point.group], `knowledge point ${point.id} has unknown group`);
}
console.log(`✓ ${knowledgePoints.length} knowledge points are unique and complete`);

// 2. Every relation a point references must exist in the ontology model.
const objectIds = new Set(objectTypes.map(o => o.id));
const linkIds = new Set(linkTypes.map(l => l.id));
const actionIds = new Set(actionTypes.map(a => a.id));
const interfaceIds = new Set(interfaceTypes.map(i => i.id));

for (const point of knowledgePoints) {
  for (const id of point.relatedObjects ?? []) {
    assert.ok(objectIds.has(id), `knowledge point ${point.id} references unknown object ${id}`);
  }
  for (const id of point.relatedLinks ?? []) {
    assert.ok(linkIds.has(id), `knowledge point ${point.id} references unknown link ${id}`);
  }
  for (const id of point.relatedActions ?? []) {
    assert.ok(actionIds.has(id), `knowledge point ${point.id} references unknown action ${id}`);
  }
  for (const id of point.relatedInterfaces ?? []) {
    assert.ok(interfaceIds.has(id), `knowledge point ${point.id} references unknown interface ${id}`);
  }
}
console.log('✓ Every knowledge point relation resolves to a real model entity');

// 3. Stage map must reference real knowledge points and valid maturity levels.
const maturityIds = new Set(maturityLevels.map(l => l.id));
const stageIndexes = new Set<number>();
for (const stage of stageKnowledge) {
  assert.ok(!stageIndexes.has(stage.stageIndex), `duplicate stage index ${stage.stageIndex}`);
  stageIndexes.add(stage.stageIndex);
  assert.ok(stage.stageIndex >= 0 && stage.stageIndex <= 5, `stage index out of range: ${stage.stageIndex}`);
  assert.ok(stage.pointIds.length > 0, `stage ${stage.stageTitle} has no knowledge points`);
  for (const id of stage.pointIds) {
    assert.ok(getKnowledgePoint(id), `stage ${stage.stageTitle} references unknown point ${id}`);
  }
  assert.ok(maturityIds.has(stage.maturity), `stage ${stage.stageTitle} has unknown maturity ${stage.maturity}`);
  assert.ok(stage.checkQuestion.trim(), `stage ${stage.stageTitle} has no check question`);
  assert.ok(stage.boundary.trim(), `stage ${stage.stageTitle} has no boundary note`);
}
console.log('✓ Stage knowledge map references only real points and valid maturity levels');

// 4. All six journey stages are covered, in order.
for (let i = 0; i <= 5; i += 1) {
  assert.ok(stageKnowledgeByIndex[i], `journey stage ${i} has no knowledge mapping`);
}
console.log('✓ All six journey stages are mapped');

// 5. Stage titles must match OntologyJourney's stages array (drift guard).
const journeySource = readFileSync(new URL('../src/components/OntologyJourney.tsx', import.meta.url), 'utf8');
for (const stage of stageKnowledge) {
  assert.ok(
    journeySource.includes(`title: '${stage.stageTitle}'`),
    `stage map title "${stage.stageTitle}" no longer exists in OntologyJourney.tsx`,
  );
}
console.log('✓ Stage titles still match OntologyJourney.tsx');

// 6. Every knowledge point must be reachable from at least one stage or be a governance point.
const linked = new Set(stageKnowledge.flatMap(s => s.pointIds));
const unreachable = knowledgePoints.filter(p => !linked.has(p.id) && p.group !== 'governance');
assert.equal(
  unreachable.length, 0,
  `non-governance points with no demo stage: ${unreachable.map(p => p.id).join(', ')}`,
);
console.log('✓ Every non-governance knowledge point is reachable from a demo stage');
