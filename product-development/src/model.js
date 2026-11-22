export const storageKey='laura-product-development-v1';
export const materialSources=['Not documented','Supplier information','Internal measurement','Independent lab report','Literature'];
export const costUnits=['USD / m²','USD / sheet','USD / sample'];
export const prototypeStages=['Design','Preparing samples','Testing','Revising','Retired'];
export const evidenceTypes=['Supplier claim','Internal test','Buyer feedback','Independent lab report'];
export const testCategories=['Abrasion','Tear resistance','Grip','Flexibility','Comfort','Chemical resistance','Other'];
export const testStatuses=['Planned','In progress','Complete'];
export const outcomes=['Not assessed','Meets recorded criterion','Does not meet recorded criterion'];
export const expenseCategories=['Materials','Prototype manufacturing','Shipping','Lab testing','Other'];
export const emptyProject=()=>({version:1,materials:[],prototypes:[],tests:[],expenses:[]});
export function validatePhoto(file) {
  if(!file || !['image/png','image/jpeg'].includes(file.type) || typeof file.name!=='string' || !file.name.trim() || file.name.length>3000 || typeof file.data!=='string' || file.data.length>480000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))throw new Error('Prototype photos must be PNG or JPEG, up to 350 KB each.');
  let bytes;try{bytes=atob(file.data);}catch{throw new Error('Photo data is invalid.');}
  if(bytes.length>350*1024 || !(file.type==='image/png'?bytes.startsWith('\x89PNG\r\n\x1a\n'):bytes.startsWith('\xff\xd8\xff')))throw new Error('Photo contents do not match PNG/JPEG or exceed 350 KB.');
  return {name:file.name.trim(),type:file.type,data:file.data};
}
export function validDate(value) {return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function validateProject(value) {
  if(!value || value.version!==1 || !['materials','prototypes','tests'].every(key=>Array.isArray(value[key]) && value[key].length<=500))throw new Error('Use a product-development backup (version 1, up to 500 records of each type).');
  if(new TextEncoder().encode(JSON.stringify(value)).length>4*1024*1024)throw new Error('Project exceeds 4 MB. Keep a backup and use smaller report files.');
  const text=(v,label,required=false)=>{if(typeof v!=='string' || v.length>3000 || (required && !v.trim()))throw new Error(`${label} is required and must be text of at most 3,000 characters.`);return v.trim();};
  const number=(v,label,positive=false,allowNegative=false)=>{if(v===null || v===undefined || v==='')return null;if(typeof v!=='number' || !Number.isFinite(v) || (v<0 && !allowNegative) || (positive && v===0))throw new Error(`${label} must be ${positive?'greater than zero':allowNegative?'a finite number':'zero or more'}, or blank.`);return v;};
  const choice=(v,choices,label)=>{if(!choices.includes(v))throw new Error(`Choose a valid ${label}.`);return v;};
  const date=(v,label,required=false)=>{if(!v && !required)return '';if(!validDate(v))throw new Error(`${label} must be a valid YYYY-MM-DD date.`);return v;};
  const ids=new Set();
  const base=(r,label)=>{if(!r || typeof r.id!=='string' || !r.id || r.id.length>100 || ids.has(r.id))throw new Error('Every record must have a unique ID.');ids.add(r.id);return {id:r.id,name:text(r.name,label,true),notes:text(r.notes || '', 'Notes')};};
  const materials=value.materials.map(r=>{
    const result={...base(r,'Material name'),supplier:text(r.supplier || '','Supplier'),composition:text(r.composition || '','Composition'),batch:text(r.batch || '','Batch'),thickness:number(r.thickness,'Thickness',true),cost:number(r.cost,'Cost'),costUnit:choice(r.costUnit,costUnits,'cost unit'),energy:number(r.energy,'Energy demand'),carbon:number(r.carbon,'Carbon footprint'),basis:text(r.basis || '','Environmental measurement basis'),sourceType:choice(r.sourceType,materialSources,'material source'),sourceRef:text(r.sourceRef || '','Source reference')};
    if((result.energy!==null || result.carbon!==null) && (!result.basis || !result.sourceRef || result.sourceType==='Not documented'))throw new Error('Environmental figures need a stated measurement basis, source type, and source reference.');
    result.quantity=number(r.quantity,'Available quantity');result.quantityUnit=text(r.quantityUnit || '','Inventory unit');result.location=text(r.location || '','Storage location');result.reorderAt=number(r.reorderAt,'Reorder threshold');
    if((result.quantity!==null || result.reorderAt!==null) && !result.quantityUnit)throw new Error('Record the inventory unit when entering a quantity or reorder threshold.');
    for(const key of ['baseMaterialId','modification','pvcContent','backing','preparation'])result[key]=text(r[key] || '',key);
    if(result.baseMaterialId && !result.modification)throw new Error('Describe what changed from the baseline material.');
    return result;
  });
  const materialIds=new Set(materials.map(r=>r.id));
  const materialById=new Map(materials.map(m=>[m.id,m]));
  for(const m of materials){const seen=new Set([m.id]);let parent=m.baseMaterialId;while(parent){if(!materialIds.has(parent) || seen.has(parent))throw new Error('Choose an existing baseline material without a circular link.');seen.add(parent);parent=materialById.get(parent).baseMaterialId;}}
  const prototypes=value.prototypes.map(r=>{
    const result={...base(r,'Prototype name / version'),materialId:text(r.materialId,'Primary material',true),batch:text(r.batch || '','Prototype batch'),stage:choice(r.stage,prototypeStages,'prototype stage'),nextAction:text(r.nextAction || '','Next action'),nextDate:date(r.nextDate,'Next action date')};
    if(!materialIds.has(result.materialId))throw new Error('Choose an existing material for the prototype.');
    if(r.photos!==undefined && (!Array.isArray(r.photos) || r.photos.length>3))throw new Error('Use at most three photos per prototype.');
    const photoIds=new Set();result.photos=(r.photos || []).map(p=>{const id=text(p.id,'Photo ID',true);if(photoIds.has(id))throw new Error('Photo IDs must be unique within a prototype.');photoIds.add(id);return {id,caption:text(p.caption || '','Photo caption'),date:date(p.date,'Photo date'),file:validatePhoto(p.file)};});
    return result;
  });
  const prototypeIds=new Set(prototypes.map(r=>r.id));
  const tests=value.tests.map(r=>{
    const result={...base(r,'Test name'),targetKind:choice(r.targetKind,['material','prototype'],'test target type'),targetId:text(r.targetId,'Test target',true),category:choice(r.category,testCategories,'test category'),status:choice(r.status,testStatuses,'test status'),evidence:choice(r.evidence,evidenceTypes,'evidence type'),date:date(r.date,'Test / planned date',r.status==='Complete'),method:text(r.method || '','Method / standard'),conditions:text(r.conditions || '','Conditions'),operator:text(r.operator || '','Tester / lab'),sampleSize:number(r.sampleSize,'Sample size',true),result:number(r.result,'Numeric result',false,true),unit:text(r.unit || '','Result unit'),qualitative:text(r.qualitative || '','Qualitative result'),criterion:text(r.criterion || '','Recorded criterion'),outcome:choice(r.outcome,outcomes,'recorded outcome'),sourceRef:text(r.sourceRef || '','Test report / source reference'),file:null};
    if(!(result.targetKind==='material'?materialIds:prototypeIds).has(result.targetId))throw new Error('Choose an existing material or prototype for this test.');
    if(result.sampleSize!==null && !Number.isSafeInteger(result.sampleSize))throw new Error('Sample size must be a whole number.');
    if(result.result!==null && !result.unit)throw new Error('A numeric result needs its unit.');
    if(result.status==='Complete' && (!result.method || !result.conditions || !result.operator || result.sampleSize===null || (result.result===null && !result.qualitative)))throw new Error('Completed tests need a date, method, conditions, tester/lab, sample size, and numeric or qualitative result.');
    if(result.evidence==='Independent lab report' && result.status==='Complete' && !result.sourceRef)throw new Error('An independent lab result needs a report ID or source reference.');
    if(result.outcome!=='Not assessed' && (!result.criterion || result.status!=='Complete'))throw new Error('An assessed outcome requires a completed test and an explicit recorded criterion.');
    result.dueDate=date(r.dueDate===undefined?(r.status!=='Complete'?r.date:''):r.dueDate,'Test due date');
    result.retestOf=text(r.retestOf || '','Previous test');result.changeMade=text(r.changeMade || '','Design change / change to test');
    if(r.file) {
      if(!['application/pdf','image/png','image/jpeg'].includes(r.file.type) || typeof r.file.data!=='string' || r.file.data.length>1400000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(r.file.data))throw new Error('Attach a PDF, PNG, or JPEG report no larger than 1 MB.');
      let bytes;try{bytes=atob(r.file.data);}catch{throw new Error('Report attachment is not valid base64.');}
      const signature=r.file.type==='application/pdf'?bytes.startsWith('%PDF-'):r.file.type==='image/png'?bytes.startsWith('\x89PNG\r\n\x1a\n'):bytes.startsWith('\xff\xd8\xff');
      if(!signature || bytes.length>1024*1024)throw new Error('The report file contents do not match PDF, PNG, or JPEG format, or exceed 1 MB.');
      result.file={name:text(r.file.name,'Report filename',true),type:r.file.type,data:r.file.data};
    }
    return result;
  });
  const testById=new Map(tests.map(t=>[t.id,t]));
  for(const t of tests) {
    if(t.retestOf){const prior=testById.get(t.retestOf);if(!prior || prior.id===t.id || prior.status!=='Complete')throw new Error('A retest must link to a different, completed test.');if(!t.changeMade)throw new Error('Describe the design change or reason for the retest.');if((t.status==='Complete' && t.date<prior.date) || (t.dueDate && t.dueDate<prior.date))throw new Error('Retesting dates cannot be earlier than the previous test result.');}
    const seen=new Set([t.id]);let prior=t.retestOf;while(prior){if(seen.has(prior))throw new Error('Retest history cannot contain a cycle.');seen.add(prior);prior=testById.get(prior)?.retestOf;}
  }
  if(value.expenses!==undefined && (!Array.isArray(value.expenses) || value.expenses.length>500))throw new Error('Use at most 500 development expense entries.');
  const expenses=(value.expenses || []).map(r=>{
    const result={...base(r,'Expense description'),category:choice(r.category,expenseCategories,'expense category'),date:date(r.date,'Expense date',true),amountCents:r.amountCents,targetKind:choice(r.targetKind || 'project',['project','material','prototype','test'],'expense target'),targetId:text(r.targetId || '','Expense target'),sourceRef:text(r.sourceRef || '','Receipt / source reference')};
    if(!Number.isSafeInteger(result.amountCents) || result.amountCents<0 || result.amountCents>100000000000)throw new Error('Development costs must be a nonnegative USD amount with up to two decimal places.');
    const targets={material:materialIds,prototype:prototypeIds,test:new Set(testById.keys())};
    if(result.targetKind==='project')result.targetId='';else if(!targets[result.targetKind].has(result.targetId))throw new Error('Choose an existing record for the expense.');
    return result;
  });
  return {version:1,materials,prototypes,tests,expenses};
}
export function saveRecord(project,kind,record) {const next=structuredClone(project);const index=next[kind].findIndex(r=>r.id===record.id);if(index<0)next[kind].unshift(record);else next[kind][index]=record;return validateProject(next);}
export function compareBasis(materials,metric) {
  if(materials.length<2)return 'Select at least two materials to compare.';
  if(materials.some(m=>m[metric]===null))return 'Some figures are not recorded; no overall ranking is calculated.';
  if(metric==='cost')return new Set(materials.map(m=>m.costUnit)).size===1?'Same cost unit; check quote scope, thickness, quantity, and date before comparing.':'Cost units differ. Convert to a common basis before comparing.';
  return new Set(materials.map(m=>m.basis.trim().toLowerCase())).size===1?'Same stated measurement basis; verify methods, boundaries, and sources before drawing conclusions.':'Environmental measurement bases differ; these figures are not directly comparable.';
}
export function filteredTests(project,{query='',status='All statuses',evidence='All evidence'}={}) {
  return project.tests.filter(t=>(status==='All statuses' || t.status===status) && (evidence==='All evidence' || t.evidence===evidence) && [t.name,(t.targetKind==='material'?project.materials:project.prototypes).find(r=>r.id===t.targetId)?.name,t.category].join(' ').toLowerCase().includes(query.toLowerCase().trim()));
}
export function inventoryStatus(material) {return material.quantity===null?'Quantity not recorded':material.reorderAt===null?'Reorder level not set':material.quantity<=material.reorderAt?'Reorder needed':'In stock';}
export function scheduledTests(project,today) {return project.tests.filter(t=>t.status!=='Complete').sort((a,b)=>(a.dueDate || '9999').localeCompare(b.dueDate || '9999')).map(t=>({...t,schedule:t.dueDate?t.dueDate<today?'Overdue':t.dueDate===today?'Due today':'Upcoming':'Unscheduled'}));}
export function developmentCosts(project) {return {totalCents:project.expenses.reduce((sum,e)=>sum+e.amountCents,0),categories:expenseCategories.map(category=>({category,cents:project.expenses.filter(e=>e.category===category).reduce((sum,e)=>sum+e.amountCents,0)}))};}
export const demoProject=()=>validateProject({version:1,materials:[
  {id:'demo-ma',name:'Plant composite A',supplier:'Fictional supplier A',composition:'Illustrative plant-fiber composite',batch:'DEMO-A',thickness:1.1,cost:24,costUnit:'USD / m²',energy:null,carbon:null,basis:'',sourceType:'Supplier information',sourceRef:'Simulated example; not a real quote or supplier',notes:'Explore flexibility and finish consistency.'},
  {id:'demo-mb',name:'Plant composite B',supplier:'Fictional supplier B',composition:'Illustrative plant-fiber composite',batch:'DEMO-B',thickness:1.2,cost:28,costUnit:'USD / m²',energy:null,carbon:null,basis:'',sourceType:'Supplier information',sourceRef:'Simulated example; not a real quote or supplier',notes:'Investigate batch variation.'},
  {id:'demo-mc',name:'PU reference sample',supplier:'Fictional reference supplier',composition:'Illustrative polyurethane reference',batch:'DEMO-C',thickness:1,cost:18,costUnit:'USD / m²',energy:null,carbon:null,basis:'',sourceType:'Supplier information',sourceRef:'Simulated example; not a real quote or supplier',notes:'Reference only; not a recommended product.'}
],prototypes:[{id:'demo-pa',name:'Work glove A · v0.1',materialId:'demo-ma',batch:'DEMO-G1',stage:'Testing',nextAction:'Repeat the internal flexibility trial',nextDate:'',notes:'Fictional prototype for demonstration.'},{id:'demo-pb',name:'Work glove B · v0.1',materialId:'demo-mb',batch:'DEMO-G2',stage:'Preparing samples',nextAction:'Document the initial test protocol',nextDate:'',notes:'Fictional prototype for demonstration.'}],tests:[
  {id:'demo-ta',name:'Flexibility exploration',targetKind:'prototype',targetId:'demo-pa',category:'Flexibility',status:'Complete',evidence:'Internal test',date:'2026-11-17',method:'Fictional internal handling protocol v1',conditions:'Illustrative dry indoor handling exercise',operator:'Example researcher',sampleSize:3,result:3.5,unit:'score / 5',qualitative:'Illustrative rating only',criterion:'',outcome:'Not assessed',sourceRef:'Simulated data; not a safety or certification result',notes:'Repeat with a documented comparison method.',file:null},
  {id:'demo-tb',name:'Abrasion protocol planning',targetKind:'material',targetId:'demo-mb',category:'Abrasion',status:'Planned',evidence:'Internal test',date:'',method:'To be selected with a qualified tester',conditions:'',operator:'',sampleSize:null,result:null,unit:'',qualitative:'',criterion:'',outcome:'Not assessed',sourceRef:'',notes:'Select the appropriate standard and sample preparation.',file:null}
]});

// Material experiments stay distinct from tests of a finished prototype. Preserve every trial.
export function materialExperimentTests(project,ids){const selected=new Set(ids);return project.tests.filter(t=>t.targetKind==='material' && selected.has(t.targetId)).sort((a,b)=>a.category.localeCompare(b.category) || a.method.localeCompare(b.method) || a.date.localeCompare(b.date));}
