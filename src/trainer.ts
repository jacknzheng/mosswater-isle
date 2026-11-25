// The trainer's ink, scarlet, sea glass, and ivory fit in two bits per opaque pixel.
type Facing = "north" | "south" | "west" | "east";
const trainerInk: Record<string,string> = {i:"#252e37",r:"#de493f",t:"#50948b",w:"#ffe0a7"};
const frontCap = [
 "....iiiiiii....","..iirrrrrrrii..",".irrrrrwwrrrrri",".irrrrwwwrrriri",
 "iiwwwwwwwwwwrii",".iiiirrrrrrii..","..iwiwwwwwiwi..","..iwiwiwiwiwi..",
 "...iwwwwwwwi...","....iiwwwii...."
];
const rearCap = [
 "....iiiiiii....","..iirrrrrrrii..",".irrrrrrrrwwrri",".irrrrrrrrrriri",
 ".irrrrrrrrrrrri","..irriiwwiirri.","..iiiiiiiiiii..","..iitiiiiitii..",
 "...iiiiiiiii...","....iiwwwii...."
];
const sideCap = [
 "...iiiiii......",".iirrrrrrii....","iirrrrrwwrrii..","irrrrrwwwrrrii.",
 "irrrrrrrrrrrrri",".iiiiiiiirrrrrr","..iiiwwwwwwi...","..iiwwwiiwwii..",
 "...iiwwwwwwi...","....iiwwwii...."
];
function paintPixels(ctx:CanvasRenderingContext2D, rows:string[], x:number,y:number){
 rows.forEach((row,j)=>{for(let i=0;i<row.length;i++){const color=trainerInk[row[i]];if(color){ctx.fillStyle=color;ctx.fillRect(x+i,y+j,1,1);}}});
}
function trainerFrame(facing:Facing, frame:number){
 const canvas=document.createElement("canvas");canvas.width=22;canvas.height=26;
 const ctx=canvas.getContext("2d")!;
 if(facing==="west"){ctx.translate(22,0);ctx.scale(-1,1);}
 const side=facing==="east"||facing==="west",back=facing==="north";
 const step=[0,1,0,-1][frame],bob=step===0?0:-1;
 const shoe=["iiii","itti","iwwi","iiii"];
 const bootY=back?-step:step;
 if(side){
  paintPixels(ctx,shoe,8-step*2,21+(step===1?-1:0));
  paintPixels(ctx,shoe,11+step*2,21+(step===-1?-1:0));
  paintPixels(ctx,["..iiiiii..",".irrrwwii.","irrrriwwi.","ittiitrii.","ittiiirii.","iiiiiirii.","..ittttii.","..iiiiii.."],5,14+bob);
  paintPixels(ctx,[".iii","irri","iwwi",".ii."],9-step,16+bob);
 }else{
  paintPixels(ctx,shoe,6,21+bootY);paintPixels(ctx,shoe,12,21-bootY);
  paintPixels(ctx,back?[".iiiiiiii.","irriiiirri","irittwwiri","irittwwiri","iritttriri","iiittttiii",".itttttti.",".iiiiiiii."]:[".iiiiiiii.","irrwwwwrri","irriiirrri","irrwwiirri","irriwiirri","iiwwwwwwii",".itttttti.",".iiiiiiii."],6,13+bob);
  paintPixels(ctx,[".ii.","irri","iwwi",".ii."],3,15+bob+bootY);
  paintPixels(ctx,[".ii.","irri","iwwi",".ii."],15,15+bob-bootY);
 }
 paintPixels(ctx,side?sideCap:back?rearCap:frontCap,side?3:4,4+bob);
 return canvas;
}
const trainerAtlas=new Map<Facing,HTMLCanvasElement[]>();
for(const f of ["north","south","east","west"] as const)trainerAtlas.set(f,[0,1,2,3].map(i=>trainerFrame(f,i)));
