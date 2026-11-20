# cf-lideres P3: o líder da esquadra (não testado além dos exercícios curtos)

Pedido do capitão: "um líder em cada unidade, que direciona também os NPCs e pensa também, as camadas de liderança, que dá a sensação de que os soldados pensam mesmo".

Arquitetura: cf-cerebro-pesquisa, P3. Sobre o contrato P0 (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/139).

## O que mudou

Tudo no `Céu de Ferro 3D.html`, numa seção nova, `CEREBRO: lider (P3, cf-lideres)`, logo antes da cena 3D. `LDR.on = 0` desliga.

- **Quem é quem.** Cada soldado tem sobrenome e patente pelo número dele:
  - 0 é o sargento, 1 e 2 são os cabos, o resto são soldados;
  - os Insurgentes têm chefe, subchefe e combatente, com codinomes.
  - Exemplo: "Sgt. Almeida".
- **Sucessão.** Quando o líder morre ou cai ferido, a esquadra fica sem líder até o próximo assumir.
  - A ordem é: o chefe da equipe A, o da B, o primeiro de pé.
  - Leva de 1,2 a 2,6 s, menos se a esquadra for veterana, e 1,4× mais se ele não ouviu nem viu. O teto é 3,6 s.
  - Ele fala "O sargento caiu! Eu assumo!" e o diário registra.
  - Sem líder, a esquadra **hesita**: não avança e não toma decisão nova, e a confiança dela cai.
- **O quadro-negro do líder (honesto).** Entra só o que ele mesmo vê e o que os homens relatam pela voz, pelo sinal ou pelo rádio, com atraso.
  - Os gritos do P5 ouvidos também entram.
  - As **crenças da esquadra** (`belief`), que a mente e os procedimentos leem, guardam só o que está no quadro ou à vista do líder.
  - Assim os procedimentos escolhem com o que o líder sabe.
- **Confiança e linha de frente** (Days Gone).
  - A confiança vai de -2 a 2. Vem da ameaça conhecida contra os homens de pé, da força, da supressão, da moral (P1), da veterania e de um líder perdido.
  - A frente é a direção, a distância e a largura dos contatos do quadro.
- **Técnica de movimento** (`q.tec`, que o movimento orgânico lê):
  - `lances` com contato perto ou fogo recente;
  - `vig` (cunha) com algum contato ou ordem cautelosa;
  - `desloc` (coluna) sem nada disso.
  - O líder fala a troca ("Em cunha!", "Por lances!", "Em coluna!").
- **Escolha pela utilidade** dos procedimentos que já existiam, agora pesada pela confiança: `romper` e `recuo` pesam mais com confiança baixa; `fixar`, `lances` e `reagir` com confiança alta.
- **Método `reagir`** (procedimento novo, reagir ao contato do manual, decomposto por equipe):
  1. Abrigo e fogo de volta.
  2. O líder dá o comando de tiro (com direção e distância, pelo P5) e decide:
     - **romper** com confiança baixa e inimigo superior; o procedimento `romper` assume;
     - **flanco**: a equipe A é a base de fogo e a B vai pelo flanco do lado com mais cobertura e menos exposição (grade do P2). A B **só sai com a A atirando** (um tiro da A em 1,5 s), diz "Em posição!" e assalta. A A cessa o fogo quando a B chega a 35 m do contato;
     - **aguentar**: as duas equipes como base de fogo, e pede fogo (artilharia além de 300 m, senão fogo de blindado).
  - O diário registra a decisão e o porquê.
- **Blindado** (o caso do capitão):
  - **com anticarro**: a equipe do anticarro vai com ele pelo flanco, e a outra fixa a infantaria que acompanha o blindado. A fala é "Anticarro pelo flanco, o resto prende a infantaria!";
  - **sem anticarro**: o P2 já põe cada homem num lugar que segura o canhão, atravessando a casa. O líder fala "Blindado! Para dentro da casa!" quando o caminho de um homem passa por uma casa;
  - com blindado à vista, o `contato` genérico e o `reagir` dão lugar aos procedimentos de blindado.
- **Cartão da unidade e MCP** (`get_unit`, campo `lid`): o líder, a patente, a vaga, a confiança, a técnica, o que decidiu e por quê, as equipes e as tarefas, e a frente. As frases vão no topo do "decide".
- **Conserto de um bug antigo** (desde o #59): em `drInfo`, a linha que marca `K.first` e `q.drCt` estava dentro de um comentário. O procedimento `contato` nunca disparava. Ela voltou a ser código. Isso muda o comportamento de todas as esquadras no primeiro contato.
- **P0**: um líder caído sem sucessão em curso (P3 desligado) é trocado no mesmo passo, como antes.
- **Ganchos no código antigo** (embrulho): `belief`, `mindThink`, `squadThink`, `killMan`, `manDown`, `genCard` e `rtsBrain` (a câmera de comandante, #141, mostra o líder); o `when` de `romper`, `recuo`, `fixar`, `lances` e `contato`; o `man` de `anticarro`. Também `brainHook` `lid` e `eq` (P0) e falas novas em `FALAS` (P5).
- `tests/brain-lider.js` é novo e está na lista do `tests/all.sh`.

## O que rodou (exercícios curtos, exceção da regra)

- `tests/brain-lider.js`: tudo ok.
  - Emboscada pela esquerda a 150 m: o contato é chamado em +1,2 s ("Contato! Dez horas, cento e cinquenta, dois soldados! Fogo!"). O líder decide o flanco em +3 s, e a B sai em +4 s com a A atirando.
  - Sucessão: o novo líder em 2 s, com fala e diário. Com `LDR.on = 0`, a troca é na hora.
  - Quadro honesto: o contato some das crenças sem o quadro e volta depois do relato pela voz.
  - Anticarro: as equipes e a fala.
- `tests/brain.js`, `tests/brain-falas.js` e `tests/brain-honesty.js`: tudo ok.
- `tests/brain-drills.js` (ww2): sucessão em 2,6 s (meta ≤ 4). Fogo e movimento: 59% no assalto (meta ≥ 70%).
- Um A/B pequeno (6 sementes, duas esquadras de 5 a 220 m): com o líder, os combates são mais decididos para os dois lados; sem ele, o lado 1 vence quase sempre. Não é conclusivo.

## O que NÃO foi testado

- Partidas inteiras, torneios, a suíte toda e online. O convidado não roda o líder, e o cartão do convidado vem do anfitrião.
- **A meta "a esquadra segue a missão 60 s depois de perder o líder"** (P6): 0% no exercício do P6, onde a esquadra é destruída no duelo. Não foi medida numa situação em que a esquadra sobrevive.
- **"Todos abrigados e atirando em ≤ 2 s"**: é do P1 (soldado), e não chega lá hoje.
- O custo por quadro com muitas esquadras em contato (relatos a 2 Hz por homem, filtro das crenças a cada pensamento).
- O lado do flanco pela grade de exposição do P2 quando ela não existe (vale 0,5) ou é antiga.
- Insurgentes: os nomes e patentes aparecem, mas o comportamento deles não foi olhado.

## Riscos

- **O conserto do `K.first`** liga o procedimento `contato` em todo o jogo: ao chão, cobertura e relatório nos primeiros segundos de cada contato. Pode atrasar assaltos e emboscadas, e mudar os testes de procedimentos (`tests/inf-drills.js`, `tests/drills.js`).
- **Crenças filtradas pelo quadro**: tudo o que lê `q.bel` (pedidos de ajuda, cartão, procedimentos) agora sabe do contato só depois do relato (0,6 s pela voz). Um homem longe, sem voz, sinal nem rádio, não informa: a esquadra pode ignorar quem está atirando no flanco.
- **"reagir" com urgência 2,2 nos primeiros segundos**: passa na frente de outros procedimentos (emboscada, fumaça), menos os de blindado.
- **Hesitação sem líder**: a esquadra para até 3,6 s. Num assalto, isso pode quebrar o ritmo da operação.
- Mais lances, mais "Em cunha!" e mais falas por esquadra: o limite do P5 corta, mas a fala de técnica pode competir com a de contato.

## Como testar depois

1. `node tests/brain-lider.js` (~1 min) e `ERA=ww2 node tests/brain-drills.js` (ver a liderança e o fogo e movimento).
2. Suítes que podem mudar com o `K.first` e as crenças: `tests/inf-drills.js`, `tests/drills.js`, `tests/help.js`, `tests/w13.js`, `tests/ambush.js`, `tests/procedures.js`.
3. No jogo: Assistir (IA × IA), aproximar a câmera de uma esquadra em contato e conferir:
   - as falas do líder e dos cabos;
   - a B flanqueando só com a A atirando;
   - matar o líder (console: `killMan(S.squads[i].lid)`) e ver a esquadra parar, o cabo assumir e o diário.
4. Visão de General, selecionar uma esquadra: o cartão mostra o líder, a confiança, a técnica, a decisão e as equipes. Pelo MCP, `get_unit` traz `lid`.
5. A/B em torneio quando o `balance.js --brain` (P6) estiver pronto: `LDR.on = 0` contra `1`.
