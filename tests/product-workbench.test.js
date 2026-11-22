import test from 'node:test';
import assert from 'node:assert/strict';
import {demoProject,validateProject,saveRecord,inventoryStatus,scheduledTests,developmentCosts} from '../product-development/src/model.js';
import {productSnapshot,validateProductSnapshot,productReport} from '../product-development/src/reports.js';
import {CloudClient} from '../src/cloud-client.js';

const png={name:'stitch.png',type:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5zsAAAAASUVORK5CYII='};
test('inventory treats missing values as unknown and compares thresholds only in each material’s unit',()=>{
  const p=demoProject(),m={...p.materials[0],quantity:2,quantityUnit:'sheets',reorderAt:3,location:'Sample cabinet'};
  assert.equal(inventoryStatus(m),'Reorder needed');
  assert.equal(inventoryStatus({...m,quantity:null}),'Quantity not recorded');
  assert.equal(inventoryStatus({...m,reorderAt:null}),'Reorder level not set');
  assert.equal(saveRecord(p,'materials',m).materials[0].location,'Sample cabinet');
  assert.throws(()=>saveRecord(p,'materials',{...m,quantityUnit:''}),/inventory unit/);
});
test('retesting links preserve original results, require a reason, and reject cycles or earlier dates',()=>{
  const p=demoProject(),original=p.tests[0];
  const retest={...original,id:'retest-1',name:'Retest',date:'2026-11-21',result:4,retestOf:original.id,changeMade:'Revised the backing construction'};
  const next=saveRecord(p,'tests',retest);assert.equal(next.tests.length,3);assert.equal(next.tests.find(t=>t.id===original.id).result,3.5);
  assert.throws(()=>saveRecord(p,'tests',{...retest,changeMade:''}),/Describe/);
  assert.throws(()=>saveRecord(p,'tests',{...retest,retestOf:'missing'}),/different, completed/);
  assert.throws(()=>saveRecord(p,'tests',{...retest,date:'2026-11-01'}),/earlier/);
  const cyclic=structuredClone(next);cyclic.tests.find(t=>t.id==='retest-1').date=original.date;cyclic.tests.find(t=>t.id===original.id).retestOf='retest-1';cyclic.tests.find(t=>t.id===original.id).changeMade='Other change';
  assert.throws(()=>validateProject(cyclic),/cycle/);
});
test('plans exclude completed results and distinguish overdue, today, upcoming, and unscheduled',()=>{
  const p=demoProject(),template=p.tests[1];p.tests=[{...template,id:'late',dueDate:'2026-11-20'},{...template,id:'now',dueDate:'2026-11-21'},{...template,id:'soon',dueDate:'2026-11-23'},{...template,id:'unset',dueDate:''},p.tests[0]];
  assert.deepEqual(scheduledTests(p,'2026-11-21').map(t=>t.schedule),['Overdue','Due today','Upcoming','Unscheduled']);
  assert.equal(validateProject({...p,tests:[{...template,date:'2026-11-19',dueDate:''}]}).tests[0].dueDate,'');
});
test('photos, costs, and inventory survive snapshots; costs count actual entries once',()=>{
  let p=demoProject();p.prototypes[0].photos=[{id:'photo-1',caption:'PRIVATE CAPTION',date:'2026-11-21',file:png}];
  p.materials[0].quantity=2;p.materials[0].quantityUnit='sheets';p.materials[0].location='PRIVATE LOCATION';
  p.expenses=[{id:'cost-1',name:'PRIVATE EXPENSE',notes:'Receipt note',category:'Lab testing',date:'2026-11-21',amountCents:25005,targetKind:'test',targetId:p.tests[0].id,sourceRef:'Receipt 1'}];
  const snapshot=productSnapshot(p),restored=validateProductSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(restored.project.prototypes[0].photos[0].file.data,png.data);
  assert.equal(developmentCosts(restored.project).totalCents,25005);
  assert.equal(developmentCosts(restored.project).categories.find(c=>c.category==='Lab testing').cents,25005);
  assert.equal(validateProductSnapshot(p).project.expenses[0].amountCents,25005);
  assert.throws(()=>validateProductSnapshot({...snapshot,version:2}),/version 1/);
  const bad=structuredClone(p);bad.prototypes[0].photos[0].file.type='text/html';assert.throws(()=>validateProject(bad),/PNG or JPEG/);
  const report=productReport(p);assert.ok(!report.includes('PRIVATE EXPENSE') && !report.includes('PRIVATE LOCATION') && !report.includes('PRIVATE CAPTION'));
  const detailed=productReport(p,{includeDetails:true});assert.ok(detailed.includes('PRIVATE EXPENSE') && detailed.includes('PRIVATE CAPTION'));
  assert.ok(detailed.includes('data:image/png;base64,'));assert.ok(!detailed.includes('<script'));
});
test('legacy product backups migrate without removing records; wrong expense targets and fractional cents are rejected',()=>{
  const p=demoProject();delete p.expenses;for(const material of p.materials){delete material.quantity;delete material.quantityUnit;delete material.reorderAt;delete material.location;}for(const proto of p.prototypes)delete proto.photos;for(const t of p.tests){delete t.dueDate;delete t.retestOf;delete t.changeMade;}
  const migrated=validateProductSnapshot(p).project;assert.equal(migrated.materials.length,3);assert.deepEqual(migrated.expenses,[]);assert.deepEqual(migrated.prototypes[0].photos,[]);
  const expense={id:'bad-cost',name:'Expense',category:'Materials',date:'2026-11-21',amountCents:1.5,targetKind:'project',targetId:'',notes:'',sourceRef:''};
  assert.throws(()=>saveRecord(migrated,'expenses',expense),/two decimal/);
  assert.throws(()=>saveRecord(migrated,'expenses',{...expense,amountCents:100,targetKind:'material',targetId:'missing'}),/existing record/);
});
test('product cloud client uses a separate owner-protected collection',async()=>{
  const urls=[];const client=new CloudClient({url:'https://test-project.supabase.co',key:'sb_publishable_mock_public_key_for_tests'},{table:'product_development_backups',fetcher:async url=>{urls.push(url);return new Response('[]');}});
  client.acceptSession({access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,user:{id:'owner'}});
  await client.history();assert.ok(urls[0].includes('/product_development_backups?'));assert.ok(!urls[0].includes('/dashboard_backups?'));
});
