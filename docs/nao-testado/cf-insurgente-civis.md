# cf-insurgente-civis: os Insurgentes ganham com civis, e os civis se juntam mais a eles (o que ainda falta testar)

O bloco `ICV` ("the Insurgents and the civilians") cuida de várias coisas:
- a simpatia de cada vila pelos Insurgentes (`S.icv.sym`) e a adesão sozinha;
- as ordens `rcr` (recrutar, 30 s) e `saq` (saquear);
- os recursos por civil recrutado (8 energia + 6 metal) e por civil morto (10 + 6, sem tíquetes);
- a revolta a cada 75 s;
- as táticas `rcv` e `ter` do general;
- a aba Defesa, `genState(t).icv`, a revisão ("Civis e Insurgentes") e as ferramentas `recruit_civilians`/`loot_town` do MCP.

Os números ficam em `ICV`.

Testado (cf-pol-testes-a). Nos 60 s da partida de 3 lados (semente 7, mapa 9, economia; `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/m3.js`):
- **Simpatia**: calculada para as 31 vilas, de −22% a 47%.
- **Memória**: a vila cujos civis um lado regular matou ficou com a memória a favor dos Insurgentes (1 de 1, a checagem 3 do `tests/icv.js`).
- **Recursos**: o lado insurgente ganhou 16 de energia e 12 de metal pelo ICV, mas com `rec` e `join` em 0. A origem (provavelmente 2 recrutados por `mil` ou revolta, pelo embrulho em `civRecruit`) não foi conferida.
- **Tática do general**: `rcv` (Recrutar nas vilas) entrou entre as 5 ativas, com o motivo "4 vila(s) simpática(s); a melhor para recrutar: a aldeia (simpatia 20%, 3 civis)".
- **Sem erro**: `S.grlE` vazio, nenhum aviso.

A ordem `rcr` sem soldado insurgente na vila é recusada com `rcr0` (`/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/icv-unit.js`). O resto desse exercício não coube no tempo da trava.

## O que ainda não foi testado
- **`node tests/icv.js`** (600 s de 3 lados, mais o pedágio): não rodou. Sob a trava compartilhada, uma partida de 3 lados levou ~4 s de relógio por segundo de jogo, mais do que os 5 min permitidos por corrida. `SECS=300 MIN=3` também não cabe.
- **A adesão sozinha** acontecendo, **o `rcr` completo** (30 s, quantos aceitam), **o `saq`**, **a tática `ter`** e o ROE solto, e **o pedágio** (regular paga, insurgente não paga e ganha). O pedágio está no fim do `tests/icv.js` e no `icv-unit.js`.
- **Regressão de 2 lados**: `tests/civ.js`, `civ-war.js` e `civ-online.js`.
- **Navegador**: a aba Defesa, os botões e a seção da revisão. **MCP**: `recruit_civilians`, `loot_town` e `get_state from_host`. **Online**: o `rcr` pelo convidado.
- **Desempenho** do `icvLook` (vilas × soldados a cada 5 s).

## Riscos (do autor, ainda valem)
- **Vilas esvaziando**: `ICV.join` pode estar forte demais.
- **Milícia insurgente demais**: até 24 por lado.
- **ROE**: a tática `ter` solta o ROE da IA.
- **Revisão**: mostra os tíquetes pagos e depois devolvidos.
- **Diário duplicado** com o `civTake`.
