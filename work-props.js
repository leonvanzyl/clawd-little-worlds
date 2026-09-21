import {box,group} from './worlds.js';

export function createWorkProps(bones){
 const book=group(bones.GripR);book.rotation.set(-.3,0,.12);
 box(book,'#6e8f89',[0,.22,.19],[.95,.70,.12]);
 for(const sign of [-1,1]){box(book,'#eee2be',[sign*.23,.25,.27],[.42,.58,.08]);for(let i=0;i<3;i++)box(book,'#a39273',[sign*.23,.39-i*.14,.32],[.27,.035,.018])}
 const glass=group(bones.GripR);glass.rotation.z=-.25;
 box(glass,'#8e7658',[0,.15,.1],[.11,.55,.11]);
 for(const [x,y] of [[-.23,.63],[.23,.63],[-.23,1],[.23,1],[-.34,.81],[.34,.81],[0,.52],[0,1.11]])box(glass,'#799391',[x,y,.1],[.22,.17,.13]);
 const dots=group(bones.AttachHead);for(let i=0;i<3;i++)box(dots,'#7e948d',[-.35+i*.35,.62,1],[.15,.15,.15]);
 const question=group(bones.AttachHead);['111','001','011','010','000','010'].forEach((row,y)=>[...row].forEach((bit,x)=>{if(bit==='1')box(question,'#bd9563',[(x-1)*.15,.98-y*.15,1],[.15,.15,.12])}));
 const hourglass=group(bones.AttachHead);['11111','10001','01010','00100','01010','10001','11111'].forEach((row,y)=>[...row].forEach((bit,x)=>{if(bit==='1')box(hourglass,'#939eac',[(x-2)*.11,1-y*.11,1],[.11,.11,.1])}));
 function update(active,phase,time){book.visible=active&&phase==='reading';glass.visible=active&&phase==='researching';dots.visible=active&&['thinking','delegating'].includes(phase);question.visible=active&&phase==='waiting';hourglass.visible=active&&phase==='waiting-tool';dots.children.forEach((o,i)=>o.scale.setScalar((Math.floor(time*3)%3===i)?.20:.13));hourglass.rotation.z=Math.floor(time*.7)%2?.12:-.12}
 update(false,'idle',0);return{update};
}
