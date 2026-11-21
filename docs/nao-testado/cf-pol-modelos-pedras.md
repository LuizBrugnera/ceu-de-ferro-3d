# cf-pol-modelos: pedras irregulares no lugar do dado (testado em parte)

## O que mudou

Nos mapas com pedras (versão 6 em diante), toda pedra era o mesmo dodecaedro regular: um dado de 12 faces largado na grama, variando só no tamanho e no giro.

- **Três pedras** (`ROCKS`, `rockGeo`). Cada uma é o mesmo dodecaedro com os cantos empurrados para dentro ou para fora, de 0,62 a 1,25 do raio, pelo dado da pedra e do canto.
- A parte de baixo é achatada pela metade, então a pedra assenta.
- Cada pedra volta para a caixa da antiga: a mesma largura, o topo na mesma altura e o pé 0,3 enterrado.
- Cada pedra do mapa usa uma das três pelo dado do seu id. São três malhas instanciadas no lugar de uma (`wo.rk`; `wo.rocks` continua sendo a primeira), e as três entram na lista das sombras.
- O mesmo número de cantos e faces: nenhum triângulo a mais.
- Só o visual: o tamanho, a altura e a cobertura de cada pedra na simulação não mudam.

## O que foi testado

- `node tests/rocks.js` (novo) roda `rockGeo` da página com um dodecaedro montado como o three.js monta o seu (cantos, faces, cada canto copiado em cada face):
  - toda cópia de um canto vai para o mesmo lugar, então nenhuma face se separa da vizinha nem deixa uma rachadura;
  - cada pedra tem a largura, o topo e o pé da antiga, centrada, com as mesmas 36 faces;
  - as três pedras diferem.
- No navegador, GPU de verdade, na demonstração (1 188 pedras): um grupo de pedras de perto e de longe, antes e depois (imagens na PR).
  - As pedras têm os mesmos 42 768 triângulos.
  - São 2 chamadas de desenho a mais no mapa todo.

## O que NÃO foi testado

- A pedra destruída (achatada) com a forma nova.
- As sombras de verdade (qualidade Alta) das três malhas.

## Como testar depois

1. Uma partida num mapa com pedras: olhar um grupo de pedras de perto.
2. Na qualidade Alta, ver a sombra das pedras.
