"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRestaurantSuggestion } from "@/app/actions";
import type { SuggestRestaurantInput, SuggestRestaurantOutput } from "@/ai/flows/suggest-restaurant";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  location: z.string().min(3, "Please enter a valid city or address."),
  dietaryRestrictions: z.string().optional(),
  cuisine: z.string().optional(),
  priceRange: z.enum(['$', '$$', '$$$']).optional(),
  distanceKm: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(1).max(30).optional()),
});

type RestaurantSuggestionFormProps = {
  onSuggestion: (data: SuggestRestaurantOutput[], input: SuggestRestaurantInput) => void;
};

export function RestaurantSuggestionForm({ onSuggestion }: RestaurantSuggestionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      dietaryRestrictions: "",
      cuisine: "",
      priceRange: undefined,
      distanceKm: undefined,
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const input: SuggestRestaurantInput = {
      ...values,
      dietaryRestrictions: values.dietaryRestrictions || '',
      cuisine: values.cuisine
        ? values.cuisine.split(',').map(c => c.trim()).filter(Boolean)
        : undefined,
    };
    const result = await getRestaurantSuggestion(input);
    setIsLoading(false);

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: result.error,
      });
    } else {
      onSuggestion(result, input);
    }
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">3. Find a Place to Eat</CardTitle>
        <CardDescription>
          Now that you have a date, let AI help you find the perfect restaurant.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormDescription>
                    Where does your group want to eat?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="dietaryRestrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dietary Needs</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., vegetarian, gluten-free"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Any allergies or preferences? (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisine</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Italian, Sushi" {...field} />
                </FormControl>
                <FormDescription>Comma separated list (optional).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Range</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...field}
                  >
                    <option value="">Any</option>
                    <option value="$">$</option>
                    <option value="$$">$$</option>
                    <option value="$$$">$$$</option>
                  </select>
                </FormControl>
                <FormDescription>Optional budget preference.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="distanceKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Radius (km)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="30" placeholder="5" {...field} />
                </FormControl>
                <FormDescription>Search distance from the location.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Suggest Restaurants
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
