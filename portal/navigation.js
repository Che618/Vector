const PlatformNav = (() => {
  const modules = [
    {key:'tools',short:'工具集成与管理',name:'工具集成与管理',eng:'TOOL REGISTRY',icon:'tool',tone:'violet',link:'#/tools/catalog',desc:'为多学科处理工具预留注册、编排、运行维护与社区接入页面。',meta:'页面结构已预留',action:'查看结构'},
    {key:'value',short:'Token收益分配与供给',name:'Token收益分配与供给',eng:'TOKEN DISTRIBUTION',icon:'income',tone:'blue',link:'#/value/overview',desc:'从实际调用核算收入，按有效贡献分配收益，用留存额度支持下一轮数据供给。',meta:'使用计量 · 分配结算 · 持续供给',action:'进入收益分配与供给'},
    {key:'vector',short:'张量向量库',name:'张量向量库',eng:'VECTOR LIBRARY',icon:'layers',tone:'blue',link:'#/vector',desc:'接入科学数据，生成向量索引，通过相似检索回溯原始记录。',meta:'数据接入 · 向量生成 · 检索评测',action:'进入向量库'}
  ];
  const value = [
    ['overview','收益与供给总览','overview','工作空间','从服务使用记录出发，核实参与方贡献，再将结算结果用于权益兑换和数据更新。'],
    ['meter','使用与计量','pulse','计量与贡献确认','按资源版本核对成功用量和单价。每笔使用生成流水与对应的贡献凭据。'],
    ['evidence','贡献确认','audit','计量与贡献确认','将使用回执和交付材料对应到主体，排除重复上报，只将已确认贡献纳入分配试算。'],
    ['rules','分配试算','income','分配与结算','使用流水决定可分配的收入，已确认贡献决定各主体的分配比例。'],
    ['ledger','结算台账','book','分配与结算','按批次核对入账金额。主体分成记入权益账户，供给留存计入后续任务预算。'],
    ['rights','权益兑换','box','收益兑现与再供给','参与方使用账户余额兑换科研服务。核销回执回到使用流水，记录下一轮的有效使用。'],
    ['supply','长效供给','branch','收益兑现与再供给','用供给留存支持补录、维护和按需加工。验收后更新资源版本、发放激励并生成维护凭据。'],
    ['trace','业务追溯','search','全程核对','通过业务编号核对任一环节的原始凭据、处理意见和关联对象。']
  ].map(([id,title,icon,section,desc])=>({id,title,icon,section,desc}));
  // Each hand-off names the input, output and the existing business destination.
  const handoffs = {
    meter:    ['实际取数、作业与服务调用','使用流水、待核验贡献',[['evidence','核验贡献凭据']]],
    evidence: ['调用回执、基础交付和维护材料','已确认贡献与排除意见',[['rules','查看分配试算']]],
    rules:    ['本期使用收入与已确认贡献','主体分配建议及计算明细',[['ledger','查看已结算批次']]],
    ledger:   ['经确认的试算结果','主体入账、成本与供给留存',[['rights','查看权益账户'],['supply','查看供给预算']]],
    rights:   ['主体分成和已验收的任务激励','权益凭证、核销回执与服务用量',[['meter','核对新增使用流水']]],
    supply:   ['可用供给留存与数据更新需求','新资源版本、激励与维护凭据',[['evidence','回查维护贡献'],['meter','查看新版本计量']]],
    trace:    ['贡献、计量、结算及交付编号','对应业务的处理记录与证据',[['overview','返回业务总览']]]
  };
  const tools = [
    ['catalog','工具目录','tool','分类与接入','多学科处理工具的分类检索入口。','工具列表与分类筛选',['工具名称','学科领域','能力类别','工具版本']],
    ['register','注册与接入','box','分类与接入','工具能力描述与标准化接入的页面框架。','注册信息与接入材料',['提供方','能力描述','输入输出','运行依赖']],
    ['chain','处理链配置','nodes','运行与协同','多学科处理工具编排及协同调用的页面框架。','处理链与能力节点',['处理链名称','节点顺序','参数映射','产物交接']],
    ['maintain','评价与运维','pulse','运行与协同','工具评测、运行记录和维护的页面框架。','运行记录与维护台账',['运行编号','基准集','评价指标','维护记录']],
    ['community','社区扩展','branch','社区管理','社区提交工具与版本更新的页面框架。','社区提交与审核',['提交主体','变更说明','审核状态','发布版本']]
  ].map(([id,title,icon,section,desc,block,fields])=>({id,title,icon,section,desc,block,fields}));
  return {modules,value,tools,handoffs};
})();
