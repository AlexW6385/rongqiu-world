/* Creatures (DESIGN §8 Creatures): shape helpers and one def() per species — look, size, colour, posture, gait hints, group size.
   Sizes and colours follow the encyclopedia entries named in the comments (rongqiu-source encyclopedia/<id>.md).
   Placement, spawning and motion stay in index.html. */
export function defineCreatures({ THREE, M4, merge, paint }) {
const E=(rx,ry,rz,x,y,z,c,rotZ=0,rotY=0)=>({g:new THREE.SphereGeometry(1,16,12),m:new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rotY,rotZ)),new THREE.Vector3(rx,ry,rz)),c});
const C=(r0,r1,len,x,y,z,c,rx=0,ry=0,rz=0,seg=8)=>({g:new THREE.CylinderGeometry(r1,r0,len,seg),m:M4(x,y,z,rx,ry,rz),c});
const K=(r,len,x,y,z,c,rx=0,ry=0,rz=0,seg=8)=>({g:new THREE.ConeGeometry(r,len,seg),m:M4(x,y,z,rx,ry,rz),c});
/* a tube along points whose radius tapers from r0 to r1: tails, necks, worm bodies */
function taper(pts,r0,r1,c,seg=14,rad=10){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(curve,seg,1,rad,false);const pos=g.attributes.position;
  for(let i=0;i<=seg;i++){const ctr=curve.getPointAt(i/seg);const r=r0+(r1-r0)*(i/seg);for(let j=0;j<=rad;j++){const k=i*(rad+1)+j;pos.setXYZ(k,ctr.x+(pos.getX(k)-ctr.x)*r,ctr.y+(pos.getY(k)-ctr.y)*r,ctr.z+(pos.getZ(k)-ctr.z)*r);}}
  g.computeVertexNormals();return {g,c};}
/* darker back, lighter belly, faint mottling — reads as skin instead of plastic */
function shadeGeo(g){const c=g.attributes.color,n=g.attributes.normal,p=g.attributes.position;for(let i=0;i<c.count;i++){const ny=n.getY(i);const f=(ny>0?1-.22*ny:1-.2*ny)*(1+.08*Math.sin(p.getX(i)*9+p.getZ(i)*7)*Math.sin(p.getY(i)*11+p.getX(i)*3));c.setXYZ(i,c.getX(i)*f,c.getY(i)*f,c.getZ(i)*f);}c.needsUpdate=true;return g;}
const body=parts=>shadeGeo(merge(parts.map(p=>p.keep?p:({...p,c:[p.c[0]*.55,p.c[1]*.55,p.c[2]*.55]})),false).solid);
/* a smooth lofted body: one continuous skin along a spine in the x–y plane (the animal's side is +z). prof(t) gives the half-width w,
   half-height h and a vertical offset dy of the cross-section at t∈[0,1] along the spine; col(t,a,y) gives the skin colour, where a is the
   angle round the section (π/2 = the back, −π/2 = the belly). Gives real silhouettes — necks flowing into shoulders, a belly, a tail
   tapering to a point — instead of overlapping ellipsoids. */
function loft(spine,prof,col,rings=40,seg=16){const curve=new THREE.CatmullRomCurve3(spine.map(p=>new THREE.Vector3(...p)));const Z=new THREE.Vector3(0,0,1);
  const P=[],C=[],I=[],U=[];for(let i=0;i<=rings;i++){const t=i/rings,c=curve.getPointAt(t),T=curve.getTangentAt(t);const N=new THREE.Vector3().crossVectors(Z,T).normalize();const {w,h,dy=0}=prof(t);
    for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2-Math.PI/2;const ca=Math.cos(a),sa=Math.sin(a);const flat=sa<0?.85:1;   // a slightly flatter belly
      P.push(c.x+N.x*(sa*h*flat+dy),c.y+N.y*(sa*h*flat+dy),c.z+ca*w);U.push(j/seg,t);C.push(...col(t,Math.atan2(sa,ca),c.y+N.y*sa*h));}}
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){const a=i*(seg+1)+j,b=a+seg+1;I.push(a,b,a+1,a+1,b,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return {g,m:null,c:null,keep:1};}
/* skin colour helper: darker back, paler belly, optional stripes/spots and glitter, all pre-darkened like body() does */
const skin=(back,belly,o={})=>(t,a,y)=>{const up=Math.sin(a);let f=up>0?1:0;const m=.5+.5*up;let c=belly.map((v,k)=>v+(back[k]-v)*Math.pow(m,.8));
  if(o.stripes){const st=Math.sin(t*o.stripes*6.283+Math.cos(a)*.6);if(up>.2&&st>.55)c=c.map((v,k)=>v*.7);}
  if(o.spots){const sp=Math.sin(t*o.spots*13.1+a*5.3)*Math.sin(t*o.spots*7.7-a*3.1);if(up>-.1&&sp>.6)c=c.map(v=>v*.62);}
  if(o.glitter){const gl=Math.sin(t*391+a*137)*Math.sin(t*223-a*71);if(gl>.82)c=c.map(v=>v*1.6);}
  return c.map(v=>v*.55);};
/* a leg hangs from its hip (origin) straight down; thigh and shin taper; foot at the bottom */
function legGeo(len,r,c,foot=1.4){return body([C(r,r*.8,len*.52,0,-len*.26,0,c),C(r*.8,r*.55,len*.5,0,-len*.73,0,c),E(r*foot,r*.5,r*foot*.9,r*.25,-len,0,c)]);}
function wingGeo(span,chord,c){const g=new THREE.BufferGeometry();const v=[0,0,0, chord*.1,0,span*.15, -chord*.15,0,span, -chord*.7,0,span*.75, -chord*.95,0,span*.35, -chord*.55,0,0];
  const idx=[0,1,5,1,4,5,1,2,3,1,3,4];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return paint(g.toNonIndexed(),[c[0]*.55,c[1]*.55,c[2]*.55]);}

/* radius along a body from keyframes [[t,r],...], eased between them */
const keyR=(k,t)=>{for(let i=0;i<k.length-1;i++)if(t>=k[i][0]&&t<=k[i+1][0]){const u=(t-k[i][0])/(k[i+1][0]-k[i][0]);return k[i][1]+(k[i+1][1]-k[i][1])*(.5-.5*Math.cos(u*Math.PI));}return k[k.length-1][1];};
/* a jointed leg hanging from its hip: a muscular thigh angled forward, a shin angled back, a long foot bone and toes (digitigrade), or a
   straight pillar with a round foot (graviportal, o.pillar) */
function limb(len,r,c,o={}){const t=o.toes??3,cl=o.claw||[.82,.78,.66];
  if(o.pillar)return body([taper([[0,0,0],[.04*len,-.45*len,0],[0,-.9*len,0]],r,r*.72,c,10,12),E(r*.95,r*.35,r*.95,0,-len*.97,0,tone(c,.8))]);
  const kx=.18*len,ky=-.42*len,ax=-.12*len,ay=-.82*len;
  const parts=[taper([[0,0,0],[kx*.6,ky*.5,0],[kx,ky,0]],r,r*.62,c,10,12),taper([[kx,ky,0],[(kx+ax)/2,(ky+ay)/2,0],[ax,ay,0]],r*.6,r*.42,c,10,10),
    taper([[ax,ay,0],[ax+.04*len,-.95*len,0],[ax+.07*len,-len+.03*len,0]],r*.4,r*.32,c,8,8)];
  for(let f=0;f<t;f++){const z=(f-(t-1)/2)*r*.7;parts.push(taper([[ax+.07*len,-len+.03*len,0],[ax+.07*len+r*1.1,-len+.01*len,z],[ax+.07*len+r*1.9,-len,z*1.3]],r*.24,r*.1,c,6,6),
    K(r*.09,r*.45,ax+.07*len+r*2.15,-len,z*1.3,cl,0,0,-1.57));}
  return body(parts);}
const SPEC={};const geoCache={};
function def(key,o){SPEC[key]=o;}
const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// ---- 西之大陆 ----
/* 角龙 (encyclopedia jiaolong): a fat herbivore over 3 m long, ~900 kg, a shield frill behind the head and one long pointed horn;
   herds of ~30 under a leader. Colours are not in the book [inferred: olive-grey back, paler belly, a red-brown frill] */
def('ceratops',{n:'角龙',walk:1,speed:1.2,group:[10,20],build(){const c=[.3,.33,.17],b=[.55,.52,.36],d=[.05,.05,.04];
  const sp=[[-3.3,.8,0],[-2.2,1.15,0],[-1.1,1.5,0],[0,1.62,0],[1.0,1.55,0],[1.55,1.45,0],[2.05,1.38,0],[2.5,1.2,0],[2.75,1.0,0]];
  const k=[[0,.04],[.18,.3],[.38,.72],[.5,.82],[.62,.72],[.72,.52],[.8,.5],[.9,.38],[1,.1]];
  const parts=[loft(sp,t=>({w:keyR(k,t)*(t>.75?.82:1),h:keyR(k,t)*(t>.75?1.05:1.08)}),skin(c,b,{spots:3}),48,18)];
  // the frill: a broad shield swept up behind the head, scalloped edge, red-brown with a pale rim
  {const C0=[1.72,1.72,0],V=[-Math.sin(.65),Math.cos(.65),0],Rf=1.1,pos=[],col=[],idx=[];pos.push(...C0);col.push(.3,.17,.12);
   for(let i=0;i<=24;i++){const a=-1.75+i/24*3.5,r=Rf*(1+.06*Math.cos(i*Math.PI));pos.push(C0[0]+V[0]*Math.cos(a)*r,C0[1]+V[1]*Math.cos(a)*r,Math.sin(a)*r);col.push(.42,.26,.18);if(i<24)idx.push(0,i+1,i+2);
     if(i%2===0)parts.push(K(.08,.26,C0[0]+V[0]*Math.cos(a)*(r+.1),C0[1]+V[1]*Math.cos(a)*(r+.1),Math.sin(a)*(r+.1),[.85,.8,.66],Math.sin(a)*1.2,0,.65-Math.cos(a)*0));}
   const fr=new THREE.BufferGeometry();fr.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));fr.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));
   fr.setAttribute('color',new THREE.Float32BufferAttribute(col,3));fr.setIndex(idx);fr.computeVertexNormals();parts.push({g:fr,m:null,c:null,keep:1});}
  parts.push(K(.13,1.25,2.45,1.62,0,[.9,.86,.74],0,0,-.75),K(.08,.3,2.55,1.25,0,[.8,.76,.64],0,0,-1.2));   // the long horn, a nose boss
  for(const z of [1,-1])parts.push(E(.07,.06,.06,2.2,1.5,.36*z,[.12,.08,.04]),E(.03,.03,.03,2.24,1.51,.4*z,d));
  return {body:body(parts),legs:[[.9,1.2,.55],[.9,1.2,-.55],[-.95,1.25,.6],[-.95,1.25,-.6]].map(([x,y,z])=>({geo:limb(y,.24,c,{pillar:1}),x,y,z}))};}});
/* 骸龙 (encyclopedia gulong): ~2 m long, lanky, with long limbs of equal length; grey; the ribs show through the skin */
def('gulong',{n:'骸龙',walk:1,sc:.62,speed:1.5,group:[8,16],build(){const c=[.46,.46,.44],b=[.66,.65,.6];
  const sp=[[-2.5,1.3,0],[-1.6,1.45,0],[-.7,1.6,0],[0,1.62,0],[.6,1.6,0],[1.05,1.72,0],[1.35,1.82,0],[1.62,1.8,0]];
  const k=[[0,.03],[.25,.14],[.45,.3],[.6,.31],[.72,.2],[.82,.12],[.9,.17],[1,.06]];
  const sk=(t,a,y)=>{const base=skin(c,b)(t,a,y);const rib=t>.45&&t<.66&&Math.sin(t*170)>.55&&Math.abs(Math.sin(a))<.75;return rib?base.map(v=>v*1.35):base;};   // the ribs
  const parts=[loft(sp,t=>({w:keyR(k,t)*.85,h:keyR(k,t)*1.15}),sk,44,16)];
  for(const z of [1,-1])parts.push(E(.035,.035,.035,1.5,1.88,.1*z,[.9,.8,.2]));
  return {body:body(parts),legs:[[.55,1.55,.22],[.55,1.55,-.22],[-.55,1.55,.22],[-.55,1.55,-.22]].map(([x,y,z])=>({geo:limb(y,.09,c,{toes:4}),x,y,z,splay:.3}))};}});
/* the dragon peoples (encyclopedia emerald, baihai, yinjia): 骸龙 offshoots, upright bipeds about 1.8–2 m tall with a long tail;
   翡翠龙 leaf-green and glittering, some with a horned-dinosaur skull worn as a helmet and a long pole; 白骸龙 pure white and thin;
   银甲龙 in silver armour */
function folk(c,o={}){const b=o.belly||[c[0]*1.25+.12,c[1]*1.15+.1,c[2]*1.1+.06],d=[.05,.04,.04],sk=skin(c,b,{glitter:o.glitter,spots:o.spots});
  // one skin from tail tip through the hips, a deep chest, a slim neck and the head to the snout
  const spine=[[-1.8,.32,0],[-1.2,.55,0],[-.55,.9,0],[0,1.08,0],[.1,1.42,0],[.18,1.62,0],[.26,1.8,0],[.36,1.94,0],[.52,1.98,0],[.7,1.93,0]];
  const prof=t=>{const k=[[0,.015],[.12,.07],[.3,.15],[.42,.22],[.52,.25],[.6,.22],[.68,.16],[.74,.085],[.8,.08],[.86,.13],[.93,.11],[1,.05]];
    const r=keyR(k,t);const head=t>.84;return {w:r*(head?.9:.92),h:r*(head?.78:1.12)};};
  const parts=[loft(spine,prof,sk,48,18)];
  for(const z of [1,-1])parts.push(E(.034,.034,.034,.56,2.03,.085*z,[.95,.78,.18]),E(.018,.026,.018,.585,2.034,.1*z,d),E(.012,.012,.012,.71,1.97,.03*z,d));
  parts.push({g:new THREE.BoxGeometry(.3,.008,.12),m:M4(.58,1.905,0,0,0,-.18),c:d});
  for(let k=0;k<9;k++){const t=k/8;parts.push(K(.022-.008*t,.07-.02*t,.28-t*1.3,1.9-t*.95+(t<.3?0:-.12*t),0,tone(c,.75),0,0,.25+t*.6));}
  for(const z of [1,-1]){parts.push(taper([[.2,1.55,.17*z],[.3,1.36,.24*z],[.44,1.22,.2*z],[.53,1.14,.18*z]],.05,.03,c,10,8));
    for(let f=0;f<3;f++)parts.push(K(.011,.07,.57,1.11,(.15+.03*(f-1))*z,[.85,.82,.7],0,0,2.2));}
  if(o.skull)parts.push(E(.17,.11,.15,.52,2.08,0,[.86,.83,.74]),K(.03,.32,.68,2.22,0,[.9,.88,.8],0,0,-.9),E(.03,.03,.03,.62,2.1,.11,d),E(.03,.03,.03,.62,2.1,-.11,d));
  if(o.pole)parts.push(C(.025,.025,2.7,.46,1.35,.26,[.45,.35,.22],0,0,.15),K(.04,.25,.67,2.68,.33,[.75,.72,.65],0,0,-.15));
  if(o.armour){const s=[.82,.84,.88];parts.push(loft([[-.3,1.0,0],[0,1.1,0],[.12,1.45,0],[.2,1.66,0]],t=>({w:.27-.05*t,h:.3-.06*t}),()=>[.45,.46,.48],16,14),E(.16,.12,.14,.45,2.04,0,s),C(.3,.3,.04,.3,1.3,-.3,s,Math.PI/2,0,0,18),C(.02,.02,.9,.5,1.2,.3,s,0,0,.6));}
  return {body:body(parts),legs:[[0,1.02,.16],[0,1.02,-.16]].map(([x,y,z])=>({geo:limb(1.02,.1,c,{toes:3}),x,y,z}))};}
def('emerald',{n:'翡翠龙',walk:1,speed:1.3,group:[4,10],build(o){return folk([.08,.34,.1],{skull:o&&o.v===0,pole:o&&o.v<2,glitter:1,belly:[.36,.5,.24]});}});   // leaf-green and glittering (encyclopedia emerald)
def('baihai',{n:'白骸龙',walk:1,speed:1.4,group:[4,12],build(){return folk([.9,.9,.87]);}});
def('yinjia',{n:'银甲龙',walk:1,speed:1.3,group:[4,10],build(){return folk([.74,.76,.8],{armour:1});}});
/* 立蝎 (encyclopedia lixie): a scorpion walking upright — ten limbs, four of them legs under a level rear body, the fore-body raised
   with six free limbs (the front pair claw-like grippers), a tail curling up behind, a faintly glowing carapace */
def('lixie',{n:'立蝎',walk:1,speed:1.1,group:[5,12],build(){const c=[.42,.6,.48],d=tone(c,.7),g=[.75,.95,.8];
  const parts=[E(.55,.24,.34,-.35,.72,0,c),E(.17,.44,.21,.22,1.2,0,c,-.2),E(.14,.12,.14,.34,1.72,0,c),E(.025,.025,.025,.46,1.76,.06,[.05,.05,.05]),E(.025,.025,.025,.46,1.76,-.06,[.05,.05,.05]),
    taper([[-.85,.74,0],[-1.25,.98,0],[-1.35,1.38,0],[-1.15,1.62,0]],.12,.05,d),K(.05,.22,-1.05,1.68,0,g,0,0,-2.3)];
  for(const [y,len,fwd] of [[1.48,.62,.5],[1.32,.5,.42],[1.16,.42,.36]])for(const z of [1,-1])parts.push(taper([[.25,y,.17*z],[.25+fwd*.6,y-.12,.3*z],[.25+fwd,y-.05,.24*z]],.045,.025,d));
  for(const z of [1,-1])parts.push(K(.04,.14,.8,1.48,.24*z,g,0,0,-1.57));
  return {body:body(parts),legs:[[-.05,.72,.3],[-.05,.72,-.3],[-.6,.72,.3],[-.6,.72,-.3]].map(([x,y,z])=>({geo:legGeo(.72,.05,d,1.3),x,y,z,splay:.5*Math.sign(z)}))};}});
/* 翼龙 (encyclopedia yilong_pt): membrane wings on the forelimbs, long pointed toothless beaks, short hind legs, no scales.
   Common ones ~0.5 m span in flocks; 红冠翼龙 red-crested, ~2 m, hunting in flocks over the wasteland; 炸弹翼龙 ~7 m, alone over rock
   pillars; 原翼龙 the stout ~10 m giant of the salt flats */
function ptero(span,c,crest){const k=span/2,m=tone(c,1.2);const parts=[E(.28*k,.09*k,.1*k,0,0,0,c),E(.1*k,.07*k,.07*k,.32*k,.04*k,0,c),K(.03*k,.42*k,.6*k,.03*k,0,[.82,.76,.6],0,0,-1.57),taper([[-.25*k,0,0],[-.42*k,-.01*k,0]],.05*k,.01*k,c)];
  if(crest)parts.push(K(.05*k,.22*k,.28*k,.14*k,0,crest,0,0,.6));
  return {body:body(parts),wings:[1,-1].map(s=>({geo:wingGeo(span*.5,.36*k,m),x:.05*k,y:.03*k,z:.06*k*s,side:s}))};}
def('pteroS',{n:'翼龙',fly:[8,70],speed:7,group:[5,12],build(){return ptero(.55,[.42,.36,.3]);}});
def('pteroRed',{glide:1,n:'红冠翼龙',fly:[20,120],speed:9,group:[3,6],build(){return ptero(2,[.5,.4,.32],[.85,.15,.1]);}});
def('pteroBomb',{n:'炸弹翼龙',fly:[30,160],speed:8,group:[1,1],build(){return ptero(7,[.38,.34,.3]);}});
def('pteroGiant',{glide:1,n:'原翼龙',fly:[40,220],speed:9,sc:1,group:[1,2],build(){const b=ptero(10,[.46,.42,.36]);return b;}});
/* 阿兹特克虫 (encyclopedia aztec): eyeless black arthropods; the small caste ~10 cm in swarms, the large caste ~2 m tall and 4 m+ long with
   saw-edged jaws, small ones riding on its back; they keep the spire forest's moss */
def('aztecS',{nocturnal:1,n:'阿兹特克虫',walk:1,speed:.5,sc:.12,group:[10,22],build(){const c=[.06,.06,.07];
  return {body:body([E(.45,.22,.3,0,.32,0,c),E(.2,.16,.2,.5,.3,0,c),K(.04,.3,.82,.26,.12,c,0,0,-1.3),K(.04,.3,.82,.26,-.12,c,0,0,-1.3)]),legs:[.3,0,-.3].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.34,.035,c),x,y:.3,z:.22*s,splay:.9*s})))};}});
def('aztecL',{nocturnal:1,n:'阿兹特克虫（大型）',walk:1,speed:.9,group:[1,2],build(){const c=[.07,.07,.08],j=[.18,.16,.15];
  const parts=[E(1.9,.75,.9,0,1.25,0,c),E(.75,.6,.7,2.1,1.2,0,c)];for(const z of [1,-1]){parts.push(K(.14,1.3,3.2,1.0,.4*z,j,0,.3*z,-1.4));for(let k=0;k<5;k++)parts.push(K(.06,.25,2.8+k*.18,.85,.47*z,j,0,0,0));}
  for(let k=0;k<4;k++)parts.push(E(.2,.1,.13,-.9+k*.5,2.05,(k%2?.2:-.2),c));
  return {body:body(parts),legs:[1.2,0,-1.2].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1.3,.12,c),x,y:1.2,z:.75*s,splay:.7*s})))};}});
/* 印加 black wasps (encyclopedia inca): wingless, eyeless, ~10 cm, antennae; they do almost all the work */
def('incaWasp',{n:'黑蜂（印加）',walk:1,speed:.6,sc:.1,group:[8,18],build(){const c=[.05,.05,.05];
  return {body:body([E(.38,.2,.22,-.35,.3,0,c),E(.18,.13,.14,.12,.32,0,c),E(.16,.15,.16,.4,.36,0,c),taper([[.5,.45,.08],[.75,.75,.25],[.95,.85,.3]],.02,.01,c,6,4),taper([[.5,.45,-.08],[.75,.75,-.25],[.95,.85,-.3]],.02,.01,c,6,4)]),
    legs:[.25,.05,-.15].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.3,.025,c),x,y:.3,z:.12*s,splay:1*s})))};}});
/* 脑袋虫 (encyclopedia naodaichong): a limbless pale lump of flesh, mostly brain, creeping and rolling; and its colony's "infantry",
   ~1 m cockroach-like bodies rearing on their hind legs with barbed blade forelegs, green from afar */
def('naodai',{n:'脑袋虫',walk:1,hop:1,speed:.35,group:[1,1],build(){const c=[.86,.76,.72],v=[.7,.5,.5];
  const parts=[E(.42,.33,.36,0,.33,0,c),E(.3,.24,.27,.22,.48,0,tone(c,1.04))];for(let k=0;k<7;k++)parts.push(taper([[-.3+k*.1,.55,-.25],[-.27+k*.1,.66,0],[-.3+k*.1,.55,.25]],.018,.018,v,8,4));
  return {body:body(parts)};}});
def('naoInf',{n:'脑袋虫步兵',walk:1,speed:1.2,group:[3,6],build(){const c=[.22,.36,.16],d=tone(c,.7);
  return {body:body([E(.38,.17,.2,-.1,.62,0,c,.6),E(.14,.12,.12,.25,.98,0,c),K(.03,.55,.45,.72,.14,d,0,0,-1.9),K(.03,.55,.45,.72,-.14,d,0,0,-1.9)]),legs:[[-.05,.55,.15],[-.05,.55,-.15],[-.35,.45,.16],[-.35,.45,-.16]].map(([x,y,z])=>({geo:legGeo(y,.04,d),x,y,z,splay:.6*Math.sign(z)}))};}});
def('maoyu',{n:'毛玉',walk:1,hop:1,speed:.5,sc:.2,group:[8,20],build(o){const c=o&&o.white?[.95,.95,.93]:[.74,.6,.45];
  return {body:body([E(.22,.2,.21,0,.22,0,c),E(.13,.12,.12,.17,.3,0,c),K(.045,.12,.16,.45,.07,c,0,0,.25),K(.045,.12,.16,.45,-.07,c,0,0,.25),E(.025,.025,.025,.29,.33,.06,[.05,.04,.04]),E(.025,.025,.025,.29,.33,-.06,[.05,.04,.04]),E(.08,.08,.08,-.22,.3,0,tone(c,1.1))])};}});
/* 暴君巨蜥 (encyclopedia baojun): ~4 m tall, ~12 m long, dark-red scale armour all over, thick hind legs, forelimbs ending in big
   sharp claws, a huge mouth full of teeth */
def('tyrant',{n:'暴君巨蜥',walk:1,speed:1.8,group:[1,1],build(){const c=[.4,.11,.09],b=[.58,.32,.24],d=[.04,.03,.03],tooth=[.92,.88,.76];
  const sp=[[-7.4,2.5,0],[-5,3.2,0],[-2.6,3.85,0],[0,4.15,0],[1.6,4.2,0],[2.7,4.55,0],[3.5,4.95,0],[4.4,5.0,0],[5.3,4.75,0]];
  const k=[[0,.08],[.2,.55],[.38,1.15],[.48,1.35],[.6,1.2],[.7,.8],[.78,.82],[.9,.72],[1,.42]];
  const parts=[loft(sp,t=>({w:keyR(k,t)*(t>.74?.78:.9),h:keyR(k,t)*(t>.74?1.12:1.1)}),skin(c,b,{spots:2}),56,20)];
  // the lower jaw hanging a little open, teeth along both jaws
  parts.push(loft([[3.6,4.45,0],[4.4,4.32,0],[5.15,4.22,0]],t=>({w:.62-.32*t,h:.28-.14*t}),skin(tone(c,.9),b),16,14));
  for(const z of [1,-1])for(let i=0;i<9;i++){const x=3.9+i*.15,w=.55-.04*i;parts.push(K(.045,.24,x,4.55,w*z*.92,tooth,Math.PI,0,0,5),K(.04,.2,x+.05,4.5,w*z*.8,tooth,0,0,0,5));}
  for(const z of [1,-1])parts.push(E(.13,.11,.1,4.25,5.38,.5*z,[.95,.72,.18]),E(.06,.1,.05,4.3,5.39,.56*z,d),E(.24,.08,.14,4.15,5.55,.5*z,tone(c,.75)));   // eyes under heavy brows
  for(let i=0;i<18;i++){const t=i/17,x=-6+t*9.6,y=3.15+Math.sin(t*2.6)*1.2+(t>.6?.2:0);parts.push(K(.16+.1*Math.sin(t*3),.35,x,y+.95*keyR(k,.1+t*.65)/1.2,0,tone(c,.7),0,0,-.3,5));}   // armour ridge
  for(const z of [1,-1]){parts.push(taper([[2.1,3.9,.85*z],[2.6,3.35,1.05*z],[3.0,3.0,.9*z]],.22,.15,c,8,8));for(let f=0;f<3;f++)parts.push(K(.06,.4,3.18,2.88,(.82+.1*(f-1))*z,tooth,0,0,2.3,5));}
  return {body:body(parts),legs:[[.2,3.7,.95],[.2,3.7,-.95]].map(([x,y,z])=>({geo:limb(y,.62,c,{toes:3}),x,y,z}))};}});
def('wyvern',{glide:1,n:'飞龙',fly:[50,180],speed:10,sc:1.3,group:[1,1],build(){const c=[.36,.36,.34],m=[.44,.42,.4];
  return {body:body([E(1.7,.45,.5,0,0,0,c),taper([[1.4,.1,0],[2.3,.4,0],[2.8,.45,0]],.32,.22,c),E(.55,.28,.26,3.15,.42,0,c),K(.12,.6,3.75,.42,0,m,0,0,-1.57),taper([[-1.5,0,0],[-3.5,-.2,0],[-5.5,-.15,0]],.35,.04,c)]),
    legs:[[1,-.2,.35],[1,-.2,-.35],[-1,-.2,.35],[-1,-.2,-.35]].map(([x,y,z])=>({geo:legGeo(.9,.15,c,1.4),x,y,z,splay:.3})),
    wings:[1,-1].map(s=>({geo:wingGeo(5.2,3.2,m),x:.4,y:.25,z:.35*s,side:s}))};}});
def('giantJelly',{n:'海空水母',fly:[60,160],speed:1.2,group:[1,1],swim:1,build(){const c=[.1,.17,.42];const parts=[{g:new THREE.SphereGeometry(22,24,14,0,6.283,0,1.45),m:null,c},{g:new THREE.SphereGeometry(16,20,10,0,6.283,0,1.35),m:M4(0,-3,0),c:[.16,.26,.55]}];
  for(let k=0;k<16;k++){const a=k*.39;parts.push(taper([[Math.cos(a)*13,-2,Math.sin(a)*13],[Math.cos(a)*12,-18,Math.sin(a)*12],[Math.cos(a+.3)*10,-42,Math.sin(a+.3)*10]],.5,.12,[.45,.55,.85],10,5));}
  return {body:body(parts)};}});
// ---- 北之大陆 ----
def('dragonfly',{n:'巨脉蜻蜓',fly:[1.5,9],speed:4.5,group:[5,10],dart:1,build(){const c=[.18,.32,.22];
  return {body:body([taper([[-.75,0,0],[0,0,0],[.25,0,0]],.035,.07,c),E(.1,.08,.09,.3,0,0,c),E(.06,.06,.06,.36,.03,.06,[.3,.6,.8]),E(.06,.06,.06,.36,.03,-.06,[.3,.6,.8])]),
    wings:[[.18,.42],[.18,-.42],[.02,.4],[.02,-.4]].map(([x,z],i)=>({geo:paint(new THREE.PlaneGeometry(.2,.95).rotateX(-1.5708).translate(0,0,Math.sign(z)*.48),[.5,.54,.58]),x,y:.04,z:0,side:Math.sign(z),fast:1}))};}});
def('landshark',{n:'陆行鲨',walk:1,speed:1.4,group:[1,3],build(){const c=[.42,.47,.5],b=[.75,.77,.78];
  return {body:body([taper([[-1.2,.5,0],[-.2,.62,0],[.7,.6,0],[1.1,.5,0]],.25,.18,c,16,12),E(1.05,.35,.3,0,.55,0,c),E(.8,.18,.25,.1,.32,0,b),K(.2,.5,.1,1.05,0,c,0,0,-.3,4),
    {g:new THREE.PlaneGeometry(.6,.7),m:M4(-1.35,.6,0,0,0,.4),c},E(.04,.04,.04,.95,.62,.2,[.05,.05,.05]),E(.04,.04,.04,.95,.62,-.2,[.05,.05,.05])]),
    legs:[[.45,.4,.32],[.45,.4,-.32]].map(([x,y,z])=>({geo:body([{g:new THREE.PlaneGeometry(.55,.32),m:M4(.05,-.14,0,1.5708,0,0),c}]),x,y,z,fin:1}))};}});
def('beetle',{n:'鳞甲虫',walk:1,speed:.7,group:[1,3],build(){const c=[.3,.33,.24],d=tone(c,.7);const parts=[E(2,.95,1.3,0,1.3,0,c),E(.6,.5,.6,2.05,1.1,0,d),K(.25,.7,2.6,.85,0,[.35,.33,.25],0,0,-2.1)];
  for(let k=0;k<6;k++)parts.push({g:new THREE.SphereGeometry(1,16,8,0,6.283,0,1.2),m:new THREE.Matrix4().compose(new THREE.Vector3(1.2-k*.5,1.55,0),new THREE.Quaternion(),new THREE.Vector3(.5,.5,1.25)),c:k%2?c:tone(c,1.15)});
  return {body:body(parts),legs:[1.1,0,-1.1].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1.3,.1,d),x,y:1,z:1.1*s,splay:.7*s})))};}});
def('scorpion',{n:'沙漠蝎',walk:1,speed:1.1,group:[1,2],build(){const c=[.55,.42,.24],d=tone(c,.75);const parts=[E(1.1,.4,.75,0,.7,0,c),E(.5,.32,.55,1.1,.7,0,c)];
  for(let k=0;k<5;k++)parts.push(E(.32-k*.03,.26-k*.02,.3-k*.03,-1-k*.45,.75+k*k*.06,0,c));
  for(const s of [1,-1])parts.push(C(.12,.1,1.2,1.9,.72,.7*s,d,0,0,1.57),E(.42,.2,.26,2.7,.72,.75*s,c));
  return {body:body(parts),legs:[.6,.2,-.2,-.6].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.9,.06,d),x,y:.65,z:.6*s,splay:.9*s})))};}});
def('lizard',{n:'晶鳞蜥蜴',walk:1,speed:1.6,group:[1,2],build(){const c=[.36,.5,.48],k=[.65,.9,.95];const parts=[E(1.1,.35,.42,0,.6,0,c),E(.45,.25,.28,1.3,.66,0,c),taper([[-1,.58,0],[-2,.45,0],[-3,.3,0]],.32,.04,c)];
  for(let i=0;i<9;i++)parts.push(K(.08,.35-i*.02,.9-i*.35,.95-i*.02,0,k,0,0,(i%2?.25:-.25)));
  return {body:body(parts),legs:[[.7,.55,.4],[.7,.55,-.4],[-.6,.55,.4],[-.6,.55,-.4]].map(([x,y,z])=>({geo:legGeo(.55,.09,c),x,y,z,splay:.6*Math.sign(z)}))};}});
def('roach',{n:'黑角巨蠊',walk:1,speed:1.3,group:[1,2],build(){const c=[.07,.06,.06],h=[.2,.15,.12];
  return {body:body([E(2.4,.6,1.45,0,1.1,0,c),E(.7,.4,.9,2.3,1,0,c),taper([[2.8,1.1,.3],[3.8,1.6,1],[4.8,1.5,1.8]],.05,.02,h,8,4),taper([[2.8,1.1,-.3],[3.8,1.6,-1],[4.8,1.5,-1.8]],.05,.02,h,8,4)]),
    legs:[1.3,0,-1.3].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1.5,.09,h),x,y:.95,z:1.2*s,splay:.8*s})))};}});
// ---- 东之大陆 ----
def('jiangguai',{n:'僵怪',walk:1,speed:.9,group:[1,2],build(){const c=[.62,.66,.6];
  return {body:body([E(.95,1.6,.8,0,4.4,0,c),E(.7,.85,.65,0,6.3,0,c),C(.22,.15,2.6,0,4.4,1.05,c,0,0,0),C(.22,.15,2.6,0,4.4,-1.05,c,0,0,0)]),
    legs:[[0,3,.45],[0,3,-.45]].map(([x,y,z])=>({geo:legGeo(3,.32,c,2.4),x,y,z}))};}});
// ---- 到处都有 ----
def('jelly',{n:'空水母',fly:[3,25],speed:.6,group:[1,3],swim:1,build(){const c=[.66,.78,.95];const parts=[{g:new THREE.SphereGeometry(1.1,16,10,0,6.283,0,1.6),m:null,c}];
  for(let k=0;k<8;k++){const a=k*.785;parts.push(taper([[Math.cos(a)*.6,0,Math.sin(a)*.6],[Math.cos(a)*.55,-1.5,Math.sin(a)*.55],[Math.cos(a+.4)*.4,-3.2,Math.sin(a+.4)*.4]],.04,.01,[.6,.7,.9],8,4));}
  return {body:body(parts)};}});
def('worm',{n:'迷雾蠕虫',walk:1,burrow:1,speed:2.4,group:[3,3],build(){const c=[.38,.31,.26];return {seg:body([E(2.2,2.1,2.1,0,0,0,c)]),head:body([E(2.3,2.2,2.2,0,0,0,c),...Array.from({length:10},(_,k)=>K(.25,1.4,1.9,Math.cos(k*.63)*1.4,Math.sin(k*.63)*1.4,[.92,.86,.7],0,0,-1.57,5))])};}});
def('moths',{nocturnal:1,n:'记忆蛾',swarm:'glow',fly:[1,5],speed:.8,group:[1,1]});
def('dust',{n:'尘魔',swarm:'dust',fly:[0,0],speed:2.5,group:[1,1]});
// ---- 更多物种（体型按原著描述） ----
def('deepbus',{n:'深沙巴士',walk:1,speed:1.6,group:[1,1],build(){const c=[.12,.11,.11],d=tone(c,.75);const parts=[E(13.5,1.4,4.2,0,1.6,0,c),E(11,1,3.4,0,2.4,0,tone(c,1.25))];
  for(let k=0;k<6;k++)parts.push(E(.32,.32,.32,13.1-(k%3)*.5,2.5+(k>2?.2:0)*0,(k<3?1:-1)*(.8+(k%3)*.6),[.55,.6,.62]));
  for(let k=0;k<9;k++)parts.push({g:new THREE.TorusGeometry(1,.12,6,24,Math.PI),m:new THREE.Matrix4().compose(new THREE.Vector3(10-k*2.5,1.6,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,1.5708,0)),new THREE.Vector3(4.1-Math.abs(k-4)*.2,2.4,1)),c:d});
  const coil=[];for(let i=0;i<=24;i++){const t=i/24;coil.push([-13-t*6,1.6+Math.sin(t*12.6)*1.1,Math.cos(t*12.6)*1.1]);}parts.push(taper(coil,.8,.25,c,48,8));
  return {body:body(parts),legs:Array.from({length:10},(_,i)=>[1,-1].map(s=>({geo:legGeo(1.8,.22,d),x:10-i*2.2,y:1.4,z:3.6*s,splay:.6*s}))).flat()};}});
def('silverbeetle',{n:'银甲虫',walk:1,speed:.9,group:[4,8],build(){const c=[.8,.82,.86],d=[.25,.25,.28];
  return {body:body([E(.32,.15,.2,0,.2,0,c),E(.1,.08,.1,.33,.18,0,d),K(.015,.25,.5,.25,.06,d,0,0,-1.1,4),K(.015,.25,.5,.25,-.06,d,0,0,-1.1,4)]),
    legs:[.12,0,-.12].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.22,.015,d),x,y:.18,z:.14*s,splay:.8*s})))};}});
def('redspider',{n:'红蛛',fly:[1,4],speed:3,group:[5,10],dart:1,build(){const c=[.78,.13,.07];const parts=[E(.12,.09,.11,0,0,0,c),E(.18,.13,.16,-.22,0,0,tone(c,.8))];
  for(let k=0;k<4;k++)for(const s of [1,-1])parts.push(taper([[0,0,0],[.1-k*.05,.12,.22*s],[.18-k*.12,-.1,.34*s]],.015,.008,tone(c,.6),6,4));
  return {body:body(parts),wings:[1,-1].map(s=>({geo:paint(new THREE.PlaneGeometry(.18,.35).rotateX(-1.5708).translate(0,0,s*.18),[.3,.12,.09]),x:-.05,y:.08,z:0,side:s,fast:1}))};}});
/* 大鸵龙 (encyclopedia dachuolong): a big ostrich-like running dinosaur ridden by the 白骸龙 cavalry; long neck, small head, beak */
def('dachuolong',{n:'大鸵龙',walk:1,speed:2.4,group:[2,5],build(){const c=[.56,.48,.34],b=[.76,.7,.55];
  const sp=[[-2.8,1.75,0],[-1.6,1.9,0],[-.5,2.0,0],[.4,2.05,0],[1.0,2.4,0],[1.3,3.0,0],[1.45,3.45,0],[1.7,3.52,0],[2.0,3.42,0]];
  const k=[[0,.05],[.2,.3],[.35,.55],[.45,.58],[.55,.3],[.68,.17],[.8,.16],[.9,.19],[1,.05]];
  const parts=[loft(sp,t=>({w:keyR(k,t)*.86,h:keyR(k,t)*1.1}),skin(c,b,{stripes:6}),48,16),K(.07,.3,2.05,3.38,0,[.75,.68,.5],0,0,-1.75)];
  for(const z of [1,-1])parts.push(E(.045,.045,.045,1.78,3.6,.13*z,[.05,.05,.05]));
  return {body:body(parts),legs:[[.1,1.8,.3],[.1,1.8,-.3]].map(([x,y,z])=>({geo:limb(y,.18,c,{toes:3}),x,y,z}))};}});
def('jianjia',{n:'坚甲龙',walk:1,speed:.6,group:[1,3],build(){const c=[.45,.42,.33],k=[.62,.58,.46];const parts=[E(2.6,1.1,1.65,0,1.55,0,c),E(.6,.45,.5,2.7,1.2,0,c),taper([[-2.4,1.4,0],[-3.6,1.1,0],[-4.6,.9,0]],.45,.18,c),E(.55,.4,.55,-4.8,.9,0,k)];
  for(let i=0;i<16;i++){const a=i*2.4,r=.35+(i%4)*.2;parts.push(K(.18,.45,Math.cos(a)*2.1*r,1.55+Math.sqrt(Math.max(0,1-r*r))*1.05,Math.sin(a)*1.4*r,k,Math.sin(a)*.5,0,-Math.cos(a)*.5,6));}
  return {body:body(parts),legs:[[1.6,1.1,1.05],[1.6,1.1,-1.05],[-1.5,1.1,1.05],[-1.5,1.1,-1.05]].map(([x,y,z])=>({geo:legGeo(1.1,.32,c,1.5),x,y,z}))};}});
def('jingzhui',{n:'晶锥陆龟',walk:1,speed:.6,sc:6.2,group:[1,1],build(){const c=[.4,.38,.3],s=[.35,.42,.32],k=[.62,.88,.95];
  const parts=[{g:new THREE.SphereGeometry(1,22,12,0,6.283,0,1.6),m:new THREE.Matrix4().compose(new THREE.Vector3(0,.6,0),new THREE.Quaternion(),new THREE.Vector3(1.6,1,1.25)),c:s},E(1.55,.25,1.2,0,.62,0,c),E(.32,.26,.28,1.75,.75,0,c),E(.05,.05,.05,2,.85,.15,[.05,.05,.05]),E(.05,.05,.05,2,.85,-.15,[.05,.05,.05])];
  for(let i=0;i<9;i++){const a=i*2.4,r=i?.35+(i%3)*.22:0;parts.push(K(.07,.33+(i===0?.12:(3-i%3)*.03),Math.cos(a)*r*1.4,1.9+(i===0?.4:0),Math.sin(a)*r,k,Math.sin(a)*r*.6,0,-Math.cos(a)*r*.6,6));}
  return {body:body(parts),legs:[[1,.55,.85],[1,.55,-.85],[-1,.55,.85],[-1,.55,-.85]].map(([x,y,z])=>({geo:legGeo(.55,.18,c,1.6),x,y,z}))};}});
def('centipede',{n:'肋骨蜈蚣',walk:1,speed:1.8,group:[1,1],build(){const c=[.84,.82,.74],d=[.3,.27,.24];const parts=[];
  for(let k=0;k<14;k++){const x=1.8-k*.3;parts.push(E(.17,.1,.16,x,.28,0,d),{g:new THREE.TorusGeometry(1,.035,5,14,Math.PI),m:new THREE.Matrix4().compose(new THREE.Vector3(x,.22,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,1.5708,0)),new THREE.Vector3(.24,.16,1)),c});}
  parts.push(E(.2,.12,.18,2.05,.3,0,c),taper([[2.2,.3,.08],[2.6,.45,.25],[2.9,.4,.35]],.02,.01,d,6,4),taper([[2.2,.3,-.08],[2.6,.45,-.25],[2.9,.4,-.35]],.02,.01,d,6,4));
  return {body:body(parts),legs:Array.from({length:7},(_,i)=>[1,-1].map(s=>({geo:legGeo(.32,.02,d),x:1.7-i*.55,y:.25,z:.16*s,splay:1.1*s}))).flat()};}});
def('icespider',{n:'冰蛛',walk:1,speed:1.4,group:[1,2],build(){const c=[.5,.75,.9],d=[.25,.38,.5];const parts=[E(.8,.55,.7,-.6,1.4,0,c),E(.5,.38,.45,.35,1.3,0,d)];
  for(let i=0;i<6;i++)parts.push(K(.08,.35,-.6+Math.cos(i)*.4,1.95,Math.sin(i)*.4,[.75,.95,1],0,0,0,5));
  parts.push(E(.06,.06,.06,.82,1.42,.12,[.9,.2,.2]),E(.06,.06,.06,.82,1.42,-.12,[.9,.2,.2]));
  return {body:body(parts),legs:[.45,.2,-.05,-.3].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1.6,.07,d),x,y:1.3,z:.35*s,splay:1.05*s})))};}});
def('zaonao',{n:'造脑怪',walk:1,speed:.5,group:[1,1],build(){const c=[.85,.72,.25];
  return {body:body([E(1.5,.9,1.1,0,1.3,0,c),E(.6,.55,.6,1.5,1.4,0,tone(c,.9)),E(.08,.08,.08,2.05,1.55,.22,[.1,.08,.05]),E(.08,.08,.08,2.05,1.55,-.22,[.1,.08,.05])]),
    legs:[.9,.3,-.3,-.9].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1,.13,tone(c,.8)),x,y:.95,z:.85*s,splay:.5*s})))};}});
def('yalong',{glide:1,n:'亚龙',fly:[80,240],speed:13,sc:.6,group:[1,2],build(){const c=[.08,.08,.09],m=[.15,.14,.14];
  return {body:body([E(3,.8,.85,0,0,0,c),taper([[2.5,.2,0],[4.2,.9,0],[5.2,1,0]],.55,.38,c),E(.95,.5,.45,5.8,.95,0,c),K(.2,1,6.8,.95,0,m,0,0,-1.57),taper([[-2.7,0,0],[-6,-.4,0],[-9.5,-.3,0]],.6,.06,c)]),
    wings:[1,-1].map(s=>({geo:wingGeo(9.5,5.5,m),x:.7,y:.45,z:.6*s,side:s}))};}});
def('guanglong',{glide:1,n:'光龙',fly:[280,520],speed:16,group:[1,1],glow:1,build(){const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([-t*42,Math.sin(t*9)*2.5,Math.cos(t*7)*2]);}
  const g=taper(pts.map(([x,y,z])=>[x*101/42,y*2,z*2]),5,.3,[1,1,1],80,12).g;paint(g,[1.4,2.4,2.8]);return {body:g};}});   // 101 m long, ~10 m thick (encyclopedia guanglong)
def('gunlei',{n:'滚雷',swarm:'orb',fly:[180,420],speed:1.5,group:[1,1]});
def('baoxiao',{n:'爆哮虫',walk:1,speed:.4,group:[1,2],build(){const c=[.55,.45,.38];
  return {body:body([E(2,1.4,1.6,0,1.5,0,c),E(1,.9,1,1.8,1.4,0,tone(c,1.1)),E(.45,.35,.5,2.6,1.3,0,[.35,.12,.12]),E(.1,.1,.1,2.4,2,.45,[.05,.05,.05]),E(.1,.1,.1,2.4,2,-.45,[.05,.05,.05])]),
    legs:[1,0,-1].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.7,.2,tone(c,.8)),x,y:.6,z:1.2*s,splay:.4*s})))};}});
// ---- tier 2 (encyclopedia anying, pensha, zhenjunguai, daqi, dianzhuru, feilixie) ----
/* 暗影怪: a ~2.3 m reptile-shaped 印加 caste in black chitin, long legs, blade claws, a big head, a tail that rears up to sting; out at night */
def('anying',{nocturnal:1,n:'暗影怪',walk:1,speed:2.2,group:[1,3],build(){const c=[.05,.05,.06],h=[.12,.11,.12];
  const parts=[E(.75,.28,.3,0,.85,0,c),E(.36,.24,.26,.85,.95,0,c),taper([[-.6,.85,0],[-1.3,1.1,0],[-1.6,1.7,0],[-1.2,2.1,0]],.18,.03,c,12,6),K(.06,.35,-1.05,2.2,0,h,0,0,-2.2)];
  for(const s of [1,-1])parts.push(K(.05,.6,1.0,.55,.32*s,h,0,0,-1.9));
  return {body:body(parts),legs:[[.45,.8,.3],[.45,.8,-.3],[-.45,.8,.3],[-.45,.8,-.3]].map(([x,y,z])=>({geo:legGeo(.8,.07,c),x,y,z,splay:.5*Math.sign(z)}))};}});
/* 喷沙虫: a 20 m beetle the colour of desert sand, hard wing-cases, a huge abdomen that balloons to blast sand, two antennae */
def('pensha',{n:'喷沙虫',walk:1,speed:.9,group:[3,6],build(){const c=[.72,.62,.42],d=tone(c,.8);
  const parts=[E(5,2.6,3.6,0,4,0,c),E(6.5,4.6,5.2,-8.5,4.8,0,tone(c,1.05)),E(2.2,1.6,2.2,6.2,3.8,0,d),E(5.2,1,3.8,.3,6.2,0,tone(c,.9))];
  for(const s of [1,-1])parts.push(taper([[7.6,4.6,.8*s],[10,7,2.4*s],[12,8,3.2*s]],.12,.05,d,8,5));
  return {body:body(parts),legs:[3,0,-3].flatMap(x=>[1,-1].map(s=>({geo:legGeo(4.4,.35,d),x,y:3.6,z:3*s,splay:.8*s})))};}});
/* 真菌怪: an animal rebuilt by the plague fungus — purple mycelium for skin, swollen sacs on the back, no mouth, two pairs of yellow eyes */
function zhenjun(k){const c=[.36,.16,.42],sac=[.5,.26,.55],eye=[1.5,1.3,.2];const parts=[E(3*k,1.3*k,1.4*k,0,2.4*k,0,c),E(1*k,.8*k,.8*k,3.2*k,2.6*k,0,c)];
  for(let i=0;i<9;i++){const a=i*2.4;parts.push(E(.55*k,.45*k,.55*k,(-2+i*.5)*k,(3.4+Math.sin(a)*.3)*k,Math.cos(a)*.8*k,sac));}
  for(const s of [1,-1])for(const y of [2.85,2.55])parts.push(E(.12*k,.1*k,.1*k,4.05*k,y*k,.35*s*k,eye));
  return {body:body(parts),legs:[[1.8,2,1],[1.8,2,-1],[-1.8,2,1],[-1.8,2,-1]].map(([x,y,z])=>({geo:legGeo(1.9*k,.42*k,c),x:x*k,y:y*k,z:z*k,splay:.3*Math.sign(z)}))};}
def('zhenjun',{n:'真菌怪',walk:1,speed:.9,group:[1,3],build(){return zhenjun(1);}});
def('zhenjunS',{n:'真菌怪（小）',walk:1,speed:1.3,group:[3,7],build(){return zhenjun(.28);}});
/* 大气史莱姆: a transparent, ray-shaped cloud creature with a 5 m span, one eye-like organ in front; drifts in flocks in the east's skies */
def('slime',{n:'大气史莱姆',fly:[60,320],speed:2,group:[3,8],swim:1,build(){const c=[2.3,2.45,2.6];const g=new THREE.SphereGeometry(1,18,8);g.scale(2.6,.32,1.6);
  const parts=[{g,m:null,c},E(.18,.12,.12,1.9,.05,0,[.5,.6,.75]),taper([[-1.6,0,0],[-3.4,.1,0]],.18,.02,c,6,5)];return {body:body(parts)};}});
/* 电侏儒: a 30 cm flat-faced biter, black like 亚龙 scales, wandering among the 翡翠龙 */
def('dianzhuru',{n:'电侏儒',walk:1,speed:1.1,sc:.3,group:[4,12],build(){const c=[.06,.07,.07];
  const parts=[E(.5,.3,.3,0,.55,0,c),E(.3,.27,.3,.55,.65,0,c),E(.05,.05,.05,.84,.67,.1,[1.4,1.3,.5]),E(.05,.05,.05,.84,.67,-.1,[1.4,1.3,.5]),K(.07,.35,-.6,.55,0,c,0,0,1.8)];
  return {body:body(parts),legs:[[.3,.5,.22],[.3,.5,-.22],[-.3,.5,.22],[-.3,.5,-.22]].map(([x,y,z])=>({geo:legGeo(.45,.07,c),x,y,z,splay:.4*Math.sign(z)}))};}});
/* 飞立蝎: a smaller black 立蝎 whose long thin limbs carry a pterosaur-like membrane; a hooked tail sting; flies in swarms */
def('feilixie',{n:'飞立蝎',fly:[60,170],speed:6,group:[8,18],build(){const c=[.07,.06,.06];
  const parts=[E(.6,.18,.2,0,0,0,c),E(.22,.16,.18,.6,.05,0,c),taper([[-.5,0,0],[-1.1,.15,0],[-1.3,.45,0]],.08,.02,c,8,5),K(.03,.2,-1.25,.6,0,[.3,.1,.08],0,0,-2.4)];
  return {body:body(parts),wings:[1,-1].map(s=>({geo:wingGeo(1.8,.9,[.12,.1,.1]),x:.1,y:.02,z:.12*s,side:s}))};}});
// ---- the underworld (encyclopedia baojia, liedizhe, lianyu, hongzhu) ----
/* 爆甲: a 2–3 m beetle whose red abdomen glows hot; it mixes its fluids and explodes */
def('baojia',{n:'爆甲',walk:1,speed:1,group:[3,8],build(){const c=[.12,.08,.07],r=[1.7,.35,.1];
  const parts=[E(.7,.45,.6,.6,.9,0,c),E(1.15,.7,.85,-.75,1,0,r),E(.35,.3,.35,1.35,.85,0,c),E(1.2,.25,.9,-.5,1.55,0,tone(c,1.3))];
  return {body:body(parts),legs:[.8,.3,-.2].flatMap(x=>[1,-1].map(s=>({geo:legGeo(1,.08,c),x,y:.85,z:.55*s,splay:.8*s})))};}});
/* 裂地者: the swarm's ultimate caste, 30–40 m long, glossy armour, serrated jaws 6–9 m long */
def('liedizhe',{n:'裂地者',walk:1,speed:2.4,group:[1,1],build(){const c=[.13,.11,.1],j=[.2,.17,.14];
  const parts=[E(9,3.6,5.2,0,7,0,c),E(8,3.2,4.8,-14,7.2,0,tone(c,.9)),E(4.2,3,4,11.5,7.4,0,c)];
  for(const s of [1,-1]){parts.push(taper([[14,7,2*s],[18,6.6,4.2*s],[21.5,6.4,2.2*s]],.9,.15,j,10,6));for(let k=0;k<5;k++)parts.push(K(.3,1.4,15.5+k*1.2,6.3,(3+k*.2)*s*.9,j,Math.PI,0,0));}
  return {body:body(parts),legs:[6,0,-6,-12].flatMap(x=>[1,-1].map(s=>({geo:legGeo(7,.7,c),x,y:6.5,z:4.6*s,splay:.7*s})))};}});
/* 炼狱蠕虫: the largest caste, ~30 m standing above ground, a head over 10 m wide, rock-like segmented armour, ten red eyes */
def('lianyu',{n:'炼狱蠕虫',walk:1,speed:.35,group:[1,1],build(){const c=[.3,.27,.24];const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push([-14+t*10+Math.sin(t*3)*3,t*t*26+.5,0]);}
  const parts=[taper(pts,4.5,5.5,c,30,12)];for(let i=0;i<10;i++){const a=(i-4.5)*.28;parts.push(E(.45,.35,.35,-3.2+Math.cos(a)*5.2,27.5+Math.sin(i*1.7)*.8,Math.sin(a)*5.2,[1.8,.25,.1]));}
  return {body:body(parts)};}});
/* 熔岩蜘蛛: a 10 m body on legs spanning more than 20 m, lava-bright, on the underworld's rock flats and the lava-rift walls */
def('lavaSpider',{n:'熔岩蜘蛛',walk:1,speed:1.2,group:[1,2],build(){const c=[1.25,.38,.1],d=[.35,.12,.06];
  const parts=[E(3.2,2,3,0,5.5,0,c),E(4.6,3.2,4,-6.6,6.2,0,tone(c,.85)),E(1.4,1.1,1.4,3.6,5.2,0,d)];
  return {body:body(parts),legs:[2.2,.8,-.8,-2.2].flatMap(x=>[1,-1].map(s=>({geo:legGeo(7.5,.4,d),x,y:5.4,z:2.4*s,splay:1.15*s})))};}});
return { SPEC, geoCache };
}
