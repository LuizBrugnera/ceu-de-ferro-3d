# cf-tecla-mapa: M abre o mapa para todos (NÃO TESTADO)

## O que mudou
- **M em qualquer veículo ou classe** (avião, helicóptero, tanque, antiaérea, transporte, infantaria): abre/fecha o **mapa da batalha** (`bmDraw`, bloco "the battle map" no fim do script do HTML). Mostra relevo, grade, estradas, vilas, pontos de conquista com o dono, bases, suprimento, obras da economia, rádios (os do inimigo só se vistos), marcas do comandante e do general (`cueMarks`), fumaça, aliados, e o inimigo **só como o seu lado o conhece** (`spotted`, posição `sX/sZ`, escada de percepção, apaga com o tempo). Sua posição e direção ("VOCÊ"). Roda ou + − aproxima no ponteiro, arrastar move, duplo clique centra em você, M ou Esc fecha.
- **Artilharia, lançador e morteiro**: M continua abrindo o mapa de tiro deles (`mapKey`, assento `fcm`), sem mudança.
- **O jogo não pausa** com o mapa aberto: as teclas continuam guiando o veículo. O mouse é solto ao abrir; clique, roda e perda do ponteiro não disparam, não dão zoom na câmera e não pausam enquanto o mapa está aberto. Ao fechar, o mouse volta a ser preso.
- **Visão de general (Tab) e RTS (#141)**: M na câmera de comandante vai para a mesa do mapa; M de novo volta à câmera. M na mesa aberta pelo Tab fecha a visão. Assistindo (espectador / IA × IA), M abre a visão de general.
- **Conflito de tecla**: "marcar objetivo para os pilotos" saiu do M e foi para **Shift+O** (O de objetivo; O sozinho continua fortificar). Shift+M (missão) e Shift+K continuam. Todas as letras já tinham uso na visão de general, por isso o Shift.
- Textos atualizados: chip "Marcar" (Shift+O), dicas de teclas da visão de general e do RTS ("M ou Tab: fechar", "M ou ': mapa"), linha "M" na lista de Controles do hangar para quem não tem mapa de tiro, texto do espectador, faixas "Tab ou M abre a Visão de General", README (general e "Em todas as classes").
- Teclas novas dos compartimentos 1-5 (#136) e do zoom de veículos: nada usa M; o mapa não mexe nos dígitos nem em R.

## O que NÃO foi testado
Nada além do smoke: `node --check` do script principal e a página abrindo num Chrome headless sem erro lançado, servidor subindo. Não foi jogado nem visto na tela.

## Riscos
- O desenho do mapa pode ter erro em tempo de execução em algum caso (morto, 3 lados, sem conquista); está num `try` que fecha o mapa e loga no console, para não derrubar o HUD.
- `pointerlockchange`: abrir o mapa solta o mouse; se o navegador não devolver a trava ao fechar (sem gesto do usuário), o jogador precisa clicar no jogo.
- Gamepad e toque não abrem o mapa da batalha (só o teclado M); o botão do gamepad continua só com o mapa de tiro.
- Desempenho com muitos soldados (o mapa percorre `S.men` a cada quadro).
- M na mesa da visão de general fecha a visão também para quem entrou só como General (antes M marcava objetivo).
- Testes `tests/gen-*.js` mandam o comando `mark` direto, não pela tecla; não devem quebrar, mas não foram rodados.

## Como testar depois
1. `npm start` e abrir `http://localhost:8080`.
2. Para cada classe (avião, helicóptero, tanque, antiaérea, transporte, soldado, atirador): entrar, apertar M. Ver o mapa; conferir que inimigo não visto não aparece; voar/andar com o mapa aberto; clicar e arrastar no mapa (não pode atirar), roda (zoom no mapa, não na câmera), duplo clique (centra em você); M e Esc fecham e o mouse volta a mirar.
3. Artilharia, lançador e soldado de morteiro: M abre o mapa de tiro como antes (o mouse move o ponto de mira).
4. Tab com o mapa aberto: abre a visão de general e o mapa fecha. Na visão: M fecha; com a câmera de comandante ('), M vai à mesa e M volta à câmera. Com a cadeira de general: Shift+O arma "Marcar", o chip mostra Shift+O, e o piloto do lado vê a marca "ORDEM DO GENERAL".
5. Assistir (sem veículo): M abre a visão de general.
6. Online (2 abas): mapa aberto não pausa nada e o outro lado não aparece sem ser visto.
7. Regressão: `node tests/gen-cmd.js` e `node tests/gen-play-online.js`.
