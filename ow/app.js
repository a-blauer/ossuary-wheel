/* GambaGolf: networking, phone controller, host panels and boot. */
(()=>{
const O=window.OW,G=O.G,{F,CLASSES,MONSTERS,UPGRADES,RELICS,ITEMS,MAP,LANES}=O,{DEG,clamp,num}=O.util;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e};
let mode=null,lobby=null,room=null,roomTried=false,code='',joined=false,joinErr='';
const hosting=()=>mode==='host'||mode==='solo',isLocal=()=>mode==='solo';
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}},SS={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}}};
/* this phone's own name for itself. It survives a reload, so the host can hand the same fighter back. */
const PID=(()=>{let v=SS.get('ow_pid')||LS.get('ow_pid')||'';if(!/^[a-z0-9]{6,12}$/.test(v))v=(Math.random().toString(36).slice(2)+'00000000').slice(0,8);SS.set('ow_pid',v);LS.set('ow_pid',v);return v})();
const CODE_AB='ABCDEFGHJKLMNPQRSTUVWXYZ',cleanCode=c=>String(c||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);
const newCode=()=>{let c='';for(let i=0;i<4;i++)c+=CODE_AB[Math.floor(Math.random()*CODE_AB.length)];return c};
const hashCode=()=>{let h='';try{h=String(location.hash||'')}catch(e){}const m=/^#(?:join-)?([A-Za-z]{4})$/.exec(h);return m?cleanCode(m[1]):''};
/* each game has its own room, named by the code on the host screen, so two groups never land in one party */
function enterRoom(c){
  const old=room;room=null;joined=false;joinErr='';code=cleanCode(c);if(old&&old!==lobby&&old.leave)old.leave().catch(()=>{});
  if(!lobby)return;
  if(code.length<4||!lobby.join){code='';room=lobby;joined=true;return}
  const want=code;(O.offClaude?lobby.join('ow-'+want.toLowerCase(),{host:mode==='host'}):lobby.join('ow-'+want.toLowerCase())).then(r=>{if(want!==code||room)return;room=r;joined=true;if(mode==='join'){LS.set('ow_code',want);SS.set('ow_jcode',want);C.key='';pushCtrl()}else SS.set('ow_code',want)})
    .catch(e=>{if(want!==code||room)return;if(e&&e.code==='not_permitted'){code='';room=lobby;joined=true}else joinErr='The game could not be reached. Try again.';C.key=''})}
let wake=null;function keepAwake(){try{if(navigator.wakeLock&&document.visibilityState==='visible')navigator.wakeLock.request('screen').then(l=>{wake=l}).catch(()=>{})}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(mode&&document.visibilityState==='visible')keepAwake()});

/* ---------- 2D portraits for the phone ---------- */
function drawHead(c,cls,x,y,s){
  c.save();c.translate(x,y);c.scale(s/50,s/50);
  const E=(x,y,rx,ry,f)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fillStyle=f;c.fill()};
  const T=(p,f)=>{c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fillStyle=f;c.fill()};
  if(cls==='warrior'){E(-30,-32,12,12,'#201c26');E(30,-32,12,12,'#201c26');E(0,2,42,40,'#8d8a93');T([-34,-22,-10,-30,-12,26,-30,18],'#1d1a22');T([34,-22,10,-30,12,26,30,18],'#1d1a22');
    E(0,6,12,38,'#ece5d3');E(0,36,9,7,'#1d1a22');E(-20,-4,4.5,4.5,'#e9b54a');E(20,-4,4.5,4.5,'#e9b54a')}
  else if(cls==='bard'){E(0,8,46,34,'#6a8a44');E(0,20,36,20,'#b5bf6a');E(-24,-22,15,15,'#6a8a44');E(24,-22,15,15,'#6a8a44');E(-24,-22,9,9,'#e9c95a');E(24,-22,9,9,'#e9c95a');E(-24,-22,7,2.6,'#15120f');E(24,-22,7,2.6,'#15120f');
    c.beginPath();c.moveTo(-30,14);c.quadraticCurveTo(0,26,30,14);c.strokeStyle='#2d3a1c';c.lineWidth=3;c.stroke()}
  else if(cls==='mage'){T([-38,-20,-30,-48,-12,-30],'#5a4632');T([38,-20,30,-48,12,-30],'#5a4632');E(0,4,42,40,'#7a5f44');E(0,22,28,20,'#9a8262');E(-18,-6,17,17,'#e6dcc0');E(18,-6,17,17,'#e6dcc0');
    E(-18,-6,8,8,'#a98bf0');E(18,-6,8,8,'#a98bf0');E(-18,-6,4,4,'#120d18');E(18,-6,4,4,'#120d18');T([-7,8,7,8,0,24],'#d9a441')}
  else{c.save();c.rotate(-.18);E(-14,-44,9,30,'#b3946c');E(-14,-44,4,22,'#d9a9a0');c.restore();c.save();c.rotate(.18);E(14,-44,9,30,'#b3946c');E(14,-44,4,22,'#d9a9a0');c.restore();
    E(0,10,34,34,'#c2a37c');E(0,26,18,14,'#ece5d3');E(-15,2,5,6,'#17120f');E(15,2,5,6,'#17120f');T([-5,18,5,18,0,24],'#c9788a')}
  c.restore();
}
const PORT={};
for(const k of Object.keys(CLASSES)){const im=new Image();im.onload=()=>{PORT[k]=im;C.key='';sideKey='';if(!C.cls&&mode&&mode!=='host')buildPick();else if(C.cls===k)$('meHead').replaceChildren(headCanvas(k,44))};im.src='ow/p_'+k+'.jpg'}
function headCanvas(cls,px,lane){const cn=document.createElement('canvas');cn.width=cn.height=px*2;const c=cn.getContext('2d');
  c.save();c.beginPath();c.arc(px,px,px-3,0,7);c.fillStyle='#17131b';c.fill();
  if(PORT[cls]){c.clip();c.drawImage(PORT[cls],0,0,px*2,px*2)}else drawHead(c,cls,px,px+px*.12,px*.7);c.restore();
  if(lane){c.beginPath();c.arc(px,px,px-3,0,7);c.lineWidth=5;c.strokeStyle=lane;c.stroke()}cn.style.width=cn.style.height=px+'px';return cn}

/* ---------- network: everything rides on presence ---------- */
function syncRemote(now){
  if(!room)return;let peers;try{peers=room.peers()}catch(e){return}
  for(const p of peers){const pr=p.presence;if(p.sameTab||!pr||pr.role!=='player'||!CLASSES[pr.cls])continue;
    const pid=typeof pr.pid==='string'&&/^[a-z0-9]{4,12}$/.test(pr.pid)?pr.pid:null;if(!pid)continue;
    let pl=G.players.find(x=>x.id===pid);
    if(!pl&&G.screen!=='lobby'){pl=G.players.find(x=>x.away&&!x.local&&x.cls===pr.cls&&!peers.some(q=>q.presence&&q.presence.pid===x.id));if(pl){pl.id=pid;O.say(`A new hand takes up the ${CLASSES[pl.cls].animal} ${CLASSES[pl.cls].name}.`)}}      // a new phone may take over a fighter whose own phone is gone
    const fresh=!pl;if(!pl){pl=O.addPlayer(pid,pr.cls,false);if(!pl)continue}
    if(fresh||pl.peer!==p.peer){pl.peer=p.peer;pl.lastN=num(pr.shot&&pr.shot.n);pl.lastPick=num(pr.pick&&pr.pick.n);pl.lastTgt=num(pr.tgt&&pr.tgt.n);pl.lastIns=num(pr.ins);pl.lastItem=num(pr.item&&pr.item.n);pl.lastMg='';pl.lastAct=num(pr.act&&pr.act.n)}     // a phone that reloaded starts its counters again
    pl.seen=now;if(pl.cls!==pr.cls)O.changeClass(pl,pr.cls);if((pl.skin||'')!==String(pr.skin||''))O.setSkin(pl,pr.skin);{const lk=[pr.tr||'',pr.dy||'',pr.ti||''].join('|');if(lk!==pl.lkK){pl.lkK=lk;O.setGear(pl,{tr:pr.tr,dy:pr.dy,ti:pr.ti})}}
    if(G.inspect&&Array.isArray(pr.lv)&&O.lookSet){const k=pr.lv.join(',');if(k!==pl.lastLv){pl.lastLv=k;O.lookSet(pr.lv)}}
    pl.aim=clamp(num(pr.aim,90),8,172);pl.rp=clamp(Math.floor(num(pr.rp)),0,2);pl.ch=!!pr.ch;pl.lk=!!pr.lk;pl.rdy=!!pr.rd;pl.pw=clamp(num(pr.pw),0,1);pl.ab=clamp(Math.floor(num(pr.ab)),0,11);
    const it=pr.item;if(it&&num(it.n)>pl.lastItem){pl.lastItem=num(it.n);O.useItem(pl.id,it.i)}
    const mg=pr.mg;if(mg&&G.mg&&num(mg.id)===G.mg.id){const kk=mg.id+':'+mg.v;if(kk!==pl.lastMg){pl.lastMg=kk;O.mgInput(pl.id,G.mg.id,mg.v)}}
    const tg=pr.tgt;if(tg&&num(tg.n)>pl.lastTgt){pl.lastTgt=num(tg.n);O.setTarget(pl.id,tg.i)}
    if(num(pr.ins)>pl.lastIns){pl.lastIns=num(pr.ins);O.toggleInspect(pl.id)}
    const s=pr.shot;if(s&&num(s.n)>pl.lastN&&!O.paused){pl.lastN=num(s.n);O.fire(pl,s.ab,s.ang,s.pow,s.rp)}
    const k=pr.pick;if(k&&num(k.n)>pl.lastPick){pl.lastPick=num(k.n);O.pickOpt(pl.id,num(k.d),k.i)}
    const ac=pr.act;if(ac&&num(ac.n)>(pl.lastAct||0)){pl.lastAct=num(ac.n);if(ac.k==='leave')O.endPractice();}}
  for(const pl of G.players)if(!pl.local)pl.away=now-pl.seen>4000;                         // a fighter whose phone has gone quiet keeps their place until it comes back
  if(G.screen==='lobby')G.players=G.players.filter(pl=>pl.local||now-pl.seen<8000);
}
let lastPush=0,lastS='';
function pushHost(now){if(!room||now-lastPush<160)return;const s=JSON.stringify(O.publicState());if(s===lastS)return;lastS=s;lastPush=now;room.presence(JSON.parse(s)).catch(()=>{})}

/* ---------- controller ---------- */
const C={armed:false,skin:LS.get('ow_skin')||'',wake:LS.get('ow_wake')||'',dye:LS.get('ow_dye')||'',title:LS.get('ow_title')||'',cls:null,ab:0,rp:0,aim:90,ch:false,pw:0,seq:0,pseq:0,shot:null,pick:null,sentRd:'',sentDec:0,t0:0,key:'',tab:'play',tgt:null,tseq:0,ins:0,item:null,iseq:0,act:null,aseq:0,mg:null,mgId:0,mgGo:0,mgV:null,steady:1,spun:0,slotKey:'',pickKey:'',pull:null,lastPull:null,trail:[],trailNew:false,lmA:null,lmB:null,lmSig:'',ck0:0,ckT:0,ckSeen:-1,pushT:0};
function pushCtrl(){
  if(!C.cls)return;
  if(isLocal()){let pl=G.players.find(p=>p.id==='local');if(!pl)pl=O.addPlayer('local',C.cls,true);if(!pl)return;if(pl.cls!==C.cls)O.changeClass(pl,C.cls);pl.aim=C.aim;pl.ch=C.ch;pl.lk=!!C.lk;pl.rdy=C.spun===2;pl.pw=C.pw;pl.ab=C.ab;pl.rp=C.rp;if((pl.skin||'')!==(C.skin||''))O.setSkin(pl,C.skin);{const lk=[C.wake,C.dye,C.title].join('|');if(lk!==pl.lkK){pl.lkK=lk;O.setGear(pl,{tr:C.wake,dy:C.dye,ti:C.title})}}}
  else if(room&&joined)room.presence({role:'player',pid:PID,cls:C.cls,skin:C.skin||'',tr:C.wake||'',dy:C.dye||'',ti:C.title||'',rp:C.rp,aim:Math.round(C.aim*2)/2,ch:C.ch?1:0,lk:C.lk?1:0,rd:C.spun===2?1:0,pw:Math.round(C.pw*100)/100,ab:C.ab,shot:C.shot,pick:C.pick,tgt:C.tgt,ins:C.ins,lv:C.lvOn?C.lv.map(x=>Math.round(x*1000)/1000):null,item:C.item,mg:C.mg,act:C.act}).catch(()=>{})}
/* a monster's wheel as this phone must draw it: the fixed layout every device knows, with what the host says has changed */
const LAY={};
function boardOf(mo,bs,i){const m=mo[i],b=Array.isArray(bs)?bs[i]:null;if(!m||!Array.isArray(b))return null;const Cc=LAY[m.id]||(LAY[m.id]=O.course(m.id)),on=(a,k)=>String(a||'')[k]==='1',lk=Math.floor(num(b[8]));
  const t=Array.isArray(b[5])&&O.TERR[b[5][0]]?[String(b[5][0]),Math.floor(num(b[5][1])),(Array.isArray(b[5][2])?b[5][2]:[]).slice(0,4).filter(Array.isArray).map(q=>[num(q[0]),num(q[1]),clamp(num(q[2],40),10,90)]),num(b[5][3])<0?-1:1]:null;
  return{C:Cc,h:Cc.holes.map((h,k)=>[h.x,h.y,h.rad,h.dmg,+String(b[1]||'')[k]||0,h.tier,h.lock?1:h.core?2:0,h.shut||null,h.size]),b:Cc.bumps.filter((q,k)=>on(b[2],k)).map(q=>[q.x,q.y,q.rad,q.kick?1:0]),sand:Cc.sand.filter((q,k)=>on(b[3],k)).map(q=>[q.x,q.y,q.r]),blk:Cc.blocks.filter((q,k)=>on(b[4],k)).map(q=>[q.x,q.y,q.w,q.h]),
    wk:Math.floor(num(b[6],-1)),sg:Math.floor(num(b[7],-1)),lk:lk&3,open:lk&4?1:0,locks:Cc.locks||null,mv:b[0]?null:Cc.mv||null,fz:b[9]?1:0,t}}
function getView(){
  let s,myId;
  if(isLocal()){s=O.publicState();myId='local'}
  else{if(!lobby)return{err:roomTried?'noroom':'wait'};if(!joined||!room)return{err:joinErr?'joinfail':'code'};let ps;try{ps=room.peers()}catch(e){return{err:'noroom'}}
    const h=ps.find(p=>!p.sameTab&&p.presence&&p.presence.role==='host');if(!h){if(!C.noHostT)C.noHostT=performance.now();return{err:'nohost'}}C.noHostT=0;s=h.presence;myId=PID}
  const list=Array.isArray(s.pl)?s.pl:[],m=list.find(x=>x&&x.id===myId),arr=a=>Array.isArray(a)?a:[];
  const dec=s.dec&&typeof s.dec==='object'?{id:num(s.dec.id),k:String(s.dec.k||''),opts:arr(s.dec.opts),t:String(s.dec.t||''),tl:arr(s.dec.tl).map(x=>arr(x).map(y=>String(y).slice(0,160)))}:null;
  const mg=s.mg&&typeof s.mg==='object'&&O.MG[s.mg.k]?{id:num(s.mg.id),k:s.mg.k,st:String(s.mg.st||''),t:num(s.mg.t),dur:num(s.mg.dur,15),d:s.mg.d&&typeof s.mg.d==='object'?s.mg.d:{},won:s.mg.won?1:0,go:s.mg.go===0?0:1,ok:s.mg.out&&typeof s.mg.out==='object'&&myId in s.mg.out?(s.mg.out[myId]?1:0):-1}:null;
  const mo=arr(s.mo).filter(x=>x&&MONSTERS[x.id]).map(x=>({id:x.id,n:String(x.n||MONSTERS[x.id].name).slice(0,40),hp:num(x.hp),mx:num(x.mx,1),d:x.d?1:0,st:x.st?1:0,bn:num(x.bn),it:Array.isArray(x.it)?[String(x.it[0]||''),Math.floor(num(x.it[1])),String(x.it[2]||''),x.it[3]?1:0,x.it[4]==null?null:clamp(Math.floor(num(x.it[4])),0,9),String(x.it[5]||'').slice(0,9),num(x.it[6],1),String(x.it[7]||''),Math.floor(num(x.it[8])),Math.floor(num(x.it[10],2))]:null})),act=list.find(x=>x&&x.id===s.ac);
  const tg=m?Math.floor(num(m.tg,-1)):-1,bd=m&&tg>=0&&mo.length===arr(s.mo).length?boardOf(mo,s.bs,tg):null,cu0=Math.floor(num(s.cu,-1)),bdc=cu0===tg?bd:cu0>=0&&mo.length===arr(s.mo).length?boardOf(mo,s.bs,cu0):null,
    lm=arr(s.lm).slice(0,10).filter(Array.isArray).map(q=>[num(q[0]),num(q[1]),num(q[2]),clamp(num(q[3],10),3,40),clamp(Math.floor(num(q[4])),0,3),num(q[5]),Math.floor(num(q[6]))]),aw=arr(s.aw).slice(0,8).map(a=>arr(a).slice(0,3).map(q=>String(q).slice(0,80))).filter(a=>a.length===3);
  return{bd,bdc,lm,ck:num(s.ck),aw,co:Math.floor(num(s.co)),myId,dn:String(s.dn||'the dungeon').slice(0,60),gd:Math.floor(num(s.gd)),sc:String(s.sc||'lobby'),nd:num(s.nd),ph:String(s.ph||''),rd:num(s.rd),cu:Math.floor(num(s.cu,-1)),actCls:act&&CLASSES[act.c]?act.c:'',actMe:!!m&&s.ac===myId,sh:typeof s.sh==='string'?s.sh.slice(0,16):'',gp:typeof s.gp==='string'?s.gp.slice(0,80):'',spl:s.spl?1:0,cs:typeof s.cs==='string'?s.cs.slice(0,64):'',nu:arr(s.nu).filter(x=>typeof x==='string').slice(0,8),cn:s.cn?1:0,ins:s.ins?1:0,
    sk:arr(s.sk).filter(k=>O.SKINS[k]).slice(0,30),pr:s.pr?1:0,pz:s.pz?1:0,fin:s.fin?1:0,rn:num(s.rn,1),sg:num(s.sg,1),sgn:num(s.sgn,3),re:s.re?1:0,nn:typeof s.nn==='string'?s.nn.slice(0,40):'',tm:clamp(Math.floor(num(s.tm)),0,99),left:list.filter(x=>x&&!x.f&&num(x.hp)>0&&!x.aw).length,mo,mg,it:arr(s.it).filter(x=>ITEMS[x]).slice(0,8),msg:String(s.msg||''),res:String(s.res||''),tr:!!s.tr,dec,
    rel:arr(s.rel).filter(r=>RELICS[r]),full:!m&&list.length>=4,pa:list.filter(x=>x&&CLASSES[x.c]).slice(0,4).map(x=>({id:String(x.id||'').slice(0,16),c:x.c,sl:clamp(Math.floor(num(x.sl)),0,3),hp:Math.max(0,num(x.hp)),mhp:num(x.mhp,1),f:x.f?1:0,aw:x.aw?1:0,me:x.id===myId})),
    me:m?{c:CLASSES[m.c]?m.c:C.cls,x:num(m.x,500),sl:clamp(Math.floor(num(m.sl)),0,3),hp:num(m.hp),mhp:num(m.mhp,1),f:m.f?1:0,cd:arr(m.cd).map(v=>num(v)),bf:m.bf?1:0,lv:num(m.lv,1),up:arr(m.up).filter(u=>UPGRADES[u]),ow:arr(m.ow).map(v=>Math.floor(num(v))).filter(v=>v>=0&&v<12),fx:Math.floor(num(m.fx)),tg,bg:arr(m.bg).map(q=>Math.floor(num(q,-1))).filter(q=>q>=0&&q<12).slice(0,8),sw:Math.floor(num(m.sw,-1)),bn:Math.floor(num(m.bn)),ls:arr(m.ls).map(q=>Math.floor(num(q))),op:m.op?arr(m.op).filter(u=>O.upInfo(u,C.cls)):null,v:m.v?1:0,sn:Math.floor(num(m.sn)),ex:m.ex?1:0,k:String(m.k||''),g:String(m.g||'').replace(/[^0-9a-z]/g,'').slice(0,12),gn:Math.floor(num(m.gn))}:null};
}
function buildPick(){const g=$('classGrid');g.textContent='';
  for(const k of Object.keys(CLASSES)){const cl=CLASSES[k],b=el('button');b.append(headCanvas(k,84),el('b',null,`${cl.animal} ${cl.name}`),el('span',null,cl.blurb));b.onclick=()=>chooseClass(k);g.appendChild(b)}}
function chooseClass(k){
  C.cls=k;C.ab=0;C.key='';const cl=CLASSES[k];$('meHead').replaceChildren(headCanvas(k,44));$('meName').textContent=`${cl.animal} ${cl.name}`;
  const box=$('abil');box.textContent='';cl.ab.forEach((ab,i)=>{const b=el('button');b.id='ab'+i;b.append(O.ico('ab:'+i,k),el('b',null,ab.name),el('small'));b.onclick=()=>{C.ab=i;abTip(i);pushCtrl();renderCtrl()};box.appendChild(b)});
  pushCtrl();renderCtrl()}
/* a short card over the wheel says what the thing you just tapped does, then gets out of the way */
function abTip(i){const v=getView(),me=v&&!v.err&&v.me,a=CLASSES[C.cls].ab[i],m=me?O.mods({cls:C.cls,lv:me.lv,ups:me.up}):null,rest=O.cdBase(a,m);
  C.tip={ic:'ab:'+i,t:a.name,m:(a.m?O.sizeName(a.m.r)+' ball · ':'')+(O.recipes(C.cls)[i]?'needs '+O.recipes(C.cls)[i].map(c=>O.SYMS[c]).join(' · ')+' on a line':'always on the reels'),s:a.desc+(a.m&&m?' '+O.sizeNote(a.m.r*m.size):''),until:performance.now()+5200}}
O.chooseClass=chooseClass;
function setNeedle(){const a=C.aim*DEG,x=150+Math.cos(a)*128,y=162-Math.sin(a)*128;$('needle').setAttribute('x2',x);$('needle').setAttribute('y2',y);$('knob').setAttribute('cx',x);$('knob').setAttribute('cy',y);$('dial').setAttribute('aria-valuenow',Math.round(C.aim))}
const rdKey=v=>v.nd+':'+v.mo.length+':'+v.rd;
/* in a round every fighter who has not yet loosed may act, all at the same time. A launch is pending until the host's count of this fighter's attacks goes up. */
const pending=v=>C.pendSn!=null&&!!v.me&&v.me.sn===C.pendSn&&performance.now()-(C.sentAt||0)<3500;
const canAct=v=>!!v&&!v.err&&v.sc==='combat'&&v.ph==='aim'&&!!v.me&&!v.me.f&&v.me.hp>0&&!v.pz&&!pending(v);
const canFire=v=>{if(!canAct(v)||(v.sh&&v.sh!==v.myId)||!v.me.ow.includes(C.ab)||!v.me.bg.includes(C.ab))return false;const ab=CLASSES[C.cls].ab[C.ab],t=v.mo[v.me.tg];return(ab.instant&&!ab.foe)||(!!t&&!t.d)};
function sendItem(i){if(isLocal())O.useItem('local',i);else{C.item={n:++C.iseq,i};pushCtrl()}C.key='';renderCtrl()}
function sendMg(id,v){C.mgV=v;if(isLocal())O.mgInput('local',id,v);else{C.mg={id,v};pushCtrl()}C.key=''}
function sendTarget(i){if(isLocal())O.setTarget('local',i);else{C.tgt={n:++C.tseq,i};pushCtrl()}C.key='';renderCtrl()}
function sendInspect(){if(isLocal())O.toggleInspect('local');else{C.ins++;pushCtrl()}C.key=''}
function sendAct(k){if(isLocal()){if(k==='leave')O.endPractice();}else{C.act={n:++C.aseq,k};pushCtrl()}C.key=''}
function sendPick(v,i,o){if(!v.dec)return;C.sentDec=v.dec.id;C.took=o||null;O.buzz(18);if(isLocal())O.pickOpt('local',v.dec.id,i);else{C.pick={n:++C.pseq,d:v.dec.id,i};pushCtrl()}C.key='';renderCtrl()}
function decContent(v){
  const d=v.dec,me=v.me;if(!d||!me)return null;
  if(d.k==='upgrade'){if(!me.op)return{wait:'Taken. Waiting for the others.'};return{title:d.t==='tome'?'Choose what to learn':d.t==='gate'?'Supplies at the gate: choose one':'Choose a drop',opts:me.op.map(u=>{const o=O.upInfo(u,C.cls);return{t:o.name,s:o.desc,ic:u,kd:O.kindName(u,C.cls),rw:u}})}}
  if(me.v||C.sentDec===d.id)return{wait:d.k==='start'?'Starting…':'Chosen. Waiting for the rest of the party.'};
  if(d.k==='start'){const R=['I','II','III','IV','V','VI','VII'][v.rn-1]||v.rn;return{title:'The party is gathered',opts:[{t:v.sg>1?`Continue Run ${R}: stage ${v.sg}`:`Begin Run ${R}`,s:`${v.sg>1?'Next':'Stage 1'}: ${v.dn}. The host chooses the run on the big screen.`,ic:'n:go'},{t:'Practice first',s:'A target that never strikes back. Learn the ramps and the pull before the real thing.',ic:'n:prac'}].slice(0,Math.max(1,d.opts.length))}}
  if(d.k==='path')return{title:d.opts.length>1?'Choose the way':'The way ahead',opts:d.opts.map((i,k)=>{const t=d.tl&&d.tl[k];return{t:t?t[0]:'Onward',s:t?t[1]+(t[2]?' '+t[2]:''):'',ic:'n:'+(t&&t[3]||'battle')}})};
  if(d.k==='relic')return{title:'Choose one relic for the party',opts:d.opts.filter(r=>RELICS[r]).map(r=>({t:RELICS[r].name,s:RELICS[r].desc,ic:'re:'+r,kd:'Relic',rw:'re:'+r}))};
  if(d.k==='end'){const R=['I','II','III','IV','V','VI','VII'][v.rn-1]||v.rn;
    const nu=(v.nu||[]).map(id=>(O.lockInfo(id)||{}).name).filter(Boolean),nuT=nu.length?` Unlocked for every run: ${nu.join(', ')}.`:'';
    if(v.res==='win'&&v.re)return{title:(v.fin?`The last throne is empty. Run ${R} complete: the party earns ${v.gd} gold.`:`Run ${R} complete! The party earns ${v.gd} gold.`)+nuT,opts:[{t:'Return to the menu',s:'Spend gold on loot boxes for new looks, then begin the next run.',ic:'n:again'}]};
    if(v.res==='win')return{title:`${v.dn} is cleared. Stage ${v.sg} of ${v.sgn} done.`+nuT,opts:[{t:'On to stage '+(v.sg+1),s:`Enter ${v.nn||'the next dungeon'} with everything you have won.`,ic:'n:go'},{t:'Rest at the menu',s:'Your run is saved. Continue it from the menu.',ic:'n:again'}]};
    return{title:'The party has fallen',opts:[{t:'Begin the run again',s:`Back to stage 1 of Run ${R}, with fresh stats.`,ic:'n:retry'},{t:'Return to the menu',s:'The run is lost.',ic:'n:again'}]}}
  return null}
function sheetInto(box,cls,me,rel,mine){
  box.textContent='';const cl=CLASSES[cls],m=me?O.mods({cls,lv:me.lv,ups:me.up}):null,row=(key,cls2,...kids)=>{const d=el('div',cls2);d.append(O.ico(key,cls),...kids);return d};
  const top=el('div','shTop');top.append(headCanvas(cls,84,me?LANES[me.sl]:null));const tt=el('div'),ttl=mine&&C.title&&O.TITLES[C.title]?O.TITLES[C.title].name:'';tt.append(el('h3',null,`${cl.animal} ${cl.name}`));if(ttl)tt.appendChild(el('em','ttl',ttl));tt.appendChild(el('p',null,cl.blurb));top.appendChild(tt);box.appendChild(top);
  const st=el('div','stats');const S=(k,v)=>{const d=el('div');d.append(el('small',null,k),el('b',null,v));st.appendChild(d)};
  S('Level',me?me.lv:1);S('Health',me?`${me.hp} / ${me.mhp}`:cl.hp);S('Damage',m?'+'+Math.round((m.dmg-1)*100)+'%':'+0%');S('Harm taken',m?Math.round(m.take*100)+'%':(cls==='warrior'?'70%':'100%'));box.appendChild(st);
  if(mine){const own=id=>isLocal()?G.stash.unl.includes(id):O.cosmHas(mine.cs,id),L=el('div','looks');
    const grp=(title,T,pre,base,cur,set,chip)=>{const ks=Object.keys(T).filter(k=>base.includes(k)||own(pre+k)),g=el('div','lookG');g.appendChild(el('h4',null,title+` · ${ks.length-base.length} of ${Object.keys(T).length-base.length}`));const w=el('div','lookRow');
      for(const k of ks){const b=el('button','lk r'+(T[k].rar||0));b.append(chip(k,T[k]));b.setAttribute('aria-pressed',(cur||base[0])===k);b.title=T[k].name;b.onclick=()=>{set(k===base[0]?'':k);C.key='';pushCtrl();renderCtrl()};w.appendChild(b)}g.appendChild(w);
      g.appendChild(el('p','none',(T[cur||base[0]]||T[base[0]]).name));L.appendChild(g)};
    grp('Ball',O.SKINS,'sk:',['plain','bone'],C.skin,k=>{C.skin=k;LS.set('ow_skin',k)},k=>O.ico('sk:'+k,cls));
    grp('Trail',O.TRAILS,'tr:',['none'],C.wake,k=>{C.wake=k;LS.set('ow_wake',k)},(k,t)=>cosmChip('tr:'+k));
    grp('Outfit dye',O.DYES,'dy:',['none'],C.dye,k=>{C.dye=k;LS.set('ow_dye',k)},(k,t)=>cosmChip('dy:'+k,cls));
    grp('Title',O.TITLES,'ti:',['none'],C.title,k=>{C.title=k;LS.set('ow_title',k)},(k,t)=>el('span','tiChip',k==='none'?'—':t.name));
    box.append(el('h4','lookH','Your look'),L,el('p','none','More come out of loot boxes on the main menu.'))}
  box.appendChild(el('h4',null,'Abilities'));const own=me&&me.ow?me.ow:[0,1];cl.ab.forEach((a,i)=>{if(!own.includes(i))return;const rest=O.cdBase(a,m);box.appendChild(row('ab:'+i,'row',el('b',null,a.name),el('small',null,(a.m?O.sizeName(a.m.r)+' ball · ':'')+(rest?`rests ${rest} round${rest===1?'':'s'}`:'always ready')),el('p',null,a.desc)))});
  if(own.length<cl.ab.length){box.appendChild(el('h4',null,'Not yet learned'));cl.ab.forEach((a,i)=>{if(own.includes(i))return;box.appendChild(row('ab:'+i,'row locked',el('b',null,a.name),el('small',null,'found in drops'),el('p',null,a.desc)))})}
  box.appendChild(el('h4',null,'Upgrades'));if(me&&me.up.length)me.up.forEach(u=>box.appendChild(row(u,'row',el('b',null,UPGRADES[u].name),el('p',null,UPGRADES[u].desc))));else box.appendChild(el('p','none','None yet. Every fight drops something.'));
  if(me&&me.bag){box.appendChild(el('h4',null,'Party bag'));if(me.bag.length)me.bag.forEach(r=>box.appendChild(row('it:'+r,'row',el('b',null,ITEMS[r].name),el('p',null,ITEMS[r].desc))));else box.appendChild(el('p','none','Empty. An item is free to use before you attack.'))}
  box.appendChild(el('h4',null,'Party relics'));if(rel&&rel.length)rel.forEach(r=>box.appendChild(row('re:'+r,'row',el('b',null,RELICS[r].name),el('p',null,RELICS[r].desc))));else box.appendChild(el('p','none','None yet. Reliquaries hold them.'));
}
function renderCtrl(){
  if(mode==='join'&&lobby&&!joined&&!room){let h=null;try{h=lobby.peers().find(p=>!p.sameTab&&p.presence&&p.presence.role==='host')}catch(e){}if(h){code='';room=lobby;joined=true;C.editCode=false}}       // a host that could not open a coded room is waiting in the shared one: go straight in
  const v=getView(),needCode=mode==='join'&&!!lobby&&(v.err==='code'||v.err==='joinfail'||!!C.editCode);
  $('codeBox').hidden=!needCode;if(needCode){$('pick').hidden=true;$('main').hidden=true;const e=$('codeErr');e.hidden=!joinErr;e.textContent=joinErr;return}
  if(!C.cls&&v.me&&CLASSES[v.me.c]&&v.sc!=='lobby'){chooseClass(v.me.c);return}                                    // a phone that comes back mid-run is handed its fighter without being asked
  const hasCls=!!C.cls;$('pick').hidden=hasCls;$('main').hidden=!hasCls;if(!hasCls)return;
  const me=v.me;if(me&&me.c!==C.cls&&v.sc!=='lobby'&&CLASSES[me.c]){chooseClass(me.c);return}                    // during a run the host's record of this fighter is the one that counts
  if(me&&me.ow.length&&!me.ow.includes(C.ab)){C.ab=me.ow[0];pushCtrl()}
  const sl=me?O.slotRead(me.g,me.ow,O.mods({cls:C.cls,lv:me.lv,ups:me.up}),C.cls):null;
  if(me&&me.g){const k=rdKey(v)+':'+me.gn;if(k!==C.slotKey){C.slotKey=k;C.spun=0;C.stopped=false;C.armed=false;C.key=''}                 // new reels: they must be spun before anything else
    if(C.spun===2&&me.bg.length&&!me.bg.includes(C.ab)){C.ab=me.bg[0];C.armed=false;pushCtrl()}}
  if(mode==='join'&&!v.err&&v.dn!==C.dn){C.dn=v.dn;const di=O.DUNGEONS.findIndex(d=>d.name===v.dn);if(di>=0&&O.SETS&&O.SETS[di])document.body.style.setProperty('--dn',O.SETS[di].fire)}
  if(!v.err&&v.mg&&me&&C.tab!=='play'){C.tab='play';C.key=''}
  const cl=CLASSES[C.cls],ab=cl.ab[C.ab],mgOn=!v.err&&!!v.mg&&!!me,act=canAct(v),dc=v.err||mgOn||v.pz?null:decContent(v),combat=act&&!dc,pend=!v.err&&pending(v);let st='';
  const mon=!v.err&&me&&v.mo?v.mo[me.tg]:null,other=v.actCls?`the ${CLASSES[v.actCls].animal} ${CLASSES[v.actCls].name}`:'the party',aimPh=!v.err&&v.sc==='combat'&&v.ph==='aim';
  if(v.err==='wait')st='Connecting…';
  else if(v.err==='noroom')st=O.offClaude?'This view cannot reach other players. Check the internet connection, or go back and play solo.':'This view cannot reach other players. Open the page from its share link while signed in, or go back and play solo.';
  else if(v.err==='nohost')st=code?`Looking for game ${code}. Check the code on the big screen; the host has to choose Host there first.`:'Looking for a host screen. Someone needs to open this page on a big screen and choose Host.';
  else if(v.err)st='Connecting…';
  else if(!me)st=v.full?'The party is full. Four fighters at most.':'Joining the party…';
  else if(v.pz)st='Paused on the big screen.';
  else if(v.mg)st='';
  else if(dc&&dc.wait)st=dc.wait;
  else if(dc)st='';
  else if(v.sc==='map')st=v.tr?'The party is on the move.':v.msg;
  else if(v.sc!=='combat')st=v.msg;
  else if(v.ph==='intro')st=v.pr?'The practice yard. Nothing here strikes back.':'Something stirs in the dark.';
  else if(v.ph==='won')st='The way is clear.';
  else if(v.ph==='lost')st='The party has fallen.';
  else if(me.hp<=0)st="You are down. A Bard's Mending Ballad can raise you.";
  else if(v.ph==='boss')st='The monsters strike back.';
  else if(v.gp&&!v.gp.split(',').includes(v.myId)){const ns=v.gp.split(',').map(id=>(v.pa||[]).find(q=>q.id===id)).filter(Boolean).map(o=>'the '+CLASSES[o.c].animal);st=`${ns.join(' and ').replace(/^t/,'T')} ${ns.length>1?'are':'is'} shooting. Your turn comes after the monster strikes back. Watch the big screen.`}
  else if(me.f||pend){const known=me.ls&&me.ls[0]===C.lsSeen&&C.lsRd===rdKey(v),r=known?(me.ls[1]>0?`Your attack sank ${me.ls[2]} ball${me.ls[2]===1?'':'s'} for ${me.ls[1]} damage. `:'Your attack missed. '):'';
    st=v.actMe?'Your attack is under way. Watch the big screen.':known?r+(v.left>0?`Waiting for ${v.left===1?'one more fighter':v.left+' more fighters'}.`:v.cn?'Watch the big screen.':''):'Loosed. Your attack plays out on the big screen in its turn.'}
    else if(v.sh&&v.sh!==v.myId&&!me.f){const o=(v.pa||[]).find(q=>q.id===v.sh);st=`Wait for your turn: ${o?'the '+CLASSES[o.c].animal:'another fighter'} is shooting. Watch the big screen.`}
    else if(ab.instant)st=ab.foe&&!mon?'Tap a monster, then Cast.':'No aiming needed. Tap Cast.'+(me.sw===C.ab?` Or pick your ${cl.ab[me.ow[0]||0].name} to attack instead.`:'');
    else if(me.sw>=0&&C.ab===(me.ow[0]||0)&&!me.f&&!pend&&!C.ch&&!C.armed)st=`Your ${cl.ab[me.sw].name} or your basic ball: this one uses up ${cl.ab[me.sw].name} instead. Steer, tap Lock aim, then pull down to shoot.`;
  else st=(v.pr?'Practice: every shot is free, and while you pull back a ring on the big screen shows where the ball will stop. ':'')+(me.ex?'You have a second attack this round. ':'')+(me.bf?'War Anthem is on you: this attack hits 50% harder. ':'')+(C.ch?'Steer sideways. Let go to shoot.':v.cn?`${other.replace(/^t/,'T')} is attacking on the big screen. Line up your shot meanwhile.`:'Drag back on the pad. Your aim shows on the big screen.')+(v.tm?` ${v.tm} seconds left.`:'');
  const sight=ab.sight||(me&&me.up.includes('a_eye'));
  if(me)C.steady=O.mods({cls:C.cls,lv:me.lv,ups:me.up}).steady;
  if(me&&mode==='join'){const k=act?rdKey(v)+':'+me.sn:'';if(k&&k!==C.actKey)O.buzz([40,60,40]);C.actKey=k}                    // a nudge whenever it is yours to act
  if(me){if(C.hpSeen!=null&&me.hp<C.hpSeen){O.buzz([70,40,150]);const mb=document.querySelector('.me');mb.classList.remove('hit');void mb.offsetWidth;mb.classList.add('hit')}C.hpSeen=me.hp}
  if(me&&me.ls&&me.ls[0]!==C.lsSeen){if(C.lsSeen!=null&&me.ls[0]>C.lsSeen){C.lsRd=rdKey(v);O.buzz(me.ls[1]>0?[30,40,90]:20)}C.lsSeen=me.ls[0]}
  $('reCode').hidden=!(mode==='join'&&v.err==='nohost'&&!!code&&performance.now()-(C.noHostT||0)>2500);
  const key=JSON.stringify([st,me,v.pa,v.mo,v.bd,v.actMe,v.cn,v.ins,v.sc,v.dec,v.mg,v.it,v.pr,v.pz,v.cs,C.skin,C.wake,C.dye,C.title,v.nu,C.took&&C.took.t,C.tip&&performance.now()<C.tip.until?C.tip.t:0,C.bagOpen,C.mgV,C.mgGo>0,C.ab,C.rp,C.spun,C.stopped,C.ch?(C.pw<.05?1:2):0,SL.phase(),C.armed,C.tab,v.rel,sight?Math.round(C.aim):0,C.sentDec]);trackLive(v);
  if(key===C.key){if(C.tab==='play'&&!v.err&&v.me){C.view=v;if(!$('pad').hidden&&!$('scope').hidden)drawScope();if(!$('watch').hidden&&!$('liveWrap').hidden)drawScope(true)}return}C.key=key;         // moving parts and balls in play are redrawn between full renders
  $('tabPlay').setAttribute('aria-pressed',C.tab==='play');$('tabHero').setAttribute('aria-pressed',C.tab==='hero');$('play').hidden=C.tab!=='play';$('sheet').hidden=C.tab!=='hero';
  $('meHp').style.width=me?(100*me.hp/me.mhp)+'%':'100%';$('meHpTxt').textContent=me?`Level ${me.lv} · ${me.hp} / ${me.mhp} health`:`${cl.hp} health`;$('meLane').style.background=me?LANES[me.sl]:'transparent';
  $('swap').hidden=!(v.err||!me||v.sc==='lobby');
  if(C.tab==='hero'){sheetInto($('sheet'),C.cls,me?Object.assign({bag:v.it||[]},me):me,v.rel||[],{cs:v.cs||''});return}
  $('status').textContent=st;$('status').hidden=!st||combat;
  const db=$('decBox'),took=dc&&dc.wait&&C.took&&v.dec&&C.sentDec===v.dec.id?C.took:null;db.hidden=!((dc&&dc.opts)||took);
  if(took){db.textContent='';if(took.rw){db.append(el('h3',null,v.dec.k==='upgrade'?'Yours:':'Your vote:'),rewardCard(took.rw,C.cls,{div:1}))}else{const c=el('div','took'),d=el('div');d.append(el('b',null,took.t),el('span',null,v.dec.k==='upgrade'?'Yours.':'Your vote.'));c.append(O.ico(took.ic,C.cls),d);db.appendChild(c)}}
  else if(dc&&dc.opts){db.textContent='';db.appendChild(el('h3',null,dc.title));dc.opts.forEach((o,i)=>{if(o.rw){db.appendChild(rewardCard(o.rw,C.cls,{onclick:()=>sendPick(v,i,o)}));return}const b=el('button','opt');b.appendChild(O.ico(o.ic||'n:go',C.cls));if(o.kd)b.appendChild(el('small',null,o.kd));b.append(el('b',null,o.t),el('span',null,o.s||''));b.onclick=()=>sendPick(v,i,o);db.appendChild(b)})}
  renderMg(mgOn?v.mg:null);
  {const tg=$('tgts'),showT=!v.err&&!!me&&v.sc==='combat'&&!dc&&!mgOn&&!v.pz&&!!v.mo&&(v.ph==='aim'||v.ph==='boss');tg.hidden=!showT;if(showT){tg.textContent='';v.mo.forEach((m,i)=>{if(m.d)return;const b=el('button',combat&&me.tg<0?'ask':null),bar=el('div','bar'),f=el('i');b.setAttribute('aria-pressed',i===me.tg);f.style.width=(100*m.hp/m.mx)+'%';bar.appendChild(f);
      const mine=!!m.it&&(m.it[0]===v.myId||m.it[7]===v.myId),pm=m.it&&m.it[4]!=null&&O.movesOf(m.id).mv[m.it[4]],it=m.st?'stunned this round':m.it&&m.it[9]===-1?'pulls its reels on its turn'+(m.it[3]?' (blunted)':''):pm?pm.name+(m.it[9]===0?' (no line)':m.it[6]>1.2?' (triple)':'')+' · '+O.intentText(m.id,{mv:m.it[4],t:m.it[0],t2:m.it[7],dmg:m.it[1],b:m.it[3],fv:m.it[8]},q=>q===v.myId?'you':'an ally'):m.it?(m.it[0]?(mine?`hits you for ${m.it[1]}`:`hits an ally for ${m.it[1]}`):`hits everyone for ${m.it[1]}`)+(m.it[3]?' (blunted)':'')+(O.TERR[m.it[2]]?', '+O.TERR[m.it[2]].it:''):`${m.hp} of ${m.mx}`;
      b.append(el('b',null,m.n),bar,el('small',mine?'mine':null,it+(m.bn?' · burning':'')));b.onclick=()=>sendTarget(i);tg.appendChild(b)})}}
  /* nothing to do this moment: show what the last attack did and how the party stands */
  {const w=$('watch'),showW=!v.err&&!!me&&v.sc==='combat'&&!combat&&!dc&&!mgOn&&!v.pz&&(v.ph==='aim'||v.ph==='boss');w.hidden=!showW;if(showW){const w=$('watchBox');w.textContent='';$('liveWrap').hidden=true;
      if(me.ls&&me.ls[0]===C.lsSeen&&C.lsRd===rdKey(v)){const r=el('div','res');r.append(el('b',null,me.ls[1]>0?String(me.ls[1]):'Miss'),el('span',null,me.ls[1]>0?`damage from ${me.ls[2]} ball${me.ls[2]===1?'':'s'}`:'Nothing went in this time.'));w.appendChild(r)}
      const ul=el('div','pa');v.pa.forEach(p=>{const d=el('div',p.me?'you':null),bar=el('div','bar'),f=el('i');f.style.width=(100*p.hp/p.mhp)+'%';bar.appendChild(f);
        d.append(headCanvas(p.c,34,LANES[p.sl]),el('b',null,p.me?'You':CLASSES[p.c].name),bar,el('small',null,p.hp<=0?'down':p.aw?'away':v.ph!=='aim'?`${p.hp} / ${p.mhp}`:p.f?'loosed':'aiming'));ul.appendChild(d)});w.appendChild(ul)}}
  $('pad').hidden=!combat;if(!combat)return;
  {const tn=$('terrNote'),tr=v.bd&&v.bd.t;tn.hidden=!tr;if(tr){const T2=O.TERR[tr[0]];tn.textContent=`${T2.name} on the course. ${T2.note} ${tr[1]} round${tr[1]===1?'':'s'} left.`+(C.cls==='bard'?' Your hymns clear it.':'')}
    const rb=$('ramps');rb.style.visibility=ab.instant?'hidden':'';[...rb.children].forEach((b,i)=>b.setAttribute('aria-pressed',i===C.rp))}
  $('btnIns').hidden=!mon||!!v.cn;$('btnIns').setAttribute('aria-pressed',!!v.ins);$('btnIns').textContent=v.ins?'Back':'Look';$('btnLeave').hidden=!v.pr;
  const fxT=(me.fx&8?'Hexed: your balls do less damage this round. ':'')+(me.fx&32?'Shrunk: your next ball is two sizes smaller. ':'')+(me.fx&16?'Bleeding. ':'')+(me.fx&1?'Weapon Oil is on this attack. ':'')+(me.fx&2?'Grinding Chalk is on this attack. ':'')+(me.fx&4?'Lodestone Dust is on this attack. ':'');
  if(!v.it.length)C.bagOpen=false;const bb=$('btnBag');bb.hidden=!v.it.length;bb.textContent=C.bagOpen?'Close':`Bag ${v.it.length}`;bb.setAttribute('aria-pressed',!!C.bagOpen);$('pad').classList.toggle('bagopen',!!C.bagOpen);
  const bg=$('bag');bg.hidden=!C.bagOpen;if(C.bagOpen){bg.textContent='';bg.appendChild(el('h4',null,'Party bag · an item is free and does not use up your attack'));const w=el('div','its');v.it.forEach((id,i)=>{const b=el('button'),I=ITEMS[id],busy=(I.wheel||I.foe)&&v.cn,d=el('div');d.append(el('b',null,I.name),el('span',null,busy?'Wait for the attack on the big screen to finish.':I.desc));b.append(O.ico('it:'+id),d);b.disabled=!!(busy||((I.wheel||I.tgt)&&!mon));b.onclick=()=>{C.bagOpen=false;sendItem(i)};w.appendChild(b)});bg.appendChild(w)}
  const cdN=0,capT=lookMode()?'Previewing the course on the big screen.':C.ch?(SL.phase()==='aim'||SL.phase()==='steer'?'Steering. Tap Lock aim when it lines up.':SL.phase()==='locked'?'Aim locked. Drag down for power.':C.pw<.05?'Pull down for power.':'Let go to shoot.'):ab.instant?ab.name+' needs no aiming. Tap Cast.':fxT?fxT.trim():me.bf?'War Anthem: this attack hits 50% harder.':v.pr?'Practice. Shots are free.':v.cn?'An ally is attacking. Line up your shot on the big screen.':'Your ball: '+ab.name+(me.bg.length>1?' (tap another below to switch)':'');
  {const md0=O.mods({cls:C.cls,lv:me.lv,ups:me.up});cl.ab.forEach((a,i)=>{const b=$('ab'+i),on=me.bg.includes(i),sz=a.m?Math.max(1,O.mSize(a.m.r)-(md0.sizeDown||0)-(me.fx&32?2:me.fx&2?1:0)):0;b.hidden=!on;b.setAttribute('aria-pressed',i===C.ab);{const f=O.ballFx(C.cls,i,me.ow[0]);b.classList.toggle('spec',!!f);if(f)b.style.setProperty('--fx',f.k==='prism'?'#ff8ad8':f.c);else b.style.removeProperty('--fx')}{const alt=me.sw>=0&&i===(me.ow[0]||0);b.classList.toggle('alt',alt);b.children[1].textContent=alt?'or '+a.name:a.name}b.classList.remove('cool');b.lastChild.className='bonus';b.lastChild.textContent=sz?'\u25CF'.repeat(sz):'';b.setAttribute('aria-label',(me.sw>=0&&i===(me.ow[0]||0)?`${a.name}, instead of ${cl.ab[me.sw].name}`:a.name)+(sz?`, ${O.SIZE_NAMES[sz].toLowerCase()} ball`:''))})}
  {const so=$('slot'),need=!!me.g&&C.spun<2&&!v.pz&&!lookMode();so.hidden=!need;$('pad').classList.toggle('spinning',need);so.classList.toggle('done',!!C.stopped);$('abil').style.visibility=need?'hidden':'';so.classList.toggle('going',C.spun===1);so.classList.toggle('jack',C.spun===1&&sl.jack>0);
    if(need&&C.slotDom!==C.slotKey+':'+C.spun){C.slotDom=C.slotKey+':'+C.spun;symCss();const rl=$('reels');rl.textContent='';const pool='bbllffeescw',md1=O.mods({cls:C.cls,lv:me.lv,ups:me.up}),nl=md1.lines?7:5,rec=O.recipes(C.cls),LC=['#ffd24a','#7fe0c8','#ff8a6a','#c9a0ff','#9fd0ff','#ffb0d8','#d0ff8a'];
      const cell=(ch,idx)=>{const d=el('div','cell');if(ch==='?'){d.appendChild(el('i','sy sy-q'));return d}d.appendChild(el('i','sy sy-'+ch));if(idx>=0&&sl.hit[idx])d.classList.add('hit');return d};
      for(let c=0;c<4;c++){const reel=el('div','reel'),strip=el('div','strip');reel.style.setProperty('--c',c);
        if(!C.spun)for(let r=0;r<3;r++)strip.appendChild(cell('?',-1));
        else{const n=16+c*7;strip.style.setProperty('--n',n);for(let k=0;k<n;k++)strip.appendChild(cell(pool[Math.floor(Math.random()*pool.length)],-1));for(let r=0;r<3;r++)strip.appendChild(cell(me.g[c*3+r]||'b',c*3+r))}
        reel.appendChild(strip);rl.appendChild(reel)}
      // the winning lines, drawn across the glass once the reels have stopped
      const NS='http://www.w3.org/2000/svg',sv=document.createElementNS(NS,'svg');sv.setAttribute('viewBox','0 0 4 3');sv.setAttribute('preserveAspectRatio','none');sv.setAttribute('class','payl');
      if(C.spun)sl.pays.forEach((p,k)=>{const pl=document.createElementNS(NS,'polyline');pl.setAttribute('points',p.cells.map(ci=>(Math.floor(ci/3)+.5)+','+(ci%3+.5)).join(' '));pl.setAttribute('stroke',LC[p.li%LC.length]);pl.style.setProperty('--k',k);sv.appendChild(pl)});rl.appendChild(sv);
      const tabs=(side)=>{const t=$(side);t.textContent='';for(let li=0;li<nl;li++){const b=el('b',C.spun&&sl.pays.some(p=>p.li===li)?'on':null,String(li+1));b.style.setProperty('--lc',LC[li]);t.appendChild(b)}};tabs('lineL');tabs('lineR');
      // the pay table: each attack you know and the line that unlocks it
      const pt=$('paytab');pt.textContent='';me.ow.forEach(i=>{const pat=rec[i];if(!pat)return;const r=el('div','pt'+(C.spun&&sl.ok.includes(i)?' on':''));const sy=el('span','pat');pat.forEach(ch=>sy.appendChild(el('i','sy sy-'+ch)));r.append(sy,el('b',null,cl.ab[i].name));pt.appendChild(r)});
      if(!me.ow.some(i=>rec[i]))pt.appendChild(el('p',null,'Learn more attacks and their lines appear here.'));
      const names=(me.bg.length?me.bg:[]).filter(i=>rec[i]).map(i=>cl.ab[i].name),pays=[...new Set(sl.pays.map(p=>(p.n===4?'Four ':'Three ')+O.SYMS[p.sym].toLowerCase()+'s: '+O.LINEPAY[p.sym]))];
      /* what the spin won, spelled out: the ball first, then every bonus once, with its size */
      {const ss=$('slotSum');ss.textContent='';ss.className=C.spun?'win'+(names.length||sl.jack?' big':''):'';
        if(!C.spun)ss.textContent='Match a line to win a special ball for this turn. Stars are wild. No line: your basic ball.';
        else{const fx=sl.fx||{},nl2=new Set(sl.pays.map(p=>p.li)).size,head=sl.jack?'JACKPOT! Four of a kind':sl.pays.length||names.length?`${nl2} line${nl2===1?'':'s'} paid`:'No line';
          const li=[];li.push(names.length?['Ball',names.join(' and ')]:['Ball',cl.ab[me.ow[0]].name+' (your basic attack)']);
          const dm=Math.round(((sl.mult||1)-1)*100);if(dm>0)li.push(['Damage',`+${dm}%`+(sl.jack?(dm>50?', of which +50% is the jackpot':' from the jackpot'):'')]);
          if(fx.burn)li.push(['Burn',`if it sinks, the monster burns for ${Math.round(fx.burn*100)}% of the hit over 3 rounds`]);if(fx.sure)li.push(['Eye','the ball drops into the first open hole it crosses']);
          if(fx.blunt)li.push(['Skulls','the monster’s next strike is blunted']);if(fx.heal||fx.gold)li.push(['Crowns',[fx.heal?`everyone heals ${Math.round(fx.heal)}`:'',fx.gold?`${fx.gold} gold`:''].filter(Boolean).join(', ')]);
          if(fx.again)li.push(['Bonus','spin again after this ball']);
          ss.appendChild(el('b','sh',head));const ul=el('ul','sl');for(const[k,v]of li){const r=el('li');r.append(el('span','k',k),el('span',null,v));ul.appendChild(r)}ss.appendChild(ul)}}}
    {const sb=$('spinBtn');sb.hidden=C.spun===1&&!C.stopped;sb.textContent=C.spun?'Take aim':'Pull the lever'}}
  const f=$('fire'),ok=canFire(v);f.disabled=!ok;f.hidden=!ab.instant;f.textContent='Cast';f.classList.toggle('hot',ok);$('pwBar').hidden=true;const useScope=(C.spun===2&&!ab.instant)||lookMode();$('scope').hidden=!useScope;$('dial').toggleAttribute('hidden',true);
  {const sh=$('scopeHint'),cp=$('cap'),tp=$('tip'),tipOn=!!C.tip&&performance.now()<C.tip.until&&!C.ch;sh.hidden=useScope;if(!useScope)sh.textContent=capT;cp.hidden=!useScope;cp.textContent='';if(v.tm)cp.appendChild(el('b',null,v.tm+'s'));cp.appendChild(document.createTextNode(capT));
    tp.hidden=!tipOn;if(tipOn){tp.textContent='';const d=el('div');d.appendChild(el('b',null,C.tip.t));if(C.tip.m)d.appendChild(el('small',null,C.tip.m));d.appendChild(el('span',null,C.tip.s));if(C.tip.ic)tp.appendChild(O.ico(C.tip.ic,C.cls));tp.appendChild(d)}}
  C.view=v;if(useScope)drawScope();
  let marks=null;if(sight&&v.bd){const a=C.aim*DEG,dx=Math.cos(a),dy=Math.sin(a),Cc=v.bd.C;marks=v.bd.h.map(h=>{const rx=h[0]-me.x,ry=h[1]-O.COURSE.TEE,al=rx*dx+ry*dy,pe=Math.abs(rx*dy-ry*dx);return al>0&&pe<h[2]+40?al:-1}).filter(d=>d>0).sort((p,q)=>p-q).slice(0,3)}
  $('marks').hidden=!marks||!marks.length;for(let i=0;i<3;i++){const e=$('mk'+i),d=marks&&marks[i];e.hidden=!d;if(d)e.style.left=O.powOf(v.bd.C.len,d)*100+'%'}
}
/* ---------- mini games on the phone: one control per game. Each sends a single growing value; the big screen shows the scene. ---------- */
const mgNow=g=>{if(!g)return 0;if(isLocal())return g.t;const now=performance.now(),k=g.id+':'+g.st;
  if(C.mgTk!==k+':'+g.t){const fresh=C.mgTkB!==k;C.mgTk=k+':'+g.t;C.mgTkB=k;const est=fresh?g.t:C.mgT0+(now-C.mgTR)/1000,target=g.t+.05,d=target-est;C.mgT0=fresh||Math.abs(d)>.6?target:est+d*.12;C.mgTR=now}
  return C.mgT0+(now-C.mgTR)/1000};
function mgEl(){let x=$('mgX');if(!x){x=el('div');x.id='mgX';$('mgPad').insertBefore(x,$('mgBtn'))}return x}
const G0n=()=>{const v=getView();return v&&v.pa?v.pa.filter(p=>!p.aw).length:1};
/* the kit phone pads are built from (mg_*.js: def.pad(K)) */
O.glyphEl=(n,s,c)=>glyphEl(n,s,c);
function glyphEl(name,size,col){const gl=O.GLYPHS[name]||O.GLYPHS.star,ns='http://www.w3.org/2000/svg',sv=document.createElementNS(ns,'svg');sv.setAttribute('viewBox','0 0 48 48');sv.setAttribute('width',size||44);sv.setAttribute('height',size||44);
  const p=document.createElementNS(ns,'path');p.setAttribute('d',gl[1]);p.setAttribute('fill',col||gl[0]);p.setAttribute('fill-rule','evenodd');sv.appendChild(p);sv.classList.add('gly');return sv}
function mgKit(g,d,sl,t,x){const st=C.mgS||(C.mgS={});return{g,d,sl,t,x,s:st,first:!x.firstChild,O,G0n,LANES,
  send:v=>{sendMg(g.id,v);C.mgK=''},buzz:v=>O.buzz(v),now:()=>mgNow(getView().mg),live:()=>getView().mg,
  btn:(label,cls,fn,hold)=>mgBtn(label,cls,fn,hold),glyph:glyphEl,el,
  row(cols,...els){const r=el('div','mgRow');r.style.gridTemplateColumns=`repeat(${cols},1fr)`;r.append(...els);return r},
  meter(cls){const m=el('div','mgMeter '+(cls||''));const i=el('i');m.appendChild(i);m.set=f=>{i.style.width=Math.round(clamp(f,0,1)*100)+'%'};return m},
  canvas(h){const cv=document.createElement('canvas');cv.className='mgCv';cv.style.height=(h||320)+'px';return cv},
  fit(cv){const w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return[x,w,h]},
  /* motion helpers for pads: mo is whether motion is in use; each is a no-op without it */
  mo:MO.use(),tilt:()=>MO.tilt(),
  /* tilt left/right picks one of n spots across a row (level is the middle); it only moves on once you are clearly past the halfway between spots */
  slide(n,cur,fn,full){if(!MO.use())return;const t=clamp(MO.tilt().x/(full||.8),-1,1),f=(t+1)/2*(n-1),c=st._sl!=null?st._sl:cur;if(c==null||Math.abs(f-c)>.68){const k=Math.round(f);if(k!==c){st._sl=k;fn(k)}}},
  /* a tilt gesture: lean past the line one way (0 top away, 1 right, 2 top toward you, 3 left) and it fires once; come back near level to arm it again. rep: repeat while held */
  lean(fn,o){if(!MO.use())return;o=o||{};const tl=MO.tilt(),ax=Math.abs(tl.x)>=Math.abs(tl.y),v=ax?tl.x:tl.y,dir=ax?(v>0?1:3):(v>0?2:0),now=performance.now(),on=o.on||.45;
    if(Math.abs(v)>=on){if(st._ld==null||(o.rep&&st._ld===dir&&now-st._lt>o.rep)){st._ld=dir;st._lt=now;fn(dir)}}else if(Math.abs(tl.x)<.22&&Math.abs(tl.y)<.22)st._ld=null},
  shake(fn){if(MO.use())MO.onSwing=fn},jolt(fn){if(MO.use())MO.onJolt=fn},
  drawGlyph(x,name,cx,cy,s,col){const gl=O.GLYPHS[name]||O.GLYPHS.star;x.save();x.translate(cx-s/2,cy-s/2);x.scale(s/48,s/48);x.fillStyle=col||gl[0];x.fill(new Path2D(gl[1]),'evenodd');x.restore()}}}
function mgStatus(g,d,sl){const r=el('div','mgStat');const hp=d.hp&&d.hp[sl],out=d.out&&d.out[sl]!=null;
  const D0=O.MG[g.k],mx=D0&&D0.hearts===true?3:(D0&&D0.hearts)||3;if(hp!=null&&!out){const h=el('span','mgHearts');for(let i=0;i<mx;i++)h.appendChild(el('i',i<hp?'on':null,'♥'));r.appendChild(h)}
  const pr=d.pr&&d.pr[sl];if(pr)r.appendChild(el('b',null,String(pr)));return r}
function renderMg(g){
  const pad=$('mgPad');pad.hidden=!g;if(!g){C.mgId=0;MO.onSwing=null;MO.onJolt=null;return}
  const v0=getView(),me=v0&&v0.me,sl=me?me.sl:0;
  if(C.mgId!==g.id){MO.onSwing=null;MO.onJolt=null;C.mgId=g.id;C.mgV='';C.mg=null;C.mgK='';C.mgSt='';C.mgS={};C.mgN=0;C.mgTaps=[];C.mgPicks=[];C.lkK=-1;C.mgPick=null;C.swN=0}
  const D=O.MG[g.k],d=g.d||{},x=mgEl(),t=mgNow(g),dots=$('mgDots');$('mgT').textContent=d.name||D.name;$('mgBtn').hidden=true;dots.hidden=true;
  const out=d.out&&d.out[sl]!=null,live=D.live||g.k==='lock'||g.k==='forge'||g.k==='pendulum'||(D.motion&&MO.use());
  const key=g.k+':'+g.st+':'+(D.motion?(MO.use()?'M':'m')+(MO.ok===false?'x':''):'')+(g.st==='brief'?(g.go?Math.ceil((O.MG_BRIEF||7)-t):'w')+'r'+Object.keys(d.rdy||{}).join(''):g.st==='play'?(out?'out'+(d.swn&&d.swn[sl])+(d.sw&&d.sw[sl]):mgKeyOf(g,d,sl,t)):'')+':'+g.ok;if(key===C.mgK&&!(live&&g.st==='play'&&!out))return;C.mgK=key;
  if(C.mgSt!==g.st+(out?'o':'')){C.mgSt=g.st+(out?'o':'');x.textContent='';if(g.st==='play'&&D.motion&&MO.use())MO.calibrate()}   // however they hold it now is level
  if(g.st==='brief'){x.textContent='';const waitR=!g.go,mrow=D.motion?motionRow(D):null;if(mrow)x.appendChild(mrow);const _=0,left=waitR?9:Math.ceil((O.MG_BRIEF||7)-t),bx=el('div','mgBrief');x.appendChild(bx);bx.appendChild(el('div','mgBig',D.kind==='trap'?'A trap!':'Get ready'));if(left<=3&&left>0)bx.appendChild(el('div','mgCount',String(left)));
    if(waitR){const rd=d.rdy||{},n=Math.max(0,G0n()-Object.keys(rd).length);if(!rd[sl])x.appendChild(mgBtn('I have read the rules: READY','go big',()=>{O.buzz(15);sendMg(g.id,'ready')}));else x.appendChild(el('p','mgNote',n?`Ready. Waiting for ${n} more…`:'Everyone is ready!'))}
    if(D.ctl)x.appendChild(el('p','mgGoal',D.ctl));$('mgP').textContent=D.brief;return}
  if(g.st==='done'){x.textContent='';const ok=!!(d.pass||{})[sl],kind=D.kind==='trap'?(ok?'ok':'bad'):(ok?'ok':'done'),box=el('div','mgDone '+kind);
    box.append(el('div','mgSeal',D.kind==='trap'?(ok?'✓':'✕'):(ok?'★':'◆')),el('div','mgBig '+(kind==='bad'?'bad':kind==='ok'?'ok':''),D.kind==='trap'?(ok?'Through!':'Caught!'):(ok?'Well done!':'Done')));
    if(d.pr&&d.pr[sl])box.appendChild(el('p','mgNote',String(d.pr[sl])));if(d.rw&&d.rw[sl])box.appendChild(el('p','mgNote',String(d.rw[sl])));x.appendChild(box);$('mgP').textContent=D.kind==='trap'?(ok?'You made it through.':'The trap got you.'):'The event is over.';return}
  if(out){$('mgP').textContent=!D.hearts||(d.sw&&d.sw[sl])?'You are out. Cheer the others on.':'Knocked out! Mash to climb back in, once.';if(!D.hearts&&!x.firstChild)x.appendChild(el('div','mgBig bad','Out'));if(!x.firstChild&&D.hearts&&!(d.sw&&d.sw[sl])){const n=el('div','mgCount');n.id='swN';x.append(n,mgBtn('CLIMB BACK IN','go big',()=>{O.buzz(8);C.swN=(C.swN||0)+1;sendMg(g.id,'!'+C.swN);$('swN').textContent=Math.min(O.MG_SW,C.swN)+' / '+O.MG_SW}))}
    if($('swN'))$('swN').textContent=Math.min(O.MG_SW,C.swN||0)+' / '+O.MG_SW;if(d.sw&&d.sw[sl]){x.textContent='';x.appendChild(el('div','mgBig bad','Out'))}return}
  if(!x.querySelector('.mgStat'))x.prepend(el('div','mgStat'));x.querySelector('.mgStat').replaceWith(mgStatus(g,d,sl));
  $('mgP').textContent=D.hint?D.hint(g,d,sl,t):mgHint(g,d,sl,t);
  if(D.pad){const area=mgArea(x),K=mgKit(g,d,sl,t,area);D.pad(K)}else mgControl(g,d,sl,t,x)}
function mgKeyOf(g,d,sl,t){const D=O.MG[g.k],base=JSON.stringify([d.pr&&d.pr[sl],d.hp&&d.hp[sl],d.out&&d.out[sl]]);if(D.key)return base+D.key(g,d,sl,t);
  if(g.k==='shrine')return base;
  if(g.k==='tome')return base+JSON.stringify([d.up,d.peek,d.turn,d.who,C.mgPick,Math.ceil(7-(t-(d.tt||0)))]);if(g.k==='gamble')return base+(t<d.bt?0:t<d.se?1:2)+':'+(C.mgV||'');return base+t}
function mgHint(g,d,sl,t){switch(g.k){
  case'lock':{const k=C.lk?C.lk.k:((d.set||{})[sl]||0);return k>=3?'All three set! Wait for the others.':`Press STOP while the needle is inside the gold band. Each tumbler is faster, with a thinner band.`}
  case'shrine':return'Tap a candle the moment it flickers blue to shield it. Tapping a steady one keeps your hands busy.';
  case'forge':return MO.use()?'Swing your phone (or tap) as each ember touches the gold line. The beat stays steady, then changes after a warning.':'Tap STRIKE as each ember touches the gold line. The beat stays steady, then changes after a warning.';
  case'tome':return d.who===sl?`Your turn: ${Math.max(0,Math.ceil(7-(t-(d.tt||0))))}s. Turn over two pages.`:'Watch and remember. Wait for your turn.';
  case'gamble':return t<d.bt?'Place your bet from the party’s purse.':t<d.se?'Watch the cups on the big screen!':'Which cup hides the ball?';}return''}
const mgBtn=(label,cls,fn,hold)=>{const b=el('button','btn mgB '+(cls||''),label);if(hold){b.addEventListener('pointerdown',e=>{fn(1);e.preventDefault()});const up=e=>{fn(0);e.preventDefault()};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)}else b.addEventListener('pointerdown',e=>{fn();e.preventDefault()});return b};
function mgArea(x){let a=x.querySelector('.mgArea');if(!a){a=el('div','mgArea');x.appendChild(a)}return a}
function mgControl(g,d,sl,t,x0){const send=v=>{sendMg(g.id,v);C.mgK=''},V=C.mgV||'',out=d.out&&d.out[sl]!=null,x=mgArea(x0);
  if(out){x.textContent='';x.appendChild(el('div','mgBig bad','Out!'));return}
  if(false){}
  else if(g.k==='lock'){
    /* the reliquary lock: a needle sweeps a channel, STOP inside the gold band sets the tumbler. The phone judges each pick at once, so the result shows straight away. */
    if(!x.querySelector('#mgLockCv')){x.textContent='';const cv=document.createElement('canvas');cv.id='mgLockCv';cv.className='mgLock';C.lk={k:0,t0:performance.now(),hits:[],fl:null};
      const stop=mgBtn('STOP','go big',()=>{const gv=getView().mg;if(!gv)return;const dd=gv.d,L=C.lk;if(L.k>=3||C.mgPicks.length>=5)return;const band=(dd.band&&dd.band[sl]||[.5,.5,.5])[L.k],w=(dd.w||[.1,.1,.1])[L.k],h=lockPin();
        C.mgPicks.push(+h.toFixed(3));send(C.mgPicks.join(','));const hit=Math.abs(h-band)<=w/2;L.hits.push([L.k,hit,h]);L.fl={t:performance.now(),hit,h};
        if(hit){L.k++;L.t0=performance.now();O.buzz([25,40,60]);mgFlash(L.k>=3?'Unlocked!':'Click!',true)}else{O.buzz(140);mgFlash('Missed',false)}});
      x.append(cv,stop);const loop=()=>{if(!cv.isConnected)return;drawLock(cv,getView().mg,sl);requestAnimationFrame(loop)};requestAnimationFrame(loop)}}
  else if(g.k==='shrine'){if(!x.querySelector('#vigilCv')){x.textContent='';const cv=document.createElement('canvas');cv.id='vigilCv';cv.className='mgLock';x.appendChild(cv);C.vg={prev:null,fl:null};
      /* three candles; tap the one that flickers */
      cv.addEventListener('pointerdown',e=>{e.preventDefault();const gv=getView().mg;if(!gv||gv.st!=='play')return;const r=cv.getBoundingClientRect(),k=Math.max(0,Math.min(2,Math.floor((e.clientX-r.left)/r.width*3))),c=(gv.d.c||{})[sl]||[],bz=(gv.d.bz||{})[sl]||0,t=mgNow(gv);
        if(c[k]===2)return;if(t<bz){O.buzz(60);return}send(String(k));if(c[k]===1){O.buzz([20,30,40]);mgFlash('Shielded!',true);C.vg.fl={k,t:performance.now(),ok:1}}else{O.buzz(160);mgFlash('Hands full!',false);C.vg.fl={k,t:performance.now(),ok:0}}});
      const loop=()=>{if(!cv.isConnected)return;drawVigil(cv,getView().mg,sl);requestAnimationFrame(loop)};requestAnimationFrame(loop)}}
  else if(g.k==='forge'){if(!x.querySelector('#mgLane')){x.textContent='';const cv=document.createElement('canvas');cv.id='mgLane';cv.className='mgLane small';
      /* a strike: from the button, or from a swing of the phone (the jolt comes a moment after the swing's peak, so it is taken a touch earlier) */
      const strike=lag=>{O.buzz(18);const gv=getView().mg;if(!gv||gv.st!=='play')return;const tt=mgNow(gv)-(lag||0);C.mgTaps.push(+tt.toFixed(2));send(C.mgTaps.slice(-8).join(','));let best=9;for(const b of gv.d.beats||[])best=Math.min(best,Math.abs(b-tt));C.mgFb={t:performance.now(),r:best<.1?'Perfect!':best<.2?'Good':'Off the beat',ok:best<.2}};
      const mo=MO.use();if(mo)MO.onSwing=()=>{if(!cv.isConnected){MO.onSwing=null;return}strike(.03)};
      x.append(cv,mgBtn(mo?'SWING or tap':'STRIKE','go big wide',()=>strike(0)));
      const loop=()=>{if(!cv.isConnected)return;drawForge(cv,getView().mg);requestAnimationFrame(loop)};requestAnimationFrame(loop)}}
  else if(g.k==='tome'){x.textContent='';const gr=el('div','mgCards'),mine=d.who===sl,pk=d.peek;
    for(let i=0;i<12;i++){const up=d.up[i]>=0?d.up[i]:pk&&(pk[0]===i||pk[1]===i)?(pk[0]===i?pk[2]:pk[3]):-1,own=d.own&&d.own[i]>=0?d.own[i]:-1,b=el('button','btn '+(up>=0?'up':C.mgPick===i?'sel':''));if(up>=0)b.appendChild(glyphEl((d.sym||O.DSYM[0])[up],40));if(own>=0)b.style.borderColor=LANES[own];
      b.onclick=()=>{if(!mine||d.peek||up>=0)return;if(C.mgPick==null||C.mgPick===i){C.mgPick=C.mgPick===i?null:i;C.mgK='';renderCtrl();return}O.buzz(15);send(d.turn+':'+C.mgPick+','+i);C.mgPick=null};gr.appendChild(b)}
    x.append(gr,el('p','mgNote',`Pairs found: ${d.found} of 6`+(d.cap?` · ${Math.max(0,d.cap-d.tries)} tries left`:'')))}
  else if(g.k==='gamble'){x.textContent='';const[bet,cup]=V?V.split(':').map(Number):[0,-1];
    if(t<d.bt){const r=el('div','mgRow four');[0,10,25,50].forEach(n=>{const bb=mgBtn(n?n+' gold':'No bet',n===bet?'on':'',()=>{if(n>(d.purse||0))return;O.buzz(10);send(n+':-1')});if(n>(d.purse||0))bb.disabled=true;r.appendChild(bb)});x.append(r,el('p','mgNote',`The party’s purse: ${d.purse} gold.`))}
    else if(t<d.se)x.appendChild(el('div','mgBig','Watch the cups!'));
    else if(!bet)x.appendChild(el('div','mgBig','No bet this time.'));
    else{const r=el('div','mgRow three');[0,1,2].forEach(i=>r.appendChild(mgBtn('Cup '+(i+1),cup===i?'on':'',()=>{if(cup>=0)return;O.buzz(20);send(bet+':'+i)})));x.appendChild(r)}}}
/* the smithy on the phone: embers fall down a lane and reach the anvil line exactly on the beat */
/* the smithy on the phone is only the hammer: the beat is on the big screen. It shows how your last strike landed. */
function drawForge(cv,g){if(!g||!g.d)return;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#120b08';x.fillRect(0,0,w,h);x.textAlign='center';
  const fb=C.mgFb,now=performance.now();if(fb&&now-fb.t<650){x.fillStyle=fb.ok?'#9dffb0':'#ff7a6a';x.font=`800 ${Math.round(Math.min(40,w/8))}px system-ui`;x.fillText(fb.r,w/2,h*.5)}
  else{x.fillStyle='#e8c05a';x.font=`800 ${Math.round(Math.min(24,w/14))}px system-ui`;x.fillText('Watch the big screen',w/2,h*.42);x.fillStyle='#bfb29a';x.font='600 14px system-ui';x.fillText(MO.use()?'Swing as each ember reaches the gold line':'Tap as each ember reaches the gold line',w/2,h*.42+26)}}
if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
function lockPin(){const L=C.lk,gv=getView().mg,per=((gv&&gv.d.per)||[1.5,1.05,.72])[Math.min(2,L.k)],u=((performance.now()-L.t0)/1000/per)%2;return u<1?u:2-u}
O.lkDbg=()=>({k:C.lk?C.lk.k:-1,pin:C.lk?lockPin():0});          // for tests
/* ---------- phone motion: tilt, tipping and swings, for the games that can use them. One tap turns it on (an iPhone asks permission); a game takes the way the phone is held when it starts as level. Buttons always still work. ---------- */
const MO={on:false,ok:null,b:0,g:0,b0:0,g0:0,t:0,swT:0,onSwing:null,pref:(()=>{try{return localStorage.getItem('ow_motion')==='1'}catch(e){return false}})()};O.motion=MO;
function moOri(e){if(e.beta==null)return;MO.b=e.beta;MO.g=e.gamma;MO.t=performance.now()}
function moMot(e){const a=e.acceleration,ag=e.accelerationIncludingGravity;let m=0;if(a&&a.x!=null)m=Math.hypot(a.x,a.y,a.z);else if(ag&&ag.x!=null)m=Math.abs(Math.hypot(ag.x,ag.y,ag.z)-9.81)*1.15;MO.t=performance.now();
  /* a swing: a sharp jolt, then a short rest before the next can count */
  const now=performance.now();if(m>13&&now-MO.swT>230){MO.swT=now;if(MO.onSwing)try{MO.onSwing()}catch(q){}}
  /* a jolt with a direction: up / down (along real up, however the phone is held) or left / right (along the screen).
     Some phones report motion with the signs flipped; resting readings against 'up' tell us which. */
  const R=Math.PI/180,b=MO.b*R,g=MO.g*R,u=[-Math.sin(g)*Math.cos(b),Math.sin(b),Math.cos(g)*Math.cos(b)];
  if(ag&&ag.x!=null){const gm=Math.hypot(ag.x,ag.y,ag.z);if(gm>8&&Math.abs(gm-9.81)<1.2){const dt=(ag.x*u[0]+ag.y*u[1]+ag.z*u[2])/gm;MO.sgv=MO.sgv==null?dt:MO.sgv*.92+dt*.08}}
  const sg=(MO.sgv==null||MO.sgv>=0)?1:-1;let L=null;if(a&&a.x!=null)L=[a.x*sg,a.y*sg,a.z*sg];else if(ag&&ag.x!=null)L=[ag.x*sg-9.81*u[0],ag.y*sg-9.81*u[1],ag.z*sg-9.81*u[2]];
  if(L&&MO.onJolt&&now-(MO.jT||0)>320){const an=MO.ang()*R,v=L[0]*u[0]+L[1]*u[1]+L[2]*u[2],lat=L[0]*Math.cos(an)-L[1]*Math.sin(an);
    if(Math.abs(v)>9&&Math.abs(v)>=Math.abs(lat)){MO.jT=now;try{MO.onJolt(v>0?'up':'down')}catch(q){}}else if(Math.abs(lat)>9){MO.jT=now;try{MO.onJolt(lat>0?'right':'left')}catch(q){}}}}
MO.supported=()=>typeof window.DeviceOrientationEvent!=='undefined'||typeof window.DeviceMotionEvent!=='undefined';
MO.enable=async()=>{try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted'){MO.ok=false;return false}}
    if(window.DeviceMotionEvent&&typeof DeviceMotionEvent.requestPermission==='function'){try{await DeviceMotionEvent.requestPermission()}catch(q){}}}catch(e){MO.ok=false;return false}
  if(!MO.on){window.addEventListener('deviceorientation',moOri);window.addEventListener('devicemotion',moMot);MO.on=true}
  return new Promise(res=>setTimeout(()=>{MO.ok=MO.t>0;if(MO.ok){MO.pref=true;try{localStorage.setItem('ow_motion','1')}catch(q){}}res(MO.ok)},900))};
MO.off=()=>{MO.pref=false;try{localStorage.setItem('ow_motion','0')}catch(q){}};
MO.use=()=>MO.on&&MO.ok&&MO.pref;O.motionOn=MO.use;
/* tilt in the screen's own directions, whichever way up the phone is turned. Worked from where 'up' points in the phone's own frame,
   so it stays steady even with the phone held near upright, where the raw roll angle swings wildly. x: right edge down is +, y: top edge up is +. */
MO.ang=()=>window.screen&&screen.orientation&&typeof screen.orientation.angle==='number'?screen.orientation.angle:(typeof window.orientation==='number'?window.orientation:0);
MO.raw=()=>{const an=MO.ang(),R=Math.PI/180,
  b=MO.b*R,g=MO.g*R,ux=-Math.sin(g)*Math.cos(b),uy=Math.sin(b),a=(((an%360)+360)%360)*R,sx=ux*Math.cos(a)-uy*Math.sin(a),sy=ux*Math.sin(a)+uy*Math.cos(a);
  return[Math.asin(clamp(-sx,-1,1))/R,Math.asin(clamp(sy,-1,1))/R]};
MO.calibrate=()=>{const r=MO.raw();MO.x0=r[0];MO.y0=r[1]};MO.x0=0;MO.y0=0;
MO.tilt=()=>{const r=MO.raw();return{x:clamp((r[0]-MO.x0)/30,-1.5,1.5),y:clamp((r[1]-MO.y0)/30,-1.5,1.5)}};
/* the switch on a motion game's rules screen */
function motionRow(D){const w=el('div','moRow');if(!MO.supported()){return null}
  if(MO.use()){const b=el('button','btn moBtn on','📱 Motion controls: ON');b.onclick=()=>{MO.off();C.mgK=''};w.append(b,el('small',null,D.mo||'Hold your phone comfortably when the game starts: that is taken as level.'))}
  else{const b=el('button','btn moBtn','📱 Use motion controls');b.onclick=async()=>{b.textContent='Asking…';const ok=await MO.enable();b.textContent=ok?'📱 Motion controls: ON':'Motion is not available here';C.mgK=''};w.append(b,el('small',null,MO.ok===false?'This phone or link cannot share motion. The buttons work as before.':'Optional. The buttons still work.'))}
  return w}
function mgFlash(t,ok){const f=el('div','mgFlash '+(ok?'ok':'bad'),t);document.body.appendChild(f);setTimeout(()=>f.remove(),760)}
/* the vigil on the phone: three tall candles; a flickering one bends, burns blue and shows a shrinking ring of time */
function drawVigil(cv,g,sl){if(!g||!g.d)return;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  const x=cv.getContext('2d'),d=g.d,c=(d.c||{})[sl]||[0,0,0],fe=(d.fe||{})[sl]||[0,0,0],t=mgNow(g),busy=t<((d.bz||{})[sl]||0),now=performance.now()/1000,V=C.vg||{};x.setTransform(dpr,0,0,dpr,0,0);
  const bg=x.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1a1220');bg.addColorStop(1,'#0c0909');x.fillStyle=bg;x.fillRect(0,0,w,h);
  x.fillStyle='#3a2e28';x.fillRect(0,h*.8,w,h*.2);x.fillStyle='#5a4a3a';x.fillRect(0,h*.8,w,4);
  for(let k=0;k<3;k++){const cx=w*(k+.5)/3,top=h*(.42+((k+1)%3)*.04),bw=Math.min(36,w*.09),st=c[k];
    x.fillStyle='rgba(255,255,255,.04)';if(k)x.fillRect(w*k/3-1,0,2,h*.8);
    const bd=x.createLinearGradient(cx-bw/2,0,cx+bw/2,0);bd.addColorStop(0,'#cfc2a4');bd.addColorStop(.5,'#f4ead2');bd.addColorStop(1,'#bfb294');x.fillStyle=bd;x.fillRect(cx-bw/2,top,bw,h*.8-top);
    x.fillStyle='#e8dcc0';x.beginPath();x.ellipse(cx,top,bw/2,5,0,0,7);x.fill();x.strokeStyle='#2a2020';x.lineWidth=3;x.beginPath();x.moveTo(cx,top);x.lineTo(cx,top-10);x.stroke();
    if(st===2){x.fillStyle='rgba(160,150,170,.35)';for(let i=0;i<4;i++){const yy=top-18-((now*30+i*20)%70);x.beginPath();x.arc(cx+Math.sin(now*2+i)*8,yy,6+i*2,0,7);x.fill()}x.fillStyle='#8a7a68';x.font='700 13px system-ui';x.textAlign='center';x.fillText('out',cx,h*.9);continue}
    const fl=st===1,wv=Math.sin(now*(fl?20:6)+k*2),fy=top-12,fh=fl?34:44,lean=fl?wv*14:wv*2;
    const gl=x.createRadialGradient(cx,fy-fh/2,4,cx,fy-fh/2,fh*1.6);gl.addColorStop(0,fl?'rgba(90,150,255,.55)':'rgba(255,170,70,.5)');gl.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gl;x.beginPath();x.arc(cx,fy-fh/2,fh*1.6,0,7);x.fill();
    x.fillStyle=fl?'#7ab8ff':'#ffb04a';x.beginPath();x.moveTo(cx-9,fy);x.quadraticCurveTo(cx-12+lean*.3,fy-fh*.5,cx+lean,fy-fh);x.quadraticCurveTo(cx+12+lean*.3,fy-fh*.5,cx+9,fy);x.closePath();x.fill();
    x.fillStyle=fl?'#e8f2ff':'#fff1c0';x.beginPath();x.ellipse(cx+lean*.2,fy-fh*.3,4,fh*.25,0,0,7);x.fill();
    if(fl&&fe[k]){const left=Math.max(0,fe[k]-t),tot=1.55;x.strokeStyle='#7ab8ff';x.lineWidth=5;x.beginPath();x.arc(cx,fy-fh/2,fh*.95,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,left/tot));x.stroke();x.fillStyle='#cfe4ff';x.font=`800 ${Math.round(Math.min(22,w/16))}px system-ui`;x.textAlign='center';x.fillText('TAP!',cx,h*.9)}}
  if(V.fl&&performance.now()-V.fl.t<350){const cx=w*(V.fl.k+.5)/3;x.strokeStyle=V.fl.ok?'#9dffb0':'#ff7a6a';x.lineWidth=4;x.strokeRect(w*V.fl.k/3+4,4,w/3-8,h*.8-8)}
  if(busy){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,0,w,h);x.fillStyle='#ffb0a0';x.font='800 20px system-ui';x.textAlign='center';x.fillText('Hands full…',w/2,h*.25)}
  const lit=c.filter(v=>v!==2).length;x.textAlign='left';x.fillStyle='#e8c05a';x.font='800 15px system-ui';x.fillText(`${lit} of 3 lit`,12,22)}
function drawLock(cv,g,sl){if(!g||!g.d||!C.lk)return;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  const x=cv.getContext('2d'),d=g.d,L=C.lk,k=Math.min(2,L.k),bands=(d.band&&d.band[sl])||[.5,.5,.5],bw=(d.w||[.1,.1,.1])[k],fam=getComputedStyle(document.body).getPropertyValue('--display')||'serif',now=performance.now();x.setTransform(dpr,0,0,dpr,0,0);
  const bg=x.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#211714');bg.addColorStop(1,'#120c0b');x.fillStyle=bg;x.fillRect(0,0,w,h);
  /* the three tumbler pins along the top: gold once set, the one you are on glows */
  const py=34,gap=Math.min(70,w/4);for(let i=0;i<3;i++){const cx=w/2+(i-1)*gap,set=i<L.k,cur=i===L.k&&L.k<3;x.fillStyle=set?'#e8c05a':'#2a2220';x.strokeStyle=cur?'#ffe8a0':'#5a4a3a';x.lineWidth=cur?3:2;
    x.beginPath();x.roundRect(cx-12,py-(set?20:12),24,set?32:24,5);x.fill();x.stroke();if(set){x.fillStyle='#fff4d0';x.fillRect(cx-3,py-16,6,6)}}
  /* the channel, its gold band and the sweeping needle */
  const top=74,bot=h-30,cx=w/2,cw=Math.min(120,w*.34),Y=v=>bot-(bot-top)*v;
  x.fillStyle='#0b0808';x.strokeStyle='#5a4a3a';x.lineWidth=2;x.beginPath();x.roundRect(cx-cw/2,top-6,cw,bot-top+12,10);x.fill();x.stroke();
  if(L.k<3){const b0=bands[k];const gy0=Y(b0+bw/2),gy1=Y(b0-bw/2);const gr=x.createLinearGradient(0,gy0,0,gy1);gr.addColorStop(0,'rgba(232,192,90,.35)');gr.addColorStop(.5,'rgba(255,214,110,.75)');gr.addColorStop(1,'rgba(232,192,90,.35)');x.fillStyle=gr;x.fillRect(cx-cw/2+3,gy0,cw-6,gy1-gy0);x.strokeStyle='#ffd66e';x.lineWidth=2;x.strokeRect(cx-cw/2+3,gy0,cw-6,gy1-gy0);
    const v=lockPin(),ny=Y(v),inside=Math.abs(v-b0)<=bw/2;x.fillStyle=inside?'#fff4d0':'#d8cdb2';x.shadowColor=inside?'#ffd66e':'transparent';x.shadowBlur=inside?16:0;x.fillRect(cx-cw/2-8,ny-4,cw+16,8);x.shadowBlur=0;
    x.fillStyle='#8a7a60';x.beginPath();x.moveTo(cx-cw/2-8,ny);x.lineTo(cx-cw/2-20,ny-9);x.lineTo(cx-cw/2-20,ny+9);x.fill();x.beginPath();x.moveTo(cx+cw/2+8,ny);x.lineTo(cx+cw/2+20,ny-9);x.lineTo(cx+cw/2+20,ny+9);x.fill()}
  else{x.fillStyle='#9dffb0';x.font=`800 ${Math.round(Math.min(34,w/9))}px ${fam}`;x.textAlign='center';x.fillText('Unlocked!',cx,(top+bot)/2)}
  /* where your last pick landed, fading */
  const fl=L.fl;if(fl&&now-fl.t<900){x.globalAlpha=1-(now-fl.t)/900;x.strokeStyle=fl.hit?'#9dffb0':'#ff7a6a';x.lineWidth=3;x.beginPath();x.moveTo(cx-cw/2-24,Y(fl.h));x.lineTo(cx+cw/2+24,Y(fl.h));x.stroke();x.globalAlpha=1}
  /* picks left, as little picks along the bottom */
  const left=5-C.mgPicks.length;x.textAlign='left';x.fillStyle='#bfb29a';x.font='600 13px system-ui';x.fillText('Picks',12,h-12);for(let i=0;i<5;i++){x.fillStyle=i<left?'#d8cdb2':'#3a302a';x.fillRect(58+i*14,h-24,5,14);x.fillRect(56+i*14,h-24,9,4)}
  x.textAlign='right';x.fillStyle='#e8c05a';x.font=`800 15px ${fam}`;x.fillText(L.k>=3?'All set':`Tumbler ${L.k+1} of 3`,w-12,h-12)}
const pinH=()=>{const per=C.pinPer||1.5,u=((performance.now()-C.pinT)/1000/per)%2;return u<1?u:2-u};
function drawShrine(g){const cv=$('mgCv');if(!cv)return;const d=(g&&g.d)||{},me=C.view&&C.view.me,sl=me?me.sl:0,shots=(d.sh||{})[sl]||0,flying=(d.b||[]).some(q=>q[2]===sl),A=C.mgAim,p=A&&(A.p||A.lock!=null||A.steered),ready=shots<3&&!flying;{const lb=$('mgLockBtn');if(lb){const lk=!!(A&&A.lock!=null),show=ready&&!(A&&A.p);lb.hidden=!show;const t=lk?'Unlock aim':'🔒 Lock aim';if(lb.textContent!==t)lb.textContent=t;lb.classList.toggle('on',lk)}}
  slingDraw(cv,{ch:!!p,ph:A?A.phase():'idle',pw:p?A.pw:0,aim:A?A.aim:90,lane:LANES[sl]||'#e9dfc6',col:'#e8e0c8',ready,msg:ready?`Shot ${shots+1} of 3 · ${(d.sk||{})[sl]||0} sunk`:shots>=3?`All three shots taken · ${(d.sk||{})[sl]||0} sunk`:'Watch your ball on the big screen',sub:'Press and slide sideways to steer'})}
/* the phone's own view of the wheel: holes your ball fits are bright, your aim line runs from your launch spot. Drag on it to aim. */
const SXA={x:130,y:40,w:740,h:1108},SXL={x:136,y:86,w:728,h:728};                    // the part of the field the phone shows: the wheel, the ground before it, and every launch spot
const SYM={
 b:['#2f6f66','<g transform="rotate(38 24 24)"><rect x="9" y="21" width="30" height="6" rx="3"/><circle cx="10" cy="20.500" r="4.200"/><circle cx="10" cy="27.500" r="4.200"/><circle cx="38" cy="20.500" r="4.200"/><circle cx="38" cy="27.500" r="4.200"/></g><g transform="rotate(-38 24 24)"><rect x="9" y="21" width="30" height="6" rx="3"/><circle cx="10" cy="20.500" r="4.200"/><circle cx="10" cy="27.500" r="4.200"/><circle cx="38" cy="20.500" r="4.200"/><circle cx="38" cy="27.500" r="4.200"/></g>',''],
 l:['#8a2a22','<g transform="rotate(45 24 24)"><path d="M21 4l3-4 3 4 1 25h-8z"/><rect x="14" y="29" width="20" height="4"/><rect x="22" y="33" width="4" height="9"/><circle cx="24" cy="44" r="3"/></g>','<g transform="rotate(45 24 24)"><path d="M24 3v25" stroke-width="1.400"/></g>'],
 f:['#b4541a','<path d="M24 4c2 9 13 12 13 24a13 13 0 01-26 0c0-7 5-9 6-15 3 3 3 6 3 6s4-6 4-15z"/>','<path d="M24 20c1 5 6 7 6 12a6 6 0 01-12 0c0-4 3-5 3-8 2 2 2 3 2 3s1-3 1-7z" fill="#e9dfc6" stroke="none"/>'],
 e:['#4a3a7a','<path d="M3 24q21-22 42 0-21 22-42 0z"/>','<circle cx="24" cy="24" r="8.500" fill="#e9dfc6" stroke="none"/><ellipse cx="24" cy="24" rx="2.800" ry="7" fill="#17110f" stroke="none"/>'],
 s:['#3a3340','<path d="M24 5c10 0 16 7 16 15 0 6-3 9-5 11v7H13v-7c-2-2-5-5-5-11C8 12 14 5 24 5z"/>','<g fill="#e9dfc6" stroke="none"><ellipse cx="17" cy="21" rx="4.600" ry="5"/><ellipse cx="31" cy="21" rx="4.600" ry="5"/><path d="M24 26l2.600 4.500h-5.200z"/><rect x="17" y="33" width="1.600" height="5"/><rect x="21.200" y="33" width="1.600" height="5"/><rect x="25.400" y="33" width="1.600" height="5"/><rect x="29.600" y="33" width="1.600" height="5"/></g>'],
 c:['#9a7416','<path d="M7 34L4 14l11 9 9-15 9 15 11-9-3 20z"/><rect x="7" y="36" width="34" height="5"/>','<g fill="#e9dfc6" stroke="none"><circle cx="24" cy="29" r="2.600"/><circle cx="14.500" cy="30" r="1.800"/><circle cx="33.500" cy="30" r="1.800"/></g>'],
 w:['#17110f','<path d="M24 3l4.500 13.500L42 12l-8.500 12L42 36l-13.500-4.500L24 45l-4.500-13.500L6 36l8.500-12L6 12l13.500 4.500z"/>','<circle cx="24" cy="24" r="5" fill="#c9a04c" stroke="none"/>'],
 q:['#6d5f55','<text x="24" y="33" font-size="26" font-weight="900" font-family="Georgia,serif" text-anchor="middle" stroke="none">?</text>','']};
let symDone=false;function symCss(){if(symDone)return;symDone=true;let css='';for(const k in SYM){const[ink,art,over]=SYM[k],svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M5 1h38l4 4v38l-4 4H5l-4-4V5z" fill="'+(k==='q'?'#2a2226':k==='w'?'#c9a04c':'#e3d9c0')+'"/><path d="M6.500 3.500h35l3 3v35l-3 3h-35l-3-3v-35z" fill="none" stroke="'+(k==='q'?'#17110f':ink)+'" stroke-width="1.300"/><g fill="'+ink+'" stroke="#17110f" stroke-width="1" stroke-linejoin="round" transform="translate(24 24) scale(.8) translate(-24 -24)">'+art+over+'</g></svg>';css+='.sy-'+k+'{background-image:url("data:image/svg+xml,'+encodeURIComponent(svg)+'")}'}const st=document.createElement('style');st.textContent=css;document.head.appendChild(st)}
const ckNow=()=>C.ck0+(C.view&&C.view.pz?0:(performance.now()-C.ckT)/1000);
function liveNow(){const B=C.lmB,A=C.lmA;if(!B||!B.m.length)return[];if(!A||!A.m.length)return B.m;const f=clamp((performance.now()-B.t)/Math.max(40,B.t-A.t),0,1);
  return B.m.map(q=>{const p0=A.m.find(a=>a[5]===q[5]);return p0?[p0[0]+(q[0]-p0[0])*f,p0[1]+(q[1]-p0[1])*f,p0[2]+(q[2]-p0[2])*f,q[3],q[4],q[5]]:q})}
/* Follow the balls the host says are in play: keep two samples to draw between, buzz when one of yours touches something or drops,
   and remember the path of your own shot so the launcher can show it afterwards. */
function trackLive(v){
  if(!v||v.err||!Array.isArray(v.lm))return;const now=performance.now();if(v.ck!==C.ckSeen){C.ckSeen=v.ck;C.ck0=v.ck;C.ckT=now}
  const sig=v.lm.map(q=>q[5]+':'+Math.round(q[0])+','+Math.round(q[1])).join('|');if(sig===C.lmSig)return;C.lmSig=sig;C.lmA=C.lmB;C.lmB={t:now,m:v.lm};
  const me=v.me;if(!me)return;const mine=v.cu===me.tg?v.lm.filter(q=>q[4]===me.sl):[];
  if(mine.length&&C.trailNew){C.trailNew=false;C.trail=[]}
  for(const q of mine){let t=C.trail.find(t=>t.id===q[5]);if(!t){if(C.trail.length>=6)continue;t={id:q[5],p:[],bn:q[6],end:'',z:0,live:0};C.trail.push(t)}
    const l=t.p[t.p.length-1];if((!l||Math.hypot(l[0]-q[0],l[1]-q[1])>9)&&t.p.length<80)t.p.push([q[0],q[1]]);if(q[6]>t.bn){t.bn=q[6];O.buzz(8)}t.z=q[2];t.live=now;t.end=''}
  for(const t of C.trail)if(t.live&&!mine.some(q=>q[5]===t.id)){t.end=t.z<-3?'sink':'stop';t.live=0;if(t.end==='sink')O.buzz([20,30,60])}}
/* live=false: the launcher's wheel, with your launch spot and band. live=true: the wheel being attacked right now, to watch while it is not your turn. */
/* the sling pad: no course on the phone (the big screen shows it). A slingshot: drag down anywhere, steer sideways, let go. */
/* the sling pad: no course on the phone (the big screen shows it). A slingshot: drag down anywhere, steer sideways, let go. */
function slingDraw(cv,o){const wrap=cv.parentNode,fill=cv.id==='scope',bw=fill?wrap.clientWidth:cv.clientWidth,bh=fill?wrap.clientHeight:cv.clientHeight;if(!bw||!bh)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(bw*dpr)||cv.height!==Math.round(bh*dpr)){cv.width=Math.round(bw*dpr);cv.height=Math.round(bh*dpr)}if(fill&&cv.style.width!==bw+'px'){cv.style.width=bw+'px';cv.style.height=bh+'px'}
  const x=cv.getContext('2d'),pw=o.ch?o.pw:0,a=o.aim*DEG,ux=Math.cos(a),uy=-Math.sin(a);
  x.setTransform(dpr,0,0,dpr,0,0);const bg=x.createRadialGradient(bw/2,bh*.4,10,bw/2,bh*.4,Math.max(bw,bh)*.7);bg.addColorStop(0,'#1d1518');bg.addColorStop(1,'#0b090a');x.fillStyle=bg;x.fillRect(0,0,bw,bh);
  const S=Math.min(bw,bh*1.1)/320,ax=bw/2,ay=bh*.3;
  const ph=o.ph||'idle',locked=ph==='pow'||ph==='locked';
  if(o.ready){x.save();x.translate(ax,ay);x.rotate(Math.atan2(uy,ux));x.globalAlpha=o.ch?1:.45;x.fillStyle=o.lane;const L=(58+pw*30)*S;x.fillRect(16*S,-4*S,L-14*S,8*S);x.beginPath();x.moveTo(L+18*S,0);x.lineTo(L,-14*S);x.lineTo(L,14*S);x.closePath();x.fill();
    if(ph==='aim'){x.globalAlpha=.5;x.strokeStyle=o.lane;x.lineWidth=2*S;x.setLineDash([5*S,6*S]);x.beginPath();x.moveTo(L+20*S,0);x.lineTo(L+120*S,0);x.stroke();x.setLineDash([])}x.restore();
    if(locked){const tx=ax+(ux>.2?-78:78)*S,ty=ay+8*S,k=S*1.1;x.fillStyle='rgba(11,9,10,.8)';x.beginPath();x.arc(tx,ty,15*k,0,7);x.fill();x.strokeStyle='#efe4cc';x.lineWidth=2.4*k;x.beginPath();x.arc(tx,ty-3*k,5*k,Math.PI,0);x.stroke();x.fillStyle='#efe4cc';x.fillRect(tx-7*k,ty-3*k,14*k,10*k)}}
  x.strokeStyle='#7a5a3a';x.lineCap='round';x.lineWidth=11*S;x.beginPath();x.moveTo(ax,ay+80*S);x.lineTo(ax,ay+34*S);x.moveTo(ax,ay+38*S);x.lineTo(ax-46*S,ay-18*S);x.moveTo(ax,ay+38*S);x.lineTo(ax+46*S,ay-18*S);x.stroke();
  const L2=pw*Math.min(bh*.22,100*S)+(o.ch?10*S:0),mx=ax-ux*L2,my=ay-uy*L2+(o.ch?0:6*S),mr=15*S;
  x.strokeStyle=o.ch?`rgb(${Math.round(200+55*pw)},${Math.round(190-90*pw)},${Math.round(160-110*pw)})`:'#a8907a';x.lineWidth=(3+3*pw)*S;x.beginPath();x.moveTo(ax-46*S,ay-18*S);x.lineTo(mx,my);x.lineTo(ax+46*S,ay-18*S);x.stroke();
  if(o.fx){const t=performance.now()/1000,gl=x.createRadialGradient(mx,my,mr*.4,mx,my,mr*2.4);gl.addColorStop(0,o.col);gl.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=.55+.25*Math.sin(t*7);x.fillStyle=gl;x.beginPath();x.arc(mx,my,mr*2.4,0,7);x.fill();x.globalAlpha=1;
    x.strokeStyle=o.col;x.lineWidth=2.5*S;x.beginPath();x.ellipse(mx,my,mr*1.7,mr*.6,t*2,0,7);x.stroke()}
  x.fillStyle=o.col;x.beginPath();x.arc(mx,my,mr,0,7);x.fill();x.strokeStyle=o.lane;x.lineWidth=3;x.beginPath();x.arc(mx,my,mr+4,0,7);x.stroke();
  /* the power: a big bar and number */
  const bx=bw*.08,bwid=bw*.84,by=bh-96*S,bhh=22*S;x.fillStyle='#0b090a';x.fillRect(bx,by,bwid,bhh);const gr=x.createLinearGradient(bx,0,bx+bwid,0);gr.addColorStop(0,'#5fb3a1');gr.addColorStop(.55,'#e8c05a');gr.addColorStop(1,'#e8603a');x.fillStyle=gr;x.fillRect(bx,by,bwid*pw,bhh);
  x.strokeStyle='rgba(236,226,200,.35)';x.lineWidth=1;x.strokeRect(bx+.5,by+.5,bwid-1,bhh-1);for(let k=1;k<10;k++){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(bx+bwid*k/10-1,by,2,bhh)}for(const q of[.25,.5,.75]){x.fillStyle='rgba(239,228,204,.8)';x.fillRect(bx+bwid*q-1.5,by-5*S,3,bhh+10*S)}
  x.textAlign='center';x.fillStyle='#efe4cc';
  if(o.ch){const fam=getComputedStyle(document.body).getPropertyValue('--display')||'serif';
    if(ph==='aim'||ph==='steer'){x.font=`800 ${Math.round(34*S)}px ${fam}`;x.fillText('Steer',ax,by-14*S);x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText('Slide sideways to aim, then tap Lock aim',ax,by-58*S)}
    else if(ph==='locked'){x.font=`800 ${Math.round(34*S)}px ${fam}`;x.fillText('Aim locked',ax,by-14*S);x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText('Now drag down anywhere for power',ax,by-58*S)}
    else{x.font=`800 ${Math.round(46*S)}px ${fam}`;x.fillText(pw<.05?'Pull down':Math.round(pw*100)+'%',ax,by-14*S);x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText(pw<.05?'Aim is locked · let go to keep it':'Let go to shoot · slide back up to hold',ax,by-58*S)}}
  else if(o.ready){x.font=`700 ${Math.round(19*S)}px system-ui`;x.fillText(o.msg||'Press and slide sideways to steer',ax,by-16*S);x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText(o.sub||'Then pull down for power',ax,bh-48*S)}
  else if(o.msg){x.font=`700 ${Math.round(18*S)}px system-ui`;x.fillText(o.msg,ax,by-16*S);if(o.sub){x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText(o.sub,ax,bh-48*S)}}}
function drawSling(){const v=C.view,cv=$('scope');if(!v||!v.me||cv.hidden)return;
  {const on=lookMode();if(on!==C.lvOn){C.lvOn=on;C.lv=[0,0,1,0,0];LP.clear();if(on&&(SL.p||SL.lock!=null)){SL.reset();C.ch=false;C.lk=0;C.pull=null;C.pw=0}pushCtrl()}if(on){lookDraw(cv);return}}const me=v.me,cl=CLASSES[C.cls],ab=cl.ab[C.ab];
  const other=v.sh&&v.sh!==v.myId?(v.pa||[]).find(q=>q.id===v.sh):null;
  const rdy=C.spun===2&&canFire(v)&&!ab.instant;if(!rdy&&(SL.lock!=null||SL.p)&&!(C.pull&&C.pull.key)){SL.reset();C.ch=false;C.lk=0;C.pull=null;C.pw=0;pushCtrl()}
  {const lb=$('lockBtn'),show=rdy&&!(C.pull&&C.pull.key)&&!SL.p,lk=SL.lock!=null;if(lb){if(lb.hidden===show)lb.hidden=!show;const t=lk?'Unlock aim':'🔒 Lock aim';if(lb.textContent!==t)lb.textContent=t;lb.classList.toggle('on',lk)}}
  const bfx=O.ballFx(C.cls,C.ab,me.ow[0]);
  slingDraw(cv,{ch:C.ch,ph:C.pull&&C.pull.key?'pow':SL.phase(),pw:C.pw,aim:C.aim,lane:LANES[me.sl]||'#e9dfc6',col:bfx?bfx.c:cl.col,fx:bfx?bfx.k:'',ready:rdy,msg:other?`Wait: the ${CLASSES[other.c].animal} is shooting`:'',sub:other?'Your turn comes next. Spin your reels meanwhile.':''})}
function drawScope(live){if(!live)return drawSling();
  const v=C.view,cv=$(live?'live':'scope');if(!v||!v.me||cv.hidden)return;const bd=live?v.bdc:v.bd;if(!bd)return;const Cc=bd.C,wrap=cv.parentNode,bw=wrap.clientWidth,bh=wrap.clientHeight;if(!bw||!bh)return;
  const dpr=Math.min(2,window.devicePixelRatio||1),X1=Math.max(320,(Cc.ext||300)+24),X0=-X1,Y0=-90,Y1=Cc.len+30,k=Math.min(bw/(X1-X0),bh/(Y1-Y0)),ox=bw/2,oy=bh/2+k*(Y0+Y1)/2,S=(px,py)=>[ox+px*k,oy-py*k],R=r=>r*k;
  if(cv.width!==Math.round(bw*dpr)||cv.height!==Math.round(bh*dpr)||cv.style.width!==bw+'px'){cv.width=Math.round(bw*dpr);cv.height=Math.round(bh*dpr);cv.style.width=bw+'px';cv.style.height=bh+'px'}
  const x=cv.getContext('2d'),me=v.me,cl=CLASSES[C.cls],ab=cl.ab[C.ab],ck=ckNow(),tm=performance.now()/1000,md=O.mods({cls:C.cls,lv:me.lv,ups:me.up}),msz=ab.m?Math.max(1,O.mSize(ab.m.r)-(md.sizeDown||0)-(me.fx&32?2:me.fx&2?1:0)):0;
  x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#0b090a';x.fillRect(0,0,bw,bh);
  /* the fairway and its rails */
  const edge=(sg)=>{const pts=[];for(let y=-40;y<=Cc.len;y+=20)pts.push(S(Cc.cx(y)+sg*Cc.half(y),y));return pts},L=edge(-1),Rr=edge(1).reverse();
  x.beginPath();[...L,...Rr].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle='#3d5132';x.fill();x.lineWidth=Math.max(3,R(14));x.strokeStyle='#d8cdb2';x.lineJoin='round';x.stroke();
  for(let y=0;y<Cc.len;y+=128){x.fillStyle='rgba(255,255,255,.03)';const a=S(Cc.cx(y)-Cc.half(y),y),b=S(Cc.cx(y+64)+Cc.half(y+64),y+64);x.fillRect(a[0],b[1],b[0]-a[0],a[1]-b[1])}
  {const t0=S(Cc.cx(0)-140,O.COURSE.TEE+30),t1=S(Cc.cx(0)+140,-40);x.fillStyle='#6a5a44';x.fillRect(t0[0],t0[1],t1[0]-t0[0],t1[1]-t0[1])}            // the tee
  for(const q of bd.sand){const[px,py]=S(q[0],q[1]);x.fillStyle='#b49a6a';x.beginPath();x.arc(px,py,R(q[2]),0,7);x.fill()}
  if(bd.t){const[tk,,sp,dir]=bd.t;for(const q of sp){const[px,py]=S(q[0],q[1]);x.fillStyle=tk==='rift'?'#2a5a8a':tk==='mire'?'#c9b080':'#7a7580';x.beginPath();x.arc(px,py,R(q[2]),0,7);x.fill();if(tk==='rift'){x.strokeStyle='#7ab8e0';x.lineWidth=2;x.stroke()}}
    if(tk==='gale'){x.strokeStyle='rgba(207,224,255,.7)';x.lineWidth=2;for(let i=0;i<8;i++){const y=320+((i*197+tm*120)%(Cc.len-500)),[px,py]=S(Cc.cx(y),y);x.beginPath();x.moveTo(px-dir*14,py-5);x.lineTo(px+dir*14,py);x.lineTo(px-dir*14,py+5);x.stroke()}}}
  for(const q of bd.blk){const[px,py]=S(q[0],q[1]);x.fillStyle='#8a8f9a';x.fillRect(px-R(q[2])/2,py-R(q[3])/2,R(q[2]),R(q[3]))}
  /* holes: lidded, grated (too small for your ball) or glowing (it fits). Each shows its worth and its size in dots. */
  x.textAlign='center';x.textBaseline='middle';
  bd.h.forEach((hh,hi)=>{const[px,py]=S(hh[0],hh[1]),rr=Math.max(5,R(hh[2])),lid=hh[4]>0||(!!hh[7]&&O.shutAt({shut:hh[7]},ck)),fit=live||!msz||ab.m.hymn||O.fitsSize(msz,hh[8]),col=O.TIER[clamp(hh[5],0,2)];
    x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.arc(px,py,rr+Math.max(4,R(26)),0,7);x.fill();                                   // the dish
    x.fillStyle='#050406';x.beginPath();x.arc(px,py,rr,0,7);x.fill();
    if(lid){x.fillStyle='#6a6f7a';x.beginPath();x.arc(px,py,rr+1,0,7);x.fill();x.strokeStyle='#b8a878';x.lineWidth=1.5;x.stroke();if(hh[4]>1){x.fillStyle='#fff';x.font='800 9px system-ui';x.fillText('\u00D7'+hh[4],px,py)}}
    else if(!fit){x.strokeStyle='#d2483a';x.lineWidth=2.5;x.beginPath();x.moveTo(px-rr*.7,py-rr*.7);x.lineTo(px+rr*.7,py+rr*.7);x.moveTo(px+rr*.7,py-rr*.7);x.lineTo(px-rr*.7,py+rr*.7);x.stroke();x.strokeStyle='#4a474e';x.lineWidth=2;x.beginPath();x.arc(px,py,rr,0,7);x.stroke()}
    else{x.strokeStyle=live?col:'#9dffb0';x.lineWidth=2.5+(live?0:Math.sin(tm*5+hi)*.8);x.beginPath();x.arc(px,py,rr+1.5,0,7);x.stroke()}
    const lx=px+rr+4,ly=py-rr-2;x.globalAlpha=(!fit&&!lid)?.5:1;x.fillStyle=(!fit&&!lid)?'#6a6670':col;x.beginPath();x.moveTo(lx,ly-8);x.lineTo(lx+24,ly-8);x.lineTo(lx+20,ly);x.lineTo(lx+24,ly+8);x.lineTo(lx,ly+8);x.fill();
    x.fillStyle='#14100c';x.font='800 11px system-ui';x.fillText(hh[3],lx+10,ly-1);x.globalAlpha=1;
    for(let d=0;d<hh[8];d++){x.fillStyle=(!fit&&!lid)?'#6a6670':'#efe6d2';x.beginPath();x.arc(lx+5+d*6,ly+12,2.2,0,7);x.fill()}
    if(hh[6]===1){const done=!!(bd.lk&(1<<(bd.locks?bd.locks.indexOf(hi):-1)));x.strokeStyle=done?'rgba(159,208,255,.3)':'#9fd0ff';x.lineWidth=2;x.setLineDash([3,3]);x.beginPath();x.arc(px,py,rr+6,0,7);x.stroke();x.setLineDash([])}
    if(hh[6]===2){x.strokeStyle='#9fd0ff';x.lineWidth=bd.open?3:1.5;x.beginPath();x.arc(px,py,rr+7+(bd.open?1.5*Math.sin(tm*6):0),0,7);x.stroke()}
    if(bd.sg===hi&&!lid){x.strokeStyle='#ff5a3a';x.lineWidth=2.5;x.beginPath();x.arc(px,py,rr+8+Math.sin(tm*7),0,7);x.stroke();x.fillStyle='#ff7a5a';x.font='800 13px system-ui';x.fillText('\u00BD',px-rr-12,py)}
    if(bd.wk===hi&&!lid){x.strokeStyle='#ffd24a';x.lineWidth=2.5;x.setLineDash([5,4]);x.beginPath();x.arc(px,py,rr+9,0,7);x.stroke();x.setLineDash([]);x.fillStyle='#ffd24a';x.font='800 13px system-ui';x.fillText('\u00D72',px-rr-14,py)}});
  for(const b of bd.b){const[px,py]=S(b[0],b[1]);x.fillStyle=b[3]?'#ffb54a':'#e9e2d0';x.beginPath();x.arc(px,py,Math.max(2.5,R(b[2])),0,7);x.fill();if(b[3]){x.strokeStyle='#ff7a2a';x.lineWidth=1.5;x.beginPath();x.arc(px,py,Math.max(2.5,R(b[2]))+3,0,7);x.stroke()}}
  if(bd.mv){const mv=bd.mv,t=bd.fz?0:ck;if(mv.k==='mill'){const a=O.millAng(mv,t),c=Math.cos(a),sn=Math.sin(a),[px,py]=S(mv.x,mv.y);x.strokeStyle='#b9ad9c';x.lineWidth=Math.max(3,R(14));x.lineCap='round';x.beginPath();x.moveTo(px-c*R(mv.len),py+sn*R(mv.len));x.lineTo(px+c*R(mv.len),py-sn*R(mv.len));x.stroke();x.fillStyle='#6d5a3a';x.beginPath();x.arc(px,py,4,0,7);x.fill()}
    else if(mv.k==='boulder'){const[px,py]=S(O.boulderX(Cc,mv,t),mv.y);x.fillStyle='#8a8590';x.beginPath();x.arc(px,py,Math.max(4,R(mv.rad)),0,7);x.fill()}}
  if(!live)for(const t of C.trail){if(t.p.length<2)continue;x.strokeStyle='rgba(233,226,208,.5)';x.lineWidth=2;x.setLineDash([2,6]);x.beginPath();t.p.forEach((q,i)=>{const[px,py]=S(q[0],q[1]);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.setLineDash([])}
  for(const q of liveNow()){const[px,py]=S(q[0],q[1]);x.fillStyle=LANES[q[4]];x.beginPath();x.arc(px,py-Math.max(0,q[2])*k*.4,Math.max(3,R(q[3]))*(1+Math.max(0,q[2])/200),0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=1.5;x.stroke()}
  if(live)return;
  /* your spot on the tee; once armed, the band you pull and the way the ball will leave */
  const[lx,ly]=S(me.x,O.COURSE.TEE),a=C.aim*DEG,dx=Math.cos(a),dy=-Math.sin(a),lane=LANES[me.sl];
  x.fillStyle=lane;x.globalAlpha=.4;x.beginPath();x.arc(lx,ly,9,0,7);x.fill();x.globalAlpha=1;
  if(!C.armed||ab.instant)return;
  const PV=46,pull=C.ch?C.pw:0,mx=lx-dx*pull*PV,my=ly-dy*pull*PV,mr=Math.max(4,R(ab.m.r));
  x.save();x.translate(lx,ly);x.rotate(-a);x.fillStyle=lane;x.beginPath();x.moveTo(12,-7);x.lineTo(12+[22,28,34][C.rp],0);x.lineTo(12,7);x.closePath();x.fill();x.restore();       // which way it leaves; no line beyond
  {const fan=ab.fan&&ab.fan.length>1?ab.fan:ab.jit?[-ab.jit,ab.jit]:null;if(fan){x.strokeStyle=lane;x.lineWidth=2;for(const off of fan){const a2=(C.aim+off)*DEG,c2=Math.cos(a2),s2=-Math.sin(a2);x.beginPath();x.moveTo(lx+c2*40,ly+s2*40);x.lineTo(lx+c2*62,ly+s2*62);x.stroke()}}}
  {const px0=-dy*16,py0=dx*16,hot=Math.round(200+55*pull)+','+Math.round(190-90*pull)+','+Math.round(160-110*pull);x.strokeStyle='rgb('+hot+')';x.lineWidth=2+2*pull;x.lineCap='round';x.beginPath();x.moveTo(lx+px0,ly+py0);x.lineTo(mx,my);x.lineTo(lx-px0,ly-py0);x.stroke()}
  x.fillStyle=cl.col;x.beginPath();x.arc(mx,my,mr,0,7);x.fill();x.strokeStyle=lane;x.lineWidth=2;x.beginPath();x.arc(mx,my,mr+4,0,7);x.stroke();
  if((ab.sight||md.eye||v.pr)&&C.ch){const d=O.powD(Cc.len,C.pw),[px,py]=S(me.x+Math.cos(a)*d,O.COURSE.TEE+Math.sin(a)*d);x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(px,py,7,0,7);x.stroke()}}
/* Pull back and release. Touch anywhere on the wheel and drag: the ball is drawn back against the band the opposite way,
   so dragging down and to the left aims up and to the right. The length of the pull is the power. Let go to launch; slide back to where you started to cancel. */
/* The two-step slingshot. First the finger steers: sliding sideways turns the aim (finely near where you started, faster further out).
   as many slides as you like. Nothing locks until the player taps Lock aim. After that the drag only sets power, so the two never fight.
   Unlock aim frees it again. Power eases off over its top fifth so strong shots are as precise as soft ones,
   and the phone buzzes as power passes each quarter. */
const LOCK_HOLD=450,TAP_MS=260;
const powCurve=t=>t<=.7?t*.8/.7:.8+(t-.7)/.3*.2;
function steerFrom(a0,dx){const a=Math.abs(dx),o=Math.min(a,90)*.32+Math.max(0,a-90)*.65;return a0-Math.sign(dx)*o}          // the aim follows the finger: slide right to aim right
function mkAim(o){const s={p:null,lock:null,aim:o.aim0||90,pw:0};
  const at=(h,ms)=>{const t=performance.now()-ms;for(let i=h.length-1;i>=0;i--)if(h[i][0]<=t)return h[i];return h[0]};
  const lockAt=(a,oy)=>{const p=s.p;s.lock=s.aim=clamp(a,o.lo,o.hi);s.pw=0;if(p){p.mode='pow';p.oy=oy;p.q=0;p.hist=[]}O.buzz(30);o.on()};
  const tick=()=>{};
  s.down=e=>{if(s.p)return;const now=performance.now();s.p={x:e.clientX,y:e.clientY,cx:e.clientX,cy:e.clientY,t0:now,st:now,sx:e.clientX,sy:e.clientY,hist:[[now,s.aim,e.clientX,e.clientY]],wasLocked:s.lock!=null,moved:false,mode:s.lock!=null?'pow':'aim',oy:e.clientY,a0:s.aim,q:0};s.pw=0;s.p.tm=setInterval(tick,40);o.on()};
  s.move=e=>{const p=s.p;if(!p)return;const now=performance.now(),x=e.clientX,y=e.clientY;p.cx=x;p.cy=y;if(Math.hypot(x-p.x,y-p.y)>8)p.moved=true;
    if(p.mode==='aim'){s.aim=clamp(steerFrom(p.a0,x-p.x),o.lo,o.hi);p.hist.push([now,s.aim,x,y]);if(p.hist.length>16)p.hist.shift();
      if(Math.hypot(x-p.sx,y-p.sy)>5){p.sx=x;p.sy=y;p.st=now}
      if(Math.abs(x-p.x)>3)s.steered=true}
    else{const raw=clamp((y-p.oy-8)/o.max(),0,1);s.pw=powCurve(raw);p.hist.push([now,s.pw]);if(p.hist.length>16)p.hist.shift();
      const q=s.pw>=1?4:Math.floor(s.pw*4);if(q>p.q)O.buzz(q>=4?28:12);p.q=q}
    o.on()};
  s.up=cancel=>{const p=s.p;if(!p)return;clearInterval(p.tm);s.p=null;const now=performance.now();
    if(cancel){s.pw=0;o.on();return}                 // the phone took the touch away (a system gesture or a long-press menu): keep the aim, never shoot
    if(p.mode==='aim'){s.pw=0;o.on();return}                 // lifting the finger while steering keeps the aim; it locks only from the button
    let pw=s.pw;if(p.hist.length){const h=at(p.hist,70);if(pw>=.05)pw=Math.max(.05,h[1])}
    if(pw>=.05){const a=s.lock;s.lock=null;s.steered=false;s.pw=0;s.aim=o.aim0||90;o.on();o.fire(a,pw);return}                 // each shot starts from straight ahead
    s.pw=0;o.on()};
  s.reset=()=>{if(s.p)clearInterval(s.p.tm);s.p=null;s.lock=null;s.pw=0;s.steered=false};
  s.lockNow=()=>{if(s.p||s.lock!=null)return;s.lock=s.aim;s.pw=0;O.buzz(30);o.on()};
  s.unlock=()=>{if(s.p||s.lock==null)return;s.lock=null;s.steered=true;O.buzz(12);o.on()};
  s.phase=()=>s.p?s.p.mode:s.lock!=null?'locked':s.steered?'steer':'idle';
  return s}
const SL=mkAim({lo:8,hi:172,aim0:90,max:()=>{const r=$('scope').getBoundingClientRect(),cl=CLASSES[C.cls];return clamp(r.height*.3,80,150)*1.1*clamp(cl.period/1.6,.82,1.45)*clamp(cl.ab[C.ab].slow||1,.7,1.3)*C.steady},    // each fighter draws differently: the archer's pull is long and fine, the warrior's short
  on:()=>{C.aim=SL.aim;C.pw=SL.pw;C.ch=!!(SL.p||SL.lock!=null||SL.steered);C.lk=SL.lock!=null?1:0;C.pull=SL.p;pullShow();if(!SL.p&&!C.ch){$('pwFill').style.width='0';pushCtrl()}renderCtrlSoon()},
  fire:(a,pw)=>{C.aim=a;C.pw=pw;C.lastPull={aim:a,pw};C.ch=false;C.lk=0;doFire(pw);C.pw=0;C.aim=SL.aim;setNeedle();pushCtrl();setTimeout(()=>{if(!C.ch)$('pwFill').style.width='0'},400);renderCtrl()}});
O.SL=SL;let rcT=0;function renderCtrlSoon(){if(rcT)return;rcT=setTimeout(()=>{rcT=0;renderCtrl()},60)}
/* while the course preview is open the pad turns the big screen's camera instead: drag to turn, pinch to zoom, two fingers to slide, double-tap to reset */
C.lv=[0,0,1,0,0];C.lvOn=false;const LP=new Map();let lpLast=null,lpTap=0;
const lookMode=()=>{const v=getView();return!!(v&&v.ins&&v.sc==='combat'&&v.ph==='aim')};
function lookApply(){const v=C.lv;v[0]=((v[0]+Math.PI*3)%(Math.PI*2))-Math.PI;v[1]=clamp(v[1],-1.2,.6);v[2]=clamp(v[2],.8,5);v[3]=clamp(v[3],-8,8);v[4]=clamp(v[4],-14,14);
  if(isLocal()){if(O.lookSet)O.lookSet(v)}else{const now=performance.now();if(now-C.pushT>60){C.pushT=now;pushCtrl()}else if(!C.pushQ){C.pushQ=setTimeout(()=>{C.pushQ=0;C.pushT=performance.now();pushCtrl()},70)}}if(!$('scope').hidden)drawScope()}
function lookNudge(dy,de,zm,dx,dz){const v=C.lv,c=Math.cos(v[0]),sn=Math.sin(v[0]),k=1/Math.max(.8,v[2]);v[0]+=dy||0;v[1]+=de||0;v[2]*=zm||1;v[3]+=((dx||0)*c+(dz||0)*sn)*k;v[4]+=(-(dx||0)*sn+(dz||0)*c)*k;lookApply()}
const lpTwo=()=>{const a=[...LP.values()];return{d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}};
function lookDown(e){const now=performance.now();if(LP.size===0&&now-lpTap<320){C.lv=[0,0,1,0,0];lookApply();lpTap=0}else if(LP.size===0)lpTap=now;LP.set(e.pointerId,{x:e.clientX,y:e.clientY});lpLast=LP.size===2?lpTwo():null}
function lookMove(e){const p=LP.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y,h=$('scope').clientHeight||400;p.x=e.clientX;p.y=e.clientY;
  if(LP.size===1)lookNudge(-dx/h*3,dy/h*2);else if(LP.size===2){const t=lpTwo();if(lpLast)lookNudge(0,0,t.d/Math.max(20,lpLast.d),-(t.x-lpLast.x)/h*7,-(t.y-lpLast.y)/h*7);lpLast=t}}
function lookUp(e){LP.delete(e.pointerId);lpLast=LP.size===2?lpTwo():null}
function lookDraw(cv){const wrap=cv.parentNode,bw=wrap.clientWidth,bh=wrap.clientHeight;if(!bw||!bh)return;const dpr=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==Math.round(bw*dpr)||cv.height!==Math.round(bh*dpr)){cv.width=Math.round(bw*dpr);cv.height=Math.round(bh*dpr)}if(cv.style.width!==bw+'px'){cv.style.width=bw+'px';cv.style.height=bh+'px'}
  const x=cv.getContext('2d'),S=Math.min(bw,bh*1.1)/320,ax=bw/2,ay=bh*.36;x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#120e10';x.fillRect(0,0,bw,bh);
  x.strokeStyle='rgba(239,228,204,.5)';x.lineWidth=2*S;x.setLineDash([6*S,6*S]);x.beginPath();x.arc(ax,ay,70*S,0,7);x.stroke();x.setLineDash([]);
  x.save();x.translate(ax,ay);x.rotate(-C.lv[0]);x.fillStyle='#e8c05a';x.beginPath();x.moveTo(0,-70*S);x.lineTo(-9*S,-54*S);x.lineTo(9*S,-54*S);x.closePath();x.fill();x.restore();
  x.fillStyle='#efe4cc';x.textAlign='center';x.font=`800 ${Math.round(18*S)}px system-ui`;x.fillText('×'+C.lv[2].toFixed(1),ax,ay+6*S);
  const fam=getComputedStyle(document.body).getPropertyValue('--display')||'serif';x.font=`800 ${Math.round(30*S)}px ${fam}`;x.fillText('Previewing',ax,bh*.66);
  x.font=`${Math.round(15*S)}px system-ui`;x.fillStyle='#bfb29a';x.fillText('Drag to turn · pinch to zoom',ax,bh*.66+28*S);x.fillText('Two fingers to slide · double-tap to reset',ax,bh*.66+50*S);x.fillText('Tap Back when you are ready to aim',ax,bh*.66+72*S)}
function pullStart(e){const v=getView();if($('scope').hidden||!C.cls||C.pull)return false;if(CLASSES[C.cls].ab[C.ab].instant||!canFire(v)||C.spun!==2)return false;
  if(!e.clientX&&!e.clientY){C.pull={key:true};C.ch=true;C.pw=0;C.tip=null;C.key='';pushCtrl();renderCtrl();return true}          // keyboard: the arrows aim, Space draws back
  C.tip=null;C.key='';SL.down(e);return true}
function pullMove(e){if(C.pull&&!C.pull.key)SL.move(e)}
function pullShow(){$('pwFill').style.width=(C.pw*100)+'%';setNeedle();const now=performance.now();if(now-C.pushT>60){C.pushT=now;pushCtrl()}else if(!C.pushQ){C.pushQ=setTimeout(()=>{C.pushQ=0;C.pushT=performance.now();pushCtrl()},70)}if(!$('scope').hidden)drawScope()}
function pullEnd(cancel){const p=C.pull;if(!p)return;
  if(p.key){C.pull=null;const pw=C.pw;C.ch=false;if(!cancel&&pw>=.05){C.lastPull={aim:C.aim,pw};doFire(pw);C.aim=SL.aim=90;setNeedle();pushCtrl()}else pushCtrl();C.pw=0;setTimeout(()=>{if(!C.ch)$('pwFill').style.width='0'},400);renderCtrl();return}
  SL.up(cancel)}
/* a small picture of a cosmetic: the ball, a trail's motes, a dye's cloth, a title's lettering */
function cosmChip(id,cls){const p=String(id).split(':'),o=O.cosmOf(id)||{};
  if(p[0]==='sk')return O.ico(id,cls);
  if(p[0]==='tr'){const w=el('span','trChip');w.style.setProperty('--c',o.col||'#fff');w.dataset.st=o.style||'';if(!o.style)w.classList.add('none');for(let i=0;i<5;i++)w.appendChild(el('i'));return w}
  if(p[0]==='dy'){const w=el('span','dyChip');w.style.setProperty('--c',o.col||'transparent');if(!o.col)w.classList.add('none');return w}
  return el('span','tiChip',o.name||'')}
/* the loot box reveal: rarity first, then what it is */
function showBox(id){const o=O.lockInfo(id),ov=$('boxOv');if(!o)return;O.sfx('box');ov.textContent='';const R=O.RARITY[o.rar||0]||O.RARITY[0],ch=el('div','chest'),cd=el('div','card cosm r'+(o.rar||0));cd.style.setProperty('--rc',R.col);
  const pv=el('div','cPrev');if(!String(id).startsWith('ti:'))pv.appendChild(cosmChip(id,G.players[0]&&G.players[0].cls));cd.append(el('em','rar',R.name),pv,el('small',null,'New '+o.kind),el('b',null,o.name),el('p',null,o.desc),el('i',null,'Press to close.'));ov.append(ch,cd);ov.hidden=false;ov.onclick=()=>{ov.hidden=true}}
/* ---------- reward cards: every drop shows what kind of thing it is, with its own colour and picture ---------- */
function rewardType(u){u=String(u);if(u.startsWith('it:'))return'it';if(u.startsWith('re:'))return're';if(u.startsWith('ab:'))return'ab';const U=O.UPGRADES[u.replace(/^up:/,'')];if(!U)return'pass';
  if(U.ab)return'upab';if(/^sl_|^haste$/.test(u))return'reel';if(statOf(U))return'stat';return'pass'}
function statOf(U){const d=U.desc;let m;if((m=d.match(/\+(\d+) maximum health/)))return{v:'+'+m[1],g:'heart',w:'health'};if((m=d.match(/(\d+)% harder/))&&/^All your|^Your small/.test(d))return{v:'+'+m[1]+'%',g:'sword',w:'damage'};
  if((m=d.match(/take (?:a further )?(\d+)% less damage/)))return{v:'−'+m[1]+'%',g:'shield',w:'harm taken'};if((m=d.match(/^\+(\d+)% damage/)))return{v:'+'+m[1]+'%',g:'sword',w:d.replace(/^\+\d+% damage to /,'vs ').replace(/\.$/,'')};return null}
const RW_LABEL={ab:'New ability',upab:'Ability upgrade',reel:'Reel upgrade',stat:'Stat boost',pass:'Passive upgrade',it:'Item · party bag',re:'Relic · whole party'};
const REEL_ART={haste:['S','S','S'],sl_wild:['w','S','w'],sl_line:['S','w','S'],sl_pay:['S','S','S'],sl_jack:['S','S','S','S'],sl_mirror:['w','w','S'],sl_nail:['S','q','q'],sl_grave:['s','c','s']};
const REEL_CAP={sl_line:'+2 lines',sl_pay:'×1.5 pays',sl_jack:'4 = 2 attacks',sl_mirror:'+20% a star',sl_nail:'always first',haste:'more often',sl_wild:'×2 stars',sl_grave:'×2 skulls'};
function ballArt(cls,i,small){const a=O.CLASSES[cls]&&O.CLASSES[cls].ab[i];if(!a)return el('span');const w=el('span','rwBall'+(small?' sm':''));
  if(!a.m){w.classList.add('inst');w.appendChild(O.ico('ab:'+cls+':'+i,cls));return w}
  const fx=O.ballFx(cls,i,-1)||{c:O.CLASSES[cls].col,k:''},b=el('i');b.style.setProperty('--c',fx.c);const d=Math.round((small?18:26)+(a.m.r-10)*(small?1.3:2.1));b.style.width=b.style.height=d+'px';w.appendChild(b);
  if(!small&&a.m.mult)w.appendChild(el('em',null,'×'+a.m.mult));return w}
function reelArt(syms,cls){symCss();const S=(O.SIG[cls]||O.SIG.warrior)[0],w=el('span','rwReel');for(const q of syms){const c=el('span','cell');c.appendChild(el('i','sy sy-'+(q==='S'?S:q)));w.appendChild(c)}return w}
function rewardCard(u,cls,o){o=o||{};u=String(u);const ty=rewardType(u),inf=O.upInfo(u,cls)||(u.startsWith('re:')&&RELICS[u.slice(3)])||{name:u,desc:''},card=el(o.div?'div':'button','rwCard rw-'+ty+(o.mini?' mini':'')),art=el('div','rwArt'),tx=el('div','rwTx');
  if(ty==='ab'){const i=+u.slice(3);art.appendChild(ballArt(cls,i));const pat=O.recipes(cls)[i];if(pat&&!o.mini){const r=reelArt(pat,cls);r.classList.add('pat');art.appendChild(r)}}
  else if(ty==='upab'){const U=O.UPGRADES[u],i=O.CLASSES[cls].ab.findIndex(a=>a.id===U.ab);if(i>=0){art.appendChild(ballArt(cls,i,true));art.appendChild(el('b','plus','+'))}else art.appendChild(O.ico(u,cls,'big'))}
  else if(ty==='reel'){art.appendChild(reelArt(REEL_ART[u]||['S','w','S'],cls));if(!o.mini&&REEL_CAP[u])art.appendChild(el('small','cap',REEL_CAP[u]))}
  else if(ty==='stat'){const st=statOf(O.UPGRADES[u]);art.append(el('b','big',st.v),el('small','cap',st.w))}
  else art.appendChild(O.ico(u,cls,'big'));
  tx.append(el('em','rwType',ty==='upab'?'Upgrades '+(O.CLASSES[cls].ab.find(a=>a.id===O.UPGRADES[u].ab)||{name:'an ability'}).name:RW_LABEL[ty]),el('b',null,inf.name.replace(/^Learn /,'')));
  if(!o.mini)tx.appendChild(el('span',null,(inf.desc||'').replace(/^Item for the party bag\. /,'')));card.append(art,tx);if(o.onclick)card.onclick=o.onclick;return card}
function doFire(pow){const v=getView();if(!canFire(v))return;C.pendSn=v.me.sn;C.sentAt=performance.now();C.trailNew=true;O.buzz(25);
  if(isLocal()){const pl=G.players.find(p=>p.id==='local');if(pl)O.fire(pl,C.ab,C.aim,pow,C.rp)}else C.shot={n:++C.seq,ab:C.ab,rp:C.rp,ang:Math.round(C.aim*10)/10,pow:Math.round(pow*1000)/1000};C.armed=false;
  pushCtrl();renderCtrl()}
let ctrlUp=false;
function initCtrl(){
  if(ctrlUp){renderCtrl();return}ctrlUp=true;buildPick();
  const tk=$('ticks');for(let a=0;a<=180;a+=15){const l=document.createElementNS('http://www.w3.org/2000/svg','line'),r1=a%45?128:118,ca=Math.cos(a*DEG),sa=Math.sin(a*DEG);
    l.setAttribute('class','tick');l.setAttribute('x1',150+ca*r1);l.setAttribute('y1',162-sa*r1);l.setAttribute('x2',150+ca*138);l.setAttribute('y2',162-sa*138);tk.appendChild(l)}
  const dial=$('dial');let drag=false;
  const aimAt=e=>{const r=dial.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*300,py=(e.clientY-r.top)/r.height*172;let a=Math.atan2(162-py,px-150)/DEG;if(a<0)a=px<150?180:0;C.aim=clamp(a,8,172);setNeedle();pushCtrl()};
  dial.addEventListener('pointerdown',e=>{drag=true;try{dial.setPointerCapture(e.pointerId)}catch(x){}aimAt(e);e.preventDefault()});
  dial.addEventListener('pointermove',e=>{if(drag)aimAt(e)});const stop=()=>{drag=false};dial.addEventListener('pointerup',stop);dial.addEventListener('pointercancel',stop);
  dial.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')C.aim=clamp(C.aim+2,8,172);else if(e.key==='ArrowRight')C.aim=clamp(C.aim-2,8,172);else return;setNeedle();pushCtrl();e.preventDefault()});
  const f=$('fire');f.onclick=()=>{if(!C.cls||C.spun!==2||!canFire(getView()))return;if(CLASSES[C.cls].ab[C.ab].instant)doFire(0);else{C.armed=true;O.buzz(20);C.key='';renderCtrl()}};
  $('spinBtn').onclick=()=>{if(C.spun===1&&C.stopped){C.spun=2;C.armed=true;C.key='';pushCtrl();renderCtrl();return}if(C.spun)return;C.spun=1;C.stopped=false;C.key='';const k=C.slotKey;try{O.sfx('spin')}catch(e){}renderCtrl();[900,1350,1800,2250].forEach((t,i)=>setTimeout(()=>{if(C.slotKey!==k)return;O.buzz(i===3?[30,40,60]:18);try{O.sfx(i===3?'reelWin':'reelStop')}catch(e){}},t));
    setTimeout(()=>{if(C.slotKey!==k||C.spun!==1)return;C.stopped=true;C.key='';renderCtrl()},2700);setTimeout(()=>{if(C.slotKey!==k||C.spun!==1)return;C.spun=2;C.key='';renderCtrl()},20000)};        // the result stays up until you press Take aim
  $('swap').onclick=()=>{C.cls=null;C.key='';renderCtrl()};
  $('tabPlay').onclick=()=>{C.tab='play';C.key='';renderCtrl()};$('tabHero').onclick=()=>{C.tab='hero';C.key='';renderCtrl()};
  $('mgBtn').addEventListener('pointerdown',e=>{mgTap();e.preventDefault()});$('mgBtn').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){mgTap();e.preventDefault()}});
  {const sc=$('scope').parentNode;{const lb=document.createElement('button');lb.id='lockBtn';lb.className='lockBtn';lb.type='button';lb.hidden=true;sc.appendChild(lb);lb.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();if(SL.lock!=null)SL.unlock();else SL.lockNow();drawScope()});lb.addEventListener('click',e=>e.stopPropagation())}
    sc.addEventListener('pointerdown',e=>{if($('scope').hidden)return;if(lookMode()&&!C.pull){lookDown(e);try{sc.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();return}if(pullStart(e)){try{sc.setPointerCapture(e.pointerId)}catch(x){}}e.preventDefault()});
    if(window.ResizeObserver)new ResizeObserver(()=>{if(!$('scope').hidden)drawScope()}).observe(sc);sc.addEventListener('pointermove',e=>{if(LP.size){lookMove(e);e.preventDefault();return}if(C.pull){pullMove(e);e.preventDefault()}});sc.addEventListener('pointerup',e=>{if(LP.size){lookUp(e);return}pullEnd(false)});sc.addEventListener('pointercancel',e=>{if(LP.size){lookUp(e);return}pullEnd(true)});sc.addEventListener('contextmenu',e=>e.preventDefault());
    // without a pointer: left and right turn the aim, holding Space draws the band back, letting go launches
    sc.tabIndex=0;sc.setAttribute('role','application');sc.setAttribute('aria-label','Launcher. Left and right arrows aim. Hold Space to pull back, release to launch.');let kt=0;
    sc.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){C.aim=clamp(C.aim+(e.key==='ArrowLeft'?2:-2),8,172);SL.aim=C.aim;setNeedle();pushCtrl();if(!$('scope').hidden)drawScope();e.preventDefault()}
      else if(e.key===' '&&!e.repeat){if(pullStart({clientX:0,clientY:0})){const t0=performance.now();clearInterval(kt);kt=setInterval(()=>{if(!C.pull){clearInterval(kt);return}C.pw=clamp((performance.now()-t0)/1500,0,1);pullShow()},30)}e.preventDefault()}else if(e.key==='Escape'){pullEnd(true)}});
    sc.addEventListener('keyup',e=>{if(e.key===' '){clearInterval(kt);pullEnd(false);e.preventDefault()}})}
  const RIC=['M3 23h48v-3H3z','M3 23h48V12Q27 20 3 20z','M3 23h48V2Q31 19 3 20z'];
  O.RAMPS.forEach((r,i)=>{const b=el('button'),sv=document.createElementNS('http://www.w3.org/2000/svg','svg'),pa=document.createElementNS('http://www.w3.org/2000/svg','path');sv.setAttribute('viewBox','0 0 54 26');sv.setAttribute('aria-hidden','true');pa.setAttribute('d',RIC[i]);pa.setAttribute('fill','currentColor');sv.appendChild(pa);
    b.append(sv,el('span',null,r.short));b.setAttribute('aria-pressed',i===C.rp);b.onclick=()=>{C.rp=i;C.tip={ic:null,t:r.short,m:'',s:r.desc,until:performance.now()+3800};C.key='';pushCtrl();renderCtrl()};$('ramps').appendChild(b)});
  $('btnBag').onclick=()=>{C.bagOpen=!C.bagOpen;C.key='';renderCtrl()};
  $('btnIns').onclick=()=>{sendInspect();renderCtrl()};$('btnLeave').onclick=()=>{sendAct('leave');renderCtrl()};
  const ci=$('codeIn'),goCode=()=>{const c=cleanCode(ci.value);if(c.length<4){joinErr='The code is four letters. It is on the big screen.';C.key='';renderCtrl();return}C.editCode=false;C.noHostT=0;enterRoom(c);renderCtrl()};
  ci.addEventListener('input',()=>{ci.value=cleanCode(ci.value)});ci.addEventListener('keydown',e=>{if(e.key==='Enter'){goCode();e.preventDefault()}});$('codeGo').onclick=goCode;
  $('reCode').onclick=()=>{C.editCode=true;joinErr='';ci.value=code;C.key='';renderCtrl();try{ci.focus()}catch(e){}};
  $('codeBack').onclick=()=>{const old=room;room=null;joined=false;code='';if(old&&old!==lobby&&old.leave)old.leave().catch(()=>{});SS.set('ow_mode','');mode=null;delete document.body.dataset.mode;delete document.documentElement.dataset.mode;$('app').hidden=true;$('ctrl').hidden=true;$('landing').hidden=false};
  setNeedle();setInterval(renderCtrl,60);renderCtrl();
}

/* ---------- host panels ---------- */
let panelKey='',sideKey='',mgKey='',menuKey='',accent='',pauseKey='',loadKey='',armed='';
function awardBox(){const f=document.createDocumentFragment(),w=el('div','awards');for(const a of O.awards()){const d=el('div');d.append(el('b',null,a[0]),el('span',null,a[1]),el('small',null,a[2]));w.appendChild(d)}f.appendChild(w);
  if(G.result==='win'&&G.newUnl&&G.newUnl.length){const u=el('div','newUnl');u.appendChild(el('h3',null,'Unlocked for every run from now on'));const g=el('div','nuGrid');for(const id of G.newUnl){const o=O.lockInfo(id);if(!o)continue;const c=el('div');c.append(O.ico(id,null,'big'),el('small',null,o.kind),el('b',null,o.name));g.appendChild(c)}u.appendChild(g);f.appendChild(u)}return f}
let menuTab='dung',menuBuilt='',wheelRot=0;
const KINDS=[['ab','Abilities'],['up','Upgrades'],['it','Items'],['re','Relics'],['sk','Ball skins']],DEPTH=['Normal','Grim','Dire','Doomed'];
const btn2=(txt,cls,fn)=>{const b=el('button',cls||'btn');b.appendChild(el('b',null,txt));b.onclick=fn;return b};
/* a button that must be pressed twice, for things that cannot be undone */
const sure=(txt,again,fn,cls)=>{const b=btn2(txt,cls||'btn warn',()=>{if(armed===txt){armed='';fn()}else{armed=txt;b.firstChild.textContent=again;setTimeout(()=>{if(armed===txt){armed='';b.firstChild.textContent=txt}},4000)}});return b};
function fullscreen(){try{const d=document,e=d.documentElement;if(d.fullscreenElement)d.exitFullscreen().catch(()=>{});else if(e.requestFullscreen)e.requestFullscreen().catch(()=>{})}catch(e){}}
function qrInto(cv,text){try{if(!window.qrcode)return false;const q=window.qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount(),k=Math.max(2,Math.round(150/(n+4)));cv.width=cv.height=(n+4)*k;const x=cv.getContext('2d');x.fillStyle='#ece2c8';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#0b090a';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))x.fillRect((c+2)*k,(r+2)*k,k,k);return true}catch(e){return false}}
/* how phones get in: the code for this game, and a square to scan that opens the page with the code filled in */
function joinCard(big){
  const w=el('div','joinCard'+(big?' big':''));if(mode!=='host')return null;
  if(!lobby){w.append(el('p',null,roomTried?'This view cannot connect phones. Open the page from its share link while signed in.':'Connecting…'));return w}
  if(!joined){w.append(el('p',null,joinErr||'Opening the game to phones…'));return w}
  if(code){const cv=document.createElement('canvas');cv.setAttribute('role','img');cv.setAttribute('aria-label','A code to scan that opens this game on a phone');if(qrInto(cv,O.LINK+'#join-'+code))w.appendChild(cv)}
  const t=el('div');t.append(el('small',null,code?'Join code':'Phones'));if(code)t.append(el('b',null,code));t.append(el('span',null,code?'Open this page on a phone, choose Join and enter the code. Up to four can play.':'Players open this page on their phones and choose Join. Up to four can play.'));w.appendChild(t);return w}
/* the main screen: the runs as a track down the left, the chosen run in detail on the right */
function buildDung(body){
  body.className='mBody runs';const left=el('div','runCol'),head=el('div','runHead');head.id='runHead';const list=el('div','runList');list.id='runList';
  O.RUNS.forEach((R,r)=>{const b=el('button','runCard');b.style.setProperty('--mc',O.SETS&&O.SETS[R[0]]?O.SETS[R[0]].fire:'#d6ab52');b.onclick=()=>O.selectRun(r);list.appendChild(b)});
  const jc=el('div');jc.id='joinSlot';left.append(head,list,jc);const info=el('div','runInfo');info.id='dInfo';body.append(left,info)}
function updDung(){
  const st=G.stash,i=G.dung,r=O.runOf(i),R=O.RUNS[r],n=G.players.length,sv=O.savedRun(mode==='solo'),kp=st.keep,mid=!!(kp&&kp.set===r&&kp.next===i&&i!==R[0]),done=O.runDone(r),mt=O.maxTier(i),runsDone=O.RUNS.filter((x,k)=>O.runDone(k)).length;
  /* progress across all the runs */
  const head=$('runHead');head.textContent='';const bar=el('div','runBar');O.RUNS.forEach((x,k)=>bar.appendChild(el('i',O.runDone(k)?'on':O.runOpen(k)?'open':'')));
  head.append(el('h2',null,'The runs'),el('p',null,`${runsDone} of ${O.RUNS.length} complete`),bar);
  /* one card per run */
  [...$('runList').children].forEach((b,k)=>{const RR=O.RUNS[k],open=O.runOpen(k),dn=O.runDone(k),sel=k===r,kk=st.keep&&st.keep.set===k?RR.indexOf(st.keep.next):-1;b.textContent='';
    b.className='runCard '+(dn?'done':open?'open':'lock')+(sel?' sel':'');b.disabled=!open;b.setAttribute('aria-pressed',sel);
    const md=el('div','runMed',ROMAN[k]),mid2=el('div','runMid'),stg=el('div','runStages');mid2.append(el('b',null,'Run '+ROMAN[k]),stg);
    RR.forEach((d,j)=>{const sp=el('span',(dn||(kk>j))?'on':kk===j?'cur':'');sp.append(el('i',null,String(j+1)),O.DUNGEONS[d].name.replace(/^The /,''));stg.appendChild(sp)});
    const tag=el('div','runTag');if(!open)tag.append(el('span','lk','🔒'),el('small',null,`Finish Run ${ROMAN[k-1]}`));else if(kk>0)tag.append(el('span','go','▶'),el('small',null,`Stage ${kk+1} of ${RR.length}`));else if(dn)tag.append(el('span','ok','★'.repeat(Math.max(1,Math.min(3,O.maxTier(RR[0]))))),el('small',null,'Complete'));else tag.append(el('span','go','◆'),el('small',null,'Open'));
    tag.appendChild(el('em',null,O.runGold(k,0)+' gold'));b.append(md,mid2,tag);b.setAttribute('aria-label',`Run ${ROMAN[k]}: ${RR.map(d=>O.DUNGEONS[d].name).join(', ')}. ${!open?'Locked':dn?'Complete':kk>0?'In progress':'Open'}.`)});
  /* the chosen run */
  const info=$('dInfo');info.textContent='';const D0=O.DUNGEONS[R[0]],sg=R.indexOf(i);info.style.setProperty('--dn',O.SETS&&O.SETS[R[0]]?O.SETS[R[0]].fire:'#d6ab52');
  info.append(el('div','dNo',`Run ${ROMAN[r]} · ${R.length} stages`+(done?' · complete':mid?` · stage ${sg+1} of ${R.length}`:'')),el('h2',null,R.map(d=>O.DUNGEONS[d].name.replace(/^The /,'')).join(' · ')));
  const sc=el('div','stageRow');R.forEach((d,j)=>{const D=O.DUNGEONS[d],state=mid?(j<sg?'won':j===sg?'cur':'ahead'):(j===0?'cur':'ahead'),c=el('div','stageCard '+state);
    c.append(el('div','sNo',state==='won'?'✓':String(j+1)),el('b',null,D.name),el('small',null,`${D.rows+1} floors · Boss: ${O.MONSTERS[D.boss].name}`),el('span','sSt',state==='won'?'Cleared this run':state==='cur'?(mid?'Next':'Start here'):'Ahead'));c.appendChild(unlockRow(d));sc.appendChild(c)});info.appendChild(sc);
  const facts=el('ul','dFacts'),F2=(a,b,c)=>{const li=el('li');if(a)li.append(a);li.append(el('b',null,b));if(c)li.append(c);facts.appendChild(li)};
  facts.appendChild(el('li','sk','☠'.repeat(D0.skulls+G.tier)));F2('pays ',String(O.runGold(r,G.tier)),' gold when all '+R.length+' stages are cleared');F2('begins at level ',String(D0.startLv),', fresh stats');F2('','fall',' and the run starts over');info.appendChild(facts);
  if(mt>0&&!mid){const tr=el('div','tiers');tr.setAttribute('role','group');tr.setAttribute('aria-label','Depth');tr.appendChild(el('span',null,'Depth'));DEPTH.forEach((t,k)=>{const b=el('button',null,t);b.disabled=k>mt;b.setAttribute('aria-pressed',k===G.tier);b.title=k>mt?`Complete ${DEPTH[k-1]} to open this`:k?'Tougher monsters, more gold':'';b.onclick=()=>O.setTier(k);tr.appendChild(b)});info.appendChild(tr)}
  info.appendChild(el('p','dParty',n?`${n} in the party: ${G.players.map(p=>CLASSES[p.cls].animal).join(', ')}.`:mode==='solo'?'Choose a fighter to begin.':'No one has joined yet.'));
  if(sv&&O.runOf(sv.dung)===r){const SD=O.DUNGEONS[sv.dung],cb=btn2(`Continue: ${SD.name}, floor ${sv.floor} of ${SD.rows}`,'btn prime',()=>{O.continueRun();menuKey=''});cb.id='goCont';cb.disabled=mode==='solo'&&!n;info.appendChild(cb)}
  const row=el('div','goRow'),go=btn2(mid?`Continue Run ${ROMAN[r]}: stage ${sg+1}, ${O.DUNGEONS[i].name}`:(done?`Play Run ${ROMAN[r]} again`:`Begin Run ${ROMAN[r]}`),sv&&O.runOf(sv.dung)===r?'btn':'btn prime',()=>{if(G.dec)O.pickOpt('host',G.dec.id,0)});go.id='goRun';go.disabled=!n;
  const pb=btn2('Practice course','btn',()=>{if(G.dec)O.pickOpt('host',G.dec.id,1)});pb.id='goPrac';pb.disabled=!n;row.append(go,pb);info.appendChild(row);
  if(mid){const ab=sure('Abandon this run','Press again to abandon',()=>{st.keep=null;O.saveStash();G.dung=R[0];menuKey=''},'btn ghost');info.appendChild(ab)}
  const left=O.cosmLeft(),cost=O.boxCost(st.opened),lb=el('button','lootLink');lb.append(el('span','box'),el('b',null,left?`Loot box · ${cost} gold`:'Every cosmetic found'),el('small',null,left?(st.gold>=cost?'A new look: you can open one now':`${cost-st.gold} more gold needed`):'You own every look'));lb.onclick=()=>{menuTab='stash';menuKey=''};info.appendChild(lb);
  if(!st.prac&&!st.clear.length)info.appendChild(el('p','dTip','New here? The practice course teaches putts, chips, lobs and power with nothing striking back.'));
  const js=$('joinSlot');js.textContent='';const jc=joinCard(false);if(jc)js.appendChild(jc)}
const ROMAN=['I','II','III','IV','V','VI','VII','VIII'];
function runTrail(r,done){const w=el('div','runTrail');O.RUNS[r].forEach((d,k)=>{const s=el('span',k<done?'on':'');s.append(el('b',null,String(k+1)),el('small',null,O.DUNGEONS[d].name.replace(/^The /,'')));w.appendChild(s)});return w}
/* what a dungeon's first clear unlocks, as a row of icons; dimmed until it has been cleared */
function unlockRow(d){const L=O.DUNG_UNLOCKS[d]||[],done=G.stash.clear.includes(d),w=el('div','unlRow'+(done?' done':''));w.appendChild(el('small',null,done?'Unlocked':'First clear unlocks'));const g=el('span','ics');
  for(const id of L){const o=O.lockInfo(id),ic=O.ico(id,null,'sm');if(o)ic.title=o.name+': '+o.desc;g.appendChild(ic)}w.appendChild(g);return w}
const CKINDS=[['sk','Ball skins'],['tr','Trails'],['dy','Outfit dyes'],['ti','Titles']];
function fillStash(body){
  body.className='mBody stashV';body.textContent='';const st=G.stash,left=O.cosmLeft(),cost=O.boxCost(st.opened),lc=el('div','lootCol'),ob=el('button','btn prime');ob.id='boxBtn';
  ob.appendChild(el('b',null,left?`Open for ${cost} gold`:'You own every look'));ob.disabled=!left||st.gold<cost;ob.onclick=()=>{const id=O.openBox();if(id){showBox(id);menuKey=''}};
  lc.append(el('div','box'),el('h3',null,'Loot box'),el('p',null,`Each box holds one new look: a ball skin, a trail, an outfit dye or a title. Nothing in it changes how the game plays. ${left} of ${O.COSM.length} still to find.`),ob);
  const odds=el('div','odds');O.RARITY.forEach((R,k)=>{const n=O.COSM.filter(x=>(O.cosmOf(x)||{}).rar===k),h=n.filter(x=>st.unl.includes(x)).length,sp=el('span');sp.style.color=R.col;sp.textContent=`${R.name} ${h}/${n.length}`;odds.appendChild(sp)});lc.appendChild(odds);
  if(left&&st.gold<cost)lc.append(el('p',null,`${cost-st.gold} more gold needed. Completing a run pays gold.`));
  const li=st.last&&O.lockInfo(st.last);if(li){const w=el('div','won');w.append(el('p',null,'Last opened'),el('b',null,li.name),el('span',null,li.desc));lc.append(w)}
  const bl=el('div','bless'),bb=btn2(st.bless?'A blessing waits at the gate':`Buy a blessing · ${O.BLESS} gold`,'btn',()=>{if(O.buyBlessing())menuKey=''});bb.id='blessBtn';bb.disabled=!!st.bless||st.gold<O.BLESS;
  bl.append(el('h3',null,'Blessing'),el('p',null,'The next run starts with a relic in hand and one more pick of supplies at the gate.'),bb);lc.append(bl);
  const cl=el('div','coll');cl.appendChild(el('h3','collH','Looks from loot boxes'));
  for(const[k,t]of CKINDS){const ids=O.COSM.filter(id=>id.startsWith(k+':')),h=el('h4',null,t),g=el('div','cgrid cosm');h.appendChild(el('small',null,`${ids.filter(id=>st.unl.includes(id)).length} of ${ids.length}`));
    for(const id of ids){const o=O.lockInfo(id),has=st.unl.includes(id),c=el('span',(has?'':'no ')+'r'+(o.rar||0));c.style.setProperty('--rc',O.RARITY[o.rar||0].col);c.append(cosmChip(id),el('b',null,has?o.name:'?'));c.title=has?o.name:'Not found yet ('+O.RARITY[o.rar||0].name.toLowerCase()+')';g.appendChild(c)}cl.append(h,g)}
  cl.appendChild(el('h3','collH','Unlocked by clearing dungeons'));
  for(const[k,t]of KINDS){if(k==='sk')continue;const ids=O.LOCKS.filter(id=>id.startsWith(k+':')),h=el('h4',null,t),g=el('div','cgrid');h.appendChild(el('small',null,`${ids.filter(id=>st.unl.includes(id)).length} of ${ids.length}`));
    for(const id of ids){const o=O.lockInfo(id),has=st.unl.includes(id),d=O.unlockFrom(id),c=el('span',has?'':'no');c.append(O.ico(id,null,'sm'),o?o.name:id);if(!has&&d>=0)c.appendChild(el('em','from','clear '+O.DUNGEONS[d].name.replace(/^The /,'')));if(o)c.title=(has?'':'Locked. ')+o.desc;g.appendChild(c)}cl.append(h,g)}
  cl.firstChild.style.marginTop=0;body.append(lc,cl)}
/* every creature the party has destroyed, by dungeon; the ones not yet met stay in shadow */
function fillBest(body){
  body.className='mBody bestV';body.textContent='';const st=G.stash,ids=Object.keys(MONSTERS).sort(),rows=Math.ceil(ids.length/9),kinds=[];O.DUNGEONS.forEach(d=>{for(const k of[...d.lesser,...d.mini,d.boss])if(!kinds.includes(k))kinds.push(k)});
  const tot=Object.values(st.kills).reduce((a,b)=>a+b,0),head=el('div','bHead');head.append(el('h3',null,'Bestiary'),el('p',null,`${kinds.filter(k=>st.kills[k]).length} of ${kinds.length} kinds destroyed · ${tot} monster${tot===1?'':'s'} in all`));
  const wrap=el('div','bList');
  O.DUNGEONS.forEach((d,i)=>{const open=O.dungOpen(i),sec=el('section'),g=el('div','bGrid');sec.appendChild(el('h4',null,open?d.name:`Dungeon ${i+1} · not yet open`));
    for(const id of[...d.lesser,...d.mini,d.boss]){const m=MONSTERS[id],k=st.kills[id]||0,c=el('div','beast'+(k?'':' unk')+(m.rank==='boss'?' boss':'')),ph=el('i'),ix=ids.indexOf(id),rk=({lesser:'Lesser',mini:'Miniboss',boss:'Boss'})[m.rank];
      ph.style.backgroundSize=`900% ${rows*100}%`;ph.style.backgroundPosition=`${(ix%9)/8*100}% ${Math.floor(ix/9)/Math.max(1,rows-1)*100}%`;const t=el('div');t.append(el('b',null,k?m.name:'Not yet met'),el('small',null,k?`${rk} · destroyed ${k}`:rk));c.append(ph,t);g.appendChild(c)}
    sec.appendChild(g);wrap.appendChild(sec)});
  body.append(head,wrap)}
function fillOpt(body){
  body.className='mBody optV';body.textContent='';const a=el('div','optl'),b=el('div','optl');a.appendChild(el('h3',null,'Options'));
  const sw=(t,on,fn)=>{const x=el('button','sw');x.append(el('span',null,t),el('i'));x.setAttribute('aria-pressed',!!on);x.onclick=()=>{fn();menuKey=''};a.appendChild(x)};
  const sl=(t,k)=>{const w=el('label','sl'),r=document.createElement('input');r.type='range';r.min=0;r.max=100;r.step=5;r.value=Math.round(O.vol(k)*100);r.oninput=()=>O.setVol(k,r.value/100);w.append(el('span',null,t),r);a.appendChild(w)};
  sw('Sound',O.soundOn(),()=>O.setSound(!O.soundOn()));sl('Music','music');sl('Effects','sfx');
  sw('Pixel art picture',O.pixOn(),()=>O.setPix(!O.pixOn()));sw('Glow and soft light',O.fxOn(),()=>O.setFx(!O.fxOn()));sw('Screen shake and flashes',O.shakeOn(),()=>O.setShake(!O.shakeOn()));sw('Fine detail (turn off if the picture stutters)',O.detailOn(),()=>O.setDetail(!O.detailOn()));
  a.appendChild(btn2(document.fullscreenElement?'Leave full screen':'Full screen','btn',()=>{fullscreen();setTimeout(()=>{menuKey=''},400)}));
  b.append(el('h3',null,'Playing together'),el('p',null,mode==='solo'?'You are playing solo: the launcher sits beside the dungeon. To play with friends, go back and choose Host on a big screen.':'Phones join with the code on the Dungeons page. A phone that drops out keeps its fighter and picks it up again when it returns.'),el('p',null,'Gold, unlocks and a run in progress are kept on this device.'),
    el('h3',null,'The fight in brief'),el('p',null,'Every turn starts with a spin. The reels pay along lines, from the first reel, left to right. Each special attack you know has its own line of symbols: match it and you win that ball for this turn. Win two and you get both, one after the other. No line at all and you get your basic ball.'),el('p',null,'Three alike on a line pay extra: bones and blades add damage, flames burn, eyes guide the ball, skulls blunt the monster, crowns mend the party and find gold. Four alike is a jackpot: half as much damage again.'),el('p',null,'Drag back anywhere on your phone like a slingshot: your aim shows on the big screen, and letting go shoots. A ball only hurts the monster if it drops into a hole; the flag on the hole shows the damage.'),el('p',null,'Holes and balls come in three sizes, shown as dots. A ball fits any hole with as many dots or more. Holes too small for your ball are grated over; holes it fits glow. The dish round each hole draws slow balls in.'),el('p',null,'Putt rolls the whole way, Chip hops once over what is in front of you, Lob flies high and stops near where it lands.'),el('p',null,'A red ring marks the hole that holds the monster\u2019s coming strike: sink it and the blow lands at half weight. Blue rings are locks: sink both and the core opens.'),el('p',null,'From the second round on, one open hole wears a gold ring. Sink that one for double.'),el('p',null,'A burning monster takes its burn again at the end of each of the next three rounds.'),
    sure('Reset all progress','Press again to erase everything',()=>{O.resetStash();menuKey=''}));body.append(a,b)}
/* the main menu on the host screen: turn the wheel to choose a dungeon, open loot boxes, read the bestiary, set options */
function hostMenu(){
  const show=G.screen==='lobby'&&!O.inspect,box=$('menu');if(box.hidden===show)box.hidden=!show;if(!show){menuKey='';return}
  const st=G.stash,sv=O.savedRun(mode==='solo'),mk=[menuTab,G.dung,G.tier,st.gold,st.opened,st.clear.length,JSON.stringify(st.runs||[]),st.keep?st.keep.set+':'+st.keep.next:'',st.last,st.bless,st.prac,G.players.map(p=>p.cls).join(','),mode,O.soundOn(),O.fxOn(),O.shakeOn(),O.detailOn(),code,joined,joinErr,!!lobby,roomTried,O.lookOf?O.lookOf():'',sv?sv.dung+':'+sv.floor:'',!!window.qrcode].join('|');if(mk===menuKey)return;menuKey=mk;
  if(menuBuilt!==menuTab||!$('mBody')){menuBuilt=menuTab;box.textContent='';box.classList.toggle('solid',menuTab!=='dung');const top=el('div','mTop'),tabs=el('div','mTabs');
    for(const[k,t]of[['dung','Runs'],['stash','Stash'],['best','Bestiary'],['opt','Options']]){const b=el('button',null,t);b.setAttribute('aria-pressed',k===menuTab);b.onclick=()=>{menuTab=k;menuKey=''};tabs.appendChild(b)}
    const purse=el('div','purse ic coin');purse.id='purse';const body=el('div','mBody');body.id='mBody';top.append(tabs,purse);box.append(top,body);if(menuTab==='dung')buildDung(body)}
  $('purse').textContent=st.gold+' gold';
  if(menuTab==='dung')updDung();else if(menuTab==='stash')fillStash($('mBody'));else if(menuTab==='best')fillBest($('mBody'));else fillOpt($('mBody'))}
/* pausing stops the rules, not the picture */
function setPause(v){O.paused=!!v&&G.screen!=='lobby';pauseKey='';lastS='';if(O.musicDuck)O.musicDuck(O.paused)}
function pausePanel(){
  const inRun=G.screen!=='lobby';if(!inRun&&O.paused)O.paused=false;const k=[O.paused,G.practice,code,O.soundOn(),G.visited.length,!!document.fullscreenElement].join('|');if(k===pauseKey)return;pauseKey=k;
  const ov=$('pauseOv'),card=$('pauseCard');ov.hidden=!O.paused;card.textContent='';if(!O.paused)return;
  card.append(el('h2',null,G.practice?'Practice paused':'Paused'),btn2('Resume','btn prime',()=>setPause(false)));
  const sw=el('button','sw');sw.append(el('span',null,'Sound'),el('i'));sw.setAttribute('aria-pressed',O.soundOn());sw.onclick=()=>{O.setSound(!O.soundOn());pauseKey=''};card.appendChild(sw);
  card.appendChild(btn2(document.fullscreenElement?'Leave full screen':'Full screen','btn',()=>{fullscreen();setTimeout(()=>{pauseKey=''},400)}));
  if(mode==='host'&&code)card.appendChild(el('p','pCode',`Join code ${code}. A phone that dropped out can come back with it.`));
  if(G.practice)card.appendChild(btn2('End practice','btn',()=>{setPause(false);O.endPractice()}));
  else card.appendChild(sure(`Abandon the run · keep ${O.lossGold()} gold`,'Press again to abandon the run',()=>{setPause(false);O.abandonRun()}))}
function hostPanels(){
  hostMenu();pausePanel();{const ac=O.SETS&&O.SETS[G.dung]?O.SETS[G.dung].fire:'';if(ac&&ac!==accent){accent=ac;document.body.style.setProperty('--dn',ac)}}
  const d=G.dec,n=G.players.length,votes=d?Object.keys(d.picks).length:0,picked=G.players.filter(p=>p.picked).length,inRun=G.screen!=='lobby';
  {const bm=$('btnMenu'),sh=inRun&&G.screen!=='result';if(bm.hidden===sh)bm.hidden=!sh;const bp=$('btnParty'),sp=inRun&&mode==='host';if(bp.hidden===sp)bp.hidden=!sp;if(!sp&&$('side').classList.contains('open'))$('side').classList.remove('open')}
  {const li=O.loadInfo?O.loadInfo():null,sh=!!li&&li.need>li.done,k=sh?li.done+'/'+li.need:'';if(k!==loadKey){loadKey=k;const lp=$('loadPlate');lp.hidden=!sh;if(sh){lp.textContent='';const bar=el('div','bar'),f=el('i');f.style.width=(100*li.done/li.need)+'%';bar.appendChild(f);lp.append(el('span',null,'The way opens'),bar)}}}
  for(const q of G.picks||[]){if(q.shown)continue;q.shown=1;const o=O.upInfo(q.u,q.cls);if(!o)continue;const t=el('div','toast'),d=el('div');d.append(el('b',null,o.name.replace(/^Learn /,'')),el('span',null,CLASSES[q.cls].animal+(q.u.startsWith('ab:')?' learns it':q.u.startsWith('it:')?' adds it to the bag':' takes it')));t.append(O.ico(q.u,q.cls),d);$('toasts').appendChild(t);setTimeout(()=>t.remove(),4800)}
  const ib=$('insBtn'),canIns=G.screen==='combat'&&G.phase==='aim'&&G.cur>=0&&!G.cine&&!G.queue.length&&!O.paused;if(ib.hidden===canIns)ib.hidden=!canIns;{const lh=$('lookHint'),on=canIns&&!!G.inspect;if(lh.hidden===on)lh.hidden=!on}if(canIns){const t=G.inspect?'Back to the party':'Look over the course';if(ib.textContent!==t){ib.textContent=t;ib.setAttribute('aria-pressed',!!G.inspect)}}
  const g=G.mg,mk=g?[g.id,g.st,g.st==='brief'?Math.ceil((O.MG_BRIEF||7)-g.t):Math.ceil(g.dur-g.t),JSON.stringify(g.d.pr),g.d.who,JSON.stringify(g.d.rdy||{}),g.go?1:0].join('|'):'';
  if(mk!==mgKey){mgKey=mk;const box=$('mgBox'),D=g&&O.MG[g.k],show=!!g&&G.screen==='map'&&(g.st==='brief'||(D.kind==='event'&&g.st==='play'));box.hidden=!show;box.textContent='';box.classList.toggle('mini',!!g&&g.st!=='brief');
    if(show){const d=g.d,ps=G.players.filter(p=>!p.away);box.append(el('div','mgTag '+D.kind,D.kind==='trap'?'Trap':'Event'),el('h3',null,d.name||D.name));
      if(g.st==='brief'){box.append(el('p',null,D.brief));if(D.ctl)box.append(el('p','mgGoal',D.ctl));
        if(!g.go){const rd=g.d.rdy||{},lb=el('div','mgReady');ps.forEach(p=>{const s2=el('span',rd[p.slot]?'on':null,CLASSES[p.cls].animal+(rd[p.slot]?' ✓ ready':' · reading'));s2.style.borderColor=LANES[p.slot];lb.appendChild(s2)});box.append(el('p','mgGoal','Read the rules, then press READY on your phone.'),lb)}}
      else{const left=Math.max(0,Math.ceil(g.dur-g.t));box.append(el('p',null,({lock:'Stop the needle in the gold band.',shrine:'Shield your candles when they flicker blue.',forge:'Strike on the beat!',tome:'Find the pairs together.',gamble:g.t<d.bt?'Place your bets!':g.t<d.se?'Keep your eye on the ball…':'Pick a cup!'})[g.k]||''));
        if(!['tome','lock'].includes(g.k))box.append(el('div','sig',left+''));const lb=el('ol','mgBoard');
        ps.forEach(p=>{const k=p.slot,li=el('li');li.style.borderLeftColor=LANES[k];li.append(el('b',null,CLASSES[p.cls].animal));if(g.k==='tome'&&d.who===k)li.appendChild(el('span','turn','← turn'));li.appendChild(el('span','sc',String(d.pr[k]||'')));lb.appendChild(li)});box.append(lb)}}}
  const key=[G.screen,G.result,d&&d.id,d&&d.k,d&&d.t,votes,picked,n,mode,O.inspect,!!g,G.finale].join('|');
  if(key!==panelKey){panelKey=key;const ov=$('overlay'),card=$('card'),bar=$('decBar');card.textContent='';bar.textContent='';bar.classList.remove('slim');ov.hidden=true;bar.hidden=true;
    const btn=(txt,i)=>{const b=el('button','btn prime');b.appendChild(el('b',null,txt));b.onclick=()=>{if(G.dec)O.pickOpt('host',G.dec.id,i)};return b};
    if(G.screen==='lobby'&&!O.inspect){}
    else if(G.screen==='result'){ov.hidden=false;ov.className='overlay';
      if(G.result==='win'&&G.finale){const st=G.stash,tot=Object.values(st.kills).reduce((a,b)=>a+b,0);ov.className='overlay finale';
        card.append(el('small',null,'The twentieth dungeon'),el('h2',null,'The Hollow Throne stands empty'),el('p',null,'The last wheel has stopped turning. What sat the throne is balls and dust, and the dark under the world is only dark again.'),
          el('p',null,`${st.clear.length} dungeons cleared, ${tot} monsters destroyed, ${st.opened} loot box${st.opened===1?'':'es'} opened. The party earns ${G.gain} gold.`),awardBox(),
          el('p','after','Every dungeon can now be entered again at a deeper setting: Grim, Dire and Doomed, each harder and richer than the last.'),btn('Return to the menu',0))}
      else if(G.result==='win'){const D=O.DUNGEONS[G.dung],r=O.runOf(G.dung),RR=O.RUNS[r],sg=RR.indexOf(G.dung)+1,mt=O.maxTier(G.dung);ov.className='overlay low';
        if(G.runEnd){card.append(el('small',null,`Run ${ROMAN[r]} · complete`),el('h2',null,`Run ${ROMAN[r]} is complete!`),el('p',null,`${O.MONSTERS[D.boss].name} is destroyed. The party earns ${G.gain} gold for the run.`+(G.newDung?` Run ${ROMAN[r+1]} is now open.`:'')+(G.tier<3&&mt===G.tier+1?` Run ${ROMAN[r]} can now be played at ${DEPTH[mt]} depth.`:'')),runTrail(r,RR.length),awardBox(),btn('Return to the menu',0))}
        else{const nx=O.DUNGEONS[G.dung+1];card.append(el('small',null,`Run ${ROMAN[r]} · stage ${sg} of ${RR.length}`),el('h2',null,D.name.replace(/^The /,'')+' is cleared'),el('p',null,`${O.MONSTERS[D.boss].name} is destroyed. Everything the party won carries on into ${nx.name}. The run's gold is paid when all ${RR.length} stages are cleared.`),runTrail(r,sg),awardBox(),btn(`On to stage ${sg+1}: ${nx.name}`,0));const b2=btn('Rest at the menu',1);b2.className='btn';card.appendChild(b2)}}
      else{const left=G.mons.filter(m=>!m.dead),r=O.runOf(G.dung);card.append(el('small',null,`Run ${ROMAN[r]}`),el('h2',null,'The party has fallen'),el('p',null,(left.length?left.map(m=>`${m.name} had ${Math.ceil(m.hp)} of ${m.max} health left.`).join(' ')+' ':'')+`The run begins again from stage 1, with fresh stats.`),awardBox(),btn(`Begin Run ${ROMAN[r]} again`,0));const a=btn('Return to the menu',1);a.className='btn';card.appendChild(a)}}
    else if(d&&G.screen==='map'&&!g){bar.hidden=false;
      if(d.k==='upgrade'){bar.appendChild(el('h3',null,d.t==='tome'?'Learning from the library':d.t==='gate'?'Supplies at the gate':'Choosing drops'));
        if(mode==='host'){const row=el('div','dropRow');for(const p of G.players){if(!p.opts)continue;const c=el('div','dropCol'+(p.picked?' done':'')),hd=el('div','dh');hd.append(headCanvas(p.cls,40,LANES[p.slot]),el('b',null,CLASSES[p.cls].animal),el('small',null,p.away?'away':p.picked?'chosen':'choosing'));c.appendChild(hd);
            p.opts.forEach((u,i)=>{const o=O.upInfo(u,p.cls);if(!o)return;const it=rewardCard(u,p.cls,{div:1,mini:1});if(p.picked)it.classList.add(p.took===i?'took':'not');c.appendChild(it)});row.appendChild(c)}bar.appendChild(row)}      // the big screen lays out what each fighter has been offered, and marks what they take
        bar.appendChild(el('p',null,mode==='solo'?'Choose below.':`${picked} of ${n} chosen. Pick on your phones.`))}
      else if(d.k==='path'){bar.classList.add('slim');bar.appendChild(el('p',null,mode==='solo'?'Press a floor on the map, or choose below.':votes?`${votes} of ${n} voted. The host can also press a floor on the map.`:'Vote on your phones, or press a floor on the map.'))}
      else{bar.appendChild(el('h3',null,'Choose one relic for the party'));
        const row=el('div','optRow rwRow');d.opts.forEach((o,i)=>{row.appendChild(rewardCard('re:'+o,null,{onclick:()=>O.pickOpt('host',d.id,i)}))});
        if(mode==='host')bar.appendChild(row);bar.appendChild(el('p',null,mode==='solo'?'Choose below.':votes?`${votes} of ${n} voted.`:'Vote on your phones, or tap a choice here.'))}}
  }
  const sk=JSON.stringify([G.players.map(p=>[p.id,p.cls,p.title||'',p.hp,p.mhp,p.lv,p.fired,p.away,p.ups.length,p.owned.length,p.rp||0,p.ab||0,p.tgt,p.ch?Math.round((p.pw||0)*20):-1]),G.cur,G.active,G.items,G.relics,G.log[0],G.screen,G.phase,O.inspect,code,G.dec&&G.dec.k]);
  if(sk!==sideKey){sideKey=sk;const ul=$('party');ul.textContent='';const aim=G.screen==='combat'&&G.phase==='aim';
    const state=p=>p.hp<=0?'down':p.away?'away':aim?(G.players[G.active]===p?'attacking':p.fired?'done':G.players.length>1&&G.shooter&&G.shooter!==p.id?'waiting':p.ch?`aiming ${Math.round((p.pw||0)*100)}%`:p.tgt>=0&&!CLASSES[p.cls].ab[p.ab||0].instant?O.RAMPS[p.rp||0].short.toLowerCase()+' ready':'choosing'):'';
    for(const p of G.players){const cl=CLASSES[p.cls],li=el('li');li.tabIndex=0;li.setAttribute('role','button');li.setAttribute('aria-pressed',O.inspect===p.id);
      const dd=el('div'),nm=el('div','nm');nm.append(el('span',null,`${cl.animal} ${cl.name}`),el('small',null,state(p)||'Lv '+p.lv));
      const bar=el('div','bar'),i=el('i');i.style.width=(100*p.hp/p.mhp)+'%';bar.appendChild(i);dd.append(nm);if(O.titleOf(p))dd.appendChild(el('em','ttl',O.titleOf(p)));dd.appendChild(bar);li.append(headCanvas(p.cls,44,LANES[p.slot]),dd);
      const tog=()=>{O.inspect=O.inspect===p.id?null:p.id;sideKey='';panelKey=''};li.onclick=tog;li.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){tog();e.preventDefault()}};ul.appendChild(li)}
    const ps=$('partyStrip'),showPs=G.screen==='combat'||(G.screen==='map'&&mode==='host'&&!(G.dec&&G.dec.k==='upgrade'));ps.hidden=!showPs;ps.classList.toggle('top',G.screen==='map');ps.textContent='';
    if(showPs)for(const p of G.players){const cl=CLASSES[p.cls],stt=state(p),ready=aim&&!p.fired&&p.hp>0&&!p.away,c=el('div','pc'+(p.hp<=0?' down':p.away?' away':stt==='attacking'?' act':ready?' ready':'')),d=el('div'),pn=el('div','pn');c.style.borderLeft='3px solid '+LANES[p.slot];
      pn.append(el('span',null,cl.animal),el('em',null,stt&&stt!=='done'?stt:`${p.hp}`));const bar=el('div','bar'),i=el('i');i.style.width=(100*p.hp/p.mhp)+'%';bar.appendChild(i);d.append(pn,bar);c.append(headCanvas(p.cls,36),d);ps.appendChild(c)}
    const bl=$('bagL');bl.textContent='';G.items.forEach(r=>{const li=el('li');li.append(el('b',null,ITEMS[r].name),el('span',null,ITEMS[r].desc));bl.appendChild(li)});
    const rl=$('relics');rl.textContent='';G.relics.forEach(r=>{const li=el('li');li.append(el('b',null,RELICS[r].name),el('span',null,RELICS[r].desc));rl.appendChild(li)});
    const ol=$('log');ol.textContent='';for(const t of G.log.slice(0,7))ol.appendChild(el('li',null,t));
    $('sideCode').textContent=mode==='host'&&code?'Join code '+code:'';
    const so=$('sheetOv'),ip=O.inspect&&G.players.find(p=>p.id===O.inspect);if(O.inspect&&!ip)O.inspect=null;so.hidden=!ip;
    if(ip){sheetInto(so,ip.cls,{sl:ip.slot,hp:ip.hp,mhp:ip.mhp,lv:ip.lv,up:ip.ups,ow:ip.owned,bag:G.items},G.relics);const x=el('button','close','Close');x.onclick=()=>{O.inspect=null;sideKey='';panelKey=''};so.appendChild(x)}}
}
let lastT=0;
function frame(t){
  const dt=Math.min(.05,(t-lastT)/1000||0);lastT=t;
  syncRemote(t);if(!O.paused)for(let i=0;i<(O.speed||1);i++)O.tick(dt);O.renderStage(dt);pushHost(t);hostPanels();
  requestAnimationFrame(frame);
}
document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('button'))O.sfx('click')},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&hosting()&&G.screen!=='lobby'&&G.screen!=='result'){setPause(!O.paused);e.preventDefault()}});
O.go=function(m){
  O.audioInit();keepAwake();
  mode=m;SS.set('ow_mode',m);document.body.dataset.mode=m;document.documentElement.dataset.mode=m;$('landing').hidden=true;$('app').hidden=false;
  if(m==='host')enterRoom(SS.get('ow_code')||newCode());
  if(m==='join'){const hc=hashCode();$('codeIn').value=hc||cleanCode(SS.get('ow_jcode'))||cleanCode(LS.get('ow_code'));if(hc)enterRoom(hc)}
  if(m!=='join'){$('host').hidden=false;$('side').hidden=false;
    try{O.initStage($('cv'));requestAnimationFrame(frame)}catch(e){$('hudMsg').hidden=false;$('hudMsg').textContent='This device could not start 3D graphics, so it cannot host. It can still join as a controller.';console.error(e)}}
  if(m!=='host'){$('ctrl').hidden=false;initCtrl()}
};
O.paused=false;O.setPause=setPause;
$('insBtn').onclick=()=>O.toggleInspect('host');$('btnMenu').onclick=()=>setPause(true);$('btnParty').onclick=()=>$('side').classList.toggle('open');$('sideClose').onclick=()=>$('side').classList.remove('open');
$('goSolo').onclick=()=>O.go('solo');$('goHost').onclick=()=>O.go('host');$('goJoin').onclick=()=>O.go('join');
{const hc=hashCode();if(hc){$('goHost').classList.remove('first');$('goJoin').classList.add('first');$('goJoin').querySelector('b').textContent='Join game '+hc}}
const use=window.claude&&window.claude.use?window.claude.use('room'):(O.netUse?O.netUse():Promise.resolve(null));
use.then(r=>{lobby=r||null;roomTried=true;menuKey='';
  if(!lobby){const n=$('netNote');n.hidden=false;n.textContent=O.offClaude?'This page could not load its connection, so Host and Join will not work. Check the internet connection. Solo works.':'This view cannot connect phones right now, so Host and Join will not find each other here. Solo works.';$('goHost').classList.remove('first');$('goJoin').classList.remove('first');$('goSolo').classList.add('first')}
  else if(mode==='host'&&!joined)enterRoom(SS.get('ow_code')||newCode());
  else if(mode==='join'&&!joined&&hashCode())enterRoom(hashCode());
  else if(!mode&&SS.get('ow_mode')==='join'){const c=hashCode()||cleanCode(SS.get('ow_jcode'))||cleanCode(LS.get('ow_code'));if(c.length===4){O.go('join');if(!joined&&!room)enterRoom(c)}}}).catch(()=>{roomTried=true});      // a phone that reloaded mid-game walks straight back in
})();
