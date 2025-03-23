"use client";

import React from 'react';
import { useState } from "react";
import { TextAnalysis } from "./TextAnalysis";
import { WebcamAnalysis } from "./WebcamAnalysis";
import { AudioAnalysis } from "./AudioAnalysis";
import { Button } from "../ui/button";

type TabType = "text" | "webcam" | "audio";

export function SarcasmDetector() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [result, setResult] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTabChange = (tab: TabType) => {
    if (!isAnalyzing) {
      setActiveTab(tab);
      setResult("");
    }
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setResult("");
  };

  const handleAnalysisComplete = (result: string) => {
    setIsAnalyzing(false);
    setResult(result);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Sarcasm Detector</h1>
      
      <div className="mb-6">
        <div className="flex border-b border-border">
          <Button
            variant={activeTab === "text" ? "default" : "ghost"}
            onClick={() => handleTabChange("text")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "text" ? "active" : ""}
            disabled={isAnalyzing}
          >
            Text Analysis
          </Button>
          <Button
            variant={activeTab === "webcam" ? "default" : "ghost"}
            onClick={() => handleTabChange("webcam")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "webcam" ? "active" : ""}
            disabled={isAnalyzing}
          >
            Webcam Analysis
          </Button>
          <Button
            variant={activeTab === "audio" ? "default" : "ghost"}
            onClick={() => handleTabChange("audio")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "audio" ? "active" : ""}
            disabled={isAnalyzing}
          >
            Audio Analysis
          </Button>
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg">
        {activeTab === "text" && (
          <TextAnalysis 
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        
        {activeTab === "webcam" && (
          <WebcamAnalysis 
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
        
        {activeTab === "audio" && (
          <AudioAnalysis 
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
      </div>

      {isAnalyzing && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Analyzing...</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 border border-border rounded-lg bg-card">
          <div className="analysis-results prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result }}></div>
        </div>
      )}

      <style jsx global>{`
        .analysis-results p {
          margin-bottom: 0.75rem;
        }
        .analysis-results strong {
          font-weight: 600;
        }
        .analysis-results .analysis-content {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #f8f9fa;
          border-radius: 0.375rem;
          border-left: 3px solid #3b82f6;
        }
        .analysis-results .analysis-content p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}