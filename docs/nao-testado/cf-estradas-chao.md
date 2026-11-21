# cf-estradas-chao: estradas de chão alternativas (parte testada)

O que é: classe de estrada 3 (estrada de chão) a partir do mapa 8 (`RN.d8`, hoje no mapa 11), custo por classe (`RN.cls`, modo `trk` para lagartas), ritmo na terra (`DIRT`, `dirtK`, `tripLen`), traçado assado por `tests/roads8-gen.js`.

## Testado em cf-pol-testes-a (harness, mapa 11; todos ok)
- A rede: 1944 tem 11 arestas de chão (29,5 km), Hoje 13 (44,3 km); o mapa 7 não tem nenhuma.
- `node tests/roads8-gen.js` refaz exatamente as tabelas `RN.d8.way` da página nas duas épocas (11 e 13 estradas, 29,1 e 43,8 km, nenhum nó marcado), em 35 s.
- Custos por metro na terra: rodas 1,45, lagartas 1,1, a pé 0,95; `vehMode` dá `trk` ao tanque e `veh` ao caminhão.
- Uma viagem pela estrada de chão mais longa (4,81 km em 1944, 4,92 km Hoje) marca toda ela como terra (`dr`), e o prazo (`tripLen`) conta o dobro (9626 e 9848 m), o ritmo mais lento.
- `dirtK`: caminhão 0,7 (0,5 na chuva mais forte), tanque 1 (0,9 na chuva), fora da terra 1.
- Dirigindo de verdade (`tripMove`, ~5300 passos na terra): o caminhão anda 0,700 da velocidade dele na estrada de chão; o tanque, 1,000.
- Pontes nas estradas de chão: 1944 1 (de 7), Hoje 4 (de 10), como o doc dizia (+1 e +4).

## Ainda não testado
- Na tela: a fita de terra na cena 3D só apareceu depois do conserto do `cf-estradas-flutuando` (o índice da malha das estradas: antes só a primeira estrada de cada classe era desenhada); agora aparece em Hoje (`rd-dirt-road.png` em `ag3/proof` da tarefa cf-pol-testes-a). Falta: 1944, o tracejado nos mapas 2D e na Visão de General de perto, o FPS antes/depois.
- Se os generais de fato usam as estradas novas (fatia de tempo fora dos eixos, analytics `tr` por aresta, `MAPV=7` contra o atual, várias sementes): não medido. Risco ainda aberto: as arestas de chão entram no `fog` de `cmdEdges` (300 s sem tropa própria custa mais).
- A/B de ritmo dos comboios (`DIRT.wh = [1, 1]`, `RN.cls.veh[3]` 1,25) e o tempo de chegada da logística.
- Online: duas páginas novas na mesma sala (mesma rede e mesmas pontes); uma página antiga recebe o erro de versão.
- Os trechos de terra (`dr`) são escalados pelo arredondamento do caminho (`orgPoly`); o início/fim de cada trecho pode errar alguns metros (não medido).
