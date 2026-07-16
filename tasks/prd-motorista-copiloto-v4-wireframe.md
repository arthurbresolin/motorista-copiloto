# PRD: Motorista Copiloto — v4 (Wireframe: Dashboard, Tema, Carros, Mapa no Monitor)

## Introduction

Origem: projeto de design em claude.ai/design ("App aprendizagem dirigir", arquivo `Wireframes.dc.html`), um canvas de exploração com 4 estruturas de navegação alternativas (1a–1d) e 3 adições possíveis (2a–2c). Depois de resumir as opções pro usuário, foram escolhidas: estrutura **1b — Dashboard hub**, mais as três adições **2a — Tema**, **2b — Mapa na prática** e **2c — Perfil do carro**.

Dado o tamanho da combinação, o trabalho foi planejado em 4 estágios sequenciais (tema → carros → dashboard → mapa no monitor) e implementado como tal, cada um testado de ponta a ponta e commitado/enviado separadamente.

## v4.1 — Tema (2a)

- [x] Paleta laranja pastel (claro) / verde pastel (escuro), hex exatos do CSS do próprio wireframe.
- [x] Novos tokens `accent`/`onAccent` em `src/constants/theme.ts` (antes só existiam 5 tokens).
- [x] CTAs primários das telas restilizados pra preenchimento sólido com `accent`.
- **Decisão confirmada com o usuário**: só a paleta de cores, sem a estética "rascunho" do wireframe (fonte cursiva, bordas grossas, sombras deslocadas) — ficaria pra um redesign maior, fora de escopo.

## v4.2 — Carros (2c)

- [x] Recurso `cars` no backend (marca/modelo, placa, câmbio).
- [x] `practice_sessions.car_id` (FK nullable).
- [x] Modal `/meu-carro` (listar/cadastrar).
- [x] Seletor de carro (single-select) no topo do formulário de nova prática.
- **Non-goal explícito**: checklist personalizada por carro fica fora de escopo por ora.
- **Nota técnica**: adicionar uma FK via `ALTER TABLE` no SQLite exige `batch_alter_table` explícito no Alembic — o autogenerate não gera isso sozinho e falha em runtime sem avisar em tempo de geração (só descoberto ao aplicar a migration contra o banco real, não via pytest).

## v4.3 — Dashboard "Início" (1b)

- [x] Checklist deixa de ser aba, vira modal `/checklist`.
- [x] Nova home "Início": streak (dias seguidos), atalhos (Checklist/Praticar), gráfico de minutos praticados nos últimos 7 dias, CTA "Sair pra dirigir". Tudo calculado no cliente a partir de `GET /practice-sessions` (aproximação aceitável dado o cap de 50 sessões já existente desde a v1).
- [x] Aba "Histórico" renomeada pra "Práticas", com totais (sessões/km/horas) via novo `GET /practice-sessions/stats`.
- [x] Limpeza das sobras do template Expo na tab bar web ("Expo Starter", link pra docs.expo.dev).

## v4.4 — Mapa no Monitor (2b)

- [x] `expo-location` + `react-native-svg` adicionados. Permissão configurada via plugin do `expo-location` em `app.json` (não editar `Info.plist`/`AndroidManifest.xml` na mão).
- [x] `monitor_sessions.route` (JSON nullable, lista de `{lat, lng, harsh}`).
- [x] Rastreamento de rota via `Location.watchPositionAsync` como assinatura independente da do acelerômetro — GPS é estritamente aditivo: falha de permissão ou de sensor não interrompe o monitoramento por acelerômetro.
- [x] `src/lib/route-projection.ts` (normalização min/max, inversão do eixo Y, guarda contra bounding box degenerada) + `src/components/route-map.tsx` (SVG estilizado, não mapa real com tiles) renderizado nos cards de "Sessões anteriores".

### Achado durante o teste desta etapa: bug pré-existente no Monitor (web)

Ao testar a interação real de "Iniciar monitoramento" pela primeira vez via clique de verdade (nas etapas anteriores da v2/v2.1/v2.2, as sessões de teste sempre foram simuladas via `curl` direto no backend, nunca clicando o botão de fato), foi descoberto que `Accelerometer.addListener` quebra no navegador com `TypeError: this._nativeModule.addListener is not a function`. É um bug do próprio pacote `expo-sensors@57.0.1`: o shim web (`ExponentAccelerometer.web.js`) não implementa `addListener`/`listenerCount`/`removeAllListeners` que a classe base `DeviceSensor` espera — incompatibilidade interna do pacote, não algo introduzido por este projeto. Confirmado que o problema já existia desde o primeiro commit do Monitor (v2), não é uma regressão da v4.

**Não afeta dispositivos reais** (iOS/Android) — só o shim web usado pra desenvolvimento neste ambiente. Fica como débito técnico conhecido: atualizar `expo-sensors` (ou reportar upstream) quando for testar/usar o Monitor no navegador.

## Technical Considerations gerais

- Todos os 4 estágios seguiram o padrão já estabelecido: model/schema/api espelhando os recursos existentes, migrations isoladas por mudança lógica, testes de round-trip incluindo casos de borda (banco vazio, valores nulos), verificação manual contra o banco SQLite real (não só via pytest, que contorna a Alembic via `create_all`).
- Testado via Playwright + Chromium headless contra `expo start --web` em cada estágio, com screenshots conferidos visualmente antes de cada commit.
