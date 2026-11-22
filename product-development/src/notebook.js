const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// A short path into the existing records; the notebook uses the same saved project.
export function mountNotebook({getProject,isPersonal,openForm,compare}){
  const section=document.createElement('section');section.id='sample-notebook';
  section.innerHTML=`<div class="section-heading"><div><p class="eyebrow">LAURA’S EXPERIMENT NOTEBOOK</p><h2>Your sample notebook</h2></div><button class="button primary" id="notebook-add">+ Add a sample</button></div><p class="section-intro">Add your cactus material first. Keep each changed version as a separate sample.</p><div class="notebook-path"><span><b>1</b> Add a sample</span><span><b>2</b> Record a test</span><span><b>3</b> Compare results</span></div><div id="notebook-mode" class="notebook-mode"></div><label class="notebook-search" for="sample-search">Find a sample<input type="search" id="sample-search" placeholder="Search name, batch, PVC, or backing…"></label><p id="sample-count" class="planner-caption" aria-live="polite"></p><div id="sample-cards" class="sample-cards"></div>`;
  document.getElementById('attention-panel').before(section);
  document.querySelector('nav').insertAdjacentHTML('afterbegin','<a href="#sample-notebook">▤ Sample notebook</a>');
  document.querySelector('nav a.active')?.classList.remove('active');document.querySelector('nav a').classList.add('active');
  const $=id=>document.getElementById(id);
  $('notebook-add').addEventListener('click',()=>openForm('materials'));
  $('sample-search').addEventListener('input',render);
  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-sample-action]');if(!button)return;
    const p=getProject(),sample=p.materials.find(m=>m.id===button.dataset.sampleId);if(!sample)return;
    const action=button.dataset.sampleAction;
    if(action==='compare'){compare([sample.baseMaterialId,sample.id].filter(Boolean));return;}
    if(!isPersonal())return;
    if(action==='edit')openForm('materials',sample);
    if(action==='variation')openForm('materials',null,false,{name:`${sample.name} · new version`,baseMaterialId:sample.id});
    if(action==='test')openForm('tests',null,false,{targetKind:'material',targetId:sample.id});
  });
  function render(){
    const p=getProject(),personal=isPersonal(),query=$('sample-search').value.toLowerCase().trim();
    $('notebook-mode').textContent=personal?'Your notebook · saved in this browser. Download a complete backup to keep a separate copy.':'You are exploring fictional examples. Choose My project above to start your own empty notebook.';
    const samples=p.materials.filter(m=>[m.name,m.batch,m.composition,m.pvcContent,m.backing,m.modification].join(' ').toLowerCase().includes(query));
    $('sample-count').textContent=`${samples.length} of ${p.materials.length} samples${personal?'':' · demo examples'}`;
    const action=(m,key,label)=>`<button class="button" data-sample-id="${esc(m.id)}" data-sample-action="${key}" ${key!=='compare'&&!personal?'disabled':''}>${label}</button>`;
    $('sample-cards').innerHTML=samples.map(m=>{
      const tests=p.tests.filter(t=>t.targetKind==='material'&&t.targetId===m.id),completed=tests.filter(t=>t.status==='Complete').length,baseline=p.materials.find(b=>b.id===m.baseMaterialId);
      return `<article class="card sample-card"><span class="subtle-tag">${baseline?'CHANGED VERSION':'MATERIAL SAMPLE'}${personal?'':' · DEMO'}</span><h3>${esc(m.name)}</h3><p class="sample-batch">${esc(m.batch || 'Batch not recorded')}</p><details class="sample-details"><summary>Sample details &amp; changes</summary><dl>${[['Compared with',baseline?.name || 'No baseline linked'],['What changed',m.modification || 'Not recorded'],['PVC / coating',m.pvcContent || 'Not recorded'],['Backing',m.backing || 'Not recorded']].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><div class="sample-actions">${action(m,'variation','Add changed version')}${action(m,'edit','Edit sample')}</div></details><p class="sample-progress"><strong>${completed}</strong> completed · <strong>${tests.length-completed}</strong> pending material tests</p><div class="sample-actions">${action(m,'test','Record a test')}${action(m,'compare',baseline?'Compare with baseline':'View sample results')}</div></article>`;
    }).join('') || `<div class="card empty-state">${p.materials.length?'No samples match your search. Try another name or clear the search.':'Your notebook is ready. Use Add a sample to describe your first material. You can leave unknown details blank and add them later.'}</div>`;
  }
  return {render};
}
