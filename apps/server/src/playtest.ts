import { z } from 'zod';
import type { PlaytestEntry } from './types.js';

const entrySchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,79}$/),
  chapter: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  path: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,79}$/),
}).strict();

export type PlaytestDefinition = PlaytestEntry & { path: string };

export function readPlaytestEntries(source: string): PlaytestDefinition[] {
  const entries: PlaytestDefinition[] = [];
  const ids = new Set<string>();
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*\/\/\s*@playtest\b(.*)$/);
    if (!match) continue;
    try {
      const entry = entrySchema.parse(JSON.parse(match[1]));
      if (ids.has(entry.id)) throw new Error('入口 ID 不能重复');
      if (entries.length >= 40) throw new Error('最多配置 40 个试跑入口');
      ids.add(entry.id);
      entries.push(entry);
    } catch (cause) {
      throw new Error(`第 ${index + 1} 行试跑入口无效：${cause instanceof Error ? cause.message : '配置错误'}`);
    }
  }
  return entries;
}

export function publicPlaytestEntry({ path: _, ...entry }: PlaytestDefinition): PlaytestEntry { return entry; }
