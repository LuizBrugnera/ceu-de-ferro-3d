# cf-lag-2: o índice das estradas (não testado além do teste focado, da impressão digital e da medição)

Continuação da cf-lag (#170, `docs/nao-testado/cf-lag.md`). Recomendação 1 dela: um índice espacial das estradas para `railOf`, `lsRail` e `ecoDepth`. O relatório completo, com o método e os números, fica em `/home/luiz/secondmate/data/cf-lag-2/`.

## O que mudou (`Céu de Ferro 3D.html`)
- **RIX**: os segmentos de um conjunto de estradas numa grade de quadrados de 200 m. A pergunta "qual a estrada mais perto deste ponto" lê só os segmentos dos quadrados em volta do ponto, anel por anel, e para quando nenhum segmento fora dos anéis lidos pode estar mais perto. Antes ela percorria todos os pontos de todas as estradas: 1085 segmentos no mapa 11 moderno com três lados; agora lê em média 19.
  - Dois conjuntos: as estradas principais (`S.T.routes`, para `railOf`) e as arestas da rede (`T.net.e`, para `netNear`).
  - A grade é feita na primeira pergunta. O terreno é compartilhado pelas partidas do mesmo mapa e as estradas não se movem. Ela é refeita quando uma estrada é acrescentada ou trocada. As arestas dos pontões (W20), que entram e saem durante a partida, ficam fora da grade e são lidas uma a uma depois dela, na ordem em que o laço antigo as lia.
  - Cada segmento guarda os números que o laço antigo calculava (o primeiro ponto, o passo, o comprimento com `Math.sqrt` para `railOf` e com `Math.hypot` para `netNear`, o `s` do ponto). Por isso a resposta é a mesma, até o último bit, e num empate vence o primeiro segmento, como antes.
  - Fora da grade (um ponto longe do mapa) ou com coordenada que não é número, a pergunta lê todos os segmentos, como antes (`railAll`, `netAll`).
- `railOf` e `netNear` não criam mais um objeto a cada segmento mais perto que encontram: guardam os números e criam um objeto no fim.
- `sOn` fora da estrada mais perto: as amostras de 50 m de cada estrada (as de `routeAt`) ficam guardadas (`RIX.sm`). Antes eram 200 a 300 chamadas de `routeAt`, cada uma com uma busca binária e um objeto, por pergunta.
- `lsRail` (usado por `ecoDepth`): fora das estradas do lado, não chama `railOf` de novo para cada estrada (a resposta era a mesma do início) e lê a distância da amostra que achou.

Nada muda nas regras do jogo nem nas decisões: as mesmas respostas, mais baratas.

## Testado
- `tests/road-index.js`: `railOf`, `netNear`, `sOn` e `lsRail` contra o código antigo, copiado no teste, em milhares de pontos (no mapa, fora dele, nos vértices das estradas, nas bordas dos quadrados, coordenadas que não são número) nos mapas 11 moderno com três lados, 11 de 1944 e 1 moderno. Também uma estrada e um pontão acrescentados e retirados no meio da partida.
- Impressão digital de batalha (semente 11, "Assistir" moderna com três lados, mapa 11, passos de 1/30 s, 180 s): main × este ramo, a cada 20 s, com as posições dos soldados e veículos, as obras, as esquadras, as operações dos três generais e o número de sorteios. Iguais. O medidor de população (`gpMeter`) lê o tempo da máquina, então foi fixado nas duas.

## NÃO testado
- Nenhuma suíte longa rodou além de `tests/road-index.js` e `tests/clock.js` (a máquina estava com a cota de CPU saturada por torneios).
- Um mapa feito por um mod ou por uma versão nova com estradas fora do retângulo do mapa: a grade cobre o retângulo das estradas mais 200 m. Fora dele a pergunta lê tudo, como antes, então a resposta não muda, só o custo.
