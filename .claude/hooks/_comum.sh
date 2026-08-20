#!/usr/bin/env bash
# Utilidades compartilhadas pelos hooks. Não executar diretamente.
#
# Detecta a stack do projeto sozinho. Para sobrescrever, crie
# .claude/projeto.conf definindo as variáveis — ver modelos/projeto.conf.exemplo.

RAIZ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

bloquear() {
  echo "$1" >&2
  exit 2
}

campo_json() {
  local caminho="$1" entrada="$2"
  printf '%s' "$entrada" | python3 -c "
import json, sys
try:
    dado = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for parte in '$caminho'.split('.'):
    if not isinstance(dado, dict):
        sys.exit(0)
    dado = dado.get(parte)
    if dado is None:
        sys.exit(0)
print(dado)
" 2>/dev/null
}

# Diretórios onde procurar projetos, além da raiz.
_SUBDIRS="backend frontend api web server client app src apps/api apps/web packages/api packages/web"

# Imprime uma linha "diretorio|tipo" por projeto encontrado.
projetos_detectados() {
  local dir tipo
  for dir in "." $_SUBDIRS; do
    [ -d "$RAIZ/$dir" ] || continue
    tipo="$(tipo_do_diretorio "$RAIZ/$dir")"
    [ -n "$tipo" ] && echo "$dir|$tipo"
  done
}

tipo_do_diretorio() {
  local d="$1"
  if [ -f "$d/package.json" ]; then echo node; return; fi
  if [ -f "$d/pyproject.toml" ] || [ -f "$d/requirements.txt" ] || [ -f "$d/setup.py" ] || [ -f "$d/Pipfile" ]; then echo python; return; fi
  if [ -f "$d/composer.json" ]; then echo php; return; fi
  if [ -f "$d/go.mod" ]; then echo go; return; fi
  if [ -f "$d/Cargo.toml" ]; then echo rust; return; fi
  if [ -f "$d/pom.xml" ]; then echo maven; return; fi
  if [ -f "$d/build.gradle" ] || [ -f "$d/build.gradle.kts" ]; then echo gradle; return; fi
  if [ -f "$d/Gemfile" ]; then echo ruby; return; fi
}

# Comando de teste para (diretorio, tipo). Vazio = não há teste detectável.
comando_teste() {
  local d="$RAIZ/$1" tipo="$2"
  case "$tipo" in
    node)
      if [ -f "$d/package.json" ] && python3 -c "
import json,sys
d=json.load(open('$d/package.json'))
sys.exit(0 if (d.get('scripts') or {}).get('test') else 1)" 2>/dev/null; then
        echo "npm test --silent"
      fi
      ;;
    python)
      if [ -x "$d/.venv/bin/pytest" ]; then echo ".venv/bin/pytest -q"
      elif [ -x "$d/venv/bin/pytest" ]; then echo "venv/bin/pytest -q"
      elif command -v pytest >/dev/null 2>&1; then echo "pytest -q"
      elif [ -x "$d/.venv/bin/python" ]; then echo ".venv/bin/python -m pytest -q"
      elif command -v python3 >/dev/null 2>&1; then echo "python3 -m pytest -q"
      fi
      ;;
    php)
      if [ -x "$d/vendor/bin/phpunit" ]; then echo "vendor/bin/phpunit"
      elif [ -x "$d/vendor/bin/pest" ]; then echo "vendor/bin/pest"
      fi
      ;;
    go)     echo "go test ./..." ;;
    rust)   echo "cargo test" ;;
    maven)  echo "mvn -q test" ;;
    gradle) echo "./gradlew test" ;;
    ruby)   [ -f "$d/Rakefile" ] && echo "bundle exec rake test" ;;
  esac
}

# Verificação rápida por arquivo editado. Vazio = nada a fazer.
comando_verificacao_rapida() {
  local d="$RAIZ/$1" tipo="$2"
  case "$tipo" in
    node)
      if [ -f "$d/tsconfig.json" ] && [ -d "$d/node_modules" ]; then
        echo "npx tsc --noEmit"
      fi
      ;;
    go)   echo "go build ./..." ;;
    rust) echo "cargo check" ;;
  esac
}

# Carrega override manual, se existir. Deve vir por último.
[ -f "$RAIZ/.claude/projeto.conf" ] && . "$RAIZ/.claude/projeto.conf"
