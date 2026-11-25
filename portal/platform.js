(() => {
  const O = Operations, N = PlatformNav;
  const {createApp,ref,computed,nextTick,onMounted,onBeforeUnmount} = Vue;
  const key = 'bjtu-scientific-value-ops-v1';
  const title = '科学数据张量底座与Token化价值运营平台';
  const fmt = n => Number(n || 0).toLocaleString('zh-CN');
  const dec = n => Number(n || 0).toFixed(2);
  const pct = (n,d) => (d ? n/d*100 : 0).toFixed(1)+'%';
  const stamp = t => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'short'}).format(new Date(t));
  const oldPages=['home','intake','prepare','encode','indexes','versions','activity','search','evaluate'];
  function parse() {
    const [g,p]=location.hash.replace(/^#\/?/,'').split('/');
    if(oldPages.includes(g))return {g:'vector',p:g};
    if(g==='vector')return {g,p:oldPages.includes(p)?p:'home'};
    if(g==='tools' || g==='value')return {g,p:N[g].some(x=>x.id===p)?p:N[g][0].id};
    return {g:'platform',p:'platform'};
  }
  const Pill = {props:['text'],template:'<span class="pill" :class="tone">{{text}}</span>',computed:{tone(){return ['已确认','已核销','已入账','已验收'].includes(this.text)?'ok':['待核验','待验收','待修订','待核销'].includes(this.text)?'wait':this.text==='待交付'?'workpill':'';}}};
  const Empty = {props:['text'],template:'<p class="empty">{{text}}</p>'};
  const Metric = {props:['item'],template:'<article class="metric"><div><span>{{item[0]}}</span><i class="mini-tile" :class="item[3]"><ico :name="item[2]" :size="18"></ico></i></div><b>{{item[1]}}</b><small>{{item[4]}}</small></article>'};
  const Mixbar = {props:['p'],template:'<div class="mixbar" role="img" :aria-label="\'主体分配 \'+p.net+\'，运营成本 \'+p.cost+\'，供给留存 \'+p.reserve"><i v-for="(v,i) in [p.net,p.cost,p.reserve]" :class="\'s\'+i" :style="{width:(p.gross?v/p.gross*100:0)+\'%\'}"></i></div>'};
  const LogTable = {props:['rows'],emits:['show'],methods:{stamp},template:'<div class="tablewrap"><table><thead><tr><th>操作</th><th>关联编号</th><th>业务说明</th><th>时间（北京时间）</th></tr></thead><tbody><tr v-for="l in rows"><td>{{l.action}}</td><td><button class="text-link mono" @click="$emit(\'show\',l)">{{l.ref}}</button></td><td>{{l.detail}}</td><td class="muted">{{stamp(l.time)}}</td></tr></tbody></table></div>'};
  const app=createApp({setup(){
    const route=ref(parse()),group=computed(()=>route.value.g),page=computed(()=>route.value.p),vectorFrame=ref(null);
    const navigation=computed(()=>N[group.value]||[]),navGroups=computed(()=>[...new Set(navigation.value.map(n=>n.section))]);
    const info=computed(()=>navigation.value.find(n=>n.id===page.value)||{});
    const vectorSource=computed(()=>'./vector.html#/'+page.value);
    const offline=!!window.BJTU_OFFLINE;
    const state=ref(null), storageWarning=ref(''), toast=ref(''), err=ref('');let timer;
    function readStore(){const data=localStorage.getItem(key);return data?JSON.parse(data):null;}
    try{state.value=readStore()||O.seed();if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state.value));}
    catch{state.value=O.seed();storageWarning.value='浏览器暂不允许本地保存，本次演示的操作仅在当前会话有效。';}
    const applied=ref(O.clone(O.defaultRule)),draftRule=ref(O.clone(O.defaultRule));
    const dirty=computed(()=>JSON.stringify(applied.value)!==JSON.stringify(draftRule.value));
    const preview=computed(()=>O.simulate(state.value,applied.value));
    const pending=computed(()=>state.value.events.filter(e=>e.state==='待核验'));
    const openTasks=computed(()=>state.value.tasks.filter(t=>t.state!=='已验收'));
    const blockingUses=computed(()=>state.value.uses.filter(u=>!u.batch && pending.value.some(e=>e.id===u.event)));
    const poolParts=computed(()=>[['主体分配',preview.value.net],['运营成本',preview.value.cost],['供给留存',preview.value.reserve]]);
    const chart=computed(()=>[...state.value.batches.slice(0,3).reverse().map(b=>({label:b.id,p:b})),{label:'本期试算',p:preview.value}]);
    const maxGross=computed(()=>Math.max(1,...chart.value.map(b=>b.p.gross)));
    const available=computed(()=>O.reserveBalance(state.value));
    const todo=computed(()=>[{route:'evidence',tone:'blue',icon:'audit',label:'待核验贡献',note:'检查业务凭据与重复事件',n:pending.value.length},{route:'rights',tone:'violet',icon:'box',label:'待核销权益',note:'核对服务凭证与使用回执',n:state.value.vouchers.filter(v=>voucherStatus(v)==='待核销').length},{route:'supply',tone:'teal',icon:'tasks',label:'待处理供给',note:'完成交付或质量验收',n:openTasks.value.length}]);
    const query=ref(''), eventFilter=ref('全部'),meterFilter=ref(''),taskFilter=ref(''),account=ref(0),traceQuery=ref(''),traceKind=ref('');
    const eventList=computed(()=>state.value.events.filter(e=>(eventFilter.value==='全部'||eventFilter.value===e.state)&&[e.id,e.ref,O.actors[e.actor],state.value.resources[e.r].name].join(' ').toLowerCase().includes(query.value.toLowerCase())));
    const evidenceStats=computed(()=>['待核验','已确认','已排除'].map((x,i)=>[x,fmt(state.value.events.filter(e=>e.state===x).length),['audit','tasks','filter'][i],['amber','teal','violet'][i],['需核对凭据 · 条','含历史已结算事件 · 条','保留排除理由 · 条'][i]]));
    const meterStats=computed(()=>state.value.resources.map((r,i)=>[O.sides[i]+'本期用量',fmt(O.total(state.value.uses.filter(u=>!u.batch && u.r===i).map(u=>u.qty))),['database','tool','nodes'][i],['blue','violet','teal'][i],r.name+' · '+O.units[i]]));
    const meterList=computed(()=>state.value.uses.filter(u=>meterFilter.value===''||u.r===Number(meterFilter.value)));
    const batchStats=computed(()=>[['结算批次',fmt(state.value.batches.length),'book','blue','保留计算快照 · 批'],['累计主体入账',fmt(O.total(state.value.batches.map(b=>b.net))),'income','teal','各参与方分配总额 · Token'],['累计供给留存',fmt(O.total(state.value.batches.map(b=>b.reserve))),'branch','violet','历次结算计提 · Token']]);
    const supplyStats=computed(()=>[['可立项额度',fmt(available.value),'income','teal','已结算的可用留存 · Token'],['任务已锁定',fmt(O.total(openTasks.value.map(t=>t.budget))),'tasks','blue','待交付或验收 · Token'],['已发放激励',fmt(O.total(state.value.tasks.filter(t=>t.state==='已验收').map(t=>t.budget))),'box','violet','已进入责任主体账户 · Token']]);
    const taskList=computed(()=>state.value.tasks.filter(t=>!taskFilter.value||t.state===taskFilter.value));
    const myVouchers=computed(()=>state.value.vouchers.filter(v=>v.actor===account.value));
    const logKinds=computed(()=>[...new Set(state.value.log.map(l=>l.action))]);
    const traceList=computed(()=>state.value.log.filter(l=>(!traceKind.value||l.action===traceKind.value)&&[l.id,l.ref,l.action,l.detail].join(' ').toLowerCase().includes(traceQuery.value.toLowerCase())));
    const guide=[
      ['meter','先核对收入来源','查看三侧流水。演示起点有 940 条取数、58 次工具作业和 29 次智能体调用，合计 4,229 Token。'],
      ['evidence','确认谁参与了贡献','确认 JOB-11-3 的有效回执，再与原始 JOB-11-1 对照，排除重复上报。'],
      ['rules','说明每个主体分得多少','核对三侧权重和综合得分；成本、供给留存计提后，剩余额度按主体得分分配。'],
      ['ledger','核对分配结果','确认入账后打开最新批次的快照，查看收益来源、计算规则和两种后续用途。'],
      ['rights','用途一 · 兑换科研服务','在主体账户中兑换数据访问额度，再登记核销；这次使用回到计量台账。'],
      ['supply','用途二 · 支持下一轮供给','打开 BX-17 盐度补录任务，交付并验收后查看新版本、奖励及维护凭据。']
    ];
    const handoff=computed(()=>N.handoffs[page.value]);
    const period=ref('');
    const historical=computed(()=>state.value.batches.find(b=>b.id===period.value));
    const overviewPool=computed(()=>historical.value||preview.value);
    const incomeSides=computed(()=>O.sides.map((side,i)=>{
      const uses=overviewPool.value.usages.filter(u=>u.r===i);
      return {side,amount:O.total(uses.map(u=>u.amount)),uses};
    }));
    const priorRule=ref(O.clone(O.defaultRule));
    const prior=computed(()=>O.simulate(state.value,priorRule.value));
    const drill=ref({title:'',uses:[]});
    function showUses(title,uses){drill.value={title,uses};open('uses');}
    function versionUses(t){return state.value.uses.filter(u=>u.r===t.r && u.version===t.delivery.version);}
    function overviewAction(){
      if(historical.value)return showBatch(historical.value);
      if(pending.value.length)return goReview();
      location.hash=preview.value.gross && preview.value.score ? '/value/rules':'/value/meter';
    }
    const overviewLabel=computed(()=>historical.value?'查看本批结算快照':pending.value.length?'处理待核验贡献（'+pending.value.length+'）':preview.value.gross && preview.value.score?'进入分配试算':'登记下一笔使用');
    const pathway=computed(()=>[
      {route:'meter',title:'登记使用',icon:'pulse',detail:'按用量和单价归集收入',measure:preview.value.usages.length+' 笔待结流水'},
      {route:'evidence',title:'核验贡献',icon:'audit',detail:'将有效工作归属到主体',measure:pending.value.length+' 条待核验'},
      {route:'rules',title:'试算分配',icon:'income',detail:'按得分计算主体分成',measure:fmt(preview.value.net)+' Token 待分配'},
      {route:'ledger',title:'确认入账',icon:'book',detail:'固化规则与分配明细',measure:state.value.batches.length+' 个已结批次'}
    ]);
    const meterRevenue=computed(()=>state.value.resources.map((_,i)=>O.total(preview.value.usages.filter(u=>u.r===i).map(u=>u.amount))));
    const integrationCount=computed(()=>state.value.bridgeReceipts?.length||0);
    const dialog=ref(null),dialogKind=ref(''),form=ref({}),picked=ref(null),objectId=ref(''),settleDraft=ref(null),scoreRule=ref(applied.value);
    const kinds={uses:'使用流水明细',declare:'申报基础贡献',reset:'恢复收益分配与供给演示起点',guide:'演示指引',evidence:'贡献凭据',use:'登记有效使用',score:'综合贡献计算依据',settle:'确认本期结算',batch:'结算快照',issue:'兑换服务权益',redeem:'登记服务核销',plan:'新建供给任务',task:'供给交付与验收',log:'业务记录详情'};
    const dialogTitle=computed(()=>kinds[dialogKind.value]);
    const objectGroup={evidence:'events',task:'tasks',redeem:'vouchers',batch:'batches',log:'log'};
    const obj=computed(()=>state.value[objectGroup[dialogKind.value]]?.find(x=>x.id===objectId.value));
    const duplicateRecord=computed(()=>{
      if(dialogKind.value!=='evidence' || !obj.value || obj.value.state==='已确认')return null;
      return state.value.events.find(e=>e.id!==obj.value.id && e.state==='已确认' && e.actor===obj.value.actor && e.ref===obj.value.ref);
    });
    function say(s){toast.value=s;clearTimeout(timer);timer=setTimeout(()=>toast.value='',3800);}
    function open(kind,id='',fields={}){err.value='';dialogKind.value=kind;objectId.value=id;form.value=fields;nextTick(()=>{if(!dialog.value.open)dialog.value.showModal();dialog.value.scrollTop=0;});}
    function close(){dialog.value?.close();dialogKind.value='';err.value='';}
    function backdrop(e){if(e.target!==dialog.value)return;const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();}
    function onRoute(){close();route.value=parse();document.title=(info.value.title|| (group.value==='vector'?'Token张量向量库':'北交大模块'))+' · '+title;window.scrollTo(0,0);}
    function onStore(e){if(e.key===key && e.newValue)try{state.value=JSON.parse(e.newValue);}catch{}if(e.key===window.ScienceBridge?.key)syncUsage();}
    function onIntegrationMessage(e){if(e.origin===location.origin&&e.source===vectorFrame.value?.contentWindow&&e.data?.channel==='bjtu-science-bridge')captureUsage(e.data.event);}
    onMounted(()=>{onRoute();syncUsage();window.addEventListener('hashchange',onRoute);window.addEventListener('storage',onStore);window.addEventListener('message',onIntegrationMessage);});
    onBeforeUnmount(()=>{window.removeEventListener('hashchange',onRoute);window.removeEventListener('storage',onStore);window.removeEventListener('message',onIntegrationMessage);});
    const busy=ref(false);
    async function mutate(fn,done){
      if(busy.value)return;busy.value=true;err.value='';
      try{
        const work=()=>{
          let latest=state.value;
          if(!storageWarning.value) latest=readStore()||latest;
          const candidate=O.clone(latest),result=fn(candidate);
          if(!storageWarning.value)localStorage.setItem(key,JSON.stringify(candidate));
          state.value=candidate; done?.(result);
        };
        if(navigator.locks?.request)await navigator.locks.request(key,work);else work();
      }catch(e){err.value=e.name==='QuotaExceededError'?'浏览器存储已满，本次修改未保存。':e.message;}finally{busy.value=false;if(syncAgain&&!syncing)syncUsage();}
    }
    function captureUsage(event){if(event?.type==='usage.succeeded')syncUsage();}
    let syncing=false,syncAgain=false;
    async function syncUsage(){
      if(syncing){syncAgain=true;return;}
      if(busy.value){syncAgain=true;return;}
      syncing=true;
      try{
        do{
          syncAgain=false;
          const events=(window.ScienceBridge?.list('usage.succeeded')||[]).filter(e=>!state.value.bridgeIgnored?.includes(e.eventId)&&!state.value.bridgeReceipts?.some(x=>x.eventId===e.eventId));
          if(events.length)await mutate(s=>events.map(e=>O.importUsage(s,e)),usages=>{
            usages.forEach((u,i)=>window.ScienceBridge?.update(events[i].eventId,'已计量待核验',{useId:u.id}));
            say('已关联 '+usages.length+' 条跨模块使用，新增贡献凭据待核验。');
          });
        }while(syncAgain);
      }finally{syncing=false;}
    }
    function showEvidence(e){if(e)open('evidence',e.id,{note:e.ref==='JOB-11-1'&&e.state==='待核验'?'重复使用相同业务凭据。':'已核对主体、版本与有效用量。'});}
    function review(pass){const id=objectId.value,memo=form.value.note;mutate(s=>O.review(s,id,pass,memo),()=>{close();say(pass?'已确认，可参与本期分配。':'已保存排除理由。');});}
    function resetDemo(){mutate(s=>{Object.assign(s,O.seed());s.bridgeReceipts=[];s.bridgeIgnored=(window.ScienceBridge?.list('usage.succeeded')||[]).map(e=>e.eventId);},()=>{period.value='';priorRule.value=O.clone(O.defaultRule);applied.value=O.clone(O.defaultRule);draftRule.value=O.clone(applied.value);close();say('收益分配与供给演示已恢复起点；旧联动事件不重复导入。');});}
    function startDeclare(){open('declare','',{actor:0,r:0,qty:100,grade:'A',ref:'DEL-'+(state.value.serial+1),proof:''});}
    function declareEvent(){const f=O.clone(form.value);mutate(s=>O.declare(s,f),e=>{close();eventFilter.value='待核验';query.value='';say('已创建待核验贡献 '+e.id);});}
    function startUse(){open('use','',{r:0,qty:100,reference:'JOB-DEMO-'+(state.value.serial+1)});}
    function addUse(){const f={...form.value};mutate(s=>O.registerUse(s,f.r,f.qty,f.reference),u=>{close();say('已登记 '+u.id+' 并生成 '+u.event);});}
    function applyRule(){try{O.simulate(state.value,draftRule.value);if(dirty.value)priorRule.value=O.clone(applied.value);applied.value=O.clone(draftRule.value);err.value='';say('分配建议已重新计算。');}catch(e){err.value=e.message;}}
    function resetRule(){draftRule.value=O.clone(O.defaultRule);applyRule();}
    const scoreTotal=ref(0),scoreNet=ref(0);
    function showScore(r,rule=applied.value,base=preview.value){scoreTotal.value=base.score;scoreNet.value=base.net;picked.value=r;scoreRule.value=rule;open('score');}
    function openSettle(){settleDraft.value=O.clone(preview.value);open('settle');}
    function goReview(){close();eventFilter.value='待核验';query.value='';location.hash='/value/evidence';}
    function confirmSettle(){const expected=JSON.stringify(settleDraft.value),rule=O.clone(applied.value);
      mutate(s=>{if(JSON.stringify(O.simulate(s,rule))!==expected)throw Error('数据已变化，请关闭窗口并重新核对试算结果。');return O.settle(s,rule);},p=>{close();location.hash='/value/ledger';say('已生成结算批次 '+p.id);});}
    function showAccount(actor){close();account.value=actor;location.hash='/value/rights';}
    function showBatch(b){open('batch',b.id);}
    function exportFile(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
    function voucherStatus(v){return v.state==='待核销' && Date.parse(v.expires)<Date.now()?'已到期':v.state;}
    function startIssue(i){open('issue','',{index:i,count:1});}
    function issue(){const f=form.value;mutate(s=>O.issue(s,account.value,f.index,f.count),v=>{close();say('已签发 '+v.id);});}
    function startRedeem(v){open('redeem',v.id,{reference:'RCPT-'+v.id});}
    function redeem(){const key=objectId.value,ref=form.value.reference;mutate(s=>O.redeem(s,key,ref),()=>{close();say('核销回执已登记。');});}
    function startPlan(){open('plan','',{title:'',r:0,actor:3,kind:'周期更新',due:new Date(Date.now()+7*86400000).toISOString().slice(0,10),budget:120,minQty:24,criterion:'提交数据变更清单、更新版本与质量复核报告。'});}
    function createPlan(){const f=O.clone(form.value);mutate(s=>O.plan(s,f),t=>{close();taskFilter.value='';say('已建立供给任务 '+t.id);});}
    function showTask(t){const old=state.value.resources[t.r].version;
      const version=old.replace(/\d+$/,n=>Number(n)+1);
      open('task',t.id,{qty:t.delivery?.qty||t.minQty,version:version===old?old+'.1':version,proof:t.delivery?.proof||'QC-'+t.id,note:'已核对交付清单、版本差异与质量报告。'});}
    function deliver(){const k=objectId.value,f=O.clone(form.value);mutate(s=>O.submit(s,k,f),()=>{form.value.note='已核对交付清单、版本差异与质量报告。';say('已提交交付，等待验收。');});}
    function accept(pass){const k=objectId.value,memo=form.value.note;mutate(s=>O.acceptTask(s,k,pass,memo),()=>{if(!pass)showTask(state.value.tasks.find(t=>t.id===k));say(pass?'已发放供给激励，维护贡献已回写。':'已退回修订。');});}
    function showLog(l){open('log',l.id);}
    const logTarget=computed(()=>{const ref=obj.value?.ref;if(dialogKind.value!=='log'||!ref)return null;
      for(const [list,kind] of [['events','evidence'],['uses','use'],['tasks','task'],['batches','batch'],['vouchers','voucher']]){
        const x=state.value[list].find(v=>v.id===ref);if(x)return {kind,x};
      }return null;});
    function openTarget(){const {kind,x}=logTarget.value;
      if(kind==='use')showEvidence(state.value.events.find(e=>e.id===x.event));else if(kind==='task')showTask(x);
      else if(kind==='evidence')showEvidence(x);else if(kind==='batch')showBatch(x);else{close();account.value=x.actor;location.hash='/value/rights';}}
    return {O,period,historical,incomeSides,priorRule,prior,drill,showUses,versionUses,overviewAction,overviewLabel,duplicateRecord,scoreTotal,scoreNet,handoff,overviewPool,pathway,meterRevenue,integrationCount,captureUsage,vectorFrame,modules:N.modules,group,page,info,navigation,navGroups,vectorSource,offline,state,storageWarning,toast,err,fmt,dec,pct,stamp,preview,applied,draftRule,dirty,pending,openTasks,blockingUses,poolParts,chart,maxGross,todo,query,eventFilter,eventList,evidenceStats,meterFilter,meterList,meterStats,batchStats,supplyStats,account,myVouchers,taskFilter,taskList,traceQuery,traceKind,traceList,logKinds,guide,dialog,dialogKind,dialogTitle,form,picked,scoreRule,obj,settleDraft,logTarget,openTarget,resetDemo,startDeclare,declareEvent,open,close,backdrop,showEvidence,review,startUse,addUse,applyRule,resetRule,showScore,openSettle,goReview,confirmSettle,showAccount,showBatch,exportFile,voucherStatus,startIssue,issue,startRedeem,redeem,startPlan,createPlan,showTask,deliver,accept,showLog};
  }});
  app.component('ico',Icon).component('pill',Pill).component('empty',Empty).component('metric',Metric).component('mixbar',Mixbar).component('logtable',LogTable).component('tool-workspace',window.ToolWorkspace).mount('#portal');
})();
