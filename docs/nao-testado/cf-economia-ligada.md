# Economia sempre ligada (cf-economia-ligada)

**O que mudou:** só documentação (README e MCP.md). O código já fixa `ECO.on: 1` e `LG.on: 1` na página e o servidor manda `eco: 1` e `lg: 1` no welcome; não existe toggle no painel Partida, preferência salva nem chamada MCP que desligue.

**Não testado:** nada foi rodado (regra do capitão).

**Riscos:** nenhum de código. A demo do hangar (sem Assistir) continua sem economia por desenho.

**Como testar depois:** abrir o hangar, Partida: não deve haver opção de economia; jogar solo e Assistir: `S.eco` existe; `node tests/eco-online.js` confere eco/lg no welcome.
