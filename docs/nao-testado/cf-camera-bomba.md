# cf-camera-bomba: câmera das armas (bombas, mísseis, foguetes) (não testado)

## O que mudou
Tudo em `Céu de Ferro 3D.html`, módulo `WCAM` logo antes de `boot()`, mais um bloco no painel Partida e uma linha em `skyKeys`.
- Quando o **jogador local** (`S.my`, nunca os outros, offline e online) solta uma bomba (inclui bombardeiros e bombas guiadas), dispara foguete ou míssil (jato, helicóptero, equipes AT/ATGM, SAM), uma janela no canto superior esquerdo segue a arma por trás e por cima até ela acabar (`gone`) e fica ~2 s no estouro.
- Tecla **`** (Backquote) alterna a janela com a tela cheia. Os controles da vista principal seguem valendo.
- Míssil guiado à mão (tecla L, `P.las`): a janela mostra o laser como um quadrado vermelho para ajudar a guiar.
- Ajuste em Partida > "Câmera das armas": Desligada / Ligada (padrão: bombas, mísseis, foguetes) / Com artilharia (obuses e morteiros, `k:'he'`). Guardado em `localStorage` (`ceu-de-ferro-3d-camarma`).
- Render barato: segunda câmera, `WebGLRenderTarget` 384x216 (960 de largura em tela cheia), 15 Hz; o quadro é desenhado a cada frame num canto com scissor. `render3d` e `drawHud` foram embrulhados (sem mexer no corpo deles).

## O que NÃO foi testado
Só rodei a checagem de sintaxe do script e o servidor subindo e servindo a página (200). **Não abri a página no navegador**; nada do abaixo foi visto rodando.

## Riscos
- Ordem de cor/brilho do render target vs. canvas (three r128, sem `outputEncoding`): pode sair mais claro ou escuro.
- Estado por câmera: `skyDome`, escala dos `sparks` e visibilidade dos `bush tiles` são trocados para a segunda câmera; `bushTiles()` volta ao normal no render seguinte. Outros efeitos presos à câmera principal (neblina de rótulos, partículas por distância, névoa/efeitos de tela) podem aparecer errados na janela.
- A janela fica em x=12,y=58 (CSS px): pode cobrir HUD, mini mapa ou o kit do soldado. Em celular/toque a tecla ` não existe (sem alternância).
- Detecção por varredura de `S.bombs`/`S.missiles` (`by === S.my`, `WeakSet`); submunição (`o.frag`) ignorada. Foguetes de bombardeiro/helicóptero em rajada (HVAR/Hydra) trocam a câmera a cada disparo.
- Fim da arma = `gone`/`life<=0`; se algum míssil some da lista sem `gone`, a câmera só fecha após 2 s paradas.
- Em erro dentro do módulo, ele se desliga sozinho (`WCAM.mode=0`) em vez de quebrar o frame.
- Online: só olha armas do `S.my` do próprio cliente; fantasmas não disparam câmera. Piloto morto/trocado de veículo fecha a janela (`w.by !== S.my`).

## Como testar depois
1. `PORT=3917 HOST=127.0.0.1 node server.js`, abrir a página, Partida > conferir os 3 botões de "Câmera das armas" (Ligada marcado).
2. Jato com bombas (B/V): soltar bomba, ver a janela seguir até o impacto + 2 s do estouro; apertar ` para tela cheia e voltar.
3. Helicóptero com míssil: L ativa guiado à mão, mover a mira e ver o quadrado vermelho; conferir o míssil indo onde o quadrado manda.
4. Bombardeiro novo (conferir `k:'bomb'` por solta), foguetes, equipe ATGM/AT a pé, SAM.
5. Modo "Com artilharia": obus/morteiro mostram a câmera; no modo "Ligada" não.
6. "Desligada": nenhuma janela. Conferir performance (FPS) com a janela aberta, e online com 2 jogadores (só o dono vê a própria).
