# cf-lag-2-alloc: menos alocação nos laços quentes do passo (não testado além do teste focado, da impressão digital e da medição)

Continuação da cf-lag (#170). Recomendação 4 dela: menos alocação por quadro (o heap subia a 1–1,3 GB antes de cada coleta maior). Os números e o método ficam em `/home/luiz/secondmate/data/cf-lag-2/`.

## O que a medição mostrou
Perfil de alocação sem navegador (amostragem do V8 com o que a coleta já recolheu; semente 11, "Assistir" moderna com três lados, mapa 11, de 60 a 90 s de jogo): **267,6 MB por segundo de jogo** no main. Os maiores:
- `stepShots` 34,8, `los` 22,6, `spotSd` 20,0, `stepMan` 11,2, `navAt` 9,4, `notice` 9,8 MB/s.
- `next` 12,9 MB/s: o resultado do iterador de cada `for (const x of lista)` quando o V8 roda a função abaixo do seu nível mais alto. Os maiores chamadores eram `stepShots`, `spotSd`, `fortStep`, `manThink`, `navAt`, `near`.

A amostragem do V8 põe o que uma função embutida (inlined) aloca na conta de quem a chamou. Por isso `stepShots`, `spotSd` e `los` somam o que `hgt`, `sees`, `hdist`, `safe` etc. alocam dentro delas: na maior parte números de ponto flutuante empacotados ao passar de uma função para outra, que reusar objetos não resolve. `navAt` é a grade de caminhos de cada cidade, feita quando um soldado chega perto dela: memória que fica, não lixo.

## O que mudou (`Céu de Ferro 3D.html`)
- Os laços quentes do passo leem as listas do mundo por índice: `for (let _i = 0, _l = S.men, m = _l[0]; _i < _l.length; m = _l[++_i])` no lugar de `for (const m of S.men)`. Só a cabeça do laço muda: visita os mesmos elementos, na mesma ordem, com a lista crescendo, encolhendo ou sendo trocada no meio, como antes, sem um objeto do iterador por elemento. Em `spotSd`, `spotRun`, `stepShots`, `fortStep`, `fortMen`, `supStep`, `ranOver`, `popUse`, `droneTouch`, `lodTier`, `foeIn`, `step`, `civLook`, `navAt`, `near`, `navPath`, `stepMan` e `wayTo` (63 laços). As funções do cérebro e do general ficaram de fora (outra frente as reescreve).
- `notice`: os sensores por um laço em vez de `VIEW[oc].forEach` com uma função nova a cada chamada, e o passo da escada por `ladK` em vez de outra função nova. A mesma conta, na mesma ordem.

Resultado no mesmo perfil: **258,0 MB por segundo de jogo (−3,6%)**: `next` 12,9 → 7,5 e `notice` 9,8 → 5,5 MB/s.

## Testado
- `tests/hot-loops.js` (um segundo, sem batalha): a forma por índice visita o mesmo que `for...of` numa lista que cresce, encolhe, é trocada no meio, tem buracos, e com funções criadas dentro do laço; as funções quentes a mantêm; o `notice` não cria função por chamada.
- Impressão digital de batalha (semente 11, 180 s, passos de 1/30 s, a cada 20 s: posições de soldados e veículos, obras, esquadras, operações dos três generais, número de sorteios): main × este ramo.

## NÃO testado
- Nenhuma suíte longa rodou (a cota de CPU da conta estava saturada por torneios).
- O que sobra da alocação (números empacotados entre funções em `los`, `stepShots`, `spotSd`) pediria embutir à mão `hgt` e outras funções pequenas nos laços: fica como recomendação, medida antes com o V8 (`--trace-opt`/`--trace-deopt`) para saber quais não são embutidas.
