"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

interface AudioAnalysisProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: string) => void;
}

export function AudioAnalysis({ onAnalysisStart, onAnalysisComplete }: AudioAnalysisProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Ready to record");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    };
  }, [audioURL]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      // Reset previous recording data
      audioChunksRef.current = [];
      setAudioURL(null);
      setRecordingTime(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create audio blob and URL
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setStatusMessage("Recording complete. Ready to analyze.");
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setStatusMessage("Recording...");
      
      // Start the timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
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
      
      // Clear the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const analyzeAudio = async () => {
    if (!audioURL) {
      alert('Please record audio first');
      return;
    }

    onAnalysisStart();
    setStatusMessage("Converting and analyzing audio...");

    try {
      // Convert audio blob to base64
      const blob = await fetch(audioURL).then(r => r.blob());
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          if (!reader.result) {
            throw new Error("Failed to read audio file");
          }

          // Extract the base64 part from data URL
          const base64Audio = (reader.result as string).split(',')[1];
          
          const response = await fetch('/api/detect-voice-sarcasm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio: base64Audio })
          });

          if (!response.ok) {
            throw new Error('Failed to analyze voice');
          }

          const data = await response.json();
          onAnalysisComplete(data.result);
          setStatusMessage("Analysis complete.");
        } catch (error) {
          console.error('Error processing audio:', error);
          onAnalysisComplete('An error occurred while analyzing the voice recording. Please try again.');
          setStatusMessage("Analysis failed. Please try again.");
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error analyzing voice:', error);
      onAnalysisComplete('An error occurred while processing the audio. Please try again.');
      setStatusMessage("Analysis failed. Please try again.");
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm">Record your voice to analyze for sarcasm:</p>
      
      <div className="text-center">
        <div className="mb-6 border border-border rounded p-4 bg-muted/20">
          <div className="text-2xl font-mono font-bold mb-2">{formatTime(recordingTime)}</div>
          <div className="text-sm text-muted-foreground mb-4">{statusMessage}</div>
          
          {audioURL && (
            <audio 
              ref={audioRef}
              src={audioURL} 
              controls 
              className="w-full max-w-md mx-auto mb-4"
            />
          )}
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button 
            type="button" 
            variant={isRecording ? "outline" : "default"}
            onClick={startRecording}
            disabled={isRecording}
          >
            Start Recording
          </Button>
          
          <Button 
            type="button"
            variant="destructive"
            disabled={!isRecording}
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
          
          <Button 
            type="button"
            variant="default"
            disabled={!audioURL || isRecording}
            onClick={analyzeAudio}
          >
            Analyze Voice
          </Button>
        </div>
      </div>
    </div>
  );
}