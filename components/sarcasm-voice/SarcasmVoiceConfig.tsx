"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export interface SarcasmVoiceSettings {
  voice: string;
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
