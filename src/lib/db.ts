import { execFileSync, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import type { AvailabilityData } from './types';

const DB_PATH = path.join(process.cwd(), 'db.sqlite');

function run(sql: string, json = false): string {
  const args = json ? ['-json', DB_PATH] : [DB_PATH];
  try {
    return execFileSync('sqlite3', args, { input: sql, encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Failed to execute sqlite3 command. Make sure SQLite3 is installed.', e);
    return '';
  }
}

function init() {
  // Ensure the sqlite3 CLI is available
  const check = spawnSync('sqlite3', ['-version']);
  if (check.error) {
    throw new Error('sqlite3 command not found. Please install SQLite3 to use GatherEase.');
  }

  if (!existsSync(DB_PATH)) {
    execFileSync('sqlite3', [DB_PATH], { input: '' });
  }
  run('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, name TEXT, participants TEXT)');
}

export function getParticipants(id: string): AvailabilityData | null {
  init();
  const out = run(`SELECT participants FROM rooms WHERE id='${id.replace(/'/g, "''")}'`, true);
  if (!out) return null;
  try {
    const rows = JSON.parse(out);
    if (!rows.length) return null;
    const participants = JSON.parse(rows[0].participants);
    participants.forEach((p: any) => {
      p.availabilities = p.availabilities.map((a: any) => ({
        date: new Date(a.date),
        time: a.time,
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
  const data = JSON.stringify(participants).replace(/'/g, "''");
  run(`INSERT INTO rooms (id, participants) VALUES ('${id.replace(/'/g, "''")}', '${data}') ON CONFLICT(id) DO UPDATE SET participants='${data}'`);
}

export function deleteParticipants(id: string) {
  init();
  run(`UPDATE rooms SET participants=NULL WHERE id='${id.replace(/'/g, "''")}'`);
}

export function createRoom(id: string, name: string) {
  init();
  const safeName = name.replace(/'/g, "''");
  run(`INSERT INTO rooms (id, name) VALUES ('${id.replace(/'/g, "''")}', '${safeName}') ON CONFLICT(id) DO UPDATE SET name='${safeName}'`);
}

export function getRooms(): { id: string; name: string }[] {
  init();
  const out = run('SELECT id, name FROM rooms', true);
  if (!out) return [];
  try {
    return JSON.parse(out) as { id: string; name: string }[];
  } catch (e) {
    console.error('Failed to parse DB output', e);
    return [];
  }
}

export function updateRoomName(id: string, name: string) {
  init();
  run(`UPDATE rooms SET name='${name.replace(/'/g, "''")}' WHERE id='${id.replace(/'/g, "''")}'`);
}

export function getRoom(
  id: string
): { id: string; name: string | null; participants: AvailabilityData | null } | null {
  init();
  const out = run(`SELECT id, name, participants FROM rooms WHERE id='${id.replace(/'/g, "''")}'`, true);
  if (!out) return null;
  try {
    const rows = JSON.parse(out);
    if (!rows.length) return null;
    const row = rows[0];
    let participants: AvailabilityData | null = null;
    if (row.participants) {
      participants = JSON.parse(row.participants);
      participants.forEach((p: any) => {
        p.availabilities = p.availabilities.map((a: any) => ({
          date: new Date(a.date),
          time: a.time,
        }));
      });
    }
    return { id: row.id, name: row.name, participants };
  } catch (e) {
    console.error('Failed to parse DB output', e);
    return null;
  }
}
