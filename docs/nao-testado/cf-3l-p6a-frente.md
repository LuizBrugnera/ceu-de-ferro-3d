# cf-3l-p6a-frente: frente e general com N lados (não testado)

Pacote P6a do plano de três lados (EUA × Rússia × Insurgentes; seção 7 do plano, decisões da seção 8 todas na opção (a) e a seção 10). Implementado sem testes, pela regra de entrega do capitão.

## Dependências (ordem de merge)

Este pacote **chama ajudantes de outros pacotes** e não os define:
- do **P0** (fundação): `S.N`, `foes(t)`;
- do **P1** (mapa versão 7): `dsOf(t, ri)`, `endS` com `R.ends`, `foeOn(t, ri)` e `myRoutes(t)`.

Enquanto o P0 e o P1 não estiverem na main, **a partida não abre** (`ReferenceError: dsOf is not defined` no `newState`). Fazer o merge do P0 e do P1 antes deste. Não defini cópias desses ajudantes, porque um `const` repetido quebraria a página inteira no merge.

## O que mudou

- **Ajudantes da frente** (junto de `lineS`):
  - `frontR(t)`: a estrada da frente da conquista quando é de `t`; se não for, a primeira estrada de `t`. `frontR()` sem argumento continua igual.
  - `foeS(t, ri)`: a linha do inimigo de `t` na estrada `ri` (a outra ponta). Substitui `lineS(1 - t, ri)`.
  - `foeOf(t, x, z)`: o inimigo "dono" de um lugar. É a outra ponta da estrada ali; fora das estradas de `t`, o inimigo de base mais perto.
  - `axesFrom(fr, t)`: só as estradas de `t`.
  - `baseAA(t)`: posição da antiaérea da base. Os lados 0 e 1 continuam como hoje; o lado 2 fica 450 m na direção do centro do mapa.
  - `firstAxis(t)` e `nextAxis(t, ri)`: em que estrada sai cada coluna (rodízio só entre as estradas do lado).
- **`ds = t ? 1 : -1` virou `dsOf(t, ri)` por estrada** em `lineS`, `entryS`, `post`, `deploy`, `reinforce`, `addUnit` (`u.ds`), `spawnColumn` (`back`), `spawnPlayer`, `demoKeepAlive`, `director`, `gpStep`, `cqLine`, `cqNext`, `cmdSense`, `cmdAmb`, `OPS.amb`, `cmdObj`, `cmdAttack`, `cmdDefend` e `cmdColumns`.
- **`post`**: a k-ésima esquadra gira entre as estradas do próprio lado, a partir da estrada da frente. O posto `base` usa a estrada 0, ou a primeira do lado se ele não for ponta da 0.
- **`cmdSense`**: frente e linha inimiga só nas estradas de que o lado é ponta. Nas outras, ambas ficam no meio da estrada e o lado não empurra linha nenhuma.
- **`cmdAmb`**: só arma emboscada em estrada do próprio lado.
- **`cmdColumns`**: não manda reconhecimento à frente em estrada de outro lado.
- **`colAxis`**: peso 0 nas estradas que não são do lado.
- **`cqNext`**: depois do último ponto, o alvo é a base da outra ponta da estrada (antes era `S.base[1 - t]`).
- **Escolha do inimigo** (`cqAim`, `tkLeader`, `LEAD`):
  - com 2 lados, é a ordem de `cqTargets`, igual a hoje;
  - com 3 lados, cada ponto alcançável recebe uma nota: distância à base (km), mais `LEAD.held` (3) se tem dono, mais `LEAD.kn` (0,15) × a força inimiga conhecida ali, menos o peso `lead` (`PERS[..].lead`, ou `LEAD.w` = 1,5) se o dono é o inimigo que lidera em tíquetes;
  - `cmdObj`, `cmdAttack` e `pushOrd` usam essa ordem.
- **`cmdAttack`**: "ponto vazio" agora quer dizer sem peso de nenhum inimigo (`w.some`), não só de `1 - t`.
- **`planDue` em rodízio**: os N lados planejam em ordem, a cada `FIELD.every / N` s. Com dificuldades diferentes, cada lado segue a própria cadência. Com N = 2, as contas dão exatamente o que davam antes.
- **Teto de população por facção** (D10: o dobro de infantaria e de veículos de solo, repartido entre os 3):
  - `GP.pop3` = EUA 143/34/7, Rússia 143/34/7 e Insurgentes 194/28/0 (soldados/veículos/aeronaves);
  - o total é 480 soldados e 96 veículos, o mesmo de 2 lados depois da #77 (que dobrou o teto de 2 lados para 240/48 por lado); `GP.cap` fica 480 nos dois casos;
  - `MAXM` (instâncias de soldados, dimensionado ao carregar) usa `GP.capMax` = 480;
  - `sideMen` sem economia: `IAI.cap / N`;
  - `popOf` dá 0 num tipo que a facção não tem.
- **Lado sem aviação**: `director` e `gpStep` não lançam caça nem ataque se `side.fighter`/`side.cas` não existir; `gpHeli` não lança helicóptero se `side.heli`/`side.lift` não existir.

## O que NÃO foi testado

- **Nada rodou com 3 lados.** Sem o P0 e o P1 a partida nem abre (ver dependências).
- Nenhuma suíte, partida A/B ou torneio rodou. O smoke foi só:
  - `node --check` no script da página;
  - o servidor sobe em 127.0.0.1 e serve a página (HTTP 200).
- **Equivalência com 2 lados:** não conferida rodando. Ela vale se `dsOf(t, ri)` = `t ? 1 : -1` e `myRoutes(t)` = todas as estradas (estradas `[0, 1]` do P1). Pela leitura, `post`, `colAxis`/`nextAxis` e `planDue` dão a mesma ordem de antes.
- Escolha do inimigo com 3 lados e o peso `lead`; os 3 generais planejando em rodízio; os tetos por facção; os Insurgentes sem aviação.

## Riscos

- **Fora do meu trecho, ainda com 2 lados (para P6b e P6c):**
  - os `u.ds = u.team ? 1 : -1` ao reassumir ou capturar veículos (≈ linhas 8796, 8842, 8865, 9208, 10236, 10491);
  - `heliHold`/`heliLift` (`frontR()` e `p.team ? 1 : -1`);
  - `postDisp` (7565), `aiSite` (7838) e o atirador (8948);
  - a ordem de ataque do general (`P.tw.w[1 - t]`, ≈18545);
  - `manAt` (`lineS(0, ri)`).

  Com 3 lados, esses lugares mandam unidades do lado 2 no sentido errado.
- **`frontR()` sem argumento** continua a frente global da conquista (`S.cq.fr`). Quem a usa para um lado específico precisa passar a usar `frontR(t)`.
- **`foeS` numa estrada da qual o lado não é ponta** devolve o meio da estrada; o comandante não deveria olhar para ela, mas um posto ou uma ordem do jogador podem cair ali.
- **Peso do dobro de tropas:** 480 soldados e 96 veículos pesam no anfitrião. O medidor `popK` corta, mas o orçamento de 4 ms com 3 generais não foi medido.
- **Merge com a #77:** a #77 dobrou o teto de 2 lados e escala o mix do plano por `GP.scale` = 2. Com 3 lados, esse mesmo fator vale sobre um teto por lado menor (`pop3`), então o plano pode pedir mais do que cabe; o `fit` do `gpPlan` corta, mas não foi conferido.

## Como testar depois

1. Com o P0 e o P1 na main: abrir a Frente atual de 2 lados, IA × IA. Comparar com a main de antes (mesma semente): colunas, postos, assaltos e ordem de planejamento devem ser iguais. Rodar as suítes de hoje (`tests/`), que devem passar iguais.
2. Com 3 lados, IA × IA × IA, por 10 min:
   - cada general manda colunas só pelas suas estradas (`gLog` "coluna pela rota N");
   - as esquadras andam rumo à outra ponta e não para trás;
   - emboscadas só nas estradas do lado.
3. Escolha do inimigo: dar mais tíquetes a um lado e conferir que os outros dois passam a mirar os pontos dele (`cmdObj`, log "Assalto planejado contra").
4. `planDue`: registrar `S.planK` por segundo; tem que girar 0 → 1 → 2 a cada 1 s (com `FIELD.every` = 3).
5. Teto: com 3 lados, `popOf(2)` = `{ men: 194, veh: 28, air: 0 }`, e os Insurgentes não lançam aeronaves.
6. Jogador num lado de 3: nasce na estrada da frente do seu lado, virado para a base inimiga mais perto.
