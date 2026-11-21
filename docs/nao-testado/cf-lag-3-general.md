# cf-lag-3-general: o perigo das estradas do general sem uma função nova por unidade (não testado além do teste focado, da impressão digital e da medição)

Continuação da cf-lag (#170) e da cf-lag-2 (#190, `planWarm`). Regra do tema: o código do general só pode ser tocado para tirar ou espalhar custo, sem mudar decisões, provado com a impressão digital de batalha de semente fixa idêntica. Os números e o método ficam em `/home/luiz/secondmate/data/cf-lag-3/` (`prof3.js`, `edgebench.js`, `out/prof-gen.jsonl`).

## O que a medição mostrou
Perfil de CPU sem navegador (semente 11, "Assistir" moderna com três lados, mapa 11, 60 a 120 s de jogo): o plano do general (`plan`) é pouco na média (~0,6% da simulação), mas roda inteiro num passo e entra nos passos mais lentos (até 50–80 ms de relógio). Dentro dele, **`cmdEdges` era 32% do plano**, e quase tudo numa linha: para cada aresta da rede de estradas, `mine.some(o => smp.some(p => ...))`, uma função nova por unidade do lado por aresta, para saber se alguma unidade está a menos de 300 m de alguma amostra da aresta (`C.es`; 300 s sem ninguém somam a névoa de guerra ao perigo `C.et`).

## O que mudou (`Céu de Ferro 3D.html`)
- `cmdEdges` guarda a caixa das amostras de cada aresta (no mesmo laço que já soma a influência) e pergunta a `cmdEdgeSeen(mine, smp, caixa)`, que faz a mesma pergunta em laços simples: uma unidade fora da caixa alargada em 301 m não pode estar a menos de 300 m de amostra nenhuma (sobra 1 m para o arredondamento) e custa quatro comparações; dentro dela, o mesmo teste de antes, na mesma forma (`Math.abs` nos dois eixos e `Math.hypot`). A resposta é um sim ou não sem efeito colateral, então a ordem em que as unidades são olhadas não muda nada.
- O laço das arestas continua `E.forEach`, a soma da influência e o `et[i]` continuam iguais.

## Resultado (as mesmas decisões)
- Por chamada, na batalha de verdade (40 s de jogo, 44 arestas, 40–43 unidades por lado, CPU da thread, lotes de 10, a antiga e a nova alternadas): **9,2–13,4 ms → 0,67–0,80 ms** (mediana), com `C.et` e `C.es` iguais número a número nos três lados.
- Impressão digital de batalha (semente 11, 120 s, a cada 20 s: posições, vida e mortos de soldados e veículos, obras, esquadras, operações dos três generais, número de sorteios): ver a PR.

## Testado
- `tests/general-edges.js` (um segundo): a `cmdEdges` da página contra a antiga, escrita no teste, em 60 redes aleatórias × 3 lados (9477 arestas), com unidades em cima da linha de 300 m, um fio dentro e fora dela, na diagonal, perto, longe, mortas, de outro lado, fixas, online, em NaN e em Infinity: `C.et` e `C.es` iguais número a número; e a linha de 300 m em si (ao longo, através, na diagonal). Falha no main.

## NÃO testado
- O outro embrulho de `cmdEdges` (os campos suspeitos e as minas conhecidas, `sus`/`mines`) ainda pergunta com `some(some())`: a lista dele costuma ter poucos itens. Ficou como estava.
- As suítes longas do general (`general.js`, `manobras`, `personality.js`) não rodaram com a conta disputada; `personality.js` chama `cmdEdges` direto e a prova aqui é a equivalência número a número mais a impressão digital.
