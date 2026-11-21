# cf-zoom-veiculos — zoom nos veículos "normais" (não testado)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Técnica com DShK (Insurgentes): R passa da visão externa para a mira ×2 (campo de 29°), R para ×4 (14,5°) e R volta à externa (58°), suave em 40 quadros. Sem erro no console.
- ×4 na ZPU-4: os dois canos emolduram o pé da tela sem tampar a mira. Na DShK e na moto o corpo do veículo do jogador não é desenhado nas cenas montadas pelo console (veja RESULTADO-B), então "o modelo tampa a vista" não foi conferido nelas.
- **Continua sem teste:** a roda do mouse, o tiro no ×4 indo ao centro, SPG-9, ZU-23 e S-5/S-8, a tela de toque.

## O que mudou
- Todo veículo de transporte (`TRNS`: carros, caminhões, técnicas/picapes dos Insurgentes com DShK, SPG-9, ZU-23, S-5/S-8, ZPU e DShK rebocados, caminhão com ZU-23, moto, veículos-rádio com MG, Humvee/Tigr, ambulâncias, caminhões de oficina e recuperação) já tinha um assento de 1ª pessoa `drv_<id>` com um só FOV (72°). Agora ele tem níveis de zoom (`DZ`, perto de `scoped` no script):
  - com arma: `[72, 29, 14.5]` → mira da arma ×2 e ×4 (contado como as lunetas dos tanques, 58 / fov); o assento já olha pela mira (`free`), então o zoom fica alinhado com a arma;
  - sem arma: `[72, 9.7]` → binóculo do motorista ×6.
- R ou roda do mouse **na visão externa** de um desses veículos entra direto no assento no 1º nível; afastar até o nível 0 sai de volta para a visão externa (`camSt.zc`). Entrando pelo C, o zoom fica no assento como nos tanques. C cancela esse "voltar sozinho".
- O FOV desses assentos agora entra e sai suave (`camSt.fz`, ~0,1 s); a sensibilidade do mouse acompanha o FOV atual (fov / 58).
- Texto "MIRA ×N" / "BINÓCULO ×N" abaixo do centro quando há zoom. Nenhum retículo foi mudado (o remake das miras é o cf-miras-visual).
- Os assentos agora são criados para todos os ids de `TRNS`, também os não enumeráveis (ambulâncias/oficinas que não estão na lista de escolha), que antes caíam no assento de jato se fossem dirigidos.
- Ajuda das teclas do transporte e README (tabela de solo) atualizados.
- Blindados sobre rodas (LAV-25, BTR-82A, BTR-70, Shilka) já usavam a luneta `gunnerM` com zoom: sem mudança. Passageiro (soldado sentado atrás) não ganhou zoom.

## Não testado
Nada além de: sintaxe do script, servidor subindo (`node server.js`), a página abrindo sem erro novo no console e `SEAT.drv_tecDshk.fov`/`SEAT.drv_opel.fov`/`SEAT.drv_m997.fov` com os níveis novos.

## Riscos
- A troca chase → assento muda a posição da câmera de uma vez (só o FOV é suave); pode parecer um "pulo".
- Ao sair (zoom até 0), a câmera espera o FOV voltar a ~3° do normal antes de voltar à visão externa: se algo travar `camSt.fz`, poderia ficar presa no assento (C resolve).
- O eixo do zoom com arma é o olho atrás da arma (`[d.tx - 1.6, .8, 0]`); em veículos baixos (ZPU, DShK no reparo, moto) a vista ampliada pode bater no próprio modelo.
- O texto do aumento pode sobrepor algum HUD de baixo do centro em telas pequenas.
- Botão ZOOM da tela de toque usa o mesmo `zoomBy(0)`: deve funcionar igual, não visto.

## Como testar depois
1. `PORT=8080 node server.js`, abrir `http://localhost:8080/`.
2. Insurgentes → classe Transporte → Técnica com DShK. Na visão externa: R → entra na mira ×2; R → ×4; R → volta à visão externa suave. Roda do mouse: para cima entra/aproxima, para baixo afasta/sai. Atirar no ×4 e ver se o tiro vai no centro.
3. O mesmo com SPG-9, ZU-23, S-5/S-8, ZPU-4 e moto (conferir se o modelo não tampa a vista).
4. Caminhão (ZIL-131, Opel Blitz, HEMTT) e carro sem arma (Kübelwagen, sedã): R → binóculo ×6, R → sai.
5. C para o assento e depois roda: zoom fica no assento (nível 0 não sai).
6. Sensibilidade: no ×4 o mouse deve mover a mira mais devagar.
7. Tanque, LAV-25 e avião: R/roda continuam como antes.
8. Tela de toque (emulação mobile): botão ZOOM num carro.
