import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { csvCell } from '../src/data.js';
import { csvHeaders, importLeads } from '../src/csv.js';

const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Import CSV',exact:true}).click();
  const downloading=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download CSV template'}).click();
  const template=await fs.readFile(await (await downloading).path(),'utf8');
  assert.ok(template.includes('Company') && template.includes('Comfort'));
  const upload=async content=>page.locator('#csv-file').setInputFiles({name:'leads.csv',mimeType:'text/csv',buffer:Buffer.from(content)});
  await upload('Company\nIncomplete');
  await expect(page.locator('#import-error')).toContainText('Missing columns');
  await expect(page.locator('#confirm-import')).toBeDisabled();
  const rows=[
    ['REAL-1','Example, "Field Services"','HSE manager','Referral','New outreach','2024-02-29','Feedback received',4,'',3,'Call\nnext week','Laura'],
    ['REAL-2','Second buyer','Procurement','LinkedIn','Material footprint','2027-01-01','Sample requested','','','','Schedule preview','Team 6'],
    ['REAL-3','<img src=x onerror=alert(1)>','Operations','Referral','<b>New</b>','2026-12-31','Inquiry','','','','','Laura'],
  ];
  const csv=[csvHeaders,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
  await upload(csv);
  await expect(page.locator('#import-preview')).toContainText('Ready: 3 leads');
  // Preview must not modify the active data.
  await expect(page.locator('.metric strong').first()).toHaveText('48');
  await page.getByRole('button',{name:'Import records',exact:true}).click();
  await expect(page.locator('.metric strong').first()).toHaveText('3');
  await expect(page.locator('.demo-pill')).toContainText('Imported data');
  await expect(page.locator('#interest-source')).toHaveText('IMPORTED DATA');
  await expect(page.locator('[data-interest="audience"]')).toContainText('HSE manager · Procurement');
  await expect(page.locator('[data-interest="message"]')).toContainText('New outreach · Material footprint');
  await expect(page.locator('[data-interest="channel"]')).toContainText('Tied: 1 sample request each.');
  await expect(page.locator('#period')).toHaveValue('all');
  await expect(page.locator('#lead-rows')).toContainText('Example, "Field Services"');
  await expect(page.locator('#messages')).toContainText('<b>New</b>');
  assert.equal(await page.locator('#lead-rows img, #messages b b').count(),0);
  assert.ok(!(await page.locator('#feedback').innerText()).includes('NaN'));
  await page.locator('#channel').selectOption('Referral');
  await expect(page.locator('.metric strong').first()).toHaveText('2');
  await page.locator('#audience').selectOption('HSE manager');
  await expect(page.locator('.metric strong').first()).toHaveText('1');
  await expect(page.locator('[data-interest="audience"]')).toContainText('1 sample request from 1 inquiry (100%).');
  await page.locator('#audience').selectOption('Operations');
  await expect(page.locator('[data-interest="message"]')).toContainText('No sample requests yet');
  await page.locator('#channel').selectOption('LinkedIn');
  await expect(page.locator('[data-interest="channel"]')).toContainText('No matching leads');
  await page.locator('#channel').selectOption('Referral');
  await page.locator('#audience').selectOption('HSE manager');
  await page.getByRole('button',{name:/Edit Example/}).click();
  await page.getByLabel('Team owner').fill('Laura updated');
  await page.getByRole('button',{name:'Save follow-up'}).click();
  await page.reload();
  await expect(page.locator('.metric strong').first()).toHaveText('3');
  await page.locator('#period').selectOption('7');
  await expect(page.locator('[data-interest="audience"]')).toContainText('Procurement');
  await expect(page.locator('[data-interest="audience"]')).not.toContainText('HSE manager');
  await page.locator('#period').selectOption('all');
  await expect(page.locator('#lead-rows')).toContainText('Laura updated');
  const exporting=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export leads'}).click();
  const exported=await fs.readFile(await (await exporting).path(),'utf8');
  assert.equal(importLeads(exported).length,3);
  assert.ok(exported.includes('Laura updated'));
  await page.getByRole('button',{name:'Import CSV',exact:true}).click();
  await upload('Company\nIncomplete');
  await expect(page.locator('#import-error')).toContainText('Missing columns');
  await page.getByRole('button',{name:'Close import',exact:true}).click();
  await expect(page.locator('.metric strong').first()).toHaveText('3');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Import CSV',exact:true}).click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await expect(page.locator('#import-title')).toBeVisible();
  await page.screenshot({path:'/tmp/beyond-import-mobile.png',fullPage:true});
  // A storage write failure must leave existing records and edits intact.
  await upload(csv);
  await expect(page.locator('#confirm-import')).toBeEnabled();
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('Quota exceeded');};});
  await page.getByRole('button',{name:'Import records',exact:true}).click();
  await expect(page.locator('#import-error')).toContainText('No records were replaced');
  await page.reload();
  await expect(page.locator('#lead-rows')).toContainText('Laura updated');
  await page.getByRole('button',{name:'Import CSV',exact:true}).click();
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Use demo data',exact:true}).click();
  await expect(page.locator('.metric strong').first()).toHaveText('48');
  await expect(page.locator('.demo-pill')).toContainText('Demo workspace');
  await expect(page.locator('#interest-source')).toHaveText('DEMO DATA');
  assert.deepEqual(errors,[]);
  console.log('CSV browser checks passed: template, validation, preview, import, custom filters, dates, partial ratings, safe text, saved edits, reload, export, storage failure, mobile, and demo restore.');
} finally {await browser.close();}
