'use server';

/**
 * @fileOverview An AI agent that suggests restaurants based on dietary restrictions and location.
 *
 * - suggestRestaurant - A function that suggests a restaurant.
 * - SuggestRestaurantInput - The input type for the suggestRestaurant function.
 * - SuggestRestaurantOutput - The return type for the suggestRestaurant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRestaurantInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('Dietary restrictions for the group (e.g., vegetarian, vegan, gluten-free).'),
  location: z.string().describe('The location of the group (e.g., city, address).'),
});
export type SuggestRestaurantInput = z.infer<typeof SuggestRestaurantInputSchema>;

const SuggestRestaurantOutputSchema = z.object({
  restaurantName: z.string().describe('The name of the suggested restaurant.'),
  cuisine: z.string().describe('The type of cuisine offered by the restaurant.'),
  address: z.string().describe('The address of the restaurant.'),
  rating: z.number().describe('The rating of the restaurant (e.g., 4.5 out of 5).'),
  googleMapsUrl: z.string().describe('The Google Maps URL of the restaurant.'),
});
export type SuggestRestaurantOutput = z.infer<typeof SuggestRestaurantOutputSchema>;

export async function suggestRestaurant(input: SuggestRestaurantInput): Promise<SuggestRestaurantOutput> {
  return suggestRestaurantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRestaurantPrompt',
  input: {schema: SuggestRestaurantInputSchema},
  output: {schema: SuggestRestaurantOutputSchema},
  prompt: `Suggest a restaurant based on the following dietary restrictions and location:

Dietary Restrictions: {{{dietaryRestrictions}}}
Location: {{{location}}}

Restaurant Suggestion:`,
});

const suggestRestaurantFlow = ai.defineFlow(
  {
    name: 'suggestRestaurantFlow',
    inputSchema: SuggestRestaurantInputSchema,
    outputSchema: SuggestRestaurantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
