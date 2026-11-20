# Cérebro do soldado (P1) e parte 1: corpo e voz (não testado)

Tarefa `cf-cerebro-soldado`. Pedido do capitão: dar ao Céu a profundidade do Defilade no "cérebro" dos NPCs e no jeito dos soldados fazerem as coisas (prisioneiros que dão informação, devolver granada, buscar abrigo, colega ferido), e depois granadas mais reais e soldados que não pareçam um bot andando no meio do nada.

No meio da tarefa o capitão pediu para pesquisar a melhor arquitetura antes de mexer na decisão (scout `cf-cerebro-pesquisa`). Esta parte 1 traz só o que não depende de como o soldado decide: a física da granada, a avaliação de abrigo como dado, os balões de fala e o empurrão e atordoamento da explosão. As decisões ficaram para a parte 2, que é o pacote **P1 (o soldado)** da arquitetura que a pesquisa recomendou (`/home/luiz/firstmate/data/cf-cerebro-pesquisa/report.md`, seções 2, 3.2, 3.3 e 4): veja "Parte 2: P1, o soldado" abaixo.

## Referência Defilade

Fontes: a [página da Steam](https://store.steampowered.com/app/5246700) ("The Small Details"), o [anúncio](https://shazoo.ru/2026/09/23/191107/anonsirovana-rts-defilade-s-fpv-dronami-i-glubokoi-simuliaciei-boia) e o [vídeo de gameplay na vila de inverno](https://shazoo.ru/2026/10/02/191756/realisticnoe-srazenie-za-zimniuiu-derevusku-v-geimplee-strategii-defilade) (Shazoo, set/out 2026). Não há devlog técnico público: o "como" abaixo é o que se vê e o que a loja diz, não o código deles.

| Comportamento | Gatilho | Decisão | O que se vê |
| --- | --- | --- | --- |
| Abrigo real | fogo inimigo chegando | o soldado lê o terreno, sem pontos de abrigo marcados: muro, veículo, janela, trincheira, escombro, árvore em pé ou caída; evita o aberto | corre e se joga atrás do objeto; desliza para o abrigo |
| Aviso aos aliados | ver o inimigo | grita onde ele está | balão de texto sobre a cabeça (ordens, "médico!") |
| Ferido | ferimento grave | rasteja sozinho até o abrigo mais perto e espera; os colegas dão fogo de cobertura e um vai buscá-lo e arrasta | rastejando; o médico leva de maca; se o médico cai, outro larga a maca e arrasta; se o resgate falha, resgate com corda |
| Granada | granada caindo perto | se joga no chão, ou pega e devolve | mergulho; arremesso de volta |
| Prisioneiros | quebrado e cercado | se rende; o capturado é interrogado na volta | a informação revelada sobre a posição do inimigo |
| Arma do caído | aliado morto perto | pega a arma; pega munição dos corpos por onde passa | o soldado se arma com a arma largada |
| Explosão | explosão perto | — | é jogado longe, alguns ficam atordoados e cambaleiam um tempo; ragdoll |
| Obstáculos | muro baixo, relevo | pula e usa a altura | pula muros, sobe obstáculos |
| Corpo a corpo | inimigo muito perto | luta de perto | corpo a corpo |
| Drone FPV | ouve o drone chegando | tenta derrubar ou se joga no último instante | atira para o alto; mergulho antes do impacto |

O que o Céu já tinha antes desta tarefa: abrigo ao ser pregado no aberto (`sqMan`, `covBest`), o exercício `fogo-distante` (#59), ferido que cai em vez de morrer e o colega que arrasta e trata, médico primeiro (`WND`, `rescue`), estabilizado e evacuação por ambulância e helicóptero (W18), fugir da granada (`sqMan`), esconder-se do drone (`dHide`, atiradores `DSHOT`), exercícios de infantaria (#36), percepção em degraus (#8), pedidos de ajuda (W9).

## O que mudou (tudo em `Céu de Ferro 3D.html`, bloco "the soldier's body and voice" no fim da parte de simulação)

- **Granada (`NADE`, por cima da granada com espoleta do `cf-casas-paredes`, #126)**: a espoleta, o quique, a rolagem e a parede (`GRN`, `nadeStep`) chegaram ao main pelo #126 enquanto eu fazia a minha; no merge fiquei com a física deles (melhor: normal da face, casco, ladeira) e tirei a minha. Esta parte acrescenta:
  - **Fundo da trincheira**: a granada que cai numa trincheira cai no fundo dela (`nadeFloor`, com `trenchAt`), dentro do chão do `nadeStep`.
  - **Cozinhar**: `m.nCook` (s) sai da espoleta no arremesso (`toss`). Ainda nenhum soldado da IA cozinha: é decisão (parte 2).
  - **Mira de arremesso**: o soldado da IA que vai jogar granada (`c.nade = 1`, o que já decidia antes) agora joga para cair num ponto (`nadeAt`, `nadeAim`): no inimigo (no chão aberto um pouco antes, 30% da distância até 6 m, pelo quique e a rolagem), numa janela do andar dele quando está num prédio (arco baixo), dentro da trincheira ou atrás do abrigo (arco alto), com erro de 6% da distância. Antes ele jogava sempre na mesma força, para onde olhava. O assalto a prédio (`bAtk`, `sqBound`) mira a janela mais próxima do prédio.
  - **Estilhaço e dobra do terreno**: numa explosão pequena (raio até 16 m), uma dobra do terreno entre a explosão e o soldado corta o dano para 35% (`nadeFold`). Paredes (`OBJS.shield`), trincheira e sacos de areia (`fortHit`) e a postura deitada (`STANCE.blast`) já cortavam.
  - **Devolver**: `nadeBack(m, b, P)` é a ação física de pegar a granada do chão e jogá-la de volta com o que resta da espoleta. Ninguém a chama ainda (decisão, parte 2).
  - **Fugir da granada**: quem corre da granada (o que já existia) agora fica longe até ela explodir, em vez de voltar ao lugar depois de 2 s.
  - **Online**: além do `f: 1` do #126, quem joga manda o resto da espoleta (`fl`, a cozinhada chega certa) e a granada devolvida (`rb`); cada cliente tira a cópia da primeira (`nadeTaken`).
- **Abrigo lido do terreno (`CVR`, `cvPick`)**: a melhor posição a até `r` m contra um inimigo em `e`, pontuada pelo que fica entre ela e ele: a linha cortada pelo terreno, parede ou mata (`los`), o que o chão dá (`coverAt`), o vão de um prédio, a sombra de um veículo parado ou casco, um lugar numa trincheira ou atrás de sacos de areia do lado, rocha ou tronco, menos a distância e o lugar de um colega. É dado para a decisão usar; ainda não está ligado a nenhuma decisão. Lê as paredes e janelas do térreo das casas pela API do `cf-casas-paredes` (`covBld`: fora da parede, dentro da janela), os vãos (`bldBays`), as trincheiras e moitas (`coverAt`, `fortSlots`, `trenchAt`). A trincheira como corredor do `cf-trincheiras-tuneis` ainda não está no main: deve entrar pelo `fortSlots`/`trenchAt` (gancho a conferir).
- **Balões de fala (`SAY`, `say`)**: um balão sobre a cabeça do soldado por 2,4 s, uma fala a cada 2,5 s no máximo, visto até 140 m (o do inimigo só enquanto ele é percebido). Já falam: o líder ao começar um exercício ("Ao chão!", "Blindado!", "Artilharia!", "Fogo de longe!", "Por lances!", "Recuar!" etc., `SAYDR`), quem cai ferido ("Médico!"), quem vai buscá-lo ("Vou buscá-lo!"), quem joga granada ("Lá vai granada!") ou fumaça ("Fumaça!"). Online, o código da fala vai na linha do soldado do anfitrião (último campo, `k + 32 * hora`); o convidado só vê o que o anfitrião manda.
- **Empurrão e atordoamento (`STUN`)**: a explosão joga o soldado para longe dela (até 2,2 m, menos deitado, nunca dentro de trincheira nem através de parede) e o deixa atordoado até 3,5 s, mais perto e maior a explosão. O soldado da IA atordoado mira pior, não atira no começo, não corre e cambaleia. Cada cliente empurra só quem ele move (o próprio jogador e, no anfitrião, a IA). O cartão da unidade diz quantos homens estão atordoados (`get_unit`: `stun`).

## O que NÃO foi testado

Só o smoke: o script passa no `node --check`, o servidor sobe, o harness carrega a simulação e roda 25 s de IA × IA nas duas épocas sem erro, e uma granada da IA jogada numa caixa de areia num alvo a 18 m quica, para a ~1 m dele e explode em 3,6 s; `cvPick` roda no aberto. Não rodei nenhuma suíte (`tests/infantry.js`, `drills.js`, `squads.js`, `inf-drills.js`, `help.js`, `rec.js` e as online), nem partida no navegador (o navegador compartilhado deu timeout ao abrir a página), nem partida online.

## Riscos que vejo

- **Mira da granada**: o ponto mais curto no aberto foi medido só com o alvo a 18 m num terreno; em ladeira ou de perto pode cair longe. A granada mirada na janela pode bater no batente e voltar para quem jogou.
- **Cliente antigo**: um cliente do #126 sem esta parte ignora `fl` e `rb`: vê a granada cozinhada com a espoleta cheia e a devolvida junto com a original. Só a imagem diverge; o dano continua com quem já o aplicava.
- **Empurrão**: artilharia e bombas grandes empurram homens a até 1,6 × o raio; o empurrão não confere objetos baixos e pode pôr um homem num lugar ruim. O atordoado não atira no começo: pode mudar duelos de infantaria sob morteiro.
- **Balões**: são desenhados por quadro para todos os soldados até 140 m; numa cidade cheia pode haver muitos de uma vez.
- **Dobra do terreno**: a amostra é de 6 pontos do chão; em terreno com textura grossa pode cortar estilhaço demais ou de menos.

## Como testar depois

1. `node tests/infantry.js`, `node tests/drills.js`, `node tests/inf-drills.js`, `node tests/squads.js`, `node tests/help.js`, `node tests/rec.js` comparando com o main de antes (`PAGE=<página antiga>`).
2. Granada: no harness, `sandbox('modern')`, um soldado em (1000, 0) e um alvo a 10, 18 e 28 m; `m.nAt = nadeAt(m, alvo); toss(m, 1)` e conferir onde `b.rest` acontece e que explode em `nadeFuse()` s. Repetir com o alvo a 8 e 28 m, em ladeira, dentro de um prédio (deve mirar a janela) e numa trincheira (arco alto, cai no fundo).
3. Dobra: uma granada atrás de uma crista contra um homem do outro lado: o dano deve ser ~35% do aberto.
4. `cvPick(m, e, 25)` perto de um tanque parado, de uma casa, de uma trincheira e no aberto: ver `why` (`veiculo`, `predio`, `trincheira`, `dobra`, `chao`).
5. Balões: partida IA × IA no navegador, câmera perto de uma esquadra em contato: devem aparecer "Ao chão!", "Médico!", "Lá vai granada!". Online: um convidado vê as falas dos soldados do anfitrião.
6. Explosão: um morteiro caindo a 5 m de um soldado em pé: ele se desloca ~1-2 m e o cartão da unidade mostra "1 homem atordoado".
7. Online: um convidado joga granada; anfitrião e convidado devem ver a mesma granada quicar e explodir no mesmo tempo (o campo `f`).

## Parte 2: P1, o soldado (arquitetura da pesquisa `cf-cerebro-pesquisa`)

Duas seções novas no fim da parte de simulação de `Céu de Ferro 3D.html`, depois das do P0 (contrato), P5 (falas), P2 (posição) e P3 (líder), logo antes da cena 3D. Enquanto eu fazia o P1 entraram no main o P0, o P2, o P3, o P5, o P6 e o P7; o P1 usa os deles e não declara nada do contrato:

- o **contrato do P0** (`BRAIN`, `m.rf`/`m.mo`/`m.tar` criados no `addMan`); `m.rf` segue o formato `{ k, ate }` e volta a `{ k: null, ate: 0 }` (nunca `null`);
- a **utilidade** roda no gancho do soldado do P0 (`brainHook('sold')`, a 5 Hz em contato perto do jogador, 2 Hz em contato longe, nada fora de contato); os reflexos, por evento, e a execução da ação escolhida ficam no `aiMan`;
- as **falas** saem pelo `fala`/`brainSay` do P5, cada uma depois de um `flCb` (a decisão de origem, que é também o evento `cb` do P6); duas linhas novas na tabela do P5: `devolvendo` e `abrigo`. O canal de voz do P5 ("Granada!" ouvido faz o colega sair) substitui o aviso que eu tinha;
- o **reflexo de granada do P5** (quem viu cair foge) vira estímulo do P1, que decide entre devolver, sair do raio ou mergulhar; enquanto o P1 dirige o homem (`A.brk`), a fuga do P5 espera;
- a **posição** vem do `tps` do P2 por `brTps` (perfis `abrigo`, `recuo`, `fuga` com `zonas`; `blindado` = `contra_blindado`, ficando com o lugar mais perto que de fato tira da visada do canhão, comparado ao `cvPick` duro da parte 1; o P2 reserva o lugar com `tpsHold`; a saída pelo outro lado da casa usa o `tpsBldPass` do P2);
- a **tarefa do viés** é `m.tar`, senão o papel da equipe do P3 (`q.eq[].papel`), senão o exercício, senão a ordem;
- o **teste de honestidade do P7** passa: as seções `CEREBRO` do P1 não leem `S.men`/`S.units`/`S.bombs`/`S.planes` (isso fica na seção de estímulos, que é percepção).

- **`the soldier's stimuli (P1)` (`STIM`)**: a única parte do cérebro que olha o mundo, cada coisa pelo que um homem vê ou ouve: tiro passando ou acertando (`drInc`), explosão ouvida, granada vista no cone com linha livre ou ouvida no momento em que cai a até 10 m, colega caindo à vista, veículo vindo em cima, drone de ataque mergulhando (ouvido), blindado inimigo que ele mesmo percebeu (`m.pm`, com classe), corpos do lado com arma à vista, inimigos percebidos, e o que o prisioneiro sabia. Tudo vira estímulo na fila do homem (`m.est`).
- **`CEREBRO: soldado (P1)` (`SOLB`)**, nos 7 itens da 3.3:
  1. **Tabela de reflexos** (`REFL`, uma linha por reação: estímulo, prioridade, tempo de reação, ação, fala) e **tabela de utilidade** (`ACTS`, uma linha por ação, considerações em curvas multiplicadas com a compensação do IAUS). Nenhum `if` novo em `sqMan`.
     - Reflexos, por prioridade: `granada` (≤ 8 m: devolve se alcança com espoleta sobrando, pela distância, calma, moral e veterania; senão sai do raio para trás de abrigo se dá tempo, senão mergulha; grita e os colegas a até 45 m reagem ao grito); `mergulho` (veículo ou drone vindo em cima: salto para o lado e ao chão); `ferido` (atingido: ao chão um instante; caído: rasteja até abrigo a ≤ 10 m e chama "Médico!" a cada 10 s até alguém vir); `blindado` (abaixo); `abaixar` (tiro ou explosão perto no aberto: ao chão na hora, depois abrigo a ≤ 10 m); `colega` (colega caído à vista: "Homem ferido!", moral, relato ao líder em `q.bb.rel`).
     - Tempo de reação determinístico por homem e momento (`hash2`, nada de `Math.random`).
  2. **Só estímulo percebido**: a granada precisa ser vista ou ouvida caindo; a de trás, já caída, não dispara nada.
  3. **Obediência por viés**: `cumprir` (o que a esquadra, o exercício e a ordem mandam: as camadas antigas) ganha `obe` × obediência; supressão alta e moral baixa reduzem a obediência. O `brGo` do reflexo ou da ação escolhida faz o exercício da esquadra esperar (sem `A.drb`) enquanto ele se salva.
  4. **Abrigo pela API do P2** (`brTps` sobre o `tps` do P2; com `TPS.on = 0`, o `cvPick` da parte 1): perfis `abrigo`, `recuo` (mais longe da ameaça), `fuga` (fora do raio da granada) e `blindado` (só o que para um blindado: parede, casa ou dobra do terreno, nunca mato; e o lugar onde ele de fato para, 1,4 m antes, também escondido, conferido na altura do corpo agachado). A nota de cada lugar é o quanto ele cobre da ameaça (0 a 1), e ele só troca se for 0,3 melhor que onde está. No máximo 3 consultas por passo para todos.
  5. **Rendição é estado da moral**: em pânico, com inimigo que ele vê a ≤ 70 m, sem líder a ≤ 30 m e sem recuo coberto. Larga a arma, fica de mãos para cima ("Eu me rendo!"), fora da luta (marcado como caído, então ninguém atira nele nem vai buscá-lo). Um inimigo a ≤ 5 m por 2 s o captura ("Mãos ao alto!"): é levado para a base do captor por 25 s e sai da batalha; depois de 8 s conta o que sabia (os colegas da esquadra, as esquadras e veículos do lado a ≤ 400 m, com 35 m de erro, como avistamentos do momento da captura, e a ordem da esquadra no diário). Sem inimigo a 100 m por 40 s, volta às armas. Online, o convidado vê "RENDIDO" ou "PRISIONEIRO" (bits 4 e 8 da linha do soldado). Isto é um P4 mínimo; o P4 completo (5 S, escolta, interrogatório no QG) continua por fazer.
  6. **Cada reação fala** (`fala`) e deixa um evento `cb` (`granada`, `devolvida`, `mergulho`, `atingido`, `blindado`, `abaixar`, `colega`, `lider`, `rendicao`, `prisioneiro`, `info`, `retoma`, `arma`, `rasteja`, `acao`).
  7. **Supressão contínua** `m.mo.s` (0..1: +0,14 por tiro passando, +0,4 por acerto, até +0,6 por explosão; meia-vida de 4 s, menor para veteranos); `m.sup` agora é derivado dela (pregado acima de 0,3). Moral `m.mo.m` (cai com colega caindo à vista, líder perdido, ferimento, isolamento, fogo de dois lados, blindado sem anticarro, sem munição; sobe sem fogo, mais com o líder perto e com veterania). Estados `firme`, `abalado`, `pregado`, `panico`, `rendido`.
- **Ações de utilidade**: `cumprir`, `abrigar`, `abaixar`, `recuar`, `pegar` (a arma do caído: sem munição, ou blindado perto e nenhum anticarro na esquadra e um lançador caído a ≤ 25 m, com o caminho coberto).
- **Contra blindado** (pedido do capitão, mensagem 006): quem vê um blindado e não tem anticarro **corre** (em pé) para onde parede, casa ou dobra do terreno o esconde dele a ≤ 30 m (a sombra da casa, a parede do outro lado, o vão; nunca mato) e, se o blindado continua vindo (40 m mais perto ou a menos de 120 m), **sai pelo outro lado**, sem ser visto, a ≤ 40 m. Deitar só quando nada o esconde perto. Quem tem anticarro segue caçando o blindado (o exercício `anticarro` e o `stalk` que já existiam).
- **Cartão da unidade** (`get_unit`): "Moral: 2 abalados, 1 pregado", "Homens por conta própria: abrigar, pegar", e `mo` nos dados.

### Ganchos (só embrulhos, salvo os três últimos)

`aiMan`, `downAI`, `sqRescue`, `drInc`, `damageMan`, `explode`, `nadeStep`, `manDown`, `genCard`, `brainHook('sold')` (P0), `Object.assign(FALAS, …)` (P5), `cvPick` (da parte 1: opções `away`/`min` e `hard`); da parte 1 também `lobbed`, `toss`, `drRun`. Edições diretas: a linha do soldado no `Net.snapshot` (bits 4 e 8 de rendido e preso; o código da fala no último campo já era da parte 1), o `Net.rx.ai` do convidado (`g.sur`) e o `drawHud` (rótulos RENDIDO/PRISIONEIRO).

### Exercícios sem tela (o "Pronto quando" do P1, rodados como medição, com `nice`)

`node tests/brain-soldado.js` (`N=6`, a última rodada):

- (a) tiro passando perto no aberto: ao chão em 0,28–0,48 s (6/6). Nas 6 sementes não havia abrigo a ≤ 10 m, então o "abrigo em ≤ 3 s" não foi exercitado.
- (b) granada a 5 m vista: saiu do raio (ou ao chão sem tempo) em 6/6, nenhuma devolvida (a 5 m ela está fora do alcance de devolver, 3,5 m); granada atrás dele, já caída, não percebida: nenhuma reação em 6/6.
- (c) em pânico, sozinho, inimigo à vista em volta no aberto: rendeu-se em 6/6; com o líder a 12 m e moral abalada: nunca (6/6).
- (d) sem munição, fuzil de colega caído a 15 m: pegou em 6/6.
- (e) caso do capitão, esquadra no aberto a 15 m de uma casa vê um tanque a 300 m: ninguém deitado à vista do tanque aos 3 s (0 de 20); **fora da visada do tanque aos 3 s: 18 de 20** (o pedido é todos; o exercício mede contra todos e por isso falha). Antes de juntar com o P2 eram 28 de 30 só com o `cvPick`; com o registro do P2, o mais perto que esconde às vezes é um trecho de muro ou uma dobra com caminho pior. Os que passam de 3 s se escondem até ~4 s.
- Outros testes do cérebro rodados como checagem de colisão (curtos, `nice`): `tests/brain.js` (P0: `BRAIN.on = 0` não muda a batalha; todo soldado com `m.rf`/`m.mo`/`m.tar`) passa; `tests/brain-honesty.js` (P7) passa; `tests/brain-falas.js` (P5) **falha em 1 de 4 lados**: 7 falas por minuto de contato, limite 6. Nenhuma das 7 é do P1 (são de contato, baixa, "Cadê ele?" e da formação); o P1 muda a batalha e com ela quantas dessas caem naquele minuto. No main sem este PR o teste passa.
- Custo: perfil de 60 s de IA × IA em 1944 no harness: o cérebro (com o que ele chama) fica em ~4,5% do passo, ≈0,6 ms de 13,8 ms; parte disso é a atribuição do V8 aos embrulhos do `aiMan` com a função interna inlinada. Medição bruta com `BRAIN.on` 1 × 0 oscilou demais com a carga da máquina para dizer mais.

### O que NÃO foi testado (parte 2)

Nenhuma suíte (`tests/all.sh`, `drills.js`, `infantry.js`, `squads.js`, `help.js`, `rec.js`, `perception.js` e as online), nenhum torneio A×B (a meta da pesquisa: "tempo exposto sob fogo" −30% sem regressão de vitória), nenhuma partida no navegador nem online. Só os exercícios acima, o `node --check` e partidas curtas de IA × IA no harness sem erro.

### Riscos (parte 2)

- **Limite de falas do P5**: com o P1 ligado, `tests/brain-falas.js` passou do limite num lado (7/min, limite 6). Pode precisar afinar o `FALA` ou o P1 falar menos.
- **`m.sup` derivado**: antes um único tiro passando pregava o soldado por 3,5 s; agora são precisos ~3 tiros seguidos (ou um acerto, ou uma explosão perto). As suítes que esperam o soldado pregado por um tiro (`infantry.js`, `drills.js`, `inf-drills.js`) podem mudar, e a infantaria pode avançar mais sob fogo leve.
- **Rendição**: depende da moral cair até pânico; os números (`SOLB.m`) não foram afinados em partida. Pode haver rendição demais ou nenhuma. O rendido conta como caído para todo o código antigo (mira, captura de ponto, força da esquadra).
- **Prisioneiro**: sai da batalha com `killMan` (conta como baixa para o lado dele e pontos para o captor). A informação vai como avistamento do momento da captura, então dura o `CMD.mem` (40 s) do general captor.
- **Arma do caído**: o soldado que pega um lançador passa a ser visto como anticarro pela percepção inimiga (`belCls`), o que é coerente; o convidado online continua vendo a arma antiga.
- **Contra blindado**: corre em pé para a sombra; se o blindado tiver infantaria junto, essa corrida pode custar caro. Em cidade densa a sombra é fácil; no aberto ele deita e fica com o exercício `tanque` (fumaça).
- **Briga de camadas**: o reflexo e a ação escolhida tiram o homem do exercício da esquadra (`A.brk` sem `A.drb`). Isso é de propósito ("desobedece para sobreviver"), mas pode desmanchar lances e assaltos sob fogo pesado.
- **Custo**: a utilidade a 4 Hz em contato e 1 Hz parado; o `percArmor` a 10 Hz por soldado. Num anfitrião lento, conferir o `AIB`.

### Como testar depois (parte 2)

1. `N=10 nice node tests/brain-soldado.js` (os 5 exercícios), `node tests/brain.js`, `node tests/brain-honesty.js`, `node tests/brain-falas.js`, `node tests/brain-lider.js`, `node tests/brain-drills.js` e `node tests/drills.js`, `node tests/inf-drills.js`, `node tests/infantry.js`, `node tests/squads.js`, `node tests/help.js`, `node tests/rec.js`, comparando com o main de antes do PR (`PAGE=<página antiga>`).
2. `BRAIN.on = 0` deve deixar a partida como antes desta parte 2 (a parte 1 continua ligada).
3. Torneio A×B fora do elrei (bartolomeu, ou aqui com `nice`): `BRAIN.on` 1 × 0 nas mesmas sementes; contar `cb` no `ANA` (rendições, prisioneiros, granadas devolvidas, `blindado`) e comparar vitórias e tíquetes.
4. No navegador, partida IA × IA em 1944 numa vila: ver soldados correndo para trás das casas quando um tanque aparece, "Eu me rendo!" e "RENDIDO" numa esquadra cercada, "Médico!" e o ferido rastejando.
5. Online: um convidado deve ver os balões, "RENDIDO" e "PRISIONEIRO" dos soldados do anfitrião.

## Seguimento do #145 (pedido do Firstmate: o caso do capitão a todos, e as falas por minuto)

**(e) todos fora da visada do tanque em 3 s.** As causas das falhas (2 a 6 de 20), achadas medindo homem a homem, e o que mudou:

- **Parava 1,5 m antes do ponto**: o andar antigo dá a chegada por feita a 1,5 m, e o caminho real (escorregando na parede) não é a reta que se conferia. Agora o reflexo leva o homem até o ponto (`brArrive`), corre em pé até 0,8 m dele (`SOLB.run`, antes 2 m, quando passava a andar agachado a 1,35 m/s), e "onde ele para" é conferido em três pontos a 1,4 m (de frente e a ±45°, `CVR.stopA`).
- **Ficava com um lugar ruim porque o bom já era de um colega**: a sombra de cada casa tem agora duas profundidades (`CVR.lee` 3 e 4,5 m) e cinco ângulos, o `covBld` dá 12 lugares de parede (eram 6), e contra blindado dois homens podem ficar atrás da mesma parede (`CVR.hgap` 0: sair da visada primeiro, espalhar depois).
- **Ia para dentro do prédio ou contornava a quina**: no primeiro movimento contra blindado não há vão de prédio (só na saída pelo outro lado), e o caminho que cruza uma parede conta 1,8 vez (`cvWay`) na escolha. Testei pontos logo atrás das quinas e tirei: o homem trava na própria quina.
- **Passava pela sombra e saía dela**: correndo para o ponto, se já está fora da visada a até 3 m dele, fica ali (`SOLB.arm.stay`).
- **Longe demais de qualquer parede**: se deitar onde está já o esconde (dobra do terreno) e o abrigo duro mais perto passa de 14 m (`SOLB.arm.reach`), ele deita ali (fora da visada, não "no aberto").
- O exercício agora junta a esquadra a até 2 m do ponto a 15 m da casa (antes era uma fila de 8 m num eixo fixo do mapa, que punha os das pontas a 18–30 m da casa, onde a 5,6 m/s não há como chegar em 3 s).

Resultado: **50 de 50** (10 sementes) e **100 de 100** (20 sementes) fora da visada aos 3 s, ninguém deitado à vista.

**Falas por minuto.** Com o P1 desligado (`SOLB.on = 0`, chave nova do P1 para o A/B) o lado que falhava tinha **10 falas em 2,0 min** de contato; com o P1 ligado, **7 falas em 1,0 min**. O P1 não acrescenta falas, tira: os soldados saem da visada, o inimigo os perde ("Cadê ele?", "Perdi ele!") e o contato acaba antes. A taxa passava de 6 só porque `tests/brain-falas.js` dividia pela janela de contato (do primeiro ato a 30 s depois do último contato) e contava também as falas de depois dela (o líder mudando a formação aos 63 s e 91 s). Corrigi a medida para contar só as falas dentro da mesma janela; agora passa nos 4 lados (4 a 5 falas/min).

Rodados (curtos, `nice`): `tests/brain-soldado.js` (N=6 e N=10, todos ok), `tests/brain.js`, `tests/brain-honesty.js`, `tests/brain-falas.js`. Nada além disso.

