# RESULTADO-B: teste de verdade da metade B de docs/nao-testado (cf-pol-testes-b)

Tarefa `cf-pol-testes-b` (2026-11-20/21). A metade B vai de `cf-m0-medicao.md` até o último arquivo em ordem alfabética. Para cada
documento rodei o que ele dizia que faltava: no navegador, em exercício sem tela ou com `tests/`. Anotei se passou ou falhou, consertei o que
falhou fora das seções do general e do cérebro (outra frente as reescreve), e encurtei o documento.

## Resumo

- **54 documentos** da metade B, em 5 lotes e 5 PRs (#176, #179, #182, #189 e o do lote 5). Os 9 `cf-pol-*` entraram no meio, quando o main
  os trouxe. Nenhum documento foi apagado: em todos sobrou algo que não deu para testar (online com dois navegadores, partidas longas,
  torneios A/B). Cada um ganhou no alto uma seção "Testado em …" com o que passou, o que falhou e o que continua sem teste.
- **Consertos com teste focado** (todos fora das seções do general e do cérebro):
  - mapa de tiro: rótulos de inimigos agrupados ("CC ×3 · CM") e sem aviões não vistos (`tests/map-tags.js`);
  - "parado primeiro" da analytics, só teste (`tests/ana-parado.js`);
  - cabine do jato e distâncias de aviões no HUD; nomes de vila em dobro no mapa do General: achados aqui, consertados em paralelo pelo
    cf-pol-hud, com os testes daqui (`tests/hud-labels.js`, `tests/town-names.js`);
  - `approaches`/`procedures` ajustados ao pelotão (P8): a hora H roda com `PEL.on = 0`;
  - arma em 1ª pessoa: o pente solto do Kar98 e a luneta flutuando (`tests/pack-cut.js`);
  - capim no fundo das trincheiras (`tests/trench-grass.js`);
  - a mensagem da Visão de General acima do limite do servidor, e a visão do convidado parando (`tests/gen-cap.js`).
- **Achados para a frente do general e do cérebro** (não mexi, estão nos lotes abaixo): a reunião do assalto não substitui a esquadra
  perdida nem segue com 2 de 2 (`approaches`); `man-c` cai com TypeError; o médico de outra esquadra não vem ao ouvir "Médico!"
  (`brain-medico`, `brain-drills`); `CEREBRO: defesa` lê `S.units` fora da percepção (`brain-honesty`); o serviço de posição (P2) custa
  2,5 ms por consulta no navegador.

## Condições da máquina

- A conta inteira tem 12 núcleos (`cpu.max` do `user-1002.slice`) e 24 GB. Outras frentes rodavam torneios ao mesmo tempo, e o kernel
  matou processos por falta de memória. Por isso eu rodei no máximo 2 processos pesados por vez. Uma suíte levou de 2 a 70 min. Os
  torneios de 8 a 40 partidas que alguns documentos pedem não couberam.
- No Chrome headless, o `requestAnimationFrame` corria a 1–10 quadros por segundo. Os testes no navegador andam a partida à mão: chamam
  `step()` e depois as funções da cena (`updateCamera`, `syncScene`, `render3d`, `drawHud`, `genFrame`) por um `eval` do DevTools. O custo de
  quadro está em ms por quadro numa cena fixa, antes × depois na mesma cena (a função nova trocada no lugar).

## Lote 1 (cf-m0-medicao … cf-mapa-artilharia)

| Documento | Resultado |
| --- | --- |
| cf-m0-medicao | ok (parte). `ana-man` 25/26 (só a checagem de tempo, com a máquina cheia), `ana-mano-net` ok, `ana-parado` (novo, o "parado primeiro") ok. O torneio do custo do general não rodou. |
| cf-m2-abordagens | **falha**: `approaches` com 7 falhas: hora H (pelotão P8, provável drift do teste), substituição na reunião (4), nenhum assalto na partida de 180 s, custo sob carga. O planejador em si passa. No navegador o `gask ap` funciona. |
| cf-m3-procedimentos | **falha**: `procedures` 32 ok e 1 falha (hora H, pelotão P8). `man-c` cai com TypeError no cenário `cut`. |
| cf-m4-emboscada | ok (parte), no navegador: a guarda pedida pelo general abre e é desenhada (GRD); a IA abriu guarda e emboscada sozinha. |
| cf-m5-veiculos-trilho | parte: em 9 min no navegador nenhum tanque fora do trilho. Nada do M5 foi visto agindo. |
| cf-m6-memoria | parte: `mmView` com memória de manobra e de comboios perdidos numa partida de verdade. |
| cf-m7-jogador-mcp | ok (parte), no navegador: abordagens, painel em 1280 e 1920 px, "Fixar e flanquear por A2" abre a manobra, que embarca, desembarca e anda. A hora H não chegou em 540 s. |
| cf-m8-estrategias | ok (parte), no navegador: estratégias por frente e a geral no diário, efeitos (fogo e foco aéreo), `genState().stg`, `R.stg` do AAR. |
| cf-manobra-reuniao | parte: pool e prazo novos passam no `approaches`; falham a substituição e o "segue com 2 de 2" (veja M2). `ana-mano-net` ok. |
| cf-mapa-artilharia | **2 consertos**: rótulos empilhados no mapa de tiro (agora "CC ×3 · CM") e aviões inimigos não vistos aparecendo. `tests/map-tags.js`. |

### Achados para a frente do general (não consertados aqui)
- `tests/approaches.js` e `tests/procedures.js` estão vermelhos no main (ffff56d). A hora H provavelmente é o portão do pelotão (P8): o teste
  ainda espera o assalto na mesma chamada. O ajuste do teste vai no próximo PR, depois de uma rodada que confirme. A substituição na reunião e o "segue com 2 de 2" não
  têm explicação ainda, e em 9f2a313 passavam.
- `tests/man-c.js` cai com TypeError (`c.spec` de um candidato `cut` que não existe).
- O diário do plano de fortificação diz "Perímetro em a base avançada junto a C" (deveria ser "na base avançada").

### Lote 1, depois do PR #176
- O ajuste da hora H foi confirmado. Com `PEL.on = 0` no cenário, `procedures` passa inteiro e a hora H do `approaches` passa. Os dois testes
  foram ajustados (o portão do pelotão fica com `brain-pelotao`). O `approaches` fica com as 4 falhas da reunião, da frente do general.
- `campaign`: 24 ok e nenhuma falha em 3 das 5 seções. Parei a rodada depois de 82 min para dar lugar ao navegador.
  `personality`: tudo ok até a partida IA × IA final de 180 s, que não terminou em 90 min nesta máquina.

## Lote 2 (cf-mapa-cidades … cf-obras-sair)

| Documento | Resultado |
| --- | --- |
| cf-mapa-cidades | **defeito achado** (consertado em paralelo pelo cf-pol-hud): no mapa do General, o nome da vila do ponto de conquista saía duas vezes. `tests/town-names.js` cobre o conserto. Nomes vistos no General (1920) e no mapa de tiro de 1944. |
| cf-medico | parte: cartão do Sanitäter no hangar; 56 médicos em 455 soldados da IA; eventos do médico na analytics. O soldado do cartão segura fuzil (o pack não tem pistola). |
| cf-miras-impl | **2 defeitos achados** (consertados em paralelo pelo cf-pol-hud): a 1ª linha de armas da cabine do jato escondida sob o painel de danos, e distâncias de aviões empilhadas no HUD. `tests/hud-labels.js` cobre os dois. 12 óticas em 1280 e 1920 px sem erro. |
| cf-modo-rts | ok (parte): câmera, W/D, névoa (276 de 323 escondidos), quadro da esquadra de perto, esconder painéis, 1280 e 1920 px. |
| cf-moitas-floresta | parte: 88.165 células de mato e 380 faixas no mapa 11; as moitas aparecem na orla. |
| cf-moitas-mato | achado: as sebes do mapa 7 são 0 no mapa de 3 lados (ids a 65.448 de 65.536); o mato do mapa 10 cobre. |
| cf-mouse-padrao | ok: o helicóptero e o jato seguem a mira do mouse; `ctrl` padrão `mouse`. Documento encurtado. |
| cf-movimento-lider | ok (parte): as três técnicas em uso (desloc, vig, lances), 268 abrigos em contato. |
| cf-movimento-organico | ok (parte): cunha e fila, lagartas a 9 m da estrada, soldados a 22 m do eixo (mediana). |
| cf-obras-sair | ok (parte): `posts` passa inteiro; sacos de areia, ninho e ouriços com cor certa na partida. Achado: grama dentro do buraco da trincheira. |

### Lote 2, depois do PR #179
- `brain-medico` (nunca tinha rodado), 6 sementes: **1 falha**. O médico da esquadra trata em 9–10 s e a cruz vermelha segura o fogo,
  mas o médico de outra esquadra não vem quando ouve "Médico!" (0/6). É do cérebro (`CEREBRO: medico`), por isso só anotei.

## Lote 3 (cf-p2-posicao … cf-pol-modelos-antiaerea)

| Documento | Resultado |
| --- | --- |
| cf-p2-posicao | ok, menos o custo: `tps` 25 ok, falha só a meta de 0,15 ms. **No navegador, `tpsStat()` dá 2,46 ms por consulta (máx 99 ms)** em 3 min de partida: 16× a meta, mesmo descontando a máquina cheia. |
| cf-p4-prisioneiros | ok (parte): `brain-prisioneiros` passa inteiro. |
| cf-p5-falas | ok (parte): `brain-falas` (SECS=60) passa inteiro. |
| cf-p6-medicao | parte: os eventos do cérebro chegam à analytics numa partida e `R.brain` vem preenchido; `brain-drills` em andamento (granadas: 100% escapam, meta ≥ 70%). |
| cf-p7-honestidade | **falha** (1 checagem estática): a seção `CEREBRO: defesa` (DFP) lê `S.units` fora da percepção (`dfpTkGo`). As checagens dinâmicas passam. |
| cf-p8-pelotao | ok (parte): `brain-pelotao` passa inteiro; o risco 2 (suítes antigas da hora H) se confirmou e foi resolvido no lote 2. |
| cf-pack-aparece | ok (parte): 29 modelos carregados, 6/6 tanques com o pack, Abrams e Tiger do pack no hangar pelos botões, `?pack=0` volta ao de antes. |
| cf-pack-modelos | ok (parte): `PACK.M` inteiro; custo com e sem o pack igual dentro do ruído desta máquina. |
| cf-pol-hud | ok (parte): Visão de General dos Insurgentes (tecla 3) sem erro e com a tabela de forças por inimigo; HUD do F-22 sem rótulos encavalados. |
| cf-pol-modelos-antiaerea | ok (parte): Wirbelwind e M16 no hangar; torres do NASAMS e do Pantsir girando numa partida; o Pantsir de perto. |

### Achados para a frente do cérebro e do general (não consertados aqui)
- O socorro de outra esquadra ao ouvir "Médico!" não acontece (`brain-medico` (b), 0/6).
- `CEREBRO: defesa` (`dfpTkGo`) quebra a checagem de honestidade do P7.
- O serviço de posição (P2) custa 2,46 ms por consulta no navegador (meta 0,15 ms).

### Lote 3, depois do PR #182
- `brain-drills`: **2 falhas**, as duas "um ferido, socorrido": o caído é contado, mas socorrido 0. Combina com o `brain-medico` (b).
  As granadas (100%), a sucessão do líder (2,3 s) e o contato passam. `brain`: 7 ok, 1 falha de custo (o relógio do cérebro custa 0,51 ms por
  passo com 36 esquadras, limite 0,1 ms; a máquina estava cheia).

## Lote 4 (cf-pol-modelos-arma-1p … cf-popk-medidor)

| Documento | Resultado |
| --- | --- |
| cf-pol-modelos-arma-1p | **conserto**: o pente de 5 balas solto do modelo do Kar98 flutuava ao lado do fuzil (Schütze, Sniper), e a luneta do Sniper de 1944 ficava 7 cm acima e 3,4 cm ao lado. `tests/pack-cut.js`. |
| cf-pol-modelos-artilharia | ok (parte): os modelos no hangar e na partida; torre girada sem cruzar a cabine; a salva do Grad com 34 foguetes no ar. |
| cf-pol-modelos-avioes | parte: hélice em disco e insígnias no hangar de 1944. |
| cf-pol-modelos-cores-pack | ok (parte): `pack-colors` passa; o Sherman com lagartas em aço escuro. |
| cf-pol-modelos-esteiras | parte: as rodas de rodagem giram numa partida. |
| cf-pol-modelos-moitas | parte: o mato rasteiro novo visto de perto numa partida. |
| cf-pol-modelos-rodas | ok (parte): 12 de 12 veículos andando giram as rodas pela distância. |
| cf-pontes-construir | parte: um pontão num trecho do rio, pronto, tracejado no mapa e na cena. |
| cf-pontes-qualquer-lugar | ok (parte): a ponte nova pronta, contínua no mapa, com lajes, pilares e parapeitos na cena. |
| cf-popk-medidor | ok (parte): em sobrecarga, o teto desce 10% a cada 10 s com os números no diário. |

### Lote 4, depois do PR #189
- `brain`: parado por mim aos 62 min (rc 143) na última parte, depois de anotar o resultado (7 ok, 1 falha de custo).

## Lote 5 (cf-proc-veiculos … cf-zoom-veiculos, e os 6 `cf-pol-modelos-*` que o main trouxe)

| Documento | Resultado |
| --- | --- |
| cf-proc-veiculos | ok (parte): em 3 min de partida, 13 procedimentos disparam pelo que cada unidade percebe (comboio, radar-silencio, passe, cidade, aereo-v…). |
| cf-radio-general | **conserto**: `radio-general` passa. O `radio` mostrou a mensagem da Visão de General a 8.867 bytes (limite do servidor 8.192), que o servidor descarta calado e a visão do convidado para; a maior parte eram as posições de defesa (`dfp`). `genMsg` corta as camadas opcionais maiores primeiro (`tests/gen-cap.js`). `gen-relay` passa. |
| cf-radio-rede | ok (parte): a IA ergueu uma antena sozinha; o mastro na cena e no mapa. |
| cf-recursos-vermelho | ok (parte): a faixa da economia dos Aliados no Assistir; jogando, a faixa do inimigo some (névoa). |
| cf-reparo-ambulancia | ok (parte): a ambulância levanta um caído e sara um ferido; o caminhão de reparo conserta um NASAMS (20 → 39 de 50 em 10 s); a Kfz. 31 no hangar e numa partida. |
| cf-respawn-aviao | ok (parte): `respawn-air` passa inteiro sobre o main de hoje. |
| cf-sede-ataque-defesa | parte: a sede inimiga localizada e o reconhecimento no diário. |
| cf-slots-arma | ok (parte): as teclas 3/4/5 passam pelos itens do Plantador de IED e do Homem-bomba (colete armado com a dica no HUD). |
| cf-tanque-casa | ok (parte): o Tiger atravessa uma casa (estágio 1) e segue. |
| cf-tecla-mapa | ok (parte): M abre e fecha o mapa da batalha numa partida de verdade, em 1920 px. |
| cf-trincheiras-tuneis | **conserto**: capim nascia no fundo da trincheira cavada (56 tufos numa, 0 depois). `tests/trench-grass.js`. |
| cf-vbied | ok (parte): 5 antes de armar avisa; depois detona com cratera. |
| cf-w11-guest-trust | ok: `logistics-online` passa inteiro, com as recusas do W11. |
| cf-zoom-veiculos | ok (parte): R passa de fora para ×2, ×4 e volta, suave; na ZPU-4 os canos não tampam a mira. |
| cf-pol-modelos-maos, -medico, -lod, -sombras | ok (parte): mãos no fuzil, braçadeira, troca de LOD com histerese (400/450 m), mancha deitada na encosta. |
| cf-pol-modelos-shilka | parte: a partida começa na Shilka; no hangar, achado o carrossel espremido (abaixo). |
| cf-pol-modelos-cabines | não testado aqui. |

**Conserto no hangar** (cf-pol-hud): a 1280×713 com uma partida suspensa, o carrossel encolhia a 132 px e o veículo escolhido ficava
embaixo do próprio nome. A nota e "Nova partida" agora dividem uma linha em tela baixa (`tests/hangar-short.js`; carrossel de 132 para 180 px).

Suítes deste lote: `respawn-air`, `radio-general`, `logistics-online`, `gen-cap`, `gen-relay` passam. `radio`: 55 ok e 3 falhas (2 de custo
com a máquina cheia, e a da mensagem acima, consertada). `comms`: as seções medidas passam, com a mensagem a 8.175 bytes (perto do limite:
mais um motivo para o `genMsg`). `gen-online`: 1 falha (o mapa do convidado sem esquadras), comparada com a página de antes abaixo.
Não rodaram por falta de tempo: `sede`, `rec`, `veh-drills`, `ram`, `transport`. `logistics`: parado por mim depois de 1 h, na partida
inteira do fim; antes dela 45 ok e 1 falha já conhecida no main (as caixas do caminhão parado tomadas por um soldado inimigo).
