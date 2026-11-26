declare const mosswaterClient:import("@supabase/supabase-js").SupabaseClient;
const cloud=mosswaterClient,account=$("account") as HTMLDialogElement;
const deviceKey="trailbound.pin.device",baseKey="trailbound.pin.base";
let device=localStorage.getItem(deviceKey)??"",cloudReady=false,unlockedGame=false;
let revision=0,confirmed="",scheduled=0;
let writing:Promise<void>|null=null;
type CloudRow={revision:number;campaign:Book|null};
let conflictRow:CloudRow|null=null;
const cloudNote=(s:string)=>{$("cloud-status").textContent=s;$("cloud-badge").textContent=s;};
// Postgres JSONB can reorder keys. Equality must ignore that ordering.
function fingerprint(value:Book){
 return JSON.stringify(value,(_key,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
}
function remember(row:CloudRow){
 revision=row.revision;confirmed=row.campaign?fingerprint(row.campaign):"";
 localStorage.setItem(baseKey,JSON.stringify(row));
}
function restore(payload:Book){
 if(!validBook(payload))throw Error("This cloud save could not be read.");
 deadline=null;walking=false;leg=null;localStorage.setItem(bookKey,JSON.stringify(payload));location.reload();
}
function lockScreen(message="Enter your personal six-digit PIN."){
 cloudReady=false;unlockedGame=false;conflictRow=null;held.length=0;
 if(deadline!==null)freeze();if(popup.open)popup.close();
 document.body.classList.add("game-locked");
 $("account-title").textContent="Unlock Mosswater Isle";$("pin-form").hidden=false;
 $("account-close").hidden=true;$("lock-game").hidden=true;$("choices").hidden=true;
 $("cloud-status").textContent=message;$("account-msg").textContent="";
 if(!account.open)account.showModal();
 ($("pin") as HTMLInputElement).focus();
}
function forgetDevice(){
 device="";localStorage.removeItem(deviceKey);lockScreen();
}
function beginPlay(){
 const resume=!unlockedGame;unlockedGame=true;cloudReady=true;conflictRow=null;
 document.body.classList.remove("game-locked");$("pin-form").hidden=true;$("account-close").hidden=false;
 $("account-title").textContent="Trainer passport";$("choices").hidden=true;$("lock-game").hidden=false;
 $("account-msg").textContent="This browser remembers your unlock for 30 days.";
 if(resume){account.close();if(state.screen==="quiz"&&!state.cleared){if(state.remaining>0)enter();else openJournal();}}
}
function choose(row:CloudRow){
 cloudReady=false;conflictRow=row;$("choices").hidden=false;$("pin-form").hidden=true;
 const answers=(b:Book)=>Object.values(b.runs).reduce((n,r)=>n+r.entries.filter(e=>e.submitted).length,0);
 $("compare").textContent="This device has "+answers(book)+" submitted answers. The cloud has "+answers(row.campaign!) +". Choose which progress to keep.";
 cloudNote("Choose a save");if(!account.open)account.showModal();
}
async function connect(){
 if(!device){lockScreen();return;}
 const sent=device;
 const {data,error}=await cloud.rpc("mosswater_progress",{device:sent});
 if(sent!==device)return;if(error)throw error;
 if(data?.status==="locked"){forgetDevice();return;}
 if(data?.status!=="ok"||data.campaign&&!validBook(data.campaign))throw Error("Invalid cloud response");
 const row:CloudRow=data;
 let base:CloudRow|null=null;try{base=JSON.parse(localStorage.getItem(baseKey)||"null");}catch{}
 const local=fingerprint(book),hasWork=Object.values(book.runs).some(r=>r.started)||book.tile!==undefined;
 if(row.campaign){
  if(fingerprint(row.campaign)===local||base?.revision===row.revision){remember(row);}
  else if(!hasWork||base?.campaign&&fingerprint(base.campaign)===local){remember(row);restore(row.campaign);return;}
  else{choose(row);return;}
 }else{remember(row);}
 beginPlay();cloudNote("Cloud saved");if(hasWork)await upload();
}
async function sendSave(){
 const sent=device,payload=JSON.parse(JSON.stringify(book)) as Book;
 if(fingerprint(payload)===confirmed){cloudNote("Cloud saved");return;}
 try{
  const {data,error}=await cloud.rpc("mosswater_progress",{device:sent,expected:revision,snapshot:payload});
  if(sent!==device)return;if(error)throw error;
  if(data.status==="locked"){forgetDevice();return;}
  if(data.status==="conflict"){
   if(!validBook(data.campaign))throw Error("Invalid cloud save");
   if(fingerprint(data.campaign)===fingerprint(payload))remember(data);
   else{choose(data);return;}
  }else if(data.status==="ok"){remember({revision:data.revision,campaign:payload});}
  else throw Error("Save not acknowledged");
  cloudNote("Cloud saved");
 }catch{cloudNote("Saved locally · Sync pending");}
}
function upload(){
 if(!device||!cloudReady||conflictRow)return Promise.resolve();
 if(!confirmed&&book.tile===undefined&&!Object.values(book.runs).some(r=>r.started))return Promise.resolve();
 if(!writing)writing=sendSave().finally(()=>{writing=null;});
 return writing;
}
function queueCloud(){
 if(!cloudReady||conflictRow)return;
 cloudNote("Saved locally · Syncing");
 if(!scheduled)scheduled=window.setTimeout(()=>{scheduled=0;void upload();},3500);
}
function reportCloud(){if(!unlockedGame)lockScreen("Connect to the internet to unlock. Your local progress is saved.");else cloudNote("Saved locally · Sync pending");}
$("pin-form").onsubmit=async e=>{
 e.preventDefault();const field=$("pin") as HTMLInputElement,button=$("unlock") as HTMLButtonElement;
 const pin=field.value.trim();if(!/^[0-9]{6}$/.test(pin))return;
 field.value="";button.disabled=true;$("account-msg").textContent="Unlocking…";
 try{
  const {data,error}=await cloud.rpc("mosswater_unlock",{pin});if(error)throw error;
  if(data.status!=="ok"){$("account-msg").textContent=data.status==="cooldown"?"Too many guesses. Try again in 15 minutes.":data.status==="invalid"?"That PIN didn’t match. Try again.":"Unlock is unavailable.";return;}
  device=data.device;localStorage.setItem(deviceKey,device);await connect();
 }catch{reportCloud();}
 finally{button.disabled=false;}
};
$("cloud-button").onclick=()=>account.showModal();
$("account-close").onclick=()=>{if(unlockedGame)account.close();};
account.addEventListener("cancel",e=>{if(!unlockedGame||conflictRow)e.preventDefault();});
$("use-cloud").onclick=()=>{if(conflictRow?.campaign){remember(conflictRow);restore(conflictRow.campaign);}};
$("use-local").onclick=async()=>{if(!conflictRow)return;remember(conflictRow);beginPlay();account.close();await upload();};
$("lock-game").onclick=async()=>{
 const old=device;await upload();if(writing)await writing;forgetDevice();
 if(old)await cloud.rpc("mosswater_lock",{device:old});
};
window.addEventListener("storage",e=>{if(e.key===deviceKey&&e.newValue!==device){device=e.newValue??"";if(!device)lockScreen();else connect().catch(reportCloud);}});
window.addEventListener("online",()=>connect().catch(reportCloud));
setInterval(()=>{if(!document.hidden&&cloudReady)void upload();},30000);
