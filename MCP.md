# Um modelo como general (ponte MCP)

`mcp-general.js` é um servidor MCP (stdio) que deixa um modelo, como o Claude Code, comandar **um lado** do Céu de Ferro 3D como general. Ele entra na sala do servidor como um cliente sem corpo (`cls: 'gen'`), pega a cadeira de general do lado escolhido e traduz cada chamada de ferramenta em uma ordem para o anfitrião da partida. A IA mecânica continua decidindo nos domínios que o modelo não toma.

Foi provado contra o jogo de verdade (anfitrião rodando a página, economia ligada, mapa versão 4) nas duas épocas, nos dois lados: `node tests/mcp-live.js` (moderna) e `ERA=ww2 node tests/mcp-live.js`.

## Como subir

1. Servidor, com uma chave (sem `GENKEY` o servidor recusa toda ponte):

   ```
   cd /caminho/para/ceu-de-ferro-3d
   GENKEY=minha-chave node server.js
   ```

2. Alguém precisa estar na sala como **anfitrião**: abra `http://localhost:8080` em um navegador e entre na sala da época (`modern` ou `ww2`). É a página dessa pessoa que simula a partida; sem anfitrião todas as ordens voltam recusadas ("A sala está sem anfitrião"). O modelo comanda o lado que você quiser, inclusive o do próprio anfitrião.

3. O cliente MCP sobe a ponte sozinho. No Claude Code, crie um `.mcp.json` na raiz do projeto (este arquivo **não** foi criado por mim):

   ```json
   {
     "mcpServers": {
       "ceu-general": {
         "command": "node",
         "args": ["/caminho/para/ceu-de-ferro-3d/mcp-general.js"],
         "env": {
           "CEU_URL": "ws://localhost:8080",
           "CEU_ROOM": "modern",
           "CEU_SIDE": "1",
           "CEU_KEY": "minha-chave",
           "CEU_NAME": "Claude"
         }
       }
     }
   }
   ```

   - `CEU_ROOM`: a época, `modern` ou `ww2`.
   - `CEU_SIDE`: `0`, `1` ou `2`, o lado a comandar (um general por lado; humano ou ponte, quem pedir primeiro). O `2` (Insurgentes) só existe na Frente atual com 3 lados; veja a tabela abaixo.
   - `CEU_KEY`: igual ao `GENKEY` do servidor.
   - Opcionais: `CEU_SEAT=0` (não pega a cadeira ao conectar; o modelo chama `seat`) e `CEU_DOMAINS` (domínios tomados junto com a cadeira, padrão `eco`).

## Lados e facções

| `CEU_SIDE` | Frente atual (`modern`) | Frente de 1944 (`ww2`) |
|---|---|---|
| `0` | EUA (a antiga Força Azul) | Alemanha |
| `1` | Rússia (a antiga Força Vermelha) | Aliados |
| `2` | Insurgentes (só numa sala de 3 lados) | (não existe) |

- O número de lados é da sala: quem entra primeiro diz (`ns` no `join`) e o `welcome` repete. Uma página de outra contagem é recusada (`sides`).
- Com 3 lados é todos contra todos: os dois inimigos também lutam entre si. As instruções da ponte dizem a facção e os dois inimigos.
- No `get_state`, `link` traz `faction`, `sides` e `enemies`. Com 3 lados, `holder` e `base` dos pontos dizem `ours`, `contested` ou o nome da facção (`USA`, `Russia`, `Insurgents`) em vez de `enemy`, e `tickets` vira um mapa por facção. Com 2 lados tudo continua como antes.
- Uma ponte de lado 2 pode entrar numa sala vazia; se o primeiro jogador abrir a sala com 2 lados, o servidor a desconecta (`sides`) e ela tenta de novo depois.
- **Não testado** (veja `docs/nao-testado/cf-3l-p5-servidor.md`).

## Primeiro prompt sugerido

> Você é o general do lado 1 no Céu de Ferro 3D, uma partida em tempo real que corre enquanto você pensa. Jogue em ciclos: `get_state` com `refresh_map: true`; leia estoque, instalações, fila, pontos do mapa e esquadras; dê poucas ordens (economia com `build_site`, `produce_unit`, `set_priority`; tática com `send_command`: `atk`, `hold`, `move`, `fire`...); depois `wait` de 20 a 40 s e recomece. Chame `ask_view` uma vez para ver custos e jazidas e `ask_placement` antes de `build_site`. Toda ordem volta aceita ou recusada com o motivo em português: leia o motivo e corrija, não repita a mesma ordem. Confie na idade (`ageSeconds`) do que lê. Prioridades: energia e metal, uma fábrica, esquadras e blindados, tomar o ponto contestado mais próximo, defender o que for seu. No fim, `seat` com `release` devolve tudo à IA.

## O que o modelo pode fazer

Versão 2 (W13): o modelo tem as mesmas ferramentas que o general da IA e que o jogador na Visão de General. Todas passam pelo mesmo funil (`genCmd`) e voltam aceitas ou recusadas com o código e o motivo em português, o mesmo texto que o jogador lê (a tabela `PT` de `mcp-general.js` é igual à da página; `tests/mcp-general.js` confere).

- Ler: `get_state` (economia, instalações, fila, esquadras com ids, nome e posto (`recruit`, `regular`, `veteran`, `elite`), os veículos e aeronaves veteranos do lado, pontos com índice e dono, avistamentos, últimas linhas do diário; tudo com idade; com o mapa, `personality` e `difficulty` do general da IA do seu lado e `enemyHabits`, as estradas por onde o inimigo passa de novo e de novo), `get_log`, `ask_view`, `ask_why`, `ask_placement`.
- A economia e a logística ficam sempre ligadas: nenhuma chamada as desliga.
- Economia: `build_site` (pow, mine, fab), `produce_unit`, `cancel_order`, `set_priority`, `scrap_site`, `set_site_defence`, `set_reserve`, `scout`, `strike`.
- Produção e despacho: `set_production_plan` (quantos de um tipo em campo; `auto` devolve tudo ao plano da IA), `dispatch_units` (1 a 4 da reserva agora, com missão, área, latitude, regras de engajamento e hora H), `assign_mission` (missão nova para esquadras em campo), `get_production_plan` (postura, teto de população e, por tipo, desejado, em campo, reserva e fila). O `get_state` traz o plano em `economy.productionPlan`.
- Logística: `get_logistics` (cada nó com caixas, capacidade, prioridade, se está ligado à base, o que está a caminho e há quanto tempo está seco; os comboios; o custo das entradas; a linha fraca), `send_convoy` (um caminhão com 40 caixas da base principal para um nó, `b<id>` ou `p<índice>`), `airlift_supply` (hoje: 20 caixas de helicóptero de transporte da reserva), `set_supply_priority` (0 a 3, -1 volta ao padrão). Sem ordens, o general logístico da IA manda os comboios sozinho.
- Recuperação e evacuação: `get_recovery` (os cascos imobilizados com o número, se estão sendo rebocados e quanto falta para virarem sucata; os grupos de feridos à espera; os veículos em missão; a reserva de veículos de recuperação, ambulâncias e helicópteros; o custo do reparo), `recover_vehicle` (o veículo de recuperação da reserva reboca um casco pelo número até o nó mais próximo; um casco inimigo até 300 m à frente da linha é capturado), `send_medevac` (ambulância, ou hoje o helicóptero, para os feridos perto de x, z), `send_repair_truck` (o caminhão de reparo da reserva para os veículos avariados perto de x, z; `get_recovery` lista os grupos em `damaged` e a reserva em `reserve.rpr`). `dispatch_units` também manda `rpr` (caminhão de reparo, missão `repair`) e `amb` (ambulância, missão `medevac`) a uma área, onde trabalham e esperam 2 min, e `set_production_plan` aceita `rpr` e `amb`. Sem ordens, o general de Apoio da IA faz isso sozinho.
- Ordens amplas: `order_units` (atacar, defender, reconhecer, escoltar, emboscar ou fogo num ponto ou lugar, com as esquadras que você nomeia, N que o general escolhe ou, com `create`, N unidades novas de um tipo despachadas da reserva; elas decidem como: no ataque, cada uma forma num eixo próprio em volta do objetivo), `request_support` (fogo, reconhecimento, apoio aéreo ou transporte: o general escolhe quem atende) e `build_defence` (trincheira, sacos de areia, casamata, posto anticarro, posto de observação, posição antiaérea, campo minado anticarro ou antipessoal, base de suprimento; o general escolhe quem constrói). As três aceitam uma rota (`route`, de 1 a 8 pontos) por onde as esquadras passam antes do alvo, quando a ordem manda esquadras a um lugar (a descrição de cada ferramenta diz em quais tipos).
- Pontes: `get_bridges` (cada ponte com o estado, a vida, se a passagem está aberta, o pontão e as duas cabeceiras), `demolish_bridge` (uma esquadra livre do seu lado arma as cargas na ponte mais perto de x,z), `lay_pontoon` (uma esquadra, sapadores primeiro, lança um pontão na ponte caída mais perto de x,z, até 800 m, quando x,z está a até 150 m dela ou nenhum trecho estreito livre do rio está mais perto; senão no trecho estreito do rio mais perto de x,z, até 400 m, abrindo uma travessia nova que as rotas usam, e também quando a ponte caída já tem o pontão dela e x,z está a mais de 150 m; recusa `pcap` quando o seu lado já tem 3 pontões fora das pontes) e `build_bridge` (uma esquadra constrói uma ponte permanente nova no trecho estreito do rio mais perto de x,z: até 12 min, 20 de energia e 100 de metal com a economia), `rebuild_bridge` (uma esquadra, sapadores primeiro, reconstrói a ponte caída mais perto de x,z: 2 a 5 min, 40 de metal com a economia, recusa `cost` sem esse metal). `get_bridges` traz também a reconstrução de cada ponte, os pontões fora das pontes (`ps`) e os trechos do rio onde cabe um (`sites`). Ponte caída fecha o rio ali para tudo menos o anfíbio.
- Tática, por `send_command` (`d: "cmd"`): `atk`, `stop`, `man`, `amb`, `res`, `ctr`, `hold`, `raid`, `sup`, `work`, `req`, `fire`, `recon`/`move`/`assault`, `free`, `doc`, `pos`, `focus`, `rally`, `mark`, `posts`, `ctl`, `mil` (armar os civis de uma vila como milícia), `camp` (abrir uma campanha com hora H comum e juntar operações a ela, cada uma com um papel), `dpol` (política de defesa de um ponto ou instalação), `triage` (prioridade de um incidente, ou ignorá-lo), `qrf` (mandar a força de reação a uma ameaça), a pergunta `threats` (o quadro de ameaças e as campanhas), a pergunta `tmap` (uma camada do mapa tático do seu lado em células de 1 km, `k` uma de `f` força inimiga, `v` vigilância inimiga, `o` ocultação, `t` tráfego inimigo, `p` nossas perdas, `k` gargalos, `l` frente; só o que o lado sabe), a pergunta `ap` (as três abordagens do seu lado ao ponto mais perto de `x`, `z`, a até 800 m, ou ao lugar da estrada mais perto: de onde o ataque parte, e para cada uma o ângulo do eixo, comprimento, minutos a pé, a parte à vista do inimigo, na mata e sobre a estrada do eixo, a posição de assalto, a reunião fora da vista e o caminho; `a` 1 ou -1 escolhe de que lado da estrada; só o que o lado sabe), e as ordens amplas `ord`, `fort` e os pedidos de `req` (`fire`, `recon`, `cas`, `lift`); `rt` (lista plana de pares x, z) leva a rota em `move`, `hold`, `recon`, `assault`, `work`, `man` (flanco e finta), `ord`, `fort` e `req`. A descrição da ferramenta traz o JSON de cada uma. O `fire` do modelo segue as regras de engajamento da IA: num ponto onde o lado viu civis ao ar livre há pouco e o alvo não está identificado, volta recusado (`roe`). O `get_state` com `from_host: true` traz `civ`: civis mortos pelo seu lado e pelo inimigo, os tíquetes que isso custou, fogo suspenso pelas regras de engajamento e, por vila, moradores em casa, evacuados e contra quem ela se voltou.
- Emboscadas e ruas alternativas, por `send_command` (`d: "cmd"`, `c: "man"`): `k: "ambush"` arma uma emboscada planejada na estrada mais perto de `x`, `z` (assalto, apoio e seguranças, cada esquadra pelo caminho que o inimigo menos vê, à espera da passagem que o hábito dele prevê; `n` de 1 a 3 esquadras), `k: "interdict"` faz o mesmo numa estrada de suprimento inimiga e pede fogo na hora prevista, e `k: "guard"` manda uma esquadra segurar o entroncamento ou a ponte perto de `x`, `z` que alonga o caminho do inimigo até um ponto seu. Só valem com o mapa tático do lado; `stop`/`cancel` encerra como qualquer manobra.
- Ritmo: `wait` (até 60 s de tempo de partida) volta antes se algo notável acontecer: operação ou assalto começou/terminou, ponto trocou de dono, instalação sua destruída ou pronta, reforço, relatório. Traz um resumo do que mudou.
- Revisão: `get_match_report` traz a revisão pós-batalha da partida em curso (só o seu lado enquanto ela corre; os dois depois do fim; `mano` resume a manobra do general: assaltos e como chegaram, manobras, emboscadas, tráfego fora dos eixos), `match: "list"` lista as partidas terminadas que o servidor guarda e `match: "<época>/<nome>"` traz a de uma delas.
- Campanhas e defesa (v2): `create_campaign` (hora H comum, devolve o id; a campanha espera as operações até a hora H), `attach_operation` (uma operação na campanha, com o papel main, sec, fnt ou raid), `end_campaign`, `get_threats` (o quadro de ameaças, as campanhas e as políticas), `triage_threat` (-1 ignora, 0 a critério do quadro, 1 a 3 prioridade), `send_qrf` (a força de reação agora) e `set_defence_policy` (num ponto ou instalação: quantas esquadras respondem, a antiaérea fixa e quando a força de reação reage).
- Estratégias do general (M8): o `get_state` traz `stg`: a estratégia que a IA do lado escolheu em cada rota (`fr`: `ri`, `k`, `nm`, `g` atk ou def, nota `v` e `why`) e a geral (`eco`), ou `null` quando a IA não está com o ataque nem a defesa. As escolhas também aparecem no diário (tipo `stg`).
- Economia e sapadores (v2): `claim_deposit` (uma mina sobre a jazida, pelo `i` de `ask_view` economy.dep, e a guarda dela), `get_lots` (os lotes da cidade-sede), `lay_minefield` (campo anticarro ou antipessoal), `clear_mines` (uma esquadra com sapadores varre o lugar), `sabotage` (incursão com sapadores e cargas de demolição), `get_mines` (as minas do lado, as inimigas conhecidas e os campos suspeitos) e `arm_militia`.
- Manobra (v2.1, M7, **não testado**, veja `docs/nao-testado/cf-m7-jogador-mcp.md`): `get_tactical_map` (uma camada do mapa tático do seu lado em células de 1 km: `v` vigilância inimiga, `t` tráfego inimigo, `k` gargalos, `f`, `o`, `p`, `l`), `plan_approaches` (as 3 abordagens do seu lado até o objetivo mais perto de x,z, com ângulo do eixo, km, minutos a pé, % à vista, % na mata, posição de assalto e reunião), `order_maneuver` (`fixflank`: fixar pelo eixo e flanquear pela abordagem `approach`; `envelop`: duas manobras, `approach` e `approach2`; `turn`: desbordamento até o entroncamento ou ponte atrás do inimigo; `penet`: penetração num trecho estreito da frente), `plan_ambush` (a emboscada planejada do M4 na estrada mais perto de x,z ou na aresta `edge`, com janela) e `guard_route` (a guarda de rua alternativa do M4, e minas se pedir). Por `send_command`: `man` com `k` `fixflank`, `envelop`, `turn`, `penet` (e `ambush` com `e`, `guard` com `f: "mine"`) e as chaves novas `ap`, `ap2`, `f`, `e`; o relay as aceita quando o `welcome` traz `man2: 1` (servidor antigo responde `shape`).
- Missões e cartão da unidade (v2): `get_missions` (a missão de cada esquadra, veículo e aeronave do lado) e `get_unit` (o cartão de uma esquadra: o que ela vê e o que ela decide, em dados e em frases, o mesmo que o jogador vê ao selecionar uma esquadra).
- Cadeira: `seat` (`claim` toma a cadeira e a economia; `release` devolve tudo à IA, que reassume na hora).

## O que não pode

- Não vê o inimigo além do que o seu lado enxerga (névoa); não vê nem controla os outros lados.
- Não pilota nem atira em primeira pessoa; não comanda unidades individuais, só esquadras por id e operações.
- Não cria nem encerra partidas, não troca de sala ou de época, não escolhe o anfitrião.
- Por padrão a IA segue decidindo defesa e apoio; o modelo só toma `def`/`sup` se pedir (`seat` com `domains`, ou `ctl`).
- Ordens têm intervalo: uma ordem a cada ~0,3 s e uma pergunta por segundo (o servidor descarta o que vier mais rápido; a ponte já espaça).

## Limites honestos (o que apareceu nos testes)

- O jogo é em tempo real: enquanto o modelo pensa, a partida corre. Respostas de 10 a 30 s custam esse tempo de jogo. Por isso `wait` existe, mas ele não pausa nada.
- O mapa (pontos, posições de esquadra, avistamentos) vem de uma pergunta ao anfitrião, no máximo uma por segundo, e só é atualizado quando o modelo pede (`refresh_map: true`) ou durante um `wait` (a cada 8 s). Sem isso o `get_state` mostra o último que a ponte tem, com a idade.
- No começo há poucas esquadras livres (1 ou 2 por volta de 50 s); o resto está em postos da IA. `atk` aceita ids de esquadras já em posto e as puxa para o assalto.
- Um assalto só é aceito em ponto ligado a um ponto seu (recusa `link`) e há no máximo um assalto por frente: 3 frentes ao mesmo tempo na doutrina cautelosa, 4 na equilibrada e 5 na agressiva (recusa `max`).
- Eventos de "ponto trocou de dono", "instalação perdida" e "assalto terminou" do `wait` estão implementados mas não os vi disparar nas rodadas de teste de 2 minutos; os de operação iniciada, reforço e instalação pronta, sim.
- O `get_state` completo tem de 5 a 8 KB; peça `log_lines: 0` para economizar.
- As ordens vão pelo rádio, como as de um general jogador: `send_command` volta aceito na hora, mas a esquadra só recebe a ordem de 2 a 5 s depois dentro da rede de comando, de 20 a 60 s fora dela e nunca enquanto um bloqueador a corta (perdida em 90 s). No mapa do `get_state`, cada esquadra traz `radio` (`in net`, `out of net`, `cut`) e `orderArrivesInS` quando há ordem a caminho (-1: esperando a ligação voltar), e `commandNet` diz o estado do QG (`up`, `down`, `alt`), o ritmo do plano, os nós da rede (`k` 4: antena de rádio) e as brechas (`gaps`: centro, raio, esquadras sem ligação e o reforço a caminho: `relay`, `vehicle`, `operator`). `build_defence` com `kind: radio` ergue uma antena de rádio (até 3 por lado; recusas `rcap` e `crl`) e `request_support` com `kind: radio` manda o veículo-rádio livre ou uma esquadra com operador cobrir o lugar (recusa `nrad`). Sem o QG o comando da IA do seu lado planeja a cada 9 s.
- A chave `CEU_KEY` fica no `.mcp.json` em texto simples; use uma chave de uso local. O servidor aceita uma ponte por lado.
- Se o anfitrião sair, o servidor passa a partida ao próximo jogador (testado só sem a ponte); sem nenhum jogador na sala as ordens voltam recusadas.
- Testado só com partidas curtas (cerca de 7 minutos de jogo) e sem humano no outro lado; uma partida longa, com o modelo jogando de verdade, ainda não foi vista.
