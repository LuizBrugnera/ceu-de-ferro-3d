# cf-manobra-reuniao: a reunião do assalto cabe no prazo; o anaMano não cai com aresta nova

## Testado em ffff56d (cf-pol-testes-b, 2026-11-20): parte, com falhas
- `tests/ana-mano-net.js`: passou. `tests/ana-man.js`: 25 de 26 (só a checagem de tempo, com a máquina cheia).
- `tests/approaches.js`: o pool novo passa ("the three squads near an assembly, not the one 4629 m from the nearest (AP.pool 2489 m)"), e o prazo também ("the forming up waits for the farthest walk (2.59 km): 707 s, from 300 to AP.form 900 s"). **Falham** a substituição da esquadra perdida na reunião e o "segue com 2 de 2" no fim do prazo (4 checagens), e na partida de 180 s nenhum assalto abriu. Detalhes e a falha da hora H (pelotão) em `cf-m2-abordagens.md`.
- `tests/procedures.js`: só a hora H do P1 falha, pelo pelotão (veja `cf-m3-procedimentos.md`).
- **Continua sem teste:** `tests/brain-pelotao.js` sobre este código, a velocidade real `dj/ta` numa partida longa, e o torneio antes × depois.

## O que mudou

- **Pool e prazo da reunião viraram um número só** (`Céu de Ferro 3D.html`, `const AP`).
  - O prazo (`op.formT`) é a caminhada da esquadra mais longe a `AP.run` 4 m/s, mais `AP.slack` 60 s. O teto subiu de 400 s para `AP.form` = 900 s (o `CMD.formMax` de sempre). `AP.run` vem da medição: as esquadras correm até a reunião a 4,6 m/s de mediana, e o código supunha 2,5. O `AP.pace` (2,5) continua valendo para a manobra e o reconhecimento.
  - O pool deixou de ser 3.000 m fixos. Agora é o que cabe no teto: `AP.pool = (AP.form − AP.slack) × AP.run / AP.wind` ≈ 2.489 m em linha reta, com `AP.wind` 1,35 (quanto a caminhada é mais longa que a linha reta). É um getter, então muda junto se alguém mexer em `form`, `run`, `slack` ou `wind`.
  - Antes, o pool aceitava esquadras a 3 km, e em 400 s só chega quem está a ~850 m. 58% dos assaltos morriam em exatamente 400 s, com menos de 2 esquadras na reunião (veja o torneio de 30 min do #122).
- **O evento `ap` passou a medir a reunião:** `dj` (a caminhada de cada esquadra ao entrar, em m), `ta` (quando ela chegou à reunião, em s desde a abertura; −1 se nunca chegou), `lv` (por que saiu antes: `d` morta, `b` rompida, `f` liberada, ou o tipo da op que a tomou), `fT` (o prazo, em s) e `fr` (quantas estavam lá quando a reunião terminou). Com isso dá para ver a velocidade real (`dj/ta`).
- **O `anaMano` não derruba mais o fim da partida.** Uma aresta nova da rede de estradas no meio da partida (ponte construída ou reconstruída) fazia o `tr` contar índices além de `hdr.net`. Isso dava `NaN` na contagem e `net[i]` undefined na revisão (`TypeError … reading '1'`). Agora a contagem cresce sem `NaN` (`anaMvLook`), e a revisão conta as amostras dessas arestas como estrada fora do eixo (`raw.nw`).
- `tests/ana-mano-net.js` (novo, no `all.sh`) reproduz o bug: falha no main anterior com o mesmo `TypeError` e passa agora.
- README: o parágrafo das abordagens diz ~2,5 km e o prazo pela caminhada (4 m/s) até 900 s.

## O que NÃO foi testado

- Nenhuma suíte rodou (`tests/approaches.js`, `tests/procedures.js`, `tests/brain-pelotao.js`, `tests/ana-man.js`, `all.sh`). Só rodou `tests/ana-mano-net.js`, e o servidor subiu e entregou a página.
- A página não foi aberta num navegador: o chrome-devtools-axi estourou o tempo ao abrir a página de 4 MB. O harness headless carregou a página nova e jogou uma partida curta com ela.
- O torneio curto rodou (exceção do capitão para manobras). Foram 8 partidas por lado, 22 min, sementes 1-8, no bartolomeu, sem o merge do main (o cérebro do soldado #145 e o que veio depois não estavam nas árvores medidas):

| 8 partidas | antes (main 32c800a) | depois |
| --- | --- | --- |
| Reunião cortada por prazo | 15, todos em 400-402 s | 2 (767 s) |
| Reunião pronta / segue com X de Y | 0 / 0 | 2 / 1 |
| P1 (e P2) na fase mv | 0 | 1 (+1 P2) |
| Assalto na hora H | 0 | 0 |
| Taxa de flanco pelo eixo verdadeiro | sem amostra | sem amostra |
| Assaltos planejados (inclui re-planejar após corte) | 25 | 11 |
| "Sem força para atacar" | 393 | 427 |

  Uma primeira versão com 2,5 m/s (pool de 1,5 km) teve 4 assaltos, 1 P1 em mv e 1 hora H, e mostrou o ritmo real de 4,6 m/s. Detalhes: `/home/luiz/firstmate/data/cf-manobra-reuniao/torneio-reuniao.md`.
- **A hora H e o flanco ainda não aparecem em 22 min.** Os assaltos abrem tarde, a reunião leva até 900 s e a partida acaba antes da preparação. Isso não foi medido em partidas mais longas.

## Riscos

- `tests/approaches.js` e `tests/procedures.js` põem esquadras a 0,85 × `AP.pool` de uma reunião. Com o pool menor, as esquadras ficam mais perto e o cenário muda um pouco; os testes leem `AP.pool`, então devem seguir valendo.
- Com o pool menor (2,5 km em vez de 3 km), "Sem força para atacar" subiu um pouco (393 → 427).
- Algumas esquadras quase não andam até a reunião (o p10 do ritmo é 0,6 m/s): é o próximo gargalo, e a causa não foi investigada. A caminhada real sai 1,1-1,9 vez a linha reta, então `AP.wind` 1,35 é otimista para parte delas.
- O prazo de até 900 s deixa uma reunião longa parada mais tempo. Se a velocidade real for bem menor que 4 m/s, ainda haverá cortes: veja `dj/ta` no evento `ap`.
- `AP.pool` agora é um getter. Quem fizer `AP.pool = x` não muda nada; mude `AP.form`, `AP.pace`, `AP.slack` ou `AP.wind`.
- O evento `ap` ficou alguns bytes maior.

## Como testar depois

```sh
node tests/ana-mano-net.js          # o bug do anaMano (PAGE=<página antiga> mostra a falha)
node tests/approaches.js            # o pool e o prazo (formT ≤ AP.form, o pool sem a esquadra longe)
node tests/procedures.js            # P1 e P2 chegam à fase mv
node tests/brain-pelotao.js         # o pelotão na hora H (#144)
node tests/ana-man.js               # o evento ap com dj/ta/fT/fr
sh tests/all.sh
# torneio antes × depois (mesmas sementes, ≥ 20 min de jogo), em cada árvore:
nice -n 15 node tools/balance.js --torneio 8 --era all --min 22 --len 0 --eco --lg --rec --nobudget --mapv 11 --seed 1 --jobs 4 --save <lado>/matches --json <lado>.json
```

Nas partidas, compare: assaltos que chegam à hora H, P1 na fase `mv` ("Fixar e flanquear em …: a manobra sai"), cortes "demorou demais", "segue com X de Y", taxa de flanco pelo eixo verdadeiro (`flankAtk` do `balance.js`), e no `ap` a velocidade real `dj/ta`.
