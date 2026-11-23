# cf-pol-graficos, rodada 3: a chuva molha o chão (não testado além do que está abaixo)

Na chuva o chão e as estradas ficavam tão secos quanto num dia de sol: só a superfície da água recebia a chuva. Agora:

- `ENV.wet` vai até a força da chuva (`envWet`): depressa enquanto chove mais forte (`ENVW.up`, 20 s) e devagar quando seca (`ENVW.dry`, 150 s), pelo relógio da batalha (parado com a pausa). Um mundo que começa na chuva já começa molhado.
- O chão (`envTerrainHook`) escurece com ela, tem um brilho do sol mais fechado (`specularShininess`) e, olhado de raspão, reflete o céu (a cor da névoa). Nas partes planas, fora da areia, da neve e da faixa molhada da margem, ficam poças. Na Baixa ele só escurece.
- As estradas (`envRoadHook`) escurecem, os sulcos mais, e ganham um brilho do céu que cresce com a distância. Pela distância (`vRdD`) porque o Lambert do r128 não recebe `cameraPosition`.

## Testado
- `tests/rain-wet.js` (novo): como a umidade sobe e seca; os shaders do chão e das estradas declaram e recebem `uWet`; o quadro a atualiza; um mundo novo recomeça.
- Passam: `road-look` (com o conserto do teste para o #216, o mesmo do PR do fogo), `water-shore`, `gfx` e `ground-mesh`.
- Capturas na Média, de dia e à tarde, na chuva forte: a estrada, a câmera da batalha e uma de perto, no main e nesta branch. Tempo de GPU intercalado na mesma página, molhado × seco: mínimo 8,91 × 8,96 ms (não há custo que se meça).

## NÃO testado
- O capim, as árvores e as moitas não se molham: só o chão e as estradas.
- As poças são só cor e reflexo, sem relevo nem respingos, e saem do ruído do chão, não de onde a água correria.
- Não joguei uma partida com a chuva começando e parando (Variável), para ver o chão molhar e secar.
- Baixa e Alta não foram capturadas.
