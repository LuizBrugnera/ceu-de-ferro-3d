# cf-popk-medidor: medidor de orçamento da IA (popK) por média sustentada

Issue: https://github.com/LuizBrugnera/ceu-de-ferro-3d/issues/35

## O que mudou
- `gpMeter` (Céu de Ferro 3D.html) deixou de agir sobre `AIB.stat().ok`. Esse sinal falhava com **um único quadro** acima de 8 ms nos últimos 5 s e só deixava ampliar sem nenhum pico, então o teto caía para 50% em toda partida e não voltava.
- `AIB.take()`: média do custo da IA por quadro no período do medidor (10 s). Corta 10% quando essa média passa de `AIB.avg` (4 ms) e amplia 5% abaixo de `GP.meter.low` × 4 ms (`low` foi de 0,6 para 0,8, ou seja, 3,2 ms). Entre os dois, mantém. O piso continua em 50%.
- `gpFits(t)`: depois de um corte, o próximo espera até um lado ficar dentro do teto que o corte anterior fixou. Um corte não tira ninguém do campo; sem isso, o medidor descia em catraca até 50% em 50 s com a mesma tropa em campo.
- A linha do log do general mostra os números medidos (média, orçamento, pior quadro, comandante). Toda mudança entra no log, sem a deduplicação de 45 s.
- `popK` é arredondado a centésimos.
- O README descreve a regra.

## O que foi testado (antes da nova regra de entrega)
- `tests/production.js` (testes novos do medidor com custo sintético: saudável mantém 100%, pico de 50 ms não corta, sobrecarga sustentada desce até o piso, recuperação volta a 100%, faixa morta, espera pelo corte) e `tests/frame-budget.js`: todos passam.
- Passam: eco-prod, eco-war, gen-relay, personality, vet, logistics, rec, mission, campaign, man-b.
- Falham igual no main (pré-existentes, não causados por esta mudança): general (3), eco (1, varia de lado), orders (2, fcap), man-a (1), man-c (7). gen-cmd (1, checagem estática de `rand(`; o diff não chama nenhum) não terminou no main dentro do limite de tempo.
- Partida assistida no Chrome headless sem GPU, antes e depois: no main, popK foi a 90% aos 10 s com média de 2,8 ms (abaixo do orçamento) e a 50% aos 60 s. Com a correção, ficou em 100% enquanto a média estava abaixo de 4 ms, cortou para 90% aos 30 s (média de 4,04 ms) e esperou.

## Testado em 9f2a313: ok (tarefa cf-testar-ia)

- `tests/production.js`: todas as checagens do medidor passaram (saudável fica em 100%, quadro isolado de 50 ms não corta, sobrecarga sustentada desce de 10 em 10% até o piso em 50 s, volta a 100% abaixo de 3,2 ms, faixa morta, espera pelo corte, números no log). As 7 falhas restantes da suíte são dos tetos e da postura (#77, #70), não do medidor. `tests/frame-budget.js`: passou.
- Online: `tests/eco-online.js` e `tests/gen-online.js` (HOST=127.0.0.1, sozinhas): passaram.
- Partidas IA × IA no harness desta máquina carregada (custo da IA de 20 a 150 ms por quadro): o medidor desceu ao piso de 50% e ficou lá, como desenhado para sobrecarga sustentada.

## O que NÃO foi testado

- Partida real com GPU (o caso de 57 fps e 3,65 ms): o Chrome desta máquina não tem GPU.
- Partida online com o anfitrião num navegador: o percentual do convidado no painel Logística.
- Quanto tempo uma máquina lenta de verdade leva até o piso numa partida longa.

## Riscos
- Numa máquina lenta em impasse, com os dois lados sempre acima do teto, o medidor fica em 90% em vez de descer. O efeito prático é parecido, porque o teto já bloqueia novas entradas, mas o custo cai mais devagar.
- Uma máquina com média entre 3,2 e 4 ms depois de um corte não recupera (faixa morta de propósito, contra gangorra).
- O log do general tem mais linhas de "Teto de população" (no máximo uma a cada 10 s, só quando muda).

## Como testar depois
- `node tests/production.js`, `node tests/frame-budget.js`
- `HOST=127.0.0.1 SUITES="eco-online gen-online" sh tests/all.sh` (rodar as suítes online sozinhas)
- Navegador com GPU: `HOST=127.0.0.1 node server.js`, abrir http://127.0.0.1:8080, rodar Assistir (moderno) e, no console, a cada 10 s: `S.popK`, `AIB.stat()`, `popUse(0)`, `popOf(0)`. Esperado: popK em 1 com média abaixo de 4 ms. Ler as linhas "Teto de população" no log do general (aba da Visão de General).
- Máquina lenta (ou `GV.spd` alto na partida assistida): popK desce 10% por vez, só depois de um lado caber no teto, e volta quando a média cai abaixo de 3,2 ms.
- Online: anfitrião e convidado no mesmo navegador; o painel Logística do convidado mostra o mesmo percentual do anfitrião.
