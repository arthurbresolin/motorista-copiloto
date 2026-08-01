# Roadmap: Visão Computacional

Documento de planejamento — nada aqui foi implementado ainda.

## Restrição principal

O app hoje roda via Expo Go, sem build nativo customizado — é o que permite
testar no iPhone sem conta paga da Apple (decisão já tomada: sem gastar com
Apple Developer Program).

Visão computacional "de verdade" (vídeo em tempo real com modelo rodando no
aparelho) exige um build nativo customizado, que **não funciona no Expo Go**.
Builds nativos de iOS precisam de Xcode (só roda em Mac) ou do EAS Build
(nuvem) + assinatura via conta Apple — instalar fora da App Store/TestFlight
sem pagar exige provisionamento via Xcode com Apple ID grátis, o que por sua
vez exige um Mac. O ambiente de desenvolvimento atual é Linux.

**Na prática**: qualquer fase que exija build nativo fica bloqueada até
existir acesso a um Mac (ou decisão de pagar a Apple Developer Program,
$99/ano).

## Fase A — Funciona hoje, sem build nativo (ponto de partida recomendado)

Usa `expo-camera` (já suportado no Expo Go) pra tirar **uma foto** em
momentos específicos e manda pra Claude Vision analisar — a mesma
integração de IA já usada no feedback de texto (`backend/app/api/coach.py`),
só que passando uma imagem em vez de só números da sessão.

Não é vídeo em tempo real, mas cobre casos reais de valor:

- **Checklist visual**: foto dos espelhos/painel antes de sair — IA confirma
  se estão bem ajustados.
- **Resultado da baliza/estacionamento**: foto do carro estacionado ao final
  do exercício — IA avalia alinhamento e distância dos carros vizinhos,
  complementando o feedback de texto que já existe.
- **Fixação do celular no suporte**: uma foto antes de começar o Modo
  Copiloto, pra confirmar que o ângulo está bom pro sensor de movimento
  funcionar bem.

Custo: cada foto analisada é uma chamada paga à API da Anthropic — mesma
chave já configurada, sem infraestrutura nova.

Escopo técnico aproximado, se/quando for pra frente:
- `expo-camera` pra capturar a foto (permissão de câmera já é um padrão
  conhecido no Expo).
- Endpoint novo no backend (ou extensão do `/coach`) que recebe a imagem
  (Files API da Anthropic ou base64 direto) e devolve o feedback.
- Tela nova ou passo a mais dentro do Modo Copiloto / Checklist pra
  capturar e mostrar o resultado.

## Fase B — Precisa de build nativo (bloqueada até resolver o Mac/orçamento)

Vídeo em tempo real processado no próprio aparelho (sem custo por chamada de
API), usando bibliotecas como `react-native-vision-camera` + frame
processors com um modelo leve (TensorFlow Lite / ML Kit). Daria pra fazer:

- Detecção de faixa / se o carro está se afastando do centro da via.
- Distância estimada do carro da frente (heurística por visão, não é LIDAR).
- Detecção de fadiga/distração via câmera voltada pro motorista — levanta
  questões de privacidade sérias, precisaria ser bem opt-in e claro sobre
  o que é gravado/processado e onde.

Cada um desses itens é, sozinho, um projeto técnico grande: escolher ou
treinar um modelo, otimizar performance no aparelho, lidar com variação de
luz/ângulo/mount do celular. Fica pra quando o bloqueio de build nativo for
resolvido.

## Recomendação

Quando fizer sentido começar visão computacional de verdade, começar pela
Fase A (foto pontual da baliza ou do checklist + Claude Vision) — é a única
que dá pra testar no iPhone atual sem gastar em infraestrutura nova, e
reaproveita a integração de IA que já existe no app.
