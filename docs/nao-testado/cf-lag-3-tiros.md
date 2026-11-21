# cf-lag-3-tiros: o tiro contra soldados e drones testa a distância antes de `safe()` (não testado além do teste focado, da impressão digital e da medição)

Continuação da cf-lag (#170) e da cf-lag-2. Os números e o método ficam em `/home/luiz/secondmate/data/cf-lag-3/` (`prof3.js`, `out/prof.jsonl`, `out/prof-tiros.jsonl`, perfis `out/prof-base-60.cpuprofile` e `out/prof-tiros-tiros-60.cpuprofile`).

## O que a medição mostrou
Sem navegador, semente 11, "Assistir" moderna com três lados, mapa 11, passos de 1/30 s, CPU da thread (`threadCpuUsage`). No auge do combate (60 a 120 s de jogo) o tiro (`stepShots` com o `droneShots` que o embrulha) era **17,1%** da CPU da simulação, e dentro dele:
- `safe(m, b)` (o fogo amigo poupa este soldado desta bala?) era perguntado a **todo soldado do mapa** para cada bala perto do chão, antes de ver se ele estava a 30 m dela: ~450 soldados por bala, dezenas de milhares de chamadas por passo. `safe` e o `dist` dentro dele: 4,6% + 2,2%.
- `droneShots`: o mesmo, `safe(o, b)` de cada drone para cada bala antes da caixa de 40 m.
- `droneTouch`: `safe` de cada veículo e soldado antes da caixa de alcance do drone.

## O que mudou (`Céu de Ferro 3D.html`)
Nas três condições, o teste barato de distância vem antes de `safe()`. `safe()` só lê (o lado, o atirador, o veículo e a tripulação dele, `FF`, `S.net`, `Net.ff`) e não sorteia nada, então a ordem dentro do `||`/`&&` não muda nenhuma resposta: os mesmos soldados atingidos, presos pelo fogo (`m.sup`, `drInc`) e na mesma ordem. Não é a ordem da percepção (`spotSd`, `foe`→`grade`→`notice`): nenhuma chamada com efeito colateral mudou de lugar.

## Resultado (mesma batalha)
- Impressão digital (posições, vida e mortos de 455–481 soldados e 50–60 veículos, obras, esquadras, operações dos três generais, número de sorteios) a cada 20 s até 120 s: **idêntica** nas seis marcas.
- Perfil de 60 a 120 s: tiro **17,1% → 8,5%** da CPU da simulação; `safe` 4,6% → 0,9%.
- CPU da thread por segundo de jogo (as duas corridas em horários diferentes, com a conta disputada): 80 s 8373 → 7439, 100 s 10224 → 8489 (−17%), 120 s 9664 → 8875 ms.

## Testado
- `tests/shots-safe.js` (um segundo): `safe()` em todos os casos da regra (outro lado, o próprio atirador, o veículo dele e a tripulação, amigo dentro e fora de `FF.arm`, rajada, fogo amigo desligado, online com e sem `Net.ff`), com cada objeto vigiado contra escrita: nada escrito, nenhum sorteio, a mesma resposta duas vezes; e as três condições com o teste barato primeiro. Falha no main.
- Chrome com a GPU, cena da #170 por 60 s: a partida roda, sem erro no console do jogo; o tiro é pouco nesse começo de batalha (2% do quadro), então o ganho aparece mais tarde, no auge do combate.

## NÃO testado
- As suítes longas de fogo amigo e drones (`ff.js`, `drone*.js`) não rodaram (a cota de CPU da conta estava disputada por torneios); a prova é a impressão digital de 120 s, com fogo amigo ligado e drones na partida.
- O mesmo padrão nos laços de veículos e aviões do tiro (`u.dead || safe(u, b)` antes da caixa) ficou como estava: são ~50 veículos e ~12 aviões por bala, pouco perto dos ~450 soldados.
