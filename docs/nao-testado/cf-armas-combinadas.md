# Armas combinadas: tanques e infantaria em equipe (cf-armas-combinadas): quase nada testado

O que é (no main): bloco `combined arms (CA` no fim da simulação de `Céu de Ferro 3D.html`, só embrulhos (`step`, `AI.tank`, `AI.lav`, `squadThink`, `helpCands`, `helpUtil`, `helpPick`, `told`) e o procedimento `escolta-ca` em `DRILLS`; fora dele, `com-carro`, `cidade` e um parágrafo do README. Equipes tanque + esquadra (`caSide` a cada 4 s, 350 m, 525 m com a estratégia `arm`), separação (`caBreak`: morte, tarefa excluída, 700 m por 30 s, espera de 120/90 s; 60 s sem equipe depois), passo do mais lento (40 m no aberto, 30 m à frente em terreno fechado), infantaria à frente na cidade (assalto até 160 m à frente do tanque, até 120 s), `com-carro` com o tanque da equipe, `caSupport` (o tanque atira no contato da esquadra que ele mesmo conhece), `escolta-ca`, desembarque 160 m antes do terreno fechado, avistamento em 0,7 s dentro da equipe, pedidos W9 ao parceiro (+1, `helpRefuse`), `tripTo` do tanque que ficou a mais de 300 m, o jogador com esquadra ou tanque, log `ord` e contadores `S.caN`. `CA.on = 0` desliga.

## Testado (cf-pol-testes-a)

Leitura do código: `caSupport` só põe o tanque num contato que ele mesmo conhece (`known(A, u, o)`, `known(A.im, u, o)`), como a doc diz.

Rodada curta sem navegador (1944, semente 11, mapa v4, 48 s, a mesma partida com `CA.on` 1 e 0): com 1, 5 equipes formadas, 2 esquadras mandadas à frente, nenhuma separação, nenhum NaN; com 0, `S.caN` nem existe e não há equipe (nada roda). Em 48 s os pontos e os blindados perdidos são iguais (4 × 4 pontos, nenhum blindado perdido). Curto demais para dizer se a IA ficou melhor ou pior.

## Não testado

A máquina ficou com uma fila de memória (uma coisa por vez, no máximo 5 min, 20 a 40 min de espera por vez), e as suítes desta doc são grandes. Continua sem rodar:
- `drills.js`, `veh-drills.js`, `help.js` (com-carro, cidade, fire, clear), `perception.js` (honestidade e o `told` embrulhado), `field.js`, `squads.js`, `mission.js`, `campaign.js`, `frame-budget.js`, `sim-split.js`, as online.
- A/B de 15 min com `CA.on` 1 e 0 (placar, pontos, tanques perdidos para anticarro, tempo dos assaltos), `S.caN` e `escolta-ca` em `S.drN`.
- No navegador: tanque do jogador com a esquadra atrás, jogador a pé com o tanque esperando, convidado online.
- `dis`, `prio` e `escolta-ca` nunca apareceram (contaram 0 no smoke do autor e na rodada acima).

## Riscos

Ataques mais lentos ou parados (um espera o outro até 120 s), a esquadra à frente que larga a ordem por até 120 s, o `tripTo` que tira o tanque da missão, `com-carro` com homens 38 a 46 m à frente do carro em terreno fechado, o `told` mais rápido mudando o tempo de reação que `perception.js` mede, e o custo (duas `near()` e quatro `kindAt` por equipe a cada 1 s).

## Como testar

```sh
node tests/drills.js && node tests/veh-drills.js && node tests/help.js
node tests/perception.js
node tests/field.js && node tests/squads.js && node tests/mission.js && node tests/campaign.js
node tests/frame-budget.js && node tests/sim-split.js
```

A/B pelo harness: `c.$('CA').on = 0` contra 1, partidas IA × IA de 15 min, várias sementes, nas duas épocas, mapas 1 e 4. Uma sonda pronta: `REPO=<cópia> ERAS=ww2 MIN=15 node /home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/ca/probe.js`.
