import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const root = 'E:/进组/课题五/Vector';
const skillDir = 'C:/Users/cheli/.codex/plugins/cache/openai-primary-runtime/presentations/26.1123.11515/skills/presentations';
const buildDir = path.join(root, '.codex-build');
const outputDir = path.join(root, '汇报材料');
const finalPath = path.join(outputDir, '科学数据平台建设汇报-最终版.pptx');
const C = {
  ink: '#172B3A', muted: '#536878', soft: '#718392', paper: '#F7F9FA', white: '#FFFFFF',
  line: '#D8E1E5', blue: '#2878A5', teal: '#168C83', coral: '#D56A50', gold: '#BF8D27',
  paleBlue: '#E8F2F7', paleTeal: '#E6F4F1', paleCoral: '#F9ECE8', paleGold: '#F8F2E3',
  paleGray: '#EDF1F3', green: '#318064', dark: '#122833', darkMuted: '#B7C7CD'
};
const FONT = 'Microsoft YaHei';
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function shape(slide, geometry, x, y, w, h, fill = 'none', stroke = 'none', sw = 0, name = undefined) {
  return slide.shapes.add({ geometry, name, position: { left: x, top: y, width: w, height: h }, fill, line: { style: 'solid', fill: stroke, width: sw } });
}
function text(slide, value, x, y, w, h, size = 26, color = C.ink, opts = {}) {
  const s = shape(slide, 'textbox', x, y, w, h, 'none', 'none', 0, opts.name);
  s.text = value;
  s.text.style = { fontSize: size, color, bold: !!opts.bold, typeface: FONT, alignment: opts.align || 'left', verticalAlignment: opts.valign || 'middle', wrap: 'square', autoFit: 'shrinkText', insets: 0, lineSpacing: opts.lineSpacing || 1.0 };
  return s;
}
function box(slide, x, y, w, h, title, body = '', accent = C.blue, tint = C.paleBlue, opts = {}) {
  const s = shape(slide, 'roundRect', x, y, w, h, opts.fill || C.white, opts.stroke || C.line, 1, opts.name);
  s.borderRadius = 7;
  shape(slide, 'rect', x, y, 7, h, accent, 'none', 0);
  text(slide, title, x + 22, y + (body ? 14 : 0), w - 40, body ? 38 : h, opts.titleSize || 25, accent, { bold: true, valign: body ? 'middle' : 'middle' });
  if (body) text(slide, body, x + 22, y + 55, w - 42, h - 66, opts.bodySize || 19, C.muted, { valign: 'top', lineSpacing: 1.08 });
  return s;
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 3) {
  const dx = x2 - x1, dy = y2 - y1;
  return slide.shapes.add({
    geometry: 'line',
    position: {
      left: Math.min(x1, x2), top: Math.min(y1, y2),
      width: Math.max(Math.abs(dx), 0.1), height: Math.max(Math.abs(dy), 0.1),
      horizontalFlip: dx * dy < 0
    },
    fill: 'none', line: { style: 'solid', fill: color, width }
  });
}
function title(slide, txt, sub = '') {
  text(slide, txt, 64, 38, 1152, 58, 43, C.ink, { bold: true });
  if (sub) text(slide, sub, 66, 101, 1120, 36, 21, C.muted);
  shape(slide, 'rect', 64, 150, 70, 5, C.teal);
}
function footer(slide, n) {
  text(slide, '科学数据平台建设汇报', 64, 680, 500, 20, 15, C.soft);
  text(slide, String(n).padStart(2, '0'), 1176, 678, 40, 22, 16, C.soft, { align: 'right' });
}
function notes(slide, content) { slide.speakerNotes.text = content; }
function newSlide(bg = C.paper) { const s = p.slides.add(); s.background.fill = bg; return s; }
function connector(slide, x1, y1, x2, y2, color = C.soft) {
  line(slide, x1, y1, x2, y2, color, 2);
  const horiz = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  if (horiz) shape(slide, x2 >= x1 ? 'triangle' : 'triangle', x2 - 7, y2 - 6, 12, 12, color, 'none', 0).position.rotation = x2 >= x1 ? 90 : 270;
  else shape(slide, 'triangle', x2 - 6, y2 - 7, 12, 12, color, 'none', 0).position.rotation = y2 >= y1 ? 180 : 0;
}
function processNode(slide, x, y, w, h, heading, detail, accent, tint) {
  shape(slide, 'roundRect', x, y, w, h, tint, accent, 1, heading);
  text(slide, heading, x + 12, y + 12, w - 24, 32, 22, accent, { bold: true, align: 'center' });
  text(slide, detail, x + 12, y + 49, w - 24, h - 55, 17, C.muted, { align: 'center', valign: 'top', lineSpacing: 1.05 });
}

// 1. Cover
{
  const s = newSlide(C.dark);
  text(s, '科学数据平台建设汇报', 84, 112, 1000, 76, 57, C.white, { bold: true });
  text(s, '工具集成管理 · Token 价值运营 · 张量向量数据底座', 88, 203, 1050, 46, 27, '#D4E2E6');
  shape(s, 'rect', 88, 290, 76, 6, C.teal);
  text(s, '面向科学数据可信处理、贡献确认与持续供给的系统演示', 88, 326, 870, 48, 24, '#D4E2E6');
  const xs = [88, 468, 848];
  const colors = [C.teal, C.gold, '#6BA7C5'];
  const labels = [['01', '工具处理工作台'], ['02', '贡献与收益运营'], ['03', '张量向量库']];
  labels.forEach((it, i) => {
    shape(s, 'rect', xs[i], 522, 310, 2, colors[i]);
    text(s, it[0], xs[i], 548, 60, 36, 18, colors[i], { bold: true });
    text(s, it[1], xs[i], 588, 310, 40, 25, C.white, { bold: true });
  });
  text(s, '北交大科学数据平台演示系统', 88, 672, 640, 20, 15, C.darkMuted);
  notes(s, '开场：本次汇报按三个并列工作区展开。工具管理与Token收益分配对应业务建设重点，张量向量库展示数据如何从登记、质检到检索。先说明系统是可交互的浏览器本地演示，再分别介绍能力、数据凭据和跨模块闭环。');
}

// 2. Reporting frame
{
  const s = newSlide(); title(s, '三条主线，一条业务闭环', '汇报顺序从工具生产、数据服务延伸到贡献收益与持续供给');
  const starts = [68, 462, 856], colors = [C.teal, C.gold, C.blue], tints = [C.paleTeal, C.paleGold, C.paleBlue];
  const heads = ['工具集成与管理', 'Token 收益分配与供给', '张量向量库'];
  const bods = [
    '说明工具如何登记、验证、组装流程并留存运行凭据。',
    '说明用量如何变成凭据，经过核验后形成分配建议和供给预算。',
    '说明科学记录如何经过质检、编码、建索引并支持可追溯检索。'
  ];
  for (let i = 0; i < 3; i++) {
    shape(s, 'roundRect', starts[i], 202, 354, 234, C.white, C.line, 1); shape(s, 'rect', starts[i], 202, 354, 8, colors[i]);
    text(s, `0${i + 1}`, starts[i] + 24, 230, 56, 38, 23, colors[i], { bold: true });
    text(s, heads[i], starts[i] + 24, 278, 306, 53, 27, C.ink, { bold: true, valign: 'top' });
    text(s, bods[i], starts[i] + 24, 340, 304, 77, 20, C.muted, { valign: 'top', lineSpacing: 1.08 });
  }
  text(s, '统一讲法', 72, 486, 130, 34, 21, C.teal, { bold: true });
  text(s, '能力边界', 72, 538, 160, 42, 24, C.ink, { bold: true });
  text(s, '凭据来源', 340, 538, 160, 42, 24, C.ink, { bold: true });
  text(s, '协同流程', 608, 538, 160, 42, 24, C.ink, { bold: true });
  text(s, '演示证据', 876, 538, 160, 42, 24, C.ink, { bold: true });
  text(s, '先说已经能做什么，再展示一条具体记录怎样流转，最后明确当前演示与生产服务的界限。', 72, 588, 1100, 38, 19, C.muted);
  footer(s, 2); notes(s, '讲述建议：每个主题统一采用四步。先说能力范围，再指出凭据来自哪里，展示流程如何和其他工作区衔接，最后用系统页面或示例数据作为证据。这样既突出已实现能力，也能准确交代本地演示属性。');
}

// 3. Tool management scope
{
  const s = newSlide(); title(s, '科学数据处理工具集成与管理', '把分散工具纳入可登记、可验证、可组合、可追溯的管理流程');
  const ys = [194, 283, 372, 461, 550];
  const labels = [
    ['工具目录', '按海洋、天文、生命等领域检索工具能力、提供方、版本与状态。'],
    ['注册与接入', '登记输入输出契约、运行依赖、许可证与样例，经过接入检查和审核。'],
    ['处理链配置', '将已发布工具组合成有序流程模板，保留节点配置与试运行记录。'],
    ['评价与运维', '关联运行编号、输入引用、工具版本、质量结果和失败原因。'],
    ['社区扩展', '审查新增或变更工具的主体信息、版本、许可和验证材料。']
  ];
  labels.forEach((r, i) => {
    const y = ys[i]; shape(s, 'rect', 74, y + 18, 42, 3, i === 0 ? C.teal : C.line);
    text(s, `0${i + 1}`, 74, y - 8, 42, 26, 16, C.teal, { bold: true });
    text(s, r[0], 144, y, 220, 42, 24, C.ink, { bold: true });
    text(s, r[1], 374, y + 1, 810, 48, 20, C.muted);
  });
  shape(s, 'roundRect', 72, 620, 1116, 34, C.paleCoral, 'none', 0);
  text(s, '演示边界：试运行由本地逻辑生成报告，不执行登记的外部代码，也不调用真实服务。', 88, 620, 1085, 34, 18, C.coral, { bold: true });
  footer(s, 3); notes(s, '这一部分按工具生命周期讲。先找到工具，再登记接口与依赖，通过验证和审核后发布。流程模板只选择已发布版本，运行后形成可复核凭据。社区扩展纳入同一治理流程。当前试运行生成明确标注的演示报告，并未运行第三方程序。');
}

// 4. Tool integration diagram
{
  const s = newSlide(); title(s, '工具工作台架构', '治理流程围绕工具版本和运行凭据组织');
  const x = [74, 304, 534, 764, 994], w = 188;
  const node = [
    ['工具目录', '能力 / 领域\n提供方 / 版本', C.teal, C.paleTeal],
    ['接入登记', '契约 / 依赖\n许可证 / 样例', C.blue, C.paleBlue],
    ['验证审核', '接入检查\n审核发布', C.gold, C.paleGold],
    ['处理链运行', '模板编排\n节点试运行', C.coral, C.paleCoral],
    ['运行与维护', '产物 / 质量\n社区变更', C.teal, C.paleTeal]
  ];
  node.forEach((n, i) => processNode(s, x[i], 246, w, 144, n[0], n[1], n[2], n[3]));
  for (let i = 0; i < 4; i++) connector(s, x[i] + w + 3, 318, x[i + 1] - 8, 318, C.soft);
  shape(s, 'roundRect', 134, 448, 1008, 104, C.white, C.line, 1);
  text(s, '关键追溯字段', 160, 468, 170, 31, 22, C.ink, { bold: true });
  text(s, '工具 ID 与版本', 355, 468, 205, 31, 20, C.blue, { bold: true, align: 'center' });
  text(s, '运行编号', 576, 468, 155, 31, 20, C.teal, { bold: true, align: 'center' });
  text(s, '输入引用', 756, 468, 155, 31, 20, C.gold, { bold: true, align: 'center' });
  text(s, '质量结果与产物', 933, 468, 185, 31, 20, C.coral, { bold: true, align: 'center' });
  text(s, '成功试运行可产生工具侧计量事件，失败记录保留排查依据。', 160, 514, 900, 25, 18, C.muted);
  footer(s, 4); notes(s, '指图说明：左侧目录提供统一发现入口；接入环节补齐接口和依赖信息；验证审核决定哪些版本可用于流程；流程节点产生运行记录和演示产物。运行编号、版本和输入引用支撑后续数据导入与计量。');
}

// 5. Usage metering
{
  const s = newSlide(); title(s, 'Token 使用与计量', '不同服务按各自业务单位计量，收入合计 4,229 Token');
  const rows = [
    { y: 214, name: '数据取用', qty: '940 条', rate: '2 Token / 条', amount: 1880, color: C.blue },
    { y: 319, name: '工具作业', qty: '58 次', rate: '18 Token / 次', amount: 1044, color: C.teal },
    { y: 424, name: '智能体调用', qty: '29 次', rate: '45 Token / 次', amount: 1305, color: C.coral }
  ];
  const maxWidth = 586;
  rows.forEach(r => {
    text(s, r.name, 80, r.y, 220, 34, 24, C.ink, { bold: true });
    text(s, r.qty, 308, r.y, 112, 34, 20, C.muted, { align: 'right' });
    text(s, r.rate, 438, r.y, 180, 34, 19, C.soft);
    shape(s, 'roundRect', 640, r.y + 2, maxWidth, 28, C.paleGray, 'none', 0).borderRadius = 5;
    shape(s, 'roundRect', 640, r.y + 2, maxWidth * r.amount / 4229, 28, r.color, 'none', 0).borderRadius = 5;
    text(s, r.amount.toLocaleString('en-US'), 1050, r.y - 4, 150, 40, 27, r.color, { bold: true, align: 'right' });
  });
  shape(s, 'rect', 80, 518, 1120, 2, C.line);
  text(s, '4,229', 80, 544, 240, 58, 44, C.ink, { bold: true });
  text(s, '本期演示计量收入', 324, 556, 270, 36, 21, C.muted);
  text(s, '事件来源', 704, 544, 132, 30, 19, C.teal, { bold: true });
  text(s, '工具成功节点 · 检索实际返回片段', 704, 576, 476, 34, 20, C.ink);
  text(s, 'Token 为可兑换服务权益的演示单位，不代表真实货币或生产收费。', 80, 634, 1090, 26, 17, C.coral);
  footer(s, 5); notes(s, '展示口径：数据 940 条乘以每条 2，工具 58 次乘以每次 18，智能体 29 次乘以每次 45，总额 4,229。图中的条形按金额比例绘制。实际检索只按返回片段计量。强调 Token 在当前演示中是服务权益单位，费率为可配置样例。');
}

// 6. Contribution and allocation
{
  const s = newSlide(); title(s, '贡献确认与分配试算', '分配建议建立在可追溯凭据和人工核验结果之上');
  const xs = [72, 296, 520, 744, 968];
  const flow = [
    ['用量事件', '数据 / 工具 /\n智能体调用', C.blue, C.paleBlue],
    ['贡献凭据', '主体 / 资源版本 /\n业务编号 / 证据', C.teal, C.paleTeal],
    ['核验去重', '确认有效贡献\n排除重复上报', C.gold, C.paleGold],
    ['规则试算', '计算得分与\n主体建议额度', C.coral, C.paleCoral],
    ['确认入账', '锁定批次快照\n保留核算依据', C.blue, C.paleBlue]
  ];
  flow.forEach((n, i) => processNode(s, xs[i], 190, 180, 134, n[0], n[1], n[2], n[3]));
  for (let i = 0; i < 4; i++) connector(s, xs[i] + 180, 257, xs[i + 1] - 6, 257, C.soft);
  shape(s, 'rect', 72, 375, 1120, 2, C.line);
  text(s, '示例规则', 80, 402, 160, 30, 20, C.teal, { bold: true });
  const vals = [['总收入', '4,229'], ['运营成本 10%', '422'], ['供给留存 15%', '634'], ['主体分配池', '3,173']];
  vals.forEach((v, i) => {
    const x = 80 + i * 275;
    text(s, v[0], x, 452, 232, 27, 19, C.muted);
    text(s, v[1], x, 488, 232, 47, 34, i === 3 ? C.teal : C.ink, { bold: true });
  });
  text(s, '主体池权重示例 45% / 30% / 25%', 80, 564, 510, 34, 21, C.ink, { bold: true });
  text(s, '支持修改权重并比较原方案、试算方案与变化额。', 610, 564, 570, 34, 20, C.muted);
  text(s, '正式权重、成本比例和主体映射需由项目规则确认。', 80, 625, 1090, 26, 17, C.coral);
  footer(s, 6); notes(s, '结合演示做法说明：确认 JOB-11-3 有效调用；JOB-11-1 是重复上报，核对后排除。默认三个主体权重为45%、30%、25%。总收入4,229中示例成本422、供给留存634，主体分配池3,173。调整权重会重新计算并展示变化，提交后形成批次快照。所有比例均为演示参数。');
}

// 7. Long-term supply
{
  const s = newSlide(); title(s, '长效供给与反馈优化', '留存额度支持持续维护，验收结果形成下一轮的供给与计量依据');
  text(s, '供给留存预算', 82, 205, 230, 32, 20, C.muted);
  text(s, '634', 82, 244, 230, 68, 54, C.gold, { bold: true });
  text(s, 'Token', 244, 267, 120, 34, 20, C.muted);
  shape(s, 'roundRect', 82, 338, 240, 12, C.paleGold, 'none', 0).borderRadius = 5;
  shape(s, 'roundRect', 82, 338, 240 * 160 / 634, 12, C.gold, 'none', 0).borderRadius = 5;
  text(s, 'BX-17 夜间盐度补录任务', 424, 199, 690, 38, 27, C.ink, { bold: true });
  const steps = [
    ['申报任务', '24 条订正记录\n质量报告编号', C.blue, C.paleBlue],
    ['交付验收', '版本 v1.3\n核对质量材料', C.gold, C.paleGold],
    ['发放激励', '160 Token\n形成维护贡献', C.teal, C.paleTeal],
    ['后续计量', '新版本实际使用\n进入下一轮核验', C.coral, C.paleCoral]
  ];
  const sx = [394, 594, 794, 994];
  steps.forEach((n, i) => processNode(s, sx[i], 290, 172, 132, n[0], n[1], n[2], n[3]));
  for (let i = 0; i < 3; i++) connector(s, sx[i] + 172, 356, sx[i + 1] - 7, 356, C.soft);
  text(s, '反馈优化重点', 82, 483, 200, 30, 21, C.teal, { bold: true });
  text(s, '核对订正质量 · 跟踪维护版本 · 观察后续真实使用与计量', 82, 525, 1080, 38, 23, C.ink, { bold: true });
  text(s, '当前任务验收记录与向量库数据更新由不同演示工作区管理，生产环境需通过后端任务和版本服务完成同步。', 82, 594, 1100, 44, 17, C.coral);
  footer(s, 7); notes(s, '展示供给预算如何支持维护任务。演示任务 BX-17 分配160 Token，提交24条订正记录、v1.3和质量报告编号后，由操作者验收。验收生成维护贡献凭据，后续版本调用可以进入下一轮计量。需要准确说明：当前本地演示中的供给验收不会自动修改向量库原始数据，生产化需连接实际版本管理服务。');
}

// 8. Tensor data workflow
{
  const s = newSlide(); title(s, '张量向量库：从科学记录到可追溯检索', '让每条检索结果能够返回数据源、原文位置、向量和索引版本');
  const xs = [72, 300, 528, 756, 984];
  const flow = [
    ['数据接入', 'TXT / CSV / JSON\n数值张量', C.blue, C.paleBlue],
    ['分片与质检', '去重 / 阈值\n位置保留', C.gold, C.paleGold],
    ['向量生成', '文本 256 维\n数值归一化', C.teal, C.paleTeal],
    ['索引版本', '首版 / 增量\n差异 / 切换', C.coral, C.paleCoral],
    ['检索与评测', '向量 / BM25\n混合 / Hit@K', C.blue, C.paleBlue]
  ];
  flow.forEach((n, i) => processNode(s, xs[i], 214, 190, 148, n[0], n[1], n[2], n[3]));
  for (let i = 0; i < 4; i++) connector(s, xs[i] + 190, 288, xs[i + 1] - 8, 288, C.soft);
  shape(s, 'roundRect', 88, 424, 1104, 130, C.white, C.line, 1);
  text(s, '示例数据形状', 116, 445, 200, 28, 19, C.muted);
  text(s, '4 × 256', 116, 480, 240, 46, 34, C.teal, { bold: true });
  text(s, '4 个有效片段，每个片段编码为 256 维向量', 364, 484, 650, 36, 22, C.ink);
  text(s, '样本编号 · 字符区间 · 原始记录 · 编码配置 · 索引版本', 116, 529, 1020, 27, 18, C.muted);
  text(s, '当前为浏览器本地工程验证：本地特征编码与向量检索流程，不等同于生产级张量数据库集群或远程模型服务。', 88, 600, 1100, 45, 17, C.coral);
  footer(s, 8); notes(s, '以浮标 BX-17 为例：登记六条输入，质量规则排除重复、符号和过短记录，形成四个有效片段。每个片段编码为256维向量，写入索引后执行检索。结果保留来源位置和版本。该实现是浏览器本地的工程演示，文本编码是本地特征方法，不能表述为已连接生产数据库集群或外部大模型。');
}

// 9. Tensor subsystem architecture
{
  const s = newSlide(); title(s, '张量向量库架构', '数据与运行记录在本地工作区内管理，处理链保留来源和版本上下文');
  const leftX = 88, topY = 204;
  const col1 = [['输入源', 'TXT / CSV / JSON\n数值张量', C.blue, C.paleBlue], ['质量处理', '解析 / 去重\n分片与质检', C.gold, C.paleGold]];
  const col2 = [['编码处理', '本地文本特征\n数值归一化', C.teal, C.paleTeal], ['索引管理', '集合 / 增量\n版本差异', C.coral, C.paleCoral]];
  const col3 = [['查询服务', '余弦 / BM25\n混合检索', C.blue, C.paleBlue], ['效果评测', '标注集 / Hit@K\nMRR@K', C.teal, C.paleTeal]];
  [[leftX, col1], [432, col2], [776, col3]].forEach(([x, arr]) => {
    arr.forEach((n, i) => processNode(s, x, topY + i * 172, 250, 126, n[0], n[1], n[2], n[3]));
  });
  connector(s, 338, 266, 422, 266, C.soft); connector(s, 338, 438, 422, 438, C.soft);
  connector(s, 682, 266, 766, 266, C.soft); connector(s, 682, 438, 766, 438, C.soft);
  shape(s, 'roundRect', 88, 574, 938, 54, C.white, C.line, 1);
  text(s, '关联凭据', 108, 586, 132, 27, 18, C.teal, { bold: true });
  text(s, '数据源 ID · 原始位置 · 运行编号 · 编码器 · 索引版本 · 查询记录', 250, 586, 740, 27, 18, C.ink);
  text(s, '当前没有共享数据库或远程计算服务。', 1040, 579, 170, 45, 17, C.coral, { align: 'center' });
  footer(s, 9); notes(s, '架构按处理、管理和查询分层表达。数据解析和质量处理保留原始位置，编码和索引版本对应工程运行，查询与评测提供可复查结果。当前状态保存在浏览器本地存储，生产部署还需要持久化数据服务、身份权限和可扩展计算。');
}

// 10. Overall architecture
{
  const s = newSlide(); title(s, '三工作区协同架构', '跨模块以事件和业务编号关联，工作区仍保留各自的数据边界');
  // top: tool workspace
  shape(s, 'roundRect', 70, 184, 332, 144, C.paleTeal, C.teal, 1);
  text(s, '科学数据处理工具工作区', 88, 201, 295, 34, 22, C.teal, { bold: true, align: 'center' });
  text(s, '工具登记 · 审核发布 · 流程试运行\n报告 / 工具版本 / 输入引用', 91, 246, 286, 62, 18, C.ink, { align: 'center', valign: 'top' });
  shape(s, 'roundRect', 474, 184, 332, 144, C.paleBlue, C.blue, 1);
  text(s, '张量向量库工作区', 492, 201, 295, 34, 22, C.blue, { bold: true, align: 'center' });
  text(s, '接收产物 · 质检编码 · 索引检索\n数据源 / 片段 / 索引版本', 495, 246, 286, 62, 18, C.ink, { align: 'center', valign: 'top' });
  shape(s, 'roundRect', 878, 184, 332, 144, C.paleGold, C.gold, 1);
  text(s, 'Token 价值运营工作区', 896, 201, 295, 34, 22, C.gold, { bold: true, align: 'center' });
  text(s, '使用计量 · 贡献核验 · 结算分配\n权益兑换 / 供给任务 / 追溯', 899, 246, 286, 62, 18, C.ink, { align: 'center', valign: 'top' });
  // bridge
  shape(s, 'roundRect', 236, 388, 808, 86, C.white, C.line, 1);
  text(s, '同源桥接事件日志', 266, 399, 225, 32, 23, C.ink, { bold: true });
  text(s, '事件 ID 去重  ·  来源与版本载荷  ·  状态更新  ·  跨标签页通知', 266, 438, 720, 24, 17, C.muted);
  connector(s, 236, 328, 336, 384, C.teal); connector(s, 640, 328, 640, 382, C.blue); connector(s, 1044, 328, 944, 384, C.gold);
  // arrows into value and vector
  connector(s, 450, 474, 450, 526, C.blue);
  connector(s, 830, 474, 830, 526, C.teal);
  text(s, '工具成功调用事件', 260, 484, 350, 24, 16, C.blue, { align: 'center' });
  text(s, '检索返回片段事件', 670, 484, 350, 24, 16, C.teal, { align: 'center' });
  shape(s, 'roundRect', 176, 534, 406, 88, C.paleBlue, C.blue, 1);
  text(s, '计量与核验队列', 198, 545, 360, 28, 22, C.blue, { bold: true, align: 'center' });
  text(s, '使用流水、待核验贡献、分配与结算', 198, 584, 360, 23, 17, C.ink, { align: 'center' });
  shape(s, 'roundRect', 698, 534, 406, 88, C.paleTeal, C.teal, 1);
  text(s, '数据接入与版本处理', 720, 545, 360, 28, 22, C.teal, { bold: true, align: 'center' });
  text(s, '产物登记、索引发布与后续用量', 720, 584, 360, 23, 17, C.ink, { align: 'center' });
  text(s, '演示联动要求同一浏览器与站点来源；各模块独立保存，本地事件日志不等于共享后端。', 92, 642, 1092, 25, 17, C.coral);
  footer(s, 10); notes(s, '这是全场的关键架构图。三个工作区共享的是事件语义和关联编号，不是同一数据库。工具成功运行会生成工具侧计量事件，工具产物进入向量库待接收区；向量检索按实际返回片段发布数据侧用量。Token工作区导入事件后仍需人工核验。当前桥接基于同源浏览器事件日志，生产环境需要持久化消息/任务服务与失败恢复。');
}

// 11. Demo sequence and rollout boundary
{
  const s = newSlide(); title(s, '现场演示顺序与建设边界', '用一条 BX-17 数据链展示跨工作区闭环');
  const items = [
    ['01', '工具试运行', '运行已发布样例，记录产物编号与成功调用。', C.teal],
    ['02', '产物入库', '在数据接入登记报告，完成质检、编码和索引发布。', C.blue],
    ['03', '实际检索', '查询 BX-17，展示返回片段、来源位置和索引版本。', C.gold],
    ['04', '计量核验', '核对来源与去重后确认贡献，查看分配与供给建议。', C.coral]
  ];
  items.forEach((it, i) => {
    const y = 190 + i * 91;
    text(s, it[0], 84, y, 58, 34, 21, it[3], { bold: true });
    text(s, it[1], 160, y, 210, 36, 23, C.ink, { bold: true });
    text(s, it[2], 384, y, 770, 40, 19, C.muted);
    if (i < 3) shape(s, 'rect', 103, y + 46, 2, 42, C.line);
  });
  shape(s, 'rect', 82, 570, 1116, 2, C.line);
  text(s, '演示已覆盖', 84, 596, 158, 29, 19, C.teal, { bold: true });
  text(s, '模块交互与业务规则验证', 260, 596, 315, 29, 19, C.ink);
  text(s, '生产化建设', 622, 596, 158, 29, 19, C.coral, { bold: true });
  text(s, '共享后端、身份权限、真实工具执行、正式权益规则与跨机构结算', 790, 588, 400, 48, 17, C.ink);
  footer(s, 11); notes(s, '收尾现场路径：工具样例试运行，报告登记到向量库，完成索引后检索 BX-17，回到使用与计量核对实际命中，再到贡献确认和分配试算。最后交代生产化需补齐共享后端、身份与授权、真实工具执行环境、正式费率和结算服务。');
}

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}
await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });
for (const i of [3, 5, 7, 8, 9]) {
  const stem = ['工具工作台架构图.png', 'Token分配闭环图.png', '长效供给流程图.png', '张量向量库处理架构图.png', '三工作区协同架构图.png'][[3,5,7,8,9].indexOf(i)];
  await writeBlob(path.join(outputDir, stem), await p.export({ slide: p.slides.getItem(i), format: 'png', scale: 1.5 }));
}
for (let i = 0; i < p.slides.items.length; i++) {
  await writeBlob(path.join(buildDir, `slide-${String(i + 1).padStart(2, '0')}.png`), await p.export({ slide: p.slides.getItem(i), format: 'png', scale: 1 }));
}
const montage = await p.export({ format: 'png', montage: true });
await writeBlob(path.join(buildDir, 'montage.png'), montage);
const draftPath = path.join(buildDir, 'candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(draftPath);
const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href);
const result = await finalizePresentation({
  workspaceDir: root,
  candidatePath: draftPath,
  finalPath,
  explicitTotalSlideCount: 11,
  pythonExecutable: 'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe',
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  fontPolicy: { basis: 'design', families: [FONT], scriptFonts: { ea: FONT } },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'validation-final.json')
});
console.log(JSON.stringify({ slides: p.slides.items.length, finalPath, result }, null, 2));
