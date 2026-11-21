# cf-pol-modelos: veículos do pack mais leves de longe (testado em parte)

## O que mudou

Os veículos do pack são pesados: o caminhão M939, que também desenha o Opel Blitz, o GMC, o Ural e o ZIL, tem ~10 mil triângulos, o Tiger ~11 mil, e um comboio deles longe custava tanto quanto perto. Agora (`PLOD`, `packLod`, `packLodMerge`):

- O `packSkin` guardava e jogava fora o corpo feito à mão (o de antes do pack). Agora guarda esse corpo escondido, juntado numa malha por nó e por cor (`packLodMerge`).
- Além de 450 m do olho, esse corpo é desenhado no lugar do modelo do pack: uns 300 triângulos onde o do pack tinha milhares. Abaixo de 400 m o pack volta (a diferença evita trocar a cada passo).
- A distância conta o zoom: na luneta do atirador (até 36×) ou de um fuzil, o que está longe conta como perto na mesma proporção, e o modelo do pack fica.
- A torre e o canhão vão para o lugar que cada corpo tinha.
- O dano continua escurecendo o modelo do pack como antes. O corpo de longe não está nas peças de dano: de longe não escurece por peça.

## O que foi testado

Cena com 40 veículos do pack (Ural, GMC, HEMTT, HMMWV, técnica, Abrams, Tiger, T-72, T-34, Sherman):

| | triângulos | chamadas | ms (SwiftShader) |
|---|---|---|---|
| longe (~670 m, campo de 55°), antes | 263 008 | 260 | 347 |
| longe, depois | 11 360 | 240 | 31 |
| perto (~120 m), antes | 250 866 | 250 | 316 |
| perto, depois | 250 866 | 250 | 286 (ruído) |

- Uma primeira versão sem juntar o corpo de longe custava 568 chamadas.
- Na demonstração, vista de ~600 m antes e depois: os veículos são poucos pixels e a troca não aparece (imagens na PR).
- Depois do merge com a `main`: sintaxe e testes de modelos.

## O que NÃO foi testado

- A troca vista chegando perto (de 450 m para 400 m) numa partida.
- O destroço de longe: troca igual, mas fica com o corpo feito à mão escuro.
- O convidado online (cada cliente decide pela sua câmera).
