# cf-pack-modelos: pack de modelos e gráficos (não testado)

## Testado em e91a33a (cf-pol-testes-b, 2026-11-21): ok (parte)
- Os 29 modelos do pack que a página pede carregam no Chrome (`PACK.M`: todos `st` 1). Veículos, soldados e obras do pack vistos numa partida (veja também `cf-pack-aparece.md`, `cf-obras-sair.md`).
- `?pack=0`: nenhum modelo buscado (`PACK.M` vazio), soldados de caixas e veículos de antes, sem erro.
- Custo, a mesma cena semeada (fuzileiro de Hoje, 10 s de partida, câmera atrás): com o pack, p50 de 187 e 272 ms por quadro (duas rodadas); sem o pack, 232 e 277 ms. Na máquina presa a 12 núcleos, a diferença não se mede.
- **Continua sem teste:** os níveis `?packq=1..3`, os soldados deitados e agachados de perto, o carro-bomba sem os tambores, a troca de anfitrião e o espectador com o pack, `file://`.

Pedido do capitão: um pack de upgrade de modelos e gráficos com modelos low-poly livres (tanques, infantaria, armas, animações). Os candidatos foram ao quadro Lavish (113 modelos renderizados no estilo do jogo) e o capitão aprovou os 40 marcados como "Usar"; nas classes sem modelo bom ("O que faltou") fica o modelo de hoje.

## O que mudou

- **Pipeline** `tools/pack/` (só node; ffmpeg só para ler a cor de fontes com textura): `build.js` baixa as fontes do Poly Pizza (`--fetch`, confere a licença na página), gira para +x, põe o chão em y 0, passa as cores para os vértices (a pintura vira tons de cinza que o jogo tinge com a cor do lado; o resto mantém a cor), corta os veículos em partes (casco, torre, canhão, lagartas, rodas) e, nas pessoas, junta tudo numa malha com esqueleto e só as animações usadas. `config.js` diz de onde vem cada modelo e como cortar. Saída: `models/pack/*.glb` (40 arquivos, 3,3 MB) e `models/LICENSES.md`.
- **Servidor**: `GET /models/pack/<id>.glb` (só nomes `[a-z0-9_]`, da pasta `models/pack`, cache de 1 dia). Servidor antigo: 404 e nada muda.
- **Página** (bloco "the models pack", antes do `boot()`):
  - `packGet` busca cada modelo na primeira vez que alguém pede (os veículos e o soldado 1,5 s depois de abrir a página); de `file://`, com `?pack=0` ou `localStorage cf-pack = 0`, nada é buscado. Enquanto não chega, ou se falhar, fica o modelo de antes; quando chega, unidades, destroços e bases de suprimento são refeitos.
  - **Veículos**: Tiger, Panzer IV, Sherman, T-34, Abrams, Leopard 2, T-90/T-72, T-55/T-62; Jeep/Kübelwagen, HMMWV, Tigr, Opel/GMC/Ural/ZIL (M939), HEMTT; técnicas (picape), moto, SUV, sedã e carro-bomba. O corpo procedural sai e o do pack entra, esticado ao comprimento e à largura do veículo; `tur` e `gun` continuam os nós que a cena gira, movidos para o anel da torre e o munhão do pack; cada malha fica na peça de dano dela (o dano continua escurecendo). Nos carros e caminhões, o reparo de arma, as figuras a bordo e o mastro de rádio continuam os de hoje. Carros civis destruídos viram o carro queimado do pack; todo destroço ganha um monte de entulho.
  - **Soldados e civis**: os mais perto da câmera (distância e quantidade pelo nível gráfico do hangar: Baixa 40 m/12, Média 80 m/28, Alta 130 m/48; `?packq=0..3` ou `localStorage cf-pack-q` força) são o modelo animado do pack (soldado SWAT do Quaternius com a cor do uniforme do lado; civis homem e mulher). Clipe pelo estado: morto (morte, parada no fim), deitado (mirar com o corpo deitado), agachado (mirar com o quadril baixo e as pernas dobradas nos ossos), correndo (correr ou correr atirando), andando, atirando, mirando, parado; recarregando mostra "parado". A arma do kit fica na frente do peito na linha da mira (M4, AK, Kar98k, submetralhadora, bazuca, lança-mísseis de ombro, RPG). Os outros continuam a figura instanciada de hoje.
  - **Objetos**: barricada de sacos de areia e ninhos de metralhadora/posto anticarro com os sacos do pack, ouriços na frente do posto anticarro, minas com o modelo de mina, base de suprimento com caixas, caixa de munição, tambores, barraca, barreiras e sacos do pack.
  - Créditos numa linha no rodapé do hangar (`PACK.cred`) e a lista completa em `models/LICENSES.md`.
- Hitbox, peças de dano, alturas de mira (`d.mh`, `d.bl`), IA, rede e regras não mudam: só o visual.

## O que NÃO foi testado

Nada de testes, partidas A/B nem medição (regra do capitão). Só: sintaxe da página e do servidor, o harness da simulação carregando, o servidor subindo, a rota entregando um `.glb` (200) e recusando nome inválido (404), e a página abrindo no navegador com os 29 modelos que o hangar pede carregados (`PACK.M`). Antes do merge com a main, o hangar sem erro do pack; depois do merge, a página dá `TypeError ... reading 'hp'` em `addHeli` (simulação dos helicópteros), **que já acontece na main sem o pack** (conferido abrindo a página da `origin/main`).

Não visto em partida: nenhum veículo, soldado ou objeto do pack foi olhado andando numa batalha.

## Riscos

1. **Encaixe dos veículos**: torre/canhão podem ficar fora do lugar ou girar em volta do ponto errado (o T-72/T-90 tem o cano preso à torre: não sobe nem desce; no Tiger a "torre" do modelo é pequena e o casco leva a maior parte). Figuras a bordo e o reparo de arma dos carros podem atravessar a carroceria nova. As técnicas perderam a bandeira e o carro-bomba os tambores visíveis (eram caixas do corpo procedural).
2. **Soldado**: o modelo veio com animações de pistola (braço estendido), não de fuzil; a arma fica na frente do peito, sem casar com as mãos. Agachado e deitado são feitos à mão (rotação de ossos e do corpo) e podem sair tortos (eixo dos ossos não conferido). Não há recarga própria.
3. **Desempenho**: até 48 esqueletos animados no Alta, cada um com seu mixer; veículos com mais triângulos (Tiger 11 mil, M939 10 mil). FPS não medido.
4. **Recarregar tudo** quando um modelo chega (`PACK.dirty`) refaz unidades e destroços; perto do início pode dar um soluço.
5. A troca de anfitrião, o espectador e o modo general não foram vistos com o pack.
6. Os cartões do hangar montados antes de o modelo chegar continuam procedurais até trocar de aba.

## Como testar depois

1. `npm start`, abrir `http://localhost:8080`. No console: `Object.entries(PACK.M).map(([k, v]) => k + ':' + v.st)` (1 carregado, -1 falhou).
2. Hangar, aba Tanque: girar entre Abrams, Leopard, T-90, T-72 (Hoje) e Tiger, Panzer IV, Sherman, T-34 (1944); conferir torre e cano girando e subindo junto (entrar num tanque, mexer a mira).
3. Partida "Assistir" (Hoje e 1944): olhar soldados de perto (andar, correr, deitar, agachar, atirar, morrer), civis numa vila, colunas de caminhões, técnicas dos Insurgentes, uma base de suprimento, uma barricada, ninhos, minas e um destroço.
4. Dano: atirar num tanque e ver as peças escurecerem; destruir um e ver o destroço (escuro, com entulho) e a torre voando.
5. Comparar: `?pack=0` (sem o pack) contra o normal; níveis `?packq=1`, `2`, `3`.
6. FPS: numa partida "Assistir" de Hoje, 2 min, anotar o FPS médio com `?pack=0` e sem, no mesmo ponto de câmera.
7. Servidor antigo / `file://`: abrir o HTML direto e confirmar que tudo continua procedural, sem erro.
8. Refazer o pack: `PACK_SRC=/tmp/pack-src node tools/pack/build.js --fetch` (precisa de rede e ffmpeg).

## Arquivos

`tools/pack/{build.js,glb.js,config.js}`, `models/pack/*.glb`, `models/LICENSES.md`, `server.js` (rota), `Céu de Ferro 3D.html` (bloco do pack e os ganchos `box.prop` em `fortBoxes`/`postBoxes`). O quadro com todos os candidatos e o que ficou de reserva está em `~/firstmate/data/cf-pack-modelos/` (`board/pack-modelos.html`, `decisions.json`).
