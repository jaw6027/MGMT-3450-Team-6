import fs from 'node:fs/promises';
import {chromium} from '@playwright/test';
import {briefHTML} from '../venture/src/brief.js';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{const page=await browser.newPage();await page.setContent(briefHTML());await fs.mkdir('venture/assets',{recursive:true});await page.pdf({path:'venture/assets/Beyond-Traditional-Leather-Product-Brief.pdf',format:'Letter',printBackground:true,preferCSSPageSize:true});console.log('Product brief PDF regenerated from the website brief content.');}finally{await browser.close();}
