# cf-3l-p7-guerrilha: doutrina insurgente (P7 dos 3 lados)

**O que mudou** (`Céu de Ferro 3D.html`, bloco "the Insurgents' doctrine", logo antes do mapa tático `TM`):
- `INS`: a tabela da doutrina. `insT(t)` só é verdadeiro na Frente atual para o lado com `S.fac[t] === 2` (partida de 3 lados). Com 2 lados nada roda, nada sorteia, nada muda.
- `PERS.ins` (não enumerável: o "Sorteio" nunca tira essa personalidade): bate e foge, incursões, emboscadas, poucos tanques. `perSet` dá `ins` ao lado insurgente quando a partida não escolheu outra.
- **IED na estrada habitual:** a cada 75 s o general insurgente pega a aresta da rede de estradas que o inimigo mais usa (`HAB`, `habOf`; sem hábito ainda, a estrada de um veículo inimigo conhecido) e manda `fort mineat` ali (o sapador vai, planta 5 IEDs de placa de pressão atravessando a estrada e volta). Junto vai um **IED de comando** (`S.insC`): arma quando o campo é plantado, explode sob o primeiro veículo inimigo a 10 m enquanto um insurgente a pé o vigia a até 300 m com linha de visada, salvo quando as regras de fogo (`roeHeld`) seguram.
- **Carro-bomba e homem-bomba pelo general** (`insBomb`, a cada 90 s): o alvo inimigo conhecido de mais valor até 6 km da base. Contra veículo ou instalação, um `vbied` (custa como um carro) que dirige até lá; senão um homem-bomba com um escolta (esquadra de 2, ordem `move`). A IA do conteúdo (#67) assume a 900 m / 220 m. `bombHeld` agora vale para todo lado da IA (antes só 0 e 1): a IA insurgente também segura a bomba com civis vistos.
- **Drones kamikaze:** o lado insurgente mantém até 4 FPV no ar e nunca lança a munição vagante de longo alcance.
- **Bate e foge:** o fustigamento (`gue`) é oferecido ao insurgente mesmo sem estar perdendo; o golpe de uma incursão (`raid`) dura no máximo 60 s; a fuga do fustigamento vai para a vila ou mata mais perto (até 1,5 km), do lado oposto ao alvo.
- **Disfarce (D9 a):** um insurgente a pé dentro de uma vila, sem atirar há 30 s, fica no máximo "reconhecido como homem" (grau 1 da escada) para a IA dos outros lados: ela olha mas não atira, nem míssil guiado. A 150 m ou atirando, volta ao normal.
- **Economia irregular:** imposto por ponto-vila controlado (6 energia + 4 metal por minuto), contrabando (18 + 14 por minuto) enquanto o corredor da borda do mapa mais perto da base até a base não tem inimigo a 250 m (log quando é cortado e reaberto), sucata (metal por casco inimigo destruído que um insurgente alcança a 400 m, uma vez por casco). Unidades pagam o preço de `FACTIONS.modern.insurgentes.eco` (o resto do preço de `ECO.unit` volta enquanto é pago). Instalações perto da base pontuam menos, nas vilas mais, e uma instalação numa vila vira **oficina escondida** (um lote próprio, as regras de `ECO.lot`).

**Smoke feito (~1 min):** o script passa no `node --check`; a parte de simulação carrega num vm com os embrulhos novos sem erro; o servidor sobe em 127.0.0.1 e entrega a página (200).

**Não testado (nada):**
- Nenhuma partida de 3 lados: o P0 (`S.N`, `SIDES()`) e o P4 (ligar a facção, `S.fac[2] = 2`, `INF.modern[2]`) ainda não estavam no main; todo o código está desligado até `S.fac[t] === 2` existir.
- O `tests/harness.js` não roda partida nem no main (`aarShow`, `m5Lg`, `mmMan` ficam depois do marcador `3D scene`); nenhuma suíte, nenhuma partida, nada online. O navegador (`chrome-devtools-axi`) não alcança o 127.0.0.1 deste node: a página nunca foi vista.
- Tudo acima: IED escolhendo a estrada, sapador indo plantar, IED de comando explodindo, carro-bomba dirigindo fora do trilho (`u.rail = false` + `driveTo`), homem-bomba com escolta, FPV, fustigamento e fuga, incursão de 60 s, disfarce, imposto, contrabando, sucata, desconto, oficinas nas vilas.

**Riscos:**
- Depende de ajudantes de outros pacotes: `addSquad` com `INF.modern[2]` (P4; sem isso o homem-bomba não sai), `cmdOf`/`S.cmd[2]` (P0/P6a), `gLog`, `civD().roe`, `roeBar` e `S.dow` com índice 2 (P0/P8), `ecoD(2)` (P6c), `S.per`/`S.dif` de tamanho 3. Se algum não aceitar o lado 2, pode lançar erro no passo do anfitrião.
- `grade` ganhou um embrulho no caminho quente da percepção (custo: um teste por chamada; a busca de vila é guardada a cada 2 s por homem).
- O disfarce baixa para grau 1 (não 2, como diz o plano) porque nesta escada a IA já atira no grau 2; o efeito pedido ("só atira no degrau 3") é o mesmo.
- O lote das oficinas é gravado em `S.T.lots` (limpo no `ecoInit` seguinte); se o terreno for compartilhado com o convidado, ele não conhece esses lotes (a oficina aparece como instalação comum para ele).
- Balanço: números chutados (`INS`): IED a cada 75 s, 4 IEDs de comando, 1 carro-bomba e 2 homens-bomba vivos, renda irregular.

**Como testar depois (com P0 e P4 no main):**
- Partida IA × IA de 3 lados na Frente atual (`newState('modern', null, { watch: 1, ... })` com 3 lados): log do general insurgente com "IED ordenado", "IED de comando detonado", "Carro-bomba enviado", "Homem-bomba enviado", "Rota de contrabando cortada", "Sucata recolhida"; ver `S.insC`, `S.eco.d[2].irr`.
- Disfarce: um insurgente parado numa vila a 300 m de um tanque da IA não deve levar tiro; a 100 m ou depois de atirar, sim.
- Regressão de 2 lados: `bash tests/all.sh` (depois de consertar o harness) deve dar o mesmo de antes; `Object.keys(PERS)` continua sem `ins`.
- Online com anfitrião e convidado: IEDs, bombas e oficinas só no anfitrião.
- `node tests/sappers.js`, `node tests/drone.js`, `node tests/civ.js`, `node tests/ambush.js`, `node tests/frame-budget.js`.
