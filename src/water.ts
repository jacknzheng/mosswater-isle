// Composite the flowing texture only onto blue water pixels. The original bank,
// bridge planks, stones and lily pads remain visible above the surface.
// Store only the strip occupied by the river and its coves in each animation frame.
const waterLeft=190,waterWidth=475;
function prepareWater(){
 const buffer=document.createElement("canvas");buffer.width=waterWidth;buffer.height=H;
 const ctx=buffer.getContext("2d",{willReadFrequently:true})!;
 ctx.drawImage(art,-waterLeft,0,W,H);const source=ctx.getImageData(0,0,waterWidth,H).data;
 const mask=new Uint8Array(waterWidth*H),pixels:number[]=[];
 for(let y=0;y<H;y++)for(let col=0;col<waterWidth;col++){
  const x=col+waterLeft;
  const inRiver=y>=640?x>=300:(x>235&&x<567&&(y>335||x<459||y>268&&y<361))||(x>=195&&x<280&&y>438&&y<552);
  if(!inRiver)continue;
  const p=y*waterWidth+col,k=p*4,r=source[k],g=source[k+1],b=source[k+2];
  if(b>g*1.03&&b>r*1.23&&g>r*1.12){mask[p]=1;}
 }
 // Skip isolated blue flowers and window trim. Bridges split the river into several large pools.
 for(let seed=0;seed<mask.length;seed++){
  if(mask[seed]!==1)continue;
  const pool=[seed];mask[seed]=2;
  for(let i=0;i<pool.length;i++){
   const p=pool[i],col=p%waterWidth;
   for(const n of [col>0?p-1:-1,col+1<waterWidth?p+1:-1,p-waterWidth,p+waterWidth]){
    if(mask[n]===1){mask[n]=2;pool.push(n);}
   }
  }
  if(pool.length>=170)for(const p of pool)pixels.push(p);
  else for(const p of pool)mask[p]=0;
 }
 const count=12;
 for(let frame=0;frame<count;frame++){
  const layer=document.createElement("canvas");layer.width=waterWidth;layer.height=H;
  const out=layer.getContext("2d")!,image=out.createImageData(waterWidth,H),target=image.data;
  const phase=frame/count,phaseB=(phase+.5)%1;
  const weight=1-Math.abs(2*phase-1);
  for(const p of pixels){
   const y=Math.floor(p/waterWidth),x=p%waterWidth+waterLeft;
   const vx=Math.round(Math.sin(y*.09+phase*Math.PI*2));
   const a=p-Math.floor(phase*8)*waterWidth+vx,b=p-Math.floor(phaseB*8)*waterWidth-vx,k=p*4;
   const a4=(mask[a]?a:p)*4,b4=(mask[b]?b:p)*4;
   for(let i=0;i<3;i++)target[k+i]=Math.round(weight*source[a4+i]+(1-weight)*source[b4+i]);
   target[k+3]=249;
   // Moving, intermittent two-pixel glints break up the longer current.
   if((x+Math.floor(y/13)*29)%61<3&&(y+count-frame)%17===0){target[k]+=32;target[k+1]+=30;target[k+2]+=19;}
  }
  out.putImageData(image,0,0);out.translate(-waterLeft,0);
  for(let col=0;col<10;col++){
   const x=372+col*4,y=100+((col*9+frame*3)%29);
   out.fillStyle=col%2?"#e0ffffba":"#b6e8ffb0";out.fillRect(x,y,1,4);
   out.fillStyle="#f7ffffc0";out.fillRect(x,137+(frame+col)%4,2,1);
  }
  // The wheel has a narrow near face and a row of paddles receding toward the mill.
  const cx=472,cy=296,angle=phase*Math.PI/4;
  out.save();out.beginPath();out.ellipse(cx,cy,8.1,24.7,0,0,Math.PI*2);out.fillStyle="#493723";out.fill();
  for(let i=0;i<8;i++){
   const theta=angle+i*Math.PI/4,dx=Math.cos(theta)*7.4,dy=Math.sin(theta)*23;
   out.strokeStyle="#b48952";out.lineWidth=1.6;out.beginPath();out.moveTo(cx,cy);out.lineTo(cx+dx,cy+dy);out.stroke();
  }
  out.fillStyle="#c19860";out.fillRect(cx-1,cy-2,3,4);out.fillStyle="#795839";out.fillRect(cx,cy,1,2);
  out.beginPath();out.rect(484,268,11,55);out.clip();out.fillStyle="#684c32";out.fillRect(484,268,11,55);
  for(let i=0;i<8;i++){const theta=angle+i*Math.PI/4;if(Math.cos(theta)<0)continue;
   const y=cy+Math.sin(theta)*27;out.fillStyle="#452f22";out.fillRect(484,Math.round(y),12,5);
   out.fillStyle="#bf955e";out.fillRect(484,Math.round(y),12,2);
  }
  out.restore();waterFrames.push(layer);
 }
}
function paintWater(now:number){
 if(!waterFrames.length)return;
 const frame=reduced.matches?0:Math.floor(now/80)%waterFrames.length;
 if(frame===waterFrame&&entryTime===null)return;
 waterFrame=frame;water.clearRect(waterLeft,0,waterWidth,H);water.drawImage(waterFrames[frame],waterLeft,0);
 if(entryTime!==null&&stopFor(mission)===1){
  const x=538,y=313,w=17,h=19;
  water.fillStyle="#211f25";water.fillRect(x,y,w,h);water.fillStyle="#312b2a";water.fillRect(x+2,y+4,w-3,h-4);
  const width=Math.round(w*(1-entryOpen));
  if(width>0)water.drawImage(art,x*art.naturalWidth/W,y*art.naturalHeight/H,w*art.naturalWidth/W,h*art.naturalHeight/H,x,y,width,h);
 }
}
