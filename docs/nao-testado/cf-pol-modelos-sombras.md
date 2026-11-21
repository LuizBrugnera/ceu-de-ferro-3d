# cf-pol-modelos: sombra de contato sob os veículos (testado em parte)

## O que mudou

Fora do Alta (o único nível com a sombra de verdade do sol), os veículos não tinham sombra nenhuma e pareciam flutuar sobre o chão. Só os aviões tinham uma mancha.

Agora (`CSHAD`, `cshadMesh`, um embrulho do `syncScene`):

- cada veículo e cada destroço tem uma mancha escura e macia no chão, embaixo;
- a mancha tem o comprimento e a largura do veículo (`d.env`), um pouco maior (`CSHAD.grow`), virada para a frente dele e deitada na inclinação do chão (as alturas da frente, de trás e dos lados);
- todas as manchas são uma malha instanciada só: uma chamada de desenho, 2 triângulos por veículo, só até 900 m do olho;
- no Alta não aparece (lá já há a sombra de verdade);
- soldados e civis até 160 m do olho ganham uma mancha pequena:
  - redonda em pé;
  - comprida e puxada para trás deitado ou caído, onde o corpo fica;
  - nenhuma embarcado ou dentro da trincheira (mais de 0,6 m abaixo do chão);
- a mancha do veículo do jogador pisca junto com ele na proteção de entrada.

## O que foi testado

No navegador:

- numa partida no M1A2 com a mesma câmera, antes × depois (imagem na PR). Uma primeira versão, do tamanho do veículo, ficava quase toda escondida embaixo do casco; aumentei o tamanho e o miolo escuro;
- soldados em pé, deitados e na trincheira junto de obras, na demonstração (imagem).

## Achado: todo veículo fica 1,5 m acima do chão (de antes desta frente)

Medido na demonstração: em todo veículo terrestre (tanque, caminhão, carro, artilharia, antiaérea, blindado), o ponto mais baixo do modelo fica exatamente 1,5 m acima do chão sob ele.

A causa vem do primeiro commit e está na simulação inteira, não só no desenho:

- a simulação guarda a altura do veículo no chão (`u.y = hgt(x, z)`) e desenha o modelo em `u.y + 1.5`;
- as caixas de acerto usam esse mesmo +1,5 (`o.y + 1.5 + b[1]`), e os assentos, a linha de visada e a altura do tiro também (`d.mh = 1.5 + …`).

Baixar só o modelo poria os tiros e os acertos 1,5 m fora dele, então ficou como está.

De cima e de trás, que é como se joga, não se nota. De lado e baixo, como na imagem da salva do BM-21 na PR, dá para ver o vão sob as rodas, e esta sombra no chão deixa o vão mais visível. Consertar pede mexer na simulação (caixas de acerto, assentos, alturas de tiro) e fica para quem decidir isso.

## O que NÃO foi testado

- Morro íngreme, ponte e água: a mancha deita na inclinação medida em quatro pontos e pode furar o chão numa crista.
- O helicóptero pousado não ganha mancha.
- Não medi o tempo de quadro separado: é uma malha de 2 triângulos por veículo.
