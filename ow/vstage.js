/* GambaGolf: the voxel stage on the big screen. Lobby hall, the creature course, fighters and monster, balls, particles, camera and HUD.
   The dungeon map is drawn by map2d.js. Course coordinates map to the world as x -> x*W, y (down the course) -> -y*W. */
(()=>{
const O=window.OW,T=THREE,G=O.G,V=O.V,CG=O.CG,{CLASSES,MONSTERS,MAP,LANES,TIER}=O,$=id=>document.getElementById(id);
const W=CG.W,wx=x=>x*W,wz=y=>-y*W,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
/* per-dungeon mood: skyline glow, fire colour, fog */
const SETS=[
 {hz:'#3a2230',fire:'#ff9a3a',fog:'#0d0a10'},{hz:'#27381c',fire:'#ffb050',fog:'#0a0e08'},{hz:'#10343a',fire:'#5fe0d0',fog:'#061012'},{hz:'#5a1c08',fire:'#ff7a20',fog:'#120604'},
 {hz:'#2a2440',fire:'#c8a0ff',fog:'#0c0a14'},{hz:'#1c3a52',fire:'#7fc8ff',fog:'#0a1018'},{hz:'#2c3a0c',fire:'#a0e040',fog:'#0a0e04'},{hz:'#143a22',fire:'#70ffa0',fog:'#04100a'},
 {hz:'#5a4016',fire:'#ffc060',fog:'#120c06'},{hz:'#16342c',fire:'#70ffd0',fog:'#040c0a'},{hz:'#2a2e44',fire:'#ff9a3a',fog:'#0a0b12'},{hz:'#3a2a1c',fire:'#ffb050',fog:'#100a06'},
 {hz:'#22284a',fire:'#a0c0ff',fog:'#080a14'},{hz:'#3a3a1c',fire:'#ffd060',fog:'#0e0e06'},{hz:'#2a3a40',fire:'#a0f0ff',fog:'#0a0e10'},{hz:'#2a1c2a',fire:'#ff9a3a',fog:'#0c080c'},
 {hz:'#3a4a6a',fire:'#e0f0ff',fog:'#0c1018'},{hz:'#0a2030',fire:'#40c0ff',fog:'#04080c'},{hz:'#4a1010',fire:'#ff5a2a',fog:'#100404'},{hz:'#24183a',fire:'#c070ff',fog:'#08060e'}];
O.SETS=SETS;
let renderer,scene,cam,canvas,ready=false,time=0,shake=0,hudKey='',pixOn=false,fxOn=true,detailOn=true,shakeOn=true;
try{pixOn=localStorage.getItem('ow_vpix')==='1';fxOn=localStorage.getItem('ow_fx')!=='0';detailOn=localStorage.getItem('ow_detail')!=='0';shakeOn=localStorage.getItem('ow_shake')!=='0'}catch(e){}
const K0lin=c=>new THREE.Color(c).convertSRGBToLinear(),aimRings=[],trails=[];let hemi,moon,fire1,monLight,world,floor,lobbyG,courseG=null,course=null,courseKey='',monG=null,monFor='',monH=2.6,terrG=null,terrKey='',ledge=null,aimArrows=[],torches=[],themeFor=-1;
const heroes=new Map(),marbles=new Map(),floats=[];
const camPos=new T.Vector3(0,6,8),camTgt=new T.Vector3(0,0,0),wantPos=new T.Vector3(),wantTgt=new T.Vector3(),camVel=new T.Vector3(),tgtVel=new T.Vector3(),tmp=new T.Vector3();
function damp(cur,want,vel,st,dt){const om=2/Math.max(.02,st),x=om*dt,e=1/(1+x+.48*x*x+.235*x*x*x);for(const c of['x','y','z']){const ch=cur[c]-want[c],t=(vel[c]+om*ch)*dt;vel[c]=(vel[c]-om*t)*e;cur[c]=want[c]+(ch+t)*e}}

/* ---------- particles: square points read as flying voxels ---------- */
const PN=2400;let pts,pPos,pCol,pVel,pLife,pMax,pBase,pi=0;
function initParticles(){const g=new T.BufferGeometry();pPos=new Float32Array(PN*3);pCol=new Float32Array(PN*3);pBase=new Float32Array(PN*3);pVel=new Float32Array(PN*4);pLife=new Float32Array(PN);pMax=new Float32Array(PN);
  for(let i=0;i<PN;i++)pPos[i*3+1]=-99;g.setAttribute('position',new T.BufferAttribute(pPos,3));g.setAttribute('color',new T.BufferAttribute(pCol,3));
  pts=new T.Points(g,new T.PointsMaterial({size:.07,vertexColors:true,sizeAttenuation:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));pts.frustumCulled=false;scene.add(pts)}
const tc=new T.Color();
function P(x,y,z,vx,vy,vz,life,col,grav){const i=pi;pi=(pi+1)%PN;pPos[i*3]=x;pPos[i*3+1]=y;pPos[i*3+2]=z;pVel[i*4]=vx;pVel[i*4+1]=vy;pVel[i*4+2]=vz;pVel[i*4+3]=grav==null?-7:grav;pLife[i]=pMax[i]=life;tc.set(col);pBase[i*3]=tc.r;pBase[i*3+1]=tc.g;pBase[i*3+2]=tc.b}
function burst3(x,y,z,col,n,sp){for(let i=0;i<n;i++){const a=Math.random()*6.283,e=Math.random()*1.3,s=(sp||2.5)*(.3+Math.random());P(x,y,z,Math.cos(a)*Math.cos(e)*s,Math.sin(e)*s+.5,Math.sin(a)*Math.cos(e)*s,.5+Math.random()*.6,col)}}
function ring3(x,y,z,col,R,n){n=n||28;for(let i=0;i<n;i++){const a=i/n*6.283;P(x+Math.cos(a)*.05,y,z+Math.sin(a)*.05,Math.cos(a)*R*2,.4,Math.sin(a)*R*2,.45,col,0)}}
function stepParticles(dt){for(let i=0;i<PN;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3,v=i*4;if(pLife[i]<=0){pPos[j+1]=-99;continue}
    pVel[v+1]+=pVel[v+3]*dt;pPos[j]+=pVel[v]*dt;pPos[j+1]+=pVel[v+1]*dt;pPos[j+2]+=pVel[v+2]*dt;if(pPos[j+1]<.01&&pVel[v+3]<0){pPos[j+1]=.01;pVel[v+1]*=-.35;pVel[v]*=.6;pVel[v+2]*=.6}
    const a=Math.min(1,pLife[i]/pMax[i]*1.6);pCol[j]=pBase[j]*a;pCol[j+1]=pBase[j+1]*a;pCol[j+2]=pBase[j+2]*a}
  pts.geometry.attributes.position.needsUpdate=true;pts.geometry.attributes.color.needsUpdate=true}
/* a voxel model blown apart: its own blocks fly off */
function shatter(g,n){g.updateMatrixWorld(true);const v=new T.Vector3();let k=0;g.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.color)return;const p=o.geometry.attributes.position,c=o.geometry.attributes.color,step=Math.max(4,Math.floor(p.count/(n||600))*4);
  for(let i=0;i<p.count;i+=step){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const a=Math.random()*6.283,s=1+Math.random()*3.5;tc.setRGB(c.getX(i),c.getY(i),c.getZ(i)).convertLinearToSRGB();
    const j=pi;P(v.x,v.y,v.z,Math.cos(a)*s,1.5+Math.random()*4,Math.sin(a)*s,1.4+Math.random(),'#'+tc.getHexString(),-9);pts.material.blending=T.NormalBlending;k++}});return k}
function floatText(x,y,z,txt,col,big){const d=document.createElement('div');d.className='ft'+(big?' big':'');d.textContent=txt;d.style.color=col||'#fff3e6';$('floats').appendChild(d);floats.push({d,p:new T.Vector3(x,y,z),t:0})}

/* ---------- the world ---------- */
function torchModel(col){const P2=new V.Part('t',[0,0,0]);P2.box(0,1,0,13,0,1,'w');P2.box(-1,2,14,14,-1,2,'i');P2.box(0,1,15,16,0,1,'f');P2.set(0,17,0,'f2');P2.set(1,17,1,'f2');
  return V.build({pal:{w:{c:'#4a3424',n:.1},i:{c:'#3a383c',n:.05},f:{c:col,glow:1},f2:{c:'#ffe7a0',glow:1}},parts:[P2]},.05)}
function buildWorld(){
  world=new T.Group();scene.add(world);
  const fl=new V.Part('f',[0,0,0]);for(let i=-30;i<30;i++)for(let j=-40;j<14;j++)fl.set(i,0,j,'floor');
  floor=new T.Mesh(V.geom(fl,CG.LOOKS.ossuary,[.4,.05,.4]).solid,V.matSolid());floor.position.y=-.65;floor.receiveShadow=true;world.add(floor);
  /* the lobby: a hall with a dais, two braziers and banners */
  lobbyG=new T.Group();world.add(lobbyG);
  {const st=new V.Part('s',[0,0,0]);for(let k=0;k<3;k++)st.box(-22+k*2,21-k*2,k,k,-8+k,7-k,k%2?'stone':'stone_d');const sm2=V.build({pal:CG.LOOKS.ossuary,parts:[st]},.1);sm2.position.set(0,-.65,0);lobbyG.add(sm2);
    const wall=new V.Part('w',[0,0,0]);for(let x=-30;x<30;x++)for(let y=0;y<26;y++)if(!(Math.abs(x)<5&&y<16)||y>18)wall.set(x,y,0,(x+y*3)%7?'stone':'stone_d');for(let x=-4;x<4;x++)wall.set(x,16+Math.floor((16-x*x)/6),0,'stone_d');
    const wm=V.build({pal:CG.LOOKS.ossuary,parts:[wall]},.2);wm.position.set(0,-.65,-2.4);lobbyG.add(wm);
    for(const s of[-1,1]){const br=new V.Part('b',[0,0,0]);br.box(-2,1,0,8,-2,1,'stone_d');br.box(-4,3,9,10,-4,3,'stone');br.box(-3,2,11,12,-3,2,'fire');br.box(-2,1,13,14,-2,1,'fire2');
      const bm=V.build({pal:Object.assign({},CG.LOOKS.ossuary,{fire:{c:'#ff8a2a',glow:1},fire2:{c:'#ffe090',glow:1}}),parts:[br]},.06);bm.position.set(s*2.6,-.35,-.6);lobbyG.add(bm);
      const L=new T.PointLight('#ff9a3a',2.2,7,1.6);L.position.set(s*2.6,.7,-.4);lobbyG.add(L);torches.push(L);
      const ban=new V.Part('n',[0,0,0]);ban.box(0,7,0,17,0,0,'ban');ban.box(0,7,17,17,0,0,'gold');ban.box(3,4,6,11,1,1,'gold');for(let x=0;x<8;x+=2)ban.del(x,0,0);
      const bnm=V.build({pal:{ban:{c:'#7a2a24',n:.06},gold:{c:'#d5a640',n:.05}},parts:[ban]},.09);bnm.position.set(s*4.4-.36,.6,-2.3);lobbyG.add(bnm)}}
  ledge=new T.Mesh(new T.BoxGeometry(1,.62,3.4),new T.MeshLambertMaterial({color:'#34303a'}));ledge.receiveShadow=true;ledge.castShadow=true;world.add(ledge)}
function applyTheme(){
  themeFor=G.dung;const S=SETS[G.dung]||SETS[0],d=O.DUNGEONS[G.dung]||{};O.fireCol=S.fire;
  scene.background=new T.Color(S.fog);scene.fog=new T.Fog(S.fog,16,40);
  hemi.color.set(d.light||'#c8d0ff').lerp(new T.Color('#8c9ad0'),.6);hemi.groundColor.set(S.hz);
  for(const L of torches)L.color.set(S.fire);for(const t of aimArrows)t.visible=false;courseKey=''}
/* ---------- the course for the monster in front of the party ---------- */
function syncCourse(){
  const mo=G.mons[0],C=G.screen==='combat'&&mo?mo.course:null,key=C?mo.uid+':'+mo.id:'';
  if(key!==courseKey){courseKey=key;if(courseG){world.remove(courseG);courseG=null;course=null}if(terrG){world.remove(terrG);terrG=null;terrKey=''}
    for(const t of torches.filter(t=>t.userData.course)){world.remove(t.userData.obj);world.remove(t)}torches=torches.filter(t=>!t.userData.course);
    if(C){course=CG.build(C,{pal:CG.lookFor(G.dung)});courseG=course.group;world.add(courseG);
      const S=SETS[G.dung]||SETS[0];for(let y=160;y<C.len;y+=440)for(const s of[-1,1]){const x=C.cx(y)+s*(C.half(y)+40),tm=torchModel(S.fire);tm.position.set(wx(x),0,wz(y));world.add(tm);const L=new T.PointLight(S.fire,1.5,5.5,1.6);L.position.set(wx(x),.9,wz(y));L.userData.course=1;L.userData.obj=tm;world.add(L);torches.push(L)}
      ledge.position.set(wx(C.cx(150)-C.half(150)-90),-.34,wz(150))}}
  lobbyG.visible=!C&&G.screen!=='map';ledge.visible=!!C;if(!course)return;
  const C2=mo.course;course.update(G.ck,cam);
  /* who the course's grates and glowing rims speak to: the ball in play, or the one fighter lining up a shot */
  const ci=G.cine;let fit=0;
  if(ci&&!ci.atk.ab.instant&&ci.atk.ab.m)fit=O.mSize(ci.atk.ab.m.r);
  else{const aimers=G.players.filter(p=>p.hp>0&&!p.fired&&(G.players.length===1||p.id===G.shooter));if(aimers.length===1){const p=aimers[0],ab=CLASSES[p.cls].ab[p.ab];if(ab&&ab.m)fit=Math.max(1,O.mSize(ab.m.r)-(O.mods(p).sizeDown||0)-(p.small<1?1:0))}}
  course.setFit(G.phase==='aim'?fit:0);
  /* the monster's sand, gravel, water or wind */
  const tr=mo.terr,tk=tr?tr.k+':'+tr.spots.map(s=>s.x+','+s.y).join(';'):'';
  if(tk!==terrKey){terrKey=tk;if(terrG){world.remove(terrG);terrG=null}if(tr){terrG=new T.Group();world.add(terrG);
      for(const s of tr.spots){const pp=new V.Part('t',[0,0,0]),rr=Math.round(s.r/8);for(let i=-rr;i<=rr;i++)for(let j=-rr;j<=rr;j++){const d=Math.hypot(i,j)*8;if(d>s.r-2)continue;
          if(tr.k==='mire')pp.set(i,0,-j,V.hash(i,j,1)<.2?'sd':'sa');else if(tr.k==='rubble'){if(V.hash(i,j,2)<.45)pp.set(i,0,-j,V.hash(i,j,3)<.5?'gr':'gd')}else pp.set(i,0,-j,d>s.r-12?'wl':'wa')}
        const pal={sa:{c:'#c9b080',n:.1},sd:{c:'#a8905e',n:.08},gr:{c:'#8a8590',n:.12},gd:{c:'#5e5a64',n:.1},wa:{c:'#2a5a8a',n:.05},wl:{c:'#5a9ad0',n:.05}};
        const m=new T.Mesh(V.geom(pp,pal,[.08,tr.k==='rift'?.02:.04,.08]).solid,tr.k==='rift'?new T.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:.85,emissive:'#123a5a'}):V.matSolid());m.receiveShadow=true;m.position.set(wx(s.x)-.04,tr.k==='rift'?-.012:0,wz(s.y)+.04);terrG.add(m)}}}
  if(tr&&tr.k==='gale'&&Math.random()<.5){const y=300+Math.random()*(C2.len-500),x=C2.cx(y)-tr.dir*(C2.half(y)+20);P(wx(x),.15+Math.random()*.5,wz(y),tr.dir*4,0,0,.9,'#cfe0ff',0)}
  if(tr&&tr.k==='rift'&&Math.random()<.2){const s=tr.spots[Math.floor(Math.random()*tr.spots.length)];if(s)P(wx(s.x+(Math.random()-.5)*s.r),.02,wz(s.y+(Math.random()-.5)*s.r),0,.3,0,.6,'#9fd0ff',0)}}
/* ---------- the monster ---------- */
function syncMonster(dt){
  const mo=G.mons[0],show=G.screen==='combat'&&!!mo;
  if(!show){if(monG){monG.visible=false}return}
  if(monFor!==mo.uid+':'+mo.id){monFor=mo.uid+':'+mo.id;if(monG)world.remove(monG);const inner=V.build(V.monster(mo.id)),bb=new T.Box3().setFromObject(inner),sz=bb.getSize(new T.Vector3());
    monH=mo.rank==='boss'?4.6:mo.rank==='mini'?3.5:2.7;if(G.practice)monH=2.4;const s=monH/Math.max(.3,sz.y,sz.x*.6,sz.z*.6);inner.scale.setScalar(s);inner.position.y=-bb.min.y*s;
    monG=new T.Group();monG.add(inner);monG.userData={inner,parts:inner.userData.parts,hitT:0,dead:0,dying:false,gone:false,s,rest:{}};for(const k in monG.userData.parts){const p=monG.userData.parts[k];monG.userData.rest[k]=[p.position.clone(),p.rotation.clone()]}
    world.add(monG);monLight.intensity=0}
  const C=mo.course,u=monG.userData,P0=u.parts,R=u.rest,atk=G.phase==='boss'&&G.mons[G.actor]===mo?mo.atk:null;monG.visible=!u.gone;
  const bx=wx(C.cx(C.len)),bz=wz(C.len+170),asp=canvas.clientWidth/Math.max(1,canvas.clientHeight);
  monG.position.set(bx,-.35,bz);monG.rotation.y=asp>=1.2?.55:0;
  /* idle, wind-up, strike, flinch */
  let lunge=0,rear=0;if(atk){const w=atk.t/atk.W;if(atk.t<atk.W){rear=sm(0,1,w);u.inner.position.y=u.inner.position.y}else if(atk.t<atk.W+atk.S){lunge=1-((atk.t-atk.W)/atk.S)}}
  u.hitT=Math.max(0,u.hitT-dt*1.6);const fl=u.hitT>0?Math.sin(u.hitT*30)*u.hitT:0;
  monG.position.z+=lunge*1.2-rear*.3+fl*.12;monG.rotation.x=-rear*.12+lunge*.2;
  const br=1+Math.sin(time*2.1)*.02;u.inner.scale.set(u.s,u.s*br,u.s);
  for(const k in P0){const p=P0[k],r0=R[k];p.rotation.copy(r0[1]);
    if(k==='head'||k.startsWith('head'))p.rotation.y+=Math.sin(time*.8+k.length)*.2,p.rotation.x+=-rear*.35+lunge*.25;
    else if(k==='jaw')p.rotation.x+=(u.hitT>0||lunge>0?.6:Math.max(0,Math.sin(time*1.3))*.12);
    else if(k.startsWith('tail'))p.rotation.y+=Math.sin(time*3+k.length)*.3;
    else if(k==='wing_L')p.rotation.z+=Math.sin(time*6)*.45+.15;else if(k==='wing_R')p.rotation.z-=Math.sin(time*6)*.45+.15;
    else if(k==='arm_R'||k==='arm_L')p.rotation.x+=-rear*1.8+lunge*1.2+Math.sin(time*1.6+(k==='arm_L'?1:0))*.08;
    else if(k.startsWith('neck'))p.rotation.x+=Math.sin(time*1.4+k.length)*.06-rear*.15;
    else if(k.startsWith('leg_')&&k.length>6)p.rotation.z+=Math.sin(time*5+k.charCodeAt(4))*.08}
  if(mo.dead&&!u.dying&&!u.gone){u.dying=true;u.dead=0}
  if(u.dying){u.dead+=dt;if(u.dead>.5&&!u.gone){u.gone=true;shatter(u.inner,mo.rank==='lesser'?500:1200);shake=Math.max(shake,1)}}
  monLight.position.set(bx+1.5,monH*.8,bz+2.4);monLight.intensity=lerp(monLight.intensity,u.gone?0:1.2+(atk&&atk.t>0&&atk.t<atk.W?Math.sin(time*18)*.8:0),.1);
}
const monChest=()=>new T.Vector3(monG?monG.position.x:0,monH*.6,monG?monG.position.z:0);
/* ---------- the fighters ---------- */
function heroSpot(p,i){
  if(G.screen==='map'&&!G.mg&&mapG&&MAP[G.node]&&MAP[G.node]._p){const tr=G.travel,n=G.players.length,a=i/Math.max(1,n)*6.283+.8,r=n>1?.42:0;let bx=MAP[G.node]._p[0],bz=MAP[G.node]._p[1],ry=Math.PI;
    if(tr&&MAP[tr.from]._p&&MAP[tr.to]._p){const A=MAP[tr.from]._p,B2=MAP[tr.to]._p,e=sm(0,1,tr.t);bx=lerp(A[0],B2[0],e);bz=lerp(A[1],B2[1],e);ry=Math.atan2(B2[0]-A[0],B2[1]-A[1])}
    return[MPX+bx+Math.cos(a)*r,.12,bz+Math.sin(a)*r+.25,ry,false]}
  if(mgS&&G.mg&&G.screen==='map'&&podOn()){const ps=G.players.filter(q=>!q.away),r=podRank(p),n=ps.length;return[MGX+PODX(r,n),PODH(r),MGZ+PODZ,0,false]}
  if(mgS&&G.mg&&G.screen==='map'){const s=mgS.spot(p,i,G.players.length);return[MGX+s[0],s[1],MGZ+s[2],s[3],false]}
  const fight=G.screen==='combat'||G.screen==='result'&&false,C=G.mons[0]&&G.mons[0].course;
  if(G.screen==='combat'&&C){const ci=G.cine,me=ci&&ci.atk.pl===p&&ci.st!=='out',aiming=G.phase==='aim'&&!ci&&!p.fired&&p.hp>0&&(G.players.length===1||G.shooter===p.id);
    if(me||aiming)return[wx(O.launchX(p)),0,wz(O.TY+20),Math.PI,true];
    const k=G.players.filter(q=>q!==p).indexOf(p)<0?i:G.players.indexOf(p);return[wx(C.cx(150)-C.half(150)-90),-.03,wz(30+k*95),Math.PI/2,false]}
  const n=G.players.length;return[(i-(n-1)/2)*1.1,-.35,.4,0,false]}
function syncHeroes(dt){
  for(const[id,f]of heroes)if(!G.players.find(p=>p.id===id&&p.cls===f.userData.cls)){world.remove(f);heroes.delete(id)}
  const show=G.screen==='combat'||G.screen==='lobby'||G.screen==='result'||G.screen==='map';
  G.players.forEach((p,i)=>{let f=heroes.get(p.id);if(!f){f=V.build(V.hero(p.cls));f.userData.cls=p.cls;f.userData.snap=true;f.traverse(o=>{if(o.isMesh)o.castShadow=true});world.add(f);heroes.set(p.id,f)}
    f.visible=show;if(!show)return;const u=f.userData,P0=u.parts,[tx,ty,tz,ry]=heroSpot(p,i);
    const scr=G.screen+(mgS?mgFor:'');if(u.snap||u.scr!==scr){f.position.set(tx,ty,tz);f.rotation.y=ry;u.snap=false;u.scr=scr}
    else{const k=1-Math.exp(-dt*6),moving=Math.hypot(tx-f.position.x,tz-f.position.z)>.05;f.position.x+=(tx-f.position.x)*k;f.position.z+=(tz-f.position.z)*k;let dr=ry-f.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));f.rotation.y+=dr*Math.min(1,dt*8);u.walk=moving||!!G.travel||(!!mgS&&!!mgS.walk&&G.mg&&G.mg.st==='play')}
    const ci=G.cine,casting=G.screen==='combat'&&ci&&ci.atk.pl===p&&(ci.st==='cast'||ci.st==='pan'),down=p.hp<=0&&G.screen==='combat',cheer=(G.phase==='won'&&G.screen==='combat')||(G.screen==='result'&&G.result==='win')||(!!G.mg&&G.mg.st==='done'&&G.mg.t>1.4&&!!(G.mg.d.pass||{})[p.slot]);
    u.hurtT=Math.max(0,(u.hurtT||0)-dt);
    let y=ty+(u.walk?Math.abs(Math.sin(time*10+i))*.05:Math.abs(Math.sin(time*2+i))*.01);if(cheer)y+=Math.max(0,Math.sin(time*7+i*1.3))*.25;f.position.y=y;
    f.rotation.x=down?-1.45:lerp(f.rotation.x,0,.2);if(G.screen==='result'&&G.result==='lose')f.rotation.x=-1.45;
    if(P0.arm_R){let a=Math.sin(time*2+i)*.05;if(casting){const t=ci.st==='cast'?clamp(ci.t/(ci.castT||1.7),0,1):1;a=t<.6?-2.6*sm(0,.6,t):lerp(-2.6,.6,sm(.6,.8,t))}else if(cheer)a=-2.8+Math.sin(time*7+i)*.3;else if(p.ch)a=-.6;P0.arm_R.rotation.x=a}
    if(P0.arm_L)P0.arm_L.rotation.x=cheer?-2.8+Math.cos(time*7+i)*.3:Math.sin(time*2+i+1)*.05;
    if(P0.leg_R&&P0.leg_L){const w=u.walk?Math.sin(time*10+i)*.6:0;P0.leg_R.rotation.x=w;P0.leg_L.rotation.x=-w}
    if(P0.head)P0.head.rotation.y=Math.sin(time*.6+i*2)*.15;
    if(u.hurtT>0){f.position.x+=Math.sin(u.hurtT*40)*.04}
    const onMap=G.screen==='map'&&!G.mg;f.scale.setScalar(onMap?.55:1)});
  /* a direction arrow at the tee for anyone pulling back their shot: direction only, never where it lands */
  /* each fighter's aim, drawn big at their tee while they pull on their phone: a sling, the ball drawn back, and an arrow the way it will leave */
  while(aimArrows.length<4){const g=mkSling();world.add(g);aimArrows.push(g)}
  const pv=new T.Vector3();
  /* the shooter's own last shot, a faint dashed line in their colour, so they can learn from it */
  G.players.forEach((p,i)=>{let L=trails[i];const C=G.mons[0]&&G.mons[0].course,on=!!p&&!!C&&!!p.trail&&G.screen==='combat'&&G.phase==='aim'&&!G.cine&&!G.inspect&&!p.fired&&p.hp>0&&(G.players.length===1||G.shooter===p.id);          // only the fighter whose turn it is sees their own last shot
    if(!on){if(L)L.visible=false;return}
    if(!L||L.userData.n!==p.trailN){if(L){world.remove(L);L.geometry.dispose()}const pts=[];{const tr=p.trail;let acc=0;pts.push(new T.Vector3(wx(tr[0][0]),.03+tr[0][2]*W,wz(tr[0][1])));for(let k=1;k<tr.length;k++){const a0=tr[k-1],b0=tr[k],seg=Math.hypot(b0[0]-a0[0],b0[1]-a0[1],b0[2]-a0[2]);let t0=10-acc;while(t0<=seg){const f=t0/seg;pts.push(new T.Vector3(wx(a0[0]+(b0[0]-a0[0])*f),.03+(a0[2]+(b0[2]-a0[2])*f)*W,wz(a0[1]+(b0[1]-a0[1])*f)));t0+=10}acc=(acc+seg)%10}}
      L=new T.Points(new T.BufferGeometry().setFromPoints(pts),new T.PointsMaterial({color:LANES[p.slot],size:Math.max(4,renderer.domElement.height/170),sizeAttenuation:false,transparent:true,opacity:.75,depthTest:false}));L.renderOrder=4;L.userData.n=p.trailN;world.add(L);trails[i]=L}
    L.visible=true});
  /* fighters whose ability or upgrade shows where the ball stops (and everyone in practice) see that ring on the big screen */
  while(aimRings.length<4){const r=new T.Mesh(new T.RingGeometry(.11,.15,28),new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.9,depthTest:false,side:T.DoubleSide}));r.rotation.x=-Math.PI/2;r.renderOrder=6;r.visible=false;world.add(r);aimRings.push(r)}
  aimRings.forEach((r,i)=>{const p=G.players[i],C=G.mons[0]&&G.mons[0].course;let on=!!p&&!!C&&G.screen==='combat'&&G.phase==='aim'&&!G.cine&&p.ch&&!p.fired;
    if(on){const ab=CLASSES[p.cls].ab[p.ab||0];on=!!(ab&&ab.sight)||!!(O.mods(p).eye)||!!G.practice}r.visible=on;if(!on)return;
    const a=p.aim*Math.PI/180,d=O.powD(C.len,p.pw||0);r.position.set(wx(O.launchX(p)+Math.cos(a)*d),.05,wz(O.COURSE.TEE+Math.sin(a)*d));r.material.color.set(LANES[p.slot])});
  aimArrows.forEach((g,i)=>{const p=G.players[i],C=G.mons[0]&&G.mons[0].course;const on=!!p&&!!C&&G.screen==='combat'&&G.phase==='aim'&&!G.cine&&p.ch&&!p.fired;g.visible=on;if(!on)return;const u=g.userData,pw=clamp(p.pw||0,0,1);
    g.position.set(wx(O.launchX(p)),.03,wz(O.COURSE.TEE)-.55);g.scale.setScalar(1.7);g.rotation.y=(p.aim-90)*Math.PI/180;poseSling(g,p,pw)})
}
/* a sling for the big screen: posts, a band, the ball drawn back and an arrow the way it will leave (local -z is forward) */
function mkSling(){const g=new T.Group(),lane=new T.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.95,depthTest:false}),wood=new T.MeshBasicMaterial({color:K0lin('#7a5a3a')}),band=new T.MeshBasicMaterial({color:K0lin('#e8c8a0')});
    const sh=new T.Shape();sh.moveTo(-.05,0);sh.lineTo(.05,0);sh.lineTo(.05,-.55);sh.lineTo(.13,-.55);sh.lineTo(0,-.78);sh.lineTo(-.13,-.55);sh.lineTo(-.05,-.55);sh.lineTo(-.05,0);
    lane.side=T.DoubleSide;const ar=new T.Mesh(new T.ShapeGeometry(sh),lane);ar.rotation.x=Math.PI/2;ar.position.set(0,.06,-.12);ar.renderOrder=5;g.add(ar);
    [-1,1].forEach(sd=>{const m=new T.Mesh(new T.BoxGeometry(.035,.22,.035),wood);m.position.set(sd*.16,.11,.02);g.add(m)});
    const ball=new T.Mesh(new T.SphereGeometry(.07,14,10),new T.MeshBasicMaterial({color:'#fff'}));ball.position.set(0,.08,.1);g.add(ball);
    const bands=[-1,1].map(()=>{const m=new T.Mesh(new T.CylinderGeometry(.008,.008,1,5),band);g.add(m);return m});
    g.userData={ar,ball,bands,lane};g.visible=false;return g}
function poseSling(g,p,pw,col){const u=g.userData;u.lane.color.set(LANES[p.slot]);u.ar.scale.set(1.3,1+pw*1.6,1);u.ar.position.z=-.14;u.ball.material.color.set(col||(CLASSES[p.cls]||{}).col||'#fff');u.ball.position.set(0,.08,.06+pw*.42);
  u.bands.forEach((b,k)=>{const sx=(k?1:-1)*.16,dx=u.ball.position.x-sx,dy=u.ball.position.y-.2,dz=u.ball.position.z-.02,L=Math.hypot(dx,dy,dz);b.position.set((sx+u.ball.position.x)/2,(.2+u.ball.position.y)/2,(.02+u.ball.position.z)/2);b.scale.set(1,L,1);b.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx,dy,dz).normalize())})}
/* ---------- balls ---------- */
function syncMarbles(dt){
  const live=new Set();for(const m of G.marbles){live.add(m.id);let o=marbles.get(m.id);if(!o){o=CG.marble(m.r,m.col);world.add(o);marbles.set(m.id,o)}
    const y=m.r*W+(m.off?m.z:Math.max(0,m.z))*W;o.position.set(wx(m.x),y,wz(m.y));const b=o.userData.ball;b.rotation.x-=m.vy*W*dt/(m.r*W);b.rotation.z-=m.vx*W*dt/(m.r*W);
    if(Math.random()<.5)P(o.position.x,o.position.y,o.position.z,0,.2,0,.35,m.col,0)}
  for(const[id,o]of marbles)if(!live.has(id)){world.remove(o);marbles.delete(id)}}
/* ---------- events from the rules ---------- */
const SFX={kick:1,blunt:1,lock:1,core:1,launch:1,sink:1,miss:1,comboEnd:1,monHit:1,monFlinch:1,monAtk:1,monSlam:1,hurt:1,heal:1,enrage:1,monDie:1,intro:1,boon:1,win:1,lose:1,cast:1};
const fxT={drone:'',trav:false,mg:''};
const heroAt=pl=>{const f=heroes.get(pl.id);return f?f.position:new T.Vector3()};
function drainEvents(){
  const played={};let ticks=0;
  for(const e of G.ev){
    if(e.k==='tick'){if(ticks++<3)O.sfx('tick',{n:e.n||0})}else if(SFX[e.k]&&!played[e.k]){played[e.k]=1;O.sfx(e.k,e.k==='cast'?{cls:e.pl.cls,rep:e.rep}:e)}
    const X=e.x!=null?wx(e.x):0,Z=e.y!=null?wz(e.y):0;
    if(e.k==='sink'){for(let i=0;i<30+e.dmg;i++)P(X+(Math.random()-.5)*.1,.02,Z+(Math.random()-.5)*.1,(Math.random()-.5)*.8,2+Math.random()*3.5,(Math.random()-.5)*.8,.9,i%3?e.col:'#fff3e6');ring3(X,.03,Z,e.col,.8);shake=Math.max(shake,Math.min(1,.25+e.dmg/50));
      if(e.combo>1){const c=$('combo');c.textContent='Chain ×'+e.combo;c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}}
    else if(e.k==='comboEnd')$('combo').classList.remove('pop');
    else if(e.k==='burst')burst3(X,.12,Z,e.col,e.n);
    else if(e.k==='ring')ring3(X,.04,Z,e.col,(e.R||60)*W*1.2);
    else if(e.k==='text')floatText(X,.45,Z,e.txt,e.col);
    else if(e.k==='shake')shake=Math.max(shake,e.v);
    else if(e.k==='tick')burst3(X,.1,Z,'#ffe6c8',3,1.2);
    else if(e.k==='kick'){ring3(X,.06,Z,'#ffb54a',.6);burst3(X,.2,Z,'#ffd9a0',12,3);shake=Math.max(shake,.16)}
    else if(e.k==='blunt'){ring3(X,.06,Z,'#ff5a3a',1.4);burst3(X,.3,Z,'#ff9a7a',30,4);shake=Math.max(shake,.4)}
    else if(e.k==='core'||e.k==='lock'){ring3(X,.06,Z,'#9fd0ff',e.k==='core'?1.6:.8);burst3(X,.3,Z,'#cfe6ff',e.k==='core'?40:14,4)}
    else if(e.k==='round')O.sfx('turn');
    else if(e.k==='mgHit'){O.sfx('mgHit');shake=Math.max(shake,.25)}
    else if(e.k==='mgOut'){O.sfx('mgOut');shake=Math.max(shake,.5)}
    else if(e.k==='flash'&&shakeOn){const f=$('flash');f.style.transition='none';f.style.opacity=e.v||.45;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0})}
    else if(e.k==='hurt'){const f=heroes.get(e.pl.id);if(f){f.userData.hurtT=.6;const c=e.trap?f.position.clone().add(new T.Vector3(0,2,0)):monChest(),p=f.position;for(let i=0;i<(e.trap?0:24);i++){const t=i/24;P(lerp(c.x,p.x,t),lerp(c.y,1,t)+Math.sin(t*Math.PI)*1.2,lerp(c.z,p.z,t),0,0,0,.25+t*.25,O.fireCol||'#ff7a2a',0)}
        setTimeout(()=>{burst3(p.x,1,p.z,'#ff4a30',40,4);burst3(p.x,1,p.z,'#fff3e6',14,3);if(e.v)floatText(p.x,1.9,p.z,'-'+e.v,'#ff5a40',true)},220)}}
    else if(e.k==='monSlam'){const c=monChest();burst3(c.x,.3,c.z+1,O.fireCol||'#ff7a2a',e.rank!=='lesser'?60:24,6);shake=Math.max(shake,e.rank!=='lesser'?.9:.5)}
    else if(e.k==='heal'){const p=heroAt(e.pl);for(let i=0;i<18;i++)P(p.x+(Math.random()-.5)*.6,Math.random()*.3,p.z+(Math.random()-.5)*.6,0,1.3+Math.random(),0,.9+Math.random()*.5,e.col||'#5fb3a1',0)}
    else if(e.k==='monHit'&&monG){const c=monChest();setTimeout(()=>{monG.userData.hitT=1;shake=1;burst3(c.x,c.y,c.z+.8,e.col,70,6);burst3(c.x,c.y,c.z+.8,'#fff3e6',30,4);
        const b=$('bigNum');b.textContent='-'+e.dmg;b.style.color=e.col;b.classList.remove('show');void b.offsetWidth;b.classList.add('show')},150)}
    else if(e.k==='monFlinch'&&monG){monG.userData.hitT=Math.max(monG.userData.hitT,.7);const c=monChest();burst3(c.x,c.y,c.z+.6,e.col,24,4);if(e.dmg)floatText(c.x,c.y+.6,c.z,'-'+e.dmg,e.col,true)}
    else if(e.k==='enrage'&&monG){monG.userData.hitT=1;const c=monChest();burst3(c.x,c.y,c.z,'#ff2a1a',60,6);shake=1}
    else if(e.k==='boon'){for(const f of heroes.values())for(let i=0;i<14;i++)P(f.position.x+(Math.random()-.5)*.5,Math.random()*.3,f.position.z+(Math.random()-.5)*.5,0,1.2+Math.random(),0,1+Math.random()*.5,'#f0cc5c',0)}
    else if(e.k==='cast'){const p=heroAt(e.pl),col=CLASSES[e.pl.cls].col;for(let i=0;i<30;i++){const a=i/30*6.283;P(p.x+Math.cos(a)*.5,.05,p.z+Math.sin(a)*.5,0,1.5+Math.random(),0,.8,col,0)}}
  }
  G.ev.length=0}
/* ---------- camera ---------- */
/* the overview: a fixed angle onto the course, pulled back until the tee, the far wall and the monster all fit on screen */
let fitKey='',camSnap=false,camMode='';const fitP=new T.Vector3(),fitT=new T.Vector3();
function fitOver(C,wide,asp){const L=C.len*W,pts=[];for(const y of[-60,C.len*.5,C.len])for(const s of[-1,1])pts.push(new T.Vector3(wx(C.cx(y)+s*(C.half(y)+20)),0,wz(y)));
  pts.push(new T.Vector3(wx(C.cx(C.len)),monH*1.05,wz(C.len+170)),new T.Vector3(wx(C.cx(C.len))-1.5,0,wz(C.len+260)),new T.Vector3(wx(C.cx(0)-C.half(0)-90),1.4,wz(30)));
  const c=new T.Vector3();pts.forEach(p=>c.add(p));c.multiplyScalar(1/pts.length);c.y=.3;
  const dir=G.inspect?new T.Vector3(0,1,.25).normalize():wide?new T.Vector3(.62,.72,.3).normalize():new T.Vector3(0,.82,.58).normalize(),cm=new T.PerspectiveCamera(wide?42:50,asp,.05,90);
  let lo=2,hi=60;for(let i=0;i<22;i++){const d=(lo+hi)/2;cm.position.copy(c).addScaledVector(dir,d);cm.lookAt(c);cm.updateMatrixWorld();let ok=true;for(const p of pts){const q=p.clone().project(cm);if(Math.abs(q.x)>.9||q.y>.72||q.y<-.82){ok=false;break}}if(ok)hi=d;else lo=d}
  fitP.copy(c).addScaledVector(dir,hi);fitT.copy(c)}
/* the straight-on views once someone has spun: from behind the tee looking up the whole course. Aiming drops lower and leans toward the fighter's lane. */
const strP=new T.Vector3(),strT=new T.Vector3();let strKey='';
function fitStraight(C,asp,wide,aimX){const pts=[];for(const y of[-40,O.COURSE.TEE,C.len*.5,C.len])for(const s of[-1,1])pts.push(new T.Vector3(wx(C.cx(y)+s*(C.half(y)+16)),0,wz(y)));
  pts.push(new T.Vector3(wx(C.cx(C.len)),monH*.9,wz(C.len+150)));
  const c=new T.Vector3();for(let i=0;i<pts.length-1;i++)c.add(pts[i]);c.multiplyScalar(1/(pts.length-1));c.y=0;if(aimX!=null)c.x=c.x*.5+aimX*.5;
  const dir=(aimX!=null?new T.Vector3(0,.58,.81):new T.Vector3(0,.5,.87)).normalize(),cm=new T.PerspectiveCamera(wide?42:50,asp,.05,90);
  if(aimX!=null)c.z+=(wz(C.len)-wz(0))*.08;           // lean the view a little up the course when aiming
  let lo=2,hi=60;for(let i=0;i<22;i++){const d=(lo+hi)/2;cm.position.copy(c).addScaledVector(dir,d);cm.lookAt(c);cm.updateMatrixWorld();let ok=true;for(const p of pts){const q=p.clone().project(cm);if(Math.abs(q.x)>.97||q.y>.8||q.y<-.98){ok=false;break}}if(ok)hi=d;else lo=d}
  strP.copy(c).addScaledVector(dir,hi);strT.copy(c)}
/* the course preview can be turned and zoomed: from the big screen (drag, wheel, pinch) or from the phone that opened it */
const LOOK={yaw:0,el:0,zoom:1,px:0,pz:0};O.look=LOOK;
O.lookReset=()=>{LOOK.yaw=0;LOOK.el=0;LOOK.zoom=1;LOOK.px=0;LOOK.pz=0};
O.lookSet=v=>{if(!Array.isArray(v))return;const n=(x,d)=>isFinite(+x)?+x:d;LOOK.yaw=clamp(n(v[0],0),-Math.PI,Math.PI);LOOK.el=clamp(n(v[1],0),-1.2,.6);LOOK.zoom=clamp(n(v[2],1),.8,5);LOOK.px=clamp(n(v[3],0),-8,8);LOOK.pz=clamp(n(v[4],0),-14,14)};
O.lookNudge=(dy,de,zm,dx,dz)=>{const c=Math.cos(LOOK.yaw0+LOOK.yaw||0),sn=Math.sin(LOOK.yaw0+LOOK.yaw||0),k=1/Math.max(.8,LOOK.zoom);
  O.lookSet([LOOK.yaw+(dy||0),LOOK.el+(de||0),LOOK.zoom*(zm||1),LOOK.px+((dx||0)*c+(dz||0)*sn)*k,LOOK.pz+(-(dx||0)*sn+(dz||0)*c)*k]);if(Math.abs(LOOK.yaw)>=Math.PI)LOOK.yaw=((LOOK.yaw+Math.PI*3)%(Math.PI*2))-Math.PI};
function orbit(){const off=fitP.clone().sub(fitT),d0=off.length(),yaw0=Math.atan2(off.x,off.z),el0=Math.asin(clamp(off.y/d0,-1,1));LOOK.yaw0=yaw0;
  const yaw=yaw0+LOOK.yaw,el=clamp(el0+LOOK.el,.2,1.5),d=d0/LOOK.zoom;wantTgt.set(fitT.x+LOOK.px,fitT.y,fitT.z+LOOK.pz);
  wantPos.set(wantTgt.x+Math.sin(yaw)*Math.cos(el)*d,wantTgt.y+Math.sin(el)*d,wantTgt.z+Math.cos(yaw)*Math.cos(el)*d)}
let wasIns=false;
function direct(dt){
  const asp=canvas.clientWidth/Math.max(1,canvas.clientHeight),wide=asp>=1.2,mo=G.mons[0],C=mo&&mo.course;let st=.55;
  if(G.screen==='combat'&&C){const L=C.len*W,k=Math.max(1,1.78/asp)*Math.max(1,L/14),ci=G.cine;
    const over=()=>{const key=C.id+':'+monFor+':'+asp.toFixed(2)+':'+(G.inspect?1:0);if(fitKey!==key){fitKey=key;fitOver(C,wide,asp)}wantPos.copy(fitP);wantTgt.copy(fitT);if(G.inspect)orbit()};
    if(G.inspect!==wasIns){wasIns=G.inspect;if(G.inspect)O.lookReset()}
    if(G.phase==='intro'){const t=G.introT;if(t<1.6){const m=monChest();wantPos.set(m.x+3.2,monH*.7,m.z+5);wantTgt.copy(m);st=.4}else{over();st=.8}}
    else if(ci&&(ci.st==='cast')){const f=heroes.get(ci.atk.pl.id);if(f){wantPos.set(f.position.x+1.9,1.25,f.position.z-2.3);wantTgt.set(f.position.x,.85,f.position.z);st=.35}}
    else if(ci&&(ci.st==='pan'||ci.st==='flight')){const fx=wx(ci.fx),fz=wz(ci.fy),dx=ci.dir[0],dz=-ci.dir[1],multi=ci.multi;
      if(multi){wantPos.set(fx*.4+(wide?3:0),5.5,fz+5.5);wantTgt.set(fx*.4,0,fz-2)}
      else{const near=ci.close;wantPos.set(fx-dx*(near?1.8:3)+(wide?.6:0),near?1.3:2.2,fz-dz*(near?1.8:3));wantTgt.set(fx+dx*1.4,.1,fz+dz*1.4)}st=ci.st==='pan'?.5:.28}
    else if(ci&&ci.st==='hit'){const m=monChest();wantPos.set(m.x+3.5,monH*.75,m.z+5.5);wantTgt.copy(m);st=.35}
    else if(G.phase==='boss'){const m=monChest();if(wide){wantPos.set(7*k,6.5*k,m.z+7*k);wantTgt.set(0,1,m.z+3)}else{wantPos.set(0,7,m.z+9);wantTgt.set(0,1,m.z+2)}st=.7}
    else if(G.phase==='aim'&&!ci&&!G.inspect&&!G.practice||(G.phase==='aim'&&!ci&&G.practice&&!G.inspect)){const live=G.players.filter(p=>!p.fired&&p.hp>0&&!p.away&&(G.players.length===1||!G.shooter||p.id===G.shooter)),ch=live.filter(p=>p.ch),rd=live.filter(p=>p.rdy||p.ch);
      if(rd.length){const aimX=ch.length===1?wx(O.launchX(ch[0])):null,key=C.id+':'+asp.toFixed(2)+':'+(aimX==null?'s':aimX.toFixed(2));if(key!==strKey){strKey=key;fitStraight(C,asp,wide,aimX)}wantPos.copy(strP);wantTgt.copy(strT);st=aimX==null?.32:.3}
      else{over();st=.7}}
    else{over();st=G.inspect?.14:.7}}
  else if(G.screen==='map'&&mapG&&mapG.visible&&MAP[G.node]&&MAP[G.node]._p){const tr=G.travel;let p=MAP[G.node]._p;if(tr&&MAP[tr.to]._p){const A=MAP[tr.from]._p,B2=MAP[tr.to]._p,e=sm(0,1,tr.t);p=[lerp(A[0],B2[0],e),lerp(A[1],B2[1],e)]}
    const k=wide?1:1.5;wantPos.set(MPX+p[0]*.5,6.2*k,p[1]+5.2*k);wantTgt.set(MPX+p[0]*.6,0,p[1]-2.6);st=.9}
  else if(mgS&&podOn()){const k=wide?1:1.5;wantPos.set(MGX,1.5*k,MGZ+PODZ+3.6*k);wantTgt.set(MGX,.75,MGZ+PODZ);st=.5}
  else if(mgS){const[p,t]=mgS.cam,k=wide?1:1.45;wantPos.set(MGX+p[0]*k,p[1]*k,MGZ+p[2]*k);wantTgt.set(MGX+t[0],t[1],MGZ+t[2]);st=.6}
  else{const n=Math.max(1,G.players.length);wantPos.set(0,1.6,wide?5.2:7.5);wantTgt.set(0,.85,0);st=.8}
  {const md=G.screen+(G.mg&&G.screen==='map'?'mg':'');if(md!==camMode){camMode=md;camSnap=true}}
  if(camSnap){camSnap=false;camPos.copy(wantPos);camTgt.copy(wantTgt);camVel.set(0,0,0);tgtVel.set(0,0,0)}
  damp(camPos,wantPos,camVel,st,dt);damp(camTgt,wantTgt,tgtVel,st*.8,dt);
  cam.position.copy(camPos);if(shake>0&&shakeOn){cam.position.x+=(Math.random()-.5)*shake*.12;cam.position.y+=(Math.random()-.5)*shake*.12}shake=Math.max(0,shake-dt*2.2);cam.lookAt(camTgt);
  const fov=wide?42:50;if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix()}
  moon.position.set(camTgt.x-4,10,camTgt.z+5);moon.target.position.copy(camTgt)}
/* ---------- HUD ---------- */
const nmAnimal=id=>{const q=G.players.find(p=>p.id===id);return q?'the '+CLASSES[q.cls].animal:'one of you'};
/* ---------- the monsters' reels: at the start of every round each monster pulls three reels, on the big screen, and the move it lands is shown with what it will do ---------- */
const foeS=new Map();let foeBox=null;
function foes(){
  if(!foeBox){foeBox=$('foes');if(!foeBox)return}
  const fight=G.screen==='combat'&&!G.practice&&!G.mg&&G.phase==='boss'&&G.mons.some(m=>m.atk&&m.atk.it),now=performance.now()/1000;
  foeBox.hidden=!fight;if(!fight)return;
  const live=G.mons.filter(m=>!m.dead&&m.hp>0);foeBox.classList.toggle('many',live.length>2);
  for(const [uid,f] of foeS)if(!live.some(m=>m.uid===uid)){f.el.remove();foeS.delete(uid)}
  live.forEach((m,idx)=>{const it=(m.intent&&!m.intent.pend?m.intent:null)||(m.atk&&m.atk.it)||null;let f=foeS.get(m.uid);
    if(!f){const S=O.movesOf(m.id),el=document.createElement('div');el.className='foe';
      const faces=S.mv.map(q=>q.g).concat(S.blank?['blank']:[]);
      el.innerHTML='<div class="fn"></div><div class="reels"></div><div class="fm"><b></b><em></em></div><div class="fd"></div><div class="fe"></div>';el.querySelector('.fn').textContent=m.name;
      const rows=S.rank==='lesser'?[1]:[0,1,2],rs=el.querySelector('.reels'),reels=[];rs.classList.toggle('one',rows.length===1);for(let k=0;k<3;k++){const col=document.createElement('div');col.className='col';const cells=rows.map(row=>{const r=document.createElement('i');r.className='rl';const fs=faces.map(g=>{const sv=g==='blank'?document.createElement('span'):O.glyphEl(g,40);if(g==='blank')sv.className='blank';r.appendChild(sv);return sv});col.appendChild(r);return{r,fs,cell:k*3+row}});rs.appendChild(col);reels.push({col,cells})}
      foeBox.appendChild(el);f={el,reels,seq:-1,S,shown:null};foeS.set(m.uid,f)}
    f.el.style.order=idx;
    if(it&&it.seq!==f.seq){f.seq=it.seq;f.it=it;f.t0=now+.25+idx*.45;f.stopped=0;f.el.classList.remove('on','tri','nom');f.el.classList.add('spin');f.reels.forEach(R=>R.cells.forEach(C=>C.r.classList.remove('hit')))}
    const show=f.it;f.el.classList.toggle('act',G.phase==='boss'&&G.mons[G.actor]===m);f.el.classList.toggle('done',G.phase==='boss'&&!m.intent&&G.mons[G.actor]!==m);f.el.classList.toggle('none',!show);
    if(!show)return;
    const face=c=>{const v=show.reels[c];return v<0||v==null?f.S.mv.length:v};
    let n=0;f.reels.forEach((R,k)=>{const stop=f.t0+.55*k+.5,st=now>=stop;if(st)n++;R.cells.forEach((C,j)=>{const fi=st?face(C.cell):Math.floor(now*14+k*3+j*5)%C.fs.length;C.fs.forEach((e,i)=>{e.style.display=i===fi?'':'none'})});R.col.classList.toggle('st',st)});
    if(n>f.stopped){f.stopped=n;O.sfx&&O.sfx(n===3?(show.pw>1.2?'mgGood':'mgCount'):'mgTap')}
    if(n===3&&!f.el.classList.contains('on')){const mv=f.S.mv[show.mv];f.el.classList.remove('spin');f.el.classList.add('on');f.el.classList.toggle('tri',show.pw>1.2);f.el.classList.toggle('nom',show.n===0);
      const hit=new Set(show.cells||[]);f.reels.forEach(R=>R.cells.forEach(C=>C.r.classList.toggle('hit',hit.has(C.cell))));
      f.el.querySelector('.fm b').textContent=mv.name;f.el.querySelector('.fm em').textContent=(mv.sp?'Special · ':'')+O.powText(show.pw,show.n);f.el.querySelector('.fd').textContent=mv.line;f.key=''}
    if(n===3){const key=[show.t,show.t2,show.dmg,show.b,show.fv].join('|');if(key!==f.key){f.key=key;f.el.querySelector('.fe').textContent=O.intentText(m.id,show,nmAnimal)}}})}
function aimPow(){const box=$('aimPow');if(!box)return;const show=(G.screen==='combat'&&G.phase==='aim'&&!G.cine)||(G.mg&&G.mg.k==='shrine'&&G.mg.st==='play');
  const ch=show?G.players.filter(p=>p.ch&&!p.fired&&p.hp>0):[];box.hidden=!ch.length;if(!ch.length)return;
  while(box.children.length<ch.length){const r=document.createElement('div');r.className='ap';r.innerHTML='<b></b><div class="apBar"><i></i></div><em></em>';box.appendChild(r)}
  [...box.children].forEach((r,k)=>{const p=ch[k];r.hidden=!p;if(!p)return;const cl=CLASSES[p.cls];r.style.setProperty('--lc',LANES[p.slot]);r.querySelector('b').textContent=cl.animal+' · '+(O.RAMPS[p.rp||0]||O.RAMPS[0]).short+(p.lk?' · aim locked':' · steering');
    const pw=clamp(p.pw||0,0,1);r.querySelector('i').style.width=(pw*100)+'%';r.querySelector('em').textContent=Math.round(pw*100)+'%'})}
function hud(){foes();aimPow();
  const C=G.cine,fight=G.screen==='combat',mon=fight?G.mons[0]:null,lead=mon&&MONSTERS[mon.id],aim=fight&&G.phase==='aim',wait=aim?G.players.filter(p=>p.hp>0&&!p.fired).length:0,left=aim&&!C&&!G.queue.length&&G.players.length>1&&!G.practice?Math.ceil(O.TURN-G.turnT):99;
  let title='',sub='',threat=false,tag='';
  if(fight&&G.phase==='intro'&&G.introT>.5&&lead){if(G.practice){title='The practice yard';sub='Nothing here strikes back'}else{title=lead.name;sub=lead.title||({lesser:'blocks the way',mini:'a champion of the deep',boss:'the master of this place'})[mon.rank]}}
  else if(G.screen==='map'&&G.clock-(G.runT||-9)<3.4&&!G.mg){const d=O.DUNGEONS[G.dung];title=d.name;sub=d.blurb}
  else if(fight&&G.phase==='boss'&&G.mons[G.actor]&&G.mons[G.actor].atk&&G.mons[G.actor].atk.t>=-O.FOE_HOLD&&G.mons[G.actor].atk.t<G.mons[G.actor].atk.W+.5){const am=G.mons[G.actor],q=am.atk;title=am.name;threat=true;const mon=am;
    if(q.it&&q.it.mv!=null){const mv=O.movesOf(mon.id).mv[q.it.mv];title=mv.name;tag=q.it.pw>1.2?'Triple!':mv.sp?'Special':'';sub=O.intentText(mon.id,q.it,nmAnimal)+'.'}
    else sub=(q.target?`strikes the ${CLASSES[q.target.cls].animal}${q.t2?' and the '+CLASSES[q.t2.cls].animal:''}`:'strikes the whole party')+(q.dmg?` for ${q.dmg}`:'')+(O.TERR[q.x]?' and '+O.TERR[q.x].it:'')}
  else if(C&&!C.rep&&(C.st==='cast'||C.st==='pan')){title=C.atk.ab.name;sub=`${CLASSES[C.atk.pl.cls].animal} ${CLASSES[C.atk.pl.cls].name}`+(C.atk.ab.m?' · '+O.SIZE_NAMES[O.mSize(C.atk.ab.m.r)].toLowerCase()+' ball':'')}
  const ter=mon&&mon.terr;
  const key=[G.screen,!!G.dec,!!G.mg,G.phase,G.round,ter?ter.k+ter.t:'',mon?Math.ceil(mon.hp):0,mon?mon.enraged:0,mon&&mon.stun,mon&&mon.intent?mon.intent.t+mon.intent.t2+mon.intent.dmg:0,mon&&mon.burn?mon.burn.d+':'+mon.burn.t:0,G.combo,G.msg,title,sub,tag,wait,left<=20?left:0,G.practice].join('|');
  if(key===hudKey)return;hudKey=key;
  $('hudTop').hidden=!fight||G.phase==='intro'||!mon||mon.dead||!!(C&&C.st==='cast'&&!C.rep);$('hudMsg').hidden=G.screen==='lobby'||G.screen==='result'||!G.msg||!!title||(G.screen==='map'&&(!!G.dec||!!G.mg));$('hudMsg').textContent=G.msg;
  if(mon){const d=MONSTERS[mon.id];$('bossName').textContent=mon.name+(d.title?', '+d.title:'')+(mon.enraged?' · enraged':'');$('bossBar').style.width=(100*mon.hp/(mon.max||1))+'%';$('bossHpN').textContent=`${Math.ceil(mon.hp)} / ${mon.max}`;
    const it=mon.intent,nm=id=>{const q=G.players.find(p=>p.id===id);return q?'the '+CLASSES[q.cls].animal:'one of you'},bi=$('bossIt');bi.className=mon.stun||!it?'':'ic '+(it.t?'one':'all');
    bi.textContent=(mon.burn?`Burning for ${mon.burn.d}. `:'')+(G.practice?'A practice target. It never strikes back.':mon.stun?'Stunned':it?(it.pend?'Pulls its reels on its turn'+(it.b?' (blunted)':''):it.mv!=null?'Next: '+O.movesOf(mon.id).mv[it.mv].name:`${it.dmg} to ${it.t?nm(it.t)+(it.t2?' and '+nm(it.t2):''):'everyone'} next`+(it.b?' (blunted)':'')+(O.TERR[it.x]?', and '+O.TERR[it.x].it:'')):'');
    const tt=$('terrTxt');tt.hidden=!ter;if(ter){const T2=O.TERR[ter.k];tt.textContent=`${T2.name} on the course. ${T2.note} ${ter.t} round${ter.t===1?'':'s'} left.`}
    $('roundTxt').textContent=(G.practice?'Practice':`Round ${G.round}`)+(aim&&wait&&G.players.length>1?` · ${wait} to act`:'')+(left<=20?` · ${Math.max(1,left)} s`:'')}
  const tcn=$('hudTitle');tcn.hidden=!title;$('titleMain').textContent=title;{const tt=$('titleTag');tt.hidden=!tag;tt.textContent=tag;tt.classList.toggle('tri',tag==='Triple!')}$('titleSub').textContent=sub;tcn.classList.toggle('intro',G.phase==='intro'||G.screen==='map'||threat);tcn.classList.toggle('threat',threat);$('hud').classList.toggle('threat',fight&&G.phase==='boss');if(G.screen!=='combat'||(G.combo||0)<2)$('combo').classList.remove('pop')}


/* ---------- the dungeon map as a voxel diorama: a platform for every floor, stone paths between, the party walking the route ---------- */
const MPX=-60;let mapG=null,mapBuilt=-1,mapNodes=[],mapLabels=[],mapRings=[];
const KIND_COL={battle:'#5a4a52',mini:'#6a3a3a',boss:'#7a2a24',trap:'#5a5030',treasure:'#6a5a2a',shrine:'#3a5a5a',forge:'#5a3a2a',tome:'#3a3a5a',gamble:'#4a5a2a',start:'#4a4550'};
function propFor(n){const k=O.nodeKind(n),pal=Object.assign({},stonePal,{t:{c:'#d8cdb2',n:.08},sp:{c:'#9aa3ad',n:.05},cup:{c:'#8a2a24',n:.06}});
  if(n.type==='battle'&&n.enc){const id=n.enc[0],m=V.build(V.monster(id)),bb=new T.Box3().setFromObject(m),sz=bb.getSize(new T.Vector3()),hgt=k==='boss'?2.4:k==='mini'?1.5:.95,s=hgt/Math.max(.2,sz.y,sz.x*.7,sz.z*.7);m.scale.setScalar(s);m.position.y=-bb.min.y*s;m.rotation.y=Math.PI;const g=new T.Group();g.add(m);return g}
  return vb(P2=>{
    if(k==='trap'){for(let x=-4;x<4;x+=2)for(let z=-4;z<4;z+=2){P2.box(x,x,0,3,z,z,'sp');P2.set(x,4,z,'il')}}
    else if(k==='treasure'){P2.box(-4,3,0,4,-3,2,'w');P2.box(-4,3,5,6,-3,2,'wd');P2.box(-1,0,2,4,3,3,'g');for(const x of[-4,3])P2.box(x,x,0,6,-3,2,'i')}
    else if(k==='shrine'){P2.box(-3,2,0,1,-3,2,'d');P2.box(-1,0,2,9,-1,0,'t');P2.box(-3,2,10,11,-2,1,'t');P2.box(-1,0,12,13,-1,0,'f');P2.set(0,14,0,'f2')}
    else if(k==='forge'){P2.box(-3,2,0,2,-2,1,'i');P2.box(-5,4,3,4,-3,2,'il');P2.box(4,6,4,4,-1,0,'il');P2.box(-2,2,5,5,-1,0,'f')}
    else if(k==='tome'){P2.box(-1,0,0,6,-1,0,'w');P2.box(-4,3,7,7,-3,1,'wd');P2.box(-3,2,8,8,-2,0,'t')}
    else if(k==='gamble'){P2.box(-5,4,0,3,-3,2,'w');P2.box(-6,5,4,4,-4,3,'r');for(const x of[-4,-1,2])P2.box(x,x+1,5,7,-1,0,'cup')}
    else if(k==='start'){for(const x of[-6,5])P2.box(x,x+1,0,12,-1,0,'s');P2.box(-6,6,12,13,-1,0,'d')}
  },.08,pal)}
/* each dungeon's ground on the map: a terrain it is known for, laid in patches between the paths */
const MAPTERR=[['bone','#d8cdb2',0],['moss','#4a6a2a',0],['water','#2a6a7a',1],['lava','#ff6a20',1],['web','#d8d8e8',0],['snow','#e8f0f8',0],['sludge','#7a9a20',1],['water','#2a7a5a',1],
 ['sand','#d8b878',0],['bog','#1e4a3a',1],['flag','#6a6e7a',0],['moss','#9a4ab0',0],['water','#3a4a8a',1],['brass','#c8a050',0],['ash','#8a8a8a',0],['crystal','#ff70ff',1],['water','#10304a',1],['blood','#8a1a1e',1],['lava','#ffa030',1],['void','#7040c0',1]];
function buildMapG(){if(mapG){world.remove(mapG);mapG=null}mapNodes=[];for(const L of mapLabels)L.remove();mapLabels=[];mapRings=[];
  mapG=new T.Group();mapG.position.x=MPX;world.add(mapG);const M=MAP;if(!M.length)return;const R=O.ROOMS[G.dung]||O.ROOMS[0],TR=MAPTERR[G.dung]||MAPTERR[0],P=Object.assign(roomPal(),{t:{c:TR[1],n:.08},tg:{c:TR[1],glow:1},pl0:{c:R[2],n:.08}});
  let zmin=1e9,zmax=-1e9;for(const n of M){zmin=Math.min(zmin,n.z);zmax=Math.max(zmax,n.z)}
  for(const n of M){n._p=[n.x+(n.jx||0)*1.2,n.z+(n.jy||0)*1.2]}
  const segs=[];for(const n of M)for(const j of n.next)segs.push([n._p,M[j]._p]);
  const clear=(x,z,r)=>{for(const n of M)if(Math.hypot(x-n._p[0],z-n._p[1])<r+.9)return false;for(const[a,b]of segs){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<r+.35)return false}return true};
  /* terrain patches: blobs of the dungeon's ground, glowing where it is water, lava and the like */
  const blobs=[];for(let k=0;k<70&&blobs.length<16;k++){const x=(V.hash(k,3,G.dung)-.5)*15,z=zmin-3+V.hash(k,7,G.dung)*(zmax-zmin+6),r=.6+V.hash(k,9,G.dung)*1.1;if(clear(x,z,r))blobs.push([x,z,r])}
  const z0=Math.floor(zmin/.4)-12,z1=Math.ceil(zmax/.4)+10;
  addv(mapG,vb(P2=>{for(let x=-24;x<24;x++)for(let z=z0;z<z1;z++){const wx=(x+.5)*.4,wz=(z+.5)*.4;const inb=blobs.some(([bx,bz,br])=>Math.hypot(wx-bx,wz-bz)<br+V.hash(x,z,4)*.25);
      if(inb){P2.set(x,0,z,TR[2]?(V.hash(x,z,8)<.25?'tg':'t'):'t');continue}if(V.hash(x,z,9)<.05)continue;P2.set(x,0,z,V.hash(x,z,5)<.3?'d':'s');if(x===-24||x===23||z===z0||z===z1-1){P2.set(x,1,z,'w');P2.set(x,2,z,V.hash(x,z,2)<.5?'w':'ad')}}},.4,P)).position.y=-.5;
  /* the dungeon's set pieces scattered between the floors */
  const D=DECOR[G.dung]||DECOR[0];let placed=0;for(let k=0;k<160&&placed<26;k++){const x=(V.hash(k,11,G.dung)-.5)*17,z=zmin-2.5+V.hash(k,13,G.dung)*(zmax-zmin+5);if(!clear(x,z,.35))continue;const[kd,c]=D[k%2],p=prop(kd,c);const sc=.9+V.hash(k,17,1)*.6;p.scale.setScalar(sc);p.position.set(x,-.1,z);p.rotation.y=V.hash(k,19,1)*6;mapG.add(p);placed++}
  for(const n of M){const[px,pz]=n._p,kind=O.nodeKind(n),boss=kind==='boss';
    const pl=vb(P2=>{const Rr=boss?9.2:7.2;for(let x=-10;x<10;x++)for(let z=-10;z<10;z++){const d=Math.hypot(x+.5,z+.5);if(d<Rr){P2.box(x,x,-6,-1,z,z,'pl0');P2.set(x,0,z,d>Rr-1.4?'ad':'pl');if(boss&&d>Rr-2.6&&d<Rr-1.4)P2.set(x,1,z,'pl0')}}},.1,Object.assign({},P,{pl:{c:KIND_COL[kind]||'#4a4550',n:.1}}));
    pl.position.set(px,0,pz);mapG.add(pl);const pr=propFor(n);if(pr){pr.position.set(px,.1,pz);mapG.add(pr)}
    if(boss)for(const s0 of[-1,1]){const br=prop('candle','#3a383e');br.scale.setScalar(1.4);br.position.set(px+s0*1.05,.1,pz+.5);mapG.add(br)}
    const hit=new T.Mesh(new T.CylinderGeometry(.75,.75,1.2,10),new T.MeshBasicMaterial({visible:false}));hit.position.set(px,.5,pz);hit.userData.node=M.indexOf(n);mapG.add(hit);mapNodes.push(hit);
    const ring=new T.Mesh(new T.RingGeometry(boss?1:.78,boss?1.12:.9,28),new T.MeshBasicMaterial({color:'#ffd27a',transparent:true,side:T.DoubleSide,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.set(px,.13,pz);ring.visible=false;mapG.add(ring);mapRings[M.indexOf(n)]=ring}
  for(const n of M)for(const j of n.next){const m=M[j],a=n._p,b=m._p,L=Math.hypot(b[0]-a[0],b[1]-a[1]),st=Math.ceil(L/.3);const path=new T.Group();path.userData.edge=[M.indexOf(n),j];
    for(let k=2;k<st-1;k++){const f=k/st,s2=new T.Mesh(new T.BoxGeometry(.26,.08,.22),new T.MeshBasicMaterial({color:K.lin(R[2])}));s2.position.set(a[0]+(b[0]-a[0])*f+(V.hash(k,j,5)-.5)*.06,.03,a[1]+(b[1]-a[1])*f);s2.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1])+(V.hash(k,j,3)-.5)*.4;s2.receiveShadow=true;path.add(s2)}mapG.add(path)}
  mapG.traverse(o=>{if(o.isMesh)o.castShadow=true})}
function syncMap(){const on=G.screen==='map'&&!(G.mg)&&MAP.length>1;if(!on){if(mapG)mapG.visible=false;for(const L of mapLabels)L.hidden=true;return false}
  if(mapBuilt!==G.mapVer){mapBuilt=G.mapVer;buildMapG()}mapG.visible=true;const vis=new Set(G.visited),opts=G.dec&&G.dec.k==='path'?G.dec.opts:[];
  mapG.children.forEach(o=>{if(o.userData.edge){const[a,b]=o.userData.edge,walked=vis.has(a)&&vis.has(b),open=a===G.node&&opts.includes(b);{const R2=O.ROOMS[G.dung]||O.ROOMS[0];o.children.forEach(s=>s.material.color.copy(K.lin(walked?R2[3]:open?'#e8dcc0':R2[2])))}}});
  mapRings.forEach((r,i)=>{const on2=opts.includes(i);r.visible=on2||i===G.node;if(r.visible){r.material.color.set(i===G.node?'#9dffb0':'#ffd27a');r.scale.setScalar(1+(on2?Math.sin(time*4)*.06:0))}});
  /* labels over the floors the party can choose */
  opts.forEach((i,k)=>{let d=mapLabels[k];if(!d){d=document.createElement('div');d.className='mapL';$('labels').appendChild(d);mapLabels[k]=d}const n=MAP[i];d.hidden=false;d.innerHTML='';const b=document.createElement('b');b.textContent=n.type==='battle'?O.encName(n.enc):n.name;const s=document.createElement('small');s.textContent=n.type==='battle'?({battle:'Monster',mini:'Miniboss',boss:'Boss'})[O.nodeKind(n)]:n.name&&({trap:'Trap',treasure:'Reliquary',shrine:'Shrine',forge:'Smithy',tome:'Library',gamble:'Gambler'})[n.type]||'';d.append(b,s);
    tmp.set(MPX+n._p[0],1.6,n._p[1]).project(cam);d.style.left=((tmp.x+1)/2*100)+'%';d.style.top=((1-tmp.y)/2*100)+'%'});for(let k=opts.length;k<mapLabels.length;k++)mapLabels[k].hidden=true;
  return true}
/* ---------- mini game scenes: a voxel diorama for each trap and event, built off to the side of the dungeon ---------- */
const MGX=0,MGZ=70;let mgS=null,mgFor='';
const stonePal={s:{c:'#4a4550',n:.12,alt:'#3d3944',p:.35},d:{c:'#2e2a33',n:.1},l:{c:'#6a6470',n:.08},w:{c:'#6a4a2e',n:.1},wd:{c:'#4a3420',n:.1},r:{c:'#8a2a24',n:.06},g:{c:'#d5a640',n:.05},
  i:{c:'#3a383e',n:.06},il:{c:'#8a8f9a',n:.05},b:{c:'#d8cdb2',n:.08},sl:{c:'#151012',n:0},f:{c:'#ff9a3a',glow:1},f2:{c:'#ffe090',glow:1},glow:{c:'#ff4a2a',glow:1},blue:{c:'#7fd9ff',glow:1}};
const addv=(g,o)=>{g.add(o);return o};
const vb=(fn,sc,pal)=>{const P2=new V.Part('m',[0,0,0]);fn(P2);return V.build({pal:pal||stonePal,parts:[P2]},sc||.1)};
const glowBox=(w,h,d,col)=>new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:col,toneMapped:false}));
function mgFloor(g,w,d){addv(g,vb(P2=>{for(let x=-w;x<w;x++)for(let z=-d;z<d;z++)P2.set(x,0,z,V.hash(x,z,5)<.3?'d':'s')},.4)).position.y=-.4}
function mgLight(g,x,y,z,col,I){const L=new T.PointLight(col||O.fireCol||'#ff9a3a',I||2,9,1.5);L.position.set(x,y,z);g.add(L);return L}
const sides=(i,n,z)=>{const j=Math.floor(i/2),s=i%2?1:-1;return[s*(1.75+j*.75),0,z==null?.3:z,s>0?-Math.PI/2+.55:Math.PI/2-.55]};
const lastCh=(g,p)=>String(g.v&&g.v[p.id]||'').slice(-1);
/* ---------- each dungeon's set pieces for its event rooms: a row of its symbols and a few props of its own ---------- */
const DECOR=[[['pile','#d8cdb2'],['candle','#ffd27a']],[['tree','#4a3a28'],['mush','#b06a3a']],[['coral','#e07060'],['pile','#f0c0a0']],[['pile','#ff7a20'],['urn','#3a383e']],
 [['web','#e8e8f8'],['pile','#f0f0e0']],[['spike','#c8f0ff'],['banner','#7fa8d0']],[['pipe','#5a5a40'],['urn','#6a5a2a']],[['coral','#3a8a5a'],['urn','#70ffa0']],
 [['pile','#c8a870'],['urn','#a88a5a']],[['reed','#4a6a3a'],['candle','#70ffd0']],[['banner','#8a2a24'],['pile','#9aa3ad']],[['mush','#e080ff'],['mush','#c07040']],
 [['rod','#6a6e8a'],['banner','#a0c0ff']],[['gear','#c8a050'],['pipe','#8a6a3a']],[['urn','#8a8a8a'],['pile','#6a6a6a']],[['spike','#ff70ff'],['pile','#8a6a8a']],
 [['rod','#204060'],['pile','#4a6a8a']],[['candle','#ffc060'],['banner','#8a1a1e']],[['pile','#ffc040'],['spike','#e8d8c8']],[['banner','#2e2048'],['candle','#c070ff']]];
function prop(kind,col){const P=Object.assign(roomPal(),{c:{c:col,n:.08},k:{c:col,glow:1},f:{c:'#ffb050',glow:1}}),h=V.hash;return vb(P2=>{
  if(kind==='pile'){for(let x=-4;x<4;x++)for(let z=-3;z<3;z++){const hh=Math.max(0,3-Math.hypot(x+.5,z+.5)*.7);for(let y=0;y<hh;y++)P2.set(x,y,z,h(x,y,z)<.3?'d':'c')}}
  else if(kind==='candle'){for(const[a,b,hh]of[[0,0,7],[2,1,5],[-2,1,4]]){P2.box(a,a,0,hh,b,b,'c');P2.set(a,hh+1,b,'f')}}
  else if(kind==='tree'){P2.box(-1,0,0,16,-1,0,'c');for(let k=0;k<4;k++)P2.box(0,3+(k%2?-1:1)*k,10+k*1.5,10+k*1.5,0,0,'c')}
  else if(kind==='mush'){P2.box(0,0,0,5,0,0,'b');for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)if(x*x+z*z<11)P2.set(x,6,z,'c');for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)P2.set(x,7,z,'c')}
  else if(kind==='coral'){for(let k=0;k<5;k++){let x=k-2,z=0;for(let y=0;y<6+k%3*2;y++){P2.set(x,y,z,'c');if(y%3===2)x+=k%2?1:-1}}}
  else if(kind==='urn'){for(let y=0;y<8;y++){const r=y<2?1:y<6?2:1;for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)P2.set(x,y,z,y===7?'a':'c')}}
  else if(kind==='web'){for(let a=-8;a<=8;a++){P2.set(a,8,0,'c');P2.set(0,8+a,0,'c');P2.set(a,8+a,0,'c');P2.set(a,8-a,0,'c')}}
  else if(kind==='spike'){for(const[a,b,hh]of[[0,0,9],[2,1,6],[-2,-1,5],[1,-2,4]])for(let y=0;y<hh;y++)P2.set(a,y,b,y>hh-3?'k':'c')}
  else if(kind==='banner'){P2.box(-3,3,18,18,0,0,'i');P2.box(-2,2,6,17,0,0,'c');P2.box(-1,1,5,5,0,0,'c');P2.box(-1,1,11,12,0,0,'a')}
  else if(kind==='pipe'){P2.box(-6,6,5,7,-1,1,'c');P2.box(-6,-4,0,7,-1,1,'c');P2.box(4,6,0,4,-1,1,'c')}
  else if(kind==='reed'){for(let k=0;k<7;k++){const x=k-3,hh=6+h(k,1,1)*6|0;P2.box(x,x,0,hh,(k%2),(k%2),'c');P2.set(x,hh+1,k%2,'d')}}
  else if(kind==='rod'){P2.box(0,0,0,14,0,0,'c');P2.set(0,15,0,'k');P2.box(-1,1,0,0,-1,1,'c')}
  else if(kind==='gear'){for(let a=0;a<24;a++){const t=a/24*Math.PI*2,r=a%2?5:6;P2.set(Math.round(Math.cos(t)*r),6+Math.round(Math.sin(t)*r),0,'c')}P2.box(0,0,0,6,0,0,'i')}},.1,P)}
function decor(G2){const D=DECOR[G.dung]||DECOR[0],sy=O.DSYM[G.dung]||O.DSYM[0];
  [[-3.2,-2.2],[3.2,-2.2],[-3.4,.4],[3.4,.4],[-2.4,-2.6],[2.4,-2.6]].forEach(([x,z],i)=>{const[k,c]=D[i%2],p=prop(k,c);p.position.set(x,0,z);p.rotation.y=(i%3)*.6;G2.add(p)});
  sy.slice(0,4).forEach((n,i)=>{const s=K.sym(n,.42);s.position.set(-1.65+i*1.1,2.55,-2.75);G2.add(s)})}
const SC={
 lock(g){const G2=new T.Group();G2.add(K.room({w:8,d:6}));decor(G2);const door=vb(P2=>{for(let x=-12;x<12;x++)for(let y=0;y<22;y++)P2.set(x,y,0,(x+y)%5?'i':'il');for(let x=-12;x<12;x++)P2.set(x,21,1,'g')},.15);door.position.set(0,-.4,-2.2);G2.add(door);
   const pins={};const n=G.players.length;G.players.forEach((p,i)=>{const x=(i-(n-1)/2)*.75,slot=new T.Mesh(new T.BoxGeometry(.32,1.4,.05),new T.MeshBasicMaterial({color:'#0a0809'}));slot.position.set(x,1.6,-2);G2.add(slot);
     const band=glowBox(.34,.14,.04,'#d5a640');band.position.set(x,1.6,-1.97);G2.add(band);const lamps=[0,1,2].map(k=>{const l=glowBox(.12,.12,.04,'#3a3030');l.position.set(x-.2+k*.2,.72,-1.97);G2.add(l);return l});
     const pin=new T.Mesh(new T.BoxGeometry(.2,.1,.08),new T.MeshLambertMaterial({color:LANES[p.slot]}));pin.position.set(x,.95,-1.96);G2.add(pin);pins[p.slot]=[pin,band,lamps]});
   mgLight(G2,0,2.6,1,'#ffd27a',2.4);
   return{g:G2,cam:[[0,2,5],[0,1.5,-1.5]],spot:(p,i,n)=>sides(i,n,.2),
   update(m){for(const k in pins){const[pin,band,lamps]=pins[k],set=m.d.set[k]||0,b=(m.d.band[k]||[.5,.5,.5])[Math.min(2,set)],w=m.d.w[Math.min(2,set)];band.position.y=.9+b*1.4;band.scale.y=w/.1;band.material.color.set(set>=3?'#9dffb0':'#d5a640');
       lamps.forEach((l,j)=>l.material.color.set(j<set?'#9dffb0':'#3a3030'));const per=m.d.per[Math.min(2,set)],u=((time/per)%2);pin.position.y=set>=3?band.position.y:.9+(u<1?u:2-u)*1.4}}}},
 shrine(g){const G2=new T.Group(),C2=O.shrineCourse(),cb=CG.build(C2,{pal:CG.lookFor(G.dung)});G2.add(cb.group);{const R2=K.room({w:9,d:8,back:false});R2.position.z=-2.6;R2.position.y=-.02;G2.add(R2);const D2=new T.Group();decor(D2);D2.position.z=-3;G2.add(D2)}cb.setFit(0);
   const st=vb(P2=>{P2.box(-4,3,0,3,-4,3,'d');P2.box(-3,2,4,16,-2,1,'b');P2.box(-5,4,17,19,-3,2,'b');P2.box(-2,1,20,23,-2,1,'b');P2.box(-1,0,21,22,2,2,'f')},.1);st.position.set(0,0,-(C2.len+60)*.01);G2.add(st);mgLight(G2,0,2.4,-(C2.len)*.01,'#ffd27a',3);
   const balls={},sl=[];return{g:G2,cam:[[0,4.6,4.4],[0,0,-2.4]],spot:(p,i,n)=>[(i-(n-1)/2)*.4+(n>1?0:-.5),0,.75,Math.PI],
   update(m){const seen=new Set();for(const q of m.d.b||[]){seen.add(q[2]);let b=balls[q[2]];if(!b){b=CG.marble(12,LANES[q[2]]);G2.add(b);balls[q[2]]=b}b.visible=true;b.position.set(q[0]*.01,.12+(q[3]||0)*.01,-q[1]*.01)}for(const k in balls)if(!seen.has(+k))balls[k].visible=false;
     /* each fighter pulling back shows a sling at their launch spot */
     const n=G.players.length;G.players.forEach((p,i)=>{let g2=sl[i];if(!g2){g2=mkSling();G2.add(g2);sl[i]=g2}const sh=(m.d.sh||{})[p.slot]||0,on=m.st==='play'&&p.ch&&sh<3&&!seen.has(p.slot);g2.visible=on;if(!on)return;
       g2.position.set((i-(n-1)/2)*.4,.02,-.4);g2.scale.setScalar(1.5);g2.rotation.y=(p.aim-90)*Math.PI/180;poseSling(g2,p,clamp(p.pw||0,0,1),'#e8e0c8')})}}},
 forge(g){const G2=new T.Group();G2.add(K.room({w:8,d:6}));decor(G2);const anvil=vb(P2=>{P2.box(-3,2,0,3,-2,1,'i');P2.box(-5,4,4,6,-3,2,'il');P2.box(5,7,5,6,-1,0,'il');P2.box(-3,3,7,7,-1,0,'f');P2.box(-2,2,7,7,0,0,'f2')},.1);G2.add(anvil);
   const ham=new T.Group(),head=vb(P2=>{P2.box(-3,2,0,2,-2,1,'i')},.1),hd=new T.Mesh(new T.BoxGeometry(.06,1,.06),new T.MeshLambertMaterial({color:'#6a4a2e'}));head.position.y=.95;hd.position.y=.5;ham.add(hd,head);ham.position.set(-.9,.8,0);G2.add(ham);
   addv(G2,vb(P2=>{P2.box(-5,4,0,10,-3,2,'s');P2.box(-4,3,11,13,-2,1,'f')},.12)).position.set(0,-.4,-2.2);mgLight(G2,0,1.6,0,'#ff8a3a',3);let seen={};
   return{g:G2,cam:[[0,2.4,4.6],[0,.6,0]],spot:(p,i,n)=>sides(i,n,.1),
   update(m){const t=m.st==='play'?m.t:0,bi=m.d.beats.findIndex(b=>b>t-.12),nb=bi>=0?m.d.beats[bi]:null,iv=bi>0?m.d.beats[bi]-m.d.beats[bi-1]:.78;const u=nb!=null?clamp((nb-t)/iv,0,1):1;ham.rotation.z=-1.6+(1-u)*1.75;if(u<.04&&!m._b){m._b=nb;burst3(0,.75,0,'#ffb54a',26,3)}if(m._b!==nb&&u>.2)m._b=0;
     for(const k in m.d.sc){if(seen[k]!==m.d.sc[k]){seen[k]=m.d.sc[k];burst3(0,.8,0,LANES[k],14,2.5)}}}}},
 tome(g){const G2=new T.Group();G2.add(K.room({w:8,d:6}));decor(G2);addv(G2,vb(P2=>{for(let x=-14;x<14;x++)for(let y=0;y<24;y++)P2.set(x,y,0,y%6===0?'wd':(x*7+y)%3?'w':'r')},.15)).position.set(0,-.4,-2.6);
   const glyph=i=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#e3d9c0';x.fillRect(0,0,64,64);x.fillStyle=['#2f6f66','#8a2a22','#b4541a','#4a3a7a','#3a3340','#9a7416'][i];x.beginPath();
     if(i===0)x.arc(32,32,18,0,7);else if(i===1){x.moveTo(32,10);x.lineTo(54,52);x.lineTo(10,52)}else if(i===2)x.rect(14,14,36,36);else if(i===3){x.moveTo(32,8);x.lineTo(56,32);x.lineTo(32,56);x.lineTo(8,32)}else if(i===4){for(let k=0;k<10;k++){const a=k/10*6.283-1.57,r=k%2?10:24;x.lineTo(32+Math.cos(a)*r,32+Math.sin(a)*r)}}else{x.rect(26,8,12,48);x.rect(8,26,48,12)}x.fill();const t2=new T.CanvasTexture(c);t2.encoding=T.sRGBEncoding;return t2};
   const tex=[0,1,2,3,4,5].map(glyph),back=new T.MeshLambertMaterial({color:'#3a2818'}),pages=[];
   for(let i=0;i<12;i++){const m=new T.Mesh(new T.BoxGeometry(.5,.66,.03),back);m.position.set(-1.05+(i%4)*.7,2.4-Math.floor(i/4)*.8,-1.8);G2.add(m);pages.push(m)}
   mgLight(G2,0,2.4,0,'#ffd27a',2.6);
   return{g:G2,cam:[[0,1.9,4.6],[0,1.6,-1.6]],spot:(p,i,n)=>sides(i,n,.1),
   update(m){const d=m.d;pages.forEach((pg,i)=>{const up=d.up[i]>=0?d.up[i]:d.peek&&(d.peek[0]===i||d.peek[1]===i)?(d.peek[0]===i?d.peek[2]:d.peek[3]):-1;pg.material=up>=0?(pg.userData.m=pg.userData.m||[])[up]||(pg.userData.m[up]=new T.MeshBasicMaterial({map:tex[up]})):back;pg.position.z=-1.8+(d.up[i]>=0?.15:0)+Math.sin(time*1.5+i)*.03})}}},
 gamble(g){const G2=new T.Group();G2.add(K.room({w:8,d:6}));decor(G2);addv(G2,vb(P2=>{P2.box(-12,11,0,7,-5,4,'w');P2.box(-13,12,8,8,-6,5,'r')},.1)).position.set(0,-.4,-.6);
   const gob=new T.Group(),gm=V.build(V.monster('kobold')),bb=new T.Box3().setFromObject(gm),s=1.9/(bb.max.y-bb.min.y);gm.scale.setScalar(s);gm.position.y=-bb.min.y*s;gob.add(gm);gob.position.set(0,-.4,-1.6);G2.add(gob);
   const slotX=k=>(k-1)*.75,cups=[0,1,2].map(k=>{const c=vb(P2=>{for(let y=0;y<6;y++){const r=3-y*.35;for(let x=-4;x<4;x++)for(let z=-4;z<4;z++)if(Math.hypot(x+.5,z+.5)<=r)P2.set(x,y,z,y===5?'g':'r')}},.07);c.position.set(slotX(k),.5,-.1);G2.add(c);return c});
   const ball=CG.marble(12,'#f0cc5c');ball.position.set(slotX(g.d.cup),.58,-.1);G2.add(ball);mgLight(G2,0,2,1.2,'#ffd27a',2.6);
   return{g:G2,cam:[[0,2.1,3.4],[0,.6,-.6]],spot:(p,i,n)=>sides(i,n,.4),
   update(m){const t=m.st==='play'?m.t:m.st==='done'?999:0,d=m.d;let at=[0,1,2],moving=null;
     for(const sw of d.sw){const[a,b,t0,iv]=sw;if(t>=t0+iv){const ia=at.indexOf(a),ib=at.indexOf(b);at[ia]=b;at[ib]=a}else if(t>=t0){moving=[a,b,(t-t0)/iv];break}else break}
     cups.forEach((c,ci)=>{let x=slotX(at[ci]),z=-.1;if(moving){const[a,b,f]=moving;if(at[ci]===a||at[ci]===b){const to=at[ci]===a?b:a;x=lerp(slotX(at[ci]),slotX(to),f);z=-.1+Math.sin(f*Math.PI)*(at[ci]===a?.3:-.3)}}
       const lift=t<d.bt-.6?.5:m.st==='done'?.55:0;c.position.set(x,.5+lift,z)});
     const show=t<d.bt-.6||m.st==='done';ball.visible=show;ball.position.x=slotX(m.st==='done'&&d.at!=null?d.at:d.cup)}}}};
/* ---------- the kit trap games build their scenes from (mg_*.js call def.tv(K,g)) ---------- */
const roomPal=()=>{const R=O.ROOMS[G.dung]||O.ROOMS[0];return Object.assign({},stonePal,{s:{c:R[0],n:.1,alt:R[1],p:.35},d:{c:R[1],n:.1},w:{c:R[2],n:.1},wd:{c:R[1],n:.08},a:{c:R[3],glow:1},ad:{c:R[3],n:.06}})};
const K={T,V,O,G,LANES,lin:c=>new T.Color(c).convertSRGBToLinear(),vb,glow:glowBox,addv,light:mgLight,sides,clamp,lerp,sm,now:()=>time,sfx:(k,o)=>O.sfx(k,o),
  pal:roomPal,acc:()=>(O.ROOMS[G.dung]||O.ROOMS[0])[3],
  burst:(x,y,z,col,n,sp)=>burst3(MGX+x,y,MGZ+z,col,n||20,sp||3),ring:(x,y,z,col,R)=>ring3(MGX+x,y,MGZ+z,col,R||1),
  /* a room in the dungeon's stone: floor w x d (in metres), a back wall and side walls, two torches */
  room(o){o=o||{};const w=o.w||8,d=o.d||6,h=o.h||3.2,g=new T.Group(),P=roomPal();
    addv(g,vb(P2=>{for(let x=-w*2.5;x<w*2.5;x++)for(let z=-d*2.5;z<d*2.5;z++)P2.set(x,0,z,V.hash(x,z,5)<.3?'d':'s')},.2,P)).position.y=-.2;
    if(o.back!==false)addv(g,vb(P2=>{for(let x=-w*2.5;x<w*2.5;x++)for(let y=0;y<h*5;y++)P2.set(x,y,0,y===Math.floor(h*5)-1?'ad':(V.hash(x,y,3)<.25?'wd':'w'))},.2,P)).position.set(0,-.2,-d/2-.2);
    if(o.sides)for(const s0 of[-1,1])addv(g,vb(P2=>{for(let z=-d*2.5;z<d*2.5;z++)for(let y=0;y<h*5;y++)P2.set(0,y,z,V.hash(z,y,7)<.25?'wd':'w')},.2,P)).position.set(s0*(w/2+.1)-(s0<0?.2:0),-.2,0);
    for(const s0 of[-1,1]){const t=vb(P2=>{P2.box(-1,0,0,6,-1,0,'i');P2.box(-1,0,7,8,-1,0,'f')},.08,P);t.position.set(s0*(w/2-.4),.4,-d/2+.1);g.add(t)}
    mgLight(g,0,2.6,1.4,O.fireCol||'#ffb060',2.2);const L2=mgLight(g,0,1.6,-d/2+.6,(O.ROOMS[G.dung]||O.ROOMS[0])[3],1.4);return g},
  /* a flat glowing tile that can be lit and dimmed */
  tile(w,d,col){const m=new T.Mesh(new T.BoxGeometry(w,.03,d),new T.MeshBasicMaterial({color:col||'#ffffff',transparent:true,opacity:0,toneMapped:false}));return m},
  /* a sprite of a drawn symbol, for the room */
  sym(name,size){const m=new T.Sprite(new T.SpriteMaterial({map:symTex(name),transparent:true,depthWrite:false}));m.scale.set(size||.6,size||.6,1);return m}};
O.MGK=K;
const symTexC={};function symTex(name){if(symTexC[name])return symTexC[name];const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d'),gl=O.GLYPHS[name]||O.GLYPHS.star;
  x.scale(128/48,128/48);x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.arc(24,24,23,0,7);x.fill();x.translate(6,6);x.scale(.75,.75);x.fillStyle=gl[0];x.fill(new Path2D(gl[1]),'evenodd');
  const t=new T.CanvasTexture(cv);t.encoding=T.sRGBEncoding;return symTexC[name]=t}
/* ---------- the HUD over the big screen: the game's own readouts and a strip of every fighter ---------- */
const P2D={};const g2d=(name)=>P2D[name]||(P2D[name]=new Path2D((O.GLYPHS[name]||O.GLYPHS.star)[1]));
const HK={LANES,
  glyph(x,name,cx,cy,s,col,alpha){const gl=O.GLYPHS[name]||O.GLYPHS.star;x.save();x.globalAlpha=alpha==null?1:alpha;x.translate(cx-s/2,cy-s/2);x.scale(s/48,s/48);x.fillStyle=col||gl[0];x.fill(g2d(name),'evenodd');x.restore()},
  panel(x,X,Y,w,h,a){x.fillStyle=`rgba(14,10,12,${a==null?.78:a})`;x.strokeStyle='rgba(201,160,76,.8)';x.lineWidth=2;x.beginPath();x.moveTo(X+8,Y);x.lineTo(X+w-8,Y);x.lineTo(X+w,Y+8);x.lineTo(X+w,Y+h-8);x.lineTo(X+w-8,Y+h);x.lineTo(X+8,Y+h);x.lineTo(X,Y+h-8);x.lineTo(X,Y+8);x.closePath();x.fill();x.stroke()},
  bar(x,X,Y,w,h,f,col,bg){x.fillStyle=bg||'rgba(0,0,0,.6)';x.fillRect(X,Y,w,h);x.fillStyle=col||'#d5a640';x.fillRect(X,Y,w*clamp(f,0,1),h)},
  txt(x,s,X,Y,sz,col,al,font){x.font=`${font||'800'} ${sz}px "Alegreya Sans",system-ui,sans-serif`;x.textAlign=al||'center';x.textBaseline='middle';x.lineWidth=Math.max(2,sz/7);x.strokeStyle='rgba(0,0,0,.85)';x.strokeText(s,X,Y);x.fillStyle=col||'#fff4d6';x.fillText(s,X,Y)},
  hearts(x,X,Y,n,max,s){for(let i=0;i<(max||3);i++){x.save();x.globalAlpha=i<n?1:.25;HK.glyph(x,'heart',X+i*s*1.05,Y,s,i<n?'#ff4a4a':'#666');x.restore()}},
  players:()=>G.players.filter(p=>!p.away)};
let hudCv=null;
function drawHud(m){if(!hudCv){hudCv=document.createElement('canvas');hudCv.id='mgHud';canvas.parentNode.insertBefore(hudCv,canvas.nextSibling)}
  const on=!!m&&G.screen==='map',def=on&&O.MG[m.k];hudCv.hidden=!on;if(!on)return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,window.devicePixelRatio||1);
  if(hudCv.width!==Math.round(w*dpr)||hudCv.height!==Math.round(h*dpr)){hudCv.width=Math.round(w*dpr);hudCv.height=Math.round(h*dpr);hudCv.style.width=w+'px';hudCv.style.height=h+'px'}
  const x=hudCv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);if(m.st==='brief')return;
  if(m.st==='play'&&def.hud)try{def.hud(x,w,h,m,HK)}catch(e){console.warn(e)}
  if(def.kind!=='trap'&&!def.strip)return;
  /* the strip: one chip per fighter along the bottom */
  const ps=HK.players(),cw=Math.min(210,w/Math.max(1,ps.length)-10),ch=Math.max(34,h*.06),y0=h-ch-10;ps.forEach((p,i)=>{const X=w/2+(i-(ps.length-1)/2)*(cw+10)-cw/2,d=m.d,out=d.out[p.slot]!=null,done=m.st==='done';
    HK.panel(x,X,y0,cw,ch,.82);x.fillStyle=LANES[p.slot];x.fillRect(X+4,y0+6,5,ch-12);const fs=Math.max(12,ch*.36);
    HK.txt(x,O.CLASSES[p.cls].animal,X+16,y0+ch*.32,fs,'#fff4d6','left');
    if(done)HK.txt(x,d.pass[p.slot]?'THROUGH':'CAUGHT',X+cw-10,y0+ch/2,fs*1.05,d.pass[p.slot]?'#9dffb0':'#ff7a6a','right');
    else if(out)HK.txt(x,d.sw[p.slot]?'OUT':`OUT · ${d.swn[p.slot]||0}/${O.MG_SW}`,X+cw-10,y0+ch/2,fs,'#ff7a6a','right');
    else if(d.hp[p.slot]!=null){const mx=def.hearts===true?3:def.hearts||3;HK.hearts(x,X+cw-10-fs*1.07*mx,y0+ch/2,d.hp[p.slot],mx,fs)}
    if(d.pr[p.slot])HK.txt(x,String(d.pr[p.slot]),X+16,y0+ch*.72,fs*.78,'#d5c8a8','left','600')})}
function syncMg(dt){
  const m=G.mg,on=!!m&&G.screen==='map';if(!on){if(mgS){world.remove(mgS.g);mgS=null;mgFor=''}if(callTxt){callTxt='';const el=$('mgCall');if(el)el.hidden=true}if(hudCv)hudCv.hidden=true;return false}
  if(mgFor!==m.id+':'+m.k){mgFor=m.id+':'+m.k;if(mgS)world.remove(mgS.g);{const def=O.MG[m.k];mgS=def&&def.tv?def.tv(K,m):(SC[m.k]||SC.lock)(m)}mgS.g.position.set(MGX,0,MGZ);world.add(mgS.g);camSnap=true}
  mgS.update(m,dt);syncPod(m);mgCall(m);drawHud(m);return true}
const PODZ=1.2,PODX=(r,n)=>(r-(n-1)/2)*.95,PODH=r=>0;
const podOn=()=>!!G.mg&&G.mg.st==='done'&&G.mg.t>1.4;
function podRank(p){return G.players.filter(q=>!q.away).indexOf(p)}
function syncPod(m){}
let callTxt='';
function mgCall(m){const el=$('mgCall');if(!el)return;const B=O.MG_BRIEF||7;let t='',cls='';
  if(m.st==='brief'&&m.t>B-3)t=String(Math.ceil(B-m.t));else if(m.st==='brief'&&m.t>B-4.2)t='Ready?';
  else if(m.st==='play'&&m.t<.9){t='GO!';cls='go'}
  else if(m.st==='done'&&m.t<1.6){t='FINISH!';cls='fin'}
  else if(m.st==='done'){const ps=G.players.filter(p=>!p.away),n=ps.filter(p=>m.d.pass[p.slot]).length,ev=m.kind!=='trap';t=ev?'Done!':n===ps.length?(ps.length>1?'All clear!':'Through!'):n===0?(ps.length>1?'All caught!':'Caught!'):`${n} of ${ps.length} through`;cls=n===ps.length||ev?'win':'fin'}
  if(t!==callTxt){callTxt=t;el.textContent=t;el.className=cls;el.hidden=!t;if(t){void el.offsetWidth;el.classList.add('pop');if(/^\d$/.test(t))O.sfx('mgCount');else if(cls==='go')O.sfx('trapGo');else if(cls==='fin')O.sfx('mgFinish');else if(cls==='win')O.sfx('mgWin')}}}
/* ---------- options the menu toggles ---------- */
const pxRatio=()=>pixOn?Math.min(1,420/Math.max(1,canvas.clientHeight)):(detailOn?Math.min(2,window.devicePixelRatio||1):Math.min(1,window.devicePixelRatio||1));
O.pixOn=()=>pixOn;O.setPix=v=>{pixOn=!!v;try{localStorage.setItem('ow_vpix',pixOn?'1':'0')}catch(e){}if(canvas){canvas.style.imageRendering=pixOn?'pixelated':'';canvas.width=0}};
O.fxOn=()=>fxOn;O.setFx=v=>{fxOn=!!v;try{localStorage.setItem('ow_fx',fxOn?'1':'0')}catch(e){}if(renderer)renderer.toneMappingExposure=fxOn?1.12:1};
O.detailOn=()=>detailOn;O.setDetail=v=>{detailOn=!!v;try{localStorage.setItem('ow_detail',detailOn?'1':'0')}catch(e){}if(moon)moon.castShadow=detailOn;if(canvas)canvas.width=0};
O.shakeOn=()=>shakeOn;O.setShake=v=>{shakeOn=!!v;try{localStorage.setItem('ow_shake',shakeOn?'1':'0')}catch(e){}};
O.lookOf=()=>'voxel';O.setLook=()=>{};O.loadModel=()=>{};O.glb={};
O.loadInfo=()=>ready?null:{need:1,done:0};O.hold=()=>!ready;
O._mgS=()=>mgS;O._dbgCam=()=>({pos:camPos.toArray().map(n=>+n.toFixed(2)),tgt:camTgt.toArray().map(n=>+n.toFixed(2)),node:MAP[G.node]&&MAP[G.node]._p,mapX:mapG&&mapG.position.x,vis:mapG&&mapG.visible});
function lookInput(cv){const pts=new Map();let last=null,lastHint=0;
  const on=()=>G.screen==='combat'&&G.inspect;
  const two=()=>{const a=[...pts.values()];return{d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}};
  cv.addEventListener('pointerdown',e=>{if(!on())return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey});last=pts.size===2?two():null;try{cv.setPointerCapture(e.pointerId)}catch(q){}e.preventDefault()});
  cv.addEventListener('pointermove',e=>{const p=pts.get(e.pointerId);if(!p||!on())return;const dx=e.clientX-p.x,dy=e.clientY-p.y,h=cv.clientHeight||600;
    if(pts.size===1){if(p.b===2||p.sh)O.lookNudge(0,0,1,-dx/h*6,-dy/h*6);else O.lookNudge(-dx/h*3.2,dy/h*2.2)}
    p.x=e.clientX;p.y=e.clientY;if(pts.size===2){const t=two();if(last){O.lookNudge(0,0,t.d/Math.max(20,last.d),-(t.x-last.x)/h*6,-(t.y-last.y)/h*6)}last=t}});
  const up=e=>{pts.delete(e.pointerId);last=pts.size===2?two():null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('contextmenu',e=>{if(on())e.preventDefault()});
  cv.addEventListener('wheel',e=>{if(!on())return;O.lookNudge(0,0,Math.exp(-e.deltaY*.0015));e.preventDefault()},{passive:false});
  cv.addEventListener('dblclick',()=>{if(on())O.lookReset()})}
O.initStage=function(cv){
  canvas=cv;lookInput(cv);renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(pxRatio());if(pixOn)cv.style.imageRendering='pixelated';
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=fxOn?1.12:1;
  scene=new T.Scene();cam=new T.PerspectiveCamera(42,1,.05,90);
  hemi=new T.HemisphereLight('#8c9ad0','#3a2a22',.62);scene.add(hemi);
  moon=new T.DirectionalLight('#b8c8ff',.8);moon.castShadow=detailOn;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:40});moon.shadow.bias=-.0008;scene.add(moon,moon.target);
  monLight=new T.PointLight('#ffd7a8',0,9,1.6);scene.add(monLight);
  initParticles();buildWorld();applyTheme();ready=true;
  const ray=new T.Raycaster(),mv=new T.Vector2();cv.addEventListener('pointerdown',e=>{if(G.screen!=='map'||!mapG||!mapG.visible||!G.dec||G.dec.k!=='path')return;const r=cv.getBoundingClientRect();mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mv,cam);
    const hit=ray.intersectObjects(mapNodes,false)[0];if(hit){const k=G.dec.opts.indexOf(hit.object.userData.node);if(k>=0)O.pickOpt('host',G.dec.id,k)}})};
let mapVer=-1;
O.renderStage=function(dt){
  if(!ready)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;{const r=pxRatio();if(Math.abs(renderer.getPixelRatio()-r)>1e-4)renderer.setPixelRatio(r)}
  if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  if(themeFor!==G.dung)applyTheme();
  time+=dt;{if(!!G.travel!==fxT.trav){fxT.trav=!!G.travel;if(G.travel)O.sfx('travel')}
    const ms=G.mg?G.mg.id+G.mg.st:'';if(ms!==fxT.mg){fxT.mg=ms;if(G.mg&&G.mg.st==='go')O.sfx('trapGo')}
    const mood=G.screen==='lobby'?'menu':G.screen==='map'?'map':G.screen==='combat'?(G.phase==='won'||G.phase==='lost'?'none':G.practice?'map':O.encRank(G.enc)==='boss'?'boss':'fight'):'none',dk=G.dung+'|'+mood;if(dk!==fxT.drone){fxT.drone=dk;O.music(mood,G.dung)}}
  const mgOn=syncMg(dt),map3=syncMap(),map=G.screen==='map'&&!mgOn&&!map3,mc=$('mapCv');if(mc.hidden===map)mc.hidden=!map;lobbyG.visible=!mgOn&&!courseG&&G.screen!=='map';
  if(map){if(!mc._b){mc._b=1;O.bindMap(mc)}O.drawMap(mc,dt);drainEvents();for(const f of floats)f.d.remove();floats.length=0;hud();return}       // the map is a drawn chart; the 3D scene rests while it is up
  const sdt=dt*(G.screen==='combat'?G.ts:1);
  syncCourse();syncMonster(sdt);syncHeroes(dt);syncMarbles(sdt);drainEvents();direct(dt);stepParticles(sdt);
  for(const L of torches)L.intensity=(L.userData.course?1.5:2.2)+Math.sin(time*9+L.id)*.12+Math.sin(time*23+L.id*2)*.07;
  for(const f of floats){f.t+=dt;tmp.copy(f.p);tmp.y+=f.t*.7;tmp.project(cam);f.d.style.left=((tmp.x+1)/2*100)+'%';f.d.style.top=((1-tmp.y)/2*100)+'%';f.d.style.opacity=tmp.z>1?0:clamp(1.6-f.t,0,1);if(f.t>1.6)f.d.remove()}
  for(let i=floats.length-1;i>=0;i--)if(floats[i].t>1.6)floats.splice(i,1);
  hud();renderer.render(scene,cam)};
})();
