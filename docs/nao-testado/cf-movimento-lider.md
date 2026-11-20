# cf-movimento-lider: o movimento orgânico por equipe e por técnica (não testado)

Pedido do capitão: refazer o movimento orgânico (#68) para que ele obedeça ao líder da esquadra, como a pesquisa do cérebro dos soldados definiu (um líder por esquadra, equipes, serviço de abrigo). "O melhor jeito de implementar isso, em vez de fazer gambiarras." Pela regra do capitão, nenhuma suíte foi rodada. Tudo abaixo está sem teste, salvo o smoke do fim.

## Referência

A doutrina de pequenas frações (manual de pelotão e esquadra de infantaria do Exército dos EUA, FM 3-21.8) tem três técnicas de movimento: deslocamento (contato improvável), deslocamento com vigilância (contato possível) e lances (contato esperado), e as formações de equipe: coluna, fila, cunha e linha. Usei essa divisão. Não achei código aberto que valesse reaproveitar: o que se aproveita está no próprio jogo, e foi isso que usei: `orgN`/`hash2` do #68 para o ruído, `ugPoly` (mapa v10) para o caminho, `cvPick` (P1, #127) para o abrigo e `say` (P1) para as falas.

## O que mudou

Tudo no `Céu de Ferro 3D.html`, numa seção nova `/* ---------- CEREBRO: movimento */`, logo antes da cena 3D (ainda na parte da simulação, então roda no harness). `MV.on = 0` volta ao `orgSlot` do #68.

O P0 (contrato) e o P3 (líder) ainda não estão no main. Por isso uso os nomes da seção 2.5 com um padrão para quando eles faltam: `q.tec`, `q.eq`, `O.tec`.

Ganchos no código antigo:

- `orgSlot` é embrulhado: com `MV.on`, o lugar do homem em movimento vem de `mvSlot`.
- `squadThink` é embrulhado: avisa o ANA quando a técnica muda e faz o líder de cada equipe falar nos lances.
- `setOrd` é embrulhado: a viagem para outro eixo (`O.trp`) é refeita pela ocultação.
- Uma linha dentro do custo de célula do `ugPoly`: `v *= mvWayK(...)`.

### 1. Formação por equipe e técnica

- **Equipes**: são as do `q.eq` (P0). Sem ele, a primeira metade dos homens forma a equipe A (a do líder) e o resto a B. Uma esquadra com menos de 4 homens é uma equipe só.
- **Técnica**: vem de `q.tec` (P3), senão de `O.tec` (a ORDEM do contrato). Sem nenhum dos dois, vale o padrão de distância do #68:
  - coluna → `desloc`;
  - cunha (inimigo a < 900 m e afins) → `vig`;
  - linha (assalto a < 350 m) → `lances`.
- **Formações**:
  - `desloc`: as equipes uma atrás da outra, cada uma em coluna escalonada; em fila na mata ou de noite.
  - `vig`: a equipe B 45 m atrás da A (no mínimo o comprimento da equipe mais um homem), cada uma em cunha; em coluna na mata.
  - `lances`: as equipes lado a lado, a 14 m uma da outra. Enquanto a âncora anda 30 m, uma equipe avança 60 m e a outra fica parada, e meio ciclo depois elas trocam (lances sucessivos). Cada equipe vai em cunha; num assalto, em linha, lado a lado. A âncora só anda quando o líder está perto do lugar dele (como antes), então o lance se regula sozinho.
  - Na troca do lance, o líder da equipe que sai diz "Avançar!" e o da que fica, "Cobrindo!".
  - Os exercícios (`q.bg`, como o `lances` do #36) continuam por cima de tudo isso.

### 2. Dispersão pelo terreno

Cada esquadra tem seu intervalo de 5 a 10 m entre homens no aberto (por `hash2`). O intervalo é 0,55× na mata ou no mato do mapa v10 e 0,6× de noite (`SKY.dark`), nunca abaixo de 2,5 m. Em ponte e vau a esquadra passa em fila, como antes. O ruído do #68 encolhe junto com o intervalo e quase some na fila.

### 3. Contato

A esquadra está em contato quando algum homem tem alvo ou está suprimido. Aí:

1. Se o P2 registrou `MV.pos(q, i, base, e)`, a posição dele manda.
2. Sem ele, o ruído só vale se o chão onde ele cai cobrir pelo menos tanto quanto o lugar da formação (`coverAt`). O homem vai para o melhor abrigo a até 7 m desse lugar (`cvPick`), sem repetir o lugar de um colega. A escolha vale 2 s enquanto o lugar se move menos de 3 m.

### 4. Rota por ocultação e fora da crista

- Todo caminho que o `ugPoly` refaz (o do comandante, os escondidos e agora as viagens) fica mais caro:
  - na célula aberta: até +60%, pela camada `o` do `TM` do lado;
  - na crista: até +150%. A célula conta como crista quando fica 3 m ou mais acima do chão a 60 m dos dois lados de alguma linha. Isso é calculado uma vez por terreno.
- A viagem de uma esquadra para outro eixo, numa técnica que não seja `desloc`, é refeita sobre o mapa v10 numa cópia, porque a viagem do `tripOf` fica num cache. A marcha administrativa (`desloc`) continua na estrada.

### 5. Determinismo

Nada usa `Math.random`: tudo vem de `hash2` e do estado. Duas execuções com a mesma semente terminam com os mesmos homens no mesmo lugar (conferido no smoke).

### Análise

Evento novo do ANA: `cb`, com `{ st: 'tec', q: <id da esquadra>, v: <técnica> }`, quando a técnica de uma esquadra muda.

## O que rodou (smoke de ~1 min por época, sem tela)

Pelo harness (`load({ mapv: 10, seed: 7 })`, `watch`, 60 s com dt de 0,1 s). Os scripts estão em `/home/luiz/secondmate/data/cf-movimento-lider/` (`smoke.js` e `probe.js`).

- **Moderno**: sem NaN; 37 esquadras; técnicas vistas: desloc 59 e vig 69. Duas execuções deram o mesmo hash das posições. O tempo foi de 26,0 s com `MV.on = 1` contra 24,7 s com `MV.on = 0`.
- **WW2**: sem NaN.
- **Lances**: a distância de cada homem ao líder ao longo de um ciclo ficou entre 13 e 68 m e é contínua (sem saltos).
- **Viagem de 1,2 km refeita pelo `mvWay`**: 1301 m, 17 ms, e o cache do `tripOf` ficou intacto. Nesse trecho não havia mato nem crista para desviar.
- `tests/sim-split.js` passou.

## O que NÃO foi testado

- Nenhuma suíte (`tests/*.js`) além do `sim-split`, nenhuma partida longa, nenhum A/B de baixas ou de tempo de chegada.
- Não foi visto na tela nem online.
- Não foi verificado se:
  - os lances, com equipes que correm 60 m enquanto a âncora anda 30, atrasam a esquadra demais. A âncora espera o líder;
  - o encaixe no abrigo em contato (`cvPick` a cada 2 s por homem) pesa numa batalha grande;
  - o custo extra da crista e do aberto deixa os caminhos do comandante (`O.wp`) e os escondidos longos demais. O `ugPoly` ainda corta em 1,5× o caminho dado;
  - as equipes do `q.eq` (P0) casam com o índice `A.i` do `slot` quando o P0 chegar;
  - `MV.pos` (P2) é o nome que o cf-p2-posicao vai usar. Ele precisa registrar a função ali.

## Riscos

- **Testes que medem posição ou tempo** podem mudar: os mesmos do #68 (emboscada, abordagens, pontes, logística, `drills.js`, campanha), mais os que usam caminhos do `ugPoly`, porque o custo mudou.
- **Assalto padrão agora vai em lances** (era uma linha que andava junta). Isso pode mudar o tempo e as baixas do assalto.
- **A distância entre equipes no `vig` (45 m)**: a equipe B pode ficar fora do alcance do fogo de apoio do `sqMan` ou fora da voz (`BRAIN.voz` = 45 m, P0).
- **Crista**: a amostra é de 4 linhas a 60 m. Num terreno ondulado pode marcar crista demais ou de menos.

## Como testar depois

1. `node tests/ambush.js`, `approaches.js`, `drills.js`, `squads.js`, `infantry.js`, `campaign.js`, comparando com o main de antes (`PAGE=<página antiga>`) e com `MV.on = 0`.
2. No console da demonstração IA × IA: `S.squads.map(q => [q.id, mvTec(q), q.men.map((m, i) => mvEq(q, i).t).join('')])`, e voar baixo sobre uma esquadra perto do inimigo para ver as duas equipes alternando os lances e ouvir "Avançar!"/"Cobrindo!".
3. Noite (céu "Noite") e mata: as esquadras devem andar mais juntas e em fila.
4. Contato: com um alvo, conferir `m.mvCv` dos homens. Os lugares não devem ter cobertura menor que o da formação.
5. Caminhos: `mvCrest` sobre um morro conhecido, e uma viagem com `q.tec = 'vig'` comparada com a do `tripOf`, olhando mato (`ugAt`) e crista ao longo do caminho.
6. A/B de 16 min `MV.on` 0 × 1: tempo de chegada, baixas na marcha e no assalto, custo por quadro (`AIB`).
