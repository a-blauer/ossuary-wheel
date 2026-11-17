/* GambaGolf: drawing a creature course in voxels.
   World units are metres: one course unit is 1 cm, so x maps to x*W and y (down the course) to -y*W. */
(()=>{
const O=window.OW,V=O.V,T=THREE;
const W=.01,CS=8,VH=.05;                         // course units per turf cell, metres per turf layer
const G=O.CG={W,CS,VH};
const wx=x=>x*W,wz=y=>-y*W;
G.wx=wx;G.wz=wz;

/* palettes per dungeon look: turf felt, rails, stone */
G.LOOKS={
 ossuary:{turf:{c:'#4c5e3c',n:.06,alt:'#465736',p:.3},turf2:{c:'#53673f',n:.06,alt:'#4c5e3a',p:.3},dish:{c:'#3f4f32',n:.06},dish2:{c:'#35442b',n:.06},rim:{c:'#bdb39b',n:.08},cup:{c:'#0d0b0c',n:0},
   sand:{c:'#b49a6a',n:.1,alt:'#a28a5c',p:.4},rail:{c:'#d8cdb2',n:.08,alt:'#c4b897',p:.25},rail_t:{c:'#ece3cc',n:.05},rail_d:{c:'#8e846c',n:.08},stone:{c:'#3a3640',n:.1,alt:'#332f38',p:.35},stone_d:{c:'#2a2730',n:.1},
   floor:{c:'#2b2730',n:.12,alt:'#25222a',p:.35},tee:{c:'#7a6a50',n:.08},tee_l:{c:'#9a8a6a',n:.06}}};

/* each dungeon's course: turf, rails and stone shaded from the dungeon's own light and tint */
const mix=(a,b,t)=>{const A=V.rgb(a),B=V.rgb(b);return'#'+A.map((v,i)=>Math.round((v+(B[i]-v)*t)*255).toString(16).padStart(2,'0')).join('')};
const RAILS=['#d8cdb2','#6a4a2e','#5f8f8a','#4a3a36','#8a7fa0','#c8dce8','#6a6a4a','#6a8a5a','#c8a86a','#4a5a3a','#7a7f8a','#8a6a5a','#7a7aa0','#8a7a5a','#9a8a6a','#d8cdb2','#9aa8c8','#3a3a4a','#7a2a24','#2a2430'];
const TURF=['#4c5e3c','#46603a','#2f5a52','#5a3a2a','#4a4560','#8aa0a8','#556a2a','#3a6a3a','#b8a070','#2e4a3a','#4a5a4a','#4a5038','#4a5070','#5a5a40','#5a6a6a','#4a3a4a','#6a7aa0','#203a4a','#5a2a2a','#2a2238'];
G.lookFor=function(di){const k=di in TURF?di:0,base=G.LOOKS.ossuary,t=TURF[k],r=RAILS[k];if(!k)return base;
  return Object.assign({},base,{turf:{c:t,n:.06,alt:mix(t,'#000',.08),p:.3},turf2:{c:mix(t,'#fff',.06),n:.06,alt:mix(t,'#000',.02),p:.3},dish:{c:mix(t,'#000',.16),n:.06},dish2:{c:mix(t,'#000',.3),n:.06},
    rail:{c:r,n:.08,alt:mix(r,'#000',.1),p:.25},rail_t:{c:mix(r,'#fff',.15),n:.05},rail_d:{c:mix(r,'#000',.3),n:.08}})};
function turfModel(C,look){
  const P=new V.Part('turf',[0,0,0]),IND=O.COURSE.IND;
  const XR=Math.max(330,(C.ext||330)+2*CS),x0=Math.floor(-XR/CS),x1=Math.ceil(XR/CS),j0=Math.floor(-70/CS),j1=Math.ceil((C.len+30)/CS);
  for(let j=j0;j<=j1;j++)for(let i=x0;i<=x1;i++){
    const xc=(i+.5)*CS,yc=(j+.5)*CS,c=C.cx(Math.max(0,Math.min(C.len,yc))),hw=C.half(Math.max(0,Math.min(C.len,yc))),dx=Math.abs(xc-c)-hw;
    const inY=yc>=-40&&yc<=C.len,z=-j-1;
    if(inY&&dx<=0){
      let top=-1,col=(Math.floor(yc/64)%2)?'turf':'turf2';
      if(yc<O.COURSE.TEE+40&&yc>-40){col=Math.abs(xc-c)<hw-14?'tee':'tee_l'}
      for(const s of C.sand)if(Math.hypot(xc-s.x,yc-s.y)<s.r){top=-2;col='dish'}
      for(const h of C.holes){const d=Math.hypot(xc-h.x,yc-h.y);
        if(d<h.rad){top=-9;col='cup';break}
        if(d<h.rad+5){top=Math.min(top,-3);col='rim'}
        else if(d<h.rad+IND*.45){top=Math.min(top,-3);col='dish2'}
        else if(d<h.rad+IND){top=Math.min(top,-2);if(col!=='rim'&&col!=='dish2')col='dish'}}
      P.box(i,i,-12,top,z,z,'stone');P.set(i,top,z,col);if(col==='cup')P.set(i,top,z,'cup')}
    else if((inY&&dx>0&&dx<=18)||(!inY&&dx<=18&&((yc>C.len&&yc<=C.len+24)||(yc<-40&&yc>=-64)))){
      const tall=yc>C.len?5:3;P.box(i,i,-12,tall-1,z,z,'rail');P.set(i,tall,z,'rail_t');if((j+i)%9===0)P.set(i,tall-2,z,'rail_d')}}
  return{name:'turf',pal:look,parts:[P]}}

/* the obstacles a monster lays on its course */
function bumpModel(kind,rad,kick){
  const P=new V.Part('b',[0,0,0]),r=Math.max(3,Math.round(rad/5)),pal={bone:{c:'#ddd3bb',n:.08},bone_d:{c:'#a99c7f',n:.08},st:{c:'#5a5560',n:.1},st_l:{c:'#77727e',n:.08},iron:{c:'#47454a',n:.06},iron_l:{c:'#7d7a82',n:.05},kick:{c:'#ff8a3a',glow:1},kick2:{c:'#ffd27a',glow:1}};
  const disc=(y,rr,c)=>{for(let x=-rr;x<rr;x++)for(let z=-rr;z<rr;z++)if((x+.5)**2+(z+.5)**2<=rr*rr)P.set(x,y,z,c)};
  if(kind==='tooth'||kind==='fang'||kind==='spike'){for(let y=0;y<r*3;y++)disc(y,Math.max(1,Math.round(r*(1-y/(r*3.3)))),y<2?'bone_d':'bone')}
  else if(kind==='rivet'){for(let y=0;y<4;y++)disc(y,r,y===3?'iron_l':'iron');disc(4,Math.max(1,r-1),'iron_l')}
  else{for(let y=0;y<r*1.6;y++)disc(y,Math.max(1,Math.round(r*Math.sqrt(1-Math.pow((y-r*.4)/(r*1.3),2)))),y<1?'st':'st_l')}
  if(kick){disc(0,r+1,'kick');P.cut(-r+1,r-2,0,0,-r+1,r-2);disc(Math.round(r*1.2),Math.max(1,r-1),'kick2')}
  return{name:'bump',pal,parts:[P]}}

function label(text,sub,col,grey){
  const c=document.createElement('canvas');if(grey)col='#6a6670';c.width=128;c.height=96;const g=c.getContext('2d');
  g.fillStyle=col;g.beginPath();g.moveTo(8,6);g.lineTo(118,6);g.lineTo(104,40);g.lineTo(118,74);g.lineTo(8,74);g.closePath();g.fill();
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(8,66,110,8);
  g.font='800 46px "Alegreya Sans",system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#14100c';g.fillText(text,56,36);
  if(sub){g.fillStyle='#14100c';for(let k=0;k<sub;k++){g.beginPath();g.arc(56+(k-(sub-1)/2)*16,62,5,0,7);g.fill()}}
  const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;return tx}

/* build the course scene. Returns {group, update(t), setFit(size), holes:[...]} */
G.build=function(C,opt){
  opt=opt||{};const look=opt.pal||G.LOOKS[opt.look||'ossuary'],grp=new T.Group(),S=[CS*W,VH,CS*W];
  const tm=turfModel(C,look),geo=V.geom(tm.parts[0],tm.pal,S);const turf=new T.Mesh(geo.solid,V.matSolid());turf.receiveShadow=true;turf.castShadow=true;grp.add(turf);
  /* dungeon floor around the course */
  const fl=new V.Part('f',[0,0,0]);for(let i=-26;i<26;i++)for(let j=-6;j<Math.ceil(C.len/40)+12;j++)fl.set(i,0,-j,'floor');
  const fg=V.geom(fl,look,[.4,.05,.4]);const floor=new T.Mesh(fg.solid,V.matSolid());floor.position.y=-.65;floor.receiveShadow=true;grp.add(floor);
  /* dressing: pillars down both sides, bone piles, and stone steps up to where the monster waits */
  {const pil=new V.Part('p',[0,0,0]),lk=look;for(let y=0;y<26;y++){const w=y<2||y>23?3:2;pil.box(-w,w-1,y,y,-w,w-1,y<2||y>23?'stone_d':'stone')}
    const pm=V.build({pal:lk,parts:[pil]},.1);
    for(let y=60;y<C.len+200;y+=330)for(const s of[-1]){const x=C.cx(Math.min(C.len,y))+s*(C.half(Math.min(C.len,y))+130),m=pm.clone();m.position.set(wx(x),-.6,wz(y));grp.add(m)}
    const bp=new V.Part('b',[0,0,0]);const bpal={bone:{c:'#d8cdb2',n:.1,alt:'#bfb293',p:.3},sk:{c:'#e6dcc2',n:.05},sock:{c:'#151012',n:0}};
    for(let k=0;k<26;k++){const a=V.hash(k,1,2)*6.28,r=V.hash(k,3,4)*9;bp.box(Math.round(Math.cos(a)*r),Math.round(Math.cos(a)*r)+(k%2?3:0),0,Math.floor(V.hash(k,5,6)*2),Math.round(Math.sin(a)*r),Math.round(Math.sin(a)*r)+(k%2?0:3),'bone')}
    bp.box(-2,1,1,4,-2,1,'sk');bp.box(-2,-1,2,3,2,2,'sock');bp.box(0,1,2,3,2,2,'sock');
    const bm=V.build({pal:bpal,parts:[bp]},.06);
    for(let y=200;y<C.len;y+=470){const s=(Math.floor(y/470)%2)?1:-1,m=bm.clone();m.position.set(wx(C.cx(y)+s*(C.half(y)+70)),-.6,wz(y));m.rotation.y=y;grp.add(m)}
    const st=new V.Part('s',[0,0,0]);for(let k=0;k<4;k++)st.box(-26+k*2,25-k*2,k,k,-14+k,13-k*2,k%2?'stone':'stone_d');
    const sm=V.build({pal:lk,parts:[st]},.1);sm.position.set(wx(C.cx(C.len)),-.65,wz(C.len+170));grp.add(sm)}
  /* holes: a grate for balls that do not fit, a glowing rim for those that do, and a flag with the hole's worth and size */
  const holes=C.holes.map(h=>{const g=new T.Group();g.position.set(wx(h.x),0,wz(h.y));grp.add(g);
    const gr=new T.Group();const bm=new T.MeshLambertMaterial({color:'#2c2a2e'}),rm=new T.MeshLambertMaterial({color:'#4a474e'});const R=h.rad*W;
    for(let k=-3;k<=3;k++){const b=new T.Mesh(new T.BoxGeometry(.025,.03,R*2*Math.sqrt(1-Math.pow(k/3.6,2))),bm);b.position.set(k*R/3.6,-.085,0);gr.add(b)}
    const ring=new T.Mesh(new T.TorusGeometry(R*.96,.022,4,16),rm);ring.rotation.x=Math.PI/2;ring.position.y=-.09;gr.add(ring);
    const xx=new T.Mesh(new T.BoxGeometry(R*1.9,.012,.04),new T.MeshBasicMaterial({color:'#d2483a'}));xx.rotation.y=Math.PI/4;xx.position.y=-.07;const x2=xx.clone();x2.rotation.y=-Math.PI/4;gr.add(xx,x2);
    gr.visible=false;g.add(gr);
    const glow=new T.Mesh(new T.RingGeometry(R*1.02,R*1.02+.045,24),new T.MeshBasicMaterial({color:'#9dffb0',transparent:true,opacity:.85,side:T.DoubleSide,toneMapped:false}));glow.rotation.x=-Math.PI/2;glow.position.y=-.1+.005;glow.visible=false;g.add(glow);
    const pole=new T.Mesh(new T.BoxGeometry(.03,.75,.03),new T.MeshLambertMaterial({color:'#2a2622'}));pole.position.set(R+.06,.375-.05,0);pole.castShadow=true;g.add(pole);
    const tx1=label(String(h.dmg),h.size,O.TIER[h.tier]||'#c9a04c'),tx0=label(String(h.dmg),h.size,'',1),sp=new T.Sprite(new T.SpriteMaterial({map:tx1,depthTest:true}));sp.userData.tx=[tx0,tx1];sp.center.set(.04,.5);sp.position.set(R+.06,.6,0);sp.scale.set(.32,.24,1);g.add(sp);
    const arm=new T.Group();for(let k=0;k<3;k++){const p=new T.Group(),lid=new T.Mesh(new T.CylinderGeometry(R*1.12-k*.025,R*1.16-k*.025,.045,8),new T.MeshLambertMaterial({color:k?'#7d828c':'#5d626c'}));p.add(lid);
      for(let q=0;q<6;q++){const a=q/6*Math.PI*2,rv=new T.Mesh(new T.BoxGeometry(.03,.03,.03),new T.MeshLambertMaterial({color:'#b8a878'}));rv.position.set(Math.cos(a)*R*.86,.03,Math.sin(a)*R*.86);p.add(rv)}
      p.position.y=-.075+k*.05;p.traverse(o=>o.castShadow=true);arm.add(p)}g.add(arm);
    let shut=null;if(h.shut){shut=new T.Group();const lid=new T.Mesh(new T.CylinderGeometry(R*1.12,R*1.12,.05,8),new T.MeshLambertMaterial({color:'#4a4248'}));shut.add(lid);for(let k=0;k<8;k++){const a=k/8*Math.PI*2,rv=new T.Mesh(new T.BoxGeometry(.03,.03,.03),new T.MeshLambertMaterial({color:'#9a8f7a'}));rv.position.set(Math.cos(a)*R*.85,.03,Math.sin(a)*R*.85);shut.add(rv)}
      const bar=new T.Mesh(new T.BoxGeometry(R*1.6,.02,.05),new T.MeshLambertMaterial({color:'#9a8f7a'}));bar.position.y=.03;shut.add(bar);shut.traverse(o=>o.castShadow=true);g.add(shut)}
    return{h,g,gr,glow,sp,arm,shut,base:sp.scale.clone()}});
  /* bumps */
  const bumps=C.bumps.map(b=>{const m=V.build(bumpModel(b.kind,b.rad,b.kick),.05);m.position.set(wx(b.x),0,wz(b.y));m.rotation.y=(V.hash(b.x|0,b.y|0,3)-.5)*1.2;grp.add(m);return{b,m}});
  const sand=C.sand.map(s=>{const P=new V.Part('s',[0,0,0]),rr=Math.round(s.r/CS);for(let i=-rr;i<=rr;i++)for(let j=-rr;j<=rr;j++)if(Math.hypot(i*CS,j*CS)<s.r-2)P.set(i,0,-j,'sand');
    const m=new T.Mesh(V.geom(P,look,S).solid,V.matSolid());m.receiveShadow=true;m.position.set(wx(s.x)-CS*W/2,-.1,wz(s.y)+CS*W/2);grp.add(m);return{s,m}});
  /* the moving part */
  let mill=null,boulder=null;
  if(C.mv&&C.mv.k==='mill'){mill=new T.Group();mill.position.set(wx(C.mv.x),0,wz(C.mv.y));const post=new T.Mesh(new T.BoxGeometry(.18,.5,.18),new T.MeshLambertMaterial({color:'#5a4a3a'}));post.position.y=.25;post.castShadow=true;mill.add(post);
    const arm=new T.Mesh(new T.BoxGeometry(C.mv.len*2*W,.12,.12),new T.MeshLambertMaterial({color:'#8a6a44'}));arm.position.y=.09;arm.castShadow=true;const rot=new T.Group();rot.add(arm);
    for(const s of[-1,1]){const blade=new T.Mesh(new T.BoxGeometry(.3,.02,.5),new T.MeshLambertMaterial({color:'#d8cdb2'}));blade.position.set(s*C.mv.len*W*.6,.62,0);blade.rotation.x=s*.4;const st=new T.Mesh(new T.BoxGeometry(.03,.5,.03),new T.MeshLambertMaterial({color:'#5a4a3a'}));st.position.set(s*C.mv.len*W*.6,.38,0);rot.add(blade,st)}
    mill.add(rot);mill.userData.rot=rot;grp.add(mill)}
  if(C.mv&&C.mv.k==='boulder'){const P=new V.Part('r',[0,0,0]),rr=Math.round(C.mv.rad/5);for(let x=-rr;x<rr;x++)for(let y=0;y<rr*2;y++)for(let z=-rr;z<rr;z++)if((x+.5)**2+(y+.5-rr)**2+(z+.5)**2<=rr*rr)P.set(x,y,z,'s');
    boulder=V.build({pal:{s:{c:'#6b6670',n:.15,alt:'#57535c',p:.4}},parts:[P]},.05);grp.add(boulder)}
  /* blocks (a shield wall) */
  const blocks=C.blocks.map(q=>{const m=new T.Mesh(new T.BoxGeometry(q.w*W,.3,q.h*W),new T.MeshLambertMaterial({color:'#7a7f8a'}));m.position.set(wx(q.x),.15,wz(q.y));m.castShadow=true;grp.add(m);return{q,m}});
  let fit=0;
  const api={group:grp,holes,bumps,sand,
    setFit(ms){fit=ms||0;for(const o of holes){const lid=o.h.armor>0,no=fit&&!O.fitsSize(fit,o.h.size)&&!lid;o.gr.visible=!!no;o.glow.visible=!!fit&&!no&&!lid;o.sp.material.map=o.sp.userData.tx[no?0:1];o.sp.material.needsUpdate=true}},
    update(t,cam){
      for(const o of holes){if(o.shut){const on=O.shutAt(o.h,t);o.shut.position.y+=((on?.03:-.14)-o.shut.position.y)*.2}
        o.arm.children.forEach((p,k)=>p.visible=k<o.h.armor);
        if(o.glow.visible)o.glow.material.opacity=.55+.35*Math.sin(t*5+o.h.i);
        if(cam){const d=cam.position.distanceTo(o.g.position);o.sp.scale.copy(o.base).multiplyScalar(Math.max(1,Math.sqrt(d/6)))}}
      if(mill)mill.userData.rot.rotation.y=O.millAng(C.mv,t);
      if(boulder){boulder.position.set(wx(O.boulderX(C,C.mv,t)),0,wz(C.mv.y));boulder.rotation.z=-O.boulderX(C,C.mv,t)*W/(C.mv.rad*W)}
      for(const o of blocks)o.m.visible=o.q.on;for(const o of sand)o.m.visible=o.s.on!==false;for(const o of bumps)o.m.visible=o.b.on!==false;if(mill)mill.visible=!C.mv.broken;if(boulder)boulder.visible=!C.mv.broken}};
  return api};

/* a ball: a cut-glass gem with a glow */
G.marble=function(r,col){const g=new T.Group(),R=r*W;
  const m=new T.Mesh(new T.IcosahedronGeometry(R,1),new T.MeshStandardMaterial({color:col,roughness:.25,metalness:.1,flatShading:true,emissive:col,emissiveIntensity:.25}));m.castShadow=true;g.add(m);
  if(!G._halo){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);G._halo=new T.CanvasTexture(c)}
  const halo=new T.Sprite(new T.SpriteMaterial({map:G._halo,color:col,transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false}));halo.scale.setScalar(R*5);g.add(halo);
  g.userData.ball=m;return g};
})();
