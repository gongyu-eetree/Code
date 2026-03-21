import { applicationProfiles, getApplicationProfile } from './data/applications.js';
import { devices, getDeviceById } from './data/devices.js';
import { boardsForDevice } from './data/boards.js';
import { parseSelectionRequest } from './parser/selection-parser.js';
import { filterDevices } from './scoring/filter.js';
import { rankDevices } from './scoring/rank.js';
import { buildSelectionResults } from './scoring/explain.js';

function cloneRequestWithStage(request, stage) {
  return {
    ...request,
    business: {
      ...(request.business || {}),
      stage,
      prioritize_longevity: stage === 'production' ? true : request.business?.prioritize_longevity,
      prioritize_supply: stage === 'production' ? true : request.business?.prioritize_supply
    }
  };
}

function recommendCore(request) {
  const parsed = parseSelectionRequest(request);
  const filtered = filterDevices(devices, parsed);
  const ranked = rankDevices(filtered, parsed);
  const results = buildSelectionResults(ranked, parsed, request.topN || 3);
  return { parsed, filtered, ranked, results };
}

function buildStageComparison(request) {
  const prototype = recommendCore(cloneRequestWithStage(request, 'prototype'));
  const production = recommendCore(cloneRequestWithStage(request, 'production'));
  const summary = [];
  if (prototype.results[0]) summary.push(`原型优先器件：${prototype.results[0].device.part_number}，更看重开发板成熟度与 bring-up 速度。`);
  if (production.results[0]) summary.push(`量产优先器件：${production.results[0].device.part_number}，更看重生命周期、供货与长期可维护性。`);
  if (prototype.results[0] && production.results[0] && prototype.results[0].device.id === production.results[0].device.id) {
    summary.push('原型与量产阶段的首选器件一致，说明该需求下技术与供应约束较为统一。');
  }
  return {
    prototypeTop: prototype.results[0]?.device,
    productionTop: production.results[0]?.device,
    summary
  };
}

export function parseOnly(request) {
  return parseSelectionRequest(request);
}

export function searchDevices(request) {
  const parsed = parseSelectionRequest(request);
  const filtered = filterDevices(devices, parsed);
  return {
    parsed,
    totalCandidates: filtered.length,
    applicationProfile: getApplicationProfile(parsed.applicationId),
    devices: filtered
  };
}

export function rankSelection(request) {
  const parsed = parseSelectionRequest(request);
  const filtered = filterDevices(devices, parsed);
  const ranked = rankDevices(filtered, parsed);
  return { parsed, totalCandidates: filtered.length, ranked };
}

export function recommendSelection(request) {
  const core = recommendCore(request);
  const warnings = [...core.parsed.extractedSignals.skill_warnings];
  if (core.filtered.length === 0) warnings.push('没有器件满足当前硬约束，请放宽价格带、功耗等级或接口要求。');
  if (core.filtered.length > 0 && core.filtered.length < 3) warnings.push('满足硬约束的候选器件较少，建议补充替代路线验证。');
  return {
    parsed: core.parsed,
    totalCandidates: core.filtered.length,
    warnings,
    stageComparison: buildStageComparison(request),
    results: core.results
  };
}

export function listDevices() {
  return devices;
}

export function getDeviceDetails(id) {
  const device = getDeviceById(id);
  if (!device) return null;
  return { ...device, boards: boardsForDevice(id) };
}

export function listApplicationProfiles() {
  return applicationProfiles;
}
