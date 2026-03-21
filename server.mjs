import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { renderIndexPage } from './app/page.js';
import { handleParse } from './app/api/selection/parse/route.js';
import { handleSearch } from './app/api/selection/search/route.js';
import { handleRank } from './app/api/selection/rank/route.js';
import { handleRecommend } from './app/api/selection/recommend/route.js';
import { handleDevices } from './app/api/devices/route.js';
import { handleDeviceById } from './app/api/devices/[id]/route.js';

const PORT = Number(process.env.PORT || 3000);

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

async function serveStatic(pathname, res) {
  const filePath = join(process.cwd(), 'public', pathname.replace(/^\//, ''));
  const data = await readFile(filePath);
  const contentType = extname(filePath) === '.css' ? 'text/css' : 'application/javascript';
  res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const { pathname } = url;

    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderIndexPage());
      return;
    }
    if (pathname === '/styles.css' || pathname === '/app.js') {
      await serveStatic(pathname, res);
      return;
    }
    if (pathname === '/api/devices' && req.method === 'GET') {
      json(res, 200, handleDevices());
      return;
    }
    if (pathname.startsWith('/api/devices/') && req.method === 'GET') {
      const id = pathname.split('/').pop();
      const device = handleDeviceById(id || '');
      if (!device) {
        json(res, 404, { message: 'Device not found' });
        return;
      }
      json(res, 200, device);
      return;
    }
    if (pathname === '/api/selection/parse' && req.method === 'POST') {
      json(res, 200, handleParse(await parseBody(req)));
      return;
    }
    if (pathname === '/api/selection/search' && req.method === 'POST') {
      json(res, 200, handleSearch(await parseBody(req)));
      return;
    }
    if (pathname === '/api/selection/rank' && req.method === 'POST') {
      json(res, 200, handleRank(await parseBody(req)));
      return;
    }
    if (pathname === '/api/selection/recommend' && req.method === 'POST') {
      json(res, 200, handleRecommend(await parseBody(req)));
      return;
    }
    json(res, 404, { message: 'Not found' });
  } catch (error) {
    console.error(error);
    json(res, 500, { message: 'Internal server error', detail: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log(' FPGA Selection Agent MVP 已启动');
  console.log('----------------------------------------');
  console.log(` 本地地址: http://localhost:${PORT}`);
  console.log(` 健康检查: http://localhost:${PORT}/api/devices`);
  console.log(' 启动脚本: bash scripts/run-agent.sh');
  console.log(' 冒烟测试: bash scripts/smoke-test.sh');
  console.log(' 停止服务: Ctrl+C');
  console.log('========================================');
});
