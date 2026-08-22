# PRD: Motorista Copiloto — v3 (Quiz de teoria)

## Introduction

Shell vazio da tela de Quiz de teoria de trânsito. Decisão já tomada na v1 (ver `prd-motorista-copiloto-v1.md`): a v3 não vem com banco de perguntas pronto, só a estrutura da tela — o conteúdo real (perguntas, respostas, lógica de quiz) é adicionado depois pelo usuário.

## User Story

**Descrição:** Como usuário, quero ver uma aba "Quiz" reservada no app, para que o espaço já exista quando eu decidir adicionar as perguntas de teoria de trânsito.

**Critérios de aceite:**
- [x] Nova aba "Quiz" no app (cresceu de 3 para 4 abas, conforme já previsto no PRD v1)
- [x] Tela mostra um título e uma mensagem indicando que o conteúdo vem depois ("Em breve")

## Non-Goals (v3)

- Nenhum banco de perguntas, lógica de pontuação, ou navegação entre perguntas — fica para quando o usuário trouxer o conteúdo.
- Nenhuma integração com o backend ainda (não há dados para persistir).

## Technical Considerations

- Tela em `src/app/(tabs)/quiz.tsx`, registrada em `src/components/app-tabs.tsx` (nativo) e `src/components/app-tabs.web.tsx` (web) — as duas precisam ser editadas juntas, ver gotcha já conhecido do repo.
