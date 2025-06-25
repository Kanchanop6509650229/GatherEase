"use client";

import type { SuggestRestaurantOutput } from "@/ai/flows/suggest-restaurant";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { MapPin, Star, Utensils, ExternalLink, Users } from "lucide-react";

type RestaurantResultCardProps = {
  data: SuggestRestaurantOutput;
  rank: number;
};

const StarRating = ({ rating, reviewCount }: { rating: number, reviewCount: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex items-center gap-1 text-amber-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-5 w-5 fill-current" />
        ))}
        {halfStar && <Star key="half" className="h-5 w-5" style={{clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', fill: 'currentColor'}} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">({reviewCount.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
};


export function RestaurantResultCard({ data, rank }: RestaurantResultCardProps) {
  return (
    <Card className="w-full max-w-4xl overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <div className="flex flex-col sm:flex-row">
        <div className="flex h-full flex-col items-center justify-center bg-muted/50 p-4 sm:w-20">
          <span className="font-headline text-3xl font-bold text-primary">#{rank}</span>
        </div>
        <div className="flex-1">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-headline text-2xl font-bold">{data.restaurantName}</h3>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Utensils className="h-5 w-5 text-accent"/>
              <span className="text-lg">{data.cuisine}</span>
            </div>

            <div className="flex items-center">
              <StarRating rating={data.rating} reviewCount={data.reviewCount}/>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
              <span>{data.address}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/50 p-4">
            <Button asChild variant="default" className="bg-primary text-primary-foreground">
              <a href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                View on Google Maps <ExternalLink className="ml-2 h-4 w-4"/>
              </a>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
