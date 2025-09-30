const terminalEl = document.getElementById("terminal");
const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connect");
const disconnectBtn = document.getElementById("disconnect");
const runBtn = document.getElementById("run");
const stopBtn = document.getElementById("stop");
const uploadBtn = document.getElementById("upload");
const downloadBtn = document.getElementById("download");
const replForm = document.getElementById("repl-form");
const replInput = document.getElementById("repl-input");
const boardSelector = document.getElementById("board");

const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  mode: "python",
  theme: "material-darker",
  lineNumbers: true,
  indentUnit: 4,
  tabSize: 4,
  lineWrapping: true,
  extraKeys: {
    "Ctrl-Enter": () => runCurrentScript(),
    "Ctrl-R": () => runCurrentScript(),
    "Ctrl-S": () => saveToComputer(),
  },
});

editor.setValue(`# Stepico MicroPython 示例
from machine import Pin
import time

led = Pin(25, Pin.OUT)

while True:
    led.toggle()
    time.sleep(0.5)
`);

class MicroPythonConnection {
  constructor(onData) {
    this.onData = onData;
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.keepReading = false;
  }

  async connect(filters) {
    if (!("serial" in navigator)) {
      throw new Error("当前浏览器不支持 Web Serial，请使用最新版 Chrome、Edge 或基于 Chromium 的浏览器，并确保通过 HTTPS 或 localhost 访问。");
    }

    this.port = await navigator.serial.requestPort({ filters });
    await this.port.open({ baudRate: 115200 });

    const textDecoder = new TextDecoderStream();
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    const textEncoder = new TextEncoderStream();
    this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
    this.writer = textEncoder.writable.getWriter();

    this.keepReading = true;
    this.readLoop();
    await this.softReset();
  }

  async disconnect() {
    this.keepReading = false;
    if (this.reader) {
      await this.reader.cancel().catch(() => {});
      this.reader = null;
    }
    if (this.writer) {
      await this.writer.close().catch(() => {});
      this.writer = null;
    }
    if (this.readableStreamClosed) {
      await this.readableStreamClosed.catch(() => {});
    }
    if (this.writableStreamClosed) {
      await this.writableStreamClosed.catch(() => {});
    }
    if (this.port) {
      await this.port.close().catch(() => {});
      this.port = null;
    }
  }

  async readLoop() {
    while (this.keepReading && this.reader) {
      try {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.onData(value);
        }
      } catch (err) {
        console.error("读取串口数据失败", err);
        this.onData(`\n[错误] ${err.message}\n`);
        break;
      }
    }
  }

  async writeRaw(data) {
    if (!this.writer) {
      throw new Error("尚未连接到设备");
    }
    await this.writer.write(data);
  }

  async softReset() {
    await this.writeRaw("\x03\x03");
    await this.delay(100);
    await this.writeRaw("\r");
  }

  async enterRawRepl() {
    await this.writeRaw("\x01");
    await this.delay(100);
  }

  async exitRawRepl() {
    await this.writeRaw("\x02");
    await this.delay(100);
  }

  async runScript(code) {
    await this.enterRawRepl();
    await this.delay(100);
    await this.writeRaw(code + "\x04");
    await this.delay(200);
    await this.exitRawRepl();
  }

  async uploadMainPy(code) {
    const base64 = btoa(unescape(encodeURIComponent(code)));
    const uploader = `import ubinascii\ndata = ubinascii.a2b_base64("${base64}")\nwith open('main.py','wb') as f:\n    f.write(data)\nprint('写入 main.py 完成')\n`;
    await this.runScript(uploader);
  }

  async sendRepl(line) {
    await this.writeRaw(line + "\r");
  }

  async stopExecution() {
    await this.writeRaw("\x03");
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const picoFilters = [
  { usbVendorId: 0x2e8a }, // Raspberry Pi / Stepico
];

const connection = new MicroPythonConnection((data) => appendTerminal(data));

function appendTerminal(message, type = "log-output") {
  if (!message) return;
  const span = document.createElement("span");
  span.className = type;
  span.textContent = message;
  terminalEl.appendChild(span);
  terminalEl.appendChild(document.createElement("br"));
  terminalEl.scrollTop = terminalEl.scrollHeight;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setConnectedState(isConnected) {
  connectBtn.disabled = isConnected;
  disconnectBtn.disabled = !isConnected;
  runBtn.disabled = !isConnected;
  stopBtn.disabled = !isConnected;
  uploadBtn.disabled = !isConnected;
  replInput.disabled = !isConnected;
  replForm.querySelector("button").disabled = !isConnected;
}

async function connectToBoard() {
  try {
    appendTerminal(`[信息] 正在请求连接 ${boardSelector.value}...`, "log-info");
    await connection.connect(picoFilters);
    setStatus("已连接");
    appendTerminal("[信息] 连接成功，已进入 MicroPython REPL", "log-info");
    setConnectedState(true);
  } catch (err) {
    appendTerminal(`[错误] ${err.message}`, "log-error");
    setStatus("未连接");
  }
}

async function disconnectBoard() {
  await connection.disconnect();
  setStatus("未连接");
  setConnectedState(false);
  appendTerminal("[信息] 已断开连接", "log-info");
}

async function runCurrentScript() {
  if (runBtn.disabled) return;
  try {
    appendTerminal("[信息] 正在运行脚本...", "log-info");
    await connection.runScript(editor.getValue());
  } catch (err) {
    appendTerminal(`[错误] ${err.message}`, "log-error");
  }
}

async function uploadMainPy() {
  if (uploadBtn.disabled) return;
  try {
    appendTerminal("[信息] 正在写入 main.py...", "log-info");
    await connection.uploadMainPy(editor.getValue());
    appendTerminal("[信息] main.py 写入完成。重新上电或复位后将自动运行。", "log-info");
  } catch (err) {
    appendTerminal(`[错误] ${err.message}`, "log-error");
  }
}

async function sendReplCommand(event) {
  event.preventDefault();
  if (!replInput.value.trim()) return;
  const command = replInput.value;
  replInput.value = "";
  appendTerminal(">>> " + command, "log-info");
  try {
    await connection.sendRepl(command);
  } catch (err) {
    appendTerminal(`[错误] ${err.message}`, "log-error");
  }
}

async function stopExecution() {
  try {
    await connection.stopExecution();
    appendTerminal("[信息] 已发送中断指令 (Ctrl+C)", "log-info");
  } catch (err) {
    appendTerminal(`[错误] ${err.message}`, "log-error");
  }
}

function saveToComputer() {
  const blob = new Blob([editor.getValue()], { type: "text/x-python" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "stepico_script.py";
  a.click();
  URL.revokeObjectURL(a.href);
}

connectBtn.addEventListener("click", connectToBoard);
disconnectBtn.addEventListener("click", disconnectBoard);
runBtn.addEventListener("click", runCurrentScript);
stopBtn.addEventListener("click", stopExecution);
uploadBtn.addEventListener("click", uploadMainPy);
downloadBtn.addEventListener("click", saveToComputer);
replForm.addEventListener("submit", sendReplCommand);

window.addEventListener("beforeunload", () => {
  if (connection.port) {
    connection.disconnect();
  }
});

appendTerminal("欢迎使用 Stepico 在线 IDE。请点击“连接”并允许浏览器访问设备。", "log-info");
setConnectedState(false);
