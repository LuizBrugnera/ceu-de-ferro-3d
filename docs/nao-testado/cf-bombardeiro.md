# Bombardeiro estratégico e as armas dos Insurgentes (cf-bombardeiro): testado em parte

O que é (no main): quatro aviões em `PLANES` (B-2 Spirit e Tu-160 hoje, He 177 e B-17G em 1944; `strat: 1`, bombas no compartimento, `mega` chama `stkFx`), `ERAS side.bomber`, os tipos de economia `strat`, `svbied` e `shahed` (vaga própria do QG, `scap`, `fac`), a seção `STK` (ordem `bomb` do general, `stkLaunch`, `stkFly`, o caminhão-bomba `stkSvb`, a salva de drones, `stkFx`, `stkAI`, `stkEcoAI`), o botão "Bombardeio" na Visão de General, `gask stk`, `strategic_strike`/`get_strikes` no `mcp-general.js` e os modelos no `server.js`.

## Testado (cf-pol-testes-a)

- Os 4 modelos no renderizador do carrossel do hangar (`preview(buildPlane(id))`, Chromium sem tela): montam e aparecem inteiros (asa voadora do B-2; asa em flecha do Tu-160; He 177 e B-17 com hélices). Imagem `/home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/web/bombers.png`.
- Partida IA × IA moderna (harness, mapa v5, economia ligada): `genCmd(0, { c: 'bomb', k: 'strat', x, z })` com um B-2 na reserva: aceito; o B-2 sai a 3,4 km de altura a 18,9 km do alvo, alinha (`run` aos 11 s), solta as 8 bombas e vira (`out` aos 39 s, `home` aos 42 s); foi abatido na volta (47 s, `res: lost`) pela defesa da base inimiga, como no smoke do autor. As 8 crateras ficaram numa linha de ~770 m, de (−216, −67) a (77, 643) m do alvo: **o tapete não ficou centrado no alvo** (o ponto da linha mais perto dele está a ~170 m, mais que o raio de 135 m da bomba). Não investiguei a causa (suspeitas: o ponto de soltura de `stkFly` conta só `vh × tempo de queda`, sem o arrasto da bomba, o vento ou a curva da corrida; e o espaço entre bombas saiu bem maior que `gap` 40 m).
- Caminhão-bomba (`STK.any = 1`, lado 0, posto a 60 m do alvo): foi ao alvo e explodiu a 17 m dele (cratera a 20 m), `res: ok`.
- Recusas: `make` de 3 bombardeiros pelo lado 1: `scap`; `make` de `svbied` pela Rússia: `fac`; a ordem `bomb` de `svbied`/`shahed` pela Rússia: `fac`.
- `stkFx` chamado a 140 m de um soldado na partida do navegador: a nuvem aparece (`crater.png`, vista pela janela de uma casa) e entra em `S.craters` e `S.smokes`.
- Página: abre sem erro novo; o `dsOf is not defined` citado na doc não aparece mais.

## Não testado

- Por que o tapete do B-2 caiu fora do alvo (acima), e a nuvem e a bola de fogo na tela; He 177, Tu-160 e B-17 voando a missão; a salva de drones (`shahed`).
- Os Insurgentes de verdade: pelo harness, `watch('modern', { n: 3 })` no mapa v5 ainda dá 2 lados (`S.fac` [0, 1]), então as armas deles só foram pedidas pelo `STK.any`.
- Voar com um bombardeiro como jogador (B solta uma bomba a cada 0,3 s), a ficha do hangar, a física a 4 km.
- Online (convidado vendo o bombardeiro, as bombas e as crateras; troca de anfitrião), MCP contra um anfitrião, o botão "Bombardeio" da Visão de General.
- A IA do general numa partida longa (ataca demais ou de menos; custo do `stkAI`), e o balanço (bomba do B-2: 1150 de dano em 135 m).
- Suítes: `gen-loads.js`, `mcp-general.js`, `eco*.js`, `damage.js`, `drone.js` (a fila de memória da máquina não deixou).

## Como testar

- No console do navegador (solo ou anfitrião): `S.eco.d[0].res.strat = ['hq']; genCmd(0, {c: 'bomb', k: 'strat', x: S.base[1].x - 2500, z: S.base[1].z}, 'sys')` e seguir o avião; o mesmo em 1944 e com o Tu-160 (lado 1); `STK.any = 1` para `svbied` e `shahed`.
- Partida IA × IA de 20 min com economia: no diário "Ataque estratégico", "Bombardeiro: bombas lançadas", "de volta à base".
- `node tests/gen-loads.js`, `node tests/mcp-general.js`, `node tests/eco.js`, `node tests/damage.js`, `node tests/drone.js`.
