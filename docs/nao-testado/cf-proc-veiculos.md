# cf-proc-veiculos: procedimentos de combate de veículos e aeronaves (não testado por inteiro)

Pedido do capitão: "vamos colocar algumas situações alguns padrões nos npcs, ja que até militarmente falando tem os procedimentos. [...] implemente como padrões de comportamento no cerebro. [...] 10 para pilotos de avião. 10 para pilotos de tanque. 10 para pilotos de caminhão [...] se achar que deve fazer para outros tambem, pode fazer". Esta tarefa cobre avião, carro de combate, caminhão, helicóptero, artilharia e antiaérea; a infantaria veio no PR #36.

## O que mudou

- **Procedimentos na tabela `DRILLS`** (em `Céu de Ferro 3D.html`, logo depois dos da infantaria; parâmetros em `DRILL.veh` e `DRILL.air`). Cada um dispara só pelo que a unidade percebeu (crenças `o.bel`, explosões que ela viu, o que a atingiu), respeita a coleira da missão (`drLeash`) e as regras de engajamento, e age pelos controles do veículo/aeronave (`ctl`, chamado por `drStep` depois do controlador):
  - Carro de combate / blindado: `missil-at` (fumaça, ré, mudar de posição), `infantaria-v` (recuar e pedir esquadra), `posicao` (mudar depois de alguns disparos, casco escondido), `superior` (não duelar com carro mais forte), `imobilizado` (fumaça, atirar, pedir recuperação), `cidade` (não entrar em vila/mata densa sem infantaria à frente), `aereo-v` (parar sob árvores/prédios), `mina-v` (parar, ré pelo rastro, sapador).
  - Caminhão / carro: `emboscada-v` (atravessar a zona de morte; o caminhão não desembarca a esquadra nela), `comboio` (distância entre veículos), `aereo-c` (sair do aberto para as árvores), `area-batida` (parar antes da área batida), `desembarque` (desembarcar do lado protegido), `saida` (não ficar parado depois de entregar), `mina-v`.
  - Artilharia: `contrabateria` (suspende a missão de fogo e muda de posição). Antiaérea: `aa-recuo` (recuar de inimigo terrestre), `radar-silencio` (radar só trava quando há tiro).
  - Avião: `missil` (flares/chaff, curva para o feixe, mergulho), `radar-aa` (descer e usar o relevo), `flak` (subir acima do teto, não repetir a passagem), `cauda` e `ala` (caça atrás: manobra e o ala cobre), `passe` (sair por outro eixo), `avaria` (dano grave: sair; em chamas e sem controle: ejetar), `noite` (altitude mínima de segurança).
  - Helicóptero: `lz-quente` (só pousa para desembarque em zona segura).
- **Já existiam e ficaram como estavam** (não duplicados): avião 6 (fogo amigo, `ffHeld`), 7 (volta para rearmar), 9 em parte (o par já voava junto); carro 7 (artilharia: `shelled`), 9 (pedido de munição em `mindAsk`); helicóptero 1, 2, 3, 5 (`aiAttack`/`aiDef`); artilharia 2 (`ffHeld`/`ffDanger`); antiaérea 4 (`pickAir`).
- **Não feitos (inviáveis no modelo atual)**: caminhão 4 (rota alternativa por ponte caída: é do W20/pontes), 8 (tripulação sair do veículo: a IA não tem corpos de tripulação), 9 (luzes apagadas: não há modelo de luzes de veículo); carro 5, parte "tripulação abandona se pegar fogo" (tripulação abstrata).
- **Correção fora dos procedimentos**: o caminhão que atende um pedido de reparo ou munição agora chega a `MIND.serve.r / 2` (12 m) do pedinte; antes parava a 40 m, fora do alcance de serviço (25 m), e um carro parado (imobilizado ou segurado por um procedimento) nunca era consertado.
- `drOf(id, cls)`: um mesmo id pode ter uma entrada por classe (`drFor`); `drEnd`, `drStep`, `sqMan`, `drOnce` e o `unload` passam a classe.
- README (parágrafo "Procedimentos") e `tests/README.md`; `tests/veh-drills.js` na lista do `tests/all.sh`.

## O que foi e o que NÃO foi testado

Antes da regra nova do capitão (entregar sem testes), passaram nesta branch, depois do merge de main com linha de visada, cobertura e veterania: `veh-drills`, `drills` (com e sem as batalhas de 120 s), `cover`, `missile-los`, `perception`, `online`, `world-online`, `cover-online`, `seat`, `loadout`, `loadout-more`, `loadout-stores`, `transport`, `sky`, `sky-online`, `comms`, `logistics`, `logistics-online`, `civ`, `civ-online`, `civ-war`, `rec`, `rec-online`, `orders-online`, `bridges-online`, `world`, `frame-budget`, `campaign`, `personality` e os `*-relay`. `help` e `vet` passaram em partes isoladas depois das correções.

**Não verificado** (os últimos merges de main, com #38, #41, #42, #43 e #46, não foram testados; só o smoke):
- `tests/orders.js`: falhou 2× nesta branch (rodando com a máquina carregada): "fort trench: the general picks the nearest free squad [...] who go to dig (fcap)" e "they reach the place and a trench is started there". Não comparado com main; pode ser um procedimento (ex.: `perimetro`, `area-batida`) atrasando a esquadra que vai cavar, ou carga da máquina.
- `tests/bases.js`: estourou o tempo (1500 s) com a máquina carregada; não se sabe se passa.
- `tests/bridges.js`: o teste "demolish again: refused (down)" falhava aqui pelo cool-down do primeiro comando; main (#41) trouxe o mesmo ajuste, mantido no merge. A suíte não foi rodada de novo.
- `tests/field.js`: o teste do ponto de conquista foi ajustado (tira os jatos inimigos, como `calm`); só aquele bloco foi rodado, não a suíte inteira.
- `tests/help.js` e `tests/vet.js` não foram rodados inteiros depois das correções.
- Custo: o código dos procedimentos mede ~0,05 ms do quadro de IA de ~5,9 ms (< 1%); as médias de batalhas com e sem procedimentos variam de −6% a +9% entre sementes (as partidas divergem). Sem medição longa online.
- Comportamento visto só nos testes: ninguém olhou uma partida para ver se o carro parado na borda da vila esperando infantaria (`cidade`) ou o caminhão parando antes da área batida ficam estranhos ou travam a frente.

## Riscos

- `cidade` segura o carro (`drive = 0`) até 45 s na borda de uma vila sem infantaria amiga à frente: pode atrasar ataques blindados.
- `radar-silencio` tira a trava da antiaérea até o tiro estar no envelope: pode deixar passar um avião rápido no primeiro segundo.
- `emboscada-v` mantém a esquadra a bordo na zona de morte (o `unload` é envolvido): se o gatilho errar, a esquadra demora a desembarcar.
- O caminhão de serviço agora chega a 12 m: pode encostar/colidir com o carro em estrada estreita.
- Os testes de vários sistemas (transporte, campo, pontes, ordens) dependem do tempo de relógio (o orçamento de IA, `AIB`); com a máquina carregada eles oscilam, o que mascara regressões reais.

## Como testar depois

Com a máquina pouco carregada, uma por vez:

- `node tests/veh-drills.js` (cada procedimento: gatilho → comportamento, honestidade, batalhas de 120 s; `SECS=0` pula as batalhas)
- `node tests/drills.js` (tabela, honestidade, custo do código dos procedimentos)
- `node tests/orders.js` e o mesmo com `PAGE=<página de main>` para comparar; se só falhar aqui, ver qual procedimento a esquadra que vai cavar está fazendo (`q.dr`, `q.drH`).
- `node tests/bases.js`, `node tests/bridges.js`, `node tests/field.js`, `node tests/help.js`, `node tests/vet.js`, `node tests/transport.js`
- Partida assistida (Visão de General) em 1944 e moderna: carros chegando a uma vila, comboio sob avião, antiaérea com caça inimigo longe, avião sob míssil.
