#!/usr/bin/env bash
# PostToolUse — verificação rápida do arquivo recém-editado.
# Barato de propósito: roda a cada edição, então nunca roda a suíte.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_comum.sh"

ENTRADA="$(cat)"
ARQUIVO="$(campo_json "tool_input.file_path" "$ENTRADA")"
[ -n "$ARQUIVO" ] || exit 0

# Erro de sintaxe, quando a linguagem permite checar barato.
case "$ARQUIVO" in
  *.py)
    if command -v python3 >/dev/null 2>&1; then
      SAIDA="$(python3 -m py_compile "$ARQUIVO" 2>&1)" || bloquear "Erro de sintaxe em $ARQUIVO:

$SAIDA"
    fi
    ;;
  *.php)
    if command -v php >/dev/null 2>&1; then
      SAIDA="$(php -l "$ARQUIVO" 2>&1)" || bloquear "Erro de sintaxe em $ARQUIVO:

$SAIDA"
    fi
    ;;
  *.json)
    if command -v python3 >/dev/null 2>&1; then
      SAIDA="$(python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$ARQUIVO" 2>&1)" \
        || bloquear "JSON inválido em $ARQUIVO:

$SAIDA"
    fi
    ;;
esac

# Verificação de tipos do projeto a que o arquivo pertence.
case "$ARQUIVO" in
  *.ts|*.tsx|*.go|*.rs)
    while IFS='|' read -r dir tipo; do
      [ -n "$dir" ] || continue
      case "$ARQUIVO" in
        *"/$dir/"*) ;;
        *) [ "$dir" = "." ] || continue ;;
      esac
      CMD="$(comando_verificacao_rapida "$dir" "$tipo")"
      [ -n "$CMD" ] || continue
      SAIDA="$(cd "$RAIZ/$dir" && eval "$CMD" 2>&1)" || bloquear "Verificação de tipos falhou em $dir:

$(printf '%s' "$SAIDA" | tail -30)

Corrija antes de seguir."
    done < <(projetos_detectados)
    ;;
esac

exit 0
