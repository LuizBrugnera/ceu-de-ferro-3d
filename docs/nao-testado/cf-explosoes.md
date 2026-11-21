# cf-explosoes — explosões pelo tamanho, cogumelo nas bombas grandes, marcas no solo (parte testada)

O que é: só visual. `blastFx` chama `fx.blast(x, y, z, r)`; o módulo `XFX` da página desenha clarão, bola de fogo, terra, anel de poeira, onda de choque, fumaça, marca, fogo e cogumelo pela classe do raio (`XFX.cut` 12/26/55/100 m).

## Testado em cf-pol-testes-a (Chromium headless com SwiftShader, 1280 px)
- "Assistir" em Hoje, câmera livre a 40 m sobre uma encosta, `blastFx` de 11, 36 e 135 m a 150, 400 e 1200 m (o comando do "Como testar"): sem erro (`XFX.err` 0 antes e depois, nenhum erro de página). Aos 0,5 s de batalha: bola de fogo das duas maiores, a esfera da onda de choque em volta de cada uma (classe 2+), fumaça escura da granada (`vis-blast-1s.png`); a 1,1 s: a bola de fogo grande subindo com o começo do cogumelo, fumaça preta sobre a vila, a poeira da granada (`vis-blast-later.png`). Arquivos em `ag3/proof` da tarefa.
- A qualidade gráfica nessa máquina ficou em Baixa (`XFX.lv` 0, sem luz pontual).

## Ainda não testado
- O cogumelo formado (sobe e abre aos 10-130 s) e a marca no chão depois que a fumaça passa: no navegador sem GPU o relógio da batalha anda ~0,05 × o real, então não deu para chegar lá nos 5 min que a trava de memória da tarefa permite. Como: num navegador com GPU, o mesmo comando e esperar 15 s e 90 s.
- A esfera da onda de choque aparece grande e bem visível (um domo claro em volta da vila com a de 135 m): conferir num navegador com GPU se não está forte demais (`XFX` alfa/raio da `shock`).
- 1920 px, noite e neblina; Média e Alta (pools maiores, `PointLight`); salva de Grad e tapete de bombardeiro (relógio #118, `XFX.A.n`/`XFX.B.n`, FPS); online (o convidado desenha pelos mesmos `blastFx`); veículo abaixo de 50% e 25%, destroço e prédio pegando fogo; explosão na água (spray, sem marca) e no ar (sem marca nem anel).

## Riscos (seguem valendo)
- `PointLight` (1 em Média, 2 em Alta) entram em todos os shaders iluminados: recompilação ao montar a cena e custo de fragmento.
- Marca grande chama `hgt` 81 vezes; muitas marcas num quadro podem dar pico. Partículas sem ordenação podem piscar.
- `XFX.on = 0` volta aos puffs antigos.
