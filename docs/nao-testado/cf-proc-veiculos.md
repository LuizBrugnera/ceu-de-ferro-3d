# cf-proc-veiculos: procedimentos de combate de veículos e aeronaves (não testado por inteiro)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Assistir em Hoje (3 lados), 3 min de partida: 13 procedimentos dispararam pelo que cada unidade percebe, sem erro no console. Contados por amostra (unidade × procedimento, a cada 0,5 s): `comboio` 872 (caminhões), `radar-silencio` 671 (antiaérea), `passe` 654, `radar-aa` 150, `missil` 140, `cauda` 7 e `avaria` 9 (aviões), `aereo-v` 305 (tanques e blindados saindo do aberto sob avião), `cidade` 159 (tanques na borda de vila), `aereo-c` 160 (caminhões e carros), `contrabateria` 39 (artilharia).
- `tests/veh-drills.js`: não rodou nesta tarefa (faltou tempo com a máquina cheia).
- **Continua sem teste:** a emboscada na estrada (`emboscada-v`) e o efeito no tempo dos ataques blindados (o `cidade` segura até 45 s), o custo numa partida longa online.

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

## Testado em bbd5085: ok (tarefa cf-testar-mundo)

- `tests/veh-drills.js` inteiro, com as batalhas de 120 s: passa (60 ok). `tests/help.js` passa, e `tests/drills.js` também, salvo dois procedimentos da **infantaria** (contato depois de silêncio, esperando a carona), fora deste pacote.
- `tests/bridges.js` passa (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/113).
- `orders`, `field`, `bases`, `transport` e `vet` têm falhas que não são dos procedimentos de veículo. Com uma cópia da página com `DRILL.on = 0`, as mesmas falhas de `orders.js` e `field.js` aparecem:
  - `orders`: rotas com pontos de passagem e `fcap`;
  - `field`: patrulha e ponto de conquista;
  - a falha a mais de `field` com os procedimentos ligados é uma esquadra a 86–116 m do posto sem procedimento ativo (`dr` vazio);
  - `transport`: a lista de veículos mudou;
  - `bases`: limite e IA que constrói;
  - `vet` quebra com `dsOf`/`.ends` de rota inexistente (`post` → `myRoutes`), código dos 3 lados.
- `tests/bases.js` roda em ~15 min com a máquina pouco carregada.

## O que NÃO foi testado

- Partida assistida no navegador: carros chegando a uma vila (`cidade`), comboio sob avião, antiaérea com caça longe e avião sob míssil.
- Custo de uma partida longa online.

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
