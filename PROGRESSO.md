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

**Estado final da sessão**

- 142 testes de backend passando
- Frontend (SDK RevenueCat, paywall) ainda não iniciado

**Precisa do usuário**

- Instalar Xcode completo nesta máquina (Command Line Tools não bastam pra
  build nativo)
- Criar conta RevenueCat (https://app.revenuecat.com/signup) e passar a API
  key + configurar produtos (assinatura mensal) no App Store Connect/Play
  Console quando chegar a hora de testar de verdade
- Decidir sobre Apple Developer Program (US$99/ano) quando for além do
  Simulador iOS

**Próxima tarefa**

Integrar o SDK `react-native-purchases` no mobile (exige sair do Expo Go —
dev client custom) e construir a tela de paywall, assim que Xcode e conta
RevenueCat estiverem prontos.

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
