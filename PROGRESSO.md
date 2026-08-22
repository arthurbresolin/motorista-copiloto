# Progresso

Diário de execução do `PLANO.md`. O Claude Code escreve aqui ao fim de cada
sessão; o usuário lê aqui para saber o que aconteceu enquanto esteve fora.

Bloco mais recente no topo. Cada bloco registra o que foi **medido**, não o que
foi tentado. "Corrigi o extrator" não é registro; "120 → 123 testes, e o novo
caso falha ao reverter o commit" é.

---

## 2026-08-22 — assinatura mensal (RevenueCat), backend

**Branch:** `assinatura-revenuecat-backend` — push feito, 1 commit

**Baseline confirmado antes de iniciar**

- `uv run pytest -q`: 133 passed (depois de puxar 65 commits do Arthur pro
  master local via merge — ver `docs/roadmap-produto.md` pro estado real do
  projeto antes desta sessão)

---

### Modelo de assinatura e webhook do RevenueCat (commit `8b6768c`)

- Tabela `subscriptions` (1:1 com `learners`), migração Alembic
  `649379d573e6`
- `POST /subscriptions/revenuecat/webhook` — autenticado por
  `Authorization` header comparado contra `APP_REVENUECAT_WEBHOOK_SECRET`
  (`hmac.compare_digest`); sem segredo configurado, rejeita tudo (401)
- `GET /learners/me/subscription` — `active` computado como
  `expires_at > agora`, sem campo de status próprio (mesmo campo resolve
  INITIAL_PURCHASE/RENEWAL/CANCELLATION/EXPIRATION)
- **133 → 142** testes (9 novos em `test_subscriptions_api.py`)
- `uv run pytest -q` → 142 passed ✓

### Status da assinatura em Configurações (commit `d5a8796`)

- `npm install` (package.json do Arthur tinha dependências novas —
  `expo-camera`, `expo-speech`, `expo-haptics`, `react-native-svg` etc. —
  ainda não instaladas nesta máquina)
- `src/api/subscription.ts` + `src/hooks/use-subscription.ts` consumindo
  `GET /learners/me/subscription`
- Card "Plano" em Configurações: "Premium ativo" + data de renovação, ou
  "Plano gratuito" — sem botão de assinar ainda (propositalmente: um botão
  que não compra nada seria uma tela quebrada, não um MVP)
- `.expo/types/router.d.ts` estava desatualizado desde 14/07 (só tinha as
  rotas do template original) — rodei `npx expo start --offline` 25s em
  background só pra regenerar, depois matei o processo
- `npx tsc --noEmit` → limpo (exit 0), incluindo todos os erros de rota que
  apareciam antes por causa do arquivo de tipos desatualizado

**Estado final da sessão**

- 142 testes de backend passando, typecheck do mobile limpo
- Frontend: só leitura de status implementada. SDK `react-native-purchases`
  (compra de verdade) e paywall ainda não iniciados — dependem de build
  nativo (Xcode) e conta RevenueCat, ambos em andamento pelo usuário em
  paralelo
- **Achado que trava o próximo passo real de assinatura, mesmo sem
  Xcode/RevenueCat**: o webhook `POST /subscriptions/revenuecat/webhook`
  só funciona com o backend acessível publicamente — hoje roda só em
  `localhost`. Deploy em nuvem (Módulo 7 do plano) é o próximo item
  genuinamente desbloqueado e necessário pra assinatura funcionar de
  verdade, não só decoração.

**Precisa do usuário**

- Instalar Xcode completo nesta máquina (Command Line Tools não bastam pra
  build nativo)
- Criar conta RevenueCat (https://app.revenuecat.com/signup) e passar a API
  key + configurar produtos (assinatura mensal) no App Store Connect/Play
  Console quando chegar a hora de testar de verdade
- Decidir sobre Apple Developer Program (US$99/ano) quando for além do
  Simulador iOS
- Decidir se seguimos com deploy do backend em nuvem agora (envolve criar
  conta/provisionar serviço pago — não avanço sozinho nisso)

---

## 2026-08-22 — deploy do backend no Vercel

**Branch:** `deploy-backend-vercel` — push feito, 2 commits

**Baseline confirmado antes de iniciar**

- `uv run pytest -q`: 142 passed (herdado da sessão anterior)

---

### Provisionamento e deploy (commits `1274d12`, `44cd1e1`)

- Projeto Vercel `motorista-copiloto-backend` criado a partir de `backend/`
  (detecção automática de FastAPI via `pyproject.toml`)
- Postgres provisionado via Marketplace (Neon) — `vercel integration add
  neon`, conectado ao projeto, env vars baixadas automaticamente
- `asyncpg` adicionado como dependência; `[tool.vercel] entrypoint =
  "app.main:app"` no `pyproject.toml`
- `APP_DATABASE_URL` configurada (produção/preview/dev) — connection string
  pooled do Neon, convertida pra `postgresql+asyncpg://`, sem `sslmode`
  nem `channel_binding` (SQLAlchemy 2.x + asyncpg não reconhecem esses
  parâmetros — dá `TypeError`/`unexpected keyword argument`)
- `APP_JWT_SECRET_KEY` gerada (32 bytes aleatórios) e configurada só em
  produção/preview — o valor hardcoded de dev nunca teria que vazar pra
  produção
- Proteção SSO do Vercel desativada pro projeto (`vercel project protection
  disable --sso`) — sem isso, toda chamada de fora (app mobile, webhook do
  RevenueCat) batia num redirect de login em vez da API

**Dois bugs achados rodando pela primeira vez contra Postgres de verdade**
(SQLite mascarava os dois — nenhum é meu, são do Arthur, mas travavam o
deploy):

1. `server_default='1'`/`'0'` em coluna Boolean — SQLite aceita, Postgres
   dá `DatatypeMismatchError`. Fix: `sa.true()`/`sa.false()` (traduz certo
   por dialeto) nas migrações `2dfa38d266be` e `4a793432210d`.
2. `INSERT INTO learners (id, ...) VALUES (1, ...)` não avança a sequence
   do Postgres — primeiro `POST /learners/register` em produção colidia
   com `UniqueViolationError`. Fix: `setval()` condicional a
   `dialect=='postgresql'` na migração `7812fa33b880`.

**Achado à parte, também travava tudo**: `MEDIA_DIR.mkdir()` no import de
`main.py` derrubava o app inteiro em serverless (filesystem read-only fora
de `/tmp`) — não era só upload de foto quebrado, era um 500 em **toda**
rota. Fix: `MEDIA_DIR` configurável via `APP_MEDIA_DIR` (Vercel usa
`/tmp/media`). **Isso é armazenamento efêmero — fotos não sobrevivem entre
invocações/deploys em produção.** Solução definitiva pendente: migrar
avatar/fotos de prática pra um storage de verdade (Vercel Blob).

**Teste de fumaça em produção**: registro, login, perfil, status de
assinatura, checklist — todos OK contra o Postgres real. Registros de
teste removidos do banco depois.

**Estado final da sessão**

- Backend em produção: `https://motorista-copiloto-api.vercel.app`
- 142 testes locais continuam passando (SQLite intacto)
- Webhook do RevenueCat agora é alcançável de verdade — falta só a conta
  RevenueCat apontar pra essa URL

**Precisa do usuário**

- Instalar Xcode completo (Command Line Tools não bastam pra build nativo)
- Criar conta RevenueCat, configurar produtos, e apontar o webhook para
  `https://motorista-copiloto-api.vercel.app/subscriptions/revenuecat/webhook`
  com o `APP_REVENUECAT_WEBHOOK_SECRET` (ainda não configurado no Vercel —
  falta o valor real vindo do painel do RevenueCat)
- Decisão consciente pendente: fotos (avatar, prática) não persistem em
  produção até migrarmos pra Vercel Blob — tudo o mais já funciona

**Próxima tarefa**

Assim que Xcode e conta RevenueCat estiverem prontos: SDK
`react-native-purchases` no mobile e tela de paywall, apontando o app pra
`https://motorista-copiloto-api.vercel.app` em vez de localhost.

---

## <AAAA-MM-DD> — <assunto da sessão>

**Branch:** <nome> — push feito, N commits

**Baseline confirmado antes de iniciar**

- <comando>: <resultado>

---

### <Título da tarefa> (commit <hash>)

- <o que mudou>
- **<número antes> → <número depois>** testes
- <comando de verificação> → <saída> ✓

**Estado final da sessão**

- <métricas>

**Travou**

- <o que tentou, o que observou, hipótese>

**Precisa do usuário**

- <decisão ou acesso pendente>

**Próxima tarefa**

<título>
