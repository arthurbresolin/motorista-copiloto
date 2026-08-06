# Roadmap de Produto

Consolida 4 pedidos grandes que o usuário mandou em mensagens separadas
(autenticação/workspace pessoal, melhorias de aula guiada/câmera/prática
manual, reorganização das trilhas, expansão de câmera em tempo real +
trilhas completas), cruzados com o que já foi implementado. Objetivo:
não perder pedido nenhum de vista, e servir de checklist pras próximas
levas de trabalho.

Legenda: ✅ feito · 🚧 parcialmente feito · ❌ não iniciado · 🔒 bloqueado (infra)

---

## 1. Autenticação e workspace pessoal

| Item pedido | Status |
|---|---|
| Tela de login | ✅ `src/app/(auth)/entrar.tsx` |
| Tela de cadastro | ✅ `src/app/(auth)/cadastro.tsx` |
| Esqueci minha senha (fluxo por e-mail) | ❌ não iniciado — precisa de infra de envio de e-mail (SMTP ou API tipo Resend/SendGrid), que o app não tem hoje. Decisão pendente: vale a pena configurar isso pra um app pessoal, ou um reset mais simples (ex: eu troco a senha direto no banco se precisar) resolve por enquanto? |
| Redefinição de senha | ❌ mesma dependência acima |
| Logout | ✅ botão "Sair" no Perfil |
| "Lembrar de mim" | 🚧 hoje o login já fica válido por 365 dias sempre (sem opção de escolher) — não existe um checkbox "lembrar de mim" que ligue/desligue isso |
| Sessão seguro | ✅ JWT com claim de role + bcrypt |
| Design moderno/premium consistente com o resto do app | ✅ telas reusam os componentes Clay já existentes |
| Isolamento de dados por conta: progresso, trilha, XP, nível, conquistas, streak, quiz, sessões guiadas/manuais, estatísticas | ✅ tudo isolado por `learner_id` |
| Isolamento de "AI feedback" | ❌ **feedback da IA não é salvo em lugar nenhum hoje** — é gerado na hora e mostrado, não fica em histórico. Não tem o que isolar porque não existe persistência ainda. |
| Isolamento de "fotos tiradas durante exercícios" | ❌ **fotos não são salvas hoje** — vão direto pro Gemini analisar e são descartadas depois da resposta |
| "Challenges" | ❌ não existe como conceito separado (temos só Conquistas/achievements) |
| Configurações pessoais | ❌ tela de Configurações inteira não existe |
| Editar informações pessoais / trocar foto de perfil / trocar senha (autenticado) | ❌ não existe (isso é diferente do "esqueci senha" — aqui é trocar já logado) |
| Notificações / preferências do app | ❌ não existe sistema de notificação nenhum ainda |
| Sincronização entre aparelhos | ✅ automático, já que tudo vem do servidor |

---

## 2. Aula guiada, câmera e prática manual

| Item pedido | Status |
|---|---|
| Aulas ilustradas (setas, animação de volante, diagramas de posição, referências de estacionamento, áreas de perigo, exemplos animados) | ❌ hoje o Modo Copiloto é só texto falado (voz), sem nenhuma ilustração/animação |
| Modo guiado "mais inteligente" com instruções curtas e contínuas (tipo "agora pise na embreagem", "engate a primeira", "solte devagar", "boa", "olhe os espelhos"...) | ❌ hoje fala só 2-3 dicas fixas por habilidade (`skill.tips`), sem granularidade de passo-a-passo real de condução |
| Câmera assistindo em tempo real durante a aula guiada (centralização na faixa, referências de estacionamento, cones, semáforo, placa de pare, posição do carro, confirmar conclusão do passo) | 🔒 bloqueado — precisa de vídeo contínuo processado (`react-native-vision-camera` + frame processors ou similar), que exige build nativo custom. Sem Mac isso não roda (já documentado em `docs/roadmap-visao-computacional.md`, Fase B). |
| Foto do resultado integrada ao modo guiado (não só na prática manual) | ✅ já existe — botão "📷 Foto do resultado" no fim do Modo Copiloto pra baliza/estacionamento |
| Guardar as fotos pra rever depois / comparar progresso / histórico visual | ❌ a captura existe, mas a foto não fica salva (mesmo gap do item de "fotos" da seção 1) |
| Redesenho da tela de Prática Manual (cards maiores, descrição rica, duração estimada, dificuldade, habilidades necessárias, preview visual, objetivos de aprendizado, indicador de progresso, próxima aula recomendada, atalho pro modo guiado, foto antes/depois, feedback de IA) | ❌ hoje é um formulário simples (`nova-pratica.tsx`) |

---

## 3. Reorganização das trilhas e dos quizzes

| Item pedido | Status |
|---|---|
| Reordenar trilhas: 1) Fundamentos do veículo (pedais, embreagem, câmbio, ponto de embreagem, ligar/desligar, arrancar, trocar marcha, não morrer o carro, postura, ajuste de banco/espelho) → 2) Direção no trânsito (placas, sinalização, semáforo, distância segura, faixas, cruzamentos, rotatórias, direção defensiva) → 3) Manobras (baliza, estacionamento, retorno, conversões) | ❌ hoje `SKILLS` é uma lista única (`src/constants/skills.ts`) já começando por manobras (baliza é a primeira). Não existe conteúdo nenhum de "fundamentos do veículo" (embreagem, pedais, câmbio) — é uma trilha nova do zero. |
| Reformular quizzes: tirar pergunta de trânsito/manobra da primeira fase, cada quiz só cobre o que já foi ensinado, quizzes menores e mais raros | ❌ hoje `QUIZ_PHASE_ORDER` no backend já bate exatamente com o problema descrito: baliza/rotatória/estacionamento aparecem como fase de quiz logo no início |
| Espaço liberado usado pra aprofundar aulas práticas/animações/exemplos | depende dos itens acima serem feitos primeiro |

---

## 4. Expansão grande: trilhas completas + câmera em tempo real + instrutor IA mais rico

| Item pedido | Status |
|---|---|
| Câmera em tempo real (faixas, semáforos, placas, pedestres, veículos próximos, vagas, cones, curvas, cruzamentos, posição na faixa, erros comuns) | 🔒 mesmo bloqueio da seção 2 — precisa de build nativo / Mac |
| Aulas guiadas interativas com ilustrações/setas/animações | ❌ mesmo item da seção 2 |
| Trilhas completas novas: Fundamentos do Câmbio Manual, Controle Básico do Veículo, Consciência no Trânsito, Direção Urbana, Direção em Rodovias, Condições Adversas, Conhecimento do Veículo | ❌ nenhuma dessas existe — é a expansão de conteúdo mais ambiciosa do pedido inteiro. Hoje só existem as 6 manobras + checklist + direção suave. |
| IA explicando o porquê de cada acerto/erro e o que praticar na próxima sessão | 🚧 o feedback de IA já existe (`backend/app/api/coach.py`) mas é 1-2 frases curtas — não tem essa profundidade de "por que certo/errado + o que praticar depois" ainda; é mais ajuste de prompt do que feature nova |
| Progressão de aulas com níveis dentro de cada trilha (ex: Câmbio Manual Nível 1 → 2 → ... → 6) | ❌ o modelo de dados atual não tem esse conceito — hoje é "habilidade feita/atual/travada" baseado em contagem de sessões, não "nível dentro de uma trilha com várias aulas" |

---

## Do que dá pra tirar uma leitura geral

O pedido inteiro, junto, é essencialmente: **transformar o app de "treinador de manobras" pra "autoescola completa"** — conteúdo de fundamentos de veículo do zero, trilhas muito mais numerosas e estruturadas, aulas com ilustração/animação, guiagem por voz bem mais granular, e (quando possível) câmera analisando em tempo real. É trabalho de meses, não de uma leva.

Pra fatiar isso de forma realista, dá pra pensar em blocos mais ou menos independentes:

- **A. Contas/Configurações** — o que já estava no plano (Fase 2): tela de Configurações, editar perfil, trocar senha logado, + agora também: persistir fotos e feedback de IA (pra isolamento de conta fazer sentido nesses itens), decidir o que fazer com "esqueci senha".
- **B. Reorganizar trilha + quiz existentes** — reordenar o que já existe (Fundamentos → Trânsito → Manobras) e ajustar as fases de quiz pra bater com a nova ordem. É sobretudo reestruturação de conteúdo/dados, não tecnologia nova — o bloco mais rápido de atacar.
- **C. Conteúdo de Fundamentos do Veículo do zero** — escrever as aulas de embreagem/câmbio/pedais/postura que hoje não existem nada. Trabalho de conteúdo pesado.
- **D. Aulas guiadas mais visuais** — ilustrações, animações, guiagem por voz mais granular (passo a passo tipo "pise na embreagem... solte devagar..."). Trabalho de design/animação.
- **E. Redesenho da tela de Prática Manual** — cards mais ricos, preview, dificuldade, etc.
- **F. Câmera em tempo real** — 🔒 continua bloqueado até resolver Mac/build nativo, independente de tudo o resto.

Nada disso foi implementado ainda — este documento é só o inventário organizado, pra decidir juntos por onde começar.
