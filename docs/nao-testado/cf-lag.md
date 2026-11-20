# cf-lag: lag e travadas na batalha (não testado além da medição)

Relato do capitão no main de 20/11: "estou sentindo bastante lag e travamentos, veja o que pode estar causando isso".
O relatório completo, com as tabelas e o método, está em `/home/luiz/secondmate/data/cf-lag/report.md`. Aqui ficam só o que mudou no código e o que falta testar.

## Causas encontradas (medidas no Chrome com a RTX 4060 e sem navegador)
1. **Travadas de 1 a 4 s a cada 10–36 s de jogo: `enpFobPick`** (engenharia, #159). A escolha da base avançada percorre todas as células do mapa tático e, em cada uma, chama `ecoDepth` e `railOf`, que percorrem todos os pontos de todas as estradas do mapa 11. Uma chamada levava de 1 a 3,9 s, dentro de um único passo.
2. **Pensamentos sincronizados: 160 a 240 soldados pensando no mesmo passo, duas vezes por segundo.** Em `aiMan`, o tempo que passa do pensamento era cortado em `-MANB.dt` (1/30 s). Quando o CLK alonga os passos (máquina sob carga), uma batida da mente chega a 2/30 s e o corte alinha a fase de todos. O resultado são passos de 65 a 120 ms com quase nada nos passos entre eles. É uma realimentação: passo caro → passos longos → pensamentos agrupados → passos ainda mais caros.
3. **O relógio (CLK, #118) enchia o quadro.** Com o passo custando 18 ms, o CLK enchia cada quadro com passos de 1/60 s até o orçamento de 100 ms: ~10 quadros por segundo para uma batalha que 2 passos mais longos pagam a ~23 quadros por segundo.
4. **Custo por passo maior (+35% a +60%), espalhado.** Não há um PR culpado: há mais soldados (engenharia, médicos, insurgentes), o cérebro (P0–P8, ~3 pontos do perfil) e o mapa 11. No perfil, o maior bloco é `stepMan` → `aiMan` → `manThink`, cuja varredura de alvo percorre todos os ~450 soldados a cada pensamento. Só ~33 deles estão dentro de `IAI.see` (650 m).

## O que mudou (`Céu de Ferro 3D.html`)
- `enpFobPick`: calcula primeiro a nota barata (gargalo/crista, visada, linha). Só chama `ecoDepth`, `railOf`, a distância às bases e `cmdKnown` quando essa nota ainda pode vencer a melhor célula, porque esses testes só excluem a célula ou baixam a nota. A escolha é a mesma. `cmdKnown` escreve em `KN`, mas todo leitor de `KN` chama `cmdKnown` logo antes.
- `railOf`: laço `for` em vez de `forEach` e `Math.sqrt` em vez de `Math.hypot`.
- `hdist`/`dist`: `Math.sqrt(x*x + z*z)` em vez de `Math.hypot`, que é 3× mais caro no V8. A diferença fica no último bit do float.
- `aiMan`: o tempo que passa do pensamento é guardado até o `dt` da própria batida (`Math.max(A.think, -dt)`) em vez de `-MANB.dt`. Cada soldado mantém a fase sorteada (`rand(0, IAI.think)`), e a cadência média continua `lodThink`.
- `CLK.plan`: novos `frame: 20` e `share: .5`. Os passos de 1/60 s que não cabem em 20 ms, nem em metade do tempo real do quadro, não são dados enquanto passos mais longos (até `hmax`, 1/30 s) pagam toda a dívida. Com passo barato nada muda, e um quadro lento por causa do desenho continua com passos de 1/60 s. O `budget`, o `least` e o `catch` continuam valendo. `tests/clock.js` passa.
- `MGR`/`mgrNear`: grade de soldados (quadrados de 250 m, refeita a cada passo) para a varredura de alvo do `manThink`. Ela devolve, na ordem de `S.men`, todos os soldados que podem estar a menos de `IAI.see`, com folga de 100 m mais os acrescentados no passo. Assim `foe`/`known`, que têm efeitos colaterais, são chamados nos mesmos soldados e na mesma ordem. Sem navegador, com semente fixa, 40 s de batalha deram a mesma impressão digital (posições de 432 soldados, mortos, alvos) com e sem a grade.

Nada disso muda as regras do jogo; os interruptores (`BRAIN.on`, `ENP.on`, `LOD.on` etc.) seguem iguais.

## NÃO testado
- Fora a medição, nenhuma suíte rodou, exceto `tests/clock.js` (passa).
- Os passos mais longos sob carga (CLK) mudam a granularidade da física nesse regime (até 1/30 s, que o CLK já usava acima do orçamento). Os projéteis continuam em saltos de 1/60 s.
- Ainda não foi visto na tela: um jogador pilotando avião ou tanque sob carga, com os passos de 1/30 s.

## Recomendações (exigem mudança de arquitetura)
- Varreduras N² que restam: `spotSd`/`spotRun` (raio de 2500 m, a grade de 250 m não ajuda), `foe` com fogo amigo (`grade` → `notice` para cada amigo a 200–650 m, com efeito colateral) e `safe` em `stepShots`. Uma grade por lado com consultas por raio, e um cache de `notice` por par e por batida, mudariam a ordem das chamadas, então pedem decisão de produto.
- `railOf`/`lsRail`/`ecoDepth` percorrem todas as estradas. Um índice espacial dos segmentos de estrada (grade) serviria a todos os chamadores.
- Alocação de ~100 MB/s (`{}` por chamada em `railOf`, `honEar`, `routeAt`, etc.): o heap sobe a 1–1,3 GB antes de cada coleta maior.
- Um orçamento de tempo para as tarefas do general (`plan`): hoje uma tarefa nova que custe segundos trava a tela. O `fortPlan` não é cortado como o `spot` (`SLICE`).

## Como testar depois
1. Main contra este ramo, "Assistir" moderna com 3 lados, Média, 5 min: no console, `AIB.stat()` e `CLK.c`. Contar quadros > 1 s (antes: um a cada 10–36 s).
2. `S.men.filter(m => m.ai).map(m => Math.round(m.ai.think * 10))`: as fases devem ficar espalhadas de 0 a 5, sem dois blocos.
3. Ver uma base avançada da IA (`fort fob`) sendo escolhida e construída como antes.
