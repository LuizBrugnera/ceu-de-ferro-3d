'use strict';
/* The general's tools for everyone (W13, F6 of the General's design, §10): one funnel for the AI, a person on the general's view and a model
   over MCP. The commands that were missing (expand: claim a deposit; clear: sappers sweep for mines; sabot: a raid with sappers and their
   charges), the questions (missions, unit: the unit card, lots, mines; and threats, which a guest or the bridge could not ask), a campaign a
   person opens first and attaches to after, and the parity checks that keep the three in step: every command of the funnel answers the
   person and the model the same, with a reason the page names, and every question the relay passes on is one the host answers. Several matches of two minutes each: about five minutes */
const H = require('./harness'), ok = H.ok;
const at = (C, secs) => { const S = C.watch('ww2', { len: 0 }); C.run(secs, null, 1 / 30); return S; };

console.log('-- expand: claim a deposit, a mine on it and its guard --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 90), t = 1, cmd = (c, by) => $('genCmd')(t, c, by || 'me');
  $('genCtl')(t, 'me');
  const V = $('ecoView')(t), own = V.dep.find(d => d.own), rs = V.dep.filter(d => !d.own).map(d => [d, cmd({ c: 'expand', id: d.i, inf: 2, why: 'metal' })]), got = rs.find(([, r]) => r.ok);
  const site = got && S.eco.l.find(e => e.id === got[1].id);
  ok(got && site && site.k === 'mine' && site.dep === got[0].i && site.gd.inf === 2 && site.gd.aa === 0, 'expand: a mine on the deposit (' + (got && got[0].i) + ') with the guard asked (2 squads, no AA): the new site\'s id');
  ok(rs.filter(([, r]) => !r.ok).every(([, r]) => r.why && $('gNo')(r.why) !== r.why), 'the deposits it could not take: refused each with a reason the page names (' + rs.filter(([, r]) => !r.ok).map(([d, r]) => d.i + ' ' + r.why).join(', ') + ')');
  ok(cmd({ c: 'expand', id: own.i }).why === 'hasmine' && got && cmd({ c: 'expand', id: got[0].i }).why === 'hasmine', 'a deposit the side already mines (or has just claimed): refused hasmine');
  ok(cmd({ c: 'expand', id: 99 }).why === 'id' && cmd({ c: 'expand' }).why === 'id' && cmd({ c: 'expand', id: own.i, inf: 3 }).why === 'shape', 'no such deposit: id; a guard of 3: shape');
  const d = V.dep.find(d => !d.own && (!got || d.i !== got[0].i)), kn = S.eco.d[t].kn; kn[77777] = { k: 'mine', x: d.x, z: d.z, T: S.t, dead: false };
  ok(cmd({ c: 'expand', id: d.i }).why === 'foemine', 'an enemy mine known on it: refused foemine'); delete kn[77777];
  ok($('genCmd')(t, { c: 'expand', id: d.i }, 'mcp').why === 'ctl', 'the model without the seat: refused ctl, as anything else');
  const j = S.gj.filter(e => e.c.c === 'expand'); ok(j.length >= 5 && j.every(e => e.by === 'me' || e.by === 'mcp'), 'every expand is in the journal with who gave it');
}

console.log('-- clear and sabot: the sappers by order --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), t = 1, cmd = c => $('genCmd')(t, c, 'me');
  $('genCtl')(t, 'me');
  const q = S.squads.find(q => q.team === t && q.job === 'sap' && q.live > 0), L = q.men.find(m => !m.dead);
  const r = cmd({ c: 'clear', x: L.x + 200, z: L.z, why: 'abrir a estrada' });
  ok(r.ok && r.id === q.id && q.sapT && q.sapT.k === 'clear' && q.sapT.why === 'abrir a estrada', 'clear: the side\'s sapper squad takes a sweep of the place, with the general\'s words');
  ok(cmd({ c: 'clear', x: L.x, z: L.z }).why === 'sap', 'no other squad with sappers free: refused sap');
  ok(cmd({ c: 'clear', x: -10, z: 0 }).why === 'map', 'off the map: refused map');
  const card = $('genCard')(t, q.id); ok(card && card.decide.some(s => /Tarefa de sapador: abrir a estrada/.test(s)), 'the unit card says the sapper task');
  const C2 = H.load({ seed: 9, eco: 1, mapv: 4 }), $2 = C2.$, S2 = at(C2, 120); $2('genCtl')(t, 'me');
  const a = $2('mbRaidAssets')(t)[0], r0 = $2('genCmd')(t, { c: 'sabot', x: a.x, z: a.z }, 'me');
  ok(!r0.ok && r0.why === 'path', 'sabot where no safe way on foot reaches: refused with the raid\'s own reason (path)');
  $2('MANT').raid.thr = 99; $2('MBR').far = 1e6; $2('MBR').stage = -1e6;   // the walk allowed: the order's own part is what is tested
  const r2 = $2('genCmd')(t, { c: 'sabot', x: a.x, z: a.z, why: 'cargas' }, 'me'), op = r2.ok && S2.cmd[t].ops.find(o => o.id === r2.id);
  ok(op && op.k === 'raid' && op.sq.some(q => q.job === 'sap') && op.sq.some(q => q.job !== 'sap'), 'sabot: a raid on what stands there, its squads and a squad of sappers with them');
  ok((S2.glog.l[t] || []).some(e => /Sapadores seguem com a incursão/.test(e.s)), 'the log says the sappers go along');
  ok($2('genCmd')(t, { c: 'sabot', x: a.x, z: a.z }, 'me').why === 'sap', 'the sappers gone with it: a second sabotage is refused sap');
}

console.log('-- the questions: missions, unit (the card), lots, mines, threats --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 5 }), $ = C.$, S = at(C, 120), t = 0, A = q => $('genAnswer')(t, q);
  $('genCtl')(t, 'me');
  const M = A({ q: 'missions' }), live = S.squads.filter(q => q.team === t && q.live > 0 && !q.net);
  ok(M.ok && M.r.sq.length === Math.min(live.length, 40) && M.r.sq.every(o => live.some(q => q.id === o.id && q.mis && q.mis.kind === o.mk)) && M.r.veh.length + M.r.air.length > 0, 'missions: every squad by id with its mission kind, the vehicles and aircraft by kind');
  const q = live.find(q => !q.op && q.job !== 'sap') || live[0], P = q.men.find(m => !m.dead);
  const r = $('genCmd')(t, { c: 'mis', ids: [q.id], mk: 'recon', x: P.x + 120, z: P.z, r: 250, lat: 2, roe: 'return', brk: .3, why: 'ver a ponte' }, 'me');
  const U0 = A({ q: 'unit', id: q.id }).r;
  ok(!q.cnP || U0.decide.some(s => /^Missão nova a caminho pelo rádio: reconhecer/.test(s)), 'while the order is on its way by radio, the card says the new mission is coming');
  for (let i = 0; i < 90 * 30 && q.cnP; i++) C.step(1 / 30);   // the order and its mission arrive by radio (the command network)
  const U = A({ q: 'unit', id: q.id }), c = U.r;
  ok(r.ok && U.ok && c.id === q.id && c.mis.mk === 'recon' && c.mis.lat === 2 && c.mis.roe === 'return' && c.mis.why === 'ver a ponte', 'unit: the card of the squad, with the mission just given (' + (c && c.mis && c.mis.mk) + ')');
  ok(c.see.length >= 2 && c.decide.some(s => /^Missão: reconhecer .*ver a ponte/.test(s)) && c.decide.some(s => /Liberdade livre · só responder ao fogo · recua abaixo de 30%/.test(s)) && c.decide.some(s => /^Ordem: /.test(s)), 'the card in words: what it sees, and what it decides (mission, latitude, rules, break-off, order)');
  const snap = JSON.stringify([q.mis, q.belT && q.belT.n, q.mind && q.mind.k]); A({ q: 'unit', id: q.id }); A({ q: 'missions' });
  ok(JSON.stringify([q.mis, q.belT && q.belT.n, q.mind && q.mind.k]) === snap, 'asking changes nothing of the squad');
  ok(!A({ q: 'unit', id: 99999 }).ok && A({ q: 'unit', id: 99999 }).why === 'id' && !A({ q: 'unit' }).ok, 'unit of no such squad (or no id): refused id');
  const Lt = A({ q: 'lots' }), lots = S.T.lots.filter(l => l.team === t);
  ok(Lt.ok && lots.length > 0 && Lt.r.lots.length === lots.length && Lt.r.lots.some(l => !l.free) && Lt.r.lots.every(l => typeof l.free === 'boolean'), 'lots: the seat town\'s lots of the side (map version 5), free or built (' + Lt.r.lots.filter(l => l.free).length + ' of ' + lots.length + ' free)');
  const m = $('mineLay')(0, t, P.x + 40, P.z + 40), Mn = A({ q: 'mines' });
  ok(m && Mn.ok && Mn.r.own.length === Mn.r.n && Mn.r.n >= 1 && Mn.r.cap > 0 && Array.isArray(Mn.r.foe) && Array.isArray(Mn.r.sus), 'mines: the side\'s own (one just laid), the enemy mines it knows, its suspect fields, its limit');
  const big = $('genMissions')(t), e = big.sq[0], w = 'x'.repeat(120), fill = o => Array.from({ length: 40 }, () => Object.assign({}, o, { why: w }));
  $('genMissions = () => ({ ok: true, why: "", sq: BIG.sq, veh: BIG.veh, air: BIG.air })'); C.BIG = { sq: fill(e), veh: fill(Object.assign({ k: 'tank' }, e)), air: fill(Object.assign({ k: 'cas' }, e)) };
  const Mb = A({ q: 'missions' }), mb = JSON.stringify(Object.assign({ t: 'gres', to: 1, n: 1 }, Mb)).length;
  ok(Mb.ok && mb < 16384 && Mb.r.cut === 1 && Mb.r.sq.length === 40 && Mb.r.air.length < 40, 'missions of 40 squads, 40 vehicles and 40 aircraft with long words: cut to fit the relay\'s 16 KB gres (' + mb + ' bytes; the squads kept, ' + (Mb.r.veh.length + Mb.r.air.length) + ' vehicles and aircraft)');
  const Th = A({ q: 'threats' }); ok(Th.ok && Th.r.fronts > 0 && Array.isArray(Th.r.l) && Array.isArray(Th.r.camp) && typeof Th.r.pol === 'object', 'threats: answered to a guest and a bridge too (the host alone could ask it before)');
}

console.log('-- a campaign a person opens, then attaches to --');
{
  const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 120), t = 1, Cm = S.cmd[t], cmd = c => $('genCmd')(t, c, 'me');
  $('genCtl')(t, 'me');
  const K = cmd({ c: 'camp', H: 60, why: 'teste' }); C.run(20, null, 1 / 30);
  const k = (Cm.camp || []).find(k => k.id === K.id);
  ok(K.ok && k && !k.over, 'an empty campaign a person opened lives on, waiting for its operations (20 s later)');
  const op = Cm.ops.find(o => !o.over && (o.k === 'atk' || o.k === 'raid' || o.k === 'fnt' || o.man)) || null;
  if (op) { const a = cmd({ c: 'camp', id: K.id, op: op.id }); ok(a.ok || a.why === 'kind' || a.why === 'busy', 'an operation attaches to it (' + (a.ok ? 'ok' : a.why) + ')'); }
  const K2 = cmd({ c: 'camp', H: 20 }); C.run(26, null, 1 / 30);
  ok(K2.ok && !(Cm.camp || []).some(k => k.id === K2.id) && (S.glog.l[t] || []).some(e => /Campanha encerrada \(nenhuma operação anexada\)/.test(e.s)), 'one still empty at its H-hour ends, and the log says why');
  const C3 = H.load({ seed: 9, eco: 1, mapv: 4 }), $3 = C3.$, S3 = at(C3, 120), C3m = S3.cmd[0]; const K3 = $3('genCmd')(0, { c: 'camp', H: 120 }, 'ai'); C3.run(5, null, 1 / 30);
  ok(K3.ok && !(C3m.camp || []).some(k => k.id === K3.id && !k.over), 'the AI\'s own empty campaign still ends at once (it attaches as it opens)');
}

console.log('-- parity: every command and question, for the person and the model --');
{
  /* the same match twice, the seat held by the person in one and by the model in the other: every command of the funnel, bare and then
     aimed at the map's centre, gets the same answer for both (one funnel, the same refusals), none crashes or is unknown, and the journal
     says who gave each */
  const t = 1, run = seat => { const C = H.load({ seed: 9, eco: 1, mapv: 4 }), $ = C.$, S = at(C, 30); $('genCtl')(t, seat); const ks = Object.keys($('GC')), M = S.W / 2;
    return { $, S, ks, r: ks.flatMap(k => [{ c: k }, { c: k, x: M, z: 0, id: 1, ids: [1] }].map(c => { const r = $('genCmd')(t, c, seat), j = S.gj[S.gj.length - 1]; return [k, !!r.ok, r.why || '', !!j && j.by === seat && j.c.c === k]; })) }; };
  const P = run('me'), Mo = run('mcp'), diff = P.r.filter((x, i) => JSON.stringify(x) !== JSON.stringify(Mo.r[i]));
  ok(P.ks.length > 40 && !diff.length, 'every command of the funnel (' + P.ks.length + ') answers the person and the model the same' + (diff.length ? '; differ: ' + diff.map(x => x[0]).join(', ') : ''));
  const odd = P.r.filter(([, , w]) => w === 'bug' || w === 'ctl');
  ok(!odd.length && P.$('genCmd')(t, { c: 'nope' }, 'me').why === 'kind', 'none crashes or is refused for who gave it, and a name outside the funnel is refused kind (' + (odd.length ? odd.map(x => x[0] + ' ' + x[2]).join(', ') : 'all reach their command') + ')');
  ok(P.r.every(x => x[3]) && Mo.r.every(x => x[3]), 'the journal holds each command as it is given, with who gave it (me, mcp)');
  const no = P.r.filter(([, o, w]) => !o && P.$('gNo')(w) === w);
  ok(!no.length, 'every refusal has a reason the page names in Portuguese (' + (no.length ? 'unnamed: ' + no.map(x => x[0] + ' ' + x[2]).join(', ') : 'all') + ')');
  /* the questions the relay passes on (§10: spots, why, view, state, pool, amb, fire, report, plan, logi, rec, brg, and W13's threats, missions, unit, lots, mines; tests/mcp-general.js sends each through the relay) */
  const Q = { spots: { k: 'pow' }, why: { k: 'pow', x: 3000, z: 0 }, pool: { x: 6000, z: 0 }, amb: { x: 6000, z: 0 }, fire: { k: 'he', x: 6000, z: 0 } }, S = P.S, $ = P.$;
  const q0 = S.squads.find(q => q.team === t && q.live > 0 && !q.net); Q.unit = { id: q0.id };
  const kinds = ['spots', 'why', 'view', 'state', 'pool', 'amb', 'fire', 'report', 'plan', 'logi', 'rec', 'brg', 'threats', 'missions', 'unit', 'lots', 'mines'];
  const shape = kinds.filter(q => { const a = $('genAnswer')(t, Object.assign({ q }, Q[q] || {})); return !a || a.why === 'shape'; });
  ok(!shape.length && $('genAnswer')(t, { q: 'nope' }).why === 'shape', 'the host answers every question the relay passes on, and refuses one it does not (' + (shape.length ? 'refused shape: ' + shape.join(', ') : kinds.length) + ')');
}
H.done();
