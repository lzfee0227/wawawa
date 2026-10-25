import type { StoryGraph } from './types.js';

export function analyzeStoryGraph(source: string): StoryGraph {
  const nodes: StoryGraph['nodes'] = [];
  const edges: StoryGraph['edges'] = [];
  const scenes = new Map<string, string>();
  let current: string | undefined;
  let choiceCount = 0;
  const lines = source.split(/\r?\n/);
  const ensureScene = (path: string, line: number) => {
    const id = `scene:${path}`;
    if (!scenes.has(path)) { scenes.set(path, id); nodes.push({ id, kind: 'scene', title: path, path, line }); }
    return id;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^\s*={2,3}\s*([A-Za-z_][\w-]*)\s*={2,3}/);
    if (heading) { current = heading[1]; ensureScene(current, index + 1); choiceCount = 0; continue; }
    if (!current) continue;
    const choice = line.match(/^\s*[+*]\s*(?:\{([^}]+)\}\s*)?\[([^\]]+)\]/);
    if (choice) {
      const choiceId = `choice:${current}:${choiceCount++}`;
      nodes.push({ id: choiceId, kind: 'choice', title: choice[2].trim(), line: index + 1 });
      edges.push({ id: `edge:${current}:${choiceId}`, from: scenes.get(current)!, to: choiceId, kind: 'choice', label: choice[2].trim(), ...(choice[1] ? { condition: choice[1].trim() } : {}) });
      for (let next = index + 1; next < Math.min(lines.length, index + 12); next += 1) {
        const divert = lines[next].match(/^\s*->\s*([A-Za-z_][\w-]*|END)\s*$/);
        if (divert) { const target = divert[1]; const to = target === 'END' ? ensureEnding(nodes) : ensureScene(target, next + 1); edges.push({ id: `edge:${choiceId}:${to}`, from: choiceId, to, kind: 'divert' }); break; }
        if (/^\s*[+*]\s*/.test(lines[next]) || /^\s*={2,3}\s*/.test(lines[next])) break;
      }
      continue;
    }
    const divert = line.match(/^\s*->\s*([A-Za-z_][\w-]*|END)\s*$/);
    if (divert) { const target = divert[1]; const to = target === 'END' ? ensureEnding(nodes) : ensureScene(target, index + 1); edges.push({ id: `edge:${scenes.get(current)}:${to}:${index}`, from: scenes.get(current)!, to, kind: 'divert' }); }
  }
  return { nodes, edges };
}

function ensureEnding(nodes: StoryGraph['nodes']) {
  const id = 'ending:END';
  if (!nodes.some(node => node.id === id)) nodes.push({ id, kind: 'ending', title: '故事结束' });
  return id;
}
