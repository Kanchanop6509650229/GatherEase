import { NextResponse } from 'next/server';
import { createRoom, getRooms } from '@/lib/db';

export async function GET() {
  const rooms = getRooms();
  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  const id = crypto.randomUUID();
  createRoom(id, body.name);
  return NextResponse.json({ id });
}
