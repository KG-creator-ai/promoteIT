#!/usr/bin/env bash
# Run a command with a jsdom-capable Node (SPEC-015.AC-003 evidence runner).
# Selection order — portable across CI, WSL, and plain Windows:
#   1. node.exe  — Windows node (>=22 via Scoop): jsdom is fast on NTFS.
#      On WSL, loading jsdom from /mnt/d under Linux node stalls on 9p IO
#      (hundreds of small file opens), so Linux node must NOT be first here.
#   2. ~/.local/node22/bin/node — locally provisioned Node 22 (ext4 checkouts).
#   3. node (PATH) — CI images pin Node >=22 with ext4/ext4-like storage.
# If none is >=22 the test itself fails honestly (jsdom needs Node >=22).
set -e
if command -v node.exe >/dev/null 2>&1; then
  exec node.exe "$@"
fi
if [ -x "$HOME/.local/node22/bin/node" ]; then
  exec "$HOME/.local/node22/bin/node" "$@"
fi
exec node "$@"
