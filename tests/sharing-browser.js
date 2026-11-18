import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {exportLeads} from '../src/csv.js';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const records=[{id:'PRIVATE-ID',company:'PRIVATE-COMPANY',audience:'Safety',channel:'Referral',message:'Trial',date:'2026-11-17',stage:2,owner:'Laura',nextAction:'Call buyer',feedback:null,concerns:'PRIVATE-NOTES'}];
  const planner={goals:{inquiries:7,samples:4,feedback:2},campaigns:[{id:'C1',name:'PRIVATE-CAMPAIGN',channel:'Referral',spendCents:12000}]};
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173');
  await page.evaluate(({csv,planner})=>localStorage.setItem('btl-import',JSON.stringify({csv,origin:'personal',actions:{},planner})),{csv:exportLeads(records,{spreadsheetSafe:false}),planner});
  await page.reload();
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  const reportDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download report',exact:true}).click();
  const html=await fs.readFile(await (await reportDownload).path(),'utf8');
  assert.ok(!html.includes('PRIVATE-COMPANY') && !html.includes('PRIVATE-NOTES') && !html.includes('PRIVATE-CAMPAIGN'));
  const backupDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download complete backup',exact:true}).click();
  const json=await fs.readFile(await (await backupDownload).path(),'utf8'),backup=JSON.parse(json);
  assert.equal(backup.planner.goals.inquiries,7);assert.ok(backup.csv.includes('PRIVATE-NOTES'));
  await page.getByRole('button',{name:'Close sharing',exact:true}).click();
  await page.getByRole('button',{name:'Edit goals',exact:true}).click();
  await page.locator('#goals-dialog').getByLabel('Buyer conversations',{exact:true}).fill('99');
  await page.getByRole('button',{name:'Save goals',exact:true}).click();
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  await page.locator('#backup-file').setInputFiles({name:'copy.json',mimeType:'application/json',buffer:Buffer.from(json)});
  await expect(page.locator('#restore-preview')).toContainText('1 leads, 1 campaigns');
  await expect(page.locator('#goal-progress')).toContainText('1 / 99');
  await page.evaluate(()=>{window.savedStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='btl-import')throw new Error('Storage blocked');return window.savedStorageSet.call(this,key,value);};});
  await page.getByRole('button',{name:'Replace local work',exact:true}).click();
  await expect(page.locator('#restore-error')).toContainText('Storage blocked');
  await expect(page.locator('#goal-progress')).toContainText('1 / 99');
  await page.evaluate(()=>{Storage.prototype.setItem=window.savedStorageSet;});
  await page.getByRole('button',{name:'Replace local work',exact:true}).click();
  await expect(page.locator('#goal-progress')).toContainText('1 / 7');
  await page.reload();await expect(page.locator('#goal-progress')).toContainText('1 / 7');
  // All external authentication and database requests below are intercepted.
  const copies=[];let uploadsAvailable=true,otpRequests=0;
  const user={id:'11111111-1111-4111-8111-111111111111',email:'laura@example.test'};
  await page.route('https://test-project.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
    const fulfill=value=>route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(value)});
    if(url.pathname==='/auth/v1/otp'){otpRequests++;assert.equal(request.postDataJSON().create_user,false);return fulfill({});}
    if(url.pathname==='/auth/v1/verify')return fulfill({access_token:'mock-access',refresh_token:'mock-refresh',expires_in:3600,user});
    if(url.pathname==='/auth/v1/user')return fulfill(user);
    if(url.pathname==='/auth/v1/logout')return fulfill({});
    if(url.pathname==='/rest/v1/dashboard_backups'){
      assert.equal(request.headers().authorization,'Bearer mock-access');
      if(request.method()==='POST'){
        if(!uploadsAvailable)return route.abort('failed');
        const body=request.postDataJSON();assert.equal(body.user_id,user.id);copies.push({...body,created_at:new Date().toISOString()});return route.fulfill({status:201,headers,body:''});
      }
      if(url.searchParams.get('select')==='snapshot')return fulfill(copies.filter(c=>`eq.${c.id}`===url.searchParams.get('id')).map(c=>({snapshot:c.snapshot})));
      return fulfill(copies.map(c=>({id:c.id,created_at:c.created_at})).reverse());
    }
    throw new Error('Unexpected cloud request '+url.pathname);
  });
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  await page.locator('#cloud-setup summary').click();
  await page.getByLabel('Supabase project URL',{exact:true}).fill('https://test-project.supabase.co');
  await page.getByLabel('Publishable or anon key',{exact:true}).fill('sb_publishable_mock_public_key_for_tests');
  await page.getByRole('button',{name:'Save connection',exact:true}).click();
  await page.getByLabel('Laura’s sign-in email',{exact:true}).fill(user.email);
  await page.getByRole('button',{name:'Send sign-in code',exact:true}).click();
  await expect(page.locator('#cloud-status')).toContainText('Code requested');
  assert.equal(otpRequests,1);
  await page.getByLabel('Email sign-in code',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.locator('#cloud-account')).toContainText(user.email);
  assert.equal(copies.length,0);
  await page.getByRole('button',{name:'Back up now',exact:true}).click();
  await expect(page.locator('#cloud-status')).toContainText('Complete cloud copy saved');
  assert.equal(copies.length,1);assert.equal(copies[0].snapshot.planner.goals.inquiries,7);
  assert.ok(!JSON.stringify(copies[0].snapshot).includes('mock-access'));
  await page.getByLabel('Automatically back up saved changes',{exact:true}).check();
  await expect.poll(()=>copies.length,{timeout:10000}).toBe(2);
  uploadsAvailable=false;
  await page.getByRole('button',{name:'Close sharing',exact:true}).click();
  await page.getByRole('button',{name:'Edit goals',exact:true}).click();
  await page.locator('#goals-dialog').getByLabel('Buyer conversations',{exact:true}).fill('13');
  await page.getByRole('button',{name:'Save goals',exact:true}).click();
  await expect(page.locator('#cloud-status')).toContainText('Cloud connection unavailable',{timeout:10000});
  await expect.poll(()=>page.evaluate(()=>Boolean(localStorage.getItem('btl-cloud-pending')))).toBe(true);
  uploadsAvailable=true;await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect(page.locator('#cloud-banner')).toContainText('Cloud copy saved',{timeout:10000});
  assert.equal(copies.at(-1).snapshot.planner.goals.inquiries,13);
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  await page.getByLabel('Automatically back up saved changes',{exact:true}).uncheck();
  await page.getByRole('button',{name:'Refresh cloud copies',exact:true}).click();
  await page.getByRole('button',{name:'Review restore',exact:true}).last().click();
  await page.getByRole('button',{name:'Replace local work',exact:true}).click();
  await expect(page.locator('#goal-progress')).toContainText('1 / 7');
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Share & backup',exact:true}).click();
  await expect(page.locator('#cloud-account')).toContainText(user.email);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('btl-cloud-session')),null);
  await expect(page.locator('#cloud-status')).toContainText('Signed out');
  await expect(page.locator('#goal-progress')).toContainText('1 / 7');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/laura-sharing-mobile.png',fullPage:false});
  assert.deepEqual(errors,[]);
  console.log('Sharing checks passed: private-field exclusion, complete backup and restore, sign-in, verified owner uploads, opt-in automatic backups, failed upload retry, cloud restore, sign-out, and mobile. Cloud requests were mocked; no live email was sent.');
}finally{await browser.close();}
