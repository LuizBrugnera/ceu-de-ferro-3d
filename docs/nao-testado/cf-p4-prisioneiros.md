# Prisioneiros e informação (P4) (não testado)

Tarefa `cf-p4-prisioneiros`, o pacote **P4** da arquitetura do cérebro (`/home/luiz/firstmate/data/cf-cerebro-pesquisa/report.md`, seções 2.3, 3.2 e 4). Pedido do capitão: "prisioneiros dar informações", como no Defilade.

O P1 (#145/#146) já tinha um "P4 mínimo": a rendição pela moral, os estados RENDIDO e PRISIONEIRO, a captura (um inimigo a ≤ 5 m por 2 s) e o preso contando o que sabia 8 s depois, na hora, como avistamentos. Este pacote completa o resto sem duplicar: o P1 continua decidindo quem se rende e quando é capturado; o P4 assume a partir daí (`PRIS.on = 0` volta ao P1 mínimo).

## O que mudou (tudo em `Céu de Ferro 3D.html`, salvo os documentos)

Três seções novas, só por ganchos:

- **`the prisoners' world (P4)`** (antes da cena 3D): a percepção dos presos. `percGuard` (o captor que vê o rendido e pode ir buscá-lo) e `percSaw` (o que o preso sabia do lado dele: os homens da esquadra a ≤ `BRAIN.sinal` m e os homens e veículos do lado que ele via dali, com linha de visada).
- **`CEREBRO: prisioneiros (P4)`** (`PRIS`), logo depois:
  - **Escolta**: a cada 1 s, um rendido sem escolta ganha uma: um escolta que já leva presos a ≤ 12 m (até 3 presos), senão o homem mais perto de outra esquadra que o vê a ≤ 80 m (nunca o líder, se a esquadra tem outro homem de pé). O escolta vai até ele; a captura continua sendo a do P1 ("Mãos ao alto!"). O líder da esquadra do escolta recebe o relato `prisioneiro` do contrato.
  - **Os 5 S**: *revistar* (o escolta fica a ≤ 3,2 m por 3 s, "Mãos na cabeça!", e o preso perde armas e granadas; o jogador revista na hora); *silenciar* (o preso não fala: `brainSay` segurado); *separar* (presos a ≥ 4 m uns dos outros, o líder a ≥ 9 m); *proteger* (fora da luta como no P1; o escolta sob fogo ou num reflexo cuida de si primeiro e os presos esperam parados); *levar à retaguarda* (o preso anda na frente, para a base ou o QG mais perto do lado captor, e o escolta 3,5 m atrás, "Anda! Pra retaguarda!").
  - **Entrega**: depois de 80 m, ou a ≤ 90 m da base ou do QG, o preso é entregue à retaguarda: o escolta volta à esquadra e o preso anda mais 20 s e sai da batalha (como no P1: `killMan`, conta como perda do lado dele).
  - **Interrogatório**: na base, 20 s depois que ele chega (a viagem da entrega até a base a 6 m/s, entre 20 e 150 s), o general captor recebe **o que o preso sabia no momento da captura** (`prisKnew`): as posições daquele momento (até 10 m de erro, por hash), a ordem e o plano da esquadra dele e quantas posições do captor o quadro-negro dela tinha. Entram como avistamentos daquele momento (`seeBy` com a hora da captura: envelhecidos) e ficam no `C.known` do general por **300 s** depois do interrogatório (além do `CMD.mem` de 40 s), marcados `interrogatorio`. Linha no diário, aviso no alto da tela do lado do jogador, evento `interrogatorio` do cérebro. O preso nunca conta o que não sabia (squads fora da visada dele não entram).
  - **Sem escolta**: se o escolta cai, outro captor que o vê assume; sem ninguém por 20 s e sem captor percebido a ≤ 60 m, ele volta a ser só um rendido (e o P1 o devolve às armas se o inimigo sumir; revistado, vai atrás da arma de um caído).
  - **Regra da guerra** (README, "Civis e as regras da guerra"): matar um rendido ou um preso custa ao lado de quem matou os mesmos tíquetes de um civil (`CIV.toll`, 2), com aviso no alto da tela, linha nos diários dos dois lados, faixa "Crime de guerra" para o jogador que matou e o evento `crime`.
  - **O que o lado sabe** (`prisView`): os presos que tem (onde, o passo dos 5 S, o escolta, para onde vai), quantos fez e perdeu, os interrogatórios válidos e os crimes. Vai em `genVM` (`V.pris`, também para o general do convidado: `GENK`) e em `genState` (`pris`, que o MCP mostra em `get_state` como `prisoners`). O cartão da unidade diz "1 homem escoltando 2 prisioneiros para a retaguarda".
- **`the prisoners on the general's map and the HUD (P4)`** (depois da camada de túneis): a camada "Prisioneiros e interrogatórios" do mapa do general (anel com P, linha até o escolta, o passo; quadrados tracejados amarelos onde estava cada inimigo, "por interrogatório · há N s") e o HUD do jogador ("INIMIGO RENDIDO · chegue a 5 m e espere 2 s", "ESCOLTANDO 1 PRISIONEIRO · base a N m").
- **O jogador** captura como no P1 (5 m, 2 s); o preso o segue; perto da base ou do QG do lado ele é entregue para o interrogatório; afastando-se 45 m (ou entrando num veículo, ou caindo), a retaguarda o leva de onde está.

Ganchos: `brCaptive` (P1), `aiMan`, `brainSay` (P5), `cmdSense`, `step`, `killMan`, `genVM`, `genState`, `genCard`, `drawHud`, `GLAY` (nova camada), `GENK` (nova chave), `Object.assign(FALAS, …)` (falas `revista` e `escolta`). Fora do HTML: `README.md` (parágrafo "Prisioneiros"), `MCP.md` e `mcp-general.js` (`prisoners` no mapa do `get_state`), e o exercício `tests/brain-prisioneiros.js`.

## O que NÃO foi testado

Pela regra do capitão (implementar sem testes e documentar), só rodei o smoke: o script passa no `node --check`, o servidor sobe e entrega a página, o harness carrega a simulação e roda 30 s de IA × IA nas duas épocas sem erro, e o exercício `tests/brain-prisioneiros.js` uma vez (`N=1`, para o caminho do código novo rodar ao menos uma vez sem exceção): passou (presos, escolta, revista e caminhada, interrogatório com 5 posições verdadeiras na captura, nenhuma da esquadra a 700 m, o general com elas no `C.known`).

Não rodei: o exercício com mais sementes, nenhuma suíte (`tests/brain*.js`, em especial `brain-honesty.js`, `brain-falas.js`, `brain-soldado.js` e `brain.js`; `drills.js`, `infantry.js`, `squads.js`, `rec.js`), nenhum torneio A×B, nenhuma partida no navegador, nenhuma partida online, nada do MCP de verdade, nem a camada do mapa do general e o HUD na tela.

## Riscos que vejo

- **Escolta no meio do tiroteio**: o escolta só anda quando está calmo (supressão ≤ 0,45, sem reflexo, utilidade `cumprir`). Num combate longo o rendido pode ficar muito tempo de mãos para cima sem ninguém ir buscá-lo. Ao contrário, o escolta sai da esquadra por até ~80 m: uma esquadra pequena perde um fuzil por um minuto.
- **Andar do escolta**: usa o andar antigo (`brGo`), que para 1,5 m antes do alvo; na caminhada ele fica a ~9 m dos presos, que esperam quando ele passa de 10,5 m. Pode parecer "anda e para".
- **Honestidade (P7)**: `percGuard` e `percSaw` leem `S.men`/`S.units` numa seção que não é `CEREBRO:` (a percepção, como os estímulos do P1). O `brain-honesty.js` deve continuar passando, mas não rodei.
- **Falas (P5)**: duas falas novas por captura (`revista`, `escolta`) e o silêncio dos presos; o limite de falas por minuto do `brain-falas.js` pode mudar.
- **Interrogatório sem general**: sem `S.cmd` (sandbox) a informação vai só para `seeBy` e o diário.
- **Crime de guerra**: conta qualquer morte de rendido/preso pelo fogo de outro lado, inclusive artilharia e o fogo do próprio captor (como os civis). Se a IA bombardeia perto dos presos que ela mesma leva, ela paga. O convidado online não vê a faixa "Crime de guerra" (só o anfitrião simula).
- **Base longe**: com a base a mais de 900 m, o interrogatório chega até 150 s + 20 s depois da entrega; a informação já sai velha (é de propósito: envelhecida).
- **3 lados**: o escolta é sempre do lado de quem capturou; outro lado não assume o preso. Não testado com 3 lados.

## Como testar depois

1. `N=10 nice node tests/brain-prisioneiros.js` (o "pronto quando": esquadra cercada se rende, escolta, interrogatório com posições verdadeiras na captura e nunca as que o preso não sabia).
2. `nice node tests/brain-honesty.js`, `tests/brain-falas.js`, `tests/brain-soldado.js`, `tests/brain.js`, `tests/brain-drills.js` comparando com o main de antes (`PAGE=<página antiga>`); `PRIS.on = 0` deve deixar o P1 mínimo como era.
3. Torneio A×B fora do elrei (bartolomeu, ou aqui com `nice`): `PRIS.on` 1 × 0 nas mesmas sementes; contar `cb` `escoltar`, `revistar`, `retaguarda`, `interrogatorio`, `crime` no `ANA` e comparar vitórias e tíquetes.
4. No navegador, IA × IA numa vila: abrir a visão de general (camada "Prisioneiros e interrogatórios"): ver o P do preso com a linha até o escolta, e depois do interrogatório os quadrados amarelos "por interrogatório · há N s"; o diário "Interrogatório (Esquadra …): N posições inimigas de há N s".
5. De soldado: achar um inimigo RENDIDO, ver a dica no HUD, chegar a 5 m por 2 s, ver "ESCOLTANDO 1 PRISIONEIRO", andar até a base (entregue, interrogatório em 20 s) e, noutra vez, se afastar 45 m (retaguarda). Atirar num rendido: faixa "Crime de guerra", −2 tíquetes.
6. MCP: `get_state` com `refresh_map: true` deve trazer `map.prisoners` (`held`, `intel`, `taken`, `lost`, `questioned`, `crime`).
7. Online: o convidado general vê a mesma camada (chave `pris` no `gen`); o convidado soldado captura e escolta um rendido do anfitrião.
