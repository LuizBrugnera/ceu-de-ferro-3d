'use strict';
/* What walking the game's flows in a browser found (cf-pol-fluxos) and is checked here without one. A second.
   - The icon: the page named none, so every browser asked the server for /favicon.ico, which answers only the page, and every load printed
     "Failed to load resource: 404" in the console. The page carries its own (a data: URI), so nothing is asked, from a server or from a file.
   - The analytics: the page sends its match's events (online by the host, Assistir by POST /ana) and the server keeps only the kinds it knows.
     The brain's cb events came after the server's list, and the server refused every batch with one of them: the watch page's console filled
     with 400s and no match ever reached the server's list (Partidas anteriores: "O servidor ainda não guardou nenhuma partida"). Here: every
     kind the page writes is one the server keeps (tests/ana-online.js: a stray one no longer drops its batch). And the watch page sent every
     piece with keepalive, which the browser refuses past 64 KiB in flight: the pieces of the end's flush failed ("Failed to fetch") and the
     match never got its end or its summary. Here: only the last piece goes keepalive, and only when it fits. */
const H = require('./harness'), fs = require('fs'), path = require('path'), vm = require('vm'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');

console.log('-- the page carries its icon: no /favicon.ico asked of the server --');
{
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const m = head.match(/<link rel="icon" href="([^"]+)">/);
  ok(!!m, 'a <link rel="icon"> inside <head> (Chrome reads the icon only there: one in the body still asked for /favicon.ico)');
  ok(!!m && m[1].startsWith('data:image/svg+xml,') && /%3Csvg[^"]*%3C\/svg%3E$/.test(m[1]), 'the icon is an inline SVG (data: URI), not a file the server would have to serve');
}

console.log('-- every analytics kind the page writes, the server keeps --');
{
  const srv = fs.readFileSync(path.join(H.ROOT, 'server.js'), 'utf8'), m = srv.match(/kinds: new Set\(\[([^\]]+)\]\)/);
  const kinds = new Set(m ? [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1]) : []);
  const page = new Set([...html.matchAll(/anaPush\(\{ k: '(\w+)'/g), ...html.matchAll(/\{ k: '(\w+)', t: anaR\(/g)].map(x => x[1]));
  const miss = [...page].filter(k => !kinds.has(k));
  ok(page.size >= 10 && !miss.length, 'the page writes ' + [...page].sort().join(' ') + '; the server knows them all' + (miss.length ? ' but ' + miss.join(' ') : ''));
}
console.log('-- a watch page posts its match: keepalive only on the last piece, and only under the browser\'s 64 KiB --');
{
  const a = html.indexOf('const AAR = { key:'), b = html.indexOf('const aarLocal', a), sent = [];
  const ctx = vm.createContext({ location: { protocol: 'http:' }, crypto: require('crypto').webcrypto, ANA: { S: { era: 'modern' } },
    fetch: (u, o) => { sent.push({ u, ka: o.keepalive, n: o.body.length, end: JSON.parse(o.body).end }); return Promise.resolve({ status: 200 }); } });
  ok(a > 0 && b > a, 'the page\'s AAR and ANA.post are where this test reads them');
  vm.runInContext(html.slice(a, b) + ';globalThis.AAR = AAR;', ctx);
  const ev = n => Array.from({ length: n }, (_, i) => ({ k: 'cb', t: i, s: 0, st: 'med', pad: 'x'.repeat(60) }));
  for (let i = 0; i < 12; i++) ctx.ANA.post(ev(80), false);   // a busy flush: twelve pieces of ~7 KB leave together
  ctx.ANA.post(ev(80), true);
  ok(sent.length === 13 && sent.slice(0, 12).every(s => !s.ka) && sent[12].ka && sent[12].end === 1, 'the pieces of a flush go as plain requests (no budget to run out of); the last, small, keepalive');
  const big = sent.length; ctx.ANA.post(ev(900), true);
  ok(sent[big].n >= ctx.AAR.ka && !sent[big].ka && ctx.AAR.ka < 65536, 'a last piece of ' + sent[big].n + ' bytes goes plain: past the budget a keepalive request is refused outright');
}
done();
