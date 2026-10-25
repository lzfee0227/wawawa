import { useState } from 'react';
import type { Version } from './api';

export function ChapterPlaytest({ versions, busy, onStart }: {
  versions: Version[]; busy: boolean; onStart: (versionId: string, entryId: string) => void;
}) {
  const [versionId, setVersionId] = useState('');
  const [chapter, setChapter] = useState('');
  const [entryId, setEntryId] = useState('');
  const version = versions.find(item => item.id === versionId) ?? versions[0];
  const entries = version?.playtestEntries ?? [];
  const chapters = [...new Set(entries.map(entry => entry.chapter))];
  const currentChapter = chapters.includes(chapter) ? chapter : chapters[0];
  const presets = entries.filter(entry => entry.chapter === currentChapter);
  const entry = presets.find(item => item.id === entryId) ?? presets[0];

  return <section className="panel chapter-playtest" aria-label="指定章节试跑">
    <span className="tiny-label">CHAPTER PLAYTEST</span><h2>指定章节试跑</h2>
    <p className="muted">使用作者预设的前情开始测试，不是你的实际游玩历史。试跑单独存档，正常进度仍会保留。</p>
    {version ? <>
      <label className="field-label" htmlFor="playtest-version">试跑版本</label>
      <select id="playtest-version" disabled={busy} value={version.id} onChange={event => { setVersionId(event.target.value); setChapter(''); setEntryId(''); }}>
        {versions.map(item => <option value={item.id} key={item.id}>v{item.number}{item.id === versions[0].id ? ' · 最新发布' : ''}</option>)}
      </select>
      {entry ? <>
        <label className="field-label" htmlFor="playtest-chapter">起始章节</label>
        <select id="playtest-chapter" disabled={busy} value={currentChapter} onChange={event => { setChapter(event.target.value); setEntryId(''); }}>
          {chapters.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="field-label" htmlFor="playtest-preset">前情预设</label>
        <select id="playtest-preset" aria-describedby="playtest-description" disabled={busy} value={entry.id} onChange={event => setEntryId(event.target.value)}>
          {presets.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <p id="playtest-description" className="muted">{entry.description}</p>
        <button className="primary" disabled={busy} onClick={() => onStart(version.id, entry.id)}>从此章节试跑</button>
      </> : <p className="muted">此版本未配置章节入口。请在完整剧本中添加章节试跑预设，编译并重新发布；单章演示稿结束后不能直接续接下一章。</p>}
    </> : <p className="muted">先在剧本工作室导入或编辑完整剧本，编译并发布后选择章节。</p>}
  </section>;
}
