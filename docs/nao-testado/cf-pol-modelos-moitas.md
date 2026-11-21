# cf-pol-modelos: moitas com folhas (testado em parte)

## Testado em 01a2c7d (cf-pol-testes-b, 2026-11-21): parte
- Navegador (GPU, ANGLE Vulkan), Assistir em 1944, câmera de comandante a 18 m de uma célula de mato denso do mapa v10: os tufos do mato rasteiro numa partida, com a textura de folhas, mais escuros embaixo e mais claros em cima, e sem cara de pedra. Nenhum erro no console.
- **Continua sem teste:** as sombras no Alta e a moita derrubada de perto.

## O que mudou

As moitas do mapa (v6 e v7, até 16 mil por mapa, desenhadas até 2,6 km) eram uma bola facetada de 80 triângulos com cor lisa. O mato rasteiro do mapa v10 era uma de 20 triângulos. As duas pareciam pedras verdes.

Agora (`bushGeo`, `bushTex`, `BUSHL`, antes de `buildWorld`), com os mesmos triângulos:

- **Moita**: quatro tufos sobrepostos de 20 triângulos, cada um no seu tom. Ocupa o mesmo volume da bola de antes, que é o tamanho que a simulação dá à moita.
- **Mato rasteiro**: um tufo só.
- Cada tufo é empurrado para dentro e para fora por algumas ondas e achatado embaixo.
- A luz vem de normais que saem do meio do tufo (macia, em vez das faces chapadas). A cor é mais escura embaixo e mais clara em cima.
- Por cima, folhinhas de uma textura cinza de 128 px, desenhada uma vez. A cor da moita e o tom de cada instância tingem a textura.
- A textura é projetada em cada face pelo eixo para onde ela mais aponta, para não esticar.
- A moita derrubada (achatada) continua igual: só muda a forma que a instância usa.

## O que foi testado

- No navegador (Chromium sem GPU):
  - um close de moitas antigas e novas lado a lado (imagens na PR);
  - as vistas fixas do mapa de hoje e do de 1944 (cidade, rua, ponte), com moitas.
- Custo: 4 000 moitas instanciadas, a velha e a nova na mesma página e na mesma câmera, alternadas:
  - 320 002 triângulos nas duas;
  - medianas de ~418 e ~420 ms por quadro no SwiftShader (ruído);
  - 80 triângulos por moita e 20 por tufo de mato, como antes.

## O que NÃO foi testado

- Sombras do sol no Alta (as moitas projetam sombra como antes; a forma mudou).
- A moita derrubada vista de perto.
- O mato rasteiro (mapa v10) numa partida: só o tufo isolado foi visto.
