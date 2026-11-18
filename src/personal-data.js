export const detailColumns = [
  ['dueDate','Follow-up date'], ['followUpDone','Follow-up complete'],
  ['sampleRequested','Sample requested date'], ['sampleSent','Sample sent date'],
  ['sampleReceived','Sample received date'], ['sampleEvaluated','Sample evaluated date'],
  ['comfortNotes','Comfort notes'], ['gripNotes','Grip notes'], ['durabilityNotes','Durability notes'],
  ['priceNotes','Price notes'], ['concerns','Purchasing concerns'], ['campaignId','Campaign ID'],
];
export const defaultGoals = { inquiries:20, samples:10, feedback:5 };
export function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
}
export function validateDetails(lead) {
  const result={};
  for (const [key,label] of detailColumns) {
    const value=lead[key];
    if(value === '' || value === undefined || value === null || value === false)continue;
    if(key==='followUpDone') { if(value!==true)throw new Error('Follow-up complete must be Yes, No, or blank.');result[key]=true;continue; }
    if(typeof value!=='string' || value.length>2000)throw new Error(`${label} must be text of at most 2,000 characters.`);
    if(key==='dueDate' || key.startsWith('sample')) {
      if(!validDate(value))throw new Error(`${label} must be a valid YYYY-MM-DD date.`);
      if(value<lead.date)throw new Error(`${label} cannot be earlier than the inquiry date.`);
    }
    result[key]=value;
  }
  const steps=['sampleRequested','sampleSent','sampleReceived','sampleEvaluated'];
  for(let i=0;i<steps.length;i++) {
    if(!result[steps[i]])continue;
    if(lead.stage<2)throw new Error('Choose Sample requested or a later stage before recording sample dates.');
    if(i && !result[steps[i-1]])throw new Error(`Enter ${detailColumns.find(([key])=>key===steps[i-1])[1]} before the next sample milestone.`);
    if(i && result[steps[i]]<result[steps[i-1]])throw new Error('Sample milestones must be in chronological order.');
  }
  return result;
}
export function todayPacific(now = new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=type=>parts.find(p=>p.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function dueFollowUps(records, today) {
  const end=new Date(`${today}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+7);
  return records.filter(l=>l.dueDate && !l.followUpDone && l.dueDate<=end.toISOString().slice(0,10)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
}
export function sampleStatus(lead) {
  return lead.sampleEvaluated ? 'Evaluated' : lead.sampleReceived ? 'Received' : lead.sampleSent ? 'Sent' : lead.sampleRequested ? 'Requested' : lead.stage>=2 ? 'Requested · dates missing' : 'Not requested';
}
export function validatePlanner(value) {
  const goals=value.goals;
  if(!goals || Object.keys(defaultGoals).some(key=>!Number.isSafeInteger(goals[key]) || goals[key]<1 || goals[key]>1000000))throw new Error('Goals must be whole numbers from 1 to 1,000,000.');
  if(!Array.isArray(value.campaigns) || value.campaigns.length>1000)throw new Error('Use at most 1,000 campaigns.');
  const ids=new Set();
  const campaigns=value.campaigns.map(c=>{
    if(!c || typeof c.id!=='string' || !c.id || ids.has(c.id))throw new Error('Campaign IDs must be unique.');
    ids.add(c.id);
    if(typeof c.name!=='string' || !c.name.trim() || c.name.length>200 || typeof c.channel!=='string' || !c.channel.trim() || c.channel.length>200)throw new Error('Enter a campaign name and channel (up to 200 characters).');
    if(!Number.isSafeInteger(c.spendCents) || c.spendCents<0 || c.spendCents>100000000000)throw new Error('Spending must be a positive USD amount or zero.');
    return {id:c.id,name:c.name.trim(),channel:c.channel.trim(),spendCents:c.spendCents};
  });
  return {goals:{...goals},campaigns};
}
export function campaignPerformance(campaigns, records) {
  return campaigns.map(c=>{
    const assigned=records.filter(l=>l.campaignId===c.id);
    const samples=assigned.filter(l=>l.stage>=2).length;
    return {...c,inquiries:assigned.length,samples,costPerSample:samples ? c.spendCents/100/samples : null};
  });
}
export function parseDollars(value) {
  if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error('Enter a USD amount with up to two decimal places.');
  const [dollars,cents='']=value.split('.');
  const result=Number(dollars)*100+Number(cents.padEnd(2,'0'));
  if(!Number.isSafeInteger(result) || result>100000000000)throw new Error('Spending amount is too large.');
  return result;
}
