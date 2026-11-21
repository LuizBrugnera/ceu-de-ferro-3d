# cf-3l-p9-analise: análise, revisão pós-batalha e torneios com N lados (P9) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3.js`: o cabeçalho da análise de uma partida de 3 lados diz `n` 3 e traz 3 facções; `anaReport` dá `ns` 3 e a curva `[t, 3 tíquetes, 3 pontos]`; `tools/balance.js --torneio 1 --lados 3` joga uma partida de 3 lados no mapa 9.
- No navegador: uma partida IA × IA de 3 lados com os Insurgentes eliminados por tíquetes; a revisão mostra a colocação (1º EUA, 2º Rússia, 3º Insurgentes "eliminado aos 0:10 (sem tíquetes)"), três linhas no gráfico com a dos Insurgentes em ocre e o traço vertical na eliminação, e as tabelas por lado com 3 linhas.
- `tests/ana-online.js` passa inteiro (falhava em 3 pontos no `main`).

**Consertos (cf-pol-testes-a):**
- **A análise online perdia lotes inteiros:** o servidor recusa um lote com um evento de tipo desconhecido, e o `cb` do cérebro não estava na lista dele; além disso, eventos do cérebro cujos dados traziam um `k` próprio (`pel-forma` com o tipo do pelotão `def`, uma cobertura `veiculo`) saíam com esse tipo. Numa partida online, todo lote desses era perdido, e com ele o fim e o resumo ("Partidas anteriores" pelo servidor ficava sem a partida). Agora o servidor aceita `cb`, a página tem a mesma lista (`ANA.kinds`), `anaPush` devolve ao evento do cérebro o tipo `cb` (o outro fica em `kd`) e `anaFlush` não manda o que o servidor recusaria. A origem do `k` sobrescrito está na seção CEREBRO (`brainEv`, `medCb`, `flCb`: `Object.assign({ k: 'cb', ... }, d)`), que outra frente está reescrevendo. Teste: `tests/ana-online.js` (a lista da página igual à do servidor; um evento `pel-forma` sai como `cb`; a partida do anfitrião real chega ao disco com fim e resumo).
- **`--lados 3` sem `--mapv` parava na hora** ("a página não montou 3 lados"): o torneio usava o mapa 4, sem a terceira base. Agora usa o mapa 9 quando são 3 lados.

## O que falta

- Um torneio de verdade: `node tools/balance.js --torneio 6 --lados 3 --min 10 --nobudget` (6 trios, "Colocação por lado", "Lados eliminados por partida", alerta a 45%). Uma partida de 5 min de 3 lados com economia passou de 280 s de máquina e foi cortada (a máquina estava dividida).
- A eliminação por base na revisão (`el` com `why: 'base'`); "Partidas anteriores" e a mesma partida pelo servidor (`GET /ana/m/...`).
- MCP: `get_match_report` com `CEU_SIDE=2` durante e depois da partida.
- Leitores de fora que esperam a curva de 5 colunas (com 3 lados são 7).
