# cf-pol-modelos: chaminés redondas, castelete da mina com travas e roda, monte de rejeito; a roda não flutua mais (testado em parte)

## O que mudou

Nas três obras da economia (`buildEco`): a usina, a mina e a fábrica, que eram só caixas (`ECOL`).

- **Chaminés** (usina e fábrica): redondas, mais finas em cima, lisas, com uma borda escura na boca.
  - Antes eram postes quadrados.
  - A chaminé e a borda são uma malha só, então continua uma chamada de desenho por chaminé.
- **Castelete da mina:**
  - os quatro postes ganham duas cruzes em cada face;
  - postes e cruzes viram uma malha só, então são 3 chamadas de desenho a menos por mina.
  - No alto, uma roda de verdade com aro, cubo e seis raios, em pé sobre duas pernas, no lugar da placa escura. A roda e as pernas também são uma malha só.
- **Conserto: a roda da mina flutuava.** Ela aparecia com as peças de "meia obra" (`U.late`, a partir de 50%), mas o deque onde fica só aparece a partir de 85% e some com a obra destruída. Assim, a placa da roda ficava no ar sobre os postes nus de 50% a 85%, e sobre o chão vazio da mina destruída. Isso já acontecia na main. Agora a roda entra e sai com o deque (`U.roof`).
- **Monte de rejeito** da mina: um monte baixo e comprido (cone de 8 lados achatado) no lugar da laje.
- Nada muda no jogo: o tamanho e a caixa de cada obra, a subida com a construção (`U.rise`, `U.late`, `U.roof`, `U.mast`), o escurecer com o dano e a casa de fachada do lote da cidade (`U.F`) continuam iguais.

## O que foi testado

- `node tests/eco-looks.js` (novo) roda `buildEco` e `lookEco` da página contra um three.js que só registra as peças:
  - em cada etapa da obra (5%, 30%, 60%, 80%, 90%, pronta) e destruída, nada da mina aparece acima do castelete sem o deque embaixo;
  - o castelete tem 4 postes e 2 cruzes em cada face;
  - toda trava fica dentro do castelete e corre ao longo da própria face.
  - Na main ele falha (a 60%, a 80% e destruída) e aqui passa. Ele também pega o erro do protótipo: as cruzes de duas faces atravessadas, uma saindo do castelete.
- No navegador: as três obras e uma base de suprimento de dois ângulos, prontas, a 60% e destruídas, antes e depois (imagens na PR).
  - Prontas: de 52 para 49 chamadas de desenho e de 23 059 para 23 811 triângulos.
  - Destruídas: a roda da main flutuando sobre o chão da mina; aqui, nada no ar.
- `models` e `gfx` passam.

## O que NÃO foi testado

- As obras subindo e destruídas numa partida de verdade (no navegador foram vistas fora da partida, com a mesma `lookEco`).
- A obra no lote da cidade vista pelo lado que ainda não a identificou (a casa de fachada não mudou).

## Como testar depois

1. Uma partida com economia: construir uma usina, uma mina e uma fábrica e olhar de perto enquanto sobem.
2. Destruir uma e ver o destroço.
