import {LABELS,KEYS} from './model.js';
import {template} from './demos.js';
import {schedule,award,resultsCSV} from './game.js';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let worker,modelReady=false,inFlight=false,epoch=0,job=null,jobId=0;
let players=[],tasks=[],round=0,strokes=[],pointer=null,active=false,deadline=0,dirty=false,history=[],ready=false,practice=false,duration=20,rounds=6,stableHits=0,lastTop='',lastBeep=-1,audio;
const player=()=>players[round%players.length];
function screen(id){for(const s of ['home','play','result'])$(s).hidden=s!==id;window.scrollTo(0,0)}
function setStatus(message,state=''){$('modelStatus').textContent=message;$('modelStatus').parentElement.className='model-status '+state}
function tools(enabled){for(const id of ['undo','clear','skip','check'])$(id).disabled=!enabled}
function modelFailure(message){modelReady=false;active=false;pointer=null;inFlight=false;$('start').disabled=true;$('retryModel').hidden=false;tools(false);setStatus(message,'error');if(!$('play').hidden){$('gate').hidden=false;$('gateText').textContent='ЖИ қатесі. Қайта жүктеп көріңіз немесе басты бетке шығыңыз.';$('draw').disabled=true}}
function loadModel(){
 if(worker)worker.terminate();epoch++;inFlight=false;modelReady=false;$('start').disabled=true;$('retryModel').hidden=true;setStatus('Нейрожелі қосылуда…');
 try{worker=new Worker(new URL('./cnn-worker.js',import.meta.url),{type:'module'});worker.onerror=()=>modelFailure('ЖИ іске қосылмады. Сайтты HTTPS арқылы ашып, қайта жүктеңіз.');
 worker.onmessage=({data})=>{
  if(data.type==='progress')setStatus(data.message);
  if(data.type==='ready'){modelReady=true;$('start').disabled=false;setStatus('● DoodleNet дайын · 345 санатты танитын нейрожелі','ready');if(!$('play').hidden)prep();return}
  if(data.type==='error'){modelFailure(data.message);return}
  if(data.type==='prediction'){
   inFlight=false;if(!job||job.id!==data.id||job.epoch!==epoch||!active)return;
   if(!practice&&Date.now()>=deadline){finish(false);return}
   displayGuesses(data.predictions);
  }
 };worker.postMessage({type:'load'});
 }catch{modelFailure('Браузер нейрожелі модулін аша алмады. Chrome, Edge немесе Safari арқылы ашыңыз.')}
}
$('retryModel').onclick=loadModel;
function records(){try{const a=JSON.parse(localStorage.getItem('qazdraw-v2-records')||'[]');return Array.isArray(a)?a.filter(x=>typeof x.name==='string'&&Number.isFinite(x.score)&&Number.isFinite(x.rounds)&&x.rounds>0).slice(0,10):[]}catch{return []}}
function showRecords(){const r=records();$('records').replaceChildren();for(const x of r){const li=document.createElement('li');li.textContent=`${x.name}: ${x.score} ұпай · ${x.rounds} раунд · ${x.duration} сек.`;$('records').append(li)}if(!r.length)$('records').textContent='Алғашқы рекорд сенікі болуы мүмкін!'}
function beep(frequency=660){if(!$('sound').checked)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio??=new AC();audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14)}catch{}}
function paint(target=ctx,data=strokes,size=720){target.fillStyle='white';target.fillRect(0,0,size,size);target.strokeStyle='#153e35';target.lineWidth=size*.013;target.lineCap='round';target.lineJoin='round';for(const s of data){target.beginPath();s.forEach(([x,y],i)=>i?target.lineTo(x*size,y*size):target.moveTo(x*size,y*size));target.stroke()}}
function invalidate(){epoch++;dirty=false;pointer=null;stableHits=0;lastTop=''}
function resetInk(){invalidate();strokes=[];paint();$('predictions').replaceChildren();$('guess').textContent='Алғашқы сызықты күтемін…'}
function prep(){
 resetInk();$('draw').disabled=false;lastBeep=-1;$('practicePanel').hidden=!practice;$('skip').hidden=practice;
 $('score').textContent=practice?'Жаттығу: ұпай есептелмейді.':`${player().name}: ${player().score} ұпай`;
 $('roundLabel').textContent=practice?'УАҚЫТСЫЗ ЖАТТЫҒУ':`РАУНД ${Math.floor(round/players.length)+1} / ${rounds} · ${player().name}`;
 $('task').textContent=practice?`Байқап көр: ${LABELS[Number($('category').value)]}`:`Суретін сал: ${LABELS[tasks[round]]}`;
 $('clock').textContent=practice?'∞':duration;$('clock').classList.remove('urgent');$('progressBar').style.width='100%';
 if(practice){active=true;ready=false;tools(modelReady);$('gate').hidden=true;return}
 active=false;ready=true;tools(false);$('gate').hidden=false;$('gateText').textContent=`${player().name}, дайынсыз ба?`;$('draw').textContent='Сурет салуды бастау →';
}
$('mode').onchange=()=>{const free=$('mode').value==='practice';$('duration').disabled=free;$('rounds').disabled=free;$('names').disabled=free};
$('start').onclick=()=>{
 if(!modelReady)return;
 practice=$('mode').value==='practice';const group=$('mode').value==='group';const names=$('names').value.split(',').map(s=>s.trim().slice(0,24)).filter(Boolean);
 if(!practice&&(!names.length||(group&&(names.length<2||names.length>4)))){$('setupError').textContent=group?'Үтірмен бөлінген 2–4 есім жазыңыз.':'Ойыншы атын жазыңыз.';return}
 if(group&&new Set(names.map(n=>n.toLowerCase())).size!==names.length){$('setupError').textContent='Әр ойыншыға бөлек есім жазыңыз.';return}
 $('setupError').textContent='';players=(practice?['Жаттығу']:group?names:names.slice(0,1)).map(name=>({name,score:0}));duration=Number($('duration').value);rounds=Number($('rounds').value);tasks=practice?[]:schedule(players.length,rounds,KEYS.length);round=0;history=[];beep(440);screen('play');prep();
};
$('draw').onclick=()=>{
 if(!modelReady)return;
 if(!ready){round++;if(round>=tasks.length){results();return}prep();return}
 ready=false;$('gate').hidden=true;active=true;deadline=Date.now()+duration*1000;tools(true);beep(440);
};
function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]}
canvas.onpointerdown=e=>{if(!active||pointer!==null||strokes.length>=100)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);strokes.push([point(e)]);dirty=true;stableHits=0};
canvas.onpointermove=e=>{if(!active||pointer!==e.pointerId)return;const p=point(e),s=strokes.at(-1);if(s&&s.length<500&&strokes.reduce((a,s)=>a+s.length,0)<6000&&Math.hypot(p[0]-s.at(-1)[0],p[1]-s.at(-1)[1])>.002){s.push(p);dirty=true;paint()}};
const lift=e=>{if(pointer===e.pointerId){pointer=null;dirty=true}};canvas.onpointerup=lift;canvas.onpointercancel=lift;canvas.onlostpointercapture=lift;
$('clear').onclick=()=>{if(active)resetInk()};$('undo').onclick=()=>{if(!active)return;invalidate();strokes.pop();dirty=true;paint();$('predictions').replaceChildren();$('guess').textContent='Жаңа сызықты күтемін…'};
$('check').onclick=()=>{if(active)dirty=true};
function finish(won){
 if(!active||practice)return;active=false;pointer=null;tools(false);epoch++;
 const seconds=Math.max(0,(deadline-Date.now())/1000),points=award(won,seconds,duration);player().score+=points;
 history.push({name:player().name,label:LABELS[tasks[round]],won,points,seconds:Number((duration-seconds).toFixed(1)),image:canvas.toDataURL('image/png')});
 $('gateText').textContent=won?`Таптым! +${points} ұпай 🎉`:'Таба алмадым. Келесіде тағы байқап көр!';$('gate').hidden=false;$('draw').textContent=round+1===tasks.length?'Нәтижені көру →':'Келесі ойыншы / раунд →';$('score').textContent=`${player().name}: ${player().score} ұпай`;beep(won?880:220);
}
$('skip').onclick=()=>finish(false);
function displayGuesses(guesses){
 $('predictions').replaceChildren();if(!guesses.length){$('guess').textContent='Бірнеше анық сызық қосыңыз…';stableHits=0;return}
 const top=guesses[0];$('guess').textContent=top.score<.12?'Әзірге анық емес. Тағы сызық қосыңыз…':`Бұл ${top.name.toLowerCase()} сияқты…`;
 for(const g of guesses.slice(0,3)){const row=document.createElement('div');row.className='prediction';const a=document.createElement('span'),b=document.createElement('b');a.textContent=g.name;b.textContent=`${Math.round(g.score*100)}%`;row.append(a,b);$('predictions').append(row)}
 if(!practice&&top.key===KEYS[tasks[round]]&&top.score>=.22){stableHits=lastTop===top.key?stableHits+1:1;lastTop=top.key;if(stableHits>=2)finish(true);else dirty=true}else{stableHits=0;lastTop=top.key}
}
setInterval(()=>{
 if(!active)return;
 if(!practice){const left=Math.max(0,(deadline-Date.now())/1000);$('clock').textContent=Math.ceil(left);$('clock').classList.toggle('urgent',left<=5);$('progressBar').style.width=`${left/duration*100}%`;if(left<=0){finish(false);return}if(Math.ceil(left)<=3&&Math.ceil(left)!==lastBeep){lastBeep=Math.ceil(left);beep(330)}}
 if(dirty&&modelReady&&!inFlight){dirty=false;inFlight=true;job={id:++jobId,epoch};worker.postMessage({type:'predict',id:job.id,strokes})}
},350);
function results(){
 active=false;screen('result');$('ranking').replaceChildren();[...players].sort((a,b)=>b.score-a.score).forEach((p,i)=>{const row=document.createElement('p'),n=document.createElement('strong'),s=document.createElement('span');n.textContent=`${i+1}. ${p.name}`;s.textContent=`${p.score} ұпай`;row.append(n,s);$('ranking').append(row)});
 const won=history.filter(h=>h.won).length;$('summary').textContent=`${history.length} суреттің ${won} танылды (${Math.round(won/history.length*100)}%). Әр ойыншыға ${rounds} бірдей тапсырма, ${duration} секундтан.`;
 $('gallery').replaceChildren();history.forEach((h,i)=>{const d=document.createElement('div');d.className='card';const img=document.createElement('img');img.src=h.image;img.alt=h.label+' суреті';const name=document.createElement('p');name.textContent=`${h.name} · ${h.label}`;const score=document.createElement('p');score.textContent=h.won?`✓ Танылды · +${h.points}`:'○ Танылмады';const save=document.createElement('a');save.href=h.image;save.download=`qazdraw-${i+1}.png`;save.textContent='Суретті сақтау ↓';d.append(img,name,score,save);$('gallery').append(d)});
 try{localStorage.setItem('qazdraw-v2-records',JSON.stringify([...records(),...players.map(p=>({...p,rounds,duration}))].sort((a,b)=>b.score/b.rounds-a.score/a.rounds).slice(0,10)))}catch{}showRecords();
}
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([resultsCSV(history)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='QazDRAWAI-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)};
$('exit').onclick=()=>{active=false;invalidate();screen('home')};$('again').onclick=()=>$('start').click();$('back').onclick=()=>screen('home');
LABELS.forEach((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=name;$('category').append(o)});
$('category').onchange=()=>{if(practice)prep()};
$('sample').onclick=()=>{const k=Number($('category').value);$('sampleTitle').textContent=LABELS[k]+' · үлгі';paint($('sampleCanvas').getContext('2d'),template(k,()=>.5),320);$('sampleDialog').showModal()};$('closeSample').onclick=()=>$('sampleDialog').close();
showRecords();paint();tools(false);loadModel();
