import { MongoClient, type Db } from 'mongodb';
import type { Repository } from './repository.js';
import type { DraftRecord, SessionRecord, VersionRecord } from './types.js';

export class MongoRepository implements Repository {
  private drafts; private versions; private sessions;
  constructor(db: Db) {
    this.drafts = db.collection<DraftRecord>('drafts');
    this.versions = db.collection<VersionRecord>('versions');
    this.sessions = db.collection<SessionRecord>('sessions');
  }
  async initialize() {
    await Promise.all([
      this.drafts.createIndex({ id: 1 }, { unique: true }),
      this.versions.createIndex({ id: 1 }, { unique: true }),
      this.versions.createIndex({ storyId: 1, number: -1 }, { unique: true }),
      this.sessions.createIndex({ id: 1 }, { unique: true })
    ]);
  }
  async listDrafts() { return this.drafts.find({}, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).toArray(); }
  async getDraft(id: string) { return this.drafts.findOne({ id }, { projection: { _id: 0 } }); }
  async insertDraft(draft: DraftRecord) { await this.drafts.insertOne(structuredClone(draft)); }
  async updateDraft(draft: DraftRecord, expectedRevision: number) {
    // Keep the publication counter: publishing and editing may overlap.
    const { publicationCounter: _, ...fields } = draft;
    return (await this.drafts.updateOne({ id: draft.id, revision: expectedRevision }, { $set: fields })).matchedCount === 1;
  }
  async reserveVersion(id: string, revision: number) {
    const result = await this.drafts.findOneAndUpdate({ id, revision }, { $inc: { publicationCounter: 1 } }, { returnDocument: 'after' });
    return result?.publicationCounter ?? null;
  }
  async insertVersion(version: VersionRecord) { await this.versions.insertOne(structuredClone(version)); }
  async listVersions(storyId: string) { return this.versions.find({ storyId }, { projection: { _id: 0 } }).sort({ number: -1 }).toArray(); }
  async getVersion(id: string) { return this.versions.findOne({ id }, { projection: { _id: 0 } }); }
  async insertSession(session: SessionRecord) { await this.sessions.insertOne(structuredClone(session)); }
  async getSession(id: string) { return this.sessions.findOne({ id }, { projection: { _id: 0 } }); }
  async updateSession(session: SessionRecord, expectedRevision: number) {
    return (await this.sessions.replaceOne({ id: session.id, revision: expectedRevision }, session)).matchedCount === 1;
  }
}

export async function connectMongo(uri: string) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const repository = new MongoRepository(client.db());
  await repository.initialize();
  return { repository, close: () => client.close() };
}
