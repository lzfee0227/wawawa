# Architecture and API contract

The authoritative game service uses `inkjs` in Node.js/TypeScript. Fastify exposes HTTP, React/Vite provides a local authoring and simulator UI, and MongoDB persists drafts, immutable versions and sessions. The MCP play adapter specified in SDD-002 calls the same service functions. Binary audio belongs in object storage, not story/session documents.

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

## MCP play transport

SDD-002 is the play contract. One factory registers `list_stories`, `start_session`, `get_session`, `choose_option`, and the `play_turn` prompt. stdio and Streamable HTTP `/mcp` on the API process both use that factory. The server instance stores no game progress; sessions stay in MongoDB.

Successful tool results are one JSON text block: a published-story list, or a play snapshot with `sessionId`, `turnId`, `revision`, lines, resolved `speakerName` when the tag matches a character, choices, characters, and variables. Results omit Ink state and retry receipts. `get_session` does not advance. `choose_option` uses the HTTP choice rules, including client-generated `requestId` and exactly one of `choiceId` or `input`.

The studio console in SDD-003 is another client of this HTTP endpoint. It posts JSON-RPC to the same-origin `/mcp` path, which the Vite dev server proxies alongside `/api`. The console does not call the authoring routes to play, and it does not store its session id in the simulator's local recovery key.

Service errors become MCP tool errors whose text starts with `CODE: message`. Invalid tool arguments are rejected by the SDK and do not call the service. The adapter does not author, compile, publish, play audio, or interpret raw speech. A host that only displays the returned text still satisfies the contract.

stdio reserves stdout for JSON-RPC. HTTP uses the existing `HOST` and `PORT`, localhost by default. The HTTP entry is Streamable HTTP on `GET`, `POST`, and `DELETE /mcp`: the official client posts JSON-RPC and receives SSE only when a response streams. `POST /mcp/message` is not mounted.

SDD-007 reads `X-Linx-Device-Id`, `X-Linx-Agent-Id`, and `X-Linx-Session-Id` from that HTTP request and passes the triple into the game service. `start_session` stores it on the session record as `linx`; `choose_option` replaces it when a new triple arrives and keeps the stored triple when the request has none. Reads do not write it. Public session JSON and play snapshots omit `linx`, just as they omit Ink state and retry receipts. A stored device id is not an account and does not authorize the session. Device playback stays unverified.

## Simulator audio boundary (SDD-005)

`VoicePanel` is a presentation adapter: browser SpeechSynthesis/SpeechRecognition, MediaRecorder, HTMLAudioElement, and optional same-origin `/api/audio` requests. It never advances Ink. Recognition fills the existing manual choice input; the existing turn/revision/requestId contract remains authoritative. AbortController cancels work on turn/session/source changes, gameplay requests and unmount. Local file object URLs are released when replaced or unmounted.

`GET /api/audio/capabilities` reports configured booleans only. `POST /api/audio/speech` accepts `{text, voice?}` and returns MPEG audio; `POST /api/audio/transcriptions` accepts bounded raw audio and returns `{text}`. The server converts recordings to upstream multipart and enforces timeouts, size limits, safe errors and no credential-bearing redirects. Each provider uses server environment configuration; no browser-provided endpoint or key. No persistence changes, URL proxy, caching, streaming or MCP extensions. These unauthenticated, potentially billable endpoints share the trusted local studio boundary.

## Chapter playtests (SDD-006)

Authors declare versioned chapter/preset entries with `// @playtest {JSON}` in Ink source. Only these entries can be used by `POST /api/playtest-sessions { storyId, versionId, entryId }`. The service resolves the entry from immutable version source and executes the author's initialization knot; clients cannot pass Ink paths or variable patches. Compilation validates metadata, and publishing validates every entry under the normal runtime limits. Public versions expose optional `playtestEntries` without paths; playtest sessions carry optional `playtest` metadata and otherwise use the same persistence, resume and choice concurrency contract.

The simulator keeps separate browser references for ordinary and playtest sessions and remembers the active mode. Returning to ordinary progress restores its existing reference. Restarting a playtest preserves its version and preset. Ordinary starts and MCP retain their existing contract. Presets are synthetic author scenarios, not recorded player history or cross-version migration.
