'use server';

/**
 * @fileOverview Simulates realistic vehicle telemetry data using GenAI.
 *
 * - simulateVehicleTelemetry - A function that simulates vehicle telemetry data.
 * - SimulateVehicleTelemetryInput - The input type for the simulateVehicleTelemetry function.
 * - SimulateVehicleTelemetryOutput - The return type for the simulateVehicleTelemetry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateVehicleTelemetryInputSchema = z.object({
  numberOfVehicles: z
    .number()
    .describe('The number of vehicles to simulate.'),
});
export type SimulateVehicleTelemetryInput =
  z.infer<typeof SimulateVehicleTelemetryInputSchema>;

const VehicleTelemetrySchema = z.object({
  vehicleId: z.string().describe('Unique identifier for the vehicle.'),
  latitude: z.number().describe('The latitude of the vehicle.'),
  longitude: z.number().describe('The longitude of the vehicle.'),
  status: z
    .enum(['active', 'idle', 'out-of-service'])
    .describe('The current status of the vehicle.'),
});

const SimulateVehicleTelemetryOutputSchema = z.array(
  VehicleTelemetrySchema
);
export type SimulateVehicleTelemetryOutput =
  z.infer<typeof SimulateVehicleTelemetryOutputSchema>;

export async function simulateVehicleTelemetry(
  input: SimulateVehicleTelemetryInput
): Promise<SimulateVehicleTelemetryOutput> {
  return simulateVehicleTelemetryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateVehicleTelemetryPrompt',
  input: {schema: SimulateVehicleTelemetryInputSchema},
  output: {schema: SimulateVehicleTelemetryOutputSchema},
  prompt: `You are a vehicle telemetry simulator. Generate realistic telemetry data for the specified number of vehicles. The data should include vehicle ID, latitude, longitude, and status (active, idle, or out-of-service). Each vehicle's data must be self-consistent.

Number of vehicles: {{{numberOfVehicles}}}

Output format: array of JSON objects. Do not include any text outside of the JSON array.
`,
});

const simulateVehicleTelemetryFlow = ai.defineFlow(
  {
    name: 'simulateVehicleTelemetryFlow',
    inputSchema: SimulateVehicleTelemetryInputSchema,
    outputSchema: SimulateVehicleTelemetryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
