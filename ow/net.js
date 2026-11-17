/* GambaGolf: the no-account connection, for when the game is hosted outside Claude.
   Phones link straight to the big screen with WebRTC (PeerJS). It offers the same small surface the game uses from Claude's room:
   lobby.join(name, {host}) gives a room with presence(obj), peers() and leave(). The big screen is the hub: every phone connects to it,
   sends its own state, and hears the host's. Inside Claude this file does nothing (Claude's own room is used there). */
(()=>{
const O=window.OW;
const PRE='ossuarywheel-v1-';
function cfg(){const q=new URLSearchParams(location.search),h=q.get('peerhost');
  const c={debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]}};
  if(h){const[host,port]=h.split(':');Object.assign(c,{host,port:+port||9000,path:'/',secure:location.protocol==='https:'})}return c}
const enc=p=>JSON.stringify({t:'p',p});
const dec=d=>{try{const m=typeof d==='string'?JSON.parse(d):d;return m&&m.t==='p'&&m.p&&typeof m.p==='object'?m.p:null}catch(e){return null}};

/* the big screen: owns the code's id, takes every phone's connection */
function hostRoom(name,tries){return new Promise((res,rej)=>{const id=PRE+name,peer=new Peer(id,cfg()),conns=new Map();let mine={},snap=null,done=false;
  const room={
    peers(){if(snap)return snap;const a=[{peer:id,sameTab:true,isMe:true,kind:'viewer',presence:mine}];for(const[k,c]of conns)if(c.pres)a.push({peer:k,sameTab:false,isMe:false,kind:'viewer',presence:c.pres});return snap=Object.freeze(a)},
    presence(p){mine=Object.assign({},mine,p);snap=null;const m=enc(mine);for(const c of conns.values())if(c.open)try{c.send(m)}catch(e){}return Promise.resolve()},
    leave(){try{peer.destroy()}catch(e){}return Promise.resolve()},connected:()=>!peer.disconnected};
  peer.on('open',()=>{done=true;res(room)});
  peer.on('connection',c=>{c.on('open',()=>{conns.set(c.peer,c);snap=null;try{c.send(enc(mine))}catch(e){}});
    c.on('data',d=>{const p=dec(d);if(p){c.pres=Object.assign({},c.pres||{},p);snap=null}});
    const gone=()=>{if(conns.get(c.peer)===c){conns.delete(c.peer);snap=null}};c.on('close',gone);c.on('error',gone)});
  peer.on('disconnected',()=>{setTimeout(()=>{try{if(!peer.destroyed)peer.reconnect()}catch(e){}},1000)});
  peer.on('error',e=>{if(done)return;done=true;try{peer.destroy()}catch(q){}
    if(e.type==='unavailable-id'&&(tries||0)<6)setTimeout(()=>hostRoom(name,(tries||0)+1).then(res,rej),2500);          // a reloaded big screen waits for its old id to be released
    else rej({code:'upstream_error',message:String(e.type||e)})})})}

/* a phone: dials the big screen for its code, and keeps redialling if the line drops */
function clientRoom(name){return new Promise((res,rej)=>{const hid=PRE+name,peer=new Peer(cfg());let conn=null,hostP=null,mine={},snap=null,closed=false,opened=false,wait=null;
  const room={
    peers(){if(snap)return snap;const a=[{peer:peer.id||'me',sameTab:true,isMe:true,kind:'viewer',presence:mine}];if(hostP)a.push({peer:hid,sameTab:false,isMe:false,kind:'viewer',presence:hostP});return snap=Object.freeze(a)},
    presence(p){mine=Object.assign({},mine,p);snap=null;if(conn&&conn.open)try{conn.send(enc(mine))}catch(e){}return Promise.resolve()},
    leave(){closed=true;try{peer.destroy()}catch(e){}return Promise.resolve()},connected:()=>!!(conn&&conn.open)};
  const redial=ms=>{if(closed||wait)return;wait=setTimeout(()=>{wait=null;dial()},ms)};
  const dial=()=>{if(closed||peer.destroyed)return;if(peer.disconnected){try{peer.reconnect()}catch(e){}redial(1500);return}
    const c=peer.connect(hid,{reliable:true,serialization:'json'});conn=c;
    c.on('open',()=>{try{c.send(enc(mine))}catch(e){}});
    c.on('data',d=>{const p=dec(d);if(p){hostP=Object.assign({},hostP||{},p);snap=null}});
    c.on('close',()=>{if(conn===c){hostP=null;snap=null;redial(1500)}});c.on('error',()=>{if(conn===c)redial(2000)})};
  peer.on('open',()=>{opened=true;dial();res(room)});
  peer.on('disconnected',()=>{setTimeout(()=>{try{if(!peer.destroyed)peer.reconnect()}catch(e){}},1000)});
  peer.on('error',e=>{if(!opened){rej({code:'upstream_error',message:String(e.type||e)});return}
    if(e.type==='peer-unavailable'){hostP=null;snap=null;redial(2500)}})})}

O.netUse=()=>Promise.resolve(window.Peer?{peers:()=>Object.freeze([]),presence:()=>Promise.resolve(),join:(name,o)=>o&&o.host?hostRoom(name):clientRoom(name)}:null);
O.offClaude=!(window.claude&&window.claude.use);
if(O.offClaude)O.LINK=location.origin+location.pathname;          // the join link and QR point at wherever this page is hosted
})();
