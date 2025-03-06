"use client";

import { useState } from "react";
import { Button } from "../ui/button";

interface TextAnalysisProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: string) => void;
}

export function TextAnalysis({ onAnalysisStart, onAnalysisComplete }: TextAnalysisProps) {
  const [text, setText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      alert("Please enter text to analyze");
      return;
    }

    onAnalysisStart();

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
      onAnalysisComplete(data.result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      onAnalysisComplete('An error occurred while analyzing the text. Please try again.');
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
        <Button type="submit" className="mt-2">
          Detect Sarcasm
        </Button>
      </form>
    </div>
  );
}