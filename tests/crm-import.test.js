import test from 'node:test';
import assert from 'node:assert/strict';
import {planMarketingImport,validateAccount,demoAccounts,backup,validateBackup,selectAccounts,exportCSV,progressReport} from '../customer-relationships/src/model.js';
import {exportLeads} from '../src/csv.js';
const lead={id:'M1',company:'Kern example buyer',audience:'Safety & HSE',channel:'Direct outreach',message:'Trial & performance',date:'2026-11-21',stage:4,owner:'Laura',nextAction:'Discuss glove trial',feedback:{grip:4},dueDate:'2026-11-23'};
test('marketing import is additive, repeatable, and does not invent buying commitments or locations',()=>{
 const csv=exportLeads([lead]),plan=planMarketingImport([],csv),a=plan.additions[0];
 assert.equal(a.sourceLeadId,'M1');assert.equal(a.role,'Safety / HSE');assert.equal(a.stage,'Sample evaluation');assert.equal(a.sample,'Feedback received');assert.equal(a.location,'');assert.equal(a.quantity,null);assert.equal(a.followUp,'2026-11-23');assert.match(a.notes,/Recorded ratings/);
 const copy=structuredClone(a);const repeated=planMarketingImport([a],csv);assert.equal(repeated.additions.length,0);assert.equal(repeated.skipped,1);assert.deepEqual(copy,a);
 assert.throws(()=>planMarketingImport([], 'Company\nWrong file'),/Missing columns/);
 assert.throws(()=>planMarketingImport(Array.from({length:1000},()=>a),exportLeads([{...lead,id:'NEW'}])),/1,000/);
});
test('CRM optional details survive backups and CSV, are searchable, and stay out of shared reports',()=>{
 const a=validateAccount({...demoAccounts[0],phone:'661-555-0100',location:'Kern County',quantity:120,sampleVersion:'Glove V2',purchasePlan:'Review after trial',sourceLeadId:'M1'});
 assert.deepEqual(validateBackup(backup([a])),[a]);assert.equal(selectAccounts([a],{search:'Kern County'}).length,1);assert.match(exportCSV([a]),/Glove V2/);
 for(const quantity of [-1,2.5,NaN])assert.throws(()=>validateAccount({...a,quantity}),/whole number/);
 const report=progressReport([a],'2026-11-22',true);assert.match(report,/FICTIONAL DEMO/);for(const privateText of [a.company,a.phone,a.email,a.location,a.sampleVersion].filter(Boolean))assert.ok(!report.includes(privateText));
});
