# cf-pol-armas: o marcador de acerto (testado por suíte e no navegador)

## O que mudou

Até aqui, o acerto do jogador só aparecia como o texto flutuante sobre o alvo ("tronco", "+150 T-90A"). Agora, quando uma bala, um foguete, um projétil ou uma bomba do jogador fere um inimigo, aparecem quatro traços curtos em volta dele na tela, com um tique:

- **Acerto:** traços brancos, com borda escura, que somem em 0,3 s.
- **Morte:** se o inimigo morreu até o quadro seguinte, os traços ficam vermelhos e 40% maiores, por 0,7 s, com um tique mais grave. Online também: o fantasma morre quando o dono dele avisa.

Um marcador por vez, o do último acerto. Amigo, civil e dano zero não marcam. `localStorage` `cf-hm` `0` desliga.

Na simulação, `hitMine` chama `fx.hit` no começo de `damageMan`, `damageUnit` e `damagePlane`; o stub do harness não faz nada. O desenho fica no HUD (`hmDraw`, no fim de `drawHud`).

## Testado

- `tests/hitmarker.js`: quem chama `fx.hit` e quem não chama, uma M4 de verdade a 25 m (20 balas, 20 marcadores), e o desenho sobre um canvas que grava: cor, lugar, fade, morte, nada atrás do olho e o interruptor.
- Navegador (Chromium headless, 1000 × 625, partida moderna como Fuzileiro mirando): um inimigo posto a 18 m, a M4 nele. O jogo é congelado no quadro em que a primeira bala acerta e no quadro em que ele morre. Antes: só o texto "tronco". Depois: os traços brancos no acerto, vermelhos na morte. Sem erro no console. Imagens em `/home/luiz/firstmate/data/cf-pol-armas/proof/hit/`.

## Não testado

- De veículo (canhão do tanque, avião, helicóptero), com artilharia e bomba, de longe e online.
- Se o tique incomoda numa metralhadora contínua (ele toca no máximo a cada 60 ms).

## Como testar

`npm start`, entrar como Fuzileiro e atirar num inimigo perto e longe; de tanque, num carro; de avião, num caça. Conferir o branco no acerto, o vermelho na morte, e que o amigo atingido não marca.
