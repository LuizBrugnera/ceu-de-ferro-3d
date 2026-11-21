# cf-guerrilha-mais: táticas de guerrilha e guerra não convencional do general insurgente (o que ainda falta testar)

O bloco `GRL` ("the guerrilla mind of the Insurgents' general") tem 23 táticas, mais 2 do `ICV`. O lado Insurgente com general da IA escolhe a cada 15 s as 5 melhores (`grlSit`, `grlScore`, peso da personalidade, gosto, histerese). Cada tática ativa mexe em manobras, doutrina e produção, e manda uma ação direta a cada 12 s no máximo, por `genCmd(..., 'ai')`. A tabela das táticas está no código, em `GRL.nm`, `GRL.man`, `GRL.doc`, `GRL.mix` e `GRLDO`.

Testado (cf-pol-testes-a): 60 s de uma partida IA × IA de 3 lados (semente 7, mapa 9, economia ligada), com `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/m3.js`. Mais não coube: sob a trava compartilhada, a partida de 3 lados custou ~4 s de relógio por segundo de jogo.
- **As 5 táticas ativas** no fim, com o motivo de cada uma:
  - Mistura com a população: 3 vilas nossas;
  - Assédio: 2 instalações e 1 canhão inimigos conhecidos, 2 morteiros nossos;
  - Esconderijos de armas: 3 vilas, 0 esconderijos;
  - Guerra psicológica: 3 vilas;
  - Recrutar nas vilas (do ICV): 4 vilas simpáticas.
- **Ações vistas no diário (GUE)**:
  - "Esconderijos de armas nas vilas: esconderijo de armas em N · Aldeia do Açude";
  - "Assédio (atirar e sair): 2 tiros de morteiro em a usina inimiga na cidade-sede…";
  - "Guerra psicológica: propaganda em 3 vila(s) abala o moral do inimigo (1,3 tíquetes até agora)".
- **Sem erro**: `S.grlE` vazio e nenhum aviso `guerrilha (k):` no console.
- **Texto**: "em a usina" deveria ser "na usina". O nome do alvo vem com artigo, e a frase põe "em" na frente. Não mexi, porque é texto do general.

## O que ainda não foi testado
- **As outras 18 táticas e suas ações**: emboscada complexa, incursão noturna, sabotagem, dispersar e reagrupar, enxame, iscas, defesa urbana, bloqueios, recrutamento `mil`, caça a alvos de valor, desgaste, retaliação, infiltração, sabotagem de instalações, uniforme falso, cortar o comando, armadilhas e rotas de fuga.
  - Uma partida de 600 s, com `c.run(600)` na receita antiga (seção "Como testar"), mostra mais.
- **Exercícios isolados**: escrevi `grl-unit.js` (armadilha e uniforme falso), mas o veículo do teste não estava "estacionado" (`crewPark`) e o insurgente tinha acabado de atirar. Rodar de novo com esses dois consertos, que já estão no script.
- **Noite** (incursão noturna), **retaliação** ("o inimigo tomou…") e **o convidado online** (o diário pelo `glog`).
- **Regressão de 2 lados**: nada do `GRL` roda (`insStep` só com `S.fac.length > 2`). Visto no código, não rodado: `bash tests/all.sh` contra a linha de base.
- **Revisão pós-batalha no navegador** (seção "Táticas de guerrilha").
- **Desempenho**: `node tests/frame-budget.js` numa partida de 3 lados.

## Riscos (do autor, ainda valem)
- **Chamadas a comandos de outros pacotes**: `fort`, `fire`, `dpol`, `man`, `sabot`, `mil` e `sup` com `R`. Um formato errado deve ser só recusado, e uma exceção vira o aviso `guerrilha (k):`.
- **Embrulhos em funções quentes**: `grade`, `opEnd`, `mmMan`, `perDoc`, `perMix`, `insStep`, `ecoInit`, `genState` e `anaReport`.
- **As operações `usr` da IA** (`grlGo`) ficam com a pessoa que assumir a cadeira até expirarem.
- **Balanço chutado** em `GRL`: a propaganda (0,25 tíquete/min por vila, piso de 30%), o pedágio, o grau 1 do uniforme falso, as armadilhas (320) e as táticas que tiram esquadras do posto (`evt`, `tun`).
