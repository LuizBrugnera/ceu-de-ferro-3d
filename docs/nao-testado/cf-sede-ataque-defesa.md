# A sede atacada e defendida (não testado)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): parte
- Navegador, Assistir em 1944 (lote 3 desta tarefa): no diário dos Aliados, logo no começo, "Sede inimiga localizada: a cidade-sede inimiga (Luftwaffe), a 10,1 km da nossa base (mapa: a cidade marcada \"Sede\")" e "Reconhecimento na retaguarda: achar as instalações da cidade-sede inimiga (Luftwaffe)". O mapa mostra a cidade marcada "Sede".
- `tests/sede.js`: não rodou nesta tarefa (faltou tempo com a máquina cheia).
- **Continua sem teste:** o assalto à sede numa partida longa, a sabotagem chegando, a demolição no objetivo, o mapa de 3 lados.

Tarefa `cf-sede-ataque-defesa`. Bug do capitão, jogando: "não estão atacando a sede dos outros e nem defendendo as suas". A sede é a cidade-sede de cada lado (mapa versão 5 em diante: a cidade junto à base principal, com as instalações disfarçadas nos lotes, a fábrica, a usina) e, no mapa de três lados, a aldeia HS2 dos Insurgentes (#92).

## O que achei (as causas)

Reproduzi no harness, IA × IA com a economia, a logística e a recuperação ligadas, mapa de hoje (`MAPV` 11), sem jogador: 1944 com dois lados, moderno com dois e com três lados, 25 min de relógio cada (o probe e os logs ficam fora do repositório, em `/home/luiz/secondmate/data/cf-sede-ataque-defesa/`).

- **Ninguém ataca a sede**: em todas as partidas, todas as operações de assalto foram contra pontos do centro (Travessia, Cruzeiro...). Nenhuma unidade chegou a menos de 3,3 km de uma sede inimiga, e os lados chegaram a ter instalações inimigas identificadas (`kn`) sem que nada fosse aberto contra elas. Motivos no código:
  - o assalto e a campanha só escolhem **pontos de conquista** (`cmdAttack` → `cqAim` → `cqTargets`); a cidade-sede de 0 e 1 não é ponto (só a HS2 é, no mapa de três lados), então nunca entra na lista de alvos;
  - a **incursão** (`MANG.raid`) só aceita um alvo visto nos últimos `MANT.raid.mem` (180) s; uma sede atrás da frente quase nunca é vista de novo nesse prazo, então as instalações dela somem da lista;
  - não havia nenhuma noção de "sede conhecida" no general: nenhum diário, nada na visão;
  - na primeira versão da correção eu exigia uma instalação identificada para o lado "conhecer" a sede: numa partida de 25 min em 1944 nenhum lado identificou nenhuma (as instalações dos lotes são disfarçadas até alguém chegar a 400 m; o posto de reconhecimento não passa de 1,5 km além da linha e 1944 não tem drones). Mas o mapa de todo jogador já mostra a cidade-sede com o nome "Sede": o general passou a saber o que a pessoa sabe.
- **A defesa da sede falha quando mais importa**:
  - a sede não era um lugar do quadro de ameaças: cada instalação era um incidente separado, valendo o que vale uma instalação;
  - a força de reação da base (a esquadra `base`, a QRF) fica **dentro** da cidade-sede (`aidQrfPost`), e `thbPick` exclui quem já está a menos de `THB.r` (450 m) do incidente: com o inimigo na sede, o quadro dizia "Nenhuma esquadra livre para isso" justamente porque a QRF estava lá;
  - a triagem compara o inimigo conhecido com tudo o que o lado tem a 450 m, e na sede isso inclui o que a fábrica acabou de fazer (tanques parados, caminhões, a bateria): com 3 esquadras inimigas dentro da sede, o quadro ignorava de propósito, "a guarda local basta (força 48,5 contra 7)";
  - nada segurava a cidade quando a reserva saía para defender um ponto (`cmdDefend` manda a `base` para o ponto ameaçado).

## O que mudou (tudo em `Céu de Ferro 3D.html`, salvo os documentos e o MCP)

Uma seção nova, **`the seat: its attack and its defence`** (antes da cena 3D, `SEDE`), e três mudanças no quadro de ameaças:

- **O que o lado sabe (honesto)**: a cidade-sede de 0 e 1 aparece com o nome "Sede" no mapa de todos os lados (`drawTownNames`), então o general sabe onde ela está como uma pessoa sabe ("Sede inimiga localizada: ... (mapa: a cidade marcada "Sede")"). A HS2 dos Insurgentes não é marcada (é "Aldeia do Açude"): fica conhecida quando o lado identifica uma instalação dos Insurgentes a até `SEDE.kr` (1000) m dela (a memória da economia, `kn`) ou interroga um prisioneiro deles (`prisTell`: o soldado sabe onde fica a sede dele). As **instalações** dentro da sede continuam escondidas nos lotes até alguém as ver (`ECO.lot`): enquanto uma sede inimiga é desconhecida ou não tem instalação identificada, a IA da economia manda o reconhecimento até ela no lugar do reconhecimento de costume (`sedeScout`, uma vez a cada `SEDE.look` (600) s por sede). Fogo, incursão e demolição só vão a instalações identificadas.
- **O ataque** (`sedeGo`, na vez do `cmdAttack`): uma sede conhecida, com um ponto do lado a até `SEDE.reach` (4500) m dela ou a base inimiga entre os pontos que ele pode tomar (a regra dos pontos ligados), esquadras livres ao alcance (o mesmo `apPool`/`atkFit` dos assaltos, com as abordagens do M2) e a força que a doutrina pede (`D.atk`, já com a personalidade). Abre um assalto (`atk`, `op.sede`) pelo mesmo funil (`genCmd`), como esforço principal de uma campanha com hora H (`camp`), uma missão de fogo na instalação mais importante dela (`strike`) e, antes da hora H, sapadores (`sabot`) ou uma incursão (`man raid`) contra essa instalação, que a campanha recolhe. A doutrina decide a vez (`SEDE.pref`): a agressiva tenta a sede antes dos pontos; a equilibrada quando não abriu assalto a ponto naquela vez; a cautelosa só ganhando nos pontos de todos os inimigos. Na HS2 o objetivo é o próprio ponto. No objetivo (`sedeFight`), as esquadras vão às instalações identificadas e as demolem com cargas (`plant`, como as incursões). Cada recusa vai para o diário com o motivo ("Assalto à cidade-sede inimiga (...) ainda não: longe da nossa linha", "esquadras livres insuficientes", "força X contra Y, a doutrina pede Z"), de novo só quando o motivo muda ou a cada 240 s. O fim também: "N de M instalações identificadas destruídas".
- **Incursões**: `mbRaidAssets` conta as instalações identificadas de uma sede conhecida por mais que os 180 s (a cidade não anda) e com valor `SEDE.raid` (1,6) vezes maior, "na cidade-sede".
- **A defesa**:
  - a cidade-sede é **um incidente** do quadro de ameaças (`thbSense`: chave `w`, tipo `seat`, valor `THB.val.seat` 14, acima da base principal), com o inimigo conhecido no raio dela mais 450 m ou uma instalação dela atingida; as instalações dentro dela deixam de ser incidentes separados;
  - com inimigo conhecido nela, **a triagem nunca a ignora** por valor ou por "a guarda local basta" (só por prioridade -1 ou política "nunca reagir");
  - a **QRF que fica na sede responde de lá** (`thbPick` aceita a esquadra `base` mesmo a menos de 450 m quando o incidente é a sede);
  - uma **guarnição** (posto `sgar`, "Guarnição da sede", `SEDE.gar` = 1 esquadra) fica nas casas da cidade, do lado do inimigo mais perto; não está em `FREE`, `THB.job`, `MANJ` nem `FIELD.spare`, então não é emprestada a assaltos, manobras nem ao quadro; vem logo depois do posto de assalto e antes de todos os outros postos enquanto a sede está ameaçada; entra já na abertura;
  - `dpol { seat: 1 }` é a política da sede (MCP: `set_defence_policy` com `seat_town: true`).
- **O que o general mostra**: `genVM`/`genState` ganham `sede` (`own`: a sede do lado, o estado do incidente, a guarnição, as instalações; `foe`: cada sede inimiga conhecida, como e há quanto tempo, as instalações identificadas, o assalto em curso ou o motivo de ainda não); `GENK` leva a chave ao convidado. Camada nova no mapa do general, "Sedes (a nossa e as inimigas conhecidas)": anel da própria sede (amarelo e "AMEAÇADA" ou "REAÇÃO EM CURSO" quando é incidente, com a guarnição) e anel tracejado em cada sede inimiga conhecida, com as instalações identificadas e o assalto ou o motivo.
- **MCP**: `get_state` traz `seatTowns` no mapa; `set_defence_policy` aceita `seat_town: true`.

Ganchos: `ecoAI`, `cmdSense`, `prisTell`, `cmdAttack`, `gName`, `OPS.atk`, `mbRaidAssets`, `post`, `cmdPosts`, `deploy`, `genVM`, `genState`, `GENK`, `GLAY`; mudanças diretas em `thbSense`, `thbTriage`, `thbPick`, `THB.val` e `GC.dpol`.

## O que foi testado

Só a checagem focada do bug, `tests/sede.js` (~30 s, 1944, dois lados): o lado 0 sabe onde fica a sede do lado 1 pelo mapa, sem nenhuma instalação dela; um tanque do lado 0 vê a fábrica e ela passa a ser uma instalação identificada da sede; com os pontos do lado 1 perto da sede tomados pelo lado 0 e quatro esquadras livres a 2 km, o lado 0 (doutrina agressiva) abre um assalto à sede numa campanha, com fogo na fábrica e sabotagem contra ela antes da hora H (numa rodada antes do merge com o main a sabotagem e a incursão foram recusadas, e o diário disse o motivo: sem sapadores livres, nenhum caminho a pé seguro); três esquadras do lado 0 dentro da sede do lado 1 viram o incidente `seat` de valor 14 e a QRF da base responde. Passou. E o smoke: o script inteiro compila, 30 s de IA × IA em 1944 sem NaN, a guarnição entra nos dois lados.

`tests/sim-split.js` acusa uma falha que já existe no main (`rtsS`, `rtsBrain` na simulação), não desta mudança.

## O que NÃO foi testado

- Nenhuma suíte além dessas (em especial `campaign.js`, `general.js`, `gen-cmd.js`, `mcp-general.js`, `sappers.js`, `man-*.js`, `procedures.js`, `pop-push.js`, `eco-war.js`, `brain-*.js`), nenhum torneio A×B, nenhuma partida no navegador, online ou pelo MCP de verdade, nem a camada nova do mapa do general na tela.
- As partidas longas IA × IA, antes e depois (mesmo probe, mesma semente; não são teste de regressão, só a comparação):
  - antes: 1944 (25 min), moderno dois lados (25 min) e três lados (25 min): nenhuma operação contra uma sede; as incursões só nos três lados, dos Insurgentes contra a usina e a fábrica dos EUA, como alvos comuns;
  - depois: 1944 e moderno com dois lados (20 min): cada general sabe da sede inimiga pelo mapa no início, manda o reconhecimento achar as instalações dela e diz no diário por que ainda não ataca ("longe da nossa linha (nenhum ponto nosso a 4,5 km)", "esquadras livres insuficientes ao alcance"): as frentes ficaram no centro do mapa a partida toda, a 5-8 km das sedes, então o assalto à sede não abriu sozinho em nenhuma delas; três lados (12 min): os Insurgentes escolhem como plano a "Incursão contra a fábrica inimiga na cidade-sede" (nota 8,8; antes 6,5) e a executam (caminhão, depois a pé); a Rússia acha a sede dos Insurgentes por reconhecimento (fábrica identificada) aos 37 s.
  - O assalto à sede só abriu na checagem focada, onde eu dou ao lado os pontos perto dela e esquadras a 2 km.
- A sabotagem antes do assalto só abriu na checagem; se ela chega e demole, não vi.
- A demolição no objetivo (`sedeFight`) não chegou a rodar: a checagem para quando o assalto abre.
- O mapa de três lados (HS2 como ponto e sede) e o moderno de dois lados só nas partidas longas, onde o assalto não chegou a abrir.

## Riscos que vejo

- **Uma esquadra a mais por lado** (a guarnição): pesa no teto de população; a guarnição vem cedo na lista de reforços (logo depois do assalto). Pode atrasar outros postos quando o lado está no teto.
- **QRF puxada para a sede**: como a sede nunca é ignorada com inimigo conhecido, um batedor inimigo visto na sede (força > `THB.min`) chama a QRF e mais 1-2 esquadras livres a até 2,6 km. Pode desfalcar a linha por pouca coisa.
- **Pontos perto da sede**: o alcance de 4,5 km pode pôr a sede ao alcance logo que o lado toma um ponto avançado do inimigo; a agressiva pode preferir a sede à base inimiga (que acaba a partida).
- **Assalto à sede com as regras do assalto comum**: "tomado" quando todas as esquadras chegaram e estão calmas; com instalações espalhadas, cada esquadra vai a uma, e o "tomado" pode vir antes de todas caírem. O assalto não toma ponto nenhum (só na HS2).
- **Nome no diário**: "a cidade-sede inimiga (EUA) tomado" (o gênero do texto antigo do assalto).
- **Honestidade**: `sedeFoeSites` usa `ecoFoe` (o que o lado identificou) e `kn` (a memória), como as incursões e o `strike` já usavam; o `!e.dead` vem do objeto real, como no código de antes.
- **Online**: o convidado só vê a camada e o `sede` pelo `gen` do anfitrião (chave em `GENK`); não testado.

## Como testar depois

1. `node tests/sede.js` (a checagem do bug).
2. IA × IA longa, 1944 e moderno, dois e três lados (o probe em `/home/luiz/secondmate/data/cf-sede-ataque-defesa/probe.js`, `ERA`, `N`, `MIN`): contar "Sede inimiga localizada", "Assalto à cidade-sede", "ainda não: ...", incursões "na cidade-sede" e "Força de reação para a cidade-sede" no diário dos lados.
3. Suítes que tocam o que mudou, comparando com o main (`PAGE=<página antiga>`): `campaign.js` (o quadro de ameaças: as instalações na sede agora são o incidente `seat`; checagens que esperam um incidente `site` numa instalação da sede podem mudar), `general.js`, `gen-cmd.js`, `mcp-general.js`, `pop-push.js`, `sappers.js`, `man-a.js`/`man-b.js`/`man-c.js`.
4. No navegador, IA × IA: visão de general, camada "Sedes": a própria sede com a guarnição; depois de identificar uma instalação inimiga, o anel tracejado na sede inimiga com o motivo de ainda não atacar. Levar tropas para dentro da sede inimiga e ver o anel dela ficar amarelo e a força de reação sair.
5. MCP: `get_state` com `refresh_map: true` deve trazer `map.seatTowns`; `set_defence_policy` com `seat_town: true, reaction: 0` deve calar a reação na sede.
