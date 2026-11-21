# cf-pol-modelos: a Shilka sobre lagartas e as antiaéreas rebocadas (testado em parte)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): parte
- Navegador, pelos botões (Insurgentes, Transporte, até a ZSU-23-4 Shilka) e "Continuar": a partida começa na Shilka (assento `gunnerM`), sem erro. Na cena de fora aparece o corpo sobre lagartas com a torre e o prato do radar.
- **Achado no hangar** (ver `cf-pol-hud`/RESULTADO-B): a 1280×713 com uma partida suspensa, o carrossel encolhia a 132 px e o modelo escolhido ficava sob o nome; consertado neste lote (`tests/hangar-short.js`). A Shilka no carrossel não foi conferida de perto depois disso.
- **Continua sem teste:** a Shilka atirando e girando a torre numa partida, o destroço, a visão do atirador.

## O que mudou

A ZSU-23-4 Shilka capturada dos Insurgentes usava o corpo do LAV-25: oito rodas e casco de barco. A de verdade é sobre lagartas. Agora tem modelo próprio, feito com o kit `VK`, como o wrapper mais interno do `buildTrn`:

- seis rodas de apoio e esteiras, que rodam com ela (rodada das rodas);
- casco baixo com a frente inclinada;
- torre chata com os quatro canos de 23 mm e o prato do radar no poste atrás.

A torre e os canos giram onde giravam (torre no lugar do LAV, canos a `tl × 0,55`). As peças de dano são as do LAV:

- `wheels`: as esteiras;
- `hull`, `engine`, `turret`, `gun`;
- `sight`: o radar e a mira.

A bandeira dos Insurgentes continua (vem de outro wrapper). O embrulho dos Insurgentes punha mais quatro canos no grupo da arma da Shilka, por cima dos do modelo; tirei a Shilka (e as rebocadas) daquela linha. 1 116 triângulos e 12 chamadas de desenho, contra 784 antes.

## As antiaéreas rebocadas (`TAAB`)

A ZPU-4, a ZPU-2 e a DShK no reparo antiaéreo eram o corpo baixo de carro com canos espetados. Agora, com o kit:

- as ZPU vão na carreta: rodas, armação com a barra de reboque e os macacos, o pedestal, o banco do atirador e as KPV aos pares com as caixas de munição;
- a DShK vai no tripé;
- a montagem e os canos ficam e giram onde ficavam;
- as peças de dano são as do carro (rodas; casco).

São 684, 588 e 156 triângulos.

## O que foi testado

No navegador, a galeria do hangar (Shilka, LAV-25, BTR-82A, ZPU-4, ZPU-2, DShK), de frente e de trás.

## O que NÃO foi testado

- A Shilka numa partida, atirando e girando a torre.
- O destroço.
- A visão do atirador (`gunnerM`).
