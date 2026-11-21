# cf-pol-modelos: bandeiras de pano que tremulam (testado em parte)

## O que mudou

As bandeiras eram placas duras: a do aeródromo, a da base de suprimento e a de cada obra da economia.

- Agora são **pano que tremula** (`FLAG`, `flagMesh`): um plano de 10 faixas do mastro até a ponta solta.
  - O shader de vértices move o pano numa onda que corre para fora, crescendo do mastro até a ponta.
  - A ponta cai um pouco.
  - A fase vem do lugar da bandeira, então duas bandeiras não batem juntas.
- O sombreamento é chapado, por faixa, então as dobras aparecem.
- As bandeiras ficam no mesmo lugar e no mesmo tamanho das placas e continuam na cor do lado (a do aeródromo com um pouco de luz própria, como era).
- **Custo:** um programa só para todas, e o tempo sobe com o quadro (`syncScene`), como as hélices. São 20 triângulos por bandeira (a placa tinha 12) e as mesmas chamadas de desenho.
- No dano, continuam fora do escurecer (`lookSup`, `lookEco`) e somem com a base, como antes.

## O que foi testado

- No navegador, GPU de verdade: a bandeira do aeródromo de dois ângulos, e as da base de suprimento e das obras (imagens na PR).
- Numa partida: 18 bandeiras desenhadas pelo programa da bandeira, e o tempo da onda subindo com o jogo.
- `airfields` e `eco-looks` passam com a bandeira no lugar da placa.
- FPS na GPU de verdade, cena fixa sobre a cidade na batalha de demonstração, 3 rodadas alternadas de 15 s: main 38,4 / 43,8 / 40,0 fps (média 40,7), aqui 50,6 / 42,0 / 51,7 fps (média 48,1). Não há queda.

## O que NÃO foi testado

- A onda vista em movimento por um jogador (a imagem é um quadro).
- A bandeira com sombras de verdade (qualidade Alta).

## Como testar depois

1. Uma partida: passar perto do mastro do aeródromo e de uma base de suprimento e ver as bandeiras tremulando.
