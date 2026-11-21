'use strict';
/* The end of an online match (cf-pol-fluxos). Every match goes through the server, and when it ends the end screen says "Nova partida nesta
   sala em 25 s"; the host starts the next one when its clock (S.cq.left) reaches 0. That clock ran only inside step(), and the page's frame loop
   stops stepping the world once S.over, so it stayed at 25 for ever and the room never started again (seen in a browser: the host's end screen
   unchanged after a minute). overStep runs it from the frame loop. Also: online an abandoned vehicle is a fall (the server's deaths), and the end
   screen's "Suas quedas" counted only the deaths, so it said 0 beside a table that said 5. A second */
const H = require('./harness'), fs = require('fs'), { ok, done } = H;

function ended(host) {
  const c = H.load({ seed: 3 }), $ = c.$;
  $('Net').cq = true;   // a server that knows the conquest (welcome cq 1): every server of today
  c.newState('modern', 'f22', { net: true, cls: 'plane', mouse: true, host, len: 0 });
  const S = $('S'), Net = $('Net'), calls = { rm: 0 };
  Net.ui.rematch = () => { calls.rm++; };
  c.run(.5); $('cqEnd')(1, 2);   // the clock ran out (why 2), as cqStep ends it
  return { c, $, S, Net, calls };
}

console.log('-- the host: the clock to the next match runs with the world stopped --');
{
  const { $, S, Net, calls } = ended(true), Q = S.cq, CQ = $('CQ'), n0 = Net.cqn, t0 = S.t;
  ok(S.over && Q.ph === 1, 'the match is over (S.over, ph 1)');
  ok(Math.abs(Q.left - CQ.next) < 1e-9, 'the clock to the next match starts at CQ.next (' + CQ.next + ' s)');
  for (let i = 0; i < CQ.next - 1; i++) $('overStep')(1);
  ok(Math.abs(Q.left - 1) < 1e-6 && !calls.rm && Net.cqn === n0, 'after ' + (CQ.next - 1) + ' s of the end screen: 1 s left (' + Q.left.toFixed(2) + '), no new match yet');
  ok(S.t === t0, 'the world does not step while the end screen counts (S.t ' + S.t.toFixed(2) + ')');
  $('overStep')(1); $('overStep')(1); $('overStep')(1);
  ok(calls.rm === 1 && Net.cqn === n0 + 1, 'at 0 the host starts the next match once (rematch ' + calls.rm + ', match number ' + n0 + ' → ' + Net.cqn + ')');
}

console.log('-- a guest: its clock is the host\'s, it never starts a match --');
{
  const { $, S, Net, calls } = ended(false), n0 = Net.cqn;
  S.cq.ph = 1; S.cq.left = 2; S.over = true;
  for (let i = 0; i < 5; i++) $('overStep')(1);
  ok(!calls.rm && Net.cqn === n0, 'a guest does not start the next match by itself (it comes in the host\'s cq)');
}

console.log('-- the frame loop calls overStep while the end screen shows --');
{
  const html = fs.readFileSync(H.PAGE, 'utf8'), f = html.slice(html.indexOf('function frame(now) {'));
  const line = f.split('\n').find(l => /playMode === 'play' && S\.over/.test(l)) || '';
  ok(/overStep\(/.test(line), 'frame(): the S.over branch runs overStep');
}

console.log('-- online, an abandoned vehicle is a fall on the end screen too --');
{
  const c = H.load({ seed: 4 }), $ = c.$;
  $('Net').cq = true;
  c.newState('modern', 'abrams', { net: true, cls: 'tank', mouse: true, host: true, len: 0 });
  const S = $('S'); S.my.dead = true; $('playerDown')(null, true);
  ok(S.cq.st.d === 1, 'online: playerDown(left) counts a fall (' + S.cq.st.d + '), as the server\'s deaths do');
  const d = H.load({ seed: 4 });
  d.newState('modern', 'abrams', { cls: 'tank', mouse: true, len: 0 });
  const T = d.$('S'); T.my.dead = true; d.$('playerDown')(null, true);
  ok(T.cq.st.d === 0, 'away from a server an abandoned vehicle is not a fall (' + T.cq.st.d + ')');
}
done();
