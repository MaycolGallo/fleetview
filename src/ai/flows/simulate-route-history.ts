'use server';

/**
 * @fileOverview Simulates a realistic vehicle route history using GenAI.
 *
 * - simulateRouteHistory - A function that simulates vehicle route history.
 * - SimulateRouteHistoryInput - The input type for the simulateRouteHistory function.
 * - SimulateRouteHistoryOutput - The return type for the simulateRouteHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateRouteHistoryInputSchema = z.object({
  vehicleId: z.string().describe('The ID of the vehicle to simulate the route for.'),
  startLat: z.number().describe('The starting latitude for the route.'),
  startLng: z.number().describe('The starting longitude for the route.'),
});
export type SimulateRouteHistoryInput = z.infer<typeof SimulateRouteHistoryInputSchema>;

const RoutePointSchema = z.object({
    lat: z.number().describe('The latitude of the point.'),
    lng: z.number().describe('The longitude of the point.'),
});

const SimulateRouteHistoryOutputSchema = z.array(RoutePointSchema);

export type SimulateRouteHistoryOutput = z.infer<typeof SimulateRouteHistoryOutputSchema>;

export async function simulateRouteHistory(
  input: SimulateRouteHistoryInput
): Promise<SimulateRouteHistoryOutput> {
  return simulateRouteHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateRouteHistoryPrompt',
  input: {schema: SimulateRouteHistoryInputSchema},
  output: {schema: SimulateRouteHistoryOutputSchema},
  prompt: `You are a route history simulator. Generate a realistic, recent travel route for the given vehicle within Lima, Peru.

The route must consist of 10 to 15 sequential geographic points (latitude and longitude). The route must start at the provided starting coordinates and strictly follow the actual street network. Do not create straight lines between points; the path must trace real roads. The final point should be different from the starting point but still within the Lima metropolitan area.

Start Latitude: {{{startLat}}}
Start Longitude: {{{startLng}}}
Vehicle ID: {{{vehicleId}}}

Output format: array of JSON objects with "lat" and "lng" keys. Do not include any text outside of the JSON array.
`,
});

const simulateRouteHistoryFlow = ai.defineFlow(
  {
    name: 'simulateRouteHistoryFlow',
    inputSchema: SimulateRouteHistoryInputSchema,
    outputSchema: SimulateRouteHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
