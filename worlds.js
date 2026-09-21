import * as T from 'three';
const cache=new Map();
export function material(color,extra={}){const k=color+JSON.stringify(extra);if(!cache.has(k))cache.set(k,new T.MeshStandardMaterial({color,roughness:.9,metalness:0,...extra}));return cache.get(k)}
const boxGeo=new T.BoxGeometry(1,1,1);
export function box(parent,color,pos,size,extra={}){const m=new T.Mesh(boxGeo,material(color,extra));m.position.set(...pos);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
export function group(parent,pos=[0,0,0]){const g=new T.Group();g.position.set(...pos);parent.add(g);return g}
function cylinder(parent,color,pos,r,h,n=12){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,n),material(color));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function tree(parent,x,z,s=1){const g=group(parent,[x,0,z]);g.scale.setScalar(s);box(g,'#8b7254',[0,1.2,0],[.35,2.4,.35]);box(g,'#849977',[0,2.35,0],[1.8,1.1,1.5]);box(g,'#a4b18b',[-.2,3,0],[1.25,.55,1.2]);box(g,'#6f8b6a',[.75,2.05,.1],[.75,.8,1.1]);return g}
function flower(parent,x,z,c){box(parent,'#879175',[x,.3,z],[.09,.6,.09]);box(parent,c,[x,.65,z],[.35,.18,.18]);box(parent,c,[x,.65,z],[.18,.18,.35]);box(parent,'#e3c876',[x,.76,z],[.12,.12,.12])}
export function buildWorlds(scene){
 const worlds={};
 function world(name,color,floor){const g=group(scene);g.visible=false;g.userData={color,floor};worlds[name]=g;return g}
 let g=world('playground','#eee8dd','#d2bf9f');
 box(g,'#ceb89b',[0,-.32,0],[10.6,.55,7.7]);box(g,'#e5d7bf',[0,-.05,0],[10.8,.12,7.9]);
 const plant=group(g,[-4.5,0,-2.5]);box(plant,'#bf8768',[0,.45,0],[.8,.9,.8]);box(plant,'#83927a',[0,1.2,0],[.7,.7,.7]);box(plant,'#a4af8c',[.2,1.65,0],[.6,.4,.6]);
 box(g,'#a6b3b0',[4.3,.4,-2.1],[.85,.8,.85]);box(g,'#d5a778',[4.2,1.12,-2.1],[.6,.65,.6]);box(g,'#c98a70',[3.5,.25,-2.3],[.5,.5,.5]);
 for(let i=0;i<3;i++)box(g,'#baaa91',[3.7+i*.35,.015,2.8],[.18,.015,.18]);
 g=world('garden','#e4eadb','#a0ac86');box(g,'#929d77',[0,-.32,0],[11,.6,8]);box(g,'#b1bf96',[0,-.035,0],[11.1,.12,8.1]);
 tree(g,-4,-2.4,.85);tree(g,4,-2.8,1.05);tree(g,-5,1.2,.6);
 for(const [x,z] of [[-4,2.6],[-3.5,2.8],[4,1.9],[4.5,2.4],[-3,-3.1]])flower(g,x,z,x<0?'#dbac87':'#ece0ad');
 for(let i=0;i<3;i++)box(g,'#d5cfb1',[.4-i*.3,.025,2.2+i*.6],[1.1,.07,.45]);
 const butterfly=group(g,[4.55,3.15,1.45]);box(butterfly,'#916d52',[0,0,0],[.08,.3,.08]);box(butterfly,'#ddb17f',[-.19,0,0],[.3,.36,.1]);box(butterfly,'#ddb17f',[.19,0,0],[.3,.36,.1]);g.userData.butterfly=butterfly;
 g=world('desk','#e5e8e5','#b7c3b9');box(g,'#b7bdaa',[0,-.25,0],[11,.4,8]);box(g,'#dae0d2',[0,-.02,0],[11.1,.1,8.1]);
 box(g,'#987b5c',[0,1.37,2.3],[7.8,.22,1.9]);box(g,'#baa181',[0,1.5,2.3],[8,.12,2]);
 for(const x of [-3.4,3.4])for(const z of [1.55,3.05])box(g,'#807c6c',[x,.65,z],[.18,1.3,.18]);
 const monitor=group(g,[-2.7,2.25,2.15]);monitor.rotation.y=.15;box(monitor,'#425850',[0,0,0],[1.7,1.3,.18]);box(monitor,'#aecbc0',[0,0,.11],[1.45,1.05,.04],{emissive:'#afc9b3',emissiveIntensity:.08});box(monitor,'#566f61',[0,-.8,-.02],[.18,.6,.2]);box(monitor,'#566f61',[0,-.98,.05],[.9,.09,.5]);
 for(let i=0;i<4;i++)box(monitor,i%2?'#6f9b84':'#72858b',[-.22+(i%2)*.16,.32-i*.2,.14],[.7-(i%3)*.14,.06,.015]);
 box(g,'#7f9388',[.25,1.63,2.45],[2.6,.12,.7]);for(let row=0;row<2;row++)for(let x=0;x<8;x++)box(g,'#c6d1bf',[-.82+x*.29,1.702,2.24+row*.28],[.20,.05,.15]);
 box(g,'#c48a69',[3,1.67,2.5],[.8,.2,.9]);box(g,'#d6b989',[3.04,1.85,2.5],[.8,.16,.9]);
 const mug=group(g,[2,1.55,1.75]);box(mug,'#f1e2c8',[0,.25,0],[.45,.5,.45]);box(mug,'#826858',[0,.51,0],[.34,.015,.34]);box(mug,'#f1e2c8',[.3,.25,0],[.23,.1,.11]);box(mug,'#f1e2c8',[.41,.25,0],[.1,.3,.11]);
 g=world('moon','#202b42','#90979f');cylinder(g,'#707e90',[0,-.3,0],5.7,.6,16);cylinder(g,'#a9b0b5',[0,-.02,0],5.75,.12,16);
 for(const [x,z,r] of [[-4,1.5,.7],[3.8,-2,.5],[2.5,3,.6],[-3,-2.7,.45]])cylinder(g,'#8c959d',[x,.05,z],r,.025,10);
 box(g,'#bbc1c6',[4,1.65,-1],[.1,3.3,.1]);box(g,'#d99776',[4.7,2.8,-1],[1.4,.8,.08]);box(g,'#f2dfc3',[4.35,2.8,-.95],[.2,.2,.03]);
 const earth=new T.Mesh(new T.IcosahedronGeometry(1.3,1),material('#6d9b9c'));earth.position.set(-4.5,4.6,-4.2);g.add(earth);earth.add(new T.Mesh(new T.IcosahedronGeometry(1.31,0),new T.MeshBasicMaterial({color:'#a6b9a1',wireframe:true})));g.userData.earth=earth;
 for(let i=0;i<38;i++){let a=i*2.39996;box(g,'#e2d9b8',[Math.cos(a)*(8+i%4),3+(i%7),Math.sin(a)*(8+i%4)],[.045,.045,.045],{emissive:'#eee2b8',emissiveIntensity:.8})}
 g=world('stage','#302d38','#66515e');box(g,'#574859',[0,-.35,0],[11.5,.65,8.5]);box(g,'#9b7770',[0,-.035,0],[11.6,.12,8.6]);box(g,'#cf9f7d',[0,-.2,4.3],[11.6,.08,.05]);
 for(const x of [-4.65,4.65]){box(g,'#3c3b48',[x,1.05,-1.5],[1.2,2.1,1]);for(let i=0;i<2;i++){const sp=new T.Mesh(new T.CylinderGeometry(.38,.38,.045,12),material('#242d36'));sp.rotation.x=Math.PI/2;sp.position.set(x,.58+i*.92,-.96);g.add(sp)}box(g,'#bbb1a2',[x,1.84,-.96],[.18,.1,.015])}
 for(let i=0;i<6;i++){const x=-4+i*1.6;box(g,i%2?'#d79b7a':'#9ec4b1',[x,4.5,-3.5],[.17,.17,.17],{emissive:i%2?'#d79b7a':'#9ec4b1',emissiveIntensity:.7});if(i<5)box(g,'#7b706e',[x+.8,4.5,-3.5],[1.6,.025,.025])}
 g=world('mansion','#292d3b','#625d6b');box(g,'#68626d',[0,-.3,0],[12.3,.5,9.5]);box(g,'#8b828b',[0,-.035,0],[12.4,.1,9.6]);
 for(let i=0;i<5;i++)box(g,'#aaa092',[0,.035,1+i*.65],[1.8,.07,.5]);
 box(g,'#555766',[0,2.1,-3.65],[6.7,4.3,1.7]);box(g,'#403e50',[0,4.6,-3.65],[7.2,.55,2]);box(g,'#494356',[0,5,-3.65],[5.6,.45,2]);box(g,'#494356',[0,5.35,-3.65],[3.6,.35,2]);
 const windows=[];
 for(const x of [-3.4,3.4]){box(g,'#615b6a',[x,3.05,-3.7],[1.65,6.2,1.95]);for(let j=0;j<4;j++)box(g,'#3b3c50',[x,6.2+j*.26,-3.7],[2.0-j*.45,.28,2.2-j*.4]);}
 for(const x of [-3.4,-1.5,1.5,3.4])for(const y of [1.65,3.4]){box(g,'#2a303d',[x,y,-2.73],[.85,1.1,.1]);const w=box(g,'#e8ba65',[x,y,-2.65],[.62,.87,.04],{emissive:'#e8b359',emissiveIntensity:.35});windows.push(w);box(g,'#5b5360',[x,y,-2.60],[.075,.90,.04]);box(g,'#5b5360',[x,y,-2.59],[.65,.075,.04])}
 box(g,'#36313c',[0,1.2,-2.73],[1.25,2.4,.14]);box(g,'#ad9678',[.35,1.15,-2.64],[.12,.12,.10]);g.userData.windows=windows;
 for(const x of [-5,5]){box(g,'#414451',[x,.75,2.4],[.13,1.5,.13]);box(g,'#52515d',[x,1.5,2.4],[.40,.5,.40]);box(g,'#e3b67e',[x,1.5,2.65],[.22,.3,.03],{emissive:'#e3a95e',emissiveIntensity:.4})}
 const ghost=group(g,[4.15,2.1,.4]);box(ghost,'#d5dfd4',[0,0,0],[.9,.9,.65],{emissive:'#d5dfd4',emissiveIntensity:.12});box(ghost,'#d5dfd4',[0,.5,0],[.65,.25,.6]);for(const x of [-.30,0,.30])box(ghost,'#d5dfd4',[x,-.55,0],[.18,.3,.6]);for(const x of [-.18,.18])box(ghost,'#354954',[x,.1,.34],[.13,.19,.025]);box(ghost,'#d5dfd4',[-.6,-.1,0],[.35,.25,.5]);box(ghost,'#d5dfd4',[.6,-.1,0],[.35,.25,.5]);ghost.traverse(o=>{if(o.isMesh)o.userData.kind='ghost'});g.userData.ghost=ghost;
 g=world('pirate','#b6d4d3','#568e9a');
 const seaGeo=new T.PlaneGeometry(65,65,32,32);seaGeo.rotateX(-Math.PI/2);const sea=new T.Mesh(seaGeo,material('#659aa5',{roughness:.52,metalness:.05}));sea.position.y=-1.05;sea.receiveShadow=true;g.add(sea);g.userData.sea=sea;
 const ship=group(g);g.userData.ship=ship;box(ship,'#735a42',[0,-.6,-.6],[9.3,1.15,9]);box(ship,'#5f4e3e',[0,-1.22,-.6],[7.7,.5,8.5]);box(ship,'#b7986b',[0,-.04,-.6],[9.45,.12,9.1]);
 for(let i=0;i<4;i++){box(ship,'#795d40',[0,-.55,4.05+i*.6],[7.9-i*1.8,1.0,.62]);box(ship,'#b7986b',[0,-.04,4.05+i*.6],[7.95-i*1.8,.12,.62]);}
 for(let i=0;i<14;i++)box(ship,'#a68a65',[-4.3+i*.66,.027,-.55],[.028,.018,8.8]);
 for(const x of [-4.5,4.5]){box(ship,'#705744',[x,.85,-.6],[.14,.15,8.9]);for(let z=-4.7;z<3.6;z+=1.3)box(ship,'#856749',[x,.4,z],[.14,.85,.14]);}
 box(ship,'#72583d',[0,3.4,-3],[.25,6.8,.25]);box(ship,'#80694b',[0,5.9,-3],[5.2,.18,.18]);
 box(ship,'#e8dcc1',[0,4.65,-2.94],[4.75,2.3,.12]);box(ship,'#e0d1b0',[0,3.35,-2.94],[4.15,.35,.12]);
 box(ship,'#4a5155',[0,4.8,-2.86],[.75,.62,.025]);box(ship,'#e8dcc1',[-.20,4.86,-2.84],[.15,.17,.02]);box(ship,'#e8dcc1',[.20,4.86,-2.84],[.15,.17,.02]);for(const rot of [-.6,.6]){const cross=box(ship,'#596065',[0,4.23,-2.85],[1.05,.10,.025]);cross.rotation.z=rot}
 box(ship,'#454d50',[.65,6.65,-3],[1.35,.65,.05]);box(ship,'#e8c99f',[.6,6.65,-2.96],[.22,.22,.025]);
 for(const x of [-3.4,3.4]){cylinder(ship,'#8e7150',[x,.65,-3.4],.48,1.3,8);cylinder(ship,'#545b5c',[x,.3,-3.4],.49,.12,8);cylinder(ship,'#545b5c',[x,1.0,-3.4],.49,.12,8)}
 const wheel=group(ship,[3,1.55,-2.15]);const rim=new T.Mesh(new T.TorusGeometry(.47,.065,4,8),material('#6e573d'));wheel.add(rim);for(let i=0;i<4;i++){const spoke=box(wheel,'#795c3d',[0,0,0],[1.22,.10,.11]);spoke.rotation.z=i*Math.PI/4;}cylinder(ship,'#6e573d',[3,.67,-2.15],.13,1.3,6);wheel.traverse(o=>{if(o.isMesh)o.userData.kind='wheel'});g.userData.wheel=wheel;
 const foam=[];for(let i=0;i<28;i++){const a=i*2.4,r=7+i%5;const wave=box(g,'#c8e1d9',[Math.cos(a)*r,-.9,Math.sin(a)*r],[.6+(i%3)*.25,.03,.07]);foam.push(wave)}g.userData.foam=foam;
 return worlds;
}
export function heldProps(bones){
 const props={};
 let g=group(bones.GripR);g.visible=false;props.mug=g;box(g,'#eee0c1',[0,.24,0],[.53,.60,.53]);box(g,'#634938',[0,.551,0],[.40,.01,.40]);box(g,'#eee0c1',[.36,.28,0],[.23,.12,.12]);box(g,'#eee0c1',[.47,.28,0],[.12,.35,.12]);
 g=group(bones.GripL);g.visible=false;props.balloon=g;box(g,'#f0e2c9',[0,.9,0],[.035,1.8,.035]);box(g,'#c77461',[0,2.15,0],[.9,.95,.75]);box(g,'#e49879',[-.2,2.35,.39],[.12,.20,.025]);box(g,'#bf775f',[0,1.65,0],[.16,.12,.16]);
 g=group(bones.AttachHead);g.visible=false;props.headphones=g;box(g,'#576d70',[0,.15,0],[4.65,.23,.65]);for(const x of [-2.4,2.4]){box(g,'#576d70',[x,-.4,0],[.25,1.15,.65]);box(g,'#809899',[x,-.94,0],[.55,.9,1.35]);box(g,'#c1c7b3',[x+(x<0?-.29:.29),-.94,0],[.06,.45,.65])}
 const sticks=[];for(const side of ['L','R']){const stick=group(bones['Grip'+side]);box(stick,'#f4e9ce',[0,.7,0],[.14,1.6,.14]);box(stick,'#f4e9ce',[0,1.52,0],[.2,.18,.2]);stick.visible=false;sticks.push(stick)}
 return{props,sticks};
}
