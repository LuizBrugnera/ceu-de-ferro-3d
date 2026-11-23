# cf-pol-hud: polimento da interface (testado no navegador, não por suíte)

## Testado em e91a33a (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Assistir em Hoje (3 lados), Tab e tecla 3: a Visão de General dos Insurgentes abre sem erro no console, e a tabela de forças tem uma coluna por inimigo ("Nossas · EUA · Rússia").
- Distâncias dos aviões e a lista de armas da cabine (F-22, mesma cena antes × depois): sem nada encavalado, a lista abaixo do painel de danos. O `drawHud` saiu de 6,4 para 4,2–4,3 ms (mediana; máquina cheia). `tests/hud-labels.js` (lote 2 desta tarefa) cobre o `tagTxt`, e `tests/town-names.js` o `drawTownNames(…, pt)`.
- Hangar: o resumo da missão leva a frase inteira no title.
- **Conserto no hangar** (cf-pol-testes-b, lote 5): a 1280×713, com uma partida suspensa na sala, a linha de status vazia, as duas linhas de "Partida suspensa…" e o botão "Nova partida" ocupavam três linhas do pé, e o carrossel encolhia de 180 para 132 px: o veículo escolhido virava um modelo de 98 px embaixo do próprio nome. Agora, em tela de até 820 px de altura, a nota e o botão dividem uma linha (a frase inteira no title da nota) e a linha de status vazia não ocupa lugar. O Abrams volta a aparecer (134 px). Teste: `tests/hangar-short.js`. Em telas mais altas nada muda.
- **Continua sem teste:** a tela de fim com o HUD oculto, a luneta do atirador (`scopeClip`), o drone com os óculos, o "pelos EUA" no hangar de Hoje e a escala do HUD em 1366 px.

A parte da simulação ganhou teste em `tests/hud-start.js`: os avisos "… pronta" do começo e os tíquetes e pontos dos três lados em `genVM`. O resto é desenho na tela (o canvas do HUD, o hangar, a tela de fim, a Visão de General), e as suítes rodam no Node, sem DOM. Por isso foi visto num Chromium headless (Playwright, servidor em 127.0.0.1, 1280×720 e 1920×1080), não por um teste.

## O que foi visto na tela e não tem teste
- **HUD:** as distâncias dos aviões inimigos e os avisos flutuantes passam por `tagTxt` (a lista `HTAG.r`, esvaziada a cada quadro em `drawHud`). Um rótulo que cairia em cima de outro fica de fora; um aviso sobe até 3 linhas antes de ficar de fora. A linha de suprimentos não mostra mais "−0".
- **Hangar:** o resumo da missão tem 3 linhas e o atributo title com a frase toda, e diz "pelos EUA / Aliados / Insurgentes" (`pelaDe`). O PvP do quadro fica em até 380 px; com a tela até 820 px de altura, o recado "PvP online…" sai. Os créditos dos modelos aparecem inteiros (`#packCred`). O painel Partida não passa da borda de baixo.
- **Fim da partida:** o canvas do HUD fica oculto enquanto a tela de resultado está aberta (`.stage:has(>.over:not([hidden]))>#hud`), e o fundo da tela é mais escuro. Com três lados, cada inimigo aparece na cor dele (`foeCol`).
- **Visão de General:** a barra cabe em duas linhas em 1280 ("O jogo não pausa", com a frase longa no title, e a cadeira ao lado dos botões). Há uma aba e a tecla 3 para o terceiro lado. A tabela de forças tem uma coluna por inimigo: antes, `V.f[1 - V.t]` lançava "reading 'men'" a cada meio segundo para quem via o lado 2 (um jogador dos Insurgentes com Tab). Os rótulos das unidades (`gLabels`) não cobrem os nomes das vilas nem uns aos outros. Economia e obras não mostram mais "−0".

## Rodada 3 (também só vista na tela)
- **Escala do HUD:** `hudU()` substitui os oito `clamp(cw / 1000, .62, 1)`. Dá 1 de 1000 a 1280 px de largura e, acima de 1280×674 de canvas, cresce até 1,25 pela largura e pela altura. Visto em 1280×720 (sem mudança), 1366×768 e 1920×1080 (avião, soldado, helicóptero, artilharia, transporte, mapa de tiro, mapa da batalha).
- **Luneta:** `scopeClip` recorta as marcas do mundo no círculo da luneta, como `sightClip` faz na ótica dos veículos.
- **Drone:** o feed do rádio começa 40·u abaixo, enquanto os óculos estão postos (`S.dr`).
- **Balões das falas:** no HUD e no RTS, do mais perto para o mais longe; um que cobriria outro fica de fora (`HTAG.r` no HUD, a lista `bub` no RTS).
- **Cabine do avião:** as armas começam em (36 + 150 + 10)·u, embaixo do painel de danos.
- **Mapas:** `drawTownNames(..., pt)`. Com `pt` igual a um número, o nome da vila com ponto desce esses pixels (mapa da batalha); com `'skip'`, sai (mapa do general, que escreve o nome do ponto).
- **Assistir:** `specCam` chama `specTag` quando o alvo muda. O botão `#btnInv` fica oculto em `startWatch`.

## Rodadas 4 a 8 (#177, #181, #188, #196; também só vistas na tela, salvo onde se diz)
- **Faixa escura sob o texto do centro:** no modo de construir (`S.bm`, `S.fm`, `S.mm`) e no kit do médico e no arrastar (o `say` de `hudMan` no bloco do médico), da largura da linha. Antes o texto em verde-claro ficava sobre o contorno da obra ou sobre o chão claro.
- **Aviso grande (`S.banner`):** o subtítulo sai em seminegrito com a sombra escura e quebra em linhas de no máximo `min(cw·0,5, 640·u)`. O título e o subtítulo descem para baixo da coluna de alertas e do rádio (`wy` de `hudWarn` mais as linhas de `S.feed`) quando ela chega até eles. Antes os dois escreviam um sobre o outro e o subtítulo encostava no placar em 1280.
- **Janela de troca e requisição em até 800 px de altura:** sem lugares de entrada, a ficha de carga fica com a altura (`.pick-in:not(:has(#swapSpawn:not([hidden]))) .fleet`); com eles (depois de morrer), a janela é mais baixa para o botão caber.
- **Visão de General com a cadeira:** a linha de teclas cabe numa linha (`.gen[data-hold] .gen-keys`), com a linha inteira no title. O resultado (`.gen-end`) escurece a vista por trás.
- **Vírgula decimal:** todo número da tela usa vírgula. Isto **tem teste**: `tests/hud-decimal.js`, uma varredura estática que falha se um `toFixed(1|2)` escrito na tela não vier com `.replace('.', ',')`.
- **Nome padrão:** sem nome, o jogador se chama "Jogador" na página e no `server.js` (era "Piloto", também para um soldado); `tests/relay.js` passa.
- **Faixa da conquista com três lados:** o nome do lado ("EUA", "RÚSSIA", "INS.") fica embaixo de cada contagem de tíquetes, na cor dele.
- **Online com dois jogadores:** visto com a página como anfitriã e um convidado sem tela pelo harness (`H.load({ WebSocket, host, mapv: 11 })` com `Net.ns0 = 3`). O placar do HUD, a barra ("2 jogadores na sala"), o aviso de entrada e a tabela de jogadores da tela de fim estão certos. Dois navegadores na mesma máquina não carregaram com o 3D por software.

## Como conferir de novo
1. `HOST=127.0.0.1 npm start` e abrir `http://127.0.0.1:8080` em 1280×720 e em 1920×1080.
2. Entrar de avião e de tanque na Frente atual (três lados) e olhar o centro da tela nos primeiros 10 s: nenhum "Fábrica pronta" e nenhuma distância encavalada.
3. Hangar: a infantaria e o avião mostram a frase inteira, com "pelos EUA". Abrir Partida e conferir que o painel termina antes da borda.
4. Assistir (sem ninguém na sala), Tab, tecla 3: a Visão de General dos Insurgentes sem erro no console, com a tabela de forças mostrando EUA e Rússia.
5. Fim de partida (deixar o relógio acabar numa partida Curta): nada do HUD aparece por trás do resultado.
6. Atirador de elite com a luneta (botão direito): nada fora do círculo. Operador de drone com os óculos (L): o nome do drone sem texto por cima.
7. Em 1920×1080, o HUD maior que em 1280 e sem nada encavalado. Assistir, depois F: a barra diz quem a câmera segue.
8. Construir (N) com o soldado e o kit do médico (5) com o médico: o texto do centro sobre uma faixa escura. U fora de um depósito: "SEM DEPÓSITO" com o subtítulo em duas linhas, longe do placar.
9. Com três lados, a faixa de cima: "EUA" embaixo da sua contagem, "RÚSSIA" e "INS." embaixo das dos inimigos.
