const root=document.documentElement,system=window.matchMedia('(prefers-color-scheme: dark)');
let preference='system';
try{const saved=localStorage.getItem('clawd-theme');if(['light','dark'].includes(saved))preference=saved}catch{}
function applyTheme(){
 const theme=preference==='system'?(system.matches?'dark':'light'):preference;
 root.dataset.theme=theme;
 document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#211f1d':'#f6f3ed';
 document.querySelectorAll('.theme-picker select').forEach(select=>select.value=preference);
}
export function createThemePicker(container){
 const label=document.createElement('label');label.className='theme-picker';
 label.innerHTML='<span>Theme</span><select aria-label="Color theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>';
 const select=label.querySelector('select');select.value=preference;
 select.onchange=()=>{preference=select.value;try{localStorage.setItem('clawd-theme',preference)}catch{}applyTheme()};
 container.append(label);
}
export function initTheme(){
 applyTheme();
 system.addEventListener('change',()=>{if(preference==='system')applyTheme()});
 createThemePicker(document.querySelector('.header-actions'));
}
