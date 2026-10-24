import { describe, expect, it } from 'vitest';
import { compile, renderTurn, resolveChoice } from '../src/engine.js';
import { sampleSource } from '../src/sample.js';

describe('Ink compilation and execution R02/R04/R05/R06', () => {
  it('compiles Chinese story and reads presentation metadata', () => {
    const result = compile(sampleSource);
    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    const first = renderTurn(result.compiled!);
    expect(first.turn.lines[0]).toMatchObject({ speaker: 'narrator', music: 'rain' });
    expect(first.turn.lines[1]).toMatchObject({ speaker: 'lin', emotion: 'nervous' });
    expect(first.turn.choices).toHaveLength(2);
    expect(first.variables).toMatchObject({ kept_secret: false, lin_affection: 0 });
  });
  it('restores historical choice across an intermediate scene and changes ending by affection', () => {
    const compiled = compile(sampleSource).compiled!;
    const first = renderTurn(compiled);
    const waiting = renderTurn(compiled, first.inkState, 0);
    const door = renderTurn(compiled, waiting.inkState, 0);
    expect(door.turn.choices.map(c => c.text)).toContain('提起那晚的约定');
    expect(door.variables.lin_affection).toBe(2);
    const ending = renderTurn(compiled, door.inkState, 1);
    expect(ending.turn.ended).toBe(true);
    expect(ending.turn.lines.some(l => l.text.includes('好，我留下'))).toBe(true);
    const refused = renderTurn(compiled, first.inkState, 1);
    const coldDoor = renderTurn(compiled, refused.inkState, 1);
    expect(coldDoor.turn.choices.map(c => c.text)).not.toContain('提起那晚的约定');
    const coldEnd = renderTurn(compiled, coldDoor.inkState, 0);
    expect(coldEnd.turn.lines.some(l => l.text.includes('不够了解'))).toBe(true);
  });
  it('reports invalid or absent source without filesystem access', () => {
    expect(compile('')).toMatchObject({ ok: false });
    expect(compile('x'.repeat(100001))).toMatchObject({ ok: false });
    expect(compile('-> missing')).toMatchObject({ ok: false });
    expect(compile('INCLUDE /etc/passwd')).toMatchObject({ ok: false });
  });
  it('limits an infinite runtime loop', () => {
    const result = compile('-> loop\n=== loop ===\n-> loop');
    expect(result.ok).toBe(true);
    expect(() => renderTurn(result.compiled!)).toThrow('超出限制');
  });
  it('rejects invalid compiled state and catches missing external functions', () => {
    expect(() => renderTurn('broken')).toThrow();
    const result = compile('EXTERNAL foo()\n~ foo()\n-> END');
    expect(() => renderTurn(result.compiled!)).toThrow();
  });
  it('preserves audio tags and rejects excessively long metadata', () => {
    const good = compile('你好 # speaker:lin # audio:line-1 # custom:keep\n-> END').compiled!;
    const line = renderTurn(good).turn.lines[0];
    expect(line).toMatchObject({ audio: 'line-1', speaker: 'lin' });
    expect(line.tags).toContain('custom:keep');
    const bad = compile(`你好 # audio:${'a'.repeat(600)}\n-> END`).compiled!;
    expect(() => renderTurn(bad)).toThrow('标签过长');
  });
  it('maps only exact choice text or explicit ordinal', () => {
    const choices = [{ id: 'a', index: 0, text: '相信她' }, { id: 'b', index: 1, text: '追问' }];
    for (const input of ['第一个', '1', '选择一', '相信她。']) expect(resolveChoice(choices, { input }).id).toBe('a');
    expect(resolveChoice(choices, { choiceId: 'b' }).index).toBe(1);
    expect(resolveChoice(choices, { input: '第二个' }).index).toBe(1);
    for (const input of ['也许吧', '3', '我不选第一个', '']) expect(() => resolveChoice(choices, { input })).toThrow();
    expect(() => resolveChoice(choices, { choiceId: 'missing' })).toThrow();
    expect(() => resolveChoice([...choices, { id: 'c', index: 2, text: '相信她' }], { input: '相信她' })).toThrow();
    expect(resolveChoice([{ id: 'q', index: 0, text: '你在等我？' }], { input: '你在等我？' }).id).toBe('q');
    expect(resolveChoice([{ id: 'q', index: 0, text: '你在等我？' }], { input: '你在等我' }).id).toBe('q');
    expect(() => resolveChoice([{ id: 'q', index: 0, text: '真的吗？' }, { id: 's', index: 1, text: '真的吗！' }], { input: '真的吗' })).toThrow();
    for (const text of ['1', '第一个']) {
      const duplicates = [{ id: 'a', index: 0, text }, { id: 'b', index: 1, text }];
      expect(() => resolveChoice(duplicates, { input: text })).toThrow('唯一表述');
      expect(() => resolveChoice(duplicates, { input: `${text}。` })).toThrow('唯一表述');
      expect(resolveChoice(duplicates, { choiceId: 'b' }).id).toBe('b');
    }
  });
});
