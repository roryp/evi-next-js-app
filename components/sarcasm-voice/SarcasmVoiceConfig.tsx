"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export interface SarcasmVoiceSettings {
  voice: string;
  prosody: {
    pitch: number;
    rate: number;
    emphasisLevel: number;
  };
  autoPlay: boolean;
}

interface SarcasmVoiceConfigProps {
  settings: SarcasmVoiceSettings;
  onSettingsChange: (settings: SarcasmVoiceSettings) => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export function SarcasmVoiceConfig({
  settings,
  onSettingsChange,
  onRegenerate,
  disabled = false,
}: SarcasmVoiceConfigProps) {
  const voices = [
    { id: "alloy", name: "Alloy (Neutral)" },
    { id: "echo", name: "Echo (Male)" },
    { id: "fable", name: "Fable (Female)" },
    { id: "onyx", name: "Onyx (Male)" },
    { id: "nova", name: "Nova (Female)" },
    { id: "shimmer", name: "Shimmer (Female)" },
  ];

  const handleVoiceChange = (voiceId: string) => {
    onSettingsChange({
      ...settings,
      voice: voiceId,
    });
  };

  const handleProsodyChange = (property: string, value: number) => {
    onSettingsChange({
      ...settings,
      prosody: {
        ...settings.prosody,
        [property]: value,
      },
    });
  };

  const handleAutoPlayChange = () => {
    onSettingsChange({
      ...settings,
      autoPlay: !settings.autoPlay,
    });
  };

  return (
    <div className="flex flex-col w-full gap-4 border rounded-lg p-4 bg-card">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Voice Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {voices.map((voice) => (
            <Button
              key={voice.id}
              variant={settings.voice === voice.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleVoiceChange(voice.id)}
              disabled={disabled}
            >
              {voice.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Prosody Settings</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label htmlFor="pitch" className="text-sm">
                Pitch: {Math.round(settings.prosody.pitch * 100)}%
              </label>
              <span className="text-xs text-muted-foreground">
                Higher = more exaggerated
              </span>
            </div>
            <input
              id="pitch"
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={settings.prosody.pitch}
              onChange={(e) => handleProsodyChange("pitch", parseFloat(e.target.value))}
              className="w-full"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label htmlFor="rate" className="text-sm">
                Speed: {Math.round(settings.prosody.rate * 100)}%
              </label>
              <span className="text-xs text-muted-foreground">
                Lower = more drawn out
              </span>
            </div>
            <input
              id="rate"
              type="range"
              min="0.7"
              max="1.2"
              step="0.05"
              value={settings.prosody.rate}
              onChange={(e) => handleProsodyChange("rate", parseFloat(e.target.value))}
              className="w-full"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <label htmlFor="emphasisLevel" className="text-sm">
                Word Emphasis: {settings.prosody.emphasisLevel}/3
              </label>
              <span className="text-xs text-muted-foreground">
                Higher = stronger sarcastic emphasis
              </span>
            </div>
            <input
              id="emphasisLevel"
              type="range"
              min="1"
              max="3"
              step="1"
              value={settings.prosody.emphasisLevel}
              onChange={(e) => handleProsodyChange("emphasisLevel", parseInt(e.target.value))}
              className="w-full"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Switch
            checked={settings.autoPlay}
            onCheckedChange={handleAutoPlayChange}
            disabled={disabled}
          />
          <label className="text-sm cursor-pointer select-none" onClick={handleAutoPlayChange}>
            Auto-play audio
          </label>
        </div>

        <Button
          variant="default"
          onClick={onRegenerate}
          disabled={disabled}
          className="ml-auto"
        >
          Regenerate Audio
        </Button>
      </div>
    </div>
  );
}
