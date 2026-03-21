import { boardsForDevice } from '../data/boards.js';

/** @typedef {import('../../types/domain').FPGADevice} FPGADevice */

function summarizeScore(score) {
  return Object.entries(score.dimensions)
    .sort((a, b) => b[1].weighted - a[1].weighted)
    .slice(0, 3)
    .map(([key]) => key);
}

function stageAdviceForDevice(device, parsed) {
  const prototype = [
    device.board_complexity === 'high' ? '原型阶段建议优先采购成熟 SOM/EVK，降低高速板级风险。' : '原型阶段可直接基于现成开发板快速验证主链路。',
    `优先使用 ${device.toolchain[0]} 官方参考设计建立 bring-up 基线。`
  ];
  const production = [
    device.lifecycle_status === 'new' ? '量产前请额外确认生命周期窗口与替代料方案。' : '量产阶段可提前冻结该器件及封装，建立二供与备料策略。',
    device.ddr_support.length > 0 ? '量产设计应尽早冻结 DDR 拓扑、时钟与 SI/PI 约束。' : '量产设计应聚焦 IO 保护、电源完整性与 EMC 验证。'
  ];
  if (parsed.businessContext.prioritize_supply) production.push('建议同步复核供货周期、代理渠道与生命周期公告。');
  return { prototype, production };
}

function pickAlternative(ranked, currentId, predicate) {
  return ranked.find((candidate) => candidate.device.id !== currentId && predicate(candidate.device))?.device;
}

/** @param {{device: FPGADevice, score: import('../../types/domain').ScoreBreakdown}[]} ranked */
export function buildSelectionResults(ranked, parsed, topN) {
  return ranked.slice(0, topN).map((entry, index) => {
    const next = ranked[index + 1];
    const cheaperAlternative = pickAlternative(ranked, entry.device.id, (device) => device.price_band === 'low');
    const productionAlternative = pickAlternative(ranked, entry.device.id, (device) => device.lifecycle_status === 'active' && device.availability_score >= 8);
    const dominant = summarizeScore(entry.score);
    const risks = [];
    if (entry.device.board_complexity === 'high') risks.push('板级设计与调试复杂度较高，建议保留 SI/PI 验证预算');
    if (entry.device.price_band === 'high') risks.push('器件成本较高，需关注原型和量产 BOM 压力');
    if (entry.device.lifecycle_status === 'new') risks.push('器件较新，量产前需复核长期供货稳定性');
    if (parsed.teamProfile.fpga_experience === 'beginner' && entry.device.board_complexity !== 'low') risks.push('团队经验偏初级时，学习曲线可能偏陡');
    if (!parsed.teamProfile.ddr_experience && parsed.hardConstraints.require_ddr) risks.push('当前团队 DDR 经验不足，建议优先选择参考设计成熟的平台');

    const reasons = [
      `综合得分 ${(entry.score.total * 100).toFixed(1)}，核心优势集中在 ${dominant.join(' / ')}。`,
      ...dominant.flatMap((key) => entry.score.dimensions[key].notes.slice(0, 2))
    ];

    const advantages = [
      `器件族：${entry.device.vendor} ${entry.device.family}。`,
      `资源：${entry.device.logic_cells.toLocaleString()} logic cells，${entry.device.dsp_blocks} DSP，${entry.device.bram_kb} KB BRAM。`,
      `接口：PCIe ${entry.device.pcie_support || '无'}；DDR ${entry.device.ddr_support.join('/') || '无'}；MIPI ${entry.device.mipi_support ? '支持' : '不支持'}。`,
      `工具链：${entry.device.toolchain.join(' / ')}。`
    ];

    let whyBetterThanNext = '当前器件在综合场景适配和工程落地风险之间更均衡。';
    if (next) {
      whyBetterThanNext = `它比第二名 ${next.device.part_number} 更优，主要因为总分高 ${(entry.score.total - next.score.total).toFixed(2)}，并在 ${dominant[0]} 上表现更强。`;
    }

    return {
      rank: index + 1,
      device: entry.device,
      score: entry.score,
      reasons,
      advantages,
      risks: risks.length > 0 ? risks : ['无明显致命风险，但仍应在样机阶段验证接口与供电裕量。'],
      whyBetterThanNext,
      cheaperAlternative,
      productionAlternative,
      toolchainAdvice: [
        `首选使用 ${entry.device.toolchain[0]} 建立参考设计。`,
        parsed.businessContext.stage === 'prototype' ? '原型阶段优先复用官方或社区开发板示例。' : '量产阶段应尽早冻结器件封装、DDR 拓扑与时钟树。'
      ],
      boardRecommendations: boardsForDevice(entry.device.id),
      stageAdvice: stageAdviceForDevice(entry.device, parsed),
      fitSummary: `该器件更偏向 ${parsed.businessContext.stage === 'prototype' ? '快速原型验证' : '稳健量产导入'}，并在 ${dominant[0]} 上形成主要竞争力。`
    };
  });
}
