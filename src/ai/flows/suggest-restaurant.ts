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
  photoDataUri: z
    .string()
    .describe(
      "A photo of the restaurant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
});
export type SuggestRestaurantOutput = z.infer<typeof SuggestRestaurantOutputSchema>;

export async function suggestRestaurant(input: SuggestRestaurantInput): Promise<SuggestRestaurantOutput> {
  return suggestRestaurantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRestaurantPrompt',
  input: {schema: SuggestRestaurantInputSchema},
  output: {schema: SuggestRestaurantOutputSchema.omit({photoDataUri: true})},
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
    const {output: textOutput} = await prompt(input);
    if (!textOutput) {
      throw new Error('Failed to get restaurant suggestion details.');
    }

    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `A beautiful, photorealistic image of the exterior of a restaurant named "${textOutput.restaurantName}". The restaurant specializes in ${textOutput.cuisine} cuisine. The photo should look like it was taken for a food magazine.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      return {
        ...textOutput,
        photoDataUri: media?.url,
      };
    } catch (e) {
      console.error('Image generation failed, returning text-only suggestion.', e);
      return textOutput;
    }
  }
);
