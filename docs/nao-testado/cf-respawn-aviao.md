# cf-respawn-aviao: abatido no ar, só voltava quando o destroço caía no chão

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- `tests/respawn-air.js`: passa inteiro sobre o main de hoje. O "nada roda" de antes (o `ReferenceError` de `dsOf`/`myRoutes` depois do merge de 2026-11-19) já não existe.
- **Continua sem teste:** a câmera e o HUD na troca para a aeronave nova com o destroço ainda caindo, no navegador; as suítes online com dois clientes.

**Causa:** em `step`, a contagem de volta do jogador só chamava `spawnPlayer()` quando `P.gone || P.man`. Um avião ou helicóptero abatido fica `dead` na hora (a morte, o tíquete, `S.cq.st.d`, `playerDown` e `Net.down` já eram ali, em `lose`/`heliLost`), mas só fica `gone` quando o destroço bate no chão (`stepPlane`, ramo `p.dead`). Enquanto caía, a contagem voltava a 0,3 s e esperava. Abatido a 600 m, o F-22 voltava em 9 s em vez de 3; o Apache a 250 m, em 5,8 s. Valia também para outra aeronave escolhida no painel (H, "onde entrar"): a escolha ficava esperando o destroço.

**O que mudou** (`Céu de Ferro 3D.html`):
- `wreckFall(p, dt)`: o ramo de queda de `stepPlane` virou uma função própria, sem mudança de física. O destroço cai sozinho, solta fumaça e, ao bater num objeto ou no chão, estoura e some (`hitObj` com `OBJD.crash` só na cópia do dono, `!p.net`).
- `step`: acabada a contagem (e sem espera de modelo nem de rádio, e com a economia liberando), o jogador entra na próxima aeronave mesmo com o destroço ainda no ar. O destroço deixa de ser do jogador (`P.me = 0`) e segue em `S.planes` até cair.
- Online, `Net.fall(g)`: quando o dono de um destroço já está em outra aeronave (`state`/`hstate` de uma nova) ou trocou de classe (`swap`), o fantasma abatido continua caindo na cópia de cada um (`g.fall`, `stepGhost` chama `wreckFall`) em vez de sumir no ar (antes `g.gone = true`) ou explodir no ar (antes, no `swap`).
- `tests/respawn-air.js`: a regressão. `tests/README.md`: a linha dela.

**Testado:**
- `node tests/respawn-air.js`: 45 ok (192 s). Contra a página de antes, 27 falhas: avião volta em 9,0 s, helicóptero em 5,8 s, e online o fantasma some no ar.
- `node tests/heli.js` (57 ok) e `node tests/damage.js` (58 ok).

**Não testado:**
- Depois do merge com o `main` de 2026-11-19 (a82df2b), nada roda: o `main` chama `dsOf` e `myRoutes`, que não estão definidos em lugar nenhum da página (`ReferenceError` em `newState → fortInit → lineS` e em `spawnPlayer`). Todas as suítes param no carregamento, com ou sem esta mudança, e no navegador uma partida não deve abrir. Os números acima são do branch antes do merge (base 62bfe42). O merge só juntou a linha da contagem: o `cqOut(S.me)` novo do `main` vem primeiro, e depois a volta sem esperar o destroço.
- As suítes online pelo servidor de verdade: no `main` elas já não passam. Com dois clientes, o servidor derruba as duas conexões (código 1006) cerca de 1 s depois do welcome; `node tests/heli-online.js` falha igual com a página de antes. Por isso a parte online de `respawn-air.js` liga anfitrião e convidado no mesmo processo (as mensagens `state`, `hstate`, `swap` e `down` passam de um `Net.rx` ao outro), sem o `server.js`. Vale investigar à parte.
- Nenhuma outra suíte (`loadout*.js`, `soak.js`, `online.js`, `heli-online.js`, `world.js`, `sh tests/all.sh`).
- No navegador: a câmera e o HUD na troca para a aeronave nova com o destroço ainda caindo; o painel "onde entrar" com a economia ligada (`ecoMe` agora é chamado assim que a contagem acaba, não depois que o destroço cai).
- Ejeção do jogador: não existe para o jogador hoje; a ejeção da IA (`p.end = 3`) continua igual e tem um caso no teste.

**Riscos:**
- Com a economia ligada, a aeronave da reserva sai na hora em que a contagem acaba, não quando o destroço cai (é o pedido).
- O destroço do convidado cai em cada cópia pela física local a partir da última posição e velocidade recebidas: o ponto de queda pode diferir alguns metros entre as cópias. O dano no objeto atingido continua só na cópia do dono.
- Destroço ainda em `S.planes` com `me = 0`: quem procura "o avião do jogador" por `p.me` não o acha mais (é o certo); quem usa `S.my` já via a aeronave nova.

**Como testar depois:**
- `node tests/respawn-air.js`
- `node tests/heli-online.js`, `node tests/online.js`, `node tests/loadout-online.js` depois de consertar a queda das conexões
- No jogo: de jato a 1000 m, ser abatido e ver que em 3 s entra outro (ou o escolhido no H) enquanto o destroço ainda cai e estoura no chão; o mesmo de helicóptero; online com dois jogadores, cada um vendo o destroço do outro cair até o chão.
