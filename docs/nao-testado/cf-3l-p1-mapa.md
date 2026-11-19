# cf-3l-p1-mapa: mapa de 3 lados (P1 do plano de 3 lados) — NÃO TESTADO

Pacote P1 do plano `cf-3-lados-plano` (seção 7): o mapa da Frente atual com o terceiro lado (Insurgentes).

## O que mudou

- **Versão do mapa 9** (`MAPV = 9`). A 7 e a 8 já eram das moitas e das estradas de terra, então o mapa de 3 lados virou a 9 (o plano dizia 7).
  - O mapa de 3 lados só é gerado com `genTerrain('modern', mv >= 9, 3)` (`triOf`). Em 2 lados nada muda além do número da versão.
  - A chave do cache de terreno ganha `:3` no mapa de 3 lados.
  - `newState(era, model, { N: 3 })` passa `o.N` para `genTerrain`. **Ninguém passa `N: 3` ainda**: quem liga isso é o P0/P4/P5 (`S.N`, a sala, o hangar).
- **`RN.tri`** (dados novos):
  - base B2 em `P(.67, -.85)`, a vila nova K em `P(.80, -.62)`;
  - estradas novas classe 1 (secundária, retas, sem curvas pré-calculadas): B2–HS2, HS2–K, K–JSE;
  - as trilhas S4–HS1 e HS1–HS2 sobem para classe 1;
  - estradas principais com dono nas pontas, depois do eixo central: `T.routes[3]` = R_EI (B2→HS2→HS1→S4→B0, `ends [0, 2]`) e `T.routes[4]` = R_RI (B2→HS2→K→JSE→S1→B1, `ends [1, 2]`);
  - 17 pontos (5 por lado + 2 neutros) e as ligações novas da seção 5.3; tíquetes × 16/12 (`RN.tk.modern3`).
- **`R.ends`** em toda estrada principal (`[lado em s = len, lado em s = 0]`; as de hoje são `[0, 1]`).
- **Ajudantes** (perto de `endS`): `dsOf`, `endS` (agora por `ends`), `foeOn`, `myRoutes`. `lineS`, `cqLine` e `cqNext` usam `dsOf`/`foeOn` (com 2 lados dão o mesmo resultado de antes).
- `axisNet` virou `chainRoute` + `axisSw` (mesmo resultado); `triNet` faz as duas estradas novas. `T.mid` das estradas novas é o ponto à mesma distância das duas pontas.
- **Base B2**: leiaute `BASE.ins` (galpões, oficina, depósito, casamata, mastro, sem hangares grandes), ids 220–225. Terreno "base" (tipo 8) e aplainamento valem igual (`bd` agora olha todas as bases).
- **Cidade-sede insurgente** = aldeia HS2 (`seat: 2`), com a grade ao longo da estrada de B2 e os lotes de `CITY.plan.seat`. `citySeats` não cria sede para o lado 2. A vila K vira um lugar construído.
- **Pontos** (`ptsNet`): a base fica na ponta de cada estrada que tem (`rs` nulo nas outras); `'end'` = a base do lado 1 (não mais o último ponto).
- **Obras pré-cavadas** (`fortInit`): cada lado cava nas estradas em que tem uma ponta, com o sentido `dsOf`.
- **Jazidas**: `ECO.deps2`, 4 jazidas em volta de B2 (`half: 2`).
- `fortTerrain`, `coverTerrain`, `coverV7` e `cityPlan` olham todas as bases para afastar matas, moitas e prédios.

## O que NÃO foi testado

- Nada da suíte de testes rodou (regra do capitão). O harness de testes (`tests/harness.js`) já falha ao carregar na main de hoje (`aarShow`, `m5Lg`, `mmMan` ficam depois do marcador `3D scene`), sem relação com esta mudança.
- Só rodei, fora do repositório: `genTerrain('modern', 9, 3)` gera 3 bases, 5 estradas (`ends` certos), sede em HS2 e 17 pontos; `newState(..., { N: 3 })` monta pontos, obras e jazidas. O passo da partida com 3 lados **quebra** em `cqStep` (pares de 2 lados da conquista: P0/P2).
- Não vi o mapa na tela (o navegador headless não abriu a página). Não sei como ficam B2, as estradas retas e a sede HS2 no 3D e no mapa 2D.
- Regressão de 2 lados (Frente de 1944 e Frente atual) não foi medida: pela leitura, os mesmos números (mesma ordem de obras, mesmos `rs`, mesmo `T.mid`), só o `MAPV` sobe para 9.

## Riscos

- `MAPV = 9`: uma página antiga (versão 8) não entra numa sala aberta por uma página nova e vice-versa (erro `map`). É o comportamento normal de cada versão nova.
- As estradas novas são retas (sem curvas pré-calculadas) e podem cruzar morro ou mata de um jeito feio; K em `P(.80, -.62)` faz a estrada B2→HS2→K voltar para o leste.
- O código fora do P1 que supõe 3 estradas, `t ? 1 : -1`, `1 - t` ou bases em `s = 0`/`len` (general, colunas, logística: P6a/P6b/P6c) vai usar as estradas 3 e 4 de forma errada até esses pacotes chegarem. `railOf` pode pôr coisas do lado 0/1 nas estradas novas.
- `cqInit` ainda põe `c = 1` num ponto do lado 2 (barra com sinal: P2).
- Ids 220–225 da base B2: conferir que nada mais usa essa faixa.

## Como testar depois

1. Mapa: `node -e` carregando a página (ou o harness consertado) e `genTerrain('modern', 9, 3)`: conferir `T.bases.length === 3`, `T.routes.map(r => r.ends)` = `[0,1] [0,1] [0,1] [0,2] [1,2]`, `T.burgs.find(b => b.seat === 2)` em HS2, `T.mid` das estradas 3 e 4 perto do meio.
2. Regressão de 2 lados: `bash tests/all.sh` (ou os testes de mapa: `tests/roads-ops.js`, `tests/roads-net.js`, `tests/cover*.js`, `tests/city*.js`, `tests/capture.js`) com `MAPV=9`; tudo igual ao `MAPV=8`.
3. Partida de 3 lados (depois do P0 e do P2): `newState('modern', <modelo>, { N: 3 })` (ou a sala de 3 lados) e rodar 300 s sem exceção nem NaN; ver os 17 pontos na faixa e no mapa tático.
4. Na tela: abrir a Frente atual com 3 lados, olhar B2 (sem pista), as estradas B2–HS2–K–JSE e HS1–S4 no 3D e no mapa 2D, e a sede HS2 com os lotes.
5. Jazidas: com a economia ligada, `S.eco.dep.filter(d => d.half === 2).length === 4`, todas em chão plano e seco.
