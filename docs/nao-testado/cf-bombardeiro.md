# Bombardeiro estratégico (e as armas dos Insurgentes): o que mudou e o que não foi testado

Tarefa `cf-bombardeiro`. Pedido do capitão: "adicione um bombardeiro, B2 Spirit e os seus relativos para outros times, deve ser bem caro mas a explosão ser bem massiva"; depois: "pense para os insurgentes também".
Pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado em partida**.

## O que mudou

`Céu de Ferro 3D.html`:

- **Quatro aviões novos em `PLANES`** (com linha em `PFM`), modelos procedurais como os outros:
  - B-2 Spirit (Azul): asa voadora, furtivo (`stealth: .35`), 8 × GBU-31 (2000 lb).
  - Tu-160 Blackjack (Vermelha): rápido, com pós-combustão, 24 × FAB-500.
  - He 177 Greif (Luftwaffe): 6 × SC 1000.
  - B-17G Flying Fortress (Aliados): 10 × 1000 lb.
  - Os dois de 1944 têm torres em volta (`rearGun: 2`).
  - Todos levam as bombas dentro (`bay`, nada pendurado) e têm `strat: 1`.
  - Bomba com `mega: 1` chama `stkFx` ao explodir. `gap` é a distância entre as bombas do tapete.
  - `mdl.nac` desenha mais naceles e hélices (4 motores).
- **Em 1944 os lados não são Azul/Vermelha.** São Luftwaffe e Aliados. Por isso o B-17 ficou com os Aliados e o He 177 (o único bombardeiro pesado alemão) com a Luftwaffe. O Pe-8 da especificação não entrou.
- **`ERAS` ganhou `side.bomber`.**
- **Economia** (`ECO.unit`): `strat` (bombardeiro, 450/350, 240 s), `svbied` (180/260, 150 s) e `shahed` (240/160, 150 s).
  - Categoria `strat`: uma vaga própria do QG (`ECO.hq.strat`), que não atrasa os caças.
  - `ecoKinds(t)` só mostra a um lado as armas que ele tem (`stkHas`).
  - `make` recusa `fac` (o lado não tem) e `scap` (mais de 2 da arma entre reserva, fila e em missão).
- **Seção nova `STK`** (logo antes de `function boot()`):
  - Comando do general `bomb { k, x z | id | pi, a, why }`, domínio `sup`. A arma sai da reserva também na abertura.
  - `stkLaunch`:
    - o bombardeiro sai de 2,5 km atrás da base, já a `balt − 800` m;
    - o caminhão sai na entrada da estrada mais perto do alvo;
    - os 5 drones saem do trilho da base (delta `owa` com `o.stk`).
  - `stkFly` (dentro do `aiPlane`): estados `in → run → out → home`, e `away` para dar a volta. Mantém a trilha no alvo, solta o tapete centrado e arremete se sair da linha (2 passagens). Numa ordem da IA, segura e arremete com amigos ou civis sob o tapete (`ffDanger`, `roeHeld`). Pousa e volta à reserva (`ecoBack`).
  - Caminhão (`stkSvb`, por cima de `tripAI` e `AI.truck`): viagem tática pela rede e depois direto ao alvo. Explode no alvo (22 m), ou com um veículo ou 3 soldados inimigos a 16 m. Destruído antes, explode em 60% das vezes (`killUnit`).
  - Drones (por cima de `stepDelta` e `droneEnd`): sem a espera em órbita, cada um mergulha no seu ponto e soma a explosão grande.
  - `stkFx`: cratera (desenhada em `stkScene`, até 40), bola de fogo, nuvem que corta a visão por 22 s, tremor e estrondo de longe.
  - IA:
    - `stkAI`, chamado depois do `cmdReq`, a cada 30 s e a partir de 5 min, só com o que está na reserva.
    - Alvo: instalação, base de suprimento ou concentração de veículos conhecida, com valor mínimo de 6.
    - Testa 3 rumos de entrada e recusa onde há amigos ou civis sob o tapete.
    - `stkEcoAI` faz um quando o estoque passa do piso por metade do preço.
  - Caças: dão prioridade a bombardeiro inimigo (`STK.hunt`) e escoltam o seu.
  - O radar da antiaérea de míssil (`pickAir`) e o radar do caça (`MSL.pick`) só pegam o B-2 a 35% do alcance.
  - Visão de general: aba Campanha, botão "Bombardeio" (clique no alvo).
  - `genState.stk` e a pergunta `gask stk` (`stkView`).
- **Insurgentes** (não estão no `main`; a facção está no PR do `cf-insurgentes-conteudo`):
  - As armas deles ficam em `STK.fac.insurgentes = ['svbied', 'shahed']`.
  - O lado é achado em tempo de execução (`stkFac`): pelo `side.fac`/`side.id`, ou pela entrada de `FACTIONS[era]` cujo `side` é o lado. Se `FACTIONS[era][fac].strike` existir, vale ele.
  - Atenção: no PR deles, `FACTIONS...eco.bomber` é o **homem-bomba**. Por isso aqui o bombardeiro é `strat`, e o caminhão é `svbied` (o carro-bomba deles é `vbied`).
  - `STK.any = 1` dá todas as armas a todos os lados, para testar antes de existir o terceiro lado.

`server.js`:
- Os 4 aviões nas listas `MODELS` (metade de cada lado).
- `stk` em `GASK`.

`mcp-general.js` (2.2.0):
- `strategic_strike` e `get_strikes`.
- Os tipos `strat`, `svbied` e `shahed` em `UNITS`, no fim, na ordem do `ECO.unit`: o índice das instalações no `ecs` mudou.
- Os textos novos em `PT`.

`README.md` e `MCP.md`: seção "Bombardeio estratégico".

## Ajustes na junção com o `main` (os 3 lados entraram enquanto eu trabalhava)

- O lado dos Insurgentes já existe no `main`: `ERAS.modern.sides[2]` com `fac: 'insurgentes'` e `air: false`. Por isso o `stkKinds` acha o `STK.fac.insurgentes` pelo `side.fac`.
- Na mesma `ERAS`, EUA e Rússia ganharam `bomber`.
- Verificação de lado pela regra nova:
  - `isSide(t)` no lugar de `t === 0 || t === 1`;
  - inimigo por `foeSide(t, ...)`;
  - `spotted(o, t)` (visão por lado);
  - posições que o lado viu por `sX`/`sZ` (P3).
- `droneRail(team)` do `main` mirava `S.base[1 - team]`, que não existe para o lado 2. Agora mira `foeBase(team)` (o mesmo erro valia para os drones kamikaze da IA insurgente do P7).
- `server.js`:
  - os bombardeiros vão para `MSIDE`, que agora diz o lado de cada modelo;
  - nas listas `MODELS` eles entram no fim, para nenhum índice antigo mudar.
- `mcp-general.js` 2.3.0: `UNITS` com `strat`, `svbied`, `shahed` antes das instalações. O `ecoI` do `main` põe os tipos de recuperação depois das instalações.
- A seção STK foi dividida em duas:
  - a parte de simulação ficou antes do marcador `/* ---------- 3D scene`, como o `main` pede (#75);
  - a parte de tela (crateras e botão da visão de general) ficou antes de `function boot()`.
- **Problema que já existe no `main` (não é deste PR).** A página dá `Uncaught ReferenceError: dsOf is not defined` ao carregar. O `dsOf` é chamado no `spawnPlayer` e no `addUnit` e não é definido em lugar nenhum do `origin/main` (conferido no arquivo do `main`). Com isso a página carrega com erro, e o meu smoke depois da junção não conseguiu rodar a simulação. Outra sessão no mesmo Chrome mostrou o mesmo erro numa cópia sua.

## O que rodou (smoke)

- `node --check` na página, no `server.js` e no `mcp-general.js`: ok.
- Antes da junção com o `main`: servidor em 127.0.0.1, página no Chrome sem erro novo no console (só o 404 que já existia), e o `buildPlane` dos 4 modelos montou.
- Depois da junção: `node --check` nos três arquivos ok, servidor sobe e entrega a página (200). No console aparece o `dsOf is not defined` do `main` (acima) e o 404. Os scripts avulsos de smoke não rodam mais: o `main` tem código de simulação depois do marcador da cena 3D (`dsOf`, `lsRoutes`).
- Antes da junção, um script avulso, fora do repo (`/home/luiz/secondmate/data/cf-bombardeiro/smoke/`), carregou a simulação.
  - Ele carregou como o `tests/harness.js`, mais a seção STK, e criou vazias as funções que ficam depois da cena 3D (`mmMan`, `mmW`).
  - Mapa v5, economia ligada, logística desligada.
  - B-2 contra um ponto a 2,5 km da base inimiga: subiu, alinhou e soltou as 8 bombas; as crateras ficaram de 30 m antes a 320 m depois do alvo, em linha. Na volta foi abatido pela defesa da base inimiga. Isso foi antes de mudar o `out` para 3 s; numa versão anterior ele arremeteu "fora da linha".
  - Caminhão posto a 60 m do alvo: foi direto e explodiu a 22 m.
  - Salva de drones: os 5 voaram ao alvo; um foi derrubado pela antiaérea no caminho (não esperei chegarem).
  - `stkAI` com 4 tanques inimigos conhecidos juntos mandou o bombardeiro ("concentração de veículos (valor 24)").
  - `stkEcoAI` com estoque cheio pediu um.
  - `make` de 3 bombardeiros: `scap`. `make` de `svbied` pelo lado Vermelho: `fac`.

## O que NÃO foi testado

- Nenhuma suíte, nenhuma partida inteira, nada online, nada no navegador além de abrir a página.
  - O Chrome é compartilhado: outra sessão tomou a aba e o meu console rodou um `newState` na página dela, na porta 8797. Parei de usar o navegador.
- Os modelos 3D nunca foram vistos, nem a cratera (`stkScene`), a nuvem, a bola de fogo, o tremor ou o som.
- Ver a ficha do hangar dos 4 aviões e voar com eles como jogador (B solta uma bomba a cada 0,3 s; não há mira de bombardeio). A física deles a 4 km de altura: o B-2 afundava perto do estol antes do ajuste de massa e empuxo.
- He 177, B-17 e Tu-160 voando a missão inteira: só o B-2 rodou.
- Online:
  - convidado vendo o bombardeiro (linha `ai`), as bombas (`aiord`) e as crateras;
  - o caminhão e os drones (explosão grande só no anfitrião);
  - a troca de anfitrião com um bombardeiro no ar (o novo anfitrião o manda para casa).
- MCP: `strategic_strike` e `get_strikes` contra um anfitrião de verdade; o `get_state` com os índices novos de `ecs`.
- Visão de general: o botão "Bombardeio", o modo de clique e a dica (`GORT.bomb`).
- A IA do general numa partida longa: se ataca demais ou de menos, e o custo de CPU do `stkAI` (laço de concentrações O(n²) nos conhecidos).
- Os Insurgentes de verdade: depende do trabalho dos 3 lados (`S.fac[t]` e `S.E.sides` com o lado deles).
- Balanço: custos, raio e dano. Bomba do B-2 com 1150 de dano em 135 m mata tanque a cerca de 110 m.

## Riscos

- **Índices do `ecs`.** `ECO.unit` ganhou 3 tipos no fim, então o índice das instalações (`ecoI`) mudou.
  - Página e `mcp-general.js` foram juntos.
  - Um `mcp-general.js` antigo com a página nova lê errado as instalações na fila.
  - Um convidado com página antiga lê errado o que o anfitrião novo manda.
- **`ecoView.hq.slots.strat`.** O laço genérico do `ecoAI` agora pode fazer arma estratégica quando há falta registrada (`miss`). Isso acontece quando uma ordem de bombardeio pega a reserva vazia.
- **Fogo amigo.**
  - Ordem de pessoa ou de MCP **não** é segurada por amigos ou civis sob as bombas (a especificação aplica a regra só à IA).
  - O caminhão só segura em ordem da IA.
  - A nuvem de poeira (`S.smokes`) corta a visão de todos por 22 s, e o tapete do Tu-160 cria 24 nuvens.
- **Mapa.** A borda tem relevo alto. O bombardeiro olha o terreno só dentro do mapa (correção feita no smoke). Se o alvo ficar perto da borda, o desvio de rumo (`stkAway`) pode mudar o rumo do tapete.
- **Peças.** `S.parts` tem teto de 900, e o tapete grande pode esgotar as peças de efeito por alguns segundos.
- **Furtivo.** O `stealth` vale só no `pickAir` (antiaérea com míssil) e no `MSL.pick` (radar do caça). Não vale na detecção (`known`/`spot`) nem no canhão radar do Pantsir.
- **Caminhão.** Fora da estrada vai em linha reta (`driveTo`) e pode encalhar em rio ou encosta. Não há prazo: ele fica parado até ser destruído.

## Como testar depois

- Smoke rápido sem navegador:
  - `node /home/luiz/secondmate/data/cf-bombardeiro/smoke/run.js "<caminho>/Céu de Ferro 3D.html" strat`
  - troque `strat` por `svbied` ou `shahed`; `svbied near` põe o caminhão perto do alvo;
  - `node .../smoke/ai.js "<página>"` testa a decisão da IA.
- No navegador (solo ou anfitrião), no console:
  - `S.eco.d[0].res.strat = ['hq']; genCmd(0, {c: 'bomb', k: 'strat', x: S.base[1].x - 2500, z: S.base[1].z}, 'sys')`
  - siga o avião com a câmera e veja as crateras e a nuvem;
  - repita em 1944 (He 177 e B-17) e com o Tu-160 (lado 1).
- No console: `STK.any = 1` e `S.eco.d[0].res.svbied = ['hq']`, depois `genCmd(0, {c: 'bomb', k: 'svbied', x, z}, 'sys')`. Faça o mesmo com `shahed`.
- No hangar: abrir a ficha de cada bombardeiro, decolar, soltar o tapete segurando B e voltar à pista para rearmar.
- Partida IA × IA de 20 min com economia: ver no diário "Ataque estratégico", "Bombardeiro: bombas lançadas" e "de volta à base", e se o general deixa de atacar com amigos perto do alvo.
- Online, com anfitrião e convidado: o convidado vê o bombardeiro, as bombas e as crateras, e a explosão do caminhão e dos drones (esperado: só o dano).
- MCP: `produce_unit strat`, esperar 4 min, `strategic_strike` com `site_id` e depois `get_strikes`.
- Suítes quando voltarem: `node tests/gen-loads.js` (o `server.js` tem os modelos novos), `node tests/mcp-general.js` (os códigos novos em `PT`), `node tests/eco*.js`, `node tests/damage.js`, `node tests/drone.js`.
