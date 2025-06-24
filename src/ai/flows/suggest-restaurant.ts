'use server';

/**
 * @fileOverview An AI agent that suggests restaurants based on dietary restrictions and location.
 *
 * - suggestRestaurant - A function that suggests a list of restaurants.
 * - SuggestRestaurantInput - The input type for the suggestRestaurant function.
 * - SuggestRestaurantOutput - The type for a single restaurant suggestion in the list.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRestaurantInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('Dietary restrictions for the group (e.g., vegetarian, vegan, gluten-free).'),
  location: z.string().describe('The location of the group (e.g., city, address).'),
  excludedRestaurants: z.array(z.string()).optional().describe('A list of restaurant names to exclude from the suggestions.'),
});
export type SuggestRestaurantInput = z.infer<typeof SuggestRestaurantInputSchema>;

const SuggestRestaurantOutputSchema = z.object({
  restaurantName: z.string().describe('The name of the suggested restaurant.'),
  cuisine: z.string().describe('The type of cuisine offered by the restaurant.'),
  address: z.string().describe('The address of the restaurant.'),
  rating: z.number().describe('The rating of the restaurant (e.g., 4.5 out of 5).'),
  reviewCount: z.number().describe('The number of reviews the restaurant has.'),
  googleMapsUrl: z.string().describe('The Google Maps URL of the restaurant.'),
});
export type SuggestRestaurantOutput = z.infer<typeof SuggestRestaurantOutputSchema>;

const SuggestRestaurantListSchema = z.object({
  suggestions: z.array(SuggestRestaurantOutputSchema).describe("A list of 3-5 restaurant suggestions."),
});


export async function suggestRestaurant(input: SuggestRestaurantInput): Promise<SuggestRestaurantOutput[]> {
  const result = await suggestRestaurantFlow(input);
  return result.suggestions;
}

const prompt = ai.definePrompt({
  name: 'suggestRestaurantPrompt',
  input: {schema: SuggestRestaurantInputSchema},
  output: {schema: SuggestRestaurantListSchema},
  prompt: `Suggest a list of 3 to 5 restaurants based on the following dietary restrictions and location.
Please return a diverse list of options.
For each restaurant, provide all the requested information.
Ensure that all suggested restaurants are currently in operation and not permanently closed.
Rank the restaurants from best to worst, considering a combination of both a high star rating and a substantial number of reviews as the primary sorting criteria. A restaurant with a 4.6 rating and 2,500 reviews should be ranked higher than one with a 4.9 rating but only 50 reviews.

{{#if excludedRestaurants}}
Do not include any of the following restaurants in your suggestions, as they have already been rejected:
{{#each excludedRestaurants}}
- {{{this}}}
{{/each}}
{{/if}}

Dietary Restrictions: {{{dietaryRestrictions}}}
Location: {{{location}}}

Restaurant Suggestions:`,
});

const suggestRestaurantFlow = ai.defineFlow(
  {
    name: 'suggestRestaurantFlow',
    inputSchema: SuggestRestaurantInputSchema,
    outputSchema: SuggestRestaurantListSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output?.suggestions?.length) {
      throw new Error('Failed to get restaurant suggestion details.');
    }
    return output;
  }
);
