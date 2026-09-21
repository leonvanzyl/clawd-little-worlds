import {marked} from 'marked';
import DOMPurify from 'dompurify';

// Claude output is untrusted content. Keep formatting, never executable HTML,
// embedded resources, forms, or links that can invoke local applications.
export function renderMarkdown(element,source){
 element.classList.add('markdown-body');
 element.innerHTML=DOMPurify.sanitize(marked.parse(source,{gfm:true,breaks:false,async:false}),{
  ALLOWED_TAGS:['p','br','strong','em','del','a','ul','ol','li','blockquote','pre','code','h1','h2','h3','h4','h5','h6','hr','table','thead','tbody','tr','th','td'],
  ALLOWED_ATTR:['href','title','start'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false
 });
 for(const link of element.querySelectorAll('a')){
  if(!/^https?:\/\//i.test(link.getAttribute('href')||''))link.removeAttribute('href');
  else{link.target='_blank';link.rel='noopener noreferrer'}
 }
 for(const table of element.querySelectorAll('table')){const wrap=document.createElement('div');wrap.className='markdown-table';table.replaceWith(wrap);wrap.append(table)}
}
