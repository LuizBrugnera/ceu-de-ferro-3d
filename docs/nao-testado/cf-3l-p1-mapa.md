# cf-3l-p1-mapa: mapa de 3 lados (P1) — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`): o mapa versão 9 com 3 lados tem 3 bases; as estradas têm as pontas `[0,1]` × 3, `[0,2]` (R_EI) e `[1,2]` (R_RI), com comprimento e meio; a sede do lado 2 fica em HS2 e a vila K (Vila do Carrascal) existe; `myRoutes` dá 0 → [0, 1, 2, 3], 1 → [0, 1, 2, 4], 2 → [3, 4]; 17 pontos, um ponto de base por lado; as 4 jazidas do lado 2 em chão seco, plano e fora da estrada; com 2 lados o mapa 9 continua com 2 bases e 3 estradas `[0,1]`. Uma partida de 3 lados roda com economia, logística e análise ligadas, sem exceção nem NaN.

## O que falta

- Na tela, visto em parte (navegador, partida de 3 lados): no mapa da Visão de General aparecem o Esconderijo (B2), a Aldeia do Açude (HS2, sede insurgente), a Vila do Carrascal (K) e as rotas 4 e 5; no 3D, os galpões de B2. Falta olhar de perto as estradas novas no 3D (retas, cruzando morro ou mata) e os lotes da sede HS2. No mapa, o nome "Aldeia do Açude" sai duas vezes, uma em cima do círculo do ponto N.
- Regressão de 2 lados nos testes de mapa (`tests/roads-ops.js`, `tests/roads-net.js`, `tests/cover*.js`, `tests/city*.js`, `tests/capture.js`): não rodou (a máquina estava dividida, um processo pesado por vez).
- Ids 220–225 da base B2: ninguém conferiu se algo mais usa essa faixa.
