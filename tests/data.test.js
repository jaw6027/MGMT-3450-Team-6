import test from 'node:test';
import assert from 'node:assert/strict';
import { leads, filterLeads, summarize, csvCell } from '../src/data.js';

test('combined date, channel, and buyer filters select only matching leads', () => {
  const result = filterLeads(leads, {period:'7', channel:'LinkedIn', audience:'Procurement'});
  assert.ok(result.length > 0);
  assert.ok(result.every(l => l.date >= '2026-11-11' && l.date <= '2026-11-17' && l.channel === 'LinkedIn' && l.audience === 'Procurement'));
});
test('funnel counts are cumulative and conversion uses qualified leads', () => {
  assert.deepEqual(summarize([0,1,2,3,4].map(stage=>({stage}))), {total:5,qualified:4,samples:3,trials:2,feedback:1,conversion:75});
  assert.equal(summarize([]).conversion, 0);
});
test('CSV quotes commas and quotes and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('A, "B"'), '"A, ""B"""');
  assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
});
