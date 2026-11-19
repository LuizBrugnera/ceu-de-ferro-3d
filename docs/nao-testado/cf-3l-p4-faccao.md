# cf-3l-p4-faccao: ligação da facção Insurgentes como lado 3 (pacote P4 do plano de 3 lados)

**O que mudou** (`Céu de Ferro 3D.html`, README):
- **Nomes:** "Força Azul" virou **EUA** e "Força Vermelha" virou **Rússia**. Os kits perderam o "Azul/Vermelho" (ex.: "Fuzileiro (EUA)", "Strelok (Rússia)", "Combat Engineer (EUA)", "Sapyor (Rússia)"). Os ids não mudaram.
- **D6:** o `leo2` agora é o **M1A1 Abrams** e o `pzh` é o **M109A7 Paladin** (números novos, mesmos ids, para não mexer no servidor, nos testes e nas partidas guardadas). O Bradley ficou de fora: seria um modelo novo em `MODELS`.
- **Lado 3 nas tabelas** (bloco "the third side wired in", logo depois de `facCost`): `ERAS.modern.sides[2]` (cópia do lado de `FACTIONS.modern.insurgentes`, com `art` = técnica de 107 mm, `aaT` = técnica ZU-23 e `air: false`), `INF.modern[2]`, `REC.side.modern[2] = {}` (sem recuperação nem ambulância), `POSTS.*.gun.modern[2]`, nomes de drone que faltavam. As técnicas, a moto, o ZIL-131 e o BTR-70 ficaram enumeráveis em `TRNS` (aparecem no hangar e ganham a vista de assento). O carro-bomba e os carros civis continuam só da IA.
- **Sem aviação:** `sideLacks(t, k)`. `ecoUse` nega avião, helicóptero e ponte aérea; `popOf` dá teto de aeronaves 0; `gpPlan` zera esses tipos. A antiaérea da base e a das colunas (`addUnit('aa')`) viram a técnica ZU-23 num lado sem veículo antiaéreo.
- **`trnKits`:** os kits insurgentes entram **no fim** da lista (os índices antigos não mudam, como o P5 pede).
- **`newState`:** `sidesOf` decide `S.N`. São 3 lados só na Frente atual, quando o mapa tem a terceira base (`T.bases.length >= 3`, que vem do P1) e: online, o servidor diz `ns: 3`; fora dele, a opção não é "Dois". Com 3 lados, `S.fac = [0, 1, 2]` e `S.me` = lado do modelo escolhido. Com 2 lados, tudo fica como antes. `S.humans` e `S.fld` têm tamanho N, e a abertura (AA da base e `deploy`) roda para os N lados.
- **Captura:** `pSide` usa `p.cs` (o lado de quem capturou, mandado pelo servidor do P5) e só cai no XOR se não houver `cs`. O `crew` com captura manda `cs` numa sala de 3 lados.
- **Online:** o `join` manda `ns` (`Net.ns0`: 3 quando a página tem mapa de 3 lados e a opção é "Três"); o `welcome` traz `Net.ns`. Recusas `sides` e `side` têm texto.
- **Hangar:** uma fileira de lados (EUA, Rússia, Insurgentes) ao lado da época, só na Frente atual. As classes e os veículos mostram só o lado escolhido, que fica guardado (`ceu-de-ferro-3d-lado`). No painel Partida há "Lados da Frente atual: Três / Dois" (`ceu-de-ferro-3d-lados`). O botão Insurgentes só aparece com mapa de 3 lados, a opção "Três" e fora da tela de toque (no toque só se voa).

**Testado (só fumaça, ~1 min):**
- Sintaxe dos scripts da página.
- O servidor sobe em 127.0.0.1 e entrega a página (200).
- Num Chrome sem janela, a página carrega e roda até o fim, sem erro não tratado no console. O `chrome-devtools-axi` não abriu a página (tempo esgotado), então o hangar nunca foi visto.
- A parte de simulação carrega numa VM. `ERAS.modern.sides` traz EUA, Rússia e Insurgentes; uma partida IA × IA de 2 lados roda 20 s. Uma partida forçada com 3 bases quebra em `aidQrfOn` (`S.aid` ainda é um par): isso espera o P0 (pares → N). Hoje não se chega lá, porque o mapa ainda não tem a terceira base (P1).

**Não testado:**
- Nada no navegador: a fileira de lados, o filtro de classes, o painel Partida, os cartões de veículos insurgentes, as cores, a largura em 1280 e 1920 px e o celular.
- Nenhuma partida de 3 lados: depende do P0 (pares de tamanho N) e do P1 (base B2 no mapa). Antes disso, o botão Insurgentes nem aparece.
- Online com 3 lados (`ns: 3`, `cs` na captura, recusas `sides`/`side`) contra o servidor do P5.
- Jogar como insurgente: técnicas, moto e BTR-70 dirigidos pelo jogador, troca de veículo (`canSwap`, menu H), requisição (U), rádio (sem veículo de rádio), drone com nome "Drone improvisado".
- A ZU-23 fazendo o papel de antiaérea da base e da coluna (é um `car` com IA de carro).
- O M1A1 e o M109A7 em jogo (balanço novo: menos dano que o Leopard; mais elevação e menos alcance que o PzH).
- O general insurgente sem aviação: plano de produção, economia, ponte aérea e evacuação negadas.
- Nenhuma suíte.

**Riscos:**
- `S.me` deixa de ser 0 no modo IA × IA local com 3 lados; código que supõe "o jogador é o time 0" pode errar.
- `addUnit('aa')` pode devolver `null` num lado sem `aa` e sem `aaT` (hoje nenhum).
- `Object.defineProperty(TRNS, …)` dos veículos insurgentes agora é `configurable` e enumerável: o código que percorre `TRNS` passa a vê-los (vistas de assento, hangar).
- O `localStorage` do lado guardado pode pôr o jogador direto na lista de Insurgentes. Se o mapa não tiver 3 lados, o hangar volta para EUA.
- Com "Dois" numa sala que já é de 3 lados, entrar falha com `sides` (texto novo).

**Como testar depois** (com P0 e P1 no main):
- `HOST=127.0.0.1 PORT=8080 node server.js`, abrir no navegador e, na Frente atual:
  - os três botões de lado aparecem e trocam classes e veículos (Insurgentes sem avião nem helicóptero);
  - recarregar a página guarda o lado;
  - "Dois" esconde os Insurgentes;
  - conferir em 1280 e 1920 px e no celular.
- Entrar como Insurgente (fuzileiro, técnica DShK, T-55) numa sala nova: o `welcome` traz `ns: 3`. Um segundo navegador entra como EUA e um terceiro como Rússia. Num deles, abrir uma sala com "Dois" e ver a recusa.
- Assistir (IA × IA) com 3 lados: a AA da base insurgente é a técnica ZU-23, nenhum avião ou helicóptero insurgente nasce, e não sai ponte aérea nem evacuação por helicóptero.
- Capturar uma técnica insurgente com um russo: o veículo fica russo (`cs`).
- Suítes: `node tests/relay.js`, `node tests/capture-online.js`, `node tests/gen-loads.js`, `node tests/spec-online.js`, `node tests/world-online.js` (usa `leo2`).
