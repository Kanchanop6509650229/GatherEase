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
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const result = await getRestaurantSuggestion(values);
    setIsLoading(false);

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: result.error,
      });
    } else {
      onSuggestion(result, values);
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
