/* GambaGolf: trap and event floors as mini games. The party plays together against the dungeon:
   every fighter passes or fails on their own, a pass costs nothing, a fail costs health, and if everyone passes the party finds an item.
   Each dungeon has its own two trap games (mg_*.js register them); the five event floors are shared but dressed per dungeon.
   The big screen shows a voxel room and a HUD (vstage.js), every phone a control (app.js). A game here is rules only:
   phones send one value each (a string), the host keeps the time it arrived, and the game reads both.
   States: brief (rules, then a 3-2-1 count) -> play -> done (who came through) -> the run goes on. */
(()=>{
const O=window.OW,G=O.G;
const S=()=>O._sim,num=(v,d=0)=>(typeof v==='number'&&isFinite(v))?v:d,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const here=()=>G.players.filter(p=>!p.away),rng=O.rng;
const hurt=(p,frac)=>{if(p.hp<=0)return 0;const d=Math.max(1,Math.round(p.mhp*frac*(G.relics.includes('charm')?.5:1)));p.hp=Math.max(1,p.hp-d);S().ev('hurt',{pl:p,v:d,trap:1});return d};
const heal=(p,v)=>{if(p.hp<=0)return 0;const b=p.hp;p.hp=Math.min(p.mhp,p.hp+Math.round(v));S().ev('heal',{pl:p});return p.hp-b};
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
/* ---------- helpers every game may use ---------- */
const H={num,clamp,here,rng,plural,
  alive:g=>here().filter(p=>g.d.out[p.slot]==null),
  knock(g,p){if(g.d.out[p.slot]!=null)return;g.d.out[p.slot]=+g.t.toFixed(2);S().ev('mgOut',{slot:p.slot})},
  hit(g,p){if(g.d.out[p.slot]!=null)return;g.d.hp[p.slot]=(g.d.hp[p.slot]||0)-1;S().ev('mgHit',{slot:p.slot});if(g.d.hp[p.slot]<=0)H.knock(g,p)},
  hearts(g,n){for(const p of here())g.d.hp[p.slot]=n||3},
  ev:(k,o)=>S().ev(k,o||{}),say:t=>S().say(t),
  /* a seeded schedule: n events whose gap shrinks from a to b seconds */
  times(n,t0,a,b){const out=[];let t=t0;for(let i=0;i<n;i++){out.push(+t.toFixed(2));t+=a+(b-a)*(i/Math.max(1,n-1))}return out},
  pick:(r,a)=>a[Math.floor(r()*a.length)]};
O.MGH=H;
/* ---------- drawn symbols (no runes): one path each in a 48 box, filled even-odd ---------- */
const c=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0z`,rc=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}z`,pg=(...p)=>'M'+p.map(q=>q.join(' ')).join('L')+'z';
O.GLYPHS={
 skull:['#e9dfc6','M24 5c10 0 16 7 16 15 0 6-3 9-5 11v8H13v-8c-2-2-5-5-5-11C8 12 14 5 24 5z'+c(17,21,4.5)+c(31,21,4.5)+pg([24,26],[27,31],[21,31])],
 bone:['#e9dfc6',c(11,13,5)+c(13,9,5)+c(37,35,5)+c(35,39,5)+pg([12,9],[16,13],[38,35],[34,39])+pg([9,12],[13,16],[35,38],[39,34])],
 candle:['#ffd27a',rc(18,20,12,22)+'M24 4c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z'+rc(14,42,20,3)],
 coffin:['#b08060',pg([17,3],[31,3],[37,14],[31,45],[17,45],[11,14])+rc(22,10,4,22)+rc(17,16,14,4)],
 leaf:['#8ac060','M8 40C8 18 22 6 42 6c0 20-12 34-34 34z'+pg([10,40],[11,41],[36,13],[35,12])],
 acorn:['#c08a40','M10 20c0-8 6-12 14-12s14 4 14 12z'+'M13 22h22c0 12-5 20-11 22-6-2-11-10-11-22z'+rc(23,3,2,6)],
 root:['#a07a50','M22 4h4v14c6 2 10 8 14 22h-4c-3-10-6-15-10-17v23h-4V23c-4 2-7 7-10 17H8c4-14 8-20 14-22z'],
 moon:['#d8e0ff','M30 4a20 20 0 100 40 16 16 0 010-40z'],
 shell:['#f0c0a0','M24 6c11 0 20 9 20 20 0 6-3 10-6 12H10c-3-2-6-6-6-12C4 15 13 6 24 6z'+pg([23,10],[25,10],[25,36],[23,36])+pg([12,16],[14,15],[19,36],[17,36])+pg([36,16],[34,15],[29,36],[31,36])+rc(18,38,12,6)],
 wave:['#5fd0e0','M2 30c6-10 12-10 18 0s12 10 18 0c3-5 6-7 8-7v8c-2 0-4 2-7 6-6 9-14 9-20 0s-11-9-17 0z'+'M2 16c6-10 12-10 18 0s12 10 18 0c3-5 6-7 8-7v6c-2 0-4 2-7 6-6 9-14 9-20 0s-11-9-17 0z'],
 anchor:['#a8b4c0',c(24,8,5)+c(24,8,2)+rc(22,13,4,26)+rc(14,17,20,4)+'M6 28h5c0 6 6 11 13 11s13-5 13-11h5c0 10-8 16-18 16S6 38 6 28z'],
 fish:['#70c0a0','M4 24c8-10 18-12 28-8l10-8v32l-10-8c-10 4-20 2-28-8z'+c(14,22,2.5)],
 flame:['#ff8a3a','M24 4c2 9 13 12 13 24a13 13 0 01-26 0c0-7 5-9 6-15 3 3 3 6 3 6s4-6 4-15z'],
 hammer:['#c8c0b0',rc(8,8,22,12)+pg([28,10],[38,4],[40,18],[30,18])+rc(17,20,6,24)],
 anvil:['#8a8f9a','M4 12h30c0 6 6 8 10 8v4H32v6l6 8v4H10v-4l6-8v-6c-6 0-12-4-12-12z'],
 ingot:['#ffc040',pg([4,34],[12,22],[36,22],[44,34])+pg([10,20],[16,12],[32,12],[38,20])],
 spider:['#c8a0ff',c(24,26,8)+c(24,14,5)+pg([16,24],[4,14],[6,12],[18,22])+pg([16,28],[4,30],[4,33],[17,31])+pg([32,24],[44,14],[42,12],[30,22])+pg([32,28],[44,30],[44,33],[31,31])+pg([18,33],[8,44],[11,45],[20,35])+pg([30,33],[40,44],[37,45],[28,35])],
 web:['#e8e8f8',c(24,24,20)+c(24,24,17)+c(24,24,12)+c(24,24,9.5)+c(24,24,5)+c(24,24,3)+pg([23,2],[25,2],[25,46],[23,46])+pg([2,23],[46,23],[46,25],[2,25])],
 egg:['#f0f0e0','M24 4c9 0 16 14 16 24a16 16 0 01-32 0C8 18 15 4 24 4z'],
 fang:['#f0f0f0',pg([6,6],[42,6],[38,14],[30,14],[27,40],[24,14],[21,40],[18,14],[10,14])],
 flake:['#b8e8ff',pg([22,2],[26,2],[26,46],[22,46])+pg([4,13],[6,10],[44,35],[42,38])+pg([42,10],[44,13],[6,38],[4,35])+pg([18,6],[24,12],[30,6],[30,9],[24,15],[18,9])+pg([18,42],[24,36],[30,42],[30,39],[24,33],[18,39])],
 crown:['#ffd060','M7 34L4 14l11 9 9-15 9 15 11-9-3 20z'+rc(7,36,34,5)],
 shield:['#7fa8d0','M24 4l18 6c0 18-6 28-18 34C12 38 6 28 6 10z'+'M24 10l12 4c0 12-4 19-12 24z'],
 icicle:['#c8f0ff',pg([4,4],[44,4],[40,10],[36,10],[32,40],[28,10],[22,10],[18,30],[14,10],[8,10])],
 rat:['#a09080','M6 30c4-10 14-14 24-12 6 1 10 5 12 10l4 2-4 2c-2 4-8 6-14 6H12c-3 0-6-3-6-8z'+c(36,26,1.8)+'M6 34c-4 2-4 8 2 10'],
 drop:['#a0e040','M24 4c6 10 14 18 14 26a14 14 0 01-28 0c0-8 8-16 14-26z'],
 bottle:['#80c0a0',rc(20,4,8,8)+'M18 12h12v6c6 4 8 8 8 14v12H10V32c0-6 2-10 8-14z'],
 eye:['#c8e8ff','M3 24q21-22 42 0-21 22-42 0z'+c(24,24,8)+c(24,24,3)],
 idol:['#70ffa0',rc(14,4,20,14)+c(19,11,2.5)+c(29,11,2.5)+rc(16,20,16,18)+rc(10,38,28,6)],
 scarab:['#40d0c0','M24 6c4 0 7 2 8 5H16c1-3 4-5 8-5z'+'M12 14h24c4 6 4 18-2 26-3 4-7 5-10 5s-7-1-10-5c-6-8-6-20-2-26z'+rc(23,14,2,30)],
 sun:['#ffc060',c(24,24,9)+pg([23,2],[25,2],[25,11],[23,11])+pg([23,37],[25,37],[25,46],[23,46])+pg([2,23],[11,23],[11,25],[2,25])+pg([37,23],[46,23],[46,25],[37,25])],
 wisp:['#70ffd0','M24 6c8 6 12 12 12 20a12 12 0 01-24 0c0-4 2-7 5-9 0 4 2 6 4 6-2-6 0-12 3-17z'],
 sword:['#c8d0e0',pg([22,2],[26,2],[27,30],[21,30])+rc(14,30,20,4)+rc(22,34,4,9)+c(24,44,2.5)],
 helm:['#9aa3ad','M8 26C8 14 15 6 24 6s16 8 16 20v16H30V28h-4v14h-4V28h-4v14H8z'],
 tower:['#a8b0c0',pg([14,4],[18,4],[18,8],[22,8],[22,4],[26,4],[26,8],[30,8],[30,4],[34,4],[34,14],[31,14],[33,44],[15,44],[17,14],[14,14])+rc(22,30,4,14)],
 mush:['#e080ff','M4 24C4 12 13 6 24 6s20 6 20 18z'+rc(18,24,12,18)+c(15,16,3)+c(31,14,3)],
 bolt:['#ffe060',pg([28,2],[10,26],[22,26],[16,46],[38,18],[26,18],[34,2])],
 cloud:['#c0c8e0',c(16,26,9)+c(28,20,11)+c(36,28,8)+rc(12,28,26,8)],
 gear:['#ffd060',c(24,24,13)+c(24,24,5)+rc(21,3,6,8)+rc(21,37,6,8)+rc(3,21,8,6)+rc(37,21,8,6)+pg([8,12],[12,8],[17,13],[13,17])+pg([36,8],[40,12],[35,17],[31,13])+pg([8,36],[13,31],[17,35],[12,40])+pg([40,36],[36,40],[31,35],[35,31])],
 key:['#ffd060',c(14,24,10)+c(14,24,4)+rc(22,22,22,5)+rc(34,27,4,7)+rc(40,27,4,9)],
 hourglass:['#e0c080',rc(10,4,28,4)+rc(10,40,28,4)+pg([13,8],[35,8],[26,24],[35,40],[13,40],[22,24])],
 urn:['#a0a0a0',rc(18,4,12,5)+'M16 10h16c-2 4 8 8 8 18 0 10-6 16-16 16S8 38 8 28c0-10 10-14 8-18z'],
 ember:['#a0f0ff',c(24,28,10)+'M24 4c3 6 3 10 0 14-3-4-3-8 0-14z'],
 crystal:['#ff70ff',pg([24,2],[34,14],[30,44],[18,44],[14,14])+pg([24,6],[26,14],[24,40],[22,14])],
 pick:['#c0b0a0','M4 16C14 6 34 6 44 16c-8-4-14-5-18-5v33h-4V11c-4 0-10 1-18 5z'],
 lure:['#40c0ff',c(30,12,7)+'M30 19c0 10-8 16-20 20l-2-3c10-4 17-9 17-17z'],
 tentacle:['#4080c0','M30 44c-10 0-16-6-16-14 0-10 14-12 14-20 0-3-2-5-5-5-3 0-4 2-4 4h-5c0-6 4-9 9-9 6 0 10 4 10 10 0 10-14 12-14 20 0 4 4 8 11 8z'],
 chalice:['#ff5a2a','M10 6h28c0 12-6 18-12 19v11h8v6H14v-6h8V25C16 24 10 18 10 6z'],
 bell:['#ffc060','M24 4c2 0 3 2 3 3 7 2 11 8 11 18v8l4 5H6l4-5v-8c0-10 4-16 11-18 0-1 1-3 3-3z'+c(24,42,4)],
 cross:['#ff5a2a',rc(20,4,8,40)+rc(10,14,28,8)],
 heart:['#ff3a4a','M24 42C12 32 4 25 4 16 4 10 9 6 14 6c4 0 8 2 10 6 2-4 6-6 10-6 5 0 10 4 10 10 0 9-8 16-20 26z'],
 claw:['#ffc040',pg([6,40],[14,10],[16,12],[12,40])+pg([18,42],[24,6],[27,7],[23,42])+pg([30,42],[36,10],[39,11],[35,42])],
 scale:['#ff8040','M24 4c10 0 18 8 18 18-6-4-12-4-18 2-6-6-12-6-18-2C6 12 14 4 24 4z'+'M6 28c6-4 12-4 18 2 6-6 12-6 18-2-2 10-9 16-18 16S8 38 6 28z'],
 coin:['#ffd040',c(24,24,18)+c(24,24,14)+rc(22,15,4,18)],
 hand:['#c070ff','M14 44V22c0-2 3-2 3 0v-14c0-2 3-2 3 0v12-15c0-2 3-2 3 0v15-12c0-2 3-2 3 0v16-7c0-2 3-2 3 0v13c0 8-4 14-10 14z'],
 mask:['#e0d0ff','M6 10c12-4 24-4 36 0 0 18-8 30-18 30S6 28 6 10z'+'M12 18c3-2 7-2 10 1-3 3-7 3-10-1z'+'M26 19c3-3 7-3 10-1-3 4-7 4-10 1z'],
 star:['#c9a04c','M24 3l4.5 13.5L42 12l-8.5 12L42 36l-13.5-4.5L24 45l-4.5-13.5L6 36l8.5-12L6 12l13.5 4.5z']};
/* each dungeon's own six symbols, used by any game or event that needs symbols there */
O.DSYM=[['skull','bone','candle','coffin','moon','urn'],['leaf','acorn','root','moon','mush','eye'],['shell','wave','anchor','fish','coin','drop'],['flame','hammer','anvil','ingot','gear','coin'],
 ['spider','web','egg','fang','eye','skull'],['flake','icicle','crown','shield','sword','moon'],['rat','drop','bottle','skull','coin','eye'],['idol','eye','fish','wave','sun','scarab'],
 ['scarab','sun','skull','urn','coin','eye'],['wisp','moon','fish','drop','eye','leaf'],['sword','helm','shield','tower','key','crown'],['mush','drop','leaf','eye','spider','moon'],
 ['bolt','cloud','tower','wave','sun','moon'],['gear','key','hourglass','bell','coin','star'],['ember','urn','skull','candle','bone','flame'],['crystal','pick','gear','ember','star','eye'],
 ['lure','tentacle','fish','eye','shell','drop'],['chalice','bell','cross','heart','candle','skull'],['claw','scale','coin','flame','crown','egg'],['crown','hand','mask','eye','star','moon']];
/* each dungeon's room for the big screen: two floor stones, wall, wall accent, and the accent glow */
O.ROOMS=[['#4a4550','#3d3944','#5a5248','#d8cdb2'],['#3a2e1e','#2e3a1c','#4a3a28','#6a8a3a'],['#2a4a4a','#1e3a3c','#3a5a58','#6a9a8a'],['#3a2a26','#2a1c18','#4a3028','#ff7a20'],
 ['#2e2a3a','#24202e','#3a3448','#d8d8e8'],['#a8c0d0','#8aa8bc','#c8dce8','#7fc8ff'],['#3a3a26','#2a2e1a','#4a4a30','#a0e040'],['#2a4a3a','#1e3a2c','#3a5a48','#70ffa0'],
 ['#a88a5a','#8a6e44','#c8a870','#ffc060'],['#2a3a30','#1e2c24','#34463a','#70ffd0'],['#4a4e5a','#3a3e48','#5a5e6a','#ff9a3a'],['#4a3a3a','#3a2c30','#5a4040','#e080ff'],
 ['#3a4060','#2c3250','#4a5070','#a0c0ff'],['#5a4a2a','#4a3a20','#6a5a3a','#ffd060'],['#5a5a5a','#484848','#6a6a6a','#a0f0ff'],['#3a2a3a','#2c1e2c','#4a3a4a','#ff70ff'],
 ['#1a2430','#121a24','#202c3a','#40c0ff'],['#3a1a1e','#2a1216','#4a2228','#ff5a2a'],['#4a3020','#3a2418','#5a3a28','#ffc040'],['#24183a','#1a102c','#2e2048','#c070ff']];
O.symOf=(i)=>(O.DSYM[G.dung]||O.DSYM[0])[i%6];

/* ---------- the registry: trap games register per dungeon ---------- */
const MG={};O.MG=MG;O.MG_BY=[];
O.addMg=function(def){MG[def.id]=def;if(def.kind!=='event'){def.kind='trap';(O.MG_BY[def.dun]=O.MG_BY[def.dun]||[]).push(def.id)}};
O.MG_TRAPS=[];
O.trapFor=function(dung){const own=O.MG_BY[dung]||[],all=Object.keys(MG).filter(k=>MG[k].kind==='trap');const pool=own.length?own:all;
  const last=G.lastTrap;const fresh=pool.filter(k=>k!==last);const k=(fresh.length?fresh:pool)[Math.floor(Math.random()*(fresh.length?fresh:pool).length)];G.lastTrap=k;return k};
O.bladeDown=(b,t)=>Math.abs(Math.sin(t*Math.PI*2/b[1]+b[2]))<.32;
/* the shrine's own short course: a narrow cup at the end behind a fence of posts */
O.shrineCourse=()=>{const len=560,hw=y=>y<120?130:110;const N=Math.ceil(len/20)+1,arr=new Float32Array(N);for(let k=0;k<N;k++)arr[k]=hw(k*20);
  const C={id:'shrine',len,N,hw:arr,holes:[{i:0,x:0,y:470,rad:25,size:3,dmg:10,tier:1,armor:0,armor0:0}],
    bumps:[{x:-45,y:240,rad:12,kind:'knob',on:true},{x:45,y:240,rad:12,kind:'knob',on:true},{x:-25,y:370,rad:10,kind:'knob',on:true},{x:25,y:370,rad:10,kind:'knob',on:true}],
    sand:[{x:0,y:330,r:26,on:true}],water:[],blocks:[],mv:null,cx:()=>0};
  C.half=y=>hw(y);return C};

/* ---------- the event floors (shared rules; vstage and the event names dress them per dungeon) ---------- */
const EV={
 lock:{name:'The Reliquary Lock',brief:'Three tumblers each. A needle sweeps up and down: press STOP while it is inside the gold band. Every tumbler sweeps faster with a thinner band, and you have five picks. Every tumbler the party sets opens more of the reliquary.',
  setup(g){const r=rng(g.seed);g.d.band={};g.d.w=[.14,.1,.075];g.d.per=[1.5,1.05,.72];for(const p of here())g.d.band[p.slot]=[0,1,2].map(()=>+(.2+r()*.6).toFixed(2));g.dur=35;g.d.set={};g.d.left={}},
  input(g,p,v){const hs=String(v).split(',').filter(Boolean).map(Number).filter(isFinite).slice(0,5),b=g.d.band[p.slot];if(!b)return;let k=0;for(const h of hs){if(k<3&&Math.abs(h-b[k])<=g.d.w[k]/2){k++;S().ev('lock',{})}if(k>=3)break}
    g.d.set[p.slot]=k;g.d.left[p.slot]=5-hs.length},
  tick(g){if(here().every(p=>(g.d.set[p.slot]||0)>=3||(g.d.left[p.slot]!=null&&g.d.left[p.slot]<=0)))g.end=1},
  prog:(g,p)=>`${g.d.set[p.slot]||0}/3 set`,pass:(g,p)=>(g.d.set[p.slot]||0)>=1,
  finish(g){const ps=here(),tot=ps.reduce((a,p)=>a+(g.d.set[p.slot]||0),0),cnt=2+(tot>=2*ps.length?1:0)+(tot>=3*ps.length?1:0);
    const left=S().shuffle(Object.keys(O.RELICS).filter(r=>!G.relics.includes(r)&&S().has('re:'+r))).slice(0,Math.min(4,cnt)),gold=tot*5;if(gold&&!G.practice){G.stash.gold+=gold;S().saveStash()}
    for(const p of ps)g.d.rw[p.slot]=`You set ${plural(g.d.set[p.slot]||0,'tumbler')}; the party set ${tot}${gold?`: ${gold} gold`:''} and a choice of ${left.length} relics.`;
    if(left.length)return()=>{S().say(`${plural(tot,'tumbler')} set${gold?`, and ${gold} gold`:''}. Choose a relic from ${left.length}.`);S().setDec('relic',left);return true}}},
 shrine:{name:'The Vigil',brief:'Each of you tends three candles at the shrine. When a gust makes one of YOUR candles flicker (it bends and turns blue on your phone and the big screen), tap that candle to shield it before it goes out. Tapping a candle that is not flickering keeps your hands busy for a moment. The more candles the party keeps lit, the more everyone heals.',
  /* a reaction game: gusts come to each fighter's candles on their own schedule, faster as the vigil goes on */
  setup(g){g.dur=32;g.d.c={};g.d.fe={};g.d.bz={};g.d.sv={};g.nx={};g.rr={};for(const p of here()){const s=p.slot;g.d.c[s]=[0,0,0];g.d.fe[s]=[0,0,0];g.d.bz[s]=0;g.d.sv[s]=0;g.rr[s]=rng(g.seed+s*7);g.nx[s]=1.4+g.rr[s]()*.8}},
  input(g,p,v){const s=p.slot,k=Math.floor(+v),c=g.d.c[s];if(!c||!(k>=0&&k<3)||g.t<g.d.bz[s])return;
    if(c[k]===1){c[k]=0;g.d.fe[s][k]=0;g.d.sv[s]++;S().ev('mgTap',{})}else if(c[k]===0){g.d.bz[s]=+(g.t+.7).toFixed(2)}},
  tick(g,dt){const f=Math.min(1,g.t/g.dur);for(const p of here()){const s=p.slot,c=g.d.c[s],fe=g.d.fe[s],r=g.rr[s];if(!c)continue;
      for(let k=0;k<3;k++)if(c[k]===1&&g.t>=fe[k]){c[k]=2;fe[k]=0;S().ev('miss',{})}
      if(g.t>=g.nx[s]){const lit=[0,1,2].filter(k=>c[k]===0);if(lit.length){const k=lit[Math.floor(r()*lit.length)];c[k]=1;fe[k]=+(g.t+1.55-.5*f).toFixed(2)}g.nx[s]=g.t+(2.3-1.2*f)*(.75+r()*.5)}}
    if(here().length&&here().every(p=>(g.d.c[p.slot]||[]).every(v=>v===2)))g.end=1},
  prog:(g,p)=>{const c=g.d.c[p.slot]||[];return`${c.filter(v=>v!==2).length} of 3 lit`},pass:(g,p)=>(g.d.c[p.slot]||[]).some(v=>v!==2),
  finish(g){const ps=here(),tot=ps.length*3,lit=ps.reduce((a,p)=>a+(g.d.c[p.slot]||[]).filter(v=>v!==2).length,0),kept=tot?lit/tot:0;
    if(kept>=.34)for(const p of G.players)if(p.hp<=0){p.hp=Math.round(p.mhp*.5);S().ev('heal',{pl:p,col:'#f0cc5c'})}
    const frac=Math.min(.8,.1+.7*kept);for(const p of G.players)heal(p,p.mhp*frac);for(const p of ps)g.d.rw[p.slot]=`The party kept ${lit} of ${tot} candles lit: everyone heals ${Math.round(frac*100)}%.`;S().ev('boon',{});S().say(`${lit} of ${tot} candles still burn. The party heals ${Math.round(frac*100)}%.`)}},
 forge:{name:'The Dead Smithy',motion:1,mo:'Swing your phone down like a hammer as each ember reaches the line. A short, sharp swing works best. The STRIKE button still works too.',brief:'Strike as each glowing ember on your phone reaches the anvil line. The hammer keeps a steady beat in each passage, then changes: faster, then double strikes, then fastest of all. A warning shows before every change. Strikes off the beat cost you. The cleaner your work, the more you choose from.',
  /* four passages, each with a steady beat, so the rhythm can be learned; the pace changes between them */
  setup(g){const r=rng(g.seed),b=[],P=[['Steady',8,.82,0],['Faster!',8,.64,0],['Double strikes!',8,.86,1],['Fastest!',10,.54,0]];g.d.secs=[];g.d.sl=[];let t=2.6;
    for(const[lab,n,iv0,dbl]of P){const iv=+(iv0+(r()-.5)*.04).toFixed(3);g.d.secs.push(+t.toFixed(2));g.d.sl.push(lab);for(let i=0;i<n;i++){b.push(+t.toFixed(2));if(dbl&&i%2===1)b.push(+(t+iv/2).toFixed(2));t+=iv}t+=1.1}
    g.d.beats=b;g.dur=t+.6;g.d.sc={};g.taps={}},
  input(g,p,v){const set=g.taps[p.slot]=g.taps[p.slot]||new Set(),nw=String(v).split(',').map(Number).filter(isFinite);for(const t of nw)set.add(+t.toFixed(2));
    {const t=Math.max(...nw);if(isFinite(t)){let best=9;for(const b of g.d.beats)best=Math.min(best,Math.abs(b-t));(g.d.lt=g.d.lt||{})[p.slot]=[+g.t.toFixed(2),best<.1?2:best<.2?1:0]}}
    const taps=[...set].sort((a,b)=>a-b);let s=0;const used=new Set();for(const b of g.d.beats){let best=null;for(const t of taps){if(used.has(t))continue;const dd=Math.abs(t-b);if(dd<.2&&(!best||dd<best[0]))best=[dd,t]}if(best){used.add(best[1]);s+=best[0]<.1?1:.6}}
    const stray=taps.length-used.size;g.d.sc[p.slot]=Math.max(0,Math.round((s-.3*stray)/g.d.beats.length*100))},
  prog:(g,p)=>(g.d.sc[p.slot]||0)+'%',pass:(g,p)=>(g.d.sc[p.slot]||0)>=50,
  /* the beat on the big screen: embers fall down one lane to the anvil line; each fighter's last strike shows beneath in their colour */
  hud(x,w,h,g,HK){const t=g.t,bs=g.d.beats,LEAD=1.6,lw=Math.min(w*.2,200),lx=w/2,top=h*.13,hitY=h*.72;
    x.fillStyle='rgba(10,6,4,.78)';x.fillRect(lx-lw/2,top,lw,hitY-top+30);const gr=x.createLinearGradient(0,top,0,hitY);gr.addColorStop(0,'rgba(255,120,40,0)');gr.addColorStop(1,'rgba(255,120,40,.22)');x.fillStyle=gr;x.fillRect(lx-lw/2,top,lw,hitY-top);
    x.fillStyle='#e8c05a';x.fillRect(lx-lw*.7,hitY-2,lw*1.4,5);
    for(const b of bs){const d=b-t;if(d<-.25||d>LEAD)continue;const y=hitY-(d/LEAD)*(hitY-top-10),near=Math.abs(d)<.1;x.globalAlpha=d<-.1?Math.max(0,1+(d+.1)*6):1;x.fillStyle=near?'#fff4d0':'#ff8a3a';x.shadowColor='#ff6a1a';x.shadowBlur=near?24:10;x.beginPath();x.arc(lx,y,near?Math.max(14,lw*.11):Math.max(11,lw*.085),0,7);x.fill();x.shadowBlur=0;x.globalAlpha=1}
    const secs=g.d.secs||[],labs=g.d.sl||[];let lab='';const nx=secs.findIndex(s0=>s0>t);if(nx>0&&secs[nx]-t<1.8)lab='Next: '+labs[nx];else{let i=-1;secs.forEach((s0,k)=>{if(t>=s0)i=k});if(i>=0&&t-secs[i]<1.6)lab=labs[i]}
    if(lab)HK.txt(x,lab,lx,top-18,Math.max(22,h*.045),'#ffd27a');
    const ps=HK.players(),n=ps.length,lt=g.d.lt||{};ps.forEach((p,i)=>{const X=lx+(i-(n-1)/2)*Math.min(150,w*.16),q=lt[p.slot],fresh=q&&g.t-q[0]<.6;HK.txt(x,O.CLASSES[p.cls].animal,X,hitY+52,Math.max(14,h*.026),HK.LANES[p.slot]);
      if(fresh)HK.txt(x,['Off','Good','Perfect!'][q[1]],X,hitY+80,Math.max(18,h*.034),['#ff7a6a','#e8d8a0','#9dffb0'][q[1]]);HK.txt(x,(g.d.sc[p.slot]||0)+'%',X,hitY+108,Math.max(14,h*.026),'#bfb29a')})},
  finish(g){for(const p of here()){const s=g.d.sc[p.slot]||0;p.mgN=2+(s>=70?1:0)+(s>=88?1:0);p.mgAb=s>=88?1:0;g.d.rw[p.slot]=`Your timing: ${s}%. Your work offers ${p.mgN} choices${p.mgAb?', one of them a new ability':''}.`}
    return()=>{S().say('The smithy rings again. Everyone chooses from their work.');S().offerUpgrades('forge');return true}}},
 tome:{name:'The Drowned Library',brief:'Twelve pages, six pairs, and the party shares the turns. On your turn, turn over two: a pair stays face up and you go again, a miss passes the turn. Every pair the party finds teaches everyone more.',
  setup(g){const r=rng(g.seed),c=[0,0,1,1,2,2,3,3,4,4,5,5];for(let i=c.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[c[i],c[j]]=[c[j],c[i]]}g.cards=c;g.d.up=Array(12).fill(-1);g.d.found=0;g.d.turn=0;g.d.peek=null;g.dur=70;g.peekT=0;g.d.tt=0;g.d.tries=0;g.d.cap=here().length<=1?10:14;g.d.sym=O.DSYM[G.dung]||O.DSYM[0]},
  input(g,p,v){const ps=here();if(!ps.length||g.d.peek)return;const cur=ps[g.d.turn%ps.length];if(cur!==p)return;const[n,a,b]=String(v).split(/[:,]/).map(Number);if(n!==g.d.turn||!(a>=0&&b>=0&&a<12&&b<12&&a!==b)||g.d.up[a]>=0||g.d.up[b]>=0)return;
    g.d.peek=[a,b,g.cards[a],g.cards[b]];g.peekT=1.2;g.d.tries++},
  tick(g,dt){const ps=here(),d=g.d;d.who=ps.length?ps[d.turn%ps.length].slot:-1;
    if(d.peek){g.peekT-=dt;if(g.peekT<=0){const[a,b,ca,cb]=d.peek;if(ca===cb){d.up[a]=ca;d.up[b]=cb;d.found++;S().ev('boon',{})}else d.turn++;d.peek=null;d.tt=+g.t.toFixed(2);if(d.found>=6||d.tries>=d.cap)g.end=1}}
    else if(g.t-d.tt>7){d.turn++;d.tt=+g.t.toFixed(2)}},
  prog:g=>`${g.d.found}/6 pairs`,pass:g=>g.d.found>=3,
  finish(g){for(const p of here()){p.mgN=Math.min(4,1+Math.floor(g.d.found/2));g.d.rw[p.slot]=`The party found ${plural(g.d.found,'pair')}: you choose from ${p.mgN}.`}
    return()=>{S().say(`${plural(g.d.found,'pair')} found. Everyone chooses something to learn.`);S().offerUpgrades('tome');return true}}},
 gamble:{name:'The Gambler’s Table',brief:'A goblin hides a ball under one of three cups and shuffles, faster and faster. Bet gold from the party’s purse, then pick a cup. The right cup doubles the bet.',
  setup(g){const r=rng(g.seed);g.d.cup=Math.floor(r()*3);g.d.sw=[];g.d.bt=7;let t=7.6,iv=.62;for(let i=0;i<14;i++){const a=Math.floor(r()*3);g.d.sw.push([a,(a+1+Math.floor(r()*2))%3,+t.toFixed(2),+iv.toFixed(2)]);t+=iv;iv=Math.max(.2,iv*.88)}
    g.d.se=+(t+.3).toFixed(2);g.d.bet={};g.d.pick={};g.dur=g.d.se+9;g.d.purse=G.stash.gold;g.d.net={}},
  input(g,p,v){const[b,c]=String(v).split(':').map(Number);if(g.t<g.d.bt)g.d.bet[p.slot]=[0,10,25,50].includes(b)&&b<=g.d.purse?b:0;else if(g.t>=g.d.se&&c>=0&&c<3&&g.d.pick[p.slot]==null)g.d.pick[p.slot]=c},
  tick(g){if(g.atP==null){let where=g.d.cup;for(const[a,b]of g.d.sw){if(where===a)where=b;else if(where===b)where=a}g.atP=where}
    if(g.t>g.d.se+.5&&here().every(p=>g.d.pick[p.slot]!=null||!g.d.bet[p.slot]))g.end=1},
  prog:(g,p)=>g.d.bet[p.slot]?`bets ${g.d.bet[p.slot]}`:'no bet',pass:(g,p)=>!g.d.bet[p.slot]||g.d.pick[p.slot]===g.atP,
  finish(g){g.d.at=g.atP;let net=0;for(const p of here()){const bet=Math.min(g.d.bet[p.slot]||0,Math.max(0,G.stash.gold+net)),win=bet&&g.d.pick[p.slot]===g.d.at;const v=bet?(win?bet:-bet):0;net+=v;g.d.net[p.slot]=v;
      g.d.rw[p.slot]=!bet?'You sat this one out.':win?`Right cup! +${bet} gold for the purse.`:`Wrong cup. The goblin takes ${bet} gold.`}
    if(!G.practice){G.stash.gold=Math.max(0,G.stash.gold+net);S().saveStash()}g.d.tot=net;S().say(net>0?`The party wins ${net} gold.`:net<0?`The goblin takes ${-net} gold.`:'No gold changes hands.')}}};
for(const k in EV){EV[k].id=k;EV[k].kind='event';O.addMg(EV[k])}
/* each dungeon's names for its event floors */
O.EVNAMES=[
 ['The Reliquary Lock','The Vigil','The Dead Smithy','The Drowned Library','The Gambler’s Table'],
 ['The Heartwood Lock','The Moss Candles','The Root Smithy','The Hollow Oak Library','The Toadstool Table'],
 ['The Sunken Strongbox','The Tide Lamps','The Anchor Forge','The Flooded Chart Room','The Drowned Purser'],
 ['The Furnace Vault','The Cinder Vigil','The Great Forge','The Ash-Bound Ledgers','The Slag Gambler'],
 ['The Silk-Wrapped Lock','The Dew Lanterns','The Chitin Smithy','The Cocoon Archive','The Spinner’s Table'],
 ['The Frozen Coffer','The Frost Candles','The Cold Forge','The Frost-Bound Tomes','The Ice-Cup Game'],
 ['The Grate Lock','The Spring Vigil','The Scrap Smithy','The Rat-Chewed Ledgers','The Sewer Swindler'],
 ['The Idol’s Lock','The Lily Lamps','The Coral Forge','The Drowned Scriptures','The Temple Diviner'],
 ['The Tomb Seal','The Oasis Candles','The Sun Forge','The Buried Scrolls','The Bone-Dice Table'],
 ['The Bog-Iron Lock','The Still Vigil','The Peat Forge','The Witch’s Pages','The Will-o’ Table'],
 ['The Armoury Lock','The Chapel Candles','The Garrison Forge','The War Ledgers','The Barracks Dice'],
 ['The Mycel Seal','The Toadstool Lamps','The Rot Forge','The Spore Codex','The Puffball Table'],
 ['The Storm Coffer','The Storm Vigil','The Lightning Forge','The Sky Charts','The Wind-Gambler'],
 ['The Tumbler Vault','The Fountain Lamps','The Gear Forge','The Clockwork Index','The Clockwork Croupier'],
 ['The Ash-Choked Lock','The Ember Vigil','The Pyre Forge','The Charred Archive','The Bone-Ash Table'],
 ['The Geode Lock','The Crystal Candles','The Gem Cutter','The Singing Library','The Prospector’s Table'],
 ['The Pressure Lock','The Lantern Vigil','The Abyssal Forge','The Wreck Library','The Angler’s Game'],
 ['The Reliquary of Saints','The Holy Vigil','The Thurible Forge','The Blood Psalter','The Tithe Table'],
 ['The Hoard Lock','The Molten Candles','The Dragon Forge','The Scorched Annals','The Kobold’s Game'],
 ['The Throne Lock','The Shadow Vigil','The Night Forge','The Unwritten Library','The Pale Croupier']];
const EVK=['lock','shrine','forge','tome','gamble'];O.mgName=(k)=>{const i=EVK.indexOf(k);return i>=0?((O.EVNAMES[G.dung]||O.EVNAMES[0])[i]):(MG[k]&&MG[k].name)||''};

/* ---------- the shared machinery ---------- */
const BRIEF=7,DONE=6;O.MG_BRIEF=BRIEF;const SW=25;O.MG_SW=SW;
O.startMg=function(k){const def=MG[k]||MG[O.trapFor(G.dung)];if(!def)return;k=def.id;
  const g=G.mg={id:++G.decSeq,k,kind:def.kind,st:'brief',t:0,seed:1+Math.floor(Math.random()*1e9),v:{},at:{},out:{},won:false,d:{out:{},hp:{},rw:{},pass:{},pr:{},sw:{},swn:{},rdy:{},dung:G.dung},dur:30,end:0,item:''};
  if(def.hearts)H.hearts(g,def.hearts===true?3:def.hearts);def.setup.call(def,g);g.d.name=O.mgName(k);S().say(g.d.name+'! Look at your phones.');S().ev('mgStart',{k})};
O.mgInput=function(pid,id,v){const g=G.mg,p=G.players.find(q=>q.id===pid);if(g&&g.id===id&&p&&g.st==='brief'&&v==='ready'&&!g.go){(g.d.rdy=g.d.rdy||{})[p.slot]=1;S().ev('mgTap',{});return}if(!g||g.id!==id||!p||g.st!=='play')return;v=String(v==null?'':v).slice(0,240);const def=MG[g.k];
  if(v[0]==='!'){const n=Math.floor(num(+v.slice(1)));if(def.hearts&&g.d.out[p.slot]!=null&&!g.d.sw[p.slot]){g.d.swn[p.slot]=Math.min(SW,n);if(n>=SW){delete g.d.out[p.slot];g.d.hp[p.slot]=1;g.d.sw[p.slot]=1;S().ev('mgRevive',{slot:p.slot});S().say(`${O.CLASSES[p.cls].animal} climbs back in!`)}}return}
  if(def.input)def.input.call(def,g,p,v,g.t);g.v[pid]=v;g.at[pid]=g.t};
function wrapUp(g,def){g.st='done';g.t=0;const ps=here(),d=g.d;
  const passF=def.pass||((g2,p)=>g2.d.out[p.slot]==null);for(const p of ps){const ok=!!passF.call(def,g,p);d.pass[p.slot]=ok;g.out[p.id]=ok?1:0;if(def.prog)d.pr[p.slot]=def.prog.call(def,g,p)}
  if(def.kind==='trap'){const frac=.12+.008*G.dung;
    for(const p of ps){if(d.pass[p.slot])d.rw[p.slot]='Through! No damage.';else{const v=hurt(p,frac);d.rw[p.slot]=`Caught! The trap takes ${v} health.`}}
    g.won=ps.length>0&&ps.every(p=>d.pass[p.slot]);if(g.won){const it=S().anyItem();g.item=S().addItem(it)?O.ITEMS[it].name:'';if(g.item)for(const p of ps)d.rw[p.slot]+=` All clear: ${g.item} for the bag.`}
    const n=ps.filter(p=>!d.pass[p.slot]).length;S().say(g.won?`All clear!${g.item?` Behind the mechanism: ${g.item}.`:''}`:ps.length===1?'Caught by the trap.':`${n} of ${ps.length} caught.`)}
  else{g.won=true;if(def.finish)g.after=def.finish.call(def,g)}
  S().ev('mgEnd',{won:g.won});S().ev(g.won?'boon':'flash',{})}
O.mgTick=function(dt){const g=G.mg;if(!g)return;const def=MG[g.k];g.t+=dt;
  if(g.st==='brief'){
    /* every trap and event waits until everyone has read the rules and pressed Ready (or a minute has passed), then counts down */
    if(!g.go){g.wt=(g.wt||0)+dt;const ps=here(),rd=g.d.rdy||{};if((ps.length&&ps.every(p=>rd[p.slot]))||g.wt>60){g.go=1;g.t=Math.max(g.t,BRIEF-4.2)}else g.t=Math.min(g.t,BRIEF-4.4)}
    if(g.t>BRIEF){g.st='play';g.t=0;S().ev('mgGo',{k:g.k})}}
  else if(g.st==='play'){if(def.tick)def.tick.call(def,g,dt);if(def.prog)for(const p of here())g.d.pr[p.slot]=def.prog.call(def,g,p);
    if(def.hearts&&here().length&&!H.alive(g).length&&here().every(p=>g.d.sw[p.slot]))g.end=1;
    if(g.t>=g.dur||g.end)wrapUp(g,def)}
  else if(g.st==='done'){if(g.t>DONE){G.mg=null;if(!(typeof g.after==='function'&&g.after()))S().offerPath()}}};
O.mgPub=function(){const g=G.mg;if(!g)return null;return{id:g.id,k:g.k,st:g.st,t:Math.round(g.t*20)/20,d:g.d,out:g.st==='done'?g.out:null,won:g.won?1:0,dur:g.dur,item:g.item||'',go:g.go?1:0}};
})();
