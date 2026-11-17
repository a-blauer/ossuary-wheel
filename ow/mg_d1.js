/* Trap mini games for dungeons 1-5: the Ossuary, Rotwood, the Drowned Vaults, Emberforge, the Webbed Deep.
   Each game: rules (setup/input/tick/pass/prog), a scene for the big screen (tv), its readouts over it (hud), and the phone pad (pad). */
(()=>{
const O=window.OW,G=O.G,H=O.MGH,{clamp,num,here,alive}=H;
const slotX=(i,n,sp)=>(i-(n-1)/2)*(sp||.8);
const idx=p=>here().indexOf(p);
/* ===== 1 · The Ossuary · Dart Gallery: dodge the glowing half, duck the high volleys ===== */
O.addMg({id:'dart',dun:0,name:'Dart Gallery',hearts:true,ctl:'Phone: LEFT · DUCK · RIGHT',
 brief:'One half of the hall glows red, then darts sweep it: be on the other side. When both walls glow gold up high, the volley flies at head height: DUCK. Three hits and you are out. It gets faster.',
 setup(g){const r=H.rng(g.seed);g.d.w=[];let t=1.2,prev='L';const N=26;for(let i=0;i<N;i++){const f=i/(N-1),warn=+(1.1-.56*f).toFixed(2);
    let ty=i>=4&&r()<.3?'H':(i>6&&r()<.5+.3*f?(prev==='L'?'R':'L'):(r()<.5?'L':'R'));if(ty!=='H')prev=ty;g.d.w.push([ty,+t.toFixed(2),+(t+warn).toFixed(2)]);t+=warn+.9-.5*f}
   g.dur=t+.8;g.d.pos={};g.d.duck={};for(const p of here())g.d.pos[p.slot]=p.slot%2?'R':'L';g.n={};g.res=0},
 input(g,p,v,at){const[n,c]=String(v).split(':');if(num(+n)<=(g.n[p.slot]||0))return;g.n[p.slot]=num(+n);if(c==='L'||c==='R')g.d.pos[p.slot]=c;else if(c==='D')g.d.duck[p.slot]=+at.toFixed(2)},
 tick(g){while(g.res<g.d.w.length&&g.t>=g.d.w[g.res][2]){const[ty,,hit]=g.d.w[g.res];
     for(const p of alive(g)){const dk=g.d.duck[p.slot],ducking=dk!=null&&hit-dk>=-.05&&hit-dk<=.95;if(ty==='H'?!ducking:g.d.pos[p.slot]===ty)H.hit(g,p)}g.res++;H.ev('kick')}
   if(g.res>=g.d.w.length)g.end=1},
 prog:g=>`${g.res}/${g.d.w.length} volleys`,
 key:(g,d,sl)=>d.pos[sl]+(d.duck[sl]||''),
 tv(K,g){const G2=K.room({w:6,d:6,sides:true}),slits={L:[],R:[],H:[]};
   for(const s0 of[0,1])for(let k=0;k<6;k++){const m=K.glow(.06,.12,.4,'#ff3a1a');m.position.set(s0?2.9:-2.9,.45+(k%2)*.25,-2+k*.8);m.visible=false;G2.add(m);slits[s0?'R':'L'].push(m);
     const h=K.glow(.06,.12,.4,'#ffb21a');h.position.set(s0?2.9:-2.9,1.35,-2+k*.8);h.visible=false;G2.add(h);slits.H.push(h)}
   const half={L:K.tile(2.8,5,'#ff3a1a'),R:K.tile(2.8,5,'#ff3a1a')};half.L.position.set(-1.45,.02,0);half.R.position.set(1.45,.02,0);G2.add(half.L,half.R);const darts=[];
   return{g:G2,cam:[[0,3.3,6.6],[0,.7,0]],spot:(p,i,n)=>{const d=g.d;const side=d.pos[p.slot]==='R'?1:-1,dk=d.duck[p.slot],duck=g.st==='play'&&dk!=null&&g.t-dk>=0&&g.t-dk<.95;
     const mates=here().filter(q=>d.pos[q.slot]===d.pos[p.slot]),j=mates.indexOf(p);return[side*1.4,duck?-.32:0,-.6+j*.55,0]},
   update(m,dt){const t=m.st==='play'?m.t:-1;let wL=0,wR=0,wH=0;m.d.w.forEach((w,i)=>{if(t>=w[1]&&t<w[2]){if(w[0]==='L')wL=1;else if(w[0]==='R')wR=1;else wH=1}
       if(t>=w[2]&&!darts[i]){darts[i]=[];if(w[0]==='H'){for(const s0 of[-1,1])for(let k=0;k<4;k++){const d=K.glow(.5,.05,.05,'#e8e0c8');d.position.set(s0*2.8,1.3,-1.6+k*1.05);d.userData={dir:-s0,stop:-s0*3};G2.add(d);darts[i].push(d)}}
         else{const s0=w[0]==='L'?-1:1;for(let k=0;k<6;k++){const d=K.glow(.5,.05,.05,'#e8e0c8');d.position.set(s0*2.8,.35+(k%3)*.3,-2+k*.75);d.userData={dir:-s0,stop:-s0*.05};G2.add(d);darts[i].push(d)}}}});
     const fl=Math.sin(K.now()*30)>-.3;slits.L.forEach(q=>q.visible=!!wL&&fl);slits.R.forEach(q=>q.visible=!!wR&&fl);slits.H.forEach(q=>q.visible=!!wH&&fl);
     half.L.material.opacity=wL?.28+.15*Math.sin(K.now()*20):0;half.R.material.opacity=wR?.28+.15*Math.sin(K.now()*20):0;
     for(const a of darts)if(a)for(const d of a){if(!d.visible)continue;d.position.x+=d.userData.dir*16*dt;if((d.userData.dir>0&&d.position.x>d.userData.stop)||(d.userData.dir<0&&d.position.x<d.userData.stop))d.visible=false}}}},
 hud(x,w,h,g,HK){const nx=g.d.w[g.res];if(nx&&g.t>=nx[1])HK.txt(x,nx[0]==='H'?'DUCK!':nx[0]==='L'?'GO RIGHT!':'GO LEFT!',w/2,h*.16,Math.max(26,h*.07),nx[0]==='H'?'#ffd27a':'#ff7a6a')},
 pad(K){if(K.first){const mv=c=>()=>{K.buzz(c==='D'?25:12);K.s.n=(K.s.n||0)+1;K.send(K.s.n+':'+c)};K.x.append(K.row(3,K.btn('◀ Left','go side L',mv('L')),K.btn('Duck','go duck',mv('D')),K.btn('Right ▶','go side R',mv('R'))))}
   K.x.querySelectorAll('.side').forEach(b=>b.classList.toggle('on',b.classList.contains(K.d.pos[K.sl]||'L')))},
 hint:()=>'Watch the big screen: stand on the side that is NOT glowing; duck the high gold volleys.'});

/* ===== 2 · The Ossuary · The Bone Choir: the skulls sing a sequence; sing it back, one longer each round ===== */
const CHOIR=['skull','bone','candle','coffin'];
O.addMg({id:'choir',dun:0,name:'The Bone Choir',ctl:'Phone: four bone symbols',
 brief:'Four skulls in their niches sing a sequence, each with its own symbol and note. Sing it back on your phone in the same order. Each round adds one and sings faster. One wrong note and the choir turns on you. Clear five rounds.',
 setup(g){const r=H.rng(g.seed);g.d.seq=[];for(let i=0;i<10;i++)g.d.seq.push(Math.floor(r()*4));g.dur=200;g.d.done={};g.d.cl={};this.round(g,1)},
 round(g,rd){const d=g.d;d.rd=rd;d.len=1+rd;d.on=+(.6-.035*(rd-1)).toFixed(2);d.gp=+(.24-.012*rd).toFixed(2);d.ph='show';d.pt=+g.t.toFixed(2);d.done={};d.lim=+(1.8+.65*d.len).toFixed(1)},
 input(g,p,v){const d=g.d;if(d.ph!=='input'||d.out[p.slot]!=null||d.done[p.slot])return;const[rd,ds]=String(v).split(':');if(+rd!==d.rd)return;const s=String(ds||'');
   for(let i=0;i<s.length&&i<d.len;i++)if(+s[i]!==d.seq[i]){H.knock(g,p);H.ev('mgBad');return}if(s.length>=d.len){d.done[p.slot]=1;d.cl[p.slot]=d.rd;H.ev('boon')}},
 tick(g){const d=g.d,el=g.t-d.pt;
   if(d.ph==='show'){const step=d.on+d.gp,i=Math.floor((el-.4)/step);if(i>=0&&i<d.len&&g.sang!==d.rd*100+i){g.sang=d.rd*100+i;H.ev('mgSing',{i:d.seq[i]})}if(el>.4+d.len*step){d.ph='input';d.pt=+g.t.toFixed(2)}}
   else if(d.ph==='input'&&(alive(g).every(p=>d.done[p.slot])||el>d.lim)){for(const p of alive(g))if(!d.done[p.slot])H.knock(g,p);if(!alive(g).length||d.rd>=5){g.end=1;return}d.ph='gap';d.pt=+g.t.toFixed(2)}
   else if(d.ph==='gap'&&el>1)this.round(g,d.rd+1)},
 pass:(g,p)=>(g.d.cl[p.slot]||0)>=5,prog:(g,p)=>`round ${g.d.cl[p.slot]||0}/5`,
 key:(g,d,sl)=>d.rd+d.ph+(d.done[sl]?1:0)+JSON.stringify(O.MG.choir._s||''),
 tv(K,g){const G2=K.room({w:6,d:5}),sk=[];for(let i=0;i<4;i++){const x=-1.95+i*1.3,niche=K.vb(P2=>{for(let a=-5;a<5;a++)for(let b=0;b<11;b++)P2.set(a,b,0,(a===-5||a===4||b===10)?'l':'d')},.1,K.pal());niche.position.set(x,.9,-2.35);G2.add(niche);
     const s=K.sym(CHOIR[i],.75);s.position.set(x,1.45,-2.2);G2.add(s);const L=K.light(G2,x,1.5,-1.8,O.GLYPHS[CHOIR[i]][0],0);sk.push([s,L])}
   return{g:G2,cam:[[0,2,5.4],[0,1.25,-1.6]],spot:(p,i,n)=>[slotX(i,n,.75),0,(g.d.out[p.slot]!=null?1.6:.6),Math.PI],
   update(m){const d=m.d,el=m.t-d.pt,step=d.on+d.gp,i=Math.floor((el-.4)/step),on=m.st==='play'&&d.ph==='show'&&i>=0&&i<d.len&&(el-.4)-i*step<d.on,cur=on?d.seq[i]:-1;
     sk.forEach(([s,L],k)=>{const lit=cur===k;s.scale.setScalar(lit?1.05:.75);s.material.opacity=lit?1:d.ph==='input'?.7:.45;L.intensity=lit?3:0})}}},
 hud(x,w,h,g,HK){const d=g.d;HK.txt(x,d.ph==='show'?`Round ${d.rd}: listen…`:d.ph==='input'?`Round ${d.rd}: sing it back!`:'…',w/2,h*.12,Math.max(22,h*.05));
   if(d.ph==='input')HK.bar(x,w*.3,h*.17,w*.4,8,1-(g.t-d.pt)/d.lim,'#d5a640')},
 pad(K){const d=K.d,s=K.s;if(s.rd!==d.rd){s.rd=d.rd;s.v=''}K.x.textContent='';const dots=K.el('div','mgDots');for(let i=0;i<d.len;i++){const c=s.v[i];dots.appendChild(c!=null?K.glyph(CHOIR[+c],22):K.el('span',null,'·'))}K.x.appendChild(dots);
   if(d.ph==='show')K.x.appendChild(K.el('div','mgBig','Listen…'));
   else if(d.ph==='input'&&!d.done[K.sl]&&s.v.length<d.len){const gr=K.el('div','mgGrid');CHOIR.forEach((nm,i)=>{const b=K.btn('','rune',()=>{K.buzz(12);O.sfx('mgNote',{i});s.v+=i;K.send(d.rd+':'+s.v)});b.appendChild(K.glyph(nm,64));gr.appendChild(b)});K.x.appendChild(gr)}
   else if(d.done[K.sl])K.x.appendChild(K.el('div','mgBig ok','Sung!'))},
 hint:(g,d)=>d.ph==='show'?'Watch and listen to the skulls.':d.ph==='input'?'Press the symbols in the order they sang.':'Next round…'});

/* ===== 3 · Rotwood · Root Snare: roots stir under the ground, then burst; stand on calm ground ===== */
O.addMg({id:'snare',dun:1,name:'Root Snare',hearts:true,ctl:'Phone: a 3×3 patch of ground',
 brief:'Roots stir under a 3×3 patch of forest floor, then burst through. Tap a calm tile on your phone to step there before they break. Later waves stir more ground, with less warning, and some roots go still just before they strike.',
 setup(g){const r=H.rng(g.seed),N=18;g.d.wv=[];let t=1.5;for(let i=0;i<N;i++){const f=i/(N-1),k=Math.min(7,2+Math.floor(f*6+r()*.8)),warn=+(1.2-.68*f).toFixed(2),tiles=[];const all=[0,1,2,3,4,5,6,7,8];
     while(tiles.length<k){const j=Math.floor(r()*all.length);tiles.push(all.splice(j,1)[0])}g.d.wv.push([+t.toFixed(2),+(t+warn).toFixed(2),tiles,i>9&&r()<.4?1:0]);t+=warn+1-.45*f}
   g.dur=t+.6;g.d.at={};here().forEach((p,i)=>g.d.at[p.slot]=[4,0,8,2][i%4]);g.res=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<9)g.d.at[p.slot]=k},
 tick(g){while(g.res<g.d.wv.length&&g.t>=g.d.wv[g.res][1]){const w=g.d.wv[g.res];for(const p of alive(g))if(w[2].includes(g.d.at[p.slot]))H.hit(g,p);g.res++;H.ev('mgBurst')}if(g.res>=g.d.wv.length)g.end=1},
 prog:g=>`wave ${Math.min(g.res+1,g.d.wv.length)}/${g.d.wv.length}`,key:(g,d,sl)=>d.at[sl],
 tv(K,g){const G2=K.room({w:7,d:6}),T=K.T,tiles=[],roots=[];for(let i=0;i<9;i++){const x=(i%3-1)*1.15,z=(Math.floor(i/3)-1)*1.05;const t=K.tile(1.05,.95,'#b6ff6a');t.position.set(x,.03,z);G2.add(t);
     const rim=K.vb(P2=>{for(let a=-5;a<5;a++)for(let b=-5;b<5;b++)if(Math.abs(a+.5)>4||Math.abs(b+.5)>4)P2.set(a,0,b,'d')},.1,K.pal());rim.position.set(x,.0,z);G2.add(rim);
     const rt=K.vb(P2=>{for(const[a,b]of[[-2,-1],[1,2],[-1,2],[2,-2],[0,0]])for(let y=0;y<6+((a*7+b)&3);y++)P2.set(a,y,b,y>5?'ad':'w')},.08,K.pal());rt.position.set(x,-.6,z);G2.add(rt);tiles.push([t,x,z]);roots.push(rt)}
   return{g:G2,cam:[[0,4.4,4.6],[0,0,-.1]],spot:(p,i,n)=>{const k=g.d.at[p.slot]??4,[,x,z]=tiles[k],mates=here().filter(q=>g.d.at[q.slot]===k),j=mates.indexOf(p);return[x+(j%2?.22:-.22)*(mates.length>1?1:0),0,z+(j>1?.25:-.05),0]},
   update(m,dt){const t=m.st==='play'?m.t:-1,w=m.d.wv[m.res],last=m.d.wv[m.res-1];tiles.forEach(([tl],i)=>{const warn=w&&t>=w[0]&&t<w[1]&&w[2].includes(i)&&!(w[3]&&t>w[1]-.35);tl.material.opacity=warn?.25+.2*Math.sin(K.now()*24):0;
       const up=last&&t-last[1]<.6&&t>=last[1]&&last[2].includes(i);roots[i].position.y=K.lerp(roots[i].position.y,up?0:-.6,.35);if(warn){tl.position.y=.03+Math.sin(K.now()*40+i)*.015}})}}},
 hud(x,w,h,g,HK){const wv=g.d.wv[g.res];if(wv&&g.t>=wv[0])HK.txt(x,'The roots stir…',w/2,h*.1,Math.max(20,h*.045),'#b6ff6a')},
 pad(K){if(K.first){const gr=K.el('div','mgGrid g3');for(let i=0;i<9;i++)gr.appendChild(K.btn('','tile',()=>{K.buzz(10);K.s.at=i;K.send(String(i))}));K.x.appendChild(gr)}
   const at=K.d.at[K.sl];K.x.querySelectorAll('.tile').forEach((b,i)=>b.classList.toggle('on',i===at))},
 hint:()=>'Watch the ground on the big screen. Tap a calm tile to stand there.'});

/* ===== 4 · Rotwood · Deadfall Run: flee down the path; lanes for trunks, jump the roots, duck the branches ===== */
O.addMg({id:'deadfall',dun:1,name:'Deadfall Run',hearts:true,ctl:'Phone: three lanes · JUMP · DUCK',
 brief:'Run! The rotten forest is falling. Change lanes past fallen trunks, JUMP the roots that cross the whole path, and DUCK the branches that hang across it. The torchlight only reaches a little way ahead, and it speeds up.',
 setup(g){const r=H.rng(g.seed);g.d.hz=[];let t=2.2;const N=30;for(let i=0;i<N;i++){const f=i/(N-1),q=r();
     if(i>3&&q<.22)g.d.hz.push([+t.toFixed(2),'J']);else if(i>6&&q<.42)g.d.hz.push([+t.toFixed(2),'D']);else{const a=Math.floor(r()*3),two=i>2&&r()<.45+.35*f;g.d.hz.push([+t.toFixed(2),two?[a,(a+1+Math.floor(r()*2))%3]:[a]])}t+=1.5-1.02*f}
   g.dur=t+1;g.d.ln={};g.d.jt={};g.d.dk={};g.n={};for(const p of here())g.d.ln[p.slot]=1;g.res=0},
 input(g,p,v,at){const[n,c]=String(v).split(':');if(num(+n)<=(g.n[p.slot]||0))return;g.n[p.slot]=num(+n);if(c==='J')g.d.jt[p.slot]=+at.toFixed(2);else if(c==='D')g.d.dk[p.slot]=+at.toFixed(2);else if(+c>=0&&+c<=2)g.d.ln[p.slot]=+c},
 tick(g){while(g.res<g.d.hz.length&&g.t>=g.d.hz[g.res][0]){const[ht,ty]=g.d.hz[g.res];
     for(const p of alive(g)){const jt=g.d.jt[p.slot],dk=g.d.dk[p.slot],air=jt!=null&&ht-jt>=-.05&&ht-jt<=.5,low=dk!=null&&ht-dk>=-.05&&ht-dk<=.6;
       const hit=ty==='J'?!air:ty==='D'?!low:(!air&&ty.includes(g.d.ln[p.slot]));if(hit)H.hit(g,p)}g.res++}
   if(g.res>=g.d.hz.length)g.end=1},
 prog:g=>`${g.res}/${g.d.hz.length} cleared`,key:(g,d,sl)=>d.ln[sl],
 tv(K,g){const G2=new K.T.Group(),P=K.pal();K.addv(G2,K.vb(P2=>{for(let x=-9;x<9;x++)for(let z=-34;z<12;z++)P2.set(x,0,z,Math.abs(x)===3||Math.abs(x)===4?'d':K.V.hash(x,z,2)<.3?'d':'s')},.2,P)).position.y=-.2;
   for(const s0 of[-1,1])for(let k=0;k<9;k++){const tr=K.vb(P2=>{for(let y=0;y<26;y++)P2.box(-1,1,y,y,-1,1,y>18?'ad':'w')},.12,P);tr.position.set(s0*(2.3+((k*7)%3)*.35),-.2,-6.5+k*1.5);G2.add(tr)}
   const hz=g.d.hz.map(q=>{const pg=new K.T.Group();if(q[1]==='J'){const b=K.vb(P2=>{for(let x=-17;x<17;x++)for(let y=0;y<2;y++)P2.set(x,y,0,(x+y)%3?'w':'wd')},.1,P);pg.add(b);const rim=K.glow(3.5,.015,.4,'#b6ff6a');rim.position.y=.01;pg.add(rim)}
     else if(q[1]==='D'){const b=K.vb(P2=>{for(let x=-18;x<18;x++)for(let y=0;y<2;y++)P2.set(x,y,0,(x+y)%3?'w':'ad')},.1,P);b.position.y=1.05;pg.add(b);const rim=K.glow(3.5,.015,.4,'#ffd27a');rim.position.y=.01;pg.add(rim)}
     else for(const ln of q[1]){const log=K.vb(P2=>{for(let x=-4;x<4;x++)for(let y=0;y<5;y++)for(let z=-3;z<3;z++)if((y-2)**2+(z+.5)**2<9)P2.set(x,y,z,(x+z)%4?'w':'wd')},.13,P);log.position.x=(ln-1)*1.2;pg.add(log)}
     pg.visible=false;G2.add(pg);return pg});
   K.light(G2,0,2.2,2.4,O.fireCol||'#ffb060',2.4);
   return{g:G2,cam:[[0,3.2,6.4],[0,.4,1]],walk:1,spot:(p,i,n)=>{const d=g.d,ln=d.ln[p.slot]??1,jt=d.jt[p.slot],dk=d.dk[p.slot],air=g.st==='play'&&jt!=null&&g.t-jt>=0&&g.t-jt<.5,low=g.st==='play'&&dk!=null&&g.t-dk>=0&&g.t-dk<.6;
     return[(ln-1)*1.2+(i%2?.16:-.16)*(n>2?1:0),air?Math.sin((g.t-jt)/.5*Math.PI)*.55:low?-.35:0,(i>1?.45:0),Math.PI]},
   update(m){const t=m.st==='play'?m.t:-9;m.d.hz.forEach((q,i)=>{const z=(q[0]-t)*3.4;hz[i].visible=z>-1.2&&z<4.2;hz[i].position.set(0,.02,-z)})}}},
 pad(K){if(K.first){const s=K.s,go=c=>()=>{K.buzz(c==='J'?25:c==='D'?25:10);s.n=(s.n||0)+1;K.send(s.n+':'+c)};K.x.append(K.row(3,...['Left','Middle','Right'].map((t,i)=>K.btn(t,'lanes',go(String(i))))),K.row(2,K.btn('JUMP','go',go('J')),K.btn('DUCK','go duck',go('D'))))}
   K.x.querySelectorAll('.lanes').forEach((b,i)=>b.classList.toggle('on',i===K.d.ln[K.sl]))},
 hint:()=>'Trunks: change lane. Roots across the path: JUMP. Branches across it: DUCK.'});

/* ===== 5 · The Drowned Vaults · Rising Tide: air runs out; gulp the bubbles as they reach you; beware the jellies ===== */
O.addMg({id:'tide',dun:2,name:'Rising Tide',hearts:1,ctl:'Phone: GULP',live:true,
 brief:'The vault has flooded and your air is running out. Bubbles rise toward you: press GULP just as one reaches your mouth to breathe. Pink jelly-bubbles sting: let them pass. Hold on for 30 seconds.',
 setup(g){g.dur=30;g.d.air={};g.d.b={};for(const p of here()){const r=H.rng(g.seed+p.slot*977),a=[];let t=1.4;while(t<29.5){const f=t/30;a.push([+t.toFixed(2),f>.25&&r()<.28?1:0]);t+=1.75-.7*f+r()*.5}g.d.b[p.slot]=a;g.d.air[p.slot]=100}g.used={};g.n={}},
 input(g,p,v,at){const n=num(+v);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;const b=g.d.b[p.slot]||[];const u=g.used[p.slot]=g.used[p.slot]||{};
   const k=b.findIndex((q,i)=>!u[i]&&Math.abs(q[0]-at)<=.2);if(k<0){g.d.air[p.slot]=Math.max(0,g.d.air[p.slot]-6);return}u[k]=1;if(b[k][1]){g.d.air[p.slot]=Math.max(0,g.d.air[p.slot]-25);H.ev('mgBad');H.ev('mgHit',{slot:p.slot})}else{g.d.air[p.slot]=Math.min(100,g.d.air[p.slot]+30);H.ev('mgGood')}},
 tick(g,dt){for(const p of alive(g)){g.d.air[p.slot]=Math.max(0,g.d.air[p.slot]-dt*(10+g.t*.17));if(g.d.air[p.slot]<=0)H.hit(g,p)}for(const p of here())if(g.d.out[p.slot]==null&&g.d.air[p.slot]<=0)g.d.air[p.slot]=40},
 prog:(g,p)=>`air ${Math.round(g.d.air[p.slot]||0)}%`,
 tv(K,g){const G2=K.room({w:6,d:4}),T=K.T,W=new T.Mesh(new T.BoxGeometry(8,3.4,5),new T.MeshBasicMaterial({color:K.acc(),transparent:true,opacity:.14,depthWrite:false}));W.position.y=1.5;G2.add(W);
   const balls={};const sp=(i,n)=>slotX(i,n,1.1);
   return{g:G2,cam:[[0,1.6,5],[0,1.1,0]],spot:(p,i,n)=>[sp(i,n),.05+Math.sin(K.now()*1.6+i)*.06,0,0],
   update(m){const t=m.st==='play'?m.t:-9,ps=here();ps.forEach((p,i)=>{const arr=m.d.b[p.slot]||[];let pool=balls[p.slot]||(balls[p.slot]=[]);let k=0;for(let j=0;j<arr.length;j++){const dt=arr[j][0]-t;if(dt<-.15||dt>1.4||(m.used&&m.used[p.slot]&&m.used[p.slot][j]))continue;
       let b=pool[k];if(!b){b=new T.Mesh(new T.SphereGeometry(.09,10,8),new T.MeshBasicMaterial({color:'#bff4ff',transparent:true,opacity:.85,toneMapped:false}));G2.add(b);pool.push(b)}b.visible=true;b.material.color.set(arr[j][1]?'#ff8ad8':'#bff4ff');b.scale.setScalar(arr[j][1]?1.5:1);b.position.set(sp(i,ps.length)+.05,1.35-dt*1.2,.35);k++}
       for(;k<pool.length;k++)pool[k].visible=false})}}},
 hud(x,w,h,g,HK){const ps=HK.players();ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*Math.min(w*.2,240);HK.bar(x,X-50,h*.12,100,10,(g.d.air[p.slot]||0)/100,(g.d.air[p.slot]||0)<30?'#ff5a4a':'#7fe0ff');HK.txt(x,'AIR',X,h*.09,14)})},
 pad(K){const d=K.d,sl=K.sl,s=K.s;if(K.first){s.cv=K.canvas(260);s.m=K.meter('air');K.x.append(s.m,s.cv,K.btn('GULP','go big',()=>{K.buzz(15);s.n=(s.n||0)+1;K.send(String(s.n))}))}
   s.m.set((d.air[sl]||0)/100);const[x,w,h]=K.fit(s.cv),t=K.now();x.fillStyle='#0a2024';x.fillRect(0,0,w,h);x.fillStyle='rgba(127,224,255,.25)';x.fillRect(0,h*.18-14,w,28);
   x.fillStyle='#e8d8c0';x.beginPath();x.arc(w/2,h*.18,16,0,7);x.fill();for(const q of d.b[sl]||[]){const dt=q[0]-t;if(dt<-.2||dt>1.4)continue;x.fillStyle=q[1]?'#ff8ad8':'#bff4ff';x.beginPath();x.arc(w/2,h*.18+dt/1.4*(h*.8),q[1]?14:10,0,7);x.fill()}},
 hint:()=>'Press GULP as a blue bubble reaches you. Let pink ones pass.'});

/* ===== 6 · The Drowned Vaults · Springing Leaks: hold a crack to plug it; one hand each; keep the water down together ===== */
O.addMg({id:'leaks',dun:2,name:'Springing Leaks',ctl:'Phone: press and hold a crack',live:true,
 brief:'Cracks burst open in the vault wall and the sea pours in. Press and hold a crack on your phone until it seals: a leak takes a second, a gusher nearly two. You only have one hand, so share the cracks out and seal the gushers first. Let go early and the seal slips. If the water reaches the ceiling, everyone is caught.',
 setup(g){const r=H.rng(g.seed),n=Math.max(1,here().length);g.dur=30;g.d.lv=0;g.d.on=[0,0,0,0,0,0];g.d.sl=[0,0,0,0,0,0];g.d.hold={};g.ev2=[];let t=1;while(t<28){const f=t/30;g.ev2.push([+t.toFixed(2),Math.floor(r()*6),r()<.18+.3*f?2:1]);t+=(2.3-1.2*f)/n+r()*.6/n}g.ei=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));g.d.hold[p.slot]=k>=0&&k<6?k:-1},
 /* holding a crack seals it: a leak in a second, a gusher in under two. Let go early and the seal slips back. */
 tick(g,dt){const d=g.d;while(g.ei<g.ev2.length&&g.t>=g.ev2[g.ei][0]){const[,k,s]=g.ev2[g.ei];d.on[k]=Math.max(d.on[k],s);g.ei++;H.ev('mgBurst')}
   const held=new Set(Object.values(d.hold).filter(k=>k>=0));let flow=0;
   d.on.forEach((s,k)=>{if(!s){d.sl[k]=0;return}if(held.has(k)){d.sl[k]+=dt/(s>1?1.8:1);if(d.sl[k]>=1){d.on[k]=0;d.sl[k]=0;H.ev('mgGood')}}else{d.sl[k]=Math.max(0,d.sl[k]-dt*.5);flow+=s}});
   d.lv=clamp(d.lv+dt*(flow*6-1),0,100);if(d.lv>=100){d.flood=1;g.end=1}},
 pass:g=>!g.d.flood,prog:g=>`water ${Math.round(g.d.lv)}%`,
 tv(K,g){const G2=K.room({w:7,d:4,h:3.6}),T=K.T,cr=[],jets=[];for(let k=0;k<6;k++){const x=(k%3-1)*1.6,y=k<3?2.3:1.1;const c=K.glow(.5,.5,.04,'#2a5060');c.position.set(x,y,-2.15);G2.add(c);cr.push(c);
     const j=new T.Mesh(new T.CylinderGeometry(.05,.18,1,8),new T.MeshBasicMaterial({color:'#9fe8ff',transparent:true,opacity:.7,toneMapped:false}));j.rotation.x=Math.PI/2;j.position.set(x,y-.1,-1.6);j.visible=false;G2.add(j);jets.push(j)}
   const W=new T.Mesh(new T.BoxGeometry(7.6,1,4.6),new T.MeshBasicMaterial({color:K.lin('#2a7a8a'),transparent:true,opacity:.45,depthWrite:false}));G2.add(W);
   return{g:G2,cam:[[0,2,5.6],[0,1.4,-1]],spot:(p,i,n)=>{const k=g.d.hold[p.slot];if(k>=0)return[(k%3-1)*1.6,k<3?.6:0,-1.6,Math.PI];return[slotX(i,n,.8),0,.6,Math.PI]},
   update(m){const held=new Set(Object.values(m.d.hold).filter(k=>k>=0));cr.forEach((c,k)=>{const s=m.d.on[k];c.material.color.set(!s?'#2a5060':held.has(k)?'#9dffb0':s>1?'#ff5a4a':'#ffb54a');jets[k].visible=!!s&&!held.has(k);jets[k].scale.set(s>1?1.6:1,1+Math.sin(K.now()*30)*.1,s>1?1.6:1)});
     const lv=m.d.lv/100*3.2;W.scale.y=Math.max(.01,lv);W.position.y=lv/2}}},
 hud(x,w,h,g,HK){HK.txt(x,'WATER',w*.06,h*.12,16,'#9fe8ff','left');HK.bar(x,w*.06,h*.15,w*.2,14,g.d.lv/100,g.d.lv>70?'#ff5a4a':'#3ab8d8')},
 pad(K){const d=K.d,s=K.s;if(K.first){const gr=K.el('div','mgGrid g3');for(let k=0;k<6;k++)gr.appendChild(K.btn('','crack',v=>{if(v){K.buzz(12);s.h=k;K.send(String(k))}else if(s.h===k){s.h=-1;K.send('-1')}},true));K.x.appendChild(gr)}
   const held=Object.entries(d.hold).filter(e=>e[1]>=0);K.x.querySelectorAll('.crack').forEach((b,k)=>{const lk=d.on[k],who=held.find(e=>e[1]===k);b.className='btn mgB crack '+(lk>1?'gush':lk?'leak':'')+(who?' held':'');b.style.borderColor=who?K.LANES[+who[0]]:'';b.textContent=lk>1?'GUSH':lk?'leak':'';const sl=(d.sl||[])[k]||0;b.style.background=lk&&sl>0?`linear-gradient(to top,#3ab86a ${Math.round(sl*100)}%,transparent ${Math.round(sl*100)}%)`:''})},
 hint:()=>'Hold a crack until it seals. Gushers first!'});

/* ===== 7 · Emberforge · Hot Floor: plates heat under your feet; keep moving ===== */
O.addMg({id:'hotfloor',dun:3,name:'Hot Floor',hearts:true,ctl:'Phone: ◀ ▶',live:true,
 brief:'Five iron plates over the furnace. The plate you stand on heats up, faster with company, and the forge flares across the floor. Step to a cooler plate before yours turns white-hot. Watch for the flare glow.',
 setup(g){const r=H.rng(g.seed);g.dur=30;g.d.heat=[10,10,10,10,10];g.d.at={};here().forEach((p,i)=>g.d.at[p.slot]=[1,3,0,4][i%4]);g.fl=[];let t=3;while(t<29){const f=t/30,k=1+Math.floor(r()*(f>.5?3:2)),a=[];while(a.length<k){const j=Math.floor(r()*5);if(!a.includes(j))a.push(j)}g.fl.push([+t.toFixed(2),a]);t+=3.2-1.6*f+r()}g.fi=0;g.d.fw=[]},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<5)g.d.at[p.slot]=k},
 tick(g,dt){const d=g.d,cnt=[0,0,0,0,0];for(const p of alive(g))cnt[d.at[p.slot]]++;
   for(let k=0;k<5;k++)d.heat[k]=clamp(d.heat[k]+(cnt[k]?(11+7*cnt[k]+g.t*.3):-22)*dt,0,100);
   d.fw=g.fl.filter(q=>g.t>=q[0]-.9&&g.t<q[0]).flatMap(q=>q[1]);while(g.fi<g.fl.length&&g.t>=g.fl[g.fi][0]){for(const k of g.fl[g.fi][1])d.heat[k]=Math.min(100,d.heat[k]+55);g.fi++;H.ev('mgBurst')}
   for(const p of alive(g)){const k=d.at[p.slot];if(d.heat[k]>=100){H.hit(g,p);d.heat[k]=45}}},
 prog:(g,p)=>`plate ${g.d.at[p.slot]+1}`,
 tv(K,g){const G2=K.room({w:7,d:4}),pl=[];for(let k=0;k<5;k++){const m=new K.T.Mesh(new K.T.BoxGeometry(1.05,.12,1.6),[0,1,2,3,4,5].map(f=>new K.T.MeshBasicMaterial({color:K.lin('#2a2628')})));m.position.set((k-2)*1.2,.06,0);G2.add(m);pl.push(m)}
   const fl=pl.map((q,k)=>{const t=K.tile(1.05,1.6,'#ffb21a');t.position.set((k-2)*1.2,.14,0);G2.add(t);return t});
   return{g:G2,cam:[[0,3.4,5.2],[0,.3,0]],spot:(p,i,n)=>{const k=g.d.at[p.slot]??2,mates=here().filter(q=>g.d.at[q.slot]===k),j=mates.indexOf(p);return[(k-2)*1.2,.12,(j-(mates.length-1)/2)*.4,0]},
   update(m){pl.forEach((q,k)=>{const h=m.d.heat[k]/100;q.material.forEach((mt,f)=>{mt.color.setRGB(.035+h*.95,.03+h*h*h*.8,.032+Math.pow(h,5)*.7);if(f!==2)mt.color.multiplyScalar(.55)})});fl.forEach((t,k)=>t.material.opacity=m.d.fw.includes(k)?.35+.2*Math.sin(K.now()*30):0)}}},
 hud(x,w,h,g,HK){for(let k=0;k<5;k++){const X=w/2+(k-2)*w*.09;HK.bar(x,X-w*.035,h*.1,w*.07,10,g.d.heat[k]/100,g.d.heat[k]>75?'#fff0c0':'#ff7a20')}},
 pad(K){const d=K.d,s=K.s;if(K.first){s.row=K.el('div','heatRow');for(let k=0;k<5;k++)s.row.appendChild(K.el('i'));const mv=dl=>()=>{const k=clamp((d.at[K.sl]??2)+dl,0,4);K.buzz(10);K.send(String(k))};K.x.append(s.row,K.row(2,K.btn('◀','go big',mv(-1)),K.btn('▶','go big',mv(1))))}
   [...s.row.children].forEach((c,k)=>{const h=K.d.heat[k]/100;c.style.background=`rgb(${40+215*h|0},${40+180*h*h|0},${40+160*h*h*h|0})`;c.classList.toggle('me',K.d.at[K.sl]===k);c.classList.toggle('flare',K.d.fw.includes(k))})},
 hint:()=>'Keep moving to cooler plates. Flaring plates glow gold first.'});

/* ===== 8 · Emberforge · The Crucible Pour: hold to pour; it keeps flowing a moment after; hit the line ===== */
O.addMg({id:'pour',dun:3,name:'The Crucible Pour',ctl:'Phone: hold to pour',live:true,
 brief:'Fill three moulds with molten iron, right to the line. Hold to pour, let go to stop, but the iron keeps flowing a moment after you let go, and each mould fills faster than the last. Overfill and it splashes; underfill and it cracks. Get all three right.',
 setup(g){g.dur=36;g.d.res={};g.d.lv={};g.d.mo={}},
 input(g,p,v){const[r,m,l]=String(v).split(';');g.d.res[p.slot]=String(r||'').split('').map(Number).slice(0,3);g.d.mo[p.slot]=num(+m);g.d.lv[p.slot]=num(+l);if(here().every(q=>(g.d.res[q.slot]||[]).length>=3))g.end=1},
 pass:(g,p)=>{const r=g.d.res[p.slot]||[];return r.length>=3&&r.every(Boolean)},prog:(g,p)=>`${(g.d.res[p.slot]||[]).filter(Boolean).length} good of ${(g.d.res[p.slot]||[]).length}`,
 tv(K,g){const G2=K.room({w:6,d:4}),T=K.T,cr=K.vb(P2=>{for(let x=-4;x<4;x++)for(let y=0;y<7;y++)for(let z=-4;z<4;z++)if(Math.hypot(x+.5,z+.5)<4&&(Math.hypot(x+.5,z+.5)>3||y===0))P2.set(x,y,z,'i');for(let x=-3;x<3;x++)for(let z=-3;z<3;z++)P2.set(x,6,z,'f')},.12,K.pal());cr.position.set(0,1.6,-1.2);cr.rotation.z=.5;G2.add(cr);
   K.light(G2,0,1.6,0,'#ff7a20',3);return{g:G2,cam:[[0,2,5],[0,1,-.5]],spot:(p,i,n)=>[slotX(i,n,.9),0,.8,Math.PI],update(){cr.rotation.z=.4+Math.sin(K.now()*1.3)*.1}}},
 hud(x,w,h,g,HK){const ps=HK.players();ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*Math.min(w*.2,220),r=g.d.res[p.slot]||[];for(let k=0;k<3;k++){const Y=h*.12,cx=X+(k-1)*34;x.fillStyle='#2a2226';x.fillRect(cx-12,Y,24,40);
     const lv=k<r.length?(r[k]?.82:.5):k===r.length?(g.d.lv[p.slot]||0):0;x.fillStyle='#ff8a2a';x.fillRect(cx-12,Y+40*(1-lv),24,40*lv);x.fillStyle='#fff';x.fillRect(cx-14,Y+40*(1-.82),28,2);if(k<r.length)HK.txt(x,r[k]?'✓':'✗',cx,Y+52,16,r[k]?'#9dffb0':'#ff7a6a')}})},
 pad(K){const s=K.s;if(K.first){s.res=[];s.lv=0;s.flow=0;s.hold=0;s.cv=K.canvas(300);s.btn=K.btn('Hold to pour','go big',v=>{s.hold=v;if(v)K.buzz(10)},true);K.x.append(s.cv,s.btn);s.last=performance.now()}
   const now=performance.now(),dt=Math.min(.05,(now-s.last)/1000);s.last=now;const k=s.res.length,rate=[.3,.38,.47][Math.min(2,k)];
   if(k<3){if(s.hold)s.flow=rate;else s.flow=Math.max(0,s.flow-rate*dt/.28);s.lv+=s.flow*dt;
     if(s.lv>1.02||(!s.hold&&s.flow<=0&&s.lv>.05)){const ok=Math.abs(s.lv-.82)<=.06;s.res.push(ok?1:0);K.buzz(ok?[20,30,20]:80);O.sfx(ok?'mgGood':'mgBad');s.lv=0;s.flow=0;s.hold=0}
     if(!s.tx||now-s.tx>150){s.tx=now;K.send(s.res.join('')+';'+s.res.length+';'+s.lv.toFixed(2))}}
   const[x,w,h]=K.fit(s.cv);x.fillStyle='#120a08';x.fillRect(0,0,w,h);const mw=w*.4,mx=w/2-mw/2,my=h*.18,mh=h*.72;x.fillStyle='#2a2226';x.fillRect(mx,my,mw,mh);x.fillStyle='#ff8a2a';const lv=Math.min(1,s.lv);x.fillRect(mx,my+mh*(1-lv),mw,mh*lv);
   x.fillStyle='#fff';x.fillRect(mx-10,my+mh*(1-.82)-1,mw+20,3);x.fillStyle='rgba(157,255,176,.25)';x.fillRect(mx-10,my+mh*(1-.88),mw+20,mh*.12);if(s.flow>0){x.fillStyle='#ffb04a';x.fillRect(w/2-4,0,8,my+mh*(1-lv))}
   x.fillStyle='#e8d8c0';x.font='800 16px system-ui';x.textAlign='center';x.fillText(k<3?`Mould ${k+1} of 3`:'Done!',w/2,20);s.res.forEach((r,i)=>{x.fillStyle=r?'#9dffb0':'#ff7a6a';x.fillText(r?'✓':'✗',w/2+(i-1)*26,h-6)})},
 hint:()=>'Hold to pour. Let go early: it keeps flowing. Stop on the white line.'});

/* ===== 9 · The Webbed Deep · Caught in Silk: tear the strand the silk glows on; the buttons shuffle; the spider descends ===== */
const SILK=['spider','web','egg','fang'];
O.addMg({id:'silk',dun:4,name:'Caught in Silk',ctl:'Phone: four symbols, shuffled',live:true,
 brief:'You are wrapped in silk and the spider is coming down. Your phone shows which strand glows: press that symbol to tear it. A wrong one pulls the silk tight again. The strands keep changing, and so do the buttons’ places. Break free before the spider reaches you.',
 setup(g){g.dur=10.5;g.d.fr={};g.d.sp=0},
 input(g,p,v){const f=clamp(num(+v),0,100);g.d.fr[p.slot]=Math.max(g.d.fr[p.slot]||0,f);if(here().every(q=>(g.d.fr[q.slot]||0)>=100))g.end=1},
 tick(g){g.d.sp=g.t/g.dur},
 pass:(g,p)=>(g.d.fr[p.slot]||0)>=100,prog:(g,p)=>`${Math.round(g.d.fr[p.slot]||0)}% free`,
 tv(K,g){const G2=K.room({w:6,d:4,h:4}),T=K.T,coc={},sp=K.vb(P2=>{for(let x=-4;x<4;x++)for(let y=-3;y<3;y++)for(let z=-4;z<4;z++)if((x+.5)**2/16+(y+.5)**2/9+(z+.5)**2/16<1)P2.set(x,y,z,'d');for(const s0 of[-1,1])for(let k=0;k<4;k++)for(let j=0;j<6;j++)P2.set(s0*(4+j),j<3?j-1:2-j,k*2-3,'d');P2.set(-1,1,4,'a');P2.set(1,1,4,'a')},.08,K.pal());
   G2.add(sp);const th=new T.Mesh(new T.CylinderGeometry(.01,.01,4,4),new T.MeshBasicMaterial({color:K.lin('#e8e8f8')}));G2.add(th);
   return{g:G2,cam:[[0,2.2,5.2],[0,1.4,0]],spot:(p,i,n)=>[slotX(i,n,1),0,0,0],
   update(m){const ps=here();ps.forEach((p,i)=>{let c=coc[p.slot];if(!c){c=K.vb(P2=>{for(let y=0;y<11;y++)for(let x=-3;x<3;x++)for(let z=-3;z<3;z++)if((x+.5)**2+(z+.5)**2<9-(y>8?(y-8)*3:0))P2.set(x,y,z,K.V.hash(x,y,z)<.5?'b':'l')},.1,Object.assign(K.pal(),{b:{c:'#f0f0f8',n:.05},l:{c:'#d8d8e8',n:.05}}));G2.add(c);coc[p.slot]=c}
       const f=(m.d.fr[p.slot]||0)/100;c.position.set(slotX(i,ps.length,1),0,0);c.scale.setScalar(Math.max(.01,1-f));c.visible=f<1});
     const y=3.4-m.d.sp*2.2;sp.position.set(0,y,.2);th.position.set(0,y+2,.2)}}},
 pad(K){const s=K.s,sl=K.sl;if(K.first){s.f=0;s.r=H.rng((K.g.id*31+sl)|0);s.need=0;s.left=3;s.order=[0,1,2,3];s.pick=()=>{s.need=Math.floor(s.r()*4);s.left=Math.max(1,Math.round(4-s.f/35+s.r()*2));for(let i=3;i>0;i--){const j=Math.floor(s.r()*(i+1));[s.order[i],s.order[j]]=[s.order[j],s.order[i]]}};s.pick();
     s.show=K.el('div','silkNeed');s.m=K.meter();s.gr=K.el('div','mgGrid');for(let i=0;i<4;i++){const b=K.btn('','rune',()=>{const sym=s.order[i];if(s.f>=100)return;if(sym===s.need){s.f=Math.min(100,s.f+4);K.buzz(8);O.sfx('mgTap');if(--s.left<=0)s.pick()}else{s.f=Math.max(0,s.f-9);K.buzz(90);O.sfx('mgBad');s.pick()}K.send(s.f.toFixed(1));draw()});s.gr.appendChild(b)}
     const draw=()=>{s.show.replaceChildren(K.el('small',null,'Tear:'),K.glyph(SILK[s.need],70));s.m.set(s.f/100);[...s.gr.children].forEach((b,i)=>b.replaceChildren(K.glyph(SILK[s.order[i]],56)))};s.draw=draw;K.x.append(s.show,s.m,s.gr);draw()}
   if(s.f>=100&&!s.done){s.done=1;K.x.replaceChildren(K.el('div','mgBig ok','Free!'))}},
 hint:()=>'Press the symbol your phone shows. The buttons move!'});

/* ===== 10 · The Webbed Deep · Eyes in the Dark: eyes glint, then lunge; face your torch that way; the dim pair is only a reflection ===== */
const DIRS=['Ahead','Right','Behind','Left'];
O.addMg({id:'eyes',dun:4,name:'Eyes in the Dark',hearts:true,ctl:'Phone: four directions',
 brief:'Pitch black. A pair of eyes glints ahead, behind, left or right, then lunges. Swing your torch to face it before it strikes. Later a dim pair glints too: that one is only a reflection, so face the bright one.',
 setup(g){const r=H.rng(g.seed);g.d.e=[];let t=1.4;const N=24;for(let i=0;i<N;i++){const f=i/(N-1),dir=Math.floor(r()*4),warn=+(1.2-.58*f).toFixed(2),dec=i>8&&r()<.5?(dir+1+Math.floor(r()*3))%4:-1;g.d.e.push([+t.toFixed(2),+(t+warn).toFixed(2),dir,dec]);t+=warn+.9-.45*f}
   g.dur=t+.6;g.d.dir={};for(const p of here())g.d.dir[p.slot]=0;g.res=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<4)g.d.dir[p.slot]=k},
 tick(g){while(g.res<g.d.e.length&&g.t>=g.d.e[g.res][1]){const e=g.d.e[g.res];for(const p of alive(g))if(g.d.dir[p.slot]!==e[2])H.hit(g,p);g.res++;H.ev('mgBurst')}if(g.res>=g.d.e.length)g.end=1},
 prog:g=>`${g.res}/${g.d.e.length}`,key:(g,d,sl)=>d.dir[sl],
 tv(K,g){const G2=K.room({w:7,d:6,sides:true}),T=K.T,pos=[[0,1.3,-2.6],[3.2,1.2,0],[0,1.1,3.2],[-3.2,1.2,0]],eyes=pos.map(q=>{const e=new T.Group();for(const s0 of[-1,1]){const m=K.glow(.14,.08,.04,'#ff3a1a');m.position.x=s0*.13;e.add(m)}e.position.set(...q);e.visible=false;G2.add(e);return e});
   const dark=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshBasicMaterial({color:'#000',transparent:true,opacity:.55}));dark.rotation.x=-Math.PI/2;dark.position.y=.02;G2.add(dark);
   return{g:G2,cam:[[0,4.4,4.2],[0,.5,-.2]],spot:(p,i,n)=>{const a=[Math.PI,-Math.PI/2,0,Math.PI/2][g.d.dir[p.slot]||0];return[slotX(i,n,.6),0,0,a]},
   update(m){const t=m.st==='play'?m.t:-9,e=m.d.e[m.res];eyes.forEach((q,k)=>{q.visible=false});if(e&&t>=e[0]){const k=e[2],lunge=clamp((t-e[0])/(e[1]-e[0]),0,1);eyes[k].visible=true;eyes[k].scale.setScalar(.9+lunge*.6);eyes[k].children.forEach(c=>c.material.color.set('#ff3a1a'));
       if(e[3]>=0){eyes[e[3]].visible=true;eyes[e[3]].scale.setScalar(.8);eyes[e[3]].children.forEach(c=>c.material.color.set('#5a1a10'))}}}}},
 pad(K){if(K.first){const pad=K.el('div','dirPad');DIRS.forEach((n,k)=>{const b=K.btn(['▲','▶','▼','◀'][k],'dir d'+k,()=>{K.buzz(10);K.send(String(k))});pad.appendChild(b)});K.x.appendChild(pad)}
   K.x.querySelectorAll('.dir').forEach((b,k)=>b.classList.toggle('on',k===K.d.dir[K.sl]))},
 hint:()=>'Face your torch toward the BRIGHT eyes on the big screen.'});
})();
