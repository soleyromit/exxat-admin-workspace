import {open,main,snap,clk} from './lib.mjs';
const idx=+process.argv[2];
const {b,p}=await open();
await clk(p,'Skills Library');
await clk(p,'Edit',{nth:idx});
const dump=async(n)=>{const t=(await main(p)).split('\n').map(s=>s.trim()).filter(Boolean);
 const i=t.findIndex(l=>/^Edit skill/.test(l)); console.log(`\n=== skill#${idx} ${n} ===\n`+t.slice(i).join('\n').slice(0,6000));
 const inputs=await p.$$eval('input,select,textarea',els=>els.filter(e=>e.offsetParent).map(e=>`${e.tagName}[${e.type}] "${(e.getAttribute('aria-label')||e.placeholder||'')}" = ${e.type==='checkbox'||e.type==='radio'?e.checked:(e.value||'').slice(0,40)}`));
 console.log('INPUTS:',inputs.slice(5).join(' ; '));await snap(p,`E${idx}-${n}`);};
await clk(p,'Continue');await dump('step2');
await clk(p,'Continue');await dump('step3');
try{await clk(p,'Continue');await dump('step4');}catch(e){console.log('no step4')}
await b.close();
