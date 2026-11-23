# cf-pol-modelos: radares de busca que giram; a asa arrancada voa com a insígnia (testado em parte)

## O que mudou

- **Radares de busca que giram** (`RADAR`; `K.radar` no kit, `AAB`): o do Pantsir-S1 e o do NASAMS.
  - O radar fica num nó próprio no alto do seu poste, sobre a torre, e gira sem parar (2,6 rad/s, cada um partindo de um ângulo seu).
  - Ele gira enquanto o veículo vive e o radar de busca (`radarS`) não foi destruído. O do destroço fica parado.
  - Ele continua na parte de dano `sensor` (escurece e some como antes) e no lugar da caixa de acerto `radarS`.
  - O da Shilka não gira, porque é a capturada, que só tem a mira óptica.
  - Custo: uma chamada de desenho a mais por veículo (o radar é uma malha à parte, para poder girar) e nenhum triângulo a mais.
- **Conserto: a asa arrancada voava sem a insígnia.**
  - `debrisMesh` escondia todas as malhas do avião e mostrava de volta só as da peça, não as filhas delas. A insígnia é filha da malha da asa.
  - Agora a peça que voa mostra o que leva, escurecida como ela.

## O que foi testado

- `node tests/debris-look.js` (novo) roda `debrisMesh` da página contra um modelo que só registra as peças, com as tabelas de peças de verdade dos aviões:
  - a asa (ou a ponta) do Bf 109, do Spitfire e do B-17 voa com a sua insígnia, escurecida como ela, e nada mais do avião aparece.
  - Falha na main (a asa sai sem a insígnia) e passa aqui.
- `node tests/aa-models.js` ganhou os radares: o do Pantsir e o do NASAMS ficam no nó próprio sobre a torre, com as peças em volta do eixo e todas na parte `sensor`; os outros veículos não têm radar que gire. O nó entra em `tests/vk-kit.js` (`K.radar`, e `at` passa por ele).
- No navegador, GPU de verdade:
  - numa partida moderna, os dois Pantsir e os dois NASAMS da batalha giraram o radar (+2,08 rad cada um em 4 s);
  - a peça de asa do Bf 109, do Spitfire e do B-17 com 1 malha e nenhuma insígnia na main, e com a asa e a insígnia aqui.
- FPS na GPU de verdade, cena fixa sobre a cidade na batalha de demonstração, 3 rodadas alternadas de 15 s: main 46,8 / 41,1 / 55,5 fps (média 47,8), aqui 40,5 / 45,9 / 52,1 fps (média 46,2). Os pares vão para os dois lados (−6,3, +4,8, −3,4): fica no ruído.
- Visto depois, numa partida moderna (GPU de verdade): com o radar de busca de um NASAMS destruído (`radarS` a 0), o radar dele parou (0 rad), e os outros três giraram 13,48 rad no mesmo tempo.

## O que NÃO foi testado

- A asa arrancada vista voando numa partida.

## Como testar depois

1. Uma partida moderna: chegar perto de um Pantsir ou de um NASAMS e ver o radar girando; destruir o radar e ver ele parar.
2. Arrancar a asa de um caça inimigo e ver a insígnia na asa que cai.
