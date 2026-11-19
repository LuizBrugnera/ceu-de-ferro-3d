# cf-canhao-dano: tiro do canhão do tanque atravessava a infantaria

**Causa:** em `stepShots`, os projéteis de `S.bombs` (granada perfurante e explosiva do tanque, obus, foguete, carga oca, bomba) só testavam veículos (`S.units`, num ponto no fim de cada salto) e aviões. Soldados (`S.men`) e civis nunca eram testados: a granada mirada no peito de um soldado passava por ele e só estourava onde caía, metros atrás (perfurante: estilhaço de 7 m; explosiva: longe demais). A reprodução sem navegador deu 0 de 6 acertos em soldado em pé a 150, 600 e 1500 m, nas duas épocas, perfurante e explosiva. Os veículos (carro, caminhão, blindado sobre rodas, antiaérea, autopropulsado, tanque, helicóptero pousado) já eram atingidos 100% com mira no meio.

**O que mudou** (`Céu de Ferro 3D.html`):
- `hopBox` e `hopMan` (antes de `stepShots`): teste varrido do salto inteiro (do ponto anterior ao novo), não só do ponto final.
  - Veículo: a mesma caixa generosa de antes (5 m em volta do centro, abaixo de 6,5 m), mas o ponto de impacto passa a ser onde o salto entra no casco (comprimento e largura do `def`, girados com o veículo). Se não tiver `l`/`w` (antiaérea, caminhão padrão), é o ponto do salto mais perto do centro.
  - Soldado e civil: um cilindro do raio do soldado (`MAN.r`) e da altura da postura, como já se faz com as balas.
- No salto vale o primeiro corpo atingido (veículo, soldado ou civil) antes da parede ou do chão que encerram o salto.
- Granada perfurante que acerta um soldado: o impacto direto (`impact`, `HK.shell`) e o estouro pequeno de sempre, mesmo quando a cobertura dele segura o tiro. Explosiva: impacto direto com `o.hit` e o estouro inteiro no ponto. Civil: `manHit` + `civHurt`.
- Fumígenas (`smk`) continuam sem testar soldados.
- `tests/shell-hits.js`: a regressão (única que rodei). `tests/README.md`: a linha dela e a remoção de marcadores de conflito que estavam no main.

**Testado:** só `node tests/shell-hits.js` (passa aqui; contra a página de antes dá 27 falhas, todas de soldados) e o teste de fumaça (página carrega, servidor sobe).

**Não testado:**
- Nenhuma outra suíte (`shells.js`, `damage.js`, `infantry.js`, `world.js`, `cover.js`, `civ.js`, `soak.js`...).
- Online: anfitrião e convidado atirando de tanque em soldados (o caminho é o mesmo `stepShots` no cliente de quem atira e `relayed`/`Net.hit` para fantasmas, mas não exercitei).
- Tiro do jogador de verdade (mira, `drive`) e da IA numa partida; soldado atrás de cobertura (parede, saco de areia, pedra); civis; foguetes de avião e helicóptero, obus e carga oca em infantaria (também passam a acertar soldados no caminho).

**Riscos:**
- Balanço: tanques (jogador e IA) ficam bem mais letais contra infantaria, porque o tiro direto agora mata. Obus e foguetes também passam a acertar o soldado no caminho.
- O ponto de impacto em veículos mudou (entrada do casco em vez do fim do salto): o estouro da explosiva fica um pouco diferente; `tests/shells.js` compara o perfurante com a página antiga e pode acusar diferença de hp.
- Soldado deitado: um tiro que passa a menos de 0,5 m do chão ainda bate no chão antes (regra antiga do chão), então mirar bem baixo num deitado pode errar como antes.
- "Alguns veículos" do relato: com mira no meio, todos os tipos já eram atingidos antes e continuam. Se o capitão ainda vir granada atravessando veículo, falta achar o caso (ricochete em ângulo raso aparece como "ricochete" e não causa dano, isso é de propósito).
- Custo: cada salto de projétil baixo percorre soldados e civis (com filtro de caixa); não medi o quadro numa batalha cheia.

**Como testar depois:**
- `node tests/shell-hits.js`
- `node tests/shells.js`, `node tests/damage.js`, `node tests/infantry.js`, `node tests/cover.js`, `node tests/civ.js`, `node tests/frame-budget.js`
- `sh tests/all.sh`; `node tests/online.js` e `node tests/damage-relay.js`
- No jogo: tanque contra soldado em pé a 150 m e a 1 km (perfurante e explosiva), soldado deitado, atrás de muro; online com dois jogadores, o convidado de tanque atirando em infantaria da IA e de outro jogador.
