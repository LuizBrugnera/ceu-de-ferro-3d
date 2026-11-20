# Cérebro P7: honestidade (não testado)

Tarefa `cf-p7-honestidade`, pacote P7 da pesquisa do cérebro do soldado (tabela 2.6). Pedido: a IA decide pelo que percebe, nunca pelas listas do mundo (`S.men`, `S.units`, `S.bombs`, `S.planes`). Um teste impede que essas leituras voltem.

## O que mudou

Tudo em `Céu de Ferro 3D.html`, numa seção própria `/* ---------- CEREBRO: honestidade (P7) */` logo depois de `belTop` (a parte "the unit's mind"). O P0 ainda não está no main, então a chave é `HON.on` (1 ligado; 0 traz de volta as leituras antigas, para o A×B). O código antigo continua lá atrás de `!HON.on`.

| Onde | Antes | Agora |
| --- | --- | --- |
| `squadThink`, `q.fd` | distância real ao inimigo mais perto (`S.units`, `S.men`) | `honFd(q, L)`: o contato **crido** mais perto (`q.bel`, da `belief`: os medidores dos próprios homens e o que o lado contou), visto nos últimos `HON.fresh` = 12 s, sem aeronaves (como antes) |
| `scan` dos veículos, `A.fd` | idem | `honFd(u, u)`, pela crença do veículo (`u.bel`) |
| Emboscada, `cmdSquad` | contava os inimigos reais na zona de morte | `honKz(q, kz, A)`: conta os **percebidos** na zona (veículo 2, homem ou não identificado 1, 9 no meio), com a mesma regra |
| Fuga de granada, `sqMan` | toda granada do mundo a ≤ 7 m | só a que ele **conhece** (`honNade`): vista no cone (±60°, ≤ 30 m, com linha), ouvida caindo a ≤ 5 m, ou o grito "Granada!" de um colega a ≤ 25 m que a viu (reage 0,35 s depois). Quem a percebe grita (`say(m, SAYC.nade)`). Granada do próprio lado conta como conhecida (quem jogou avisou "Lá vai granada!") |
| `listen()` | `o.ln` na posição exata do atirador | embrulhado: `o.ln` onde ele **ouve** o tiro (`honEar`): rumo com erro de 0,05 rad + até 0,2 rad com a distância (1,5 km) + 0,35 rad entre prédios (eco: 6 prédios a 60 m), distância chutada ±30% (±60% na cidade). O erro é do par ouvinte–atirador (o mesmo eco enquanto ficam no lugar), com um pouco de deriva a cada 2 s, para a média de vários tiros não convergir para a verdade. A posição só firma pela visão (degraus da percepção) |
| `drInc` | direção verdadeira ao atirador + ruído (quando o projétil não traz velocidade) | a direção do estampido ouvido (`honSrc` → `honEar`), com o mesmo ruído de antes por cima |

Ruído determinístico (`hash2`), sem `Math.random` nas funções novas.

### Ganchos no código antigo (para o PR e os pacotes paralelos)

- `squadThink`: `q.fd = HON.on ? honFd(q, L) : 1e9` e os dois laços antigos atrás de `if (!HON.on)`.
- `scan`: o `A.fd` do laço de `S.units` atrás de `!HON.on`; no fim `if (HON.on) A.fd = honFd(u, u); else` o laço de `S.men`.
- `cmdSquad`: `let n = HON.on ? honKz(q, O.kz, A) : 0` e os dois laços antigos atrás de `if (!HON.on)`.
- `sqMan`: `&& honNade(m, b)` na condição da granada.
- `drInc`: `const p = honSrc(m, by)` no lugar de `by` no ramo sem velocidade.
- `listen`: embrulho `listen = (g => () => ...)(listen)` dentro da seção (nenhuma linha antiga mexida).

### O teste: `tests/brain-honesty.js`

1. **Código**: recorta toda seção `/* ---------- CEREBRO:` da página e falha se `S.men`, `S.units`, `S.bombs` ou `S.planes` aparecer fora das funções de percepção liberadas (hoje só o embrulho de `listen`: o som do tiro é do mundo). Vale para as seções que os outros pacotes (P0–P8) trouxerem. Confere também que os seis ganchos estão lá e que as leituras antigas só rodam com `HON.on` 0.
2. **Exercício com `Proxy` em `S`**: duas esquadras e dois tanques em contato por 40 s, contando cada leitura daquelas listas feita dentro de `honFd`, `honKz`, `honBel`, `honEar` e `honNade`. Há um controle positivo (uma leitura de propósito é contada). Resultado: centenas de chamadas, zero leituras.
3. **Cada troca**: `q.fd` vazio para um inimigo ainda não percebido (a verdade dava 140 m) e certo depois de visto; o contato envelhece em `HON.fresh`; `A.fd` do tanque pela crença; a emboscada conta 0 para o tanque não visto e 9/2 para o visto; granada na frente vista, atrás não, perto ouvida, grito do colega com 0,35 s; `sqMan` foge só da conhecida (com a verdade fugia das duas); o erro do ouvido cresce com a distância e na cidade; `listen` e `drInc` usam o estampido.

`node tests/brain-honesty.js`: 26 ok, em ~1 min.

## O que NÃO foi testado

- A suíte inteira (regra do capitão). Rodei só o smoke (30 s de IA × IA nas duas épocas com `HON.on` 1 e 0, sem erro nem NaN), o teste novo e o A×B curto abaixo.
- Nenhuma partida no navegador nem online. As trocas rodam onde a IA roda (o anfitrião). O convidado não muda.
- `tests/ambush.js`, `drills.js`, `inf-drills.js`, `veh-drills.js`, `squads.js`, `infantry.js`, `perception.js`: alguns podem depender de `q.fd`/`A.fd` verdadeiros (por exemplo, um exercício que espera a esquadra parar a 260 m de um inimigo que ela não chega a ver).

## A×B curto (linha de base)

Seis sementes (ww2 e modern, 1–3), partidas de 8 min, `HON.on` 0 × 1, com `nice`. Os números estão no PR. Se a IA ficou mais burra num ponto, o ajuste certo é na percepção (quem chama `notice`, o alcance de `told`), não voltar a ler a verdade.

## Riscos que vejo

- **Parar e acelerar**: `q.fd` comanda parar (`IAI.hold`, 260 m), o passo, a formação, a pressa, a ajuda e a emboscada. Agora a esquadra só para quando seus homens (ou o lado) perceberam o inimigo. Em mata ou à noite ela chega mais perto antes de parar, e um contato visto fica 12 s depois de sumir (antes sumia na hora).
- **Emboscada**: só dispara pelo que os homens dela veem. Deitados e escondidos, eles podem ver menos e disparar mais tarde. Se o A×B mostrar menos emboscadas disparadas, olhar o `notice` deles.
- **Granada**: uma granada atrás de um soldado sozinho, a 5–7 m, não o faz correr. É o que se quer, mas vai haver mais baixas por granada.
- **Ouvido**: `drIncAt` acha o lugar do fogo pela média dos tiros ouvidos. Com o erro novo, a chamada de fogo (fogo distante) cai mais longe do atirador, principalmente na cidade.
- **Fica com a verdade**: `lodTier` (só a cadência); o ramo de `drInc` com a velocidade do projétil (o próprio projétil indica de onde veio); o `impact` (±15 m) e o `boom`; e `cmdSpring`, `blkSpring` e `embSpring`, que escolhem o primeiro e o último veículo da zona pelas listas (`op.first`/`op.last`). Esses três ficam para um próximo passo (devem usar `q.bel`). A `belief` existente ainda apaga um contato quando o alvo morre (`t.dead`).

## Como testar depois

1. `node tests/brain-honesty.js`.
2. As suítes de IA comparando `HON.on` 1 × 0 (`$('HON').on = 0` no harness): `ambush.js`, `drills.js`, `inf-drills.js`, `veh-drills.js`, `squads.js`, `infantry.js`.
3. Torneio maior com `tools/balance.js` quando o P6 trouxer `--brain`, ou o script do A×B do PR com mais sementes e partidas Curtas inteiras.
4. No navegador: uma granada caindo atrás de um soldado distraído (ele não corre), um colega grita "Granada!" e então ele corre; na cidade, a esquadra sob fogo de longe se vira para um lugar errado até ver o atirador.
