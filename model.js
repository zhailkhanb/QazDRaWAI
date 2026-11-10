// DoodleNet CNN inference in a worker: 6 convolutions, 3 max-pools, 2 dense layers.
// Weight layout follows the ml5 DoodleNet TensorFlow.js model (see licenses).
export const LABELS=['Күн','Үй','Ағаш','Балық','Жұлдыз','Қолшатыр','Кесе','Шеңбер','Алма','Ай','Бұлт','Найзағай','Кітап','Үшбұрыш','Шаршы','Көзілдірік'];
export const KEYS=['sun','house','tree','fish','star','umbrella','mug','circle','apple','moon','cloud','lightning','book','triangle','square','eyeglasses'];
const ALIASES={coffee_cup:'mug',cup:'mug'};
export function canonical(key){return ALIASES[key]||key}
const extra={cat:'Мысық',dog:'Ит',bird:'Құс',flower:'Гүл',car:'Көлік',bicycle:'Велосипед',boat:'Қайық',mountain:'Тау',rain:'Жаңбыр',snowflake:'Қар ұшқыны',eye:'Көз',face:'Бет',smiley_face:'Күлімдеген бет',line:'Сызық',zigzag:'Ирек сызық',squiggle:'Шиыршық',triangle:'Үшбұрыш',square:'Шаршы',clock:'Сағат',fish:'Балық',tree:'Ағаш',cloud:'Бұлт',banana:'Банан',light_bulb:'Шам',pencil:'Қарындаш',scissors:'Қайшы',key:'Кілт',hand:'Қол',umbrella:'Қолшатыр',mushroom:'Саңырауқұлақ',table:'Үстел',chair:'Орындық',bed:'Төсек',phone:'Телефон',telephone:'Телефон',cell_phone:'Ұялы телефон',computer:'Компьютер',laptop:'Ноутбук',airplane:'Ұшақ',train:'Пойыз',bus:'Автобус',boat:'Қайық',sailboat:'Желкенді қайық',star:'Жұлдыз',sun:'Күн',moon:'Ай',house:'Үй',apple:'Алма',book:'Кітап',lightning:'Найзағай',eyeglasses:'Көзілдірік',mug:'Кесе',circle:'Шеңбер'};
export function translate(key){key=canonical(key);const index=KEYS.indexOf(key);return index>=0?LABELS[index]:extra[key]||`Басқа: ${key.replaceAll('_',' ')}`}
export function rankOutput(probabilities, classes){
 if(probabilities.length!==classes.length||probabilities.some(v=>!Number.isFinite(v)||v<0))throw new Error('Invalid model output');
 const merged=new Map();classes.forEach((name,i)=>{const key=canonical(name);merged.set(key,Math.max(merged.get(key)||0,probabilities[i]))});
 return [...merged].map(([key,score])=>({key,label:KEYS.indexOf(key),name:translate(key),score})).sort((a,b)=>b.score-a.score);
}
export function rasterize(strokes){
 if(!Array.isArray(strokes)||strokes.length>100) return null;
 const pts=strokes.flat();if(pts.length<2||pts.length>6000||pts.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))return null;
 let minX=1,minY=1,maxX=0,maxY=0;
 for(const [x,y] of pts){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
 const side=Math.max(maxX-minX,maxY-minY);if(side<.025)return null;
 const segments=[];let length=0;
 for(const stroke of strokes){let previous=null;for(const [x,y] of stroke){const point=[2+(x-minX)/side*24+(1-(maxX-minX)/side)*12,2+(y-minY)/side*24+(1-(maxY-minY)/side)*12];if(previous){const dx=point[0]-previous[0],dy=point[1]-previous[1],len=dx*dx+dy*dy;if(len>.005){segments.push([previous[0],previous[1],dx,dy,len]);length+=Math.sqrt(len)}}previous=point}}
 if(length<3)return null;
 const out=new Float32Array(784);
 // Supersampled stroke-distance coverage: black background, white ink, 28x28.
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){let count=0;for(const oy of [.25,.75])for(const ox of [.25,.75]){for(const [ax,ay,dx,dy,len] of segments){const px=x+ox-ax,py=y+oy-ay,t=Math.max(0,Math.min(1,(px*dx+py*dy)/len));if((px-t*dx)**2+(py-t*dy)**2<.65**2){count++;break}}}out[y*28+x]=count/4}
 return out;
}
export function conv(input,size,channels,filters,kernel,bias){
 const out=new Float32Array(size*size*filters);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const base=(y*size+x)*filters;out.set(bias,base);
  for(let ky=0;ky<3;ky++){const iy=y+ky-1;if(iy<0||iy>=size)continue;
   for(let kx=0;kx<3;kx++){const ix=x+kx-1;if(ix<0||ix>=size)continue;
    let src=(iy*size+ix)*channels,weight=(ky*3+kx)*channels*filters;
    for(let c=0;c<channels;c++){const v=input[src+c];if(v!==0)for(let f=0;f<filters;f++)out[base+f]+=v*kernel[weight+c*filters+f]}
   }
  }
  for(let f=0;f<filters;f++)out[base+f]=Math.max(0,out[base+f]);
 }return out;
}
export function pool(input,size,channels){const n=Math.floor(size/2),out=new Float32Array(n*n*channels);for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(let c=0;c<channels;c++){const i=(y*2*size+x*2)*channels+c;out[(y*n+x)*channels+c]=Math.max(input[i],input[i+channels],input[i+size*channels],input[i+(size+1)*channels])}return out}
export function dense(input,units,kernel,bias,tanh=false){const out=Float32Array.from(bias);for(let i=0;i<input.length;i++)for(let u=0;u<units;u++)out[u]+=input[i]*kernel[i*units+u];if(tanh)for(let u=0;u<units;u++)out[u]=Math.tanh(out[u]);return out}
export function softmax(logits){const max=Math.max(...logits),out=Float32Array.from(logits,v=>Math.exp(v-max)),sum=out.reduce((a,b)=>a+b,0);for(let i=0;i<out.length;i++)out[i]/=sum;return out}
export class DoodleCNN {
 constructor(buffer){
  if(buffer.byteLength!==2176804)throw new Error('Model weights are incomplete');
  const view=new DataView(buffer);let offset=0;
  const take=n=>{const a=new Float32Array(n);for(let i=0;i<n;i++){a[i]=view.getFloat32(offset,true);offset+=4;if(!Number.isFinite(a[i]))throw new Error('Invalid model weights')}return a};
  this.layers=[];for(const [input,output] of [[1,16],[16,16],[16,32],[32,32],[32,64],[64,64]])this.layers.push({input,output,kernel:take(9*input*output),bias:take(output)});
  this.hidden={kernel:take(576*512),bias:take(512)};this.output={kernel:take(512*345),bias:take(345)};
  if(offset!==buffer.byteLength)throw new Error('Unexpected model layout');
 }
 predict(image){if(!(image instanceof Float32Array)||image.length!==784)throw new Error('Expected 28x28 pixels');let x=image,size=28;this.layers.forEach((layer,i)=>{x=conv(x,size,layer.input,layer.output,layer.kernel,layer.bias);if(i%2===1){x=pool(x,size,layer.output);size=Math.floor(size/2)}});x=dense(x,512,this.hidden.kernel,this.hidden.bias,true);return softmax(dense(x,345,this.output.kernel,this.output.bias));}
}
