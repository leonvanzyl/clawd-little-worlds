import * as T from 'three';
import {box,group} from './worlds.js';

// Small, solid pixel strokes stay on the existing face bones. Unlike rotating
// short rectangular eyes, these silhouettes read as smiles at thumbnail size.
const hidden=[0,0,.0001,.0001,0];
const rect=(w=.4,h=.8,y=0)=>[-1,0,1].map(i=>[i*w/3,y,w/3+.002,h,0]);
const closed=()=>rect(.58,.12,-.14);
const arch=(w=.68)=>[[-w/2+.07,0,.14,.28,0],[0,.14,w-.14,.14,0],[w/2-.07,0,.14,.28,0]];
const mouth=(kind)=>kind==='o'?[[0,.16,.30,.10,0],[0,-.16,.30,.10,0],[-.15,0,.10,.28,0],[.15,0,.10,.28,0]]:kind?[[0,kind==='smile'?-.09:.09,.44,.11,0],[-.25,0,.11,.20,0],[.25,0,.11,.20,0],hidden]:Array(4).fill(hidden);
const pose=(left,right,{brows=[hidden,hidden],lips=null}={})=>[...left,...right,...brows,...mouth(lips)];
const poses={
 Neutral:pose(rect(),rect()),
 Curious:pose(rect(.40,.88,.025),rect(.4,.68),{brows:[hidden,[0,.025,.40,.09,.09]]}),
 Happy:pose(arch(),arch()),
 Joyful:pose(arch(.76),arch(.76),{lips:'smile'}),
 Sad:pose(rect(.38,.42,-.12),rect(.38,.42,-.12),{brows:[[0,-.15,.57,.10,.30],[0,-.15,.57,.10,-.30]],lips:'frown'}),
 Sleepy:pose(closed(),closed()),
 Surprised:pose(rect(.47,.94),rect(.47,.94),{lips:'o'})
};

export function createFacialRig(model,bones){
 model.traverse(o=>{if(o.isMesh&&/Front_eye|Optional_brow|Optional_expression_mouth/.test(o.name))o.visible=false});
 const parts=[];
 function add(parent,count){for(let i=0;i<count;i++){const mesh=box(parent,'#11131b',[0,0,.012],[.001,.001,.052]);mesh.castShadow=false;mesh.receiveShadow=false;parts.push(mesh)}}
 add(bones.EyeL,3);add(bones.EyeR,3);add(bones.BrowL,1);add(bones.BrowR,1);add(bones.Mouth,4);
 const current=parts.map(()=>hidden.slice());
 function update(name,dt,blink=false){
   const target=poses[name]||poses.Neutral,alpha=Math.min(1,dt*8);
   for(let i=0;i<parts.length;i++){
     const goal=blink&&i<6?closed()[i%3]:target[i],p=current[i];
     for(let axis=0;axis<5;axis++)p[axis]+=(goal[axis]-p[axis])*alpha;
     parts[i].position.set(p[0],p[1],.012);parts[i].scale.set(p[2],p[3],.052);parts[i].rotation.z=p[4];
     parts[i].visible=p[2]>.005&&p[3]>.005;
   }
 }
 update('Curious',1);
 return{update,parts};
}

// Three pooled, extruded voxel letters: no text sprites or DOM overlays.
export function createSleepLetters(anchor){
 const letters=[],pattern=['11111','00010','00100','01000','11111'];
 for(let i=0;i<3;i++){
   const letter=group(anchor),ink=new T.MeshStandardMaterial({color:'#658b88',roughness:1,transparent:true,depthWrite:false});
   pattern.forEach((row,y)=>[...row].forEach((pixel,x)=>{if(pixel==='1'){
     const cube=box(letter,'#658b88',[(x-2)*.105,(2-y)*.105,0],[.107,.107,.10]);cube.material=ink;cube.castShadow=false;cube.receiveShadow=false;
   }}));
   letter.visible=false;letters.push({letter,ink});
 }
 let elapsed=0,wasActive=false;
 function update(active,dt){
   if(active&&!wasActive)elapsed=0;
   if(active)elapsed+=dt;wasActive=active;
   letters.forEach(({letter,ink},i)=>{
     letter.visible=active;
     if(!active)return;
     const phase=(elapsed/3.6+i/3)%1,size=.68+phase*.55;
     letter.position.set(.8+phase*1.1,.60+phase*1.40,1.05);
     letter.rotation.set(.04,.14,Math.sin(phase*Math.PI*2)*.08);letter.scale.setScalar(size);
     ink.opacity=Math.min(1,phase*8,(1-phase)*6)*.9;
   });
 }
 return{update,letters};
}
