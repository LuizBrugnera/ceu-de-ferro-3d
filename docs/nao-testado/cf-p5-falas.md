# Cérebro P5: falas e balões (não testado)

Tarefa `cf-p5-falas`, pacote P5 da pesquisa `cf-cerebro-pesquisa` (arquitetura do "cérebro" dos soldados). Pedido do capitão: soldados que dão a sensação de pensar, com líderes que comandam. Este pacote é a voz: o que cada soldado fala sai da mesma decisão que ele tomou, e a fala é também um canal de informação para quem a ouve.

## O que mudou (tudo em `Céu de Ferro 3D.html`, no fim da parte de simulação, antes de `3D scene`)

- **`CEREBRO: contrato (P0)`**: cópia da seção 2.5 da pesquisa (`BRAIN`, `ord`, `rel`, `fala`), porque o PR do P0 (`cf-lideres`) ainda não está no main. Os formatos de `q.bb`, `q.lid`, `q.eq`, `m.rf`, `m.mo` e `m.tar` ficaram como comentário. Mudanças mínimas para virar JS válido: tirei o `...` do `BRAIN` e o `++S.ordN` virou `S.ordN = (S.ordN || 0) + 1`.
- **`CEREBRO: falas (P5)`**:
  - `brainSay(m, k, d)` com a tabela `FALAS`: frases em pt-BR por tipo, cada uma com 2 ou 3 variações. Os tipos cobrem ordens (as `k` de `ord`), relatos (as `k` de `rel`), reflexos (granada, ao chão, médico, drone, rendição) e conversa.
  - **Origem obrigatória**: toda decisão que fala registra antes um evento `cb` (`flCb`: soldado, tipo, segundo). O `brainSay` recusa a fala se o soldado não tiver uma decisão sua de até 1 s antes (`FALA.orig`) e conta a recusa em `FALA.st.semOrigem`. A própria fala também vira um evento `cb` (`st: 'fala'`). Os eventos vão para o `ANA` só até 60% do `ANA.max`, e sempre para o anel `FALA.log`.
  - **Comando de tiro no formato do manual** (`flCont`, `flWhat`, `flWhere`, `flNum`): "Contato! Doze horas, duzentos, metralhadora na janela! Fogo!". A direção é a hora do relógio a partir de onde o soldado olha. A distância vai por extenso. A descrição usa o degrau de percepção que *ele* alcançou: só "movimento" no degrau 1; a classe, quantos soldados ele conhece ali e onde estão (janela, trincheira, mata, atrás da casa, atrás do muro) do degrau 2 em diante. O comando ("Fogo!") só sai do líder.
  - **Fala da esquadra** (`flSq`, por gancho no `squadThink`, 1 vez por segundo):
    - o colega mais perto que viu um homem cair avisa "Homem abatido!", e o lugar fica guardado;
    - o primeiro homem que percebe um contato ainda não anunciado pela esquadra o anuncia; o contato pode ser anunciado de novo se andar 40 m ou depois de 15 s. O líder dá comando de tiro; os outros, relato;
    - numa esquadra em contato que ficou quieta por 22 s, o líder pergunta "Estado?" ou "Alguém vê ele?".
  - **Diálogos de 2 falas** (`flResp`): o colega que ouviu a pergunta e tem algo a dizer responde depois de 0,7 a 1,6 s ("Tô ferido!", "Tô sem munição!", "Tudo certo!"; "Atrás da casa, às duas horas!", "Sumiu!"). Uma ordem de avançar, de lance, de assalto ou de limpar dada para onde morreram colegas (até 30 m, nos últimos 120 s) recebe "Nem pensar!".
  - **Prioridade e limite por esquadra**:
    - no máximo 1 fala a cada 1,5 s;
    - um balde de 5 falas por minuto, com no máximo 2 guardadas;
    - nenhuma frase repetida em 10 s;
    - 2,5 s entre duas falas do mesmo homem.
    - O reflexo (p 3) fura a fila e também gasta do balde. A resposta de um diálogo fura só o intervalo de 1,5 s.
  - **Canal de informação** (`flOuvir`, `flOuve`, com `HEAR.voz`):
    - o grito chega a 45 m (`BRAIN.voz`) no silêncio e a menos sob tiroteio: cada homem que atirou nos últimos 1,5 s a até 60 m divide o alcance, cada veículo pesa 3 vezes, e o alcance nunca fica abaixo de 15 m; uma parede corta para 60% (`HEAR.wall`);
    - o colega que ouve recebe o conteúdo: "Granada!" → se está a até 12 m da granada, foge dela depois do tempo de reação (0,2–0,6 s), pelo `m.rf` do contrato; contato anunciado → passa a conhecer o alvo como "contado" (`told`) e olha para lá; o líder anota o relato no quadro-negro (`q.bb.cont`, `q.bb.est`);
    - o inimigo que ouve vira para a voz (`ln`).
  - **Granada percebida** (`flNade`, por gancho no `nadeStep`): quando a granada toca o chão, quem a tem a até 3 m ou a vê na frente (a até 15 m, com visada) ganha o reflexo. O mais perto de cada esquadra grita "Granada!", e o grito leva o aviso a quem não viu.
  - **Balões**: o balão do `SAY` (#127) mostra a frase inteira, por um tempo proporcional ao tamanho dela (até 6 s), e agora aparece a até 300 m (`SAY.r`). Online, o soldado do anfitrião leva o código antigo mais o espaço da frase (`código + 32 × (hora + 13 × espaço)`): o anfitrião vê a frase inteira, o convidado vê a chamada antiga ("Contato às 2 horas!") ou nada, nas falas novas sem chamada antiga.
  - **Som opcional**: `FALA.som = 1` fala a frase com a voz do navegador (pt-BR) a até 60 m do jogador. Vem desligado.
  - **Unificação**: os balões do #127 (`say()`, chamado nos exercícios `drRun`, em `manDown`, em `sqRescue` e quando alguém joga granada ou fumaça) passam pelo `brainSay` quando `BRAIN.on`. O ponto onde o código antigo chamava `say` conta como a decisão. Os balões locais do `cf-lideres` não estão no main; quando entrarem, devem chamar `fala()`.
- **`tests/brain-falas.js`** (novo, no `tests/all.sh` depois de `drills`): os exercícios do "Pronto quando".

### Ganchos no código antigo (todos por embrulho, na seção `CEREBRO: falas`)

`say` (redireciona as chamadas da IA), `squadThink` (`flSq`), `nadeStep` (granada percebida), `sqMan` (fuga pelo reflexo ouvido), `aiMan` (a resposta devida, `m.flD`). Dados: `HEAR.voz` (novo), `SAYC.brain = 29` e `SAY.l[29]` (novos), cada `SAY.l[i]` embrulhado (frase inteira pelo espaço) e `SAY.r = 300`.

## O que foi medido (exceção da tarefa: os exercícios sem tela do "Pronto quando")

`node tests/brain-falas.js` (2 esquadras a 220 m por 120 s, nas duas épocas, e a granada; cerca de 1 min, com `nice`): tudo passou. O log está em `/home/luiz/firstmate/data/cf-p5-falas/brain-falas.log`.
- Toda fala tem um `cb` do mesmo soldado em até 1 s: 12 de 12 falas nas duas épocas, 0 sem origem.
- Falas por minuto por esquadra em contato: 3,9, 5,4, 5,3 e 4,2. Nenhuma repetida em 10 s.
- Granada caída a 2,5 m de A, que olha para ela, e a 10 m de B, de costas: A grita "Granada, abaixa!" e B foge 0,42 s depois da queda, para um ponto a 15 m dela. Sem A, B não reage.

Smoke: a página inteira passa no `node --check`, o servidor sobe e serve a página, e o navegador abre o hangar sem erro de script. Uma partida IA × IA de 25 s nas duas épocas roda sem erro, sem contato ainda.

## O que NÃO foi testado

- Nenhuma suíte existente (`drills`, `infantry`, `squads`, `inf-drills`, `help`, `ana`, `ana-man`, online, `frame-budget`), nem torneio A×B. Com `BRAIN.on = 1` a partida muda: o colega foge da granada que ouviu, o contato anunciado fica conhecido e o inimigo vira para a voz. Isso pode mudar resultados de testes antigos que contam fuga, percepção ou tiro.
- Os balões vistos no navegador numa partida real (tamanho a 300 m, quantidade numa cidade) e online (o convidado vendo a chamada antiga).
- O custo por quadro (`AIB`): `flOuvir` percorre `S.men` e `S.units` a cada fala; `flSq` percorre o `pm` de cada homem 1 vez por segundo.
- O som (`FALA.som`).
- A conta de eventos `cb` no `ANA` numa partida de 45 min (limite em 60% de `ANA.max`).

## Riscos que vejo

- **Conflito com o P0**: quando o `cf-lideres` entrar, haverá duas declarações de `BRAIN`, `ord`, `rel` e `fala`, e isso é SyntaxError: a página inteira não carrega. Quem fizer o merge deve deixar só uma seção `CEREBRO: contrato (P0)`, com `fala` chamando `brainSay`. O P0 pode trazer o próprio emissor do evento `cb`; nesse caso, o `flCb` passa a chamá-lo, mas continua marcando `m.cbT`.
- **Reflexo de granada**: o `m.rf` e a fuga em `sqMan` são uma execução mínima do reflexo. O P1 (`cf-cerebro-soldado`, parte 2) vai ter a tabela de reflexos e deve absorver isso. Quem viu a granada a até 15 m também foge por aqui (antes, só a até 7 m).
- **Honestidade (P7)**: `flOuvir` e `flNade` leem `S.men`/`S.units` como funções de percepção, como o `listen()`. O teste do P7 precisa liberá-las.
- **Inimigo que ouve a voz** (`FALA.enemy`): pode revelar a posição de esquadras em emboscada que falam. A emboscada ainda não silencia as falas.
- **Pergunta e resposta**: só respondem colegas que ouviram. Um líder sozinho não recebe resposta.
- **Balões a 300 m**: com muitas esquadras perto, pode haver muito texto na tela.

## Como testar depois

1. `nice node tests/brain-falas.js` (`SECS=60` para encurtar): os 3 critérios do P5.
2. Comparar com o main de antes (`PAGE=<página antiga>`) em `node tests/drills.js`, `tests/inf-drills.js`, `tests/infantry.js`, `tests/squads.js`, `tests/help.js`, `tests/ana.js`. Repetir com `BRAIN.on = 0` (`C.$('BRAIN').on = 0` logo depois do `load`): deve dar igual ao main antes.
3. `node tests/frame-budget.js` com e sem `BRAIN.on` para ver o custo.
4. No navegador: Assistir IA × IA, câmera a até 300 m de uma esquadra em contato. Ver os comandos de tiro com hora e distância, "Estado?" / "Na escuta!", "Granada!" e a fuga de quem estava de costas, "Homem abatido!".
5. Online: um convidado perto dos soldados do anfitrião deve ver a chamada antiga ("Contato às 12 horas!", "Médico!") e nunca o texto de outra fala.
6. Torneio A×B (`tools/balance.js`, quando o P6 entregar `--brain 0|1`) com as mesmas sementes: falas por minuto e vitória sem regressão.
