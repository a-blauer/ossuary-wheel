/* GambaGolf: monsters as voxel models. Front is +z. */
(()=>{
const O=window.OW,V=O.V,P=V.Part;
const BONE={bone:{c:'#ddd3bb',n:.08,alt:'#cbbf9f',p:.22},bone_d:{c:'#a99c7f',n:.08},bone_l:{c:'#f1ead7',n:.04},sock:{c:'#151012',n:0},
  ghost:{c:'#7ff0c8',glow:1},ghost_d:{c:'#3fbf98',glow:1},iron:{c:'#3c3a3e',n:.08},rust:{c:'#7a3d22',n:.1},leather:{c:'#4a3020',n:.08}};
V.MON={};

/* Bone Hound: a skeletal dog with ghost-fire eyes */
V.MON.hound=()=>{
  const body=new P('body',[0,16,0]),neck=new P('neck',[0,20,9],'body'),head=new P('head',[0,24,13],'neck'),jaw=new P('jaw',[0,22,16],'head'),tail=new P('tail',[0,19,-15],'body');
  body.line([0,20,-15],[0,21,10],'bone',2);                                                    // spine
  for(let z=-1;z<=8;z+=2){const w=5-Math.abs(z-3)*.25;for(let a=0;a<=Math.PI;a+=.12){const x=Math.cos(a)*w,y=20-Math.sin(a)*8;body.set(Math.round(x-.5),Math.round(y),z,'bone')}}      // ribs
  body.line([0,12,-1],[0,12,8],'bone_d',1);body.line([-1,12,-1],[-1,12,8],'bone_d',1);
  body.box(-4,3,17,20,-16,-12,'bone');body.box(-3,2,16,16,-15,-13,'bone_d');body.cut(-2,1,18,19,-16,-16);          // pelvis
  for(const z of[-11,-9,-7,-5,-3])body.box(-1,0,22,22,z,z,'bone_l');                             // vertebra spines
  const legs=[];
  for(const[nm,z0]of[['legF',5],['legB',-13]]){const L=new P(nm+'_R',[3,19,z0+.5],'body');
    L.box(3,4,11,19,z0,z0+1,'bone');L.box(2,5,10,11,z0-1,z0+2,'bone_l');L.box(3,4,3,9,z0+(nm==='legB'?-1:1),z0+(nm==='legB'?0:2),'bone');
    L.box(2,5,0,2,z0-1+(nm==='legB'?-1:1),z0+3+(nm==='legB'?-1:1),'bone_d');L.box(2,5,0,0,z0+3+(nm==='legB'?-1:1),z0+4+(nm==='legB'?-1:1),'bone_l');
    legs.push(L,L.flipX(nm+'_L','body'))}
  neck.line([0,20,9],[0,24,14],'bone',2);neck.box(-3,2,20,23,10,11,'leather');for(const x of[-3,2])neck.box(x,x,24,25,10,10,'iron');neck.box(-1,0,24,25,11,11,'iron');      // studded collar
  head.box(-4,3,23,30,13,21,'bone');head.box(-3,2,31,31,14,20,'bone');head.box(-2,1,23,26,22,27,'bone');head.box(-2,1,27,27,22,25,'bone_d');
  head.box(-4,-2,26,28,21,21,'sock');head.box(1,3,26,28,21,21,'sock');head.set(-3,27,21,'ghost');head.set(2,27,21,'ghost');head.set(-3,27,22,'ghost_d');head.set(2,27,22,'ghost_d');      // eye sockets
  head.box(-1,0,25,26,28,28,'sock');head.box(-5,-5,26,29,14,18,'bone_d');head.box(4,4,26,29,14,18,'bone_d');
  for(const sx of[-1,1]){const x=sx<0?-4:3;head.box(x,x,31,34,15,16,'bone');head.set(x,35,16,'bone_l')}       // ears worn to spikes
  for(const x of[-2,1])head.box(x,x,22,22,23,27,'bone_l');head.set(-2,21,26,'bone_l');head.set(1,21,26,'bone_l');           // upper teeth
  jaw.box(-2,1,20,21,16,26,'bone');jaw.box(-2,-2,22,22,23,26,'bone_l');jaw.box(1,1,22,22,23,26,'bone_l');jaw.box(-1,0,22,22,24,25,'bone_l');jaw.cut(-1,0,22,22,24,25);
  tail.line([0,19,-16],[0,23,-22],'bone',1);tail.line([0,23,-22],[0,28,-25],'bone',1);for(const[y,z]of[[20,-18],[22,-21],[25,-23]])tail.box(-1,0,y,y,z,z,'bone_l');
  return{name:'hound',pal:BONE,parts:[body,neck,head,jaw,tail,...legs]}};

/* Vharn, the Ossuary Wheel: a great skull at the hub of a wheel of bones, with two clawed arms */
V.MON.vharn=()=>{
  const wheel=new P('tail0',[0,40,-6]),body=new P('body',[0,20,0]),head=new P('head',[0,36,2],'body'),jaw=new P('jaw',[0,32,4],'head'),parts=[body,wheel,head,jaw];
  for(let a=0;a<64;a++){const t=a/64*Math.PI*2;for(const R of[27,28])wheel.set(Math.round(Math.cos(t)*R),40+Math.round(Math.sin(t)*R),-6,a%8<2?'bone_l':'bone')}               // the rim
  for(let k=0;k<12;k++){const t=k/12*Math.PI*2;wheel.line([Math.round(Math.cos(t)*9),40+Math.round(Math.sin(t)*9),-6],[Math.round(Math.cos(t)*26),40+Math.round(Math.sin(t)*26),-6],k%2?'bone_d':'bone',1);
    const ex=Math.round(Math.cos(t)*29),ey=40+Math.round(Math.sin(t)*29);wheel.box(ex-1,ex,ey-1,ey,-7,-5,'bone_l')}
  for(let k=0;k<6;k++){const t=k/6*Math.PI*2+.26,ex=Math.round(Math.cos(t)*28),ey=40+Math.round(Math.sin(t)*28);wheel.box(ex-2,ex+1,ey-2,ey+1,-8,-4,'bone');wheel.box(ex-1,ex,ey-1,ey,-3,-3,'sock');wheel.set(ex-1,ey,-3,'ghost')}  // small skulls round the rim
  body.box(-8,7,8,24,-4,4,'bone_d');for(let y=10;y<24;y+=3)body.box(-9,8,y,y,-5,5,'bone');body.box(-1,0,0,24,-1,0,'bone');body.box(-6,5,0,4,-3,2,'bone');                  // a ribbed column of vertebrae
  head.ell(-.5,40,3,9,8,8,'bone');head.box(-9,8,33,36,-3,10,'bone');head.box(-8,7,46,47,-4,8,'bone_l');
  head.box(-7,-3,38,42,10,11,'sock');head.box(2,6,38,42,10,11,'sock');head.box(-6,-4,39,41,11,11,'ghost');head.box(3,5,39,41,11,11,'ghost');head.box(-5,-5,40,40,12,12,'ghost_d');head.box(4,4,40,40,12,12,'ghost_d');
  head.box(-1,0,35,37,11,11,'sock');head.box(-10,-9,37,42,0,6,'bone_d');head.box(8,9,37,42,0,6,'bone_d');
  for(const x of[-6,-4,-2,0,2,4,6])head.set(x<0?x:x-1,33,11,'bone_l'),head.set(x<0?x:x-1,32,11,'bone_l');head.box(-7,6,34,34,10,10,'bone_d');
  for(const sx of[-1,1])for(let k=0;k<3;k++)head.line([sx*(4+k*2),46,4-k],[sx*(6+k*3),51+k,1-k*2],'bone_d',1);                                                          // a crown of horn
  jaw.box(-7,6,28,31,0,10,'bone');jaw.box(-6,5,32,32,9,10,'bone_l');for(const x of[-6,-4,-2,1,3,5])jaw.set(x,32,10,'bone_l'),jaw.set(x,33,10,'bone_l');jaw.cut(-5,4,30,31,9,10);
  for(const sx of[-1,1]){const arm=new P(sx<0?'arm_L':'arm_R',[sx*9,22,0],'body');arm.line([sx*9,22,0],[sx*18,14,5],'bone',2);arm.line([sx*18,14,5],[sx*20,6,11],'bone',2);arm.box(sx*20-2,sx*20+1,4,7,10,13,'bone_d');
    for(let k=0;k<3;k++)arm.line([sx*20+(k-1)*2,4,13],[sx*20+(k-1)*3,0,17],'bone_l',1);parts.push(arm)}
  return{name:'vharn',pal:BONE,parts}};
})();
