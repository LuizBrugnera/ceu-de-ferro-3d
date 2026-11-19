# Armas combinadas: tanques e infantaria em equipe (não testado)

Tarefa `cf-armas-combinadas`. O capitão pediu: "tanques devem apoiar a infantaria e vice versa". Já existiam três peças soltas: o procedimento `com-carro` da infantaria (#36), a estratégia `arm` do general (#60), que só mexe em pesos, e os pedidos de ajuda laterais (W9). Esta tarefa juntou as três num comportamento de unidade para a IA de todos os lados e épocas.

## O que mudou

Quase tudo está num bloco novo no fim da parte de simulação de `Céu de Ferro 3D.html`, logo antes de `3D scene`. Procure `combined arms (CA`. O bloco usa só embrulhos: `step`, `AI.tank`, `AI.lav`, `squadThink`, `helpCands`, `helpUtil`, `helpPick`, `told`, mais um procedimento novo em `DRILLS`. Fora dele mudaram três trechos curtos: `com-carro`, `cidade` e um parágrafo no README.

- **Equipes (`caSide`, a cada 4 s por lado).** Cada tanque ou blindado sem equipe, da IA ou de um jogador, recebe a melhor esquadra livre a até 350 m. Com a estratégia Armas combinadas (M8 `arm`) ativa, o raio vai a 525 m. A ordem de preferência é:
  1. a esquadra que o blindado acabou de desembarcar;
  2. uma da mesma missão;
  3. uma da mesma estrada;
  4. a mais perto.

  Um tanque da IA também pode formar equipe com o jogador a pé. A equipe fica em `S.ca`, e o tanque e a esquadra apontam para o mesmo registro (`u.caT` e `q.caT`). Esquadras de morteiro, reconhecimento, escuta, sapadores, engenharia, guarnição, emboscada e mata (`CA.skip`, `CA.mis`) ficam de fora.
- **A equipe acaba (`caBreak`)** em qualquer destes casos:
  - um dos dois morre ou debanda;
  - a esquadra muda para uma tarefa excluída;
  - os dois ficam mais de 700 m longe um do outro por 30 s;
  - o tanque espera mais de 120 s pela esquadra, ou a esquadra mais de 90 s pelo tanque.

  Depois disso, nenhum dos dois forma equipe por 60 s. Uma ordem nova não desfaz a equipe.
- **Passo do mais lento.** O tanque da IA na estrada não anda se a esquadra ficou mais de 40 m para trás em campo aberto. Em terreno fechado (cidade com 3 prédios de pé a até 110 m, ou mata em volta, a 160 m à frente), ele só anda com a esquadra 30 m à frente dele, e anda a passo de homem perto desses limites. Fora da estrada e sem alvo, a âncora dele não avança. A esquadra também não passa mais de 40 m à frente do tanque (70 m em terreno fechado) enquanto ele pode segui-la: a regra não vale com o tanque no limite (`atLimit`) ou imobilizado. Se o tanque está ocupado (M5, viagem, pedido, recuo, emboscada ou outro procedimento), o passo não é aplicado.
- **A infantaria à frente na cidade.** Em terreno fechado, sem a esquadra à frente, uma esquadra livre recebe um assalto até o ponto 160 m à frente do tanque, para limpar os prédios. Livre quer dizer: fora de operação, sem atender pedido, sem carona e sem ordem de recuo, suprimento, obra ou morteiro. Esse assalto dura no máximo 120 s, e depois a esquadra volta à ordem que tinha. Volta também quando o tanque chega ao ponto ou quando o terreno deixa de ser fechado. O procedimento `cidade` do tanque passa a aceitar a esquadra da equipe, vinda de qualquer estrada.
- **`com-carro`.** O procedimento prefere o tanque da equipe, a até 120 m e a qualquer velocidade. Em terreno fechado, os homens ficam 30 m à frente do carro; no aberto, atrás ou ao lado, como antes. O espaçamento é o mesmo de antes, porque quem cuida dele é o movimento orgânico. A esquadra mandada à frente (`O.lead`) não entra nesse procedimento.
- **Tanque apoia a infantaria (`caSupport`).** Quando a esquadra está sob fogo (homem suprimido ou atingido há menos de 4 s), o tanque da IA sem alvo próprio põe a metralhadora e o HE (`A.inf`) ou o canhão (`A.tgt`) no contato mais recente da esquadra. Isso só vale para contatos que o próprio tanque conhece (`known`).
- **Infantaria apoia o tanque.**
  - Procedimento novo `escolta-ca` (urgência 1,35): um anticarro inimigo a até 250 m do tanque, visto pela esquadra ou pelo próprio tanque, faz metade dos homens sair na direção dele. A outra metade fica junto do carro, e cada homem atira no anticarro quando o conhece.
  - O blindado da IA com esquadra a bordo a desembarca 160 m antes do terreno fechado, ou ao ver um anticarro a até 350 m, e os dois formam equipe. Isso não vale para caronas de manobra (`u.mr`) nem para viagens.
- **Avistamento dentro da equipe (embrulho de `told`).** O que um vê chega ao outro em 0,7 s, contra 1,3 s ou 4 s antes.
- **Pedidos (W9).**
  - Num pedido de `fire` da esquadra, o tanque da equipe é candidato de qualquer estrada; num pedido de `clear` do tanque, a esquadra da equipe também.
  - O parceiro ganha +1 de utilidade.
  - Se o parceiro estiver atendendo o pedido de outra unidade e puder atender este, larga o outro (`helpRefuse`), e esse outro vai para outra unidade.
- **Ordem nova.** O tanque da IA que fica a mais de 300 m da sua esquadra, porque uma ordem nova a levou, vai até ela pela rede (`tripTo`, só no mapa 4 ou maior), no máximo uma vez a cada 60 s. Isso não acontece se a missão do tanque for defender, guarnecer ou reserva.
- **Jogador.**
  - O tanque do jogador (ou o de um convidado, no anfitrião) ganha uma esquadra da IA. Ela recebe a cada 10 s uma ordem de ir até ele quando passa de 120 m de distância, e o cobre pelo `com-carro`.
  - O jogador a pé ganha um tanque da IA, que espera por ele como esperaria por uma esquadra.
  - Os pedidos do jogador também vão primeiro ao parceiro.
- **Log do general**, tipo `ord`: equipe formada, separação (com o motivo), esquadra à frente, tanque indo juntar-se. Os contadores ficam em `S.caN`: `made`, `broke` por motivo, `lead`, `follow`, `prio`, `dis` e `esc`. Com `CA.on = 0`, nada disso roda.

## O que foi testado

Só o smoke, pela regra nova do capitão:
- a página inteira compila;
- uma partida IA × IA de 45 s por época (1944 e moderna), nos mapas 1 e 4, roda sem exceção e sem NaN. Nela se formaram 4 ou 5 equipes, com 2 a 4 esquadras mandadas à frente e 1 tanque que foi juntar-se à sua esquadra;
- o `server.js` sobe e serve a página.

Roteiro em `/home/luiz/secondmate/data/cf-armas-combinadas/smoke.js`, fora do repositório.

## O que NÃO foi testado

- Nenhuma suíte rodou. Isso inclui `drills.js`, `veh-drills.js`, `help.js`, `perception.js` (honestidade), `field.js`, `squads.js`, `mission.js`, `frame-budget.js`, `soak.js` e os testes online.
- Nenhuma partida longa e nenhum A/B com `CA.on` 1 e 0. Não se sabe se a IA ficou melhor ou pior, nem se os ataques ficaram mais lentos.
- O custo por quadro não foi medido.
- Nada no navegador: jogador de tanque com a esquadra atrás, jogador a pé com o tanque esperando, convidado online.
- O desembarque do blindado (`dis`), a prioridade de pedidos (`prio`) e o `escolta-ca` não apareceram nas partidas curtas do smoke: contaram 0.

## Riscos

- **Ataques mais lentos ou parados.** O tanque espera a esquadra e a esquadra espera o tanque. Uma esquadra parada num posto com o tanque querendo avançar só se separa depois de 120 s. Isso pode atrasar a hora H, as campanhas e os assaltos do M3, o que muda o placar das partidas IA × IA.
- **A esquadra à frente larga a ordem dela** por até 120 s e depois volta, às vezes para trás, para o posto antigo. Se o general dá outra ordem no meio, a dele vale e a da equipe é esquecida.
- **O tanque que vai juntar-se (`tripTo`)** sai da estrada e da área da missão. O general pode achar a missão vazia. A viagem também não respeita o passo.
- **`com-carro` em terreno fechado** põe os homens 38 a 46 m à frente do carro, mais expostos.
- **O tanque que atira no contato da esquadra** só atira no que ele mesmo conhece, então a honestidade deve se manter. Mesmo assim, a suíte de percepção não rodou. O avistamento mais rápido dentro da equipe (`told`) muda o tempo de reação que ela mede.
- **A escolta do jogador** puxa uma esquadra livre que talvez fizesse falta em outro lugar.
- **Custo.** Por equipe, a cada 1 s: duas chamadas `near()` e quatro `kindAt`. Por lado, a cada 4 s, o emparelhamento, O(tanques × esquadras). Mais um `told` embrulhado num caminho quente da percepção, que retorna cedo sem equipe.

## Como testar depois

```sh
node tests/drills.js && node tests/veh-drills.js && node tests/help.js     # procedimentos e pedidos (com-carro, cidade, fire, clear)
node tests/perception.js                                                   # honestidade e partilha (o told embrulhado)
node tests/field.js && node tests/squads.js && node tests/mission.js && node tests/campaign.js
node tests/frame-budget.js                                                  # custo por quadro
node tests/sim-split.js
```

**A/B.** Rode partidas IA × IA de 15 min, com várias sementes, nas duas épocas e nos mapas 1 e 4, com `CA.on = 1` e com `CA.on = 0` (pelo harness: `c.$('CA').on = 0`). Compare o placar, os pontos tomados, os tanques perdidos para anticarro e os tempos dos assaltos. Leia também `S.caN` (equipes, separações por motivo, `lead`, `follow`, `prio`, `dis`, `esc`) e as contagens de `escolta-ca` em `S.drN`.

**No navegador:**
1. Entre num tanque perto de uma esquadra e ande: ela deve vir atrás (log do general: "Armas combinadas: ...").
2. Chegue a uma vila: a esquadra deve ir à frente.
3. A pé, com um tanque da IA perto: ele não deve passar mais de 40 m à frente de você.
4. Um anticarro inimigo perto do tanque: a esquadra deve sair atrás dele.
5. Esquadra pregada: o tanque da equipe deve atirar no que a prega.
