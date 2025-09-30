# Stepico MicroPython 在线 IDE

这是一个面向 Stepico 系列 RP2040 设备（兼容 Raspberry Pi Pico）的纯前端在线 IDE。它通过浏览器 Web Serial API 直接和设备进行 USB 通信，提供类似 Thonny 的核心操作体验。

## 功能特性
- ✅ Monaco 风格（基于 CodeMirror）代码编辑器，内置语法高亮与快捷键
- ✅ 一键连接 Stepico / Pico 主控板、游戏机或 12 指神探调试工具
- ✅ 执行当前脚本（Raw REPL）并在终端窗口查看输出
- ✅ 将脚本写入设备 `main.py`，上电自动运行
- ✅ 交互式 REPL 输入，支持 Ctrl+C 中断
- ✅ 将编辑区代码导出到本地

## 使用方式
1. 启动本地静态服务器，例如：
   ```bash
   python -m http.server 8080
   ```
2. 在支持 Web Serial 的浏览器（Chrome 89+、Edge 89+ 等）访问 `http://localhost:8080`。
3. 点击“连接”，在弹窗中选择 Stepico 设备（USB VID `0x2E8A`）。
4. 通过编辑器编写 MicroPython 代码：
   - `Ctrl+R` / `Ctrl+Enter` 运行脚本
   - `Ctrl+S` 下载当前脚本到电脑
   - 点击“保存为 main.py”写入设备
   - 终端中输入命令并回车，可与设备交互

> ⚠️ 由于浏览器安全策略，Web Serial 只能在 HTTPS 或 `http://localhost` 环境下使用。

## 兼容性说明
- Stepico 核心板完全沿用了 Pico 的 USB 描述符，因此可直接识别。
- 游戏机和 12 指神探工具如同串口设备一样连接；如需自定义滤波，可在 `app.js` 的 `picoFilters` 中补充 VID/PID。
- 本工具完全在浏览器本地运行，无需后端服务，适合集成到企业官网或教育平台。

## 开发建议
- 如需定制界面，可修改 `style.css`。
- 如需扩展文件管理、固件烧录等高级功能，可继续在 `app.js` 基础上开发。

