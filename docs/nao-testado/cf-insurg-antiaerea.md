# cf-insurg-antiaerea: antiaérea antiga dos Insurgentes (só tiros e foguetes sem guia)

**O que mudou** (`Céu de Ferro 3D.html`, `server.js`):
- Armas novas em `ARMS` (bloco dos Insurgentes): `kpv` (14,5 mm), `shil` (AZP-23 de 23 mm), `s5` e `s8` (casulos de foguetes S-5 57 mm / S-8 80 mm **não guiados**, modelados como projéteis `gun` rápidos, pesados e espalhados, em rajadas). Sem radar, sem trava, sem míssil.
- Veículos novos em `TRNS` (mesmo molde da `tecZu`, `aaGun: 1`): `zpu4`, `zpu2` (rebocadas, velocidade 5), `dshkAA` (reparo antiaéreo), `zuTruck` (ZU-23-2 num caminhão), `tecS5`, `tecS8` (picapes com casulos), `shilka` (ZSU-23-4 capturada, `lav`, só mira óptica).
- `FACTIONS.modern.insurgentes`: `veh.aaOld`, `aaOld` na lista do lado; `addUnit` de um `aa` do lado sem AA agora gira pela lista (`S.aaOldN`) em vez de sempre a `tecZu` (base, coluna, general).
- Visual: `TLOOK`, canos/tubos no `buildTrn`, mapa do pack (`PACK.trn`); `server.js` conhece os ids novos.
- A mira da IA é a que já existia para carros/lav (`gunner`/`lowPlane`/`known`: visão, pior à noite e no mau tempo). Jogador e MCP usam como qualquer `trn` do lado 2.

**Testado (só fumaça):** `node --check` do script; servidor sobe e entrega a página (200); na página, os 7 ids existem em `TRNS`, sem erro novo no console.

**Não testado:**
- Nada visual: os modelos (canos, casulos, corpos) nunca foram vistos; o pack mapeia as picapes para `pickup` e o caminhão para `trk_m939`; as peças rebocadas e o reparo usam corpo de carro pequeno.
- IA atirando em avião/helicóptero com cada arma; alcance e dano dos foguetes (balanço); se as rajadas de foguete esgotam rápido demais (`ammo`) e se reabastecem.
- Peças rebocadas (spd 5) dirigidas pelo jogador e pelo general; o `shilka` como `lav` (assento `gunnerM`, `aiLav` só atira em aeronave baixa dentro de `GAI.tank.mg`).
- Rotação `aaOld` na economia/general (custo `eco.aa`), cobertura do esconderijo, vilas e comboios; emboscada a helicóptero baixo (depende da tarefa de guerrilha).
- Online (servidor/hangar com ids novos); `tests/gen-loads.js`; hangar dos 3 lados.

**Riscos:**
- `addUnit` mudou o caso `kind === 'aa'` do lado sem AA: agora pode criar `lav` (shilka) em vez de só `car`; código que assume `car` num caminho de AA de base/coluna pode quebrar.
- Foguetes como projéteis de arma de fogo: sem fumaça/rastro de foguete; podem ficar fracos ou fortes demais.
- IA de `car` só olha `lowPlane` (alcance/altura baixos): AA de carro pode nunca engajar alto.

**Como testar depois:**
- Partida de 3 lados (Insurgentes, IA): ver que a base/colunas põem AA variada; jatos e helicópteros baixos sendo engajados; à noite/chuva, menos.
- Hangar: cada id novo, dirigir, atirar em avião de treino.
- Suítes: `node tests/gen-loads.js`, `node tests/damage.js`, `node tests/frame-budget.js`, e uma partida IA × IA com `shilka` e `tecS8`.
