# FPGA Selection Agent MVP

这是一个**可直接本地运行**的 FPGA 选型智能体 MVP。

它已经内置：
- 自然语言需求解析
- 参数约束过滤
- 多维评分排序
- 推荐理由 / 风险 / 替代器件 / 开发板建议
- 原型阶段 vs 量产阶段差异化建议

> 当前环境无法访问 npm registry，所以这个 MVP 采用 **零外部运行时依赖** 实现；你**不需要 `npm install`**，直接运行即可。

---

## 一分钟启动

### 方式 1：直接启动
```bash
node server.mjs
```

### 方式 2：使用启动脚本
```bash
bash scripts/run-agent.sh
```

启动后打开：
```bash
http://localhost:3000
```

---

## 如何确认它真的跑起来了

另开一个终端，执行：

```bash
bash scripts/smoke-test.sh
```

如果服务正常，你会看到：
- `GET /api/devices` 返回器件列表
- `POST /api/selection/recommend` 返回推荐结果
- 最后输出 `[Smoke Test] PASS`

---

## 常用命令

### 运行服务
```bash
node server.mjs
```

### 代码检查
```bash
npm run build
npm run typecheck
npm test
```

### API 冒烟验证
```bash
bash scripts/smoke-test.sh
```

---

## 页面里可以做什么

打开首页后，你可以：
- 输入自然语言需求
- 选择场景模板
- 添加 LUT / DSP / BRAM / GPIO / 功耗 / 价格带等约束
- 勾选 MIPI / PCIe / DDR / Hard CPU 等硬需求
- 查看：
  - Top N 推荐器件
  - 推荐理由
  - 风险提示
  - 更便宜替代器件
  - 更适合量产的替代器件
  - 开发板建议
  - Prototype vs Production 差异
  - 评分拆解

---

## 内置 API

- `POST /api/selection/parse`
- `POST /api/selection/search`
- `POST /api/selection/rank`
- `POST /api/selection/recommend`
- `GET /api/devices`
- `GET /api/devices/:id`

示例：

```bash
curl -s -X POST http://localhost:3000/api/selection/recommend \
  -H 'Content-Type: application/json' \
  -d '{"query":"Linux 边缘网关，偏向 SoC FPGA","topN":2}'
```

---

## 项目结构

- `app/`：页面与 API handler 入口
- `components/`：页面结构组件
- `lib/data/`：器件、场景、开发板数据
- `lib/parser/`：需求解析
- `lib/rules/`：专家规则
- `lib/scoring/`：过滤、评分、解释
- `tests/`：自动化测试
- `scripts/`：启动与冒烟脚本

---

## 说明

如果你现在看到的只是 PR diff 截图，而不是运行中的页面，请直接在仓库根目录执行：

```bash
bash scripts/run-agent.sh
```

然后用浏览器访问：

```bash
http://localhost:3000
```
