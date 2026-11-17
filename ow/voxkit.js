/* Ossuary Wheel: voxel monsters built from body-plan kits. Every monster in the bestiary gets a model from its plan, colour and name;
   hand-built models in V.MON take precedence. Front is +z. Part names are shared across plans so one set of animations drives them all:
   body, head, jaw, arm_L/arm_R, leg_*, tail*, wing_L/wing_R, neck*. */
(()=>{
const O=window.OW,V=O.V,P=V.Part,H=V.hash;
const mix=(a,b,t)=>{const A=V.rgb(a),B=V.rgb(b);return'#'+A.map((v,i)=>Math.round(Math.max(0,Math.min(1,v+(B[i]-v)*t))*255).toString(16).padStart(2,'0')).join('')};
V.mix=mix;
const has=(n,...w)=>w.some(k=>n.toLowerCase().includes(k));
function palette(id,b){
  const t=b.theme||'#888888',bone=has(b.name,'vharn','skitter','bone','skull','colossus','lich','ghoul','revenant','hollow'),r=O.rng(O.hash('pal'+id));
  const eyes=['#ffd24a','#ff4a30','#7ff0c8','#9fd0ff','#d08aff','#a0ff60'][O.hash(id)%6];
  const p={base:{c:t,n:.09,alt:mix(t,'#000',.12),p:.28},dark:{c:mix(t,'#000',.35),n:.08},light:{c:mix(t,'#fff',.3),n:.06},belly:{c:mix(t,'#e8dcc0',.45),n:.06},
    acc:{c:mix(t,['#c9a04c','#8a2a24','#2a3a5a','#d8cdb2'][O.hash(id)%4],.6),n:.06},horn:{c:bone?'#e8dfc8':'#d8cfb8',n:.06},claw:{c:'#2a2426',n:.04},
    eye:{c:eyes,glow:1},eye2:{c:mix(eyes,'#fff',.5),glow:1},sock:{c:'#0d0a0c',n:0},tooth:{c:'#efe8d4',n:.03},metal:{c:'#8a909a',n:.05},metal_d:{c:'#5a5f68',n:.05},
    glow:{c:mix(t,'#fff',.55),glow:1},cloth:{c:mix(t,'#1a1418',.55),n:.07},wood:{c:'#6a4a2e',n:.1},cap:{c:mix(t,'#c8402a',.35),n:.08},spot:{c:'#efe6d0',n:.04}};
  if(bone){p.base={c:'#d8cdb2',n:.08,alt:'#c4b897',p:.25};p.dark={c:'#9a8f78',n:.08};p.light={c:'#efe6d0',n:.04};p.belly=p.light}
  return p}

/* ---- the nine plans ---- */
function quad(id,b,r){                     // a four-legged beast
  const L=Math.round(22+r()*8),W=Math.round(5+r()*3),Hh=Math.round(7+r()*3),leg=Math.round(8+r()*4),n=b.name;
  const body=new P('body',[0,leg+Hh/2,0]),head=new P('head',[0,leg+Hh,L/2],'body'),jaw=new P('jaw',[0,leg+Hh-3,L/2+3],'head'),tail=new P('tail',[0,leg+Hh-1,-L/2],'body'),parts=[body,head,jaw,tail];
  body.box(-W,W-1,leg,leg+Hh,-L/2,L/2,'base');body.box(-W+1,W-2,leg,leg,-L/2+2,L/2-2,'belly');body.box(-W,W-1,leg+Hh,leg+Hh,-L/2+1,L/2-1,'dark');
  if(has(n,'wolf','hound','stag','rat'))for(let z=-L/2+2;z<L/2-2;z+=3)body.box(-1,0,leg+Hh+1,leg+Hh+1+(z%2?1:0),z,z+1,has(n,'rime')?'light':'dark');      // a ridge of fur
  const hz=L/2,hy=leg+Hh,hw=Math.max(3,W-1);
  head.box(-hw,hw-1,hy-2,hy+5,hz-1,hz+6,'base');head.box(-hw+1,hw-2,hy-2,hy+1,hz+7,hz+9,'light');head.box(-1,0,hy,hy+1,hz+10,hz+10,'sock');
  head.box(-hw,-hw+1,hy+2,hy+3,hz+6,hz+6,'eye');head.box(hw-2,hw-1,hy+2,hy+3,hz+6,hz+6,'eye');
  jaw.box(-hw+1,hw-2,hy-4,hy-3,hz+3,hz+9,'dark');for(let x=-hw+1;x<hw-1;x+=2)jaw.set(x,hy-2,hz+9,'tooth');
  if(has(n,'boar'))for(const s of[-1,1])head.line([s<0?-hw:hw-1,hy-1,hz+8],[s<0?-hw-2:hw+1,hy+3,hz+10],'tooth');
  if(has(n,'stag'))for(const s of[-1,1]){const x=s<0?-hw+1:hw-2;head.line([x,hy+6,hz+2],[x+s*5,hy+14,hz],'horn');head.line([x+s*3,hy+10,hz+1],[x+s*1,hy+15,hz+4],'horn');head.line([x+s*5,hy+14,hz],[x+s*8,hy+17,hz-2],'horn')}
  else if(has(n,'ram','dragon','jade'))for(const s of[-1,1]){const x=s<0?-hw:hw-1;head.line([x,hy+5,hz+1],[x+s*3,hy+8,hz-2],'horn',2);head.line([x+s*3,hy+8,hz-2],[x+s*4,hy+4,hz-4],'horn',2)}
  else for(const s of[-1,1]){const x=s<0?-hw+1:hw-2;head.box(x,x,hy+6,hy+8,hz+1,hz+2,'dark')}
  if(has(n,'toad')){head.box(-hw-1,hw,hy+5,hy+7,hz+2,hz+4,'light');head.box(-hw-1,-hw,hy+6,hy+7,hz+4,hz+4,'eye');head.box(hw-1,hw,hy+6,hy+7,hz+4,hz+4,'eye')}
  if(has(n,'dragon'))for(const s of[-1,1]){const w=new P(s<0?'wing_L':'wing_R',[s*W,leg+Hh,2],'body');for(let i=0;i<14;i++)w.box(s<0?-W-i-1:W+i,s<0?-W-i-1:W+i,leg+Hh+1,leg+Hh+1+Math.round(10-Math.abs(i-5)*.8),-4+Math.round(i*.3),4-Math.round(i*.2),i%4===0?'dark':'acc');parts.push(w)}
  tail.line([0,hy-1,-L/2],[0,hy+3,-L/2-6],'base',2);tail.line([0,hy+3,-L/2-6],[0,hy+1,-L/2-11],'dark',1);
  for(const[nm,z]of[['legF',L/2-4],['legB',-L/2+3]])for(const s of[-1,1]){const x=s<0?-W:W-3,g=new P(nm+(s<0?'_L':'_R'),[x+1.5,leg,z+1],'body');g.box(x,x+2,0,leg,z,z+2,'base');g.box(x,x+2,0,1,z,z+3,'dark');g.box(x,x+2,0,0,z+3,z+3,'claw');parts.push(g)}
  return parts}

function biped(id,b,r){                   // an upright brute
  const n=b.name,big=has(n,'golem','ogre','colossus','sentinel','castellan','unmade','quintain','forge','crystal')?1:0,Tw=6+big*2,leg=9+big*2,Th=11+big*3;
  const torso=new P('body',[0,leg,0]),head=new P('head',[0,leg+Th,0],'body'),parts=[torso,head];
  torso.box(-Tw,Tw-1,leg,leg+Th,-4-big,3+big,'base');torso.box(-Tw+2,Tw-3,leg+2,leg+Th-2,4+big,4+big,'belly');torso.box(-Tw,Tw-1,leg+Th-2,leg+Th,-4-big,3+big,'dark');
  const armored=has(n,'morrow','knight','halberdier','castellan','sentinel','piston','revenant','quintain','flagellant');
  if(armored){torso.box(-Tw,Tw-1,leg+3,leg+Th,4+big,4+big,'metal');torso.box(-Tw-2,-Tw+1,leg+Th-3,leg+Th+1,-3,2,'metal_d');torso.box(Tw-2,Tw+1,leg+Th-3,leg+Th+1,-3,2,'metal_d');torso.box(-1,0,leg+3,leg+Th-1,5+big,5+big,'acc')}
  const hw=big?4:3,hy=leg+Th;
  head.box(-hw-1,hw,hy+1,hy+8,-3,4,armored?'metal':'base');
  if(armored){head.box(-hw-1,hw,hy+4,hy+4,5,5,'sock');head.box(-hw,hw-1,hy+4,hy+4,5,5,'eye');head.box(-1,0,hy+9,hy+12,-1,1,'acc')}
  else{head.box(-hw,-hw+1,hy+5,hy+6,5,5,'eye');head.box(hw-2,hw-1,hy+5,hy+6,5,5,'eye');head.box(-hw,hw-1,hy+1,hy+2,5,5,'dark');for(let x=-hw;x<hw;x+=2)head.set(x,hy+3,5,'tooth')}
  if(has(n,'imp','hag','kobold','sporeling','ghoul'))for(const s of[-1,1]){const x=s<0?-hw-1:hw;head.line([x,hy+7,0],[x+s*3,hy+11,-2],'horn')}
  if(has(n,'sporeling','hag'))head.box(-hw-3,hw+2,hy+9,hy+10,-5,6,'cap'),head.box(-hw-1,hw,hy+11,hy+11,-3,4,'cap'),head.set(-2,hy+10,6,'spot'),head.set(2,hy+11,2,'spot');
  if(has(n,'golem','crystal')){torso.box(-2,1,leg+5,leg+8,5+big,5+big,'glow');for(let k=0;k<5;k++){const x=Math.round((r()-.5)*Tw*2),y=leg+Th+Math.round(r()*3);torso.box(x,x+1,y,y+3+Math.round(r()*4),-2,0,has(n,'crystal')?'glow':'dark')}}
  const arm=new P('arm_R',[Tw+1,leg+Th-2,0],'body'),aw=big?4:3;
  arm.box(Tw,Tw+aw-1,leg+Th-12-big*2,leg+Th,-2,1,armored?'metal_d':'base');arm.box(Tw,Tw+aw-1,leg+Th-14-big*2,leg+Th-12-big*2,-2,2,'dark');arm.box(Tw,Tw+aw-1,leg+Th-15-big*2,leg+Th-15-big*2,1,2,'claw');
  const arml=arm.flipX('arm_L','body');
  if(has(n,'halberdier','kobold','quintain')){arm.line([Tw+1,leg-6,3],[Tw+1,leg+Th+12,3],'wood');arm.box(Tw-1,Tw+3,leg+Th+9,leg+Th+13,3,3,'metal');arm.box(Tw+1,Tw+1,leg+Th+14,leg+Th+16,3,3,'metal')}
  else if(has(n,'knight','castellan','revenant','piston','flagellant','unmade')){arm.box(Tw+1,Tw+2,leg+Th-14,leg+Th+8,3,4,'metal');arm.box(Tw-1,Tw+4,leg+Th-13,leg+Th-13,2,5,'acc')}
  parts.push(arm,arml);
  for(const s of[-1,1]){const x=s<0?-Tw+1:Tw-4,g=new P(s<0?'leg_L':'leg_R',[x+1.5,leg,0],'body');g.box(x,x+2+big,0,leg-1,-2,1,armored?'metal_d':'dark');g.box(x,x+2+big,0,1,-2,3,'dark');parts.push(g)}
  return parts}

function flyer(id,b,r){                  // wings out, small body
  const n=b.name,span=Math.round(14+r()*6),bh=12,body=new P('body',[0,bh,0]),head=new P('head',[0,bh+6,5],'body'),tail=new P('tail',[0,bh+1,-6],'body'),parts=[body,head,tail];
  body.ell(-.5,bh+3,0,4,4.5,6.5,'base');body.box(-2,1,bh,bh+4,4,5,'belly');
  head.ell(-.5,bh+8,7,3.2,3.2,3.2,'base');head.box(-3,-2,bh+8,bh+9,9,9,'eye');head.box(1,2,bh+8,bh+9,9,9,'eye');
  if(has(n,'harpy','vulture','coatl','gargoyle'))head.box(-1,0,bh+6,bh+8,10,13,'horn');else head.box(-2,1,bh+5,bh+7,9,12,'dark'),head.set(-2,bh+4,11,'tooth'),head.set(1,bh+4,11,'tooth');
  if(has(n,'gargoyle','wyvern','whelp'))for(const s of[-1,1])head.line([s<0?-3:2,bh+10,6],[s<0?-5:4,bh+14,3],'horn');
  if(has(n,'coatl'))for(let k=0;k<7;k++){const a=(k-3)*.32;head.line([0,bh+9,5],[Math.round(Math.sin(a)*7),bh+9+Math.round(Math.cos(a)*7),2],['acc','light','cap'][k%3])}
  for(const s of[-1,1]){const w=new P(s<0?'wing_L':'wing_R',[s*3,bh+5,0],'body');
    for(let i=0;i<span;i++){const x=s<0?-4-i:3+i,y=bh+5+Math.round(i*.35),zf=4-Math.round(i*.15),zb=-2-Math.round(Math.sin(i/span*Math.PI)*6)-Math.round(i*.15);
      w.box(x,x,y,y,zb,zf,'acc');w.box(x,x,y,y+1,zf,zf,'dark');if(i%4===3){w.box(x,x,y+1,y+1,zb+1,zf,'dark');w.set(x,y-1,zb,'claw')}}
    parts.push(w)}
  tail.line([0,bh+2,-6],[0,bh+1,-13],'base',2);tail.box(-2,1,bh,bh+2,-15,-13,'acc');
  for(const s of[-1,1]){const g=new P(s<0?'leg_L':'leg_R',[s*2,bh,0],'body');g.box(s<0?-3:1,s<0?-2:2,bh-6,bh,-1,0,'dark');g.box(s<0?-4:0,s<0?-1:3,bh-7,bh-7,-1,2,'claw');parts.push(g)}
  return parts}

function serpent(id,b,r){               // a coiled neck rising to a head
  const n=b.name,th=Math.round(4+r()*2),parts=[],body=new P('body',[0,4,0]);parts.push(body);
  for(let k=0;k<26;k++){const a=k*.38,x=Math.round(Math.cos(a)*(10-k*.25)),z=Math.round(Math.sin(a)*(10-k*.25))-4;body.box(x-th,x+th-1,0,th*2-1,z-2,z+2,k%3?'base':'dark');body.box(x-th+1,x+th-2,th*2,th*2,z-1,z+1,'acc')}
  const segs=4;let prev='body',y0=th*2;
  for(let k=0;k<segs;k++){const nk=new P('neck'+k,[0,y0+k*7,2+k*1.5],prev);nk.box(-th+1,th-2,y0+k*7,y0+k*7+7,1+k*1.5,4+k*1.5,k%2?'base':'dark');nk.box(-th+2,th-3,y0+k*7,y0+k*7+7,5+k*1.5,5+k*1.5,'belly');parts.push(nk);prev='neck'+k}
  const hy=y0+segs*7,head=new P('head',[0,hy,8],prev);head.box(-th,th-1,hy,hy+6,4,14,'base');head.box(-th+1,th-2,hy+6,hy+7,5,12,'dark');
  head.box(-th,-th+1,hy+4,hy+5,13,13,'eye');head.box(th-2,th-1,hy+4,hy+5,13,13,'eye');
  const jaw=new P('jaw',[0,hy,6],'head');jaw.box(-th+1,th-2,hy-2,hy-1,6,14,'dark');for(const x of[-th+1,th-2])jaw.box(x,x,hy,hy+1,13,14,'tooth'),head.box(x,x,hy-1,hy,13,14,'tooth');
  if(has(n,'wurm','worm','leech','maw')){head.box(-th+2,th-3,hy+2,hy+4,15,15,'sock');for(let a=0;a<8;a++)head.set(Math.round(Math.cos(a*.8)*(th-1)-.5),hy+3+Math.round(Math.sin(a*.8)*2),15,'tooth')}
  else for(const s of[-1,1])head.line([s<0?-th:th-1,hy+6,6],[s<0?-th-4:th+3,hy+10,2],'acc',1);
  if(has(n,'prism'))for(let k=0;k<6;k++)body.box(-1+k%3,k%3,th*2+1,th*2+3+k,-6+k*2,-5+k*2,'glow');
  parts.push(head,jaw);return parts}

function crawler(id,b,r){                // low, many legs
  const n=b.name,W=Math.round(7+r()*3),L=Math.round(12+r()*4),body=new P('body',[0,6,0]),head=new P('head',[0,7,L/2],'body'),parts=[body,head];
  body.ell(-.5,8,0,W,5,L/2+1,'base');body.box(-W+2,W-3,12,12,-L/2+2,L/2-2,'dark');for(let z=-L/2+2;z<L/2-1;z+=3)body.box(-W+1,W-2,12,13,z,z,'acc');
  if(has(n,'geode','crystal','slag'))for(let k=0;k<6;k++){const x=Math.round((r()-.5)*W*1.4),z=Math.round((r()-.5)*L);body.box(x,x+1,12,14+Math.round(r()*3),z,z+1,has(n,'slag')?'eye':'glow')}
  head.box(-4,3,4,9,L/2,L/2+4,'dark');head.box(-3,-2,7,8,L/2+5,L/2+5,'eye');head.box(1,2,7,8,L/2+5,L/2+5,'eye');if(has(n,'mite','tick','matron','spider'))head.box(-1,0,8,8,L/2+5,L/2+5,'eye2');
  const jaw=new P('jaw',[0,5,L/2+4],'head');
  if(has(n,'crab'))for(const s of[-1,1]){const c=new P(s<0?'arm_L':'arm_R',[s*(W-1),7,L/2-1],'body');const x=s<0?-W-4:W+1;c.line([s<0?-W+1:W-2,7,L/2-1],[x+1,8,L/2+4],'base',2);c.box(x-1,x+3,7,11,L/2+4,L/2+8,'acc');c.box(x-1,x+3,9,9,L/2+8,L/2+8,'sock');parts.push(c)}
  else for(const s of[-1,1])jaw.line([s<0?-3:2,5,L/2+4],[s<0?-2:1,4,L/2+8],'claw',1);
  parts.push(jaw);
  const pairs=has(n,'matron','mite','spider','skitter')?4:3;
  for(let k=0;k<pairs;k++)for(const s of[-1,1]){const z=Math.round(-L/2+3+k*(L-6)/(pairs-1)),g=new P('leg_'+k+(s<0?'L':'R'),[s*(W-1),8,z],'body'),x0=s<0?-W+1:W-2,x1=s<0?-W-6:W+5;
    g.line([x0,8,z],[x1,12,z+1],'dark',1);g.line([x1,12,z+1],[x1+s*2,0,z+2],'base',1);parts.push(g)}
  return parts}

function floater(id,b,r){                // an orb with an eye and trailing tendrils
  const n=b.name,R=Math.round(7+r()*3),cy=R+12,body=new P('body',[0,cy,0]),parts=[body];
  const glowy=has(n,'vharn','wisp','mote','idol','spark','herald','kiln','orrery');
  body.ell(-.5,cy,0,R,R,R,glowy?'light':'base');if(glowy){for(const[x,y,z]of[...body.v.values()])if(H(x,y,z)<.16)body.set(x,y,z,'glow')}
  const head=new P('head',[0,cy,R-1],'body');
  if(has(n,'eye','herald','angler','leviathan','puff')){head.ell(-.5,cy,R-1,R*.6,R*.6,1.6,'light');head.ell(-.5,cy,R+.5,R*.32,R*.32,1,'eye');head.box(-1,0,cy-1,cy,R+1,R+1,'sock')}
  else{head.box(-3,-2,cy+1,cy+2,R,R,'eye');head.box(1,2,cy+1,cy+2,R,R,'eye');head.box(-2,1,cy-3,cy-3,R,R,'sock')}
  if(has(n,'angler')){head.line([0,cy+R,2],[0,cy+R+5,R+2],'dark');head.box(-1,0,cy+R+5,cy+R+6,R+2,R+3,'eye2')}
  if(has(n,'kiln','orrery','idol'))for(let k=0;k<12;k++){const a=k/12*6.283;body.box(Math.round(Math.cos(a)*(R+3)),Math.round(Math.cos(a)*(R+3)),cy,cy,Math.round(Math.sin(a)*(R+3)),Math.round(Math.sin(a)*(R+3)),k%2?'acc':'metal')}
  if(has(n,'puff','spore'))for(let k=0;k<10;k++){const a=r()*6.283,e=r()*2-1;body.set(Math.round(Math.cos(a)*R*Math.sqrt(1-e*e)),Math.round(cy+e*R),Math.round(Math.sin(a)*R*Math.sqrt(1-e*e)),'spot')}
  parts.push(head);
  for(let k=0;k<5;k++){const a=k/5*6.283+.3,x=Math.round(Math.cos(a)*R*.55),z=Math.round(Math.sin(a)*R*.55),t=new P('tail'+k,[x,cy-R+2,z],'body');t.line([x,cy-R+2,z],[x+Math.round(Math.cos(a)*2),cy-R-8-k%2*3,z+Math.round(Math.sin(a)*2)],k%2?'dark':'acc');parts.push(t)}
  return parts}

function blob(id,b,r){                   // a heaped mass with a maw
  const n=b.name,R=Math.round(10+r()*3),body=new P('body',[0,0,0]),parts=[body];
  for(let y=0;y<R*1.4;y++){const rr=R*Math.sqrt(Math.max(0,1-Math.pow(y/(R*1.45),2)))+(y<2?1:0);for(let x=-Math.ceil(rr);x<=rr;x++)for(let z=-Math.ceil(rr);z<=rr;z++)if(x*x+z*z<=rr*rr)body.set(x,y,z,y<2?'dark':H(x,y,z)<.12?'light':'base')}
  const head=new P('head',[0,R*.7,R-2],'body');const fy=Math.round(R*.75);
  head.box(-5,-3,fy+2,fy+4,R-1,R-1,'eye');head.box(2,4,fy+2,fy+4,R-1,R-1,'eye');head.box(-4,3,fy-3,fy-1,R-1,R,'sock');for(let x=-4;x<4;x+=2)head.set(x,fy-1,R+1,'tooth');
  if(has(n,'kraken','void'))for(let k=0;k<4;k++){const a=k/4*6.283+.4,t=new P('tail'+k,[Math.round(Math.cos(a)*R),2,Math.round(Math.sin(a)*R)],'body');t.line([Math.round(Math.cos(a)*R),2,Math.round(Math.sin(a)*R)],[Math.round(Math.cos(a)*(R+7)),6+k%2*4,Math.round(Math.sin(a)*(R+7))],'acc',2);parts.push(t)}
  if(has(n,'mycelid'))for(let k=0;k<5;k++){const x=Math.round((r()-.5)*R),z=Math.round((r()-.5)*R),y=Math.round(R*1.2);body.box(x,x,y,y+3,z,z,'light');body.box(x-2,x+2,y+4,y+4,z-2,z+2,'cap')}
  parts.push(head);return parts}

function stalk(id,b,r){                  // a tall trunk crowned with heads or a cap
  const n=b.name,parts=[],H0=Math.round(20+r()*8),body=new P('body',[0,0,0]);parts.push(body);
  for(let y=0;y<H0;y++){const w=Math.round(4-y/H0*1.5);body.box(-w,w-1,y,y,-w,w-1,y%5===0?'dark':'base')}
  for(let k=0;k<5;k++){const a=k/5*6.283;body.line([0,1,0],[Math.round(Math.cos(a)*8),0,Math.round(Math.sin(a)*8)],'dark',2)}
  if(has(n,'hydra')){for(let k=0;k<3;k++){const a=(k-1)*.6,hx=Math.round(Math.sin(a)*10),nk=new P('neck'+k,[0,H0,0],'body');nk.line([0,H0,0],[hx,H0+10,3],'base',3);const hd=new P('head'+(k?k:''),[hx,H0+10,3],'neck'+k);
      hd.box(hx-3,hx+2,H0+9,H0+13,2,9,'base');hd.box(hx-3,hx-2,H0+12,H0+12,9,9,'eye');hd.box(hx+1,hx+2,H0+12,hx?H0+12:H0+12,9,9,'eye');hd.box(hx-2,hx+1,H0+8,H0+8,4,9,'dark');parts.push(nk,hd)}}
  else if(has(n,'cap')){const head=new P('head',[0,H0,0],'body');for(let y=0;y<6;y++){const rr=11-y*1.6;for(let x=-Math.ceil(rr);x<=rr;x++)for(let z=-Math.ceil(rr);z<=rr;z++)if(x*x+z*z<=rr*rr)head.set(x,H0+y,z,H(x,y,z)<.1?'spot':'cap')}
    head.box(-4,-3,H0-4,H0-3,3,3,'eye');head.box(2,3,H0-4,H0-3,3,3,'eye');parts.push(head)}
  else{const head=new P('head',[0,H0,0],'body');head.box(-5,4,H0,H0+7,-4,4,'base');head.box(-4,-3,H0+4,H0+5,5,5,'eye');head.box(2,3,H0+4,H0+5,5,5,'eye');head.box(-3,2,H0+1,H0+2,5,5,'sock');
    for(let k=0;k<9;k++){const a=k/9*6.283;head.line([0,H0+7,0],[Math.round(Math.cos(a)*9),H0+12+Math.round(r()*5),Math.round(Math.sin(a)*9)],k%2?'dark':'acc')}parts.push(head)}
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*4,H0-6,0],'body');a.line([s*4,H0-6,0],[s*12,H0-2,3],'dark',2);a.line([s*12,H0-2,3],[s*15,H0+3,6],'base',1);parts.push(a)}
  return parts}

function wraith(id,b,r){                 // a hooded robe drifting above the ground
  const n=b.name,parts=[],body=new P('body',[0,4,0]);parts.push(body);
  for(let y=4;y<26;y++){const w=Math.round(4+(26-y)*.28);for(let x=-w;x<w;x++)for(let z=-w;z<w;z++)if(x*x+z*z<w*w+1&&(y>4||H(x,y,z)<.6))body.set(x,y,z,y<7?'dark':'cloth')}
  body.box(-1,0,9,24,4,4,'acc');
  const head=new P('head',[0,27,0],'body');head.ell(-.5,29,0,5,5,5,'cloth');head.box(-3,2,26,31,3,5,'sock');head.box(-2,-1,29,29,5,5,'eye');head.box(1,2,29,29,5,5,'eye');
  if(has(n,'doctor')){head.line([0,28,4],[0,25,11],'tooth',2);head.box(-6,5,33,33,-6,5,'cloth')}
  if(has(n,'lich','pharaoh','superior','djinn','shade'))for(let k=0;k<5;k++)head.box(-4+k*2,-4+k*2,33,35+(k%2)*2,-1,0,'acc');
  if(has(n,'censer'))body.box(-3,2,2,5,-3,2,'metal'),body.box(-2,1,3,4,-2,1,'eye');
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*5,22,0],'body');a.line([s*5,22,0],[s*8,14,5],'cloth',2);a.line([s*8,14,5],[s*9,12,8],'claw',1);parts.push(a)}
  if(has(n,'warden','cocoon'))for(let y=6;y<24;y+=3)body.box(-6,5,y,y,-6,5,'light');
  parts.push(head);return parts}

const PLANS={quad,biped,flyer,serpent,crawler,floater,blob,stalk,wraith};
V.kitModel=function(id){
  const PL={spider:'crawler',bat:'flyer',vharn:'floater',bulwark:'biped',hound:'quad'},b=(window.OW_BEST&&OW_BEST.beasts[id])||Object.assign({plan:PL[id]||'biped'},O.MONSTERS[id]||{}),r=O.rng(O.hash('vox'+id)),fn=PLANS[b.plan]||biped;
  const parts=fn(id,b,r);
  /* every part keeps its own voxels; a part with no voxels is dropped */
  return{name:id,pal:palette(id,b),parts:parts.filter(p=>p.v.size)}};
V.monster=id=>V.MON[id]?V.MON[id]():V.kitModel(id);
})();
