import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createStudio} from '../server.mjs';

test('studio streams real provider events, handles questions, approvals and helpers, and isolates preview/API',async()=>{
 const root=path.resolve('.test-data'),directory=path.join(root,randomUUID());await fs.mkdir(directory,{recursive:true});let seenOptions;
 function fakeQuery({prompt,options}){
  seenOptions=options;let stopped=false,stopHelper;
  const it=(async function*(){
   let text;for await(const message of prompt){text=message.message.content;break}
   yield{type:'system',subtype:'init',session_id:randomUUID(),model:'claude-opus-test'};
   yield{type:'stream_event',event:{type:'message_start'}};
   if(text==='question'){
    const reply=await options.canUseTool('AskUserQuestion',{questions:[{question:'Which palette?',options:[{label:'Green',description:'Fresh'}]}]},{signal:options.abortController.signal});
    assert.equal(reply.updatedInput.answers['Which palette?'],'Green');
   }
   if(text==='approval'||text==='cancel-approval'){
    const reply=await options.canUseTool('WebFetch',{url:'https://example.com',prompt:'Read the title'},{signal:options.abortController.signal});assert.equal(reply.behavior,'deny');
    if(text==='cancel-approval')stopped=true;
   }
   if(text==='helper'){
    yield{type:'assistant',message:{content:[{type:'tool_use',id:'helper-1',name:'Agent',input:{name:'Researcher',description:'Explore the files'}}]}};
    yield{type:'system',subtype:'task_started',task_id:'task-1',tool_use_id:'helper-1',description:'Explore the files',subagent_type:'researcher'};
    yield{type:'system',subtype:'task_updated',task_id:'task-1',description:'Still exploring'};
    await new Promise(resolve=>stopHelper=resolve);
    yield{type:'system',subtype:'task_notification',task_id:'task-1',status:'stopped'};
    yield{type:'system',subtype:'task_updated',task_id:'task-1',description:'Late progress should not resurrect a finished helper'};
   }
   if(text==='stop')await new Promise(resolve=>options.abortController.signal.addEventListener('abort',()=>{stopped=true;resolve()},{once:true}));
   if(!stopped){yield{type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'Building a real page.'}}};await fs.writeFile(path.join(options.cwd,'index.html'),'<h1>Live test website</h1><button onclick="this.textContent=\'Clicked\'">Try me</button>');yield{type:'assistant',message:{content:[{type:'tool_use',id:'write-1',name:'Write',input:{file_path:path.join(options.cwd,'index.html')}}]}};yield{type:'result',is_error:false,result:'Done',duration_ms:20}}
  })();
  it.close=()=>{};it.stopTask=async id=>{assert.equal(id,'task-1');stopHelper()};return it;
 }
 const app=await createStudio({port:0,dataDir:directory,agentQuery:fakeQuery,authProvider:async()=>({available:true,loggedIn:true,subscription:'max',version:'test'})});
 try{
  const read=async()=>{const r=await fetch(app.origin+'/api/status');assert.equal(r.status,200);return r.json()},status=await read();
  const post=async(url,body,headers={})=>fetch(app.origin+url,{method:'POST',headers:{'Content-Type':'application/json','X-Studio-Token':status.csrf,...headers},body:JSON.stringify(body)});
  assert.equal((await post('/api/projects',{}, {'X-Studio-Token':'wrong'})).status,403);
  assert.equal((await fetch(app.origin+'/api/status',{headers:{Origin:'https://unrelated.example'}})).status,403);
  const project=await(await post('/api/projects',{})).json();assert.match(project.previewUrl,/^http:\/\/127\.0\.0\.1:\d+\/$/);
  const until=async predicate=>{for(let i=0;i<100;i++){const p=(await read()).project;if(predicate(p))return p;await new Promise(r=>setTimeout(r,25))}throw Error('Timed out waiting for event')};
  let r=await post('/api/run',{projectId:project.id,prompt:'question'});assert.equal(r.status,202);
  let p=await until(p=>p.approvals.length>0),approval=p.approvals[0];assert.equal(approval.kind,'question');
  assert.equal((await post('/api/run',{projectId:project.id,prompt:'concurrent'})).status,409);
  assert.equal((await post('/api/respond',{projectId:project.id,requestId:approval.id,allow:true,answers:{}})).status,400);
  assert.equal((await read()).project.approvals.length,1,'Invalid answer must keep the question pending');
  assert.equal((await post('/api/respond',{projectId:project.id,requestId:approval.id,allow:true,answers:{'Which palette?':'Green'}})).status,200);
  p=await until(p=>!p.busy);assert.equal(p.status,'complete');assert.equal(seenOptions.model,'opus');assert.equal(seenOptions.effort,'high');assert.equal(seenOptions.extraArgs.restricted,null);assert(!seenOptions.tools.includes('Bash'));
  assert.match(await(await fetch(project.previewUrl)).text(),/Live test website/);
  assert.equal((await fetch(project.previewUrl+'.env')).status,404);assert.equal((await fetch(project.previewUrl+'%2e%2e%2fserver.mjs')).status,404);
  assert.equal((await fetch(app.origin+'/api/status',{headers:{Origin:new URL(project.previewUrl).origin}})).status,403);
  await post('/api/run',{projectId:project.id,prompt:'approval'});p=await until(p=>p.approvals.length>0);await post('/api/respond',{projectId:project.id,requestId:p.approvals[0].id,allow:false});await until(p=>!p.busy);
  await post('/api/run',{projectId:project.id,prompt:'helper'});p=await until(p=>p.agents.some(a=>a.taskId));assert.equal(p.agents.length,1,'Task IDs and tool IDs must identify the same helper');assert.equal(p.agents[0].status,'running');await post('/api/agent/stop',{projectId:project.id,agentId:'helper-1'});p=await until(p=>!p.busy);assert.equal(p.agents.length,1);assert.equal(p.agents[0].status,'stopped');
  await post('/api/run',{projectId:project.id,prompt:'cancel-approval'});p=await until(p=>p.approvals.length>0);const cancelledId=p.approvals[0].id;await post('/api/stop',{projectId:project.id});p=await until(p=>!p.busy);assert.equal(p.status,'stopped');assert.equal(p.approvals.length,0);assert(p.events.some(e=>e.type==='approval-resolved'&&e.id===cancelledId),'Stopping must remove the pending card in the browser');
  const key='sk-ant-test-'+randomUUID();await post('/api/key',{key});const auth=await read();assert.equal(auth.mode,'api-key');assert(!JSON.stringify(auth).includes(key));assert(!(await fs.readFile(path.join(directory,'studio.json'),'utf8')).includes(key));
  await post('/api/run',{projectId:project.id,prompt:'stop'});assert.equal(seenOptions.env.ANTHROPIC_API_KEY,key);await post('/api/stop',{projectId:project.id});p=await until(p=>!p.busy);assert.equal(p.status,'stopped');
  const ids=p.events.map(e=>e.seq);assert(ids.every((id,i)=>i===0||id>ids[i-1]),'Stream sequence must remain numeric and monotonic despite task IDs');
  const controller=new AbortController(),events=await fetch(app.origin+'/api/events?project='+project.id+'&after=0',{signal:controller.signal});const {value}=await events.body.getReader().read();assert.match(new TextDecoder().decode(value),/data: /);controller.abort();
 }finally{await app.close();assert(path.resolve(directory).startsWith(root+path.sep));await fs.rm(directory,{recursive:true,force:true})}
});
