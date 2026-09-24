import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import worker from './src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8787;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Local Assets Adapter matching Cloudflare env.ASSETS
const localAssetsEnv = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      let filePath = path.join(__dirname, 'frontend', url.pathname === '/' ? 'index.html' : url.pathname);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'frontend', 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);

      return new Response(content, {
        status: 200,
        headers: { 'Content-Type': contentType }
      });
    }
  }
};

const server = http.createServer(async (req, res) => {
  const fullUrl = `http://localhost:${PORT}${req.url}`;
  
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    const bodyText = Buffer.concat(bodyChunks).toString();
    const requestInit = {
      method: req.method,
      headers: req.headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && bodyText) {
      requestInit.body = bodyText;
    }

    const workerRequest = new Request(fullUrl, requestInit);

    try {
      const workerResponse = await worker.fetch(workerRequest, localAssetsEnv, {});
      res.statusCode = workerResponse.status;
      workerResponse.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const responseBuffer = Buffer.from(await workerResponse.arrayBuffer());
      res.end(responseBuffer);
    } catch (err) {
      console.error('Server error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 WEB QUẢN LÝ TIẾN ĐỘ CHUYỀN MAY ĐÃ KHỞI CHẠY LOCAL!`);
  console.log(`👉 ĐỊA CHỈ TRUY CẬP: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
