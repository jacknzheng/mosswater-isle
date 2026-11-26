type Card={id:number;front:string;back:string;title?:string};
type Mission={date:string;name:string;cards:Card[]};
type Book={version:2;active:string;tile?:number;facing?:Facing;runs:Record<string,Run>};
declare const BASE_CARDS:Card[],PACKS:Mission[];
const mill:Mission={date:"2026-11-25",name:"Old Mill",cards:BASE_CARDS};
const missions=[mill,...PACKS];
const bookKey="trailbound.campaign.v2";
const legacyKey="trailbound.mosswater.mill.v1";
function emptyRun(cards:Card[]):Run{return {node:0,screen:"map",started:false,cleared:false,remaining:3600000,entries:cards.map(c=>({card:c.id,answer:"",submitted:false,rating:null}))};}
function validRun(run:Run, cards?:Card[]){
 return !!run&&Number.isFinite(run.remaining)&&Array.isArray(run.entries)&&run.entries.length>0&&(!cards||cards.length===run.entries.length)&&run.entries.every((e,i)=>Number.isSafeInteger(e.card)&&(!cards||e.card===cards[i].id)&&typeof e.answer==="string"&&[null,"got","review"].includes(e.rating));
}
function validBook(b:Book){return b?.version===2&&!!b.runs&&typeof b.runs==="object"&&Object.entries(b.runs).every(([id,r])=>/^\d{4}-\d{2}-\d{2}$/.test(id)&&validRun(r,missions.find(m=>m.date===id)?.cards));}
function ratingStars(run?:Run){return run?.cleared?Math.max(1,Math.round(5*run.entries.filter(e=>e.rating==="got").length/run.entries.length)):0;}
function starLine(n:number){return '<span class="stars" aria-label="'+(n?n+' of 5 stars':'Unfinished')+'"><b>'+'★'.repeat(n)+'</b><i>'+'★'.repeat(5-n)+'</i></span>';}
let book:Book={version:2,active:mill.date,runs:{}};
try{
 const b=JSON.parse(localStorage.getItem(bookKey)||"null");
 if(validBook(b))book=b;
 else{const old=JSON.parse(localStorage.getItem(legacyKey)||"null");if(validRun(old,BASE_CARDS)){book.runs[mill.date]=old;book.tile=old.tile;book.facing=old.facing;}}
}catch{}
let mission=missions.find(m=>m.date===book.active)??mill;
let CARDS=mission.cards;
let state=book.runs[mission.date]??emptyRun(CARDS);
function selectMission(m:Mission){book.runs[mission.date]=state;mission=m;book.active=m.date;CARDS=m.cards;state=book.runs[m.date]??emptyRun(CARDS);}
const firstDay=Date.UTC(2026,10,27);
const dayNumber=(date:string)=>(Date.parse(date+"T00:00:00Z")-firstDay)/86400000;
function stopFor(m:Mission){return m===mill?1:2+dayNumber(m.date)/2;}
function unlocked(date:string,now=new Date()){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(now);
 const pick=(type:string)=>parts.find(p=>p.type===type)!.value;
 const today=[pick("year"),pick("month"),pick("day")].join("-");
 return date<today||date===today&&Number(pick("hour"))>=9;
}
function nextDate(stop:number){
 return new Date(firstDay+2*(stop-2)*86400000).toISOString().slice(0,10);
}
function dateLabel(date:string){return new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"America/Los_Angeles"});}
function availableAt(stop:number){return missions.filter(m=>stopFor(m)===stop&&(m===mill||unlocked(m.date)));}
