function show(){if(!popup.open)popup.showModal();paper.scrollTop=0;}
function freeze(){elapsed();deadline=null;write();}
function enter(){
 if(state.remaining<=0&&!state.cleared){openJournal();return;}
 state.started=true;state.screen="quiz";reading=false;ending=false;deadline=document.hidden?null:Date.now()+state.remaining;write();show();question();
}
function leave(){if(ending)return;celebrationId++;clearStamp();freeze();state.screen="map";reading=false;write();popup.close();dock();$("action").focus({preventScroll:true});}
$("leave").onclick=leave;popup.addEventListener("cancel",e=>{e.preventDefault();leave();});
function refreshClock(){
 elapsed();
 if(state.screen==="quiz"&&!reading&&!ending){
  $("timer").textContent=minutes(state.remaining);
  if(state.remaining===0){freeze();state.screen="map";write();openJournal();}
 }
}
setInterval(()=>{if(deadline!==null){refreshClock();write();}},1000);
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){if(deadline!==null)freeze();}else if(state.screen==="quiz"&&popup.open&&!ending&&!reading){deadline=Date.now()+state.remaining;refreshClock();}
});
window.addEventListener("pagehide",()=>{if(deadline!==null)freeze();});
function variance(){
 const box=document.createElement("section");box.className="viz";
 box.innerHTML='<h3>Move the groups</h3><p>Each group has two equally likely values. The black diamond marks the overall mean. Move the centers apart, then change the spread inside each group.</p><svg viewBox="0 0 520 120" role="img" aria-label="Two groups on the same number line"></svg><label>Distance between centers <input id="sep" type="range" min="0" max="8" step=".25" value="4"></label><label>Distance from each center <input id="spread" type="range" min="0" max="3" step=".25" value="1"></label><output aria-live="polite"></output>';
 const svg=box.querySelector("svg")!,out=box.querySelector("output")!,inputs=box.querySelectorAll("input");
 function draw(){
  const gap=+inputs[0].value,s=+inputs[1].value,x=(v:number)=>180+v*27;
  let art='<path d="M40 99H502" stroke="#919e84"/>';
  for(let k=-4;k<=11;k++){art+='<path d="M'+x(k)+' 96v6" stroke="#72846b"/><text x="'+x(k)+'" y="116" text-anchor="middle" fill="#425640" font-size="10">'+k+'</text>';}
  art+='<path d="M'+x(gap/2)+' 11v83" stroke="#556250" stroke-dasharray="3 4"/><path d="M'+x(gap/2)+' 91l5 5-5 5-5-5z" fill="#293c30"/>';
  for(const [i,m] of [0,gap].entries()){
   const y=31+i*36,c=i===0?"#2c7464":"#aa5b35";art+='<text x="3" y="'+(y+4)+'" font-size="12" fill="'+c+'">Group '+i+'</text><path d="M'+x(m-s)+' '+y+'H'+x(m+s)+'" stroke="'+c+'" stroke-width="2"/>';
   for(const n of [m-s,m+s])art+='<circle cx="'+x(n)+'" cy="'+y+'" r="5" fill="'+c+'"/>';
   art+='<path d="M'+x(m)+' '+(y-8)+'v16" stroke="'+c+'" stroke-width="2"/>';
  }
  svg.innerHTML=art;
  const fmt=(n:number)=>String(Number(n.toFixed(4)));
  out.textContent="Within "+fmt(s*s)+"  +  Between "+fmt(gap*gap/4)+"  =  Total variance "+fmt(s*s+gap*gap/4);
 }
 inputs.forEach(v=>v.oninput=draw);draw();return box;
}
function jacobian(){
 const box=document.createElement("section");box.className="viz";
 box.innerHTML='<h3>Follow the output</h3><p>The black cross is the predicted change (0, 0). The gold dot is the exact change. Halve the input step and watch the gap shrink.</p><svg viewBox="0 0 400 135" role="img" aria-label="Predicted and actual changes in the output plane"></svg><label>Input step ε <input type="range" min="-1" max="1" step=".05" value="1"></label><output aria-live="polite"></output>';
 const input=box.querySelector("input")!;
 function draw(){const e=+input.value,s=e*e,x=317-172*s,y=111-86*s;
 box.querySelector("svg")!.innerHTML='<path d="M105 111h255m-43-104v122" stroke="#82927a"/><path d="M317 111L145 25" stroke="#879d88" stroke-dasharray="4 4"/><path d="M311 105l12 12m0-12-12 12" stroke="#233f31" stroke-width="2"/><circle cx="'+x+'" cy="'+y+'" r="5.5" fill="#d68b37" stroke="#714e26"/><g fill="#536650" font-size="10"><text x="145" y="126" text-anchor="middle">−2</text><text x="323" y="19">ΔF₂</text><text x="350" y="126">ΔF₁</text><text x="322" y="126">0</text></g>';
 box.querySelector("output")!.textContent="ε = "+e+"   ·   Predicted (0, 0)   ·   Exact ("+Number((-2*s).toFixed(4))+", "+Number(s.toFixed(4))+")";}
 input.oninput=draw;draw();return box;
}
function question(){
 if(state.remaining<=0){refreshClock();return;}const i=current();if(i<0){finish();return;}
 const card=CARDS[i],entry=state.entries[i];$("timer").textContent=minutes(state.remaining);$("leave").textContent="Save & exit";$("progress").style.width=(100*i/CARDS.length)+"%";
 paper.innerHTML='<div class="count">Question '+(i+1)+' / '+CARDS.length+' · '+(entry.submitted?"Feedback":"60 minute recall")+'</div><h2 id="qtitle">'+titles[i]+'</h2>';
 if(!entry.submitted){
  paper.insertAdjacentHTML("beforeend",'<div class="cardtext">'+card.front+'</div><div class="workarea"><label for="answer">Your answer and reasoning</label><textarea id="answer" placeholder="Show your calculation or explain your reasoning…" spellcheck="false"></textarea><div role="alert" class="error" id="error"></div><div class="actions"><button class="primary" id="submit">Submit answer →</button></div></div>');
  const inp=$("answer") as HTMLTextAreaElement;inp.value=entry.answer;inp.oninput=()=>{entry.answer=inp.value;$("error").textContent="";elapsed();write();};
  $("submit").onclick=()=>{refreshClock();if(reading)return;if(!entry.answer.trim()){$("error").textContent="Write your attempt before revealing the solution.";inp.focus();return;}entry.submitted=true;elapsed();write();question();};
 }else{
  paper.insertAdjacentHTML("beforeend",'<details class="recap questionagain"><summary>Original question</summary><div class="cardtext">'+card.front+'</div></details><div class="note"><div class="eyebrow">Your answer</div><div class="written" id="mine"></div></div><h3>Worked solution</h3><div class="cardtext">'+card.back+'</div>');$("mine").textContent=entry.answer;
  if(i===0)paper.append(variance());if(i===7)paper.append(jacobian());
  paper.insertAdjacentHTML("beforeend",'<div class="rating"><h3>How did your reasoning compare?</h3><p>Your check goes in your field notebook.</p><div class="actions"><button class="primary" id="got">Got it ✓</button><button class="secondary" id="review">Needs review</button></div></div>');
  $("got").onclick=()=>rate("got");$("review").onclick=()=>rate("review");
 }
 paper.scrollTop=0;focusTitle();
}
function focusTitle(){const h=$("qtitle");h.tabIndex=-1;h.focus({preventScroll:true});}
function cheer(text:string){
 const tag=document.createElement("div");tag.className="burst";tag.textContent=text;tag.setAttribute("role","status");
 if(!reduced.matches)for(let i=0;i<10;i++){const star=document.createElement("i");star.className="spark";star.style.setProperty("--dx",Math.cos(i*.628)*85+"px");star.style.setProperty("--dy",Math.sin(i*.628)*45+"px");tag.append(star);}
 popup.append(tag);setTimeout(()=>tag.remove(),reduced.matches?650:1000);
}
let celebrationId=0;
function clearStamp(){
 popup.querySelectorAll(".seal,.gold-trail").forEach(e=>e.remove());
 $("progress").classList.remove("charged");
}
function rate(result:"got"|"review"){
 refreshClock();if(reading)return;
 const i=current();if(i<0||!state.entries[i].submitted)return;
 const got=$("got") as HTMLButtonElement,review=$("review") as HTMLButtonElement;
 if(got.disabled||review.disabled)return;
 got.disabled=true;review.disabled=true;
 state.entries[i].rating=result;elapsed();write();
 if(result==="review"){if(current()<0)finish();else question();return;}
 const token=++celebrationId;
 const seal=document.createElement("div");seal.className="seal";seal.setAttribute("role","status");
 seal.innerHTML='<span aria-hidden="true">✦</span><strong>Correct</strong><small>FIELD NOTES</small>';
 popup.append(seal);
 const bar=$("progress");const start=seal.getBoundingClientRect(),track=bar.parentElement!.getBoundingClientRect();
 const endX=track.left+(i+1)/CARDS.length*track.width,endY=track.top+track.height/2;
 const spark=document.createElement("i");spark.className="gold-trail";popup.append(spark);
 const panel=popup.getBoundingClientRect(),x=start.left+start.width/2,y=start.top+start.height/2;
 spark.style.left=(x-panel.left)+"px";spark.style.top=(y-panel.top)+"px";
 spark.style.setProperty("--sx",endX-x+"px");spark.style.setProperty("--sy",endY-y+"px");
 bar.style.width=(100*(i+1)/CARDS.length)+"%";bar.classList.add("charged");
 window.setTimeout(()=>{
  if(token!==celebrationId||!popup.open)return;
  clearStamp();if(current()<0)finish();else if(!reading)question();
 },reduced.matches?220:1130);
}
function finish(){
 ending=true;state.cleared=true;state.screen="map";state.node=20;standAt(1);freeze();$("progress").style.width="100%";$("timer").textContent="9 / 9";$("leave").textContent="Return to island";
 paper.innerHTML='<div class="count">Checkpoint cleared</div><h2 id="qtitle">The mill flag is yours.</h2><p>All nine encounters are in your field notebook.</p><button class="primary" id="return">Return to island →</button>';
 cheer("⚑  Mission cleared");const back=()=>{clearTimeout(feedbackTimer);ending=false;leave();$("flag").classList.remove("rise");requestAnimationFrame(()=>$("flag").classList.add("rise"));$("leave").onclick=leave;};
 $("return").onclick=back;$("leave").onclick=back;feedbackTimer=window.setTimeout(back,reduced.matches?1700:2800);focusTitle();
}
function openJournal(){
 reading=true;state.screen="map";freeze();show();
 const marked=state.entries.filter(e=>e.rating).length,hits=state.entries.filter(e=>e.rating==="got").length;
 $("progress").style.width=(100*marked/CARDS.length)+"%";$("timer").textContent=minutes(state.remaining);$("leave").textContent="Back to island";
 paper.innerHTML='<div class="count">Old Mill · Field notebook</div><h2 id="qtitle">'+(state.cleared?"Your mission record":"Your hour is complete")+'</h2><p>'+marked+' of 9 self-checked · '+hits+' marked “Got it” · '+(marked-hits)+' marked for review.</p><div id="record" class="notebook"></div>';
 state.entries.forEach((e,i)=>{
  const d=document.createElement("details"),summary=document.createElement("summary");summary.textContent=(i+1)+". "+titles[i]+" · "+(e.rating==="got"?"Got it":e.rating==="review"?"Needs review":e.submitted?"Submitted":e.answer?"Draft":"Unattempted");d.append(summary);
  const front=document.createElement("div");front.className="cardtext";front.innerHTML=CARDS[i].front;d.append(front);
  if(e.answer){const note=document.createElement("div");note.className="note written";note.textContent=e.answer;d.append(note);}
  if(e.submitted){const solution=document.createElement("div");solution.className="cardtext";solution.innerHTML='<h3>Worked solution</h3>'+CARDS[i].back;d.append(solution);if(i===0)d.append(variance());if(i===7)d.append(jacobian());}
  $("record").append(d);
 });
 if(!state.cleared){paper.insertAdjacentHTML("beforeend",'<div class="actions"><button class="primary" id="continue">Continue in a new hour →</button></div>');$("continue").onclick=()=>{state.remaining=3600000;enter();};}
 focusTitle();
}
