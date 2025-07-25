import { NextResponse } from 'next/server';
import { getParticipants, saveParticipants, deleteParticipants } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  const participants = (await getParticipants(roomId)) || [];
  return NextResponse.json({ participants });
}

export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.participants)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  await saveParticipants(roomId, body.participants);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  await deleteParticipants(roomId);
  return NextResponse.json({ ok: true });
}
