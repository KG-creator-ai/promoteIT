#!/usr/bin/env node
// decision-gate.mjs — pre-action policy gate for the harness (SPEC-023, D19).
// Adapts IBM Research's JevAct (arXiv 2610.38620): domain policies compiled
// into executable state checks, evaluated BEFORE a consequential action runs,
// with structured feedback, bounded revision and premature-termination
// detection. Model-agnostic, zero-backend, fail-closed.
//
// Usage:
//   node decision-gate.mjs check --action verify --atom SPEC-020.AC-001 [--cmd "..."] [--paths a,b]
//   node decision-gate.mjs check --action release --phase 10 --specs SPEC-020,...
//   node decision-gate.mjs check --action tag --target v1.3.0
//   node decision-gate.mjs list
//
// Exit 0 = allow, 1 = block (decision record + feedback on stdout).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DOMAIN_MAP } from './quorum.mjs';

const ROOT = process.env.SPEC_GRAPH_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POLICIES = path.join(ROOT, '.spec-graph/policies/policies.json');
const GRAPH = path.join(ROOT, '.spec-graph/graph.json');
const DECISION_LOG = process.env.SPEC_GRAPH_DECISION_LOG || path.join(ROOT, '.spec-graph/decisions/decisions.jsonl');
const MAX_BLOCKS = 3;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const readJSON = (p, fallback) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } };

function sh(cmd, opts = {}) {
  try {
    return { exit: 0, out: execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: opts.timeout || 900000 }).toString() };
  } catch (e) {
    return { exit: e.status ?? 1, out: ((e.stdout || '') + '' + (e.stderr || '') + '' + (e.message || '')).toString() };
  }
}

function loadPolicies() {
  const raw = readJSON(POLICIES, null);
  if (!raw || !Array.isArray(raw.policies)) return { policies: [], judgment: null, error: 'policy registry missing or unreadable' };
  return raw;
}

function graphDomainsFor(spec) {
  const g = readJSON(GRAPH, { nodes: [] });
  const domains = new Set();
  for (const n of g.nodes || []) {
    if (n.kind === 'spec_atom' && n.spec === spec) for (const d of n.domains || []) domains.add(d);
  }
  return [...domains];
}

function specOfAtom(atom) {
  const g = readJSON(GRAPH, { nodes: [] });
  const n = (g.nodes || []).find(x => x.id === atom || x.id === String(atom).replace(/\.(ev|test|task|code)$/, ''));
  return n ? n.spec : null;
}

const CHECKS = {
  no_secret_files_tracked(ctx) {
    const allow = new Set(ctx.check.allow || []);
    const out = sh('git ls-files').out.split('\n').map(s => s.trim()).filter(Boolean);
    const bad = out.filter(f => {
      if (allow.has(f)) return false;
      return /^\.env$/.test(f) || /^\.env\..+\.local$/.test(f) || /^\.env\.local$/.test(f) || /\.pem$/.test(f) || /\.key$/.test(f) || /(^|\/)id_rsa/.test(f);
    });
    return { ok: bad.length === 0, fact: bad.length ? `tracked secret-bearing files: ${bad.join(', ')}` : 'no secret-bearing file is tracked', remediation: 'untrack the file (git rm --cached) and rotate the credential if it was ever real' };
  },
  atom_exists(ctx) {
    const g = readJSON(GRAPH, { nodes: [] });
    const id = String(ctx.target || '').replace(/\.(ev|test|task|code)$/, '');
    const ok = (g.nodes || []).some(n => n.id === id);
    return { ok, fact: ok ? `atom ${id} exists` : `atom ${id} is not in the ledger`, remediation: 'run graph.mjs add-spec <SPEC-ID> or fix the atom id' };
  },
  cmd_present(ctx) {
    const ok = !!(ctx.cmd && String(ctx.cmd).trim());
    return { ok, fact: ok ? 'evidence command supplied' : 'no evidence command supplied', remediation: 'pass --cmd "<executable evidence hook>"' };
  },
  evidence_paths_exist(ctx) {
    const paths = (ctx.paths || []).filter(p => !p.endsWith('graph.json'));
    const missing = paths.filter(p => !fs.existsSync(path.join(ROOT, p)));
    return { ok: missing.length === 0, fact: missing.length ? `missing evidence paths: ${missing.join(', ')}` : `all ${paths.length} evidence path(s) exist`, remediation: 'fix the path or drop it from --paths' };
  },
  domain_mapped(ctx) {
    const spec = specOfAtom(ctx.target);
    if (!spec) return { ok: true, fact: 'no spec resolved for the target — domain mapping not applicable' };
    const domains = graphDomainsFor(spec);
    const unknown = domains.filter(d => !DOMAIN_MAP[d]);
    return { ok: unknown.length === 0, fact: unknown.length ? `${spec} declares unmapped domain(s): ${unknown.join(', ')}` : `${spec} domains all map to a persona`, remediation: 'add the domain to ops/quorum.mjs DOMAIN_MAP or fix the spec - Domains: line (D21)' };
  },
  no_self_citing_ci(ctx) {
    const head = sh('git rev-parse HEAD').out.trim();
    const cmd = String(ctx.cmd || '');
    const short = head.slice(0, 7);
    const ok = !(head && cmd.includes(head)) && !(short && cmd.includes(short));
    return { ok, fact: ok ? 'evidence command does not cite the current HEAD' : 'evidence command cites the current HEAD — a run may never cite its own success (D10)', remediation: 'cite the previous successful run/commit instead' };
  },
  no_force_push(ctx) {
    const cmd = String(ctx.cmd || '');
    const isPush = /\bpush\b/.test(cmd);
    const forced = /(^|\s)(--force|-f)(\s|$)/.test(cmd);
    return { ok: !(isPush && forced), fact: isPush && forced ? 'command performs a force-push' : 'no force-push in the command', remediation: 'never force-push; push a new commit instead (GUARDRAILS)' };
  },
  runtime_dep_requires_adr(ctx) {
    const head = sh('git show HEAD:package.json').out;
    let cur = '';
    try { cur = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'); } catch { /* no package.json */ }
    if (!head || !cur) return { ok: true, fact: 'package.json not comparable — policy not applicable' };
    const deps = (s) => { try { const p = JSON.parse(s); return { ...(p.dependencies || {}) }; } catch { return {}; } };
    const before = deps(head); const after = deps(cur);
    const added = Object.keys(after).filter(d => !(d in before));
    if (!added.length) return { ok: true, fact: 'no runtime dependency added', remediation: '' };
    let decisions = '';
    try { decisions = fs.readFileSync(path.join(ROOT, '.spec-graph/DECISIONS.md'), 'utf8'); } catch { /* missing */ }
    const undeclared = added.filter(d => !decisions.includes(d));
    return { ok: undeclared.length === 0, fact: undeclared.length ? `new runtime dependency without an ADR: ${undeclared.join(', ')}` : `new runtime dependency recorded in DECISIONS.md: ${added.join(', ')}`, remediation: 'record the dependency and its rationale in .spec-graph/DECISIONS.md (D1)' };
  },
  no_open_atoms(ctx) {
    const g = readJSON(GRAPH, { nodes: [] });
    const open = (g.nodes || []).filter(n => n.kind === 'spec_atom' && n.status !== 'verified' && n.status !== 'waived').map(n => n.id);
    return { ok: open.length === 0, fact: open.length ? `${open.length} atom(s) still open: ${open.slice(0, 6).join(', ')}${open.length > 6 ? '…' : ''}` : 'every atom is verified', remediation: 'verify the remaining atoms (graph.mjs open → implement → verify)' };
  },
  quorum_complete(ctx) {
    if (!ctx.phase || !ctx.specs || !ctx.specs.length) return { ok: true, fact: 'no phase/specs supplied — quorum policy not applicable' };
    const r = sh(`node .spec-graph/ops/quorum.mjs --phase ${ctx.phase} --specs ${ctx.specs.join(',')}`);
    let parsed = null;
    try { parsed = JSON.parse(r.out); } catch { /* non-JSON */ }
    const ok = r.exit === 0 && parsed && parsed.verdict === 'PASS';
    const detail = parsed ? `missing=[${(parsed.missing || []).join(',')}] nonApprove=[${(parsed.nonApprove || []).join(',')}] unknownDomains=[${(parsed.unknown || []).join(',')}]` : r.out.slice(-200);
    return { ok, fact: ok ? `tiered quorum PASS for phase ${ctx.phase}` : `tiered quorum not satisfied: ${detail}`, remediation: 'record the missing persona verdicts (phase-<NN>-<persona>.json) or remediate the request_changes' };
  },
  evidence_fresh(ctx) {
    const g = readJSON(GRAPH, { nodes: [] });
    const stale = [];
    for (const n of (g.nodes || []).filter(x => x.kind === 'evidence' && x.status === 'verified')) {
      for (const [p, h] of Object.entries(n.hashes || {})) {
        if (p.endsWith('graph.json')) continue;
        const f = path.join(ROOT, p);
        const cur = fs.existsSync(f) ? sha(fs.readFileSync(f)) : 'MISSING';
        if (cur !== h) { stale.push(`${n.id}: ${p}`); break; }
      }
    }
    return { ok: stale.length === 0, fact: stale.length ? `stale evidence: ${stale.slice(0, 5).join('; ')}` : 'no stale evidence', remediation: 're-verify the affected atoms with their stored commands' };
  },
  cert_claims_match_ledger(ctx) {
    const r = sh('node ./node_modules/vitest/vitest.mjs run tests/unit/certification-claims.test.ts');
    return { ok: r.exit === 0, fact: r.exit === 0 ? 'certification claims re-derive from the ledger and artifacts' : 'certification claims do not re-derive (certification-claims.test.ts failed)', remediation: 'refresh CERTIFICATION.md so every claim re-derives' };
  },
  gate_green(ctx) {
    const r = sh('node .spec-graph/ops/gate.mjs');
    let verdict = '';
    try { verdict = JSON.parse(r.out).verdict || ''; } catch { /* non-JSON */ }
    return { ok: r.exit === 0 && verdict === 'PASS', fact: r.exit === 0 && verdict === 'PASS' ? 'gate chain PASS' : `gate chain not green (${verdict || 'unknown'})`, remediation: 'run node .spec-graph/ops/gate.mjs and fix the failing step' };
  },
  tag_format(ctx) {
    const tag = String(ctx.target || '');
    const ok = /^v\d+\.\d+\.\d+$/.test(tag);
    return { ok, fact: ok ? `tag ${tag} matches vMAJOR.MINOR.PATCH` : `tag "${tag}" is not vMAJOR.MINOR.PATCH`, remediation: 'release tags are v1.x.y (GUARDRAILS)' };
  },
};

function readDecisionLog() {
  if (!fs.existsSync(DECISION_LOG)) return [];
  return fs.readFileSync(DECISION_LOG, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function writeDecisionLog(record) {
  if (process.env.SPEC_GRAPH_DECISION_LOG === 'off') return;
  fs.mkdirSync(path.dirname(DECISION_LOG), { recursive: true });
  fs.appendFileSync(DECISION_LOG, JSON.stringify(record) + '\n');
}

async function runJudgment(cfg, facts) {
  if (!cfg || !cfg.enabled || !cfg.actions?.length) return { status: 'not-configured', verdict: 'skipped' };
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) return { status: 'unverified-probabilistic', verdict: 'skipped', reason: 'no provider key present — the probabilistic layer did not run (it is never reported as a pass it did not obtain)' };
  const prompt = `${cfg.question}\n\nRecorded facts:\n${facts.map(f => `- ${f.policy}: ${f.fact}`).join('\n')}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 300, responseMimeType: 'application/json' } }),
    });
    if (!res.ok) return { status: 'unverified-probabilistic', verdict: 'skipped', reason: `provider returned HTTP ${res.status}` };
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(text);
    const confidence = Number(parsed.confidence);
    const pass = parsed.verdict === 'pass' && Number.isFinite(confidence) && confidence >= cfg.minConfidence;
    return { status: 'evaluated', verdict: pass ? 'pass' : 'fail', confidence, reasons: parsed.reasons || [], model: cfg.model };
  } catch (e) {
    return { status: 'unverified-probabilistic', verdict: 'skipped', reason: `judgment unavailable: ${String(e.message || e).slice(0, 120)}` };
  }
}

export async function evaluate({ action, target = '', cmd = '', paths = [], phase = '', specs = [], record = true, judgment = true } = {}) {
  const raw = loadPolicies();
  const facts = [];
  const feedback = [];
  if (raw.error) {
    return { verdict: 'block', action, target, facts, feedback: [{ policy: 'DG-000', fact: raw.error, remediation: 'restore .spec-graph/policies/policies.json' }], judgment: { status: 'not-run', verdict: 'skipped' }, revisionCount: 0, escalationRequired: false };
  }
  const applicable = raw.policies.filter(p => (p.actions || []).includes(action));
  const ctxBase = { action, target, cmd, paths, phase, specs };
  for (const p of applicable) {
    const impl = CHECKS[p.check.type];
    if (!impl) {
      facts.push({ policy: p.id, severity: 'block', ok: false, fact: `unknown check type "${p.check.type}" — the gate fails closed` });
      feedback.push({ policy: p.id, fact: `unknown check type "${p.check.type}"`, remediation: 'implement the check or remove the policy' });
      continue;
    }
    let res;
    try { res = await impl({ ...ctxBase, check: p.check || {} }); }
    catch (e) { res = { ok: false, fact: `check raised: ${String(e.message || e).slice(0, 160)}`, remediation: 'fix the check implementation' }; }
    facts.push({ policy: p.id, severity: p.severity, source: p.source, ok: res.ok, fact: res.fact });
    if (!res.ok) feedback.push({ policy: p.id, fact: res.fact, remediation: res.remediation || '' });
  }
  const blocked = feedback.length > 0;
  const log = readDecisionLog();
  const priorBlocks = log.filter(r => r.action === action && r.target === target && r.verdict === 'block').length;
  const revisionCount = priorBlocks + (blocked ? 1 : 0);
  const escalationRequired = blocked && revisionCount >= MAX_BLOCKS;
  const judgmentResult = judgment && raw.judgment && (raw.judgment.actions || []).includes(action)
    ? await runJudgment(raw.judgment, facts)
    : { status: 'not-applicable', verdict: 'skipped' };
  const record_ = {
    ts: new Date().toISOString(),
    action, target, phase,
    verdict: blocked ? 'block' : 'allow',
    policies: applicable.map(p => p.id),
    facts: facts.map(f => ({ policy: f.policy, ok: f.ok, fact: f.fact })),
    feedback,
    judgment: { status: judgmentResult.status, verdict: judgmentResult.verdict },
    revisionCount,
    escalationRequired,
  };
  if (record) writeDecisionLog(record_);
  return { verdict: blocked ? 'block' : 'allow', action, target, facts, feedback, judgment: judgmentResult, revisionCount, escalationRequired };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--action') out.action = argv[++i];
    else if (a === '--atom') out.target = argv[++i];
    else if (a === '--target') out.target = argv[++i];
    else if (a === '--cmd') out.cmd = argv[++i];
    else if (a === '--paths') out.paths = (argv[++i] || '').split(',').filter(Boolean);
    else if (a === '--phase') out.phase = argv[++i];
    else if (a === '--specs') out.specs = (argv[++i] || '').split(',').filter(Boolean);
  }
  return out;
}

const invokedDirectly = process.argv[1] && path.basename(process.argv[1]) === 'decision-gate.mjs';
if (invokedDirectly) {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === 'check') {
    const a = parseArgs(rest);
    if (!a.action) { console.error('usage: decision-gate.mjs check --action <action> [--atom <id>] [--cmd "..."] [--paths a,b] [--phase NN] [--specs ...]'); process.exit(2); }
    const out = await evaluate({ action: a.action, target: a.target, cmd: a.cmd, paths: a.paths, phase: a.phase, specs: a.specs });
    console.log(JSON.stringify(out, null, 2));
    process.exit(out.verdict === 'allow' ? 0 : 1);
  } else if (cmd === 'list') {
    const raw = loadPolicies();
    console.log(JSON.stringify({ policies: raw.policies.map(p => ({ id: p.id, actions: p.actions, severity: p.severity, description: p.description })) }, null, 2));
  } else {
    console.error('usage: decision-gate.mjs check|list');
    process.exit(2);
  }
}
