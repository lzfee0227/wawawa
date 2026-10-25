import type { StoryGraph } from './types.js';

/** A source structure map of explicit jumps, not a reachability or execution trace. */
export function analyzeStoryGraph(source: string): StoryGraph {
  const nodes: StoryGraph['nodes'] = [];
  const edges: StoryGraph['edges'] = [];
  // Preserve newlines so locations refer to the author's source, including comments.
  const lines = source.replace(/\/\*[\s\S]*?\*\//g, comment => comment.replace(/[^\n]/g, ' '))
    .split(/\r?\n/).map(line => line.replace(/\/\/.*$/, ''));
  const headings = new Map<number, string>();
  const scenes = new Map<string, string>();
  let knot = '';
  lines.forEach((line, index) => {
    const heading = line.match(/^\s*(={1,})\s*([A-Za-z_][\w-]*)\s*(?:=+)?\s*$/);
    if (!heading) return;
    if (heading[1].length >= 2) knot = heading[2];
    const path = heading[1].length === 1 && knot ? `${knot}.${heading[2]}` : heading[2];
    const id = `scene:${path}`;
    headings.set(index, path);
    scenes.set(path, id);
    nodes.push({ id, kind: 'scene', title: path, path, line: index + 1 });
  });

  let current = '';
  let choiceCount = 0;
  const choices: { id: string; depth: number }[] = [];
  const conditions: { original: string; active: string }[] = [];
  const owner = () => {
    if (choices.length) return choices[choices.length - 1].id;
    if (current) return scenes.get(current)!;
    if (!nodes.some(node => node.id === 'entry:root')) nodes.unshift({ id: 'entry:root', kind: 'scene', title: '故事入口', line: 1 });
    return 'entry:root';
  };
  const conditionLabel = (extra?: string) => {
    const values = [...conditions.map(condition => condition.active), ...(extra ? [extra] : [])];
    return values.length > 1 ? values.map(value => `(${value})`).join(' && ') : values[0];
  };
  const jump = (text: string, index: number, extraCondition?: string) => {
    const match = text.trim().match(/^->\s*([A-Za-z_][\w.-]*)\s*(?:#.*)?$/);
    if (!match) return;
    const path = match[1];
    let to: string | undefined;
    if (path === 'END' || path === 'DONE') {
      to = `ending:${path}`;
      if (!nodes.some(node => node.id === to)) nodes.push({ id: to, kind: 'ending', title: path === 'END' ? '故事结束' : '当前流程结束' });
    } else {
      const local = current.split('.')[0];
      to = scenes.get(`${local}.${path}`) ?? scenes.get(path);
    }
    // Variable diverts, function/tunnel calls and unresolved paths are not guessed.
    if (!to) return;
    const condition = conditionLabel(extraCondition);
    edges.push({ id: `edge:${index}:${edges.length}`, from: owner(), to, kind: condition ? 'conditional' : 'divert', ...(condition ? { condition } : {}) });
  };

  lines.forEach((line, index) => {
    const heading = headings.get(index);
    if (heading) {
      current = heading; choiceCount = 0; choices.length = 0; conditions.length = 0;
      return;
    }
    const text = line.trim();
    if (!text) return;
    const open = text.match(/^\{([^{}:]+):\s*$/);
    if (open) { conditions.push({ original: open[1].trim(), active: open[1].trim() }); return; }
    if (text === '}') { conditions.pop(); return; }
    if (/^-\s*else:\s*$/.test(text) && conditions.length) {
      const condition = conditions[conditions.length - 1];
      condition.active = `not (${condition.original})`;
      return;
    }
    const choice = text.match(/^([+*]+)\s*(?:\{([^}]+)\}\s*)?\[([^\]]+)\](.*)$/);
    if (choice) {
      const depth = choice[1].length;
      while (choices.length && choices[choices.length - 1].depth >= depth) choices.pop();
      const from = owner();
      const id = `choice:${current || 'root'}:${choiceCount++}`;
      const title = choice[3].trim();
      const condition = conditionLabel(choice[2]?.trim());
      nodes.push({ id, kind: 'choice', title, line: index + 1 });
      edges.push({ id: `edge:${index}:${edges.length}`, from, to: id, kind: 'choice', label: title, ...(condition ? { condition } : {}) });
      choices.push({ id, depth });
      jump(choice[4], index);
      return;
    }
    // A gather ends choices at that weave depth; don't keep attributing later jumps
    // to the last sibling. Gather fallthrough itself is not inferred by this map.
    const gather = text.match(/^(-+)(?!>)\s+(?!else:)/);
    if (gather) {
      while (choices.length && choices[choices.length - 1].depth >= gather[1].length) choices.pop();
      return;
    }
    const inline = text.match(/^\{([^{}:]+):\s*(->\s*[A-Za-z_][\w.-]*)\s*\}\s*$/);
    if (inline) jump(inline[2], index, inline[1].trim());
    else jump(text, index);
  });
  return { nodes, edges };
}
