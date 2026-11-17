/* GambaGolf: the dungeon map, cut into a slab of dark stone and lit by the fire of the dungeon it charts.
   Floors climb from the gate at the bottom to the boss at the top. Walked ways glow; the ways still open are picked out in bone. */
(()=>{
const O=window.OW,G=O.G,MAP=O.MAP;
let cv=null,x=null,W=0,H=0,dpr=1,camY=null,t=0,slab=null,hot=[],hover=-1;
const BONE='#d8cbb0',DIMB='rgba(216,203,176,.34)',RED='#d2483a',CUT='#0d090b',PIT='#110c0e';
const LEG=[['battle','Monsters'],['mini','Miniboss'],['trap','Trap'],['treasure','Reliquary'],['tome','Library'],['shrine','Shrine'],['forge','Smithy'],['boss','Boss']];
const kind=n=>n.type!=='battle'?n.type:({lesser:'battle',mini:'mini',boss:'boss'})[O.encRank(n.enc)];
const fire=()=>(O.SETS&&O.SETS[G.dung]&&O.SETS[G.dung].fire)||'#d6ab52';
function mkSlab(){const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');q.fillStyle='#1d171a';q.fillRect(0,0,512,512);const r=O.rng(23);
  for(let i=0;i<34;i++){const px=r()*512,py=r()*512,R=50+r()*150,g=q.createRadialGradient(px,py,4,px,py,R);g.addColorStop(0,r()<.5?`rgba(60,48,52,${.1+r()*.16})`:`rgba(6,4,5,${.12+r()*.2})`);g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;for(const ox of[0,-512,512])for(const oy of[0,-512,512])q.fillRect(px-R+ox,py-R+oy,R*2,R*2)}
  for(let i=0;i<7000;i++){q.fillStyle=r()<.5?`rgba(0,0,0,${r()*.22})`:`rgba(190,170,160,${r()*.07})`;q.fillRect(r()*512,r()*512,1+r()*2,1)}
  q.lineCap='round';for(let i=0;i<26;i++){const px=r()*512,py=r()*512,a=r()*6.28,l=20+r()*90;q.strokeStyle=`rgba(0,0,0,${.18+r()*.2})`;q.lineWidth=.6+r();q.beginPath();q.moveTo(px,py);q.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);q.stroke();q.strokeStyle='rgba(200,180,170,.05)';q.beginPath();q.moveTo(px+1,py+1);q.lineTo(px+Math.cos(a)*l+1,py+Math.sin(a)*l+1);q.stroke()}
  return c}
/* glyphs: carved signs drawn around (0,0), about one unit across. col is the cut face; CUT is the shadow inside it. */
function glyph(k,s,col){
  x.save();x.scale(s,s);x.strokeStyle=col;x.fillStyle=col;x.lineWidth=.075;x.lineCap='round';x.lineJoin='round';const P=(...a)=>{x.beginPath();x.moveTo(a[0],a[1]);for(let i=2;i<a.length;i+=2)x.lineTo(a[i],a[i+1])};
  const skull=(sc,dy)=>{x.save();x.translate(0,dy||0);x.scale(sc,sc);x.fillStyle=col;x.beginPath();x.moveTo(-.34,.02);x.bezierCurveTo(-.42,-.52,.42,-.52,.34,.02);x.bezierCurveTo(.34,.15,.24,.18,.2,.25);x.lineTo(.2,.42);x.lineTo(-.2,.42);x.lineTo(-.2,.25);x.bezierCurveTo(-.24,.18,-.34,.15,-.34,.02);x.closePath();x.fill();
    x.fillStyle=CUT;x.beginPath();x.ellipse(-.155,-.03,.1,.115,-.25,0,7);x.fill();x.beginPath();x.ellipse(.155,-.03,.1,.115,.25,0,7);x.fill();P(0,.09,-.055,.21,.055,.21);x.closePath();x.fill();
    x.strokeStyle=CUT;x.lineWidth=.035;for(const q of[-.1,0,.1]){P(q,.29,q,.42);x.stroke()}x.restore();x.fillStyle=col;x.strokeStyle=col};
  if(k==='battle')skull(1,-.02);
  else if(k==='mini'){x.lineWidth=.085;for(const sx of[-1,1]){P(sx*.5,.46,-sx*.44,-.46);x.stroke();P(sx*.3,.42,sx*.48,.24);x.stroke()}skull(.82,-.02)}       // a skull over crossed blades
  else if(k==='boss'){P(-.36,-.36,-.36,-.68,-.18,-.5,0,-.74,.18,-.5,.36,-.68,.36,-.36);x.closePath();x.fill();skull(.9,.1)}                                     // a crowned skull
  else if(k==='shrine'){x.beginPath();x.moveTo(0,-.52);x.bezierCurveTo(.3,-.2,.22,.06,0,.08);x.bezierCurveTo(-.22,.06,-.3,-.2,0,-.52);x.fill();x.fillRect(-.07,.1,.14,.2);x.beginPath();x.moveTo(-.38,.3);x.lineTo(.38,.3);x.lineTo(.26,.46);x.lineTo(-.26,.46);x.closePath();x.fill()}
  else if(k==='treasure'){x.beginPath();x.rect(-.4,-.06,.8,.42);x.fill();x.beginPath();x.moveTo(-.4,-.12);x.bezierCurveTo(-.4,-.5,.4,-.5,.4,-.12);x.closePath();x.fill();x.fillStyle=CUT;x.fillRect(-.4,-.115,.8,.045);x.fillRect(-.035,-.02,.07,.26);x.fillRect(-.11,.05,.22,.07)}
  else if(k==='forge'){P(-.44,-.24,.3,-.24,.5,-.36,.3,-.05,.1,-.05,.16,.22,.34,.36,-.3,.36,-.12,.22,-.06,-.05,-.44,-.05);x.closePath();x.fill()}
  else if(k==='tome'){P(0,-.26,-.46,-.36,-.46,.26,0,.36);x.closePath();x.fill();P(0,-.26,.46,-.36,.46,.26,0,.36);x.closePath();x.fill();x.strokeStyle=CUT;x.lineWidth=.04;P(0,-.26,0,.36);x.stroke();for(const sx of[-1,1])for(const y of[-.12,.02,.16]){P(sx*.1,y,sx*.36,y-.05);x.stroke()}}
  else if(k==='trap'){for(let i=0;i<4;i++){x.save();x.rotate(i*Math.PI/2+Math.PI/4);P(-.11,-.08,0,-.56,.11,-.08);x.closePath();x.fill();x.restore()}x.beginPath();x.arc(0,0,.17,0,7);x.fill();x.fillStyle=CUT;x.beginPath();x.arc(0,0,.07,0,7);x.fill()}       // a caltrop
  else if(k==='start'){x.lineWidth=.11;x.beginPath();x.moveTo(-.34,.4);x.lineTo(-.34,-.08);x.arc(0,-.08,.34,Math.PI,0);x.lineTo(.34,.4);x.stroke();x.lineWidth=.05;for(const q of[-.17,0,.17]){P(q,-.3,q,.4);x.stroke()}P(-.34,.08,.34,.08);x.stroke()}
  x.restore()}
function layout(){
  const u=Math.max(1,Math.min(2.4,H/520)),leg=W>640?Math.min(210*u,W*.2):0,mw=Math.min(W-leg-24,880*u),mx=(W-leg-mw)/2,cw=mw/O.COLS,rh=Math.max(58,Math.min(H/5.6,170));
  return{u,leg,mx,cw,rh,px:n=>mx+(n.col+.5+n.jx)*cw,py:n=>-(n.row+n.jy*(n.type==='start'||n.row===MAP[MAP.length-1].row?0:1))*rh}}
function groove(ax,ay,bx,by,col,w,dash){      // a cut in the stone: a dark channel with a lit lower lip
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,n=Math.max(2,Math.round(len/14)),nx=-dy/len,ny=dx/len,pts=[];
  for(let i=0;i<=n;i++){const u=i/n,wv=Math.sin(u*Math.PI)*Math.sin((ax+ay)*.07)*6;pts.push([ax+dx*u+nx*wv,ay+dy*u+ny*wv])}
  const run=(ox,oy)=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0]+ox,p[1]+oy):x.moveTo(p[0]+ox,p[1]+oy));x.stroke()};
  x.setLineDash(dash?[w*2.4,w*2.6]:[]);x.strokeStyle='rgba(0,0,0,.7)';x.lineWidth=w+2.5;run(0,0);x.strokeStyle=col;x.lineWidth=w;run(0,0);x.setLineDash([])}
O.drawMap=function(canvas,dt){
  cv=canvas;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;dpr=Math.min(2,window.devicePixelRatio||1);if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  W=w;H=h;x=cv.getContext('2d');t+=dt;if(!slab)slab=mkSlab();const L=layout(),u=L.u,d=O.DUNGEONS[G.dung],cur=MAP[G.node]||MAP[0],tr=G.travel,opts=G.dec&&G.dec.k==='path'?G.dec.opts:[],font=getComputedStyle(document.documentElement).getPropertyValue('--display')||'Georgia,serif',body=getComputedStyle(document.documentElement).getPropertyValue('--body')||'sans-serif',FIRE=fire();
  let pxp=L.px(cur),pyp=L.py(cur);if(tr){const A=MAP[tr.from],B=MAP[tr.to],e=tr.t*tr.t*(3-2*tr.t);pxp=L.px(A)+(L.px(B)-L.px(A))*e;pyp=L.py(A)+(L.py(B)-L.py(A))*e}
  const want=pyp-L.rh*.95;camY=camY==null||Math.abs(camY-want)>H*2?want:camY+(want-camY)*Math.min(1,dt*3);const oy=H*.62-camY;
  x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle=x.createPattern(slab,'repeat');x.save();x.translate(0,oy%512);x.fillRect(0,-512,W,H+1024);x.restore();
  let g=x.createRadialGradient(pxp,pyp+oy,10,pxp,pyp+oy,Math.max(W,H)*.55);g.addColorStop(0,'rgba(255,170,90,.16)');g.addColorStop(.35,'rgba(255,150,70,.05)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H);        // the party's torch
  g=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.72)');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.save();x.translate(0,oy);x.lineCap='round';x.lineJoin='round';
  // the ways between floors
  MAP.forEach((n,i)=>{for(const j of n.next){const m=MAP[j],walked=G.visited.includes(i)&&G.visited.includes(j),live=i===G.node&&opts.includes(j);
      const ax=L.px(n),ay=L.py(n),bx=L.px(m),by=L.py(m),dl=Math.hypot(bx-ax,by-ay)||1,r0=L.rh*.34/dl;
      if(walked){x.save();x.shadowColor=FIRE;x.shadowBlur=10*u;groove(ax+(bx-ax)*r0,ay+(by-ay)*r0,bx-(bx-ax)*r0,by-(by-ay)*r0,FIRE,2.6*u,false);x.restore()}
      else groove(ax+(bx-ax)*r0,ay+(by-ay)*r0,bx-(bx-ax)*r0,by-(by-ay)*r0,live?BONE:'rgba(216,203,176,.2)',(live?2.2:1.6)*u,true)}});
  // the floors: sockets sunk in the slab, each with its sign
  hot=[];const s0=Math.min(L.cw,L.rh)*.6,labels=[];
  MAP.forEach((n,i)=>{const k=kind(n),px=L.px(n),py=L.py(n),sy=py+oy;if(sy<-160||sy>H+160)return;const opt=opts.includes(i)&&!tr,seen=G.visited.includes(i),here=i===G.node&&!tr,big=k==='boss'?2.1:k==='mini'?1.3:1;
    const s=s0*big,R=s*.6;x.save();x.translate(px,py);
    if(k==='boss'){const bg=x.createRadialGradient(0,0,R*.4,0,0,R*2.1);bg.addColorStop(0,'rgba(200,50,34,.32)');bg.addColorStop(1,'rgba(200,50,34,0)');x.fillStyle=bg;x.beginPath();x.arc(0,0,R*2.1,0,7);x.fill()}
    x.fillStyle=PIT;x.beginPath();x.arc(0,0,R,0,7);x.fill();x.lineWidth=2*u;x.strokeStyle='rgba(0,0,0,.85)';x.beginPath();x.arc(0,-1*u,R,0,7);x.stroke();x.strokeStyle='rgba(216,203,176,.16)';x.beginPath();x.arc(0,1.2*u,R,.15,Math.PI-.15);x.stroke();
    if(seen&&n.type!=='start'){x.save();x.shadowColor=FIRE;x.shadowBlur=8*u;x.strokeStyle=FIRE;x.lineWidth=2.2*u;x.beginPath();x.arc(0,0,R,0,7);x.stroke();x.restore()}                 // a walked floor is ringed in the dungeon's fire
    const col=k==='mini'||k==='boss'?RED:opt||here||seen?BONE:DIMB;glyph(k,s*(opt?1+.05*Math.sin(t*5):1),seen&&!here&&!(k==='mini'||k==='boss')?'rgba(216,203,176,.5)':col);
    if(opt){x.strokeStyle=i===hover?'#fff3df':FIRE;x.lineWidth=2.6*u;x.setLineDash([6*u,6*u]);x.lineDashOffset=-t*16;x.beginPath();x.arc(0,0,R*1.18+Math.sin(t*5)*1.5*u,0,7);x.stroke();x.setLineDash([]);
      labels.push({px,py:py+R*1.18+8*u,a:n.type==='battle'?O.encName(n.enc):n.name,b:n.rw?'Spoils: '+(n.rw==='coin'?n.gold+' gold':({item:'an item',mend:'bandages'})[n.rw]):n.type==='battle'?'':({treasure:'A relic',shrine:'Heals everyone',forge:'An extra drop',trap:'Played on the phones',tome:'A new ability'})[n.type]||''});hot.push({i,x:px,y:py+oy,r:R*1.25})}
    x.restore()});
  // what each open way holds, on a small plate under it
  labels.sort((a,b)=>a.px-b.px);const placed=[];
  for(const lb of labels){const f1=Math.max(12,Math.min(20,L.cw*.12))*Math.min(1.5,u),f2=f1*.8;x.font=`600 ${f1}px ${font}`;const w1=x.measureText(lb.a).width;x.font=`500 ${f2}px ${body}`;const w2=lb.b?x.measureText(lb.b).width:0,bw=Math.max(w1,w2)+16*u,bh=f1+(lb.b?f2+4:0)+10*u,bx=Math.max(4,Math.min(W-L.leg-bw-4,lb.px-bw/2));
    for(const q of placed)if(bx<q.x+q.w+6&&bx+bw>q.x-6&&lb.py<q.y+q.h+4&&lb.py+bh>q.y-4)lb.py=q.y+q.h+5;placed.push({x:bx,y:lb.py,w:bw,h:bh});       // plates that would collide step down
    x.fillStyle='rgba(14,10,12,.9)';x.fillRect(bx,lb.py,bw,bh);x.strokeStyle=FIRE;x.lineWidth=1;x.strokeRect(bx+.5,lb.py+.5,bw-1,bh-1);x.textAlign='center';x.fillStyle='#ece2c8';x.font=`600 ${f1}px ${font}`;x.fillText(lb.a,bx+bw/2,lb.py+f1+2*u);if(lb.b){x.fillStyle='#b9aa8d';x.font=`500 ${f2}px ${body}`;x.fillText(lb.b,bx+bw/2,lb.py+f1+f2+5*u)}}
  // the party: a torch carried from floor to floor
  {const fy=pyp-s0*.6-6*u+Math.sin(t*4)*2*u,fl=1+.12*Math.sin(t*13)+.08*Math.sin(t*23);x.save();x.translate(pxp,fy);x.strokeStyle='#17110f';x.lineWidth=5*u;x.beginPath();x.moveTo(0,0);x.lineTo(0,-16*u);x.stroke();x.strokeStyle='#8a6f3e';x.lineWidth=3*u;x.beginPath();x.moveTo(0,0);x.lineTo(0,-16*u);x.stroke();
    x.shadowColor='#ffb347';x.shadowBlur=22*u;x.fillStyle='#ffb347';x.beginPath();x.moveTo(0,-36*u*fl);x.bezierCurveTo(9*u,-26*u,8*u,-16*u,0,-15*u);x.bezierCurveTo(-8*u,-16*u,-9*u,-26*u,0,-36*u*fl);x.fill();x.shadowBlur=0;x.fillStyle='#fff3c8';x.beginPath();x.moveTo(0,-27*u*fl);x.bezierCurveTo(4*u,-22*u,4*u,-17*u,0,-16.5*u);x.bezierCurveTo(-4*u,-17*u,-4*u,-22*u,0,-27*u*fl);x.fill();x.restore()}
  x.restore();
  // heading and legend
  const R=d.rows,row=cur.row||0,hh=Math.round(46*Math.min(1.8,u));g=x.createLinearGradient(0,0,0,hh*2.1);g.addColorStop(0,'rgba(11,9,10,1)');g.addColorStop(.62,'rgba(11,9,10,.96)');g.addColorStop(1,'rgba(11,9,10,0)');x.fillStyle=g;x.fillRect(0,0,W,hh*2.1);
  x.fillStyle=FIRE;x.textAlign='center';x.font=`800 ${Math.min(30*u,W*.05)}px ${font}`;x.fillText(d.name+(G.tier?' · '+O.TIERS[G.tier]:''),(W-L.leg)/2,hh*.68);
  x.font=`500 ${Math.min(15*u,W*.026)}px ${body}`;x.fillStyle='#b9aa8d';x.fillText(tr?'On the move':`Floor ${row} of ${R}`+(G.items.length?` · ${G.items.length} in the bag`:''),(W-L.leg)/2,hh*1.12);
  if(L.leg){const rowH=30*Math.min(1.7,u),lx=W-L.leg+6,lw=L.leg-16,lh=LEG.length*rowH+rowH*1.5,ly=Math.max(hh*1.3,(H-lh)/2);x.fillStyle='rgba(14,10,12,.82)';x.fillRect(lx,ly,lw,lh);x.strokeStyle='#5c4c40';x.lineWidth=1;x.strokeRect(lx+.5,ly+.5,lw-1,lh-1);
    x.fillStyle='#f3d792';x.textAlign='center';x.font=`600 ${rowH*.72}px ${font}`;x.fillText('Signs',lx+lw/2,ly+rowH*.9);x.textAlign='left';x.font=`500 ${rowH*.5}px ${body}`;
    LEG.forEach(([k,nm],q)=>{x.save();x.translate(lx+rowH*.8,ly+rowH*1.75+q*rowH);glyph(k,rowH*.82,k==='mini'||k==='boss'?RED:BONE);x.restore();x.fillStyle='#ece2c8';x.fillText(nm,lx+rowH*1.5,ly+rowH*1.92+q*rowH)})}
};
/* the host can choose the way by pressing a floor on the chart */
function at(e){const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;for(const hs of hot)if(Math.hypot(mx-hs.x,my-hs.y)<Math.max(26,hs.r))return hs.i;return -1}
O.bindMap=function(canvas){cv=canvas;
  canvas.addEventListener('pointermove',e=>{hover=at(e);canvas.style.cursor=hover>=0?'pointer':'default'});
  canvas.addEventListener('pointerdown',e=>{const i=at(e),d=G.dec;if(i>=0&&d&&d.k==='path'){const k=d.opts.indexOf(i);if(k>=0)O.pickOpt('host',d.id,k)}})};
})();
