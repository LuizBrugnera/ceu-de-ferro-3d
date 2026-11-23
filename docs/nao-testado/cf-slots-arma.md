# Compartimentos da infantaria (1 a 5) e explosivos como "armas" (cf-slots-arma) — não testado

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Plantador de IED: 3 → Granada ×2, 3 de novo → Fumaça ×1, 4 → IED de placa de pressão ×3, 4 de novo → IED antipessoal de comando ×5, 5 → Celular, 1 → de volta ao AKM.
- Homem-bomba: 3 e 4 como acima (Carga de demolição ×1), 5 → Colete explosivo, com "COLETE EXPLOSIVO · ARMADO / Clique: detonar (raio de 32 m). Com inimigo a 8 m ele explode sozinho" e a linha "5 ▸ [Colete explosivo]" no HUD. 1 → Makarov.
- Com o colete na mão, a 1ª pessoa ainda mostra a pistola. Sem erro no console.
- **Continua sem teste:** o clique usando cada item (armar a mina, plantar o IED, o celular detonando os IEDs no alcance), o modelo da granada e da mina na mão, o online.

Pedido do capitão: "na infantaria, trocar de arma com 1, 2, 3 e por exemplo os sapper e ied, homem bomba, ser nas armas deles o ngc de plantar e explodir coisas".

## O que mudou

- **Teclas 1 a 5** (bloco "the soldier's compartments (SLOT)" no fim de `Céu de Ferro 3D.html`): a pé, fora de veículo, sem drone no ar e fora dos menus (troca de veículo/requisição, visão de general, pausa), cada número é um compartimento:
  - **1** arma principal, **2** secundária (lançador, míssil, morteiro, pistola do sniper; sem secundária o 2 só avisa "Nada no compartimento 2");
  - **3** granadas: explosiva e fumaça (a mesma de F e G);
  - **4** o que se planta: a **carga de demolição** (todo soldado); o **sapador** (Pionier, Combat Engineer, Sapyor) também **mina AT** e **mina AP**; o **Plantador de IED** também **IED de pressão**, **IED antipessoal** e **IED de comando** (novo);
  - **5** o que se detona: o **celular** do Plantador de IED (detona os seus IEDs de comando a até 600 m) e o **colete** do homem-bomba.
  - A mesma tecla de novo passa ao próximo item do compartimento. Botão direito, Q, 1 ou 2 voltam à arma. N, F, G e V continuam como eram.
  - 6 a 9 ficaram como estavam (visão noturna, sinalizador, pedidos de ajuda), por isso os compartimentos param no 5. As teclas 1 a 4 continuam olhando em volta na cabine do avião (o compartimento só vale a pé).
- **Usar**: a mina/IED usa o modo de mina do sapador de antes (`S.mm`, agora com `sl: 1`): o mesmo contorno verde/vermelho, as mesmas regras (`mineWhy`: base, distância de outra mina, inimigo perto, limite de 30 por lado, servidor antigo, espera do anfitrião). A carga vai onde o N poria, na mesma ordem (ponta de ponte, veículo parado/antiaérea fixa/rádio para o sapador, base ou instalação inimiga, parede à frente), com as mesmas funções (`brPlant`, `sabPlant`, `plant`, `bldPlant`); o alvo aparece marcado na tela. A granada sai como a de F/G (`c.nade`).
- **IED de comando** (novo, só o Plantador de IED, 2 por vez, repostos no depósito): uma mina de tipo 2 em `S.mines`; não explode com quem passa (`mineStep` pula), só pelo celular; a explosão é a do IED de comando da IA (`INS.ied`: 260 de dano, 9 m) e quebra a lagarta/roda de um veículo inimigo em cima. O inimigo o detecta e desarma como uma mina. Os IEDs são do jogador (`o.pid`), também depois de morrer e voltar.
- **Colete**: arma 2 s depois de entrar (como antes); o clique no 5 detona na hora (`bombGo`). A detonação automática com inimigo a 8 m continua.
- **Rede**: servidor aceita o tipo 2 nas linhas de mina e no `mboom`, e o `mreq` do convidado ganhou k 4 (plantar IED de comando), 5 (celular) e 6 (colete); o anfitrião decide como nos outros pedidos.
- **HUD**: a coluna da esquerda numera as armas (1, 2) e mostra as linhas 3 a 5 com o item escolhido entre colchetes; no meio da tela, o que o item faz e por que não dá (sem alvo, sem carga, armando...). Ajuda das teclas (hangar), briefing do Plantador de IED e do homem-bomba, e README.
- **Primeira pessoa** (cf-arma-1p): granada mostra o modelo `w_grenade` do pack, mina/IED o `p_mine`; carga, celular e colete mostram a arma de antes. Trocar de compartimento faz a mão descer e subir (o `swT` da troca).
- **IA**: nada muda (as funções da IA não leem os compartimentos; `walk` só mexe no soldado do jogador).

## O que NÃO foi testado

Nada de suítes, partidas ou A/B (regra do capitão). Só: sintaxe da página e do servidor, o servidor sobe, a página abre sem erro novo no console, e no console `slotComp` devolve os itens certos para Plantador de IED, homem-bomba, sapador e fuzileiro, e a linha "1 a 5" da ajuda sai certa.

**Nenhuma partida foi jogada com isso.** Não visto: as teclas numa partida, a granada/mina/carga/celular/colete pelo clique, o HUD, o modelo em primeira pessoa, nada online.

## Riscos

1. **Clique que vira tiro**: com um item na mão o tiro é cortado (`c.fire = false`) depois do `walk`; se outro caminho ler o gatilho antes, a arma pode disparar junto.
2. **Mina pelo 4 x N**: o modo de mina é o mesmo do N; apertar N com a mina na mão passa ao próximo tipo ou fecha como antes, e a barra pode ficar fora de sincronia por um quadro.
3. **IED de comando online**: linhas de mina com tipo 2 só passam com o servidor novo (servidor antigo recusa a lista inteira de minas, então página e servidor precisam subir juntos). Depois de trocar de anfitrião, os IEDs do convidado perdem o dono e ficam detonáveis por qualquer celular do lado (a regra de reserva).
4. **Colete do convidado**: o tempo de armar do convidado é contado na página dele (o anfitrião confere o dele).
5. **HUD**: as linhas 3 a 5 empurram "N KIT DE BASE" para baixo; o texto do meio (60% da altura) pode encostar no "CONSTRUINDO" de uma base em obra.
6. **Modelos**: o tamanho e o encaixe da granada e da mina na mão (`len` .1 e .26, encaixe de pistola) foram escritos sem ver.

## Como testar depois

```
node server.js            # http://localhost:8080
```

1. Hangar, Infantaria, era Hoje, EUA, Fuzileiro: 1 e 2 (o 2 só avisa), 3 (granada na mão; clique lança; 3 de novo: fumaça), 4 (carga; sem alvo: aviso; encostar numa parede de prédio de frente: alvo "PAREDE", clique arma e abre o buraco em 5 s). Botão direito e Q voltam à arma.
2. Combat Engineer (Sapador): 4 → mina AT com contorno; clique arma; 4 de novo → AP; 4 de novo → carga (num veículo inimigo parado: alvo e clique). Conferir as recusas (base, outra mina perto, inimigo perto, limite).
3. Partida de 3 lados (Insurgentes), Plantador de IED: 4 até o IED de comando, plantar 2 na estrada, afastar-se, 5 → celular mostra os IEDs com distância; esperar um veículo inimigo em cima e clicar: explode, quebra a lagarta. Morrer e voltar: o celular ainda acha os IEDs.
4. Homem-bomba: 5 → colete "ARMANDO" e depois "ARMADO"; clique detona.
5. Primeira pessoa (C até a visão de olho): granada e mina aparecem na mão; carga/celular/colete mostram a arma.
6. Online (anfitrião + convidado): os itens 4 e 5 do convidado, inclusive IED de comando e colete; com o servidor antigo, o aviso de servidor antigo.
7. Teclas 1 a 4 no avião (cabine) ainda olham em volta; 6 a 9 como antes; 1 e 2 no general (visão de general) e no quadro de troca de veículo como antes.
8. Telas de 1280 e 1920 px: a coluna da esquerda e o texto do meio.

## Arquivos

`Céu de Ferro 3D.html` (bloco novo no fim; `sapShort`, `mineLift`, a mina do sapador, `mineStep`, `mineBoom`, `Net.rx.mine`/`mboom`, `hudFort`, `hudMan`, `vmRender`), `server.js` (mine/mboom/mreq), `README.md`.
