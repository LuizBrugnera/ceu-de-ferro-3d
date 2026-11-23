# cf-bomba-killcam: quem detona morre, e a kill cam da explosão

Pedidos do capitão: "do homem bomba e caminhão bomba e carro bomba, deve matar quem fez, e na morte deve mostrar uma kill cam da explosão" e "a camera de bomba, deve continuar mais uns 3 segundos dps de explodir, para conseguir ver o estrago".

## O que mudou (`Céu de Ferro 3D.html`)
- **Quem detona morre**: antes, o motorista do carro-bomba, da picape-bomba ou do caminhão-bomba saía a pé ("Você saiu a pé"). Agora `bombGo` marca o veículo (`u.bKill`) e o `thrown` desses lugares mata quem estava neles (jogador e IA; online, o `eject` vai com dano mortal). O homem-bomba já morria (`killMan`). A morte é a normal: `playerDown`, mesma volta.
- **Kill cam** (`KC`, `S.kcB`, `S.kc`): `bombGo` e `stkSvbGo` anotam a explosão. Se o jogador morre até `KC.win` (3 s) depois dela e a até 1,8 raio + 10 m dela (quem detonou ou vítima, inclusive pela cluster do caminhão), a câmera gira em volta da explosão, de fora (distância r·1,6+25 entre 50 e 260 m, altura 0,4 disso), por `KC.t` = 6,5 s (≈3,5 s da explosão + os 3 s pedidos para ver o estrago). Enquanto isso a tela de troca não abre e a volta fica para pelo menos `KC.t + KC.after` (8 s). A faixa da morte diz o tipo ("Carro-bomba · …").
- Parte da simulação logo depois do `end of cf-vbied (the sim)`; a parte de tela (câmera e `openSwap`) no fim do `cf-vbied on the screen`.

## Testado
- `tests/bomba-killcam.js` (novo, passa): jogador no colete, no carro, na picape e no caminhão morre, kill cam no tipo certo, ainda morto 6,5 s depois e volta em seguida; o motorista IA morre com o carro; um fuzileiro a 8 m de um carro-bomba da IA morre e ganha a kill cam; morte sem bomba perto não tem. `bomba-ia.js` e `svbied-cluster.js` passam.
- Navegador (Chrome headless, 1280×720, anfitrião sozinho na sala): carro-bomba e caminhão-bomba detonados com a tecla 5, colete pelo `vestGo`, e vítima de um carro-bomba da IA a 15 m: morte, câmera de fora girando na explosão, faixa "MORTO EM COMBATE / Carro-bomba · …", depois a tela de troca. Sem erro no console. Prints em `/home/luiz/firstmate/data/cf-bomba-killcam/`.

## Não testado
- Convidado online: o motorista convidado morre pelo `eject`, mas a kill cam não aparece para ele (a explosão só acontece no anfitrião e não vai pela rede).
- A tecla do colete no navegador (usado `vestGo`, o mesmo que a tecla chama).
- Com GPU real (o Chrome de teste roda a simulação mais lenta que o relógio).
