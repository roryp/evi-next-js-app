"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface SarcasmStyleWeight {
  name: string;
  weight: number;
  enabled: boolean;
  description: string;
}

export interface SarcasmToneSettings {
  intensity: number;
  humor: number;
  harshness: number;
  subtlety: number;
}

export interface SarcasmCreatorParameters {
  styleWeights: Record<string, SarcasmStyleWeight>;
  toneSettings: SarcasmToneSettings;
}

// Default parameters for sarcasm generation
export const defaultSarcasmCreatorParameters: SarcasmCreatorParameters = {
  styleWeights: {
    "exaggeration": { 
      name: "Exaggeration", 
      weight: 0.7, 
      enabled: false,
      description: "Uses hyperbole and overstatement to emphasize the sarcastic point"
    },
    "fakeEnthusiasm": { 
      name: "Fake Enthusiasm", 
      weight: 0.8, 
      enabled: false,
      description: "Expresses excessive fake excitement or positivity about something negative"
    },
    "mockingRepetition": { 
      name: "Mocking Repetition", 
      weight: 0.4, 
      enabled: false,
      description: "Repeats or mimics part of the input text in a mocking tone"
    },
    "ironicUnderstatement": { 
      name: "Ironic Understatement", 
      weight: 0.6, 
      enabled: false,
      description: "Deliberately understates something significant for ironic effect"
    },
    "rhetoricalQuestions": { 
      name: "Rhetorical Questions", 
      weight: 0.5, 
      enabled: false,
      description: "Uses questions that emphasize the obvious sarcastic point"
    },
    "fakeCompliments": { 
      name: "Fake Compliments", 
      weight: 0.65, 
      enabled: false,
      description: "Offers insincere praise or congratulations"
    },
    "literalInterpretation": { 
      name: "Literal Interpretation", 
      weight: 0.45, 
      enabled: false,
      description: "Takes figurative language literally for comedic effect"
    },
    "absurdComparison": { 
      name: "Absurd Comparison", 
      weight: 0.55, 
      enabled: false,
      description: "Compares the situation to something ridiculous or extreme"
    },
    "dramaticPunctuation": { 
      name: "Dramatic Punctuation", 
      weight: 0.4, 
      enabled: false,
      description: "Uses excessive punctuation, ALL CAPS, or emphasis for effect"
    }
  },
  toneSettings: {
    intensity: 0.0,     // How strong the sarcasm should be (0.0 to 1.0)
    humor: 0.0,         // How funny vs serious (0.0 to 1.0)
    harshness: 0.0,     // How gentle vs cutting (0.0 to 1.0)
    subtlety: 0.0       // How obvious vs subtle (0.0 to 1.0)
  }
};

export default function SarcasmCreatorConfig({
  parameters = defaultSarcasmCreatorParameters,
  onChange,
}: {
  parameters?: SarcasmCreatorParameters;
  onChange: (params: SarcasmCreatorParameters) => void;
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [currentParams, setCurrentParams] = useState<SarcasmCreatorParameters>(parameters);
  
  // Update style weight
  const updateStyleWeight = (id: string, value: number) => {
    const newParams = {
      ...currentParams,
      styleWeights: {
        ...currentParams.styleWeights,
        [id]: {
          ...currentParams.styleWeights[id],
          weight: value
        }
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Toggle style enabled state
  const toggleStyleEnabled = (id: string) => {
    const newParams = {
      ...currentParams,
      styleWeights: {
        ...currentParams.styleWeights,
        [id]: {
          ...currentParams.styleWeights[id],
          enabled: !currentParams.styleWeights[id].enabled
        }
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Update tone setting
  const updateToneSetting = (id: keyof SarcasmToneSettings, value: number) => {
    const newParams = {
      ...currentParams,
      toneSettings: {
        ...currentParams.toneSettings,
        [id]: value
      }
    };
    setCurrentParams(newParams);
    onChange(newParams);
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setCurrentParams(defaultSarcasmCreatorParameters);
    onChange(defaultSarcasmCreatorParameters);
  };
  
  return (
    <div className="w-full border rounded-md overflow-hidden">
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className="w-full flex justify-between items-center p-3 bg-purple-900/10 hover:bg-purple-900/20 transition-colors"
      >
        <span className="font-medium">Sarcasm Generator Settings</span>
        <span className="text-xs">{showConfig ? '▲' : '▼'}</span>
      </button>
      
      {showConfig && (
        <div className="p-4 border-t">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Sarcasm Style Weights</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {Object.entries(currentParams.styleWeights).map(([id, style]) => (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={style.enabled}
                        onChange={() => toggleStyleEnabled(id)}
                        className="mr-2"
                      />
                      <span className={style.enabled ? "font-medium" : "opacity-50"}>
                        {style.name}
                      </span>
                    </label>
                    <span className="text-xs opacity-70">
                      {(style.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={style.weight}
                    onChange={(e) => updateStyleWeight(id, parseFloat(e.target.value))}
                    disabled={!style.enabled}
                    className={`w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer ${!style.enabled && 'opacity-50'}`}
                  />
                  <p className="text-xs opacity-70">{style.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Tone Settings</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Intensity</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.toneSettings.intensity * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentParams.toneSettings.intensity}
                  onChange={(e) => updateToneSetting('intensity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">How strong the sarcastic tone will be</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Humor</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.toneSettings.humor * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentParams.toneSettings.humor}
                  onChange={(e) => updateToneSetting('humor', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">Balance between funny and serious</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Harshness</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.toneSettings.harshness * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentParams.toneSettings.harshness}
                  onChange={(e) => updateToneSetting('harshness', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">How cutting vs gentle the sarcasm will be</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">Subtlety</label>
                  <span className="text-xs opacity-70">
                    {(currentParams.toneSettings.subtlety * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentParams.toneSettings.subtlety}
                  onChange={(e) => updateToneSetting('subtlety', parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs opacity-70">How obvious vs subtle the sarcasm will be</p>
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