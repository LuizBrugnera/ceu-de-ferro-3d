# cf-insurg-antiaerea: antiaérea antiga dos Insurgentes (o que ainda falta testar)

São armas `kpv`, `shil`, `s5` e `s8` e veículos `zpu4`, `zpu2`, `dshkAA`, `zuTruck`, `tecS5`, `tecS8` e `shilka`, só tiros e foguetes sem guia. A lista `aaOld` gira no `addUnit` do lado sem AA.

Testado (cf-pol-testes-a, no harness, numa partida de 3 lados esvaziada; scripts em `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/content.js` e `aa-dbg.js`):
- **Montagem**: os 7 veículos novos montam no lado 2.
- **Rotação**: 9 `addUnit('aa')` seguidos no lado 2 dão `tecS5, zuTruck, dshkAA, tecS8, zpu2, shilka, tecZu, zpu4, tecS5`. A Shilka sai como `lav`, as outras como `car`.
- **`server.js`**: conhece os ids. O `tests/gen-loads.js` não muda nada nele.
- **Calibre** (`tests/mint.js`): o `calOf` dá 14,5 ao KPV, 23 ao ZU-23 e ao AZP-23, e 0 aos casulos S-5/S-8 (não abatem míssil).
- **IA atirando**: uma técnica com ZU-23 (`tecZu`) abriu fogo num Mi-28 que passou: 78 tiros em uns 4 s.

## O que ainda não foi testado
- **O helicóptero parado de propósito**: um AH-64 parado no ar a 600 m e 120 m de altura, preso no lugar pelo script, nunca foi detectado (`grade` 0 por 20 s). Nenhuma das 8 antiaéreas atirou nele. Não deu tempo de achar se é o alvo artificial (preso pelo script, sem IA) ou a percepção.
  - Repetir com um helicóptero da IA voando baixo: `aa-dbg.js`, em `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/`.
- **Nada visual**: os modelos (canos, casulos, corpos) nunca foram vistos. O pack mapeia as picapes para `pickup` e o caminhão para `trk_m939`.
- **Balanço**: alcance e dano dos foguetes; se as rajadas de foguete esgotam rápido (`ammo`) e se reabastecem; avião alto (a IA de `car` só olha `lowPlane`); menos tiro à noite e na chuva.
- **Peças rebocadas** (spd 5) dirigidas pelo jogador e pelo general; a Shilka como `lav` com o assento `gunnerM`.
- **A rotação na economia e no general** (custo `eco.aa`), no esconderijo, nas vilas e nos comboios.
- **Online** e o hangar dos 3 lados.
- **Suítes**: `tests/damage.js` e `tests/frame-budget.js`.
