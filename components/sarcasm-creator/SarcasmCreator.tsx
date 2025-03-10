"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import SarcasmCreatorConfig, { SarcasmCreatorParameters, defaultSarcasmCreatorParameters } from "@/components/sarcasm-creator/SarcasmCreatorConfig";

export function SarcasmCreator() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [parameters, setParameters] = useState<SarcasmCreatorParameters>(defaultSarcasmCreatorParameters);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to auto-resize the textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Generate sarcastic response
  const generateResponse = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setOutput("");

    try {
      const response = await fetch('/api/generate-sarcasm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          parameters: parameters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate sarcastic response');
      }

      const data = await response.json();
      setOutput(data.response);
    } catch (error) {
      console.error('Error generating sarcastic response:', error);
      setOutput("Sorry, I couldn't generate a sarcastic response at this time. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Sarcasm Creator</h1>
      
      <div className="mb-6">
        <SarcasmCreatorConfig 
          parameters={parameters} 
          onChange={(newParams: SarcasmCreatorParameters) => setParameters(newParams)} 
        />
      </div>

      <div className="p-4 border border-border rounded-lg">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Input Text</h3>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResizeTextarea();
            }}
            placeholder="Enter text to make sarcastic..."
            className="w-full min-h-[120px] p-3 border border-input rounded-md bg-background"
            onFocus={autoResizeTextarea}
          />
        </div>

        <div className="flex justify-center mb-6">
          <Button 
            onClick={generateResponse}
            disabled={!input.trim() || isGenerating}
            className="w-48"
          >
            {isGenerating ? 'Generating...' : 'Generate Sarcasm'}
          </Button>
        </div>

        {isGenerating && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-muted-foreground">Thinking sarcastically...</p>
          </div>
        )}

        {output && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Sarcastic Response</h3>
            <div className="p-4 border border-border rounded-lg bg-card">
              <p className="whitespace-pre-wrap">{output}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}