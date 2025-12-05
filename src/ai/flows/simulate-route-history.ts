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

const RouteEventSchema = z.object({
  timestamp: z.string().describe('The ISO 8601 timestamp for the event.'),
  status: z.enum(['start', 'stop', 'driving', 'end']).describe('The event type.'),
  distanceKm: z.number().describe('The distance covered in this leg of the trip in kilometers.'),
  durationMinutes: z.number().describe('The duration of this event in minutes.'),
  description: z.string().describe('A brief description of the event.'),
});

const SimulateRouteHistoryOutputSchema = z.object({
  routePoints: z.array(RoutePointSchema).describe("An array of geographic points representing the vehicle's path."),
  routeEvents: z.array(RouteEventSchema).describe("An array of events that occurred along the route."),
});

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
  prompt: `You are a highly realistic vehicle route and event simulator. Your main task is to generate a complete and plausible trip history for a vehicle within Lima, Peru.

This history MUST include two key parts:
1.  'routePoints': A geographical path consisting of 10 to 15 sequential latitude and longitude points. This path MUST strictly follow the actual street network of Lima, Peru. Do not create straight lines; the path must trace real roads as if a car were driving. The route MUST start at the provided coordinates.
2.  'routeEvents': A timeline of events for the trip. This timeline should tell a story. It MUST start with a 'start' event and end with an 'end' event. It can include intermediate 'driving' and 'stop' events. For each event, provide a realistic timestamp (as an ISO 8601 string, starting from a recent past time), duration, distance covered for that leg, and a brief description. The total distance and time should be consistent across the events.

Start Latitude: {{{startLat}}}
Start Longitude: {{{startLng}}}
Vehicle ID: {{{vehicleId}}}

Example of a good event sequence:
- Event 1: status 'start', duration 0, distance 0, description 'Trip started'.
- Event 2: status 'driving', duration 15 mins, distance 5.2 km, description 'Driving towards Miraflores'.
- Event 3: status 'stop', duration 10 mins, distance 0, description 'Stopped for coffee'.
- Event 4: status 'driving', duration 20 mins, distance 8.1 km, description 'Driving to destination'.
- Event 5: status 'end', duration 0, distance 0, description 'Trip ended'.

Output ONLY the JSON object with 'routePoints' and 'routeEvents' keys.
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
