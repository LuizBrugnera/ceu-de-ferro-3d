# cf-pol-modelos: modelos da artilharia (testado em parte)

## O que mudou

Os nove modelos da classe Artilharia eram todos o mesmo casco de lagartas com uma caixa aberta (ou fechada) e um cano; os lançadores de foguetes não tinham tubo nem trilho nenhum, só a caixa vazia. Agora cada um tem o seu (bloco `ARTB` no começo da parte 3D, logo depois de `buildUnit`):

- **Lançadores de foguetes**: BM-13 Katyusha (caminhão Studebaker 6×6, capô, cabine, oito trilhos com um foguete em cima e outro embaixo de cada), BM-21 Grad (caminhão Ural, quarenta tubos em quatro fileiras numa base giratória), M270 MLRS (lagartas, cabine blindada na frente, dois casulos de seis), Panzerwerfer 42 (meia-lagarta blindada Maultier, dez tubos em duas fileiras no teto) e a técnica com Type 63 (picape, doze tubos num poste na caçamba). O lançador agora levanta pela ponta de trás, onde os de verdade se articulam.
- **Obuseiros**: Hummel e M7 Priest (casamata aberta; o Priest com o púlpito redondo da metralhadora, rodas do Sherman com os truques), M109A7 Paladin e 2S19 Msta-S (torre fechada, cano com evacuador de gases e freio de boca, cesto atrás da torre; a Msta com as saias de borracha sobre as lagartas). Lagartas com rodas de apoio, roda motriz e roda-guia.
- **O kit (`VK`)**: as peças de uma cor, de um nó e de uma parte de dano viram uma malha só; cada modelo custa 12 a 16 chamadas de desenho (antes, uns 10) e 1 a 2 mil triângulos (antes, 128 a 164; um tanque do pack tem de 3 a 11 mil).
- Só o visual: caixas de acerto, peças de dano, altura e ponto do tiro (`d.mh`, `d.bl`), IA, rede e regras não mudam. A torre (`tur`) continua girando e a arma (`gun`) subindo como antes.

## O que foi testado

- `node tests/art-models.js` (novo): cada modelo põe peças em todas as partes de dano da artilharia, as rodas e lagartas de cada lado no seu lado, nada do casco abaixo do chão, tudo dentro do comprimento e da largura do veículo (o cano pode passar da frente), e a boca do cano ou dos tubos a menos de 0,35 do ponto de tiro da simulação. Ele achou a boca dos tubos da técnica 107 mm 0,2 à frente dos tubos (consertado).
- No navegador (Chromium sem GPU, SwiftShader): a galeria do hangar de cada modelo, de frente e de trás; o destroço de cada um (todo escuro), a torre que voa como destroço, e o `damageLook` escurecendo cada parte sozinha (lagarta esquerda, direita, motor, arma, munição) sem mexer nas outras.
- Custo: cena só com 36 unidades de artilharia (4 de cada), mesma câmera, 1280×720, medido antes e depois (números na PR).

## O que NÃO foi testado

- Visto depois (GPU de verdade, demonstração): um BM-21 da IA atirando a salva na cidade, com o lançador levantado e os foguetes saindo (imagem na #178). Não vi os outros oito atirando, nem a torre girando por cima da cabine (o lançador do BM-13 e do Grad atravessa a cabine se a torre girar para a frente: a simulação deixa girar a volta toda), nem um destruído no meio da batalha.
- As rodas e lagartas não giram (nem antes giravam).
- O jogador dentro de um desses (visão externa e a luneta) não foi conferido com o modelo novo.

## Como testar depois

1. `npm start`, hangar, aba Artilharia, nas duas épocas e nos três lados: os nove modelos no carrossel.
2. Partida "Assistir" de Hoje e de 1944: achar a artilharia de cada lado (mapa), olhar a salva de foguetes saindo dos tubos e o obuseiro atirando; destruir um e ver o destroço.
3. Entrar num lançador de foguetes e girar a torre: ver se o lançador cruzando a cabine incomoda.
