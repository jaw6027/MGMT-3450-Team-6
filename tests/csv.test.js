import test from 'node:test';
import assert from 'node:assert/strict';
import { importLeads, exportLeads, parseCSV, templateCSV } from '../src/csv.js';
import { leads, filterLeads } from '../src/data.js';

const header = 'Company,Buyer role,Channel,Inquiry date,Current stage';
test('imports BOM, CRLF, quoted commas, escaped quotes, multiline fields, custom categories, and optional defaults', () => {
  const data = importLeads('\uFEFF'+header+',Next action\r\n"Example, ""Energy""",HSE manager,Referral,2024-02-29,qualified,"Call\nnext week"\r\n');
  assert.equal(data.length,1);
  assert.equal(data[0].company,'Example, "Energy"');
  assert.equal(data[0].nextAction,'Call\nnext week');
  assert.equal(data[0].stage,1);
  assert.equal(data[0].owner,'Unassigned');
  assert.equal(data[0].message,'Unspecified');
  assert.equal(data[0].feedback,null);
});
test('exports can be reimported including ratings, IDs, and optional empty fields', () => {
  assert.deepEqual(importLeads(exportLeads(leads)),leads);
  const partial = importLeads(header+',Comfort,Grip,Durability\nExample,Procurement,Website,2025-01-02,Feedback received,4.5,,3')[0];
  assert.deepEqual(partial.feedback,{comfort:4.5,durability:3});
  assert.deepEqual(importLeads(exportLeads([partial]))[0],partial);
});
test('rejects invalid structure, empty files, missing fields, duplicate IDs, dates, stages, and ratings', () => {
  for (const value of ['',templateCSV(),'Company\nExample',header+'\nExample,,,,',header+'\nA,B,C,2026-02-30,Inquiry',header+'\nA,B,C,11/17/2026,Inquiry',header+'\nA,B,C,2026-11-17,Unknown',header+'\n"A,B,C,2026-11-17,Inquiry',header+'\nA,B,C,2026-11-17,Inquiry,extra',header+',Lead ID\nA,B,C,2026-11-17,Inquiry,1\nB,B,C,2026-11-17,Inquiry,1',header+',Comfort\nA,B,C,2026-11-17,Feedback received,6',header+',Comfort\nA,B,C,2026-11-17,Inquiry,4']) {
    assert.throws(()=>importLeads(value),Error);
  }
  assert.throws(()=>parseCSV('"Closed"junk'),/unexpected quote/);
  assert.throws(()=>importLeads(header+',company\nA,B,C,2026-11-17,Inquiry,D'),/unique/);
});
test('supports legacy exports with a JSON Feedback column', () => {
  const row=importLeads(header+',Feedback\nA,B,C,2026-11-17,Feedback received,"{""comfort"":4,""grip"":3,""durability"":5}"')[0];
  assert.deepEqual(row.feedback,{comfort:4,grip:3,durability:5});
});
test('date ranges use the imported cohort reference; all dates includes older records', () => {
  const rows=importLeads(header+'\nA,B,C,2024-01-01,Inquiry\nD,B,C,2027-01-01,Qualified');
  const filters={period:'all',channel:'All channels',audience:'All audiences'};
  assert.equal(filterLeads(rows,filters,'2027-01-01').length,2);
  assert.equal(filterLeads(rows,{...filters,period:'7'},'2027-01-01').length,1);
});
