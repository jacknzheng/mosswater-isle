// Paints the island in three stacked layers: moving water, the ground, and everything that
// stands on it. Standing things are drawn from the top of the map down, so whatever is lower
// on screen overlaps what is behind it.
const sheet=$("tiles") as HTMLImageElement;
function layer(id:string){const c=$(id) as HTMLCanvasElement;c.width=W;c.height=H;const ctx=c.getContext("2d")!;ctx.imageSmoothingEnabled=false;return ctx;}
const sea=layer("waterfx"),land=layer("ground"),stage=layer("sprites");
const TICK=125,half=cell/2;
let waves:CanvasPattern[]=[],ready=false,painted="";
function draw(ctx:CanvasRenderingContext2D,name:string,x:number,y:number){const t=TILES[name];ctx.drawImage(sheet,t[0],t[1],t[2],t[3],x,y,t[2],t[3]);}
/** Draw one tile of an edged terrain from four quarter tiles chosen by its neighbors. */
function edged(ctx:CanvasRenderingContext2D,name:string,x:number,y:number,family:string){
 const t=TILES[name];let full=true;
 for(let corner=0;corner<4;corner++){
  const sx=corner&1?1:-1,sy=corner>>1?1:-1;
  const side=family.includes(charAt(x+sx,y)),up=family.includes(charAt(x,y+sy)),diagonal=family.includes(charAt(x+sx,y+sy));
  const state=!side&&!up?0:!side?1:!up?2:!diagonal?3:4;if(state<4)full=false;
  ctx.drawImage(sheet,t[0]+state*half,t[1]+corner*half,half,half,x*cell+(corner&1)*half,y*cell+(corner>>1)*half,half,half);
 }
 return full;
}
function prepareWorld(){
 for(let y=0;y<lines;y++)for(let x=0;x<cols;x++){const r=noise(x,y,4);draw(land,"grass_"+(r<.3?0:r<.55?1:r<.75?2:r<.83?3:r<.93?4:5),x*cell,y*cell);}
 for(let y=0;y<lines;y++)for(let x=0;x<cols;x++){
  const ch=grid[y][x];
  if(ch===","){if(edged(land,"path",x,y,PATHY)&&noise(x,y,5)<.6)draw(land,"sand_"+(1+Math.floor(noise(x,y,6)*2)),x*cell,y*cell);}
  else if(ROCKY.includes(ch))edged(land,"rock",x,y,ROCKY);
  else if(ch==="c")draw(land,"soil",x*cell,y*cell);
 }
 for(let y=0;y<lines;y++)for(let x=0;x<cols;x++){
  const ch=grid[y][x];if(!WATERY.includes(ch))continue;
  land.globalCompositeOperation="destination-out";edged(land,"water_mask",x,y,WATERY);
  land.globalCompositeOperation="source-over";edged(land,"water_rim",x,y,WATERY);
  if(ch==="="||ch==="D")draw(land,"deck",x*cell,y*cell);
 }
 land.fillStyle="#0c1c1638";
 for(let y=0;y<lines;y++)for(let x=0;x<cols;x++){
  if(grid[y][x]==="H")draw(land,"stairs",x*cell,y*cell);
  // Rock walls throw a short shadow on the ground below them.
  else if(!ROCKY.includes(grid[y][x])&&!WATERY.includes(grid[y][x])&&charAt(x,y-1)==="#"){land.fillRect(x*cell,y*cell,cell,4);land.fillRect(x*cell,y*cell,cell,7);}
 }
 for(let f=0;f<4;f++){
  const tile=document.createElement("canvas"),t=TILES["water_"+f];tile.width=t[2];tile.height=t[3];
  tile.getContext("2d")!.drawImage(sheet,t[0],t[1],t[2],t[3],0,0,t[2],t[3]);waves.push(sea.createPattern(tile,"repeat")!);
 }
 seedLife();ready=true;
}

// ---------- Things that move ----------
type Duck={x:number;y:number;to:number;left:boolean};
type Moth={home:Point;color:string;phase:number};
const ducks:Duck[]=[],moths:Moth[]=[];
let puffs:{x:number;y:number;born:number}[]=[],bird:{x:number;y:number;dx:number;dy:number}|null=null,nextBird=0,lifeTick=-1;
function seedLife(){
 // Ducks keep to open water away from the banks.
 const calm=ponds.filter(id=>[1,-1,cols,-cols].every(step=>ponds.includes(id+step)));
 for(let i=0;i<calm.length&&ducks.length<7;i++){
  const id=calm[Math.floor(noise(i,7,8)*calm.length)],[x,y]=center(id);
  if(ducks.every(d=>Math.hypot(d.x-x,d.y-y)>80))ducks.push({x,y,to:id,left:i%2===0});
 }
 blooms.forEach((home,i)=>{if(i%3===0&&moths.length<28)moths.push({home,color:["orange","white","blue"][Math.floor(noise(i,1,9)*3)],phase:noise(i,2,9)*40});});
}
function stepLife(tick:number,now:number){
 for(const d of ducks){
  const [tx,ty]=center(d.to),dx=tx-d.x,dy=ty-d.y,far=Math.hypot(dx,dy);
  if(far<2){
   if(noise(tick,ducks.indexOf(d),10)<.08){
    const options=[1,-1,cols,-cols,cols+1,cols-1,-cols+1,-cols-1].map(step=>d.to+step).filter(id=>ponds.includes(id));
    if(options.length)d.to=options[Math.floor(noise(tick,d.to,11)*options.length)];
   }
  }else{d.x+=dx/far*1.5;d.y+=dy/far*1.5;if(Math.abs(dx)>1)d.left=dx<0;}
 }
 chimneys.forEach((c,i)=>{if((tick+i*3)%5===0)puffs.push({x:c[0],y:c[1],born:now});});
 puffs=puffs.filter(p=>now-p.born<2600);
 if(bird){bird.x+=bird.dx;bird.y+=bird.dy;if(bird.x<-80||bird.x>W+80||bird.y<-80||bird.y>H+80)bird=null;}
 else if(now>nextBird){
  const fromLeft=noise(tick,3,12)<.5,scale=board.clientWidth/W||1,top=view.scrollTop/scale;
  bird={x:fromLeft?view.scrollLeft/scale-40:(view.scrollLeft+view.clientWidth)/scale+40,y:top+noise(tick,4,12)*view.clientHeight/scale*.7,dx:fromLeft?6.4:-6.4,dy:noise(tick,5,12)*3.2-1};
  nextBird=now+7000+noise(tick,6,12)*9000;
 }
}

// ---------- Painting ----------
function paint(now:number){
 if(!ready)return;
 const still=reduced.matches,tick=still?0:Math.floor(now/TICK),scale=board.clientWidth/W||1;
 const x0=Math.max(0,Math.floor(view.scrollLeft/scale)-96),y0=Math.max(0,Math.floor(view.scrollTop/scale)-96);
 const x1=Math.min(W,Math.ceil((view.scrollLeft+view.clientWidth)/scale)+96),y1=Math.min(H,Math.ceil((view.scrollTop+view.clientHeight)/scale)+128);
 const walkFrame=walking?[1,0,2,0][Math.floor(stride/12)%4]:0;
 const key=[tick,x0,y0,x1,y1,Math.round(here[0]),Math.round(here[1]),facing,walkFrame,entryOpen,entryFade,unlockedGame].join();
 if(key===painted)return;painted=key;
 if(!still&&tick!==lifeTick){lifeTick=tick;stepLife(tick,now);}
 sea.fillStyle=waves[Math.floor(tick/2)%4];sea.fillRect(x0,y0,x1-x0,y1-y0);
 stage.clearRect(x0,y0,x1-x0,y1-y0);
 for(const [fx,fy] of falls){
  if(fx<x0-cell||fx>x1||fy<y0-cell*2||fy>y1)continue;
  draw(stage,"fall_"+tick%4,fx,fy);
  if(charAt(fx/cell,fy/cell+1)!=="W")draw(stage,"splash_"+tick%4,fx,fy+cell-7);
  if(charAt(fx/cell,fy/cell-1)!=="W")draw(stage,"splash_"+(tick+2)%4,fx,fy-8);
 }
 // Glints and ripples come and go on open water.
 if(!still)for(const id of ponds){
  const [cx,cy]=center(id);if(cx<x0||cx>x1||cy<y0||cy>y1)continue;
  const beat=Math.floor(tick/3),r=noise(id,beat,13);
  if(r<.012)draw(stage,"glint_"+tick%2,cx-4+Math.floor(noise(id,beat,14)*16)-8,cy-4);
  else if(r>.994)draw(stage,"ripple_"+tick%3,cx-15,cy-7);
 }
 // Scenery and anything that walks or swims, sorted from the back of the scene to the front.
 const movers:Prop[]=ducks.map(d=>({s:"duck_"+(d.left?"west":"east")+"_"+(Math.floor(tick/4+d.to)%2),x:Math.round(d.x)-13,y:Math.round(d.y)-17,z:d.y}));
 let doorway:Place|undefined;
 if(unlockedGame){
  const t=TILES["hero_south_0"],entering=entryTime!==null;
  if(entering)doorway=places[stopFor(mission)];
  movers.push({s:"hero_"+facing+"_"+walkFrame,x:Math.round(here[0])-t[4],y:Math.round(here[1])+12-t[5],z:entering?(doorway!.z??0)+2:here[1]+12});
  places.forEach((p,i)=>{
   if(i===0||!availableAt(i).some(m=>book.runs[m.date]?.cleared))return;
   const rise=i===stopFor(mission)&&flagRise&&!still?Math.max(0,1-(now-flagRise)/1400):0,f=TILES["flag_0"];
   movers.push({s:"flag_"+Math.floor(tick/2)%3,x:p.door[0]+26-f[4],y:p.door[1]-11-f[5]+Math.round(rise*36),z:p.door[1]-11});
  });
  movers.sort((a,b)=>a.z-b.z);
 }
 let lo=0,hi=props.length;
 while(lo<hi){const mid=lo+hi>>1;if(props[mid].z<y0-16)lo=mid+1;else hi=mid;}
 let next=0;
 const show=(p:Prop)=>{
  let name=p.s;
  if(p.turns)name+="_"+(["south","south","east","west","south"] as const)[Math.floor(noise(Math.floor(tick/26+p.turns*7),p.turns,15)*5)]+"_0";
  else if(p.frames)name+="_"+Math.floor(tick/(p.rate??1)+(p.phase??0))%p.frames;
  else if(!TILES[name])name+="_0";
  const t=TILES[name];if(p.x>x1||p.x+t[2]<x0)return;
  if(name.startsWith("hero_")&&(entryFade<1||entryClip>0)){
   const cut=Math.round(t[3]*entryClip);stage.globalAlpha=entryFade;
   stage.drawImage(sheet,t[0],t[1]+cut,t[2],t[3]-cut,p.x,p.y+cut,t[2],t[3]-cut);stage.globalAlpha=1;
  }else stage.drawImage(sheet,t[0],t[1],t[2],t[3],p.x,p.y,t[2],t[3]);
 };
 for(let i=lo;i<props.length&&props[i].z<=y1+96;i++){
  for(;next<movers.length&&movers[next].z<props[i].z;next++)show(movers[next]);
  show(props[i]);
  if(doorway&&props[i].s===doorway.kind&&props[i].z===doorway.z&&doorway.open){
   // The door swings inward: a dark opening widens from its middle.
   const [dx,dy,dw,dh]=doorway.open,wide=Math.round(dw*entryOpen);
   stage.fillStyle="#17131c";stage.fillRect(dx+Math.floor((dw-wide)/2),dy,wide,dh);
  }
 }
 for(;next<movers.length;next++)show(movers[next]);
 if(still)return;
 // Above everything: smoke, butterflies, sparkles and the odd passing bird.
 for(const p of puffs){
  const age=(now-p.born)/2600,size=age<.25?0:age<.6?1:2;
  if(age<.92||tick%2)draw(stage,"smoke_"+size,Math.round(p.x+age*18+Math.sin(age*7+p.x)*4)-size*2-3,Math.round(p.y-age*48)-size*2-3);
 }
 moths.forEach((m,i)=>{
  const t=tick/8+m.phase,x=m.home[0]+Math.sin(t*.9)*26+Math.sin(t*2.3+i)*10,y=m.home[1]-10+Math.cos(t*.7+i)*16+Math.sin(t*3.1)*4;
  if(x>x0&&x<x1&&y>y0&&y<y1)draw(stage,"moth_"+m.color+"_"+(tick+i)%2,Math.round(x)-4,Math.round(y)-3);
 });
 sparkles.forEach(([sx,sy],i)=>{const r=noise(i,Math.floor(tick/4),16);if(r<.22)draw(stage,"glint_"+(r<.11?0:1),sx-4,sy-4);});
 if(bird){
  stage.fillStyle="#16301c40";stage.fillRect(Math.round(bird.x)-7,Math.round(bird.y)+68,14,4);
  draw(stage,"bird_"+Math.floor(tick/2)%2,Math.round(bird.x)-11,Math.round(bird.y)-6);
 }
}
