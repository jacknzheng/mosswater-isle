declare const mosswaterClient:import("@supabase/supabase-js").SupabaseClient;
const cloud=mosswaterClient,account=$("account") as HTMLDialogElement;
const cloudNote=(msg:string)=>{$("cloud-status").textContent=msg;$("cloud-badge").textContent=msg;};
let uid="",revision=0,confirmed="",inFlight=false,cloudReady=false,conflict=false;
let conflictRow:{revision:number;campaign:Book}|null=null,scheduled=0;
const ownerKey="trailbound.cloud.owner";
function baseKey(){return "trailbound.cloud.base."+uid;}
function rememberBase(payload:Book,rev:number){
 revision=rev;confirmed=JSON.stringify(payload);
 localStorage.setItem(baseKey(),JSON.stringify({revision:rev,campaign:payload}));
 localStorage.setItem(ownerKey,uid);
}
function replaceBook(payload:Book){
 if(!validBook(payload))throw Error("The cloud save could not be read.");
 deadline=null;walking=false;leg=null;localStorage.setItem(bookKey,JSON.stringify(payload));location.reload();
}
function askConflict(row:{revision:number;campaign:Book}){
 conflict=true;conflictRow=row;cloudReady=false;
 $("choices").hidden=false;
 cloudNote("Choose a save");
 const summary=(b:Book)=>Object.values(b.runs).reduce((n,r)=>n+r.entries.filter(e=>e.submitted).length,0);
 $("compare").textContent="This browser has "+summary(book)+" submitted answers. The cloud has "+summary(row.campaign)+". Both copies are kept until you choose.";
}
async function connect(){
 const {data,error}=await cloud.auth.getSession();
 if(error)throw error;
 uid=data.session?.user.id??"";
 $("login-form").hidden=!!uid;$("logout").hidden=!uid;
 if(!uid){cloudReady=false;cloudNote("Local save · Sign in");return;}
 $("identity").textContent=data.session!.user.email??"Signed in";
 const {data:row,error:readError}=await cloud.from("mosswater_saves").select("revision,campaign").eq("user_id",uid).maybeSingle();
 if(readError)throw readError;
 const owner=localStorage.getItem(ownerKey);
 if(row&&!validBook(row.campaign))throw Error("The cloud save uses an unsupported format.");
 let base=null;try{base=JSON.parse(localStorage.getItem(baseKey())||"null");}catch{}
 const hasWork=Object.values(book.runs).some(r=>r.started)||book.tile!==undefined;
 if(owner&&owner!==uid){
  if(row){askConflict(row);$("use-local").hidden=true;return;}
  cloudNote("Separate browser profile needed for this account");return;
 }
 if(row){
  if(JSON.stringify(row.campaign)===JSON.stringify(book)){rememberBase(book,row.revision);}
  else if(base?.revision===row.revision){rememberBase(row.campaign,row.revision);}
  else if(!hasWork||JSON.stringify(base?.campaign)===JSON.stringify(book)){rememberBase(row.campaign,row.revision);replaceBook(row.campaign);return;}
  else{askConflict(row);return;}
 }else{revision=0;confirmed="";localStorage.setItem(ownerKey,uid);}
 cloudReady=true;conflict=false;cloudNote("Connected");await upload();
}
async function upload(){
 if(inFlight||!uid||!cloudReady||conflict)return;
 const payload=JSON.parse(JSON.stringify(book)) as Book;
 if(JSON.stringify(payload)===confirmed){cloudNote("Cloud saved");return;}
 inFlight=true;
 try{
  const query=cloud.from("mosswater_saves");
  const values={user_id:uid,campaign:payload,revision:revision+1};
  const result=revision?await query.update(values).eq("user_id",uid).eq("revision",revision).select("revision").maybeSingle():await query.insert(values).select("revision").maybeSingle();
  if(result.error?.code==="23505"||(!result.error&&!result.data)){
   const {data,error}=await cloud.from("mosswater_saves").select("revision,campaign").eq("user_id",uid).single();
   if(error)throw error;askConflict(data);return;
  }
  if(result.error)throw result.error;
  rememberBase(payload,result.data!.revision);cloudNote("Cloud saved");
 }catch{cloudNote("Saved locally · Sync pending");}
 finally{inFlight=false;}
}
function queueCloud(){if(!cloudReady||conflict)return;cloudNote("Saved locally · Syncing");if(!scheduled)scheduled=window.setTimeout(()=>{scheduled=0;void upload();},5000);}
function reportCloud(err:unknown){cloudReady=false;cloudNote("Cloud setup needed");$("account-msg").textContent=(err as {message?:string})?.message??"Could not reach the save service.";}
$("cloud-button").onclick=()=>{account.showModal();};
$("account-close").onclick=()=>account.close();
$("mail-code").onclick=async()=>{
 const email=($("email") as HTMLInputElement).value.trim();if(!($("email") as HTMLInputElement).reportValidity())return;
 const b=$("mail-code") as HTMLButtonElement;b.disabled=true;
 try{const {error}=await cloud.auth.signInWithOtp({email,options:{emailRedirectTo:"https://jacknzheng.github.io/mosswater-isle/"}});$("account-msg").textContent=error?.message??(location.protocol==="file:"?"Copy the original sign-in link from your email and paste it below to sync this local game.":"Open the sign-in link in this browser, or enter your email code below.");if(!error)$("otp-box").hidden=false;}
 finally{b.disabled=false;}
};
$("verify-code").onclick=async()=>{
 const email=($("email") as HTMLInputElement).value.trim(),token=($("otp") as HTMLInputElement).value.trim();
 let response;
 if(/^https:\/\//i.test(token)){
  let url:URL;try{url=new URL(token);}catch{$("account-msg").textContent="Paste the original sign-in link from Supabase.";return;}
  const hash=url.searchParams.get("token")||url.searchParams.get("token_hash"),type=url.searchParams.get("type");
  if(url.origin!=="https://usgospjdknxcpxxeywgl.supabase.co"||url.pathname!=="/auth/v1/verify"||!hash||!["magiclink","email","signup"].includes(type??"")){$("account-msg").textContent="Use the original sign-in link sent by this project.";return;}
  response=await cloud.auth.verifyOtp({token_hash:hash,type:type as "magiclink"|"email"|"signup"});
 }else response=await cloud.auth.verifyOtp({email,token,type:"email"});
 const {error}=response;
 if(error){$("account-msg").textContent=error.message;return;}($("otp") as HTMLInputElement).value="";$("account-msg").textContent="Signed in.";connect().catch(reportCloud);
};
$("use-cloud").onclick=()=>{if(conflictRow){rememberBase(conflictRow.campaign,conflictRow.revision);replaceBook(conflictRow.campaign);}};
$("use-local").onclick=()=>{if(!conflictRow)return;rememberBase(conflictRow.campaign,conflictRow.revision);conflict=false;cloudReady=true;$("choices").hidden=true;void upload();};
$("logout").onclick=async()=>{await upload();const {error}=await cloud.auth.signOut({scope:"local"});if(error){$("account-msg").textContent=error.message;return;}uid="";cloudReady=false;location.reload();};
window.addEventListener("online",()=>connect().catch(reportCloud));
setInterval(()=>{if(!document.hidden&&cloudReady&&!conflict)void upload();},30000);
