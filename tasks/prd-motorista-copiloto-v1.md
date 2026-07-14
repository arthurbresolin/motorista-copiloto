# PRD: Motorista Copiloto — v1 (Checklist + Registro de Prática)

## Introduction

App para apoiar o aprendizado prático de direção. O usuário é um aprendiz de motorista que quer (a) criar o hábito de checar o carro antes de sair e (b) acompanhar sua evolução registrando cada sessão de prática (data, duração, distância, manobras treinadas).

Este projeto tem um segundo objetivo, tão importante quanto o primeiro: servir como exercício completo de desenvolvimento de app — front-end mobile (Expo/React Native) + back-end próprio (API + banco de dados) — para o usuário aprender o processo real de construir um produto do zero.

A v1 cobre **Checklist pré-direção** e **Registro de sessões de prática**. Monitor de direção (GPS/acelerômetro) e Quiz de teoria ficam para versões futuras (ver seção Non-Goals), mas suas decisões de design já foram capturadas para não perder o contexto.

## Goals

- Usuário consegue rodar uma checklist antes de cada saída para dirigir, com itens marcáveis.
- Usuário consegue registrar uma sessão de prática (data, duração, distância, manobras praticadas, observações).
- Usuário consegue ver o histórico de sessões registradas e acompanhar evolução ao longo do tempo.
- Os dados persistem em um backend próprio (API + banco de dados), não só no dispositivo.
- O projeto expõe, de forma didática, o ciclo completo: modelagem de dados → API → migração → app mobile consumindo a API.

## User Stories

### US-001: Estrutura do backend
**Description:** Como desenvolvedor, preciso de um projeto backend organizado (FastAPI + SQLAlchemy async + Alembic) para servir de base às próximas features.

**Acceptance Criteria:**
- [ ] Projeto backend criado (ex: `backend/`) com FastAPI, SQLAlchemy 2.x async, Alembic e Pydantic configurados
- [ ] Banco de dados local (SQLite para começar, com caminho fácil de trocar para Postgres depois)
- [ ] Endpoint de health check (`GET /health`) retornando 200
- [ ] `alembic upgrade head` roda sem erro

### US-002: Modelo de dados — Checklist
**Description:** Como desenvolvedor, preciso de uma tabela para os itens padrão de checklist pré-direção (ex: "ajustar espelhos", "cinto de segurança").

**Acceptance Criteria:**
- [ ] Tabela `checklist_items` com campos: id, título, ordem
- [ ] Migração Alembic gerada e aplicada
- [ ] Seed inicial com pelo menos 8 itens padrão (espelhos, cinto, banco, volante, freio de mão, combustível, pneus, retrovisor)

### US-003: API — Checklist
**Description:** Como usuário, quero buscar a lista de checklist e marcar itens como concluídos numa sessão, para criar o hábito de verificação pré-direção.

**Acceptance Criteria:**
- [ ] `GET /checklist` retorna os itens padrão
- [ ] `POST /checklist/sessions` cria um registro de "checklist executada" com timestamp e itens marcados
- [ ] `GET /checklist/sessions` lista execuções passadas (para histórico simples)
- [ ] Testes automatizados (pytest) cobrindo os 3 endpoints acima

### US-004: Modelo de dados e API — Sessão de prática
**Description:** Como usuário, quero registrar uma sessão de prática de direção (data, duração, distância, manobras praticadas, observações) para acompanhar minha evolução.

**Acceptance Criteria:**
- [ ] Tabela `practice_sessions`: id, data, duração (min), distância (km), manobras (lista/texto), observações
- [ ] `POST /practice-sessions` cria uma sessão
- [ ] `GET /practice-sessions` lista sessões (mais recente primeiro)
- [ ] `GET /practice-sessions/{id}` retorna uma sessão específica
- [ ] Testes automatizados (pytest) cobrindo os endpoints acima

### US-005: Mobile — Tela de Checklist
**Description:** Como usuário, quero abrir o app e ver a checklist pré-direção, marcar os itens conforme confiro o carro, e salvar a execução.

**Acceptance Criteria:**
- [ ] Substitui a tela `index.tsx` (hoje template padrão do Expo) pela tela de Checklist
- [ ] Lista os itens vindos de `GET /checklist` com checkbox
- [ ] Botão "Concluir checklist" chama `POST /checklist/sessions`
- [ ] Feedback visual de sucesso ao salvar
- [ ] Typecheck/lint passam
- [ ] Verificado no navegador (`expo start --web`)

### US-006: Mobile — Nova sessão de prática
**Description:** Como usuário, quero preencher um formulário simples para registrar uma sessão de prática recém-terminada.

**Acceptance Criteria:**
- [ ] Formulário com: duração, distância, manobras praticadas (seleção múltipla ou texto livre), observações
- [ ] Validação básica (duração e distância obrigatórias e numéricas)
- [ ] Ao salvar, chama `POST /practice-sessions` e volta para a lista de histórico
- [ ] Typecheck/lint passam
- [ ] Verificado no navegador (`expo start --web`)

### US-007: Mobile — Histórico de sessões
**Description:** Como usuário, quero ver a lista de sessões de prática já registradas, para acompanhar minha evolução.

**Acceptance Criteria:**
- [ ] Substitui a tela `explore.tsx` pela tela de Histórico
- [ ] Lista as sessões vindas de `GET /practice-sessions`, mais recente primeiro
- [ ] Cada item mostra data, duração, distância e manobras
- [ ] Estado vazio (sem sessões ainda) tratado com mensagem amigável
- [ ] Typecheck/lint passam
- [ ] Verificado no navegador (`expo start --web`)

### US-008: Integração mobile ↔ backend
**Description:** Como desenvolvedor, preciso de uma camada simples de acesso à API no app mobile, configurável por ambiente (URL do backend local).

**Acceptance Criteria:**
- [ ] Cliente HTTP simples (fetch/axios) centralizado em um único módulo
- [ ] URL base do backend configurável via variável de ambiente do Expo
- [ ] Tratamento básico de erro de rede (mensagem amigável, sem crash)

## Functional Requirements

- FR-1: O backend deve expor endpoints REST para checklist e sessões de prática, documentados via OpenAPI/Swagger automático do FastAPI.
- FR-2: Os dados devem persistir em banco relacional via SQLAlchemy, com schema versionado por migrações Alembic.
- FR-3: O app mobile não deve guardar estado de dados de negócio localmente além de cache de tela — a fonte da verdade é sempre o backend.
- FR-4: A tela de Checklist deve carregar os itens do backend a cada abertura (sem hardcode no app).
- FR-5: O formulário de nova sessão deve impedir envio com campos obrigatórios vazios ou inválidos.
- FR-6: O histórico deve ser paginado ou limitado (ex: 50 mais recentes) para não crescer indefinidamente na v1.

## Non-Goals (Out of Scope para v1)

- **Monitor de Direção (GPS/acelerômetro):** adiado para v2. Decisão já tomada para quando for implementado: monitoramento com alertas em tempo real (som/vibração) durante a sessão ativa, não apenas resumo pós-sessão.
- **Quiz de teoria de trânsito:** adiado para v3. Decisão já tomada: v1 do quiz não virá com banco de perguntas pronto — só a estrutura da tela; o conteúdo real será adicionado depois pelo usuário.
- Autenticação/multi-usuário: v1 assume um único usuário (o próprio dono do app), sem login.
- Sincronização offline-first ou fila de requisições sem internet.
- Deploy do backend em nuvem: v1 roda localmente (localhost) para fins de desenvolvimento/aprendizado; deploy real fica para depois.

## Design Considerations

- Reaproveitar os componentes já existentes no template (`ThemedText`, `ThemedView`, `Collapsible`) para manter consistência visual e suporte a dark mode.
- Layout de abas (`AppTabs`) já existente pode crescer de 2 para 3-4 abas conforme v2/v3 forem entrando (Checklist, Histórico, futuramente Monitor e Quiz).

## Technical Considerations

- Backend: FastAPI + SQLAlchemy 2.x (async) + Alembic + Pydantic v2 + pytest — stack coberta pelas skills disponíveis no ambiente.
- Mobile: Expo Router (já configurado) + TypeScript, sem necessidade de lib de state management global na v1 (poucas telas, dados vêm direto da API).
- Rodar backend e mobile em paralelo localmente durante o desenvolvimento (dois processos: `uvicorn` e `expo start`).
- Testes automatizados no backend (pytest) desde o início, como parte do aprendizado de metodologia.

## Success Metrics

- Usuário consegue completar uma checklist e ver ela salva no histórico de execuções.
- Usuário consegue registrar e visualizar pelo menos 3 sessões de prática reais.
- Todos os endpoints têm teste automatizado passando.
- Usuário entende, ao final, como front-end e back-end se conectam (não é só "mágica").

## Open Questions

- Qual banco usar em produção eventualmente (Postgres gerenciado, SQLite embarcado)? Não bloqueia a v1 (SQLite local resolve).
- As "manobras praticadas" devem ser uma lista fixa pré-definida (baliza, rotatória, rodovia, estacionamento) ou texto livre? A definir na implementação da US-004/US-006.
