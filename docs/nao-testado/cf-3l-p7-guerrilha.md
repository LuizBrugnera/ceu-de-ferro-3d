# cf-3l-p7-guerrilha: doutrina insurgente (P7) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3.js`: `PERS.ins` fica fora do sorteio (`Object.keys(PERS)` sem `ins`) e vai só para o lado insurgente (`S.per[2]`), e `insT` só é verdadeiro para ele.
- Partida IA × IA × IA com economia e logística (semente 5, 56 s de jogo; a máquina estava dividida e mais não coube): o general insurgente mandou dois homens-bomba contra o posto inimigo de Vila do Moinho no começo, cobrou o imposto das vilas (`S.eco.d[2].irr.tax` 3, contrabando aberto), escolheu táticas de guerrilha (propaganda, mistura com a população, recrutar nas vilas, esconderijos, assédio; 27 linhas `grl`), localizou as duas sedes inimigas e planejou um cerco. No navegador, a revisão da partida mostrou o mesmo "Homem-bomba enviado".

Rodada 5 (partida IA × IA × IA de 246 s de jogo, semente 5, economia e logística): o general insurgente tentou o IED a cada 75 s (aos 0, 76, 153 e 229 s); até ter visto um veículo inimigo não havia estrada para ele, e aos 229 s, com o hábito formado, ordenou "IED ordenado junto a B · Encruzilhada: estrada habitual do inimigo (3 passagens); um IED de comando espera o primeiro veículo". Nenhum veículo da IA saiu fora das estradas do próprio lado.

**Achado, não consertado (plano de produção do general, outra frente):** o pedido de carro-bomba (`genCmd vbied car`) é recusado com `res` a cada 30 s, a partida inteira: nenhum carro-bomba entra na reserva (o plano de produção não os faz desde o cf-vbied, que passou a pedir a reserva), então o general insurgente nunca manda carro-bomba, só homem-bomba.

## O que falta

- Não apareceram (rodada 5, 246 s): o sapador plantando o IED ordenado, "IED de comando detonado", "Carro-bomba enviado" dirigindo fora do trilho, os FPV (até 4 no ar), a incursão de 60 s, a fuga do fustigamento, "Rota de contrabando cortada", "Sucata recolhida" e a oficina escondida numa vila. Rodar 10 min: `newState('modern', null, { watch: 1, N: 3 })` com `eco` e `lg`, e procurar essas linhas no diário do lado 2.
- O disfarce: um insurgente parado numa vila a 300 m de um tanque da IA não leva tiro; a 100 m ou depois de atirar, leva.
- Regressão de 2 lados: `sappers`, `drone`, `civ`, `ambush`, `frame-budget`; online, IEDs, bombas e oficinas só no anfitrião.
