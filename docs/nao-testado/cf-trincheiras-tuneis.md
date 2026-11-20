# cf-trincheiras-tuneis: trincheira como buraco e corredor, túneis, mais mato, abrigo para o cérebro (não testado)

Entregue sem testes, pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"). Segue a arquitetura da pesquisa `cf-cerebro-pesquisa` (item cf-trincheiras-tuneis da 3.3): este pacote **produz** abrigo e rota para o cérebro; não decide onde cavar nem como o soldado se comporta.

## O que mudou

Quase tudo em `Céu de Ferro 3D.html`, em duas seções próprias:
- `CEREBRO: trincheiras-tuneis` (simulação, depois da mente da guerrilha);
- `FHOLE` (desenho, no fim do script).

Fora delas: `server.js` (mensagem `tun` e `tcap`), `mcp-general.js` (3 ferramentas, versão 2.4), README e MCP.md.

**Trincheira é um buraco de verdade (`FHOLE`)**
- O terreno é desenhado primeiro (`renderOrder -10`). A tampa de cada trincheira marca o stencil, a mesma tampa zera a profundidade só ali, e as paredes e o fundo (de terra, mais escuros embaixo, tábuas em 1944) são desenhados com a profundidade normal. O chão por cima some; quem está dentro aparece; o chão na frente ainda esconde.
- A tampa segue os triângulos da malha do terreno (`meshH`), não o `hgt()` interpolado.
- A placa escura do fundo antiga saiu (`fortBoxes`); os montes de terra ficam.
- O olho do soldado na trincheira pode descer até o fundo (`fortCam`).
- Pontas encostadas em linha não têm parede: o corredor é um corte só.

**Corredor (`TRN`)**
- `trNet()`: trincheiras com a ponta a ≤ 3,2 m da linha de outra (ponta com ponta, canto, T) ou que se cruzam formam um corredor (grafo de nós e arestas).
- `trPath`/`trGo`: um soldado da IA cujo destino está num corredor, ou que está dentro de um, anda pelo fundo quando sai mais barato (1 por metro dentro, 1,35 por metro fora; 2,4 sob fogo ou com inimigo a ≤ 300 m da esquadra). Entra e sai pelos nós. Recalcula a cada 2 s.
- `trSnap`: trincheira começada a ≤ 8 m da ponta de outra do mesmo lado é encaixada na ponta (reta se a mira está a ≤ 40° da linha, senão em canto). Vale para o jogador (o contorno já mostra encaixado), para a IA e para o general.
- Tanque e roda: regras antigas (`trenchBump`), sem mudança.

**Túneis (`TUN`)**
- Duas bocas e um tempo. Cava da boca A para a B a 0,12 m/s por homem do lado a ≤ 14 m de A (até 6). Comprimento: 40 m no mínimo; no máximo 450 m (Insurgentes) ou 260 m (EUA, Rússia, 1944). Limite de túneis vivos: 6 (Insurgentes) ou 2.
- Lados regulares: só esquadra de engenharia (ou de tarefa comum com sapador) cava. A esquadra de sapadores (`job: 'sap'`) fica de fora: no exercício ela recebeu a ordem e não andou até a obra.
- Usar: a esquadra vai à boca mais perto, some do mundo (como num caminhão: `m.gone`) e sai na outra depois de `len / 1,1 + 4` s, com o ferimento que tinha. Fica na saída ou segue para `x2, z2`.
- O inimigo acha a boca só pela percepção:
  - vendo: a ≤ 16 m (sapador ou engenheiro 34 m, reconhecimento 26 m), com visada além de 6 m;
  - ouvindo cavar: `HEAR.mv.man` correndo, cortado por `HEAR.wall` sem visada;
  - ouvindo ou vendo gente entrar e sair: até 220 m com visada.
- Boca achada: o general da IA desse lado manda uma esquadra destruí-la (`tun blow`). 6 s de sapador ou 14 s de outro soldado, sem dono a ≤ 25 m. Uma explosão de dano ≥ 120 a ≤ 4 m também derruba. Quem está dentro sai pela entrada com metade dos homens.
- Ordens pelo funil `genCmd`, iguais para IA, jogador e MCP:
  - `tun dig {x z, x2? z2?, ids?}`: sem x2 z2, o general escolhe a saída coberta, longe do inimigo (`tunAuto`);
  - `tun use {id | x z, ids | n, x2? z2?}`;
  - `tun blow {x z, ids?}`;
  - `tun fill {id}`.
  - `fort` com `k: 'tun'` vira `dig`.
- Jogador: visão de General, O, obra "Túnel". Clique a entrada e depois a saída; Shift+clique deixa o general escolher. Clique perto de uma boca pronta: as esquadras selecionadas (ou as que o general escolher) passam por ele.
- General insurgente: a tática de guerrilha 23 agora é "Túneis e rotas de fuga" (`grlTun`). Cava um túnel de cada vila que segura até a rota de fuga e manda por ele as esquadras desgastadas. A rota a pé continua para a vila sem túnel.
- Desenho: a boca visível para o seu lado (sua ou achada) é um poço com moldura de troncos. Na visão de General há a camada "Túneis": linha tracejada com o quanto está cavado, quantos estão dentro, e as bocas inimigas achadas.
- Rede:
  - o anfitrião manda a cada lado só os túneis dele e as bocas que achou (mensagem `tun`, ≤ 30 linhas, quando muda ou a cada 10 s);
  - o servidor anuncia `tcap` e repassa só para o lado;
  - servidor antigo: o convidado não vê túneis, mas o anfitrião simula igual.
- `genState(t).tun`: `own` (id, bocas, comprimento, progresso, quantos dentro, achado) e `foe` (bocas achadas).
- MCP: `dig_tunnel`, `use_tunnel`, `destroy_tunnel`.

**Mais mato (mapa versão 11, `UG.v11`)**
- `MAPV = 11`. Uma sala com página antiga fica no 10 pelo portão de versão do servidor.
- O campo de vegetação rasteira (sem ids) ganha mato:
  - nas margens das estradas (9 a 30 m do meio, em trechos de 140 m com 55% de chance);
  - em volta das vilas (até 220 m da borda, em manchas);
  - em moitas no capim aberto (uma mancha de 22–55 m em 22% das células de 230 m);
  - e até 5 trilhas de mato por mata ou vila (eram 3).
- Medido no node (host carregado): gerar o mapa moderno de 3 lados 10,4 s → 11,2 s; células de mato 61 mil → 88 mil.
- Qualidade gráfica: Baixa desenha 60% das moitas do mato, Alta 125% (`UG.q`).

**Para o cérebro (sem comportamento)**
- `ABRT`: os pontos de abrigo no formato do registro do P2 (a 3.2 da pesquisa). O P2 ainda não está no main, então a lista fica aqui e o P2 lê: `S.abr` por fonte, `abrAll()`, `abrNear(x, z, r, lado)`, `abrTake()` (células sujas).
  - Formato do ponto: `{x, z, k: 'trincheira'|'saco'|'tunel', p: 16 setores × [em pé, agachado, deitado] 0..3, incl, cap, dono, set: setor de tiro, ind: proteção de fogo indireto 0..1, y, src, f|tn, ve: lados que conhecem}`.
  - Trincheira: 360°, nível pela parte do corpo escondida (cavada inteira: em pé 2, agachado e deitado 3); indireto 0.
  - Sacos de areia: só nos setores a ±69° da frente.
  - Boca de túnel: 3 em tudo, só para quem a conhece.
- `trRota()`: arestas de rota. Trincheira: `exp 0`. Túnel: `exp 0, vis 0, som 0`, tempo de percurso, dono e quem conhece.
- Ganchos de "tomar o pé da trincheira" e "limpar trincheira" (do P3):
  - `trPe(cid, de)`: o pé do corredor;
  - `trLimpar(cid, de, lado)`: as baias em ordem pelo fundo, cada uma com o ponto da granada na próxima baia (no fundo, `nadeFloor`), a curva a cobrir e os inimigos naquela trincheira;
  - `trFoe(cid, lado)`.
- `shelters(m, r, {e})`: trincheira, saco, boca, moita e mato perto, com ocultação e proteção contra a ameaça `e`.
- `trCorr(x, z)`, `trPath(...)` e `tunMouths(lado)`.

**Ganchos no código antigo** (embrulho, como a pesquisa pede):
- `aiMan` + `wayTo`: o caminho pelo corredor;
- `fortStart`: o encaixe;
- `fortAt` e `fortDrop`: o registro;
- `squadThink`: a esquadra embaixo da terra;
- `explode`: a boca explodida;
- `step`: os túneis;
- `genState`, `grlTun`, `GC.fort`, `fortScene`, `gorTarget`, `Net.rx.welcome/joined/tcap/tun`, `Net.tick`.

**Editado no lugar** (não dá por embrulho: desenho e mapa):
- `buildWorld` (ordem do terreno);
- `fortBoxes` (sem a placa do fundo);
- `fortCam`;
- `fortBuild` (o contorno encaixado);
- `ugGen`, `ugTiles`, `UG`, `MAPV`;
- os textos da tática 23 da guerrilha.

## O que NÃO foi testado

- Nenhuma suíte, partida A/B ou torneio. Só:
  - sintaxe;
  - o servidor sobe;
  - a página carrega sem erro, com a malha dos buracos montada (`gHole`);
  - um exercício curto sem tela (`smoke2.js`, `dbg2.js` em `/home/luiz/firstmate/data/cf-trincheiras-tuneis/`), moderno, 3 lados, semente 7. Ele mostrou:
    - a ordem `tun dig` aceita e cavada pela esquadra de engenharia (34% em 60 s);
    - 486 pontos no `ABRT` (trincheira e saco; em pé 2, agachado e deitado 3);
    - 155 arestas em `trRota()` e 5 passos em `trLimpar`;
    - 4 soldados andando por corredor;
    - a boca achada por um inimigo a 5 m e derrubada por explosão.
  - **Não foi visto** uma esquadra atravessar o túnel: a esquadra da ordem `use` era a de sapadores, que não anda.
- **O buraco não foi visto na tela.** O truque do stencil é o maior risco:
  - tampa abaixo da malha (relevo curvo) deixando chão por cima;
  - chão sumindo atrás da trincheira;
  - parede aparecendo através de morro;
  - sombras (Alta) estranhas;
  - placas de vídeo ou navegadores sem stencil;
  - mato rasteiro ou moita boiando dentro do buraco;
  - ponte ou estrada perto.
- O olho dentro da trincheira (a tampa some quando o olho está abaixo do chão), o terceiro pessoa perto da borda e o FPS com muitas trincheiras (a malha é refeita quando o cavar muda, no máximo a cada 0,4 s).
- Se os soldados realmente andam pelo corredor: travar nas pontas, sair e entrar em zigue-zague, empilhar na junção, ou o custo (`trGo` a cada 2 s por soldado com obras no mapa; o Dijkstra só no corredor).
- O encaixe (`trSnap`) pode deslocar a trincheira da IA até 8 m e mudar onde ela cava perto de outras.
- Túneis inteiros:
  - a esquadra chegar à boca (raio 5 m, todos a ≤ 15 m);
  - a ordem depois de sair, com `op` e missão;
  - homens perdidos no limite de população (`IAI.cap`);
  - o general insurgente cavar e usar de fato;
  - a reação inimiga;
  - o colapso com gente dentro;
  - o túnel visto no mapa e no 3D;
  - a rede (convidado vendo os seus) e o espectador (recebe os dois lados e fica com o último);
  - retomar partida suspensa: os túneis não entram no snapshot do servidor, e um convidado que vira anfitrião perde os túneis.
- Mapa 11: o mato nas estradas e vilas pode tapar a visada (artilharia, tanques, observação) e mudar M2/M4 e o mapa tático; FPS com mais mato.
- O registro `ABRT` nunca foi lido por ninguém: o formato pode não ser o que o P2 vai querer.
- MCP: as 3 ferramentas não foram chamadas.

## Como testar depois

1. `node server.js` e abrir `http://localhost:8080`. Partida de soldado em 1944 e moderna, perto das trincheiras de início (postos de linha e frente das vilas):
   - ver o buraco de longe, de perto, de cima (avião) e de dentro, agachado e em pé;
   - andar ao longo do corredor de duas trincheiras;
   - cavar uma ao lado da ponta de outra (o contorno deve encaixar);
   - conferir o FPS antes e depois.
2. Visão de General (Tab), O, obra Túnel: clicar a entrada e a saída perto de uma vila. Ver o progresso na camada "Túneis", mandar uma esquadra por ele (clique perto da boca) e acompanhar a saída. Depois chegar perto da boca com um soldado inimigo.
3. Sem tela, em `tests/` com o harness (nice, fora do elrei):
   ```js
   const w = require('./tests/harness').load({ seed: 7, mapv: 11 }); w.watch('modern', { n: 3 }); w.run(20);
   w.$("genCmd(0, { c: 'tun', k: 'dig', x, z, ids: [<id da esquadra de engenharia>] }, 'sys')");
   w.$('S.tun'); w.$('trRota().length'); w.$('abrAll().length'); w.$('trLimpar(0, {x, z}, 0)');
   ```
   O roteiro usado na entrega está em `/home/luiz/firstmate/data/cf-trincheiras-tuneis/smoke2.js`.
4. A/B: `TRN.on = 0/1`, `TUN.on = 0/1`, `MAPV = 10/11`, com a mesma semente (`tools/balance.js`). Olhar baixas da infantaria nas posições, tempo exposto e vitórias dos Insurgentes.
5. Online: duas páginas novas na mesma sala; o convidado do lado que cavou vê o túnel e o outro só vê depois de achar a boca. Uma página antiga (mapa 10) deve receber o erro de versão.
6. MCP: `dig_tunnel`, `use_tunnel`, `destroy_tunnel` e `get_state {from_host: true}` → `tun`.
