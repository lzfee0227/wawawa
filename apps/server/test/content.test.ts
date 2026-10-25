import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { compile, renderTurn } from '../src/engine.js';

type Rendered = ReturnType<typeof renderTurn>;

const commonChoices = [
  '沉默不语',
  '立界，硬挡这一击',
  '把旧校徽交给何敏',
  '接受道歉，要求以后停手',
  '先查李家的名字',
  '带大家去校史塔，先取证',
  '让大家分担护界压力',
];
const eveChoices = ['向全队公开全部代价记录', '保留自己决定的权利'];
const executePlan = '和伙伴执行已经准备的方案';
const routes = [
  {
    name: '罗金妮', ending: '【罗金妮结局：从小到大的约定】', route: 'jin_ni', endingId: 'jinni_good', seen: 'seen_jinni',
    choices: [
      '和罗金妮查诊疗站', '坦言也想更了解她',
      '坦白自己有记忆断层', '先按罗金妮的名单转移病人', '接受分担方案', '和罗金妮确认关系',
      ...eveChoices, executePlan, '按轮值口令分段撤离',
    ],
  },
  {
    name: '何敏', ending: '【何敏结局：答案之外】', route: 'he_min', endingId: 'hemin_good', seen: 'seen_hemin',
    choices: [
      '和何敏查契约实验室', '坦言也想更了解她',
      '交出完整的系统代价记录', '让实验公开，接受同学质询', '保留对自己不利的证据', '和何敏确认关系',
      ...eveChoices, executePlan, '保护副本，让当事人逐一撤销',
    ],
  },
  {
    name: '马二福', ending: '【马二福 Good End：名字写在一起】', route: 'ma_er_fu', endingId: 'ma_good', seen: 'seen_ma_good',
    choices: [
      '和马二福回马家', '坦言也想更了解她',
      '要求她自己决定，我只作见证', '告诉她道歉必须包含具体补偿',
      '请她拒绝单人继承，提出共同方案', '和马二福确认关系',
      ...eveChoices, executePlan, '解除继承，封住本地福门',
    ],
  },
  {
    name: '伙伴', ending: '【伙伴结局：霍海的新校规】', route: 'partner', endingId: 'partner', seen: 'seen_partner',
    choices: [
      '和罗金恩组织撤离', '明确选择伙伴同行',
      '先建立公开的撤离名单', '调查分担机制', ...eveChoices, executePlan,
      '拒绝独占，和伙伴一起封门', '选择单身，与伙伴继续出勤',
    ],
  },
];

describe('repository story: Erha Youfu R02/R04–R07', () => {
  let compiled: string;
  beforeAll(() => {
    const source = readFileSync(new URL('../../../content/stories/erha-youfu/story.ink', import.meta.url), 'utf8');
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

  it('keeps the generated source in sync with all eight chapter sources', () => {
    const build = fileURLToPath(new URL('../../../content/stories/erha-youfu/tools/build.mjs', import.meta.url));
    expect(() => execFileSync(process.execPath, [build, '--check'], { encoding: 'utf8' })).not.toThrow();
  });

  it('compiles the complete repository source and presents the opening choices', () => {
    const first = renderTurn(compiled);
    expect(first.turn.lines[0]).toMatchObject({ speaker: 'narrator', music: 'rain' });
    expect(first.turn.choices.map(choice => choice.text)).toEqual(['沉默不语', '忽略她，直接路过', '怼回去', '先道歉']);
    expect(first.variables).toMatchObject({ run_number: 1, route: 'unselected', echo_shared_cost: false, echo_revocable_oath: false });
  });

  it.each(routes)('reaches $name ending summary through valid choices and can stop', route => {
    const summary = play(renderTurn(compiled), [...commonChoices, ...route.choices]);
    expect(summary.variables.route).toBe(route.route);
    expect(summary.turn.lines.map(line => line.text)).toContain(route.ending);
    expect(summary.variables).toMatchObject({ ending_id: route.endingId, [route.seen]: true, run_number: 1, true_plan: false });
    expect(summary.turn.choices.map(choice => choice.text)).toEqual(['开启新周目', '回顾已经抵达的结局', '停在本轮结局']);
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
    expect(second.variables).toEqual({
      ...first.variables,
      run_number: 2, echo_shared_cost: true, run_echo_shared_cost: true, seen_jinni: true,
    });
    expect(second.turn.lines.some(line => line.text.includes('另一种可能从这场雨开始'))).toBe(true);
    expect(second.turn.choices.map(choice => choice.text)).toEqual(first.turn.choices.map(choice => choice.text));

    const hemin = play(second, [...commonChoices, ...routes[1].choices]);
    expect(hemin.variables).toMatchObject({ echo_shared_cost: true, echo_revocable_oath: true });
    const third = choose(hemin, '开启新周目');
    expect(third.variables).toEqual({
      ...first.variables,
      run_number: 3, echo_shared_cost: true, echo_revocable_oath: true,
      run_echo_shared_cost: true, run_echo_revocable_oath: true, seen_jinni: true, seen_hemin: true,
    });

    const ready = play(third, [
      ...commonChoices, ...routes[2].choices.slice(0, -2),
      '一起验证两道回响的线索', executePlan,
    ]);
    expect(ready.turn.choices.map(choice => choice.text)).toContain('与她共同重订契约');
    expect(ready.variables).toMatchObject({ true_plan: true, shared_cost: true, revocable_oath: true, ma_respected: true, relationship_confirmed: true });
    const trueEnding = choose(ready, '与她共同重订契约');
    expect(trueEnding.variables.true_plan).toBe(true);
    expect(trueEnding.turn.lines.map(line => line.text)).toContain('【马二福 True End：这一福，留给你】');
    expect(trueEnding.turn.lines.map(line => line.text)).not.toContain(routes[2].ending);
    expect(trueEnding.variables).toMatchObject({ ending_id: 'ma_true', seen_jinni: true, seen_hemin: true, seen_ma_true: true, seen_ma_good: false, seen_partner: false, seen_power: false });

    const archive = choose(trueEnding, '回顾已经抵达的结局');
    expect(archive.variables).toEqual(trueEnding.variables);
    const memories = archive.turn.lines.map(line => line.text).filter(text => text.startsWith('你曾'));
    expect(memories).toHaveLength(3);
    expect(memories.some(text => text.includes('罗金妮成婚'))).toBe(true);
    expect(memories.some(text => text.includes('何敏成婚'))).toBe(true);
    expect(memories.some(text => text.includes('马二福重订共同契约'))).toBe(true);
    const returned = choose(archive, '返回本轮总结');
    expect(returned.variables).toEqual(trueEnding.variables);
    const fourth = choose(returned, '开启新周目');
    expect(fourth.variables).toEqual({
      ...first.variables, run_number: 4,
      echo_shared_cost: true, echo_revocable_oath: true,
      run_echo_shared_cost: true, run_echo_revocable_oath: true,
      seen_jinni: true, seen_hemin: true, seen_ma_true: true,
    });
  });
});
