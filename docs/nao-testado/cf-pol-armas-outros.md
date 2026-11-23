# cf-pol-armas: o som dos outros veículos e aviões (testado por suíte e no navegador, não de ouvido)

## Testado em 8bc0243 (cf-pol-testes-b, 2026-11-21): parte
- `tests/som.js`: passa (52 ok). O que falta é de ouvido (o timbre e o volume dos motores) e não dá para julgar num navegador sem tela nem som; não coube antes do prazo da tarefa.

## O que mudou

Até aqui só o veículo do próprio jogador tinha motor. Um tanque da IA passando a 20 m, um caminhão na estrada ou um caça baixo sobre a cabeça não faziam som nenhum; só o helicóptero dos outros tinha o seu (`fx.rotor`). Agora (`sndNear`, `SND.near`):

- **Veículos de terra:** os 3 mais perto do ouvido em movimento, até 450 m. Cada um tem o motor pelas marchas, o mesmo do jogador (`sndRpm`), com volume 0,7 do dele: metade a 30 m, mais abafado longe. Os de esteira batem os elos até 120 m. O parado não soa.
- **Aviões:** os 2 mais perto, até 3 km. O jato ruge pelo acelerador e o de hélice zune, com metade do volume a 300 m. O tom muda pelo efeito Doppler (0,6 do efeito inteiro, entre 0,6 e 1,6 vezes): o avião que se aproxima soa mais agudo e o que se afasta mais grave, e a passagem "cai". O avião parado na pista não soa, e o helicóptero continua com o rotor dele.
- Cada voz fica com quem está ouvindo enquanto ele continua entre os mais perto; só troca quando outro chega mais perto. Fora da partida, morto ou no fim, tudo fica quieto.

## Testado

- `tests/som.js`, a parte "the others heard":
  - seis tanques em volta: os 3 mais perto em movimento soam, mais baixo quanto mais longe; o parado, o do jogador e o a 600 m não;
  - o que chega perto toma a voz do mais longe, e os outros guardam as suas;
  - os elos batem perto e não depois de 120 m;
  - dois jatos a 800 m: o que se aproxima a 2373 Hz e o que se afasta a 994 Hz;
  - o helicóptero, o avião na pista e o a 4 km ficam fora, e tudo quieto sem ninguém para ouvir.

  O teste pegou um erro meu antes do PR: a voz recebia a distância no lugar do veículo.
- Navegador: veja o PR.

## Não testado

- De ouvido: o volume do motor dos outros contra o tiro e as explosões, e se 3 motores juntos cansam.
- Uma batalha cheia de verdade: muitos veículos passando, e a troca de voz quando dois estão quase à mesma distância.

## Como testar

`npm start`, entrar a pé perto da estrada da base e esperar as colunas passarem: o motor e as esteiras vêm e vão. Entrar de tanque e ouvir os outros perto. Ficar parado num campo aberto e esperar um caça passar baixo: o tom cai na passagem.
