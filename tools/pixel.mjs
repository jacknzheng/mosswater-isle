// A tiny pixel canvas for drawing the tileset in code, plus a PNG writer.
import zlib from 'node:zlib';

const cache=new Map();
/** '#rrggbb' or '#rrggbbaa' to a packed RGBA integer. 0 is transparent. */
export function C(hex){
 let v=cache.get(hex);
 if(v===undefined){const h=hex.slice(1);v=(parseInt(h.length===6?h+'ff':h,16))>>>0;cache.set(hex,v);}
 return v;
}
export function rng(seed){let a=seed>>>0;return n=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);const f=((t^t>>>14)>>>0)/4294967296;return n===undefined?f:Math.floor(f*n);};}
export const hash=(x,y,s=0)=>{let h=Math.imul(x+s*374761393|0,668265263)^Math.imul(y|0,2246822519);h=Math.imul(h^h>>>13,3266489917);return((h^h>>>16)>>>0)/4294967296;};

export class Sheet{
 constructor(w,h){this.w=w;this.h=h;this.d=new Uint32Array(w*h);}
 get(x,y){return x<0||y<0||x>=this.w||y>=this.h?0:this.d[y*this.w+x];}
 set(x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.w||y>=this.h)return;this.d[y*this.w+x]=typeof c==='string'?C(c):c;}
 fill(c){this.d.fill(typeof c==='string'?C(c):c);return this;}
 rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c);return this;}
 /** Paint every pixel for which test(x,y) returns a color. */
 each(fn){for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){const c=fn(x,y,this.get(x,y));if(c!==undefined&&c!==null)this.set(x,y,c);}return this;}
 disc(cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)this.set(x,y,c);return this;}
 /** Draw rows of characters. pal maps a character to a color. '.' and ' ' are transparent. */
 art(x,y,rows,pal,flip=false){rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='.'||ch===' ')return;const c=pal[ch];if(c===undefined)throw Error('No color for '+ch);this.set(x+(flip?row.length-1-i:i),y+j,c);}));return this;}
 blit(src,dx,dy,flip=false){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const c=src.get(flip?src.w-1-x:x,y);if(c&255)this.set(dx+x,dy+y,c);}return this;}
 /** Outline opaque shapes with a color. Diagonal neighbors are left open for a softer corner. */
 outline(c){const add=[];for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(!(this.get(x,y)&255)&&((this.get(x-1,y)&255)===255||(this.get(x+1,y)&255)===255||(this.get(x,y-1)&255)===255||(this.get(x,y+1)&255)===255))add.push([x,y]);for(const[x,y]of add)this.set(x,y,c);return this;}
 bounds(){let x0=this.w,y0=this.h,x1=-1,y1=-1;for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)if(this.get(x,y)&255){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return[x0,y0,x1,y1];}
 png(){
  const row=this.w*4+1,raw=Buffer.alloc(row*this.h);
  for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)raw.writeUInt32BE(this.d[y*this.w+x],y*row+1+x*4);
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),out=Buffer.alloc(body.length+8);out.writeUInt32BE(data.length,0);body.copy(out,4);out.writeUInt32BE(zlib.crc32(body)>>>0,body.length+4);return out;};
  const head=Buffer.alloc(13);head.writeUInt32BE(this.w,0);head.writeUInt32BE(this.h,4);head.set([8,6,0,0,0],8);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
 }
}

/** Packs named sprites onto one sheet in rows and records where each landed. */
export class Atlas{
 constructor(width){this.width=width;this.items=[];}
 add(name,sheet,meta){this.items.push({name,sheet,meta});return sheet;}
 pack(){
  const index={};let x=0,y=0,rowH=0;
  const order=[...this.items].sort((a,b)=>b.sheet.h-a.sheet.h||a.name.localeCompare(b.name));
  for(const item of order){
   if(x+item.sheet.w>this.width){x=0;y+=rowH+1;rowH=0;}
   item.x=x;item.y=y;x+=item.sheet.w+1;rowH=Math.max(rowH,item.sheet.h);
  }
  const out=new Sheet(this.width,y+rowH);
  for(const item of order){out.blit(item.sheet,item.x,item.y);index[item.name]=[item.x,item.y,item.sheet.w,item.sheet.h,...(item.meta??[])];}
  return {sheet:out,index};
 }
}
