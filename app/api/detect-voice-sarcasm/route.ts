import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { WaveFile } from 'wavefile';

// Constants for audio processing
const MAX_AUDIO_LENGTH = 30; // Maximum audio length in seconds
const SAMPLE_RATE = 44100;
const MAX_SAMPLES = MAX_AUDIO_LENGTH * SAMPLE_RATE;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Audio processing functions
function downsampleAudio(audioData: number[], targetLength: number): number[] {
  const step = audioData.length / targetLength;
  const result = new Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const pos = Math.floor(i * step);
    result[i] = audioData[pos];
  }
  return result;
}

function normalizeAudioData(audioData: number[]): number[] {
  let max = 0;
  // Find max absolute value
  for (let i = 0; i < audioData.length; i++) {
    const absVal = Math.abs(audioData[i]);
    if (absVal > max) max = absVal;
  }
  // Normalize
  const normalized = new Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalized[i] = audioData[i] / (max || 1);
  }
  return normalized;
}

// Helper function to smooth an array using moving average
function smoothArray(array: number[], windowSize: number): number[] {
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowSize); j <= Math.min(array.length - 1, i + windowSize); j++) {
      sum += array[j];
      count++;
    }
    result[i] = sum / count;
  }
  return result;
}

// Helper function to normalize an array to [0,1] range
function normalizeArray(array: number[]): number[] {
  const min = Math.min(...array);
  const max = Math.max(...array);
  const range = max - min;
  if (range === 0) return array.map(() => 0.5);
  return array.map(value => (value - min) / range);
}

// Helper function to normalize and clean pitch contour
function normalizePitchContour(pitchValues: number[]): number[] {
  // Filter out zeros and extreme values
  const validPitch = pitchValues.filter(p => p > 75 && p < 500);
  if (validPitch.length === 0) return pitchValues.map(() => 0);
  
  const min = Math.min(...validPitch);
  const max = Math.max(...validPitch);
  const range = max - min;
  
  // Normalize and handle unvoiced frames (zeros)
  return pitchValues.map(p => {
    if (p < 75 || p > 500) return 0; // Unvoiced
    return (p - min) / (range || 1);
  });
}

// Prosody analysis functions
async function calculateEnergy(audioData: number[], sampleRate: number): Promise<{
  energyValues: number[],
  smoothedEnergy: number[],
  frameStep: number
}> {
  // Compute short-time energy for intensity analysis
  const frameSize = Math.floor(0.025 * sampleRate); // 25ms frame
  const frameStep = Math.floor(0.010 * sampleRate); // 10ms step
  const numFrames = Math.floor((audioData.length - frameSize) / frameStep) + 1;
  
  const energyValues = new Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    const frameStart = i * frameStep;
    const frame = audioData.slice(frameStart, frameStart + frameSize);
    // Calculate energy (sum of squares)
    const energy = frame.reduce((sum, sample) => sum + (sample * sample), 0) / frameSize;
    energyValues[i] = energy;
  }
  
  const smoothedEnergy = smoothArray(energyValues, 3);
  
  return { energyValues, smoothedEnergy, frameStep };
}

async function detectSyllableBoundaries(smoothedEnergy: number[]): Promise<number[]> {
  // Find energy derivative for syllable detection
  const energyDelta = new Array(smoothedEnergy.length - 1);
  for (let i = 0; i < energyDelta.length; i++) {
    energyDelta[i] = smoothedEnergy[i + 1] - smoothedEnergy[i];
  }
  
  // Find zero-crossings in the derivative to detect syllable boundaries
  const threshold = 0.05 * Math.max(...energyDelta);
  let prevSign = energyDelta[0] > threshold;
  const boundaries = [];
  
  for (let i = 1; i < energyDelta.length; i++) {
    const currentSign = energyDelta[i] > threshold;
    // Zero-crossing from positive to negative with minimum distance
    if (prevSign && !currentSign) {
      // This is just the frame index - we'll convert to time later
      boundaries.push(i);
    }
    prevSign = currentSign;
  }
  
  return boundaries;
}

async function estimatePitch(audioData: number[], sampleRate: number): Promise<number[]> {
  // Estimate pitch contour using autocorrelation
  const pitchFrameSize = Math.floor(0.040 * sampleRate); // 40ms for pitch
  const pitchStep = Math.floor(0.015 * sampleRate); // 15ms step
  const pitchNumFrames = Math.floor((audioData.length - pitchFrameSize) / pitchStep) + 1;
  
  const pitchValues = new Array(pitchNumFrames);
  const minLag = Math.floor(sampleRate / 500); // 500Hz max pitch
  const maxLag = Math.floor(sampleRate / 75);  // 75Hz min pitch
  
  for (let i = 0; i < pitchNumFrames; i++) {
    const frameStart = i * pitchStep;
    const frame = audioData.slice(frameStart, frameStart + pitchFrameSize);
    
    // Simple autocorrelation for pitch estimation
    let maxCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = minLag; lag <= maxLag; lag++) {
      let correlation = 0;
      for (let j = 0; j < pitchFrameSize - lag; j++) {
        correlation += frame[j] * frame[j + lag];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    // Convert lag to frequency
    const pitchHz = bestLag > 0 ? sampleRate / bestLag : 0;
    pitchValues[i] = pitchHz;
  }
  
  return pitchValues;
}

// Master function to analyze prosody and extract syllable boundaries
async function analyzeProsody(audioData: number[], sampleRate: number): Promise<{
  syllableBoundaries: number[],
  pitchContour: number[],
  intensity: number[],
  speechRate: number
}> {
  // Default return object
  const result = {
    syllableBoundaries: [] as number[],
    pitchContour: [] as number[],
    intensity: [] as number[],
    speechRate: 0
  };
  
  try {
    // Step 1: Compute energy values for intensity analysis
    const { energyValues, smoothedEnergy, frameStep } = await calculateEnergy(audioData, sampleRate);
    
    // Step 2: Detect syllable boundaries
    const boundaryFrames = await detectSyllableBoundaries(smoothedEnergy);
    
    // Convert frame indices to time positions (seconds)
    const boundaryTimes = boundaryFrames.map(frame => (frame * frameStep) / sampleRate);
    
    // Step 3: Estimate pitch contour
    const pitchValues = await estimatePitch(audioData, sampleRate);
    
    // Step 4: Calculate speech rate from syllable count
    const durationSeconds = audioData.length / sampleRate;
    const syllablesPerSecond = boundaryTimes.length / durationSeconds;
    
    // Set results
    result.syllableBoundaries = boundaryTimes;
    result.pitchContour = normalizePitchContour(pitchValues);
    result.intensity = normalizeArray(smoothedEnergy);
    result.speechRate = syllablesPerSecond;
    
    return result;
  } catch (error) {
    console.error('Error analyzing prosody:', error);
    return result;
  }
}

// Helper function to extract audio data from WAV buffer
async function extractAudioData(audioBuffer: Buffer): Promise<{
  audioData: number[],
  sampleRate: number
}> {
  try {
    // Parse the WAV file - convert Buffer to Uint8Array
    const wav = new WaveFile(new Uint8Array(audioBuffer));
    
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
    
    return { audioData, sampleRate };
  } catch (error) {
    console.error('Error extracting audio data:', error);
    throw error;
  }
}

// Function to generate a simple HTML table for prosody data
function generateProsodyTable(prosodyData: any): string {
  const {
    syllableBoundaries,
    speechRate,
    pitchContour,
    intensity
  } = prosodyData;
  
  // Calculate descriptive statistics for pitch and intensity
  const validPitch = pitchContour.filter((p: number) => p > 0);
  const avgPitch = validPitch.length ? 
    validPitch.reduce((sum: number, val: number) => sum + val, 0) / validPitch.length : 0;
  
  const avgIntensity = intensity.reduce((sum: number, val: number) => sum + val, 0) / intensity.length;
  
  // Identify word boundaries from syllable boundaries
  const wordBoundaries = identifyWordBoundaries(syllableBoundaries);
  
  // Generate HTML table
  let tableHtml = `
    <table class="prosody-table" style="width:100%; border-collapse: collapse; margin-top: 15px;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Prosody Feature</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Speech Rate</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${speechRate.toFixed(2)} syllables/second</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Number of Syllables</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${syllableBoundaries.length}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Estimated Words</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${wordBoundaries.length}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Average Pitch Variation</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${avgPitch.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Average Intensity</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${avgIntensity.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Pitch Pattern</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${describePitchVariation(pitchContour)}</td>
        </tr>
      </tbody>
    </table>
  `;
  
  return tableHtml;
}

// Helper function to describe pitch variation patterns
function describePitchVariation(pitchContour: number[]): string {
  if (!pitchContour || pitchContour.length === 0) {
    return "insufficient data";
  }
  
  // Filter out zeros (unvoiced segments)
  const voicedPitch = pitchContour.filter(p => p > 0);
  if (voicedPitch.length === 0) {
    return "mostly unvoiced speech";
  }
  
  // Calculate statistics
  const avg = voicedPitch.reduce((sum, val) => sum + val, 0) / voicedPitch.length;
  const variance = voicedPitch.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / voicedPitch.length;
  const stdDev = Math.sqrt(variance);
  
  // Count direction changes (as a measure of pitch movement)
  let directionChanges = 0;
  for (let i = 1; i < voicedPitch.length - 1; i++) {
    if ((voicedPitch[i] > voicedPitch[i-1] && voicedPitch[i] > voicedPitch[i+1]) || 
        (voicedPitch[i] < voicedPitch[i-1] && voicedPitch[i] < voicedPitch[i+1])) {
      directionChanges++;
    }
  }
  
  // Analyze and describe
  let description = "";
  
  if (stdDev > 0.25) {
    description = "high pitch variation, possibly exaggerated intonation";
  } else if (stdDev > 0.15) {
    description = "moderate pitch variation, normal expressive speech";
  } else {
    description = "low pitch variation, relatively flat intonation";
  }
  
  if (directionChanges > voicedPitch.length * 0.3) {
    description += " with frequent pitch changes";
  } else if (directionChanges > voicedPitch.length * 0.15) {
    description += " with normal pitch movement";
  } else {
    description += " with minimal pitch movement";
  }
  
  return description;
}

// Helper function to identify word boundaries from syllable boundaries
function identifyWordBoundaries(syllableBoundaries: number[]): number[] {
  if (!syllableBoundaries || syllableBoundaries.length <= 1) {
    return syllableBoundaries || [];
  }
  
  const wordBoundaries = [syllableBoundaries[0]]; // First syllable starts a word
  const minPauseDuration = 0.2; // seconds
  
  for (let i = 1; i < syllableBoundaries.length; i++) {
    const gap = syllableBoundaries[i] - syllableBoundaries[i-1];
    if (gap > minPauseDuration) {
      wordBoundaries.push(syllableBoundaries[i]);
    }
  }
  
  return wordBoundaries;
}

// Main API route handler
export async function POST(request: Request) {
  try {
    const { audio } = await request.json();
    
    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }
    
    // Add validation for audio data size - very small audio files might be invalid
    if (audio.length < 1000) {
      return NextResponse.json({ 
        error: 'Audio recording is too short or empty. Please record at least 1 second of audio.' 
      }, { status: 400 });
    }
    
    // Create a temporary file for the audio
    const tempDir = path.join(process.cwd(), 'tmp');
    
    // Check if the directory exists, if not create it
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `temp-audio-${uuidv4()}.wav`);
    let audioBuffer;
    
    try {
      // Decode audio data with error handling
      try {
        audioBuffer = Buffer.from(audio, 'base64');
        // Quick validation to make sure it's actually valid audio data
        if (audioBuffer.length < 44) { // WAV header is at least 44 bytes
          throw new Error('Invalid audio data - too small to be a valid WAV file');
        }
      } catch (decodeError) {
        console.error('Error decoding audio data:', decodeError);
        return NextResponse.json({ 
          error: 'Could not decode the audio data. Please try recording again.' 
        }, { status: 400 });
      }
      
      // Write the audio data to a file
      await writeFile(tempFilePath, new Uint8Array(audioBuffer));
      console.log(`Processing audio file of size: ${audioBuffer.length} bytes`);
      
      // Process audio data
      const { audioData, sampleRate } = await extractAudioData(audioBuffer);
      
      // Analyze prosody in the audio data
      const prosodyData = await analyzeProsody(audioData, sampleRate);
      
      // Create prosody HTML table
      const prosodyTable = generateProsodyTable(prosodyData);
      
      // Get transcription from OpenAI (this part still runs in parallel)
      const transcriptionPromise = openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
      });
      
      // Wait for transcription to complete
      const transcription = await transcriptionPromise.catch(error => {
        console.error('Error transcribing audio:', error);
        throw new Error('Could not transcribe the audio. Please try again.');
      });
      
      const transcribedText = transcription.text;
      
      if (!transcribedText || transcribedText.trim() === '') {
        return NextResponse.json({ 
          error: 'No speech detected in the recording. Please try again.' 
        }, { status: 400 });
      }
      
      // Now analyze the transcribed text for sarcasm
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: 'system', 
            content: `You are a voice analysis expert specializing in detecting sarcasm. 
                     Analyze the transcribed text and prosody data to detect sarcasm.
                     
                     BE VERY CONCISE. Provide a short, 1-2 sentence analysis followed by 
                     a clear verdict of either "SARCASM DETECTED" or "NO SARCASM DETECTED".
                     
                     Total response should be under 50 words.` 
          },
          { 
            role: 'user', 
            content: `Analyze this speech for signs of sarcasm:
            
            Transcription: "${transcribedText}"
            
            Prosody data:
            - Speech rate: ${prosodyData.speechRate.toFixed(2)} syllables per second
            - Number of syllables detected: ${prosodyData.syllableBoundaries.length}
            - Pitch variation: ${describePitchVariation(prosodyData.pitchContour)}
            
            Give a brief, clear analysis and verdict.`
          }
        ]
      });
      
      const analysis = response.choices[0]?.message?.content?.trim() || 'No analysis available';
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return NextResponse.json({ 
        result: `<p><strong>Transcription:</strong> ${transcribedText}</p><p><strong>Analysis:</strong> ${analysis}</p>`,
        prosodyTable: prosodyTable,
        prosody: prosodyData
      });
    } catch (processingError: unknown) {
      console.error('Processing error:', processingError);
      
      // Make sure we clean up the temporary file even if there's an error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      return NextResponse.json({ 
        error: `Error processing audio: ${processingError instanceof Error ? processingError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: `Error analyzing voice for sarcasm: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}