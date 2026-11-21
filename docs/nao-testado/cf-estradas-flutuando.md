# cf-estradas-flutuando — estradas flutuando vistas de lado (parte testada; um defeito achado e corrigido)

O que é: `ROADH` 2,2 → 0,35 m (leito da estrada sobre o terreno), `BRDH` 2,2 para as pontes, fita com um vértice a cada ~12 m e 5 na largura (bordas 1,15× e enterradas 0,05 m), ruas da cidade 0,3 m.

## Testado em cf-pol-testes-a
- **Defeito achado e corrigido**: nas capturas de "Assistir" em Hoje as estradas fora da cidade não apareciam (câmera de lado numa encosta, perto de muros a 90 m da estrada, sobre a estrada de chão mais longa). Causa: a malha de cada classe guarda todas as arestas, e o índice dos triângulos passou (no #100) a ser contado do zero em cada aresta (`k = i * NC`); só a primeira estrada de cada classe era desenhada, as outras apontavam para os vértices da primeira (até 87% dos vértices fora de qualquer triângulo, triângulos de até 10 km). Agora a fita é `roadRibbon(E, hw, pos, idx)` (seção da simulação, ao lado de `ROADH`), que conta a partir dos vértices que já estão na malha; `buildWorld` chama ela por aresta.
- `tests/road-mesh.js` (novo): nas duas épocas e nas quatro classes, nenhum vértice fora de triângulo, nenhum índice fora da malha, nenhum lado maior que uma célula, leito a `ROADH` e bordas abaixo do chão. Com o índice antigo: 8 FAILED; com o conserto: all passed.
- `manY` usa o mesmo `ROADH` (conferido no código).
- Depois do conserto, no navegador headless (Hoje, `ag3/proof` da tarefa): a estrada numa encosta vista de lado a 22 m e de cima (`rd-road-slope-side.png`, `rd-road-slope-above.png`) cola no chão, sem faixa flutuante nem fresta; a estrada de chão aparece como fita marrom seguindo o terreno (`rd-dirt-road.png`); soldados na rua da vila com os pés no leito (`manY` 89,52 = chão 89,17 + 0,35; `rd-man-on-road.png`).

## Ainda não testado
- **Cabeceira de ponte**: na captura (`rd-bridge-head.png`) o tabuleiro (2,2 m) começa num degrau acima da faixa (0,35 m), como o risco previa. Não corrigido (seria uma rampa nova nas pontes). Como: câmera baixa de lado em cada cabeceira; se incomodar, rampa de ~15 m da faixa até `BRDH`.
- Pedras e moitas aparecem em cima da faixa da estrada principal (`rd-road-slope-side.png`); invisível antes do conserto porque a estrada não era desenhada. Ver se são só enfeite ou objetos que param veículos (geração das pedras/moitas perto de `onRoad`).
- Z-fighting em ângulo rasante de longe, os níveis de qualidade gráfica (Baixa/Média/Alta) e a vegetação na borda mais larga; 1944 (só Hoje foi visto depois do conserto).
- Custo de memória/geração da malha mais densa em mapas grandes.
- `node tests/bridges.js`, `node tests/roads-ops.js`, `node tests/world.js`: não rodados de novo (trava de memória da tarefa); a mudança não toca a simulação.

## Como testar depois
`node server.js`, "Assistir" em 1944 e em Hoje, câmera livre (F) baixa e de lado numa encosta, num topo de morro, num vale e numa cabeceira de ponte; alternar Baixa/Média/Alta no hangar.
