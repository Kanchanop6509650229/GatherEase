"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';

type Room = { id: string; name: string };

export default function Lobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState('');

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (e) {
      console.error('Failed to load rooms', e);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleCreate = async () => {
    if (!newRoom.trim()) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoom }),
      });
      const data = await res.json();
      router.push(`/rooms/${data.id}`);
    } catch (e) {
      console.error('Failed to create room', e);
    }
  };

  const handleRename = async (id: string, name: string) => {
    try {
      await fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (e) {
      console.error('Failed to rename room', e);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-semibold text-foreground">GatherEase Lobby</h1>
      </header>
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:p-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="flex gap-2">
            <Input value={newRoom} onChange={e => setNewRoom(e.target.value)} placeholder="New room name" />
            <Button onClick={handleCreate}>Create</Button>
          </div>
          <ul className="space-y-2">
            {rooms.map(room => (
              <li key={room.id} className="flex items-center gap-2">
                <Input
                  className="flex-grow"
                  value={room.name || ''}
                  onChange={e => {
                    const value = e.target.value;
                    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, name: value } : r));
                  }}
                  onBlur={e => handleRename(room.id, e.target.value)}
                />
                <Button variant="outline" onClick={() => router.push(`/rooms/${room.id}`)}>
                  Open
                </Button>
              </li>
            ))}
            {rooms.length === 0 && <p className="text-muted-foreground">No rooms yet.</p>}
          </ul>
        </div>
      </main>
    </div>
  );
}
