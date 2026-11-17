/* Ossuary Wheel: the four fighters as voxel models. Front is +z. A fighter is about 28 voxels (1.4 m) tall. */
(()=>{
const O=window.OW,V=O.V,P=V.Part;
const PAL={
 eye:{c:'#0b0a0c',n:0},eyew:{c:'#f4eedb',n:0},white:{c:'#ece6d4',n:.04},black:{c:'#1d1a1c',n:.06},
 steel:{c:'#9aa3ad',n:.05},steel_d:{c:'#6b737d',n:.05},steel_l:{c:'#c5ccd3',n:.03},gold:{c:'#d5a640',n:.05},gold_d:{c:'#9c7424',n:.05},
 leather:{c:'#6b4425',n:.08},leather_d:{c:'#47301b',n:.08},wood:{c:'#7a5230',n:.1},wood_d:{c:'#553820',n:.1},cloth_d:{c:'#2a2530',n:.06},
 glowb:{c:'#7fd9ff',glow:1},glowp:{c:'#c69bff',glow:1},glowg:{c:'#ffcf6a',glow:1},rope:{c:'#bba070',n:.08},string:{c:'#e8e2cc',n:0},
 pink:{c:'#d98a8a',n:.05},pink_d:{c:'#b26a6c',n:.05},
};
const pal=extra=>Object.assign({},PAL,extra);

/* the common body: hips at y=8, shoulders at y=16, neck at y=17. Returns parts keyed by name. */
function body(c){
  const torso=new P('torso',[0,8,0]),legR=new P('leg_R',[2.5,8,.5]),armR=new P('arm_R',[6.5,15.5,.5],'torso'),head=new P('head',[0,17,0],'torso');
  torso.box(-5,4,8,16,-3,2,c.top);torso.box(-5,4,8,8,-3,2,c.hem||c.top);
  if(c.belt)torso.box(-5,4,10,10,-3,2,c.belt);
  legR.box(1,3,4,7,-1,1,c.leg);legR.box(1,3,2,3,-1,1,c.shin||c.leg);legR.box(1,3,0,1,-1,2,c.foot);legR.box(1,3,0,0,3,3,c.foot);legR.cut(2,2,0,0,3,3);
  armR.box(5,7,12,16,-1,1,c.sleeve||c.top);armR.box(5,7,9,11,-1,1,c.arm);armR.box(5,7,7,8,-1,1,c.hand);
  const legL=legR.flipX('leg_L',null),armL=armR.flipX('arm_L','torso');
  return{torso,legR,legL,armR,armL,head}}

/* ---- Badger warrior ---- */
function badger(){
  const p=pal({fur:{c:'#4a4446',n:.08,alt:'#3a3537',p:.25},furw:{c:'#e7e1d2',n:.05},nose:{c:'#141113',n:0},tabard:{c:'#7a2a24',n:.06},tabard_d:{c:'#5a1d19',n:.06}});
  const b=body({top:'steel',hem:'steel_d',belt:'leather',leg:'leather_d',shin:'steel_d',foot:'leather_d',sleeve:'steel',arm:'fur',hand:'fur'});
  const{torso,head}=b;
  torso.box(-4,3,9,15,3,3,'tabard');torso.box(-1,0,9,15,3,3,'gold');torso.box(-4,3,8,8,3,3,'tabard_d');      // tabard with a gold stripe
  torso.box(-6,-4,15,17,-2,1,'steel_l');torso.box(3,5,15,17,-2,1,'steel_l');                           // pauldrons
  torso.box(-1,0,10,10,3,3,'gold');
  head.box(-5,4,17,24,-4,3,'fur');head.box(-4,3,25,25,-3,2,'fur');
  head.box(-5,4,17,24,3,3,'furw');head.box(-4,-2,18,25,-3,3,'black');head.box(1,3,18,25,-3,3,'black');                     // white face, black bands running back over the crown
  head.box(-1,0,17,25,-3,3,'furw');head.box(-5,-5,17,20,0,3,'furw');head.box(4,4,17,20,0,3,'furw');
  head.box(-3,2,17,20,4,6,'furw');head.box(-2,1,17,19,7,7,'furw');head.box(-1,0,19,20,8,8,'nose');head.box(-3,-2,19,20,4,5,'black');head.box(1,2,19,20,4,5,'black');      // muzzle
  head.box(-4,-3,21,22,3,3,'eye');head.box(2,3,21,22,3,3,'eye');head.set(-4,22,3,'eyew');head.set(2,22,3,'eyew');
  head.box(-6,-5,23,25,-1,0,'black');head.box(4,5,23,25,-1,0,'black');head.set(-6,25,-1,'furw');head.set(5,25,-1,'furw');   // round ears
  head.box(-5,4,17,17,-4,3,'steel_d');                                                                    // gorget
  const sword=new P('sword',[6.5,8,1.5],'arm_R');
  sword.box(6,7,7,8,2,3,'leather_d');sword.box(4,9,9,9,1,4,'gold');sword.box(6,7,10,25,2,3,'steel_l');sword.box(6,7,10,25,1,1,'steel');sword.set(6,26,2,'steel_l');sword.box(6,7,5,6,2,3,'gold');
  const shield=new P('shield',[-6.5,10,1.5],'arm_L');
  shield.box(-10,-3,6,15,2,2,'wood');shield.box(-10,-3,6,15,3,3,'tabard');shield.box(-10,-3,15,15,3,3,'steel');shield.box(-10,-3,6,6,3,3,'steel');shield.box(-10,-10,6,15,3,3,'steel');shield.box(-3,-3,6,15,3,3,'steel');
  shield.box(-7,-6,9,12,4,4,'gold');shield.cut(-10,-10,6,6,2,3);shield.cut(-3,-3,6,6,2,3);
  return{name:'warrior',pal:p,parts:[b.torso,b.head,b.legR,b.legL,b.armR,b.armL,sword,shield]}}

/* ---- Toad bard ---- */
function toad(){
  const p=pal({skin:{c:'#6f9a47',n:.1,alt:'#5c843b',p:.3},skin_l:{c:'#c9cf8a',n:.06},mouth:{c:'#3c4a22',n:0},gold_e:{c:'#e3b23c',n:0},
    dub:{c:'#6c2a5c',n:.06},dub_d:{c:'#4c1c41',n:.06},dub_l:{c:'#d6b04c',n:.05},hat:{c:'#2f6b6a',n:.06},feather:{c:'#e85a3a',n:.06},hose:{c:'#3a3352',n:.06}});
  const b=body({top:'dub',hem:'dub_d',belt:'dub_l',leg:'hose',foot:'skin',sleeve:'dub',arm:'dub_d',hand:'skin'});
  const{torso,head}=b;
  torso.box(-2,1,11,16,3,3,'skin_l');torso.box(-4,-3,9,15,3,3,'dub_l');torso.box(2,3,9,15,3,3,'dub_l');     // pale throat, slashed doublet
  head.box(-6,5,17,21,-4,4,'skin');head.box(-5,4,22,22,-3,3,'skin');
  head.box(-5,4,17,18,4,4,'skin_l');head.box(-6,5,18,18,5,5,'mouth');head.box(-5,4,17,17,5,5,'skin_l');      // wide mouth
  for(const sx of[-1,1]){const x0=sx<0?-6:3;head.box(x0,x0+2,22,24,0,3,'skin');head.box(x0,x0+2,23,24,4,4,'gold_e');head.set(x0+1,23,4,'eye');head.set(x0+1,24,4,'eye')}  // eyes on top
  head.set(-1,20,5,'mouth');head.set(0,20,5,'mouth');                                                     // nostrils
  const hat=new P('hat',[0,23,0],'head');hat.box(-7,6,23,23,-5,5,'hat');hat.box(-4,3,24,25,-3,2,'hat');hat.box(-4,3,24,24,-3,2,'dub_l');
  hat.box(4,4,25,30,-3,-3,'feather');hat.box(5,5,27,31,-4,-4,'feather');hat.set(3,26,-3,'feather');
  const lute=new P('lute',[6.5,8,1.5],'arm_R');                                                           // held across the body, neck out to the right
  lute.box(-2,4,7,12,4,5,'wood');lute.box(-1,3,6,13,4,5,'wood');lute.box(-2,4,8,11,6,6,'wood');lute.box(0,2,9,10,6,6,'cloth_d');lute.box(-1,3,6,6,6,6,'wood_d');
  lute.line([4,12,5],[11,18,5],'wood_d',1);lute.box(11,13,18,20,4,5,'wood_d');lute.set(11,20,6,'gold');lute.set(13,18,6,'gold');lute.line([1,7,7],[11,18,7],'string',1);
  return{name:'bard',pal:p,parts:[b.torso,b.head,b.legR,b.legL,b.armR,b.armL,hat,lute]}}

/* ---- Owl mage ---- */
function owl(){
  const p=pal({fea:{c:'#7a5a3e',n:.1,alt:'#5e4430',p:.3},fea_l:{c:'#d8c7a2',n:.08,alt:'#bfa983',p:.3},ring:{c:'#3a2b20',n:.04},iris:{c:'#f0a62a',n:0},beak:{c:'#d6a95a',n:.04},
    robe:{c:'#2c3470',n:.06,alt:'#262d62',p:.25},robe_d:{c:'#1d2350',n:.05},robe_l:{c:'#c9a24a',n:.05},star:{c:'#e9e2c0',n:0}});
  const b=body({top:'robe',hem:'robe_l',belt:'robe_l',leg:'robe',shin:'robe',foot:'beak',sleeve:'robe',arm:'robe',hand:'fea_l'});
  const{torso,head,legR,legL}=b;
  for(const L of[legR,legL])for(const[x,y,z,c]of[...L.v.values()])if(y>=2&&c!=='beak')L.set(x,y,z,'robe');
  legR.box(1,3,2,4,-2,-2,'robe_d');legL.box(-4,-2,2,4,-2,-2,'robe_d');                                    // the robe falls past the knee
  torso.box(-1,0,9,16,3,3,'robe_l');torso.box(-5,4,8,8,-3,2,'robe_l');torso.set(-3,13,3,'star');torso.set(2,11,3,'star');
  head.ell(-.5,21,0,5.6,4.6,4.6,'fea');head.box(-4,3,18,23,4,4,'fea_l');head.box(-3,2,17,18,3,4,'fea_l');
  for(const sx of[-1,1]){const cx=sx<0?-3:2;head.box(cx-1,cx+1,20,22,5,5,'ring');head.box(cx-1,cx+1,20,22,4,4,'fea_l');head.set(cx,21,5,'iris');head.box(cx,cx,21,21,6,6,'eye')}   // big ringed eyes
  head.box(-1,0,19,20,5,6,'beak');head.set(-1,18,5,'beak');head.set(0,18,5,'beak');
  const hood=new P('hat',[0,25,0],'head');hood.box(-8,7,25,25,-7,6,'robe_d');hood.cut(-8,-8,25,25,-7,-7);hood.cut(7,7,25,25,-7,-7);hood.cut(-8,-8,25,25,6,6);hood.cut(7,7,25,25,6,6);      // a wide-brimmed, crooked wizard's hat
  hood.box(-5,4,26,27,-4,3,'robe');hood.box(-5,4,26,26,-4,3,'robe_l');hood.box(-4,3,28,29,-4,2,'robe');hood.box(-3,2,30,31,-5,0,'robe');hood.box(-2,1,32,33,-6,-2,'robe');hood.box(-1,0,34,34,-8,-5,'robe');hood.set(-1,35,-9,'robe');hood.set(1,28,3,'star');hood.set(-3,30,1,'star');
  const staff=new P('staff',[6.5,8,1.5],'arm_R');
  staff.line([6,0,2],[6,27,2],'wood',1);staff.line([7,0,2],[7,27,2],'wood_d',1);staff.box(5,8,27,28,1,3,'gold_d');staff.box(5,8,29,31,1,3,'glowb');staff.box(6,7,32,32,2,2,'glowb');staff.box(4,9,28,28,2,2,'gold');
  return{name:'mage',pal:p,parts:[b.torso,b.head,b.legR,b.legL,b.armR,b.armL,hood,staff]}}

/* ---- Hare archer ---- */
function hare(){
  const p=pal({fur:{c:'#b48a5e',n:.08,alt:'#9c7650',p:.25},fur_l:{c:'#ead9bd',n:.05},tun:{c:'#3f6a35',n:.07,alt:'#365c2e',p:.25},tun_d:{c:'#2b4a25',n:.06},cloak:{c:'#56442e',n:.07}});
  const b=body({top:'tun',hem:'tun_d',belt:'leather',leg:'leather_d',shin:'leather',foot:'fur',sleeve:'tun',arm:'fur',hand:'fur'});
  const{torso,head}=b;
  torso.box(-5,4,13,16,-4,-4,'cloak');torso.box(-5,4,8,12,-4,-4,'cloak');torso.box(-4,3,13,15,3,3,'leather');torso.line([-4,9,3],[3,16,3],'leather_d',1);    // cape and baldric
  head.box(-5,4,17,23,-4,3,'fur');head.box(-4,3,24,24,-3,2,'fur');head.box(-3,2,17,19,4,5,'fur_l');head.box(-1,0,19,19,6,6,'pink');head.box(-1,0,17,17,6,6,'eyew');
  head.box(-5,-4,21,22,4,4,'eye');head.box(3,4,21,22,4,4,'eye');head.set(-4,22,4,'eyew');head.set(4,22,4,'eyew');
  head.box(-5,-4,17,18,4,4,'fur_l');head.box(3,4,17,18,4,4,'fur_l');
  const earR=new P('ear_R',[2.5,24,0],'head');earR.box(1,3,24,33,-1,0,'fur');earR.box(2,2,25,32,1,1,'pink');earR.box(1,3,33,33,-1,0,'fur');earR.cut(1,1,33,33,-1,0);
  const earL=earR.flipX('ear_L','head');
  const hood=new P('hood',[0,17,0],'torso');hood.box(-6,5,16,17,-5,-2,'tun_d');
  const bow=new P('bow',[-6.5,8,1.5],'arm_L');
  bow.line([-8,8,3],[-8,15,6],'wood',1);bow.line([-8,8,3],[-8,1,6],'wood',1);bow.line([-8,15,6],[-8,18,5],'wood_d',1);bow.line([-8,1,6],[-8,-2,5],'wood_d',1);bow.line([-8,18,5],[-8,-2,5],'string',1);bow.box(-9,-7,7,9,2,3,'leather');
  const quiver=new P('quiver',[0,12,-4],'torso');quiver.box(2,4,9,17,-6,-5,'leather');quiver.box(2,4,9,9,-6,-5,'leather_d');quiver.box(2,2,18,19,-6,-6,'fur_l');quiver.box(4,4,18,20,-5,-5,'fur_l');quiver.box(3,3,18,19,-5,-5,'feather');
  p.feather={c:'#d74b37',n:.05};
  return{name:'archer',pal:p,parts:[b.torso,b.head,b.legR,b.legL,b.armR,b.armL,earR,earL,hood,bow,quiver]}}

V.HEROES={warrior:badger,bard:toad,mage:owl,archer:hare};
V.hero=cls=>(V.HEROES[cls]||badger)();
})();
