import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './style.css';
import { leads, channels, audiences, stages, messages, filterLeads, summarize, csvCell } from './data.js';

const icons = {
  leaf: '<path d="M20 4C10 2 3 7 5 15c7 5 15 0 15-11Z"/><path d="M4 21 16 9M10 15v-5m0 5h5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
  chat: '<path d="M21 12a9 9 0 0 1-9 9H3l1-6a9 9 0 1 1 17-3Z"/><path d="M8 9h8m-8 5h5"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  box: '<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7 5l10 4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filters = { period: '30', channel: 'All channels', audience: 'All audiences' };
let overrides = {};
let storageAvailable = true;
try { overrides = JSON.parse(localStorage.getItem('btl-actions') || '{}'); } catch { storageAvailable = false; }
if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) overrides = {};
const options = (items) => items.map(x => `<option>${escape(x)}</option>`).join('');

document.querySelector('#app').innerHTML = `
<aside class="sidebar">
  <a class="brand" href="#overview"><span class="brand-mark">${icon('leaf')}</span><span>BEYOND<span class="brand-sub">TRADITIONAL LEATHER</span></span></a>
  <div class="workspace"><span class="workspace-mark">6</span><span>Innovation project<small>MGMT 3450 · Team 6</small></span></div>
  <div class="nav-label">WORKSPACE</div>
  <nav aria-label="Dashboard sections">
    <a class="active" href="#overview">${icon('grid')} Overview</a>
    <a href="#journey">${icon('chart')} Customer journey</a>
    <a href="#research">${icon('chat')} Message & feedback</a>
    <a href="#follow-up">${icon('people')} Lead follow-up <span class="nav-count">48</span></a>
    <a href="#product">${icon('leaf')} Product context</a>
  </nav>
  <div class="sidebar-note">${icon('leaf')}<h3>A better material.<br>A meaningful beginning.</h3><p>Turning industry conversations into the next generation of PPE.</p><span>EARLY-STAGE INNOVATION</span></div>
  <div class="team"><span class="avatar">T6</span><div>Team 6<small>Class project workspace</small></div><span class="online" title="Local demonstration"></span></div>
</aside>
<div class="main-shell">
  <header class="topbar"><span>Workspace <span class="slash">/</span> <strong>Marketing overview</strong></span><span class="demo-pill"><span></span> Demo workspace</span></header>
  <main id="overview">
    <div class="page-heading"><div><div class="eyebrow">GROWING INTEREST. GATHERING INSIGHT.</div><h1>Marketing overview<span>.</span></h1><p>From first conversation to first sample. See what’s taking root.</p></div><button class="button" id="export">${icon('download')} Export leads</button></div>
    <section class="hero" id="product" aria-label="Product introduction"><div class="hero-content"><span class="light-pill">PLANT-BASED INNOVATION <span>${icon('arrow')}</span></span><h2>Beyond traditional leather.<br>Built for what comes next.</h2><p>Exploring plant-based work gloves for the oil & gas industry.<br>Our first goal: understand buyer needs and invite sample feedback.</p><a href="#follow-up">Explore the sample pipeline <span>→</span></a></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><svg viewBox="0 0 240 240"><path d="M188 33C85 16 39 72 62 150c77 43 147-18 126-117Z"/><path d="M39 217 160 67m-69 87-5-54m5 54 54-8m-27-27-2-36m2 36 36-6"/></svg><span>MATERIALS WITH POSSIBILITY</span></div><span class="development">Concept in development · Performance testing pending</span></section>
    <div class="filter-row"><div class="filter-group"><label>Period<select id="period"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="all">All demo dates</option></select></label><label>Channel<select id="channel">${options(['All channels', ...channels])}</select></label><label>Buyer audience<select id="audience">${options(['All audiences', ...audiences])}</select></label></div><span class="snapshot">Fixed demo snapshot · Nov 17, 2026</span></div>
    <div class="data-note">${icon('box')}<span><strong>Illustrative data, real project direction.</strong> All organizations, leads, ratings, and outcomes below are simulated for this class project.</span></div>
    <section class="metrics" aria-label="Headline metrics" id="metrics" aria-live="polite"></section>
    <div class="section-heading" id="journey"><h2>How interest becomes insight</h2><span>Acquisition → evaluation → learning</span></div>
    <div class="chart-grid"><section class="card"><div class="card-heading"><div><h3>Customer journey</h3><p>Cumulative stages reached by filtered leads</p></div><span class="subtle-tag">FUNNEL</span></div><div id="funnel"></div><p class="card-footnote">Later stages are included in every earlier stage.</p></section><section class="card"><div class="card-heading"><div><h3>Where conversations begin</h3><p>Inquiries by first-touch channel</p></div>${icon('people')}</div><div id="channels"></div><div class="chart-legend"><i></i> Inquiry count <span>One source per lead</span></div></section></div>
    <div class="section-heading" id="research"><h2>Listen. Learn. Refine.</h2><span>Find the message. Improve the experience.</span></div>
    <div class="chart-grid"><section class="card"><div class="card-heading"><div><h3>Which message sparks interest?</h3><p>Sample requests ÷ inquiries exposed to each message</p></div>${icon('chat')}</div><div id="messages"></div><p class="card-footnote">Directional comparison; demo groups are not a controlled experiment.</p></section><section class="card feedback-card"><div class="card-heading"><div><h3>Sample trial feedback</h3><p>Illustrative buyer ratings · 1–5 scale</p></div><span class="subtle-tag" id="responses"></span></div><div id="feedback"></div><p class="card-footnote">Buyer feedback is not certified safety or performance testing.</p></section></div>
    <section class="card lead-card" id="follow-up"><div class="card-heading"><div><h3>Keep the conversation moving</h3><p>Lead follow-up · fictional organizations · click a lead to update its next action</p></div><label class="search-label"><span class="sr-only">Search companies</span><input id="search" type="search" placeholder="Search companies…" /></label></div><div class="table-wrap"><table><thead><tr><th>Company / buyer</th><th>Channel</th><th>Stage</th><th>Owner</th><th>Next action</th><th><span class="sr-only">Edit lead</span></th></tr></thead><tbody id="lead-rows"></tbody></table></div><div class="table-bottom"><span id="row-count"></span><span>Edits stay in this browser · CSV export includes all filtered leads</span></div></section>
    <section class="context-note"><span class="context-icon">${icon('leaf')}</span><div><h3>Build the story on evidence.</h3><p>The supplied brochure describes an early-stage plant-based PPE concept and supplier-reported material comparisons. Their measurement basis and applicability to finished gloves need confirmation. Certification scope and finished-glove safety performance are not established here.</p></div><span>PROJECT CONTEXT</span></section>
    <footer><span>BEYOND TRADITIONAL LEATHER <b> / </b> Team 6</span><span>Small steps. Better materials. Useful insight.</span></footer>
  </main>
</div>
<dialog id="edit-dialog"><form id="edit-form"><div class="dialog-heading"><div><div class="eyebrow">LEAD FOLLOW-UP</div><h2 id="edit-company"></h2></div><button type="button" id="close-dialog" aria-label="Close dialog">×</button></div><p class="dialog-note">Updates are stored locally on this device. Export to share them.</p><input type="hidden" id="edit-id"><label>Team owner<input id="edit-owner" required maxlength="80"></label><label>Next action<textarea id="edit-action" required maxlength="240" rows="3"></textarea></label><p id="save-error" role="alert"></p><div class="dialog-buttons"><button type="button" class="button" id="cancel-dialog">Cancel</button><button type="submit" class="button primary">Save follow-up</button></div></form></dialog>
<div id="toast" role="status"></div>`;

function currentRecords() { return filterLeads(leads, filters).map(l => ({ ...l, ...(overrides[l.id] || {}) })); }
function render() {
  const records = currentRecords();
  const s = summarize(records);
  const cards = [ ['Total inquiries', s.total, 'First conversations', 'people'], ['Qualified leads', s.qualified, 'Buyer fit established', 'check'], ['Sample requests', s.samples, 'Interest in a sample', 'box'], ['Trial feedback', s.feedback, 'Responses collected', 'chat'], ['Sample conversion', `${s.conversion.toFixed(1)}%`, 'Requests ÷ qualified leads', 'chart'] ];
  document.querySelector('#metrics').innerHTML = cards.map(([label,value,note,glyph], i) => `<article class="metric ${i === 2 ? 'featured' : ''}"><div><span>${label}</span>${icon(glyph)}</div><strong>${value}</strong><small>${note}</small></article>`).join('');
  document.querySelector('#funnel').innerHTML = [s.total,s.qualified,s.samples,s.trials,s.feedback].map((n,i)=>`<div class="funnel-row"><span class="stage-index">0${i+1}</span><div class="funnel-body"><div><span>${['Inquiry','Qualified','Sample requested','In trial','Feedback received'][i]}</span><strong>${n}</strong></div><div class="track"><span style="width:${s.total ? n/s.total*100 : 0}%;background:${['#184833','#426647','#738348','#9aa34e','#bcc590'][i]}"></span></div></div></div>`).join('');
  document.querySelector('#channels').innerHTML = channels.map((channel,i) => { const n = records.filter(l=>l.channel===channel).length; return `<div class="channel-row"><div><span class="channel-dot dot-${i}"></span><span>${channel}</span><strong>${n}</strong></div><div class="track"><span style="width:${s.total ? n/s.total*100 : 0}%;background:${['#24523d','#869843','#465c6e','#bdc69b'][i]}"></span></div></div>`; }).join('');
  document.querySelector('#messages').innerHTML = messages.map((message,i)=> { const group = records.filter(l=>l.message===message); const n=group.filter(l=>l.stage>=2).length; return `<div class="message-row"><span class="message-index">${String.fromCharCode(65+i)}</span><div><div class="message-title"><strong>${message}</strong><b>${group.length ? (n/group.length*100).toFixed(0) : '0'}%</b></div><p>${n} sample requests / ${group.length} inquiries</p><div class="track"><span style="width:${group.length ? n/group.length*100 : 0}%"></span></div></div></div>`; }).join('');
  const feedback = records.filter(l=>l.feedback);
  document.querySelector('#responses').textContent = `${feedback.length} responses`;
  document.querySelector('#feedback').innerHTML = feedback.length ? ['comfort','grip','durability'].map(key=> { const avg=feedback.reduce((sum,l)=>sum+l.feedback[key],0)/feedback.length; return `<div class="rating-row"><span>${key[0].toUpperCase()+key.slice(1)}</span><div class="rating-track"><span style="width:${avg/5*100}%"></span></div><strong>${avg.toFixed(1)}<small> / 5</small></strong></div>`; }).join('') + `<div class="feedback-insight">${icon('chat')}<p><strong>Next research question</strong>How does the material feel during a full shift? Collect context with each rating.</p></div>` : '<div class="empty-state">No feedback in this selection.<br>Try a broader date range or audience.</div>';
  renderTable(records);
}
function renderTable(records = currentRecords()) {
  const query = document.querySelector('#search').value.toLowerCase().trim();
  const found = records.filter(l=>l.company.toLowerCase().includes(query));
  document.querySelector('#lead-rows').innerHTML = found.slice(0,8).map(l=>`<tr><td><strong>${escape(l.company)}</strong><small>${escape(l.audience)} · ${l.id}</small></td><td>${escape(l.channel)}</td><td><span class="stage stage-${l.stage}">${stages[l.stage]}</span></td><td><span class="owner-dot">${escape(l.owner.slice(0,1))}</span>${escape(l.owner)}</td><td class="action-cell">${escape(l.nextAction)}</td><td><button class="edit-button" data-id="${l.id}" aria-label="Edit ${escape(l.company)}">${icon('arrow')}</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">No matching leads. Try changing your filters or search.</td></tr>';
  document.querySelector('#row-count').textContent = `Showing ${Math.min(found.length,8)} of ${found.length} leads`;
}
for (const field of ['period','channel','audience']) document.querySelector(`#${field}`).addEventListener('change', e=>{filters[field]=e.target.value;render();});
document.querySelector('#search').addEventListener('input',()=>renderTable());
document.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('nav a.active')?.classList.remove('active');link.classList.add('active');}));
const dialog=document.querySelector('#edit-dialog');
document.querySelector('#lead-rows').addEventListener('click', e=>{
  const button=e.target.closest('[data-id]'); if(!button)return;
  const lead=currentRecords().find(l=>l.id===button.dataset.id);
  document.querySelector('#edit-company').textContent=lead.company;
  document.querySelector('#edit-id').value=lead.id;
  document.querySelector('#edit-owner').value=lead.owner;
  document.querySelector('#edit-action').value=lead.nextAction;
  document.querySelector('#save-error').textContent='';
  dialog.showModal();
});
for (const id of ['close-dialog','cancel-dialog']) document.querySelector(`#${id}`).addEventListener('click',()=>dialog.close());
document.querySelector('#edit-form').addEventListener('submit',e=>{
  e.preventDefault();
  const owner=document.querySelector('#edit-owner').value.trim(), nextAction=document.querySelector('#edit-action').value.trim();
  if(!owner || !nextAction) { document.querySelector('#save-error').textContent='Enter an owner and next action.'; return; }
  const next={...overrides,[document.querySelector('#edit-id').value]:{owner,nextAction}};
  try {localStorage.setItem('btl-actions',JSON.stringify(next));storageAvailable=true;} catch {storageAvailable=false;document.querySelector('#save-error').textContent='Browser storage is unavailable. Allow local storage to save updates.';return;}
  overrides=next;dialog.close();renderTable();toast('Follow-up saved on this device');
});
document.querySelector('#export').addEventListener('click',()=>{
  const headers=['Lead ID','Company','Buyer role','Channel','Campaign/message','Inquiry date','Current stage','Sample status','Feedback','Next action','Team owner'];
  const rows=currentRecords().map(l=>[l.id,l.company,l.audience,l.channel,l.message,l.date,stages[l.stage],l.stage>=2?'Requested':'Not requested',l.feedback?JSON.stringify(l.feedback):'',l.nextAction,l.owner]);
  const content=[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download='beyond-leather-demo-leads.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`Exported ${rows.length} filtered demo leads`);
});
let toastTimer;
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
render();
if(!storageAvailable) toast('Local storage is unavailable. Viewing and exporting still work.');
