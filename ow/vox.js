/* GambaGolf: voxel models.
   A model is a set of rigid parts, each a dictionary of voxels, built into three.js meshes with face culling,
   per-vertex ambient occlusion and a little per-voxel colour noise. Axes: x right, y up, z toward the model's front. */
(()=>{
const O=window.OW=window.OW||{};
const V=O.V={};
V.S=.05;                                       // world metres per voxel for characters
const hx=(x,y,z)=>{let n=(x*73856093)^(y*19349663)^(z*83492791);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)%1000/1000};
V.hash=hx;
const hexRGB=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const toLin=c=>c.map(v=>Math.pow(v,2.2));
V.rgb=hexRGB;

/* a palette entry is a hex colour, or {c:'#hex', n:noise 0..1, glow:1}; noise jitters each voxel's brightness and hue a little */
class Part{
  constructor(name,pivot,parent){this.name=name;this.pivot=pivot||[0,0,0];this.parent=parent||null;this.v=new Map();this.rot=[0,0,0]}
  key(x,y,z){return x+','+y+','+z}
  set(x,y,z,c){this.v.set(this.key(x,y,z),[x,y,z,c]);return this}
  get(x,y,z){const e=this.v.get(this.key(x,y,z));return e?e[3]:null}
  del(x,y,z){this.v.delete(this.key(x,y,z));return this}
  box(x0,x1,y0,y1,z0,z1,c,mir){for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++){this.set(x,y,z,c);if(mir)this.set(-1-x,y,z,c)}return this}
  cut(x0,x1,y0,y1,z0,z1,mir){for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++){this.del(x,y,z);if(mir)this.del(-1-x,y,z)}return this}
  /* recolour only voxels that exist */
  paint(x0,x1,y0,y1,z0,z1,c,mir){for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++){if(this.get(x,y,z)!=null)this.set(x,y,z,c);if(mir&&this.get(-1-x,y,z)!=null)this.set(-1-x,y,z,c)}return this}
  ell(cx,cy,cz,rx,ry,rz,c,mir){for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let z=Math.floor(cz-rz);z<=Math.ceil(cz+rz);z++){const q=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2+((z+.5-cz)/rz)**2;if(q<=1){this.set(x,y,z,c);if(mir)this.set(-1-x,y,z,c)}}return this}
  /* a voxel line from a to b, t voxels thick */
  line(a,b,c,t){const n=Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]),Math.abs(b[2]-a[2])))+1,h=(t||1)-1;for(let i=0;i<n;i++){const f=n>1?i/(n-1):0,x=Math.round(a[0]+(b[0]-a[0])*f),y=Math.round(a[1]+(b[1]-a[1])*f),z=Math.round(a[2]+(b[2]-a[2])*f);this.box(x,x+h,y,y+h,z,z+h,c)}return this}
  mirrorX(){for(const[x,y,z,c]of[...this.v.values()])this.set(-1-x,y,z,c);return this}
  clone(name,pivot,parent){const p=new Part(name,pivot||this.pivot.slice(),parent===undefined?this.parent:parent);for(const[k,e]of this.v)p.v.set(k,e.slice());return p}
  flipX(name,parent){const p=new Part(name,[-this.pivot[0],this.pivot[1],this.pivot[2]],parent===undefined?this.parent:parent);for(const[x,y,z,c]of this.v.values())p.set(-1-x,y,z,c);return p}
}
V.Part=Part;

const FACES=[
 {n:[1,0,0],q:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],sh:.82},
 {n:[-1,0,0],q:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],sh:.82},
 {n:[0,1,0],q:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],sh:1},
 {n:[0,-1,0],q:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],sh:.55},
 {n:[0,0,1],q:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],sh:.9},
 {n:[0,0,-1],q:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],sh:.72}];

/* build one part into geometry. pal maps colour names to entries. Returns {solid, glow} BufferGeometries (glow may be null). */
V.geom=function(part,pal,scale,opt){
  opt=opt||{};const S0=scale||V.S,S=Array.isArray(S0)?S0:[S0,S0,S0],[px,py,pz]=part.pivot,ao=opt.ao!==false;
  const occ=(x,y,z)=>part.v.has(x+','+y+','+z)?1:0;
  const buf={solid:{p:[],n:[],c:[],i:[]},glow:{p:[],n:[],c:[],i:[]}};
  for(const[x,y,z,cn]of part.v.values()){
    const e=pal[cn];if(e==null)continue;const ent=typeof e==='string'?{c:e}:e;
    let base=ent._rgb||(ent._rgb=hexRGB(ent.c));
    const nz=ent.n==null?.07:ent.n,h1=hx(x,y,z),h2=hx(z+7,x-3,y+11);
    let k=1+(h1-.5)*2*nz;if(ent.alt&&h2<(ent.p||.18))base=ent._alt||(ent._alt=hexRGB(ent.alt));
    const B=ent.glow?buf.glow:buf.solid;
    for(const f of FACES){const[nx,ny,nz2]=f.n;if(occ(x+nx,y+ny,z+nz2))continue;
      const i0=B.p.length/3;
      for(const q of f.q){
        B.p.push((x+q[0]-px)*S[0],(y+q[1]-py)*S[1],(z+q[2]-pz)*S[2]);B.n.push(nx,ny,nz2);
        let a=1;if(ao&&!ent.glow){                                  // classic voxel AO: look at the three cells that touch this corner in the layer outside the face
          const ox=x+nx,oy=y+ny,oz=z+nz2,ax=[0,1,2].filter(i=>f.n[i]===0),u=ax[0],v=ax[1],du=[0,0,0],dv=[0,0,0];du[u]=q[u]?1:-1;dv[v]=q[v]?1:-1;
          const s1=occ(ox+du[0],oy+du[1],oz+du[2]),s2=occ(ox+dv[0],oy+dv[1],oz+dv[2]),cr=occ(ox+du[0]+dv[0],oy+du[1]+dv[1],oz+du[2]+dv[2]);
          const lv=s1&&s2?0:3-(s1+s2+cr);a=[.5,.68,.84,1][lv]}
        const m=ent.glow?1:f.sh*k*a;B.c.push(...toLin(base.map(v=>Math.min(1,v*m))))}
      B.i.push(i0,i0+1,i0+2,i0,i0+2,i0+3)}}
  const mk=b=>{if(!b.p.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setIndex(b.i);g.computeBoundingSphere();return g};
  return{solid:mk(buf.solid),glow:mk(buf.glow)}};

V.matSolid=()=>V._ms||(V._ms=new THREE.MeshLambertMaterial({vertexColors:true}));
V.matGlow=()=>V._mg||(V._mg=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}));

/* build a model {parts:[Part], pal} into a THREE.Group. Each part becomes a Group named after it, placed at its pivot. */
V.build=function(model,scale){
  const S=scale||model.scale||V.S,root=new THREE.Group(),by={};root.name=model.name||'vox';
  for(const p of model.parts){const g=new THREE.Group();g.name=p.name;const geo=V.geom(p,model.pal,S);
    if(geo.solid){const m=new THREE.Mesh(geo.solid,V.matSolid());m.castShadow=true;m.receiveShadow=true;g.add(m)}
    if(geo.glow){const m=new THREE.Mesh(geo.glow,V.matGlow());g.add(m)}
    g.userData.pivot=p.pivot;by[p.name]=g}
  for(const p of model.parts){const g=by[p.name],par=p.parent&&by[p.parent],pp=par?model.parts.find(q=>q.name===p.parent).pivot:[0,0,0];if(!par&&p.parent)p.parent=null;
    g.position.set((p.pivot[0]-pp[0])*S,(p.pivot[1]-pp[1])*S,(p.pivot[2]-pp[2])*S);g.rotation.set(...p.rot);(par||root).add(g)}
  root.userData.parts=by;root.userData.model=model;return root};

/* count voxels, for budgets */
V.count=model=>model.parts.reduce((a,p)=>a+p.v.size,0);
})();
