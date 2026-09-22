import {createThemePicker} from './theme.js';
import {renderMarkdown} from './chat-markdown.js';
const $=s=>document.querySelector(s);
const icon='<svg viewBox="0 0 32 24" aria-hidden="true"><path fill="currentColor" d="M4 2h24v8h4v4h-4v4h-2v4h-2v-4h-2v4h-2v-4H12v4h-2v-4H8v4H6v-4H4v-4H0v-4h4z"/><path fill="#faf5eb" d="M8 6h2v4H8zm14 0h2v4h-2z"/></svg>';
export function initCodeMode({onMode,onActivity,onAgents}){
 const localStudio=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
 let connected=false,csrf='',project=null,stream=null,lastEvent=0,busy=false,active=false,auth=null,deltaNode=null,reloadTimer,phase='idle',agents=new Map();
 $('.brand').insertAdjacentHTML('afterend','<nav class="mode-switch" aria-label="Mode"><button id="play-mode" aria-pressed="true">Playground</button><button id="code-mode" aria-pressed="false"><span>⌘</span> Claude Code</button></nav>');
 document.body.insertAdjacentHTML('beforeend',`<section class="code-studio" aria-label="Claude Code studio" hidden>
 <div class="browser-window"><div id="preview-empty" aria-label="Your website will appear here"></div><iframe id="site-preview" title="Live website preview" sandbox="allow-scripts allow-forms allow-same-origin" referrerpolicy="no-referrer" hidden></iframe></div>
 <nav class="studio-navigation" aria-label="Studio navigation"><button id="exit-code" title="Back to the playground"><span aria-hidden="true">←</span> Playground</button></nav>
 <div class="studio-tools"><button id="return-to-clawd" hidden>Back to Clawd</button><button id="studio-options" aria-expanded="false" aria-controls="studio-menu" aria-label="Studio options" title="Studio options">···</button><div id="studio-menu" hidden><div class="studio-menu-heading">Claude Code <small>Opus · High</small></div><button id="explore-preview">Explore website</button><button id="new-website">New website</button><button id="reload-preview">Reload preview</button><a id="open-preview" target="_blank" rel="noopener noreferrer">Open website in a new tab ↗</a><button id="connection">Connection <i id="connection-dot"></i></button><div class="studio-menu-info"><span id="dev-status">Server offline</span><span id="preview-address">Your next website</span><span id="prompt-status">Your Claude subscription</span></div></div></div>
 <div class="clawd-work-status"><span class="work-dot"></span><span id="work-status">Ready when you are</span><span id="work-file"></span></div>
 <aside class="work-dock" aria-label="Talk to Clawd">
 <div id="activity-content" hidden><div class="activity-heading"><span>Conversation</span><button id="close-activity" aria-label="Close conversation">×</button></div><div id="agent-team" aria-label="Clawd helpers"></div><div class="activity-log" id="activity-log" role="log" aria-label="Claude activity" aria-live="polite"><p class="empty-activity">Clawd is ready for an idea.</p></div><div id="approval-list" aria-live="polite"></div></div>
 <form id="code-prompt-form"><button type="button" id="toggle-activity" aria-label="Show conversation" aria-expanded="false" aria-controls="activity-content" title="Conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3V11.5A7.5 7.5 0 0 1 9.5 4h3A7.5 7.5 0 0 1 20 11.5Z"/><path d="M7 10h8m-8 4h5"/></svg></button><label for="code-prompt" class="sr-only">Ask Claude to build or change your website</label><textarea id="code-prompt" rows="1" maxlength="20000" placeholder="What shall we make?"></textarea><div class="prompt-actions"><button type="button" id="stop-code" aria-label="Stop Claude" title="Stop Claude" hidden>■</button><button type="submit" id="send-code" aria-label="Send prompt" title="Send prompt" disabled>↑</button></div></form><p id="studio-error" role="alert" hidden></p>
 </aside><dialog id="connection-dialog"><form method="dialog"><button class="dialog-close" aria-label="Close connection settings">×</button></form><h2>Connect Claude</h2><p id="connection-status">Checking your local CLI…</p><p class="connection-hint">Uses Claude Code on this computer. API keys stay in server memory until you disconnect or close the server.</p><label for="api-key">Anthropic API key <span>optional fallback</span></label><input id="api-key" type="password" autocomplete="off" placeholder="sk-ant-…"><div class="connection-actions"><button id="use-subscription">Use subscription</button><button id="save-key">Use API key</button></div><button id="recheck-connection">Check connection again</button><p id="connection-error" role="alert"></p></dialog>
 </section>`);
 createThemePicker($('#studio-menu'));
 new ResizeObserver(entries=>{const height=entries[0].borderBoxSize?.[0]?.blockSize||$('#code-prompt-form').offsetHeight;if(height)document.body.style.setProperty('--composer-height',Math.ceil(height)+'px')}).observe($('#code-prompt-form'));
 function showConversation(value){$('#activity-content').hidden=!value;$('#toggle-activity').setAttribute('aria-expanded',value);$('#toggle-activity').setAttribute('aria-label',value?'Hide conversation':'Show conversation');if(value)$('#toggle-activity').classList.remove('unread')}
 function showOptions(value){$('#studio-menu').hidden=!value;$('#studio-options').setAttribute('aria-expanded',value)}
 function explore(value){document.body.classList.toggle('preview-only',value);$('#return-to-clawd').hidden=!value;showOptions(false)}
 function error(message){$('#studio-error').textContent=message;$('#studio-error').hidden=!message}
 async function request(url,data){const res=await fetch(url,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json','X-Studio-Token':csrf},body:data===undefined?undefined:JSON.stringify(data)});const type=res.headers.get('content-type')||'';if(!type.includes('application/json'))throw new Error('Start the local studio with npm start to use Claude Code mode.');const result=await res.json();if(!res.ok)throw new Error(result.error||'The local studio could not complete that request.');return result}
 function setBusy(value){busy=value;$('#send-code').disabled=value||!connected;$('#send-code').hidden=value;$('#new-website').disabled=value;$('#stop-code').hidden=!value;$('#code-prompt').placeholder=value?'Working on it…':'What shall we make?'}
 function setPhase(next,label){phase=next;$('#work-status').textContent=label;$('.clawd-work-status').dataset.phase=next;if(active)onActivity(next)}
 function log(kind,text){const log=$('#activity-log'),nearBottom=log.scrollTop+log.clientHeight>=log.scrollHeight-50;log.querySelector('.empty-activity')?.remove();const line=document.createElement('div');line.className='activity-item '+kind;line.textContent=text;log.append(line);while(log.children.length>120)log.firstElementChild.remove();if(nearBottom)log.scrollTop=log.scrollHeight;return line}
 const markdownSources=new WeakMap(),pendingMarkdown=new Set();let markdownFrame=0;
 function markdown(node,text,append=false){markdownSources.set(node,(append?markdownSources.get(node)||'':'')+text);pendingMarkdown.add(node);if(markdownFrame)return;markdownFrame=requestAnimationFrame(()=>{const container=$('#activity-log'),nearBottom=container.scrollTop+container.clientHeight>=container.scrollHeight-50;for(const item of pendingMarkdown)if(item.isConnected)renderMarkdown(item,markdownSources.get(item));pendingMarkdown.clear();markdownFrame=0;if(nearBottom)container.scrollTop=container.scrollHeight})}
 function preview(refresh=false){if(!project?.previewUrl)return;const frame=$('#site-preview');if(refresh||frame.getAttribute('src')?.split('?')[0]!==project.previewUrl){frame.src=project.previewUrl+'?revision='+project.revision}frame.hidden=false;$('#preview-empty').hidden=true;$('#preview-address').textContent=project.previewUrl;$('#open-preview').href=project.previewUrl;$('#dev-status').textContent='Dev server running';$('#dev-status').classList.add('running')}
 function renderAgents(){const team=$('#agent-team');team.replaceChildren();for(const agent of agents.values()){
  const card=document.createElement('div');card.className='agent-card';card.dataset.status=agent.status;const mascot=document.createElement('span');mascot.className='mini-clawd';mascot.innerHTML=icon;const text=document.createElement('span'),name=document.createElement('b'),description=document.createElement('small');name.textContent=agent.name||'Helper';description.textContent=agent.status==='completed'?'Finished':agent.status==='failed'?'Needs attention':agent.status==='stopped'?'Stopped':agent.description||agent.phase||'Working';text.append(name,description);card.append(mascot,text);
  if(agent.status==='running'&&agent.taskId){const stop=document.createElement('button');stop.textContent='■';stop.title='Stop this helper';stop.onclick=async()=>{try{await request('/api/agent/stop',{projectId:project.id,agentId:agent.id})}catch(e){error(e.message)}};card.append(stop)}team.append(card);
 }onAgents([...agents.values()])}
 function approval(view){if(document.getElementById('approval-'+view.id))return;const card=document.createElement('form');card.className='approval-card';card.id='approval-'+view.id;const heading=document.createElement('h3');heading.textContent=view.kind==='question'?'Clawd has a question':view.description;card.append(heading);const answers=[];
  if(view.kind==='question')for(const q of view.questions){const label=document.createElement('label');label.textContent=q.question;card.append(label);if(q.options?.length){const options=document.createElement('div');options.className='answer-options';for(const option of q.options){const button=document.createElement('button');button.type='button';button.textContent=option.label;button.title=option.description||'';button.onclick=()=>{input.value=option.label};options.append(button)}card.append(options)}const input=document.createElement('input');input.type='text';input.required=true;input.placeholder=q.multiSelect?'Choose or type one or more answers':'Your answer';card.append(input);answers.push({question:q.question,input})}
  else {const details=document.createElement('p');details.className='approval-description';let description=view.details;try{const input=JSON.parse(view.details);description=input.prompt||description}catch{}details.textContent=description;card.append(details)}
  const actions=document.createElement('div');actions.className='approval-actions';const deny=document.createElement('button');deny.type='button';deny.textContent=view.kind==='question'?'Skip':'Deny';const allow=document.createElement('button');allow.type='submit';allow.textContent=view.kind==='question'?'Send answer':'Allow once';actions.append(deny,allow);card.append(actions);
  async function respond(yes){try{allow.disabled=true;deny.disabled=true;await request('/api/respond',{projectId:project.id,requestId:view.id,allow:yes,answers:Object.fromEntries(answers.map(a=>[a.question,a.input.value]))});card.remove()}catch(e){error(e.message);allow.disabled=false;deny.disabled=false}}
  deny.onclick=()=>respond(false);card.onsubmit=e=>{e.preventDefault();respond(true)};$('#approval-list').append(card);explore(false);showConversation(true);
 }
 function event(e){if(e.seq){if(e.seq<=lastEvent)return;lastEvent=e.seq}switch(e.type){
  case 'prompt':deltaNode=null;agents.clear();renderAgents();log('user',e.text);break;
  case 'delta':if(!deltaNode)deltaNode=log('assistant','');markdown(deltaNode,e.text,true);if($('#activity-content').hidden)$('#toggle-activity').classList.add('unread');break;
  case 'message':deltaNode=null;markdown(log('assistant',''),e.text);if($('#activity-content').hidden)$('#toggle-activity').classList.add('unread');break;
  case 'tool':deltaNode=null;log('tool',`${e.agent?'Helper · ':''}${e.label}${e.file?' · '+e.file:e.tool?' · '+e.tool:''}`);if(!e.agent)$('#work-file').textContent=e.file||'';break;
  case 'file':project.revision=e.revision;clearTimeout(reloadTimer);reloadTimer=setTimeout(()=>preview(true),500);break;
  case 'state':setBusy(['running','waiting'].includes(e.status));setPhase(e.phase||(['complete','error'].includes(e.status)?e.status:'idle'),e.label||e.status);if(!busy)$('#work-file').textContent='';break;
  case 'model':$('#prompt-status').textContent=(auth?.mode==='api-key'?'API key':'Claude subscription')+' · Opus / high';$('.work-dock').dataset.model=e.model;break;
  case 'complete':deltaNode=null;preview(true);break;
  case 'notice':log('notice',e.text);break;
  case 'error':log('error',e.text);error(e.text);break;
  case 'approval':approval(e);break;
  case 'approval-resolved':document.getElementById('approval-'+e.id)?.remove();break;
  case 'agent':agents.set(e.id,{...agents.get(e.id),...e});renderAgents();break;
  case 'agent-activity':if(agents.has(e.id)){Object.assign(agents.get(e.id),{phase:e.phase,description:e.label});renderAgents()}break;
 }}
 function loadProject(p){const wasOpen=!$('#activity-content').hidden;stream?.close();project=p;lastEvent=0;agents.clear();deltaNode=null;$('#activity-log').replaceChildren();$('#approval-list').replaceChildren();for(const e of p.events||[])event(e);$('#approval-list').replaceChildren();for(const a of p.approvals||[])approval(a);showConversation(wasOpen||p.approvals?.length>0);agents=new Map((p.agents||[]).map(a=>[a.id,a]));renderAgents();setBusy(p.busy);if(!p.busy)setPhase(p.status==='complete'?'complete':'idle',p.status==='complete'?'Ready for the next change':'Ready when you are');preview();stream=new EventSource('/api/events?project='+p.id+'&after='+lastEvent);stream.onmessage=message=>{try{event(JSON.parse(message.data))}catch(e){console.error('Studio event:',e)}};stream.onerror=()=>{if(active)$('#dev-status').textContent='Reconnecting…'};stream.onopen=()=>{if(project)$('#dev-status').textContent='Dev server running'};}
 async function connect(refresh=false){
  if(!localStudio){
   const message='Claude Code runs on your computer. Start the local studio with npm start, then open the local address it shows to use your Claude subscription or API key.';
   connected=false;setBusy(false);setPhase('idle','Local studio required');error(message);$('#connection-status').textContent=message;
   $('#code-prompt').disabled=true;$('#code-prompt').placeholder='Open the local studio to chat';$('#new-website').disabled=true;
   for(const id of ['api-key','save-key','use-subscription','recheck-connection'])$('#'+id).disabled=true;
   $('#dev-status').textContent='Local studio required';$('#prompt-status').textContent='Playground hosted online';return false;
  }
  try{auth=await request('/api/status'+(refresh?'?refresh=1':''));csrf=auth.csrf;connected=auth.available&&(auth.loggedIn||auth.apiKeyConfigured);$('#connection-dot').classList.toggle('connected',connected);$('#prompt-status').textContent=auth.mode==='api-key'?'Anthropic API key':auth.loggedIn?'Claude '+(auth.subscription||'subscription'):'Connect Claude to begin';$('#connection-status').textContent=!auth.available?'Claude Code CLI was not found on this computer.':auth.mode==='api-key'?'Using an Anthropic API key.':auth.loggedIn?`Connected to your Claude ${auth.subscription||'subscription'} account.`:'Run claude auth login in your terminal, or enter an Anthropic API key below.';$('#save-key').disabled=!auth.available;setBusy(busy);if(auth.project&&(!project||auth.project.id!==project.id))loadProject(auth.project);error('');return true}catch(e){connected=false;setBusy(false);$('#connection-status').textContent=e.message;error(e.message);return false}
 }
 async function setMode(value){
  active=value;explore(false);document.body.classList.toggle('code-mode',value);$('.code-studio').hidden=!value;
  (value?$('.code-studio'):$('.playground')).prepend($('#stage'));
  $('#play-mode').setAttribute('aria-pressed',!value);$('#code-mode').setAttribute('aria-pressed',value);onMode(value);
  if(value){
   $('#exit-code').focus({preventScroll:true});onActivity(phase);onAgents([...agents.values()]);await connect();
   if(auth?.available&&!project){try{loadProject(await request('/api/projects',{}))}catch(e){error(e.message)}}
  }else $('#code-mode').focus({preventScroll:true});
 }
 $('#play-mode').onclick=()=>setMode(false);$('#code-mode').onclick=()=>setMode(true);
 $('#exit-code').onclick=()=>setMode(false);
 $('#toggle-activity').onclick=()=>showConversation($('#activity-content').hidden);
 $('#close-activity').onclick=()=>{showConversation(false);$('#toggle-activity').focus()};
 $('#studio-options').onclick=()=>showOptions($('#studio-menu').hidden);
 $('#explore-preview').onclick=()=>explore(true);$('#return-to-clawd').onclick=()=>explore(false);
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.studio-tools'))showOptions(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#connection-dialog').open){showOptions(false);showConversation(false);explore(false)}});
 $('#reload-preview').onclick=()=>{preview(true);showOptions(false)};$('#connection').onclick=()=>{showOptions(false);$('#connection-dialog').showModal();connect(true)};
 $('#connection-dialog').addEventListener('close',()=>{$('#api-key').value=''});
 $('#recheck-connection').onclick=()=>connect(true);
 $('#save-key').onclick=async()=>{try{await request('/api/key',{key:$('#api-key').value.trim()});$('#api-key').value='';$('#connection-error').textContent='';await connect(true);$('#connection-dialog').close()}catch(e){$('#connection-error').textContent=e.message}};
 $('#use-subscription').onclick=async()=>{try{await request('/api/key',{key:''});$('#api-key').value='';await connect(true);$('#connection-dialog').close()}catch(e){$('#connection-error').textContent=e.message}};
 $('#new-website').onclick=async()=>{try{loadProject(await request('/api/projects',{}));error('');showOptions(false);showConversation(false)}catch(e){error(e.message)}};
 $('#stop-code').onclick=async()=>{try{await request('/api/stop',{projectId:project?.id})}catch(e){error(e.message)}};
 $('#code-prompt-form').onsubmit=async e=>{e.preventDefault();const prompt=$('#code-prompt').value.trim();if(!prompt||busy)return;try{error('');if(!project)loadProject(await request('/api/projects',{}));setBusy(true);await request('/api/run',{projectId:project.id,prompt});$('#code-prompt').value='';$('#code-prompt').style.height=''}catch(e){setBusy(false);error(e.message)}};
 $('#code-prompt').oninput=()=>{const input=$('#code-prompt');input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px'};
 $('#code-prompt').onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')$('#code-prompt-form').requestSubmit()};
 return{isActive:()=>active};
}
