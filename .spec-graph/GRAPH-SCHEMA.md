# Graph Schema v3 (`graph.json`)

Single source of truth. Machine-editable via `ops/graph.mjs`; humans read via `status`.

```json
{
  "version": "3.0.0",
  "project": "<name>",
  "updatedAt": "<ISO>",
  "nodes": [
    {"id":"SPEC-001.AC-001","kind":"spec_atom","spec":"SPEC-001","ac":"AC-001","status":"open","title":"..."},
    {"id":"SPEC-001.AC-001.task","kind":"task","status":"open","dependsOn":["SPEC-001.AC-001"]},
    {"id":"SPEC-001.AC-001.code","kind":"code","status":"open","paths":["src/..."]},
    {"id":"SPEC-001.AC-001.test","kind":"test","status":"open","paths":["tests/..."],"cmd":"..."},
    {"id":"SPEC-001.AC-001.ev","kind":"evidence","status":"open","cmd":"...","exit":null,"hashes":{},"log":"..."}
  ],
  "edges": [
    {"from":"SPEC-001.AC-001.task","to":"SPEC-001.AC-001","rel":"derives_from"},
    {"from":"SPEC-001.AC-001.code","to":"SPEC-001.AC-001.task","rel":"implements"},
    {"from":"SPEC-001.AC-001.test","to":"SPEC-001.AC-001","rel":"covers"},
    {"from":"SPEC-001.AC-001.ev","to":"SPEC-001.AC-001.test","rel":"verifies"}
  ]
}
```

- `kind`: spec_atom|task|code|test|evidence|defect.
- `status`: open|in_progress|verified|blocked|waived (waived needs releaser+po rationale).
- `evidence` node: records cmd, exit code, output sha, file hashes at capture, timestamp.
- **Freshness rule**: verify/re-verify recomputes hashes of linked code/test paths; mismatch with stored hashes ⇒ auto-reopen to `open` with reason `stale-evidence`.
- Metrics: `status` prints verified/total, % per spec, blockers list.
- Release-ready ⇔ no node with status open|blocked (waived excluded with rationale) ∧ gate.mjs green ∧ verdicts all approve.
