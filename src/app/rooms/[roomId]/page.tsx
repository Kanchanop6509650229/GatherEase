"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { AvailabilityData } from '@/lib/types';
import type { SuggestRestaurantInput, SuggestRestaurantOutput } from '@/ai/flows/suggest-restaurant';
import { DatePollingForm } from '@/components/date-polling-form';
import { AvailabilityMatrix } from '@/components/availability-matrix';
import { RestaurantSuggestionForm } from '@/components/restaurant-suggestion-form';
import { RestaurantResultCard } from '@/components/restaurant-result-card';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCcw } from 'lucide-react';
import { getRestaurantSuggestion } from '../../actions';
import { useToast } from '@/hooks/use-toast';


function HomeContent() {
  const router = useRouter();
  const params = useParams<{ roomId?: string }>();

  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestRestaurantOutput[] | null>(null);
  const [bestDate, setBestDate] = useState<Date | null>(null);
  const [excludedRestaurants, setExcludedRestaurants] = useState<string[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<SuggestRestaurantInput | null>(null);
  const [isSearchingAgain, setIsSearchingAgain] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let id = params.roomId as string | undefined;
    if (!id) {
      id = crypto.randomUUID();
      router.replace(`/rooms/${id}`);
    }
    setRoomId(id);
  }, [router, params.roomId]);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const data = await res.json();
        if (data.name) setRoomName(data.name);
      } catch (e) {
        console.error('Failed to load room name', e);
      }
    };
    load();
  }, [roomId]);

  const handleFindDates = (data: AvailabilityData) => {
    setAvailability(data);
    setSuggestions(null);
    setBestDate(null);
    setExcludedRestaurants([]);
    setSearchCriteria(null);
  };

  const handleBestDateCalculated = (date: Date | null) => {
    setBestDate(date);
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
        await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
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
        <Input
          className="ml-auto max-w-xs"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          onBlur={e => {
            if (!roomId) return;
            fetch(`/api/rooms/${roomId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: e.target.value }),
            }).catch(err => console.error('Failed to rename room', err));
          }}
          placeholder="Room name"
        />
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
                  <RestaurantResultCard key={s.restaurantName} data={s} rank={index + 1} />
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

