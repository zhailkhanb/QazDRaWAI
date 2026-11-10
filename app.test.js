import {test} from 'node:test';import assert from 'node:assert/strict';import {LABELS,KEYS} from './model.js';
test('game waits for model, handles stale predictions and awards only once',async()=>{
 const elements=new Map(),context={fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 class Element{constructor(){this.hidden=false;this.disabled=false;this.value='';this.children=[];this.parentElement={};this.classList={remove(){},toggle(){}};this.style={};this.textContent=''}append(...els){this.children.push(...els)}replaceChildren(){this.children=[]}getContext(){return context}getBoundingClientRect(){return {left:0,top:0,width:720,height:720}}setPointerCapture(){}toDataURL(){return 'data:image/png;base64,TEST'}click(){if(!this.disabled)this.onclick?.()}showModal(){}close(){}}
 const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id)};
 globalThis.document={getElementById:get,createElement:()=>new Element()};globalThis.window={scrollTo(){}};
 const stored=new Map();globalThis.localStorage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)};
 const intervals=[],oldInterval=globalThis.setInterval;globalThis.setInterval=cb=>{intervals.push(cb);return 1};
 class FakeWorker{constructor(){FakeWorker.last=this;this.sent=[]}postMessage(m){this.sent.push(m)}terminate(){}}
 globalThis.Worker=FakeWorker;get('mode').value='solo';get('names').value='Аян';get('duration').value='20';get('rounds').value='3';get('category').value='0';get('play').hidden=true;get('result').hidden=true;
 try{
  await import('./app.js');const w=FakeWorker.last;
  assert.equal(get('start').disabled,true);assert.equal(w.sent[0].type,'load');
  w.onmessage({data:{type:'ready'}});assert.equal(get('start').disabled,false);
  get('start').click();assert.equal(get('play').hidden,false);get('draw').click();
  const draw=()=>{get('canvas').onpointerdown({pointerId:1,clientX:100,clientY:100,preventDefault(){}});get('canvas').onpointermove({pointerId:1,clientX:600,clientY:600});get('canvas').onpointerup({pointerId:1})};
  draw();intervals[0]();let request=w.sent.at(-1);assert.equal(request.type,'predict');
  const label=LABELS.findIndex(n=>get('task').textContent.endsWith(n)),prediction={key:KEYS[label],name:LABELS[label],score:.9};
  get('clear').click();w.onmessage({data:{type:'prediction',id:request.id,predictions:[prediction]}});assert.equal(get('gate').hidden,true);assert.equal(get('guess').textContent,'Алғашқы сызықты күтемін…');
  draw();intervals[0]();request=w.sent.at(-1);w.onmessage({data:{type:'prediction',id:request.id,predictions:[prediction]}});assert.equal(get('gate').hidden,true);
  intervals[0]();request=w.sent.at(-1);w.onmessage({data:{type:'prediction',id:request.id,predictions:[prediction]}});assert.equal(get('gate').hidden,false);const score=get('score').textContent;
  w.onmessage({data:{type:'prediction',id:request.id,predictions:[prediction]}});assert.equal(get('score').textContent,score);
  get('exit').click();get('mode').value='practice';get('start').click();assert.equal(get('clock').textContent,'∞');assert.equal(get('gate').hidden,true);assert.equal(get('skip').hidden,true);
  w.onmessage({data:{type:'error',message:'Модель жүктелмеді'}});assert.equal(get('start').disabled,true);assert.equal(get('retryModel').hidden,false);assert.equal(get('draw').disabled,true);
 }finally{globalThis.setInterval=oldInterval;delete globalThis.Worker;delete globalThis.document;delete globalThis.window;delete globalThis.localStorage}
});
