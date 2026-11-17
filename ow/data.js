/* GambaGolf: static game data */
window.OW={};
(()=>{
const O=window.OW;
O.F={W:1000,H:1120,cx:500,cy:450,R:340,ly:1060};
O.FR=230;O.CAPV=250;O.FIT=.8;
/* the ramp a fighter launches from: len and h are the ramp's run and height, tan the slope the ball leaves its lip at. Every ramp carries a ball the same total distance for the same power; they differ in how much of it is flown. */
O.RAMPS=[{k:'flat',short:'Putt',fly:0,desc:'Rolls along the ground all the way.'},{k:'low',short:'Chip',fly:.45,tan:.55,desc:'One low hop over whatever is in front of you, then a roll.'},{k:'high',short:'Lob',fly:.9,tan:1.4,desc:'Flies high over everything, rails included, and stops close to where it lands. Land it off the board and it is a miss.'}];
/* the ring of ground around a wheel, and what a monster can do to it */
O.TR=[445,555];
O.TERR={mire:{name:'Sand',cast:'heaps sand across the course',it:'heaps sand',note:'Balls crawl through sand traps.'},rubble:{name:'Gravel',cast:'scatters gravel over the course',it:'scatters gravel',note:'Gravel knocks rolling balls off line.'},
  rift:{name:'Water',cast:'floods pools across the course',it:'floods the course',note:'A ball that rolls into water is lost.'},gale:{name:'Crosswind',cast:'calls up a crosswind',it:'calls a crosswind',note:'Wind pushes balls sideways down the course; high shots most of all.'}};
O.TERR_OF=[['rubble'],['mire','rubble'],['mire'],['rift'],['mire'],['gale','rift'],['mire'],['mire','rubble'],['gale','rubble'],['mire','gale'],['rubble'],['mire'],['gale'],['rubble','rift'],['rubble','gale'],['rift','rubble'],['gale','mire'],['rift'],['rift','gale'],['rift','gale','mire']];      // a ball fits a hole when its radius is at most FIT x the hole's radius
O.LANES=['#d9a441','#5fb3a1','#b98bd9','#8fb85a'];
O.TIER=['#5fa596','#c9a04c','#d2483a'];
O.tier=d=>d<=16?0:d<=30?1:2;
O.sizeName=r=>['','Small','Medium','Large'][O.mSize(r)];
O.sizeNote=r=>['','Fits every hole.','Fits medium and large holes.','Only fits large holes.'][O.mSize(r)];

/* Each class has a pool of abilities. A fighter starts a run knowing the first two and learns the rest from drops. */
O.START=2;
O.CLASSES={
 warrior:{name:'Warrior',animal:'Badger',hp:80,period:1.3,col:'#c9d2de',blurb:'Large balls that hit hard and smash iron lids, but only fit large holes. Takes less damage.',ab:[
  {id:'iron',name:'Iron Shot',cd:0,desc:'One large ball. Breaks an iron lid and keeps rolling. ×2.3.',m:{r:22,mult:2.3,heavy:1}},
  {id:'twin',name:'Twin Strike',cd:1,desc:'Two large balls down the same line, one after the other. ×1.5 each.',shots:2,gap:.5,m:{r:19,mult:1.5,heavy:1}},
  {id:'sunder',name:'Sunder',cd:2,desc:'Crushes every post and stone block in its path and ploughs straight through sand. ×1.8.',m:{r:22,mult:1.8,heavy:1,sunder:1}},
  {id:'rage',name:'Bloodrage',cd:3,desc:'Spend 10 health on one large ball that hits for ×4.5.',cost:10,m:{r:24,mult:4.5,heavy:1}},
  {id:'cleave',name:'Cleave',cd:2,desc:'One large ball. When it sinks, the nearest other open hole takes 60% of its worth too. ×1.8.',m:{r:22,mult:1.8,heavy:1,cleave:.6}},
  {id:'shatter',name:'Shatter',cd:2,desc:'Smashes every iron lid it touches, all layers at once, without slowing. ×1.5.',m:{r:20,mult:1.5,heavy:1,shatter:1}},
  {id:'bash',name:'Shield Bash',cd:3,instant:1,foe:1,desc:'Stuns the monster. It does not attack this round. No aiming.'},
  {id:'leech',name:'Bloodletter',cd:2,desc:'One large ball that heals you for half the damage it deals. ×1.9.',m:{r:19,mult:1.9,heavy:1,leech:.5}},
  {id:'ricochet',name:'Ricochet',cd:1,desc:'A medium iron ball that hits 40% harder for every post or rail it strikes before it sinks. ×1.4.',m:{r:17,mult:1.4,heavy:1,ric:.4}},
  {id:'quake',name:'Earthshaker',cd:3,desc:'Where it first strikes a post, every post and sand trap around it is flattened, and it rolls on. ×2.',m:{r:22,mult:2,heavy:1,quake:160}},
  {id:'ram',name:'Battering Ram',cd:0,desc:'One large ball that smashes through the windmill, the boulder and stone blocks and keeps rolling. ×1.8.',m:{r:22,mult:1.8,heavy:1,ram:1}}]},
 bard:{name:'Bard',animal:'Toad',hp:55,period:1.5,col:'#f0cc5c',blurb:'Heals and strengthens the party, lifts lids and clears the course. Medium balls.',ab:[
  {id:'note',name:'Sour Note',cd:0,desc:'One medium ball. ×1.',m:{r:13,mult:1}},
  {id:'mend',name:'Mending Ballad',cd:2,instant:1,desc:'Heals every ally and raises the fallen. No aiming.'},
  {id:'hymn',name:'Unbinding Hymn',cd:1,desc:'Lifts every lid and clears every post and sand trap it touches, then bursts where it stops and clears around it. No damage.',m:{r:15,mult:0,hymn:1}},
  {id:'anthem',name:'War Anthem',cd:3,instant:1,desc:"Every ally's next attack hits 50% harder. No aiming."},
  {id:'lull',name:'Lullaby',cd:3,instant:1,desc:'The monster hits half as hard this round. No aiming.'},
  {id:'rally',name:'Rallying Cry',cd:3,instant:1,desc:"Every other fighter who has not finished their turn gets one more basic ball. No aiming."},
  {id:'discord',name:'Discord',cd:2,desc:'The monster it wounds takes 25% more damage from everyone for the rest of the fight. ×0.9.',m:{r:13,mult:.9,vuln:1}},
  {id:'echo',name:'Echo',cd:1,desc:'Two medium balls, side by side. ×0.85 each.',fan:[-6,6],m:{r:13,mult:.85}},
  {id:'dirge',name:'Dirge',cd:2,desc:'The monster it wounds burns for three rounds. ×0.9.',m:{r:13,mult:.9,burn:.5}},
  {id:'crescendo',name:'Crescendo',cd:3,instant:1,desc:'Every fighter who has already attacked this round spins and attacks again. No aiming.'},
  {id:'grounds',name:'Groundskeeper’s Song',cd:0,instant:1,desc:'Drains every water hazard and clears all sand and gravel from the course. No aiming.'}]},
 mage:{name:'Mage',animal:'Owl',hp:52,period:1.5,col:'#a98bf0',blurb:'Looses several small balls at once. Fragile.',ab:[
  {id:'volley',name:'Arcane Volley',cd:0,desc:'A fan of small balls. ×0.6 each.',fan:[-9,0,9],m:{r:10,mult:.6}},
  {id:'stream',name:'Spark Stream',cd:1,desc:'Five tiny balls down one line. ×0.4 each.',shots:5,gap:.18,jit:2.5,m:{r:8,mult:.4}},
  {id:'orb',name:'Gravity Orb',cd:2,desc:'One medium ball that curves toward the nearest open hole it fits. ×1.1.',m:{r:14,mult:1.1,homing:1}},
  {id:'stasis',name:'Stasis',cd:3,desc:'Stops the windmill and the boulder, and the monster cannot reshape the course this round. Then looses two small balls. ×0.7 each.',fan:[-5,5],freeze:1,m:{r:10,mult:.7}},
  {id:'chain',name:'Chain Lightning',cd:2,desc:'One small ball. When it sinks, lightning arcs to every open hole within 1.5 m for 30% of their worth. ×1.',m:{r:10,mult:1,arc:.3}},
  {id:'meteor',name:'Meteor',cd:3,desc:'One large ball that breaks lids and hits for ×2.4.',m:{r:20,mult:2.4,heavy:1}},
  {id:'prism',name:'Prism',cd:2,desc:'Splits into three small balls the first time it strikes a post, a rail or a lid. ×0.8 each.',m:{r:12,mult:.8,split:1}},
  {id:'frost',name:'Frost Bolt',cd:1,desc:'A small ball that holes catch even at twice the usual speed. ×0.9.',m:{r:10,mult:.9,capx:2.2}},
  {id:'wildfire',name:'Wildfire',cd:2,desc:'Three small balls. Each one that sinks sets the monster burning. ×0.5 each.',fan:[-8,0,8],m:{r:10,mult:.5,burn:.6}},
  {id:'singular',name:'Singularity',cd:3,desc:'A medium ball that, if it comes to rest near a hole it fits, is drawn down into it. ×0.9.',m:{r:14,mult:.9,settle:120}},
  {id:'skim',name:'Skimming Stone',cd:0,desc:'A small ball that skips across water instead of sinking, 40% stronger for every skip. ×1.',m:{r:10,mult:1,skim:1}}]},
 archer:{name:'Archer',animal:'Hare',hp:55,period:2.5,col:'#8fd88a',blurb:'Small, accurate balls for the tightest holes. A long, steady draw.',ab:[
  {id:'quick',name:'Quick Shot',cd:0,desc:'One small, true ball. ×1.',m:{r:9,mult:1}},
  {id:'aimed',name:'Aimed Shot',cd:1,sight:1,desc:'Shows on the big screen where the ball will stop, while you pull. ×1.2.',m:{r:9,mult:1.2}},
  {id:'mark',name:"Hunter's Mark",cd:2,desc:'The hole it sinks into takes 50% more from everyone for the rest of the fight. ×0.8.',m:{r:10,mult:.8,mark:1}},
  {id:'bullseye',name:'Bullseye',cd:3,desc:'Drops into the first open hole it fits that it crosses, at any speed. ×1.3.',slow:1.3,m:{r:10,mult:1.3,sure:1}},
  {id:'pierce',name:'Piercing Arrow',cd:1,desc:'Flies straight through posts and across sand. ×1.1.',m:{r:8,mult:1.1,pierce:1}},
  {id:'rain',name:'Arrow Rain',cd:2,desc:'A wide fan of five tiny balls. ×0.45 each.',fan:[-14,-7,0,7,14],m:{r:7,mult:.45}},
  {id:'hamstring',name:'Hamstring',cd:2,desc:'The monster it wounds hits 40% softer for the rest of the fight. ×0.8.',m:{r:9,mult:.8,weak:1}},
  {id:'deadeye',name:'Deadeye',cd:3,desc:'A tiny ball that hits for ×2.2. The draw is short and twitchy.',slow:.7,m:{r:7,mult:2.2}},
  {id:'seeker',name:'Seeker',cd:2,desc:'After it first strikes a post or rail it bends toward the nearest open hole. ×1.',m:{r:9,mult:1,seek:1}},
  {id:'splinter',name:'Splinter',cd:2,desc:'When it sinks, splinters strike two other open holes for 40% of their worth. ×0.9.',m:{r:8,mult:.9,splash:.4}},
  {id:'flag',name:'Flagshot',cd:0,instant:1,desc:'Shoots the lid off the best covered hole on the course. No aiming.'}]}
};

/* Board layouts. Local coordinates: x right, y toward the players, origin at the wheel centre.
   Hole radius matters: small (about 17) only takes small balls, medium (about 24) takes small and medium, large (28 and up) takes anything. */
const H=(x,y,rad,dmg,armor)=>({x,y,rad,dmg,tier:O.tier(dmg),armor:armor||0,armor0:armor||0});
const B=(x,y,rad,kind)=>({x,y,rad,kind,on:true});
const D=(x,y,rad)=>({x,y,rad,on:true});
const both=(f,x,...a)=>[f(-x,...a),f(x,...a)];
O.MONSTERS={
 bat:{name:'Carrion Bat',title:'',rank:'lesser',hp:26,hit:5,dur:1.4,h:2.6,theme:'#6b5a52',
  layout:()=>({
   holes:[H(0,-112,17,30),H(0,30,25,16),...both(H,172,-18,34,9),...both(H,252,96,30,8)],
   bumps:[...both(B,42,-178,12,'spike'),...both(B,16,-52,10,'fang'),...both(B,95,-72,12,'knob'),...both(B,205,-112,12,'knob'),...both(B,118,102,12,'knob'),...both(B,236,8,12,'knob')],
   divots:[D(0,150,26)],walls:[]})},
 hound:{name:'Bone Hound',title:'',rank:'lesser',hp:42,hit:8,dur:1.5,h:1.7,theme:'#d8cfba',
  layout:()=>({
   holes:[...both(H,42,118,17,28),H(0,-42,34,13),...both(H,92,-62,24,14),...both(H,112,-192,29,11),H(0,188,24,15)],
   bumps:[B(-60,226,10,'tooth'),B(-20,236,10,'tooth'),B(20,236,10,'tooth'),B(60,226,10,'tooth'),...both(B,62,14,12,'knob'),...both(B,72,-124,12,'knob'),B(0,-132,12,'knob'),B(0,-214,12,'knob')],
   divots:[...both(D,152,44,28)],walls:[]})},
 spider:{name:'Skitterqueen',title:'the Bone Weaver',rank:'mini',hp:78,aoe:3,single:9,dur:2.2,h:3.3,theme:'#b9ad94',
  intro:'Eight legs unfold from the dark.',
  layout:()=>({
   holes:[H(0,-135,36,24,1),...both(H,34,150,17,34),...both(H,95,112,17,26),...both(H,238,55,29,12),...both(H,212,-218,24,14)],
   bumps:[B(0,-45,15,'spike'),B(-62,-73,15,'spike'),B(62,-73,15,'spike'),...both(B,88,-135,14,'spike'),...both(B,20,224,12,'fang'),
     ...both(B,128,238,13,'knee'),...both(B,285,135,13,'knee'),...both(B,305,-70,13,'knee'),...both(B,128,-292,13,'knee'),...both(B,160,10,12,'knee')],
   divots:[D(0,45,30),...both(D,150,-150,30)],walls:[]}),
  special:{armorEvery:2}},
 bulwark:{name:'Sir Morrow',title:'the Bulwark',rank:'mini',hp:98,aoe:4,single:11,dur:2.2,h:4.8,theme:'#8f98a6',
  intro:'A shield the size of a door grinds across the stone.',
  layout:()=>({
   holes:[H(0,-150,31,30,2),H(-92,0,16,30),H(0,0,16,42,1),H(92,0,16,30),...both(H,235,-150,30,12,1),...both(H,160,150,24,14)],
   bumps:[...both(B,46,-40,11,'rivet'),...both(B,46,40,11,'rivet'),...both(B,138,-40,11,'rivet'),...both(B,138,40,11,'rivet'),
     ...both(B,62,-108,14,'rivet'),B(0,-78,13,'rivet'),...both(B,250,20,13,'rivet')],
   divots:[...both(D,188,-50,30),D(0,95,30)],
   walls:[{a:66,span:11,r:300,hp:2,on:true},{a:90,span:11,r:300,hp:2,on:true},{a:114,span:11,r:300,hp:2,on:true}]}),
  special:{shieldEvery:3}},
 vharn:{name:'Vharn',title:'the Ossuary Wheel',rank:'boss',hp:128,aoe:5,single:13,dur:2.2,h:5.2,theme:'#d8cfba',
  intro:'The wheel turns. The skull at its hub opens its eyes.',
  layout:()=>({
   holes:[H(0,55,20,60,2),...both(H,108,-50,44,20),H(0,-255,18,36,1),...both(H,130,-225,18,28,1),...both(H,278,-105,29,12),...both(H,218,172,24,14)],
   bumps:[B(-120,205,13,'tooth'),B(-60,214,13,'tooth'),B(0,217,13,'tooth'),B(60,214,13,'tooth'),B(120,205,13,'tooth'),
     ...both(B,168,32,15,'knob'),B(0,-12,13,'knob'),...both(B,108,-128,14,'knob')],
   divots:[...both(D,62,135,26),...both(D,220,-5,30)],walls:[]}),
  special:{armorEvery:2,drainEvery:3}}
};
O.BOSSES=O.MONSTERS;

O.UPGRADES={
 vigor:{name:'Vigor',desc:'+15 maximum health.',many:1},
 might:{name:'Might',desc:'All your balls hit 15% harder.',many:1},
 lode:{name:'Deep Dish',desc:'The dish round every hole pulls your balls 50% harder, and holes catch them a little faster.'},
 haste:{name:'Loaded Reels',desc:'Your own symbol turns up far more often on your reels.'},
 sl_wild:{name:'Marrow Star',desc:'Wild stars are more than twice as common on your reels. A star stands for any symbol.'},
 sl_line:{name:'Crooked Lines',desc:'Two more paylines cross your reels: seven instead of five.'},
 sl_pay:{name:'Heavy Pays',desc:'Everything a line of a kind pays is half as much again.'},
 sl_jack:{name:'Jackpot Bell',desc:'Four of a kind also gives you a second attack this round.'},
 sl_mirror:{name:'Bright Stars',desc:'Every wild star on a paying line adds 20% damage.'},
 sl_nail:{name:'Nailed Reel',desc:'The middle of your first reel always shows your own symbol.'},
 sl_grave:{name:'Grave Reels',desc:'Skulls and crowns are twice as common on your reels.'},
 thorns:{name:'Thorned Mail',desc:'The monster takes 4 damage whenever it strikes you.'},
 regen:{name:'Troll Blood',desc:'Heal 4 at the start of every round.'},
 lucky:{name:"Gambler's Coin",desc:'Each ball that sinks has a 15% chance to deal double damage.'},
 slayer:{name:'Giant Slayer',desc:'+25% damage to minibosses and bosses.'},
 culler:{name:'Culler',desc:'+30% damage to lesser monsters.'},
 steady:{name:'Steady Hands',desc:'Your draw is 25% longer, so power is finer to set.'},
 grit:{name:'Grit',desc:'You take 10% less damage.',many:1},
 w_hide:{cls:'warrior',name:'Thick Hide',desc:'You take a further 20% less damage.'},
 w_file:{cls:'warrior',name:'Filed Iron',desc:'Your balls count one size smaller, so they fit medium holes.'},
 w_exec:{cls:'warrior',name:'Executioner',desc:'+40% damage to monsters below half health.'},
 w_bulk:{cls:'warrior',name:'Bulwark',desc:'+25 maximum health.'},
 w_guard:{cls:'warrior',name:'Guardian',desc:'The monster aims its single blows at you far more often than at your allies.'},
 b_hymn:{ab:'hymn',cls:'bard',name:'Louder Hymn',desc:'Unbinding Hymn bursts across a much wider area.'},
 b_ballad:{ab:'mend',cls:'bard',name:'Sweeter Ballad',desc:'Mending Ballad heals 28 instead of 18.'},
 b_chorus:{ab:'note',cls:'bard',name:'Chorus',desc:'Sour Note looses two balls side by side.'},
 b_reson:{ab:'hymn',cls:'bard',name:'Resonance',desc:'Unbinding Hymn deals 5 damage for every obstacle and armor plate it removes.'},
 b_encore:{ab:'anthem',cls:'bard',name:'Encore',desc:'War Anthem also heals every ally for 8.'},
 m_fourth:{ab:'volley',cls:'mage',name:'Fourth Missile',desc:'Arcane Volley looses four balls.'},
 m_orb:{ab:'orb',cls:'mage',name:'Attuned Orb',desc:'Gravity Orb pulls harder and hits 40% harder.'},
 m_focus:{cls:'mage',name:'Focus',desc:'Your small balls hit 25% harder.'},
 m_barrier:{cls:'mage',name:'Barrier',desc:'The first blow that lands on you in each fight does nothing.'},
 m_surge:{ab:'stream',cls:'mage',name:'Surge',desc:'Spark Stream looses seven balls.'},
 a_eye:{cls:'archer',name:'Keen Eye',desc:'Every shot marks your power bar at each hole in your line and shows where it will stop.'},
 a_draw:{ab:'quick',cls:'archer',name:'Heavy Draw',desc:'Quick Shot hits 40% harder.'},
 a_crit:{cls:'archer',name:'Vital Aim',desc:'Each ball that sinks has a 25% chance to deal double damage.'},
 a_twin:{ab:'quick',cls:'archer',name:'Second Arrow',desc:'Quick Shot looses a second arrow down the same line for half damage.'},
 a_hunter:{ab:'mark',cls:'archer',name:'Trophy Hunter',desc:"Hunter's Mark adds 80% instead of 50%."},
 rebound:{name:'Rebound',desc:'Every bounce before a ball sinks adds a further 15% damage.'},
 pyre:{name:'Pyre',desc:'Monsters you set burning burn twice as hard.'},
 keen:{name:'Keen Edge',desc:'+50% damage when you sink an exposed weak point.'},
 ward:{name:'Warding Sigil',desc:'The first blow that lands on you in each fight is halved.'},
 w_brute:{cls:'warrior',name:'Brute Arc',desc:'Your balls that drop straight in from a chip or lob hit 60% harder instead of 25%.'},
 b_kindle:{ab:'note',cls:'bard',name:'Kindling',desc:'Sour Note sets the monster burning.'},
 m_ember:{ab:'stream',cls:'mage',name:'Ember Sparks',desc:'Spark Stream sets the monster burning.'},
 a_quiver:{ab:'rain',cls:'archer',name:'Deep Quiver',desc:'Arrow Rain looses seven arrows.'},
 wide:{name:'Wide Dish',desc:'The dish round every hole reaches 30% further for your balls.'},
 ironput:{name:'Iron Putter',desc:'Sand and gravel no longer slow or turn your balls.'},
 backspin:{name:'Backspin',desc:'Your balls stop 40% sooner once they slow down, so they settle near where you aim.'}
};
/* Items sit in one bag shared by the party. Using one on your turn is free and does not end the turn. */
O.BAG=6;
O.ITEMS={
 draught:{name:'Healing Draught',desc:'Heal yourself for 30.'},
 tonic:{name:'Party Tonic',desc:'Heal every fighter for 15.'},
 phoenix:{name:'Phoenix Feather',desc:'Raise every fallen fighter at half health.'},
 smoke:{name:'Smoke Bomb',desc:'Every monster hits half as hard this round.'},
 bomb:{name:'Fire Flask',desc:'Burn the monster.',foe:1},
 oil:{name:'Weapon Oil',desc:'Your attack this round hits 75% harder.'},
 chalk:{name:'Grinding Chalk',desc:'Your balls this round count one size smaller, so they fit tighter holes.'},
 magnet:{name:'Lodestone Dust',desc:'Your balls this round drop into the first open hole they fit that they cross, at any speed.'},
 pick:{name:'Sapper\u2019s Pick',desc:'Lift every iron lid on the course.',wheel:1},
 glass:{name:'Hourglass',desc:'Spin your reels again.'},
 whet:{name:'Whetstone',desc:'Your attacks hit 30% harder for the rest of this fight.'},
 net:{name:'Weighted Net',desc:'The monster cannot attack this round.',tgt:1},
 mirror:{name:'Twinning Mirror',desc:'Your attack this round is loosed twice.'},
 salve:{name:'Grave Salve',desc:'Heal yourself for 20 and drain the water, sand and gravel the monster laid.'},
 horn:{name:'Rallying Horn',desc:'Every bone on every fighter’s reels turns into a wild star.'}
};
/* a drop that teaches an ability is written 'ab:<index in the class pool>' */
O.upInfo=(u,cls)=>{if(typeof u==='string'&&u.startsWith('it:')){const it=O.ITEMS[u.slice(3)];return it?{name:it.name,desc:'Item for the party bag. '+it.desc}:null}
 if(typeof u==='string'&&u.startsWith('ab:')){const a=O.CLASSES[cls]&&O.CLASSES[cls].ab[+u.slice(3)];return a?{name:'Learn '+a.name,desc:a.desc+(a.m?' '+O.sizeName(a.m.r)+' ball.':'')}:null}return O.UPGRADES[u]||null};
O.RELICS={
 salt:{name:'Grave Salt',desc:'The monster can no longer put lids back on its holes.'},
 bell:{name:'Bell of Mercy',desc:'The party heals 5 at the start of every round.'},
 lens:{name:'Cracked Lens',desc:'Everyone deals 12% more damage.'},
 axle:{name:'Steady Ground',desc:'The monster fouls the course half as often.'},
 satchel:{name:'Deep Satchel',desc:'Every fight drops an extra item into the party bag.'},
 charm:{name:'Warding Charm',desc:'Traps hurt half as much.'},
 anvil:{name:'Breaker’s Anvil',desc:'Any ball breaks every lid on a hole in one blow.'},
 ember:{name:'Ember Heart',desc:'Every ball that sinks sets its monster burning.'},
 feather:{name:'Raven Feather',desc:'Balls that drop straight in from a chip or lob hit 50% harder instead of 25%.'},
 idol:{name:'Bone Idol',desc:'The first fighter to fall in each fight rises at once with a third of their health.'},
 purse:{name:'Miser’s Purse',desc:'The dungeon pays a quarter more gold.'}
};
/* Ball skins: how a fighter's balls look on the big screen. Chosen on the phone; all but the first two come from loot boxes. */
O.SKINS={
 plain:{name:'Class colours',desc:'The colour of your calling.'},
 bone:{name:'Old Bone',col:'#e6dcc2',glow:'#b8a888',desc:'Polished knucklebone.'},
 ember:{name:'Ember',col:'#ff7a2a',glow:'#ff4a10',desc:'A coal that will not go out.'},
 verdigris:{name:'Verdigris',col:'#58b8a0',glow:'#2f8f7a',desc:'Bronze gone green in the damp.'},
 blood:{name:'Heartblood',col:'#c8261c',glow:'#8a100a',desc:'It never quite dries.'},
 moon:{name:'Moonstone',col:'#bcd6ff',glow:'#7fa8f0',desc:'Cold light from a clear night.'},
 obsidian:{name:'Obsidian',col:'#2a2230',glow:'#8a5ad0',desc:'Black glass with a violet edge.'},
 gilded:{name:'Gilded',col:'#f0c044',glow:'#d89a18',desc:'For those who have opened a great many boxes.'},
 venom:{name:'Venom',col:'#9adf3a',glow:'#5aa80e',desc:'Do not lick it.'},
 rose:{name:'Grave Rose',col:'#e88aa8',glow:'#b84a70',desc:'Pressed between the pages of a psalter.'}
};
O.MAP=[{type:'start',name:'Gate',x:0,z:7.4,next:[]}];      // filled in place by O.genMap for the chosen dungeon
O.encRank=e=>e.some(i=>O.MONSTERS[i].rank==='boss')?'boss':e.some(i=>O.MONSTERS[i].rank==='mini')?'mini':'lesser';
O.encName=e=>{const c={};e.forEach(i=>c[i]=(c[i]||0)+1);return Object.keys(c).map(i=>(c[i]>1?c[i]+' ':'')+O.MONSTERS[i].name+(c[i]>1?'s':'')).join(', ')};
O.SPOILS={item:'an item for the bag',mend:'bandages that bind wounds',coin:'a purse of gold'};
O.tileBlurb=n=>n.type==='battle'?({lesser:'A monster: ',mini:'A miniboss: ',boss:'The boss of this dungeon: '})[O.encRank(n.enc)]+O.encName(n.enc)+'.'+(n.rw?' Spoils: '+(n.rw==='coin'?n.gold+' gold':O.SPOILS[n.rw])+'.':''):({treasure:'A locked reliquary: pick its lock together for a relic.',shrine:'A shrine with a cup: every putt that drops heals the party.',forge:'A smithy: strike in time for a better drop.',trap:'A trap. Everyone plays it on their phone. Come through together for an item.',tome:'A library: match pages to learn a new ability.',gamble:'A goblin\u2019s cup game: bet gold, double it or lose it.',start:''})[n.type];
O.nodeKind=n=>n.type!=='battle'?n.type:({lesser:'battle',mini:'mini',boss:'boss'})[O.encRank(n.enc)];
/* what a floor leads on to, so a vote on the way is a real choice */
O.beyond=i=>{const n=O.MAP[i];if(!n||!n.next.length)return'';const k=[...new Set(n.next.map(j=>O.MAP[j]).map(m=>m.type==='battle'?({lesser:'a monster',mini:'a miniboss',boss:'the boss'})[O.encRank(m.enc)]:({treasure:'a reliquary',shrine:'a shrine',forge:'a smithy',trap:'a trap',tome:'a library',gamble:'a gambler'})[m.type]))];return'Beyond it: '+k.join(' or ')+'.'};
/* ---------- the bestiary: every generated creature gets stats by rank and a wheel laid out for its body plan ---------- */
const BEST=window.OW_BEST||{beasts:{},dungeons:[]};
O.rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
O.hash=str=>{let h=2166136261;for(const c of String(str))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
/* hole skeletons, [x, y, class]: S small and valuable, M medium, L large and cheap, J the armored heart. x>0 is mirrored. */
const SKEL={
 quad:[[0,150,'S'],[45,95,'S'],[0,-30,'J'],[105,30,'L'],[95,-95,'M'],[125,-205,'L'],[0,-250,'M'],[250,-60,'L']],
 biped:[[0,-225,'S'],[0,-85,'J'],[150,-135,'L'],[240,20,'M'],[70,60,'M'],[105,225,'L'],[0,160,'S'],[250,-200,'L']],
 flyer:[[0,-120,'S'],[0,25,'J'],[165,-25,'L'],[258,90,'L'],[0,185,'M'],[95,-190,'M'],[110,120,'M'],[250,-150,'L']],
 serpent:[[0,-225,'S'],[95,-150,'M'],[-95,-70,'M'],[100,10,'L'],[-100,90,'L'],[60,180,'M'],[0,-60,'J'],[-230,-140,'L'],[230,150,'L'],[-60,240,'S']],
 crawler:[[0,140,'S'],[0,0,'J'],[0,-160,'L'],[235,95,'L'],[200,-200,'L'],[120,-60,'M'],[90,215,'M'],[280,-50,'M']],
 floater:[[0,0,'J'],[0,-165,'M'],[143,-82,'L'],[143,82,'M'],[0,165,'S'],[275,0,'L'],[0,-275,'S'],[190,-215,'L']],
 blob:[[0,20,'J'],[130,-70,'L'],[60,-190,'M'],[200,90,'M'],[0,190,'L'],[110,200,'S'],[250,-160,'L'],[0,-110,'S']],
 stalk:[[0,-240,'S'],[0,-130,'M'],[0,-10,'J'],[0,115,'M'],[175,215,'L'],[205,-60,'M'],[120,-210,'L'],[260,90,'L'],[0,235,'S']],
 wraith:[[0,-220,'S'],[0,-95,'J'],[225,-25,'M'],[85,85,'L'],[0,215,'L'],[175,225,'M'],[140,-180,'L'],[0,40,'S']]
};
const BUMPK={quad:'tooth',biped:'rivet',flyer:'knob',serpent:'fang',crawler:'knee',floater:'knob',blob:'knob',stalk:'spike',wraith:'knob'};
function genLayout(id,b){
  const r=O.rng(O.hash(id)),big=b.rank==='boss',mini=b.rank==='mini',sk=SKEL[b.plan]||SKEL.blob,want=b.rank==='lesser'?5:mini?7:sk.length,holes=[],bumps=[],divots=[];
  const jit=v=>v+(r()-.5)*16,free=(x,y,rad)=>Math.hypot(x,y)<322-rad&&holes.every(h=>Math.hypot(h.x-x,h.y-y)>h.rad+rad+14)&&bumps.every(q=>Math.hypot(q.x-x,q.y-y)>q.rad+rad+4)&&divots.every(q=>Math.hypot(q.x-x,q.y-y)>q.rad+rad+2);
  sk.slice(0,want).forEach(([x,y,c])=>{
    if(c==='J'&&b.rank==='lesser')c='M';
    const rad=c==='S'?16+Math.floor(r()*3):c==='M'?23+Math.floor(r()*3):c==='J'?(big?20:18):29+Math.floor(r()*7);
    const dmg=c==='S'?26+Math.floor(r()*9):c==='M'?13+Math.floor(r()*4):c==='J'?(big?56:42):8+Math.floor(r()*5),armor=c==='J'?1:c==='S'&&big&&r()<.3?1:c==='S'&&mini&&r()<.15?1:0;
    const py=jit(y);for(const sx of(x===0||b.plan==='serpent'?[1]:[-1,1])){const px=x===0?0:sx*x+(b.plan==='serpent'?(r()-.5)*16:0);if(free(px,py,rad))holes.push(H(Math.round(px),Math.round(py),rad,dmg,armor))}});
  const kind=BUMPK[b.plan]||'knob';
  for(const h of holes.filter(h=>h.dmg>=24)){const n=h.dmg>=40?3:2;for(let i=0;i<n;i++){const a=Math.PI/2+(i-(n-1)/2)*.75+(r()-.5)*.2,d=h.rad+30,x=h.x+Math.cos(a)*d,y=h.y+Math.sin(a)*d;if(free(x,y,12))bumps.push(B(Math.round(x),Math.round(y),11+Math.floor(r()*3),kind))}}
  for(let i=0,n=0;i<200&&n<(big?9:mini?7:5);i++){const a=r()*6.283,d=60+r()*250,x=Math.cos(a)*d,y=Math.sin(a)*d;if(free(x,y,13)){n++;bumps.push(B(Math.round(x),Math.round(y),11+Math.floor(r()*4),i%3?kind:'knob'));if(Math.abs(x)>30&&free(-x,y,13))bumps.push(B(Math.round(-x),Math.round(y),12,i%3?kind:'knob'))}}
  for(let i=0,n=0;i<120&&n<(big?4:mini?3:2);i++){const a=r()*6.283,d=40+r()*230,x=Math.cos(a)*d,y=Math.sin(a)*d;if(free(x,y,28)){n++;divots.push(D(Math.round(x),Math.round(y),26+Math.floor(r()*5)))}}
  const walls=b.shield?[{a:66,span:11,r:300,hp:2,on:true},{a:90,span:11,r:300,hp:2,on:true},{a:114,span:11,r:300,hp:2,on:true}]:[];
  return{holes,bumps,divots,walls}}
for(const id in BEST.beasts){const b=BEST.beasts[id],odd=O.hash(id)%2;
  const st=b.rank==='lesser'?{hp:34,hit:6,dur:1.5}:b.rank==='mini'?{hp:88,aoe:3.5,single:10,dur:2.0,special:b.shield?{shieldEvery:3}:odd?{armorEvery:2}:{drainEvery:4}}:{hp:135,aoe:5,single:13,dur:2.0,special:{armorEvery:2,drainEvery:3}};
  O.MONSTERS[id]=Object.assign({name:b.name,title:'',rank:b.rank,h:b.h,theme:b.theme,plan:b.plan,gen:1,layout:()=>genLayout(id,b)},st)}
/* ----- what every wheel carries besides holes and studs. Worked out from the monster's name alone, so the host and every phone agree. -----
   kickers: a few studs that fire a ball away instead of only turning it.
   locks and core: if a wheel has an armoured hole, its two cheapest open holes are locks; sink both and the core stands open until the end of the next round.
   at most one moving part: a kicker circling on a ring, or an arm sweeping the plate. */
/* ----- the reels. Four reels of three. Seven symbols: bone (b), blade (l), flame (f), eye (e), skull (s), crown (c) and the wild star (w).
   Pays are read along lines, never from symbols scattered about. A line is one row choice per reel; every line pays from the first reel, left to right.
   Every attack but the first has a pattern of its own. Stronger attacks ask for four of a kind, a mixed line, or the rarer symbols.
   Apart from unlocking attacks, a line of three or more alike pays something of its own, and four of a kind is a jackpot. */
O.SYMS={b:'Bone',l:'Blade',f:'Flame',e:'Eye',s:'Skull',c:'Crown',w:'Star'};
O.SIG={warrior:['l','b','f'],bard:['f','b','l'],mage:['f','l','b'],archer:['b','l','f']};        // each fighter's own symbol, second and third
O.LINES=[[1,1,1,1],[0,0,0,0],[2,2,2,2],[0,1,2,1],[2,1,0,1],[0,0,1,2],[2,2,1,0]];              // the last two only with Crooked Lines
O.LINEPAY={b:'+15% damage',l:'+30% damage',f:'the attack burns',e:'the ball drops into the first open hole it crosses',s:'the monster’s strike is blunted',c:'the party is mended and finds gold'};
O.recipes=cls=>{const[S,T,U]=O.SIG[cls]||O.SIG.warrior,R=[[S,S,S],[T,T,T],[U,U,U],['e','e','e'],[S,T,S],[S,S,S,S],['s','s','s'],['e','s','e'],['c','c','c'],[T,S,T]];return O.CLASSES[cls].ab.map((a,i)=>i?R[Math.min(R.length-1,i-1)]:null)};
O.slotRead=(grid,owned,md,cls)=>{md=md||{};const g=String(grid||''),out={ok:[],bonus:{},mult:1,fx:{},pays:[],hit:{},jack:0},nl=md.lines?7:5;if(g.length<12){if(owned.length)out.ok.push(owned[0]);return out}
  const seqs=[];for(let li=0;li<nl;li++){const L=O.LINES[li],cells=[0,1,2,3].map(c=>c*3+L[c]);seqs.push({li,cells})}        // lines pay from the first reel, left to right
  const fit=(q,pat,st)=>pat.every((p,k)=>{const ch=g[q.cells[st+k]];return ch===p||ch==='w'});
  const seen={};for(const q of seqs)for(const n of[4,3])for(let st=0;st<1;st++){const ch=[];for(let k=0;k<n;k++)ch.push(g[q.cells[st+k]]);const sym=ch.find(c=>c!=='w')||'c';if(!ch.every(c=>c===sym||c==='w'))continue;const key=q.li+':'+sym;if(seen[key])continue;seen[key]=1;
      out.pays.push({li:q.li,sym,n,cells:q.cells.slice(st,st+n)});for(let k=0;k<n;k++)out.hit[q.cells[st+k]]=1}
  const k0=md.pay?1.5:1;for(const p of out.pays){const j=p.n===4?2:1;if(p.n===4)out.jack++;if(md.mirror)out.mult+=.2*p.cells.filter(c=>g[c]==='w').length;
    if(p.sym==='b')out.mult+=.15*j*k0;else if(p.sym==='l')out.mult+=.3*j*k0;else if(p.sym==='f')out.fx.burn=Math.max(out.fx.burn||0,.4*j*k0);else if(p.sym==='e')out.fx.sure=1;else if(p.sym==='s')out.fx.blunt=1;else if(p.sym==='c'){out.fx.heal=(out.fx.heal||0)+8*j*k0;out.fx.gold=(out.fx.gold||0)+12*j}}
  if(out.jack){out.mult+=.5;out.fx.jack=1;if(md.jack)out.fx.again=1}
  const rec=O.recipes(cls);for(const i of owned){const pat=rec[i];if(!pat){out.ok.push(i);out.bonus[i]=out.mult;continue}let ok=false;for(const q of seqs){for(let st=0;st<1;st++)if(fit(q,pat,st)){ok=true;for(let k=0;k<pat.length;k++)out.hit[q.cells[st+k]]=1}}if(ok){out.ok.push(i);out.bonus[i]=out.mult}}
  return out};
O.RIM=340;O.RIMH=20;O.LIP=24;O.FRW=125;                 // the plate inside the rim is slicker than the ground outside it, so a ball that gets in keeps rolling
O.shutAt=(h,ck)=>!!h.shut&&((ck+h.shut.ph)%h.shut.per)>h.shut.per*h.shut.duty;                 // true while the plate is over the hole
O.orbPos=(mv,ck)=>{const a=mv.ph+mv.w*ck;return[mv.r*Math.cos(a),mv.r*Math.sin(a)]};        // wheel-local
O.armAng=(mv,ck)=>mv.ph+mv.w*ck;
O.plan=function(L,id,rank){
  const hs=O.hash('plan'+id),r=O.rng(hs),big=rank==='boss',mini=rank==='mini';
  {const want=big?8:mini?6:4,good=L.holes.filter(h=>h.dmg>=24),sc=q=>good.reduce((m,h)=>Math.min(m,Math.hypot(h.x-q.x,h.y-q.y)),1e9),ord=L.bumps.slice().sort((a,c)=>sc(a)-sc(c)||a.x-c.x||a.y-c.y),keep=[];
    for(const q of ord){if(keep.length>=want)break;if(keep.includes(q))continue;const tw=L.bumps.find(o=>o!==q&&Math.abs(o.x+q.x)<3&&Math.abs(o.y-q.y)<3);if(Math.abs(q.x)<3)keep.push(q);else if(tw&&!keep.includes(tw))keep.push(q,tw)}
    L.bumps=L.bumps.filter(q=>keep.includes(q));L.divots=L.divots.slice(0,big?2:1)}                                 // a wheel keeps only a few studs, in mirrored pairs beside its best holes
  {const n=big?2:mini?2:1,cand=L.bumps.map((b,i)=>i).filter(i=>Math.hypot(L.bumps[i].x,L.bumps[i].y)>80);for(let k=0;k<n&&cand.length;k++){const i=cand.splice(Math.floor(r()*cand.length),1)[0];L.bumps[i].kick=1}}
  let core=-1;L.holes.forEach((h,i)=>{if(h.armor0>0&&(core<0||h.dmg>L.holes[core].dmg))core=i});
  if(core>=0){const c=L.holes.map((h,i)=>i).filter(i=>i!==core&&!L.holes[i].armor0&&L.holes[i].rad>=22).sort((a,c2)=>L.holes[a].dmg-L.holes[c2].dmg||Math.abs(L.holes[c2].x)-Math.abs(L.holes[a].x)||a-c2);
    if(c.length>=2&&L.holes.length>=4){L.core=core;L.locks=[c[0],c[1]];L.holes[core].core=1;L.holes[c[0]].lock=1;L.holes[c[1]].lock=1}}
  /* no shutters over holes: timing them was no fun. Monsters that had one get the other moving part, or none for some lesser ones */
  const kind=rank==='lesser'?['none','orb'][hs%2]:['arm','orb','arm','orb'][hs%4],dir=r()<.5?-1:1;
  if(kind==='none'){}
  else if(kind==='orb'){let best=205,bs=1e9;for(const R of[150,205,262]){const n=L.holes.reduce((a,h)=>a+(Math.abs(Math.hypot(h.x,h.y)-R)<h.rad+16?1:0),0)+L.bumps.reduce((a,q)=>a+(Math.abs(Math.hypot(q.x,q.y)-R)<q.rad+16?.3:0),0);if(n<bs){bs=n;best=R}}
    L.mv={k:'orb',r:best,w:dir*(big?.95:.75),ph:r()*6.283,rad:15}}
  else L.mv={k:'arm',r0:64,r1:206,w:dir*.5,ph:r()*6.283};
  for(const h of L.holes){h.armor0=Math.min(h.armor0||0,1);h.armor=Math.min(h.armor||0,1)}          // every lid breaks with one good hit
  return L};
for(const id in O.MONSTERS){const d=O.MONSTERS[id],f=d.layout;d.layout=()=>O.plan(f(),id,d.rank)}
O.BOSSES=O.MONSTERS;
/* ---------- the twenty dungeons ---------- */
O.DUNGEONS=BEST.dungeons.map((d,i)=>{const rows=6+Math.round(i*.42);return Object.assign({},d,{i,rows,set:Math.floor(i/3),hpK:(1+.085*i)*([.88,.94][i]||1)*[1,1.12,1.25][i%3],dmgK:1+.05*i,startLv:1+Math.floor(i/2.5),gold:Math.round((60+30*i+8*rows)*(1+.3*Math.floor(i/3))),skulls:1+Math.floor(i/4)})});
const TNAME={lesser:['Ambush','The Den','Hunting Ground','The Nest','Guard Post','Feeding Pit'],mini:['The Champion’s Hall','The Warden’s Post'],treasure:['Reliquary'],shrine:['Shrine of Embers'],forge:['Dead Smithy'],tome:['Drowned Library'],trap:['The Needle Hall','The Sealed Door','The Long Gallery'],gamble:['The Gambler\u2019s Den']};
/* A dungeon map in the manner of a spire climb: several routes wander up through five columns from the gate to the boss,
   merging and splitting but never crossing. Longer dungeons have more floors; minibosses hold a whole floor, and the last floor before the boss is rest. */
O.COLS=5;O.setOf=i=>Math.floor(i/3);O.setLabel=i=>'Set '+['I','II','III','IV','V','VI','VII'][Math.floor(i/3)]+' \u00B7 '+(i%3+1)+' of '+Math.min(3,O.DUNGEONS.length-Math.floor(i/3)*3);
O.LINK='https://claude.ai/artifact/AtSCtwp4oNcyaqnCkybESG';        // where this game lives, for the join code on the host screen
O.genMap=function(di,seed){
  const d=O.DUNGEONS[di],r=O.rng(seed||1),M=O.MAP,R=d.rows,C=O.COLS,pick=a=>a[Math.floor(r()*a.length)],at={};M.length=0;
  const node=(row,col,o)=>{const k=row+':'+col;if(at[k]!=null)return at[k];const i=M.length;M.push(Object.assign({row,col,jx:(r()-.5)*.5,jy:(r()-.5)*.36,x:(col-2)*2.2,z:7.4-row*2.6,next:[]},o));at[k]=i;return i};
  const start=node(0,2,{type:'start',name:d.name+' Gate',jx:0,jy:0}),edges=[];
  const cross=(row,a,b)=>edges.some(e=>e[0]===row&&((e[1]<a&&e[2]>b)||(e[1]>a&&e[2]<b)));
  const starts=[1,3];        // two ways up, not four: fewer forks to weigh at every step
  for(const c0 of starts){let c=c0,prev=start;for(let row=1;row<R;row++){
      if(row>1){let nc=c,tries=0;do{nc=clampI(c+Math.floor(r()*3)-1,c0<2?0:2,c0<2?2:C-1)}while(cross(row-1,c,nc)&&++tries<8);if(cross(row-1,c,nc))nc=c;edges.push([row-1,c,nc]);c=nc}
      const id=node(row,c,{type:'battle'});if(!M[prev].next.includes(id))M[prev].next.push(id);prev=id}
    M[prev].last=1}
  const boss=node(R,2,{type:'battle',enc:[d.boss],name:'The Heart of '+d.name.replace(/^The /,''),jx:0,jy:0});M.forEach(n=>{if(n.last)n.next.push(boss)});
  const pack=row=>[pick(d.lesser)];                    // one monster to a fight, grown to the size of the party
  const miniRows=d.mini.length>1?[Math.round(R*.42),Math.round(R*.74)]:[Math.round(R*.55)],free=[];
  M.forEach((n,i)=>{if(n.type!=='battle'||n.row===R)return;const row=n.row,mi=miniRows.indexOf(row);
    if(mi>=0){const m=d.mini[mi%d.mini.length];n.enc=[m];n.name=pick(TNAME.mini)}
    else if(row===R-1){n.type=(n.col+row)%2?'forge':'shrine';n.name=TNAME[n.type][0]}
    else if(row===1){n.enc=pack(row);n.name=pick(TNAME.lesser)}
    else{const t=pick(['battle','battle','battle','trap','trap','treasure','tome','shrine','forge','battle','gamble']);n.type=t;if(t==='battle'){n.enc=pack(row);n.name=pick(TNAME.lesser)}else n.name=pick(TNAME[t]);free.push(i)}});
  for(const t of['trap','treasure','tome'])if(!M.some(n=>n.type===t)){const c=free.filter(i=>M[i].type==='battle');if(c.length){const n=M[pick(c)];n.type=t;delete n.enc;n.name=pick(TNAME[t])}}
  M.forEach(n=>{if(n.type==='battle'&&n.enc&&n.row>0&&n.row<R&&O.encRank(n.enc)==='lesser'){const q=r();n.rw=q<.25?'item':q<.45?'mend':q<.65?'coin':'';if(n.rw==='coin')n.gold=Math.max(10,Math.round(d.gold*.1/5)*5)}});      // some dens hold spoils, shown on the map
  for(const n of M)n.next.sort((a,b)=>M[a].col-M[b].col);
  return M};
const clampI=(v,a,b)=>Math.min(b,Math.max(a,v));
/* ---------- what loot boxes can unlock. Everything else is available from the first run. ---------- */
const BASE_UP=['vigor','might','lode','haste','sl_wild','sl_line','sl_pay','sl_jack','sl_mirror','sl_nail','sl_grave','w_hide','w_file','b_hymn','b_ballad','m_fourth','m_orb','a_eye','a_draw'],BASE_IT=['draught','tonic','smoke','oil'],BASE_REL=['salt','bell','lens','axle'];
O.LOCKS=[];
for(const c in O.CLASSES)O.CLASSES[c].ab.forEach((a,i)=>{if(i>=4)O.LOCKS.push('ab:'+c+':'+i)});
for(const k in O.UPGRADES)if(!BASE_UP.includes(k))O.LOCKS.push('up:'+k);
for(const k in O.ITEMS)if(!BASE_IT.includes(k))O.LOCKS.push('it:'+k);
for(const k in O.RELICS)if(!BASE_REL.includes(k))O.LOCKS.push('re:'+k);
for(const k in O.SKINS)if(k!=='plain'&&k!=='bone')O.LOCKS.push('sk:'+k);
O.lockInfo=id=>{const p=String(id).split(':');
  if(p[0]==='ab'){const c=O.CLASSES[p[1]],a=c&&c.ab[+p[2]];return a?{kind:c.name+' ability',name:a.name,desc:a.desc}:null}
  if(p[0]==='sk'){const k=O.SKINS[p[1]];return k?{kind:'ball skin',name:k.name,desc:k.desc+' Choose it on your phone, under Character.'}:null}
  const t={up:[O.UPGRADES,'Upgrade'],it:[O.ITEMS,'Item'],re:[O.RELICS,'Relic']}[p[0]],o=t&&t[0][p[1]];return o?{kind:(o.cls?O.CLASSES[o.cls].name+' ':'')+t[1].toLowerCase(),name:o.name,desc:o.desc}:null};
O.boxCost=opened=>80+6*opened;
})();
