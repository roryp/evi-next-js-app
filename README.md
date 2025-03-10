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
| Positive emotion + Negative undertones | Very High | Excitement with underlying negative emotions is a classic sarcasm pattern |
| Multiple sarcasm indicators | Medium | Multiple sarcasm-related emotions detected simultaneously |
| No dominant emotion | Low | Lack of clear emotional signals may suggest mixed or masked intent |

This enhanced algorithm provides real-time feedback on potential sarcasm detection, helping the EVI understand nuanced emotional contexts in conversations. The tooltip functionality adds transparency, allowing users to understand why certain statements were flagged as potentially sarcastic.

### Standalone Sarcasm Detector

In addition to the integrated sarcasm detection within the Empathic Voice Interface, this application includes a dedicated Sarcasm Detector feature that can analyze:

- **Text input**: Detect sarcasm in written text through advanced natural language processing
- **Facial expressions**: Analyze images captured from your webcam to identify facial cues associated with sarcasm
- **Voice recordings**: Detect sarcasm in spoken language by analyzing speech patterns and transcribed content

The standalone Sarcasm Detector offers:

- An intuitive tabbed interface for different analysis methods
- Real-time capture from webcam and microphone
- Detailed analysis reports that explain detected sarcastic elements
- Integration with OpenAI's advanced language and vision models

To use the Sarcasm Detector:

1. Navigate to the "Sarcasm Detector" page using the navigation bar
2. Select your preferred analysis method (text, webcam, or audio)
3. Follow the instructions to provide input for analysis
4. Review the detailed sarcasm analysis report

**Note:** The Sarcasm Detector requires an OpenAI API key. Add this to your `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Sarcasm Creator Feature

The application now includes a Sarcasm Creator feature that allows users to generate sarcastic responses based on input text. This feature leverages advanced natural language processing models to craft responses that mimic human sarcasm.

#### How to Use the Sarcasm Creator

1. Navigate to the "Sarcasm Creator" page using the navigation bar.
2. Enter the text for which you want to generate a sarcastic response.
3. Click the "Generate Sarcasm" button.
4. Review the generated sarcastic response displayed on the page.

The Sarcasm Creator provides a fun and interactive way to explore the nuances of sarcastic language. It can be used for entertainment, educational purposes, or to enhance conversational AI systems.

**Note:** The Sarcasm Creator requires an OpenAI API key. Ensure that this is added to your `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [pnpm](https://pnpm.io/) package manager
- A Hume API key (for access to the Empathic Voice Interface)
- An OpenAI API key (for the Sarcasm Detector functionality)

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd evi-next-js-app-router
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your API keys:
   ```
   HUME_API_KEY=your_hume_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Development

To start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

To create a production build:

```bash
pnpm build
```

### Running in Production Mode

This application contains API routes that require a server runtime to function properly. To run the application in production mode:

1. Make sure the `next.config.js` file does NOT contain `output: 'export'`:
   ```javascript
   module.exports = {
     basePath: '',
     assetPrefix: '',
     // other configurations...
   };
   ```

2. Run the production server:
   ```bash
   pnpm start
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000) by default.

> **Important**: If you want to deploy this app as a static export (e.g., to GitHub Pages), note that the API routes (including sarcasm detection features) will not work as they require a server. In that case, you would need to modify the application to use client-side API calls or a separate backend service.

### Troubleshooting

- **API routes not working in production**: Ensure that `output: 'export'` is removed from `next.config.js` to support API routes.
- **OpenAI API errors**: Verify that your OpenAI API key is correctly set in the `.env.local` file and that you have sufficient quota for API calls.
- **Type errors related to response handling**: The application uses proper null checks when handling API responses to prevent TypeScript errors.
