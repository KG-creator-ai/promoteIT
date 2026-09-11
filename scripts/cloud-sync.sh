#!/usr/bin/env bash
set -e

# Promote-IT AV Studio — Automated Cloud Sync Protocol (Protocol 4)
# Target Branch: main

TARGET_BRANCH="main"

echo "===================================================="
echo "  Promote-IT AV Studio — Automated Git Cloud Sync  "
echo "  Target Branch: ${TARGET_BRANCH}                  "
echo "===================================================="

cd "$(dirname "$0")/.."

echo "[1/4] Running TypeScript validation..."
npx tsc --noEmit
echo "  ✓ TypeScript check passed."

echo "[2/4] Running Production Build..."
npm run build
echo "  ✓ Production build successful."

echo "[3/4] Staging and committing changes..."
if [ ! -d ".git" ]; then
  echo "  Git repository not initialized. Initializing..."
  git init
  git checkout -b "${TARGET_BRANCH}" || git checkout "${TARGET_BRANCH}"
fi

# Ensure git author identity is set
if [ -z "$(git config user.name)" ]; then
  git config user.name "kunal.gawade"
fi
if [ -z "$(git config user.email)" ]; then
  git config user.email "kunal.gawade@arkafincap.com"
fi

git add -A
COMMIT_MSG="feat(engine): multi-project resource stitching, dexie v3 migration & knowledge graph [$(date -u +"%Y-%m-%dT%H:%M:%SZ")]"

if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "  No uncommitted changes detected. Repository clean."
else
  git commit -m "${COMMIT_MSG}"
  echo "  ✓ Changes committed: ${COMMIT_MSG}"
fi

echo "[4/4] Cloud Sync / Push..."
REMOTE_EXISTS=$(git remote 2>/dev/null | grep origin || true)
if [ -n "$REMOTE_EXISTS" ]; then
  echo "  Pushing to origin/${TARGET_BRANCH}..."
  git push -u origin "${TARGET_BRANCH}"
  echo "  ✓ Pushed successfully to origin/${TARGET_BRANCH}."
else
  echo "  ⚠ No remote 'origin' configured. Committed locally to branch '${TARGET_BRANCH}'."
  echo "  Run 'git remote add origin <repo_url>' to connect a remote."
fi

echo "===================================================="
echo "  Cloud Sync Completed Successfully!               "
echo "===================================================="
