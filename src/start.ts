installMap();
size();drawHero();dock();
window.addEventListener("resize",size);
if(art.complete&&art.naturalWidth)prepareWater();else art.addEventListener("load",prepareWater,{once:true});
requestAnimationFrame(mapFrame);
if(state.screen==="quiz"&&!state.cleared){if(state.remaining>0)enter();else openJournal();}

trainerSheet.addEventListener("load",drawHero);
connect().catch(reportCloud);
const detail=($("terrain-details") as HTMLCanvasElement).getContext("2d")!;
function boardwalk(x:number,y:number,length:number,vertical:boolean){
 detail.save();detail.translate(x,y);if(!vertical)detail.rotate(-Math.PI/2);
 detail.fillStyle="#654e3d";detail.fillRect(-10,0,20,length);
 for(let n=0;n<length;n+=5){detail.fillStyle=n%10?"#b79260":"#c5a26d";detail.fillRect(-9,n,18,4);detail.fillStyle="#ecce94";detail.fillRect(-9,n,18,1);}
 for(const side of [-11,10]){detail.fillStyle="#734e34";detail.fillRect(side,0,2,length);for(let n=0;n<length;n+=18){detail.fillStyle="#c49160";detail.fillRect(side-1,n,4,4);}}
 detail.restore();
}
boardwalk(552,600,40,true);boardwalk(393,1090,131,true);boardwalk(393,1090,66,false);boardwalk(393,1221,54,false);
setInterval(()=>{if(!popup.open&&!account.open&&!walking&&!leg&&entryTime===null)dock();},60000);
