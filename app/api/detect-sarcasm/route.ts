import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using gpt-4o as a current alternative to gpt-4.5-preview
      messages: [
        { 
          role: 'system', 
          content: 'You are a sarcasm detection assistant. Analyze the text and determine if it contains sarcasm. Explain your reasoning and provide a clear verdict.' 
        },
        { 
          role: 'user', 
          content: `Analyze this text for sarcasm: "${text}"` 
        }
      ]
    });
    
    const analysis = response.choices[0]?.message?.content?.trim() || 'No analysis available';
    return NextResponse.json({ result: analysis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error analyzing text for sarcasm.' }, { status: 500 });
  }
}