// Building sprites. Each one records where its door and chimney are so the game can
// line the door up with a tile, open it, and place smoke.
// Metadata after the rectangle: anchorX, anchorY, doorLeft, doorTop, doorWidth, doorHeight, smokeX, smokeY, then sparkle points.
export function addBuildings({add,Sheet,C,hash,tone,WOOD,ROCK,SHADOW,stone,crown,LEAF}){
 const INK='#2f2018';
 const ROOF={
  red:['#641c1e','#8e2b26','#b63d2f','#d5573c','#ea7b55','#f6a57c'],
  blue:['#16306e','#234a9c','#3564c4','#4f82dd','#77a4ee','#a6c6f8'],
  green:['#243f1c','#375a26','#4e7a31','#6a9a40','#8cb957','#b4d67c']
 };
 const PLASTER=['#b89a66','#d5bd8c','#ecdcb0','#f8edcd'];
 const STONE=['#4f5158','#6f7177','#8f9196','#b0b2b1','#d0d1cc'];
 const GLASS=['#3f79b8','#62a3da','#8fc6ee','#c6e6fb'];
 /** Darken what is already painted, for cast shadows. */
 function shade(s,x,y,w,h,k=.72){
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const c=s.get(x+i,y+j);if((c&255)!==255)continue;
   s.set(x+i,y+j,(((c>>>24)*k&255)<<24|((c>>>16&255)*k&255)<<16|((c>>>8&255)*k&255)<<8|255)>>>0);
  }
 }
 /** Rows of rounded tiles, lit from the left, with a ridge beam and a thick eave. */
 function roof(s,x0,y0,w,h,ramp,inset=6){
  for(let y=0;y<h;y++){
   const cut=Math.round(inset*(1-y/(h-1)));
   for(let x=cut;x<w-cut;x++){
    const row=Math.floor(y/7),ry=y%7,sx=(x+(row%2?5:0))%10,side=(x-cut)/(w-2*cut);
    let c=tone(ramp,.6+(ry<2?.16:ry>4?-.18:0)+(sx<1?-.2:sx<4?.07:0)-side*.24-y/h*.06,x,y,.35);
    if(ry===6||ry===5&&(sx===0||sx===9))c=ramp[0];
    if(y<4)c=[ramp[0],ramp[5],ramp[4],ramp[1]][y];
    if(y>=h-5)c=[ramp[4],ramp[3],ramp[2],ramp[1],ramp[0]][y-(h-5)];
    if(x-cut<3||w-cut-1-x<3)c=x===cut||x===w-cut-1?ramp[0]:x-cut<3?ramp[4]:ramp[1];
    s.set(x0+x,y0+y,c);
   }
  }
 }
 function blocks(x,y,seed){
  const row=Math.floor(y/5),sy=y%5,bx=x+(row%2?5:0),sx=bx%10;
  return sy===4||sx===9?STONE[0]:sy===0?STONE[4]:tone(STONE.slice(1),.5+(hash(Math.floor(bx/10),row,seed)-.5)*.6);
 }
 function wall(s,x0,y0,w,h,{timber=false,beam=0}={}){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let c=tone(PLASTER,.68+(hash(x>>2,y>>2,41)-.5)*.22+(hash(x,y,42)<.04?.2:0),x,y,.5);
   if(y>=h-10)c=blocks(x,y-(h-10),43);
   else if(timber&&(x<6||x>=w-6||beam&&y>=beam&&y<beam+5))c=x===0||x===w-1||y===beam+4&&x>=6&&x<w-6?INK:tone(WOOD.slice(1),.55+(hash(x>>1,y>>3,44)-.5)*.5-(x>=w-6?.15:0));
   else if(x===0||x===w-1)c=INK;
   s.set(x0+x,y0+y,c);
  }
 }
 function window(s,x,y,{shutter,box=true}={}){
  s.rect(x-1,y-1,22,26,INK).rect(x,y,20,24,'#7c5230').rect(x,y,20,1,'#c38a52');
  for(let j=0;j<20;j++)for(let i=0;i<16;i++)s.set(x+2+i,y+2+j,tone(GLASS,.78-j/20*.55+((i+j*2)%17<4?.3:0)));
  s.rect(x+9,y+2,2,20,'#f4ead0').rect(x+2,y+11,16,2,'#f4ead0').rect(x+10,y+2,1,20,'#c9b88f').rect(x+2,y+12,16,1,'#c9b88f');
  s.rect(x-3,y+24,26,3,'#ecdcb0').rect(x-3,y+26,26,1,'#b89a66').rect(x-3,y+27,26,1,INK);
  if(shutter)for(const sx of[x-8,x+22]){s.rect(sx,y-1,7,26,INK).rect(sx+1,y,5,24,shutter[2]);for(let j=1;j<24;j+=3)s.rect(sx+1,y+j,5,1,shutter[1]);s.rect(sx+1,y,1,24,shutter[4]);}
  if(box){
   s.rect(x-2,y+28,24,6,'#8f6037').rect(x-2,y+28,24,1,'#c38a52').rect(x-2,y+33,24,1,INK).rect(x-3,y+28,1,6,INK).rect(x+22,y+28,1,6,INK);
   for(let i=0;i<24;i+=4){const hue=[['#f28fb8','#ffd0e2'],['#e2503f','#ff9a7e'],['#f6c93a','#fff3a0']][(i/4)%3];s.rect(x-2+i,y+24,3,3,hue[0]).set(x-2+i,y+24,hue[1]);s.rect(x+1+i,y+26,1,2,'#3d8f3f');s.set(x-1+i,y+27,'#57ab47');}
  }
 }
 function door(s,x,y,w=22,h=34,wood=WOOD){
  s.rect(x-3,y-3,w+6,h+3,INK).rect(x-2,y-2,w+4,h+2,wood[1]).rect(x-2,y-2,w+4,1,wood[3]);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const plank=i%6;s.set(x+i,y+j,plank===5?wood[0]:plank===0?wood[4]:tone(wood.slice(1),.5+(hash(Math.floor(i/6),j>>2,45)-.5)*.4-j/h*.15));}
  for(const[cx,cy]of[[x,y],[x+w-1,y]]){s.set(cx,cy,wood[1]);s.set(cx+(cx===x?1:-1),cy,wood[1]);s.set(cx,cy+1,wood[1]);}
  for(const j of[7,h-9]){s.rect(x,y+j,w,3,'#3f414a').rect(x,y+j,w,1,'#82848a');for(let i=3;i<w;i+=6)s.set(x+i,y+j+1,'#cfd0cb');}
  s.rect(x+w-7,y+Math.floor(h/2)-1,4,4,'#a8741c').rect(x+w-7,y+Math.floor(h/2)-1,3,3,'#f6c93a').set(x+w-7,y+Math.floor(h/2)-1,'#fff3a0');
  s.rect(x-6,y+h,w+12,3,STONE[4]).rect(x-6,y+h+2,w+12,1,STONE[2]).rect(x-8,y+h+3,w+16,3,STONE[3]).rect(x-8,y+h+5,w+16,1,STONE[0]);
 }
 function chimney(s,x,y){
  for(let j=0;j<28;j++)for(let i=0;i<16;i++){const row=Math.floor(j/4),bx=(i+(row%2?4:0))%8;s.set(x+i,y+j,j%4===3||bx===7?'#6e3327':tone(['#8e4634','#b05c44','#c9755a'],.5+(hash(Math.floor((i+(row%2?4:0))/8),row,47)-.5)*.7-i/16*.3));}
  s.rect(x-2,y-2,20,5,'#b0b2b1').rect(x-2,y-2,20,1,'#eeeee8').rect(x-2,y+2,20,1,'#6f7177').rect(x+3,y-4,10,2,'#2f2018');
  for(let j=-2;j<28;j++){s.set(x-(j<3?3:1),y+j,INK);s.set(x+(j<3?18:16),y+j,INK);}
  s.rect(x-2,y-3,20,1,INK);
 }
 function lantern(s,x,y){s.rect(x,y,7,10,INK).rect(x+1,y+2,5,6,'#f6c93a').rect(x+2,y+3,3,4,'#fff3a0').rect(x+2,y-2,3,2,INK);}
 function shrub(s,x,y,seed,flower){
  crown(s,[[x,y,6],[x+8,y-3,7],[x+16,y,6]],LEAF.oak,seed);
  if(flower)for(const[i,j]of[[-1,-3],[6,-6],[12,-3],[17,-1],[3,0]]){s.rect(x+i,y+j,2,2,flower[0]);s.set(x+i,y+j,flower[1]);}
 }
 /** A pitched-roof house seen from the front. */
 function house(name,{w,roofH,wallH,ramp,doorX,windows,chimneyX,timber,beam,shutter,extra}){
  const top=30,s=new Sheet(w,top+roofH+wallH+8),wallY=top+roofH-5,baseY=wallY+wallH;
  s.rect(10,baseY-2,w-20,7,SHADOW);
  wall(s,6,wallY,w-12,wallH,{timber,beam});
  if(chimneyX!==undefined)chimney(s,chimneyX,top-22);
  roof(s,0,top,w,roofH,ramp);
  shade(s,6,top+roofH,w-12,5,.74);shade(s,6,top+roofH+5,w-12,2,.88);
  for(const x of windows)window(s,x,wallY+16,{shutter});
  door(s,doorX-11,baseY-40);
  extra?.(s,{top,wallY,baseY});
  return add(name,s,[doorX,baseY-1,doorX-11,baseY-40,22,34,chimneyX===undefined?-1:chimneyX+8,top-26]);
 }
 function gable(s,cx,y,half,ramp,emblem){
  for(let i=0;i<=half;i++){
   const yy=y+i,x0=cx-i-3,x1=cx+i+3;
   for(let x=x0;x<=x1;x++)s.set(x,yy,x<=x0+3||x>=x1-3?(x===x0||x===x1?ramp[0]:x<cx?ramp[4]:ramp[2]):tone(PLASTER,.72+(hash(x>>2,yy>>2,48)-.5)*.2-(i<4?.2:0),x,yy,.4));
  }
  s.rect(cx-half-3,y+half+1,2*half+7,2,ramp[0]);emblem(s,cx,y+Math.round(half*.6));
 }

 house('ferry',{w:160,roofH:62,wallH:60,ramp:ROOF.blue,doorX:80,windows:[26,114],chimneyX:116,timber:true,shutter:ROOF.blue,extra(s,{wallY,baseY}){
  // A hanging sign with a little boat, a lantern and a life ring.
  s.rect(66,wallY+7,28,13,INK).rect(67,wallY+8,26,11,'#f4ead0').rect(67,wallY+8,26,1,'#ffffff');
  s.rect(72,wallY+14,16,2,'#234a9c').rect(74,wallY+16,12,1,'#234a9c').rect(79,wallY+10,1,4,INK).rect(80,wallY+10,4,3,'#d5573c');
  lantern(s,98,baseY-34);
  s.disc(56,baseY-22,6,6,'#f4ead0').disc(56,baseY-22,3,3,PLASTER[1]);for(const[i,j]of[[-6,0],[5,0],[0,-6],[0,5]])s.rect(55+i,baseY-23+j,3,3,'#d5573c');
  shrub(s,10,baseY-4,71,['#f28fb8','#ffd0e2']);shrub(s,132,baseY-4,72);
 }});
 house('mill',{w:192,roofH:70,wallH:64,ramp:ROOF.red,doorX:112,windows:[58,148],chimneyX:146,timber:true,beam:8,extra(s,{wallY,baseY}){
  // Double barn doors where the grain goes in.
  s.rect(15,wallY+14,30,baseY-wallY-24,INK);
  for(let j=0;j<baseY-wallY-26;j++)for(let i=0;i<28;i++)s.set(16+i,wallY+15+j,i===13||i===14?INK:i%7===6?WOOD[1]:tone(WOOD.slice(1),.5+(hash(Math.floor(i/7),j>>2,49)-.5)*.4));
  for(let i=0;i<12;i++){s.set(17+i,wallY+17+i*2,WOOD[0]);s.set(42-i,wallY+17+i*2,WOOD[0]);}
  lantern(s,130,baseY-34);shrub(s,160,baseY-4,73,['#fff3a0','#ffffff']);
 }});
 house('library',{w:224,roofH:70,wallH:68,ramp:ROOF.red,doorX:112,windows:[18,54,150,186],chimneyX:176,extra(s,{top,wallY,baseY}){
  s.rect(0,top+62,224,2,'#f6c93a');
  gable(s,112,top+6,44,['#7a5216','#a8741c','#d9a02c','#f6c93a','#fff09a','#fff09a'],(g,cx,cy)=>{
   g.rect(cx-15,cy-1,30,15,INK).rect(cx-14,cy,13,12,'#fbfbf4').rect(cx+1,cy,13,12,'#fbfbf4').rect(cx-1,cy,2,14,'#a8741c').rect(cx-14,cy+12,28,1,'#c9c4b0');
   for(let i=2;i<10;i+=3){g.rect(cx-12,cy+i,9,1,'#8f8a7a');g.rect(cx+3,cy+i,9,1,'#8f8a7a');}
  });
  // Stone columns and a lintel frame the entrance.
  for(const x of[90,128]){for(let j=0;j<baseY-wallY-8;j++)for(let i=0;i<6;i++)s.set(x+i,wallY+6+j,i===0||i===5?STONE[1]:i<3?STONE[4]:STONE[3]);s.rect(x-1,wallY+4,8,3,STONE[4]).rect(x-1,baseY-5,8,3,STONE[2]);}
  s.rect(88,wallY+1,48,4,STONE[4]).rect(88,wallY+4,48,1,STONE[1]);
  shrub(s,62,baseY-4,74,['#f28fb8','#ffd0e2']);shrub(s,142,baseY-4,75,['#f28fb8','#ffd0e2']);
 }});
 house('station',{w:192,roofH:56,wallH:64,ramp:ROOF.green,doorX:96,windows:[26,146],chimneyX:26,shutter:ROOF.green,extra(s,{top,wallY,baseY}){
  gable(s,96,top-14,34,ROOF.green,(g,cx,cy)=>{
   g.disc(cx,cy+2,11,11,INK).disc(cx,cy+2,9.5,9.5,'#fbfbf4').disc(cx,cy+2,1.5,1.5,INK);
   for(let k=0;k<12;k++)g.set(cx+Math.round(Math.sin(k*Math.PI/6)*8),cy+2-Math.round(Math.cos(k*Math.PI/6)*8),'#6f7177');
   g.rect(cx,cy-5,1,7,INK).rect(cx,cy+2,6,1,INK);
  });
  s.rect(56,wallY+7,80,11,INK).rect(57,wallY+8,78,9,'#f4ead0').rect(57,wallY+8,78,1,'#ffffff');for(let x=64;x<128;x+=8)s.rect(x,wallY+11,5,3,ROOF.green[1]);
  lantern(s,114,baseY-34);shrub(s,60,baseY-4,76);
 }});
 {// The platform canopy that stands beside the station.
  const s=new Sheet(96,90);
  s.rect(4,82,88,6,SHADOW);
  for(let y=0;y<22;y++)for(let x=0;x<96;x++)s.set(x,60+y,y<3?STONE[4]:y===21?STONE[0]:x%16===15?STONE[1]:tone(STONE.slice(2),.5+(hash(x>>4,3,50)-.5)*.5-y/22*.3));
  for(const x of[8,82]){s.rect(x,22,6,40,WOOD[2]).rect(x,22,2,40,WOOD[4]).rect(x+5,22,1,40,WOOD[0]).rect(x-1,22,1,40,INK).rect(x+6,22,1,40,INK);}
  roof(s,0,0,96,26,ROOF.green,4);shade(s,8,26,6,4);shade(s,82,26,6,4);
  for(let x=30;x<66;x++)for(let y=0;y<7;y++)s.set(x,50+y,y===0?WOOD[4]:y===6?WOOD[0]:WOOD[2]);
  for(const x of[32,60])s.rect(x,57,3,5,WOOD[1]);
  add('platform',s,[48,82]);
 }

 {// Star Observatory: a stone tower under a metal dome with an open slit.
  const s=new Sheet(128,184),cx=63.5,metal=['#28384e','#40566f','#5f7892','#869db5','#afc2d4','#d6e2ec','#f1f6fa'];
  s.disc(cx,172,50,8,SHADOW);
  for(let y=72;y<174;y++)for(let x=18;x<110;x++){
   const dx=(x-cx)/46,curve=Math.sqrt(Math.max(0,1-dx*dx));
   if(Math.abs(dx)>1||y>168+Math.round(curve*5))continue;
   const row=Math.floor((y-72)/6),by=(y-72)%6,bx=(x+(row%2?7:0))%14;
   s.set(x,y,by===5||bx===13?(dx>.3?STONE[0]:STONE[1]):by===0&&dx<.5?STONE[4]:tone(STONE.slice(1),.62-dx*.42+(hash(Math.floor((x+(row%2?7:0))/14),row,51)-.5)*.3,x,y,.4));
  }
  for(let y=12;y<=76;y++)for(let x=6;x<122;x++){
   const dx=(x-cx)/55,dy=(y-76)/63,r=dx*dx+dy*dy;if(r>1)continue;
   let c=tone(metal.slice(1),.58-dx*.5-dy*.1+(1-r)*.12,x,y,.6);
   if(Math.abs(Math.abs(dx)-.52*Math.sqrt(1-dy*dy))<.014||y===52||y===53)c=metal[1];
   s.set(x,y,c);
  }
  s.rect(52,14,24,52,'#131926').rect(54,16,20,48,'#080b12');
  for(let i=0;i<20;i++){const x=59+Math.round(i*.45),y=54-i*2;s.rect(x,y,10,2,i%5===4?'#8a5a1c':'#d9a441').rect(x,y,3,2,'#f6d27a').rect(x+8,y,2,2,'#8a5a1c');}
  s.rect(66,11,12,5,'#f1c869').rect(66,11,12,1,'#fff3c0');
  s.rect(10,73,108,7,metal[1]).rect(10,73,108,2,metal[4]).rect(10,79,108,1,metal[0]);
  for(let x=14;x<116;x+=8)s.rect(x,75,2,4,metal[3]);
  s.outline('#1b2230');
  door(s,53,134,22,34,['#28384e','#40566f','#5f7892','#869db5','#afc2d4']);
  for(const x of[26,82]){s.rect(x-1,100,20,26,INK).rect(x,101,18,24,'#7c5230');for(let j=0;j<20;j++)for(let i=0;i<14;i++)s.set(x+2+i,103+j,tone(GLASS,.78-j/20*.55+((i+j*2)%17<4?.3:0)));s.rect(x+8,103,2,20,'#f4ead0').rect(x+2,112,14,2,'#f4ead0');s.set(x,101,INK);s.set(x+17,101,INK);s.rect(x-2,126,22,3,STONE[4]).rect(x-2,128,22,1,STONE[1]);}
  add('observatory',s,[64,168,53,134,22,34,-1,-1,72,8]);
 }

 {// Glass Conservatory.
  const s=new Sheet(224,160),frame='#f6f9f9',edge='#8fa6ac',dark='#3d5560';
  s.rect(8,150,208,7,SHADOW);
  const pane=(x,y,seed,plants)=>{
   const leaf=hash(x>>2,y>>2,seed),fine=hash(x>>1,y>>1,seed+1);
   if(plants>0&&leaf<plants)return fine<.07?'#f28fb8':fine<.12?'#f6c93a':fine<.16?'#e2503f':leaf<plants*.5?'#3d8f55':fine<.5?'#57ab62':'#7cc37e';
   return(x+y*2)%41<7?'#eefbff':(x*3+y)%53<9?'#a8dcea':'#c5ecf3';
  };
  for(let y=8;y<62;y++){
   const cut=Math.round(36*(1-(y-8)/53));
   for(let x=cut;x<224-cut;x++)s.set(x,y,x-cut<2||223-cut-x<2||y<10?edge:(x-cut)%24<2||y===34||y===35||y>=60?frame:pane(x,y,61,y>46?.25:0));
  }
  for(let y=62;y<136;y++)for(let x=4;x<220;x++)s.set(x,y,x<6||x>217?edge:(x-4)%24<2||y<65||y===98||y===99?frame:pane(x,y,63,y>112?.62:y>86?.3:.08));
  for(let y=0;y<16;y++)for(let x=0;x<224;x++)s.set(x,134+y,y<2?STONE[4]:y===15?STONE[0]:blocks(x,y-2,64));
  s.rect(96,12,32,5,frame).rect(108,2,8,10,frame).rect(110,0,4,3,'#f6c93a').rect(108,2,2,10,edge);
  s.rect(94,96,36,52,dark).rect(96,98,32,50,frame);
  for(const x of[98,114])for(let j=0;j<46;j++)for(let i=0;i<12;i++)s.set(x+i,100+j,i===0||i===11?edge:tone(GLASS.slice(1),.8-j/46*.6+((i+j)%19<4?.3:0)));
  s.rect(110,122,2,4,'#f6c93a').rect(113,122,2,4,'#f6c93a');
  s.rect(88,148,48,3,STONE[4]).rect(88,150,48,1,STONE[2]).outline(dark);
  add('conservatory',s,[112,149,96,98,32,50,-1,-1]);
 }

 {// Crystal Grotto: a cave mouth in a mound of boulders.
  const s=new Sheet(192,132),gem=['#3f2478','#6a3fb5','#9a63e8','#c9a0ff','#efdcff','#ffffff'];
  s.disc(96,121,88,9,SHADOW);
  s.each((x,y)=>{
   const dx=(x-95.5)/92,dy=(y-124)/112,r=dx*dx+dy*dy+Math.sin(x*.17)*.03+Math.sin(x*.45)*.018;
   if(r>1||y>122)return;
   const base=C(stone(x,y*1.1|0));
   const lit=.2-dx*.5-(1-r)*.55+dy*.2;
   return base===C(ROCK[1])?ROCK[0]:tone(ROCK.slice(1),.52-lit*.5+(hash(x>>1,y>>1,71)-.5)*.18+(base===C(ROCK[5])?.12:base===C(ROCK[2])?-.1:0),x,y,.5);
  });
  for(let y=60;y<124;y++)for(let x=70;x<122;x++){
   const dx=(x-95.5)/25,dy=(y-122)/60,r=dx*dx+dy*dy;
   if(r<=1)s.set(x,y,r>.82?ROCK[0]:r>.66?'#241a1d':y<88?'#08060c':'#130f19');
  }
  const shard=(x,y,h,w)=>{
   for(let j=0;j<h;j++){
    const taper=j<h*.34?j/(h*.34):1,half=Math.max(0,Math.round(w*taper/2));
    for(let i=-half;i<=half;i++)s.set(x+i,y-h+j,i===-half&&half>1?gem[4]:i===half&&half>1?gem[0]:i<-half/3?gem[3]:i>half/3?gem[1]:j<h*.34?gem[4]:gem[2]);
   }
   s.set(x-1,y-h+2,gem[5]);
  };
  [[44,120,32,12],[56,122,20,8],[32,122,18,8],[24,123,10,5],[140,122,30,12],[154,122,20,8],[128,124,16,6],[164,123,10,5],[92,48,22,8],[104,52,14,6],[82,54,10,5]].forEach(a=>shard(...a));
  s.outline('#1d1412');
  s.rect(78,120,36,4,STONE[4]).rect(78,123,36,1,STONE[2]).rect(74,124,44,4,STONE[3]).rect(74,127,44,1,STONE[0]);
  add('grotto',s,[96,124,76,72,40,50,-1,-1,44,92,140,94,92,30,154,104,32,106]);
 }

 for(let f=0;f<4;f++){
  // The mill wheel seen at an angle: a narrow near face with spokes, and the paddles
  // receding toward the mill wall on the right. Four frames turn it an eighth of a circle.
  const s=new Sheet(56,92),cx=15.5,cy=44,rx=12,ry=40,deep=24,turn=f*Math.PI/16;
  const edge=y=>{const k=1-((y-cy)/ry)**2;return k<0?null:cx+rx*Math.sqrt(k);};
  for(let y=cy-ry;y<=cy+ry;y++){const x=edge(y);if(x===null)continue;for(let i=Math.floor(x)-2;i<x+deep;i++)s.set(i,y,(y+i)%7<1?WOOD[0]:WOOD[1]);}
  for(let i=0;i<8;i++){
   const a=turn+i*Math.PI/4;if(Math.cos(a)<.12)continue;
   const y=Math.round(cy+Math.sin(a)*ry),x=Math.round(cx+Math.cos(a)*rx),tall=Math.max(3,Math.round(4+Math.cos(a)*4));
   for(let j=0;j<tall;j++)for(let k=-1;k<deep+2;k++)s.set(x+k,y-Math.floor(tall/2)+j,j===0?WOOD[4]:j===tall-1?WOOD[0]:k>deep-3?WOOD[1]:tone(WOOD.slice(2),.6-k/deep*.5,x+k,y,.5));
  }
  s.each((x,y)=>{
   const dx=(x-cx)/rx,dy=(y-cy)/ry,r=Math.hypot(dx,dy);if(r>1)return;
   const a=((Math.atan2(dy,dx)-turn)%(Math.PI/4)+Math.PI/4)%(Math.PI/4),arc=Math.min(a,Math.PI/4-a)*r*26;
   if(r>.84)return r>.95?WOOD[1]:dx<0?WOOD[4]:WOOD[3];
   if(r<.14)return dx<0?'#e9bd82':WOOD[3];
   if(r<.22)return WOOD[0];
   if(arc<2.2)return arc<1.1?WOOD[4]:WOOD[2];
   return'#2a1a12';
  }).outline(WOOD[0]);
  for(let x=4;x<48;x++){const h=hash(x>>1,f,81);if(h<.6)s.set(x,86+Math.floor(h*8)%4,'#eefaff');if(h>.5)s.set(x,89+Math.floor(h*6)%3,'#cfeaff');}
  add('wheel_'+f,s,[54,86]);
 }

 {// A trail camp: tent and a fire with three frames.
  const s=new Sheet(64,54);
  s.disc(32,47,28,5,SHADOW);
  for(let y=4;y<48;y++){const half=Math.round((y-4)*.62);for(let x=-half;x<=half;x++){const stripe=(x+80)%16<8;s.set(32+x,y,Math.abs(x)<(y-24)*.28?(Math.abs(x)<(y-24)*.2?'#1d1412':'#3a2a22'):stripe?tone(['#b8601f','#d97b2c','#f0a24a','#fbc478'],.62-x/half*.3):tone(['#c9b88f','#e3cf9f','#fbf0d2'],.62-x/half*.3));}}
  s.outline('#2f2018');s.rect(31,0,3,6,WOOD[2]).rect(31,0,1,6,WOOD[4]);
  for(const x of[5,58])s.rect(x,46,2,5,WOOD[1]);
  add('tent',s,[32,49]);
  for(let f=0;f<3;f++){
   const t=new Sheet(24,28);
   t.rect(3,22,18,4,WOOD[2]).rect(3,22,18,1,WOOD[4]).rect(2,25,20,2,WOOD[0]).rect(6,20,4,3,WOOD[3]).rect(15,20,4,3,WOOD[1]);
   for(let y=3;y<22;y++){const half=Math.max(0,Math.round((y-3)*.42-((y+f*2)%5===0?2:0))),sway=y<10?(f-1)*2:f-1;for(let x=-half;x<=half;x++)t.set(12+x+sway,y,Math.abs(x)<half-3?'#fffbe0':Math.abs(x)<half-1?'#fff09a':y<11?'#f6c93a':'#ef7d2e');}
   add('fire_'+f,t,[12,26]);
  }
 }
}
