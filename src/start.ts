installMap();
size();dock();
window.addEventListener("resize",size);
if(sheet.complete&&sheet.naturalWidth)prepareWorld();else sheet.addEventListener("load",prepareWorld,{once:true});
requestAnimationFrame(mapFrame);
lockScreen();

connect().catch(reportCloud);
setInterval(()=>{if(!popup.open&&!account.open&&!walking&&!leg&&entryTime===null)dock();},60000);
