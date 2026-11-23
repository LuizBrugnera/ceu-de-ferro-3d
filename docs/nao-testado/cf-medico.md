# cf-medico: a classe de médico (NÃO TESTADO)

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): parte
- Navegador, hangar 1944, Infantaria: o cartão do Sanitäter mostra Socorro no máximo, Walther P38, 2 granadas e 1 de fumaça, 6 curativos ("trata e estabiliza") e 3 granadas de fumaça. O soldado do cartão é o do pack, mas segura um fuzil (o pack não tem pistola) e não tem braçadeira (já listado nos riscos).
- Navegador, Assistir em Hoje (3 lados), 68 s: 56 médicos entre 455 soldados nas esquadras da IA e 7 eventos `cb` do médico na analytics. Nenhum erro no console.
- `tests/brain-medico.js` (nunca tinha rodado), 6 sementes: **1 falha**.
  - (a) o médico da esquadra trata o caído a 20 m: 6/6, em 9–10 s cada.
  - (b) honestidade: fora da voz e da vista, o médico de outra esquadra não vem (6/6, certo). Mas **depois de "Médico!", dentro da voz, ele também não vem: 0/6** (devia vir). O socorro ouvido por outra esquadra não funciona. É do cérebro (`CEREBRO: medico`, `flOuve`/`sqRescue`), que outra frente cuida: não mexi.
  - (c) a cruz vermelha: o soldado regular não toma o médico como alvo (6/6).
- **Continua sem teste:** o jogador médico (compartimento 5, clique segurado, arrastar, HUD, ✚, "Vidas salvas"), a cruz vermelha segurando o fogo da IA, o online e o MCP.

Regra do capitão: implementado sem testes. Só rodei um smoke de ~1 minuto: `node --check` do servidor, do MCP e do exercício novo; o script inteiro da página compila; a parte de simulação carrega no `tests/harness.js` e roda 2 s de batalha em 1944 e hoje (as esquadras saem com médico: 25 de 137 e 24 de 158 soldados); o servidor sobe e serve a página (HTTP 200). O navegador headless deste node não abriu a página (timeout de navegação), então **a parte de tela não foi vista rodando**.

## O que mudou

- **Página, três seções antes de `3D scene`** (só ganchos): "the medic" (kits e esquadras), `CEREBRO: medico` (o cérebro, só com a percepção) e "the medic: a player's treatment, the net and the unit card":
  - os kits `sanitater` (P38), `medic` (M1911A1), `blueMedic` (M4A1), `redMedic` (AKS-74U, arma nova) e `insMedic` (Makarov, irregular, sem braçadeira), com `med: 1`, 6 curativos (`m.bnd`) e 3 fumaças;
  - `trnKits`: os médicos vão para o fim da lista (os índices antigos ficam);
  - `addSquad`: esquadra com 3 fuzileiros ou mais troca o último fuzileiro pelo médico, no fim da esquadra. O custo e a população não mudam. Online, isso só acontece com servidor `med: 1`;
  - `flOuve`: o médico guarda quem ele ouviu chamar "Médico!";
  - `sqRescue`, a honestidade do P7: o médico só vai até quem ele vê ou ouviu chamar; se não, vai o colega mais perto. Um caído sem socorrista recebe o médico de outra esquadra que o ouviu. O médico diz "Médico a caminho!", e o líder diz "Cobre o médico!" quando o inimigo está perto;
  - `rescue`: arrasta para o ponto `socorro` do P2 e trata em 60% do tempo. O ferido leve levanta com 65% de vida. O grave fica estável e, com o inimigo perto, vai arrastado ao ponto de coleta da esquadra (`q.ccp`, 35 m atrás, no abrigo do P2);
  - `aiMan`: fora de combate, o médico faz curativo nos colegas feridos da esquadra;
  - `manThink`, as leis da guerra (W14): a IA regular não escolhe como alvo um médico inimigo que reconhece (até 250 m) e que não atirou nos últimos 6 s. Os Insurgentes ignoram a regra. Decisão tomada: se o médico é o único alvo, ela segura o fogo;
  - online: `Net.rx.mreq` ganha k 7 (tratado) e k 8 (arrastar, ou manter vivo enquanto trata); `Net.rx.ai` lê os bits 16 (caído) e 32 (estável);
  - `genCard` (o cartão da unidade e o `get_unit` do MCP) mostra o médico, os curativos e o ponto de coleta, e devolve o campo `med`;
  - 5 falas novas no P5.
- **Página, código antigo editado**: a linha do soldado da IA ganhou os bits 16/32 nas flags, e o resultado da partida ganhou a linha "Vidas salvas".
- **Página, seção "the medic's hands and looks"** (depois do SLOT):
  - compartimento 5 do médico: Kit de primeiros socorros (segurar o clique) e Arrastar ferido;
  - reposição dos curativos no caminhão ou na base;
  - marcas ✚ dos caídos no HUD e a barra de progresso;
  - braçadeira branca com cruz vermelha e cruz no capacete, no modelo antigo de caixas;
  - ficha, teclas e briefing do hangar e do quadro H; `VMW.aks74u`.
- **server.js**: os 5 kits em `MODELS`, `rooms.inf` e `ms` (lado), `welcome` com `med: 1`, e `mreq` k 7 e k 8 (do convidado ao anfitrião, 200 ms de intervalo).
- **Documentação**: README (seção "Médico" e a lista de kits), MCP.md e a descrição do `get_unit` em `mcp-general.js`.
- **tests/brain-medico.js**: exercício de medição **escrito e nunca rodado**.

## O que NÃO foi testado (tudo)

- O médico da IA chegar, arrastar e tratar de fato; o tempo até o tratamento; a escolha honesta; o médico de outra esquadra; o ponto de coleta; os curativos fora de combate.
- O jogador médico: o compartimento 5, o clique segurado, a interrupção por tiro, o arrastar e a velocidade, o HUD, as marcas, a reposição, "Vidas salvas".
- A cruz vermelha: a IA trocar ou segurar o alvo; efeito no equilíbrio, já que segurar o fogo pode deixar o médico "imortal" para a IA quando é o único alvo.
- O online inteiro: k 7 e k 8, bits 16 e 32, servidor com os kits novos, guest médico, troca de anfitrião.
- A braçadeira na cena (instâncias a mais por soldado: o limite `MAXM*MP` pode cortar o último soldado desenhado) e no hangar. Os modelos animados do pack não têm braçadeira.
- Testes antigos que contam a composição da esquadra ou os índices de kit podem falhar: a esquadra cheia agora tem 2 fuzileiros + médico em 1944 e o mesmo hoje. Exemplos: `tests/squads.js`, `inf-*`, `loadout*`, `sides3-start.js`, `pop-push.js` e os torneios A×B.

## Riscos que vejo

1. A composição mudou para todo mundo: menos um fuzil por esquadra, então o poder de fogo cai. As linhas de base e os torneios mudam.
2. Segurar o fogo diante de um médico sozinho pode travar o soldado da IA ou ser explorado. Se ficar ruim, troque a regra para "outro alvo se houver, senão atira" (em `manThink` da seção, no lugar de `A.tgt = best`, use `A.tgt = best || t`).
3. O jogador que trata não protege o ferido de sangrar no convidado até o k 8 chegar; com perda de pacote, o ferido pode morrer no meio do tratamento.
4. `sanOther` e `sanKnows` disparam raios (`los`) por esquadra com caído sem socorrista. Medir o custo numa partida grande.
5. Os embrulhos de `sqRescue`, `rescue`, `aiMan` e `manThink` se empilham: REC, P5 e P1 primeiro, o médico por último. Uma mudança de ordem numa seção mais antiga pode quebrar. A seção `CEREBRO: medico` só lê a percepção (`m.pm`, a voz ouvida, `los`) e a própria esquadra. O que lê `S.men` (a rede, o cartão, o tratamento do jogador) ficou em seções comuns, fora da varredura de `tests/brain-honesty.js`. Rodar esse teste.
6. O servidor mudou: os kits ficaram no fim de `MODELS.inf`. A página e o servidor precisam ser publicados juntos.

## Como testar depois

1. Exercício de medição: `node tests/brain-medico.js` (`N=10` para mais sementes). Ele mostra o tempo do caído até levantar, a honestidade com o médico de outra esquadra e a cruz vermelha.
2. Regressão: `bash tests/all.sh`, com atenção aos testes de esquadra e de kit listados acima, e `node tests/brain-soldado.js`, `brain-falas.js`, `brain-honesty.js`, `brain-lider.js`.
3. Jogo solo:
   1. `node server.js`;
   2. no hangar, Infantaria: conferir os cartões Sanitäter e Medic (1944) e Combat Medic e Sanitar (hoje), com os curativos e a braçadeira no modelo;
   3. entrar de médico e chegar a uma esquadra em combate;
   4. ver as ✚ dos caídos;
   5. tecla 5: segurar o clique ao lado de um caído (5 s); tomar um tiro no meio para ver a interrupção;
   6. tecla 5 de novo, Arrastar: clicar, andar e clicar de novo para soltar;
   7. no fim da partida, conferir "Vidas salvas".
4. IA: em "Assistir" (IA × IA), seguir uma esquadra em combate e ver o médico ir até o caído e as falas "Médico a caminho!" e "Cobre o médico!". Com a economia ligada (evacuação), ver o grave ficar estável e ir ao ponto de coleta, e a ambulância buscá-lo ali. Conferir o cartão da unidade no general: as linhas "Médico: …" e "Ponto de coleta".
5. Online: dois navegadores na mesma sala. O convidado joga de médico, trata e arrasta um caído da IA do anfitrião. O ferido deve levantar no anfitrião e as ✚ devem aparecer no convidado.
6. MCP: `get_unit` de uma esquadra deve trazer `med` e a linha do médico em `see`.
