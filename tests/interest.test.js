import test from 'node:test';
import assert from 'node:assert/strict';
import { interestLeaders, filterLeads } from '../src/data.js';

test('ranks by sample request volume, includes later stages once, and reports the inquiry denominator', () => {
  const records = [
    ...[2,3,4,0,1].map(stage=>({audience:'Safety',stage})),
    ...[2,4].map(stage=>({audience:'Procurement',stage})),
  ];
  assert.deepEqual(interestLeaders(records,'audience'), {max:3,leaders:[{label:'Safety',total:5,requests:3}]});
});
test('reports all ties and never picks a zero-interest winner', () => {
  assert.deepEqual(interestLeaders([{channel:'Event',stage:2},{channel:'Email',stage:4}],'channel'),{max:1,leaders:[{label:'Event',total:1,requests:1},{label:'Email',total:1,requests:1}]});
  assert.deepEqual(interestLeaders([{message:'No sample yet',stage:1}],'message'),{max:0,leaders:[]});
  assert.deepEqual(interestLeaders([],'audience'),{max:0,leaders:[]});
});
test('uses only the selected cohort and supports arbitrary imported group names', () => {
  const records=[{date:'2026-11-17',channel:'Referral',audience:'__proto__',message:'Field trial',stage:3},{date:'2026-11-17',channel:'Email',audience:'Safety',message:'Footprint',stage:4}];
  const selected=filterLeads(records,{period:'7',channel:'Referral',audience:'All audiences'});
  assert.equal(interestLeaders(selected,'audience').leaders[0].label,'__proto__');
  assert.equal(interestLeaders(selected,'message').leaders[0].label,'Field trial');
});
