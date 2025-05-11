import { NextResponse } from "next/server"; // Adjusted import for Next.js 13
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RequestBody {
  text: string;
  voiceId?: string;
  prosodySettings?: {
    pitch: number;
    rate: number;
    emphasisLevel: number;
  };
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: RequestBody = await request.json();
    const { text, voiceId = "alloy", prosodySettings } = body;

    if (!text) {
      return NextResponse.json({ error: "Missing required text parameter" }, { status: 400 });
    }

    // Process text for sarcastic effect (no SSML tags)
    const processedText = processTextForSarcasm(text, prosodySettings);
    
    // Log the processed text for debugging
    console.log("Processed text:", processedText);
    
    // Generate a unique ID for the temp file
    const tempId = uuidv4();
    const tempDir = path.join(process.cwd(), "tmp");
    const tempFilePath = path.join(tempDir, `temp-audio-${tempId}.wav`);

    // Ensure the temp directory exists
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
    
    // Call the OpenAI TTS API with plain text
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1", // Using tts-1 as gpt-4o-mini-tts is not currently available in the standard API
      voice: voiceId as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      response_format: "wav",
      input: processedText, // Now using processed plain text without SSML tags
    });
    
    // Get the audio data as a buffer
    const arrayBuffer = await mp3Response.arrayBuffer();
    
    // Write the buffer to the temp file
    await fs.writeFile(tempFilePath, new Uint8Array(arrayBuffer));

    // Return the file path
    return NextResponse.json({
      success: true,
      filePath: `/tmp/temp-audio-${tempId}.wav`,
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return NextResponse.json({
      error: "Failed to generate audio",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

function processTextForSarcasm(text: string, settings?: { pitch: number; rate: number; emphasisLevel: number }) {
  // We're not using the settings directly anymore since we're not using SSML tags
  // But keeping the function signature for compatibility
  
  // Process text to make it more sarcastic
  // Adding common sarcastic text indicators can help the TTS system sound more sarcastic
  let processedText = text;
  
  // Escape special XML characters (still useful even for plain text)
  processedText = processedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  return processedText;
}
