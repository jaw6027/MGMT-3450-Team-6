import test from 'node:test';
import assert from 'node:assert/strict';
import {demoAccounts,validateAccount,validateBackup,backup,selectAccounts,summarize,exportCSV} from '../customer-relationships/src/model.js';
test('CRM backup preserves relationships and conversations independently from other apps',()=>{
 assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(backup(demoAccounts)))),demoAccounts);
 assert.throws(()=>validateBackup({app:'laura-product-development',version:1,accounts:[]}));
 assert.throws(()=>validateBackup(backup([demoAccounts[0],demoAccounts[0]])),/Duplicate/);
 assert.throws(()=>validateAccount({...demoAccounts[0],followUp:'2026-02-30'}));
 assert.throws(()=>validateAccount({...demoAccounts[0],company:'  '}));
 assert.throws(()=>validateAccount({...demoAccounts[0],nextAction:''}),/next action/);
 assert.throws(()=>validateAccount({...demoAccounts[0],email:'invalid'}));
 assert.throws(()=>validateAccount({...demoAccounts[0],activities:[{id:'1',date:'2026-02-30',type:'Call',note:'test'}]}));
});
test('CRM filters and due counts use open accounts and explicit calendar dates',()=>{
 const stats=summarize(demoAccounts,'2026-11-22');
 assert.deepEqual(stats,{total:6,open:5,due:2,samples:2,customers:0});
 assert.equal(selectAccounts(demoAccounts,{due:'today'},'2026-11-22').length,2);
 assert.deepEqual(selectAccounts(demoAccounts,{search:'canyon',stage:'Sample evaluation',segment:'Industrial contractor'}),[demoAccounts[0]]);
 const closed={...demoAccounts[0],stage:'Customer'};
 assert.equal(selectAccounts([closed],{due:'overdue'},'2026-11-22').length,0);
 assert.equal(summarize([closed],'2026-11-22').samples,0);
 assert.equal(selectAccounts(demoAccounts,{search:'no such company'}).length,0);
});
test('CRM CSV quotes fields and protects spreadsheet formula cells',()=>{
 const csv=exportCSV([{...demoAccounts[0],company:'=HYPERLINK("test")',notes:'one, two\nthree',email:'a@example.com'}]);
 assert.ok(csv.includes('"\'=HYPERLINK(""test"")"'));
 assert.ok(csv.includes('"one, two\nthree"'));
 assert.ok(!csv.includes('demo-call-1'));
});
