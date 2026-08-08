# Roadmap de Produto

Consolida 4 pedidos grandes que o usuário mandou em mensagens separadas
(autenticação/workspace pessoal, melhorias de aula guiada/câmera/prática
manual, reorganização das trilhas, expansão de câmera em tempo real +
trilhas completas), cruzados com o que já foi implementado. Objetivo:
não perder pedido nenhum de vista, e servir de checklist pras próximas
levas de trabalho.

Legenda: ✅ feito · 🚧 parcialmente feito · ❌ não iniciado · 🔒 bloqueado (infra)

**Atualizado em 2026-08-07** — depois de Bloco A (contas/configurações),
Reskin 2 (visual + reestruturação quiz→prática da trilha), a navegação
do instrutor, os Blocos B/C/D (currículo novo de Fundamentos/Trânsito +
voz mais granular no Modo Copiloto) e o Bloco E (redesenho da Prática
Manual) + "lembrar de mim" + feedback de IA mais profundo. Ver
`[[project_motorista-copiloto]]` (memória) pro histórico detalhado de
cada leva.

---

## 1. Autenticação e workspace pessoal

| Item pedido | Status |
|---|---|
| Tela de login | ✅ `src/app/(auth)/entrar.tsx` |
| Tela de cadastro | ✅ `src/app/(auth)/cadastro.tsx` |
| Esqueci minha senha (fluxo por e-mail) | ✅ `POST /learners/password-reset/request` + telas `esqueci-senha.tsx`/`redefinir-senha.tsx`, via Resend (free tier) — **precisa de `APP_RESEND_API_KEY` + `APP_WEB_URL` no `backend/.env` pra enviar de verdade; sem isso o endpoint responde normal mas não manda e-mail** |
| Redefinição de senha | ✅ mesma leva acima |
| Logout | ✅ botão "Sair" no Perfil |
| "Lembrar de mim" | ✅ **feito em 2026-08-07** — checkbox em `entrar.tsx`; marcado (padrão) gera token de 365 dias, desmarcado gera token de 1 dia (`SHORT_SESSION_EXPIRE_DAYS` em `security.py`) |
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
| Aulas ilustradas (setas, animação de volante, diagramas de posição, referências de estacionamento, áreas de perigo, exemplos animados) | ❌ Modo Copiloto continua só texto falado (voz), sem ilustração/animação — precisa de pipeline de assets/design, fora do alcance de uma sessão só de texto |
| Modo guiado "mais inteligente" com instruções curtas e contínuas (tipo "agora pise na embreagem", "engate a primeira", "solte devagar"...) | ✅ **feito em 2026-08-07** — Modo Copiloto (`src/app/copiloto/[id].tsx`) já era 100% genérico sobre `skill.tips`, então bastou reescrever o conteúdo: todas as manobras (baliza, rotatória, estacionamento, rodovia, curva, marcha-ré) e as 11 habilidades novas agora têm 5-6 passos curtos e sequenciais em vez de 2-3 dicas soltas |
| Câmera assistindo em tempo real durante a aula guiada | 🔒 bloqueado — precisa de vídeo contínuo processado (`react-native-vision-camera` + frame processors), exige build nativo custom. Sem Mac isso não roda (`docs/roadmap-visao-computacional.md`, Fase B) |
| Foto do resultado integrada ao modo guiado | ✅ botão "📷 Foto do resultado" no fim do Modo Copiloto pra baliza/estacionamento |
| Guardar as fotos pra rever depois / comparar progresso / histórico visual | ✅ salvas + histórico em `feedback-historico.tsx` (Bloco A) |
| Redesenho da tela de Prática Manual (cards maiores, dificuldade, preview, objetivos, foto antes/depois, feedback de IA) | ✅ **feito em 2026-08-07** — `nova-pratica.tsx` agora mostra cada habilidade como card (label + selo de dificuldade + objetivo/descrição, reaproveitando `SKILLS`), aceita foto "antes" (nova coluna `before_photo_path` em `PracticeSession` + endpoint `POST /practice-sessions/{id}/before-photo`) e foto "depois" com avaliação da IA (reaproveita `/coach/.../photo-feedback`), e depois de salvar mostra uma tela de resultado com resumo, as duas fotos lado a lado e o feedback de texto + foto da IA |

---

## 3. Reorganização das trilhas e dos quizzes

| Item pedido | Status |
|---|---|
| Reordenar trilhas: 1) Fundamentos do veículo (pedais, embreagem, câmbio, ponto de embreagem, ligar/desligar, arrancar, trocar marcha, não morrer o carro, postura, ajuste de banco/espelho) → 2) Direção no trânsito (placas, sinalização, semáforo, distância segura, faixas, cruzamentos, rotatórias, direção defensiva) → 3) Manobras (baliza, estacionamento, retorno, conversões) | ✅ **feito em 2026-08-07** — `SKILLS` (`src/constants/skills.ts`) agora tem 19 habilidades na ordem Checklist → 6 de Fundamentos (postura, pedais/embreagem, ponto de embreagem, ligar/desligar, trocar marchas, controle em baixa velocidade) → 5 de Trânsito (placas, semáforo/prioridade, distância/espelhos, mudança de faixa, direção defensiva) → 6 manobras já existentes (baliza, rotatória, estacionamento, rodovia, curva, marcha-ré) → Direção suave no final. `QUIZ_PHASE_ORDER` no backend foi atualizado pra bater exatamente com essa ordem. |
| Reformular quizzes: tirar pergunta de trânsito/manobra da primeira fase, cada quiz só cobre o que já foi ensinado, quizzes menores e mais raros | ✅ **feito em 2026-08-07** — `QUIZ_PHASE_ORDER` (backend/app/api/quiz.py) agora bate exatamente com a ordem de `SKILLS`, e passar no quiz de uma habilidade só libera o quiz da próxima depois que a prática dessa habilidade também foi concluída (`_is_practice_done`, mesma regra de `gamification.ts`) — antes o quiz sozinho já liberava a fase seguinte, pulando a prática. A fase "geral" (9 perguntas de legislação — placas, prioridade, cinto, velocidade, álcool, cadeirinha) não tem pergunta de manobra específica, só legislação genérica; conferido nesta leva. |
| Espaço liberado usado pra aprofundar aulas práticas/animações/exemplos | 🚧 conteúdo textual/voz das 11 habilidades novas está pronto; ilustrações/animações continuam de fora (sem pipeline de design) |

---

## 4. Expansão grande: trilhas completas + câmera em tempo real + instrutor IA mais rico

| Item pedido | Status |
|---|---|
| Câmera em tempo real (faixas, semáforos, placas, pedestres, veículos próximos, vagas, cones, curvas, cruzamentos, posição na faixa, erros comuns) | 🔒 mesmo bloqueio da seção 2 — precisa de build nativo / Mac |
| Aulas guiadas interativas com ilustrações/setas/animações | ❌ mesmo item da seção 2 |
| Trilhas completas novas: Fundamentos do Câmbio Manual, Controle Básico do Veículo, Consciência no Trânsito, Direção Urbana, Direção em Rodovias, Condições Adversas, Conhecimento do Veículo | ❌ nenhuma dessas existe — é a expansão de conteúdo mais ambiciosa do pedido inteiro. Hoje só existem as 6 manobras + checklist + direção suave. |
| IA explicando o porquê de cada acerto/erro e o que praticar na próxima sessão | ✅ **feito em 2026-08-07** — `SYSTEM_PROMPT`/`PHOTO_SYSTEM_PROMPT` em `coach.py` reescritos pra pedir 3 partes na resposta (o que os números/foto mostram, por que isso importa, sugestão concreta pra próxima sessão) em vez de 1-2 frases genéricas — ajuste de prompt, sem endpoint novo; não testado com chamada real porque a chave da Anthropic no `.env` do backend está vazia (só placeholder) |
| Progressão de aulas com níveis dentro de cada trilha (ex: Câmbio Manual Nível 1 → 2 → ... → 6) | ❌ o modelo de dados continua "habilidade feita/atual/travada" baseado em quiz+prática — não tem conceito de "nível dentro de uma trilha com várias aulas" |
| Instrutor conseguir navegar pelo app, não só o painel | ✅ **feito em 2026-08-07** — `src/app/instrutor/trilha.tsx` e `praticas.tsx`, mesmos componentes visuais do aluno em modo só-leitura, alimentados por `GET /instructors/overview` + novo `GET /instructors/quiz-phases` |

---

## Do que dá pra tirar uma leitura geral

O pedido inteiro, junto, é essencialmente: **transformar o app de "treinador de manobras" pra "autoescola completa"** — conteúdo de fundamentos de veículo do zero, trilhas muito mais numerosas e estruturadas, aulas com ilustração/animação, guiagem por voz bem mais granular, e (quando possível) câmera analisando em tempo real. É trabalho de meses, não de uma leva.

Pra fatiar isso de forma realista, dá pra pensar em blocos mais ou menos independentes:

- **A. Contas/Configurações** — ✅ feito (2026-08-06): tela de Configurações, editar perfil, trocar senha logado, persistência de fotos e feedback de IA, esqueci senha via Resend (falta só a chave de API pra ativar o envio de verdade).
- **B. Reorganizar trilha + quiz existentes** — ✅ feito (2026-08-07): `SKILLS` reordenada em Fundamentos → Trânsito → Manobras, `QUIZ_PHASE_ORDER` alinhada, quiz exige prática antes de liberar a próxima fase.
- **C. Conteúdo de Fundamentos do Veículo e Direção no Trânsito do zero** — ✅ feito (2026-08-07), de forma autônoma (autorizado pelo usuário: "pode fazer tudo, depois a gente corrige as coisas"). 11 habilidades novas em `src/constants/skills.ts` (postura ao dirigir, pedais e embreagem, ponto de embreagem, ligar/desligar, trocar marchas, controle em baixa velocidade, placas e sinalização, semáforos e prioridade, distância e espelhos, mudança de faixa, direção defensiva), cada uma com descrição + 5-6 dicas sequenciais + maneuver próprio (loga em Prática Manual e funciona em Modo Copiloto). 66 perguntas de quiz novas (6 por habilidade) em `backend/app/db/seed.py`, inseridas no banco dev via `seed_quiz_questions` (agora idempotente por categoria, não pela tabela inteira, pra aceitar categorias novas sem duplicar as existentes). **Checado contra fonte oficial em 2026-08-07** (a pedido do usuário, antes de considerar publicado): pesquisado CTB (art. 61 velocidade, 65 cinto, 192 distância, 201 ciclista) e o padrão de sinalização do CONTRAN. Achou e corrigiu dois erros reais: placa de advertência descrita como "triangular com borda vermelha" (errado — é losango amarelo com borda preta) e uma pergunta inventada sobre "semáforo vermelho piscante" (não existe previsão legal pra isso, só o amarelo intermitente é padronizado) — ambos corrigidos em `skills.ts`, `seed.py` e diretamente no banco dev (commit `b22f799`). **Ainda sem revisão**: tom/profundidade pedagógica e o conteúdo puramente mecânico (embreagem/câmbio/pedais), que não tem uma fonte legal pra checar — escrito a partir de convenção geral de autoescola.
- **D. Aulas guiadas mais visuais** — 🚧 parcial. A parte de voz mais granular está feita (2026-08-07): Modo Copiloto já era genérico sobre `skill.tips`, então todas as 19 habilidades (novas + as 6 manobras antigas, que tinham só 3 dicas soltas) agora têm 5-6 passos curtos e sequenciais. Ilustrações/animações continuam de fora — exigem pipeline de assets/design que não existe numa sessão só de texto.
- **E. Redesenho da tela de Prática Manual** — ✅ feito (2026-08-07), de forma autônoma (autorizado pelo usuário: "pode fazer o que você conseguir sem mim"), reaproveitando 100% o sistema visual já existente (Claymorphism, `OrganicSurface`/`OrganicButton`/`FadeSlideIn`) pra reduzir o risco de sair diferente do esperado. Habilidades viraram cards com selo de dificuldade (`SkillDifficulty` novo em `skills.ts`, iniciante/intermediário/avançado, cores reaproveitadas do tema — verde/amarelo/vermelho) e a descrição da habilidade como objetivo. Foto "antes" é só referência visual (nova coluna `before_photo_path` + migração + endpoint de upload, sem IA). Foto "depois" reaproveita o endpoint de feedback de foto que já existia pra baliza/estacionamento no Modo Copiloto. Depois de salvar, mostra uma tela de resultado com resumo + fotos + feedback de texto e de foto da IA. Verificado com typecheck, 132 testes de backend (5 novos pro endpoint de foto) e Playwright.
- **F. Câmera em tempo real** — 🔒 continua bloqueado até resolver Mac/build nativo, independente de tudo o resto.
- **Extra. Instrutor navegar pelo app** — ✅ feito (2026-08-07), item da seção 4 que não tinha bloco próprio.

Só resta o que está genuinamente fora de alcance sem o usuário: a chave da Resend (esqueci-senha não manda e-mail de verdade sem ela) e a câmera em tempo real (precisa de Mac). Ilustrações/animações do Bloco D também ficam de fora — exigem um pipeline de design que não existe numa sessão só de texto.
