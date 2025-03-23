import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { createCanvas } from 'canvas';
import { WaveFile } from 'wavefile';

// Constants for audio processing
const MAX_AUDIO_LENGTH = 30; // Maximum audio length in seconds
const SAMPLE_RATE = 44100;
const MAX_SAMPLES = MAX_AUDIO_LENGTH * SAMPLE_RATE;

// Function to downsample audio data
function downsampleAudio(audioData: number[], targetLength: number): number[] {
  const step = audioData.length / targetLength;
  const result = new Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const pos = Math.floor(i * step);
    result[i] = audioData[pos];
  }
  return result;
}

// Function to normalize audio data to [-1, 1] range
function normalizeAudioData(audioData: number[]): number[] {
  let max = 0;
  // Find max absolute value without using map/spread
  for (let i = 0; i < audioData.length; i++) {
    const absVal = Math.abs(audioData[i]);
    if (absVal > max) max = absVal;
  }
  // Normalize without using map
  const normalized = new Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalized[i] = audioData[i] / (max || 1);
  }
  return normalized;
}

// Function to generate a spectrogram from audio data
async function generateSpectrogram(audioBuffer: Buffer): Promise<string> {
  try {
    // Parse the WAV file
    const wav = new WaveFile(audioBuffer);
    
    // Perform basic validation on the WAV file
    if (!wav.fmt || !wav.data) {
      console.error("Invalid WAV file format - missing fmt or data chunks");
      throw new Error("Invalid WAV file format");
    }
    
    // Get the sample rate from fmt chunk
    const sampleRate = (wav.fmt as { sampleRate: number }).sampleRate;
    
    // Get the samples and handle different possible formats
    const samples = wav.getSamples();
    let audioData: number[];
    
    if (Array.isArray(samples)) {
      // Multiple channels - convert to mono by averaging
      if (Array.isArray(samples[0])) {
        const channels = samples as number[][];
        audioData = new Array(channels[0].length);
        for (let i = 0; i < channels[0].length; i++) {
          let sum = 0;
          for (let channel = 0; channel < channels.length; channel++) {
            sum += channels[channel][i];
          }
          audioData[i] = sum / channels.length;
        }
      } else {
        // Single channel
        audioData = samples as number[];
      }
    } else if (samples instanceof Float32Array || samples instanceof Float64Array) {
      // Direct typed array
      audioData = Array.from(samples);
    } else {
      throw new Error("Invalid audio data format");
    }

    // Normalize the audio data
    audioData = normalizeAudioData(audioData);
    
    // Limit audio length if needed
    if (audioData.length > MAX_SAMPLES) {
      console.log(`Audio length exceeds ${MAX_AUDIO_LENGTH}s, downsampling...`);
      audioData = downsampleAudio(audioData, MAX_SAMPLES);
    }
    
    // Parameters for visualization
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 200;
    const FRAME_SIZE = Math.floor(audioData.length / CANVAS_WIDTH);
    
    // Create canvas
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');
    
    // Create gradient for background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#000000');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
    ctx.lineWidth = 0.5;
    
    // Vertical time markers
    const secondsMarkers = 10;
    for (let i = 0; i <= secondsMarkers; i++) {
      const x = (i / secondsMarkers) * CANVAS_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
      
      // Add time labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px Arial';
      ctx.fillText(`${(i * (audioData.length / sampleRate) / secondsMarkers).toFixed(1)}s`, x, CANVAS_HEIGHT - 2);
    }
    
    // Horizontal amplitude markers
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    // Calculate and draw the waveform
    let lastX = 0;
    let lastY = CANVAS_HEIGHT / 2;
    
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < CANVAS_WIDTH; i++) {
      const startIdx = i * FRAME_SIZE;
      const endIdx = startIdx + FRAME_SIZE;
      const chunk = audioData.slice(startIdx, endIdx);
      
      if (chunk.length === 0) continue;
      
      // Calculate RMS for this chunk
      const rms = Math.sqrt(chunk.reduce((sum, sample) => sum + sample * sample, 0) / chunk.length);
      
      // Calculate peak values
      const peakPos = Math.max(...chunk);
      const peakNeg = Math.min(...chunk);
      
      // Draw the waveform
      const x = i;
      const centerY = CANVAS_HEIGHT / 2;
      const amplitude = CANVAS_HEIGHT / 2;
      
      // Draw peak-to-peak line
      ctx.strokeStyle = `rgba(0, ${Math.floor(255 * rms)}, 255, 0.8)`;
      ctx.beginPath();
      ctx.moveTo(x, centerY + (peakNeg * amplitude));
      ctx.lineTo(x, centerY + (peakPos * amplitude));
      ctx.stroke();
      
      // Draw RMS indicator
      const rmsHeight = rms * amplitude;
      ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1 - rms))}, 0, 0.3)`;
      ctx.fillRect(x, centerY - rmsHeight, 1, rmsHeight * 2);
    }
    
    // Add legend
    const legendWidth = 150;
    const legendHeight = 60;
    const legendX = CANVAS_WIDTH - legendWidth - 10;
    const legendY = 10;
    
    // Legend background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    
    // Legend items
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.fillRect(legendX + 10, legendY + 10, 20, 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(legendX + 10, legendY + 30, 20, 10);
    
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText('Waveform', legendX + 35, legendY + 13);
    ctx.fillText('Volume/Emphasis', legendX + 35, legendY + 35);
    
    return canvas.toDataURL('image/png');
  } catch (error: any) {
    console.error('Error generating visualization:', error);
    
    // Create error canvas
    const errorCanvas = createCanvas(400, 100);
    const ctx = errorCanvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 400, 100);
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Error generating audio visualization', 20, 50);
    ctx.font = '10px Arial';
    ctx.fillText(`Error: ${error.message || 'Unknown error'}`, 20, 70);
    
    return errorCanvas.toDataURL('image/png');
  }
}

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
      
      // Generate spectrogram from audio data
      const spectrogram = await generateSpectrogram(audioBuffer);
      
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
        result: `<p><strong>Transcription:</strong> ${transcribedText}</p><p><strong>Analysis:</strong> ${analysis}</p>`,
        spectrogram: spectrogram
      });
    } finally {
      // Make sure we clean up the temporary file even if there's an error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error analyzing voice for sarcasm.' }, { status: 500 });
  }
}