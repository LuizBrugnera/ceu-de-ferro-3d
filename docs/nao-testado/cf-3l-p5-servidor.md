# cf-3l-p5-servidor: servidor, MCP e documentação para 3 lados (pacote P5 do plano de 3 lados)

**O que mudou:**
- `server.js`:
  - `MSIDE`: tabela explícita do lado de cada modelo, época por época. Substitui a regra "metade da lista". Na Frente atual, 0 = EUA, 1 = Rússia e 2 = Insurgentes. Na subida, o servidor confere que todo modelo de `MODELS` tem lado e para com erro se faltar algum.
  - Os modelos insurgentes entram no fim das listas de `MODELS.modern`, para não mudar índice antigo:
    - tanques: `t55`, `t62`;
    - artilharia: `tec107`;
    - os 12 kits `ins*`;
    - transportes: `tecDshk`, `tecSpg9`, `tecZu`, `moto`, `suv`, `sedan`, `vbied`, `zil131`, `btr70`.
    - O drone do `insDrone` vale no `dstate`.
  - Número de lados da sala, `room.ns` (2 ou 3; 3 só em `modern`):
    - o primeiro jogador diz no `join` (`ns: 3`), como já faz com o `mv`;
    - o `welcome` repete (`ns`), para jogador, espectador e ponte;
    - quem chega com outra contagem é recusado com o erro `sides`;
    - um modelo de lado que a sala não tem é recusado com o erro `side` (por exemplo, um insurgente numa sala de 2 lados);
    - uma partida suspensa só é retomada com a mesma contagem (`snap.ns`); `GET /partidas` diz `ns`.
  - O lado do jogador fica guardado na conexão (`c.side`) no `join`. `swap`, `req`, `crew`, `down` e `sideOf` usam esse lado.
  - Captura (`crew` com `cap: 1`): aceita um transporte de qualquer outro lado e manda `cs` (o lado de quem capturou) na mensagem e no registro do jogador. Antes era um XOR.
  - Cadeiras de general:
    - `room.gen/genk` têm o tamanho máximo da época;
    - o jogador recebe só as dos lados da sala (`gview`), então com 2 lados continua `[0, 0]`;
    - uma ponte de lado 2 entra numa sala vazia; se a sala abrir com 2 lados, recebe `sides` e é desconectada.
  - `cmd`: `c` tem um item por lado da sala, e cada lado vê só o próprio item.
  - `cq` v2 (`v: 2`): cada ponto é `[dono, progresso 0-100, quem toma, w0..w(N-1)]`; `k` tem N números; `l` tem 3N; `r` é `[vencedor, motivo 0-9, colocação?]`, onde a colocação são N inteiros (os lados do 1º ao último). Sem `v`, a mensagem é a de 2 lados, como antes.
  - Validações de lado 0|1 trocadas por "lado da sala" (`ts`): linhas de IA, `base`, `fort`, `rad`, `dai`, `civ` k2, `eco`, `ecs`, `gen`, `glog`, `mine`, `mboom` e `hlp`. As máscaras de bits vão até `(1 << ns) - 1`.
  - O retrato da partida suspensa guarda `ecs`, `gen`, `glog` e `gT` para 3 lados.
- `mcp-general.js` (versão 2.2.0):
  - `CEU_SIDE` aceita 0, 1 ou 2;
  - nomes das facções (USA, Russia, Insurgents; na Frente de 1944, Germany e the Allies);
  - `link` traz `faction`, `sides` e `enemies`;
  - com 3 lados, `holder` e `base` dizem o nome da facção, e `tickets` vira um mapa por facção;
  - as instruções dizem a facção e avisam que os dois inimigos também lutam entre si;
  - novo erro `sides`.
- `MCP.md`: tabela de lados e facções; `CEU_SIDE` 2.

**Testado (só fumaça, ~1 min, com script fora do repositório):**
- `node --check` nos dois arquivos.
- O servidor sobe sem erro.
- Sala de 3 lados: `join` com `t55` e `ns: 3` recebe `ns=3` e `gn=[0,0,0]`; um `cq` v2 passa sem erro; uma página sem `ns` é recusada com `sides`; uma ponte de lado 2 recebe `welcome`.
- Sala de 2 lados: `gn=[0,0]`; `t55` é recusado com `side`; uma ponte de lado 2 recebe `sides`.
- MCP com `CEU_SIDE=2`: `initialize` traz as instruções com "Insurgents", e `seat` pega a cadeira.

**Não testado:**
- Nenhuma suíte; nada com a página de verdade. A página ainda não manda `ns` nem `cq` v2: isso é do P2 (conquista) e do P4 (ligação da facção). Até lá, toda sala é de 2 lados.
- Testes que vão quebrar por formato:
  - `tests/gen-relay.js`, `help-relay.js`, `sappers-relay.js`, `forts-relay.js` e `relay.js` usam o lado 2 como inválido. Em salas de 2 lados ele continua inválido na maioria das mensagens; na entrada da ponte, porém, o lado 2 agora é aceito em sala vazia de `modern`.
  - `tests/mcp-general.js` pode conferir `gn: [0, 0]` ou o texto das instruções (que agora é uma função).
- `cs` na captura: a página (`pSide`, P4) ainda não o lê.
- A colocação em `r[2]`: o significado (lados em ordem) precisa bater com o que o P2 mandar.
- Ponte MCP numa partida de 3 lados de verdade (`mcp-live.js` com uma terceira passada).
- Merge com o P0: ele também mexe nas validações 0|1 do `server.js`. Se o P0 entrar depois, os conflitos ficam nessas linhas; a versão `ts(room, …)` cobre o caso dele.

**Riscos:**
- Um modelo novo em `MODELS` sem lado em `MSIDE` derruba o servidor na subida, de propósito (aconteceu com os veículos de reparo do PR #69, já incluídos).
- Página antiga numa sala de 3 lados recebe `sides` (código de erro novo, sem texto próprio na página).
- A ponte de lado 2 desconectada por `sides` fica tentando de novo (com espera crescente) até a sala ser de 3 lados.
- O índice de kit nas linhas de soldado da IA: o servidor só confere o tamanho da lista. A página (P4) deve pôr os kits insurgentes **depois** de todos os de hoje em `trnKits()`.

**Como testar depois:**
- Suítes: `node tests/relay.js`, `node tests/gen-relay.js`, `node tests/help-relay.js`, `node tests/sappers-relay.js`, `node tests/forts-relay.js`, `node tests/resume-relay.js`, `node tests/spec-online.js`, `node tests/logistics-relay.js`, `node tests/mcp-general.js`, `node tests/capture-online.js`. Com 2 lados, tudo deve passar como antes; ajustar os testes que usam o lado 2 como inválido.
- Online com 3 lados (depois do P2 e do P4): anfitrião EUA, convidado Rússia e convidado Insurgente. Conferir:
  - cada um vê só o próprio comandante no mapa (`cmd`);
  - a faixa de pontos e o fim da partida com `cq` v2 (`r` com a colocação);
  - a captura de uma técnica insurgente por um russo (`cs`);
  - minas e `hlp` do lado 2;
  - suspender a partida e retomá-la.
- MCP: `GENKEY=k node server.js`, uma sala de 3 lados aberta pela página, e `CEU_SIDE=2 CEU_KEY=k node mcp-general.js`. Rodar `get_state` com `refresh_map: true` e conferir `link.enemies`, `holder` com nome de facção e `tickets` por facção. Rodar também `node tests/mcp-live.js` com uma passada de lado 2.
