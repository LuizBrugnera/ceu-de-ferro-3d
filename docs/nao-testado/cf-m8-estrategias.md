# M8 Estratégias do general: o que mudou e o que não foi testado

Tarefa `cf-m8-estrategias`. É a camada de estratégia do general, acima dos procedimentos do M3. As 22 estratégias vêm do pedido do capitão (`cf-estrategias.md`).

## Testado em ffff56d (cf-pol-testes-b, 2026-11-20): ok (parte)
- Navegador (Chrome headless, servidor em 127.0.0.1), duas partidas: sala Hoje de 3 lados (anfitrião, 116 s) e Assistir em 1944 (9 min):
  - No diário, por rota: "Estratégia na rota 4 (defesa): Contra-ataque no flanco — 3 inimigo(s) conhecido(s) avançados além da nossa linha (nota 1,7; também avaliadas: defesa móvel 1, …)". Os três lados escolheram.
  - Efeitos no diário: "Ataque em profundidade: caminhão junto a M · Esconderijo — missão de fogo e foco aéreo" e, sem arma no alcance, "… foco aéreo (fogo: Nenhum morteiro ou bateria alcança esse ponto)".
  - `S.cmd[0].stg`: uma estratégia por frente (`fr`: prof, prof, prof, cflk, cflk) e a geral `ecof` em `act`. `genState(0).stg` traz as frentes com nome, nota e razão.
  - `anaReport(ANA.ev, 0).stg`, os dados da seção "Estratégias do general" do AAR, vem preenchido.
  - Nenhum erro no console.
- **Continua sem teste:** se as escolhas fazem sentido ao longo de uma partida inteira (trocas, estratégias que nunca aparecem); a cópia da doutrina na troca de cadeira; o custo do `stgSit`; o AAR desenhado (`aarShow`) e o `get_state` pelo MCP; o A/B com `STG.on = 0`; o `tests/m8.js` sugerido abaixo. As suítes estão na lista do RESULTADO-B.

## O que mudou (`Céu de Ferro 3D.html`, bloco `M8`/`STG`, logo antes da cena 3D)

- **Escolha** (`stgTick`, chamado pelo `cmdSense`, a cada `STG.every` = 30 s de plano):
  - Uma estratégia **por frente** (rota). Se o posto da rota é `atk`, ela sai das 10 de ataque; senão, das 7 de defesa.
  - Uma estratégia **geral** do lado, entre as 5 de economia e ritmo.
  - Há histerese: a escolhida fica pelo menos 120 s. Antes disso, só troca por uma com nota 1,25× maior.
- **Situação** (`stgSit`): usa só o que o lado sabe (`C.known`).
  - Forças: a razão de forças por rota e a geral.
  - Economia: as instalações nossas contra as inimigas vistas, e os tíquetes.
  - Alvos inimigos conhecidos: antiaérea, canhões e morteiros, rádios, caminhões, bases de suprimento.
  - Estradas: os hábitos do inimigo (W17 `C.hk`).
  - Pontos e terreno: as vilas nossas e as inimigas, uma brecha aberta há pouco (um ponto que acabamos de tomar), inimigo além da nossa linha.
  - Nossas tropas: o desgaste médio das esquadras, se há reserva na base, quantos setores estão quietos.
- **Nota** = nota da situação (0 a 2; abaixo de 0,3 a estratégia não serve agora) × peso da personalidade × gosto da partida (sorteado uma vez, de 0,85 a 1,15).
  - O peso da personalidade está em `STG.per`. As cinco personalidades têm as 22 estratégias, cada uma com o seu peso.
  - Sem personalidade, o peso vem da doutrina (`STG.doc`).
- **Diário e AAR**: cada escolha vai para o diário com o tipo novo `stg` (selo `EST`), com a razão, a nota e as duas alternativas seguintes. O mesmo vale para cada ação direta. A revisão pós-batalha ganhou a seção "Estratégias do general" (`anaReport` → `R.stg`), e `AARD.stg` é "estratégia".
- **Efeitos**: todos reaproveitam o que o general já tem.
  - `STG.man`: peso nas manobras que o `cmdManJob` sorteia. Valem todas as do `MANG`, também `trn` (M3) e `emb`, `itd` e `grd` (M4). O `stgWrap` embrulha os geradores.
  - `STG.pr`: peso nos procedimentos do M3 (`p1`, `p2`, `p5`, `p6`, `p12`), via `stgPr` dentro do `prTaste`. É a única linha mexida no código do M3.
  - `STG.dmod`: muda uma cópia da doutrina (`C.doc`). Exemplos: atrito ataca com razão menor, manobra pede razão maior, ritmo dobra a pausa entre assaltos, retardamento recua antes, ponto forte segura mais, isca liga a isca.
  - `STG.camp`: com esforço principal ou economia de forças, a frente principal da campanha leva mais 1 esquadra e as secundárias, uma a menos (`campAI`).
  - `STG.posts`: reserva e defesa móvel mantêm mais uma esquadra na base. Economia de forças tira uma patrulha e uma observação e põe mais uma na reserva (`cmdPosts`).
  - `STG.mix`: inclina o plano de produção, sempre dentro do mesmo orçamento (`perMix`).
  - Fogo: decapitação, contrabateria, SEAD, interdição e ataque em profundidade mandam uma missão de fogo (`GC.fire`, 4 tiros) no alvo conhecido mais perto da nossa base. No máximo uma a cada 45 s. Também põem o foco aéreo lá por 60 s, mas só quando nada mais ocupa o foco (`cmdFires`).
  - `afp`: ponto forte, negação de área e defesa em profundidade sobem um degrau no plano de fortificação (`AFP`): torre na vila-sede, minas nos hábitos do inimigo, ninho no gargalo.
  - Contra-ataque no flanco e defesa móvel: a reserva contra-ataca quando o inimigo no ponto cai a 75% do pico. O normal é 50% com pico 6; aqui basta pico 4 (`cmdDefend`).
- **Quem decide**: com uma pessoa ou o MCP no comando (`C.dk`, ou nem ataque nem defesa com a IA), não há estratégia e a doutrina volta a ser a simples. `STG.on = 0` desliga tudo, para o A/B.
- **MCP**: o `get_state` traz `stg` (por rota e a geral). O `MCP.md` foi atualizado.

## O que ficou de fora ou só em parte

- **Negação de área por destruição de ponte**: não foi feita. O gerador de demolição da IA (`MANG.dem`) está vazio no código atual. Ficaram só as minas, pelo plano de fortificação.
- **Armas combinadas**: não há regra que impeça um blindado de entrar sozinho na cidade. A estratégia só pesa a produção (antiaérea, artilharia, infantaria) e o reconhecimento antes do assalto (p12).
- **SEAD**: não segura os aviões e helicópteros até a antiaérea cair. Ela ataca a antiaérea primeiro, com fogo e foco aéreo, e pesa a produção.
- **Pesos das manobras**: valem para o lado inteiro, não só para a rota onde a estratégia foi escolhida.
- **Exploração do sucesso**: não manda a reserva direto pela brecha. Ela pesa a reserva móvel, o flanqueio, a infiltração e o p5, e encurta a pausa entre assaltos.
- **Convidado na rede**: o painel do convidado não mostra as estratégias. O `stg` não está no `GENK`. Elas aparecem no diário do anfitrião, que já é repassado.

## Riscos

- **Mudanças da doutrina**: `atk` e `def` mudam os postos das rotas. Atrito com manobra no mesmo lado não acontece (as duas são gerais e exclusivas), mas `dmod` de várias frentes se multiplica.
- **Multiplicação dos pesos**: os pesos de manobra se multiplicam entre frentes. Estão limitados a 0,35-2,6 (`STG.cap`), mas podem empurrar um tipo de manobra demais.
- **Missões de fogo**: podem gastar o limite de missões (`GENC.fm`) que o assalto queria. Também podem cair num alvo velho (`C.known` guarda 40 s).
- **Contra-ataque cedo**: com pico 4, a reserva pode sair contra pouca coisa e deixar a base vazia.
- **Degrau do `AFP`**: com economia pequena, gasta energia e metal em obras de degrau 1 ou 2.
- **Gosto da partida**: é o único sorteio (`Math.random`, uma vez por lado). Partidas semeadas que comparam números exatos podem mudar.

## Como testar depois

1. `HOST=127.0.0.1 PORT=8080 node server.js` e abra `http://127.0.0.1:8080/`. Partida IA × IA (assistir) no mapa de 1944 ou hoje, com personalidades diferentes nos dois lados.
2. Visão de General > diário: em até 30 s deve aparecer, por rota, "Estratégia na rota N (ataque|defesa): … — razão (nota …; também avaliadas: …)" e uma "Estratégia geral: …". Confira se a razão bate com o mapa (razão de forças, alvos conhecidos).
3. Console: `S.cmd[0].stg` (frentes, `act`, `X` a situação) e `genState(0).stg`.
4. Cada efeito, no console:
   - `S.cmd[0].doc` (a doutrina mudada; `stg` é a assinatura);
   - `C.mev` (as notas das manobras com o peso);
   - `C.prEv` (os procedimentos do M3);
   - o log "Esforço principal" num assalto de campanha;
   - "Contrabateria: …" ou "Decapitação: …" com um canhão ou rádio inimigo visto;
   - "contra-ataca cedo".
5. Forçar uma estratégia: `STG.per.blz.exp = 50` (ou outra), e veja o efeito. `STG.on = 0` para o A/B contra a versão sem M8.
6. Fim da partida: o AAR deve ter "Estratégias do general".
7. Rode `tests/personality.js`, `tests/campaign.js`, `tests/man-a.js`/`man-b.js`/`man-c.js`, `tests/approaches.js` e `tests/forts.js`. O M8 muda pesos e doutrina; números exatos podem mudar.
8. Depois escreva um `tests/m8.js`: uma batalha semeada, `stgTick(cmdOf(0))` com situações montadas (antiaérea conhecida e avião nosso → SEAD; razão < 0,6 → retardamento; brecha → exploração). Confira a escolha, a histerese e os efeitos.
