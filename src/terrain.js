/* ===== terrain source: one definition, runs on the main thread (for the walker) and inside workers (for tiles) =====
   Height, moisture and dryness; the book's landscapes carved in by coordinates; the landmark tables; the city plans (city.js).
   It is text so that workers can run the very same code; index.html evaluates it once on the main thread as T. */
import { CITY_SRC } from './city.js';

export const TERRAIN_SRC=`
const F2=x=>x-Math.floor(x);
function hash3(ix,iy,iz){let h=(ix*374761393+iy*668265263+iz*2147483647)|0;h=(h^(h>>>13))*1274126177|0;h=h^(h>>>16);return (h&1023)/1023*2-1;}
const PERM=new Uint8Array(512);{let s=71;for(let i=0;i<256;i++)PERM[i]=i;for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);const t=PERM[i];PERM[i]=PERM[j];PERM[j]=t;}for(let i=0;i<256;i++)PERM[256+i]=PERM[i];}
const GR=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],[1,1,0],[-1,1,0],[0,-1,1],[0,-1,-1]];
const fade=t=>t*t*t*(t*(t*6-15)+10);
function pn(x,y,z){ // 3D Perlin, wraps every 256 units of noise space
  const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z);x-=X;y-=Y;z-=Z;const xi=X&255,yi=Y&255,zi=Z&255;
  const u=fade(x),v=fade(y),w=fade(z);
  const A=PERM[xi]+yi,AA=PERM[A]+zi,AB=PERM[A+1]+zi,B=PERM[xi+1]+yi,BA=PERM[B]+zi,BB=PERM[B+1]+zi;
  const g=(h,x,y,z)=>{const q=GR[h&15];return q[0]*x+q[1]*y+q[2]*z;};
  const l=(a,b,t)=>a+t*(b-a);
  return l(l(l(g(PERM[AA],x,y,z),g(PERM[BA],x-1,y,z),u),l(g(PERM[AB],x,y-1,z),g(PERM[BB],x-1,y-1,z),u),v),
           l(l(g(PERM[AA+1],x,y,z-1),g(PERM[BA+1],x-1,y,z-1),u),l(g(PERM[AB+1],x,y-1,z-1),g(PERM[BB+1],x-1,y-1,z-1),u),v),w);
}
function fbm(x,y,z,oct){let a=.5,s=0,n=0;for(let i=0;i<oct;i++){s+=a*pn(x,y,z);n+=a;const nx=x*2.03+13.7,ny=y*2.03+7.1,nz=z*2.03+3.3;x=nx;y=ny;z=nz;a*=.5;}return s/n;}
function ridge(x,y,z,oct){let a=.5,s=0,w=1,n=0;for(let i=0;i<oct;i++){let v=1-Math.abs(pn(x,y,z));v*=v;s+=a*v*w;n+=a;w=Math.min(Math.max(v*2,0),1);const nx=x*2.1+5.2,ny=y*2.1+1.3,nz=z*2.1+8.7;x=nx;y=ny;z=nz;a*=.5;}return s/n;}
const sm=(a,b,x)=>{x=Math.min(Math.max((x-a)/(b-a),0),1);return x*x*(3-2*x);};
/* height in meters above sea level for unit direction (nx,ny,nz); detail = smallest feature size wanted in meters */
/* the novel's map: continents as (lat°, lon°, angular radius°), coastlines roughened by noise */
const D2R=Math.PI/180;
const REG=[[30,2,27],[6,-76,28],[-12,70,24],[-52,-18,18]].map(([la,lo,r])=>[Math.cos(la*D2R)*Math.cos(lo*D2R),Math.sin(la*D2R),-Math.cos(la*D2R)*Math.sin(lo*D2R),r*D2R]);
const PEAKS=[[22,-94,1.0,1400],[-6.2,66.2,.9,1600]].map(([la,lo,r,hh])=>[Math.cos(la*D2R)*Math.cos(lo*D2R),Math.sin(la*D2R),-Math.cos(la*D2R)*Math.sin(lo*D2R),r*D2R,hh]);
/* islands of the book: 骷髅岛/回音之岛、双子岛、真菌之岛（五岛）、白骸龙之岛、只有骨架的岛屿、迷雾之海群岛 */
const ISL=[[8,-33,.12],[1,-46.6,.45],[1.3,-45.3,.45],[30,-104,.3],[30.6,-103.3,.25],[29.4,-103.4,.25],[30.4,-104.8,.22],[29.5,-104.6,.2],[4,-112,.7],[12,-44,.3],[12,-22,.25],[11.2,-21.1,.2],[13,-23,.18]].map(([la,lo,r])=>[Math.cos(la*D2R)*Math.cos(lo*D2R),Math.sin(la*D2R),-Math.cos(la*D2R)*Math.sin(lo*D2R),r*D2R]);
function regionMask(nx,ny,nz){
  const rough=1+.42*fbm(nx*3.3+4,ny*3.3-2,nz*3.3+7,4)+.12*fbm(nx*14,ny*14,nz*14,3)+.05*fbm(nx*60+3,ny*60,nz*60,3)+.02*fbm(nx*300,ny*300+1,nz*300,2);
  let m=0;
  for(const r of REG){const d=Math.max(-1,Math.min(1,nx*r[0]+ny*r[1]+nz*r[2]));const ang=Math.acos(d)*rough;m=Math.max(m,sm(r[3]*1.22,r[3]*.72,ang));}
  for(const r of ISL){const d=nx*r[0]+ny*r[1]+nz*r[2];if(d<.999)continue;const ang=Math.acos(Math.min(1,d))*(rough*.6+.4);m=Math.max(m,sm(r[3]*1.12,r[3]*.55,ang));}
  return m;
}
function terrain(nx,ny,nz,detail){
  const c=fbm(nx*1.6+2.3,ny*1.6+.7,nz*1.6-1.2,5);
  const isl=sm(.22,.4,c);                                        // scattered islands
  const m=Math.max(regionMask(nx,ny,nz),isl*.8);
  const mw=m+(detail<60000?.035*fbm(nx*20000+7,ny*20000,nz*20000+2,3)+.012*fbm(nx*150000,ny*150000+1,nz*150000,2):0);
  const shelf=sm(.15,.45,m),coast=sm(.47,.53,mw),land=sm(.5,.7,m);
  let h=-2600*(1-shelf)-120*(1-coast)*shelf+coast*(18+(m-.5)*900+fbm(nx*6+1,ny*6,nz*6+3,4)*650*land);
  const mRidge=ridge(nx*5.5+.5,ny*5.5+.5,nz*5.5+.5,6);
  const mMask=sm(.3,.8,fbm(nx*3.1+9,ny*3.1,nz*3.1+4,3)*.5+.5)*land;  // mountain belts
  h+=mRidge*4800*mMask;
  if(detail<30000){h+=ridge(nx*1200+2,ny*1200,nz*1200+1,4)*420*(mMask*.7+.3)*coast;}      // 5 km ridges
  if(detail<6000){h+=ridge(nx*6000,ny*6000+3,nz*6000,3)*90*(mMask*.6+.4)*coast+fbm(nx*4000+1,ny*4000,nz*4000,3)*60*coast;}
  if(detail<800){h+=fbm(nx*25000,ny*25000+2,nz*25000,3)*14*coast;}
  if(detail<150){h+=fbm(nx*100000+1,ny*100000,nz*100000,2)*1.6;}
  for(const p of PEAKS){const d=Math.max(-1,Math.min(1,nx*p[0]+ny*p[1]+nz*p[2]));const ang=Math.acos(d)/p[3];if(ang<1.5){const g=Math.exp(-ang*ang*2.2);h+=g*p[4]*(0.7+0.6*mRidge);}}
  h+=fbm(nx*40+1,ny*40,nz*40+2,4)*380*land;                     // hills
  if(detail<80000){h+=ridge(nx*220,ny*220,nz*220,4)*140*(mMask*.8+.2)*coast;}
  if(detail<40){h+=fbm(nx*400000,ny*400000,nz*400000,2)*.3;}
  h=features(nx,ny,nz,h,detail,coast,mMask);
  return h;
}
/* named places with a definite shape in the book */
const V=(la,lo)=>[Math.cos(la*D2R)*Math.cos(lo*D2R),Math.sin(la*D2R),-Math.cos(la*D2R)*Math.sin(lo*D2R)];
const angTo=(nx,ny,nz,c)=>Math.acos(Math.max(-1,Math.min(1,nx*c[0]+ny*c[1]+nz*c[2])));
/* distance (rad) from a point to a great-circle segment a→b */
function segDist(nx,ny,nz,a,b){const ax=a[0],ay=a[1],az=a[2],bx=b[0],by=b[1],bz=b[2];
  let gx=ay*bz-az*by,gy=az*bx-ax*bz,gz=ax*by-ay*bx;const gl=Math.hypot(gx,gy,gz);gx/=gl;gy/=gl;gz/=gl;
  const side=nx*gx+ny*gy+nz*gz;const dPlane=Math.asin(Math.max(-1,Math.min(1,side)));
  // projection onto the circle, then check it lies within the arc
  let px=nx-side*gx,py=ny-side*gy,pz=nz-side*gz;const pl=Math.hypot(px,py,pz);px/=pl;py/=pl;pz/=pl;
  const ab=Math.acos(Math.max(-1,Math.min(1,ax*bx+ay*by+az*bz)));
  const pa=Math.acos(Math.max(-1,Math.min(1,px*ax+py*ay+pz*az))),pb=Math.acos(Math.max(-1,Math.min(1,px*bx+py*by+pz*bz)));
  if(pa<=ab+1e-9&&pb<=ab+1e-9)return Math.abs(dPlane);
  return Math.min(angTo(nx,ny,nz,a),angTo(nx,ny,nz,b));}
const F_CANYON=[V(12,6),V(50,7)];          // 峡谷之海：贯穿北之大陆南北的海水峡谷
const F_RIFT=[V(10,-63),V(19,-56)];         // 大裂谷：深两千米、迷雾弥漫
const PIT_R=560/6371000,PIT_D=420,PIT_RINGS=24,PIT_LA=22,PIT_LO=-10,PIT_E=[-Math.sin(PIT_LO*D2R),0,-Math.cos(PIT_LO*D2R)],PIT_N=[-Math.sin(PIT_LA*D2R)*Math.cos(PIT_LO*D2R),Math.cos(PIT_LA*D2R),Math.sin(PIT_LA*D2R)*Math.sin(PIT_LO*D2R)];
/* open ground with no trees: [centre, radius rad] — 立蝎之城 stands on an open grass plain (encyclopedia scorpion); a ring of open ground round the home tree (hometree) */
const CLEARINGS=[[V(33.6,10.4),120/6371000],[V(-12,-78),1100/6371000],[V(32,8.3),140/6371000],[V(-4,56),500/6371000],[V(-14,63),790/6371000],[V(7.5,16.75),520/6371000],[V(-5.9,65.7),330/6371000]];  // + the Academy summit  // + the 翡翠港 town  // + inside the walls of 银之城 and 创造之城
/* tall-fern jungle, no trees: the egg-boulder field of 翡翠龙之城 (encyclopedia emeraldcity) */
const FERNZONES=[[V(12,-88),3200/6371000]];   // the tall-fern jungle round 翡翠龙之城 (inside the walls is cleared: src/city.js)
const F_PEAK=V(33.2,11.2),F_JADE=V(7.5,16.75),F_CPEAK=V(-6.2,66.2),F_ACAD=V(-5.9,65.7),F_SKULL=V(8,-33);
/* snowline (m): falls with latitude; the whole southern continent is ice (encyclopedia south: 南之大陆, a white ice continent) */
const SOUTH_C=V(-52,-18),CRYS_C=V(10,-100);   // CRYS_C: 结晶林地, bare floor
function snowLineAt(nx,ny,nz){const la=Math.abs(ny);return 4300-3600*la*la-(4360-3600*la*la)*sm(.314,.244,angTo(nx,ny,nz,SOUTH_C));}
const SPIRE_C=V(15,-1),SPIRE_R=4000/6371000;   // 尖柱林: some tens of km round, so ~8 km across
const F_PIT=V(PIT_LA,PIT_LO), F_DESERT=V(25,-5), F_SALT=V(4,-72), F_CRYSTAL=V(71,34), F_OASIS=V(27,-11), F_LAKE=V(-17,75);
function features(nx,ny,nz,h,detail,coast,mMask){
  const km=1/6371;let duneH=0;
  // 峡谷之海：宽约 25 km，深到海面下 150 m，两壁陡峭
  let d=segDist(nx,ny,nz,F_CANYON[0],F_CANYON[1]);
  if(d<40*km){const w=(12+6*fbm(nx*900,ny*900,nz*900,3))*km;const t=sm(w,w*.55,d);h=h*(1-t)+(-150-60*fbm(nx*3000,ny*3000,nz*3000,2))*t;}
  // 大裂谷 (encyclopedia rift): about 10 km wide, 2000 m deep, near-vertical walls
  d=segDist(nx,ny,nz,F_RIFT[0],F_RIFT[1]);
  if(d<20*km){const w=(5+1.2*fbm(nx*1200,ny*1200,nz*1200,3))*km;const t=sm(w,w*.8,d);{const fl=Math.max(h-1900-150*fbm(nx*5000,ny*5000,nz*5000,2),35+25*fbm(nx*9000,ny*9000,nz*9000,2));h=h*(1-t)+fl*t;}}  /* the floor is dark mud and rock, never sea */
  // 无尽荒漠：平坦，沙丘
  d=angTo(nx,ny,nz,F_DESERT);
  if(d<.17){const t=sm(.17,.1,d);const dune=detail<400?ridge(nx*60000,ny*60000+1,nz*60000,3)*28+fbm(nx*250000,ny*250000,nz*250000,2)*1.5:0;h=h*(1-t)+(Math.max(h,0)*.25+260+dune)*t;duneH=dune*t;}
  // 印加巨坑 (encyclopedia inca_pit): mouth just over 1 km, several hundred m deep, one spiral terrace road winding
  // down, each ring narrower; a flat floor tens of m wide. Carved after the desert plateau so the plateau sets the rim.
  d=angTo(nx,ny,nz,F_PIT);
  if(d<PIT_R*1.15){const u=Math.min(1,d/PIT_R);
    const a=Math.atan2(nx*PIT_N[0]+ny*PIT_N[1]+nz*PIT_N[2],nx*PIT_E[0]+ny*PIT_E[1]+nz*PIT_E[2]);
    const sp=Math.max(0,(u-.05)/.95)*PIT_RINGS+a/(2*Math.PI)+.5;const fl=Math.floor(sp),fr=sp-fl;
    const lvl=Math.min(1,(fl+sm(.8,.97,fr))/PIT_RINGS);
    const rim=sm(1.15,1,d/PIT_R);
    h-=rim*(PIT_D*(1-lvl)*(1-.03*fbm(nx*90000,ny*90000,nz*90000,2))+duneH*sm(1.05,.95,d/PIT_R));}  // no dunes inside the rock pit
  // 中转站·绿洲湖：荒漠里直径几十米的湖（做成浅洼地）
  d=angTo(nx,ny,nz,F_OASIS);if(d<.0001){h-=sm(.0001,.00003,d)*(h+1-(-3));}
  // 盐地·白色荒漠：干涸的咸水湖，极平
  d=angTo(nx,ny,nz,F_SALT);
  if(d<.075){const t=sm(.075,.045,d);h=h*(1-t)+(90+(detail<400?fbm(nx*300000,ny*300000,nz*300000,2)*.4:0))*t;}
  // 结晶之山：从深海一直长出冰面的巨大结晶
  d=angTo(nx,ny,nz,F_CRYSTAL);

  // 扭曲丛林、尖柱林、龙栖木之林：低地（把山脉带压下去）
  for(const [c,rad,base,k] of [[V(33,11),.06,220,.12],[V(15,-1),.04,160,.3],[V(-4,-86),.05,120,.15]]){d=angTo(nx,ny,nz,c);if(d<rad){const t=sm(rad,rad*.45,d);if(h>0)h=h*(1-t)+(base+h*k)*t;}}
  // 山峰 · 山中湖 (encyclopedia peak): a lone mountain over 1000 m high in the middle of the twisted jungle; a crater lake 500 m
  // across and 200 m deep at the top, drilled by a 炼狱蠕虫 (the lake's water waits for Water L3: mountain lakes)
  d=angTo(nx,ny,nz,F_PEAK);
  if(d<7*km){const u=d/(4.2*km);const cone=Math.pow(Math.max(0,1-u),1.7)*.92+.08*Math.exp(-u*u)*(1+.1*ridge(nx*7000,ny*7000,nz*7000,3));h+=1250*cone*(1+.06*ridge(nx*9000,ny*9000,nz*9000,3));
    // the crater: the cone's point flattened to the rim, then a bowl 200 m deep and ~500 m across (the lake fills it: LAKES in index.html)
    const cr=d/(.25*km);if(cr<1.25){const cf=x=>Math.pow(Math.max(0,1-x),1.7)*.92+.08*Math.exp(-x*x);h-=1250*Math.max(0,cf(u)-cf(.25/4.2))*sm(1.1,.8,cr);h-=200*sm(1.2,.8,cr)*(1-.15*cr*cr);}}
  // 云中山峰 (encyclopedia cloudpeak): a steep rock mountain rising through all three cloud sheets; and the lower Academy peak
  // ~60 km away whose flat top just clears the third sheet, crowned by the 白骸龙 Academy
  d=angTo(nx,ny,nz,F_CPEAK);
  if(d<6*km){const u=d/(4.6*km);h+=2300*Math.pow(Math.max(0,1-u),1.35)*(1+.12*ridge(nx*6000,ny*6000,nz*6000,4));}
  d=angTo(nx,ny,nz,F_ACAD);
  if(d<4.5*km){const u=Math.max(d/(3.2*km),.07);h+=820*Math.pow(Math.max(0,1-u),1.7)*(1+.08*ridge(nx*9000,ny*9000,nz*9000,3)*sm(.1,.3,u));}
  // 骷髅岛 · 回音之岛 (encyclopedia mistsea): a flat island some 20 × 9 km in the western fog sea
  d=angTo(nx,ny,nz,F_SKULL);if(d<20*km&&h>0){const t=sm(20*km,13*km,d);h=h*(1-t)+(6+10*sm(9*km,2*km,d)+3*fbm(nx*90000,ny*90000,nz*90000,2))*t;}
  // 翡翠港 (encyclopedia jadeport): the harbour town sits on a low shore terrace among the coastal islets
  d=angTo(nx,ny,nz,F_JADE);if(d<.42*km){const t=sm(.42*km,.27*km,d);h=h*(1-t)+(4+1.2*fbm(nx*400000,ny*400000,nz*400000,2))*t;}
  // 地眼之湖：沙漠中心的绿洲巨湖
  d=angTo(nx,ny,nz,F_LAKE);if(d<.012){const t=sm(.012,.007,d);h=h*(1-t)+(-8)*t;}
  h=cityFlatten(nx,ny,nz,h);   // city sites (src/city.js)
  return h;
}
function dryness(nx,ny,nz){return Math.max(sm(.16,.09,angTo(nx,ny,nz,F_DESERT)),sm(.07,.03,angTo(nx,ny,nz,F_SALT)),sm(.12,.06,angTo(nx,ny,nz,V(-17,75))));}
function faceUV(d){const ax=Math.abs(d[0]),ay=Math.abs(d[1]),az=Math.abs(d[2]);let f,u,v;
  if(ax>=ay&&ax>=az){if(d[0]>0){f=0;u=-d[2]/ax;v=d[1]/ax;}else{f=1;u=d[2]/ax;v=d[1]/ax;}}
  else if(ay>=ax&&ay>=az){if(d[1]>0){f=2;u=d[0]/ay;v=-d[2]/ay;}else{f=3;u=d[0]/ay;v=d[2]/ay;}}
  else{if(d[2]>0){f=4;u=d[0]/az;v=d[1]/az;}else{f=5;u=-d[0]/az;v=d[1]/az;}}
  return [f,Math.atan(u)/(Math.PI/4),Math.atan(v)/(Math.PI/4)];}
/* fixed landmarks: [lat, lon, kind, [[east m, north m, scale, lift m, yaw], ...]] */
/* landmark tables: [lat, lon, kind, items]; item = [x m, y m, scale, lift m, heading rad] in the landmark's local frame, where +x points WEST and +y points SOUTH (the tangent frame the worker uses); heading h points along west·cos h + south·sin h.
   Sizes and layouts follow the encyclopedia entries named in the comments (rongqiu-source/encyclopedia/<id>.md). */
const LMR=k=>{let x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const ring=(n,r,f)=>Array.from({length:n},(_,i)=>f(i*6.2832/n,r,i));
const spiralLots=(n,r0,r1,f)=>Array.from({length:n},(_,i)=>{const a=i*2.39996+LMR(i)*.4,r=r0+(r1-r0)*Math.sqrt((i+.5)/n)*(.92+LMR(i+7)*.16);return f(Math.cos(a)*r,Math.sin(a)*r,i);});
const LANDMARKS=[
  [32,8.3,'hometree',[[0,0,1,0,1.5708]]],                                   // hometree: branchless 50 m × 310 m column
  [40,6.65,'deadGiant',[[0,0,1,0,0],[450,-1300,.95,0,1],[-600,1500,1.05,0,2],[300,3100,.9,0,.5]]],   // on the canyon's glacier   // frozentree: dead home trees on the glacier, 0.5–2 km apart
  // scorpion: ten 50 m pyramids in a straight line, with a field of 3–20 m pyramids round them (jinzita)
  [-12,-78,'pyramid',[...Array.from({length:10},(_,i)=>[(i-4.5)*140,0,1,0,0]),
     ...Array.from({length:90},(_,i)=>{const x=(LMR(i)-.5)*1700,y=(LMR(i+50)-.5)*700;return Math.abs(y)<70?null:[x,y,.06+LMR(i+90)**2*.34,0,LMR(i+130)*1.57];}).filter(Boolean)]],
  [33.6,10.4,'mound',[[0,0,1,0,0],[-38,22,.9,0,1],[30,34,1.1,0,2]]],   // naodaichong: three earth-and-rock mounds 20 m+ high, 10 m+ wide, ~0.5 m holes, in a clearing [inferred location]
  [12,-88,'eggRock',Array.from({length:14},(_,i)=>[Math.cos(i*2.4)*(300+i*60),Math.sin(i*2.4)*(300+i*60),.7+(i%4)*.25,0,i])],  // emeraldcity: egg boulders
  // isles / mingshidao: an archipelago 200–300 m up over 5–10 km² — a dozen big forested islands up to ~200 m and hundreds of
  // bare song-stone chunks from a metre to tens of metres
  [34,10,'floatIsle',Array.from({length:12},(_,i)=>{const a=LMR(i+500)*6.283,r=200+1200*Math.sqrt(LMR(i+530));return [Math.cos(a)*r,Math.sin(a)*r,.35+.5*LMR(i+560),210+90*LMR(i+590),LMR(i+620)*6.283];})],
  [34,10,'floatRock',Array.from({length:220},(_,i)=>{const a=LMR(i+700)*6.283,r=1500*Math.sqrt(LMR(i+1000));return [Math.cos(a)*r,Math.sin(a)*r,1+45*Math.pow(LMR(i+1300),3.2),200+120*LMR(i+1600),LMR(i+1900)*6.283];})],
  [7.5,16.75,'house',Array.from({length:24},(_,i)=>[(i%6-2.5)*60+((i/6|0)%2)*20,(i/6|0)*55-80,.8+(i%3)*.3,0,0])],  // jadeport
  // silvercity: walled town ~1 km across of low silver cone-roofed houses, square barracks in the centre, a 30 m round research hall
  [-4,56,'coneHouse',spiralLots(380,70,430,(x,y,i)=>[x,y,.75+LMR(i+3)*.5,0,LMR(i+5)*6.28])],
  [-4,56,'barMetal',ring(150,470,(a,r,i)=>(i>=74&&i<=76)?null:[Math.cos(a)*r,Math.sin(a)*r,1,0,a+1.5708]).filter(Boolean)],
  [-4,56,'squareHall',[[0,0,1,0,0],[-36,0,.7,0,1.5708]]],
  [-4,56,'roundHall',[[60,40,1,0,0]]],
  // 骷髅岛's 1001 click-eggs: 1 × 2 m rocks set at regular spacing over the island, guiding animals through the fog (mistsea)
  [8,-33,'clickRock',(()=>{const o=[];for(let j=-12;j<=12;j++)for(let i=-26;i<=26;i++){const x=i*370,y=j*370;if((x/9800)**2+(y/4400)**2>1)continue;
    const la=8-y/111195,lo=-33-x/(111195*Math.cos(8*D2R));const p=V(la,lo);if(terrain(p[0],p[1],p[2],50)<2)continue;o.push([x,y,.8+.4*LMR(i*31+j),0,LMR(i+j*57)*6.283]);}return o.slice(0,1001);})()],
  [-5.9,65.7,'roundHall',[[0,0,1.3,0,0]]],                                                    // 学院 (cloudpeak): the great hall on the summit
  [-5.9,65.7,'squareHall',ring(7,62,(a,r,i)=>[Math.cos(a)*r,Math.sin(a)*r,.55+(i%2)*.15,0,a+1.5708])],   // classrooms and the library round it
  // capital: the 银甲龙 capital — the same building language at larger scale, with military halls and a silver pyramid over the dock cavern
  [-14,63,'coneHouse',spiralLots(620,140,700,(x,y,i)=>[x,y,.8+LMR(i+11)*.6,0,LMR(i+13)*6.28])],
  [-14,63,'barMetal',ring(240,760,(a,r,i)=>(i>=118&&i<=121)?null:[Math.cos(a)*r,Math.sin(a)*r,1,0,a+1.5708]).filter(Boolean)],
  [-14,63,'squareHall',ring(10,95,(a,r,i)=>[Math.cos(a)*r,Math.sin(a)*r,.8+(i%3)*.2,0,a])],
  [-14,63,'silverPyramid',[[0,0,1,0,0]]],
  [71,34,'crystalPeak',[[0,0,1,0,0]]]   // jjzs: a ring wall of crystal rising out of the polar sea ice
];
/* 立蝎 pyramids spread through the southern dinosaur jungle (encyclopedia jinzita): some alone, some in short rows, more of them
   toward the 翡翠龙 city as the 立蝎 build northward; each in a ~50 m grass clearing */
{for(let k=0;k<16;k++){const t=.12+.8*LMR(k+3100),la=-12+24*t+(LMR(k+3200)-.5)*3,lo=-78-10*t+(LMR(k+3300)-.5)*4;const p=V(la,lo);
   if(terrain(p[0],p[1],p[2],50)<20)continue;const n=1+Math.floor(LMR(k+3400)*3.2),yaw=LMR(k+3500)*6.283,items=[];
   for(let i=0;i<n;i++){const sc=.22+.75*Math.pow(LMR(k*7+i+3600),1.6),off=(i-(n-1)/2)*95;items.push([Math.cos(yaw)*off,Math.sin(yaw)*off,sc,0,0]);}
   LANDMARKS.push([la,lo,'pyramid',items]);CLEARINGS.push([p,(60+n*55)/6371000]);}}
function regionIdx(nx,ny,nz){let b=0,k=-1;REG.forEach((r,i)=>{const m=sm(r[3]*1.22,r[3]*.72,angTo(nx,ny,nz,r));if(m>b){b=m;k=i;}});return b>.5?k:-1;}
function moisture(nx,ny,nz){return fbm(nx*7+11,ny*7,nz*7+5,3)*.5+.5;}
${CITY_SRC}
`;
