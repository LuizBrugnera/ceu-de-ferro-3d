'use strict';
/* the hangar on a short screen (cf-pol-testes-b): at 1280×713 with a suspended match in the room, the empty status line, the two lines of
   "Partida suspensa…" and the "Nova partida" button took three rows of the dock, and the carousel shrank from 180 to 132 px: the chosen
   vehicle a 98 px model under its own name. On a screen 820 px high or less the note and the button share a row, the sentence whole in the
   note's title, and an empty status line takes no room. Layout is the page's CSS: read from the page, no DOM */
const fs = require('fs'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const rule = (html.match(/@media \(max-height:820px\)\{([^\n]*#susNote[^\n]*)\}\s*\/\*/) || [])[1] || '';
ok(!!rule, 'a short-screen rule for the suspended match\'s note');
ok(/#netStatus:empty\{display:none\}/.test(rule), 'an empty status line takes no room');
ok(/#susNote\{grid-column:1;-webkit-line-clamp:1\}/.test(rule), 'the note on one line, in the first column');
ok(/#btnFresh\{grid-column:2;justify-self:end\}/.test(rule), '"Nova partida" beside it, in the second column');
ok(/\$\('#susNote'\)\.title = \$\('#susNote'\)\.textContent = 'Partida suspensa nesta sala'/.test(html), 'the whole sentence stays in the note\'s title');
ok(/<p id="susNote" hidden><\/p>\s*<button class="chip" id="btnFresh"/.test(html), 'the note and the button are siblings in the room box (the grid places them)');
done();
