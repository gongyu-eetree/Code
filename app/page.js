import { renderLayout } from '../components/layout.js';
import { renderHomePage } from '../components/home-page.js';
import { listApplicationProfiles } from '../lib/selection-service.js';

const demos = [
  '低功耗 MIPI 双摄桥接模块，工业级，预算敏感',
  '需要 PCIe Gen3 和 DDR4 的数据采集卡',
  '用于高校教学的低成本 FPGA 开发板选型',
  'Linux 边缘网关，偏向 SoC FPGA',
  '工业电机控制，要求低功耗和长期供货'
];

export function renderIndexPage() {
  return renderLayout(renderHomePage({ demos, applications: listApplicationProfiles() }));
}
