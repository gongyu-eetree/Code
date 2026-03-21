/** @typedef {import('../../types/domain').SelectionRequest} SelectionRequest */
/** @typedef {import('../../types/domain').ParsedConstraints} ParsedConstraints */

const DEFAULT_TEAM = {
  fpga_experience: 'intermediate',
  ddr_experience: false,
  serdes_experience: false,
  linux_experience: false,
  preferred_toolchains: [],
  preferred_vendors: []
};

const DEFAULT_BUSINESS = {
  stage: 'prototype',
  budget_sensitivity: 'medium',
  prioritize_supply: false,
  prioritize_longevity: false,
  target_temp_grade: 'commercial'
};

const scenarioKeywords = [
  { id: 'embedded_vision_bridge', words: ['mipi', 'camera', 'vision', 'bridge', '双摄', '摄像头'] },
  { id: 'pcie_data_acquisition', words: ['pcie', 'gen3', '采集卡', 'data acquisition', 'capture'] },
  { id: 'education_entry', words: ['教学', 'education', '高校', 'student', 'lab'] },
  { id: 'linux_soc_gateway', words: ['linux', 'soc', 'gateway', '网关'] },
  { id: 'industrial_control', words: ['industrial', 'motor', '控制', '工业', '电机'] },
  { id: 'low_power_edge_ai', words: ['edge ai', 'low power', '低功耗', 'inference'] },
  { id: 'high_speed_connectivity', words: ['serdes', 'high speed', '高速', 'connectivity'] }
];

const vendorKeywords = ['AMD', 'Intel', 'Altera', 'Lattice', 'Microchip', 'Efinix', 'Gowin'];
const toolchainKeywords = ['Vivado', 'Vitis', 'PetaLinux', 'Quartus', 'Radiant', 'Diamond', 'Libero', 'Efinity', 'Gowin EDA'];

function inferApplicationId(query) {
  const normalized = query.toLowerCase();
  for (const candidate of scenarioKeywords) {
    if (candidate.words.some((word) => normalized.includes(word.toLowerCase()))) {
      return candidate.id;
    }
  }
  return 'cost_optimized_general';
}

function inferTags(query) {
  const normalized = query.toLowerCase();
  const tags = new Set();
  if (normalized.includes('mipi') || normalized.includes('camera') || normalized.includes('vision') || normalized.includes('摄像头')) tags.add('mipi');
  if (normalized.includes('pcie')) tags.add('pcie');
  if (normalized.includes('ddr')) tags.add('ddr');
  if (normalized.includes('linux') || normalized.includes('soc')) tags.add('linux');
  if (normalized.includes('industrial') || normalized.includes('工业')) tags.add('industrial');
  if (normalized.includes('low power') || normalized.includes('低功耗')) tags.add('low_power');
  if (normalized.includes('budget') || normalized.includes('成本') || normalized.includes('预算')) tags.add('budget_sensitive');
  if (normalized.includes('教学') || normalized.includes('education')) tags.add('education');
  if (normalized.includes('board') || normalized.includes('开发板')) tags.add('board_friendly');
  return [...tags];
}

function extractNumericRequirement(query, expression) {
  const matched = query.match(expression);
  if (!matched) return undefined;
  return Number(matched[1]);
}

function extractSignals(query) {
  const lower = query.toLowerCase();
  const vendorMatches = vendorKeywords.filter((item) => lower.includes(item.toLowerCase()));
  const toolMatches = toolchainKeywords.filter((item) => lower.includes(item.toLowerCase()));
  const cameraCount = extractNumericRequirement(lower, /(\d+)\s*(camera|cam|摄像头|路)/i) || (lower.includes('双摄') ? 2 : undefined);
  const pcieGen = extractNumericRequirement(lower, /pcie\s*gen\s*(\d)/i) || extractNumericRequirement(lower, /gen\s*(\d)\s*pcie/i);
  const ddrGen = extractNumericRequirement(lower, /ddr\s*(\d)/i);
  const skillWarnings = [];
  if (lower.includes('不会ddr') || lower.includes('no ddr experience')) skillWarnings.push('团队明确表示缺少 DDR 经验');
  if (lower.includes('不会serdes') || lower.includes('no serdes experience')) skillWarnings.push('团队明确表示缺少 SerDes 经验');
  const requirementSummary = [];
  if (cameraCount) requirementSummary.push(`摄像头数量约 ${cameraCount} 路`);
  if (pcieGen) requirementSummary.push(`需要至少 PCIe Gen${pcieGen}`);
  if (ddrGen) requirementSummary.push(`偏好 DDR${ddrGen}`);
  if (lower.includes('industrial') || lower.includes('工业')) requirementSummary.push('目标为工业级温度');
  if (lower.includes('量产') || lower.includes('production')) requirementSummary.push('量产阶段要求更强生命周期与供货');
  return {
    camera_count: cameraCount,
    required_pcie_gen: pcieGen,
    required_ddr_gen: ddrGen,
    toolchain_keywords: toolMatches,
    vendor_keywords: vendorMatches,
    skill_warnings: skillWarnings,
    requirement_summary: requirementSummary
  };
}

function inferTeamProfile(query, requestTeam) {
  const lower = query.toLowerCase();
  const profile = {
    ...DEFAULT_TEAM,
    ...requestTeam,
    preferred_toolchains: requestTeam?.preferred_toolchains || [],
    preferred_vendors: requestTeam?.preferred_vendors || []
  };
  if (lower.includes('教学') || lower.includes('student')) {
    profile.fpga_experience = requestTeam?.fpga_experience || 'beginner';
  }
  if (lower.includes('linux')) profile.linux_experience = requestTeam?.linux_experience ?? true;
  if (lower.includes('不会ddr') || lower.includes('no ddr experience')) profile.ddr_experience = false;
  if (lower.includes('不会serdes') || lower.includes('no serdes experience')) profile.serdes_experience = false;
  return profile;
}

function inferBusinessContext(query, requestBusiness) {
  const lower = query.toLowerCase();
  const business = { ...DEFAULT_BUSINESS, ...requestBusiness };
  if (lower.includes('industrial') || query.includes('工业')) business.target_temp_grade = 'industrial';
  if (lower.includes('budget') || query.includes('预算') || query.includes('低成本')) business.budget_sensitivity = 'high';
  if (lower.includes('长期供货') || lower.includes('long life') || lower.includes('long supply')) {
    business.prioritize_longevity = true;
    business.prioritize_supply = true;
  }
  if (lower.includes('production') || query.includes('量产')) {
    business.stage = 'production';
    business.prioritize_longevity = true;
    business.prioritize_supply = true;
  }
  if (lower.includes('prototype') || query.includes('原型')) business.stage = 'prototype';
  return business;
}

/** @param {SelectionRequest} request @returns {ParsedConstraints} */
export function parseSelectionRequest(request) {
  const query = request.query || '';
  const applicationId = request.applicationId || inferApplicationId(query);
  const inferredTags = inferTags(query);
  const extractedSignals = extractSignals(query);
  const teamProfile = inferTeamProfile(query, request.team);
  const businessContext = inferBusinessContext(query, request.business);

  const preferredVendor = request.constraints?.vendor || extractedSignals.vendor_keywords[0] || teamProfile.preferred_vendors?.[0] || '';

  const hardConstraints = {
    min_logic_cells: request.constraints?.min_logic_cells ?? 0,
    min_luts: request.constraints?.min_luts ?? 0,
    min_dsp_blocks: request.constraints?.min_dsp_blocks ?? (applicationId === 'low_power_edge_ai' ? 64 : 0),
    min_bram_kb: request.constraints?.min_bram_kb ?? (applicationId === 'linux_soc_gateway' ? 2048 : 0),
    min_lvds_pairs: request.constraints?.min_lvds_pairs ?? 0,
    min_gpio_count: request.constraints?.min_gpio_count ?? (applicationId === 'industrial_control' ? 120 : 0),
    require_pcie: request.constraints?.require_pcie ?? inferredTags.includes('pcie'),
    require_ddr: request.constraints?.require_ddr ?? (inferredTags.includes('ddr') || inferredTags.includes('linux')),
    require_mipi: request.constraints?.require_mipi ?? inferredTags.includes('mipi'),
    require_hard_cpu: request.constraints?.require_hard_cpu ?? inferredTags.includes('linux'),
    max_power_profile: request.constraints?.max_power_profile ?? (inferredTags.includes('low_power') ? 'low' : 'high'),
    max_price_band: request.constraints?.max_price_band ?? (businessContext.budget_sensitivity === 'high' ? 'mid' : 'high'),
    preferred_package: request.constraints?.preferred_package ?? '',
    vendor: preferredVendor
  };

  if (applicationId === 'education_entry') {
    hardConstraints.max_price_band = request.constraints?.max_price_band ?? 'mid';
    hardConstraints.max_power_profile = request.constraints?.max_power_profile ?? 'medium';
  }
  if (applicationId === 'embedded_vision_bridge') {
    hardConstraints.require_mipi = request.constraints?.require_mipi ?? true;
    hardConstraints.max_power_profile = request.constraints?.max_power_profile ?? 'low';
  }
  if (applicationId === 'pcie_data_acquisition') {
    hardConstraints.require_pcie = request.constraints?.require_pcie ?? true;
    hardConstraints.require_ddr = request.constraints?.require_ddr ?? true;
  }

  return {
    applicationId,
    inferredTags,
    hardConstraints,
    teamProfile,
    businessContext,
    normalizedQuery: query.trim().toLowerCase(),
    extractedSignals
  };
}
