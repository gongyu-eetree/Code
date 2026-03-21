/** @typedef {import('../../types/domain').ApplicationProfile} ApplicationProfile */
/** @typedef {import('../../types/domain').ParsedConstraints} ParsedConstraints */
/** @typedef {import('../../types/domain').FPGADevice} FPGADevice */

/** @param {ApplicationProfile} profile @param {ParsedConstraints} parsed */
export function deriveWeights(profile, parsed) {
  const weights = { ...profile.defaultWeights };
  if (parsed.applicationId === 'education_entry') {
    weights.BoardFeasibility += 0.06;
    weights.CostFit += 0.05;
    weights.InterfaceFit -= 0.05;
    weights.ResourceFit -= 0.06;
  }
  if (parsed.businessContext.stage === 'prototype') {
    weights.BoardFeasibility += 0.06;
    weights.ToolchainFit += 0.03;
    weights.SupplyLifecycleFit -= 0.05;
  }
  if (parsed.businessContext.stage === 'production') {
    weights.SupplyLifecycleFit += 0.08;
    weights.CostFit += 0.03;
    weights.BoardFeasibility -= 0.04;
  }
  if (parsed.applicationId === 'linux_soc_gateway') {
    weights.ApplicationFit += 0.04;
    weights.InterfaceFit += 0.03;
  }
  if (parsed.applicationId === 'embedded_vision_bridge') {
    weights.InterfaceFit += 0.05;
    weights.CostFit += 0.02;
  }
  if (parsed.teamProfile.fpga_experience === 'beginner') {
    weights.BoardFeasibility += 0.05;
    weights.ToolchainFit += 0.03;
    weights.ResourceFit -= 0.04;
  }
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / total]));
}

/** @param {FPGADevice} device @param {ParsedConstraints} parsed */
export function deviceRuleNotes(device, parsed) {
  const notes = [];
  let penalty = 0;

  if (!parsed.teamProfile.ddr_experience && device.ddr_support.length > 0 && parsed.hardConstraints.require_ddr) {
    penalty += device.board_complexity === 'high' ? 0.08 : 0.04;
    notes.push('团队 DDR 经验有限，相关板级调试风险上升');
  }
  if (!parsed.teamProfile.serdes_experience && device.transceiver_channels > 0 && parsed.hardConstraints.require_pcie) {
    penalty += device.board_complexity === 'high' ? 0.1 : 0.05;
    notes.push('团队 SerDes 经验有限，高速链路 bring-up 难度较高');
  }
  if (parsed.applicationId === 'linux_soc_gateway' && device.hard_cpu) {
    penalty -= 0.06;
    notes.push('Linux/SoC 场景对硬核 CPU 有加权优势');
  }
  if (parsed.applicationId === 'embedded_vision_bridge' && device.mipi_support && ['ultra_low', 'low'].includes(device.power_profile)) {
    penalty -= 0.06;
    notes.push('视觉桥接场景偏好低功耗 MIPI 友好器件');
  }
  if (parsed.businessContext.stage === 'production' && device.lifecycle_status === 'new') {
    penalty += 0.05;
    notes.push('量产阶段对新器件生命周期稳定性更敏感');
  }
  if (parsed.businessContext.stage === 'production' && device.availability_score >= 8) {
    penalty -= 0.03;
    notes.push('供货与生命周期更适合量产阶段');
  }
  if (parsed.teamProfile.preferred_toolchains?.length && parsed.teamProfile.preferred_toolchains.some((tool) => device.toolchain.includes(tool))) {
    penalty -= 0.03;
    notes.push('符合团队现有工具链资产');
  }
  if (parsed.teamProfile.preferred_vendors?.length && parsed.teamProfile.preferred_vendors.some((vendor) => device.vendor.includes(vendor))) {
    penalty -= 0.02;
    notes.push('匹配品牌偏好，可减少导入成本');
  }
  return { penalty, notes };
}
