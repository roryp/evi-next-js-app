"use client";

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Sarcasm Detector</h1>
      
      <div className="mb-6">
        <div className="flex border-b border-border">
          <Button
            variant={activeTab === "text" ? "default" : "ghost"}
            onClick={() => setActiveTab("text")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "text" ? "active" : ""}
          >
            Text Analysis
          </Button>
          <Button
            variant={activeTab === "webcam" ? "default" : "ghost"}
            onClick={() => setActiveTab("webcam")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "webcam" ? "active" : ""}
          >
            Webcam Analysis
          </Button>
          <Button
            variant={activeTab === "audio" ? "default" : "ghost"}
            onClick={() => setActiveTab("audio")}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            data-state={activeTab === "audio" ? "active" : ""}
          >
            Audio Analysis
          </Button>
        </div>
      </div>

      <div className="p-4 border border-border rounded-lg">
        {activeTab === "text" && (
          <TextAnalysis 
            onAnalysisStart={() => {
              setIsAnalyzing(true);
              setResult("");
            }}
            onAnalysisComplete={(result) => {
              setResult(result);
              setIsAnalyzing(false);
            }}
          />
        )}
        
        {activeTab === "webcam" && (
          <WebcamAnalysis 
            onAnalysisStart={() => {
              setIsAnalyzing(true);
              setResult("");
            }}
            onAnalysisComplete={(result) => {
              setResult(result);
              setIsAnalyzing(false);
            }}
          />
        )}
        
        {activeTab === "audio" && (
          <AudioAnalysis 
            onAnalysisStart={() => {
              setIsAnalyzing(true);
              setResult("");
            }}
            onAnalysisComplete={(result) => {
              setResult(result);
              setIsAnalyzing(false);
            }}
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
          <div dangerouslySetInnerHTML={{ __html: result }}></div>
        </div>
      )}
    </div>
  );
}