# cf-3l-p6c-logistica: logística, economia, rádio e apoio com N lados (3 lados, pacote P6c): não testado

Pacote P6c do plano de 3 lados (EUA × Rússia × Insurgentes), seção 7 do plano: comboios, economia, rádio (CN) e apoio (AID) deixam de supor "o inimigo é `1 - t`" e "o sentido é `t ? 1 : -1`".

## O que mudou

Tudo no HTML `Céu de Ferro 3D.html`, no trecho da economia até o apoio (ECO, LG, REC, CN, AID), mais umas poucas linhas do general que esse trecho usa.

- **Ajudantes `ls*`**, num bloco novo antes de `ECO`:
  - `lsN`, `lsSide`, `lsFoe` e `lsFoes` cuidam dos lados e dos inimigos (`S.rel`, todos contra todos);
  - `lsEnds`, `lsFoeOn`, `lsDs`, `lsEndS` e `lsRoutes` tratam das estradas com dono nas duas pontas (`R.ends`, seção 4.2);
  - `lsFront` dá a estrada de frente do lado; `lsRail` é o `railOf` só nas estradas do lado;
  - `lsFoeBase` dá a base inimiga mais perto; `lsBy` dá o lado de quem fez.
- **Como os ajudantes decidem.**
  - Usam os ajudantes do plano quando existem: `SIDES()`, `foeOn`, `dsOf` e `myRoutes`, do P0 e do P1, e `sdsOf`, do P3.
  - Se não existem, leem os dados: `S.N`, `S.rel` e `R.ends`.
  - Sem nada disso, usam os 2 lados de hoje. Assim, este pacote não quebra se entrar antes do P0 ou do P1.
  - Com 2 lados, cada um dá a resposta de hoje. Conferido na demonstração: o ponto de busca do lado 1 é o espelho de antes, `ds` vale ±1 e a base inimiga é `S.base[1 - t]`.
- **Economia:**
  - `ecoDepth` mede a profundidade na estrada do próprio lado mais perto (`lsRail`), com o sentido de `lsDs`.
  - `ecoSpot` observa a linha do inimigo de cada uma das suas estradas (`lineS(foeOn)`) e os pontos de qualquer inimigo.
  - `ecoEntry` e `ecoRec` (o reconhecimento até o ponto de busca) usam o sentido da estrada.
  - `ecoDown`: cada inimigo que conhecia a instalação a marca como destruída. Registra no log quem conhecia ou quem destruiu. O texto flutuante aparece para qualquer jogador inimigo.
  - `ecoSeen`: cada inimigo vê por conta própria, junto com o P3, e o registro guarda de quem é a instalação (`kn.t`, que não vai pela rede). `ecoVM` pinta a instalação conhecida com a cor desse lado.
  - `ecoLook`: o ponto de busca vira um conjunto por inimigo. É o mesmo lugar, levado pela rotação e escala que mandam a base 0 na base t e a base 1 na base do inimigo. Com 2 lados, é o espelho de hoje. Ficam `ecoLookN(t)` pontos, e `lk` acompanha esse número.
  - `ecoInit` e `ecoStep` percorrem N lados. Um lado sem jazida própria (o 2, enquanto o P1 não põe jazidas por base) pega a jazida livre mais perto da sua base.
  - A antiaérea das instalações e as obras do general (`sup`, `work`, `dig`, defesa W21, relé `cnSite`) olham para a base inimiga mais perto.
- **Logística:**
  - Os comboios e as entradas saem da ponta do próprio lado (`lgEntry`, `lgConvoy`, a escolta, `lgThr`, `m5Lg` só nas estradas do lado).
  - `lgS(o, t)` projeta o ponto numa estrada do lado.
  - **`lgGrab` dá a carga a quem tomou** (`by.team`).
  - **`lgLost` dá o abate a quem acertou por último** (`lastBy` dentro de `DMG.credit`). Com 2 lados, vai para o inimigo, como antes.
  - `S.lg` tem pares de tamanho N.
- **Recuperação (REC e SV):**
  - Partida, destino, rebocar e evacuar usam a estrada do lado (`lsRail`, `lsEndS`, `lsDs`).
  - O veículo capturado pega o sentido do novo dono.
  - `S.rec` tem pares de tamanho N.
- **Rádio (CN):**
  - `cnJam` soma os interferidores de todos os inimigos.
  - `cnLook` percorre N lados.
  - **Radiogoniometria por inimigo:** cada inimigo cuja rede ouve o transmissor o localiza (`seeBy` do P3), conta no seu `df` e registra no seu log.
  - `cnVM` mostra os interferidores vistos de todos os inimigos.
  - `S.cn` tem tamanho N.
- **Apoio (AID):**
  - Os postos de sapador e de reação rápida ficam na estrada do lado.
  - Os campos de minas ficam nas estradas do lado e na frente do lado (`lsFront`).
  - A cúpula fica conhecida pelo lado cuja granada ela pegou (`domeHit`) e por cada inimigo que a vê.
  - O impacto de uma granada vai para cada inimigo de cuja sede ou base ele caiu perto (com 2 lados, para o outro, como antes).
  - O lançador de foguetes da coluna recua pelo sentido da estrada.
- **Retrato da economia na rede.** `ecoPack`, `ecoUnpack` e `enetTick` (`ecs`, `gen`, `glog`) percorrem N lados, assim como as linhas `eco` do convidado.
- **Log do general:**
  - `gLog` aceita o lado 2;
  - `S.glog` cresce para N lados (`glogAll`);
  - `gctl` e `welcome` guardam até 3 cadeiras.
- **Comandos e perguntas.** `genCmd`, `genQuery`, `genAnswer` e o `gcmd` do anfitrião aceitam o lado 2. O lado padrão de um ataque vem do sentido da estrada.

## O que NÃO foi testado

- Nenhum teste, partida, linha de base ou A/B foi rodado (regra de entrega do capitão).
- Só se conferiu:
  - a sintaxe do script e do `server.js` (`node --check`);
  - que o servidor sobe em 127.0.0.1;
  - que a página carrega e a demonstração do hangar roda, sem erro novo no console;
  - na demonstração, que os ajudantes dão os valores de 2 lados: `lsN() = [0, 1]`, `ecoLook(1, 0) = {1760, -1350}` (o espelho de antes) e `lsFoeBase(1) = S.base[0]`.
- Não foram verificados:
  - a equivalência com 2 lados pelos testes de hoje;
  - uma partida de 3 lados. Ela precisa do P0 (`S.N`, `S.rel`), do P1 (`R.ends`, estradas com os Insurgentes, jazidas por base), do P2 e do P4.

## Riscos

- **Equivalência com 2 lados.** Estes laços foram reescritos: `ecoDown` (log e registro por inimigo), `ecoSeen` (junto com o P3), `cnDF` (radiogoniometria) e `aidSee`/bombas.
  - Em todos, com 2 lados, a lista de inimigos é `[1 - t]`, então deve dar o mesmo.
  - `lgLost` passa a ler `lastBy` só para escolher a quem dar o abate. Com 2 lados, sempre dá o outro lado.
- **`lsRail` com 3 lados.** Se o ponto mais perto está numa estrada de outros dois lados, procura a estrada do lado com `sOn` (passos de 50 m). Fica mais caro e mais impreciso, e `off` vira distância sem sinal.
- **Ainda supõem 2 lados** (fora do P6c ou ainda não feitos):
  - `ecoDeps` com as metades, que é do P1;
  - `genVM nm` e os pontos das vilas, do P2;
  - minas e `sus`, do P3 e do P7;
  - `ANA`, do P9;
  - `frontR()` é uma só frente: com 3 lados, `lsFront` cai na primeira estrada do lado quando a frente da conquista não é dele.
- **`e.idf`** é máscara do P3. Nenhum formato de rede novo foi criado.

## Como testar depois

1. **Com 2 lados**, no mesmo commit de base da main, porque algumas suítes já falham lá.
   - Rode `sh tests/all.sh` ou cada suíte com `node tests/<suíte>.js`.
   - As que importam: `eco.js`, `eco-prod.js`, `eco-war.js`, `logistics.js`, `rec.js`, `radio.js`, `comms.js`, `aid.js`, `seat.js`, `sappers.js`, `general.js` e `gen-cmd.js`.
   - E as de rede, sozinhas e com `HOST=127.0.0.1`: `eco-online.js`, `eco-war-online.js`, `logistics-online.js`, `logistics-relay.js`, `rec-online.js`, `rec-relay.js`, `comms-relay.js`, `gen-online.js`, `gen-relay.js` e `resume-online.js`.
2. **Com 3 lados**, depois de P0, P1 e P4, numa sandbox com `S.N = 3`:
   - `ecoInit()` cria `S.eco.d` com 3 lados e o lado 2 ganha mina, usina e fábrica;
   - `lgStep` e `recStep` rodam sem exceção por alguns minutos de jogo;
   - um caminhão do lado 0 tomado por um soldado do lado 2 entrega as caixas a um nó do lado 2 (log "Tomamos" no lado 2, nada no lado 1);
   - um comboio do lado 0 destruído pelo lado 1 gera "Comboio inimigo destruído" só no log do lado 1;
   - um transmissor do lado 1 ouvido só pela rede do lado 2 aumenta `S.cn.st[2].df`, e não `st[0].df`;
   - `ecoLook(2, i)`, para `i < ecoLookN(2)`, cai dentro do mapa, perto das bases 0 e 1;
   - `ecoDepth(2, x, z)` mede pelas estradas `R_EI` e `R_RI`, e não pelas EUA↔Rússia.
3. **Partida de 3 lados** com economia ligada, de 20 a 30 min:
   - os três generais mandam comboios pelas próprias estradas;
   - ninguém manda comboio por estrada de outros dois lados;
   - o log da Logística de cada lado só fala do que aquele lado viu ou fez.
