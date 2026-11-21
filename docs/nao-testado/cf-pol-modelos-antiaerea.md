# cf-pol-modelos: modelos das antiaéreas (testado em parte)

## O que mudou

As quatro antiaéreas eram duas pilhas de caixas (uma para 1944, outra para hoje). Agora cada uma tem o seu modelo (bloco `AAB`, depois do da artilharia, com o mesmo kit `VK`):

- **Wirbelwind**: rodagem e casco do Panzer IV, a torre aberta de nove lados e os quatro canos de 2 cm do Flakvierling.
- **M16**: meia-lagarta (rodas na frente, lagartas atrás), capô blindado, a carroceria aberta e o reparo Maxson com as quatro .50, os cofres de munição e o escudo do atirador.
- **Pantsir-S1** e **NASAMS**: caminhão 8×8 (cabine na frente, carroceria, o gerador atrás) e na torre os dois blocos de tubos de míssil (Pantsir) ou de contêineres (NASAMS), os canhões, o radar de tiro na frente e o de busca no mastro.
- A torre (`tur`) e as armas (`gun`) ficam onde estavam e giram como antes. As partes de dano são as da antiaérea: casco, rodas, motor, gerador, armas, sensores.
- Cada modelo fica com 13 a 17 malhas e de 900 a 1330 triângulos (antes, 84 a 96).
- Só o visual: caixas de acerto (`AAGEO`), IA, rede e regras não mudam.

## O que foi testado

- `node tests/aa-models.js` (novo; com o `art-models.js`, usa `tests/vk-kit.js`). Confere:
  - peças em todas as partes de dano;
  - nada do casco sob o chão;
  - tudo dentro da caixa do veículo (`env`);
  - canhões, lançadores, radar de busca e mira desenhados onde estão as caixas de acerto deles (`gunL`, `gunR`, `radarS`, `sightW`).
  - Ele achou a mira do M16 a 0,6 da caixa dela (consertado).
- No navegador (Chromium sem GPU):
  - a galeria do hangar de cada uma;
  - o destroço de cada uma, todo escuro;
  - a torre como destroço;
  - `damageLook` escurecendo cada parte sozinha;
  - a partida entrando no Pantsir.
- Custo (36 antiaéreas sozinhas, 1280×720, SwiftShader): de 1 440 para 16 792 triângulos, de 120 para 248 chamadas, de 17–27 para 50–51 ms por quadro.

## O que NÃO foi testado

- Nenhuma delas vista numa partida atirando, girando a torre ou sendo destruída no meio da batalha.
- O radar de busca não gira, e antes também não girava.
- As rodas e lagartas não giram.

## Como testar depois

1. `npm start`, hangar, aba Antiaérea nas duas épocas: as quatro no carrossel.
2. Partida "Assistir": achar a antiaérea de cada lado, olhar o tiro contra um avião e a torre girando; destruir uma e ver o destroço.
