/* Ossuary Wheel: the twenty dungeon bosses, built by hand in voxels. Front is +z. Shared part names drive the stage's animations:
   body, head, jaw, arm_L/arm_R, wing_L/wing_R, neck*, tail*, leg_*. */
(()=>{
const O=window.OW,V=O.V,P=V.Part,H=V.hash;
/* a tapered tube along a polyline: pts [[x,y,z],...], radius from r0 to r1 */
function tube(p,pts,r0,r1,col,col2){let tot=0;const seg=[];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);seg.push([a,b,l]);tot+=l}
  let run=0;for(const[a,b,l]of seg){const n=Math.max(1,Math.ceil(l));for(let k=0;k<=n;k++){const f=k/n,u=(run+l*f)/Math.max(1,tot),r=r0+(r1-r0)*u,c=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
      p.ell(c[0]+.5,c[1]+.5,c[2]+.5,Math.max(.6,r),Math.max(.6,r),Math.max(.6,r),col2&&(Math.floor((run+l*f)/3)%2)?col2:col)}run+=l}return p}
const eyes=(p,x,y,z,gap,c,w)=>{w=w||1;p.box(x-gap-w,x-gap,y,y+w-1,z,z,c);p.box(x+gap,x+gap+w,y,y+w-1,z,z,c)};
const B=V.MON;
const mk=(name,pal,parts)=>({name,pal,parts});

/* ---- The Hollow King: a dead tree that crowned itself ---- */
B.hollowking=()=>{const pal={bark:{c:'#5a4030',n:.12,alt:'#4a3426',p:.35},bark_d:{c:'#33241a',n:.1},moss:{c:'#5d7a3a',n:.12},gold:{c:'#c9a04c',n:.06},hole:{c:'#0d0907',n:0},eye:{c:'#ffd24a',glow:1},root:{c:'#4a3426',n:.1}};
  const body=new P('body',[0,0,0]),head=new P('head',[0,46,0],'body'),parts=[body,head];
  for(let y=0;y<46;y++){const r=9-y*.08+(y<6?(6-y)*.7:0);body.ell(-.5,y+.5,0,r,.6,r*.8,H(0,y,1)<.12?'moss':'bark')}
  body.ell(-.5,30,6,4.5,8,3,'hole');for(let k=0;k<7;k++){const a=k/7*6.283;tube(body,[[0,2,0],[Math.cos(a)*10,1,Math.sin(a)*10],[Math.cos(a)*17,0,Math.sin(a)*17]],2.5,1,'root')}
  for(let y=6;y<44;y+=4)body.box(-9,8,y,y,-7,6,'bark_d');body.ell(-.5,30,6,4.5,8,3,'hole');eyes(body,0,31,8,2,'eye',2);
  head.ell(-.5,48,0,8,4,7,'bark');head.box(-6,5,51,53,-5,5,'gold');for(let x=-6;x<6;x+=3)head.box(x,x+1,54,57,-1,0,'gold');
  for(const s of[-1,1]){tube(head,[[s*5,50,0],[s*10,58,-2],[s*14,66,-4],[s*20,70,-3]],1.6,.7,'bark_d');tube(head,[[s*12,62,-3],[s*17,64,2]],.9,.6,'bark_d');tube(head,[[s*9,56,-1],[s*7,64,3]],.9,.6,'bark_d')}
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*8,38,0],'body');tube(a,[[s*8,38,0],[s*16,32,3],[s*22,24,8],[s*24,16,12]],2.6,1.2,'bark');for(let k=0;k<4;k++)tube(a,[[s*24,16,12],[s*(24+k-1.5),10,15+k%2*2]],.8,.6,'bark_d');parts.push(a)}
  return mk('hollowking',pal,parts)};

/* ---- Mother Maw: a coiled sea lamprey with a ring of teeth ---- */
B.mothermaw=()=>{const pal={sk:{c:'#2f6a72',n:.1,alt:'#285c63',p:.3},sk_d:{c:'#1b3f45',n:.08},bel:{c:'#9ec8c0',n:.06},th:{c:'#efe8d4',n:.03},in:{c:'#3a0a14',n:.05},glow:{c:'#7ff0e0',glow:1},fin:{c:'#5fa8a0',n:.08}};
  const body=new P('body',[0,0,0]),parts=[body];const coil=[];for(let k=0;k<=30;k++){const a=k*.42,r=16-k*.25;coil.push([Math.cos(a)*r,3+k*.15,Math.sin(a)*r-4])}tube(body,coil,6,5,'sk','sk_d');
  let prev='body';const pts=[[0,8,8],[0,18,10],[0,28,9],[0,38,6],[0,46,4]];for(let k=0;k<4;k++){const n=new P('neck'+k,pts[k],prev);tube(n,[pts[k],pts[k+1]],5.5-k*.3,5.2-k*.3,'sk');n.box(-2,1,pts[k][1],pts[k+1][1],pts[k][2]+4,pts[k][2]+5,'bel');
    for(let y=pts[k][1];y<pts[k+1][1];y+=3)for(const s of[-1,1])n.box(s*5,s*5,y,y+1,pts[k][2]-1,pts[k][2]+1,'sk_d');parts.push(n);prev='neck'+k}
  const head=new P('head',[0,50,4],prev);head.ell(-.5,52,6,8,8,7,'sk');head.ell(-.5,52,12,7,7,3,'in');for(let a=0;a<18;a++){const t=a/18*6.283;head.box(Math.round(Math.cos(t)*6)-1,Math.round(Math.cos(t)*6),52+Math.round(Math.sin(t)*6),52+Math.round(Math.sin(t)*6),12,14,'th')}
  for(let a=0;a<10;a++){const t=a/10*6.283;head.set(Math.round(Math.cos(t)*3),52+Math.round(Math.sin(t)*3),13,'th')}head.ell(-.5,52,12,1.6,1.6,1,'glow');for(const s of[-1,1])for(let k=0;k<5;k++)head.box(s*8,s*8,47+k*2,47+k*2,0,3,'sk_d');
  for(const s of[-1,1])tube(head,[[s*6,58,2],[s*12,64,-4]],1.5,.6,'fin');parts.push(head);
  const tail=new P('tail0',[12,4,-10],'body');tube(tail,[[12,4,-10],[22,6,-16],[28,12,-20],[30,18,-18]],4,1,'sk','sk_d');parts.push(tail);
  return mk('mothermaw',pal,parts)};

/* ---- The Kiln Tyrant: a furnace that walks on fire ---- */
B.kilntyrant=()=>{const pal={br:{c:'#8a3a22',n:.12,alt:'#73301c',p:.35},br_d:{c:'#4a1c10',n:.1},ir:{c:'#2a2628',n:.08},ir_l:{c:'#5a5458',n:.06},fire:{c:'#ff7a20',glow:1},fire2:{c:'#ffd27a',glow:1},ash:{c:'#3a3436',n:.1}};
  const body=new P('body',[0,10,0]),head=new P('head',[0,40,0],'body'),jaw=new P('jaw',[0,22,10],'body'),parts=[body,head,jaw];
  for(let y=6;y<40;y++){const r=12-Math.abs(y-22)*.25;body.ell(-.5,y+.5,0,r,.6,r*.85,(y%3===0)?'br_d':'br')}
  body.box(-7,6,18,28,9,11,'ir');for(let x=-6;x<7;x+=2)body.box(x,x,19,27,11,11,'ir_l');body.ell(-.5,23,8,6,5,2,'fire');body.box(-5,4,20,26,10,10,'fire2');
  for(let k=0;k<14;k++){const a=k*.9,y=8+(k*7)%30;body.line([Math.round(Math.cos(a)*11),y,Math.round(Math.sin(a)*9)],[Math.round(Math.cos(a+.15)*11),y+3,Math.round(Math.sin(a+.15)*9)],'fire',1)}
  jaw.box(-8,7,20,21,11,13,'ir');head.ell(-.5,42,0,9,4,8,'br');for(const s of[-1,1]){head.box(s*6-1,s*6+1,44,54,-2,1,'br_d');head.box(s*6-1,s*6+1,55,56,-2,1,'fire')}eyes(head,0,41,8,3,'fire2',2);
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*12,30,0],'body');tube(a,[[s*12,30,0],[s*20,24,4],[s*24,14,8]],3.2,2.6,'ir','ir_l');a.ell(s*24-.5,11,9,4,4,4,'ir_l');if(s>0){a.box(23,26,-4,10,8,10,'ir');a.box(20,29,-9,-4,6,12,'ir_l')}parts.push(a)}
  for(let k=0;k<4;k++){const t=new P('tail'+k,[(k-1.5)*6,6,0],'body');t.ell((k-1.5)*6-.5,3,0,2.5,4,2.5,k%2?'fire':'fire2');parts.push(t)}
  return mk('kilntyrant',pal,parts)};

/* ---- The Venom Matron: a spider queen with a swollen, banded abdomen ---- */
B.matron=()=>{const pal={c:{c:'#3a2a40',n:.1,alt:'#2e2234',p:.3},c_d:{c:'#1e1622',n:.08},band:{c:'#9a5ac0',n:.08},mark:{c:'#d8c050',n:.06},eye:{c:'#ff3a3a',glow:1},fang:{c:'#e8e0c8',n:.03},ven:{c:'#9aff5a',glow:1},hair:{c:'#5a4660',n:.1}};
  const body=new P('body',[0,14,0]),head=new P('head',[0,16,12],'body'),jaw=new P('jaw',[0,13,18],'head'),parts=[body,head,jaw];
  body.ell(-.5,22,-14,13,11,15,'c');for(let k=-2;k<=2;k++)body.ell(-.5,22+k*.5,-14+k*5,13.3,11.2,1.2,'band');body.box(-2,1,30,33,-20,-8,'mark');body.box(-5,4,31,31,-15,-13,'mark');
  body.ell(-.5,16,2,8,6,8,'c_d');head.ell(-.5,17,13,6,5,6,'c');for(const[x,y]of[[-3,20],[2,20],[-1,21],[0,21],[-4,18],[3,18],[-2,22],[1,22]])head.set(x,y,18,'eye');
  for(const s of[-1,1])tube(jaw,[[s*2,14,17],[s*3,10,20],[s*1,7,21]],1.3,.6,'fang'),jaw.set(s>0?1:-2,6,21,'ven');
  for(let k=0;k<4;k++)for(const s of[-1,1]){const z=6-k*4,g=new P('leg_'+k+(s<0?'L':'R'),[s*6,16,z],'body'),x1=s*(18+k),x2=s*(26+k*1.5);
    tube(g,[[s*6,16,z],[x1,30,z+(k<2?6:-4)],[x2,0,z+(k<2?12:-10)]],1.6,.8,'c','hair');parts.push(g)}
  return mk('matron',pal,parts)};

/* ---- The Pale Stag: a giant white stag with antlers of frost ---- */
B.palestag=()=>{const pal={f:{c:'#dfe8ee',n:.06,alt:'#cbd8e0',p:.3},f_d:{c:'#9fb2c0',n:.06},hoof:{c:'#3a4048',n:.05},ant:{c:'#a8e0ff',glow:1},ant2:{c:'#e8f8ff',glow:1},eye:{c:'#7fd9ff',glow:1},nose:{c:'#2a3038',n:0}};
  const body=new P('body',[0,30,0]),neck=new P('neck0',[0,36,14],'body'),head=new P('head',[0,52,20],'neck0'),tail=new P('tail0',[0,36,-17],'body'),parts=[body,neck,head,tail];
  body.ell(-.5,35,0,8,8,18,'f');body.ell(-.5,32,0,7,5,16,'f_d');tube(neck,[[0,36,14],[0,46,18],[0,52,20]],5.5,4,'f');for(let y=38;y<50;y+=2)neck.box(-1,0,y,y,20+Math.round((y-38)*.2),22,'f_d');
  head.ell(-.5,54,24,4,4,7,'f');head.box(-2,1,51,53,30,32,'f_d');head.box(-1,0,52,53,33,33,'nose');eyes(head,0,56,27,3,'eye',1);for(const s of[-1,1])head.box(s*5,s*5+(s>0?1:-1),57,59,21,22,'f_d');
  for(const s of[-1,1]){tube(head,[[s*3,58,22],[s*6,66,20],[s*10,74,16],[s*14,84,12]],1.2,.6,'ant');tube(head,[[s*6,66,20],[s*12,70,24]],.8,.5,'ant');tube(head,[[s*10,74,16],[s*16,78,20]],.8,.5,'ant2');tube(head,[[s*12,80,14],[s*9,88,16]],.7,.5,'ant2');tube(head,[[s*13,82,13],[s*19,86,8]],.7,.5,'ant')}
  tail.ell(-.5,37,-19,2,3,2,'f');
  for(const[nm,z]of[['legF',12],['legB',-12]])for(const s of[-1,1]){const g=new P(nm+(s<0?'_L':'_R'),[s*5,30,z],'body');tube(g,[[s*5,30,z],[s*5,16,z+(nm==='legB'?-2:1)],[s*5,2,z]],2.4,1.4,'f');g.box(s*5-2,s*5+1,0,2,z-1,z+2,'hoof');parts.push(g)}
  return mk('palestag',pal,parts)};

/* ---- The Glutton: a mountain of a creature that is mostly mouth ---- */
B.glutton=()=>{const pal={s:{c:'#95a040',n:.1,alt:'#86913a',p:.3},s_d:{c:'#5e6828',n:.08},bel:{c:'#c8c890',n:.06},m:{c:'#3a0e10',n:.05},th:{c:'#efe6c8',n:.04},tongue:{c:'#c8506a',n:.06},eye:{c:'#ffe060',glow:1},drool:{c:'#c0ff90',glow:1}};
  const body=new P('body',[0,0,0]),jaw=new P('jaw',[0,14,12],'body'),head=new P('head',[0,32,4],'body'),parts=[body,jaw,head];
  for(let y=0;y<34;y++){const r=Math.sqrt(Math.max(0,1-Math.pow((y-14)/22,2)))*18;body.ell(-.5,y+.5,0,r,.6,r*.85,'s')}body.ell(-.5,10,6,13,9,10,'bel');for(let x=-12;x<12;x+=6)body.box(x,x+1,2,18,12,13,'s_d');
  body.ell(-.5,20,13,13,7,4,'m');for(let x=-11;x<11;x+=2)body.box(x,x,24,26,15,15,'th');body.ell(-.5,17,14,6,2,2,'tongue');
  jaw.ell(-.5,13,13,13,3,5,'s');for(let x=-11;x<11;x+=2)jaw.box(x,x,15,16,16,16,'th');jaw.box(-3,-2,8,12,17,17,'drool');jaw.box(4,4,9,12,17,17,'drool');
  head.ell(-.5,34,4,9,6,8,'s');eyes(head,0,35,11,3,'eye',2);head.box(-4,3,38,38,10,10,'s_d');
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*17,20,4],'body');tube(a,[[s*17,20,4],[s*22,14,10],[s*21,9,14]],3,2.4,'s');parts.push(a)}
  return mk('glutton',pal,parts)};

/* ---- The Feathered Coatl: a winged serpent of jade and gold ---- */
B.coatl=()=>{const pal={j:{c:'#3a9a6a',n:.08,alt:'#2f8a5c',p:.3},j_d:{c:'#1f5a3c',n:.08},gold:{c:'#e0b040',n:.05},red:{c:'#d2483a',n:.06},blue:{c:'#3a7ad0',n:.06},bel:{c:'#e8d898',n:.05},eye:{c:'#ffe060',glow:1}};
  const body=new P('body',[0,10,0]),parts=[body];const pts=[];for(let k=0;k<=24;k++){const a=k*.45;pts.push([Math.cos(a)*(10-k*.2),4+k*.9,Math.sin(a)*(10-k*.2)-4])}tube(body,pts,4.6,3.4,'j','gold');
  const head=new P('head',[0,30,6],'body');tube(head,[[0,26,0],[0,30,6]],3.6,3.4,'j');head.ell(-.5,32,9,4.5,4,6,'j');head.box(-2,1,30,31,13,16,'gold');eyes(head,0,33,13,2,'eye',1);
  for(let k=0;k<11;k++){const a=(k-5)*.28,c=['red','gold','blue','j'][k%4];tube(head,[[0,34,5],[Math.round(Math.sin(a)*12),34+Math.round(Math.cos(a)*11),-2]],1,.6,c)}parts.push(head);
  for(const s of[-1,1]){const w=new P(s<0?'wing_L':'wing_R',[s*4,22,0],'body');for(let i=0;i<22;i++){const x=s*(4+i),y=22+Math.round(i*.45),zf=3,zb=-4-Math.round(Math.sin(i/22*Math.PI)*9);for(let z=zb;z<=zf;z++)w.set(x,y,z,z===zf?'gold':z<zb+3?['red','blue','gold'][i%3]:'j')}parts.push(w)}
  const tail=new P('tail0',[8,4,-6],'body');tube(tail,[[8,4,-6],[16,2,-12],[22,4,-16]],3,1,'j','gold');for(let k=0;k<4;k++)tail.line([22,4,-16],[24+k,8+k*2,-20],['red','gold','blue','red'][k]);parts.push(tail);
  return mk('coatl',pal,parts)};

/* ---- The Pharaoh's Shade: a dead king in his death mask ---- */
B.shade=()=>{const pal={w:{c:'#d8cba0',n:.1,alt:'#c4b78a',p:.35},w_d:{c:'#8a7e5e',n:.08},g:{c:'#e0b040',n:.05},bl:{c:'#2a4a9a',n:.06},sk:{c:'#1a1410',n:0},eye:{c:'#7ff0ff',glow:1},ghost:{c:'#9fe8e0',glow:1}};
  const body=new P('body',[0,10,0]),head=new P('head',[0,40,0],'body'),parts=[body,head];
  for(let y=6;y<40;y++){const r=4+(40-y)*.14;body.ell(-.5,y+.5,0,r*1.1,.6,r*.8,(y%3)?'w':'w_d')}for(let y=2;y<8;y++)body.ell(-.5,y+.5,0,3-(8-y)*.3,.6,2,'ghost');
  body.box(-6,5,33,36,4,6,'g');for(let x=-6;x<6;x+=2)body.box(x,x,30,32,5,5,'bl');
  head.box(-5,4,40,49,-4,5,'g');head.box(-4,3,42,47,6,6,'g');head.box(-3,-2,45,45,6,6,'sk');head.box(1,2,45,45,6,6,'sk');head.set(-3,45,7,'eye');head.set(2,45,7,'eye');head.box(-1,0,40,41,6,8,'bl');
  for(let y=38;y<52;y++)for(const s of[-1,1])head.box(s*6,s*7,y,y,-5,3,(y%2)?'bl':'g');head.box(-7,6,50,52,-5,4,(0)?'bl':'g');for(let x=-6;x<6;x+=2)head.box(x,x,50,52,5,5,'bl');head.box(-1,0,52,55,4,5,'g');
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*7,35,0],'body');tube(a,[[s*7,35,0],[s*11,28,6],[s*8,24,10]],2,1.6,'w');
    if(s>0){a.line([9,18,10],[6,38,12],'g');a.box(4,8,38,40,11,13,'bl')}else{a.line([-9,18,10],[-12,34,12],'g');for(let k=0;k<3;k++)a.line([-12,34,12],[-14-k,28,13+k],'bl')}parts.push(a)}
  return mk('shade',pal,parts)};

/* ---- The Bog Hydra: five heads on a sunken body ---- */
B.hydra=()=>{const pal={s:{c:'#4f8a5a',n:.1,alt:'#447a4e',p:.3},s_d:{c:'#2a4a30',n:.08},bel:{c:'#b8c890',n:.06},th:{c:'#efe8d4',n:.03},eye:{c:'#ffd24a',glow:1},mud:{c:'#3a3020',n:.1},in:{c:'#5a1a1a',n:.05}};
  const body=new P('body',[0,0,0]),parts=[body];body.ell(-.5,8,0,16,9,13,'s');for(let x=-14;x<14;x+=4)body.box(x,x+1,14,16,-4,4,'s_d');body.ell(-.5,1,0,20,2,16,'mud');
  for(let k=0;k<5;k++){const a=(k-2)*.42,hx=Math.round(Math.sin(a)*20),hy=34+(k===2?6:0)-Math.abs(k-2)*2,hz=8+Math.round(Math.cos(a)*6);
    const nk=new P('neck'+k,[Math.round(Math.sin(a)*6),12,2],'body');tube(nk,[[Math.round(Math.sin(a)*6),12,2],[Math.round(Math.sin(a)*13),24,hz-4],[hx,hy,hz]],3.4,2.6,'s','bel');parts.push(nk);
    const hd=new P(k===2?'head':'head'+k,[hx,hy,hz],'neck'+k);hd.ell(hx-.5,hy+1,hz+3,3.6,3,5,'s');hd.box(hx-2,hx+1,hy-1,hy,hz+4,hz+8,'in');for(const x of[hx-2,hx+1])hd.box(x,x,hy,hy,hz+7,hz+8,'th');eyes(hd,hx,hy+3,hz+6,2,'eye',1);for(const s of[-1,1])hd.line([hx+s*2,hy+3,hz],[hx+s*4,hy+7,hz-3],'s_d');parts.push(hd)}
  return mk('hydra',pal,parts)};

/* ---- Lord Castellan: a knight lord with a tower shield ---- */
B.castellan=()=>{const pal={st:{c:'#9aa3ad',n:.05},st_d:{c:'#5a626c',n:.05},st_l:{c:'#cfd6dd',n:.03},red:{c:'#8a2a24',n:.06},red_d:{c:'#5a1a16',n:.06},g:{c:'#d5a640',n:.05},sk:{c:'#0d0a0c',n:0},eye:{c:'#ff8a3a',glow:1},wood:{c:'#5a3e26',n:.1}};
  const body=new P('body',[0,22,0]),head=new P('head',[0,44,0],'body'),parts=[body,head];
  body.box(-9,8,22,43,-5,5,'st');body.box(-8,7,24,40,6,6,'red');body.box(-1,0,24,40,6,6,'g');body.box(-9,8,22,23,-5,5,'st_d');body.box(-10,9,36,38,-6,6,'st_d');
  for(const s of[-1,1])body.box(s*9+(s>0?0:-4),s*9+(s>0?4:0),40,45,-5,4,'st_l');body.box(-9,8,22,40,-7,-6,'red_d');for(let y=8;y<40;y+=2)body.box(-11,10,y,y,-8,-7,'red');
  head.box(-5,4,44,53,-4,5,'st');head.box(-5,4,48,48,6,6,'sk');head.box(-4,3,48,48,6,6,'eye');head.box(-1,0,44,47,6,6,'st_d');for(let x=-5;x<5;x+=2)head.box(x,x,54,57,0,1,'g');head.box(-5,4,54,54,-4,5,'g');
  for(const s of[-1,1]){const g=new P(s<0?'leg_L':'leg_R',[s*5,22,0],'body');g.box(s*5-3,s*5+2,0,21,-3,3,'st');g.box(s*5-3,s*5+2,0,2,-3,6,'st_d');g.box(s*5-3,s*5+2,10,12,4,4,'st_l');parts.push(g)}
  const ar=new P('arm_R',[12,40,0],'body');ar.box(10,15,24,40,-3,3,'st');ar.box(11,14,20,23,0,5,'st_d');ar.box(12,13,22,58,7,8,'st_l');ar.box(12,13,22,58,6,6,'st');ar.box(9,16,20,21,5,9,'g');ar.box(12,13,15,19,7,8,'wood');parts.push(ar);
  const al=new P('arm_L',[-12,40,0],'body');al.box(-16,-11,24,40,-3,3,'st');al.box(-24,-16,10,42,6,7,'st_d');al.box(-23,-17,11,41,8,8,'red');al.box(-21,-19,14,38,9,9,'g');al.box(-25,-15,26,28,9,9,'g');parts.push(al);
  return mk('castellan',pal,parts)};

/* ---- The Great Cap: a mushroom the size of a house, with a face in its stem ---- */
B.greatcap=()=>{const pal={cap:{c:'#b8402a',n:.08,alt:'#a03624',p:.3},spot:{c:'#efe6d0',n:.04},stem:{c:'#e0d4b8',n:.06,alt:'#cfc3a6',p:.3},gill:{c:'#8a7860',n:.08},sk:{c:'#2a2018',n:0},eye:{c:'#c0ff60',glow:1},spore:{c:'#d0ff80',glow:1},root:{c:'#8a7860',n:.1}};
  const body=new P('body',[0,0,0]),head=new P('head',[0,34,0],'body'),parts=[body,head];
  for(let y=0;y<34;y++){const r=7+(y<5?(5-y):0)-y*.03;body.ell(-.5,y+.5,0,r,.6,r,'stem')}body.box(-4,-2,20,23,6,7,'sk');body.box(1,3,20,23,6,7,'sk');body.box(-3,-3,21,22,7,7,'eye');body.box(2,2,21,22,7,7,'eye');body.ell(-.5,13,6,3,2,1.5,'sk');
  for(let k=0;k<6;k++){const a=k/6*6.283;tube(body,[[0,2,0],[Math.cos(a)*10,1,Math.sin(a)*10],[Math.cos(a)*15,0,Math.sin(a)*15]],2,1,'root')}
  for(let y=0;y<13;y++){const r=24*Math.sqrt(Math.max(0,1-Math.pow(y/13,2)));head.ell(-.5,34+y+.5,0,r,.6,r,y===0?'gill':H(Math.round(r),y,3)<.08?'spot':'cap')}
  for(let k=0;k<14;k++){const a=k*2.4,r=6+(k*7)%17,y=34+Math.round(13*Math.sqrt(Math.max(0,1-Math.pow(r/24,2))));head.box(Math.round(Math.cos(a)*r)-1,Math.round(Math.cos(a)*r)+1,y-1,y,Math.round(Math.sin(a)*r)-1,Math.round(Math.sin(a)*r)+1,'spot')}
  for(let k=0;k<5;k++){const t=new P('tail'+k,[(k-2)*8,34,10],'head');t.set((k-2)*8,30-k%2*3,12,'spore');t.set((k-2)*8+1,26,11,'spore');parts.push(t)}
  return mk('greatcap',pal,parts)};

/* ---- The Tempest Djinn: a storm with a torso ---- */
B.djinn=()=>{const pal={sk:{c:'#4a6ad0',n:.07,alt:'#3f5cc0',p:.3},sk_d:{c:'#2a3a7a',n:.06},g:{c:'#e0b040',n:.05},cl:{c:'#e8e0f0',n:.04},wind:{c:'#b0c8ff',n:.04},bolt:{c:'#fff8a0',glow:1},eye:{c:'#fff8a0',glow:1},hair:{c:'#1a1a3a',n:.06}};
  const body=new P('body',[0,24,0]),head=new P('head',[0,44,0],'body'),parts=[body,head];
  for(let y=0;y<24;y++){const r=1+y*.42,a=y*.6;for(let k=0;k<10;k++){const t=a+k*.63;body.set(Math.round(Math.cos(t)*r),y,Math.round(Math.sin(t)*r),k%3?'wind':'cl')}}
  body.ell(-.5,32,0,9,9,6,'sk');body.box(-9,8,24,25,-6,5,'g');body.box(-2,1,30,36,6,6,'sk_d');for(const s of[-1,1])body.box(s*3-1,s*3,34,37,5,6,'sk_d');
  head.ell(-.5,46,0,5,5,5,'sk');eyes(head,0,47,5,2,'eye',1);head.box(-2,1,43,43,5,5,'sk_d');head.box(-1,0,50,58,-1,0,'hair');head.box(-2,1,50,51,-2,1,'g');head.box(-1,0,56,58,-1,0,'hair');
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*9,38,0],'body');tube(a,[[s*9,38,0],[s*16,34,4],[s*20,40,8]],3,2.4,'sk');a.box(s*16-2,s*16+1,33,36,2,6,'g');a.line([s*20,40,8],[s*24,48,10],'bolt');a.line([s*24,48,10],[s*21,52,12],'bolt');parts.push(a)}
  for(let k=0;k<3;k++){const t=new P('tail'+k,[0,4+k*6,0],'body');const r=3+k*3;for(let q=0;q<12;q++){const ang=q/12*6.283;t.set(Math.round(Math.cos(ang)*r),4+k*6,Math.round(Math.sin(ang)*r),q%4?'wind':'bolt')}parts.push(t)}
  return mk('djinn',pal,parts)};

/* ---- The Orrery: brass rings turning round a captive sun ---- */
B.orrery=()=>{const pal={b:{c:'#c9963a',n:.06},b_d:{c:'#7a5a22',n:.06},sun:{c:'#ffb040',glow:1},sun2:{c:'#fff0a0',glow:1},pl:{c:'#5a8ad0',n:.05},pl2:{c:'#c0503a',n:.05},pl3:{c:'#8ad05a',n:.05},eye:{c:'#1a1008',n:0},st:{c:'#3a3436',n:.1}};
  const body=new P('body',[0,30,0]),parts=[body];body.ell(-.5,30,0,7,7,7,'sun');body.ell(-.5,30,0,5.5,5.5,5.5,'sun2');body.box(-3,-2,31,32,6,6,'eye');body.box(1,2,31,32,6,6,'eye');body.box(-2,1,27,27,6,6,'eye');
  body.box(-2,1,0,22,-2,1,'b_d');body.box(-8,7,0,2,-8,7,'st');
  const rings=[[12,0,'pl'],[18,1,'pl2'],[24,2,'pl3']];rings.forEach(([R,k,pc])=>{const r=new P('tail'+k,[0,30,0],'body');for(let a=0;a<R*7;a++){const t=a/(R*7)*6.283;const x=Math.round(Math.cos(t)*R),z=Math.round(Math.sin(t)*R);
      if(k===0)r.set(x,30,z,'b');else if(k===1)r.set(x,30+Math.round(Math.sin(t)*R*.5),z,'b');else r.set(x,30+Math.round(Math.cos(t)*R*.4),z,'b_d')}
    const t0=k*2.1,px=Math.round(Math.cos(t0)*R),pz=Math.round(Math.sin(t0)*R),py=30+(k===1?Math.round(Math.sin(t0)*R*.5):k===2?Math.round(Math.cos(t0)*R*.4):0);r.ell(px-.5,py+.5,pz+.5,2.6,2.6,2.6,pc);parts.push(r)});
  return mk('orrery',pal,parts)};

/* ---- The Lich Regent: a crowned skeleton in rotting robes ---- */
B.lich=()=>{const pal={bone:{c:'#ddd3bb',n:.08},robe:{c:'#2a3a2a',n:.08,alt:'#223022',p:.3},robe_d:{c:'#141c14',n:.06},g:{c:'#c9a04c',n:.05},gem:{c:'#7fff9a',glow:1},eye:{c:'#7fff9a',glow:1},sock:{c:'#0d0a0c',n:0},wood:{c:'#3a2a1a',n:.1}};
  const body=new P('body',[0,6,0]),head=new P('head',[0,42,0],'body'),jaw=new P('jaw',[0,42,4],'head'),parts=[body,head,jaw];
  for(let y=4;y<40;y++){const r=4+(40-y)*.2;body.ell(-.5,y+.5,0,r,.6,r*.8,(y%4)?'robe':'robe_d');if(y<8&&H(y,1,2)<.5)body.cut(-r,r,y,y,-r,-r+2)}
  body.box(-9,8,36,39,-4,4,'robe_d');body.box(-7,6,36,37,5,5,'g');body.box(-1,0,20,36,5,5,'g');body.box(-1,0,30,31,6,6,'gem');for(let y=24;y<36;y+=3)body.box(-3,2,y,y,5,5,'bone');
  head.ell(-.5,45,1,5,5.5,5,'bone');head.box(-3,-2,45,46,5,6,'sock');head.box(1,2,45,46,5,6,'sock');head.set(-3,45,6,'eye');head.set(2,45,6,'eye');head.box(-1,0,43,43,6,6,'sock');
  head.box(-5,4,49,50,-4,5,'g');for(let x=-5;x<5;x+=2)head.box(x,x,51,56,0,1,'g');for(const x of[-5,3])head.set(x,57,0,'gem');jaw.box(-3,2,39,40,1,5,'bone');for(const x of[-3,-1,1])jaw.set(x,41,5,'bone');
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*8,37,0],'body');tube(a,[[s*8,37,0],[s*13,30,4],[s*13,24,8]],2.4,1.4,'robe');a.line([s*13,23,8],[s*14,20,10],'bone');
    if(s>0){a.line([14,4,10],[14,46,10],'wood');a.ell(13.5,48,10.5,3,3,3,'bone');a.box(13,14,47,48,13,13,'eye')}parts.push(a)}
  return mk('lich',pal,parts)};

/* ---- The Prism Wyrm: a serpent dragon grown of crystal ---- */
B.prismwyrm=()=>{const pal={c:{c:'#a890d8',n:.06,alt:'#9480c8',p:.3},c_d:{c:'#5a4a8a',n:.06},p1:{c:'#ff8ad0',glow:1},p2:{c:'#8ae0ff',glow:1},p3:{c:'#fff08a',glow:1},eye:{c:'#ffffff',glow:1},bel:{c:'#e0d8f0',n:.05}};
  const body=new P('body',[0,4,0]),parts=[body];const pts=[];for(let k=0;k<=26;k++){const a=k*.4;pts.push([Math.cos(a)*(12-k*.25),4+k*.4,Math.sin(a)*(12-k*.25)-6])}tube(body,pts,5,4,'c','c_d');
  for(let k=0;k<pts.length;k+=2){const q=pts[k];body.box(Math.round(q[0]),Math.round(q[0])+1,Math.round(q[1])+4,Math.round(q[1])+7+(k%3),Math.round(q[2]),Math.round(q[2])+1,['p1','p2','p3'][k%3])}
  let prev='body';const np=[[0,14,6],[0,24,10],[0,34,10],[0,42,8]];for(let k=0;k<3;k++){const n=new P('neck'+k,np[k],prev);tube(n,[np[k],np[k+1]],4.2,3.8,'c');n.box(-1,0,np[k][1]+2,np[k+1][1],np[k][2]-5,np[k][2]-4,['p1','p2','p3'][k]);parts.push(n);prev='neck'+k}
  const head=new P('head',[0,44,8],prev);head.ell(-.5,46,12,5,4,8,'c');head.box(-3,2,43,44,14,20,'bel');eyes(head,0,48,17,3,'eye',1);for(const s of[-1,1]){head.line([s*3,49,10],[s*6,58,4],'p2');head.line([s*2,50,9],[s*3,56,2],'p1')}head.box(-1,0,50,54,6,8,'p3');
  const jaw=new P('jaw',[0,44,12],'head');jaw.box(-3,2,41,42,12,19,'c_d');for(const x of[-3,2])jaw.box(x,x,43,43,17,19,'p3');parts.push(head,jaw);
  return mk('prismwyrm',pal,parts)};

/* ---- The Leviathan's Eye: one vast eye on a mass of tentacles ---- */
B.leviathan=()=>{const pal={f:{c:'#2a4a6a',n:.08,alt:'#243f5c',p:.3},f_d:{c:'#152838',n:.06},w:{c:'#e8e0d0',n:.04},vein:{c:'#c8506a',n:.05},iris:{c:'#ffb040',glow:1},pup:{c:'#0a0608',n:0},lid:{c:'#3a5a7a',n:.08},suck:{c:'#c0a0b0',n:.05}};
  const body=new P('body',[0,24,0]),head=new P('head',[0,26,8],'body'),parts=[body,head];body.ell(-.5,26,0,14,14,13,'f');
  head.ell(-.5,26,9,11,11,6,'w');head.ell(-.5,26,14,6,6,1.5,'iris');head.ell(-.5,26,15.2,3,4.5,1,'pup');for(let k=0;k<8;k++){const a=k/8*6.283;head.line([Math.round(Math.cos(a)*7),26+Math.round(Math.sin(a)*7),13],[Math.round(Math.cos(a)*10),26+Math.round(Math.sin(a)*10),10],'vein')}
  head.ell(-.5,35,8,13,4,8,'lid');head.ell(-.5,17,8,13,3,8,'lid');
  for(let k=0;k<8;k++){const a=k/8*6.283,x0=Math.round(Math.cos(a)*9),z0=Math.round(Math.sin(a)*8),t=new P('tail'+k,[x0,14,z0],'body');tube(t,[[x0,14,z0],[Math.round(Math.cos(a)*16),6,Math.round(Math.sin(a)*14)],[Math.round(Math.cos(a)*20),0,Math.round(Math.sin(a)*18)],[Math.round(Math.cos(a+.4)*24),4,Math.round(Math.sin(a+.4)*22)]],3,1,'f','suck');parts.push(t)}
  return mk('leviathan',pal,parts)};

/* ---- Mother Superior: a tall veiled figure with a cracked porcelain face ---- */
B.superior=()=>{const pal={r:{c:'#1a1418',n:.06},r2:{c:'#2a2228',n:.06},wh:{c:'#e8e0d4',n:.04},red:{c:'#8a1a20',n:.06},g:{c:'#c9a04c',n:.05},halo:{c:'#ffd27a',glow:1},crack:{c:'#3a2a2a',n:0},eye:{c:'#ff4a3a',glow:1},ch:{c:'#5a5458',n:.06}};
  const body=new P('body',[0,4,0]),head=new P('head',[0,46,0],'body'),parts=[body,head];
  for(let y=0;y<44;y++){const r=4+(44-y)*.2;body.ell(-.5,y+.5,0,r,.6,r*.8,(y%6===0)?'r2':'r')}body.box(-1,0,8,40,6,9,'red');body.box(-5,4,38,40,4,6,'wh');body.box(-1,0,24,31,9,9,'g');body.box(-3,2,28,28,9,9,'g');
  head.ell(-.5,49,0,5.5,6,5,'wh');head.ell(-.5,49,-1,7,7.5,6,'r');head.ell(-.5,49,2,5,5.5,4,'wh');head.box(-6,5,42,55,-6,-3,'r');
  head.box(-3,-2,50,50,5,5,'eye');head.box(1,2,50,50,5,5,'eye');head.line([-1,54,5],[1,47,5],'crack');head.line([1,47,5],[3,44,4],'crack');
  for(let a=0;a<28;a++){const t=a/28*6.283;head.set(Math.round(Math.cos(t)*10),56+Math.round(Math.sin(t)*10),-6,'halo')}
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*8,38,0],'body');tube(a,[[s*8,38,0],[s*13,30,5],[s*12,24,10]],2.4,1.8,'r');a.box(s*12-1,s*12,22,23,9,11,'wh');
    if(s>0){a.line([12,22,11],[13,12,12],'ch');a.ell(12.5,10,12.5,2.5,3,2.5,'ch');a.set(12,10,15,'halo');a.set(13,9,15,'halo')}parts.push(a)}
  return mk('superior',pal,parts)};

/* ---- The Old Dragon ---- */
B.dragon=()=>{const pal={s:{c:'#8a2a24',n:.08,alt:'#7a241f',p:.3},s_d:{c:'#4a1410',n:.08},bel:{c:'#d8a868',n:.06},horn:{c:'#e8dcc0',n:.05},eye:{c:'#ffd24a',glow:1},fire:{c:'#ff8a2a',glow:1},wing:{c:'#5a1c18',n:.08},claw:{c:'#2a2020',n:.04}};
  const body=new P('body',[0,22,0]),parts=[body];body.ell(-.5,24,0,11,10,19,'s');body.ell(-.5,19,2,8,5,15,'bel');for(let z=-16;z<16;z+=3)body.box(-1,0,33,35,z,z+1,'horn');
  let prev='body';const np=[[0,28,14],[0,36,20],[0,44,24],[0,50,26]];for(let k=0;k<3;k++){const n=new P('neck'+k,np[k],prev);tube(n,[np[k],np[k+1]],5-k*.6,4.4-k*.6,'s');n.box(-1,0,np[k][1]+4,np[k+1][1]+3,np[k][2]-2,np[k][2]-1,'horn');parts.push(n);prev='neck'+k}
  const head=new P('head',[0,52,27],prev),jaw=new P('jaw',[0,50,30],'head');head.ell(-.5,54,32,5,4.5,8,'s');head.box(-3,2,52,54,38,42,'s');eyes(head,0,56,36,3,'eye',1);for(const s of[-1,1]){head.line([s*3,58,30],[s*7,64,24],'horn');head.line([s*7,64,24],[s*8,62,19],'horn')}
  head.box(-2,1,53,53,42,42,'fire');jaw.box(-3,2,48,50,32,41,'s_d');for(const x of[-3,-1,1])jaw.set(x,51,41,'horn');parts.push(head,jaw);
  for(const s of[-1,1]){const w=new P(s<0?'wing_L':'wing_R',[s*8,32,6],'body');for(let i=0;i<30;i++){const x=s*(8+i),y=32+Math.round(i*1.05),zf=8-Math.round(i*.15),zb=-2-Math.round(Math.sin(i/30*Math.PI)*20);for(let z=zb;z<=zf;z++){w.set(x,y,z,z===zf||i%6===5?'s_d':'wing');if(z===zf||i%6===5)w.set(x,y+1,z,'s_d')}if(i%6===5)w.set(x,y-1,zb,'claw')}parts.push(w)}
  const tail=new P('tail0',[0,22,-18],'body');tube(tail,[[0,22,-18],[0,18,-28],[4,14,-38],[10,12,-44]],5,1.2,'s','s_d');tail.box(9,12,12,16,-46,-43,'horn');parts.push(tail);
  for(const[nm,z]of[['legF',10],['legB',-10]])for(const s of[-1,1]){const g=new P(nm+(s<0?'_L':'_R'),[s*8,22,z],'body');tube(g,[[s*8,22,z],[s*10,10,z+2],[s*10,2,z+3]],3.4,2.4,'s');g.box(s*10-2,s*10+2,0,1,z+3,z+6,'claw');parts.push(g)}
  return mk('dragon',pal,parts)};

/* ---- The Unmade King: armour round an absence ---- */
B.unmade=()=>{const pal={a:{c:'#2a2430',n:.06},a_l:{c:'#4a4058',n:.05},void:{c:'#000000',n:0},v:{c:'#b070ff',glow:1},v2:{c:'#e0c0ff',glow:1},cape:{c:'#3a1a4a',n:.06},cape_d:{c:'#24102e',n:.05}};
  const body=new P('body',[0,24,0]),head=new P('head',[0,48,0],'body'),parts=[body,head];
  body.box(-10,9,24,47,-5,5,'a');body.ell(-.5,36,5,5,6,2,'void');for(let k=0;k<12;k++){const t=k/12*6.283;body.set(Math.round(Math.cos(t)*6),36+Math.round(Math.sin(t)*7),6,'v')}
  for(const s of[-1,1])body.box(s*10+(s>0?0:-5),s*10+(s>0?5:0),42,48,-6,5,'a_l');for(let y=6;y<46;y++)body.box(-12,11,y,y,-9,-6,(y%3)?'cape':'cape_d');
  head.box(-5,4,48,56,-4,4,'a');head.box(-4,3,51,52,5,5,'void');head.box(-3,-2,51,51,5,5,'v2');head.box(1,2,51,51,5,5,'v2');
  for(let k=0;k<9;k++){const t=(k-4)*.32,x=Math.round(Math.sin(t)*9),y=60+Math.round(Math.cos(t)*4)+(k%2)*3;head.box(x,x,y,y+2+(k%3),-1,0,k%2?'v':'v2')}
  for(const s of[-1,1]){const g=new P(s<0?'leg_L':'leg_R',[s*5,24,0],'body');g.box(s*5-3,s*5+2,0,23,-3,3,'a');g.box(s*5-3,s*5+2,10,11,4,4,'v');parts.push(g)}
  for(const s of[-1,1]){const a=new P(s<0?'arm_L':'arm_R',[s*13,44,0],'body');a.box(s*13-3,s*13+2,26,44,-3,3,'a');a.box(s*13-3,s*13+2,24,26,-2,4,'a_l');
    if(s>0){for(let y=4;y<60;y++)a.set(13,y,8,y>52?'v2':'v');a.box(10,16,30,31,7,9,'a_l')}parts.push(a)}
  return mk('unmade',pal,parts)};
})();
