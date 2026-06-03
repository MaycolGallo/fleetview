
'use server';

/**
 * @fileOverview AI Fleet Insight Generator.
 *
 * - generateFleetSummary - Generates a natural language summary of fleet operations.
 * - FleetSummaryInput - Input type containing vehicles and recent incidents.
 * - FleetSummaryOutput - A structured analysis and recommended actions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FleetSummaryInputSchema = z.object({
  vehicles: z.array(z.object({
    placa: z.string(),
    status: z.string(),
    speed: z.string(),
    battery: z.string(),
  })),
  incidents: z.array(z.object({
    description: z.string(),
    placa: z.string(),
    type: z.string(),
  })),
});

export type FleetSummaryInput = z.infer<typeof FleetSummaryInputSchema>;

const FleetSummaryOutputSchema = z.object({
  summary: z.string().describe('A high-level summary of the fleet current status.'),
  criticalActions: z.array(z.string()).describe('Specific actions the fleet manager should take.'),
  healthScore: z.number().min(0).max(100).describe('Operations health score from 0 to 100.'),
});

export type FleetSummaryOutput = z.infer<typeof FleetSummaryOutputSchema>;

const prompt = ai.definePrompt({
  name: 'fleetSummaryPrompt',
  input: { schema: FleetSummaryInputSchema },
  output: { schema: FleetSummaryOutputSchema },
  prompt: `
    You are a highly experienced Fleet Operations Commander. 
    Analyze the following current data from the Lima, Peru metropolitan fleet.

    FLEET STATUS:
    {{#each vehicles}}
    - Unit {{placa}}: Status: {{status}}, Speed: {{speed}} km/h, Battery: {{battery}}V
    {{/each}}

    RECENT INCIDENTS:
    {{#each incidents}}
    - ALERT: {{description}} on unit {{placa}} (Type: {{type}})
    {{/each}}

    Provide a concise operational briefing in Spanish. 
    - summary: Focus on the "big picture". Are we moving? Are there many idle units?
    - criticalActions: List 2-3 specific urgent steps based on incidents or low battery alerts.
    - healthScore: Rate the overall fleet safety and efficiency out of 100.
  `,
});

export async function generateFleetSummary(input: FleetSummaryInput): Promise<FleetSummaryOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error('Failed to generate fleet intelligence.');
  return output;
}

export const fleetSummaryFlow = ai.defineFlow(
  {
    name: 'fleetSummaryFlow',
    inputSchema: FleetSummaryInputSchema,
    outputSchema: FleetSummaryOutputSchema,
  },
  async (input) => {
    return generateFleetSummary(input);
  }
);
