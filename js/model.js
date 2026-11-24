/* Local, versioned encoders. Input data never leaves the browser. */
const Model=(()=>{
 const domains={
  '海洋科学':{ic:'ocean',tone:'blue',color:'#397ff1'},
  '天文科学':{ic:'star',tone:'violet',color:'#9270df'},
  '生命科学':{ic:'life',tone:'teal',color:'#18a98d'},
  '观测时序':{ic:'wave',tone:'amber',color:'#eba048'},
  '其他领域':{ic:'file',tone:'gray',color:'#8497ab'}
 };
 const guides=[
 ['home','工作台总览','overview','工作空间','三步流程、索引概览、向量空间投影','接入数据、生成向量、相似检索','进入相应操作页面，点击投影点可查看对应片段。'],
 ['intake','数据接入','database','数据与索引','来源登记、文本或数值输入、文件解析、数据源列表','加载示例、选择文件、解析并登记','按文本行、CSV 记录、JSON 记录或张量样本生成可追溯片段。'],
 ['encode','向量生成','layers','数据与索引','数据源、编码器说明、向量预览、质量检查','生成向量、查看完整向量、导出向量、写入索引','对实际输入进行本地编码，显示维度及数值，确认后可检索。'],
 ['indexes','向量索引库','nodes','数据与索引','索引列表、向量维度、原文与坐标','搜索筛选、浏览向量、查看原文、以此检索','定位向量编号和来源记录，在相同编码空间内查找相似片段。'],
 ['search','相似检索','search','检索服务','查询输入、排序策略、编码空间、Top K、得分明细','切换策略、运行检索、查看原文、查看向量','文本支持余弦、BM25 和混合检索，数值张量按余弦排序。']
 ];
 const seeds=[
 ['北太平洋海温观测数据','海洋科学','北太平洋浮标观测记录表层海水温度变化。|海温剖面记录不同深度层的海水温度与盐度。|夏季海表温度随太阳辐射发生日内波动。|近海海温变化与沿岸海流输运有关。|浮标在海洋表层采集水温、盐度与深度信息。|海洋温跃层附近的海水温度下降较快。'],
 ['恒星低分辨率光谱','天文科学','恒星光谱记录可见波段的通量与波长。|恒星吸收线用以比较不同波段的强度。|巡天光谱样例保留天空背景与校准标记。|天文观测记录恒星编号、观测波长与曝光时间。|通过归一化通量比较光谱的连续谱形状。'],
 ['多模态细胞观测记录','生命科学','显微成像记录细胞形态和样本批次。|细胞观测样本包含荧光强度与图像特征。|样本批次信息用于对齐不同模态的观测。|细胞形态测量保留观测时间与质量标记。|实验样本保留相对强度与匿名记录编号。'],
 ['城市气象逐时观测','观测时序','气象站逐小时记录城市气温、湿度和气压。|城市站点温度形成连续的时间序列。|逐时气温观测可用于比较昼夜温差。|时间序列的采样时刻采用统一时间基准。|气象传感器出现中断时保留缺测标记。'],
 ['西太平洋浮标记录','海洋科学','浮标在西太平洋观测海水温度和海面风速。|海洋观测保留采样位置、时间与深度。|海表温度网格来自多个浮标观测点。|近岸海流与海水盐度同时记录。'],
 ['星系巡天观测样本','天文科学','星系巡天记录天体位置与光谱观测条件。|天文光谱包含波长网格和相对通量。|多波段观测对比星系的亮度变化。|巡天样本标注曝光时间和坏点掩码。'],
 ['环境站点采样时序','观测时序','站点采样序列保留环境温度与小时索引。|时序观测按时间戳对齐并保留采样间隔。|环境气温的日变化在多站点之间进行比较。|传感器异常值附带质量说明。']];
 const demoText='海洋浮标记录北太平洋表层海水温度与盐度。\n恒星光谱记录不同波长的归一化通量。\n气象站逐小时采集城市气温与湿度。';
 const numericText='[[12.4, 11.8, 10.6, 9.2], [12.1, 11.5, 10.2, 9.0], [5.2, 6.8, 9.4, 13.1]]';
 const aliases=[['海温','水温','海表温度','海水温度','海面温度','海洋温度'],['恒星','星体','天体'],['光谱','谱线','波段','波长'],['气温','气象','天气'],['时序','时间序列','逐时','时间戳'],['细胞','显微','荧光'],['海洋','海水','近海','太平洋','海域'],['样本','样品'],['盐度','含盐量']];
 const TEXT_DIM=256, MAX_RECORDS=360,MAX_CHARS=1400, MAX_NUM_DIM=512;
 function hash(s){let h=2166136261;for(const ch of s){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function normalize(v){const scale=v.reduce((m,x)=>Math.max(m,Math.abs(x)),0);if(!scale)throw Error('零向量没有方向，无法计算余弦相似度。请调整数据。');const norm=Math.sqrt(v.reduce((n,x)=>n+(x/scale)**2,0));return v.map(x=>Number((x/scale/norm).toFixed(8)))}
 function embed(text){
  const v=Array(TEXT_DIM).fill(0),s=text.toLowerCase().normalize('NFKC');let used=0;
  function add(k,w){const h=hash(k);v[h%TEXT_DIM]+=w;used++}
  for(const word of s.match(/[\p{Script=Han}]+|[\p{L}\d_.-]+/gu)||[]){
   if(/[\p{Script=Han}]/u.test(word)){const letters=[...word];letters.forEach((c,i)=>{add('c'+c,.65);if(i)add('b'+letters[i-1]+c,1.7)})}else add('w'+word,2)
  }aliases.forEach((group,i)=>{if(group.some(t=>s.includes(t)))add('s'+i,5)});
  if(!used)throw Error('文本须包含可编码的汉字、字母或数字。');return normalize(v)
 }
 function shape(a,depth=0){
  if(typeof a==='number'&&Number.isFinite(a))return [];
  if(!Array.isArray(a)||!a.length)throw Error('张量必须是非空的有限数值数组。');
  if(depth>=12)throw Error('本地演示支持最多 12 个轴。');
  const child=shape(a[0],depth+1), signature=child.join('x');
  for(let i=1;i<a.length;i++)if(shape(a[i],depth+1).join('x')!==signature)throw Error('张量各行的形状必须一致。');
  return [a.length,...child];
 }
 function parseTensor(s){let a;try{a=JSON.parse(s)}catch{throw Error('数值张量需要合法 JSON，例如 [[1,2,3],[3,2,1]]。')}let dims=shape(a);if(!dims.length)throw Error('请输入数组。');let batch=dims.length===1?[a]:a,sh=dims.length===1?dims:dims.slice(1);if(batch.length>MAX_RECORDS||sh.reduce((x,y)=>x*y,1)>MAX_NUM_DIM)throw Error('每批最多 360 个样本，每个样本最多 512 个元素。');return batch.map((a,i)=>({text:JSON.stringify(a),loc:'样本 '+(i+1),shape:sh,raw:a.flat(Infinity)}))}
 function csvRows(s){let rows=[],row=[],cell='',quoted=false;for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if(c==='\n'&&!quoted){row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}if(quoted)throw Error('CSV 引号未闭合。');row.push(cell);rows.push(row);return rows.filter(r=>r.some(x=>x.trim()))}
 function parse(input,format='txt',mode='text'){let s=input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();if(!s)throw Error('请先输入内容或选择文件。');if(s.length>240000)throw Error('演示单次最多接入 24 万个字符。');if(mode==='numeric')return parseTensor(s);
 let records=[];
 if(format==='json'){let data;try{data=JSON.parse(s)}catch{throw Error('JSON 无法解析，请检查括号、引号和逗号。')}let arr=Array.isArray(data)?data:[data];records=arr.map((o,i)=>({text:typeof o==='string'?o:JSON.stringify(o),loc:'记录 '+(i+1)}))}
 else if(format==='csv'){let [heads,...rows]=csvRows(s);if(!heads||!rows.length)throw Error('CSV 需要表头和至少一条数据记录。');records=rows.map((r,i)=>{if(r.length!==heads.length)throw Error('CSV 第 '+(i+2)+' 行列数与表头不一致。');return {text:r.map((v,j)=>heads[j]+'：'+v).join('，'),loc:'数据行 '+(i+1),original:JSON.stringify({columns:heads,values:r})}})}
 else records=s.split('\n').map((text,i)=>({text:text.trim(),loc:'第 '+(i+1)+' 行'})).filter(r=>r.text);
 records=records.flatMap(r=>{const arr=[];for(let i=0;i<r.text.length;i+=MAX_CHARS)arr.push({...r,text:r.text.slice(i,i+MAX_CHARS),loc:r.loc+(r.text.length>MAX_CHARS?' · 段 '+(i/MAX_CHARS+1):'')});return arr});
 if(!records.length||records.length>MAX_RECORDS)throw Error('一次登记需要 1 至 360 个非空片段。');return records}
 function encode(r,mode){return mode==='numeric'?normalize(r.raw):embed(r.text)}
 function seed(){let now=Date.now(),all=seeds.map(([name,domain,lines],i)=>({id:'DS-'+(1008-i),name,domain,created:now-i*86400000,mode:'text',format:'TXT',origin:'内置演示样本',records:parse(lines.replaceAll('|','\n'))}));all.splice(4,0,{id:'DS-1001',name:'海温剖面张量样本',domain:'海洋科学',mode:'numeric',format:'JSON',origin:'内置演示样本',created:now-3.5*86400000,records:parseTensor(numericText)});all.forEach(d=>{d.records.forEach(r=>r.vec=encode(r,d.mode));d.state='已索引'});return {sources:all,searches:0,serial:1008}}
 const dot=(a,b)=>Math.min(1,Math.max(-1,a.reduce((s,v,i)=>s+v*b[i],0)));
 function vectorId(d,i){return 'VEC-'+d.id.slice(3)+'-'+String(i+1).padStart(3,'0')}
 const anchors=['海洋 海水 海温 太平洋 海洋浮标','恒星 天体 光谱 巡天 波长','细胞 实验 荧光 显微 样本','城市 气象 时间序列 逐时 气温'].map(embed);
 function project(vec){let v=anchors.map(a=>dot(a,vec));return [v[0]-v[2],v[1]-v[3]]}
 return {domains,guides,demoText,numericText,embed,parse,encode,seed,dot,normalize,vectorId,project,TEXT_DIM};
})();
