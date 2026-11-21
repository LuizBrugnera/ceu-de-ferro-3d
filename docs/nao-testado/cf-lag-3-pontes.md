# cf-lag-3-pontes: as pontes numa malha instanciada só (não testado além do teste focado e da medição)

Continuação da cf-lag (#170) e da cf-lag-2 (#180, #183, #190). Os números e o método ficam em `/home/luiz/secondmate/data/cf-lag-3/`.

## O que a medição mostrou
Na cena da #170 ("Assistir" IA × IA, moderna com três lados, qualidade Média, vista 3D, Chrome com a GPU), as chamadas de desenho iam de ~100 a ~1500 por quadro conforme a câmera automática. Desligando cada grupo da cena e contando: **548 chamadas vinham de um grupo de 604 caixas**, uma malha por caixa, todas com o mesmo material e a mesma geometria: os parapeitos, pilares e cabeceiras das pontes do mapa 11 (`br3Build`, W20). Era o maior grupo da cena, à frente dos veículos (362 chamadas para 47) e dos aviões (201 para 11).

## O que mudou (`Céu de Ferro 3D.html`)
- `br3Box` só anota a caixa (posição, tamanho, giro, inclinação e cor). `br3Flush`, no fim de `br3Build`, põe todas numa `InstancedMesh` só, com a cor por instância e o material branco (como o `gFort` das obras). A malha é reaproveitada enquanto couber, refeita maior quando as caixas passam da capacidade (o buffer da antiga liberado), e escondida sem ponte.
- `frustumCulled = false`: as instâncias estão espalhadas pelo mapa, e a esfera da geometria na origem cortaria todas. Fica uma chamada de desenho e ~7 mil triângulos a mais quando nenhuma ponte está à vista (medido: nada muda no custo da GPU nesse caso).
- `br3Mat` e `BR3.mats` saíram (uma cor por instância no lugar de um material por cor).

## Testado
- `tests/bridge-look.js` (meio segundo, three.js simulado): com pontes de pé, caídas, com pontão, com reconstrução e pontão livre (115 caixas, várias cores, uma peça inclinada), a malha instanciada leva exatamente as caixas que o construtor pediu, na mesma posição, tamanho, giro, inclinação e cor; uma malha só, material branco, sem corte pela esfera; reaproveitada, aumentada e escondida conforme as pontes mudam. Falha no main (lá há `new THREE.Mesh(` por caixa).
- `tests/road-look.js` passa (o `br3Init` ainda acha o chão e as estradas).
- Chrome com a GPU (RTX 4060, ANGLE gl-egl), mesmo quadro: capturas antes × depois idênticas nas pontes (a diferença de pixels que sobra é a folhagem pontilhada das árvores, que muda de um carregamento para outro também onde não há ponte).
- A/B intercalado na mesma página (a forma antiga refeita a partir das matrizes da nova, alternando quadro a quadro, 300 de cada), `render3d` em ms:

| câmera | chamadas antes → depois | CPU p10 / mediana antes | depois | GPU p10 / mediana antes | depois |
|---|---|---|---|---|---|
| rio de cima (várias pontes) | 1071 → 717 | 10,4 / 23,3 | 8,3 / 18,2 | 8,23 / 19,89 | 7,07 / 16,85 |
| uma ponte de perto | 1015 → 786 | 11,5 / 27,5 | 10,4 / 23,2 | 9,42 / 24,03 | 8,20 / 21,26 |
| a frente, sem ponte à vista | 242 → 245 | 5,2 / 10,7 | 4,9 / 10,4 | 2,90 / 8,51 | 2,97 / 8,51 |

## NÃO testado
- Qualidade Alta (sombras do sol): as pontes não projetavam sombra antes (não estão na lista de `castShadow`) e continuam sem projetar; não foi olhado num quadro com sombra.
- Uma ponte derrubada, reconstruída e um pontão sendo lançado numa partida real no navegador: o teste cobre essas caixas com three.js simulado, não numa partida.
- WebGL1 (sem instanciamento nativo, depende de `ANGLE_instanced_arrays`): o jogo já usa `InstancedMesh` para soldados, obras, árvores e grama, então não é um requisito novo.
- Online: a vista das pontes é local em cada máquina (`br3Scene` lê o estado da partida); nada no protocolo mudou.
