import { z } from 'zod';
const id = z.string().min(1).max(100);
const source = z.string().min(1).max(100_000);
export const draftSchema = z.object({
  title: z.string().trim().min(1).max(120), source,
  characters: z.array(z.object({ id: z.string().regex(/^[a-zA-Z][\w-]{0,49}$/), name: z.string().trim().min(1).max(80), voiceId: z.string().max(200) }).strict()).max(30)
}).strict().refine(value => new Set(value.characters.map(c => c.id)).size === value.characters.length, '角色 ID 不能重复');
export const compileSchema = z.object({ source }).strict();
export const revisionSchema = z.object({ revision: z.number().int().nonnegative() }).strict();
export const sessionSchema = z.object({ storyId: id, versionId: id.optional() }).strict();
export const playtestSessionSchema = z.object({ storyId: id, versionId: id, entryId: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,79}$/) }).strict();
export const choiceSchema = z.object({
  turnId: id, revision: z.number().int().nonnegative(), requestId: id,
  choiceId: id.optional(), input: z.string().trim().min(1).max(300).optional()
}).strict().refine(value => Number(value.choiceId !== undefined) + Number(value.input !== undefined) === 1, '必须提供 choiceId 或 input，且只能提供一个');
