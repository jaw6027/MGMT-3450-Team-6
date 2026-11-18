import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,validateBackup,reportHTML} from '../src/backup.js';
import {CloudClient,validateCloudConfig} from '../src/cloud-client.js';

const records=[{id:'PRIVATE-ID',company:'PRIVATE-COMPANY',audience:'<b>Safety</b>',channel:'Referral',message:'Trial',date:'2026-11-17',stage:2,feedback:null,owner:'PRIVATE-OWNER',nextAction:'PRIVATE-ACTION',concerns:'PRIVATE-NOTES'}];
const planner={goals:{inquiries:20,samples:10,feedback:5},campaigns:[{id:'C1',name:'Private campaign',channel:'Email',spendCents:12300}]};
test('complete backup retains all lead details, goals, and costs; invalid copies are rejected',()=>{
  const copy=createBackup(records,planner);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(copy))),copy);
  assert.ok(copy.csv.includes('PRIVATE-NOTES'));
  assert.equal(copy.planner.campaigns[0].spendCents,12300);
  assert.throws(()=>validateBackup({...copy,version:2}),/version 1/);
  assert.throws(()=>validateBackup({...copy,planner:{goals:{},campaigns:[]}}),/Goals/);
});
test('share report excludes private lead fields and optional planning unless explicitly selected',()=>{
  const html=reportHTML({records,planner,filters:'All dates',demo:false});
  for(const text of ['PRIVATE-ID','PRIVATE-COMPANY','PRIVATE-OWNER','PRIVATE-ACTION','PRIVATE-NOTES','Private campaign'])assert.ok(!html.includes(text));
  assert.ok(html.includes('&lt;b&gt;Safety&lt;/b&gt;'));
  assert.ok(!html.includes('<script'));
  assert.ok(html.includes('READ-ONLY SNAPSHOT'));
  assert.ok(reportHTML({records,planner,filters:'All',demo:true,includePlanning:true}).includes('Private campaign'));
});
const config={url:'https://test-project.supabase.co',key:'sb_publishable_mock_public_key_for_tests'};
const jwt=role=>`header.${Buffer.from(JSON.stringify({role})).toString('base64url')}.signature`;
test('only HTTPS project URLs and public keys are accepted',()=>{
  assert.equal(validateCloudConfig(config).url,config.url);
  assert.equal(validateCloudConfig({...config,key:jwt('anon')}).key,jwt('anon'));
  assert.throws(()=>validateCloudConfig({...config,key:jwt('service_role')}),/Never enter/);
  assert.throws(()=>validateCloudConfig({...config,key:'sb_secret_not_allowed'}),/Never enter/);
  assert.throws(()=>validateCloudConfig({...config,url:'https://untrusted.example'}),/Supabase project/);
});
test('OTP never creates public accounts; backups require the same signed-in owner',async()=>{
  const calls=[];
  const client=new CloudClient(config,{fetcher:async(url,options)=>{calls.push({url,options});return new Response('',{status:200});}});
  await client.sendCode('laura@example.test');
  assert.equal(JSON.parse(calls[0].options.body).create_user,false);
  client.acceptSession({access_token:'test-access',refresh_token:'test-refresh',expires_at:Date.now()/1000+3600,user:{id:'owner-id'}});
  await assert.rejects(()=>client.saveBackup({id:'a',account:'another-account',snapshot:{}}),/different account/);
  assert.equal(calls.length,1);
  await client.saveBackup({id:'backup-id',account:client.accountKey(),snapshot:createBackup(records,planner)});
  assert.equal(JSON.parse(calls[1].options.body).user_id,'owner-id');
  assert.equal(calls[1].options.headers.Authorization,'Bearer test-access');
  assert.ok(calls[1].options.headers.Prefer.includes('ignore-duplicates'));
});
test('expired sessions refresh before cloud operations and failed requests are never called successful',async()=>{
  const calls=[];
  const client=new CloudClient(config,{fetcher:async(url,options)=>{
    calls.push({url,options});
    if(url.includes('grant_type=refresh_token'))return new Response(JSON.stringify({access_token:'new-token',refresh_token:'new-refresh',expires_in:3600,user:{id:'owner-id'}}));
    return new Response('[]');
  }});
  client.acceptSession({access_token:'old-token',refresh_token:'old-refresh',expires_at:1,user:{id:'owner-id'}});
  await client.history();
  assert.ok(calls[0].url.includes('refresh_token'));
  assert.equal(calls[1].options.headers.Authorization,'Bearer new-token');
  client.fetcher=async()=>new Response('',{status:403});
  await assert.rejects(()=>client.history(),/access denied/);
});
