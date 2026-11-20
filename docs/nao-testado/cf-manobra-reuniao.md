# cf-manobra-reuniao: a reunião do assalto cabe no prazo; o anaMano não cai com aresta nova

## O que mudou

- **Pool e prazo da reunião viraram um número só** (`Céu de Ferro 3D.html`, `const AP`).
  - O prazo (`op.formT`) continua sendo a caminhada da esquadra mais longe a `AP.pace` 2,5 m/s, mais `AP.slack` 60 s. O teto subiu de 400 s para `AP.form` = 900 s (o `CMD.formMax` de sempre).
  - O pool deixou de ser 3.000 m fixos. Agora é o que cabe no teto: `AP.pool = (AP.form − AP.slack) × AP.pace / AP.wind` ≈ 1.556 m em linha reta, com `AP.wind` 1,35 (quanto a caminhada é mais longa que a linha reta). É um getter, então muda junto se alguém mexer em `form`, `pace` ou `slack`.
  - Antes, o pool aceitava esquadras a 3 km, e em 400 s só chega quem está a ~850 m. 58% dos assaltos morriam em exatamente 400 s, com menos de 2 esquadras na reunião (veja o torneio de 30 min do #122).
- **O evento `ap` passou a medir a reunião:** `dj` (a caminhada de cada esquadra ao entrar, em m), `ta` (quando ela chegou à reunião, em s desde a abertura; −1 se nunca chegou), `fT` (o prazo, em s) e `fr` (quantas estavam lá quando a reunião terminou). Com isso dá para ver a velocidade real (`dj/ta`) contra os 2,5 m/s que o código supõe.
- **O `anaMano` não derruba mais o fim da partida.** Uma aresta nova da rede de estradas no meio da partida (ponte construída ou reconstruída) fazia o `tr` contar índices além de `hdr.net`. Isso dava `NaN` na contagem e `net[i]` undefined na revisão (`TypeError … reading '1'`). Agora a contagem cresce sem `NaN` (`anaMvLook`), e a revisão conta as amostras dessas arestas como estrada fora do eixo (`raw.nw`).
- `tests/ana-mano-net.js` (novo, no `all.sh`) reproduz o bug: falha no main anterior com o mesmo `TypeError` e passa agora.
- README: o parágrafo das abordagens diz ~1,5 km e o prazo pela caminhada até 900 s.

## O que NÃO foi testado

- Nenhuma suíte rodou (`tests/approaches.js`, `tests/procedures.js`, `tests/brain-pelotao.js`, `tests/ana-man.js`, `all.sh`). Só rodou `tests/ana-mano-net.js`, e o servidor subiu e entregou a página.
- A página não foi aberta num navegador: o chrome-devtools-axi estourou o tempo ao abrir a página de 4 MB. O harness headless carregou a página nova e jogou uma partida curta com ela.
- O torneio curto antes × depois (pedido do capitão para manobras) está no PR, com os números.

## Riscos

- `tests/approaches.js` e `tests/procedures.js` põem esquadras a 0,85 × `AP.pool` de uma reunião. Com o pool menor, as esquadras ficam mais perto e o cenário muda um pouco; os testes leem `AP.pool`, então devem seguir valendo.
- Com o pool menor, entram menos esquadras num assalto. Pode haver mais "Sem força para atacar" e assaltos com 2 esquadras em vez de 3, e o P1 precisa de 2 ou mais.
- O prazo de até 900 s deixa uma reunião longa parada mais tempo. Se a velocidade real for bem menor que 2,5 m/s, ainda haverá cortes: veja `dj/ta` no evento `ap`.
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
