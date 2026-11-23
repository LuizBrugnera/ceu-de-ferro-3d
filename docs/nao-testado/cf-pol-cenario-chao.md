# cf-pol-cenario: o chão desenhado e o que fica em cima dele

## Testado em 8bc0243 (cf-pol-testes-b, 2026-11-21): parte
- `tests/ground-mesh.js`: passa (29 ok). Nada do que falta (placa de vídeo, 1944 no navegador, ponte, tampas das trincheiras sobre a malha nova, casas) coube antes do prazo da tarefa.

## O defeito

A partida pisa em `hgtT`: a altura de um ponto é a mistura (bilinear) dos quatro nós da célula da grade (100 a 140 m de lado). A cena desenhava o terreno como um `THREE.PlaneGeometry`: dois triângulos planos por célula. Triângulos planos não desenham a mistura, e no morro os dois ficavam até 46 m um do outro (em média 0,3 m). Medido nos mapas da versão 11:

- cerca de 2000 árvores por mapa flutuavam mais de 0,5 m sobre o chão desenhado (até 18 m) e outras tantas afundavam nele;
- pedras e moitas flutuavam até 9 m, algumas sobre o rio;
- a fita das estradas, posta sobre `hgt`, ficava enterrada sob o chão desenhado (até 22 m) ou voava sobre ele (até 49 m) em uma amostra de cada sete;
- o chão desenhado atravessava o piso térreo de 15 a 38 casas por mapa (até 1,5 m).

O código das trincheiras já sabia disso (`meshH`, "o chão como a malha desenha, não como `hgt()` mistura") e contornava só para ele.

## O conserto (só na cena; a partida não muda)

- `fanMesh(T)`: a malha do terreno com quatro triângulos por célula em volta de um vértice no meio, na média dos quatro cantos (a mistura no próprio meio). O pior desvio da mistura cai para um quarto em teoria; medido, de 25,8 para 11,6 m no pior ponto e de 3201 para 434 pontos (de 20000) fora por mais de 0,5 m no mapa de hoje. Veículos e soldados, que pisam em `hgtT`, ficam bem mais perto do que se vê.
- `meshT(T, x, z)`: o chão desenhado, exato. A cena põe em cima dele o que não se move: árvores (de pé e caídas) e a sombra delas, pedras, moitas, capim, mato rasteiro, ruas das vilas, marcas de explosão e sombras de contato (estas duas no mais alto entre o chão desenhado e o da partida, para ficarem sobre o tabuleiro de uma ponte).
- `roadG`: a fita da estrada sobre o chão desenhado, e no canal de uma travessia sobre o aterro da partida (onde a ponte está e onde o chão desenhado mergulha no rio), misturado ao chão desenhado ao longo de uma célula de cada margem, sem degrau.
- Os nós da grade mantêm o índice (as pontes caídas afundam nós por índice); `br3Sink` agora também move o meio das células em volta de um nó afundado. Quem procurava o terreno pelo tipo `PlaneGeometry` ou pelo número de vértices (gráficos, sinalizadores, pontes) procura por `userData.ground`.

Por que não mudar a partida para o chão desenhado (`hgtT` com os triângulos): foi tentado e medido. Muda a batalha toda (o aterro de uma travessia do mapa de hoje mergulha no rio, uma batalha de `tests/bridges.js` já não tem esquadra livre aos 90 s), e as batalhas IA × IA são a régua da frente que reescreve o cérebro. Fica como próximo passo, com uma rodada própria da suíte inteira.

## Testado

- `tests/ground-mesh.js` (novo, no `all.sh`): a malha, `meshT` contra os triângulos da própria malha em 20000 pontos, a distância à partida antes e depois, a fita da estrada (sobre o chão, no aterro dos canais, sem degrau), o alicerce e o piso das casas, e uma varredura do código da cena para cada coisa posta sobre o chão desenhado.
- `tests/road-mesh.js`: o leito ROADH acima de `roadG`.
- Navegador (Chrome headless, SwiftShader, servidor em 127.0.0.1), Assistir em Hoje com 3 lados, batalha pausada, a mesma câmera presa: antes, moitas sobre o rio e troncos no ar na encosta (x 11883, z 4233); depois, tudo no chão. FPS 0,2 antes e 0,2 a 0,3 depois (máquina compartilhada com torneios, render por software); o terreno passa de 80000 para 160000 triângulos.

## Não testado

- Placa de vídeo de verdade: o custo dos 80000 triângulos a mais não foi medido fora do SwiftShader.
- 1944 no navegador (só no Node), as outras qualidades gráficas acima da 0, noite e neblina.
- Uma ponte caída e reconstruída no navegador (o meio das células em volta dos nós afundados).
- As tampas das trincheiras (FHOLE) sobre a malha nova: usam `meshH`, que agora é a malha nova, mas não foram vistas.
- Veículos e soldados continuam em `hgtT`: no pior ponto do mapa de hoje ainda ficam até 11,6 m fora do chão desenhado (no morro, longe das estradas).
- Casas: o chão desenhado ainda atravessa o piso térreo de 2 a 5 casas por mapa (até 0,44 m).
