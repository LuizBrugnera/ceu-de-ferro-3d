# cf-pol-modelos: cabines dos aviões e sombra no carrossel do hangar (testado em parte)

## O que mudou

- **Cabine dos aviões feitos pelos números** (`CANOPY`, no embrulho do `buildPlane`):
  - o vidro era uma bolha azul-clara, quase branca; agora é um vidro mais escuro, com brilho;
  - nos aviões a hélice (Stuka, Bf 109, Spitfire, P-47, He 177, B-17) ganha a armação na cor do avião: dois arcos atravessados e uma espinha por cima;
  - a armação vai na peça de dano do piloto, que escurece com ela, e queima com o avião;
  - o F-22 e o A-10 (com textura) não mudam.
- **Carrossel do hangar** (`preview`): uma sombra macia no chão sob o modelo, do tamanho dele, para ele ficar de pé no cartão em vez de flutuar. Vale em todos os cartões: avião, tanque, antiaérea, artilharia, infantaria, helicóptero e transporte.

## O que foi testado

- No navegador:
  - a galeria do hangar com Stuka, P-47, Bf 109, Spitfire, B-17, Su-25, Abrams, Tiger, Schütze, Strelok, BM-21 e Paladin (imagens);
  - o hangar de verdade a 1280 e a 1920 px de largura.
- Uma primeira versão da sombra, do tamanho do avião com as asas, escurecia o cartão todo; diminuí.
- Na 1920 a sombra convive com a elipse de palco que a #172 pôs sob o carrossel.

## O que NÃO foi testado

- A cabine vista de dentro, com a armação na frente do piloto.
- O destroço do avião com a armação.
- O carrossel no celular (toque).
