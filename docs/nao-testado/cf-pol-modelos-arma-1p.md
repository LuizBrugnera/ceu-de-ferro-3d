# cf-pol-modelos: braços e mãos da arma em 1ª pessoa (testado em parte)

## O que mudou

Na arma em 1ª pessoa (`vmBuild`), os braços eram caixas esticadas e as mãos, tijolos (`VM.box`). Agora:

- cada braço é um cilindro de 10 lados, mais fino no pulso (`VM.limb`);
- cada mão é um cubo puxado até a metade do caminho para uma bola (`VM.fist`): parece um punho fechado na empunhadura e no guarda-mão;
- as cores continuam as de antes, com sombreado macio em vez de facetado: manga na cor do uniforme do lado, luva escura hoje, pele em 1944.

A posição das mãos, o movimento, a mira, o tiro e a rede não mudam. O morteiro continua com a base de caixa.

## O que foi testado

No navegador (Chromium sem GPU), entrando numa partida a pé e trocando para a 1ª pessoa (C), antes e depois:

- fuzileiro russo com AK;
- Schütze de 1944 com Kar98k;
- da cintura e mirando (imagens na PR).

## O que NÃO foi testado

- As outras armas: lançadores no ombro, pistola, fuzil de precisão com luneta, metralhadoras.
- O morteiro e as armas dos compartimentos (`slotVm`).
- Correndo, recarregando e trocando de arma.
- O custo é desprezível: são 4 malhas por arma, como antes, com 40 a 80 triângulos cada; não medi.
