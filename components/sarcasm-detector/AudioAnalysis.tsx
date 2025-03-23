"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

interface AudioAnalysisProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: string) => void;
}

const MAX_RECORDING_TIME = 30; // Maximum recording time in seconds
const PROCESSING_TIMEOUT = 30000; // 30 seconds timeout for processing

export function AudioAnalysis({ onAnalysisStart, onAnalysisComplete }: AudioAnalysisProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to record");
  const [spectrogramURL, setSpectrogramURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [audioURL]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      // Reset states
      audioChunksRef.current = [];
      setAudioURL(null);
      setRecordingTime(0);
      setSpectrogramURL(null);
      setIsProcessing(false);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono audio for better processing
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      // Create media recorder with specific audio MIME type
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000 // Limit bitrate for better performance
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setStatusMessage("Recording complete. Ready to analyze.");
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with time limit
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setStatusMessage("Recording...");
      
      // Start timer with maximum recording time limit
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          if (prevTime >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prevTime + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setStatusMessage("Could not access the microphone. Please check permissions.");
      alert('Could not access the microphone. Please make sure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleAudioVisualization = (spectrogramURL: string | null) => {
    if (spectrogramURL) {
      setImageError(false);
      // Pre-load the image to ensure it's ready before displaying
      const img = new Image();
      img.onload = () => {
        setSpectrogramURL(spectrogramURL);
      };
      img.onerror = () => {
        console.error('Failed to load audio visualization');
        setImageError(true);
        setSpectrogramURL(spectrogramURL); // Still set the URL for retry attempts
      };
      img.src = spectrogramURL;
    } else {
      setSpectrogramURL(null);
      setImageError(false);
    }
  };

  const analyzeAudio = async () => {
    if (!audioURL) {
      alert('Please record audio first');
      return;
    }

    try {
      onAnalysisStart();
      setIsProcessing(true);
      setStatusMessage("Converting and analyzing audio...");
      setSpectrogramURL(null);

      // Set a timeout for the entire processing
      processingTimeoutRef.current = setTimeout(() => {
        setStatusMessage("Analysis timed out. Please try again with a shorter recording.");
        setIsProcessing(false);
        onAnalysisComplete('Analysis timed out. Please try again with a shorter recording.');
      }, PROCESSING_TIMEOUT);

      // Create a new AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 44100, // Match the recording sample rate
        });
      }
      
      const response = await fetch(audioURL);
      const audioData = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const wavData = audioBufferToWav(audioBuffer);
      
      setStatusMessage("Sending audio for analysis...");
      
      const base64Audio = btoa(
        new Uint8Array(wavData)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      const apiResponse = await fetch('/api/detect-voice-sarcasm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio: base64Audio })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to analyze voice');
      }

      // Clear timeout as request completed successfully
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }

      const data = await apiResponse.json();
      onAnalysisComplete(data.result);
      handleAudioVisualization(data.spectrogram);
      setStatusMessage("Analysis complete.");
      
    } catch (error) {
      console.error('Error analyzing voice:', error);
      onAnalysisComplete('An error occurred while processing the audio. Please try again.');
      setStatusMessage("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    
    const wav = new ArrayBuffer(44 + length);
    const view = new DataView(wav);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, 36 + length, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numOfChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numOfChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length, true);
    
    // Write the PCM samples
    const dataOffset = 44;
    const channels = [];
    for (let i = 0; i < numOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = dataOffset;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        // Convert float to int16
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }
    
    // Debugging: Log WAV file structure
    console.log('WAV File Header:', new Uint8Array(wav.slice(0, 44)));
    console.log('WAV File Data Length:', length);
    
    return wav;
  };
  
  // Helper function to write strings to a DataView
  const writeString = (view: DataView, offset: number, string: string): void => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm">Record your voice to analyze for sarcasm (max {MAX_RECORDING_TIME} seconds):</p>
      
      <div className="text-center">
        <div className="mb-6 border border-border rounded p-4 bg-muted/20">
          <div className="text-2xl font-mono font-bold mb-2">{formatTime(recordingTime)}</div>
          <div className={`text-sm mb-4 ${isProcessing ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            {statusMessage}
            {isProcessing && <span className="ml-2 animate-pulse">⏳</span>}
          </div>
          
          {audioURL && (
            <audio 
              ref={audioRef}
              src={audioURL} 
              controls 
              className="w-full max-w-md mx-auto mb-4"
            />
          )}
          
          {spectrogramURL && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Audio Analysis</h3>
              <div className="border border-border p-2 rounded">
                {imageError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-500 text-sm">
                      Unable to load visualization. 
                      <button 
                        className="ml-2 underline text-blue-500"
                        onClick={() => {
                          if (spectrogramURL) {
                            handleAudioVisualization(spectrogramURL);
                          }
                        }}
                      >
                        Retry
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={spectrogramURL} 
                      alt="Audio Analysis" 
                      className="max-w-full h-auto"
                      style={{ imageRendering: 'crisp-edges' }}
                      onError={() => setImageError(true)}
                    />
                    
                    {/* Image overlay with legends */}
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs p-2 rounded shadow">
                      <div className="flex items-center mb-1">
                        <span className="w-3 h-3 bg-cyan-400 inline-block mr-2"></span>
                        <span>Waveform (Speech Pattern)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 inline-block mr-2"></span>
                        <span>Volume/Emphasis</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  This visualization shows your speech patterns over time.
                  The cyan waveform shows the audio intensity, while
                  the red bars indicate volume and potential emphasis in speech.
                </p>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-4 p-2 bg-yellow-500/10 rounded text-xs text-yellow-500">
              Processing may take up to 30 seconds. Please wait...
            </div>
          )}
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button 
            type="button" 
            variant={isRecording ? "outline" : "default"}
            onClick={startRecording}
            disabled={isRecording || isProcessing}
          >
            {isRecording ? `Recording (${MAX_RECORDING_TIME - recordingTime}s left)` : 'Start Recording'}
          </Button>
          
          <Button 
            type="button"
            variant="destructive"
            disabled={!isRecording || isProcessing}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
          
          <Button 
            type="button"
            variant="default"
            disabled={!audioURL || isRecording || isProcessing}
            onClick={analyzeAudio}
          >
            {isProcessing ? 'Processing...' : 'Analyze Voice'}
          </Button>
        </div>
      </div>
    </div>
  );
}