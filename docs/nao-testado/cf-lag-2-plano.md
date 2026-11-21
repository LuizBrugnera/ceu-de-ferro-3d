# cf-lag-2-plano: o custo do plano do general sem mudar as decisões (não testado além do teste focado, da impressão digital e da medição)

Continuação da cf-lag (#170). Recomendação 3 dela: um orçamento de tempo para o `fortPlan` e suas camadas, espalhando o custo por vários passos sem mudar o resultado. Os números e o método ficam em `/home/luiz/secondmate/data/cf-lag-2/`.

## O que a medição mostrou
O plano já é uma tarefa em pedaços (`planJob`, um pedaço por passo a 60 passos por segundo, `SLICE.plan`), e o `fortPlan` com as sete camadas (`radGuard`, `aidPlan`, `cnFix`, `afpPlan`, `bmrKitSup`, `enpPlan`) é um desses pedaços. No regime da batalha (60 a 90 s) o plano inteiro é só 1,2–1,6% da CPU do passo. O que trava a tela são pedaços isolados:
- **Os estudos do terreno feitos uma vez, dentro dos primeiros planos da batalha**: as células do caminho a pé (`fpCells`: 2,7 s de relógio sob a carga da máquina, um terço do custo do plano nos primeiros 8 s) e os lugares de emboscada da rede (`blkSites`, 0,7 s). Cada um é feito uma vez por terreno e guardado nele (`T.fpc`, `T.amb`, `T.nsite`).
- **A escolha da base avançada** (`enpFobPick`, aos 40 s e a cada 30 s): além das perguntas de estrada (o índice das estradas, outro PR), lia cinco alturas do terreno em cada uma das ~9900 células do mapa tático.

Por que não um orçamento que adia camadas para o passo seguinte: adiar uma camada um passo muda quando a ordem sai, e com isso a ordem dos sorteios e toda a batalha depois dela. A impressão digital de batalha (pedida para qualquer mudança no general) deixaria de bater na primeira camada adiada. Então este PR tira o custo sem mudar nenhum passo.

## O que mudou (`Céu de Ferro 3D.html`)
- **`planWarm`**: quando a partida é criada (`newState`, como já é feito com o `tmStatic` e o `tpsInit`), os estudos do terreno do general são feitos de uma vez: `fpCells`, `cmdSites` e `blkSites`. Eles dependem só do terreno (nenhum sorteio, as pontes de pé como na carga). Os planos leem os mesmos estudos e não constroem mais nada no meio da batalha. Só onde a IA planeja (não no convidado online).
- **`enpFobPick`**: primeiro os testes das camadas (linha e fogo conhecido), depois o `gMapOk` (que lê a altura). E, antes das cinco alturas da crista, a nota máxima que a célula poderia ter (gargalo + a melhor crista, 0,8 + 1, menos o que a visão e a linha tiram). Se nem ela vence a melhor célula, a célula é pulada. A nota de antes nunca passa dessa conta (as mesmas operações, e o arredondamento do ponto flutuante não inverte uma desigualdade), então a escolha é a mesma.

## Testado
- `tests/plan-warm.js`: os estudos existem logo depois de `newState`, os primeiros 4 s de batalha não constroem nada de novo, e refeitos no meio da batalha saem iguais. O convidado não constrói. A base avançada: a mesma escolha que o código antigo (copiado no teste) nos mapas táticos dos três lados e em mapas perturbados (gargalos, linha, visão e bases avançadas mudados), lendo menos alturas.
- Impressão digital de batalha (semente 11, "Assistir" moderna com três lados, mapa 11, passos de 1/30 s, 180 s): main × este ramo, a cada 20 s (posições dos soldados e veículos, obras, esquadras, operações dos três generais, número de sorteios).

## NÃO testado
- Um terreno cujo primeiro plano acontecia com uma ponte já caída (`S.gap`): antes, `cmdSites` e `blkSites` liam a altura com a ponte caída e guardavam isso no terreno para todas as partidas seguintes da sessão; agora leem o terreno da carga. É a única situação em que o estudo pode sair diferente, e o de agora não depende da história da sessão.
- A carga da partida fica um pouco mais longa na primeira partida de cada mapa na sessão (as partidas seguintes no mesmo mapa reusam os estudos).
