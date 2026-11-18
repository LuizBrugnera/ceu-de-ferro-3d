'use strict';
/* analytics through the real server (SERVER=<path>, PORT_T; a folder of its own under the system's temp): welcome ana: 1, the host's batches
   kept as one gzip file a match and its summary at the end, everything else refused (a guest, a wrong match, an unknown kind, too fast),
   the list and a match by HTTP, a solo page's POST, the 90 days, ANALYTICS=0, the gask question report, and a real page as host that
   sends its match. About 40 s */
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), http = require('http'), { spawn } = require('child_process');
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-ana-srv-'));
process.env.ANA_DIR = DIR;
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const get = (p, port) => new Promise(res => http.get({ host: '127.0.0.1', port: port || N.PORT, path: p }, r => { let b = ''; r.on('data', d => { b += d; }); r.on('end', () => res({ code: r.statusCode, b, type: r.headers['content-type'] })); }).on('error', () => res({ code: 0, b: '' })));
const post = (p, body, port) => new Promise(res => { const q = http.request({ host: '127.0.0.1', port: port || N.PORT, path: p, method: 'POST', headers: { 'content-type': 'application/json' } }, r => { let b = ''; r.on('data', d => { b += d; }); r.on('end', () => res({ code: r.statusCode, b })); }); q.on('error', () => res({ code: 0 })); q.end(typeof body === 'string' ? body : JSON.stringify(body)); });
const list = era => { try { return fs.readdirSync(path.join(DIR, era)); } catch (e) { return []; } };
const lines = f => zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
(async () => {
  /* an old file and a fresh one, before the server starts: the old one goes */
  fs.mkdirSync(path.join(DIR, 'ww2'), { recursive: true });
  const oldF = path.join(DIR, 'ww2', '2026-01-01-aaaaaaaaaaaa.ndjson.gz'), newF = path.join(DIR, 'ww2', '2026-11-01-bbbbbbbbbbbb.ndjson.gz');
  fs.writeFileSync(oldF, zlib.gzipSync('{"k":"hdr","t":0}\n')); fs.writeFileSync(newF, zlib.gzipSync('{"k":"hdr","t":0,"era":"ww2"}\n'));
  const T = Date.now() / 1000; fs.utimesSync(oldF, T - 91 * 86400, T - 91 * 86400); fs.utimesSync(newF, T - 89 * 86400, T - 89 * 86400);
  await N.start(); console.log('server: ' + N.SERVER + ', analytics in ' + DIR);
  ok(!fs.existsSync(oldF) && fs.existsSync(newF), 'at start a match older than 90 days is deleted, one of 89 days stays');
  fs.unlinkSync(newF);
  const join = async (cls, model, room) => { const c = await N.raw(); c.send({ t: 'join', room: room || 'ww2', name: 'nome real', cls, model }); c.w = await c.wait('welcome', 800); return c; };
  const h = await join('tank', 'tiger'), g = await join('tank', 'sherman');
  ok(h.w && h.w.ana === 1 && h.w.host === h.w.id, 'welcome says ana: 1');
  const hdr = { k: 'hdr', v: 1, t: 0, era: 'ww2', fac: ['A', 'B'], doc: ['balanced', 'balanced'], pts: [] }, sn = t => ({ k: 'sn', t, tk: [600, 600], pt: [3, 3], pop: [[1, 1, 1], [1, 1, 1]] });
  h.send({ t: 'ana', n: 0, e: [hdr, sn(0)] }); await N.sleep(200);
  let f = list('ww2').filter(n => n.endsWith('.ndjson.gz'));
  ok(f.length === 1 && /^\d{4}-\d{2}-\d{2}-[0-9a-f]{12}\.ndjson\.gz$/.test(f[0]), 'the host\'s first batch makes one file, named by date and a random id: ' + f[0]);
  const F = path.join(DIR, 'ww2', f[0]);
  g.send({ t: 'ana', n: 0, e: [sn(5)] }); h.send({ t: 'ana', n: 3, e: [sn(5)] }); h.send({ t: 'ana', n: 0, e: [{ k: 'nope', t: 1 }] }); h.send({ t: 'ana', n: 0, e: [{ k: 'sn' }] }); h.send({ t: 'ana', n: 0, e: 'x' });
  await N.sleep(200);
  ok(lines(F).length === 2, 'refused: a guest\'s batch, another match, an unknown kind, an event without its time, a batch that is not a list');
  h.send({ t: 'ana', n: 0, e: [sn(10)] }); h.send({ t: 'ana', n: 0, e: [sn(20)] }); await N.sleep(200);
  const L = lines(F); ok(L.length === 4 && L[2].t === 10 && L[3].t === 20 && !JSON.stringify(L).includes('nome real'), 'later batches are appended (gzip members that read as one) and no player name is written');
  for (let i = 0; i < 12; i++) h.send({ t: 'ana', n: 0, e: [sn(100 + i)] });
  await N.sleep(300); const n2 = lines(F).length;
  ok(n2 - 4 === 7, 'too fast: of 12 batches at once, ' + (n2 - 4) + ' kept (10 a window of 15 s, 3 already used)');
  ok(!fs.existsSync(F.replace('.ndjson.gz', '.json')), 'no summary before the end');
  const lp = JSON.parse((await get('/ana/list')).b), inProg = f[0].slice(0, -10);
  ok(lp.m.length === 0 && (await get('/ana/m/ww2/' + inProg)).code === 404 && (await get('/ana/r/ww2/' + inProg)).code === 404, 'a match still in progress is neither listed nor served');
  await N.sleep(15100);
  h.send({ t: 'ana', n: 0, e: [{ k: 'end', t: 300, win: 1, why: 1, tk: [0, 100], lost: [[1, 2, 3], [4, 5, 6]], T: 300 }, { k: 'rep', t: 300, win: 1, dur: 300, dec: [] }], end: 1 });
  await N.sleep(200);
  const sum = JSON.parse(fs.readFileSync(F.replace('.ndjson.gz', '.json'), 'utf8'));
  ok(sum.end.win === 1 && sum.rep.dur === 300 && sum.hdr.fac[0] === 'A' && sum.src === 'online', 'the end writes the summary beside it: header, end and review');
  const ls = await get('/ana/list'), J = JSON.parse(ls.b);
  ok(ls.code === 200 && J.on === 1 && J.m.length === 1 && J.m[0].era === 'ww2' && J.m[0].sum.end.win === 1 && J.m[0].size > 0, 'GET /ana/list: the match with its summary');
  const m = await get('/ana/m/ww2/' + J.m[0].id); ok(m.code === 200 && /ndjson/.test(m.type) && m.b.trim().split('\n').length === lines(F).length, 'GET /ana/m: the whole match as ndjson');
  const r = await get('/ana/r/ww2/' + J.m[0].id); ok(r.code === 200 && JSON.parse(r.b).rep.dur === 300, 'GET /ana/r: its summary');
  ok((await get('/ana/m/ww2/..%2F..%2Fserver')).code === 404 && (await get('/ana/m/xx/' + J.m[0].id)).code === 404 && (await get('/ana/m/ww2/2026-01-01-000000000000')).code === 404, 'a bad name, era or a missing match: 404');
  const fake = i => '2026-05-01-' + i.toString(16).padStart(12, '0');
  for (let i = 0; i < 205; i++) { fs.writeFileSync(path.join(DIR, 'ww2', fake(i) + '.ndjson.gz'), zlib.gzipSync('{"k":"hdr","t":0}\n')); fs.writeFileSync(path.join(DIR, 'ww2', fake(i) + '.json'), JSON.stringify({ src: 'online', end: { win: 0 }, hdr: { fac: ['A', 'B'] } })); }
  const big = JSON.parse((await get('/ana/list')).b).m.map(o => o.id);
  ok(big.length === 200 && big[0] === J.m[0].id && big[1] === fake(204) && big[199] === fake(6) && !big.includes(fake(5)), 'GET /ana/list: at most 200 entries, the newest by name');
  for (let i = 0; i < 205; i++) { fs.unlinkSync(path.join(DIR, 'ww2', fake(i) + '.ndjson.gz')); fs.unlinkSync(path.join(DIR, 'ww2', fake(i) + '.json')); }
  /* a new match in the room is a new file; the next host carries the same match on */
  h.send({ t: 'cq', n: 1, ph: 0, T: 100, k: [600, 600], k0: 600, len: 0, p: [], l: [0, 0, 0, 0, 0, 0] }); await N.sleep(100);
  h.send({ t: 'ana', n: 1, e: [hdr] }); await N.sleep(150);
  h.close(); await g.wait('host', 800);
  g.send({ t: 'ana', n: 1, e: [sn(30)] }); await N.sleep(200);
  f = list('ww2').filter(n => n.endsWith('.ndjson.gz')); const F2 = f.map(n => path.join(DIR, 'ww2', n)).find(p => p !== F);
  ok(f.length === 2 && lines(F2).length === 2, 'the next match is another file, and the next host\'s batches go on in it');
  /* a solo page */
  const k = 'abcdef012345', p1 = await post('/ana', { k, era: 'modern', e: [Object.assign({}, hdr, { era: 'modern' })] }), p2 = await post('/ana', { k, era: 'modern', e: [sn(10)], end: 1 });
  const fm = list('modern');
  ok(p1.code === 200 && p2.code === 200 && fm.length === 1 && fm[0].endsWith(k + '.ndjson.gz') && lines(path.join(DIR, 'modern', fm[0])).length === 2, 'POST /ana from a solo page: one file under its key');
  ok((await post('/ana', { k: 'BAD', era: 'modern', e: [] })).code === 400 && (await post('/ana', { k, era: 'x', e: [] })).code === 400 && (await post('/ana', 'nope')).code === 400, 'a bad key, era or body: 400');
  /* the MCP's question passes the relay */
  const h2 = await join('tank', 'abrams', 'modern'); const g2 = await join('tank', 't90', 'modern');
  g2.send({ t: 'gask', q: { q: 'report' }, n: 4 }); const ask = await h2.wait('gask', 600);
  ok(ask && ask.q.q === 'report', 'gask with the question report reaches the host');
  /* a real page as the host of a ww2 room: its match reaches the disk */
  h2.close(); g2.close(); g.close();
  for (const n of list('ww2')) fs.unlinkSync(path.join(DIR, 'ww2', n));
  const C = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: 5, ana: true }), $ = C.$, Net = $('Net');
  await new Promise((res, rej) => { Net.ui.welcome = () => { C.newState('ww2', 'tiger', { net: true, cls: 'tank', host: Net.host === Net.id }); res(); }; Net.ui.refused = c => rej(new Error(c)); Net.connect('ww2', 'Host', 'tank', 'tiger'); });
  const S = () => $('S'); let i = 0;
  for (; i < 60 * 40; i++) { C.step(1 / 60); Net.tick(1 / 60); if (i === 60 * 32) S().cq.T = .1; if (i % 4 === 0) await new Promise(r => setImmediate(r)); }
  await N.sleep(400);
  const fw = list('ww2').filter(n => n.endsWith('.ndjson.gz')), ev = fw.length ? lines(path.join(DIR, 'ww2', fw[0])) : [];
  const kinds = {}; for (const e of ev) kinds[e.k] = (kinds[e.k] || 0) + 1;
  ok(Net.ana && S().net && S().host && fw.length === 1 && kinds.hdr === 1 && kinds.sn >= 3 && kinds.end === 1 && kinds.rep === 1, 'a real host page: its match on disk, ' + JSON.stringify(kinds));
  ok(list('ww2').some(n => n.endsWith('.json')) && S().anaRep && S().anaRep.over, 'and the summary at its end');
  Net.close && Net.close(); N.stop();
  /* ANALYTICS=0 */
  const port = N.PORT + 1, D0 = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-ana-off-'));
  const kid = spawn(process.execPath, [N.SERVER], { env: Object.assign({}, process.env, { PORT: String(port), ANALYTICS: '0', ANA_DIR: D0, HOST: '127.0.0.1' }), stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise(res => kid.stdout.on('data', d => { if (String(d).includes('no ar')) res(); }));
  const WS = N.WebSocket, ws = new WS('ws://127.0.0.1:' + port), got = [];
  await new Promise(res => ws.on('open', res)); ws.on('message', d => got.push(JSON.parse(d)));
  ws.send(JSON.stringify({ t: 'join', room: 'ww2', name: 'x', cls: 'tank', model: 'tiger' })); await N.sleep(200);
  ws.send(JSON.stringify({ t: 'ana', n: 0, e: [hdr] })); await N.sleep(200);
  const w0 = got.find(m => m.t === 'welcome');
  ok(w0 && w0.ana === 0 && fs.readdirSync(D0).length === 0 && (await get('/ana/list', port)).code === 404 && (await post('/ana', { k, era: 'ww2', e: [hdr] }, port)).code === 404, 'ANALYTICS=0: welcome ana: 0, nothing written, nothing served');
  ws.close(); kid.kill();
  /* key rotation does not lift the caps: a map of 3 keys and 30 keys from one sender; then a day's cap of 2 KB across keys */
  const srv = async env => { const port = N.PORT + 2, d = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-ana-rot-')), kd = spawn(process.execPath, [N.SERVER], { env: Object.assign({}, process.env, { PORT: String(port), ANA_DIR: d, HOST: '127.0.0.1' }, env), stdio: ['ignore', 'pipe', 'inherit'] });
    await new Promise(res => kd.stdout.on('data', x => { if (String(x).includes('no ar')) res(); })); return { port, d, kd }; };
  const size = d => { let n = 0; try { for (const e of fs.readdirSync(d)) for (const f of fs.readdirSync(path.join(d, e))) n += fs.statSync(path.join(d, e, f)).size; } catch (e) {} return n; };
  const keyN = i => i.toString(16).padStart(12, '0');
  { const R = await srv({ ANA_KEYS: '3' }), codes = [];
    for (let i = 0; i < 30; i++) codes.push((await post('/ana', { k: keyN(i), era: 'ww2', e: [hdr] }, R.port)).code);
    const files = fs.readdirSync(path.join(R.d, 'ww2')).length;
    ok(codes.filter(c => c === 200).length === 10 && codes.filter(c => c === 429).length === 20 && files === 10, 'rotating keys through a map of 3 does not reset the rate: ' + codes.filter(c => c === 200).length + ' of 30 accepted, ' + files + ' files');
    R.kd.kill(); fs.rmSync(R.d, { recursive: true, force: true }); }
  { const R = await srv({ ANA_DAY_MB: '0.002' }), codes = [], pad = [Object.assign({}, hdr, { pad: 'x'.repeat(700) })];
    for (let i = 0; i < 8; i++) codes.push((await post('/ana', { k: keyN(i), era: 'ww2', e: pad }, R.port)).code);
    ok(codes.filter(c => c === 200).length === 2 && codes[2] === 413 && R.d && fs.readdirSync(path.join(R.d, 'ww2')).length === 2, 'the day\'s cap holds across keys: ' + codes.join(','));
    R.kd.kill(); fs.rmSync(R.d, { recursive: true, force: true }); }
  fs.rmSync(DIR, { recursive: true, force: true }); fs.rmSync(D0, { recursive: true, force: true });
  done(); setTimeout(() => process.exit(), 100);
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
