# Arma da infantaria em primeira pessoa com o modelo do pack (cf-arma-1p): testado em parte

O que é (no main): a pé, na visão de olho (`SEAT.inf`), a arma do kit é o modelo do pack (`VMW`, `VMP`) com mãos e braços, numa cena e câmera próprias (`VM.sc`, `VM.cam`, FOV 54°) desenhadas depois do mundo (`render3d` → `vmRender`); do quadril embaixo à direita, mirando o topo da arma sobe até logo abaixo da linha de visada e as marcas 2D de antes ficam por cima. Fallback para a arma 2D de antes com `?vm=0`, `?pack=0`, dentro de veículo e enquanto o GLB não chegou. Modelos novos `w_sniper.glb` e `w_pistol.glb` (Quaternius, CC0).

## Testado (cf-pol-testes-a)

No Chromium sem tela (WebGL por software), 1280 × 800, partida moderna como Fuzileiro (EUA), qualidade Média, imagens em `/home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/web/`:
- `launch-inf.png`: a M4 do pack aparece embaixo à direita, virada para a frente, com a mão de luva; o modelo é montado (`VM.on`, `w_m4`). É grande: ocupa o quarto inferior direito inteiro da tela.
- `m4-ads.png` (mirando, `camSt.ak` 0,6 subindo): a arma vem para o centro e a massa fica logo abaixo do ponto vermelho, dentro do anel do tubo; nada tapa o alvo.
- `k98-ads.png`: o Kar98k (trocado no lugar) mirando: a massa fica embaixo do centro do anel, mas a arma não fica reta embaixo do olho: a coronha sai do canto inferior esquerdo em diagonal até o centro.
- `rpg-hip.png`: o RPG-7 do quadril, embaixo à direita, apontando para a frente.
- `javelin-ads.png`: o Javelin mirando: a janela do buscador e "SEM ALVO NA MIRA" por cima; o tubo (verde-água bem vivo, a cor do modelo do pack) fica embaixo à direita e encosta no canto da janela, sem tapar o centro.
- `house-in.png`: dentro de uma casa a 2,5 m da parede, a M4 desenhada por cima, sem entrar na parede.
- O GLB da arma trocada chega depois de alguns segundos; nesse meio a arma some (fallback 2D), como a doc diz.
- Página: nenhum erro novo no console (só o 404 de sempre).

## Não testado

- Pistola, fuzil de precisão com luneta, morteiro, MG 42/BAR, e os kits de 1944 e dos Insurgentes com as cores de manga de cada lado (a troca foi feita no lugar, com a manga dos EUA).
- Movimento (balanço, recuo, recarga, troca, correr, clarão): só imagens paradas.
- Encostar numa parede, noite e neblina, `?vm=0`/`?pack=0`/`?packq=0`, FPS com e sem a arma, tela de 1920 e estreita, online.

## Como testar

`node server.js`, entrar como Fuzileiro, **C** até a visão de olho; trocar de kit no hangar (Atirador de M249, Javelin, Stinger, Rússia, Insurgentes, 1944, sniper, morteiro); andar, correr, atirar, recarregar, mirar; noite e neblina; `?vm=0`.
