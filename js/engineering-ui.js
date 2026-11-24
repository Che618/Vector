function useEngineering({s,selected,current,indexed,go,err,say,persist,clearHits}) {
  const {ref,reactive,computed,watch}=Vue, E=Engineering;
  const rules=reactive(E.defaultRules()),quality=ref(null),qFilter=ref(''),qualityPage=ref(1);
  const strategy=ref('vector'),liveWeight=ref(.6),eventFilter=ref(''),eventId=ref(''),eventPage=ref(1);
  const target=ref(indexed.value[0]?.id||''),addition=ref(''),memo=ref(''),batch=ref(null),compareNo=ref(1);
  const versionSource=computed(()=>indexed.value.find(d=>d.id===target.value)||indexed.value[0]);
  const k=ref(3),weight=ref(.6),reportId=ref(s.experiments[0]?.id||''),inspectQ=ref(''),caseMode=ref('all');
  const caseForm=reactive({show:false,q:'',ds:'',i:0});
  const textIndexes=computed(()=>indexed.value.filter(d=>d.mode==='text'));
  const candidates=computed(()=>[...E.testCases,...s.customCases].filter(a=>caseMode.value==='all'||(caseMode.value==='custom'?!a.id.startsWith('Q-'):a.id.startsWith('Q-'))));
  const availableCases=computed(()=>candidates.value.filter(a=>{const d=textIndexes.value.find(d=>d.id===a.ds);return d&&a.ids.every(i=>d.records[i])}));
  const caseDocs=computed(()=>textIndexes.value.find(d=>d.id===caseForm.ds)?.records||[]);
  const report=computed(()=>s.experiments.find(r=>r.id===reportId.value));
  const inspected=computed(()=>report.value?.rows.find(q=>q.id===inspectQ.value));
  const qualityRows=computed(()=>quality.value?.rows.filter(r=>!qFilter.value||(qFilter.value==='excluded'?r.flag!=='kept':r.flag==='kept'))||[]);
  const visibleQuality=computed(()=>qualityRows.value.slice((qualityPage.value-1)*8,qualityPage.value*8));
  const history=computed(()=>versionSource.value?.releases?.slice().reverse()||[]);
  const comparison=computed(()=>{
    const d=versionSource.value;if(!d)return null;
    const refVer=d.releases.find(v=>v.n===Number(compareNo.value))||d.releases[0];
    const active=d.releases.find(v=>v.n===d.active),all=d.records.concat(d.inactiveTail||[]);
    return {base:refVer.n,now:active.n,delta:active.count-refVer.count,rows:all.slice(Math.min(refVer.count,active.count),Math.max(refVer.count,active.count))};
  });
  const eventNames=computed(()=>[...new Set(s.events.map(e=>e.action))]);
  const events=computed(()=>s.events.filter(e=>!eventFilter.value||e.action===eventFilter.value));
  const activeEvent=computed(()=>events.value.find(e=>e.id===eventId.value));
  const clock=t=>new Date(t).toLocaleString('zh-CN',{hour12:false});
  function record(action,d,detail,count){E.audit(s,action,d,detail,count)}
  function saveNotice(message){if(persist())say(message)}
  function download(file,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=file;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  function resetQC(){quality.value=null;qFilter.value='';qualityPage.value=1;err.value=''}
  watch(rules,resetQC,{flush:'sync'});watch(()=>[selected.value,current.value.active,current.value.records?.length,current.value.state],resetQC,{flush:'sync'});watch(qFilter,()=>qualityPage.value=1);
  watch(eventFilter,()=>{eventPage.value=1;eventId.value=''},{flush:'sync'});
  function checkQuality(){
    try{quality.value=E.prepare((current.value.state==='已索引'?current.value.records:current.value.rawInput||current.value.records),current.value.mode,rules);qualityPage.value=1;err.value='';
      record('质检预览',current.value,'按当前规则检查原始记录，保留 '+quality.value.stats.kept+' 条，输出 '+quality.value.stats.output+' 个片段。',quality.value.stats.input);persist();
    }catch(ex){quality.value=null;err.value=ex.message}
  }
  function sampleQC(){
    if(s.sources.length>=80){err.value='本地数据源已达 80 个上限。';return}
    const records=Model.parse(E.sampleInput),d={id:'DS-'+(++s.serial),name:'近岸浮标质检案例',domain:'海洋科学',mode:'text',format:'TXT',origin:'内置质检案例',created:Date.now(),records,state:'待编码'};
    s.sources.unshift(d);selected.value=d.id;Object.assign(rules,E.defaultRules());go('prepare');record('数据登记',d,'载入含重复、过短及无效记录的示例。',records.length);checkQuality();
  }
  function applyQuality(){
    const q=quality.value;if(!q?.out.length){err.value='当前方案没有可编码片段。';return}
    let d=current.value;const base=d.state==='已索引'?d.records:d.rawInput||d.records;
    if(d.state==='已索引'){
      if(s.sources.length>=80){err.value='当前索引受版本保护，创建派生数据源需要一个空余名额。';return}
      const parent=d;
      d={id:'DS-'+(++s.serial),name:parent.name+' · 质检派生',domain:parent.domain,mode:parent.mode,format:parent.format,origin:parent.origin,created:Date.now(),parent:{id:parent.id,version:parent.active},state:'待编码'};
      s.sources.unshift(d);
    }
    d.rawInput=base.map(r=>{const t={...r};delete t.vec;return t});
    d.records=q.out;d.state='待编码';d.quality={rules:{...rules},stats:{...q.stats},at:Date.now()};
    record('采用分片方案',d,'原始 '+q.stats.input+' 条，排除 '+(q.stats.input-q.stats.kept)+' 条；片长 '+rules.width+'，重叠 '+rules.overlap+'。',q.out.length);
    selected.value=d.id;go('encode');saveNotice('已采用质检方案，下一步可生成 '+q.out.length+' 条向量。');
  }
  function versionOf(d){target.value=d.id;go('versions')}
  function resetBatch(){batch.value=null;err.value=''}
  watch(target,()=>{addition.value='';memo.value='';compareNo.value=1;resetBatch()},{flush:'sync'});
  watch(addition,resetBatch,{flush:'sync'});
  function addExample(){
    const d=versionSource.value,rev=d.releases.at(-1).n+1;
    const prefix=d.domain==='海洋科学'?'海温剖面':d.domain==='天文科学'?'恒星光谱':d.domain==='生命科学'?'实验样本':'时序观测';
    if(d.mode==='numeric'){
      const base=JSON.parse(d.records[0].text),shift=(a)=>Array.isArray(a)?a.map(shift):Number((a+.15*rev).toPrecision(12));addition.value=JSON.stringify([base,shift(base)]);
    }else if(d.format==='CSV'){
      const raw=JSON.parse(d.records[0].original),quote=v=>'"'+String(v).replaceAll('"','""')+'"';
      addition.value=[raw.columns,raw.values,raw.values.map((v,i)=>i===0?v+'-V'+rev:v)].map(row=>row.map(quote).join(',')).join('\n');
    }else{
      const items=[d.records[0].text,'补测站位 BJ-'+rev+' 本批次新增'+prefix+'记录，附带校准时间和质量标记。'];
      addition.value=d.format==='JSON'?JSON.stringify(items):items.join('\n');
    }
    memo.value='追加第 '+rev+' 批观测样本';
  }
  function previewBatch(){
    try{batch.value=E.incremental(versionSource.value,addition.value);err.value=''}catch(ex){batch.value=null;err.value=ex.message}
  }
  function publishBatch(){
    try{const d=versionSource.value,b=batch.value;if(!b)throw Error('请先预检本批数据。');
      const rev=E.release(d,b,memo.value);compareNo.value=rev.n-1;record('发布索引版本',d,rev.summary+'；跳过 '+b.omitted.length+' 条重复记录。',rev.added);
      addition.value='';memo.value='';batch.value=null;clearHits();saveNotice('v'+rev.n+' 已启用，新增记录可立即检索。')
    }catch(ex){err.value=ex.message}
  }
  function switchVersion(n){
    const d=versionSource.value,from=d.active;E.activate(d,n);compareNo.value=from;resetBatch();clearHits();
    record('切换索引版本',d,'从 v'+from+' 切换到 v'+n+'；检索范围已同步。',d.records.length);saveNotice('检索服务当前使用 v'+n+'。')
  }
  function startCase(){caseForm.show=true;caseForm.q='';caseForm.ds=textIndexes.value[0]?.id||'';caseForm.i=0}
  function addCase(){
    const q=caseForm.q.trim(),d=textIndexes.value.find(x=>x.id===caseForm.ds);
    try{if(!q||!d?.records[caseForm.i])throw Error('请填写查询，并指定预期命中的片段。');Model.embed(q);
      if(s.customCases.length>=30)throw Error('演示最多保存 30 条自定义标注。');
      s.customCases.push({id:'U-'+Date.now().toString(36),q,ds:d.id,ids:[Number(caseForm.i)]});
      caseForm.show=false;err.value='';saveNotice('评测题已保存。')
    }catch(ex){err.value=ex.message}
  }
  function runEval(){
    try{if(!availableCases.value.length)throw Error('当前没有可用标注，请添加评测题或切换题集。');
      const r=E.evaluate(textIndexes.value,availableCases.value,k.value,weight.value);
      s.experiments.unshift(r);if(s.experiments.length>8)s.experiments.length=8;reportId.value=r.id;inspectQ.value=r.rows[0].id;err.value='';
      record('检索评测',null,r.id+'；Top '+r.k+'，向量权重 '+r.alpha+'，比较三种策略。',r.rows.length);saveNotice('实验完成，可查看每题的排序与相关片段。')
    }catch(ex){err.value=ex.message}
  }
  function exportRun(){if(report.value)download(report.value.id+'.json',report.value)}
  function exportEvents(){download('向量工作台运行记录.json',{exportedAt:new Date().toISOString(),events:events.value})}
  watch(reportId,()=>{inspectQ.value=report.value?.rows[0]?.id||''},{flush:'sync'});
  return {rules,quality,qFilter,qualityPage,qualityRows,visibleQuality,checkQuality,applyQuality,sampleQC,resetQC,strategy,liveWeight,
    target,addition,memo,batch,compareNo,versionSource,history,comparison,versionOf,addExample,previewBatch,publishBatch,switchVersion,
    k,weight,reportId,inspectQ,caseMode,caseForm,caseDocs,availableCases,candidates,textIndexes,report,inspected,runEval,startCase,addCase,exportRun,
    eventFilter,eventPage,eventId,events,activeEvent,eventNames,exportEvents,clock,record,names:E.strategyNames};
}
