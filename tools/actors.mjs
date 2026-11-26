// The walker, villagers and small animals. Characters are 16 by 23 pixels.
// Villagers reuse the walker's drawings with a different palette.
export function addActors({add,Sheet,SHADOW}){
 const LEGS=[
  "...oddddddddo...",
  "...oppppppppo...",
  "...oppPooPppo...",
  "...oppo..oppo...",
  "...obbo..obbo...",
  "...obbo..obbo...",
  "...oooo..oooo..."];
 const STEP=[
  "...oddddddddo...",
  "...oppppppppo...",
  "...oppPooPppo...",
  "...oppo..oppo...",
  "...obbo..obbo...",
  "...obbo..oooo...",
  "...oooo........."];
 const south=[
  "................",
  ".....oooooo.....",
  "....oyYYYYyo....",
  "...oyyYYYYyyo...",
  "..oonnnnnnnnoo..",
  ".oyyyyyyyyyyyyo.",
  "..oohsssssshoo..",
  "...ohsessesho...",
  "...osSssssSso...",
  "....osssssso....",
  "...occwwwwcco...",
  "..ocCccccccCco..",
  "..osccccccccso..",
  "..osdccccccdso.."];
 const north=[
  "................",
  ".....oooooo.....",
  "....oyyyyyyo....",
  "...oyyyyyyyyo...",
  "..oonnnnnnnnoo..",
  ".oyyyyyyyyyyyyo.",
  "..oohhhhhhhhoo..",
  "...ohhhhhhhho...",
  "...ohhHhhHhho...",
  "....ohhhhhho....",
  "...occkkkkcco...",
  "..occkKKKKkcco..",
  "..osckkkkkkcso..",
  "..osdkkkkkkdso.."];
 const east=[
  "................",
  ".....oooooo.....",
  "....oyyYYYyo....",
  "...oyyyYYYyyo...",
  "...onnnnnnnno...",
  "..oyyyyyyyyyyyo.",
  "...oohhsssssoo..",
  "....ohhssseso...",
  "....ohhsssssso..",
  ".....ohsssso....",
  "....occcwwco....",
  "...okccccccco...",
  "..okkccsscco....",
  "..okkcdsscdo....",
  "...oodddddo.....",
  "....oppppo......",
  "....oppppo......",
  "....oppppo......",
  "....obbbbo......",
  "....obbbbbo.....",
  "....ooooooo....."];
 const eastStep=[...east.slice(0,14),
  "...oodddddo.....",
  "....oppppo......",
  "...oppooppo.....",
  "..oppo..oppo....",
  "..obbo..obbo....",
  "..oooo..obbbo...",
  "........ooooo..."];
 const base={o:'#2a2018',s:'#f6c79a',S:'#e2a377',e:'#2a2018',w:'#fbf0d2',p:'#3d4d80',P:'#2b3760',b:'#5a3a22'};
 const looks={
  hero:{...base,y:'#f0cf6a',Y:'#fbe7a0',n:'#c2831a',h:'#7a4a26',H:'#a06a36',c:'#2f9c95',C:'#5ac4b8',d:'#1f6f72',k:'#e28a2f',K:'#f6b455'},
  keeper:{...base,y:'#f4f4f0',Y:'#ffffff',n:'#2c58b4',h:'#4a4038',H:'#6b5d52',c:'#3f6fc8',C:'#6f9cf0',d:'#2a4b8f',k:'#3f6fc8',K:'#6f9cf0',s:'#e8b48a',S:'#c98e63'},
  gardener:{...base,y:'#ec7fb1',Y:'#ffc4dc',n:'#b8477c',h:'#3a2a20',H:'#5c4434',c:'#5f9f48',C:'#8bc86a',d:'#3f7534',k:'#5f9f48',K:'#8bc86a',p:'#7a5a34',P:'#5f4326'},
  porter:{...base,y:'#2f3b63',Y:'#4a5a8f',n:'#d6513b',h:'#c7c2b6',H:'#e6e2d8',c:'#2f3b63',C:'#4a5a8f',d:'#1f2844',k:'#2f3b63',K:'#4a5a8f',s:'#d9a276',S:'#b97f56'}
 };
 function person(rows,pal,flip=false,bob=0){
  const s=new Sheet(16,23);s.disc(7.5,20.5,5,1.6,SHADOW);
  return s.art(0,bob,rows,pal,flip);
 }
 for(const[name,pal]of Object.entries(looks)){
  const mirror=rows=>rows.map(r=>[...r].reverse().join(''));
  const frames={
   south:[[...south,...LEGS],[...south,...STEP],[...south,...mirror(STEP)]],
   north:[[...north,...LEGS],[...north,...STEP],[...north,...mirror(STEP)]],
   east:[east,eastStep,eastStep]
  };
  for(const[dir,list]of Object.entries(frames))list.forEach((rows,f)=>{
   if(name!=='hero'&&f)return;
   add(name+'_'+dir+'_'+f,person(rows,pal),[8,21]);
   if(dir==='east')add(name+'_west_'+f,person(rows,pal,true),[8,21]);
  });
 }

 const wings={orange:['#f39a2b','#ffd27a'],white:['#fbfbf4','#cfe6ff'],blue:['#5a8df0','#bcd6ff']};
 for(const[name,[a,b]]of Object.entries(wings)){
  add('moth_'+name+'_0',new Sheet(5,4).art(0,0,["a...a","abobb",".aob."],{a,b,o:'#2a2018'}),[2,2]);
  add('moth_'+name+'_1',new Sheet(5,4).art(0,0,["..a..",".aob.","..o.."],{a,b,o:'#2a2018'}),[2,2]);
 }
 const gull={w:'#fbfbf4',g:'#8f979f',o:'#f39a2b',e:'#2a2018'};
 add('bird_0',new Sheet(11,5).art(0,0,["g.........g",".ww.....ww.","..www.www..","...wwwww...","....weo...."],gull),[5,3]);
 add('bird_1',new Sheet(11,5).art(0,0,["....www....","..wwwwwww..",".ww.weo.ww.","g.........g"],gull),[5,2]);
 const duck=[
  "......ooo...",
  ".....owwwo..",
  ".....owewyy.",
  ".o...owwwo..",
  "owoooowwo...",
  "owwwwwwwo...",
  "owwWWwwwo...",
  ".owwwwwo...."];
 const feathers={o:'#4a4a52',w:'#fbfbf4',W:'#cfd3d6',e:'#2a2018',y:'#f39a2b',b:'#d6f0ff'};
 for(let f=0;f<2;f++)for(const flip of[false,true]){
  const s=new Sheet(12,10).art(0,f,duck,feathers,flip);
  s.art(0,8+f,[f?".b.bbbbb.b..":"..bbbbbbb..."],feathers,flip);
  add('duck_'+(flip?'west':'east')+'_'+f,s,[6,8]);
 }
 for(let f=0;f<3;f++){// The flag raised beside a cleared checkpoint.
  const s=new Sheet(16,24);
  s.rect(2,2,2,21,'#8f6037').rect(2,2,1,21,'#4a2d1b').rect(1,0,4,2,'#f6c93a').rect(0,22,6,2,'#6c6e75');
  for(let x=0;x<11;x++){
   const lift=Math.round(Math.sin((x+f*2.1)*.85)*1.2*(x/10)),height=x>8?6-(x-8)*2:8;
   for(let y=0;y<height;y++)s.set(4+x,4+lift+y+(x>8?x-8:0),y===0?'#fff09a':y===height-1?'#a8741c':Math.sin((x+f*2.1)*.85)>.3?'#e0a92c':'#f6c93a');
  }
  s.set(8,8,'#3a2718');s.set(9,9,'#3a2718');s.set(10,8,'#3a2718');s.set(11,7,'#3a2718');
  add('flag_'+f,s,[3,23]);
 }
 [[1.5,'#f2f2eecc'],[2.5,'#e6e6e0b0'],[3.5,'#dcdcd688']].forEach(([r,c],i)=>{const n=Math.ceil(r*2)+1;add('smoke_'+i,new Sheet(n,n).disc((n-1)/2,(n-1)/2,r,r,c),[n>>1,n>>1]);});
}
