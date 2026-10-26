const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-webgpu','--enable-features=Vulkan,WebGPU','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--use-angle=swiftshader','--disable-vulkan-surface']});
const pg=await b.newPage({viewport:{width:+(process.env.W||640),height:+(process.env.H||360)}});
const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text().slice(0,500));});
await pg.addInitScript(()=>{window.__noloop=true;});await pg.goto('http://localhost:'+(process.env.PORT||8788)+'/'+(process.env.F||'test.html'),{waitUntil:'load'});await pg.waitForFunction(()=>window.__demo,null,{timeout:60000});
await pg.evaluate(q=>{__demo.setQuality(q);},process.env.Q||'mid');
if(process.env.VIEW)await pg.evaluate(v=>{__demo.setView(JSON.parse(v));},process.env.VIEW);
if(process.env.HOUR)await pg.evaluate(h=>{const e=document.querySelector('#sun');e.value=h;e.dispatchEvent(new Event('input'));},process.env.HOUR);
for(let i=0;i<(+process.env.N||40);i++){await pg.evaluate(()=>__demo.render());await pg.waitForTimeout(60);}
await pg.screenshot({path:(process.env.DIR||'shots')+'/'+(process.env.OUT||'v6_ground')+'.png',timeout:600000});
if(process.env.MAP){await pg.evaluate(()=>{__demo.openMap();});await pg.waitForFunction(()=>document.querySelector('#mapLoading').hidden,null,{timeout:120000});
  await pg.evaluate(()=>__demo.render());await pg.waitForTimeout(300);await pg.screenshot({path:(process.env.DIR||'shots')+'/'+(process.env.OUT||'v6')+'_map.png'});}
console.log(errs.slice(0,6).join('\n'));await b.close();})();
