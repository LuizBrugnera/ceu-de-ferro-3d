# Infantaria embarcada: a IA leva suas esquadras de veículo (o que ainda falta testar)

A seção `infantry rides (EMB, cf-infantaria-veiculos)` é chamada depois de `manRides` em cada plano do lado (`embRides`). A esquadra da IA com 1500 m ou mais de caminho (`EMB.far`) e sem inimigo perto pede carona. O veículo pode ser caminhão, blindado leve ou carro, ocioso, do pool, largado ou capturado (`rideFind`/`embFind`). A esquadra desce antes da mata, da vila ou do inimigo (`embDrop`). Um veículo armado fica como apoio de fogo, e o Insurgente manda uma técnica de escolta (`embEsc`). Sem veículo para 2,5 km, o lado pede um caminhão. A medição sai em `S.emb`, `embView(t)` e na pergunta `emb`. `EMB.ride = 0` é o "antes".

Testado (cf-pol-testes-a). Nos 60 s da partida de 3 lados (semente 7, mapa 9, economia; `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/m3.js`), a medição funciona, sem erro:
- **Lado 0**: 11 deslocamentos longos, 0 embarcados, 2 caronas dadas, 2 desistidas (motivos `vehicle` 1, `none` 1). O HEMTT ficou 47% do tempo em uso.
- **Lado 1**: 5 deslocamentos longos, 0 embarcados, 3 esquadra-segundos esperando, 1 desistida.
- **Lado 2**: 22 deslocamentos longos, nenhuma carona. O ZIL-131 ficou 34% em uso.
- Nenhuma carona chegou ao fim em 60 s. É cedo demais para medir a porcentagem.

## O que ainda não foi testado
- **`node tests/embarque.js`** (2 partidas de 8 min, A com `EMB.ride 0` e B com 1): não rodou. Sob a trava compartilhada, uma partida de 3 lados levou ~4 s de relógio por segundo de jogo, horas para o par. Conferir, quando der:
  - a % embarcada subindo de A para B;
  - `waitMax` ≤ `EMB.wait` + 120 s;
  - os Insurgentes com caronas no ZIL-131, no BTR-70 ou nas técnicas, e escoltas > 0;
  - os motivos de "why no ride".
- **O ponto de encontro "onde ela está"** (esquadra andando pelo eixo, `sP = 0`), nunca visto.
- **Pós-desembarque**: `manLand` refazendo a viagem; o veículo largado acordado (`embWake`) e largado de novo (`embPark`); o apoio de fogo e a saída depois de atingido (`tripStop`).
- **Requisição de caminhão** (`genCmd req`, no máximo um a cada 90 s).
- **Suítes que os ganchos afetam**: `trucks-base.js`, `squads.js`, `field.js`, `campaign.js`, `approaches.js`, `bridges-build.js`, `radio-general.js`, `sides3-start.js`, `brain-honesty.js`, `sim-split.js` e `frame-budget.js`. Comparar com a linha de base.
- **Torneio A×B**, o navegador (diário do general: "esquadra embarca em…") e online.

## Riscos (do autor, ainda valem)
- **Esquadras paradas** esperando carona até 240 s.
- **Mais caminhões rodando**.
- **Escolta insurgente** tirando técnica da defesa.
- **Requisição** gastando tíquetes.
- **Conflitos** com `cf-vbied` e `cf-manobra-reuniao`.
