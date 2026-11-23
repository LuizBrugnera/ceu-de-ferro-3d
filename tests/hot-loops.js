'use strict';
/* The step's hot loops read the world's lists by index (cf-lag-2): for (let _i = 0, _l = S.x, o = _l[0]; _i < _l.length; o = _l[++_i]) in
   place of for (const o of S.x), which made an iterator result an element where V8 runs the function below its top tier. The form must
   visit what for...of visits, whatever the loop does to the list, and the hot functions must keep it. No battle is run: a second or so */
const H = require('./harness'), fs = require('fs'), vm = require('vm'), ok = H.ok;

console.log('-- the index form visits what for...of visits --');
{
  const cases = {
    plain: L => L,
    push: (L, o, i) => { if (i < 3) L.push({ n: 100 + i }); },
    spliceAhead: (L, o, i) => { if (i === 1) L.splice(3, 2); },
    spliceBehind: (L, o, i) => { if (i === 4) L.splice(0, 2); },
    shrink: (L, o, i) => { if (i === 2) L.length = 3; },
    swapList: (L, o, i, S) => { if (i === 1) S.men = [{ n: -1 }]; },
    holes: L => L
  };
  const run = (form, act) => {
    const S = { men: Array.from({ length: 8 }, (_, n) => ({ n })) }; if (act === cases.holes) delete S.men[4];
    const seen = [], ctx = vm.createContext({ S, seen, act });
    vm.runInContext(form === 'of'
      ? 'let i = 0; for (const m of S.men) { seen.push(m ? m.n : "hole"); act(S.men, m, i++, S); if (m && m.n === 5) continue; seen.push("+"); }'
      : 'let i = 0; for (let _i = 0, _l = S.men, m = _l[0]; _i < _l.length; m = _l[++_i]) { seen.push(m ? m.n : "hole"); act(S.men, m, i++, S); if (m && m.n === 5) continue; seen.push("+"); }', ctx);
    return seen.join();
  };
  for (const k in cases) { const a = run('of', cases[k]), b = run('index', cases[k]); ok(a === b, k + ': ' + b); }
  const ctx = vm.createContext({ fns: [] });
  vm.runInContext('for (let _i = 0, _l = [1, 2, 3], v = _l[0]; _i < _l.length; v = _l[++_i]) fns.push(() => v);', ctx);
  ok(ctx.fns.map(f => f()).join() === '1,2,3', 'a closure made in the loop keeps its own element, as with const');
}

console.log('-- the hot functions keep it --');
{
  const src = fs.readFileSync(H.PAGE, 'utf8'), hot = ['spotSd', 'spotRun', 'stepShots', 'fortStep', 'fortMen', 'supStep', 'ranOver', 'popUse', 'droneTouch', 'lodTier', 'foeIn', 'step', 'civLook', 'navAt', 'near', 'navPath', 'stepMan', 'wayTo'];
  const body = n => { const m = new RegExp('\\nfunction\\*? *' + n + '\\(').exec(src); if (!m) return null; const a = m.index + 1, e = src.slice(a).search(/\n(function|const|let|\/\*|[A-Za-z]\w* = )/); return src.slice(a, a + 1 + e); };
  const lists = 'units|men|planes|bullets|bombs|missiles|shells|flares|forts|sup|squads|wrecks|parts|floats|feed|falls|debris|civs|chg|base|T\\.objs';
  for (const n of hot) {
    const b = body(n), of = b ? (b.match(new RegExp('for \\(const \\w+ of S\\.(' + lists + ')\\)', 'g')) || []) : null, ix = b ? (b.match(/_l\[\+\+_i\]/g) || []).length : 0;
    ok(b && !of.length && ix > 0, n + ': ' + ix + ' loops by index' + (of && of.length ? ', for...of back: ' + of.join('; ') : ''));
  }
  const notice = body('notice');
  ok(notice && !/VIEW\[oc\]\.forEach/.test(notice) && !/f = x =>/.test(notice), 'notice: no closure a call (the sensors by a loop, the ladder\'s step by ladK)');
}
H.done();
