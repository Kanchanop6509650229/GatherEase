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
  run('CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, participants TEXT)');
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
  const data = JSON.stringify(participants).replace(/'/g, "''");
  run(`INSERT INTO rooms (id, participants) VALUES ('${id.replace(/'/g, "''")}', '${data}') ON CONFLICT(id) DO UPDATE SET participants='${data}'`);
}

export function deleteParticipants(id: string) {
  init();
  run(`DELETE FROM rooms WHERE id='${id.replace(/'/g, "''")}'`);
}
