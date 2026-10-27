/* ===== soundscape (DESIGN.md §5 Sound, L1): the world's own sounds, synthesised — wind, leaves, surf, sand, the cave — mixed by
   where you are and crossfaded as you move; the music sits on top of it and the same button and volume govern both ===== */
export function createAmbience(sense){let ctx=null,out,on=false,vol=.7,L={},timer=null;
  function noise(sec,brown){const n=ctx.sampleRate*sec,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);let last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){last=(last+.02*w)/1.02;d[i]=last*3.5;}else d[i]=w;}return b;}
  function layer(buf,filters){const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;let node=src;
    for(const [type,f,q] of filters){const bq=ctx.createBiquadFilter();bq.type=type;bq.frequency.value=f;if(q)bq.Q.value=q;node.connect(bq);node=bq;}
    const g=ctx.createGain();g.gain.value=0;node.connect(g);g.connect(out);src.start();return {g,f:node};}
  function init(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;try{ctx=new AC();}catch(e){return false;}
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-20;comp.connect(ctx.destination);out=ctx.createGain();out.gain.value=0;out.connect(comp);
    const wn=noise(5,false),bn=noise(7,true);
    L.wind=layer(bn,[['bandpass',420,.6]]);L.leaves=layer(wn,[['highpass',2400],['bandpass',5200,.6]]);
    L.surf=layer(bn,[['lowpass',520]]);L.sand=layer(wn,[['bandpass',6800,1.2]]);L.cave=layer(bn,[['lowpass',140]]);L.fall=layer(wn,[['lowpass',1600],['highpass',180]]);
    L.night=ctx.createGain();L.night.gain.value=0;L.night.connect(out);return true;}
  /* the environment, read four times a second from sense() (index.html knows where the viewer is) */
  let env={wind:.3,leaves:0,surf:0,sand:0,cave:0,night:0,fall:0,click:0},t0=0,chirp=0,drip=0,click=0;
  function tick(){if(!on)return;const t=ctx.currentTime;env=sense();
    const gust=.65+.35*Math.sin(t*.37)*Math.sin(t*.11+1),swell=.55+.45*Math.sin(t*.8)*Math.sin(t*.13);
    const set=(l,v)=>l.g.gain.setTargetAtTime(v,t,.8);
    set(L.wind,env.wind*.5*gust);L.wind.f.frequency.setTargetAtTime(300+260*gust,t,1);
    set(L.leaves,env.leaves*.18*gust*gust);set(L.surf,env.surf*.55*swell);set(L.sand,env.sand*.08*gust);set(L.cave,env.cave*.35);set(L.fall,env.fall*env.fall*.4);
    // 骷髅岛: bursts of hard double clicks ("嘎达") from the eggs in their rocks, irregular, louder as you come near
    if(env.click>.01&&t>click){click=t+.9+Math.random()*3.5;const n=2+Math.floor(Math.random()*4);
      for(let i=0;i<n;i++){const t1=t+i*(.22+Math.random()*.1);for(const [dt,f] of [[0,1100],[.05,760]]){const o=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter();
        o.type='square';o.frequency.value=f*(.9+Math.random()*.2);bp.type='bandpass';bp.frequency.value=f*1.6;bp.Q.value=3;
        g.gain.setValueAtTime(0,t1+dt);g.gain.linearRampToValueAtTime(.05*env.click,t1+dt+.003);g.gain.exponentialRampToValueAtTime(.0001,t1+dt+.035);
        o.connect(bp);bp.connect(g);g.connect(out);o.start(t1+dt);o.stop(t1+dt+.05);}}}
    // night insects in grass and woods: soft high chirps in short trains
    if(env.night&&t>chirp){chirp=t+.6+Math.random()*1.8;const f=4200+Math.random()*1800;for(let i=0;i<3+Math.floor(Math.random()*4);i++){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.07);g.gain.linearRampToValueAtTime(.018,t+i*.07+.01);g.gain.exponentialRampToValueAtTime(.0001,t+i*.07+.05);o.connect(g);g.connect(out);o.start(t+i*.07);o.stop(t+i*.07+.06);}}
    // the cave: water dripping somewhere in the dark, with a long echo
    if(env.cave&&t>drip){drip=t+1.2+Math.random()*4;const o=ctx.createOscillator(),g=ctx.createGain(),dl=ctx.createDelay(1),fb=ctx.createGain();o.frequency.setValueAtTime(1400+Math.random()*900,t);o.frequency.exponentialRampToValueAtTime(600,t+.08);
      g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+.12);dl.delayTime.value=.33;fb.gain.value=.45;o.connect(g);g.connect(out);g.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(out);o.start(t);o.stop(t+.15);}}
  function start(){if(!ctx&&!init())return;if(ctx.state==='suspended')ctx.resume();if(on)return;on=true;out.gain.setTargetAtTime(vol,ctx.currentTime,1.2);if(!timer)timer=setInterval(tick,250);}
  function stop(){if(!ctx||!on)return;on=false;out.gain.setTargetAtTime(0,ctx.currentTime,.4);setTimeout(()=>{if(!on){clearInterval(timer);timer=null;ctx.suspend();}},1500);}
  function setVol(v){vol=v;if(ctx&&on)out.gain.setTargetAtTime(v,ctx.currentTime,.2);}
  return {start,stop,setVol};}
