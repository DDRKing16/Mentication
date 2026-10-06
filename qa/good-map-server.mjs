// Disposable local-only QA fixture server. Never included in the production build.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('public/good-map');
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const file = path.resolve(root, '.' + url.pathname.replace(/^\/good-map/, ''));
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(404).end();
    return;
  }
  try {
    let body = fs.readFileSync(file);
    const scenario = url.searchParams.get('scenario');
    if (file.endsWith('index.html') && scenario) {
      const seed = `const qaState={scr:${JSON.stringify(scenario === 'export-error' ? 'clinician' : scenario === 'legacy' ? 'step' : scenario === 'missing' ? 'win' : 'intro')},G:'x',ORDER:OPEN.map(k=>DECK.findIndex(d=>d.k===k)),i:16,hist:Array(16).fill(3),counts:{0:0,1:0,3:16},RQ:['move'],RATE:{move:7},LOSS:{},RHY:{},TOV:{},RI:0,mapId:'qa-map',createdAt:'2026-10-05T00:00:00Z',JST:{...JST,focus:'move',plan:[0,1,2],order:[0,1,2],baseline:null,sat:{move:null},attemptId:'qa-attempt',own:'Disposable legacy custom step',wk:{date:'2027-04-04',time:'09:30',atISO:'2027-04-03T23:30:00Z'},chk:{did:'no'}}};`;
      const setup = scenario === 'legacy' ? `localStorage.removeItem('goodmap-journey-v4');localStorage.setItem('goodmap-journey-v3',JSON.stringify(qaState));` : `localStorage.setItem('goodmap-journey-v4',JSON.stringify({version:4,state:qaState,maps:[],undo:[]}));`;
      const fault = scenario === 'save-error' ? `Storage.prototype.setItem=function(){throw new DOMException('QA injection','QuotaExceededError')};` : scenario === 'export-error' ? `URL.createObjectURL=function(){throw Error('QA export failure')};` : '';
      body = body.toString().replace('<script src="model.js">', `<script>${seed}${setup}${fault}</script><script src="model.js">`);
    }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(5188, '127.0.0.1');
