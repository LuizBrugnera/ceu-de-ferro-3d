# cf-intercepta-missil: abater míssil a tiro (vários acertos, só calibre alto)

Pedido do capitão (quadro das miras, grupo Projéteis): "ser possível interceptar os mísseis atirando neles, mas tem que ser vários tiros e de calibres altos".

**O que mudou** (`Céu de Ferro 3D.html`, `server.js`):
- `MINT` (logo antes de `intercept`): regra e números. Só uma bala de **12,7 mm ou mais** conta (.50, Kord, DShK, NSVT, KPV 14,5, 20 mm, 23 mm, 30 mm, CIWS). Fuzil, PKM, MG 34, M240 e afins não fazem nada.
- `calOf(w)`: calibre da arma lido do **nome** (`M2 .50` → 12,7; `ZU-23-2 (2× 23 mm)` → 23; `2 cm Flakvierling` → 20; `M61A2` → 20; `GAU-8/A` → 30; `PKM 7,62` → 7,62; sem número → 0). Fica guardado na arma (`w.cal`). Casulos de foguete (S-5, S-8) contam 0.
- Toda bala agora leva `cal`: avião (`fireGun`), helicóptero (`heliGun`), veículo (`ARMK.gun`) e soldado (`manFire`: o M2HB/Kord do ninho de metralhadora conta, fuzil não).
- Laço de balas (`stepShots`): no lugar do teste antigo `b.am` (que só valia para o CIWS e matava com um acerto), toda bala de calibre alto testa a aproximação a cada míssil do outro lado em voo (`S.missiles`: ar-solo, Javelin, TOW/Kornet, Hellfire, Ataka, bombas guiadas, AAM e SAM). Raio `MINT.r` = 1 m (o CIWS segue com o seu `am` = 1,2 m).
- Vida do míssil (`mintHp`): anticarro 8, ar-solo de avião 12, bomba guiada 20, ar-ar/SAM 6. Dano por acerto (`MINT.dmg`): 12,7 mm 1, 14,5 mm 1,5, 20 mm 3, 23 mm 3,5, 30 mm 5; munição do CIWS (`am`) × 1,6. Ex.: .50 precisa de 8 acertos num Javelin, 30 mm de 2, o CIWS de 1 (como antes).
- Abatido **explode no ar**: `mslBoom` faz `explode` no lugar com a ogiva × `MINT.boom` (0,6) no raio da ogiva; míssil sem raio (AAM) só o clarão. Texto "míssil abatido" para o jogador que derrubou.
- Online: **o anfitrião decide** (`mintHit`: num convidado a bala só faz faísca). Quando derruba, `Net.mkill(m, true)` manda `b: 1`; `server.js` repassa o `b`; cada cópia explode igual (`Net.rx.mkill`).
- IA (`aiMint`, chamado em `stepUnit` depois da IA de cada veículo, nunca com jogador no assento de atirador): veículo com arma pesada (tanque com .50/Kord/NSVT, técnica com DShK, ZPU, ZU-23, Shilka, M16, Wirbelwind, blindado com canhão automático) vira essa arma para um míssil **que vê** (`sees`: linha de visada e fumaça) vindo na sua direção a até 1500 m; a antiaérea de tiro também por um míssil indo num amigo a até 400 m. Reação de 0,4 a 1,1 s, só entre 120 e 1100 m, espalhamento 6 mrad, erro de avanço sorteado por míssil, só atira com a mira no lugar. Lançador de SAM (NASAMS, Pantsir) segue com a lógica própria (`aiAA`).
- A cúpula antifoguete não mudou. Foguetes (`S.bombs`: MLRS, foguetes de avião) **não** são abatíveis a tiro.

**Testado (só fumaça, regra do capitão):** servidor sobe e entrega a página (200); a página carrega no navegador sem erro novo no console (só um 404 de recurso que já existia); `calOf` responde 12,7 / 23 / 7,62 / 20 para `M2 .50`, `ZU-23-2 (2× 23 mm)`, `AKM 7,62`, `2 cm Flakvierling 38`.

**Não testado (nada além da fumaça):**
- A checagem focada pedida (N tiros de .50 derrubam um míssil, fuzil não) **não foi feita**.
- Se a geometria do acerto pega mesmo (míssil rápido, bala rápida, passo de simulação): pode acertar demais ou quase nunca.
- A IA atirando em míssil: se reage, se a mira é boa demais ou ruim demais, se atrapalha o tanque (a .50 de teto vira para o míssil; num veículo cuja arma pesada é a principal, a torre vira para o míssil e larga o alvo dela por uns segundos).
- Explosão no ar: dano em quem está perto (inclusive no próprio atirador, se o míssil cair perto dele), bomba guiada abatida baixo (raio grande).
- Online: anfitrião decidindo tiros de convidado (o anfitrião vê as balas do convidado com outro espalhamento), mensagem `mkill` com `b`, explosão em cada cópia; míssil sem `mid` não é avisado aos outros.
- CIWS do NASAMS/Pantsir: antes um acerto matava qualquer míssil ar-solo; agora mata o anticarro com 1, o ar-solo de avião com 2 e a bomba guiada com 3. Pode ter ficado mais fraco.
- Desempenho: cada bala de calibre alto olha todos os mísseis a cada passo (barato com poucos mísseis; não medido com muitos).
- Suítes (`tests/`), partidas IA × IA, balanço.

**Riscos:**
- `calOf` lê o nome: uma arma nova com nome sem calibre conta como fuzil (0); um nome com número decimal que não é calibre pode virar calibre errado.
- Aviões de caça agora também podem derrubar mísseis com o canhão (20/30 mm), e AAM/SAM podem ser derrubados por qualquer arma pesada.
- `aiMint` sobrescreve `c.aim`/`c.fire` da IA naquele passo; um veículo ocupado com um alvo importante para de atirar nele enquanto o míssil está no ar.

**Como testar depois:**
1. Checagem focada (node, sem navegador): carregar o script do jogo como os testes de `tests/` fazem, criar um míssil anticarro (`MSL.arm` com `gnd: true`) parado/voando reto e disparar balas `{ cal: 12.7, ... }` cruzando-o; esperar abatido no 8º acerto (`m.gone` e `explode` chamado); com `cal: 7.62` nunca; com `cal: 30` no 2º.
2. No jogo, solo: jogador numa técnica com DShK ou num M16 Halftrack, um helicóptero inimigo lançando Hellfire nele; atirar no míssil (precisa de vários acertos); trocar para fuzil e ver que não derruba.
3. IA: tanque com .50 sob ataque de Javelin/Hellfire; ver a .50 de teto virar para o míssil e às vezes derrubá-lo; ZU-23 protegendo um comboio.
4. Online (2 navegadores): convidado derruba um míssil; conferir que some e explode nos dois, e que só o anfitrião decide.
5. Suítes: `node tests/damage.js`, `node tests/frame-budget.js` e uma partida IA × IA moderna (ver se a IA não fica presa atirando em mísseis).
