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

## P10: a esquadra do jogador (D4: 3 soldados da IA, 3 ordens)

O que é: quem entra a pé (Infantaria) vem com 3 soldados da IA do seu lado (`PSQ`, `psqSpawn`, `psqStep`, `psqOrder`): um fuzileiro, um metralhador e um antitanque, fora de qualquer esquadrão e das ordens do general. Vírgula: sigam-me; ponto: segurem aqui; / (no teclado brasileiro, ;): ataquem onde a mira toca o chão. Com um inimigo perto de onde devem estar, lutam de onde estão. A cada nova vida a pé a esquadra é refeita: os mortos são repostos e quem ficou a mais de 400 m é liberado. Jogador morto ou num veículo: a esquadra segura onde está. Online o anfitrião cria e comanda a esquadra de cada convidado (`psq`, `psql`); se o anfitrião sai, o novo mantém as esquadras dos jogadores fora dos esquadrões da IA (`psqAdopt`).

### Testado

- `tests/esquadra.js`: a esquadra entra com o jogador (os 3 kits, do lado dele, fora de esquadrão); segue, segura e ataca; recusa ordem inválida; luta com um inimigo a 40 m; o abate dela entra no feed como do jogador; nova vida repõe o morto e libera o que ficou longe; morto, ela não corre até o corpo; a esquadra de um convidado feita pelo anfitrião; a ordem do convidado chega; o anfitrião diz de quem é cada soldado (`psql`); o convidado sai e a esquadra é liberada; o novo anfitrião mantém a esquadra fora dos esquadrões da IA.
- `tests/esquadra-online.js`: anfitrião e convidado a pé pelo servidor de verdade; a esquadra de cada um; a ordem do convidado obedecida pelos soldados do anfitrião.
- No Chromium sem tela com GPU, 1280 × 800 e 1920 × 1080, sala de um jogador como Fuzileiro (EUA): a linha ESQUADRA sobre o painel ESTADO, as setas sobre os 3 soldados, o losango SEGURAR e ATACAR. Sem erro de JS.

### Não testado

- Um convidado num navegador de verdade dando ordens (o teste online roda as duas pontas sem tela).
- A tecla / num teclado brasileiro físico (ABNT2): no navegador sem tela a tecla é mandada pelo código `Slash`.
- Partida de 1944 e o lado Insurgente: os kits saem de `INF[era][facção]`, índices 0, 1 e 2; não olhei na tela que soldados são.
- Partida longa com muitos jogadores a pé: cada um põe até 3 soldados acima do teto da IA (até 12 a mais no total, `PSQ.over`).

### Como testar

`node server.js`, entrar como Fuzileiro: três soldados aparecem atrás de você e a linha "ESQUADRA 3/3 · SEGUINDO" sobre o painel ESTADO. Andar: eles seguem. Ponto: seguram onde você estava (losango SEGURAR). Mirar no chão e /: vão até lá (losango ATACAR). Vírgula: voltam a seguir.
