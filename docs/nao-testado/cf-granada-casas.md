# Granada quebra as casas (cf-granada-casas): o que ainda falta testar

Testado (cf-pol-testes-a, no harness, com granadas de verdade: `lobbed` → `nadeStep` → `explode` com o `kg`; script em `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/nade.js` e `nade2.js`):
- **Granada encostada numa parede externa sem abertura**:
  - reboco lasca com 2 e fura com 3;
  - tijolo lasca com 2 e fura com 4;
  - pedra (igreja) lasca com 3 e fura com 6;
  - celeiro de madeira e galpão de chapa furam com 1.
  - Um pouco mais fraco que o doc dizia (4, 5 e 7), mas na mesma ordem.
- **Uma granada a 1 m da frente** quebra o vidro da janela daquele vão, e só ele.
- **Carga de 3 kg num cômodo do térreo de um sobrado**: o forro cai (estado 3) e as paredes do cômodo também.
- **Outras explosões a 1 m da frente de uma casa**: todas quebram o vidro.
  - Morteiro de 81 mm (1 kg) lasca a parede com janela (75%), RPG-7 também (84%).
  - Mina AP só quebra o vidro.
  - IED de estrada (5 kg) e carro-bomba derrubam a parede, e a casa fica de pé.
- **Carga na parede (`bldStep`)**: a parede some.
  - Do cômodo atrás, a porta da divisória e a janela somem (o extra do cômodo). Uma porta a 3 m vira buraco, um vidro vizinho quebra.
  - As paredes sólidas ao lado não levam nada.

**Achado de balanço (não mexi)**: a primeira granada no meio de um cômodo fechado de reboco quebra os vidros, abre a porta da divisória e deixa as paredes com uns 46%. A segunda e a terceira quase não fazem nada (45%). Com o vidro quebrado, o cômodo deixa de contar como fechado (`shut`). Aí a granada no meio do cômodo fica a ~2,3 m das paredes, quase no limite `wall × ∛kg` = 2,5 m. Então "2 abrem buraco" (item 1 do "como testar" antigo) não acontece. Ajuste em `CITY.chg` (`wall`, `conf`, ou contar o cômodo com o vidro quebrado) se o capitão quiser.

## O que ainda não foi testado
- **A granada lançada por um soldado numa partida** (tecla F do jogador e `CITY.ai.nade` da IA limpando prédio). Por exemplo, quantos buracos e lajes caídas aparecem numa vila numa partida de 20 min.
- **A IA usando o buraco novo** como entrada e abrigo (P1/P2/P3, `covBld`, `bldEnts`).
- **Online**: a granada do convidado vai pelo `Net.yh` e o buraco aparece nos dois. Precisa de `node tests/city-online.js` mais um teste com o convidado lançando.
- **Desempenho** com muitas granadas numa vila.
- **As suítes** `tests/city.js`, `city-online.js`, `infantry.js`, `brain-soldado.js` e `world.js` não rodaram de novo aqui. A linha de base do `main` estava sendo feita junto; comparar com ela.
