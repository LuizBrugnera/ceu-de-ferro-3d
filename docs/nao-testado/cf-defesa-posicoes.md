# Defesa por posições: o ponto defendido pelo terreno e pela ameaça (não testado)

Tarefa `cf-defesa-posicoes`. Pedido do capitão: "na defesa, por exemplo, não é legal todos ficarem dentro do ponto um em cima do outro, ainda mais para tanques, eles deveriam pegar posições estratégicas". Tudo numa seção nova do HTML, `/* ---------- CEREBRO: defesa (DFP ...) */` (logo depois do pelotão P8), e a parte da visão do general em `CEREBRO: defesa on the general's view` (no fim do script). O código antigo só é tocado por ganchos.

## O que mudou

- **Plano de defesa por lugar** (`S.dfp`, `dfpPlan`): cada lado guarda um plano por ponto que segura (ponto da conquista ou vila sem conquista); a guarda de instalação (`egd`), a guarda de base de suprimento e o "defender" do jogador em campo aberto ganham um plano pequeno (raio `DFP.site.r` = 70 m). Feito só com o que o lado sabe:
  - a ameaça: `ptThreat` (inimigo conhecido a até 900 m, senão o ponto ligado que o lado não tem, senão a base inimiga);
  - as entradas (`dfpAps`): onde as estradas (eixos e a rede) cruzam o círculo do ponto, cada uma com a zona de morte 160 m para fora pela estrada; peso pela classe da estrada, por quanto ela aponta para a ameaça e pelo mapa tático (gargalos `k`, tráfego inimigo `t`); até 3; sem estrada para o lado da ameaça, o campo aberto daquele lado;
  - os postos: dois por entrada, um de cada lado da estrada (45 a 105 m para o lado, dentro do círculo), com os setores cruzando na zona de morte (fogo cruzado); nota pela linha de visada até a zona de morte e até a entrada, abrigo (`coverAt`, prédio ou obra perto), ocultação (`o`) e vigilância inimiga (`v`) do mapa tático, fora da estrada e longe dos outros postos;
  - vigia: 80 a 200 m além do círculo, para o lado da ameaça, no melhor lugar escondido (`hideAt`);
  - reserva: 30% do raio atrás do meio, longe da ameaça, no térreo do prédio mais perto ou no melhor abrigo.
- **As esquadras dividem o plano** (gancho em `ptPts`): em ordem de id, as duas primeiras pegam os dois postos da entrada principal (uma de cada lado: fogo cruzado), a terceira a reserva, a quarta a segunda entrada (dividida nos dois postos), a quinta a terceira entrada, as demais a reserva. Esquadra sozinha se divide em duas equipes nos dois postos da entrada principal. A primeira esquadra com 5 homens ou mais manda os dois últimos para a vigia. Cada homem fica numa janela virada para a zona de morte, num lugar de obra (trincheira, sacos, HESCO do `cf-engenharia-pontos` em `S.forts`), num ponto de abrigo do registro do P2 (`tpsPts`) que o protege agachado da zona de morte, ou numa linha atravessada ao setor com 5 m entre homens; nunca a menos de 3,2 m de outro lugar do plano; os homens com anticarro pegam os lugares mais perto da estrada. Parado, cada homem vigia o próprio setor (gancho em `scanDir`). Todos menos a vigia ficam dentro do círculo (a captura conta o peso dentro do raio, `cqStep`).
- **Replanejar**: o plano é refeito quando o rumo da ameaça muda mais de 0,6 rad (~35°), ou passa de 90 s e a ameaça mudou; quem estava com lugares do plano velho, ou cuja divisão mudou (esquadra a mais ou a menos), recebe lugares novos. Ninguém sai correndo atrás do inimigo: as esquadras seguem com a ordem de segurar que tinham (a política `dpol` e a força de reação continuam do quadro de ameaças); os carros só andam entre as duas posições deles.
- **Carros de combate e blindados leves** (`dfpTkMake`, `dfpTkGo`, gancho em `AI.tank`, `AI.lav`, `AI.aa`): posições desenfiadas (a torre vê a zona de morte da entrada principal e o casco fica escondido de um olho inimigo lá: crista, dobra, muro), nunca no meio do ponto (55 m), 60 m entre si, cada uma com uma posição alternativa a 45-90 m. O carro vai pela viagem tática do M5 (`m5Go`) até a estrada mais perto e depois atravessa até o lugar; segura ali, lutando como sempre; 9 s depois do primeiro tiro troca para a alternativa (atira e muda) e volta depois do tiro seguinte. Volta para a estrada (`m5Home`) quando o ponto cai, quando a IA não vê ameaça ali há 150 s ou quando o carro cai abaixo de 40% de vida. Uma antiaérea do lado perto do ponto pega a posição de céu aberto (atrás do meio, sem mata nem prédio em cima, no alto).
- **General da IA** (`dfpAi`): a cada 8 s, nos até 2 pontos mais ameaçados (inimigo conhecido a até 1500 m), manda 2 carros pela própria ordem `dpos k tank` (o funil `genCmd`, como qualquer decisão da IA).
- **Jogador e MCP, mesmo funil**: `genCmd dpos { pi, k: auto | off | on | tank (n 1-3) | tkoff }` e `dpos { pi, id: esquadra, x, z, a? }` (o jogador marca o posto de uma esquadra; o setor vai para a ameaça ou para `a`). A ordem `hold` (defender) num ponto já passa a escolher as posições. Pergunta `dfp` (gask): todos os planos do lado. Na aba Defesa, seção nova "Posições de defesa": Refazer, Desligar/Ligar, Carros +, Soltar carros, Marcar posto. Camada nova do mapa "Posições de defesa": setor de cada posto, zona de morte, vigia (V), reserva (R), lugares dos carros (quadrado cheio quando ocupado) com a alternativa, AA. O diário do general registra cada plano e cada carro mandado; a câmera de comandante (RTS) mostra o posto de cada esquadra. MCP: `get_defence_plan` e `set_defence_positions`; o servidor aceita a pergunta `dfp`; o convidado online recebe os planos pela visão do anfitrião (`GENK`).
- **Liga/desliga**: `DFP.on = 0` volta tudo ao que era (e o `BRAIN.on` do P0 também desliga).

## Ganchos usados

`ptPts`, `scanDir`, `AI.tank`, `AI.lav`, `AI.aa`, `step`, `genQuery`, `genVM`, `rtsBrain`, `GENK`, e na visão `GLAY`, `gorDefP`, `gorAct`, `gorTarget`. Comando novo `GC.dpos`. `mcp-general.js` (duas ferramentas, `ASKS`) e `server.js` (`GASK`).

## O que NÃO foi testado

Nada foi testado além de `node --check` no script da página, no `server.js` e no `mcp-general.js`, e do smoke de ~1 min (o servidor sobe e a página carrega sem erro no console). Regra do capitão para o Céu de Ferro: implementar sem testes e documentar.

- `tests/dfp.js` (o exercício sem tela pedido: 2 esquadras + 2 carros, ninguém a < 3 m, carros ≥ 30 m e vendo a zona de morte, setores cruzando, todos dentro do círculo) foi escrito e **nunca rodado**: pode ter erro no próprio teste (montagem do sandbox, `addSquad`/`addUnit`).
- Nenhuma partida jogada, nenhum torneio, nada no navegador além do carregamento, nada online.
- O caminho do carro até a posição fora da estrada (`m5Go` e depois `driveTo` pelo campo) não foi visto: pode encalhar em casa, mata ou declive.
- A antiaérea com `AI.aa` fora do trilho (`u.rail = false`) nunca foi vista andando assim.
- O custo: o plano faz ~70 linhas de visada por ponto e os carros ~150 a cada vez que é feito (no máximo a cada 90 s por ponto, ou quando a ameaça muda de lado); não medi no navegador.

## Riscos que vejo

- **Comportamento da defesa muda em toda partida**: toda esquadra que segura ponto passa a usar o plano. Pode piorar vitória/eficiência (homens mais espalhados, menos concentrados no centro). Com 3 esquadras, uma fica na reserva.
- **Cálculo de entradas**: se o ponto não tem estrada cruzando o círculo do lado da ameaça, usa o campo aberto; os postos podem ficar em lugar ruim num relevo estranho. As estradas da rede e os eixos se sobrepõem; juntei por ângulo (0,45 rad).
- **Replanejamento frequente**: o centro do inimigo conhecido se mexe; o plano só é refeito com 35° de mudança ou depois de 90 s, mas cada refação move todo mundo.
- **Vigia**: dois homens a 80-200 m fora do ponto podem ser os primeiros a morrer, e não contam para a captura.
- **Carros**: o teste de "desenfiado" é só pelo terreno e pelos prédios (`los` com 1,1 m do casco e 2,6 m da torre); a altura real dos modelos pode ser outra. Se nenhum lugar do anel vê a zona de morte, nenhum carro vai (a ordem volta `tank` recusada).
- **Atira e muda**: "atirou" é o `fire[0]` do controle do carro (vontade de atirar com a mira em cima), não o disparo real.
- **Online**: só o anfitrião decide; o convidado vê os planos pela mensagem `gen` (mais bytes por mensagem com muitos pontos).
- **Conflitos em paralelo**: `cf-engenharia-pontos` (obras nos pontos: o plano usa as obras prontas em `S.forts` e o registro do P2), `cf-sede-ataque-defesa` (defesa da sede: o plano vale para qualquer ponto, inclusive a sede, sem duplicar a política) e `cf-manobra-reuniao` mexem perto; os ganchos são por embrulho, então a ordem de carregamento importa.

## Como testar depois

1. `node tests/dfp.js` (e `MAPV=4`, `MAPV=10`): consertar o teste se a montagem falhar; depois conferir as medidas (≥ 3 m entre homens, carros ≥ 30 m e com a torre vendo a zona de morte, setores cruzando, ninguém fora do círculo menos a vigia).
2. Suítes antigas que o `ptPts` e os carros afetam, comparando com o main de antes (`PAGE=<página antiga>`): `node tests/infantry.js`, `squads.js`, `city.js`, `forts.js`, `cover.js`, `field.js`, `brain-pelotao.js`, `tps.js`, `capture.js`, `campaign.js`, `frame-budget.js`, e `sh tests/all.sh`.
3. Torneio A×B com `DFP.on` 1 × 0 nas mesmas sementes (fora do elrei, com `nice`): vitória, tíquetes e pontos perdidos na defesa.
4. No navegador, partida IA × IA moderna: abrir a visão de general (Tab), ligar a camada "Posições de defesa", achar um ponto com 2-3 esquadras e conferir: setores nas estradas de entrada, esquadras em lados diferentes, vigia à frente, reserva atrás; câmera de comandante numa esquadra deve dizer "Defesa: posto em fogo cruzado...". Quando o inimigo chegar perto, ver no diário "Carro de combate toma posição desenfiada em ..." e seguir o carro: deve sair da estrada, parar atrás de uma crista/dobra/prédio, atirar e trocar de posição.
5. Jogador: na aba Defesa, "Posições de defesa": Refazer, Desligar (as esquadras voltam ao jeito antigo), Carros +, Soltar carros, Marcar posto (selecionar uma esquadra, clicar no mapa perto do ponto).
6. MCP: `get_defence_plan`, `set_defence_positions {point, mode: "tank", count: 2}` e `{point, squad, x, z}`.
7. Online: anfitrião e convidado; o convidado deve ver a camada e a seção da aba Defesa, e as ordens `dpos` dele devem valer no anfitrião.
8. Custo: no console, `AIB` com e sem `DFP.on` numa partida grande.
