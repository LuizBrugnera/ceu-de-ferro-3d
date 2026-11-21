# cf-pol-modelos: rodas que rodam (testado em parte)

## O que mudou

Os veículos andavam com as rodas paradas. Agora elas giram com o que o veículo anda, sem chamada de desenho a mais:

- Cada vértice de roda leva o meio e o raio da sua roda (atributo `aWheel`).
- Um trecho no shader do material (`spinMat`) gira esses vértices em volta do eixo (z) por `uSpin / r`.
- `uSpin` é a distância andada ao longo da frente do veículo. O `syncScene` soma essa distância a cada quadro (de onde ele estava para onde está; um salto maior que `WSPIN.jump` não conta).
- O valor é negativo de ré.

Quem roda:

- **Artilharia e antiaérea** (kit `VK`): rodas, rodas de apoio, roda motriz e roda-guia. O kit marca cada peça de roda (`K.W`).
- **Pack**: as peças redondas das partes `wheels`, `trackL` e `trackR` (`packSpinGeo`, uma vez por geometria). Uma peça conta como roda se for tão larga quanto alta, tiver todo vértice a até 1,12 raio do meio visto de lado e medir pelo menos 12% da altura do modelo. Entram:
  - os carros e caminhões (picape, SUV, sedã, Jeep e Kübelwagen, HMMWV, Tigr, M939 e os caminhões que o usam, HEMTT);
  - as rodas de apoio do M1A2, do M1A1 e do Sherman.
- As esteiras não andam (não têm textura para correr).
- Os tanques do Quaternius (T-34, T-55/T-62, Tiger, Panzer IV) e o T-72/T-90 têm as rodas na mesma peça da esteira: ficam paradas como antes.
- Destroço e hangar: rodas paradas.
- **Feitos à mão pelo `buildTrn`** (LAV-25, BTR-82A, BTR-70, Shilka, os veículos de rádio e os de apoio: ambulâncias, oficinas e socorro), onde o pack não pôs o modelo dele:
  - as rodas eram círculos pretos lisos; agora cada uma ganha um cubo de seis lados na face de fora, na segunda cor do veículo;
  - os cubos de um veículo são uma malha só e rodam pelo shader;
  - o pneu preto não muda (liso, o giro dele não se veria).

## O que foi testado

- `node tests/wheel-spin.js` (novo):
  - no kit, toda peça redonda no chão da artilharia e da antiaérea é roda, gira no próprio eixo e do seu lado, e só rodas e cubos são rodas;
  - no pack, nos `.glb` de verdade, cada carro e caminhão acha as suas rodas (4 a 12) e os três tanques com rodas soltas acham de 12 a 14;
  - nenhuma roda achada tem vértice longe do eixo nem eixo alto.
  - O teste pegou uma peça quadrada do HEMTT e uma do T-72 tomadas por roda (o critério só olhava a caixa); consertado com o teste do raio.
- No navegador:
  - na demonstração, um T-72 andando para a frente (a distância subiu de 2 para 49) e a técnica 107 mm de ré;
  - a técnica, o Abrams e o BM-21 com a distância em 0 e em 0,45, lado a lado: as rodas giram no lugar e o resto não se mexe.
- Custo: 36 unidades (Abrams, T-72, Tiger, Sherman, BM-21, M270, Paladin, Pantsir, Ural), antes × depois, duas vezes: mesmos triângulos (138 178) e chamadas (365); 246–249 contra 233–252 ms (ruído).

Custo dos cubos dos feitos à mão: 36 desses veículos (LAV-25, BTR-82A, BTR-70, M997, Sd.Kfz. 251, M577, UAZ-452, Kfz. 31, Shilka), antes × depois. Chamadas de desenho de 923 para 957 (uma por veículo), triângulos de 21 496 para 22 984, 72 contra 70 ms (ruído). Uma primeira versão com um cubo por roda custava +239 chamadas; juntei os cubos numa malha.

## O que NÃO foi testado

- As rodas de um veículo do convidado numa partida online (a distância vem da posição que chega pela rede, então devem rodar igual).
- As sombras do sol (Alta) mostram as rodas paradas: o material de profundidade não tem o trecho.
- Os cubos dos veículos feitos à mão só foram vistos parados com a distância posta à mão (0 e 0,45), não andando numa partida.
