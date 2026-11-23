# cf-pol-fluxos: os fluxos do jogo percorridos no navegador

## Testado em 8bc0243 (cf-pol-testes-b, 2026-11-21): parte
- `tests/fluxos.js` passa (30 ok). **`tests/state-gc.js`: 1 falha** ("the first battle filled the caches: 0 cells in HONU, a soldier looked at under the trees"): a preparação do teste não encheu o cache que ele quer ver esvaziar, então a checagem não chega a medir o vazamento; as outras 4 passam. Não investigado (prazo da tarefa).
- O "Não resolvido" abaixo não coube.

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

- **Memória: o que as sondas ainda medem crescendo (~55 MB por partida) é segurado pelo DevTools, não pelo jogo.** Entrar e sair 5 vezes: 155 → 436 MB (antes dos consertos 157 → 859 MB), e só o estado atual (`S`) fica vivo (`tests/state-gc.js`). Um snapshot de heap depois de duas partidas, com todo objeto da cena da primeira marcado antes de sair, lido com caminhos de retenção: das 2.899 peças marcadas que ainda estavam no heap, a cena antiga e as 40 malhas e grupos amostrados só têm caminho até uma raiz por um handle global "DevTools console" (a sessão CDP de quem mede) e pelo `WeakMap` das listas de render do three.js, que só vive enquanto a cena vive. Sem esses dois, nenhum caminho: numa sessão normal, sem DevTools ligado, isso é coletado. Não conferido medindo sem DevTools (o Playwright sempre liga um); se alguém medir uma sessão longa de verdade e a memória crescer, o roteiro está em `pw/snap-take.js` e `pw/snap-paths.js` da pasta de trabalho de cf-pol-fluxos (snapshot lido em arrays tipados, sem `JSON.parse`). As texturas na GPU crescem 7 → 31 em 5 ciclos, a maior parte modelos carregados na primeira vez que aparecem (estabiliza).
- **As falas dos soldados se sobrepõem** quando várias saem juntas (seção do cérebro, fora da leva).
- **O título e os botões do topo saem corrompidos em algumas capturas** (traço pontilhado amarelo) quando há uma segunda passada de render (câmera da arma, Visão de General). Some sozinho; parece da rasterização da GPU deste headless (Mesa D3D12), não do jogo, mas não foi conferido numa GPU de verdade.
- **Quadros/s** neste ambiente oscilam de 3 a 13 entre rodadas iguais (máquina dividida com outros agentes): servem só para comparar custos medidos dentro da página (tempo de `drawHud`, chamadas de `preview`), não como número absoluto.
- Não percorridos: celular e toque, controle (gamepad), drone em primeira pessoa, pouso e rearme do avião na pista, partida inteira de 30 min sem atalho (o fim foi forçado com `S.cq.T = 1`).
