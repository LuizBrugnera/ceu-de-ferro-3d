'use strict';
/* calls for support that reach the AI general reallocate before they produce (cf-general-chamados): a player's request from the map for infantry
   is answered by a free squad near, not by a new one out of the reserve; not by one in its own fight, nor when the nearest would come too late,
   nor when it is too far (then production as before); the squad holds at the call and then goes back to its old order; a unit's call nobody
   near took (up) is answered by the general with a squad from farther; S.chm and the analytics (sn.chm, the review's calls) count it all. A real ww2 conquest battle, 30 s in (~1 min) */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 5, eco: 1, mapv: 6, ana: true }), $ = C.$;
const S = C.newState('ww2', 'pz4', { cls: 'tank' }), P = S.my, PED = $('PED'), CN = $('CN');
const CHM = $("typeof CHM === 'undefined' ? null : CHM") || { jobs: ['held', 'road', 'wood', 'line', 'rec'], eta: 420, hold: 90, r: { squad: 3000 }, up: { again: 15 } };   // PAGE=<the page before>: the first case fails there, as it should
CN.on = 0;   // the radio net delays orders: here the order a squad ends up with is read at once
C.run(30, null, 1 / 20);
const D = (k, x, z) => $('pedDecide')(P, k, x, z), later = s => { S.t += s; };
const st = () => (S.chm && S.chm[0]) || {};
const log = () => (S.glog ? S.glog.l[0] : []).filter(e => e.k === 'help').map(e => e.s);
const free = () => S.squads.filter(q => q.team === 0 && !q.net && q.live >= 3 && !q.op && CHM.jobs.includes(q.job) && q.ord && !q.ord.T && !q.ord.tw && !q.help);
const lead = q => q.men.find(m => !m.dead);
const hide = () => { for (const g of S.men.concat(S.units)) if (g.team !== 0) g.seenT = -1e9; S.cmd[0].known.length = 0; };

hide(); later(PED.gap + .1);
let qs = free();
ok(qs.length > 0, 'the side has free squads to take (' + qs.length + ': ' + qs.map(q => q.job).join(', ') + ')');
const q = qs[0], L = lead(q), O0 = q.ord, n0 = S.squads.length;
const x = L.x + 200, z = L.z;
let r = D('inf', x, z);
/* the case the request was about: a player asks for infantry on the map with free troops of his side a few hundred metres off; the general used to
   answer "nada na reserva do general: ele precisa produzir antes" (or send a new squad from the base) */
ok(r.st === 'ok' && /estava perto/.test(r.why) && r.eta > 0, 'infantry asked 200 m from a free squad: it goes, ETA ' + r.eta + ' s (' + r.why + ')');
if (!$("typeof CHM !== 'undefined'")) { H.done(); process.exit(); }   // the page before: nothing more to check
ok(q.ord.chm && Math.hypot(q.ord.x - x, q.ord.z - z) < 1 && S.squads.length === n0, '  that squad holds at the call, and no new squad entered');
ok(st().re === 1 && st().n === 1 && st().mk === 0, '  counted as a reallocation: ' + JSON.stringify(st()));
ok(log().some(s => /^O general manda .* sem produzir/.test(s)), '  and the general\'s log says it');

/* it gets there, the place is quiet: after CHM.hold s it goes back to its old order */
q.at = true; C.$('chmTick')(); later(CHM.hold + 1); C.$('chmTick')();
ok(q.ord === O0 && st().arr === 1, 'there and quiet for CHM.hold s: back to its old order (' + O0.k + '), counted as arrived');

/* not one in its own fight: an enemy the side knows near every free squad */
later(PED.cd.inf + 1); hide();
const C0 = S.cmd[0];
qs = free(); for (const o of qs) { const l = lead(o); C0.known.push({ x: l.x + 50, z: l.z, dead: false, man: 1, sx: l.x + 50, sz: l.z }); }
const re0 = st().re; r = D('inf', x, z);
ok(st().re === re0 && !/estava perto/.test(r.why), 'every free squad with a known enemy within CHM.quiet m: none is taken, the old way answers (' + r.st + ': ' + r.why + ')');
ok(st().mk + st().no + st().rs === st().n - st().re - (st().lc || 0), '  and counted as production or refusal: ' + JSON.stringify(st()));
C0.known.length = 0;

/* too late: the nearest would come after CHM.eta s */
later(PED.cd.inf + 1); hide(); const eta0 = CHM.eta; CHM.eta = 5;
r = D('inf', x, z);
ok(!/estava perto/.test(r.why), 'with CHM.eta 5 s no squad arrives in time: not reallocated (' + r.st + ': ' + r.why + ')');
CHM.eta = eta0;

/* too far: none within CHM.r.squad */
later(PED.cd.inf + 1); hide(); const rs0 = CHM.r.squad; CHM.r.squad = 10;
r = D('inf', x, z);
ok(!/estava perto/.test(r.why), 'with CHM.r.squad 10 m no squad is near: not reallocated (' + r.st + ': ' + r.why + ')');
CHM.r.squad = rs0;

/* a unit's call nobody near took goes up; the AI general sends a squad from farther */
const NEEDS = $('NEEDS'), r0 = NEEDS.clear.r; NEEDS.clear.r = 1;
const q2 = free()[0], by = S.squads.find(o => o.team === 0 && o !== q2 && o.live > 0 && !o.net), B = lead(q2), at = { x: B.x + 400, z: B.z };   // the call 400 m from another free squad
const R = $('helpAsk')(by, 'clear', at, { x: at.x + 80, z: at.z });
NEEDS.clear.r = r0;
ok(R && R.st === 'up' && !R.resp, 'a call for clearing nobody near can take goes up to the command');
later(1); C.$('chmUp')();
ok(R.resp === q2 && R.gen && R.T > S.t + 60 && R.resp.help === R && st().up === 1 && st().upRe === 1, 'the AI general sends ' + (R.resp ? $('helpWho')(R.resp) : 'nobody') + ' to it: ' + JSON.stringify(st()));
ok(log().some(s => /^O general manda .* atender .*limpar/.test(s)), '  and the general\'s log says it');
const resp = R.resp; $('helpEnd')(R, 'done');
ok(!resp.help && resp.ord !== R.ord, '  the call done, the squad is let go to its own order');

/* a person holding the defence: the up calls are his */
C.genCtl(0, 77); S.gctl[0].def = 77;   // the assistant gives the defence back to him
NEEDS.clear.r = 1; later(30); const by2 = S.squads.find(o => o.team === 0 && o !== by && o !== q2 && o.live > 0 && !o.net) || by, R2 = $('helpAsk')(by2, 'clear', at, null); NEEDS.clear.r = r0;
later(CHM.up.again + 1); C.$('chmUp')();
ok(!R2 || !R2.resp, 'with a person holding the defence the general does not send anyone by itself');
C.genCtl(0, 'ai');

/* the analytics: each snapshot carries the counts, and the review has them by side */
$('anaSnap')(); const ev = $('ANA').ev.slice(), sn = ev.filter(e => e.k === 'sn').pop(), rv = $('anaReport')(ev, -1);
ok(sn && Array.isArray(sn.chm) && sn.chm[0][0] === st().n && sn.chm[0][1] === st().re, 'the analytics snapshot carries the counts: ' + JSON.stringify(sn && sn.chm));
ok(rv.calls && rv.calls[0] && rv.calls[0].re === st().re && rv.calls[0].upRe === st().upRe, 'and the review has them by side (calls): ' + JSON.stringify(rv.calls && rv.calls[0]));

let nan = false; for (const k in st()) if (!Number.isFinite(st()[k])) nan = true;
ok(!nan, 'no NaN in the counts');
H.done();
