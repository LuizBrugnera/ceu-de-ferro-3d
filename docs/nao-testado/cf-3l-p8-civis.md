# P8 Civis e regras da guerra (W14) com N lados — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida de 3 lados): `civD().n` tem 3 lados; cinco civis de uma vila mortos pela Rússia fazem a vila odiar o lado 1 (`foe` 2) e armar a milícia para os Insurgentes (`civArms` 2); mortos também pelos Insurgentes, `foe` 6 e a milícia passa aos EUA (`civArms` 0); o diário dos EUA e o dos Insurgentes dizem "se voltou contra Rússia".

## O que falta

- A regressão com 2 lados (rodadas 2 e 3): `civ.js` passa e `civ-war.js` passa depois de consertar o teste: na cena de evacuação o atirador ficava a 60 m do meio do terreno de uma vila de 310 m de raio e só alcançava 1 dos 14 civis no ouvido do tiro (`CIV.hear.shot`, 220 m); a 60 m do meio das pessoas, a vila evacua, vai a um refúgio a 510 m do lado oposto aos tiros e volta com a calma (de 7 falhas para nenhuma). A partida IA × IA de 1944 do fim do teste não coube em 560 s. `civ-online.js` não rodou.
- O fogo indireto da IA insurgente perto de civis vistos: o diário dela deve dizer "Fogo suspenso" (`roeNote`).
- Online com 3 lados: a vila que se volta contra os Insurgentes aparece no feed do convidado (`civ` k 2 com o bit 4).
- `civState(t).towns` com `against` e `bySide`.
