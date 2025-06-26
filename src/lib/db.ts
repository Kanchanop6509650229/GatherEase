import Database from 'better-sqlite3';
import path from 'path';
import type { AvailabilityData } from './types';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');

let db: any | null = null;

function init() {
  if (!db) {
    db = new Database(DB_PATH);
    db.prepare('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, participants TEXT)').run();
  }
}

export function getParticipants(id: string): AvailabilityData | null {
  init();
  const row = db!.prepare('SELECT participants FROM rooms WHERE id=?').get(id);
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

export function saveParticipants(id: string, participants: AvailabilityData) {
  init();
  const data = JSON.stringify(participants);
  db!.prepare(
    'INSERT INTO rooms (id, participants) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET participants=?'
  ).run(id, data, data);
}

export function deleteParticipants(id: string) {
  init();
  db!.prepare('DELETE FROM rooms WHERE id=?').run(id);
}
