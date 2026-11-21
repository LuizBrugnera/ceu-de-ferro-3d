# cf-mapa-cidades: cidades nos mapas (não testado)

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): ok, com um conserto
- Navegador (Chrome headless, servidor em 127.0.0.1). Mapa do General em 1920 px (Assistir, Hoje, 3 lados): os nomes das aldeias e vilas aparecem (Aldeia do Açude, Aldeia da Várzea, Aldeia de Alto, Aldeia da Capela, Vila do Carrascal). Mapa de tiro em 1944 (Hummel, M): os nomes aparecem na prancheta (Aldeia do Açude, Vila do Moinho, Sede, Vila das Oliveiras, Três Pinheiros). Nenhum lote disfarçado da sede desenhado. Nenhum erro no console.
- **Conserto**: no mapa do General, a vila que leva o nome do ponto de conquista saía duas vezes (o nome apagado da vila em cima e o rótulo aceso do ponto embaixo). Agora `drawTownNames(…, pts)` deixa esse nome para o ponto, só no mapa do General. Os mapas de tiro, do drone e da batalha, cujos pontos são letras, continuam nomeando todas. Teste: `tests/town-names.js` (no `all.sh`).
- **Continua sem teste:** as pegadas tingidas no minimapa vistas de perto; o mapa do drone com zoom; partida online com dois humanos; mapas antigos sem `T.net`; a orientação das pegadas longe de estrada.

## O que mudou
- `Céu de Ferro 3D.html`: novas `burgAng`, `drawTownsFoot`, `townLabel`, `drawTownNames` (antes de `mapImg`).
- `mapImg` assa a pegada de cada lugar construído (`T.burgs`: vila-sede, vila, aldeia, povoado) como retângulo tingido (ru × rv) girado ao longo da estrada mais próxima. Vale para o minimapa (`mapCv`), o mapa de tiro/artilharia (`mapBig`), o mapa do drone e o mapa do General (`genImg`), que usam `mapImg`.
- Nomes desenhados ao vivo por zoom (`drawTownNames`): vila a partir de 30 px/km, aldeia 45, povoado 90; fonte 9–13 px, com fade. Usados no General (`gTerrain`, substitui a linha antiga que só nomeava `b.nm`), no mapa de tiro (`fpMap`) e no mapa do drone (`hudDroneMap`). O minimapa pequeno mostra só as pegadas, sem nome.
- Nome: `b.nm`, senão o nome do ponto do modo conquista (Vila do Moinho, Vila das Oliveiras), senão "Vila"/"Aldeia".
- Disfarce do W4 mantido: só se usa o tamanho do lugar; os lotes de instalação da sede (`T.lots`) não são lidos nem desenhados.

## Riscos
- Pegada retangular pode cobrir a estrada/ícones no minimapa em mapas pequenos.
- `townLabel` genérico ("Vila"/"Aldeia") repetido em vários lugares sem nome.
- Custo extra de desenho a cada frame nos mapas (laço curto sobre `T.burgs`).

## Como testar depois
1. `node server.js`, abrir `http://localhost:8080`, entrar numa partida (WW2 e moderna).
2. Minimapa (canto) mostra blocos tingidos nas cidades; Tab (General): dar zoom e ver nomes surgirem/sumirem; conferir 1280 e 1920 px.
3. Mapa de tiro (M, artilharia) e mapa do drone: nomes aparecem ao aproximar.
4. Conferir que nenhum lote de instalação disfarçado da sede aparece e que o modo conquista mostra Vila do Moinho / Vila das Oliveiras.
