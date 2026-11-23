# cf-pol-armas: traçantes da metralhadora de esquadra (testado por suíte e no navegador)

## Testado em 8bc0243 (cf-pol-testes-b, 2026-11-21): ok (parte)
- `tests/tracers.js`: passa (8 ok).
- Navegador, Assistir de noite (Hoje): aos 33 s havia 58 traçantes no ar ao mesmo tempo, sem erro. Não deu tempo de tirar a captura de longe antes do prazo da tarefa.
- **Continua sem teste:** a traçante vista de 500 m na tela, o online.

## O que mudou

Toda bala já desenhava um risco curto. Só as dos veículos e dos aviões (`b.tr` 1 ou 2) tinham a cabeça luminosa da traçante, que se vê de longe; as da infantaria tinham `tr` 0. Agora a metralhadora de esquadra (MG 42, BAR, M249, PKP e qualquer arma com `lmg`) põe uma traçante a cada 4 balas (`TRC.lmg`), como uma fita de 4 para 1. Vale para o jogador e para a IA. O fuzil e a pistola continuam sem.

A conta é um contador na arma (`a.tn`), sem sorteio: a mesma semente dá a mesma batalha de antes.

## Testado

- `tests/tracers.js`: as 4 metralhadoras com uma traçante na 4ª, 8ª, 12ª… bala; M4, AK e M1911 sem nenhuma; e uma partida IA × IA de 40 s com a mesma semente, com e sem a mudança, com todos os soldados e veículos no mesmo lugar.
- Navegador (Chromium headless, 1000 × 625, Atirador de M249, partida moderna): uma rajada, o jogo congelado depois de 7 tiros. Antes: 13 balas no ar, nenhuma traçante (só os riscos). Depois: 12 balas no ar, 3 com a cabeça luminosa (os pontos laranja lá adiante na reta). Sem erro no console. Imagens em `/home/luiz/firstmate/data/cf-pol-armas/proof/trc/`.

## Não testado

- De noite, onde a traçante mais se vê, e de longe (a IA atirando a 500 m).
- Online: os fantasmas atiram pelo mesmo `manFire`, mas cada cliente conta as suas.

## Como testar

`npm start`, entrar como Atirador de M249 (ou MG-Schütze em 1944) e dar uma rajada longa: uma bala em quatro com a cabeça laranja. Assistir a uma partida de noite e procurar as rajadas das metralhadoras da IA.
