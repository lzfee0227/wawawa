import type { DraftRecord, SessionRecord, VersionRecord } from './types.js';
export interface Repository {
  listDrafts(): Promise<DraftRecord[]>;
  getDraft(id: string): Promise<DraftRecord | null>;
  insertDraft(draft: DraftRecord): Promise<void>;
  updateDraft(draft: DraftRecord, expectedRevision: number): Promise<boolean>;
  reserveVersion(id: string, revision: number): Promise<number | null>;
  insertVersion(version: VersionRecord): Promise<void>;
  listVersions(storyId: string): Promise<VersionRecord[]>;
  getVersion(id: string): Promise<VersionRecord | null>;
  insertSession(session: SessionRecord): Promise<void>;
  getSession(id: string): Promise<SessionRecord | null>;
  updateSession(session: SessionRecord, expectedRevision: number): Promise<boolean>;
}
