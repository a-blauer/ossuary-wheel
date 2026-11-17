/* GambaGolf: hand-shaped voxel models for the lesser monsters and minibosses.
   Rounded bodies from ellipsoids and tapered tubes, by archetype, each creature with its own build and features.
   Front is +z. Part names drive the stage's animations: body, head, jaw, arm_L/arm_R, wing_L/wing_R, leg_*, tail*. */
(()=>{
const O=window.OW,V=O.V,P=V.Part,H=V.hash,B=V.MON;
function tube(p,pts,r0,r1,col,col2){let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);seg.push([a,b,l]);tot+=l}
  let run=0;for(const[a,b,l]of seg){const n=Math.max(1,Math.ceil(l));for(let k=0;k<=n;k++){const f=k/n,u=(run+l*f)/Math.max(1,tot),r=r0+(r1-r0)*u,c=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
      p.ell(c[0]+.5,c[1]+.5,c[2]+.5,Math.max(.6,r),Math.max(.6,r),Math.max(.6,r),col2&&(Math.floor((run+l*f)/3)%2)?col2:col)}run+=l}return p}
const eyes=(p,x,y,z,gap,c,w)=>{w=w||1;p.box(x-gap-w,x-gap,y,y+w-1,z,z,c);p.box(x+gap,x+gap+w,y,y+w-1,z,z,c)};
const shade=(h,f)=>{const n=parseInt(h.slice(1),16),c=[n>>16&255,n>>8&255,n&255].map(v=>Math.round(f>0?v+(255-v)*f:v*(1+f)));return'#'+c.map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('')};
const pal=(o)=>{const q={w:{c:o.wc||'#efe9dc',n:.04},h:{c:o.hl||shade(o.a,.3),n:.08},s:{c:o.sd||shade(o.a,-.35),n:.08},a:{c:o.a,n:.12,alt:o.a2||o.a,p:.3},b:{c:o.b||o.a,n:.1},c:{c:o.c||'#d8cdb2',n:.06},d:{c:o.d||'#1a1418',n:.06},e:{c:o.e||'#ffd24a',glow:1},m:{c:o.m||'#8a8f9a',n:.05},x:{c:o.x||o.b||o.a,n:.08},g:{c:o.g||o.e||'#ffd24a',glow:1},k:{c:'#0d0907',n:0}};return q};
const M=(name,o,parts)=>({name,pal:pal(o),parts});
function surf(p){const F=new Map(),T=new Map(),S=new Map();for(const[x,y,z]of p.v.values()){const k=x+','+y,k2=x+','+z,k3=y+','+z;if(!F.has(k)||F.get(k)<z)F.set(k,z);if(!T.has(k2)||T.get(k2)<y)T.set(k2,y);
    const sv=S.get(k3)||[1e9,-1e9];S.set(k3,[Math.min(sv[0],x),Math.max(sv[1],x)])}
  return{fz:(x,y)=>F.get(x+','+y),ty:(x,z)=>T.get(x+','+z),sx:(y,z,sgn)=>{const v=S.get(y+','+z);return v?(sgn<0?v[0]:v[1]):null}}}
/* paint an ellipse onto the front of a part; lift>0 raises it out of the surface */
function decal(p,cx,cy,rx,ry,c,lift,sf){sf=sf||surf(p);for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2>1)continue;const z=sf.fz(x,y);if(z==null)continue;for(let k=0;k<=(lift||0);k++)p.set(x,y,z+k,c)}return p}
/* paint onto the top surface */
function topDecal(p,cx,cz,rx,rz,c,lift,sf){sf=sf||surf(p);for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)for(let z=Math.floor(cz-rz);z<=Math.ceil(cz+rz);z++){if(((x+.5-cx)/rx)**2+((z+.5-cz)/rz)**2>1)continue;const y=sf.ty(x,z);if(y==null)continue;for(let k=0;k<=(lift||0);k++)p.set(x,y+k,z,c)}return p}
/* big eyes with a pale rim and a dark or glowing pupil, lifted from the face */
function bigEyes(p,cx,cy,gap,r,pupil,sf){sf=sf||surf(p);for(const s of[-1,1]){const ex=cx+s*gap;decal(p,ex,cy,r,r,'w',1,sf);const z=sf.fz(Math.round(ex),Math.round(cy));if(z!=null){const px=Math.round(ex-s*.4),py=Math.round(cy);p.box(px-1,px,py-1,py,z+2,z+2,pupil||'k');p.set(px-(s<0?1:0),py,z+3,'w')}}return p}
/* light flecks on the upper body so large plain surfaces read as rounded */
function flecks(p,n,seed,c,yMin){const sf=surf(p),pts=[...p.v.values()].filter(e=>e[1]>=(yMin||-1e9));for(let k=0;k<n&&pts.length;k++){const e=pts[Math.floor(H(k,seed,7)*pts.length)],y=sf.ty(e[0],e[2]);if(y!=null)p.set(e[0],y,e[2],c||'h')}return p}
/* ---------- archetypes ---------- */
function quad(name,o){const parts=[],L=o.len||16,Hh=o.legs||7,R=o.r||6,body=new P('body',[0,0,0]);parts.push(body);const y0=Hh+R*.8;
  for(let z=-L/2;z<=L/2;z++){const t=z/(L/2),r=R*(1-t*t*.35)*(t>0?1.05:.95);body.ell(-.5,y0+(o.hump&&t<0?-t*2:0),z,r,r*(o.tall||.85),1,H(0,z,2)<.15?'b':'a')}
  if(o.belly)for(let z=-L/2+2;z<=L/2-2;z++)body.box(-2,1,y0-R*.8,y0-R*.8+1,z,z,'c');
  if(o.spikes)for(let z=-L/2+1;z<=L/2;z+=2)body.box(0,0,y0+R*.8,y0+R*.8+o.spikes-(Math.abs(z)>L/3?1:0),z,z,'x');
  if(o.plates)for(let z=-L/2;z<=L/2;z+=3)body.box(-R,R-1,y0+R*.5,y0+R*.7,z,z+1,'x');
  if(o.mane)for(let y=-2;y<4;y++)body.ell(-.5,y0+y,L/2-1,R+1.4,1.4,1.8,'x');
  for(const[sx,sz,nm]of[[-1,1,'leg_FL'],[1,1,'leg_FR'],[-1,-1,'leg_BL'],[1,-1,'leg_BR']]){const lg=new P(nm,[sx*(R*.6),y0-2,sz*(L/2-2)],'body');tube(lg,[[sx*R*.6,y0-2,sz*(L/2-2)],[sx*R*.7,Hh*.5,sz*(L/2-2)+1],[sx*R*.7,1,sz*(L/2-2)+2]],o.legr||1.8,(o.legr||1.8)*.8,'a');lg.box(sx*R*.7-1,sx*R*.7+1,0,1,sz*(L/2-2)+1,sz*(L/2-2)+4,o.hoof?'d':'b');if(!o.hoof)for(let k=-1;k<=1;k++)lg.set(Math.round(sx*R*.7+k),0,sz*(L/2-2)+5,'c');parts.push(lg)}
  const hz=L/2+2,hy=y0+(o.neckUp||3),head=new P('head',[0,hy,hz],'body');parts.push(head);tube(body,[[0,y0,L/2-1],[0,hy,hz]],R*.55,R*.45,'a');
  const hr=o.head||4.5;head.ell(-.5,hy+1,hz+1,hr,hr*.9,hr,'a');if(o.snout)head.ell(-.5,hy,hz+hr+o.snout*.5,hr*.55,hr*.5,o.snout,'b');
  if(o.frog){head.ell(-.5,hy,hz+1,hr*1.35,hr*.7,hr*1.1,'a');head.ell(-.5,hy-1,hz+1.5,hr*1.2,hr*.45,hr*1.05,'c');let sf=surf(head);decal(head,-.5,hy-.2,hr*1.25,.6,'k',0,sf);
    for(const s2 of[-1,1]){head.ell(s2*hr*.75-.5,hy+hr*.75,hz+hr*.4,hr*.38,hr*.38,hr*.38,'a');head.ell(s2*hr*.75-.5,hy+hr*.8,hz+hr*.65,hr*.27,hr*.27,hr*.2,'w');head.box(Math.round(s2*hr*.75)-1,Math.round(s2*hr*.75),Math.round(hy+hr*.75),Math.round(hy+hr*.75),Math.round(hz+hr*.85),Math.round(hz+hr*.85),'e')}
    for(const sx of[-1,1]){body.ell(sx*R*.85-.5,y0-R*.3,-L/2+2,R*.5,R*.55,R*.6,'a');for(let k=-1;k<=1;k++)body.box(Math.round(sx*(R+1.5)+k*1.2),Math.round(sx*(R+1.5)+k*1.2),0,0,-L/2+k,-L/2+k+3,'b')}
    for(let k=0;k<14;k++)topDecal(body,(H(k,1,4)-.5)*R*1.6,(H(k,2,4)-.5)*L*.9,.9,.9,'x',0)}
  else{eyes(head,0,hy+2,hz+hr+.3,Math.max(1,hr*.45|0),'e');for(const s2 of[-1,1]){const bx=s2*Math.max(1,hr*.45|0);head.box(s2<0?bx-2:bx,s2<0?bx-1:bx+1,hy+3,hy+3,Math.round(hz+hr),Math.round(hz+hr),'s')}
    if(o.snout)head.box(-1,0,hy+1,hy+1,Math.round(hz+hr+o.snout*.5+o.snout-.5),Math.round(hz+hr+o.snout*.5+o.snout-.5),'k')}
  if(o.ears)for(const s of[-1,1])tube(head,[[s*hr*.6,hy+hr*.7,hz],[s*hr*.9,hy+hr+o.ears,hz-1]],1.2,.6,'b');
  if(o.horns)for(const s of[-1,1])tube(head,[[s*hr*.7,hy+hr*.6,hz+1],[s*(hr+2),hy+hr+2,hz-1],[s*(hr+3),hy+hr+o.horns,hz-4]],1.2,.5,'c');
  if(o.tusks)for(const s of[-1,1])tube(head,[[s*2,hy-1,hz+hr+o.snout],[s*3,hy+2,hz+hr+o.snout+2]],.8,.5,'c');
  if(o.teeth)head.box(-2,1,hy-2,hy-2,hz+hr+(o.snout||0)-1,hz+hr+(o.snout||0),'c');
  if(o.bone){body.paint(-R,R,y0-1,y0+R,-L/2,L/2,'c');for(let z=-L/2;z<L/2;z+=2)body.cut(-R+1,R-2,y0-1,y0+1,z,z)}
  flecks(body,o.len>14?18:12,1,'h',y0);
  if(o.rosettes)for(let k=0;k<22;k++){const sf0=surf(body),x=Math.round((H(k,1,6)-.5)*R*1.8),z=Math.round((H(k,2,6)-.5)*L*.95),y=sf0.ty(x,z);if(y!=null){body.set(x,y,z,'s');body.set(x+1,y,z,'s');body.set(x,y,z+1,'x')}}
  if(o.shards)for(let z=-L/2+1;z<=L/2;z+=2){const h=2+Math.round(H(z,3,6)*4),lean=(z%4?1:-1);tube(body,[[0,y0+R*.7,z],[lean,y0+R*.7+h,z-1]],1.1,.4,z%4?'x':'c')}
  const tail=new P('tail0',[0,y0,-L/2],'body');tube(tail,[[0,y0,-L/2],[0,y0+(o.tailUp||1),-L/2-(o.tail||6)*.5],[0,y0+(o.tailUp||1)*2,-L/2-(o.tail||6)]],o.tailr||1.4,.6,o.tailc||'a');parts.push(tail);return M(name,o,parts)}
function biped(name,o){const parts=[],h=o.h||30,bulk=o.bulk||1,body=new P('body',[0,0,0]);parts.push(body);const hip=h*.42,sh=h*.78,tw=5*bulk;
  for(let y=hip;y<=sh;y++){const t=(y-hip)/(sh-hip),r=tw*(.8+.35*t)*(o.belly?1+.3*Math.sin(t*3):1);body.ell(-.5,y,0,r,.6,r*.7,o.robe&&t<.6?'x':'a')}
  if(o.armor){body.paint(-tw,tw,hip+2,sh,1,tw,'m');body.box(-tw-1,-tw+1,sh-2,sh,-2,2,'m');body.box(tw-2,tw,sh-2,sh,-2,2,'m')}
  if(o.robe){for(let y=1;y<hip;y++){const r=tw*(1.2-y/hip*.4);body.ell(-.5,y,0,r,.6,r*.8,'x')}}
  else for(const s of[-1,1]){const lg=new P(s<0?'leg_L':'leg_R',[s*tw*.45,hip,0],'body');tube(lg,[[s*tw*.45,hip,0],[s*tw*.5,hip*.5,.5],[s*tw*.5,2,0]],1.8*bulk,1.5*bulk,o.legc||'b');lg.box(s*tw*.5-1.5,s*tw*.5+1.5,0,1,-1,3,'d');parts.push(lg)}
  if(o.cape)for(let y=hip-4;y<sh;y++)body.box(-tw,tw-1,y,y,-tw*.7-1,-tw*.7-1,'x');
  if(!o.robe){for(let x=-Math.ceil(tw*.8);x<Math.ceil(tw*.8);x++){const sf0=surf(body);const z=sf0.fz(x,Math.round(hip+1));if(z!=null)body.set(x,Math.round(hip+1),z,'d')}if(!o.armor)for(let k=-1;k<=1;k++)body.box(k*2,k*2+1,Math.round(hip-3),Math.round(hip),Math.round(tw*.5),Math.round(tw*.5),'x')}
  if(o.ribs)for(let y=Math.round(hip+3);y<sh-2;y+=2)decal(body,-.5,y,tw*.65,.6,'c',0);
  if(o.wings)for(const s2 of[-1,1]){const w=new P(s2<0?'wing_L':'wing_R',[s2*tw*.5,sh-2,-tw*.6],'body');for(let i=0;i<=o.wings;i++){const x=Math.round(s2*(tw*.5+i)),top=Math.round(sh-2+i*.7),d=Math.max(2,Math.round((o.wings-i)*.8));for(let j=0;j<=d;j++)w.set(x,top-j,Math.round(-tw*.6-1-j*.3),j===0?'b':'x')}parts.push(w)}
  if(o.tail){const t=new P('tail0',[0,hip,-tw*.6],'body');tube(t,[[0,hip,-tw*.6],[0,hip-3,-tw*.6-o.tail*.5],[0,hip-1,-tw*.6-o.tail]],1.3,.6,'a');if(o.tailtip)t.ell(-.5,hip-1,-tw*.6-o.tail-1,1.4,1.4,1.4,'x');parts.push(t)}
  flecks(body,12,5,'h',hip)
  for(const s of[-1,1]){const nm=s<0?'arm_L':'arm_R',ar=new P(nm,[s*tw*1.1,sh-1,0],'body');const hand=[s*tw*1.3,hip+1,3];tube(ar,[[s*tw*1.1,sh-1,0],[s*tw*1.45,(sh+hip)/2,1],hand],1.7*bulk,1.4*bulk,o.armor?'m':'a');ar.ell(hand[0]+.5,hand[1],hand[2]+.5,1.6*bulk,1.6*bulk,1.6*bulk,'b');
    if(o.claws)for(let k=-1;k<=1;k++)tube(ar,[[hand[0]+k,hand[1]-1,hand[2]+1],[hand[0]+k,hand[1]-3,hand[2]+3]],.6,.4,'c');
    if(s>0&&o.weapon){const w=o.weapon,hx=hand[0],hy=hand[1];if(w==='spear'||w==='halberd'||w==='lance'||w==='staff'){ar.box(hx,hx,hy-8,hy+h*.55,hand[2],hand[2],w==='staff'?'b':'d');if(w==='spear'||w==='lance')tube(ar,[[hx,hy+h*.55,hand[2]],[hx,hy+h*.55+5,hand[2]]],1.4,.5,'m');
        if(w==='halberd'){ar.box(hx,hx+4,hy+h*.45,hy+h*.52,hand[2],hand[2],'m');ar.box(hx-2,hx,hy+h*.48,hy+h*.5,hand[2],hand[2],'m')}if(w==='staff')ar.ell(hx+.5,hy+h*.55+1,hand[2]+.5,2,2,2,'g')}
      else if(w==='sword'){ar.box(hx,hx,hy,hy+12,hand[2]+1,hand[2]+1,'m');ar.box(hx-2,hx+2,hy,hy,hand[2]+1,hand[2]+1,'d')}
      else if(w==='axe'){ar.box(hx,hx,hy-2,hy+10,hand[2],hand[2],'d');ar.box(hx,hx+4,hy+6,hy+10,hand[2],hand[2],'m')}
      else if(w==='flail'){ar.box(hx,hx,hy,hy+4,hand[2],hand[2],'d');for(let k=0;k<3;k++)tube(ar,[[hx,hy+4,hand[2]],[hx+2+k*2,hy+2-k*2,hand[2]+2+k]],.5,.5,'m')}
      else if(w==='censer'){tube(ar,[[hx,hy,hand[2]],[hx,hy-6,hand[2]+1]],.4,.4,'m');ar.ell(hx+.5,hy-8,hand[2]+1.5,2.2,2.2,2.2,'m');ar.box(hx-1,hx+1,hy-7,hy-7,hand[2]+3,hand[2]+3,'g')}}
    if(s<0&&o.shield){ar.box(hand[0]-1,hand[0]-1,hand[1]-5,hand[1]+5,hand[2]-3,hand[2]+4,'m');ar.box(hand[0]-2,hand[0]-2,hand[1]-1,hand[1]+1,hand[2],hand[2]+1,'x')}parts.push(ar)}
  const hy=sh+1,head=new P('head',[0,hy,0],'body');parts.push(head);const hr=(o.headr||4.2)*(bulk>1.3?1.1:1),hd=o.head||'plain';
  if(hd==='hood'){head.ell(-.5,hy+hr,0,hr+1,hr+1.2,hr+1,'x');head.ell(-.5,hy+hr-.5,1.5,hr*.75,hr*.85,hr,'k');eyes(head,0,hy+hr,hr+.5,1,'e')}
  else if(hd==='helm'){head.ell(-.5,hy+hr,0,hr,hr*1.1,hr,'m');head.box(-hr,hr-1,hy+hr-.5,hy+hr,hr-1,hr,'k');eyes(head,0,hy+hr,hr+.4,1,'e');if(o.plume)tube(head,[[0,hy+hr*2,0],[0,hy+hr*2+3,-3],[0,hy+hr*2+1,-7]],1.3,.8,'x')}
  else if(hd==='skull'){head.ell(-.5,hy+hr,0,hr,hr,hr*.9,'c');head.box(-2,1,hy+1,hy+2,hr-2,hr-1,'c');eyes(head,0,hy+hr,hr*.9,1,'k',2);head.box(-1,-1,hy+hr-2,hy+hr-2,hr,hr,'k');head.box(-2,1,hy+hr,hy+hr,hr,hr,'e')}
  else if(hd==='beak'){head.ell(-.5,hy+hr,0,hr,hr,hr,'x');tube(head,[[0,hy+hr-1,hr-1],[0,hy+hr-3,hr+5],[0,hy+hr-5,hr+8]],2,.5,'c');eyes(head,0,hy+hr+1,hr,2,'g');head.box(-hr-1,hr,hy+hr*2-1,hy+hr*2,-hr-1,hr,'d');head.box(-hr+1,hr-2,hy+hr*2+1,hy+hr*2+4,-hr+1,hr-2,'d')}
  else{head.ell(-.5,hy+hr,0,hr,hr,hr*.95,o.headc||'a');if(o.snout)head.ell(-.5,hy+hr-1,hr,hr*.5,hr*.45,o.snout,'b');eyes(head,0,hy+hr+.5,hr*.95+(o.snout?0:0),hr>4?2:1,'e');
    for(const s2 of[-1,1]){const g=hr>4?2:1;head.box(s2<0?-g-2:g,s2<0?-g-1:g+1,Math.round(hy+hr+2),Math.round(hy+hr+2),Math.round(hr*.85),Math.round(hr*.95),'s')}
    if(o.mouth){head.box(-2,1,hy+hr-2,hy+hr-2,Math.round(hr*.95),Math.round(hr*.95),'k');head.set(-2,hy+hr-1,Math.round(hr*.95),'c');head.set(1,hy+hr-1,Math.round(hr*.95),'c')}}
  if(o.horns)for(const s of[-1,1])tube(head,[[s*hr*.7,hy+hr*1.5,0],[s*(hr+2),hy+hr*2+1,-1],[s*(hr+2.5),hy+hr*2+o.horns,-3]],1.1,.5,'c');
  if(o.crown)for(let x=-3;x<3;x+=2)head.box(x,x,hy+hr*2,hy+hr*2+2,-1,0,'g');if(o.ears)for(const s of[-1,1])tube(head,[[s*hr*.8,hy+hr*1.4,0],[s*(hr+1),hy+hr*2+o.ears,-1]],1,.5,'b');
  if(o.backspikes)for(let y=hip+2;y<sh;y+=3)body.box(-1,0,y,y+1,-tw*.7-1,-tw*.7-3,'x');if(o.chains)for(let y=hip;y<sh;y+=2)body.box(-tw,tw-1,y,y,tw*.7,tw*.7,(y/2)%2?'m':'d');
  return M(name,o,parts)}
function flyer(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const y0=o.y||16,R=o.r||4;body.ell(-.5,y0,0,R,R*1.1,R*1.5,'a');if(o.belly)body.ell(-.5,y0-1,1,R*.7,R*.8,R*1.2,'c');
  const head=new P('head',[0,y0+R*.6,R*1.4],'body');parts.push(head);const hr=o.head||3;head.ell(-.5,y0+R*.8,R*1.4+hr*.6,hr,hr,hr,'a');eyes(head,0,y0+R*.9,R*1.4+hr*1.5,1,'e');
  if(o.beak)tube(head,[[0,y0+R*.6,R*1.4+hr*1.4],[0,y0+R*.2,R*1.4+hr*1.4+o.beak]],1.2,.4,'c');if(o.ears)for(const s of[-1,1])tube(head,[[s*hr*.6,y0+R*.8+hr*.6,R*1.4+hr*.4],[s*(hr+1),y0+R*.8+hr+o.ears,R*1.4]],1,.4,'a');
  if(o.antenna)for(const s of[-1,1])tube(head,[[s*1,y0+R*.8+hr*.8,R*1.4+hr],[s*3,y0+R*.8+hr+4,R*1.4+hr+3]],.5,.4,'c');
  if(o.fangs)head.box(-1,0,y0+R*.8-hr+1,y0+R*.8-hr+2,R*1.4+hr*1.5,R*1.4+hr*1.5,'c');
  /* wings raised in a shallow V so they read from the front and above: a bone along the leading edge, then membrane or feathers hanging from it */
  const sp=o.span||16,wd=o.wd||7;for(const s of[-1,1]){const w=new P(s<0?'wing_L':'wing_R',[s*R*.8,y0+1,0],'body');
    for(let i=0;i<=sp;i++){const f=i/sp,x=Math.round(s*(R*.8+i)),top=Math.round(y0+1+i*.45+Math.sin(f*Math.PI)*(o.wh||5)*.6),depth=Math.max(2,Math.round(wd*(1-f*.55))),scal=o.mem?Math.round(Math.abs(Math.sin(f*Math.PI*3))*2.2):0;
      for(let j=0;j<=depth-scal;j++){const y=top-j,z=Math.round(-j*.55-1);let c=o.mem?'x':(j>=depth-scal-1?'x':(j>depth*.45?'b':'a'));if(o.wing2&&Math.abs(f-.55)<.12&&Math.abs(j-depth*.5)<1.6)c=j===Math.round(depth*.5)?'e':'c';w.set(x,y,z,c)}
      w.set(x,top+1,-1,o.mem?'b':'a');w.set(x,top,0,o.mem?'b':'a');                       // the wing's leading edge
      if(!o.mem&&i%2===0)w.set(x,top-depth-1,Math.round(-depth*.55-1),'x');                 // feather tips
      if(o.mem&&i>2&&i%Math.max(3,Math.round(sp/4))===0)for(let j=0;j<=depth;j++)w.set(x,top-j,Math.round(-j*.55-1),'b')}           // finger bones
    if(o.mem)w.set(Math.round(s*(R*.8+sp*.45)),Math.round(y0+3+sp*.45*.45+(o.wh||5)*.6),0,'c');                                          // a thumb claw
    parts.push(w)}
  /* fur or feathers on the chest, and a ruff where the neck meets the body */
  body.ell(-.5,y0+R*.5,R*1.1,R*.75,R*.6,R*.5,o.belly?'c':'b');if(!o.gear)flecks(body,10,2,'h');
  if(o.ruff)for(let k=0;k<12;k++){const t=k/12*6.28;body.ell(Math.cos(t)*R*.85-.5,y0+R*.75,R*.9+Math.sin(t)*R*.6,1.3,1.3,1.3,'c')}
  if(o.legs!==false)for(const s of[-1,1]){const lg=new P(s<0?'leg_L':'leg_R',[s*2,y0-R,0],'body');tube(lg,[[s*2,y0-R,0],[s*2,y0-R-4,1],[s*2,y0-R-6,2]],1,.7,'c');for(let k=-1;k<=1;k++)lg.set(s*2+k,Math.round(y0-R-7),3+Math.abs(k)*-1+1,'d');parts.push(lg)}
  if(o.tail){const t=new P('tail0',[0,y0,-R*1.4],'body');tube(t,[[0,y0,-R*1.4],[0,y0-1,-R*1.4-o.tail]],1.2,.5,'a');if(o.fan)for(let k=-2;k<=2;k++)tube(t,[[0,y0-1,-R*1.4-o.tail],[k*1.5,y0-1,-R*1.4-o.tail-4]],.7,.5,'x');parts.push(t)}
  if(o.stinger)tube(body,[[0,y0-R,-R],[0,y0-R-3,-R-3],[0,y0-R-6,-R-2]],1,.4,'x');if(o.gear){body.paint(-R,R,y0-R,y0+R,-R,R,'m');for(let a=0;a<12;a++){const t=a/12*6.28;body.set(Math.round(Math.cos(t)*R*1.1),y0+Math.round(Math.sin(t)*R*1.1),0,'d')}}
  return M(name,o,parts)}
function crawler(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const L=o.len||14,R=o.r||5,y0=o.y||(R*.9+2),segs=o.segs||3;
  for(let k=0;k<segs;k++){const z=-L/2+k*L/(segs-1||1),r=R*(k===segs-1?.85:1)*(o.taper?1-k*.12:1);body.ell(-.5,y0,z,r,r*(o.flat||.7),L/(segs*1.6)+1,k%2?'b':'a')}
  if(o.shell)for(let z=-L/2;z<=L/2;z++)body.ell(-.5,y0+R*.35,z,R+.6,R*.5,.6,'x');if(o.spikes)for(let z=-L/2;z<=L/2;z+=3)body.box(0,0,y0+R*.7,y0+R*.7+o.spikes,z,z,'c');
  const nl=o.nlegs||6;for(let k=0;k<nl/2;k++){const z=-L/2+2+k*(L-4)/Math.max(1,nl/2-1);for(const s of[-1,1]){const lg=new P('leg_'+(s<0?'L':'R')+k,[s*R*.8,y0,z],'body');tube(lg,[[s*R*.8,y0,z],[s*(R+4),y0+(o.high||3),z+(k-1)],[s*(R+6),0,z+(k-1)*2]],.9,.6,'d');lg.ell(s*(R+4)-.5,y0+(o.high||3),z+(k-1),1.3,1.3,1.3,'b');lg.set(Math.round(s*(R+6.5)),0,Math.round(z+(k-1)*2+1),'k');parts.push(lg)}}
  if(o.shell){for(let z=-Math.floor(L/2);z<=Math.ceil(L/2);z++){const sf0=surf(body),y=sf0.ty(0,z);if(y!=null)body.set(0,y,z,'s')}flecks(body,16,8,'h',y0)}else flecks(body,8,8,'h',y0)
  const hz=L/2+R*.6,head=new P('head',[0,y0,hz],'body');parts.push(head);head.ell(-.5,y0,hz,R*.75,R*.6,R*.6,'a');head.ell(-.5,y0+R*.3,hz-R*.2,R*.8,R*.3,R*.5,'s');eyes(head,0,y0+1,hz+R*.6,1,'e');head.box(-2,1,y0+2,y0+2,Math.round(hz+R*.55),Math.round(hz+R*.55),'s');
  if(o.eyes4)eyes(head,0,y0+2.5,hz+R*.5,2,'e');if(o.mandibles)for(const s of[-1,1])tube(head,[[s*2,y0-1,hz+R*.6],[s*3,y0-1,hz+R*.6+3],[s*1,y0-1,hz+R*.6+5]],.8,.5,'c');
  if(o.claws)for(const s of[-1,1]){const ar=new P(s<0?'arm_L':'arm_R',[s*R,y0,L/2-1],'body');tube(ar,[[s*R,y0,L/2-1],[s*(R+4),y0+2,L/2+3],[s*(R+3),y0+1,L/2+7]],1.4,1.2,'a');ar.ell(s*(R+3)+.5,y0+1,L/2+9,2.6,2,3,'x');ar.box(s*(R+3),s*(R+3),y0+1,y0+1,L/2+9,L/2+12,'k');parts.push(ar)}
  if(o.horn)tube(head,[[0,y0+R*.5,hz+R*.3],[0,y0+R+3,hz+R+2],[0,y0+R+5,hz+R-1]],1.4,.5,'c');if(o.gear)for(let a=0;a<10;a++){const t=a/10*6.28;body.set(Math.round(Math.cos(t)*(R+1)),y0+R*.6,Math.round(Math.sin(t)*(R+1)),'m')}
  if(o.glow)body.box(-1,0,y0+R*.6,y0+R*.7,-L/2,L/2,'g');if(o.tail){const t=new P('tail0',[0,y0,-L/2],'body');tube(t,[[0,y0,-L/2],[0,y0+4,-L/2-4],[0,y0+9,-L/2-3],[0,y0+10,-L/2+1]],1.6,.6,'b');t.box(0,0,y0+10,y0+11,-L/2+1,-L/2+3,'c');parts.push(t)}
  return M(name,o,parts)}
function serpent(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const R=o.r||3.5,n=o.coils||14,pts=[];
  /* a real coil on the floor: a wide spiral that winds inward and climbs, so each loop shows */
  const r0=R*2.1+3,r1=R*1.05+1;for(let k=0;k<=n;k++){const f=k/n,a=k*.62,rad=r0+(r1-r0)*f;pts.push([Math.cos(a)*rad,R+f*n*(o.rise||.6)*.9,Math.sin(a)*rad-2])}
  tube(body,pts,R,R*.85,'a','b');
  /* a pale belly line along the underside and a row of darker marks along the back */
  for(let k=0;k<pts.length;k++){const q=pts[k];if(k%2===0)body.set(Math.round(q[0]),Math.round(q[1]+R*.85),Math.round(q[2]),o.marks||'s');body.set(Math.round(q[0]*.9),Math.round(q[1]-R*.6),Math.round(q[2]*.9),'c')}
  const nk=new P('neck0',pts[n],'body');parts.push(nk);const top=[0,pts[n][1]+(o.neck||10),4];tube(nk,[pts[n],[pts[n][0]*.5,pts[n][1]+(o.neck||10)*.6,2],top],R*.85,R*.75,'a','b');
  for(let y=Math.ceil(pts[n][1]+2);y<top[1];y+=2){const f=(y-pts[n][1])/(top[1]-pts[n][1]),x=Math.round(pts[n][0]*(1-f)),z=Math.round(2+f*2+R*.7);nk.set(x,y,z,'c')}
  const head=new P('head',top,'neck0');parts.push(head);const hz=top[2]+2,hy=top[1]+1;
  head.ell(-.5,hy,hz,R*1.15,R*.85,R*1.6,'a');head.ell(-.5,hy-R*.45,hz+R*.2,R*.95,R*.45,R*1.4,'b');                 // skull and a lower jaw
  for(const s2 of[-1,1])head.ell(s2*R*.55-.5,hy+R*.55,hz+R*.6,R*.35,R*.3,R*.5,'s');                                   // brow ridges
  let sf=surf(head);for(const s2 of[-1,1]){const ex=Math.round(s2*R*.55)-(s2<0?1:0),ey=Math.round(hy+R*.25),ez=Math.round(hz+R*1.1);head.box(ex,ex,ey,ey,ez,ez+1,'e');head.box(ex,ex,ey+1,ey+1,ez-1,ez,'s')}
  head.set(-1,Math.round(hy+R*.1),Math.round(hz+R*1.6),'k');head.set(0,Math.round(hy+R*.1),Math.round(hz+R*1.6),'k');                     // nostrils
  if(o.hood)for(const s2 of[-1,1]){head.ell(s2*R*1.3-.5,top[1],top[2]-1,R*.95,R*1.9,.8,'x');head.ell(s2*R*1.3-.5,top[1]+R*.4,top[2]-.6,R*.45,R*.6,.6,'s')}
  if(o.fangs)for(const s2 of[-1,1]){head.box(s2,s2,hy-R*.45-1,hy-R*.2,hz+R*1.3,hz+R*1.3,'c')}
  if(o.fins){for(let k=2;k<n;k+=2)body.box(0,0,pts[k][1]+R,pts[k][1]+R+2,pts[k][2]-1,pts[k][2]+1,'x');for(const s2 of[-1,1])tube(head,[[s2*R,hy,hz-R*.5],[s2*(R+2.5),hy+1,hz-R*1.4]],1,.4,'x')}
  if(o.glow)head.ell(-.5,top[1]+R+3,top[2]+R*1.4+3,1.5,1.5,1.5,'g'),tube(head,[[0,top[1]+R,top[2]+2],[0,top[1]+R+3,top[2]+R*1.4+2]],.4,.4,'b');
  if(o.horns)for(const s2 of[-1,1])tube(head,[[s2*R*.7,top[1]+R*.8,top[2]],[s2*R*1.2,top[1]+R+3,top[2]-3]],.9,.4,'c');
  if(o.ringmouth){/* a round sucker of a mouth ringed with teeth */const mz=Math.round(hz+R*1.6);head.ell(-.5,hy-R*.1,mz-1,R*.8,R*.8,1.4,'s');head.ell(-.5,hy-R*.1,mz,R*.55,R*.55,1,'k');for(let k=0;k<10;k++){const t=k/10*6.28;head.set(Math.round(Math.cos(t)*R*.6-.5),Math.round(hy-R*.1+Math.sin(t)*R*.6),mz+1,'c')}}
  else if(o.mouth){head.paint(-Math.floor(R*.7),Math.floor(R*.7)-1,Math.round(hy-R*.25),Math.round(hy-R*.25),Math.floor(hz+R*.4),Math.ceil(hz+R*2),'k');for(let x=-Math.floor(R*.6);x<Math.floor(R*.6);x+=2)head.set(x,Math.round(hy-R*.25),Math.round(hz+R*1.5),'c')}
  if(o.suckers)for(let k=1;k<n;k+=2){const q=pts[k];body.ell(q[0]*1.12-.5,q[1],q[2]*1.12,1,1,1,'x')}
  flecks(body,18,4,'h');
  return M(name,o,parts)}
function floater(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const y0=o.y||18,R=(o.r||6)*(o.flame?1.35:1);
  if(o.flame){/* a living flame: a round heart, a body that narrows into three licking tongues, a hot core showing through, and loose embers */
    for(let y=-R;y<R*2.4;y++){const r=y<0?Math.sqrt(R*R-y*y):R*Math.max(.12,1-y/(R*2.5)),sw=y>R*.6?Math.sin(y*.7)*(y-R*.6)*.18:0;body.ell(-.5+sw,y0+y,0,r,.6,r*.9,y>R*1.5?'x':'a')}
    for(const[dx,h,ph]of[[-R*.55,R*1.5,0],[R*.6,R*1.7,1.3],[0,R*2.9,.6]]){const pts=[];for(let k=0;k<=4;k++){const f=k/4;pts.push([dx*(1-f*.5)+Math.sin(ph+f*3)*1.5,y0+R*.6+h*f,Math.sin(ph+f*2)*.8])}tube(body,pts,R*.42,.6,'x')}
    for(let k=0;k<9;k++){const a=k/9*6.28,rr=R*1.15+H(k,3,9)*R*.6;body.set(Math.round(Math.cos(a)*rr),Math.round(y0+R*.4+H(k,4,9)*R*2.2),Math.round(Math.sin(a)*rr*.6),k%3?'g':'x')}
    let sf=surf(body);decal(body,-.5,y0-R*.15,R*.62,R*.75,'x',0,sf);decal(body,-.5,y0-R*.3,R*.34,R*.42,'g',0,sf);
    sf=surf(body);bigEyes(body,-.5,Math.round(y0+R*.2),R*.42,Math.max(1.2,R*.22),'k',sf);decal(body,-.5,Math.round(y0-R*.45),R*.25,.7,'k',1,sf)}
  else body.ell(-.5,y0,0,R,R,R,'a');
  if(o.hood){/* a cowl round the head, open at the front onto a dark face */body.ell(-.5,y0+1,-1,R+1.3,R+1.5,R+1.1,'x');body.ell(-.5,y0+R+1,-R*.6,R*.45,R*.6,R*.45,'x');body.cut(-Math.floor(R*.75),Math.floor(R*.75)-1,Math.floor(y0-R*.7),Math.floor(y0+R*.75),Math.floor(R*.35),R+3);body.ell(-.5,y0,R*.1,R*.85,R*.85,R*.6,'k')}
  if(o.core)body.ell(-.5,y0,R*.6,R*.45,R*.45,R*.45,'g');
  if(o.eye){body.ell(-.5,y0,R*.85,R*.4,R*.4,.8,'e');if(o.iris){body.ell(-.5,y0,R*.85+1,R*.22,R*.22,.6,'w');body.ell(-.5,y0,R*.85+1.6,R*.1+.4,R*.1+.4,.5,'k')}}
  else if(!o.flame){const w2=R>5?2:1;body.paint(-1-w2,-1,y0,y0+w2-1,Math.floor(R*.3),R+3,o.hood?'e':'e');body.paint(1,1+w2,y0,y0+w2-1,Math.floor(R*.3),R+3,'e');if(o.hood)for(const s2 of[-1,1])body.box(s2<0?-1-w2:1,s2<0?-1:1+w2,y0,y0+w2-1,Math.floor(R*.7),Math.floor(R*.7),'e')}
  if(o.crystal){for(let k=0;k<8;k++){const a=k/8*6.28,l=R+3+(k%2)*2;tube(body,[[Math.cos(a)*R*.8,y0+Math.sin(a)*R*.8,0],[Math.cos(a)*l,y0+Math.sin(a)*l,(k%3-1)*1.5]],1.4,.4,k%2?'x':'h')}for(let k=0;k<4;k++){const a=k/4*6.28+.4;tube(body,[[Math.cos(a)*R*.5,y0,Math.sin(a)*R*.5],[Math.cos(a)*R*.6,y0,Math.sin(a)*(R+4)]],1,.4,'x')}flecks(body,14,5,'w')}
  if(o.tendrils)for(let k=0;k<o.tendrils;k++){const a=k/o.tendrils*6.28,pts=[[Math.cos(a)*R*.6,y0-R*.6,Math.sin(a)*R*.6],[Math.cos(a)*R*.95,y0-R-4,Math.sin(a)*R*.95+1],[Math.cos(a+.4)*R*.8,y0-R-9,Math.sin(a+.4)*R*.8+2],[Math.cos(a+.9)*R*.5,y0-R-13,Math.sin(a+.9)*R*.5+2]];tube(body,pts,1.6,.6,'b');
    for(let j=1;j<3;j++){const q=pts[j];body.set(Math.round(q[0]*1.08),Math.round(q[1]),Math.round(q[2]*1.08+1),'c')}}
  if(o.mantle){for(let k=0;k<10;k++){const a=Math.PI*(.2+H(k,2,4)*1.6)+Math.PI*.5,y=y0+R*.2+H(k,3,4)*R*.6;body.ell(Math.cos(a)*R*.9-.5,y,Math.sin(a)*R*.9,1.4,1.4,1.4,'x')}flecks(body,12,6,'h',y0)}
  if(o.robe){const bot=y0-R-12;for(let y=y0-R;y>bot;y--){const r=R*(.8+(y0-R-y)*.045);body.ell(-.5,y,0,r,.6,r*.7,(y%3)?'b':'x')}
    /* a ragged hem: strips of cloth hang to different lengths */for(let k=0;k<16;k++){const a=k/16*6.28,r=R*(.8+12*.045),x=Math.round(Math.cos(a)*r*.95),z=Math.round(Math.sin(a)*r*.68),l=1+Math.floor(H(k,7,2)*4);body.box(x,x,bot-l,bot,z,z,k%2?'b':'s')}
    for(let y=y0-R-2;y>bot;y-=3)decal(body,-.5,y,R*.5,.6,'s',0)}
  if(o.ring)for(let a=0;a<36;a++){const t=a/36*6.28;body.set(Math.round(Math.cos(t)*(R+3)),y0+(a%2),Math.round(Math.sin(t)*(R+3)),a%4?'x':'g')}
  if(o.halo)for(let a=0;a<24;a++){const t=a/24*6.28;body.set(Math.round(Math.cos(t)*(R*.8)),y0+R+3,Math.round(Math.sin(t)*(R*.8))-1,'g')}
  if(o.voidtails)for(let k=0;k<6;k++){const a=k/6*6.28+.3,bx=Math.cos(a)*R*.9,bz=Math.sin(a)*R*.6;tube(body,[[bx,y0-R-10,bz],[bx*1.4,y0-R-15,bz*1.4],[bx*1.1+Math.sin(k)*2,y0-R-20,bz*1.2]],1.2,.4,k%2?'x':'b');body.set(Math.round(bx*1.1+Math.sin(k)*2),Math.round(y0-R-21),Math.round(bz*1.2),'g')}
  if(o.horns)for(const s2 of[-1,1])tube(body,[[s2*R*.6,y0+R*.6,0],[s2*(R+2),y0+R+3,-1]],1.1,.4,'c');if(o.mouth)body.paint(-2,1,Math.round(y0-R*.4),Math.round(y0-R*.4)+1,Math.floor(R*.3),R+2,'k');
  if(o.arms)for(const s2 of[-1,1]){const ar=new P(s2<0?'arm_L':'arm_R',[s2*R,y0-1,0],'body');const hand=[s2*(R+5),y0-8,5];tube(ar,[[s2*R,y0-1,0],[s2*(R+4),y0-4,3],hand],1.5,.9,o.robe?'x':'b');ar.ell(s2*(R+4)-.5,y0-3,2.5,2,1.6,2,o.robe?'x':'b');
    for(let k=-1;k<=1;k++)tube(ar,[hand,[hand[0]+k,y0-11,6+Math.abs(k)*.5]],.5,.4,'c');
    if(s2>0&&o.censer){tube(ar,[hand,[hand[0],y0-14,6]],.3,.3,'m');ar.ell(hand[0]+.5,y0-16,6.5,2.4,2,2.4,'m');ar.box(hand[0]-1,hand[0]+1,y0-15,y0-15,8,8,'g');ar.box(hand[0]-2,hand[0]+2,y0-17,y0-17,6,7,'d');
      for(let k=0;k<5;k++)ar.ell(hand[0]+.5+Math.sin(k*1.7)*1.5,y0-13+k*2.2,6.5+k*.4,1.2+k*.25,1.1,1.2+k*.25,'c')}
    if(s2>0&&o.trumpet){tube(ar,[hand,[hand[0]+2,y0-6,10],[hand[0]+3,y0-3,15]],.6,1.6,'m');ar.ell(hand[0]+3.5,y0-2.5,16,2.6,2.6,.8,'m');for(let y=0;y<6;y++)ar.box(hand[0]+1,hand[0]+3,y0-7-y,y0-7-y,11,11,y%2?'x':'g')}
    parts.push(ar)}
  return M(name,o,parts)}
function blob(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const R=o.r||9,Hb=R*1.6,rAt=y=>{const t=y/Hb;return R*Math.sqrt(Math.max(0,1-Math.pow(t*1.1-.15,2)))};
  for(let y=0;y<Hb;y++){const r=rAt(y)*(1+.08*Math.sin(y));body.ell(-.5,y,0,r,.6,r*.9,y<2?'b':'a')}
  /* a lumpy, living surface: a few bulges round the sides and back */
  for(let k=0;k<(o.big?9:6);k++){const a=Math.PI*(.25+H(k,4,3)*1.5)+(k%2?Math.PI:0),y=Hb*(.2+H(k,5,3)*.55),r=rAt(y);body.ell(Math.cos(a)*r*.82-.5,y,Math.sin(a)*r*.75,2.2+H(k,6,3)*1.6,2+H(k,7,3)*1.4,2.2+H(k,8,3)*1.4,k%3?'a':'x')}
  /* stubby feet so it sits on the floor */
  for(const[sx,sz]of[[-1,1],[1,1],[-1,-1],[1,-1]])body.ell(sx*R*.55-.5,1,sz*R*.45,R*.32,1.6,R*.3,'b');
  if(o.inner)for(let k=0;k<6;k++)body.ell(H(k,1,1)*R-R/2,R*.5+H(k,2,1)*R*.6,H(k,3,1)*R*.6-R*.3,1.4,1.4,1.4,'x');
  if(o.drips)for(let k=0;k<8;k++){const a=k/8*6.28,x=Math.round(Math.cos(a)*R*.9),z=Math.round(Math.sin(a)*R*.8);body.box(x,x,0,2+k%3,z,z,'x');body.set(x,0,z+(k%2),'x')}
  let sf=surf(body);
  if(o.spots)for(let k=0;k<11;k++){const a=Math.PI*(H(k,9,2)*2),y=Hb*(.25+H(k,10,2)*.6),r=rAt(y)*.9,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>R*.55&&y<Hb*.75)continue;body.ell(x-.5,y,z,1.4+H(k,11,2),1.4,1.4+H(k,11,2),'x')}
  sf=surf(body);const ey=Math.round(R*1.02),mouthY=Math.round(R*.58);
  if(o.mouth){const mw=o.big?4:3;decal(body,-.5,mouthY,mw+1.2,1.9,'s',0,sf);decal(body,-.5,mouthY,mw,1.2,'k',0,sf);if(o.teeth||o.big)for(let x=-mw;x<mw;x+=2){const z=sf.fz(x,mouthY+1);if(z!=null)body.set(x,mouthY+1,z,'c')}if(o.teeth)for(let x=-mw+1;x<mw;x+=2){const z=sf.fz(x,mouthY-1);if(z!=null)body.set(x,mouthY-1,z,'c')}}
  sf=surf(body);bigEyes(body,-.5,ey,o.big?3.4:2.8,o.big?2.3:1.9,'e',sf);
  /* brows give the face an expression */
  for(const s of[-1,1]){const bx=-.5+s*(o.big?3.2:2.6);for(let k=-1;k<=1;k++){const x=Math.round(bx+k),y=ey+Math.round((o.big?2.4:2.1)+(o.mean?-k*s*.6:0)),z=sf.fz(x,y);if(z!=null)body.set(x,y,z+1,'s')}}
  if(o.lure){tube(body,[[0,R*1.5,0],[0,R*1.5+5,3],[0,R*1.5+6,R+3]],.6,.5,'b');body.ell(-.5,R*1.5+5,R+4,2,2,2,'g');body.ell(-.5,R*1.5+5,R+4,1,1,1,'w')}
  if(o.cap){for(let y=0;y<5;y++)body.ell(-.5,R*1.5+y,0,R*1.3-y*1.6,.6,R*1.2-y*1.5,'x');for(let k=0;k<7;k++)body.set(Math.round(Math.cos(k*.9)*R*.8),R*1.5+2,Math.round(Math.sin(k*.9)*R*.7),'c')}
  if(o.fins)for(const sx of[-1,1])tube(body,[[sx*R*.8,R*.8,-1],[sx*(R+3),R*1.1,-3],[sx*(R+2),R*.4,-4]],1,.5,'x');
  flecks(body,o.big?26:16,3,'h',Hb*.45);
  return M(name,o,parts)}
function golem(name,o){const parts=[],body=new P('body',[0,0,0]);parts.push(body);const s0=o.size||1,h=34*s0,hip=h*.35,sh=h*.8,tw=8*s0;
  for(let y=hip;y<=sh;y++){const t=(y-hip)/(sh-hip),r=tw*(.75+.45*t);body.ell(-.5,y,0,r,.6,r*.7,H(0,y,7)<.18?'b':'a')}if(o.core)body.ell(-.5,(hip+sh)/2,tw*.6,3*s0,3*s0,2,'g');
  if(o.crystals)for(let k=0;k<7;k++){const a=H(k,1,5)*3.1-1.55;tube(body,[[Math.sin(a)*tw*.7,sh-2-k*2,-tw*.4],[Math.sin(a)*(tw+3),sh+4+k%3*2,-tw*.6-2]],1.6,.5,'x')}if(o.vents)for(let y=hip+3;y<sh;y+=4)body.box(-tw*.6,tw*.6,y,y,tw*.7,tw*.7,'g');
  if(o.moss)for(let k=0;k<12;k++)body.ell(H(k,1,1)*tw*1.6-tw*.8,sh-H(k,2,1)*6,H(k,3,1)*tw*.6,1.6,1,1.6,'x');if(o.bones)for(let y=hip;y<sh;y+=3)body.box(-tw*.9,tw*.9-1,y,y,tw*.5,tw*.6,'c');
  for(const s of[-1,1]){const lg=new P(s<0?'leg_L':'leg_R',[s*tw*.5,hip,0],'body');tube(lg,[[s*tw*.5,hip,0],[s*tw*.55,2,0]],3*s0,3.4*s0,'b');lg.box(s*tw*.55-3*s0,s*tw*.55+3*s0,0,1,-2,4*s0,'d');parts.push(lg)}
  for(const s of[-1,1]){const ar=new P(s<0?'arm_L':'arm_R',[s*tw*1.15,sh-2,0],'body');const hand=[s*tw*1.5,hip-2*s0,3];tube(ar,[[s*tw*1.15,sh-2,0],[s*tw*1.55,(sh+hip)/2,1],hand],3.2*s0,2.6*s0,'a');ar.ell(hand[0]+.5,hand[1]-1,hand[2]+.5,3.6*s0,3.6*s0,3.6*s0,o.fists||'b');
    if(o.weapon==='hammer'&&s>0){ar.box(hand[0],hand[0],hand[1]-2,hand[1]+16,hand[2],hand[2],'d');ar.box(hand[0]-4,hand[0]+4,hand[1]+14,hand[1]+19,hand[2]-2,hand[2]+2,'m')}if(o.weapon==='club'&&s>0)tube(ar,[[hand[0],hand[1],hand[2]],[hand[0]+2,hand[1]+14,hand[2]+4]],1.5,3,'d');parts.push(ar)}
  const hy=sh+1,head=new P('head',[0,hy,0],'body');parts.push(head);const hr=(o.headr||4)*s0;head.ell(-.5,hy+hr*.8,hr*.4,hr,hr*.9,hr,'a');eyes(head,0,hy+hr,hr*1.35,hr>4?2:1,'e');if(o.horns)for(const s of[-1,1])tube(head,[[s*hr*.7,hy+hr,0],[s*(hr+3),hy+hr+3,0],[s*(hr+4),hy+hr+6,-2]],1.6,.6,'c');
  if(o.jaw)head.box(-hr+1,hr-2,hy-1,hy,hr*1.2,hr*1.5,'c');if(o.cap){for(let y=0;y<5;y++)head.ell(-.5,hy+hr*1.6+y,0,hr*2-y*1.4,.6,hr*1.8-y*1.3,'x')}
  return M(name,o,parts)}
const A={quad,biped,flyer,crawler,serpent,floater,blob,golem};
/* ---------- every lesser monster and miniboss: an archetype and its own build ---------- */
const C={
 angler:['blob',{a:'#1e3a52',b:'#16283a',x:'#2a4a6a',c:'#e0e8f0',e:'#9fe8ff',g:'#7ff0ff',r:8,mouth:1,lure:1,teeth:1}],
 bat:['flyer',{a:'#4a3a3a',b:'#2a2020',x:'#5a3a3a',c:'#d8c0b0',e:'#ff4a3a',r:3.5,y:14,span:14,wd:6,wh:3,mem:1,ears:3,fangs:1}],
 bile:['blob',{a:'#9ab030',b:'#6a8a20',x:'#d0e060',c:'#e8f0a0',e:'#2a1a08',r:8,inner:1,drips:1,mouth:1}],
 boar:['quad',{a:'#6a5040',b:'#4a3628',c:'#e8e0c8',x:'#2a2018',e:'#ff6a3a',len:16,r:6.5,legs:5,snout:4,tusks:1,spikes:2,hump:1,hoof:1,ears:2}],
 censer:['floater',{a:'#3a3040',b:'#2a2030',x:'#6a5a7a',e:'#ffc060',g:'#ffb050',r:5,y:22,robe:1,arms:1,core:1,hood:1,censer:1}],
 crab:['crawler',{a:'#b04a2a',b:'#8a3a20',x:'#d06a3a',c:'#f0d0b0',e:'#1a1010',len:10,r:7,segs:2,flat:.5,nlegs:6,claws:1,shell:1}],
 drone:['flyer',{a:'#b08a40',b:'#8a6a2a',x:'#d8c070',c:'#e8d8a0',m:'#c8a050',e:'#7ff0ff',r:4,y:18,span:10,wd:5,wh:2,antenna:1,gear:1,legs:false}],
 eel:['serpent',{a:'#2a4a6a',b:'#1a3048',x:'#40c0ff',c:'#c0e0f0',e:'#ffe060',g:'#7ff0ff',r:3,coils:12,rise:.4,neck:12,fins:1,glow:1,mouth:1}],
 flagellant:['biped',{a:'#c09080',b:'#8a5a4a',x:'#4a1a1e',m:'#6a6a70',e:'#ff5a2a',h:28,head:'hood',weapon:'flail',robe:1,chains:1}],
 gargoyle:['biped',{a:'#6a6a70',b:'#4a4a50',x:'#5a5a62',c:'#8a8a90',e:'#ff9a3a',h:26,bulk:1.2,head:'plain',horns:4,claws:1,backspikes:1,snout:2,wings:11,tail:8}],
 geode:['crawler',{a:'#6a5a6a',b:'#4a3a4a',x:'#ff70ff',c:'#ffb0ff',e:'#ff70ff',len:10,r:5,segs:2,nlegs:6,spikes:3,shell:1}],
 ghoul:['biped',{a:'#7a7a6a',b:'#5a5a4a',x:'#3a3a32',c:'#d8d0b0',e:'#a0f0ff',h:26,head:'plain',claws:1,mouth:1,headc:'c',ribs:1}],
 graveworm:['serpent',{a:'#c09a88',b:'#9a7868',c:'#e8d0c0',e:'#2a1a10',r:4,coils:10,rise:.3,neck:8,mouth:1,ringmouth:1}],
 halberdier:['biped',{a:'#5a5e6a',b:'#3a3e48',x:'#8a2a24',m:'#9aa3ad',e:'#ff9a3a',h:32,head:'helm',plume:1,weapon:'halberd',armor:1,cape:1}],
 harpy:['flyer',{a:'#8a7a9a',b:'#5a4a6a',x:'#c0b0d8',c:'#e8d8c8',e:'#a0c0ff',r:4,y:18,span:16,wd:7,wh:6,beak:3,tail:5,fan:1,ruff:1}],
 icewisp:['floater',{a:'#c8f0ff',b:'#7fc8ff',x:'#e8f8ff',e:'#2a4a6a',g:'#c8f0ff',r:5,y:20,crystal:1,core:1,mouth:1}],
 idol:['golem',{a:'#3a6a4a',b:'#2a5038',x:'#70ffa0',c:'#d8c070',e:'#70ffa0',g:'#70ffa0',size:.7,core:1,headr:4.5}],
 imp:['biped',{a:'#c04a20',b:'#8a2a10',x:'#ff9a3a',c:'#2a1a10',e:'#ffe060',h:22,head:'plain',horns:3,claws:1,ears:2,mouth:1,wings:9,tail:9,tailtip:1}],
 kobold:['biped',{a:'#a07040',b:'#7a5030',x:'#5a3a20',m:'#9aa3ad',c:'#e8d8b0',e:'#ffd24a',h:24,head:'plain',snout:3,ears:2,weapon:'spear',shield:1,tail:8}],
 leech:['serpent',{a:'#3a2a30',b:'#2a1a20',x:'#8a3a4a',c:'#c08a9a',e:'#ff6a6a',r:4.5,coils:8,rise:.3,neck:6,mouth:1,ringmouth:1,suckers:1}],
 mite:['crawler',{a:'#d8d0e0',b:'#a8a0b8',x:'#7a6a9a',c:'#f0f0f8',e:'#c070ff',len:8,r:4,segs:2,nlegs:8,eyes4:1,mandibles:1,high:4}],
 moldbug:['crawler',{a:'#6a5a3a',b:'#4a3a28',x:'#b0d060',c:'#e0f080',e:'#e0f080',len:14,r:5,segs:4,nlegs:6,shell:1,spikes:1}],
 mote:['floater',{a:'#ffe060',b:'#ffb020',x:'#fff0a0',e:'#2a2a4a',g:'#ffffff',r:4,y:20,flame:1}],
 moth:['flyer',{a:'#a89070',b:'#7a6a50',x:'#d8c8a0',c:'#f0e8d0',e:'#ff5a3a',r:3.5,y:16,span:13,wd:8,wh:7,antenna:1,wing2:1,legs:false}],
 nullshade:['floater',{a:'#24183a',b:'#120c20',x:'#3a2a5a',e:'#c070ff',g:'#c070ff',r:6,y:20,robe:1,arms:1,eye:1,hood:1,voidtails:1,iris:1}],
 puff:['blob',{a:'#c0a0d0',b:'#9a7ab0',x:'#e8d0f0',c:'#ffffff',e:'#2a1a2a',r:7,spots:1,big:1}],
 rat:['quad',{a:'#6a5a50',b:'#4a3e36',c:'#e0b0b0',x:'#3a302a',e:'#ff4a3a',len:12,r:4.5,legs:4,snout:3,ears:2,tail:10,tailr:.9,tailc:'c',teeth:1}],
 rimewolf:['quad',{a:'#c8dce8',b:'#9ab8cc',c:'#ffffff',x:'#e8f4ff',e:'#7fc8ff',len:16,r:5.5,legs:8,snout:4,ears:3,mane:1,tail:8,tailUp:2,teeth:1}],
 scarab:['crawler',{a:'#1a6a6a',b:'#104848',x:'#40d0c0',c:'#d8c070',e:'#ffc060',len:10,r:6,segs:2,flat:.6,nlegs:6,shell:1,horn:1}],
 shardlizard:['quad',{a:'#6a4a7a',b:'#4a3058',c:'#ffb0ff',x:'#ff70ff',e:'#ff70ff',len:16,r:4.5,legs:4,snout:4,spikes:3,tail:12,tailr:1.6,shards:1}],
 slagbug:['crawler',{a:'#3a2a26',b:'#2a1c18',x:'#ff7a20',g:'#ff7a20',c:'#ffc060',e:'#ffc060',len:12,r:5.5,segs:3,flat:.6,nlegs:6,shell:1,glow:1}],
 sporeling:['blob',{a:'#e080ff',b:'#a050c0',x:'#c060e0',c:'#f8e0ff',e:'#2a1a2a',r:5,cap:1,spots:1}],
 tick:['crawler',{a:'#c8a050',b:'#8a6a2a',m:'#e0c070',c:'#e8d8a0',e:'#7ff0ff',len:9,r:5,segs:2,flat:.75,nlegs:8,gear:1,high:4}],
 toad:['quad',{a:'#5a7a3a',b:'#3a5a28',c:'#d8e0a0',x:'#8aa04a',e:'#ffd24a',len:12,r:7,legs:3,neckUp:1,head:5.5,belly:1,tail:1,tailr:.6,frog:1}],
 viper:['serpent',{a:'#3a8a5a',b:'#2a6a40',x:'#d8c070',c:'#e8f0c0',e:'#ffd24a',r:3,coils:12,neck:12,hood:1,fangs:1}],
 voidspawn:['blob',{a:'#2a1a3a',b:'#1a0e28',x:'#c070ff',c:'#e0b0ff',e:'#c070ff',r:7,inner:1,mouth:1,big:1,wc:'#e8c8ff'}],
 vulture:['flyer',{a:'#3a2e28',b:'#2a201c',x:'#c8b8a0',c:'#e8b0a0',e:'#ffc060',r:4.5,y:16,span:17,wd:7,wh:6,beak:3,tail:4,belly:1,ruff:1}],
 whelp:['quad',{a:'#b04a20',b:'#8a3010',c:'#ffd080',x:'#ff9a3a',e:'#ffe060',len:13,r:4.5,legs:5,snout:3,horns:4,spikes:2,tail:10,tailr:1.4,teeth:1,belly:1}],
 wisp:['floater',{a:'#70ffd0',b:'#30c090',x:'#c0fff0',e:'#0a2a20',g:'#ffffff',r:4,y:18,flame:1}],
 bulwark:['biped',{a:'#6a6e7a',b:'#4a4e58',x:'#2a5a8a',m:'#b8c0c8',c:'#d8c070',e:'#ff9a3a',h:38,bulk:1.4,head:'helm',plume:1,weapon:'sword',shield:1,armor:1,cape:1}],
 colossus:['golem',{a:'#d8cdb2',b:'#b0a488',x:'#8a7a60',c:'#efe8d4',e:'#ffd24a',g:'#ff9a3a',size:1.2,bones:1,jaw:1,horns:1,weapon:'club'}],
 crimsonknight:['biped',{a:'#8a1a1e',b:'#5a1014',x:'#3a0a0e',m:'#c03030',c:'#d8c070',e:'#ffc060',h:38,bulk:1.3,head:'helm',plume:1,horns:3,weapon:'sword',armor:1,cape:1}],
 crystalgolem:['golem',{a:'#7a5a8a',b:'#5a3a6a',x:'#ff70ff',c:'#ffb0ff',e:'#ff70ff',g:'#ffb0ff',size:1.15,crystals:1,core:1}],
 doctor:['biped',{a:'#2a2a2a',b:'#1a1a1a',x:'#3a3a30',c:'#e8e0c0',d:'#3a2a1a',e:'#a0e040',g:'#a0e040',h:34,head:'beak',robe:1,weapon:'censer',cape:1}],
 forgegolem:['golem',{a:'#3a383e',b:'#2a282e',x:'#ff7a20',m:'#8a8f9a',e:'#ffc060',g:'#ff7a20',size:1.15,vents:1,core:1,weapon:'hammer',fists:'m'}],
 hag:['biped',{a:'#5a7a5a',b:'#3a5a3a',x:'#2a3a2a',c:'#c8d0a0',e:'#70ffd0',g:'#70ffd0',h:32,head:'hood',weapon:'staff',robe:1,claws:1,belly:1}],
 herald:['floater',{a:'#1a1028',b:'#0c0818',x:'#7040c0',e:'#e0d0ff',g:'#c070ff',r:7,y:26,robe:1,arms:1,ring:1,eye:1,hood:1,trumpet:1,halo:1,iris:1}],
 jaguar:['quad',{a:'#3a8a5a',b:'#2a6a40',c:'#d8f0c0',x:'#1a4a2a',e:'#ffd24a',len:18,r:5.5,legs:7,snout:3,ears:2,tail:12,tailUp:1,spikes:1,teeth:1,rosettes:1}],
 krakenspawn:['floater',{a:'#6a3a6a',b:'#4a2a4a',x:'#c070c0',c:'#e8c0e8',e:'#ffe060',r:8,y:20,tendrils:8,eye:1,mantle:1,iris:1}],
 mycelid:['golem',{a:'#c09a7a',b:'#9a7a5a',x:'#e080ff',c:'#f0e0d0',e:'#e080ff',size:1.1,cap:1,moss:1,headr:4.5}],
 ogre:['biped',{a:'#8a8a5a',b:'#6a6a40',x:'#5a3a20',m:'#8a8f9a',c:'#e8e0c0',e:'#ff6a3a',h:40,bulk:1.7,belly:1,head:'plain',mouth:1,weapon:'axe',headr:5}],
 piston:['biped',{a:'#b08a40',b:'#7a5a2a',x:'#5a4020',m:'#d8b060',c:'#e8d8a0',e:'#7ff0ff',h:36,bulk:1.35,head:'helm',weapon:'lance',armor:1,shield:1}],
 quintain:['biped',{a:'#7a5a3a',b:'#5a4028',x:'#8a2a24',m:'#9aa3ad',e:'#ffd24a',h:36,bulk:1.2,head:'helm',weapon:'flail',shield:1,robe:1}],
 ram:['quad',{a:'#4a5070',b:'#2c3250',c:'#e8e0c8',x:'#a0c0ff',e:'#a0f0ff',len:18,r:7,legs:7,snout:2,horns:7,mane:1,hoof:1,tail:3}],
 revenant:['biped',{a:'#a8c8dc',b:'#7a9ab0',x:'#2a3a5a',m:'#c8e0f0',c:'#e8f8ff',e:'#7fc8ff',h:38,bulk:1.2,head:'skull',crown:1,weapon:'sword',cape:1,armor:1}],
 sentinel:['biped',{a:'#3a5a58',b:'#2a4240',x:'#6a9a8a',m:'#4a7a70',c:'#c0e0d0',e:'#7ff0e0',h:38,bulk:1.4,head:'helm',weapon:'spear',shield:1,armor:1,backspikes:1}],
 spider:['crawler',{a:'#2a2440',b:'#1a1430',x:'#c8a0ff',c:'#e8e8f8',e:'#ff3a3a',len:16,r:7,segs:2,nlegs:8,eyes4:1,mandibles:1,high:7,spikes:2}],
 thornback:['quad',{a:'#5a4a30',b:'#3a3020',c:'#e8d8b0',x:'#8a9a3a',e:'#ffc060',len:18,r:7,legs:6,snout:3,spikes:5,plates:1,tail:9,tailr:2,hump:1}],
 warden:['biped',{a:'#d8d8e8',b:'#a8a8c0',x:'#7a6a9a',c:'#ffffff',e:'#c070ff',h:36,bulk:1.4,head:'hood',robe:1,claws:1,backspikes:1}],
 wurm:['serpent',{a:'#c8a870',b:'#a08050',x:'#8a6030',c:'#efe0c0',e:'#ff6a3a',r:5.5,coils:12,rise:.5,neck:14,mouth:1,fins:1,ringmouth:1}],
 wyvern:['flyer',{a:'#8a3a20',b:'#5a2010',x:'#d06a3a',c:'#ffd080',e:'#ffe060',r:5.5,y:20,span:22,wd:9,wh:7,mem:1,head:4,beak:4,tail:12,stinger:1,ears:3}]};
for(const id in C){if(B[id])continue;const[k,o]=C[id];B[id]=()=>A[k](id,o)}
O.CREATURE_KINDS=C;
})();
