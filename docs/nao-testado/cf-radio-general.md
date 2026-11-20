# cf-radio-general: o general fica sem rede e não expande a zona de rádio (não testado)

Pedido do capitão: "general sempre ficando sem rede e sem expandir a zona de radio".

Entregue pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado").

## O que foi medido antes de corrigir (diagnóstico)

Uma partida IA × IA de 4 min (moderna, 2 lados, mapa 11, economia, logística e recuperação ligadas, semente 7), com a sonda que fica fora do repositório (`/home/luiz/firstmate/data/cf-radio-general/probe.js` e `insp.js`):

- o lado 0 começa com 6 esquadras fora da rede e chega a 8 aos 240 s. O lado 1 fica todo dentro da rede (a base dele cobre a frente);
- o general do lado 0 ordena uma antena aos 2 s. Aos 240 s ela **ainda não começou**: nenhuma antena nos dois lados e nenhum veículo-rádio (só o QG e os operadores são nós);
- o construtor escolhido era uma esquadra de estrada a **2,7 km** da antena (3,1 km de caminho), andando a pé (uns 3 m/s).

## A causa

- **Gatilho:** a brecha fica longe de qualquer esquadra livre, e o construtor anda quilômetros.
- **Causa:** a ordem de antena tinha prazo fixo de 420 s (`CNR.T`), menor que a caminhada do construtor (uns 1000 s). O general desistia, o construtor era devolvido e voltava andando para o lugar dele (`opEnd`), e 5 s depois o general ordenava a mesma antena de novo, para sempre. Nenhuma antena subia.
- **O que mascara:** sem veículo-rádio. Com a economia, o diretor só põe o veículo-rádio em campo quando a produção já fez um (`rqAI` → `ecoUse('rad')`), então a cobertura móvel quase nunca existe no começo. O pedido de rádio sem veículo mandava um operador a pé, às vezes a mais de 5 km. E nada disso aparecia no diário: a recusa do pedido era silenciosa.
- **Sintoma:** as esquadras ficam "SEM REDE", e a brecha mostra "ANTENA A CAMINHO" por minutos, sem nunca fechar.

## O que mudou (`Céu de Ferro 3D.html`, bloco CNR)

- `cnFix`: o general da IA escolhe ele mesmo o construtor (`cnWho`): a esquadra livre mais perto do lugar seguro, a engenharia quando não está mais de 600 m (`CNR.engX`) mais longe, e nunca uma que desistiu de uma antena nos últimos 300 s (`CNR.ban`, `C.cnBan`). Depois escolhe o lugar de novo, pesando a caminhada do construtor (`cnSite(..., from)`, peso `CNR.wk`).
- Com o construtor a até 1,8 km de caminhada (`CNR.walk`, a distância reta × `CNR.way` 1,3), ordena a antena com `ids: [construtor]`. Mais longe, manda antes o veículo-rádio livre. Sem ele, manda quem anda menos entre a esquadra com operador mais perto e o construtor. Se nem isso der, ordena a antena mesmo assim, com o prazo da caminhada.
- Prazo: a antena ordenada pela IA desiste depois de `CNR.T + caminhada × CGN.walkK` (antes eram 420 s fixos). O operador tem a mesma regra (`CNR.T + CNR.hold + caminhada × walkK`). A ordem `fort radio` aceita o campo `walk` (só a IA o passa) e o `req radio` também.
- Diário (RÁDIO): "antena de rádio ordenada …, Esquadra X a N km de caminhada". Quando a antena desiste, diz quantos segundos passaram e a que distância ainda estavam os construtores ou quanto da obra estava feito. Quando os construtores não conseguem erguê-la, também avisa. E quando a brecha fica aberta, diz o motivo: sem construtor livre, antena recusada (limite, recursos, …), sem veículo-rádio ou operador.
- Visão de General: cada brecha leva uma nota (`V.cn.gap[i][5]`) ao lado do "ANTENA A CAMINHO": "CONSTRUTORES A 2,7 KM", "EM OBRA · 40%", "A 1,2 KM" (veículo/operador), "SEM CONSTRUTOR LIVRE", "LIMITE DE ANTENAS", "SEM RECURSOS PARA A ANTENA", "SEM LUGAR SEGURO". O `get_state` do MCP traz `note` em `commandNet.gaps`.
- `tests/radio-general.js` (novo, **nunca executado**, fora do `tests/all.sh`) é a checagem focada do bug.
- README (parágrafo "Antenas de rádio e brechas na rede") e MCP.md.

## O que foi verificado

Só a fumaça (uns minutos):

- o script da página compila;
- no harness, partidas IA × IA de 12 a 40 s na era moderna com 2 e com 3 lados, e em 1944 com 2 lados, rodam sem erro e sem NaN. Nelas o general ordena a antena com construtor e caminhada, o diário traz a linha nova e a nota aparece no `get_state`: "CONSTRUTORES A 2,7 KM" na moderna, "CONSTRUTORES A 0,1 KM" em 1944, e no lado 2 dos 3 lados;
- o servidor sobe e devolve a página (200).

## O que NÃO foi testado

- Se a antena sai mesmo depois da caminhada longa, numa partida inteira (uns 17 min de jogo para 3 km a pé). Não rodei nenhuma partida até a antena ficar pronta depois da correção.
- `tests/radio-general.js` (escrito, nunca rodado) e as suítes existentes: `tests/radio.js` (o caso "the AI general orders a relay … within" agora nomeia o construtor: o texto do diário mudou, mas a regex `antena de rádio ordenada` continua casando), `comms`, `forts`, `afp`, `mcp-general`.
- O desenho da nota na Visão de General (tamanho, sobreposição com o rótulo da brecha), no navegador.
- Online: o convidado recebe a nota pela mensagem `gen` (um texto curto a mais por brecha, até 3 brechas). O limite de 8192 bytes não foi medido de novo.
- Uma pessoa na área Defesa com a IA no Apoio: a ordem `fort` é da área Defesa, então a antena da IA é recusada (`ctl`). Agora o diário mostra a recusa, e o general cai no veículo-rádio ou no operador. O comportamento em si não mudou.

## Riscos

- O construtor pode ser uma esquadra fora da rede, da própria brecha (ela recebe a ordem com 20 a 60 s de atraso) ou uma esquadra de estrada ou de guarda que sai do posto por até ~30 min.
- Com o prazo longo, uma antena ordenada segura um dos 2 reforços (`CNR.max`) por muito tempo. Outra brecha espera.
- O operador mandado a pé ainda pode andar longe, quando não há construtor mais perto.
- O veículo-rádio continua dependendo da produção. Se a economia nunca fizer um, a cobertura móvel não aparece (não mexi nisso).
- `C.cnBan` é um objeto simples no comandante (para não quebrar quem serializa o comandante, se alguém fizer isso).

## Como testar depois

- `node tests/radio-general.js` (sandbox, rápido): a antena sai com o construtor longe, sem "não ficou pronta a tempo", a nota da visão traz "CONSTRUTORES A" ou "EM OBRA". Se passar, colocar no `tests/all.sh` e no `tests/README.md`.
- `node tests/radio.js` (`SECS=240`), `node tests/comms.js`, `node tests/forts.js`, `node tests/afp.js`, `node tests/mcp-general.js`, `node tests/frame-budget.js`, `node tests/sides3-start.js`.
- Partida longa IA × IA (moderna e 1944, 2 e 3 lados, mapa 11, economia): `REPO=$PWD node /home/luiz/firstmate/data/cf-radio-general/probe.js modern 2 1500`. A cada minuto ela mostra, por lado, as esquadras na rede e fora, as brechas, os reforços a caminho e as antenas. Esperado: o lado com brecha ergue ≥ 1 antena, e as esquadras fora da rede caem.
- No navegador: `npm start`, Assistir (IA × IA), abrir a Visão de General do lado com brechas. Ver o anel âmbar com "ANTENA A CAMINHO · CONSTRUTORES A X KM" e depois "EM OBRA", a antena aparecendo, e as linhas no diário (RÁDIO).
