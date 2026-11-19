# cf-mouse-padrao: mouse como controle padrão

**O que mudou:** `ctrl` começa em `'mouse'` (antes `'classic'`); só uma escolha salva `'classic'` no localStorage (`ceu-de-ferro-3d-controle`) volta ao clássico; a aba "Mira com mouse" vem selecionada no HTML do hangar; README atualizado.

**Não testado:** nada além de checar que a página carrega e o servidor sobe. Nenhuma partida, nenhuma suíte.

**Riscos:**
- Quem tinha 'classic' salvo continua clássico (ok); quem nunca escolheu passa a mouse, inclusive o MCP/testes que assumiam clássico (tests/flight-aim.js etc.).
- O seletor de controle só aparece para aeronaves (`#ctrls` oculto para as outras classes); tanque/AA/artilharia/transporte/infantaria não têm esse seletor, então o "padrão" delas não mudou.
- Em tela de toque (`coarse`) `mouseAim()` segue falso.

**Como testar:** limpar localStorage, abrir o hangar: "Mira com mouse" selecionada; jato e helicóptero seguem o mouse; escolher Clássico, recarregar: continua clássico; `node tests/flight-aim.js`.
