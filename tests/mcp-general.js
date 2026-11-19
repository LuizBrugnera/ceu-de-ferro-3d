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
const N = require('./net'), H = require('./harness'), { ok, done } = H;
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
  const seenCmd = [], seenAsk = [], force = [];
  h.ws.on('message', d => {
    const m = JSON.parse(d);
    if (m.t === 'gcmd' && force.length) { seenCmd.push(m); h.send({ t: 'gres', to: m.from, n: m.n, ok: false, why: force.shift(), id: 0 }); return; }
    if (m.t === 'gcmd') { seenCmd.push(m); const bad = m.c.c === 'nope' || (m.c.c === 'expand' && m.c.id === 9); h.send({ t: 'gres', to: m.from, n: m.n, ok: !bad, why: bad ? (m.c.c === 'expand' ? 'hasmine' : 'unknown') : '', id: bad ? 0 : 77 }); }
    if (m.t === 'gask') { seenAsk.push(m); h.send({ t: 'gres', to: m.from, n: m.n, ok: true, why: '', id: 0, r: m.q.q === 'spots' ? [{ x: 1, z: 2, a: 0, sc: 5, why: 'near' }] : m.q.q === 'report' ? { side: m.s, over: false, tickets: [{ loss: 3 }, null] } : { t: m.s, stock: { en: 9, mt: 9 }, sq: [{ id: 1, nm: 'Esquadra Urso', rank: 2, x: 5, z: 6, n: 4 }], vet: [{ who: 'T-90M', g: 'tank', rank: 3, xp: 40, x: 1, z: 2 }] } }); }
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
  ok(['get_state', 'get_log', 'build_site', 'produce_unit', 'cancel_order', 'set_priority', 'scrap_site', 'set_site_defence', 'set_reserve', 'scout', 'strike', 'send_command', 'ask_placement', 'seat', 'get_match_report', 'order_units', 'request_support', 'build_defence'].every(x => names.includes(x)) && tl.result.tools.every(t => t.description && t.inputSchema && t.inputSchema.type === 'object'), 'tools/list: every tool with a description and an object schema');
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
  await new Promise(r => setTimeout(r, 300)); const dm = await b.call('demolish_bridge', { x: 12000, z: -2600, why: 'recuo' }); ok(!dm.isError && last() === JSON.stringify(Object.entries({ c: 'man', k: 'demolish', x: 12000, z: -2600, why: 'recuo' }).sort()) && seenCmd[seenCmd.length - 1].d === 'cmd', 'demolish_bridge maps to man {k: demolish, x, z}');
  await new Promise(r => setTimeout(r, 300)); const lp = await b.call('lay_pontoon', { x: 12000, z: -2600 }); ok(!lp.isError && last() === JSON.stringify(Object.entries({ c: 'man', k: 'cross', x: 12000, z: -2600 }).sort()), 'lay_pontoon maps to man {k: cross, x, z}');
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
  const lastC = () => JSON.stringify(seenCmd[seenCmd.length - 1].c);   // the command as sent, keys in order
  const ou = await b.call('order_units', { verb: 'attack', point: 3, count: 4, route: [{ x: 100, z: 200 }, { x: 300.5, z: -40 }], why: 'cidade' });
  ok(!ou.isError && lastC() === '{"c":"ord","k":"atk","pi":3,"why":"cidade","n":4,"rt":[100,200,300.5,-40]}' && seenCmd[seenCmd.length - 1].d === 'cmd', 'order_units: an abstract order (ord) with the general\'s pick and a route flattened into rt');
  const rs = await b.call('request_support', { kind: 'fire', x: 10, z: 20, rounds: 5 }), rl = await b.call('request_support', { kind: 'lift', x: 10, z: 20, ids: [7], route: [{ x: 5, z: 5 }] });
  ok(!rs.isError && !rl.isError && JSON.stringify(seenCmd[seenCmd.length - 2].c) === '{"c":"req","k":"fire","x":10,"z":20,"n":5}' && lastC() === '{"c":"req","k":"lift","x":10,"z":20,"ids":[7],"rt":[5,5]}', 'request_support: req fire with its rounds, req lift with named squads and a route');
  const bd = await b.call('build_defence', { kind: 'trench', x: 1, z: 2, facing: 1.5 }); ok(!bd.isError && lastC() === '{"c":"fort","k":"trench","x":1,"z":2,"a":1.5}', 'build_defence: fort, the builder left to the general');
  const bads = [await b.call('order_units', { verb: 'charge', x: 1, z: 1 }), await b.call('order_units', { verb: 'attack' }), await b.call('order_units', { verb: 'defend', x: 1, z: 1, route: new Array(9).fill({ x: 1, z: 1 }) }), await b.call('request_support', { kind: 'nuke', x: 1, z: 1 }), await b.call('build_defence', { kind: 'trench', x: 1, z: 1, route: [{ x: 'a', z: 1 }] })];
  ok(bads.every(r => r.isError), 'a bad verb, no target, nine route points, a bad kind or a bad route point are refused by the bridge itself');
  const nSent = seenCmd.length, good = await b.call('send_command', { d: 'cmd', command: { c: 'move', x: 1, z: 2, ids: [3], rt: [10, 20, 30.5, -40] } });
  ok(!good.isError && lastC() === '{"c":"move","x":1,"z":2,"ids":[3],"rt":[10,20,30.5,-40]}', 'send_command passes a route (rt, flat x z pairs) as the relay takes it');
  const badRt = [[1, 2, 3], [], new Array(18).fill(1), [1, 'x'], [[1, 2]], [1, 2e5], 'x'];
  const rb = []; for (const rt of badRt) rb.push(await b.call('send_command', { d: 'cmd', command: { c: 'move', x: 1, z: 1, rt } }));
  ok(rb.every(r => r.isError) && seenCmd.length === nSent + 1, 'a ragged, empty, nine-point, text, nested, too-far or non-list route is refused by the bridge and never sent');
  const o2 = await b.call('order_units', { verb: 'fire', x: 5, z: 6, rounds: 4 }), o3 = await b.call('order_units', { verb: 'escort', x: 5, z: 6, count: 2 }), o4 = await b.call('order_units', { verb: 'defend', point: 2, create: 'squad', count: 2 });
  ok(!o2.isError && JSON.stringify(seenCmd[seenCmd.length - 3].c) === '{"c":"ord","k":"fire","x":5,"z":6,"n":4}' && JSON.stringify(seenCmd[seenCmd.length - 2].c) === '{"c":"ord","k":"esc","x":5,"z":6,"n":2}' && lastC() === '{"c":"ord","k":"def","pi":2,"k2":"squad","n":2}', 'order_units: fire takes rounds, escort takes count, create sends k2 with count');
  const o5 = [await b.call('request_support', { kind: 'lift', x: 1, z: 1, rounds: 5 }), await b.call('request_support', { kind: 'fire', x: 1, z: 1, count: 4 }), await b.call('request_support', { kind: 'smoke', x: 1, z: 1 }), await b.call('order_units', { verb: 'fire', x: 1, z: 1, count: 3 })];
  ok(o5.every(r => r.isError), 'rounds on a lift, count on fire, the smoke request, count on a fire order: refused, never mixed into n');
  const m0 = seenCmd.length, o6 = await b.call('order_units', { verb: 'attack', x: 1, z: 1, create: 'tank', count: 5 }), o7 = await b.call('order_units', { verb: 'attack', x: 1, z: 1, count: 5 });
  ok(o6.isError && !o7.isError && seenCmd.length === m0 + 1 && lastC() === '{"c":"ord","k":"atk","x":1,"z":1,"n":5}', 'create more than the 4 the dispatch fields: refused; 5 squads the general picks: sent');
  const bk = await b.call('build_defence', { kind: 'mineat', x: 1, z: 2 }); ok(!bk.isError && lastC() === '{"c":"fort","k":"mineat","x":1,"z":2}', 'build_defence offers the minefield (and bunker, atpost, post, aapos)');
  const t0 = Date.now(); const [r1, r2, r3] = await Promise.all([b.call('scout', { x: 1, z: 2 }), b.call('strike', { id: 5 }), b.call('cancel_order', { id: 4 })]);
  ok(!r1.isError && !r2.isError && !r3.isError && Date.now() - t0 >= 550, 'three commands at once all get through, spaced out (rate limit)');
  const ap = await b.call('ask_placement', { kind: 'pow' }); ok(!ap.isError && ap.json.data[0].x === 1 && seenAsk[0].q.q === 'spots' && seenAsk[0].q.k === 'pow' && seenAsk[0].s === 1, 'ask_placement: gask spots reaches the host, the answer returns');
  const av = await b.call('ask_view'); ok(!av.isError && av.json.data.stock.en === 9 && seenAsk[1].q.q === 'view', 'ask_view returns the host\'s view');
  const gq = await b.call('send_command', { question: { q: 'pool', x: 10, z: 20 } }); ok(!gq.isError && seenAsk[2].q.q === 'pool' && seenAsk[2].q.x === 10, 'send_command passes a question (gask pool)');
  const gh = await b.call('get_state', { from_host: true }); ok(!gh.isError && seenAsk[3].q.q === 'state' && gh.json.data.stock.en === 9, 'get_state from_host asks the host for the whole picture (gask state)');
  const gp = await b.call('get_production_plan'); ok(!gp.isError && seenAsk[seenAsk.length - 1].q.q === 'plan', 'get_production_plan: the relay passes gask plan to the host');
  await new Promise(r => setTimeout(r, 1100)); const gl2 = await b.call('get_logistics'); ok(!gl2.isError && seenAsk[seenAsk.length - 1].q.q === 'logi', 'get_logistics: the relay passes gask logi to the host');
  await new Promise(r => setTimeout(r, 1100)); const gr = await b.call('get_recovery'); ok(!gr.isError && seenAsk[seenAsk.length - 1].q.q === 'rec', 'get_recovery: the relay passes gask rec to the host');
  const gm = (await b.call('get_state', { refresh_map: true })).json;
  ok(gm && gm.general.squads[0].name === 'Esquadra Urso' && gm.general.squads[0].rank === 'veteran' && gm.map.veterans[0].unit === 'T-90M' && gm.map.veterans[0].rank === 'elite', 'get_state with the map: each squad\'s name and rank, the veteran vehicles and aircraft');
  await new Promise(r => setTimeout(r, 1100)); const gb = await b.call('get_bridges'); ok(!gb.isError && seenAsk[seenAsk.length - 1].q.q === 'brg', 'get_bridges: the relay passes gask brg to the host');
  /* MCP v2 (W13): the rest of the funnel, each tool to its command or question */
  const v2 = [['create_campaign', { h_hour: 90, why: 'H' }, '{"c":"camp","H":90,"why":"H"}'], ['attach_operation', { campaign: 3, operation: 12, role: 'fnt' }, '{"c":"camp","id":3,"op":12,"role":"fnt"}'],
    ['end_campaign', { campaign: 3 }, '{"c":"camp","id":3,"k":"end"}'], ['set_defence_policy', { point: 2, infantry: 3, reaction: 2 }, '{"c":"dpol","pi":2,"inf":3,"qrf":2}'],
    ['set_defence_policy', { site: 40001, anti_air: 1 }, '{"c":"dpol","id":40001,"aa":1}'], ['triage_threat', { id: 5, priority: -1 }, '{"c":"triage","id":5,"p":-1}'],
    ['send_qrf', { id: 5, ids: [3, 4] }, '{"c":"qrf","id":5,"ids":[3,4]}'], ['claim_deposit', { deposit: 6, infantry: 2 }, '{"c":"expand","id":6,"inf":2}'],
    ['lay_minefield', { kind: 'ap', x: 10, z: 20, route: [{ x: 1, z: 2 }] }, '{"c":"fort","k":"mineap","x":10,"z":20,"rt":[1,2]}'], ['clear_mines', { x: 10, z: 20, ids: [7] }, '{"c":"clear","x":10,"z":20,"ids":[7]}'],
    ['sabotage', { point: 4, why: 'cargas' }, '{"c":"sabot","pi":4,"why":"cargas"}'], ['arm_militia', { x: 5, z: 6 }, '{"c":"mil","x":5,"z":6}']];
  const v2ok = []; for (const [nm, a, want] of v2) { const r = await b.call(nm, a); v2ok.push(!r.isError && lastC() === want || nm + ' sent ' + lastC()); }
  ok(v2ok.every(x => x === true), 'MCP v2: create_campaign, attach_operation, end_campaign, set_defence_policy, triage_threat, send_qrf, claim_deposit, lay_minefield, clear_mines, sabotage, arm_militia map to camp, dpol, triage, qrf, expand, fort, clear, sabot, mil (' + v2ok.filter(x => x !== true).join('; ') + ')');
  const v2n = seenCmd.length, v2bad = [await b.call('set_defence_policy', { point: 1, site: 2 }), await b.call('set_defence_policy', { infantry: 1 }), await b.call('triage_threat', { id: 1, priority: 4 }), await b.call('lay_minefield', { kind: 'nuke', x: 1, z: 1 }), await b.call('sabotage', {}), await b.call('attach_operation', { campaign: 1 })];
  ok(v2bad.every(r => r.isError) && seenCmd.length === v2n, 'MCP v2: a policy for both or neither place, a priority out of range, a bad minefield, a sabotage without a target, an operation without its id: refused by the bridge');
  const dr = await b.call('claim_deposit', { deposit: 9 }); ok(dr.isError && /hasmine \(Já temos uma mina nessa jazida\)/.test(dr.json.result), 'a refusal carries the page\'s Portuguese reason (hasmine: ' + (dr.json && dr.json.result) + ')');
  const v2q = []; for (const [nm, a, q] of [['get_threats', {}, 'threats'], ['get_missions', {}, 'missions'], ['get_unit', { id: 42 }, 'unit'], ['get_lots', {}, 'lots'], ['get_mines', {}, 'mines']]) { await new Promise(r => setTimeout(r, 1100)); const r = await b.call(nm, a); v2q.push(!r.isError && seenAsk[seenAsk.length - 1].q.q === q && (q !== 'unit' || seenAsk[seenAsk.length - 1].q.id === 42) || nm); }
  ok(v2q.every(x => x === true), 'MCP v2: get_threats, get_missions, get_unit (with the squad id), get_lots, get_mines reach the host as gask threats, missions, unit, lots, mines (' + v2q.filter(x => x !== true).join(', ') + ')');
  /* parity with the page (W13): every command of its funnel goes through the bridge and the relay to the host, and every refusal code the page
     names comes back with the page's own Portuguese reason (the oracle: the page's gNo, GEN.no else ECO.tx.why) */
  const P = H.load({ eco: 1 }).$, ks = Object.keys(P('GC')), codes = [...new Set(Object.keys(P('GEN').no).concat(Object.keys(P('ECO').tx.why)))], pr = [];
  for (let i = 0; i < Math.max(ks.length, codes.length); i++) {
    const k = ks[i % ks.length], why = codes[i % codes.length], n0 = seenCmd.length; force.push(why);
    const r = await b.call('send_command', { d: 'cmd', command: { c: k } });
    if (seenCmd.length !== n0 + 1 || seenCmd[n0].c.c !== k) { force.length = 0; pr.push(k + ' not sent'); }
    else if (!(r.isError && r.json && r.json.result.startsWith('refused: ' + why + ' (' + P('gNo')(why) + ')'))) pr.push(why + ': ' + (r.json ? r.json.result : r.text));
  }
  ok(!pr.length, 'every command of the funnel (' + ks.length + ') reaches the host from the model, and every refusal (' + codes.length + ' codes) reads as on the page (' + pr.slice(0, 6).join('; ') + ')');
  const qk = ['spots', 'why', 'view', 'state', 'pool', 'amb', 'fire', 'report', 'plan', 'logi', 'rec', 'brg', 'threats', 'missions', 'unit', 'lots', 'mines'], qp = [];
  for (const q of qk) { await new Promise(r => setTimeout(r, 1100)); const n0 = seenAsk.length, r = await b.call('send_command', { question: { q } }); if (r.isError || seenAsk.length !== n0 + 1 || seenAsk[n0].q.q !== q) qp.push(q); }
  const qn = await b.call('send_command', { question: { q: 'nope' } });
  ok(!qp.length && qn.isError, 'every question the host answers (§10 and W13: ' + qk.length + ') goes through the bridge and the relay to it, an unknown one does not (' + qp.join(', ') + ')');
  const tl2 = (await b.rpc('tools/list')).result.tools.map(t => t.name), initV2 = await b.rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  ok(['get_threats', 'get_missions', 'get_unit', 'get_lots', 'get_mines', 'create_campaign', 'attach_operation', 'end_campaign', 'set_defence_policy', 'triage_threat', 'send_qrf', 'claim_deposit', 'lay_minefield', 'clear_mines', 'sabotage', 'arm_militia'].every(x => tl2.includes(x)) && initV2.result.serverInfo.version === '2.0.0', 'tools/list has the MCP v2 tools and the server says version 2.0.0');
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
  const WebSocket = N.WebSocket, wss = new WebSocket.Server({ host: '127.0.0.1', port: N.PORT + 1 });
  wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ t: 'welcome', id: 5, host: 0, players: [] }))));
  const o = bridge({ CEU_URL: 'ws://localhost:' + (N.PORT + 1) }); await o.rpc('initialize', { protocolVersion: '2025-11-25' });
  const og = await o.call('scout', { x: 1, z: 2 }); ok(og.isError && /not support/.test(og.text), 'a relay without the eco/gen welcome flag: a clear error');
  o.p.stdin.end(); wss.close();

  b.p.stdin.end(); h.close();
  await N.sleep(200);
  for (const k of kids) k.kill(); N.stop(); fs.rmSync(ANAD, { recursive: true, force: true }); done();
})().catch(e => { console.error(e); for (const k of kids) k.kill(); N.stop(); process.exit(1); });
