# cf-pol-modelos: fuselagens redondas e lisas, pontas de asa arredondadas (testado em parte)

## O que mudou

Nos aviões e helicópteros feitos pelos números (todos menos o F-22 e o A-10, que têm modelo com textura):

- **Fuselagem** (`buildPlane`): cada trecho do perfil tem 14 lados em vez de 10 e sombreamento liso em vez de facetado. Isso vale para os aviões a hélice, os jatos e os helicópteros.
  - O casco continua o mesmo: perfil, comprimento, raio e cor.
  - O dano e o avião queimado escurecem a fuselagem como antes; o material continua um só por peça.
- **Pontas das asas e do estabilizador** (`WTIP`, `wingRound`): arredondadas nos seis aviões a hélice.
  - Quanto é arredondado depende do avião: o Spitfire fica quase elíptico; o Bf 109, o P-47, o Stuka, o He 177 e o B-17 só arredondam a ponta.
  - A curva fica dentro da asa quadrada que havia: raiz, bordo de ataque e envergadura iguais. A caixa de acerto continua a da asa quadrada.
  - Só o painel de fora é arredondado (`wingOuter`). O painel de dentro da asa de gaivota do Stuka segue reto, porque a ponta dele é a raiz do painel de fora.
- Só o visual: física, caixas de acerto, peças de dano, rede e IA não mudam.

## O que foi testado

- `node tests/plane-looks.js` ganhou uma parte das pontas de asa:
  - só os aviões a hélice feitos pelos números arredondam a ponta;
  - todo estabilizador é painel de fora;
  - o painel de dentro do Stuka não arredonda e o de fora arredonda;
  - em cada avião, o contorno arredondado começa na raiz da asa quadrada, segue o mesmo bordo de ataque e chega à mesma envergadura;
  - nenhum ponto sai da asa quadrada, o raio fica em até 0,3 da envergadura e a extrusão (espessura, giro, espelho do lado esquerdo) é a mesma.
  - O teste pegou um erro do protótipo: o estabilizador do Stuka passava por "painel de dentro", porque a ponta dele fica perto da raiz da asa de fora. Agora o painel seguinte também precisa ter a corda da ponta.
- No navegador: a galeria do hangar de todos os aviões e helicópteros, antes e depois, de lado e de cima (imagens na PR).
- Custo:
  - Cena só com 28 aeronaves (2 de cada uma das 14 feitas pelos números), SwiftShader: as chamadas de desenho ficaram iguais (792) e os triângulos foram de 24 024 para 27 736. O quadro ficou igual dentro do ruído da máquina carregada: mediana de 71,4 ms na main (3 rodadas) e de cerca de 71 ms aqui (8 rodadas), com rodadas iguais variando ±10 ms.
  - GPU de verdade (Intel UHD 770), cena fixa sobre a cidade na batalha de demonstração, 3 rodadas alternadas: main 44,4 / 44,7 / 50,2 fps (média 46,4), aqui 55,7 / 41,1 / 50,2 fps (média 49,0). O quadro mediano foi de 16,7 ms nos dois.
- Numa partida de verdade, um Spitfire em voo visto de fora, antes e depois (imagens na PR).

## O que NÃO foi testado

- O avião em voo com GPU de verdade (a partida foi vista no SwiftShader), e os jatos e helicópteros em voo.
- A asa cortada pela metade com a ponta arredondada: ela encolhe junto (`scale.z`), então a ponta continua redonda e mais curta, mas não foi vista.
- O Stuka com o painel de fora perdido: o painel de dentro, reto, fica à mostra.

## Como testar depois

1. `npm start`, hangar, aba Avião nas duas épocas: fuselagens lisas e pontas redondas nos aviões a hélice; aba Helicóptero: fuselagens lisas.
2. Partida num caça a hélice, câmera de fora: olhar o avião de cima e de lado em curva.
3. Arrancar a ponta da asa de um avião inimigo e ver o toco.
