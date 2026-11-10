export function schedule(playerCount, rounds, categoryCount, random=Math.random) {
  if(!Number.isInteger(playerCount)||playerCount<1||playerCount>4||!Number.isInteger(rounds)||rounds<1||rounds>categoryCount) throw new RangeError('Invalid game settings');
  const bag=Array.from({length:categoryCount},(_,i)=>i);
  for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
  return bag.slice(0,rounds).flatMap(label=>Array(playerCount).fill(label));
}
export function award(won, remaining, duration) {
  return won ? 100+Math.round(100*Math.max(0,Math.min(duration,remaining))/duration) : 0;
}
export function csvCell(value) {
  let text=String(value);if(/^[\s]*[=+\-@]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function resultsCSV(history) {
  return '\ufeff'+[['Ойыншы','Раунд','Сурет','Танылды','Ұпай','Уақыт (секунд)'],...history.map((h,i)=>[h.name,i+1,h.label,h.won?'Иә':'Жоқ',h.points,h.seconds])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
