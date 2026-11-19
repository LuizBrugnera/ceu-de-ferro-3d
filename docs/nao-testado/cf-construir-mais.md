# cf-construir-mais: generais e unidades constroem mais, toda obra custa, e o general mostra os suprimentos (não testado)

Entregue sem testes, pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado").

## O que mudou

Tudo em `Céu de Ferro 3D.html`, quase tudo num bloco novo `BMR` (fim da simulação, antes da cena 3D), mais `server.js` (repassa `wk`), `mcp-general.js` (mostra `economy.construction`) e o README.

**Limites maiores, que crescem**
- Bases de suprimento: `supCap(t)` = 3 + 1 a cada 2 pontos seguros (sem contar a base principal) + 1 no nível 1 da economia + 1 no nível 2, até 8. A IA ergue até `supBots(t)` (um a menos quando há uma pessoa que pode construir no lado). HUD, recusa `cap` e a IA usam isso.
- Trincheiras, sacos de areia e os três postos (anticarro, ninho, torre): limite × `bmrMul(t)` (1 + 0,35 por nível da economia + 0,1 por ponto seguro, até 5; no máximo ×2). O limite do planejador para trincheiras e parapeitos subiu de 6 para 10 (× o mesmo fator). A cúpula, a antena e as pontes ficam como estavam.
- `FORT.slots` de 192 para 256 (144 obras dinâmicas por partida, os dois lados juntos). Isso desloca os ids dos prédios em 64.
- Comboios: um a mais em andamento para cada 3 bases de suprimento prontas (`lgPlan`).

**Toda obra custa energia e metal (com a economia ligada)**
- Base de suprimento 50/80 (`BLD.cost`): `siteWhy` responde `cost` e `startSite` cobra.
- Trincheira 4/6 e sacos de areia 2/5 (`FORT.*.cost`), cobrados pelo mesmo caminho dos postos. Isso vale também para o jogador e para a trincheira do drill `fogo-distante` (cf-inf-fogo-longe).
- Postos, cúpula, antena e pontes: como antes.
- Campo minado ordenado pelo general (`fort` mineat/mineap, incluindo o plano de fortificação): 1/4 por mina posta. Sem dinheiro, o campo para ali, e a ordem é recusada (`cost`) se não houver para as 5 minas. As minas do bolso do sapador e do jogador continuam de graça (o bolso é reposto no depósito).
- A posição antiaérea já usa uma antiaérea fixa da reserva, que já foi paga na produção.
- Orçamento da IA (`bmrPay`): a obra própria da IA só sai se sobrar a reserva da economia (`aidPay`, como antes) **e** se o gasto das obras no último minuto mais ela couber em 60% da renda por minuto (no mínimo 100 de energia e 160 de metal). Sem orçamento, o plano de fortificação espera, sem segurar a produção. Sem reserva, ele poupa como antes.
- Livro de obras por lado (`d.wl`, `d.wt`, `d.wn`): o que foi pago, quando e de que tipo.

**General da IA**
- Bases de suprimento também atrás dos pontos que o lado segura e que estão ligados à base (`cqTied`), os mais avançados primeiro, nenhum a menos de 650 m de outra base do lado (`bmrSupTries` em `aiSite`). Quem constrói precisa de inimigo a mais de 300 m (era 500), e a esquadra com kit vai primeiro (e gasta o kit). Base perdida é refeita como antes (`BLD.ai.again`).
- Plano de fortificação (AFP) mais agressivo: roda a cada 10 s (era 15), com 2, 3 ou 4 ordens em andamento conforme o nível. As entradas que recebem ninho passam de 1/2/3 para 2/4/6. Cobre também os pontos seguros (1, 2 ou 4, os mais avançados primeiro) e as bases de suprimento prontas (0, 1 ou 2): ninho, posto anticarro com blindado conhecido e, no nível 1, campo minado na entrada mais avançada. Só o primeiro ponto ganha guarda-chuva antiaéreo, e só no nível 2.

**Unidades sozinhas**
- `fortPlan`: a esquadra parada no lugar cava com o inimigo a mais de 300 m (era 500). Vale para a que está defendendo (`hold`) e para a que chegou ao fim de um `move` há 40 s. Primeiro a trincheira e, com ela pronta, o parapeito à frente (numa base ou vila, o contrário). Nada disso vale em assalto ou em movimento.
- `aidPosts`: engenharia (anticarro com blindado conhecido, senão ninho) e sapadores (ninho) também erguem posto. Isso vale também em operação de emboscada, de guarda ou de defesa (`bmrOpBuilds`), com o inimigo a mais de 300 m, a cada 40 s (era 60). O limite total de postos é a soma dos limites.
- `bmrKitSup`: uma esquadra com kit de construção, parada num ponto seguro sem base de suprimento do lado a 650 m, monta uma ali por conta própria, pela ordem `sup` do general.

**O que o usuário vê**
- HUD (coluna da direita, sob as bases de suprimento): "GENERAL · SUPRIMENTOS", ENERGIA e METAL com o estoque, a renda e o gasto por minuto (produção + obras), CAIXAS nos nós e OBRAS −E −M por minuto. A contagem das bases usa o limite novo.
- Visão de General, Economia do general: a linha nova `#geWk`, com o gasto das obras no último minuto, o orçamento, bases n/limite, trincheiras e parapeitos n/limite, postos n/limite e as caixas nos nós. A mesma linha também aparece como linha "Obras" na lista da economia e da logística.
- `ecoView(t).works` (ask_view do MCP) traz limites, contagens, custos, gasto e orçamento. A mensagem `ecs` leva `wk` (9 inteiros), o servidor a repassa se for válida, e o `get_state` do MCP a mostra em `economy.construction`.
- Os textos das recusas `fcap`, `postcap`, `cap` e `tcap`/`bcap` deixaram de citar números fixos.

## O que foi verificado (só fumaça)

- `node --check` do script da página, de `server.js` e de `mcp-general.js`.
- Harness (`tests/harness.js`): uma partida IA × IA, mapa v6, economia ligada, logística desligada, 60 s na época atual, sem erro. `bmrView` e `ecsOf(..).wk` respondem.
- Navegador (servidor na porta 8137): a página carrega sem erro de script (só um 404 de recurso, já existente). Em "Assistir" (IA × IA com economia e logística), depois de 26 s, a linha de obras aparece na Visão de General com valores (caixas 140, bases 1/6, trincheiras e parapeitos 8/18), e o console continua sem erro.
- Uma contagem curta antes/depois, que **não é medição**: 1 semente (5), época atual, 180 s, mapa v6, economia sem logística. Obras iniciadas por lado (azul/vermelho):
  - `main` (7e26d33): 7 / 13 (ninhos 2 / 3), bases 2 / 2.
  - este ramo, orçamento 45% (primeira versão): 6 / 9.
  - este ramo, orçamento final 60%: 10 / 11 (azul com 1 anticarro e 1 ninho), bases 1 / 2.
  - O metal acaba sendo o limite (azul terminou com 82 e vermelho com 99, abaixo da reserva de 120 que a economia guarda). Com uma semente e 3 min, isso é ruído: o plano de fortificação só começa em 90 s.

## O que NÃO foi testado

- Nenhuma suíte de `tests/` rodou, nem `tests/all.sh`.
- Não houve medição de 15 min ou mais. Não há números confiáveis de quanto mais se constrói.
- Nada foi visto acontecer na partida: as bases de suprimento atrás dos pontos tomados, a esquadra que usa o kit, o ninho e o posto nos pontos e nas bases, o campo minado na entrada avançada, a esquadra que cava depois de 40 s parada, a engenharia que ergue posto em emboscada ou guarda, os comboios extras.
- O HUD de jogador (fora da Visão de General) não foi olhado na tela. Os lados vermelho e azul jogando, e um convidado online, também não. Para o vermelho, só conferi que `bmrLine(1)` responde.
- Online: o convidado recebendo `wk`, o servidor novo repassando e o antigo descartando. O `get_state` do MCP com `construction`.
- O custo por quadro (as varreduras novas de `afpPlaces`, `bmrKitSup`, `bmrView`, que roda a cada quadro no HUD e na Visão de General).
- O harness não roda com logística (`lg: 1`): `m5Lg` (M5) está depois do marcador da cena 3D. Isso já existia e não vem desta mudança.

## Riscos

- **Construir menos em vez de mais:** obras agora custam, e o orçamento e a reserva seguram a IA quando o metal está baixo. Ajuste `BMR.bud` (`share`, `floor`), `ECO.ai.keep` e os custos (`BLD.cost`, `FORT.trench.cost`, `FORT.bags.cost`).
- **Economia mais lenta:** a produção concorre com as obras pelo metal, e mais caminhões de comboio gastam mais metal.
- **Escavação demais:** esquadras que chegam a um ponto de reunião e esperam mais de 40 s (antes da hora H, por exemplo) cavam e gastam, e a obra abandonada decai. O drill de fogo distante agora também paga a trincheira.
- **Ids:** `FORT.slots` 256 desloca os ids dos prédios. Num mapa com o máximo de árvores, cabem uns 64 prédios a menos (`room`). Página velha contra página nova online não combina, como sempre.
- **Vagas:** com os limites dobrados, as 144 vagas de obra podem acabar antes dos limites. `fortStart` então devolve nulo e a IA tenta de novo depois.
- **Limites logo no começo:** os pontos iniciais de cada lado já contam como "seguros", então o limite começa acima de 3 (6 bases e fator 1,75 no mapa v6 com a economia em nível 1). Talvez o certo seja contar só os pontos tomados (`p.own !== t`).
- **Suítes que devem mudar:** `tests/bases.js` (limite de 3 bases, a IA com 2), `tests/forts.js` e `tests/posts.js` (limites, custo das trincheiras), `tests/aid.js` (postos, o `max` 5, `again`), `tests/sappers.js`, `tests/production.js` e `tests/eco*.js` (gasto e reserva), `tests/logistics.js` (comboios a mais), `tests/w13.js` (paridade de recusas: o texto de `fcap` mudou), e as comparações `PARITY=`/`BEFORE=`.
- Testes que comparam `ecoView` como JSON agora veem o campo novo `works`.

## Como testar depois

1. Suítes:
   ```
   node tests/bases.js
   node tests/forts.js
   node tests/posts.js
   SECS=240 node tests/aid.js
   node tests/sappers.js
   node tests/production.js
   node tests/eco.js
   node tests/eco-war.js
   node tests/logistics.js
   node tests/w13.js
   node tests/orders.js
   node tests/relay.js
   node tests/bases-online.js
   node tests/forts-online.js
   ```
2. Medição antes/depois de verdade: uma partida IA × IA por época, mapa v6, `eco: true`, 15 min, 3 sementes, com a página de `main` (`page: <cópia>`) e esta. Por lado, conte a cada segundo os ids novos de `S.forts` sem `pre` (por `k`), de `S.sup` e de `S.mines`. Compare também `S.eco.d[t].wn` e `wt` (só neste ramo) e o estoque no fim. O roteiro usado aqui é `H.load({ seed, mapv: 6, eco: true, page })`, `C.watch(era, {})` e `C.run(secs, each)`.
3. No jogo, em "Assistir" e com Tab (os dois lados): a linha "Obras" na Economia do general e o diário (`eng`/`sup`: "Plano de fortificação ... a posição B", "usa o kit de construção", "Obra de campanha iniciada").
4. Jogando de soldado nos dois lados: o bloco "GENERAL · SUPRIMENTOS" na coluna da direita, e N (construir) com pouco metal mostrando "Seu lado não tem a energia e o metal desta obra".
5. Online (anfitrião e convidado com o servidor novo): o convidado vê a linha de obras e o HUD com caixas. O MCP `get_state` mostra `economy.construction`, e `ask_view` mostra `economy.works`.
6. Cenários para escrever (sugestão, uma suíte `tests/bmr.js`):
   - campo v6 com um ponto tomado e uma esquadra `eng` com kit parada nele: `bmrKitSup` ordena a base, e o kit diminui;
   - economia sem metal: `siteWhy` responde `cost`, `GC.fort` com mineat responde `cost` e `fortPlan` não começa nada;
   - gasto do minuto acima do orçamento: `bmrPay` falso e o AFP registra "aguarda o orçamento de obras";
   - esquadra com `move` cumprido há 40 s: trincheira e, pronta, parapeito;
   - `supCap` com 0, 2 e 6 pontos e com 0, 3 e 6 instalações.
