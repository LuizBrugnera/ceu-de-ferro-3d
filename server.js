'use strict';
/* Céu de Ferro 3D: serves the game page and relays PvP messages between the players of a room.
   It never simulates anything. It assigns ids, checks message shape and class (plane, tank, aa, art, inf), owns the scoreboard and names the host:
   the earliest-joined player still in the room, whose client simulates the room's AI battle. AI entities have negative ids.
   welcome names what this server knows, so that a page can tell an older one: swap, inf, obj, sup (supply bases: base and build),
   trn (transport: the class trn, the sniper kits, and the messages board, seats, eject and cargo), cmd (the commander: the mortar kits,
   toss k 3 and 4, s on shot and aishot, and the message cmd), eco (the economy: eco, ecs, keep) and gen (the general: gen, glog, gclaim,
   gctl, gcmd, gask, gres; messages private to a side go only to that side's players, and cmd too), sap (the sapper kits and the
   messages mine, mboom, mreq and dint), ana (analytics: the host's events of the match, kept on disk; see below) and sky (day, night and weather: the messages sky and ill)
   hlp (the units' calls for help: the messages hlp, hask and hacc), ped (a player's requests to his general from the map: gped and gpr)
   lg (physical logistics: the crates of a supply base as a ninth number of its base row, of the points as cq's sk, and the messages lsp and lgx)
   rec (vehicle recovery and medical evacuation: the models of SVC in the AI's ground rows, the general's question rec),
   rte (abstract orders and routes: gcmd may carry rt, a route of at most 8 x z pairs),
   man2 (M7: gcmd may carry ap, ap2, f and e, the keys of the new manoeuvres man fixflank envelop turn penet ambush guard),
   br (destructible bridges: their stages travel in obj like any object's; the pontoon is the work of kind 7 in fort and fbuild, and gask brg),
   gq (the general's tools for everyone: gask missions, unit with an id, lots and mines),
   crl (the radio relay of the command net: the work of kind 8 in fort and fbuild),
   the tactical map (gask tmap: the asker's side's layer k, one of f v o t p k l, at 1 km; an older server answers shape),
   the approaches (gask ap: the asker's side's three ways to the objective nearest x z, from side a; an older server answers shape),
   the General 2's world (gask mundo: the regions, edges and the asker's side's belief; with x z, the different routes there from region id)
   and brb (bridges built again: the rebuild is the work of kind 9 in fort and fbuild, a bridge's stage goes back to 0 in obj, and a pontoon may lie
   at any narrow stretch of the river, the same kind 7 row placed by its own x z), and bnb (a new permanent bridge at such a stretch: the work of kind 10),
   and hsc (the engineers' walls, cf-engenharia-pontos: the works of kinds 11 to 13, HESCO tall and low and the T-wall, in fort and fbuild),
   and cam (the camouflage nets, cf-pol2-camuflagem: the works of kinds 14 and 15, the small net and the large one, in fort and fbuild).
   rs: a room whose last player leaves is suspended, not ended, and whoever comes back resumes it (snapIn, SUSPEND, GET /partidas).
   ns (3 sides, cf-3-lados P5; NOT TESTED, see docs/nao-testado/cf-3l-p5-servidor.md): the number of sides of the room, 2 or 3 (3 only in modern:
   0 the USA, 1 Russia, 2 the Insurgents). The first player's join says it (ns, as mv), welcome tells it, and a page of another count is refused
   (error sides). A model's side is MSIDE's, no longer the half of its list; every side check, the general's seats, cmd and cq v2 take N sides. */
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080, PAGE = path.join(__dirname, 'Céu de Ferro 3D.html'), MAXLEN = 2048, MAXAI = 16384, AICAP = 64, CAP = 16;
/* valid models per room and class (a model's side is MSIDE's, below); the page's PLANES, TANKS, AAS, ARTS and INF tables are the other copy.
   inf: the infantry kits; an AI soldier's snapshot row names its kit by an index the page counts (trnKits), checked here only against the size.
   The row has 9 numbers, or 10 when its last is what the soldier calls out (SAY, the page's speech balloons): with only 9 allowed, every
   soldier row of a host whose page had the balloons was dropped and the guests saw none of the AI's infantry (cf-pol-fluxos; tests/relay.js).
   That last number is the call's kind (5 bits) plus 32 × (13 × its line's slot, up to 1023, + up to 12): below 1 << 19. A cap of 1024 still
   dropped a third of the soldier messages, the ones with a line spoken in them, and a resumed match came back without those soldiers */
const MODELS = {
  ww2: { plane: ['stuka', 'bf109', 'spit', 'p47', 'he177', 'b17'], tank: ['tiger', 'pz4', 'sherman', 't34'], aa: ['wirbel', 'm16'], art: ['hummel', 'pzwerfer', 'priest', 'bm13'], inf: ['schutze', 'mgschutze', 'pzjager', 'scharf', 'grwTrupp', 'funker', 'rifleman', 'bargunner', 'bazookaman', 'sniper', 'mortarman', 'radioman'], trn: ['kubel', 'opel', 'sdkfz251', 'kfz31', 'opelw', 'jeep', 'gmc', 'm3ht', 'wc54', 'gmcw'] },
  modern: { plane: ['f22', 'a10', 'su57', 'su25', 'b2', 'tu160'], tank: ['abrams', 'leo2', 't90', 't72'], aa: ['nasams', 'pantsir'], art: ['pzh', 'm270', 'msta', 'bm21'], inf: ['blueRifle', 'blueSaw', 'blueAT', 'blueAD', 'blueSniper', 'blueMortar', 'blueRadio', 'redRifle', 'redMG', 'redAT', 'redAD', 'redSniper', 'redMortar', 'redRadio'], trn: ['hmmwv', 'hemtt', 'lav25', 'm577', 'm997', 'm1089', 'tigr', 'ural', 'btr82', 'mtlbu', 'uaz452', 'mtoub'] }
};
/* helicopters: aircraft to every check of an AI row or a loss, a class of their own to join, swap and hstate. None in 1944 */
MODELS.ww2.heli = []; MODELS.modern.heli = ['ah64', 'uh60', 'mi28', 'mi8', 'mi8i'];   // mi8i: the Insurgents' captured Mi-8T (cf-transporte-jogador)
/* plane and helicopter loadouts (welcome says lo: 1 and hlo: 1), the other copy of the page's RACKS and STORES. LOADS: per plane the kg it lifts and, per hardpoint group, the most of each
   store; STW: a store's kg, and the lot it comes in when not one by one. The order of STW is the order of the page's STORES: a release names
   its store as 2 + its place there */
const LOADS = {
  stuka: [1800, { sc500: 1, sc1000: 1, sc250: 1, ab250: 1 }, { sc50: 4, sc250: 2 }],
  bf109: [600, { sc250: 1, sc500: 1, sc50: 4 }, { wgr21: 2, ammo20: 1 }],
  spit: [460, { lb250: 2 }, { lb500: 1 }, { ammo20: 1 }],
  p47: [1500, { lb500: 2, lb1000: 2 }, { hvar: 10 }, { lb500: 1, ammo50: 1 }],
  f22: [1900, { gbu39: 8, gbu32: 2, mk83: 2 }, { aim120: 6 }, { aim9x: 2 }],
  a10: [3300, { mk82: 6, mk84: 2, cbu87: 4, gbu12: 4 }, { agm65: 6, mk82: 6, cbu87: 4, hydra: 28 }, { aim9: 2, hydra: 14 }],
  su57: [2300, { kh38: 2, kab500: 2, fab500: 2, fab250: 4, kab500kr: 2 }, { r77: 6 }, { r73: 2 }],
  su25: [3300, { kh25: 4, kab500: 2, fab500: 4, rbk500: 4, kab500kr: 2 }, { s8: 80, fab250: 4, rbk500: 2 }, { r73: 2 }],
  b2: [18000, { gbu31: 8, b83: 1 }],
  tu160: [40000, { fab500m: 24, rdsn: 1 }],
  ah64: [1400, { hydra19: 38, hellfire: 8, hellfirel: 8 }, { hellfire: 8, hellfirel: 8, hydra19: 38 }, { atas: 4 }, { ammo30: 1 }],
  mi28: [1700, { s8: 40, s13: 10, ataka: 8 }, { ataka: 8, s8: 40 }, { iglav: 4 }],
  uh60: [1100, { hydra: 14, hydra19: 38 }, { hellfire: 8, atas: 4 }, { ammo762: 1 }],
  mi8: [1800, { s8: 40, s13: 10 }, { s8: 40, ataka: 4, iglav: 4 }, { ammo762: 1 }]
};
const STW = { gbu39: 130, agm65: 300, kh38: 520, kh25: 300, aim120: 160, aim9: 86, r77: 190, r73: 105, s8: [15, 20], mk82: 227, mk83: 450, fab250: 250, fab500: 500, mk84: 925, aim9x: 85, cbu87: 430, rbk500: 500, gbu12: 277, gbu32: 470, kab500: 525, hydra: [14, 7], sc50: 50, sc250: 250, sc500: 500, sc1000: 1000, ab250: 220, wgr21: 110, lb250: 113, lb500: 227, lb1000: 454, hvar: [64, 2], ammo20: 80, ammo50: 80, kab500kr: 520, hellfire: [49, 4], hellfirel: [50, 4], ataka: [50, 4], hydra19: [14, 19], s13: [69, 5], atas: [16, 2], iglav: [18, 2], ammo30: 210, ammo762: 40, gbu31: 925, fab500m: 500, b83: 1100, rdsn: 1100 };
const NST = Object.keys(STW).length;
const FKINDS = 15;   // the kinds of work fort and fbuild carry (7: the pontoon, br; 8: the radio relay, crl; 9: a bridge's rebuild, brb; 10: a new bridge, bnb; 11-13: the HESCO walls and the T-wall, hsc; 14-15: the camouflage nets, cam)
const rooms = { ww2: new Map(), modern: new Map() };
/* the most sides a room of the era may have; room.ns, the sides of the match in the room (its first player's), 2 until one says 3. The general's
   seats are kept for the most (gen, genk), and a player is told those of the room's sides (gview) */
const MAXN = { ww2: 2, modern: 3 };
for (const era in MODELS) { const m = MODELS[era]; rooms[era].ns = 2; rooms[era].gen = Array(MAXN[era]).fill(0); rooms[era].genk = Array(MAXN[era]).fill(0); rooms[era].host = null; rooms[era].gens = new Set(); rooms[era].keep = null; rooms[era].models = m; rooms[era].air = new Set(m.plane); rooms[era].gnd = new Set([...m.tank, ...m.aa, ...m.art, ...m.trn, 'truck']); rooms[era].inf = new Set(m.inf); }
for (const era in MODELS) for (const id of MODELS[era].heli) rooms[era].air.add(id);
/* the paratroopers' transports (welcome says para: 1; cf-paraquedistas): the page's PLANES with para: 1, AI rows and, since the player's
   transport (welcome ptr: 1; cf-transporte-jogador), a player's plane too, at the end of the plane list so that no older index moves */
const PARAS = { ww2: ['ju52', 'c47'], modern: ['c130', 'il76'] };
for (const era in PARAS) for (const id of PARAS[era]) { rooms[era].air.add(id); MODELS[era].plane.push(id); }
for (const era in MODELS) rooms[era].specs = new Set();   // spectators: clients with no body, not in the room's map
/* recovery vehicles, ambulances and repair trucks (rec): models of the AI's ground rows (the page's REC.side is the other copy). The ambulances and
   the repair trucks are a player's too, so they are also in the trn lists above, each on its side in MSIDE */
const SVC = { ww2: ['bergep', 'm32', 'kfz31', 'wc54', 'opelw', 'gmcw'], modern: ['m88a2', 'brem1', 'm997', 'uaz452', 'm1089', 'mtoub'] };
for (const era in SVC) for (const id of SVC[era]) rooms[era].gnd.add(id);
let nextId = 1;

const model = (era, cls, id) => typeof cls === 'string' && Object.hasOwn(era, cls) && era[cls].includes(id);
/* a model's side in the room's era (MSIDE), -1 for none; a player's own side is c.side, fixed at join (a captured vehicle keeps it: p.cap, p.cs) */
const side = (room, id) => (Object.hasOwn(room.ms, id) ? room.ms[id] : -1);
/* a side of the room (0 to its ns - 1), and the bits of all of them */
const ts = (room, v) => Number.isInteger(v) && v >= 0 && v < room.ns, ALL = room => (1 << room.ns) - 1;
/* the general's seats a member is told: the room's sides, and a bridge's own side even before the room says 3 */
const gview = (room, o, l) => l.slice(0, Math.max(room.ns, o && o.gen ? o.player.side + 1 : 0));
const num = v => typeof v === 'number' && Number.isFinite(v);
const vec = (v, n) => Array.isArray(v) && v.length === n && v.every(num);
const pid = v => Number.isInteger(v) && v > 0, aid = v => Number.isInteger(v) && v < 0;
const ref = v => v === null || pid(v) || aid(v);
/* a guided missile has an id, so that an interception can name it: the launching client's player id times 4096 plus its own counter.
   m.m: the id of the missile a launch creates, kept only when it is the sender's to give; m.tm: the missile it is aimed at */
const mid = v => Number.isInteger(v) && v >= 4096 && v < 2 ** 40;
const launch = (c, m, o) => { if (mid(m.m) && Math.floor(m.m / 4096) === c.player.id) o.m = m.m; if (mid(m.tm)) o.tm = m.tm; return o; };
const armour = c => c.player.cls === 'tank' || c.player.cls === 'art' || c.player.cls === 'trn';
/* the damage model's fields: d part states (two bits a part for up to 24 parts, bit 48 burning; from a page that takes this server for an
   older one, the first ten parts and bit 20), pt the part a hit struck, k the kind of hit, v the parts behind it on the shot's line, w 1 a high-explosive shell that went in, 2 a
   shaped charge, s 1 a soldier's small-arms round on a soft vehicle. dcap, sent after welcome, says the server knows them */
const bits = v => Number.isInteger(v) && v >= 0 && v < 2 ** 49, part = v => Number.isInteger(v) && v >= 0 && v < 24, kind = v => Number.isInteger(v) && v >= 0 && v < 4;
const via = m => Object.assign({}, Array.isArray(m.v) && m.v.length > 0 && m.v.length <= 3 && m.v.every(part) && { v: m.v }, (m.w === 1 || m.w === 2) && { w: m.w }, m.s === 1 && { s: 1 });
const blow = m => num(m.dmg) && m.dmg > 0 && m.dmg <= 1000 && part(m.pt) && kind(m.k);
/* world objects: a flat list of pairs, an object's id and its stage (1 damaged, 2 down) or the damage done to it */
const pairs = (l, ok) => Array.isArray(l) && l.length > 0 && l.length <= 200 && l.length % 2 === 0 && l.every((v, i) => (i % 2 ? ok(v) : Number.isInteger(v) && v >= 0 && v < 65536));
/* a loadout for that plane, one choice per group, [store, n] or 0, within each group's limits and the plane's weight; anything else is null,
   which is the plane's own load */
function load(cls, id, lo) {
  const L = (cls === 'plane' || cls === 'heli') && Object.hasOwn(LOADS, id) ? LOADS[id] : null; let w = 0;
  if (!L || !Array.isArray(lo) || lo.length !== L.length - 1) return null;
  for (let i = 0; i < lo.length; i++) {
    const c = lo[i], g = L[i + 1];
    if (c === 0) continue;
    if (!Array.isArray(c) || c.length !== 2 || typeof c[0] !== 'string' || !Object.hasOwn(g, c[0])) return null;
    const s = STW[c[0]], st = Array.isArray(s) ? s[1] : 1;
    if (!Number.isInteger(c[1]) || c[1] < 1 || c[1] > g[c[0]] || c[1] % st) return null;
    w += (Array.isArray(s) ? s[0] : s) * c[1];
  }
  return w > L[0] ? null : lo.map(c => c && [c[0], c[1]]);
}
const slot = i => Number.isInteger(i) && i >= 0 && i < 2 + NST;
const host = c => c.room.host === c, toss = m => Number.isInteger(m.k) && m.k >= 0 && m.k <= 4 && vec(m.p, 3) && vec(m.v, 3);
const scores = c => cast(c, { t: 'scores', players: [...c.room.values()].map(o => ({ id: o.player.id, kills: o.player.kills, deaths: o.player.deaths, ai: o.player.ai })) }, true);
/* one AI entity of a snapshot: [id, model, team, hp, flags, then 10 numbers for a plane (p, q, v) or 8 for a vehicle (p, heading, turret, pitch, vx, vz), then its part states].
   A soldier's row (k 2) is shorter: [id, kit index, team, hp, flags, x, z, heading, stance and weapon and squad packed in one integer] */
const aiEnt = (room, e, k) => Array.isArray(e) && aid(e[0]) && ts(room, e[2]) && (k === 2 ? (e.length === 9 || (e.length === 10 && Number.isInteger(e[9]) && e[9] >= 0 && e[9] < 1 << 19)) && e.every(num) && Number.isInteger(e[1]) && e[1] >= 0 && e[1] < room.inf.size && Number.isInteger(e[8]) && e[8] >= 0 && e[8] < 256
  : e.length === (k ? (room.gnd.has(e[1]) ? 14 : 0) : room.air.has(e[1]) ? 16 : 0) && e.every((v, i) => i === 1 || num(v)) && bits(e[e.length - 1]));
const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
const cast = (c, m, all) => { snapIn(c, m); for (const o of c.room.values()) if (all || o !== c) send(o.ws, m); for (const o of c.room.specs || []) if (o !== c) sendSpec(o, m); };

/* c→s messages. Every handler but join runs only for a client that is already in a room. */
const RX = {
  join(c, m) {
    if (c.room) return;
    const era = typeof m.room === 'string' && Object.hasOwn(MODELS, m.room) ? MODELS[m.room] : null;
    if (!era) return send(c.ws, { t: 'error', code: 'room' });
    if (m.cls === 'gen') {   // an MCP bridge: no body, not in the roster, never host; one a side, with the server's key
      const room = rooms[m.room];
      if (!GENKEY || m.key !== GENKEY) { send(c.ws, { t: 'error', code: 'gen' }); return c.ws.close(); }   // one guess a connection
      // a side of the room; in an empty room any side of the era (the first player then says how many there are, and a bridge past them goes)
      if (!int(m.side, 0, MAXN[m.room] - 1) || [...room.gens].some(o => o.player.side === m.side)) return send(c.ws, { t: 'error', code: 'taken' });
      if (room.size && m.side >= room.ns) { send(c.ws, { t: 'error', code: 'sides' }); return c.ws.close(); }   // the room's match has fewer sides: the bridge tries again later
      c.player = { id: nextId++, name: 'MCP', cls: 'gen', model: '', side: m.side, kills: 0, deaths: 0, ai: 0 }; c.gen = 1; c.room = room; room.gens.add(c);
      return send(c.ws, { t: 'welcome', id: c.player.id, host: room.host ? room.host.player.id : 0, side: m.side, ns: room.ns, eco: 1, gen: 1, gn: gview(room, c, room.gen), gk: gview(room, c, room.genk), cqn: room.cqn || 0, gc: 2, players: [...room.values()].map(o => o.player), rte: 1, gq: 1, man2: 1 });
    }
    if (m.cls === 'spec') {   // a spectator: no body, not in the roster, never host; it is sent everything and can send nothing
      const room = rooms[m.room];
      if (!SPEC) return send(c.ws, { t: 'error', code: 'spec' });
      if (room.specs.size >= SPECMAX) return send(c.ws, { t: 'error', code: 'full' });
      const mv = int(m.mv, 1, 99) ? m.mv : 1;
      if (room.size > 0 && mv !== room.mv && !(room.mv === 1 && m.mv1 === 1)) return send(c.ws, { t: 'error', code: 'map' });   // the map-version gate, as for a player
      if (room.size > 0 && m.ns !== undefined && m.ns !== room.ns) return send(c.ws, { t: 'error', code: 'sides' });   // and the sides', when the page says its own
      const name = (typeof m.name === 'string' ? m.name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 16).trim() : '') || 'Espectador';
      c.player = { id: nextId++, name, cls: 'spec', model: '', side: -1, kills: 0, deaths: 0, ai: 0 }; c.spec = 1; c.room = room; room.specs.add(c);
      send(c.ws, Object.assign({}, room.wf, { t: 'welcome', spec: 1, id: c.player.id, host: room.host ? room.host.player.id : 0, ff: room.ff || 0, mv: room.mv || 1, ns: room.ns, gn: gview(room, c, room.gen), gk: gview(room, c, room.genk), cqn: room.cqn || 0, man2: 1, players: [...room.values()].map(o => o.player) }));
      send(c.ws, { t: 'fcap', v: 1 }); send(c.ws, { t: 'dcap', v: 1 });
      if (room.host) send(room.host.ws, { t: 'sjoin', id: c.player.id });
      return;
    }
    if (!model(era, m.cls, m.model)) return send(c.ws, { t: 'error', code: 'model' });
    const room = rooms[m.room];
    if (room.size >= CAP) return send(c.ws, { t: 'error', code: 'full' });
    const name = (typeof m.name === 'string' ? m.name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 16).trim() : '') || 'Jogador';   // the page's own default (it was Piloto, also for a soldier)
    c.player = { id: nextId++, name, cls: m.cls, model: m.model, lo: load(m.cls, m.model, m.lo), kills: 0, deaths: 0, ai: 0 };
    const mv = int(m.mv, 1, 99) ? m.mv : 1;   // the map version of the page; the first player's is the room's
    const ns = m.ns === 3 && MAXN[m.room] >= 3 ? 3 : 2;   // and its sides: a page that does not say is of 2
    const sus = room.size === 0 && room.sus > Date.now() && m.fresh !== 1 && mv === room.snap.mv && ns === (room.snap.ns || 2);   // a suspended match, taken up again
    if (room.size === 0 && room.sus > 0 && !sus) snapDrop(room);   // or left for a new one ("Nova partida", or another map)
    if (room.size === 0) { room.mv = mv; setNs(room, ns); }
    else if (mv !== room.mv && !(room.mv === 1 && m.mv1 === 1)) return send(c.ws, { t: 'error', code: 'map' });
    else if (ns !== room.ns) return send(c.ws, { t: 'error', code: 'sides' });
    c.side = side(room, m.model);
    if (!ts(room, c.side)) return send(c.ws, { t: 'error', code: 'side' });   // an Insurgent model in a room of 2 sides
    c.room = room; room.set(c.player.id, c); if (!room.host) { room.host = c; room.ff = 0; for (const g of room.gens) send(g.ws, { t: 'host', id: c.player.id }); }
    if (sus) { clearTimeout(room.sut); room.sus = 0; }
    send(c.ws, Object.assign({}, room.wf = { t: 'welcome', dr: 1, id: c.player.id, host: room.host.player.id, swap: 1, inf: 1, obj: 1, sup: 1, hl: 1, lo: 1, hlo: 1, trn: 1, cmd: 1, crew: 1, cap: 1, ms: 1, cq: 1, bld: 1, she: 1, civ: 1, eco: 1, gen: 1, gn: gview(room, c, room.gen), gk: gview(room, c, room.genk), cqn: room.cqn || 0, ff: room.ff || 0, mv: room.mv || 1, ns: room.ns, gc: 2, sap: 1, players: [...room.values()].map(o => o.player), rs: 1, ana: ANA.on ? 1 : 0, sky: 1, hlp: 1, lg: 1, rec: 1, rte: 1, br: 1, brb: 1, bnb: 1, hsc: 1, cam: 1, gq: 1, crl: 1, man2: 1, med: 1, ped: 1, para: 1, ptr: 1 }, sus && { host: 0, sus: 1 }));
    send(c.ws, { t: 'fcap', v: 1 });   // this server knows fort and fbuild (trenches and sandbags)
    send(c.ws, { t: 'tcap', v: 1 });   // and tun (the tunnels, cf-trincheiras-tuneis)
    send(c.ws, { t: 'dcap', v: 1 });   // and the longer damage model
    if (sus) snapOut(c);   // a guest of the match that was, until the host message makes it the host: it adopts, as when a host leaves
    cast(c, { t: 'joined', player: c.player });
  },
  /* another vehicle in mid-match, of the room's era and of the side the player is on: the record changes in place and the room is told.
     Anything else is refused to the sender alone (no: 1), with the vehicle it keeps. The score and the host are not touched */
  swap(c, m) {
    const era = c.room.models, p = c.player;
    if (!model(era, m.cls, m.model) || side(c.room, m.model) !== c.side) return send(c.ws, { t: 'swap', id: p.id, cls: p.cls, model: p.model, no: 1 });
    p.cls = m.cls; p.model = m.model; p.cap = 0; delete p.cs; p.lo = load(m.cls, m.model, m.lo);
    cast(c, Object.assign({ t: 'swap', id: p.id, cls: p.cls, model: p.model, lo: p.lo }, m.rq === 1 && { rq: 1 }), true);   // rq: a requisition at a depot, no loss
  },
  /* another loadout on the plane the player has: over its airfield, or chosen for the next one. A refused one is the plane's own load */
  load(c, m) { const p = c.player; if (p.cls !== 'plane' && p.cls !== 'heli') return; p.lo = load(p.cls, p.model, m.lo); cast(c, { t: 'load', id: p.id, lo: p.lo }); },
  state(c, m) {
    if (c.player.cls !== 'plane' || !vec(m.p, 3) || !vec(m.q, 4) || !vec(m.v, 3) || !num(m.thr) || !num(m.hp) || !Number.isInteger(m.f) || !bits(m.d)) return;
    cast(c, { t: 'state', from: c.player.id, p: m.p, q: m.q, v: m.v, thr: m.thr, hp: m.hp, f: m.f & 31, d: m.d });
  },
  gstate(c, m) {
    if (c.player.cls === 'plane' || c.player.cls === 'inf' || !vec(m.p, 3) || !vec(m.a, 3) || !vec(m.v, 3) || !num(m.hp) || !Number.isInteger(m.f) || !bits(m.d)) return;
    cast(c, { t: 'gstate', from: c.player.id, p: m.p, a: m.a, v: m.v, hp: m.hp, f: m.f & 31, d: m.d });
  },
  /* a soldier: p position, a [heading, aim pitch], v [vx, vz], s stance (bits 0-1) and weapon in hand (bit 2), f flags (1 firing its small arm, 4 dead, 16 invulnerable) */
  mstate(c, m) {
    if (c.player.cls !== 'inf' || !vec(m.p, 3) || !vec(m.a, 2) || !vec(m.v, 2) || !num(m.hp) || !Number.isInteger(m.f) || !Number.isInteger(m.s) || m.s < 0 || m.s > 7) return;
    cast(c, { t: 'mstate', from: c.player.id, p: m.p, a: m.a, v: m.v, s: m.s, hp: m.hp, f: m.f & 31 });
  },
  /* what a soldier throws or launches unguided, from p at v: k 0 its rocket, 1 a hand grenade, 2 a smoke grenade, 3 a mortar bomb, 4 a
     mortar smoke bomb. A guided one goes as ord. shot and aishot: s 1, a howitzer's smoke round; h 1, a tank's high-explosive round (welcome says she: 1).
     cmd: the host's word on what each side's commander is at, for the players' maps: c, per side of the room (ns), [what, then x, z, kind of each mark] */
  cmd(c, m) {
    if (!host(c) || !Array.isArray(m.c) || m.c.length !== c.room.ns || !m.c.every(l => Array.isArray(l) && l.length <= 100 && l.every(num))) return;
    for (const o of c.room.values()) if (o !== c) { const s = sideOf(o); send(o.ws, { t: 'cmd', c: m.c.map((l, i) => (i === s ? l : [0])) }); }   // a side sees its own commander only
    for (const o of c.room.specs) send(o.ws, { t: 'cmd', c: m.c });   // a spectator sees both
  },
  toss(c, m) { if (c.player.cls === 'inf' && toss(m)) cast(c, { t: 'toss', from: c.player.id, k: m.k, p: m.p, v: m.v }); },
  aitoss(c, m) { if (host(c) && aid(m.id) && toss(m)) cast(c, { t: 'aitoss', id: m.id, k: m.k, p: m.p, v: m.v }); },
  shot(c, m) {
    if (!armour(c) || !vec(m.p, 3) || !vec(m.v, 3)) return;
    cast(c, Object.assign({ t: 'shot', from: c.player.id, p: m.p, v: m.v }, m.s === 1 && { s: 1 }, m.h === 1 && { h: 1 }));
  },
  ord(c, m) {
    if (!slot(m.i) || !ref(m.target)) return;
    cast(c, launch(c, m, { t: 'ord', from: c.player.id, i: m.i, target: m.target }));
  },
  /* a smoke screen where a tank or a gun fired its launchers; an interception: the missile with this id is gone, for everyone */
  smoke(c, m) { if (armour(c) && vec(m.p, 3)) cast(c, { t: 'smoke', from: c.player.id, p: m.p }); },
  mkill(c, m) { if (mid(m.id)) cast(c, m.b === 1 ? { t: 'mkill', from: c.player.id, id: m.id, b: 1 } : { t: 'mkill', from: c.player.id, id: m.id }); },   // b: shot down by gunfire, it bursts (cf-intercepta-missil)
  flare(c) { cast(c, { t: 'flare', from: c.player.id }); },
  /* what a missile's seeker did, from the client that owns it (ms: 1 in welcome): k 0 lost, 1 decoyed at p, 2 back, 3 where it is, 4 burst */
  msl(c, m) {
    if (!mid(m.id) || Math.floor(m.id / 4096) !== c.player.id || !Number.isInteger(m.k) || m.k < 0 || m.k > 4 || ((m.k === 1 || m.k > 2) && !vec(m.p, 3)) || (m.k === 3 && (!vec(m.d, 3) || !num(m.v)))) return;
    cast(c, Object.assign({ t: 'msl', id: m.id, k: m.k }, m.p && { p: m.p }, m.k === 3 && { d: m.d, v: m.v }));
  },
  hit(c, m) {
    const o = c.room.get(m.to);
    if (!o || o === c || !blow(m)) return;
    send(o.ws, Object.assign({ t: 'hit', from: c.player.id, to: m.to, dmg: m.dmg, pt: m.pt, k: m.k, by: host(c) && aid(m.by) ? m.by : null }, via(m)));
  },
  down(c, m) {
    if (!ref(m.by)) return;
    const k = c.room.get(m.by), by = aid(m.by) ? m.by : k && k !== c ? m.by : null;
    c.player.deaths++; if (k && k !== c && k.side !== c.side) k.player.kills++;   // a team kill is no one's credit
    cast(c, Object.assign({ t: 'down', id: c.player.id, by, det: m.det === 1 ? 1 : 0 }, m.left === 1 && { left: 1 }), true); scores(c);   // left: the vehicle was abandoned for another
  },
  /* the AI battle: snapshots and events come from the host only, and damage to an AI entity goes to the host only */
  ai(c, m) {
    if (!host(c) || (m.k !== 0 && m.k !== 1 && m.k !== 2) || !Array.isArray(m.e) || m.e.length > AICAP || !m.e.every(e => aiEnt(c.room, e, m.k))) return;
    cast(c, { t: 'ai', k: m.k, e: m.e });
  },
  aiord(c, m) {
    if (!host(c) || !aid(m.id) || !slot(m.i) || !ref(m.target)) return;
    cast(c, launch(c, m, { t: 'aiord', id: m.id, i: m.i, target: m.target }));
  },
  aismoke(c, m) { if (host(c) && aid(m.id) && vec(m.p, 3)) cast(c, { t: 'aismoke', id: m.id, p: m.p }); },
  aishot(c, m) {
    if (!host(c) || !aid(m.id) || !vec(m.p, 3) || !vec(m.v, 3)) return;
    cast(c, Object.assign({ t: 'aishot', id: m.id, p: m.p, v: m.v }, m.s === 1 && { s: 1 }, m.h === 1 && { h: 1 }));
  },
  aiflare(c, m) { if (host(c) && aid(m.id)) cast(c, { t: 'aiflare', id: m.id }); },
  aidown(c, m) {
    if (!host(c) || !aid(m.id) || !ref(m.by) || !(c.room.air.has(m.model) || c.room.gnd.has(m.model) || c.room.inf.has(m.model))) return;
    const k = c.room.get(m.by);
    cast(c, { t: 'aidown', id: m.id, by: m.by, model: m.model, det: m.det === 1 ? 1 : 0 }, true);
    if (k) { k.player.ai++; scores(c); }
  },
  /* the world's objects belong to the host: it alone says what stage they came to (full: 1, all of them, for someone who has just joined),
     and what anyone else's rounds did to them goes to it alone */
  obj(c, m) { if (host(c) && pairs(m.e, v => v === 0 || v === 1 || v === 2)) cast(c, Object.assign({ t: 'obj', e: m.e }, m.full === 1 && { full: 1 })); },
  /* the buildings are the host's too (bld): e [element, state, ...], f those that came down, m [aid, tenths of a storey, ...] of its soldiers
     upstairs, s [building, states as text, ...] for someone who has just joined; a guest's hits h [building, element, damage or -1, ...] and
     bursts b [x, y, z, radius, damage, ...] go to the host alone (bhit) */
  bld(c, m) {
    const int = (v, n) => Number.isInteger(v) && v >= 0 && v < n, flat = (l, n, ok) => Array.isArray(l) && l.length > 0 && l.length <= n && l.every(ok), o = { t: 'bld' };
    if (!host(c)) return;
    if (m.e !== undefined) { if (!flat(m.e, 200, (v, i) => int(v, i % 2 ? 4 : 1 << 22)) || m.e.length % 2) return; o.e = m.e; }
    if (m.f !== undefined) { if (!flat(m.f, 200, v => int(v, 65536))) return; o.f = m.f; }
    if (m.m !== undefined) { if (!flat(m.m, 200, v => int(v, 1 << 22)) || m.m.length % 2) return; o.m = m.m; }
    if (m.s !== undefined) { if (!flat(m.s, 120, (v, i) => (i % 2 ? typeof v === 'string' && v.length <= 400 && /^[A-Za-z0-9+/]*$/.test(v) : int(v, 65536))) || m.s.length % 2) return; o.s = m.s; }
    if (m.full === 1) o.full = 1;
    if (o.e || o.f || o.m || o.s) cast(c, o);
  },
  bhit(c, m) {
    const h = c.room.host, o = { t: 'bhit', from: c.player.id }, ok = (l, n, f) => Array.isArray(l) && l.length > 0 && l.length <= 200 && l.length % n === 0 && l.every(f);
    if (h === c) return;
    if (m.h !== undefined) { if (!ok(m.h, 3, (v, i) => (i % 3 === 2 ? v === -1 || (num(v) && v > 0 && v <= 1000) : Number.isInteger(v) && v >= 0 && v < (i % 3 ? 4096 : 65536)))) return; o.h = m.h; }
    if (m.b !== undefined) { if (!ok(m.b, 5, (v, i) => num(v) && Math.abs(v) < 1e5 && (i % 5 < 3 || (v > 0 && v <= (i % 5 === 3 ? 200 : 2000))))) return; o.b = m.b; }
    if (o.h || o.b) send(h.ws, o);
  },
  ohit(c, m) {
    const h = c.room.host;
    if (h !== c && pairs(m.h, v => num(v) && v > 0 && v <= 1000)) send(h.ws, { t: 'ohit', from: c.player.id, h: m.h });
  },
  /* supply bases are world objects too, with a life of their own: the host lists them all, a row each, [id, side, x, z, heading, percent
     built, hp, stage] and with lg the crates in it (0-999); a soldier's request to start one goes to the host alone, once a second at most */
  base(c, m) {
    if (host(c) && Array.isArray(m.e) && m.e.length <= 16 && m.e.every(e => (vec(e, 8) || (vec(e, 9) && Number.isInteger(e[8]) && e[8] >= 0 && e[8] <= 999)) && Number.isInteger(e[0]) && e[0] >= 0 && e[0] < 65536 && ts(c.room, e[1]) && e[5] >= 0 && e[5] <= 100 && (e[7] === 0 || e[7] === 1 || e[7] === 2))) cast(c, { t: 'base', e: m.e });
  },
  build(c, m) {
    const h = c.room.host, now = Date.now();
    if (h === c || c.player.cls !== 'inf' || !vec(m.p, 2) || !num(m.a) || now - (c.bt || 0) < 1000) return;
    c.bt = now; send(h.ws, { t: 'build', from: c.player.id, p: m.p, a: m.a });
  },
  /* trenches and sandbags built during the match are the host's too: its list comes in parts i of n, a row each, [id, kind (1 trench,
     2 sandbags, and with sap: 1 the posts, 3 anti-tank, 4 machine gun, 5 sniper tower, 6 anti-rocket dome), side, x, z, facing, percent
     built, hp, stage]; a soldier's request for one goes to the host alone, 700 ms apart at least */
  fort(c, m) {
    if (host(c) && Number.isInteger(m.i) && Number.isInteger(m.n) && m.i >= 0 && m.i < m.n && m.n <= 8 && Array.isArray(m.e) && m.e.length <= 40 && m.e.every(e => vec(e, 9) && Number.isInteger(e[0]) && e[0] >= 0 && e[0] < 65536 && Number.isInteger(e[1]) && e[1] >= 1 && e[1] <= FKINDS && ts(c.room, e[2]) && e[6] >= 0 && e[6] <= 100 && (e[8] === 0 || e[8] === 1 || e[8] === 2))) cast(c, { t: 'fort', i: m.i, n: m.n, e: m.e });
  },
  fbuild(c, m) {
    const h = c.room.host, now = Date.now();
    if (h === c || c.player.cls !== 'inf' || !(Number.isInteger(m.k) && m.k >= 1 && m.k <= FKINDS) || !vec(m.p, 2) || !num(m.a) || now - (c.ft || 0) < 700) return;
    c.ft = now; send(h.ws, { t: 'fbuild', from: c.player.id, k: m.k, p: m.p, a: m.a });
  },
  /* transport. board: a soldier asks the owner of vehicle v for a seat (s 0) or says it is out (s -1): the player whose vehicle it is, or
     the host for an AI entity's. seats: who is aboard, a row a vehicle, [vehicle, boxed AI soldiers or -1, then a player or 0 per seat]:
     a transport's player speaks for its own, the host for the AI's and for the boxed squads of all. eject: the owner of a lost vehicle
     tells one aboard what it took getting out and who did it. cargo: a guest at the wheel asks the host to call squads (1) or let them off (0) */
  board(c, m) {
    const o = aid(m.v) ? c.room.host : c.room.get(m.v);
    if (c.player.cls !== 'inf' || !o || o === c || (pid(m.v) && o.player.cls !== 'trn') || (m.s !== 0 && m.s !== -1)) return;
    send(o.ws, { t: 'board', from: c.player.id, v: m.v, s: m.s });
  },
  seats(c, m) {
    const row = e => Array.isArray(e) && e.length >= 2 && e.length <= 16 && (e[0] === c.player.id ? c.player.cls === 'trn' : host(c) && (aid(e[0]) || pid(e[0]))) && Number.isInteger(e[1]) && e[1] >= -1 && e[1] <= 16 && e.slice(2).every(v => v === 0 || pid(v));
    if (Array.isArray(m.e) && m.e.length <= 32 && m.e.every(row)) cast(c, { t: 'seats', from: c.player.id, e: m.e });
  },
  eject(c, m) {
    const o = c.room.get(m.to);
    if (!o || o === c || o.player.cls !== 'inf' || !(c.player.cls === 'trn' || host(c)) || !num(m.dmg) || m.dmg < 0 || m.dmg > 1000 || !ref(m.by)) return;
    send(o.ws, { t: 'eject', from: c.player.id, to: m.to, dmg: m.dmg, by: m.by });
  },
  cargo(c, m) {
    const h = c.room.host;
    if (h !== c && c.player.cls === 'trn' && (m.k === 0 || m.k === 1)) send(h.ws, { t: 'cargo', from: c.player.id, k: m.k });
  },
  aihit(c, m) {
    const h = c.room.host;
    if (h === c || !aid(m.to) || !blow(m)) return;
    send(h.ws, Object.assign({ t: 'aihit', from: c.player.id, to: m.to, dmg: m.dmg, pt: m.pt, k: m.k }, via(m)));
  }
};
/* a flown helicopter: the plane's state plus c the collective and a the gun's [yaw, pitch]; flags as state, and 32 squad aboard, 64 landed.
   lift: a guest's transport asks the host to let a squad in (k 1, sq its number) or out (k 0, n the kits, p where, h toward); the host's
   answer to the first, the kits taken aboard, goes to that guest alone */
RX.gstate = (old => (c, m) => { if (c.player.cls !== 'heli') old(c, m); })(RX.gstate);
RX.hstate = (c, m) => {
  if (c.player.cls !== 'heli' || !vec(m.p, 3) || !vec(m.q, 4) || !vec(m.v, 3) || !vec(m.a, 2) || !num(m.c) || !num(m.hp) || !Number.isInteger(m.f) || !bits(m.d)) return;
  cast(c, { t: 'hstate', from: c.player.id, p: m.p, q: m.q, v: m.v, c: m.c, a: m.a, hp: m.hp, f: m.f & 127, d: m.d });
};
RX.lift = (c, m) => {
  /* kits: the soldiers aboard, each its index in its side's list of kits (the page's INF[era][side]), which is never longer than the era's kits
     (room.inf). They were checked against 8, from when a side had 8 kits: since the medics, the engineers and the drones a squad with its medic
     (index 9) was refused, after the host had already taken it off the field, and the guest's helicopter flew empty (cf-pol-fluxos) */
  const h = c.room.host, o = c.room.get(m.to), kits = v => Array.isArray(v) && v.length > 0 && v.length <= 8 && v.every(k => Number.isInteger(k) && k >= 0 && k < c.room.inf.size);
  if (h === c) { if (o && o !== c && o.player.cls === 'heli' && m.k === 1 && kits(m.n)) send(o.ws, { t: 'lift', k: 1, n: m.n }); return; }
  if (c.player.cls !== 'heli') return;
  if (m.k === 1 && Number.isInteger(m.sq) && m.sq > 0 && m.sq < 32) send(h.ws, { t: 'lift', from: c.player.id, k: 1, sq: m.sq });
  else if (m.k === 0 && kits(m.n) && vec(m.p, 2) && num(m.h)) send(h.ws, { t: 'lift', from: c.player.id, k: 0, n: m.n, p: m.p, h: m.h });
};

/* crew: a player is a soldier who may sit at the wheel or the gun of a transport, and the record follows the body. welcome says crew: 1.
   crew: the sender is now cls, model, inf or trn of its own side, with no loss counted. To inf it may bring st, the vehicle it left
   (place, hull and turret, hp, part states, rounds of two arms, smoke, material) and x, 1 or 2, when that vehicle was lost, with by, who destroyed it (a vehicle its crew got out of counts as an AI
   kill, and the soldier's death, if it comes, is a down like any other); to trn, v,
   the AI entity it took. drive: a soldier asks the host for seat s of the parked AI vehicle v. grant: the host's yes, to that soldier alone */
/* conquest: the match is the host's. cq: n the match number, ph 0 play 1 over, T s left, k and k0 the tickets, len the preset, p four
   numbers a point (side or -1, progress in hundredths, the weights in tenths), l the losses, r [winner or -1, why] and w s to the next
   match once it is over. A new n is a new match: the room's scores start again. welcome says cq: 1 and cqn, the match the room is in.
   cq v 2 (N sides, the room's ns; the plan's section 4.3): p is 3 + N numbers a point [owner or -1, progress 0-100 in hundredths, the side
   taking it or -1, then the N weights in tenths], k the N sides' tickets, l 3 N losses, r [winner or -1, why, placing: N integers, sides
   from first to last] (the placing may be left out). Without v the message is the old one of 2 sides, 4 numbers a point
   req: a soldier asks the host for a vehicle at the depot it stands in; reqa: the host's answer to it alone, why '' for yes */
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
/* friendly fire is the room's rule, the host's to set (ff 0 or 1); welcome says what it is, and a room without a host that said so has none */
RX.ff = (c, m) => { if (!host(c) || (m.v !== 0 && m.v !== 1)) return; c.room.ff = m.v; cast(c, { t: 'ff', v: m.v }); };
const cqv2 = (N, p) => { for (let i = 0; i < p.length; i += 3 + N) if (!int(p[i], -1, N - 1) || !int(p[i + 1], 0, 100) || !int(p[i + 2], -1, N - 1)) return false; return true; };
const cqr = (N, r) => Array.isArray(r) && (r.length === 2 || (r.length === 3 && vec(r[2], N) && r[2].every(v => int(v, -1, N)))) && int(r[0], -1, N - 1) && int(r[1], 0, 9);
RX.cq = (c, m) => {
  const room = c.room, v2 = m.v === 2, N = v2 ? room.ns : 2, st = v2 ? 3 + N : 4;
  if (!host(c) || (m.v !== undefined && !v2) || !int(m.n, 0, 1e6) || (m.ph !== 0 && m.ph !== 1) || !num(m.T) || !vec(m.k, N) || !num(m.k0) || !int(m.len, 0, 2) || !Array.isArray(m.p) || m.p.length > 24 * st || m.p.length % st || !m.p.every(v => int(v, -1000, 1000)) || (v2 && !cqv2(N, m.p)) || !vec(m.l, 3 * N)) return;
  const o = Object.assign({ t: 'cq' }, v2 && { v: 2 }, { n: m.n, ph: m.ph, T: m.T, k: m.k, k0: m.k0, len: m.len, p: m.p, l: m.l });
  if (Array.isArray(m.sk) && m.sk.length === m.p.length / st && m.sk.every(v => int(v, -1, 999))) o.sk = m.sk;   // logistics (lg): the crates of each point, -1 none
  if (m.ph === 1 && (v2 ? cqr(N, m.r) : vec(m.r, 2) && int(m.r[0], -1, 1) && int(m.r[1], 0, 3))) { o.r = m.r; o.w = num(m.w) ? m.w : 0; }
  if (m.n !== (room.cqn || 0)) { room.cqn = m.n; room.keep = room.mines = null; room.snap = snapNew(); for (const q of room.values()) q.player.kills = q.player.deaths = q.player.ai = 0; scores(c); }
  cast(c, o);
};
RX.req = (c, m) => {
  const h = c.room.host, era = c.room.models, p = c.player, now = Date.now();
  if (h === c || p.cls !== 'inf' || !model(era, m.cls, m.model) || m.cls === 'inf' || side(c.room, m.model) !== c.side || now - (c.rt || 0) < 500) return;
  c.rt = now; send(h.ws, { t: 'req', from: p.id, cls: m.cls, model: m.model });
};
RX.reqa = (c, m) => {
  const o = c.room.get(m.to);
  if (host(c) && o && o !== c && model(c.room.models, m.cls, m.model) && typeof m.why === 'string' && m.why.length <= 12) send(o.ws, { t: 'reqa', cls: m.cls, model: m.model, why: m.why });
};
/* radios, places where infantry enters: rad, the host's list, a row each [id, kind 0 operator 1 set down 2 vehicle, side, x, z, entries
   left, why not]; rsp: a guest entered by radio id, to the host; rbe: a guest's operator set its radio down or took it up (k 1), or its
   radio vehicle raised or lowered the mast (k 2), to the host */
RX.rad = (c, m) => { if (host(c) && Array.isArray(m.e) && m.e.length <= 24 && m.e.every(e => vec(e, 7) && int(e[0], 1, 1e6) && int(e[1], 0, 2) && ts(c.room, e[2]) && int(e[5], -1, 99) && int(e[6], 0, 5))) cast(c, { t: 'rad', e: m.e }); };
RX.rsp = (c, m) => { const h = c.room.host; if (h !== c && c.player.cls === 'inf' && int(m.id, 1, 1e6)) send(h.ws, { t: 'rsp', from: c.player.id, id: m.id }); };
/* logistics (welcome lg: 1). lsp: a guest's entry, rearm or return took n crates (k 0 a supply base, 1 a point by index) or gave them back
   (k 2, 3), to the host; lgx: a guest at the wheel of a truck or in a transport helicopter loads by its main base (k 0) or unloads into a
   node (k 1), to the host, whose answer (to, n the crates now aboard) goes to that guest alone; 300 ms apart at least */
RX.lsp = (c, m) => {
  const h = c.room.host, now = Date.now();
  if (h === c || !int(m.k, 0, 3) || !int(m.id, 0, 65535) || !int(m.n, 1, 20) || now - (c.lt || 0) < 300) return;
  c.lt = now; send(h.ws, { t: 'lsp', from: c.player.id, k: m.k, id: m.id, n: m.n });
};
RX.lgx = (c, m) => {
  const h = c.room.host, now = Date.now();
  if (h === c) { const o = c.room.get(m.to); if (o && o !== c && int(m.k, 0, 1) && int(m.n, 0, 999)) send(o.ws, { t: 'lgx', k: m.k, n: m.n }); return; }
  if ((c.player.cls !== 'trn' && c.player.cls !== 'heli') || !int(m.k, 0, 1) || now - (c.lx || 0) < 300) return;
  c.lx = now; send(h.ws, { t: 'lgx', from: c.player.id, k: m.k });
};
RX.rbe = (c, m) => { const h = c.room.host, k = c.player.cls; if (h !== c && ((m.k === 1 && k === 'inf') || (m.k === 2 && k === 'trn')) && (m.on === 0 || m.on === 1)) send(h.ws, { t: 'rbe', from: c.player.id, k: m.k, on: m.on }); };
const two = cls => cls === 'inf' || cls === 'trn', vst = v => vec(v, 12) && bits(v[7]);
/* capture (welcome says cap: 1): crew to trn with cap 1 names a transport of another side, taken from it; the record carries cap while
   the player sits in one, and cs, the side that took it, which is still the player's own (c.side; with 3 sides the model's side no longer says it) */
RX.crew = (c, m) => {
  const era = c.room.models, p = c.player, cap = m.cls === 'trn' && m.cap === 1 ? 1 : 0, ms = side(c.room, m.model);
  if (!two(p.cls) || !two(m.cls) || !model(era, m.cls, m.model) || !ts(c.room, ms) || (cap ? ms === c.side : ms !== c.side)) return;
  const o = { t: 'crew', id: p.id, cls: m.cls, model: m.model };
  if (cap) o.cap = 1, o.cs = c.side;
  p.cap = cap; if (cap) p.cs = c.side; else delete p.cs;
  const k = c.room.get(m.by), lost = m.cls === 'inf' && vst(m.st) && (m.x === 1 || m.x === 2);
  if (m.cls === 'inf' && vst(m.st)) o.st = m.st;
  if (lost) { o.x = m.x; o.by = aid(m.by) ? m.by : k && k !== c ? m.by : null; }
  if (m.cls === 'trn' && aid(m.v)) o.v = m.v;
  p.cls = m.cls; p.model = m.model; p.lo = null;
  cast(c, o);
  if (lost && k && k !== c) { k.player.ai++; scores(c); }
};
RX.drive = (c, m) => {
  const h = c.room.host;
  if (h !== c && c.player.cls === 'inf' && aid(m.v) && (m.s === 0 || m.s === 1)) send(h.ws, { t: 'drive', from: c.player.id, v: m.v, s: m.s });
};
RX.grant = (c, m) => {
  const o = c.room.get(m.to);
  if (!host(c) || !o || o === c || o.player.cls !== 'inf' || !aid(m.v) || (m.s !== 0 && m.s !== 1) || !vst(m.st) || !Array.isArray(m.o) || m.o.length > 16 || !m.o.every(v => v === 0 || pid(v))) return;
  send(o.ws, { t: 'grant', v: m.v, s: m.s, st: m.st, o: m.o });
};

/* drones: the operator kits, and three messages. welcome says dr: 1.
   dstate: a player's drone, i its slot (0 the quadcopter, 1 the long-range one), k its type, p q v as a plane's state, f flags (1 armed,
   2 gone, 4 shot down or crashed, 8 detonated). dai: the host's AI drones, a row each, [id, type, side, then p q v f]. dhit: damage to a
   drone goes to its owner alone, a player (to, i) or the host (to negative) */
{
  const m = MODELS.modern.inf, kits = ['blueDrone', 'redDrone'];
  if (m.includes(kits[0])) throw new Error('drone kits already there');
  m.splice(m.length / 2, 0, kits[0]); m.push(kits[1]); for (const k of kits) rooms.modern.inf.add(k);
  const dk = v => Number.isInteger(v) && v >= 0 && v < 8, sl = v => v === 0 || v === 1;
  const ops = kits.concat('insDrone');   // the Insurgents' operator too (its kit is added with their models, below)
  RX.dstate = (c, m) => {
    if (c.player.cls !== 'inf' || !ops.includes(c.player.model) || !sl(m.i) || !dk(m.k) || !vec(m.p, 3) || !vec(m.q, 4) || !vec(m.v, 3) || !Number.isInteger(m.f)) return;
    cast(c, { t: 'dstate', from: c.player.id, i: m.i, k: m.k, p: m.p, q: m.q, v: m.v, f: m.f & 15 });
  };
  RX.dai = (c, m) => { if (host(c) && Array.isArray(m.e) && m.e.length <= 16 && m.e.every(e => vec(e, 14) && aid(e[0]) && dk(e[1]) && ts(c.room, e[2]))) cast(c, { t: 'dai', e: m.e }); };
  RX.dhit = (c, m) => {
    if (!num(m.dmg) || m.dmg <= 0 || m.dmg > 1000) return;
    if (aid(m.to)) { const h = c.room.host; if (h !== c) send(h.ws, { t: 'dhit', from: c.player.id, to: m.to, dmg: m.dmg }); return; }
    const o = c.room.get(m.to);
    if (o && o !== c && sl(m.i)) send(o.ws, { t: 'dhit', from: c.player.id, to: m.to, i: m.i, dmg: m.dmg });
  };
}
/* civilians in the towns (welcome says civ: 1). civ: the host's word on them, to the room: k 0 rows of [id, x, z, heading, flags, colour], k 1 the militia as
   triples [aid, colour, owner], k 2 the laws of war as [side (-1 none), civilians it killed, town (-1 none), the sides that town turned against (bits),
   the tickets those deaths cost it].
   civhit and civrec go to the host alone: a guest's own hits on civilians, pairs of id and damage, and a request to recruit one */
{
  const row = e => vec(e, 6) && Number.isInteger(e[0]) && e[0] >= 0 && e[0] < 65536 && Number.isInteger(e[4]) && e[4] >= 0 && e[4] < 32 && Number.isInteger(e[5]) && e[5] >= 0 && e[5] < 32;
  RX.civ = (c, m) => {
    if (!host(c) || !Array.isArray(m.e)) return;
    if (m.k === 0 && m.e.length <= 40 && m.e.every(row)) cast(c, { t: 'civ', k: 0, e: m.e });
    else if (m.k === 1 && m.e.length <= 90 && m.e.length % 3 === 0 && m.e.every((v, i) => (i % 3 ? Number.isInteger(v) && v >= 0 && v < 1e6 : aid(v)))) cast(c, { t: 'civ', k: 1, e: m.e });
    else if (m.k === 2 && vec(m.e, 5) && m.e.every(Number.isInteger) && m.e[0] >= -1 && m.e[0] < c.room.ns && m.e[1] >= 0 && m.e[1] < 1000 && m.e[2] >= -1 && m.e[2] < 1000 && m.e[3] >= 0 && m.e[3] <= ALL(c.room) && m.e[4] >= 0 && m.e[4] < 100000) cast(c, { t: 'civ', k: 2, e: m.e });
  };
  RX.civhit = (c, m) => {
    const h = c.room.host;
    if (h && h !== c && Array.isArray(m.h) && m.h.length > 0 && m.h.length <= 40 && m.h.length % 2 === 0 && m.h.every((v, i) => (i % 2 ? num(v) && v > 0 && v <= 200 : Number.isInteger(v) && v >= 0 && v < 65536))) send(h.ws, { t: 'civhit', from: c.player.id, h: m.h });
  };
  /* amb: what the host's evacuation did with a guest's ambulance (k 1 handed over, 0 taken aboard; n of them, c aboard now), to that guest alone */
  RX.amb = (c, m) => { const o = c.room.get(m.to); if (host(c) && o && o !== c && (m.k === 0 || m.k === 1) && Number.isInteger(m.n) && m.n > 0 && m.n <= 64 && Number.isInteger(m.c) && m.c >= 0 && m.c <= 64) send(o.ws, { t: 'amb', k: m.k, n: m.n, c: m.c }); };
  RX.civrec = (c, m) => { const h = c.room.host; if (h && h !== c && c.player.cls === 'inf' && Number.isInteger(m.id) && m.id >= 0 && m.id < 65536) send(h.ws, { t: 'civrec', from: c.player.id, id: m.id }); };
}
/* the economy and the general (welcome eco: 1, gen: 1). A side's private word (ecs, gen, glog) goes to that side's players and its MCP
   bridge only; eco rows (the sites, world objects) to everyone like base; keep, the host's sealed backup, to the server alone, which hands
   it to the next host. The server says who commands a side (gclaim, gctl: first to claim, free again when it leaves); gcmd from that
   general and gask from anyone of the side go to the host, its gres to the asker alone */
/* spectators (welcome spec: 1 to the spectator): SPEC=0 off, SPEC=1 on and live (the default). A spectator's every message is dropped. */
const SPEC = process.env.SPEC === undefined ? 1 : Math.max(0, +process.env.SPEC || 0), SPECMAX = 8, sendSpec = (o, m) => send(o.ws, m);
const GENKEY = process.env.GENKEY || '', GENRX = new Set(['gclaim', 'gcmd', 'gask']);
const BIG = { ai: MAXAI, gen: 8192, glog: MAXAI, keep: MAXAI, gres: MAXAI, ana: MAXAI };
const sideOf = o => (o.spec ? -1 : o.gen ? o.player.side : o.side);
const ints = (l, n, k) => Array.isArray(l) && l.length <= n && l.length % k === 0 && l.every(v => Number.isInteger(v) && Math.abs(v) < 1e6);
const txt = (v, n) => typeof v === 'string' && v.length <= n, rec = v => v === null || (typeof v === 'object' && !Array.isArray(v)), lst = (v, n) => Array.isArray(v) && v.length <= n;
const members = room => [...room.values(), ...room.gens, ...room.specs];
const castSide = (c, m, s, to) => { snapIn(c, m); for (const o of members(c.room)) if (o !== c && (sideOf(o) === s || o.spec) && (!to || o.player.id === to)) send(o.ws, m); };   // a spectator is sent both sides
const gctl = room => { for (const o of members(room)) send(o.ws, { t: 'gctl', g: gview(room, o, room.gen), k: gview(room, o, room.genk) }); };
const genFree = (room, c) => { let ch = false; for (let s = 0; s < room.gen.length; s++) if (room.gen[s] === c.player.id) { room.gen[s] = room.genk[s] = 0; ch = true; } if (ch) gctl(room); };
RX.eco = (c, m) => {
  const row = e => Array.isArray(e) && (e.length === 9 || (e.length === 10 && int(e[9], 0, 255))) && e.every(num) && int(e[0], 0, 65535) && ts(c.room, e[1]) && int(e[2], 0, 7) && e[6] >= 0 && e[6] <= 100 && int(e[8], 0, 2);
  if (host(c) && lst(m.e, 48) && m.e.every(row)) { const o = { t: 'eco', e: m.e }; cast(c, o); for (const g of c.room.gens) send(g.ws, o); }   // the bridges too: the sites are everyone's
};
RX.ecs = (c, m) => {
  if (!host(c) || !ts(c.room, m.s) || !num(m.T) || !vec(m.v, 8) || !int(m.c, 0, 2) || !ints(m.q, 60, 5) || ![m.r, m.kp, m.ms, m.ls].every(l => ints(l, 40, 2)) || !ints(m.sl, 40, 4)
    || !ints(m.kn, 144, 6) || !ints(m.gd, 72, 3) || !(Array.isArray(m.sc) && (m.sc.length === 0 || vec(m.sc, 3))) || !int(m.tg, 0, 1e6)) return;
  const pl = ints(m.pp, 60, 3) && vec(m.po, 8);   // the production plan (F2), optional: [kind, field, out] each and [posture, budget, out, scale %]
  const wk = ints(m.wk, 9, 1) && m.wk.length === 9;   // the works (BMR), optional: [en, mt spent the last minute, crates, en, mt spent in all, supply bases, their cap, field works, their cap]
  castSide(c, Object.assign({ t: 'ecs', s: m.s, T: m.T, v: m.v, c: m.c, q: m.q, r: m.r, kp: m.kp, ms: m.ms, ls: m.ls, sl: m.sl, kn: m.kn, gd: m.gd, sc: m.sc, tg: m.tg }, pl && { pp: m.pp, po: m.po }, wk && { wk: m.wk }), m.s);
};
/* the commander's view of side s: top-level fields checked, their insides are the host's (it is trusted with the whole battle) */
RX.gen = (c, m) => {
  const v = m.v;
  if (!host(c) || !ts(c.room, m.s) || !num(m.T) || !v || !rec(v) || !ints(m.q, 192, 6)) return;
  const o = { doc: txt(v.doc, 24) ? v.doc : '', post: rec(v.post) && v.post && txt(v.post.k, 40) && txt(v.post.s, 240) ? { k: v.post.k, s: v.post.s } : null,
    road: lst(v.road, 8) ? v.road : null, ops: lst(v.ops, 16) ? v.ops : [], fm: lst(v.fm, 40) ? v.fm : [], sc: lst(v.sc, 8) ? v.sc : [],
    hit: rec(v.hit) ? v.hit : null, focus: rec(v.focus) ? v.focus : null, thr: rec(v.thr) ? v.thr : null, want: rec(v.want) ? v.want : null,
    gate: txt(v.gate, 8) ? v.gate : '', atkT: num(v.atkT) ? v.atkT : 0, ev: lst(v.ev, 8) ? v.ev : [], evT: num(v.evT) ? v.evT : -1,
    fb: lst(v.fb, 8) ? v.fb : null, res: rec(v.res) ? v.res : null, mev: lst(v.mev, 9) ? v.mev : [], gue: rec(v.gue) ? v.gue : null, kz: rec(v.kz) || lst(v.kz, 96) ? v.kz : null,
    cn: rec(v.cn) && v.cn !== null ? v.cn : null,   // the command network as the side's general sees it (nodes, jammers, the HQ, squads without a link)
    thb: lst(v.thb, 6) ? v.thb : [], camp: lst(v.camp, 4) ? v.camp : [],   // the threat board's first rows and the campaigns (F4)
    per: rec(v.per) ? v.per : null, dif: rec(v.dif) ? v.dif : null, hab: lst(v.hab, 4) ? v.hab : [] };   // the AI general's personality, difficulty and the enemy's habits it knows (W17)
  castSide(c, { t: 'gen', s: m.s, T: m.T, v: o, q: m.q }, m.s);
};
RX.glog = (c, m) => {
  const opt = v => v === null || num(v), row = r => Array.isArray(r) && r.length === 7 && num(r[0]) && typeof r[1] === 'string' && /^[a-z]{1,6}$/.test(r[1]) && txt(r[2], 240) && r.slice(3).every(opt);
  if (!host(c) || !ts(c.room, m.s) || !num(m.T) || !lst(m.e, 80) || !m.e.every(row) || (m.to !== undefined && !pid(m.to))) return;
  castSide(c, Object.assign({ t: 'glog', s: m.s, T: m.T, e: m.e }, m.full === 1 && { full: 1 }), m.s, m.to);
};
/* the tunnels (cf-trincheiras-tuneis, NOT TESTED): the host tells each side s its own tunnels and the enemy mouths it found, a row each,
   [id, side, ax, az, bx, bz, percent dug, found (1 mouth a, 2 mouth b, 3 its own), state (0 open, 1 fallen)]; only that side's players get it */
RX.tun = (c, m) => {
  const row = e => vec(e, 9) && Number.isInteger(e[0]) && e[0] >= 0 && e[0] < 1e6 && ts(c.room, e[1]) && [2, 3, 4, 5].every(i => Math.abs(e[i]) < 1e5) && e[6] >= 0 && e[6] <= 100 && Number.isInteger(e[7]) && e[7] >= 0 && e[7] <= 3 && (e[8] === 0 || e[8] === 1);
  if (!host(c) || !ts(c.room, m.s) || !lst(m.e, 64) || !m.e.every(row)) return;
  castSide(c, { t: 'tun', s: m.s, e: m.e }, m.s);
};
RX.keep = (c, m) => { if (host(c) && m.e && rec(m.e)) c.room.keep = m.e; };
RX.gclaim = (c, m) => {
  const room = c.room, s = sideOf(c), id = c.player.id, held = room.gen[s], now = Date.now();
  if ((m.on !== 0 && m.on !== 1) || now - (c.gl || 0) < 1000) return;
  c.gl = now;
  if (m.on && (!held || !members(room).some(o => o.player.id === held))) { room.gen[s] = id; room.genk[s] = c.gen ? 2 : 1; }
  else if (!m.on && held === id) room.gen[s] = room.genk[s] = 0;
  else return send(c.ws, { t: 'gctl', g: gview(room, c, room.gen), k: gview(room, c, room.genk) });   // refused: the sender is told who holds it
  gctl(room);
};
const GK = { k: 'w', k2: 'w', x: 'n', z: 'n', a: 'n', n: 'i', id: 'i', p: 'i', inf: 'i', aa: 'i', ri: 'i', op: 'i', why: 's',
  ids: 'L', j: 'i', pi: 'i', sd: 'i', smk: 'i', home: 'i', s: 'n', fx: 'n', fz: 'n', x2: 'n', z2: 'n', H: 'n', r: 'n',
  mk: 'w', lat: 'i', roe: 'w', brk: 'n',   // the General's production (F2): a mission's kind, latitude, rules of engagement and break-off (disp, mis)
  nd: 'w',   // logistics (F2b): a supply node's key, b<base id> or p<point index> (conv, alift, sprio)
  rt: 'P',   // abstract orders (W21): a route, flat x z pairs (welcome rte: 1)
  role: 'w', qrf: 'i',
  ap: 'i', ap2: 'i', f: 'w', e: 'i' };   // M7 (welcome man2: 1): the new manoeuvres' approaches (ap, ap2 of gask ap), the ambush's or guard's form (f: lin, l, post, mine), a road edge (e). Above: campaigns and the threat board (F4): an operation's role in a campaign (camp), a place's policy for the quick reaction force (dpol)
function gcmdOf(c) {
  if (!c || !rec(c) || typeof c.c !== 'string' || !/^[a-z]{2,8}$/.test(c.c) || c.c === 'draw') return null;
  const o = { c: c.c };
  for (const k of Object.keys(c)) {
    if (k === 'c') continue;
    const t = GK[k], v = c[k];
    if (!Object.hasOwn(GK, k) || !(t === 'P' ? Array.isArray(v) && v.length >= 2 && v.length <= 16 && v.length % 2 === 0 && v.every(e => num(e) && Math.abs(e) < 1e5) : t === 'L' ? Array.isArray(v) && v.length <= 24 && v.every(e => Number.isInteger(e) && Math.abs(e) < 1e6) : t === 'w' ? typeof v === 'string' && /^[a-z0-9]{1,10}$/.test(v) : t === 'n' ? num(v) && Math.abs(v) < 1e5 : t === 'i' ? Number.isInteger(v) && Math.abs(v) < 1e6 : txt(v, 120))) return null;
    o[k] = t === 'L' || t === 'P' ? v.slice() : t === 's' ? v.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 80) : v;
  }
  return o;
}
RX.gcmd = (c, m) => {
  const room = c.room, s = sideOf(c), h = room.host, n = int(m.n, 0, 1e9) ? m.n : 0, now = Date.now(), no = why => send(c.ws, { t: 'gres', n, ok: false, why, id: 0 });
  if (room.gen[s] !== c.player.id) return no('ctl');
  if (now - (c.gt || 0) < 250) return no('rate');
  c.gt = now;
  const o = (m.d === 'eco' || m.d === 'cmd') && gcmdOf(m.c);
  if (!o) return no('shape');
  if (!h) return no('host');
  if (h !== c) send(h.ws, { t: 'gcmd', from: c.player.id, s, g: c.gen ? 1 : 0, d: m.d, c: o, n });   // the host applies its own player's commands itself
};
/* the questions a side may ask its host (gask): the last four are the general's tools for everyone (W13, welcome gq: 1): missions, unit { id } (a squad's card),
   lots (the seat town's), mines. A question passes on k (a word), x, z, a (numbers) and id (an integer) */
const GASK = ['spots', 'why', 'view', 'state', 'pool', 'amb', 'fire', 'report', 'plan', 'logi', 'rec', 'brg', 'threats', 'missions', 'unit', 'lots', 'mines', 'tmap', 'ap', 'stk', 'dfp', 'emb', 'mundo'];   // stk: the side's strategic strikes (the bombers, cf-bombardeiro); dfp: the side's defence plans (cf-defesa-posicoes); emb: the side's infantry rides (cf-infantaria-veiculos); mundo: the General 2's model of the world, the side's (cf-g2-g1-mundo)
RX.gask = (c, m) => {
  const h = c.room.host, q = m.q, n = int(m.n, 0, 1e9) ? m.n : 0, now = Date.now();
  if (!q || !rec(q) || !GASK.includes(q.q) || now - (c.ga || 0) < 1000) return send(c.ws, { t: 'gres', n, ok: false, why: 'shape', id: 0 });
  c.ga = now;
  const o = { q: q.q }; if (typeof q.k === 'string' && /^[a-z0-9]{1,10}$/.test(q.k)) o.k = q.k; for (const k of ['x', 'z', 'a']) if (num(q[k]) && Math.abs(q[k]) < 1e5) o[k] = q[k];
  if (Number.isInteger(q.id) && Math.abs(q.id) < 1e6) o.id = q.id;
  if (!h) return send(c.ws, { t: 'gres', n, ok: false, why: 'host', id: 0 });
  if (h !== c) send(h.ws, { t: 'gask', from: c.player.id, s: sideOf(c), q: o, n });
};
RX.gres = (c, m) => {
  const o = host(c) && pid(m.to) && members(c.room).find(o => o.player.id === m.to);
  if (o && o !== c && int(m.n, 0, 1e9) && typeof m.ok === 'boolean' && txt(m.why, 12) && Number.isInteger(m.id)) send(o.ws, Object.assign({ t: 'gres', n: m.n, ok: m.ok, why: m.why, id: m.id }, m.r !== undefined && (rec(m.r) || Array.isArray(m.r)) && { r: m.r }));
};
/* sappers (welcome says sap: 1): the sapper kits, and three messages. mine: the host's list of the mines, in parts i of n of list q, a row
   each, [id, kind (0 AT, 1 AP, 2 a command IED: cf-slots-arma), side, x, z, known (bit s: side s knows it, as many bits as the room has sides)]; each player is passed only the rows of its side's mines and of
   those its side knows, a spectator all of them. The server keeps the host's last whole list, and s its last mine id, and hands them to
   the next host alone, before it is named, so that no side's hidden mines are lost with the old host. mboom: the host says mine id (kind k, side s) went off at p, to the room. mreq: a soldier
   to the host, k 0 or 1 lay one at p, 2 lift id, 3 its own body or vehicle set id off, 4 lay a command IED at p, 5 its phone sets off
   its command IEDs, 6 its suicide vest goes off (cf-slots-arma); 300 ms apart at least. dint: the host says its
   anti-rocket dome f engaged the round of key k (drawn from its launch numbers) and stopped it (s 1) or not, to the room */
{
  const kits = { ww2: ['pionier', 'engineer'], modern: ['blueEng', 'redEng'] };
  for (const era in kits) {
    const m = MODELS[era].inf, k = kits[era];
    if (m.includes(k[0])) throw new Error('sapper kits already there');
    m.splice(m.length / 2, 0, k[0]); m.push(k[1]); for (const id of k) rooms[era].inf.add(id);
  }
  const row = room => e => vec(e, 6) && Number.isInteger(e[0]) && e[0] > 0 && e[0] < 65536 && (e[1] === 0 || e[1] === 1 || e[1] === 2) && ts(room, e[2]) && Number.isInteger(e[5]) && e[5] >= 0 && e[5] <= ALL(room);
  RX.mine = (c, m) => {
    if (!host(c) || !Number.isInteger(m.q) || m.q < 0 || m.q >= 1e6 || !Number.isInteger(m.i) || !Number.isInteger(m.n) || m.i < 0 || m.i >= m.n || m.n > 4 || !Array.isArray(m.e) || m.e.length > 40 || !m.e.every(row(c.room))) return;
    const r = c.room, b = m.i && r.mbuf && r.mbuf.q === m.q ? r.mbuf : (r.mbuf = { q: m.q, n: m.n, s: 0, e: [] });
    b.e.push(...m.e); if (Number.isInteger(m.s) && m.s >= 0 && m.s < 65536) b.s = m.s;
    if (m.i === m.n - 1) { r.mines = b; r.mbuf = null; }
    for (const o of members(c.room)) {
      if (o === c) continue;
      const s = sideOf(o), e = o.spec ? m.e : m.e.filter(r => r[2] === s || (s >= 0 && r[5] >> s & 1));
      send(o.ws, { t: 'mine', q: m.q, i: m.i, n: m.n, e });
    }
  };
  RX.dint = (c, m) => { if (host(c) && Number.isInteger(m.f) && m.f >= 0 && m.f < 65536 && Number.isInteger(m.k) && m.k >= 0 && m.k < 4294967296 && (m.s === 0 || m.s === 1)) cast(c, { t: 'dint', f: m.f, k: m.k, s: m.s }); };
  RX.mboom = (c, m) => { if (host(c) && Number.isInteger(m.id) && m.id > 0 && m.id < 65536 && (m.k === 0 || m.k === 1 || m.k === 2) && ts(c.room, m.s) && vec(m.p, 2)) cast(c, { t: 'mboom', id: m.id, k: m.k, s: m.s, p: m.p }); };
  RX.mreq = (c, m) => {
    const h = c.room.host, now = Date.now(), lay = (m.k === 0 || m.k === 1 || m.k === 4) && vec(m.p, 2), id = (m.k === 2 || m.k === 3) && Number.isInteger(m.id) && m.id > 0 && m.id < 65536, det = m.k === 5 || m.k === 6;
    if (!h || h === c || (c.player.cls !== 'inf' && !(m.k === 3 && id)) || !(lay || id || det) || now - (c.mrq || 0) < 300) return;
    c.mrq = now; send(h.ws, Object.assign({ t: 'mreq', from: c.player.id, k: m.k }, lay ? { p: m.p } : det ? {} : { id: m.id }));
  };
}
/* the side of every model a player or an AI row may have (MSIDE), era by era, in place of the half of each list: 0 the Blue force (in modern
   the USA), 1 the Red (Russia), 2 the Insurgents (modern only, FACTIONS.modern.insurgentes on the page). The Insurgents' models join MODELS
   here, at the end of their lists, so that no older index moves; they field only in a room of 3 sides (join refuses one in a room of 2) */
const MSIDE = {
  ww2: [
    ['stuka', 'bf109', 'he177', 'tiger', 'pz4', 'wirbel', 'hummel', 'pzwerfer', 'schutze', 'mgschutze', 'pzjager', 'scharf', 'grwTrupp', 'funker', 'pionier', 'kubel', 'opel', 'sdkfz251', 'kfz31', 'opelw', 'ju52'],
    ['spit', 'p47', 'b17', 'sherman', 't34', 'm16', 'priest', 'bm13', 'rifleman', 'bargunner', 'bazookaman', 'sniper', 'mortarman', 'radioman', 'engineer', 'jeep', 'gmc', 'm3ht', 'wc54', 'gmcw', 'c47']],
  modern: [
    ['f22', 'a10', 'b2', 'abrams', 'leo2', 'nasams', 'pzh', 'm270', 'blueRifle', 'blueSaw', 'blueAT', 'blueAD', 'blueSniper', 'blueMortar', 'blueRadio', 'blueDrone', 'blueEng',
      'hmmwv', 'hemtt', 'lav25', 'm577', 'm997', 'm1089', 'ah64', 'uh60', 'c130'],
    ['su57', 'su25', 'tu160', 't90', 't72', 'pantsir', 'msta', 'bm21', 'redRifle', 'redMG', 'redAT', 'redAD', 'redSniper', 'redMortar', 'redRadio', 'redDrone', 'redEng',
      'tigr', 'ural', 'btr82', 'mtlbu', 'uaz452', 'mtoub', 'mi28', 'mi8', 'il76'],
    ['t55', 't62', 'tec107', 'insRifle', 'insMG', 'insRPG', 'insATGM', 'insKornet', 'insAD', 'insSniper', 'insMortar', 'insRadio', 'insSapper', 'insDrone', 'insBomber',
      'tecDshk', 'tecSpg9', 'tecZu', 'zpu4', 'zpu2', 'dshkAA', 'zuTruck', 'tecS5', 'tecS8', 'shilka', 'moto', 'suv', 'sedan', 'vbied', 'zil131', 'btr70', 'mi8i']] };
{
  const m = MODELS.modern, R = rooms.modern, add = (cls, ids) => { for (const id of ids) { if (m[cls].includes(id)) throw new Error('insurgent model already there: ' + id); m[cls].push(id); } };
  add('tank', ['t55', 't62']); add('art', ['tec107']);
  add('inf', ['insRifle', 'insMG', 'insRPG', 'insATGM', 'insKornet', 'insAD', 'insSniper', 'insMortar', 'insRadio', 'insSapper', 'insDrone', 'insBomber']);
  add('trn', ['tecDshk', 'tecSpg9', 'tecZu', 'zpu4', 'zpu2', 'dshkAA', 'zuTruck', 'tecS5', 'tecS8', 'shilka', 'moto', 'suv', 'sedan', 'vbied', 'zil131', 'btr70']);
  for (const id of [...m.tank, ...m.art, ...m.trn]) R.gnd.add(id);
  for (const id of m.inf) R.inf.add(id);
  for (const era in MSIDE) {
    const o = rooms[era].ms = Object.create(null);
    MSIDE[era].forEach((l, s) => { for (const id of l) { if (id in o) throw new Error('MSIDE: ' + id + ' on two sides'); o[id] = s; } });
    for (const cls in MODELS[era]) for (const id of MODELS[era][cls]) if (!(id in o)) throw new Error('MSIDE: no side for ' + era + ' ' + id);   // a model added without its side
  }
}
/* medics (welcome says med: 1; cf-medico, NÃO TESTADO: docs/nao-testado/cf-medico.md): the medic kits of each side, at the end of the lists so
   that no older index moves, and two more kinds of mreq, from a guest's medic to the host: k 7 he treated AI soldier id, k 8 he drags id to p
   (or keeps him alive while he treats him). 200 ms apart at least, on a clock of their own (a drag sends often) */
{
  const kits = { ww2: ['sanitater', 'medic'], modern: ['blueMedic', 'redMedic', 'insMedic'] };
  for (const era in kits) kits[era].forEach((id, s) => {
    if (MODELS[era].inf.includes(id)) throw new Error('medic kit already there: ' + id);
    MODELS[era].inf.push(id); rooms[era].inf.add(id); MSIDE[era][s].push(id); rooms[era].ms[id] = s;
  });
  const old = RX.mreq;
  RX.mreq = (c, m) => {
    if (m.k !== 7 && m.k !== 8) return old(c, m);
    const h = c.room.host, now = Date.now();
    if (!h || h === c || c.player.cls !== 'inf' || !aid(m.id) || (m.k === 8 && !vec(m.p, 2)) || now - (c.mdq || 0) < 200) return;
    c.mdq = now; send(h.ws, Object.assign({ t: 'mreq', from: c.player.id, k: m.k, id: m.id }, m.k === 8 ? { p: m.p } : {}));
  };
}
/* bomb vehicles and the disguised bomber (cf-vbied, NÃO TESTADO: docs/nao-testado/cf-vbied.md): the pickup bomb and the truck bomb a player may
   drive, the Insurgents' kit in plain clothes, at the end of their lists so that no older index moves; and mreq k 9, a guest's driver
   asks the host to set off its bomb vehicle (500 ms apart at least) */
{
  const m = MODELS.modern, R = rooms.modern;
  for (const [cls, id] of [['trn', 'vbiedPk'], ['trn', 'svbied'], ['inf', 'insCivBomber']]) {
    if (m[cls].includes(id)) throw new Error('vbied model already there: ' + id);
    m[cls].push(id); (cls === 'inf' ? R.inf : R.gnd).add(id); MSIDE.modern[2].push(id); R.ms[id] = 2;
  }
  const old = RX.mreq;
  RX.mreq = (c, m) => {
    if (m.k !== 9) return old(c, m);
    const h = c.room.host, now = Date.now();
    if (!h || h === c || c.player.cls !== 'trn' || now - (c.vbq || 0) < 500) return;
    c.vbq = now; send(h.ws, { t: 'mreq', from: c.player.id, k: 9 });
  };
}
/* the room's sides, said by its first player: the general's seats past them are free again, and a bridge of such a side is told and let go */
function setNs(room, ns) {
  if (room.ns === ns) return;
  room.ns = ns;
  for (let s = ns; s < room.gen.length; s++) room.gen[s] = room.genk[s] = 0;
  for (const g of [...room.gens]) if (g.player.side >= ns) { send(g.ws, { t: 'error', code: 'sides' }); room.gens.delete(g); g.ws.close(); }
}
/* day, night and weather (welcome says sky: 1). sky: the host's light clock and weather, to the room: h the hour now (0 to 24), rt s of day a
   second, p and w the presets' indices, r rain and f low fog (0 to 1), wx wz the wind m/s. ill: a light anyone put up, k 0 a hand flare 1 an
   illumination round, from p [x, y, z] to burst over q [x, z] after d s; to the rest of the room, a guest's 400 ms apart at least (the host's carry its AI's too) */
RX.sky = (c, m) => {
  if (!host(c) || !num(m.h) || m.h < 0 || m.h > 24 || !num(m.rt) || m.rt < 0 || m.rt > 600 || !int(m.p, -1, 3) || !int(m.w, -1, 3) || ![m.r, m.f].every(v => num(v) && v >= 0 && v <= 1) || ![m.wx, m.wz].every(v => num(v) && Math.abs(v) <= 30)) return;
  cast(c, { t: 'sky', h: m.h, rt: m.rt, p: m.p, w: m.w, r: m.r, f: m.f, wx: m.wx, wz: m.wz });
};
RX.ill = (c, m) => {
  const now = Date.now();
  if (!int(m.k, 0, 1) || !vec(m.p, 3) || !vec(m.q, 2) || !num(m.d) || m.d < 0 || m.d > 30 || (!host(c) && now - (c.ilt || 0) < 400)) return;
  c.ilt = now; cast(c, { t: 'ill', k: m.k, p: m.p, q: m.q, d: m.d });
};
/* the units' calls for help (welcome says hlp: 1). hlp: the host's open calls of side s, to that side's players (and the spectators): rows
   [id, need 0 to 6, x, z, st 0 open 1 answered by the AI 2 by a player, the asker's player id or 0], 24 at most. hask: a guest calls for need k
   from p [x, z] for q [x, z], to the host, 1 s apart at least; hacc: a guest answers call id, to the host */
{
  const hrow = r => Array.isArray(r) && r.length === 6 && int(r[0], 1, 1e9) && int(r[1], 0, 6) && num(r[2]) && num(r[3]) && int(r[4], 0, 2) && int(r[5], 0, 1e9);
  RX.hlp = (c, m) => { if (host(c) && ts(c.room, m.s) && lst(m.e, 24) && m.e.every(hrow)) castSide(c, { t: 'hlp', s: m.s, e: m.e }, m.s); };
  RX.hask = (c, m) => {
    const h = c.room.host, now = Date.now();
    if (!h || h === c || c.spec || !int(m.k, 0, 6) || !vec(m.p, 2) || !vec(m.q, 2) || now - (c.hkt || 0) < 1000) return;
    c.hkt = now; send(h.ws, { t: 'hask', from: c.player.id, k: m.k, p: m.p, q: m.q });
  };
  RX.hacc = (c, m) => { const h = c.room.host; if (h && h !== c && !c.spec && int(m.id, 1, 1e9)) send(h.ws, { t: 'hacc', from: c.player.id, id: m.id }); };
}
/* requests to the general from the map (welcome says ped: 1; cf-pedidos-mapa). gped: a guest asks his side's general for need k (0 to 9:
   artillery, smoke, air strike, infantry, armour, help where he is, air cover, supply, a paratroopers' drop, his own parachute jump) from
   p [x, z] at q [x, z], to the host, 1 s apart at least; gpr: the host's answer to that guest alone, to: his id, k, s 0 yes 1 no 2 passed
   to a person 3 too soon, why (a line), eta s, q [x, z], v the transport he rides (its AI id; a jump's, cf-paraquedistas).
   pdr: the host's paratroopers in the air, e [[AI id, height, 1 falling 2 under the canopy, heading]], 64 at most, to the room */
{
  RX.gped = (c, m) => {
    const h = c.room.host, now = Date.now();
    if (!h || h === c || c.spec || !int(m.k, 0, 9) || !vec(m.p, 2) || !vec(m.q, 2) || now - (c.gpt || 0) < 1000) return;
    c.gpt = now; send(h.ws, { t: 'gped', from: c.player.id, k: m.k, p: m.p, q: m.q });
  };
  RX.gpr = (c, m) => {
    const o = host(c) && pid(m.to) && [...c.room.values()].find(o => o.player.id === m.to);
    if (o && o !== c && int(m.k, 0, 9) && int(m.s, 0, 3) && txt(m.why, 160) && int(m.eta, 0, 3600) && vec(m.q, 2)) send(o.ws, Object.assign({ t: 'gpr', k: m.k, s: m.s, why: m.why, eta: m.eta, q: m.q }, aid(m.v) && { v: m.v }));
  };
  RX.pdr = (c, m) => { if (host(c) && Array.isArray(m.e) && m.e.length <= 64 && m.e.every(e => vec(e, 4) && aid(e[0]) && (e[2] === 1 || e[2] === 2 || e[2] === 3))) cast(c, { t: 'pdr', e: m.e }); };   // 3: on the fast-rope (ptr)
  /* the player's transport (welcome says ptr: 1; cf-transporte-jogador). pdl, from a guest flying a paratroopers' plane or a transport
     helicopter to the host, 400 ms apart at least: k 0 load me from the side's reserve (w squads, 1 to 4), k 1 a stick goes out of my
     aircraft (n its kits, as lift's; r 1 down the fast-rope, 0 by parachute). From the host to that guest alone (to): k 0, n the squads
     granted, [[kits]], 4 at most, none when the reserve is empty */
  RX.pdl = (c, m) => {
    const h = c.room.host, kits = v => Array.isArray(v) && v.length > 0 && v.length <= 8 && v.every(k => Number.isInteger(k) && k >= 0 && k < c.room.inf.size);
    if (h === c) { const o = c.room.get(m.to); if (o && o !== c && m.k === 0 && Array.isArray(m.n) && m.n.length <= 4 && m.n.every(kits)) send(o.ws, { t: 'pdl', k: 0, n: m.n }); return; }
    if (!h || c.spec || (c.player.cls !== 'plane' && c.player.cls !== 'heli')) return;
    const now = Date.now(); if (now - (c.pdt || 0) < 400) return;
    if (m.k === 0 && int(m.w, 1, 4)) { c.pdt = now; send(h.ws, { t: 'pdl', from: c.player.id, k: 0, w: m.w }); }
    else if (m.k === 1 && kits(m.n) && (m.r === 0 || m.r === 1)) { c.pdt = now; send(h.ws, { t: 'pdl', from: c.player.id, k: 1, n: m.n, r: m.r }); }
  };
}
function mineKeep(room) { const K = room.mines, n = Math.ceil(K.e.length / 40) || 1; for (let i = 0; i < n; i++) send(room.host.ws, { t: 'mine', q: K.q, i, n, e: K.e.slice(i * 40, (i + 1) * 40), s: K.s }); }
/* suspended matches (welcome says rs: 1). The battle lives in the host's browser, so the server keeps the last word of each kind the host
   sent the room (snapIn: the ai rows, cq, the objects' stages, the buildings, bases, forts, eco, ecs, gen, glog, rad; keep is room.keep),
   merged where the host sends only what changed. When the last player leaves, the match is suspended with its clock where it stood (no
   host, nothing simulates) and the copy is kept SUSPEND s (default 900; 0 ends the match as before). A player who joins the empty room
   in that time, with the same map and without fresh: 1 ("Nova partida"), is welcomed with host 0 and sus 1, is sent the copy as a guest
   is sent the host's word (snapOut), then keep, the mines and host: the page adopts it, as when a host leaves. A new match (another cq n) or a
   dropped copy starts it again (and so does a page of another count of sides, P.ns). GET /partidas says, by era, what is suspended: { s: s left to resume, T: s on the match clock, n, ph, ns } or null */
const SUSPEND = process.env.SUSPEND === undefined ? 900 : Math.max(0, +process.env.SUSPEND || 0), SNAPMEN = 4096, SNAPBLD = 1 << 18;
/* ai: by kind of row (air, ground), not by side; ecs, gen, glog and gT: by side, for the most sides of any room (3) */
function snapNew() { return { ai: [null, null], men: new Map(), menT: 0, menP: 0, cq: null, obj: new Map(), be: new Map(), bf: new Set(), bs: new Map(), bm: null, base: null, fort: [], fn: 0, eco: null, ecs: [null, null, null], gen: [null, null, null], glog: [[], [], []], gT: [0, 0, 0], rad: null, mv: 0, ns: 2 }; }
for (const era in rooms) Object.assign(rooms[era], { snap: snapNew(), sus: 0, sut: null });
function snapIn(c, m) {
  if (!c.room || !c.room.snap || c.room.host !== c) return;
  const P = c.room.snap, now = Date.now();
  switch (m.t) {
    case 'ai':
      if (m.k < 2) { P.ai[m.k] = m; break; }
      for (const e of m.e) {   // the soldiers come a part at a time: a row stays while its part comes round, menP the ms that takes (a slow host is slower)
        const r = P.men.get(e[0]), iv = r ? now - r.at : 0;
        if (iv > 0 && iv < 30000) P.menP = P.menP ? P.menP * .8 + iv * .2 : iv;
        if (r || P.men.size < SNAPMEN) P.men.set(e[0], { e, at: now });
      }
      P.menT = now; for (const [id, r] of P.men) if (now - r.at > Math.max(10000, 4 * P.menP)) P.men.delete(id);
      break;
    case 'obj': for (let i = 0; i + 1 < m.e.length; i += 2) { if (m.e[i + 1] === 0) P.obj.delete(m.e[i]); else P.obj.set(m.e[i], Math.max(P.obj.get(m.e[i]) || 0, m.e[i + 1])); } break;   // 0: a bridge built again (brb)
    case 'bld':
      if (m.e) for (let i = 0; i + 1 < m.e.length; i += 2) if (P.be.size < SNAPBLD || P.be.has(m.e[i])) P.be.set(m.e[i], m.e[i + 1]);
      if (m.f) for (const b of m.f) P.bf.add(b);
      if (m.s) for (let i = 0; i + 1 < m.s.length; i += 2) P.bs.set(m.s[i], m.s[i + 1]);
      if (m.m) P.bm = m.m;
      break;
    case 'fort': if (m.n !== P.fn) { P.fort = []; P.fn = m.n; } P.fort[m.i] = m; break;
    case 'ecs': case 'gen': P[m.t][m.s] = m; break;
    case 'glog': {
      const L = P.glog[m.s]; if (m.full === 1) L.length = 0;
      L.push(...m.e); if (L.length > 80) L.splice(0, L.length - 80); P.gT[m.s] = m.T; break;
    }
    case 'cq': case 'base': case 'eco': case 'rad': P[m.t] = m; break;
  }
}
/* the copy, to the one who resumes, in the order a joiner gets the host's word; its side's private word only */
function cat(it) { const o = []; for (const a of it) for (const x of a) o.push(x); return o; }
function snapOut(c) {
  const room = c.room, P = room.snap, s = sideOf(c), to = m => send(c.ws, m), flat = (t, k, l, o) => { for (let i = 0; i < l.length; i += 200) to(Object.assign({ t, [k]: l.slice(i, i + 200) }, o)); };
  if (P.base) to(P.base);
  for (const m of P.fort) if (m) to(m);
  flat('obj', 'e', cat([...P.obj].filter(e => e[1])), { full: 1 });
  const bs = cat(P.bs); for (let i = 0; i < bs.length; i += 120) to({ t: 'bld', s: bs.slice(i, i + 120), full: 1 });
  flat('bld', 'f', [...P.bf], { full: 1 }); flat('bld', 'e', cat(P.be), { full: 1 });
  if (P.bm) to({ t: 'bld', m: P.bm });
  for (const m of P.ai) if (m) to(m);
  const men = [...P.men.values()].filter(r => P.menT - r.at < Math.max(2500, 1.5 * P.menP + 500)).map(r => r.e);
  for (let i = 0; i < men.length; i += AICAP) to({ t: 'ai', k: 2, e: men.slice(i, i + AICAP) });
  for (const m of [P.cq, P.eco, P.ecs[s], P.gen[s], P.rad]) if (m) to(m);
  if (P.glog[s].length) to({ t: 'glog', s, T: P.gT[s], e: P.glog[s], full: 1 });
  if (room.keep) to({ t: 'keep', e: room.keep });
  if (room.mines) mineKeep(room);   // the mines, as to a next host: room.host is the resumer already
  for (const o of members(room)) send(o.ws, { t: 'host', id: c.player.id });
}
/* the last player left: the match waits, unless there is nothing to keep or SUSPEND is 0 */
function suspend(room) {
  const P = room.snap;
  if (!SUSPEND || !(P.cq || P.ai[0] || P.ai[1] || P.men.size || room.keep || room.mines)) return snapDrop(room);
  P.mv = room.mv; P.ns = room.ns; room.sus = Date.now() + SUSPEND * 1000; clearTimeout(room.sut);
  room.sut = setTimeout(() => { if (!room.size) snapDrop(room); }, SUSPEND * 1000); if (room.sut.unref) room.sut.unref();
}
/* the match is over for good: whoever comes next starts a new one, under a new number */
function snapDrop(room) {
  clearTimeout(room.sut); room.sut = null; room.keep = room.mines = room.mbuf = room.ana = null; room.snap = snapNew();
  if (room.sus) room.cqn = (room.cqn || 0) + 1;
  room.sus = 0;
}
const partidas = () => {
  const o = {}, now = Date.now();
  for (const era in rooms) { const r = rooms[era], q = r.snap.cq; o[era] = r.sus > now && !r.size ? { s: Math.ceil((r.sus - now) / 1000), T: q ? q.T : 0, n: r.cqn || 0, ph: q ? q.ph : 0, ns: r.snap.ns || 2 } : null; }
  return o;
};
/* analytics (welcome ana: 1): the page that simulates a match (the host online; a solo or watch page by POST /ana) sends its events in
   batches, and the server keeps one file a match, data/matches/<era>/<date>-<id>.ndjson.gz (ANA_DIR another folder): one JSON event a line,
   each batch a gzip member appended. id is a random name the server gives the match (online: the room's match, which a new host carries on;
   by POST: the page's own random key), never a player's id or name. ana { n the room's match, e the events, end 1 the last batch }: from the
   host only, at most ANA.rate[0] a window of ANA.rate[1] ms (ANA_RATE, 30: a busy match's brain events fill about ten pieces of the page's
   ANA.chunk every flush, and with 10 the flush after the end was refused), events of the known kinds (every kind the page sends: a batch with
   one unknown event is refused whole, so a kind the page adds goes here too and in the page's ANA.kinds; cb are the brain's meters), ANA.max bytes a match. At the end (an end event) a
   summary goes beside it, <date>-<id>.json (the header, the end and the review the page sent as rep). ANALYTICS=0: welcome says ana: 0 and
   nothing is written or served. Files older than ANA_DAYS days (default 90) are deleted at start and every six hours.
   HTTP: GET /ana/list the stored matches, newest first (from their summaries); GET /ana/m/<era>/<name> one match as ndjson; GET /ana/r/<era>/<name>
   its summary; POST /ana { k the page's key, era, e, end } */
const ANA = { on: process.env.ANALYTICS !== '0', dir: process.env.ANA_DIR ? path.resolve(process.env.ANA_DIR) : path.join(__dirname, 'data', 'matches'),
  days: +process.env.ANA_DAYS || 90, max: 6 << 20, rate: [+process.env.ANA_RATE || 30, 15000], kinds: new Set(['hdr', 'sp', 'ls', 'pt', 'lg', 'sn', 'end', 'rep', 'cv', 'mv', 'ap', 'ab', 'tr', 'el', 'cb', 'g2', 'g2c']), list: 200, keys: new Map(), ips: new Map(), keyMax: +process.env.ANA_KEYS || 4096, dayMax: Math.floor((+process.env.ANA_DAY_MB || 512) * 1048576), day: { d: '', bytes: 0 } };
const anaName = /^\d{4}-\d{2}-\d{2}-[0-9a-f]{12}$/;
const anaFile = (era, base, ext) => path.join(ANA.dir, era, base + ext);
/* a batch's events this server keeps: those of the known kinds with their time; null when the batch is not a list of records (refused). An event
   of a kind it does not know, or without its time, is left out, not the whole batch: one stray event (a page newer than the server, or a brain
   event whose payload carried its own k, cf-pol-fluxos) used to drop every batch it rode in, and with them the match's end and its summary */
const anaEv = e => (lst(e, 2000) && e.every(o => rec(o) && o !== null) ? e.filter(o => typeof o.k === 'string' && ANA.kinds.has(o.k) && num(o.t)) : null);
/* the rate of one sender: true when it may send now */
function anaRate(o) {
  const now = Date.now(), r = o.anaR || (o.anaR = { t: now, n: 0 });
  if (now - r.t > ANA.rate[1]) { r.t = now; r.n = 0; }
  return ++r.n <= ANA.rate[0];
}
/* append the events to match M ({ era, base, bytes, end }); the summary when the end is in */
function anaWrite(M, e, end) {
  const txt = e.map(o => JSON.stringify(o)).join('\n') + (e.length ? '\n' : '');
  const today = new Date().toISOString().slice(0, 10);
  if (ANA.day.d !== today) ANA.day = { d: today, bytes: 0 };
  if (M.bytes + txt.length > ANA.max || ANA.day.bytes + txt.length > ANA.dayMax) return false;
  M.bytes += txt.length; ANA.day.bytes += txt.length;
  try {
    fs.mkdirSync(path.join(ANA.dir, M.era), { recursive: true });
    if (txt) fs.appendFileSync(anaFile(M.era, M.base, '.ndjson.gz'), zlib.gzipSync(txt));
    for (const o of e) { if (o.k === 'hdr' && !M.hdr) M.hdr = o; if (o.k === 'end') M.end = o; if (o.k === 'rep') M.rep = o; }
    if ((end || e.some(o => o.k === 'end' || o.k === 'rep')) && M.end) fs.writeFileSync(anaFile(M.era, M.base, '.json'), JSON.stringify({ id: M.base, era: M.era, src: M.src, hdr: M.hdr || null, end: M.end, rep: M.rep || null }));
  } catch (er) { console.error('analytics: ' + er.message); return false; }
  return true;
}
const anaNew = (era, src) => ({ era, src, base: new Date().toISOString().slice(0, 10) + '-' + crypto.randomBytes(6).toString('hex'), bytes: 0, hdr: null, end: null, rep: null });
/* the entry of a bounded map, made if missing; the one least recently used goes when the map is full */
function anaTouch(map, k, make) {
  let v = map.get(k); map.delete(k);
  if (v === undefined) v = make();
  map.set(k, v);
  if (map.size > ANA.keyMax) map.delete(map.keys().next().value);
  return v;
}
RX.ana = (c, m) => {
  const room = c.room;
  const e = ANA.on && host(c) && int(m.n, 0, 1e6) && m.n === (room.cqn || 0) ? anaEv(m.e) : null;
  if (!e || (!e.length && m.end !== 1) || !anaRate(c)) return;   // nothing to keep and not the end: refused, and not counted in the rate
  if (!room.ana || room.ana.n !== m.n) room.ana = Object.assign(anaNew(Object.keys(rooms).find(k => rooms[k] === room), 'online'), { n: m.n });
  anaWrite(room.ana, e, m.end === 1);
};
/* the files older than ANA.days, gone */
function anaPrune() {
  if (!ANA.on) return;
  const old = Date.now() - ANA.days * 86400e3;
  for (const era of Object.keys(MODELS)) {
    let l = []; try { l = fs.readdirSync(path.join(ANA.dir, era)); } catch (e) { continue; }
    for (const f of l) { const p = path.join(ANA.dir, era, f); try { if (fs.statSync(p).mtimeMs < old) fs.unlinkSync(p); } catch (e) {} }
  }
}
function anaHttp(req, res) {
  const out = (code, body, type) => { res.writeHead(code, { 'content-type': type || 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(typeof body === 'string' ? body : JSON.stringify(body)); };
  const u = req.url.split('?')[0], p = u.split('/');
  if (!ANA.on) return out(404, { on: 0 });
  if (req.method === 'POST' && u === '/ana') {
    let body = '', big = false;
    req.on('data', d => { body += d; if (body.length > MAXAI) { big = true; req.destroy(); } });
    req.on('end', () => {
      if (big) return;
      let m; try { m = JSON.parse(body); } catch (e) { return out(400, { ok: 0 }); }
      const ip = req.socket.remoteAddress || '', who = anaTouch(ANA.ips, ip, () => ({}));
      const e = m && rec(m) && typeof m.k === 'string' && /^[0-9a-f]{12}$/.test(m.k) && Object.hasOwn(MODELS, m.era) ? anaEv(m.e) : null;
      if (!e || (!e.length && m.end !== 1)) return out(400, { ok: 0 });
      if (!anaRate(who)) return out(429, { ok: 0 });
      const M = anaTouch(ANA.keys, m.k, () => { const o = anaNew(m.era, 'local'); o.base = o.base.slice(0, 11) + m.k; return o; });
      out(anaWrite(M, e, m.end === 1) ? 200 : 413, { ok: 1 });
    });
    return;
  }
  if (req.method !== 'GET') return out(404, { ok: 0 });
  if (u === '/ana/list') {
    const all = [];
    for (const era of Object.keys(MODELS)) {
      let f = []; try { f = fs.readdirSync(path.join(ANA.dir, era)); } catch (e) { continue; }
      for (const n of f) if (n.endsWith('.ndjson.gz')) all.push({ id: n.slice(0, -10), era });
    }
    all.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
    const l = [];
    for (const o of all) {
      if (l.length >= ANA.list) break;
      if (!fs.existsSync(anaFile(o.era, o.id, '.json'))) continue;
      o.size = 0; o.sum = null;
      try { o.size = fs.statSync(anaFile(o.era, o.id, '.ndjson.gz')).size; } catch (e) {}
      try { const j = JSON.parse(fs.readFileSync(anaFile(o.era, o.id, '.json'), 'utf8')); o.sum = { src: j.src, end: j.end, fac: j.hdr && j.hdr.fac, doc: j.hdr && j.hdr.doc, watch: j.hdr && j.hdr.watch, net: j.hdr && j.hdr.net, per: j.hdr && j.hdr.per, dif: j.hdr && j.hdr.dif }; } catch (e) {}
      l.push(o);
    }
    return out(200, { on: 1, m: l.map(o => ({ id: o.id, era: o.era, size: o.size, sum: o.sum })) });
  }
  if ((p[2] === 'm' || p[2] === 'r') && p.length === 5 && Object.hasOwn(MODELS, p[3]) && anaName.test(p[4])) {
    if (p[2] === 'r') return fs.readFile(anaFile(p[3], p[4], '.json'), 'utf8', (er, t) => (er ? out(404, { ok: 0 }) : out(200, t)));
    if (!fs.existsSync(anaFile(p[3], p[4], '.json'))) return out(404, { ok: 0 });
    return fs.readFile(anaFile(p[3], p[4], '.ndjson.gz'), (er, b) => {
      if (er) return out(404, { ok: 0 });
      zlib.gunzip(b, (e2, t) => (e2 ? out(500, { ok: 0 }) : out(200, t.toString('utf8'), 'application/x-ndjson; charset=utf-8')));
    });
  }
  return out(404, { ok: 0 });
}
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/ana')) return anaHttp(req, res);
  if (req.method === 'GET' && req.url.split('?')[0] === '/partidas') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' }); return res.end(JSON.stringify(partidas()));
  }
  /* the models pack (models/pack/<id>.glb, tools/pack/build.js): only those file names, read from that folder, cached a day */
  const pk = req.method === 'GET' && /^\/models\/pack\/([a-z0-9_]+)\.glb$/.exec(req.url.split('?')[0]);
  if (pk) return fs.readFile(path.join(__dirname, 'models', 'pack', pk[1] + '.glb'), (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'content-type': 'model/gltf-binary', 'content-length': buf.length, 'cache-control': 'public, max-age=86400' }); res.end(buf);
  });
  if (req.method !== 'GET' || req.url.split('?')[0] !== '/') { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('404'); }
  fs.readFile(PAGE, (err, buf) => {
    if (err) { res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Não foi possível ler a página do jogo.'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(buf);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 1 << 16 });
wss.on('connection', ws => {
  const c = { ws, room: null, player: null };
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('error', () => {});
  ws.on('message', (data, binary) => {
    if (binary || data.length > MAXAI) return;
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string' || !Object.hasOwn(RX, m.t) || data.length > (Object.hasOwn(BIG, m.t) ? BIG[m.t] : MAXLEN)) return;
    if ((m.t !== 'join' && !c.room) || c.left) return;
    c.at = Date.now();   // the last word from this page (HOSTIDLE)
    if (c.spec) return;   // a spectator sends nothing the room or the host reads
    if (c.gen && !GENRX.has(m.t)) return;
    RX[m.t](c, m);
  });
  ws.on('close', () => leave(c));
});
/* a player is out of the room: on the socket's close, or before it when its page has gone quiet as the host (HOSTIDLE). Once only */
function leave(c) {
  if (!c.room || c.left) return;
  c.left = true;
  const room = c.room;
  if (c.spec) { room.specs.delete(c); return; }
  if (c.gen) { room.gens.delete(c); return genFree(room, c); }
  room.delete(c.player.id); cast(c, { t: 'left', id: c.player.id }); genFree(room, c);
  if (!room.size) suspend(room);
  if (room.size === 0) room.mv = 0;
  if (room.host !== c) return;
  room.host = room.values().next().value || null;
  if (room.host) { if (room.keep) send(room.host.ws, { t: 'keep', e: room.keep }); if (room.mines) mineKeep(room); cast(c, { t: 'host', id: room.host.player.id }); }   // the backup first: the page adopts on host
  for (const g of room.gens) send(g.ws, { t: 'host', id: room.host ? room.host.player.id : 0 });
  if (!room.host) for (const o of room.specs) send(o.ws, { t: 'host', id: 0 });   // nobody left to play: the spectators are told
}
/* a host whose page went quiet. The battle is simulated in the host's page only, and a page in a tab in the background, minimized or
   frozen stops its frame loop, while the browser still answers the heartbeat's ping: the room kept a host that sent nothing and answered
   nothing, and every other player was a guest waiting on it ("O anfitrião não respondeu" to a vehicle, "O anfitrião recusou a obra" to a
   base: cf-anfitriao-bug, the captain's own older tab of the same preview). A host sends its state 20 times a second; one silent for
   HOSTIDLE ms (default 20000; 0 never) while another player is in the room is let go as if it had left, so the next player adopts the
   battle, and its socket is closed with code 4001 (the page says why when it wakes). A host alone in its room is never let go */
const HOSTIDLE = process.env.HOSTIDLE === undefined ? 20000 : Math.max(0, +process.env.HOSTIDLE || 0);
const idle = setInterval(() => {
  if (!HOSTIDLE) return;
  const now = Date.now();
  for (const era in rooms) {
    const room = rooms[era], h = room.host;
    if (!h || room.size < 2 || now - (h.at || 0) < HOSTIDLE) continue;
    leave(h); try { h.ws.close(4001, 'host idle'); } catch (e) { h.ws.terminate(); }
  }
}, 1000);
if (idle.unref) idle.unref();
const beat = setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
}, Math.max(1000, +process.env.BEAT || 10000));   // BEAT=<ms>: the heartbeat's period (tests/net.js gives its test server a long one)
wss.on('close', () => clearInterval(beat));

anaPrune(); setInterval(anaPrune, 6 * 3600e3).unref();
server.listen(PORT, process.env.HOST || '0.0.0.0', () => {   // HOST=127.0.0.1: this computer only
  console.log('Céu de Ferro 3D no ar.');
  console.log('  Neste computador: http://localhost:' + PORT);
  if (!process.env.HOST || process.env.HOST === '0.0.0.0') for (const list of Object.values(os.networkInterfaces())) for (const a of list) if (a.family === 'IPv4' && !a.internal) console.log('  Na rede local:    http://' + a.address + ':' + PORT);
});
