# cf-mouse-padrao: mouse como controle padrão

## Testado em 1cedd86: ok (parte)
- Navegador (Chrome headless, servidor em 127.0.0.1), localStorage limpo: "Mira com mouse" vem selecionada e `ctrl` é `'mouse'`. Escolher Clássico grava `classic` em `ceu-de-ferro-3d-controle`, e depois de recarregar continua Clássico. Voltar para mouse grava `mouse`.
- Partida com o F-22 (Hoje): `mouseAim()` verdadeiro em voo.
- `node tests/flight-aim.js`: passa.
- **Continua sem teste:** o helicóptero seguindo o mouse, o jato seguindo o mouse com movimento real do mouse (só o estado foi conferido) e tela de toque (`coarse`).

**O que mudou:** `ctrl` começa em `'mouse'` (antes `'classic'`); só uma escolha salva `'classic'` no localStorage (`ceu-de-ferro-3d-controle`) volta ao clássico; a aba "Mira com mouse" vem selecionada no HTML do hangar; README atualizado.

**Não testado:** nada além de checar que a página carrega e o servidor sobe. Nenhuma partida, nenhuma suíte.

**Riscos:**
- Quem tinha 'classic' salvo continua clássico (ok); quem nunca escolheu passa a mouse, inclusive o MCP/testes que assumiam clássico (tests/flight-aim.js etc.).
- O seletor de controle só aparece para aeronaves (`#ctrls` oculto para as outras classes); tanque/AA/artilharia/transporte/infantaria não têm esse seletor, então o "padrão" delas não mudou.
- Em tela de toque (`coarse`) `mouseAim()` segue falso.

**Como testar:** limpar localStorage, abrir o hangar: "Mira com mouse" selecionada; jato e helicóptero seguem o mouse; escolher Clássico, recarregar: continua clássico; `node tests/flight-aim.js`.
