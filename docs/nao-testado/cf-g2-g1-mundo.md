# cf-g2-g1-mundo: o modelo do mundo do General 2 (G1)

Pacote G1 do relatório `cf-ia-opensource` (seções 5.2 e 6): o terreno em regiões, 3 rotas diferentes por par, o valor de cada região e a crença honesta de cada lado. É a base que o planejador (G3) e a operação (G4) vão ler. Ninguém decide por ele ainda: o comportamento da partida é o mesmo com ele ligado ou desligado.

## O que mudou

- **Seção nova `GENERAL 2: mundo`** no `Céu de Ferro 3D.html`, logo depois do mapa tático (M1). Toca o código antigo só por ganchos: `newState` (monta o terreno no carregamento), `tmStep` (um pedaço por quadro, no orçamento dos comandantes), `addUnit` (o rol de veículos de cada lado) e `genQuery`/`genAnswer` (a pergunta `mundo`).
- **Interruptor:** `G2W.on` (1 por padrão). Com 0, nada roda, nada é montado e a pergunta responde `off`.
- **O terreno em regiões (`g2Ground`, `g2Job`).** As sementes são:
  - todo ponto de captura e base (cada um a sua região);
  - a cidade-sede de cada lado;
  - os gargalos do mapa tático (`k` ≥ 0,5: pontes e vaus, entroncamentos, saídas de vila);
  - as cristas (20 m acima do entorno);
  - as matas (10 células ou mais);
  - uma malha a cada 1,8 km para o resto.

  Nenhuma semente fica a menos de 900 m de outra, mas os pontos sempre ficam. Cada célula passável de 200 m vai para a semente a que se chega mais rápido a pé (um Dijkstra de todas as sementes ao mesmo tempo). Regiões vizinhas viram uma aresta pelo par de células mais rápido da borda, com o caminho, os metros, o tempo a pé, de rodas e de lagartas, e a parte de estrada e de mata. A aresta também guarda a cobertura média, o pior gargalo e se cruza ponte. `tt` guarda o tempo a pé de toda região a toda outra. Quando uma ponte cai ou um pontão sobe, o terreno é montado de novo aos pedaços, e o antigo serve enquanto isso.
- **As rotas (`g2Routes`/`g2Ask` aos pedaços, `g2Now` de uma vez).** São até 3 caminhos de uma região a outra, nas células. A primeira é a mais rápida. Cada uma das outras sai de um A* em que:
  - a célula a uma célula ou menos de um caminho anterior custa 4×, 7× e depois 13× mais, fora dos 600 m em volta da origem e do objetivo;
  - a rota entra no anel de 600 m do objetivo por um rumo a 45° ou mais de todas as anteriores, e de lá vai ao objetivo pelo caminho mais rápido;
  - a rota não passa de 1,8 vez a primeira.

  Cada rota guarda as células, as regiões que cruza, os metros, os tempos, o rumo de chegada, a sobreposição e o menor ângulo com as anteriores, e `div` quando difere de todas.
- **A crença de cada lado (`g2Sense`, a cada 4 s por lado).** Por região, guarda:
  - a força inimiga que o lado conhece (`C.known`, no lugar relatado `sX`/`sZ`). Ela cai à metade a cada 180 s, ou a cada 20 s onde há forças próprias olhando e nada é visto. Também guarda quando foi vista e o máximo visto de uma vez;
  - a força própria: as esquadras e os veículos do rol do lado, nunca a lista do mundo;
  - quem segura o ponto;
  - a vigilância e o tráfego inimigo do mapa tático;
  - o perigo (a força acreditada em cada região dividida pelo tempo até lá, como o `assess_danger` do Freeciv);
  - o valor: para guardar (`vo`) e para tomar (`ve`). Os pesos estão em `G2W.val` e são multiplicados pela doutrina (`G2W.dw`) e pela personalidade (`G2W.pw`).

  `g2Hyp(C, n, k)` sorteia n hipóteses do que o lado não vê: o máximo que já viu, menos o que conhece, mais 6. Isso se espalha nas regiões que ele não olha, com peso maior onde o inimigo segura ponto e do lado inimigo da frente. O sorteio é um hash do lado, de k e do relógio, nunca `Math.random`.
- **Paridade.** A pergunta `gask mundo` (página, `server.js` em `GASK`) e a ferramenta MCP `get_world_model` (`mcp-general.js` em `ASKS`, e o `MCP.md`) dão à pessoa e ao modelo o mesmo que o general tem.
- `tests/g2-mundo.js` (novo, no `all.sh`), README do jogo e `tests/README.md`.

## O que foi medido

### O critério do G1 (`tests/g2-mundo.js`, exercício sem tela)

Para cada par ordenado de pontos (origem e objetivo), contamos se há 2 rotas ou mais com sobreposição ≤ 40% e ângulo de chegada ≥ 45°. A sobreposição é a parte de uma rota a uma célula (200-280 m) ou menos da outra, nos dois sentidos, sem contar os 600 m das pontas.

| Mapa | Regiões | Arestas | Pares | Com 2 rotas diferentes | % | Pior ponto | Sobreposição (mediana) | Ângulo de chegada (mediana) | Mais longa / mais rápida | Terreno (ms) | Rotas por par (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1944, mapa 6 | 63 | 158 | 90 | 88 | 98% | 89% | 0% | 55° | 1,14 | 49 | 10 |
| hoje, mapa 6 | 138 | 389 | 132 | 131 | 99% | 91% | 0% | 54° | 1,15 | 95 | 21 |
| 1944, mapa 11 | 61 | 153 | 90 | 90 | 100% | 100% | 0% | 54° | 1,16 | 37 | 10 |
| hoje, mapa 11 | 133 | 367 | 272 | 270 | 99% | 94% | 0% | 50° | 1,11 | 70 | 19 |
| hoje, mapa 11, 3 lados | 133 | 367 | 272 | 270 | 99% | 94% | — | — | — | — | — |

Critério: ≥ 70% dos pares, e ≥ 70% dos pares de cada ponto. Passa em todos. Os tempos são do bartolomeu, carregado com os torneios.

### Honestidade (`tests/g2-mundo.js`)

- A seção não tem `S.men`, `S.units`, `S.bombs` nem `S.planes`.
- Um Proxy em `S` contou as leituras dessas listas durante 30 s de partida, com montagem, olhadas, hipóteses, rotas e resposta. Deu zero, depois de um controle positivo que conta.
- Um tanque inimigo não visto não muda nada. Relatado a mais de 3 km de onde está, ele conta na região do relato e não onde está.
- Fora da vista, a lembrança cai com a idade (6 → 5,3 em 30 s → 1,15 em 430 s).
- Uma instalação inimiga só vale para tomar depois de identificada.
- As hipóteses não chamam `Math.random`, e nenhuma põe inimigo onde as forças próprias estão.

### A mesma partida, ligado e desligado (`tests/g2-mundo.js`)

Em 60 s, nas duas épocas, com o relógio do medidor de quadros fixo, a partida é a mesma com `G2W.on` 1 e 0: unidades, homens, tíquetes, operações e número de eventos. Cada lado olhou a cada 4 s.

De informação: aos 60 s, cada lado tinha posto na sua crença 75-80% da força inimiga em campo (em `CMD.val`), em regiões onde acredita haver inimigo.

### Torneio curto antes × depois

Comando, no bartolomeu (nunca no elrei), com `nice`, igual para os dois lados:

```
node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 6 --seed 1 --jobs 6
```

Antes é o main `ab57ded`; depois, o ramo em `6da6b39` (o G1 sem o merge do #168). São 12 partidas Curtas, sementes 1 a 12, cada par das três doutrinas: 6 em 1944 e 6 hoje. A máquina estava com carga perto de 50 em 24 núcleos (o G0 rodava 16 partidas ao mesmo tempo), então cada partida levou de 1,5 h a 7 h de relógio.

1944 (as 6 primeiras):

| 1944, 6 partidas Curtas | Antes (main `ab57ded`) | Depois (G1 ligado) |
| --- | --- | --- |
| Partidas idênticas evento a evento (sem o cabeçalho) | — | **6 de 6** |
| Vitórias: lado 0, lado 1 | 5, 1 | 5, 1 |
| Como acabaram | tempo: 6 | tempo: 6 |
| Assaltos por partida (hora H, tomaram, recuaram) | 2,7 (0,5, 0,3, 0,3) | 2,7 (0,5, 0,3, 0,3) |
| Taxa de flanco; fora do eixo | 0%; 31% | 0%; 31% |
| "Sem força para atacar" por partida | 64,7 | 64,7 |
| Emboscadas por partida: armadas, disparadas | 5,5, 1,2 | 5,5, 1,2 |
| Entropia das chegadas | 0,1 bit | 0,1 bit |
| Tíquetes: sangria | 68% | 68% |

A época moderna (sementes 7 a 12) ainda está rodando: PENDENTE.

É o que se espera de um pacote que ninguém lê ainda: o G1 não muda a partida. O torneio mostra que ele não quebra nada nem desvia a simulação. Ele não mede o que o G1 vai valer quando o G3 e o G4 o usarem.

### Custo

- Terreno no carregamento: 37-110 ms (uma vez por partida).
- Rotas de um par: 10-36 ms em média, no pior caso 73 ms, em pedaços de 2.500 células por quadro, só quando alguém pede.
- Uma olhada: 0,15 ms (no pior caso 0,36 ms), a cada 4 s por lado.

- O custo do general por quadro sem `--nobudget` vem de 4 partidas de 10 min (`--docs balanced`, sementes 1 a 4), main e ramo rodando ao mesmo tempo na mesma máquina carregada:
  - general: 17,95 ms no main e 17,7 ms no ramo;
  - toda a IA: 115 ms no main e 109 ms no ramo.

  Com a máquina 20 a 25 vezes mais lenta que o normal, isso só mostra que o G1 não pesa de forma que se veja.

## O que NÃO foi testado

- **Ninguém lê o modelo ainda.** O que ele muda na partida (flanco, hora H, ataques à sede) só aparece quando o G3 e o G4 o usarem. O torneio só mostra que nada piorou e o custo.
- **As rotas não foram andadas por esquadras.** São caminhos de células de 200 m. Uma esquadra que siga uma delas ainda passa pelo `footPath` e pela navegação de sempre.
- **A crença não foi calibrada.** A medida de 75-80% é de uma partida de 60 s por época. As hipóteses (`g2Hyp`) não foram comparadas com a verdade, e o "+6" do desconhecido é chute.
- **Os valores (`G2W.val`, `G2W.dw`, `G2W.pw`) são chute.** Seguem a ordem do relatório (sede > cidade > vila > ponto; fábrica > usina > mina), sem calibração.
- **Ponte caindo no meio de uma partida de verdade:** só o exercício (6 quadros para montar de novo). Se a crença de um lado já existia, ela passa para as regiões novas pelo lugar.
- **Online:** a pergunta passa pelo `GASK` do servidor e o MCP a aceita, mas nenhum convidado perguntou de verdade. A resposta sem `x`, `z` tem cerca de 15 KB.
- **A página não foi aberta num navegador.** Não há nada novo na tela.
- **Veículo capturado** não entra no rol de quem o capturou: a força própria fica um pouco menor.
- **Bases de suprimento, antenas e cúpulas inimigas** não entram no valor para tomar, porque o lado não tem uma lista honesta delas. Só entram as instalações identificadas da economia e os canhões conhecidos.

## As outras suítes

Rodaram no main `ab57ded` e no ramo, no bartolomeu: `sim-split`, `relay`, `gen-relay`, `tmap-relay`, `tmap`, `approaches-relay`, `approaches`, `brain-honesty`, `frame-budget`, `mcp-general`, `sede` e `bridges`. Saíram iguais nos dois.

As falhas que aparecem já existem no main:
- `sim-split`: as declarações da visão RTS, e a cópia sem `.git`;
- `tmap`: a mesma partida com e sem o mapa, com o relógio real numa máquina carregada;
- `approaches`: 7 falhas;
- `brain-honesty`: uma seção CEREBRO que lê as listas;
- `mcp-general`: as recusas do funil;
- `gen-relay`: "a side that is none";
- `bridges`: um `TypeError` na linha 139 do teste.

Depois do merge do #168, o `tests/cupula-general.js` falha numa coisa: o lado 1 não pede cúpula em 12 min. Com o relógio do medidor fixo, ele falha igual no main `ffff56d`, sem o G1.


- O carregamento fica 40-110 ms mais longo.
- Cada objetivo pedido guarda uma árvore de chegada de 80 KB (só os pedidos).
- Pares muito perto (1,6 km) às vezes não têm a segunda rota dentro de 1,8 vez. É o caso de B → F no mapa 6.
- `G2W.on` 1 por padrão: se alguma coisa nova do G1 lançar exceção na partida, ela para o quadro do anfitrião. O torneio de 12 partidas e as suítes rodaram sem isso.

## Como testar

```
node tests/g2-mundo.js                      # MAPS=6,11 SECS=60
node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 6 --seed 1 --jobs 6 --json depois.json --ref antes.json
```
