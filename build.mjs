import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=import.meta.dirname;
const encoded=['Clawd-Animator.glb','Clawd-Drumkit.glb'].map(name=>readFileSync(resolve(root,'assets',name)).toString('base64'));
writeFileSync(resolve(root,'assets.generated.js'),`export const avatarData=${JSON.stringify(encoded[0])};export const kitData=${JSON.stringify(encoded[1])};`);
const result=await build({entryPoints:[resolve(root,'app.js')],bundle:true,write:false,format:'iife',minify:true,target:'es2022',legalComments:'inline'});
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const notice=readFileSync(resolve(root,'THIRD-PARTY-NOTICES.txt'),'utf8').replace(/\*\//g,'* /');
const html=readFileSync(resolve(root,'index.html'),'utf8').replace('__APP_CSS__',()=>readFileSync(resolve(root,'styles.css'),'utf8')).replace('__APP_BUNDLE__',()=>'/* Bundled browser licenses\n'+notice+'\n*/\n'+js);
if(html.includes('__APP_BUNDLE__')||html.includes('__APP_CSS__'))throw new Error('Unfilled build placeholder');
const out=resolve(root,'dist');mkdirSync(out,{recursive:true});
// Static hosts serve index.html at /. Keep the original download/local URL too.
for(const name of ['index.html','Clawd-Playground.html'])writeFileSync(resolve(out,name),html);
console.log(`Built self-contained playground: ${(html.length/1024).toFixed(0)} KB`);
