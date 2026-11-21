# cf-pol-testes-a: o que foi testado de verdade em `docs/nao-testado/` (metade A)

Metade A: do primeiro documento em ordem alfabética (`cf-3l-p0-fundacao.md`) até `cf-lideres-p3.md`, 49 documentos. A outra metade (de `cf-m0-medicao.md` em diante) é de outra tarefa.

Como foi testado: exercícios sem tela no harness (`tests/harness.js`), as suítes de `tests/` que cada documento cita e, no que se vê, a página num Chromium sem janela (1280 e 1920 px). A máquina estava dividida entre várias tarefas: a partir das 21h20Z, um processo pesado por vez para a tarefa inteira. Por isso partidas longas, torneios e muitas suítes ficaram de fora; cada documento que sobrou diz o que falta.

Legenda: **passou** (o que o documento listava rodou e deu certo; o documento saiu), **em parte** (parte rodou; o documento ficou só com o resto), **falhou** (algo rodou e deu errado; consertado ou documentado).

## Lote 2: cf-consertos-61 a cf-economia-ligada (PR #175)

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-consertos-61 | em parte | guarda do pelotão de defesa: 0 pelotões num ponto alheio em 100 rodadas (200 sem a guarda); base avançada aos 90 s a 392 m e 457 m de pontos tomados; construtores mortos: a ordem acaba em 4 s e a próxima escolha fica a 5,977 km | — |
| cf-construir-general | **falhou** | `fort bunker` numa vila tomada: aceita, mas começaram os sacos de areia da própria esquadra; um homem a 53,9 m, obra em 0% por 92 s | não consertado (general, outra frente); suspeitos no documento |
| cf-construir-mais | em parte | limite de bases nas 9 combinações; recusa `cost` sem dinheiro; `bmrPay` e "aguarda o orçamento de obras"; `wk` com 9 números | — |
| cf-controle-aviao | em parte | f22, a10, spit: W baixa o nariz 22–40°, S levanta 11–30°, acelerador intacto; invertido troca; Shift +0,4, Z −0,6 | — |
| cf-cupula-general | em parte | um lado pediu a cúpula por fogo inimigo e outro a ordenou numa partida de teste | — |
| cf-dano-caminhao | em parte | `tests/dano-caminhao.js` 22/22 | — |
| cf-defesa-posicoes | em parte | `tests/dfp.js` 10/10 nos mapas 10, 4 e 11 | `tests/dfp.js` quebrava (carros sem modelo): consertado |
| cf-dobrar-pop | em parte | 165 e 163 soldados por lado (teto antigo 120), teto 480, `popK` 0,9 | — |
| cf-economia-ligada | em parte | sem opção de economia no painel Partida; `S.eco` no solo e no Assistir; `eco: 1`/`lg: 1` no welcome | — |

## Lote 1: os 12 documentos de 3 lados (cf-3l-p0 a cf-3l-p9)

Testes novos: `tests/sides3.js` (o "como testar" de P0 a P9 numa partida de 3 lados, ~3 min) e `tests/sides3-online.js` (sala de 3 lados pelo servidor de verdade, ~30 s). No navegador: o hangar com os três lados (1280 e 1920 px), uma partida IA × IA × IA na Visão de General e no 3D, a eliminação dos Insurgentes e a revisão pós-batalha.

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-3l-p0-fundacao | **passou** (apagado) | `SIDES()` [0,1,2], `ALL()` 7, `isSide`, `S.rel` 3 × 3, `foes`, `foeBase` com e sem lugar, e com 0 e 1 aliados `foes`/`mnFoes`/`lsFoes`/`civFoes` de 0 = [2] | — |
| cf-3l-p1-mapa | em parte | 3 bases, pontas das 5 estradas, sede em HS2, vila K, `myRoutes` por lado, 17 pontos, 4 jazidas do lado 2 em chão seco e plano; com 2 lados, 2 bases e 3 estradas; B2 e HS2 no mapa do general | — |
| cf-3l-p2-conquista | em parte | ponto 2/5/4 tomado pelo lado 1 no ritmo da margem; eliminação por tíquetes e por base; colocação; online, `cq` v2, eliminação deduzida pelos convidados e "Derrota · 2º lugar" | — |
| cf-3l-p3-percepcao | em parte | `sT`/`spotted` por lado, `cmdSense` só do lado que viu, `ecoHid` pelo bit, suspeita da mina só para quem pisou; em batalha há alvos vistos por um inimigo só | — |
| cf-3l-p4-faccao | em parte | nomes, M1A1/M109A7, sem aviação, tetos, antiaérea em técnicas; hangar no navegador (classes sem avião, lado guardado, "Dois"/"Três") | "pela Insurgentes" → "pelos Insurgentes" (também feito no #172) |
| cf-3l-p5-servidor | em parte | `tests/sides3-online.js` (ns 3, `sides`, `side`, `cq` v2); suítes do servidor com 2 lados passam | `gen-relay`, `sappers-relay`, `forts-relay` atualizados (lado 2, mina 2 e obra 11 viraram válidos); a ponte MCP ganhou os textos de 18 códigos de recusa novos |
| cf-3l-p6a-frente | em parte | rodízio do plano, tetos por facção, nenhuma aeronave insurgente, toda coluna sai numa estrada do lado virada para a outra ponta | **`trnPlan`**: o caminhão estacionado insurgente nascia na base dos EUA (estrada 0); teste em `tests/sides3.js` |
| cf-3l-p6b-manobras | em parte | `mnFoes`, `mnBase`, `mnLead` | — |
| cf-3l-p6c-logistica | em parte | economia com 3 lados, instalações do lado 2, `ecoLook` dentro do mapa, `lsRail` nas estradas do lado | — |
| cf-3l-p7-guerrilha | em parte | `PERS.ins` só para os Insurgentes e fora do sorteio; no navegador o general insurgente mandou um homem-bomba contra um posto | — |
| cf-3l-p8-civis | em parte | `civD` com 3 lados; a vila que odeia a Rússia arma milícia insurgente, e depois a dos EUA; "se voltou contra Rússia" nos diários | — |
| cf-3l-p9-analise | em parte | cabeçalho `n` 3, `anaReport` `ns` 3; revisão de 3 lados no navegador; `tests/ana-online.js` passa | **análise online**: lotes com `cb` recusados pelo servidor (o fim e o resumo de partidas online se perdiam); **`--lados 3`** sem `--mapv` parava |

Também visto neste lote: a **Visão de General com 3 lados** só tinha as abas EUA e Rússia, o relógio mostrava 2 tíquetes e 2 placares, e a tabela de forças do lado 2 lia `V.f[-1]`; o polimento do HUD (#172) consertou isso ao mesmo tempo (aba e tecla 3, uma coluna por inimigo), e no merge ficou a versão dele. Daqui ficaram a curva de tíquetes de cada inimigo na sua cor (`genTrendCols`: a do lado 2 desenhava a coluna do relógio como tíquetes) e os pontos dos 3 lados no modelo da vista; teste em `tests/sides3.js`. O texto "pela Insurgentes" também foi consertado pelos dois lados; ficou o do #172.

Achado e não consertado (seção CEREBRO, outra frente): a defesa por posições (DFP) sobrescreve o texto comum da recusa `far` ("Longe demais do ponto"), então toda ordem recusada por distância (a economia, as obras) mostra esse texto; `tests/mcp-general.js` acusa isso (a única falha que resta nele).

## Lote 3: cf-engenharia-pontos a cf-general-constroi

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-engenharia-pontos | em parte; **falhou** a medição | os muros param fuzil e .50 (0 de 30 tiros atrás deles, 30 de 30 sem), cortam a visada, caem com explosivos e aparecem certos nas duas épocas; numa partida de 400 s a engenharia sai aos 41–52 s mas fica em "aguarda energia e metal" de 128 a 355 s: só 2 peças de pé aos 380 s | não consertado (precisa de medição da economia no começo); documentado |
| cf-era-padrao | **passou** (apagado) | no navegador abre em Hoje, troca para 1944 e volta, "Assistir" em 1944 roda a IA × IA local, "Entrar na sala" em 1944 entra online | — |
| cf-estradas-chao | em parte | 11 e 13 estradas de terra, custos, caminhão a 0,7 na terra (tanque não perde), pontes +1/+4; `tests/roads8-gen.js` refaz as tabelas da página | — |
| cf-estradas-flutuando | **falhou**, consertado | em Hoje quase nenhuma estrada aparecia em 3D fora das vilas: desde #100 o índice da fita contava do zero em cada aresta e só a primeira estrada de cada classe era desenhada | `roadRibbon` (o índice conta do que a malha já tem); `tests/road-mesh.js`: 8 falhas antes, passa depois; o mesmo número de triângulos (o custo por quadro não muda) |
| cf-explosoes | em parte | as três explosões aparecem sem erro (bola de fogo, onda, fumaça, começo do cogumelo) | — |
| cf-folego | **passou** (apagado) | corrida a 5,6 m/s sem cansar, o atirador prende o fôlego 20 s sem tremer, 60 s de IA × IA sem ninguém cansado, sem barra de fôlego no HUD | `tests/folego.js` novo |
| cf-foguete-tecnica | em parte | `tests/foguete-tecnica.js` passa | — |
| cf-gbu-lock | em parte | a trava escolhe o alvo mais perto ao alcance, "FORA DE ALCANCE" além dele, o morro bloqueia, jogador e IA concordam (o buscador só vê 6,5 km) | `tests/gbu-lock.js` novo |
| cf-general-constroi | em parte | nível 1 aos ~120 s, antiaérea fixa de 1 a 3 por lado, 1–2 ninhos, 14 e 7 minas, a poupança no diário | — |

## Lote 4: cf-arma-1p a cf-colisao-veiculos

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-arma-1p | em parte | capturas do M4 do quadril e mirando, Kar98k mirando, RPG, Javelin, M4 dentro de casa; para olhar: o M4 grande do quadril, o Kar98k torto na mira, o Javelin turquesa | — |
| cf-armas-combinadas | em parte | 48 s ligado × desligado: 5 duplas carro-esquadra formadas, nada quebrou | — |
| cf-bombardeiro | em parte; **falhou** a pontaria | os 4 bombardeiros aparecem; um B-2 entra, solta as 8 bombas e é abatido na volta; mas as 8 crateras ficam numa linha de 770 m a 170 m do alvo (raio da bomba 135 m) | não consertado (causa não achada); documentado |
| cf-camera-bomba | em parte | a janela abre quando a bomba cai, a tecla ` põe em tela cheia, desligada não aparece; ela cobre o texto do HUD do avião | — |
| cf-caminhoes-parados | em parte | `tests/trucks-base.js` passa (18) | — |
| cf-canhao-dano | em parte | `tests/shell-hits.js` passa (26); civil em pé morre; saco de areia para o perfurante; Hydra e RPG-7 matam; contra o soldado deitado o tiro ainda pega o chão ~20 m antes | — |
| cf-casas-paredes | **falhou**, consertado | a .50 dos veículos (M2 do tanque, Kord, NSVT, DShK, a quádrupla do M16) não atravessava reboco nem tijolo | `bPow` com o mínimo pelo calibre (`CITY.pen.cal`); `tests/walls-pen.js`: 5 falhas antes, passa depois |
| cf-cerebro-soldado | em parte | a dobra do terreno corta o dano a 0,35; granada na trincheira cai no fundo; morteiro a 5 m empurra 1,79 m e atordoa 2,86 s; granada da IA de 8–10 m cai a 5,6–6,9 m do alvo e uma atravessou a casa pela janela (não consertado: CEREBRO) | — |
| cf-colisao-veiculos | **falhou**, consertado | 6 veículos da IA destruídos pelo próprio lado no primeiro minuto (colunas saindo da base batendo de frente a 15–51 m/s) | `vcolPair`: dois veículos da IA do mesmo lado só se empurram; `tests/vcol.js`: 5 falhas antes, passa depois; dois tanques de frente a toda velocidade ainda morrem os dois (documentado) |

## Lote 5: cf-granada-casas a cf-lideres-p3

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-granada-casas | em parte | granadas abrem reboco em 3, tijolo em 4, pedra em 6, celeiro em 1; 3 kg derrubam a laje; morteiro, RPG, minas, IED e carga de parede como descrito. Balanço: num cômodo fechado a 2ª e a 3ª granada quase não fazem nada (quebrado o vidro, o cômodo deixa de contar como fechado) | — |
| cf-guerrilha-mais | em parte | 60 s de 3 lados: 5 táticas ativas com motivo, 3 ações no diário, sem erro; um texto diz "em a usina" (seção do general, não mexido) | — |
| cf-inf-fogo-longe | **falhou**, consertado | o muro de sacos de areia do procedimento nunca saía: `DRILL.inf.far.bags` não existia, o lugar dava NaN e a obra era recusada | `bags: 3`; `tests/fogo-distante.js`: falhava, passa |
| cf-infantaria-veiculos | em parte | a medição de carona funciona; nenhuma carona terminou em 60 s; `icv.js` e `embarque.js` não couberam | — |
| cf-insurg-antiaerea | em parte | os veículos novos montam, o rodízio passa pelos 8 tipos, uma picape ZU-23 deu 78 tiros num Mi-28 | — |
| cf-insurgente-civis | em parte | a simpatia por vila é calculada e a memória sobe com mortes pelos regulares; recrutar sem soldado nosso é recusado (`rcr0`) | — |
| cf-insurgentes-conteudo | **falhou**, consertado | o carro-bomba da IA parado na estrada com alvo a menos de 900 m nunca saía: no trilho o volante não responde | a IA da bomba tira o carro do trilho; `tests/bomba-ia.js`: falhava, passa (anda 600 m e destrói um T-72) |
| cf-intercepta-missil | **falhou**, consertado | nenhum tiro acertava um míssil: o teste comparava o tiro depois do passo com o míssil antes (~2 m de diferença para 1 m de raio) | `stepShots` usa o míssil no fim do passo; `tests/mint.js`: 5 falhas antes, passa (a .50 derruba com 8 tiros, 30 mm com 2) |
| cf-lideres-p0 | em parte | nada novo rodou (a checagem online está escrita, não rodada); a nota do `pel-forma` que sobrescrevia o tipo do evento da análise | consertado na entrada da análise (lote 1) |
| cf-lideres-p3 | em parte | morto o líder, um cabo assume em 2 s e a esquadra segue a missão (215–220 m em 60 s contra 223 m sem a perda) | — |

Suítes que já falham no `main` (iguais com e sem estes lotes): `sim-split` (`rtsS`/`rtsBrain` nomeados em seções CEREBRO), `inf-drills` (4 checagens), `brain-lider` ("the unit card"), `mcp-general` (o texto `far`, ver o lote 1).

## Rodada 2 (depois dos cinco lotes)

| Documento | Resultado | Evidência | Conserto e teste |
|---|---|---|---|
| cf-bombardeiro | **falhou** a pontaria, consertado | o tapete do B-2 fora do alvo era o procedimento `radar-aa` disparando em plena corrida (comandos em `roll 1` enquanto o `stkFly` pedia reta): a linha passava 170 m ao lado ou a corrida era abandonada ("arremete e volta") | nenhum procedimento de aeronave manobra o bombardeiro estratégico enquanto ele alinha e corre (`daHeld`; os flares continuam); `tests/bomber-run.js`: antes arremete e nenhuma cratera, depois 8 crateras com a mais perto a 24 m do alvo |
| cf-colisao-veiculos | visto, não mudado | a calibragem do golpe (`VCOL.v` 20 m/s em velocidade do mapa, 2,3 × a do painel) mata os dois tanques num choque de frente a toda velocidade, contra "os dois perdem pouco hp" do documento; o exemplo do autor era a 10 m/s | escolha de balanço para o capitão (dividir o fechamento por `GSPD` deixaria ~36%) |
| cf-3l-p6a-frente | **falhou**, consertado | numa partida de 3 lados de 87 s, uma ZPU-2 insurgente requisitada nasceu na estrada 0 (a frente global, `frontR()`), na base dos EUA; os mesmos restos de 2 lados no veículo-rádio, nas equipes dispersas, na próxima base de suprimento, nos helicópteros e na lista de entrada | `frontR(t)` e `dsOf(t, ri)` nesses pontos (com 2 lados, os mesmos valores); `tests/sides3.js`: no `main` 2 falhas (antiaérea na estrada 0, helicóptero atrás da linha errada), aqui passa; `bases` falha igual no `main` (3) |
| cf-3l-p8-civis | regressão consertada (teste) | `civ-war` falhava em 7 pontos (igual no `main`): a vila da cena de evacuação ficou maior (310 m de raio) que o ouvido do tiro (220 m) e o atirador, posto a 60 m do meio do terreno, só assustava 1 de 14 civis | o atirador a 60 m do meio das pessoas: a vila evacua, vai ao refúgio e volta (`tests/civ-war.js`: 7 falhas → nenhuma) |
| cf-3l-p3-percepcao | regressões consertadas (testes) | `seat` comparava o mapa 4 em JSON exato e um arredondamento de 10⁻¹² m nas casas o quebrava; `sappers` esperava os kits de sapador por último, e depois deles vieram os dos Insurgentes e os médicos (os números antigos não mudaram) | `seat` compara ao milímetro; `sappers` confere os números antigos e que só kits novos vêm depois (2 + 2 falhas → nenhuma) |
| cf-3l-p5-servidor | **falhou**, consertado (rodada 4) | a ponte MCP dos Insurgentes numa sala de 3 lados nunca recebia o mapa: o `state` deles tinha 23 KB (blocos `icv` e `grl`) e o servidor só repassa `gres` até 16 KB | `genAnswer` tira os blocos que a ponte não lê até caber; `tests/mcp-sides3.js`: antes sem mapa nem tíquetes (2 falhas), depois passa; `tests/sides3.js` confere o tamanho do `state` dos 3 lados (13–14 KB) |
