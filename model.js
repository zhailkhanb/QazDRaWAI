/* Experimental radial-basis-function network. No task/target is passed to inference.
   Inputs: 24x24 normalized distance field; hidden units: synthetic prototypes;
   output: mean of the three strongest Gaussian activations per class. */
export const LABELS=['Күн','Үй','Ағаш','Балық','Жұлдыз','Қолшатыр','Кесе','Шеңбер'];
export function template(k,r=Math.random){
 const j=()=> (r()-.5)*.045, p=(x,y)=>[x+j(),y+j()];
 const line=a=>a.map(([x,y])=>p(x,y));
 const ellipse=(x,y,rx,ry)=>Array.from({length:49},(_,i)=>p(x+rx*Math.cos(i*Math.PI/24),y+ry*Math.sin(i*Math.PI/24)));
 switch(k){
 case 0:return [ellipse(.5,.5,.22,.22),...Array.from({length:8},(_,i)=>{let a=i*Math.PI/4;return line([[.5+.31*Math.cos(a),.5+.31*Math.sin(a)],[.5+.45*Math.cos(a),.5+.45*Math.sin(a)]])})];
 case 1:return [line([[.14,.44],[.5,.12],[.86,.44],[.14,.44]]),line([[.23,.44],[.23,.88],[.77,.88],[.77,.44]]),line([[.43,.88],[.43,.64],[.59,.64],[.59,.88]])];
 case 2:return [line([[.5,.08],[.16,.47],[.32,.47],[.1,.72],[.9,.72],[.68,.47],[.84,.47],[.5,.08]]),line([[.44,.72],[.44,.93],[.56,.93],[.56,.72]])];
 case 3:return [ellipse(.42,.5,.3,.22),line([[.69,.5],[.92,.25],[.92,.75],[.69,.5]]),ellipse(.28,.45,.025,.025)];
 case 4:return [Array.from({length:11},(_,i)=>{let a=-Math.PI/2+i*Math.PI/5,rad=i%2?.19:.45;return p(.5+rad*Math.cos(a),.5+rad*Math.sin(a))})];
 case 5:return [Array.from({length:33},(_,i)=>{let a=Math.PI+i*Math.PI/32;return p(.5+.43*Math.cos(a),.5+.36*Math.sin(a))}),line([[.07,.5],[.93,.5]]),line([[.5,.5],[.5,.83],[.47,.91],[.39,.91],[.34,.84]])];
 case 6:return [line([[.2,.25],[.25,.83],[.7,.83],[.75,.25],[.2,.25]]),line([[.75,.36],[.91,.36],[.94,.47],[.9,.61],[.73,.61]])];
 default:return [ellipse(.5,.5,.43,.43)];
 }
}
export function features(strokes){
 const pts=strokes.flat();if(pts.length<2)return null;
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,s=Math.max(w,h);if(s<.015)return null;
 const ink=new Set();
 for(const stroke of strokes){for(let i=0;i<stroke.length;i++){let a=stroke[Math.max(0,i-1)],b=stroke[i];let steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/s*40));for(let t=0;t<=steps;t++){let px=Math.round(2+((a[0]+(b[0]-a[0])*t/steps-x)/s+(1-w/s)/2)*19),py=Math.round(2+((a[1]+(b[1]-a[1])*t/steps-y)/s+(1-h/s)/2)*19);ink.add(py*24+px)}}}
 const pixels=[...ink].map(i=>[i%24,Math.floor(i/24)]),out=new Float32Array(576);
 for(let i=0;i<576;i++){let d=100;for(const [px,py] of pixels)d=Math.min(d,(i%24-px)**2+(Math.floor(i/24)-py)**2);out[i]=Math.min(1,Math.sqrt(d)/8)}return out;
}
export class Network{
 constructor(random=Math.random){this.units=LABELS.flatMap((_,label)=>Array.from({length:12},()=>({label,x:features(template(label,random))})));}
 predict(strokes){const x=features(strokes);if(!x)return [];const acts=LABELS.map(()=>[]);for(const unit of this.units){let d=0;for(let i=0;i<x.length;i++)d+=(x[i]-unit.x[i])**2;acts[unit.label].push(Math.exp(-d/x.length/.018));}
 const raw=acts.map(a=>a.sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0)/3),sum=raw.reduce((a,b)=>a+b,0)||1;
 return raw.map((similarity,label)=>({label,name:LABELS[label],score:similarity/sum,similarity})).sort((a,b)=>b.score-a.score);}
}
