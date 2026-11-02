# Discovery Log — Phase 09 (2026-10-13 → 2026-10-29)
- Framework: spec-graph 1.0.0
- Owner-persona: analyst
- Rules: every finding carries a source type + date; no invented quotes; no
  unsourced external claims; hypotheses are labelled as such.
- Scope note: this log contains only findings grounded in this repository's own
  committed artifacts (ROADMAP, PROCESS, GUARDRAILS, PERSONAS, AGENTS.md) and
  the project owner's Phase-09 directive as recorded in
  `.spec-graph/ROADMAP.md`. No external market sizing or vendor claims are
  asserted — anything that could not be verified in-repo is labelled a
  hypothesis and stays a candidate.

## Competitive Scan

### D-001 — Persona roster named approvers that did not exist
- Source type: internal-observation
- Date: 2026-10-13
- Promoted: SPEC-014
- Observation: `.spec-graph/PROCESS.md` required a Security approver on the
  release gate while `.opencode/agents/` shipped no security persona, so the
  gate could never be satisfied as written. Same shape for perf, UX/a11y and
  resilience review: enterprise assurance was release-shallow.
- Impact: high
- Proposed: Tiered quorum — core6 plus conditional domain auditors, wired to
  spec-level `domains` metadata (SPEC-014).

### D-002 — Release gates asserted trust instead of testing it
- Source type: internal-observation
- Date: 2026-10-13
- Promoted: SPEC-015
- Observation: the gate chain ran typecheck/tests/secret-scan only; dependency
  advisories, static findings, perf budgets and accessibility regressions were
  outside the gate, so "green" did not mean "assured".
- Impact: high
- Proposed: Evidence-backed assurance scanners (SAST, dep-audit, budget
  ratchet, axe-core a11y) promoted into the gate chain and CI (SPEC-015).

### D-003 — L3 visual QA was ad-hoc eyeballing
- Source type: internal-observation
- Date: 2026-10-29
- Promoted: SPEC-016
- Observation: export videos were reviewed by hand with no recorded rubric,
  reviewer identity, per-frame verdicts or artifact hash binding, so a later
  reviewer could not tell whether the recording had changed since the review.
- Impact: medium
- Proposed: Protocolize L3 — even-frame extraction, binding rubric, populated
  verdict JSON validated against the artifact hash (SPEC-016).

### D-004 — Export kit would silently drop every persona
- Source type: internal-observation
- Date: 2026-10-29
- Promoted: SPEC-017
- Observation: the quickstart instructed copying `.spec-graph/` + `opencode.json`
  but not `.opencode/`, so an adopting repo would boot the harness with zero
  persona agents; the kit was also unproven outside its home repo.
- Impact: medium
- Proposed: Complete the quickstart, parameterize repo-specific guardrails,
  stamp a framework version, and add a clean-room self-test (SPEC-017).

### D-005 — No Content-Security-Policy is configured
- Source type: internal-observation
- Date: 2026-10-29
- Observation: `index.html` declares no `Content-Security-Policy` meta and the
  preview server sends no CSP header, so browser-side script injection has no
  policy-level backstop. The threat model previously implied one existed; the
  claim was corrected to state the gap.
- Impact: medium
- Proposed: Add a CSP (meta or header) compatible with the Vite build, the
  Web Workers and blob/data URLs, then assert it in the headless probe.

### D-006 — PIN hashing is a single unsalted SHA-256
- Source type: internal-observation
- Date: 2026-10-29
- Observation: `src/lib/security.ts` hashes passwords with PBKDF2 (100k
  iterations, per-user salt) but `hashPin` is one unsalted SHA-256 digest, and
  PIN entry has no attempt throttling — weak against offline brute force.
- Impact: medium
- Proposed: Move the PIN path to PBKDF2 with a per-vault salt and add
  attempt throttling; migrate existing PIN hashes on unlock.

### D-007 — No console secret/PII-leak scanner in the headless harness
- Source type: internal-observation
- Date: 2026-10-29
- Observation: `scripts/e2e-av.mjs` captures console **errors** and page
  errors, but never inspects captured console output for leaked keys, tokens
  or PII, so a provider key echoed by a dependency would pass unnoticed.
- Impact: medium
- Proposed: Scan captured console/page output for key-shaped strings
  (`ghp_`, `AIza`, `sk-`, `Bearer `) and fail the leg when a hit appears —
  never printing the matched value.

### D-008 — Google Fonts is loaded from a third-party origin
- Source type: internal-observation
- Date: 2026-10-29
- Observation: `index.html` preconnects to `fonts.googleapis.com` and
  `fonts.gstatic.com` and loads the Plus Jakarta Sans / JetBrains Mono CSS, so
  every visit reaches Google's font origin (visitor IP + UA) and typography
  depends on that origin being reachable. The threat model previously implied
  no third-party origin was contacted; the claim was corrected.
- Impact: medium
- Proposed: Self-host the two font families (bundle the woff2 files and serve
  them locally, keeping the `font-display: swap` behaviour) or drop the remote
  fonts for the system stack, then re-verify the visual pass.

### D-009 — Restored campaigns are not schema-validated row by row
- Source type: internal-observation
- Date: 2026-10-30
- Observation: `parseArchiveBundle` validates the bundle envelope (format,
  version, campaign count vs payload length), but the restored campaign rows
  themselves are not validated against the v4 schema, so a hand-edited
  `.promoteit` file can inject malformed rows into `db.campaigns`.
- Impact: medium
- Proposed: Validate each restored row against the campaign schema before
  `bulkPut` and reject the snapshot with a per-row reason; while validating,
  also require imported resources to be JSON objects (the zip importer accepts
  any valid JSON value today).

### D-010 — No lockfile-diff review step
- Source type: internal-observation
- Date: 2026-10-30
- Observation: the release process pins `package-lock.json` and runs
  `npm ci` in CI, but nothing diffs the lockfile against the previously
  released one, so a dependency change between releases is only visible in
  the commit log.
- Impact: low
- Proposed: Generate a lockfile diff summary at release time (added/removed/
  updated packages + advisory deltas) and attach it to the release report.

## Voice of the Customer

### V-001 — "Let the framework drive, don't ask for every step"
- Source type: user-feedback
- Date: 2026-10-13
- Promoted: SPEC-019
- Paraphrase: The project owner authorised ultra-autonomous execution of the
  Phase-09 framework work, delegating implementation judgement to the persona
  loop rather than requesting per-step approval (recorded in the Phase 09
  header of `.spec-graph/ROADMAP.md`).
- Impact: high
- Proposed: Keep the loop autonomous — evidence-gated rather than
  approval-gated, with hard stops from GUARDRAILS unchanged.

### V-002 — "Certification must not overstate what was produced"
- Source type: internal-observation
- Date: 2026-10-29
- Promoted: SPEC-019
- Paraphrase: The repo's own working rules require honest statuses — no
  claiming AI output without a working provider path, no presenting local
  artifacts as committed records (`.spec-graph/GUARDRAILS.md`,
  `.spec-graph/DECISIONS.md` D11).
- Impact: high
- Proposed: Refresh `CERTIFICATION.md` from the template, carrying the L1–L4
  verdicts, L3-vision reviewer findings, assurance results and known limits
  (SPEC-019).

## Competitive Scan — Phase 10 (2026-11-02)

### D-011 — The exported webm carries a silent audio track
- Source type: internal-observation
- Date: 2026-11-02
- Promoted: SPEC-020
- Observation: `audioEngine.startContinuousBgm()` / `startAct1Audio()` are defined
  (`src/services/audioEngine.ts:478-530`) but never called from any current
  `src/` file, so the Web Audio bus returned by `getAudioStream()` has no
  source. `AVVideoPlayer.tsx:381-382` muxes that bus into the export, and the
  resulting webm therefore carries an `A_OPUS`/`A_VORBIS` track descriptor with
  no signal. Separately, Chrome's `speechSynthesis` output is not routable into
  a `MediaStreamAudioDestinationNode`, so the spoken voiceover can never reach
  the file either.
- Impact: high
- Proposed: Start the audio bed for real during playback/export, route mute and
  volume to the real gain nodes, add a client-side narration path (tab capture →
  `<audio>` element → `captureStream()` → mux) and label the export with what
  it actually contains.

### D-012 — Dead audio surface: unused producers and inert controls
- Source type: internal-observation
- Date: 2026-11-02
- Promoted: SPEC-020
- Observation: `AVVideoPlayer.playTone` (`:320`) and
  `VideoRenderer.syncVideoPlayback` (`src/services/videoRenderer.ts:41`) are
  defined but never called; the player's mute toggle and volume slider mutate
  React state only and never touch a `GainNode` (`:527-539`). The module-level
  orphan scan (SPEC-012) cannot see method-level deadness, so these survived
  the Phase-08 sweep.
- Impact: medium
- Proposed: Wire or delete each dead member, and extend the orphan scan to
  method-level dead surface so a second sweep can catch the next one.

### D-013 — Unknown domains are silently ignored, so a required auditor can never be required
- Source type: internal-observation
- Date: 2026-11-02
- Promoted: SPEC-023
- Observation: `ops/quorum.mjs:29-33` maps a phase's `domains` to personas
  through `DOMAIN_MAP` and *ignores* any domain string that is not in the map
  ("spec lint (po) owns validity"). A spec that declares a domain with no
  mapping therefore produces a required set that silently omits its auditor —
  the mirror image of D-001 (a roster that named approvers which did not
  exist), and a vacuous-quorum hole in the other direction.
- Impact: high
- Proposed: Fail closed — an unmapped domain must make the quorum resolver and
  claim-audit fail with a named error, and a lint must reject unknown domain
  strings in spec files.

### D-014 — The certification ladder has no rung that asserts content
- Source type: internal-observation
- Date: 2026-11-02
- Promoted: SPEC-022
- Observation: L1 proves gates green, L2 proves a function ran, L3 proves the
  pixels look right, L4 proves a provider wrote text — but nothing asserts that
  the audio is audible or intelligible, that the narration matches the script,
  or that picture and sound agree. The L3 rubric (`.spec-graph/templates/L3-RUBRIC.md`)
  is entirely visual (F1–F4 frames, S1–S4 screenshots, H1–H3 honesty): its only
  audio mention is "S3 Audio Studio", a screenshot of the controls. The E2E
  audio leg asserts only that `speechSynthesis.speak` was called
  (`scripts/e2e-av.mjs:281`), and the export's audio check is a codec-descriptor
  byte sniff (`:358`) — proof that a track exists, not that it carries signal.
- Impact: high
- Proposed: Add a machine-fact layer (levels, clipping, silence, A/V drift,
  scene correspondence) and a human-review layer with an explicit reviewer
  taxonomy, and expose the achieved level as a new certification rung.

## Voice of the Customer — Phase 10 (2026-11-02)

### V-003 — "Test the audio and video output as a real human"
- Source type: user-feedback
- Date: 2026-11-02
- Promoted: SPEC-022
- Paraphrase: The project owner directed that the framework must evaluate the
  product's audio and video output the way a person would — listening and
  watching, not only asserting that a function fired — and selected a combined
  model in which a persona reviews the full set while the owner personally
  spot-checks a short sample (recorded as a human verdict distinct from the
  persona's).
- Impact: high
- Proposed: Build a human-grade AV review protocol — audio and video rubric
  criteria, a reviewer taxonomy that never lets a persona verdict read as a
  human one, and a compact review package the owner can judge in minutes.

### V-004 — "Think before you act: our autonomous framework should gate its own actions"
- Source type: user-feedback
- Date: 2026-11-02
- Promoted: SPEC-023
- Paraphrase: The project owner cited IBM Research's published paper "Think
  Before You Act: Decision Gate for LLM Agents" (arXiv 2610.38620) — which
  intercepts selected agent actions before execution, compiles domain policies
  into executable state checks plus structured questions judged by a
  prefill-only decision model, and catches invalid actions and premature task
  termination — and asked whether the autonomous development framework could
  adapt it, granting autonomy to act on the answer.
- Impact: high
- Proposed: Add a decision gate to the harness: a policy registry compiled from
  GUARDRAILS and DECISIONS into executable checks, interception at the
  verification and release choke points, structured feedback with bounded
  revision, a premature-termination detector, and an optional probabilistic
  judgment layer that degrades honestly when no provider is available.

## Candidate hygiene
- A finding becomes a roadmap candidate only after it clears the format above.
- Findings stay candidates until a spec author promotes them into a spec;
  `scripts/discovery-to-roadmap.mjs` never rewrites hand-written roadmap rows.
