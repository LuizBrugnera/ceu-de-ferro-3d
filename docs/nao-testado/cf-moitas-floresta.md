# cf-moitas-floresta: mato dentro e em volta das florestas, e infantaria andando por ele (não testado)

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): parte
- Navegador, Assistir em Hoje (mapa 11, 3 lados): `S.T.ug` tem 88.165 células de mato e 380 faixas (o mapa cresceu desde as contas do mapa 10: 60 mil e 286). De perto, numa célula de densidade 0,79 na orla, as moitas baixas aparecem no chão. Aos 68 s, `S.hws.go` = 5 (esquadras pelo caminho escondido), e os soldados andando ficam a uma mediana de 22 m do eixo da estrada (p90 88 m). Nenhum erro no console.
- **Continua sem teste:** a parcela de tempo da infantaria na mata antes × depois, o A/B de partidas, o custo no quadro e o online.

## Por que a infantaria quase não anda pela floresta (lido no código, sem medir)
- As esquadras andam pelo "trilho" da estrada (`q.ri`/`q.s`); só saem dele numa viagem (`q.tp`). O caminho escondido (`HIDE`, #62) só vale quando o inimigo conhecido passa de 0,12 a até 1200 m do trajeto. Fora disso ("calm") vai pela estrada.
- Os caminhos do comandante (`O.wp`, de `footPath`/`tmWalk`) são feitos em células de 600 m e 200 m: não conseguem seguir uma faixa de moita de 30 m nem entrar na mata pela borda escondida.
- No mapa 7 não havia moita **dentro** nem colada na mata (`fit()` recusa mata), e acabaram os ids de objeto (abaixo de 65536): não dava para pôr mais moitas como objetos.

## O que mudou (`Céu de Ferro 3D.html`, **mapa versão 10**, `MAPV = 10`)
- `UG` / `ugGen` (no fim de `genTerrain`): um **campo de mato** (não são objetos, então não gasta ids), células de 25 m, pela semente do mapa (igual em todos os clientes):
  - dentro de toda mata densa (densidade 0,5–0,95 com ruído);
  - na orla, até 95 m para fora da mata, afinando;
  - nas margens baixas do rio;
  - nas bordas dos campos (linhas de 330 m × 260 m, por sorteio da era);
  - **faixas** ligando cada mata às 3 matas/cidades mais próximas (até 2,6 km, Dijkstra a partir de todas ao mesmo tempo), 36 m de largura, com ondulação.
  - Nada em água, estrada, cidade, aeródromo e borda do mapa.
  - Medido no navegador/harness: WW2 ~43,7 mil células de mato (16% do mapa), 172 faixas; moderno ~60 mil (10%), ~286 faixas. `ugGen` leva ~0,34 s no navegador (WW2).
- Regras (iguais para jogador e IA):
  - `coverAt`: soldado no mato fica escondido como numa moita (`UG.cov.c` 0,6, de todos os lados); mata com mato esconde um pouco mais (0,64).
  - `bump`: veículo no mato perde até 15% da velocidade.
  - Infantaria não é freada.
- Mapa tático: a camada `bush` (e por ela a ocultação `o` e o anteparo `scr`) soma a parte da célula com mato. `fpCells`/`footPath` e `tmWalk` padrão preferem mais a cobertura (mato ou mata) no mapa 10.
- `ugPoly`: todo caminho a pé dado a uma esquadra (`setOrd` com `O.wp`, e o caminho escondido do `HIDE`) é refeito por um A* na grade de 25 m do mato, dentro de 170 m do caminho original, custo `(1 − 0,7 × densidade) × (1 + 3 × vigilância inimiga)`. Água só onde o caminho original já cruzava (ponte). Só fica se não passar de 1,5× o comprimento do original.
- `HIDE` mais agressivo: `thr` 0,12 → 0,06, `look` 1200 → 1800 m, `min` 250 → 200, `max` 6000 → 7000, `stretch` 1,9 → 2,1. No mapa 10 a cobertura pesa 0,72 (era 0,55) e a estrada 1,4 (era 0,8), e uma célula onde a frente (`l`) pende para o inimigo conta como área disputada.
- `hideAt` (lugar escondido) e o esconderijo contra drone também procuram o mato.
- Cena (`ugTiles`, chamada em `render3d`): blocos de 400 m feitos sob demanda até 850 m do olho (2 por quadro, os mais próximos primeiro), `InstancedMesh` de moitas baixas (icosaedro simples), até 3 por célula pela densidade; os blocos longe são descartados.

## NÃO testado
- Nenhuma suíte, partida A/B ou medição de antes/depois (regra do capitão). **A parcela de tempo da infantaria na floresta antes/depois não foi medida.**
- Feito só: o servidor sobe, a página carrega (hangar em mapa 10, 25 blocos de mato desenhados, sem erro novo no console), `genTerrain` 10 nas duas eras e no mapa de 3 lados, e 45 s de IA × IA (WW2) no harness sem exceção (5 esquadras com caminho refeito pelo mato).
- Riscos:
  - Desempenho: `ugGen` aumenta a carga do mapa (~0,3–0,7 s); `ugPoly` roda a cada ordem a pé (até 200 mil células); `ugTiles` cria malhas durante o jogo (possível engasgo ao voar baixo e rápido).
  - Caminhos: esquadras podem demorar mais para chegar, ou ficar presas na mata (desvio das árvores, `jammed`). Com `HIDE` mais solto, mais ordens vão por fora da estrada, e operações com hora H podem atrasar.
  - Ponte: o A* fino só passa água por células de estrada quando o caminho original cruzava água; uma ponte caída perto pode ser usada.
  - `ugPoly` muda o `O.wp` no lugar (o mesmo array); quem lê o comprimento do caminho vê o novo.
  - O mato **não corta linha de visada** de quem está atrás dele (só esconde quem está dentro), diferente das moitas-objeto. Visual e regra podem não bater perto das bordas.
  - Online: sala nova abre no mapa 10; página antiga recebe erro de versão de mapa.

## Como testar depois
1. `node server.js`, abrir `http://localhost:8080`, Assistir (IA × IA) em 1944 e Hoje. Voar baixo/andar de soldado por matas, orlas, margens do rio e entre matas: ver o mato, FPS antes/depois, sem piscar ao cruzar blocos.
2. Console: `S.T.ug` (`n`, `lanes`), `ugAt(x, z)`, `S.hws` depois de minutos (`go` > 0), `S.squads.filter(q => q.tp && q.tp.ug).length`.
3. Medir a parcela: num harness, a cada segundo somar por soldado de IA andando se `kindAt(x, z) === 1 || ugAt(x, z) >= UG.thr`; comparar `MAPV=9` com `MAPV=10` (e `UG.on = 0`, `HIDE.on = 0` como controles), nas duas eras.
4. A/B de partidas `MAPV=9` × `10`: baixas da infantaria na aproximação, tempo de chegada, pontos tomados, operações atrasadas.
5. Testes existentes de manobra/emboscada com `MAPV=10` (`tests/ambush.js`, `tests/approaches.js`, `tests/cover.js`).
6. Online: duas páginas novas na mesma sala (mapa 10); uma página antiga deve receber o erro de versão.
