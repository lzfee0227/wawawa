# Architecture and API contract

The authoritative game service uses `inkjs` in Node.js/TypeScript. Fastify exposes HTTP, React/Vite provides a local authoring and simulator UI, and MongoDB persists drafts, immutable versions and sessions. Future MCP adapters call the same service functions. Binary audio belongs in object storage, not story/session documents.

## Shared types (contract frozen for initial parallel work)

Backend exports JSON shapes; frontend keeps equivalent types in its own `api.ts` for MVP (avoid cross-package build complexity).

```ts
type Character = { id: string; name: string; voiceId: string };
type Draft = { id: string; title: string; source: string; characters: Character[]; revision: number; updatedAt: string };
type Diagnostic = { severity: 'error' | 'warning'; message: string };
type Compilation = { ok: boolean; diagnostics: Diagnostic[] };
type Version = { id: string; storyId: string; number: number; createdAt: string };
type Line = { text: string; tags: string[]; speaker?: string; emotion?: string; audio?: string; music?: string };
type Choice = { id: string; index: number; text: string };
type Turn = { id: string; lines: Line[]; choices: Choice[]; ended: boolean };
type Session = { id: string; storyId: string; versionId: string; versionNumber: number; revision: number; turn: Turn; characters: Character[]; variables: Record<string, unknown>; updatedAt: string };
```

## HTTP `/api`

All success results are direct JSON, not wrapped. Error shape: `{ error: { code: string, message: string, diagnostics?: Diagnostic[] } }`.

| Method/path | Request | Response |
|---|---|---|
| GET /health | — | `{ status: 'ok' }` |
| GET /stories | — | `Draft[]` |
| POST /stories | `{ title, source, characters }` | `Draft` (201) |
| GET /stories/:id | — | `Draft` |
| PUT /stories/:id | `{ title, source, characters, revision }` | `Draft` |
| POST /compile | `{ source }` | `Compilation` (200 even invalid source) |
| POST /stories/:id/publish | `{ revision }` | `Version` (201); invalid compilation 422 |
| GET /stories/:id/versions | — | `Version[]` newest first |
| POST /sessions | `{ storyId, versionId? }` | `Session` (201); latest if version absent |
| GET /sessions/:id | — | `Session` |
| POST /sessions/:id/choices | `{ turnId, revision, requestId, choiceId?: string, input?: string }` | `Session`; exactly one of choiceId/input |

HTTP 400 malformed/unknown choice, 404 missing resource, 409 stale revision/turn or request reuse mismatch within the last eight successful choices, 422 compile/runtime error. Clients generate a new requestId per selection. Retries outside the receipt window are rejected by their stale turn/revision. API paths use opaque generated IDs. No user-controlled JS evaluation.

## Persistence and consistency

Collections: drafts, versions, sessions. Each session stores the full serialized Ink state, current rendered turn, pinned story version and revision. Atomic compare-and-swap on the session document prevents simultaneous advances. Store retry receipts within that document with a bounded policy and reject stale turns even after receipt eviction. Version IDs are immutable; branch scripts cannot be swapped beneath active sessions. Avoid requiring Mongo transactions or replica sets for MVP.

Compile once on publish; sessions load compiled JSON. Runtime work is bounded; do not run `ContinueMaximally` on untrusted source without a limit. Ink runtime state is independent per request/session. Tags are a custom presentation convention, not built-in TTS. Keep currentTurn cached to separate narrative evaluation from playback completion.

## Runtime modes

Normal/dev/CI browser execution uses MongoDB via `MONGODB_URI`. Unit tests may use a repository test double, but the application must never silently fall back to memory. Bind localhost by default. Production authentication, ownership, authorization, quota controls and deployment are outside the initial local prototype.

## Future transport

MCP returns story results and accepts validated selections; it does not guarantee host audio playback or raw ASR forwarding. Verify xiaozhi.me playback/auto-listen capabilities with one device before committing to hosted integration. A compatible self-hosted Xiaozhi backend is an alternative, not equivalent to xiaozhi.me support.
