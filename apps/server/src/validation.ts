import { z } from 'zod';
const id = z.string().min(1).max(100);
const source = z.string().min(1).max(100_000);
export const draftSchema = z.object({
  title: z.string().trim().min(1).max(120), source,
  characters: z.array(z.object({ id: z.string().regex(/^[a-zA-Z][\w-]{0,49}$/), name: z.string().trim().min(1).max(80), voiceId: z.string().max(200), bio: z.string().max(1000).optional(), traits: z.array(z.string().trim().min(1).max(40)).max(20).optional(), goals: z.array(z.string().trim().min(1).max(120)).max(20).optional(), secrets: z.array(z.string().trim().min(1).max(120)).max(20).optional() }).strict()).max(30),
  relations: z.array(z.object({ id: z.string().min(1).max(100), from: z.string().regex(/^[a-zA-Z][\w-]{0,49}$/), to: z.string().regex(/^[a-zA-Z][\w-]{0,49}$/), type: z.string().trim().min(1).max(40), label: z.string().max(100).optional(), strength: z.number().min(0).max(100).optional(), description: z.string().max(500).optional(), variableKey: z.string().max(100).optional() }).strict()).max(100).optional()
}).strict()
  .refine(value => new Set(value.characters.map(c => c.id)).size === value.characters.length, '角色 ID 不能重复')
  .refine(value => new Set((value.relations ?? []).map(relation => relation.id)).size === (value.relations ?? []).length, '关系 ID 不能重复');
export const compileSchema = z.object({ source }).strict();
export const revisionSchema = z.object({ revision: z.number().int().nonnegative() }).strict();
export const sessionSchema = z.object({ storyId: id, versionId: id.optional() }).strict();
export const playtestSessionSchema = z.object({ storyId: id, versionId: id, entryId: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,79}$/) }).strict();
export const choiceSchema = z.object({
  turnId: id, revision: z.number().int().nonnegative(), requestId: id,
  choiceId: id.optional(), input: z.string().trim().min(1).max(300).optional()
}).strict().refine(value => Number(value.choiceId !== undefined) + Number(value.input !== undefined) === 1, '必须提供 choiceId 或 input，且只能提供一个');
