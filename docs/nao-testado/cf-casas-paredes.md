# Casas, paredes grossas, calibre, granadas e abrigo (cf-casas-paredes)

Regra do capitão: implementado sem testes. Só o smoke: o servidor sobe e a página abre sem erro novo no console (a cidade foi montada: 652 prédios, 64 pedaços, ~418 mil triângulos na qualidade Baixa, num navegador com WebGL por software).

## O que mudou

**Paredes com espessura (simulação).** `CITY.mat` ganhou `th` (m da parede externa: reboco 0,3, tijolo 0,38, concreto 0,3, pedra 0,55, chapa 0,08, madeira 0,12) e `pen` (resistência ao tiro). A face de fora continua na linha da planta; a de dentro fica `th` para dentro.
- `bRay`: um raio que sai de dentro bate na face de dentro (o ponto de impacto, o fim da linha de visão e a câmera de quem está dentro param ali).
- `bldWalk`: o soldado dentro não entra na parede (térreo pela face de dentro; andar de cima pelo `clamp` com `r + th`). Quem está fora continua pela linha da planta.

**Calibre contra parede.** `CITY.pen`, `bPow`, `bRes`, `bThru`, `bOut`:
- Força do tiro: fuzil de soldado e metralhadora sem perfurante 1; arma com `ap` = 1 + 15 × ap + 0,25 × (dano − 5) (a .50 ~2 a 2,5, 20 mm 4+, 30 mm muito mais).
- A parede tira `pen` do material (rachada 0,6 disso, laje 1,4×, divisória 0,4×). Se sobra força, a bala atravessa, mais fraca e mais lenta (até 3 paredes). Fuzil para na alvenaria e atravessa madeira e chapa; .50 atravessa reboco e tijolo, não pedra nem concreto.
- Projétil perfurante de canhão (`shell` sem `he`) atravessa até 2 paredes de prédio, abrindo o buraco onde bate. Explosivo continua como antes (`cityBlast`).
- Celeiro (`barn`) agora é de madeira (`wood`: hp 9, nova linha 6 do atlas com tábuas).

**Granada de mão mais real.** `GRN`, `nadeStep`: espoleta de 3,6 s, quica no chão, nas paredes, nas lajes e nos cascos, rola (morro abaixo também) e para; explode onde estiver, no ar se segurou demais. Sem acaso (igual em todo cliente). Online: a mensagem `toss` leva `f: 1`; um cliente antigo ainda vê a granada estourar no impacto. Granada de drone continua de impacto. `CITY.ai.enter` 2,2 → 4,3 s (quem limpa um prédio entra depois que a granada estoura).

**Abrigo para o cérebro do soldado (API, sem comportamento).**
- `bldCover(o)`: os lugares de um prédio, guardados até ele mudar (`B.rev`): `{ x, z, y, l, nx, nz, in, k, h, p, b, e, lx?, lz? }`. `k`: `win` (dentro da janela ou buraco: agachado sob o peitoril `h` está coberto, em pé atira), `door`, `blind` (parede cega por dentro), `wall` (fora, no térreo; com `lx, lz` é quina: para onde se inclina). `nx, nz` normal para fora da parede; `p` = resistência da parede ÷ força do fuzil (≥ 1 para fuzil).
- `covBld(x, z, r, ex, ez, team)`: os lugares a até `r` m que cobrem de um perigo em `ex, ez`, os melhores primeiro (parede entre os dois, janela antes de parede cega, parede mais forte, mais perto); ignora prédio com inimigo dentro.
- Nada chama essas funções ainda: é para o worker cf-cerebro-soldado.

**Gráfico das casas (`cityScene`, `CLOOK`).**
- Face de dentro de toda parede externa (rebocada nas de alvenaria), e o vão de janela, porta e portão com espessura (ombreiras, verga, peitoril), na malha de dentro (só a até `CLOOK.lod` m).
- Beiral: o telhado passa 0,55 m das paredes; na qualidade Média e Alta, testeira no beiral, peitoril saliente sob a janela, venezianas em parte das casas e sobrados, rodapé (embasamento) no térreo, chaminé nas casas e sobrados, cornija nos telhados planos.
- Cores por lugar e época (`CLOOK.reg`): cada vila escolhe uma região (caiada com telha, ocre com pedra, norte com tijolo e ardósia), com cores de parede, telhado e veneziana próprias para 1944 e para hoje.
- Detalhe novo some com o elemento: códigos de tile 11 (face de dentro), 12 (detalhe enquanto a parede não tem buraco) e 13 (enquanto está de pé).

**README:** a frase das casas diz agora que o tiro vence a parede conforme calibre e material.

## O que NÃO foi testado

Nada além do smoke. Em especial:
- Nenhuma suíte (`tests/world.js`, `ram.js`, `infantry.js`, `perception.js`, `sim-split.js`, `drills.js`), nenhuma partida, nenhuma comparação de desempenho.
- A aparência: não olhei uma casa de perto em nenhuma qualidade (o smoke rodou na Baixa); orientação das faces novas, venezianas, chaminé, beiral, cores das regiões.
- Atravessar parede com .50, 20/30 mm e canhão; fuzil na madeira; o dano que chega do outro lado.
- A granada quicando, rolando, entrando por janela, parando em laje de andar de cima; online com convidado.
- Soldado andando dentro de casa com a parede grossa (portas e janelas do térreo, escada, andar de cima).
- O relógio da batalha num host lento (#118) e o custo de triângulos a mais.

## Riscos
- **Balanço:** metralhadoras .50 e canhões de aviões agora matam quem está atrás de reboco e tijolo; prédios podem virar armadilha. Celeiro de madeira cai mais fácil (hp 9) e o fuzil atravessa.
- **Desempenho:** malha das casas maior (face de dentro, vãos, e na Média/Alta os detalhes). A face de dentro e os vãos ficam na malha de dentro (só perto). Se pesar, ligar os detalhes só na Alta (`CLOOK.det: 2`).
- **Desenho × simulação:** beiral, chaminé, cornija, peitoril e venezianas só existem no desenho (não param tiro nem visão). A parede é um plano na simulação; a espessura só afasta o ponto de impacto de dentro e o soldado.
- **Granada:** pode ficar presa num canto ou atravessar uma quina em ângulo raso (passos de até 1,2 m); a IA que entra no prédio espera 4,3 s (mais lenta para limpar casa). A fuga da IA da granada continua só para granada perto do chão (`b.y − chão < 2`): granada parada num andar de cima não espanta ninguém.
- **Online:** cliente antigo e novo veem a granada diferente (impacto × espoleta), mas o dano é de quem jogou.
- **Soldado dentro:** o empurrão da parede grossa pode prender alguém num vão de porta estreito, sobretudo em pedra (0,55 m).

## Como testar depois
1. `npm start`, `http://localhost:8080`, Entrar na sala como soldado (1944 e Hoje), qualidade Média e depois Alta.
   - Olhar uma vila de perto: janelas e portas com vão fundo, beiral, chaminé, venezianas, rodapé, cores diferentes entre vilas. Entrar numa casa: parede de dentro rebocada, nada furado ou piscando (z-fighting). Atirar de dentro numa parede: a poeira sai na face de dentro.
   - Quebrar uma parede com carga e com canhão: vão, peitoril e venezianas somem com o buraco; nada fica flutuando.
2. Fuzil numa parede de reboco com um soldado da IA atrás: não passa. Num celeiro: passa. Com a .50 do M16 meia-lagarta ou de um avião: passa reboco e tijolo, não pedra (igreja, torre). Tanque com perfurante numa casa com gente dentro: o tiro sai do outro lado.
3. Granada (F): no chão quica e rola por ~3,6 s antes de estourar; contra a parede volta; pela janela entra e estoura dentro; morro abaixo rola. Soldado da IA perto foge dela.
4. Online (dois navegadores): a granada de um aparece igual no outro e o dano bate.
5. Suítes: `node tests/world.js`, `node tests/ram.js`, `node tests/infantry.js`, `node tests/sim-split.js`, `node tests/perception.js` (comparar com o main), e `tests/frame-budget.js`/`clock.js` para o custo.
6. API de abrigo: no console, `covBld(S.my.x, S.my.z, 40, inimigo.x, inimigo.z, S.my.team)` deve listar janelas voltadas para o inimigo primeiro e lugares fora do lado oposto ao dele.
