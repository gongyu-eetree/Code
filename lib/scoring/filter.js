/** @typedef {import('../../types/domain').FPGADevice} FPGADevice */
/** @typedef {import('../../types/domain').ParsedConstraints} ParsedConstraints */

const powerRank = { ultra_low: 0, low: 1, medium: 2, high: 3 };
const priceRank = { low: 0, mid: 1, high: 2 };

function extractPcieGeneration(value) {
  const matched = value?.match(/Gen(\d)/i);
  return matched ? Number(matched[1]) : 0;
}

function extractDdrGeneration(values) {
  return Math.max(0, ...values.map((value) => {
    const matched = value.match(/DDR(\d)/i);
    return matched ? Number(matched[1]) : 0;
  }));
}

/** @param {FPGADevice[]} deviceList @param {ParsedConstraints} parsed */
export function filterDevices(deviceList, parsed) {
  const c = parsed.hardConstraints;
  const requiredPcieGen = parsed.extractedSignals.required_pcie_gen || 0;
  const requiredDdrGen = parsed.extractedSignals.required_ddr_gen || 0;

  return deviceList.filter((device) => {
    if (device.logic_cells < c.min_logic_cells) return false;
    if (device.luts < c.min_luts) return false;
    if (device.dsp_blocks < c.min_dsp_blocks) return false;
    if (device.bram_kb < c.min_bram_kb) return false;
    if (device.lvds_pairs < c.min_lvds_pairs) return false;
    if (device.gpio_count < c.min_gpio_count) return false;
    if (c.require_pcie && !device.pcie_support) return false;
    if (c.require_ddr && device.ddr_support.length === 0) return false;
    if (c.require_mipi && !device.mipi_support) return false;
    if (c.require_hard_cpu && !device.hard_cpu) return false;
    if (powerRank[device.power_profile] > powerRank[c.max_power_profile]) return false;
    if (priceRank[device.price_band] > priceRank[c.max_price_band]) return false;
    if (c.preferred_package && !device.package_options.some((option) => option.includes(c.preferred_package))) return false;
    if (c.vendor && !device.vendor.toLowerCase().includes(c.vendor.toLowerCase())) return false;
    if (parsed.businessContext.target_temp_grade && !device.temp_grades.includes(parsed.businessContext.target_temp_grade)) return false;
    if (requiredPcieGen && extractPcieGeneration(device.pcie_support) < requiredPcieGen) return false;
    if (requiredDdrGen && extractDdrGeneration(device.ddr_support) < requiredDdrGen) return false;
    return true;
  });
}
