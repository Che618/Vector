// Browser-independent accounting model. Amounts are integer demo service credits.
const Operations = (() => {
  const sides = ['数据侧', '工具侧', '智能体侧'];
  const units = ['条', '次', '次'];
  const basis = [100, 10, 5];
  const gradeFactor = { A: 1, B: 0.85, C: 0.65, D: 0 };
  const actors = ['近岸海洋观测站', '海洋数据质控组', '剖面分析团队', '联合维护小组'];
  const rights = [
    { name: '数据访问额度', cost: 120, unit: '100 条近岸观测数据', scope: '近岸温盐观测集' },
    { name: '优先计算服务', cost: 240, unit: '1 次优先分析作业', scope: '剖面分析工作流' },
    { name: '工具调用额度', cost: 80, unit: '10 次温盐剖面质控', scope: '海洋质控工具' }
  ];
  const resources = [
    { name: '近岸温盐观测集', owner: 0, side: 0, price: 2, version: 'v1.2' },
    { name: '温盐剖面质控工具', owner: 1, side: 1, price: 18, version: 'v2.1' },
    { name: '剖面异常分析智能体', owner: 2, side: 2, price: 45, version: 'v1.0' }
  ];
  const defaultRule = { weights: [45, 30, 25], cost: 10, reserve: 15 };
  const total = arr => arr.reduce((a, b) => a + b, 0);
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const requireThat = (val, msg) => { if (!val) throw Error(msg); };
  function whole(n, min, max, label) {
    requireThat(Number.isSafeInteger(n) && n >= min && n <= max, label + '应为 ' + min + ' 至 ' + max + ' 的整数。');
    return n;
  }
  function words(v, label) {
    requireThat(typeof v === 'string' && v.trim() && v.trim().length <= 180, '请填写' + label + '（最多 180 字）。');
    return v.trim();
  }
  function id(s, prefix) { return prefix + '-' + String(++s.serial).padStart(4, '0'); }
  const now = () => new Date().toISOString();
  function log(s, action, ref, detail, time = now()) { s.log.unshift({id:id(s,'LOG'), action, ref, detail, time}); }
  function event(s, data, time = now()) {
    const e = {id:id(s,'EV'), state:'待核验', batch:'', time, utility:1, category:'基础贡献', ...data};
    s.events.unshift(e);
    return e;
  }
  function registerUse(s, r, qty, reference, time = now()) {
    const resource = s.resources[r];
    requireThat(resource, '请选择资源。'); whole(qty, 1, 100000, '有效用量');
    const ref = words(reference, '作业或凭证编号');
    requireThat(!s.uses.some(u => u.ref.toLowerCase() === ref.toLowerCase()), '该业务凭证已登记，请核对编号。');
    const u = {id:id(s,'USE'), r, qty, ref, time, version:resource.version, price:resource.price, amount:qty * resource.price, batch:''};
    s.uses.unshift(u);
    const e = event(s,{actor:resource.owner, r, qty, ref, grade:'A', category:'使用贡献', version:u.version, proof:'调用回执 ' + ref + ' · 成功取用 ' + qty + units[r], use:u.id},time);
    u.event = e.id;
    log(s,'登记使用',u.id,resource.name + ' · ' + ref,time);
    return u;
  }
  function declare(s, f, time=now()) {
    whole(f.actor,0,actors.length-1,'主体编号'); whole(f.r,0,s.resources.length-1,'资源编号');
    whole(f.qty,1,100000,'合格工作量');
    requireThat(Object.hasOwn(gradeFactor,f.grade),'请选择质量等级。');
    const ref=words(f.ref,'交付凭证编号'), proof=words(f.proof,'产物或质量报告');
    requireThat(!s.events.some(e=>e.actor===f.actor && e.ref.toLowerCase()===ref.toLowerCase()),'同一主体已登记该凭证。');
    const e=event(s,{actor:f.actor,r:f.r,qty:f.qty,ref,proof,version:s.resources[f.r].version,grade:f.grade,category:'基础贡献'},time);
    log(s,'申报基础贡献',e.id,actors[f.actor]+' · '+ref,time);
    return e;
  }
  function review(s, key, accept, note, time = now()) {
    const e = s.events.find(v=>v.id === key);
    requireThat(e && e.state === '待核验','该事件已处理。');
    const memo = words(note,'核验意见');
    if (accept) {
      requireThat(e.grade !== 'D' && e.qty > 0 && e.proof.trim(), '本条凭据未满足有效产出要求。');
      requireThat(!s.events.some(v=>v.id !== key && v.ref === e.ref && v.actor === e.actor && v.state === '已确认'), '同一主体的业务凭据已经确认，请排除重复。');
    }
    e.state = accept ? '已确认' : '已排除'; e.review = memo;
    log(s,accept?'确认贡献':'排除贡献',e.id,memo,time);
  }
  function checkRule(rule) {
    requireThat(rule.weights.length === 3,'请设置三侧权重。'); rule.weights.forEach(v=>whole(v,1,98,'角色权重'));
    requireThat(total(rule.weights) === 100,'数据、工具、智能体三侧权重之和应为 100%。');
    whole(rule.cost,0,90,'运营成本比例'); whole(rule.reserve,0,90,'供给留存比例');
    requireThat(rule.cost + rule.reserve < 100,'成本和留存之和须低于 100%。');
  }
  function simulate(s, rule) {
    checkRule(rule);
    const usages = s.uses.filter(u=>!u.batch);
    const evidence = s.events.filter(e=>e.state === '已确认' && !e.batch);
    const gross = total(usages.map(u=>u.amount));
    const cost = Math.floor(gross * rule.cost / 100), reserve = Math.floor(gross * rule.reserve / 100);
    const net = gross - cost - reserve;
    const lines = evidence.map(e=>{
      const side = s.resources[e.r].side;
      const base = e.qty / basis[side] * 100;
      const score = base * rule.weights[side] / 100 * gradeFactor[e.grade] * e.utility;
      return {...clone(e),side,base,score};
    });
    const rows = actors.map((name,actor)=>{
      const items = lines.filter(l=>l.actor === actor);
      return {actor,name,score:total(items.map(i=>i.score)),items,amount:0};
    });
    const score = total(rows.map(r=>r.score));
    if(score && net) {
      const rank = rows.map(r=>{
        const raw = net * r.score / score;
        r.amount = Math.floor(raw);
        return {row:r, fraction:raw-r.amount};
      }).sort((a,b)=>b.fraction-a.fraction || a.row.actor-b.row.actor);
      const rest = net-total(rows.map(r=>r.amount));
      rank.slice(0,rest).forEach(x=>x.row.amount++);
    }
    return {gross,cost,reserve,net,score,rows,usages:clone(usages),rule:clone(rule)};
  }
  function settle(s, rule, time = now()) {
    const p = simulate(s,rule);
    requireThat(p.gross > 0 && p.score > 0,'本期待结用量和已确认贡献均须大于零。');
    requireThat(!p.usages.some(u=>s.events.find(e=>e.id===u.event)?.state === '待核验'),'请先处理本期使用回执对应的待核验贡献。');
    p.id = id(s,'SET'); p.time = time; p.ruleVersion = 'R-' + String(s.batches.length + 1).padStart(2,'0');
    const ids = new Set(p.rows.flatMap(r=>r.items.map(x=>x.id)));
    s.events.forEach(e=>{if(ids.has(e.id))e.batch=p.id;});
    s.uses.forEach(u=>{if(!u.batch)u.batch=p.id;});
    s.batches.unshift(p);
    log(s,'结算入账',p.id,'主体分配 ' + p.net + ' · 供给留存 ' + p.reserve,time);
    return p;
  }
  function balance(s, actor) {
    const allocations = total(s.batches.map(b=>b.rows.find(r=>r.actor===actor)?.amount || 0));
    const awards = total(s.tasks.filter(t=>t.state==='已验收' && t.actor===actor).map(t=>t.budget));
    return allocations + awards - total(s.vouchers.filter(v=>v.actor===actor).map(v=>v.cost));
  }
  function reserveBalance(s) { return total(s.batches.map(b=>b.reserve)) - total(s.tasks.map(t=>t.budget)); }
  function issue(s, actor, index, count, time=now()) {
    whole(actor,0,actors.length-1,'主体编号'); whole(index,0,rights.length-1,'权益编号'); whole(count,1,100,'兑换份数');
    const item=rights[index], cost=item.cost*count;
    requireThat(balance(s,actor)>=cost,'该主体的可用余额不足。');
    const v={id:id(s,'VCH'),actor,index,count,cost,time,state:'待核销',expires:new Date(Date.parse(time)+30*86400000).toISOString()};
    s.vouchers.unshift(v); log(s,'签发权益',v.id,actors[actor]+' · '+item.name+' × '+count,time); return v;
  }
  function redeem(s,key,ref,time=now()) {
    const v=s.vouchers.find(v=>v.id===key);
    requireThat(v && v.state==='待核销','该凭证已核销。');
    requireThat(Date.parse(time)<=Date.parse(v.expires),'该凭证已过有效期。');
    const name=words(ref,'核销回执');
    requireThat(!s.vouchers.some(v=>v.receipt===name),'核销回执已被使用。');
    requireThat(!s.uses.some(u=>u.ref.toLowerCase()===name.toLowerCase()),'该业务编号已有计量记录。');
    const channel=[0,2,1][v.index], quantity=[100,1,10][v.index]*v.count;
    const u=registerUse(s,channel,quantity,name,time);
    u.price=0; u.amount=0; u.voucher=v.id;
    v.receipt=name; v.use=u.id; v.state='已核销';
    log(s,'核销权益',v.id,name+' · '+u.id+' · 已兑权益使用',time);
  }
  function plan(s, form, time=now()) {
    const title=words(form.title,'任务名称'), criterion=words(form.criterion,'验收条件');
    const resource=s.resources[form.r];
    requireThat(resource && actors[form.actor] && ['周期更新','按需加工','社区协作'].includes(form.kind),'请选择有效的资源、责任方和供给方式。');
    whole(form.budget,1,1000000,'激励额度'); requireThat(form.budget<=reserveBalance(s),'可用供给留存不足。');
    requireThat(/^\d{4}-\d{2}-\d{2}$/.test(form.due) && Number.isFinite(Date.parse(form.due)),'请选择交付日期。');
    requireThat(!s.tasks.some(t=>t.title===title && t.state!=='已验收'),'同名供给任务仍在进行。');
    const minQty=whole(form.minQty ?? 1,1,100000,'最少交付量');
    const t={id:id(s,'SUP'),title,criterion,minQty,r:form.r,actor:form.actor,kind:form.kind,budget:form.budget,due:form.due,baseVersion:resource.version,state:'待交付',time};
    s.tasks.unshift(t); log(s,'建立供给任务',t.id,title+' · 预留 '+t.budget,time); return t;
  }
  function submit(s,key,form,time=now()) {
    const t=s.tasks.find(t=>t.id===key);
    requireThat(t && ['待交付','待修订'].includes(t.state),'该任务当前不能提交。');
    const version=words(form.version,'新版本号'), proof=words(form.proof,'交付清单或报告编号');
    requireThat(version!==s.resources[t.r].version,'交付版本须与当前版本区分。');whole(form.qty,1,100000,'交付工作量');
    requireThat(!s.tasks.some(x=>x.id!==key && x.delivery?.proof===proof),'该交付凭据已使用。');
    t.delivery={version,proof,qty:form.qty,base:s.resources[t.r].version}; t.state='待验收'; log(s,'提交供给产物',t.id,version+' · '+proof,time);
  }
  function acceptTask(s,key,pass,note,time=now()) {
    const t=s.tasks.find(t=>t.id===key);
    requireThat(t && t.state==='待验收','该任务已处理或尚未提交。');
    const memo=words(note,'验收意见');
    if(pass) {
      requireThat(t.delivery.qty>=t.minQty,'实际交付量低于任务验收下限，请退回修订。');
      requireThat(s.resources[t.r].version===t.delivery.base,'资源版本已更新，请退回修订后重新提交。');
      requireThat(!s.tasks.some(x=>x.id!==key && x.state==='已验收' && x.r===t.r && x.delivery.version===t.delivery.version),'资源已使用过此版本号。');
      s.resources[t.r].version=t.delivery.version; t.state='已验收';
      const e=event(s,{actor:t.actor,r:t.r,qty:t.delivery.qty,ref:t.id,grade:'A',category:'持续维护',version:t.delivery.version,proof:t.delivery.proof,state:'已确认',batch:t.id,review:memo},time);
      t.event=e.id;
    } else t.state='待修订';
    t.note=memo; log(s,pass?'验收并发放激励':'退回修订',t.id,memo,time);
  }
  function seed() {
    const s={schema:1,serial:100,resources:clone(resources),events:[],uses:[],batches:[],tasks:[],vouchers:[],log:[]};
    ['09','10','11'].forEach((m,k)=>{
      const t='2026-'+m+'-12T03:30:00.000Z';
      [740+100*k,42+8*k,21+4*k].forEach((n,r)=>{
        const u=registerUse(s,r,n,'JOB-'+m+'-'+(r+1),t);
        if(k<2 || r!==2)review(s,u.event,true,'调用记录、版本与用量核对一致。',t);
      });
      const e=event(s,{actor:3,r:0,qty:120+15*k,ref:'QC-'+m+'-07',grade:'B',utility:1.1,category:'基础贡献',version:'v1.2',proof:'深度字段订正清单与质量复核报告 QC-'+m+'-07'},t);
      review(s,e.id,true,'已核对温盐剖面交付清单与抽检报告。',t);
      if(k<2)settle(s,defaultRule,'2026-'+m+'-28T02:00:00.000Z');
    });
    event(s,{actor:0,r:0,qty:940,ref:'JOB-11-1',grade:'A',category:'使用贡献',version:'v1.2',proof:'重复上报原作业凭证 JOB-11-1；与原取数记录关联。'},'2026-11-18T03:20:00.000Z');
    plan(s,{title:'补齐 BX-17 夜间盐度缺测段',criterion:'提供至少 24 条订正记录、质量复核报告及新版本号。',minQty:24,budget:160,r:0,actor:3,kind:'周期更新',due:'2026-11-30'},'2026-11-20T02:00:00.000Z');
    return s;
  }
  return {sides,units,basis,gradeFactor,actors,rights,defaultRule,total,clone,seed,registerUse,declare,review,simulate,settle,balance,reserveBalance,issue,redeem,plan,submit,acceptTask};
})();
if(typeof module!=='undefined' && module.exports) module.exports=Operations;
