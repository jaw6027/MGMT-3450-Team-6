import {createBackup,validateBackup,reportHTML} from './backup.js';
import {CloudClient,validateCloudConfig} from './cloud-client.js';
import {importLeads} from './csv.js';

const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const configKey='btl-cloud-config',sessionKey='btl-cloud-session',pendingKey='btl-cloud-pending',autoKey='btl-cloud-auto';
const read=(key,storage=localStorage)=>{try{return JSON.parse(storage.getItem(key) || 'null');}catch{return null;}};
export function mountSharing({getAll,getFiltered,getPlanner,isDemo,describeFilters,restore,notify}) {
  document.querySelector('.page-heading .page-actions').insertAdjacentHTML('beforeend','<button class="button" id="open-sharing">Share &amp; backup</button>');
  document.querySelector('.topbar').insertAdjacentHTML('afterend','<div id="cloud-banner" role="status">Local storage only · cloud backup is not connected</div>');
  document.body.insertAdjacentHTML('beforeend',`
    <dialog id="sharing-dialog" aria-labelledby="sharing-title"><div class="dialog-heading"><h2 id="sharing-title">Share & protect Laura’s work</h2><button type="button" id="close-sharing" aria-label="Close sharing">×</button></div>
    <section class="sharing-section"><h3>Share a read-only report</h3><p>Download a report to send as an attachment, or open it in your browser and print to PDF. It contains the current filtered totals and interest summary, without individual companies, lead IDs, owners, follow-up dates, or buyer notes. Custom category names are included—review before sharing.</p><label class="check-label"><input type="checkbox" id="report-planning"> Include personal goals and campaign names/costs (all active leads)</label><button class="button" id="download-report">Download report</button></section>
    <section class="sharing-section"><h3>Complete personal backup</h3><p>This private file includes all personal leads, notes, sample tracking, goals, and campaign costs, independently of filters. Keep it somewhere safe. It does not contain cloud sign-in credentials.</p><button class="button" id="download-backup">Download complete backup</button><label>Choose a complete backup to restore<input id="backup-file" type="file" accept=".json,application/json"></label></section>
    <section class="sharing-section"><h3>Sign in to private cloud backup</h3><p>Sign-in protects cloud copies. Your local dashboard remains available on this device. It is not a password lock on this HTML file. Cloud backup requires the one-time Supabase setup described in the included setup guide.</p>
    <details id="cloud-setup"><summary>Connect cloud service (one-time setup)</summary><form id="cloud-config-form"><label>Supabase project URL<input type="url" id="cloud-url" placeholder="https://project-ref.supabase.co" required></label><label>Publishable or anon key<input type="password" id="cloud-key" autocomplete="off" required></label><p>Use only a public publishable/anon key. Never use a secret or service-role key.</p><button class="button" type="submit">Save connection</button></form></details>
    <p id="cloud-account"></p><form id="cloud-email-form"><label>Laura’s sign-in email<input type="email" id="cloud-email" autocomplete="email" required></label><button class="button" id="send-code" type="submit">Send sign-in code</button></form>
    <form id="cloud-code-form" hidden><label>Email sign-in code<input id="cloud-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" required></label><button class="button primary" id="verify-code" type="submit">Sign in</button></form>
    <div id="cloud-signed-in" hidden><label class="check-label"><input type="checkbox" id="cloud-auto"> Automatically back up saved changes</label><p>When enabled, the app saves a new private copy after changes while open and signed in. Offline changes wait for a connection. Copies are never merged into another device automatically.</p><div class="page-actions"><button class="button" id="backup-now">Back up now</button><button class="button" id="refresh-backups">Refresh cloud copies</button><button class="button" id="cloud-signout">Sign out</button></div><div id="cloud-history"></div></div>
    <button class="button" id="discard-pending" hidden>Discard pending backup</button><p id="cloud-status" role="status"></p><p id="sharing-error" class="form-error" role="alert"></p></section></dialog>
    <dialog id="restore-dialog" aria-labelledby="restore-title"><div class="dialog-heading"><h2 id="restore-title">Restore a complete copy?</h2><button type="button" id="cancel-restore" aria-label="Cancel restore">×</button></div><p id="restore-preview"></p><p class="dialog-note">This replaces all local personal leads, goals, and campaign costs. Download a complete backup of your current work first if you need to keep it. Previous cloud copies remain unchanged.</p><p id="restore-error" class="form-error" role="alert"></p><button class="button primary" id="confirm-restore">Replace local work</button></dialog>`);
  const $=id=>document.getElementById(id);
  const status=text=>{$('cloud-status').textContent=text;};
  const error=text=>{$('sharing-error').textContent=text;};
  const snapshot=()=>{if(isDemo())throw new Error('Add or import personal leads first. Demo records are not included in personal backups.');return createBackup(getAll(),getPlanner());};
  function download(content,filename,type) {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  let client=null,ready=false,auto=false,busy=false,timer,generation=0,codeEmail='',lastContent='',pendingRestore=null;
  function banner(text) {$('cloud-banner').textContent=text;}
  function updateAuth() {
    const signedIn=Boolean(ready && client?.session?.user);
    $('cloud-email-form').hidden=signedIn;$('cloud-code-form').hidden=signedIn || !codeEmail;
    $('cloud-signed-in').hidden=!signedIn;$('cloud-auto').checked=auto;
    $('cloud-account').textContent=signedIn?`Signed in as ${client.session.user.email}`:client?'Cloud settings saved. Sign in to verify the connection.':'Cloud service not configured. Local work is still saved in this browser.';
    $('discard-pending').hidden=!read(pendingKey);
  }
  function saveSession() {try{if(client?.session)sessionStorage.setItem(sessionKey,JSON.stringify({url:client.config.url,session:client.session}));}catch{/* session stays in memory */}}
  function configure(value) {
    const config=validateCloudConfig(value);localStorage.setItem(configKey,JSON.stringify(config));
    client=new CloudClient(config);generation++;ready=false;auto=false;codeEmail='';lastContent='';
    sessionStorage.removeItem(sessionKey);updateAuth();banner('Local storage only · sign in to cloud backup');
  }
  $('open-sharing').addEventListener('click',()=>{error('');$('download-backup').disabled=isDemo();updateAuth();$('sharing-dialog').showModal();});
  $('close-sharing').addEventListener('click',()=>$('sharing-dialog').close());
  $('download-report').addEventListener('click',()=>{
    const html=reportHTML({records:getFiltered(),planner:getPlanner(),filters:describeFilters(),demo:isDemo(),includePlanning:$('report-planning').checked});
    download(html,'Laura-Marketing-Report.html','text/html;charset=utf-8');notify('Read-only report downloaded. Review it before sharing.');
  });
  $('download-backup').addEventListener('click',()=>{try{download(JSON.stringify(snapshot(),null,2),'Laura-Complete-Backup.json','application/json');notify('Complete private backup downloaded');}catch(e){error(e.message);}});
  function previewRestore(value) {
    pendingRestore=validateBackup(value);$('restore-error').textContent='';
    $('restore-preview').textContent=`Copy from ${new Date(pendingRestore.createdAt).toLocaleString('en-US',{timeZone:'America/Los_Angeles'})} (Los Angeles): ${importLeads(pendingRestore.csv).length} leads, ${pendingRestore.planner.campaigns.length} campaigns, and all personal goals.`;
    $('restore-dialog').showModal();
  }
  $('backup-file').addEventListener('change',async()=>{error('');const file=$('backup-file').files[0];if(!file)return;try{if(file.size>12*1024*1024)throw new Error('Choose a backup smaller than 12 MB.');previewRestore(JSON.parse((await file.text()).replace(/^\uFEFF/,'')));}catch(e){error(e instanceof SyntaxError?'Choose a valid dashboard JSON backup file.':e.message);}finally{$('backup-file').value='';}});
  $('cancel-restore').addEventListener('click',()=>{$('restore-dialog').close();pendingRestore=null;});
  $('confirm-restore').addEventListener('click',()=>{if(!pendingRestore)return;try{restore(pendingRestore);pendingRestore=null;$('restore-dialog').close();$('sharing-dialog').close();notify('Complete copy restored on this device');}catch(e){$('restore-error').textContent=e.message;}});
  $('cloud-config-form').addEventListener('submit',event=>{event.preventDefault();error('');if(busy){error('Wait for the current backup to finish before changing connections.');return;}try{configure({url:$('cloud-url').value,key:$('cloud-key').value});status('Connection settings saved. Sign in after completing the Supabase setup.');}catch(e){error(e.message);}});
  $('cloud-email-form').addEventListener('submit',async event=>{
    event.preventDefault();error('');if(!client){error('Connect a Supabase project first. See the one-time setup guide.');$('cloud-setup').open=true;return;}
    $('send-code').disabled=true;const current=client;
    try{const email=$('cloud-email').value.trim();await current.sendCode(email);if(current!==client)return;codeEmail=email;updateAuth();status('Code requested. Check your email, then enter the sign-in code.');}
    catch(e){error(e.message);}finally{$('send-code').disabled=false;}
  });
  $('cloud-code-form').addEventListener('submit',async event=>{
    event.preventDefault();error('');$('verify-code').disabled=true;const current=client;
    try{await current.verifyCode(codeEmail,$('cloud-code').value.trim());if(current!==client)return;ready=true;$('cloud-code').value='';saveSession();auto=read(autoKey)?.account===client.accountKey() && read(autoKey)?.enabled===true;updateAuth();status('Signed in. Enable automatic backup or choose Back up now.');banner('Signed in · automatic cloud backup is off');try{await showHistory();}catch(e){error(e.message);}if(auto)changed();}
    catch(e){ready=false;current.session=null;error(e.message);updateAuth();}finally{$('verify-code').disabled=false;}
  });
  async function showHistory() {
    const current=client,epoch=generation;if(!ready)return;
    const rows=await current.history();if(current!==client || epoch!==generation)return;
    if(!Array.isArray(rows))throw new Error('Cloud service returned an invalid backup list.');
    $('cloud-history').innerHTML='<h4>Recent private copies</h4>'+ (rows.length?rows.map(row=>`<div class="cloud-copy"><span>${esc(new Date(row.created_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles'}))} (Los Angeles)</span><button class="button" data-cloud-restore="${esc(row.id)}">Review restore</button></div>`).join(''):'<p>No cloud copies yet. Your current local work has not been uploaded.</p>');saveSession();
  }
  $('refresh-backups').addEventListener('click',()=>showHistory().catch(e=>error(e.message)));
  $('cloud-history').addEventListener('click',async event=>{const button=event.target.closest('[data-cloud-restore]');if(!button)return;button.disabled=true;const current=client,epoch=generation;try{const value=await current.getBackup(button.dataset.cloudRestore);if(current!==client || epoch!==generation)return;previewRestore(value);saveSession();}catch(e){if(current===client && epoch===generation)error(e.message);}finally{button.disabled=false;}});
  function content(copy) {return JSON.stringify({csv:copy.csv,planner:copy.planner});}
  function markPending() {
    const existing=read(pendingKey),account=client.accountKey();
    if(existing && existing.account!==account)throw new Error('A pending copy belongs to a different cloud account. Sign in to that account, or discard the pending backup before enabling this one.');
    const copy=snapshot(),serialized=content(copy);
    if(serialized===lastContent && existing)return existing;
    const meta={id:crypto.randomUUID(),account};localStorage.setItem(pendingKey,JSON.stringify(meta));lastContent=serialized;updateAuth();return meta;
  }
  async function flush() {
    if(!ready || busy)return;
    if(isDemo()){status('Personal backups are paused while viewing demo data.');return;}
    let pending=read(pendingKey);if(!pending)return;
    const current=client,epoch=generation;
    if(pending.account!==current.accountKey()){status('Pending backup belongs to a different account.');return;}
    if(navigator.onLine===false){banner('Saved locally · waiting for connection to back up');return;}
    const copy=snapshot(),uploadedContent=content(copy);busy=true;banner('Saved locally · backing up to cloud…');
    try {
      await current.saveBackup({...pending,snapshot:copy});
      if(current!==client || epoch!==generation)return;
      saveSession();
      if(read(pendingKey)?.id===pending.id && !isDemo() && content(snapshot())===uploadedContent)localStorage.removeItem(pendingKey);
      const stamp=new Date().toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles'});
      banner(`Cloud copy saved at ${stamp} (Los Angeles)${auto?' · automatic backup on':''}`);status('Complete cloud copy saved. Earlier copies remain available.');updateAuth();
      try{await showHistory();}catch{status('Cloud copy saved. Refresh the list to see it.');}
    }catch(e){banner('Saved locally · cloud backup pending');status(e.message);}
    finally{busy=false;if(auto && read(pendingKey)?.id!==pending.id && read(pendingKey))timer=setTimeout(()=>flush().catch(e=>error(e.message)),1500);}
  }
  function changed() {
    if(!ready || !auto || isDemo())return;
    try {
      const serialized=content(snapshot());if(serialized===lastContent && !read(pendingKey))return;
      markPending();banner('Saved locally · cloud backup pending');clearTimeout(timer);timer=setTimeout(()=>flush().catch(e=>error(e.message)),1500);
    }catch(e){banner('Saved locally · cloud backup needs attention');status(e.message);}
  }
  $('cloud-auto').addEventListener('change',()=>{error('');if(!ready)return;try{auto=$('cloud-auto').checked;localStorage.setItem(autoKey,JSON.stringify({account:client.accountKey(),enabled:auto}));if(auto){lastContent='';changed();}else{clearTimeout(timer);banner('Signed in · automatic cloud backup is off');}updateAuth();}catch(e){auto=false;updateAuth();error(e.message);}});
  $('backup-now').addEventListener('click',async()=>{error('');try{markPending();await flush();}catch(e){error(e.message);}});
  $('discard-pending').addEventListener('click',()=>{if(!window.confirm('Discard only the pending upload? Local leads, goals, and costs will remain.'))return;try{localStorage.removeItem(pendingKey);lastContent='';updateAuth();status('Pending upload discarded. Local work is unchanged.');}catch(e){error(e.message);}});
  $('cloud-signout').addEventListener('click',async()=>{
    if(busy){error('Wait for the current backup to finish before signing out.');return;}
    auto=false;generation++;ready=false;clearTimeout(timer);try{localStorage.removeItem(autoKey);sessionStorage.removeItem(sessionKey);}catch{/* session is still cleared below */}
    const current=client;try{await current.signOut();status('Signed out. Local work remains on this device.');}catch{status('Signed out on this device. Cloud sign-out could not be confirmed; the server session will expire.');}finally{current.session=null;$('cloud-history').innerHTML='';codeEmail='';updateAuth();banner('Local storage only · signed out of cloud backup');}
  });
  window.addEventListener('online',()=>{if(ready && read(pendingKey))flush().catch(e=>error(e.message));});
  setInterval(()=>{if(ready && auto && read(pendingKey))flush().catch(e=>error(e.message));},60000);
  const configured=read(configKey) || (import.meta.env.VITE_SUPABASE_URL ? {url:import.meta.env.VITE_SUPABASE_URL,key:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY}:null);
  if(configured) {
    try {
      const config=validateCloudConfig(configured);client=new CloudClient(config);$('cloud-url').value=config.url;$('cloud-key').value=config.key;
      const saved=read(sessionKey,sessionStorage);
      if(saved?.url===config.url) {
        const current=client,epoch=generation;current.acceptSession(saved.session);current.verifyUser().then(()=>{if(current!==client || epoch!==generation)return;ready=true;saveSession();auto=read(autoKey)?.account===client.accountKey() && read(autoKey)?.enabled===true;updateAuth();banner(auto?'Signed in · automatic cloud backup on':'Signed in · automatic cloud backup off');if(auto)changed();}).catch(()=>{if(current!==client || epoch!==generation)return;current.session=null;ready=false;updateAuth();banner('Saved locally · sign in again to resume cloud backup');});
      }
    }catch(e){status(e.message);}
  }
  updateAuth();return {changed};
}
