# cf-pol-modelos: ambulâncias e caminhões-oficina com traseira, para-choques e faróis (testado em parte)

## O que mudou

Nas quatro ambulâncias (Kfz. 31, WC-54, M997, UAZ-452) e nos quatro caminhões-oficina (Opel Blitz, GMC, M1089, Ural MTO-UB), os veículos de apoio feitos à mão (`buildTrn`, o embrulho dos `REC`):

- **Ambulância:** a cruz vermelha também nas portas de trás, com as bordas e as maçanetas das portas.
- **Caminhão-oficina:** as portas de trás, com a emenda e as maçanetas.
- **Os dois:**
  - para-choques na frente e atrás;
  - lanternas vermelhas atrás;
  - faróis na frente, com um pouco de luz própria.
  - Antes, vistos de trás, eram uma caixa lisa (branca, na ambulância).
- **Menos chamadas de desenho:** os detalhes viram uma malha por cor (`SVCL`) e a caixa continua uma malha à parte.
  - A ambulância desenhava 7 malhas e agora desenha 5.
  - O caminhão-oficina desenhava 13 malhas e agora desenha 6.
- Os triângulos sobem de 604 para 748 numa ambulância e de 676–816 para 784–924 num caminhão-oficina.
- O socorro de lagartas (Bergepanther, M88, BREM, M32) fica como estava: o embrulho das esteiras procura as caixas das lagartas dele.
- Só o visual: tamanho, caixa de acerto e peças de dano não mudam (estas peças não eram de nenhuma parte de dano).

## O que foi testado

- No navegador: a galeria do hangar dos oito, de lado e de trás, antes e depois (imagens na PR).
- `models`, `gfx`, `damage`, `art-models`, `aa-models` e `wheel-spin` passam.
- FPS na GPU de verdade, cena fixa sobre a cidade na batalha de demonstração, 3 rodadas alternadas de 15 s: main 37,0 / 45,3 / 43,0 fps (média 41,8), aqui 51,4 / 44,0 / 45,9 fps (média 47,1). Não há queda.
- Visto depois, na página: o destroço da ambulância e do caminhão-oficina (`buildTrn` com `wreck`) sai escuro, com o canal mais claro a 0,23 e 0,17, detalhes novos incluídos.

## O que NÃO foi testado

- Os oito numa partida (à noite).

## Como testar depois

1. Hangar, aba Transporte: as ambulâncias e os caminhões-oficina vistos de trás.
