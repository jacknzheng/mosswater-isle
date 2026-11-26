// Draws the Mosswater tileset and writes assets/tiles.png and assets/tiles.json.
// Run with `npm run tiles`. Tiles are 32 pixels. Everything is original art drawn by the code below.
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {C,rng,hash,tone,Sheet,Atlas} from './pixel.mjs';
import {addBuildings} from './buildings.mjs';
import {addActors} from './actors.mjs';

const T=32,Q=16;
const atlas=new Atlas(1024);
const add=(name,sheet,meta)=>atlas.add(name,sheet,meta);
const SHADOW='#10281c55';

// ---------- Ground ----------
const GRASS=['#357c45','#4b9f45','#6abf4b','#8fd45c','#bbe971'];
for(let v=0;v<6;v++){
 const t=new Sheet(T,T).fill(GRASS[2]),r=rng(60+v);
 const blade=(x,y,c,len,lean)=>{for(let i=0;i<len;i++)t.set((x+(i>=len-1?lean:0)+T)%T,(y-i+T)%T,c);};
 for(let i=0;i<9+v;i++){const x=r(T),y=r(T);blade(x,y,GRASS[1],2+r(2),r(3)-1);t.set((x+1)%T,(y+T-1)%T,GRASS[3]);}
 for(let i=0;i<6;i++)t.set(r(T),r(T),GRASS[3]);
 if(v===3||v===5)for(let k=-2;k<=2;k++){const x=10+v*2+k*2,y=20-v+Math.abs(k),len=5-Math.abs(k);blade(x,y,k%2?GRASS[0]:GRASS[1],len,Math.sign(k));t.set(x+Math.sign(k),y-len,GRASS[4]);}
 if(v===4)for(const[x,y]of[[7,9],[10,7],[12,10],[22,22],[25,20]]){t.rect(x,y,2,2,GRASS[3]);t.set(x,y,GRASS[4]);t.set(x+1,y+2,GRASS[1]);}
 add('grass_'+v,t);
}

// Terrain edges are built from 16 pixel quarter tiles. Each block is 80 by 64:
// five edge states across (outer corner, side edge, top or bottom edge, inner corner, full)
// and the four corners of a tile down (top left, top right, bottom left, bottom right).
// Straight edges wander a pixel in or out so banks and paths do not look ruled.
const BUMP=[[0,0,1,1,1,0,-1,-1,0,0,1,0,0,-1,0,0],[0,1,1,0,0,-1,-1,-1,0,0,0,1,1,0,0,0],[0,0,-1,-1,0,1,1,0,0,0,-1,0,1,1,0,0],[0,-1,0,0,1,1,1,0,-1,-1,0,0,0,1,0,0]];
function auto(name,paint,{m=0,r=6,wobble=1}={}){
 const s=new Sheet(5*Q,4*Q);
 for(let corner=0;corner<4;corner++){
  const right=corner&1,bottom=corner>>1;
  for(let state=0;state<5;state++)for(let py=0;py<Q;py++)for(let px=0;px<Q;px++){
   const X=right?Q+px:px,Y=bottom?Q+py:py,u=right?T-.5-X:X+.5,v=bottom?T-.5-Y:Y+.5;
   let d=99;
   if(state===0)d=u<m+r&&v<m+r?r-Math.hypot(m+r-u,m+r-v):Math.min(u-m,v-m);
   else if(state===1)d=u-m+wobble*BUMP[corner][py];
   else if(state===2)d=v-m+wobble*BUMP[(corner+2)%4][px];
   else if(state===3)d=Math.hypot(u,v)-m-.5;
   const c=paint(d,X,Y,{u,v,right,bottom,state,north:!bottom&&(state===2||state===0&&v<=u),south:!!bottom&&(state===2||state===0&&v<=u)});
   if(c)s.set(state*Q+px,corner*Q+py,c);
  }
 }
 return add(name,s);
}

const SAND=['#cfa86c','#dcbb7e','#ecd092','#f9e9bf'];
function sand(X,Y,v){
 const pebble=hash(X>>1,Y>>1,7+v);
 if(pebble<.028)return(X&1)+(Y&1)===0?SAND[3]:(X&1)+(Y&1)===2?SAND[0]:SAND[1];
 const h=hash(X,Y,17+v);return h<.03?SAND[1]:h<.05?SAND[3]:SAND[2];
}
for(let v=0;v<3;v++)add('sand_'+v,new Sheet(T,T).each((x,y)=>sand(x,y,v)));
auto('path',(d,X,Y)=>d<-2?0:d<0?(hash(X,Y,3)<.7?GRASS[1]:0):d<1.5?'#8a5f38':d<3?'#b98a54':d<5?(hash(X,Y,4)<.45?SAND[0]:SAND[1]):sand(X,Y,0),{m:3,r:7});

// Water sits on a canvas below the ground. The mask cuts the hole and the rim draws the bank.
auto('water_mask',d=>d>=0?'#000000':0,{m:0,r:10});
auto('water_rim',(d,X,Y,q)=>{
 if(d<0)return 0;
 if(d<1.5)return'#5a3f28';
 if(q.north){// The far bank is a low earth wall with its shadow on the water.
  if(d<3)return'#b98f5c';
  if(d<8)return hash(X>>1,Y,2)<.22?'#6f5034':hash(X,Y,5)<.12?'#a47b4c':'#8a6540';
  if(d<9)return'#5a3f28';
  return d<12?'#15509f8c':d<14?'#15509f4a':0;
 }
 if(d<4)return hash(X,Y,6)<.2?'#b98a54':'#d2ad72';
 if(d<5.5)return'#b98a54';
 if(d<7.5)return hash(X>>1,Y>>1,3)<.72?'#eefaff':0;
 return d<12?'#9fd8ff4d':d<15?'#9fd8ff26':0;
},{m:0,r:10});
const WATER=['#1f66c4','#2f86de','#4ba1ea','#84c6f6'];
for(let f=0;f<4;f++){
 const t=new Sheet(64,64).fill(WATER[1]);
 for(let row=0;row<4;row++)for(let k=0;k<3;k++){
  const y=(row*16+f*4+(k*5)%7)%64,x=(k*21+row*13+(row%2?10:0))%64,half=3+((k+row)%3);
  for(let i=-half;i<=half;i++){
   const dip=Math.round(i*i/(half*1.6));
   t.set((x+i+64)%64,(y+dip)%64,WATER[2]);
   if(Math.abs(i)<half-1)t.set((x+i+64)%64,(y+dip+63)%64,WATER[3]);
  }
  for(let i=0;i<4+(k%2)*2;i++)t.set((x+30+i)%64,(y+9)%64,WATER[0]);
 }
 add('water_'+f,t);
}

// Rock is a wall of fitted stones. The pattern repeats every tile.
const ROCK=['#3b2925','#594035','#775845','#96745a','#b59470','#d1b48c'];
const SEEDS=[];
for(let gy=0;gy<4;gy++)for(let gx=0;gx<4;gx++)SEEDS.push([gx*8+2+hash(gx,gy,90)*5,gy*8+2+hash(gx,gy,91)*5,hash(gx,gy,92)]);
function stone(X,Y){
 let near=1e9,next=1e9,best=SEEDS[0],lx=0,ly=0;
 for(const s of SEEDS){
  let dx=((X-s[0])%T+T)%T;if(dx>T/2)dx-=T;
  let dy=((Y-s[1])%T+T)%T;if(dy>T/2)dy-=T;
  const d=Math.hypot(dx,dy*1.25);
  if(d<near){next=near;near=d;best=s;lx=dx;ly=dy;}else if(d<next)next=d;
 }
 if(next-near<1.3)return ROCK[1];
 return tone(ROCK.slice(2),.42+best[2]*.3-lx*.035-ly*.06+(hash(X,Y,11)-.5)*.12);
}
auto('rock',(d,X,Y,q)=>{
 if(d<0)return 0;
 if(d<1.3)return ROCK[0];
 if(q.south&&q.v<15){
  if(q.v<3)return ROCK[0];
  if(q.v>=13)return ROCK[4];
  const crack=hash(X,3,5)<.16||hash(X>>1,Math.floor(q.v/4),6)<.1;
  return crack?ROCK[0]:hash(X>>1,Math.floor(q.v/3),7)<.3?ROCK[2]:ROCK[1];
 }
 if(q.north&&q.v<3.2)return q.v<2.2?ROCK[5]:ROCK[4];
 return stone(X,Y);
},{m:0,r:6});
add('stairs',new Sheet(T,T).each((x,y)=>{
 const step=y%8;
 if(x<2||x>29)return'#4f5158';
 if(x<5||x>26)return step===0?'#a9abab':'#7b7d83';
 return step<1?'#f1f1ec':step<5?(hash(x>>2,y>>3,41)<.2?'#c9cbc7':'#d7d8d3'):step<7?'#8f9196':'#63656d';
}));
add('soil',new Sheet(T,T).each((x,y)=>{const f=y%8;return f===7?'#5c3a22':f===0?'#a9733f':hash(x,y,21)<.1?'#a9733f':hash(x,y,22)<.08?'#6b4426':'#8a5a31';}));
add('deck',new Sheet(T,T).each((x,y)=>{
 const plank=x%8,grain=hash(x>>3,y>>2,31);
 if(plank===7)return'#5a3a20';
 if(plank===0)return'#d39c5e';
 if((y===3||y===28)&&plank===3)return'#3a2416';
 return grain<.18?'#9a6836':grain>.85?'#c9955a':'#b57f48';
}));
{const s=new Sheet(T,20);
 s.each((x,y)=>y>=3&&y<8?(y===3?'#e0aa6c':y===7?'#5a3a20':hash(x>>2,y,33)<.2?'#a06c3e':'#c38a52'):y>=11&&y<15?(y===11?'#c38a52':y===14?'#5a3a20':'#a06c3e'):0);
 for(const x of[4,20]){s.rect(x,0,7,20,'#b57f48').rect(x,0,2,20,'#d39c5e').rect(x+5,0,2,20,'#7c5230').rect(x,0,7,2,'#e9bd82').rect(x,18,7,2,'#5a3a20');for(let y=0;y<20;y++){s.set(x-1,y,'#3a2416');s.set(x+7,y,'#3a2416');}}
 add('rail',s.outline('#3a2416'));}

// ---------- Trees ----------
const WOOD=['#3a2416','#5a3a20','#7c5230','#a06c3e','#c38a52'];
const LEAF={
 oak:['#113f38','#1b5a3a','#27773d','#3a9644','#5cb54a','#8fd35b','#c4ec78'],
 deep:['#0f3833','#174f37','#20693b','#2f8440','#48a046','#74bf53','#a9dc6b'],
 lime:['#2c5a26','#417c2a','#5f9e30','#83bd3a','#a9d748','#cfea62','#eef78f'],
 pine:['#0e302c','#144536','#1c5c3f','#2a7648','#3f9153','#62ad62','#93cb7c'],
 birch:['#4a6a1e','#688a24','#8bab2e','#aeca3d','#cfe354','#e9f47c','#f8fbb0']
};
/** One layer of a leafy crown: a row of round clumps lit from the upper left. */
function crown(s,lobes,ramp,seed){
 const mask=new Sheet(s.w,s.h);
 for(const[cx,cy,r]of lobes)mask.disc(cx,cy,r,r,1);
 const[,y0,,y1]=mask.bounds();
 // The layer above throws a shadow on what is already drawn.
 s.each((x,y,c)=>{
  if(!(c&255)||mask.get(x,y))return;
  const depth=[1,2,3,4,5].find(k=>mask.get(x,y-k));
  if(depth)return depth<3?ramp[1]:(x+y)%2?ramp[1]:ramp[2];
 });
 mask.each((x,y,on)=>{
  if(!on)return;
  if(!mask.get(x,y+1))return void s.set(x,y,ramp[0]);
  if(!mask.get(x,y+2)||!mask.get(x,y+3))return void s.set(x,y,ramp[1]);
  let best=lobes[0],score=9;
  for(const lobe of lobes){const k=Math.hypot(x-lobe[0],y-lobe[1])/lobe[2];if(k<score){score=k;best=lobe;}}
  const nx=(x-best[0])/best[2],ny=(y-best[1])/best[2];
  const leaf=((x+(y>>2)*3)%6<3&&y%4<2?.07:-.02)+(hash(x>>1,y>>1,seed)-.5)*.2;
  const value=.5-(nx*.5+ny*.72)*.5-(y-y0)/(y1-y0)*.14+leaf;
  s.set(x,y,tone(ramp.slice(1),value,x,y,.5));
 });
}
function trunk(s,cx,top,bottom,width){
 for(let y=top;y<=bottom;y++){
  const flare=y>=bottom-2?bottom-y<1?3:2:y>=bottom-5?1:0,x0=cx-width/2-flare,x1=cx+width/2-1+flare;
  for(let x=x0;x<=x1;x++){
   const k=(x-x0)/(x1-x0);
   s.set(x,y,x===x0||x===x1?WOOD[0]:hash(x,y>>2,51)<.18?WOOD[1]:tone(WOOD.slice(1),.82-k*.75,x,y,.4));
  }
 }
}
function oak(name,ramp,seed,size=1){
 const s=new Sheet(64,88),r=rng(seed),j=()=>r(3)-1,k=v=>Math.round(v*size);
 s.disc(32,80,22*size,5,SHADOW);trunk(s,32,54,82,12);
 crown(s,[[32-k(18)+j(),47,k(13)],[32-k(6)+j(),44+j(),k(13)],[32+k(6)+j(),44+j(),k(13)],[32+k(18)+j(),47,k(13)]],ramp,seed);
 crown(s,[[32-k(13)+j(),31,k(13)],[32+j(),28,k(13)],[32+k(13)+j(),31,k(13)]],ramp,seed+3);
 crown(s,[[32-k(7)+j(),17,k(11)],[32+k(7)+j(),16,k(11)]],ramp,seed+6);
 return add(name,s.outline(ramp[0]),[32,82]);
}
oak('oak_0',LEAF.oak,1);oak('oak_1',LEAF.deep,2);oak('oak_2',LEAF.lime,3);oak('oak_3',LEAF.oak,4,.86);
function pine(name,ramp,seed){
 const s=new Sheet(48,88),cx=24;
 s.disc(cx,80,16,5,SHADOW);trunk(s,cx,62,82,8);
 [[70,21,24],[57,18,22],[44,14,20],[32,10,18],[21,6,15]].forEach(([base,half,height],i)=>{
  const top=base-height,mask=new Sheet(48,88);
  for(let y=top;y<=base;y++){
   const w=Math.round(half*(y-top)/height+1);
   for(let x=cx-w;x<=cx+w;x++)if(y<base-2||(x+i*2)%6>(base-y))mask.set(x,y,1);
  }
  s.each((x,y,c)=>{if((c&255)&&!mask.get(x,y)&&[1,2,3,4].some(k=>mask.get(x,y-k)))return ramp[1];});
  mask.each((x,y,on)=>{
   if(!on)return;
   if(!mask.get(x,y+1))return void s.set(x,y,ramp[0]);
   const needle=(x+y)%4===0?.08:(x-y+64)%5===0?-.08:0;
   s.set(x,y,tone(ramp.slice(1),.56-(x-cx)/half*.3-(y-top)/height*.32+needle+(hash(x,y,seed+i)-.5)*.16,x,y,.5));
  });
 });
 return add(name,s.outline(ramp[0]),[24,82]);
}
pine('pine_0',LEAF.pine,5);pine('pine_1',LEAF.deep,6);
function birch(name,seed,ramp=LEAF.birch){
 const s=new Sheet(48,88),cx=24,bark=['#7d7868','#bdb7a4','#e4dfce','#fbf8ee'];
 s.disc(cx,80,14,5,SHADOW);
 for(let y=30;y<=82;y++){const flare=y>=80?2:y>=77?1:0;for(let x=cx-4-flare;x<=cx+3+flare;x++)s.set(x,y,x===cx-4-flare||x===cx+3+flare?bark[0]:tone(bark.slice(1),.95-(x-(cx-4))/8*.8,x,y,.3));}
 for(let y=34;y<78;y+=5+Math.floor(hash(y,seed)*5)){const side=hash(y,seed+1)<.5?-3:0;s.rect(cx+side,y,3+Math.floor(hash(y,seed+2)*2),1,'#3a332c').rect(cx+side,y+1,2,1,'#5a5148');}
 crown(s,[[11,39,10],[24,36,10],[37,39,10]],ramp,seed);
 crown(s,[[16,25,10],[32,24,10]],ramp,seed+2);
 crown(s,[[24,12,9]],ramp,seed+4);
 return add(name,s.outline(ramp[0]),[24,82]);
}
birch('birch_0',7);birch('birch_1',8,LEAF.lime);
{const s=new Sheet(32,30);s.disc(16,26,13,3,SHADOW);crown(s,[[9,17,8],[16,14,9],[23,17,8]],LEAF.oak,9);add('bush',s.outline(LEAF.oak[0]),[16,28]);}
{const s=new Sheet(32,30);s.disc(16,26,13,3,SHADOW);crown(s,[[9,17,8],[16,14,9],[23,17,8]],LEAF.deep,10);
 for(const[x,y]of[[8,12],[14,9],[20,13],[25,17],[11,18],[17,16]]){s.rect(x,y,2,2,'#f28fb8');s.set(x,y,'#ffd0e2');s.set(x+1,y+1,'#c8558a');}
 add('bush_bloom',s.outline(LEAF.deep[0]),[16,28]);}

// ---------- Small scenery ----------
const BLOOM={red:['#b8302e','#e2503f','#ff9a7e'],white:['#9fbfe8','#eef3ff','#ffffff'],yellow:['#d9941f','#f6c93a','#fff3a0'],pink:['#c8558a','#f28fb8','#ffd0e2']};
for(const[color,[dark,petal,glow]]of Object.entries(BLOOM))for(let f=0;f<2;f++){
 const s=new Sheet(32,24);
 for(const[x,y,h]of[[6,9,12],[14,4,17],[21,10,11],[27,6,14]]){
  for(let i=2;i<h;i++)s.set(x+(i<6?f:0),y+i,i%4===3?'#2c6f36':'#3d8f3f');
  s.set(x-1,y+h-5,'#3d8f3f');s.set(x-2,y+h-6,'#57ab47');s.set(x+1,y+h-8,'#3d8f3f');s.set(x+2,y+h-9,'#57ab47');
  const bx=x+f;
  s.rect(bx-1,y-2,3,5,petal).rect(bx-2,y-1,5,3,petal).set(bx-1,y-2,glow);s.set(bx,y-2,glow);s.set(bx-2,y-1,glow);
  s.set(bx+2,y+1,dark);s.set(bx+1,y+2,dark);s.set(bx,y+2,dark);
  s.rect(bx-1,y-1,2,2,color==='yellow'?'#d9741f':'#ffd84a').set(bx,y,color==='yellow'?'#a84f12':'#e8a41f');
 }
 add('flower_'+color+'_'+f,s,[16,23]);
}
for(let f=0;f<2;f++){
 const s=new Sheet(32,28);
 for(let x=2;x<30;x++){
  const h=9+Math.floor(hash(x,3,13)*15),lean=h>15?f:0;
  for(let i=0;i<h;i++)s.set(x+(i>h-5?lean:0)+(i>h-2?lean:0),27-i,i>h-3?GRASS[4]:i>h-7?GRASS[3]:hash(x,i>>1,14)<.35?GRASS[0]:GRASS[1]);
 }
 add('reeds_'+f,s,[16,27]);
}
function boulder(name,w,h,wet){
 const s=new Sheet(w,h+4),cx=(w-1)/2,cy=h/2-.5,grey=['#3f414a','#5d5f68','#82848a','#a9abab','#cfd0cb','#eeeee8'];
 s.each((x,y)=>{
  const dx=(x-cx)/(w/2-.5),dy=(y-cy)/(h/2-.5),r=dx*dx+dy*dy;
  if(r>1||y>=h)return;
  const facet=Math.floor((dx*.7-dy)*2.2+hash(Math.floor(x/5),Math.floor(y/4),17)*.9);
  return tone(grey.slice(1),.55-dx*.26-dy*.34+facet*.07+(hash(x,y,18)-.5)*.08,x,y,.4);
 }).outline(grey[0]);
 if(wet)for(let x=1;x<w-1;x++){if(hash(x,w,19)<.8)s.set(x,h,x%3?'#eefaff':'#9fd8ff');if(hash(x,w,20)<.45)s.set(x,h+1,'#cfeaff');}
 else s.each((x,y,c)=>!c&&(y===h||y===h+1)&&x>2&&x<w-3?SHADOW:undefined);
 return add(name,s,[Math.floor(w/2),h]);
}
boulder('boulder_0',28,22);boulder('boulder_1',20,16);boulder('wetrock_0',28,20,true);boulder('wetrock_1',18,14,true);
const PAD=['#16562f','#2f8a41','#49a650','#74c468'];
function lily(name,f,bloom){
 const s=new Sheet(22,16);
 s.each((x,y)=>{
  const dx=(x-10)/9.5,dy=(y-9)/5.2;if(dx*dx+dy*dy>1)return;
  if(dy<0&&Math.abs(dx)<-dy*.42)return;
  return Math.abs(dx*.6+dy)<.08||Math.abs(dx*.6-dy)<.06?PAD[1]:tone(PAD.slice(1),.6-dx*.3-dy*.3,x,y,.5);
 }).outline(PAD[0]);
 if(f)s.set(19,5,'#cfeaff');
 if(bloom){s.rect(8,5,6,4,'#f28fb8').rect(9,4,4,6,'#f28fb8').rect(9,5,3,2,'#ffd0e2').rect(10,6,2,2,'#fff3a0').set(13,8,'#c8558a');s.set(12,9,'#c8558a');}
 return add(name,s,[10,10]);
}
lily('lily_0',0);lily('lily_1',1);lily('lily_bloom',0,true);
function post(s,x){
 s.rect(x,0,7,28,'#b57f48').rect(x,0,2,28,'#d39c5e').rect(x+5,0,2,28,'#7c5230').rect(x,0,7,2,'#e9bd82').rect(x,26,7,2,'#5a3a20');
 for(let y=0;y<28;y++){s.set(x-1,y,'#3a2416');s.set(x+7,y,'#3a2416');}
 s.rect(x,-1,7,1,'#3a2416');
}
{const s=new Sheet(32,29);
 for(const[y,h]of[[8,5],[18,4]])for(let x=0;x<32;x++)for(let i=0;i<h;i++)s.set(x,y+i,i===0?'#e0aa6c':i===h-1?'#5a3a20':hash(x>>2,y+i,35)<.2?'#a06c3e':'#c38a52');
 s.outline('#3a2416');post(s,12);add('fence',s,[16,28]);}
{const s=new Sheet(32,29);post(s,12);s.rect(12,0,7,1,'#3a2416');add('post',s,[16,28]);}
for(let v=0;v<2;v++){
 const s=new Sheet(28,24),ramp=v?['#22522a','#3c8436','#62a93f','#94cf50','#cdeb7a']:['#1d4a35','#2f7a44','#4fa257','#7fc66c','#b5e58e'];
 s.each((x,y)=>{
  const dx=(x-13.5)/13,dy=(y-12)/10.5,r=dx*dx+dy*dy;if(r>1)return;
  const a=Math.atan2(dy,dx),leaf=Math.abs(Math.sin(a*3+r*3+v));
  return leaf<.16?ramp[0]:tone(ramp.slice(1),.55-dx*.22-dy*.3+(leaf-.5)*.3-r*.12,x,y,.5);
 }).outline(ramp[0]);
 add('crop_'+v,s,[14,22]);
}
{const s=new Sheet(28,36);
 s.rect(12,12,4,24,'#a06c3e').rect(12,12,1,24,'#c38a52').rect(15,12,1,24,'#5a3a20');
 s.rect(2,2,24,14,'#ecd9a8').rect(2,2,24,2,'#fbf0d2').rect(2,14,24,2,'#b99c63').rect(2,2,2,14,'#fbf0d2').rect(24,2,2,14,'#b99c63').outline('#3a2416');
 s.rect(6,6,16,2,'#7a5a34').rect(6,10,10,2,'#7a5a34');add('sign',s,[14,35]);}

// ---------- Moving water ----------
for(let f=0;f<4;f++){
 add('fall_'+f,new Sheet(T,T).each((x,y)=>{
  const lane=x%8,k=(y+T-f*8+((x>>3)*11)%T)%T;
  if(lane===7)return k<12?'#6fb5f0':'#4ba1ea';
  if(lane===0)return k<10?'#d9f1ff':'#9fd2f8';
  return k<5?'#ffffff':k<12?'#d9f1ff':k<20?'#aedbfa':hash(x,(y+f*8)>>1,27)<.2?'#d9f1ff':'#84c6f6';
 }));
 // Foam where the falling water meets the river.
 add('splash_'+f,new Sheet(T,16).each((x,y)=>{
  const crest=5+Math.floor(hash(x>>2,f,29)*5)+Math.round(Math.sin((x+f*5)/3)*1.5);
  if(y<crest)return y>=crest-2&&hash(x>>1,f,30)<.5?'#d9f1ff':'#ffffff';
  return hash(x>>1,(y>>1)+f*5,31)<.16?'#eefaff':0;
 }));
}
for(let f=0;f<3;f++){
 const s=new Sheet(30,14),rx=6+f*4,ry=2.5+f*1.7;
 s.each((x,y)=>{const r=((x-14.5)/rx)**2+((y-6.5)/ry)**2;return r<=1.05&&r>=(f?.62:.25)&&hash(x>>1,y,33+f)<.86?(f===2?'#cfeaff99':'#eefaff'):0;});
 add('ripple_'+f,s,[15,7]);
}
for(let f=0;f<2;f++){const s=new Sheet(9,9),n=f?4:2;for(let i=-n;i<=n;i++){s.set(4+i,4,Math.abs(i)<2?'#ffffff':'#d9f1ff');s.set(4,4+i,Math.abs(i)<2?'#ffffff':'#d9f1ff');}if(f){s.set(3,3,'#eefaff');s.set(5,5,'#eefaff');s.set(3,5,'#eefaff');s.set(5,3,'#eefaff');}add('glint_'+f,s,[4,4]);}

addBuildings({add,Sheet,C,hash,tone,rng,WOOD,ROCK,GRASS,SHADOW,stone,crown,LEAF});
addActors({add,Sheet,C,hash,tone,rng,SHADOW});

const {sheet,index}=atlas.pack();
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','assets');
writeFileSync(path.join(root,'tiles.png'),sheet.png());
writeFileSync(path.join(root,'tiles.json'),JSON.stringify(index));
console.log('tiles.png',sheet.w+'x'+sheet.h,Object.keys(index).length+' sprites');
