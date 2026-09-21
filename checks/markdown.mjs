import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<div id="message"></div>');
globalThis.window=dom.window;globalThis.document=dom.window.document;
const {renderMarkdown}=await import('../chat-markdown.js');
const element=document.querySelector('#message');

test('assistant Markdown stays structured as partial chunks complete',()=>{
 renderMarkdown(element,'## Changes\n\n- **Responsive');
 renderMarkdown(element,'## Changes\n\n- **Responsive** layout\n- `index.html`\n\n```js\nconst x = "<tag>";\n```\n\n[Docs](https://example.com)\n\n| Page | State |\n| --- | --- |\n| Home | Ready |');
 assert.equal(element.querySelector('h2').textContent,'Changes');
 assert.equal(element.querySelectorAll('li').length,2);
 assert.equal(element.querySelector('strong').textContent,'Responsive');
 assert.match(element.querySelector('pre code').textContent,/<tag>/);
 assert.equal(element.querySelector('a').rel,'noopener noreferrer');
 assert.equal(element.querySelectorAll('.markdown-table table').length,1);
});
test('assistant content cannot inject scripts, UI, resource requests, or unsafe links',()=>{
 renderMarkdown(element,'<script>alert(1)</script><img src="https://example.com/track" onerror="alert(1)"><iframe src="/api/status"></iframe><form><input name="api-key"></form><svg onload="alert(1)"></svg><a href="javascript:alert(1)">bad</a> [File](file:///C:/secret) <p id="send-code" onclick="alert(1)">safe words</p>');
 assert.equal(element.querySelectorAll('script,img,iframe,form,input,svg,[onclick],[id]').length,0);
 assert.equal(element.querySelectorAll('a[href]').length,0);
 assert.match(element.textContent,/safe words/);
});
