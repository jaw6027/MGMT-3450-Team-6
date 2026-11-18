import { exportLeads, importLeads } from './csv.js';
import { validatePlanner } from './personal-data.js';
import { summarize, interestLeaders } from './data.js';

const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createBackup(records, planner) {
  return validateBackup({version:1,createdAt:new Date().toISOString(),csv:exportLeads(records,{spreadsheetSafe:false}),planner});
}
export function validateBackup(value) {
  if(!value || value.version!==1 || typeof value.csv!=='string' || typeof value.createdAt!=='string' || !Number.isFinite(Date.parse(value.createdAt)))throw new Error('Choose a complete dashboard backup (version 1).');
  if(new TextEncoder().encode(JSON.stringify(value)).length>12*1024*1024)throw new Error('Backup must be smaller than 12 MB.');
  const records=importLeads(value.csv),planner=validatePlanner(value.planner);
  return {version:1,createdAt:new Date(value.createdAt).toISOString(),csv:exportLeads(records,{spreadsheetSafe:false}),planner};
}
export function reportHTML({records,planner,filters,demo,includePlanning=false}) {
  const s=summarize(records);
  const leaders=[['audience','Audience'],['message','Message'],['channel','Marketing channel']].map(([field,label])=>{
    const result=interestLeaders(records,field);
    const description=!records.length?'No matching leads':!result.max?'No sample requests yet':`${result.leaders.map(l=>l.label).join(' · ')} — ${result.max} sample request${result.max===1?'':'s'}${result.leaders.length>1?' each (tied)':''}`;
    return `<tr><th>${label}</th><td>${esc(description)}</td></tr>`;
  }).join('');
  const planning=includePlanning?`<h2>Personal planning — all active leads</h2><p>Goals and spending below use all active leads, independently of the report filters.</p><p>Goals: ${planner.goals.inquiries} buyer conversations; ${planner.goals.samples} sample requests; ${planner.goals.feedback} feedback responses.</p><table><thead><tr><th>Campaign</th><th>Channel</th><th>Total spent (USD)</th></tr></thead><tbody>${planner.campaigns.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.channel)}</td><td>$${(c.spendCents/100).toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="3">No campaign spending recorded</td></tr>'}</tbody></table>`:'';
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Laura’s marketing progress report</title><style>body{font:16px/1.7 system-ui,sans-serif;background:#f6f8f1;color:#29402e;max-width:900px;margin:40px auto;padding:24px}h1{font-size:32px;line-height:1.3}h2{font-size:20px;margin-top:30px}table{width:100%;border-collapse:collapse;background:white;overflow-wrap:anywhere}td,th{text-align:left;border:1px solid #dce4d4;padding:12px}small{color:#64765b}.badge{display:inline-block;background:#e4ecd8;padding:5px 12px;border-radius:20px}p{overflow-wrap:anywhere}@media print{body{background:white;margin:0}}</style></head><body><span class="badge">${demo?'SIMULATED DEMO DATA':'USER-ENTERED DATA'} · READ-ONLY SNAPSHOT</span><h1>Beyond Traditional Leather</h1><p>Laura’s plant-based work glove marketing progress</p><p>${esc(filters)}</p><small>Created ${esc(new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'}))} (Los Angeles). This file does not update automatically.</small><h2>Marketing progress</h2><table><tbody>${[['Inquiries',s.total],['Qualified leads',s.qualified],['Sample requests',s.samples],['Feedback responses',s.feedback],['Sample conversion',`${s.conversion.toFixed(1)}%`]].map(([label,count])=>`<tr><th>${label}</th><td>${count}</td></tr>`).join('')}</tbody></table><p>Sample conversion = sample requests ÷ qualified leads. Stages are cumulative.</p><h2>What’s getting the most interest?</h2><table><tbody>${leaders}</tbody></table><p>Interest means reaching Sample requested or later. Ranking uses request counts, not proven effectiveness. Results reflect only the selected cohort.</p>${planning}<h2>About this report</h2><p>This report contains aggregate categories and results. Individual companies, contact owners, lead IDs, follow-up dates, and free-text buyer notes are excluded. Custom category names${includePlanning?' and campaign names and costs':''} are included; review before sharing.</p><p>The work glove concept is in development. Marketing results and buyer opinions do not establish certified glove safety or performance.</p></body></html>`;
}
