#!/usr/bin/env node
'use strict';
/* tools/balance.js: the balance numbers of many matches, and AI × AI tournaments to make them.

   Aggregate (default): reads every match the game's server keeps (data/matches, or the folders given; ANA_DIR as for the server), played or from
   a tournament, builds each one's after-action review with the page's own anaReport, and prints what balancing needs: wins by side (a side
   over ALERT.share of ALERT.n or more decided matches is an alert; with 3 sides ALERT.share3, and the placing 1st/2nd/3rd of each side), by doctrine, how matches end and how long they last, where the tickets
   went (losses, bleed, points, the rest), cost-effectiveness and life by kind, and the general's manoeuvre (the review's mano, M0): how its
   assaults arrive (the flank rate: samples 70° or more off the axis; off the axis route), assaults with a manoeuvre, ambushes armed, fired
   and good, the traffic off the axes and off the roads, vehicles on the rail, "no strength to attack", the entropy of the arrivals and
   repeated approaches, and the general's own cost per frame (from tournament matches played without --nobudget: the frame meter's AIB.stat()
   every 5 s of match time, kept in the header's tour.aib; wall-clock time on the machine that ran the match, so a loaded machine reads higher),
   each beside the proposal's target (MANO.goal). --ref <json> adds a column with the same numbers from an earlier
   --json (tools/ref/manobra-base.json is today's general, the reference every manoeuvre package compares against).
     node tools/balance.js [folder...] [--era ww2|modern] [--json file] [--ref file]

   Tournament: plays N headless AI × AI conquest matches on the real simulation (tests/harness.js), in --jobs processes, each pairing of the
   doctrines on both sides in turn (one doctrine: mirror matches; --lados 3: each trio, every doctrine once on each side in turn, or with two
   doctrines every mix but the mirror), seeds seed, seed + 1..., saves each match as the server does
   (<folder>/<era>/<date>-<id>.ndjson.gz and its summary) and then aggregates the tournament's matches.
     node tools/balance.js --torneio N [--era ww2|modern|all] [--docs cautious,balanced,aggressive] [--min minutes] [--len 0|1|2]
       [--eco] [--lg] [--rec] [--nobudget] [--mapv V] [--seed S] [--jobs J] [--save folder] [--json file] [--ref file]
       [--pers ret,blz,gue,art,log] [--dif normal | facil,dificil] [--lados 2|3]
   --pers pairs the AI general's personalities (W17) instead of the doctrines; --dif the difficulty of every side, or of side 0, 1 (and 2).
   --lados 3 plays the current front with three sides (USA × Russia × Insurgents; modern only: the 1944 front always has two).
   --lg and --rec turn the physical logistics and the recovery on (with --eco and --mapv 6, the game as it is played); --nobudget stops the AI
   frame meter (AIB) from cutting the population cap by how busy this machine is, so the same seed plays the same match anywhere; without it each
   match keeps the general's cost per frame (tour.aib), so measure the cost in a separate short run without --nobudget.
   A Curta match (30 min) takes some 6 minutes of one core; --min shortens the clock for a quick look.

   The brain (CEREBRO, P6 of cf-cerebro-pesquisa): every review with the meters (the cb events) adds a section Cérebro, the measures of section 4
   beside their targets (the page's own medSum and medRows), with --ref the same from an earlier --json (tools/ref/cerebro-base.json is the
   baseline with the new brain off). --brain 0|1 plays the tournament with BRAIN.on set so; --brain ab plays it twice on the same seeds and
   doctrines, off and on, and prints the A×B: the result (wins, draws, length, tickets) and the measures side by side, and how many pairs
   played the very same match (no code reads BRAIN yet: all of them). Use --nobudget with it, so the population cap does not depend on how
   busy the machine is and the two halves differ only by the brain.
     node tools/balance.js --torneio N --brain ab [--min minutes] [--nobudget] [--json file] ...

   --set NAME.key=value (any number of them) sets a switch of the page in every match of the tournament before it is played (a number, or
   a string), kept in the header's tour.set: the A×B of a package with its own switch is two tournaments on the same seeds, one with each
   value, each with --json, and the second with --ref the first's (cf-g2-g7-urbano: --set URB.on=0 and --set URB.on=1).
   The town (URBANO, G7 of cf-ia-opensource): every review with the meters of CEREBRO: urbano-medicao (the cb events st urb) adds a section
   Urbano, the measures beside their targets (the page's own urbSum and urbRows), with --ref the same from an earlier --json. */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto'), { fork } = require('child_process'), os = require('os');
const H = require(path.join(__dirname, '..', 'tests', 'harness.js'));
const ROOT = path.join(__dirname, '..'), DIR = process.env.ANA_DIR ? path.resolve(process.env.ANA_DIR) : path.join(ROOT, 'data', 'matches');
const ALERT = { n: 40, share: .6, share3: .45 }, ERAS = ['ww2', 'modern'], DOCS = ['cautious', 'balanced', 'aggressive'];

function args(a) {
  const o = { dirs: [] };
  for (let i = 0; i < a.length; i++) {
    const k = a[i], v = () => a[++i];
    if (k === '--torneio' || k === '--tourney') o.n = +v();
    else if (k === '--era') o.era = v();
    else if (k === '--docs') o.docs = v().split(',').filter(Boolean);
    else if (k === '--pers') o.pers = v().split(',').filter(Boolean);
    else if (k === '--dif') o.difL = v().split(',').filter(Boolean);
    else if (k === '--lados' || k === '--sides') o.sides = +v();
    else if (k === '--min') o.min = +v();
    else if (k === '--len') o.len = +v();
    else if (k === '--eco') o.eco = true;
    else if (k === '--lg') o.lg = true;
    else if (k === '--rec') o.rec = true;
    else if (k === '--nobudget') o.nobudget = true;
    else if (k === '--ref') o.ref = path.resolve(v());
    else if (k === '--brain' || k === '--cerebro') o.brain = String(v());
    else if (k === '--mapv') o.mapv = +v();
    else if (k === '--seed') o.seed = +v();
    else if (k === '--jobs') o.jobs = +v();
    else if (k === '--save') o.save = path.resolve(v());
    else if (k === '--json') o.json = path.resolve(v());
    else if (k === '--set') { const [a, b] = String(v()).split('='); if (!/^[A-Za-z_$][\w$]*(\.[\w$]+)+$/.test(a || '') || b === undefined) throw new Error('--set NOME.campo=valor'); (o.set || (o.set = {}))[a] = b !== '' && Number.isFinite(+b) ? +b : b; }
    else if (k === '--one') o.one = JSON.parse(v());
    else if (k === '-h' || k === '--help') o.help = true;
    else o.dirs.push(path.resolve(k));
  }
  if (!(o.sides === 2 || o.sides === 3)) o.sides = 2;
  if (o.brain !== undefined && !['0', '1', 'ab'].includes(o.brain)) throw new Error('--brain 0, 1 ou ab');
  if (o.difL) { const d = o.difL; o.dif = Array.from({ length: o.sides }, (_, i) => d[i] || d[d.length - 1] || 'normal'); delete o.difL; }
  return o;
}
/* where a stored match came from (online, tourney, local), from its summary */
const srcOf = f => { try { return JSON.parse(fs.readFileSync(f.replace(/\.ndjson\.gz$/, '.json'), 'utf8')).src; } catch (e) { return null; } };
/* one stored match: its events, from a file of gzip members */
const readMatch = f => zlib.gunzipSync(fs.readFileSync(f)).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
function files(dirs, era) {
  const out = [];
  for (const d of dirs) for (const e of ERAS) {
    if (era && era !== 'all' && era !== e) continue;
    let l = []; try { l = fs.readdirSync(path.join(d, e)); } catch (er) { continue; }
    for (const n of l) if (n.endsWith('.ndjson.gz')) out.push(path.join(d, e, n));
  }
  return out.sort();
}
/* save the events of a match as the server keeps them */
function save(dir, era, ev, src) {
  const base = new Date().toISOString().slice(0, 10) + '-' + crypto.randomBytes(6).toString('hex');
  fs.mkdirSync(path.join(dir, era), { recursive: true });
  fs.writeFileSync(path.join(dir, era, base + '.ndjson.gz'), zlib.gzipSync(ev.map(e => JSON.stringify(e)).join('\n') + '\n'));
  const end = ev.filter(e => e.k === 'end').pop() || null, rep = ev.filter(e => e.k === 'rep').pop() || null;
  if (end) fs.writeFileSync(path.join(dir, era, base + '.json'), JSON.stringify({ id: base, era, src, hdr: ev.find(e => e.k === 'hdr') || null, end, rep }));
  return path.join(dir, era, base + '.ndjson.gz');
}
/* one tournament match, in this process */
function playOne(m) {
  const C = H.load({ seed: m.seed, eco: !!m.eco, lg: !!m.lg, rec: !!m.rec, mapv: m.mapv || 4, ana: true });
  if (m.nobudget) C.$('AIB').now = () => 0;
  if (m.brain === 0 || m.brain === 1) C.$('BRAIN').on = m.brain;
  if (m.set) for (const [k, v] of Object.entries(m.set)) C.$(k + ' = ' + JSON.stringify(v));   // --set: a page's switch, before the match
  const S = C.watch(m.era, { doc: m.doc, per: m.per, dif: m.dif, len: m.len || 0, min: m.min, n: m.n > 2 ? m.n : undefined });
  if (m.n > 2 && S.N !== m.n) throw new Error('a página não montou ' + m.n + ' lados (S.N = ' + S.N + '): falta a fundação de N lados ou a era não aceita');
  const lim = S.cq.T0 + 120, t0 = Date.now(), AIB = C.$('AIB'), K = { n: 0, gen: 0, genWorst: 0, avg: 0, worst: 0 };
  let next = 5;
  C.run(lim, () => {   // the frame meter's last 300 frames, every 5 s of match time (not with --nobudget: its clock reads 0)
    if (!m.nobudget && S.t >= next) { next = S.t + 5; const a = AIB.stat(); if (a.n) { K.n++; K.gen += a.gen; K.avg += a.avg; K.genWorst = Math.max(K.genWorst, a.genWorst); K.worst = Math.max(K.worst, a.worst); } }
    return !S.over;
  });
  const ANA = C.$('ANA'), ev = ANA.ev.slice(), h = ev.find(e => e.k === 'hdr'), r2 = v => Math.round(v * 100) / 100;
  if (h) h.tour = Object.assign({ id: m.tour, seed: m.seed, min: m.min || null, n: m.n || 2 }, m.nobudget && { nobudget: 1 }, (m.brain === 0 || m.brain === 1) && { brain: m.brain }, m.set && { set: m.set },
    K.n && { aib: { gen: r2(K.gen / K.n), genWorst: r2(K.genWorst), avg: r2(K.avg / K.n), worst: r2(K.worst), n: K.n } });
  return { file: save(m.save, m.era, ev, 'tourney'), over: S.over, t: Math.round(S.t), wall: Math.round((Date.now() - t0) / 1000) };
}
/* the doctrines (or personalities) of each match: pairs with 2 sides; with 3, the trios (three or more: each with no repeat, so every doctrine
   plays every side; two: every mix but the mirrors; one: the mirror) */
function tuples(docs, n) {
  const out = [];
  if (docs.length === 1) return [Array(n).fill(docs[0])];
  if (n === 2) { for (const a of docs) for (const b of docs) if (a !== b) out.push([a, b]); return out; }
  for (const a of docs) for (const b of docs) for (const c of docs) {
    if (docs.length >= 3 ? a === b || b === c || a === c : a === b && b === c) continue;
    out.push([a, b, c]);
  }
  return out;
}
function plan(o) {
  const n = o.sides === 3 ? 3 : 2, docs = o.pers && o.pers.length ? o.pers : o.docs && o.docs.length ? o.docs : DOCS;
  const eras = n === 3 ? ['modern'] : !o.era || o.era === 'all' ? ERAS : [o.era], pairs = tuples(docs, n);
  if (n === 3 && o.era && o.era !== 'modern' && o.era !== 'all') throw new Error('--lados 3 só na Frente atual (--era modern)');
  const tour = crypto.randomBytes(4).toString('hex'), out = [];
  for (let i = 0; i < o.n; i++) out.push({ tour, n, era: eras[Math.floor(i / pairs.length) % eras.length], doc: o.pers ? null : pairs[i % pairs.length], per: o.pers ? pairs[i % pairs.length] : null, dif: o.dif || null, seed: (o.seed || 1) + i, min: o.min, len: o.len || 0, eco: o.eco, lg: o.lg, rec: o.rec, nobudget: o.nobudget, mapv: o.mapv, save: o.save || DIR, set: o.set || null });
  if (o.brain === '0' || o.brain === '1') for (const m of out) m.brain = +o.brain;
  if (o.brain === 'ab') return [...out.map(m => Object.assign({}, m, { brain: 0 })), ...out.map(m => Object.assign({}, m, { brain: 1 }))];   // the same matches, off then on
  return out;
}
async function tourney(o) {
  const P = plan(o), jobs = Math.max(1, Math.min(P.length, o.jobs || Math.max(1, Math.min(4, os.cpus().length - 1)))), made = [];
  console.log('Torneio ' + P[0].tour + ': ' + P.length + ' partidas, ' + jobs + ' de cada vez, salvas em ' + (o.save || DIR));
  let next = 0;
  const run = () => new Promise(res => {
    const go = () => {
      if (next >= P.length) return res();
      const m = P[next++], k = fork(__filename, ['--one', JSON.stringify(m)], { stdio: ['ignore', 'pipe', 'inherit', 'ipc'] });
      k.on('message', r => { made.push(r.file); console.log('  ' + String(made.length).padStart(3) + '/' + P.length + '  ' + m.era + ' ' + (m.per || m.doc).join(' × ') + (m.dif ? ' (' + m.dif.join(' × ') + ')' : '') + (m.brain === 0 || m.brain === 1 ? ' cérebro ' + m.brain : '') + (m.set ? ' ' + Object.entries(m.set).map(([k, v]) => k + '=' + v).join(' ') : '') + ' seed ' + m.seed + (r.over ? '' : ' (sem fim)') + ', ' + Math.round(r.t / 60) + ' min de partida em ' + r.wall + ' s'); });
      k.on('exit', go);
    };
    go();
  });
  await Promise.all(Array.from({ length: jobs }, run));
  return made;
}
/* the numbers of many reviews */
/* the sides of a review (n, 2 for an older one) */
const sidesOf = r => Array.from({ length: r.ns > 2 ? r.ns : 2 }, (_, i) => i);
function aggregate(reps) {
  const n = reps.length, done = reps.filter(r => r.over), dec = done.filter(r => r.win >= 0), N = Math.max(2, ...reps.map(r => (r.ns > 2 ? r.ns : 2)));
  const w = Array.from({ length: N }, (_, s) => dec.filter(r => r.win === s).length);
  /* the placing: place[s][k] the matches side s ended (k + 1)th, among the finished ones with that many sides; mean its mean place */
  const place = Array.from({ length: N }, () => Array(N).fill(0)), pn = Array(N).fill(0);
  for (const r of done) if (Array.isArray(r.place)) r.place.forEach((s, k) => { if (place[s]) { place[s][k]++; pn[s]++; } });
  const meanPlace = place.map((p, s) => (pn[s] ? p.reduce((a, c, k) => a + c * (k + 1), 0) / pn[s] : null));
  const why = {}, docs = {}, pers = {}, kinds = {}, tk = { loss: 0, bleed: 0, pt: 0, civ: 0, other: 0 }, cv = { n: 0, dead: 0, evac: 0, turned: 0, roe: 0 }, durs = done.map(r => r.dur / 60).sort((a, b) => a - b);
  for (const r of done) why[r.whyTxt || r.why] = (why[r.whyTxt || r.why] || 0) + 1;
  const pl = (r, s) => (Array.isArray(r.place) && r.place.indexOf(s) >= 0 ? r.place.indexOf(s) + 1 : 0);
  for (const r of done) for (const s of sidesOf(r)) {
    const d = r.doc[s] || '?', o = docs[d] || (docs[d] = { w: 0, d: 0, l: 0, n: 0, pl: 0, pn: 0 }); o.n++; if (r.win < 0) o.d++; else if (r.win === s) o.w++; else o.l++;
    if (pl(r, s)) { o.pl += pl(r, s); o.pn++; }
    if (r.per && r.per[s]) { const k = r.per[s] + (r.dif && r.dif[s] && r.dif[s] !== 'normal' ? ' (' + r.dif[s] + ')' : ''), p = pers[k] || (pers[k] = { w: 0, d: 0, l: 0, n: 0, pl: 0, pn: 0 }); p.n++; if (r.win < 0) p.d++; else if (r.win === s) p.w++; else p.l++; if (pl(r, s)) { p.pl += pl(r, s); p.pn++; } }
    const x = r.tickets[s]; if (x) { tk.loss += x.loss; tk.bleed += x.bleed; tk.pt += x.ptLost - x.ptTook; tk.civ += x.civ || 0; tk.other += x.other; }
  }
  for (const r of done) if (r.civ) { cv.n++; cv.dead += r.civ.dead; cv.evac += r.civ.evac; cv.turned += r.civ.turned.length; for (const x of r.civ.side) if (x) cv.roe += x.roe; }
  for (const r of reps) for (const e of r.eff) { const k = kinds[e.u] || (kinds[e.u] = { made: 0, lost: 0, kills: 0, paid: 0, value: 0, life: 0, ln: 0 }); k.made += e.made; k.lost += e.lost; k.kills += e.kills; k.paid += e.paid; k.value += e.value; if (e.life !== null) { k.life += e.life * e.lost; k.ln += e.lost; } }
  const all = tk.loss + tk.bleed + tk.pt + tk.civ + tk.other || 1, share = dec.length ? Math.max(...w) / dec.length : 0, lim = N > 2 ? ALERT.share3 : ALERT.share;
  const elim = done.reduce((a, r) => a + (Array.isArray(r.out) ? r.out.length : 0), 0);
  return { n, sides: N, over: done.length, draws: done.length - dec.length, wins: w, winShare: w.map(x => (dec.length ? x / dec.length : null)), side0: dec.length ? w[0] / dec.length : null,
    alert: dec.length >= ALERT.n && share > lim, alertAt: lim, few: dec.length < ALERT.n, place, meanPlace, elim: done.length ? elim / done.length : null,
    why, docs, pers, dur: durs.length ? { mean: durs.reduce((a, b) => a + b, 0) / durs.length, median: durs[durs.length >> 1], min: durs[0], max: durs[durs.length - 1] } : null,
    tickets: { loss: tk.loss / all, bleed: tk.bleed / all, pt: tk.pt / all, civ: tk.civ / all, other: tk.other / all }, kinds,
    civ: cv.n ? { dead: cv.dead / cv.n, evac: cv.evac / cv.n, turned: cv.turned / cv.n, roe: cv.roe / cv.n } : null,
    mano: mano(reps), dry: null, missions: null };
}
/* the general's manoeuvre over many reviews (M0): shares pooled from each side's raw counts (the review's mano), counts per match (both sides).
   MANO.goal: the targets of the manoeuvre proposal (cf-manobra-visao §14, decision D10 A) */
const MANO = { goal: { flank: .35, withMv: .5, off: .4, amb: 2, ambOk: .4, offAxis: .2, ent: 1, gen: 1 } };
function mano(reps) {
  const R = reps.filter(r => Array.isArray(r.mano)), M = R.flatMap(r => r.mano.filter(Boolean)), n = R.length;
  if (!M.length) return null;
  const sum = f => M.reduce((a, m) => a + (f(m) || 0), 0), sh = (a, b) => (b ? a / b : null), per = v => v / n, add = (o, k, v) => { o[k] = (o[k] || 0) + v; };
  const A = [0, 0, 0, 0, 0, 0], Aa = [0, 0, 0, 0, 0, 0], V = [0, 0, 0, 0], mv = {}, no = {};
  for (const m of M) { m.raw.a.forEach((v, i) => { A[i] += v; }); m.raw.aAtk.forEach((v, i) => { Aa[i] += v; }); m.raw.v.forEach((v, i) => { V[i] += v; }); for (const k in m.mv) add(mv, k, m.mv[k]); for (const k in m.flkNo) add(no, k, m.flkNo[k]); }
  const smp = A.reduce((a, b) => a + b, 0), smpAtk = Aa.reduce((a, b) => a + b, 0), atk = sum(m => m.atk), fire = sum(m => m.amb.fire), road = sum(m => m.raw.road), off = sum(m => m.raw.o), mov = V[0] + V[1] + V[2];
  const ent = M.filter(m => m.raw.dom), trd = M.some(m => m.tr), K = R.map(r => r.tour && r.tour.aib).filter(Boolean);
  const cost = K.length ? { n: K.length, gen: K.reduce((a, k) => a + k.gen, 0) / K.length, genWorst: Math.max(...K.map(k => k.genWorst)), avg: K.reduce((a, k) => a + k.avg, 0) / K.length } : null;
  return { n, sides: M.length, atk: per(atk), occ: per(sum(m => m.occ)), go: per(sum(m => m.go)), took: per(sum(m => m.took)), back: per(sum(m => m.back)), occTook: per(sum(m => m.occTook)),
    smp, smpAtk, flank: sh(A[3] + A[4] + A[5], smp), flankAtk: sh(Aa[3] + Aa[4] + Aa[5], smpAtk), front: sh(A[0], smp), obl: sh(A[1] + A[2], smp), off: sh(sum(m => m.raw.off), smp),
    withMv: sh(sum(m => m.withMvN), atk), mvN: per(sum(m => m.mvN)), mv, flkNo: no, flkEval: Object.values(no).reduce((a, b) => a + b, 0) + (mv.flk || 0),
    amb: { arm: per(sum(m => m.amb.arm)), fire: per(fire), ok: sh(sum(m => m.amb.ok), fire), nv: per(sum(m => m.amb.nv)), kv: per(sum(m => m.amb.kv)) },
    offAxis: trd ? sh(road - sum(m => m.raw.axis), road) : null, offRoad: trd ? sh(off, road + off) : null,
    rail: sh(V[0], mov), trip: sh(V[1], mov), offRail: sh(V[2], mov), want: per(sum(m => m.want)),
    ent: ent.length ? ent.reduce((a, m) => a + m.ent, 0) / ent.length : null, rep: sh(sum(m => m.rep), sum(m => m.again)), cost };
}
const f2 = v => (Math.round(v * 100) / 100).toString().replace('.', ',');
const pc = v => (v === null || v === undefined ? '—' : Math.round(v * 100) + '%'), f1 = v => (v === null || v === undefined ? '—' : (Math.round(v * 10) / 10).toString().replace('.', ','));
/* the manoeuvre's rows [what, its value, the target], from mano() */
function manoRows(M) {
  const G = MANO.goal, kinds = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + f1(v / M.n)).join(', ') || '—';
  return [
    ['Assaltos por partida (chegaram à hora H, tomaram o ponto, recuaram)', f1(M.atk) + ' (' + f1(M.go) + ', ' + f1(M.took) + ', ' + f1(M.back) + ')', '—'],
    ['Ocupações de ponto vazio por partida (tomadas)', f1(M.occ) + ' (' + f1(M.occTook) + ')', '—'],
    ['Taxa de flanco: amostras de chegada a 70° ou mais do eixo (só assaltos)', pc(M.flank) + ' (' + pc(M.flankAtk) + ')', '≥ ' + pc(G.flank)],
    ['Chegada de frente (menos de 35° do eixo); oblíqua (35° a 70°)', pc(M.front) + '; ' + pc(M.obl), '—'],
    ['Fora do eixo: amostras a mais de 120 m da rota-eixo', pc(M.off), '≥ ' + pc(G.off)],
    ['Assaltos com manobra (flanco, cerco ou finta)', pc(M.withMv), '≥ ' + pc(G.withMv)],
    ['Emboscadas e bloqueios por partida: armados, disparados', f1(M.amb.arm) + ', ' + f1(M.amb.fire), '≥ ' + G.amb + ' disparados'],
    ['Emboscadas boas: 1 veículo ou mais, no máximo 1 esquadra perdida', pc(M.amb.ok), '≥ ' + pc(G.ambOk)],
    ['Tráfego nas ruas fora dos eixos (fora de toda estrada)', pc(M.offAxis) + ' (' + pc(M.offRoad) + ')', '≥ ' + pc(G.offAxis)],
    ['Veículos em movimento: no trilho, em viagem pela rede, fora', pc(M.rail) + ', ' + pc(M.trip) + ', ' + pc(M.offRail), '—'],
    ['"Sem força para atacar" por partida', f1(M.want), '—'],
    ['Entropia das chegadas (bits)', f1(M.ent), '+' + G.ent + ' bit sobre a referência'],
    ['Repetição: mesmo objetivo, eixo e lado de chegada do assalto anterior', pc(M.rep), 'metade da referência'],
    ['Manobras abertas por partida (por tipo)', f1(M.mvN) + ' (' + kinds(M.mv) + ')', '—'],
    ['Custo do general por quadro (média; pior), em ms' + (M.cost ? ' em ' + M.cost.n + ' partidas com o medidor ligado' : ''), M.cost ? f2(M.cost.gen) + '; ' + f2(M.cost.genWorst) : '—', '≤ ' + G.gen + ' ms'],
    ['Flanco por estrada: avaliado, aberto, recusado por motivo', M.flkEval + ', ' + (M.mv.flk || 0) + ', ' + (Object.entries(M.flkNo).map(([k, v]) => k + ' ' + v).join(', ') || '—'), '—']];
}
/* the manoeuvre's section; ref: the mano of an earlier --json (the reference), as a last column */
function manoPrint(M, ref) {
  const L = ['', '## Manobra do general', '', M.n + ' partidas com a medição de manobra (' + M.smp + ' amostras de chegada' + (ref ? '; referência: ' + ref.n + ' partidas' : '') + ').'], R = ref ? manoRows(ref) : null;
  L.push('', '| Métrica | Valor | Meta |' + (R ? ' Referência |' : ''), '| --- | --- | --- |' + (R ? ' --- |' : ''));
  manoRows(M).forEach((r, i) => L.push('| ' + r.join(' | ') + ' |' + (R ? ' ' + R[i][1] + ' |' : '')));
  return L.join('\n');
}
function print(A, title, ref) {
  const L = [];
  L.push('# ' + title, '', A.n + ' partidas, ' + A.over + ' terminadas, ' + A.draws + ' empates.');
  const lim = A.alertAt || ALERT.share, ns = A.sides || 2, nm = s => 'lado ' + s + (ns > 2 ? ' (' + ['EUA', 'Rússia', 'Insurgentes'][s] + ')' : ''), mp = o => (o.pn ? f1(o.pl / o.pn) : '—');
  L.push('', '## Vitória por lado', '', A.wins.map((x, s) => (s ? nm(s) : nm(s).replace(/^l/, 'L')) + ': ' + x + ' (' + pc(A.winShare ? A.winShare[s] : s ? (A.side0 === null ? null : 1 - A.side0) : A.side0) + ' das decididas)').join(', ') + '.',
    A.alert ? 'ALERTA: um lado venceu mais de ' + pc(lim) + ' em ' + A.wins.reduce((a, b) => a + b, 0) + ' partidas decididas.' : A.few ? 'Menos de ' + ALERT.n + ' partidas decididas: cedo para alarme.' : 'Dentro da faixa (nenhum lado acima de ' + pc(lim) + ').');
  if (ns > 2 && A.place) {
    L.push('', '## Colocação por lado', '', '| Lado | ' + A.place.map((p, k) => k + 1 + 'º').join(' | ') + ' | Média |', '| --- | ' + A.place.map(() => '---').join(' | ') + ' | --- |');
    A.place.forEach((p, s) => L.push('| ' + nm(s) + ' | ' + p.join(' | ') + ' | ' + f1(A.meanPlace[s]) + ' |'));
    L.push('', 'Lados eliminados por partida: ' + f1(A.elim) + '.');
  }
  L.push('', '## Por doutrina', '', '| Doutrina | Partidas | V | E | D |' + (ns > 2 ? ' Colocação média |' : ''), '| --- | --- | --- | --- | --- |' + (ns > 2 ? ' --- |' : ''));
  for (const [d, o] of Object.entries(A.docs)) L.push('| ' + d + ' | ' + o.n + ' | ' + o.w + ' | ' + o.d + ' | ' + o.l + ' |' + (ns > 2 ? ' ' + mp(o) + ' |' : ''));
  if (A.pers && Object.keys(A.pers).length) { L.push('', '## Por personalidade do general', '', '| Personalidade | Partidas | V | E | D |' + (ns > 2 ? ' Colocação média |' : ''), '| --- | --- | --- | --- | --- |' + (ns > 2 ? ' --- |' : '')); for (const [d, o] of Object.entries(A.pers)) L.push('| ' + d + ' | ' + o.n + ' | ' + o.w + ' | ' + o.d + ' | ' + o.l + ' |' + (ns > 2 ? ' ' + mp(o) + ' |' : '')); }
  L.push('', '## Fim e duração', '', Object.entries(A.why).map(([k, v]) => k + ': ' + v).join(', ') || '—',
    A.dur ? 'Duração: média ' + f1(A.dur.mean) + ' min, mediana ' + f1(A.dur.median) + ', de ' + f1(A.dur.min) + ' a ' + f1(A.dur.max) + '.' : 'Duração: —');
  L.push('', '## Para onde foram os tíquetes', '', 'Perdas ' + pc(A.tickets.loss) + ', sangria ' + pc(A.tickets.bleed) + ', pontos ' + pc(A.tickets.pt) + ', civis ' + pc(A.tickets.civ) + ', outros (requisições, instalações) ' + pc(A.tickets.other) + '.');
  if (A.civ) L.push('', '## Civis (média por partida)', '', 'Mortos ' + f1(A.civ.dead) + ', vilas evacuadas ' + f1(A.civ.evac) + ', vilas que se voltaram contra um lado ' + f1(A.civ.turned) + ', fogo suspenso pelas regras de engajamento ' + f1(A.civ.roe) + '.');
  L.push('', '## Custo-efetividade por tipo (em tíquetes)', '', '| Tipo | Entrou | Perdidos | Abates | Pago | Destruído | Razão | Vida média (s) |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const [k, o] of Object.entries(A.kinds).sort((a, b) => b[1].paid + b[1].value - (a[1].paid + a[1].value))) L.push('| ' + k + ' | ' + o.made + ' | ' + o.lost + ' | ' + o.kills + ' | ' + Math.round(o.paid) + ' | ' + Math.round(o.value) + ' | ' + (o.paid ? f1(o.value / o.paid) : '∞') + ' | ' + (o.ln ? Math.round(o.life / o.ln) : '—') + ' |');
  if (A.mano) L.push(manoPrint(A.mano, ref && ref.mano));
  L.push('', 'Minutos de nó seco e sucesso por missão: sem dado até a logística física e o contrato de missão existirem.');
  return L.join('\n');
}
/* the brain's measures over many reviews (R.brain): each side's raw counters added up (the page's medAdd), then the page's medSum; null without any */
function brain(C, reps) {
  const R = reps.filter(r => r.brain && r.brain.side.some(Boolean)); if (!R.length) return null;
  const raw = C.$('medNew')(), ev = {};
  for (const r of R) for (const x of r.brain.side) if (x) { C.$('medAdd')(raw, x.raw); for (const k in x.ev) ev[k] = (ev[k] || 0) + x.ev[k]; }
  const sum = C.$('medSum')(raw, ev, R.length);
  if (R.every(r => r.tour && r.tour.nobudget)) sum.ai = sum.aiW = null;   // --nobudget stops the frame meter's clock: no cost to show
  return { n: R.length, on: [...new Set(R.map(r => r.brain.on))], raw, ev, sum };
}
/* the measures of a reference read back from JSON: worked out again from its raw counters (JSON keeps "never within the window", Infinity, as
   null); a measure the reference left out on purpose (null, and not Infinity once worked out) stays out */
function brainRef(C, ref) {
  const M = C.$('medSum')(C.$('medRaw')(ref.raw), ref.ev, ref.n), sum = ref.sum || {};
  for (const k in M) if (sum[k] === null && M[k] !== Infinity) M[k] = null;
  return M;
}
/* the brain's section: the page's rows [measure, value, target], with a reference column from an earlier --json */
function brainPrint(C, B, ref) {
  const L = ['', '## Cérebro', '', B.n + ' partidas com a medição do cérebro (BRAIN.on ' + B.on.map(v => (v === null ? '?' : v)).join(', ') + '; os dois lados somados' + (ref ? '; referência: ' + ref.n + ' partidas' : '') + ').'], R = ref ? C.$('medRows')(brainRef(C, ref)) : null;
  L.push('', '| Medida | Valor | Meta |' + (R ? ' Referência |' : ''), '| --- | --- | --- |' + (R ? ' --- |' : ''));
  C.$('medRows')(B.sum).forEach((r, i) => L.push('| ' + r.join(' | ') + ' |' + (R ? ' ' + R[i][1] + ' |' : '')));
  if (Object.keys(B.ev).length) L.push('', 'Eventos do cérebro: ' + Object.entries(B.ev).map(([k, v]) => k + ' ' + v).join(', ') + '.');
  return L.join('\n');
}
/* the town's measures over many reviews (R.urb, G7): each side's raw counters added up (the page's urbAdd), then the page's urbSum; null without any */
function urb(C, reps) {
  const R = reps.filter(r => r.urb && r.urb.side.some(Boolean)); if (!R.length) return null;
  const raw = C.$('urbNew')();
  for (const r of R) for (const x of r.urb.side) if (x) C.$('urbAdd')(raw, x);
  return { n: R.length, on: [...new Set(R.map(r => r.urb.on))], raw, sum: C.$('urbSum')(raw, R.length) };
}
/* the town's section, with a reference column from an earlier --json (its urb.raw worked out again) */
function urbPrint(C, U, ref) {
  const L = ['', '## Urbano (G7)', '', U.n + ' partidas com a medição urbana (URB.on ' + U.on.map(v => (v === null ? '?' : v)).join(', ') + '; os dois lados somados' + (ref ? '; referência: ' + ref.n + ' partidas, URB.on ' + ref.on.join(', ') : '') + ').'];
  const R = ref ? C.$('urbRows')(C.$('urbSum')(C.$('urbAdd')(C.$('urbNew')(), ref.raw), ref.n)) : null;
  L.push('', '| Medida | Valor | Meta |' + (R ? ' Referência |' : ''), '| --- | --- | --- |' + (R ? ' --- |' : ''));
  C.$('urbRows')(U.sum).forEach((r, i) => L.push('| ' + r.join(' | ') + ' |' + (R ? ' ' + R[i][1] + ' |' : '')));
  return L.join('\n');
}
/* the A×B of the brain: the same seeds off (a) and on (b); pairs that played the very same match (result, length and tickets) */
function abPrint(C, A, B, ra, rb) {
  const key = r => (r.tour ? r.tour.seed + ':' + r.era + ':' + r.doc.join(',') : r.file), m = new Map(ra.map(r => [key(r), r]));
  let same = 0, pairs = 0;
  for (const r of rb) { const o = m.get(key(r)); if (!o) continue; pairs++; if (o.win === r.win && o.dur === r.dur && JSON.stringify(o.tk) === JSON.stringify(r.tk)) same++; }
  const eff = X => { let v = 0, p = 0; for (const k of Object.values(X.kinds)) { v += k.value; p += k.paid; } return p ? v / p : null; };
  const res = X => [pc(X.winShare ? X.winShare[0] : X.side0), String(X.draws), X.dur ? f1(X.dur.mean) + ' min' : '—', f1(eff(X)), pc(X.tickets.loss)];
  const L = ['# Torneio A×B do cérebro', '', A.n + ' partidas com o cérebro desligado (A) e ' + B.n + ' com ele ligado (B), nas mesmas sementes e doutrinas; ' + same + ' de ' + pairs + ' pares jogaram exatamente a mesma partida' + (same === pairs && pairs ? ' (nenhum código lê BRAIN ainda, ou o cérebro não mudou nada).' : '.'),
    '', '## Resultado', '', '| Medida | A: desligado | B: ligado |', '| --- | --- | --- |'];
  const a = res(A), b = res(B);
  ['Vitórias do lado 0 (das decididas)', 'Empates', 'Duração média', 'Eficiência de tíquetes (destruído / pago)', 'Tíquetes que foram em perdas'].forEach((k, i) => L.push('| ' + k + ' | ' + a[i] + ' | ' + b[i] + ' |'));
  if (A.brain || B.brain) {
    const x = A.brain ? C.$('medRows')(A.brain.sum) : null, y = B.brain ? C.$('medRows')(B.brain.sum) : null, rows = x || y;
    L.push('', '## Cérebro', '', 'Os dois lados somados; A em ' + (A.brain ? A.brain.n : 0) + ' partidas, B em ' + (B.brain ? B.brain.n : 0) + '.', '', '| Medida | Meta | A: desligado | B: ligado |', '| --- | --- | --- | --- |');
    rows.forEach((r, i) => L.push('| ' + r[0] + ' | ' + r[2] + ' | ' + (x ? x[i][1] : '—') + ' | ' + (y ? y[i][1] : '—') + ' |'));
  }
  return L.join('\n');
}
async function main() {
  const o = args(process.argv.slice(2));
  if (o.one) { const r = playOne(o.one); if (process.send) process.send(r); else console.log(JSON.stringify(r)); return; }
  if (o.help) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^[\s\S]*?\/\*/, '')); return; }
  let list, title;
  if (o.n > 0) { list = await tourney(o); title = 'Torneio IA × IA'; }
  else { list = files(o.dirs.length ? o.dirs : [DIR], o.era); title = 'Balanceamento: ' + (o.dirs.length ? o.dirs.join(', ') : DIR); }
  const C = H.load({ ana: true }), reps = [];
  for (const f of list) { try { const ev = readMatch(f), h = ev.find(e => e.k === 'hdr'); if (h) reps.push(Object.assign(C.anaReport(ev), { file: f, tour: h.tour || null })); } catch (e) { console.error('skip ' + f + ': ' + e.message); } }
  if (!reps.length) { console.log('Nenhuma partida em ' + (o.dirs.length ? o.dirs.join(', ') : DIR) + '.'); return; }
  const loc = reps.filter(r => srcOf(r.file) === 'local'), real = reps.filter(r => !loc.includes(r)), A = aggregate(real), AL = loc.length ? aggregate(loc) : null;
  let ref = o.ref ? JSON.parse(fs.readFileSync(o.ref, 'utf8')) : null;
  if (ref && ref.ab) ref = ref.a;   // an A×B's --json: its half with the brain off is the reference
  A.brain = brain(C, real); if (AL) AL.brain = brain(C, loc);
  A.urb = urb(C, real); if (AL) AL.urb = urb(C, loc);
  if (o.brain === 'ab') {   // the A×B: the two halves of the tournament by the brain each match was played with
    const arm = v => real.filter(r => (r.tour && r.tour.brain !== undefined ? r.tour.brain : r.brain ? r.brain.on : null) === v), ra = arm(0), rb = arm(1);
    const X = Object.assign(aggregate(ra), { brain: brain(C, ra) }), Y = Object.assign(aggregate(rb), { brain: brain(C, rb) });
    console.log(abPrint(C, X, Y, ra, rb));
    if (o.json) fs.writeFileSync(o.json, JSON.stringify({ ab: 1, tour: { n: o.n, era: o.era || 'all', min: o.min || null, nobudget: !!o.nobudget, mapv: o.mapv || 4, seed: o.seed || 1 }, a: Object.assign({ files: ra.map(r => r.file) }, X), b: Object.assign({ files: rb.map(r => r.file) }, Y) }, null, 1));
    return;
  }
  console.log(print(A, title, ref) + (A.brain ? brainPrint(C, A.brain, ref && ref.brain) : '') + (A.urb ? urbPrint(C, A.urb, ref && ref.urb) : ''));
  if (AL) console.log('\n' + print(AL, title + ' (partidas locais: solo ou espectador, fora do total acima)', ref) + (AL.brain ? brainPrint(C, AL.brain, ref && ref.brain) : '') + (AL.urb ? urbPrint(C, AL.urb, ref && ref.urb) : ''));
  const tour = o.n > 0 ? { brain: o.brain === undefined ? null : +o.brain, n: o.n, sides: o.sides || 2, era: o.sides === 3 ? 'modern' : o.era || 'all', docs: o.docs || null, pers: o.pers || null, dif: o.dif || null, min: o.min || null, len: o.len || 0, eco: !!o.eco, lg: !!o.lg, rec: !!o.rec, nobudget: !!o.nobudget, mapv: o.mapv || 4, seed: o.seed || 1, set: o.set || null } : null;
  if (o.json) fs.writeFileSync(o.json, JSON.stringify(Object.assign({ files: real.map(r => r.file), local: AL && Object.assign({ files: loc.map(r => r.file) }, AL) }, tour && { tour }, A), null, 1));
}
if (require.main === module) main().catch(e => { console.error(e.stack); process.exit(1); });
module.exports = { srcOf, aggregate, readMatch, files, save, plan, tuples, playOne, print, mano, manoPrint, brain, brainRef, brainPrint, urb, urbPrint, abPrint, ALERT, MANO };
