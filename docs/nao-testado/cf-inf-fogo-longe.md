# Infantaria sob fogo de longe, e mais prédios como abrigo (não testado)

Tarefa `cf-inf-fogo-longe`. Pedido do capitão: quando a infantaria leva tiro de longe ela não faz nada; ela deve se fumigar, buscar abrigo e, sem abrigo, cavar trincheira e pôr sacos de areia. Depois: a infantaria deve entrar em prédios e casas com mais frequência.

## O que mudou (tudo em `Céu de Ferro 3D.html`)

- **Causa raiz do "não faz nada"**: o drill `contato` só disparava com um inimigo percebido (`K.near`, crença fresca a até 650 m) ou com um homem atingido. Um tiro que passava raspando (`m.sup`, quase-acerto) não entrava em nada que os drills liam, e a direção do tiro não era guardada. Agora:
  - `drInc(m, by, vx, vz, w)`: cada quase-acerto (peso 1) e cada homem atingido por bala ou granada direta (peso `far.hit` = 3) vai para `q.drW` da esquadra, com a direção de onde a bala veio e, se o soldado ouviu o tiro (`m.ln` daquele atirador), o lugar ouvido. Ligado nos dois laços de projéteis (`S.bullets`, `stepSlugs`) e no `impact`.
  - `drInfo` soma isso em `K.inc` / `K.incT`; com `far.con` (2) em 8 s já conta como contato (o `contato` dispara: ao chão e relatório).
  - Numa ordem de assalto, a bala de longe continua sem prender (`m.sup`) como antes, mas agora é registrada.
- **Drill novo `fogo-distante`** (`DRILL.inf.far`): com `th` (4) de fogo em 8 s (ou `rush` = 10 num assalto, escolta ou corrida: um tiro perdido não para o assalto) e nenhum inimigo terrestre crido a menos de 250 m:
  1. todos ao chão por 2 s;
  2. fumaça na direção de onde vem o fogo (`drIncAt`: onde ouviram os tiros, senão 350 m para trás na direção das balas), outra a cada 18 s enquanto o fogo continua;
  3. relatório de contato e, se os tiros foram ouvidos, pedido de fogo (`fire`/`arty`) naquele lugar;
  4. cada homem para um lugar fora da linha de tiro a até 60 m (`drHide`: prédio primeiro, mata, dobra do terreno, trincheira);
  5. se metade da esquadra ou mais não acha abrigo de verdade: sacos de areia 3 m à frente e uma trincheira (`fortStart`, mesmas regras de terreno e limites `tcap`/`bcap`), ou usa obras do próprio lado a até 40 m; os homens sem abrigo vão para os lugares das obras e cavam (a obra só avança quando não estão sob fogo, regra `builds` que já existia).
  - Acaba com 14 s sem bala chegando (30 s se cavou), quando um inimigo aparece perto (os outros drills cuidam), ou com a ordem de corrida. Respeita a coleira da missão (`drLeash`). Não atira por conta própria, então ROE `hold` não o bloqueia.
- **Mais prédios** (pedido 2):
  - `bldPts` (lugares de um posto): antes só dentro de cidade ou vila e só sem raio `R`. Agora também fora de cidade (lugarejo, fazenda) com prédio a até `CITY.ai.near` (35 m), e em ordens com raio até `CITY.ai.ring` (15 m: mover/segurar/observar do general) a até `R + 35` m. Não vale para ordens `build` e `supply`.
  - Prédio aceito só se `drBldOk`: em pé, fechado, sem desabar e sem tiro pesado recente (o drill `predio`), e sem inimigo dentro.
  - `drHide` (achar abrigo fora da vista) pesa o vão de um prédio 1,8 (era 1) e ignora prédios que não passam em `drBldOk`.
  - Drill `perimetro` (parada no caminho): se houver prédio bom a até 35 m (`per.bld`), os homens vão para as janelas dele, olhando para todos os lados, em vez do anel no aberto.

## O que NÃO foi testado

Nada foi rodado além do smoke: `node --check` do script, o `server.js` subindo, a página abrindo no Chrome sem erro no console e `DRILLS` contendo `fogo-distante`. Não rodei `tests/inf-drills.js`, `tests/drills.js`, `tests/infantry.js`, nem nenhuma partida.

## Riscos que vejo

- **Disparo demais**: metralhadora de longe gera muito quase-acerto; esquadras em `hold`/`move` podem ficar no chão e cavar com frequência e parar de avançar. Ajuste `DRILL.inf.far.th`/`rush`/`win`.
- **Obras demais**: cada esquadra sem abrigo pode começar 1 trincheira + 1 parede; isso consome os limites do lado (`FORT.trench.cap` 12, `FORT.bags.cap` 16) que o planejador e o general também usam. Obras largadas decaem (`BLD.decay`).
- **Direção estimada**: sem tiro ouvido, o lugar do atirador é 350 m na direção das balas; fumaça e abrigo podem sair tortos para atiradores muito longe ou muito perto.
- **Prédios**: postos fora de cidade e ordens do general com raio pequeno agora entram em casas; pode deixar esquadras longe do ponto exato da ordem (até ~50 m), mudar comportamento de testes que esperam o anel, e expor mais esquadras a artilharia em prédios (o drill `predio` deve tirá-las).
- O `contato` agora dispara também com 2 quase-acertos: mais relatórios `contact` ao general.
- Online: tudo roda só no anfitrião (`drInc` ignora convidado); não verifiquei se a obra começada pelo drill aparece certa para o convidado (usa o mesmo `fortStart` do planejador, então deveria).

## Como testar depois

1. `node tests/inf-drills.js` e `node tests/drills.js`, `node tests/infantry.js`: comparar com o `origin/main` (rodar com `PAGE=` a página do main) para ver o que mudou por causa disto.
2. Cenário manual/script: uma esquadra IA em `hold` em campo aberto, e uma metralhadora/tanque inimigo a ~600 m atirando nela sem ser visto (ou com `IAI.see` baixo). Esperado: `q.dr.id === 'fogo-distante'`, fumaça lançada para o lado do atirador, homens deitados e, sem abrigo, `S.forts` ganha uma parede (k 2) e uma trincheira (k 1) do lado dela perto da esquadra; com o fogo parado, as obras sobem.
3. O mesmo cenário perto de uma casa ou mata: os homens vão para o prédio ou mata e não cavam.
4. Esquadra em assalto recebendo 1 a 5 tiros de longe: não deve pegar o drill (só com ≥ 10 em 8 s).
5. Contagem no AAR (`drills`): ver quantas vezes `fogo-distante` aparece numa partida de 20 min de IA contra IA; se for dezenas por esquadra, subir `th`.
6. Prédios: esquadra parada no fim de uma caminhada junto a uma casa fora de cidade deve ir para as janelas (`q.drPer.p` com `b`); ordem `move` do general (raio 12) perto de casa deve ocupar a casa; prédio sendo bombardeado não deve ser escolhido.
