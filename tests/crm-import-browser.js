import {chromium,expect} from '@playwright/test';
import {exportLeads} from '../src/csv.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.CRM_TEST_URL||'http://127.0.0.1:5175/');
 const csv=exportLeads([{id:'M1',company:'Kern example buyer',audience:'Procurement',channel:'Direct outreach',message:'Trial',date:'2026-11-21',stage:2,owner:'Laura',nextAction:'Call buyer',dueDate:'2026-11-22',feedback:null}]);
 await page.evaluate(()=>{localStorage.setItem('btl-import','MARKETING');localStorage.setItem('laura-product-development-v1','PRODUCT');});
 const upload=()=>page.locator('#marketing-file').setInputFiles({name:'marketing.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await upload();await expect(page.locator('#import-summary')).toContainText('1 new accounts');await expect(page.locator('#rows tr')).toHaveCount(6);await page.locator('#import-dialog [data-close]').click();await expect(page.locator('#rows tr')).toHaveCount(6);
 await upload();await page.locator('#confirm-import').click();await expect(page.locator('#rows tr')).toHaveCount(1);await expect(page.locator('#rows')).toContainText('Kern example buyer');
 await upload();await expect(page.locator('#import-summary')).toContainText('0 new accounts');await expect(page.locator('#confirm-import')).toBeDisabled();await page.locator('#import-dialog [data-close]').click();
 await page.locator('#rows [data-open]').click();await page.locator('.optional-details summary').click();
 await page.getByLabel('Location / service area',{exact:true}).fill('Kern County');await page.getByLabel('Phone',{exact:true}).fill('661-555-0100');await page.getByLabel('Sample / glove version',{exact:true}).fill('V2');await page.getByLabel('Estimated glove pairs',{exact:true}).fill('100');await page.getByLabel('Purchasing timeline / conditions',{exact:true}).fill('After sample feedback');await page.locator('#save').click();
 await page.reload();await page.locator('#search').fill('Kern County');await expect(page.locator('#rows tr')).toHaveCount(1);
 const dl=page.waitForEvent('download');await page.locator('#share-report').click();const stream=await(await dl).createReadStream();let report='';for await(const chunk of stream)report+=chunk.toString();expect(report).not.toContain('Kern example buyer');expect(report).not.toContain('661-555-0100');expect(report).toContain('USER-ENTERED CRM DATA');
 expect(await page.evaluate(()=>localStorage.getItem('btl-import'))).toBe('MARKETING');expect(await page.evaluate(()=>localStorage.getItem('laura-product-development-v1'))).toBe('PRODUCT');
 // Changes in another tab cannot be silently overwritten.
 await page.evaluate(()=>{const key='laura-ppe-crm-v1',v=JSON.parse(localStorage.getItem(key));v.accounts[0].notes='Changed elsewhere';localStorage.setItem(key,JSON.stringify(v));});await page.locator('#rows [data-open]').click();await page.getByLabel('Company *',{exact:true}).fill('Must not overwrite');await page.locator('#save').click();await expect(page.locator('#form-error')).toContainText('another tab');await page.getByRole('button',{name:'Close account'}).click();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 console.log('CRM marketing import passed: preview/cancel, additive accounts, duplicate prevention, optional details, location search, private report, cross-tab protection, and mobile.');
}finally{await browser.close();}
