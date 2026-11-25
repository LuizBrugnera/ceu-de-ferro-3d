# cf-pol2-camuflagem: o que não foi testado (P31, rede de camuflagem: a obra e a detecção)

Testado: `tests/camuflagem.js` (as duas obras, onde podem ficar, que não param nada, o que cobrem, o alcance de cada olho, o mapa do lado, tiro, movimento, explosão, memória, a base e a instalação da economia), `tests/forts-relay.js` (o servidor aceita os tipos 14 e 15 e diz `cam: 1`) e a página num Chromium sem janela com GPU real, numa partida online de verdade contra o `server.js` local (1280 e 1920 px, era atual e 1944): a rede pronta sobre um tanque e um caminhão, a obra no modo N com custo, o selo CAMUFLADO sob a rede e "REDE" na Visão de General.

Não testado:

- **Convidado online.** Só o anfitrião foi visto. No convidado as redes chegam pela mensagem `fort` (o teste do servidor cobre a passagem), mas o "REVELADO" do convidado é calculado com os tiros que ele mesmo vê: um tiro de um fantasma sem `arms` pode não revelar a rede na tela dele por até 20 s. O anfitrião decide quem é visto, então o jogo não muda; só o selo do HUD e o tracejado do mapa podem atrasar. Como testar: duas abas na mesma sala, a segunda soldado sob a rede, a primeira atira debaixo dela.
- **Servidor antigo.** O motivo `cserver` foi testado sem rede de verdade (com `S.net` e `Net.cam` falso). Não subi um `server.js` antigo.
- **Equilíbrio.** Nenhuma partida IA × IA longa para ver se o ataque aéreo e a artilharia ficam sem alvo demais. Desde a parte 2 a IA constrói redes (abaixo).
- **Escala.** Os veículos do jogo são grandes (um Abrams tem 13 m): a rede pequena de 10 m cobre o meio do tanque, e a regra usa o meio, mas a frente e a traseira aparecem fora da lona. Os tamanhos ficaram os do relatório (10 m e 24 m).
- **Quadros por segundo.** Medi, mas a máquina estava dividida com outras tarefas e o número variou de 3 a 8 quadros por segundo entre rodadas iguais; a medida de simulação sem tela (60 s da mesma partida IA × IA) não mostrou custo a mais.
- **Celular e toque.** Fora por decisão do dono (D5 = C).

## Parte 2: a IA usa a rede (D8)

Testado: `tests/camuflagem-ia.js` (a dose por personalidade, nada no Fácil, a rede grande só depois de ver aviação ou drone, a base mais perto do inimigo primeiro, a ordem no plano, a artilharia parada, servidor antigo; ponta a ponta numa partida IA × IA nova: o plano ordena aos 88 s, a esquadra põe a rede aos 136 s bem em cima da base, 0,00 m fora do centro, e a base fica coberta) e a página num Chromium sem janela com GPU real, numa partida online contra o `server.js` local (1280 px): o general da IA do lado do jogador pôs a rede grande sobre a base avançada (ordenada aos 92 s, pronta aos 168 s); e o painel de Fortificar da Visão de General com as duas redes (1280 e 1920 px).

Não testado:

- **Artilharia de ponta a ponta.** A rede pequena sobre a peça parada foi testada até o item do plano; não vi uma esquadra pôr a rede sobre um lança-foguetes numa partida, porque o M270 da IA mudou de lugar quase o tempo todo nas partidas que rodei (só ficou parado 45 s uma vez em 400 s). O caminho da ordem, da esquadra e do lugar exato é o mesmo da rede grande, que foi visto.
- **A rede que fica para trás.** Quando a peça sai, a rede fica (a IA não desmonta obra nenhuma). Para não espalhar redes vazias, o lado não começa outra rede pequena depois de ter o dobro da dose delas. Não medi quantas sobram numa partida longa.
- **A cúpula antifoguete na frente.** Enquanto o plano poupa para a cúpula (300 de energia e 400 de metal), a rede espera, como toda obra paga do plano. Numa partida no navegador isso segurou a rede por mais de 5 minutos; com dinheiro sobrando ela saiu em 76 s.
- **Equilíbrio.** Nenhuma partida IA × IA longa para medir quanto o ataque aéreo perde de alvo com as redes da IA.
- **Quadros por segundo.** Na mesma cena do navegador: main 12,5, este ramo 11,2 (a máquina varia de 3 a 8 entre rodadas iguais). Sem tela, 120 s da mesma partida IA × IA com o plano trabalhando: o código da IA da rede gastou 3 ms e a cobertura (parte 1) 140 ms de 71 s; a partida inteira levou 5 a 8 % a mais no ramo porque, com uma rede no lugar de outra obra, a batalha segue outro caminho.
- **Convidado online e MCP.** O MCP do general (`mcp-general.js`) não lista as redes; a ordem `fort` com `cns`/`cnl` é aceita pelo jogo, mas a lista de tipos da ferramenta não mudou.
