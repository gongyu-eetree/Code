export function renderHomePage({ demos, applications }) {
  return `
  <main class="page-shell">
    <section class="hero">
      <div>
        <p class="eyebrow">FPGA Selection Agent · MVP</p>
        <h1>面向工程决策的 FPGA 选型智能体</h1>
        <p class="hero-copy">把应用理解、硬约束过滤、多维评分和风险解释串成一条完整推荐链路，而不是只做参数筛选。</p>
      </div>
      <div class="hero-card">
        <h2>本版增强</h2>
        <ul>
          <li>解析 PCIe / DDR 代际与团队技能风险</li>
          <li>输出原型阶段 vs 量产阶段差异建议</li>
          <li>展示 Top 结果、替代器件与维度评分</li>
          <li>保留 Next.js 风格目录，当前零依赖可运行</li>
        </ul>
      </div>
    </section>

    <section class="grid two-col">
      <div class="panel">
        <h2>需求输入</h2>
        <form id="selection-form" class="stack-lg">
          <label class="stack-sm">
            <span>自然语言需求</span>
            <textarea id="query" name="query" rows="5" placeholder="例如：低功耗 MIPI 双摄桥接模块，工业级，预算敏感"></textarea>
          </label>

          <div class="grid form-grid">
            <label><span>场景模板</span><select id="applicationId" name="applicationId"><option value="">自动识别</option>${applications.map((app) => `<option value="${app.id}">${app.title}</option>`).join('')}</select></label>
            <label><span>Top N</span><input id="topN" name="topN" type="number" min="1" max="5" value="3" /></label>
            <label><span>当前阶段</span><select id="stage" name="stage"><option value="prototype">Prototype</option><option value="production">Production</option></select></label>
            <label><span>预算敏感度</span><select id="budget_sensitivity" name="budget_sensitivity"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></label>
            <label><span>团队经验</span><select id="fpga_experience" name="fpga_experience"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label><span>目标温度等级</span><select id="target_temp_grade" name="target_temp_grade"><option value="commercial">Commercial</option><option value="industrial">Industrial</option></select></label>
            <label><span>最小 LUT</span><input id="min_luts" name="min_luts" type="number" min="0" value="0" /></label>
            <label><span>最小 DSP</span><input id="min_dsp_blocks" name="min_dsp_blocks" type="number" min="0" value="0" /></label>
            <label><span>最小 BRAM(KB)</span><input id="min_bram_kb" name="min_bram_kb" type="number" min="0" value="0" /></label>
            <label><span>最小 GPIO</span><input id="min_gpio_count" name="min_gpio_count" type="number" min="0" value="0" /></label>
            <label><span>最大价格带</span><select id="max_price_band" name="max_price_band"><option value="low">Low</option><option value="mid" selected>Mid</option><option value="high">High</option></select></label>
            <label><span>最大功耗等级</span><select id="max_power_profile" name="max_power_profile"><option value="ultra_low">Ultra Low</option><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></label>
          </div>

          <div class="check-grid">
            <label><input type="checkbox" id="require_mipi" /> Require MIPI</label>
            <label><input type="checkbox" id="require_pcie" /> Require PCIe</label>
            <label><input type="checkbox" id="require_ddr" /> Require DDR</label>
            <label><input type="checkbox" id="require_hard_cpu" /> Require Hard CPU</label>
            <label><input type="checkbox" id="prioritize_supply" /> Prioritize Supply</label>
            <label><input type="checkbox" id="prioritize_longevity" /> Prioritize Longevity</label>
            <label><input type="checkbox" id="ddr_experience" /> Team knows DDR</label>
            <label><input type="checkbox" id="serdes_experience" /> Team knows SerDes</label>
            <label><input type="checkbox" id="linux_experience" /> Team knows Linux</label>
          </div>

          <div class="actions">
            <button type="submit">生成推荐</button>
            <button type="button" id="load-demo">载入示例</button>
          </div>
        </form>
      </div>

      <div class="panel">
        <h2>Demo 用例</h2>
        <div class="stack-sm demo-list">
          ${demos.map((demo, index) => `<button class="demo-item" data-demo-index="${index}"><strong>${index + 1}.</strong> ${demo}</button>`).join('')}
        </div>
        <h2>产品说明</h2>
        <ul class="stack-sm muted-list">
          <li>应用场景优先于单点参数。</li>
          <li>团队能力会影响推荐排名与风险提示。</li>
          <li>原型与量产阶段会得到不同建议。</li>
          <li>工具链、社区和开发板成熟度参与决策。</li>
        </ul>
      </div>
    </section>

    <section id="status" class="status">等待输入需求。</section>
    <section id="parsed-panel" class="panel hidden"></section>
    <section id="comparison-panel" class="panel hidden"></section>
    <section id="results-panel" class="panel hidden"></section>
  </main>`;
}
