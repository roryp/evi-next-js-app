import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { SarcasmCreatorParameters } from "@/components/sarcasm-creator/SarcasmCreatorConfig";

// Define the structure for the request body
interface RequestBody {
  text: string;
  parameters: SarcasmCreatorParameters;
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: RequestBody = await request.json();
    const { text, parameters } = body;

    if (!text || !parameters) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Extract parameters to use in the prompt
    const { styleWeights, toneSettings } = parameters;
    
    // Create a filtered list of enabled styles
    const enabledStyles = Object.entries(styleWeights)
      .filter(([_, style]) => style.enabled)
      .map(([id, style]) => ({
        name: style.name,
        weight: style.weight,
        description: style.description
      }));

    // Create a system prompt for the AI
    const systemPrompt = `You are an expert in sarcasm, known for your witty and sarcastic responses. 
You transform regular text into sarcastic versions based on specific style and tone parameters.
Always respond ONLY with the sarcastic version - no explanations, no extra comments, just the transformed text.`;

    // Create a user prompt with the parameters
    const userPrompt = `Transform the following text into a sarcastic response.

Apply these sarcasm styles (ordered by importance weight):
${enabledStyles.sort((a, b) => b.weight - a.weight)
  .map(style => `- ${style.name} (${(style.weight * 100).toFixed(0)}%): ${style.description}`)
  .join('\n')}

Apply these tone settings:
- Intensity: ${(toneSettings.intensity * 100).toFixed(0)}% (higher = stronger sarcasm)
- Humor: ${(toneSettings.humor * 100).toFixed(0)}% (higher = funnier)
- Harshness: ${(toneSettings.harshness * 100).toFixed(0)}% (higher = more cutting)
- Subtlety: ${(toneSettings.subtlety * 100).toFixed(0)}% (higher = more subtle)

Original text to transform: "${text}"

Remember: Respond with ONLY the sarcastic version, nothing else.`;

    // Call the OpenAI API using GPT-4.5-Preview
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Using the latest GPT-4 preview model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7 + (toneSettings.intensity * 0.3), // Adjust temperature based on intensity
      max_tokens: 500,
    });

    // Extract the response
    const sarcasticResponse = completion.choices[0].message.content?.trim() || 
      "Oh look, I'm supposed to be sarcastic but something went wrong. How utterly predictable.";
    
    return NextResponse.json({ response: sarcasticResponse });
    
  } catch (error) {
    console.error('Error generating sarcastic response:', error);
    
    // Fallback responses if the API call fails
    const fallbackResponses = [
      "Oh fantastic, the API failed. I'm shocked. SHOCKED I tell you.",
      "Well, well, well... look who couldn't connect to the fancy AI. Color me surprised.",
      "Ah yes, the classic 'API error'. How original and unexpected.",
      "Oh joy! The servers are taking a break. Because that's EXACTLY what we needed right now."
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return NextResponse.json({ 
      response: fallbackResponse,
      error: "Failed to connect to GPT-4.5" 
    }, { status: 500 });
  }
}