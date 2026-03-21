import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSelectionRequest } from '../lib/parser/selection-parser.js';
import { recommendSelection } from '../lib/selection-service.js';

test('parser infers vision bridge requirements and industrial context', () => {
  const parsed = parseSelectionRequest({ query: '低功耗 MIPI 双摄桥接模块，工业级，预算敏感' });
  assert.equal(parsed.applicationId, 'embedded_vision_bridge');
  assert.equal(parsed.hardConstraints.require_mipi, true);
  assert.equal(parsed.businessContext.target_temp_grade, 'industrial');
  assert.equal(parsed.extractedSignals.camera_count, 2);
});

test('recommendation returns PCIe/DDRx capable part for acquisition query', () => {
  const response = recommendSelection({ query: '需要 PCIe Gen3 和 DDR4 的数据采集卡', topN: 3, team: { serdes_experience: true, ddr_experience: true } });
  assert.ok(response.results.length >= 1);
  assert.match(response.results[0].device.pcie_support || '', /Gen3|Gen4/i);
  assert.ok(response.results[0].device.ddr_support.some((item) => /DDR4/i.test(item)));
});

test('stage comparison generates distinct guidance payload', () => {
  const response = recommendSelection({ query: '工业电机控制，要求低功耗和长期供货', topN: 2 });
  assert.ok(Array.isArray(response.stageComparison.summary));
  assert.ok(response.stageComparison.summary.length >= 1);
  assert.ok(response.results[0].stageAdvice.prototype.length >= 1);
  assert.ok(response.results[0].stageAdvice.production.length >= 1);
});
