# cf-pol-modelos: as marcas do médico no soldado do pack (testado em parte)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Assistir em Hoje, a 4,5 m de um Combat Medic do pack andando: a braçadeira branca no braço. Nenhum erro no console.
- **Continua sem teste:** o médico deitado e morto, e as outras qualidades (Baixa, Alta).

## O que mudou

O médico perto do olho é o soldado animado do pack. Ele não tinha marca nenhuma: as do boneco de caixas, depois do conserto em `tests/medic-marks.js`, só vão no médico que o boneco desenha.

Agora o soldado do pack que é médico (`d.med`, menos os irregulares `d.irr`) ganha (`PMED`, `packMedMarks`):

- uma braçadeira branca no braço esquerdo;
- um disco branco com a cruz vermelha no alto do capacete.

As marcas são filhas dos ossos `UpperArm_L` e `Head` e mexem com ele. Valem na partida (`packPose`, escondidas quando a vaga do pack é reusada por outro soldado) e no cartão do hangar (`manModel`).

## O que foi testado

No navegador, os cartões do hangar do Sanitäter, do Medic, do Combat Medic, do Sanitar, do Socorrista (irregular, sem marcas) e de um Schütze (sem marcas), de frente e de costas (imagem na PR).

## O que NÃO foi testado

- Um médico do pack andando, correndo, deitado e morto numa partida (as marcas seguem os ossos; deitado ou morto o disco não deve sumir no chão, mas não foi visto).
- Os outros tamanhos de vaga do pack (Baixa, Alta).
