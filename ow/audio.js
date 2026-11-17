/* GambaGolf: sound and music. Everything is synthesised in the browser: no audio files. Starts on the first press of a button.
   Effects and music run on their own buses with their own volume, and both feed one stone-hall reverb. */
(()=>{
const O=window.OW;let ac=null,master=null,sfxBus=null,musBus=null,revIn=null,noiseBuf=null,roll=null,drone=null,on=true;const vol={music:.7,sfx:.9};
try{on=localStorage.getItem('ow_sound')!=='0';const v=JSON.parse(localStorage.getItem('ow_vol')||'null');if(v&&typeof v==='object')for(const k in vol)if(typeof v[k]==='number'&&isFinite(v[k]))vol[k]=Math.min(1,Math.max(0,v[k]))}catch(e){}
function init(){
  if(ac)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{ac=new AC();master=ac.createGain();master.gain.value=on?.8:0;const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=5;master.connect(comp);comp.connect(ac.destination);
    sfxBus=ac.createGain();sfxBus.gain.value=vol.sfx;sfxBus.connect(master);musBus=ac.createGain();musBus.gain.value=vol.music*.85;musBus.connect(master);
    {const len=Math.floor(ac.sampleRate*2.8),ir=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);let lp=0;for(let i=0;i<len;i++){const t=i/len,n=Math.random()*2-1;lp+=(n-lp)*(.55-.4*t);d[i]=lp*Math.pow(1-t,2.6)*(i<400?i/400:1)}}       // a made-up impulse: the tail of a stone hall
      const cv=ac.createConvolver();cv.buffer=ir;const wet=ac.createGain();wet.gain.value=.5;cv.connect(wet);wet.connect(master);revIn=ac.createGain();revIn.connect(cv);const s1=ac.createGain();s1.gain.value=.2;sfxBus.connect(s1);s1.connect(revIn);const s2=ac.createGain();s2.gain.value=.55;musBus.connect(s2);s2.connect(revIn)}
    noiseBuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    // the ball's rumble: filtered noise whose loudness and pitch follow its speed
    const src=ac.createBufferSource();src.buffer=noiseBuf;src.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=300;f.Q.value=1.2;const g=ac.createGain();g.gain.value=0;src.connect(f);f.connect(g);g.connect(sfxBus);src.start();roll={f,g}}catch(e){ac=null}}
O.audioInit=function(){init();if(ac&&ac.state==='suspended')ac.resume().catch(()=>{})};
O.soundOn=()=>on;
O.setSound=function(v){on=!!v;try{localStorage.setItem('ow_sound',on?'1':'0')}catch(e){}if(master)master.gain.setTargetAtTime(on?.8:0,ac.currentTime,.05)};
O.vol=k=>vol[k]==null?1:vol[k];
O.setVol=function(k,v){if(vol[k]==null)return;vol[k]=Math.min(1,Math.max(0,+v||0));try{localStorage.setItem('ow_vol',JSON.stringify(vol))}catch(e){}if(ac){sfxBus.gain.setTargetAtTime(vol.sfx,ac.currentTime,.05);musBus.gain.setTargetAtTime(vol.music*.85*duck,ac.currentTime,.05)}};
const now=()=>ac.currentTime;
function env(g,t,a,d,peak){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
function tone(type,f0,f1,dur,vol,delay,dest){const t=now()+(delay||0),o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);env(g,t,.006,dur,vol);o.connect(g);g.connect(dest||sfxBus);o.start(t);o.stop(t+dur+.05)}
function noise(dur,vol,type,f0,f1,q,delay){const t=now()+(delay||0),s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;s.loop=true;f.type=type;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,.008,dur,vol);s.connect(f);f.connect(g);g.connect(sfxBus);s.start(t,Math.random());s.stop(t+dur+.05)}
const NOTE=n=>220*Math.pow(2,n/12),SCALE=[0,3,5,7,10,12,15,17,19,22];
const S={
 click(){tone('triangle',900,600,.05,.12)},
 pick(){tone('triangle',520,780,.09,.16);tone('sine',1040,1560,.12,.08,.03)},
 kick(o){const p=1+.07*Math.min(10,o&&o.n||0);tone('square',520*p,1040*p,.07,.16);tone('triangle',1560*p,780*p,.09,.14,.01);noise(.05,.12,'highpass',2500)},
 spin(){for(let i=0;i<22;i++)tone('square',240+((i*7)%5)*40,220+((i*7)%5)*40,.025,.05,i*.1);noise(2.1,.05,'bandpass',1800,900,3)},
 reelStop(){tone('sine',150,70,.14,.4);noise(.05,.2,'lowpass',900);tone('triangle',880,660,.06,.1,.02)},
 reelWin(){tone('sine',150,70,.14,.4);for(const[i,n]of[0,4,7,12,16,19].entries())tone('triangle',NOTE(n+12),NOTE(n+12),.16,.15,.08+i*.07);tone('sine',NOTE(24),NOTE(24),.5,.1,.5)},
 rest(){tone('sine',180,110,.18,.14);noise(.06,.05,'lowpass',500)},
 blunt(){tone('sawtooth',300,90,.4,.22);tone('sine',90,60,.5,.3);noise(.25,.2,'bandpass',900,200,2)},
 lock(){tone('triangle',880,1320,.12,.16);tone('square',1760,1760,.05,.08,.1);noise(.04,.08,'highpass',4000)},
 core(){for(const[i,n]of[0,7,12,19].entries())tone('triangle',NOTE(n+9),NOTE(n+9),.5,.14,i*.07);tone('sine',70,50,.8,.35);noise(.3,.14,'highpass',3000)},
 tick(o){const p=(.8+Math.random()*.3)*(1+.08*Math.min(10,o&&o.n||0));tone('triangle',1500*p,700*p,.045,.14*(o&&o.v||1));noise(.03,.08,'highpass',3000)},
 launch(o){const heavy=o&&o.r>16;noise(.28,heavy?.3:.2,'bandpass',heavy?300:900,heavy?90:300,1.5);tone(heavy?'sawtooth':'sine',heavy?110:520,heavy?55:260,.22,heavy?.25:.14)},
 cast(o){const c=o&&o.cls,k=o&&o.rep?.5:1;                       // a repeated attack is cast in half the time, and sounds it
   if(c==='warrior'){tone('sawtooth',90,45,.5,.3,.9*k);noise(.35,.35,'lowpass',900,120,1,.95*k)}
   else if(c==='mage'){for(let i=0;i<7;i++)tone('sine',NOTE(SCALE[i+2]+12),NOTE(SCALE[i+2]+12),.22,.1,(.2+i*.09)*k);noise(.9*k,.07,'bandpass',2500,6000,4,.2*k)}
   else if(c==='archer'){noise(.5*k,.08,'bandpass',500,1600,6,.3*k);tone('triangle',180,720,.06,.3,1.08*k);tone('sine',1400,400,.3,.1,1.1*k)}
   else{for(const[i,n]of[0,4,7,12].entries())tone('triangle',NOTE(n+3),NOTE(n+3),.7,.12,(.25+i*.11)*k)}},
 sink(o){const t=o&&o.tier||0,c=Math.min(6,(o&&o.combo||1)-1);tone('sine',140,50,.35,.5);noise(.18,.3,'lowpass',700,150);
   const base=[0,4,7][t]+c*2;for(let i=0;i<3+t;i++)tone('triangle',NOTE(base+[0,4,7,12,16][i]+12),NOTE(base+[0,4,7,12,16][i]+12),.5,.16,.05+i*.06);
   if(o&&o.trick)for(let i=0;i<4;i++)tone('sine',NOTE(24+i*3),NOTE(24+i*3),.25,.1,.3+i*.05)},
 miss(){tone('sine',240,120,.25,.12)},
 comboEnd(){tone('sawtooth',300,90,.35,.1)},
 monHit(o){noise(.45,.5,'lowpass',1400,90,1,.28);tone('sawtooth',160,40,.5,.4,.28);tone('square',70,35,.4,.2,.3)},
 monFlinch(){noise(.15,.2,'bandpass',800,300,2);tone('square',200,90,.14,.12)},
 monAtk(o){const big=o&&o.rank!=='lesser',f=big?70:150;const t=now(),os=ac.createOscillator(),l=ac.createOscillator(),lg=ac.createGain(),fl=ac.createBiquadFilter(),g=ac.createGain();os.type='sawtooth';os.frequency.setValueAtTime(f,t);os.frequency.linearRampToValueAtTime(f*1.6,t+.35);os.frequency.linearRampToValueAtTime(f*.6,t+(big?1.1:.6));
   l.frequency.value=big?24:38;lg.gain.value=f*.25;l.connect(lg);lg.connect(os.frequency);fl.type='lowpass';fl.frequency.value=big?700:1300;env(g,t,.08,big?1.1:.6,big?.4:.25);os.connect(fl);fl.connect(g);g.connect(sfxBus);os.start(t);l.start(t);os.stop(t+1.4);l.stop(t+1.4);
   const W=o&&o.W||1.2;noise(W,big?.22:.12,'bandpass',180,big?1500:1100,2.5);tone('sawtooth',big?40:60,big?120:150,W,big?.22:.12);      // the threat builds for as long as the wind-up lasts
   for(let b=0,tt=0;tt<W-.15;b++){tone('sine',big?58:72,34,.2,big?.55:.35,tt);tt+=Math.max(.16,(big?.5:.42)*Math.pow(.8,b))}},
 hurt(){tone('square',180,60,.22,.25);noise(.12,.3,'lowpass',1000,200)},
 monSlam(o){const big=o&&o.rank!=='lesser';tone('sine',big?90:130,28,big?.9:.5,big?.9:.6);tone('sawtooth',big?60:90,30,.5,big?.4:.25);noise(big?.7:.35,big?.6:.4,'lowpass',big?2400:1800,70,1);if(big){noise(.9,.25,'bandpass',300,90,2,.12);tone('sine',44,36,1.3,.5,.05)}},
 heal(){for(let i=0;i<4;i++)tone('sine',NOTE(12+[0,4,7,12][i]),NOTE(12+[0,4,7,12][i]),.4,.09,i*.07)},
 enrage(){S.monAtk({rank:'boss'});tone('sawtooth',55,110,.9,.3,.1)},
 monDie(){tone('sawtooth',220,30,1.2,.3);noise(1.0,.3,'lowpass',2000,60)},
 intro(){tone('sine',55,55,2.2,.4);tone('sawtooth',82.4,82.4,2.0,.08,.2);noise(1.6,.12,'bandpass',200,90,3,.2)},
 boon(){for(let i=0;i<6;i++)tone('triangle',NOTE(SCALE[i]+12),NOTE(SCALE[i]+12),.5,.1,i*.08)},
 flash(){noise(.2,.25,'highpass',2000)},
 win(o){sting(o&&o.fin?'finale':'win')},
 lose(){sting('lose')},
 box(){noise(.6,.2,'bandpass',300,1200,3);for(let i=0;i<5;i++)tone('square',90+i*8,90+i*8,.06,.12,i*.11);for(const[i,n]of[0,7,12,16,19,24].entries())tone('triangle',NOTE(n+5),NOTE(n+5),i===5?1.4:.3,.16,.75+i*.07);noise(.5,.2,'highpass',4000,8000,1,.75)},
 trapGo(){tone('square',880,880,.12,.25);tone('square',1320,1320,.2,.25,.13)},
 turn(){tone('sine',660,880,.15,.12);tone('sine',990,1320,.2,.08,.1)},
 mgNote(o){const n=[0,4,7,12,16,19][(o&&o.i)||0]||0;tone('triangle',NOTE(n+12),NOTE(n+12),.32,.2);tone('sine',NOTE(n),NOTE(n),.4,.12)},
 mgTap(){tone('square',520,700,.05,.08)},
 mgBad(){tone('sawtooth',160,90,.2,.18)},
 mgGood(){tone('triangle',880,1320,.1,.14)},
 mgCount(){tone('square',660,660,.1,.18)},
 mgFinish(){tone('square',1320,1320,.12,.2);tone('square',1320,1320,.12,.2,.16);tone('square',1760,1760,.35,.22,.32)},
 mgWin(){for(const[i,n]of[0,4,7,12,7,12].entries())tone('triangle',NOTE(n+7),NOTE(n+7),.35,.16,i*.11);tone('sine',NOTE(-5),NOTE(-5),.9,.2,.55)},
 mgHit(){tone('square',220,90,.18,.22);noise(.12,.18,'bandpass',600,1800,1)},
 mgOut(){tone('sawtooth',300,60,.6,.25);noise(.3,.2,'lowpass',400,200,1)},
 travel(){for(let i=0;i<4;i++)noise(.08,.12,'lowpass',500,200,1,i*.22)}
};
O.sfx=function(name,o){if(!ac||!on||!S[name])return;try{S[name](o)}catch(e){}};
/* called every frame by the stage with the fastest ball's speed (field units per second), 0 when nothing rolls */
O.sfxRoll=function(sp,heavy){if(!roll)return;const t=now(),v=Math.min(1,sp/600);roll.g.gain.setTargetAtTime(on?v*(heavy?.34:.2):0,t,.05);roll.f.frequency.setTargetAtTime((heavy?140:260)+v*(heavy?320:700),t,.05)};
/* a low drone under everything, retuned per dungeon and raised in a fight */
O.sfxDrone=function(root,fight){
  if(!ac)return;const t=now();
  if(!drone){const g=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=320;g.gain.value=0;const os=[0,7.02,12.03,-12].map((n,i)=>{const o=ac.createOscillator();o.type=i%2?'triangle':'sawtooth';const og=ac.createGain();og.gain.value=i===3?.5:.22;o.connect(og);og.connect(f);o.start();return o});
    const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=.13;lg.gain.value=90;l.connect(lg);lg.connect(f.frequency);l.start();f.connect(g);g.connect(musBus);drone={g,f,os,root:-99}}
  if(drone.root!==root){drone.root=root;drone.os.forEach((o,i)=>o.frequency.setTargetAtTime(55*Math.pow(2,(root+[0,7.02,12.03,-12][i])/12),t,1.5))}
  drone.g.gain.setTargetAtTime(fight?.07:.05,t,1.2);drone.f.frequency.setTargetAtTime(fight?380:240,t,1.2)};
/* ---------- the score ----------
   Written, not recorded: each dungeon has its own key, mode and eight-note theme, and the same theme is carried by bells on the map,
   by low strings and drums in a fight, and by horns against a boss. A scheduler lays notes a little ahead of the clock. */
const MODES=[[0,2,3,5,7,8,10],[0,1,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,3,5,7,8,11]],PROG=[[0,5,3,4],[0,1,0,6],[0,3,0,6],[0,3,4,0]],ROOTS=[0,3,-2,5,1,-4,2,7,-1,4];
const TEMPO={menu:54,map:60,fight:98,boss:114};
let mus={mood:'none',dung:-1,step:0,next:0,motif:[0,2,4,2,4,5,4,2],mode:0,root:0,timer:null},duck=1;
const mf=(n,oct)=>110*Math.pow(2,(mus.root+n)/12+(oct||0)),deg=d=>{const sc=MODES[mus.mode];return sc[((d%7)+7)%7]+12*Math.floor(d/7)};
function voice(type,f,t,a,d,v,cut,q){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);
  if(cut){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;fl.Q.value=q||.7;o.connect(fl);fl.connect(g)}else o.connect(g);g.connect(musBus);o.start(t);o.stop(t+a+d+.1);return o}
const I={
 pad(f,t,dur,v){for(const dt of[-5,6]){const o=voice('sawtooth',f,t,dur*.3,dur*.9,v*.5,620,.5);o.detune.value=dt}voice('sine',f/2,t,dur*.25,dur,v*.6)},
 bell(f,t,v){voice('sine',f,t,.004,2.6,v);voice('sine',f*2.76,t,.004,1.1,v*.28);voice('sine',f*5.4,t,.003,.4,v*.1)},
 pluck(f,t,v){voice('triangle',f,t,.005,1.3,v,2400);voice('sine',f*2,t,.004,.5,v*.3)},
 bass(f,t,dur,v){voice('sine',f,t,.02,dur,v);voice('triangle',f*2,t,.02,dur*.6,v*.25,500)},
 str(f,t,dur,v){const o=voice('sawtooth',f,t,.012,dur,v,1300,1.2);o.detune.value=4;voice('sawtooth',f,t,.012,dur,v*.6,900).detune.value=-7},
 horn(f,t,dur,v){const o=ac.createOscillator(),g=ac.createGain(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(f*.985,t);o.frequency.linearRampToValueAtTime(f,t+.09);fl.type='lowpass';fl.Q.value=1.4;fl.frequency.setValueAtTime(260,t);fl.frequency.linearRampToValueAtTime(1500,t+.14);fl.frequency.linearRampToValueAtTime(620,t+dur);
   g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.08);g.gain.setValueAtTime(v,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.25);o.connect(fl);fl.connect(g);g.connect(musBus);o.start(t);o.stop(t+dur+.4);voice('sawtooth',f/2,t,.08,dur,v*.5,500)},
 drum(t,v,f0){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f0||92,t);o.frequency.exponentialRampToValueAtTime(36,t+.2);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.5);o.connect(g);g.connect(musBus);o.start(t);o.stop(t+.6);
   const s=ac.createBufferSource(),f=ac.createBiquadFilter(),n=ac.createGain();s.buffer=noiseBuf;f.type='lowpass';f.frequency.value=420;n.gain.setValueAtTime(v*.5,t);n.gain.exponentialRampToValueAtTime(.0001,t+.14);s.connect(f);f.connect(n);n.connect(musBus);s.start(t,Math.random());s.stop(t+.2)},
 clack(t,v){const s=ac.createBufferSource(),f=ac.createBiquadFilter(),n=ac.createGain();s.buffer=noiseBuf;f.type='bandpass';f.frequency.value=1700+Math.random()*500;f.Q.value=4;n.gain.setValueAtTime(v,t);n.gain.exponentialRampToValueAtTime(.0001,t+.05);s.connect(f);f.connect(n);n.connect(musBus);s.start(t,Math.random());s.stop(t+.08)}
};
function playStep(st,t){
  const m=mus.mood,bar=Math.floor(st/8)%8,pos=st%8,ch=PROG[mus.mode][bar>>1],tri=k=>mf(deg(ch+[0,2,4,7][k%4]),0),step=60/TEMPO[m]/2,mo=mus.motif;
  if(m==='menu'||m==='map'){
    if(pos===0&&bar%2===0){const dur=step*16;for(const k of[0,1,2])I.pad(tri(k),t,dur,.05);I.bass(mf(deg(ch),-1),t,dur*.6,.11)}
    if(pos===0&&bar%2===1)I.bass(mf(deg(ch),-1),t,step*6,.07);
    const pat=bar%2?[2,5]:[0,3,6],k=pat.indexOf(pos);if(k>=0&&(m==='map'||bar%4<2))I.bell(tri(k+bar)*(k===2?4:2),t,.05);
    if(bar%4===3&&pos%2===0){const n=mo[(bar>3?4:0)+pos/2];I.pluck(mf(deg(n),1),t,m==='map'?.085:.06)}}
  else if(m==='fight'||m==='boss'){const boss=m==='boss';
    if(pos===0&&bar%2===0){const dur=step*16;for(const k of[0,1,2])I.pad(tri(k)*(boss&&k===2?2:1),t,dur,boss?.04:.032);I.bell(tri(0)*2,t,.03)}
    if([1,0,0,1,0,0,1,0][pos])I.bass(mf(deg(ch),-1),t,step*1.6,.13);
    I.str(mf(deg(ch+[0,0,4,0,0,4,0,7][pos]),0),t,step*.85,boss?.05:.036);
    if(boss?[1,0,0,1,1,0,1,0][pos]:pos===0||pos===4||(pos===7&&bar%2))I.drum(t,pos===0?.34:.24,pos===0?96:84);
    if(boss?pos%2===1:pos===2||pos===6)I.clack(t,boss?.07:.05);
    if(bar>=6&&pos%2===0){const n=mo[(bar-6)*4+pos/2];if(boss)I.horn(mf(deg(n),0),t,step*1.7,.075);else I.pluck(mf(deg(n),1),t,.06)}
    if(boss&&bar===3&&pos===4)for(let i=0;i<4;i++)I.drum(t+i*step*.5,.2+i*.04,110)}
}
function pump(){
  if(!ac||ac.state!=='running'||mus.mood==='none')return;const t=ac.currentTime;if(mus.next<t)mus.next=t+.05;
  while(mus.next<t+.35){try{playStep(mus.step,mus.next)}catch(e){}mus.next+=60/TEMPO[mus.mood]/2;mus.step++}}
/* the stage names the mood each frame: 'menu', 'map', 'fight', 'boss' or 'none' */
O.music=function(mood,dung){
  if(!ac)return;if(!TEMPO[mood])mood='none';
  if(dung!==mus.dung){mus.dung=dung;mus.mode=dung%4;mus.root=ROOTS[dung%10];const r=O.rng(O.hash('theme'+dung));let n=4;mus.motif=Array.from({length:8},(_,i)=>{n=Math.max(0,Math.min(9,n+[-2,-1,-1,1,1,2,3][Math.floor(r()*7)]));return i===7?(r()<.5?0:4):n});mus.step=0}
  if(mood!==mus.mood){const was=mus.mood;mus.mood=mood;if(was==='none'||mood==='boss'||was==='boss')mus.step=0;else mus.step=Math.ceil(mus.step/8)*8;mus.next=Math.max(mus.next,ac.currentTime+.08)}
  if(!mus.timer)mus.timer=setInterval(pump,90);
  O.sfxDrone(ROOTS[dung%10],mood==='fight'||mood==='boss')};
O.musicDuck=function(v){duck=v?.3:1;if(ac)musBus.gain.setTargetAtTime(vol.music*.85*duck,ac.currentTime,.25)};
/* short written pieces for the end of a run */
function sting(kind){
  if(!ac)return;const t=ac.currentTime+.05;mus.mood='none';const n=(d,o)=>mf(deg(d),o||0),maj=x=>110*Math.pow(2,(mus.root+x)/12);
  if(kind==='lose'){for(const[i,d]of[4,2,1,0].entries())I.horn(n(d,-1),t+i*.7,.9,.07);I.pad(n(0,-1),t+2.1,4,.07);for(let i=0;i<3;i++)I.drum(t+i*1.05,.3-i*.06,70)}
  else{const fin=kind==='finale',L=fin?1.5:1;                                   // minor home, up through the sixth and seventh, and out into the major
    [[0,2,4],[5,7,9],[6,8,10]].forEach((c,i)=>{c.forEach(d=>I.horn(n(d,0),t+i*.55*L,.6*L,.05));I.drum(t+i*.55*L,.3,96)});
    const T=t+1.65*L;for(const x of[0,4,7,12])I.horn(maj(x),T,2.4*L,.055);for(const[i,x]of[12,16,19,24,28].entries())I.bell(maj(x)*2,T+i*.13,.06);I.drum(T,.4,90);I.pad(maj(0)/2,T,5*L,.08);
    if(fin){for(const[i,x]of[24,19,16,12,7,4,0].entries())I.bell(maj(x)*2,T+2.6+i*.32,.05);for(const x of[0,7,12,16])I.pad(maj(x),T+2.4,7,.05)}}}
O.buzz=function(p){try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}};
})();
