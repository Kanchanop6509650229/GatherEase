'use server';

import {
  suggestRestaurant,
  type SuggestRestaurantInput,
  type SuggestRestaurantOutput,
} from '@/ai/flows/suggest-restaurant';

export async function getRestaurantSuggestion(
  input: SuggestRestaurantInput
): Promise<SuggestRestaurantOutput[] | { error: string }> {
  try {
    if (!input.location || input.location.trim().length < 3) {
      return { error: 'Please enter a valid location.' };
    }
    const result = await suggestRestaurant({
      ...input,
      dietaryRestrictions: input.dietaryRestrictions || 'None',
    });
    if (!result || result.length === 0) {
      return { error: 'Could not find any restaurant suggestions. Please try a different location.' };
    }
    
    // Overwrite the googleMapsUrl with a reliable search link
    const suggestionsWithCorrectedUrls = result.map(restaurant => ({
      ...restaurant,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.restaurantName}, ${restaurant.address}`)}`
    }));

    return suggestionsWithCorrectedUrls;
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred while fetching suggestions. Please try again.' };
  }
}
