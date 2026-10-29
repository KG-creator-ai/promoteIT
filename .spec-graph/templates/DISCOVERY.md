# Discovery Log — <phase / date>
- Framework: spec-graph <version from .spec-graph/VERSION>
- Owner-persona: analyst
- Rules: every finding carries a source type + date; no invented quotes; no
  unsourced external claims; hypotheses are labelled as such.

## Competitive Scan

### D-001 — <finding title>
- Source type: internal-observation | public-docs | hypothesis
- Date: YYYY-MM-DD
- Observation: <what was observed and where it came from>
- Impact: high | medium | low
- Proposed: <candidate action, phrased as a roadmap proposal>

## Voice of the Customer

### V-001 — <requirement title>
- Source type: user-feedback | user-request | internal-observation
- Date: YYYY-MM-DD
- Paraphrase: <paraphrased need — never a verbatim quote unless the source
  text is committed in this repo>
- Impact: high | medium | low
- Proposed: <candidate action>

## Candidate hygiene
- A finding becomes a roadmap candidate only after it clears the format above.
- Findings stay candidates until a spec author promotes them into a spec;
  `scripts/discovery-to-roadmap.mjs` never rewrites hand-written roadmap rows.
