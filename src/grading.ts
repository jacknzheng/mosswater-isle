type AnswerGrade={earned:number;total:number;feedback:string;hint:string};

function validGrade(g:AnswerGrade|undefined):g is AnswerGrade{
 return !!g&&Number.isInteger(g.total)&&g.total>0&&Number.isInteger(g.earned)&&g.earned>=0&&g.earned<=g.total&&typeof g.feedback==="string"&&typeof g.hint==="string";
}

// Only recognize whole, unambiguous short answers here. Send explanations to the tutor.
function shortAnswer(card:number,answer:string):AnswerGrade|undefined{
 const text=answer.trim().toLowerCase().replace(/[.,;!]+$/,"").trim();
 if(card===1795025155936&&/^(?:(?:a |student(?:'s|’s)? )?t(?:[- ]distribution)?\s*(?:with\s+)?(?:df\s*=?\s*2|2\s+(?:df|degrees of freedom))|t\s*(?:\(2\)|₂|_2))$/.test(text)){
  return {earned:1,total:4,feedback:"You identified the t distribution and its two degrees of freedom.",hint:"Once you know two deviations from the sample mean, what determines the third?"};
 }
 // Exact fragments earn only the rubric items they actually demonstrate.
 const math=text.replace(/\s/g,"").replace(/[−–]/g,"-").replaceAll("ε","e").replaceAll("²","^2");
 if(card===1795025155878&&/^(?:m(?:_?x)?\(t\)=)?2\/\(2-t\),?t<2$/.test(math))
  return {earned:1,total:4,feedback:"Your MGF and its finite domain are correct.",hint:"What defining expectation would give you that MGF, and how could its derivatives give the moments?"};
 if(card===1795025156177&&/^(?:c_?0=(?:7\/10|0?\.7),c_?1=-(?:1\/10|0?\.1)|\((?:7\/10|0?\.7),-(?:1\/10|0?\.1)\))$/.test(math))
  return {earned:1,total:4,feedback:"Both polynomial coefficients are correct.",hint:"What equation does each coordinate of the matrix-vector product give you?"};
 if(card===1795025156277&&/^(?:they|theintervals|theevents)?(?:shrink|decrease)(?:,|and)?(?:theirintersectionis|to)(?:\{0\}|zero|0)$/.test(math))
  return {earned:2,total:4,feedback:"You correctly identified the decreasing intervals and their intersection.",hint:"For the growing events in the proof, how could you isolate the outcomes that first appear at step n?"};
 if(card===1795025156328&&/^\(-2e\^2,e\^2\)(?:t|ᵀ)?$/.test(math))
  return {earned:1,total:4,feedback:"That is the exact change in the two outputs.",hint:"What does multiplying the Jacobian by the input displacement predict?"};
 if(card===1795025156378&&/^(?:thereare)?27(?:equallylikely)?(?:choice)?(?:sequences|paths|outcomes)?$/.test(math))
  return {earned:1,total:3,feedback:"You counted the possible sequences of choices correctly.",hint:"Can that many equally likely sequences be split evenly among the six orders?"};
 const values:Record<number,[number,number,string,string]>={
  1795025155832:[5,3,"Your total variance is correct.","How do the two group means and their within-group spreads enter the second moment?"],
  1795025156025:[0.5,3,"You found the original limit.","What do the numerator and denominator each approach before differentiating?"],
  1795025156077:[2/27,4,"Your value at s = 3 is correct.","What happens to the power of t after the first integration by parts?"],
 };
 const expected=values[card],number=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*\/\s*([+-]?\d+))?$/);
 if(!number||!expected)return;
 const value=Number(number[1])/Number(number[2]??1);
 if(!Number.isFinite(value)||Math.abs(value-expected[0])>1e-10)return;
 return {earned:1,total:expected[1],feedback:expected[2],hint:expected[3]};
}

function displayGrade(el:HTMLElement,grade:AnswerGrade){
 const title=document.createElement("strong"),note=document.createElement("p");
 title.textContent=grade.earned+" / "+grade.total+" points";note.textContent=grade.feedback;
 el.replaceChildren(title,note);el.hidden=false;
 if(grade.hint){const hint=document.createElement("p");hint.textContent=grade.hint;el.append(hint);}
}

function attachAnswerCheck(entry:Entry,input:HTMLTextAreaElement){
 const check=$("check") as HTMLButtonElement,submit=$("submit") as HTMLButtonElement;
 const panel=$("check-feedback"),error=$("error"),manual=$("self-check");
 let lastAnswer="",lastGrade:AnswerGrade|undefined,edit=0;
 input.addEventListener("input",()=>{edit++;lastGrade=undefined;panel.hidden=true;manual.hidden=true;});
 async function assess(final:boolean){
  refreshClock();
  const answer=input.value.trim(),generation=edit;
  if(reading||!input.isConnected||check.disabled)return;
  if(!answer||answer.length>12000){error.textContent=answer?"Keep your answer to 12,000 characters or fewer.":"Write your attempt first.";input.focus();return;}
  check.disabled=submit.disabled=true;manual.hidden=true;error.textContent="Checking your reasoning…";
  try{
   let grade=answer===lastAnswer?lastGrade:undefined;
   grade??=shortAnswer(entry.card,answer);
   if(!grade){
    const {data,error:serviceError}=await cloud.functions.invoke("grade-answer",{body:{card:entry.card,answer,device}});
    if(serviceError){
     const status=serviceError.context?.status;
     if(status===503){
      const detail=await serviceError.context.json().catch(()=>null);
      if(detail?.error==="Grader is awaiting setup")throw Error("AI feedback needs a grading key. Your draft is saved. You can come back or reveal the solution to self-check.");
     }
     throw Error(status===429?"You’ve reached the grading limit. Try again later.":status===401?"Unlock the game again to check this answer.":"The AI grader is unavailable. You can retry or use the worked solution to self-check.");
    }
    if(!validGrade(data))throw Error("The grader returned an incomplete check. Please retry.");
    grade=data;
   }
   refreshClock();
   if(!input.isConnected||!popup.open||!unlockedGame||reading||edit!==generation)return;
   lastGrade=grade;lastAnswer=answer;
   if(final){
    entry.grade=grade;entry.submitted=true;entry.rating=grade.earned===grade.total?"got":"review";
    elapsed();write();question();
    if(entry.rating==="got")cheer("✦ Correct!");
   }else displayGrade(panel,grade);
   error.textContent="";
  }catch(cause){
   if(input.isConnected&&generation===edit){
    error.textContent=cause instanceof Error?cause.message:"The grader is unavailable. Please retry.";
    manual.hidden=false;
   }
  }finally{check.disabled=submit.disabled=false;if(edit!==generation&&input.isConnected)error.textContent="";}
 }
 check.onclick=()=>void assess(false);submit.onclick=()=>void assess(true);
 manual.onclick=()=>{refreshClock();if(!input.isConnected||reading||!input.value.trim())return;entry.submitted=true;write();question();};
}
