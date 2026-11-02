/**
 * Console/page secret-leak scanner (SPEC-024.AC-003, D-007).
 *
 * The headless harness captures console output; a dependency that echoes a
 * provider key would otherwise pass unnoticed. The scanner reports WHICH
 * pattern matched and HOW OFTEN — never the matched value, so the report
 * itself can be committed or printed safely.
 */

export const LEAK_PATTERNS = [
  { id: 'github-token', re: /ghp_[A-Za-z0-9]{20,}/g },
  { id: 'github-oauth', re: /gho_[A-Za-z0-9]{20,}/g },
  { id: 'google-api-key', re: /AIza[0-9A-Za-z_-]{20,}/g },
  { id: 'openai-style-key', re: /\bsk-[A-Za-z0-9]{16,}/g },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/g },
  { id: 'slack-token', re: /xox[bap]-[A-Za-z0-9-]{10,}/g },
  { id: 'private-key', re: /-----BEGIN (RSA |OPENSSH |EC |PGP )?PRIVATE KEY-----/g },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{5,}/g },
  { id: 'gemini-rest-key', re: /\bAIzaSy[A-Za-z0-9_-]{20,}/g },
];

/**
 * Scan text for key-shaped strings.
 * @param {string|string[]} text
 * @returns {{clean: boolean, hits: {id: string, count: number}[], total: number}}
 */
export function scanForLeaks(text) {
  const chunks = Array.isArray(text) ? text : [text ?? ''];
  const joined = chunks.filter(t => typeof t === 'string' && t.length > 0).join('\n');
  const hits = [];
  let total = 0;
  for (const p of LEAK_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags);
    const matches = joined.match(re);
    if (matches && matches.length) {
      hits.push({ id: p.id, count: matches.length });
      total += matches.length;
    }
  }
  return { clean: total === 0, hits, total };
}

/**
 * Replace every matched span with a redaction marker. Used before any console
 * or page error is printed or written to the manifest.
 * @param {string} text
 */
export function redactLeaks(text) {
  let out = String(text ?? '');
  for (const p of LEAK_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : `${p.re.flags}g`);
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}
