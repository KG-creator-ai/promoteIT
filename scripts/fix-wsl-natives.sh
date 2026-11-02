#!/usr/bin/env bash
# WSL-only: installs Linux native binaries for rollup/esbuild/lightningcss/
# @tailwindcss/oxide that Windows npm refuses to install (it detects win32 and
# rejects --os=linux overrides). CI (ubuntu) does not need this — `npm ci` there
# resolves linux natives natively.
# Re-run after any `npm install` that prunes these manual extractions.
set -e
cd "$(dirname "$0")/.."
ROLLUP_VER=$(node -e "console.log(require('./node_modules/rollup/package.json').version)")
ESBUILD_VER=$(node -e "console.log(require('./node_modules/esbuild/package.json').version)")
LIGHTNING_VER=$(node -e "console.log(require('./node_modules/lightningcss/package.json').version)")
OXIDE_VER=$(node -e "console.log(require('./node_modules/@tailwindcss/oxide/package.json').version)")
TMPD=$(mktemp -d)
curl -sL -o "$TMPD/rollup.tgz" "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-${ROLLUP_VER}.tgz"
curl -sL -o "$TMPD/esbuild.tgz" "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-${ESBUILD_VER}.tgz"
curl -sL -o "$TMPD/lightningcss.tgz" "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-${LIGHTNING_VER}.tgz"
curl -sL -o "$TMPD/oxide.tgz" "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-${OXIDE_VER}.tgz"
mkdir -p node_modules/@rollup/rollup-linux-x64-gnu node_modules/@esbuild/linux-x64
mkdir -p node_modules/lightningcss-linux-x64-gnu node_modules/@tailwindcss/oxide-linux-x64-gnu
tar -xzf "$TMPD/rollup.tgz" -C node_modules/@rollup/rollup-linux-x64-gnu --strip-components=1
tar -xzf "$TMPD/esbuild.tgz" -C node_modules/@esbuild/linux-x64 --strip-components=1
tar -xzf "$TMPD/lightningcss.tgz" -C node_modules/lightningcss-linux-x64-gnu --strip-components=1
tar -xzf "$TMPD/oxide.tgz" -C node_modules/@tailwindcss/oxide-linux-x64-gnu --strip-components=1
rm -rf "$TMPD"
echo "Linux natives installed for rollup@$ROLLUP_VER esbuild@$ESBUILD_VER lightningcss@$LIGHTNING_VER oxide@$OXIDE_VER"
node ./node_modules/vitest/vitest.mjs run tests/unit/no-mocks.test.ts 2>&1 | tail -4
