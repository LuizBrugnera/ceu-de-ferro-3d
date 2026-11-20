'use strict';
/* the enemy labels on the fire-control map (artillery, M) and on the battle map (cf-pol-testes-b): contacts drawn close to each other share one
   label. Before, at ×1 zoom a column of tanks on the fire-control map was a smear of "CC" and class names written over each other.
   tagAdd and tagText live in the view part of the page (after the 3D scene marker), so they are cut out of the page and run alone: no DOM. */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const a = html.indexOf('function tagAdd('), b = html.indexOf('\n', html.indexOf('const tagText = ', a));
const RED = '#e2604f', GOLD = '#d9a441';
if (a < 0 || b < 0) ok(false, 'no tagAdd in the page (a page before cf-pol-testes-b: each contact wrote its own label)');
else {
  const ctx = vm.createContext({});
  vm.runInContext(html.slice(a, b).replace('const tagText =', 'globalThis.tagText ='), ctx);
  const { tagAdd, tagText } = ctx;

  const L = [];
  tagAdd(L, 22, 100, 100, 'CC', 3, 'tank', 12, RED);
  tagAdd(L, 22, 106, 103, 'CC', 2, 'tank', 3, RED);
  tagAdd(L, 22, 112, 98, 'CC', 3, 'tank', 30, RED);
  tagAdd(L, 22, 104, 110, 'CM', 3, 'truck', 8, RED);
  ok(L.length === 1, 'four contacts within 22 px of the first: one label (' + L.length + ')');
  ok(tagText(L[0]) === 'CC ×3 · CM', 'the label counts the classes, the most numerous first: "' + tagText(L[0]) + '"');
  ok(L[0].n === 4 && L[0].age === 3, 'the cluster knows its size and its freshest contact (' + L[0].n + ', ' + L[0].age + ' s)');
  ok(L[0].x === 100 && L[0].y === 100, 'the label stays on the first contact');

  tagAdd(L, 22, 160, 100, '?', 1, 'tank', 0, RED);
  ok(L.length === 2 && tagText(L[1]) === '?', 'a contact 60 px away has its own label, "?" when only detected');
  tagAdd(L, 22, 101, 101, 'BL', 3, 'lav', 1, GOLD);
  ok(L.length === 3 && tagText(L[2]) === 'BL', 'a contact of another enemy side (another colour) is not merged into the first side\'s label');

  const one = [];
  tagAdd(one, 22, 50, 50, 'AA', 2, 'aa', 5, RED);
  tagAdd(one, 22, 52, 51, 'AA', 3, 'aag', 9, RED);
  ok(tagText(one[0]) === 'AA ×2' && one[0].rg === 3 && one[0].cl === 'aag', 'the best rung and its class are kept for the name: rung ' + one[0].rg + ', ' + one[0].cl);
}

/* both maps go through it, and the fire-control map no longer writes a name and an age for each contact on its own */
const body = name => { const i = html.indexOf('function ' + name + '('); return html.slice(i, html.indexOf('\n}\n', i)); };
const fp = body('fpMap'), bm = body('bmDraw');
ok(/tagAdd\(tags,/.test(fp) && /tagText\(b\)/.test(fp), 'fpMap labels its contacts through tagAdd/tagText');
ok(/tagAdd\(tags,/.test(bm) && /tagText\(b\)/.test(bm), 'bmDraw (the battle map) too');
ok(!/txt\(W13\.cls\[cl\]/.test(fp), 'fpMap does not write a class name for every contact');
ok(!/\? FOE : FRIEND/.test(fp), 'fpMap colours each enemy side with foeCol, as the battle map does (3 sides)');
done();
