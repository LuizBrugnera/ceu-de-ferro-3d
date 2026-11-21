# P8 Civis e regras da guerra (W14) com N lados — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida de 3 lados): `civD().n` tem 3 lados; cinco civis de uma vila mortos pela Rússia fazem a vila odiar o lado 1 (`foe` 2) e armar a milícia para os Insurgentes (`civArms` 2); mortos também pelos Insurgentes, `foe` 6 e a milícia passa aos EUA (`civArms` 0); o diário dos EUA e o dos Insurgentes dizem "se voltou contra Rússia".

## O que falta

- A regressão com 2 lados: `node tests/civ.js`, `node tests/civ-war.js`, `node tests/civ-online.js` (não rodaram: a máquina estava dividida, um processo pesado por vez).
- O fogo indireto da IA insurgente perto de civis vistos: o diário dela deve dizer "Fogo suspenso" (`roeNote`).
- Online com 3 lados: a vila que se volta contra os Insurgentes aparece no feed do convidado (`civ` k 2 com o bit 4).
- `civState(t).towns` com `against` e `bySide`.
