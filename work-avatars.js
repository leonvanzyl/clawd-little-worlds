import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createFacialRig} from './expressions.js';

export function createWorkerTeam(scene,template,idleClip){
 const workers=new Map();let visible=false;
 function update(agents){
  const keep=new Set(agents.slice(-6).map(a=>a.id));
  for(const [id,w] of workers)if(!keep.has(id)){scene.remove(w.root);w.mixer.stopAllAction();workers.delete(id)}
  agents.slice(-6).forEach((a,i)=>{
   let w=workers.get(a.id);if(!w){const model=clone(template),root=new T.Group(),bones={};root.add(model);scene.add(root);model.traverse(o=>{if(o.isBone)bones[o.name]=o});const face=createFacialRig(model,bones),mixer=new T.AnimationMixer(model);mixer.clipAction(idleClip).play();w={root,model,bones,face,mixer};workers.set(a.id,w)}
   w.agent=a;w.index=i;w.root.scale.setScalar(.23);w.root.position.set(i%2?3.4:-3.4,3.55+Math.floor(i/2)*1.12,.5);w.root.rotation.y=i%2?-.18:.18;w.root.visible=visible;
  });
 }
 function show(on){visible=on;for(const w of workers.values())w.root.visible=on}
 function step(dt,time){for(const w of workers.values()){
  if(!visible)continue;w.mixer.update(dt);const a=w.agent,running=a.status==='running',phase=a.phase||'thinking';
  w.face.update(a.status==='completed'?'Happy':a.status==='failed'?'Sad':phase==='waiting'?'Surprised':phase==='writing'?'Neutral':'Curious',dt);
  w.root.position.y=3.55+Math.floor(w.index/2)*1.12+(running?Math.round(Math.sin(time*2+w.index)*2)*.035:0);
  w.root.rotation.z=running&&phase==='writing'?Math.sin(time*8+w.index)*.04:0;
 }}
 return{update,show,step};
}
