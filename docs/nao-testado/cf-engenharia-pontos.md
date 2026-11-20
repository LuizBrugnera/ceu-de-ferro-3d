# cf-engenharia-pontos: muros HESCO, engenharia de fortificação e bases avançadas (não testado)

Entregue sem testes, pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado").

## O que mudou

Tudo numa seção nova do `Céu de Ferro 3D.html`, `ENGENHARIA DOS PONTOS (ENP)`, logo antes da cena 3D, e um bloco de desenho depois da camada de túneis da Visão de General. O código antigo só por ganchos (embrulhos). Mais `server.js` (`FKINDS` 13 e `hsc: 1` no welcome), `mcp-general.js` (os tipos novos em `build_defence` e `send_command`) e um parágrafo no README.

**Obras novas (tipos 11 a 13 de `FORT.K`, as duas épocas, nome por época)**
- 11 `hesco`: Barreira HESCO alta, 12 × 1,1 × 2,1 m (1944: muro alto de sacos de areia).
- 12 `hescob`: Barreira HESCO baixa, 1,2 m, para atirar por cima (1944: terrapleno com troncos).
- 13 `twall`: Muro de concreto T-wall, 3,4 m (1944: paliçada de troncos).
- São objetos da grade como os sacos de areia: o tiro que bate para nela (fuzil e .50 quase não fazem dano: `take[0]` 0,02 a 0,05); granada/canhão/explosivo derrubam (`hp` 320 a 800, `take[1]`, `take[2]`); tanque não esmaga (sem `crush`).
- Cortam a linha de visada abaixo do topo: as obras não estão na grade de visada (`ray` modo 1), então um embrulho do `ray` olha só os muros dos aglomerados (células de 96 m) perto da linha (`enpWalls`, `enpRay`).
- Explosão do outro lado do muro: sobra `ENP.shield` (15%) para quem está atrás (`fortHit`).
- Registro de abrigo do P2 (`ABRT`/`abrPub`): pontos a cada 2,2 m atrás do muro, proteção por setor (a face, `ABRT.wall`) e postura pela altura; o baixo tem setor de tiro. `tpsAbr` lê a altura certa. Lugares dos homens (`fortSlots`): só atrás do muro baixo.
- Limite por lado: 10, 10 e 6 × `bmrMul` (cresce com economia e pontos). Custos: 6/14, 4/9, 10/24 (energia/metal). A IA da engenharia paga cada peça quando sobram 20 de energia e 30 de metal (`enpPay`, `ENP.keep`), fora da reserva da economia e do orçamento de obras do BMR (a pessoa paga como qualquer obra).
- `FORT.slots` 256 → 320 (as ids dos prédios andam 64, como no BMR).
- O soldado constrói os três pelo N (o ciclo do N já percorre `FORT.K`).
- Desenho: caixas da malha instanciada das obras (cestos de HESCO, fiadas de sacos, placas de T-wall, troncos), uma caixa só a mais de 160 m da câmera (LOD).

**A unidade** (`job` `fen`, "Engenharia de fortificação", tag FRT): Pioniere / Combat Engineers / Sapyory / sapadores da milícia, com sapadores no kit. Uma por lado (duas com 3 ou 4 estradas: `RN.postN.fen`), mantida e reforçada como os outros postos (`FIELD.posts`). Posto atrás da linha. É a primeira escolha para qualquer ordem de fortificar (`gPick` pref) e a última para o resto (avoid); o plano de fortificação (AFP) também a usa quando está livre.

**Ordens novas pelo `genCmd` (`fort`)**, iguais para pessoa, MCP e IA: `hesco`, `hescob`, `twall` (uma peça, como trincheira/posto) e:
- `perim {x, z, ids?}`: perímetro em volta do ponto tomado, base de suprimento ou base avançada a 200 m (senão do lugar). Anel de módulos de 12 m a 26/20/22 m, a face virada para a ameaça conhecida (senão a base inimiga mais perto): T-wall no meio da face (hoje), HESCO alta na face e nos flancos, baixa nos ombros, traseira (120°) aberta e toda estrada que cruza o anel vira entrada; ninho de metralhadora no anel ao lado da face, posto anticarro do outro lado com blindado inimigo conhecido, ninho dentro da entrada de estrada mais exposta, trincheira atrás da face. Insurgentes: sacos de areia e trincheiras em vez de muros. A peça que o terreno recusa é tentada 4 m para fora/dentro e depois deixada (o desenho é o do terreno). Os construtores ficam no meio e fazem peça por peça (a face primeiro), ao lado da obra (`O.wk`, como no CGN). Nenhuma peça começa com inimigo a 120 m; ordem da IA paga cada peça com `enpPay`. Acaba pronto, sem construtores, sem recursos por 240 s ou no prazo (900 s + caminhada).
- `fob {x, z, ids?}`: base avançada: uma esquadra de linha garante a posição enquanto a engenharia faz o perímetro; pronto, pede a base de suprimento (`GC.sup`) e a antena de rádio onde a rede não chega (recusas vão para o diário).

**O general da IA** (`enpPlan`, de 8 em 8 s, lado com a defesa na IA): base avançada (de 30 em 30 s, uma por vez, até 1/2/3 pelo nível da economia) na melhor posição-chave do mapa tático (gargalos `k`, cristas, perto da frente do nosso lado `l`, fora da vigilância inimiga `v`, perto de estrada, a 700 m de outras bases/pontos), andando para a frente com a linha; depois os lugares por valor: pontos tomados (recém-tomados e ameaçados primeiro: quadro de ameaças e conhecidos), bases avançadas, bases de suprimento. Lugar com inimigo conhecido a 300 m fica para depois; perímetro pronto é olhado de novo em 150 s (reparo do que caiu).

**O que se vê**: diário do general (eng), `C.enp.fl`; Visão de General/RTS: os muros como traços grossos e a camada "Engenharia" com cada perímetro em andamento (anel, peças prontas/total, o que fazem: a caminho, construindo, parada por inimigo, aguarda recursos). `genVM` traz `V.enp` (só anfitrião/solo).

**Não feito (fica para depois)**: a guarita/torre de vigia com sacos de areia (o spec dizia "se couber"); arame e obstáculos (não existem no jogo); a HESCO no compartimento de itens do soldado (ela está no ciclo do N, não num item); `V.enp` para o convidado online; a linha das obras novas na Economia do general (`bmrView`).

## O que foi verificado (só fumaça)

- `node --check` do script da página, do `server.js` e do `mcp-general.js`.
- `server.js` sobe (porta 8191) e responde 200 na raiz.
- Harness, IA × IA no mapa v6 com economia, semente 5 (`ENP.start` 5 s e o AFP desligado só na fumaça): 40 e 90 s nas duas épocas sem erro; 200 s em 1944: os generais mandam a engenharia aos pontos tomados ("Perímetro fortificado em D · Vila das Oliveiras: Pioniere ... 9 peças"), as esquadras chegam, 5 muros altos começam ou ficam prontos, `V.enp` sai na Visão de General. **Não é medição.**
- A fumaça achou e corrigiu dois defeitos: a carona de caminhão trocava a ordem dos construtores e a operação acabava na hora ("sem construtores": agora a operação guarda quem são, `E.bq`); e no começo da partida o metal fica abaixo da reserva da economia e do orçamento do BMR, então nenhuma peça saía ("aguarda recursos"): a engenharia da IA agora paga com uma reserva própria pequena (`ENP.keep` 20/30) e os custos baixaram.
- **Navegador: não consegui** abrir a página no navegador compartilhado (tempo esgotado na navegação, três tentativas); nada do desenho nem da camada foi visto. Conferi só que tudo que o bloco da cena usa ao carregar (`FLOOK`, `postBoxes`, `gWorks`, `GLAY`, `gOn`, `gTxt`, `gCol`, `GV`) está declarado antes dele.

## O que NÃO foi testado

- Nenhuma suíte de `tests/`, nenhuma medição, nenhum torneio, nada no navegador, nada online.
- A medição pedida ("em X min de IA × IA, pontos tomados ganham perímetro ≥ N peças e a engenharia não fica parada") **não foi feita**: o roteiro está em "Como testar depois".
- Não vi na tela: o desenho dos muros (cores, escala, LOD), a camada Engenharia, os chips novos (O na Visão de General), o fantasma do N para peças de 12 m.
- Não vi acontecer: soldados entrando/saindo do anel (podem enroscar nos muros), tiros parando no muro, linha de visada cortada, muro derrubado por canhão, a base avançada com guarda, base de suprimento e antena.
- Custo: o embrulho do `ray` em toda consulta de visada (modo 1) e o `enpLayout` por lugar a cada 8 s.

## Riscos

- **Pathing**: muro alto sem `dug` empurra soldados e bloqueia veículos; esquadras podem ficar presas do lado errado do anel (a traseira aberta e as estradas são as únicas entradas). Ajuste `ENP.gap` ou dê `dug` aos objetos.
- **Visada**: soldado agachado atrás da HESCO baixa não vê por cima; a IA pode perder alvos. Fuzil dentro do anel com muro alto não atira para fora (só pelas entradas, ninho, posto).
- **Ids e vagas**: `FORT.slots` 320 muda as ids dos prédios e tira 64 do espaço das pedras/moitas num mapa cheio; página velha contra nova online não combina.
- **População**: uma (ou duas) esquadras a mais por lado desde a abertura.
- **Economia**: um perímetro custa ~70 de energia e ~160 de metal, e a engenharia gasta abaixo da reserva da economia: pode atrasar a produção no começo da partida. Se piorar, troque `enpPay` por `aidPay` ou `bmrPay` (a fumaça mostrou que com eles nada sai nos primeiros minutos).
- **Guarda da base avançada**: fica segurando o lugar depois que a obra acaba; o planejador de postos pode puxá-la de volta.
- O nome por época é um getter (`F.name`); código que copia `FORT.K[k]` com `Object.assign` perde o getter (não achei nenhum).
- MCP: `JOBS` do `mcp-general.js` ganhou `egd`, `sap` e `fen` na ordem de `Object.keys(GEN.tag)` vista no harness; se outra tarefa acrescentar um job antes, os nomes andam.
- Online: `V.enp` não vai ao convidado.

## Como testar depois

1. Fumaça e suítes que podem mudar: `node tests/sim-split.js`, `node tests/afp.js`, `node tests/forts.js`, `node tests/posts.js`, `node tests/bases.js`, `node tests/tps.js`, `node tests/field.js`, `node tests/pop-push.js`, `node tests/w13.js`, `node tests/orders.js`, `node tests/forts-online.js` (o servidor com `FKINDS` 13).
2. Medição sem tela (sugestão `tests/enp.js`): `H.load({ seed, mapv: 6, eco: true })`, `C.watch(era, {})`, 10 min de IA × IA por época, 3 sementes. A cada 10 s: por lado, para cada ponto `S.cq.p` com `hold === t`, quantas obras `f.F.enp` (e ninhos/trincheiras) a menos de 40 m; a esquadra `fen` com `q.op` (trabalhando) ou não. Esperado: ponto tomado há mais de 3 min com ≥ 6 peças; `fen` ocupada ≥ 70% do tempo; `C.enp.fl` sem "desiste" em série; nenhuma exceção.
3. Cenários: `genCmd(t, { c: 'fort', k: 'perim', x, z }, 'person')` num ponto em campo aberto e numa vila (peças recusadas por casas e estradas); `k: 'fob'`; `k: 'hesco'`; recusas `hsc` (online sem o servidor novo), `done`, `sq`. Um tiro de fuzil e de .50 contra a HESCO (para), um HE (derruba depois de alguns), `walled()` através do muro (true abaixo de 2,1 m).
4. No jogo: "Assistir", Tab: camada Engenharia, diário (eng: "Perímetro fortificado…", "Base avançada…"); câmera perto de um ponto: o anel, as cores por época, o LOD a mais de 160 m.
5. Jogando de soldado: N até "Barreira HESCO" (e as outras), construir, ficar atrás sob fogo.
6. Online: anfitrião e convidado com o servidor novo (as peças aparecem no convidado pelo `fort`); servidor velho recusa com o texto `hsc`.
