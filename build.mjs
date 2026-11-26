import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
const root=fileURLToPath(new URL('.',import.meta.url));
const read=name=>readFileSync(path.join(root,name),'utf8');
const data=(name,mime)=>'data:'+mime+';base64,'+readFileSync(path.join(root,'assets',name)).toString('base64');
mkdirSync(path.join(root,'.build'),{recursive:true});
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p',root],{stdio:'inherit'});
const sdk=await build({stdin:{contents:"import {createClient} from '@supabase/supabase-js'; window.mosswaterClient=createClient('https://usgospjdknxcpxxeywgl.supabase.co','sb_publishable_sXmidmqHvALUBplbRBz2bg_6Laxki0I',{auth:{detectSessionInUrl:location.protocol==='https:',flowType:location.protocol==='https:'?'pkce':'implicit',storageKey:'mosswater-auth-v1'}});",resolveDir:root},bundle:true,minify:true,write:false,format:'iife',target:'es2020',legalComments:'inline'});
const missions=readdirSync(path.join(root,'missions')).filter(f=>f.endsWith('.json')).sort().map(f=>{
 const m=JSON.parse(read('missions/'+f));
 if(!/^\d{4}-\d{2}-\d{2}\.json$/.test(f)||m.date!==f.slice(0,10)||!m.name||!m.cards?.length||!m.cards.every(c=>Number.isSafeInteger(c.id)&&c.title&&typeof c.front==='string'&&typeof c.back==='string')||new Set(m.cards.map(c=>c.id)).size!==m.cards.length)throw Error('Invalid mission: '+f);
 const offset=(Date.parse(m.date+'T00:00:00Z')-Date.UTC(2026,10,27))/86400000;
 if(!Number.isInteger(offset)||offset<0||offset%2)throw Error('Mission date falls outside the two-day schedule: '+f);
 return m;
});
const scriptJSON=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const replacements={
 MAP_ART:data('map.webp','image/webp'), REGION_ART:data('highlands.webp','image/webp'), TRAINER_ART:data('trainer.png','image/png'), PIXEL_FONT:data('pixelify.ttf','font/ttf'),
 CARD_DATA:read('assets/cards.json'),MISSION_DATA:scriptJSON(missions),
 '/* WORLD_DATA */':'const WORLD = '+read('assets/world.json')+';',
 '/* SUPABASE_SDK */':sdk.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'),
 '/* ISLE_GAME */':read('.build/game.js')
};
let page=read('index.template.html');
for(const [key,value] of Object.entries(replacements))page=page.replace(key,()=>value);
const output=process.argv[2]||path.join(root,'docs','index.html');
mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,page);
