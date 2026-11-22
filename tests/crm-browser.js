import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const url=process.env.CRM_TEST_URL||'http://127.0.0.1:5175/';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await expect(page.locator('h1')).toHaveText('Customer relationships.');
 await expect(page.locator('#rows tr')).toHaveCount(6);
 await page.getByRole('button',{name:'Open Canyon Field Services'}).click();
 await expect(page.locator('#save')).toBeHidden();await expect(page.locator('[name=company]')).toBeDisabled();
 await expect(page.locator('#history')).toContainText('Fictional discovery call');await page.getByRole('button',{name:'Close account'}).click();
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/laura-crm-desktop.png',fullPage:true});
 await page.locator('#search').fill('Canyon');await expect(page.locator('#rows tr')).toHaveCount(1);
 let download=page.waitForEvent('download');await page.locator('#csv').click();const csv=await (await download).createReadStream();let content='';for await(const chunk of csv)content+=chunk.toString();expect(content).toContain('Canyon Field Services');expect(content).not.toContain('Mesa Energy');
 await page.locator('#clear').click();await page.locator('#due').selectOption('overdue');await expect(page.locator('#rows tr')).toHaveCount(1);await page.locator('#clear').click();
 await page.getByRole('button',{name:'My customers',exact:true}).click();await expect(page.locator('#rows')).toContainText('Your customer workspace is ready');
 await page.evaluate(()=>{localStorage.setItem('btl-import','marketing-sentinel');localStorage.setItem('laura-product-development-v1','product-sentinel');});
 await page.locator('#demo').click();await page.locator('#add').click();await page.locator('[name=company]').fill('Laura test buyer <img src=x onerror=alert(1)>');await page.locator('[name=contact]').fill('Buyer One');
 await page.locator('[name=email]').fill('buyer@example.com');await page.locator('[name=nextAction]').fill('Arrange discovery call');await page.locator('[name=followUp]').fill('2026-11-20');await page.locator('[name=need]').fill('Request evidence for intended glove use');await page.locator('#save').click();
 await expect(page.locator('#rows tr')).toHaveCount(1);await expect(page.locator('#rows')).toContainText('<img');await expect(page.locator('#rows img')).toHaveCount(0);
 await page.reload();await expect(page.locator('#personal')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#rows')).toContainText('Buyer One');
 await page.locator('#rows [data-open]').click();await page.locator('[name=stage]').selectOption('Sample evaluation');await page.locator('[name=sample]').selectOption('Sent');await page.locator('#save').click();
 await expect(page.locator('#metrics')).toContainText('Samples in progress');await page.locator('#rows [data-open]').click();await page.locator('#activity-form [name=note]').fill('Discussed fit and next sample feedback date.');await page.locator('#activity-form button').click();await expect(page.locator('#history')).toContainText('Discussed fit');await page.getByRole('button',{name:'Close account'}).click();
 download=page.waitForEvent('download');await page.locator('#backup').click();const saved=await (await download).path();
 await page.locator('#restore-file').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from('{"app":"wrong","version":1,"accounts":[]}')});await expect(page.locator('#status')).toContainText('Restore was not applied');await expect(page.locator('#rows tr')).toHaveCount(1);
 await page.locator('#restore-file').setInputFiles(saved);await expect(page.locator('#restore-summary')).toContainText('1 personal CRM accounts');await page.locator('#restore-dialog [data-close]').click();await expect(page.locator('#rows tr')).toHaveCount(1);
 await page.locator('#restore-file').setInputFiles(saved);await page.locator('#confirm-restore').click();await expect(page.locator('#status')).toContainText('restored');
 await page.locator('#rows [data-open]').click();await expect(page.locator('#history')).toContainText('Discussed fit');await page.getByRole('button',{name:'Close account'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('btl-import'))).toBe('marketing-sentinel');expect(await page.evaluate(()=>localStorage.getItem('laura-product-development-v1'))).toBe('product-sentinel');
 // Refused storage writes must leave the saved account and visible state untouched.
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Storage full for test');};});
 await page.locator('#rows [data-open]').click();await page.locator('[name=company]').fill('Unsaved replacement');await page.locator('#save').click();await expect(page.locator('#form-error')).toContainText('Storage full');await page.getByRole('button',{name:'Close account'}).click();await expect(page.locator('#rows')).not.toContainText('Unsaved replacement');
 await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);
 await page.locator('#demo').click();await page.evaluate(()=>scrollTo(0,0));await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/laura-crm-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#add').click();await expect(page.locator('#save')).toBeVisible();await page.keyboard.press('Escape');
 expect(errors).toEqual([]);
 console.log('CRM browser checks passed: demo isolation, search, due filters, CSV, new accounts, editing, persisted conversations, escaped content, backup restore confirmation, rejected storage writes, app-storage isolation, and mobile layout.');
}finally{await browser.close();}
