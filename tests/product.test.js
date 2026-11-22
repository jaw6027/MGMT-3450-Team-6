import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject,demoProject,validateProject,saveRecord,compareBasis,filteredTests} from '../product-development/src/model.js';

test('product demo is valid and completed entries are not automatically approved',()=>{
  const demo=demoProject();assert.equal(demo.materials.length,3);assert.equal(demo.tests[0].outcome,'Not assessed');
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(demo))),demo);
  assert.deepEqual(validateProject(emptyProject()),emptyProject());
});
test('requires completed-test context, explicit criteria, and legitimate record relationships',()=>{
  const demo=demoProject(),bad=structuredClone(demo);bad.tests[0].method='';
  assert.throws(()=>validateProject(bad),/Completed tests need/);
  bad.tests[0]={...demo.tests[0],outcome:'Meets recorded criterion'};
  assert.throws(()=>validateProject(bad),/explicit recorded criterion/);
  bad.tests[0]={...demo.tests[0],targetId:'nonexistent'};
  assert.throws(()=>validateProject(bad),/existing material or prototype/);
  bad.tests[0]={...demo.tests[0],evidence:'Independent lab report',sourceRef:''};
  assert.throws(()=>validateProject(bad),/report ID/);
  bad.tests[0]={...demo.tests[0],sampleSize:1.5};
  assert.throws(()=>validateProject(bad),/whole number/);
  bad.tests[0]={...demo.tests[0],date:'2026-02-30'};
  assert.throws(()=>validateProject(bad),/valid YYYY/);
  bad.tests[0]={...demo.tests[0],result:-20,unit:'°C'};
  assert.equal(validateProject(bad).tests[0].result,-20);
});
test('environmental figures require sources and basis; comparison warns about mixed units and missing data',()=>{
  const demo=demoProject();
  const candidate={...demo.materials[0],energy:12};
  assert.throws(()=>saveRecord(demo,'materials',candidate),/measurement basis/);
  candidate.basis='per m²';
  const next=saveRecord(demo,'materials',candidate);
  assert.equal(next.materials.length,3);assert.equal(next.materials[0].energy,12);
  const other={...next.materials[1],costUnit:'USD / sample',energy:24,basis:'per sheet'};
  assert.match(compareBasis([candidate,other],'cost'),/units differ/);
  assert.match(compareBasis([candidate,other],'energy'),/bases differ/);
  assert.match(compareBasis(demo.materials.slice(0,2),'carbon'),/not recorded/);
  assert.equal(demo.materials[0].energy,null);
});
test('report files round-trip in full backups, while executable or mismatched file types are rejected',()=>{
  const demo=demoProject(),file={name:'test.pdf',type:'application/pdf',data:Buffer.from('%PDF-1.4\n%%EOF').toString('base64')};
  demo.tests[0].file=file;
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(demo))).tests[0].file,file);
  demo.tests[0].file={...file,type:'text/html'};assert.throws(()=>validateProject(demo),/Attach a PDF/);
  demo.tests[0].file={...file,data:Buffer.from('<script>alert(1)</script>').toString('base64')};assert.throws(()=>validateProject(demo),/do not match/);
});
test('filters apply across evidence type, status, and target; marketing backups cannot be restored as product data',()=>{
  const demo=demoProject();
  assert.equal(filteredTests(demo,{query:'Work glove A',status:'Complete',evidence:'Internal test'}).length,1);
  assert.equal(filteredTests(demo,{evidence:'Buyer feedback'}).length,0);
  assert.throws(()=>validateProject({version:1,csv:'marketing rows',planner:{}}),/product-development backup/);
  demo.prototypes[0].materialId='missing';assert.throws(()=>validateProject(demo),/existing material/);
});
