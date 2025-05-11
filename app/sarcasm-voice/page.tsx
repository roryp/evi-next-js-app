import { Metadata } from "next";
import { SarcasmVoiceGenerator } from "@/components/sarcasm-voice/SarcasmVoiceGenerator";

export const metadata: Metadata = {
  title: "Sarcasm Voice Generator | Sarcasm-as-a-Service",
  description: "Generate sarcastic speech from text using AI models with prosody control",
};

export default function SarcasmVoicePage() {
  return (
    <main className="flex flex-col flex-1 p-4 md:p-6 gap-6">
      <SarcasmVoiceGenerator />
    </main>
  );
}
