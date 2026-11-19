# cf-insurgentes-conteudo: a facção Insurgentes (conteúdo), homem-bomba e carro-bomba

**O que mudou** (`Céu de Ferro 3D.html`, README):
- `TANKS.t55`, `TANKS.t62` (capturados, `side: 2`, `fac: 'insurgentes'`), `DMG.rack` deles (munição explode mais fácil); `ARTS.tec107` (técnica com foguetes de 107 mm).
- Bloco "the Insurgents" logo depois de `sapShort`: `ARMS.rcl` (SPG-9), `ARMS.zu23`; `SARMS` akm, pkm, svd, pm, rpg7v, malyutka, kornet, strela, mort82; 12 kits em `KITS` (`insRifle` … `insBomber`), mas em nenhuma lista `INF` (não mudam o índice que o servidor usa); nomes de IED em `SAP.names.modern[2]`; nomes de drone `[2]` em `DRONES`/`DDEF`; veículos em `TRNS` não enumeráveis como os do REC: `tecDshk`, `tecSpg9`, `tecZu`, `moto`, `suv`, `sedan`, `vbied`, `zil131`, `btr70`.
- `FACTIONS.modern.insurgentes`: lado no formato de `ERAS` (`side`), kits (`inf`, `squad`), veículos por papel (`veh`), `aaTrn`, `bomb`, `uniform`, custos `eco` (no formato de `ECO.unit`); `facOf(id)`, `facCost(kind, fac)`.
- `BOMB` e a lógica: `bombStep` (pendurado em `trnStep`), `bombGo` (usa `explode` com `he: 1`, fogo, poeira, nuvem em `S.smokes`, tremor), embrulhos em `killMan`/`killUnit` (morto armado pode explodir), em `aiMan` (o homem-bomba corre ao inimigo mais próximo em 220 m) e em `AI.car` (o carro-bomba dirige com `driveTo` até 900 m). A IA respeita `roeHeld` (civil visto na explosão, alvo não identificado).
- Visual (depois do REC no `buildTrn`): `MCOL.modern[2]`, `TLOOK` dos veículos novos, bandeira preta, tubo do SPG-9, canos do ZU-23, tambores e fio no carro-bomba.

**Testado (só fumaça, ~1 min):** a página passa no `node --check`; o servidor sobe em 127.0.0.1 e entrega a página (200). Num script avulso (fora do repo) carregando a simulação como o `tests/harness.js`: todos os veículos e kits montam; o homem-bomba a 5 m de um T-72 explode (135 → 31 de vida); o carro-bomba a 10 m destrói o T-72; um homem-bomba armado morto por tiro explodiu e matou o fuzileiro do lado. Obs.: o `tests/harness.js` de hoje não carrega nem no main (`aarShow is not defined`); no script avulso pus um `aarShow` vazio.

**Não testado:**
- Nada no navegador: o `chrome-devtools-axi` não conseguiu abrir a página (tempo esgotado na navegação, duas vezes). Os modelos 3D (técnicas, moto, carro-bomba, BTR-70, T-55/T-62, técnica de 107 mm, bandeira) nunca foram vistos.
- Nenhuma suíte, nenhuma partida, nada online. A facção não entra em partida nenhuma até o trabalho dos 3 lados.
- IA: o homem-bomba correndo até o alvo (`aiMan`), o carro-bomba dirigindo (`AI.car`), a retenção pelas regras da guerra (`roeHeld`), e o general escolhendo esses alvos (o general ainda não os coloca em campo).
- Online: a explosão só acontece no anfitrião (`bombSim`); o convidado não vê o efeito (`blastFx` é local) e o dano chega pelo caminho normal de dano. Não exercitado.
- Jogador como homem-bomba ou no carro-bomba: explode sozinho perto do inimigo (não há tecla de detonar); a moto, as técnicas e o BTR-70 dirigidos pelo jogador; o assento `gunnerM` do BTR-70.
- ZU-23 da técnica contra aviões e drones (é uma arma de carro; a IA de carro talvez não mire para o alto); o SPG-9 como arma `shell` num carro; o morteiro de 82 mm; o Malyutka/Kornet; o Strela; os drones comerciais; o sapador com IED.
- Os custos da economia (`eco`) não estão ligados a nada: só a tabela.

**Riscos:**
- `side: 2` nos tanques, na técnica de 107 mm, nos veículos e nos kits: qualquer código que faça `ERAS.modern.sides[d.side]` com eles quebra até existir o terceiro lado (o cartão do hangar, `addVehicle` pela cor do lado). Hoje nada os lista.
- `TANKS` e `ARTS` são enumeráveis: algo que liste todos os tanques ou autopropulsados de uma época (hangar, servidor, `tests/gen-loads.js`) pode passar a mostrar os novos. O `server.js` não conhece os modelos novos (recusaria online).
- `killMan`, `killUnit`, `aiMan`, `AI.car` e `trnStep` ganharam embrulhos; só sorteiam número quando há bomba, mas estão no caminho de toda morte.
- Balanço: o carro-bomba é muito forte de propósito (1400 em 70 m); o colete avaria tanque e destrói veículo leve. A nuvem de poeira corta a visão de todos por 25 s.
- Fogo amigo: a explosão segue `FF`; com fogo amigo desligado ela não fere o próprio lado.
- Sem cratera de verdade no chão: só fogo, poeira e a nuvem.

**Como testar depois:**
- Ligar a facção (trabalho dos 3 lados) e ver no navegador cada veículo no hangar e em campo, de dia e de noite.
- Partida IA × IA com Insurgentes: o homem-bomba e o carro-bomba indo ao alvo e explodindo; com civis perto, a IA segurando (log de ROE); morto com tiro, explodindo às vezes.
- Online com anfitrião e convidado: o convidado vê a explosão e o dano.
- Suítes: `node tests/drone.js`, `node tests/damage.js`, `node tests/infantry.js`, `node tests/civ.js`, `node tests/sappers.js`, `node tests/gen-loads.js` (gerador: confere o `server.js`), `node tests/frame-budget.js`.
