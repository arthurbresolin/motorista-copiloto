#!/usr/bin/env bash
# PreToolUse — limites que valem mesmo com ninguém olhando.
#
# Cada bloqueio corresponde a um jeito conhecido de "fazer passar" sem resolver.
# Este arquivo é o mais portável do kit: funciona igual em qualquer linguagem,
# porque o que ele barra são padrões de git e de teste, não de stack.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_comum.sh"

ENTRADA="$(cat)"
FERRAMENTA="$(campo_json 'tool_name' "$ENTRADA")"

case "$FERRAMENTA" in
  Bash)
    COMANDO="$(campo_json 'tool_input.command' "$ENTRADA")"

    case "$COMANDO" in
      *"--no-verify"*)
        bloquear "Proibido --no-verify: ele pula exatamente a verificação que existe para proteger o projeto. Corrija o que o gate apontou." ;;
      *"push"*" main"*|*"push origin main"*|*"push"*" master"*|*"push -f"*|*"push --force"*)
        bloquear "Proibido push direto na branch principal ou com force. Trabalhe em branch e abra PR." ;;
      *"git reset --hard origin/"*|*"git clean -fdx"*)
        bloquear "Comando destrutivo sobre a árvore inteira. Se a intenção é voltar ao último commit verde, use 'git reset --hard HEAD' e registre o motivo." ;;
      *"Co-Authored-By"*|*"Co-authored-by"*|*"co-authored-by"*)
        bloquear "Co-Authored-By não é usado neste projeto. Refaça a mensagem sem essa linha." ;;
      *"pytest"*"--deselect"*|*"pytest"*" -k "*"not "*|*"vitest"*" -t "*|*"jest"*"--testPathIgnorePatterns"*)
        bloquear "Desselecionar teste para a suíte passar é mascarar regressão. Rode a suíte inteira e corrija o que quebrou." ;;
      *"--passWithNoTests"*)
        bloquear "--passWithNoTests faz a suíte passar sem executar teste algum. Se não há teste, escreva um." ;;
    esac

    RAMO="$(cd "$RAIZ" && git rev-parse --abbrev-ref HEAD 2>/dev/null)"
    case "$COMANDO" in
      *"git commit"*)
        case "$RAMO" in
          main|master)
            bloquear "Você está na $RAMO. Crie uma branch antes de commitar: git checkout -b <tipo>/<assunto>" ;;
        esac
        ;;
    esac
    ;;

  Edit|Write|MultiEdit)
    ARQUIVO="$(campo_json 'tool_input.file_path' "$ENTRADA")"
    CONTEUDO="$(campo_json 'tool_input.new_string' "$ENTRADA")$(campo_json 'tool_input.content' "$ENTRADA")"

    case "$ARQUIVO" in
      *".env"|*".env."*)
        bloquear "O .env é local e nunca se toca. Se falta uma variável, peça ao usuário e registre a pendência." ;;
    esac

    case "$ARQUIVO" in
      */tests/*|*/test/*|*/__tests__/*|*test_*.py|*_test.py|*_test.go|*Test.php|*Test.java|*.test.ts|*.test.tsx|*.test.js|*.spec.ts|*.spec.tsx|*.spec.js|*_spec.rb)
        case "$CONTEUDO" in
          *"mark.skip"*|*"mark.xfail"*|*"pytest.skip("*|*".skip("*|*".todo("*|*"xit("*|*"xdescribe("*|*"t.Skip("*|*"markTestSkipped"*|*"markTestIncomplete"*|*"@Ignore"*|*"#[ignore]"*)
            bloquear "Você está desativando um teste em $ARQUIVO.

Teste que falha é bug no código, nunca no teste.
Se o teste ficou obsoleto de verdade, pare, registre o caso e espere o usuário
decidir. Não decida sozinho." ;;
        esac
        ;;
    esac
    ;;
esac

exit 0
