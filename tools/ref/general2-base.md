# Régua do General 2 (G0)

`general2-base.json` é o general de hoje medido pela seção `GENERAL 2: régua` da página: os exemplos do capitão em números (pacote G0 de `cf-ia-opensource`, seção 6). Cada pacote do General 2 (G1 a G8) compara o seu torneio com ela:

```
nice node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 11 --seed 1 --jobs 12 --save <pasta> --json <arquivo> --ref tools/ref/general2-base.json
nice node tools/balance.js <pasta> --ref tools/ref/general2-base.json
```

A seção "General 2: régua dos exemplos" do `balance.js` põe cada medida ao lado da meta do pacote que responde por ela e, com `--ref`, da coluna desta régua. `--g2 0` joga sem a régua, para comparar. `general2-base-combates.ndjson` traz os 61 combates destas partidas, um por linha, como `--combates` grava: é o começo dos logs que o G2 usa para calibrar a simulação.

## Atenção: régua parcial, só 1944

O pedido era 12 partidas Curtas: 6 de 1944 e 6 da época moderna. Cada uma levou de 8h20 a 9h10 de relógio no bartolomeu, que estava saturado por outros torneios (cada processo recebia cerca de 27% de um núcleo). O firstmate pediu para gravar com o que houvesse. **Esta régua tem só as 6 de 1944** (sementes 1 a 6, cada par das três doutrinas).

Por isso não há número aqui para:
- a cúpula (só existe na época moderna);
- a artilharia de foguetes;
- qualquer medida da guerra moderna.

As 6 modernas (sementes 7 a 12) continuavam rodando no mesmo torneio quando ela foi gravada. Elas entram numa atualização deste arquivo.

**Defeito conhecido nesta régua: km embarcado sai 0.** Uma esquadra numa carona (`rideBoard` marca os homens como `gone` a bordo) não era seguida. O defeito foi corrigido no mesmo PR (`g2Where`), depois que estas partidas foram jogadas. Para o km embarcado, compare com uma rodada nova, não com esta régua. A medida do G8 ("caminhadas longas feitas de carona", a do `EMB`) não tem esse defeito.

Jogada sobre o commit `fdd89da` (o main `ab57ded` com o G0). Ela não inclui o #168 (cúpula do general) nem o #170 (lag), que entraram no main depois e mudam a batalha.

## Como foi jogado

- 2026-11-20 e 21, no bartolomeu (nunca no elrei), com `nice`, Node v26.13.1.
- Comando: `node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 11 --seed 1 --jobs 12`.
  - O mapa v11 é o de hoje (`MAPV = 11`), com economia, logística física e recuperação.
  - `--nobudget`: a mesma semente dá a mesma partida.
- A metade de 1944 foi juntada com `node tools/balance.js <pasta> --json`.
- O JSON é a saída de `--json` sem os caminhos locais (`ref.matches` guarda o nome de cada partida).

## A régua é estável e não muda a partida

Na partida Curta inteira, semente 1 (1944, cautious × balanced):

| Controle | Eventos da batalha | Fim | Eventos da régua |
| --- | --- | --- | --- |
| Régua ligada (a da régua) | 14.971 | 1.800 s, lado 0 vence, tíquetes 570,9 a 495,3 | 69 (`g2` e `g2c`) |
| Régua desligada (`--g2 0`) | 14.971, todos idênticos | o mesmo | 0 |
| Régua ligada de novo | 14.971, todos idênticos | o mesmo | 69, todos idênticos |

`tests/g2-regua.js` confere o mesmo numa partida curta, com contato forçado aos 20 s para que haja combate, e confere cada medida com eventos inventados.

## O que deu (6 partidas de 1944)

- 6 terminadas, todas pelo tempo (30 min), e o lado 0 venceu as 6.
- Tíquetes: sangria 68%, outros 26%, civis 4%, pontos 1%.
- Dos dois lados somados: uma contagem é por partida, e uma porcentagem junta todas as partidas.

| Medida | Valor | Meta (pacote) |
| --- | --- | --- |
| Sede inimiga: assaltos abertos por partida (chegaram à hora H); esquadra-min dentro da cidade-sede inimiga | 0 (0); 0 | > 0 (G3) |
| Própria sede: incursões inimigas por partida; atendidas (tantas esquadras e blindados nossos quanto deles); tempo médio até atender | 0,2; 100%; 0 s | todas; resposta curta (G4) |
| Esquadras dentro da rede de comando (do tempo) | 100% | ≥ 85% (G6) |
| Cúpulas prontas por partida; impactos inimigos perto de um ativo por partida (antes da 1ª cúpula); lados-partida na moderna com canhão inimigo visto: cúpula antes do 10º impacto | 0; 76,8 (76,8); 0 de 0 | ≥ 1 antes do 10º impacto (G6) |
| Bases avançadas por partida: ordenadas, prontas; lados-partida com ao menos uma pronta | 5,8, 2,3; 75% | ≥ 1 por partida (G6) |
| Pontos tomados com 3 peças ou mais a ≤ 150 m, 5 min depois (média de peças; casos) | 19% (0,9; 16) | ≥ 60% (G6) |
| Defensores de ponto ameaçado: distância ao centro; vizinho mais perto (com 5 m ou mais) | 105,8 m; 20,5 m (61%) | ≥ 5 m (G5) |
| Ponto ameaçado com no máximo 1 esquadra a < 30 m do centro (esquadras ali, média) | 86% (0,5) | ≤ 1 esquadra a < 30 m (G5) |
| Tanques na defesa de ponto ameaçado sem outro tanque a < 30 m (tanque-min por partida) | 100% (17) | ≥ 30 m (G5) |
| Pontos perdidos por partida (tomados) | 1 (2,8) | ≤ régua × 0,8 (G5) |
| Soldado em prédio: do tempo todo; na defesa de cidade (soldado-min por partida) | 15%; 28% (80,4) | ≥ 40% (G7) |
| Soldado-min dentro de cidade que o inimigo segura, por partida | 0 | > 0 (G7) |
| Assaltos a ponto urbano que tomam o ponto (assaltos por partida) | 0% (1,2) | ≥ 40% (G7) |
| Foguetes AT de soldado por partida: em blindado; todos; blindados destruídos pela infantaria | 2,8; 3,5; 1,7 | ≥ 3 por partida (G7) |
| Atirador de elite: tiros por partida; em prédio (do tempo) | 10,3; 17% | — |
| Deslocamento das esquadras por partida: km a pé; km embarcado (embarcado do total) | 200,7; 0 (0%) | — |
| Caminhadas longas (≥ 1,5 km) por partida; feitas de carona | 817,5; 2% | ≥ 50% (G8) |
| Hora H por partida (assaltos abertos) | 0 (2,2) | ≥ 2 por partida (G4) |
| Reuniões canceladas por prazo, das reuniões (por partida) | 6% (0,3) | ≤ 15% (G4) |
| "Sem força para atacar" por partida | 66,8 | ≤ 10 por partida (G4) |
| Combates registrados (lados-combate; deixados de fora) | 122 (0) | registro para o G2 |
| Taxa de flanco: amostras de chegada a 70° ou mais do eixo (só assaltos) | 1% (—) | ≥ 35% (G4) |
| Entropia das chegadas (bits) | 0 | +1 bit sobre a referência |
| Repetição: mesmo objetivo, eixo e lado de chegada do assalto anterior | 100% | metade da referência |

Leitura: os exemplos do capitão aparecem nos números do general de hoje.
- **Sede inimiga:** nenhum assalto e nenhuma esquadra dentro dela.
- **Hora H:** nenhum assalto chega a ela (2,2 abertos por partida).
- **Reunião:** 6% das reuniões são canceladas por prazo. Isso é pouco, porque quase nenhum assalto chega a formar.
- **"Sem força para atacar":** 66,8 por partida.
- **Flanco:** 1%. As chegadas têm entropia 0 e 100% de repetição.
- **Cidade inimiga:** nenhum soldado entra.
- **Prédios:** 15% do tempo em prédio, e 28% na defesa de cidade.
- **Defesa dos pontos:** os defensores ficam a 106 m do centro, com o vizinho a 20 m. Num ponto ameaçado, quase nunca há mais de uma esquadra no centro (86%).
- **Obras:** 19% dos pontos tomados têm 3 peças ou mais 5 min depois. As bases avançadas saem: 5,8 ordenadas e 2,3 prontas por partida.
- **Anticarro:** 3,5 foguetes AT por partida, 2,8 deles em blindado, e 1,7 blindado destruído pela infantaria por partida.
- **Caronas:** só 2% das caminhadas longas são de carona.
