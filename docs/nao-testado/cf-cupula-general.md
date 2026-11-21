# O general da IA ergue a cúpula antifoguete (cf-cupula-general; testado em parte)

A cúpula entra no plano de fortificação (AFP, seção AFD): pedida sob fogo (6+ granadas e foguetes inimigos a 2 km em 4 min, ou artilharia, lançador ou morteiro inimigo conhecido ao alcance) ou por doutrina (nível 1 da economia ou 7 min), poupada num fundo (`d.afd`) que o passo da economia não vê, até 2 por lado; os Insurgentes não têm. Teste: `tests/cupula-general.js`.

Testado: `tests/cupula-general.js` na entrega (mapa v8, semente 3: o lado 0 ordenou aos 392 s e começou aos 512 s; o lado 1 ordenou aos 450 s). Em cf-pol-testes-a, de carona num exercício de obras (moderna, mapa v11, semente 5, 150 s): o lado 0 já queria a cúpula "sobre a cidade-sede: 9 granadas e foguetes inimigos caíram ali há pouco" (sem dinheiro, poupado 0/400), e o lado 1, com dinheiro posto à mão, já tinha ordenado a dele, "construtores a caminho (poupado 300/300 energia e 240/400 metal)".

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- `tests/cupula-general.js` com a última edição das asserções (20 min de partida).
- Três lados (mapa v9): os Insurgentes dizem uma vez que não têm cúpula e não poupam para ela; os outros dois erguem a sua; `aidSee` conta as granadas para o lado certo.
- Online: o convidado vê o número de cúpulas, não a última palavra do plano (`A.dmw` não vai pela rede).
- Se o construtor chega e termina em todos os mapas (v5 a v10); a esquadra de engenharia "em carona" (`aidRide`) parada dos 330 s aos 498 s (lado 1, semente 3, mapa v8), fora do escopo.
- O equilíbrio: o fundo segura 75% da renda até 7 min (mais a caminhada) e as obras pagas esperam (`aidPay`); `stkStep` enxerga o estoque inteiro; mísseis e o ataque estratégico não contam como fogo.
- O menu Fortificar do general jogador com a cúpula e a ordem dada por ele.

## Como testar

- `node tests/cupula-general.js` (`MIN=` muda a duração).
- Três lados: `C.watch('modern', { n: 3 })` no mapa v9, 150 s: no log `eng` dos Insurgentes, uma linha "os Insurgentes não têm cúpula antifoguete", e `afpOf(cmdOf(2)).save` nunca `big`.
- No jogo: Assistir, época de hoje; Visão de General, linha de obras (cúpulas) e o diário (ENG, "Plano de fortificação: cúpula antifoguete").
