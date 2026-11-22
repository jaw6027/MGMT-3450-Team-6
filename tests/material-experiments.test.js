import test from 'node:test';
import assert from 'node:assert/strict';
import {demoProject,validateProject,materialExperimentTests} from '../product-development/src/model.js';
import {productSnapshot,validateProductSnapshot,productReport} from '../product-development/src/reports.js';
test('material combinations preserve configuration, originals, snapshots, and report context',()=>{
  const p=demoProject(),original=structuredClone(p.materials[0]);
  p.materials[1]={...p.materials[1],baseMaterialId:original.id,modification:'PVC coating added',pvcContent:'10 g/m²',backing:'Cotton woven',preparation:'Bonded at recorded temperature'};
  const restored=validateProductSnapshot(productSnapshot(p)).project;
  assert.deepEqual(restored.materials[0],original);assert.equal(restored.materials[1].backing,'Cotton woven');
  assert.match(productReport(restored),/10 g\/m²/);assert.match(productReport(restored),/Cotton woven/);
  p.materials[0].baseMaterialId=p.materials[1].id;p.materials[0].modification='Cycle';assert.throws(()=>validateProject(p),/circular/);
  p.materials[0].baseMaterialId='missing';assert.throws(()=>validateProject(p),/existing baseline/);
});
test('experiment comparison preserves repeated trials and excludes prototype results and other samples',()=>{
  const p=demoProject();const trial={...p.tests[0],targetKind:'material',targetId:p.materials[0].id};
  p.tests.push({...trial,id:'trial-one'},{...trial,id:'trial-two',result:1});
  const records=materialExperimentTests(validateProject(p),[p.materials[0].id]);
  assert.equal(records.length,2);assert.deepEqual(new Set(records.map(t=>t.result)),new Set([3.5,1]));
  p.materials[1].baseMaterialId=p.materials[0].id;assert.throws(()=>validateProject(p),/Describe what changed/);
});
