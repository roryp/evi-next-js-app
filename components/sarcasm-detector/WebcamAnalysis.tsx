"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

interface WebcamAnalysisProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: string) => void;
}

export function WebcamAnalysis({ onAnalysisStart, onAnalysisComplete }: WebcamAnalysisProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      if (stream) {
        // If a stream already exists, stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access the webcam. Please make sure you have granted permission.');
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas to a data URL and save it
    const imageDataURL = canvas.toDataURL('image/png');
    setSnapshotImage(imageDataURL);
  };

  const analyzeSnapshot = async () => {
    if (!snapshotImage) {
      alert('Please take a snapshot first');
      return;
    }

    onAnalysisStart();

    try {
      const response = await fetch('/api/detect-facial-sarcasm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: snapshotImage })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze facial expression');
      }

      const data = await response.json();
      onAnalysisComplete(data.result);
    } catch (error) {
      console.error('Error analyzing facial expression:', error);
      onAnalysisComplete('An error occurred while analyzing the facial expression. Please try again.');
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm">Capture a facial expression to analyze for sarcasm:</p>
      
      <div className="text-center">
        <div className="mb-4">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            className="w-full max-w-lg mx-auto border border-border rounded"
            style={{ display: stream ? 'block' : 'none' }}
          />
          
          {!stream && !snapshotImage && (
            <div className="h-72 border border-border rounded flex items-center justify-center bg-muted/20">
              <p className="text-muted-foreground">Camera inactive</p>
            </div>
          )}

          {snapshotImage && (
            <img 
              src={snapshotImage} 
              alt="Snapshot preview" 
              className="w-full max-w-lg mx-auto border border-border rounded"
            />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="flex gap-3 justify-center mt-4">
          <Button 
            type="button" 
            variant={stream ? "outline" : "default"} 
            onClick={startCamera}
          >
            {stream ? 'Restart Camera' : 'Start Camera'}
          </Button>
          
          <Button 
            type="button"
            variant="secondary"
            disabled={!stream}
            onClick={takeSnapshot}
          >
            Take Snapshot
          </Button>
          
          <Button 
            type="button"
            variant="default"
            disabled={!snapshotImage}
            onClick={analyzeSnapshot}
          >
            Analyze Expression
          </Button>
        </div>
      </div>
    </div>
  );
}