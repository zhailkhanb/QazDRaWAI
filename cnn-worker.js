import {DoodleCNN,rasterize,rankOutput} from './model.js';
import {CLASSES} from './classes.js';
import {MODEL_REVISION} from './model-config.js';
let model=null;
async function load(){
 const urls=['./weights.bin',`https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models@${MODEL_REVISION}/models/doodlenet/group1-shard1of1.bin`,`https://raw.githubusercontent.com/ml5js/ml5-data-and-models/${MODEL_REVISION}/models/doodlenet/group1-shard1of1.bin`];
 const errors=[];
 for(let i=0;i<urls.length;i++){
  postMessage({type:'progress',message:i===0?'Жергілікті модель тексерілуде…':`Нейрожелі жүктелуде · сервер ${i}/2…`});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const res=await fetch(urls[i],{signal:controller.signal});if(!res.ok)throw new Error(`HTTP ${res.status}`);const bytes=await res.arrayBuffer();if(bytes.byteLength!==2176804)throw new Error('Файл толық жүктелмеді');
   const header=new TextEncoder().encode(`blob ${bytes.byteLength}\0`),combined=new Uint8Array(header.length+bytes.byteLength);combined.set(header);combined.set(new Uint8Array(bytes),header.length);
   const digest=await crypto.subtle.digest('SHA-1',combined),hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!=='8f7730eaf33c3eef4abe8a7754d4ad0d8ae58316')throw new Error('Модельдің бақылау сомасы сәйкес емес');
   model=new DoodleCNN(bytes);const output=model.predict(new Float32Array(784));if(output.length!==345||output.some(x=>!Number.isFinite(x)))throw new Error('Модель өзіндік тексеруден өтпеді');
   postMessage({type:'ready'});return;
  }catch(e){errors.push(`${i}: ${e.message}`)}finally{clearTimeout(timer)}
 }
 throw new Error('Модель жүктелмеді. Интернетті тексеріп, қайта жүктеңіз. '+errors.join('; '));
}
onmessage=async ({data})=>{
 try{if(data.type==='load'){await load();return}if(data.type==='predict'){if(!model)throw new Error('Нейрожелі әлі дайын емес');const image=rasterize(data.strokes);const predictions=image?rankOutput(model.predict(image),CLASSES):[];postMessage({type:'prediction',id:data.id,predictions})}}
 catch(e){postMessage({type:'error',id:data.id,message:e.message})}
};
