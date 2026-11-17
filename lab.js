/* GambaGolf mini-game lab: the game in solo mode, with a picker that starts any trap or event floor on demand. */
(()=>{
const O=window.OW,G=O.G,q=new URLSearchParams(location.search),CLS=q.get('cls')||'bard',BOTS=Math.max(0,Math.min(3,+q.get('bots')||0));
const css=`#lab{position:fixed;left:12px;bottom:12px;z-index:9999;font:14px/1.3 var(--body,system-ui);color:#efe4cc;pointer-events:auto}
#lab .tab{background:linear-gradient(#e2b45a,#a8742a);color:#1d1405;border:0;border-radius:8px;padding:9px 16px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,.6);cursor:pointer}
#lab .pan{width:min(560px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;background:linear-gradient(rgba(30,22,25,.97),rgba(14,10,12,.97));border:1px solid #6a5238;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.7);padding:12px 14px 14px;margin-bottom:8px}
#lab h2{margin:0 0 4px;font:700 20px var(--display,serif);color:#f0cc5c}#lab p{margin:0 0 10px;color:#bfb29a;font-size:13px}
#lab .opts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px;font-size:13px}#lab select{background:#1d1517;color:#efe4cc;border:1px solid #6a5238;border-radius:5px;padding:4px 6px}
#lab .grp{margin:8px 0 2px;font:600 12px var(--body,system-ui);color:#c9b98f;text-transform:uppercase;letter-spacing:.06em}
#lab .row{display:grid;grid-template-columns:1fr 1fr;gap:6px}#lab .row.ev{grid-template-columns:1fr 1fr 1fr}
#lab button.g{background:#2a1f22;color:#efe4cc;border:1px solid #5a4636;border-radius:6px;padding:8px 9px;text-align:left;cursor:pointer;font-size:14px}
#lab button.g:hover{border-color:#f0cc5c;background:#3a2a2c}#lab button.g.last{border-color:#9dffb0}
#lab button.g small{display:block;color:#a99c86;font-size:11px;margin-top:2px}
#lab .bar{display:flex;gap:8px;margin-top:10px}#lab .bar button{flex:1;background:#3a2a2c;color:#efe4cc;border:1px solid #6a5238;border-radius:6px;padding:8px;cursor:pointer}
#lab .st{font-size:12px;color:#9dffb0;margin-top:8px;min-height:1em}`;
let box,pan,last=null,open=true,ready=false,running=false,evD=0;
function el(t,c,txt){const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e}
function build(){
  const st=el('style');st.textContent=css;document.head.appendChild(st);
  box=el('div');box.id='lab';pan=el('div','pan');const tab=el('button','tab','Mini-game lab');tab.onclick=()=>{open=!open;pan.hidden=!open};
  pan.append(el('h2',null,'Mini-game lab'),el('p',null,'Pick any trap or event floor to play it right away. You play in solo mode: the big-screen view on the left, your phone controls on the right. Your health is topped up before each game.'));
  const o=el('div','opts');
  const sc=el('select');for(const c of['warrior','bard','mage','archer']){const op=el('option',null,O.CLASSES[c].animal+' '+O.CLASSES[c].name);op.value=c;if(c===CLS)op.selected=true;sc.appendChild(op)}
  sc.onchange=()=>{q.set('cls',sc.value);location.search=q.toString()};
  const sb=el('select');for(let i=0;i<=3;i++){const op=el('option',null,i?i+' idle':'none');op.value=i;if(i===BOTS)op.selected=true;sb.appendChild(op)}sb.onchange=()=>{q.set('bots',sb.value);location.search=q.toString()};
  const sd=el('select');O.DUNGEONS.forEach((d,i)=>{const op=el('option',null,(i+1)+'. '+d.name);op.value=i;sd.appendChild(op)});sd.onchange=()=>{evD=+sd.value};
  const L=(t,e)=>{const w=el('label');w.append(t+' ',e);return w};
  o.append(L('Your fighter',sc),L('Extra fighters',sb),L('Event dungeon',sd));pan.appendChild(o);
  pan.appendChild(el('p',null,'Extra fighters stand in the line-up but never act, so they fail the shared games. Use them to see how the screen looks with a bigger party.'));
  {const mk=Object.keys(O.MG).filter(k=>O.MG[k].motion);if(mk.length){pan.appendChild(el('div','grp','📱 Motion games (open this page on your phone; turn motion on from the game’s rules screen)'));const mr=el('div','row ev');mk.forEach(k=>mr.appendChild(btn(k,O.MG[k].kind)));pan.appendChild(mr)}}
  pan.appendChild(el('div','grp','Event floors (themed by the event dungeon above)'));
  const ev=el('div','row ev');for(const k of Object.keys(O.MG).filter(k=>O.MG[k].kind==='event'))ev.appendChild(btn(k,'event'));pan.appendChild(ev);
  O.DUNGEONS.forEach((d,i)=>{const ks=Object.keys(O.MG).filter(k=>O.MG[k].dun===i);if(!ks.length)return;pan.appendChild(el('div','grp',(i+1)+'. '+d.name));const r=el('div','row');ks.forEach(k=>r.appendChild(btn(k,'trap')));pan.appendChild(r)});
  const bar=el('div','bar'),again=el('button',null,'Play the last one again'),stop=el('button',null,'Stop this game');again.onclick=()=>{if(last)start(last)};stop.onclick=()=>{G.mg=null;G.dec=null;running=false;status('Stopped.')};bar.append(again,stop);pan.appendChild(bar);
  pan.appendChild(el('div','st'));box.append(pan,tab);document.body.appendChild(box)}
function btn(k,kind){const d=O.MG[k],b=el('button','g');b.dataset.k=k;b.append((d.motion?'📱 ':'')+d.name,el('small',null,kind==='event'?'event floor':(d.ctl||d.brief||'').toString().slice(0,64)));b.onclick=()=>start(k);return b}
function status(t){const s=pan&&pan.querySelector('.st');if(s)s.textContent=t}
function start(k){if(!ready){status('Still setting up…');return}
  const d=O.MG[k];G.dec=null;G.after=null;G.travel=null;G.mg=null;G.dung=d.kind==='event'?evD:d.dun;
  for(const p of G.players)p.hp=p.mhp;
  try{O.startMg(k)}catch(e){status('Could not start: '+e.message);return}
  last=k;running=true;open=false;pan.hidden=true;box.querySelectorAll('button.g').forEach(b=>b.classList.toggle('last',b.dataset.k===k));status('Playing '+d.name+'.')}
/* get into a solo run on the map, then wait for picks */
function boot(){
  const go=document.getElementById('goSolo');if(!go||!O.go){setTimeout(boot,300);return}
  go.click();setTimeout(()=>{try{O.chooseClass(CLS);for(let i=0;i<BOTS;i++)O.addPlayer('idle'+i,['warrior','mage','archer','bard'][i],true)}catch(e){}
    setTimeout(()=>{try{O.selectDungeon(0);O.tick(.05);if(G.dec)O.pickOpt('host',G.dec.id,0)}catch(e){}waitMap(0)},500)},500)}
function waitMap(n){if(G.screen==='map'||n>60){ready=true;G.dec=null;G.travel=null;status('Ready. Pick a game.');return}setTimeout(()=>waitMap(n+1),250)}
/* once a game ends, clear whatever the map would do next and bring the picker back */
setInterval(()=>{if(G.mg&&G.mg.st==='brief'&&G.mg.d.rdy)for(const p of G.players)if(String(p.id).startsWith('idle'))G.mg.d.rdy[p.slot]=1;if(!ready)return;if(running&&!G.mg){running=false;setTimeout(()=>{G.dec=null;G.travel=null;G.after=null;for(const p of G.players)p.hp=Math.max(p.hp,1);open=true;pan.hidden=false;status('Done. Pick another, or play the last one again.')},1500)}
  if(!running&&ready&&G.screen==='map'){G.travel=null;if(G.dec&&!G.mg)G.dec=null}},400);
document.title='GambaGolf · Mini-game lab';
window.addEventListener('load',()=>{build();setTimeout(boot,900)});
})();
