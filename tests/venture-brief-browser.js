import fs from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const p=await b.newPage({viewport:{width:1440,height:1100}});p.setDefaultTimeout(10000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.VENTURE_TEST_URL||'http://127.0.0.1:5176/');
 await expect(p.locator('#laura')).toContainText('Laura Carrillo');await expect(p.locator('#next-steps .buyer-steps li')).toHaveCount(3);await expect(p.locator('#next-steps')).toContainText('not an order');await expect(p.locator('.art-caption')).toContainText('CONCEPT ILLUSTRATION');
 const trigger=p.locator('#laura .brief-open');await trigger.click();await expect(p.locator('#brief-dialog')).toBeVisible();await expect(p.locator('#brief-dialog')).toContainText('Finished-glove performance testing is pending');
 const href=await p.locator('#download-brief').getAttribute('href');expect(href).toMatch(/^data:application\/pdf;base64,/);const bytes=Buffer.from(href.split(',')[1],'base64');expect(bytes.subarray(0,5).toString()).toBe('%PDF-');expect(bytes.equals(await fs.readFile('venture/assets/Beyond-Traditional-Leather-Product-Brief.pdf'))).toBe(true);
 const event=p.waitForEvent('download');await p.locator('#download-brief').click();expect((await event).suggestedFilename()).toBe('Beyond-Traditional-Leather-Product-Brief.pdf');await p.keyboard.press('Escape');await expect(p.locator('#brief-dialog')).toBeHidden();await expect(trigger).toBeFocused();
 await p.setViewportSize({width:390,height:844});await p.locator('#next-steps .brief-open').click();await expect(p.locator('#brief-dialog')).toBeVisible();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await p.locator('#back-to-website').click();expect(errors).toEqual([]);
 console.log('Customer website additions passed: founder context, buyer next steps, readable brief, embedded PDF download, keyboard close/focus return, and mobile.');
}finally{await b.close();}
