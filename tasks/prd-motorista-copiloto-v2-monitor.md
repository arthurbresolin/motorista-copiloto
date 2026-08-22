# PRD: Motorista Copiloto — v2 (Monitor de Direção)

## Introduction

Monitor de Direção em tempo real: usa os sensores de movimento do celular para avisar o usuário quando detecta uma freada ou aceleração brusca durante uma sessão de prática ativa. Decisão já tomada na v1 (ver `prd-motorista-copiloto-v1.md`): alerta em tempo real (som/vibração), não apenas um resumo pós-sessão.

## User Story

**Descrição:** Como usuário, quero ligar o monitor antes de sair pra dirigir e ser avisado na hora (com vibração) se eu frear ou acelerar bruscamente, para treinar uma direção mais suave.

**Critérios de aceite:**
- [x] Nova aba "Monitor" no app (cresceu de 2 para 3 abas, conforme já previsto no PRD v1)
- [x] Botão "Iniciar monitoramento" verifica se o sensor de acelerômetro está disponível
- [x] Se o sensor não estiver disponível/permitido, mostra mensagem amigável com opção de tentar de novo
- [x] Enquanto monitorando, detecta mudanças bruscas na aceleração e dispara vibração (Haptics) + banner na tela
- [x] Contador de quantos eventos bruscos ocorreram na sessão atual
- [x] Botão "Parar monitoramento" encerra a leitura do sensor

## Non-Goals (v2)

- Não usa GPS/velocidade ainda, só o acelerômetro (frenagem/aceleração). Monitorar velocidade via GPS fica para depois.

## v2.1 — Persistência do resumo (concluído)

- [x] Ao parar o monitoramento, salva um resumo da sessão no backend: `started_at`, `duration_seconds`, `event_count` (endpoint `POST /monitor-sessions`, tabela `monitor_sessions`).
- [x] Salvamento é "fire and forget": falha de rede não bloqueia nem avisa o usuário, já que o valor real da funcionalidade é o alerta em tempo real, não o resumo.
- Ainda não há tela de histórico de sessões de monitoramento (só ficam salvas no backend); pode virar uma v2.2 se fizer sentido.

## Technical Considerations

- Lógica de detecção isolada em `src/lib/harsh-event-detector.ts` (função pura: compara a magnitude de duas leituras consecutivas do acelerômetro; a diferença cancela a gravidade constante sem precisar saber a orientação do aparelho). Essa é a única parte testável sem um celular físico — verificada manualmente com casos de exemplo (parado, aceleração leve, freada brusca, limiar exato).
- `expo-sensors` (Accelerometer) para leitura do sensor, `expo-haptics` para o aviso tátil.
- **Limitação conhecida:** o acelerômetro em navegador (web) é limitado/não confiável (exige HTTPS + gesto do usuário) e o ambiente de teste automatizado não tem acelerômetro real. A validação de ponta a ponta desta funcionalidade depende de testar num celular físico.

## Open Questions

- O limiar de 0.4g está bom, ou precisa ajustar depois de testar em um carro de verdade?
- Vale a pena adicionar uma tela de histórico para as sessões de monitoramento (v2.2)?
