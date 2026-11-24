/* Quality controls, append-only index releases and retrieval experiments. */
const Engineering = (() => {
  const strategyNames = {vector:'向量余弦',bm25:'关键词 BM25',hybrid:'混合检索'};
  const guidePages = [
    ['prepare','分片与质检','shield','数据与索引','来源片段、分片规则、质检报告、保留与排除明细','载入质检案例、预览规则、采用方案并编码','过滤重复和无效记录，保留来源位置与字符范围。'],
    ['versions','索引版本','branch','索引运维','当前版本、增量批次、历史版本、版本差异','预检增量、发布新版本、切换版本','新增片段进入检索范围，切换旧版本可复现旧索引。'],
    ['evaluate','检索评测','flask','检索服务','标注查询、实验参数、逐题结果、实验报告','添加评测题、运行对比、查看命中、导出报告','在同一批向量上比较 BM25、向量和混合排序。'],
    ['activity','运行记录','audit','索引运维','操作时间、对象、版本、处理数量、执行说明','按动作筛选、展开凭据、导出记录','核对本机实际发生的入库、版本切换和评测操作。']
  ];
  const guideOrder=['home','intake','prepare','encode','indexes','versions','activity','search','evaluate'];
  const sampleInput=[
   '北太平洋浮标 BX-17 于上午记录海表温度，传感器位于海面下两米。复测时保留校准批次、观测时间以及对应的盐度记录，以便回溯不同深度的海温变化。',
   '站点 K-06 在近岸区观测到温跃层，剖面数据按深度顺序排列。',
   '站点 K-06 在近岸区观测到温跃层，剖面数据按深度顺序排列。',
   '———','备注','夜间观测中断十四分钟，质量标记保留缺测原因及恢复采样的时间。'
  ].join('\n');
  const defaultRules=()=>({min:6,width:42,overlap:8,unique:true});
  function keyOf(record,mode) {
    if(mode==='numeric')return JSON.stringify(record.shape)+'/'+JSON.stringify(record.raw);
    return record.text.normalize('NFKC').toLowerCase().replace(/\s+/g,'').trim();
  }
  function prepare(records,mode,rules){
    const {min,width,overlap,unique}=rules;
    if(mode==='text'&&(!Number.isInteger(width)||width<12||width>1400||!Number.isInteger(overlap)||overlap<0||overlap>=width||!Number.isInteger(min)||min<1||min>width))
      throw Error('分片长度须为 12–1,400，重叠量须小于片长，最短保留长度须介于 1 与片长之间。');
    const seen=new Map(),rows=[],out=[];
    const stats={input:records.length,kept:0,duplicate:0,invalid:0,short:0,output:0};
    for(const [index,src] of records.entries()){
      const record={...src};delete record.vec;
      const key=keyOf(record,mode),chars=Array.from(record.text);
      let reason='',flag='kept';
      if(mode==='numeric'?!record.raw.some(v=>v!==0):!/[\p{L}\p{N}]/u.test(record.text)){flag='invalid';reason=mode==='numeric'?'零张量无法归一化':'缺少可编码字符'}
      else if(mode==='text'&&chars.length<min){flag='short';reason='短于 '+min+' 个字符'}
      else if(unique&&seen.has(key)){flag='duplicate';reason='与 '+seen.get(key)+' 重复'}
      const entry={loc:record.loc,text:record.text,flag,reason,count:0};stats[flag]++;rows.push(entry);
      if(flag!=='kept')continue;
      seen.set(key,record.loc);
      if(mode==='numeric'){out.push(record);entry.count=1;continue}
      for(let start=0;start<chars.length;start+=width-overlap){
        const end=Math.min(chars.length,start+width),part=chars.slice(start,end).join('');
        if(/[\p{L}\p{N}]/u.test(part)){
          const offset=record.start||0,sourceLoc=record.sourceLoc||record.loc;
          out.push({...record,text:part,sourceText:record.sourceText||record.text,sourceLoc,start:offset+start,end:offset+end,loc:sourceLoc+' · 字符 '+(offset+start+1)+'–'+(offset+end),sourceRow:index});entry.count++;
        }
        if(end===chars.length)break;
      }
    }
    stats.output=out.length;
    if(out.length>360)throw Error('分片超过单个数据源的 360 条上限，请增大片长或减少输入。');
    return {stats,rows,out};
  }
  function init(s){
    if(!s.events)s.events=[];
    if(!s.experiments)s.experiments=[];
    if(!s.customCases)s.customCases=[];
    s.sources.filter(d=>d.state==='已索引').forEach(ensureRelease);
  }
  function ensureRelease(d){
    if(!d.releases?.length){
      d.releases=[{n:1,count:d.records.length,added:d.records.length,at:d.indexedAt||d.created,summary:'首次索引',origin:d.origin}];
      d.active=1;
    }
  }
  function incremental(d,input){
    const latest=d.releases[d.releases.length-1];
    if(d.active!==latest.n)throw Error('请先启用最新版本，再追加增量。');
    const parsed=Model.parse(input,d.mode==='numeric'?'json':d.format.toLowerCase(),d.mode);
    const seen=new Set(d.records.map(r=>keyOf(r,d.mode))),next=[],omitted=[];
    for(const r of parsed){
      if(d.mode==='numeric'&&String(r.shape)!==String(d.records[0].shape))throw Error('新增张量形状与当前索引不一致。');
      const k=keyOf(r,d.mode);
      if(seen.has(k)){omitted.push(r.loc);continue}
      seen.add(k);
      next.push({...r,loc:'v'+(latest.n+1)+' 增量 · '+r.loc,vec:Model.encode(r,d.mode)});
    }
    if(d.records.length+next.length>360)throw Error('发布后记录数将超过单个索引的 360 条上限。');
    return {input:parsed.length,omitted,next,base:latest.n,source:d.id};
  }
  function release(d,batch,memo){
    const last=d.releases[d.releases.length-1];
    if(batch.source!==d.id||d.active!==batch.base||last.n!==batch.base)throw Error('索引版本已变化，请重新预检。');
    if(!batch.next.length)throw Error('没有可追加的片段，请调整增量内容。');
    const rev={n:last.n+1,count:d.records.length+batch.next.length,added:batch.next.length,at:Date.now(),summary:memo.trim()||'追加观测记录',origin:'增量录入'};
    d.records.push(...batch.next);d.releases.push(rev);d.active=rev.n;d.indexedAt=rev.at;
    return rev;
  }
  function activate(d,n){
    const v=d.releases.find(r=>r.n===n);if(!v)throw Error('找不到指定版本。');
    const all=d.records.concat(d.inactiveTail||[]);
    d.records=all.slice(0,v.count);d.inactiveTail=all.slice(v.count);d.active=n;
  }
  function audit(s,action,d,detail,count){
    s.events.unshift({id:'EV-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),at:Date.now(),action,ds:d?.id||'全工作台',name:d?.name||'全工作台',version:d?.active||null,detail,count});
    if(s.events.length>200)s.events.length=200;
  }
  // For Chinese, terms are adjacent character pairs. Latin words and station IDs stay intact.
  function terms(text){
    const tokens=[];
    for(const word of text.normalize('NFKC').toLowerCase().match(/[\p{Script=Han}]+|[\p{L}\d]+(?:[-_.][\p{L}\d]+)*/gu)||[]){
      if(/[\p{Script=Han}]/u.test(word)&&word.length>1){
        for(let i=1;i<word.length;i++)tokens.push(word.slice(i-1,i+1));
      }else tokens.push(word);
    }
    return tokens;
  }
  function corpus(sources){
    const docs=[],df=new Map();let total=0;
    for(const d of sources)for(const [i,r] of d.records.entries()){
      const words=terms(r.text),tf=new Map();
      for(const w of words)tf.set(w,(tf.get(w)||0)+1);
      for(const w of tf.keys())df.set(w,(df.get(w)||0)+1);
      total+=words.length;docs.push({ds:d.id,i,version:d.active||1,r,tf,len:words.length});
    }
    return {docs,df,avg:total/Math.max(1,docs.length)};
  }
  function scoreText(c,query){
    const vec=Model.embed(query),words=[...new Set(terms(query))],N=c.docs.length;
    const list=c.docs.map(doc=>{
      let bm25=0;const matched=[];
      for(const w of words){
        const f=doc.tf.get(w);if(!f)continue;
        const df=c.df.get(w),idf=Math.log(1+(N-df+.5)/(df+.5));
        bm25+=idf*f*2.2/(f+1.2*(.25+.75*doc.len/(c.avg||1)));matched.push(w);
      }
      return {ds:doc.ds,i:doc.i,version:doc.version,cosine:Model.dot(vec,doc.r.vec),bm25,matched};
    });
    const max=Math.max(0,...list.map(h=>h.bm25));
    return list.map(h=>({...h,lex:max?h.bm25/max:0}));
  }
  function rank(scores,strategy,alpha=.6){
    return scores.map(h=>({...h,score:strategy==='bm25'?h.bm25:strategy==='vector'?h.cosine:alpha*h.cosine+(1-alpha)*h.lex}))
      .filter(h=>strategy!=='bm25'||h.score>0)
      .sort((a,b)=>b.score-a.score||a.ds.localeCompare(b.ds)||a.i-b.i);
  }
  const testCases=[
    ['海面温度的昼夜波动','DS-1008',[2]],['海水分层温度和含盐量','DS-1008',[1,4,5]],
    ['恒星连续谱的校准通量','DS-1007',[4,2]],['观测时用了多长曝光时间','DS-1003',[3]],
    ['怎样对齐不同模态的样品','DS-1006',[2]],['用显微成像查看细胞的形态','DS-1006',[0,3]],
    ['比较白天和夜间的气温差异','DS-1005',[2]],['传感器异常值质量说明','DS-1002',[3]],
    ['西太平洋海面风速记录','DS-1004',[0]],['统一时间基准','DS-1005',[3]]
  ].map(([q,ds,ids],i)=>({id:'Q-'+String(i+1).padStart(2,'0'),q,ds,ids}));
  function evaluate(sources,cases,k,alpha){
    const c=corpus(sources),snapshot=sources.map(d=>({id:d.id,name:d.name,version:d.active||1,count:d.records.length}));
    const rows=cases.map(item=>{
      const scores=scoreText(c,item.q),out={};
      for(const strategy of Object.keys(strategyNames)){
        const top=rank(scores,strategy,alpha).slice(0,k);
        const position=top.findIndex(h=>h.ds===item.ds&&item.ids.includes(h.i))+1;
        out[strategy]={position,top:top.map(h=>{const d=sources.find(x=>x.id===h.ds);return {ds:h.ds,i:h.i,loc:d.records[h.i].loc,text:d.records[h.i].text,name:d.name,version:h.version,score:h.score}})};
      }
      const d=sources.find(x=>x.id===item.ds);
      return {...item,expected:item.ids.map(i=>({name:d.name,text:d.records[i].text,loc:d.records[i].loc})),out};
    });
    const metrics=Object.fromEntries(Object.keys(strategyNames).map(key=>{
      const ranks=rows.map(r=>r.out[key].position),hits=ranks.filter(Boolean).length;
      return [key,{hits,hit:hits/rows.length,mrr:ranks.reduce((n,p)=>n+(p?1/p:0),0)/rows.length}];
    }));
    return {id:'EXP-'+Date.now().toString(36).toUpperCase(),at:Date.now(),k,alpha,count:c.docs.length,snapshot,metrics,rows};
  }
  return {guidePages,guideOrder,sampleInput,defaultRules,prepare,init,ensureRelease,incremental,release,activate,audit,corpus,scoreText,rank,strategyNames,testCases,evaluate};
})();
