import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Compiler}=require('inkjs/compiler/Compiler');
const {CompilerOptions}=require('inkjs/compiler/CompilerOptions');
const {Story}=require('inkjs/engine/Story');
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('story.ink',root),'utf8');
assert(source.length<=100000,'server source limit');
const diagnostics=[];
const compiled=new Compiler(source,new CompilerOptions(null,[],false,(message,type)=>diagnostics.push({message,type}))).Compile().ToJson();
assert.deepEqual(diagnostics,[]);
const allowed=new Set(['narrator','li_er_ha','jin_en','jin_ni','he_min','ma_er_fu','gu_chang_ming','system']);
let maxLines=0;
function drain(s){let lines=[],n=0;while(s.canContinue){const text=s.Continue().trim();if(text){n++;lines.push(text);const speakers=s.currentTags.filter(t=>t.startsWith('speaker:')); assert.equal(speakers.length,1,`speaker: ${text}`);assert(allowed.has(speakers[0].slice(8).trim()));}assert(n<300,'turn line limit');}maxLines=Math.max(n,maxLines);assert(s.state.ToJson().length<500000);return lines.join('\n');}
// EY-N02: traverse every first-chapter history and chapter-two investigation,
// checking the common-line handoff without altering story variables.
let histories=0;
function walk(s,depth=0){assert(depth<20);const text=drain(s);if(s.currentChoices.some(c=>c.text==='和罗金妮查诊疗站')){assert.equal(s.variablesState.$('badge_holder'),'li_er_ha');assert.equal(s.variablesState.$('ma_apology'),true);assert.equal(s.variablesState.$('knows_bloodline'),true);assert.equal(s.variablesState.$('has_fumen_key'),true);histories++;return;}
assert(s.currentChoices.length,'unexpected end');for(const c of s.currentChoices){const clone=new Story(compiled);clone.state.LoadJson(s.state.ToJson());clone.ChooseChoiceIndex(c.index);walk(clone,depth+1);}}
walk(new Story(compiled));
console.log(JSON.stringify({sourceCharacters:source.length,commonLineHistories:histories,maxLinesPerTurn:maxLines,diagnostics}));
