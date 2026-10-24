# AI development agreement

This project is an audio-first, choice-only interactive story studio. Human decisions define scope; AI agents implement and review it. Read `docs/specs/001-mvp.md` and `docs/architecture.md` before changing behavior.

## Workflow

- Use specification-driven development: update requirements, acceptance criteria and test cases before implementing a changed behavior. Keep traceability by requirement ID.
- Work on `codex/*` branches. Never push application changes directly to `main`. Deliver small focused commits and pull requests; merge only after relevant checks and review. Do not bypass protection or failed checks.
- Parallel agents are encouraged. Assign non-overlapping file ownership and agree on the API contract first. An integrator owns cross-cutting changes and final verification.
- Do not modify another agent's active files without coordinating. Never discard unrelated changes. Track implementation, checks, known gaps and evaluation evidence in project docs.
- Keep the initial product small: author, compile, publish, play, resume. Audio metadata is a supported extension point; do not claim real voice integration exists before testing it.

## Engineering

- Node.js + TypeScript + MongoDB backend; Vite + React + TypeScript frontend. Ink is authoritative for story variables and branches.
- Published story versions are immutable. Sessions pin a version. Draft edits must not mutate running games.
- Validate all external input. Bind choices to a turn and enforce optimistic concurrency and idempotency. Never let a model invent choices or edit game variables.
- Keep domain logic separate from HTTP/MCP adapters and persistence. No secrets in source, logs, fixtures or screenshots.
- Local authoring access is the MVP trust boundary. Do not expose the unauthenticated studio publicly. Authentication is required before shared deployment.
- Test meaningful invariants: branches, historical flags, state restoration, duplicate/stale choices, compilation failure, publishing and simulator flows. Use an actual MongoDB instance for persistence integration tests.
- Run typecheck, unit/component tests with coverage, build, MongoDB integration tests and browser end-to-end tests before merging a release. Document any check that could not run; never report it as passed.
- For UI changes inspect the running browser at desktop and narrow width. Preserve keyboard access and accessible labels.

## Pull requests

Describe the user-visible outcome, linked requirement IDs, verification and remaining limitations. Keep research/specification, backend, frontend and integration fixes reviewable as focused increments. Use the repository PR template.
