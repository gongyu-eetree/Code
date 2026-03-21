const demos = [
  '低功耗 MIPI 双摄桥接模块，工业级，预算敏感',
  '需要 PCIe Gen3 和 DDR4 的数据采集卡',
  '用于高校教学的低成本 FPGA 开发板选型',
  'Linux 边缘网关，偏向 SoC FPGA',
  '工业电机控制，要求低功耗和长期供货'
];

const form = document.querySelector('#selection-form');
const statusEl = document.querySelector('#status');
const parsedPanel = document.querySelector('#parsed-panel');
const comparisonPanel = document.querySelector('#comparison-panel');
const resultsPanel = document.querySelector('#results-panel');

function pickDemo(index = 0) {
  const query = document.querySelector('#query');
  query.value = demos[index];
}

function formDataToPayload() {
  const value = (id) => document.querySelector(`#${id}`)?.value;
  const checked = (id) => document.querySelector(`#${id}`)?.checked;
  return {
    query: value('query'),
    applicationId: value('applicationId') || undefined,
    topN: Number(value('topN') || 3),
    constraints: {
      min_luts: Number(value('min_luts') || 0),
      min_dsp_blocks: Number(value('min_dsp_blocks') || 0),
      min_bram_kb: Number(value('min_bram_kb') || 0),
      min_gpio_count: Number(value('min_gpio_count') || 0),
      max_price_band: value('max_price_band'),
      max_power_profile: value('max_power_profile'),
      require_mipi: checked('require_mipi'),
      require_pcie: checked('require_pcie'),
      require_ddr: checked('require_ddr'),
      require_hard_cpu: checked('require_hard_cpu')
    },
    team: {
      fpga_experience: value('fpga_experience'),
      ddr_experience: checked('ddr_experience'),
      serdes_experience: checked('serdes_experience'),
      linux_experience: checked('linux_experience')
    },
    business: {
      stage: value('stage'),
      budget_sensitivity: value('budget_sensitivity'),
      prioritize_supply: checked('prioritize_supply'),
      prioritize_longevity: checked('prioritize_longevity'),
      target_temp_grade: value('target_temp_grade')
    }
  };
}

function renderParsed(parsed, count, warnings) {
  parsedPanel.classList.remove('hidden');
  const summary = parsed.extractedSignals.requirement_summary?.length
    ? parsed.extractedSignals.requirement_summary.map((item) => `<li>${item}</li>`).join('')
    : '<li>未从自然语言中提取到额外强约束。</li>';
  const warningHtml = warnings?.length
    ? `<div class="warning-box"><strong>风险提醒</strong><ul>${warnings.map((item) => `<li>${item}</li>`).join('')}</ul></div>`
    : '';
  parsedPanel.innerHTML = `
    <h2>需求解析</h2>
    <div class="summary-grid">
      <div class="summary-card"><strong>Application</strong><div>${parsed.applicationId}</div></div>
      <div class="summary-card"><strong>Tags</strong><div>${parsed.inferredTags.join(', ') || 'none'}</div></div>
      <div class="summary-card"><strong>Stage</strong><div>${parsed.businessContext.stage}</div></div>
      <div class="summary-card"><strong>Candidates</strong><div>${count}</div></div>
    </div>
    <div class="list-grid">
      <section class="list-card"><h4>自动提取约束</h4><ul>${summary}</ul></section>
      <section class="list-card"><h4>团队画像</h4><ul><li>FPGA 经验：${parsed.teamProfile.fpga_experience}</li><li>DDR：${parsed.teamProfile.ddr_experience ? '有经验' : '经验不足'}</li><li>SerDes：${parsed.teamProfile.serdes_experience ? '有经验' : '经验不足'}</li><li>Linux：${parsed.teamProfile.linux_experience ? '有经验' : '经验不足'}</li></ul></section>
      <section class="list-card"><h4>业务上下文</h4><ul><li>阶段：${parsed.businessContext.stage}</li><li>预算：${parsed.businessContext.budget_sensitivity}</li><li>供货优先：${parsed.businessContext.prioritize_supply ? '是' : '否'}</li><li>寿命优先：${parsed.businessContext.prioritize_longevity ? '是' : '否'}</li></ul></section>
    </div>
    ${warningHtml}
  `;
}

function renderStageComparison(stageComparison) {
  comparisonPanel.classList.remove('hidden');
  comparisonPanel.innerHTML = `
    <h2>原型阶段 vs 量产阶段</h2>
    <div class="compare-grid">
      <div class="list-card">
        <h4>Prototype 首选</h4>
        <p><strong>${stageComparison.prototypeTop?.part_number || '暂无'}</strong></p>
        <p class="muted">${stageComparison.prototypeTop ? `${stageComparison.prototypeTop.vendor} / ${stageComparison.prototypeTop.family}` : '无满足条件器件'}</p>
      </div>
      <div class="list-card">
        <h4>Production 首选</h4>
        <p><strong>${stageComparison.productionTop?.part_number || '暂无'}</strong></p>
        <p class="muted">${stageComparison.productionTop ? `${stageComparison.productionTop.vendor} / ${stageComparison.productionTop.family}` : '无满足条件器件'}</p>
      </div>
    </div>
    <div class="list-card"><h4>差异化建议</h4><ul>${(stageComparison.summary || []).map((item) => `<li>${item}</li>`).join('')}</ul></div>
  `;
}

function dimensionRows(score) {
  return Object.entries(score.dimensions).map(([key, value]) => `
    <div class="dimension-row">
      <span>${key}</span>
      <div class="dimension-bar"><div class="dimension-fill" style="width:${(value.raw * 100).toFixed(0)}%"></div></div>
      <strong>${(value.raw * 100).toFixed(0)}</strong>
    </div>
  `).join('');
}

function renderResults(results) {
  resultsPanel.classList.remove('hidden');
  if (!results.length) {
    resultsPanel.innerHTML = '<h2>推荐结果</h2><p class="warning">没有器件满足当前硬约束，请放宽 LUT / 价格带 / 功耗等级等条件。</p>';
    return;
  }

  const cards = results.map((result) => `
    <article class="result-card">
      <div class="result-head">
        <div>
          <h3>#${result.rank} · ${result.device.part_number}</h3>
          <div class="muted">${result.device.vendor} / ${result.device.family} / ${result.device.device_type}</div>
          <div>
            <span class="tag">${result.device.price_band}</span>
            <span class="tag">${result.device.power_profile}</span>
            <span class="tag">${result.device.lifecycle_status}</span>
          </div>
          <p class="success">${result.fitSummary}</p>
        </div>
        <div class="score-pill">Score ${(result.score.total * 100).toFixed(1)}</div>
      </div>
      <div class="list-grid">
        <section class="list-card"><h4>为什么推荐</h4><ul>${result.reasons.map((item) => `<li>${item}</li>`).join('')}</ul></section>
        <section class="list-card"><h4>主要优势</h4><ul>${result.advantages.map((item) => `<li>${item}</li>`).join('')}</ul></section>
        <section class="list-card"><h4>主要风险</h4><ul>${result.risks.map((item) => `<li class="risk">${item}</li>`).join('')}</ul></section>
        <section class="list-card"><h4>工具链建议</h4><ul>${result.toolchainAdvice.map((item) => `<li>${item}</li>`).join('')}</ul></section>
      </div>
      <div class="list-grid">
        <section class="list-card"><h4>优于第二名的原因</h4><p>${result.whyBetterThanNext}</p></section>
        <section class="list-card"><h4>替代器件</h4><p>更便宜：${result.cheaperAlternative ? result.cheaperAlternative.part_number : '无'}</p><p>更适合量产：${result.productionAlternative ? result.productionAlternative.part_number : '无'}</p></section>
        <section class="list-card"><h4>开发板建议</h4>${result.boardRecommendations.length ? `<ul>${result.boardRecommendations.map((board) => `<li><strong>${board.name}</strong> · ${board.summary}</li>`).join('')}</ul>` : '<p class="warning">暂无内置开发板，请优先评估官方 EVK 或第三方 SOM。</p>'}</section>
      </div>
      <div class="list-grid">
        <section class="list-card"><h4>阶段建议</h4><p><strong>Prototype</strong></p><ul>${result.stageAdvice.prototype.map((item) => `<li>${item}</li>`).join('')}</ul><p><strong>Production</strong></p><ul>${result.stageAdvice.production.map((item) => `<li>${item}</li>`).join('')}</ul></section>
        <section class="list-card"><h4>评分拆解</h4><div class="dimension-grid">${dimensionRows(result.score)}</div></section>
      </div>
    </article>
  `).join('');

  const compareRows = results.map((result) => `
    <tr>
      <td>${result.rank}</td>
      <td>${result.device.part_number}</td>
      <td>${result.device.logic_cells}</td>
      <td>${result.device.dsp_blocks}</td>
      <td>${result.device.pcie_support || 'No'}</td>
      <td>${result.device.ddr_support.join(', ') || 'No'}</td>
      <td>${result.device.mipi_support ? 'Yes' : 'No'}</td>
      <td>${result.device.toolchain.join(' / ')}</td>
      <td>${(result.score.total * 100).toFixed(1)}</td>
    </tr>`).join('');

  resultsPanel.innerHTML = `<h2>推荐结果</h2>${cards}<h2>候选器件对比</h2><table><thead><tr><th>Rank</th><th>Part</th><th>Logic Cells</th><th>DSP</th><th>PCIe</th><th>DDR</th><th>MIPI</th><th>Toolchain</th><th>Score</th></tr></thead><tbody>${compareRows}</tbody></table>`;
}

async function submit() {
  statusEl.textContent = '正在解析需求并生成推荐...';
  const payload = formDataToPayload();
  const response = await fetch('/api/selection/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  renderParsed(data.parsed, data.totalCandidates, data.warnings);
  renderStageComparison(data.stageComparison);
  renderResults(data.results);
  statusEl.textContent = `已完成推荐，候选器件 ${data.totalCandidates} 个。`;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await submit();
  } catch (error) {
    console.error(error);
    statusEl.textContent = '生成推荐失败，请检查输入或查看终端日志。';
  }
});

document.querySelector('#load-demo')?.addEventListener('click', () => pickDemo(0));
document.querySelectorAll('[data-demo-index]').forEach((button) => button.addEventListener('click', () => pickDemo(Number(button.dataset.demoIndex || '0'))));
pickDemo(0);
