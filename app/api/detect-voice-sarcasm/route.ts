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

// Function to analyze prosody and extract syllable boundaries from audio data
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
    // Step 1: Compute short-time energy for intensity analysis
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
    
    // Step 2: Find energy peaks for syllable detection (using energy derivative)
    const smoothedEnergy = smoothArray(energyValues, 3);
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
        // Convert frame index to time (seconds)
        const timePosition = (i * frameStep) / sampleRate;
        boundaries.push(timePosition);
      }
      prevSign = currentSign;
    }
    
    // Step 3: Estimate pitch contour (basic autocorrelation method)
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
    
    // Step 4: Calculate speech rate from syllable count
    const durationSeconds = audioData.length / sampleRate;
    const syllablesPerSecond = boundaries.length / durationSeconds;
    
    // Set results
    result.syllableBoundaries = boundaries;
    result.pitchContour = normalizePitchContour(pitchValues);
    result.intensity = normalizeArray(smoothedEnergy);
    result.speechRate = syllablesPerSecond;
    
    return result;
  } catch (error) {
    console.error('Error analyzing prosody:', error);
    return result;
  }
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

// Function to generate a spectrogram from audio data
async function generateSpectrogram(audioBuffer: Buffer): Promise<{image: string, prosody: any}> {
  try {
    // Parse the WAV file - convert Buffer to Uint8Array to fix type issue
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

    // Analyze prosody in the audio data
    const prosodyData = await analyzeProsody(audioData, sampleRate);

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
    
    // Calculate total audio duration in seconds (more accurate)
    const audioDurationSeconds = audioData.length / sampleRate;
    
    // Vertical time markers - more deployment-friendly implementation
    const secondsMarkers = 5; // Reduced number of markers for better visibility
    for (let i = 0; i <= secondsMarkers; i++) {
      const x = Math.floor((i / secondsMarkers) * CANVAS_WIDTH);
      
      // Draw vertical grid line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
      
      // Calculate marker time in seconds (simpler calculation)
      const markerTimeSeconds = (i * audioDurationSeconds / secondsMarkers).toFixed(1);
      
      // Add time labels - More robust text rendering with fallback fonts
      try {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Brighter text for better visibility
        ctx.font = '10px sans-serif'; // Using sans-serif instead of Arial for better compatibility
        ctx.fillText(`${markerTimeSeconds}s`, x + 2, CANVAS_HEIGHT - 5);
      } catch (err) {
        console.warn('Error rendering time markers text:', err);
        // Fallback - don't render text, just the lines
      }
    }
    
    // Horizontal amplitude markers
    for (let i = 0; i <= 4; i++) {
      const y = Math.floor((i / 4) * CANVAS_HEIGHT);
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
    
    // Prepare array to store energy values for later use with syllables
    const energyByPosition = new Array(CANVAS_WIDTH);
    
    for (let i = 0; i < CANVAS_WIDTH; i++) {
      const startIdx = i * FRAME_SIZE;
      const endIdx = startIdx + FRAME_SIZE;
      const chunk = audioData.slice(startIdx, endIdx);
      
      if (chunk.length === 0) continue;
      
      // Calculate RMS for this chunk
      const rms = Math.sqrt(chunk.reduce((sum, sample) => sum + sample * sample, 0) / chunk.length);
      energyByPosition[i] = rms; // Store for syllable visualization
      
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
      
      // Draw RMS indicator (volume/emphasis) - IMPROVED VISIBILITY
      const rmsHeight = rms * amplitude;
      
      // Make the red volume bars more visible with higher opacity and wider bars
      ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1 - rms))}, 0, 0.6)`; // Increased opacity from 0.3 to 0.6
      const barWidth = 3; // Wider bars (was 1)
      ctx.fillRect(x, centerY - rmsHeight, barWidth, rmsHeight * 2);
      
      // Add subtle border to help red bars stand out
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, centerY - rmsHeight, barWidth, rmsHeight * 2);
    }
    
    // Add additional visualization for prosody
    // Create word flow visualization by merging syllable boundaries with energy data
    
    // First, find potential word boundaries by looking for longer pauses
    // (gaps between syllables that exceed a threshold)
    const wordBoundaries = [];
    const minPauseDuration = 0.2; // seconds
    
    // Find word boundaries by looking for longer pauses between syllables
    if (prosodyData.syllableBoundaries.length > 1) {
      wordBoundaries.push(prosodyData.syllableBoundaries[0]); // First syllable is also a word start
      
      for (let i = 1; i < prosodyData.syllableBoundaries.length; i++) {
        const gap = prosodyData.syllableBoundaries[i] - prosodyData.syllableBoundaries[i-1];
        if (gap > minPauseDuration) {
          wordBoundaries.push(prosodyData.syllableBoundaries[i]);
        }
      }
    }
    
    // Draw connected syllable flow with emphasis
    if (prosodyData.syllableBoundaries.length > 0) {
      // Draw flowing word/syllable emphasis area
      ctx.beginPath();
      let firstX = Math.floor((prosodyData.syllableBoundaries[0] / audioDurationSeconds) * CANVAS_WIDTH);
      ctx.moveTo(firstX, CANVAS_HEIGHT);
      
      // Connect syllable points with a curve that follows the energy contour
      prosodyData.syllableBoundaries.forEach((timePoint, index) => {
        const x = Math.floor((timePoint / audioDurationSeconds) * CANVAS_WIDTH);
        
        // Find the average energy around this syllable position
        let syllableEnergy = 0;
        let count = 0;
        
        for (let i = Math.max(0, x-5); i <= Math.min(CANVAS_WIDTH-1, x+5); i++) {
          if (energyByPosition[i] !== undefined) {
            syllableEnergy += energyByPosition[i];
            count++;
          }
        }
        
        const avgEnergy = count > 0 ? syllableEnergy / count : 0;
        const energyHeight = CANVAS_HEIGHT * 0.4 * avgEnergy;
        
        // Create a flowing curve showing syllable emphasis
        const y = CANVAS_HEIGHT - energyHeight;
        
        if (index === 0) {
          ctx.lineTo(x, y);
        } else {
          // Use quadratic curves to create a flowing river-like visualization
          const prevX = Math.floor((prosodyData.syllableBoundaries[index-1] / audioDurationSeconds) * CANVAS_WIDTH);
          const controlX = (prevX + x) / 2;
          ctx.quadraticCurveTo(controlX, y, x, y);
        }
      });
      
      // Complete the shape
      const lastX = Math.floor((prosodyData.syllableBoundaries[prosodyData.syllableBoundaries.length-1] / audioDurationSeconds) * CANVAS_WIDTH);
      ctx.lineTo(lastX, CANVAS_HEIGHT);
      ctx.closePath();
      
      // Fill with a gradient to show word flow
      const wordFlowGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.5, 0, CANVAS_HEIGHT);
      wordFlowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.5)'); // Red at top
      wordFlowGradient.addColorStop(1, 'rgba(255, 200, 50, 0.2)'); // Orange-yellow at bottom
      ctx.fillStyle = wordFlowGradient;
      ctx.fill();
    }
    
    // Draw syllable boundaries with improved visualization
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Bright yellow for syllables
    ctx.lineWidth = 1;
    
    prosodyData.syllableBoundaries.forEach((timePoint, index) => {
      const x = Math.floor((timePoint / audioDurationSeconds) * CANVAS_WIDTH);
      
      // Draw the syllable boundary line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
      
      // Add more prominent markers at the top
      ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 5, 10);
      ctx.lineTo(x + 5, 10);
      ctx.fill();
      
      // Add syllable number label for reference
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '9px sans-serif';
      ctx.fillText(`s${index+1}`, x - 4, 20);
      
      // Determine if this is likely a word boundary
      const isWordBoundary = wordBoundaries.includes(timePoint);
      
      // Mark word boundaries more clearly
      if (isWordBoundary) {
        // Draw a more prominent marker for word boundaries
        ctx.fillStyle = 'rgba(50, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x, 30, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add "W" label for word
        ctx.fillStyle = 'rgba(50, 255, 255, 0.9)';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('W', x - 4, 40);
      }
    });
    
    // Draw pitch contour
    if (prosodyData.pitchContour.length > 0) {
      ctx.strokeStyle = 'rgba(255, 192, 0, 0.9)'; // Orange for pitch
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Scale pitch contour to canvas
      const pitchStep = audioData.length / prosodyData.pitchContour.length;
      
      for (let i = 0; i < prosodyData.pitchContour.length; i++) {
        const x = Math.floor((i * pitchStep) / audioData.length * CANVAS_WIDTH);
        const pitchValue = prosodyData.pitchContour[i];
        
        // Skip unvoiced frames (zero pitch)
        if (pitchValue === 0) continue;
        
        const y = CANVAS_HEIGHT - (pitchValue * CANVAS_HEIGHT * 0.8) - 20; // Leave some margins
        
        if (i === 0 || prosodyData.pitchContour[i-1] === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    
    // Convert canvas to base64 string with proper method signature
    try {
      // Fix: Use toDataURL without quality parameter for PNG
      const dataUrl = canvas.toDataURL('image/png');
      return {
        image: dataUrl,
        prosody: prosodyData
      };
    } catch (err) {
      console.error('Error converting canvas to data URL:', err);
      throw new Error('Error generating spectrogram image');
    }
  } catch (error: any) {
    console.error('Error generating visualization:', error);
    
    // Create a simpler error canvas with minimal text rendering
    try {
      const errorCanvas = createCanvas(400, 100);
      const ctx = errorCanvas.getContext('2d');
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 400, 100);
      
      // Add simple error indicator without text
      ctx.fillStyle = 'red';
      ctx.fillRect(50, 30, 300, 40);
      
      // Fix: Use toDataURL without quality parameter
      return {
        image: errorCanvas.toDataURL('image/png'),
        prosody: null
      };
    } catch (fallbackErr) {
      console.error('Even error canvas failed:', fallbackErr);
      // Last resort: return a static error image URL 
      return {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAB4CAYAAADc36X0AAAAa0lEQVR42u3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL8G8aggAZCJvR4AAAAASUVORK5CYII=',
        prosody: null
      };
    }
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
      
      // Start generating spectrogram and transcription in parallel for better performance
      const spectrogramPromise = generateSpectrogram(audioBuffer);
      
      // Set up OpenAI with proper timeout handling
      const openaiOptions = {
        timeout: 30000, // 30 second timeout for OpenAI API calls
      };
      
      const transcriptionPromise = openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
      });
      
      // Wait for both operations to complete
      const [spectrogramResult, transcription] = await Promise.all([
        spectrogramPromise.catch(error => {
          console.error('Error generating spectrogram:', error);
          return { image: null, prosody: null };
        }),
        transcriptionPromise.catch(error => {
          console.error('Error transcribing audio:', error);
          throw new Error('Could not transcribe the audio. Please try again.');
        })
      ]);
      
      const spectrogram = spectrogramResult.image;
      const prosodyData = spectrogramResult.prosody;
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
                     Analyze both the transcribed text and the provided prosody data to detect sarcasm.
                     
                     Prosody features like speech rate, pitch variation, and syllable emphasis are strong 
                     indicators of sarcasm that may not be captured in text alone. Consider these patterns:
                     
                     - Exaggerated pitch variation (high peaks and valleys in pitch contour)
                     - Unusually slow or stretched syllables
                     - Emphasized words that wouldn't normally be emphasized
                     - Dramatic pauses between words
                     - Contradictions between the literal meaning and prosodic features
                     
                     Provide a thorough analysis and a clear verdict on whether the speech contains sarcasm.` 
          },
          { 
            role: 'user', 
            content: `Analyze this speech for signs of sarcasm:
            
            Transcription: "${transcribedText}"
            
            Prosody data:
            - Speech rate: ${prosodyData.speechRate.toFixed(2)} syllables per second
            - Number of syllables detected: ${prosodyData.syllableBoundaries.length}
            - Syllable timing (seconds): ${prosodyData.syllableBoundaries.map(t => t.toFixed(2)).join(', ')}
            - Pitch variation: ${describePitchVariation(prosodyData.pitchContour)}
            - Word boundaries detected at approximately: ${identifyWordBoundaries(prosodyData.syllableBoundaries).map(t => t.toFixed(2)).join(', ')} seconds
            
            Based on both the transcription and these prosodic features, determine if sarcasm is present.`
          }
        ]
      });
      
      const analysis = response.choices[0]?.message?.content?.trim() || 'No analysis available';
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return NextResponse.json({ 
        result: `<p><strong>Transcription:</strong> ${transcribedText}</p><p><strong>Analysis:</strong> ${analysis}</p>`,
        spectrogram: spectrogram,
        prosody: prosodyData
      });
    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Make sure we clean up the temporary file even if there's an error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      return NextResponse.json({ 
        error: `Error processing audio: ${processingError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: `Error analyzing voice for sarcasm: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
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