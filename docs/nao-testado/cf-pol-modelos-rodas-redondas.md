# cf-pol-modelos: rodas e canos redondos nos veículos feitos à mão (testado em parte)

## O que mudou

Nos veículos feitos à mão, os que o pack não cobre: a artilharia, as antiaéreas, as rebocadas, os blindados de rodas e os de apoio.

- **Rodas do kit** (`vkWheels`, `vkTracks`; artilharia, antiaéreas e rebocadas):
  - os pneus têm 14 lados (eram 10) e os cubos 10 (eram 6, um hexágono que aparecia de longe);
  - as rodas de apoio, as rodas motrizes e as tensoras das lagartas têm 10 lados (eram 8), com cubo de 8 (eram 6).
- **Sombreamento liso no kit** (`vkit().done`): as peças redondas (rodas, canos, tubos de foguete, tambores) ficam lisas em vez de facetadas.
  - Não custa nada: as caixas, os prismas e os discos têm a normal da própria face, então continuam iguais.
  - O destroço usa o mesmo material, só que escurecido.
- **Blindados de rodas e veículos de apoio sem modelo do pack** (o LAV-25, os BTR, o Sd.Kfz. 251, o M88, a Shilka...):
  - o cubo que gira passa a ter 10 lados (eram 6);
  - o pneu e as outras peças redondas escuras ficam lisos.
- As rodas giram como antes: o shader de giro (`WSPIN`) não muda, e um pneu liso girado no próprio eixo tem a mesma luz.
- Só o visual: física, caixas de acerto, peças de dano e rede não mudam.

## O que foi testado

- `wheel-spin`, `art-models`, `aa-models`, `models` e `gfx` passam como antes: toda peça redonda no chão continua uma roda que gira no próprio eixo.
- Nenhuma peça do kit, nem as de `buildTrn` que usam o mesmo material escuro, é geometria feita à mão sem normais (o sombreamento liso deixaria uma peça assim preta). O kit só usa caixa, cilindro, disco, plano e extrusão do three.js; `buildTrn` só usa caixa, cilindro e extrusão.
- No navegador: a galeria do hangar da artilharia, das antiaéreas e dos transportes, antes e depois (imagens na PR).
- Custo, medido antes × depois:
  - **GPU de verdade** (Intel UHD 770), cena fixa sobre a cidade na batalha de demonstração, 6 rodadas de 15 s de cada, alternadas (3 numa ordem, 3 na outra):
    - antes: 49,8 / 47,1 / 54,0 / 50,6 / 43,5 / 41,6 fps (média 47,8);
    - depois: 41,4 / 47,2 / 46,8 / 51,0 / 45,6 / 49,5 fps (média 46,9).
    - O quadro mediano foi de 16,7 ms em todas. Em cada ordem, quem rodou primeiro saiu na frente; a diferença fica no ruído da cena.
  - **GPU de verdade**, cena só com 52 veículos do kit (4 de cada um dos 13 de artilharia e antiaérea): as mesmas 696 chamadas; 9,3 / 11,7 ms antes e 7,0 / 12,7 ms depois (com 16 lados no pneu; ficou em 14).
  - **SwiftShader** (processador, sem GPU), 26 veículos do kit: as mesmas 390 chamadas; triângulos de 28 268 para 33 092; quadro de 49,1 / 50,4 ms para 54,5 / 56,1 ms. Sem GPU, uma cena só desses veículos fica uns 5 ms mais lenta. Numa batalha (cerca de 630 mil triângulos à vista), esses veículos são poucos.
  - Por veículo do kit: de +128 (técnica com Type 63, ZPU-4) a +256 triângulos (NASAMS, Pantsir); +160 na Shilka; de +32 a +56 num blindado sem modelo do pack.

## O que NÃO foi testado

- As rodas girando numa partida, de perto, com o pneu liso.
- O destroço de cada veículo do kit.

## Como testar depois

1. `npm start`, hangar, abas Artilharia, Antiaérea e Transporte: cubos redondos, canos e tubos lisos.
2. Numa partida, dirigir um BM-21 ou um LAV-25 com a câmera de fora, perto das rodas.
