type Point=[number,number];
type Place={name:string;door:Point;pin:Point;box:[number,number,number,number]};
declare const WORLD:{width:number;height:number;cell:number;rows:string[];places:Place[]};
type Entry={card:number;answer:string;submitted:boolean;rating:"got"|"review"|null};
type Run={node:number;tile?:number;facing?:Facing;screen:"map"|"quiz";started:boolean;cleared:boolean;remaining:number;entries:Entry[]};
const titles=["Variance across two groups","An exponential density","Three Normal measurements","A limit at zero","Integration by parts","A matrix polynomial","A growing sequence of events","A small change in two inputs","A three-object shuffle"];
const $=(id:string)=>document.getElementById(id)!;
const board=$("terrain"),view=$("view"),paper=$("paper"),popup=$("quiz") as HTMLDialogElement;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const {width:W,height:H,cell,rows,places}=WORLD,cols=rows[0].length;
const tileAt=(x:number,y:number)=>Math.floor(y/cell)*cols+Math.floor(x/cell);
const center=(id:number):Point=>[(id%cols)*cell+2,Math.floor(id/cols)*cell+2];
const openTile=(id:number)=>Number.isInteger(id)&&id>=0&&rows[Math.floor(id/cols)]?.[id%cols]===".";
// Later sessions get their own trail marker and save, even after all buildings have missions.
const lastAssigned=Math.max(6,...missions.map(stopFor));
if(lastAssigned>=6&&PACKS.length){
 const trail:number[]=[];
 for(let y=2;y<rows.length-2;y+=2)for(let x=2;x<cols-2;x+=2)if(rows[y][x]===".")trail.push(y*cols+x);
 for(let index=places.length;index<=lastAssigned+1;index++){
  let candidate=-1;
  for(const spacing of [54,34,19,8,4]){
   const start=(index*593)%trail.length;
   for(let j=0;j<trail.length;j++){
    const id=trail[(start+j)%trail.length],p=center(id);
    if(places.every(loc=>Math.hypot(loc.door[0]-p[0],loc.door[1]-p[1])>=spacing)){candidate=id;break;}
   }
   if(candidate>=0)break;
  }
  if(candidate<0)break;
  const door=center(candidate);places.push({name:"Trail camp "+(index-1),door,pin:[door[0],door[1]-8],box:[door[0]-6,door[1]-8,12,10]});
 }
}
const doors=places.map(p=>tileAt(...p.door));
const legacyStop=state.node===20||state.screen==="quiz"?1:state.node===42?2:state.node===56?3:0;
let tile=book.tile!==undefined&&openTile(book.tile)?book.tile:doors[legacyStop];
let here:Point=center(tile),facing:Facing=book.facing??state.facing??"south",stride=0,walking=false;
let deadline:number|null=null,reading=false,ending=false,feedbackTimer=0;
let path:number[]=[],goal=-1,leg:{from:Point;to:number;distance:number}|null=null,entryTime:number|null=null;
const keyDirections:Record<string,Facing>={arrowup:"north",w:"north",arrowdown:"south",s:"south",arrowleft:"west",a:"west",arrowright:"east",d:"east"};
const deltas:Record<Facing,number>={north:-cols,south:cols,west:-1,east:1};
const held:string[]=[];
const art=$("art") as HTMLImageElement, hero=$("hero") as HTMLCanvasElement, hc=hero.getContext("2d")!;
const fx=$("waterfx") as HTMLCanvasElement;fx.width=W;fx.height=H;
const water=fx.getContext("2d")!;
const waterFrames:HTMLCanvasElement[]=[];
let waterFrame=-1,lastTime=0,lastDock=-2,entryOpen=0,irisRadius=-1,heroFrame="";
function write(){state.tile=tile;state.facing=facing;try{book.runs[mission.date]=state;book.active=mission.date;book.tile=tile;book.facing=facing;localStorage.setItem(bookKey,JSON.stringify(book));queueCloud();$("warn").hidden=true;}catch{$("warn").hidden=false;$("warn").textContent="Saving is unavailable in this browser. Keep this tab open to retain your session.";}}
const minutes=(ms:number)=>{const n=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");};
const current=()=>state.entries.findIndex(e=>!e.rating);
function elapsed(){if(deadline!==null)state.remaining=Math.max(0,deadline-Date.now());}
function atPlace(){return doors.indexOf(tile);}
function standAt(i:number){tile=doors[i];here=center(tile);facing="south";leg=null;path=[];goal=-1;walking=false;drawHero();}
function pinXY(el:HTMLElement|SVGElement,p:Point){el.style.left=(100*p[0]/W)+"%";el.style.top=(100*p[1]/H)+"%";}
function size(){const w=Math.max(view.clientWidth,view.clientHeight*W/640);board.style.width=w+"px";board.style.height=2*Math.max(view.clientHeight,w/1.9)+"px";camera();}
function camera(){
 if(board.clientWidth>view.clientWidth+2)view.scrollLeft=board.clientWidth*here[0]/W-view.clientWidth*.48;
 if(board.clientHeight>view.clientHeight+2)view.scrollTop=board.clientHeight*here[1]/H-view.clientHeight*.55;
}
function drawHero(){
 const index=walking?Math.floor(stride/3.5)%4:0,frame=facing+index;
 if(frame!==heroFrame){if(trainerSheet.complete&&trainerSheet.naturalWidth){hc.clearRect(0,0,36,46);hc.drawImage(trainerSheet,[1,0,1,2][index]*36,spriteRow[facing]*46,36,46,0,0,36,46);heroFrame=frame;}}
 pinXY(hero,here);
}
function dock(){
 const which=atPlace(),p=places[which];lastDock=which;
 let title=p?.name??"Woodland trail",text="",btn="",action=()=>walkTo(doors[1]);
 const offered=which>0?availableAt(which):[];
 const latest=offered.at(-1);
 if(latest){
  const run=book.runs[latest.date];title=latest.name;
  if(run?.cleared){text="Completed · "+run.entries.filter(e=>e.rating==="got").length+" / "+run.entries.length+" correct";btn="Open field notebook";action=()=>{selectMission(latest);openJournal();};}
  else if(run?.started&&run.remaining<=0){text="Your work from this hour is saved.";btn="View session";action=()=>{selectMission(latest);openJournal();};}
  else{text="60 minute recall · "+latest.cards.length+" questions";btn=run?.started?"Resume mission →":"Enter mission →";action=()=>{selectMission(latest);enterDoor();};}
 }else if(which>1){const date=nextDate(which);title=p.name+" · Locked";text=unlocked(date)?"This mission is awaiting its quiz.":"Opens "+dateLabel(date)+" at 9 a.m. Pacific.";btn="Return to the mill";action=()=>walkTo(doors[1]);}
 else{text="Choose a checkpoint or explore the Birch Highlands to the south.";btn="Walk to the Old Mill →";}
 $("dock").innerHTML='<div class="eyebrow">'+(which===1?"Checkpoint 01":which>1?"Future checkpoint":"Island map")+'</div><h2>'+title+'</h2>'+(which>0?starLine(ratingStars(latest?book.runs[latest.date]:undefined)):'')+'<p>'+text+'</p><div class="actions"><button class="primary" id="action">'+btn+'</button></div><p class="keys">Arrow keys or WASD to walk · Click a destination</p>';
 $("action").onclick=action;
 for(const older of offered.slice(0,-1).reverse()){
  const btn=document.createElement("button");btn.className="secondary";btn.textContent=older.name+" · "+dateLabel(older.date)+" · "+ratingStars(book.runs[older.date])+"/5";
  btn.onclick=()=>{selectMission(older);if(state.cleared)openJournal();else enterDoor();};$("dock").append(btn);
 }
 $("flags").textContent=Object.values(book.runs).filter(r=>r.cleared).length+" / "+missions.filter(m=>m===mill||unlocked(m.date)).length+" cleared";
 for(let i=1;i<places.length;i++){
  const m=availableAt(i).at(-1),pin=$("pin"+i);
  pin.classList.toggle("locked",!m);pin.classList.toggle("available",!!m);
  const label=pin.querySelector("label")!;label.textContent=(m?"⚑ ":"🔒 ")+(m?.name??places[i].name);
  label.insertAdjacentHTML("beforeend",starLine(ratingStars(m?book.runs[m.date]:undefined)));
 }
 $("flag").toggleAttribute("hidden",!book.runs[mill.date]?.cleared);pinXY($("flag"),[588,302]);
 $("region-name").textContent=here[1]>=640?"Birch Highlands":"Mosswater Isle";
}
function neighbors(id:number){
 return [id+1,id-1,id+cols,id-cols].filter(n=>openTile(n)&&Math.abs(n%cols-id%cols)<=1);
}
function walkTo(target:number){
 if(account.open||popup.open||entryTime!==null||ending||!openTile(target))return;
 held.length=0;
 const start=leg?.to??tile;
 const parents=new Map<number,number>([[start,-1]]),queue=[start];
 for(let i=0;i<queue.length&&!parents.has(target);i++){
  for(const n of neighbors(queue[i]))if(!parents.has(n)){parents.set(n,queue[i]);queue.push(n);}
 }
 if(!parents.has(target))return;
 path=[];for(let n=target;n!==start;n=parents.get(n)!)path.push(n);path.reverse();
 if(path.length===0&&!leg){dock();return;}
 goal=target;const label=places[doors.indexOf(target)]?.name??"the trail";
 $("dock").innerHTML='<div class="eyebrow">On the trail</div><h2>Walking to '+label+'…</h2>';
}
function updateWalk(dt:number){
 // Finish the current grid step before turning, so changing direction cannot cut a corner.
 let remaining=dt*.103;
 if(reduced.matches&&goal>=0&&!held.length){tile=goal;here=center(tile);leg=null;path=[];goal=-1;walking=false;drawHero();camera();write();dock();return;}
 while(remaining>0){
  if(!leg){
   const key=held[held.length-1],dir=keyDirections[key];
   if(dir)facing=dir;
   const next=dir?tile+deltas[dir]:path.shift();
   if(next===undefined||!neighbors(tile).includes(next)){
    const stopped=walking||goal>=0;
    walking=false;goal=-1;stride=0;drawHero();
    if(stopped||lastDock!==atPlace()){write();dock();}
    return;
   }
   const diff=next-tile;facing=diff===1?"east":diff===-1?"west":diff===cols?"south":"north";
   leg={from:center(tile),to:next,distance:0};walking=true;
  }
  const amount=Math.min(remaining,cell-leg.distance);leg.distance+=amount;stride+=amount;remaining-=amount;
  const to=center(leg.to),t=leg.distance/cell;
  here=[leg.from[0]+(to[0]-leg.from[0])*t,leg.from[1]+(to[1]-leg.from[1])*t];
  if(leg.distance>=cell){tile=leg.to;leg=null;if(!path.length&&!held.length){walking=false;goal=-1;write();dock();}}
  drawHero();camera();
 }
}
function enterDoor(){
 if(atPlace()!==stopFor(mission)||entryTime!==null||popup.open)return;
 held.length=0;path=[];goal=-1;leg=null;facing="north";stride=0;walking=false;
 entryTime=performance.now();$("dock").innerHTML='<div class="eyebrow">Checkpoint 01</div><h2>Entering '+places[atPlace()].name+'…</h2>';
}
function animateDoor(now:number){
 const t=reduced.matches?1.4:(now-entryTime!)/1000;
 entryOpen=Math.min(1,t/.26);
 const walk=Math.max(0,Math.min(1,(t-.24)/.58));
 walking=walk>0&&walk<1;stride=walk*18;const door=places[stopFor(mission)].door;here=[door[0],door[1]-walk*15];drawHero();
 hero.style.opacity=String(Math.min(1,(1-walk)*3));hero.style.clipPath="inset("+Math.max(0,walk-.45)*90+"% 0 0 0)";
 const iris=$("iris");
 if(t>.7){
  const pos=board.getBoundingClientRect(),x=pos.left+door[0]/W*pos.width,y=pos.top+(door[1]-17)/H*pos.height;
  irisRadius=Math.max(0,1-(t-.7)/.51)*Math.hypot(innerWidth,innerHeight);
  iris.hidden=false;iris.style.background='radial-gradient(circle at '+x+'px '+y+'px,transparent '+irisRadius+'px,#192c29 '+(irisRadius+2)+'px)';
 }
 if(t>=1.23){
  entryTime=null;entryOpen=0;iris.hidden=true;hero.style.clipPath="";hero.style.opacity="1";standAt(stopFor(mission));waterFrame=-1;enter();
 }
}
function mapFrame(now:number){
 const dt=lastTime?Math.min(48,now-lastTime):0;lastTime=now;
 if(!popup.open&&!document.hidden){
  if(entryTime!==null)animateDoor(now);
  else if(leg||path.length||held.length||walking)updateWalk(dt);
  paintWater(now);
 }
 requestAnimationFrame(mapFrame);
}
function installMap(){
 places.forEach((p,i)=>{
  const b=document.createElement("button");b.id="pin"+i;b.className="mark "+(i===1?"available":i>1?"future":"");b.setAttribute("aria-label","Walk to "+p.name);b.innerHTML="<label>"+(i===1?"⚑ ":"")+p.name+"</label>";pinXY(b,p.pin);b.onclick=e=>{e.stopPropagation();walkTo(doors[i]);};$("pins").append(b);
 });
 board.onclick=e=>{
  const r=board.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
  const i=places.findIndex(({box:[a,b,w,h]})=>x>=a&&y>=b&&x<=a+w&&y<=b+h);
  if(i>=0){walkTo(doors[i]);return;}
  const nearest=tileAt(x,y);if(openTile(nearest)){walkTo(nearest);return;}
  let best=-1,dist=11;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const n=nearest+dy*cols+dx;if(openTile(n)){const p=center(n),d=Math.hypot(p[0]-x,p[1]-y);if(d<dist){dist=d;best=n;}}}
  if(best>=0)walkTo(best);
 };
 window.addEventListener("keydown",e=>{
  if(account.open||popup.open||entryTime!==null||ending||e.ctrlKey||e.metaKey||e.altKey)return;
  const key=e.key.toLowerCase();
  if(keyDirections[key]){e.preventDefault();if(!held.includes(key)){held.push(key);path=[];goal=-1;}return;}
  if((key==="enter"||key===" ")&&atPlace()>0&&!e.repeat&&!(document.activeElement instanceof HTMLButtonElement)){e.preventDefault();$("action")?.click();}
 });
 window.addEventListener("keyup",e=>{const i=held.indexOf(e.key.toLowerCase());if(i>=0)held.splice(i,1);});
 window.addEventListener("blur",()=>{held.length=0;});
 window.addEventListener("pagehide",()=>{if(state.screen==="map"&&!reading&&(leg||walking))write();});
}
