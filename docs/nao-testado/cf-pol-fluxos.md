# cf-pol-fluxos: os fluxos do jogo percorridos no navegador

Percorridos num Chrome headless com GPU (Intel UHD 770 via D3D12 no WSL: `GALLIUM_DRIVER=d3d12`, `--use-angle=gl-egl`), com o `server.js` em 127.0.0.1 e roteiros playwright fora do repositório. Os consertos estão nas PRs de cf-pol-fluxos, cada um com teste em `tests/fluxos.js`, `tests/rematch.js` ou `tests/state-gc.js`.

## Percorrido e funcionando

- Hangar em 1280 e 1920: épocas, lados (Insurgentes sem aviação), classes, carrossel, Partida (duração, lados, hora, tempo, câmera das armas, general), Controles pelo teclado (abre com Enter, Esc fecha e devolve o foco).
- Entrar na sala de avião, tanque, antiaérea, artilharia (mapa de tiro M), infantaria, helicóptero e transporte; trocar entre todos (H); botões do cabeçalho (manche, fogo amigo, som, câmera, trocar); mapa da batalha com roda, arrastar e duplo clique; redimensionar a janela no meio da partida.
- Morrer e voltar pela tela "Próximo veículo"; "Onde entrar" pelo teclado e pelo mouse.
- Infantaria: construir a base (N e o gatilho), pousar o rádio (O); o U fora de um depósito diz "Sem depósito".
- Visão de General: abas, seleção por tipo, ordem de mover, câmera 3D; Comandante (RTS) pelo hangar.
- Assistir: IA × IA, pausa (Espaço), velocidade (> até ×4), câmera; espectador com alguém jogando.
- Fim de partida, revanche, Partidas anteriores (local e servidor), revisão.
- Servidor: dois clientes, troca de anfitrião, quem volta como convidado, fim e revanche nos dois; servidor caindo e voltando; partida suspensa (Continuar, Nova partida).
- Console: vazio do carregamento ao Assistir.

## Não resolvido

- **Memória ainda cresce ~55 MB por partida** (entrar e sair, 5 ciclos: 155 → 436 MB; antes dos consertos 157 → 859 MB). Os estados antigos (`S`) já são soltos (sobra 1 vivo, o atual: `tests/state-gc.js`); o que cresce agora não é alcançável a partir dos nomes do script nem das propriedades dos elementos (busca em largura dentro da página), então está em fechos ou nos caches internos do three.js. Próximo passo: um snapshot de heap depois de 1 e de 3 ciclos, comparado pelo construtor (precisa de uns 2 GB livres para ler o snapshot). As texturas na GPU crescem 7 → 31 em 5 ciclos, a maior parte modelos carregados na primeira vez que aparecem (estabiliza).
- **As falas dos soldados se sobrepõem** quando várias saem juntas (seção do cérebro, fora da leva).
- **O título e os botões do topo saem corrompidos em algumas capturas** (traço pontilhado amarelo) quando há uma segunda passada de render (câmera da arma, Visão de General). Some sozinho; parece da rasterização da GPU deste headless (Mesa D3D12), não do jogo, mas não foi conferido numa GPU de verdade.
- **Quadros/s** neste ambiente oscilam de 3 a 13 entre rodadas iguais (máquina dividida com outros agentes): servem só para comparar custos medidos dentro da página (tempo de `drawHud`, chamadas de `preview`), não como número absoluto.
- Não percorridos: celular e toque, controle (gamepad), drone em primeira pessoa, pouso e rearme do avião na pista, partida inteira de 30 min sem atalho (o fim foi forçado com `S.cq.T = 1`).
