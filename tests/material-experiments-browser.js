import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {demoProject,storageKey} from '../product-development/src/model.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PRODUCT_TEST_URL || 'http://127.0.0.1:4190/docs/product-development/');
 const p=demoProject();p.materials[0].name='Cactus as supplied';p.tests.push({...p.tests[0],id:'baseline-test',name:'Baseline tear',targetKind:'material',targetId:p.materials[0].id,result:12,unit:'N',category:'Tear resistance'});
 await page.evaluate(({p,key})=>localStorage.setItem(key,JSON.stringify(p)),{p,key:storageKey});await page.reload();
 await page.getByRole('button',{name:'+ Add combination',exact:true}).click();
 await expect(page.getByLabel('Baseline material (optional)',{exact:true})).toHaveValue(p.materials[0].id);
 await page.getByLabel('Material name',{exact:true}).fill('Cactus + PVC + cotton');
 await page.getByLabel('What changed from baseline',{exact:true}).fill('Added PVC coat and cotton backing');
 await page.getByLabel('PVC amount / coating (include units or confirmed none)',{exact:true}).fill('10 g/m²');
 await page.getByLabel('Backing type / layers',{exact:true}).fill('Woven cotton');
 await page.locator('#material-more-details > summary').click();
 await page.getByLabel('Preparation / bonding method',{exact:true}).fill('Adhesive protocol A');
 await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page.locator('#record-dialog')).not.toBeVisible();
 await page.getByRole('checkbox',{name:'Compare Cactus + PVC + cotton',exact:true}).check();
 await expect(page.locator('#comparison')).toContainText('Woven cotton');await expect(page.locator('#experiment-results')).toContainText('12 N');
 await page.getByRole('button',{name:'+ Record test',exact:true}).click();
 await page.getByLabel('Test name',{exact:true}).fill('Modified tear trial');
 await page.getByLabel('Test target',{exact:true}).selectOption({label:'Material · Cactus + PVC + cotton'});
 await page.getByLabel('Test category',{exact:true}).selectOption('Tear resistance');
 await page.getByLabel('Test status',{exact:true}).selectOption('Complete');
 await page.getByLabel('Test / planned date',{exact:true}).fill('2026-11-21');
 for(const [label,val] of [['Method / standard and version','Internal tear protocol v1'],['Test conditions','Dry, room temperature'],['Tester / lab name','Laura'],['Sample size','3'],['Numeric result','18'],['Result unit','N']])await page.getByLabel(label,{exact:true}).fill(val);
 await page.getByRole('button',{name:'Save record',exact:true}).click();await expect(page.locator('#record-dialog')).not.toBeVisible();
 await expect(page.locator('#experiment-results')).toContainText('18 N');await expect(page.locator('#experiment-results')).toContainText('12 N');
 await expect(page.locator('#experiment-results')).not.toContainText('Flexibility exploration');
 await page.reload();await page.locator('#comparison-details > summary').click();
 // New samples persist without replacing the baseline or its tests.
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey);assert.equal(saved.materials.find(m=>m.name==='Cactus + PVC + cotton').pvcContent,'10 g/m²');assert.equal(saved.tests.find(t=>t.id==='baseline-test').result,12);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Material experiment checks passed: baseline linkage, independent combinations, PVC/backing/preparation, original and modified results, persistence, prototype isolation, and mobile.');
}finally{await browser.close();}
