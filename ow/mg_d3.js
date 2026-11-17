/* Trap mini games for dungeons 11-15: the Iron Keep, Fungal Hollow, Stormspire, the Clockwork Depths, the Ashen Catacombs. */
(()=>{
const O=window.OW,G=O.G,H=O.MGH,{clamp,num,here,alive}=H;
const slotX=(i,n,sp)=>(i-(n-1)/2)*(sp||.8);

/* ===== 21 · The Iron Keep · Shield Wall: raise the shield to the archers' height; roll from the ballista ===== */
const HTS=['High','Mid','Low'];
O.addMg({id:'shieldwall',dun:10,name:'Shield Wall',hearts:true,ctl:'Phone: HIGH · MID · LOW · ROLL',
 brief:'The keep’s archers draw high, middle or low: raise your shield to that height before they loose. When the great ballista winds up, no shield will stop it: ROLL aside. Faster volleys as it goes.',
 setup(g){const r=H.rng(g.seed);g.d.v=[];let t=1.3;for(let i=0;i<26;i++){const f=i/25,warn=+(1.15-.55*f).toFixed(2),ty=i>5&&r()<.18?3:Math.floor(r()*3);g.d.v.push([+t.toFixed(2),+(t+warn).toFixed(2),ty]);t+=warn+.75-.35*f}g.dur=t+.5;g.d.sh={};g.d.roll={};g.n={};for(const p of here())g.d.sh[p.slot]=1;g.res=0},
 input(g,p,v,at){const[n,k]=String(v).split(':').map(Number);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;if(k===3)g.d.roll[p.slot]=+at.toFixed(2);else if(k>=0&&k<3)g.d.sh[p.slot]=k},
 tick(g){while(g.res<g.d.v.length&&g.t>=g.d.v[g.res][1]){const[,t1,ty]=g.d.v[g.res];for(const p of alive(g)){const rl=g.d.roll[p.slot],rolling=rl!=null&&t1-rl>=-.05&&t1-rl<=.7;if(ty===3?!rolling:(g.d.sh[p.slot]!==ty||rolling))H.hit(g,p)}g.res++;H.ev('kick')}if(g.res>=g.d.v.length)g.end=1},
 prog:g=>`${g.res}/${g.d.v.length} volleys`,key:(g,d,sl)=>d.sh[sl],
 tv(K,g){const G2=K.room({w:8,d:7}),T=K.T,arch=[];for(let k=0;k<3;k++){const a=K.vb(P2=>{P2.box(-2,1,0,9,-2,1,'i');P2.box(-2,1,10,13,-2,1,'l');P2.box(2,3,6+(2-k)*2,7+(2-k)*2,-1,0,'ad')},.1,K.pal());a.position.set((k-1)*1.6,[1.4,.7,0][k],-3);G2.add(a);arch.push(a)}
   const bal=K.vb(P2=>{P2.box(-6,5,0,3,-3,2,'w');P2.box(-1,0,4,5,-12,3,'i');P2.box(-7,6,5,5,-1,0,'w')},.1,K.pal());bal.position.set(2.8,0,-2.8);G2.add(bal);const glow=[0,1,2].map(k=>{const t=K.tile(5,.6,'#ff3a1a');t.rotation.x=Math.PI/2;t.position.set(0,[1.5,.9,.3][k],-1);G2.add(t);return t});
   return{g:G2,cam:[[0,1.8,5.4],[0,1,-1.4]],spot:(p,i,n)=>{const rl=g.d.roll[p.slot],r=g.st==='play'&&rl!=null&&g.t-rl>=0&&g.t-rl<.7;return[slotX(i,n,.8)+(r?.6:0),r?-.3:0,1,Math.PI]},
   update(m){const t=m.st==='play'?m.t:-9,v=m.d.v[m.res],on=v&&t>=v[0];glow.forEach((q,k)=>q.material.opacity=on&&v[2]===k?.25+.15*Math.sin(K.now()*24):0);bal.rotation.y=on&&v[2]===3?Math.sin(K.now()*30)*.05:0}}},
 hud(x,w,h,g,HK){const v=g.d.v[g.res];if(v&&g.t>=v[0])HK.txt(x,v[2]===3?'BALLISTA: ROLL!':'Shield '+HTS[v[2]].toUpperCase(),w/2,h*.1,Math.max(24,h*.055),v[2]===3?'#ff7a6a':'#ffd27a')},
 pad(K){if(K.first){const s=K.s,go=k=>()=>{K.buzz(k===3?30:10);s.n=(s.n||0)+1;K.send(s.n+':'+k)};const col=K.el('div','shCol');HTS.forEach((n,k)=>col.appendChild(K.btn(n,'ht',go(k))));K.x.append(col,K.btn('ROLL','go',go(3)))}
   K.x.querySelectorAll('.ht').forEach((b,k)=>b.classList.toggle('on',k===K.d.sh[K.sl]))},
 hint:()=>'Raise your shield to the glowing height. ROLL from the ballista.'});

/* ===== 22 · The Iron Keep · Portcullis Run: commit to a dash under each slamming gate ===== */
O.addMg({id:'portcullis',dun:10,name:'Portcullis Run',ctl:'Phone: DASH',live:true,
 brief:'Eight portcullises, each slamming on its own rhythm, and some fake a drop. DASH under the next one when you judge the gap: a dash cannot be stopped. Get caught and you are knocked back a moment. Through all eight in time.',
 setup(g){const r=H.rng(g.seed);g.d.gt=[];for(let i=0;i<8;i++)g.d.gt.push([+(1.6+r()*.8-i*.05).toFixed(2),+(.5+r()*.12-i*.015).toFixed(2),+(r()).toFixed(2),i>2&&r()<.5?1:0]);g.dur=32;g.d.at={};g.d.dash={};g.d.stun={};for(const p of here())g.d.at[p.slot]=0;g.n={}},
 open(g,i,t){if(i>=8)return true;const[pr,op,ph,fk]=g.d.gt[i],u=((t/pr+ph)%1+1)%1;if(fk&&u>op&&u<op+.12)return true;return u<op},
 lift(g,i,t){if(i>=8)return 1;const[pr,op,ph,fk]=g.d.gt[i],u=((t/pr+ph)%1+1)%1;if(u<op)return 1;if(fk&&u<op+.18)return u<op+.06?.4:u<op+.12?.55:.2;return u<op+.08?1-(u-op)/.08:u>.92?(u-.92)/.08:0},
 input(g,p,v,at){const n=num(+v);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;const k=p.slot;if(g.d.at[k]>=8||(g.d.dash[k]&&at-g.d.dash[k]<.55)||(g.d.stun[k]&&at-g.d.stun[k]<.9))return;g.d.dash[k]=+at.toFixed(2);
   const i=g.d.at[k];if(this.open(g,i,at+.32)){g.d.at[k]=i+1;H.ev(g.d.at[k]>=8?'boon':'mgTap')}else{g.d.stun[k]=+at.toFixed(2);H.ev('mgHit',{slot:k})}if(here().every(q=>g.d.at[q.slot]>=8))g.end=1},
 pass:(g,p)=>g.d.at[p.slot]>=8,prog:(g,p)=>g.d.at[p.slot]>=8?'through!':`gate ${g.d.at[p.slot]+1}/8`,
 tv(K,g){const G2=K.room({w:4,d:11,sides:true,back:false}),gates=[];for(let i=0;i<8;i++){const gt=K.vb(P2=>{for(let x=-9;x<9;x++)for(let y=0;y<18;y++)if(x%3===0||y%4===0)P2.set(x,y,0,'i');for(let y=-1;y<20;y++)for(const x of[-10,9])P2.set(x,y,0,'w')},.11,K.pal());gt.position.set(0,0,2.6-i*1.05);G2.add(gt);gates.push(gt)}
   return{g:G2,cam:[[1,3,6.4],[0,.5,-1.6]],walk:1,spot:(p,i,n)=>{const a=g.d.at[p.slot];return[slotX(i,n,.4),0,3.1-a*1.05,Math.PI]},
   update(m){const t=m.st==='play'?m.t:0;gates.forEach((q,i)=>q.position.y=O.MG.portcullis.lift(m,i,t)*1.8)}}},
 pad(K){const d=K.d,s=K.s;if(K.first){s.bar=K.el('div','gateBar');s.bar.appendChild(K.el('i'));K.x.append(s.bar,K.btn('DASH','go big',()=>{K.buzz(25);s.n=(s.n||0)+1;K.send(String(s.n))}))}
   const a=d.at[K.sl],l=O.MG.portcullis.lift(K.live(),a,K.now());s.bar.firstChild.style.height=Math.round(l*100)+'%';s.bar.classList.toggle('open',l>.9)},
 hint:(g,d,sl)=>d.at[sl]>=8?'Through! Wait for the others.':`Gate ${d.at[sl]+1} of 8: DASH when it is up.`});

/* ===== 23 · Fungal Hollow · Spore Bloom: one shared patch; pop caps when ripe, never early ===== */
O.addMg({id:'spores',dun:11,name:'Spore Bloom',ctl:'Phone: the shared mushroom patch',live:true,
 brief:'One patch of mushrooms for the whole party. Caps swell, then glow pink when ripe: tap a ripe cap to pop it safely. Pop one early and it spreads spores to its neighbours; leave a ripe cap and it bursts. If the party’s spore meter fills, everyone is caught.',
 setup(g){const r=H.rng(g.seed);g.d.c=[];for(let i=0;i<16;i++)g.d.c.push(+(r()*1-.2).toFixed(2));const n0=Math.max(1,here().length);g.gr=[];for(let i=0;i<16;i++)g.gr.push((.062+r()*.055)*(n0<2?.82:.6+.4*n0));g.n0=n0;g.r=r;g.dur=30;g.d.sp=0;g.n={}},
 input(g,p,v){const[n,k]=String(v).split(':').map(Number);if(n<=(g.n[p.slot]||0)||!(k>=0&&k<16))return;g.n[p.slot]=n;const c=g.d.c;if(c[k]>=1){c[k]=-(g.r()*.5);g.gr[k]=(.062+g.r()*.055+g.t*.0025)*(.6+.4*g.n0);H.ev('mgGood')}else{const nb=[k-4,k+4,k%4?k-1:-1,k%4<3?k+1:-1].filter(j=>j>=0&&j<16);for(const j of nb)c[j]=Math.min(.99,c[j]+.35);c[k]=0;g.d.sp=Math.min(100,g.d.sp+5);H.ev('mgBad')}},
 tick(g,dt){const c=g.d.c;for(let i=0;i<16;i++){c[i]+=g.gr[i]*dt*(1+g.t/40);if(c[i]>=1.38){c[i]=-(g.r()*.5);g.d.sp=Math.min(100,g.d.sp+20);H.ev('mgBurst');if(g.d.sp>=100){g.d.lost=1;g.end=1}}}g.d.c=c.map(v=>+v.toFixed(3));g.d.sp=Math.max(0,g.d.sp-dt*1);if(g.d.sp>=100){g.d.lost=1;g.end=1}},
 pass:g=>!g.d.lost,prog:g=>`spores ${Math.round(g.d.sp)}%`,
 tv(K,g){const G2=K.room({w:6,d:5}),caps=[];for(let i=0;i<16;i++){const x=(i%4-1.5)*.9,z=(Math.floor(i/4)-1.5)*.8,stem=K.vb(P2=>{P2.box(-1,0,0,3,-1,0,'b')},.08,Object.assign(K.pal(),{b:{c:'#e8d8c8',n:.05}}));stem.position.set(x,0,z);G2.add(stem);
     const cap=new K.T.Mesh(new K.T.SphereGeometry(.24,10,6,0,Math.PI*2,0,Math.PI/2),new K.T.MeshBasicMaterial({color:K.lin('#5a3a5a')}));cap.position.set(x,.28,z);G2.add(cap);caps.push(cap)}
   return{g:G2,cam:[[0,4,3.8],[0,0,0]],spot:(p,i,n)=>{const s=i%2?1:-1;return[s*(2.35+Math.floor(i/2)*.5),0,.2,s>0?-Math.PI/2:Math.PI/2]},
   update(m){m.d.c.forEach((v,i)=>{v=Math.max(0,v);const r=v>=1;caps[i].scale.setScalar(.6+Math.min(1,v)*.6+(r?Math.sin(K.now()*20)*.05:0));caps[i].material.color.copy(K.lin(r?'#ff70e0':v>.6?'#a050a0':'#5a3a5a'))})}}},
 hud(x,w,h,g,HK){HK.txt(x,'SPORES',w*.06,h*.12,16,'#e080ff','left');HK.bar(x,w*.06,h*.15,w*.22,14,g.d.sp/100,g.d.sp>70?'#ff5a4a':'#e080ff')},
 pad(K){const d=K.d,s=K.s;if(K.first){s.gr=K.el('div','mgGrid g4');for(let k=0;k<16;k++)s.gr.appendChild(K.btn('','cap',()=>{K.buzz(10);s.n=(s.n||0)+1;K.send(s.n+':'+k)}));K.x.appendChild(s.gr)}
   [...s.gr.children].forEach((b,k)=>{const v=Math.max(0,d.c[k]);b.className='btn mgB cap '+(v>=1?'ripe':v>.6?'swell':'bud');b.style.setProperty('--sz',Math.round(30+Math.min(1,v)*50)+'%')})},
 hint:()=>'Tap only the caps that glow PINK.'});

/* ===== 24 · Fungal Hollow · Mycelium Maze: find the exit before the fungus creeping behind you catches up ===== */
const MZ=9;
function maze(seed){const r=H.rng(seed),W=Array(MZ*MZ).fill(15),seen=new Set([0]),st=[0];while(st.length){const c=st[st.length-1],x=c%MZ,y=Math.floor(c/MZ),nb=[[x,y-1,0,2],[x+1,y,1,3],[x,y+1,2,0],[x-1,y,3,1]].filter(([a,b])=>a>=0&&b>=0&&a<MZ&&b<MZ&&!seen.has(b*MZ+a));
  if(!nb.length){st.pop();continue}const[a,b,w1,w2]=nb[Math.floor(r()*nb.length)],n=b*MZ+a;W[c]&=~(1<<w1);W[n]&=~(1<<w2);seen.add(n);st.push(n)}return W}
function bfs(W,from){const D=Array(MZ*MZ).fill(1e9);D[from]=0;const q=[from];while(q.length){const c=q.shift(),x=c%MZ,y=Math.floor(c/MZ);[[0,x,y-1],[1,x+1,y],[2,x,y+1],[3,x-1,y]].forEach(([w,a,b])=>{if(W[c]&(1<<w))return;const n=b*MZ+a;if(D[n]>D[c]+1){D[n]=D[c]+1;q.push(n)}})}return D}
O.addMg({id:'maze',dun:11,name:'Mycelium Maze',ctl:'Phone: arrows, or tilt the phone',live:true,motion:1,mo:'Tilt your phone to roll through the maze, one step at a time. Hold it comfortably when the game starts: that is level.',
 brief:'Each of you has a maze of glowing threads on the big screen, and the fungus is growing after you from the entrance. Find the exit in the far corner before it catches you.',
 setup(g){g.dur=40;g.d.pos={};g.d.res={};g.d.seed=(g.seed%100000)+7},
 input(g,p,v){const[pos,res,cell]=String(v).split(':').map(Number);g.d.pos[p.slot]=pos;if(isFinite(cell))(g.d.cell=g.d.cell||{})[p.slot]=clamp(Math.floor(cell),0,MZ*MZ-1);if(res)g.d.res[p.slot]=res;if(here().every(q=>g.d.res[q.slot]))g.end=1},
 pass:(g,p)=>g.d.res[p.slot]===1,prog:(g,p)=>g.d.res[p.slot]===1?'out!':g.d.res[p.slot]===2?'caught':`${g.d.pos[p.slot]||0}% of the way`,
 tv(K,g){const G2=K.room({w:7,d:5}),T=K.T;const vine=[];for(let k=0;k<20;k++){const v=K.vb(P2=>{for(let y=0;y<10+(k*7)%8;y++)P2.set((y*3+k)%3-1,y,0,'a')},.1,K.pal());v.position.set(-3.2+k*.34,0,-2.2);G2.add(v);vine.push(v)}
   return{g:G2,cam:[[0,1.8,5],[0,1,-1]],walk:1,spot:(p,i,n)=>[slotX(i,n,1),0,.6-(g.d.pos[p.slot]||0)/100*2.2,Math.PI],update(m){vine.forEach((v,k)=>v.scale.y=.5+Math.min(1,m.t/30)*.8+Math.sin(K.now()*2+k)*.05)}}},
 /* every fighter's maze in their own view: the threads, the fungus creeping from the entrance, the exit, and where they are */
 hud(x,w,h,g,HK){if(!g.mz)g.mz={W:maze(g.d.seed),F:null};if(!g.mz.F)g.mz.F=bfs(g.mz.W,0);const W=g.mz.W,F=g.mz.F,creep=(g.t-4);
   HK.split(x,w,h,(x,X,Y,PW,PH,p)=>{const c=Math.min(PW,PH)/MZ,ox=X+(PW-c*MZ)/2,oy=Y+(PH-c*MZ)/2;x.fillStyle='#140c14';x.fillRect(ox,oy,c*MZ,c*MZ);
     for(let i=0;i<MZ*MZ;i++){const a=i%MZ,b=Math.floor(i/MZ),Xa=ox+a*c,Yb=oy+b*c;if(F[i]<creep){x.fillStyle='rgba(224,128,255,.45)';x.fillRect(Xa,Yb,c,c)}x.strokeStyle='#e080ff';x.lineWidth=Math.max(1.5,c*.08);x.beginPath();if(W[i]&1){x.moveTo(Xa,Yb);x.lineTo(Xa+c,Yb)}if(W[i]&2){x.moveTo(Xa+c,Yb);x.lineTo(Xa+c,Yb+c)}if(W[i]&4){x.moveTo(Xa,Yb+c);x.lineTo(Xa+c,Yb+c)}if(W[i]&8){x.moveTo(Xa,Yb);x.lineTo(Xa,Yb+c)}x.stroke()}
     x.fillStyle='#9dffb0';x.fillRect(ox+(MZ-1)*c+c*.2,oy+(MZ-1)*c+c*.2,c*.6,c*.6);const at=(g.d.cell||{})[p.slot]||0,r=g.d.res[p.slot];x.fillStyle=HK.LANES[p.slot];x.beginPath();x.arc(ox+(at%MZ+.5)*c,oy+(Math.floor(at/MZ)+.5)*c,c*.34,0,7);x.fill();
     if(r)HK.txt(x,r===1?'Out!':'Caught!',X+PW/2,Y+PH/2,Math.max(22,PH*.12),r===1?'#9dffb0':'#ff7a6a')},{maxW:w*.36,top:.14,maxH:h*.7})},
 pad(K){const s=K.s;if(K.first){s.W=maze(K.d.seed);s.D=bfs(s.W,MZ*MZ-1);s.F=bfs(s.W,0);s.at=0;s.res=0;s.cv=K.canvas(110);
     const mv=w=>()=>{if(s.res)return;const c=s.at,x=c%MZ,y=Math.floor(c/MZ);if(s.W[c]&(1<<w)){K.buzz(40);return}s.at=[c-MZ,c+1,c+MZ,c-1][w];K.buzz(6);if(s.at===MZ*MZ-1){s.res=1;O.sfx('mgGood')}send()};
     const send=()=>K.send(Math.round((1-s.D[s.at]/s.D[0])*100)+':'+s.res+':'+s.at);const pad=K.el('div','dirPad small');['▲','▶','▼','◀'].forEach((a,k)=>pad.appendChild(K.btn(a,'dir d'+k,mv(k))));K.x.append(s.cv,pad);s.send=send;s.mv=mv;s.mo=O.motionOn&&O.motionOn();if(s.mo){O.motion.calibrate();s.mt=0}}
   /* tilt: lean past a threshold and the dot steps that way, again every fifth of a second while you hold the lean */
   if(s.mo&&!s.res){const tl=O.motion.tilt(),ax=Math.abs(tl.x)>=Math.abs(tl.y),v=ax?tl.x:tl.y,now=performance.now();if(Math.abs(v)>.4){if(now-s.mt>(s.held?210:120)){s.mt=now;s.held=1;s.mv(ax?(v>0?1:3):(v>0?2:0))()}}else s.held=0}
   const t=K.now(),creep=(t-4)/1;if(!s.res&&creep>=1&&s.F[s.at]<creep){s.res=2;O.sfx('mgBad');s.send()}
   {const[x,w,h]=K.fit(s.cv),tl=s.mo?O.motion.tilt():{x:0,y:0},R=Math.min(44,h*.38),cx=s.mo?w*.25:-999,cy=h/2;x.fillStyle='#140c14';x.fillRect(0,0,w,h);if(s.mo){x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=2;x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();x.beginPath();x.arc(cx,cy,R*.4,0,7);x.stroke();x.fillStyle='#ffd27a';x.beginPath();x.arc(cx+clamp(tl.x,-1,1)*R*.8,cy+clamp(tl.y,-1,1)*R*.8,8,0,7);x.fill()}
     const tx=s.mo?w*.66:w/2;x.fillStyle='#e8c05a';x.font='800 18px system-ui';x.textAlign='center';x.fillText(s.res===1?'Out!':s.res===2?'Caught!':'Watch your maze',tx,h/2-6);x.fillStyle='#bfb29a';x.font='600 13px system-ui';x.fillText(s.res?'':'on the big screen',tx,h/2+16);return}
   const[x,w,h]=K.fit(s.cv),c=Math.min(w,h)/MZ,ox=(w-c*MZ)/2;x.fillStyle='#140c14';x.fillRect(0,0,w,h);for(let i=0;i<MZ*MZ;i++){const a=i%MZ,b=Math.floor(i/MZ),X=ox+a*c,Y=b*c;if(s.F[i]<creep){x.fillStyle='rgba(224,128,255,.45)';x.fillRect(X,Y,c,c)}
     x.strokeStyle='#e080ff';x.lineWidth=2;x.beginPath();if(s.W[i]&1){x.moveTo(X,Y);x.lineTo(X+c,Y)}if(s.W[i]&2){x.moveTo(X+c,Y);x.lineTo(X+c,Y+c)}if(s.W[i]&4){x.moveTo(X,Y+c);x.lineTo(X+c,Y+c)}if(s.W[i]&8){x.moveTo(X,Y);x.lineTo(X,Y+c)}x.stroke()}
   x.fillStyle='#9dffb0';x.fillRect(ox+(MZ-1)*c+c*.2,(MZ-1)*c+c*.2,c*.6,c*.6);x.fillStyle=K.LANES[K.sl];x.beginPath();x.arc(ox+(s.at%MZ+.5)*c,(Math.floor(s.at/MZ)+.5)*c,c*.32,0,7);x.fill();
   if(s.mo){const tl=O.motion.tilt(),R=Math.min(26,c*1.4),cx=w-R-6,cy=R+6;x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=2;x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();x.beginPath();x.arc(cx,cy,R*.4,0,7);x.stroke();x.fillStyle='#ffd27a';x.beginPath();x.arc(cx+clamp(tl.x,-1,1)*R*.8,cy+clamp(tl.y,-1,1)*R*.8,5,0,7);x.fill()}
   if(s.res){x.fillStyle=s.res===1?'#9dffb0':'#ff7a6a';x.font='800 28px system-ui';x.textAlign='center';x.fillText(s.res===1?'Out!':'Caught!',w/2,h/2)}},
 hint:()=>O.motionOn&&O.motionOn()?'Watch your maze on the big screen and tilt to roll to the green corner. The pink fungus is chasing you.':'Watch your maze on the big screen and steer with the arrows to the green corner. The pink fungus is chasing you.'});

/* ===== 25 · Stormspire · Lightning Rods: read the charge; lightning takes the most charged rod ===== */
O.addMg({id:'rods',dun:12,name:'Lightning Rods',hearts:true,ctl:'Phone: five rods',live:true,
 brief:'Five rods on the tower top crackle as they charge, and lightning takes the most charged ones. Read the sparks and stand by a rod that will NOT be struck. Later, two rods are struck at once.',
 setup(g){const r=H.rng(g.seed);g.d.s=[];let t=1.4;for(let i=0;i<18;i++){const f=i/17,warn=+(1.1-.55*f).toFixed(2),n=i>7&&r()<.5?2:1,a=[];while(a.length<n){const k=Math.floor(r()*5);if(!a.includes(k))a.push(k)}const base=[0,1,2,3,4].map(k=>a.includes(k)?1:+(.3+r()*.58).toFixed(2));g.d.s.push([+t.toFixed(2),+(t+warn).toFixed(2),a,base]);t+=warn+.9-.35*f}
   g.dur=t+.4;g.d.at={};here().forEach((p,i)=>g.d.at[p.slot]=[2,1,3,0][i%4]);g.res=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<5)g.d.at[p.slot]=k},
 charge(g,k,t){const s=g.d.s[g.res];if(!s||t<s[0])return 0;const u=clamp((t-s[0])/(s[1]-s[0]),0,1);return s[3][k]*u},
 tick(g){while(g.res<g.d.s.length&&g.t>=g.d.s[g.res][1]){const s=g.d.s[g.res];for(const p of alive(g))if(s[2].includes(g.d.at[p.slot]))H.hit(g,p);g.res++;H.ev('mgBolt')}if(g.res>=g.d.s.length)g.end=1},
 prog:g=>`${g.res}/${g.d.s.length} strikes`,key:(g,d,sl)=>d.at[sl],
 tv(K,g){const G2=K.room({w:8,d:5,back:false}),rods=[];for(let k=0;k<5;k++){const rd=K.vb(P2=>{P2.box(0,0,0,16,0,0,'i');P2.box(-1,1,0,0,-1,1,'i');P2.set(0,17,0,'a')},.1,K.pal());rd.position.set((k-2)*1.3,0,-1);G2.add(rd);const sp=K.glow(.18,.18,.18,'#a0c0ff');sp.position.set((k-2)*1.3,1.72,-1);G2.add(sp);
     const bolt=K.glow(.08,3,.08,'#ffffff');bolt.position.set((k-2)*1.3,3.2,-1);bolt.visible=false;G2.add(bolt);rods.push([sp,bolt])}
   return{g:G2,cam:[[0,2.6,5.2],[0,1,-.6]],spot:(p,i,n)=>{const k=g.d.at[p.slot]??2,m=here().filter(q=>g.d.at[q.slot]===k),j=m.indexOf(p);return[(k-2)*1.3+(j-(m.length-1)/2)*.35,0,-.3,0]},
   update(m){const t=m.st==='play'?m.t:-9,last=m.d.s[m.res-1];rods.forEach(([sp,b],k)=>{const c=O.MG.rods.charge(m,k,t);sp.scale.setScalar(.5+c*1.6+(c>.5?Math.sin(K.now()*40+k)*.2*c:0));b.visible=!!last&&t-last[1]<.25&&t>=last[1]&&last[2].includes(k)})}}},
 hud(x,w,h,g,HK){for(let k=0;k<5;k++){const c=O.MG.rods.charge(g,k,g.t);HK.bar(x,w/2+(k-2)*w*.09-w*.035,h*.1,w*.07,10,c,c>.8?'#ffffff':'#a0c0ff')}},
 pad(K){const d=K.d,s=K.s;if(K.first){s.row=K.el('div','rodRow');for(let k=0;k<5;k++)s.row.appendChild(K.btn('','rod',()=>{K.buzz(10);K.send(String(k))}));K.x.appendChild(s.row)}
   const t=K.now();[...s.row.children].forEach((b,k)=>{const c=O.MG.rods.charge(K.live(),k,t);b.style.background=`linear-gradient(to top,rgba(160,192,255,.9) ${Math.round(c*100)}%,#1a1c2a ${Math.round(c*100)}%)`;b.classList.toggle('on',d.at[K.sl]===k)})},
 hint:()=>'Stand by a rod with LITTLE charge. The brightest gets struck.'});

/* ===== 26 · Stormspire · Gale: lean against the gusts to keep your balance ===== */
O.addMg({id:'gale',dun:12,name:'Gale',ctl:'Phone: hold LEAN ◀ or ▶',live:true,
 brief:'The storm leans on you from one side, then the other, in gusts: the flags show which way a moment before. Hold LEAN against the wind to keep your balance needle in the middle. Three stumbles and you are blown off the tower.',
 setup(g){const r=H.rng(g.seed);g.d.gu=[];let t=1,dir=1;while(t<27){const f=t/28,len=+(1.4+r()*1.6).toFixed(2);dir=r()<.6?-dir:dir;g.d.gu.push([+t.toFixed(2),+(t+len).toFixed(2),dir,+(.55+r()*.4+.35*f).toFixed(2)]);t+=len+.25+r()*.6}g.dur=28;g.d.n={};g.d.ln={};g.d.st={};g.vel={};g.inv={};for(const p of here()){g.d.n[p.slot]=0;g.d.st[p.slot]=0;g.vel[p.slot]=0}},
 input(g,p,v){const k=Math.floor(num(+v));g.d.ln[p.slot]=clamp(k,-1,1)},
 wind(g,t){const q=g.d.gu.find(e=>t>=e[0]&&t<e[1]);return q?q[2]*q[3]:0},
 tick(g,dt){const w=this.wind(g,g.t);for(const p of here()){const k=p.slot;if(g.d.st[k]>=3)continue;const v=(g.vel[k]+(w*1.15-(g.d.ln[k]||0)*1.4-g.d.n[k]*.6)*dt*2.4)*.96;g.vel[k]=v;g.d.n[k]=+(g.d.n[k]+v*dt*2).toFixed(3);
     if(Math.abs(g.d.n[k])>=1){if(!(g.inv[k]>g.t)){g.d.st[k]++;g.inv[k]=g.t+1;H.ev('mgHit',{slot:k})}g.d.n[k]=0;g.vel[k]=0}}g.d.fl=g.d.gu.filter(e=>g.t>=e[0]-.7&&g.t<e[1]).map(e=>e[2])[0]||0},
 pass:(g,p)=>g.d.st[p.slot]<3,prog:(g,p)=>`${g.d.st[p.slot]} stumble${g.d.st[p.slot]===1?'':'s'}`,
 tv(K,g){const G2=K.room({w:7,d:4,back:false}),flags=[-1,1].map(s0=>{const f=K.vb(P2=>{P2.box(0,0,0,18,0,0,'i');P2.box(1,6,14,18,0,0,'a')},.1,K.pal());f.position.set(s0*3,0,-1.6);G2.add(f);return f});
   return{g:G2,cam:[[0,2,5],[0,1,-.4]],spot:(p,i,n)=>[slotX(i,n,1)+(g.d.n[p.slot]||0)*.4,0,0,0],update(m){const fl=m.d.fl||0;flags.forEach((f,i)=>{f.rotation.y=fl*.8+Math.sin(K.now()*8)*.1*Math.abs(fl)})}}},
 hud(x,w,h,g,HK){const fl=g.d.fl||0;if(fl)HK.txt(x,fl>0?'WIND → lean ◀':'lean ▶ ← WIND',w/2,h*.1,Math.max(22,h*.05),'#a0c0ff');const ps=HK.players(),bw=Math.min(w*.2,260),bh=Math.max(14,h*.025);ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*(bw+30),Y=h*.18;HK.panel(x,X-bw/2-10,Y-30,bw+20,bh+46,.8);HK.txt(x,O.CLASSES[p.cls].animal,X,Y-14,Math.max(13,h*.024),HK.LANES[p.slot]);
   x.fillStyle='rgba(0,0,0,.6)';x.fillRect(X-bw/2,Y,bw,bh);x.fillStyle='#2a6a3a';x.fillRect(X-bw*.12,Y,bw*.24,bh);x.fillStyle='#fff';x.fillRect(X+(g.d.n[p.slot]||0)*bw/2-4,Y-6,8,bh+12);for(let k=0;k<3;k++)HK.txt(x,k<(g.d.st[p.slot]||0)?'✗':'·',X+(k-1)*18,Y+bh+12,14,k<(g.d.st[p.slot]||0)?'#ff7a6a':'#6a5a4a')})},
 pad(K){const d=K.d,s=K.s;if(K.first){const hold=k=>v=>{K.buzz(v?8:0);K.send(String(v?k:0))};K.x.append(K.el('p','mgNote watchTv','👀 Watch your balance needle on the big screen'),K.row(2,K.btn('◀ LEAN','go big',hold(-1),true),K.btn('LEAN ▶','go big',hold(1),true)))}
   },
 hint:()=>'Watch the big screen. Hold LEAN against the wind (away from the side it blows from).'});

/* ===== 27 · The Clockwork Depths · Gear Teeth: slip through each turning ring's gap ===== */
O.addMg({id:'gears',dun:13,name:'Gear Teeth',ctl:'Phone: SLIP',live:true,
 brief:'Five toothed rings turn around the heart of the machine, each at its own speed and direction. Each has one gap. Press SLIP as the gap passes your notch to get through to the next ring, from the outside in. Miss and you are knocked back a moment. Reach the centre in time.',
 setup(g){const r=H.rng(g.seed);g.d.rg=[];for(let i=0;i<5;i++)g.d.rg.push([+((r()<.5?-1:1)*(1+i*.28+r()*.3)).toFixed(2),+(r()*6.28).toFixed(2)]);g.dur=30;g.d.at={};g.d.bk={};for(const p of here())g.d.at[p.slot]=0;g.n={}},
 gap(g,i,t){const[w,ph]=g.d.rg[i];return((ph+w*t)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)},
 input(g,p,v,at){const n=num(+v);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;const k=p.slot,i=g.d.at[k];if(i>=5||(g.d.bk[k]&&at-g.d.bk[k]<.7))return;const a=this.gap(g,i,at),d0=Math.min(a,Math.PI*2-a);
   if(d0<.42){g.d.at[k]=i+1;H.ev(i+1>=5?'boon':'mgTap')}else{g.d.bk[k]=+at.toFixed(2);H.ev('mgHit',{slot:k})}if(here().every(q=>g.d.at[q.slot]>=5))g.end=1},
 pass:(g,p)=>g.d.at[p.slot]>=5,prog:(g,p)=>g.d.at[p.slot]>=5?'centre!':`ring ${g.d.at[p.slot]+1}/5`,
 tv(K,g){const G2=K.room({w:8,d:7,back:false}),T=K.T,rings=[];for(let i=0;i<5;i++){const R=2.7-i*.5,gr=new T.Group();for(let k=0;k<24;k++){const a=k/24*Math.PI*2;if(Math.min(a,Math.PI*2-a)<.42)continue;const tb=new T.Mesh(new T.BoxGeometry(.22,.16,.18),new T.MeshBasicMaterial({color:K.lin(i%2?'#a08040':'#c8a050')}));tb.position.set(Math.sin(a)*R,.08,Math.cos(a)*R);tb.rotation.y=a;gr.add(tb)}G2.add(gr);rings.push(gr)}
   return{g:G2,cam:[[0,6.8,4.8],[0,0,.6]],spot:(p,i,n)=>{const r=g.d.at[p.slot];const R=r>=5?.3:2.95-r*.5;return[slotX(i,n,.3),0,R,Math.PI]},update(m){const t=m.st==='play'?m.t:0;rings.forEach((r,i)=>r.rotation.y=O.MG.gears.gap(m,i,t))}}},
 pad(K){const d=K.d,s=K.s;if(K.first){K.x.append(K.el('p','mgNote watchTv','👀 Watch your ring on the big screen'),K.btn('SLIP','go big',()=>{K.buzz(15);s.n=(s.n||0)+1;K.send(String(s.n))}))}
   },
 hud(x,w,h,g,HK){HK.split(x,w,h,(x,X,Y,W,H,p)=>{const i=g.d.at[p.slot],cx=X+W/2,cy=Y+H/2,R=Math.min(W,H)*.38;if(i>=5){HK.txt(x,'Centre!',cx,cy,Math.max(22,H*.12),'#9dffb0');return}
   for(let k=i+1;k<5;k++){x.strokeStyle='rgba(200,160,80,.18)';x.lineWidth=3;x.beginPath();x.arc(cx,cy,R*(1-(k-i)*.16),0,7);x.stroke()}
   const a=O.MG.gears.gap(g,i,g.t),bk=g.d.bk[p.slot]&&g.t-g.d.bk[p.slot]<.7;x.strokeStyle=bk?'#ff7a6a':'#c8a050';x.lineWidth=Math.max(10,R*.12);x.beginPath();x.arc(cx,cy,R,Math.PI/2+a+.42,Math.PI/2+a+Math.PI*2-.42);x.stroke();
   x.fillStyle=HK.LANES[p.slot];x.beginPath();x.arc(cx,cy+R,Math.max(8,R*.1),0,7);x.fill();HK.txt(x,`Ring ${i+1} of 5`,cx,cy,Math.max(14,H*.06))},{maxW:w*.3})},
 hint:()=>'Watch the big screen. SLIP when the gap in your ring reaches your dot.'});

/* ===== 28 · The Clockwork Depths · Pendulum Bridge: race across under the clock pendulums ===== */
O.addMg({id:'pendulum',dun:13,name:'Pendulum Bridge',ctl:'Phone: hold to run',live:true,
 brief:'Cross a bridge under six great clock pendulums. Hold the button to run and let go as a blade sweeps across. A hit throws you back to the last post. Get across in time.',
 setup(g){const r=H.rng(g.seed);g.d.bl=[14,28,42,56,70,84].map((x,i)=>[x,+(1.9-i*.12+r()*.12).toFixed(2),+(r()*6.28).toFixed(2)]);g.dur=26;g.d.pos={};g.d.fin={};g.stun={}},
 tick(g,dt){let done=true;for(const p of here()){const k=p.slot,x=g.d.pos[k]||0;if(x>=100)continue;done=false;if((g.stun[k]||0)>0){g.stun[k]-=dt;continue}
     if(String(g.v[p.id]||'').endsWith('1')){let nx=x+16*dt;for(const b of g.d.bl){if(Math.abs(nx-b[0])<2.4&&O.bladeDown(b,g.t)){const back=g.d.bl.filter(q=>q[0]<b[0]).pop();nx=back?back[0]+4:0;g.stun[k]=.9;H.ev('mgHit',{slot:k});break}}
       g.d.pos[k]=+Math.min(100,nx).toFixed(1);if(nx>=100){g.d.fin[k]=+g.t.toFixed(2);H.ev('boon')}}}if(done&&here().length)g.end=1},
 pass:(g,p)=>g.d.fin[p.slot]!=null,prog:(g,p)=>g.d.fin[p.slot]!=null?'across!':`${Math.round(g.d.pos[p.slot]||0)}%`,
 tv(K,g){const G2=new K.T.Group(),P=K.pal();K.addv(G2,K.vb(P2=>{for(let x=-26;x<26;x++)for(let z=-3;z<3;z++)P2.set(x,0,z,(x%3)?'w':'wd')},.2,P)).position.y=-.1;
   for(const s0 of[-1,1])K.addv(G2,K.vb(P2=>{for(let x=-6;x<6;x++)for(let z=-8;z<8;z++)for(let y=0;y<6;y++)P2.set(x,y,z,'s')},.2,P)).position.set(s0*6.4,-1.2,0);
   const bl=g.d.bl.map(b=>{const piv=new K.T.Group();piv.position.set(-4+b[0]*.08,3.2,0);const rod=new K.T.Mesh(new K.T.BoxGeometry(.06,2.4,.06),new K.T.MeshBasicMaterial({color:K.lin('#5a4a2a')}));rod.position.y=-1.2;
     const blade=K.vb(P2=>{for(let x=-5;x<5;x++)for(let y=0;y<3;y++)if(Math.abs(x)<5-y)P2.set(x,-y,0,'il')},.08,P);blade.position.y=-2.5;piv.add(rod,blade);G2.add(piv);return[piv,b]});
   const beam=new K.T.Mesh(new K.T.BoxGeometry(10,.2,.2),new K.T.MeshBasicMaterial({color:K.lin('#6a5a3a')}));beam.position.y=3.25;G2.add(beam);K.light(G2,0,2,2.5,'#ffd060',2.4);
   return{g:G2,cam:[[0,3,8.6],[0,.9,0]],walk:1,spot:(p,i,n)=>[-4.3+((g.d.pos[p.slot]||0)*.086),0,-.4+i*.3,-Math.PI/2],update(m){const t=m.st==='play'?m.t:0;for(const[piv,b]of bl)piv.rotation.z=Math.sin(t*Math.PI*2/b[1]+b[2])*1.15}}},
 pad(K){const d=K.d,s=K.s;if(K.first){const m=K.meter();s.m=m;s.w=K.el('div','mgWarn');K.x.append(m,s.w,K.btn('Hold to run','go big',v=>{K.buzz(v?10:0);s.v=((s.v||'')+(v?'1':'0')).slice(-12);K.send(s.v)},true))}
   const pos=d.pos[K.sl]||0;s.m.set(pos/100);const nx=(d.bl||[]).find(b=>b[0]>pos-2),bad=nx&&O.bladeDown(nx,K.now());s.w.textContent=pos>=100?'Across!':bad?'Blade!':'Clear';s.w.className='mgWarn '+(pos>=100||!bad?'ok':'bad')},
 hint:()=>'Hold to run. Let go when a blade swings across.'});

/* ===== 29 · The Ashen Catacombs · Buried in Ash: dig out whichever side is higher ===== */
O.addMg({id:'ash',dun:14,name:'Buried in Ash',hearts:1,ctl:'Phone: DIG ◀ · DIG ▶',live:true,
 brief:'Ash pours down on both sides of you, faster on one side, then the other. Tap DIG on a side to clear it. If either pile reaches the top, you are buried. Watch the streams: the thicker one is pouring faster.',
 setup(g){const r=H.rng(g.seed);g.d.ps=[];let t=0;while(t<30){const len=+(1.5+r()*2).toFixed(2),f=t/30;g.d.ps.push([+t.toFixed(2),+(1.2+r()*3+f*1.6).toFixed(2),+(1.2+r()*3+f*1.6).toFixed(2)]);t+=len}g.dur=26;g.d.L={};g.d.R={};g.cnt={};for(const p of here()){g.d.L[p.slot]=20;g.d.R[p.slot]=20;g.cnt[p.slot]=[0,0]}},
 input(g,p,v){const[a,b]=String(v).split(',').map(Number),c=g.cnt[p.slot],k=p.slot;const da=Math.max(0,Math.min(6,a-c[0])),db=Math.max(0,Math.min(6,b-c[1]));c[0]=Math.max(c[0],a);c[1]=Math.max(c[1],b);g.d.L[k]=Math.max(0,g.d.L[k]-da*7);g.d.R[k]=Math.max(0,g.d.R[k]-db*7)},
 rate(g,t){const q=g.d.ps.filter(e=>e[0]<=t).pop()||g.d.ps[0];return q},
 tick(g,dt){const q=this.rate(g,g.t);for(const p of alive(g)){const k=p.slot;g.d.L[k]=Math.min(100,g.d.L[k]+q[1]*dt*4.3);g.d.R[k]=Math.min(100,g.d.R[k]+q[2]*dt*4.3);if(g.d.L[k]>=100||g.d.R[k]>=100){H.hit(g,p);g.d.L[k]=40;g.d.R[k]=40}}},
 prog:(g,p)=>`◀ ${Math.round(g.d.L[p.slot])} · ${Math.round(g.d.R[p.slot])} ▶`,
 tv(K,g){const G2=K.room({w:7,d:4}),T=K.T,piles={},str=[-1,1].map(s0=>{const m=new T.Mesh(new T.BoxGeometry(.1,3,.1),new T.MeshBasicMaterial({color:K.lin('#8a8a8a'),transparent:true,opacity:.6}));m.position.set(s0*.7,1.6,0);G2.add(m);return m});
   return{g:G2,cam:[[0,1.8,5],[0,.9,0]],spot:(p,i,n)=>[slotX(i,n,1.8),0,0,0],
   update(m){const q=O.MG.ash.rate(m,m.t),ps=here();str.forEach((s,i)=>{s.scale.x=s.scale.z=.5+q[i+1]*.35});ps.forEach((p,i)=>{let pl=piles[p.slot];if(!pl){pl=[-1,1].map(()=>{const c=new T.Mesh(new T.ConeGeometry(.5,1,8),new T.MeshBasicMaterial({color:K.lin('#7a7a7a')}));G2.add(c);return c});piles[p.slot]=pl}
       [m.d.L[p.slot],m.d.R[p.slot]].forEach((v,j)=>{const c=pl[j];c.scale.y=Math.max(.05,v/100*1.6);c.position.set(slotX(i,ps.length,1.8)+(j?.55:-.55),c.scale.y/2,0)})})}}},
 pad(K){const d=K.d,s=K.s;if(K.first){s.c=[0,0];s.L=K.meter('ashm');s.R=K.meter('ashm');const dig=j=>()=>{K.buzz(6);s.c[j]++;K.send(s.c.join(','))};K.x.append(K.row(2,s.L,s.R),K.row(2,K.btn('DIG ◀','go big',dig(0)),K.btn('DIG ▶','go big',dig(1))))}
   s.L.set((d.L[K.sl]||0)/100);s.R.set((d.R[K.sl]||0)/100)},
 hint:()=>'Dig whichever pile is higher. Neither may reach the top.'});

/* ===== 30 · The Ashen Catacombs · Urn Catch: run under the falling urns; the party covers the shelf together ===== */
O.addMg({id:'urns',dun:14,name:'Urn Catch',ctl:'Phone: five spots under the shelf',
 brief:'Funeral urns wobble on the high shelf, then fall. Run under one to catch it before it shatters and lets out what is inside. Five spots, and the whole party covers them together: if the party breaks four urns, everyone is caught.',
 setup(g){const r=H.rng(g.seed),n=Math.max(1,here().length);g.d.u=[];let t=1.4;while(t<28){const f=t/30,warn=+(1-.5*f).toFixed(2);g.d.u.push([+t.toFixed(2),+(t+warn).toFixed(2),Math.floor(r()*5)]);if(f>.2&&r()<.35+.2*(n>1?1:0))g.d.u.push([+(t+.2).toFixed(2),+(t+.2+warn).toFixed(2),Math.floor(r()*5)]);t+=(warn+.6-.3*f)*(n>1?.85:1)}
   g.dur=t+1;g.d.at={};here().forEach((p,i)=>g.d.at[p.slot]=[2,0,4,1][i%4]);g.d.br=0;g.d.ok=0;g.res=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<5)g.d.at[p.slot]=k},
 tick(g){const u=g.d.u;u.sort((a,b)=>a[1]-b[1]);while(g.res<u.length&&g.t>=u[g.res][1]){const k=u[g.res][2];if(here().some(p=>g.d.at[p.slot]===k)){g.d.ok++;H.ev('mgGood')}else{g.d.br++;H.ev('mgBurst')}g.res++}if(g.res>=u.length)g.end=1},
 pass:g=>g.d.br<4,prog:g=>`${g.d.ok} caught · ${g.d.br} broken`,key:(g,d,sl)=>d.at[sl],
 tv(K,g){const G2=K.room({w:8,d:4,h:3.6}),T=K.T,shelf=K.vb(P2=>{for(let x=-17;x<17;x++)P2.box(x,x,0,0,-2,1,'w')},.15,K.pal());shelf.position.set(0,2.6,-1.6);G2.add(shelf);const pool=[];
   return{g:G2,cam:[[0,2,5.4],[0,1.3,-.8]],spot:(p,i,n)=>{const k=g.d.at[p.slot]??2,m=here().filter(q=>g.d.at[q.slot]===k),j=m.indexOf(p);return[(k-2)*1.2+(j-(m.length-1)/2)*.3,0,-1.1,0]},
   update(m){const t=m.st==='play'?m.t:-9;let i=0;for(const q of m.d.u){if(t<q[0]-.3||t>q[1]+.1)continue;let u=pool[i];if(!u){u=K.vb(P2=>{for(let y=0;y<7;y++){const r=y<2?1:y<5?2:1;for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)P2.set(x,y,z,y===6?'ad':'l')}},.06,K.pal());G2.add(u);pool.push(u)}
       u.visible=true;const f=clamp((t-q[0])/(q[1]-q[0]),0,1),fall=f>.55?(f-.55)/.45:0;u.position.set((q[2]-2)*1.2+(fall?0:Math.sin(K.now()*30)*.04*f),2.75-fall*fall*2.3,-1.4);u.rotation.z=fall?fall*2:Math.sin(K.now()*25)*.12*f;i++}for(;i<pool.length;i++)pool[i].visible=false}}},
 hud(x,w,h,g,HK){HK.txt(x,`Broken: ${g.d.br} of 4`,w*.06,h*.12,18,g.d.br>=3?'#ff7a6a':'#e8d8c0','left')},
 pad(K){if(K.first){K.x.append(K.row(5,...[0,1,2,3,4].map(k=>K.btn(String(k+1),'spot',()=>{K.buzz(10);K.send(String(k))}))))}K.x.querySelectorAll('.spot').forEach((b,k)=>b.classList.toggle('on',k===K.d.at[K.sl]))},
 hint:()=>'Run under the urn that wobbles. Split the shelf with your party.'});
})();
