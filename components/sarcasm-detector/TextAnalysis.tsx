"use client";

import { useState } from "react";
import { Button } from "../ui/button";

interface TextAnalysisProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: string) => void;
}

interface SentimentSegment {
  text: string;
  sentiment: "positive" | "negative" | "neutral" | "sarcastic";
  intensity: number;
}

export function TextAnalysis({ onAnalysisStart, onAnalysisComplete }: TextAnalysisProps) {
  const [text, setText] = useState("");
  const [sentimentFlow, setSentimentFlow] = useState<SentimentSegment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      alert("Please enter text to analyze");
      return;
    }

    onAnalysisStart();
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/detect-sarcasm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      setSentimentFlow(data.sentimentFlow || []);
      onAnalysisComplete(data.result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      onAnalysisComplete('An error occurred while analyzing the text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get color based on sentiment and intensity
  const getSentimentColor = (sentiment: string, intensity: number): string => {
    const alpha = 0.3 + (intensity * 0.7); // Adjust opacity based on intensity
    
    switch (sentiment) {
      case 'positive':
        return `rgba(0, 128, 0, ${alpha})`; // Green with intensity-based opacity
      case 'negative':
        return `rgba(255, 0, 0, ${alpha})`; // Red with intensity-based opacity
      case 'sarcastic':
        return `rgba(255, 165, 0, ${alpha})`; // Orange with intensity-based opacity
      case 'neutral':
      default:
        return `rgba(128, 128, 128, ${alpha})`; // Gray with intensity-based opacity
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="text-input" className="block text-sm font-medium mb-2">
            Enter text to analyze for sarcasm:
          </label>
          <textarea
            id="text-input"
            className="w-full h-32 p-3 border border-input rounded focus:outline-none focus:ring focus:ring-primary/25"
            placeholder="Type or paste text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <Button type="submit" className="mt-2" disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Detect Sarcasm'}
        </Button>
      </form>

      {sentimentFlow.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">Sentiment Flow Analysis:</h3>
          <div className="p-4 border rounded">
            {sentimentFlow.map((segment, index) => (
              <span 
                key={index} 
                style={{ 
                  backgroundColor: getSentimentColor(segment.sentiment, segment.intensity),
                  padding: '2px 0',
                  borderRadius: '2px',
                }}
                className="transition-colors"
                title={`${segment.sentiment} (intensity: ${Math.round(segment.intensity * 100)}%)`}
              >
                {segment.text}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: getSentimentColor("positive", 0.8) }}></div>
              <span className="text-xs">Positive</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: getSentimentColor("negative", 0.8) }}></div>
              <span className="text-xs">Negative</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: getSentimentColor("sarcastic", 0.8) }}></div>
              <span className="text-xs">Sarcastic</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: getSentimentColor("neutral", 0.8) }}></div>
              <span className="text-xs">Neutral</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}