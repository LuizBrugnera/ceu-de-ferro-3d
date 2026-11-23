# cf-pol-graficos, rodada 3: fumaça, rastros e a sombra dos aviões (não testado além do que está abaixo)

Polimento dos gráficos do que já existe, visto na GPU daqui (RTX 4060, Chrome headless com ANGLE/GL), com capturas antes × depois na mesma câmera. O que mudou e o que ficou sem teste.

## Rastros
- O rastro de um míssil ou de um foguete era feito de PJ.n puffs tomados a cada PJ.every s: mais de 20 m entre um e outro num míssil, então lia-se como contas num fio. `pjRibbon` agora põe entre duas amostras tantos puffs quantos fazem uma faixa (cada um a PJ.gap da largura do próximo, nunca a menos de PJ.px pixels na tela, PJ.sub no máximo) e, enquanto o motor queima, fecha o rastro até a cauda.
- Um avião que fumega ou cai, um helicóptero avariado, um veículo que queima, um míssil e um foguete soltam puffs de fumaça do sim, um por passo. O puff agora guarda quem o soltou (`puff(..., e)`; nada no sim lê isso e os sorteios de `rand` são os mesmos) e a vista (`pjJoin`) liga cada puff ao anterior da mesma fonte, com os do meio mais fracos para que a faixa não fique mais escura que as contas eram.
- Os rastros ficam com o que sobra do lote de faíscas (MAXP subiu para 5000); MAXPR (2200) fica reservado para os pontinhos dos soldados e as cortinas de fumaça, que vêm depois no laço.

## Fumaça das explosões
- As faíscas apagadas (fumaça, poeira, cortinas, rastros) e a fumaça e a poeira das explosões (XFX) são sombreadas como bolas pelo sol: um lado claro e um escuro, em vez de discos chapados. `sunW` é a direção do sol e `sunK` quanto ele brilha (nada de noite ou na chuva, quando fica a luz de antes).
- Uma explosão no chão levanta, junto da fumaça preta da carga, duas partes em três de fumaça marrom da terra (o tipo 8), que clareia para cinza.

## Sombra dos aviões
- Era um disco duro de 14 lados bem embaixo de cada avião. Agora é a silhueta borrada de um avião (ou o rotor redondo de um helicóptero), virada para o rumo, projetada ao longo do sol (com o sol nunca mais baixo que uns 20°, PSH.sun), deitada na encosta e fraca sem sol. Na Alta, perto do olho, onde o próprio avião faz sombra de verdade, a falsa some.

## Testado
- `tests/smoke-look.js` (novo): o puff guarda a fonte e sorteia o mesmo; os rastros de míssil sem contas e com o fecho na cauda; a junção dos puffs de um avião e o que não se junta (veículo parado, puffs com 1 s de diferença, 400 m de distância); a sombra ao longo do sol, virada, fraca sem sol, sumida na Alta perto do olho; os uniforms do sol nos dois shaders.
- `tests/sparks-light.js` (atualizado para o sombreamento pelo sol), `tests/gfx.js`, `tests/road-mesh.js`, `tests/sim-split.js`, `tests/road-look.js`, `tests/water-shore.js`, `tests/veg-fade.js`.
- Capturas antes × depois: explosões de cada classe (granada, morteiro, obus, bomba pesada, 2000 lb) em vários instantes, o rastro de um avião que fumega e de um foguete (sintéticos, na mesma câmera), a sombra de um avião posto sobre o mesmo ponto, de dia e à tarde, e o tempo de GPU de uma cena pesada (12 explosões de obus, uma bomba pesada, 3 aviões fumegando, 6 foguetes), na Média (veja o PR).

## NÃO testado
- Uma partida jogada de verdade com isso: os rastros e a sombra foram vistos num mundo parado, com puffs e foguetes postos por script (o laço do sim reproduzido no script).
- Online: o convidado faz os mesmos puffs pelos mesmos caminhos, mas não foi visto.
- A Baixa e a Alta (só a Média foi capturada); 1920 px; neblina; um helicóptero com a sombra nova.
- Com o sol muito baixo (fim de tarde) a sombra para de se alongar no piso de PSH.sun (uns 20°): um avião a 400 m faz sombra a no máximo ~1,1 km, quando a de verdade iria muito mais longe.
- Uma salva grande de foguetes perto do olho: os rastros param de ganhar puffs quando o lote chega a MAXP - MAXPR; não se viu se isso corta rastros visivelmente.
- Nas capturas por script, alguns quadros saem sem a água (o mesmo de antes, também no main: veja cf-pol-graficos-2.md).
