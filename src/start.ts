installMap();
size();drawHero();dock();
window.addEventListener("resize",size);
if(art.complete&&art.naturalWidth)prepareWater();else art.addEventListener("load",prepareWater,{once:true});
requestAnimationFrame(mapFrame);
lockScreen();

trainerSheet.addEventListener("load",drawHero);
connect().catch(reportCloud);
setInterval(()=>{if(!popup.open&&!account.open&&!walking&&!leg&&entryTime===null)dock();},60000);
