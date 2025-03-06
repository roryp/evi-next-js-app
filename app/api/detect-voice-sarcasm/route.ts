import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { audio } = await request.json();
    
    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }
    
    // Create a temporary file for the audio
    const tempDir = path.join(process.cwd(), 'tmp');
    
    // Check if the directory exists, if not create it
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `temp-audio-${uuidv4()}.wav`);
    const audioBuffer = Buffer.from(audio, 'base64');
    
    try {
      // Write the audio data to a file
      await writeFile(tempFilePath, audioBuffer);
      
      // Transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
      });
      
      const transcribedText = transcription.text;
      
      // Now analyze the transcribed text for sarcasm
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: 'system', 
            content: `You are a voice analysis expert specializing in detecting sarcasm. 
                     Analyze the transcribed text for sarcastic content, tone indicators, and context clues.
                     Consider that vocal tone, emphasis, and pacing are key indicators of sarcasm that might not be 
                     fully captured in the transcription. Provide a thorough analysis and a clear verdict.` 
          },
          { 
            role: 'user', 
            content: `Analyze this transcribed speech for signs of sarcasm: "${transcribedText}"` 
          }
        ]
      });
      
      const analysis = response.choices[0]?.message?.content?.trim() || 'No analysis available';
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return NextResponse.json({ 
        result: `<p><strong>Transcription:</strong> ${transcribedText}</p><p><strong>Analysis:</strong> ${analysis}</p>`
      });
    } finally {
      // Make sure we clean up the temporary file even if there's an error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error analyzing voice for sarcasm.' }, { status: 500 });
  }
}