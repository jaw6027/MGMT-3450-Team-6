import test from 'node:test';
import assert from 'node:assert/strict';
import {demoAccounts,validateAccount,backup,validateBackup,selectAccounts,exportCSV,progressReport,weeklyOutreach} from '../customer-relationships/src/model.js';
const person={id:'person-1',name:'Jordan Buyer',role:'Order approver',email:'buyer@example.com',phone:'661-555-0100'};
test('decision-makers and main concern survive saves and stay out of shared reports',()=>{
 const a=validateAccount({...demoAccounts[0],contacts:[person],concernType:'Testing evidence',concernStatus:'Open',concernNotes:'Needs an abrasion report',concernResponse:'Discuss the testing plan'});
 assert.deepEqual(validateBackup(backup([a])),[a]);assert.equal(selectAccounts([a],{search:'Jordan Buyer'}).length,1);assert.match(exportCSV([a]),/Jordan Buyer/);assert.match(exportCSV([a]),/Needs an abrasion report/);
 const report=progressReport([a],'2026-11-22');assert.ok(!report.includes(person.name));assert.ok(!report.includes(a.concernNotes));
 assert.throws(()=>validateAccount({...a,contacts:[person,person]}),/unique/);assert.throws(()=>validateAccount({...a,contacts:[{...person,name:''}]}),/contact name/);assert.throws(()=>validateAccount({...a,contacts:[{...person,email:'bad'}]}),/email/);assert.throws(()=>validateAccount({...a,concernType:'Not recorded'}),/Choose a main concern/);
 const legacy={...demoAccounts[0]};for(const key of ['contacts','concernType','concernStatus','concernNotes','concernResponse'])delete legacy[key];assert.deepEqual(validateAccount(legacy).contacts,[]);assert.equal(validateAccount(legacy).concernType,'Not recorded');
});
test('weekly outreach uses a seven-day window, overdue dates, stages and priorities without inventing deadlines',()=>{
 const a=validateAccount({...demoAccounts[0],stage:'Target identified',sample:'Requested',followUp:'2026-11-21',sampleSent:'',feedbackDue:''});
 const future={...a,id:'future',followUp:'2026-12-10'},closed={...a,id:'closed',stage:'Not a fit'},received={...a,id:'received',stage:'Sample evaluation',sample:'Feedback received',followUp:'2026-11-29'},sample={...a,id:'sample',stage:'Sample evaluation',sample:'Sent',followUp:'2026-11-23',feedbackDue:'2026-11-28'};
 const p=weeklyOutreach([future,closed,received,sample,a],'2026-11-22');assert.equal(p.through,'2026-11-28');assert.deepEqual(p.newContacts.map(a=>a.id),[a.id]);assert.deepEqual(p.followUps.map(a=>a.id),[a.id,sample.id]);assert.deepEqual(p.sampleDiscussions.map(a=>a.id),['sample',a.id]);assert.equal(a.followUp,'2026-11-21');
});
