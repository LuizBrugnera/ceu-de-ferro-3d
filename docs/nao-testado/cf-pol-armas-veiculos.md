# cf-pol-armas: o som dos veículos de terra (testado por suíte e no navegador, não de ouvido)

## O que mudou

Antes, o tanque, o carro e o caminhão soavam como um único dente-de-serra de 36 a 100 Hz, que subia reto com a velocidade. Agora (`sndVeh`, tabela `SND.veh`):

- **Motor pelas marchas:** 4 marchas, cada uma uma faixa da velocidade máxima. A rotação sobe dentro da marcha e cai pela metade na troca: 38 a 78 Hz, um dente-de-serra e uma onda quadrada uma oitava abaixo, por um passa-baixa que abre com a rotação. Mais alto acelerando do que deixando o veículo correr.
- **Esteiras:** um casco de esteira faz um batido por elo, 2,2 por segundo por m/s, no máximo 26 por segundo. O de rodas não faz.
- **Servo da torre:** um zumbido que sobe de 170 a 420 Hz e ganha volume com a velocidade com que a torre gira, quieto quando ela para.
- **Chão:** o ruído de rolagem (o mesmo ruído de antes) cresce com a velocidade.
- A pé (o soldado tem `kind` 'inf'), fora do veículo ou morto: o motor e o servo ficam quietos.

## Testado

- `tests/som.js`, a parte "a ground vehicle": as 3 trocas de marcha da parada à velocidade máxima, o acelerador, os batidos a 6 m/s (13 por segundo), nenhum parado e nenhum no caminhão, o servo cheio na velocidade máxima da torre e quieto parado, e tudo quieto a pé. Essa última checagem achou um erro meu antes do PR: o soldado também tem `kind`, e o motor continuava ligado depois de descer.
- Navegador (Chromium headless, M1A2 Abrams, 50 s acelerando e 20 s com a torre balançando): a rotação subiu de 38 a 76,5 Hz, caiu para 60,9 na troca e subiu de novo. 5 batidos de esteira (a 0,2 quadro/s cada quadro dá no máximo um), o servo chegou ao volume cheio, nenhum erro no console. Imagem em `/home/luiz/firstmate/data/cf-pol-armas/proof/veic/`.

## Não testado

- De ouvido: o timbre de cada motor (a turbina do Abrams soa como um diesel), o volume contra os tiros e se o servo incomoda.
- Os veículos dos outros (só o do jogador tem motor; a IA continua muda).
- Antiaérea, artilharia e transporte: entram pelo mesmo caminho, mas só o tanque foi rodado.

## Como testar

`npm start`, entrar de tanque (Abrams, Tiger, T-90), acelerar até o máximo, ouvir as trocas e as esteiras, girar a torre com o mouse. Entrar de caminhão ou de carro e conferir que não há batido de esteira. Descer (tripulação) e conferir que o motor para.
