# Cérebro P2: serviço de posição e pontos de abrigo (não testado)

Tarefa `cf-p2-posicao`, pacote P2 da pesquisa `cf-cerebro-pesquisa` (arquitetura do "cérebro" dos soldados). Tudo numa seção nova do HTML, `/* ---------- CEREBRO: posicao (P2) */`, logo antes da cena 3D; o código antigo só é tocado por ganchos de embrulho.

## O que mudou

- **Registro de pontos de abrigo** (`S.cp`, `tpsInit`): feito no carregamento da partida (gancho em `newState`), por célula de 64 m (a mesma grade do `near()`). Cada ponto tem `{x, z, y, k, p, incl, cap, dono, set, h, l, in, b, f, pw}`: `p` são 16 setores com a proteção 0..3 para em pé, agachado e deitado; `set` é o arco de tiro (janela, canto, degrau da trincheira); `incl` é o lado de se inclinar no canto; `pw` é o quanto a parede para (para o perfil contra blindado).
  - Produtores: prédios pela API do #126 (`bldCover`: cantos com lado, janelas com arco e postura, trechos de muro pela altura, paredes cegas por dentro; `bldEnts`: portas, janelas de passar e buracos como entradas; cômodos por andar em `tpsRooms`); entulho de prédio caído; pedras, árvores fora da mata, carcaças (`wreck`) e cantos de outros objetos que escondem; obras (trincheira 360° pela profundidade cavada, sacos de areia pela frente) numa camada própria refeita quando uma obra muda de quarto de progresso, termina, cai ou some.
  - **Sujo por célula**: `setObj`, `bSet`, `bldDown` e todo objeto dinâmico posto ou tirado da grade (`cellsOf`: carcaça, base, ponte) marcam as células; a célula é refeita na próxima consulta. `tpsDirty(x, z, r)` e `TPS.prod` (função `(x0, z0, x1, z1, add)`) são a porta para o `cf-trincheiras-tuneis` publicar trincheiras/túneis no mesmo formato (`tpsPt`, `tpsArc`).
  - Consultas de prédio do item cf-casas-paredes da 3.3: `tpsBldFire(o, x, z, n)` (pontos de tiro virados para X), `tpsBldEnt(o, x, z, th)` (entrada mais perto de Y que o próprio prédio protege), `tpsEnts(o)`, `tpsRooms(o)`.
- **Consulta** `tps(quem, perfil, o, n)`: geradores (registro no raio, o anel de amostras do `coverSpot`, mata/moita do `coverAt`, veículo parado e carcaça, crateras), filtros (seco, área, faixa, fora da linha de tiro dos amigos, fora das zonas, não reservado nem a < 3 m da reserva de outro), notas em soma ponderada (proteção da ameaça principal 40, das outras 20, linha de tiro 20, caminho e exposição 20, alcance da arma 10, dispersão, lugar onde colegas morreram). No máximo 24 candidatos recebem 1 raio cada, com cache por célula e TTL de 1 s. As ameaças são só as que o soldado conhece (o alvo dele e as crenças da esquadra `q.bel`, ou o `q.bb.cont` do P0 quando existir); nunca `S.men`.
- **Perfis** (`TPS.P`): `abrigo`, `base_de_fogo`, `assalto`, `vigia`, `socorro`, `cavar` (devolve também o ângulo `a` para a frente da trincheira, usa `fortWhy`) e **`contra_blindado`** (pedido do capitão na caixa: só conta abrigo que para canhão/MG pesada pela face voltada à ameaça: alvenaria de tijolo para cima, `pw >= TPS.heavy`, rocha, trincheira, carcaça, dobra do terreno; mato e moita só ocultam e não contam; dentro de prédio de parede grossa ganha bônus).
- **Atravessar o prédio** (`tpsBldPass`): quando a linha até o lugar escolhido cruza um prédio em pé, o caminho vira pontos de passagem: porta/janela/buraco do lado do soldado, por dentro, saída do lado do lugar, e o lugar. Ligado ao exercício `tanque` (infantaria sem anticarro que vê um blindado): cada homem pede `contra_blindado`, corre para lá (pela casa quando ela está no caminho) e fica agachado atrás da parede; enquanto a resposta não vem, ou se não houver lugar, o exercício segue como antes (deitar onde o `drHide` mandou).
- **Fila com orçamento**: `tpsAsk` enfileira, `tpsStep` (gancho no `step`) responde no máximo `TPS.q = 4` por passo, `tpsRes` dá a resposta. `tps()` direto conta no mesmo contador. O tempo vai para o `AIB` (`AIB.u`). `tpsStat()` dá consultas, média, pior, raios, pontos.
- **Reserva**: `tpsHold`/`tpsFree`; um homem por ponto; também marca o `by` dos lugares de obra que o `fortSpot` já usava. Quem morre solta a reserva.
- **Grade de exposição local** (`TPS.xg`, células de 6 m, 48×48, até 4 por lado, 64 raios por passo): fração dos contatos conhecidos que veem um homem agachado na célula, refeita fatiada quando entra contato novo. `tpsExp(team, x, z)` serve para o custo de rota de flanco/lance do líder (P3); o P2 já usa no custo do caminho.
- **`coverSpot` virou o perfil `abrigo`** (gancho): pede na fila e usa a resposta no próximo pensamento do soldado (0,5 s); enquanto isso fica no lugar que tinha ou no da formação. Lugar de prédio dado à esquadra (`sl.b`) continua como antes. Lugares dentro de prédio ficam fora do `abrigo` (o soldado não entrava antes).
- **Liga/desliga**: tudo atrás de `TPS.on` e do `BRAIN.on` do contrato P0 (`tpsOn()`); com `TPS.on = 0` o `coverSpot` e o exercício `tanque` voltam ao que eram. O registro é feito no carregamento mesmo desligado.
- **Contrato P0**: o PR do P0 (cf-lideres) não estava no main. Não copiei a 2.5 como código: declarar `const BRAIN` aqui e no P0 quebraria a página (nome declarado duas vezes) quando os dois entrarem. O P2 lê o contrato pelos nomes da 2.5 (`BRAIN.on`, `q.bb.cont`) e funciona sem ele.

## Ganchos usados (embrulho)

`newState`, `step`, `setObj`, `bSet`, `bldDown`, `cellsOf`, `killMan`, `coverSpot`, e `act`/`man` do item `tanque` de `DRILLS`.

## O que NÃO foi testado

- Só rodei o `tests/tps.js` novo (exercícios sem tela do "Pronto quando", permitidos como medição), o `node --check`/compilação do script inteiro e um smoke de partida IA × IA sem erro. Nenhuma suíte antiga (`infantry`, `drills`, `inf-drills`, `squads`, `frame-budget`, `cover`, `forts`, `city`...), nenhum torneio A×B, nada no navegador, nada online.
- `tests/tps.js` passa em tudo menos o custo: a consulta média deu 0,3 a 1,1 ms no harness (vm, máquina compartilhada, com `nice`), acima da meta de 0,15 ms. O vm do harness deixa toda busca de global (Math, funções do jogo) lenta; no navegador deve ser menor, mas **não medi no navegador**. Por isso baixei `TPS.q` de 6 para 4 por passo.
- O registro custa ~0,5 s a mais no carregamento do mapa moderno v10 (62 mil pontos, 26 mil deles de árvores fora da mata).

## Riscos que vejo

- **Comportamento da infantaria muda** em toda partida (o `coverSpot` é chamado por todo soldado sob fogo): pode piorar vitória/eficiência. O atraso de um pensamento (0,5 s) até o abrigo chegar pode deixar soldados meio segundo no lugar da formação.
- **Custo**: com centenas de soldados em contato a fila pode crescer e as respostas atrasarem (cada uma vale 1,5 s); o teto por passo segura o quadro, mas o abrigo pode chegar tarde.
- **Atravessar a casa**: depende do `drGo` com `b` (lugar em prédio) e do caminho por portas; o soldado pode travar numa parede se a entrada escolhida não for passável (só testei que os pontos saem, não que ele anda por eles).
- **Contra blindado**: o limiar `TPS.heavy = 2.2` (tijolo) é chute; reboco e madeira não contam. Janela de andar térreo conta como abrigo pela parede, mas o vão da janela em si não para canhão.
- **Grade de exposição**: com muitos contatos espalhados as 4 grades por lado se revezam e quase nunca terminam a varredura.
- **Sujo por `cellsOf`**: qualquer objeto dinâmico posto na grade marca células; se algum código chamar `cellsOf` a cada passo, o registro seria refeito sem parar (não achei nenhum, só conferi pelo `grep`).
- O exercício `tanque` agora segura cada homem até 30 s no lugar contra blindado (reserva) e o faz levantar (agachado) em vez de deitar.

## Como testar depois

1. `node tests/tps.js` (MAPV=10 por padrão): registro, muro protege do lado certo, janela com arco, canto com lado, parede derrubada refaz a célula, 6 homens a ≥ 3 m, perfis, `coverSpot` como perfil, contra blindado e caminho pela casa. Rodar no host do jogo para o custo real.
2. Suítes antigas que o `coverSpot` e o exercício `tanque` afetam, comparando com o main de antes (`PAGE=<página antiga>`): `node tests/infantry.js`, `drills.js`, `inf-drills.js`, `squads.js`, `cover.js`, `forts.js`, `city.js`, `veh-drills.js`, `procedures.js`, `frame-budget.js` e a suíte inteira `sh tests/all.sh`.
3. Torneio A×B com `TPS.on` 1 × 0 nas mesmas sementes (fora do elrei, com `nice`): vitória e eficiência de tickets sem regressão; "tempo exposto sob fogo" deve cair.
4. No navegador: partida IA × IA moderna numa cidade, câmera numa esquadra sem anticarro quando um tanque aparece: os homens devem correr para trás de casa de tijolo ou entrar e sair do outro lado, não deitar no aberto. Conferir o `AIB` (painel de custo) com e sem `TPS.on`.
5. Custo no navegador: no console, `tpsStat()` depois de alguns minutos de combate (média ≤ 0,15 ms, `step` pior passo).
6. Online: só o anfitrião roda; um convidado não deve criar registro (`S.cp.all` falso) nem divergir.
