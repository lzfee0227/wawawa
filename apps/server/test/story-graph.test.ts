import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeStoryGraph } from '../src/story-graph.js';

describe('story graph', () => {
  it('extracts scenes, choices, conditional labels and endings', () => {
    const graph = analyzeStoryGraph(`-> start\n=== start ===\n* {trust > 0} [继续]\n -> next\n* [离开]\n -> END\n=== next ===\n继续\n-> END`);
    expect(graph.nodes.map(node => node.id)).toEqual(expect.arrayContaining(['scene:start', 'scene:next', 'ending:END']));
    expect(graph.nodes.filter(node => node.kind === 'choice')).toHaveLength(2);
    expect(graph.edges.some(edge => edge.condition === 'trust > 0')).toBe(true);
    expect(graph.edges.some(edge => edge.to === 'ending:END')).toBe(true);
  });

  it('V10 attaches each branch jump only to its choice even after a long passage', () => {
    const graph = analyzeStoryGraph(`-> start\n=== start ===\n* [继续]\n${'  长段落\n'.repeat(20)}  -> next\n* [离开]\n  -> END\n=== next ===\n-> END`);
    expect(graph.edges.filter(edge => edge.from === 'scene:start').map(edge => edge.to)).toEqual(['choice:start:0', 'choice:start:1']);
    expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: 'choice:start:0', to: 'scene:next' })]));
    expect(graph.nodes.find(node => node.id === 'scene:next')?.line).toBe(27);
    expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: 'entry:root', to: 'scene:start' })]));
  });

  it('V10 preserves explicit conditional and inline jumps without inventing missing targets', () => {
    const graph = analyzeStoryGraph(`-> start\n=== start ===\n{ready:\n  {trust: -> next}\n  -> END\n- else:\n  -> start\n}\n=== next ===\n-> END\n// -> invented\n/*\n=== fake ===\n-> fake\n*/`);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'scene:start', to: 'scene:next', kind: 'conditional', condition: '(ready) && (trust)' }),
      expect.objectContaining({ from: 'scene:start', to: 'scene:start', condition: 'not (ready)' })
    ]));
    expect(graph.nodes.some(node => node.path === 'fake')).toBe(false);
    expect(graph.nodes.some(node => node.path === 'invented')).toBe(false);
  });

  it('V10 handles root-only stories, inline choice jumps and stitch targets', () => {
    const graph = analyzeStoryGraph('=== start ===\n* [继续] -> part\n= part\n-> END');
    expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: 'choice:start:0', to: 'scene:start.part' })]));
    expect(graph.nodes.find(node => node.id === 'scene:start.part')?.line).toBe(3);
    const root = analyzeStoryGraph('结束\n-> END');
    expect(root.edges).toEqual([expect.objectContaining({ from: 'entry:root', to: 'ending:END' })]);
  });

  it('V10 ends nested choice ownership at a gather and never creates a dynamic target', () => {
    const graph = analyzeStoryGraph('=== start ===\n* [A]\n** [B]\n  -> end\n- 汇合\n-> END\n=== end ===\n-> dynamic_target');
    expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ from: 'choice:start:0', to: 'choice:start:1' }), expect.objectContaining({ from: 'choice:start:1', to: 'scene:end' }), expect.objectContaining({ from: 'scene:start', to: 'ending:END' })]));
    expect(graph.nodes.some(node => node.id === 'scene:dynamic_target')).toBe(false);
    expect(new Set(graph.edges.map(edge => edge.id)).size).toBe(graph.edges.length);
  });

  it('V10 maps the actual erha entry, hidden inline finale and replay cycle', () => {
    const source = readFileSync(new URL('../../../content/stories/erha-youfu/story.ink', import.meta.url), 'utf8');
    const graph = analyzeStoryGraph(source);
    const ids = new Set(graph.nodes.map(node => node.id));
    expect(ids.size).toBe(graph.nodes.length);
    expect(graph.edges.every(edge => ids.has(edge.from) && ids.has(edge.to))).toBe(true);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'entry:root', to: 'scene:arrival' }),
      expect.objectContaining({ from: 'scene:chapter_08_ma', to: 'scene:end_ma_true', condition: '(relationship_confirmed) && (true_plan)' }),
      expect.objectContaining({ from: 'scene:replay_start', to: 'scene:arrival' })
    ]));
    expect(graph.edges.filter(edge => edge.from === 'scene:arrival').every(edge => edge.kind === 'choice')).toBe(true);
    expect(graph.nodes.filter(node => node.path).every(node => source.split('\n')[node.line! - 1].includes(node.path!))).toBe(true);
  });
});
