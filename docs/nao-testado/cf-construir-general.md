# cf-construir-general: por que o general não mandava construir direito, e as correções (não testado)

Entregue sem testes, pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado").

## Causas encontradas (lendo o código) e o que mudou

Tudo em `Céu de Ferro 3D.html`: um bloco novo `CGN` (antes do M8, fim da simulação) e edições pequenas em `slot`, `planSup`, `cmdPosts`, `manFree`, `cmdPoints`, `fortPlan`, `afpBuilder`, `afpTry`/`afpKeep`. Uma frase no README (Fortificação).

1. **A esquadra mandada construir ficava nas casas ou nas trincheiras perto, não na obra.** O lugar dos homens no posto (`postPts`) prefere janelas de casas a até R + 35 m, obras prontas a 40 m e o perímetro do fim da caminhada. O líder podia ficar a mais de 30 m do lugar e a obra ordenada nunca começava; ou só quem estava perto construía e a obra decaía. Agora, com uma obra a fazer (a base da ordem `build`, a obra que `fortPlan` começou para a ordem, `O.wk`, o posto da própria esquadra, `q.aidP`, ou o lugar de uma obra ordenada ainda não começada), os homens ficam ao lado dela (`cgnWork`/`cgnPts`, chamados no `slot`): em duas filas do lado longe do inimigo, todos ao alcance.
2. **Quem construía uma base de suprimento virava a guarda dela para sempre.** `planSup` dava a ela a ordem de guarda (`O.b`), e `cmdPosts` a contava como guarda, então nenhuma guarda vinha. A única esquadra de engenharia do lado fazia uma base e mais nenhuma, e o plano de fortificação também a perdia (`afpBuilder` pula `O.b`). Agora só esquadras `guard` contam como guarda (a guarda é pedida já durante a obra e ajuda a construir), e quem construiu volta ao seu trabalho (`cgnHome`) quando a base está pronta e guardada; a engenharia volta de qualquer jeito 90 s depois (`CGN.rel`) e não é escolhida de novo como guarda.
3. **A base nova só saía com uma esquadra livre na mesma estrada** a até 1,6 km (`aiSite` escolhe o lugar antes). Sem ninguém ali, o lado não construía mais. Agora o construtor pode vir de qualquer estrada de onde consiga ir (a regra do `pushFrom`: a mesma estrada, um entroncamento, uma caminhada pela rede ou perto da ponta), a até 3 km, com kit primeiro, engenharia depois, o mais perto (`cgnSupBy`). Sem ninguém, procura de novo em 15 s.
4. **Uma esquadra que nunca chegava ao lugar travava toda base nova** (`planSup` espera enquanto há uma ordem `build` aberta). Agora a ordem sem obra começada desiste depois de 600 s (`CGN.walk`), com linha no diário.
5. **Construtores roubados no caminho:** uma manobra (`manFree`) e a defesa dos pontos (`cmdPoints`) podiam pegar a esquadra a caminho de construir; `planSup` podia pegar uma esquadra de uma manobra ou emboscada (só a ordem da pessoa era protegida). Agora nenhum dos três faz isso.
6. **"Nenhuma esquadra livre" no plano de fortificação:** `afpBuilder` pulava toda esquadra com vila ou ponto (`O.tw`), então a guarnição (`AFP.by.garr`) nunca era escolhida, e os sapadores só serviam para campo minado. Agora quem segura vila ou ponto constrói a até 600 m do seu posto sem inimigo a 600 m, e os sapadores erguem postos depois da engenharia (peso 300).
7. **A ordem do plano desistia em 480 s mesmo com o construtor a km de distância** (a 3,6 m/s, 2,5 km levam ~12 min). Agora o prazo é 480 s + 0,45 s por metro da caminhada.
8. **Obra ordenada sem lugar livre prendia a esquadra para sempre** (tentava 5 pontos a cada 20 s). Agora tenta também 6 m mais longe, 3 m mais perto e 12 m mais longe e, depois de 3 tentativas sem lugar (não por falta de dinheiro), a ordem acaba (`cgnNoRoom`: a operação do plano fecha e a esquadra volta).

Trincheira como buraco e túneis são de outra tarefa (cf-trincheiras-tuneis); não há nada disso no `main` agora, então o general continua com a trincheira e os postos que já existem.

## O que foi verificado (só fumaça)

- `node --check` do script da página.
- Harness: uma partida IA × IA por época (1944 e hoje), mapa v6, economia ligada, semente 5, 150 s, sem erro e sem NaN; obras e bases de suprimento saem (1944: 24 obras, 3 bases; hoje: 19 obras, 4 bases). **Não é medição**: não houve comparação com o `main`.
- `server.js` sobe (porta 8173) e responde 200 na raiz.

## O que NÃO foi testado

- Nenhuma suíte de `tests/`, nenhuma medição antes/depois, nenhuma partida longa, nada no navegador.
- Não vi acontecer: homens ao lado da obra em vez das casas, a engenharia voltando e fazendo a segunda base, a base nova com construtor de outra estrada, a ordem de base desistindo em 600 s, a guarnição e os sapadores construindo postos, o prazo maior do plano, a ordem sem lugar acabando.
- Online (anfitrião), o custo por quadro do `slot` novo (é O(1) com cache por esquadra).

## Riscos

- **Defesa mais fraca:** guarnições e esquadras de ponto agora saem (até 600 m) para construir, e a guarda de cada base é pedida já durante a obra (uma esquadra a mais por base, gastando população e economia).
- **Homens expostos:** durante a obra eles ficam ao lado dela, fora das casas e trincheiras (só com o inimigo a mais de 150 m para obra ordenada e 300 m para a própria).
- **Linha esvaziada:** com a engenharia liberada em 90 s sem guarda, uma esquadra de linha ou `held` da mesma estrada vira a guarda até a guarda chegar (como já acontecia da segunda base em diante).
- **Ordem que desiste:** 600 s pode ser pouco para uma caminhada longa com paradas; ajuste `CGN.walk`.
- **Suítes que podem mudar:** `tests/afp.js` (o construtor escolhido e o prazo), `tests/bases.js` e `tests/bases-online.js` (a guarda e quem constrói), `tests/aid.js` (postos, guarnição), `tests/sappers.js` (sapadores tirados para postos), `tests/forts.js`/`tests/posts.js` (lugar dos homens), `tests/man*.js`/`tests/manoeuvre*` e `tests/approaches.js` (`manFree`), `tests/orders.js`/`tests/w13.js` (comparações de paridade).

## Como testar depois

1. Suítes:
   ```
   node tests/afp.js
   node tests/bases.js
   node tests/forts.js
   node tests/posts.js
   SECS=240 node tests/aid.js
   node tests/sappers.js
   node tests/orders.js
   node tests/w13.js
   node tests/bases-online.js
   ```
2. Medição antes/depois: IA × IA por época, mapa v6, `eco: true`, 15 min, 3 sementes, `PAGE=<cópia do main>` e esta página. Por minuto e por lado: obras sem `pre` por tipo e quantas chegam a `prog >= 1`, bases de suprimento prontas, ordens do plano que terminam "pronto" contra "desiste" (`C.afp.fl`), e as linhas "nenhuma esquadra livre". Esperado: mais obras prontas, menos "tempo esgotado" e "nenhuma esquadra livre", e mais de uma base feita pela engenharia.
3. Cenários para escrever (sugestão, `tests/cgn.js`):
   - esquadra `eng` termina uma base; com uma guarda chegando, ela volta (`ord.b` vazio) e pega a próxima base;
   - base em outra estrada, sem esquadra livre nela: `cgnSupBy` acha a engenharia de outra estrada e ela chega e começa;
   - ordem `fort` de ninho ao lado de casas: os homens ficam a menos de 8 m da obra (`builds`) e ela fica pronta;
   - ordem `build` que não chega: desiste em `CGN.walk` e uma nova base sai;
   - `afpBuilder` com só uma guarnição a 400 m: ela é escolhida e volta para a vila no fim;
   - `fort` num lugar sem espaço: a ordem acaba depois de 3 tentativas.
4. No jogo: "Assistir", Tab, diário do general: "volta ao seu trabalho", "não chegou ao lugar", "sem lugar livre", e o plano de fortificação com menos recusas.
