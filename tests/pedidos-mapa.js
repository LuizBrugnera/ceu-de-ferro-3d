'use strict';
/* requests to the general from the map (cf-pedidos-mapa): a player (here in a tank) asks his side's general, and the AI general answers by
   what it has and what the side knows: danger close and friends on the target refused, an air strike or armour only where an enemy was seen,
   smoke and artillery as fire missions with an ETA, an air strike from the reserve, help where he is (the friends near are called too), a
   request passed to a person who holds that part of the command, the general himself told to use his own view, the radio's limits (one request
   per PED.gap s, the same kind after PED.cd s, an air strike once per PED.side s for the side); online, a guest's gped decided by the host
   and answered to him alone (gpr), and the guest's side of it. Sandbox-free: a real ww2 conquest battle, 30 s in (~1 min) */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, mapv: 6 }), $ = C.$;
const S = C.newState('ww2', 'pz4', { cls: 'tank' }), P = S.my, PED = $('PED'), Net = $('Net');
C.run(30, null, 1 / 20);
const D = (k, x, z) => $('pedDecide')(P, k, x, z), later = s => { S.t += s; };
const log = () => (S.glog ? S.glog.l[0] : []).filter(e => e.k === 'help').map(e => e.s);
const foes = () => S.men.concat(S.units).filter(g => g.team !== P.team && !g.dead);
const hide = () => { for (const g of foes()) g.seenT = -1e9; };
const see = g => { g.seenT = S.t; g.sx = g.x; g.sz = g.z; };
const away = (x, z) => S.men.concat(S.units).every(g => g.dead || g.team !== P.team || Math.hypot(g.x - x, g.z - z) > 200);

let r = D('arty', P.x + 30, P.z);
ok(r.st === 'no' && /perigo próximo/.test(r.why), 'artillery 30 m from the player is refused: ' + r.why);
r = D('smk', P.x + 600, P.z);
ok(r.st === 'wait' && /aguarde \d+ s/.test(r.why), 'another request at once: the radio says wait (' + r.why + ')');
later(Math.max(PED.gap, PED.no) + .1);
const fm0 = S.cmd[0].fm.length; let sx = P.x + 600, sz = P.z;
for (let i = 0; i < 40 && !away(sx, sz); i++) sx += 50;
r = D('smk', sx, sz);
const M = S.cmd[0].fm[S.cmd[0].fm.length - 1];
ok(r.st === 'ok' && r.eta > 0 && S.cmd[0].fm.length === fm0 + 1 && M.k === 'smk' && Math.hypot(M.x - sx, M.z - sz) < 1, 'smoke: a fire mission of the side at the point, ETA ' + r.eta + ' s (' + r.why + ')');
ok(log().some(s => /^General atende .*cortina de fumaça.*~\d+ s/.test(s)), '  and the general\'s log says it');
later(Math.max(PED.gap, PED.no) + .1); r = D('smk', sx, sz);
ok(r.st === 'wait' && r.eta >= PED.cd.smk - Math.max(PED.gap, PED.no) - 1, 'the same kind again before PED.cd.smk s: wait ' + r.eta + ' s');

later(Math.max(PED.gap, PED.no) + .1); hide(); r = D('cas', S.W / 2, 0);
ok(r.st === 'no' && /às cegas/.test(r.why), 'an air strike where no enemy is known is refused: ' + r.why);
later(Math.max(PED.gap, PED.no) + .1); hide();
const tgt = S.units.find(u => u.team !== P.team && !u.dead && u.kind !== 'aa' && away(u.x, u.z) && Math.hypot(u.x - P.x, u.z - P.z) > 500);
see(tgt);
const was = new Set(S.planes); r = D('cas', tgt.x, tgt.z);
const np = S.planes.find(p => !was.has(p) && p.team === P.team && p.role === 'cas');
ok(r.st === 'ok' && r.eta > 0 && (np ? np.mis && Math.hypot(np.mis.area.x - tgt.x, np.mis.area.z - tgt.z) < 1 : /no ar/.test(r.why)), 'an air strike on a seen ' + tgt.kind + ': ' + (np ? 'a ' + np.def.name + ' leaves the base with the target as its mission area' : r.why) + ', ETA ' + r.eta + ' s');
later(Math.max(PED.gap, PED.no) + .1); see(tgt); r = D('cas', tgt.x, tgt.z);
ok(r.st === 'wait', 'another air strike for the side within PED.side.cas s: wait ' + r.eta + ' s');
const aa = S.units.find(u => u.team !== P.team && !u.dead && u.kind === 'aa');
if (aa) { later(PED.cd.cas + 1); hide(); see(aa); const c = S.units.find(u => u.team !== P.team && !u.dead && u !== aa && Math.hypot(u.x - aa.x, u.z - aa.z) < 1200) || aa; see(c); r = D('cas', c.x, c.z); ok(r.st === 'no' && /antiaérea/.test(r.why), 'an air strike next to a known enemy anti-aircraft is refused: ' + r.why); }

later(Math.max(PED.gap, PED.no) + .1);
const mate = S.units.find(u => u.team === P.team && !u.dead && u !== P && Math.hypot(u.x - P.x, u.z - P.z) > 400);
r = D('arty', mate.x + 10, mate.z);
ok(r.st === 'no' && /amigas/.test(r.why), 'artillery on friends is refused: ' + r.why);

later(Math.max(PED.gap, PED.no) + .1); hide(); r = D('arm', tgt.x, tgt.z);
ok(r.st === 'no' && /contato/.test(r.why), 'armour where no enemy is known is refused: ' + r.why);
later(Math.max(PED.gap, PED.no) + .1); see(tgt); r = D('arm', tgt.x - 300, tgt.z);
ok(r.st === 'ok' ? r.eta > 0 : /reserva|população|tíquetes/.test(r.why), 'armour near a seen enemy: ' + r.st + ' (' + r.why + ')');

later(Math.max(PED.gap, PED.no) + .1); hide();
const near = foes().find(g => Math.hypot(g.x - P.x, g.z - P.z) > 600) || tgt; near.x = P.x + 250; near.z = P.z; see(near);
const hl = S.help ? S.help.l.length : 0; r = D('help', 0, 0);
ok(r.x === P.x && r.z === P.z, 'help is asked where the player is, whatever the point');
ok(r.st === 'ok' && /chamados/.test(r.why) && S.help.l.length === hl + 1 && S.help.l[hl].by === P, 'help with an enemy 250 m off: the friends near are called and the general answers (' + r.why + ')');

later(Math.max(PED.gap, PED.no) + .1); C.genCtl(0, 77); r = D('inf', P.x + 700, P.z);
ok(r.st === 'fwd' && log().some(s => /^Pedido de .* ao general: reforço de infantaria/.test(s)), 'a person holds the attack: the request goes to his log (' + r.why + ')');
later(Math.max(PED.gap, PED.no) + .1); r = D('smk', sx + 300, sz);
ok(r.st === 'ok', '  the support he left to the AI is still the AI\'s to answer');
later(Math.max(PED.gap, PED.no) + .1); C.genCtl(0, 'me'); r = D('arm', tgt.x, tgt.z);
ok(r.st === 'no' && /você é o general/.test(r.why), 'the general himself is sent to his own view: ' + r.why);
C.genCtl(0, 'ai');

/* online: the host decides a guest's request and answers him alone; the guest marks the answer */
const sent = [], send0 = Net.send; Net.send = (t, m) => { sent.push(Object.assign({ t }, m)); };
S.net = true; S.host = true; Net.cmd = true;   // a host whose server knows the commander's fire (welcome cmd: 1)
const g = S.units.find(u => u.team === P.team && !u.dead && u !== P && u !== mate); g.pid = 5; Net.ghosts.set(5, g);
later(Math.max(PED.gap, PED.no) + .1); let fx = sx - 300, fz = sz;   // where the side's smoke reaches (the host's own was laid there) for (let i = 0; i < 40 && !away(fx, fz); i++) fx += 50;
$('Net').rx.gped({ from: 5, k: $('PEDK').indexOf('smk'), p: [Math.round(g.x), Math.round(g.z)], q: [Math.round(fx), Math.round(fz)] });
let a = sent.pop();
ok(a && a.t === 'gpr' && a.to === 5 && a.s === 0 && a.eta > 0 && a.q[0] === Math.round(fx), 'a guest\'s smoke: the host decides it and answers him (gpr s ' + (a && a.s) + ', ETA ' + (a && a.eta) + ' s, ' + (a && a.why) + ')');
$('Net').rx.gped({ from: 5, k: $('PEDK').indexOf('arty'), p: [0, 0], q: [Math.round(fx), Math.round(fz)] }); a = sent.pop();
ok(a && a.s === 3 && /aguarde/.test(a.why), '  his next one at once: wait (his own radio, not the host player\'s)');
later(PED.cd.smk); r = D('smk', sx + 600, sz); ok(r.st !== 'wait', '  while the host\'s player is not held by the guest\'s limit (' + r.st + ')');
/* a guest in the general's seat (cf-anfitriao-bug). The host stores any person there as 'me': the seat's player id (Net.gn) says who. The
   guest general's own request was sent to his own log ('fwd'), and the host player, asking while the guest held the seat, was told he is the general */
const gn0 = Net.gn, id0 = Net.id; Net.id = 1; Net.gn = [5, 0]; C.genCtl(0, 'me');
later(Math.max(PED.gap, PED.no, PED.cd.smk, PED.cd.arty) + .1);
$('Net').rx.gped({ from: 5, k: $('PEDK').indexOf('smk'), p: [Math.round(g.x), Math.round(g.z)], q: [Math.round(fx), Math.round(fz)] }); a = sent.pop();
ok(a && a.t === 'gpr' && a.to === 5 && a.s === 1 && /você é o general/.test(a.why), 'a guest who holds the general\'s seat is sent to his own view (' + (a && a.why) + ')');
r = D('smk', sx + 600, sz);
ok(!/você é o general/.test(r.why || ''), '  and the host\'s player, asking then, is answered (the guest general\'s or the AI\'s part), not told he is the general (' + r.st + ': ' + r.why + ')');
Net.gn = [1, 0]; later(Math.max(PED.gap, PED.no, PED.cd.smk) + .1); r = D('smk', sx + 600, sz);
ok(r.st === 'no' && /você é o general/.test(r.why), '  the host\'s player in the seat himself is sent to his view');
C.genCtl(0, 'ai'); Net.gn = gn0; Net.id = id0;
S.host = false; Net.ped = false; S.pedM = [];
r = $('pedAsk')('cas', tgt.x, tgt.z); ok(!r && /servidor/.test(S.banner.sub), 'a guest on an older server is told so');
Net.ped = true; r = $('pedAsk')('cas', tgt.x, tgt.z); a = sent.pop();
ok(a && a.t === 'gped' && a.k === $('PEDK').indexOf('cas') && a.q[0] === Math.round(tgt.x) && S.pedM[0].st === 'sent', 'a guest\'s own request goes to the host (gped) and is marked as asked');
$('Net').rx.gpr({ k: a.k, s: 1, why: 'antiaérea inimiga conhecida perto do alvo', eta: 0, q: a.q });
ok(S.pedM.length === 2 && S.pedM[1].st === 'no' && S.pedM[0].end <= S.t && /negado/.test(S.banner.text) && /antiaérea/.test(S.banner.sub), 'the answer replaces the mark, and the banner says why');
Net.send = send0; S.net = false; S.host = false;
ok(!H.nan(S), 'no NaN');
H.done();
