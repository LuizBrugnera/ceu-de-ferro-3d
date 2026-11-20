'use strict';
/* What walking the game's flows in a browser found (cf-pol-fluxos) and is checked here without one. A second.
   - The icon: the page named none, so every browser asked the server for /favicon.ico, which answers only the page, and every load printed
     "Failed to load resource: 404" in the console. The page carries its own (a data: URI), so nothing is asked, from a server or from a file. */
const H = require('./harness'), fs = require('fs'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');

console.log('-- the page carries its icon: no /favicon.ico asked of the server --');
{
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const m = head.match(/<link rel="icon" href="([^"]+)">/);
  ok(!!m, 'a <link rel="icon"> inside <head> (Chrome reads the icon only there: one in the body still asked for /favicon.ico)');
  ok(!!m && m[1].startsWith('data:image/svg+xml,') && /%3Csvg[^"]*%3C\/svg%3E$/.test(m[1]), 'the icon is an inline SVG (data: URI), not a file the server would have to serve');
}
done();
