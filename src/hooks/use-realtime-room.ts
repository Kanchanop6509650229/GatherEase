"use client";
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export function useRealtimeRoom(roomId: string) {
  useEffect(() => {
    if (!roomId) return;
    const socket: Socket = io('/api/socket/io');
    socket.emit('join', roomId);
    return () => {
      socket.disconnect();
    };
  }, [roomId]);
}
