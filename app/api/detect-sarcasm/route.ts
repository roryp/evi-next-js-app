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
      model: "gpt-4o",  // Using gpt-4o
      messages: [
        { 
          role: 'system', 
          content: `You are a sarcasm and sentiment analysis assistant. Analyze the text and determine:
          1. If it contains sarcasm 
          2. The sentiment flow throughout the text
          
          Break down the text into segments (natural phrases or sentences) and analyze the sentiment of each segment.
          Return your analysis as a JSON object with this structure:
          {
            "analysis": "Your overall analysis text explaining the sarcasm detection",
            "isSarcastic": true or false,
            "sentimentFlow": [
              {
                "text": "segment of original text",
                "sentiment": "positive", "negative", "neutral", or "sarcastic",
                "intensity": number from 0 to 1 representing intensity
              }
            ]
          }`
        },
        { 
          role: 'user', 
          content: `Analyze this text for sarcasm and sentiment flow: "${text}"` 
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const analysisText = response.choices[0]?.message?.content?.trim() || '{"analysis": "No analysis available", "sentimentFlow": []}';
    let analysisData;
    
    try {
      analysisData = JSON.parse(analysisText);
    } catch (err) {
      console.error('Error parsing OpenAI response as JSON:', err);
      analysisData = {
        analysis: analysisText,
        isSarcastic: false,
        sentimentFlow: []
      };
    }
    
    return NextResponse.json({ result: analysisData.analysis, sentimentFlow: analysisData.sentimentFlow, isSarcastic: analysisData.isSarcastic });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error analyzing text for sarcasm.' }, { status: 500 });
  }
}