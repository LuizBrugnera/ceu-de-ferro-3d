# cf-reparo-ambulancia: caminhão de reparo e ambulância (não testado)

Pedido do capitão: "adicione caminhão de reparo e ambulância". Implementado sem testes, pela regra de entrega nova.

## O que mudou

- **Caminhão de reparo novo** (`rpr`), um por lado e época, no mesmo esquema de dados do REC (W18): Opel Blitz Werkstattwagen (`opelw`) e GMC CCKW de oficina (`gmcw`) em 1944, FMTV M1089 (`m1089`) e Ural-4320 MTO-UB (`mtoub`) hoje. Modelo three.js procedural: caixa de oficina, armários de ferramentas, faixa amarela, guindaste na traseira e giroflex.
- **Ambulância e caminhão de reparo dirigíveis**: `REC.play` deixa os dois enumeráveis em `TRNS`, então aparecem no hangar, na troca e na lista de onde entrar (classe Transporte). O veículo de recuperação continua só da IA. Custo de requisição: `amb` 1 tíquete, `rpr` 2; caixas de entrada: `amb` 5, `rpr` 8 (`rqKind` e `lgCostP` agora olham `d.svc`).
- **Trabalho parado (bloco `SV`, logo depois do REC)**: a cada 0,5 s, um caminhão de reparo parado (< 1,2 m/s) repara os veículos do seu lado a até ~22 m: 4% do casco/s até cheio, `mend` nas peças (apaga o fogo), 3% de munição/s. Com a economia, cada ponto de casco custa 0,2 de metal do lado. A ambulância parada trata soldados a até 18 m: para o sangramento, cura 6 hp/s, levanta o ferido leve, estabiliza o grave.
- **Ambulância do jogador** (sozinho/anfitrião com economia): parada 5 s ao lado de feridos, embarca até 4; parada numa base de suprimento ou a 250 m da base principal, entrega (`recHand`, volta à reserva). Avisos em texto flutuante.
- **ROE (W14)**: `pickGround`, `aiPick`, `heliPick`, `pickFire` e `manThink` não enxergam ambulâncias inimigas na escolha de alvo (filtro temporário de `S.units`).
- **IA**: o general de Apoio (`recPlan`) manda o caminhão de reparo ao maior grupo de avariados (casco < 70% ou pegando fogo, sem inimigo conhecido a 200 m), até o número do plano. Cérebro `aiRpr`: vai, para ao lado do pior, repara o que estiver a 400 m do lugar, espera 20 s e volta à reserva.
- **Plano de produção**: `GP.mix` ganhou `rpr` e `amb` (1 em cada postura); `gpHave` conta os da IA em campo. A reserva guarda 1 caminhão de reparo (`REC.keep`).
- **Ordens**: `repv {x,z}` (novo), `disp` com `k: rpr | amb` e missões novas `repair` / `medevac` (vão à área, trabalham e esperam 2 min). A pergunta `rec` traz `reserve.rpr` e `damaged`.
- **Visão de General**: a aba Produção mostra a reserva de reparo, os grupos avariados com o botão Reparar; o painel de despacho (Missões) lista caminhão de reparo e ambulância.
- **MCP**: `send_repair_truck` novo; `dispatch_units` e `set_production_plan` aceitam `rpr` e `amb`; missões `repair` e `medevac`; `get_recovery` descreve os campos novos.
- **Servidor**: os modelos novos nas listas `SVC` e as ambulâncias/caminhões de reparo nas listas `trn` (cada um na metade do seu lado).
- **Correção de índice**: `ecoI` agora põe os tipos do REC (`arv`, `amb`, `rpr`) depois das instalações, e o MCP decodifica nessa ordem. Antes, com o REC ligado, o MCP lia `arv`/`amb` como `pow`/`mine` (bug do W18).
- `tests/rec.js`: a asserção "nenhum svc é escolha do jogador" virou "o veículo de recuperação não é; ambulância e caminhão de reparo são" (não rodei).

## O que NÃO foi testado

- Nenhuma suíte rodou. Só fiz o smoke: o servidor sobe e serve a página (HTTP 200); pelo harness (com um stub de `aarShow` e `lg: 0`, porque o harness já quebra no main por `aarShow` e `m5Lg`), uma partida IA × IA de 1944 e de hoje carrega e roda alguns segundos sem erro, um caminhão de reparo parado ao lado de um tanque leva o casco de 39 a 51 em 2 s, `disp amb` responde ok e o plano lista `rpr` e `amb`.
- Navegador: o `chrome-devtools-axi` estourou o tempo ao abrir a página de 2,5 MB, então **não vi a página no navegador**: modelo 3D, cartão do hangar, painel da Visão de General, nada disso foi visto.
- Online: nada testado (convidado dirigindo ambulância ou caminhão de reparo, fantasma parado reparando o veículo do convidado, servidor aceitando os modelos novos).
- Ambulância do jogador embarcando e entregando feridos; caminhão de reparo da IA indo e voltando sozinho; `repv`, `disp rpr`; ROE.
- Logística ligada (`lg: 1`) junto com o REC; o custo em metal sem metal; a produção da IA (pode produzir 2 de cada por causa de reserva + plano).

## Riscos que vejo

- **ROE pelo filtro de `S.units`**: `manThink` faz mais que escolher alvo; durante a chamada, a ambulância inimiga some de tudo o que ela olha (ex.: desviar de veículo). Se der efeito estranho, filtrar só o laço de alvo.
- **Ambulância invisível como alvo, mas não intocável**: tiro de área, fogo amigo e explosões ainda a atingem (de propósito).
- **Caminhão de reparo "parado"**: para fantasmas (`u.net`) uso `u.v`; se o fantasma não tiver velocidade atualizada, o reparo pode acontecer andando ou nunca.
- **Hangar e lista de entrada**: agora há mais 2 veículos por lado em Transporte; o seletor e os atalhos de troca podem ficar apertados. O cartão usa `NOTE[d.svc]`.
- **Plano**: `rpr`/`amb` em campo = 1 faz a economia da IA produzir até 2 (reserva 1 + plano 1); se pesar, baixar `GP.mix`.
- **`ecoI` mudou a ordem dos índices**: backups de anfitrião de uma versão anterior com REC ligado não batem. Uma página velha com um servidor novo, ou o contrário, também não.
- O jogador com ambulância como convidado online não embarca feridos (os feridos são da IA do anfitrião); ele só cura quem está perto, no próprio cliente.

## Como testar depois

1. `npm start`, abrir `http://localhost:8080`, Hoje e 1944: em Transporte devem aparecer a ambulância e o caminhão de reparo de cada lado; conferir o modelo (cruz vermelha, oficina com guindaste) e o cartão.
2. Solo com economia: entrar de tanque, tomar dano, chamar um colega de caminhão de reparo ou trocar para o caminhão, parar ao lado: o casco sobe e aparece "Caminhão de reparo: casco N%"; o fogo apaga.
3. Solo de ambulância: parar perto de soldados feridos; esperar o texto "N feridos a bordo"; ir a uma base de suprimento ou à base principal e parar: "entregues" e o log do general "Evacuação: ...".
4. Visão de General (Tab), aba Produção: "Na reserva: ... de reparo"; com veículos avariados, o botão Reparar manda o caminhão (`repv`). Aba Missões: despachar caminhão de reparo e ambulância numa área.
5. MCP: `get_recovery` (ver `reserve.rpr` e `damaged`), `send_repair_truck {x,z}`, `dispatch_units {kind:'rpr', mission:'repair', x, z}`, `set_production_plan {kind:'amb', count:2}`; `get_state` mostra a reserva com `arv`/`amb`/`rpr` com o nome certo (antes, com o REC, saía `pow`/`mine`).
6. ROE: partida IA × IA com uma ambulância parada perto da frente; o diário e o comportamento não devem mostrar tanques ou infantaria mirando nela.
7. Online: dois navegadores, o convidado de caminhão de reparo e de ambulância; o anfitrião com um tanque avariado ao lado do caminhão do convidado parado.
8. Suítes: `node tests/rec.js`, `node tests/production.js`, `node tests/mission.js`, `node tests/rec-relay.js`, `node tests/rec-online.js`. Antes, consertar o harness no main (`aarShow` e `m5Lg` definidos depois do marcador `/* ---------- 3D scene`).
