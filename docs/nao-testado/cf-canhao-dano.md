# cf-canhao-dano: tiro do canhão do tanque atravessava a infantaria (testado em parte)

**Causa e conserto** (já no main): em `stepShots` os projéteis de `S.bombs` só testavam veículos e aviões; agora `hopBox` e `hopMan` varrem o salto inteiro e o primeiro corpo atingido (veículo, soldado ou civil) leva o tiro. Regressão: `tests/shell-hits.js`.

**Testado (cf-pol-testes-a):** `tests/shell-hits.js` passa na cópia (26 ok); e uma sondagem sem navegador nas duas épocas, chão plano, perfurante e explosiva a 600 m: civil em pé morre; soldado agachado atrás de sacos de areia: os sacos param o tiro e ele só leva o estouro (perfurante tira 1,8 a 2,7 de 22; explosiva 10,6 a 20,8); deitado, mira a 0,62 m: morre; foguete Hydra a 150 m mata o soldado em pé; RPG-7 a 40 m: impacto direto (84) mais o estouro, morre.

**Não testado:**
- As outras suítes (`shells.js`, `damage.js`, `infantry.js`, `cover.js`, `civ.js`, `frame-budget.js`, `soak.js`): a fila de memória da máquina só deixou rodar uma coisa por vez.
- Online (`online.js`, `damage-relay.js`): convidado de tanque atirando em infantaria.
- No navegador: o tiro do jogador (mira, `drive`) e da IA numa partida; o custo por quadro numa batalha cheia.
- O balanço: tanque bem mais letal contra infantaria (de propósito).

**Riscos que continuam:** deitado com mira baixa (0,3 m) o tiro bate no chão uns 20 m antes e não fere (regra antiga do chão, medido); o ponto de impacto em veículo mudou (entrada do casco), o que `shells.js` pode acusar.

**Como testar:** `node tests/shells.js`, `node tests/damage.js`, `node tests/infantry.js`, `node tests/cover.js`, `node tests/civ.js`, `node tests/frame-budget.js`; `PORT_T=<porta> node tests/damage-relay.js`; no jogo, tanque contra soldado em pé a 150 m e 1 km, atrás de muro, e online com o convidado de tanque.
