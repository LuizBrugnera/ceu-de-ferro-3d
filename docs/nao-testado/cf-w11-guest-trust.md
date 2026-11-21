# cf-w11-guest-trust: o anfitrião confere as caixas devolvidas por um convidado (não testado)

Da revisão W11 de logística: online, o convidado mandava `lsp` com `k` 2/3 ("devolvi n caixas") e o anfitrião somava sem conferir. Um convidado trapaceiro podia mandar `lsp {k:2, id:<base>, n:20}` a cada 300 ms e encher os depósitos do lado dele no PvP.

## O que mudou

Tudo em `Céu de Ferro 3D.html`, no bloco de logística (`LG`, perto de `Net.rx.lsp`). Servidor e protocolo iguais.

- A única devolução honesta de caixas de um convidado é o reembolso da requisição: transporte requisitado com caixas de um depósito, deixado inteiro (hp ≥ `RQ.hp`) num depósito (`alight`), devolve `floor(custo × RQ.refund)` caixas, uma vez.
- O anfitrião agora guarda `Net.lgRq` (por jogador): quando concede a requisição de um convidado (`rqGrant` com logística) anota o custo em caixas (0 se saiu da base principal, que não cobra caixas).
- Quando o convidado sai do veículo (mensagem `crew` para `inf`), o anfitrião anota onde ficou o casco e confere se estava inteiro (hp do `st` contra `max × RQ.hp`) e se a posição informada bate com o fantasma (até 30 m). Veículo destruído, posição estranha ou hp baixo: o registro é apagado.
- `lsp` com `k` 2/3 só vale (`lgBack`) se: há registro com custo > 0, o convidado já saiu do casco, `n` é exatamente `floor(custo × RQ.refund)` e o nó do `lsp` é o depósito onde o casco ficou (`lgDepot`). O registro é consumido na primeira tentativa (vale ou não): só um reembolso por requisição.
- Trocar de corpo por outro caminho (`swap` sem `rq`) apaga o registro; fim da logística limpa tudo.
- Retiradas (`k` 0/1) continuam como antes (só prejudicam o próprio lado; fora do escopo).

## Testado em bbd5085: corrigido (tarefa cf-testar-mundo)

`tests/logistics-online.js`, pelo servidor de verdade (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/120): o convidado requisita um caminhão numa base de suprimento, e o anfitrião tira 5 caixas e anota (`Net.lgRq`).
- **Bug corrigido:** o reembolso honesto nunca chegava. O `crew` (inf) acaba o fantasma do veículo, o do soldado só vem no estado seguinte, e o `lsp` que vem logo atrás era descartado no `Net.rx.lsp` por falta de fantasma (sem lado). Agora o anfitrião guarda o lado na requisição.
- Volta inteiro e sai na base: +2 no anfitrião, uma vez.
- Recusados: o mesmo `lsp` de novo; `lsp {k: 2, n: 20}` repetido sem requisição; o reembolso de dentro do caminhão; o caminhão deixado com metade do hp.
- `logistics-relay` passa. Em `logistics`, uma falha também no main e fora deste doc (caixas tomadas do caminhão parado por um soldado inimigo).

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok
- `tests/logistics-online.js` pelo servidor de verdade (HOST=127.0.0.1, sozinho): passa inteiro (15 ok), com a seção W11: o reembolso honesto chega uma vez; o mesmo `lsp` de novo é recusado; `lsp {k: 2, n: 20}` repetido sem requisição não muda a base; o caminhão deixado com metade do casco não devolve nada. A troca de anfitrião leva os estoques ao novo anfitrião.
- `tests/logistics.js`: veja o RESULTADO-B.

## O que NÃO foi testado

- Ponto de captura como depósito (`k` 3).
- Troca de anfitrião no meio de uma requisição.
- Dois navegadores de verdade (os passos 1 a 6 abaixo à mão).

## Riscos

- Se o fantasma do convidado não for o casco (`g.occ`) quando chega o `crew`, ou o `g.max` divergir do hp mandado, um reembolso honesto é recusado (perda pequena: metade do custo em caixas, só online).
- Servidor sem `crew` (antigo): não há mensagem de saída, então todo reembolso de convidado é recusado.
- Se o convidado calcula o depósito da requisição diferente do anfitrião (borda do raio), o anfitrião anota custo 0 e recusa o reembolso.
- A posição do casco ainda vem do convidado (como todo o estado dele); a conferência é contra o fantasma, não contra a física do anfitrião.

## Como testar depois

1. `npm ci && PORT=8080 node server.js`; duas abas em `http://localhost:8080/`, conquista moderna, economia/logística ligadas, uma anfitriã e uma convidada no mesmo lado.
2. Convidada: a pé numa base de suprimento pronta, requisitar caminhão (custa `LG.cost.truck` = 5 caixas), andar um pouco, voltar e sair (F) com o caminhão inteiro. Esperado: texto "Veículo devolvido: +2 caixas" e, na anfitriã, a base com +2 (Visão de General → logística, ou `lgOf(t,'b'+id).lc` no console).
3. Mesma coisa saindo fora de um depósito e depois voltando a ele: esperado o reembolso na segunda saída.
4. Trapaça, no console da convidada: `Net.send('lsp', {k:2, id:<id da base>, n:20})` várias vezes. Esperado: o `lc` da base na anfitriã não muda.
5. Depois de um reembolso válido, repetir o mesmo `lsp` com o n certo: esperado recusado.
6. Caminhão danificado (hp < 80%) ou destruído: sem reembolso nos dois lados.
7. Regressão: `node tests/logistics-online.js` e `node tests/logistics.js`.
