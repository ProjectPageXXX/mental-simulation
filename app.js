'use strict';
const data = window.PROJECT_DATA;
const labels = {physion:'Physion', clevrer:'CLEVRER', physicsiq:'Physics-IQ'};
const descriptions = {physion:'Contact prediction in simulated physical scenes.',clevrer:'Predicting future interactions between objects.',physicsiq:'Real-world physical interactions, shown from three viewpoints.'};
const clipLabels = {ctx:'Observed video',gen_v1:'Imagined future 1',gen_v2:'Imagined future 2',gen_v3:'Imagined future 3',upper:'Ground-truth future'};
function el(tag, className, text) { const node=document.createElement(tag); if(className)node.className=className; if(text!==undefined)node.textContent=text; return node; }
function button(text, handler) { const b=el('button','',text);b.type='button';b.addEventListener('click',handler);return b; }
function option(select, value, text) { const o=el('option','',text);o.value=value;select.append(o); }
let resultDataset=0,resultModel='all';
const datasetTabs=document.querySelector('#result-datasets'),modelTabs=document.querySelector('#result-models');
const chartColors=['#a4a8b2','#747986','#c4b5df','#ad96cf','#9479bd','#77559f','#80b9ed','#287aca'];
const chartMotion=matchMedia('(prefers-reduced-motion: reduce)');
let chartObserver;
function drawChart(dataset, model){
 const host=document.querySelector('#result-plot'),tip=document.querySelector('#chart-tooltip');
 host.replaceChildren();tip.hidden=true;if(chartObserver)chartObserver.disconnect();
 const NS='http://www.w3.org/2000/svg';
 function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
 const svg=node('svg',{viewBox:'0 0 1450 550',role:'group','aria-label':`${dataset} accuracy chart`});host.append(svg);
 const rows=data.results.tables[dataset],all=model==='all',bottom=430,scale=3.15;
 const label=(x,y,text,size=14,fill='#6e6e73',anchor='middle')=>{const t=node('text',{x,y,'font-size':size,fill,'text-anchor':anchor},text);svg.append(t);return t;};
 label(35,44,'Accuracy (%)',14,'#6e6e73','start');
 for(let v=0;v<=100;v+=20){const y=bottom-v*scale;svg.append(node('line',{x1:85,x2:1420,y1:y,y2:y,stroke:'#e8e8ed'}));label(65,y+5,String(v),13);}
 let series=all?[0,6,7]:[0,1,2,3,4,5,6,7];
 const legends=all?[[0,'Observed'],[6,'Visual–Independent'],[7,'Visual–Joint']]:[[0,'Observed'],[3,'Language simulation'],[7,'Visual simulation']];
 legends.forEach(([s,text],i)=>{const x=470+i*290;svg.append(node('rect',{x:x-12,y:27,width:13,height:13,rx:3,fill:chartColors[s]}));label(x+10,39,text,15,'#414147','start');});
 const positions=all?[0,1,2,3.6,4.6,5.6,7.2,8.2,9.2,10.8,11.8]:[0,.66,2.2,2.86,4.4,5.06,6.6,7.26];
 const xAt=p=>all?145+p*102:273+p*128;
 let barIndex=0;
 function bar(x,width,value,si,mi){
  const g=node('g',{class:'chart-bar',tabindex:0,role:'img','aria-label':`${data.results.models[mi]}, ${data.results.settings[si]}: ${value.toFixed(1)}%`});
  const rect=node('rect',{x,y:bottom-value*scale,width,height:value*scale,rx:3,fill:chartColors[si],class:'bar-fill'});
  rect.style.transformOrigin=`${x+width/2}px ${bottom}px`;rect.style.setProperty('--bar-delay',`${barIndex++*12}ms`);
  g.append(rect);g.append(node('rect',{x,y:bottom-100*scale,width,height:100*scale,fill:'transparent'}));
  g.append(node('text',{x:x+width/2,y:bottom-value*scale-9,'text-anchor':'middle','font-size':all?11:17,fill:'#515154'},value.toFixed(1)));
  svg.append(g);
  function show(event){
   tip.replaceChildren();const strong=document.createElement('strong');strong.textContent=value.toFixed(1)+'%';const detail=document.createElement('span');detail.textContent=`${data.results.models[mi]} · ${data.results.settings[si]}`;tip.append(strong,detail);tip.hidden=false;
   const box=document.querySelector('.result-figure').getBoundingClientRect(),target=g.getBoundingClientRect();
   const cx=event&&event.clientX!==undefined?event.clientX:target.x+target.width/2;
   const cy=event&&event.clientY!==undefined?event.clientY:target.y;
   tip.style.left=Math.max(8,Math.min(box.width-tip.offsetWidth-8,cx-box.left-tip.offsetWidth/2))+'px';tip.style.top=Math.max(8,cy-box.top-tip.offsetHeight-14)+'px';
  }
  g.addEventListener('pointerenter',show);g.addEventListener('pointermove',show);g.addEventListener('focus',()=>show());g.addEventListener('click',show);g.addEventListener('pointerleave',()=>tip.hidden=true);g.addEventListener('blur',()=>tip.hidden=true);
 }
 if(all){
  positions.forEach((p,mi)=>series.forEach((si,j)=>bar(xAt(p)+(j-1)*24-11,22,rows[si][mi],si,mi)));
  ['8B','32B','235B','low','gateway','max','2.5 Pro','3 Flash','3.7 Flash','5.2','5.6'].forEach((text,i)=>label(xAt(positions[i]),461,text));
  [[1,'Qwen3-VL'],[4.6,'Kimi-K3'],[8.2,'Gemini'],[11.3,'GPT']].forEach(([p,text])=>label(xAt(p),496,text,15));
 }else{
  const mi=Number(model);series.forEach(si=>bar(xAt(positions[si])-32,64,rows[si][mi],si,mi));
  ['Single','vote@3','Single','vote@3','Single','vote@3','Independent','Joint'].forEach((text,i)=>label(xAt(positions[i]),461,text));
  [[.33,'Observed'],[2.53,'Language–Structured'],[4.73,'Language–Future'],[6.93,'Visual']].forEach(([p,text])=>label(xAt(p),496,text,15));
 }
 label(750,535,(all?'All models':data.results.models[Number(model)])+' · '+(dataset==='Avg.'?'Average':dataset),15,'#414147');
 if(!chartMotion.matches){svg.classList.add('bars-waiting');chartObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){svg.classList.remove('bars-waiting');svg.classList.add('bars-entering');chartObserver.disconnect();}},{threshold:.15});chartObserver.observe(host);}
 chartMotion.onchange=()=>{if(chartMotion.matches){svg.classList.remove('bars-waiting','bars-entering');if(chartObserver)chartObserver.disconnect();}};
}

function renderPlot(){
 const name=Object.keys(data.results.tables)[resultDataset];
 drawChart(name,resultModel);
 datasetTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.value)===resultDataset)));
 modelTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===resultModel)));
}
['Average','Physion','CLEVRER','Physics-IQ'].forEach((name,i)=>{const b=button(name,()=>{resultDataset=i;renderPlot();});b.dataset.value=i;datasetTabs.append(b);});
const all=button('All models',()=>{resultModel='all';renderPlot();});all.dataset.value='all';modelTabs.append(all);
for(const [family,indices] of [['Qwen',[0,1,2]],['Kimi',[3,4,5]],['Gemini',[6,7,8]],['GPT',[9,10]]]){
 const group=el('div','model-family');group.setAttribute('role','group');group.setAttribute('aria-label',family);group.append(el('span','family-label',family));
 indices.forEach(i=>{const label=data.results.models[i].replace('Qwen3-VL-','').replace('Kimi-K3 ','').replace('Gemini-','').replace('GPT-','');const b=button(label,()=>{resultModel=String(i);renderPlot();});b.dataset.value=String(i);b.setAttribute('aria-label',data.results.models[i]);group.append(b);});modelTabs.append(group);
}
renderPlot();
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});

(() => {
 const video=document.querySelector('#teaser-video'),replay=document.querySelector('#teaser-replay');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let visible=false,userPaused=motion.matches,finished=false;
 video.muted=true;video.defaultMuted=true;video.loop=false;
 function play(){if(!document.hidden&&!finished)video.play().catch(()=>{});}
 replay.addEventListener('click',()=>{userPaused=false;finished=false;video.currentTime=0;play();});
 video.addEventListener('ended',()=>{finished=true;});
 new IntersectionObserver(entries=>entries.forEach(entry=>{visible=entry.isIntersecting;if(visible&&!userPaused)play();else video.pause();}),{threshold:0.1}).observe(video);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(visible&&!userPaused)play();});
 motion.addEventListener('change',()=>{if(motion.matches){userPaused=true;video.pause();}});
})();

// Content remains visible without JavaScript or when motion is reduced.
(() => {
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){if(!motion.matches)entry.target.classList.add('arriving');observer.unobserve(entry.target);}
 }),{threshold:0.08});
 document.querySelectorAll('.paper-header,.opening,#abstract,#method,#vlm-results>h2,#video-results>h2,.curated-panel>h3').forEach(node=>observer.observe(node));

})();
