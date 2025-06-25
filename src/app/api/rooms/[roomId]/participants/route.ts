import { NextResponse } from 'next/server';
import { getParticipants, mergeParticipantChanges, deleteParticipants } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  const participants = await getParticipants(roomId);
  return NextResponse.json({ participants });
}

export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.changes)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  const updated = await mergeParticipantChanges(roomId, body.changes);
  return NextResponse.json({ participants: updated });
}

export async function DELETE(req: Request, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId;
  await deleteParticipants(roomId);
  return NextResponse.json({ ok: true });
}
