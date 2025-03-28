# Hear the hidden; disarm sarcasm

🟢 I'm so glad we picked the 🔵 perfect day for a picnic — 🟣 just like you said, 🔴 no chance of rain!

🔍 Breakdown:

🟢 "I'm so glad"
→ Presupposes genuine happiness, but sarcasm flips it.
🔵 "perfect day for a picnic"
→ Presupposes the weather is ideal — clearly, it's not.
🟣 "just like you said"
→ Presupposes someone confidently said this would happen.
🔴 "no chance of rain"
→ Presupposes a dry day. It's raining. Hard. Irony activated.

## Overview

This application includes a sophisticated sarcasm detection feature that analyzes emotional signals from Hume's Empathic Voice Interface. The algorithm has been enhanced to detect even subtle forms of sarcasm with high accuracy.

### How It Works

The sarcasm detection system operates by:

1. **Identifying key sarcasm indicators**: The algorithm looks for specific emotions that often indicate sarcasm, including:
   - Amusement
   - Contempt
   - Disappointment
   - Awkwardness
   - Realization
   - Surprise (negative)
   - Doubt
   - Confusion
   - Anger

2. **Analyzing misleading emotions**: It evaluates potentially misleading emotions that might appear high during sarcastic speech:
   - Excitement
   - Joy
   - Satisfaction
   - Pride
   - Interest
   - Determination
   - Surprise (positive)

3. **Pattern recognition**: The system looks for specific patterns associated with sarcasm:
   - Amusement combined with contempt
   - Exaggerated positive emotions (very high excitement/joy)
   - Positive emotions with negative undertones
   - Multiple contrasting emotions present simultaneously
   - Anger alongside positive emotions
   - High single emotion with very few supporting emotions

4. **Contextual analysis**: The algorithm considers the emotional complexity and contradictions:
   - Multiple high emotions indicating complexity
   - Lack of dominant emotion
   - Contradiction between positive and negative emotions

5. **Threshold application**: Sarcasm is reported to the user when the computed score exceeds a threshold value.

### Interactive Tooltip

The sarcasm detection feature includes an interactive tooltip that provides detailed information about detected sarcasm:

- **Hover functionality**: Users can hover over the sarcasm indicator to see what factors contributed to the sarcasm detection
- **Contribution breakdown**: The tooltip displays specific patterns that were detected, how much each contributed to the overall score, and detailed explanations of why each pattern suggests sarcasm
- **Visual indicators**: Emotions that contributed to sarcasm detection are marked with a checkmark (✓) in the emotion display

### Customizable Sarcasm Parameters

The application includes a comprehensive sarcasm configuration system that allows fine-tuning of the sarcasm detection algorithm:

- **Pattern weight customization**: Each sarcasm detection pattern can be:
  - Enabled or disabled based on user preference
  - Adjusted for sensitivity with custom weight values
  - Reviewed through detailed descriptions explaining the pattern's significance

- **Threshold adjustments**: Users can modify key thresholds including:
  - Detection threshold (minimum score required to report sarcasm)
  - Strong indicator threshold (sensitivity for individual emotion signals)
  - Base indicator thresholds for different emotion categories

- **Real-time updates**: Configuration changes take effect immediately across the application
  - Parameters are shared via React Context to ensure consistent detection
  - The Messages component receives updated parameters automatically

- **Reset functionality**: Users can easily restore default parameter values

### Context Integration

The sarcasm configuration is seamlessly integrated with the Messages component:

- **Context-aware emotion analysis**: The Messages component accesses sarcasm parameters via React Context
- **Per-message application**: Each message independently evaluates sarcasm using the current parameters
- **Consistent UI experience**: Parameter changes affect all displayed messages consistently
- **Efficient rendering**: Only relevant components re-render when parameters change

### Sarcasm Detection Table

The following table showcases some key emotions and patterns evaluated by the sarcasm detection system:

| Pattern | Impact | Description |
|---------|--------|-------------|
| Amusement + Contempt | High | A classic sarcasm pattern combining humor with disdain |
| Exaggerated positive emotion | High | Unusually high excitement/joy that may indicate sarcastic exaggeration |
| Contrasting emotions | Very High | Simultaneous positive and negative emotions, a strong indicator of sarcasm |
| Anger + Positive emotion | High | Combination signals passive-aggressive sarcasm |
| Positive emotion + Negative undertones
