# RESULTADO-B: teste de verdade da metade B de docs/nao-testado (cf-pol-testes-b)

Tarefa `cf-pol-testes-b` (2026-11-20/21). A metade B vai de `cf-m0-medicao.md` até o último arquivo em ordem alfabética. Para cada
documento rodei o que ele dizia que faltava: no navegador, em exercício sem tela ou com `tests/`. Anotei se passou ou falhou, consertei o que
falhou fora das seções do general e do cérebro (outra frente as reescreve), e encurtei o documento.

## Condições da máquina

- A conta inteira tem 12 núcleos (`cpu.max` do `user-1002.slice`) e 24 GB. Outras frentes rodavam torneios ao mesmo tempo, e o kernel
  matou processos por falta de memória. Por isso eu rodei no máximo 2 processos pesados por vez. Uma suíte levou de 2 a 70 min. Os
  torneios de 8 a 40 partidas que alguns documentos pedem não couberam.
- No Chrome headless, o `requestAnimationFrame` corria a 1–10 quadros por segundo. Os testes no navegador andam a partida à mão: chamam
  `step()` e depois as funções da cena (`updateCamera`, `syncScene`, `render3d`, `drawHud`, `genFrame`) por um `eval` do DevTools. O custo de
  quadro está em ms por quadro numa cena fixa, antes × depois na mesma cena (a função nova trocada no lugar).

## Lote 1 (cf-m0-medicao … cf-mapa-artilharia)

| Documento | Resultado |
| --- | --- |
| cf-m0-medicao | ok (parte). `ana-man` 25/26 (só a checagem de tempo, com a máquina cheia), `ana-mano-net` ok, `ana-parado` (novo, o "parado primeiro") ok. O torneio do custo do general não rodou. |
| cf-m2-abordagens | **falha**: `approaches` com 7 falhas: hora H (pelotão P8, provável drift do teste), substituição na reunião (4), nenhum assalto na partida de 180 s, custo sob carga. O planejador em si passa. No navegador o `gask ap` funciona. |
| cf-m3-procedimentos | **falha**: `procedures` 32 ok e 1 falha (hora H, pelotão P8). `man-c` cai com TypeError no cenário `cut`. |
| cf-m4-emboscada | ok (parte), no navegador: a guarda pedida pelo general abre e é desenhada (GRD); a IA abriu guarda e emboscada sozinha. |
| cf-m5-veiculos-trilho | parte: em 9 min no navegador nenhum tanque fora do trilho. Nada do M5 foi visto agindo. |
| cf-m6-memoria | parte: `mmView` com memória de manobra e de comboios perdidos numa partida de verdade. |
| cf-m7-jogador-mcp | ok (parte), no navegador: abordagens, painel em 1280 e 1920 px, "Fixar e flanquear por A2" abre a manobra, que embarca, desembarca e anda. A hora H não chegou em 540 s. |
| cf-m8-estrategias | ok (parte), no navegador: estratégias por frente e a geral no diário, efeitos (fogo e foco aéreo), `genState().stg`, `R.stg` do AAR. |
| cf-manobra-reuniao | parte: pool e prazo novos passam no `approaches`; falham a substituição e o "segue com 2 de 2" (veja M2). `ana-mano-net` ok. |
| cf-mapa-artilharia | **2 consertos**: rótulos empilhados no mapa de tiro (agora "CC ×3 · CM") e aviões inimigos não vistos aparecendo. `tests/map-tags.js`. |

### Achados para a frente do general (não consertados aqui)
- `tests/approaches.js` e `tests/procedures.js` estão vermelhos no main (ffff56d). A hora H provavelmente é o portão do pelotão (P8): o teste
  ainda espera o assalto na mesma chamada. O ajuste do teste vai no próximo PR, depois de uma rodada que confirme. A substituição na reunião e o "segue com 2 de 2" não
  têm explicação ainda, e em 9f2a313 passavam.
- `tests/man-c.js` cai com TypeError (`c.spec` de um candidato `cut` que não existe).
- O diário do plano de fortificação diz "Perímetro em a base avançada junto a C" (deveria ser "na base avançada").

### Lote 1, depois do PR #176
- O ajuste da hora H foi confirmado. Com `PEL.on = 0` no cenário, `procedures` passa inteiro e a hora H do `approaches` passa. Os dois testes
  foram ajustados (o portão do pelotão fica com `brain-pelotao`). O `approaches` fica com as 4 falhas da reunião, da frente do general.
- `campaign`: 24 ok e nenhuma falha em 3 das 5 seções. Parei a rodada depois de 82 min para dar lugar ao navegador.
  `personality`: tudo ok até a partida IA × IA final de 180 s, que não terminou em 90 min nesta máquina.

## Lote 2 (cf-mapa-cidades … cf-obras-sair)

| Documento | Resultado |
| --- | --- |
| cf-mapa-cidades | **conserto**: no mapa do General, o nome da vila do ponto de conquista saía duas vezes. `tests/town-names.js`. Nomes vistos no General (1920) e no mapa de tiro de 1944. |
| cf-medico | parte: cartão do Sanitäter no hangar; 56 médicos em 455 soldados da IA; eventos do médico na analytics. O soldado do cartão segura fuzil (o pack não tem pistola). |
| cf-miras-impl | **2 consertos**: a 1ª linha de armas da cabine do jato escondida sob o painel de danos, e distâncias de aviões empilhadas no HUD (agora "14,3 km ×4"). `tests/hud-labels.js`. 12 óticas em 1280 e 1920 px sem erro. |
| cf-modo-rts | ok (parte): câmera, W/D, névoa (276 de 323 escondidos), quadro da esquadra de perto, esconder painéis, 1280 e 1920 px. |
| cf-moitas-floresta | parte: 88.165 células de mato e 380 faixas no mapa 11; as moitas aparecem na orla. |
| cf-moitas-mato | achado: as sebes do mapa 7 são 0 no mapa de 3 lados (ids a 65.448 de 65.536); o mato do mapa 10 cobre. |
| cf-mouse-padrao | ok: o helicóptero e o jato seguem a mira do mouse; `ctrl` padrão `mouse`. Documento encurtado. |
| cf-movimento-lider | ok (parte): as três técnicas em uso (desloc, vig, lances), 268 abrigos em contato. |
| cf-movimento-organico | ok (parte): cunha e fila, lagartas a 9 m da estrada, soldados a 22 m do eixo (mediana). |
| cf-obras-sair | ok (parte): `posts` passa inteiro; sacos de areia, ninho e ouriços com cor certa na partida. Achado: grama dentro do buraco da trincheira. |
