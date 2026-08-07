# Roadmap de Produto

Consolida 4 pedidos grandes que o usuário mandou em mensagens separadas
(autenticação/workspace pessoal, melhorias de aula guiada/câmera/prática
manual, reorganização das trilhas, expansão de câmera em tempo real +
trilhas completas), cruzados com o que já foi implementado. Objetivo:
não perder pedido nenhum de vista, e servir de checklist pras próximas
levas de trabalho.

Legenda: ✅ feito · 🚧 parcialmente feito · ❌ não iniciado · 🔒 bloqueado (infra)

**Atualizado em 2026-08-07** — depois de Bloco A (contas/configurações),
Reskin 2 (visual + reestruturação quiz→prática da trilha) e a navegação
do instrutor. Ver `[[project_motorista-copiloto]]` (memória) pro
histórico detalhado de cada leva.

---

## 1. Autenticação e workspace pessoal

| Item pedido | Status |
|---|---|
| Tela de login | ✅ `src/app/(auth)/entrar.tsx` |
| Tela de cadastro | ✅ `src/app/(auth)/cadastro.tsx` |
| Esqueci minha senha (fluxo por e-mail) | ✅ `POST /learners/password-reset/request` + telas `esqueci-senha.tsx`/`redefinir-senha.tsx`, via Resend (free tier) — **precisa de `APP_RESEND_API_KEY` + `APP_WEB_URL` no `backend/.env` pra enviar de verdade; sem isso o endpoint responde normal mas não manda e-mail** |
| Redefinição de senha | ✅ mesma leva acima |
| Logout | ✅ botão "Sair" no Perfil |
| "Lembrar de mim" | 🚧 login já fica válido por 365 dias sempre (sem opção de escolher) — não existe checkbox pra ligar/desligar isso |
| Sessão segura | ✅ JWT com claim de role + bcrypt |
| Design moderno/premium consistente com o resto do app | ✅ |
| Isolamento de dados por conta: progresso, trilha, XP, nível, conquistas, streak, quiz, sessões guiadas/manuais, estatísticas | ✅ tudo isolado por `learner_id` |
| Isolamento de "AI feedback" | ✅ persiste em `session_feedback`, histórico em `src/app/feedback-historico.tsx` |
| Isolamento de "fotos tiradas durante exercícios" | ✅ salvas em `backend/media/practice-sessions/{id}/`, servidas via `/media/...` |
| "Challenges" | ❌ ainda não existe como conceito separado das Conquistas/achievements |
| Configurações pessoais | ✅ `src/app/configuracoes.tsx` |
| Editar informações pessoais / trocar foto de perfil / trocar senha (autenticado) | ✅ tudo em Configurações |
| Notificações / preferências do app | 🚧 toggle salvo no perfil, mas nenhuma feature ainda lê esse valor pra notificar de verdade |
| Sincronização entre aparelhos | ✅ automático, já que tudo vem do servidor |

---

## 2. Aula guiada, câmera e prática manual

| Item pedido | Status |
|---|---|
| Aulas ilustradas (setas, animação de volante, diagramas de posição, referências de estacionamento, áreas de perigo, exemplos animados) | ❌ Modo Copiloto continua só texto falado (voz), sem ilustração/animação |
| Modo guiado "mais inteligente" com instruções curtas e contínuas (tipo "agora pise na embreagem", "engate a primeira", "solte devagar"...) | ❌ ainda fala só 2-3 dicas fixas por habilidade (`skill.tips`), sem passo-a-passo granular |
| Câmera assistindo em tempo real durante a aula guiada | 🔒 bloqueado — precisa de vídeo contínuo processado (`react-native-vision-camera` + frame processors), exige build nativo custom. Sem Mac isso não roda (`docs/roadmap-visao-computacional.md`, Fase B) |
| Foto do resultado integrada ao modo guiado | ✅ botão "📷 Foto do resultado" no fim do Modo Copiloto pra baliza/estacionamento |
| Guardar as fotos pra rever depois / comparar progresso / histórico visual | ✅ salvas + histórico em `feedback-historico.tsx` (Bloco A) |
| Redesenho da tela de Prática Manual (cards maiores, dificuldade, preview, objetivos, foto antes/depois, feedback de IA) | ❌ ainda é o formulário simples `nova-pratica.tsx` |

---

## 3. Reorganização das trilhas e dos quizzes

| Item pedido | Status |
|---|---|
| Reordenar trilhas: 1) Fundamentos do veículo (pedais, embreagem, câmbio, ponto de embreagem, ligar/desligar, arrancar, trocar marcha, não morrer o carro, postura, ajuste de banco/espelho) → 2) Direção no trânsito (placas, sinalização, semáforo, distância segura, faixas, cruzamentos, rotatórias, direção defensiva) → 3) Manobras (baliza, estacionamento, retorno, conversões) | ❌ **ainda bloqueado em conteúdo, não em reordenação** — `SKILLS` (`src/constants/skills.ts`) só tem manobras + checklist + direção suave hoje; não existe nenhum conteúdo de "fundamentos" ou "trânsito" pra colocar nas posições 1 e 2. Reordenar a lista atual não muda nada de verdade — precisa da leva C (conteúdo novo) primeiro. |
| Reformular quizzes: tirar pergunta de trânsito/manobra da primeira fase, cada quiz só cobre o que já foi ensinado, quizzes menores e mais raros | ✅ **feito em 2026-08-07** — `QUIZ_PHASE_ORDER` (backend/app/api/quiz.py) agora bate exatamente com a ordem de `SKILLS`, e passar no quiz de uma habilidade só libera o quiz da próxima depois que a prática dessa habilidade também foi concluída (`_is_practice_done`, mesma regra de `gamification.ts`) — antes o quiz sozinho já liberava a fase seguinte, pulando a prática. A fase "geral" (9 perguntas de legislação — placas, prioridade, cinto, velocidade, álcool, cadeirinha) não tem pergunta de manobra específica, só legislação genérica; conferido nesta leva. |
| Espaço liberado usado pra aprofundar aulas práticas/animações/exemplos | ainda depende do conteúdo novo (leva C/D) existir |

---

## 4. Expansão grande: trilhas completas + câmera em tempo real + instrutor IA mais rico

| Item pedido | Status |
|---|---|
| Câmera em tempo real (faixas, semáforos, placas, pedestres, veículos próximos, vagas, cones, curvas, cruzamentos, posição na faixa, erros comuns) | 🔒 mesmo bloqueio da seção 2 — precisa de build nativo / Mac |
| Aulas guiadas interativas com ilustrações/setas/animações | ❌ mesmo item da seção 2 |
| Trilhas completas novas: Fundamentos do Câmbio Manual, Controle Básico do Veículo, Consciência no Trânsito, Direção Urbana, Direção em Rodovias, Condições Adversas, Conhecimento do Veículo | ❌ nenhuma dessas existe — é a expansão de conteúdo mais ambiciosa do pedido inteiro. Hoje só existem as 6 manobras + checklist + direção suave. |
| IA explicando o porquê de cada acerto/erro e o que praticar na próxima sessão | 🚧 o feedback de IA já existe e agora fica salvo (`backend/app/api/coach.py` + `session_feedback`), mas ainda é 1-2 frases curtas — não tem essa profundidade de "por que certo/errado + o que praticar depois"; é mais ajuste de prompt do que feature nova |
| Progressão de aulas com níveis dentro de cada trilha (ex: Câmbio Manual Nível 1 → 2 → ... → 6) | ❌ o modelo de dados continua "habilidade feita/atual/travada" baseado em quiz+prática — não tem conceito de "nível dentro de uma trilha com várias aulas" |
| Instrutor conseguir navegar pelo app, não só o painel | ✅ **feito em 2026-08-07** — `src/app/instrutor/trilha.tsx` e `praticas.tsx`, mesmos componentes visuais do aluno em modo só-leitura, alimentados por `GET /instructors/overview` + novo `GET /instructors/quiz-phases` |

---

## Do que dá pra tirar uma leitura geral

O pedido inteiro, junto, é essencialmente: **transformar o app de "treinador de manobras" pra "autoescola completa"** — conteúdo de fundamentos de veículo do zero, trilhas muito mais numerosas e estruturadas, aulas com ilustração/animação, guiagem por voz bem mais granular, e (quando possível) câmera analisando em tempo real. É trabalho de meses, não de uma leva.

Pra fatiar isso de forma realista, dá pra pensar em blocos mais ou menos independentes:

- **A. Contas/Configurações** — ✅ feito (2026-08-06): tela de Configurações, editar perfil, trocar senha logado, persistência de fotos e feedback de IA, esqueci senha via Resend (falta só a chave de API pra ativar o envio de verdade).
- **B. Reorganizar trilha + quiz existentes** — ✅ a parte de dados/sequenciamento do quiz está feita (2026-08-07: ordem `QUIZ_PHASE_ORDER` alinhada com `SKILLS`, quiz exige prática antes de liberar a próxima fase). A parte de "reordenar em 3 seções" continua bloqueada em conteúdo — não tem o que reordenar até a leva C existir.
- **C. Conteúdo de Fundamentos do Veículo do zero** — ❌ ainda não iniciado. Escrever as aulas de embreagem/câmbio/pedais/postura que hoje não existem nada. Trabalho de conteúdo pesado e subjetivo (tom, profundidade, exemplos) — melhor decidido junto, não de forma autônoma, dado o quanto o usuário se importa com fidelidade exata em outras levas (design, cópia do quiz).
- **D. Aulas guiadas mais visuais** — ❌ ilustrações, animações, guiagem por voz mais granular. Trabalho de design/animação, mesma ressalva de C.
- **E. Redesenho da tela de Prática Manual** — ❌ cards mais ricos, preview, dificuldade, etc.
- **F. Câmera em tempo real** — 🔒 continua bloqueado até resolver Mac/build nativo, independente de tudo o resto.
- **Extra. Instrutor navegar pelo app** — ✅ feito (2026-08-07), item da seção 4 que não tinha bloco próprio.

Blocos C, D e E são os que sobraram — todos genuinamente grandes e de conteúdo/design subjetivo, por isso não foram atacados de forma autônoma nesta leva. Ficam prontos pra decidir juntos a próxima vez.
