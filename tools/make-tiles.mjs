// Draws the Mosswater tileset and writes assets/tiles.png and assets/tiles.json.
// Run with `npm run tiles`. Everything is original art drawn by the code below.
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {C,rng,hash,Sheet,Atlas} from './pixel.mjs';
import {addBuildings} from './buildings.mjs';
import {addActors} from './actors.mjs';

const atlas=new Atlas(512);
const add=(name,sheet,meta)=>atlas.add(name,sheet,meta);
const pick=(value,stops,colors)=>{for(let i=0;i<stops.length;i++)if(value<stops[i])return colors[i];return colors[colors.length-1];};

// ---------- Ground ----------
const GRASS={base:'#67ba4b',dark:'#4c9f40',light:'#86d05e',deep:'#3f8a3b'};
for(let v=0;v<6;v++){
 const t=new Sheet(16,16).fill(GRASS.base),r=rng(40+v);
 for(let i=0;i<3+v%3;i++){const x=r(15),y=r(14);t.set(x,y,GRASS.dark);t.set(x,y+1,GRASS.dark);t.set(x+1,y,GRASS.light);}
 for(let i=0;i<2;i++)t.set(r(16),r(16),GRASS.light);
 if(v===3){t.set(6,9,GRASS.deep);t.set(7,8,GRASS.deep);t.set(8,9,GRASS.deep);t.set(7,10,GRASS.dark);}
 if(v===4)for(const[x,y]of[[4,5],[5,4],[6,5],[11,11],[12,10],[13,11]]){t.set(x,y,GRASS.light);t.set(x,y+1,GRASS.dark);}
 if(v===5){t.rect(3,9,3,2,GRASS.dark).rect(9,3,4,2,GRASS.dark).set(4,8,GRASS.dark);t.set(10,2,GRASS.dark);t.set(12,5,GRASS.light);}
 add('grass_'+v,t);
}

// Terrain edges are built from 8 pixel quarter tiles. Each block is 40 by 32:
// five edge states across (outer corner, side edge, top or bottom edge, inner corner, full)
// and the four corners of a tile down (top left, top right, bottom left, bottom right).
function auto(name,paint,{m=0,r=3}={}){
 const s=new Sheet(40,32);
 for(let corner=0;corner<4;corner++){
  const right=corner&1,bottom=corner>>1;
  for(let state=0;state<5;state++)for(let py=0;py<8;py++)for(let px=0;px<8;px++){
   const X=right?8+px:px,Y=bottom?8+py:py,u=right?15.5-X:X+.5,v=bottom?15.5-Y:Y+.5;
   let d=99;
   if(state===0)d=u<m+r&&v<m+r?r-Math.hypot(m+r-u,m+r-v):Math.min(u-m,v-m);
   else if(state===1)d=u-m;
   else if(state===2)d=v-m;
   else if(state===3)d=Math.hypot(u,v)-m-.5;
   const c=paint(d,X,Y,{u,v,right,bottom,state,north:!bottom&&(state===2||state===0&&v<=u),south:!!bottom&&(state===2||state===0&&v<=u)});
   if(c)s.set(state*8+px,corner*8+py,c);
  }
 }
 return add(name,s);
}

const SAND=['#ecd193','#f6e2b0','#d7b374'];
const sand=(X,Y,v)=>{const h=hash(X,Y,7+v);return h<.045?SAND[2]:h<.085?SAND[1]:SAND[0];};
for(let v=0;v<3;v++)add('sand_'+v,new Sheet(16,16).each((x,y)=>sand(x,y,v)));
auto('path',(d,X,Y)=>d<-1?0:d<0?GRASS.dark:d<1?'#a47b48':d<2?'#cfa96b':sand(X,Y,0),{m:1,r:3});

// Water sits on a canvas below the ground. The mask cuts the hole and the rim draws the bank.
auto('water_mask',d=>d>=0?'#000000':0,{m:0,r:5});
auto('water_rim',(d,X,Y,q)=>{
 if(d<0)return 0;
 if(d<1)return'#6f4f2e';
 if(q.north)return d<3?(hash(X,Y,2)<.2?'#8f6a3f':'#a98050'):d<4.2?'#1b5fb899':0;
 return d<2.2?'#c9a468':d<3.2&&hash(X,Y,3)<.7?'#e4f6ff':0;
},{m:0,r:5});
const WATER=['#2f88df','#59abef','#2372cd','#bfe6ff'];
for(let f=0;f<4;f++){
 const t=new Sheet(32,32).fill(WATER[0]);
 for(let row=0;row<4;row++)for(let k=0;k<3;k++){
  const y=(row*8+f*2)%32,x=(k*11+row*5+(row%2?4:0))%32,len=3+((k+row)%3);
  for(let i=0;i<len;i++){t.set((x+i)%32,y,WATER[1]);if(i>0&&i<len-1&&(k+row)%2===0)t.set((x+i)%32,(y+31)%32,WATER[1]);}
  for(let i=0;i<2+(k%2);i++)t.set((x+14+i)%32,(y+4)%32,WATER[2]);
 }
 add('water_'+f,t);
}

const ROCK=['#9c7757','#bf9b76','#74543f','#4b332a'];
// Fitted stones in three staggered courses that repeat every tile.
const stone=(X,Y)=>{
 const y=Y%16,course=y<5?0:y<11?1:2,ry=y-[0,5,11][course],height=[5,6,5][course],x=(X+[0,4,2][course])%8;
 if(ry===height-1||x===7)return ROCK[2];
 if(ry===0||x===0)return ROCK[1];
 return hash(X,Y,11)<.1?ROCK[1]:ROCK[0];
};
auto('rock',(d,X,Y,q)=>{
 if(d<0)return 0;
 if(d<1)return ROCK[3];
 if(q.south&&q.v<8)return q.v<2||X%4===1&&q.v<7?ROCK[3]:q.v>=7?ROCK[3]:hash(X,Y,5)<.15?ROCK[0]:ROCK[2];
 if(q.north&&q.v<2)return ROCK[1];
 return stone(X,Y);
},{m:0,r:3});
add('stairs',new Sheet(16,16).each((x,y)=>x===0||x===15?'#5d5f66':x===1||x===14?'#8a8c90':y%4===0?'#e3e4e0':y%4===3?'#6f7177':'#bdbfbc'));
add('soil',new Sheet(16,16).each((x,y)=>y%4===3?'#6b4426':hash(x,y,21)<.1?'#a8733f':'#8f5e33'));
add('deck',new Sheet(16,16).each((x,y)=>x%4===3?'#7a4e2a':y===0||y===15?'#8a5a30':hash(x>>2,y>>2,31)<.3?'#c18c52':'#b07a44'));
add('rail',new Sheet(16,10).each((x,y)=>{
 if(x>=6&&x<=9)return y===0?'#e0ad6e':x===6||x===9||y===9?'#5f3b1e':'#b07a44';
 if(y===2||y===6)return'#5f3b1e';if(y===3)return'#d39c5e';if(y===4||y===5)return'#9a6836';
}));

// ---------- Trees ----------
const SHADOW='#16301c59';
function tier(sheet,cx,cy,halfW,lobe,count,ramp,seed,stops=[.2,.46,.8]){
 const mask=new Sheet(sheet.w,sheet.h);
 for(let i=0;i<count;i++){const x=count===1?cx:cx-halfW+lobe+i*(2*halfW-2*lobe)/(count-1),lift=count>2&&i>0&&i<count-1?2:0;mask.disc(x,cy-lift,lobe,lobe,1);}
 const[x0,y0,x1,y1]=mask.bounds();
 mask.each((x,y,on)=>{
  if(!on)return;
  if(!mask.get(x,y+1))return void sheet.set(x,y,ramp[0]);
  const value=(y-y0)/(y1-y0)*.78+((x-x0)/(x1-x0)-.5)*.42+(hash(x>>1,y>>1,seed)-.5)*.3+(hash(x,y,seed+1)-.5)*.12;
  sheet.set(x,y,pick(value,stops,[ramp[4],ramp[3],ramp[2],ramp[1]]));
 });
}
function trunk(sheet,cx,top,bottom,width,ramp){
 for(let y=top;y<=bottom;y++){const flare=y>=bottom-1?1:0,x0=cx-Math.floor(width/2)-flare,x1=x0+width-1+2*flare;
  for(let x=x0;x<=x1;x++)sheet.set(x,y,x===x0?ramp[0]:x===x1?ramp[0]:x<=x0+1?ramp[2]:ramp[1]);}
}
const WOOD=['#4a2d1b','#6e4527','#8f6037'];
const LEAF={
 oak:['#1c5733','#2a7a3c','#3c9b43','#5fbb4c','#93da60'],
 deep:['#174a30','#226b3a','#31883f','#4ca647','#7cc957'],
 lime:['#3a6b23','#56912d','#7bb538','#a4d444','#d2ec6a'],
 pine:['#143b30','#1c573d','#2a7648','#3f9654','#69b765'],
 birch:['#55741f','#7c9c2a','#a5c53a','#cfe054','#eef38a']
};
function oak(name,ramp,seed,scale=1){
 const s=new Sheet(32,42),cx=16;
 s.disc(cx,38,11,3,SHADOW);trunk(s,cx,28,39,6,WOOD);
 tier(s,cx,23,15*scale,7,4,ramp,seed);tier(s,cx,15,12*scale,7,3,ramp,seed+3);tier(s,cx,8,8*scale,6,2,ramp,seed+6);
 return add(name,s.outline(ramp[0]),[16,40]);
}
oak('oak_0',LEAF.oak,1);oak('oak_1',LEAF.deep,2);oak('oak_2',LEAF.lime,3);oak('oak_3',LEAF.oak,4,.86);
function pine(name,ramp,seed){
 const s=new Sheet(24,42),cx=12;
 s.disc(cx,38,8,3,SHADOW);trunk(s,cx,30,39,4,WOOD);
 [[32,11,12],[25,9,11],[18,7,10],[11,5,9]].forEach(([base,half,height],i)=>{
  for(let y=base-height;y<=base;y++){
   const w=Math.round(half*(y-(base-height))/height+.5);
   for(let x=cx-w;x<=cx+w;x++){
    if(y===base&&(x+i)%3===0)continue;
    const value=(y-(base-height))/height*.7+((x-cx)/(half+1))*.45+(hash(x,y,seed+i)-.5)*.35;
    s.set(x,y,y>=base-1?ramp[0]:pick(value,[.05,.4,.8],[ramp[4],ramp[3],ramp[2],ramp[1]]));
   }
  }
 });
 return add(name,s.outline(ramp[0]),[12,40]);
}
pine('pine_0',LEAF.pine,5);pine('pine_1',LEAF.deep,6);
function birch(name,seed,ramp=LEAF.birch){
 const s=new Sheet(24,42),cx=12,bark=['#8d8674','#f3efe2','#d7d1bf'];
 s.disc(cx,38,7,3,SHADOW);trunk(s,cx,16,39,4,[bark[0],bark[1],bark[1]]);
 for(let y=18;y<38;y+=3+(hash(y,seed)*3|0))s.rect(cx-1+(y%2),y,2,1,'#4b4038');
 for(let y=17;y<39;y++)s.set(cx+1,y,s.get(cx+1,y)===C(bark[1])?bark[2]:s.get(cx+1,y));
 tier(s,cx,19,11,6,3,ramp,seed);tier(s,cx,11,9,6,2,ramp,seed+2);tier(s,cx,5,5,5,1,ramp,seed+4);
 return add(name,s.outline(ramp[0]),[12,40]);
}
birch('birch_0',7);birch('birch_1',8,LEAF.lime);
{const s=new Sheet(16,15);s.disc(8,13,6,2,SHADOW);tier(s,8,7,7,5,2,LEAF.oak,9);add('bush',s.outline(LEAF.oak[0]),[8,14]);}

// ---------- Small scenery ----------
const BLOOM={red:['#d8443a','#ff8f7a'],white:['#f3f6ff','#a9d2ff'],yellow:['#f6c93a','#fff09a'],pink:['#ec7fb1','#ffc4dc']};
for(const[color,[petal,glow]]of Object.entries(BLOOM))for(let f=0;f<2;f++){
 const s=new Sheet(16,12);
 for(const[x,y,h]of[[3,4,6],[8,2,8],[12,5,5]]){
  for(let i=1;i<h;i++)s.set(x+(i<3?f:0),y+i,i%3===2?GRASS.deep:'#2f7d35');
  s.set(x-1,y+h-2,'#2f7d35');
  const bx=x+f;s.set(bx,y-1,petal);s.set(bx-1,y,petal);s.set(bx+1,y,petal);s.set(bx,y+1,petal);s.set(bx,y,color==='yellow'?'#e58a1f':'#ffd84a');s.set(bx-1,y-1,glow);
 }
 add('flower_'+color+'_'+f,s,[8,11]);
}
for(let f=0;f<2;f++){
 const s=new Sheet(16,13);
 for(let x=1;x<15;x++){const h=4+Math.floor(hash(x,3,13)*7),lean=h>7?f:0;
  for(let i=0;i<h;i++)s.set(x+(i>h-3?lean:0),12-i,i>h-2?GRASS.light:hash(x,i,14)<.3?GRASS.dark:GRASS.deep);}
 add('reeds_'+f,s,[8,12]);
}
function boulder(name,w,h,wet){
 const s=new Sheet(w,h+2),cx=(w-1)/2,cy=h/2;
 s.each((x,y)=>{
  const dx=(x-cx)/(w/2-.5),dy=(y-cy)/(h/2-.5),r=dx*dx+dy*dy;
  if(r>1||y>=h)return;
  return pick(dx*.6+dy*.8+(hash(x>>1,y>>1,17)-.5)*.4,[-.45,.15,.6],['#dcdcd6','#b3b5b1','#8b8d90','#63656d']);
 }).outline('#3e3f47');
 if(wet){for(let x=1;x<w-1;x++)if(hash(x,w,19)<.75)s.set(x,h,x%3?'#e4f6ff':'#9fd4f7');}
 else s.each((x,y,c)=>!c&&y===h&&x>1&&x<w-2?SHADOW:undefined);
 return add(name,s,[Math.floor(w/2),h]);
}
boulder('boulder_0',14,11);boulder('boulder_1',10,8);boulder('wetrock_0',14,10,true);boulder('wetrock_1',9,7,true);
for(let f=0;f<2;f++){
 const s=new Sheet(10,7);
 s.disc(4.5,3,4.5,2.6,'#3f9a48').each((x,y,c)=>c&&x>=4&&x<=5&&y<=2?0:c&&(x+y)%4===0?'#63bd58':undefined).outline('#1f6a3a');
 if(f)s.set(8,1,'#bfe6ff');
 add('lily_'+f,s,[5,4]);
}
{const s=new Sheet(10,8);s.disc(4.5,4,4.5,2.6,'#3f9a48').outline('#1f6a3a');s.set(4,2,'#ffc4dc');s.set(5,2,'#ec7fb1');s.set(4,3,'#ec7fb1');s.set(5,3,'#fff09a');s.set(3,3,'#ffc4dc');s.set(6,3,'#ffc4dc');add('lily_bloom',s,[5,5]);}
{const s=new Sheet(16,14);
 for(let x=0;x<16;x++){s.set(x,4,'#5f3b1e');s.set(x,5,'#d39c5e');s.set(x,6,'#9a6836');s.set(x,7,'#5f3b1e');s.set(x,9,'#5f3b1e');s.set(x,10,'#c18c52');s.set(x,11,'#5f3b1e');}
 s.rect(6,0,4,14,'#b07a44').rect(6,0,1,14,'#5f3b1e').rect(9,0,1,14,'#5f3b1e').rect(6,0,4,1,'#e0ad6e').rect(6,13,4,1,'#5f3b1e');
 add('fence',s,[8,13]);}
{const s=new Sheet(16,14);
 s.rect(6,0,4,14,'#b07a44').rect(6,0,1,14,'#5f3b1e').rect(9,0,1,14,'#5f3b1e').rect(6,0,4,1,'#e0ad6e').rect(6,13,4,1,'#5f3b1e');
 add('post',s,[8,13]);}
for(let v=0;v<2;v++){
 const s=new Sheet(14,12),ramp=v?['#2f6e2a','#4f9f3a','#84c84f','#c4e66d']:['#27603a','#3f9148','#6fbf5b','#a9e07c'];
 s.disc(6.5,6,6,4.5,ramp[1]).each((x,y,c)=>c?pick((x-7)/7+(y-6)/5+(hash(x>>1,y>>1,23+v)-.5),[-.7,.1],[ramp[3],ramp[2],ramp[1]]):undefined).outline(ramp[0]);
 s.set(6,5,ramp[0]);s.set(7,6,ramp[0]);s.set(5,7,ramp[0]);
 add('crop_'+v,s,[7,11]);
}
{const s=new Sheet(14,18);
 s.rect(6,6,2,12,'#8f6037').rect(6,6,1,12,'#4a2d1b').rect(1,1,12,7,'#e9d6a5').rect(1,1,12,1,'#fbf0d2').rect(1,7,12,1,'#b4975f').outline('#4a2d1b');
 s.rect(3,3,8,1,'#7a5a34').rect(3,5,5,1,'#7a5a34');add('sign',s,[7,17]);}

// ---------- Moving water ----------
for(let f=0;f<4;f++){
 add('fall_'+f,new Sheet(16,16).each((x,y)=>{
  const k=(y+16-f*4+(x*5)%7*3)%16,lane=x%4;
  return lane===3?(k<6?'#8fc9f7':'#57a8ee'):k<3?'#f4fcff':k<8?'#bfe6ff':k<12?'#8fc9f7':'#6fb9f3';
 }));
 // Foam where the falling water meets the river.
 add('splash_'+f,new Sheet(16,8).each((x,y)=>{
  const crest=2+Math.floor(hash(x>>1,f,29)*3);
  if(y<crest)return y===crest-1&&hash(x,f,30)<.4?'#d6f0ff':'#ffffff';
  return hash(x,y+f*5,31)<.14?'#e4f6ff':0;
 }));
}
for(let f=0;f<3;f++){
 const s=new Sheet(15,7),rx=3+f*2,ry=1+f;
 s.each((x,y)=>{const r=((x-7)/rx)**2+((y-3)/ry)**2;return r<=1.05&&r>=(f?.55:.2)&&hash(x,y,33+f)<.85?(f===2?'#bfe6ff99':'#e4f6ff'):0;});
 add('ripple_'+f,s,[7,3]);
}
for(let f=0;f<2;f++){const s=new Sheet(5,5);s.set(2,2,'#ffffff');if(f){s.set(2,0,'#e4f6ff');s.set(2,4,'#e4f6ff');s.set(0,2,'#e4f6ff');s.set(4,2,'#e4f6ff');s.set(2,1,'#ffffff');s.set(2,3,'#ffffff');s.set(1,2,'#ffffff');s.set(3,2,'#ffffff');}else{s.set(2,1,'#e4f6ff');s.set(2,3,'#e4f6ff');s.set(1,2,'#e4f6ff');s.set(3,2,'#e4f6ff');}add('glint_'+f,s,[2,2]);}

addBuildings({add,Sheet,C,hash,pick,rng,WOOD,ROCK,GRASS,SHADOW,stone});
addActors({add,Sheet,C,hash,pick,rng,SHADOW});

const {sheet,index}=atlas.pack();
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','assets');
writeFileSync(path.join(root,'tiles.png'),sheet.png());
writeFileSync(path.join(root,'tiles.json'),JSON.stringify(index));
console.log('tiles.png',sheet.w+'x'+sheet.h,Object.keys(index).length+' sprites');
