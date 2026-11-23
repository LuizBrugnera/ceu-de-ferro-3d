# cf-construir-general: o general manda construir direito (testado em parte; um cenário FALHOU)

O bloco `CGN` de `Céu de Ferro 3D.html` e as edições em `slot`, `planSup`, `cmdPosts`, `manFree`, `cmdPoints`, `fortPlan`, `afpBuilder`, `afpTry`/`afpKeep`: os homens ao lado da obra (`cgnWork`/`cgnPts`), quem construiu a base volta ao trabalho (`cgnHome`, `CGN.rel` 90 s), o construtor de outra estrada (`cgnSupBy`, até 3 km), a ordem de base que desiste em 600 s (`CGN.walk`), construtores não roubados, guarnição e sapadores no plano de fortificação, prazo do plano 480 s + 0,45 s/m, a obra sem lugar que acaba (`cgnNoRoom`).

Testado (cf-pol-testes-a, exercício sem tela, moderna, mapa v11, semente 5, economia ligada): uma esquadra `line` mandada pelo funil (`genCmd fort bunker`, aceito) a 30 m do meio de uma vila tomada (Vila das Oliveiras, 62 objetos a 120 m), com os homens postos no lugar. **Falhou**: o que começou aos 28 s foi o saco de areia do próprio `fortPlan` no lugar da ordem (a casamata nunca começou; a ordem da esquadra logo depois do `genCmd` não tinha `dig`), o lugar mais longe dado por `slot` ficou a 53,9 m da obra, os homens andaram até 69,5 m dela, e a obra ficou em 0 por 92 s. Suspeita: `slot` dá prioridade a `q.bg` (a camada do ponto em `sqMore`: patrulha, reserva, `sqWorks`) antes de `cgnWork`, e a ordem `fort` some quando a esquadra já está no lugar. Não consertado: o cenário é artificial (homens teletransportados) e a causa não foi confirmada no tempo que houve.

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- Repetir o cenário acima sem teletransporte (a esquadra caminha) e num lugar sem casas, para separar o defeito do `slot` do da ordem.
- A ordem sem lugar livre (`cgnNoRoom` depois de 3 tentativas): o exercício não achou água com margem no mapa v11 e não rodou.
- Não visto: a engenharia que volta e faz a segunda base, a base nova com construtor de outra estrada, a ordem de base que desiste em 600 s, a guarnição e os sapadores construindo postos, o prazo maior do plano.
- As suítes `afp`, `bases`, `forts`, `posts`, `aid` (`SECS=240`), `sappers`, `orders`, `w13`, `bases-online`; a medição antes/depois de 15 min; o custo por quadro do `slot` online.

## Como testar

1. As suítes acima.
2. Cenários (`tests/cgn.js`): `fort bunker` numa vila com a esquadra caminhando até lá: os homens a menos de 8 m da obra (`builds`) e ela pronta; `fort trench` dentro d'água perto da margem: a ordem acaba depois de 3 tentativas com "Obra ordenada sem lugar livre"; `eng` termina uma base e, com a guarda chegando, volta (`ord.b` vazio) e pega a próxima; base em outra estrada sem esquadra livre nela: `cgnSupBy` acha a engenharia; ordem `build` que não chega desiste em `CGN.walk`; `afpBuilder` com só uma guarnição a 400 m a escolhe.
3. Medição: IA × IA por época, mapa v6, `eco: true`, 15 min, 3 sementes, contra o `main`: obras sem `pre` que chegam a `prog >= 1`, bases prontas, ordens do plano "pronto" contra "desiste" (`C.afp.fl`) e as linhas "nenhuma esquadra livre".
4. No jogo: Assistir, Tab, diário: "volta ao seu trabalho", "não chegou ao lugar", "sem lugar livre".
