# cf-pol-hud: polimento da interface (testado no navegador, não por suíte)

A parte da simulação ganhou teste em `tests/hud-start.js`: os avisos "… pronta" do começo e os tíquetes e pontos dos três lados em `genVM`. O resto é desenho na tela (o canvas do HUD, o hangar, a tela de fim, a Visão de General), e as suítes rodam no Node, sem DOM. Por isso foi visto num Chromium headless (Playwright, servidor em 127.0.0.1, 1280×720 e 1920×1080), não por um teste.

## O que foi visto na tela e não tem teste
- **HUD:** as distâncias dos aviões inimigos e os avisos flutuantes passam por `tagTxt` (a lista `HTAG.r`, esvaziada a cada quadro em `drawHud`). Um rótulo que cairia em cima de outro fica de fora; um aviso sobe até 3 linhas antes de ficar de fora. A linha de suprimentos não mostra mais "−0".
- **Hangar:** o resumo da missão tem 3 linhas e o atributo title com a frase toda, e diz "pelos EUA / Aliados / Insurgentes" (`pelaDe`). O PvP do quadro fica em até 380 px; com a tela até 820 px de altura, o recado "PvP online…" sai. Os créditos dos modelos aparecem inteiros (`#packCred`). O painel Partida não passa da borda de baixo.
- **Fim da partida:** o canvas do HUD fica oculto enquanto a tela de resultado está aberta (`.stage:has(>.over:not([hidden]))>#hud`), e o fundo da tela é mais escuro. Com três lados, cada inimigo aparece na cor dele (`foeCol`).
- **Visão de General:** a barra cabe em duas linhas em 1280 ("O jogo não pausa", com a frase longa no title, e a cadeira ao lado dos botões). Há uma aba e a tecla 3 para o terceiro lado. A tabela de forças tem uma coluna por inimigo: antes, `V.f[1 - V.t]` lançava "reading 'men'" a cada meio segundo para quem via o lado 2 (um jogador dos Insurgentes com Tab). Os rótulos das unidades (`gLabels`) não cobrem os nomes das vilas nem uns aos outros. Economia e obras não mostram mais "−0".

## Como conferir de novo
1. `HOST=127.0.0.1 npm start` e abrir `http://127.0.0.1:8080` em 1280×720 e em 1920×1080.
2. Entrar de avião e de tanque na Frente atual (três lados) e olhar o centro da tela nos primeiros 10 s: nenhum "Fábrica pronta" e nenhuma distância encavalada.
3. Hangar: a infantaria e o avião mostram a frase inteira, com "pelos EUA". Abrir Partida e conferir que o painel termina antes da borda.
4. Assistir (sem ninguém na sala), Tab, tecla 3: a Visão de General dos Insurgentes sem erro no console, com a tabela de forças mostrando EUA e Rússia.
5. Fim de partida (deixar o relógio acabar numa partida Curta): nada do HUD aparece por trás do resultado.
