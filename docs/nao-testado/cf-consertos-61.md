# cf-consertos-61: três consertos do general (NÃO TESTADO)

Origem: pesquisa de IA de código aberto (`/home/luiz/firstmate/data/cf-ia-opensource/report.md`, seção 6.1, itens 1-3). O item 4 (cúpula) é de outra tarefa.

## O que mudou (`Céu de Ferro 3D.html`)

1. **Laço do pelotão de defesa (P8).** `pelDefOf` não cria mais pelotão para um ponto que o lado não segura (`O.tw.hold !== q.team`). Antes ele criava e o `pelDefThink` encerrava no mesmo passo, ~11-14 mil `pel-forma` por partida.
2. **Base avançada nunca escolhida (#159).** Em `enpFobPick`, a distância `ENP.fob.apart` (700 m) vale só contra bases de suprimento, a base principal e outras bases avançadas. Contra pontos que o lado segura vale `ENP.fob.pt` (300 m), já que o ponto é justamente o que se quer firmar.
3. **Base avançada que falha ocupa a vaga para sempre (#159).** `enpEnd` com motivo (desistência: sem construtores, tempo esgotado, sem recursos) tira a base de `A.fobs`, e o lugar entra em `A.fobNo` por `ENP.redo` s (150 s), com raio `ENP.fob.bad` (300 m), para a próxima escolha não ser o mesmo lugar.

## O que NÃO foi testado

Nada além do smoke (servidor sobe e entrega a página; o harness carrega a simulação). Nenhuma partida, nenhuma suíte, nenhum torneio.

## Riscos

- Item 1: uma esquadra com ordem `hold` num ponto ainda não tomado deixa de ter pelotão de defesa até o ponto virar do lado (antes também não tinha na prática, porque o pelotão morria no mesmo passo).
- Item 2: com 300 m, bases avançadas podem cair muito perto de pontos já tomados e perto umas das outras de outro jeito; podem aparecer bem mais bases por partida (até `ENP.fob.max[tier]`), gastando engenheiros e recursos.
- Item 3: uma base que falha por falta de recurso pode ser tentada de novo em outro lugar a cada 30 s, gastando ordens e caminhadas dos engenheiros.

## Como testar depois (com `nice`, nunca no elrei)

Scripts do exercício: Apêndice do relatório ("Os scripts do exercício"), `probe2.js`.

1. `nice node probe2.js ww2 1 30 out.json` (1944, semente 1): `S.cbN['pel-forma']` deve cair de ~11-14 mil para dezenas.
2. Exercício sem tela tipo `fobcheck.js`: moderna, 15 min, IA × IA; contar `C.enp.fobs` e as falas "Base avançada" no log `eng` de cada lado: ≥ 1 base avançada por lado.
3. Forçar a desistência: depois da ordem `fob`, matar os construtores (`E.bq`); a base deve sair de `A.fobs` e, ~30 s depois (`ENP.fob.every`), uma nova escolha em outro lugar (≥ 300 m do que falhou).
4. Torneio curto (`tools/balance.js --torneio`, 12 partidas Curtas, `--nobudget`) contra o main anterior para ver se nada piorou.
