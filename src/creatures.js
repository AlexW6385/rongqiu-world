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
const body=parts=>shadeGeo(merge(parts.map(p=>({...p,c:[p.c[0]*.55,p.c[1]*.55,p.c[2]*.55]})),false).solid);
/* a leg hangs from its hip (origin) straight down; thigh and shin taper; foot at the bottom */
function legGeo(len,r,c,foot=1.4){return body([C(r,r*.8,len*.52,0,-len*.26,0,c),C(r*.8,r*.55,len*.5,0,-len*.73,0,c),E(r*foot,r*.5,r*foot*.9,r*.25,-len,0,c)]);}
function wingGeo(span,chord,c){const g=new THREE.BufferGeometry();const v=[0,0,0, chord*.1,0,span*.15, -chord*.15,0,span, -chord*.7,0,span*.75, -chord*.95,0,span*.35, -chord*.55,0,0];
  const idx=[0,1,5,1,4,5,1,2,3,1,3,4];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();return paint(g.toNonIndexed(),[c[0]*.55,c[1]*.55,c[2]*.55]);}
const SPEC={};const geoCache={};
function def(key,o){SPEC[key]=o;}
const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k];
// ---- 西之大陆 ----
def('ceratops',{n:'角龙',walk:1,speed:1.2,group:[10,20],build(){const c=[.43,.45,.32],b=tone(c,1.25),d=[.08,.07,.06];
  return {body:body([E(1.55,.85,.8,0,1.45,0,c),E(1.2,.6,.65,-.1,1.15,0,b),E(.55,.48,.45,1.25,1.5,0,c,-.3),E(.58,.44,.42,1.85,1.42,0,c,-.15),K(.2,.45,2.35,1.35,0,[.75,.7,.6],0,0,-1.57),
    {g:new THREE.CylinderGeometry(1,1,.1,20),m:new THREE.Matrix4().compose(new THREE.Vector3(1.5,1.85,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,1.25)),new THREE.Vector3(.95,1,1.05)),c:[.62,.4,.28]},
    K(.1,1.15,2.25,1.95,0,[.9,.86,.75],0,0,-1.05),E(.07,.07,.07,2.02,1.6,.3,d),E(.07,.07,.07,2.02,1.6,-.3,d),taper([[-1.4,1.4,0],[-2.3,1.15,0],[-3.2,.85,0]],.42,.05,c)]),
    legs:[[1,1.15,.5],[1,1.15,-.5],[-1,1.15,.52],[-1,1.15,-.52]].map(([x,y,z])=>({geo:legGeo(1.15,.2,c),x,y,z}))};}});
def('gulong',{n:'骸龙',walk:1,sc:.62,speed:1.5,group:[8,16],build(){const c=[.5,.5,.48],w=[.86,.86,.82];const parts=[E(.85,.28,.32,0,.6,0,c),E(.32,.18,.2,1.05,.72,0,c),taper([[.6,.62,0],[.85,.7,0],[1,.72,0]],.18,.15,c),taper([[-.75,.58,0],[-1.6,.45,0],[-2.4,.3,0]],.22,.03,c)];
  for(let k=0;k<6;k++)parts.push({g:new THREE.TorusGeometry(1,.035,5,16),m:new THREE.Matrix4().compose(new THREE.Vector3(.55-k*.24,.6,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,1.5708,0)),new THREE.Vector3(.33-k*.012,.3-k*.01,1)),c:w});
  parts.push(E(.035,.035,.035,1.28,.78,.11,[.9,.8,.2]),E(.035,.035,.035,1.28,.78,-.11,[.9,.8,.2]));
  return {body:body(parts).translate(0,1,0),legs:[[.55,1.55,.28],[.55,1.55,-.28],[-.5,1.55,.28],[-.5,1.55,-.28]].map(([x,y,z])=>({geo:legGeo(1.55,.08,c),x,y,z,splay:.35}))};}});
/* the dragon peoples (encyclopedia emerald, baihai, yinjia): 骸龙 offshoots, upright bipeds about 1.8–2 m tall with a long tail;
   翡翠龙 leaf-green and glittering, some with a horned-dinosaur skull worn as a helmet and a long pole; 白骸龙 pure white and thin;
   银甲龙 metallic silver scales under silver armour, helmet hiding the face, shield and blade */
function folk(c,o={}){const b=tone(c,1.15),d=[.05,.04,.04];
  const parts=[E(.26,.42,.24,.05,1.38,0,c,-.35),E(.21,.3,.19,.12,1.2,0,b,-.3),taper([[.14,1.68,0],[.24,1.84,0],[.33,1.93,0]],.1,.075,c),
    E(.2,.13,.14,.42,1.96,0,c),E(.15,.08,.1,.64,1.9,0,c),E(.03,.03,.03,.5,2.01,.1,[.9,.75,.2]),E(.03,.03,.03,.5,2.01,-.1,[.9,.75,.2]),
    taper([[-.12,1.05,0],[-.7,.82,0],[-1.3,.48,0],[-1.75,.3,0]],.16,.02,c)];
  for(const z of [1,-1])parts.push(taper([[.12,1.58,.2*z],[.28,1.32,.28*z],[.42,1.16,.22*z]],.055,.035,c));
  if(o.skull)parts.push(E(.25,.15,.21,.42,2.08,0,[.86,.83,.74]),K(.04,.45,.62,2.3,0,[.9,.88,.8],0,0,-.9));
  if(o.pole)parts.push(C(.025,.025,2.7,.46,1.35,.26,[.45,.35,.22],0,0,.15));
  if(o.armour){const s=[.82,.84,.88];parts.push(E(.29,.38,.27,.06,1.42,0,s,-.35),E(.23,.17,.18,.4,2.0,0,s),C(.32,.32,.05,.3,1.25,-.36,s,Math.PI/2,0,0,18),C(.02,.02,.9,.5,1.2,.3,s,0,0,.6));}
  return {body:body(parts),legs:[[0,1.02,.16],[0,1.02,-.16]].map(([x,y,z])=>({geo:legGeo(1.02,.075,c,1.6),x,y,z}))};}
def('emerald',{n:'翡翠龙',walk:1,speed:1.3,group:[4,10],build(o){return folk([.17,.5,.22],{skull:o&&o.v===0,pole:o&&o.v<2});}});
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
def('tyrant',{n:'暴君巨蜥',walk:1,speed:1.8,group:[1,1],build(){const c=[.44,.13,.1],b=[.6,.35,.28];
  return {body:body([E(2.6,1.35,1.15,0,3.8,0,c,.12),E(1.8,.9,.9,.3,3.3,0,b,.12),taper([[2,4.2,0],[3,4.7,0],[3.6,4.8,0]],.9,.7,c),E(1.35,.75,.7,4.2,4.75,0,c,-.1),E(1.1,.3,.55,4.3,4.2,0,b,-.15),
    E(.12,.12,.12,4.9,5.1,.48,[.95,.75,.2]),E(.12,.12,.12,4.9,5.1,-.48,[.95,.75,.2]),taper([[-2.3,3.8,0],[-4.5,3.3,0],[-7.2,2.6,0]],1.05,.08,c),C(.14,.1,.9,1.8,3.1,.7,c,0,0,.6),C(.14,.1,.9,1.8,3.1,-.7,c,0,0,.6)]),
    legs:[[.3,3.4,.95],[.3,3.4,-.95]].map(([x,y,z])=>({geo:legGeo(3.4,.55,c,1.6),x,y,z}))};}});
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
def('dachuolong',{n:'大鸵龙',walk:1,speed:2.4,group:[2,5],build(){const c=[.58,.5,.36],b=tone(c,1.2);
  return {body:body([E(1,.62,.55,0,1.9,0,c),E(.8,.45,.45,0,1.7,0,b),taper([[.8,2.1,0],[1.1,2.8,0],[1.25,3.4,0]],.25,.16,c),E(.34,.2,.18,1.45,3.5,0,c),K(.08,.25,1.8,3.45,0,[.8,.7,.5],0,0,-1.57),
    taper([[-.9,1.95,0],[-1.8,1.9,0],[-2.7,1.7,0]],.3,.04,c),E(.04,.04,.04,1.6,3.58,.12,[.05,.05,.05]),E(.04,.04,.04,1.6,3.58,-.12,[.05,.05,.05])]),
    legs:[[.1,1.75,.32],[.1,1.75,-.32]].map(([x,y,z])=>({geo:legGeo(1.75,.16,c,1.8),x,y,z}))};}});
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
  const g=taper(pts,2.2,.15,[1,1,1],60,10).g;paint(g,[1.4,2.4,2.8]);return {body:g};}});
def('gunlei',{n:'滚雷',swarm:'orb',fly:[180,420],speed:1.5,group:[1,1]});
def('baoxiao',{n:'爆哮虫',walk:1,speed:.4,group:[1,2],build(){const c=[.55,.45,.38];
  return {body:body([E(2,1.4,1.6,0,1.5,0,c),E(1,.9,1,1.8,1.4,0,tone(c,1.1)),E(.45,.35,.5,2.6,1.3,0,[.35,.12,.12]),E(.1,.1,.1,2.4,2,.45,[.05,.05,.05]),E(.1,.1,.1,2.4,2,-.45,[.05,.05,.05])]),
    legs:[1,0,-1].flatMap(x=>[1,-1].map(s=>({geo:legGeo(.7,.2,tone(c,.8)),x,y:.6,z:1.2*s,splay:.4*s})))};}});
return { SPEC, geoCache };
}
