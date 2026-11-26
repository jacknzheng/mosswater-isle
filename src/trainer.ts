type Facing = "north" | "south" | "west" | "east";
const trainerSheet=document.getElementById("trainer-sheet") as HTMLImageElement;
const spriteRow:Record<Facing,number>={south:0,north:1,east:2,west:3};
