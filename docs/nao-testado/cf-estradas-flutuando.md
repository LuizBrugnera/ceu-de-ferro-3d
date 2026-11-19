# cf-estradas-flutuando — estradas flutuando vistas de lado (NÃO TESTADO)

## O que mudou (`Céu de Ferro 3D.html`)
- `ROADH` 2,2 → 0,35 m (altura da faixa da estrada sobre o terreno). O `polygonOffset` já existente (por classe, `RN.off`) cuida do z-fighting. `manY` (pés do soldado na estrada) usa o mesmo `ROADH`, então segue coerente.
- Nova constante `BRDH = 2.2`: as pontes (`inD` do terreno e `yAt` dos blocos de ponte) mantêm a altura antiga.
- Malha da estrada: um vértice a cada ~12 m (era 45 m) e 5 vértices na largura (era 2). Os 2 vértices de borda ficam 1,15× mais largos e afundados (-0,05 m) no terreno, para a borda se fundir ao chão sem fresta; os 3 internos ficam a `ROADH`.
- Ruas da cidade: 0,45 → 0,3 m.
- Grafo de estradas e jogabilidade inalterados.

## NÃO testado
Nada foi rodado além de: o servidor sobe e o script principal do HTML faz parse. Não houve conferência visual, nem testes, nem partida.

## Riscos
- Pontes: a faixa agora passa a 0,35 m enquanto o tabuleiro está a 2,2 m; pode aparecer degrau ou rampa nas cabeceiras, ou faixa sob a água sob a ponte.
- Soldados na estrada (`manY`) ficam 1,85 m mais baixos: veículos/objetos que assumiam 2,2 m podem destoar.
- Muito mais vértices (~4× ao longo, 2,5× na largura): custo de geração/memória em mapas grandes (v8/v9).
- Borda mais larga (1,15×) pode tocar vegetação/casas; graus de qualidade gráfica e texturas procedurais (#63, #39) não foram conferidos.
- Z-fighting com o terreno em ângulo rasante à distância, com 0,35 m + polygonOffset.

## Como testar depois
1. `node server.js`, abrir a página, ir ao mapa v9 e ao v8 (estradas de terra).
2. Câmera baixa e lateral em: encosta, topo de morro, vale, cabeceiras de ponte; conferir que a estrada cola no chão, sem faixa flutuante nem fresta.
3. Alternar os níveis de qualidade gráfica; conferir z-fighting e a vegetação.
4. Soldados marchando na estrada: pés no chão, sem afundar ou flutuar.
5. `node tests/bridges.js`, `node tests/roads-ops.js` e `node tests/world.js`.
