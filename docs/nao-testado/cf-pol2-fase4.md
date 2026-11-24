# Fase 4 do polimento (cf-pol2-fase4): feed de abates e placar (P27); o que ficou sem teste

## P27: feed de abates e placar com Tab segurado

O que é: no alto à direita, sob o mapa, o feed de abates (`KF`, `kfNote`, `kfDraw`) mostra até 5 linhas "quem ▸ quem · arma · distância": os abates e a morte do jogador, os de outros jogadores da sala e os veículos e aeronaves perdidos a até 1,5 km dele. Segurar Tab por 0,3 s mostra o placar (`SB`, `#board`): os lados com pontos, ponto-minutos e perdas e, online, os jogadores da sala. Um toque curto em Tab continua abrindo a Visão de General, agora ao soltar a tecla. A lista de jogadores que ficava sempre na tela foi para o placar; no HUD fica a linha "ABATES · CAPTURAS · QUEDAS" do jogador.

### Testado

- `tests/killfeed.js`: quem entra no feed; uma morte só uma vez, também com o eco do servidor (`down`, `aidown`) no anfitrião; o convidado vê o abate de outro jogador; o veículo abandonado continua no feed do centro; as cores e o alinhamento das linhas; toque e segurar Tab; perder o foco com Tab apertado.
- No Chromium sem tela com GPU, 1280 × 800 e 1920 × 1080, sala de um jogador como Fuzileiro (EUA): o feed com 4 abates do jogador, o placar com Tab segurado, o toque curto abrindo a Visão de General. Sem erro de JS.

### Não testado

- Uma sala com vários jogadores de verdade em navegadores: o placar com muitas linhas (corta em 16 e diz quantos sobram) e o feed com abates de outros jogadores.
- Tab segurado com o mouse preso (pointer lock real); o navegador sem tela não prende o mouse.
- Partida de 1944 na tela (o placar de 3 lados foi visto na partida de hoje).

### Como testar

`node server.js`, entrar como Fuzileiro e abater alguém: a linha aparece sob o mapa. Segurar Tab: o placar; soltar: some. Tocar Tab: a Visão de General. Com dois navegadores na mesma sala: o abate de um aparece no feed do outro, e o placar lista os dois.
