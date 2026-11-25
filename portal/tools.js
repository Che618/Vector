(() => {
  const domains = ['海洋科学', '天文科学', '生命科学'];
  const storeKey = 'bjtu-scientific-tool-registry-v1';
  const now = () => new Date().toISOString();
  const clone = value => JSON.parse(JSON.stringify(value));
  const seed = () => ({
    serial: 7,
    tools: [
      {id:'TOOL-001',name:'海洋观测数据解析器',domain:'海洋科学',capability:'数据解析',kind:'代码工具',provider:'海洋数据团队',version:'1.2.0',status:'已发布',input:'CSV、JSON；时间、站点、深度、温盐字段',output:'统一观测记录与解析报告',runtime:'Python 3.11 · CPU 2核 · 内存 4 GB',license:'Apache-2.0',source:'https://git.example.org/ocean/obs-parser',sample:'ocean-buoy-sample.csv',updated:'2026-11-20',description:'解析浮标与剖面观测文件，保留站点、时间和测量单位。'},
      {id:'TOOL-002',name:'海洋观测质量检查',domain:'海洋科学',capability:'质量评估',kind:'MCP服务',provider:'海洋数据团队',version:'0.8.1',status:'已发布',input:'观测记录、质量规则版本',output:'异常标记、质量报告引用',runtime:'HTTP · 任务超时 10 分钟',license:'项目授权',source:'https://git.example.org/ocean/qc-mcp',sample:'qc-case-ocean-02.json',updated:'2026-11-22',description:'按海洋领域规则检查缺测、范围和时间连续性。'},
      {id:'TOOL-003',name:'时域光变曲线规整工具',domain:'天文科学',capability:'数据清洗',kind:'代码工具',provider:'天文数据团队',version:'2.0.0',status:'已发布',input:'CSV；时间戳、通量、误差、目标编号',output:'规整曲线与变换摘要',runtime:'容器镜像 · CPU 4核 · 内存 8 GB',license:'BSD-3-Clause',source:'https://git.example.org/astro/lightcurve',sample:'lightcurve-demo.csv',updated:'2026-11-18',description:'统一光变曲线字段和时间格式，保留原始值与处理参数。'},
      {id:'TOOL-004',name:'光谱元信息校验 Skill',domain:'天文科学',capability:'数据质检',kind:'Agent Skill',provider:'天文数据团队',version:'0.4.0',status:'待验证',input:'光谱文件引用、观测元信息',output:'字段校验结果与缺项清单',runtime:'SKILL.md · Python 3.11',license:'待核验',source:'https://git.example.org/astro/spectrum-skill',sample:'spectrum-meta-case.json',updated:'2026-11-23',description:'核对波长、通量、曝光时间和仪器信息是否齐全。'},
      {id:'TOOL-005',name:'组学样本元信息校验器',domain:'生命科学',capability:'数据质检',kind:'MCP服务',provider:'生命科学数据团队',version:'1.1.0',status:'已发布',input:'JSON；样本、物种、实验条件、测序批次',output:'标准化元信息与问题列表',runtime:'HTTP · 任务超时 5 分钟',license:'项目授权',source:'https://git.example.org/life/sample-checker',sample:'omics-sample-case.json',updated:'2026-11-21',description:'校验组学样本元信息完整性和字段间约束。'},
      {id:'TOOL-006',name:'表型记录语义对齐工具',domain:'生命科学',capability:'语义对齐',kind:'代码工具',provider:'生命科学数据团队',version:'0.7.2',status:'已发布',input:'表型记录、术语表版本',output:'对齐字段、未匹配项与报告',runtime:'容器镜像 · CPU 8核 · 内存 16 GB',license:'Apache-2.0',source:'https://git.example.org/life/phenotype-align',sample:'phenotype-align-mini.csv',updated:'2026-11-19',description:'依据指定术语表对齐菌种表型字段，未匹配项保留供复核。'}
    ],
    flows: [
      {id:'FLOW-001',name:'海洋浮标数据质检模板',domain:'海洋科学',purpose:'浮标观测数据入库前检查',toolIds:['TOOL-001','TOOL-002'],status:'已发布',updated:'2026-11-22'},
      {id:'FLOW-002',name:'天文光变曲线规整模板',domain:'天文科学',purpose:'光变曲线字段规整与质量检查',toolIds:['TOOL-003'],status:'已发布',updated:'2026-11-20'},
      {id:'FLOW-003',name:'组学样本信息核验模板',domain:'生命科学',purpose:'样本描述标准化与问题发现',toolIds:['TOOL-005','TOOL-006'],status:'草稿',updated:'2026-11-23'}
    ],
    runs: [
      {id:'RUN-26023',toolId:'TOOL-005',toolName:'组学样本元信息校验器',version:'1.1.0',domain:'生命科学',inputRef:'omics-batch-2026-11-A',status:'成功',quality:'字段完整性检查通过',duration:'18 秒',time:'2026-11-23 14:20'},
      {id:'RUN-26022',toolId:'TOOL-001',toolName:'海洋观测数据解析器',version:'1.2.0',domain:'海洋科学',inputRef:'buoy-BX17-v1.3',status:'成功',quality:'解析 240 条；2 条待复核',duration:'42 秒',time:'2026-11-23 10:06'},
      {id:'RUN-26021',toolId:'TOOL-003',toolName:'时域光变曲线规整工具',version:'2.0.0',domain:'天文科学',inputRef:'lc-demo-2026-04',status:'失败',quality:'时间列格式不匹配',duration:'6 秒',time:'2026-11-22 16:51'}
    ],
    submissions: [
      {id:'SUB-014',name:'光谱元信息校验 Skill',domain:'天文科学',contributor:'天文数据团队',version:'0.4.0',change:'新增仪器型号字段与边界样例',status:'待审核',license:'待核验',date:'2026-11-23'},
      {id:'SUB-013',name:'表型记录语义对齐工具',domain:'生命科学',contributor:'生命科学数据团队',version:'0.7.2',change:'更新术语映射表并补充未匹配报告',status:'已通过',license:'Apache-2.0',date:'2026-11-19'}
    ]
  });

  const component = {
    props: ['page'],
    data() {
      let saved;
      try { saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch {}
      return {
        data: saved || seed(), domains, search:'', domainFilter:'全部领域', kindFilter:'全部类型', statusFilter:'全部状态',
        runFilter:'全部状态', runCase:'正常样例', submissionFilter:'全部状态', selectedTool:null, toast:'', saveWarning:'',
        draft:{name:'',domain:domains[0],capability:'',kind:'代码工具',provider:'',version:'1.0.0',input:'',output:'',runtime:'',license:'',source:'',sample:'',description:''},
        flowDraft:{name:'',domain:domains[0],purpose:'',toolIds:[]}
      };
    },
    computed: {
      published() { return this.data.tools.filter(t => t.status === '已发布'); },
      filteredTools() {
        const q = this.search.trim().toLowerCase();
        return this.data.tools.filter(t => (this.domainFilter === '全部领域' || t.domain === this.domainFilter) && (this.kindFilter === '全部类型' || t.kind === this.kindFilter) && (this.statusFilter === '全部状态' || t.status === this.statusFilter) && (!q || [t.name,t.id,t.provider,t.domain,t.capability,t.kind].join(' ').toLowerCase().includes(q)));
      },
      filteredRuns() { return this.data.runs.filter(r => this.runFilter === '全部状态' || r.status === this.runFilter); },
      filteredSubmissions() { return this.data.submissions.filter(s => this.submissionFilter === '全部状态' || s.status === this.submissionFilter); },
      domainCounts() { return this.domains.map(d => [d,this.data.tools.filter(t => t.domain === d).length]); },
      compatibleTools() { return this.published.filter(t => t.domain === this.flowDraft.domain); },
      readyCount() { return this.published.length; },
      pendingCount() { return this.data.tools.filter(t => ['待验证','待审核'].includes(t.status)).length + this.data.submissions.filter(s => s.status === '待审核').length; },
      latestRun() { return this.data.runs[0]; }
    },
    watch: { data:{deep:true,handler(){this.persist();}}, page(){this.selectedTool=null;} },
    methods: {
      persist() { try { localStorage.setItem(storeKey,JSON.stringify(this.data)); this.saveWarning=''; } catch { this.saveWarning='浏览器暂不可保存工具工作区数据，本次操作仅在当前会话有效。'; } },
      notify(message) { this.toast=message; clearTimeout(this.toastTimer); this.toastTimer=setTimeout(()=>this.toast='',3200); },
      startTool(tool) { this.selectedTool=tool; this.$nextTick(()=>this.$refs.toolDialog?.showModal()); },
      closeTool() { this.$refs.toolDialog?.close(); this.selectedTool=null; },
      resetDraft() { this.draft={name:'',domain:this.domains[0],capability:'',kind:'代码工具',provider:'',version:'1.0.0',input:'',output:'',runtime:'',license:'',source:'',sample:'',description:''}; },
      submitTool() {
        const f=clone(this.draft), n=++this.data.serial;
        this.data.tools.unshift({...f,id:'TOOL-'+String(n).padStart(3,'0'),status:'待验证',updated:now().slice(0,10)});
        this.resetDraft(); this.notify('工具已登记，进入接入验证队列。'); location.hash='/tools/catalog';
      },
      verifyTool(tool) {
        const missing=['name','domain','kind','version','input','output','runtime','license','source','sample'].filter(k=>!tool[k]);
        if(missing.length){this.notify('必填信息不完整，请补齐接口、环境、许可证和样例。');return;}
        tool.status='待审核'; tool.verifiedAt=now().slice(0,10); this.notify('接入检查通过，已提交审核。');
      },
      publishTool(tool) { tool.status='已发布'; tool.updated=now().slice(0,10); this.notify('工具版本已发布到能力目录。'); },
      toggleTool(tool) { tool.status=tool.status==='已发布'?'已停用':'已发布'; tool.updated=now().slice(0,10); this.notify(tool.status==='已发布'?'工具已重新启用。':'工具已停用，历史运行记录保留。'); },
      toolActionLabel(tool) { return tool.status==='待验证'?'运行接入检查':tool.status==='待审核'?'审核并发布':tool.status==='已发布'?'停用版本':tool.status==='已停用'?'重新启用':''; },
      emitRunEvents(run,tool) {
        if(run.status!=='成功'||!window.ScienceBridge)return;
        const outputRef='OUT-'+run.id;
        const report=['工具演示处理报告','工具：'+tool.name+' v'+tool.version,'领域：'+tool.domain,'运行编号：'+run.id,'输入引用：'+run.inputRef,'质量结果：'+run.quality,'说明：此为平台联动演示报告，不包含真实加工数据。'].join('\n');
        run.outputRef=outputRef;
        window.ScienceBridge.publish({eventId:'TOOL-ASSET-'+run.id,type:'tool.output.available',status:'待导入',payload:{assetId:outputRef,runId:run.id,toolId:tool.id,toolName:tool.name,toolVersion:tool.version,domain:tool.domain,provider:tool.provider,inputRef:run.inputRef,content:report}});
        const usage=window.ScienceBridge.publish({eventId:'TOOL-USAGE-'+run.id,type:'usage.succeeded',status:'待计量',payload:{source:'tool',domain:tool.domain,provider:tool.provider,resourceId:tool.id,resourceName:tool.name,version:tool.version,quantity:1,unit:'次',reference:run.id,outputRef}});
        this.$emit('usage',usage);
      },
      runTool(tool) {
        if(tool.status!=='已发布'){this.notify('只有已发布版本可以试运行。');return;}
        const fail=this.runCase==='失败样例';
        const run={id:'RUN-'+String(26024+this.data.runs.length).padStart(5,'0'),toolId:tool.id,toolName:tool.name,version:tool.version,domain:tool.domain,inputRef:tool.sample,status:fail?'失败':'成功',quality:fail?'样例边界检查发现时间字段格式不匹配':'接口、输出结构与样例检查通过',duration:fail?'6 秒':'12 秒',time:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai',hour12:false}).slice(0,16)};
        this.data.runs.unshift(run); this.emitRunEvents(run,tool); this.notify(run.status==='成功'?'试运行完成，待核验用量和演示产物已关联。':'试运行失败，已生成可追溯的运行记录。'); this.closeTool(); location.hash='/tools/maintain';
      },
      resetFlowDraft() { this.flowDraft={name:'',domain:this.domains[0],purpose:'',toolIds:[]}; },
      saveFlow(publish) {
        if(!this.flowDraft.name.trim()||!this.flowDraft.toolIds.length){this.notify('请填写流程名称并至少选择一个工具节点。');return;}
        const selected=this.data.tools.filter(t=>this.flowDraft.toolIds.includes(t.id));
        if(selected.some(t=>t.status!=='已发布'||t.domain!==this.flowDraft.domain)){this.notify('流程只能使用同领域的已发布工具版本。');return;}
        const flow={...clone(this.flowDraft),id:'FLOW-'+String(this.data.flows.length+1).padStart(3,'0'),status:publish?'已发布':'草稿',updated:now().slice(0,10)};
        this.data.flows.unshift(flow); this.resetFlowDraft(); this.notify(publish?'流程模板已发布。':'流程草稿已保存。');
      },
      runFlow(flow) {
        const selected=flow.toolIds.map(id=>this.data.tools.find(t=>t.id===id)).filter(Boolean);
        if(flow.status!=='已发布'||selected.some(t=>t.status!=='已发布')){this.notify('流程或其中的工具版本未发布，不能试运行。');return;}
        for(const [index,tool] of selected.entries()){
          const fail=this.runCase==='失败样例';
          const run={id:'RUN-'+String(26024+this.data.runs.length).padStart(5,'0'),flowId:flow.id,step:index+1,toolId:tool.id,toolName:tool.name,version:tool.version,domain:tool.domain,inputRef:flow.id+' / 示例输入',status:fail?'失败':'成功',quality:fail?'样例边界检查发现时间字段格式不匹配':'节点输入输出结构检查通过',duration:fail?'6 秒':'12 秒',time:new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai',hour12:false}).slice(0,16)};
          this.data.runs.unshift(run); this.emitRunEvents(run,tool);
          if(fail)break;
        }
        this.notify('流程试运行已完成，逐节点运行记录已生成。'); location.hash='/tools/maintain';
      },
      reviewSubmission(submission,pass) {
        if(submission.status!=='待审核')return;
        submission.status=pass?'已通过':'待补充'; submission.reviewedAt=now().slice(0,10);
        if(pass){
          const linked=this.data.tools.find(t=>t.name===submission.name&&t.version===submission.version);
          if(linked)linked.status=linked.status==='待验证'?'待审核':'已发布';
        }
        this.notify(pass?'共建工具审核已通过，工具仍需完成接入验证后发布。':'已退回提交，并保留审核状态与记录。');
      },
      pillClass(status) { return ['已发布','已通过','成功'].includes(status)?'ok':['待审核','待验证','待补充','失败'].includes(status)?'wait':['已停用','草稿'].includes(status)?'workpill':''; }
    },
    template: `
      <div class="tools-workspace">
        <section class="panel"><div class="panel-head"><div><h2>处理、入库与使用联动</h2><p>成功试运行生成演示报告和待核验用量。报告可在Token张量库的数据接入页接收，编码入库后的检索命中也会回到收益计量。</p></div><label>试运行场景<select v-model="runCase"><option>正常样例</option><option>失败样例</option></select></label></div><div class="actions"><a class="soft-btn" href="#/vector/intake">张量库接收产物</a><a class="soft-btn" href="#/value/meter">查看使用计量</a></div></section>
        <section class="metrics three tools-metrics">
          <article class="metric"><div><span>已发布工具</span><i class="mini-tile teal">{{readyCount}}</i></div><small>仅发布版本可进入流程</small></article>
          <article class="metric"><div><span>接入与审核待办</span><i class="mini-tile amber">{{pendingCount}}</i></div><small>验证、审核和共建工具提交</small></article>
          <article class="metric"><div><span>最近试运行</span><i class="mini-tile blue">{{latestRun ? latestRun.status : '暂无'}}</i></div><small>{{latestRun ? latestRun.id+' · '+latestRun.time : '运行后生成记录'}}</small></article>
        </section>

        <template v-if="page==='catalog'">
          <section class="panel"><div class="panel-head"><div><h2>能力目录</h2><p>按三个项目领域管理工具；工具元信息、版本和运行记录分开保留。</p></div><a class="primary-btn" href="#/tools/register">登记工具</a></div>
            <div class="domain-strip"><span v-for="[name,count] in domainCounts" :key="name"><b>{{name}}</b><small>{{count}} 个工具</small></span></div>
            <div class="filters tool-filters"><input v-model="search" type="search" placeholder="搜索工具、编号或提供方" aria-label="搜索工具"><select v-model="domainFilter"><option>全部领域</option><option v-for="d in domains">{{d}}</option></select><select v-model="kindFilter"><option>全部类型</option><option>代码工具</option><option>Agent Skill</option><option>MCP服务</option></select><select v-model="statusFilter"><option>全部状态</option><option>已发布</option><option>待验证</option><option>待审核</option><option>已停用</option></select></div>
            <div class="tablewrap"><table><thead><tr><th>工具 / 版本</th><th>领域</th><th>能力</th><th>形式</th><th>提供方</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="t in filteredTools" :key="t.id"><td><button class="text-link" @click="startTool(t)">{{t.name}}</button><small class="mono">{{t.id}} · v{{t.version}}</small></td><td>{{t.domain}}</td><td>{{t.capability}}</td><td>{{t.kind}}</td><td>{{t.provider}}</td><td><span class="pill" :class="pillClass(t.status)">{{t.status}}</span></td><td><button class="text-link" @click="t.status==='已发布'?runTool(t):startTool(t)">{{t.status==='已发布'?'试运行':'查看 / 处理'}}</button></td></tr><tr v-if="!filteredTools.length"><td colspan="7"><empty text="没有符合当前筛选条件的工具"></empty></td></tr></tbody></table></div>
          </section>
          <section class="panel"><div class="panel-head"><div><h2>接入状态</h2><p>统一工具描述与标准化接入；先验证样例，再进入发布审核。</p></div></div><div class="tool-lifecycle"><span>登记</span><i></i><span>接入验证</span><i></i><span>审核发布</span><i></i><span>版本维护</span></div></section>
        </template>

        <template v-else-if="page==='register'">
          <section class="panel"><div class="panel-head"><div><h2>登记科学数据处理工具</h2><p>工具以明确版本登记；接入检查通过后进入审核，不会自动执行外部代码或连接服务。</p></div><span class="pill wait">新版本 · 待验证</span></div>
            <form class="tool-form" @submit.prevent="submitTool">
              <div class="input-grid"><label>工具名称<input v-model.trim="draft.name" required maxlength="100" placeholder="例如：海洋观测异常检测器"></label><label>所属领域<select v-model="draft.domain" required><option v-for="d in domains">{{d}}</option></select></label><label>能力类别<select v-model="draft.capability" required><option disabled value="">选择能力</option><option>数据解析</option><option>数据清洗</option><option>语义对齐</option><option>质量评估</option><option>Token化处理</option><option>其他处理</option></select></label><label>接入形式<select v-model="draft.kind"><option>代码工具</option><option>Agent Skill</option><option>MCP服务</option></select></label>
              <label>提供方<input v-model.trim="draft.provider" required maxlength="100"></label><label>版本号<input v-model.trim="draft.version" required maxlength="32" placeholder="1.0.0"></label><label>许可证 / 授权依据<input v-model.trim="draft.license" required maxlength="100" placeholder="许可证名称或项目授权依据"></label><label>样例 / 测试用例<input v-model.trim="draft.sample" required maxlength="180" placeholder="文件名或受控数据引用"></label></div>
              <div class="input-grid two"><label>输入契约<textarea v-model.trim="draft.input" required maxlength="500" placeholder="格式、必需字段、单位、前置条件"></textarea></label><label>输出契约<textarea v-model.trim="draft.output" required maxlength="500" placeholder="产物类型、字段结构、质量报告引用"></textarea></label></div>
              <div class="input-grid two"><label>运行环境<textarea v-model.trim="draft.runtime" required maxlength="300" placeholder="镜像 / 依赖 / CPU、GPU、内存 / 超时"></textarea></label><label>代码仓库或服务地址<input v-model.trim="draft.source" required maxlength="240" placeholder="仓库地址、MCP端点或Skill包位置"></label></div>
              <label>功能说明<textarea v-model.trim="draft.description" required maxlength="300" placeholder="适用任务、限制条件和已知问题"></textarea></label>
              <div class="notice">接入检查关注接口契约、依赖与环境、权限和许可证、样例测试。请勿在地址或说明中填写访问密钥、个人配置或全量数据。</div>
              <div class="actions"><button class="primary-btn">提交并进入接入验证</button><button type="reset" class="soft-btn" @click.prevent="resetDraft">清空</button></div>
            </form>
          </section>
          <section class="panel"><div class="panel-head"><div><h2>领域登记范围</h2><p>同一目录中分领域登记，流程模板只允许组合本领域已发布工具。</p></div></div><div class="domain-strip"><span v-for="d in domains"><b>{{d}}</b><small>{{data.tools.filter(t=>t.domain===d).length}} 个样例工具</small></span></div></section>
        </template>

        <template v-else-if="page==='chain'">
          <section class="panel"><div class="panel-head"><div><h2>新建处理流程模板</h2><p>模板只引用已发布的同领域工具版本；每个节点保留工具版本和输入输出契约。</p></div></div>
            <form class="tool-form" @submit.prevent="saveFlow(false)"><div class="input-grid"><label>流程名称<input v-model.trim="flowDraft.name" required maxlength="100"></label><label>所属领域<select v-model="flowDraft.domain" @change="flowDraft.toolIds=[]"><option v-for="d in domains">{{d}}</option></select></label><label>处理目标<input v-model.trim="flowDraft.purpose" required maxlength="180"></label></div>
              <fieldset class="tool-checks"><legend>选择流程节点</legend><label v-for="t in compatibleTools" :key="t.id" class="tool-check"><input type="checkbox" :value="t.id" v-model="flowDraft.toolIds"><span><b>{{t.name}}</b><small>{{t.id}} · v{{t.version}} · {{t.capability}}</small></span></label><p v-if="!compatibleTools.length" class="muted">该领域暂无已发布工具可选。</p></fieldset>
              <div class="actions"><button class="soft-btn" type="submit">保存草稿</button><button class="primary-btn" type="button" @click="saveFlow(true)">校验并发布模板</button></div>
            </form>
          </section>
          <section class="panel"><div class="panel-head"><div><h2>流程模板</h2><p>模板记录步骤顺序和具体工具版本，供任务系统后续按接口调用。</p></div></div><div class="tablewrap"><table><thead><tr><th>流程</th><th>领域 / 目标</th><th>节点与版本</th><th>状态</th><th>最近更新</th><th>操作</th></tr></thead><tbody><tr v-for="f in data.flows" :key="f.id"><td><b>{{f.name}}</b><small class="mono">{{f.id}}</small></td><td>{{f.domain}}<small>{{f.purpose}}</small></td><td><span v-for="(id,i) in f.toolIds" :key="id">{{i+1}}. {{data.tools.find(t=>t.id===id)?.name || id}}<br></span></td><td><span class="pill" :class="pillClass(f.status)">{{f.status}}</span></td><td>{{f.updated}}</td><td><button class="text-link" @click="runFlow(f)" :disabled="f.status!=='已发布'">试运行</button></td></tr></tbody></table></div></section>
        </template>

        <template v-else-if="page==='maintain'">
          <section class="metrics three"><article class="metric"><div><span>成功运行</span></div><b>{{data.runs.filter(r=>r.status==='成功').length}}</b><small>当前演示记录</small></article><article class="metric"><div><span>异常待排查</span></div><b>{{data.runs.filter(r=>r.status==='失败').length}}</b><small>可关联工具版本与输入引用</small></article><article class="metric"><div><span>运行记录</span></div><b>{{data.runs.length}}</b><small>按运行编号追溯</small></article></section>
          <section class="panel"><div class="panel-head"><div><h2>运行记录</h2><p>演示试运行只生成本地记录，不会调用外部服务。</p></div><select v-model="runFilter"><option>全部状态</option><option>成功</option><option>失败</option></select></div><div class="tablewrap"><table><thead><tr><th>运行编号</th><th>工具 / 版本</th><th>领域</th><th>输入引用</th><th>状态与质量结果</th><th>耗时</th><th>时间</th><th>产物</th></tr></thead><tbody><tr v-for="r in filteredRuns" :key="r.id"><td class="mono">{{r.id}}</td><td>{{r.toolName}}<small>{{r.toolId}} · v{{r.version}}</small></td><td>{{r.domain}}</td><td class="mono">{{r.inputRef}}</td><td><span class="pill" :class="pillClass(r.status)">{{r.status}}</span><small>{{r.quality}}</small></td><td>{{r.duration}}</td><td>{{r.time}}</td><td><a v-if="r.outputRef" class="text-link" href="#/vector/intake">{{r.outputRef}} · 入库</a><span v-else class="muted">无</span></td></tr><tr v-if="!filteredRuns.length"><td colspan="8"><empty text="暂无符合条件的运行记录"></empty></td></tr></tbody></table></div></section>
          <section class="panel"><div class="panel-head"><div><h2>工具状态</h2><p>查看发布版本、接入状态和最近试运行；停用不删除历史记录。</p></div></div><div class="tablewrap"><table><thead><tr><th>工具</th><th>领域</th><th>版本</th><th>状态</th><th>最近运行</th><th>操作</th></tr></thead><tbody><tr v-for="t in data.tools" :key="t.id"><td>{{t.name}}<small>{{t.id}}</small></td><td>{{t.domain}}</td><td class="mono">{{t.version}}</td><td><span class="pill" :class="pillClass(t.status)">{{t.status}}</span></td><td>{{data.runs.find(r=>r.toolId===t.id)?.time || '尚无运行'}}</td><td><button class="text-link" @click="startTool(t)">详情</button></td></tr></tbody></table></div></section>
        </template>

        <template v-else-if="page==='community'">
          <section class="panel"><div class="panel-head"><div><h2>共建工具提交审核</h2><p>核对提交主体、版本差异、许可证、依赖和样例验证，再决定是否发布。</p></div><select v-model="submissionFilter"><option>全部状态</option><option>待审核</option><option>已通过</option><option>待补充</option></select></div><div class="tablewrap"><table><thead><tr><th>提交编号</th><th>工具与版本</th><th>领域</th><th>提交主体</th><th>变更说明</th><th>许可证</th><th>状态 / 审核</th></tr></thead><tbody><tr v-for="s in filteredSubmissions" :key="s.id"><td class="mono">{{s.id}}<small>{{s.date}}</small></td><td>{{s.name}}<small>v{{s.version}}</small></td><td>{{s.domain}}</td><td>{{s.contributor}}</td><td>{{s.change}}</td><td>{{s.license}}</td><td><span class="pill" :class="pillClass(s.status)">{{s.status}}</span><div v-if="s.status==='待审核'" class="review-actions"><button class="text-link" @click="reviewSubmission(s,true)">通过并发布</button><button class="text-link" @click="reviewSubmission(s,false)">退回补充</button></div></td></tr><tr v-if="!filteredSubmissions.length"><td colspan="7"><empty text="暂无共建工具提交"></empty></td></tr></tbody></table></div></section>
          <section class="panel"><h2>发布核对项</h2><div class="checklist"><span>责任主体和版本明确</span><span>许可证与使用范围已核对</span><span>输入输出及运行依赖可复现</span><span>正常、边界和失败样例齐全</span><span>未包含凭据、个人配置或全量数据</span></div></section>
        </template>

        <p v-if="saveWarning" class="storagewarn" role="status">{{saveWarning}}</p><div v-if="toast" class="toast" role="status">{{toast}}</div>
        <dialog ref="toolDialog" class="modal tool-dialog"><template v-if="selectedTool"><div class="dialog-head"><div><small>{{selectedTool.id}} · {{selectedTool.domain}}</small><h2>{{selectedTool.name}}</h2></div><button class="icon-btn" @click="closeTool" aria-label="关闭"><ico name="close"></ico></button></div><div class="dialog-body"><div class="dialog-summary"><b>v{{selectedTool.version}} · {{selectedTool.kind}}</b><span class="pill" :class="pillClass(selectedTool.status)">{{selectedTool.status}}</span></div><p>{{selectedTool.description}}</p><dl class="details"><dt>能力 / 提供方</dt><dd>{{selectedTool.capability}} · {{selectedTool.provider}}</dd><dt>输入契约</dt><dd>{{selectedTool.input}}</dd><dt>输出契约</dt><dd>{{selectedTool.output}}</dd><dt>运行环境</dt><dd>{{selectedTool.runtime}}</dd><dt>许可证</dt><dd>{{selectedTool.license}}</dd><dt>源码 / 服务</dt><dd>{{selectedTool.source}}</dd><dt>样例引用</dt><dd>{{selectedTool.sample}}</dd><dt>登记 / 更新</dt><dd>{{selectedTool.updated}}</dd></dl><div class="actions"><button v-if="selectedTool.status==='待验证'" class="primary-btn" @click="verifyTool(selectedTool)">运行接入检查</button><button v-if="selectedTool.status==='待审核'" class="primary-btn" @click="publishTool(selectedTool)">审核并发布</button><button v-if="selectedTool.status==='已发布'||selectedTool.status==='已停用'" class="soft-btn" @click="toggleTool(selectedTool)">{{selectedTool.status==='已发布'?'停用此版本':'重新启用'}}</button><button v-if="selectedTool.status==='已发布'" class="soft-btn" @click="runTool(selectedTool)">试运行</button></div></div></template></dialog>
      </div>`
  };
  window.ToolWorkspace = component;
})();
