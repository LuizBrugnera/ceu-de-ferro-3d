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
| cf-3l-p4-faccao | em parte | nomes, M1A1/M109A7, sem aviação, tetos, antiaérea em técnicas; hangar no navegador (classes sem avião, lado guardado, "Dois"/"Três") | **texto**: "pela Insurgentes"/"pela EUA" → "pelos Insurgentes"/"pelos EUA" |
| cf-3l-p5-servidor | em parte | `tests/sides3-online.js` (ns 3, `sides`, `side`, `cq` v2); suítes do servidor com 2 lados passam | `gen-relay`, `sappers-relay`, `forts-relay` atualizados (lado 2, mina 2 e obra 11 viraram válidos); a ponte MCP ganhou os textos de 18 códigos de recusa novos |
| cf-3l-p6a-frente | em parte | rodízio do plano, tetos por facção, nenhuma aeronave insurgente, toda coluna sai numa estrada do lado virada para a outra ponta | **`trnPlan`**: o caminhão estacionado insurgente nascia na base dos EUA (estrada 0); teste em `tests/sides3.js` |
| cf-3l-p6b-manobras | em parte | `mnFoes`, `mnBase`, `mnLead` | — |
| cf-3l-p6c-logistica | em parte | economia com 3 lados, instalações do lado 2, `ecoLook` dentro do mapa, `lsRail` nas estradas do lado | — |
| cf-3l-p7-guerrilha | em parte | `PERS.ins` só para os Insurgentes e fora do sorteio; no navegador o general insurgente mandou um homem-bomba contra um posto | — |
| cf-3l-p8-civis | em parte | `civD` com 3 lados; a vila que odeia a Rússia arma milícia insurgente, e depois a dos EUA; "se voltou contra Rússia" nos diários | — |
| cf-3l-p9-analise | em parte | cabeçalho `n` 3, `anaReport` `ns` 3; revisão de 3 lados no navegador; `tests/ana-online.js` passa | **análise online**: lotes com `cb` recusados pelo servidor (o fim e o resumo de partidas online se perdiam); **`--lados 3`** sem `--mapv` parava |

Também consertado neste lote: a **Visão de General com 3 lados** só tinha as abas EUA e Rússia, o relógio mostrava 2 tíquetes e 2 placares, e a tabela de forças do lado 2 lia `V.f[-1]` (o painel quebrava para um jogador insurgente). Agora há a aba (e a tecla 3) dos Insurgentes, o relógio mostra os 3 lados, "Inimigo" soma os dois inimigos e a curva de tíquetes desenha cada inimigo na sua cor. Teste em `tests/sides3.js` (`genForceRows`, `genTrendCols`, `held` com 3 lados).

Achado e não consertado (seção CEREBRO, outra frente): a defesa por posições (DFP) sobrescreve o texto comum da recusa `far` ("Longe demais do ponto"), então toda ordem recusada por distância (a economia, as obras) mostra esse texto; `tests/mcp-general.js` acusa isso (a única falha que resta nele).
