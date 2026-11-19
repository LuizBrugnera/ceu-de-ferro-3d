# cf-movimento-organico: tropas e veículos fora da linha reta (não testado)

Pedido do capitão: "as tropas e tudo mais não devem andar todas na estrada em linha reta, deixe mais orgânico".
Pela regra de entrega, nenhuma suíte, baseline ou partida A/B foi rodada. Tudo abaixo está sem teste, salvo o smoke do fim.

## O que mudou

Tudo no `Céu de Ferro 3D.html`, numa seção nova `ORG`, logo antes de `slot`. `ORG.on = 0` desliga tudo e volta ao comportamento antigo.
Nada usa `Math.random`: todo sorteio vem de `hash2` (semente da esquadra, ordem de criação do veículo, distância na estrada). Só o anfitrião roda a IA, e os convidados recebem as posições pela rede como antes.

- **Esquadras em formação conforme a situação** (`orgSlot`, chamado pelo `slot` quando a esquadra está andando, sem posto e sem `q.bg`):
  - **coluna escalonada** (padrão): um homem de cada lado, a 7 m um do outro, cada um a 3,5–7 m do eixo (acostamento e terreno ao lado);
  - **cunha**: com inimigo a menos de 900 m, num caminho próprio pelo campo (escondido do PR #62 ou do comandante) ou em ordem cuidadosa (flanco, reconhecimento, isca, emboscada, `O.quiet`);
  - **linha**: em assalto com o inimigo a menos de 350 m.
  - Por cima: desvio próprio de cada soldado (±2,2 m de lado, ±2,5 m na frente), que muda suave a cada 45 m; uma "sanfona" de passo própria (±1,6 m); e a linha da esquadra inteira deriva até ±5 m do eixo (metade em coluna), para duas esquadras na mesma estrada não andarem na mesma linha.
  - Em ponte, vau ou margem (o lugar cai na água), o homem fecha a 1,2 m do eixo: a esquadra passa em fila.
- **Veículos no trilho** (`place`, `scan`, `moveUnit`):
  - a faixa (±5 m, já alternada na coluna) ondula ±1,6 m (±2,4 m para lagartas) ao longo da estrada; o nariz acompanha a ondulação;
  - troca de faixa é deslizada (1,5 m/s), não um salto;
  - a velocidade varia ±8% (ruído lento, ~45 s);
  - **ultrapassagem**: preso atrás de um mais lento na mesma faixa, passa para a outra faixa se ela estiver livre por 30 m. Não ultrapassa quem está parado (fila) nem com inimigo a menos de 1500 m;
  - **sair da estrada**: lagartas (tanque, artilharia) vão mais 9 m para fora em terreno aberto. Rodas só fazem isso sob ameaça (inimigo a menos de 1500 m), indo 5 m. Sob ameaça, o afastamento cresce 30%. O terreno só conta como aberto se o ponto ao lado e o ponto 25 m à frente estiverem secos, a até 2,5 m da altura da estrada e sem objeto a 5 m. O lado é conferido a cada 2 s, e o veículo vai até ele a 1,5 m/s.
- **Veículos em viagem** (`tripMove`/`placeOn`): mantêm 2,5 m para o seu lado do caminho, com ondulação. Começam no meio e saem devagar. Em ponte voltam ao meio.
- **Caminhos curvos** (`orgPoly`): os cantos de mais de ~20° viram uma curva de até 14 m de cada lado. Isso vale para os caminhos do `tripOf` (veículos e esquadras), os escondidos do `hideStep` e os do comandante (`O.wp`, no `setOrd`). Se o meio da curva cair na água, o canto fica (pontes e vaus não são cortados). O caminho é alterado no próprio array, uma vez só (`p.org`).

## O que rodou (smoke de ~1 min)

- `node --check` no script da página: ok.
- O servidor sobe em 127.0.0.1 e a página carrega no Chrome. A demonstração IA × IA roda; no console só os erros que já existiam (404 e a conexão recusada da sala).
- No console da demonstração: 900 passos de `step(1/30)` sem erro nem NaN. Soldados em movimento ficaram a 3–9 m do eixo, nos dois lados. Uma antiaérea de rodas sob ameaça saiu 5 m. Formações: 27 em coluna e 5 em cunha.

## O que NÃO foi testado

- Nenhuma suíte (`tests/*.js`), nenhuma partida longa, nenhum A/B, nenhuma medição de custo por quadro.
- Não foi visto na tela (o smoke foi pelo console).
- Não foi verificado se:
  - as esquadras ainda chegam no tempo de antes. O líder só avança quando está perto do seu lugar, e o lugar agora se mexe;
  - alguém trava em casas ou sebes. O lugar passa pelo `clearOf`, mas o soldado pode ficar enroscado no mato;
  - a coluna passa por pontes em fila de verdade;
  - a ultrapassagem não faz veículos se atravessarem (os do trilho não colidem entre si);
  - tanques fora da estrada atravessam árvores (veículos no trilho não usam `bump`; o teste de "limpo a 5 m" é só no ponto ao lado e 25 m à frente).
- Online com convidados: não testado.

## Riscos

- **Testes que medem posição ou tempo** podem mudar: emboscada, abordagens, pontes, logística, carona, `tests/drills.js`, o scout do tempo no trilho e os que usam `routeAt` em caminhos de viagem, porque o comprimento do caminho mudou com as curvas.
- **Caminhos já guardados**: `orgPoly` altera o array no lugar. Uma esquadra que já estava num `O.wp` quando ele foi arredondado tem o `q.ts` alguns metros fora. Isso se corrige sozinho no próximo trecho.
- **Faixa invertida pela ultrapassagem**: o `u.lane` muda de sinal. Código que conta com a faixa original de um comboio pode estranhar.
- **Custo**: `orgSlot` faz uma leitura de altura e um `routeAt` por chamada do `slot`. `place` faz um `routeAt` a mais. `orgWant` roda a cada 2 s por veículo de lagarta ou ameaçado, com `near()`.

## Como testar depois

1. `node server.js` (com `HOST=127.0.0.1`), abrir a demonstração IA × IA nas duas eras e voar baixo sobre as colunas. Conferir:
   - esquadras em coluna nos dois acostamentos, cunha perto do inimigo, linha no assalto;
   - veículos ondulando, ultrapassando e tanques saindo para o campo aberto;
   - fila nas pontes.
2. No console: `S.squads.map(q => orgForm(q, q.ord))`, `S.units.filter(u => u.ox).map(u => [u.kind, u.ox])` e `S.men.filter(m => m.sq && !m.sq.at).map(m => railOf(m.x, m.z).off)`.
3. Suítes afetadas, uma de cada vez: `tests/ambush.js`, `tests/approaches.js`, `tests/bridges*.js`, `tests/drills.js`, `tests/logistics*.js`, `tests/campaign.js`. As online rodam com `HOST=127.0.0.1`.
4. A/B com `ORG.on = 0` contra `1`: tempo de chegada das esquadras, baixas na marcha e veículos presos.
5. Custo: o medidor do general / `AIB` com e sem `ORG.on`.
