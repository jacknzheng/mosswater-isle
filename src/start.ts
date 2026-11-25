installMap();
size();drawHero();dock();
window.addEventListener("resize",size);
if(art.complete&&art.naturalWidth)prepareWater();else art.addEventListener("load",prepareWater,{once:true});
requestAnimationFrame(mapFrame);
if(state.screen==="quiz"&&!state.cleared){if(state.remaining>0)enter();else openJournal();}
