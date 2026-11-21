# cf-pol-modelos: aeródromos com portas, arcos e torre de verdade; o esconderijo do lado 3 desenhado onde ele está (testado em parte)

## O que mudou

O desenho dos aeródromos saiu de `buildWorld` para `baseScene(b, t)`, com o visual em `AFL`.

- **Conserto: o esconderijo do lado 3 era desenhado como um aeródromo.**
  - Nos mapas de três lados (versão 9 em diante, só na era moderna), a simulação (`genTerrain`) monta o esconderijo dos insurgentes com `BASE.ins`: dois galpões, uma oficina, um depósito, um bunker baixo e a bandeira, sem pista.
  - O desenho usava `BASE[S.era]` para todo lado. Assim, o lado 3 ganhava uma pista de 1 100 m, três hangares grandes e uma torre de 42 m onde não havia nada.
  - Os galpões e o bunker de verdade, que param tiro e veículo, ficavam invisíveis, uns 160 m dali.
  - Agora cada lado desenha a lista que a simulação usa, e cada prédio fica no chão do próprio objeto (`o.y`). O lado 3 não tem pista.
- **Hangar moderno:** quatro folhas de porta escuras na frente (voltada para a pista) e uma borda em volta do teto.
- **Hangar antigo (1944):**
  - o arco tem 20 lados e é liso (eram 10, facetado);
  - ganha seis costelas e portas escuras na frente.
- **Torre:**
  - a cabine é de vidro azulado no lugar do bloco claro;
  - ganha piso, teto, colunas nos cantos e no meio de cada lado, e um mastro.
- **Esconderijo:**
  - galpões com telhado de duas águas (metal cinza ou enferrujado), porta e duas janelas;
  - o bunker baixo com laje e seteira;
  - a bandeira na cor do lado (`foeCol`).
- As oito marcas da pista são uma malha só, não mais oito.
- Os detalhes de cada prédio também são uma malha só. O primeiro objeto de cada prédio continua o que fica como escombro (`lookObj`), e os detalhes somem com o prédio destruído.

## O que foi testado

- `node tests/airfields.js` (novo) roda `baseScene` da página contra um three.js que só registra as peças, numa partida moderna de três lados e numa de 1944 com dois:
  - cada prédio de cada lado é desenhado em cima do próprio objeto da simulação: o lugar até 0,5 m, o chão até 0,5 m e o tamanho que a simulação dá;
  - nenhum prédio é desenhado sem objeto;
  - o esconderijo não tem pista, e os outros lados têm a sua.
  - Na main o teste não roda, porque `baseScene` não existe lá. A demonstração ao vivo mostrou o erro: o objeto 220 (um galpão) estava em (14 671, −7 851) e o hangar desenhado em (14 612, −8 002).
- No navegador, GPU de verdade:
  - o aeródromo da demonstração moderna e o de 1944, de dois pontos, antes e depois;
  - o esconderijo do lado 3, antes (pista, hangares e torre) e depois (galpões, bunker e bandeira, cada um no lugar do objeto).
  - Imagens na PR.
- Custo dos prédios dos aeródromos:
  - moderno com três lados: de 21 malhas e 252 triângulos para 39 malhas e 1 292 triângulos;
  - 1944: de 14 malhas e 336 triângulos para 22 malhas e 7 860 triângulos (o arco liso e as costelas).
  - As marcas da pista economizam 8 chamadas por aeródromo, e o esconderijo sem pista outras 10.
  - Numa batalha (cerca de 630 mil triângulos à vista), isso não aparece.
- GPU de verdade, cena fixa sobre a cidade na batalha de demonstração, 2 rodadas alternadas de 15 s com a máquina carregada (carga ~12): main 14,5 / 15,6 fps, aqui 26,2 / 35,7 fps. Não há queda.

## O que NÃO foi testado

- Um aeródromo destruído aos poucos numa partida: os escombros do primeiro objeto e os detalhes sumindo.
- Os galpões do esconderijo atingidos (o tiro já parava neles; agora dá para vê-los).
- O mapa de três lados de outras sementes, além da demonstração e do teste.

## Como testar depois

1. Hangar, era moderna, três lados: voar até o esconderijo dos insurgentes e ver os galpões no lugar, sem pista.
2. Bombardear um hangar e a torre, e ver os escombros.
