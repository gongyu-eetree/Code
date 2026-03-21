export function renderLayout(content) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FPGA Selection Agent MVP</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  ${content}
  <script type="module" src="/app.js"></script>
</body>
</html>`;
}
