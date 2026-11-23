# cf-vbied: carro-bomba, caminhão-bomba e homem-bomba disfarçado dos Insurgentes

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, o jogador no Carro-bomba (VBIED): ao entrar, a faixa "5 detona (raio de 70 m) · explode sozinho com inimigo a 12 m ou numa batida forte". Apertar 5 antes de armar dá "Carga armando: 2 s"; depois de 3 s, 5 detona: veículo destruído, nuvem de poeira, uma cratera, e o fogo amigo avisado ("Carro-bomba (VBIED) abateu um aliado"). Sem erro no console.
- Observação para o capitão (não é defeito do código): depois de detonar, o motorista sai a pé, vivo ("Veículo destruído · Você saiu a pé").
- **Continua sem teste:** a batida forte detonando, os modelos (picape com tambores, caminhão), o civil disfarçado, a IA mandando o carro-bomba pelo caminho menos vigiado, a reação dos regulares a um suspeito, o online e o MCP.

## Caminhão-bomba mais forte, a cluster e a dica no topo (cf-svbied-buff, 2026-11-21)
Pedidos do capitão: "pode bufar mais um pouco a explosão do caminhão bomba, colocar uma cluster tambem" e "explicar ali no topo como usa ele, enquanto esta dentro dele".
- **Números**: `STK.K.svbied` (e `BOMB.truck`, que copia dele) de **1800 em 120 m** para **2350 em 155 m** (+30% de dano, +29% de raio). Vale para o caminhão do jogador e o estratégico do quartel-general. Carro-bomba e picape-bomba (`BOMB.car`, 1400 em 70 m) não mudaram. `trig`, `kill`, custo e limites iguais.
- **Efeito** (`svbFx`, sobre o `stkFx` de antes): clarão maior, mais fogo jogado mais alto, coluna de fumaça, anel de poeira correndo pelo chão, tremor de câmera maior e um estrondo mais perto.
- **Cluster** (`SVB.c`, `svbCluster`, `svbStep` no `step`): 12 submunições incendiárias saem em arco (`S.svbC`, no máximo uma dúzia por caminhão) para um anel de 0,55 a 1,7 vez o raio (85–264 m), deixando um rastro de fogo, e cada uma explode onde cai entre ~0,5 e 2,2 s depois (as mais longe, mais tarde): `explode` com 260 de dano em 18 m, pelo caminhão e o lado dele (placar, fogo amigo e diário são do caminhão). Os dois caminhos chamam `svbBurst`: `stkSvbGo` (estratégico) e um gancho no `bombGo` (só quando a carga é `BOMB.truck`).
- **Online**: só onde a batalha é simulada (solo e anfitrião, `bombSim`), como a explosão principal. O convidado vê o fim do caminhão como o de qualquer veículo; nem o `stkFx` nem a cluster vão pela rede (não há mensagem de efeito de explosão no servidor).
- **Dica no topo** (`vbHint`, embrulho do `hudWarn`): dentro de qualquer veículo-bomba (carro, picape, caminhão), na coluna de avisos sob o placar: "CAMINHÃO-BOMBA: ARMANDO… (3 S)" + "Depois: 5 detona (raio de 155 m)", e depois "CAMINHÃO-BOMBA ARMADO — 5 DETONA" + "Batida forte ou inimigo a 22 m também detonam · raio de 155 m". Some quando ele sai a pé ou o veículo acaba.
- **Testado**: `tests/svbied-cluster.js` (novo, passa), `tests/bomba-ia.js` e `tests/bomber-run.js` passam; `tests/sim-split.js` tem uma falha que já existia no main (`rtsS`/`rtsBrain`, não tocados aqui). Navegador (Chrome headless com GPU, 1280×720 e 1920×1080): a dica armando e armada sob o placar, sem cobrir a mira nem o aviso "Protegido por"; um caminhão-bomba detonado a 450 m: bola de fogo, coluna e as explosões secundárias em volta; sem erro no console.
- **Não testado**: o equilíbrio em partida (a cluster pode matar a própria tropa perto, com fogo amigo ligado: a IA só olha o raio principal antes de detonar), a dica no carro e na picape, convidado online, desempenho com várias cluster seguidas.

Pedidos do capitão (cf-vbied): "faltou o carro bomba e caminhão bomba para os insurgentes" e "deve ter uma classe de homem bomba insurgente que se disfarça de civil".

## O que já existia (e o que faltava)

- **Carro-bomba** (`TRNS.vbied`, `BOMB.car`, #67/#80): só da IA. O general (`insBomb`) o mandava por `dispatch` direto ao alvo, fora do `genCmd`. O jogador não podia escolher (não era enumerável), não havia tecla para detonar nem detonação por batida, e o MCP e a visão de general não tinham ordem para ele.
- **Caminhão-bomba** (`STK.K.svbied`, #93): só pelo ataque estratégico (`bomb`, `svbied`). Era um caminhão genérico (o ZIL) sem modelo próprio, ia pelo caminho mais rápido e a explosão não derrubava prédios (`explode` sem `kg`). O jogador não podia dirigir um.
- **Homem-bomba** (`insBomber`): de uniforme, reconhecido como soldado (só o disfarce de vila do #80 o escondia). Não havia kit de roupa civil.
- **Reação dos regulares**: nenhuma específica. Um sedã não é "alvo leve" para a infantaria (`manThink` só atira em caminhão, antiaérea ou veículo aberto), então o soldado regular não atirava no carro-bomba.

## O que mudou (`Céu de Ferro 3D.html`, `server.js`, `mcp-general.js`, README, MCP.md)

Seção própria logo depois do ataque estratégico (`/* ---------- the car bomb, the truck bomb and the disguised bomber (cf-vbied ...`), mais uma seção de tela no fim do script (`cf-vbied on the screen`). Ganchos no código antigo, um por linha:
- `TRNS`: dois modelos novos ao lado do `vbied`: `vbiedPk` (picape-bomba) e `svbied` (caminhão-bomba, `bomb: 'truck'`).
- `bombOf`: ignora o caminhão estratégico (`u.svb`), que tem o código próprio do STK.
- `rqKind`: veículo-bomba custa pelo tipo `vbied`/`svbied` na requisição.
- `stkSvbGo`: a explosão do caminhão agora derruba prédios (`kg`).
- `packMan`: cor de civil para o kit disfarçado.
- O laço que embrulha `GRLDO.sab` e `GRLDO.cmd` fica logo depois do `GRLDO` (precisa dele definido).

Na seção nova (`VBM`):
- **Jogador**: `vbied`, `vbiedPk` e `svbied` aparecem na classe Transporte dos Insurgentes (hangar, quadro H, requisição U). Requisição: 3 tíquetes (carro) e 6 (caminhão), recusa `vbcap` com 6 carros ou 4 caminhões do lado vivos (`VBM.cap`; eram 2 e 1, cf-bomba-limite) (os da IA e o estratégico contam). Tecla **5** dentro do veículo detona (depois de `BOMB.arm` s); convidado online manda `mreq k 9` e o anfitrião detona (`server.js` repassa). Ao entrar, um aviso diz o que o 5 faz.
- **Detonação**: batida a 8 m/s ou mais (`ramHit` em muro/casa/HESCO, `vcolHit` em outro veículo) com a carga armada; inimigo a `trig` m (como antes). `BOMB.truck` = dano e raio do caminhão estratégico (1800 em 120 m; 2350 em 155 m desde cf-svbied-buff). Toda explosão de veículo-bomba ganha a cratera, bola de fogo e nuvem do `stkFx`, e uma linha no diário.
- **Ordem `vbied`** no `genCmd` (domínio `atk`): `{ k: car|truck, m: sedan|pk, x z | id | pi, why }`. Carro: da economia como `car`, teto de 2, população, ROE para a IA; vai pelo **caminho menos vigiado** (`vbTrip`/`vbCost`: cada trecho de estrada custa mais perto de inimigos conhecidos, pontos e bases do inimigo) e depois reto ao alvo, sem parar para lutar. Caminhão: repassa ao `GC.bomb` `svbied`, que agora também usa o caminho menos vigiado e o modelo `svbied`.
- **IA**: `insBomb` manda o carro (ou o caminhão quando a reserva tem um e o alvo vale ≥ 4,5) pelo `genCmd`; alvos novos: base principal, sede (HQ) e postos inimigos. Sabotagem (`sab`) e cortar o comando (`cmd`) da guerrilha tentam um veículo-bomba metade das vezes. O homem-bomba mandado é o disfarçado 60% das vezes.
- **Homem-bomba disfarçado** (`KITS.insCivBomber`, no fim de `INF.modern[2]` e da lista do servidor): cópia do `insBomber` com `civ: 1`. Para o inimigo, no máximo "homem visto" (`grade` 1: não atira) até chegar a 25 m, atirar ou ficar suspeito. Modelo civil do pack (`packManModel`).
- **Suspeita e reação** (`vbSusStep`, a cada 0,5 s no anfitrião): veículo-bomba a 7 m/s ou mais indo para um regular a até 350 m, ou homem-bomba correndo (3,2 m/s) para um regular a até 80 m, fica suspeito por 8 s. Os regulares atiram nele primeiro (`manThink`: infantaria, RPG se tiver; `pickGround`: veículos) e o diário avisa. Muros/HESCO já param o veículo (`bump`); batendo rápido, ele explode no muro.
- **Visão de general / RTS**: Campanha ganha o botão **Carro-bomba (n/2)** (modo `vbied`, clique no alvo; Shift mantém). O caminhão segue no botão Bombardeio. `genState.vb` e a pergunta `vb`.
- **MCP** (v2.5): `car_bomb` e `get_car_bombs`.
- **Servidor**: `vbiedPk`, `svbied` e `insCivBomber` no fim das listas (lado 2) e o repasse de `mreq k 9`.

## O que foi testado

Só fumaça (~1 min): `node --check` da página, do servidor e do MCP; o servidor sobe e entrega a página (200); a simulação carrega no `tests/harness.js`; numa partida de 3 lados (mapa 9, sem economia) de 4 s, os três veículos ficam enumeráveis, o kit entra no fim da lista dos Insurgentes, `genCmd(t, { c: 'vbied', k: 'car', x, z }, 'ai')` devolve `ok` e o carro sai com `u.trip.why === 'vb'` (caminho menos vigiado). Com economia, aos 4 s a mesma ordem é recusada com `res` (sem carro na reserva), como esperado. Nada mais: nenhuma explosão, nenhuma suíte, nada no navegador.

## O que NÃO foi testado

- Nada no navegador: modelos (picape com tambores, caminhão com placa no para-brisa), o civil do pack com a pistola na mão, o botão da visão de general, o aviso de entrada, a tecla 5.
- Jogador dirigindo e detonando (5, batida, inimigo perto); a requisição com o teto; online (convidado detonando por `mreq k 9`, o anfitrião achando o fantasma do veículo).
- A IA: o caminho menos vigiado (custo, tempo de busca, se chega), o carro-bomba indo pelo `genCmd`, a escolha do caminhão, os alvos novos (base, sede, postos), a guerrilha.
- O disfarce: se o `grade` 1 segura mesmo a IA regular (tanques e outros caminhos de mira podem não passar por `grade`), se o civil disfarçado é reconhecido a 25 m.
- A reação: se a infantaria atira de fato no carro (o `sight`/`aimErr` com veículo como alvo de fuzil), se o tanque troca de alvo, quantos falsos alarmes (um carro comum dos regulares nunca é suspeito: só veículos-bomba).
- MCP `car_bomb`/`get_car_bombs` contra uma sala de verdade.

## Riscos

- `manThink` e `pickGround` ganharam um embrulho em todo pensamento de soldado/veículo; custa uma volta pela lista curta `S.vbSus`.
- `vbSusStep` percorre todos os homens e veículos para cada veículo-bomba em movimento a cada 0,5 s (poucos veículos-bomba: deve ser barato).
- O homem-bomba disfarçado entra no fim de `INF.modern[2]` **antes** do `insMedic` na página, mas **depois** dele no servidor: se algum código usa o índice do kit entre página e servidor de forma diferente do tamanho, pode trocar kits online.
- `bombOf` agora ignora `u.svb`: o caminhão estratégico não explode pelo `bombStep` (usa só o `stkSvb`, como antes).
- Na requisição, o custo vem de `RQ.cost.vbied/svbied`; nas logísticas (`lgCostP`) o caminhão-bomba custa caixas como um caminhão.
- O quadro de troca H e a escolha no hangar não têm teto (só a requisição U tem).
- Balanço: carro 1400 em 70 m, caminhão 2350 em 155 m mais a cluster (cf-svbied-buff): o jogador pode limpar um ponto inteiro com um caminhão de 6 tíquetes.

## Como testar depois

1. Fumaça: `node --check` da página extraída; `SECS=20 node tests/sides3-start.js`.
2. Harness, partida de 3 lados (`H.load({ seed: 7, mapv: 9, eco: true })`, `C.watch('modern', { n: 3 })`), 10 min de IA × IA: contar linhas de diário "Carro-bomba enviado", "detonado", "Veículo suspeito"; conferir que `genCmd(t, { c: 'vbied', k: 'car', x, z }, 'me')` devolve `ok` e que o carro tem `u.trip` com `why: 'vb'`; comparar o caminho (`u.trip.p`) com o `tripOf` sem custo perto de pontos inimigos.
3. Harness, sandbox: um `vbied` a 10 m/s contra um muro HESCO (`fort hesco`) → explode no muro; um `vbied` armado com `vcolHit` a 9 m/s → explode; um disfarçado a 100 m de um fuzileiro regular → `grade` 1, a 20 m → ≥ 2.
4. Navegador (Insurgentes, partida de 3 lados): hangar → Transporte → Picape-bomba / Caminhão-bomba; dirigir até uma base inimiga e apertar 5; bater num muro; requisição U num depósito com 6 carros-bomba (ou 4 caminhões) vivos → recusa. Visão de general → Campanha → Carro-bomba → clicar no alvo; a câmera de comandante (RTS) mostra o carro. Kit "Homem-bomba disfarçado": aparência civil, colete no 5.
5. Online: convidado no carro-bomba aperta 5 → o anfitrião explode o veículo; servidor reiniciado com os modelos novos.
6. MCP: `car_bomb` com `point`, depois `get_car_bombs`.
