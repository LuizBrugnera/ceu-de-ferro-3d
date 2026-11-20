# M2 Abordagens: o que mudou e o que não foi testado

Tarefa `cf-m2-abordagens`, pacote M2 da proposta de manobra do general (decisões D1-D12 = A).
Pela regra de entrega do capitão ("implemente tudo sem testes e documente o que não foi testado"), a validação parou no meio. Abaixo está o que chegou a rodar e o que ficou sem teste.

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

## O que NÃO foi testado

- O `op.formT` (a reunião que espera a caminhada mais longa) numa partida de verdade. Não se sabe se os assaltos agora chegam à hora H.
- Nenhuma amostra de chegada: não sei o ângulo real de chegada nem a parte fora do eixo (as metas eram ≥ 35% de flanco e ≥ 40% fora do eixo).
- `drills.js` com a checagem corrigida, e `field`, `personality` e `orders` depois das últimas mudanças.
- O torneio A/B da D10 (≥ 40 partidas decididas, vitória ≥ 55%).
- As métricas do M0, que ainda não estão no `main`.
- O custo no Chrome. No Node da máquina compartilhada, uma busca leva 10-20 ms no total e o pior pedaço 4-13 ms (com 1.200 células por pedaço; reduzi para 600 e não medi de novo). O orçamento do general é ≤ 1 ms por quadro na média.
- O jogo online: o convidado perguntando `ap` ao anfitrião de verdade (só o relay foi testado).
- O mapa de hoje (modern) nos testes de cenário. Só o de 1944 tem cenário. O modern só rodou nas partidas.

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
