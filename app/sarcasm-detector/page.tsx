import { SarcasmDetector } from "@/components/sarcasm-detector/SarcasmDetector";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sarcasm Detector",
  description: "sarcasm in text, facial expressions, and voice using AI",
};

export default function SarcasmDetectorPage() {
  return (
    <div className="grow flex flex-col">
      <SarcasmDetector />
    </div>
  );
}