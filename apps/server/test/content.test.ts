import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { compile, renderTurn } from '../src/engine.js';
import { readPlaytestEntries } from '../src/playtest.js';

type Rendered = ReturnType<typeof renderTurn>;

const commonChoices = [
  '沉默不语',
  '立界，硬挡这一击',
  '把旧校徽交给何敏',
  '先查李家的名字',
  '带大家去校史塔，先取证',
  '让大家分担护界压力',
];
const eveChoices = ['把自己的承福血脉告诉同伴', '重建共同分担方案'];
const routes = [
  {
    name: '金妮', ending: '【金妮结局：从小到大的约定】', route: 'jin_ni',
    choices: [
      '和罗金妮查诊疗站的抽取装置', '明确想与同行者发展感情',
      '坦白自己有记忆断层', '先按金妮的名单转移病人', '接受分担方案', '和金妮确认关系',
      ...eveChoices, '按轮值名单分担', '和金妮成婚并共同协调互助网络',
    ],
  },
  {
    name: '何敏', ending: '【何敏结局：答案之外】', route: 'he_min',
    choices: [
      '和何敏查契约实验室的权限记录', '明确想与同行者发展感情',
      '交出完整的系统代价记录', '让实验公开，接受同学质询', '保留对自己不利的证据', '和何敏确认关系',
      ...eveChoices, '让见证人共同保留副本', '和何敏成婚并共同接受审议',
    ],
  },
  {
    name: '马二福', ending: '【马二福 Good End：名字写在一起】', route: 'ma_er_fu',
    choices: [
      '和马二福回马家契约厅', '明确想与同行者发展感情',
      '要求她自己决定，我只作见证', '告诉她道歉必须包含具体补偿',
      '请她拒绝单人继承，和你共同提出公开契约', '和马二福确认关系',
      ...eveChoices, '与她共同重订可撤销契约',
    ],
  },
  {
    name: '伙伴', ending: '【伙伴结局：霍海的新校规】', route: 'partner',
    choices: [
      '和罗金恩组织学生撤离与取证', '先做伙伴，感情以后再决定',
      '先建立公开的撤离名单', '调查分担机制', ...eveChoices,
      '拒绝垄断，公开成立轮值响应队', '主动选择单身，和伙伴建立响应队',
    ],
  },
];

describe('repository story: Erha Youfu R02/R04–R07', () => {
  let compiled: string;
  const source = readFileSync(new URL('../../../content/stories/erha-youfu/story.ink', import.meta.url), 'utf8');
  const entries = readPlaytestEntries(source);
  beforeAll(() => {
    const result = compile(source);
    expect(result.ok, JSON.stringify(result.diagnostics)).toBe(true);
    expect(result.diagnostics).toEqual([]);
    compiled = result.compiled!;
  });

  function choose(current: Rendered, text: string): Rendered {
    expect(current.turn.ended, `Story ended before choice: ${text}`).toBe(false);
    const choice = current.turn.choices.find(item => item.text === text);
    expect(choice, `Missing choice "${text}"; available: ${current.turn.choices.map(item => item.text).join(' / ')}`).toBeDefined();
    // Every step reloads the saved state, just like the game service does.
    return renderTurn(compiled, current.inkState, choice!.index);
  }

  function play(current: Rendered, choices: string[]): Rendered {
    return choices.reduce(choose, current);
  }

  it('compiles the complete repository source and presents the opening choices', () => {
    const first = renderTurn(compiled);
    expect(first.turn.lines[0]).toMatchObject({ speaker: 'narrator', music: 'rain' });
    expect(first.turn.choices.map(choice => choice.text)).toEqual(['沉默不语', '忽略她，直接路过', '怼回去', '先道歉']);
    expect(first.variables).toMatchObject({ run_number: 1, route: 'unselected', echo_shared_cost: false, echo_revocable_oath: false });
  });

  it('CP06 continues directly into chapter two while the chapter-one demo ends', () => {
    const complete = play(renderTurn(compiled), commonChoices.slice(0, 3));
    expect(complete.turn.ended).toBe(false);
    expect(complete.turn.choices.map(choice => choice.text)).toContain('先查李家的名字');
    const demoSource = readFileSync(new URL('../../../content/stories/erha-youfu/chapter-01.ink', import.meta.url), 'utf8');
    const demoCompiled = compile(demoSource).compiled!;
    let demo = renderTurn(demoCompiled);
    for (const text of commonChoices.slice(0, 3)) {
      const choice = demo.turn.choices.find(choice => choice.text === text)!;
      demo = renderTurn(demoCompiled, demo.inkState, choice.index);
    }
    expect(demo.turn.ended).toBe(true);
  });

  it('CP06 exposes every supported chapter and four later routes', () => {
    expect(entries).toHaveLength(22);
    expect(new Set(entries.map(entry => entry.chapter)).size).toBe(7);
    for (const chapter of [4, 5, 6, 7, 8]) {
      expect(entries.filter(entry => entry.id.startsWith(`chapter_${chapter}_`))).toHaveLength(4);
    }
  });

  it.each(entries)('CP03/CP04/CP06 $id matches valid first-run history and continues after restoration', entry => {
    const [, chapterText, routeKey] = entry.id.split('_');
    const chapter = Number(chapterText);
    const routeIndex = ['jinni', 'hemin', 'ma', 'partner'].indexOf(routeKey);
    const route = routes[routeIndex < 0 ? 0 : routeIndex];
    const priorCount = routeKey === 'partner'
      ? ({ 4: 2, 5: 3, 6: 4, 7: 6, 8: 7 } as Record<number, number>)[chapter]
      : ({ 4: 2, 5: 4, 6: 6, 7: 8, 8: 9 } as Record<number, number>)[chapter];
    const prior = chapter < 4
      ? commonChoices.slice(0, chapter === 2 ? 3 : 5)
      : [...commonChoices, ...route.choices.slice(0, priorCount)];
    const remaining = chapter < 4
      ? [...commonChoices.slice(chapter === 2 ? 3 : 5), ...route.choices]
      : route.choices.slice(priorCount);
    const normal = play(renderTurn(compiled), prior);
    const trial = renderTurn(compiled, undefined, undefined, entry.path);
    expect(trial.variables).toEqual(normal.variables);
    expect(trial.variables).toMatchObject({ run_number: 1, echo_shared_cost: false, echo_revocable_oath: false, true_plan: false });
    expect(trial.turn.choices.map(choice => choice.text)).toEqual(normal.turn.choices.map(choice => choice.text));
    expect(trial.turn.lines.some(line => line.text.includes('试跑'))).toBe(false);
    const summary = play(trial, remaining);
    expect(summary.turn.lines.map(line => line.text)).toContain(route.ending);
    expect(summary.variables.true_plan).toBe(false);
    const stopped = choose(summary, '停在本轮结局');
    expect(stopped.turn.ended).toBe(true);
    expect(stopped.variables).toEqual(summary.variables);
  });

  it.each(routes)('reaches $name ending summary through valid choices and can stop', route => {
    const summary = play(renderTurn(compiled), [...commonChoices, ...route.choices]);
    expect(summary.variables.route).toBe(route.route);
    expect(summary.turn.lines.map(line => line.text)).toContain(route.ending);
    expect(summary.turn.lines.some(line => line.text.includes('第 1 周目已经结束'))).toBe(true);
    expect(summary.turn.choices.map(choice => choice.text)).toEqual(['开启新周目', '停在本轮结局']);
    const stopped = choose(summary, '停在本轮结局');
    expect(stopped.turn.ended).toBe(true);
    expect(stopped.turn.choices).toEqual([]);
    expect(stopped.variables).toEqual(summary.variables);
  });

  it('carries earned echoes across replays, resets run state and unlocks the true ending', () => {
    const first = renderTurn(compiled);
    const jinni = play(first, [...commonChoices, ...routes[0].choices]);
    expect(jinni.variables).toMatchObject({ echo_shared_cost: true, echo_revocable_oath: false, relationship_confirmed: true, has_fumen_key: true });
    expect(jinni.variables.trust_jin_ni).toBeGreaterThan(0);

    const second = choose(jinni, '开启新周目');
    expect(second.variables).toMatchObject({
      ...first.variables,
      run_number: 2, echo_shared_cost: true, run_echo_shared_cost: true,
    });
    expect(second.turn.lines.some(line => line.text.includes('第 2 次醒来'))).toBe(true);
    expect(second.turn.choices.map(choice => choice.text)).toEqual(first.turn.choices.map(choice => choice.text));

    const hemin = play(second, [...commonChoices, ...routes[1].choices]);
    expect(hemin.variables).toMatchObject({ echo_shared_cost: true, echo_revocable_oath: true });
    const third = choose(hemin, '开启新周目');
    expect(third.variables).toMatchObject({
      ...first.variables,
      run_number: 3, echo_shared_cost: true, echo_revocable_oath: true,
      run_echo_shared_cost: true, run_echo_revocable_oath: true,
    });

    const trueEnding = play(third, [...commonChoices, ...routes[2].choices]);
    expect(trueEnding.variables.true_plan).toBe(true);
    expect(trueEnding.turn.lines.map(line => line.text)).toContain('【马二福 True End：这一福，留给你】');
    expect(trueEnding.turn.lines.map(line => line.text)).not.toContain(routes[2].ending);
  });
});
