# M5 Veículos fora do trilho: o que mudou e o que não foi testado

## Testado em ffff56d (cf-pol-testes-b, 2026-11-20): parte
- Navegador, Assistir em 1944 (9 min de partida): aos 540 s nenhum tanque estava fora do trilho (`u.ai.m5`), e nenhuma das 80 últimas linhas do diário de cada lado (o diário guarda 80) era "estradas secundárias". Nenhum erro no console. Não dá para dizer se algum tanque saiu antes.
- **Continua sem teste:** tudo da lista abaixo. Nenhum tanque do assalto foi visto chegar, segurar e voltar.

Tarefa `cf-m5-veiculos-trilho`, pacote M5 da proposta de manobra do general (decisão D5 = A: blindados de manobra e emboscada por viagem tática; logística no trilho variando a rota).
Pela regra de entrega do capitão, nenhuma suíte, linha de base ou partida A/B foi rodada. Tudo abaixo está sem teste, salvo o smoke do fim.

## O que mudou

Tudo no `Céu de Ferro 3D.html`. Há uma seção nova `M5` no fim da simulação, logo antes do marcador `3D scene` (estava antes de `function boot()`, fora do harness: corrigido em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/75) e cinco linhas trocadas em `OPS.amb`, `OPS.blk` e `lgConvoy`.

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

## Testado em 9f2a313 (tarefa cf-testar-ia)

- **Bug corrigido** em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/75: o bloco do M5 estava depois do marcador `3D scene`, fora da parte que o harness (e toda execução sem navegador) carrega. Sem navegador o `lgConvoy`, o `OPS.amb` e o `OPS.blk` lançavam `ReferenceError` (`m5Lg`, `m5Tank`) e nenhuma suíte rodava o M5. O bloco foi para a simulação (com o M6, que estava depois dele) e `tests/sim-split.js` guarda isso.
- **Bug corrigido** em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/105: num mapa sem rede de estradas (`S.T.net` ausente, mapa antigo) o `m5Spot` e o `m5Go` liam `S.T.net.e` e a partida morria (`tests/field.js`). Agora o M5 não age sem rede.
- **Bug corrigido** em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/97: o M5 não chamava os tanques do assalto nos estados `mv`/`rec` do M3.
- `tests/sim-split.js`: partida de 150 s com logística física (4 comboios) e o M5 no mapa antigo: ok. `tests/ambush.js`, `tests/approaches.js`, `tests/tmap.js`, `tests/campaign.js`: passaram.
- `tests/bridges.js` (3), `tests/bridges-build.js` (3), `tests/logistics.js` (1), `tests/field.js` (2): falham **igual com `M5.on = 0`**: não são do M5.
- Partidas no harness: 1944 12 min, 1 tanque saiu do trilho para apoiar um assalto (`u.ai.m5`); hoje 15 min, nenhum. Sem erro.

## O que NÃO foi testado

- Se os tanques do assalto chegam, seguram a posição e voltam; se o tanque da emboscada chega antes da passagem; se o comboio alterna o eixo; a fração de tempo no trilho (a medida da sonda não funcionou: `u.spd` não é o campo da velocidade).
- O torneio A/B e o custo por quadro com e sem `M5.on`.
- Online (só o anfitrião roda o M5).

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
