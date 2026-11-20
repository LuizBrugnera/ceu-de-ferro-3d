# cf-insurgente-civis: os Insurgentes ganham com civis, e os civis se juntam mais a eles — NÃO TESTADO

Pedido do capitão: "insurgente deve ganhar recurso ao matar ou recrutar civis, e civis devem ter mais chance de se juntar aos insurgentes".

## O que mudou

**`Céu de Ferro 3D.html`, bloco "the Insurgents and the civilians" (`ICV`)**, logo depois do fim da mente de guerrilha (`GRL`). Só mexe no código antigo por embrulhos. Só roda no anfitrião (ou no solo), numa partida com um lado Insurgente (`civIns() >= 0`: 3 lados na Frente atual). Com 2 lados nada roda e nada é sorteado.

- **Simpatia de cada vila pelos Insurgentes** (`S.icv.sym[bi]`, −1 a 1), recalculada a cada 5 s (`icvLook`):
  - base `ICV.sym.base` = 0,1;
  - memória (`mem`, cai à metade a cada 600 s): +0,12 por civil da vila morto por um lado regular (vingança; 40% disso nas vilas a até 1,5 km), −0,2 por civil morto pelos Insurgentes (terror; idem em volta), +0,02 por civil recrutado, −0,01 a cada olhada com ambulância/caminhão de reparo regular ali, −0,15 por saque;
  - estado agora: +0,5 × fração de casas destruídas; +0,12 com o ponto dos Insurgentes; +0,02 por soldado insurgente na vila (até 0,15); −0,015 por soldado regular que não matou 2 ou mais ali (até −0,2) e −0,12 com o ponto guardado por esse lado (a presença que protege); −0,15 com ambulância ou caminhão de reparo regular a até 300 m; +0,1 vila evacuada; +0,1 abandonada pelos lados regulares; +0,25 revoltada contra um lado regular (W14); −0,6 revoltada contra os Insurgentes.
  - Mudança de nível (hostil < −30%, neutra, simpática ≥ 30%, ardorosa ≥ 60%) vai ao diário insurgente (GUE) com os 3 maiores motivos.
- **Adesão sozinha** (`icvJoin`): cada vila que não odeia os Insurgentes, com mais de 2 pessoas em casa e simpatia acima de −20%, manda civis a eles na taxa de **0,2 + 1,5 × simpatia por minuto** (antes não havia adesão espontânea: só a milícia da vila revoltada a cada 150 s e o `mil` com 3 soldados). Até 12 por vila. Juntam-se 2 (ou 60 s depois do primeiro) e viram **milícia insurgente na vila** (`civTake` com os limites próprios: 8 por vila, 24 no lado); o que não cabe vai **para a base** (o civil sai e o lado ganha 18 energia + 12 metal cada).
- **Recrutar** (`genCmd` `rcr {pi | x,z}`, igual para a IA, a pessoa e o MCP; só Insurgentes): um soldado insurgente (não milícia) na vila e nenhum soldado regular nela. Leva **30 s**; interrompe se nenhum dos nossos fica ou se entra um regular. No fim, até 4 pessoas em casa aceitam cada uma com **45% + 45% × simpatia** (10% a 95%). Uma vez a cada 90 s por vila, até 3 ao mesmo tempo. Recusas: `ins`, `rcr0`, `rcrN`, `rcrMax`, `reg`, `hate`, `nociv`, `cool`.
- **Todo civil recrutado pelos Insurgentes** (rcr, adesão, `mil`, revolta, a tecla do jogador a pé) dá **8 energia + 6 metal** (embrulho em `civRecruit`).
- **Matar civis** (embrulho em `civToll`): os Insurgentes ganham **10 energia + 6 metal** por civil e, com `ICV.kill.free`, **não pagam os tíquetes** do W14 (EUA e Rússia continuam pagando 2). A simpatia da vila cai 0,2 (e em volta), e 5 mortes ainda viram a vila contra eles (`CIV.rage`). O diário junta as mortes de 6 s numa linha "Terror e saque".
- **Saquear** (`saq {pi | x,z}`, só Insurgentes): 3 soldados deles numa vila que não é deles e com simpatia ≤ 30%: +40 energia +30 metal, −0,15 de simpatia, alarme dos civis; uma vez a cada 240 s por vila.
- **Revolta a favor dos Insurgentes** (`civRevolt`): a vila que odeia um lado regular arma milícia insurgente a cada **75 s** (antes 150) e com os limites próprios. O `mil` do lado insurgente também usa esses limites.
- **General insurgente da IA (GRL)**, duas táticas a mais, pontuadas como as outras 23 (nota, peso da personalidade, gosto, top 5):
  - `rcv` Recrutar nas vilas: nota 0,5 + 0,5 × simpatia da melhor vila + bônus por vilas simpáticas e por estar mais fraco. Ação: com soldado na vila, `rcr`; senão manda a esquadra livre mais perto (até 4 km) por 180 s (`grlGo`).
  - `ter` Terror e saque: nota 0,3 + até 0,7 quando a economia está baixa (`X.eco < 1`) − 0,5 × simpatia média (quanto mais as vilas gostam, menos vale). Ação: `saq` com 3 soldados na vila hostil, senão incursão (`man raid`) nela. **Enquanto ativa, as regras de engajamento da IA insurgente não seguram fogo por civis** (embrulho em `roeBar`).
- **O que se vê:** aba Defesa (só no lado insurgente): botões Recrutar e Saquear (clique na vila) e a lista das vilas com nível, %, civis, quantos se juntaram e o porquê, e os totais. `genState(t).icv` (lado insurgente; o MCP lê com `get_state from_host: true`). Revisão pós-batalha: seção "Civis e Insurgentes" (`R.icv`). Eventos de análise `cv` com `c` = `icvj`, `icvl`, `icvr`.
- **MCP** (`mcp-general.js`): ferramentas `recruit_civilians` e `loot_town`, e as ordens `rcr` e `saq` na lista do `send_command`.
- **`tests/icv.js`**: a medição curta pedida (partida de 3 lados de 600 s: os Insurgentes recrutam ou recebem ≥ 4 civis, ganham recursos, a memória das vilas sobe depois das mortes regulares; e o pedágio: regular paga, insurgente ganha). **Escrita, mas não rodada** (regra do capitão). Fora do `tests/all.sh` (é lenta).
- README: um parágrafo na seção dos Insurgentes.

## Equilíbrio (números em `ICV`, todos chutados)

- Matar dá pouco por civil (10 + 6) e não custa tíquetes, mas cada morte tira 0,2 de simpatia da vila (e 0,08 das vizinhas): 3 mortes numa vila neutra a deixam hostil, a adesão para ali e o `rcr` cai para 10%; 5 mortes a viram contra eles (W14). Recrutar dá mais a médio prazo (8 + 6 por civil, mais o combatente).
- Saque (40 + 30) vale mais que matar, mas só em vila hostil, com 3 soldados, a cada 240 s, e tira 0,15.
- Com a taxa de adesão em 0,2/min numa vila neutra e ~1/min numa simpática, uma partida de 30 min com ~10 vilas povoadas pode levar dezenas de civis aos Insurgentes. O limite de 12 por vila e o "deixa 2 em casa" seguram o esvaziamento.

## Smoke feito (~1 min)

- `node --check` no script da página, em `mcp-general.js` e em `tests/icv.js`: ok.
- A simulação carrega no vm do `tests/harness.js`; uma partida de 3 lados na Frente atual (`watch('modern', { n: 3 })`, semente 7) rodou 20 s sem erro: `icvIns()` = 2, simpatia calculada para 31 vilas, `S.grlE` vazio.
- O servidor sobe em 127.0.0.1 e entrega a página (200).

## NÃO testado (todo o resto)

- Nenhuma suíte rodou, nem `tests/icv.js`, nem a regressão de 2 lados, nem online. A página não foi aberta no navegador (a aba Defesa nova, os botões e a seção da revisão nunca foram vistos).
- Nenhuma adesão, recrutamento, saque ou morte de civil foi vista acontecendo; nem as duas táticas novas do GRL sendo escolhidas.
- O jogador insurgente recrutando com a tecla (só ganha recursos pelo embrulho; o resto é o de antes).

## Riscos

- **Esvaziar as vilas:** a adesão pode ser forte demais (as vilas ficam com 2 pessoas). Ajustar `ICV.join.base`/`k`/`cap`.
- **Muita milícia insurgente:** até 24 no lado (antes 9). Pesa no teto de soldados (`IAI.cap`) e no custo da IA por quadro.
- **`ter` desliga o ROE da IA insurgente** enquanto ativa: mais civis mortos por morteiro, IED e bombas, de propósito. Se ficar feio, `ICV.ter.roe = 0`.
- **Tíquetes na revisão:** o evento `cv kill` do W14 é gravado antes do reembolso, então a revisão ainda mostra os tíquetes "pagos" pelos Insurgentes por civis, que foram devolvidos.
- **Honestidade:** a simpatia é a verdade da vila (não o que o lado sabe); só o general insurgente a usa, e ela vem dos civis (informantes). Os lados regulares não leem nada novo.
- **Convidado online:** tudo roda no anfitrião. A lista da aba Defesa no convidado vem de `gorQ('state')` (o `genState` inteiro, a cada `GORQT`): pesado e não visto funcionando.
- `civTake` com `why` `ades`/`rcr` escreve também a linha de "Milícia de N formada" (DEF) além da linha do ICV (GUE): diário duplicado.
- `icvLook` percorre vilas × (soldados + veículos) a cada 5 s; com 3 lados e muitas vilas, conferir no `frame-budget`.

## Como testar depois

1. `node tests/icv.js` (ou `SECS=300 MIN=2 node tests/icv.js`): deve passar; ver no fim o diário insurgente com "Recrutamento", "Adesão", "Simpatia", "Saque", "Terror e saque".
2. Regressão de 2 lados (nada do ICV roda): `node tests/civ.js`, `node tests/civ-war.js`, `node tests/civ-online.js`, e `bash tests/all.sh`.
3. No navegador, partida de 3 lados como Insurgentes, Tab → Defesa: a seção "Civis: simpatia e recrutamento" aparece; Recrutar numa vila com um soldado seu; depois de 30 s o diário diz quantos aceitaram e a lista mostra "N conosco". Em EUA/Rússia a seção não aparece.
4. Console da partida: `civToll(S.civs[0], { team: 0 })` → `S.icv.mem[...]` sobe; `civToll(S.civs[1], { team: 2 })` → tíquetes do lado 2 iguais, `S.eco.d[2].en` sobe, simpatia cai.
5. Ambulância regular parada numa vila: a simpatia dela cai (motivo "ambulância ou caminhão de reparo do inimigo atende ali").
6. Revisão pós-batalha: seção "Civis e Insurgentes" com recrutados, adesões, mortos e saques.
7. MCP: `recruit_civilians` e `loot_town` com o modelo no lado insurgente; `get_state from_host: true` traz `icv`.
8. Online (anfitrião + convidado insurgente general): Recrutar pelo convidado chega ao anfitrião (`gcmd` `rcr`), a lista aparece no convidado.
9. Desempenho: `node tests/frame-budget.js` numa partida de 3 lados.
