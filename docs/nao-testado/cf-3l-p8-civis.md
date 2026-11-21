# P8 Civis e regras da guerra (W14) com N lados — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida de 3 lados): `civD().n` tem 3 lados; cinco civis de uma vila mortos pela Rússia fazem a vila odiar o lado 1 (`foe` 2) e armar a milícia para os Insurgentes (`civArms` 2); mortos também pelos Insurgentes, `foe` 6 e a milícia passa aos EUA (`civArms` 0); o diário dos EUA e o dos Insurgentes dizem "se voltou contra Rússia".

## O que falta

- A regressão com 2 lados (rodada 2): `civ.js` passa; `civ-war.js` falha em 7 pontos, igual no `main` e na página do começo desta tarefa: na cena de evacuação um atirador a 60 m do meio de uma vila de 310 m de raio só alcança 1 dos 14 civis no raio de 220 m do tiro (`CIV.hear.shot`), então a vila nunca chega a 25% assustados e não evacua. É o cenário do teste (vila maior que o ouvido), não a regra de 3 lados; falta refazê-lo. `civ-online.js` não rodou.
- O fogo indireto da IA insurgente perto de civis vistos: o diário dela deve dizer "Fogo suspenso" (`roeNote`).
- Online com 3 lados: a vila que se volta contra os Insurgentes aparece no feed do convidado (`civ` k 2 com o bit 4).
- `civState(t).towns` com `against` e `bySide`.
