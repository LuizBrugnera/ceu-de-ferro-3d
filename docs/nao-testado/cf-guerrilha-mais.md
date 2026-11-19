# cf-guerrilha-mais: táticas de guerrilha e guerra não convencional do general insurgente — NÃO TESTADO

Pedido do capitão: "adicione na mente do general insurgente táticas de guerrilha" e depois "e guerra não convencional". São 23 táticas: as 16 de guerrilha e as 7 de guerra não convencional da lista do Firstmate.

## O que mudou

**`Céu de Ferro 3D.html`, bloco "the guerrilla mind of the Insurgents' general" (`GRL`)**. Fica logo antes de `/* ---------- 3D scene`, depois de todos os blocos que ele embrulha.

- **Quem usa.** Só um lado Insurgente (`insT(t)`, `S.fac[t] === 2`) cujo general é a IA, no anfitrião ou no solo, numa partida de pontos (`S.cq`, mapa v4). EUA e Rússia não mudam. Com 2 lados nada roda, porque `insStep` só é chamado com `S.fac.length > 2`.
- **Escolha das táticas.** O general escolhe a cada `GRL.every` = 15 s:
  - `grlSit` lê a situação do STG (`stgSit`) e acrescenta o que é da guerrilha: a noite (`S.sky.L < SKY.dark`), as vilas que o lado tem, uma vila sua atacada ou perdida há pouco, as vilas que odeiam o inimigo e não o lado, os esconderijos, os alvos de valor conhecidos, os veículos abandonados e as pontes;
  - `grlScore` dá a cada tática uma nota de 0 a 2 e o motivo;
  - essa nota é multiplicada pelo peso da personalidade (`GRL.per`; `ins` por padrão, e `gue`/`ret`/`blz`/`art`/`log` se a partida der outra) e por um gosto sorteado uma vez por partida;
  - ficam ativas as 5 melhores com nota ≥ 0,35. As que já estavam ativas contam ×1,3 (histerese).
- **Registro.** O diário do general (tipo `grl`, rótulo GUE) e a revisão pós-batalha (nova seção "Táticas de guerrilha", `R.grl` no `anaReport`) registram o que entra e o que sai, com o motivo. O MCP lê o mesmo em `genState(t).grl`.
- **O que cada tática ativa faz.** Reaproveita o que o general já tem:
  - o peso das manobras sorteadas (`mmMan` embrulhado): `gue raid inf emb itd blk fnt dep flk cut trn`;
  - a doutrina (`perDoc` embrulhado, e o `stgDoc` a refaz quando as táticas mudam): `atk`, `wd`, `amb`, `def`;
  - a mistura de produção (`perMix`);
  - **uma ação direta a cada 12 s no máximo**, com espera por tática (`GRL.cd`), sempre por `genCmd(..., 'ai')`;
  - movimentos curtos de esquadras livres (`grlGo`): uma operação manual da própria IA que termina sozinha depois da vida dela e devolve as esquadras ao posto.
- **Proteção.** Cada ação está num `try/catch` (`grlErr`, um aviso no console por chave). Uma tática quebrada não derruba o passo do anfitrião.

| # | Tática | O que faz |
| --- | --- | --- |
| 1 | Evitar a batalha campal (`evt`) | Doutrina: assalto pede ×1,3 de vantagem e o recuo vem mais cedo (wd +0,15). Mais defesa em profundidade e fustigamento, menos flanco e cerco. Ação: a esquadra (até 2) com inimigo conhecido ≥2,5× a força nossa a 500 m recua para a vila ou mata mais perto, longe dele (`insRefuge`), por 120 s. |
| 2 | Emboscada complexa (`emc`) | Peso ×1,8 nas emboscadas do M4 (`emb`) e ×1,3 na interdição. Ação: na emboscada armada, um campo de IED (`fort mineat`) na zona de morte mais um IED de comando (`S.insC`, o do P7, que os emboscados vigiam). Quando ela dispara, 3 tiros de morteiro na coluna parada. |
| 3 | Assédio (`ass`) | Fustigamento ×1,6. Ação: 2 tiros de morteiro (`fire he`) numa base de suprimento, instalação, artilharia ou concentração conhecida. Depois o morteiro muda de posição pela regra que ele já tem. |
| 4 | Incursão noturna (`not`) | Só à noite. Incursões ×1,8 e infiltração ×1,4. Ação: incursão (`man raid`, 1 esquadra) contra depósito, instalação, FOB ou artilharia. |
| 5 | Sabotagem da logística (`slg`) | Interdição, bloqueio e incursão para cima. Ação, nesta ordem: IED na estrada de um caminhão inimigo conhecido (`habEdge`); derrubar uma ponte a até 2,5 km de uma base de suprimento inimiga (`man demolish`); incursão na base de suprimento. |
| 6 | Esconderijos de armas (`esc`) | Ação: base de suprimento (`sup`, a esquadra livre mais perto) num anel de 120 a 280 m em volta de uma vila nossa que ainda não tem uma. No máximo 3. |
| 7 | Mistura com a população (`mis`) | O disfarce do P7 vale com 12 s sem atirar (em vez de 30) e a mais de 100 m (em vez de 150). Sem ação direta. |
| 8 | Dispersar e reagrupar (`dsp`) | Quando acaba uma incursão, fustigamento, emboscada, interdição ou infiltração (`opEnd` embrulhado), as esquadras saem cada uma por um desvio lateral (350/500 m, alternando o lado) até um ponto de reunião escondido, por 180 s. |
| 9 | Enxame (`enx`) | Ação: incursão com 2 esquadras e morteiro ao mesmo tempo no mesmo alvo. |
| 10 | Iscas e desvio (`isc`) | Finta ×2. Ação: durante um golpe nosso (assalto, incursão, infiltração), um fustigamento (`man harass`); se já houver um, fogo numa concentração a mais de 2 km do golpe real. |
| 11 | Defesa urbana (`urb`) | Ação, por vila (a mais ameaçada primeiro), em três passos: `dpol` com 2 esquadras e reação sempre; ninho de metralhadora (`fort bunker`) a 120 m, voltado para o inimigo; campo antipessoal (`fort mineap`) a 260 m, na entrada. |
| 12 | Bloqueios de estrada (`blq`) | Bloqueio ×1,8. Cada bloqueio vivo dá pedágio: +5 de energia e +4 de metal por minuto. |
| 13 | Recrutamento (`rec`) | Ação: `mil` numa vila revoltada contra o inimigo e não contra nós (`civHates`), e `dpol` com reação sempre se o ponto dela é nosso. |
| 14 | Caça a alvos de valor (`cac`) | Ação: incursão contra rádio, artilharia ou morteiro. Se não houver caminho, fogo (3 tiros) num helicóptero pousado, operador de rádio, rádio pousado ou nesses alvos. |
| 15 | Guerra de desgaste (`dsg`) | Doutrina: assalto ×1,2. Fustigamento, incursão e emboscada para cima, flanco, cerco e desbordamento para baixo, +1 esquadra no plano. |
| 16 | Retaliação rápida (`ret`) | Gatilho: inimigo conhecido com força ≥2 a 700 m de uma vila nossa, ou uma vila nossa perdida há menos de 120 s. Ação: incursão ou fogo no alvo mais fraco do inimigo a mais de 1,5 km dali. |
| 17 | Infiltração atrás das linhas (`inf`) | Infiltração ×1,8. Ação: `man infiltrate` até uma instalação, base de suprimento ou artilharia. |
| 18 | Sabotagem de instalações (`sab`) | Ação: `sabot` (sapadores com cargas) contra usina, mina, fábrica, QG, depósito ou rádio. Senão, derrubar uma ponte que liga a nossa margem à do inimigo. |
| 19 | Guerra psicológica (`psi`) | A cada 5 s, cada inimigo perde 0,25 tíquete por minuto por vila nossa que não nos odeia, e nunca abaixo de 30% dos tíquetes iniciais. Ação: adianta o carro-bomba ou o homem-bomba do P7 (`insBomb`) como ação de choque. |
| 20 | Uniforme e bandeira falsos (`fal`) | Os homens de uma incursão ou infiltração, e as técnicas e caminhões do lado, ficam no máximo no grau 1 da escada (a IA olha mas não atira) a mais de 220 m, enquanto estão há 20 s sem atirar (`grade` embrulhado). |
| 21 | Cortar o comando (`cmd`) | Ação: incursão contra um veículo-rádio ou o QG. Senão, fogo em operadores de rádio e rádios pousados. |
| 22 | Armadilhas explosivas (`arm`) | Ação: arma um veículo abandonado (`u.left`) a até 300 m de um homem nosso, até 3 (`S.grlBT`). Ele explode (10 m, 320 de dano) quando um soldado inimigo chega a 3,5 m, respeitando as regras de fogo (`roeHeld`). Senão, campo antipessoal na cabeceira nossa de uma ponte com inimigo do outro lado. |
| 23 | Rotas de fuga preparadas (`tun`) | Cada vila nossa tem um ponto de fuga (refúgio longe do inimigo), recalculado a cada 60 s. Uma esquadra na vila com menos da metade dos homens e inimigo a menos de 300 m sai por ele (até 2 por vez). **Túneis não foram feitos**: o terreno não tem subsolo e os soldados não têm por onde andar embaixo dele. |

**Também mudou:**
- os rótulos `grl` no diário (GUE) e na revisão (AARD);
- um parágrafo no `README.md`, na seção dos Insurgentes.

## O que rodou (smoke, ~1 min)

- `node --check` no script da página: ok.
- A parte de simulação carrega no vm do `tests/harness.js` sem erro (`GRL` com 23 táticas, `grlStep` definido).
- O servidor sobe em 127.0.0.1 e entrega a página (200).

## NÃO testado (tudo o resto)

Nenhuma partida rodou: nem de 3 lados, nem de 2 lados (regressão), nem online. Nenhuma suíte rodou. A página não foi aberta no navegador. Nenhuma das 23 táticas foi vista funcionando.

## Riscos

- **Chamadas sem teste a comandos de outros pacotes.** O código chama `genCmd` com `fort`, `fire`, `dpol`, `man` (raid/infiltrate/harass/demolish), `sabot`, `mil` e `sup` (este com `R`, que pula a validação humana). Também chama `footPath`, `insRefuge`, `mbRaidAssets`, `gueClusters`, `brs`/`brHome` e `stgSit`/`stgDoc`. Um formato errado deve só ser recusado, e uma exceção cai no `try/catch` e vira um aviso `guerrilha (k):` no console.
- **Embrulhos em funções quentes:**
  - `grade`: só um teste de `S.fac[t.team] === 2` para quem não é insurgente;
  - `opEnd`: guarda as esquadras antes de chamar o original;
  - `mmMan`, `perDoc`, `perMix`, `insStep`, `ecoInit`, `genState` e `anaReport`.
- **`grlGo` cria operações `usr` da IA.** Elas terminam por `opEnd` depois da vida delas (`grlOps`, também com a cadeira humana). Uma pessoa que assumir a cadeira nesse meio-tempo vê essas operações como dela até expirarem.
- **`footPath` tem orçamento por turno** (dificuldade). Dispersar gasta 2 chamadas por esquadra. Sem caminho, a ordem sai sem rota (`wp`).
- **Balanço chutado:** tudo em `GRL`. Os pontos mais sensíveis:
  - a propaganda gasta tíquetes (0,25/min por vila, piso de 30%);
  - o pedágio;
  - o grau 1 do uniforme falso;
  - as armadilhas (320 de dano);
  - as táticas que tiram esquadras do posto (`evt`, `tun`), que podem entregar pontos de propósito.
- **Esconderijo de armas:** `GC.sup` com `R` não chama `siteWhy`, então o código chama antes. A base pode custar e ocupar uma esquadra.
- **Mistura (`mis`) e uniforme falso (`fal`)** também valem quando o insurgente é o jogador.

## Como testar depois

1. Partida IA × IA de 3 lados, curta, na Frente atual, no harness:
   ```js
   const h = require('./tests/harness.js');
   const c = h.load({ seed: 7, eco: 1, mapv: 9 });
   const S = c.watch('modern', { n: 3 });
   c.run(600);
   ```
   - Diário do insurgente: `S.glog.l[2].filter(e => e.k === 'grl')` deve ter "Tática de guerrilha: …" com o motivo, e ações como "IED de comando na zona de morte", "esconderijo de armas", "Recrutamento", "armadilhado" e "Dispersar e reagrupar".
   - `c.$('grlView')(2)` traz as táticas ativas; `S.grlE` deve ficar vazio (nenhuma tática lançou erro).
2. Noite: `newState` com a hora `noite`. A incursão noturna deve entrar ativa e mandar uma incursão.
3. Retaliação: tome uma vila insurgente com um lado e veja o log "Retaliação rápida: o inimigo tomou …".
4. Armadilha: deixe um veículo abandonado perto de insurgentes e mande um soldado inimigo até ele; deve explodir e registrar no log.
5. Uniforme falso e mistura: um insurgente de uma incursão, parado, a 300 m de um tanque da IA não deve levar tiro; depois de atirar, sim.
6. Regressão de 2 lados: `bash tests/all.sh` (com o harness em dia) deve dar o mesmo de antes; nada de `GRL` roda.
7. Revisão pós-batalha no navegador: a seção "Táticas de guerrilha" aparece numa partida de 3 lados.
8. Desempenho: `node tests/frame-budget.js` numa partida de 3 lados.
9. Online (anfitrião e convidado): tudo só no anfitrião; o convidado vê o diário pelo `glog`.
