// Building sprites. Each one records where its door and chimney are so the game can
// line the door up with a tile, open it, and place smoke.
// Metadata after the rectangle: anchorX, anchorY, doorLeft, doorTop, doorWidth, doorHeight, smokeX, smokeY.
export function addBuildings({add,Sheet,C,hash,pick,WOOD,ROCK,SHADOW,stone}){
 const ROOF={
  red:['#d6513b','#b03a2d','#ee7c5c','#7e2722'],
  blue:['#4479d8','#2c58b4','#6fa0f2','#1c3a80'],
  green:['#648f3c','#4a6f2e','#8ab558','#30501f']
 };
 const PLASTER=['#f1e0b6','#d8c292','#fcf2d6','#a88a5a'],INK='#3a2718';

 function roof(s,x0,y0,w,h,ramp,inset=3){
  for(let y=0;y<h;y++){
   const cut=Math.round(inset*(1-y/(h-1)));
   for(let x=cut;x<w-cut;x++){
    const row=y>>2,ry=y&3,sx=(x+(row%2?3:0))%6,far=x>w*.72;
    let c=ry===3?ramp[1]:sx===0?ramp[1]:ry===0&&!far?ramp[2]:far&&ry===2?ramp[1]:ramp[0];
    if(y<2)c=y?ramp[2]:ramp[3];
    if(y>=h-3)c=y===h-1?ramp[3]:y===h-3?ramp[2]:ramp[1];
    if(x===cut||x===w-cut-1)c=ramp[3];
    s.set(x0+x,y0+y,c);
   }
  }
 }
 function wall(s,x0,y0,w,h,ramp=PLASTER){
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   let c=y<2?ramp[1]:hash(x>>1,y>>1,41)<.07?ramp[2]:ramp[0];
   if(y>=h-5){const row=(y-(h-5))>>1,bx=(x+(row%2?3:0))%7;c=y===h-1?'#56585f':bx===0||(y-(h-5))%2===1&&row===0&&false?'#6c6e75':row%2?'#9b9da0':'#b5b7b6';}
   if(x<2||x>=w-2)c=x===0||x===w-1?INK:y>=h-5?'#6c6e75':'#8f6037';
   s.set(x0+x,y0+y,c);
  }
 }
 function window(s,x,y,box=true){
  s.rect(x,y,10,10,INK).rect(x+1,y+1,8,8,'#8fc6ee').rect(x+1,y+1,8,2,'#c9e8fb').rect(x+1,y+7,8,2,'#5f9fd6');
  s.rect(x+4,y+1,2,8,'#f4ead0').rect(x+1,y+4,8,1,'#f4ead0').set(x+2,y+2,'#ffffff');
  if(box){s.rect(x-1,y+10,12,3,'#8f6037').rect(x-1,y+10,12,1,'#4a2d1b');for(let i=0;i<12;i+=2){s.set(x-1+i,y+9,i%4?'#ec7fb1':'#d8443a');s.set(x+i,y+9,'#3f9148');}}
 }
 function door(s,x,y,w=10,h=14,wood=['#9a6836','#7a4e2a','#c18c52']){
  s.rect(x-1,y-1,w+2,h+1,INK).rect(x,y,w,h,wood[0]);
  for(let i=2;i<w;i+=3)s.rect(x+i,y+1,1,h-1,wood[1]);
  s.rect(x,y,w,1,wood[2]).set(x-1,y-1,0);s.set(x+w,y-1,0);s.set(x+w-2,y+Math.floor(h/2),'#f6c93a');
  s.rect(x-2,y+h,w+4,2,'#cfd0cc').rect(x-2,y+h+1,w+4,1,'#8a8c90');
 }
 function chimney(s,x,y){
  s.rect(x,y,8,12,'#b5674a').rect(x,y,8,2,'#d9d9d2').rect(x,y+2,8,1,'#7a4030');
  for(let j=4;j<12;j+=3)for(let i=(j%2?0:3);i<8;i+=5)s.set(x+i,y+j,'#7a4030');
  s.rect(x,y,1,12,INK).rect(x+7,y,1,12,INK).rect(x,y-1,8,1,INK);
 }
 /** A pitched-roof house seen from the front. */
 function house(name,{w,roofH,wallH,ramp,doorX,windows,chimneyX,extra}){
  const top=10,s=new Sheet(w,top+roofH+wallH+3),wallY=top+roofH-2,baseY=wallY+wallH;
  s.rect(4,baseY-1,w-8,3,SHADOW);
  wall(s,3,wallY,w-6,wallH);
  if(chimneyX!==undefined)chimney(s,chimneyX,top-8);
  roof(s,0,top,w,roofH,ramp);
  s.rect(3,top+roofH,w-6,2,'#00000030');
  for(const x of windows)window(s,x,wallY+8);
  door(s,doorX-5,baseY-17);
  extra?.(s,{top,wallY,baseY});
  return add(name,s,[doorX,baseY-1,doorX-5,baseY-17,10,14,chimneyX===undefined?-1:chimneyX+4,top-9]);
 }
 function gable(s,cx,y,half,ramp,emblem){
  for(let i=0;i<=half;i++){
   const yy=y+i,x0=cx-i-2,x1=cx+i+2;
   for(let x=x0;x<=x1;x++)s.set(x,yy,x<=x0+1||x>=x1-1?(x===x0||x===x1?ramp[3]:ramp[2]):PLASTER[0]);
  }
  s.rect(cx-half-2,y+half+1,2*half+5,1,ramp[3]);emblem(s,cx,y+Math.round(half*.62));
 }

 house('ferry',{w:80,roofH:30,wallH:30,ramp:ROOF.blue,doorX:40,windows:[12,58],chimneyX:58,extra(s,{wallY}){
  s.rect(33,wallY+2,14,6,'#2c58b4').rect(34,wallY+3,12,4,'#f4ead0');s.rect(36,wallY+4,2,2,'#2c58b4').rect(39,wallY+4,2,2,'#2c58b4').rect(42,wallY+4,2,2,'#2c58b4');
 }});
 house('mill',{w:96,roofH:34,wallH:32,ramp:ROOF.red,doorX:56,windows:[30,74],chimneyX:72,extra(s,{wallY,baseY}){
  s.rect(6,wallY+6,14,baseY-wallY-11,'#8f6037').rect(6,wallY+6,14,1,'#4a2d1b').rect(12,wallY+6,2,baseY-wallY-11,'#4a2d1b');
 }});
 house('library',{w:112,roofH:34,wallH:34,ramp:ROOF.red,doorX:56,windows:[10,28,74,92],chimneyX:86,extra(s,{top,wallY}){
  for(let x=0;x<112;x++)s.set(x,top+31,'#f6c93a');
  gable(s,56,top+4,22,['#f6c93a','#f6c93a','#f6c93a','#a8741c'],(g,cx,cy)=>{
   g.rect(cx-7,cy,6,6,'#fbfbf4').rect(cx+1,cy,6,6,'#fbfbf4').rect(cx-1,cy,2,7,'#a8741c').rect(cx-7,cy+6,14,1,'#7a4e2a');
   for(let i=1;i<5;i+=2){g.rect(cx-6,cy+i,4,1,'#8f8a7a');g.rect(cx+2,cy+i,4,1,'#8f8a7a');}
  });
  s.rect(47,wallY+2,2,30,'#fbf2d6').rect(63,wallY+2,2,30,'#fbf2d6').rect(46,wallY+2,20,2,'#fbf2d6');
 }});
 house('station',{w:96,roofH:28,wallH:32,ramp:ROOF.green,doorX:48,windows:[12,74],chimneyX:14,extra(s,{top,wallY}){
  gable(s,48,top-6,17,ROOF.green,(g,cx,cy)=>{
   g.disc(cx,cy+1,5.5,5.5,'#3a2718').disc(cx,cy+1,4.5,4.5,'#fbfbf4');g.rect(cx,cy-2,1,4,'#3a2718').rect(cx,cy+1,3,1,'#3a2718');
  });
  s.rect(28,wallY+3,40,5,'#30501f').rect(29,wallY+4,38,3,'#f4ead0');for(let x=32;x<64;x+=4)s.rect(x,wallY+5,2,1,'#30501f');
 }});
 {// The platform canopy that stands beside the station.
  const s=new Sheet(48,44);
  s.rect(2,40,44,3,SHADOW).rect(0,30,48,10,'#b5b7b6').rect(0,30,48,2,'#d9d9d2').rect(0,39,48,1,'#56585f');
  for(let x=0;x<48;x+=8)s.rect(x,32,1,7,'#9b9da0');
  for(const x of[4,42])s.rect(x,10,3,22,'#8f6037').rect(x,10,1,22,'#4a2d1b');
  roof(s,0,0,48,12,ROOF.green,2);
  add('platform',s,[24,40]);
 }

 {// Star Observatory: a stone tower under a metal dome with an open slit.
  const s=new Sheet(64,90),cx=31.5,metal=['#dfe8f0','#b3c4d4','#8199b1','#566f8b','#34475f'];
  s.disc(cx,85,25,4,SHADOW);
  for(let y=36;y<86;y++)for(let x=9;x<55;x++){
   const dx=(x-cx)/23,curve=Math.sqrt(Math.max(0,1-dx*dx)),bottom=84+Math.round(curve*2)-1;
   if(Math.abs(dx)>1||y>bottom)continue;
   const row=(y-36)>>2,block=(x+(row%2?4:0))%8;
   let c=pick(dx+(hash(x>>1,y>>1,51)-.5)*.25,[-.55,.3,.72],['#d2d3cf','#b5b7b6','#96989c','#74767d']);
   if((y-36)%4===3||block===0)c=dx>.3?'#63656d':'#8a8c90';
   s.set(x,y,c);
  }
  for(let y=6;y<=38;y++)for(let x=3;x<61;x++){
   const dx=(x-cx)/27,dy=(y-38)/31,r=dx*dx+dy*dy;
   if(r>1)continue;
   let c=pick(dx*.9+dy*.25+(hash(x>>2,y>>2,53)-.5)*.12,[-.62,-.15,.35,.72],metal);
   if(Math.abs(Math.abs(dx)-.5)<.03||y===26)c=metal[3];
   s.set(x,y,c);
  }
  s.rect(26,7,12,26,'#1b2230').rect(27,8,10,24,'#0e131c');
  for(let i=0;i<10;i++)s.rect(30+Math.round(i*.4),27-i*2,5,2,i%4===3?'#8a5a1c':'#d9a441');
  s.rect(33,6,6,3,'#f1c869').rect(5,37,54,3,'#48607a').rect(5,37,54,1,'#9db1c4');
  s.outline('#232a38');
  door(s,27,69,10,14,['#6f879f','#48607a','#9db1c4']);
  window(s,13,52,false);window(s,42,52,false);
  add('observatory',s,[32,84,27,69,10,14,-1,-1,31,3]);
 }

 {// Glass Conservatory.
  const s=new Sheet(112,78),glass=['#bfe9f1','#93d2e3','#e9fbff','#5fa9c4'],frame='#f4f7f7',edge='#7f989f';
  s.rect(4,73,104,3,SHADOW);
  const pane=(x,y,seed)=>{
   const leaf=hash(x>>1,y>>1,seed);
   if(y>44&&leaf<.5)return leaf<.08?'#ec7fb1':leaf<.14?'#f6c93a':leaf<.32?'#4f9f5a':'#6fbf7a';
   if(y>34&&leaf<.2)return'#6fbf7a';
   return(x+y*2)%23<3?glass[2]:(x*3+y)%29<4?glass[1]:glass[0];
  };
  for(let y=4;y<30;y++){const cut=Math.round(18*(1-(y-4)/25));
   for(let x=cut;x<112-cut;x++)s.set(x,y,x===cut||x===111-cut||y===4?edge:(x-cut)%12===0||y===16||y===29?frame:pane(x,y,61));}
  for(let y=30;y<68;y++)for(let x=2;x<110;x++)s.set(x,y,x===2||x===109?edge:(x-2)%12===0||y===30||y===31||y===48?frame:pane(x,y,63));
  s.rect(0,66,112,8,'#b5b7b6').rect(0,66,112,1,'#d9d9d2').rect(0,73,112,1,'#56585f');for(let x=5;x<112;x+=9)s.rect(x,68,1,5,'#8a8c90');
  s.rect(47,6,18,3,frame).rect(54,1,4,5,frame).rect(55,0,2,1,'#f6c93a');
  s.rect(47,48,18,25,edge).rect(48,49,16,24,frame).rect(49,50,6,22,glass[1]).rect(57,50,6,22,glass[1]).rect(49,50,6,3,glass[2]).rect(57,50,6,3,glass[2]).set(54,61,'#f6c93a');s.set(57,61,'#f6c93a');
  s.rect(45,73,22,2,'#cfd0cc').outline('#3d5560');
  add('conservatory',s,[56,74,48,49,16,24,-1,-1]);
 }

 {// Crystal Grotto: a cave mouth in a rock mound.
  const s=new Sheet(96,66),gem=['#c9a0ff','#9a63e8','#efdcff','#693fb5'];
  s.disc(48,60,44,5,SHADOW);
  s.each((x,y)=>{
   const dx=(x-47.5)/46,dy=(y-62)/56,bump=Math.sin(x*.33)*.035+Math.sin(x*.9)*.02,r=dx*dx+dy*dy+bump;
   if(r>1||y>61)return;
   const h=hash(x>>1,y>>1,71),k=hash(x,y,73);
   return k<.05?ROCK[2]:pick(dx*.5+dy*.2+(1-r)*-.5+h*.5,[-.2,.35,.62],[ROCK[1],ROCK[0],ROCK[2],ROCK[3]]);
  });
  for(let y=30;y<62;y++)for(let x=35;x<61;x++){
   const dx=(x-47.5)/12.5,dy=(y-61)/30;
   if(dx*dx+dy*dy<=1)s.set(x,y,dx*dx+dy*dy>.78?'#3a2a24':y<44?'#0c0a10':'#17131c');
  }
  const shard=(x,y,h,w)=>{for(let j=0;j<h;j++){const half=Math.max(0,Math.round(w*(j<h*.3?j/(h*.3):1)/2));for(let i=-half;i<=half;i++)s.set(x+i,y-h+j,i<=-half+0&&half?gem[2]:i>=half&&half?gem[3]:j<h*.3?gem[2]:i<0?gem[0]:gem[1]);}};
  [[22,60,16,6],[28,61,10,4],[16,61,9,4],[70,61,15,6],[77,61,10,4],[64,62,8,3],[46,24,11,4],[52,26,7,3]].forEach(a=>shard(...a));
  s.outline('#2a1c18');
  s.rect(40,60,16,4,'#b5b7b6').rect(40,60,16,1,'#e3e4e0').rect(40,62,16,1,'#6f7177').rect(40,63,16,1,'#56585f');
  add('grotto',s,[48,62,38,36,20,26,-1,-1,22,46,70,47,46,15]);
 }

 for(let f=0;f<4;f++){// The mill wheel, turning an eighth of a circle over four frames.
  const s=new Sheet(34,34),turn=f*Math.PI/16;
  s.each((x,y)=>{
   const dx=x-16.5,dy=y-16.5,r=Math.hypot(dx,dy),a=((Math.atan2(dy,dx)-turn)%(Math.PI/4)+Math.PI/4)%(Math.PI/4),arc=Math.min(a,Math.PI/4-a)*r;
   if(r<2.6)return'#e0ad6e';
   if(r<4)return WOOD[0];
   if(r>=13&&r<16.6&&arc<2.3)return arc<1?'#d39c5e':WOOD[1];
   if(r>=10.2&&r<13.2)return r<11?WOOD[0]:r<12.2?'#b07a44':'#8f6037';
   if(r<10.2&&arc<.9)return'#9a6836';
  }).outline(WOOD[0]);
  add('wheel_'+f,s,[17,33]);
 }

 {// A trail camp: tent and a fire with three frames.
  const s=new Sheet(32,26);
  s.disc(16,23,14,2.5,SHADOW);
  for(let y=2;y<24;y++){const half=Math.round((y-2)*.62);for(let x=-half;x<=half;x++)s.set(16+x,y,Math.abs(x)<(y-12)*.28?'#2a2018':(x+40)%8<4?(x<0?'#f0a24a':'#d97b2c'):(x<0?'#fbf0d2':'#e3cf9f'));}
  s.outline('#3a2718');s.rect(15,0,2,3,'#8f6037');add('tent',s,[16,24]);
  for(let f=0;f<3;f++){
   const t=new Sheet(12,14);
   t.rect(2,11,8,2,'#6e4527').rect(1,12,10,1,'#4a2d1b').set(3,10,'#8f6037');t.set(8,10,'#8f6037');
   for(let y=2;y<11;y++){const half=Math.max(0,Math.round((y-2)*.42-((y+f)%3===0?1:0)));for(let x=-half;x<=half;x++)t.set(6+x+(y<5?(f-1):0),y,Math.abs(x)<half-1?'#fff09a':y<6?'#f6c93a':'#ef7d2e');}
   add('fire_'+f,t,[6,13]);
  }
 }
}
