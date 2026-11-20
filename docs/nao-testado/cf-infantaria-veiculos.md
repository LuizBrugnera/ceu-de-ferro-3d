# Infantaria embarcada: a IA leva suas esquadras de veículo (não testado)

Tarefa `cf-infantaria-veiculos`. Pedido do capitão: "as infantarias devem pegar veiculos para locomoção tambem", e depois, dos Insurgentes: "tem muitos veiculos legais de infantaria capturados e tal, e não vejo eles usarem". Tudo numa seção nova do HTML, `/* ---------- infantry rides (EMB, cf-infantaria-veiculos ...)`, logo depois do fim de `CEREBRO: defesa`. O código antigo só é tocado por ganchos. A seção não tem o prefixo `CEREBRO:` porque é decisão do comandante (logística), não do cérebro do soldado: ela lê `S.units` do próprio lado para achar veículos, o que o `tests/brain-honesty.js` proíbe dentro de uma seção `CEREBRO`.

## Por que a infantaria quase não embarcava (lido no código, não medido)

A regra do capitão mandou parar as medições. A medição pedida ficou escrita em `tests/embarque.js`, nunca rodada. Lendo o código:

1. **A carona das manobras (`MAN.ride`, `manRides`) só olha esquadras de manobra ou de ordem abstrata** (`op.man`, `op.ride`) que andam por um caminho próprio (`O.wp`) correndo. As esquadras de um assalto comum (`atkOpen`: "segure no ponto de reunião", sem caminho próprio), o reforço de um ponto, a troca de um posto e as ordens do planejador nunca pedem carona.
2. **A carona do planejador (`trnPlan`, `fetch`)** é uma por lado de cada vez (duas com pontos, `CMD.rq.ride`), uma a cada `RUNS.again` (30 s), só pelo eixo da própria esquadra e só para 750 m ou mais nesse eixo.
3. **Os veículos que uma carona aceita (`rideFind`)** são caminhão e blindado leve no eixo. Nunca carro (as técnicas dos Insurgentes), nunca veículo largado ou capturado (`u.left`: parado fora do trilho, `u.rail` falso). Os capturados ficavam parados até o `trnSlow` sumir com eles.
4. **Nada armado ficava com a esquadra**: o veículo sempre voltava para casa.

## O que mudou

- **Carona para qualquer deslocamento longo da IA** (`embRides`, chamado depois de `manRides` em cada plano do lado). Pega uma esquadra de um lado da IA (só no anfitrião ou solo, mapa v4+) que:
  - tem `EMB.far` (1500 m) ou mais de caminho até o lugar da ordem;
  - não tem inimigo a menos de `FIELD.dbl` (800 m): em contato a pé ela não embarca;
  - não está com o líder em lances (`q.tec === 'lances'`, P3);
  - não tem ordem de quem anda a pé por natureza (`EMB.foot`: emboscada, observação, patrulha, escolta, suprimento, recuo, morteiro, flanco; `EMB.footOp`: infiltração, emboscada, `emb`, `itd`);
  - não acabou de sair de uma carona.
  No máximo `EMB.per` (2) caronas novas por lado a cada plano.
- **O veículo** (`rideFind`, e `embFind` como reserva): caminhão, blindado leve ou carro com lugar para a esquadra inteira. Pode estar ocioso no eixo, ser do pool estacionado, ser largado ou capturado, ou ser de requisição parado. Fica a até `EMB.near` (6 km). Vem pela viagem segura do lado (`tripOf` com o custo do lado). O `rideFind` embrulhado vale também para as caronas das manobras, que agora podem usar técnicas, largados e capturados.
- **Onde encontra**: na viagem própria da esquadra (`q.tp`), à frente dela, como a carona de manobra. Se ela anda pelo eixo, encontra onde ela está: a esquadra para ali e espera até `EMB.wait` (240 s).
- **Embarque**: a esquadra inteira, todos a menos de 40 m (`MAN.ride.board`), para manter a coesão. Se o inimigo chegar enquanto ela espera, ou a ordem mudar, a carona acaba e ela segue a pé.
- **Onde desembarca** (`embDrop`): no caminho, `keep` m antes do lugar da ordem. O `keep` vem da técnica do líder: `vig` 1300 m, `desloc` 900 m, Insurgentes 600 m ("chegam rápido, desembarcam e somem"). Nunca a menos de `MAN.ride.safe` (450 m) de inimigo conhecido, nem com influência inimiga alta, nem em terreno fechado (mata, vegetação densa, entre 3 ou mais casas de pé): a esquadra desce antes. Contato no caminho faz o veículo parar e soltar a esquadra onde está (como já era).
- **Depois**: o veículo volta para onde estava. Um largado ou capturado fica parado no ponto de desembarque, largado de novo, para quem vier.
- **Apoio de fogo**: um carro armado ou blindado leve que levou a esquadra fica no ponto de desembarque atirando no que vê. Fica `EMB.sup.T` (150 s), ou `EMB.sup.ins` (60 s) para os Insurgentes, no estilo bate e foge. Vai embora quando o tempo acaba, quando a esquadra some ou se afasta mais de 900 m, com vida abaixo de 50%, ou 2,5 s depois de ser atingido. Um lado Insurgente que manda um caminhão desarmado (ZIL-131) também manda junto uma técnica armada livre (DShK, SPG-9, ZU-23, S-5/S-8; `embEsc`) para o mesmo ponto. Ela espera a esquadra descer, cobre e vai embora.
- **Sem veículo para uma caminhada muito longa** (`EMB.rq.far`, 2,5 km): o lado da IA com pontos pede um caminhão pela própria ordem de requisição (`genCmd req`, o mesmo funil do `cmdReq`). Faz isso no máximo a cada 90 s e só com menos de 2 transportes requisitados vivos.
- **Medição** (`S.emb`, `embView`, pergunta `emb` no `genQuery`, no `server.js` (`GASK`) e no MCP (`ASKS`)). Por lado:
  - deslocamentos longos começados (ordem a `EMB.far` m ou mais do líder, contada uma vez por ordem);
  - quantos foram feitos embarcados (qualquer carona, as das manobras também);
  - esquadra-segundos parados esperando carona;
  - caronas desistidas e caronas dadas, escoltas, caminhões pedidos;
  - por modelo de veículo: segundos vivo e em uso (viagem, missão, carga, escolta, jogador), caronas e homens levados.
  Com isso se mede "quanto cada veículo insurgente é usado hoje e depois".
- **Liga/desliga**: `EMB.on = 0` volta tudo ao que era, a medição também. `EMB.ride = 0` mantém a medição e desliga só as caronas novas. É o "antes" para comparar.

## Ganchos usados

`rideFind`, `rideBoard`, `rideCheck`, `rideEv` (evento novo `sup` nas viagens), `tripAI`, `setOrd` (conta os deslocamentos longos), `manRides` e `genQuery`. Arquivos fora do HTML: `server.js` (`GASK` + `emb`), `mcp-general.js` (`ASKS` + `emb`), `tests/embarque.js` (novo, nunca rodado) e uma linha no `tests/README.md`.

## O que NÃO foi testado

Nada foi testado além de:

- `node --check` no script da página, no `server.js`, no `mcp-general.js` e no `tests/embarque.js`;
- o smoke de ~1 min: o servidor sobe em 127.0.0.1 e a página carrega no Chrome sem erro lançado (só o 404 de sempre), com `EMB` e `embRides` definidos.

Não houve nenhuma partida, nenhum torneio, nenhuma suíte e nenhuma medição A/B. A medição pedida (% dos deslocamentos > N m feitos embarcados, de A para B) **não tem números**: o script que a faz está escrito e nunca rodou, pode ter erro no próprio teste.

## Riscos que vejo

- **Muda toda partida da IA no mapa v4+**: mais caminhões e blindados leves rodando, mais esquadras paradas esperando carona (até 240 s). Se o veículo não chega, a esquadra perde até 4 min parada. É o maior risco, e o `tests/embarque.js` confere isso (`waitMax`).
- **Ponto de encontro "onde ela está"** (esquadra andando pelo eixo, sem viagem própria): a parada usa a regra antiga `q.ts >= q.rd.sP - 3` com `sP = 0`. Nunca foi visto acontecer.
- **Pós-desembarque**: o `manLand` refaz a ordem (`setOrd`). Para uma esquadra que andava por uma viagem a pé até outro eixo (`O.trp`), a viagem é refeita a partir de onde ela desceu. Pode escolher outro caminho, ou andar pelo eixo se cair no mesmo eixo da ordem.
- **Veículo largado/capturado**: é "acordado" (`embWake`: volta ao trilho, `left` 0) para dirigir e é largado de novo no ponto de desembarque (`embPark`). Se a carona acaba antes, ele volta para onde estava e fica no eixo como estacionado sem `left` (o `trnSlow` não limpa).
- **Apoio de fogo**: enquanto apoia, o veículo está "numa viagem" parada num evento. O `tripAI` normal (que larga a viagem em contato) é pulado e o `gunner` atira. Ao sair depois de atingido, o `tripAI` normal pode largar a viagem (`tripStop`). Um carro largado assim é posto no eixo mais perto: é o salto antigo do `tripOff`, possível até `MAN.ride.stub` (800 m).
- **Escolta insurgente**: tira uma técnica armada do lugar dela (pool, defesa). Pode deixar uma base sem a técnica por alguns minutos.
- **Requisição**: gasta tíquetes ou reserva da economia (`RQ.cost.truck` 1), no máximo um a cada 90 s por lado.
- **Medição de "em uso"**: um carro do pool estacionado conta como parado; um carro com jogador conta como em uso.
- **Conflitos em paralelo**: `cf-vbied` (o carro-bomba é `kind car`: `embFind` e `embEsc` excluem `def.bomb` e `u.svb`), `cf-manobra-reuniao` (manobras: as caronas delas continuam no `manRides`, só o `rideFind` ganhou a reserva) e `cf-sede-ataque-defesa`.

## Como testar depois

1. `node tests/embarque.js` (moderno, 3 lados, 8 min, semente 7, mapa 9). Variações: `N=2`, `ERA=ww2`, `MIN=15`, `SEED=3`, `MAPV=6`. Conserte o script se a montagem falhar. Depois confira:
   - % embarcado sobe de A (`EMB.ride 0`) para B (`EMB.ride 1`);
   - `waitMax` ≤ `EMB.wait` + 120 s;
   - os Insurgentes (lado 2) com caronas no ZIL-131, no BTR-70 ou nas técnicas, e escoltas > 0;
   - "why no ride": quais motivos dominam (`vehicle`, `wait`, `drop`, `closed`, `gain`...). Ajuste `EMB.far`, `EMB.wait` e `EMB.keep` por aí.
2. Suítes que esses ganchos afetam, comparando com o main anterior (`PAGE=<página antiga>`): `node tests/trucks-base.js`, `squads.js`, `field.js`, `campaign.js`, `approaches.js`, `bridges-build.js`, `radio-general.js`, `sides3-start.js`, `brain-honesty.js`, `sim-split.js`, `frame-budget.js`, e `sh tests/all.sh`.
3. Torneio A×B com `EMB.ride` 1 × 0 nas mesmas sementes (fora do elrei, com `nice`): vitória, tíquetes, tempo até o primeiro assalto, perdas de caminhão.
4. No navegador, partida IA × IA moderna com 3 lados: no diário do general, procure "Transporte: ... vai buscar esquadra", "esquadra embarca em ...", "esquadra desembarca ...", "... acompanha a esquadra como apoio de fogo". Siga um caminhão: ele busca a esquadra, desce antes da mata ou da vila, e a técnica fica atirando e depois some.
5. Pergunta `emb` pelo MCP (`send_command {question: {q: "emb"}}`) ou pelo console (`embView(2)`): o uso de cada veículo insurgente.
6. Online: só o anfitrião decide. O convidado vê os veículos e as esquadras como sempre (nada novo vai pela rede além da resposta `emb`).
