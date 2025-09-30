# EELib Shopify Theme

EELib 是由 **Eetree LLC** 打造的树莓派电子书与 KiCad 功能模块品牌体验。该仓库提供可直接上传至 Shopify 的主题包，延续 [Raspberry Pi Books & Magazines](https://www.raspberrypi.com/books-magazines/) 的栏目结构，覆盖电子书、功能模块、刊物订阅、学习路径与顾问服务场景。

## 目录结构

```
├── assets/           # 前端样式、脚本与 SVG 资源（theme.css, theme.js, *.svg）
├── config/           # 主题设置（settings_schema.json）
├── layout/           # 主题骨架（theme.liquid）
├── sections/         # 主页自定义区块（homepage.liquid）
├── snippets/         # 预留片段目录
└── templates/        # JSON 模板（index.json 挂载主页分区）
```

## 主要特性

- **可视化分区配置**：`sections/homepage.liquid` 将整页拆解为可配置块（英雄区、精选组合、电子书网格、模块列表、杂志订阅、学习路径、评价与联系表单）。商家可在主题编辑器中增删区块、替换文案与绑定商品。
- **商品驱动网格**：电子书与模块区块支持关联 Shopify 产品，自动读取标题、描述、价格与图片；若未绑定商品，将使用预置的示例数据与 SVG 封面。
- **内置交互脚本**：`assets/theme.js` 复用了原型中的导航折叠、购物车示例、商品筛选与表单反馈逻辑。
- **Raspberry Pi 灵感美学**：`assets/theme.css` 定义了响应式布局、渐变背景、卡片化样式与自适应排版。

## 快速开始

1. 在 Shopify 后台中使用 **上传自定义主题** 并选择此仓库的压缩包（或通过 Shopify CLI 部署）。
2. 打开 **在线商店 → 主题 → 自定义**，在主页中编辑 “EELib 首页” 分区：
   - 配置导航、文案与号召性按钮；
   - 在“电子书卡片”或“功能模块卡片”区块中绑定对应产品；
   - 如需自定义占位图，替换区块设置中的 SVG 文件名或上传图片。
3. 保存后即可在店铺预览 Raspberry Pi 灵感的 EELib 体验。

## 打包并上传到 Shopify

1. **下载或克隆仓库文件**：确保 `assets/`、`config/`、`layout/`、`sections/`、`templates/` 等目录位于主题根目录。
2. **在本地打包 Zip 文件**：
   ```bash
   cd /path/to/eelib-theme
   zip -r eelib-shopify-theme.zip *
   ```
   该压缩包需要包含上述文件夹与 `README.md` 等文件的根级结构，Shopify 会识别 `config/settings_schema.json` 和 `layout/theme.liquid` 等入口。
3. **上传到 Shopify 后台**：登录店铺后台 → **Online Store / 在线商店** → **Themes / 主题** → 点击右上角 **Upload theme / 上传主题**，选择刚刚生成的 `eelib-shopify-theme.zip` 并等待上传完成。
4. **设置为草稿或发布**：上传后主题会以草稿形式存在，点击 **Customize / 自定义** 即可进入编辑器。如果确认无误，使用 **Actions → Publish / 发布** 将其设为线上主题。
5. **（可选）使用 Shopify CLI 部署**：已安装 Shopify CLI 时，也可执行 `shopify theme push` 将本地主题同步到指定店铺，再用 `shopify theme publish` 设置为线上主题。

## 开发与构建

- 如需二次开发，安装 [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) 并执行 `shopify theme serve` 在本地预览。
- 自定义样式与脚本请直接修改 `assets/theme.css` 与 `assets/theme.js`。
- 主题无额外构建步骤，可直接打包整个目录上传。

## 许可

本主题及其素材仅供 Eetree LLC 与 EELib 品牌使用，引用了 Raspberry Pi Books & Magazines 页面结构作为设计灵感。请根据贵司需求调整后再发布上线。
