/* Ossuary Wheel: the creature course. Each monster is a mini golf course instead of a wheel.
   Course coordinates: x across (right is +), y along the course away from the players. The tee is at y=0, the far wall at y=len.
   This file has no drawing in it, so the host simulation and the phones agree on the same course. */
(()=>{
const O=window.OW;
/* ---- sizes: every hole and every marble has a size of 1 (small), 2 (medium) or 3 (large). A marble fits a hole of its size or bigger. ---- */
O.hSize=rad=>rad<21?1:rad<28?2:3;
O.mSize=r=>r<=11?1:r<=16?2:3;
O.SIZE_NAMES=['','Small','Medium','Large'];
O.fitsSize=(ms,hs)=>ms<=hs;
O.COURSE={FR:250,IND:42,PULL:330,CAP:330,WALL_E:.62,BUMP_E:.78,KICK:470,TEE:70};

/* a course is laid out from the monster's old wheel plan, stretched down a fairway: the far side of the wheel becomes the far end of the course */
O.course=function(id){
  const d=O.MONSTERS[id];if(!d)return null;const L=d.layout(),hs=O.hash('course'+id),r=O.rng(hs);
  const rank=d.rank,len=rank==='boss'?1800:rank==='mini'?1550:1300;
  const ys=[...L.holes,...L.bumps].map(o=>o.y),yMin=Math.min(...ys),yMax=Math.max(...ys),sx=.85,toY=ly=>340+(yMax-ly)/Math.max(1,yMax-yMin)*(len-480);
  /* the fairway bends: straight, a dogleg one way or the other, or an S */
  const bend=['straight','left','right','s','left','right'][hs%6],A=rank==='lesser'?70:95;
  const cx=y=>{const t=Math.max(0,Math.min(1,(y-220)/(len-420)));if(bend==='straight')return 0;if(bend==='s')return A*Math.sin(t*Math.PI*2)*.8;const s=bend==='left'?-1:1;return s*A*(1-Math.cos(t*Math.PI))/2};
  const P=(x,y)=>{const yy=toY(y);return[x*sx+cx(yy),yy]};
  const holes=L.holes.map((h,i)=>{const[x,y]=P(h.x,h.y);const rad=Math.round(h.rad*1.05);return Object.assign({},h,{i,x,y,rad,size:O.hSize(rad)})});
  const bumps=L.bumps.map(b=>{const[x,y]=P(b.x,b.y);return Object.assign({},b,{x,y})});
  const sand=L.divots.map(q=>{const[x,y]=P(q.x,q.y);return{x,y,r:q.rad*1.5,on:true}});
  /* width: wide enough at every station for whatever stands there, smoothly varying */
  const N=Math.ceil(len/20)+1,hw=new Float32Array(N);
  for(let k=0;k<N;k++){const y=k*20;let w=y<300?150:170;const c=cx(y);
    for(const h of holes)if(Math.abs(h.y-y)<h.rad+60)w=Math.max(w,Math.abs(h.x-c)+h.rad+58);
    for(const b of bumps)if(Math.abs(b.y-y)<b.rad+40)w=Math.max(w,Math.abs(b.x-c)+b.rad+50);
    hw[k]=Math.min(300,w)}
  for(let pass=0;pass<6;pass++)for(let k=1;k<N-1;k++)hw[k]=Math.max(hw[k],(hw[k-1]+hw[k+1])/2*.985);       // never narrower than its need, but no sudden notches
  const C={id,rank,len,bend,N,hw,holes,bumps,sand,water:[],blocks:[],mv:null,locks:L.locks||null,core:L.core==null?-1:L.core,walls:L.walls||[]};
  C.cx=cx;C.half=y=>{const k=Math.max(0,Math.min(N-1.001,y/20)),i=Math.floor(k),f=k-i;return hw[i]*(1-f)+hw[Math.min(N-1,i+1)]*f};
  /* the moving part: a boulder rolling across, or a windmill arm sweeping the fairway */
  if(L.mv){if(L.mv.k==='orb'){const y=toY(-L.mv.r*.4)|0;C.mv={k:'boulder',y,rad:20,w:Math.abs(L.mv.w)*.9,ph:L.mv.ph}}
    else{let best=len*.55,bs=1e9;for(let y=len*.35;y<len*.8;y+=20){const s=holes.reduce((a,h)=>a+Math.max(0,140-Math.abs(h.y-y)),0)+bumps.reduce((a,b)=>a+Math.max(0,60-Math.abs(b.y-y)),0);if(s<bs){bs=s;best=y}}
      C.mv={k:'mill',x:cx(best),y:best,len:Math.min(150,C.half(best)-30),w:L.mv.w*1.4,ph:L.mv.ph}}}
  /* a shield wall becomes a row of blocks across the approach to the best holes */
  if(C.walls.length){const y=len-360,c=cx(y);C.blocks=[-1,0,1].map(k=>({x:c+k*92,y,w:52,h:22,hp:2,on:true}))}
  rateHoles(C);return C};

/* damage follows difficulty: a hole far down the course, small, off the line, behind posts or the windmill, shuttered, lidded or locked
   pays more; a big hole near the tee pays little. The course keeps the same total, it is only shared out by how hard each hole is. */
function rateHoles(C){const H=C.holes;if(!H.length)return;const tee=[C.cx(O.COURSE.TEE),O.COURSE.TEE],tot=H.reduce((a,h)=>a+h.dmg,0);
  for(const h of H){const dx=h.x-tee[0],dy=h.y-tee[1],L=Math.hypot(dx,dy);let out=0,obs=0;const n=24;
    for(let k=1;k<n;k++){const f=k/n,x=tee[0]+dx*f,y=tee[1]+dy*f;if(Math.abs(x-C.cx(y))>C.half(y)-12)out++}          // no straight line: needs a bank or a lob
    const near=(px,py,r)=>{const t=Math.max(0,Math.min(1,((px-tee[0])*dx+(py-tee[1])*dy)/(L*L))),qx=tee[0]+dx*t-px,qy=tee[1]+dy*t-py;return t>.04&&t<.97&&Math.hypot(qx,qy)<r};
    for(const b of C.bumps)if(near(b.x,b.y,b.rad+14))obs++;
    for(const o of H)if(o!==h&&o.y<h.y-o.rad&&near(o.x,o.y,o.rad*.8))obs+=.5;                                           // another hole to roll over first
    if(C.mv&&C.mv.k==='mill'&&C.mv.y<h.y)obs+=1;if(C.mv&&C.mv.k==='boulder'&&C.mv.y<h.y)obs+=.8;
    for(const b of C.blocks)if(b.y<h.y&&near(b.x,b.y,b.w))obs+=.7;
    h.diff=1.05*(L/C.len)+.5*Math.max(0,Math.min(1,(32-h.rad)/16))+.45*out/n+.14*Math.min(4,obs)+.16*(h.armor||0)+(h.lock?.28:0)+(h.core?.35:0)}
  const w=H.map(h=>Math.pow(.32+h.diff,1.35)),ws=w.reduce((a,b)=>a+b,0);
  H.forEach((h,i)=>{h.dmg=Math.max(4,Math.round(tot*w[i]/ws))});
  const s=H.map(h=>h.dmg).sort((a,b)=>a-b),q1=s[Math.floor(s.length/3)],q2=s[Math.floor(s.length*2/3)];
  for(const h of H)h.tier=h.dmg>=q2&&h.dmg>q1?2:h.dmg>=q1&&h.dmg>s[0]?1:0}
O.rateHoles=rateHoles;

/* where the moving parts are at a moment */
O.millAng=(mv,t)=>mv.ph+mv.w*t;
O.boulderX=(C,mv,t)=>{const c=C.cx(mv.y),h=C.half(mv.y)-mv.rad-8;return c+Math.sin(mv.ph+mv.w*t)*h};

/* one marble's step on a course. m: {x,y,vx,vy,r,size,...}. Returns an event string or null. hooks.fits(m,h) decides fit and openness. */
O.courseStep=function(C,m,dt,t,hooks){
  const K=O.COURSE;let sp=Math.hypot(m.vx,m.vy);
  /* ground: rolling friction, more in sand */
  let fr=K.FR*(m.fric||1);for(const s of C.sand)if(s.on&&Math.hypot(m.x-s.x,m.y-s.y)<s.r)fr*=4.2;
  for(const w of C.water)if(Math.hypot(m.x-w.x,m.y-w.y)<w.r-m.r*.4)return'water';
  if(sp>0){const ns=Math.max(0,sp-fr*dt);m.vx*=ns/sp;m.vy*=ns/sp;sp=ns}
  /* holes: a dished indent around each open hole the marble fits draws it in; a grated or armored hole does nothing */
  for(const h of C.holes){const dx=h.x-m.x,dy=h.y-m.y,d=Math.hypot(dx,dy);if(d>h.rad+K.IND+m.r)continue;
    const ok=hooks.fits(m,h);
    if(h.armor>0){if(d<h.rad+m.r){if(hooks.armor&&hooks.armor(m,h))return null;const nx=-dx/(d||1),ny=-dy/(d||1);bounce(m,nx,ny,.6);m.x=h.x+nx*(h.rad+m.r+.5);m.y=h.y+ny*(h.rad+m.r+.5)}continue}
    if(!ok)continue;
    if(d<h.rad+K.IND){const q=1-Math.max(0,d-h.rad*.35)/(h.rad*.65+K.IND),a=K.PULL*(m.pullK||1)*(.35+.65*q)*dt/(d||1);m.vx+=dx*a;m.vy+=dy*a}
    const cap=(K.CAP+h.rad*3)*(m.capK||1);
    if(d<h.rad-m.r*.25&&(sp<cap||m.sure))return{sink:h};
    if(d<h.rad*.75&&m.lip!==h){m.lip=h;const a=(Math.random()<.5?-1:1)*(.25+Math.random()*.35),c=Math.cos(a),s=Math.sin(a);[m.vx,m.vy]=[(m.vx*c-m.vy*s)*.82,(m.vx*s+m.vy*c)*.82];hooks.ev&&hooks.ev('lip',m,h)}}
  /* side rails follow the fairway, with the right normal on a bend */
  const c=C.cx(m.y),hw=C.half(m.y),e=2,dc=(C.cx(m.y+e)-C.cx(m.y-e))/(2*e),dh=(C.half(m.y+e)-C.half(m.y-e))/(2*e);
  if(m.x-m.r<c-hw){let nx=1,ny=-(dc-dh);const l=Math.hypot(nx,ny);nx/=l;ny/=l;m.x=c-hw+m.r;bounce(m,nx,ny,K.WALL_E);hooks.ev&&hooks.ev('wall',m)}
  if(m.x+m.r>c+hw){let nx=-1,ny=dc+dh;const l=Math.hypot(nx,ny);nx/=l;ny/=l;m.x=c+hw-m.r;bounce(m,nx,ny,K.WALL_E);hooks.ev&&hooks.ev('wall',m)}
  if(m.y+m.r>C.len){m.y=C.len-m.r;bounce(m,0,-1,K.WALL_E);hooks.ev&&hooks.ev('wall',m)}
  if(m.y-m.r<-40){m.y=-40+m.r;bounce(m,0,1,K.WALL_E)}
  for(const b of C.bumps){if(b.on===false)continue;const dx=m.x-b.x,dy=m.y-b.y,d=Math.hypot(dx,dy),rr=b.rad+m.r;if(d<rr&&d>0){const nx=dx/d,ny=dy/d;m.x=b.x+nx*rr;m.y=b.y+ny*rr;
      if(hooks.bump&&hooks.bump(m,b))continue;bounce(m,nx,ny,K.BUMP_E);if(b.kick){m.vx+=nx*K.KICK;m.vy+=ny*K.KICK}hooks.ev&&hooks.ev(b.kick?'kick':'bump',m,b)}}
  for(const q of C.blocks){if(!q.on)continue;const px=Math.max(q.x-q.w/2,Math.min(m.x,q.x+q.w/2)),py=Math.max(q.y-q.h/2,Math.min(m.y,q.y+q.h/2)),dx=m.x-px,dy=m.y-py,d=Math.hypot(dx,dy);
    if(d<m.r&&d>0){const nx=dx/d,ny=dy/d;m.x=px+nx*m.r;m.y=py+ny*m.r;if(hooks.block&&hooks.block(m,q))continue;bounce(m,nx,ny,K.WALL_E);hooks.ev&&hooks.ev('wall',m)}}
  const mv=C.mv;
  if(mv&&mv.k==='mill'){const a=O.millAng(mv,t);for(const s of[0,Math.PI]){const ex=mv.x+Math.cos(a+s)*mv.len,ey=mv.y+Math.sin(a+s)*mv.len,vx=ex-mv.x,vy=ey-mv.y,L2=vx*vx+vy*vy,u=Math.max(0,Math.min(1,((m.x-mv.x)*vx+(m.y-mv.y)*vy)/L2)),px=mv.x+vx*u,py=mv.y+vy*u,dx=m.x-px,dy=m.y-py,d=Math.hypot(dx,dy),rr=m.r+9;
      if(d<rr&&d>0){const nx=dx/d,ny=dy/d;m.x=px+nx*rr;m.y=py+ny*rr;const ux=-(py-mv.y)*mv.w,uy=(px-mv.x)*mv.w;m.vx-=ux;m.vy-=uy;bounce(m,nx,ny,.7);m.vx+=ux;m.vy+=uy;hooks.ev&&hooks.ev('mill',m)}}}
  if(mv&&mv.k==='boulder'){const bx=O.boulderX(C,mv,t),dx=m.x-bx,dy=m.y-mv.y,d=Math.hypot(dx,dy),rr=mv.rad+m.r;if(d<rr&&d>0){const nx=dx/d,ny=dy/d;m.x=bx+nx*rr;m.y=mv.y+ny*rr;bounce(m,nx,ny,.85);m.vx+=nx*120;hooks.ev&&hooks.ev('bump',m)}}
  m.x+=m.vx*dt;m.y+=m.vy*dt;
  return Math.hypot(m.vx,m.vy)<6?'rest':null};
function bounce(m,nx,ny,e){const vn=m.vx*nx+m.vy*ny;if(vn<0){m.vx-=(1+e)*vn*nx;m.vy-=(1+e)*vn*ny}}
O.cBounce=bounce;

/* launch speed for a putt that should roll dist on plain turf */
O.putt=dist=>Math.sqrt(2*O.COURSE.FR*Math.max(10,dist));
/* power 0..1 maps to a distance from short of the first holes to the far wall */
O.powDist=(C,pow)=>200+pow*(C.len+60-200);
})();
