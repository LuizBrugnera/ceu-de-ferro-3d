'use strict';
/* cf-manobra-reuniao: the review's manoeuvre (anaMano) with an edge the road network gained during the match (a bridge built or rebuilt):
   the header lists the edges at the start (hdr.net), the traffic (tr) counts by the network of the minute, so a tr's list can be longer.
   Before the fix the review fell over at the match's end (TypeError reading net[i][1]); now the new edge's samples are road off the axis */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 1, mapv: 6, ana: true }), $ = C.$;
const net = [[0, 1, 500, 'A', 'B'], [0, 0, 400, 'B', 'C']];   // edge 0 on an axis, edge 1 not
const tr = (e0, e1) => ({ k: 'tr', t: 60, d: 60, e: [e0, e1], o: [2, 0], v: [[1, 0, 0, 0], [0, 0, 0, 0]] });
const ev = [{ k: 'hdr', net }, tr([3, 1], [0, 0]), tr([2, 1, 4], [0, 0, 0]), tr([1, 0, null, 5], [0, 0])];   // a third and a fourth edge from the second minute (the fourth with a hole, as JSON writes a sparse list)
let M = null, err = null; try { M = $('anaMano')(ev, 0); } catch (e) { err = e; }
ok(!err && M, 'the review takes a traffic list longer than the header\'s (' + (err ? err.message : 'no throw') + ')');
ok(M && M.raw.road === 3 + 1 + 2 + 1 + 4 + 1 + 5 && M.raw.axis === 3 + 2 + 1 && M.raw.nw === 9, 'the new edges count as road off the axis: road ' + (M && M.raw.road) + ', axis ' + (M && M.raw.axis) + ', new ' + (M && M.raw.nw));
ok(M && M.tr.top.every(x => /–/.test(x.e) && Number.isFinite(x.n)), 'the busiest edges are the header\'s, with numbers');
/* the source: a sample on an edge past this minute's list is a count, not NaN */
const S = C.watch('ww2', { doc: ['balanced', 'cautious'], min: 1 }); C.run(S.cq.T0 + 5, () => !S.over);
const X = $('MVA').X, n = X.e[0].length; C.$('globalThis.__n = ' + n);
C.$('anaEdge = (g => () => __n + 2)(anaEdge)'); $('anaMvLook')();
const e0 = $('MVA').X.e[0];
ok(e0.length === n + 3 && Number.isInteger(e0[n + 2]) && e0[n + 2] > 0 && !e0.some(x => Number.isNaN(x)), 'the look counts a sample on a new edge (' + e0[n + 2] + ' at index ' + (n + 2) + ' of a list of ' + n + '), no NaN');
H.done();
