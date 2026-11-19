# cf-era-padrao: a época padrão é "Hoje"

## O que mudou
- `Céu de Ferro 3D.html`: `era` começa em `'modern'` (era `'ww2'`) e o botão "Hoje" vem marcado no HTML. Isso vale para o hangar, "Entrar na sala", assistir e a demo inicial, pois todos leem `era`.
- README: nota de que o hangar abre em Hoje.
- Servidor e `mcp-general.js` já não tinham época padrão do jogo (a sala vem do cliente) ou já usavam `modern`; nada mudou ali.
- A página não guardava a última época (sem localStorage), então não há escolha salva a respeitar.

## NÃO testado
- Só se conferiu a diferença no código; nenhuma suíte, partida ou navegador rodou.

## Riscos
- A seleção inicial de modelo/classe (`cls = 'plane'`, modelo do hangar) com época moderna na primeira carga; algum texto/estado que supunha 1944 no início.
- Demo inicial (`startDemo`) em época moderna: carga mais pesada do que a de 1944.

## Como testar depois
1. Abrir a página: o botão "Hoje" deve vir selecionado, a demo moderna rodar sem erro no console e o hangar listar jatos.
2. Clicar em 1944 e voltar: tudo funciona; "Entrar na sala" e "Assistir" nas duas épocas.
3. `node server.js` e entrar na sala `modern` sem escolher época; `ERA=ww2 node tests/mcp-live.js` continua valendo.
