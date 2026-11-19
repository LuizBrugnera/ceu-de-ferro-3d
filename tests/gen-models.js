'use strict';
/* writes into the page, as base64, each model of models/ (k.glb -> <script type="model/gltf-binary" id="glb-k">, ahead of three.js), which
   the planes with mdl.glb: k are drawn from: node tests/gen-models.js [PAGE=]. models.js fails when the page and the files differ */
const fs = require('fs'), path = require('path'), H = require('./harness');
const DIR = path.join(H.ROOT, 'models'), THREE_JS = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
const block = k => '<script type="model/gltf-binary" id="glb-' + k + '">\n' + fs.readFileSync(path.join(DIR, k + '.glb')).toString('base64').replace(/.{1,160}/g, '$&\n') + '</script>\n';
let html = fs.readFileSync(H.PAGE, 'utf8');
const ks = fs.readdirSync(DIR).filter(f => f.endsWith('.glb')).map(f => f.slice(0, -4)).sort();
for (const k of ks) {
  const open = '<script type="model/gltf-binary" id="glb-' + k + '">', a = html.indexOf(open);
  if (a >= 0) html = html.slice(0, a) + block(k) + html.slice(html.indexOf('</script>\n', a) + 10);
  else { const b = html.indexOf(THREE_JS); if (b < 0) throw new Error('three.js tag not found in ' + H.PAGE); html = html.slice(0, b) + block(k) + html.slice(b); }
}
fs.writeFileSync(H.PAGE, html);
console.log('wrote ' + ks.join(', ') + ' to ' + H.PAGE);
