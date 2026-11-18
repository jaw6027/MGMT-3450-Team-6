import { stages, csvCell, summarize } from './data.js';
import { importLeads, exportLeads } from './csv.js';
import { defaultGoals, detailColumns, todayPacific, dueFollowUps, sampleStatus, validatePlanner, campaignPerformance, parseDollars } from './personal-data.js';

const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);

export function mountPersonalTools({getAll,isDemo,saveLead,refresh,notify,download,readPersonalPlanner,writePersonalPlanner}) {
  let planner={goals:{...defaultGoals},campaigns:[]}, plannerContext, plannerWarning='', showAllReminders=false;
  function loadPlanner() {
    const context=isDemo()?'demo':'real';if(context===plannerContext)return;
    plannerContext=context;plannerWarning='';
    try { planner=validatePlanner((context==='real' && readPersonalPlanner?.()) || JSON.parse(localStorage.getItem(`btl-planner-${context}`) || JSON.stringify({goals:defaultGoals,campaigns:[]}))); }
    catch {planner={goals:{...defaultGoals},campaigns:[]};plannerWarning='Saved goals or costs could not be read. Export your existing browser data before replacing them.';}
  }
  function savePlanner(next) {
    const valid=validatePlanner(next);
    try {if(plannerContext==='real' && writePersonalPlanner)writePersonalPlanner(valid);else localStorage.setItem(`btl-planner-${plannerContext}`,JSON.stringify(valid));}
    catch {throw new Error('Browser storage is unavailable or full. Your changes were not saved.');}
    planner=valid;plannerWarning='';
  }
  document.querySelector('#follow-up').insertAdjacentHTML('beforebegin',`
    <section id="laura-tools"><div class="section-heading"><h2>Laura’s workbench</h2><span>Personal planning · stored on this device</span></div>
    <p id="planner-mode" class="planner-caption"></p><p id="planner-warning" class="form-error" role="alert"></p>
    <div class="chart-grid"><section class="card"><div class="card-heading"><div><h3>Follow-ups to remember</h3><p id="reminder-date"></p></div><span class="subtle-tag">ON-DASHBOARD REMINDERS</span></div><div id="reminders"></div></section>
    <section class="card"><div class="card-heading"><div><h3>Progress toward your goals</h3><p>All active leads · independent of dashboard filters</p></div><button class="button" id="edit-goals">Edit goals</button></div><div id="goal-progress"></div><small class="planner-caption">Starter targets are editable. Demo and personal goals are saved separately.</small></section></div>
    <section class="card workbench-card"><div class="card-heading"><div><h3>Sample tracker</h3><p>Requested → sent → received → evaluated · all active leads</p></div><label><span class="sr-only">Search sample companies</span><input id="sample-search" type="search" placeholder="Search samples…"></label></div><div class="table-wrap"><table><thead><tr><th>Company</th><th>Requested</th><th>Sent</th><th>Received</th><th>Evaluated</th><th>Status</th><th>Update</th></tr></thead><tbody id="sample-rows"></tbody></table></div><p class="planner-caption" id="sample-count"></p></section>
    <section class="card workbench-card"><div class="card-heading"><div><h3>What buyers are saying</h3><p>Buyer comments about comfort, grip, durability, price, and purchasing concerns</p></div></div><div id="buyer-notes"></div></section>
    <section class="card workbench-card"><div class="card-heading"><div><h3>Campaign spending</h3><p>Actual total spend in USD · all dates and leads · independent of dashboard filters</p></div><div class="page-actions"><button class="button" id="export-costs">Export costs</button><button class="button" id="add-campaign">Add campaign</button></div></div><div class="table-wrap"><table><thead><tr><th>Campaign / channel</th><th>Total spent</th><th>Assigned inquiries</th><th>Sample requests</th><th>Cost / request</th><th>Edit</th></tr></thead><tbody id="campaign-rows"></tbody></table></div><p class="planner-caption" id="cost-basis"></p></section>
    </section>
    <dialog id="goals-dialog" aria-labelledby="goals-title"><form id="goals-form"><div class="dialog-heading"><h2 id="goals-title">Laura’s goals</h2><button type="button" data-close="goals-dialog" aria-label="Close goals">×</button></div><p class="dialog-note">Set personal targets for the full active lead list. These are goals, not forecasts.</p>${[['inquiries','Buyer conversations'],['samples','Sample requests'],['feedback','Feedback responses']].map(([key,label])=>`<label>${label}<input type="number" id="goal-${key}" min="1" max="1000000" step="1" required></label>`).join('')}<p class="form-error" id="goals-error" role="alert"></p><div class="dialog-buttons"><button class="button primary" type="submit">Save goals</button></div></form></dialog>
    <dialog id="campaign-dialog" aria-labelledby="campaign-title"><form id="campaign-form"><div class="dialog-heading"><h2 id="campaign-title">Campaign spending</h2><button type="button" data-close="campaign-dialog" aria-label="Close campaign">×</button></div><p class="dialog-note">Enter the campaign’s actual total spending, once. Update that total as costs change. Assign leads to the campaign in their lead details.</p><input type="hidden" id="campaign-id"><label>Campaign name<input id="campaign-name" required maxlength="200"></label><label>Marketing channel<input id="campaign-channel" required maxlength="200"></label><label>Total spent (USD)<input id="campaign-spend" inputmode="decimal" required placeholder="0.00"></label><p id="campaign-error" class="form-error" role="alert"></p><div class="dialog-buttons"><button class="button primary" type="submit">Save campaign</button></div></form></dialog>
  `);
  const dialog=document.querySelector('#edit-dialog');
  dialog.setAttribute('aria-labelledby','edit-company');
  dialog.querySelector('.dialog-note').textContent='Manage this buyer conversation, follow-up, sample milestones, and feedback. Changes save on this device; optional cloud copies follow your Share & backup settings.';
  document.querySelector('#edit-owner').closest('label').firstChild.textContent='Owner';
  document.querySelector('#edit-action').required=false;
  document.querySelector('#edit-form button[type=submit]').textContent='Save lead';
  document.querySelector('#edit-id').insertAdjacentHTML('afterend',`
    <p id="new-lead-note" class="import-help"></p>
    <div class="lead-form-grid">${[['company','Company','text'],['audience','Buyer role','text'],['channel','Marketing channel','text'],['message','Campaign/message','text'],['date','Inquiry date','date']].map(([key,label,type])=>`<label>${label}<input id="lead-${key}" type="${type}" ${key!=='message'?'required':''} maxlength="2000" list="suggest-${key}"></label>`).join('')}
    <label>Current stage<select id="lead-stage">${stages.map((s,i)=>`<option value="${i}">${s}</option>`).join('')}</select></label><label>Campaign for cost tracking<select id="lead-campaign"><option value="">No campaign assigned</option></select></label><label>Follow-up date<input id="lead-dueDate" type="date"></label></div>
    <label class="check-label"><input id="lead-followUpDone" type="checkbox"> Follow-up complete</label>
    <details class="lead-details" open><summary>Sample milestones</summary><div class="lead-form-grid">${detailColumns.filter(([key])=>key.startsWith('sample')).map(([key,label])=>`<label>${label}<input id="lead-${key}" type="date"></label>`).join('')}</div></details>
    <details class="lead-details"><summary>Trial ratings and buyer comments</summary><p class="planner-caption">Ratings use a 1–5 scale and require Feedback received. Leave unknown ratings blank. Comments are buyer opinions, not certified glove performance.</p><div class="lead-form-grid">${['comfort','grip','durability'].map(key=>`<label>${key[0].toUpperCase()+key.slice(1)} rating<input id="rating-${key}" type="number" min="1" max="5" step="any"></label>`).join('')}</div>${detailColumns.filter(([key])=>key.endsWith('Notes') || key==='concerns').map(([key,label])=>`<label>${label}<textarea id="lead-${key}" rows="2" maxlength="2000"></textarea></label>`).join('')}</details>
    ${['audience','channel','message'].map(field=>`<datalist id="suggest-${field}"></datalist>`).join('')}`);
  let editing=null;
  function openLead(lead=null) {
    loadPlanner();editing=lead;
    document.querySelector('#edit-form').reset();
    document.querySelector('#edit-company').textContent=lead ? lead.company : 'Add a buyer conversation';
    document.querySelector('#edit-id').value=lead?.id || '';
    document.querySelector('#edit-owner').value=lead?.owner || 'Laura';
    document.querySelector('#edit-action').value=lead?.nextAction || '';
    document.querySelector('#save-error').textContent='';
    document.querySelector('#new-lead-note').textContent=!lead && isDemo() ? 'You are viewing demo data. Saving starts your personal lead list with this conversation; demo records will not be copied.' : '';
    for(const key of ['company','audience','channel','message','date',...detailColumns.map(([key])=>key).filter(key=>!['campaignId','followUpDone'].includes(key))]) {
      document.querySelector(`#lead-${key}`).value=lead?.[key] || (key==='date'?todayPacific():'');
    }
    document.querySelector('#lead-followUpDone').checked=Boolean(lead?.followUpDone);
    document.querySelector('#lead-stage').value=lead?.stage ?? 0;
    const campaignSelect=document.querySelector('#lead-campaign');
    campaignSelect.innerHTML='<option value="">No campaign assigned</option>'+planner.campaigns.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    if(lead?.campaignId && !planner.campaigns.some(c=>c.id===lead.campaignId))campaignSelect.insertAdjacentHTML('beforeend',`<option value="${esc(lead.campaignId)}">Unknown campaign: ${esc(lead.campaignId)}</option>`);
    campaignSelect.value=lead?.campaignId || '';
    for(const key of ['comfort','grip','durability'])document.querySelector(`#rating-${key}`).value=lead?.feedback?.[key] ?? '';
    for(const key of ['audience','channel','message'])document.querySelector(`#suggest-${key}`).innerHTML=[...new Set(getAll().map(l=>l[key]))].map(value=>`<option value="${esc(value)}"></option>`).join('');
    dialog.showModal();
  }
  document.querySelector('#edit-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      const lead={id:editing?.id || `LEAD-${crypto.randomUUID()}`,owner:document.querySelector('#edit-owner').value.trim() || 'Laura',nextAction:document.querySelector('#edit-action').value.trim(),stage:Number(document.querySelector('#lead-stage').value),feedback:null};
      for(const key of ['company','audience','channel','message','date',...detailColumns.map(([key])=>key).filter(key=>!['campaignId','followUpDone'].includes(key))])lead[key]=document.querySelector(`#lead-${key}`).value.trim();
      lead.campaignId=document.querySelector('#lead-campaign').value;
      lead.followUpDone=document.querySelector('#lead-followUpDone').checked;
      const feedback={};for(const key of ['comfort','grip','durability']) {const value=document.querySelector(`#rating-${key}`).value;if(value!=='')feedback[key]=Number(value);}
      if(Object.keys(feedback).length)lead.feedback=feedback;
      const validated=importLeads(exportLeads([lead],{spreadsheetSafe:false}))[0];
      saveLead(validated,!editing);
      dialog.close();refresh();notify(editing ? 'Lead updated on this device' : 'Buyer conversation added');
    } catch(error) {document.querySelector('#save-error').textContent=error.message;}
  });
  for(const id of ['close-dialog','cancel-dialog'])document.querySelector(`#${id}`).addEventListener('click',()=>dialog.close());
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));
  document.querySelector('#edit-goals').addEventListener('click',()=>{
    for(const key of Object.keys(defaultGoals))document.querySelector(`#goal-${key}`).value=planner.goals[key];
    document.querySelector('#goals-error').textContent='';document.querySelector('#goals-dialog').showModal();
  });
  document.querySelector('#goals-form').addEventListener('submit',event=>{
    event.preventDefault();try {
      savePlanner({...planner,goals:Object.fromEntries(Object.keys(defaultGoals).map(key=>[key,Number(document.querySelector(`#goal-${key}`).value)]))});
      document.querySelector('#goals-dialog').close();refresh();notify('Personal goals saved');
    } catch(error) {document.querySelector('#goals-error').textContent=error.message;}
  });
  function openCampaign(campaign=null) {
    document.querySelector('#campaign-form').reset();
    document.querySelector('#campaign-id').value=campaign?.id || '';
    document.querySelector('#campaign-name').value=campaign?.name || '';
    document.querySelector('#campaign-channel').value=campaign?.channel || '';
    document.querySelector('#campaign-spend').value=campaign ? (campaign.spendCents/100).toFixed(2) : '';
    document.querySelector('#campaign-error').textContent='';document.querySelector('#campaign-dialog').showModal();
  }
  document.querySelector('#add-campaign').addEventListener('click',()=>openCampaign());
  document.querySelector('#campaign-form').addEventListener('submit',event=>{
    event.preventDefault();try {
      const campaign={id:document.querySelector('#campaign-id').value || `CAMPAIGN-${crypto.randomUUID()}`,name:document.querySelector('#campaign-name').value.trim(),channel:document.querySelector('#campaign-channel').value.trim(),spendCents:parseDollars(document.querySelector('#campaign-spend').value.trim())};
      const campaigns=planner.campaigns.filter(c=>c.id!==campaign.id);campaigns.push(campaign);savePlanner({...planner,campaigns});
      document.querySelector('#campaign-dialog').close();refresh();notify('Campaign spending saved once');
    } catch(error) {document.querySelector('#campaign-error').textContent=error.message;}
  });
  document.querySelector('#campaign-rows').addEventListener('click',event=>{const button=event.target.closest('[data-campaign]');if(button)openCampaign(planner.campaigns.find(c=>c.id===button.dataset.campaign));});
  document.querySelector('#export-costs').addEventListener('click',()=>{
    const rows=[['Campaign ID','Campaign','Channel','Total spent USD','Assigned inquiries','Sample requests','Cost per request USD'],...campaignPerformance(planner.campaigns,getAll()).map(c=>[c.id,c.name,c.channel,(c.spendCents/100).toFixed(2),c.inquiries,c.samples,c.costPerSample===null?'':c.costPerSample.toFixed(2)])];
    download(rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'laura-campaign-costs.csv');notify('Campaign costs exported');
  });
  document.querySelector('#sample-search').addEventListener('input',()=>renderSamples(getAll()));
  document.querySelector('#laura-tools').addEventListener('click',event=>{
    if(event.target.closest('[data-toggle-reminders]')){showAllReminders=!showAllReminders;refresh();return;}
    const button=event.target.closest('[data-open-lead]');if(button)openLead(getAll().find(l=>l.id===button.dataset.openLead));
    const done=event.target.closest('[data-complete-lead]');if(done) {
      try {const lead=getAll().find(l=>l.id===done.dataset.completeLead);saveLead({...lead,followUpDone:true},false);refresh();notify('Follow-up marked complete');}
      catch(error) {notify(error.message);}
    }
  });
  const editButton=(lead,label='Update')=>`<button class="button" data-open-lead="${esc(lead.id)}">${label}</button>`;
  function renderSamples(records) {
    const query=document.querySelector('#sample-search').value.toLowerCase().trim();
    const samples=records.filter(l=>l.stage>=2 && l.company.toLowerCase().includes(query));
    document.querySelector('#sample-rows').innerHTML=samples.slice(0,8).map(l=>`<tr><td><strong>${esc(l.company)}</strong></td>${['sampleRequested','sampleSent','sampleReceived','sampleEvaluated'].map(key=>`<td>${esc(l[key] || 'Not recorded')}</td>`).join('')}<td>${esc(sampleStatus(l))}</td><td>${editButton(l)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty-state">No matching sample requests. Update a lead when a sample is requested.</td></tr>';
    document.querySelector('#sample-count').textContent=`Showing ${Math.min(8,samples.length)} of ${samples.length} sample requests. Search by company to find others. Blank dates mean not recorded.`;
  }
  function render() {
    loadPlanner();const records=getAll(),today=todayPacific();
    document.querySelector('#planner-warning').textContent=plannerWarning;
    document.querySelector('#planner-mode').textContent=isDemo() ? 'Demo view: Add lead starts your personal buyer list. Goals and costs edited in this view belong only to the demo.' : 'Personal view: your leads, follow-ups, goals, and spending save on this device. Share & backup manages copies.';
    document.querySelector('#reminder-date').textContent=`Overdue, today, and next 7 days · ${today} (Los Angeles) · all leads`;
    const due=dueFollowUps(records,today);
    document.querySelector('#reminders').innerHTML=due.length ? due.slice(0,showAllReminders?due.length:6).map(l=>`<div class="reminder"><div><strong>${esc(l.company)}</strong><p><span class="${l.dueDate<today?'overdue':''}">${l.dueDate<today?'Overdue':l.dueDate===today?'Due today':'Upcoming'} · ${esc(l.dueDate)}</span> · ${esc(l.nextAction || 'Choose next action')}</p></div><div>${editButton(l,'Open')} <button class="button" data-complete-lead="${esc(l.id)}">Done</button></div></div>`).join('')+`<p class="planner-caption">${due.length} follow-ups due through the next 7 days. Completed follow-ups are excluded.</p>${due.length>6?`<button class="button" data-toggle-reminders>${showAllReminders?'Show fewer':'Show all due follow-ups'}</button>`:''}` : '<p class="empty-state">Nothing due in the next 7 days. Add a follow-up date to a lead to see a reminder here.</p>';
    const s=summarize(records),counts={inquiries:s.total,samples:s.samples,feedback:s.feedback};
    document.querySelector('#goal-progress').innerHTML=[['inquiries','Buyer conversations'],['samples','Sample requests'],['feedback','Feedback responses']].map(([key,label])=>`<div class="goal-row"><div><span>${label}</span><strong>${counts[key]} / ${planner.goals[key]}</strong></div><progress value="${Math.min(counts[key],planner.goals[key])}" max="${planner.goals[key]}" aria-label="${label}"></progress></div>`).join('');
    renderSamples(records);
    const noted=records.filter(l=>detailColumns.some(([key])=>(key.endsWith('Notes') || key==='concerns') && l[key]));
    document.querySelector('#buyer-notes').innerHTML=noted.length ? noted.slice(0,6).map(l=>`<details class="buyer-note"><summary>${esc(l.company)}</summary>${detailColumns.filter(([key])=>(key.endsWith('Notes') || key==='concerns') && l[key]).map(([key,label])=>`<p><strong>${label}:</strong> ${esc(l[key])}</p>`).join('')}${editButton(l,'Edit feedback')}</details>`).join('')+`<p class="planner-caption">Showing ${Math.min(6,noted.length)} of ${noted.length} leads with comments. Search the lead table to open other records.</p>` : '<p class="empty-state">No buyer comments recorded. Open a lead and expand Trial ratings and buyer comments to add them.</p>';
    const costs=campaignPerformance(planner.campaigns,records);
    document.querySelector('#campaign-rows').innerHTML=costs.map(c=>`<tr><td><strong>${esc(c.name)}</strong><small>${esc(c.channel)} · ${esc(c.id)}</small></td><td>${money(c.spendCents/100)}</td><td>${c.inquiries}</td><td>${c.samples}</td><td>${c.costPerSample===null?'Not available':money(c.costPerSample)}</td><td><button class="button" data-campaign="${esc(c.id)}">Edit</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">No spending recorded. Add a campaign, then assign leads to it in their details.</td></tr>';
    const unassigned=records.filter(l=>!planner.campaigns.some(c=>c.id===l.campaignId)).length;
    document.querySelector('#cost-basis').textContent=`Total recorded spend: ${money(costs.reduce((sum,c)=>sum+c.spendCents,0)/100)}. Cost per request = campaign’s total spend ÷ assigned leads reaching Sample requested or later. Spend is counted once per campaign. ${unassigned} leads have no matching campaign; they are excluded from campaign costs. Export costs separately from leads. ${isDemo()?'This is the demo planner.':'This is your personal planner.'}`;
  }
  return {render,openLead,getPlanner:()=>{loadPlanner();return structuredClone(planner);},reloadPlanner:()=>{plannerContext=undefined;}};
}
