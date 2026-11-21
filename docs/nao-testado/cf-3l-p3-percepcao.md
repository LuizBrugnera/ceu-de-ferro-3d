# cf-3l-p3-percepcao: percepção por lado (P3) — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida de 3 lados): um veículo do lado 1 visto só pelo lado 0 tem `sT(u, 0)` agora e `sT(u, 2)` nunca, `spotted(u, 0)` verdadeiro e `spotted(u, 2)` falso, e só o comandante do lado 0 o conhece (`cmdSense`); um lote do lado 2 identificado pelo lado 0 fica escondido só do lado 1 (`ecoHid`); a mina do lado 2 sob um veículo do lado 1 vira suspeita só do lado 1; em 20 s de batalha há alvos vistos por um inimigo só.

## O que falta

- A equivalência com 2 lados pelas suítes de hoje: `perception.js`, `seat.js`, `forts.js`, `sappers.js`, `comms.js`, `general.js`, `gen-cmd.js` (não rodaram: a máquina estava dividida, um processo pesado por vez).
- Leitores de `seenT`/`sx`/`sz` sem o lado (por exemplo `MSL.seen`, o HUD de quem assiste) com 3 lados: ninguém procurou vazamento numa partida longa.
