# cf-moitas-mato: mais moitas e infantaria pelo mato (não testado)

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): achado
- **As sebes do mapa 7 quase sumiram nos mapas de hoje.** Contei as moitas de corredor (`T.cv7`) em `genTerrain`: no mapa 7, 3.212 (1944) e 2.724 (Hoje); no mapa 11 com 2 lados, 1.127 e 333; **no mapa 11 de 3 lados (a frente atual), 0**. Os ids de objeto chegam a 65.448 de 65.536 e não sobra lugar para elas. O mato do mapa 10 (`UG`, 88 mil células, sem ids) cobre o mesmo papel. Não é defeito: é o teto de ids.
- **Continua sem teste:** as sebes vistas numa partida de 2 lados, o A/B do `HIDE` e o online.

## O que mudou
- `Céu de Ferro 3D.html`, **mapa versão 7** (`MAPV = 7`; salas com página antiga ficam no 6 pelo portão de versão do servidor).
- `COV7` / `coverV7` (logo depois de `coverTerrain`): corredores de moitas determinísticos pela semente do mapa:
  - sebes nas bordas dos campos (linhas x a cada 330 m e z a cada 260 m, onde há campo de um dos lados);
  - uma linha em cada margem do rio (a partir de onde a margem fica seca);
  - linhas na orla das matas (terreno aberto ao lado de mata densa).
  Cada moita de corredor é uma moita larga e baixa (raio 2,8–4,4 m, a cada 6 m) que pode encostar na vizinha; há falhas de 10 m (5%) para atravessar.
- **Limite de ids**: os objetos ficam abaixo de 65536 (servidor e mensagens de rede) e as cidades já usam ids até ~58 mil. Só cabem ~6,4 mil objetos de cobertura. Por isso no mapa 7 os aglomerados do v6 ficam limitados a 3200 (`COV7.v6`), com chances próprias (`COV7.more`), e o resto vai para os corredores (sebes 55%, rio e orla dividem o que sobra).
  - Medido no navegador: WW2 1807 → 5293 moitas (3340 de corredor); moderno 2095 → 4419 (2852 de corredor). Gerar o terreno leva ~0,5–0,7 s.
- Cena: moitas em blocos de 1 km (`wo.bt`), cada bloco um `InstancedMesh` com a própria esfera de limites (o recorte pela câmera passa a valer) e só desenhado a até 2,6 km do olho (`bushTiles`, chamado em `render3d`). Rochas com esfera de limites do mapa inteiro.
- Mapa tático (`tmStatic`): camada `bush` (mapa 7). Ela entra na ocultação `o` (+0,6 × densidade) e no anteparo `scr` da visão dos observadores (0,6 × densidade). Isso também muda um pouco M2/M4, que leem `o`.
- `tmWalk` aceita um custo alternativo (`K`).
- `HIDE` / `hideStep` (gancho em `step`, a cada 2 s, só no host): uma esquadra da IA cuja ordem é ir a um lugar a 250–6000 m, e que iria pela estrada (sem `O.wp` do comandante; no máximo a trilha a pé do `setOrd`), recebe um caminho escondido pelo mapa tático do lado. Custo da célula: `c × (1 + 6V + 3F/(F+3) + 0,8 na estrada) × (1 − 0,55 × ocultação)`.
  Não vale quando:
  - nada do inimigo passa de 0,12 (vigilância ou força) a até 1200 m do trajeto: vai pela estrada e pergunta de novo a cada 12 s;
  - há pressa: `O.rush`, `q.late`, hora H a menos de 30 s ou já passada;
  - a ordem é de outro tipo (patrulha, escolta, suprimento, construção, recuo e isca ficam na estrada);
  - o caminho fica 1,9× mais longo que a reta + 300 m.
  Veículos não mudam. Contadores: `S.hws` (`go`, `road[motivo]`, `none`, `long`).

## NÃO testado
- Nenhuma suíte, partida A/B ou baseline (regra do capitão). Só: sintaxe do script, o servidor sobe, `genTerrain(era, 7)` roda nas duas eras no navegador (contagens acima), e 240 s de IA × IA (WW2, mapa 7) sem DOM pelo `tests/harness`: sem erro nem NaN, 1 esquadra tomou o caminho escondido (com `HIDE.max` 4000; depois subiu para 6000 sem nova rodada).
- A cena com os blocos de moitas **não foi vista** (o navegador compartilhado caiu). Riscos: moitas sumindo ou piscando nos limites dos blocos, ou o recorte errado.
- Se a infantaria de fato entra no mato e chega: tempo de chegada, travar em sebes, falhas de 10 m, esquadras presas na margem do rio.
- Desempenho: mais objetos nas células de `near()`/linha de visada; custo do A* extra (divide a cota `fpN` com `footPath`/`tmWalk`, então manobras M2/M4 podem ficar sem cota no mesmo quadro).
- Online: sala nova abre no mapa 7; quem tem página antiga recebe erro de mapa. Convidado não roda `hideStep`.
- Sebes contínuas cortam muita visada nos campos (bocage). Pode deixar artilharia, observação e tanques bem mais cegos.

## Como testar depois
1. `node server.js` e abrir `http://localhost:8080`. Assistir (IA × IA) em WW2 e moderno. Voar baixo e andar de soldado: ver as sebes, as margens do rio e a orla das matas; conferir que nada pisca ao cruzar 1 km e o FPS antes/depois.
2. No console: `genTerrain('ww2', 7).cv7` e `S.hws` depois de uns minutos (`go` > 0). `S.squads.filter(q => q.hw && q.tp === q.hw.way)` mostra quem anda escondido; o General (Tab) e `gask tmap o` mostram a ocultação com as moitas.
3. Pelo harness: `MAPV=7 node tests/<teste de manobra>.js` (ambush, approaches etc.) e comparar com `MAPV=6` para ver se M2/M4 mudaram.
4. A/B de partidas: `HIDE.on = 0` contra `1` (baixas da infantaria na aproximação, tempo de chegada).
5. Online: duas páginas novas na mesma sala (mapa 7); uma página antiga deve receber o erro de versão.
