# cf-pol-modelos: pedras irregulares no lugar do dado (testado em parte)

## O que mudou

Nos mapas com pedras (versão 6 em diante), toda pedra era o mesmo dodecaedro regular: um dado de 12 faces largado na grama, variando só no tamanho e no giro.

- **Uma pedra irregular** (`ROCKS`, `rockGeo`): o mesmo dodecaedro com os cantos empurrados para dentro ou para fora, de 0,62 a 1,25 do raio, pelo dado de cada canto.
- A parte de baixo é achatada pela metade, então a pedra assenta.
- Cada pedra volta para a caixa da antiga: a mesma largura, o topo na mesma altura e o pé 0,3 enterrado.
- Cada pedra do mapa já tem o seu giro, a sua largura e a sua altura. Numa pedra irregular isso aparece, e elas deixam de ser iguais.
- O código aceita várias formas (`ROCKS.n`, uma malha instanciada por forma; `wo.rk`, e `wo.rocks` continua sendo a primeira), mas fica numa só:
  - com três, o FPS na GPU caiu em 5 de 6 pares de rodadas (média de 51,2 para 44,8), embora fossem só 2 chamadas de desenho a mais e nenhum triângulo;
  - com uma, o desenho é o mesmo da main: uma chamada, os mesmos triângulos e as mesmas instâncias.
- O mesmo número de cantos e faces: nenhum triângulo a mais.
- Só o visual: o tamanho, a altura e a cobertura de cada pedra na simulação não mudam.

## O que foi testado

- `node tests/rocks.js` (novo) roda `rockGeo` da página com um dodecaedro montado como o three.js monta o seu (cantos, faces, cada canto copiado em cada face):
  - toda cópia de um canto vai para o mesmo lugar, então nenhuma face se separa da vizinha nem deixa uma rachadura;
  - a pedra tem a largura, o topo e o pé da antiga, centrada, com as mesmas 36 faces;
  - se houver mais de uma forma, elas diferem.
- No navegador, GPU de verdade, na demonstração (1 188 pedras): um grupo de pedras de perto e de longe, antes e depois (imagens na PR).
  - As pedras têm os mesmos 42 768 triângulos e a mesma chamada de desenho.
- FPS na GPU de verdade, cena fixa sobre a cidade, 3 trechos de 6 s com as pedras e 3 sem, alternados, 2 vezes cada build:
  - com as pedras: main 46,8 / 54,6 / 46,1 / 52,6 / 46,7 / 54,6 fps (média 50,2); aqui 49,5 / 48,5 / 51,9 / 44,6 / 47,1 / 50,7 fps (média 48,7);
  - sem as pedras, os trechos variam de 38 a 58 fps nos dois.
  - A diferença fica no ruído da cena.

## O que NÃO foi testado

- A pedra destruída (achatada) com a forma nova.
- As sombras de verdade (qualidade Alta) da pedra nova.

## Como testar depois

1. Uma partida num mapa com pedras: olhar um grupo de pedras de perto.
2. Na qualidade Alta, ver a sombra das pedras.
