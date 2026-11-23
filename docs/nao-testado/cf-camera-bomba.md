# cf-camera-bomba: câmera das armas (bombas, mísseis, foguetes): testado em parte

O que é (no main): módulo `WCAM` antes de `boot()`. Quando o jogador local solta bomba ou dispara foguete ou míssil, uma janela no canto superior esquerdo segue a arma até ela acabar e fica ~2 s no estouro; **`** alterna com a tela cheia; Partida > "Câmera das armas": Desligada / Ligada / Com artilharia (`localStorage` `ceu-de-ferro-3d-camarma`). Render de 384 × 216 a 15 Hz.

## Testado (cf-pol-testes-a)

No Chromium sem tela (WebGL por software), 1280 × 800, partida moderna de B-2 a 500 m (imagens em `/home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/web/`):
- Os 3 botões de "Câmera das armas" existem, com "Ligada" marcado (`WCAM.mode` 1).
- `release` da GBU-31: a janela abre na hora (`WCAM.w`, tipo `BOMBA`) em x 12, y 58, 384 × 216, seguindo a bomba por trás e por cima (`bomb-inset.png`).
- **`** passa para a tela cheia (`WCAM.full`, rótulo "VOLTA À VISTA NORMAL", `bomb-full.png`).
- "Desligada" (`WCAM.mode = 0`): outra bomba solta, nenhuma janela.
- Página sem erro novo no console.
- **Visto:** a janela cobre o bloco de texto do HUD do avião (velocidade, altitude, armas, teclas): o texto fica desenhado por cima da imagem e as duas coisas ficam difíceis de ler. Não mudei o lugar: à direita, embaixo do mapa, fica o placar dos jogadores online; é decisão de leiaute.

## Não testado

- O fecho da janela no impacto + 2 s: com o WebGL por software a batalha anda devagar (poucos quadros por segundo), e 40 s depois a janela ainda estava aberta (não deu para saber se a bomba já tinha caído no relógio da batalha).
- Míssil guiado à mão (L) com o quadrado vermelho, foguetes, equipe AT/ATGM a pé, SAM, modo "Com artilharia", celular (sem a tecla `), FPS com a janela aberta, online com 2 jogadores, cor e brilho comparados com a tela.

## Como testar

`node server.js`; jato com bombas: soltar e ver a janela até o estouro + 2 s; **`**; helicóptero com míssil e **L**; "Com artilharia" com obus e morteiro; "Desligada"; online com 2 jogadores (só o dono vê a sua).
