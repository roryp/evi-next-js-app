"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import SarcasmConfig, { SarcasmParameters, defaultSarcasmParameters } from "./SarcasmConfig";
import { ComponentRef, useRef, useState, createContext } from "react";

// Create a context to share sarcasm parameters across components
export const SarcasmParametersContext = createContext<{
  parameters: SarcasmParameters;
  updateParameters: (params: SarcasmParameters) => void;
}>({
  parameters: defaultSarcasmParameters,
  updateParameters: () => {},
});

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);
  const [sarcasmParameters, setSarcasmParameters] = useState<SarcasmParameters>(defaultSarcasmParameters);

  return (
    <SarcasmParametersContext.Provider 
      value={{ 
        parameters: sarcasmParameters, 
        updateParameters: setSarcasmParameters 
      }}
    >
      <div
        className={
          "relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]"
        }
      >
        <div className="z-10 px-4 py-2 bg-background/80 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto">
            <SarcasmConfig 
              parameters={sarcasmParameters} 
              onChange={setSarcasmParameters} 
            />
          </div>
        </div>

        <VoiceProvider
          auth={{ type: "accessToken", value: accessToken }}
          onMessage={() => {
            if (timeout.current) {
              window.clearTimeout(timeout.current);
            }

            timeout.current = window.setTimeout(() => {
              if (ref.current) {
                const scrollHeight = ref.current.scrollHeight;

                ref.current.scrollTo({
                  top: scrollHeight,
                  behavior: "smooth",
                });
              }
            }, 200);
          }}
        >
          <Messages ref={ref} />
          <Controls />
          <StartCall />
        </VoiceProvider>
      </div>
    </SarcasmParametersContext.Provider>
  );
}
