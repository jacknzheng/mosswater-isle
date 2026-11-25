import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(path.join(root,name),'utf8');
const image=name=>'data:image/webp;base64,'+readFileSync(path.join(root,'assets',name)).toString('base64');
mkdirSync(path.join(root,'.build'),{recursive:true});
execFileSync('tsc',['-p',root],{stdio:'inherit'});
const config=read('assets/world.json');
const replacements={
 MAP_ART:image('map.webp'),
 CARD_DATA:read('assets/cards.json'),
 '/* WORLD_DATA */': 'const WORLD = '+config+';',
 '/* ISLE_GAME */':read('.build/game.js')
};
let page=read('index.template.html');
for(const [key,value] of Object.entries(replacements))page=page.replace(key,()=>value);
writeFileSync(process.argv[2] || path.join(root,'.build','Mosswater Isle.html'),page);
