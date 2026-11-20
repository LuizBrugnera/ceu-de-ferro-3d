# cf-g2-g7-urbano: infantaria urbana, anticarro e atirador de elite (G7 do General 2)

Origem: a pesquisa de IAs de código aberto (`/home/luiz/firstmate/data/cf-ia-opensource/report.md`, seções 2.4, 5.1 e a linha G7 da seção 6) e a decisão do capitão de 2026-11-20 ("1A, 2A, 3C": adotar o General 2; trabalho do general e do cérebro só entra com número medido).

## O que mudou

Tudo numa seção própria da página, `CEREBRO: urbano`, mais a medição em `CEREBRO: urbano-medicao`, antes da cena 3D. O código antigo só é tocado por ganchos (`manThink`, `aiMan`, `sqMore`, `sqBound`, `dfpPts`, `dfpTeam`, `genCard`, o `man` de alguns exercícios de esquadra; e, na medição, `step`, `manFire`, `anaMvEnd`, `medEmit`, `anaBegin`, `anaReport`). O interruptor é `URB.on`: com 0, a partida é a mesma do main, bit a bit (conferido: as mesmas impressões digitais da batalha a cada 30 s por 240 s, main `ab57ded` × este ramo com `URB.on = 0`, 1944, semente 3, com economia, logística e recuperação no mapa 6).

1. **O anticarro vira caçador (`URB.at`).** O exercício numa partida mostrou o que o prendia: quando o tanque aparece, o `reagir` do líder (P3) já está rodando pelo primeiro contato e o mantém como base de fogo ("aguentar": abrigado onde está, `drGo`). O método `anticarro` nunca assume, e um Panzerfaust de 70 m nunca chega ao alcance. Agora, com o lança-foguetes na mão e um blindado como alvo (o dele, da percepção), os exercícios que o tratam como "um do resto" (`URB.at.free`: reagir, fixar, lances, contato, tanque, fogo-distante, perímetro) o deixam livre. Tanque parado: contorna como antes (`stalk`). Tanque andando: vai para a frente dele, ao lado do caminho, se chega antes (até `at.reach` m); senão espera abrigado perto do lugar dele. No alcance, ajoelha e dispara quando vê: na hora pelo lado ou por trás, de perto (`at.close` do alcance), ou quando o tanque vem para cima; se não, depois de `at.wait` s (eram 40 s, e um tanque andando nunca fica tanto no alcance).
2. **O atirador de elite tem posto próprio (`URB.snp`).** Quando a esquadra segura um lugar (ou assalta a até 650 m do objetivo), ele pede ao serviço de posição do P2 (perfil novo `atirador`: deitado, fora de casa, alto, escondido, com linha de tiro) um posto perto da borda da cidade voltada para a ameaça (ou atrás do lugar; ou a 220 m antes do objetivo no assalto), olhando 250 m à frente. Se não há posto ali, tenta para um lado, depois para o outro; depois volta ao lugar na esquadra por 2 min. Muda de posto depois dos tiros. Descoberta no caminho: o plano de defesa (DFP) punha o atirador da guarnição numa janela, e dentro de casa ele não deita (`bldPose`) e só atira deitado: nunca atirava.
3. **Guarnição da cidade (`URB.gar`).** Num ponto-cidade, o posto do plano de defesa pega primeiro as janelas dos 3 prédios da cidade mais perto (até 60 m), voltadas para a zona de morte, 4 por prédio, em todos os andares; a reserva, quando o plano não achou prédio a 40 m, os cômodos do prédio da cidade mais perto (até 90 m).
4. **Limpar a cidade prédio por prédio (`URB.cqb`).** A esquadra que assalta um ponto-cidade, a menos de 140 m do círculo, entra prédio por prédio: a equipe que anda vai ao prédio mais perto que o lado ainda não limpou (puxando para o centro), granada pela porta antes (`bAtk`), e a outra cobre de onde está; trocam a cada prédio. O prédio fica limpo para o lado (`S.urbClr`, por 10 min) quando a equipe ficou dentro 6 s sem contato novo nele (o quadro do líder e os alvos dos homens dele: o que percebem), ou depois de 50 s nele. Sem prédio por limpar, os lances de antes e o centro.
5. **Medição (`CEREBRO: urbano-medicao`)**, observador como a `medicao` do P6: soldado-min em prédio em defesa urbana, foguetes anticarro em blindado, assaltos a ponto-cidade que tomam o ponto, soldado-min dentro de cidade do inimigo, tiros de atirador de elite, soldados em prédio, e as chances (anticarro a ≤ 350 m de blindado inimigo). Evento `cb` com `st: 'urb'`, a revisão `R.urb`, e a seção **Urbano (G7)** do `tools/balance.js`.
6. **`tools/balance.js --set NOME.campo=valor`**: liga ou desliga um interruptor da página em todas as partidas do torneio (o A×B de um pacote com interruptor próprio: dois torneios nas mesmas sementes, o segundo com `--ref` do primeiro).

## O que foi medido

Veja o PR: a tabela antes × depois do torneio (12 partidas Curtas, sementes 1-12, `--eco --lg --rec --mapv 6 --nobudget`, com `nice`, no saomiguel) e o exercício sem tela `tests/urbano.js`.

## O que o número NÃO cobre

- **Assaltos a cidade.** Quase nenhum assalto chega à cidade: a reunião mata o assalto antes (G4). A limpeza prédio por prédio foi provada só no exercício (`tests/urbano.js`, parte 4: um ponto-cidade sem defensores). Contra defensores de verdade, numa partida, ela pode ser mais lenta que correr para o centro, e a captura depende de quem está dentro do círculo.
- **O anticarro dos EUA na época moderna é míssil guiado (Javelin)**: não é `heat` e não entra no caçador; ele já dispara quando trava. O dos russos (RPG) e os da Segunda Guerra (Panzerfaust, Bazooka) sim.
- **Interceptação do tanque**: usa a velocidade vista do tanque (como a mira já usa) e supõe que ele segue reto. Numa curva de estrada, o anticarro chega ao lugar errado e espera abrigado.
- **O caçador sai da esquadra**: até 150 m para interceptar. A esquadra não o espera nem o escolta, exceto pelo método `anticarro` do líder, quando ele vem.
- **O posto do atirador** depende do registro de cobertura do P2 e da linha de tiro a 250 m. Em cidade densa, muitas vezes não há posto (ele fica na esquadra). Não foi medido quanto ele sobrevive no posto.
- **A guarnição** muda só os lugares do plano de defesa (DFP) nos pontos-cidade. Outros jeitos de segurar (guarnição de posto, `postPts` sem DFP) não mudam.
- **Rede**: tudo roda só no anfitrião (`brainSim`); nada vai pela rede. Não testado online.

## Riscos

- Um tanque parado que não se move (estático) continua com o `stalk` antigo, que pode levar o anticarro a uma volta longa.
- Ajoelhar e atirar de frente depois de 10 s pode gastar foguetes num blindado de frente (a blindagem frontal pode aguentar).
- O laço do exercício "reagir": o anticarro dispensado não é a base de fogo; uma esquadra pequena fica com menos fogo de fuzil enquanto ele caça.

## Como testar depois (com `nice`, nunca no elrei)

1. `nice node tests/urbano.js` (SEEDS=3): o anticarro contra um tanque andando, o posto do atirador, a guarnição da cidade, a limpeza da cidade, o interruptor; `PARITY=<página do main> SECS=240 nice node tests/urbano.js` (ONLY=5) para a mesma partida com `URB.on = 0`.
2. `nice node tests/brain-honesty.js`: a seção `urbano` não lê `S.men`/`S.units`; a `urbano-medicao` é observadora.
3. O A×B: `nice node tools/balance.js --torneio 12 --eco --lg --rec --mapv 6 --nobudget --seed 1 --jobs 12 --set URB.on=0 --save <a> --json a.json`, depois o mesmo com `--set URB.on=1 --save <b> --json b.json --ref a.json`. A seção **Urbano (G7)** sai com a coluna de referência.
