# Economia sempre ligada (cf-economia-ligada; testado em parte)

Só documentação (README e MCP.md): a página fixa `ECO.on: 1` e `LG.on: 1`, e o servidor manda `eco: 1` e `lg: 1` nos dois `welcome`.

Testado (cf-pol-testes-a): no código, o painel Partida do hangar só tem duração, lados, hora, tempo, câmera e o general da IA (nenhuma opção de economia ou logística), nenhum código desliga `ECO.on`/`LG.on` fora dos testes, e `ecoInit` cria `S.eco` na conquista solo e no Assistir (online com `Net.eco` do welcome) e não na demonstração do hangar; numa partida Assistir sem tela com os valores da página (moderna, mapa v11), `S.eco` existe e a economia anda (bases, obras e o livro de obras).

## O que falta

(Não rodou: máquina dividida, uma coisa pesada por vez para todos.)

- `node tests/eco-online.js`: confere `eco`/`lg` no welcome e a economia online.
- No navegador: o painel Partida do hangar sem opção de economia, e `S.eco` no console jogando solo e em Assistir.
