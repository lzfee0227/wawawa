import type { Repository } from '../src/repository.js';
import type { DraftRecord, SessionRecord, VersionRecord } from '../src/types.js';
const copy = <T>(value: T): T => structuredClone(value);
export class MemoryRepository implements Repository {
  drafts = new Map<string, DraftRecord>(); versions = new Map<string, VersionRecord>(); sessions = new Map<string, SessionRecord>();
  async listDrafts() { return copy([...this.drafts.values()]); }
  async getDraft(id: string) { return copy(this.drafts.get(id) ?? null); }
  async insertDraft(d: DraftRecord) { this.drafts.set(d.id, copy(d)); }
  async updateDraft(d: DraftRecord, revision: number) {
    const old = this.drafts.get(d.id);
    if (!old || old.revision !== revision) return false;
    this.drafts.set(d.id, copy({ ...d, publicationCounter: old.publicationCounter })); return true;
  }
  async reserveVersion(id: string, revision: number) {
    const d = this.drafts.get(id);
    if (!d || d.revision !== revision) return null;
    return ++d.publicationCounter;
  }
  async insertVersion(v: VersionRecord) { this.versions.set(v.id, copy(v)); }
  async listVersions(id: string) { return copy([...this.versions.values()].filter(v => v.storyId === id).sort((a,b) => b.number - a.number)); }
  async getVersion(id: string) { return copy(this.versions.get(id) ?? null); }
  async insertSession(s: SessionRecord) { this.sessions.set(s.id, copy(s)); }
  async getSession(id: string) { return copy(this.sessions.get(id) ?? null); }
  async updateSession(s: SessionRecord, revision: number) {
    if (this.sessions.get(s.id)?.revision !== revision) return false;
    this.sessions.set(s.id, copy(s)); return true;
  }
}
