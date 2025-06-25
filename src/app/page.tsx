"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AvailabilityData } from '@/lib/types';
import type { SuggestRestaurantInput, SuggestRestaurantOutput } from '@/ai/flows/suggest-restaurant';
import { DatePollingForm } from '@/components/date-polling-form';
import { AvailabilityMatrix } from '@/components/availability-matrix';
import { RestaurantSuggestionForm } from '@/components/restaurant-suggestion-form';
import { RestaurantResultCard } from '@/components/restaurant-result-card';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';
import { getRestaurantSuggestion } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeRoom } from '@/hooks/use-realtime-room';


function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomId, setRoomId] = useState('');
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestRestaurantOutput[] | null>(null);
  const [bestDate, setBestDate] = useState<Date | null>(null);
  const [bestTime, setBestTime] = useState<string | null>(null);
  const [excludedRestaurants, setExcludedRestaurants] = useState<string[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<SuggestRestaurantInput | null>(null);
  const [isSearchingAgain, setIsSearchingAgain] = useState(false);
  const { toast } = useToast();
  useRealtimeRoom(roomId);

  useEffect(() => {
    let id = searchParams.get('room');
    if (!id) {
      id = crypto.randomUUID();
      router.replace(`?room=${id}`);
    }
    setRoomId(id);
  }, [router, searchParams]);

  const handleFindDates = (data: AvailabilityData) => {
    setAvailability(data);
    setSuggestions(null);
    setBestDate(null);
    setExcludedRestaurants([]);
    setSearchCriteria(null);
  };

  const handleBestDateCalculated = (date: Date | null, time: string | null) => {
    setBestDate(date);
    setBestTime(time);
  };

  const handleSuggestionGenerated = (data: SuggestRestaurantOutput[], input: SuggestRestaurantInput) => {
    setSuggestions(data);
    setSearchCriteria(input);
    setExcludedRestaurants(prev => [...prev, ...data.map(s => s.restaurantName)]);
  };

  const handleSearchAgain = async () => {
    if (!searchCriteria) return;

    setIsSearchingAgain(true);
    const result = await getRestaurantSuggestion({
      ...searchCriteria,
      excludedRestaurants,
    });
    setIsSearchingAgain(false);

    if ('error' in result) {
      toast({
        variant: "destructive",
        title: "Couldn't find more restaurants.",
        description: result.error,
      });
    } else {
      setSuggestions(result);
      setExcludedRestaurants(prev => [...prev, ...result.map(s => s.restaurantName)]);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share it with your friends.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy link.",
      });
    }
  };

  const handleReset = async () => {
    setAvailability(null);
    setSuggestions(null);
    setBestDate(null);
    setExcludedRestaurants([]);
    setSearchCriteria(null);
    try {
      if (roomId) {
        await fetch(`/api/rooms/${roomId}/participants`, { method: 'DELETE' });
      }
      router.refresh();
    } catch (e) {
      console.error('Failed to clear saved data', e);
    }
  }

  const handleGoBack = () => {
    setAvailability(null);
    setSuggestions(null);
    setBestDate(null);
    setExcludedRestaurants([]);
    setSearchCriteria(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <a href="/" className="flex items-center gap-4">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-semibold text-foreground">
            GatherEase
          </h1>
        </a>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            Share Your Room
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {!availability && (
            <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
              {roomId && <DatePollingForm onSubmit={handleFindDates} roomId={roomId} />}
            </div>
          )}

          {availability && (
            <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
              <AvailabilityMatrix
                data={availability}
                onBestDateCalculated={handleBestDateCalculated}
                onReset={handleReset}
                onGoBack={handleGoBack}
              />
            </div>
          )}
          
          {bestDate && !suggestions && (
            <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
              <RestaurantSuggestionForm onSuggestion={handleSuggestionGenerated} />
            </div>
          )}
          
          {suggestions && (
            <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 space-y-8">
              <div className="text-center">
                 <h2 className="font-headline text-3xl font-bold">Your Suggested Spots!</h2>
                 <p className="text-muted-foreground">Here are a few great options for your group, sorted by popularity.</p>
              </div>
              <div className="space-y-4">
                {suggestions.map((s, index) => (
                  <RestaurantResultCard
                    key={s.restaurantName}
                    data={s}
                    rank={index + 1}
                    roomId={roomId}
                    bestDate={bestDate}
                    bestTime={bestTime}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-4">
                 <Button variant="outline" onClick={handleSearchAgain} disabled={isSearchingAgain}>
                  {isSearchingAgain ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Find New Suggestions
                </Button>
                <Button variant="outline" onClick={handleCopyLink}>
                  Share Link
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="mt-auto py-4 text-center text-sm text-muted-foreground">
        <p>Making plans with friends, simplified.</p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

