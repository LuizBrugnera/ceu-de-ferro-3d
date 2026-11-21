# cf-g2-g0-regua: a régua do General 2 (G0)

O capitão decidiu (2026-11-20), depois da pesquisa `cf-ia-opensource`: adotar o General 2 e parar de remendar o general por sintoma. Trabalho do general e do cérebro só entra com número medido. Este é o pacote G0 da seção 6 da pesquisa: a régua dos exemplos do capitão. Os outros pacotes (G1 a G8) medem contra ela.

O número que este pacote tem de mostrar ("pronto quando"): a régua é estável (a mesma semente dá o mesmo resultado) e todas as medidas estão presentes. O que segue é o que esse número **não** cobre.

## O que mudou

- `Céu de Ferro 3D.html`, seção `/* ---------- GENERAL 2: régua (G0 ...) */`, no fim da parte da simulação. É um observador, como a analytics (`ANA`) e a medição do cérebro (`MED`): lê a verdade, não sorteia nada, não escreve nada nos objetos da batalha (guarda o que lembra deles em `WeakMap` e `WeakSet`) e não decide nada. `G2R.on = 0` desliga tudo. Ganchos: `anaBegin`, `anaStep`, `cqEnd`, `anaPush`, `manFire`, `enpFobNext` e `anaReport`. O comentário do topo da seção define cada contador.
  - Evento `g2` por lado, a cada 60 s e no fim: os contadores.
  - Evento `g2c` por combate, quando ele acaba: quem estava, quanto durou, quem sobrou. Isso alimenta a calibração do G2.
  - `R.g2` na revisão.
  - `g2Sum` e `g2Rows`: as medidas e as linhas da tabela.
- `tools/balance.js`: a seção "General 2: régua dos exemplos", e as opções `--ref` (coluna de referência), `--g2 0|1` (o interruptor) e `--combates <arquivo>`.
- `server.js`: `ANA.kinds` aceita `g2` e `g2c`. Sem eles, o servidor descarta esses eventos: desde o `cf-pol-fluxos` ele filtra o evento de tipo desconhecido; antes, jogava fora o lote inteiro. O `cb` da medição do cérebro, o main já tinha acrescentado.
- `tests/g2-regua.js` (também em `tests/all.sh` e `tests/README.md`).
- `tools/ref/general2-base.json` e `tools/ref/general2-base.md`: a régua do main de hoje.

## O que não foi testado, o risco e como testar

1. **Cada medida mede o que o capitão quis dizer?** Foi conferida só a conta, com eventos inventados (parte 1 do teste) e o torneio da régua. Ninguém olhou uma partida com a tela aberta para confirmar que o número bate com o que se vê.
   - Risco: um número que sobe sem o comportamento aparecer (o mesmo erro de "código sem comportamento" que a pesquisa achou, agora na régua).
   - Como testar: assistir uma partida IA × IA e, a cada minuto, comparar o diário `g2` com a tela. Em especial: defensores perto do centro de um ponto atacado, uma incursão na sede, um combate do começo ao fim.
2. **Limiares escolhidos sem calibração.** Todos estão em `G2R`:
   - ponto "ameaçado": inimigo no chão a ≤ 600 m;
   - defensor: a ≤ 250 m do ponto;
   - "no centro": a < 30 m;
   - tanques juntos: a < 30 m;
   - zona da sede: o raio da cidade + 300 m;
   - "perto de um ativo": 600 m;
   - peças: a ≤ 150 m do ponto, 5 min depois de tomá-lo, contando 3 peças ou mais;
   - combate: contato a 400 m, ligação a 500 m, fim depois de 30 s sem contato.

   Risco: um pacote melhora o comportamento e o número não mexe, ou o contrário. Como testar: cada pacote que depende de uma medida confere o limiar no exercício sem tela do seu caso, antes de usar o número como critério.
3. **Impactos perto de um ativo.** Contam pela queda prevista da granada ou do foguete no disparo (`b.px`, `b.pz`), a mesma lista que o `AID` usa. Contam também os que a cúpula derruba e os de morteiro.
   - Risco: o critério do G6 ("cúpula antes do 10º impacto") conta disparos sobre o ativo, não estragos.
   - Como testar: uma partida moderna com artilharia, comparando `dm` com as explosões perto da sede.
4. **Partes dos critérios do G5, G3 e G8 sem medida:**
   - "tanques com cobertura para a frente" (G5);
   - "troca de plano ≤ 1 a cada 60 s" (G3: ainda não há plano);
   - "perdas no desembarque" (G8);
   - "Hora H" e "reuniões canceladas" contam do jeito do M0 e do `cf-manobra-reuniao` (eventos `ap` e o diário), sem mudar.

   Como testar: o pacote que precisar acrescenta o contador à seção, com o seu teste.
5. **Combates.** Agrupamento por ligação simples entre esquadras (pelo líder, ou pelo veículo dele) e veículos em contato. Um combate que se divide continua um só; dois que se encontram viram o mais antigo. Mais de 500 por partida ficam de fora (contados em `cb[1]`).
   - Risco: o G2 calibra com combates grandes demais ou partidos.
   - Como testar: no G2, comparar a distribuição de duração e de tamanho com o que a tela mostra, e o acerto do vencedor.
6. **Online.** Não foi jogado numa sala de verdade. Ficou de fora:
   - o anfitrião mandando `g2` e `g2c` ao servidor e o servidor gravando;
   - o `rep` com `R.g2` abaixo dos 16 KB numa partida longa (numa partida de 1 min deu 11.476 caracteres, contra 9.840 sem a régua).

   Como testar: `tests/ana-online.js` com uma partida que tenha combates e eventos `cb`, e uma sala real de 30 min.
7. **Três lados.** Não foi jogado (a sede HS2 dos Insurgentes, `anaN() = 3`). Como testar: `node tools/balance.js --torneio 2 --lados 3 --min 10 --nobudget`.
8. **A revisão pós-batalha na tela não mostra a régua.** Só a revisão (`R.g2`), o MCP (`get_match_report`) e o `balance.js` mostram.
9. **Custo.** A amostragem roda a cada 5 s, com laços sobre os soldados, as esquadras e os pontos e uma busca de prédio (`bldAt`) por soldado. Não foi medido o custo por quadro com o medidor ligado (sem `--nobudget`).
10. **A régua gravada tem só 1944.** São 6 partidas, e não 12: as modernas ainda rodavam, a cerca de 9 h de relógio por partida num node saturado.
    - Não há número de cúpula, de foguetes nem de guerra moderna em `tools/ref/general2-base.json`.
    - Como testar: juntar as 6 modernas do mesmo torneio quando terminarem (ou jogar `--era modern --seed 7 --torneio 6`) e atualizar a régua.
11. **km embarcado.** A régua gravada tem 0 km embarcado: uma esquadra numa carona (`rideBoard`, homens `gone` a bordo) não era seguida. O conserto (`g2Where`, a esquadra fica onde está o veículo da carona) foi conferido só com objetos inventados na parte 1 do teste, e não numa partida.
    - Como testar: uma partida de 1944 de 15 min, conferindo km embarcado > 0 quando o `EMB` registra caronas (`S.emb.rode`).
