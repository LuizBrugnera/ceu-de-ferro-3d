# cf-general-constroi: o general da IA fortifica a economia e a cidade-sede (não testado)

Entregue sem testes, pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado").

## O que mudou

Causas encontradas lendo o código (não houve medição antes/depois):

1. **O general da IA nunca dava ordem de fortificar.** A ordem `fort` (W21: posição antiaérea, casamata, posto anticarro, posto de observação, campo minado) só era dada pela pessoa ou pelo modelo (MCP). Sozinha, a IA só tinha a trincheira que uma esquadra quieta cava onde está (`fortPlan`), o posto que ela ergue onde está (`aidPosts`), os campos dos sapadores na entrada da cidade-sede e a cúpula quando caem granadas.
2. **As trincheiras gastavam o limite dos postos.** `FORT.ai.cap` (6) contava toda obra do lado. As trincheiras que `fortPlan` cava sozinho enchiam esse limite, e daí `fortPlan` não começava mais nenhuma obra, nem um posto ordenado, e `GC.fort` recusava a casamata ou o posto com `fcap`.
3. **A obra ordenada só começava com o inimigo a mais de 500 m** (`FORT.ai.quiet`) do construtor. Perto da frente, nunca.

Correções em `Céu de Ferro 3D.html`:

- `fortPlan`: o limite de 6 (`FORT.ai.cap`) vale só para trincheiras e parapeitos (k 1 e 2). Os postos ficam com o limite de cada tipo (`F.cap`: anticarro 3, ninho 4, torre 2). A obra ordenada (`O.dig`) começa sem inimigo a 150 m (`FORT.ai.oq`).
- `GC.fort`: o limite é contado por grupo, com trincheiras e parapeitos juntos e cada tipo de posto à parte. O posto acima do limite é recusado com o motivo novo `postcap` (`GEN.no.postcap`, e também em `mcp-general.js`).
- **Plano de fortificação (`AFP`, bloco novo no fim da simulação, antes da cena 3D)**, ligado em `fortPlan`. A cada 15 s, a partir de 90 s, num lado com a defesa nas mãos da IA, num mapa com rede de estradas, sem ser a demonstração do hangar nem a partida terminada:
  - antiaérea fixa sobre a cidade-sede (ou a fábrica) e sobre a base. Sem antiaérea fixa na reserva, registra a falta em `d.miss.aaf` para a produção fazer uma, e espera;
  - nas entradas mais expostas (estrada que entra no lugar, 90 m fora dele): ninho de metralhadora, e posto anticarro quando o lado conhece blindados. Quantas entradas: 1, 2 ou 3, conforme o nível da economia (`AFP.tier`, contado pelas instalações prontas);
  - numa entrada ameaçada (inimigo conhecido valendo 3 ou mais a 900 m, ou um incidente do quadro de ameaças): posto anticarro, campo minado mais à frente e ninho, em qualquer nível;
  - no nível 1: torre de observação na borda da cidade-sede voltada para o inimigo, e até 2 campos minados nas células de maior tráfego inimigo do mapa tático (M1 `t`) no próprio terreno;
  - no nível 2: ninho no gargalo mais forte (M1 `k`) atrás da linha;
  - uma ordem por plano e no máximo 2 em andamento, sempre pelo `genCmd` (as mesmas recusas do jogador). O construtor é a esquadra livre mais perto, a até 2,5 km, com engenharia primeiro e nunca assalto, reconhecimento ou guarnição de posto. Ele volta ao seu lugar quando a obra fica pronta (ou depois de 480 s), com o "porquê" da missão de volta;
  - obra paga só sai se sobrar a reserva da economia (`aidPay`). Faltando, a economia poupa para ela por 90 s (o `ecoAI` segura as ordens `make` que só enchem a reserva, mas não os reforços pedidos) e depois a deixa por 120 s;
  - obra perdida é refeita 120 s depois, com nenhum inimigo conhecido a 400 m. Recusa ou desistência espera 90 s;
  - cada decisão e cada recusa vão para o diário (`eng`, "Plano de fortificação: ...") e para `C.afp.fl` (as últimas 40).
- Documentação: o README ganhou o parágrafo "Fortificação" e a frase do mapa tático, e o comentário do TM foi atualizado ("só o plano de fortificação lê o mapa").

## O que foi verificado

Só a checagem de fumaça (cerca de 1 min):

- a página carrega no harness. Nas duas épocas, num mapa v6 com economia e o planejador forçado a começar em 0 s a cada 2 s, 25 s de partida rodaram sem erro e sem NaN, e o diário mostra decisões (o ninho na entrada da cidade-sede ordenado, a antiaérea esperando a produção, "nenhuma esquadra livre" na base);
- o servidor sobe e devolve 200 na página.

## Testado em 9f2a313: ok (tarefa cf-testar-ia)

- `tests/afp.js` (novo, no `tests/all.sh`): trincheiras no limite recusam outra trincheira com `fcap` e **não** impedem um ninho; ninhos no limite recusam outro com `postcap`, com o texto da página; o plano não age antes de `AFP.start`, dá a primeira ordem aos ~100 s pelo `genCmd` (um campo minado, com uma esquadra de guarda a 1,2 km), registra cada decisão em `C.afp.fl` e no diário, a obra fica pronta ~345 s depois e a ordem fecha. Ok.
- Passaram: `tests/aid.js`, `tests/tmap.js`, `tests/sappers.js`, `tests/eco-war.js`, `tests/w13.js`, `tests/squads.js`; online, sozinhas: `forts-online`, `sappers-online`, `orders-online`.
- `tests/forts.js` (1 falha de antes do #53 e 7 do #70), `tests/posts.js` (1 de antes do #53, 1 do #70): bisect com o teste de cada commit; nenhuma vem deste pacote. `tests/orders.js` (3): checagens de ponto exato no caminho, a mesma causa do movimento orgânico (#68) vista no `approaches.js`, fora deste pacote. `tests/campaign.js`: com o plano desligado a falha restante é a mesma (não é do AFP).
- Partidas no harness (1944 12 min, hoje 15 min): ninho na entrada da cidade-sede e posto anticarro prontos; ordens com construtor a 600-2.000 m; a economia poupando para a obra ("a economia poupa 40 de energia e 60 de metal"); muitas recusas por "nenhuma esquadra livre a menos de 2,5 km".

## O que NÃO foi testado

- A medição antes/depois por minuto e por lado (obras por tipo, minas, antiaéreas fixas) em partidas de 15 min ou mais.
- A antiaérea fixa saindo da reserva depois da falta, os campos minados pelo tráfego, o ninho no gargalo (nível 2), a reconstrução de obra perdida e o efeito da poupança na produção.
- Online com o anfitrião num navegador, e o custo por quadro do plano.

## Riscos

- **Suítes que podem quebrar:**
  - `tests/aid.js`: a partida IA × IA do fim e as cenas com `S.over` falso. O plano pode tirar a esquadra `base` (a reserva) para construir.
  - `tests/orders.js` e `tests/w13.js`: o lado 1 da IA pode pegar esquadras criadas pelo teste depois de 90 s.
  - `tests/tmap.js`, "a partida igual com e sem o mapa": deve continuar igual, porque o tráfego e os gargalos só entram no nível 1 ou 2 e com hábitos vistos, mas pode divergir.
  - As comparações de paridade (`PARITY=`, `BEFORE=`) mudam de propósito: a IA agora constrói.
- **Mudança de regra:** `fcap` agora vale só para trincheiras e parapeitos. Um teste que esperava `fcap` para um posto vai receber `postcap`, ou `ok`.
- **Equilíbrio:**
  - tirar esquadras de linha ou de guarda por até 8 min pode enfraquecer a defesa dos pontos;
  - a poupança da economia pode atrasar a reserva;
  - postos e minas podem frear os ataques do outro lado.
- **Recusas no diário:** a "posição antiaérea aguarda produção" se repete a cada 30 s (o diário corta a repetição com `GEN.dup`).
- **Minas perto da base:** um campo minado não fica na estrada a menos de 1350 m da própria base (`SAP.base`), então a entrada da base raramente ganha um.

## Como testar depois

1. As suítes que tocam a região:
   ```
   SECS=240 node tests/aid.js
   node tests/orders.js
   node tests/w13.js
   SECS=60 node tests/tmap.js
   node tests/forts.js
   node tests/posts.js
   node tests/sappers.js
   node tests/production.js
   SECS=300 node tests/campaign.js
   node tests/eco-war.js
   ```
   E as online: `node tests/forts-online.js`, `node tests/sappers-online.js`, `node tests/orders-online.js`.
2. Medição antes/depois (o pedido original): uma partida IA × IA por época, mapa v6, economia ligada, 15 min ou mais, contando por minuto e por lado as obras por tipo (`S.forts` com k 3, 4, 5 e 6, sem `pre`), as minas (`mines()`), as antiaéreas fixas (`u.fixed && u.kind === 'aa'`) e as linhas "Plano de fortificação" do diário (`S.glog.l[t]`). Rode com a página de `main` antes deste PR (`PAGE=<cópia antiga>`) e com esta. Um roteiro pronto está no histórico da tarefa (`measure.js`): `H.load({ seed, mapv: 6, eco: true, lg: 1, rec: 1 })`, `C.watch(era, {})`, `C.run(60)` por minuto. O que esperar:
   - em até 5 min, cada lado tem um ninho na entrada da cidade-sede e uma antiaérea sobre ela;
   - um inimigo conhecido numa entrada traz o posto anticarro e o campo minado nesse eixo.
3. Testes a escrever (sugestão, em `tests/aid.js` ou uma suíte nova `tests/afp.js`):
   - num campo vazio do mapa v6 (`field`), com uma esquadra `eng` perto da cidade-sede, `afpPlan(0)` ordena o ninho na entrada e ele fica pronto;
   - inimigo blindado conhecido na entrada: posto anticarro e `mineat` nesse eixo;
   - obra destruída: refeita depois de `AFP.redo` com o lugar calmo;
   - economia sem reserva: `C.afp.save` aparece e o `ecoAI` segura o `make`;
   - `GC.fort` com um posto acima do limite responde `postcap`, e 6 trincheiras não impedem um ninho.
4. No jogo: "Assistir" no hangar, Tab, diário do general. Procure "Plano de fortificação" e veja no mapa as obras perto da cidade-sede.
