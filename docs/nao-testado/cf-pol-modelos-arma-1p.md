# cf-pol-modelos: braços e mãos da arma em 1ª pessoa (testado em parte)

## Testado em 01a2c7d (cf-pol-testes-b, 2026-11-21): ok, com um conserto
- Navegador, 1ª pessoa (assento a pé), mesma cena semeada: Fuzileiro de Hoje (M4), Schütze de 1944 (Kar98k), Operador de Javelin (o tubo no ombro) e Sniper de 1944 (Springfield com luneta). Os braços redondos e os punhos aparecem; nenhum erro no console.
- **Conserto**: no Kar98k (Schütze e Sniper de 1944) flutuava ao lado do fuzil um pente de 5 balas. Era um adereço solto que o modelo da fonte (`w_kar98.glb`) trazia ao lado da culatra, e que também empurrava para cima a caixa do fuzil: a luneta do Sniper ficava 7 cm acima e 3,4 cm ao lado da arma. Agora `PACK.cut` corta esse pente quando o modelo chega (`packCut`, depois de `packFix`), e a luneta fica apoiada na culatra, no meio do fuzil (o clarão da boca também). Teste: `tests/pack-cut.js` (no `all.sh`), sobre o `.glb` de verdade. O defeito já existia antes do #173.
- Custo: a mesma cena do Schütze, mediana de 31 quadros da cena: 74–195 ms depois e 89–122 ms antes. Ruído da máquina cheia.
- **Continua sem teste:** pistola, metralhadoras, morteiro e compartimentos (`slotVm`), correndo, recarregando e trocando de arma.

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
