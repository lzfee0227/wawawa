import type { IncomingHttpHeaders } from 'node:http';
import { GameError } from './errors.js';
import type { LinxCaller } from './types.js';

const token = /^[\x21-\x7E]{1,200}$/;
const names = ['x-linx-device-id', 'x-linx-agent-id', 'x-linx-session-id'] as const;
const incomplete = 'X-Linx-Device-Id、X-Linx-Agent-Id 和 X-Linx-Session-Id 必须同时提供。';
const invalid = 'X-Linx-Device-Id、X-Linx-Agent-Id 和 X-Linx-Session-Id 必须各是 1 到 200 个可见 ASCII 字符，且不能重复。';

export function linxCallerFromHeaders(headers: IncomingHttpHeaders): LinxCaller | undefined {
  const source: IncomingHttpHeaders = {};
  for (const [key, value] of Object.entries(headers)) source[key.toLowerCase()] = value;
  const values = names.map(name => readHeader(source, name));
  if (values.every(value => value === undefined)) return undefined;
  if (values.some(value => value === undefined)) throw new GameError(400, 'VALIDATION_ERROR', incomplete);
  return { deviceId: values[0] as string, agentId: values[1] as string, sessionId: values[2] as string };
}

function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const raw = headers[name];
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) throw new GameError(400, 'VALIDATION_ERROR', invalid);
  const value = raw.trim();
  if (value === '') return undefined;
  if (!token.test(value)) throw new GameError(400, 'VALIDATION_ERROR', invalid);
  return value;
}
