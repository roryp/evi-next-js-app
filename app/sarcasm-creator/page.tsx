import { SarcasmCreator } from "@/components/sarcasm-creator/SarcasmCreator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sarcasm Creator | GPT-4o",
  description: "Generate sarcastic responses using AI",
};

export default function SarcasmCreatorPage() {
  return (
    <div className="grow flex flex-col">
      <SarcasmCreator />
    </div>
  );
}