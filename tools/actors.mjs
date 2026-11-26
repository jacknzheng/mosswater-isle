// The walker, villagers and small animals. People are built from shaded parts,
// so one drawing serves every outfit, direction and step of the walk.
export function addActors({add,Sheet,hash,tone,SHADOW}){
 const INK='#2a1d18';
 const ball=(s,cx,cy,rx,ry,ramp,top=-99,bottom=99)=>{
  for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){
   const dx=(x-cx)/rx,dy=(y-cy)/ry;
   if(dx*dx+dy*dy<=1&&y>=top&&y<=bottom)s.set(x,y,tone(ramp,.62-dx*.32-dy*.3));
  }
 };
 const box=(s,x,y,w,h,ramp,round=0)=>{
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   if(round&&(i<round||i>=w-round)&&(j<round||j>=h-round)&&Math.min(i,w-1-i)+Math.min(j,h-1-j)<round)continue;
   s.set(x+i,y+j,tone(ramp,.74-i/w*.5-j/h*.14));
  }
 };
 const base={skin:['#c98a5f','#eab48a','#f9d2a8'],pants:['#27335c','#3a4a80','#566aa6'],boots:['#3a2416','#5a3a22','#7c5230'],scarf:['#d9c9a0','#fbf0d2','#ffffff']};
 const looks={
  hero:{...base,hat:['#c2931f','#ecc85c','#fbe9a4'],band:'#b0562a',hair:['#553017','#7a4a26','#a06a36'],coat:['#1c6a70','#2f9c95','#62c8bb'],pack:['#b5631c','#e28a2f','#f8b85e']},
  keeper:{...base,hat:['#c5c9cf','#f1f2f0','#ffffff'],band:'#234a9c',hair:['#3a332c','#5a5148','#7d7868'],coat:['#234a9c','#3f6fc8','#77a4ee'],pack:['#234a9c','#3f6fc8','#77a4ee'],skin:['#b97f56','#dba77c','#f0c79d']},
  gardener:{...base,hat:['#b8477c','#ec7fb1','#ffc4dc'],band:'#fff3a0',hair:['#2a1d18','#4a342a','#6b4c3c'],coat:['#375a26','#5f9f48','#8cc86a'],pack:['#375a26','#5f9f48','#8cc86a'],pants:['#5c4025','#7a5a34','#a07c4c']},
  porter:{...base,hat:['#1b2340','#2f3b63','#4a5a8f'],band:'#d5573c',hair:['#8f8a7a','#c7c2b6','#e9e6dc'],coat:['#1b2340','#2f3b63','#4a5a8f'],pack:['#1b2340','#2f3b63','#4a5a8f'],skin:['#a8744e','#d09a70','#e8bd94']}
 };
 function hat(s,look,cx,reach=0){
  ball(s,cx,5,9.5,6,look.hat,-99,7);
  s.rect(Math.round(cx-9),6,19,2,look.band);
  ball(s,cx+reach,8.5,14.5,3.4,look.hat);
  for(let x=Math.round(cx+reach-13);x<=cx+reach+13;x++)if(s.get(x,11))s.set(x,11,look.hat[0]);
 }
 function legs(s,look,xs,frame){
  xs.forEach((x,i)=>{
   const lift=frame===0?0:(frame===1)===(i===0)?1:-2;
   box(s,x,34,6,7+lift,look.pants);box(s,x-1,40+lift,7,5,look.boots,1);
  });
 }
 /** dir is south, north or east. frame 0 stands; 1 and 2 are the two steps. */
 function person(look,dir,frame){
  const s=new Sheet(32,48);
  s.disc(15.5,44.5,10,2.6,SHADOW);
  const swing=frame===0?0:frame===1?1:-1;
  if(dir==='east'){
   if(frame){box(s,8,34,6,6,look.pants);box(s,6,39,7,5,look.boots,1);box(s,17,34,6,8,look.pants);box(s,17,41,8,5,look.boots,1);}
   else{box(s,12,34,7,7,look.pants);box(s,12,40,9,5,look.boots,1);}
   box(s,6,24,5,10,look.pack,1);
   box(s,10,22,12,14,look.coat,2);
   s.rect(11,21,10,3,look.scarf[1]).rect(11,23,10,1,look.scarf[0]);
   box(s,13+swing*2,25,5,8,look.coat,1);box(s,13+swing*2,32,5,3,look.skin,1);
   ball(s,16.5,14,8.5,8.5,look.skin);
   ball(s,13.5,13,6.5,8,look.hair,-99,20);
   s.rect(20,13,2,3,INK).set(20,13,'#ffffff');s.set(25,15,look.skin[1]);s.set(25,16,look.skin[0]);s.rect(22,18,2,1,look.skin[0]);s.rect(21,16,2,1,'#f2a48f');
   hat(s,look,15.5,2.5);
  }else{
   legs(s,look,[9,17],frame);
   if(dir==='north'){
    box(s,5,23-swing,4,9,look.coat,1);box(s,5,31-swing,4,3,look.skin,1);box(s,23,23+swing,4,9,look.coat,1);box(s,23,31+swing,4,3,look.skin,1);
    box(s,8,22,16,14,look.coat,2);
    box(s,10,23,12,11,look.pack,2);s.rect(11,26,10,1,look.pack[0]).rect(14,27,4,3,look.pack[2]).rect(14,29,4,1,look.pack[0]);
    ball(s,15.5,14,9,8.5,look.hair);
    for(const x of[10,14,19])s.rect(x,17,1,3,look.hair[0]);
   }else{
    box(s,8,22,16,14,look.coat,2);
    s.rect(15,25,2,10,look.coat[0]).rect(8,33,16,1,look.coat[0]);s.rect(17,27,2,2,look.pack[2]).rect(17,31,2,2,look.pack[2]);
    box(s,5,23+swing,4,9,look.coat,1);box(s,5,31+swing,4,3,look.skin,1);box(s,23,23-swing,4,9,look.coat,1);box(s,23,31-swing,4,3,look.skin,1);
    s.rect(10,21,12,3,look.scarf[1]).rect(10,23,12,1,look.scarf[0]).rect(10,21,12,1,look.scarf[2]);
    ball(s,15.5,14,9,8.5,look.skin);
    ball(s,15.5,12,9.4,8,look.hair,-99,10);s.rect(6,10,2,6,look.hair[1]).rect(24,10,2,6,look.hair[0]);
    for(const x of[11,19]){s.rect(x,13,2,3,INK);s.set(x,13,'#ffffff');}
    s.rect(9,17,2,1,'#f2a48f').rect(21,17,2,1,'#f2a48f').rect(15,18,2,1,look.skin[0]);
   }
   hat(s,look,15.5);
  }
  return s.outline(INK);
 }
 for(const[name,look]of Object.entries(looks))for(const dir of['south','north','east'])for(let f=0;f<3;f++){
  if(name!=='hero'&&f)continue;
  const sheet=person(look,dir,f);
  add(name+'_'+dir+'_'+f,sheet,[16,45]);
  if(dir==='east')add(name+'_west_'+f,new Sheet(32,48).blit(sheet,0,0,true),[16,45]);
 }

 const wings={orange:['#f39a2b','#ffd27a'],white:['#fbfbf4','#cfe6ff'],blue:['#5a8df0','#bcd6ff']};
 for(const[name,[a,b]]of Object.entries(wings)){
  add('moth_'+name+'_0',new Sheet(9,6).art(0,0,["aa.....aa","aaa.o.aaa",".abbobba.","..bbobb..","...bob...","....o...."],{a,b,o:INK}),[4,3]);
  add('moth_'+name+'_1',new Sheet(9,6).art(0,0,["....a....","...aoa...","...aob...","...bob...","....o...."],{a,b,o:INK}),[4,3]);
 }
 for(let f=0;f<2;f++){// A gull seen from above, wings up then down.
  const s=new Sheet(23,12);
  for(let i=-11;i<=11;i++){
   const k=Math.abs(i),y=f?3+Math.round(k*.42):8-Math.round(k*.5)+(k>8?k-8:0);
   s.set(11+i,y,k>8?'#7d858d':'#fbfbf4');if(k<8)s.set(11+i,y+1,k>5?'#cfd3d6':'#fbfbf4');
  }
  s.rect(10,f?3:7,3,3,'#fbfbf4').set(11,f?2:6,'#f39a2b');
  add('bird_'+f,s.outline('#4a4a52'),[11,6]);
 }
 const down=['#aeb4ba','#dfe2e2','#ffffff'];
 for(let f=0;f<2;f++)for(const flip of[false,true]){
  const s=new Sheet(26,22);
  ball(s,10.5,12+f,9.5,5.5,down);s.rect(0,8+f,3,2,down[1]).rect(1,7+f,2,1,down[2]);
  for(let i=0;i<9;i++)s.set(5+i,12+f+Math.round(Math.sin(i/8*Math.PI)*2.4),down[0]);
  ball(s,17.5,6+f,4.2,4.2,down);s.rect(15,9+f,4,3,down[1]);
  s.rect(21,6+f,4,2,'#f39a2b').rect(21,7+f,3,1,'#c8741a').rect(18,5+f,2,2,INK).set(18,5+f,'#ffffff');
  s.outline('#4a4a52');
  for(let x=1;x<22;x++)if(hash(x,f,61)<.7)s.set(x,18+f,x%3?'#eefaff':'#9fd8ff');
  for(let x=3;x<20;x++)if(hash(x,f,62)<.4)s.set(x,20,'#cfeaff');
  add('duck_'+(flip?'west':'east')+'_'+f,flip?new Sheet(26,22).blit(s,0,0,true):s,[13,17]);
 }
 for(let f=0;f<3;f++){// The flag raised beside a cleared checkpoint.
  const s=new Sheet(34,48),gold=['#a8741c','#d9a02c','#f6c93a','#fff09a'];
  s.rect(4,4,4,42,'#a06c3e').rect(4,4,1,42,'#c38a52').rect(7,4,1,42,'#5a3a20').rect(3,0,6,4,gold[2]).rect(3,0,6,1,gold[3]).rect(3,3,6,1,gold[0]);
  s.rect(1,44,10,3,'#8f9196').rect(1,44,10,1,'#d0d1cc');
  for(let x=0;x<24;x++){
   const wave=Math.sin((x+f*4.2)*.42),lift=Math.round(wave*2.4*(x/23)),notch=x>17?(x-17)*1.3:0,height=Math.round(17-notch);
   for(let y=0;y<height;y++)s.set(8+x,8+lift+y+Math.round(notch/2),y<2?gold[3]:y>=height-2?gold[0]:tone(gold.slice(1),.55+wave*.4));
  }
  for(const[x,y]of[[14,17],[15,18],[16,19],[17,18],[18,17],[19,16],[20,15],[15,17],[16,18],[17,17],[18,16],[19,15]])s.set(x,y+Math.round(Math.sin((x-8+f*4.2)*.42)*2.4*((x-8)/23)),INK);
  add('flag_'+f,s.outline(INK),[6,47]);
 }
 [[3,'#fbfbf8d0','#dcdcd6c0'],[5,'#f2f2eeb0','#d2d2cca0'],[7,'#e8e8e288','#c8c8c270']].forEach(([r,light,dark],i)=>{
  const n=r*2+1,s=new Sheet(n,n);
  s.each((x,y)=>{const dx=(x-r)/r,dy=(y-r)/r,k=dx*dx+dy*dy+(hash(x,y,65+i)-.5)*.3;return k<=1?(dx+dy>.35?dark:light):0;});
  add('smoke_'+i,s,[r,r]);
 });
}
