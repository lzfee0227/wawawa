import { describe, expect, it } from 'vitest';
import { analyzeStoryGraph } from '../src/story-graph.js';

describe('story graph', () => {
  it('extracts scenes, choices, conditional labels and endings', () => {
    const graph = analyzeStoryGraph(`-> start\n=== start ===\n* {trust > 0} [继续]\n -> next\n* [离开]\n -> END\n=== next ===\n继续\n-> END`);
    expect(graph.nodes.map(node => node.id)).toEqual(expect.arrayContaining(['scene:start', 'scene:next', 'ending:END']));
    expect(graph.nodes.filter(node => node.kind === 'choice')).toHaveLength(2);
    expect(graph.edges.some(edge => edge.condition === 'trust > 0')).toBe(true);
    expect(graph.edges.some(edge => edge.to === 'ending:END')).toBe(true);
  });
});
