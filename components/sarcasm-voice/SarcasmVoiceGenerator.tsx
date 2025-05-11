"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SarcasmVoiceConfig, SarcasmVoiceSettings } from "./SarcasmVoiceConfig";

export function SarcasmVoiceGenerator() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [settings, setSettings] = useState<SarcasmVoiceSettings>({
    voice: "alloy",
    autoPlay: true,
    instructions: "Speak in a sarcastic tone.",
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      // Use the input text directly for TTS
      setGeneratedText(inputText);
      
      // Generate TTS using the input text
      const audioResponse = await fetch("/api/sarcastic-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          voiceId: settings.voice,
          instructions: settings.instructions,
        }),
      });

      if (!audioResponse.ok) {
        const errorData = await audioResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to generate audio: ${audioResponse.status} ${audioResponse.statusText}${
            errorData.details ? ` - ${errorData.details}` : ''
          }`
        );
      }

      const audioData = await audioResponse.json();
      setAudioUrl(audioData.filePath);

      // Auto-play the audio if enabled
      if (settings.autoPlay) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((e) => {
              console.error("Failed to autoplay audio:", e);
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (generatedText) {
      handleGenerateAudioOnly(generatedText);
    }
  };

  const handleGenerateAudioOnly = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch("/api/sarcastic-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: settings.voice,
          instructions: settings.instructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to regenerate audio: ${response.status} ${response.statusText}${
            errorData.details ? ` - ${errorData.details}` : ''
          }`
        );
      }

      const data = await response.json();
      setAudioUrl(data.filePath);

      // Auto-play the audio if enabled
      if (settings.autoPlay) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((e) => {
              console.error("Failed to autoplay audio:", e);
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">Input Text</h2>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text that you want to convert to speech..."
            className="min-h-24 p-3 border rounded-lg resize-none bg-card"
            disabled={isLoading}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? "Generating..." : "Generate Voice"}
        </Button>
      </form>

      <SarcasmVoiceConfig
        settings={settings}
        onSettingsChange={setSettings}
        onRegenerate={handleRegenerate}
        disabled={isLoading || !generatedText}
      />

      {generatedText && (
        <div className="flex flex-col gap-4 border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold">Your Text</h2>
          <p className="whitespace-pre-wrap">{generatedText}</p>
        </div>
      )}

      {audioUrl && (
        <div className="flex flex-col gap-4 border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold">Generated Audio</h2>
          <audio
            ref={audioRef}
            controls
            src={audioUrl}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground text-center">
            Tip: Download the audio by right-clicking on the player and selecting &quot;Save audio as...&quot;
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-500 p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}
