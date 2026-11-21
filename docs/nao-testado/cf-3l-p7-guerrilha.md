# cf-3l-p7-guerrilha: doutrina insurgente (P7) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3.js`: `PERS.ins` fica fora do sorteio (`Object.keys(PERS)` sem `ins`) e vai só para o lado insurgente (`S.per[2]`), e `insT` só é verdadeiro para ele.
- Partida IA × IA × IA com economia e logística (semente 5, 56 s de jogo; a máquina estava dividida e mais não coube): o general insurgente mandou dois homens-bomba contra o posto inimigo de Vila do Moinho no começo, cobrou o imposto das vilas (`S.eco.d[2].irr.tax` 3, contrabando aberto), escolheu táticas de guerrilha (propaganda, mistura com a população, recrutar nas vilas, esconderijos, assédio; 27 linhas `grl`), localizou as duas sedes inimigas e planejou um cerco. No navegador, a revisão da partida mostrou o mesmo "Homem-bomba enviado".

## O que falta

- Não apareceram em 56 s (o IED sai a cada 75 s, o carro-bomba a cada 90 s): "IED ordenado", o sapador plantando, "IED de comando detonado", "Carro-bomba enviado" dirigindo fora do trilho, os FPV (até 4 no ar), a incursão de 60 s, a fuga do fustigamento, "Rota de contrabando cortada", "Sucata recolhida" e a oficina escondida numa vila. Rodar 10 min: `newState('modern', null, { watch: 1, N: 3 })` com `eco` e `lg`, e procurar essas linhas no diário do lado 2.
- O disfarce: um insurgente parado numa vila a 300 m de um tanque da IA não leva tiro; a 100 m ou depois de atirar, leva.
- Regressão de 2 lados: `sappers`, `drone`, `civ`, `ambush`, `frame-budget`; online, IEDs, bombas e oficinas só no anfitrião.
