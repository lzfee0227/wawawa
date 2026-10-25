// Real-player paths only: no ChoosePathString, variable injection, or synthetic echoes.
// node tools/verify-routes.mjs
// node --import tsx tools/verify-routes.mjs --service
// ERHA_TRANSCRIPTS=/tmp/erha-transcripts optionally exports the exercised prose.
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {Compiler} = require('inkjs/compiler/Compiler');
const {CompilerOptions} = require('inkjs/compiler/CompilerOptions');
const {Story} = require('inkjs/engine/Story');
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('story.ink', root), 'utf8');
const diagnostics = [];
const compiled = new Compiler(source, new CompilerOptions(null, [], false,
  (message, type) => diagnostics.push({message, type}))).Compile().ToJson();
assert.deepEqual(diagnostics, [], 'Ink diagnostics');
assert(source.length <= 100000, 'server source limit');
const service = process.argv.includes('--service')
  ? await import('../../../../apps/server/src/engine.ts') : null;
let serviceCompiled;
if (service) {
  const result = service.compile(source);
  assert.equal(result.ok, true, 'service compilation');
  assert.deepEqual(result.diagnostics, [], 'service compilation diagnostics');
  serviceCompiled = result.compiled;
}
const allowed = new Set(['narrator', 'li_er_ha', 'jin_en', 'jin_ni', 'he_min', 'ma_er_fu', 'gu_chang_ming', 'system']);
const results = [];
let maxLines = 0, maxCharacters = 0, maxState = 0, restoredTurns = 0, serviceTurns = 0;
function readTurn(story) {
  const lines = [];
  while (story.canContinue) {
    const text = story.Continue().trim();
    if (text) {
      const tags = [...story.currentTags];
      const speakers = tags.filter(tag => tag.startsWith('speaker:'));
      assert.equal(speakers.length, 1, `exactly one speaker: ${text}`);
      assert(allowed.has(speakers[0].slice(8).trim()), `registered speaker: ${text}`);
      lines.push({text, tags});
    }
    assert(lines.length <= 300, 'server turn line limit');
  }
  assert(!story.hasError, story.currentErrors?.join('\n'));
  maxLines = Math.max(maxLines, lines.length);
  maxCharacters = Math.max(maxCharacters, lines.reduce((n, line) => n + line.text.length, 0));
  maxState = Math.max(maxState, story.state.ToJson().length);
  assert(maxState <= 500000, 'server state limit');
  return {lines, choices: story.currentChoices.map(c => c.text)};
}
function verifyService(play, state, index) {
  if (!service) return;
  // This calls the production engine, including ContinueAsync and its 300 ms limit.
  const result = service.renderTurn(serviceCompiled, state, index);
  assert.deepEqual(result.turn.lines.map(({text, tags}) => ({text, tags})), play.turn.lines, 'service lines');
  assert.deepEqual(result.turn.choices.map(choice => choice.text), play.turn.choices, 'service choices');
  assert.equal(result.turn.ended, play.turn.choices.length === 0, 'service ended');
  assert.deepEqual(JSON.parse(result.inkState), JSON.parse(play.story.state.ToJson()), 'service saved state');
  for (const [name, value] of Object.entries(result.variables)) {
    assert.deepEqual(value, play.value(name), `service variable ${name}`);
  }
  serviceTurns++;
}
class Play {
  constructor(state) {
    this.story = new Story(compiled);
    if (state) this.story.state.LoadJson(state);
    const before = this.story.state.ToJson();
    this.turns = [];
    this.selected = [];
    this.turn = readTurn(this.story);
    this.turns.push(this.turn);
    verifyService(this, before);
  }
  value(name) { return this.story.variablesState.$(name); }
  has(text) { return this.turn.choices.includes(text); }
  choose(text) {
    const index = this.turn.choices.indexOf(text);
    assert(index >= 0, `Missing choice ${text}\nAvailable: ${this.turn.choices.join(' / ')}`);
    // Every exercised turn is also executed from its serialized state.
    const before = this.snapshot();
    const restored = new Story(compiled);
    restored.state.LoadJson(before);
    restored.ChooseChoiceIndex(index);
    const restoredTurn = readTurn(restored);
    this.story.ChooseChoiceIndex(index);
    this.turn = readTurn(this.story);
    assert.deepEqual(this.turn, restoredTurn, `restored output: ${text}`);
    assert.deepEqual(JSON.parse(this.story.state.ToJson()), JSON.parse(restored.state.ToJson()), 'restored state parity');
    verifyService(this, before, index);
    restoredTurns++;
    this.selected.push(text);
    this.turns.push(this.turn);
    return this;
  }
  snapshot() { return this.story.state.ToJson(); }
}
const routes = {
  jinni: '和罗金妮查诊疗站', hemin: '和何敏查契约实验室',
  ma: '和马二福回马家', partner: '和罗金恩组织撤离'
};
function atEnding(play) {
  return play.has('开启新周目') && (play.has('停在本轮结局') || play.has('停在这个结局'));
}
function drive(play, route, choices = [], {trueChoice = false, until = atEnding} = {}) {
  const desired = new Set([routes[route], ...choices]);
  const used = new Set();
  for (let step = 0; step < 90; step++) {
    if (until(play)) {
      for (const choice of choices) assert(used.has(choice), `planned choice not reached: ${choice}`);
      return play;
    }
    assert(play.turn.choices.length, `Unexpected end on ${route}`);
    if (play.has('按轮值口令分段撤离')) {
      assert.equal(play.has('先独自顶住，给伤员争取时间'), !play.value('extra_help_forfeited'), 'repayment forfeits further aid');
    }
    if (play.has('解除继承，封住本地福门')) {
      assert.equal(play.has('与她共同重订契约'), trueChoice, 'TE offer matches earned eligibility');
    }
    const matches = play.turn.choices.filter(choice => desired.has(choice));
    assert(matches.length <= 1, `ambiguous plan: ${matches.join(', ')}`);
    const choice = matches[0] ?? (play.has('怼回去') ? '怼回去' : play.turn.choices[0]);
    used.add(choice);
    play.choose(choice);
  }
  assert.fail('path exceeded 90 choices');
}
function checkEnd(name, play, ending, {shared, revoke, confirmed} = {}) {
  assert(atEnding(play), `${name}: ending menu`);
  assert.equal(play.value('ending_id'), ending, name);
  if (shared !== undefined) assert.equal(play.value('echo_shared_cost'), shared, `${name}: shared echo`);
  if (revoke !== undefined) assert.equal(play.value('echo_revocable_oath'), revoke, `${name}: revoke echo`);
  if (confirmed !== undefined) assert.equal(play.value('relationship_confirmed'), confirmed, `${name}: relationship`);
  assert(Number(play.value('echo_shared_cost') && !play.value('run_echo_shared_cost')) + Number(play.value('echo_revocable_oath') && !play.value('run_echo_revocable_oath')) <= 1, 'at most one new mechanism per run');
  const text = play.turns.flatMap(turn => turn.lines.map(line => line.text)).join('\n');
  results.push({name, ending, choices: play.selected.length, characters: text.length});
  if (process.env.ERHA_TRANSCRIPTS) {
    mkdirSync(process.env.ERHA_TRANSCRIPTS, {recursive: true});
    writeFileSync(`${process.env.ERHA_TRANSCRIPTS}/${name}.txt`, play.turns.map((turn, i) =>
      turn.lines.map(line => line.text).join('\n') + (play.selected[i] ? `\n\n> ${play.selected[i]}\n` : '')).join('\n'));
  }
  return play;
}
function scenario(name, route, choices, ending, expected = {}, options = {}) {
  return checkEnd(name, drive(new Play(), route, choices, options), ending, expected);
}
function restart(play) {
  const run = play.value('run_number');
  const echoes = ['echo_shared_cost', 'echo_revocable_oath'].map(name => play.value(name));
  const seenNames = ['seen_jinni', 'seen_hemin', 'seen_ma_good', 'seen_ma_true', 'seen_partner', 'seen_power'];
  const seen = seenNames.map(name => play.value(name));
  play.choose('开启新周目');
  assert.equal(play.value('run_number'), run + 1);
  for (const [name, value] of Object.entries({
    reputation: 0, courage: 0, investigation: 0, causality_debt: 0,
    trust_jin_en: 0, trust_jin_ni: 0, trust_he_min: 0, trust_ma_er_fu: 0,
    knows_bloodline: false, has_fumen_key: false, discipline_pending: false,
    badge_holder: 'unassigned', opening_response: 'silence', badge_returned_by_ma: false,
    shared_cost: false, revocable_oath: false, knows_system_cost: false,
    route: 'unselected', romance: false, relationship_confirmed: false,
    ma_apology: false, true_plan: false, identity_shared: false, records_shared: false,
    bloodline_shared: false, extra_help_forfeited: false, ma_respected: false, station_safe: false, trial_shared: false,
    evidence_public: false, relationship_ready: false, partner_focus: 'none',
    archive_focus: 'none', dangerous_delegations: 0, ending_id: ''
  })) assert.equal(play.value(name), value, `replay resets ${name}`);
  assert.deepEqual(['echo_shared_cost', 'echo_revocable_oath'].map(name => play.value(name)), echoes);
  assert.deepEqual(['run_echo_shared_cost', 'run_echo_revocable_oath'].map(name => play.value(name)), echoes);
  assert.deepEqual(seenNames.map(name => play.value(name)), seen, 'earned endings persist');
  play.turns = [play.turn];
  play.selected = [];
  return play;
}

// EY-N04/05: distinct complete and platonic endings, through actual dialogue.
const jinni = scenario('jinni-good', 'jinni', [], 'jinni_good', {shared:true, revoke:false, confirmed:true});
scenario('hemin-good', 'hemin', [], 'hemin_good', {shared:false, revoke:true, confirmed:true});
scenario('ma-first-run-good', 'ma', [], 'ma_good', {shared:false, revoke:false, confirmed:true});
for (const [route, ending] of [['jinni','jinni_partner'], ['hemin','hemin_partner'], ['ma','ma_partner']]) {
  scenario(`${route}-platonic`, route, ['先作为伙伴把事情查清'], ending, {confirmed:false});
}
scenario('partner-shared', 'partner', ['调查分担机制'], 'partner', {shared:true,revoke:false,confirmed:false});
scenario('partner-revoke', 'partner', ['调查撤销机制'], 'partner', {shared:false,revoke:true,confirmed:false});

// EY-N03/04: withheld facts and overstepping can be repaired; refusing repair has consequences.
scenario('identity-repaired', 'jinni', ['只说系统给了提示','把身份和记忆断层说清楚'], 'jinni_good', {confirmed:true});
scenario('identity-refused', 'jinni', ['只说系统给了提示','仍然不愿说出全部'], 'jinni_partner', {confirmed:false});
scenario('jinni-risk-repaired', 'jinni', ['直接切断总阀','独自承受整座渡口的坏运','承认逞强，约定下次先听口令'], 'jinni_good', {confirmed:true});
scenario('jinni-forfeits-further-aid', 'jinni', ['借势，把礼堂的钟声引过来','独自承受整座渡口的坏运','花时间偿还，放弃额外护助'], 'jinni_good', {shared:true});
scenario('jinni-risk-unrepaired', 'jinni', ['独自承受整座渡口的坏运','暂时无法答应，先把伤养好'], 'jinni_partner', {confirmed:false});
scenario('hemin-records-repaired', 'hemin', ['只交出能证明校董有罪的部分','先藏起实验，等掌握全部权限','先删掉，换取进入核心档案室','撤回交换，补读完整记录'], 'hemin_good', {confirmed:true});
scenario('hemin-records-refused', 'hemin', ['先删掉，换取进入核心档案室','保留交换，只以伙伴继续调查'], 'hemin_partner', {confirmed:false});
scenario('ma-consent-repaired', 'ma', ['替她签下解除申请','为代签道歉，把决定交还给她'], 'ma_good', {confirmed:true});
scenario('ma-consent-refused', 'ma', ['替她签下解除申请','仍觉得替她决定更稳妥'], 'ma_partner', {confirmed:false});

// EY-N05: local victory does not award a mechanism abandoned at the climax.
scenario('jinni-no-echo', 'jinni', ['先独自顶住，给伤员争取时间','接受两笔债，只撑三息','退出战斗，让普通护界完成撤离'], 'jinni_good', {shared:false,revoke:false});
scenario('jinni-final-handoff', 'jinni', ['先独自顶住，给伤员争取时间','接受两笔债，只撑三息','交回控制，接受伙伴接力'], 'jinni_good', {shared:true,revoke:false});
scenario('jinni-borrowing-refused', 'jinni', ['先独自顶住，给伤员争取时间','撤回借用，改用分段护界'], 'jinni_good', {shared:true,revoke:false});
scenario('hemin-no-echo', 'hemin', ['把副本交给顾长明，换取立即停机','保留交易，改用物理封门'], 'hemin_good', {shared:false,revoke:false});
scenario('hemin-final-repair', 'hemin', ['把副本交给顾长明，换取立即停机','收回副本，让当事人决定'], 'hemin_good', {shared:false,revoke:true});
scenario('power', 'partner', ['接受任命，独自掌握分配权','明知伙伴反对，仍独占权限'], 'power', {shared:false,revoke:false});
scenario('power-refused-after-warning', 'partner', ['接受任命，独自掌握分配权','放下印章，回到伙伴身边'], 'partner', {shared:true,revoke:false});
scenario('temporary-delegation-ended', 'ma', ['试用一次临时托管','终止托管，自己回应'], 'ma_good', {shared:false,revoke:false});
const host = scenario('bad-host', 'ma', ['试用一次临时托管','明知会失去选择，仍续签'], 'bad_host', {shared:false,revoke:false});
const kneel = scenario('bad-kneel', 'ma', ['查看献祭契约，再作决定','明知永久绑定，仍签服从'], 'bad_kneel', {shared:false,revoke:false});
for (const [name, play] of [['host', host], ['kneel', kneel]]) {
  const stop = new Play(play.snapshot());
  stop.choose('停在这个结局');
  assert.equal(stop.turn.choices.length, 0);
  const retry = new Play(play.snapshot());
  retry.choose('回到危险签署之前');
  assert.equal(retry.value('ending_id'), '');
  assert.equal(retry.value('dangerous_delegations'), 0);
  checkEnd(`${name}-retry`, drive(retry, 'ma'), 'ma_good', {shared:false,revoke:false});
  restart(new Play(play.snapshot()));
}
scenario('sacrifice-refused', 'ma', ['查看献祭契约，再作决定','拒绝献祭，回到伙伴身边'], 'ma_good');

// EY-N06: consecutive runs earn the prerequisite echoes; no direct state injection.
const romanceRuns = restart(new Play(jinni.snapshot()));
checkEnd('jinni-to-hemin', drive(romanceRuns, 'hemin'), 'hemin_good', {shared:true,revoke:true});
const twoEchoes = restart(new Play(romanceRuns.snapshot())).snapshot();
checkEnd('romance-sequence-te', drive(new Play(twoEchoes), 'ma', ['一起验证两道回响的线索','与她共同重订契约'], {trueChoice:true}), 'ma_true', {shared:true,revoke:true,confirmed:true});
checkEnd('te-eligible-player-chooses-local-seal', drive(new Play(twoEchoes), 'ma', ['一起验证两道回响的线索','解除继承，封住本地福门'], {trueChoice:true}), 'ma_good', {shared:true,revoke:true,confirmed:true});
for (const [name, choices] of [
  ['insufficient-trust', ['沉默不语','承认她道歉了，暂不原谅','替她签下解除申请','为代签道歉，把决定交还给她','说只要她对我道歉就够了','请她先签下继承，再慢慢改变制度','一起验证两道回响的线索']],
  ['no-joint-test', ['先救眼前的人，采用封门方案']],
  ['undisclosed-cost', ['只谈调查，保留个人记录','仍保留秘密，接受撤离保护','一起验证两道回响的线索']],
  ['no-romance', ['先作为伙伴把事情查清','一起验证两道回响的线索']],
  ['unrepaired-consent', ['替她签下解除申请','仍觉得替她决定更稳妥','一起验证两道回响的线索']],
  ['outstanding-debt', ['借势，把礼堂的钟声引过来','跟着回声去地下旧礼堂','借势护住手，立即取出','借福把压力集中到自己身上','保留时间，暂不偿还','一起验证两道回响的线索']]
]) {
  const play = drive(new Play(twoEchoes), 'ma', choices);
  checkEnd(`te-blocked-${name}`, play, play.value('relationship_confirmed') ? 'ma_good' : 'ma_partner');
}
checkEnd('te-debt-repaid', drive(new Play(twoEchoes), 'ma', ['借势，把礼堂的钟声引过来','跟着回声去地下旧礼堂','借势护住手，立即取出','借福把压力集中到自己身上','花时间偿还，放弃额外护助','一起验证两道回响的线索','与她共同重订契约'], {trueChoice:true}), 'ma_true');
checkEnd('te-disclosure-repaired', drive(new Play(twoEchoes), 'ma', ['只谈调查，保留个人记录','向全队补交完整代价记录','一起验证两道回响的线索','与她共同重订契约'], {trueChoice:true}), 'ma_true');
checkEnd('power-preserves-existing-echoes', drive(new Play(twoEchoes), 'partner', ['接受任命，独自掌握分配权','明知伙伴反对，仍独占权限']), 'power', {shared:true,revoke:true});
checkEnd('failure-preserves-existing-echoes', drive(new Play(twoEchoes), 'ma', ['先救眼前的人，采用封门方案','试用一次临时托管','明知会失去选择，仍续签']), 'bad_host', {shared:true,revoke:true});
const singleEcho = restart(new Play(jinni.snapshot()));
checkEnd('te-blocked-one-echo', drive(singleEcho, 'ma'), 'ma_good');
const partnerRuns = scenario('partner-sequence-ma-first', 'ma', [], 'ma_good');
restart(partnerRuns);
checkEnd('partner-sequence-shared', drive(partnerRuns, 'partner', ['调查分担机制']), 'partner', {shared:true,revoke:false});
restart(partnerRuns);
checkEnd('partner-sequence-revoke', drive(partnerRuns, 'partner', ['调查撤销机制']), 'partner', {shared:true,revoke:true});
restart(partnerRuns);
checkEnd('partner-sequence-te', drive(partnerRuns, 'ma', ['一起验证两道回响的线索','与她共同重订契约'], {trueChoice:true}), 'ma_true');
partnerRuns.choose('回顾已经抵达的结局');
const archiveText = partnerRuns.turn.lines.map(line => line.text).join('\n');
assert(archiveText.includes('你曾与马二福成婚'));
assert(archiveText.includes('你曾与马二福重订共同契约'));
assert(!archiveText.includes('你曾与罗金妮成婚'));
assert(!archiveText.includes('你曾与何敏成婚'));
partnerRuns.choose('返回本轮总结');
partnerRuns.choose('停在本轮结局');
assert.equal(partnerRuns.turn.choices.length, 0);
console.log(JSON.stringify({scenarios:results.length, restoredTurns, serviceTurns, maxLinesPerTurn:maxLines,
  maxCharactersPerTurn:maxCharacters, maxStateCharacters:maxState, diagnostics, results}, null, 2));
