import {chromium,expect} from '@playwright/test';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await b.newPage({viewport:{width:1440,height:1100}});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VENTURE_TEST_URL||'http://127.0.0.1:5176/');await expect(page.locator('h1')).toContainText('work-glove');await expect(page.locator('.status-note')).toContainText('testing pending');
 await expect(page.locator('#draft-review')).toBeHidden();await expect(page.locator('.buyer-needs')).not.toHaveAttribute('open','');
 await page.getByRole('link',{name:'Let’s talk',exact:false}).click();await expect(page.locator('#contact')).toBeVisible();
 await page.getByLabel('Your name',{exact:false}).fill('Buyer <img src=x onerror=alert(1)>');await page.getByLabel('Company',{exact:false}).fill('Kern example team');await page.getByLabel('Work email',{exact:false}).fill('buyer@example.com');await page.getByLabel('Conversation topic',{exact:true}).selectOption('Sample discussion');
 await page.locator('.buyer-needs summary').click();await page.getByLabel('Your role',{exact:true}).fill('Safety manager');await page.getByLabel('Purchasing timeline',{exact:true}).fill('Exploring options');await page.getByLabel('Tasks, sizes, required tests, or questions',{exact:true}).fill('Discuss required abrasion evidence and XL sizes.');
 await page.getByRole('button',{name:'Prepare my message',exact:false}).click();await expect(page.locator('#draft-review')).toBeVisible();await expect(page.locator('#draft-text')).toHaveValue(/Buyer <img src=x onerror=alert\(1\)>/);await expect(page.locator('#draft-review img')).toHaveCount(0);
 const href=await page.locator('#email-draft').getAttribute('href');expect(href).toMatch(/^mailto:carrillojerez5043@yahoo.com\?/);const draft=new URL(href);expect(draft.searchParams.get('body')).toContain('Discuss required abrasion evidence');await expect(page.locator('#draft-status')).toContainText('Nothing has been sent');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Clipboard unavailable for test');}}}));await page.getByRole('button',{name:'Copy message',exact:true}).click();await expect(page.locator('#draft-status')).toContainText('Select Copy');
 expect(await page.evaluate(()=>localStorage.length)).toBe(0);
 for(const summary of await page.locator('.faq-list summary').all()){await summary.click();await expect(summary.locator('..')).toHaveAttribute('open','');}
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/laura-customer-website-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/laura-customer-website-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);console.log('Customer website passed: responsive navigation, truthful product context, buyer questionnaire, encoded draft review, no automatic send or storage, clipboard fallback, FAQ, escaped input, and mobile. No email was sent.');
}finally{await b.close();}
