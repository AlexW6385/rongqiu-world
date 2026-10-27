/* ===== music: a small generative score, played live with WebAudio =====
   The direction is "curious and calm": strings or voices hold the chord, a harp, piano or koto flows in broken chords,
   and a flute-like line asks a question (rising, ending open) and then answers it (falling home). Between phrases a
   celesta sometimes peeks out with three notes. Each kind of land has its own mode, tempo and instruments; night slows
   everything down, thins it out and adds reverb. */
export const MUSIC=(()=>{
  const SC={lyd:[0,2,4,6,7,9,11],maj:[0,2,4,5,7,9,11],mix:[0,2,4,5,7,9,10],dor:[0,2,3,5,7,9,10],hij:[0,1,4,5,7,8,10],pen:[0,2,4,7,9]};
  const MOODS={
    forest:{root:62,sc:'lyd',bpm:76,meter:8,prog:[0,4,5,3],arp:'harp',lead:'flute',pad:'strings',arpP:'flow'},
    plain: {root:67,sc:'maj',bpm:82,meter:8,prog:[0,5,3,4],arp:'piano',lead:'flute',pad:'strings',arpP:'wide'},
    desert:{root:62,sc:'hij',bpm:68,meter:8,prog:[0,6,5,0],arp:'koto',lead:'ney',pad:'drone',arpP:'sparse'},
    coast: {root:69,sc:'mix',bpm:62,meter:6,prog:[0,6,3,4],arp:'harp',lead:'flute',pad:'voices',arpP:'wave'},
    snow:  {root:64,sc:'dor',bpm:58,meter:8,prog:[0,3,5,4],arp:'celesta',lead:'flute',pad:'glass',arpP:'sparse'},
    east:  {root:62,sc:'pen',bpm:80,meter:8,prog:[0,3,1,4],arp:'koto',lead:'dizi',pad:'strings',arpP:'flow'}
  };
  let ctx=null,out,dry,wet,on=false,vol=.7,mood='plain',night=false,next=0,step=0,bar=0,timer=null,pend=null,phrase=null,rest=0;
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function ir(sec){const n=ctx.sampleRate*sec,b=ctx.createBuffer(2,n,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}return b;}
  function init(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;try{ctx=new AC();}catch(e){return false;}graph();return true;}
  function graph(){
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(ctx.destination);
    out=ctx.createGain();out.gain.value=0;out.connect(comp);dry=ctx.createGain();dry.connect(out);
    const rv=ctx.createConvolver();rv.buffer=ir(3.4);wet=ctx.createGain();wet.gain.value=.5;wet.connect(rv);rv.connect(out);}
  /* one note through an envelope; send = how much goes to the reverb */
  function env(t,dur,a,peak,rel,send){const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.setTargetAtTime(0,t+Math.max(a,dur),rel);g.connect(dry);
    const s=ctx.createGain();s.gain.value=send;g.connect(s);s.connect(wet);return g;}
  function osc(type,f,t,end,dest,det=0){const o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=det;o.connect(dest);o.start(t);o.stop(end);return o;}
  const INS={
    harp(t,m,v){const g=env(t,.05,.004,v,.55,.55),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(5200,t);f.frequency.exponentialRampToValueAtTime(900,t+1.4);f.connect(g);osc('triangle',hz(m),t,t+3,f);osc('sine',hz(m)*2,t,t+2,f).detune.value=3;},
    piano(t,m,v){const g=env(t,.05,.006,v,.8,.45),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3800,t);f.frequency.exponentialRampToValueAtTime(700,t+2);f.connect(g);osc('triangle',hz(m),t,t+4,f);osc('sine',hz(m)*2.001,t,t+3,f);osc('sine',hz(m)*3.003,t,t+1.5,g);},
    koto(t,m,v){const g=env(t,.04,.003,v,.35,.4),f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=2.5;f.frequency.setValueAtTime(hz(m)*3,t);f.frequency.exponentialRampToValueAtTime(hz(m)*1.3,t+.8);f.connect(g);
      const o=osc('sawtooth',hz(m),t,t+2.2,f);o.frequency.setValueAtTime(hz(m)*1.012,t);o.frequency.exponentialRampToValueAtTime(hz(m),t+.12);},
    celesta(t,m,v){const g=env(t,.04,.003,v,.6,.7);osc('sine',hz(m),t,t+2.6,g);const h=ctx.createGain();h.gain.value=.25;h.connect(g);osc('sine',hz(m)*4,t,t+.8,h);},
    flute(t,m,v,dur){const g=env(t,dur,.12,v,.25,.5);const o=osc('sine',hz(m),t,t+dur+1.2,g);const lfo=ctx.createOscillator(),ld=ctx.createGain();lfo.frequency.value=5.2;ld.gain.setValueAtTime(0,t);ld.gain.linearRampToValueAtTime(hz(m)*.006,t+.45);lfo.connect(ld);ld.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+1.2);
      const h=ctx.createGain();h.gain.value=.12;h.connect(g);osc('triangle',hz(m)*2,t,t+dur+1.2,h);},
    ney(t,m,v,dur){INS.flute(t,m-12,v*1.1,dur);const n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*.4,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
      n.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=hz(m)*1.5;f.Q.value=3;const g=env(t,.1,.05,v*.5,.15,.3);n.connect(f);f.connect(g);n.start(t);},
    dizi(t,m,v,dur){INS.flute(t,m,v,dur);const g=env(t,.05,.01,v*.35,.08,.2);osc('triangle',hz(m)*3,t,t+.3,g);},
    bass(t,m,v,dur){const g=env(t,dur,.25,v,.8,.15),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.connect(g);osc('sine',hz(m),t,t+dur+3,f);osc('triangle',hz(m),t,t+dur+3,f);},
    strings(t,ms,v,dur,dark){const g=env(t,dur,1.6,v,1.4,.75),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=dark?750:1300;f.Q.value=.4;f.connect(g);for(const m of ms)for(const d of [-7,6])osc('sawtooth',hz(m),t,t+dur+5,f,d);},
    voices(t,ms,v,dur,dark){const g=env(t,dur,2,v*1.2,1.6,.85),f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=dark?600:900;f.Q.value=.7;f.connect(g);for(const m of ms)for(const d of [-5,5])osc('triangle',hz(m),t,t+dur+5,f,d);},
    glass(t,ms,v,dur){const g=env(t,dur,2.2,v*.9,1.8,.9);for(const m of ms){osc('sine',hz(m+12),t,t+dur+5,g,-4);osc('sine',hz(m+12),t,t+dur+5,g,4);}},
    drone(t,ms,v,dur){const g=env(t,dur,1.5,v*.8,1.5,.5),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=520;f.connect(g);osc('sawtooth',hz(ms[0]-12),t,t+dur+4,f,-4);osc('sawtooth',hz(ms[0]-5),t,t+dur+4,f,4);}
  };
  const M=()=>MOODS[mood];
  function deg(d){const sc=SC[M().sc],L=sc.length,o=Math.floor(d/L);return M().root+sc[((d%L)+L)%L]+12*o;}
  function chord(r){return [deg(r),deg(r+2),deg(r+4)];}
  /* a question-and-answer phrase over two bars: up and open, then down and home */
  function makePhrase(){const L=SC[M().sc].length,n=M().meter,notes=[];let d=L+[0,2,4][Math.floor(Math.random()*3)];
    const q=[1,2,4,1,2],a=[-1,-1,-2,1,-1,-1];let t=0;
    for(let i=0;i<4;i++){notes.push([t,d,i===3?3:Math.random()<.4?2:1]);t+=notes[notes.length-1][2];d+=q[Math.floor(Math.random()*q.length)]*(i===0?1:Math.random()<.7?1:-1);}
    t=Math.max(t,n);d=Math.max(d,L+3);
    for(let i=0;i<5&&t<n*2-2;i++){notes.push([t,d,i===4?4:Math.random()<.35?2:1]);t+=notes[notes.length-1][2];d+=a[Math.floor(Math.random()*a.length)];}
    notes[notes.length-1][1]=L+[0,2][Math.floor(Math.random()*2)];return notes;}
  function schedule(h){const m=M(),spb=60/(m.bpm*(night?.82:1))/2;   // seconds per eighth note
    while(next<(h===undefined?ctx.currentTime+.25:h)){const t=next,n=m.meter,s=step%n;
      if(s===0){bar++;if(pend){mood=pend.mood;night=pend.night;pend=null;}
        const r=M().prog[bar%M().prog.length];const barLen=spb*M().meter;
        INS[M().pad](t,chord(r),.05,barLen,night);INS.bass(t,deg(r)-12,.055,barLen*.9);
        if(rest>0)rest--;else if(!phrase&&bar%2===0){phrase={notes:makePhrase(),start:step};}
        if(!phrase&&Math.random()<(night?.45:.3)){const r0=M().prog[bar%M().prog.length];[7,8,11].forEach((k,i)=>INS[night||mood==='snow'?'celesta':'harp'](t+spb*(3+i*1.5),deg(r0+k),.035));}}
      // broken chords
      const r=M().prog[bar%M().prog.length],cs=[r,r+2,r+4,r+7,r+9];const pat=M().arpP;let play=true,d=cs[s%5];
      if(pat==='sparse')play=s%3===0&&Math.random()<.85;else if(pat==='wave')d=cs[[0,1,2,3,2,1][s%6]];else if(pat==='wide')d=cs[[0,2,4,1,3,2,4,1][s%8]];
      if(night&&Math.random()<.35)play=false;
      if(play)INS[M().arp](t,deg(d),(s===0?.05:.035)*(night?.8:1));
      // lead line
      if(phrase){const rel=step-phrase.start;for(const [at,d2,len] of phrase.notes)if(at===rel)INS[M().lead](t,deg(d2),night?.045:.055,len*spb*1.05);
        if(rel>=M().meter*2){phrase=null;rest=night?2:1;}}
      step++;next+=spb;}}
  function setMood(m,nt){if(!MOODS[m])m='plain';if(m===mood&&nt===night)return;pend={mood:m,night:nt};}
  function start(){if(!ctx&&!init())return;if(ctx.state==='suspended')ctx.resume();if(on)return;on=true;next=ctx.currentTime+.1;
    out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(vol,ctx.currentTime,1.5);if(!timer)timer=setInterval(()=>schedule(),40);}
  function stop(){if(!ctx||!on)return;on=false;out.gain.setTargetAtTime(0,ctx.currentTime,.4);setTimeout(()=>{if(!on){clearInterval(timer);timer=null;ctx.suspend();}},1500);}
  function setVol(v){vol=v;if(ctx&&on)out.gain.setTargetAtTime(v,ctx.currentTime,.2);}
  /* offline preview: render a few seconds of one mood into a buffer (used for listening tests) */
  async function preview(sec,md,nt){const keep={ctx,out,dry,wet,mood,night,next,step,bar,phrase,rest,pend};ctx=new OfflineAudioContext(2,44100*sec,44100);graph();out.gain.value=vol;
    mood=md;night=nt;next=.1;step=0;bar=0;phrase=null;rest=0;pend=null;schedule(sec-1);const buf=await ctx.startRendering();({ctx,out,dry,wet,mood,night,next,step,bar,phrase,rest,pend}=keep);return buf;}
  return {start,stop,setMood,setVol,preview,get on(){return on;},get mood(){return mood;}};
})();
