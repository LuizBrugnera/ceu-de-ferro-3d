# M5 Veículos fora do trilho: o que mudou e o que não foi testado

Tarefa `cf-m5-veiculos-trilho`, pacote M5 da proposta de manobra do general (decisão D5 = A: blindados de manobra e emboscada por viagem tática; logística no trilho variando a rota).
Pela regra de entrega do capitão, nenhuma suíte, linha de base ou partida A/B foi rodada. Tudo abaixo está sem teste, salvo o smoke do fim.

## O que mudou

Tudo no `Céu de Ferro 3D.html`. Há uma seção nova `M5` logo antes de `function boot()` e cinco linhas trocadas em `OPS.amb`, `OPS.blk` e `lgConvoy`.

- **Custo tático do trecho** (`m5Edge`, `m5Cost`). O custo de hoje (comprimento × classe × (1 + `C.et`)) passa a ser multiplicado por 1 + média, nas amostras do trecho, do mapa tático M1. Os pesos são: vigilância inimiga `kV` 3, força `kF` 1,5, nossas perdas `kP` 0,6 e tráfego inimigo `kT` 0,3. O resultado fica em cache por lado até a próxima renovação do mapa (`C.m5e`, `C.m5n`).
- **Viagem tática** (`tripTac`). Usa o mesmo registro do `tripTo`, mas com esse custo. O `tripTo` foi embrulhado: toda viagem de veículo da IA usa o custo tático quando o lado tem mapa. Caminhões e carros sorteiam ainda até +15% por trecho (`M5.jit`). Assim os caminhos de custo parecido se alternam e não viram hábito para o inimigo emboscar. Hoje passam pelo `tripTo` a volta da carona, o desvio de ponte caída (W20) e o `back` de uma viagem.
- **Blindados do assalto** (`m5Atk`, `m5Spot`, embrulho de `atkOpen`, `OPS.atk` e `AI.tank`). Vale para um assalto da IA que não seja ocupação (`walk`).
  - Vai 1 tanque, ou 2 se o assalto tiver 3 esquadras ou mais. Cada um tem de estar no trilho, parado, inteiro e a até 4 km do objetivo.
  - Ele segue pela viagem tática até a estrada mais perto de uma posição de tiro fora da frente.
  - A posição vem do M2: a posição de assalto de uma abordagem que as esquadras não tomaram (fogo cruzado), entre 35° e 120° do eixo. Em seguida vale a abordagem das próprias esquadras. Sem abordagem, um anel de 380/520 m escolhe a célula com menos vigilância, força e perdas, mais ocultação, o objetivo à vista e estrada perto.
  - Lá o tanque segura a posição (`u.ai.m5`) e atira no que vê. O cérebro do tanque luta como sempre, só a direção é a da posição.
  - Ele larga a posição quando o assalto acaba, recua (`back`) ou consolida (`cons`), quando a vida cai abaixo de 50% ou depois de 8 min mais o tempo da viagem. Então volta ao eixo mais perto por viagem (`m5Home`).
  - Tanque único de um eixo em postura `def` não sai.
  - Tentativa a cada 20 s enquanto o assalto está em `form`, `prep` ou `screen`. Cada saída fica no diário: "Carro de combate vai por estradas secundárias apoiar o assalto a ... pelo flanco".
- **Emboscada e bloqueio** (`m5Tank`, `m5Amb`, embrulho de `tankAmb`).
  - O tanque que espera pode vir de qualquer eixo a até 3,5 km. Antes, só do próprio eixo a 1,5 km, ou a 900 m no bloqueio.
  - Ele vai por viagem tática até a estrada mais perto do lugar, e a espera ganha o tempo da viagem.
  - Depois, se estiver a mais de 200 m do trilho, volta por viagem.
- **Comboios** (`m5Lg`, em `lgConvoy`). Entre os eixos em que o nó fica (`rs[j]`, a até 250 m), sorteia um dos que custam até 15% mais que o mais barato (comprimento × (1 + `lgThr`)). Deixa de fora o eixo do último comboio para aquele nó, se houver outro. A escolta segue o mesmo eixo.
- `M5.on = 0` desliga tudo. Serve de controle para o A/B.

## O que rodou (smoke de ~1 min)

- `node --check` no script da página: ok.
- O servidor sobe em 127.0.0.1 e a página carrega no Chrome. A demonstração IA × IA roda sem erro novo no console (só o 404 que já existia).
- Uma chamada de cada função no console da demonstração: `m5Edge` dá multiplicadores entre 1 e 3,1. `tripTo` de um caminhão gerou uma viagem tática (`tac: 1`, 2,2 km). `m5Spot`, `m5Lg` e `m5Home` responderam sem erro.

## O que NÃO foi testado

- Nenhuma suíte (`tests/*.js`), nenhuma partida longa, nenhum torneio A/B e nenhuma medição de custo por quadro.
- Não foi verificado se:
  - os tanques do assalto de fato chegam, seguram a posição e voltam;
  - a viagem tática desiste demais. O `tripAI` larga a viagem com inimigo a menos de 600 m (`MANT.trip.fight`), e aí o tanque segue em linha reta pelo terreno, como antes;
  - o tanque da emboscada chega antes do inimigo passar;
  - o comboio alterna o eixo;
  - a nova fração de tempo de veículo no trilho fica abaixo dos ~86% medidos pelo scout.
- Online: só o anfitrião roda isso (veículos sem `u.net`). Não foi testado com convidados nem com a passagem do anfitrião.
- Os testes que existem para emboscada, bloqueio, carona, pontes e logística podem mudar de resultado. O tanque agora vem de mais longe, as viagens usam outro custo e o comboio sorteia o eixo.

## Riscos

- **Assalto com menos blindados nos eixos.** Até 2 tanques saem do trilho por assalto. Um eixo pode ficar mais fraco, e só o último tanque de um eixo em `def` é protegido.
- **Tanque preso.** A viagem termina na estrada mais perto e o último trecho é por terreno (`driveTo`). Se esse trecho tiver rio ou mata fechada, o tanque pode não chegar. O resgate é o fim do tempo (`M5.atk.hold`).
- **Custo por quadro.** O `m5Edge` só refaz quando o mapa renova (4 s). Cada `tripTac` roda o Dijkstra da rede sem cache, só nas atribuições.
- **Sorteio.** `m5Jit` e `m5Lg` usam `Math.random`, como o `colAxis`. Partidas com a mesma semente podem divergir se o teste depender de outra coisa.
- **Ordem dos embrulhos.** `AI.tank`, `tankAmb`, `atkOpen`, `OPS.atk` e `tripTo` são reatribuídos no fim do script. Um embrulho futuro deve vir depois deste.

## Como testar depois

1. Suítes afetadas, cada uma sozinha: `node tests/approaches.js`, `tests/bridges.js`, `tests/bridges-build.js`, `tests/logistics*.js`, as de emboscada/bloqueio (`grep -l "amb\|blk" tests/*.js`), `tests/campaign.js` e `tests/tmap.js`. As online rodam com `HOST=127.0.0.1`, uma de cada vez.
2. Uma partida IA × IA de 12 min no mapa de 1944 e uma no de hoje. Em cada uma:
   - contar `S.units.filter(u => u.ai && u.ai.m5)` ao longo da partida;
   - ver as linhas "estradas secundárias" no diário;
   - medir a fração do tempo de veículo da IA em movimento com `u.rail && !u.trip` (antes ~86%).
3. Torneio A/B (D10) com `M5.on = 1` contra `M5.on = 0`: vitórias, perdas de tanques, assaltos tomados e tempo no trilho.
4. Comboios: abrir vários comboios para um nó que fica em dois eixos (`p.rs` com dois valores) e conferir que o `ri` alterna.
5. Custo: `AIB` e o medidor do general com e sem `M5.on`. A meta é o general ≤ 1 ms por quadro.
