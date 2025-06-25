"use client";

import { useCallback } from 'react';
import type { AvailabilityData, ParticipantAvailability } from '@/lib/types';

function debounce<F extends (...args: any[]) => void>(fn: F, wait: number) {
  let t: NodeJS.Timeout;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function useParticipants(roomId: string) {
  const saveParticipants = useCallback(
    debounce(async (changes: Partial<ParticipantAvailability>[]) => {
      await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      }).catch(() => {});
    }, 500),
    [roomId]
  );

  const loadParticipants = useCallback(async (): Promise<AvailabilityData> => {
    const res = await fetch(`/api/rooms/${roomId}/participants`);
    const data = await res.json();
    return data.participants as AvailabilityData;
  }, [roomId]);

  const clearParticipants = useCallback(async () => {
    await fetch(`/api/rooms/${roomId}/participants`, { method: 'DELETE' }).catch(() => {});
  }, [roomId]);

  return { saveParticipants, loadParticipants, clearParticipants };
}
