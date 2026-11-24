# cf-general-melhorias: o general ataca o que ameaça a sede, junta força e sai da reunião (testado sem tela; NÃO jogado)

Responde ao relatório `cf-general-sede` (as decisões dos generais IA × IA em 3 lados). Tudo num pacote, o bloco `GSM` de `Céu de Ferro 3D.html` (depois do fim da sede), com a chave `GSM.on` (0: o general de antes; os três defeitos ficam consertados com qualquer valor).

## Defeitos consertados (relatório, seção 11)

- **Diário inundado pela sede inimiga.** `C.sedeW` guardava um inimigo só; com dois, "Assalto à cidade-sede inimiga … ainda não" saía a cada turno (600–1100 vezes por lado e partida). Agora `C.sedeW[f]` por inimigo, e a mensagem só se repete quando muda o *tipo* do motivo (`far`, `pool`, `weak`, `fail`; o texto tem números que mudam todo turno) ou a cada `SEDE.again` s.
- **Contadores de trincheira e prédio com 3 lados.** `fortMen` zerava só `f.in[0]` e `f.in[1]` (o `f.in[2]` dos insurgentes só crescia: 21 mil a 216 mil "ocupantes"); `bldMen` idem para `B.in`, e um prédio só com homens do lado 2 nunca entrava em `S.cbocc`. Os testes `f.in[1 - t]` e `B.in[1 - t]` (12 lugares) liam só um inimigo, e o lado 2 lia `f.in[-1]`. Agora `fill(0)` e `inFoe(l, t)` (todos os inimigos de t) / `inAny(l)`.
- **Insurgentes esperando antiaérea fixa para sempre.** A facção não tem modelo de antiaérea fixa (`S.E.sides[fac].aa` é `null`: a deles é técnica ou ZPU rebocada, tipo `car`), então o guarda-chuva antiaéreo do plano de fortificação nunca se cumpria, e cada tentativa contava uma falta para a economia (`d.miss.aaf`), que enfileirava antiaéreas fixas de novo. Agora `afpAAF(t)`: sem modelo, o plano não pede posição antiaérea.

## Comportamento (`GSM`)

| parte | relatório | o que faz |
|---|---|---|
| `mem` | 6 C | a força que o lado viu em cada ponto (`C.gsM[i].mx`, o máximo conhecido a 500 m, decaindo com τ 180 s); o `foe` do assalto é o maior entre o piso `CMD.guess`, o conhecido agora e essa memória |
| `src` | 6 A, ideia 2 | o ponto inimigo que ameaça a sede (ou a base): o das peças de fogo conhecidas a até 6 km da sede (artilharia, foguetes, morteiros), senão o dos atacantes conhecidos na sede, senão (sede atingida, atacante não visto) o ponto inimigo mais perto da sede. Por 600 s depois do último indício é o primeiro alvo (`cqAim`), o assalto a ele precisa de 1 para 1, a postura "defesa" da estrada não o impede, os tanques livres a até 9 km contam e vão (`m5Atk`), e enquanto não há assalto a ele, missão de fogo e foco aéreo a cada 90 s |
| `pull` | 6 B, ideia 1 | "Sem força para atacar" tira até 2 esquadras de postos quietos (sem inimigo a 600 m, sem ponto, base ou prazo) a até 4 km do lugar de reunião, a cada 120 s, enquanto menos de 4 esperam lá |
| `form` | ideia 3, (e) | o assalto em reunião pede fogo e foco aéreo no objetivo logo (antes da hora H); a reunião tem prazo duro (1,5 × `op.formT`, entre 240 e 420 s) e sai antes quando todas as esquadras pararam a menos de 300 m dos seus lugares |
| `arm` | 7, ideia 4 | 3+ tanques livres parados juntos (300 m) há 120 s atacam o ponto inimigo mais perto a até 4 km que não seja mais forte que o dobro deles, de posições de tiro em volta (`m5Spot`), com uma esquadra de escolta; entram quando o ponto fica quieto. `M5.atk.n` passou de 1/2 para 2/4 e o `cmdAttack` conta os tanques livres que o `m5Atk` pode mandar |
| `weak` | 9 | um ponto cuja força conhecida caiu abaixo de 30% do que o lado viu ali (8 no mínimo), com olhos do lado a 900 m, é "enfraquecido": primeiro alvo por 150 s, o resfriamento do assalto pulado uma vez, a ocupação com até 3 esquadras a até 4,5 km (não 2 a 2,2 km), 1 para 1, e até 2 tanques livres mandados |
| `rep` | ideia 5 | tanque ou blindado da IA abaixo de 50% sem alvo e sem base na própria estrada vai pela rede à base de suprimento mais perto (até 9 km), que o conserta |

## Por que o assalto ao Brejo não saía da reunião (e)

Rastreado nas partidas de referência (a reunião de cada assalto que passou de 120 s, a cada 30 s): as esquadras param a 170–190 m dos seus lugares de reunião (uma rastejando sob fogo, a outra parada no fim do caminho) e nunca chegam aos 60 m que `INC.op.ready` pede; o prazo da reunião é `op.formT`, a caminhada da esquadra mais longe, que chega a `AP.form` = 900 s; e no prazo, com menos de 2 esquadras "prontas", o assalto é cancelado. Então o assalto esperava até 15 min e morria. O `form` acima corrige pelos dois lados: prazo duro menor e "pronta" a 300 m.

## Medição (antes × depois)

Partidas sem tela IA × IA de 30 min no mapa 11 (o do jogo), com o amostrador `meas.js` (a cada 10 s). "Antes" é o `main` de 904b794; "depois" é este ramo antes do último merge do `main`. Médias por partida.

**3 lados** (EUA × Rússia × Insurgentes), sementes 1, 2, 3 e 5, as mesmas antes e depois:

| medida | antes | depois |
|---|---|---|
| soldados dos EUA a 1 km do Brejo: máximo (média das partidas) | 7,5 | 6,8 |
| soldados dos EUA a 1 km do Brejo: média no tempo | 0,95 | 2,04 |
| minutos com soldados dos EUA a 1 km do Brejo | 3,2 | 5,4 (semente 2: 20 min, 17 homens, 16 a 500 m) |
| tempo dos tanques da IA parados (sem alvo, < 15 m em 10 s) | 43% | 38% |
| tempo dos tanques da IA em operação (m5, emboscada, grupo blindado, reparo) | 1,8% | 19,8% (EUA 4 → 33%, Rússia 0 → 9%, Insurgentes 0 → 14%) |
| assaltos abertos / tomados | 1,5 / 0 | 2,75 / 0,5 |
| ocupações (ponto vazio) abertas / tomadas | 3,5 / 3,25 | 3,5 / 3,5 |
| operações que chegaram à hora H | 3,5 | 4,25 |
| canceladas antes da hora H | 1,0 | 1,5 |
| reunião mais longa | 882 s | 733 s |
| assaltos parados na reunião no fim da partida (total) | 2 | 1 |
| pontos que trocaram de mão | 4,5 | 5,5 |
| duração | 30 min (todas no tempo) | 30 min (todas no tempo) |
| vencedor | Rússia 3, EUA 1 | Rússia 3, EUA 1 |
| pontos no fim (EUA / Rússia / Insurgentes) | 6,2 / 6,8 / 4,0 | 6,8 / 6,8 / 3,5 |
| bilhetes no fim (EUA / Rússia / Insurgentes) | 1238 / 1250 / 1088 | 1238 / 1266 / 1021 |
| "ainda não" da sede inimiga no diário | 1676 | 33 |
| "posição antiaérea … aguarda" no diário | 107 | 5 |
| tanques perdidos nas 4 partidas (EUA / Rússia / Insurgentes) | 21 / 16 / 16 | 28 / 23 / 16 |
| infantaria insurgente perdida | 85 | 118 |

**2 lados** (EUA × Rússia): a semente 2 de antes e a semente 1 de depois caíram com o mesmo erro do `main` (`routeAt` por `mvSlot`, de `manThink`; também a semente 4 de 3 lados no `main`, não é deste ramo); ficaram sementes 1 e 3 antes, 2 e 3 depois. Na semente 3, a comum: tanques em operação 3% → 17%, assaltos abertos 2 → 4 (cancelados 2 → 4), reunião mais longa 903 → 424 s, pontos no fim 7 / 5 → 6 / 6, vitória dos EUA nas duas. Todas as quatro: tanques em operação 3,6% → 12,9%, parados 29% → 38%, assaltos abertos 1,5 → 4, reunião mais longa 903 → 657 s, EUA vencem todas antes e depois.

Leitura: nenhum lado dispara. Os vencedores são os mesmos, todas as partidas vão ao tempo, e os pontos no fim mudam no máximo um. Os tanques passam a trabalhar e os assaltos saem da reunião (a mais longa cai de ~15 min para ~11 em 3 lados, ~7 em 2), mas o preço aparece: mais tanques perdidos, e os Insurgentes (o lado mais fraco, que não tomou ponto nenhum em partida nenhuma, antes e depois) perdem mais infantaria e meio ponto. Em 2 lados os tanques parados sobem, porque os grupos blindados esperam o ponto ficar quieto. "Assaltos tomados" segue baixo: os assaltos abertos agora chegam à hora H, mas nas partidas de 30 min ainda não ganham.

## Também neste ramo

- **Paraquedistas (#256) perdiam a missão no primeiro contato.** O ensaio de contato (`cnStep`) põe de novo a ordem de segurar a posição, e `misOrd` trocava o "atacar" do lançamento por "defender", com a área no ponto da ordem. Já acontecia no `main`; `tests/paraquedistas.js` passava só porque, na semente dele, ninguém do lançamento morre. Agora uma esquadra lançada que segura a posição a menos de `MIS.r` da área mantém "atacar" e a área (linha nova no teste). E o pedido de força (`pull`) não tira uma esquadra lançada do ponto dela.

## O que falta

- Jogar: nada disso foi visto numa partida jogada por uma pessoa, só em partidas sem tela IA × IA e nos testes.
- `GSM.on` 0 × 1 nas mesmas sementes (a medição acima compara com o `main`, que também não tem os consertos).
- Mais sementes: são 4 partidas de 3 lados e 2 + 2 de 2 lados, e o resultado de uma partida muda com qualquer detalhe.
- O erro `routeAt` / `mvSlot` do `main` (uma partida em cada quatro ou cinco cai com ele).

## Como testar

1. `node tests/general-melhorias.js` (os três defeitos e cada parte do `GSM`).
2. A medição: um amostrador fora do repositório joga uma partida de `C.watch` (como o torneio de `tools/balance.js`), conta o que a tabela acima mostra a cada 10 s e salva os eventos como o torneio; `node tools/balance.js <pasta>` agrega esses eventos (colocação média em 3 lados, igual antes e depois: EUA 1,8, Rússia 1,3, Insurgentes 3).
3. `node tests/paraquedistas.js` (a missão do lançamento depois do contato).
4. No jogo: Assistir em 3 lados, Tab, diário dos EUA: "Ameaça à sede vem de O · Sítio do Brejo", "Fogo sobre …", "Pedido de força …", "Preparação antes da hora H …", "Grupo blindado …", "… enfraquecido", "… recua para reparar".
