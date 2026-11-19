# cf-mapa-cidades: cidades nos mapas (não testado)

## O que mudou
- `Céu de Ferro 3D.html`: novas `burgAng`, `drawTownsFoot`, `townLabel`, `drawTownNames` (antes de `mapImg`).
- `mapImg` assa a pegada de cada lugar construído (`T.burgs`: vila-sede, vila, aldeia, povoado) como retângulo tingido (ru × rv) girado ao longo da estrada mais próxima. Vale para o minimapa (`mapCv`), o mapa de tiro/artilharia (`mapBig`), o mapa do drone e o mapa do General (`genImg`), que usam `mapImg`.
- Nomes desenhados ao vivo por zoom (`drawTownNames`): vila a partir de 30 px/km, aldeia 45, povoado 90; fonte 9–13 px, com fade. Usados no General (`gTerrain`, substitui a linha antiga que só nomeava `b.nm`), no mapa de tiro (`fpMap`) e no mapa do drone (`hudDroneMap`). O minimapa pequeno mostra só as pegadas, sem nome.
- Nome: `b.nm`, senão o nome do ponto do modo conquista (Vila do Moinho, Vila das Oliveiras), senão "Vila"/"Aldeia".
- Disfarce do W4 mantido: só se usa o tamanho do lugar; os lotes de instalação da sede (`T.lots`) não são lidos nem desenhados.

## NÃO testado
- Nenhuma suíte, partida ou comparação visual. Só: sintaxe do script principal e a página abre sem erro novo.
- Aparência em 1280 e 1920 px; legibilidade e poluição dos rótulos; fade com o zoom.
- Orientação da pegada (`burgAng`): rota/estrada mais próxima; pode ficar torta em povoados longe de estradas.
- Online (sala com 2 humanos) e modo conquista; mapa v3/v5 versus mapas antigos sem `T.net`.

## Riscos
- Pegada retangular pode cobrir a estrada/ícones no minimapa em mapas pequenos.
- `townLabel` genérico ("Vila"/"Aldeia") repetido em vários lugares sem nome.
- Custo extra de desenho a cada frame nos mapas (laço curto sobre `T.burgs`).

## Como testar depois
1. `node server.js`, abrir `http://localhost:8080`, entrar numa partida (WW2 e moderna).
2. Minimapa (canto) mostra blocos tingidos nas cidades; Tab (General): dar zoom e ver nomes surgirem/sumirem; conferir 1280 e 1920 px.
3. Mapa de tiro (M, artilharia) e mapa do drone: nomes aparecem ao aproximar.
4. Conferir que nenhum lote de instalação disfarçado da sede aparece e que o modo conquista mostra Vila do Moinho / Vila das Oliveiras.
