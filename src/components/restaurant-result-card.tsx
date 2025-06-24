"use client";

import type { SuggestRestaurantOutput } from "@/ai/flows/suggest-restaurant";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "./ui/button";
import Image from "next/image";
import { MapPin, Star, Utensils, ExternalLink } from "lucide-react";

type RestaurantResultCardProps = {
  data: SuggestRestaurantOutput;
};

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-current" />
      ))}
      {halfStar && <Star key="half" className="h-5 w-5" style={{clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)', fill: 'currentColor'}} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      ))}
       <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};


export function RestaurantResultCard({ data }: RestaurantResultCardProps) {
  return (
    <Card className="w-full max-w-4xl overflow-hidden shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Suggested Spot!</CardTitle>
        <CardDescription>
          Here's a great option that should work for your group.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="relative aspect-video w-full">
           <Image
            src="https://placehold.co/600x400"
            alt={`A photo of ${data.restaurantName}`}
            fill
            className="rounded-lg object-cover"
            data-ai-hint="restaurant interior"
          />
        </div>
        <div className="flex flex-col space-y-4">
          <h3 className="font-headline text-2xl font-bold">{data.restaurantName}</h3>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Utensils className="h-5 w-5 text-accent"/>
            <span className="text-lg">{data.cuisine}</span>
          </div>

          <div className="flex items-center">
            <StarRating rating={data.rating} />
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
            <span>{data.address}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end bg-muted/50 p-4">
        <Button asChild variant="default" className="bg-primary text-primary-foreground">
          <a href={data.googleMapsUrl} target="_blank" rel="noopener noreferrer">
            View on Google Maps <ExternalLink className="ml-2 h-4 w-4"/>
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
