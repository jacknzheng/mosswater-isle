// Reads the island's text grid and turns it into walkable tiles, landmarks and scenery.
type Facing="north"|"south"|"west"|"east";
type Point=[number,number];
type Place={name:string;kind:string;door:Point;pin:Point;box:[number,number,number,number];open?:[number,number,number,number];z?:number};
// A piece of scenery. x and y are its top left corner; z is the ground line it is sorted by.
type Prop={s:string;x:number;y:number;z:number;frames?:number;rate?:number;phase?:number;turns?:number};
declare const WORLD:{tile:number;map:string[];places:{name:string;kind:string;door:Point}[];folk:{look:string;at:Point}[]};
// Each sprite is [x, y, width, height, anchorX, anchorY, ...extras] on the tile sheet.
declare const TILES:Record<string,number[]>;
const $=(id:string)=>document.getElementById(id)!;
const cell=WORLD.tile,grid=WORLD.map,cols=grid[0].length,lines=grid.length,W=cols*cell,H=lines*cell;
const WATERY="~=DlRW",PATHY=",=HD",ROCKY="#HW";
const charAt=(x:number,y:number)=>grid[y]?.[x]??"T";
const solid=new Uint8Array(cols*lines);
const props:Prop[]=[],places:Place[]=[],falls:Point[]=[],chimneys:Point[]=[],sparkles:Point[]=[],blooms:Point[]=[],ponds:number[]=[];
function noise(x:number,y:number,seed=0){
 let h=Math.imul(x+seed*374761393|0,668265263)^Math.imul(y|0,2246822519);
 h=Math.imul(h^h>>>13,3266489917);return((h^h>>>16)>>>0)/4294967296;
}
/** Stand a sprite with its anchor on a ground point. */
function stand(sprite:string,x:number,y:number,more:Partial<Prop>={}){
 const t=TILES[sprite]??TILES[sprite+"_0"];
 const item:Prop={s:sprite,x:Math.round(x)-(t[4]??0),y:Math.round(y)-(t[5]??t[3]),z:y,...more};
 props.push(item);return item;
}
function block(x:number,y:number){if(x>=0&&y>=0&&x<cols&&y<lines)solid[y*cols+x]=1;}
function plantTree(kind:string,x:number,y:number,sx:number,sy:number){
 const r=noise(x,y,3);
 const sprite=kind==="P"?"pine_"+(r<.6?0:1):kind==="B"?(r<.7?"birch_"+(r<.4?0:1):"oak_2"):"oak_"+(r<.4?0:r<.65?1:r<.85?3:2);
 stand(sprite,sx,sy);
}
for(let y=0;y<lines;y++)for(let x=0;x<cols;x++){
 const ch=grid[y][x],px=x*cell,py=y*cell,r=noise(x,y,1),mid=px+cell/2;
 if("TBP".includes(ch)){
  block(x,y);if(!"TBP".includes(charAt(x,y-1)))block(x,y-1);
  // Forest trees stand on every other tile, offset on alternate rows so the canopies knit together.
  if((x+(y&1))%2===0)plantTree(ch,x,y,mid+Math.round(r*8-4),py+cell-2);
 }else if("tbp".includes(ch)){block(x,y);block(x,y-1);plantTree(ch.toUpperCase(),x,y,mid,py+cell-2);}
 else if(ch==="o"){block(x,y);stand(r<.25?"bush_bloom":"bush",mid,py+cell-2);}
 else if(ch==="r"){block(x,y);stand("boulder_"+(r<.6?0:1),mid,py+cell-5);}
 else if(ch==="s"){block(x,y);stand("sign",mid,py+cell-2);}
 else if(ch==="f"){const color=["red","white","yellow","pink"][Math.floor(r*4)];stand("flower_"+color,mid,py+cell-5,{frames:2,rate:5,phase:Math.floor(noise(x,y,2)*10)});if(r<.5)blooms.push([mid,py+12]);}
 else if(ch==="g")stand("reeds",mid,py+cell-3,{frames:2,rate:6,phase:Math.floor(noise(x,y,2)*12)});
 else if(ch==="c"){block(x,y);stand("crop_"+(r<.5?0:1),mid,py+cell-5);}
 else if(ch==="x"){
  block(x,y);
  if(charAt(x-1,y)==="x"||charAt(x+1,y)==="x")stand("fence",mid,py+cell-3);
  else{stand("post",mid,py+cell/2-2);stand("post",mid,py+cell-2);}
 }else if(WATERY.includes(ch)){
  if(ch==="W"){block(x,y);falls.push([px,py]);}
  else if(ch!=="="&&ch!=="D"){
   block(x,y);
   if(ch==="l")r<.3?stand("lily_bloom",mid,py+20):stand("lily",mid+Math.round(r*8-4),py+18,{frames:2,rate:9,phase:Math.floor(r*18)});
   else if(ch==="R")stand("wetrock_"+(r<.55?0:1),mid,py+24);
   else if(WATERY.includes(charAt(x-1,y))&&WATERY.includes(charAt(x+1,y))&&WATERY.includes(charAt(x,y-1))&&WATERY.includes(charAt(x,y+1)))ponds.push(y*cols+x);
  }else if(ch==="="){
   if(charAt(x,y-1)!=="=")stand("rail",px,py+6,{z:py+2});
   if(charAt(x,y+1)!=="=")stand("rail",px,py+cell+6,{z:py+cell+10});
  }
 }else if(ch==="#")block(x,y);
}
for(const p of WORLD.places){
 const t=TILES[p.kind],left=p.door[0]*cell+cell/2-t[4],base=p.door[1]*cell,top=base-1-t[5];
 props.push({s:p.kind,x:left,y:top,z:base});
 for(let y=Math.floor((top+20)/cell);y<p.door[1];y++)for(let x=Math.floor(left/cell);x<=Math.floor((left+t[2]-1)/cell);x++)block(x,y);
 places.push({name:p.name,kind:p.kind,door:[p.door[0]*cell+cell/2,base+cell/2],pin:[left+t[4],top+12],box:[left,top,t[2],t[3]],open:[left+t[6],top+t[7],t[8],t[9]],z:base});
 if(t[10]>=0)chimneys.push([left+t[10],top+t[11]]);
 for(let i=12;i+1<t.length;i+=2)sparkles.push([left+t[i],top+t[i+1]]);
 if(p.kind==="mill")stand("wheel",left+8,base+6,{frames:4,rate:2,z:base+1});
 if(p.kind==="station"){
  const x=left+t[2]+48;stand("platform",x,base-1);
  for(let ty=p.door[1]-3;ty<p.door[1];ty++)for(let tx=Math.floor((x-48)/cell);tx<=Math.floor((x+47)/cell);tx++)block(tx,ty);
 }
}
// Villagers stand in place and look around now and then.
WORLD.folk.forEach((f,i)=>{block(f.at[0],f.at[1]);stand(f.look+"_south",f.at[0]*cell+cell/2,f.at[1]*cell+cell-3,{turns:i+1}).s=f.look;});
