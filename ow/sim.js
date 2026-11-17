/* GambaGolf: host-side rules, physics and run flow. Field units: 1000 x 1120, wheel at (500,450) r340.
   A fight holds one or more monsters, each with its own wheel. In a round every fighter picks a monster and launches when ready;
   the shots are played out one after another in the order they were loosed, and then the monsters answer. */
(()=>{
const O=window.OW,{F,CLASSES,MONSTERS,UPGRADES,RELICS,ITEMS,MAP,FR,CAPV,LANES,TIER}=O;
const DEG=Math.PI/180,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const num=(v,d=0)=>(typeof v==='number'&&isFinite(v))?v:d;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
O.util={DEG,clamp,num,pick};
/* power on a course: 0 rolls just short of the first holes, 1 reaches the far wall */
O.powD=(len,pow)=>200+clamp(pow,0,1)*(len-140);O.powOf=(len,dist)=>clamp((dist-200)/(len-140),0,1);
O.reach=(x0,ang,pow)=>O.powD(G.C?G.C.len:1400,pow);O.powTo=(x0,ang,dist)=>O.powOf(G.C?G.C.len:1400,dist);
const GRAV=1200;
/* the speed a shot must leave the tee with to travel D in all. A putt only rolls; a chip hops low and keeps most of its pace; a lob flies high and nearly stops where it lands. */
O.strokeV=(D,R)=>{const FRc=O.COURSE.FR;if(!R||!R.fly)return Math.sqrt(2*FRc*Math.max(10,D));const keep=R.k==='high'?.22:.62;
  const T=v=>{const vz=v*R.tan,fl=2*v*vz/GRAV,v2=v*keep;return fl+v2*v2/(2*FRc)};let lo=20,hi=2400;for(let i=0;i<26;i++){const mid=(lo+hi)/2;if(T(mid)<D)lo=mid;else hi=mid}return(lo+hi)/2};

const G=O.G={screen:'lobby',node:0,visited:[0],relics:[],players:[],dec:null,decSeq:0,travel:null,after:null,result:null,
  phase:'idle',round:0,enc:[],mons:[],cur:-1,active:-1,actor:-1,inspect:false,turnT:0,
  boss:null,holes:[],bumps:[],divots:[],walls:[],rot:0,C:null,ck:0,
  items:[],mg:null,ward:1,
  marbles:[],pending:[],queue:[],cine:null,ev:[],msg:'',log:[],clock:0,ts:1,bossT:0,introT:0,deathT:0,boardVer:0,mid:0,uid:0,
  seed:1,tier:0,practice:false,focus:-1,holdT:0,seen:{},bonus:0,finale:false};
O.TURN=60;O.PARTY_DMG=[.52,.78,.95,1.05];O.MDMG=1.5;O.TIERS=['','Grim','Dire','Doomed'];

const ev=(k,o)=>G.ev.push(Object.assign({k},o));
/* ----- the host's stash: gold, loot boxes opened, what they unlocked, dungeons cleared. Kept on the host's device. ----- */
const SKEY='ow_stash1';
function loadStash(){let s=null;try{s=JSON.parse(localStorage.getItem(SKEY)||'null')}catch(e){}s=s&&typeof s==='object'?s:{};
  const ints=(o,ok,max)=>{const r={};if(o&&typeof o==='object')for(const k in o){const v=Math.floor(num(o[k]));if(ok(k)&&v>0)r[k]=Math.min(max,v)}return r};
  return{gold:Math.max(0,Math.floor(num(s.gold))),opened:Math.max(0,Math.floor(num(s.opened))),unl:Array.isArray(s.unl)?s.unl.filter(x=>O.LOCKS.includes(x)):[],clear:Array.isArray(s.clear)?s.clear.filter(x=>Number.isInteger(x)&&x>=0&&x<O.DUNGEONS.length):[],
    tier:ints(s.tier,k=>!!O.DUNGEONS[k],4),runs:Array.isArray(s.runs)?s.runs.filter(x=>Number.isInteger(x)&&x>=0&&x<20):[],kills:ints(s.kills,k=>!!MONSTERS[k],99999),bless:s.bless?1:0,fin:!!s.fin,prac:!!s.prac,last:'',keep:s.keep&&typeof s.keep==='object'&&Number.isInteger(s.keep.set)?s.keep:null,own:(o=>{const r={};if(o&&typeof o==='object')for(const k of['warrior','bard','mage','archer'])if(Array.isArray(o[k]))r[k]=o[k].filter(v=>Number.isInteger(v)&&v>=0&&v<40).slice(0,40);return r})(s.own)}}
function saveStash(){const s=G.stash;try{localStorage.setItem(SKEY,JSON.stringify({gold:s.gold,opened:s.opened,unl:s.unl,clear:s.clear,runs:s.runs||[],tier:s.tier,kills:s.kills,bless:s.bless,fin:s.fin,prac:s.prac,keep:s.keep||null}))}catch(e){}}
O.saveStash=saveStash;O.resetStash=()=>{try{localStorage.removeItem(SKEY);localStorage.removeItem('ow_run1')}catch(e){}G.stash=loadStash();G.dung=0;G.tier=0};
G.stash=loadStash();G.dung=0;G.gatePicks=0;G.mapVer=0;G.gain=0;G.newDung=false;G.wins=0;
/* Every three dungeons make a run. A run is played in order, stage by stage; what the party wins carries from one stage to the next.
   A run opens when the run before it is complete. Dying sends the party back to the first stage of its run. */
O.RUNS=[];O.DUNGEONS.forEach((d,i)=>{(O.RUNS[O.setOf(i)]=O.RUNS[O.setOf(i)]||[]).push(i)});
O.runOf=i=>O.setOf(i);
O.runDone=r=>!!O.RUNS[r]&&((G.stash.runs||[]).includes(r)||O.RUNS[r].every(d=>G.stash.clear.includes(d)));
O.runOpen=r=>!!O.RUNS[r]&&(r===0||O.runDone(r-1));
O.runStage=r=>{const kp=G.stash.keep,R=O.RUNS[r];if(!R)return 0;return kp&&kp.set===r&&R.includes(kp.next)?kp.next:R[0]};
O.runGold=(r,t)=>O.RUNS[r].reduce((a,d)=>a+O.goldFor(d,t||0),0);
O.selectRun=r=>{r=Math.floor(num(r,-1));if(G.screen==='lobby'&&O.runOpen(r)){const nd=O.runStage(r);if(O.runOf(G.dung)!==r)G.tier=0;G.dung=nd;const kp=G.stash.keep;if(kp&&kp.set===r&&kp.next===nd)G.tier=clamp(Math.floor(num(kp.tier)),0,3)}};
O.dungOpen=i=>O.runOpen(O.runOf(i))&&O.runStage(O.runOf(i))===i;
{let r0=0;for(let r=0;r<O.RUNS.length;r++)if(O.runOpen(r))r0=r;const kp=G.stash.keep;if(kp&&O.runOpen(kp.set))r0=kp.set;G.dung=O.runStage(r0);if(kp&&kp.set===r0&&kp.next===G.dung)G.tier=clamp(Math.floor(num(kp.tier)),0,3)}             // start on the furthest open run, at the stage the party reached
O.selectDungeon=i=>{i=Math.floor(num(i,-1));if(O.DUNGEONS[i])O.selectRun(O.runOf(i))};
/* a cleared dungeon can be entered again at a harder depth: tougher monsters, more gold. Each depth opens the next. */
O.maxTier=d=>{const r=O.runOf(d),f=O.RUNS[r][0];return Math.min(3,Math.max(O.runDone(r)?1:0,G.stash.tier[f]||0))};                 // depth belongs to the whole run
O.setTier=t=>{t=Math.floor(num(t));const kp=G.stash.keep,mid=kp&&kp.set===O.runOf(G.dung)&&kp.next===G.dung;if(G.screen==='lobby'&&!mid&&t>=0&&t<=O.maxTier(G.dung))G.tier=t};
O.goldFor=(d,t)=>Math.round(O.DUNGEONS[d].gold*(1+.5*t));
O.BLESS=150;O.buyBlessing=()=>{const st=G.stash;if(st.bless||st.gold<O.BLESS)return false;st.gold-=O.BLESS;st.bless=1;saveStash();return true};
O.openBox=function(){const st=G.stash,cost=O.boxCost(st.opened),left=O.LOCKS.filter(x=>!st.unl.includes(x));if(!left.length||st.gold<cost)return null;st.gold-=cost;st.opened++;const id=pick(left);st.unl.push(id);st.last=id;saveStash();return id};
const has=id=>!O.LOCKS.includes(id)||G.stash.unl.includes(id),DG=()=>O.DUNGEONS[G.dung];
O.HPB=1;                 // balls find holes far more often on a rimmed wheel, so monsters carry more health to keep fights the same length
const HPK=()=>DG().hpK*(1+.35*G.tier)*O.HPB,DMGK=()=>O.MDMG*Math.pow(DG().dmgK,.45)*(1+.22*G.tier)*(O.PARTY_DMG[G.players.length-1]||1);
function say(t){G.msg=t;G.log.unshift(t);if(G.log.length>30)G.log.pop()}
const float=(x,y,txt,col)=>ev('text',{x,y,txt,col});
const burst=(x,y,col,n)=>ev('burst',{x,y,col,n});
O.say=say;
const cm=()=>G.mons[G.cur]||null;
const alive=()=>G.mons.filter(m=>!m.dead);
const who=p=>`the ${CLASSES[p.cls].animal} ${CLASSES[p.cls].name}`;

/* ----- players ----- */
function mods(pl){
  const m={dmg:1+.08*((pl.lv||1)-1),take:pl.cls==='warrior'?.7:1,capv:1,size:1,sizeDown:0,pull:1,wide:1,iron:0,bspin:1,heal:18,burst:150,fourth:false,orb:1,eye:false,draw:1,haste:0,hpb:0,
    thorns:0,regen:0,crit:0,slayer:1,culler:1,steady:1,exec:1,guard:false,chorus:false,reson:0,encore:0,focus:1,barrier:false,surge:false,twin:false,markx:1.5,
    ricb:0,pyre:1,zeal:1,keen:1,ward:false,full:1.25,kindle:false,ember:false,quiver:false};
  for(const u of pl.ups||[]){
    if(u==='vigor')m.hpb+=15;else if(u==='might')m.dmg+=.15;else if(u==='lode'){m.capv*=1.15;m.pull*=1.5}else if(u==='wide')m.wide=1.3;else if(u==='ironput')m.iron=1;else if(u==='backspin')m.bspin=1.4;else if(u==='haste')m.haste=1;else if(u==='sl_wild')m.sw=1;else if(u==='sl_line')m.lines=1;else if(u==='sl_pay')m.pay=1;else if(u==='sl_jack')m.jack=1;else if(u==='sl_mirror')m.mirror=1;else if(u==='sl_nail')m.nail=1;else if(u==='sl_grave')m.grave=1;
    else if(u==='thorns')m.thorns+=4;else if(u==='regen')m.regen+=4;else if(u==='lucky')m.crit+=.15;else if(u==='slayer')m.slayer=1.25;else if(u==='culler')m.culler=1.3;
    else if(u==='steady')m.steady=1.25;else if(u==='grit')m.take*=.9;
    else if(u==='w_file')m.sizeDown=1;else if(u==='w_hide')m.take*=.8;else if(u==='w_exec')m.exec=1.4;else if(u==='w_bulk')m.hpb+=25;else if(u==='w_guard')m.guard=true;
    else if(u==='b_hymn')m.burst=230;else if(u==='b_ballad')m.heal=28;else if(u==='b_chorus')m.chorus=true;else if(u==='b_reson')m.reson=5;else if(u==='b_encore')m.encore=8;
    else if(u==='m_fourth')m.fourth=true;else if(u==='m_orb')m.orb=1.6;else if(u==='m_focus')m.focus=1.25;else if(u==='m_barrier')m.barrier=true;else if(u==='m_surge')m.surge=true;
    else if(u==='rebound')m.ricb+=.15;else if(u==='pyre')m.pyre=2;else if(u==='zeal')m.zeal=1.5;else if(u==='keen')m.keen=1.5;else if(u==='ward')m.ward=true;else if(u==='w_brute')m.full=1.6;else if(u==='b_kindle')m.kindle=true;else if(u==='m_ember')m.ember=true;else if(u==='a_quiver')m.quiver=true;
    else if(u==='a_eye')m.eye=true;else if(u==='a_draw')m.draw=1.4;else if(u==='a_crit')m.crit+=.25;else if(u==='a_twin')m.twin=true;else if(u==='a_hunter')m.markx=1.8}
  if(G.relics.includes('lens'))m.dmg+=.12;if(G.relics.includes('feather'))m.full=Math.max(m.full,1.5);return m}
const maxHp=pl=>CLASSES[pl.cls].hp+8*(pl.lv-1)+mods(pl).hpb;
O.cdBase=()=>0;                 // attacks no longer rest between uses: the reels decide what you may use
/* spin a fighter's reels */
function spin(p){const md=mods(p),sg=(O.SIG[p.cls]||['b'])[0],sg2=(O.SIG[p.cls]||['b','l'])[1],W={b:6,l:6,f:6,e:3.5,s:2.2*(md.grave?2:1),c:1.2*(md.grave?2:1),w:3*(md.sw?2:1)};W[sg]+=md.haste?12:7;W[sg2]+=3;
  const ks=Object.keys(W),tot=ks.reduce((a,k)=>a+W[k],0);let g='';for(let k=0;k<O.SLOT_N;k++){let r=Math.random()*tot;for(const c of ks){r-=W[c];if(r<=0){g+=c;break}}if(g.length<=k)g+='b'}
  if(md.nail)g=g[0]+sg+g.slice(2);p.grid=g;p.gn=(p.gn||0)+1;p.paid=false;p.bag=bagOf(p);p.bagN=p.bag.length}
/* the balls a spin wins: one of every special attack whose line came up, or the fighter's basic attack when none did */
function bagOf(p){const sl=O.slotRead(p.grid,p.owned,mods(p),p.cls),b=p.owned[0]||0,sp=sl.ok.filter(i=>i!==b);return sp.length?sp:[b]}
O.bagOf=bagOf;
/* a utility ball (anything with no aiming) can always be traded for the basic one: the bag offers basic beside it, and firing basic uses up that utility */
const swapOf=p=>{const b=p.owned[0]||0,bag=p.bag||[];if(bag.includes(b))return -1;for(let k=bag.length-1;k>=0;k--)if(CLASSES[p.cls].ab[bag[k]].instant)return bag[k];return -1};
O.swapOf=swapOf;O.choicesOf=p=>{const bag=p.bag||[],sw=swapOf(p);return sw>=0?[...bag,p.owned[0]||0]:bag.slice()};
O.SLOT_N=12;O.spin=spin;O.slotOf=p=>O.slotRead(p.grid,p.owned,mods(p),p.cls);
const cdOf=(pl,i)=>O.cdBase(CLASSES[pl.cls].ab[i],mods(pl)),noCd=cls=>CLASSES[cls].ab.map(()=>0);
O.mods=mods;O.maxHp=maxHp;
const laneX=pl=>{const i=G.players.indexOf(pl),n=G.players.length;return(i-(n-1)/2)*80};
const launchX=()=>0;O.launchX=launchX;                 // every shot leaves from the middle of the tee
const TY=-55,MX=()=>G.C?G.C.cx(G.C.len):0,MY=()=>G.C?G.C.len+170:1500;O.TY=TY;
O.laneX=laneX;
const startOwned=()=>Array.from({length:O.START},(_,i)=>i);
/* attacks a fighter has learned stay learned: they are kept in the stash by class and brought into every later dungeon */
const ownedFor=cls=>{const a=startOwned(),k=null;if(Array.isArray(k))for(const i of k)if(Number.isInteger(i)&&CLASSES[cls]&&CLASSES[cls].ab[i]&&!a.includes(i))a.push(i);return a.sort((x,y)=>x-y)};
function mkPlayer(id,cls,local){
  const pl={id,cls,local:!!local,slot:0,lv:1,ups:[],owned:ownedFor(cls),opts:null,picked:true,hp:0,mhp:0,fired:false,cd:noCd(cls),buff:false,oil:1,small:1,sure:false,barUsed:false,lastItem:0,lastMg:'',st:{dmg:0,sinks:0,shots:0,hits:0,best:0,trick:0,taken:0,heal:0},last:[0,0,0],aim:90,ch:false,pw:0,ab:0,rp:0,tgt:-1,lastN:0,lastPick:0,lastTgt:0,lastIns:0,away:false,peer:'',seen:performance.now(),sn:0,extra:0,whet:1,twice:false,wardUsed:false,skin:''};
  pl.mhp=maxHp(pl);pl.hp=pl.mhp;return pl}
const freeSlot=()=>{const used=G.players.map(p=>p.slot);let s=0;while(used.includes(s))s++;return s};
function addPlayer(id,cls,local){
  if(G.players.length>=4||!CLASSES[cls])return null;
  const pl=mkPlayer(id,cls,local);pl.slot=freeSlot();pl.lv=G.players.reduce((a,p)=>Math.max(a,p.lv),1);pl.mhp=maxHp(pl);pl.hp=pl.mhp;
  if(G.screen==='combat'){pl.fired=true;pl.tgt=-1}                    // someone who walks in mid-round acts from the next one
  G.players.push(pl);say(`A ${CLASSES[cls].animal} ${CLASSES[cls].name} joins the party.`);return pl}
function changeClass(pl,cls){if(G.screen!=='lobby'||!CLASSES[cls])return;pl.cls=cls;pl.owned=ownedFor(cls);pl.mhp=maxHp(pl);pl.hp=pl.mhp;pl.cd=noCd(cls)}
O.addPlayer=addPlayer;O.changeClass=changeClass;
O.setSkin=(pl,k)=>{k=String(k||'');pl.skin=k&&O.SKINS[k]&&(k==='bone'||G.stash.unl.includes('sk:'+k))?k:''};
function addItem(id){if(!ITEMS[id]||G.items.length>=O.BAG)return false;G.items.push(id);return true}
const anyItem=()=>pick(Object.keys(ITEMS).filter(k=>has('it:'+k)));
function rollUps(pl,what){
  const C=CLASSES[pl.cls],own=pl.ups,abil=shuffle(C.ab.map((a,i)=>i).filter(i=>!pl.owned.includes(i)&&has('ab:'+pl.cls+':'+i))).map(i=>'ab:'+i);
  const knows=k=>!UPGRADES[k].ab||pl.owned.includes(C.ab.findIndex(x=>x.id===UPGRADES[k].ab)),ok=k=>has('up:'+k)&&knows(k)&&(UPGRADES[k].many||!own.includes(k)),gen=shuffle(Object.keys(UPGRADES).filter(k=>!UPGRADES[k].cls&&ok(k))),cls=shuffle(Object.keys(UPGRADES).filter(k=>UPGRADES[k].cls===pl.cls&&ok(k)));
  if(what==='tome'){const n=clamp(pl.mgN||3,1,4);pl.mgN=0;return abil.length?abil.slice(0,n):gen.slice(0,Math.min(n,2))}
  if(what==='forge'){const n=clamp(pl.mgN||3,2,4),out=[];if(pl.mgAb&&abil.length)out.push(abil[0]);if(cls.length)out.push(cls[0]);for(const g of gen)if(out.length<n)out.push(g);pl.mgN=0;pl.mgAb=0;return shuffle(out)}
  const out=[];if(abil.length)out.push(abil[0]);if(cls.length)out.push(cls[0]);
  if(G.items.length<O.BAG&&Math.random()<.6)out.push('it:'+anyItem());
  for(const g of gen)if(out.length<3)out.push(g);return shuffle(out)}
function applyUp(pl,u){
  G.picks=(G.picks||[]).filter(q=>G.clock-q.t<6);G.picks.push({t:G.clock,id:pl.id,cls:pl.cls,u});
  if(u.startsWith('it:')){const id=u.slice(3);say(addItem(id)?`${ITEMS[id].name} goes into the party bag.`:'The party bag is full.');return}
  if(u.startsWith('ab:')){const i=+u.slice(3);if(!pl.owned.includes(i))pl.owned.push(i);pl.owned.sort((a,b)=>a-b);say(`${who(pl)} learns ${CLASSES[pl.cls].ab[i].name}.`.replace(/^t/,'T'));return}
  const before=maxHp(pl);pl.ups.push(u);pl.mhp=maxHp(pl);pl.hp=Math.min(pl.mhp,pl.hp+(pl.mhp-before));say(`${who(pl)} takes ${UPGRADES[u].name}.`.replace(/^t/,'T'))}

/* ----- decisions (votes and picks made from the phones) ----- */
function setDec(k,opts){G.dec={id:++G.decSeq,k,opts,picks:{},first:0,t0:G.clock}}
function pickOpt(pid,decId,i){
  const d=G.dec;if(!d||d.id!==decId)return;i=Math.floor(num(i,-1));
  if(d.k==='upgrade'){const pl=G.players.find(p=>p.id===pid);if(!pl||pl.picked||!pl.opts||!pl.opts[i])return;applyUp(pl,pl.opts[i]);pl.picked=true;pl.took=i}
  else{if(i<0||i>=d.opts.length)return;d.picks[pid]=i}
  if(!d.first)d.first=G.clock}
O.pickOpt=pickOpt;
function updateDec(){
  const d=G.dec;if(!d)return;const here=G.players.filter(p=>!p.away);
  if(d.k==='upgrade'){const gone=here.length<G.players.length&&here.every(p=>p.picked)&&G.clock-d.t0>10;       // nobody waits on a phone that has gone quiet
    if(G.players.every(p=>p.picked)||gone||(d.first&&G.clock-d.first>60)){G.players.forEach(p=>{if(!p.picked&&p.opts&&p.opts.length)applyUp(p,p.opts[0]);p.picked=true;p.opts=null});G.dec=null;if(G.gatePicks>0){G.gatePicks--;offerUpgrades('gate')}else offerPath()}return}
  const votes=Object.values(d.picks);if(!votes.length)return;
  const all=(here.length>0&&here.every(p=>p.id in d.picks))||('host' in d.picks);
  if(!(all||d.opts.length===1||d.k==='start'||G.clock-d.first>12))return;
  const tally=d.opts.map(()=>0);votes.forEach(v=>tally[v]++);const win='host' in d.picks?d.picks.host:tally.indexOf(Math.max(...tally));
  G.dec=null;const o=d.opts[win];
  if(d.k==='start'){if(o==='prac')startPractice();else beginRun()}
  else if(d.k==='path'){G.travel={from:G.node,to:o,t:0};say(`The party sets out for ${MAP[o].name}.`)}
  else if(d.k==='relic'){G.relics.push(o);say(`The party claims ${RELICS[o].name}.`);ev('boon',{});G.after={t:1.8,fn:offerPath}}
  else if(d.k==='end'){const r=O.runOf(G.dung),R=O.RUNS[r];
    if(o==='next'){const t=G.tier;G.dung=G.dung+1;G.tier=t;beginRun()}                 // straight on to the run's next stage
    else if(o==='restart'){const t=G.tier;G.stash.keep=null;G.dung=R[0];G.tier=t;beginRun()}                 // the party fell: the run begins again from its first stage
    else{O.clearRun();const nx=G.result==='win'&&G.newDung,lost=G.result==='lose';toLobby();if(nx){G.dung=O.RUNS[r+1][0];G.tier=0}else if(lost)G.dung=R[0];else G.dung=O.runStage(r)}}
}
function toLobby(){G.screen='lobby';G.phase='idle';G.result=null;G.mons=[];G.cur=-1;G.boss=null;G.holes=[];G.bumps=[];G.divots=[];G.walls=[];G.relics=[];G.items=[];G.mg=null;G.ward=1;G.node=0;G.visited=[0];
  G.practice=false;G.finale=false;G.fervor=0;G.fervorOn=false;G.picks=[];G.marbles=[];G.pending=[];G.queue=[];G.cine=null;G.dec=null;G.after=null;G.travel=null;G.active=-1;G.actor=-1;G.bonus=0;G.players=G.players.filter(p=>!p.away);
  G.players.forEach(p=>{p.lv=1;p.ups=[];p.owned=ownedFor(p.cls);p.mhp=maxHp(p);p.hp=p.mhp;p.buff=false;p.tgt=-1;p.fired=false;p.cd=noCd(p.cls)});G.log=[];G.msg=''}
O.toLobby=toLobby;
O.lossGold=()=>4*Math.max(0,G.visited.length-1);
/* leave a run from the pause menu: the same terms as abandoning after a defeat */
O.abandonRun=function(){if(G.screen==='lobby')return;if(!G.practice&&G.result!=='win'){const r=O.runOf(G.dung);G.stash.keep=null;saveStash();G.dung=O.RUNS[r][0]}if(!G.practice)O.clearRun();toLobby()};
function beginRun(){toLobby();O.clearRun();G.seed=1+Math.floor(Math.random()*1e9);O.genMap(G.dung,G.seed);G.mapVer++;G.wins=0;G.gain=0;G.newDung=false;G.screen='map';G.runT=G.clock;G.players.forEach(p=>{p.st={dmg:0,sinks:0,shots:0,hits:0,best:0,trick:0,taken:0,heal:0}});
  const R=O.RUNS[O.runOf(G.dung)],lv=O.DUNGEONS[R[0]].startLv,kp=G.stash.keep,use=!!(kp&&kp.set===O.runOf(G.dung)&&kp.next===G.dung&&G.dung!==R[0]);if(!use){G.stash.keep=null;saveStash()}else G.tier=clamp(Math.floor(num(kp.tier)),0,3);        // a run starts everyone afresh; its later stages carry on with what was won
  G.players.forEach(p=>{const k=use&&kp.by&&kp.by[p.cls];p.lv=Math.max(lv,k?Math.floor(num(k.lv,1)):1);if(k){p.ups=(Array.isArray(k.ups)?k.ups:[]).filter(u=>O.UPGRADES[u]);p.owned=(Array.isArray(k.owned)?k.owned:[]).filter(i=>Number.isInteger(i)&&CLASSES[p.cls].ab[i]);for(const i of startOwned())if(!p.owned.includes(i))p.owned.push(i);p.owned.sort((a,b)=>a-b)}p.mhp=maxHp(p);p.hp=p.mhp});
  if(use){G.relics=(Array.isArray(kp.relics)?kp.relics:[]).filter(r=>RELICS[r]);G.items=(Array.isArray(kp.items)?kp.items:[]).filter(r=>ITEMS[r]).slice(0,O.BAG)}
  say(`The gate of ${DG().name.replace(/^The /,'the ')} closes behind the party.`);
  let picks=use?0:(R[0]>=2?1:0)+Math.floor(R[0]/4);            // deeper dungeons are entered as a seasoned party: higher level and a few drops at the gate
  if(G.stash.bless){G.stash.bless=0;saveStash();picks++;const r=shuffle(Object.keys(RELICS).filter(r=>has('re:'+r)))[0];if(r){G.relics.push(r);say(`The blessing holds: the party carries ${RELICS[r].name} through the gate.`)}}
  if(picks>0){G.gatePicks=picks-1;offerUpgrades('gate')}else{G.gatePicks=0;offerPath()}}
/* ----- a run in progress is kept on the host's device, so a reload or a crash does not lose it ----- */
const RKEY='ow_run1';
function saveRun(){if(G.practice)return;try{localStorage.setItem(RKEY,JSON.stringify({v:1,solo:G.players.every(p=>p.local)?1:0,dung:G.dung,tier:G.tier,seed:G.seed,node:G.node,visited:G.visited,relics:G.relics,items:G.items,wins:G.wins,
  players:G.players.map(p=>({id:p.id,cls:p.cls,slot:p.slot,lv:p.lv,ups:p.ups,owned:p.owned,hp:Math.round(p.hp),st:p.st}))}))}catch(e){}}
const readRun=()=>{let s=null;try{s=JSON.parse(localStorage.getItem(RKEY)||'null')}catch(e){}return s&&typeof s==='object'&&s.v===1&&O.DUNGEONS[s.dung]&&Array.isArray(s.players)&&s.players.length&&Array.isArray(s.visited)?s:null};
O.clearRun=()=>{try{localStorage.removeItem(RKEY)}catch(e){}};
O.savedRun=solo=>{const s=readRun();if(!s||(solo!=null&&!!s.solo!==!!solo))return null;return{dung:s.dung,tier:clamp(Math.floor(num(s.tier)),0,3),floor:Math.max(0,s.visited.length-1),cls:s.players.map(p=>p.cls).filter(c=>CLASSES[c])}};
O.continueRun=function(){
  const s=readRun();if(!s||G.screen!=='lobby')return false;
  toLobby();G.dung=s.dung;G.tier=clamp(Math.floor(num(s.tier)),0,3);G.seed=Math.floor(num(s.seed,1));O.genMap(G.dung,G.seed);G.mapVer++;
  const node=Math.floor(num(s.node));if(!MAP[node]||!MAP[node].next.length){O.clearRun();return false}
  G.node=node;G.visited=s.visited.filter(i=>MAP[i]);G.relics=(s.relics||[]).filter(r=>RELICS[r]);G.items=(s.items||[]).filter(i=>ITEMS[i]).slice(0,O.BAG);G.wins=Math.floor(num(s.wins));G.gain=0;G.newDung=false;G.runT=G.clock;
  const cur=G.players;G.players=[];
  for(const sp of s.players.slice(0,4)){if(!sp||!CLASSES[sp.cls])continue;let pl=cur.find(p=>p.id===sp.id);
    if(pl)pl.cls=sp.cls;else{pl=mkPlayer(String(sp.id).slice(0,24),sp.cls,false);pl.away=true;pl.seen=-1e9}        // a fighter whose phone is not here yet waits for it
    const sl=Math.floor(num(sp.slot,-1));pl.slot=sl>=0&&sl<4&&!G.players.some(p=>p.slot===sl)?sl:freeSlot();G.players.push(pl);
    pl.lv=clamp(Math.floor(num(sp.lv,1)),1,80);pl.ups=(Array.isArray(sp.ups)?sp.ups:[]).filter(u=>UPGRADES[u]);
    pl.owned=(Array.isArray(sp.owned)?sp.owned:[]).map(v=>Math.floor(num(v,-1))).filter((v,i,a)=>v>=0&&v<CLASSES[pl.cls].ab.length&&a.indexOf(v)===i).sort((a,b)=>a-b);if(!pl.owned.length)pl.owned=startOwned();
    pl.cd=noCd(pl.cls);pl.mhp=maxHp(pl);pl.hp=clamp(Math.round(num(sp.hp,pl.mhp)),0,pl.mhp);pl.picked=true;pl.opts=null;if(sp.st&&typeof sp.st==='object')for(const k in pl.st)pl.st[k]=Math.max(0,Math.floor(num(sp.st[k])))}
  const lv=G.players.reduce((a,p)=>Math.max(a,p.lv),1);
  for(const pl of cur)if(!G.players.includes(pl)&&G.players.length<4){pl.slot=freeSlot();pl.lv=lv;pl.mhp=maxHp(pl);pl.hp=pl.mhp;G.players.push(pl)}
  if(!G.players.length){G.players=cur;return false}
  G.screen='map';say('The party gathers itself and presses on.');offerPath();return true};
function offerPath(){G.screen='map';const nx=MAP[G.node].next;if(nx.length)setDec('path',nx);saveRun()}
function arrive(n){
  G.node=n;G.visited.push(n);const t=MAP[n];
  if(t.type==='battle')G.after={t:.7,fn:()=>startFight(t.enc)};
  else if(t.type==='treasure')G.after={t:.6,fn:()=>O.startMg('lock')};
  else if(t.type==='shrine')G.after={t:.6,fn:()=>O.startMg('shrine')};
  else if(t.type==='forge')G.after={t:.6,fn:()=>O.startMg('forge')};
  else if(t.type==='tome')G.after={t:.6,fn:()=>O.startMg('tome')};
  else if(t.type==='gamble')G.after={t:.6,fn:()=>O.startMg('gamble')};
  else if(t.type==='trap')G.after={t:.6,fn:()=>O.startMg(O.trapFor(G.dung))};
}
function offerUpgrades(what){G.screen='map';G.players.forEach(p=>{p.opts=rollUps(p,what);p.picked=false;p.took=-1});setDec('upgrade',[]);G.dec.t=what||'drop'}

/* ----- fights ----- */
const wpos=(x,y)=>[x,y];                 // course coordinates are the field's own: nothing turns any more
const wpol=(r,a)=>[0,0];
O.wpos=wpos;O.wpol=wpol;
/* bring one monster's wheel up as the live board; -1 puts every wheel away */
function loadBoard(i){
  if(i<0&&G.mons.length===1&&!G.mons[0].dead&&G.screen==='combat')i=0;          // a fight has one monster now, and its course stays up
  G.cur=i;const m=cm();G.inspect=false;
  G.terr=m?m.terr||null:null;G.mv=m?m.mv:null;
  if(m){G.C=m.course;G.holes=m.holes;G.bumps=m.bumps;G.divots=[];G.walls=[];G.rot=0;G.boss=m.id;G.boardVer++}}
function startFight(enc){
  const n=Math.max(1,G.players.length),sc=.45+.55*n;enc=[enc[0]];G.enc=enc;G.cur=-1;          // one monster per fight, grown to the size of the party
  G.mons=enc.map(id=>{const d=MONSTERS[id],C=O.course(id),lesser=d.rank==='lesser',hp=Math.round(d.hp*sc*(lesser?1.35*(1+(HPK()-1)*.55):(d.rank==='boss'?.6:.85)*HPK()));
    return{uid:++G.uid,id,name:d.name,rank:d.rank,hp,max:hp,enraged:false,dead:false,freeze:false,rot:0,atk:null,terr:null,course:C,holes:C.holes,bumps:C.bumps,sand:C.sand,blocks:C.blocks,divots:[],walls:[],mv:C.mv,locks:C.locks,core:C.core,rest:[],sg:-1,blunt:false,lk:0,coreT:0,wk:-1}});
  const c={};G.mons.forEach(m=>{c[m.id]=(c[m.id]||0)+1});const seen={};G.mons.forEach(m=>{if(c[m.id]>1){seen[m.id]=(seen[m.id]||0)+1;m.name+=' '+'ABCD'[seen[m.id]-1]}});
  G.C=G.mons[0].course;G.marbles=[];G.pending=[];G.queue=[];G.cine=null;G.round=0;G.dec=null;G.after=null;G.travel=null;G.mg=null;G.ward=1;G.combo=0;G.stop=0;G.active=-1;G.actor=-1;G.inspect=false;G.focus=-1;G.turnT=0;G.holdT=0;G.seen={};G.spin=0;G.ck=0;
  G.screen='combat';G.phase='intro';G.introT=0;G.result=null;G.boss=enc[0];loadBoard(0);
  for(const p of G.players){p.mhp=maxHp(p);if(p.hp<=0)p.hp=Math.round(p.mhp*.35);p.cd=noCd(p.cls);p.buff=false;p.fired=false;p.tgt=-1;p.barUsed=false;p.wardUsed=false;p.oil=1;p.small=1;p.sure=false;p.whet=1;p.twice=false;p.extra=0;p.dot=null;p.deb=null;p.hex=1;p.trail=null}
  G.idolUsed=false;G.fervorOn=false;if(G.practice)G.fervor=0;
  const lead=MONSTERS[enc[0]];if(G.practice)G.mons.forEach(m=>{m.hp=m.max=999});say(G.practice?'The practice yard. Nothing here strikes back.':enc.length===1&&lead.intro?`${lead.name}${lead.title?', '+lead.title:''}. ${lead.intro}`:`${O.encName(enc)} ${enc.length>1?"block":"blocks"} the way.`);ev('intro',{});
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}
}
O.startFight=startFight;
function planIntents(){
  const party=G.players.filter(p=>p.hp>0);if(!party.length||G.practice)return;
  for(const m of alive())m.intent={pend:1,t:'',t2:'',dmg:0,raw:0,x:'',n:-1,seq:G.pullSeq=(G.pullSeq||0)+1}}
/* the monster's own reels, pulled on its turn just before it strikes: the move it lands is what it does, against whom, and how hard */
function pullFor(m){
  const party=G.players.filter(p=>p.hp>0),kk=DMGK(),n=G.players.length,d=MONSTERS[m.id],S=O.movesOf(m.id),reels=O.pullReels(m.id),P=O.readPull(m.id,reels),mv=S.mv[P.mv],lesser=m.rank==='lesser',boss=m.rank==='boss';
  const pw=P.pw/S.ep*(m.pump||1);m.pump=1;
  let t=null,t2=null;if(mv.t!=='all'&&party.length){t=pickTarget(party,true);if(mv.t==='two'&&party.length>1)t2=pickTarget(party.filter(p=>p!==t),true)}
  const one=lesser?d.hit*1.8:d.single*(boss?.85:1),all=lesser?d.hit*.9:d.aoe*(boss?.85:1);
  const base=(mv.t==='all'?all:one*(mv.t==='two'?.7:1)*(n>=3?1.2:1))+(m.enraged?2:0),raw=mv.k>0?base*mv.k*pw:0;
  const fv=mv.fx==='bleed'?Math.max(1,Math.round(mv.fv*kk*(1+(P.pw-1)*.5)*(lesser?1:1.25))):mv.fx==='mend'?Math.round(m.max*.1*P.pw):0;
  const dmg=raw?Math.max(1,Math.round(raw*kk*(m.blunt?.5:1))):0;
  return{t:t?t.id:'',t2:t2?t2.id:'',raw,dmg,b:m.blunt?1:0,x:mv.terr||'',mv:P.mv,reels,pw:P.pw,n:P.n,cells:P.cells,fx:mv.fx,fv,seq:G.pullSeq=(G.pullSeq||0)+1}}
O.FOE_SPIN=2.6;O.FOE_HOLD=2.2;          // the reels spin, then the attack's name and effect sit on screen before the windup
const waiting=()=>G.players.filter(p=>p.hp>0&&!p.fired);
O.waiting=waiting;
/* fighters whose monster has fallen are turned to the one that is left, if there is only one; the host screen shows the wheel last chosen */
function retarget(){
  const a=alive(),only=a.length?G.mons.indexOf(a[0]):-1;
  for(const p of G.players)p.tgt=only;G.focus=only;
  if(!G.cine&&!G.queue.length&&only>=0&&G.cur!==only)loadBoard(only)}
function startRound(){
  G.round++;G.phase='aim';G.shooter='';planIntents();
  G.fervorOn=false;for(const m of alive()){const open=m.holes.map((h,i)=>h.armor<=0?i:-1).filter(i=>i>=0);m.wk=open.length>1&&(G.round>1||G.practice)?pick(open):-1;
    const sg=open.filter(i=>i!==m.wk&&i!==m.core);m.sg=sg.length&&m.intent&&!m.stun&&!G.practice?pick(sg):-1;m.blunt=false}       // and one hole carries the strike the monster is winding up: sink it and the blow lands at half weight
  // each round one open hole on every wheel lies exposed (sink it for double)
  for(const p of G.players){spin(p);p.fired=false;p.oil=1;p.small=1;p.sure=false;p.twice=false;p.extra=0;p.cd=p.cd.map(v=>Math.max(0,v-1));        // a fighter stays on the monster they chose until it falls or they pick another
    p.hex=1;if(p.deb){if(p.deb.shrink)p.small=p.deb.shrink>1?.5:.75;if(p.deb.hex)p.hex=p.deb.hex>1?.55:.7;p.deb=null}
    const rg=(G.relics.includes('bell')?5:0)+(G.round>1?mods(p).regen:0);if(rg&&p.hp>0&&p.hp<p.mhp)p.hp=Math.min(p.mhp,p.hp+rg)}
  G.active=-1;G.turnT=0;{const p0=G.players.length===1?G.players[0]:null,keep=p0&&p0.hp>0&&G.mons[p0.tgt]&&!G.mons[p0.tgt].dead;G.focus=keep?p0.tgt:-1}loadBoard(G.focus);retarget();ev('round',{});        // with a party the big screen opens each round on the whole pack; a lone fighter goes straight back to their wheel
  say(G.practice?'Take your shots. Nothing here strikes back.':G.players.length>1?`Round ${G.round}. Take your shots in turn.`:`Round ${G.round}.`)}
function setTarget(pid,i){return;
  const pl=G.players.find(p=>p.id===pid);if(!pl||G.screen!=='combat'||G.phase!=='aim'||pl.fired||pl.hp<=0)return;i=Math.floor(num(i,-1));const quiet=!G.cine&&!G.queue.length;
  if(i<0){if(alive().length>1){pl.tgt=-1;if(quiet&&!waiting().some(p=>p.tgt>=0)){G.focus=-1;loadBoard(-1)}}return}
  const m=G.mons[i];if(!m||m.dead)return;pl.tgt=i;G.focus=i;if(quiet&&G.cur!==i)loadBoard(i);say(`${who(pl)} turns on ${m.name}.`.replace(/^t/,'T'))}
O.setTarget=setTarget;
O.toggleInspect=pid=>{if(G.cine||G.queue.length||G.phase!=='aim')return;const p=waiting().find(q=>q.id===pid);if(G.cur<0&&p&&G.mons[p.tgt]&&!G.mons[p.tgt].dead){G.focus=p.tgt;loadBoard(p.tgt)}if(G.cur<0)return;if(pid==='host'||p)G.inspect=!G.inspect};
function fire(pl,abi,ang,pow,rp){
  if(G.screen!=='combat'||G.phase!=='aim'||!G.players.includes(pl)||pl.fired||pl.hp<=0)return false;
  if(G.players.length>1&&G.shooter&&G.shooter!==pl.id)return false;                 // not your turn yet
  abi=Math.floor(num(abi,-1));const ab=CLASSES[pl.cls].ab[abi];if(!ab||!pl.owned.includes(abi))return false;if(!Array.isArray(pl.bag))return false;let use=abi;if(!pl.bag.includes(abi)){const sw=swapOf(pl);if(abi!==(pl.owned[0]||0)||sw<0)return false;use=sw}const sl=O.slotOf(pl);
  const needs=!ab.instant||ab.foe;if(needs&&(!G.mons[pl.tgt]||G.mons[pl.tgt].dead))return false;
  ang=clamp(num(ang,90),8,172);pow=clamp(num(pow),0,1);rp=clamp(Math.floor(num(rp)),0,2);
  if(!pl.paid){pl.paid=true;const fx=sl.fx,tm=G.mons[pl.tgt];if(fx.blunt&&tm&&!tm.dead&&!tm.blunt){tm.blunt=true;if(tm.intent){if(!tm.intent.pend)tm.intent.dmg=Math.max(1,Math.ceil(tm.intent.dmg/2));tm.intent.b=1}say(`A line of skulls: ${tm.name}'s strike is blunted.`)}
    if(fx.heal)for(const q of G.players)if(q.hp>0){q.hp=Math.min(q.mhp,q.hp+Math.round(fx.heal));ev('heal',{pl:q,col:'#f0cc5c'})}if(fx.gold&&!G.practice){G.stash.gold+=fx.gold;say(`A line of crowns: ${fx.gold} gold for the stash.`)}if(fx.jack){say('Jackpot! Four of a kind.');ev('boon',{})}if(fx.again&&!pl.extra)pl.extra=1}
  pl.bag.splice(pl.bag.indexOf(use),1);pl.sn++;                    // each ball the reels won is loosed in turn; when the bag is empty the turn is done
  if(!pl.bag.length){if(pl.extra>0){pl.extra--;spin(pl)}else pl.fired=true}
  if(!ab.instant)pl.st.shots++;
  pl.ch=false;G.inspect=false;
  if(ab.cost)pl.hp=Math.max(1,pl.hp-ab.cost);
  G.queue.push({pl,ab,ang,pow,rp,tgt:needs?pl.tgt:-1,mult:pl.oil*pl.whet*sl.mult*(pl.hex||1),small:pl.small,sure:pl.sure||!!sl.fx.sure,fb:sl.fx.burn||0,twice:pl.twice&&!ab.instant});pl.oil=1;pl.small=1;pl.sure=false;pl.twice=false;return true}
O.fire=fire;
function applyInstant(a){
  const m=mods(a.pl),id=a.ab.id,mon=cm();
  if(id==='mend'){for(const p of G.players){a.pl.st.heal+=Math.min(m.heal,p.mhp-Math.max(0,p.hp));p.hp=Math.min(p.mhp,p.hp+m.heal);float(laneX(p),TY,'+'+m.heal,'#5fa596');ev('heal',{pl:p})}}
  else if(id==='anthem'){for(const p of G.players){p.buff=true;float(laneX(p),TY,'+50%','#f0cc5c');ev('heal',{pl:p,col:'#f0cc5c'});if(m.encore&&p.hp>0)p.hp=Math.min(p.mhp,p.hp+m.encore)}}
  else if(id==='lull'){G.ward=Math.min(G.ward,.5);say('The monsters grow drowsy. They hit half as hard this round.');for(const q of alive())ev('monFlinch',{uid:q.uid,dmg:0,col:'#f0cc5c'})}
  else if(id==='rally'){for(const p of G.players){if(p===a.pl||p.hp<=0||p.fired)continue;(p.bag=p.bag||[]).push(p.owned[0]||0);float(laneX(p),TY,'+1 ball','#f0cc5c');ev('heal',{pl:p,col:'#f0cc5c'})}}
  else if(id==='grounds'&&mon){mon.terr=null;G.terr=null;for(const q of mon.sand)q.on=false;G.boardVer++;say('The course is swept and drained.');ev('boon',{})}
  else if(id==='flag'&&mon){const hs=mon.holes.filter(h=>h.armor>0).sort((p,q)=>q.dmg-p.dmg);if(hs.length){const h=hs[0];h.armor=0;burst(h.x,h.y,'#d8cfba',20);float(h.x,h.y,'lid shot off','#d8cfba');ev('ring',{x:h.x,y:h.y,col:'#8fd88a',R:80});G.boardVer++}else say('There is no lid left to shoot off.')}
  else if(id==='crescendo'){let n=0;for(const p of G.players)if(p.hp>0&&p!==a.pl){if(p.fired){p.fired=false;spin(p);n++}else if(!p.extra)p.extra=1;ev('heal',{pl:p,col:'#ff9a3a'})}ev('boon',{});say(`${who(a.pl)} plays a Crescendo. Everyone attacks again.`.replace(/^t/,'T'))}
  else if(id==='bash'&&mon){mon.stun=true;say(`${mon.name} is stunned.`);ev('monFlinch',{uid:mon.uid,dmg:0,col:'#c9d2de'});ev('shake',{v:.6})}}
function launch(a){
  const m=mods(a.pl),mon=cm(),id=a.ab.id;if(a.ab.freeze&&mon)mon.freeze=true;
  let fan=a.ab.fan||[0],shots=a.ab.shots||1;if(id==='volley'&&m.fourth)fan=[-12,-4,4,12];if(id==='note'&&m.chorus)fan=[-5,5];if(id==='stream'&&m.surge)shots=7;if(id==='rain'&&m.quiver)fan=[-18,-12,-6,0,6,12,18];
  const one=(t,off,k)=>G.pending.push({t,pl:a.pl,ab:a.ab,ang:a.ang+off+(a.ab.jit?(Math.random()*2-1)*a.ab.jit:0),pow:a.pow,rp:a.rp||0,mult:a.mult*k,small:a.small||1,sure:a.sure,fb:a.fb||0});
  for(let i=0;i<shots;i++)for(const off of fan)one(i*(a.ab.gap||0),off,1);
  if(id==='quick'&&m.twin)one(.4,0,.5);
  if(a.twice){const n=G.pending.length;for(let i=0;i<n;i++){const q=G.pending[i];G.pending.push(Object.assign({},q,{t:q.t+.7}))}}}                 // a Twinning Mirror looses the whole attack again
function spawn(p){
  const C=G.C,rmp=O.RAMPS[p.rp||0],m=p.ab.m,md=mods(p.pl),x=launchX(p.pl),sk=O.SKINS[p.pl.skin],col=(sk&&sk.col)||CLASSES[p.pl.cls].col,id=p.ab.id;
  const sz=Math.max(1,O.mSize(m.r)-(md.sizeDown||0)-(p.small<=.5?2:p.small<1?1:0)),r=Math.min(m.r,[0,11,16,30][sz]),v=O.strokeV(O.powD(C.len,p.pow),rmp),a=p.ang*DEG,ty=O.COURSE.TEE;
  let mult=m.mult*p.mult*md.dmg;if(p.ab.id==='quick')mult*=md.draw;if(m.homing&&md.orb>1)mult*=1.4;if(sz===1)mult*=md.focus;
  G.marbles.push({id:++G.mid,x,y:ty,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r,size:sz,mult,heavy:m.heavy,sunder:m.sunder,hymn:m.hymn,homing:m.homing,ram:m.ram,skim:m.skim,arc:m.arc||0,cleave:m.cleave||0,
    mark:m.mark,sure:m.sure||p.sure,pierce:m.pierce,split:m.split,shatter:m.shatter,chain:0,leech:m.leech||0,vuln:m.vuln,weak:m.weak,pl:p.pl,md,
    ric:m.ric||0,burn:p.fb||m.burn||((id==='note'&&md.kindle)||(id==='stream'&&md.ember)?.4:0),settle:m.settle||0,seek:m.seek||0,splash:m.splash||0,quake:m.quake||0,glow:sk&&sk.glow||'',
    capK:md.capv*(m.capx||1),z:rmp.fly?.1:0,vz:rmp.fly?v*rmp.tan:0,keep:rmp.k==='high'?.22:.62,fly:rmp.fly?1:0,in:null,still:0,pull:360*md.orb,burst:md.burst,col,lane:LANES[p.pl.slot],age:0,told:null,skips:0});
  burst(x,ty,col,16);ev('ring',{x,y:ty,col,R:70});ev('shake',{v:.2});ev('launch',{cls:p.pl.cls,r:m.r})}
/* a Prism ball breaks into three the first time it strikes something solid */
function splitM(m){if(!m.split)return;m.split=0;m.r=Math.min(m.r,8);const sp=Math.hypot(m.vx,m.vy)||1;burst(m.x,m.y,m.col,14);
  for(const da of[-.5,.5]){const c=Math.cos(da),s2=Math.sin(da);G.marbles.push(Object.assign({},m,{id:++G.mid,vx:(m.vx*c-m.vy*s2),vy:(m.vx*s2+m.vy*c),told:null,age:m.age,path:null}))}}
function collideMarbles(){
  const a=G.marbles;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const p=a[i],q=a[j];if(p.dead||q.dead||p.z<-4||q.z<-4||Math.abs(p.z-q.z)>p.r+q.r)continue;
    const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),min=p.r+q.r;if(d>=min||d<1e-4)continue;const nx=dx/d,ny=dy/d,mp=p.r*p.r*p.r,mq=q.r*q.r*q.r,pen=min-d;
    p.x-=nx*pen*mq/(mp+mq);p.y-=ny*pen*mq/(mp+mq);q.x+=nx*pen*mp/(mp+mq);q.y+=ny*pen*mp/(mp+mq);const rv=(q.vx-p.vx)*nx+(q.vy-p.vy)*ny;if(rv>=0)continue;
    const jj=-(1.85)*rv/(1/mp+1/mq);p.vx-=jj/mp*nx;p.vy-=jj/mp*ny;q.vx+=jj/mq*nx;q.vy+=jj/mq*ny;p.bn=(p.bn||0)+1;q.bn=(q.bn||0)+1;ev('tick',{x:p.x+nx*p.r,y:p.y+ny*p.r,n:Math.max(p.bn,q.bn),k:'clack'})}}
function win(){G.phase='won';G.deathT=0;loadBoard(-1);G.active=-1;G.queue=[];saveStash()}
function sweep(){for(const m of G.mons)if(m.hp<=0&&!m.dead){if(G.practice){m.hp=m.max;say(`${m.name} is stood back up.`);continue}m.dead=true;G.stash.kills[m.id]=(G.stash.kills[m.id]||0)+1;ev('monDie',{uid:m.uid});say(`${m.name} is destroyed.`)}return !alive().length}
function damageMon(d,x,y,col,mon){
  const here=!mon||mon===cm();mon=mon||cm();if(!mon||d<=0||mon.hp<=0)return 0;d=Math.max(1,Math.round(d*(mon.vuln||1)*(mon.guard===G.round?(mon.guardK||.5):1)));const was=mon.hp;
  mon.hp=Math.max(0,mon.hp-d);if(here){float(x,y,'-'+d,col||'#fff3e6');if(G.cine)G.cine.dmg+=d}else ev('monFlinch',{uid:mon.uid,dmg:d,col:col||'#fff3e6'});
  if(mon.hp<=0){if(here)burst(MX(),MY(),'#d2483a',80);return was}
  if(!mon.enraged&&mon.rank!=='lesser'&&mon.hp<=mon.max/2){mon.enraged=true;
    if(mon.id==='vharn'){mon.bumps.forEach(b=>b.on=true);mon.divots.forEach(b=>b.on=true);mon.holes.forEach(h=>h.armor=h.armor0);G.boardVer++;say('Vharn howls. Bone knits back over every wound.')}
    else say(`${mon.name} is enraged and strikes harder.`);
    ev('enrage',{uid:mon.uid})}
  return d}
function bounce(m,nx,ny,rest){const vn=m.vx*nx+m.vy*ny;if(vn<0){m.vx-=(1+rest)*vn*nx;m.vy-=(1+rest)*vn*ny;return vn<-60}return false}
/* A ball that has dropped into a hole wounds the monster. */
function sinkInto(m,h,hx,hy){
  const mon=cm(),md=m.md;let k=m.mult*(h.mark||1);if(mon){k*=mon.rank==='lesser'?md.culler:md.slayer;if(mon.hp<=mon.max/2)k*=md.exec}
  if(Math.random()<md.crit){k*=2;float(hx,hy-34,'critical','#f0cc5c')}
  const bn=Math.min(4,m.bn||0);k*=1+(m.ric+md.ricb)*bn;
  let weak=false;if(mon&&mon.wk>=0&&mon.holes[mon.wk]===h){weak=true;mon.wk=-1;k*=2*md.keen;float(hx,hy-106,'weak point','#ffd24a')}
  G.combo++;const chain=Math.min(5,G.combo-1),tch=Math.min(10,m.bn||0),trick=tch>=5?2:tch>=2?1:0;const full=!!m.fly;k*=(1+.1*chain)*(full?md.full:1);if(full)float(hx,hy-82,'on the full','#f0cc5c');          // a chain of sinks pays extra, and so does every thing the ball touched on its way in
  if(m.by&&m.by!==m.pl&&G.players.includes(m.by)){k*=1.25;m.by.st.assists=(m.by.st.assists||0)+1;float(hx,hy-154,'assist: '+CLASSES[m.by.cls].animal,'#9fd0ff')}
  if(mon&&mon.sg>=0&&mon.holes[mon.sg]===h){mon.sg=-1;mon.blunt=true;if(mon.intent){if(!mon.intent.pend)mon.intent.dmg=Math.max(1,Math.ceil(mon.intent.dmg/2));mon.intent.b=1}float(hx,hy-130,'strike blunted','#ff9a7a');say(`${mon.name}'s strike is blunted: it will land at half weight.`);ev('blunt',{uid:mon.uid,x:hx,y:hy})}
  if(mon&&mon.locks&&!mon.coreT){const li=mon.locks.findIndex(i=>mon.holes[i]===h);if(li>=0&&!(mon.lk&(1<<li))){mon.lk|=1<<li;
      if(mon.lk===3){mon.coreT=3;const c=mon.holes[mon.core];c.armor=0;G.boardVer++;const[cx2,cy2]=wpos(c.x,c.y);float(cx2,cy2-40,'the core is open','#9fd0ff');say(`Both locks are broken. ${mon.name}'s core stands open until the end of next round.`);ev('core',{x:cx2,y:cy2})}
      else{float(hx,hy-130,'lock broken: one more','#9fd0ff');ev('lock',{x:hx,y:hy})}}}
  const dmg=Math.round(h.dmg*k);if(m.mark)h.mark=md.markx;G.stop=G.marbles.some(q=>q!==m&&!q.dead)?0:dmg>=20?.16:.07;        // no freeze while other balls are still rolling
  
  ev('sink',{x:hx,y:hy,tier:h.tier,dmg,combo:G.combo,trick,col:TIER[h.tier]});const ps=m.pl.st;ps.sinks++;if(trick)ps.trick++;
  burst(hx,hy,TIER[h.tier],26);ev('ring',{x:hx,y:hy,col:TIER[h.tier],R:90});ev('shake',{v:Math.min(1,dmg/40)});const dealt=damageMon(dmg,hx,hy,TIER[h.tier]);m.dead=true;m.pl.st.dmg+=dealt;m.pl.st.best=Math.max(m.pl.st.best,dealt);if(G.cine)G.cine.sinks=(G.cine.sinks||0)+1;

  if(mon&&dealt>0&&mon.hp>0){const b=m.burn||(G.relics.includes('ember')?.3:0);if(b){const d=Math.max(2,Math.round(dealt*b*md.pyre/3));if(!mon.burn||mon.burn.d<=d){mon.burn={d,t:3};float(hx,hy+58,'burning','#ff7a2a')}}}
  if(mon&&m.splash&&dealt>0){const others=G.holes.filter(o=>o!==h&&!lidOn(o));for(const o of shuffle(others).slice(0,2)){const[ox,oy]=wpos(o.x,o.y),d2=Math.round(o.dmg*m.mult*m.splash);burst(ox,oy,m.col,12);ev('ring',{x:ox,y:oy,col:m.col,R:50});m.pl.st.dmg+=damageMon(d2,ox,oy,m.col)}}
  if(mon&&dealt>0){if(m.vuln&&!mon.vuln){mon.vuln=1.25;float(hx,hy+34,'exposed','#f0cc5c')}if(m.weak&&!mon.weak){mon.weak=.6;float(hx,hy+34,'hamstrung','#8fd88a')}
    if(m.arc)for(const o of G.holes){if(o===h||lidOn(o)||Math.hypot(o.x-h.x,o.y-h.y)>150)continue;const d2=Math.round(o.dmg*m.mult*m.arc);burst(o.x,o.y,'#9fd0ff',12);ev('ring',{x:o.x,y:o.y,col:'#9fd0ff',R:50});m.pl.st.dmg+=damageMon(d2,o.x,o.y,'#9fd0ff')}
    if(m.cleave){let b=null,bd=1e9;for(const o of G.holes){if(o===h||lidOn(o))continue;const d=Math.hypot(o.x-h.x,o.y-h.y);if(d<bd){bd=d;b=o}}if(b){const d2=Math.round(b.dmg*m.mult*m.cleave);burst(b.x,b.y,m.col,14);ev('ring',{x:b.x,y:b.y,col:m.col,R:60});m.pl.st.dmg+=damageMon(d2,b.x,b.y,m.col)}}
    if(m.leech&&m.pl.hp>0){const hl=Math.round(dealt*m.leech);m.pl.hp=Math.min(m.pl.mhp,m.pl.hp+hl);float(laneX(m.pl),TY,'+'+hl,'#5fa596');ev('heal',{pl:m.pl})}}}
/* Ball physics on a course. Balls roll with friction on the turf, fly when chipped or lobbed, bounce off rails, posts, lids and the moving parts,
   and are drawn into the dish round any open hole they fit. A slow ball over a hole drops in; a fast one lips out and is turned aside. */
const KICK=470;
const fitsH=(m,h)=>O.fitsSize(m.size,h.size);
const fits=fitsH;
O.holeR=(m,h)=>h.rad;
const lidOn=h=>h.armor>0||(!!h.shut&&O.shutAt(h,G.ck));
function hitLid(m,h,d,dx,dy){                  // a ball strikes an iron lid: heavy balls break one, Shatter and the Hymn lift them all
  if(m.lidT>0)return;m.lidT=.25;const mon=cm();
  h.armor=m.hymn||m.shatter||G.relics.includes('anvil')?0:h.armor-1;if(m.hymn&&m.md.reson)damageMon(m.md.reson,h.x,h.y,'#f0cc5c');
  burst(h.x,h.y,mon?MONSTERS[mon.id].theme:'#aaa',16);float(h.x,h.y,h.armor>0?'lid cracked':'lid broken','#d8cfba');ev('shake',{v:.25});G.boardVer++;
  if(m.hymn||m.shatter){}else if(m.heavy&&h.armor<=0){m.vx*=.75;m.vy*=.75}
  else if(d>0){const nx=-dx/d,ny=-dy/d;m.x=h.x+nx*(h.rad+m.r+.5);m.y=h.y+ny*(h.rad+m.r+.5);bounce(m,nx,ny,.5);m.bn=(m.bn||0)+1;splitM(m)}}
function inSpot(m,k){const mon=cm(),t=mon&&mon.terr;if(!t||t.k!==k)return null;for(const s of t.spots)if(Math.hypot(m.x-s.x,m.y-s.y)<s.r)return s;return null}
function stepMarble(m,dt){
  if(m.path!==null){m.pt=(m.pt||0)+dt;if(m.pt>=.035){m.pt=0;const P=m.path||(m.path=[]);if(P.length<500)P.push([Math.round(m.x),Math.round(m.y),Math.round(m.off?m.z:Math.max(0,m.z))])}}
  const C=G.C,K=O.COURSE,md=m.md,mon=cm(),t=G.ck;m.age+=dt;m.near=false;m.in=null;if(m.lidT>0)m.lidT-=dt;if(!C){m.dead=true;return}
  const ter=mon&&mon.terr;
  /* the crosswind blows over the middle of the course, harder on a ball in the air */
  if(ter&&ter.k==='gale'&&m.y>280&&m.y<C.len-180)m.vx+=ter.dir*(70+Math.min(160,m.z*1.2))*dt;
  /* in the air: nothing on the ground touches it but the rails */
  /* over the edge: it keeps falling past the board and is lost */
  if(m.off){m.vz-=GRAV*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.z+=m.vz*dt;m.offT+=dt;if(m.offT>.55)m.dead=true;return}
  if(m.z>0||m.vz>0){m.vz-=GRAV*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.z+=m.vz*dt;if(!offBoard(m,C))rails(m,C,m.z);
    if(m.z<=0&&offBoard(m,C)){m.off=1;m.offT=0;m.vx*=.8;m.vy*=.8;m.vz=Math.min(0,m.vz);float(m.x,m.y,'off the edge','#8f8597');ev('miss',{});return}
    if(m.z<=0){m.z=0;const hit=-m.vz;m.vz=0;
      for(const h of G.holes){if(lidOn(h)||!fitsH(m,h)||m.hymn)continue;if(Math.hypot(m.x-h.x,m.y-h.y)<h.rad-m.r*.2){sinkInto(m,h,h.x,h.y);return}}       // dropped straight in from the air
      if(m.fly){m.vx*=m.keep;m.vy*=m.keep;m.fly=0}
      if(hit>260){m.vz=hit*.28;burst(m.x,m.y,'#b8a890',Math.min(14,Math.round(hit/50)))}ev('tick',{x:m.x,y:m.y})}
    return}
  if(ter&&ter.k==='rift'){const s=inSpot(m,'rift');if(s){if(m.skim&&Math.hypot(m.vx,m.vy)>120){m.vz=160;m.z=.1;m.skips++;m.mult*=1.4;burst(m.x,m.y,'#7ab8e0',12);float(m.x,m.y,'skip!','#9fd0ff');ev('tick',{x:m.x,y:m.y})}
      else{burst(m.x,m.y,'#5a9ad0',18);float(m.x,m.y,'into the water','#9fd0ff');ev('miss',{});m.dead=true;return}}}
  /* rolling: friction, more in sand; gravel knocks the ball about */
  let sp=Math.hypot(m.vx,m.vy),fr=K.FR*(sp<200?md.bspin:1);
  for(const q of mon?mon.sand:[]){if(!q.on||Math.hypot(m.x-q.x,m.y-q.y)>=q.r)continue;if(m.sunder||m.hymn){q.on=false;G.boardVer++;burst(q.x,q.y,'#c9b080',14);continue}if(!m.pierce&&!md.iron){fr*=4.2;if(!m.mired){m.mired=1;float(m.x,m.y,'in the sand','#c9b080')}}}
  if(ter&&ter.k==='mire'&&inSpot(m,'mire')&&!m.pierce&&!md.iron){fr*=4.2;if(!m.mired){m.mired=1;float(m.x,m.y,'in the sand','#c9b080')}}
  if(ter&&ter.k==='rubble'&&inSpot(m,'rubble')&&!md.iron&&sp>40&&Math.random()<dt*14){const q=(Math.random()-.5)*.6,c=Math.cos(q),sn=Math.sin(q),vx=m.vx;m.vx=(vx*c-m.vy*sn)*.94;m.vy=(vx*sn+m.vy*c)*.94;ev('tick',{x:m.x,y:m.y})}
  if(sp>0){const ns=Math.max(0,sp-fr*dt);m.vx*=ns/sp;m.vy*=ns/sp;sp=ns}
  if(m.homing){let best=null,bd=320;for(const h of G.holes){if(lidOn(h)||!fitsH(m,h))continue;const d=Math.hypot(h.x-m.x,h.y-m.y);if(d<bd){bd=d;best=h}}
    if(best&&bd>1){m.vx+=(best.x-m.x)/bd*m.pull*dt;m.vy+=(best.y-m.y)/bd*m.pull*dt;m.pulled=true}else m.pulled=false}
  /* holes */
  if(!m.hymn)for(const h of G.holes){const dx=h.x-m.x,dy=h.y-m.y,d=Math.hypot(dx,dy),R=h.rad+K.IND*md.wide;if(d>R+m.r)continue;
    if(lidOn(h)){if(d<h.rad+m.r*.6){if(h.armor>0)hitLid(m,h,d,dx,dy)}continue}
    if(!fitsH(m,h)){if(d<h.rad&&m.told!==h){m.told=h;float(h.x,h.y,'grated: too small','#c9a04c')}continue}
    if(m.sure&&d<h.rad&&m.sured!==h){m.sured=h;m.vx*=.12;m.vy*=.12;sp*=.12}
    if(d<R){const q=1-Math.max(0,d-h.rad*.35)/(h.rad*.65+K.IND*md.wide),a=K.PULL*md.pull*(.35+.65*q)*dt/(d||1);m.vx+=dx*a;m.vy+=dy*a;m.in=h}
    if(d<h.rad+52&&sp<430)m.near=true;
    const cap=(K.CAP+h.rad*3)*(m.capK||1);
    if(d<h.rad-m.r*.25&&(sp<cap||m.sure)){sinkInto(m,h,h.x,h.y);return}
    if(d<h.rad*.75&&m.lip!==h){m.lip=h;const q=(Math.random()<.5?-1:1)*(.25+Math.random()*.35),c=Math.cos(q),sn=Math.sin(q),vx=m.vx;m.vx=(vx*c-m.vy*sn)*.82;m.vy=(vx*sn+m.vy*c)*.82;float(h.x,h.y,'lipped out','#c9bfae');ev('tick',{x:h.x,y:h.y,k:'rim'})}}
  /* posts */
  for(const b of G.bumps){if(!b.on||m.pierce)continue;const dx=m.x-b.x,dy=m.y-b.y,d=Math.hypot(dx,dy),min=b.rad+m.r;
    if(d<min&&d>0){
      if(m.sunder||m.hymn){b.on=false;G.boardVer++;burst(b.x,b.y,'#d8cfba',12);if(m.sunder){m.vx*=.9;m.vy*=.9}continue}
      if(m.quake){const R=m.quake;m.quake=0;for(const q of G.bumps){if(q.on&&Math.hypot(q.x-b.x,q.y-b.y)<R){q.on=false;burst(q.x,q.y,'#d8cfba',10)}}for(const q of mon?mon.sand:[])if(q.on&&Math.hypot(q.x-b.x,q.y-b.y)<R+q.r)q.on=false;G.boardVer++;ev('ring',{x:b.x,y:b.y,col:'#d8cfba',R});ev('shake',{v:.7});float(b.x,b.y,'ground broken','#d8cfba');m.vx*=.85;m.vy*=.85;continue}
      const nx=dx/d,ny=dy/d;m.x=b.x+nx*min;m.y=b.y+ny*min;bounce(m,nx,ny,K.BUMP_E);m.bn=(m.bn||0)+1;
      if(b.kick&&(m.kk||0)<6){m.kk=(m.kk||0)+1;m.vx+=nx*KICK;m.vy+=ny*KICK;ev('kick',{x:b.x,y:b.y,n:m.bn});burst(b.x,b.y,'#ffb54a',10)}else ev('tick',{x:b.x,y:b.y,n:m.bn});
      if(m.seek&&!m.homing){m.homing=1;m.pull=620}splitM(m)}}
  /* stone blocks (a raised shield) */
  for(const q of mon?mon.blocks:[]){if(!q.on)continue;const px=clamp(m.x,q.x-q.w/2,q.x+q.w/2),py=clamp(m.y,q.y-q.h/2,q.y+q.h/2),dx=m.x-px,dy=m.y-py,d=Math.hypot(dx,dy);
    if(d<m.r&&d>0){if(m.sunder||m.hymn||m.ram){q.on=false;G.boardVer++;burst(q.x,q.y,'#aeb4bd',20);float(q.x,q.y,'shield broken','#aeb4bd');continue}
      const nx=dx/d,ny=dy/d;m.x=px+nx*m.r;m.y=py+ny*m.r;bounce(m,nx,ny,.55);m.bn=(m.bn||0)+1;ev('tick',{x:px,y:py});splitM(m);
      if(--q.hp<=0){q.on=false;G.boardVer++;burst(q.x,q.y,'#aeb4bd',20);float(q.x,q.y,'shield broken','#aeb4bd')}else{burst(px,py,'#aeb4bd',8);float(px,py,'shield cracked','#aeb4bd')}}}
  /* the moving part */
  const mv=C.mv;
  if(mv&&!mv.broken&&mv.k==='mill'&&!m.pierce){const an=O.millAng(mv,t);for(const s0 of[0,Math.PI]){const ex=mv.x+Math.cos(an+s0)*mv.len,ey=mv.y+Math.sin(an+s0)*mv.len,vx=ex-mv.x,vy=ey-mv.y,L2=vx*vx+vy*vy,u=clamp(((m.x-mv.x)*vx+(m.y-mv.y)*vy)/L2,0,1),px=mv.x+vx*u,py=mv.y+vy*u,dx=m.x-px,dy=m.y-py,d=Math.hypot(dx,dy),rr=m.r+9;
      if(d<rr&&d>0){if(m.ram){mv.broken=true;G.boardVer++;burst(mv.x,mv.y,'#8a6a44',40);float(mv.x,mv.y,'windmill smashed','#d8cfba');ev('shake',{v:.7});break}
        const nx=dx/d,ny=dy/d,ux=-(py-mv.y)*mv.w,uy=(px-mv.x)*mv.w;m.x=px+nx*rr;m.y=py+ny*rr;m.vx-=ux;m.vy-=uy;bounce(m,nx,ny,.7);m.vx+=ux;m.vy+=uy;if(!(m.armT>0)){m.armT=.3;m.bn=(m.bn||0)+1;ev('tick',{x:px,y:py,n:m.bn,k:'arm'})}}}}
  if(m.armT>0)m.armT-=dt;
  if(mv&&!mv.broken&&mv.k==='boulder'&&!m.pierce){const bx=O.boulderX(C,mv,t),dx=m.x-bx,dy=m.y-mv.y,d=Math.hypot(dx,dy),rr=mv.rad+m.r;
    if(d<rr&&d>0){if(m.ram){mv.broken=true;G.boardVer++;burst(bx,mv.y,'#6b6670',40);float(bx,mv.y,'boulder smashed','#d8cfba');ev('shake',{v:.7})}
      else{const nx=dx/d,ny=dy/d;m.x=bx+nx*rr;m.y=mv.y+ny*rr;bounce(m,nx,ny,.85);m.vx+=nx*120;m.bn=(m.bn||0)+1;ev('tick',{x:bx,y:mv.y,n:m.bn})}}}
  m.x+=m.vx*dt;m.y+=m.vy*dt;rails(m,C);
  /* at rest: a Hymn bursts, a Singularity is drawn into a hole close by, anything else is a miss and fades */
  sp=Math.hypot(m.vx,m.vy);m.still=sp<10?(m.still||0)+dt:0;
  if((m.still>.2&&!m.pulled)||m.age>14){
    if(m.hymn){burst(m.x,m.y,'#f0cc5c',36);ev('ring',{x:m.x,y:m.y,col:'#f0cc5c',R:m.burst});const cnt=()=>G.holes.filter(h=>h.armor>0).length+G.bumps.filter(b=>b.on).length+(mon?mon.sand.filter(b=>b.on).length+mon.blocks.filter(b=>b.on).length:0),n0=cnt();
      for(const h of G.holes)if(h.armor>0&&Math.hypot(h.x-m.x,h.y-m.y)<m.burst){h.armor=0;burst(h.x,h.y,'#d8cfba',10)}
      for(const b of G.bumps)if(b.on&&Math.hypot(b.x-m.x,b.y-m.y)<m.burst){b.on=false;burst(b.x,b.y,'#d8cfba',8)}
      if(mon){for(const b of mon.sand)if(b.on&&Math.hypot(b.x-m.x,b.y-m.y)<m.burst+b.r)b.on=false;for(const b of mon.blocks)if(b.on&&Math.hypot(b.x-m.x,b.y-m.y)<m.burst+40){b.on=false;burst(b.x,b.y,'#aeb4bd',16)}
        if(mon.terr){mon.terr.spots=mon.terr.spots.filter(q=>Math.hypot(q.x-m.x,q.y-m.y)>m.burst+q.r);if(!mon.terr.spots.length&&mon.terr.k!=='gale'){mon.terr=null;G.terr=null}float(m.x,m.y-44,'ground cleared','#f0cc5c')}}
      G.boardVer++;if(m.md.reson){const n1=cnt();if(n0>n1)damageMon((n0-n1)*m.md.reson,m.x,m.y,'#f0cc5c')}}
    else{if(m.settle){let best=null,bd=m.settle;for(const h of G.holes){if(lidOn(h)||!fitsH(m,h))continue;const d=Math.hypot(h.x-m.x,h.y-m.y);if(d<bd+h.rad){bd=d;best=h}}
        if(best){burst(m.x,m.y,m.col,18);ev('ring',{x:best.x,y:best.y,col:m.col,R:70});float(best.x,best.y,'drawn in','#a98bf0');m.x=best.x;m.y=best.y;sinkInto(m,best,best.x,best.y);return}}
      float(m.x,m.y,m.in?'stopped short':'miss','#8f8597');ev('miss',{})}
    m.dead=true}
}
/* the rails down both sides follow the fairway; a bend turns the bounce with it */
/* the rails stand RAIL_H high (the far wall RAIL_HB): a ball in the air clears them and can carry off the board; on the ground they always hold it */
const RAIL_H=20,RAIL_HB=30;
function offBoard(m,C){const y=Math.max(0,Math.min(C.len,m.y));return m.y>C.len||m.y<-40||Math.abs(m.x-C.cx(y))>C.half(y)}
function rails(m,C,z){z=z||0;if(z>=RAIL_HB)return;const K=O.COURSE,c=C.cx(m.y),hw=C.half(m.y),e=2,dc=(C.cx(m.y+e)-C.cx(m.y-e))/(2*e),dh=(C.half(m.y+e)-C.half(m.y-e))/(2*e);let hit=false;
  if(z<RAIL_H&&m.x-m.r<c-hw){let nx=1,ny=-(dc-dh);const l=Math.hypot(nx,ny);nx/=l;ny/=l;m.x=c-hw+m.r;hit=bounce(m,nx,ny,K.WALL_E)}
  if(z<RAIL_H&&m.x+m.r>c+hw){let nx=-1,ny=dc+dh;const l=Math.hypot(nx,ny);nx/=l;ny/=l;m.x=c+hw-m.r;hit=bounce(m,nx,ny,K.WALL_E)||hit}
  if(m.y+m.r>C.len){m.y=C.len-m.r;hit=bounce(m,0,-1,K.WALL_E)||hit}
  if(z<RAIL_H&&m.y-m.r<-40){m.y=-40+m.r;bounce(m,0,1,K.WALL_E)}
  if(hit&&!(m.railT>0)){m.railT=.2;m.bn=(m.bn||0)+1;ev('tick',{x:m.x,y:m.y,n:m.bn,k:'rim'});if(m.seek&&!m.homing){m.homing=1;m.pull=620}splitM(m)}
  if(m.railT>0)m.railT-=1/600}
function wakeRest(){}
/* ----- the monsters' turn: each living monster acts in order ----- */
function beginMonsters(){
  loadBoard(-1);G.active=-1;G.phase='boss';G.actor=-1;nextActor()}
function pickTarget(party,lesser){const w=party.map(p=>lesser&&mods(p).guard?4:1);let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<party.length;i++){r-=w[i];if(r<=0)return party[i]}return party[0]}
function nextActor(){
  const party=G.players.filter(p=>p.hp>0);let i=G.actor+1;
  for(;i<G.mons.length;i++){const m=G.mons[i];if(m.dead||m.hp<=0)continue;if(m.stun){m.stun=false;say(`${m.name} is stunned and cannot attack.`);ev('monFlinch',{uid:m.uid,dmg:0,col:'#c9d2de'});continue}break}
  if(i>=G.mons.length||!party.length){endMonsters();return}
  G.actor=i;G.bossT=-O.FOE_SPIN-O.FOE_HOLD;const mon=G.mons[i],d=MONSTERS[mon.id];if(!mon.intent||mon.intent.pend)mon.intent=pullFor(mon);const it=mon.intent,tp=it.t?(party.find(p=>p.id===it.t)||pickTarget(party,mon.rank==='lesser')):null;
  const W={lesser:1.0,mini:1.6,boss:2.0}[mon.rank]||1.4,A={lesser:.8,mini:1.2,boss:1.4}[mon.rank]||1;
  const tp2=it.t2?party.find(p=>p.id===it.t2&&p!==tp)||null:null;mon.atk={t:-O.FOE_SPIN-O.FOE_HOLD,an0:false,W,S:.5,A,dur:W+.5+A,done:false,ann:false,target:tp,t2:tp2,x:it.x||'',dmg:it.dmg||0,it:mon.intent};mon.intent=null;say(`${mon.name} pulls its reels…`)}
function monAct(mon){
  const party=G.players.filter(p=>p.hp>0);if(!party.length)return;
  const hurt=(p,v)=>{const md=mods(p);if(md.barrier&&!p.barUsed){p.barUsed=true;float(laneX(p),TY,'barrier','#a98bf0');ev('heal',{pl:p,col:'#a98bf0'});return 0}
    v=Math.max(1,Math.round(v*DMGK()*md.take*G.ward*(mon.weak||1)*(mon.blunt?.5:1)));if(md.ward&&!p.wardUsed){p.wardUsed=true;v=Math.max(1,Math.round(v/2));float(laneX(p),TY-40,'warded','#a98bf0')}
    p.hp=Math.max(0,p.hp-v);p.st.taken+=v;if(p.hp<=0&&G.relics.includes('idol')&&!G.idolUsed){G.idolUsed=true;p.hp=Math.round(p.mhp/3);say(`The Bone Idol cracks. ${who(p)} stands back up.`.replace('. t','. T'));ev('heal',{pl:p,col:'#f0cc5c'})}ev('hurt',{pl:p,v,dead:p.hp<=0});
    if(md.thorns&&mon.hp>1){mon.hp=Math.max(1,mon.hp-md.thorns);ev('monFlinch',{uid:mon.uid,dmg:md.thorns,col:'#c9d2de'})}return v};
  const it=mon.atk.it||{mv:0,raw:MONSTERS[mon.id].hit||5,fx:'',fv:0},mv=O.movesOf(mon.id).mv[it.mv]||O.movesOf(mon.id).mv[0];
  const t=mon.atk.target&&party.includes(mon.atk.target)?mon.atk.target:null,t2=mon.atk.t2&&party.includes(mon.atk.t2)?mon.atk.t2:null;
  let tg=mv.t==='all'?party:[t,t2].filter(Boolean);if(!tg.length)tg=[pick(party)];
  let dealt=0;if(it.raw>0)for(const p of tg)dealt+=hurt(p,it.raw);
  const lid=()=>{if(G.relics.includes('salt'))return say('Grave Salt keeps the hole open.');if(G.round-(mon.lidR||-9)<3)return;mon.lidR2=G.round;const open=mon.holes.filter(h=>h.armor<=0&&!h.core).sort((a,c)=>c.dmg-a.dmg);if(open.length){open[0].armor=Math.max(1,open[0].armor0||1);G.boardVer++;float(open[0].x,open[0].y,'lidded','#c9bfae')}};
  const tri=it.pw>1.2;                 // a Triple makes every effect stronger
  switch(mv.fx){
    case'bleed':for(const p of tg)if(p.hp>0)p.dot={d:it.fv,t:tri?3:2};break;
    case'drain':if(dealt){const h=Math.round(dealt*(tri?1:.5));mon.hp=Math.min(mon.max,mon.hp+h);ev('monFlinch',{uid:mon.uid,dmg:0,col:'#5fa596'});float(MX(),MY()-120,'+'+h,'#5fa596')}break;
    case'mend':mon.hp=Math.min(mon.max,mon.hp+it.fv);float(MX(),MY()-120,'+'+it.fv,'#5fa596');break;
    case'lid':lid();if(tri)lid();if(mon.lidR2===G.round)mon.lidR=G.round;break;
    case'shield':if(mon.blocks&&mon.blocks.length){if(G.round-(mon.lidR||-9)>=3){mon.lidR=G.round;mon.blocks.forEach(w=>{w.on=true;w.hp=tri?2:1});G.boardVer++;mon.face=true}}else{lid();if(tri)lid();if(mon.lidR2===G.round)mon.lidR=G.round}break;
    case'terr':if(mon.freeze)break;if(G.relics.includes('axle')&&Math.random()<.5){say('Steady Ground holds the course.');break}mon.terr={k:mv.terr,t:tri?4:3,spots:mkSpots(mv.terr),dir:Math.random()<.5?-1:1};G.terr=mon.terr;G.boardVer++;break;
    case'shrink':for(const p of tg)(p.deb=p.deb||{}).shrink=tri?2:1;break;
    case'hex':for(const p of tg)(p.deb=p.deb||{}).hex=tri?2:1;break;
    case'rage':mon.pump=tri?2:1.5;break;
    case'guard':mon.guard=G.round+1;mon.guardK=tri?1/3:.5;break}
  const big=mon.rank!=='lesser'||mv.sp||it.pw>1.2;G.stop=big?.2:.1;G.slowT=big?.75:.4;ev('monSlam',{rank:mon.rank,uid:mon.uid,aoe:mv.t==='all'});ev('shake',{v:big?1.3:.7});ev('flash',{v:big?.5:.28});
}
/* where a monster lays its sand, gravel or water: open stretches of fairway, clear of the holes */
function mkSpots(k){const C=G.C,out=[];if(!C||k==='gale')return out;const n=k==='rift'?2:3,R=k==='rift'?50:k==='mire'?62:66;
  for(let i=0;i<300&&out.length<n;i++){const y=330+Math.random()*(C.len-580),x=C.cx(y)+(Math.random()*2-1)*Math.max(0,C.half(y)-R-12);
    if(G.holes.some(h=>Math.hypot(h.x-x,h.y-y)<h.rad+O.COURSE.IND+R)||out.some(q=>Math.hypot(q.x-x,q.y-y)<R*2.3))continue;out.push({x:Math.round(x),y:Math.round(y),r:R})}return out}
O.mkSpots=mkSpots;
function endMonsters(){
  G.actor=-1;G.ward=1;
  for(const m of alive()){m.atk=null;m.blunt=false;m.sg=-1;m.rest=[];
    if(m.coreT>0&&--m.coreT<=0){const c=m.holes[m.core];if(c){c.armor=Math.max(1,c.armor0)}m.lk=0;G.boardVer++}
    m.face=false;m.freeze=false;if(m.course.mv)m.course.mv.broken=false;          // a smashed windmill is rebuilt for the next round
    if(m.terr){if(--m.terr.t<=0){m.terr=null;G.terr=null;G.boardVer++}}}
  for(const p of G.players)if(p.dot&&p.hp>0){const v=p.dot.d;p.hp=Math.max(0,p.hp-v);p.st.taken+=v;float(laneX(p),TY-30,'bleeding','#d2483a');ev('hurt',{pl:p,v,dead:p.hp<=0});if(--p.dot.t<=0)p.dot=null}
  if(G.players.every(p=>p.hp<=0)){G.phase='lost';G.deathT=0;say('The party has fallen.');return}
  for(const m of alive())if(m.burn){const d=m.burn.d;m.hp=Math.max(0,m.hp-d);ev('monFlinch',{uid:m.uid,dmg:d,col:'#ff7a2a'});if(--m.burn.t<=0)m.burn=null}             // what is burning burns a little more
  if(sweep()){win();return}startRound()}
function updateCombat(dt){
  for(const p of G.pending){p.t-=dt;if(p.t<=0&&G.players.includes(p.pl))spawn(p)}
  G.pending=G.pending.filter(p=>p.t>0);
  {const mo=cm();if(!(mo&&mo.freeze))G.ck+=dt}
  for(let i=0;i<10;i++){for(const m of G.marbles)if(!m.dead)stepMarble(m,dt/10);wakeRest();if(G.marbles.length>1)collideMarbles()}
  for(const m of G.marbles)if(m.dead&&m.path&&m.path.length>2&&m.pl){m.path.push([Math.round(m.x),Math.round(m.y),Math.round(m.off?m.z:0)]);m.pl.trail=m.path;m.pl.trailN=(m.pl.trailN||0)+1;m.path=null}         // each fighter's last shot, drawn faintly on the big screen
  G.marbles=G.marbles.filter(m=>!m.dead);
  if(G.phase==='aim'){
    if(!G.cine&&!G.queue.length&&!G.marbles.length&&!G.pending.length){
      const w=waiting();
      if(!w.length){if(G.practice)practiceRound();else beginMonsters()}
      else{G.turnT+=dt;const here=w.filter(p=>!p.away);
        /* fighters take their shots one at a time, in party order: the shooter keeps the turn until their reels' balls are all loosed */
        let sh=G.players.find(p=>p.id===G.shooter);if(!sh||sh.fired||sh.hp<=0||(sh.away&&here.length)){const i0=sh?G.players.indexOf(sh):-1,ord=[...G.players.slice(i0+1),...G.players.slice(0,i0+1)];sh=ord.find(p=>w.includes(p)&&!p.away)||w[0];
          if(sh.id!==G.shooter){G.shooter=sh.id;G.turnT=0;if(G.players.length>1)say(`${who(sh)}'s shot.`.replace(/^t/,'T'));ev('turn',{pl:sh})}}
        if(!here.length){if(G.turnT>6){w.forEach(p=>{p.fired=true});say('The fighters who have gone quiet lose the turn.')}}                 // a phone that dropped out does not hold up the round
        else if(G.players.length>1&&!G.practice&&G.turnT>O.TURN){sh.fired=true;say(`${who(sh)} hesitates and loses the turn.`.replace(/^t/,'T'))}}}
  }else if(G.phase==='boss'){
    const mon=G.mons[G.actor];if(!mon){endMonsters();return}
    G.bossT+=dt;mon.atk.t=G.bossT;
    if(!mon.atk.an0&&G.bossT>=-O.FOE_HOLD){mon.atk.an0=true;const mv=mon.atk.it&&O.movesOf(mon.id).mv[mon.atk.it.mv];if(mv)say(`${mon.name}: ${mv.name}.`)}
    if(!mon.atk.ann&&G.bossT>=0){mon.atk.ann=true;ev('monAtk',{rank:mon.rank,uid:mon.uid,W:mon.atk.W})}
    if(!mon.atk.done&&G.bossT>mon.atk.W+mon.atk.S*.5){mon.atk.done=true;monAct(mon)}
    if(G.bossT>mon.atk.dur+.25){mon.atk=null;nextActor()}
  }
}
/* ----- attack director: cast, pan, flight, monster hit ----- */
function stage(C,st){C.st=st;C.t=0}
function afterAttack(){G.active=-1;if(sweep()){win();return}retarget();if(!G.queue.length)G.turnT=0}
/* ----- items: a free action for any fighter who has not yet acted this round ----- */
O.useItem=function(pid,i){
  const pl=G.players.find(p=>p.id===pid);i=Math.floor(num(i,-1));const id=G.items[i],it=ITEMS[id];
  if(!it||!pl||G.screen!=='combat'||G.phase!=='aim'||pl.fired||pl.hp<=0)return false;
  const quiet=!G.cine&&!G.queue.length&&!G.marbles.length&&!G.pending.length,tm=G.mons[pl.tgt];
  if((it.wheel||it.foe)&&!quiet)return false;                                 // what changes a wheel or wounds a monster waits for the shot in the air to finish
  if((it.wheel||it.tgt)&&(!tm||tm.dead))return false;if(id==='phoenix'&&!G.players.some(p=>p.hp<=0))return false;
  G.items.splice(i,1);say(`${who(pl)} uses ${it.name}.`.replace(/^t/,'T'));const heal=(p,v)=>{if(p.hp<=0)return;p.hp=Math.min(p.mhp,p.hp+v);float(laneX(p),TY,'+'+v,'#5fa596');ev('heal',{pl:p})};
  if(id==='draught')heal(pl,30);else if(id==='tonic')G.players.forEach(p=>heal(p,15));
  else if(id==='phoenix')G.players.forEach(p=>{if(p.hp<=0){p.hp=Math.round(p.mhp*.5);p.fired=true;ev('heal',{pl:p,col:'#f0cc5c'})}});
  else if(id==='smoke')G.ward=Math.min(G.ward,.5);
  else if(id==='oil'){pl.oil=1.75;ev('heal',{pl,col:'#e07b39'})}else if(id==='chalk'){pl.small=.75;ev('heal',{pl,col:'#d8cfba'})}else if(id==='magnet'){pl.sure=true;ev('heal',{pl,col:'#a98bf0'})}
  else if(id==='glass'){spin(pl);ev('heal',{pl,col:'#f0cc5c'})}
  else if(id==='whet'){pl.whet=1.3;ev('heal',{pl,col:'#c9d2de'})}
  else if(id==='net'){tm.stun=true;say(`${tm.name} is tangled and cannot attack this round.`);ev('monFlinch',{uid:tm.uid,dmg:0,col:'#c9d2de'})}
  else if(id==='mirror'){pl.twice=true;ev('heal',{pl,col:'#bcd6ff'})}
  else if(id==='salve'){heal(pl,20);for(const m of alive()){m.terr=null;for(const q of m.sand)q.on=false}G.terr=null;G.boardVer++}
  else if(id==='horn'){for(const p of G.players){p.grid=String(p.grid||'').replace(/b/g,'w');p.gn=(p.gn||0)+1;if(!p.fired)p.bag=bagOf(p);ev('heal',{pl:p,col:'#f0cc5c'})}}
  else if(id==='pick'){let n=0;for(const h of G.holes)if(h.armor>0){h.armor=0;n++;burst(h.x,h.y,'#d8cfba',16)}G.boardVer++;ev('shake',{v:.5});float(MX(),MY(),n?'armor broken':'no armor here','#d8cfba')}
  else if(id==='bomb'){const d=Math.round(8*(.5+.5*G.players.length));ev('flash',{});ev('shake',{v:.8});for(const m of alive())damageMon(d,MX(),MY(),'#ff7a2a',m===cm()?undefined:m);
    if(sweep())win();else retarget()}
  return true};
/* ----- trap and event tiles: see minigames.js. The rules here lend it what it needs. ----- */
O._sim={stepMarble,offBoard,rails,rollUps,say,ev,addItem,anyItem,offerPath,offerUpgrades,setDec,shuffle,has,saveStash,mods,pick,clamp,float,burst};
function updateCine(dt){
  let C=G.cine;
  if(!C){
    if(G.screen!=='combat'||G.phase!=='aim'||G.marbles.length||G.pending.length)return;
    while(G.queue.length){const a=G.queue.shift();if(!G.players.includes(a.pl)||a.pl.hp<=0)continue;
      if(a.tgt>=0){const m=G.mons[a.tgt];if(!m||m.dead){const al=alive();if(!al.length)continue;a.tgt=G.mons.indexOf(al[0])}if(G.cur!==a.tgt)loadBoard(a.tgt)}       // a shot loosed at a monster that has since fallen goes to the next
      if(a.pl.buff&&!a.ab.instant){a.mult*=1.5;a.pl.buff=false}
      const an=a.ang*DEG,mon=cm(),key=a.pl.id+'|'+a.ab.id,rep=!!G.seen[key];G.seen[key]=1;G.active=G.players.indexOf(a.pl);G.inspect=false;
      const md=mods(a.pl),aid=a.ab.id;let nm=(a.ab.fan||[0]).length*(a.ab.shots||1);if((aid==='volley'&&md.fourth)||(aid==='note'&&md.chorus)||(aid==='stream'&&md.surge)||(aid==='quick'&&md.twin)||(a.ab.m&&a.ab.m.split))nm=2;
      G.cine={st:'cast',t:0,atk:a,dmg:0,mon:mon?mon.uid:0,dir:[Math.cos(an),Math.sin(an)],d0:[Math.cos(an),Math.sin(an)],fx:launchX(a.pl),fy:O.COURSE.TEE,close:false,idle:0,rep,multi:nm>1,castT:rep?.85:1.7,panT:rep?.6:.9,hitT:2};    // the full flourish the first time an attack is used in a fight, a brisk one after
      say(`${who(a.pl)} uses ${a.ab.name}.`.replace(/^t/,'T'));ev('cast',{pl:a.pl,rep});if(!a.ab.instant){launch(a);stage(G.cine,'flight')}break}
    return}
  C.t+=dt;const a=C.atk;
  if(C.st==='cast'){if(C.t>C.castT){if(a.ab.instant){applyInstant(a);stage(C,'out')}else stage(C,'pan')}}
  else if(C.st==='pan'){if(C.t>C.panT){launch(a);stage(C,'flight')}}
  else if(C.st==='flight'){
    const al=G.marbles,m=al.length?al[Math.floor((al.length-1)/2)]:null;
    if(m){const sp=Math.hypot(m.vx,m.vy);
      if(sp>60&&!m.in){const k=Math.min(1,dt*5);C.dir[0]+=(m.vx/sp-C.dir[0])*k;C.dir[1]+=(m.vy/sp-C.dir[1])*k;const l=Math.hypot(C.dir[0],C.dir[1])||1;C.dir[0]/=l;C.dir[1]/=l}
      C.fx=m.x;C.fy=m.y;C.fz=Math.max(0,m.z);C.close=!!(m.near||m.in)}
    if(!G.marbles.length&&!G.pending.length){C.idle+=dt;if(C.idle>.6){const mon=cm();
        if(C.dmg>0&&mon){C.hitT=mon.hp<=0||C.dmg>=mon.max*.15?2:1.15;ev('monHit',{dmg:C.dmg,col:CLASSES[a.pl.cls].col,uid:mon.uid,dead:mon.hp<=0});stage(C,'hit')}else stage(C,'out')}}else C.idle=0}
  else if(C.st==='hit'){if(C.t>C.hitT)stage(C,'out')}
  else if(C.st==='out'){if(C.t>.45){if(!a.ab.instant){if(C.dmg<=0&&!a.ab.m.hymn){if(G.combo>1)ev('comboEnd',{});G.combo=0}if(C.sinks)a.pl.st.hits=(a.pl.st.hits||0)+1;a.pl.last=[a.pl.last[0]+1,C.dmg,C.sinks||0]}G.cine=null;afterAttack()}}
}
/* ----- one tick of everything ----- */
function tick(dt){
  G.clock+=dt;
  if(G.screen==='lobby'&&!G.dec&&G.players.length)setDec('start',['go','prac']);
  if(G.screen==='lobby'&&G.dec&&!G.players.length)G.dec=null;
  if(G.after){G.after.t-=dt;if(G.after.t<=0){const f=G.after.fn;G.after=null;f()}}
  if(G.travel){G.travel.t+=dt/1.7;if(G.travel.t>=1){const to=G.travel.to;G.travel=null;arrive(to)}}
  updateDec();if(G.mg&&G.screen==='map')O.mgTick(dt);
  if(G.screen!=='combat')return;
  if(G.slowT>0)G.slowT-=dt;const tense=(G.marbles.length===1&&(G.marbles[0].in||G.marbles[0].near))||G.slowT>0;G.ts+=((tense?.55:1)-G.ts)*Math.min(1,dt*9);
  if(G.phase==='intro'){if(G.introT<.05&&G.holdT<25&&O.hold&&O.hold()){G.holdT+=dt;return}G.introT+=dt;if(G.introT>(G.practice?1.6:3.4))startRound();return}     // the fight waits for its models to arrive
  if(G.phase==='won'){G.deathT+=dt;if(G.deathT>2.8){const rank=O.encRank(G.enc);
      if(rank==='boss'){const st=G.stash,r=O.runOf(G.dung),R=O.RUNS[r],last=G.dung===R[R.length-1],firstRun=!O.runDone(r);if(!st.clear.includes(G.dung))st.clear.push(G.dung);st.runs=st.runs||[];
        if(last){G.gain=Math.round(O.runGold(r,G.tier)*(G.relics.includes('purse')?1.25:1));st.gold+=G.gain;if(!st.runs.includes(r))st.runs.push(r);st.tier[R[0]]=Math.max(st.tier[R[0]]||0,G.tier+1);
          G.runEnd=true;G.newDung=firstRun&&!!O.RUNS[r+1];st.keep=null}
        else{G.gain=0;G.runEnd=false;G.newDung=false;
          st.keep={set:r,next:G.dung+1,tier:G.tier,by:G.players.reduce((a,p)=>{a[p.cls]={owned:p.owned.slice(),ups:p.ups.slice(),lv:p.lv};return a},{}),relics:G.relics.slice(),items:G.items.slice()}}
        G.finale=G.dung===O.DUNGEONS.length-1&&!st.fin;if(G.finale)st.fin=true;saveStash();O.clearRun();G.screen='result';G.result='win';G.phase='idle';ev('win',{fin:G.finale});setDec('end',last?['again']:['next','again'])}
      else{const lvl=rank==='mini'||(++G.wins%2===0);G.players.forEach(p=>{if(lvl)p.lv++;const b=p.mhp;p.mhp=maxHp(p);const hp=Math.max(p.hp,0);p.hp=Math.min(p.mhp,hp+(p.mhp-b))});
        G.phase='idle';let found='';const rw=MAP[G.node]&&MAP[G.node].rw;if(rank==='mini'||rw==='item'||G.relics.includes('satchel')||Math.random()<.4){const it=anyItem();if(addItem(it))found=` Found: ${ITEMS[it].name}.`}
        if(rw==='mend'){G.players.forEach(p=>{if(p.hp>0)p.hp=Math.min(p.mhp,p.hp+Math.round((p.mhp-p.hp)*.4))});found+=' A cache of bandages: wounds are bound.'}
        else if(rw==='coin'){const g=MAP[G.node].gold||20;G.stash.gold+=g;saveStash();found+=` A purse of ${g} gold.`}
        say((lvl?'The party grows stronger. Everyone chooses a drop.':'The way is clear. Everyone chooses a drop.')+found);offerUpgrades('drop')}}
    return}
  if(G.phase==='lost'){G.deathT+=dt;if(G.deathT>2.2){G.screen='result';G.result='lose';G.phase='idle';G.stash.keep=null;saveStash();O.clearRun();ev('lose',{});setDec('end',['restart','again'])}return}
  if(G.stop>0){G.stop-=dt;dt*=.06}                 // a beat of stillness when a ball lands a real blow
  updateCine(dt);updateCombat(dt*G.ts);
}
O.tick=tick;
/* end-of-run honours for the party */
O.awards=function(){
  const P=G.players,out=[],nm=p=>CLASSES[p.cls].animal+' '+CLASSES[p.cls].name,top=(f,min)=>{let b=null;for(const p of P)if(f(p)>(b?f(b):min||0))b=p;return b};if(!P.length)return out;
  let p=top(q=>q.st.dmg);if(p)out.push(['Wrecking Ball',nm(p),p.st.dmg+' damage dealt']);
  p=top(q=>q.st.shots>=3?(q.st.hits||0)/q.st.shots:0);if(p)out.push(['Sharpshooter',nm(p),Math.min(100,Math.round(100*(p.st.hits||0)/p.st.shots))+'% of attacks sank a ball']);
  p=top(q=>q.st.best);if(p)out.push(['Heaviest Blow',nm(p),p.st.best+' in one ball']);
  p=top(q=>q.st.trick);if(p)out.push(['Trickster',nm(p),p.st.trick+' trick shot'+(p.st.trick===1?'':'s')]);
  if(P.length>1){p=top(q=>q.st.taken);if(p)out.push(['Punching Bag',nm(p),p.st.taken+' damage taken']);p=top(q=>q.st.heal);if(p)out.push(['Lifeline',nm(p),p.st.heal+' health restored'])}
  return out};
/* The state every controller needs. Sent over presence to phones, read directly in solo. */
const mask=a=>a.map(b=>b.on?1:0).join('');
O.publicState=()=>{const act=G.players[G.active],fight=G.screen==='combat',aim=fight&&G.phase==='aim',left=aim&&!G.cine&&!G.queue.length&&G.players.length>1&&!G.practice?Math.ceil(O.TURN-G.turnT):99;
 return{role:'host',dn:DG().name,rn:O.runOf(G.dung)+1,sg:O.RUNS[O.runOf(G.dung)].indexOf(G.dung)+1,sgn:O.RUNS[O.runOf(G.dung)].length,re:G.runEnd?1:0,nn:O.DUNGEONS[G.dung+1]&&O.runOf(G.dung+1)===O.runOf(G.dung)?O.DUNGEONS[G.dung+1].name:'',tier:G.tier,gd:G.gain,sc:G.screen,nd:G.node,ph:G.phase,rd:G.round,msg:G.msg.slice(0,140),res:G.result||'',tr:G.travel?1:0,pr:G.practice?1:0,pz:O.paused?1:0,fin:G.finale?1:0,
  sk:G.stash.unl.filter(u=>u.startsWith('sk:')).map(u=>u.slice(3)),
  cu:G.cur,ac:act&&fight&&G.cine?act.id:'',sh:aim&&G.players.length>1?G.shooter||'':'',cn:G.cine||G.queue.length?1:0,ins:G.inspect?1:0,tm:left<=20?Math.max(1,left):0,
  mo:G.mons.map(m=>({id:m.id,n:m.name,hp:Math.ceil(m.hp),mx:m.max,d:m.dead?1:0,st:m.stun?1:0,bn:m.burn?m.burn.d:0,it:m.intent&&!m.dead?[m.intent.t,m.intent.dmg,m.intent.x,m.intent.b?1:0,m.intent.mv,m.intent.reels?m.intent.reels.map(f=>f<0?'x':f).join(''):'',m.intent.pw||1,m.intent.t2||'',m.intent.fv||0,m.intent.seq||0,m.intent.n==null?2:m.intent.n]:null})),co:G.combo||0,aw:G.screen==='result'?O.awards():null,
  /* what has changed on each living monster's wheel; a phone rebuilds the rest from the monster's own layout */
  bs:aim?G.mons.map((m,i)=>m.dead?0:[m.course.mv&&m.course.mv.broken?1:0,m.holes.map(h=>Math.min(9,Math.max(0,h.armor))).join(''),mask(m.bumps),mask(m.sand),mask(m.blocks),m.terr?[m.terr.k,m.terr.t,m.terr.spots.map(q=>[q.x,q.y,q.r]),m.terr.dir]:0,m.wk>=0?m.wk:-1,m.sg>=0?m.sg:-1,(m.lk||0)+(m.coreT>0?4:0),m.freeze?1:0]):null,
  ck:aim?Math.round(G.ck*10)/10:0,lm:aim&&G.marbles.length?G.marbles.slice(0,10).map(m=>[Math.round(m.x),Math.round(m.y),Math.round(m.off?0:Math.max(-40,m.z)),Math.round(m.r),m.pl.slot,m.id,m.bn||0]):undefined,
  dec:G.dec?{id:G.dec.id,k:G.dec.k,opts:G.dec.opts,t:G.dec.t||'',tl:G.dec.k==='path'?G.dec.opts.map(i=>[MAP[i].name,O.tileBlurb(MAP[i]),O.beyond(i),O.nodeKind(MAP[i])]):undefined}:null,rel:G.relics,it:G.items,
  mg:G.mg&&O.mgPub?O.mgPub():null,
  pl:G.players.map(p=>({id:p.id,x:Math.round(laneX(p)),sl:p.slot,c:p.cls,hp:p.hp,mhp:p.mhp,f:p.fired?1:0,cd:p.cd,bf:p.buff?1:0,fx:(p.oil>1?1:0)+(p.small<1?2:0)+(p.sure?4:0)+(p.hex<1?8:0)+(p.dot?16:0)+(p.small<=.5?32:0),lv:p.lv,up:p.ups,ow:p.owned,tg:p.tgt,ls:p.last,op:p.opts&&!p.picked?p.opts:null,
    v:G.dec&&p.id in G.dec.picks?1:0,aw:p.away?1:0,sn:p.sn,ex:p.extra?1:0,k:p.skin||'',g:p.grid||'',gn:p.gn||0,bg:O.choicesOf(p),sw:swapOf(p),bn:p.bagN||0}))}};
/* ----- the practice yard: one target that never strikes back and never falls. Shots are free and the wheel turns between them. ----- */
function startPractice(){if(G.screen!=='lobby'||!G.players.length||!MONSTERS.quintain)return;toLobby();G.practice=true;G.stash.prac=true;saveStash();startFight(['quintain'])}
O.startPractice=startPractice;
O.endPractice=()=>{if(G.practice)toLobby()};
function practiceRound(){
  G.round++;for(const p of G.players){spin(p);p.fired=false;p.oil=1;p.small=1;p.sure=false;p.cd=p.cd.map(v=>Math.max(0,v-1))}G.turnT=0;
  const m=alive()[0];if(!m)return;m.rest=[];if(m.coreT>0&&--m.coreT<=0){const c=m.holes[m.core];if(c)c.armor=Math.max(1,c.armor0);m.lk=0}
  const cyc=[null,null,'mire',null,'rift',null,'rubble',null,'gale',null][(G.round-1)%10];
  if(cyc){m.terr={k:cyc,t:2,spots:mkSpots(cyc),dir:Math.random()<.5?-1:1};say(`The course is fouled: ${O.TERR[cyc].name.toLowerCase()}. ${O.TERR[cyc].note}`)}
  else{if(m.terr&&--m.terr.t<=0)m.terr=null;if(!m.terr)say('Take your shots. Try a chip or a lob, or more power.')}
  G.terr=m.terr||null;G.boardVer++;
  if(G.round%5===0&&G.round-(m.lidR||-9)>=3){const h=m.holes.filter(h=>h.armor<=0&&h.armor0>0&&!(h.core&&m.coreT>0)).sort((p,q)=>q.dmg-p.dmg)[0];if(h){h.armor=h.armor0;m.lidR=G.round;G.boardVer++;const[x2,y2]=wpos(h.x,h.y);float(x2,y2-30,'a lid grows back','#d8cfba')}}ev('round',{})}
})();
