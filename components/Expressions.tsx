"use client";
import { Hume } from "hume";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";
import { motion } from "framer-motion";
import { CSSProperties, useState } from "react";
import * as R from "remeda";
import { SarcasmParameters, defaultSarcasmParameters } from "./SarcasmConfig";

// We'll use this type to safely access emotion keys
type EmotionKey = keyof Hume.empathicVoice.EmotionScores;

// New interface to track sarcasm contributions
interface SarcasmContribution {
  pattern: string;
  score: number;
  explanation: string;
}

export default function Expressions({
  values,
  sarcasmParameters = defaultSarcasmParameters
}: {
  values: Hume.empathicVoice.EmotionScores | undefined;
  sarcasmParameters?: SarcasmParameters;
}) {
  const [showAllEmotions, setShowAllEmotions] = useState(false);
  const [showSarcasmTooltip, setShowSarcasmTooltip] = useState(false);
  
  if (!values) return null;

  // Get thresholds from parameters
  const {
    baseThreshold,
    strongIndicatorThreshold,
    indicatorScoreThreshold,
    misleadingScoreThreshold,
    detectionThreshold
  } = sarcasmParameters.thresholds;

  // Refined sarcasm indicators based on analysis
  const sarcasmIndicators: EmotionKey[] = [
    "amusement",
    "contempt",
    "disappointment",
    "awkwardness",
    "realization",   // Added as they often indicate realizing a contradiction
    "surpriseNegative", // Added as it can indicate unexpected contradiction
    "doubt",        // Added as it signals uncertainty that often appears in sarcasm
    "confusion",    // Added as it can indicate cognitive dissonance in sarcasm
    "anger"         // Added as suppressed anger often appears in passive-aggressive sarcasm
  ];

  // Emotions that might appear high but could be misleading in sarcasm
  const misleadingEmotions: EmotionKey[] = [
    "excitement",
    "joy",
    "satisfaction",
    "pride",
    "interest",     // Added as it can mask sarcastic intent
    "determination", // Added as it can appear in emphatic sarcasm
    "surprisePositive" // Added as it can appear in exaggerated sarcasm
  ];

  // Enhanced sarcasm detection function
  const detectSarcasm = (scores: Hume.empathicVoice.EmotionScores) => {
    // Get scores for sarcasm indicators with a higher threshold
    const indicatorScores = sarcasmIndicators
      .map((key) => scores[key] || 0)
      .filter((score) => score > indicatorScoreThreshold);

    // Get scores for potentially misleading emotions
    const misleadingScores = misleadingEmotions
      .map((key) => scores[key] || 0)
      .filter((score) => score > misleadingScoreThreshold);

    // Calculate base sarcasm score
    let sarcasmScore = 0;
    
    // Track contributions to the sarcasm score
    const contributions: SarcasmContribution[] = [];
    
    // Get all emotions and sort them by score (moved up from below)
    const allEmotions = R.values(scores);
    const sortedScores = allEmotions.sort((a, b) => b - a);

    // Single strong indicator can be enough to establish a base score
    const strongIndicators = sarcasmIndicators
      .map((key) => scores[key] || 0)
      .filter((score) => score > strongIndicatorThreshold);
    
    if (strongIndicators.length > 0 && sarcasmParameters.patternWeights["contemptDetected"].enabled) {
      // Start with a base level of sarcasm if any strong indicator is present
      const baseScore = baseThreshold + (strongIndicators[0] * 0.3);
      sarcasmScore = baseScore;
      
      // Log contribution
      contributions.push({
        pattern: "Strong sarcasm indicator",
        score: baseScore,
        explanation: `Strong presence of sarcasm-related emotions: ${sarcasmIndicators
          .filter(key => (scores[key] || 0) > 0.2)
          .map(key => `${key} (${(scores[key] || 0).toFixed(2)})`)
          .join(', ')}`
      });
    }

    // If we have multiple indicators, enhance the score
    if (indicatorScores.length >= 2) {
      // Base score from indicator emotions
      const indicatorBaseScore = Math.max(
        0,
        indicatorScores.reduce((sum, score) => sum + score, 0) / indicatorScores.length
      );
      
      if (indicatorBaseScore > sarcasmScore) {
        sarcasmScore = indicatorBaseScore;
        
        // Log contribution
        contributions.push({
          pattern: "Multiple sarcasm indicators",
          score: indicatorBaseScore,
          explanation: `Multiple sarcasm-related emotions detected: ${sarcasmIndicators
            .filter(key => (scores[key] || 0) > 0.07)
            .map(key => `${key} (${(scores[key] || 0).toFixed(2)})`)
            .join(', ')}`
        });
      }

      // Specific sarcasm patterns based on configured weights
      if (scores.amusement > 0.2 && scores.contempt > 0.1 && 
          sarcasmParameters.patternWeights["amusementContempt"].enabled) {
        const patternScore = sarcasmParameters.patternWeights["amusementContempt"].weight;
        sarcasmScore += patternScore;
        
        // Log contribution
        contributions.push({
          pattern: "Amusement + Contempt",
          score: patternScore,
          explanation: `Combination of amusement (${(scores.amusement || 0).toFixed(2)}) and contempt (${(scores.contempt || 0).toFixed(2)}), a classic sarcasm pattern`
        });
      }

      if (scores.awkwardness > 0.3 && sarcasmParameters.patternWeights["awkwardness"].enabled) {
        const patternScore = sarcasmParameters.patternWeights["awkwardness"].weight;
        sarcasmScore += patternScore;
        
        // Log contribution
        contributions.push({
          pattern: "Awkwardness",
          score: patternScore,
          explanation: `High awkwardness (${(scores.awkwardness || 0).toFixed(2)}) often signals sarcastic comments`
        });
      }

      // Contradiction pattern: positive and negative emotions
      const indicatorEmotionScores = sarcasmIndicators
        .map((key) => scores[key] || 0)
        .filter((score) => score > 0.1);
      if (misleadingScores.length >= 1 && indicatorEmotionScores.length >= 1 && 
          sarcasmParameters.patternWeights["contrastingEmotions"].enabled) {
        const patternScore = sarcasmParameters.patternWeights["contrastingEmotions"].weight;
        sarcasmScore += patternScore;
        
        // Log contribution
        contributions.push({
          pattern: "Mixed emotions",
          score: patternScore,
          explanation: `Contradictory mix of positive and negative emotions, common in sarcasm`
        });
      }

      // New condition: Multiple high emotions (conflict indicator)
      const numHighEmotions = allEmotions.filter((score) => score > 0.15).length;
      if (numHighEmotions >= 3 && sarcasmParameters.patternWeights["emotionalComplexity"].enabled) {
        const patternScore = sarcasmParameters.patternWeights["emotionalComplexity"].weight;
        sarcasmScore += patternScore;
        
        // Log contribution
        contributions.push({
          pattern: "Emotional complexity",
          score: patternScore,
          explanation: `${numHighEmotions} different emotions detected at significant levels, suggesting complex or mixed intent`
        });
      }

      // New condition: No clear dominant emotion
      if (sortedScores[0] - sortedScores[1] < 0.1 && 
          sarcasmParameters.patternWeights["noDominantEmotion"].enabled) {
        const patternScore = sarcasmParameters.patternWeights["noDominantEmotion"].weight;
        sarcasmScore += patternScore;
        
        // Log contribution
        contributions.push({
          pattern: "No dominant emotion",
          score: patternScore,
          explanation: `No single emotion is clearly dominant, suggesting mixed or masked intent`
        });
      }
    }

    // Additional patterns that might indicate sarcasm even without multiple indicators
    
    // Pattern: High contempt with any other high emotion often signals sarcasm
    if ((scores.contempt || 0) > 0.18 && sarcasmParameters.patternWeights["contemptDetected"].enabled) {
      const patternScore = Math.max(0, sarcasmParameters.patternWeights["contemptDetected"].weight - sarcasmScore);
      if (patternScore > 0) {
        sarcasmScore = Math.max(sarcasmScore, sarcasmParameters.patternWeights["contemptDetected"].weight);
        
        // Log contribution
        contributions.push({
          pattern: "Contempt detected",
          score: patternScore,
          explanation: `Contempt (${(scores.contempt || 0).toFixed(2)}) present, often signals sarcastic intent`
        });
      }
    }
    
    // Pattern: Realization with amusement often indicates catching onto a joke
    if ((scores.realization || 0) > 0.2 && (scores.amusement || 0) > 0.15 && 
        sarcasmParameters.patternWeights["realizationAmusement"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["realizationAmusement"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Realization + Amusement",
        score: patternScore,
        explanation: `Combination of realization (${(scores.realization || 0).toFixed(2)}) and amusement (${(scores.amusement || 0).toFixed(2)}), often indicates recognizing sarcasm`
      });
    }
    
    // Pattern: High determination with misleading emotions can suggest emphatic sarcasm
    if ((scores.determination || 0) > 0.25 && misleadingScores.length > 0 && 
        sarcasmParameters.patternWeights["emphaticSarcasm"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["emphaticSarcasm"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Emphatic sarcasm",
        score: patternScore,
        explanation: `Determination (${(scores.determination || 0).toFixed(2)}) combined with misleading emotions often indicates emphatic sarcasm`
      });
    }
    
    // Pattern: Extremely high excitement or joy can be a sarcasm signal
    // This helps catch cases like "I am so excited. Not"
    if (((scores.excitement || 0) > 0.6 || (scores.joy || 0) > 0.5) && 
        sarcasmParameters.patternWeights["exaggeratedPositive"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["exaggeratedPositive"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Exaggerated positive emotion",
        score: patternScore,
        explanation: `Unusually high ${(scores.excitement || 0) > (scores.joy || 0) ? 'excitement' : 'joy'} (${Math.max((scores.excitement || 0), (scores.joy || 0)).toFixed(2)}) often indicates sarcastic exaggeration`
      });
    }
    
    // Pattern: Anger present alongside positive emotions is often sarcastic
    if ((scores.anger || 0) > 0.15 && 
        ((scores.excitement || 0) > 0.15 || (scores.joy || 0) > 0.15) &&
        sarcasmParameters.patternWeights["angerPositive"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["angerPositive"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Anger + Positive emotion",
        score: patternScore,
        explanation: `Combination of anger (${(scores.anger || 0).toFixed(2)}) with positive emotions, a strong sarcasm indicator`
      });
    }
    
    // Pattern: Very high single emotion with almost no supporting emotions
    // Often indicates exaggerated or fake emotion (sarcastic)
    const dominantEmotionRatio = sortedScores[0] / (sortedScores[1] || 0.01);
    if (sortedScores[0] > 0.4 && dominantEmotionRatio > 3 && 
        sarcasmParameters.patternWeights["exaggeratedSingleEmotion"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["exaggeratedSingleEmotion"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Exaggerated single emotion",
        score: patternScore,
        explanation: `One emotion is much stronger (${dominantEmotionRatio.toFixed(1)}x) than all others, suggesting possible exaggeration`
      });
    }
    
    // Pattern: High single positive emotion with negative undertones
    const hasNegativeUndertones = ['disappointment', 'contempt', 'disgust', 'anger', 'distress']
      .some(emotion => (scores[emotion as EmotionKey] || 0) > 0.10);
    
    if ((scores.excitement || 0) > 0.3 && hasNegativeUndertones && 
        sarcasmParameters.patternWeights["positiveNegativeUndertones"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["positiveNegativeUndertones"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Positive emotion + Negative undertones",
        score: patternScore,
        explanation: `Excitement (${(scores.excitement || 0).toFixed(2)}) with negative undertones, classic sarcasm pattern`
      });
    }
    
    // Pattern: Multiple contrasting emotions present (classic sarcasm signal)
    const positiveEmotions = ['excitement', 'joy', 'pride', 'satisfaction']
      .map(key => scores[key as EmotionKey] || 0)
      .filter(score => score > 0.15);
      
    const negativeEmotions = ['anger', 'disappointment', 'contempt', 'disgust']
      .map(key => scores[key as EmotionKey] || 0)
      .filter(score => score > 0.15);
    
    if (positiveEmotions.length > 0 && negativeEmotions.length > 0 && 
        sarcasmParameters.patternWeights["contrastingEmotions"].enabled) {
      const patternScore = sarcasmParameters.patternWeights["contrastingEmotions"].weight;
      sarcasmScore += patternScore;
      
      // Log contribution
      contributions.push({
        pattern: "Contrasting emotions",
        score: patternScore,
        explanation: `Both positive and negative emotions present simultaneously, a strong indicator of sarcasm`
      });
    }

    return {
      score: Math.min(1, sarcasmScore),
      contributions: contributions.sort((a, b) => b.score - a.score)
    };
  };

  // Calculate sarcasm score and determine if it should be displayed
  const sarcasmResult = detectSarcasm(values);
  const sarcasmScore = sarcasmResult.score;
  const sarcasmContributions = sarcasmResult.contributions;
  const hasSarcasmIndicators = sarcasmScore > detectionThreshold;

  // Get sorted emotions for display
  const sortedEmotions = R.pipe(
    values,
    R.entries(),
    R.sortBy(([_, value]) => -value),
  );

  // Group emotions into categories based on thresholds
  const primaryEmotions = sortedEmotions.filter(([_, value]) => value >= 0.3);
  const secondaryEmotions = sortedEmotions.filter(([_, value]) => value >= 0.15 && value < 0.3);
  const minorEmotions = sortedEmotions.filter(([_, value]) => value < 0.15);

  // Decide which emotions to display
  const visibleEmotions = showAllEmotions 
    ? sortedEmotions 
    : [...primaryEmotions, ...secondaryEmotions.slice(0, 3)];

  // Determine if we need a "show more" button
  const hasHiddenEmotions = !showAllEmotions && (secondaryEmotions.length > 3 || minorEmotions.length > 0);

  return (
    <div className="text-xs p-3 w-full border-t border-border flex flex-col gap-3">
      {/* Sarcasm indicator display - now more prominent if detected */}
      {hasSarcasmIndicators && (
        <div
          className="w-full overflow-visible mb-1 p-3 rounded-md relative cursor-pointer"
          style={{ background: "rgba(158, 68, 196, 0.15)" }}
          onMouseEnter={() => setShowSarcasmTooltip(true)}
          onMouseLeave={() => setShowSarcasmTooltip(false)}
        >
          <div className="flex items-center justify-between gap-1 font-mono pb-2">
            <div className="font-bold text-sm flex items-center gap-1">
              Sarcasm Detected 👀
              <span className="opacity-50 text-xs font-normal">(hover for details)</span>
            </div>
            <div className="tabular-nums text-sm font-semibold">
              {(sarcasmScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="relative h-2">
            <div className="absolute top-0 left-0 size-full rounded-full opacity-10 bg-[#9e44c4]" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#9e44c4] rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, sarcasmScore * 100)}%`,
              }}
            />
          </div>
          
          {/* Tooltip for sarcasm details - fixed positioning and z-index */}
          {showSarcasmTooltip && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-black/90 backdrop-blur-sm rounded-md shadow-lg p-3 w-80 text-white/90"
                 style={{ maxWidth: "calc(100vw - 2rem)" }}>
              <h4 className="text-sm font-medium mb-2 pb-1 border-b border-white/20">Sarcasm Detection Factors</h4>
              <div className="max-h-60 overflow-y-auto">
                {sarcasmContributions.map((contribution, index) => (
                  <div key={index} className="mb-2 pb-2 border-b border-white/10 last:border-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{contribution.pattern}</span>
                      <span className="text-xs bg-white/10 px-1 rounded">+{(contribution.score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5">{contribution.explanation}</p>
                  </div>
                ))}
                {sarcasmContributions.length === 0 && (
                  <p className="text-xs opacity-80">No specific pattern dominated the sarcasm detection.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary emotions - displayed more prominently */}
      {primaryEmotions.length > 0 && (
        <div className="mb-2">
          <h3 className="text-xs font-medium mb-2 opacity-70">Primary Emotions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {primaryEmotions.map(([key, value]) => (
              <div 
                key={key} 
                className="overflow-hidden p-2 rounded-md"
                style={{
                  background: isExpressionColor(key) 
                    ? `rgba(${hexToRgb(expressionColors[key])}, 0.1)` 
                    : "rgba(var(--card), 0.8)",
                }}
              >
                <div className="flex items-center justify-between gap-1 font-mono pb-1">
                  <div className="font-medium truncate text-sm">
                    {key}
                    {sarcasmIndicators.includes(key as EmotionKey) && hasSarcasmIndicators && " ✓"}
                  </div>
                  <div className="tabular-nums opacity-70 font-semibold">{value.toFixed(2)}</div>
                </div>
                <div
                  className="relative h-2"
                  style={
                    {
                      "--bg": isExpressionColor(key)
                        ? expressionColors[key]
                        : "var(--bg)",
                    } as CSSProperties
                  }
                >
                  <div
                    className="absolute top-0 left-0 size-full rounded-full opacity-10 bg-[var(--bg)]"
                  />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-[var(--bg)] rounded-full"
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
        </div>
      )}

      {/* Secondary and minor emotions - less prominence */}
      {visibleEmotions.length > primaryEmotions.length && (
        <div>
          <h3 className="text-xs font-medium mb-2 opacity-70">Other Emotions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {visibleEmotions.slice(primaryEmotions.length).map(([key, value]) => (
              <div key={key} className="overflow-hidden">
                <div className="flex items-center justify-between gap-1 font-mono pb-1">
                  <div className="font-medium truncate">
                    {key}
                    {sarcasmIndicators.includes(key as EmotionKey) && hasSarcasmIndicators && " ✓"}
                  </div>
                  <div className="tabular-nums opacity-50">{value.toFixed(2)}</div>
                </div>
                <div
                  className="relative h-1"
                  style={
                    {
                      "--bg": isExpressionColor(key)
                        ? expressionColors[key]
                        : "var(--bg)",
                    } as CSSProperties
                  }
                >
                  <div
                    className="absolute top-0 left-0 size-full rounded-full opacity-10 bg-[var(--bg)]"
                  />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-[var(--bg)] rounded-full"
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
        </div>
      )}

      {/* Show more/less toggle button */}
      {hasHiddenEmotions && (
        <button 
          onClick={() => setShowAllEmotions(!showAllEmotions)}
          className="text-xs self-center mt-1 px-3 py-1 bg-opacity-10 rounded-md hover:bg-opacity-20 transition-colors border"
        >
          {showAllEmotions ? "Show fewer emotions" : `Show all emotions (${sortedEmotions.length})`}
        </button>
      )}
    </div>
  );
}

// Helper function to convert hex color codes to RGB for transparency support
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "255, 255, 255";
}