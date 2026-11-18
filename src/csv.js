import { stages, csvCell } from './data.js';
import { detailColumns, validateDetails } from './personal-data.js';

export const csvHeaders = ['Lead ID', 'Company', 'Buyer role', 'Channel', 'Campaign/message', 'Inquiry date', 'Current stage', 'Comfort', 'Grip', 'Durability', 'Next action', 'Owner', ...detailColumns.map(([,label])=>label)];
const required = ['Company', 'Buyer role', 'Channel', 'Inquiry date', 'Current stage'];
export const MAX_ROWS = 5000;
export const MAX_BYTES = 5 * 1024 * 1024;

// RFC 4180-style comma-separated fields, including escaped quotes and newlines.
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, '');
  function pushRow() {
    row.push(field);
    if (row.some(cell => cell.trim())) rows.push(row);
    row = []; field = ''; closed = false;
    if (rows.length > MAX_ROWS + 1) throw new Error(`Use at most ${MAX_ROWS} lead rows per file.`);
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',') { row.push(field); field = ''; closed = false; }
    else if (c === '\n' || c === '\r') { pushRow(); if (c === '\r' && text[i + 1] === '\n') i++; }
    else if (c === '"' && !field && !closed) quoted = true;
    else if (c === '"' || closed) throw new Error('CSV has an unexpected quote or text after a closing quote. Save as CSV (comma delimited).');
    else field += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field. Check the file and try again.');
  pushRow();
  return rows;
}

export function importLeads(text) {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Choose a CSV file smaller than 5 MB.');
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('Add at least one lead below the header row.');
  const headers = rows[0].map(h => h.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error('Each column header must be unique.');
  const missing = required.filter(h => !headers.includes(h.toLowerCase()));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}. Download the template for the expected format.`);
  const ids = new Set();
  return rows.slice(1).map((row, index) => {
    const fail = message => { throw new Error(`Lead row ${index + 1}: ${message}`); };
    if (row.length !== headers.length) fail('column count does not match the header. Quote values containing commas.');
    const get = label => (row[headers.indexOf(label.toLowerCase())] || '').trim();
    for (const name of required) if (!get(name)) fail(`${name} is required.`);
    if (row.some(cell => cell.length > 2000)) fail('keep each field under 2,000 characters.');
    const id = get('Lead ID') || `LEAD-${String(index + 1).padStart(4, '0')}`;
    if (ids.has(id)) fail(`duplicate Lead ID "${id}". Give each conversation a unique ID.`);
    ids.add(id);
    const date = get('Inquiry date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) !== date) fail('Inquiry date must be a valid YYYY-MM-DD date (for example, 2026-11-17).');
    const stage = stages.findIndex(s => s.toLowerCase() === get('Current stage').toLowerCase());
    if (stage < 0) fail(`Current stage must be one of: ${stages.join(', ')}.`);
    let feedback = {};
    // Also accept the original dashboard export's JSON Feedback column.
    if (get('Feedback')) {
      try { feedback = JSON.parse(get('Feedback')); } catch { fail('Feedback must contain valid JSON, or use the Comfort, Grip, and Durability columns.'); }
      if (!feedback || typeof feedback !== 'object' || Array.isArray(feedback)) fail('Feedback must contain rating fields.');
    }
    const ratings = {};
    for (const label of ['Comfort', 'Grip', 'Durability']) {
      const key = label.toLowerCase(), raw = get(label) || feedback[key];
      if (raw !== undefined && raw !== null && raw !== '') {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 1 || n > 5 || typeof raw === 'boolean') fail(`${label} must be a number from 1 to 5, or blank.`);
        ratings[key] = n;
      }
    }
    if (Object.keys(ratings).length && stage !== 4) fail('ratings require the Feedback received stage. Leave ratings blank until feedback is collected.');
    const lead={ id, company:get('Company'), audience:get('Buyer role'), channel:get('Channel'), message:get('Campaign/message') || 'Unspecified', date, stage, owner:get('Owner') || get('Team owner') || 'Unassigned', nextAction:get('Next action'), feedback:Object.keys(ratings).length ? ratings : null };
    const details=Object.fromEntries(detailColumns.map(([key,label])=>[key,get(label)]));
    if(details.followUpDone) {
      if(!['yes','no','true','false'].includes(details.followUpDone.toLowerCase()))fail('Follow-up complete must be Yes, No, or blank.');
      details.followUpDone=['yes','true'].includes(details.followUpDone.toLowerCase());
    }
    try { return {...lead,...validateDetails({...lead,...details})}; } catch(error) { fail(error.message); }
  });
}

export function exportLeads(records, {spreadsheetSafe = true} = {}) {
  const rows = records.map(l => [l.id,l.company,l.audience,l.channel,l.message,l.date,stages[l.stage],l.feedback?.comfort ?? '',l.feedback?.grip ?? '',l.feedback?.durability ?? '',l.nextAction,l.owner,...detailColumns.map(([key])=>key==='followUpDone' ? l[key] ? 'Yes' : '' : l[key] ?? '')]);
  const quote=spreadsheetSafe ? csvCell : value=>`"${String(value ?? '').replaceAll('"','""')}"`;
  return [csvHeaders,...rows].map(row => row.map(quote).join(',')).join('\r\n');
}

export function templateCSV() { return csvHeaders.map(csvCell).join(',') + '\r\n'; }
