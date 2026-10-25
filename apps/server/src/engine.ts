import { randomUUID } from 'node:crypto';
import { Compiler, CompilerOptions } from 'inkjs/compiler/Compiler';
import { Story } from 'inkjs/engine/Story';
import { GameError } from './errors.js';
import { readPlaytestEntries } from './playtest.js';
import type { Choice, Compilation, Diagnostic, Line, Turn } from './types.js';

export function compile(source: string): Compilation & { compiled?: string } {
  const diagnostics: Diagnostic[] = [];
  if (!source.trim() || source.length > 100_000) return { ok: false, diagnostics: [{ severity: 'error', message: '剧本不能为空且不得超过 100000 字符。' }] };
  // No external file loader: INCLUDE cannot read arbitrary server files.
  try {
    readPlaytestEntries(source);
    const compiler = new Compiler(source, new CompilerOptions(null, [], false, (message, type) => {
      diagnostics.push({ severity: type === 2 ? 'error' : 'warning', message });
    }));
    const story = compiler.Compile();
    const ok = !diagnostics.some(d => d.severity === 'error');
    return { ok, diagnostics, ...(ok ? { compiled: story.ToJson() as string } : {}) };
  } catch (error) {
    if (!diagnostics.some(d => d.severity === 'error')) diagnostics.push({ severity: 'error', message: error instanceof Error ? error.message : '编译失败' });
    return { ok: false, diagnostics };
  }
}

export function renderTurn(compiled: string, inkState?: string, choiceIndex?: number, entryPath?: string) {
  try {
    const story = new Story(compiled);
    if (entryPath !== undefined) story.ChoosePathString(entryPath);
    if (inkState) story.state.LoadJson(inkState);
    if (choiceIndex !== undefined) story.ChooseChoiceIndex(choiceIndex);
    const lines: Line[] = [];
    let outputCharacters = 0;
    const start = performance.now();
    while (story.canContinue) {
      do {
        story.ContinueAsync(10);
        if (performance.now() - start > 300 || lines.length >= 300) throw new GameError(422, 'RUNTIME_LIMIT', '剧情执行超出限制，请检查循环或拆分过长场景。');
      } while (!story.asyncContinueComplete);
      const text = story.currentText?.trim() ?? '';
      const tags = (story.currentTags ?? []).map(t => t.trim());
      outputCharacters += text.length + tags.join('').length;
      if (outputCharacters > 100_000 || tags.some(tag => tag.length > 500)) throw new GameError(422, 'RUNTIME_LIMIT', '本段内容或标签过长，请拆分场景。');
      if (!text && !tags.length) continue;
      const line: Line = { text, tags };
      for (const tag of tags) {
        const split = tag.indexOf(':');
        const key = tag.slice(0, split).trim();
        if (split > 0 && ['speaker', 'emotion', 'audio', 'music'].includes(key)) line[key as 'speaker'] = tag.slice(split + 1).trim();
      }
      lines.push(line);
    }
    const turn: Turn = { id: randomUUID(), lines, choices: story.currentChoices.map(c => ({ id: randomUUID(), index: c.index, text: c.text })), ended: story.currentChoices.length === 0 };
    const variables: Record<string, unknown> = {};
    for (const name of Object.keys(story.variablesState)) {
      const value = story.variablesState.$(name);
      variables[name] = value !== null && typeof value === 'object' ? String(value) : value;
    }
    const savedState = story.state.ToJson();
    if (savedState.length > 500_000) throw new GameError(422, 'RUNTIME_LIMIT', '剧情状态过大，请减少变量中的长文本。');
    return { turn, variables, inkState: savedState };
  } catch (error) {
    if (error instanceof GameError) throw error;
    throw new GameError(422, 'RUNTIME_ERROR', error instanceof Error ? error.message : '剧情运行失败');
  }
}

export function resolveChoice(choices: Choice[], value: { choiceId?: string; input?: string }): Choice {
  if (value.choiceId !== undefined) {
    const found = choices.find(c => c.id === value.choiceId);
    if (found) return found;
  } else if (value.input) {
    const rawInput = value.input.trim();
    const verbatim = choices.filter(c => c.text.trim() === rawInput);
    if (verbatim.length === 1) return verbatim[0];
    if (verbatim.length > 1) throw new GameError(400, 'INVALID_CHOICE', '请说当前选项的其他唯一表述，或点击对应选项。');
    const normalize = (text: string) => text.trim().replace(/[。！？!?]$/, '');
    const input = normalize(rawInput);
    const exact = choices.filter(c => normalize(c.text) === input);
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) throw new GameError(400, 'INVALID_CHOICE', '请说当前选项的其他唯一表述，或点击对应选项。');
    const match = input.match(/^(?:我选|选择|选)?\s*(?:第)?([一二两三四五六七八九十]|\d{1,2})(?:个|项)?$/);
    if (match) {
      const n = ({ 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 } as Record<string, number>)[match[1]] ?? Number(match[1]);
      if (choices[n - 1]) return choices[n - 1];
    }
  }
  throw new GameError(400, 'INVALID_CHOICE', '请说当前选项的完整文字或序号，例如“第一个”。');
}
