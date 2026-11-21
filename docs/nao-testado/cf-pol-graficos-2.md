# cf-pol-graficos, rodada 2: água e estradas (não testado além do que está abaixo)

Polimento dos gráficos do que já existe, visto na GPU daqui (RTX 4060, Chrome headless com ANGLE/GL), com capturas antes × depois na mesma semente e câmera. O que mudou e o que ficou sem teste.

## Água (Média e Alta; a Baixa segue com a água antiga)
- O shader da água lê a altura do terreno (`envBedTex`: as alturas da malha desenhada, uma por ponto da grade) e monta os mesmos dois triângulos por célula que a malha do three.js r128 (`envBed`). Com a profundidade: o raso perto da margem é mais claro e deixa ver o leito, e uma faixa de espuma quebrada bate na beira. A faixa tem a largura medida no chão (pela inclinação do leito, `envSl`), não na profundidade, e some onde ficaria mais fina que um ou dois pixels.
- As ondulações: a segunda camada vai girada e as duas ficam mais fortes ou mais calmas em manchas largas, então a repetição da textura não aparece. A chuva (`uRain`) encrespa a superfície.
- O chão (`envTerrainHook`): uma faixa molhada e mais escura acima da linha d'água e o leito debaixo da água escurecido e esverdeado com a profundidade (`uWL`).
- A queda de uma ponte afunda a malha do terreno: `envBedSync` reenvia a textura quando a versão das posições muda.

## Estradas
- **Bug (desde #100, 19/11):** cada classe de estrada desenhava só a primeira estrada. Os índices de cada fileira contavam do começo da própria estrada (`i * NC`), então todas as estradas da classe caíam sobre os vértices da primeira. No mapa 11 da época moderna eram 12 estradas principais, 15 secundárias, 4 trilhas e 13 estradas de terra, e na visão 3D só uma de cada aparecia. Os mapas 2D desenham as estradas por conta própria, por isso nada no jogo dependia disso.
- As estradas e as ruas das vilas (`cityScene`) agora tomam a luz do sol, do céu e dos sinalizadores (`sky3Ill`), como o chão. Antes eram planas e escurecidas à mão à noite, quando ficavam mais claras que tudo em volta. Ganham manchas, desgaste nas bordas, sulcos de roda e coroa de mato nas de terra, e uma faixa tracejada gasta na estrada principal moderna. Asfalto e ruas ficam um tom mais escuros e gastam menos nas bordas.
- As pontes acham as estradas pelo marcador `userData.road` (antes, pelo material `MeshBasicMaterial`).

## Testado
- `tests/water-shore.js`, `tests/road-look.js` (novos), `tests/gfx.js`, `tests/veg-fade.js`, `tests/sparks-light.js`.
- Capturas antes × depois de dia, de noite e na chuva, na Média, e o tempo de GPU na Média e na Alta (veja o PR).

## NÃO testado
- Uma partida jogada com as estradas inteiras: carros e soldados andam pela simulação, que não mudou. Ainda não foi visto se a estrada desenhada, agora inteira, bate com o caminho dos veículos em todo o mapa: o convés fica 0,35 m acima de `hgt` (bilinear), e a malha do terreno é triangulada, então em lombadas o terreno pode cobrir a estrada.
- Uma ponte caindo de fato no jogo, com a água e as estradas novas. Só foi testado com stubs: a textura do leito é reenviada e `br3Init` acha as estradas.
- A Baixa: nela a água segue a antiga e as estradas ficam iluminadas, mas não foi capturada.
- WebGL 1 (sem WebGL 2): a água pede `derivatives` e uma textura float (`OES_texture_float`), e nada disso foi visto rodando.
- Nas capturas por script, cerca de 1 quadro em 10 sai sem a água, também no main (1024247, com a água antiga): é o primeiro quadro depois de pular a câmera, e quem muda é sempre outro quadro. A causa não foi achada. Não se sabe se o jogador vê esse quadro sem água numa troca de câmera.
