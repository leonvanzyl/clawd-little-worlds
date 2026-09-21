import {createWorkProps} from './work-props.js';
import {initCodeMode} from './code-mode.js';
import {createWorkerTeam} from './work-avatars.js';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildWorlds,heldProps,box,material,group} from './worlds.js';
import {createFacialRig,createSleepLetters} from './expressions.js';
import {avatarData,kitData} from './assets.generated.js';

const $=s=>document.querySelector(s),host=$('#canvas-host'),stage=$('#stage');
const state={world:'playground',mood:'curious',prop:'none',jam:false,pokes:0,pixel:false,sound:false,paused:false,codeMode:false,codingPhase:'idle'};
let renderer,scene,camera,orbit,model,mixer,kit,actor,bones,props,sticks,worlds,facialRig,sleepLetters,workerTeam,ground,workProps;
let activeBody,bodyName='Idle',faceName='Neutral',time=0,simTime=0,pokeTime=-20,bubbleUntil=6,faceFlashUntil=0,lastDrum=-1;
const proceduralBase=new Map(),particleColliders=[];
const bodyActions={},particles=[],pickables=[],kitParts={},moodMix={neutral:0,happy:0,sad:0,joyful:0,curious:1,sleepy:0};
const pointer=new T.Vector2(),raycaster=new T.Raycaster(),up=new T.Vector3(0,1,0),headPoint=new T.Vector3(),particleGeo=new T.BoxGeometry(1,1,1);
let down=null,audioCtx=null,noiseBuffer=null,lastStep=null,resizeObserver;
const sceneNames={playground:'The playground',garden:'A quiet garden',desk:'Work in progress',moon:'Away from it all',stage:'After hours',mansion:'The spooky mansion',pirate:'The open ocean'};
const moodLines={happy:['small joys. big day.','this is a good little life.','you make me happy.'],sad:['a little blue today.','can we just sit for a bit?','even little guys have big feelings.'],joyful:['BEST. DAY. EVER.','tiny feet. maximum joy.','look at me go!'],curious:['what happens if you poke me?','hmm. what’s over there?','there’s a lot to figure out.'],sleepy:['just five more minutes…','z z z','running on one little battery.'],neutral:['just hanging out.','no thoughts. little blocks.','a very ordinary, lovely day.']};
const choose=a=>a[Math.floor(Math.random()*a.length)];
function dataBuffer(data){const s=atob(data),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b.buffer}
function say(text,duration=3.8){$('#bubble').textContent=text;bubbleUntil=simTime+duration;$('#bubble').style.opacity='1'}
function rememberRest(o){o.userData.restPosition=o.position.clone();o.userData.restScale=o.scale.clone();o.userData.restQuaternion=o.quaternion.clone()}

async function init(){
 renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
 scene=new T.Scene();scene.background=new T.Color('#eee8dd');scene.fog=new T.Fog('#eee8dd',32,75);
 camera=new T.OrthographicCamera(-8,8,4.5,-4.5,.1,100);camera.position.set(7.0,7,17);
 orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.7,.3);orbit.enableDamping=true;orbit.dampingFactor=.09;orbit.enablePan=false;orbit.minPolarAngle=.32;orbit.maxPolarAngle=Math.PI*.49;orbit.minZoom=.65;orbit.maxZoom=1.9;orbit.autoRotateSpeed=.55;orbit.update();orbit.saveState();
 const hemi=new T.HemisphereLight('#fff5df','#ae9d84',2.25);scene.add(hemi);
 const key=new T.DirectionalLight('#fff4dc',3.15);key.position.set(-5,10,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:35});key.shadow.normalBias=.045;key.shadow.bias=-.0003;key.shadow.radius=3;scene.add(key);
 const rim=new T.DirectionalLight('#d5e6eb',1.8);rim.position.set(6,7,-5);scene.add(rim);
 ground=new T.Mesh(new T.PlaneGeometry(200,200),material('#eee8dd'));ground.rotation.x=-Math.PI/2;ground.position.y=-.66;ground.receiveShadow=true;scene.add(ground);
 worlds=buildWorlds(scene);worlds.playground.visible=true;
 for(const obj of [worlds.mansion.userData.ghost,worlds.pirate.userData.wheel])obj.traverse(o=>{if(o.isMesh)pickables.push(o)});
 const loader=new GLTFLoader();const [avatar,drums]=await Promise.all([loader.parseAsync(dataBuffer(avatarData),''),loader.parseAsync(dataBuffer(kitData),'')]);
 actor=group(scene);model=avatar.scene;actor.add(model);bones={};model.traverse(o=>{if(o.isBone){bones[o.name]=o;rememberRest(o)}if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.userData.kind='avatar';pickables.push(o);if(/Body_with_solid_back|Claw_[LR]$/.test(o.name))particleColliders.push({mesh:o,bounds:new T.Box3()})}});
 mixer=new T.AnimationMixer(model);
 const faceTrack=n=>/^(Face|Eye[LR]|Brow[LR]|Mouth)\./.test(n);
 for(const original of avatar.animations){
   if(original.name.startsWith('Clawd / ')){const clip=original.clone();clip.tracks=clip.tracks.filter(t=>!faceTrack(t.name));bodyActions[clip.name.split(' / ')[1]]=mixer.clipAction(clip)}

 }
 kit=drums.scene;scene.add(kit);kit.visible=false;kit.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.kind='drum';o.userData.instrument=o.name.toLowerCase().includes('cymbal')?'hat':o.name.toLowerCase().includes('snare')?'snare':'kick';pickables.push(o)}if(/Cymbal_wobble/.test(o.name))kitParts.cymbal=o;if(/Kick_pulse/.test(o.name))kitParts.kick=o;if(/Snare_response/.test(o.name))kitParts.snare=o;rememberRest(o)});
 const avatarTemplate=cloneRig(model);workerTeam=createWorkerTeam(scene,avatarTemplate,bodyActions.Idle.getClip());
 facialRig=createFacialRig(model,bones);sleepLetters=createSleepLetters(bones.AttachHead);
 ({props,sticks}=heldProps(bones));workProps=createWorkProps(bones);
 mixer.addEventListener('finished',e=>{if(e.action===activeBody)playBody(state.jam?'Drums':'Idle',false)});
 playBody('Idle',false);playFace('Curious');mixer.update(0);model.updateMatrixWorld(true);
 setupInput();setupUI();initCodeMode({onMode:setCodeMode,onActivity:setCodingPhase,onAgents:agents=>workerTeam.update(agents)});resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);resize();
 $('#loading').classList.add('done');host.dataset.ready='true';
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;$('#error p').textContent='The 3D view paused because the graphics connection was lost. Reload this page to wake Clawd up again.'});
 window.addEventListener('pagehide',()=>audioCtx?.suspend());document.addEventListener('visibilitychange',()=>{lastStep=null;if(document.hidden)audioCtx?.suspend();else if(state.sound)audioCtx?.resume()});
 let before=performance.now(),acc=0;
 renderer.setAnimationLoop(now=>{
   const dt=Math.min((now-before)/1000,.1);before=now;time+=dt;if(!document.hidden){acc+=dt;while(acc>=1/12){step(1/12);acc-=1/12}orbit.update();positionBubble();renderer.render(scene,camera)}
 });
 // Small observable status values support accessibility and browser QA without exposing internals.
 host.dataset.engine='live-webgl';host.dataset.bones=Object.keys(bones).length;host.dataset.animations=Object.keys(bodyActions).length;
}
function setCodeMode(on){
 state.codeMode=on;state.codingPhase='';setWorld(on?'desk':'playground');setMood('neutral');
 ground.visible=!on;worlds.desk.children.slice(0,2).forEach(o=>o.visible=!on);workerTeam.show(on);workProps.update(on,state.codingPhase,simTime);
 scene.background=on?null:new T.Color(worlds.playground.userData.color);scene.fog=on?null:new T.Fog(worlds.playground.userData.color,32,75);
 if(on){camera.position.set(2.4,5.4,20);orbit.target.set(0,2.35,.45);orbit.update()}resize();
}
function setCodingPhase(phase){
 const previous=state.codingPhase;state.codingPhase=phase;if(!state.codeMode||previous===phase)return;
 host.dataset.codingPhase=phase;faceFlashUntil=0;
 if(phase==='complete'){playFace('Happy');playBody('Wave');}
 else{playFace(phase==='error'?'Sad':phase==='waiting'?'Surprised':phase==='writing'?'Neutral':'Curious');playBody('Idle',false);}
}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const a=w/h,large=['mansion','pirate'].includes(state.world),f=state.codeMode?Math.max(8.6,10.6/a):Math.max(large?10.5:8.4,(large?14:12.5)/a);camera.left=-f*a/2;camera.right=f*a/2;camera.top=f/2;camera.bottom=-f/2;camera.updateProjectionMatrix();renderer.setPixelRatio(state.pixel?1:Math.min(devicePixelRatio,2));const width=state.pixel?Math.min(w,360):w;renderer.setSize(Math.round(width),Math.round(width/a),false);host.classList.toggle('pixelated',state.pixel)}
function playBody(name,once=true,rate=1){const next=bodyActions[name];if(!next)return;const prev=activeBody;if(prev&&prev!==next)prev.fadeOut(.22);next.reset().setEffectiveTimeScale(rate*(state.world==='moon'&&name==='Hop'?.65:1)).setEffectiveWeight(1).setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;next.fadeIn(.22).play();activeBody=next;bodyName=name;host.dataset.action=name;if(name==='Drums')lastDrum=-1;updateProps()}
function playFace(name){faceName=name;host.dataset.expression=name}
function moodFace(){if(state.codeMode)return state.codingPhase==='complete'?'Happy':state.codingPhase==='error'?'Sad':state.codingPhase==='waiting'?'Surprised':state.codingPhase==='writing'?'Neutral':'Curious';return ({happy:'Happy',joyful:'Joyful',sad:'Sad',curious:'Curious',sleepy:'Sleepy',neutral:'Neutral'})[state.mood]}
function setMood(name){state.mood=name;faceFlashUntil=0;playFace(moodFace());document.querySelectorAll('button[data-mood]').forEach(b=>{const on=b.dataset.mood===name;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});$('#mood-status').textContent=name==='neutral'?'Just chilling':'Feeling '+name;say(choose(moodLines[name]),name==='sleepy'?1.1:3.8);
 if(name==='joyful'){playBody('Cheer');burst(new T.Vector3(0,3.5,0),20,'confetti');chirp('happy')}
 else if(name==='happy'){playBody('Wave');burst(new T.Vector3(0,4.5,0),5,'heart');chirp('happy')}
 else{playBody(state.jam?'Drums':'Idle',false);chirp(name==='sad'?'sad':'hello')}
 host.dataset.mood=name;
}
function setWorld(name){if(!worlds[name])return;state.world=name;Object.entries(worlds).forEach(([n,g])=>g.visible=n===name);const c=worlds[name].userData.color;if(!scene.background)scene.background=new T.Color(c);else scene.background.set(c);if(scene.fog)scene.fog.color.set(c);const floor=scene.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry');floor.material.color.set(c);floor.position.y=name==='pirate'?-1.5:-.66;stage.classList.toggle('night',['moon','stage','mansion'].includes(name));stage.classList.toggle('ocean',name==='pirate');$('#scene-label').innerHTML='<i></i>'+sceneNames[name];document.querySelectorAll('button[data-scene]').forEach(b=>{const on=b.dataset.scene===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});setJam(name==='stage',false);playBody(state.jam?'Drums':'Idle',false);resetCamera();resize();say(({playground:'home sweet little home.',garden:'a little fresh air feels good.',desk:'very important things. click clack.',moon:'one small hop for a little guy.',stage:'one, two… one, two, three, four!',mansion:'that ghost seems… quite polite.',pirate:'aye aye. tiny captain on deck.'})[name]);host.dataset.scene=name}
function setJam(on,announce=true){state.jam=on;kit.visible=on;$('#jam').setAttribute('aria-pressed',on);$('#jam').querySelector('span:nth-child(2)').textContent=on?'Take a little break':'Start a little band';if(worlds){worlds.desk.visible=state.world==='desk'&&!on;if(state.world==='desk'&&on)worlds.playground.visible=true;else if(state.world!=='playground')worlds.playground.visible=false}playBody(on?'Drums':'Idle',false);updateProps();if(announce)say(on?'born to be a little drummer.':'and that’s a wrap.');host.dataset.jamming=on}
function updateProps(){if(!props)return;for(const [name,g] of Object.entries(props))g.visible=name===state.prop&&(!state.jam||name==='headphones');sticks.forEach(g=>g.visible=state.jam)}
function resetCamera(){orbit.autoRotate=false;$('#orbit').setAttribute('aria-pressed','false');orbit.reset();if(['mansion','pirate'].includes(state.world)){orbit.target.y=2.45;camera.position.y+=.75;orbit.update()}camera.zoom=1;camera.updateProjectionMatrix()}
function poke(hit){state.pokes++;pokeTime=simTime;faceFlashUntil=simTime+.7;playFace('Surprised');playBody('Hop',true,1.5);$('#poke-count').textContent=state.pokes+' poke'+(state.pokes===1?'':'s');say(choose(['boop!','hey!','okay, that tickles.','tiny paws. big feelings.','you found the poke button.']));burst(hit||new T.Vector3(0,3,1),7,'spark');chirp('poke');host.dataset.pokes=state.pokes}
function setupInput(){
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId};host.focus({preventScroll:true})});
 renderer.domElement.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1)});
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const d=down;down=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>7||performance.now()-d.t>500)return;
   const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);model.updateMatrixWorld(true);const visible=pickables.filter(o=>{let p=o;while(p){if(!p.visible)return false;p=p.parent}return true});const hit=raycaster.intersectObjects(visible,false)[0];if(hit){if(hit.object.userData.kind==='avatar')poke(hit.point);else if(hit.object.userData.kind==='ghost'){say('boo! …oh. hello, friend.');playBody('Hop');playFace('Surprised');faceFlashUntil=simTime+.8;burst(hit.point,6,'spark');chirp('poke')}else if(hit.object.userData.kind==='wheel'){worlds.pirate.userData.wheel.rotation.z+=Math.PI/4;say('steady as she goes, captain.');chirp('hello')}else{playDrum(hit.object.userData.instrument);burst(hit.point,4,'spark');say('a very good little hit.',1.5);kit.userData.hitAt=simTime;kit.userData.instrument=hit.object.userData.instrument}}});
 renderer.domElement.addEventListener('pointercancel',()=>down=null);
 host.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();poke()}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const rel=camera.position.clone().sub(orbit.target);rel.applyAxisAngle(up,e.key==='ArrowLeft'?-.20:.20);camera.position.copy(rel.add(orbit.target));orbit.update()}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();camera.zoom=T.MathUtils.clamp(camera.zoom*(e.key==='ArrowUp'?1.08:.92),.65,1.9);camera.updateProjectionMatrix()}});
}
function setupUI(){
 $('.world-grid').insertAdjacentHTML('beforeend','<button data-scene="mansion"><span class="world-art mansion"><i></i><b></b><em></em></span><span>A spooky mansion</span><strong>06</strong></button><button data-scene="pirate"><span class="world-art pirate"><i></i><b></b><em></em></span><span>The open ocean</span><strong>07</strong></button>');
 document.querySelectorAll('button[data-mood]').forEach(b=>b.onclick=()=>setMood(b.dataset.mood));document.querySelectorAll('button[data-scene]').forEach(b=>b.onclick=()=>setWorld(b.dataset.scene));
 $('#wave').onclick=()=>{playBody('Wave');say('oh, hello there.');chirp('hello')};$('#hop').onclick=()=>{playBody('Hop');say(state.world==='moon'?'wheeeee. low gravity.':'a little hop of faith.');chirp('poke')};
 $('#jam').onclick=()=>setJam(!state.jam);$('#prop').onchange=e=>{state.prop=e.target.value;updateProps();say(({none:'free paws. endless possibilities.',mug:'the tiniest coffee break.',balloon:'please don’t float away.',headphones:'in my own little world.'})[state.prop])};
 $('#sound').onclick=async()=>{state.sound=!state.sound;if(state.sound){await ensureAudio();chirp('hello')}else audioCtx?.suspend();$('#sound').setAttribute('aria-pressed',state.sound);$('#sound span').textContent=state.sound?'Sound on':'Sound off'};
 $('#pixel').onclick=()=>{state.pixel=!state.pixel;$('#pixel').setAttribute('aria-pressed',state.pixel);resize()};$('#orbit').onclick=()=>{orbit.autoRotate=!orbit.autoRotate;$('#orbit').setAttribute('aria-pressed',orbit.autoRotate)};$('#reset-camera').onclick=resetCamera;
 $('#reset-all').onclick=()=>{state.pokes=0;$('#poke-count').textContent='0 pokes';host.dataset.pokes='0';state.prop='none';$('#prop').value='none';setMood('curious');setWorld('playground');say('go on, give me a poke.');for(const p of particles)scene.remove(p.mesh);particles.length=0};
}
function step(dt){
 simTime+=dt;
 // Restore the previous unmodified mixer result. Three.js can skip writes for
 // unchanged tracks, so procedural offsets must never accumulate on that pose.
 for(const [name,base] of proceduralBase){const bone=bones[name];bone.position.copy(base.position);bone.quaternion.copy(base.quaternion);bone.scale.copy(base.scale)}
 mixer.update(dt);
 for(const [name,bone] of Object.entries(bones)){let base=proceduralBase.get(name);if(!base){base={position:new T.Vector3(),quaternion:new T.Quaternion(),scale:new T.Vector3()};proceduralBase.set(name,base)}base.position.copy(bone.position);base.quaternion.copy(bone.quaternion);base.scale.copy(bone.scale)}
 for(const name of Object.keys(moodMix))moodMix[name]+=(Number(state.mood===name)-moodMix[name])*.3;
 if(faceFlashUntil&&simTime>faceFlashUntil){faceFlashUntil=0;playFace(moodFace())}
 const sad=moodMix.sad,sleep=moodMix.sleepy,cur=moodMix.curious;
 bones.Body.rotation.x+=sad*.12+sleep*.07;bones.Body.rotation.y+=cur*(Math.round(Math.sin(simTime*.8)*2)/2)*.075;
 bones.Body.position.y-=sad*.15;
 bones.Face.position.y-=sad*.13+sleep*.08;
 const blinkPhase=simTime%5.4;
 facialRig.update(faceName,dt,faceFlashUntil===0&&state.mood!=='sleepy'&&blinkPhase>4.95&&blinkPhase<5.13);
 const isSleeping=state.mood==='sleepy'&&faceFlashUntil===0;
 sleepLetters.update(isSleeping,dt);host.dataset.sleepLetters=isSleeping?'3':'0';
 if(bodyName==='Idle'&&!state.jam){bones.Face.position.x+=pointer.x*.065*(1-sleep);bones.HandL.position.y+=sleep*-.12;bones.HandR.position.y+=sleep*-.12;
   if(state.world==='desk'&&(!state.codeMode||['writing','tool'].includes(state.codingPhase))){const tap=Math.floor(simTime*6)%2;bones.HandL.position.x+=1.4;bones.HandR.position.x-=1.4;bones.HandL.position.z+=1.3;bones.HandR.position.z+=1.3;bones.HandL.position.y-=.3+tap*.15;bones.HandR.position.y-=.3+(1-tap)*.15}
 }
 if(state.codeMode){
  const phase=state.codingPhase;
  if(['thinking','researching','reading','delegating'].includes(phase)){bones.Face.position.x+=Math.round(Math.sin(simTime*(phase==='reading'?2:.7))*2)*.025;bones.Body.rotation.z+=phase==='thinking'?.035:0}
  if(phase==='waiting'){bones.HandR.position.y+=.5;bones.HandR.rotation.z-=.2}
  if(phase==='thinking'){bones.HandR.position.x-=.4;bones.HandR.position.y+=.5;bones.HandR.position.z+=.3}
  if(['reading','researching'].includes(phase))bones.HandR.position.y+=.22;
  workProps.update(true,phase,simTime);
  workerTeam.step(dt,simTime);
 }
 if(state.world==='moon'&&bodyName==='Hop')bones.Root.position.y*=1.6;
 const since=simTime-pokeTime;actor.rotation.z=since<.7?Math.sin(since*24)*.045*(1-since/.7):0;actor.rotation.x=0;actor.position.y=0;kit.rotation.set(0,0,0);kit.position.y=0;
 if(state.world==='mansion'){const ghost=worlds.mansion.userData.ghost;ghost.position.y=2.1+Math.round(Math.sin(simTime*1.4)*3)*.08;ghost.rotation.y=Math.sin(simTime*.6)*.22;worlds.mansion.userData.windows[0].material.emissiveIntensity=.30+(Math.floor(simTime*4)%7===0?.15:0)}
 if(state.world==='pirate'){const data=worlds.pirate.userData,heave=Math.round(Math.sin(simTime*.7)*4)*.018,roll=Math.sin(simTime*.8)*.012,pitch=Math.sin(simTime*.6)*.007;data.ship.position.y=heave;data.ship.rotation.z=roll;data.ship.rotation.x=pitch;actor.position.y=heave;actor.rotation.z+=roll;actor.rotation.x=pitch;kit.position.y=heave;kit.rotation.z=roll;kit.rotation.x=pitch;const pos=data.sea.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,Math.sin(pos.getX(i)*.8+simTime*.8)*.06+Math.sin(pos.getZ(i)*.7-simTime*.6)*.045);pos.needsUpdate=true;data.sea.geometry.computeVertexNormals();data.foam.forEach((o,i)=>o.position.y=-.88+Math.sin(simTime+i)*.045)}
 if(state.jam){
   const isPlaying=bodyName==='Drums',f=isPlaying?Math.floor(activeBody.time*24+1e-5)%96:0,beat=Math.floor(f/2)%3;
   if(kitParts.cymbal){kitParts.cymbal.quaternion.copy(kitParts.cymbal.userData.restQuaternion);kitParts.cymbal.rotation.x+=(isPlaying?[.14,-.09,.045][beat]:0)}
   if(kitParts.kick)kitParts.kick.scale.copy(kitParts.kick.userData.restScale).multiplyScalar(isPlaying&&f%24<2?1.035:1);
   if(kitParts.snare)kitParts.snare.scale.copy(kitParts.snare.userData.restScale).multiplyScalar(isPlaying&&(f%24===12||[78,84,90].includes(f))?1.025:1);
   if(isPlaying){const slot=Math.floor(f/6);if(slot!==lastDrum){lastDrum=slot;playDrum('hat',slot%2?.38:.5);if(f%24<6)playDrum('kick');if(f%24>=12&&f%24<18||f>=78)playDrum('snare',f>=78?.5:.7);if(slot%4===0)burst(new T.Vector3(slot%8?-3.8:3.8,3.5,.1),2,'music')}}
   if(kit.userData.hitAt&&simTime-kit.userData.hitAt<.35&&kitParts.cymbal&&kit.userData.instrument==='hat')kitParts.cymbal.rotation.x+=Math.sin((simTime-kit.userData.hitAt)*30)*.15;
 }
 const butterfly=worlds.garden.userData.butterfly;if(state.world==='garden'){butterfly.position.y=3.15+Math.round(Math.sin(simTime*2)*3)*.08;butterfly.rotation.y=Math.round(Math.sin(simTime)*4)*.13}
 if(state.world==='moon')worlds.moon.userData.earth.rotation.y+=.001;
 if(state.prop==='balloon'&&props.balloon.visible)props.balloon.rotation.z=Math.round(Math.sin(simTime*1.5)*3)*.018;
 model.updateMatrixWorld(true);
 for(const collider of particleColliders){collider.mesh.computeBoundingBox();collider.bounds.copy(collider.mesh.boundingBox).applyMatrix4(collider.mesh.matrixWorld).expandByScalar(.16)}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.mesh.position.addScaledVector(p.velocity,dt);keepParticleOutsideAvatar(p);p.velocity.y-=p.gravity*dt;p.mesh.rotation.x+=p.spin*dt;p.mesh.rotation.z+=p.spin*.7*dt;if(p.life<.35)p.mesh.scale.setScalar(Math.max(.001,p.life/.35)*p.size);if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1)}}
 model.updateMatrixWorld(true);for(const mesh of pickables)if(mesh.isSkinnedMesh)mesh.computeBoundingSphere();
 host.dataset.poseTick=String(Math.round(simTime*12));host.dataset.bodyYaw=bones.Body.rotation.y.toFixed(4);host.dataset.eyeHeight=(facialRig.parts[1].scale.y/.8).toFixed(4);
}
function positionBubble(){if(!bones)return;headPoint.setFromMatrixPosition(bones.AttachHead.matrixWorld);headPoint.y+=.45;headPoint.project(camera);const x=(headPoint.x*.5+.5)*host.clientWidth,y=(-headPoint.y*.5+.5)*host.clientHeight;$('#bubble').style.left=T.MathUtils.clamp(x,100,host.clientWidth-100)+'px';$('#bubble').style.top=Math.max(70,y)+'px';$('#bubble').style.opacity=simTime<bubbleUntil?'1':'0'}
function burst(position,count,kind){const colors=kind==='confetti'?['#d78666','#d7b673','#8fa79b','#b8c5ac']:kind==='heart'?['#d88c78']:kind==='music'?['#e0c684','#9fbca9']:['#e4bc8b','#f2d6a2'];for(let i=0;i<count;i++){const size=kind==='confetti'?.11:kind==='heart'?.17:.12;const m=new T.Mesh(particleGeo,material(choose(colors)));m.position.copy(position).add(new T.Vector3((Math.random()-.5)*1.7,Math.random()*.5,(Math.random()-.5)*.6));m.scale.setScalar(size);scene.add(m);particles.push({mesh:m,size,life:kind==='music'?1.8:1.5,velocity:new T.Vector3((Math.random()-.5)*2,.8+Math.random()*2,(Math.random()-.5)*1.6),gravity:kind==='music'?-0.15:2.3,spin:Math.random()*4-2})}while(particles.length>100){scene.remove(particles.shift().mesh)}}
// Confetti and reaction particles slide or bounce off the head and claws.
function keepParticleOutsideAvatar(p){
 for(const {bounds} of particleColliders){
  const point=p.mesh.position;if(!bounds.containsPoint(point))continue;
  let distance=Infinity,axis='y',sign=1;
  for(const key of ['x','y','z']){const low=point[key]-bounds.min[key],high=bounds.max[key]-point[key];if(low<distance){distance=low;axis=key;sign=-1}if(high<distance){distance=high;axis=key;sign=1}}
  point[axis]=sign<0?bounds.min[axis]-.005:bounds.max[axis]+.005;
  p.velocity[axis]=sign*Math.max(.25,Math.abs(p.velocity[axis])*.45);
 }
}
async function ensureAudio(){if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();noiseBuffer=audioCtx.createBuffer(1,audioCtx.sampleRate*.3,audioCtx.sampleRate);const a=noiseBuffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}if(audioCtx.state!=='running')await audioCtx.resume()}
function playDrum(type,gain=.6){if(!state.sound||!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime,env=audioCtx.createGain();env.connect(audioCtx.destination);env.gain.setValueAtTime(.0001,t);
 if(type==='kick'){const osc=audioCtx.createOscillator();osc.frequency.setValueAtTime(135,t);osc.frequency.exponentialRampToValueAtTime(45,t+.13);env.gain.exponentialRampToValueAtTime(gain*.3,t+.003);env.gain.exponentialRampToValueAtTime(.0001,t+.24);osc.connect(env);osc.start(t);osc.stop(t+.25)}
 else{const src=audioCtx.createBufferSource();src.buffer=noiseBuffer;const filter=audioCtx.createBiquadFilter();filter.type='highpass';filter.frequency.value=type==='hat'?6500:1100;src.connect(filter);filter.connect(env);env.gain.exponentialRampToValueAtTime(gain*(type==='hat'?.11:.19),t+.002);env.gain.exponentialRampToValueAtTime(.0001,t+(type==='hat'?.055:.16));src.start(t);src.stop(t+.2)}
}
function chirp(kind){if(!state.sound||!audioCtx||audioCtx.state!=='running')return;const t=audioCtx.currentTime;const seq=kind==='sad'?[280,220]:kind==='happy'?[500,650,780]:kind==='poke'?[620,390]:[440,550];seq.forEach((hz,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),at=t+i*.075;osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.04,at+.007);gain.gain.exponentialRampToValueAtTime(.0001,at+.10);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(at);osc.stop(at+.12)})}
init().catch(e=>{console.error(e);$('#loading').classList.add('done');$('#error').hidden=false;host.dataset.error=e.message});
