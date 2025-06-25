import sqlite3 from 'sqlite3';
import path from 'path';
import type { AvailabilityData, ParticipantAvailability } from './types';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');

let db: sqlite3.Database | null = null;

function init() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH);
    db.serialize(() => {
      db!.run('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY)');
      db!.run(
        'CREATE TABLE IF NOT EXISTS participants (room_id TEXT, id TEXT, name TEXT, availabilities TEXT, notes TEXT, PRIMARY KEY(room_id, id))'
      );
    });
  }
}
export async function getParticipants(roomId: string): Promise<AvailabilityData> {
  init();
  return new Promise((resolve, reject) => {
    db!.all(
      'SELECT * FROM participants WHERE room_id=?',
      [roomId],
      (err, rows) => {
        if (err) return reject(err);
        const participants: AvailabilityData = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          notes: row.notes ?? undefined,
          availabilities: JSON.parse(row.availabilities).map((a: any) => ({
            date: new Date(a.date),
            time: a.time,
          })),
        }));
        resolve(participants);
      }
    );
  });
}

export async function saveParticipants(
  id: string,
  participants: AvailabilityData
): Promise<void> {
  init();
  const data = JSON.stringify(participants);
  return new Promise((resolve, reject) => {
    db!.run(
      'INSERT INTO rooms (id, participants) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET participants=?',
      [id, data, data],
      err => (err ? reject(err) : resolve())
    );
  });
}

export async function mergeParticipantChanges(
  roomId: string,
  changes: Partial<ParticipantAvailability>[]
): Promise<AvailabilityData> {
  init();
  return new Promise((resolve, reject) => {
    const stmt = db!.prepare(
      'INSERT INTO participants (room_id, id, name, availabilities, notes) VALUES (?, ?, ?, ?, ?)' +
        ' ON CONFLICT(room_id, id) DO UPDATE SET name=excluded.name, availabilities=excluded.availabilities, notes=excluded.notes'
    );
    db!.serialize(() => {
      for (const p of changes) {
        stmt.run(
          roomId,
          p.id,
          p.name ?? '',
          JSON.stringify(p.availabilities ?? []),
          p.notes ?? null
        );
      }
      stmt.finalize(err => {
        if (err) return reject(err);
        db!.all(
          'SELECT * FROM participants WHERE room_id=?',
          [roomId],
          (err2, rows) => {
            if (err2) return reject(err2);
            const updated: AvailabilityData = rows.map((row: any) => ({
              id: row.id,
              name: row.name,
              notes: row.notes ?? undefined,
              availabilities: JSON.parse(row.availabilities).map((a: any) => ({
                date: new Date(a.date),
                time: a.time,
              })),
            }));
            resolve(updated);
          }
        );
      });
    });
  });
}

export async function deleteParticipants(roomId: string): Promise<void> {
  init();
  return new Promise((resolve, reject) => {
    db!.run('DELETE FROM participants WHERE room_id=?', [roomId], err =>
      err ? reject(err) : resolve()
    );
  });
}
