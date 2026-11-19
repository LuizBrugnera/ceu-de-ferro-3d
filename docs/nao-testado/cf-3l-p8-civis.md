# P8 Civis e regras da guerra (W14) com N lados: o que mudou e o que não foi testado

Tarefa `cf-3l-p8-civis`, pacote P8 do plano de três lados (EUA × Rússia × Insurgentes; seção 7 do plano, decisão D8 = a).
Pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado em partida**.
Usa os ajudantes da fundação P0: `S.N`, `SIDES()` e `foes(t)`.

## O que mudou (`Céu de Ferro 3D.html`, bloco dos civis)

- **Registro por lado (`civD`)**: `n`, `tk`, `say`, `mil` e `roe` têm `S.N` entradas (antes, pares). `D.hits[bi]` também.
- **Lado válido**: `civT(t)` (0 ≤ t < `S.N`) troca os `t === 0 || t === 1` de `civHates`, `civToll`, `civHeard`, `roeBar`, `civLook`, `civFight` e `bombHeld` (o homem-bomba e o carro-bomba da IA insurgente seguem o W14 como os outros).
- **Máscara de ódio**: `civHeard` aceita `f < 1 << S.N` (antes `f < 4`); com 3 lados, o bit 4 é o dos Insurgentes.
- **`civPlan`** (a IA arma a vila que segura): conta tropa por lado e só arma se **nenhum inimigo** (`foes(t)`) está a `calm` m. A variável local `foe` virou `by` para não esconder o ajudante `foe()` da P0.
- **`civTurn`**: a vila que se volta contra t avisa cada inimigo de t (`foes(t)`). Com 3 lados o texto diz o nome do lado ("se voltou contra Rússia"); com 2 continua "contra o inimigo".
- **`civRevolt` / `civArms` (D8)**: a vila revoltada arma a milícia para um lado que ela não odeia e que é inimigo de algum lado que ela odeia:
  - os Insurgentes, quando estão entre esses lados (`civIns()`: o lado cuja facção é `FACTIONS.modern.insurgentes.slot`, só com `S.N ≥ 3` na Frente atual);
  - senão, o que menos matou gente dela (`D.hits[bi]`); no empate, o de menor índice;
  - se odeia todos, nenhum. Com 2 lados dá exatamente a regra de antes.
- **`civFight`** (a vila evacua): verdadeiro quando **dois lados inimigos** estão perto da borda (antes: os dois lados).
- **`civLook`**: `obs` e `c.sn` têm um lugar por lado.
- **Kit da milícia por lado**: `civKit(t)` copia `CIV.mil.kit[era]` com `side` = facção de t (antes fixo 0). `civRecruit` usa o kit do lado e, se `INF[era][fac]` ainda não existe (Insurgentes antes da P4), cai no primeiro kit de `INF[era][0]` como id.
- **`civState`** (estado do general/MCP): `hate` continua `us`/`them`/`both` (`both` = nós e mais alguém); novo `against` (lista: `'us'` ou nome do lado) e `bySide` (mortos por lado). `enemyKilled` soma todos os inimigos.
- **Revisão (`anaReport`, parte civ)**: `civ.side` tem um item por lado (pelo tamanho de `R.tickets` ou pelo maior `s` dos eventos `cv`, no mínimo 2).

## O que NÃO foi testado

- Nenhum teste rodou (`tests/civ.js`, `tests/civ-war.js`, `tests/civ-online.js` nem a regressão com N = 2).
- Nenhuma partida de 3 lados (ela depende de P1/P2/P4 para existir).
- A rede: a mensagem `civ` k 2 leva a máscara de ódio com o bit 4; a validação do servidor (`e[3] < 4`) é da P0/P5. Se ela não foi alargada, o convidado não fica sabendo de vila que odeia os Insurgentes.

## Riscos

- Sem a P0 (`SIDES`, `foes`, `S.N`) a página quebra no primeiro `civLook` (inclusive na demonstração). Este PR só vai junto ou depois da P0.
- `civTake` ainda usa `ds: t ? 1 : -1` para o esquadrão de milícia (é da P6a, com `dsOf`). Para o lado 2 vale 1; a milícia só guarda a vila, então o efeito deve ser pequeno.
- `civRevolt` a favor dos Insurgentes pode dar muita milícia a eles numa partida com muito fogo sobre vilas (uma esquadra a cada 150 s por vila revoltada). Ajustar no torneio (P10).
- `civState.hate === 'them'` não diz qual inimigo; quem lê o MCP deve usar `against`.

## Como testar depois

1. Regressão com 2 lados (deve dar igual a antes): `node tests/civ.js`, `node tests/civ-war.js`, `node tests/civ-online.js`.
2. Com 3 lados (depois de P0, P1, P2 e P4 no main), numa partida solo da Frente atual, no console:
   - `civD().n.length === 3` e `S.civs[0].sn.length === 3` depois de alguns segundos;
   - matar 5 civis de uma vila com fogo da Rússia (`civToll(c, { team: 1 })` cinco vezes em civis da mesma vila): `civD().foe[bi] === 2`, e `civArms(bi) === 2` (Insurgentes); no diário dos EUA e dos Insurgentes: "se voltou contra Rússia";
   - repetir com fogo insurgente na mesma vila: `foe[bi] === 6`, `civArms(bi) === 0` (EUA);
   - `civState(0).towns` mostra `against` com os nomes.
3. Fogo indireto da IA insurgente perto de civis vistos: o diário dela deve dizer "Fogo suspenso" (`roeNote`), como os outros lados.
4. Online (anfitrião + convidado, 3 lados): uma vila que se volta contra os Insurgentes aparece no feed do convidado.
