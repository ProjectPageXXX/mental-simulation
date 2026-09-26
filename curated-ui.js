'use strict';
(() => {
 const data=window.CURATED_EXAMPLES;
 const datasetNames={physion:'Physion',clevrer:'CLEVRER',physicsiq:'Physics-IQ'};
 function answer(record){const good=record&&Number.isInteger(record.answer);const node=el('span',good?(record.correct?'answer-good':'answer-bad'):'answer-missing',good?String.fromCharCode(65+record.answer)+' '+(record.correct?'✓':'✗'):'—');node.setAttribute('aria-label',good?'Answer '+String.fromCharCode(65+record.answer)+', '+(record.correct?'correct':'incorrect'):'No valid answer');return node;}
 function build(id,items,comparison){
  const root=document.querySelector('#'+id);let index=0,visible=false,paused=false,generation=0;
  const subtitle=el('p','example-subtitle');subtitle.setAttribute('aria-live','polite');root.append(subtitle);
  const contextRow=el('div','context-question'),questionBlock=el('div','question-block');root.append(contextRow);const question=el('p','curated-question'),options=el('ul','curated-options');questionBlock.append(question,options);contextRow.append(questionBlock);
  let model='gpt56sol';const modelControl=el('label','curated-model','VLM '),modelSelect=el('select');modelSelect.setAttribute('aria-label','Generator comparison VLM');for(const key of ['gpt56sol','gemini37flash'])option(modelSelect,key,data.models[key]);modelControl.append(modelSelect);if(comparison)root.append(modelControl);
  const media=el('div','curated-media');root.append(media);
  const playback=el('div','playback'),status=el('span','status');status.setAttribute('role','status');
  function videos(){return Array.from(root.querySelectorAll('video'));}
  function load(){videos().forEach(v=>{if(v.dataset.src){v.src=v.dataset.src;delete v.dataset.src;v.load();}});}
  function pause(){generation++;videos().forEach(v=>v.pause());}
  async function play(restart=false){if(document.hidden)return;load();const token=++generation;status.textContent='';const results=await Promise.allSettled(videos().map(v=>{if(restart)v.currentTime=0;return v.play();}));if(token===generation&&results.some(r=>r.status==='rejected'))status.textContent='Press a video’s play control to start playback.';}
  playback.append(button('↻ Replay',()=>{paused=false;play(true);}),button('Pause',()=>{paused=true;pause();}),status);root.append(playback);
  const results=el('div','example-results');root.append(results);
  const pager=el('div','showcase-pager');const counter=el('span');counter.setAttribute('aria-live','polite');const prev=button('‹',()=>choose(index-1)),next=button('›',()=>choose(index+1));prev.setAttribute('aria-label','Previous example');next.setAttribute('aria-label','Next example');pager.append(prev,counter,next);root.append(pager);
  const thumbs=el('div',comparison?'quality-thumbnails':'example-thumbnails');thumbs.setAttribute('aria-label','Choose an example');
  const thumbButtons=[],qualityBadges=[];let goodGrid,badGrid;
  if(comparison){
   for(const good of [true,false]){const group=el('section','quality-group '+(good?'quality-good':'quality-bad'));const title=el('h4','','Human-rated LVP: '+(good?'Physically plausible':'Physically implausible'));title.append(el('span','quality-count','9 examples'));group.append(title);const grid=el('div','example-thumbnails');group.append(grid);thumbs.append(group);if(good)goodGrid=grid;else badGrid=grid;}
  }
  items.forEach((x,i)=>{const b=button('',()=>choose(i));b.title=datasetNames[x.dataset]+' · '+x.title;b.setAttribute('aria-label','Example '+(i+1)+': '+b.title);const img=el('img');img.src=comparison?x.generators.lvp.video.replace('.mp4','.jpg'):x.poster;img.alt='';img.loading='lazy';img.width=144;img.height=84;b.append(img,el('span','',String(i+1).padStart(2,'0')+' · '+datasetNames[x.dataset]));
   if(comparison){const badge=el('span','thumbnail-answer');b.append(badge);qualityBadges.push(badge);(x.generators.lvp.humanCorrect?goodGrid:badGrid).append(b);}else thumbs.append(b);thumbButtons.push(b);
  });root.append(thumbs);
  function createVideo(label,path){const cell=el('div','curated-video');cell.append(el('h4','',label));const video=el('video');video.controls=true;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.dataset.src=path;video.poster=path.replace('.mp4','.jpg');video.setAttribute('aria-label',label+' for '+items[index].title);cell.append(video);media.append(cell);return cell;}
  function render(){
   pause();videos().forEach(v=>{v.removeAttribute('src');v.load();});media.replaceChildren();contextRow.querySelector('.curated-video')?.remove();results.replaceChildren();status.textContent='';
   const x=items[index];subtitle.textContent=datasetNames[x.dataset]+' · '+x.title;question.textContent=x.question;options.replaceChildren();x.options.forEach((text,i)=>{const correct=i===x.gold;const item=el('li',correct?'option-correct':'',String.fromCharCode(65+i)+'. '+text+(correct?' ✓':''));if(correct)item.setAttribute('aria-label','Correct answer: '+item.textContent);options.append(item);});const observed=createVideo('Observed input',x.context);observed.classList.add('observed-video');contextRow.prepend(observed);
   if(comparison){
    for(const [g,label] of Object.entries(data.generators)){
     const record=x.generators[g],cell=createVideo(label,record.video);const prediction=el('p','clip-answer',data.models[model]+' · ');prediction.append(answer(record.answers[model]));cell.append(prediction);
     if(g==='lvp')cell.append(el('p','human-rating '+(record.humanCorrect?'human-correct':'human-incorrect'),'Human rating: '+(record.humanCorrect?'Physically plausible':'Physically implausible')));
    }
   }else{
    x.videos.forEach((path,i)=>createVideo('LVP imagined future '+(i+1),path));
    const table=el('table','method-answers'),caption=el('caption','','Recorded predictions · Table 1 inference settings');table.append(caption);
    const head=el('thead'),groups=el('tr');const modelHeader=el('th','','VLM');modelHeader.rowSpan=2;modelHeader.scope='col';groups.append(modelHeader);
    for(const title of ['Observed','Language–Structured','Language–Future','Visual']){const th=el('th','',title);th.colSpan=2;th.scope='colgroup';groups.append(th);}head.append(groups);
    const sub=el('tr');for(const title of ['Single','vote@3','Single','vote@3','Single','vote@3','Independent','Joint']){const th=el('th','',title);th.scope='col';sub.append(th);}head.append(sub);table.append(head);const body=el('tbody');
    for(const [m,label] of Object.entries(data.models)){const row=el('tr');const name=el('th','',label);name.scope='row';row.append(name);for(const method of Object.keys(data.methods)){const cell=el('td');cell.append(answer(x.answers[m][method]));row.append(cell);}body.append(row);}table.append(body);const scroll=el('div','answer-table-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label','Model predictions; scroll horizontally on small screens');scroll.append(table);results.append(scroll);

   }
   counter.textContent=(index+1)+' / '+items.length;thumbButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));if(comparison)qualityBadges.forEach((b,i)=>{const correct=items[i].generators.lvp.answers[model].correct;b.textContent='VLM '+(correct?'✓ Correct':'✗ Incorrect');b.className='thumbnail-answer '+(correct?'answer-good':'answer-bad');b.title=data.models[model]+' answer from this LVP clip';});
   if(visible){load();if(!paused)play(true);}
  }
  function choose(nextIndex){index=(nextIndex+items.length)%items.length;paused=false;render();if(!visible)subtitle.scrollIntoView({block:'start',behavior:'instant'});}
  modelSelect.addEventListener('change',()=>{model=modelSelect.value;render();});
  root.tabIndex=0;root.addEventListener('keydown',e=>{if(e.target.closest('button,select,video,summary'))return;if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();if(e.key===' ') {paused=!paused;if(paused)pause();else play();}else choose(index+(e.key==='ArrowLeft'?-1:1));}});
  new IntersectionObserver(entries=>entries.forEach(e=>{visible=e.isIntersecting;if(visible){load();if(!paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play();}else{pause();}}),{threshold:0.1}).observe(media);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();}else if(visible&&!paused)play();});render();
 }
 build('reasoning-examples',data.main,false);build('generator-examples',data.comparison,true);
})();
