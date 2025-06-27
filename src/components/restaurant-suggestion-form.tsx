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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Sparkles,
  MapPin,
  Utensils,
  Vegan,
  Wallet,
  CircleDot,
} from "lucide-react";

const formSchema = z.object({
  location: z.string().min(3, "Please enter a valid city or address."),
  dietaryRestrictions: z.string().optional(),
  priceRange: z
    .preprocess(
      val => (val === '' ? undefined : val),
      z.enum(['$', '$$', '$$$']).optional()
    ),
  radius: z.string().optional(),
  cuisineTypes: z.string().optional(),
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
      priceRange: undefined,
      radius: "",
      cuisineTypes: "",
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const parsed = {
      ...values,
      radius: values.radius ? parseInt(values.radius) : undefined,
    };
    const result = await getRestaurantSuggestion(parsed);
    setIsLoading(false);

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: result.error,
      });
    } else {
      onSuggestion(result, parsed);
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
                    <fieldset disabled={isLoading}>
            <CardContent className="space-y-8 p-6 sm:p-8">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-semibold">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the only required field. Where are you eating?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cuisineTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-muted-foreground" />
                      Cuisine Preferences
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Italian, Sushi" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dietaryRestrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Vegan className="h-5 w-5 text-muted-foreground" />
                      Dietary Needs
                    </FormLabel>
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
                name="priceRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                      Price Range
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-4 gap-2 pt-2"
                      >
                        {['Any', '$', '$$', '$$$'].map(val => {
                          const id = `price-${val}`;
                          const value = val === 'Any' ? '' : val;
                          return (
                            <FormItem key={id}>
                              <FormControl>
                                <RadioGroupItem value={value} id={id} className="sr-only" />
                              </FormControl>
                              <FormLabel
                                htmlFor={id}
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                  field.value === value && "border-primary"
                                )}
                              >
                                {val}
                              </FormLabel>
                            </FormItem>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="radius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CircleDot className="h-5 w-5 text-muted-foreground" />
                      Distance (km)
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormDescription>Optional search radius</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
                      </CardContent>
          </fieldset>
          <CardFooter className="flex justify-end p-4 sm:p-6">
            <Button type="submit" size="lg" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
