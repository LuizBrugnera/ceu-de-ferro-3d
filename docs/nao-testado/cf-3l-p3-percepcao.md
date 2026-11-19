# cf-3l-p3-percepcao: percepção por lado (3 lados, pacote P3): não testado

Pacote P3 do plano de 3 lados (EUA × Rússia × Insurgentes): o que um lado vê deixa de virar conhecimento dos outros lados.

## O que mudou

Tudo no HTML `Céu de Ferro 3D.html`.

- **Avistamento por lado.** `u.sn[t] = [T, x, z]` guarda quando o lado `t` viu a unidade `u` pela última vez, e onde ela estava. `seenT`, `sx` e `sz` continuam como "o avistamento mais novo de qualquer outro lado", para o HUD e para quem lê sem um lado.
- **Ajudantes novos**, junto de `spotRun`:
  - `sT`, `sX` e `sZ(u, t)` leem o avistamento do lado `t`;
  - `seeBy(u, t, x, z, T)` grava um avistamento;
  - `snCopy` copia avistamentos para as figuras que representam quem está numa trincheira, num prédio ou numa antena;
  - `NSD()` é o número de lados (`S.N || 2`) e `sdsOf()` é a lista de lados.
- **Com 2 lados nada muda.** Com `S.N` vazio ou igual a 2, os leitores leem `seenT`, `sx` e `sz` como antes, e `spotRun` faz o mesmo caminho de antes, com as mesmas chamadas a `qr`.
- **Com 3 lados, quem grava** o faz no lado de quem viu:
  - `spotRun`: cada outro lado olha por conta própria (`spotSd`). Vale para unidades, soldados e bases de suprimento.
  - O rádio que atrasa um avistamento (`cnLate` e `N.sw`) guarda uma entrada por lado.
  - Também gravam no lado de quem viu: os drones de câmera, as estações de rádio, a antena (CN), a cúpula (`domeSee`), os lotes da economia (`ecoSeen`) e a radiogoniometria. Neste último caso só a escrita mudou; a regra `1 - t` fica para o P6c.
- **Quem lê usa o próprio lado:**
  - `spotted(u, t)` ganhou o lado em todos os chamadores;
  - `told` (aeronaves), `C.known` em `cmdSense`, `cmdKnown`, `ptThreat` e as missões de fogo;
  - nas manobras: incursão (`mbRaidAssets`), bloqueio (`blkRoads` e `blkSeen`) e guerrilha;
  - a visão do general (`genVM`), a recuperação (REC), a interferência (CN), os hábitos, o mapa tático (`tmObs`, onde `u.team === 1 - t` virou `u.team !== t`), a postura (STG), a AFP e o HUD (`me` e `P.team`).
- **Alvos em trincheira e em prédio** (`f.tg` e `B.tg`) são criados para N lados. `fortTargets`, `bldTargets` e `bldTarget` percorrem todos os outros lados.
- **`e.idf` virou máscara por lado** (`ecoHid` testa o bit do lado; `ecoIdf` recebe o lado que olha).
  - Na rede, com 2 lados, continua indo 0 ou 1.
  - Com 3 lados vai a máscara. O servidor já aceita de 0 a 255.
- **Minas.** `sus` vai para o lado da vítima. Se a vítima não é conhecida, vai para todos os outros lados. `sus(t)` cria a lista do lado que faltar.
- **Olhar para a frente.** `fwd` usa `foeBase` (do P0) com 3 lados. Com 2 lados continua como antes.

## Depende do P0

Com 3 lados, `fwd` chama `foeBase(t, x, z)`, que vem do P0. Antes do P0 entrar, forçar `S.N = 3` dá `ReferenceError: foeBase is not defined`. Com 2 lados esse caminho não roda.

## O que NÃO foi testado

- Nenhum teste, partida, linha de base ou A/B foi rodado (regra de entrega).
- Só se conferiu:
  - a sintaxe do script (`node --check`);
  - que o servidor sobe em 127.0.0.1 e que a página carrega com a demonstração do hangar, sem erro novo no console;
  - forçando `S.N = 3` na demonstração, `spot()` gravou `u.sn` por lado (o único erro foi o `foeBase` acima).
- Não foram verificados:
  - a equivalência com 2 lados pelos testes de hoje (`tests/`), em especial `seat.js` (lotes e `idf`), `forts*`, `sappers*`, os testes de rede (CN) e os de percepção e general;
  - uma partida real de 3 lados (precisa de P0, P1, P2 e P4).

## Riscos

- **Equivalência com 2 lados.** O laço de `ecoSeen` foi reescrito por lado (com 2 lados, só o outro lado). O `idf` deixou de ser booleano e virou máscara, embora o valor continue verdadeiro ou falso do mesmo jeito. `bldTarget` agora tem um laço interno.
- **Leitores esquecidos.** Algum leitor de `seenT`, `sx` ou `sz` que use `.seenT` sem passar o lado lê "visto por qualquer lado". Com 3 lados, isso vaza para esse lado o que os outros viram (por exemplo `MSL.seen`, os leitores com `1 - t` dos pacotes P6, e o HUD de quem assiste).
- **`N.sw` com 3 lados.** A chave é `u.swk[lado]` e não mais a unidade. Uma entrada antiga sem `e.u` cai na própria chave.
- **Memória.** Cerca de 3 arrays pequenos por unidade vista.

## Como testar depois

1. Com 2 lados, rode `sh tests/all.sh`, ou uma suíte de cada vez com `node tests/<suíte>.js`. Atenção a `perception.js`, `seat.js`, `forts.js`, `sappers.js`, `comms.js`, `general.js` e `gen-cmd.js`. Compare com a main no mesmo commit de base, porque algumas suítes já falham na main. Rode as suítes `*-online` sozinhas, com `HOST=127.0.0.1`.
2. Com 3 lados, depois de P0, P1 e P4, numa sandbox de teste:
   - ponha uma unidade do lado 1 à vista só do lado 0 e rode `spot()`;
   - confira `sT(u, 0) === S.t` e `sT(u, 2) === -1e9`;
   - confira que `cmdSense(S.cmd[2])` não põe a unidade em `C.known`, e que `spotted(u, 2)` é falso.
3. Lote disfarçado: o lado 0 identifica a fábrica do lado 2. Confira que `ecoHid(e, 0)` dá falso e `ecoHid(e, 1)` dá verdadeiro.
4. Mina: um veículo do lado 1 pisa numa mina do lado 2. Confira que `sus(1)` ganha o ponto e `sus(0)` não.
