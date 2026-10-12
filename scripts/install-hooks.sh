#!/usr/bin/env bash
# Installs the SPEC-GRAPH pre-push gate (local net before CI).
set -e
cd "$(dirname "$0")/.."
HOOK=".git/hooks/pre-push"
cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# SPEC-GRAPH pre-push: local gate must pass before pushing (trunk-based flow).
echo "[pre-push] running SPEC-GRAPH gates (typecheck + tests + secret scan)..."
node .spec-graph/ops/gate.mjs || { echo "[pre-push] BLOCKED: fix gates before pushing."; exit 1; }
echo "[pre-push] gates green — pushing."
EOF
chmod +x "$HOOK"
echo "Installed $HOOK"
