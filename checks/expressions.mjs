import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildWorlds} from '../worlds.js';
import {createFacialRig,createSleepLetters} from '../expressions.js';

const data=fs.readFileSync(new URL('../assets/Clawd-Animator.glb',import.meta.url));
const avatar=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
const scene=new T.Scene();scene.add(avatar.scene);const bones={},hands=[];
avatar.scene.traverse(o=>{if(o.isBone)bones[o.name]=o;if(/Claw_[LR]$/.test(o.name))hands.push(o)});
const faces=createFacialRig(avatar.scene,bones),sleep=createSleepLetters(bones.AttachHead),worlds=buildWorlds(scene);
const mixer=new T.AnimationMixer(avatar.scene),butterfly=worlds.garden.userData.butterfly;
let poseSamples=0,minClearance=Infinity;
for(const original of avatar.animations.filter(a=>a.name.startsWith('Clawd / '))){
 const clip=original.clone();clip.tracks=clip.tracks.filter(t=>!/^(Face|Eye[LR]|Brow[LR]|Mouth)\./.test(t.name));
 mixer.stopAllAction();const action=mixer.clipAction(clip).play();
 for(let t=0;t<clip.duration;t+=1/12){
  action.time=t;mixer.update(0);scene.updateMatrixWorld(true);
  for(const y of [2.91,3.15,3.39]){
   butterfly.position.y=y;butterfly.updateMatrixWorld(true);const butterflyBounds=new T.Box3().setFromObject(butterfly);
   for(const hand of hands){hand.computeBoundingBox();const box=hand.boundingBox.clone().applyMatrix4(hand.matrixWorld);assert(!box.intersectsBox(butterflyBounds),`${clip.name} at ${t}: garden decoration hits hand`);minClearance=Math.min(minClearance,butterflyBounds.min.x-box.max.x)}
  }
  poseSamples++;
 }
}
mixer.stopAllAction();scene.updateMatrixWorld(true);
for(const mood of ['Neutral','Curious','Happy','Joyful','Sad','Sleepy','Surprised','Happy','Neutral']){
 for(let i=0;i<18;i++){faces.update(mood,1/12);scene.updateMatrixWorld(true);for(const mesh of faces.parts){assert(mesh.position.toArray().every(Number.isFinite));assert(mesh.scale.toArray().every(n=>n>0&&Number.isFinite(n)))}}
 if(mood==='Neutral')assert(faces.parts.slice(6).every(p=>!p.visible),'Neutral face leaves eyebrows or mouth behind');
 if(mood==='Sleepy')assert(faces.parts.slice(0,6).every(p=>p.scale.y<.13),'Sleepy eyes are not closed');
}
for(let i=0;i<60;i++){
 sleep.update(true,1/12);scene.updateMatrixWorld(true);const head=bones.AttachHead.getWorldPosition(new T.Vector3());
 for(const {letter,ink} of sleep.letters){assert(letter.visible);assert(ink.opacity>=0&&ink.opacity<=1);const box=new T.Box3().setFromObject(letter);assert(box.min.y>head.y+.25,'Sleep letter intersects head')}
}
sleep.update(false,1/12);assert(sleep.letters.every(({letter})=>!letter.visible),'Sleep letters remain after waking');
console.log(JSON.stringify({poseSamples,minimumButterflyHandClearance:Number(minClearance.toFixed(2)),moodTransitions:'passed',sleepLetters:'passed'}));
