# cf-gbu-lock — lock da GBU no alvo mais perto do alcance (parte testada)

Testado em cf-pol-testes-a, sem tela, pelo novo `tests/gbu-lock.js` (todos ok): A-10 com GBU-12 a 300 m e 110 m/s (alcance `LO.reach` 1175 m), três alvos no cone a 470, 940 e 1880 m: trava o de 470; sem ele, o de 940; só o de 1880: nenhum lock e `LOCK.far` (FORA DE ALCANCE); a 1500 m e 160 m/s (alcance 4676 m) o de 1880 trava; morro na frente: nenhum lock e `LOCK.blk` (SEM LINHA DE VISADA); o `LO.seek` do jogador dá o mesmo lock; a IA (`LO.aim`) larga o próprio alvo fora do alcance e pega o que está nele, ou o ponto sob o nariz.

Nota: o buscador só vê até `GUIDE.rng` (6500 m em linha reta). A 1500 m e 160 m/s a GBU-12 já alcança 4,7 km, então "FORA DE ALCANCE" só aparece para alvo entre o alcance e 6,5 km; com GBU-32 alta e rápida pode nunca aparecer.

## Ainda não testado
- A HUD na tela: colchete tracejado, o texto "FORA DE ALCANCE" (`S.farGnd`) e "SEM LINHA DE VISADA". Não coube no tempo do navegador headless (precisa voar o A-10 com alvos à frente). Como: hangar, A-10 com "Ataque ao solo", voar a 300-1500 m com veículos inimigos a 1-6 km; baixar/acelerar/subir muda o colchete.
- Partida com IA de CAS (A-10 com gbu12): se ela solta nos alvos próximos, sem erro no console. Como: "Assistir" em Hoje e seguir um A-10 (F, `[` `]`), ou contar no harness as GBU soltas e a distância do alvo.
- Custo de `LO.reach` (laço de planeio) a cada quadro no lock: não medido (`tests/frame-budget.js` com um A-10 de GBU na tela).
