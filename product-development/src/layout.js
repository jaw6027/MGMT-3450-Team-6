// Keep the daily workspace short while preserving the existing editors and records.
export function simplifyLayout(){
  const $=id=>document.getElementById(id);
  function fold(node,title,description,id){
    const details=document.createElement('details');details.className='lab-details';if(id)details.id=id;
    const summary=document.createElement('summary');
    const label=document.createElement('span');label.textContent=title;
    const hint=document.createElement('small');hint.textContent=description;
    summary.append(label,hint);details.append(summary);node.before(details);details.append(node);return details;
  }
  document.querySelector('.lab-hero').remove();
  document.querySelector('.page-heading p').textContent='Your next steps, material choices, and testing progress in one place.';
  fold(document.querySelector('.start-checklist'),'Getting started','View the step-by-step guide','getting-started');
  const metrics=$('metrics');
  const focus=document.createElement('section');focus.id='attention';focus.className='daily-focus';
  focus.innerHTML='<div class="section-heading"><div><p class="eyebrow">1 · WHAT NEEDS ATTENTION</p><h2>Your next steps</h2></div></div><p class="section-intro">Check upcoming tests and choose the next action for each prototype.</p>';
  metrics.after(focus);fold(metrics,'Project totals','View material, prototype, and record counts','project-totals');focus.append($('decisions'),$('planning'));
  $('decisions').querySelector('.section-heading').remove();
  $('planning').querySelector('.section-heading').remove();
  fold($('retest-history').closest('.workbench-section'),'Retesting history','View changes and follow-up evidence','retest-details');
  $('materials').querySelector('h2').textContent='Material comparison';
  const compare=document.createElement('div');$('comparison').before(compare);compare.append($('comparison'),$('basis-notes'));
  fold(compare,'Material details','View recorded properties, sources, and comparison notes','comparison-details');
  const test=$('testing'),records=document.createElement('div');
  const heading=test.querySelector('.section-heading');
  while(heading.nextSibling)records.append(heading.nextSibling);
  test.append(records);records.prepend($('export-tests'));
  const progress=document.createElement('div');progress.id='testing-progress';progress.className='testing-progress';progress.setAttribute('aria-live','polite');heading.after(progress);
  const note=document.createElement('p');note.className='section-intro';note.textContent='Track work in progress. A completed test is a recorded result, not a product certification.';progress.after(note);
  fold(records,'Test records & evidence','View results, search records, and plan retests','test-record-details');
  const tools=document.createElement('section');tools.id='more-tools';tools.innerHTML='<div class="section-heading"><h2>More tools, when you need them</h2></div><p class="section-intro">Open one section at a time. Your saved work stays available.</p>';test.after(tools);
  for(const [id,title,description] of [
    ['prototypes','Prototype notebook','View versions and add or update a prototype'],
    ['prototype-photos','Photos','View prototype photos and captions'],
    ['inventory','Inventory','View quantities and reorder reminders'],
    ['development-costs','Expenses','View spending and record development costs']
  ]){const node=$(id);tools.append(node);fold(node,title,description,`${id}-details`);}
  fold(tools,'More tools','View prototypes, photos, inventory, and expenses','more-tools-panel');
  $('material-rows').addEventListener('change',()=>{$('comparison-details').open=true;});
  const help=document.querySelector('.context-note');
  const guide=document.createElement('div');help.before(guide);guide.append(help);
  const p=document.createElement('p');p.className='section-intro';p.textContent='Saved records stay in this browser on this device. Use Download complete backup to keep a separate copy, Restore backup to recover it, and Sign in & share to create a progress report. Cloud sign-in needs one-time setup.';guide.prepend(p);
  fold(guide,'Help & saving your work','View a short guide to saving, sharing, and interpreting evidence','help');
  document.querySelector('nav').innerHTML='<a class="active" href="#attention">◫ Next steps</a><a href="#materials">◇ Materials</a><a href="#testing">▥ Test progress</a><a href="#more-tools">▤ More tools</a><a href="#help">? Help</a>';
  // Navigation into a folded section must reveal the target before scrolling.
  function reveal(hash){if(!hash?.startsWith('#'))return;const target=document.getElementById(hash.slice(1));if(!target)return;let node=target;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}return target;}
  document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(link)reveal(link.getAttribute('href'));});
  window.addEventListener('hashchange',()=>reveal(location.hash)?.scrollIntoView());reveal(location.hash);
  return {render(project){
    $('testing-progress').innerHTML=['Planned','In progress','Complete'].map(label=>{
      const count=project.tests.filter(t=>t.status===label).length;
      return `<article><strong>${count}</strong><span>${label==='Complete'?'Completed':label} tests</span></article>`;
    }).join('');
  }};
}
