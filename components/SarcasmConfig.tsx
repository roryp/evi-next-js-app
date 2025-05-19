"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { set } from "remeda";

export interface PatternWeight {
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

export interface SarcasmThresholds {
  baseThreshold: number;
  strongIndicatorThreshold: number;
  indicatorScoreThreshold: number;
  misleadingScoreThreshold: number;
  detectionThreshold: number;
}

export interface SarcasmParameters {
  patternWeights: Record<string, PatternWeight>;
  thresholds: SarcasmThresholds;
}

// Default parameters that match the original implementation
export const defaultSarcasmParameters: SarcasmParameters = {
  patternWeights: {
    "amusementContempt": { 
      name: "Amusement + Contempt", 
      weight: 0.2, 
      enabled: false,
      description: "Combines humor with disdain—strongly indicates sarcasm when the laughter or amusement masks scorn"
    },
    "exaggeratedPositive": { 
      name: "Exaggerated Positive Emotion", 
      weight: 0.2, 
      enabled: false,
      description: "Overstated positive signals (e.g., extreme joy or excitement) that contrast sharply with negative context"
    },
    "contrastingEmotions": { 
      name: "Contrasting Emotions", 
      weight: 0.3, 
      enabled: false,
      description: "Simultaneous expression of conflicting emotions is a key indicator of sarcastic intent"
    },
    "angerPositive": { 
      name: "Anger + Positive Emotion", 
      weight: 0.25, 
      enabled: false,
      description: "Indicates passive-aggressive sarcasm—positive language masking underlying frustration or anger"
    },
    "positiveNegativeUndertones": { 
      name: "Positive Emotion + Negative Undertones", 
      weight: 0.3, 
      enabled: false,
      description: "Surface-level enthusiasm that hides an underlying negative sentiment (e.g., false praise)"
    },
    "awkwardness": { 
      name: "Awkwardness", 
      weight: 0.15, 
      enabled: false,
      description: "High awkwardness often signals discomfort with saying something insincere"
    },
    "exaggeratedSingleEmotion": { 
      name: "Exaggerated Single Emotion", 
      weight: 0.15, 
      enabled: false,
      description: "One dominant emotion that's much stronger than others, suggesting possible exaggeration"
    },
    "emotionalComplexity": { 
      name: "Emotional Complexity", 
      weight: 0.1, 
      enabled: false,
      description: "Multiple different emotions detected at significant levels, suggesting complex intent"
    },
    "noDominantEmotion": { 
      name: "No Dominant Emotion", 
      weight: 0.1, 
      enabled: false,
      description: "Mixed or ambiguous emotional signals that may indicate masked sarcasm, but with less certainty"
    },
    "contemptDetected": { 
      name: "Contempt Detected", 
      weight: 0.2, 
      enabled: false,
      description: "Presence of contempt, which often signals sarcastic intent"
    },
    "realizationAmusement": { 
      name: "Realization + Amusement", 
      weight: 0.15, 
      enabled: false,
      description: "Combination indicating recognition of a contradiction or joke"
    },
    "emphaticSarcasm": { 
      name: "Emphatic Sarcasm", 
      weight: 0.15, 
      enabled: false,
      description: "High determination combined with misleading emotions suggesting deliberate sarcasm"
    }
  },
  thresholds: {
    baseThreshold: 0.15,             // Base threshold for strong indicators
    strongIndicatorThreshold: 0.25,  // Threshold for strong sarcasm indicators
    indicatorScoreThreshold: 0.15,   // Threshold for regular sarcasm indicators
    misleadingScoreThreshold: 0.2,   // Threshold for misleading emotions
    detectionThreshold: 0.18         // Threshold for detecting sarcasm overall
  }
};

export default function SarcasmConfig({
  parameters = defaultSarcasmParameters,
  onChange,
}: {
  parameters?: SarcasmParameters;
  onChange: (params: SarcasmParameters) => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [currentParams, setCurrentParams] = useState<SarcasmParameters>(parameters);
  
  // Update pattern weight
  const updatePatternWeight = (id: string, value: number) => {
    const newParams = {
      ...currentParams,
      patternWeights: {
        ...currentParams.patternWeights,
        [id]: {
          ...currentParams.patternWeights[id],
          weight: value
        }
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Toggle pattern enabled state
  const togglePatternEnabled = (id: string) => {
    const newParams = {
      ...currentParams,
      patternWeights: {
        ...currentParams.patternWeights,
        [id]: {
          ...currentParams.patternWeights[id],
          enabled: !currentParams.patternWeights[id].enabled
        }
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Update threshold value
  const updateThreshold = (id: keyof SarcasmThresholds, value: number) => {
    const newParams = {
      ...currentParams,
      thresholds: {
        ...currentParams.thresholds,
        [id]: value
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setCurrentParams(defaultSarcasmParameters);
    onChange(defaultSarcasmParameters);
  };
  
  return (
    <div className="w-full border rounded-md overflow-hidden">
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className="w-full flex justify-between items-center p-3 bg-purple-900/10 hover:bg-purple-900/20 transition-colors"
      >
        <span className="font-medium">Sarcasm Detection Settings</span>
        <span className="text-xs">{showConfig ? '▲' : '▼'}</span>
      </button>
      
      {showConfig && (
        <div className="p-4 border-t">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Pattern Weights</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {Object.entries(currentParams.patternWeights).map(([id, pattern]) => (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pattern.enabled}
                        onChange={() => togglePatternEnabled(id)}
                        className="mr-2"
                      />
                      <span className={pattern.enabled ? "font-medium" : "opacity-50"}>
                        {pattern.name}
                      </span>
                    </label>
                    <span className="text-xs opacity-70">
                      {(pattern.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pattern.weight}
                    onChange={(e) => updatePatternWeight(id, parseFloat(e.target.value))}
                    disabled={!pattern.enabled}
                    className={`w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer ${!pattern.enabled && 'opacity-50'}`}
                  />
                  <p className="text-xs opacity-70">{pattern.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Detection Thresholds</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Detection Threshold</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.thresholds.detectionThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={currentParams.thresholds.detectionThreshold}
                  onChange={(e) => updateThreshold('detectionThreshold', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">Minimum score required to report sarcasm</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Strong Indicator Threshold</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.thresholds.strongIndicatorThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={currentParams.thresholds.strongIndicatorThreshold}
                  onChange={(e) => updateThreshold('strongIndicatorThreshold', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">Threshold for strong individual emotion indicators</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={resetToDefaults}
              className="text-xs bg-purple-900/10 hover:bg-purple-900/20 text-purple-900"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}