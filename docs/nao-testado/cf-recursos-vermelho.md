# cf-recursos-vermelho: recursos do general vermelho na Visão de General

## O que mudou
- A faixa "Economia do general" (`gorEcon`, `#genEcon`) só aparecia quando o lado mostrado no mapa (`GV.t`) era o lado da página (`S.me`) e lia sempre `ecoView(S.me)`. No modo Assistir (IA × IA local) e como espectador online, `S.me` é 0: ao trocar a visão para o lado 1 (vermelho), a faixa sumia.
- Agora `gorEconSide()` escolhe o lado: o próprio lado sempre; qualquer lado em Assistir/espectador (`S.watch` ou `S.spec`); nunca o lado inimigo numa partida normal (névoa de guerra). A faixa lê `ecoView(lado)` e o log de despachos desse lado.
- O título da faixa diz de quem é a economia ("Economia do general · Força Vermelha") quando pode ser de qualquer lado.
- MCP e servidor: sem mudança. `mcp-general.js` já guarda o `ecs` do `CEU_SIDE` (0 ou 1) e o servidor já manda o `ecs` de cada lado aos seus jogadores, à sua ponte e aos espectadores.

## O que foi testado
- Só no navegador (servidor em 127.0.0.1): Assistir na época moderna, a faixa mostra a Força Azul e, depois de `genSide(1)`, a Força Vermelha com estoque e renda por minuto. Página carrega sem erro no console.

## O que NÃO foi testado
- Espectador online (sala com jogadores, botão Assistir): a faixa do lado 1.
- Jogador do lado vermelho online (convidado e anfitrião) e na cadeira de General: a faixa do próprio lado.
- Jogador solo trocando a visão para o inimigo: a faixa deve sumir (névoa).
- Nenhuma suíte de `tests/` foi rodada; nenhum teste novo foi escrito (a faixa é DOM, fora do `harness.js`).

## Riscos
- `S.watch` também é verdadeiro no demo do hangar? (`watch: !model && !!o.watch`, só com `o.watch`): conferir que o demo não mostra a faixa de forma estranha.
- O painel "Logística" (`genVM(GV.t)`) em solo, ao trocar para o lado inimigo sem a cadeira, já mostrava as linhas da economia inimiga antes desta mudança (vazamento de névoa pré-existente, não mexido aqui).

## Como testar depois
1. `HOST=127.0.0.1 PORT=8131 node server.js` e abrir http://127.0.0.1:8131/.
2. Assistir sem ninguém na sala: Tab, trocar para o lado 2 (botão do lado ou tecla 2) e ver "Economia do general · Força Vermelha" com números.
3. Dois navegadores: um joga azul (anfitrião), outro vermelho; no vermelho, Tab: a faixa mostra a economia vermelha; tomar a cadeira de General e conferir de novo.
4. Terceiro navegador em Assistir com a sala ocupada (espectador): trocar entre os lados e ver as duas economias.
5. Solo jogando: abrir a Visão de General, trocar para o inimigo: a faixa some.
6. MCP: `CEU_SIDE=1 node mcp-general.js` numa sala com anfitrião; `get_state` deve trazer `economy` com estoque.
7. Suítes: `node tests/w13.js`, `HOST=127.0.0.1 node tests/w13-online.js`, `HOST=127.0.0.1 node tests/eco-online.js`, `node tests/spec-online.js`.
