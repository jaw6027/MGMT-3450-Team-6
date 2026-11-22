import test from 'node:test';
import assert from 'node:assert/strict';
import {demoAccounts,validateAccount,backup,validateBackup,exportCSV,selectAccounts,attentionReasons,relationshipsNeedingAttention} from '../customer-relationships/src/model.js';
const account=()=>validateAccount({...demoAccounts[0],companyType:'Drilling contractor',sample:'Sent',sampleVersion:'Cactus V2',sampleSent:'2026-11-10',feedbackDue:'2026-11-20',awaitingSince:'2026-11-15',requirements:{testing:{status:'To confirm',details:'Abrasion evidence requested'}}});
test('buying requirements and sample tracking survive backups, CSV, and company filters',()=>{
 const a=account();assert.deepEqual(validateBackup(backup([a])),[a]);assert.match(exportCSV([a]),/Abrasion evidence/);assert.match(exportCSV([a]),/2026-11-20/);
 assert.deepEqual(selectAccounts([a],{companyType:'Drilling contractor'}),[a]);assert.equal(selectAccounts([a],{companyType:'PPE distributor'}).length,0);
 const legacy={...demoAccounts[0]};for(const key of ['companyType','requirements','sampleSent','feedbackDue','feedbackReceived','sampleResponse','awaitingSince'])delete legacy[key];
 assert.equal(validateAccount(legacy).requirements.vendor.status,'Not discussed');
 assert.throws(()=>validateAccount({...a,requirements:{testing:{status:'Certified',details:''}}}),/requirement status/);
 assert.throws(()=>validateAccount({...a,feedbackDue:'2026-11-01'}),/earlier/);
 assert.throws(()=>validateAccount({...a,sampleSent:''}),/sent date/);
 assert.throws(()=>validateAccount({...a,sample:'Requested'}),/Choose Sent/);
});
test('attention reasons use explicit dates and clear sample/reply concerns without duplicating accounts',()=>{
 const a=account(),date='2026-11-22';assert.equal(attentionReasons(a,date).length,3);assert.equal(relationshipsNeedingAttention([a],date).length,1);
 assert.equal(attentionReasons({...a,followUp:'',feedbackDue:'',awaitingSince:'2026-11-16'},date).length,0);
 const responded=validateAccount({...a,followUp:'2026-11-24',awaitingSince:'',sample:'Feedback received',feedbackReceived:'2026-11-21',sampleResponse:'Please improve the fit'});assert.deepEqual(attentionReasons(responded,date),[]);
 assert.deepEqual(attentionReasons({...a,stage:'Not a fit'},date),[]);assert.deepEqual(attentionReasons({...a,stage:'Customer'},date),[]);
 assert.deepEqual(attentionReasons({...a,followUp:'',feedbackDue:'2026-11-22',awaitingSince:''},date).map(r=>r.text),['Sample feedback due today']);
});
