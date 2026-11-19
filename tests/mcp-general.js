'use strict';
/* the MCP bridge (mcp-general.js) against the relay (SERVER=<path>, default the project's server.js; PORT_T, default 8093; GENKEY set): a fake host answers gcmd and gask, the bridge is
   driven over its stdio (initialize, tools/list, get_state, a command, a question, send_command), and a bridge with a wrong key is refused */
const path = require('path'), { spawn } = require('child_process');
process.env.SERVER = process.env.SERVER || path.join(__dirname, '..', 'server.js'); process.env.GENKEY = 'secret';
/* a match the server keeps, for get_match_report (the server's analytics in a folder of its own) */
const fs = require('fs'), os = require('os'), zlib = require('zlib'), ANAD = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-mcp-ana-')), MATCH = '2026-11-18-0123456789ab';
process.env.ANA_DIR = ANAD; fs.mkdirSync(path.join(ANAD, 'ww2'));
fs.writeFileSync(path.join(ANAD, 'ww2', MATCH + '.ndjson.gz'), zlib.gzipSync('{"k":"hdr","t":0}\n'));
fs.writeFileSync(path.join(ANAD, 'ww2', MATCH + '.json'), JSON.stringify({ id: MATCH, era: 'ww2', src: 'tourney', hdr: { fac: ['A', 'B'], doc: ['cautious', 'aggressive'] }, end: { win: 0, why: 2, t: 1800 }, rep: { win: 0, dur: 1800, whyTxt: 'o tempo acabou' } }));
const N = require('./net'), { ok, done } = require('./harness');
const MCP = path.join(__dirname, '..', 'mcp-general.js'), kids = [];
function bridge(env) {
  const p = spawn(process.execPath, [MCP], { env: Object.assign({}, process.env, { CEU_URL: 'ws://localhost:' + N.PORT, CEU_ROOM: 'modern', CEU_SIDE: '1', CEU_KEY: 'secret', CEU_NAME: 'T' }, env), stdio: ['pipe', 'pipe', 'ignore'] });
  kids.push(p);
  let buf = '', n = 0; const waits = new Map(), bad = [];
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); let m; try { m = JSON.parse(l); } catch (e) { bad.push(l); continue; } const w = waits.get(m.id); if (w) { waits.delete(m.id); w(m); } } });
  const rpc = (method, params) => new Promise(res => { const id = ++n; waits.set(id, res); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); setTimeout(() => { if (waits.delete(id)) res(null); }, 12000); });
  const call = async (name, args) => { const r = await rpc('tools/call', { name, arguments: args || {} }); return r && r.result ? Object.assign({ text: r.result.content[0].text, isError: r.result.isError }, { json: (() => { try { return JSON.parse(r.result.content[0].text); } catch (e) { return null; } })() }) : { text: JSON.stringify(r), isError: true, json: null }; };
  return { p, rpc, call, bad, note: (m, params) => p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: m, params }) + '\n') };
}
(async () => {
  await N.start(); console.log('server: ' + N.SERVER);
  const h = await N.raw(); h.send({ t: 'join', room: 'modern', name: 'host', cls: 'tank', model: 'abrams' }); h.w = await h.wait('welcome', 800);
  ok(h.w && h.w.gen === 1 && h.w.host === h.w.id, 'the fake host joined and is the host of a relay with the gen feature');
  /* the fake host: answers every gcmd and gask */
  const seenCmd = [], seenAsk = [];
  h.ws.on('message', d => {
    const m = JSON.parse(d);
    if (m.t === 'gcmd') { seenCmd.push(m); const bad = m.c.c === 'nope'; h.send({ t: 'gres', to: m.from, n: m.n, ok: !bad, why: bad ? 'unknown' : '', id: bad ? 0 : 77 }); }
    if (m.t === 'gask') { seenAsk.push(m); h.send({ t: 'gres', to: m.from, n: m.n, ok: true, why: '', id: 0, r: m.q.q === 'spots' ? [{ x: 1, z: 2, a: 0, sc: 5, why: 'near' }] : m.q.q === 'report' ? { side: m.s, over: false, tickets: [{ loss: 3 }, null] } : { t: m.s, stock: { en: 9, mt: 9 } } }); }
  });

  const b = bridge({});
  const init = await b.rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  ok(init && init.result && init.result.protocolVersion === '2025-06-18' && init.result.capabilities.tools && init.result.serverInfo.name === 'ceu-general', 'initialize: the client\'s version is echoed, tools capability, server info');
  b.note('notifications/initialized');
  const init2 = await b.rpc('initialize', { protocolVersion: '1999-01-01' }); ok(init2 && init2.result.protocolVersion === '2025-11-25', 'initialize with an unknown version: the server answers with its latest');
  ok((await b.rpc('ping')).result && Object.keys((await b.rpc('ping')).result).length === 0, 'ping answers {}');
  const disc = await b.rpc('server/discover', { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } }); ok(disc && disc.result.supportedVersions.includes('2026-07-28') && disc.result.supportedVersions.includes('2025-11-25'), 'server/discover lists the supported versions');
  const old = await b.rpc('tools/list', { _meta: { 'io.modelcontextprotocol/protocolVersion': '1900-01-01' } }); ok(old && old.error && old.error.code === -32022 && old.error.data.supported.length > 1, 'an unsupported per-request version: error -32022 with the supported list');
  const tl = await b.rpc('tools/list');
  const names = tl.result.tools.map(t => t.name);
  ok(['get_state', 'get_log', 'build_site', 'produce_unit', 'cancel_order', 'set_priority', 'scrap_site', 'set_site_defence', 'set_reserve', 'scout', 'strike', 'send_command', 'ask_placement', 'seat', 'get_match_report'].every(x => names.includes(x)) && tl.result.tools.every(t => t.description && t.inputSchema && t.inputSchema.type === 'object'), 'tools/list: every tool with a description and an object schema');
  ok((await b.rpc('nosuch')).error.code === -32601 && (await b.rpc('tools/call', { name: 'nosuch' })).error.code === -32602, 'unknown method and unknown tool are protocol errors');

  /* the seat is claimed on connect: the host and everyone see gctl */
  const st0 = await b.call('seat', { action: 'status' });
  ok(!st0.isError && st0.json.heldByMe === true && st0.json.side === 1, 'the bridge claimed side 1\'s seat on connect');
  h.send({ t: 'ecs', s: 1, T: 33.5, v: [10, 20, 3, 4, 5, 6, 7, 8], c: 2, q: [4, 2, 1, 40, 0], r: [1, 2], kp: [], ms: [], ls: [], sl: [1, 100, 200, 9], kn: [5, 1, 300, 400, 12, 0], gd: [], sc: [], tg: 0, pp: [6, 5, 3, 9, 2, 2], po: [0, 120, 24, 8, 90, 12, 5, 100] });
  h.send({ t: 'gen', s: 1, T: 33.5, v: { doc: 'x', post: { k: 'att', s: 'text' }, road: null, ops: [], fm: [], sc: [], hit: null, focus: null, thr: null, want: null, gate: '', atkT: 0, ev: [], evT: -1 }, q: [1, 2, 3, 4, 5, 6] });
  h.send({ t: 'glog', s: 1, T: 33.5, e: [[30, 'eco', 'built a mine', 1, 2, null, null]] });
  h.send({ t: 'ecs', s: 0, T: 99, v: [0, 0, 0, 0, 0, 0, 0, 0], c: 0, q: [], r: [], kp: [], ms: [], ls: [], sl: [], kn: [], gd: [], sc: [], tg: 0 });   // the other side: relay does not route it here
  await N.sleep(300);
  const gs = await b.call('get_state');
  const j = gs.json;
  ok(!gs.isError && j && j.link.connected && j.link.seatHeldByMe && j.economy && j.economy.stock.en === 10 && j.economy.stock.mt === 20 && j.economy.controller === 'mcp' && j.economy.queue[0].id === 4 && j.economy.knownEnemySites[0].id === 5, 'get_state: the economy panel decoded');
  ok(j.economy.ageSeconds >= 0 && j.economy.ageSeconds < 5 && j.general.ageSeconds >= 0 && j.general.view.post.k === 'att' && j.general.squads[0].sqId === 1 && j.log.lines[0].text === 'built a mine' && j.log.ageSeconds >= 0, 'get_state: gen view-model, squads, log, each with an age in seconds');
  const gl = await b.call('get_log', { lines: 5 }); ok(gl.json && gl.json.lines.length === 1, 'get_log returns the log lines');
  const PP = j.economy.productionPlan;
  ok(PP && PP.posture === 'attack' && PP.populationBudget.men === 120 && PP.populationOut.vehicles === 12 && PP.fieldWantedVsOut.tank.wanted === 5 && PP.fieldWantedVsOut.tank.out === 3 && PP.fieldWantedVsOut.fighter.wanted === 2, 'get_state: the production plan the relay passed in ecs (posture, budget, wanted vs out by kind)');

  const bs = await b.call('build_site', { kind: 'mine', x: 120.5, z: -40 });
  ok(!bs.isError && bs.json.accepted === true && bs.json.id === 77 && seenCmd.length === 1 && JSON.stringify(seenCmd[0].c) === '{"c":"build","k":"mine","x":120.5,"z":-40}' && seenCmd[0].s === 1 && seenCmd[0].g === 1 && seenCmd[0].d === 'eco', 'build_site: gcmd reaches the host as {c: build, k, x, z} from the MCP (g 1, side 1), and the gres comes back');
  const pu = await b.call('produce_unit', { kind: 'abrams', count: 2, why: 'need armour' });
  ok(!pu.isError && JSON.stringify(Object.entries(seenCmd[1].c).sort()) === JSON.stringify(Object.entries({ c: 'make', k: 'abrams', n: 2, why: 'need armour' }).sort()), 'produce_unit maps to make {k, n, why}');
  const sd = await b.call('set_site_defence', { id: 7, infantry: 2, anti_air: 1 }); ok(!sd.isError && JSON.stringify(seenCmd[2].c) === '{"c":"def","id":7,"inf":2,"aa":1}', 'set_site_defence maps to def {id, inf, aa}');
  const sp = await b.call('set_priority', { id: 3, position: 0 }); ok(!sp.isError && JSON.stringify(seenCmd[3].c) === '{"c":"prio","id":3,"p":0}', 'set_priority maps to prio {id, p}');
  const last = () => JSON.stringify(Object.entries(seenCmd[seenCmd.length - 1].c).sort());
  const ppl = await b.call('set_production_plan', { kind: 'tank', count: 6, why: 'blindados' }); ok(!ppl.isError && last() === JSON.stringify(Object.entries({ c: 'pplan', k: 'tank', n: 6, why: 'blindados' }).sort()), 'set_production_plan maps to pplan {k, n, why}');
  const dsp = await b.call('dispatch_units', { kind: 'tank', count: 2, mission: 'defend', pi: 3, latitude: 0, roe: 'return', h_hour: 60 });
  ok(!dsp.isError && last() === JSON.stringify(Object.entries({ c: 'disp', k: 'tank', n: 2, mk: 'defend', pi: 3, lat: 0, roe: 'return', H: 60 }).sort()), 'dispatch_units maps to disp {k, n, mk, pi, lat, roe, H}, through the relay\'s keys');
  const asg = await b.call('assign_mission', { ids: [3, 4], mission: 'recon', x: 100, z: -20, r: 200, break_off: .3 });
  ok(!asg.isError && last() === JSON.stringify(Object.entries({ c: 'mis', ids: [3, 4], mk: 'recon', x: 100, z: -20, r: 200, brk: .3 }).sort()), 'assign_mission maps to mis {ids, mk, x, z, r, brk}');
  const nb = seenCmd.length, bad2 = [await b.call('dispatch_units', { kind: 'tank' }), await b.call('assign_mission', { ids: [], mission: 'recon', x: 1, z: 1 }), await b.call('set_production_plan', { kind: 'tank' })];
  ok(bad2.every(r => r.isError) && seenCmd.length === nb, 'dispatch_units without an area, assign_mission without squads and set_production_plan without a count are refused locally');
  const cv = await b.call('send_convoy', { node: 'p4', why: 'frente' }); ok(!cv.isError && last() === JSON.stringify(Object.entries({ c: 'conv', nd: 'p4', why: 'frente' }).sort()) && seenCmd[seenCmd.length - 1].d === 'cmd', 'send_convoy maps to conv {nd, why}, through the relay\'s key nd');
  const al = await b.call('airlift_supply', { node: 'b30300' }); ok(!al.isError && last() === JSON.stringify(Object.entries({ c: 'alift', nd: 'b30300' }).sort()), 'airlift_supply maps to alift {nd}');
  const spr = await b.call('set_supply_priority', { node: 'p2', priority: 3 }); ok(!spr.isError && last() === JSON.stringify(Object.entries({ c: 'sprio', nd: 'p2', p: 3 }).sort()), 'set_supply_priority maps to sprio {nd, p}');
  const nl = seenCmd.length, bad3 = [await b.call('send_convoy', { node: 'X1' }), await b.call('send_convoy', {}), await b.call('set_supply_priority', { node: 'p2', priority: 9 })];
  ok(bad3.every(r => r.isError) && seenCmd.length === nl, 'a node that is not b<id> or p<index>, none, or a priority out of -1..3: refused locally');
  const rv = await b.call('recover_vehicle', { id: 7, why: 'tanque na estrada' }); ok(!rv.isError && last() === JSON.stringify(Object.entries({ c: 'recv', id: 7, why: 'tanque na estrada' }).sort()) && seenCmd[seenCmd.length - 1].d === 'cmd', 'recover_vehicle maps to recv {id, why}');
  const mv = await b.call('send_medevac', { x: 4000, z: -200 }); ok(!mv.isError && last() === JSON.stringify(Object.entries({ c: 'medv', x: 4000, z: -200 }).sort()), 'send_medevac maps to medv {x, z}');
  const nr = seenCmd.length, bad4 = [await b.call('recover_vehicle', {}), await b.call('recover_vehicle', { id: 0 }), await b.call('send_medevac', { x: 1 })];
  ok(bad4.every(r => r.isError) && seenCmd.length === nr, 'recover_vehicle without an id or with id 0, send_medevac without z: refused locally');
  const n0 = seenCmd.length;
  const inv = [await b.call('build_site', { kind: 'castle', x: 1, z: 1 }), await b.call('produce_unit', { kind: 'Abrams' }), await b.call('produce_unit', { kind: 'x', count: 9 }), await b.call('scout', { x: 'a', z: 1 }), await b.call('send_command', { command: { c: 'x', key: 1 } }), await b.call('send_command', { command: { c: 'draw' } })];
  ok(inv.every(r => r.isError) && seenCmd.length === n0, 'invalid inputs are refused locally with isError, nothing sent');
  const rf = await b.call('send_command', { command: { c: 'nope' } }); ok(rf.isError && rf.json.accepted === false && /unknown/.test(rf.json.result), 'a host refusal comes back as an error with its reason');
  const sc = await b.call('send_command', { d: 'cmd', command: { c: 'ops', k: 'atk', ri: 1 } }); ok(!sc.isError && seenCmd[seenCmd.length - 1].d === 'cmd' && seenCmd[seenCmd.length - 1].c.ri === 1, 'send_command passes a raw command with d cmd');
  const sa = await b.call('send_command', { d: 'cmd', command: { c: 'atk', pi: 2, ids: [3, 4], H: 60 } }); ok(!sa.isError && JSON.stringify(seenCmd[seenCmd.length - 1].c) === '{"c":"atk","pi":2,"ids":[3,4],"H":60}', 'send_command passes a tactical command with a list of squad ids');
  const t0 = Date.now(); const [r1, r2, r3] = await Promise.all([b.call('scout', { x: 1, z: 2 }), b.call('strike', { id: 5 }), b.call('cancel_order', { id: 4 })]);
  ok(!r1.isError && !r2.isError && !r3.isError && Date.now() - t0 >= 550, 'three commands at once all get through, spaced out (rate limit)');
  const ap = await b.call('ask_placement', { kind: 'pow' }); ok(!ap.isError && ap.json.data[0].x === 1 && seenAsk[0].q.q === 'spots' && seenAsk[0].q.k === 'pow' && seenAsk[0].s === 1, 'ask_placement: gask spots reaches the host, the answer returns');
  const av = await b.call('ask_view'); ok(!av.isError && av.json.data.stock.en === 9 && seenAsk[1].q.q === 'view', 'ask_view returns the host\'s view');
  const gq = await b.call('send_command', { question: { q: 'pool', x: 10, z: 20 } }); ok(!gq.isError && seenAsk[2].q.q === 'pool' && seenAsk[2].q.x === 10, 'send_command passes a question (gask pool)');
  const gh = await b.call('get_state', { from_host: true }); ok(!gh.isError && seenAsk[3].q.q === 'state' && gh.json.data.stock.en === 9, 'get_state from_host asks the host for the whole picture (gask state)');
  const gp = await b.call('get_production_plan'); ok(!gp.isError && seenAsk[seenAsk.length - 1].q.q === 'plan', 'get_production_plan: the relay passes gask plan to the host');
  await new Promise(r => setTimeout(r, 1100)); const gl2 = await b.call('get_logistics'); ok(!gl2.isError && seenAsk[seenAsk.length - 1].q.q === 'logi', 'get_logistics: the relay passes gask logi to the host');
  await new Promise(r => setTimeout(r, 1100)); const gr = await b.call('get_recovery'); ok(!gr.isError && seenAsk[seenAsk.length - 1].q.q === 'rec', 'get_recovery: the relay passes gask rec to the host');
  const rel = await b.call('seat', { action: 'release' }); ok(!rel.isError && rel.json.heldByMe === false, 'seat release');
  const nc = await b.call('scout', { x: 1, z: 2 }); ok(nc.isError && /ctl/.test(nc.text), 'a command without the seat: refused ctl by the relay');
  const cl = await b.call('seat', { action: 'claim' }); ok(!cl.isError && cl.json.heldByMe === true, 'seat claim again');
  const mr = await b.call('get_match_report'); ok(!mr.isError && seenAsk[seenAsk.length - 1].q.q === 'report' && mr.json.data.side === 1 && mr.json.data.tickets[1] === null, 'get_match_report: the host is asked (gask report) about the match on, for this side');
  const ml = await b.call('get_match_report', { match: 'list' }); ok(!ml.isError && ml.json.matches.length === 1 && ml.json.matches[0].match === 'ww2/' + MATCH && ml.json.matches[0].winner === 0 && ml.json.matches[0].doctrines[1] === 'aggressive', 'get_match_report list: the matches the server keeps');
  const mo = await b.call('get_match_report', { match: 'ww2/' + MATCH }); ok(!mo.isError && mo.json.data.dur === 1800, 'get_match_report with a match from the list: its review');
  const mb = await b.call('get_match_report', { match: '../x' }), mn = await b.call('get_match_report', { match: 'ww2/2026-01-01-000000000000' }); ok(mb.isError && mn.isError, 'a bad or missing match is an error');
  ok(b.bad.length === 0, 'nothing but JSON-RPC on stdout');

  /* a wrong key is refused: its tools say so instead of hanging */
  const w = bridge({ CEU_KEY: 'wrong', CEU_SIDE: '0' });
  await w.rpc('initialize', { protocolVersion: '2025-11-25' });
  const wg = await w.call('get_state'); ok(wg.isError && /key|GENKEY/i.test(wg.text), 'a wrong key: get_state reports the refusal');
  const wc = await w.call('scout', { x: 1, z: 2 }); ok(wc.isError && /key|GENKEY/i.test(wc.text), 'a wrong key: a command returns the error, it does not hang');
  const wk = await new Promise(res => { w.p.on('exit', res); w.p.stdin.end(); setTimeout(() => res(null), 3000); }); ok(wk === 0, 'closing stdin ends the bridge process');

  /* a relay that does not support gen: the welcome has no flag. Stood in for by a fake relay. */
  const WebSocket = N.WebSocket, wss = new WebSocket.Server({ port: N.PORT + 1 });
  wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ t: 'welcome', id: 5, host: 0, players: [] }))));
  const o = bridge({ CEU_URL: 'ws://localhost:' + (N.PORT + 1) }); await o.rpc('initialize', { protocolVersion: '2025-11-25' });
  const og = await o.call('scout', { x: 1, z: 2 }); ok(og.isError && /not support/.test(og.text), 'a relay without the eco/gen welcome flag: a clear error');
  o.p.stdin.end(); wss.close();

  b.p.stdin.end(); h.close();
  await N.sleep(200);
  for (const k of kids) k.kill(); N.stop(); fs.rmSync(ANAD, { recursive: true, force: true }); done();
})().catch(e => { console.error(e); for (const k of kids) k.kill(); N.stop(); process.exit(1); });
