# cf-pol2-camuflagem: o que não foi testado (P31, rede de camuflagem: a obra e a detecção)

Testado: `tests/camuflagem.js` (as duas obras, onde podem ficar, que não param nada, o que cobrem, o alcance de cada olho, o mapa do lado, tiro, movimento, explosão, memória, a base e a instalação da economia), `tests/forts-relay.js` (o servidor aceita os tipos 14 e 15 e diz `cam: 1`) e a página num Chromium sem janela com GPU real, numa partida online de verdade contra o `server.js` local (1280 e 1920 px, era atual e 1944): a rede pronta sobre um tanque e um caminhão, a obra no modo N com custo, o selo CAMUFLADO sob a rede e "REDE" na Visão de General.

Não testado:

- **Convidado online.** Só o anfitrião foi visto. No convidado as redes chegam pela mensagem `fort` (o teste do servidor cobre a passagem), mas o "REVELADO" do convidado é calculado com os tiros que ele mesmo vê: um tiro de um fantasma sem `arms` pode não revelar a rede na tela dele por até 20 s. O anfitrião decide quem é visto, então o jogo não muda; só o selo do HUD e o tracejado do mapa podem atrasar. Como testar: duas abas na mesma sala, a segunda soldado sob a rede, a primeira atira debaixo dela.
- **Servidor antigo.** O motivo `cserver` foi testado sem rede de verdade (com `S.net` e `Net.cam` falso). Não subi um `server.js` antigo.
- **Equilíbrio.** Nenhuma partida IA × IA longa para ver se o ataque aéreo e a artilharia ficam sem alvo demais. A IA ainda não constrói redes (é o próximo PR do P31); por enquanto só o jogador.
- **Escala.** Os veículos do jogo são grandes (um Abrams tem 13 m): a rede pequena de 10 m cobre o meio do tanque, e a regra usa o meio, mas a frente e a traseira aparecem fora da lona. Os tamanhos ficaram os do relatório (10 m e 24 m).
- **Quadros por segundo.** Medi, mas a máquina estava dividida com outras tarefas e o número variou de 3 a 8 quadros por segundo entre rodadas iguais; a medida de simulação sem tela (60 s da mesma partida IA × IA) não mostrou custo a mais.
- **Celular e toque.** Fora por decisão do dono (D5 = C).
