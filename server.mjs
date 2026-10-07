import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript'};
const port = Number(process.env.PORT || 5173);
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['index.html','styles.css','src/app.js','src/store.js','src/catalog.js'].includes(relative)) { res.writeHead(404); res.end('Not found'); return; }
    const body = await readFile(path.join(root,relative));
    res.writeHead(200,{'Content-Type':`${types[path.extname(relative)]}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(body);
  } catch { res.writeHead(500); res.end('Unable to load application.'); }
}).listen(port,'127.0.0.1',()=>console.log(`Skyline Market ready at http://localhost:${port}`));
