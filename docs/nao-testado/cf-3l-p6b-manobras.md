# P6b: manobras do general com N lados (não testado)

Tarefa `cf-3l-p6b-manobras`, pacote P6b do plano de três lados (EUA × Rússia × Insurgentes). Seguindo a regra do capitão, foi implementado sem rodar as suítes; o que não foi testado está listado abaixo.

## O que mudou

Tudo em `Céu de Ferro 3D.html`, nos trechos do P6b (manobras `MANT.*`, abordagens AP/PR/M7, emboscada/interdição/guarda/contra-flanco, fortificação AFP, postura STG e `fortPlan`).

- **Ajudantes próprios** (logo antes de `fortPlan`, procure `P6b (3 sides)`):
  - `mnFoe(t, s)`: `s` é um lado e é inimigo de `t` (todos contra todos; `S.rel[t][s] === 'ally'` vira aliado). `-1` (ponto neutro) nunca é inimigo.
  - `mnFoes(t)`: os inimigos de `t`, de 0 a `S.N - 1` (`S.N` vale 2 quando não existe).
  - `mnBase(t, x, z)`: a base inimiga mais perto de x z (sem x z, a mais perto da base de `t`).
  - `mnDs(t, ri)`: o sentido de avanço de `t` na estrada `ri`. Usa o `dsOf` do mapa versão 7 (P1) quando ele e `R.ends` existem; senão é o `t ? 1 : -1` de hoje.
  - `mnLead(t)`: o inimigo à frente (mais pontos, depois mais tíquetes), entre os que ainda têm tíquetes.
  - Por que não usei os nomes do P0: `foe` já existe no jogo, mas com outro sentido (é um predicado entre unidades), e `SIDES` já é a constante de desenho `[-1, 1]`. Os ajudantes `mn*` dependem só de `S.N`, `S.rel` e `S.base`. Quando o P0 entrar, cada um vira uma linha que chama o ajudante do P0.
- **Troca de `1 - t`**:
  - `hold === 1 - t` passou a ser `mnFoe(t, hold)` em `mresSafe`, `depSafe`, infiltração (`inf`), finta (`fnt`), desbordamento (`trn`), cerco (`cut`), guarda (`grd`), contra-flanco (`p11`) e no `foeTowns` da postura.
  - `S.base[1 - t]` passou a ser `mnBase` no lugar: `fortPlan`, recuo do `dep`, emboscada (`embPlaces`), recuo do bloqueio (`blk`), penetração (M7), minas da guarda e AFP.
  - `t ? 1 : -1` passou a ser `mnDs(t, ri)` em `mres`, `dep`, flanco (`mbf`), abordagens (`prInfWay`, `gask ap`, M7) e AFP. `X.ds` passou a ser `mnDs(t, frontR())`.
  - Em `manAt`, a posição padrão na estrada passou a ser `lineS` da ponta dona da estrada, e não mais sempre do lado 0.
- **Bloqueio (`blk`) e interdição (`itdEdges`) por inimigo**: varrem as estradas de suprimento de cada inimigo. A ordem descobre de quem é a estrada (o lado atrás de cuja linha está o lugar) e guarda isso em `op.e`.
- **Cerco (`cut`) por inimigo**: o inimigo é o dono do ponto Q. O anel (`cutRing`) conta só os pontos desse mesmo inimigo. `op.e` guarda o lado para o `OPS.cut`. Finta e desbordamento também guardam `op.e`, e "mudou de mãos" compara com ele.
- **Desbordamento**: `trnBase(t, e)` é a base do dono de Q, não "a base inimiga".
- **Incursão (`raid`)**: a profundidade é medida atrás da linha do dono do alvo (`mbOwner`).
- **Fustigamento (`gue`) contra o líder**: perder em pontos é contra o inimigo à frente (`mnLead`). Perder em tíquetes é contra o inimigo com mais tíquetes. A mensagem do plano diz isso.
- **Postura (STG)**: a razão de tíquetes é contra o inimigo com mais tíquetes.
- `fortTargets`: as trincheiras com soldados de qualquer inimigo dentro.
- Depois do merge do main (#70, construir mais), os embrulhos de `fortPlan` e `afpPlaces` (`bmrSupTries`, `bmrKitSup`, `afpPlaces`) também passaram a usar `mnDs` e `mnBase`.

Com N = 2, cada troca dá o mesmo valor de antes: `mnFoes(t)` é `[1 - t]`, `mnBase` é `S.base[1 - t]`, `mnDs` é `t ? 1 : -1` sem `R.ends`, e `mnLead` é o outro lado.

## O que NÃO foi testado

- Nenhuma suíte rodou (`man-a`, `man-b`, `man-c`, `ambush`, `approaches`, `campaign`, `personality`, `general`, `tmap`), nem partida A/B ou torneio.
- Não foi testado nada com `S.N = 3`, porque o P0, o mapa versão 7 (P1, com `R.ends` e `dsOf`) e a terceira base ainda não estavam no main.
- A regressão com N = 2 só foi conferida lendo o código.

O único teste foi uma fumaça de cerca de 1 minuto. O script principal passa no `node --check`. Uma partida IA × IA headless na época `modern` correu 51 s de jogo sem erro, com as manobras `inf` e `mres` abertas. O servidor sobe em 127.0.0.1. O navegador (chrome-devtools-axi) deu tempo esgotado ao abrir a página de 2,9 MB, como já tinha acontecido em outras tarefas.

A fumaça montou o próprio contexto vm. O `tests/harness.js` `load()` quebra no main: `aarShow`, `mmMan`, `mmW` e `m5Edge` estão depois do marcador `3D scene`, e o `m5Lg` também quebra com a logística ligada. Isso já existia antes desta tarefa.

## Riscos

- **Estradas sem o lado nas pontas**: `mnDs(t, ri)` dá `-1` quando `t` não é ponta da estrada, e `lineS(t, ri)` não faz sentido ali. AFP e `dep` podem pôr postos no lado errado da estrada. O P6a deve limitar cada general a `myRoutes(t)`.
- **`ecoDepth(e, …)`** (P6c) com um `e` que não é ponta da estrada: o bloqueio, a interdição e a incursão podem achar ou perder alvos errados até o P6c.
- **`mnBase` pelo mais perto**: com 3 lados, o "para onde fica o inimigo" de minas, trincheiras e recuos é a base inimiga mais perto do lugar. Isso pode não ser o inimigo que está de fato atacando ali.
- **`mnLead`** ignora um lado eliminado só pelos tíquetes (`tk <= 0`). Se o P2 marcar a eliminação de outro jeito, é preciso ligar aqui.
- O merge com o P0 pode trazer outro nome para os ajudantes. Os `mn*` continuam funcionando sozinhos, mas o ideal é apontá-los para os do P0.

## Como testar depois

1. Regressão com N = 2: `node tests/man-a.js`, `man-b.js`, `man-c.js`, `ambush.js`, `approaches.js`, `campaign.js`, `personality.js` e `tmap.js`. Compare com as falhas que já existem no main (`man-a` 1, `man-c` 7, `general` 3). O resultado deve ser o mesmo com `PAGE=` a página do main.
2. Com o P0, o P1 e o P6a no main, rode uma partida IA × IA `modern` com 3 lados (SECS=600) e confira:
   - `cut`, `fnt` e `trn` abrem contra pontos dos Insurgentes e da Rússia, e `op.e` é o dono do ponto;
   - `blk` e `itd` acham estradas de suprimento dos dois inimigos;
   - `gue` dispara contra o líder, e o texto do plano mostra os números certos;
   - nenhuma manobra põe posto, mina ou recuo virado para a própria base;
   - nenhum erro de `undefined` em `S.base[...]`.
3. Teste de unidade rápido dos ajudantes, com `S.N = 3`:
   - `mnFoes(0)` deve dar `[1, 2]`;
   - com `S.rel[0][1] = 'ally'`, `mnFoes(0)` deve dar `[2]`;
   - `mnBase(0, x, z)` deve dar a base mais perto entre 1 e 2;
   - `mnLead(0)` deve trocar quando o lado 2 passa o lado 1 em pontos.
