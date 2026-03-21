export type PriceBand = 'low' | 'mid' | 'high';
export type PowerProfile = 'ultra_low' | 'low' | 'medium' | 'high';
export type LifecycleStatus = 'active' | 'mature' | 'legacy' | 'new';
export type Stage = 'prototype' | 'production';

export interface FPGADevice {
  id: string;
  vendor: string;
  family: string;
  part_number: string;
  device_type: 'FPGA' | 'SoC FPGA' | 'Low Power FPGA';
  logic_cells: number;
  luts: number;
  ffs: number;
  bram_kb: number;
  uram_kb: number;
  dsp_blocks: number;
  transceiver_channels: number;
  transceiver_max_rate_gbps: number;
  pcie_support: string | null;
  ddr_support: string[];
  mipi_support: boolean;
  hard_cpu: boolean;
  gpio_count: number;
  lvds_pairs: number;
  package_options: string[];
  temp_grades: string[];
  power_profile: PowerProfile;
  toolchain: string[];
  lifecycle_status: LifecycleStatus;
  price_band: PriceBand;
  availability_score: number;
  community_score: number;
  board_maturity_score: number;
  board_complexity: 'low' | 'medium' | 'high';
  recommended_for: string[];
  not_recommended_for: string[];
}

export interface BoardRecommendation {
  id: string;
  name: string;
  vendor: string;
  device_ids: string[];
  stage_focus: Stage[];
  summary: string;
  price_band: PriceBand;
  maturity_score: number;
}

export interface TeamProfile {
  fpga_experience: 'beginner' | 'intermediate' | 'advanced';
  ddr_experience: boolean;
  serdes_experience: boolean;
  linux_experience: boolean;
  preferred_toolchains?: string[];
  preferred_vendors?: string[];
}

export interface BusinessContext {
  stage: Stage;
  budget_sensitivity: 'low' | 'medium' | 'high';
  prioritize_supply: boolean;
  prioritize_longevity: boolean;
  target_temp_grade?: string;
}

export interface SelectionRequest {
  query: string;
  topN?: number;
  applicationId?: string;
  constraints?: Partial<{
    min_logic_cells: number;
    min_luts: number;
    min_dsp_blocks: number;
    min_bram_kb: number;
    min_lvds_pairs: number;
    min_gpio_count: number;
    require_pcie: boolean;
    require_ddr: boolean;
    require_mipi: boolean;
    require_hard_cpu: boolean;
    max_power_profile: PowerProfile;
    max_price_band: PriceBand;
    preferred_package: string;
    vendor: string;
  }>;
  team?: Partial<TeamProfile>;
  business?: Partial<BusinessContext>;
}

export interface ExtractedSignals {
  camera_count?: number;
  required_pcie_gen?: number;
  required_ddr_gen?: number;
  toolchain_keywords: string[];
  vendor_keywords: string[];
  skill_warnings: string[];
  requirement_summary: string[];
}

export interface ParsedConstraints {
  applicationId: string;
  inferredTags: string[];
  hardConstraints: NonNullable<SelectionRequest['constraints']>;
  teamProfile: TeamProfile;
  businessContext: BusinessContext;
  normalizedQuery: string;
  extractedSignals: ExtractedSignals;
}

export interface ScoreDimension {
  raw: number;
  weighted: number;
  notes: string[];
}

export interface ScoreBreakdown {
  total: number;
  weights: Record<string, number>;
  dimensions: Record<string, ScoreDimension>;
}

export interface ApplicationProfile {
  id: string;
  title: string;
  description: string;
  defaultWeights: Record<string, number>;
  preferredTraits: string[];
  avoidedTraits: string[];
}

export interface StageAdvice {
  prototype: string[];
  production: string[];
}

export interface SelectionResult {
  rank: number;
  device: FPGADevice;
  score: ScoreBreakdown;
  reasons: string[];
  advantages: string[];
  risks: string[];
  whyBetterThanNext: string;
  cheaperAlternative?: FPGADevice;
  productionAlternative?: FPGADevice;
  toolchainAdvice: string[];
  boardRecommendations: BoardRecommendation[];
  stageAdvice: StageAdvice;
  fitSummary: string;
}

export interface StageComparison {
  prototypeTop?: FPGADevice;
  productionTop?: FPGADevice;
  summary: string[];
}

export interface SelectionResponse {
  parsed: ParsedConstraints;
  totalCandidates: number;
  warnings: string[];
  stageComparison: StageComparison;
  results: SelectionResult[];
}
