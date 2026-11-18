import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDetails, dueFollowUps, todayPacific, sampleStatus, validatePlanner, campaignPerformance, parseDollars} from '../src/personal-data.js';
import {importLeads,exportLeads} from '../src/csv.js';

test('personal lead fields and notes survive CSV export and reimport',()=>{
  const lead={id:'L1',company:'Example',audience:'Procurement',channel:'Referral',message:'Trial',date:'2026-11-01',stage:4,owner:'Laura',nextAction:'Call',feedback:{comfort:4},dueDate:'2026-11-18',followUpDone:true,sampleRequested:'2026-11-02',sampleSent:'2026-11-03',sampleReceived:'2026-11-04',sampleEvaluated:'2026-11-05',comfortNotes:'Soft, flexible',priceNotes:'Asked for volume pricing',concerns:'Needs field evaluation',campaignId:'C1'};
  assert.deepEqual(importLeads(exportLeads([lead]))[0],lead);
  assert.equal(sampleStatus(lead),'Evaluated');
  assert.equal(sampleStatus({stage:2}),'Requested · dates missing');
  const literal={...lead,priceNotes:'= buyer asked about pricing'};
  assert.equal(importLeads(exportLeads([literal],{spreadsheetSafe:false}))[0].priceNotes,literal.priceNotes);
  assert.ok(exportLeads([literal]).includes("'= buyer asked"));
});
test('rejects impossible milestone sequences and dates instead of inventing dates',()=>{
  const lead={date:'2026-11-01',stage:2};
  assert.throws(()=>validateDetails({...lead,sampleSent:'2026-11-02'}),/Sample requested date/);
  assert.throws(()=>validateDetails({...lead,sampleRequested:'2026-11-03',sampleSent:'2026-11-02'}),/chronological/);
  assert.throws(()=>validateDetails({...lead,dueDate:'2026-02-30'}),/valid/);
  assert.throws(()=>validateDetails({...lead,sampleRequested:'2026-10-01'}),/earlier/);
  assert.throws(()=>validateDetails({...lead,stage:0,sampleRequested:'2026-11-02'}),/Choose Sample requested/);
});
test('reminders include overdue and seven-day horizon but exclude completed items',()=>{
  const records=[{id:'overdue',dueDate:'2026-11-16'},{id:'today',dueDate:'2026-11-17'},{id:'soon',dueDate:'2026-11-24'},{id:'later',dueDate:'2026-11-25'},{id:'done',dueDate:'2026-11-15',followUpDone:true}];
  assert.deepEqual(dueFollowUps(records,'2026-11-17').map(l=>l.id),['overdue','today','soon']);
  assert.equal(todayPacific(new Date('2026-11-18T03:00:00Z')),'2026-11-17');
});
test('campaign cost counts spending once and includes only directly assigned sample requests',()=>{
  const campaigns=[{id:'C1',name:'Outreach',channel:'Email',spendCents:10000},{id:'C2',name:'Event',channel:'Events',spendCents:20000}];
  const result=campaignPerformance(campaigns,[{campaignId:'C1',stage:2},{campaignId:'C1',stage:4},{campaignId:'C1',stage:1},{campaignId:'unknown',stage:3}]);
  assert.equal(result[0].costPerSample,50);
  assert.equal(result[0].spendCents,10000);
  assert.equal(result[0].inquiries,3);
  assert.equal(result[1].costPerSample,null);
  assert.equal(parseDollars('25.05'),2505);
  assert.throws(()=>parseDollars('-1'),/USD/);
  assert.throws(()=>parseDollars('10.005'),/decimal/);
  assert.throws(()=>validatePlanner({goals:{inquiries:0,samples:10,feedback:5},campaigns}),/Goals/);
});
