export const LABELS=['Күн','Үй','Ағаш','Балық','Жұлдыз','Қолшатыр','Кесе','Шеңбер','Алма','Ай','Бұлт','Найзағай','Кітап','Үшбұрыш','Шаршы','Көзілдірік'];
export function template(k,r=Math.random){
 const j=()=> (r()-.5)*.045, p=(x,y)=>[Math.max(0,Math.min(1,x+j())),Math.max(0,Math.min(1,y+j()))];
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
 case 7:return [ellipse(.5,.5,.43,.43)];
 case 8:return [Array.from({length:49},(_,i)=>{let a=i*Math.PI/24;return p(.5+.34*Math.sin(a)*(1+.12*Math.cos(a)),.55+.32*Math.cos(a))}),line([[.5,.24],[.55,.09],[.68,.06]])];
 case 9:return [[...Array.from({length:33},(_,i)=>{let a=i*Math.PI/32;return p(.65-.45*Math.sin(a),.5-.4*Math.cos(a))}),...Array.from({length:33},(_,i)=>{let a=Math.PI-i*Math.PI/32;return p(.65-.22*Math.sin(a),.5-.4*Math.cos(a))})]];
 case 10:return [line([[.2,.72],[.12,.68],[.08,.57],[.12,.46],[.24,.42],[.29,.25],[.41,.2],[.54,.25],[.6,.4],[.72,.34],[.85,.4],[.92,.54],[.88,.67],[.8,.72],[.2,.72]])];
 case 11:return [line([[.58,.06],[.2,.56],[.46,.56],[.36,.94],[.81,.38],[.55,.38],[.58,.06]])];
 case 12:return [line([[.5,.25],[.32,.14],[.08,.16],[.08,.8],[.31,.78],[.5,.9],[.71,.78],[.92,.8],[.92,.16],[.69,.14],[.5,.25],[.5,.9]])];
 case 13:return [line([[.5,.08],[.09,.86],[.91,.86],[.5,.08]])];
 case 14:return [line([[.12,.12],[.88,.12],[.88,.88],[.12,.88],[.12,.12]])];
 case 15:return [ellipse(.27,.5,.19,.19),ellipse(.73,.5,.19,.19),line([[.46,.5],[.54,.5]]),line([[.08,.5],[.02,.34]]),line([[.92,.5],[.98,.34]])];
 default:throw new RangeError('Unknown category');
 }
}
