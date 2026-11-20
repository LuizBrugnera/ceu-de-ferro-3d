# cf-modo-rts: a câmera de comandante (modo RTS, issue #123)

Pedido do capitão: "ja pode tambem fazer o modo RTS". A visão aprovada (STRATEGY.md) diz que o modo RTS é mais um jeito opcional de jogar, nunca o principal. Por isso ele é a própria Visão de General vista em 3D. Não tem lógica de comando própria.

## O que mudou

### `Céu de Ferro 3D.html`, seção própria `/* ---------- the commander's camera (RTS; cf-modo-rts ...) */` (no fim do script, antes do `boot()`)
- **Entrada.** O hangar ganha o botão **Comandante (RTS)**, ao lado de General e Assistir. Ele chama o mesmo `joinGen` do General e, quando a Visão de General abre, liga a câmera (`RTS.want`). Precisa do servidor, como o General. Sem servidor, use Assistir (IA × IA local), aperte ' e depois "Assumir o comando". Na Visão de General, a tecla **'** (Backquote) ou o botão **Câmera 3D** da barra troca entre o mapa e a câmera. Tab fecha as duas. A escolha vale até a partida acabar. Uma partida nova abre no mapa, a não ser que tenha começado pelo botão Comandante.
- **Câmera (`rtsCam`).** Um ponto no chão, com distância de 12 a 2600 m, rumo e inclinação. W A S D, as setas, as bordas da tela (8 px) ou arrastar (sem cadeira) movem a câmera. Shift deixa o movimento 3× mais rápido. A roda aproxima na direção do cursor, e + e − também. O botão do meio ou Alt+arrastar gira e inclina; [ ] giram (fora do modo construir), PageUp e PageDown inclinam. F vai à seleção (ou ao jogador), e Home volta à visão geral. Quando a visão pede para olhar um lugar (grupo chamado duas vezes, linha do diário, "Ver" de uma missão), a câmera vai até lá (`GV.cx/cz` mudou fora do `genFit`).
- **Sobreposição (`rtsDraw` no lugar do `genDraw`).** O canvas do mapa fica transparente sobre a cena e é redesenhado a cada quadro. Ele mostra:
  - os pontos (anel no chão na cor do dono, nome) e as bases;
  - as missões de fogo, a reunião, a marca, o objetivo do assalto, as ordens abstratas e as emboscadas;
  - o inimigo como o lado o conhece: losango, desbotado pela idade, com "há N s" e um anel de erro (`SHARE.err + 2 m/s` de idade);
  - os veículos e aeronaves próprios;
  - as esquadras próprias: a linha da ordem até o destino, a seleção (um anel por homem de perto, um anel em volta do líder de longe) e o **líder** com uma estrela dourada (`q.lid` do P3 se existir, senão `flLid`);
  - de perto (até 220 m), embaixo de cada homem: a equipe (`q.eq`), o reflexo (`m.rf.k`), o estado (`m.mo.est`), a tarefa (`m.tar`) e "ferido";
  - com uma esquadra sozinha selecionada ou sob o cursor, um quadro da cabeça dela: tipo, homens, ordem, operação, técnica (`q.tec` ou `ord.tec`), plano (`q.bb.plano`) e a tarefa e o papel de cada equipe. Cada campo do contrato P0 que ainda não existe no main é pulado;
  - os balões de fala (`sayT`/`sayText`, onde o P5 também fala) até 350 m da câmera;
  - a fila de rota, o plano do assalto, os lugares de construção, o anel da ordem armada sob o cursor e a caixa de seleção;
  - o **minimapa** no canto de cima à direita: o chão do mapa tático, os pontos, as unidades, os contatos e o trapézio que a câmera cobre. Clicar nele leva a câmera; o botão direito ou uma ordem armada usa o ponto dele.
- **Ordens.** São as do GOR, sem cópia. `gorW` (gancho) lê o chão 3D por um raio da câmera, e `gorPick`, `gorPt`, `gorFoe`, `gorBox`, `gorDbl` e `gorBuild` são embrulhados para escolher pelo que está na tela. Assim tudo segue para `gorSend` → `genDo` → `genCmd` (by: me), com as mesmas recusas e os mesmos motivos. **Fila (Shift):** Shift+botão direito, sem ordem armada e com seleção, põe um ponto em `GOR.rt` (a rota do W21, até 8 pontos). O próximo botão direito sem Shift (ou qualquer ordem que leve rota) manda a ordem com a fila. Os grupos funcionam com Shift+número, e também com Ctrl+número, que o navegador pode tomar para as abas.
- **Névoa (`rtsHid`).** Sem "Ver tudo", um soldado ou veículo inimigo só é desenhado enquanto o lado `GV.t` o tem à vista (`sT` nos últimos 2,5 s; um corpo, nos últimos `CMD.mem` s). Isso vale para os veículos (`m.visible`, desfeito sozinho ao sair), para os soldados (embrulho de `poseMan`, que cobre também os modelos do pack) e para os pontinhos de longe (gancho em `syncScene`). As aeronaves aparecem para todos, como no mapa. O espectador online começa com "Ver tudo" ligado.
- **Online.** É o mesmo da cadeira de general: quem tem a cadeira manda. O espectador ou quem não tem a cadeira só move a câmera.
- **Cena.** Com a câmera de comandante, `camSt.body` fica desligado, a arma na mão (`vmRender`) e a câmera da arma (`WCAM.render`) não desenham, e o HUD do jogador fica escondido. O som segue a câmera (`S.ear`).
- **Ganchos no código antigo**, um por linha: `frame` (`render3d` também com `GV.rts`), `gorW`, o ouvinte de `dblclick` (agora chama `gorDbl` pelo nome, para o embrulho valer) e o laço dos pontinhos de soldados em `syncScene`. O resto são embrulhos na seção nova, e o CSS é injetado pela própria seção.
- **Conserto à parte.** Em `fortBoxes` (pack de props), `PK.inst[id]` fica `null` depois de um `buildWorld` (partida nova), e `me.count` lançava TypeError a cada quadro com a câmera perto de obras. A IA × IA do Assistir mostrava isso com a câmera de comandante na base. Agora uma entrada nula é pulada.

### `README.md`
- "Quatro jeitos de entrar" e um parágrafo sobre a câmera de comandante.

## O que NÃO foi testado
Só houve o teste de fumaça: o servidor sobe, a página carrega sem erro, e com IA × IA local + `rtsSet(true)` a cena 3D, o minimapa, os anéis dos pontos e os painéis aparecem, sem erro no console (navegador sem GPU, cerca de 1 quadro por segundo). Nada mais foi testado:
- mover, girar, aproximar e usar as bordas com mouse e teclado reais; o arrasto do minimapa;
- selecionar (clique, caixa, duplo clique, grupos) e ordenar pelo botão direito em 3D; a fila com Shift; as ordens armadas (G H Q E R T Y K C P M B U J O) com clique no chão e no minimapa; o plano de assalto;
- a névoa: inimigos aparecendo e sumindo, corpos, os modelos do pack, os pontinhos de longe, 3 lados, convidado online (se o convidado não recebe `seenT` dos fantasmas, todos os inimigos dele ficam escondidos e só os contatos aparecem);
- o líder, as equipes e o quadro da cabeça com o P0/P1/P3 de verdade (cf-lideres, cf-cerebro-soldado): os nomes dos campos vêm da seção 2.5 do relatório;
- online: o botão Comandante entrando na sala, a cadeira ocupada por outro, o espectador;
- desempenho num host lento (#118): a cena 3D volta a ser desenhada com a visão aberta (antes não era), e a sobreposição é refeita a cada quadro;
- telas estreitas (< 981 px), 1280 px e 1920 px; "Esconder painéis";
- a neblina da cena vista do alto (com tempo ruim, o chão pode sumir perto de 2,6 km).

## Riscos
- Ver a cena e o mapa ao mesmo tempo custa mais quadro que o mapa sozinho. Num host lento, a IA pode encolher o teto de população (#118) por causa do relógio.
- Os eventos do canvas do mapa passam pelos embrulhos de `gorDown/Move/Up`. Com a câmera de comandante, o arrasto do mapa 2D nunca começa. Um erro ali deixa o mouse sem resposta só nesse modo.
- A névoa pode esconder demais, por exemplo um inimigo que o lado ouve mas não vê, ou de menos, como os traçantes e os clarões, que continuam aparecendo.
- `rtsGround` marcha pelo raio a cada clique e a cada quadro com ordem armada, mais 4 raios do minimapa por quadro. Isso é barato, mas não foi medido.

## Como testar depois
1. `npm start`, abra `http://localhost:8080` (num computador com GPU).
2. Assistir (sala vazia → IA × IA), Tab se fechou, **'**: a câmera de comandante. Mova com W A S D, as bordas, a roda, o botão do meio, [ ], PageUp/PageDown, Home e F. Clique no minimapa. Ligue e desligue Ver tudo (V) e confira que os inimigos fora da vista somem e viram losangos com "há N s".
3. Assumir o comando. Selecione com clique, caixa e duplo clique, e chame os grupos com Shift+1 e 1 (duas vezes, a câmera vai até eles). Dê o botão direito no chão, num ponto inimigo e num contato. Use Shift+direito duas vezes e depois o direito: a ordem vai com a rota (diário e toast). Arme G, T, B e O e clique no chão e no minimapa. Experimente uma recusa, como mover sem seleção ou construir fora do lugar: o motivo tem de ser o mesmo do mapa 2D.
4. Aproxime de uma esquadra em combate: estrela no líder, letras das equipes, quadro da cabeça, balões.
5. Hangar → **Comandante (RTS)** com o servidor: entra como General, já na câmera. Abra um segundo navegador como espectador (Assistir com alguém na sala): só a câmera, sem ordens.
6. Confira em 1280 e 1920 px, com os painéis e sem eles.
7. Regressão: o mapa 2D da Visão de General continua igual (arrastar, roda, duplo clique, ordens), e os testes de sempre (`tests/all.sh`) passam, embora esta mudança só toque a parte da cena.
