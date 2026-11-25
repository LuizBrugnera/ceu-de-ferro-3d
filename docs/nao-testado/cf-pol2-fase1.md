# cf-pol2-fase1: o que não foi testado (fase 1 do quadro de polimento, leitura da tela)

Cada item tem o seu teste em `tests/` e foi visto num Chromium sem janela com GPU real, numa partida contra o `server.js` local (1280 e 1920 px). O que ficou de fora:

- **P7, passos.** O navegador de teste roda mudo (`--mute-audio`), então ninguém ouviu os passos. O que foi conferido: `tests/passos.js` (um passo a cada meia passada, nenhum parado ou a bordo, o volume pela distância e pela postura, no máximo 4 soldados por quadro além do jogador) e, no navegador, que andar com W chama `burst` com o baque grave dos passos, o que não acontecia antes. Falta ouvir: se o baque e o arrasto soam como passos, se o volume está certo ao lado dos tiros e se os passos do inimigo a 20 m ajudam ou incomodam. Como testar: entre de infantaria com som, ande, corra, agache e deite, e chegue perto de uma esquadra.
- **P9, munição.** O aviso de pente baixo foi visto com o pente posto em 5 e em 0 à mão, não numa troca de tiros de verdade.
- **P11, por que não dá para embarcar.** Visto com o soldado preso ao lado de um caminhão andando (posto ali a cada quadro, só para o print). Online, o convidado calcula o motivo com o que ele mesmo vê do veículo.
- **P24, escala do HUD.** Vista a 1280 e a 1920 px. Uma janela de mesa abaixo de 1000 px (agora no mínimo 0,8) não foi aberta no navegador; o teste confere a conta.
- **Quadros por segundo.** A máquina estava dividida com outras tarefas, e a mesma cena variou de 1 a 7 quadros por segundo entre rodadas iguais. Os números de cada PR estão no PR, mas não dá para tirar deles diferença de custo.
- **Celular e toque.** Fora por decisão do dono (D5 = C): a escala do HUD na tela de toque continua 0,62.
