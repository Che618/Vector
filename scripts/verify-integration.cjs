// Cross-workspace business-flow checks using the real Vue reactivity and models.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const files=new Map();
const storage={getItem:k=>files.get(k)||null,setItem:(k,v)=>files.set(k,String(v))};
function environment(){
  const mounted=[],listeners=new Map();
  const c={console,localStorage:storage,location:{hash:'/tools/catalog',origin:'http://localhost:8000'},document:{title:''},navigator:{locks:{request:async(_key,fn)=>fn()}},setTimeout:()=>1,clearTimeout:()=>{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},scrollTo:()=>{}};
  c.window=c;c.parent=c;c.addEventListener=(name,f)=>{const a=listeners.get(name)||[];a.push(f);listeners.set(name,a);};c.removeEventListener=()=>{};c.dispatchEvent=e=>(listeners.get(e.type)||[]).forEach(f=>f(e));
  vm.createContext(c);
  const load=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});
  delete c.document;
  load('vendor/vue.global.js');
  c.document={title:''};
  c.Vue.onMounted=f=>mounted.push(f);c.Vue.onBeforeUnmount=()=>{};c.Vue.onUnmounted=()=>{};
  c.Vue.createApp=spec=>{c.spec=spec;const app={component:()=>app,mount:()=>{}};return app;};
  return {c,load,mounted,listeners};
}
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
(async()=>{
  const host=environment(),h=host.c;
  host.load('portal/integration.js');host.load('portal/operations.js');host.load('portal/navigation.js');host.load('js/icons.js');host.load('portal/platform.js');
  const platform=h.spec.setup();host.mounted.forEach(f=>f());
  const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const meterTemplate=indexHtml.match(/<template v-else-if="page==='meter'">([\s\S]*?)<\/template>/)?.[1];
  assert(meterTemplate,'integrated meter template is present');h.Vue.compile('<div>'+meterTemplate+'</div>');
  host.load('portal/tools.js');const spec=h.ToolWorkspace;
  h.Vue.compile(spec.template);
  const tools=spec.data();Object.entries(spec.methods).forEach(([k,f])=>tools[k]=f.bind(tools));
  tools.$emit=(name,event)=>{assert.equal(name,'usage');platform.captureUsage(event);};tools.$refs={};tools.$nextTick=f=>f();
  for(const d of ['海洋科学','天文科学','生命科学']){
    const tool=tools.data.tools.find(t=>t.domain===d&&t.status==='已发布');
    tools.runTool(tool);
  }
  await flush();
  assert.equal(platform.state.value.bridgeReceipts.length,3,'rapid events must all reach metering');
  assert.equal(h.ScienceBridge.list('tool.output.available').length,3);
  for(const r of platform.state.value.bridgeReceipts){
    const u=platform.state.value.uses.find(u=>u.id===r.useId),e=platform.state.value.events.find(e=>e.id===u.event);
    assert.equal(u.price,18);assert.equal(e.state,'待核验');assert(u.resourceName);assert.equal(e.version,u.version);
  }
  const toolUsage=h.ScienceBridge.list('usage.succeeded')[0];
  const receipts=platform.state.value.bridgeReceipts.length;
  platform.captureUsage(toolUsage);platform.captureUsage(toolUsage);await flush();
  assert.equal(platform.state.value.bridgeReceipts.length,receipts,'duplicate delivery is idempotent');
  tools.runCase='失败样例';tools.runTool(tools.data.tools[0]);await flush();
  assert.equal(h.ScienceBridge.list('usage.succeeded').length,3,'failed runs never generate metering');
  tools.runCase='正常样例';tools.runFlow(tools.data.flows[0]);await flush();
  assert.equal(platform.state.value.bridgeReceipts.length,5,'all workflow nodes are captured');

  const vector=environment(),v=vector.c;
  vector.load('portal/integration.js');vector.load('js/icons.js');vector.load('js/model.js');vector.load('js/engineering.js');vector.load('js/engineering-ui.js');vector.load('js/app.js');
  const vectorHtml=fs.readFileSync(path.join(root,'vector.html'),'utf8');
  const inbox=vectorHtml.match(/<section class="card pad bridge-inbox"[\s\S]*?<\/section>/)?.[0];
  assert(inbox,'tool result inbox is present in vector intake');v.Vue.compile(inbox);
  const workspace=v.spec.setup(),asset=v.ScienceBridge.list('tool.output.available')[0];
  const before=workspace.s.sources.length;
  workspace.importToolOutput(asset);
  const imported=workspace.current.value;
  assert.equal(workspace.s.sources.length,before+1);assert.equal(imported.toolRun,asset.payload.runId);assert.equal(imported.outputRef,asset.payload.assetId);assert.equal(imported.state,'待编码');
  workspace.importToolOutput(asset);assert.equal(workspace.s.sources.length,before+1,'duplicate import cannot create another dataset');
  workspace.generate();assert.equal(imported.state,'已生成');workspace.writeIndex();assert.equal(imported.state,'已索引');
  assert(v.ScienceBridge.list('vector.asset.indexed').some(e=>e.payload.resourceId===imported.id));
  workspace.searchSource(imported);workspace.query.value='工具演示处理报告';workspace.runSearch();
  assert.equal(workspace.err.value,'');assert(workspace.hits.value.length);
  const dataUsage=v.ScienceBridge.list('usage.succeeded').find(e=>e.payload.source==='vector');
  assert(dataUsage);assert.equal(dataUsage.payload.resourceId,imported.id);assert.equal(dataUsage.payload.version,'v1');
  const beforeVectorUsage=platform.state.value.bridgeReceipts.length;
  // The host accepts bridge messages only from its embedded vector workspace.
  platform.vectorFrame.value={contentWindow:vector.c};
  const messageListeners=host.listeners.get('message');
  const vectorWindowProxy=platform.vectorFrame.value.contentWindow;
  messageListeners.forEach(fn=>fn({origin:h.location.origin,source:{},data:{channel:'bjtu-science-bridge',event:dataUsage}}));await flush();
  assert.equal(platform.state.value.bridgeReceipts.length,beforeVectorUsage,'messages from other frames are ignored');
  messageListeners.forEach(fn=>fn({origin:h.location.origin,source:vectorWindowProxy,data:{channel:'bjtu-science-bridge',event:dataUsage}}));await flush();
  const dataReceipt=platform.state.value.bridgeReceipts.find(r=>r.eventId===dataUsage.eventId);
  assert(dataReceipt);const dataUse=platform.state.value.uses.find(u=>u.id===dataReceipt.useId);
  assert.equal(dataUse.qty,workspace.hits.value.length);assert.equal(dataUse.price,2);assert.equal(dataUse.assetRef,imported.id);

  const O=require('../portal/operations.js');const state=platform.state.value;
  const oldSnapshot=JSON.stringify(state.batches);
  for(const e of state.events.filter(e=>e.state==='待核验'))O.review(state,e.id,e.ref!=='JOB-11-1','核对来源、版本与演示用量');
  const batch=O.settle(state,O.defaultRule);
  assert.equal(batch.gross,batch.net+batch.reserve+batch.cost);
  assert.equal(batch.rows.reduce((n,r)=>n+r.amount,0),batch.net);
  assert.equal(JSON.stringify(state.batches.slice(1)),oldSnapshot,'existing settlement snapshots stay immutable');
  assert(batch.usages.some(u=>u.bridgeSource==='tool'));assert(batch.usages.some(u=>u.bridgeSource==='vector'));
  // A distinct event for another actual call is counted; invalid input must not mutate the ledger.
  const invalid=JSON.parse(JSON.stringify(dataUsage));invalid.eventId='INVALID';invalid.payload.quantity=-1;
  const saved=JSON.stringify(state);assert.throws(()=>O.importUsage(state,invalid));assert.equal(JSON.stringify(state),saved);
  console.log('PASS: three domains, burst delivery, duplicate prevention, failure exclusion, tool output import, encoding, indexing, retrieval, metering, review and settlement conservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
