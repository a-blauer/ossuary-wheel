/* Trap mini games for dungeons 16-20: the Crystal Mines, the Abyssal Trench, the Blood Cathedral, the Dragon's Roost, the Hollow Throne.
   Several of these are judged on the phone (tracing, searching, rhythm) and report their result; the big screen shows everyone's progress. */
(()=>{
const O=window.OW,G=O.G,H=O.MGH,{clamp,num,here,alive}=H;
const slotX=(i,n,sp)=>(i-(n-1)/2)*(sp||.8);
const report={input(g,p,v){const a=String(v).split(':').map(Number);g.d.rp=g.d.rp||{};g.d.rp[p.slot]=a;if(here().every(q=>g.d.rp[q.slot]&&g.d.rp[q.slot][2]))g.end=1}};
const barsHud=(lab,f)=>(x,w,h,g,HK)=>{const ps=HK.players();HK.txt(x,lab,w/2,h*.08,Math.max(18,h*.04));ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*Math.min(w*.2,230);HK.bar(x,X-55,h*.13,110,10,f(g,p),HK.LANES[p.slot])})};
const roomTv=(K,g,o)=>{const G2=K.room(o||{w:7,d:5});return{g:G2,cam:[[0,1.9,5.2],[0,1.1,-1]],spot:(p,i,n)=>[slotX(i,n,.9),0,.8,Math.PI],update(){}}};

/* ===== 31 · The Crystal Mines · Crystal Vein: trace the seam with your finger ===== */
O.addMg({id:'vein',dun:15,name:'Crystal Vein',ctl:'Phone: trace with your finger',live:true,
 brief:'A seam of crystal glows through the rock on your phone. Trace it with your finger from the bottom to the top without straying off it. The vein narrows and twists. Stray off more than three times, or run out of time, and the mine collapses on you.',
 setup(g){g.dur=28;g.d.seed=(g.seed%100000)+3},input:report.input,
 pass:(g,p)=>{const r=(g.d.rp||{})[p.slot];return!!r&&r[2]===1},prog:(g,p)=>{const r=(g.d.rp||{})[p.slot]||[0,0,0];return r[2]===1?'through!':r[2]===2?'collapsed':`${r[0]}% · ${r[1]} slips`},
 tv(K,g){const S=roomTv(K,g,{w:7,d:5,h:3.8});const v=K.vb(P2=>{let x=0;for(let y=0;y<30;y++){x+=Math.round(Math.sin(y*.7)*1.2);for(let w=-1;w<=1;w++)P2.set(x+w,y,0,'a')}},.1,K.pal());v.position.set(0,0,-2.3);S.g.add(v);return S},
 hud:barsHud('Trace the vein on your phone',(g,p)=>(((g.d.rp||{})[p.slot]||[0])[0])/100),
 pad(K){const s=K.s;if(K.first){const r=H.rng(K.d.seed);s.pts=[];let x=.5;for(let i=0;i<=26;i++){x=clamp(x+(r()-.5)*.32,.15,.85);s.pts.push([x,1-i/26])}s.cv=K.canvas(380);s.prog=0;s.slips=0;s.res=0;s.on=false;K.x.appendChild(s.cv);
     const at=e=>{const b=s.cv.getBoundingClientRect();return[(e.clientX-b.left)/b.width,(e.clientY-b.top)/b.height]};
     const near=(px,py)=>{let best=[1e9,0];for(let i=0;i<s.pts.length-1;i++){const[a,b]=s.pts[i],[c,d]=s.pts[i+1],dx=c-a,dy=d-b,t=clamp(((px-a)*dx+(py-b)*dy)/(dx*dx+dy*dy),0,1),qx=a+dx*t,qy=b+dy*t,dd=Math.hypot(px-qx,(py-qy)*1.3);if(dd<best[0])best=[dd,(i+t)/(s.pts.length-1)]}return best};
     const wid=f=>.085-.045*f;
     const mv=e=>{if(s.res||!s.on)return;const[px,py]=at(e),[dd,f]=near(px,py);if(dd>wid(f)){s.on=false;s.slips++;K.buzz(80);O.sfx('mgBad');if(s.slips>3){s.res=2}send();return}if(f>=s.prog-.06&&f<=s.prog+.08)s.prog=Math.max(s.prog,f);if(s.prog>=.985){s.res=1;O.sfx('mgGood')}send()};
     const send=()=>{if(!s.tx||performance.now()-s.tx>140||s.res){s.tx=performance.now();K.send(Math.round(s.prog*100)+':'+s.slips+':'+s.res)}};
     s.cv.addEventListener('pointerdown',e=>{if(s.res)return;const[px,py]=at(e),[dd,f]=near(px,py);if(dd<=wid(f)&&Math.abs(f-s.prog)<.08){s.on=true;try{s.cv.setPointerCapture(e.pointerId)}catch(q){}}e.preventDefault()});s.cv.addEventListener('pointermove',mv);s.cv.addEventListener('pointerup',()=>{s.on=false})}
   if(!s.res&&K.now()>K.g.dur-.2){s.res=2;K.send(Math.round(s.prog*100)+':'+s.slips+':2')}
   const[x,w,h]=K.fit(s.cv);x.fillStyle='#1a1018';x.fillRect(0,0,w,h);x.lineCap='round';x.lineJoin='round';for(let i=0;i<s.pts.length-1;i++){const f=i/(s.pts.length-1);x.strokeStyle=f<s.prog?'#ffb0ff':'#8a3a8a';x.lineWidth=(.085-.045*f)*2*w;x.beginPath();x.moveTo(s.pts[i][0]*w,s.pts[i][1]*h);x.lineTo(s.pts[i+1][0]*w,s.pts[i+1][1]*h);x.stroke()}
   const n=s.pts.length-1,k=Math.min(n-1,Math.floor(s.prog*n)),u=s.prog*n-k,P=[s.pts[k][0]+(s.pts[k+1][0]-s.pts[k][0])*u,s.pts[k][1]+(s.pts[k+1][1]-s.pts[k][1])*u];x.fillStyle=K.LANES[K.sl];x.beginPath();x.arc(P[0]*w,P[1]*h,10,0,7);x.fill();
   x.fillStyle='#fff';x.font='800 16px system-ui';x.textAlign='center';x.fillText(s.res===1?'Through!':s.res===2?'Collapsed!':`Slips ${s.slips}/3 · start from your dot`,w/2,20)},
 hint:()=>'Put your finger on your dot and trace the pink vein upward.'});

/* ===== 32 · The Crystal Mines · The Flawed Crystal: find the one with the hairline flaw ===== */
O.addMg({id:'flaw',dun:15,name:'The Flawed Crystal',ctl:'Phone: tap the flawed crystal',live:true,
 brief:'A wall of crystals, and one has a hairline flaw. Find it and strike it on your phone before the seam groans. Every wall is bigger and its flaw subtler. A wrong strike, or running out of time, and the trap springs. Find the flaw in all five walls.',
 setup(g){g.dur=60;g.d.seed=(g.seed%100000)+11},input:report.input,
 pass:(g,p)=>{const r=(g.d.rp||{})[p.slot];return!!r&&r[0]>=5},prog:(g,p)=>{const r=(g.d.rp||{})[p.slot]||[0,0,0];return`${r[0]} found · wall ${Math.min(5,r[1]+1)}/5`},
 tv(K,g){const S=roomTv(K,g,{w:7,d:5,h:3.8});for(let k=0;k<9;k++){const c=K.vb(P2=>{for(let y=0;y<8;y++)for(let a=-2;a<2;a++)if(Math.abs(a+.5)<2-y*.2)P2.set(a,y,0,'a')},.1,K.pal());c.position.set((k%3-1)*1.4,.6+Math.floor(k/3)*.9,-2.2);S.g.add(c)}return S},
 hud:barsHud('Find the flaw on your phone',(g,p)=>(((g.d.rp||{})[p.slot]||[0])[0])/5),
 pad(K){const s=K.s;if(K.first){s.r=H.rng(K.d.seed);s.wall=-1;s.found=0;s.res=0;s.cv=K.canvas(340);K.x.appendChild(s.cv);
     s.next=()=>{s.wall++;if(s.wall>=5||s.miss){s.res=1;K.send(s.found+':'+Math.min(5,s.wall)+':1');return}const n=s.wall<2?4:5;s.n=n;s.flaw=Math.floor(s.r()*n*n);s.t0=K.now();s.lim=7.5-s.wall*.4;s.rot=[...Array(n*n)].map(()=>s.r()*.3-.15);s.str=Math.max(.35,1-s.wall*.13);K.send(s.found+':'+s.wall+':0')};s.next();
     s.cv.addEventListener('pointerdown',e=>{if(s.res)return;const b=s.cv.getBoundingClientRect(),c=Math.min(b.width,b.height)/s.n,ox=(b.width-c*s.n)/2,i=Math.floor((e.clientX-b.left-ox)/c),j=Math.floor((e.clientY-b.top)/c);if(i<0||j<0||i>=s.n||j>=s.n)return;
       if(j*s.n+i===s.flaw){s.found++;K.buzz([15,30,15]);O.sfx('mgGood')}else{K.buzz(90);O.sfx('mgBad');s.miss=1}s.next();e.preventDefault()})}
   if(!s.res&&K.now()-s.t0>s.lim){O.sfx('mgBad');s.miss=1;s.next()}if(s.res)return;
   const[x,w,h]=K.fit(s.cv),n=s.n,c=Math.min(w,h)/n,ox=(w-c*n)/2;x.fillStyle='#140a14';x.fillRect(0,0,w,h);for(let k=0;k<n*n;k++){const cx=ox+(k%n+.5)*c,cy=(Math.floor(k/n)+.5)*c;x.save();x.translate(cx,cy);x.rotate(s.rot[k]);x.fillStyle='#c050c0';x.beginPath();x.moveTo(0,-c*.42);x.lineTo(c*.28,-c*.1);x.lineTo(c*.2,c*.4);x.lineTo(-c*.2,c*.4);x.lineTo(-c*.28,-c*.1);x.closePath();x.fill();
     x.fillStyle='rgba(255,220,255,.35)';x.beginPath();x.moveTo(0,-c*.42);x.lineTo(c*.08,c*.4);x.lineTo(-c*.04,c*.4);x.closePath();x.fill();if(k===s.flaw){x.strokeStyle=`rgba(40,0,40,${s.str})`;x.lineWidth=Math.max(1,2.4*s.str);x.beginPath();x.moveTo(-c*.15,-c*.05);x.lineTo(c*.02,c*.08);x.lineTo(-c*.05,c*.25);x.stroke()}x.restore()}
   x.fillStyle='#ffb0ff';x.fillRect(0,h-6,w*clamp(1-(K.now()-s.t0)/s.lim,0,1),6)},
 hint:()=>'Find the crystal with the thin dark crack.'});

/* ===== 33 · The Abyssal Trench · Lure Lights: tap the warm lantern, never the cold lures ===== */
O.addMg({id:'lures',dun:16,name:'Lure Lights',hearts:true,ctl:'Phone: tap the lights',live:true,
 brief:'Lights drift up out of the black on your phone. Tap the WARM lanterns to keep your light burning. The COLD ones are angler-fish lures and they bite. If your light goes out, the dark bites too. It speeds up.',
 setup(g){g.dur=28;g.d.seed=(g.seed%100000)+5},
 input(g,p,v){const[hp]=String(v).split(':').map(Number);const k=p.slot;(g.d.seen=g.d.seen||{})[k]=1;while(g.d.out[k]==null&&g.d.hp[k]>hp)H.hit(g,p)},
 prog:(g,p)=>g.d.out[p.slot]!=null?'out':'in the dark',pass:(g,p)=>g.d.out[p.slot]==null&&!!(g.d.seen||{})[p.slot],
 tv(K,g){const S=roomTv(K,g,{w:7,d:5});const pool=[];S.update=m=>{const t=m.t;let k=0;for(let i=0;i<10;i++){let s=pool[k];if(!s){s=new K.T.Mesh(new K.T.SphereGeometry(.07,8,6),new K.T.MeshBasicMaterial({color:'#fff',toneMapped:false}));S.g.add(s);pool.push(s)}s.material.color.set(i%3?'#40c0ff':'#ffb040');s.position.set(Math.sin(i*2.1+t*.4)*2.6,((t*.5+i*.37)%3),-1.6+Math.cos(i)*0.8);k++}};return S},
 pad(K){const s=K.s;if(K.first){s.r=H.rng(K.d.seed*7+K.sl);s.L=[];s.hp=3;s.light=1;s.cv=K.canvas(380);s.m=K.meter('lamp');K.x.append(s.m,s.cv);s.last=K.now();s.spawn=0;
     s.cv.addEventListener('pointerdown',e=>{const b=s.cv.getBoundingClientRect(),px=(e.clientX-b.left)/b.width,py=(e.clientY-b.top)/b.height;const L=s.L.find(q=>!q.gone&&Math.hypot(q.x-px,(q.y-py)*b.height/b.width)<.09);if(!L)return;L.gone=1;
       if(L.warm){s.light=Math.min(1,s.light+.22);K.buzz(10);O.sfx('mgGood')}else{s.hp--;K.buzz([60,40,60]);O.sfx('mgBad');K.send(s.hp+':0')}e.preventDefault()})}
   const t=K.now(),dt=Math.max(0,Math.min(.1,t-s.last));s.last=t;if(t<K.g.dur&&K.d.out[K.sl]==null){s.light-=dt*(.075+t*.003);if(s.light<=0){s.hp--;s.light=.6;K.buzz(120);K.send(s.hp+':0')}
     s.spawn-=dt;if(s.spawn<=0){s.spawn=.7-t*.012+s.r()*.3;s.L.push({x:.12+s.r()*.76,y:1.05,v:.22+t*.006+s.r()*.1,warm:s.r()<.45,ph:s.r()*6})}}
   if(K.d.hp[K.sl]>s.hp)s.hp=K.d.hp[K.sl];if(!s.ping||t-s.ping>1){s.ping=t;K.send(s.hp+':0')}s.m.set(s.light);const[x,w,h]=K.fit(s.cv);x.fillStyle='#02060c';x.fillRect(0,0,w,h);
   for(const q of s.L){if(q.gone)continue;q.y-=q.v*dt;if(q.y<-.1){q.gone=1;continue}const fl=q.warm?1:.75+.25*Math.sin(t*20+q.ph);x.fillStyle=q.warm?`rgba(255,${170+Math.round(30*Math.sin(t*3+q.ph))},70,1)`:`rgba(150,${200+Math.round(40*fl)},255,${fl})`;x.beginPath();x.arc(q.x*w,q.y*h,13,0,7);x.fill();
     if(!q.warm){x.strokeStyle='rgba(150,220,255,.4)';x.beginPath();x.moveTo(q.x*w,q.y*h+13);x.quadraticCurveTo(q.x*w+20,q.y*h+40,q.x*w-5,q.y*h+70);x.stroke()}}},
 hint:()=>'Tap the WARM orange lanterns. Never the cold blue ones on a line.'});

/* ===== 34 · The Abyssal Trench · The Deep Signal: copy the pattern of long and short flashes ===== */
O.addMg({id:'signal',dun:16,name:'The Deep Signal',ctl:'Phone: tap short · hold long',
 brief:'Something in the deep flashes a signal of long and short pulses. Answer it: tap for a short pulse, hold for a long one, in the same order. Answer right and it passes you by. Four signals, each a little longer. Answer every one.',
 setup(g){const r=H.rng(g.seed);g.d.sg=[];for(let i=0;i<4;i++){const a=[];for(let k=0;k<3+Math.floor(i/2)+(i>2?1:0);k++)a.push(r()<.4?1:0);g.d.sg.push(a)}g.d.ok={};g.dur=200;this.round(g,0)},
 round(g,i){const d=g.d;d.i=i;d.ph='show';d.pt=+g.t.toFixed(2);d.ans={}},
 showLen(d){return d.sg[d.i].reduce((a,b)=>a+(b?.9:.4)+.35,0)+.5},
 input(g,p,v){const d=g.d;const[i,s]=String(v).split(':');if(+i!==d.i||d.ph!=='input'||d.ans[p.slot]!=null||String(s)[0]==='~')return;d.ans[p.slot]=s;if(s===d.sg[d.i].join('')){d.ok[p.slot]=(d.ok[p.slot]||0)+1;H.ev('mgGood')}else H.ev('mgBad')},
 tick(g){const d=g.d,el=g.t-d.pt;if(d.ph==='show'&&el>this.showLen(d)){d.ph='input';d.pt=+g.t.toFixed(2)}else if(d.ph==='input'&&(here().every(p=>d.ans[p.slot]!=null)||el>2.5+d.sg[d.i].length*.6)){d.ph='gap';d.pt=+g.t.toFixed(2)}else if(d.ph==='gap'&&el>1.2){if(d.i>=3){g.end=1;return}this.round(g,d.i+1)}},
 lit(d,el){let t=.4;for(const b of d.sg[d.i]){const L=b?.9:.4;if(el>=t&&el<t+L)return b?2:1;t+=L+.35}return 0},
 pass:(g,p)=>(g.d.ok[p.slot]||0)>=4,prog:(g,p)=>`${g.d.ok[p.slot]||0}/4 answered`,key:(g,d,sl)=>d.i+d.ph+(d.ans[sl]!=null?1:0),
 tv(K,g){const S=roomTv(K,g,{w:7,d:6});S.spot=(p,i,n)=>K.sides(i,n,-.4);S.cam=[[0,1.6,5],[0,1.4,-2]];const eye=K.glow(.6,.6,.1,'#40c0ff');eye.position.set(0,1.6,-2.4);S.g.add(eye);const L=K.light(S.g,0,1.6,-1.8,'#40c0ff',0);
   S.update=m=>{const on=m.st==='play'&&m.d.ph==='show'?O.MG.signal.lit(m.d,m.t-m.d.pt):0;eye.visible=!!on;L.intensity=on?4:0;eye.scale.x=on===2?2:1};return S},
 hud(x,w,h,g,HK){const d=g.d;HK.txt(x,d.ph==='show'?`Signal ${d.i+1}: watch…`:d.ph==='input'?'Answer it on your phone!':'…',w/2,h*.1,Math.max(22,h*.05),'#40c0ff')},
 pad(K){const d=K.d,s=K.s;if(s.i!==d.i){s.i=d.i;s.v='';s.sent=0}K.x.textContent='';if(d.ph==='show'){K.x.appendChild(K.el('div','mgBig','Watch…'));return}
   if(d.ph!=='input'||s.sent){K.x.appendChild(K.el('div','mgBig',d.ans[K.sl]!=null?(d.ans[K.sl]===d.sg[d.i].join('')?'Answered!':'Wrong…'):'…'));return}
   const dots=K.el('div','sigDots');for(let k=0;k<d.sg[d.i].length;k++)dots.appendChild(K.el('i',s.v[k]==null?'':s.v[k]==='1'?'L':'S'));K.x.appendChild(dots);
   const b=K.btn('PULSE','go big',v=>{if(v){s.down=performance.now();K.buzz(10)}else if(s.down){const L=(performance.now()-s.down)/1000>.38?'1':'0';s.down=0;s.v+=L;if(s.v.length>=d.sg[d.i].length){s.sent=1;K.send(d.i+':'+s.v)}else{K.s.r=(K.s.r||0)+1;K.send(d.i+':~'+s.v)}}},true);K.x.appendChild(b)},
 hint:(g,d)=>d.ph==='show'?'Watch the flashes: short and long.':'Tap = short pulse, hold = long pulse.'});

/* ===== 35 · The Blood Cathedral · The Procession: step on every drum beat, kneel when the bell tolls ===== */
O.addMg({id:'procession',dun:17,name:'The Procession',ctl:'Phone: STEP · KNEEL, on the beat',motion:1,mo:'Flick your phone UP to STEP on each drum beat; dip it DOWN to KNEEL when the bell tolls. Watch the ring on the big screen.',live:true,
 brief:'Walk with the faithful. Press STEP on every drum beat, and KNEEL instead when the bell tolls. The tempo shifts. Steps off the beat, missed beats and the wrong move all draw eyes: four missteps and they see you for what you are.',
 setup(g){const r=H.rng(g.seed);g.d.bt=[];let t=1.6,iv=.82;for(let i=0;i<26;i++){g.d.bt.push([+t.toFixed(2),i>3&&r()<.22?1:0]);if(i===9||i===18)iv=r()<.5?iv*.82:iv*1.12;t+=iv;iv=Math.max(.48,iv-.008)}g.dur=t+.8;g.d.ms={}},
 input(g,p,v){g.d.ms[p.slot]=num(+v)},
 pass:(g,p)=>g.d.ms[p.slot]!=null&&g.d.ms[p.slot]<=3,prog:(g,p)=>`${g.d.ms[p.slot]||0} missteps`,
 tv(K,g){const S=roomTv(K,g,{w:7,d:6,h:3.8});S.walk=1;const bell=K.vb(P2=>{for(let y=0;y<6;y++){const r=y<2?1:y<4?2:3;for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)if(Math.abs(x)===r||Math.abs(z)===r||y===5)P2.set(x,5-y,z,'g')}},.1,K.pal());bell.position.set(0,2.3,-2);S.g.add(bell);
   S.update=m=>{const t=m.t,b=m.d.bt.find(q=>q[0]>t-.15);bell.rotation.z=b&&b[1]&&Math.abs(b[0]-t)<.3?Math.sin(K.now()*20)*.3:0};return S},
 hud(x,w,h,g,HK){const b=g.d.bt.find(q=>q[0]>g.t-.1);if(!b)return;const u=clamp(1-(b[0]-g.t)/.8,0,1);x.strokeStyle=b[1]?'#ffc060':'#ff5a2a';x.lineWidth=6;x.beginPath();x.arc(w/2,h*.16,20+(1-u)*60,0,7);x.stroke();x.fillStyle=b[1]?'#ffc060':'#ff5a2a';x.beginPath();x.arc(w/2,h*.16,18,0,7);x.fill();HK.txt(x,b[1]?'KNEEL':'STEP',w/2,h*.16+40,20)},
 pad(K){const d=K.d,s=K.s;if(K.first){s.done={};s.ms=0;s.ring=K.el('div','mgRing');s.ring.id='procRing';s.ring.appendChild(K.el('i'));
     const press=k=>()=>{const t=K.now(),i=d.bt.findIndex((q,j)=>!s.done[j]&&Math.abs(q[0]-t)<.2);if(i<0){s.ms++;K.buzz(80);O.sfx('mgBad')}else{s.done[i]=1;if(d.bt[i][1]!==k){s.ms++;K.buzz(80);O.sfx('mgBad')}else{K.buzz(12);O.sfx('mgTap')}}K.send(String(s.ms))};
     K.x.append(s.ring,K.row(2,K.btn('STEP','go big',press(0)),K.btn('KNEEL','go big duck',press(1))));K.jolt(dr=>{if(dr==='up')press(0)();else if(dr==='down')press(1)()})}
   const t=K.now();d.bt.forEach((q,j)=>{if(!s.done[j]&&t>q[0]+.22){s.done[j]=1;s.ms++;K.send(String(s.ms))}});if(!s.ping||t-s.ping>1){s.ping=t;K.send(String(s.ms))}const b=d.bt.find(q=>q[0]>t-.15),u=b?clamp((b[0]-t)/.8,0,1):1;s.ring.firstChild.style.transform='scale('+(.35+u*1.4)+')';s.ring.classList.toggle('hot',u<.15);s.ring.classList.toggle('bell',!!b&&!!b[1])},
 hint:()=>O.motionOn&&O.motionOn()?'Watch the ring on the big screen: flick up to STEP as it closes, dip down to KNEEL when it is gold.':'STEP as the ring closes. KNEEL instead when it is gold (the bell).'});

/* ===== 36 · The Blood Cathedral · The Pews: sneak to the altar; pray when the lantern swings your way ===== */
O.addMg({id:'pews',dun:17,name:'The Pews',ctl:'Phone: hold SNEAK · hold PRAY',live:true,
 brief:'Sneak along the pews to the altar. Hold SNEAK to creep forward. When the priest’s lantern swings toward the pews (it glows first), stop and hold PRAY until it passes. Moving in the light, or standing there not praying, and you are seen. Reach the altar seen twice or fewer.',
 setup(g){const r=H.rng(g.seed);g.d.lt=[];let t=2;while(t<32){const f=t/32,len=+(1.2+r()*1.2).toFixed(2);g.d.lt.push([+(t-.8).toFixed(2),+t.toFixed(2),+(t+len).toFixed(2)]);t+=len+1.2+r()*2.2-1*f}g.dur=34;g.d.pos={};g.d.st={};g.d.seen={};g.cool={};for(const p of here()){g.d.pos[p.slot]=0;g.d.seen[p.slot]=0}},
 input(g,p,v){g.d.st[p.slot]=String(v)},
 lit(g,t){const q=g.d.lt.find(e=>t>=e[0]&&t<e[2]);return q?(t>=q[1]?2:1):0},
 tick(g,dt){const L=this.lit(g,g.t);for(const p of here()){const k=p.slot,st=g.d.st[k]||'0';if(g.d.pos[k]>=100)continue;if(st==='S')g.d.pos[k]=Math.min(100,g.d.pos[k]+dt*10);
     if(L===2&&st!=='P'&&!(g.cool[k]>g.t)){g.d.seen[k]++;g.cool[k]=g.t+1.2;H.ev('mgHit',{slot:k})}}if(here().every(p=>g.d.pos[p.slot]>=100))g.end=1;g.d.L=L},
 pass:(g,p)=>g.d.pos[p.slot]>=100&&g.d.seen[p.slot]<=2,prog:(g,p)=>`${Math.round(g.d.pos[p.slot])}% · seen ${g.d.seen[p.slot]}`,
 tv(K,g){const S=roomTv(K,g,{w:8,d:7,h:4});const pews=[];for(let k=0;k<5;k++){const pw=K.vb(P2=>{P2.box(-12,12,0,3,-1,1,'w');P2.box(-12,12,4,7,1,1,'wd')},.1,K.pal());pw.position.set(.6,0,1.6-k*.8);S.g.add(pw)}
   const lamp=K.glow(.25,.3,.25,'#ffc060');lamp.position.set(-3,1.6,-2.4);S.g.add(lamp);const L=K.light(S.g,-3,1.6,-2.2,'#ffc060',1);
   S.spot=(p,i,n)=>[-1.1+(g.d.pos[p.slot]||0)*.036,(g.d.st[p.slot]==='P'?-.3:0),2.05+i*.25,-Math.PI/2];S.walk=1;S.cam=[[1.6,3.4,5.6],[0,.4,-.4]];
   S.update=m=>{const l=m.d.L||0;L.intensity=l===2?4:l===1?1.8+Math.sin(K.now()*20):.6;lamp.material.color.set(l===2?'#fff0c0':'#ffc060')};return S},
 hud(x,w,h,g,HK){const l=g.d.L||0;if(l)HK.txt(x,l===2?'PRAY!':'The lantern turns…',w/2,h*.1,Math.max(24,h*.055),l===2?'#ff5a2a':'#ffc060')},
 pad(K){const s=K.s;if(K.first){s.m=K.meter();const hold=c=>v=>{K.buzz(v?8:0);K.send(v?c:'0')};K.x.append(s.m,K.row(2,K.btn('SNEAK','go big',hold('S'),true),K.btn('PRAY','go big duck',hold('P'),true)))}s.m.set((K.d.pos[K.sl]||0)/100)},
 hint:(g,d)=>d.L===2?'PRAY! Hold it till the light passes.':d.L===1?'The lantern is turning: get ready to PRAY.':'Hold SNEAK to creep toward the altar.'});

/* ===== 37 · The Dragon's Roost · Gold Grab: grab coins while the dragon sleeps; never while its eye is open ===== */
O.addMg({id:'grab',dun:18,name:'Gold Grab',hearts:true,ctl:'Phone: GRAB',motion:1,mo:'Shake your phone to grab gold, two coins a shake. Freeze the moment the eye opens on the big screen.',
 brief:'The dragon sleeps on its hoard. Tap GRAB as fast as you can to scoop coins. Its eye flickers before it opens: stop at once. Any grab while the eye is open and you are burned. Forty coins and a heart left.',
 setup(g){const r=H.rng(g.seed);g.d.ey=[];let t=2;while(t<26){const f=t/26,warn=+(.75-.3*f).toFixed(2),open=+(1+r()*1.2).toFixed(2);g.d.ey.push([+t.toFixed(2),+(t+warn).toFixed(2),+(t+warn+open).toFixed(2)]);t+=warn+open+1.2+r()*2.4-1*f}g.dur=26;g.d.co={};g.cn={};g.burn={}},
 eye(g,t){const q=g.d.ey.find(e=>t>=e[0]&&t<e[2]);return q?(t>=q[1]?2:1):0},
 input(g,p,v,at){const n=num(+v),k=p.slot;if(g.d.out[k]!=null)return;const d=Math.max(0,Math.min(8,n-(g.cn[k]||0)));g.cn[k]=Math.max(g.cn[k]||0,n);if(!d)return;if(this.eye(g,at-.05)===2){if(!(g.burn[k]>at)){g.burn[k]=at+1;H.hit(g,p)}}else g.d.co[k]=(g.d.co[k]||0)+d},
 tick(g){g.d.E=this.eye(g,g.t)},
 pass:(g,p)=>g.d.out[p.slot]==null&&(g.d.co[p.slot]||0)>=40,prog:(g,p)=>`${g.d.co[p.slot]||0}/40 coins`,key:(g,d)=>d.E,
 tv(K,g){const S=roomTv(K,g,{w:8,d:6,h:3.6});const hoard=K.vb(P2=>{for(let x=-14;x<14;x++)for(let z=-6;z<6;z++){const hh=Math.max(0,4-Math.hypot(x/3,z/1.5));for(let y=0;y<hh;y++)P2.set(x,y,z,K.V.hash(x,y,z)<.3?'ad':'g')}},.1,K.pal());hoard.position.set(0,0,-1.4);S.g.add(hoard);
   let dr=null;try{dr=K.V.build(K.V.monster('dragon'));const bb=new K.T.Box3().setFromObject(dr),s2=1.6/Math.max(.1,bb.max.y-bb.min.y);dr.scale.setScalar(s2*1.5);dr.position.set(0,-bb.min.y*s2*1.5,-2.5);S.g.add(dr)}catch(e){}S.spot=(p,i,n)=>K.sides(i,n,.6);S.cam=[[0,2.2,5.4],[0,1.3,-1.4]];
   const eye=K.glow(.3,.12,.05,'#ffc040');eye.position.set(0,1.9,-1.6);S.g.add(eye);S.update=m=>{const e=m.d.E||0;eye.visible=e>0;eye.material.color.set(e===2?'#ff3a1a':'#ffc040');eye.scale.y=e===1?(Math.sin(K.now()*30)>0?1:.2):1.6};return S},
 hud(x,w,h,g,HK){const e=g.d.E||0;HK.txt(x,e===2?'EYE OPEN: STOP!':e===1?'It stirs…':'GRAB!',w/2,h*.1,Math.max(26,h*.06),e===2?'#ff3a1a':e===1?'#ffc040':'#9dffb0')},
 pad(K){const s=K.s;if(K.first){s.n=0;s.b=K.btn('GRAB','go big',()=>{K.buzz(5);s.n++;K.send(String(s.n))});K.x.append(s.b);K.shake(()=>{K.buzz(5);s.n+=2;K.send(String(s.n))})}s.b.classList.toggle('dim',K.d.E===2);s.b.textContent=K.d.E===2?'STOP!':'GRAB'},
 hint:(g,d)=>d.E===2?'STOP! The eye is open.':d.E===1?'It stirs… stop!':'Grab as fast as you can!'});

/* ===== 38 · The Dragon's Roost · Dragonfire: shelter behind a pillar; two to a pillar; they melt ===== */
O.addMg({id:'dragonfire',dun:18,name:'Dragonfire',hearts:true,ctl:'Phone: five pillars',motion:1,mo:'Tilt your phone left and right to run between the five pillars: level is the middle one.',
 brief:'The dragon draws breath, then sweeps fire across the hall. Get behind one of five pillars, but each pillar shelters only two, and a pillar you hide behind may melt down. Spread out, and move to fresh cover as the pillars fall.',
 setup(g){const r=H.rng(g.seed);g.d.br=[];let t=1.8;for(let i=0;i<10;i++){const f=i/9,warn=+(1.4-.5*f).toFixed(2);g.d.br.push([+t.toFixed(2),+(t+warn).toFixed(2)]);t+=warn+1.3-.4*f+r()*.5}g.dur=t+.5;g.d.ph=[3,3,3,3,3].map(v=>v-(r()<.25?1:0));g.d.at={};g.arr={};here().forEach((p,i)=>g.d.at[p.slot]=-1);g.res=0},
 input(g,p,v,at){const k=Math.floor(num(+v,-1));if(k>=-1&&k<5&&g.d.at[p.slot]!==k){g.d.at[p.slot]=k;g.arr[p.slot]=at}},
 tick(g){while(g.res<g.d.br.length&&g.t>=g.d.br[g.res][1]){for(const p of alive(g)){const k=g.d.at[p.slot];let safe=k>=0&&g.d.ph[k]>0;if(safe){const mates=here().filter(q=>g.d.at[q.slot]===k&&g.d.out[q.slot]==null).sort((a,b)=>(g.arr[a.slot]||0)-(g.arr[b.slot]||0));safe=mates.indexOf(p)<2}if(!safe)H.hit(g,p)}
     {const used=new Set(alive(g).map(p=>g.d.at[p.slot]).filter(k=>k>=0));g.d.ph=g.d.ph.map((v,k)=>used.has(k)&&Math.random()<.45?Math.max(0,v-1):v)}g.res++;H.ev('mgBurst')}if(g.res>=g.d.br.length)g.end=1},
 prog:g=>`${g.res}/${g.d.br.length} breaths`,key:(g,d,sl)=>d.at[sl]+JSON.stringify(d.ph),
 tv(K,g){const S=roomTv(K,g,{w:8,d:6});S.cam=[[0,3,5.8],[0,.6,-.4]];const pl=[];for(let k=0;k<5;k++){const p=K.vb(P2=>{P2.box(-2,1,0,14,-2,1,'l')},.1,K.pal());p.position.set((k-2)*1.4,0,-.6);S.g.add(p);pl.push(p)}
   const fire=K.tile(8,1.8,'#ff5a1a');fire.rotation.x=Math.PI/2;fire.position.set(0,.9,-1.5);S.g.add(fire);
   S.spot=(p,i,n)=>{const k=g.d.at[p.slot];if(k<0)return[slotX(i,n,.6),0,1.6,Math.PI];const m=here().filter(q=>g.d.at[q.slot]===k),j=m.indexOf(p);return[(k-2)*1.4+(j-(m.length-1)/2)*.35,0,-.05,Math.PI]};
   S.update=m=>{pl.forEach((p,k)=>{const h=m.d.ph[k];p.scale.y=Math.max(.02,h/3);p.visible=h>0});const b=m.d.br[m.res],t=m.t;fire.material.opacity=b&&t>=b[0]?.15+.2*Math.sin(K.now()*20):0;const last=m.d.br[m.res-1];if(last&&t-last[1]<.4&&t>=last[1])fire.material.opacity=.8};return S},
 hud(x,w,h,g,HK){const b=g.d.br[g.res];if(b&&g.t>=b[0])HK.txt(x,'It draws breath… TAKE COVER!',w/2,h*.1,Math.max(22,h*.05),'#ff7a3a')},
 pad(K){const d=K.d;if(K.first){K.x.appendChild(K.row(5,...[0,1,2,3,4].map(k=>K.btn('','pillar',()=>{K.buzz(10);K.send(String(k))}))))}
   K.slide(5,d.at[K.sl]!=null&&d.at[K.sl]>=0?d.at[K.sl]:null,k=>{if(d.ph[k]>0){K.buzz(10);K.send(String(k))}});
   K.x.querySelectorAll('.pillar').forEach((b,k)=>{const h=d.ph[k],n=Object.values(d.at).filter(v=>v===k).length;b.textContent=h>0?'▮'.repeat(h)+(n?`\n${n}/2`:''):'melted';b.classList.toggle('on',d.at[K.sl]===k);b.disabled=h<=0})},
 hint:()=>'Get behind a standing pillar. Two to a pillar.'});

/* ===== 39 · The Hollow Throne · The Mirror Court: perform the shadow's dance, mirrored ===== */
const MARW=['▲','▶','▼','◀'];
O.addMg({id:'mirror',dun:19,name:'The Mirror Court',ctl:'Phone: four directions, mirrored',motion:1,mo:'Tip your phone in each direction of your answer (remember: mirrored), coming back to level between moves. Away from you is up, toward you is down.',
 brief:'Your shadow on the throne dances a sequence of moves. Perform it back as its mirror image: its LEFT is your RIGHT, its right your left; up and down stay as they are. One longer each round. One wrong move and the court turns on you. Clear four rounds.',
 setup(g){const r=H.rng(g.seed);g.d.seq=[];for(let i=0;i<10;i++)g.d.seq.push(Math.floor(r()*4));g.dur=200;g.d.cl={};this.round(g,1)},
 round(g,rd){const d=g.d;d.rd=rd;d.len=2+rd;d.on=+(.62-.03*rd).toFixed(2);d.gp=.25;d.ph='show';d.pt=+g.t.toFixed(2);d.done={};d.lim=+(2+.7*d.len).toFixed(1)},
 mir:k=>k===1?3:k===3?1:k,
 input(g,p,v){const d=g.d;if(d.ph!=='input'||d.out[p.slot]!=null||d.done[p.slot])return;const[rd,ds]=String(v).split(':');if(+rd!==d.rd)return;const s=String(ds||'');
   for(let i=0;i<s.length&&i<d.len;i++)if(+s[i]!==this.mir(d.seq[i])){H.knock(g,p);H.ev('mgBad');return}if(s.length>=d.len){d.done[p.slot]=1;d.cl[p.slot]=d.rd;H.ev('boon')}},
 tick(g){const d=g.d,el=g.t-d.pt;if(d.ph==='show'&&el>.4+d.len*(d.on+d.gp)){d.ph='input';d.pt=+g.t.toFixed(2)}
   else if(d.ph==='input'&&(alive(g).every(p=>d.done[p.slot])||el>d.lim)){for(const p of alive(g))if(!d.done[p.slot])H.knock(g,p);if(!alive(g).length||d.rd>=4){g.end=1;return}d.ph='gap';d.pt=+g.t.toFixed(2)}
   else if(d.ph==='gap'&&el>1)this.round(g,d.rd+1)},
 pass:(g,p)=>(g.d.cl[p.slot]||0)>=4,prog:(g,p)=>`round ${g.d.cl[p.slot]||0}/4`,key:(g,d,sl)=>d.rd+d.ph+(d.done[sl]?1:0),
 tv(K,g){const S=roomTv(K,g,{w:7,d:5,h:3.8});S.spot=(p,i,n)=>K.sides(i,n,-.4);const th=K.vb(P2=>{P2.box(-5,4,0,3,-3,2,'w');P2.box(-5,4,4,16,2,2,'w');P2.box(-6,5,17,18,2,2,'a')},.1,K.pal());th.position.set(0,0,-2);S.g.add(th);
   const sh=K.vb(P2=>{P2.box(-2,1,0,4,-1,0,'sl');P2.box(-2,1,5,9,-1,0,'sl');P2.box(-1,0,10,12,-1,0,'sl')},.1,K.pal());sh.position.set(0,.4,-1.5);S.g.add(sh);
   S.update=m=>{const d=m.d,el=m.t-d.pt,st=d.on+d.gp,i=Math.floor((el-.4)/st),on=m.st==='play'&&d.ph==='show'&&i>=0&&i<d.len&&(el-.4)-i*st<d.on,k=on?d.seq[i]:-1;sh.position.x=k===1?.5:k===3?-.5:0;sh.position.y=.4+(k===0?.3:k===2?-.25:0)};return S},
 hud(x,w,h,g,HK){const d=g.d,el=g.t-d.pt,st=d.on+d.gp,i=Math.floor((el-.4)/st),on=d.ph==='show'&&i>=0&&i<d.len&&(el-.4)-i*st<d.on;HK.txt(x,d.ph==='show'?`Round ${d.rd}: the shadow dances`:d.ph==='input'?'Now mirror it!':'…',w/2,h*.1,Math.max(22,h*.05),'#c070ff');
   if(on)HK.txt(x,MARW[d.seq[i]],w/2,h*.3,Math.max(60,h*.14),'#e0d0ff')},
 pad(K){const d=K.d,s=K.s;if(s.rd!==d.rd){s.rd=d.rd;s.v=''}
   const rk=d.ph+':'+d.rd+':'+s.v+':'+(d.done[K.sl]?1:0);if(rk===s.rk&&K.x.firstChild){if(d.ph==='input'&&!d.done[K.sl])K.lean(k=>{K.buzz(10);s.v+=k;K.send(d.rd+':'+s.v)},{on:.5});return}s.rk=rk;K.x.textContent='';const dots=K.el('div','mgDots');for(let i=0;i<d.len;i++)dots.appendChild(K.el('span',null,s.v[i]!=null?MARW[+s.v[i]]:'·'));K.x.appendChild(dots);
   if(d.ph==='show'){K.x.appendChild(K.el('div','mgBig','Watch…'));return}if(d.ph!=='input'||d.done[K.sl])return;K.lean(k=>{K.buzz(10);s.v+=k;K.send(d.rd+':'+s.v)},{on:.5});const pad=K.el('div','dirPad');for(let k=0;k<4;k++)pad.appendChild(K.btn(MARW[k],'dir d'+k,()=>{K.buzz(10);s.v+=k;K.send(d.rd+':'+s.v)}));K.x.appendChild(pad)},
 hint:(g,d)=>d.ph==='show'?'Watch the shadow.':'Mirror it: swap left and right.'});

/* ===== 40 · The Hollow Throne · The Last Gauntlet: three-second trials, one after another, ever faster ===== */
const TRIALS=['MASH!','MATCH!','STOP!','DODGE!','COUNT!','WAIT…','HOLD 1s!'];
O.addMg({id:'gauntlet',dun:19,name:'The Last Gauntlet',ctl:'Phone: a new trial every few seconds',live:true,
 brief:'Eight quick trials from the whole descent, one after another, ever faster: mash, match a symbol, stop a needle, dodge, count, wait, hold. Read the order on your phone and do it at once. Fail one and the trap springs: pass all eight.',
 setup(g){const r=H.rng(g.seed);g.d.tr=[];let t=.5;for(let i=0;i<8;i++){const len=+(3.5-i*.08).toFixed(2);g.d.tr.push([+t.toFixed(2),len,Math.floor(r()*TRIALS.length),Math.floor(r()*1000)]);t+=len+.4}g.dur=t+.5},input:report.input,
 pass:(g,p)=>{const r=(g.d.rp||{})[p.slot];return!!r&&r[0]>=8},prog:(g,p)=>{const r=(g.d.rp||{})[p.slot]||[0,0];return`${r[0]}/${r[1]} passed`},
 tv(K,g){return roomTv(K,g,{w:7,d:5,h:3.8})},
 hud(x,w,h,g,HK){const q=g.d.tr.find(e=>g.t>=e[0]&&g.t<e[0]+e[1]);if(q)HK.txt(x,TRIALS[q[2]],w/2,h*.14,Math.max(40,h*.1),'#e0d0ff');HK.txt(x,`Trial ${Math.min(8,g.d.tr.filter(e=>g.t>=e[0]).length)} of 8`,w/2,h*.24,18)},
 pad(K){const d=K.d,s=K.s,t=K.now();if(K.first){s.ok=0;s.done=0;s.cur=-1}const i=d.tr.findIndex(e=>t>=e[0]&&t<e[0]+e[1]+.3);
   if(i!==s.cur){if(s.cur>=0&&!s.res){const ok=s.judge?s.judge():false;s.res=1;if(ok){s.ok++;O.sfx('mgGood')}else O.sfx('mgBad');s.done++;K.send(s.ok+':'+s.done+':'+(s.done>=8?1:0))}s.cur=i;s.res=0;s.judge=null;K.x.textContent='';if(i<0)return;
     const[t0,len,ty,sd]=d.tr[i],r=H.rng(sd+K.sl*13);K.x.appendChild(K.el('div','mgBig',TRIALS[ty]));
     if(ty===0){s.n=0;const need=8+Math.floor(len);K.x.appendChild(K.btn('MASH '+need,'go big',()=>{s.n++;K.buzz(4)}));s.judge=()=>s.n>=need}
     else if(ty===1){const sy=O.DSYM[19],want=Math.floor(r()*4);K.x.appendChild(K.glyph(sy[want],64));const row=K.row(4);[0,1,2,3].sort(()=>r()-.5).forEach(k=>{const b=K.btn('','rune',()=>{if(s.pick==null){s.pick=k;K.buzz(10)}});b.appendChild(K.glyph(sy[k],44));row.appendChild(b)});s.pick=null;K.x.appendChild(row);s.judge=()=>s.pick===want}
     else if(ty===2){const band=.3+r()*.4;s.h=null;s.t0=t;const bar=K.el('div','mgPin');bar.id='gPin';const bd=K.el('b');bd.style.bottom=((band-.1)*100)+'%';bd.style.height='20%';bar.append(bd,K.el('i'));K.x.append(bar,K.btn('STOP','go big',()=>{if(s.h==null){s.h=s.nd;K.buzz(15)}}));s.band=band;s.judge=()=>s.h!=null&&Math.abs(s.h-band)<=.1}
     else if(ty===3){const side=r()<.5?0:1;s.pick=null;const row=K.row(2,K.btn('◀','big'+(side===0?' glowing':''),()=>{if(s.pick==null)s.pick=0}),K.btn('▶','big'+(side===1?' glowing':''),()=>{if(s.pick==null)s.pick=1}));K.x.append(K.el('p','mgNote','Press the side that is NOT glowing'),row);s.judge=()=>s.pick===1-side}
     else if(ty===4){const n=3+Math.floor(r()*5),cv=K.canvas(150);K.x.appendChild(cv);const cells=[...Array(12).keys()].sort(()=>r()-.5).slice(0,n),pts=cells.map(c=>[((c%4)+.5+(r()-.5)*.4)/4,((Math.floor(c/4))+.5+(r()-.5)*.4)/3]);requestAnimationFrame(()=>{const[x,w,h]=K.fit(cv);x.fillStyle='#120a1a';x.fillRect(0,0,w,h);x.fillStyle='#c070ff';for(const[a,b]of pts){x.beginPath();x.arc(10+a*(w-20),10+b*(h-20),8,0,7);x.fill()}});
       const opts=[n,n+1,n-1].sort(()=>r()-.5);s.pick=null;K.x.appendChild(K.row(3,...opts.map(o=>K.btn(String(o),'go',()=>{if(s.pick==null)s.pick=o}))));s.judge=()=>s.pick===n}
     else if(ty===5){s.bad=0;K.x.appendChild(K.btn('DON’T','go big',()=>{s.bad=1;K.buzz(80)}));s.judge=()=>!s.bad}
     else{s.dn=0;s.held=0;K.x.appendChild(K.btn('HOLD','go big',v=>{if(v)s.dn=performance.now();else if(s.dn){s.held=(performance.now()-s.dn)/1000;s.dn=0}},true));s.judge=()=>Math.abs(s.held-1)<=.3}}
   if(s.cur>=0&&d.tr[s.cur]&&d.tr[s.cur][2]===2&&$q(K.x,'#gPin')){const u=((t-s.t0)/.9)%2,nd=u<1?u:2-u;s.nd=nd;$q(K.x,'#gPin i').style.bottom=((s.h!=null?s.h:nd)*100)+'%'}},
 hint:()=>'Do what the trial says, at once.'});
const $q=(x,sel)=>x.querySelector(sel);
})();
