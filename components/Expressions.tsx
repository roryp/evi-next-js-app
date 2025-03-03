"use client";
import { Hume } from "hume";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { motion } from "framer-motion";
import { CSSProperties } from "react";
import * as R from "remeda";

// We'll use this type to safely access emotion keys
type EmotionKey = keyof Hume.empathicVoice.EmotionScores;

export default function Expressions({
  values,
}: {
  values: Hume.empathicVoice.EmotionScores | undefined;
}) {
  if (!values) return;

  // Define potential sarcasm indicators - these emotions often combine to indicate sarcasm
  // Using only valid emotion keys that might indicate sarcasm
  const sarcasmIndicators: EmotionKey[] = [
    "amusement", 
    "contempt", 
    "confusion", 
    "disappointment", 
    "doubt",
    "awkwardness"
  ];
  
  // Emotions that often appear high in sarcastic responses but are misleading
  const misleadingEmotions: EmotionKey[] = [
    "excitement",
    "joy",
    "satisfaction",
    "pride"
  ];
  
  // Get sarcasm score by analyzing certain emotions that might indicate sarcasm
  const detectSarcasm = (scores: Hume.empathicVoice.EmotionScores) => {
    // Get scores for the main sarcasm indicators
    const indicatorScores = sarcasmIndicators
      .map(key => scores[key] || 0)
      .filter(score => score > 0.1);
      
    // Get scores for potentially misleading emotions
    const misleadingScores = misleadingEmotions
      .map(key => scores[key] || 0)
      .filter(score => score > 0.2);
    
    // Calculate sarcasm base score from indicators
    let sarcasmScore = 0;
    
    if (indicatorScores.length >= 2) {
      // Base score from indicator emotions
      sarcasmScore = indicatorScores.reduce((sum, score) => sum + score, 0) / indicatorScores.length;
      
      // Check for special patterns that strongly indicate sarcasm
      if (scores.amusement > 0.1 && scores.contempt > 0.08) {
        sarcasmScore += 0.2; // Amusement + contempt is a strong sarcasm signal
      }
      
      if (scores.awkwardness > 0.3) {
        sarcasmScore += 0.15; // High awkwardness often indicates sarcasm
      }
      
      // Detect contradiction patterns (high positive and negative emotions together)
      if (misleadingScores.length >= 2 && indicatorScores.length >= 1) {
        sarcasmScore += 0.25; // Contradiction pattern detected
      }
    }
    
    return Math.min(1, sarcasmScore);
  };
  
  // Check if there's a strong sarcasm indicator pattern
  const sarcasmScore = detectSarcasm(values);
  const hasSarcasmIndicators = sarcasmScore > 0.25; // Lowered threshold to catch more potential sarcasm

  // Get sorted emotions with optional sarcasm indicator added
  const baseEmotions = R.pipe(
    values,
    R.entries(),
    R.sortBy(([_, value]) => -value), 
  );

  return (
    <div
      className={
        "text-xs p-3 w-full border-t border-border flex flex-col md:flex-row flex-wrap gap-3"
      }
    >
      {/* Special sarcasm indicator if we detect it */}
      {hasSarcasmIndicators && (
        <div 
          className={"w-full overflow-hidden mb-1"}
          style={{ background: 'rgba(158, 68, 196, 0.1)', padding: '4px', borderRadius: '4px' }}
        >
          <div className={"flex items-center justify-between gap-1 font-mono pb-1"}>
            <div className={"font-medium truncate font-bold"}>
              Sarcasm Detected 👀
            </div>
            <div className={"tabular-nums opacity-50"}>{sarcasmScore.toFixed(2)}</div>
          </div>
          <div className={"relative h-1"}>
            <div className={"absolute top-0 left-0 size-full rounded-full opacity-10 bg-[#9e44c4]"}/>
            <motion.div
              className={"absolute top-0 left-0 h-full bg-[#9e44c4] rounded-full"}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, sarcasmScore * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Standard emotions display */}
      {baseEmotions.map(([key, value]) => (
        <div key={key} className={"w-full md:w-[calc(33%-0.75rem)] overflow-hidden"}>
          <div className={"flex items-center justify-between gap-1 font-mono pb-1"}>
            <div className={"font-medium truncate"}>
              {key}
              {sarcasmIndicators.includes(key as EmotionKey) && hasSarcasmIndicators && ' ✓'}
            </div>
            <div className={"tabular-nums opacity-50"}>{value.toFixed(2)}</div>
          </div>
          <div
            className={"relative h-1"}
            style={
              {
                "--bg": isExpressionColor(key)
                  ? expressionColors[key]
                  : "var(--bg)",
              } as CSSProperties
            }
          >
            <div
              className={
                "absolute top-0 left-0 size-full rounded-full opacity-10 bg-[var(--bg)]"
              }
            />
            <motion.div
              className={
                "absolute top-0 left-0 h-full bg-[var(--bg)] rounded-full"
              }
              initial={{ width: 0 }}
              animate={{
                width: `${R.pipe(
                  value,
                  R.clamp({ min: 0, max: 1 }),
                  (value) => `${value * 100}%`,
                )}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
