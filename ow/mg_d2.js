/* Trap mini games for dungeons 6-10: Frostcrypt, the Plague Sewers, the Sunken Temple, the Bone Desert, Gloom Marsh. */
(()=>{
const O=window.OW,G=O.G,H=O.MGH,{clamp,num,here,alive}=H;
const slotX=(i,n,sp)=>(i-(n-1)/2)*(sp||.8);
const ARW=['▲','▶','▼','◀'];
const dirPad=(K)=>{const pad=K.el('div','dirPad');for(let k=0;k<4;k++)pad.appendChild(K.btn(ARW[k],'dir d'+k,()=>{K.buzz(10);K.s.n=(K.s.n||0)+1;K.send(K.s.n+':'+k)}));return pad};

/* ===== 11 · Frostcrypt · Thin Ice: the safe path glows, then fades; cross it from memory ===== */
O.addMg({id:'thinice',dun:5,name:'Thin Ice',hearts:true,ctl:'Phone: four columns',
 brief:'The safe path across the ice glows for a few seconds, then fades. Cross it row by row from memory: press the column of the next safe tile. A wrong step and you fall through and start that crossing again. There are two crossings; the second is longer and shown more briefly.',
 setup(g){const r=H.rng(g.seed),mk=n=>{const a=[Math.floor(r()*4)];for(let i=1;i<n;i++){const c=clamp(a[i-1]+[-1,0,1][Math.floor(r()*3)],0,3);a.push(c===a[i-1]&&r()<.5?clamp(c+(r()<.5?-1:1),0,3):c)}return a};
   g.d.paths=[mk(7),mk(10)];g.d.show=[3.2,2.2];g.d.cr={};g.d.row={};g.d.fall={};g.dur=48;g.d.ph=0;g.d.st=0;for(const p of here()){g.d.cr[p.slot]=0;g.d.row[p.slot]=0}g.n={}},
 input(g,p,v){const[n,c]=String(v).split(':').map(Number);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;const d=g.d,k=p.slot,cr=d.cr[k];if(cr>=2||d.out[k]!=null)return;
   if(g.t<this.showEnd(g,k))return;const path=d.paths[cr],r=d.row[k];if(c===path[r]){d.row[k]++;H.ev('mgTap');if(d.row[k]>=path.length){d.cr[k]++;d.row[k]=0;d.go=d.go||{};d.go[k]=+g.t.toFixed(2);H.ev('boon')}}else{d.row[k]=0;d.fall[k]=+g.t.toFixed(2);H.hit(g,p)}},
 showEnd(g,k){const cr=g.d.cr[k];return cr===0?g.d.show[0]:((g.d.go||{})[k]||0)+g.d.show[1]},
 tick(g){if(here().every(p=>g.d.cr[p.slot]>=2||g.d.out[p.slot]!=null))g.end=1},
 pass:(g,p)=>g.d.cr[p.slot]>=2,prog:(g,p)=>g.d.cr[p.slot]>=2?'across!':`crossing ${g.d.cr[p.slot]+1}: row ${g.d.row[p.slot]}/${g.d.paths[g.d.cr[p.slot]].length}`,
 key:(g,d,sl,t)=>d.cr[sl]+':'+d.row[sl]+':'+(t<O.MG.thinice.showEnd(g,sl)?1:0),
 tv(K,g){const G2=K.room({w:7,d:7}),ice=[];for(let r=0;r<10;r++)for(let c=0;c<4;c++){const m=new K.T.Mesh(new K.T.BoxGeometry(.78,.06,.5),new K.T.MeshBasicMaterial({color:K.lin('#9fd0e8'),transparent:true,opacity:.8}));m.position.set((c-1.5)*.85,.03,1.6-r*.56);m.visible=false;G2.add(m);ice.push(m)}
   return{g:G2,cam:[[0,4.4,4.6],[0,0,-.6]],spot:(p,i,n)=>{const d=g.d,k=p.slot,cr=Math.min(1,d.cr[k]),path=d.paths[cr],r=d.cr[k]>=2?path.length:d.row[k],fell=d.fall[k]!=null&&g.t-d.fall[k]<.6;
     const c=r>0?path[r-1]:1.5;return[(c-1.5)*.85+slotX(i,n,.14),fell?-.5:0,r>0?1.6-(r-1)*.56:2.3,Math.PI]},
   update(m){const ps=here(),k=ps[0]?ps[0].slot:0,cr=Math.min(1,m.d.cr[k]),path=m.d.paths[cr],showing=m.st==='play'&&m.t<O.MG.thinice.showEnd(m,k);
     ice.forEach((q,i)=>{const r=Math.floor(i/4),c=i%4;q.visible=r<path.length;const safe=path[r]===c;q.material.color.copy(K.lin(showing&&safe?'#40ff70':'#3a6a8a'));q.material.opacity=showing&&safe?1:.8})}}},
 hud(x,w,h,g,HK){const k=HK.players()[0];if(k&&g.t<O.MG.thinice.showEnd(g,k.slot))HK.txt(x,'Remember the path!',w/2,h*.1,Math.max(22,h*.05),'#9dffb0');else HK.txt(x,'Cross from memory',w/2,h*.1,Math.max(18,h*.04),'#c8e8ff')},
 pad(K){const d=K.d,sl=K.sl,s=K.s;if(K.first){s.mini=K.el('div','iceRow');K.x.append(s.mini,K.row(4,...[0,1,2,3].map(c=>K.btn(String(c+1),'go',()=>{K.buzz(10);s.n=(s.n||0)+1;K.send(s.n+':'+c)}))))}
   const cr=Math.min(1,d.cr[sl]),path=d.paths[cr];s.mini.textContent=d.cr[sl]>=2?'Across!':`Crossing ${cr+1} of 2 · row ${d.row[sl]+1} of ${path.length}`},
 hint:(g,d,sl,t)=>t<O.MG.thinice.showEnd(g,sl)?'Watch the big screen: memorise the green path!':'Press the column of the next safe tile.'});

/* ===== 12 · Frostcrypt · The Frozen Kings: a king wakes; strike his pose before his eyes open fully ===== */
const POSE=['Arms up','Crouch','Shield'];
O.addMg({id:'kings',dun:5,name:'The Frozen Kings',hearts:true,ctl:'Phone: ARMS UP · CROUCH · SHIELD',
 brief:'Three frozen kings line the crypt. When one wakes, frost gathers on him and his pose shows: arms up, crouched, or shield raised. Strike the same pose before his eyes open, and hold it while he looks. They wake faster, and sometimes two at once in the same pose.',
 setup(g){const r=H.rng(g.seed);g.d.wk=[];let t=1.4,prev=-1;for(let i=0;i<16;i++){const f=i/15,warn=+(1.05-.55*f).toFixed(2),look=1.1,pose=(prev+1+Math.floor(r()*2))%3;prev=pose;const kg=Math.floor(r()*3),two=i>9&&r()<.35;
     g.d.wk.push([+t.toFixed(2),+(t+warn).toFixed(2),+(t+warn+look).toFixed(2),pose,two?[kg,(kg+1)%3]:[kg]]);t+=warn+look+.6-.3*f}g.dur=t+.5;g.d.pose={};g.res=0},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<3)g.d.pose[p.slot]=k},
 tick(g){const w=g.d.wk[g.res];if(!w){g.end=1;return}if(g.t>=w[1]&&!g.chk1){g.chk1=1;for(const p of alive(g))if(g.d.pose[p.slot]!==w[3]){H.hit(g,p);g.bad=g.bad||{};g.bad[p.slot]=1}}
   if(g.t>=w[2]){if(g.chk1)for(const p of alive(g))if(g.d.pose[p.slot]!==w[3]&&!(g.bad||{})[p.slot])H.hit(g,p);g.chk1=0;g.bad={};g.res++}},
 prog:g=>`${g.res}/${g.d.wk.length} wakings`,key:(g,d,sl)=>d.pose[sl],
 tv(K,g){const G2=K.room({w:7,d:5,h:3.6}),kings=[];for(let k=0;k<3;k++){const st=K.vb(P2=>{P2.box(-3,2,0,9,-2,1,'l');P2.box(-2,1,10,14,-2,1,'l');P2.box(-3,2,15,15,-2,1,'g');P2.set(-2,16,0,'g');P2.set(1,16,0,'g');P2.set(-1,13,2,'d');P2.set(0,13,2,'d')},.1,Object.assign(K.pal(),{l:{c:'#c8dce8',n:.06},g:{c:'#d8c070',n:.05}}));
     st.position.set((k-1)*2,0,-1.9);G2.add(st);const eyes=K.glow(.3,.06,.04,'#7fc8ff');eyes.position.set((k-1)*2,1.32,-1.68);G2.add(eyes);const fr=K.tile(1,.01,'#7fc8ff');fr.rotation.x=Math.PI/2;fr.scale.set(1,1,1);fr.position.set((k-1)*2,.9,-1.66);
     const sp=K.sym('crown',.5);sp.position.set((k-1)*2,2.05,-1.6);sp.visible=false;G2.add(fr,sp);kings.push([eyes,fr,sp])}
   const icons=['crown','skull','shield'];
   return{g:G2,cam:[[0,2.1,5.2],[0,1.1,-1.2]],spot:(p,i,n)=>{const ps=g.d.pose[p.slot];return[slotX(i,n,.8),ps===1?-.3:0,.8,Math.PI]},
   update(m){const t=m.st==='play'?m.t:-9,w=m.d.wk[m.res];kings.forEach(([e,f,sp],k)=>{const on=w&&w[4].includes(k)&&t>=w[0],open=on&&t>=w[1];e.material.color.set(open?'#ffffff':'#1a3a50');e.scale.x=open?1.4:1;f.material.opacity=on&&!open?.35+.2*Math.sin(K.now()*20):0;
       sp.visible=!!on;if(on&&sp.userData.p!==w[3]){sp.userData.p=w[3];sp.material.map=null;const s2=K.sym(icons[w[3]],.5);sp.material=s2.material}})}}},
 hud(x,w,h,g,HK){const wk=g.d.wk[g.res];if(wk&&g.t>=wk[0])HK.txt(x,(g.t>=wk[1]?'HOLD IT: ':'Strike the pose: ')+POSE[wk[3]].toUpperCase(),w/2,h*.1,Math.max(22,h*.05),'#c8e8ff')},
 pad(K){if(K.first){const ic=['crown','skull','shield'];K.x.append(K.row(3,...POSE.map((n,k)=>{const b=K.btn('','pose',()=>{K.buzz(12);K.send(String(k))});b.append(K.glyph(ic[k],48),K.el('small',null,n));return b})))}
   K.x.querySelectorAll('.pose').forEach((b,k)=>b.classList.toggle('on',k===K.d.pose[K.sl]))},
 hint:()=>'Strike the pose shown above the waking king, and hold it while his eyes are open.'});

/* ===== 13 · The Plague Sewers · Rat Tide: your pipes rumble in your colour; slam the grate in time ===== */
O.addMg({id:'rats',dun:6,name:'Rat Tide',ctl:'Phone: your four pipes',
 brief:'Four pipes, and the rats are coming. A pipe rumbles and glows in your colour before a rat bursts out at you: slam its grate while it rumbles. Too early and the grate lifts again; too late and you are bitten. Later, two pipes go at once. Two bites or fewer.',
 setup(g){g.dur=30;g.d.r={};g.d.bit={};g.d.sl={};for(const p of here()){const r=H.rng(g.seed+p.slot*131),a=[];let t=1.5;while(t<28.5){const f=t/30,warn=+(1.05-.47*f).toFixed(2);a.push([+t.toFixed(2),+(t+warn).toFixed(2),Math.floor(r()*4)]);if(f>.35&&r()<.45){a.push([+(t+.15).toFixed(2),+(t+.15+warn).toFixed(2),Math.floor(r()*4)])}t+=warn+1.1-.55*f+r()*.4}
   g.d.r[p.slot]=a;g.d.bit[p.slot]=0;g.d.sl[p.slot]=[-9,-9,-9,-9]}g.res={};g.n={}},
 input(g,p,v,at){const[n,k]=String(v).split(':').map(Number);if(n<=(g.n[p.slot]||0)||!(k>=0&&k<4))return;g.n[p.slot]=n;g.d.sl[p.slot][k]=+at.toFixed(2);H.ev('mgTap')},
 tick(g){for(const p of here()){const a=g.d.r[p.slot]||[];let i=g.res[p.slot]||0;while(i<a.length&&g.t>=a[i][1]){const[t0,t1,k]=a[i],ts=g.d.sl[p.slot][k];if(!(ts>=t0-.1&&ts<=t1+.05)){g.d.bit[p.slot]++;H.ev('mgHit',{slot:p.slot})}i++}g.res[p.slot]=i}},
 pass:(g,p)=>g.d.bit[p.slot]<=2,prog:(g,p)=>`${g.d.bit[p.slot]} bite${g.d.bit[p.slot]===1?'':'s'}`,
 tv(K,g){const G2=K.room({w:7,d:5}),pipes=[];for(let k=0;k<4;k++){const x=(k-1.5)*1.5,pp=K.vb(P2=>{for(let a=-4;a<4;a++)for(let b=-4;b<4;b++)if(Math.hypot(a+.5,b+.5)<4){P2.set(a,b,0,Math.hypot(a+.5,b+.5)>3?'i':'sl')}},.1,K.pal());pp.position.set(x,1.1,-2.1);G2.add(pp);
     const gl=K.glow(.7,.7,.02,'#ffffff');gl.position.set(x,1.1,-2.0);gl.material.transparent=true;gl.material.opacity=0;G2.add(gl);pipes.push(gl)}
   return{g:G2,cam:[[0,1.9,5],[0,1,-1.2]],spot:(p,i,n)=>[slotX(i,n,.8),0,.9,Math.PI],
   update(m){const t=m.st==='play'?m.t:-9;pipes.forEach(q=>{q.material.opacity=0});for(const p of here()){const a=m.d.r[p.slot]||[];for(const q of a){if(t>=q[0]&&t<q[1]){const gl=pipes[q[2]];gl.material.color.set(K.LANES[p.slot]);gl.material.opacity=.35+.3*Math.sin(K.now()*30)}}}}}},
 pad(K){if(K.first){const gr=K.el('div','mgGrid');for(let k=0;k<4;k++){const b=K.btn('','pipe',()=>{K.buzz(15);K.s.n=(K.s.n||0)+1;K.send(K.s.n+':'+k)});b.appendChild(K.glyph('rat',64,'#e8d8c8'));gr.appendChild(b)}K.x.appendChild(gr)}},
 hint:()=>'Slam the pipe that glows in YOUR colour on the big screen.'});

/* ===== 14 · The Plague Sewers · Miasma: hold your breath while the gas passes; your lungs only hold so long ===== */
O.addMg({id:'miasma',dun:6,name:'Miasma',hearts:true,ctl:'Phone: hold to hold your breath',live:true,
 brief:'Clouds of sickness roll down the tunnel. Hold the button to hold your breath while a cloud is on you, and let go to breathe in the clean air between. Your lungs only hold for a few seconds, and the clouds get longer.',
 setup(g){const r=H.rng(g.seed);g.d.cl=[];let t=1.6;while(t<30){const f=t/32,len=+Math.min(2.8,1+r()*(.8+1.6*f)).toFixed(2),gap=+(Math.max(1,2.2-1.1*f)+r()*.5).toFixed(2);g.d.cl.push([+t.toFixed(2),+(t+len).toFixed(2)]);t+=len+gap}g.dur=t+.5;g.d.lung={};g.d.hold={};g.cough={};for(const p of here())g.d.lung[p.slot]=1},
 input(g,p,v){g.d.hold[p.slot]=String(v).endsWith('1')},
 tick(g,dt){const c=g.d.cl.findIndex(q=>g.t>=q[0]&&g.t<q[1]);for(const p of alive(g)){const k=p.slot;let h=g.d.hold[k];if(h){g.d.lung[k]=Math.max(0,g.d.lung[k]-dt/3.4);if(g.d.lung[k]<=0)h=false}else g.d.lung[k]=Math.min(1,g.d.lung[k]+dt*1.05);
     if(c>=0&&!h&&g.cough[k]!==c){g.cough[k]=c;H.hit(g,p)}}if(g.t>g.dur-.4)g.end=1},
 prog:(g,p)=>`lungs ${Math.round((g.d.lung[p.slot]||0)*100)}%`,
 tv(K,g){const G2=K.room({w:5,d:9,sides:true}),T=K.T,cl=g.d.cl.map(q=>{const m=new T.Mesh(new T.BoxGeometry(4.6,1.8,(q[1]-q[0])*2.2),new T.MeshBasicMaterial({color:K.lin('#8ad040'),transparent:true,opacity:.32,depthWrite:false}));m.visible=false;G2.add(m);return m});
   return{g:G2,cam:[[2.4,2.2,4.6],[0,.8,-1.4]],spot:(p,i,n)=>[slotX(i,n,.8),0,1.2,Math.PI],
   update(m){const t=m.st==='play'?m.t:-9;m.d.cl.forEach((q,i)=>{const zf=(q[0]-t)*2.2+1.2,zb=(q[1]-t)*2.2+1.2;cl[i].visible=zb>-4&&zf<9;cl[i].position.set(0,.9,-(zf+zb)/2+2.4);cl[i].material.opacity=.28+.06*Math.sin(K.now()*3+i)})}}},
 hud(x,w,h,g,HK){const ps=HK.players();ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*Math.min(w*.2,240);HK.txt(x,'LUNGS',X,h*.09,14);HK.bar(x,X-50,h*.12,100,10,g.d.lung[p.slot]||0,(g.d.lung[p.slot]||0)<.3?'#ff5a4a':'#e8e8f8')});
   /* the tunnel as a lane: clouds slide in from the right to the mouth on the left */
   const t=g.t,LX=w*.12,LW=w*.76,LY=h*.2,LH=Math.max(44,h*.09),px=LX+LW*.08,sc=LW/6;HK.panel(x,LX,LY,LW,LH,.8);
   for(const q of g.d.cl){const a=px+(q[0]-t)*sc,b=px+(q[1]-t)*sc;if(b<LX||a>LX+LW)continue;x.fillStyle='rgba(138,208,64,.6)';x.fillRect(Math.max(LX,a),LY+6,Math.min(LX+LW,b)-Math.max(LX,a),LH-12)}
   x.fillStyle='#e8d8c0';x.fillRect(px-5,LY-6,10,LH+12);const on=g.d.cl.some(q=>t>=q[0]&&t<q[1]);HK.txt(x,on?'HOLD YOUR BREATH!':'breathe…',w/2,LY+LH+Math.max(24,h*.045),Math.max(20,h*.045),on?'#a0e040':'#bfb29a')},
 pad(K){const d=K.d,sl=K.sl,s=K.s;if(K.first){s.m=K.meter('lung');K.x.append(s.m,K.el('p','mgNote watchTv','👀 Watch the clouds on the big screen'),K.btn('HOLD BREATH','go big',v=>{K.buzz(v?10:0);K.send((K.live().d.hold?'':'')+(v?'1':'0'))},true))}
   s.m.set(d.lung[sl]||0)},
 hint:()=>'Watch the big screen. Hold while a green cloud is on you; let go to breathe between clouds.'});

/* ===== 15 · The Sunken Temple · Offering Scales: lay offerings to match the idol's weight exactly ===== */
const WTS=[1,2,3,5];
O.addMg({id:'scales',dun:7,name:'Offering Scales',ctl:'Phone: offerings of 1, 2, 3 and 5',
 brief:'The idol names a weight and the water rises. Lay offerings of 1, 2, 3 and 5 on your scale to match it exactly before the water reaches the pan. Go over and the scale spills, and you start that offering again. From the third offering the idol refuses one weight: use it and the scale spills. Five offerings, quicker each time. Make them all.',
 setup(g){const r=H.rng(g.seed);g.d.tg=[];g.d.ban=[];for(let i=0;i<5;i++){g.d.tg.push(6+Math.floor(r()*(4+i*1.6)));g.d.ban.push(i>=2?WTS[Math.floor(r()*4)]:0)}g.d.ok={};g.d.sum={};g.dur=200;this.round(g,0)},
 round(g,i){const d=g.d;d.i=i;d.t0=+g.t.toFixed(2);d.lim=+(7-.55*i).toFixed(2);d.done={};for(const p of here())d.sum[p.slot]=0},
 input(g,p,v){const d=g.d;const[i,s]=String(v).split(':').map(Number);if(i!==d.i||d.done[p.slot])return;if(s<0){d.sum[p.slot]=0;H.ev('mgBad');return}d.sum[p.slot]=s;if(s===d.tg[i]){d.done[p.slot]=1;d.ok[p.slot]=(d.ok[p.slot]||0)+1;H.ev('mgGood')}else if(s>d.tg[i]){d.sum[p.slot]=0;H.ev('mgBad')}},
 tick(g){const d=g.d;if(g.t-d.t0>d.lim||here().every(p=>d.done[p.slot])){if(g.t-d.t0>d.lim)H.ev('mgBurst');if(d.i>=4){g.end=1;return}this.round(g,d.i+1)}},
 pass:(g,p)=>(g.d.ok[p.slot]||0)>=5,prog:(g,p)=>`${g.d.ok[p.slot]||0}/5 offered`,key:(g,d,sl)=>d.i+':'+(d.done[sl]?1:0),
 tv(K,g){const G2=K.room({w:7,d:5,h:3.6}),idol=K.vb(P2=>{P2.box(-4,3,0,3,-3,2,'l');P2.box(-3,2,4,14,-2,1,'ad');P2.box(-4,3,15,19,-3,2,'ad');P2.set(-2,17,3,'a');P2.set(1,17,3,'a')},.1,K.pal());idol.position.set(0,0,-1.9);G2.add(idol);
   const W=new K.T.Mesh(new K.T.BoxGeometry(7.6,1,4.6),new K.T.MeshBasicMaterial({color:K.lin('#2a7a5a'),transparent:true,opacity:.4,depthWrite:false}));G2.add(W);
   return{g:G2,cam:[[0,2.1,5.2],[0,1.2,-1]],spot:(p,i,n)=>K.sides(i,n,-.2),update(m){const f=m.st==='play'?clamp((m.t-m.d.t0)/m.d.lim,0,1):0;W.scale.y=Math.max(.01,f*1.3);W.position.y=f*.65}}},
 hud(x,w,h,g,HK){const d=g.d;HK.txt(x,`The idol asks: ${d.tg[d.i]}`,w/2,h*.1,Math.max(26,h*.06),'#70ffa0');HK.bar(x,w*.35,h*.16,w*.3,8,1-(g.t-d.t0)/d.lim,'#70ffa0');HK.txt(x,`Offering ${d.i+1} of 5`+(d.ban[d.i]?` · the idol refuses ${d.ban[d.i]}s`:''),w/2,h*.21,16)},
 pad(K){const d=K.d,s=K.s;if(s.i!==d.i){s.i=d.i;s.sum=0}K.x.textContent='';K.x.appendChild(K.el('div','mgBig',d.done[K.sl]?'✓':`${s.sum} / ${d.tg[d.i]}`));
   if(!d.done[K.sl])K.x.appendChild(K.row(4,...WTS.map(wt=>K.btn(String(wt),'go'+(d.ban[d.i]===wt?' banned':''),()=>{K.buzz(10);if(d.ban[d.i]===wt){K.buzz(90);s.sum=0;K.send(d.i+':-1');return}s.sum+=wt;if(s.sum>d.tg[d.i]){K.buzz(90);K.send(d.i+':'+s.sum);s.sum=0}else K.send(d.i+':'+s.sum)}))))},
 hint:(g,d)=>`Make exactly ${d.tg[d.i]}. Go over and you start again.`});

/* ===== 16 · The Sunken Temple · Gaze of the Drowned God: keep out of the turning stare ===== */
O.addMg({id:'gaze',dun:7,name:'Gaze of the Drowned God',hearts:true,ctl:'Phone: step ◀ ▶ around the ring',motion:1,mo:'Tilt left or right to step around the ring, one pillar at a time; hold the tilt to keep walking.',live:true,
 brief:'A stone eye turns at the centre of a ring of eight pillars, its stare covering three of them. Step around the ring to stay out of it. It turns faster, and sometimes reverses: its rim glows gold just before it does.',
 setup(g){const r=H.rng(g.seed);g.d.ev=[];let t=0,dir=1,pos=0,iv=.95;g.d.at={};here().forEach((p,i)=>g.d.at[p.slot]=(4+i*2)%8);while(t<30){t+=iv;if(t>3&&r()<.16){g.d.ev.push([+(t-.8).toFixed(2),'w']);dir=-dir}pos=(pos+dir+8)%8;g.d.ev.push([+t.toFixed(2),pos]);iv=Math.max(.56,iv-.013)}g.dur=30;g.res=0;g.d.beam=0;g.hitT={}},
 input(g,p,v){const k=Math.floor(num(+v,-1));if(k>=0&&k<8)g.d.at[p.slot]=k},
 tick(g){while(g.res<g.d.ev.length&&g.t>=g.d.ev[g.res][0]){const e=g.d.ev[g.res];if(e[1]!=='w')g.d.beam=e[1];g.res++}const b=g.d.beam;
   for(const p of alive(g)){const a=g.d.at[p.slot],dd=Math.min((a-b+8)%8,(b-a+8)%8);if(dd<=1&&!(g.t-(g.hitT[p.slot]||-9)<1.1)){g.hitT[p.slot]=g.t;H.hit(g,p)}}
   g.d.warn=g.d.ev.slice(g.res,g.res+3).some(e=>e[1]==='w'&&e[0]-g.t<.85)},
 prog:(g,p)=>`pillar ${g.d.at[p.slot]+1}`,key:(g,d,sl)=>d.at[sl]+':'+d.beam+(d.warn?'w':''),
 tv(K,g){const G2=K.room({w:8,d:8,back:false}),R=2.2,pil=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2,pl=K.vb(P2=>{P2.box(-2,1,0,13,-2,1,'l');P2.box(-3,2,14,15,-3,2,'ad')},.1,K.pal());pl.position.set(Math.sin(a)*(R+.45),0,Math.cos(a)*(R+.45));G2.add(pl);pil.push(pl)}
   const eye=new K.T.Group(),core=K.glow(.5,.5,.5,'#70ffa0');eye.add(core);const beam=new K.T.Mesh(new K.T.CylinderGeometry(.02,1.6,R*1.2,3,1,true,-Math.PI*3/8,Math.PI*3/4),new K.T.MeshBasicMaterial({color:K.lin('#70ffa0'),transparent:true,opacity:.25,side:K.T.DoubleSide,depthWrite:false}));
   beam.rotation.x=Math.PI/2;beam.position.z=R*.6;const bw=new K.T.Group();bw.add(beam);eye.add(bw);eye.position.y=.7;G2.add(eye);
   return{g:G2,cam:[[0,6.4,4.2],[0,0,0]],spot:(p,i,n)=>{const a=(g.d.at[p.slot]||0)/8*Math.PI*2,mates=here().filter(q=>g.d.at[q.slot]===g.d.at[p.slot]),j=mates.indexOf(p);return[Math.sin(a)*(R-.25-j*.3),0,Math.cos(a)*(R-.25-j*.3),a+Math.PI]},
   update(m){const want=m.d.beam/8*Math.PI*2;let dr=want-bw.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));bw.rotation.y+=dr*.35;core.material.color.set(m.d.warn?'#ffd27a':'#70ffa0');beam.material.color.set(m.d.warn?'#ffd27a':'#70ffa0')}}},
 pad(K){const d=K.d,s=K.s;if(K.first){const mv=dl=>()=>{K.buzz(10);K.send(String(((K.live().d.at[K.sl]??0)+dl+8)%8))};s.mv=mv;K.x.append(K.el('p','mgNote watchTv','👀 Watch the ring on the big screen'),K.row(2,K.btn('◀','go big',mv(-1)),K.btn('▶','go big',mv(1))))}
   K.lean(k=>{if(k===1)s.mv(1)();else if(k===3)s.mv(-1)()},{rep:430})},
 hud(x,w,h,g,HK){const R=Math.min(w*.13,h*.26),cx=w-R-Math.max(30,w*.04),cy=h*.42,b=g.d.beam;HK.panel(x,cx-R-26,cy-R-26,R*2+52,R*2+52,.8);
   for(let k=0;k<8;k++){const a=k/8*Math.PI*2-Math.PI/2,dd=Math.min((k-b+8)%8,(b-k+8)%8);x.fillStyle=dd<=1?(g.d.warn?'#ffd27a':'#70ffa0'):'#3a5a48';x.beginPath();x.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,R*.15,0,7);x.fill()}
   const ps=HK.players();ps.forEach((p,i)=>{const k=g.d.at[p.slot]||0,mates=ps.filter(q=>g.d.at[q.slot]===k),j=mates.indexOf(p),a=k/8*Math.PI*2-Math.PI/2;x.strokeStyle=HK.LANES[p.slot];x.lineWidth=4;x.beginPath();x.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,R*.2+j*5,0,7);x.stroke()});
   if(g.d.warn)HK.txt(x,'REVERSING!',cx,cy,Math.max(16,R*.22),'#ffd27a')},
 hint:(g,d)=>d.warn?'It is about to REVERSE!':'Watch the big screen and keep out of the green stare.'});

/* ===== 17 · The Bone Desert · Quicksand: climb only as the sand breathes out ===== */
O.addMg({id:'quicksand',dun:8,name:'Quicksand',ctl:'Phone: CLIMB',motion:1,mo:'Pump your phone up and down to haul yourself out, but only while the big screen says CLIMB. Pumping while it says wait sinks you.',live:true,
 brief:'You are sinking. The sand breathes in and out: tap CLIMB only while it breathes out (gold), and you pull yourself up. Climb while it breathes in (dark) and you sink faster. The breathing changes pace. Climb out before you are swallowed.',
 setup(g){g.dur=26;g.d.up={};g.d.per=[];let t=0,r=H.rng(g.seed);while(t<30){const p=+(1.85-.55*(t/30)+r()*.3).toFixed(2);g.d.per.push([+t.toFixed(2),p]);t+=p}},
 input(g,p,v){g.d.up[p.slot]=clamp(num(+v),0,100);if(here().every(q=>(g.d.up[q.slot]||0)>=100))g.end=1},
 pass:(g,p)=>(g.d.up[p.slot]||0)>=100,prog:(g,p)=>`${Math.round(g.d.up[p.slot]||0)}% out`,
 tv(K,g){const G2=K.room({w:7,d:5}),sand=new K.T.Mesh(new K.T.CircleGeometry(2.6,24),new K.T.MeshBasicMaterial({color:K.lin('#c8a870')}));sand.rotation.x=-Math.PI/2;sand.position.y=.03;G2.add(sand);
   return{g:G2,cam:[[0,2.6,4.8],[0,.4,0]],spot:(p,i,n)=>[slotX(i,n,.9),-1.2+((g.d.up[p.slot]||0)/100)*1.2,0,0],update(m){const ex=O.MG.quicksand.out(m,m.t);sand.material.color.copy(K.lin(ex?'#d8a858':'#6a4a28'))}}},
 out(g,t){const per=g.d.per;let k=per.length-1;while(k>0&&per[k][0]>t)k--;const[t0,p]=per[k];return(t-t0)/p>.4},
 hud(x,w,h,g,HK){const ex=O.MG.quicksand.out(g,g.t);HK.txt(x,ex?'CLIMB!':'wait…',w/2,h*.12,Math.max(28,h*.07),ex?'#ffc060':'#8a6a40')},
 pad(K){const s=K.s;if(K.first){s.up=10;s.last=performance.now();s.m=K.meter('sand');s.climb=()=>{const ex=O.MG.quicksand.out(K.live(),K.now());if(ex){s.up=Math.min(100,s.up+5);K.buzz(6)}else{s.up=Math.max(0,s.up-3);K.buzz(70);O.sfx('mgBad')}K.send(s.up.toFixed(1))};s.b=K.btn('CLIMB','go big',s.climb);K.x.append(s.m,s.b);K.shake(s.climb)}
   const now=performance.now(),dt=Math.min(.1,(now-s.last)/1000);s.last=now;if(s.up<100){s.up=Math.max(0,s.up-dt*(2+K.t*.06));if(!s.tx||now-s.tx>250){s.tx=now;K.send(s.up.toFixed(1))}}s.m.set(s.up/100);
   const ex=O.MG.quicksand.out(K.live(),K.now());s.b.classList.toggle('dim',!ex);s.b.textContent=s.up>=100?'OUT!':ex?'CLIMB':'wait…'},
 hint:()=>O.motionOn&&O.motionOn()?'Pump the phone while the big screen says CLIMB. Stop when it says wait.':'Tap CLIMB only while the button is bright (the sand breathes out).'});

/* ===== 18 · The Bone Desert · Tomb Arrows: press the arrow; red means the opposite; a scarab means nothing ===== */
O.addMg({id:'arrows',dun:8,name:'Tomb Arrows',hearts:true,ctl:'Phone: four directions',
 brief:'The tomb calls a direction. Press it. A RED arrow means press the opposite way. A SCARAB means press nothing at all. The calls come faster.',
 setup(g){const r=H.rng(g.seed);g.d.c=[];let t=1.2;for(let i=0;i<30;i++){const f=i/29,win=+(1.4-.72*f).toFixed(2),q=r();g.d.c.push([+t.toFixed(2),+(t+win).toFixed(2),Math.floor(r()*4),i<3?0:q<.3?1:q<.42?2:0]);t+=win+.35}g.dur=t+.3;g.res=0;g.ans={}},
 input(g,p,v){const[n,k]=String(v).split(':').map(Number);const c=g.d.c[g.res];if(!c||g.t<c[0])return;const a=g.ans[p.slot]=g.ans[p.slot]||{};if(a[g.res]==null)a[g.res]=k},
 tick(g){while(g.res<g.d.c.length&&g.t>=g.d.c[g.res][1]){const[,,dir,ty]=g.d.c[g.res],want=ty===2?null:ty===1?(dir+2)%4:dir;for(const p of alive(g)){const a=(g.ans[p.slot]||{})[g.res];if(want==null?a!=null:a!==want)H.hit(g,p)}g.res++}if(g.res>=g.d.c.length)g.end=1},
 prog:g=>`${g.res}/${g.d.c.length} calls`,
 tv(K,g){const G2=K.room({w:6,d:4,h:3.6}),door=K.vb(P2=>{for(let x=-9;x<9;x++)for(let y=0;y<22;y++)P2.set(x,y,0,Math.abs(x)>6||y>18?'ad':'l')},.12,K.pal());door.position.set(0,0,-1.9);G2.add(door);
   const sp=K.sym('scarab',1.3);sp.position.set(0,1.4,-1.7);G2.add(sp);return{g:G2,cam:[[0,1.8,5],[0,1.3,-1]],spot:(p,i,n)=>[slotX(i,n,.8),0,1,Math.PI],update(m){const c=m.d.c[m.res];sp.visible=!!c&&m.st==='play'&&m.t>=c[0]&&c[3]===2}}},
 hud(x,w,h,g,HK){const c=g.d.c[g.res];if(!c||g.t<c[0])return;const s=Math.min(w,h)*.22;if(c[3]===2){HK.txt(x,'DON’T MOVE',w/2,h*.62,Math.max(24,h*.05),'#40d0c0');return}
   x.save();x.translate(w/2,h*.42);x.rotate([-Math.PI/2,0,Math.PI/2,Math.PI][c[2]]);x.fillStyle=c[3]===1?'#ff3a2a':'#ffc060';x.strokeStyle='#000';x.lineWidth=6;x.beginPath();x.moveTo(s*.6,0);x.lineTo(-s*.1,-s*.45);x.lineTo(-s*.1,-s*.18);x.lineTo(-s*.6,-s*.18);x.lineTo(-s*.6,s*.18);x.lineTo(-s*.1,s*.18);x.lineTo(-s*.1,s*.45);x.closePath();x.stroke();x.fill();x.restore();
   if(c[3]===1)HK.txt(x,'OPPOSITE!',w/2,h*.66,Math.max(22,h*.045),'#ff7a6a');HK.bar(x,w*.4,h*.72,w*.2,6,1-(g.t-c[0])/(c[1]-c[0]),'#ffc060')},
 pad(K){if(K.first){const pad=K.el('div','dirPad');for(let k=0;k<4;k++)pad.appendChild(K.btn(ARW[k],'dir d'+k,()=>{K.buzz(10);K.s.n=(K.s.n||0)+1;K.send(K.s.n+':'+k)}));K.x.appendChild(pad)}},
 hint:()=>'Gold arrow: press it. Red arrow: the opposite. Scarab: nothing.'});

/* ===== 19 · Gloom Marsh · Will-o'-the-Wisps: count only the true lights ===== */
O.addMg({id:'wisps',dun:9,name:'Will-o’-the-Wisps',ctl:'Phone: a number pad',
 brief:'Lights flit across the marsh. Count only the TRUE ones: warm gold and steady. The false ones are cold green and flicker. Then enter your count. Three flurries, each busier. Get every one exactly right.',
 setup(g){const r=H.rng(g.seed);g.d.fl=[];for(let i=0;i<3;i++){const n=2+Math.floor(r()*(2+i)),f=2+Math.floor(r()*(2+i)),L=[];for(let k=0;k<n+f;k++)L.push([k<n?1:0,+(r()*3.2).toFixed(2),+(r()*1.6).toFixed(2),r()<.5?1:-1,+(.9+r()*.8).toFixed(2)]);g.d.fl.push([n,L])}g.d.ok={};g.d.ans={};g.dur=200;this.round(g,0)},
 round(g,i){const d=g.d;d.i=i;d.t0=+g.t.toFixed(2);d.ph='fly';d.ans={}},
 input(g,p,v){const d=g.d;const[i,a]=String(v).split(':').map(Number);if(i!==d.i||d.ph!=='ask'||d.ans[p.slot]!=null)return;d.ans[p.slot]=a;if(a===d.fl[i][0])d.ok[p.slot]=(d.ok[p.slot]||0)+1},
 tick(g){const d=g.d,el=g.t-d.t0;if(d.ph==='fly'&&el>4.4){d.ph='ask';d.t1=+g.t.toFixed(2)}else if(d.ph==='ask'&&(g.t-d.t1>5.5||here().every(p=>d.ans[p.slot]!=null))){d.ph='show';d.t2=+g.t.toFixed(2)}else if(d.ph==='show'&&g.t-d.t2>1.4){if(d.i>=2){g.end=1;return}this.round(g,d.i+1)}},
 pass:(g,p)=>(g.d.ok[p.slot]||0)>=3,prog:(g,p)=>`${g.d.ok[p.slot]||0}/3 right`,key:(g,d,sl)=>d.i+d.ph+(d.ans[sl]!=null?1:0),
 tv(K,g){const G2=K.room({w:9,d:6}),T=K.T,W=new T.Mesh(new T.PlaneGeometry(9,6),new T.MeshBasicMaterial({color:K.lin('#1a3a30'),transparent:true,opacity:.6}));W.rotation.x=-Math.PI/2;W.position.y=.05;G2.add(W);const pool=[];
   return{g:G2,cam:[[0,2,5.6],[0,1,-1]],spot:(p,i,n)=>K.sides(i,n,.1),
   update(m){const d=m.d,el=m.t-d.t0,L=d.ph==='fly'&&m.st==='play'?d.fl[d.i][1]:[];let k=0;for(const q of L){const u=(el-q[1])/q[4];if(u<0||u>1)continue;let s=pool[k];if(!s){s=new T.Mesh(new T.SphereGeometry(.09,8,6),new T.MeshBasicMaterial({color:'#fff',toneMapped:false}));G2.add(s);pool.push(s)}
       s.visible=true;s.material.color.set(q[0]?'#ffd060':'#70ffd0');s.material.opacity=1;s.scale.setScalar(q[0]?1.3:(Math.sin(K.now()*30+k)>0?1.2:.5));s.position.set(q[3]*(-4+u*8),.8+q[2]+Math.sin(u*9+k)*.2,-1.5+Math.sin(k)*1.2);k++}for(;k<pool.length;k++)pool[k].visible=false}}},
 hud(x,w,h,g,HK){const d=g.d;HK.txt(x,d.ph==='fly'?'Count the WARM steady lights':d.ph==='ask'?'How many?':`There were ${d.fl[d.i][0]}`,w/2,h*.1,Math.max(22,h*.05),d.ph==='show'?'#ffd060':'#fff4d6');HK.txt(x,`Flurry ${d.i+1} of 3`,w/2,h*.17,16)},
 pad(K){const d=K.d,s=K.s;K.x.textContent='';if(d.ph==='fly'){K.x.appendChild(K.el('div','mgBig','Count!'));return}if(d.ph==='show'||d.ans[K.sl]!=null){const a=d.ans[K.sl];K.x.appendChild(K.el('div','mgBig '+(a===d.fl[d.i][0]?'ok':'bad'),a==null?'…':d.ph==='show'?(a===d.fl[d.i][0]?'Right!':`It was ${d.fl[d.i][0]}`):'Sent'));return}
   const gr=K.el('div','mgGrid g5');for(let n=0;n<=12;n++)gr.appendChild(K.btn(String(n),'num',()=>{K.buzz(12);K.send(d.i+':'+n)}));K.x.appendChild(gr)},
 hint:(g,d)=>d.ph==='fly'?'Watch the big screen and count the gold lights.':'Enter your count.'});

/* ===== 20 · Gloom Marsh · Stepping Stones: hop only onto a stone that is up ===== */
O.addMg({id:'stones',dun:9,name:'Stepping Stones',ctl:'Phone: HOP',motion:1,mo:'Flick your phone to HOP. Watch the stones on the big screen: hop only when the next one is up.',live:true,
 brief:'Twelve stones cross the marsh, each bobbing up and under on its own rhythm. HOP to the next stone only while it is up; land on a sunk one and you are dunked and lose a moment. Reach the far bank in time.',
 setup(g){const r=H.rng(g.seed);g.d.st=[];for(let i=0;i<12;i++)g.d.st.push([+(1.1+r()*1.2-i*.02).toFixed(2),+(r()*6.28).toFixed(2)]);g.dur=36;g.d.at={};g.d.hop={};g.d.dk={};for(const p of here())g.d.at[p.slot]=-1;g.n={}},
 up(g,i,t){if(i<0||i>=12)return true;const[p,ph]=g.d.st[i];return Math.sin(t*Math.PI*2/p+ph)>-.4},
 input(g,p,v,at){const n=num(+v);if(n<=(g.n[p.slot]||0))return;g.n[p.slot]=n;const k=p.slot;if(g.d.at[k]>=12||(g.d.hop[k]&&at-g.d.hop[k]<.35)||(g.d.dk[k]&&at-g.d.dk[k]<.8))return;g.d.hop[k]=+at.toFixed(2);
   const to=g.d.at[k]+1;if(this.up(g,to,at+.3)){g.d.at[k]=to;if(to>=12)H.ev('boon');else H.ev('mgTap')}else{g.d.at[k]=Math.max(-1,to-1);g.d.dk[k]=+at.toFixed(2);H.ev('mgHit',{slot:k})}if(here().every(q=>g.d.at[q.slot]>=12))g.end=1},
 pass:(g,p)=>g.d.at[p.slot]>=12,prog:(g,p)=>g.d.at[p.slot]>=12?'across!':`stone ${g.d.at[p.slot]+1}/12`,key:(g,d,sl)=>d.at[sl],
 /* each fighter's next three stones, up or under, on the big screen */
 hud(x,w,h,g,HK){HK.split(x,w,h,(x,X,Y,W,H,p)=>{const a=g.d.at[p.slot],dk=g.d.dk[p.slot]&&g.t-g.d.dk[p.slot]<.8;if(a>=12){HK.txt(x,'Across!',X+W/2,Y+H/2,Math.max(18,H*.2),'#9dffb0');return}const q=Math.min(W/3.4,H*.62);
   for(let j=0;j<3;j++){const i=a+1+j,X0=X+W/2+(j-1)*q*1.08-q/2,Y0=Y+(H-q)/2,bank=i>=12,up=bank||O.MG.stones.up(g,i,g.t+.3);x.fillStyle=bank?'#3a6a3a':up?(j?'#5a8a5a':'#8adf8a'):'#1a2a2a';x.fillRect(X0,Y0,q,q);if(!j){x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(X0,Y0,q,q)}HK.txt(x,bank?'bank':String(i+1),X0+q/2,Y0+q/2,Math.max(12,q*.3),up?'#10200f':'#5a7a7a')}
   if(dk)HK.txt(x,'Dunked!',X+W/2,Y+H-8,Math.max(12,H*.12),'#ff7a6a')},{top:.04,maxH:h*.26,maxW:w*.22})},
 tv(K,g){const G2=K.room({w:5,d:12,back:false}),T=K.T,W=new T.Mesh(new T.PlaneGeometry(6,14),new T.MeshBasicMaterial({color:K.lin('#1a3a30')}));W.rotation.x=-Math.PI/2;W.position.y=.02;G2.add(W);
   const st=g.d.st.map((q,i)=>{const s=K.vb(P2=>{for(let a=-3;a<3;a++)for(let b=-3;b<3;b++)if(Math.hypot(a+.5,b+.5)<3.2)P2.set(a,0,b,'l')},.12,Object.assign(K.pal(),{l:{c:'#6a7a6a',n:.1}}));s.position.set((i%2?.3:-.3),0,2.4-i*.62);G2.add(s);return s});
   return{g:G2,cam:[[4.6,4.8,6.4],[0,0,-1.2]],spot:(p,i,n)=>{const a=g.d.at[p.slot];const z=a<0?3.1:a>=12?2.4-12*.62:2.4-a*.62,x=a<0||a>=12?slotX(i,n,.4):(a%2?.3:-.3)+slotX(i,n,.12);return[x,a>=0&&a<12?st[a].position.y+.05:0,z,Math.PI]},
   update(m){const t=m.st==='play'?m.t:0;st.forEach((s,i)=>{s.position.y=O.MG.stones.up(m,i,t)?.06:-.3})}}},
 pad(K){const d=K.d,s=K.s;if(K.first){s.row=K.el('div','stoneRow');for(let i=0;i<3;i++)s.row.appendChild(K.el('i'));const hop=()=>{K.buzz(15);s.n=(s.n||0)+1;K.send(String(s.n))};K.x.append(s.row,K.btn('HOP','go big',hop));K.shake(hop)}
   const a=d.at[K.sl],t=K.now();[...s.row.children].forEach((c,j)=>{const i=a+1+j;c.className=i>=12?'bank':O.MG.stones.up(K.live(),i,t+.3)?'up':'down';c.textContent=i>=12?'bank':String(i+1)})},
 hint:()=>O.motionOn&&O.motionOn()?'Flick to HOP when your next stone is up on the big screen.':'HOP when the next stone (first square) is up.'});
})();
