import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }
    
    // Extract the base64 data from the data URL
    const base64Data = image.split(',')[1];
    
    // Use OpenAI's vision capabilities to analyze the facial expression
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using gpt-4o as it has vision capabilities
      messages: [
        { 
          role: 'system', 
          content: 'You are a facial expression analysis expert specializing in detecting sarcasm. Analyze the provided image and determine if the person appears to be expressing sarcasm. Look for facial cues like smirking, raised eyebrows, eye rolls, or other indicators of sarcastic expression. Provide a thorough analysis and a clear verdict.' 
        },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Analyze this facial expression for signs of sarcasm:' },
            { 
              type: 'image_url', 
              image_url: {
                url: `data:image/png;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });
    
    const analysis = response.choices[0]?.message?.content?.trim() || 'No analysis available';
    return NextResponse.json({ result: analysis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error analyzing facial expression for sarcasm.' }, { status: 500 });
  }
}