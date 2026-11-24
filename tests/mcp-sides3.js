'use strict';
/* the MCP bridge of the Insurgents (CEU_SIDE=2) in a room of three sides (cf-3l-p5-servidor): the relay (SERVER, PORT_T, GENKEY set), a real host
   page of the USA headless in this process (map 9, Net.ns0 3 as the hangar's "Três"), the bridge as a child process over stdio. initialize names
   the faction and both enemies; get_state says link.faction Insurgents, sides 3, enemies USA and Russia, map.pointsHeld by faction, and points and
   bases held by an enemy by its faction's name; seat claims side 2's chair on the host. About a minute */
const path = require('path'), { spawn } = require('child_process');
process.env.SERVER = process.env.SERVER || path.join(__dirname, '..', 'server.js'); process.env.GENKEY = 'secret';
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const MCP = path.join(__dirname, '..', 'mcp-general.js'), dt = 1 / 30, J = v => JSON.stringify(v);
let host = null, pumping = true;
(async () => {
  await N.start();
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: 4242, eco: true, mapv: 9 }), $ = c.$, Net = $('Net'); Net.ns0 = 3;
  await new Promise((res, rej) => { Net.ui.welcome = () => { c.newState('modern', 'abrams', { net: true, cls: 'tank', mouse: true, host: Net.host === Net.id }); res(); }; Net.ui.refused = code => rej(new Error('host refused: ' + code)); Net.connect('modern', 'Host', 'tank', 'abrams'); });
  Object.defineProperty(c, 'S', { get: () => $('S') }); host = c; c.director = () => {};
  ok(c.S.N === 3 && Net.ns === 3, 'the host plays a room of three sides (S.N ' + c.S.N + ')');
  (async () => { while (pumping) { for (let i = 0; i < 2; i++) { c.step(dt); Net.tick(dt); } await N.sleep(2); } })();
  const p = spawn(process.execPath, [MCP], { env: Object.assign({}, process.env, { CEU_URL: 'ws://localhost:' + N.PORT, CEU_ROOM: 'modern', CEU_SIDE: '2', CEU_KEY: 'secret', CEU_NAME: 'Claude-ins' }), stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '', n = 0; const waits = new Map();
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); let m; try { m = JSON.parse(l); } catch (e) { continue; } const w = waits.get(m.id); if (w) { waits.delete(m.id); w(m); } } });
  const rpc = (method, params, ms) => new Promise(res => { const id = ++n; waits.set(id, res); p.stdin.write(J({ jsonrpc: '2.0', id, method, params }) + '\n'); setTimeout(() => { if (waits.delete(id)) res(null); }, ms || 20000); });
  const call = async (name, args) => { const r = await rpc('tools/call', { name, arguments: args || {} }); try { return JSON.parse(r.result.content[0].text); } catch (e) { return { raw: r && J(r).slice(0, 300) }; } };
  const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'sides3', version: '1' } });
  p.stdin.write(J({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await N.sleep(1500);
  let st = await call('get_state', { refresh_map: true }); for (let k = 0; k < 4 && !st.map; k++) { await N.sleep(1200); st = await call('get_state', { refresh_map: true }); }
  const L = st.link || {}, M = st.map || {};
  console.log('   link ' + J(L).slice(0, 300) + '\n   points held ' + J(M.pointsHeld));
  ok(L.connected && L.side === 2 && L.faction === 'Insurgents' && L.sides === 3, 'get_state: connected as side 2, the Insurgents, of three sides');
  ok(J([...(L.enemies || [])].sort()) === J(['Russia', 'USA']), 'its enemies are the USA and Russia (' + L.enemies + ')');
  ok(M.pointsHeld && Number.isFinite(M.pointsHeld.USA) && Number.isFinite(M.pointsHeld.Russia) && Number.isFinite(M.pointsHeld['ours (Insurgents)']) && M.tickets === undefined, 'map.pointsHeld: a map by faction, ours named so, no tickets (' + J(M.pointsHeld) + ')');
  const ins = init && init.result && (init.result.instructions || '');
  ok(/Insurgents/.test(ins) && /USA/.test(ins) && /Russia/.test(ins), 'initialize: the instructions name the faction and the two enemies');
  const pts = M.points || [], held = pts.map(q => q.holder).filter(Boolean);
  ok(held.some(h => h === 'USA' || h === 'Russia') && held.includes('ours') && !held.includes('enemy'), 'points held by an enemy name its faction, ours say ours (' + [...new Set(held)].join(', ') + ')');
  const seat = await call('seat', { action: 'claim' }); await N.sleep(800);
  ok(seat.heldByMe && c.S.gctl && c.S.gctl[2].seat === 'mcp', 'seat claim: the host gives side 2\'s chair to the bridge (' + (c.S.gctl && c.S.gctl[2].seat) + ')');
  pumping = false; p.stdin.end(); try { p.kill(); } catch (e) { /* gone */ } Net.close(); N.stop(); done();
})().catch(e => { console.log('  FAIL ' + (e.stack || e)); pumping = false; N.stop(); process.exitCode = 1; });
