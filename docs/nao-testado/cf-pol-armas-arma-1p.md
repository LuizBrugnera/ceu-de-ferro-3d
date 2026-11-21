# cf-pol-armas: o tiro da arma em 1ª pessoa (testado por suíte e no navegador, em imagens paradas)

## O que mudou

- **O clarão da boca era um quadrado.** O `SpriteMaterial` do clarão não tinha textura, então o sprite desenhava o quadro inteiro: um losango amarelo-claro de uns 13 cm na frente da arma a cada tiro, girando ao acaso. Agora ele tem uma textura feita uma vez num canvas (`vmFlashMat`): uma estrela de sete pontas em volta de um núcleo branco que some na borda. É um pouco maior (0,17 m no fuzil, 0,1 m na pistola), porque o brilho da estrela ocupa menos que o quadrado.
- **Cápsulas:** a cada tiro sai uma cápsula de latão da janela de ejeção, à direita da arma. No fuzil de ferrolho (Kar 98k, Springfield, Kar 98k ZF39) ela sai 0,45 s depois, quando o ferrolho corre; no lançador e no morteiro não sai nenhuma. Ela voa para a direita, para cima e para trás, girando, cai para fora da vista e some em 0,6 s. No máximo 6 no ar. Some também quando a arma sai da tela (veículo, luneta, morte) e com o movimento reduzido.
- **Coice:** no fuzil, o coice cresce com a bala (`vmKick`: o dano sobre 8, entre 0,8 e 1,8). O Kar 98k dá 1,6 e a M4 0,9. Cada tiro joga a arma um pouco para um lado e a gira (um sorteio novo por tiro), para que a rajada não seja sempre a mesma imagem. A vista a pé sobe com a mesma força. A pistola e o lançador continuam como antes.

## Testado

- `tests/arma-1p.js`:
  - a textura do clarão: o mapa, a borda transparente, a estrela, a textura feita uma vez e o `vmBuild` usando-a;
  - quando cada arma ejeta (14 armas e o morteiro);
  - o coice e a vista;
  - a cápsula: sai, voa para a direita, sobe, cai, some, no máximo 6, e some sem a arma na tela e com o movimento reduzido.
- Navegador (Chromium headless, 1000 × 625, partida moderna como Fuzileiro com a M4), o jogo congelado no quadro do tiro:
  - **antes**, `before-hip.png`: o losango claro na boca da arma;
  - **depois**, `after-hip.png`: a estrela, com uma cápsula no ar.

  FPS na cena congelada: 0,2 antes e 0,2 depois. A máquina está saturada e o WebGL é por software, então o número não separa as duas versões. Nenhum erro no console. Imagens em `/home/luiz/firstmate/data/cf-pol-armas/proof/arma/`.

## Não testado

- **Em movimento.** A 0,2 quadro/s não dá para ver a cápsula voar, nem a rajada com o coice variando.
- O tamanho novo do clarão (0,17 m) só nas contas: as imagens são de 0,12 m.
- A pistola, o fuzil de ferrolho mirando, as metralhadoras, e de noite (o clarão contra o escuro).
- Online (é só desenho, local).

## Como testar

`npm start`, entrar como Fuzileiro, **C** até a visão de olho, dar uma rajada da cintura e mirando: a estrela na boca, as cápsulas saindo à direita. Trocar para Schütze (Kar 98k): a cápsula sai quando o ferrolho corre, e o coice é maior. Entrar num veículo e voltar: nenhuma cápsula parada no ar.
