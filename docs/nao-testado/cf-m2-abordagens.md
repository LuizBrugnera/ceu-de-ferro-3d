# M2 Abordagens: o que mudou e o que não foi testado

## Testado em ffff56d (cf-pol-testes-b, 2026-11-20): falha (7 checagens)
- `tests/approaches.js` (SECS=180, 41 min com a máquina cheia): 7 falhas, todas fora do planejador das abordagens, que passa inteiro (as 3 abordagens de Vila do Moinho, honestidade, água e pontes, economia de forças, `gask ap`, pool de 2.489 m):
  - **Hora H**: "0 squads assault, each along its approach, 1 covers them". As ordens na hora H saem `hold, hold, overwatch`. A hora H tem uma causa provável, lida no código e ainda a confirmar: desde o pelotão (P8, #144, `CEREBRO: pelotao`) a manobra segura (`hold`, passo "espera") na hora H até ouvir a base atirar, por até `PEL.fogo.max` = 45 s. O próprio `cf-p8-pelotao.md` avisa (risco 2) e pedia para rodar `approaches` e `procedures` com o pelotão no meio. O cenário do teste chama `OPS.atk` uma vez só, sem base atirando, e encontra `hold, hold, overwatch`. O ajuste dos dois testes (`PEL.on = 0` nesses cenários, como já fazem com `PR.on = 0`; o portão do pelotão fica com `tests/brain-pelotao.js`) vai no próximo PR, depois de uma rodada que o confirme.
  - **Reunião** (4): a esquadra perdida na reunião não é substituída por uma livre ("element undefined", sem a linha "substitui a perdida" no diário), e com o prazo vencido e 2 de 2 na reunião o assalto fica em `form` (p1) em vez de seguir. Não investigado: é código da manobra (`apRefill`, `OPS.atk`), que outra frente está reescrevendo. Em 9f2a313 isso passava. Entre lá e ffff56d entraram o #144 (pelotão), o #165 (reunião e pool) e o #166.
  - **Partida IA × IA de 180 s**: nenhum assalto aberto ("0 of 0").
  - **Custo**: o pior pedaço da busca levou 105 ms (meta < 1 ms por quadro na média). A máquina estava cheia, então isso não diz nada sobre o código.
- No navegador (Assistir em 1944, comando assumido): o `gask ap` sobre Vila do Moinho volta com as 3 abordagens, desenhadas no mapa (veja `cf-m7-jogador-mcp.md`). Em 9 min de partida não apareceu "Assalto planejado contra …" nas 80 últimas linhas do diário de cada lado.

Tarefa `cf-m2-abordagens`, pacote M2 da proposta de manobra do general (decisões D1-D12 = A).

## O que mudou

- **Planejador de abordagens** (`AP`, `apBuild`, no `Céu de Ferro 3D.html`, logo depois do mapa tático M1). Faz um Dijkstra no mapa tático do lado (células de 200 m). O custo de cada célula sobe com a vigilância e a força inimiga e cai na mata e na estrada. Água só se atravessa por ponte ou vau de pé. A busca parte do ponto do lado mais perto do objetivo (ou da estrada, 1,5 km antes). Num anel de 300-500 m em volta do objetivo, a célula mais barata de cada um dos 8 setores vira candidata, e as 3 melhores com 60° ou mais entre si são as abordagens. Cada abordagem leva ângulo, comprimento, minutos, exposição, mata, parte sobre o eixo, posição de assalto e reunião fora da vista (a 600-1200 m). O plano fica em cache por 20 s e é calculado aos pedaços (600 células por pedaço) dentro do plano do comandante (`apWork`).
- **Assalto livre do eixo** (`atkFit`, `cmdAttack`, `atkOpen` → `atkAp`):
  - As esquadras livres vêm de qualquer estrada a até 3 km de uma reunião do plano (`apPool`, `AP.pool`; eram 4,5 km do objetivo até o cf-manobra-fix).
  - O elemento principal vai pela abordagem mais barata. Com 2 esquadras ou mais, o segundo vai pela seguinte, se ela tiver até 1,8× o comprimento da primeira.
  - Cada esquadra anda em silêncio (`quiet`) e correndo (`fast`) até a reunião, pelo caminho da árvore da busca (`apWalk`).
  - Na hora H, cada esquadra segue a sua abordagem, passa pela posição de assalto e entra no objetivo. A cobertura (`overwatch`) fica na posição de assalto.
  - A reunião espera a caminhada mais longa (`op.formT`, até `AP.form` = 400 s) e depois segue com as esquadras que chegaram, duas ou mais; uma esquadra perdida no caminho é substituída por outra livre, até 2 por assalto (`apRefill`).
  - Na primeira vez, `cmdAttack` pede as abordagens (gate `ap`) e abre o assalto (ou a campanha) no turno seguinte.
- **Economia de forças** (`apQuiet`, `apLend`, `apFloor`): um posto quieto de pouco valor (linha, mata, `fpost`, `mil`, `garr`, `egd`) empresta a sua esquadra. Quieto quer dizer sem inimigo conhecido a 1,2 km e sem tiro há 3 min.
  - Empresta no máximo 2 esquadras por assalto.
  - Um ponto guarnecido mantém outra esquadra nele, e cada estrada mantém pelo menos 1 posto.
  - O `opFree` devolve a esquadra à ordem que ela tinha.
- **Pergunta `gask ap`** (`apAnswer`): pelo `genAnswer`/`genQuery`, pela lista do relay (`server.js` `GASK`) e pela lista do MCP (`mcp-general.js` `ASKS`). Também está no `MCP.md` e no `README.md`.
- `AP.on = 0` volta ao assalto antigo, pelo eixo. Isso serve de controle para o A/B.
- Testes alterados:
  - `tests/tmap.js`: compara a partida com e sem o mapa com `AP.on = 0`, porque agora o assalto lê o mapa.
  - `tests/campaign.js`: o primeiro turno pede as abordagens e o seguinte abre a campanha.
  - `tests/drills.js`: a checagem de honestidade vale só para inimigos. O `com-carro` usa um carro amigo e falhava à toa numa batalha diferente.
- Testes novos: `tests/approaches.js` e `tests/approaches-relay.js`.

## O que rodou (antes da regra nova)

- `tests/approaches.js` com `SECS=0`: todas as checagens passaram (cerca de 50). Elas cobrem:
  - abordagens de Vila do Moinho a partir de Travessia: eixo a 16°; flanco a 88° com 1,38× o comprimento; reuniões com vigilância de 0 a 0,15;
  - honestidade;
  - água e ponte caída;
  - assalto com esquadras de outra estrada;
  - empréstimo e devolução de posto;
  - a hora H pela abordagem;
  - `gask ap`.
- A partida IA × IA da suíte (180 s): na última rodada, falhou só a checagem do caminho de cada esquadra, por causa do atraso do rádio. Corrigi com `cnOrd`, mas a correção não foi rodada de novo.
- `tests/approaches-relay.js` e `tests/tmap-relay.js` passaram.
- `campaign`, `tmap`, `posts`, `squads` e `man-b` passaram.
- `general`, `gen-cmd`, `man-a` e `man-c` têm as mesmas falhas no `main` sem a mudança. São falhas antigas, não deste pacote.
- A/B, 4 partidas IA × IA de 12 min (sementes 2 e 3, 1944 e hoje), antes do `op.formT`:
  - assaltos de verdade abertos: 0 no código atual contra 8 com as abordagens;
  - em 6 deles, duas abordagens;
  - 13 esquadras emprestadas de postos quietos;
  - "sem esquadras" (`pool`) caiu de cerca de 2.000 para 300-1.300 avaliações.
  - Mas nenhum desses assaltos chegou à hora H dentro dos 12 min: um foi cancelado porque a reunião demorou demais, e outro foi desfeito porque perdeu uma das 2 esquadras. O `op.formT` foi a correção, e as partidas com ele foram interrompidas.

## Testado em 9f2a313: ok (tarefa cf-testar-ia)

- `tests/approaches.js`: passou inteiro (SECS=180, com a partida IA × IA: os 2 assaltos abertos pelas abordagens, cada esquadra com o seu caminho; 3 buscas de 6,9 ms, pior pedaço 2,4 ms, comandantes 2,8 ms por quadro no Node).
  - Duas falhas eram do teste, corrigidas em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/97: o cenário "assalto livre do eixo" agora sorteia o p12 do M3 (ponto forte), cujo reconhecimento vai de propósito às posições de assalto, então o cenário do M2 fixa `PR.on = 0`; e o movimento orgânico (#68) arredonda as curvas do caminho (passa a 4,8 m da posição de assalto), então a checagem aceita `ORG.poly.cut` m.
- `tests/approaches-relay.js`, `tests/tmap-relay.js`, `tests/tmap.js`, `tests/personality.js`: passaram.
- `tests/campaign.js`: quebrava (crash em `op.over`) por um cenário do quadro de ameaças que dependia do sorteio da partida; corrigido em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/116. Resta 1 falha mais antiga que o M2-M5 aqui (a QRF leva 1 esquadra).
- `tests/drills.js`: as 3 falhas de hoje (contato, romper contato, anel esperando carona) não existem em 2f2f9dc (M2-M5 todos dentro): vêm de merges posteriores, fora deste pacote. `tests/field.js`: o crash era do M5 (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/105); as 2 falhas restantes (patrulha, ponto parado) são iguais com `M5.on = 0`, fora deste pacote.
- Partidas IA × IA no harness (1944 12 min, hoje 15 min): sem erro nem NaN; os assaltos da IA abrem pelas abordagens.

## O que NÃO foi testado

- O torneio A/B da D10 (≥ 40 partidas decididas, vitória ≥ 55%) e as métricas de chegada (ângulo real, ≥ 35% de flanco, ≥ 40% fora do eixo).
- O `op.formT` numa partida longa: nas duas partidas medidas nenhum assalto com procedimento chegou à hora H (ficaram em reunião 200 a 600 s; ver o M3).
- O custo no Chrome. No Node: 6,9 ms por busca e pedaço de 2,4 ms com a máquina folgada, mas até 59 ms com ela carregada (a checagem do pedaço falha sob carga); a meta é ≤ 1 ms por quadro na média.
- O jogo online com o convidado perguntando `ap` ao anfitrião de verdade (só o relay foi testado) e o diário no navegador ("Assalto planejado contra X ...").

## Riscos

- Esquadras de longe demoravam, e um assalto com reunião longa ficava parado até `CMD.formMax` (900 s); desde o cf-manobra-fix o raio é 3 km de uma reunião e a espera, 400 s (com 2 km o assalto quase não abria: as esquadras livres ficam a 2,5–3,5 km da reunião).
- Os postos emprestados deixam a linha mais fina. O piso é 1 posto por estrada, com outro defensor no ponto guarnecido.
- Ondas de rádio (`cnP`): a ordem com o caminho chega atrasada; o `apIn` e o `apOrd` leem `cnOrd`.
- Com o mapa M1, a vigilância perto de um ponto é alta. Por isso a exposição das abordagens perto do anel fica entre 24% e 60%: a "exposição baixa" do protótipo não se repete.
- Um pedaço da busca (600 células) pode passar de 1 ms num quadro do Chrome.

## Como testar depois

```sh
node tests/approaches.js                 # inteiro (SECS=180, partida IA × IA); SECS=0 pula a partida
node tests/approaches-relay.js
node tests/campaign.js; node tests/tmap.js; node tests/drills.js; node tests/field.js; node tests/personality.js
```

A/B: as partidas com `AP.on` 1 e 0, de 12 min ou mais, nas duas épocas. Os scripts estão fora do repositório, em `~/firstmate/data/cf-m2-abordagens/probe/match.js` (`ON=0|1 ERA=ww2|modern SEED=n MIN=12`) e `atklog.js`, que mostra o ciclo de cada assalto. Confira:

- se os assaltos chegam a `go`/`fight`;
- o ângulo de chegada e a parte fora do eixo;
- os postos emprestados que voltam;
- `APB.stat()` e `AIB.stat()` (custo).

No navegador: abrir "Assistir" e, na Visão de General, olhar o diário. Deve aparecer "Assalto planejado contra X: N esquadras por duas abordagens (A° e B° do eixo), reunião fora da vista, ...", e as esquadras devem andar fora da estrada até a reunião.
