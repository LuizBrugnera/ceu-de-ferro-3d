# M4: emboscadas e ruas alternativas (não testado por completo)

Tarefa `cf-m4-emboscada`, pacote M4 da proposta de manobra do general (procedimentos P7, P8, P9 e P11), em cima do mapa tático (M1).

## O que mudou

Tudo num bloco novo no fim da parte de simulação de `Céu de Ferro 3D.html` (procure `M4 of the general's manoeuvre`), mais o desenho na Visão de General (procure `the general's view, M4`).

- **Caminho tático `tmWalk`**: A* no mapa tático do lado (células de 200 m), custo = 200 × (1 + 4·V + 2·F) × 0,75 na mata × 0,85 na estrada; água só passa numa ponte de pé ou num pontão. Usa a mesma cota de buscas do `footPath` (`difOf(t).fp`).
- **P7 `emb` Emboscada planejada** (`man k=ambush`): a estrada com hábito ≥ 0,4 que o lado viu o inimigo usar mais; o trecho com mais mata de um lado; linear numa reta, em L numa curva; assalto, apoio e até 2 seguranças, cada esquadra pelo caminho que o inimigo menos vê; chega ≥ 60 s antes da passagem prevista; silêncio até haver veículos na zona; sai pela rota de fuga em ≤ 60 s. Desiste se for descoberta (metade dos homens perdida) ou se a janela passar 2 vezes sem ninguém. Até 2 emboscadas por lado.
- **P9 `itd` Interdição da logística** (`man k=interdict`): a mesma emboscada numa estrada de suprimento inimiga com horário conhecido (≥ 2 passagens), no gargalo (camada k), e fogo de artilharia na hora prevista.
- **P8 `grd` Guarda da rua alternativa** (`man k=guard`): para os nossos pontos mais perto do inimigo, os caminhos dele pela rede (o mais curto e 2 alternativos); um entroncamento ou ponte cuja perda alonga o caminho dele 1,3 vez ou mais recebe uma esquadra (chegada escondida). Larga se o ponto cair ou se o inimigo ali for 2× mais forte. A guarda **não ocupa** vaga de manobra (`manMax`) nem entra no `MAN.share`: fica em `C.ops`, não em `C.man`.
- **P11 Contra-flanco**: quando a força de reação (QRF, `thbOpen`) responde a inimigo no flanco de um ponto nosso (≥ ~45° do eixo até o ponto inimigo mais perto), cada esquadra de flanco vai pelo lado que o inimigo menos vê, por caminho escondido; a hora H espera esse caminho; morteiro na abordagem dele na hora H.
- Pesos por doutrina (`M4.doc`) e personalidade (`M4.per`) aplicados dentro de cada tipo; o sorteio de gosto da partida (`MANW`) não mudou.
- Contadores `M4S()` (armadas, em posição, adiantadas, disparadas, sucesso, perdidas, descobertas, guardas, contra-flancos, e os motivos de recusa em `why`) e medidor de tempo `M4B.stat()`.
- `M4.on = 0` desliga tudo; sem mapa tático (`TM.on = 0`) também.
- Docs: README (Emboscadas e ruas alternativas; o Mapa tático deixou de dizer que ninguém o usa), MCP.md, ajuda do `man` em `mcp-general.js`, `tests/README.md`, `tests/all.sh`.
- `tests/tmap.js`: a comparação "mesma partida com e sem mapa" agora roda com `M4.on = 0` (o M4 lê o mapa).

## O que foi testado (antes da regra nova do capitão)

- `tests/ambush.js` passou inteiro (SECS=240 e SECS=0), nos dois mapas: caminho tático contorna uma faixa vigiada (0% à vista contra 24% no direto), nunca pela água; emboscada na estrada mais usada (a mais usada vence), chegada escondida, armada ~450 s antes da passagem, disparada por 2 caminhões, fuga em 33 s; honestidade (coluna não vista não gera hábito; hábitos do outro lado não vazam; mover inimigo não visto não muda o plano); interdição no gargalo com fogo na hora; guarda de entroncamento (ex.: Ponte 2 faz o inimigo rodar 14,6 km em vez de 3,8 km até Vila das Oliveiras); contra-flanco; ordens da pessoa; desligar.
- `tests/tmap.js`, `tests/campaign.js`, `tests/personality.js`, `tests/man-view.js`, `tests/man-b.js`, `tests/mcp-general.js`, `tests/tmap-relay.js` passaram.
- `gen-cmd`, `man-a`, `man-c` e `general` têm falhas **idênticas no `origin/main`** (rodados com `PAGE=` a página do main): já existiam, não são do M4.
- Smoke final: a página carrega e roda 20 s nos dois mapas sem erro nem NaN; o `server.js` sobe.

## O que NÃO foi testado

- **Depois da última rodada de testes** mudaram três coisas e só o smoke rodou: (1) a guarda saiu de `C.man` (não ocupa vaga de manobra); (2) os pesos de personalidade foram de `PERS.w` para `M4.per` (com isso `personality.js` passou, mas `ambush.js` não rodou de novo depois); (3) o limite de espera da emboscada virou "no máximo 600 s parada no sítio" (`MANT.emb.far`), em vez de 900/1200 s até a passagem.
- **Torneio A/B (D10) não feito.** Só 4 partidas de 15 min (1944, sementes 3 e 4, M4 ligado/desligado), antes das mudanças acima: com o M4, a IA abriu 1 emboscada planejada em 4 partidas-lado e 2–3 guardas por partida, mas os bloqueios (`blk`) caíram (a guarda tomava a vaga de manobra: daí a mudança 1). Inconclusivo; a segunda rodada (12 partidas) foi interrompida pela regra nova. O M0 (métricas `mv`/`ab`/`tr`) não estava no main.
- **Custo por quadro não medido com o M4 isolado.** Nas 4 partidas, `AIB.gen` subiu de ~2,3 para ~3,2–3,7 ms por quadro com o M4 ligado, mas as partidas divergem (mais homens vivos), então não dá para atribuir. O `M4B` foi criado para medir isso e não chegou a rodar. Uma busca `tmWalk` de 2,4 km custa ~0,5 ms no Node (1944).
- Partidas online (anfitrião e convidado), o desenho na Visão de General no navegador (rota pontilhada, barra na zona de morte, quadrado da guarda), e o modelo (MCP) mandando `man k=ambush|interdict|guard` de verdade.
- O contra-flanco numa partida real (o contador `p11` ficou em 0 nas partidas medidas) e a interdição com artilharia de verdade no alcance (no teste não havia canhão; só se viu o pedido).
- Dificuldade Fácil: os hábitos não são lidos (`look: 0`), então P7/P9 não acontecem nela (por desenho, não verificado em partida).

## Riscos

- Custo: até 3 `tmWalk` por avaliação de manobras do lado (a cada 20 s), mais `grdSites` (Dijkstra na rede, cache de 30 s). Pode pesar no orçamento W2 e cortar o teto de população.
- Guardas sem vaga de manobra: a IA pode prender até 2 esquadras por lado em guardas o tempo todo (cada sítio só volta após 300 s).
- A emboscada a caminho, se esbarrar no inimigo, dispara onde está (é o comportamento do `cmdSquad` para ordens `ambush`): conta como "descoberta".
- Espera longa no sítio (até 600 s + 2 janelas) prende esquadras que poderiam defender.
- `tests/tmap.js` agora compara com `M4.on = 0`; se outro pacote (M2) passar a ler o mapa, essa comparação precisa de outra chave.

## Como testar depois

```sh
node tests/ambush.js                 # o M4 inteiro + uma partida IA × IA por época (SECS=240; SECS=0 pula a partida)
node tests/tmap.js && node tests/personality.js && node tests/campaign.js && node tests/man-view.js && node tests/man-b.js
PAGE=<a página do main> node tests/man-c.js   # compare as falhas com o main (gen-cmd, man-a, man-c e general já falham lá)
```

A/B (D10), com o harness, partidas de 15 min, M4 ligado (1) e desligado (0), várias sementes e as duas épocas; compare `amb` (armadas/disparadas por tipo), `m4s`, `tk`, `held` e `aib.gen`/`m4b`:

```js
// node probe.js <era> <segundos> <semente> <0|1>
const H = require('./tests/harness'), { performance } = require('perf_hooks');
const [era, secs, seed, on] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5]];
const C = H.load({ seed, eco: 1, mapv: 6 }); C.$('globalThis').performance = performance; C.$('M4').on = on;
const S = C.watch(era, { len: 0 }); C.run(secs, null, 1 / 30);
console.log(JSON.stringify({ m4s: S.m4s, m4b: C.$('M4B').stat(), aib: C.$('AIB').stat(), tk: S.cq.tk }));
```

Na mão (navegador): Assistir uma partida de 1944, abrir a Visão de General (Tab) e procurar no diário "Emboscada planejada", "Interdição da logística", "Guarda da rua alternativa" e "Contra-flanco"; conferir o desenho (EMB/ITD/GRD) e, com o botão Mapa tático em Vigilância inimiga, que a rota pontilhada foge das áreas vigiadas. Como general, mandar `man` com `k: "ambush"` perto de uma estrada usada pelo inimigo e `k: "guard"` perto de um entroncamento.
