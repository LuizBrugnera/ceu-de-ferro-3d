'use strict';
/* starts the relay server under test on its own port (SERVER=<path>, default the project's server.js; PORT_T, default 8093), on this computer only
   (HOST 127.0.0.1 unless the environment says otherwise), and hands out sockets */
const { spawn } = require('child_process'), path = require('path'), WebSocket = require('ws');
const SERVER = process.env.SERVER ? path.resolve(process.env.SERVER) : path.join(__dirname, '..', 'server.js'), PORT = +process.env.PORT_T || 8093;
let child = null;
function start() {
  return new Promise((res, rej) => {
    child = spawn(process.execPath, [SERVER], { env: Object.assign({ HOST: '127.0.0.1' }, process.env, { PORT: String(PORT) }), stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.on('data', d => { if (String(d).includes('no ar')) res(); }); child.on('error', rej); setTimeout(() => rej(new Error('server did not start')), 5000);
  });
}
const stop = () => { if (child) child.kill(); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* a bare client: got[] is every message received; send(obj); wait(t) the next message of that type */
function raw() {
  return new Promise(res => {
    const ws = new WebSocket('ws://localhost:' + PORT), c = { ws, got: [], send: m => ws.send(JSON.stringify(m)), close: () => ws.close(),
      has: t => c.got.filter(m => m.t === t), wait: async (t, ms) => { for (let i = 0; i < (ms || 600) / 10; i++) { const m = c.got.find(x => x.t === t && !x.seen); if (m) { m.seen = 1; return m; } await sleep(10); } return null; } };
    ws.on('message', d => c.got.push(JSON.parse(d))); ws.on('open', () => res(c));
  });
}
module.exports = { start, stop, raw, sleep, PORT, WebSocket, SERVER };
