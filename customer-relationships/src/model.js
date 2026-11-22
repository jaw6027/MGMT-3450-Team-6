import {importLeads} from '../../src/csv.js';
export const STORAGE_KEY='laura-ppe-crm-v1';
export const stages=['Target identified','Contacted','Needs discussion','Sample evaluation','Proposal','Customer','Not a fit'];
export const segments=['Oil & gas operator','Industrial contractor','PPE distributor','Other industrial buyer'];
export const companyTypes=['Not recorded','Oil & gas operator','Drilling contractor','Oilfield service company','PPE distributor','Other'];
export const requirementLabels={testing:'Required glove testing',certifications:'Required certifications',sizes:'Sizes needed',price:'Buyer price range',vendor:'Vendor approval steps'};
export const requirementStatuses=['Not discussed','To confirm','Documented'];
export const roles=['Safety / HSE','Procurement','Distribution','Sustainability','Other'];
export const priorities=['High','Normal','Low'];
export const sampleStates=['Not requested','Requested','Sent','Feedback received'];
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
const text=(value,max,name,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error(`Check ${name} (maximum ${max} characters).`);return value.trim();};
export function validateAccount(value){
 if(!value||typeof value!=='object')throw Error('Invalid customer account.');
 const a={};
 for(const [key,max,required] of [['id',80,true],['company',120,true],['contact',100,false],['email',160,false],['need',600,false],['nextAction',240,false],['notes',2000,false]])a[key]=text(value[key],max,key,required);
 for(const [key,max] of [['phone',60],['location',160],['sampleVersion',160],['purchasePlan',240],['sourceLeadId',2000]])a[key]=text(value[key] ?? '',max,key);
 a.quantity=value.quantity ?? null;if(a.quantity!==null&&(!Number.isSafeInteger(a.quantity)||a.quantity<0||a.quantity>1000000000))throw Error('Estimated glove pairs must be a whole number or blank.');
 a.companyType=value.companyType ?? 'Not recorded';if(!companyTypes.includes(a.companyType))throw Error('Choose a valid company type.');
 const req=value.requirements ?? {};if(!req||typeof req!=='object'||Array.isArray(req))throw Error('Check buying requirements.');
 a.requirements=Object.fromEntries(Object.keys(requirementLabels).map(key=>{const v=req[key] ?? {status:'Not discussed',details:''};if(!v||!requirementStatuses.includes(v.status))throw Error('Choose a valid requirement status.');return [key,{status:v.status,details:text(v.details ?? '',600,'requirement details')}];}));
 for(const key of ['sampleSent','feedbackDue','feedbackReceived','awaitingSince']){a[key]=text(value[key] ?? '',10,key);if(a[key]&&!validDate(a[key]))throw Error('Check sample and reply dates.');}
 a.sampleResponse=text(value.sampleResponse ?? '',1500,'sample response');
 if((a.feedbackDue||a.feedbackReceived)&&!a.sampleSent)throw Error('Record the sample sent date before feedback dates.');
 if(a.sampleSent&&!["Sent","Feedback received"].includes(value.sample))throw Error('Choose Sent or Feedback received for a sent sample.');
 if((a.feedbackDue&&a.feedbackDue<a.sampleSent)||(a.feedbackReceived&&a.feedbackReceived<a.sampleSent))throw Error('Feedback dates cannot be earlier than the sample sent date.');
 if((a.feedbackReceived||a.sampleResponse)&&value.sample!=='Feedback received')throw Error('Choose Feedback received when recording a sample response.');
 if(a.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email))throw Error('Enter a valid email address or leave it blank.');
 for(const [key,options] of [['segment',segments],['role',roles],['stage',stages],['priority',priorities],['sample',sampleStates]]){if(!options.includes(value[key]))throw Error(`Choose a valid ${key}.`);a[key]=value[key];}
 a.followUp=text(value.followUp,10,'follow-up date');if(a.followUp&&!validDate(a.followUp))throw Error('Enter a valid follow-up date.');
 if(a.followUp&&!a.nextAction)throw Error('Add a next action for the follow-up date.');
 if(!Array.isArray(value.activities)||value.activities.length>200)throw Error('Each account supports up to 200 conversations.');
 a.activities=value.activities.map(v=>{if(!v||!validDate(v.date))throw Error('Check conversation dates.');return {id:text(v.id,80,'conversation ID',true),date:v.date,type:text(v.type,40,'conversation type',true),note:text(v.note,1000,'conversation note',true)};});
 if(new Set(a.activities.map(v=>v.id)).size!==a.activities.length)throw Error('Duplicate conversation IDs.');
 return a;
}
export function validateBackup(value){
 if(value?.app!=='laura-ppe-crm'||value.version!==1||!Array.isArray(value.accounts)||value.accounts.length>1000)throw Error('Choose a Laura PPE CRM version-1 backup (up to 1,000 accounts).');
 const accounts=value.accounts.map(validateAccount);if(new Set(accounts.map(a=>a.id)).size!==accounts.length)throw Error('Duplicate account IDs.');return accounts;
}
export const backup=accounts=>({app:'laura-ppe-crm',version:1,accounts:accounts.map(validateAccount)});
export function selectAccounts(accounts,{search='',segment='',stage='',due='',companyType=''}={},date=today()){
 return accounts.filter(a=>(!search||[a.company,a.contact,a.email,a.phone,a.location,a.sampleVersion,a.companyType,a.need,a.nextAction].join(' ').toLowerCase().includes(search.toLowerCase()))&&(!companyType||a.companyType===companyType)&&(!segment||a.segment===segment)&&(!stage||a.stage===stage)&&(!due||(a.followUp&& !['Customer','Not a fit'].includes(a.stage)&&(due==='overdue'?a.followUp<date:a.followUp<=date))));
}
export function summarize(accounts,date=today()){
 const open=accounts.filter(a=>!['Customer','Not a fit'].includes(a.stage));
 return {total:accounts.length,open:open.length,due:open.filter(a=>a.followUp&&a.followUp<=date).length,samples:open.filter(a=>['Requested','Sent'].includes(a.sample)).length,customers:accounts.filter(a=>a.stage==='Customer').length};
}
export function exportCSV(accounts){
 const headers=['Company','Contact','Email','Buyer segment','Buyer role','Priority','Stage','Sample status','PPE needs','Next action','Follow-up date','Notes','Phone','Location','Sample version','Estimated glove pairs','Purchasing timeline / conditions','Company type','Sample sent date','Feedback due date','Feedback received date','Buyer sample response','Waiting for reply since',...Object.values(requirementLabels).flatMap(label=>[label+' status',label+' details'])];
 const cell=value=>'"'+String(value).replace(/^[\s]*[=+@-]/,v=>"'"+v).replaceAll('"','""')+'"';
 return [headers,...accounts.map(a=>[a.company,a.contact,a.email,a.segment,a.role,a.priority,a.stage,a.sample,a.need,a.nextAction,a.followUp,a.notes,a.phone,a.location,a.sampleVersion,a.quantity ?? '',a.purchasePlan,a.companyType,a.sampleSent,a.feedbackDue,a.feedbackReceived,a.sampleResponse,a.awaitingSince,...Object.keys(requirementLabels).flatMap(key=>[a.requirements?.[key]?.status ?? 'Not discussed',a.requirements?.[key]?.details ?? ''])])].map(row=>row.map(cell).join(',')).join('\r\n');
}
export const demoAccounts=[
 ['demo-1','Canyon Field Services','Morgan Lee','Industrial contractor','Safety / HSE','High','Sample evaluation','Sent','Grip during equipment handling; document trial conditions.','Ask for trial observations','2026-11-20'],
 ['demo-2','Northline Industrial Supply','Alex Rivera','PPE distributor','Distribution','High','Needs discussion','Requested','Understand glove sizes, distributor requirements, and sample availability.','Confirm sample quantities','2026-11-22'],
 ['demo-3','Mesa Energy Operations','Jordan Chen','Oil & gas operator','Procurement','Normal','Contacted','Not requested','Learn purchasing criteria and required finished-glove test evidence.','Arrange buyer discovery call','2026-11-24'],
 ['demo-4','Evergreen Site Contractors','Taylor Brooks','Industrial contractor','Sustainability','Normal','Target identified','Not requested','Explore material sourcing questions and intended use.','Introduce the concept','2026-11-25'],
 ['demo-5','Harbor Safety Supply','Casey Reed','PPE distributor','Procurement','High','Proposal','Feedback received','Clarify price, lead time, and evidence requirements before an order.','Discuss purchasing conditions','2026-11-23'],
 ['demo-6','Westbridge Maintenance','Sam Patel','Other industrial buyer','Safety / HSE','Low','Not a fit','Not requested','Requires certified protection not established for this concept.','', ''],
].map(([id,company,contact,segment,role,priority,stage,sample,need,nextAction,followUp])=>validateAccount({id,company,contact,segment,role,priority,stage,sample,need,nextAction,followUp,email:'',notes:'Fictional account for demonstration only.',activities:id==='demo-1'?[{id:'demo-call-1',date:'2026-11-18',type:'Call',note:'Fictional discovery call: buyer requested a structured sample feedback discussion.'}]:[]}));

export function planMarketingImport(existing,csv){
 const leads=importLeads(csv),known=new Set(existing.map(a=>a.sourceLeadId).filter(Boolean));let skipped=0;
 const additions=[];
 for(const lead of leads){
  if(known.has(lead.id)){skipped++;continue;}
  const notes=[`Marketing lead: ${lead.id}`,`Channel: ${lead.channel}`,`Message: ${lead.message}`,`Inquiry date: ${lead.date}`,lead.feedback?`Recorded ratings: ${JSON.stringify(lead.feedback)}`:'',lead.comfortNotes,lead.gripNotes,lead.durabilityNotes,lead.priceNotes,lead.concerns].filter(Boolean).join('\n');
  if(lead.company.length>120 || notes.length>2000 || lead.nextAction.length>240)throw Error('Some marketing fields exceed CRM limits. Shorten the company, next action, or feedback notes in the source before importing.');
  const role=/safety|hse/i.test(lead.audience)?'Safety / HSE':/procure|purchas/i.test(lead.audience)?'Procurement':'Other';
  const followUp=lead.followUpDone?'':lead.dueDate || '';
  additions.push(validateAccount({id:crypto.randomUUID(),company:lead.company,contact:'',email:'',segment:'Other industrial buyer',role,priority:'Normal',stage:lead.stage>=3?'Sample evaluation':lead.stage>=1?'Needs discussion':'Target identified',sample:lead.sampleEvaluated||lead.stage===4?'Feedback received':lead.sampleSent?'Sent':lead.stage>=2?'Requested':'Not requested',need:'',nextAction:lead.nextAction || (followUp?'Review imported lead and choose next step':''),followUp,notes,sampleSent:lead.sampleSent||'',feedbackReceived:lead.sampleEvaluated||'',activities:[],sourceLeadId:lead.id}));known.add(lead.id);
 }
 if(existing.length+additions.length>1000)throw Error('Import would exceed 1,000 CRM accounts. Use a smaller marketing export.');
 return {additions,skipped};
}
export function progressReport(accounts,date=today(),demo=false){
 const n=summarize(accounts,date),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"><title>Laura’s CRM progress</title><style>body{font:16px/1.8 system-ui;max-width:800px;margin:30px auto;padding:25px;color:#28442d}li{margin:10px 0}</style></head><body><p>${demo?'FICTIONAL DEMO DATA':'USER-ENTERED CRM DATA'}</p><h1>Laura’s customer relationship progress</h1><p>Snapshot: ${esc(date)} · Los Angeles calendar date</p><ul><li>${n.total} accounts in this view</li><li>${n.open} open relationships</li><li>${n.due} follow-ups due</li><li>${n.samples} samples in progress</li><li>${n.customers} recorded customers</li></ul><h2>Relationship stages</h2><ul>${stages.map(s=>`<li>${esc(s)}: ${accounts.filter(a=>a.stage===s).length}</li>`).join('')}</ul><p>Counts reflect the selected workspace and filters. This report excludes company names, contacts, notes, and conversation history. It does not update automatically. Sample interest and feedback do not establish PPE certification.</p></body></html>`;
}

export function attentionReasons(a,date=today()){
 if(['Customer','Not a fit'].includes(a.stage))return [];
 const reasons=[];
 if(a.followUp&&a.followUp<=date)reasons.push({date:a.followUp,text:a.followUp<date?'Follow-up overdue':'Follow-up due today'});
 if(a.feedbackDue&&a.feedbackDue<=date&&a.sample!=='Feedback received'&&!a.feedbackReceived)reasons.push({date:a.feedbackDue,text:a.feedbackDue<date?'Sample feedback overdue':'Sample feedback due today'});
 if(a.awaitingSince){const end=new Date(a.awaitingSince+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+7);const due=end.toISOString().slice(0,10);if(due<=date)reasons.push({date:due,text:'Waiting for a reply · 7+ days'});}
 return reasons;
}
export function relationshipsNeedingAttention(accounts,date=today()){
 return accounts.map(account=>({account,reasons:attentionReasons(account,date)})).filter(item=>item.reasons.length).sort((a,b)=>a.reasons.map(r=>r.date).sort()[0].localeCompare(b.reasons.map(r=>r.date).sort()[0]));
}
