export type Character = { id: string; name: string; voiceId: string };
export type Draft = { id: string; title: string; source: string; characters: Character[]; revision: number; updatedAt: string };
export type Diagnostic = { severity: 'error' | 'warning'; message: string };
export type Compilation = { ok: boolean; diagnostics: Diagnostic[] };
export type PlaytestEntry = { id: string; chapter: string; label: string; description: string };
export type Version = { id: string; storyId: string; number: number; createdAt: string; playtestEntries?: PlaytestEntry[] };
export type Line = { text: string; tags: string[]; speaker?: string; emotion?: string; audio?: string; music?: string };
export type Choice = { id: string; index: number; text: string };
export type Turn = { id: string; lines: Line[]; choices: Choice[]; ended: boolean };
export type Session = { id: string; storyId: string; versionId: string; versionNumber: number; revision: number; turn: Turn; characters: Character[]; variables: Record<string, unknown>; updatedAt: string; playtest?: PlaytestEntry };

export class ApiError extends Error {
  constructor(message: string, public status: number, public diagnostics?: Diagnostic[]) { super(message); }
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  });
  let data;
  try { data = await response.json(); } catch { throw new ApiError('服务返回了无法识别的响应，请检查后端连接。', response.status); }
  if (!response.ok) throw new ApiError(data.error?.message ?? '请求失败，请重试。', response.status, data.error?.diagnostics);
  return data as T;
}
