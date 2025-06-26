import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import type { AvailabilityData } from './types';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let sqlite: any | null = null;
let pool: Pool | null = null;
let dbType: 'sqlite' | 'postgres' | null = null;

async function init() {
  if (dbType) return;
  if (POSTGRES_URL) {
    pool = new Pool({ connectionString: POSTGRES_URL });
    await pool.query(
      'CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, participants TEXT)'
    );
    dbType = 'postgres';
  } else {
    sqlite = new Database(DB_PATH);
    sqlite
      .prepare('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, participants TEXT)')
      .run();
    dbType = 'sqlite';
  }
}

export async function getParticipants(id: string): Promise<AvailabilityData | null> {
  await init();
  if (dbType === 'postgres') {
    const res = await pool!.query('SELECT participants FROM rooms WHERE id=$1', [id]);
    if (res.rows.length === 0) return null;
    try {
      const participants = JSON.parse(res.rows[0].participants);
      participants.forEach((p: any) => {
        p.availabilities = p.availabilities.map((a: any) => ({
          date: new Date(a.date),
          times: Array.isArray(a.times) ? a.times : [a.time].filter(Boolean),
        }));
      });
      return participants;
    } catch (e) {
      console.error('Failed to parse DB output', e);
      return null;
    }
  } else {
    const row = sqlite!
      .prepare('SELECT participants FROM rooms WHERE id=?')
      .get(id);
    if (!row) return null;
    try {
      const participants = JSON.parse(row.participants);
      participants.forEach((p: any) => {
        p.availabilities = p.availabilities.map((a: any) => ({
          date: new Date(a.date),
          times: Array.isArray(a.times) ? a.times : [a.time].filter(Boolean),
        }));
      });
      return participants;
    } catch (e) {
      console.error('Failed to parse DB output', e);
      return null;
    }
  }
}

export async function saveParticipants(id: string, participants: AvailabilityData) {
  await init();
  const data = JSON.stringify(participants);
  if (dbType === 'postgres') {
    await pool!.query(
      'INSERT INTO rooms (id, participants) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET participants=$2',
      [id, data]
    );
  } else {
    sqlite!
      .prepare(
        'INSERT INTO rooms (id, participants) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET participants=?'
      )
      .run(id, data, data);
  }
}

export async function deleteParticipants(id: string) {
  await init();
  if (dbType === 'postgres') {
    await pool!.query('DELETE FROM rooms WHERE id=$1', [id]);
  } else {
    sqlite!.prepare('DELETE FROM rooms WHERE id=?').run(id);
  }
}
