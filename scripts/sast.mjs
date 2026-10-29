// sast.mjs — SAST-lite for zero-backend TS/React (SPEC-015.AC-001).
// Zero-dep pattern scan over src/**: unsafe sinks, secret patterns, crypto misuse.
// Exit 1 on any finding. Findings need triage (fix or ADR allowlist) — never silence.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const RULES = [
  { id: 'EVAL', re: /(^|[^\w$.])eval\s*\(/, msg: 'eval() — arbitrary code execution sink' },
  { id: 'NEWFUNC', re: /new\s+Function\s*\(/, msg: 'new Function() — code execution sink' },
  { id: 'INNERHTML', re: /\.innerHTML\s*[+]?=/, msg: 'innerHTML assignment — use DOMPurify or React rendering' },
  { id: 'HARDCODED-OPENAI', re: /sk-[A-Za-z0-9]{10,}/, msg: 'possible hardcoded OpenAI-style key' },
  { id: 'HARDCODED-GOOGLE', re: /AIza[0-9A-Za-z_-]{20,}/, msg: 'possible hardcoded Google API key' },
  { id: 'HARDCODED-GH', re: /ghp_[A-Za-z0-9]{20,}/, msg: 'possible hardcoded GitHub token' },
  { id: 'HARDCODED-KEY-ASSIGN', re: /(api[_-]?key|secret)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i, msg: 'possible hardcoded key/secret assignment' },
  { id: 'PRIVATE-KEY', re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/, msg: 'private key material in source' },
];

const CRYPTO_FILES = ['src/lib/security.ts', 'src/lib/webauthn.ts'];

for (const f of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((line, i) => {
    // dangerouslySetInnerHTML is allowed ONLY with a sanitizer in the same file
    if (line.includes('dangerouslySetInnerHTML') && !/DOMPurify|sanitize/i.test(txt)) {
      findings.push(`${rel}:${i + 1} [UNSANITIZED-DIH] dangerouslySetInnerHTML without sanitizer in file`);
    }
    for (const r of RULES) {
      if (r.re.test(line)) findings.push(`${rel}:${i + 1} [${r.id}] ${r.msg}`);
    }
    if (CRYPTO_FILES.some(c => rel.endsWith(c.split('/').pop())) && /Math\.random/.test(line)) {
      findings.push(`${rel}:${i + 1} [WEAK-RNG] Math.random in crypto/auth module`);
    }
  });
}

if (findings.length) {
  console.log(`SAST-LITE FAIL — ${findings.length} finding(s):`);
  for (const f of findings) console.log(' - ' + f);
  process.exit(1);
}
console.log(`SAST-LITE PASS — ${walk(path.join(root, 'src')).length} files scanned, 0 findings`);
