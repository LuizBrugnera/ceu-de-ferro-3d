# cf-dobrar-pop: o dobro de infantaria e de veículos de solo da IA (testado em parte)

`GP.pop` 240 soldados, 48 veículos e 8 aeronaves por lado, `GP.cap` 480 (`IAI.cap`), `GP.scale` 2 nos veículos e esquadras do plano de produção, `GP.max` 40. O medidor de quadro (`GP.meter`, `popK`) não mudou.

Testado (cf-pol-testes-a): os números estão na página como o README diz; numa partida IA × IA sem tela (moderna, mapa v11, semente 5, economia ligada, 150 s), 165 e 163 soldados em campo por lado (o teto antigo era 120), `IAI.cap` 480, `popK` 0,9, e o plano pede o dobro (carros 6 e 5, esquadras 4 e 6).

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- Partida de 5 min por época no navegador (log do general com o medidor, aba Produção com campo/desejado até 240/48) e o custo por quadro de verdade: a medição da entrega mostrou `popK` caindo ao piso 0,5 em 60 s com a população dobrada.
- `tests/frame-budget.js`, `tests/mcp-general.js`, `tests/eco.js` e `tests/online.js` (podem fixar 120/24; o `mcp-general.js` usa 120 numa mensagem `ecs` feita à mão, não o `GP.pop`).
- Online com dois humanos: banda por convidado (pacotes `ai` de 64) e nenhum soldado parado (#35).

## Como testar

- `node tests/frame-budget.js`, `node tests/mcp-general.js`, `node tests/eco.js`, `node tests/online.js`.
- `node server.js`, Assistir moderna e 1944 por 5 min: o log do general (medidor) e a aba Produção.
