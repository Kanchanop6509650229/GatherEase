import { NextResponse } from 'next/server';
import {
  getParticipants,
  saveParticipants,
  deleteParticipants,
  getRoom,
  updateRoomName,
} from '@/lib/db';

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  const room = getRoom(params.roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ name: room.name, participants: room.participants || [] });
}

export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.participants)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  saveParticipants(params.roomId, body.participants);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request, { params }: { params: { roomId: string } }) {
  const body = await req.json().catch(() => ({}));
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  updateRoomName(params.roomId, body.name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { roomId: string } }) {
  deleteParticipants(params.roomId);
  return NextResponse.json({ ok: true });
}
