# 3 lados, P0 Fundação: o que mudou e o que não foi testado

Tarefa `cf-3l-p0-fundacao`, pacote P0 do plano de três lados na Frente atual (EUA × Rússia × Insurgentes). O P0 era para ir antes de todos. Quando chegou a hora do merge, o `main` já tinha recebido o P2, P3, P4, P5, P6a, P6b, P6c, P7 e P9. Cada um deles já alargou o próprio trecho, e `S.N` já é definido pelo P4 em `newState`. Por isso o P0 foi refeito em cima do `main` de agora e ficou com três partes:
- os ajudantes do plano (seção 4) que ainda não existiam. O P6a já chama `foes(t)`, e o P6c usa `SIDES()` quando ele existe;
- `S.rel`;
- os pares, laços e testes de lado que ainda supunham dois lados fora dos trechos dos outros pacotes.

Com 2 lados nada muda.

## Ajudantes novos (`Céu de Ferro 3D.html`, logo depois de `let S = null`)

- `SIDES()`: os números dos lados, de 0 a `S.N - 1`, numa lista congelada. Sem partida, ou com um `S` montado à mão num teste, é `[0, 1]`. Lê `S.N`, que o `newState` define (P4).
- `bySide(f)`: um array com `f(t)` para cada lado. Troca `[0, 0]`, `[[], []]`, `[{}, {}]` e parecidos.
- `isSide(t)`: `t` é um lado desta partida, um inteiro de 0 a `S.N - 1`. Troca `t === 0 || t === 1`.
- `ALL()`: a máscara de todos os lados (3 com 2 lados, 7 com 3).
- `S.rel[a][b]`: `'foe'` ou `'ally'`. O `newState` a monta com `relNew(N)`: todos contra todos, e só a diagonal é `'ally'` (D7, sem interface). Antes ninguém criava `S.rel`, e os ajudantes do P6b (`mnFoe`), do P6c (`lsFoe`) e do P7 (`insFoe`) já a liam com uma guarda.
- `foe(a, b)`: com dois números de lado, diz se `b` é inimigo de `a` (`foeSide`). O nome `foe` já existia com duas entidades (a regra de alvo, com o fogo amigo). Essa forma continua igual e agora consulta `S.rel` pelos times. As duas formas ficam no mesmo nome, como o plano pede.
- `foes(t)`: os lados em guerra com `t` (com 2 lados, `[1 - t]`). O `foeOf` do P6a já o usa.
- `foeBase(t, x, z)`: a base inimiga mais perto de `x, z`. Sem `x`, a mais perto da base de `t`. Com 2 lados, `S.base[1 - t]`.
- `SIDEMAX = 3`: o máximo de lados de uma partida (corta `gn`/`gk` do `welcome`).
- A constante `SIDES = [-1, 1]` da parte 3D (esquerda e direita, nas rodas, lagartas e asas) passou a se chamar `LRS`, para o nome `SIDES` ficar com os lados do jogo. O `lsN` do P6c já testava `typeof SIDES === 'function'` e agora usa este.

**A frente pelas estradas (seção 4.2 do plano), junto do `endS`:**
- `R.ends = [lado em s = len, lado em s = 0]` de cada estrada principal. Quem o define é o mapa versão 7 (P1). Uma estrada sem ele é a de hoje: a base 0 em s = len e a base 1 em s = 0.
- `dsOf(t, ri)`: o sentido de `t` ao longo da estrada (hoje, `t ? 1 : -1`).
- `endS(t, ri, d)`: `d` metros a partir da ponta de `t`. Lê `R.ends` quando existe.
- `foeOn(t, ri)`: o lado na outra ponta, ou −1 quando `t` não é ponta dessa estrada.
- `myRoutes(t)`: as estradas de que `t` é ponta.

Estrada sem `R.ends` dá exatamente as fórmulas de antes, inclusive para um `t` que não é 0 nem 1. O P6a, P6b e P6c já chamavam esses nomes. O `main` quebrava sem eles desde o #76. O P1 só precisa pôr `R.ends` nas estradas e não deve redefinir os nomes.

**As cópias dos outros pacotes agora usam estes ajudantes.** Cada pacote tinha escrito a sua versão da mesma regra, e agora todas chamam o P0. O resultado é igual com 2 lados:
- P3: `sdsOf` chama `SIDES()`;
- P6b: `mnFoe` chama `isSide` e `foeSide`, e `mnFoes` chama `foes`;
- P6c: `lsN` chama `SIDES()` (antes tinha a guarda `typeof SIDES`), `lsSide` chama `isSide`, `lsFoe` chama `foeSide` e `lsFoes` chama `foes`;
- P8: `civFoes` chama `foes`;
- P7: `insFoe` chama `foeSide`.

Uma tabela `S.rel` com aliados, então, vale igual para todos eles.

## O que foi alargado (mecânico)

- **Pares → `bySide`:**
  - o diário do despacho, `S.rep`, `t.kn`, `S.humans` (recontado pela rede);
  - os carros abandonados, `S.drN`, os veteranos, `f.in`/`B.in` (trincheira e prédio);
  - as vilas sem conquista (`n` e "nenhum outro lado na vila"), `Q.rqa`, `S.dsq`, o `w` dos pontos das vilas;
  - `S.gcm`/`S.gsq`, `Net.gl`, os `gn`/`gk` do `welcome` (padrão);
  - `S.msus`, a iluminação (`illSq`/`illArt`), o `gp` do `ecoPack`;
  - o mapa tático (`TMB.ref`, `S.tmJ/tmT/tmA`, escalonado em `t × TM.every / N`) e `S.gmem`.
- **Laços:** `[0, 1].map/forEach/filter`, `for (const t of [0, 1])` e `for (let t = 0; t < 2; ...)` viraram `SIDES()`. Valeu para a demonstração, os relógios de reforço (`gpStep`), o teto de população, o rádio de ajuda, os helicópteros, `cmdOf`, a personalidade e a dificuldade (`perSet`, o retrato), a memória do M6, a Visão de General e o HUD.
- **Minas:** `o.kn & ALL()`, e `kn: ALL()` na mina recebida. O lado da mina recebida aceita 2.
- **"É um lado":** 18 testes `=== 0 || === 1` com time viraram `isSide`. Entre eles: as linhas de IA e de obra da rede, o contador de drones, `gBad`, as perguntas `brg`, `w13`, `tmap` e `ap`, o `ecs` recebido e o M6.

**O que ficou de fora, de propósito, para não brigar com pacotes em curso:**
- os civis e o W14 (`civD`, `civPlan`, `civLook`, `civFight`, `civHit`, `civTurn`, `civRevolt`, `roeHeld` e o `hate` do `civState`) são do P8, que entrou no `main` enquanto o P0 estava em curso;
- as obras pré-cavadas por estrada (`fortInit` com `lineS`/`endS`) são do P1;
- as jazidas pela metade do mapa (`half`) são do P1;
- as armas e os assentos (`crewSt`, `drive`), o controle (`PAD`) e o tipo de mina não são lados.

O servidor, o MCP e os testes de relay já foram alargados pelo P5 (`ts(room, s)`, `ALL(room)`). O P0 não mexeu neles.

## O que rodou (smoke)

- `node --check` no script da página: ok.
- Partida IA × IA de 20 s no harness (economia ligada, semente 7), na Frente atual e em 1944, comparada com o `main` de agora (`cd55a83`, com os três ajudantes de 2 lados postos à mão, porque o `main` quebra sem eles):
  - mesmos números de soldados, veículos e aviões;
  - mesmos tíquetes;
  - mesma soma das posições dos soldados.

  Nada mudou com 2 lados. Também deu `S.N = 2`, `SIDES() = [0, 1]`, `ALL() = 3`, `foes(0) = [1]` e `foeBase(0) = S.base[1]`, sem NaN.
- Partida de 3 lados: não começa no `main` de agora. O mapa (versão 8) ainda tem 2 bases, e o `sidesOf` do P4 só dá 3 lados com a terceira base, que vem do P1. Pedir `N: 3` dá `S.N = 2`, e a partida roda normalmente com 2 lados (testado: 3 s sem erro, `S.rel` 2 × 2).
- `tests/all.sh` não rodou: o capitão voltou à regra de sem testes neste pacote.
- O Chrome (chrome-devtools-axi) não abriu nesta máquina ("socket hang up").

## O `main` quebrado desde o #76

O `main` chama `dsOf`, `foeOn` e `myRoutes`, que ninguém definia. A página quebra no primeiro quadro: `ReferenceError: dsOf is not defined`. O P0 define os três (acima), e a página do P0 roda sem nenhum remendo.

Para comparar, a cópia do `main` recebeu a versão de 2 lados desses três (`t ? 1 : -1`, `1 - t`, todas as estradas). Também havia um conserto em curso (`cf-hotfix-main`) com versões guardadas, definidas só se faltarem. Se ele entrar antes, as versões dele saem no merge e ficam estas.

## O que não foi testado (caminhos de N = 3)

Nada com 3 lados foi rodado. Uma partida de 3 lados precisa do mapa versão 7 com a terceira base (P1). Sem ele, o `newState` fica em 2 lados (`sidesOf`, do P4). Os ajudantes acima foram escritos para N = 3, mas só foram exercitados com N = 2.
