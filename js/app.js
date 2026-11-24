const {createApp,reactive,ref,computed,watch,onMounted,onUnmounted,nextTick}=Vue;
const DsName={props:['d'],setup:()=>({domains:Model.domains}),template:`<div class="source-id"><span class="source-icon" :class="domains[d.domain].tone"><i-c :name="domains[d.domain].ic" :size="18"></i-c></span><div><b>{{d.name}}</b><small>{{d.id}}<span> / </span>{{d.format}}</small></div></div>`};
const Pager={props:['n','total'],emits:['turn'],template:`<div v-if="total>8" class="pager"><span>第 {{n}} / {{Math.ceil(total/8)}} 页</span><button class="btn" :disabled="n<=1" @click="$emit('turn',n-1)">上一页</button><button class="btn" :disabled="n>=Math.ceil(total/8)" @click="$emit('turn',n+1)">下一页</button></div>`};
const EmptyV={props:['msg'],template:'<div class="empty"><i-c name="layers" :size="24"></i-c><span>{{msg}}</span></div>'};
const SpacePlot={props:['points'],emits:['select'],template:`<svg class="plot" viewBox="0 0 290 190" role="group" aria-label="文本向量特征投影，点击散点查看原文"><defs><pattern id="plot-grid" width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" fill="none" stroke="#dfe8f4" stroke-width=".8"/></pattern></defs><rect width="290" height="190" rx="5" fill="#f7faff"/><rect width="290" height="190" fill="url(#plot-grid)"/><path d="M145 8v174M10 95h270" stroke="#bbcce2" stroke-dasharray="3 4"/><text x="273" y="89">X</text><text x="151" y="15">Y</text><g v-for="p in points" class="plot-point" tabindex="0" role="button" :aria-label="p.label" @keydown.enter="$emit('select',p)" @click="$emit('select',p)"><circle :cx="p.x" :cy="p.y" r="7.3" :fill="p.color" opacity=".12"/><circle :cx="p.x" :cy="p.y" r="3.8" :fill="p.color" stroke="white" stroke-width=".65"/><title>{{p.label}}</title></g></svg>`};
const app=createApp({setup(){
 const key='bjtu-vector-demo-v2';let initial;try{let saved=localStorage.getItem(key);initial=saved&&JSON.parse(saved)}catch{}
 const s=reactive(initial?.sources?.length?initial:Model.seed());
 Engineering.init(s);
 const guides=[...Model.guides,...Engineering.guidePages].sort((a,b)=>Engineering.guideOrder.indexOf(a[0])-Engineering.guideOrder.indexOf(b[0])),domains=Model.domains;
 const groups=[...new Set(guides.map(g=>g[3]))], desc={prepare:'比较分片策略和质量规则，核对每条记录的处理原因。',versions:'预检增量、发布索引版本，并复现不同版本下的检索范围。',evaluate:'用有相关性标注的科学查询，复核检索命中和排序效果。',activity:'按时间追踪当前浏览器发生的数据处理、索引维护和检索实验。',intake:'将文本、结构化记录或数值张量解析为带来源位置的片段。',encode:'对已登记片段执行本地编码，核对向量输出后写入索引。',indexes:'浏览已就绪的向量索引、原始片段和编码信息。',search:'在相同编码空间中检索相似向量，回溯每条结果的原始数据。'};
 const page=ref('home'),mobile=ref(false),modal=ref(''),dialogEl=ref(null),fileEl=ref(null),theme=ref('classic'),toast=ref(''),err=ref(''),quick=ref(''),q=ref(''),domain=ref(''),kind=ref(''),selected=ref(s.sources[0].id),subject=ref(null),recIndex=ref(0),recSource=ref(null),backToCollection=ref(false);
 const recordPage=ref(1),browsePage=ref(1),searchMode=ref('text'),scope=ref(''),query=ref(''),topK=ref(5),hits=ref([]),meta=ref('');let timer;
 const draft=reactive({name:'',domain:'海洋科学',mode:'text',format:'txt',input:'',file:''});
 const ds=id=>s.sources.find(d=>d.id===id);
 const current=computed(()=>ds(selected.value)||s.sources[0]),rec=computed(()=>recSource.value?.records[recIndex.value]);
 const pagedRecords=computed(()=>current.value.records.slice((recordPage.value-1)*8,recordPage.value*8));
 const indexed=computed(()=>s.sources.filter(d=>d.state==='已索引').sort((a,b)=>(b.indexedAt||b.created)-(a.indexedAt||a.created)));
 const filtered=computed(()=>indexed.value.filter(d=>(!domain.value||d.domain===domain.value)&&(!kind.value||kind.value===d.mode)&&(d.name+' '+d.id).toLowerCase().includes(q.value.trim().toLowerCase())));
 const info=computed(()=>guides.find(g=>g[0]===page.value)||guides[0]);
 const steps=computed(()=>[{page:'intake',ic:'database',tone:'blue',title:'数据接入',desc:'导入文本、结构化记录或数值张量',stat:s.sources.length+' 个已接入数据源'},{page:'encode',ic:'layers',tone:'violet',title:'向量生成',desc:'编码数据片段，预览并写入向量',stat:s.sources.reduce((n,d)=>n+(d.state!=='待编码'?d.records.length:0),0)+' 条已生成向量'},{page:'search',ic:'nodes',tone:'teal',title:'相似检索',desc:'按相似度召回片段，回溯来源',stat:indexed.value.length+' 个可检索索引'}]);
 const points=computed(()=>{let a=indexed.value.filter(d=>d.mode==='text').flatMap(d=>d.records.map((r,i)=>({ds:d.id,i,xy:Model.project(r.vec),label:d.name+' · '+r.loc,color:domains[d.domain].color})));const maxX=Math.max(.2,...a.map(p=>Math.abs(p.xy[0]))),maxY=Math.max(.2,...a.map(p=>Math.abs(p.xy[1])));return a.map(p=>({...p,x:145+p.xy[0]/maxX*119,y:95-p.xy[1]/maxY*72}))});
 const plotDomains=computed(()=>[...new Set(indexed.value.filter(d=>d.mode==='text').map(d=>d.domain))]);
 const referenceBenchmark=computed(()=>{
   const demo=Model.seed();Engineering.init(demo);
   return Engineering.evaluate(demo.sources.filter(d=>d.mode==='text'),Engineering.testCases,3,.6);
 });
 const examples=computed(()=>searchMode.value==='text'?['海水温度变化','恒星光谱','细胞形态']:['[12.4,11.8,10.6,9.2]']);
 const dim=d=>d.mode==='text'?Model.TEXT_DIM:d.records[0].raw.length;
 const encoderName=d=>d.mode==='text'?'本地文本特征编码器 v1.0':'张量展平与 L2 归一化 v1.0';
 function say(t){toast.value=t;clearTimeout(timer);timer=setTimeout(()=>toast.value='',3200)}
 function persist(){try{localStorage.setItem(key,JSON.stringify(s));return true}catch{say('浏览器存储空间不足，当前操作仅在本次会话有效。');return false}}
 function open(name){modal.value=name;nextTick(()=>{if(dialogEl.value&&!dialogEl.value.open)dialogEl.value.showModal();const body=dialogEl.value?.querySelector('.dlg-body');if(body)body.scrollTop=0})}
 function closeDialog(){if(dialogEl.value?.open)dialogEl.value.close();modal.value=''}
 function go(p){if(page.value!==p){location.hash='/'+p;applyRoute()}else{closeDialog();mobile.value=false}}
 function applyRoute(){let path=location.hash.replace(/^#\/?/,'').split('?')[0];let p=guides.some(g=>g[0]===path)?path:'home';if(page.value!==p){closeDialog();err.value='';page.value=p;window.scrollTo(0,0)}mobile.value=false;document.title=info.value[1]+' · 张量向量库'}
 function themeSwitch(){theme.value=WorkspaceTheme.applyTheme(theme.value==='classic'?'smart':'classic');say('已切换至'+(theme.value==='classic'?'传统':'智能')+'主题')}
 function changeMode(){draft.format=draft.mode==='numeric'?'json':'txt';draft.input='';draft.file='';err.value=''}
 function loadExample(){if(draft.mode==='numeric'){draft.name='海温剖面张量示例';draft.input=Model.numericText;draft.format='json'}else{draft.name='多学科观测笔记';draft.input=Model.demoText;draft.format='txt'}draft.file='';draft.domain=draft.mode==='text'?'其他领域':'海洋科学';err.value='';say('已加载示例，可修改后登记')}
 async function loadFile(e){const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>900000)throw Error('文件超出演示上限，请选择小于 900 KB 的样例。');let ext=file.name.split('.').pop().toLowerCase();if(!(draft.mode==='numeric'?['json']:['txt','csv','json']).includes(ext))throw Error('文件格式与所选数据类型不匹配。');const text=await file.text();draft.input=text;draft.format=ext;draft.file=file.name;if(!draft.name)draft.name=file.name.replace(/\.[^.]+$/,'');err.value=''}catch(ex){err.value=ex.message}}
 const ext=useEngineering({s,selected,current,indexed,go,err,say,persist,clearHits});
 function register(){try{if(!draft.name.trim())throw Error('请填写数据集名称。');const records=Model.parse(draft.input,draft.format,draft.mode);if(s.sources.length>=80)throw Error('本地演示最多登记 80 个数据源。');const d={id:'DS-'+(++s.serial),name:draft.name,domain:draft.domain,mode:draft.mode,format:draft.format.toUpperCase(),origin:draft.file||'粘贴输入',created:Date.now(),state:'待编码',records};s.sources.unshift(d);selected.value=d.id;recordPage.value=1;err.value='';draft.name='';draft.input='';draft.file='';ext.record('数据登记',d,d.origin+' · '+d.format+' · '+d.domain,records.length);go('prepare');if(persist())say('已登记 '+records.length+' 条记录，可预览质检或沿用当前片段。')}catch(ex){err.value=ex.message}}
 function toEncode(d){selected.value=d.id;resetPreview();go('encode')}
 function resetPreview(){recordPage.value=1;err.value=''}
 function generate(){try{const d=current.value;const vectors=d.records.map((r,i)=>{try{const v=Model.encode(r,d.mode);if(v.length!==dim(d)||!v.every(Number.isFinite)||Math.abs(Math.hypot(...v)-1)>.00001)throw Error('向量校验失败');return v}catch(ex){throw Error('片段 '+(i+1)+'：'+ex.message)}});vectors.forEach((v,i)=>d.records[i].vec=v);if(d.state!=='已索引')d.state='已生成';ext.record('向量编码',d,encoderName(d)+' · '+dim(d)+' 维 · 单位范数校验通过。',vectors.length);err.value='';if(persist())say('已生成 '+vectors.length+' 条 '+dim(d)+' 维向量。')}catch(ex){err.value=ex.message}}
 function writeIndex(){const d=current.value;if(d.state!=='已生成')return;d.state='已索引';d.indexedAt=Date.now();Engineering.ensureRelease(d);ext.record('发布索引版本',d,'首次写入，索引可用于检索。',d.records.length);if(persist())say('索引已就绪，可点击“检索此索引”。')}
 const preview=v=>'['+v.slice(0,8).map(n=>n.toFixed(2)).join(', ')+ (v.length>8?', …]':']');
 function exportVectors(d){const out={dataset_id:d.id,name:d.name,encoder:encoderName(d),dimension:dim(d),metric:'cosine',vectors:d.records.map((r,i)=>({vector_id:Model.vectorId(d,i),position:r.loc,source:r.original||r.text,shape:r.shape,values:r.vec}))};const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=d.id+'-vectors.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('向量 JSON 已生成')}
 function browse(d){subject.value=d;browsePage.value=1;open('collection')}
 function showRec(h,back=false){recSource.value=ds(h.ds);recIndex.value=h.i;backToCollection.value=!!back;open('record')}
 function returnCollection(){subject.value=recSource.value;open('collection')}
 function clearHits(){hits.value=[];meta.value='';err.value=''}
 function resetSearchMode(){scope.value='';query.value='';clearHits()}
 function searchSource(d){closeDialog();go('search');searchMode.value=d.mode;scope.value=d.id;query.value=d.mode==='numeric'?d.records[0].text:d.records[0].text.slice(0,100);clearHits()}
 function searchWithRecord(){const d=recSource.value,r=rec.value;searchSource(d);query.value=r.text;runSearch()}
 function quickSearch(){ext.strategy.value='vector';searchMode.value='text';scope.value='';query.value=quick.value||'海水温度变化';go('search');runSearch()}
 function runSearch(){clearHits();try{let text=query.value.trim();if(!text)throw Error('请输入查询内容。');if(text.length>16000)throw Error('查询内容过长，请缩短到 16,000 个字符以内。');let v,shape;if(searchMode.value==='text'){v=Model.embed(text)}else{let a;try{a=JSON.parse(text)}catch{throw Error('请输入一个合法的 JSON 数值数组。')}if(!Array.isArray(a))throw Error('请输入数值数组。');let r=Model.parse(JSON.stringify([a]),'json','numeric')[0];shape=r.shape.join('x');v=Model.normalize(r.raw)}
 let all=indexed.value.filter(d=>d.mode===searchMode.value&&(!scope.value||d.id===scope.value)&&dim(d)===v.length&&(!shape||d.records[0].shape.join('x')===shape));
 if(!all.length)throw Error('没有相同编码类型和形状的已入库索引，请核对维度或先写入索引。');
 const count=all.reduce((n,d)=>n+d.records.length,0);
 const method=searchMode.value==='text'?ext.strategy.value:'vector';
 let list;
 if(searchMode.value==='numeric'){
   list=all.flatMap(d=>d.records.map((r,i)=>({ds:d.id,i,version:d.active,score:Model.dot(v,r.vec)}))).sort((a,b)=>b.score-a.score);
 }else{
   const c=Engineering.corpus(all);
   list=Engineering.rank(Engineering.scoreText(c,text),method,ext.liveWeight.value);
 }
 hits.value=list.slice(0,topK.value);
 meta.value=Engineering.strategyNames[method]+' · 已比较 '+count+' 条向量，返回 '+hits.value.length+' 条片段 · '+v.length+' 维';
 s.searches++;ext.record('查询检索',scope.value?ds(scope.value):null,Engineering.strategyNames[method]+' · '+text.slice(0,90)+' · Top '+topK.value+' · 候选 '+count+' 条。',hits.value.length);persist()}catch(ex){err.value=ex.message}}
 const statusClass=d=>d.state==='已索引'?'ok':d.state==='已生成'?'pending':'warn';
 onMounted(()=>{try{theme.value=WorkspaceTheme.applyTheme(localStorage.getItem('ui-theme')||'classic')}catch{}applyRoute();window.addEventListener('hashchange',applyRoute)});onUnmounted(()=>window.removeEventListener('hashchange',applyRoute));
 return {...ext,referenceBenchmark,s,domains,guides,groups,desc,page,info,mobile,modal,dialogEl,fileEl,theme,toast,err,quick,q,domain,kind,selected,subject,recIndex,recSource,rec,backToCollection,recordPage,browsePage,searchMode,scope,query,topK,hits,meta,draft,ds,current,pagedRecords,indexed,filtered,steps,points,plotDomains,examples,dim,encoderName,open,closeDialog,go,themeSwitch,changeMode,loadExample,loadFile,register,toEncode,resetPreview,generate,writeIndex,preview,exportVectors,browse,showRec,returnCollection,clearHits,resetSearchMode,searchSource,searchWithRecord,quickSearch,runSearch,statusClass,vectorId:Model.vectorId};
}});
app.component('i-c',Icon);app.component('ds-name',DsName);app.component('empty-v',EmptyV);app.component('pager',Pager);app.component('space-plot',SpacePlot);app.mount('#app');
