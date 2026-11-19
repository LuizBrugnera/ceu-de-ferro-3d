# cf-estradas-chao: estradas de chão alternativas (não testado)

## O que mudou
- `Céu de Ferro 3D.html`, **mapa versão 8** (`MAPV = 8`; salas com página antiga ficam no 7 pelo portão de versão do servidor). O mapa 7 sai idêntico ao do main (conferido por hash de alturas, tipos de terreno, objetos e rede).
- Nova classe de estrada **3 = estrada de chão** (`RN.w/bed/kind/pal/draw/off/cls` ganharam a 4ª posição; `BR.hp` também). Mais estreita (3 m de meia largura), leito próprio, não marca o terreno como estrada (`kind` 0: mata continua mata), tracejada nos mapas 2D e com fita própria na cena 3D.
- `RN.d8`: nós livres novos e estradas de chão por era, só a partir do mapa 8 (`rnNodes`/`rnEdges` em `roadNet`; nenhum índice antigo muda e nenhum nó novo fica numa estrada principal, então eixos e eixo central ficam iguais).
  - WW2 (11 estradas, ~29 km, nós D1–D4): ligação N4–S4 perto da base 0; JSE–D1–E (atalho a leste); S3–D3–T0 e D3–HS2 (paralela ao sul da estrada 0 e entrada sul da cidade T0); HS2–D2–S1 (paralela sudeste); N3–D4–HN2 (trilha de mata a noroeste); T1–HN2.
  - Moderno (13 estradas, ~44 km): N4–S4; S3–D1–T0 e D1–HS2 (paralela sul); AS–D2–S1 e JSE–D2 (paralela leste); N3–D3–HN2 (noroeste); HN2–T1; AN–D4–E e T1–D4 (paralela entre a estrada 1 e Cruzeiro–E).
  - Nomes dos nós: Encruzilhada do Capão, Porteira Velha, Encruzilhada da Olaria, Clareira do Carvoeiro.
  - As curvas foram calculadas offline por `tests/roads8-gen.js` (A* como o `roads-gen.js`, com penalidade por correr a menos de 550 m de outra estrada, por cidades e pistas). Nada de busca de caminho no carregamento.
- Custo por classe (`RN.cls`): rodas `veh` 1,45 por metro na estrada de chão (principal 1, secundária 1,25, trilha 1,8); **lagartas** usam o novo modo `trk` no mapa 8 (estrada de chão 1,1, trilha 1,4) em `tripTo` e `tripTac` (`vehMode`, `hullTracked` = tem `trackL`). A pé: 0,95.
- Ritmo (`DIRT`, `dirtK` em `tripMove`): numa viagem, nos trechos de trilha ou estrada de chão (`p.dr`, guardado por `tripOf` no mapa 8), rodas andam a 70% (50% na chuva mais forte, `S.wx.r`), lagartas a 100% (90% na chuva). O prazo da viagem (`tripLen`) conta esses trechos no ritmo mais lento.
- Tudo o que usa a rede pega as estradas novas sem mudança: `cmdEdges` (perigo por aresta), `tripOf`/`netPath`/`edgeCostOf`, M1 (hábitos de tráfego por aresta), M2 (caminhos a pé `cls.foot`), M4 (`grdSites`), M5 (`m5Edge`), W20 (pontes: cada travessia do rio vira ponte: WW2 +1, moderno +4; nome "da estrada de chão"). Lógica do general não foi mexida.
- `tests/roads8-gen.js`: ferramenta de desenvolvimento (não é teste) que gera as tabelas `RN.d8.way`.

## NÃO testado
- Nenhuma suíte, partida A/B ou baseline (regra do capitão). Só: sintaxe do script, mapa 7 idêntico ao do main, `genTerrain(era, 8)` nas duas eras (ids ≤ 65447, abaixo de 65536), 25 s de IA × IA por era no mapa 8 pelo sim sem DOM (sem erro), viagens de exemplo com trechos de terra (`dr`) e `dirtK` (caminhão 0,7/0,5 na chuva, tanque 1/0,9), e o servidor sobe e entrega a página (HTTP 200).
- **A página não foi aberta no navegador**: o Chrome headless deste ambiente não carrega a página (nem a do main; a aba fica em branco). A cena 3D das estradas de chão, o tracejado nos mapas 2D e o FPS não foram vistos.
- `tests/harness.js` está quebrado no main (`aarShow` e `m5Lg` só existem depois do marcador da cena 3D; vem do #60). Usei um carregador próprio com stubs e `LG.on = 0`. As suítes em `tests/` provavelmente não rodam até isso ser corrigido.
- Se os generais de fato passam a usar as estradas: a fatia de tempo fora dos eixos (medida antes: ~86% nos eixos, 0,7–4% fora) não foi medida de novo.
- Riscos:
  - Estradas de chão aparecem no `fog` de `cmdEdges` (aresta sem tropa própria por 300 s custa mais), então podem ficar pouco usadas até alguém passar por elas.
  - Mais alternativas baixam o valor dos gargalos do M4 (emboscadas/defesa em entroncamentos podem mudar de lugar).
  - Pontes novas (ids 100+) em estradas de chão podem atrair sapadores/engenharia do W20.
  - O traçado com grade de 100 m é sinuoso; em algum ponto a fita pode cortar mata, aldeia pequena ou passar perto de casas.
  - Rodas mais lentas na terra: comboios (logística, M5 com jitter) podem chegar mais tarde; o prazo da viagem foi alongado para não desistirem no meio.
  - Gerar o terreno ficou ~0,1–0,2 s mais caro em `roadIndex` (medido no node).

## Como testar depois
1. `node server.js` e abrir `http://localhost:8080`. Assistir (IA × IA) em WW2 e moderno. Ver na visão de general (Tab) e nos mapas 2D as estradas tracejadas e, voando baixo, as fitas de terra; conferir FPS antes/depois.
2. Desenho do traçado sem navegador: `node tests/roads8-gen.js` (gera `.work/roads8/map-<era>.svg`; deve reproduzir as tabelas `RN.d8.way` da página).
3. No console: `S.T.mv` (8), `S.T.net.e.filter(e => e.c === 3).length` (11 WW2, 13 moderno), `S.units.filter(u => u.trip && u.trip.p.dr)` (quem está na terra), `vehMode(u)`.
4. Medir de novo o uso dos eixos com a mesma medição do M0 (analytics `tr` por aresta, `h.net` lista a classe): `MAPV=7` contra `MAPV=8`, várias sementes e as duas eras.
5. A/B de ritmo: `DIRT.wh = [1, 1]` contra o padrão (tempo de chegada dos comboios); `RN.cls.veh[3]` 1,45 contra 1,25.
6. Online: duas páginas novas na mesma sala (mapa 8, mesma rede e mesmas pontes); uma página antiga deve receber o erro de versão.
