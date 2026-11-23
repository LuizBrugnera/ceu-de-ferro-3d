# cf-intercepta-missil: abater míssil a tiro (o que ainda falta testar)

Testado (cf-pol-testes-a): a checagem focada pedida virou `tests/mint.js` e passa. Ela achou um bug: nenhum tiro acertava o míssil. O teste do acerto em `stepShots` comparava a bala depois de andar no passo com o míssil antes de andar (o `MSL.step` vem depois). O erro é `m.v × dt` (uns 2 m num Javelin, mais num míssil rápido), maior que o raio `MINT.r` de 1 m. Agora o míssil é tomado onde o passo o deixa. Antes do conserto, 0 de 23 tiros mirados acertavam, com qualquer calibre. Depois: o .50 derruba o Javelin no 8º tiro, o 14,5 no 6º, o 20 mm no 3º, o 30 mm no 2º e o CIWS no 1º. O fuzil nunca acerta. No convidado a bala só faz faísca. O míssil abatido explode no ar e fere quem está embaixo. O `calOf` lê certo os nomes.

IA (`aiMint`), medida no sandbox: um Javelin lançado a 900 m contra um veículo parado, 3 sementes por veículo.
- Técnica com DShK: abre fogo em 1,2 a 2,2 s, 28 a 37 tiros. O míssil fica com 3 a 7 dos 8 de vida.
- ZPU-4: 64 a 85 tiros, sobra 0,5 a 6,5. M16: 48 a 51 tiros, sobra 2 a 5.
- Nenhum Javelin caiu. A .50 de teto do Abrams e a NSVT do T-72 dão 0 ou 5 tiros.
- A Shilka não atira. Ela vê o Javelin no lançamento, mas o perde quando ele sobe (sai do cone `MINT.ai.cone`). O mergulho final já vem dentro dos 120 m mínimos (`MINT.ai.gun[0]`).
- É balanço, não erro: o Javelin ataca por cima.

## O que ainda não foi testado
- **Online**: o convidado derruba um míssil e a mensagem `mkill` leva `b: 1` pelo `server.js`; a explosão em cada cópia; o anfitrião decidindo os tiros do convidado. Precisa de dois clientes reais (como `tests/drone-online.js`).
- **IA contra míssil de voo direto** (TOW, Kornet, Hellfire de helicóptero), em que o cone pega o míssil o voo todo. Rodar o exercício acima com `MSL=kornet` (`/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/mint-ai.js`).
- **Partida IA × IA**: se a IA fica presa atirando em mísseis e quanto custa por quadro com muitos mísseis (`node tests/frame-budget.js`).
- **Navegador**: o texto "míssil abatido" e a faísca.
