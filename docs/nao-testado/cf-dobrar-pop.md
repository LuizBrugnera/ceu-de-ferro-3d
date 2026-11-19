# cf-dobrar-pop: o dobro de infantaria e de veículos de solo da IA (não testado)

## O que mudou
- `GP.pop`: soldados 120 → 240 e veículos 24 → 48 por lado; aeronaves seguem em 8. `GP.cap` (teto geral da IA com economia, vira `IAI.cap`) 240 → 480; dele saem `MAXM` (malha de soldados), os limites de despacho/esquadras (`IAI.cap`, `TCOL.cap`) e `sideMen`.
- Plano de produção: o que o general quer em campo (`GP.mix`, números absolutos) agora é multiplicado por `GP.scale` = 2 para veículos e esquadras (aeronaves ficam), e o reforço por blindados inimigos conhecidos também. Sem isso o teto dobrava mas a economia continuava pedindo o mesmo. `GP.max` (máximo de `pplan`) 20 → 40.
- README atualizado (teto 240/48/8). MCP.md não citava os números. O servidor já fatia `ai` em pacotes de 64 (`AICAP`), então não precisou mudar.
- O medidor de quadro (F0/W2, `GP.meter`, `popK`) não foi mexido: ainda corta 10% a cada 10 s até metade (`min .5`) sob carga real.

## O que NÃO foi testado
Nenhuma suíte, A/B ou baseline (regra do capitão). Só a medição abaixo e que o servidor sobe. Nota: `tests/harness.js` em `main` já falha ao carregar (`aarShow is not defined`, porque a função fica depois do marcador de fim da simulação); medi com uma cópia da página com um stub. Os testes que fixam 120/24 (por ex. `tests/mcp-general.js`, `populationBudget.men === 120`, e outros ligados a `IAI.cap`/`GP.pop`) provavelmente precisam de ajuste.

## Medição (watch IA × IA, era moderna, semente 5, mapa v7, no harness do Node, 90 s simulados)
| t | soldados em campo | unidades | popK | média IA/quadro | pior |
|---|---|---|---|---|---|
| 30 s | 201 | 26 | 0,8 | 50,6 ms | 217 ms |
| 60 s | 222 | 30 | 0,6 | 78,0 ms | 591 ms |
| 90 s | 233 | 36 | 0,5 | 64,8 ms | 337 ms |
General: 6-10 ms. A máquina estava ocupada e o harness no Node não é o navegador, então os ms absolutos não valem como orçamento (4 ms); o que vale: o medidor derrubou `popK` a 0,5 (o piso) em 60 s, ou seja, com a população dobrada a IA estoura o orçamento e o teto efetivo cai até aproximadamente o antigo (120/24). Ponto quente não otimizado (só anotado): a IA de soldados (visão/percepção) e o planejador do general crescem com o número de soldados.

## Riscos
- Desempenho (o principal): em máquina fraca o jogo vai viver com `popK` baixo; o piso 0,5 é o que impede travar. Se quiser o dobro de verdade, é preciso otimizar a IA de soldados.
- Rede: mais soldados da IA por quadro de `ai` (pacotes de 64, `maxPayload` 64 KB) e mais banda para os convidados (`tests/online.js` imprime o custo por teto).
- A economia (`ECO.cap`) pode limitar a produção de veículos antes do teto novo.
- Desenho: mais soldados e malha instanciada (`MAXM`) = mais memória gráfica.

## Como testar depois
- Servidor: `node server.js` e abrir a página; partida IA × IA (modo watch) moderna e WW2 por 5 min, conferindo o log do general (números do medidor) e a aba Produção (campo/desejado até 240/48).
- `node tests/frame-budget.js`, `node tests/mcp-general.js`, `node tests/eco.js`, `node tests/online.js` (ajustar os 120/24 fixos).
- Partida online com dois humanos: banda por convidado, sem soldados parados (#35).
