"use client";

import { useState } from 'react';
import type { AvailabilityData } from '@/lib/types';
import type { SuggestRestaurantOutput } from '@/ai/flows/suggest-restaurant';
import { DatePollingForm } from '@/components/date-polling-form';
import { AvailabilityMatrix } from '@/components/availability-matrix';
import { RestaurantSuggestionForm } from '@/components/restaurant-suggestion-form';
import { RestaurantResultCard } from '@/components/restaurant-result-card';
import { Icons } from '@/components/icons';

const LOCAL_STORAGE_KEY = 'gather-ease-participants';

export default function Home() {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestRestaurantOutput[] | null>(null);
  const [bestDate, setBestDate] = useState<Date | null>(null);

  const handleFindDates = (data: AvailabilityData) => {
    setAvailability(data);
    setSuggestions(null);
    setBestDate(null);
  };

  const handleBestDateCalculated = (date: Date | null) => {
    setBestDate(date);
  };

  const handleSuggestionGenerated = (data: SuggestRestaurantOutput[]) => {
    setSuggestions(data);
  };

  const handleReset = () => {
    setAvailability(null);
    setSuggestions(null);
    setBestDate(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Force a re-render of the form or a page reload to clear the state
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear saved data", e);
    }
  }

  const handleGoBack = () => {
    setAvailability(null);
    setSuggestions(null);
    setBestDate(null);
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
      </header>
      <main className="flex flex-1 flex-col items-center gap-8 p-4 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {!availability && (
            <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
              <DatePollingForm onSubmit={handleFindDates} />
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
                  <RestaurantResultCard key={index} data={s} rank={index + 1} />
                ))}
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
