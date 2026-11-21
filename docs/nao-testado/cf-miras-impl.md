# Miras e projéteis (remake visual): o que mudou e o que não foi testado

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): ok, com dois consertos
- Navegador, 12 cenas montadas pelo atalho do console (`newState` + `buildWorld`), cada uma em 1280 e 1920 px, sem erro no console: Tiger de noite e com neblina, Abrams de noite com neblina e de dia, Hummel e Paladin no mapa de tiro, Wirbelwind de noite, Pantsir (EO), F-22 (HUD), Stuka (Revi), B-17 de noite no visor, B-2 no visor e AH-64.
  - Óticas de 1944 de noite: o retículo do Tiger fica âmbar e aceso, sem textos, com o anel de recarga. O anel da Wirbelwind fica âmbar e sem números.
  - Abrams: retículo vermelho aceso de noite e o círculo pequeno da queda no centro; dentro da luneta, nenhum texto.
  - Visor do B-17 de noite: a faixa da salva tracejada e os ◇ de cada bomba, âmbar, com as bombas restantes em pontos. B-2: a tela de alvo cinza com a faixa.
  - Mapa de tiro: prancheta em 1944, tablete hoje.
- **Dois defeitos achados** (o cf-pol-hud, #172, achou e consertou os mesmos ao mesmo tempo; ficou a versão do main, com o número do painel tirado de `DMGP`):
  - **Cabine do jato**: na cabine (assento com painel) a lista de armas começava em 170 u, 16 u dentro do painel de danos, e a 1ª linha ("BTN ESQ M61A2 480") ficava escondida sob ele. Agora começa abaixo do painel.
  - **Aviões inimigos**: vários aviões juntos na tela (uma formação a 15 km) escreviam as distâncias umas sobre as outras. Agora `tagTxt` escreve o travado e depois o mais perto, e deixa de fora (ou sobe uma linha) o que cairia em cima.
  - Teste dos dois: `tests/hud-labels.js` (no `all.sh`), sobre o código do main; a página anterior falha 4 checagens.
- Custo: `drawHud` na mesma cena do F-22 (semente 7, parada), mediana de 31 chamadas: 6,4 ms na página de antes e 4,2–4,3 ms na página mesclada (duas rodadas). A máquina estava cheia, então isso só mostra que não piorou.
- **Continua sem teste:** a salva de Grad (a cena não chegou a disparar: sem solução de tiro) e o custo da fita de fumaça; luneta do sniper; lança-rojão; Javelin; drone (horizonte do OSD); câmera das armas; CCIP em mergulho; Revi com as marcas de mergulho (só a captura, não conferida de perto).

Tarefa `cf-miras-impl`. O capitão escolheu uma direção por grupo no quadro das miras e disse "implemente".
Comentários dele: tanque "pode tirar o texto, e onde vai cair pode ser um círculo menor"; antiaérea, avião e bombardeiro "sem os textos"; helicóptero "textos pequenos".
Pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado em partida**.

## O que mudou (`Céu de Ferro 3D.html`)

Em 4 commits, na ordem pedida.

### 1. Iluminação noturna das óticas de 1944

- `retLit()`: 0 de dia e 1 à noite ou com neblina forte (lê `S.sky.L` e `S.wx.f`).
- `retCol(a, k)`: o retículo escuro fica âmbar (1944) ou vermelho (hoje) quando a lâmpada é necessária.
- `retStroke(col, w, k)`: desenha a linha sobre uma auréola (clara de dia, brilho da lâmpada à noite).
- Usado em:
  - TZF do tanque/artilharia de 1944 (`fpGunner`);
  - anel e conta da AA de 1944 (`fpRing`): a borda dos anéis fica clara ou âmbar, e os números 200/400/600 saíram;
  - luneta do fuzil (`trnSight`);
  - alça do lança-rojão (`fpMan`);
  - visor do bombardeiro de 1944.
- Tanque (`fpGunner`):
  - saíram todos os textos dentro da luneta (PRONTO/CARREGANDO, DIST, ×zoom, os números da escala e o tipo de munição);
  - o estado da recarga é o anel em volta, vermelho quando acaba a munição;
  - o tipo de munição continua no painel da esquerda.
- Hoje, no tanque, um círculo pequeno marca onde cai a granada na distância do laser (`S.aimR`).
- Na visão externa do tanque, a cruz `acc` virou um círculo pequeno e saiu o texto "N m" ao lado da mira.
- Luneta do fuzil (grupo 07, direção B):
  - 1944: cruz fina com as marcas de queda a cada 200 m, sem números;
  - hoje: duplex (postes grossos fora, cruz fina dentro), com as quedas em pontos e o centro vermelho aceso à noite;
  - saíram o ×zoom e a distância; ficou a barra de fôlego com a dica.

### 2. Projéteis (direção A)

- `PJ`, `pjGeo`, `pjMesh` e `pjKind` (antes de `syncScene`).
- Formas compartilhadas, com `geometry.userData.keep`:
  - granada do obuseiro: ogiva com cinta de cobre;
  - granada de morteiro: gota com aletas (quem atirou é soldado, `by.man`);
  - foguete do lançador: corpo, nariz e 4 aletas (a arma tem `sal`);
  - míssil: branco, mais longo, com aletas.
- Acabou o cilindro preto (`cylX(.34, .1, 3, 6)`).
- Rastro barato no pool `sparks` já existente, nunca um `puff` por projétil:
  - a chama na cauda enquanto o motor queima (`PJ.burn` = 1,8 s para o foguete do lançador; o míssil lê o `D.mot` dele);
  - uma fita de 12 pontos de fumaça (`PJ.n`) a cada 0,07 s, que some em 2,6 s.
- A fita é guardada num `WeakMap`, sem campo novo no objeto da simulação (nada muda na rede).
- Foguetes de avião e de helicóptero (`k: 'rocket'`) também ganharam a chama e a fita.

### 3. Bombardeiro (direção C)

- `bombFall(P)` (memo por quadro) calcula o ponto de queda da 1ª bomba e os das seguintes ao longo do rumo, cada uma `BSIGHT.cool` = 0,3 s de voo depois (o ritmo do gatilho segurado em `useOrd`).
- `stickMarks(B)` desenha a faixa da salva no chão (raio da explosão para cada lado) e um ◇ pequeno em cada bomba.
- Visor no C: assento novo `bsight` (1944) e `bsightM` (hoje), só nos aviões com `strat: 1` (B-2, Tu-160, He 177, B-17), depois dos assentos que eles já tinham (`seatsOf`).
- A câmera do visor fica sob o nariz, estabilizada e olhando para onde cai a 1ª bomba: o centro do retículo é o começo da salva.
- O zoom usa o passo de zoom do avião que já existe (`camSt.pz`): não mexi no zoom.
- O visor desenha:
  - 1944: ótica redonda, cruz fina e fio de deriva com marcas, aceso à noite, e as bombas restantes em pontos;
  - hoje: tela de alvo em cinza, com cantos, cruz, faixa, colchete no alvo travado e as bombas restantes em barras.
- Sem textos.
- Visão externa: o bombardeiro mostra a faixa da salva no lugar da cruz "BOMBA".
- Visão externa: os outros aviões mostram o CCIP, um pipper onde cai a bomba na linha que sai do vetor de voo, sem texto.
- No visor e na visão limpa do jato (assentos sem painel), o painel de texto da esquerda (VEL, ALT, armas) continua aparecendo.

### 4. Óticas por grupo, sem textos

- **AA de hoje (`fpEO`)**:
  - saíram nome, DIST, APROX, ALT, TRAVADO/BUSCA, a linha EO/IR, o nome do míssil, PRONTO e o alcance do radar;
  - a distância virou uma barra sob a porta, e o travado um quadro que pisca;
  - entrou o ○ de antecipação do canhão na tela.
- **HUD do jato (`fpJetHud`)**:
  - saíram os números da escada, do rumo, da velocidade e da altura, o G, α, Mach, CAN, armas, flares e o texto do travamento;
  - as fitas ganharam um cursor;
  - o G virou uma barra (vermelha perto do limite ou em estol);
  - entrou o funil do canhão (envergadura de 12 m de 250 a 1150 m, com a queda das balas);
  - o travado é um quadro que pisca na linha de localização.
- **Revi (`fpProp`)**: três marcas de mergulho sob o anel.
- **Avião, visão externa**: o losango do alvo terrestre travado é cheio no alcance e tracejado longe, sem "NO ALCANCE"/"LONGE".
- **Helicóptero (`hudHeli`)**:
  - todos os textos a 78% do tamanho ("textos pequenos");
  - a mira do mouse virou a cruz de linha de visada do IHADSS.
- **Lança-rojão (`fpMan`)**: alça de moldura com 4 postes de distância, sem números, acesa à noite.
- **Javelin e guiados**:
  - tela do CLU (cantos do campo largo, caixa do campo estreito, cruz do buscador), sem o nome da arma;
  - em `hudMan`, "TRAVANDO"/"TRAVADO n m" saíram: o colchete pisca enquanto trava e fica fixo travado;
  - "PERTO DEMAIS" continua.
- **Drone (`hudDrone`)**: horizonte artificial do OSD (rolagem e arfagem) e as barras dos lados.
- **Artilharia (`fpMap`)**:
  - 1944: prancheta (papel e quadriculado a lápis);
  - hoje: moldura de tablete.
  - O resto do mapa de tiro não mudou.
- **Câmera das armas (`WCAM.hud`)**:
  - 1944: filme (sépia, grão e as perfurações que correm);
  - hoje: sensor (linhas de varredura e cruz).
  - Os textos dela ficaram.

## O que rodou (smoke, ~1 min)

- `HOST=127.0.0.1 PORT=18744 node server.js`: o servidor subiu e a página carregou sem erro de script. O único erro no console é um 404 de recurso estático, que não vem deste trabalho.
- No console, `newState` + `buildWorld` em 4 casos, com `drawHud()` e `syncScene()` sem exceção:
  - Abrams de noite com neblina, na luneta;
  - Tiger de noite, na luneta: o retículo âmbar aparece;
  - B-2 no visor;
  - B-17 de noite no visor: a faixa e os ◇ aparecem.
- Granada, foguete do lançador, morteiro, foguete e míssil empurrados à mão em `S.bombs`/`S.missiles` com o jogo pausado: as malhas aparecem e não houve erro.
- Capturas em `/home/luiz/firstmate/data/cf-miras-impl/capturas/` (só 1280).

## O que NÃO foi testado

- Nenhuma partida jogada.
- Nenhuma captura em 1920.
- Neblina e dia nas duas épocas não foram vistos lado a lado.
- O visor do bombardeiro em voo real:
  - se a câmera fica estável;
  - se o ponto de queda bate com onde as bombas caem de fato;
  - se o zoom (R) muda o campo do visor;
  - se o modelo do avião some bem.
- A fita de fumaça e a chama numa salva de Grad (40 foguetes) e o custo em quadros por segundo.
- O orçamento do pool `sparks` (MAXP 1500) com fumaça de tela e salvas juntas: o que passa do limite simplesmente não é desenhado.
- O funil do canhão do jato e o cursor das fitas, no HUD da cabine e no limpo.
- O CCIP dos caças em mergulho.
- O horizonte do OSD do drone (o sinal da rolagem pode estar invertido).
- A AA de hoje sem texto: se a barra de distância e o ○ de antecipação bastam.
- Helicóptero com textos menores em telas pequenas (`u` mínimo 0,62).
- Prancheta/tablete sobre o mapa de tiro: legibilidade das marcas por cima.
- Câmera das armas em 1944 (grão e perfurações) e a de hoje.
- Javelin/Stinger/Igla: travar sem o texto "TRAVANDO".
- Online: nada mudou no que vai pela rede, mas não foi visto com um fantasma atirando.

## Riscos

- **Visor do bombardeiro**:
  - `updateCamera` é envolvida de novo (`bsight`). Se outro trabalho mexer na câmera do avião, a ordem dos envoltórios importa.
  - O cockpit (`mdl.can`) roda antes e é sobrescrito.
- **Assentos**:
  - `seatsOf` agora devolve 3 assentos para B-2/Tu-160 (jet, jetc, bsightM) e 2 para He 177/B-17 (prop, bsight).
  - Quem contava o número de assentos do avião vê um a mais.
- **Painel de texto**: `hudFly` mostra o painel de texto em qualquer assento sem `inst`; antes ele sumia na visão limpa do jato.
- **Contra o pedido "sem os textos"**: a informação que saiu do HUD do jato (números de velocidade e altura) agora só está no painel da esquerda. Se o capitão quiser números no HUD, volte esses trechos.
- **Projéteis**:
  - as geometrias compartilhadas dependem de `kill()` respeitar `geometry.userData.keep` (respeita hoje);
  - os materiais continuam um por malha, como antes.

## Como testar depois

1. `HOST=127.0.0.1 PORT=<porta> node server.js` e abrir a página (pela tailnet, com `armada link <porta>`).
2. Em 1280×800 e 1920×1080, nas duas épocas, com Céu = dia, noite e Tempo = neblina (abas do hangar):
   - tanque (Tiger, Abrams), C para a luneta: retículo visível de noite, sem textos, anel de recarga, círculo de queda (hoje);
   - artilharia e lançador (M para o mapa): prancheta/tablete; atire uma salva de Grad ou M270 e olhe os foguetes de perto e de longe (chama, fita, quadros por segundo);
   - morteiro a pé: a granada com aletas;
   - AA (Flakvierling e a de hoje): anel sem números e aceso de noite; tela EO sem texto com o ○;
   - caça e ataque: CCIP na externa e na cabine, funil, Revi com as marcas de mergulho;
   - B-2, Tu-160, He 177, B-17: na externa a faixa; com C até o visor, segure o tiro de bomba e confira se as bombas caem na faixa e nos ◇; teste o zoom R;
   - helicóptero: textos menores, cruz IHADSS;
   - infantaria: luneta do sniper (cruz fina / duplex), bazuca/RPG (alça), Javelin (CLU, travar);
   - drone FPV: horizonte do OSD acompanhando a rolagem;
   - câmera das armas (\`): filme em 1944, sensor hoje.
3. Atalho sem menu, pelo console da página:

   ```js
   era = 'ww2'
   newState('ww2', 'b17', { cls: 'plane', mouse: true, len: 600, sky: 'noite', wx: 'limpo', N: 2 })
   buildWorld()
   playMode = 'play'
   paused = false
   hangar.hidden = true
   camSt.mode = seatsOf(S.my).length
   ```
