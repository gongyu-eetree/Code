import { getApplicationProfile } from '../data/applications.js';
import { boardsForDevice } from '../data/boards.js';
import { deviceRuleNotes, deriveWeights } from '../rules/expert-rules.js';

/** @typedef {import('../../types/domain').FPGADevice} FPGADevice */
/** @typedef {import('../../types/domain').ParsedConstraints} ParsedConstraints */
/** @typedef {import('../../types/domain').ScoreBreakdown} ScoreBreakdown */

const priceRank = { low: 1, mid: 0.6, high: 0.2 };
const lifecycleRank = { active: 0.9, mature: 0.8, new: 0.65, legacy: 0.3 };
const complexityRank = { low: 1, medium: 0.7, high: 0.35 };
const powerRank = { ultra_low: 1, low: 0.8, medium: 0.5, high: 0.2 };

function normalizedRatio(actual, target) {
  if (!target) return 1;
  return Math.max(0, Math.min(1, actual / target));
}

function extractPcieGen(value) {
  const matched = value?.match(/Gen(\d)/i);
  return matched ? Number(matched[1]) : 0;
}

function extractDdrGen(values) {
  return Math.max(0, ...values.map((value) => {
    const matched = value.match(/DDR(\d)/i);
    return matched ? Number(matched[1]) : 0;
  }));
}

function interfaceScore(device, parsed) {
  const notes = [];
  let score = 0.45;
  const requiredPcieGen = parsed.extractedSignals.required_pcie_gen || 0;
  const requiredDdrGen = parsed.extractedSignals.required_ddr_gen || 0;

  if (parsed.hardConstraints.require_pcie) {
    const deviceGen = extractPcieGen(device.pcie_support);
    score += device.pcie_support ? 0.2 : -0.3;
    if (device.pcie_support) {
      notes.push(`支持 ${device.pcie_support}`);
      if (requiredPcieGen > 0 && deviceGen >= requiredPcieGen) score += 0.08;
    }
  }
  if (parsed.hardConstraints.require_ddr) {
    const deviceDdrGen = extractDdrGen(device.ddr_support);
    score += device.ddr_support.length > 0 ? 0.14 : -0.2;
    if (device.ddr_support.length > 0) {
      notes.push(`支持 ${device.ddr_support.join('/')}`);
      if (requiredDdrGen > 0 && deviceDdrGen >= requiredDdrGen) score += 0.08;
    }
  }
  if (parsed.hardConstraints.require_mipi) {
    score += device.mipi_support ? 0.22 : -0.25;
    if (device.mipi_support) notes.push('支持 MIPI 友好接口');
  }
  if (parsed.hardConstraints.require_hard_cpu) {
    score += device.hard_cpu ? 0.2 : -0.25;
    if (device.hard_cpu) notes.push('具备硬核 CPU，适合 Linux/SoC');
  }
  if (parsed.applicationId === 'high_speed_connectivity' && device.transceiver_channels > 0) {
    score += 0.08;
    notes.push(`具备 ${device.transceiver_channels} 路高速收发器`);
  }
  return { raw: Math.max(0, Math.min(1, score)), notes };
}

function applicationScore(device, parsed, profile) {
  let score = 0.5;
  const notes = [];
  for (const trait of profile.preferredTraits) {
    if (device.recommended_for.some((value) => value.includes(trait) || trait.includes(value))) {
      score += 0.08;
      notes.push(`贴合 ${trait} 场景`);
    }
  }
  for (const trait of profile.avoidedTraits) {
    if (device.not_recommended_for.some((value) => value.includes(trait) || trait.includes(value))) {
      score -= 0.06;
    }
  }
  if (parsed.inferredTags.includes('industrial') && device.temp_grades.includes('industrial')) {
    score += 0.08;
    notes.push('提供工业级温度支持');
  }
  if (parsed.inferredTags.includes('budget_sensitive') && device.price_band === 'low') {
    score += 0.1;
    notes.push('更适合预算敏感项目');
  }
  if (parsed.extractedSignals.camera_count && device.mipi_support) {
    score += 0.05;
    notes.push(`适合 ${parsed.extractedSignals.camera_count} 路视觉输入类设计`);
  }
  return { raw: Math.max(0, Math.min(1, score)), notes };
}

function resourceScore(device, parsed) {
  const c = parsed.hardConstraints;
  const scores = [
    normalizedRatio(device.logic_cells, c.min_logic_cells),
    normalizedRatio(device.luts, c.min_luts),
    normalizedRatio(device.dsp_blocks, c.min_dsp_blocks),
    normalizedRatio(device.bram_kb, c.min_bram_kb),
    normalizedRatio(device.lvds_pairs, c.min_lvds_pairs || 1),
    normalizedRatio(device.gpio_count, c.min_gpio_count || 1)
  ];
  if (parsed.applicationId === 'pcie_data_acquisition' && device.transceiver_channels > 0) scores.push(Math.min(1, device.transceiver_channels / 8));
  if (parsed.applicationId === 'low_power_edge_ai') scores.push(Math.min(1, device.dsp_blocks / 256));
  return { raw: scores.reduce((sum, value) => sum + value, 0) / scores.length, notes: ['资源余量按需求下限归一化'] };
}

function toolchainScore(device, parsed) {
  const preferred = [...(parsed.teamProfile.preferred_toolchains || []), ...parsed.extractedSignals.toolchain_keywords];
  let raw = 0.6;
  const notes = [];
  if (preferred.length > 0) {
    const matched = preferred.some((tool) => device.toolchain.some((candidate) => candidate.toLowerCase().includes(tool.toLowerCase())));
    raw += matched ? 0.25 : -0.12;
    notes.push(matched ? '符合团队工具链偏好' : '与团队工具链偏好有偏差');
  }
  if (device.toolchain.some((tool) => /open-source/i.test(tool))) {
    raw += 0.05;
    notes.push('具备开放生态加成');
  }
  return { raw: Math.max(0, Math.min(1, raw)), notes };
}

function boardScore(device, parsed) {
  const boards = boardsForDevice(device.id);
  let raw = ((device.board_maturity_score / 10) * 0.7) + (complexityRank[device.board_complexity] * 0.3);
  const notes = [];
  if (boards.length > 0) {
    raw += 0.1;
    notes.push(`${boards.length} 款已知开发板/模块可用`);
  }
  if (parsed.businessContext.stage === 'prototype') {
    raw += 0.05;
    notes.push('原型阶段受益于成熟开发板');
  }
  if (parsed.applicationId === 'education_entry' && device.board_complexity === 'low') {
    raw += 0.05;
    notes.push('适合教学场景快速上手');
  }
  return { raw: Math.max(0, Math.min(1, raw)), notes };
}

function costScore(device, parsed) {
  let raw = priceRank[device.price_band];
  if (parsed.businessContext.budget_sensitivity === 'high' && device.price_band === 'low') raw += 0.18;
  if (parsed.businessContext.budget_sensitivity === 'low' && device.price_band === 'high') raw += 0.05;
  if (parsed.businessContext.stage === 'prototype' && device.price_band !== 'high') raw += 0.05;
  return { raw: Math.max(0, Math.min(1, raw)), notes: [`价格带 ${device.price_band}`] };
}

function supplyScore(device, parsed) {
  let raw = (device.availability_score / 10) * 0.55 + lifecycleRank[device.lifecycle_status] * 0.45;
  const notes = [`供货评分 ${device.availability_score}/10`, `生命周期 ${device.lifecycle_status}`];
  if (parsed.businessContext.prioritize_supply && device.availability_score >= 8) raw += 0.08;
  if (parsed.businessContext.prioritize_longevity && ['active', 'mature'].includes(device.lifecycle_status)) raw += 0.08;
  return { raw: Math.max(0, Math.min(1, raw)), notes };
}

function communityScore(device, parsed) {
  let raw = device.community_score / 10;
  const notes = [`社区成熟度 ${device.community_score}/10`];
  if (parsed.applicationId === 'education_entry' && device.community_score >= 8) raw += 0.08;
  if (parsed.applicationId === 'linux_soc_gateway' && device.hard_cpu) raw += 0.05;
  return { raw: Math.max(0, Math.min(1, raw)), notes };
}

/** @param {FPGADevice} device @param {ParsedConstraints} parsed @returns {ScoreBreakdown} */
export function scoreDevice(device, parsed) {
  const profile = getApplicationProfile(parsed.applicationId);
  const weights = deriveWeights(profile, parsed);
  const dimensions = {
    ApplicationFit: applicationScore(device, parsed, profile),
    ResourceFit: resourceScore(device, parsed),
    InterfaceFit: interfaceScore(device, parsed),
    ToolchainFit: toolchainScore(device, parsed),
    BoardFeasibility: boardScore(device, parsed),
    CostFit: costScore(device, parsed),
    SupplyLifecycleFit: supplyScore(device, parsed),
    CommunityFit: communityScore(device, parsed)
  };
  const rules = deviceRuleNotes(device, parsed);
  const powerModifier = parsed.inferredTags.includes('low_power') ? powerRank[device.power_profile] * 0.03 : 0;
  const totalBeforePenalty = Object.entries(dimensions).reduce((sum, [key, value]) => sum + (value.raw * weights[key]), 0) + powerModifier;
  const total = Math.max(0, Math.min(1, totalBeforePenalty - rules.penalty));
  const weightedDimensions = Object.fromEntries(
    Object.entries(dimensions).map(([key, value]) => [key, { ...value, weighted: value.raw * weights[key] }])
  );
  if (rules.notes.length > 0) weightedDimensions.ApplicationFit.notes.push(...rules.notes);
  return { total, weights, dimensions: weightedDimensions };
}

/** @param {FPGADevice[]} candidates @param {ParsedConstraints} parsed */
export function rankDevices(candidates, parsed) {
  return candidates
    .map((device) => ({ device, score: scoreDevice(device, parsed) }))
    .sort((a, b) => b.score.total - a.score.total);
}
