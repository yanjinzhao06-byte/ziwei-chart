/**
 * 本地静态服务器：绑 0.0.0.0，方便同一局域网内的手机/别人打开
 * 用法: node serve.cjs [端口]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.join(__dirname, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

const port = Number(process.argv[2] || process.env.PORT || 5199);

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(root, url === '/' ? 'index.html' : url);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, '0.0.0.0', () => {
    const ips = Object.values(os.networkInterfaces())
      .flat()
      .filter((n) => n && n.family === 'IPv4' && !n.internal)
      .map((n) => n.address);

    console.log(`\n  本机:   http://127.0.0.1:${port}`);
    ips.forEach((ip) => console.log(`  局域网: http://${ip}:${port}`));
    console.log(`\n  静态目录: ${root}\n`);
  });
