# Hear the Hidden: AI-Powered Sarcasm Detection

## Introduction

Sarcasm is a fundamental aspect of human communication that conveys complex emotional states. Yet, for many individuals—particularly those with neurodivergent conditions—detecting sarcasm can be a significant barrier to meaningful interaction.

This project bridges that gap by leveraging AI technology to detect sarcastic speech patterns through emotion analysis, creating more inclusive communication environments for everyone.

## Overview

This application includes several AI-powered sarcasm features:

1. **Sarcasm Detection**: A sophisticated system that analyzes emotional signals from Hume's Empathic Voice Interface to detect even subtle forms of sarcasm with high accuracy.

2. **Sarcasm Creator**: A text generator that crafts sarcastic responses based on input text, with customizable sarcasm styles and tone settings.

3. **Sarcasm Voice Generator**: A text-to-speech feature that converts text into spoken audio with sarcastic intonation, using customizable voice options.

These tools combine to create a comprehensive suite for understanding, creating, and vocalizing sarcastic communication.

## Sequence Diagrams

Each main feature has a corresponding sequence diagram that illustrates the data flow and component interactions:

- [Voice Chat with Sarcasm Detection](./diagrams/images/Voice%20Chat%20Sequence.png)
- [Sarcasm Detector](./diagrams/images/Sarcasm%20Detector%20Sequence.png)
- [Sarcasm Creator](./diagrams/images/Sarcasm%20Creator%20Sequence.png)
- [Sarcasm Voice Generator](./diagrams/images/Sarcasm%20Voice%20Sequence.png)

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

[View Voice Chat Sequence Diagram](./diagrams/images/Voice%20Chat%20Sequence.png)

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

[View Sarcasm Detector Sequence Diagram](./diagrams/images/Sarcasm%20Detector%20Sequence.png)

The standalone Sarcasm Detector offers:

- An intuitive tabbed interface for different analysis methods
- Real-time capture from webcam and microphone
- Detailed analysis reports that explain detected sarcastic elements
- Integration with OpenAI's advanced language and vision models

#### Text Analysis Features

The text analysis capability provides sophisticated sentiment flow detection:

- **Segment-by-segment analysis**: The system breaks down text into natural segments and analyzes each one separately
- **Sentiment visualization**: Each segment is color-coded based on its sentiment (positive, negative, neutral, or sarcastic)
- **Intensity indicators**: The opacity of each color indicates the strength of the detected sentiment
- **Contextual understanding**: The analysis considers the full context of the text, detecting contradictions that might indicate sarcasm
- **Visual sentiment flow**: The color-coded display creates a visual representation of sentiment shifts throughout the text
- **Detailed sarcasm explanation**: When sarcasm is detected, the system provides a thorough explanation of the linguistic patterns identified

#### Facial Expression Analysis

The facial sarcasm detection feature analyzes visual cues associated with sarcastic expressions:

- **Real-time webcam integration**: Capture facial expressions directly through your browser
- **Snapshot capability**: Take and analyze still images of facial expressions
- **Sarcasm indicators detection**: Identifies facial features like smirks, raised eyebrows, eye rolls, and other micro-expressions
- **Analysis report**: Provides a detailed breakdown of detected facial cues and their connection to sarcastic intent
- **Privacy-focused**: All processing happens on your device with secure API calls (no images are stored)

#### Voice Sarcasm Analysis

The voice analysis component provides advanced prosodic analysis to detect sarcasm in speech:

- **High-quality audio recording**: Records voice with optimized settings for sarcasm detection
- **Prosody analysis**: Analyzes key speech features including:
  - Pitch contour (visualized as an orange line)
  - Volume/emphasis patterns (visualized as red bars)
  - Syllable boundaries (marked with yellow lines)
  - Word flow patterns (shown as a gradient flow area)
- **Speech rate measurement**: Calculates syllables per second to detect unusual speaking patterns
- **Pitch variation analysis**: Identifies exaggerated or unusual pitch patterns that may indicate sarcasm
- **Word boundary detection**: Highlights pauses between words that might signal sarcastic emphasis
- **Combined text-audio analysis**: The system transcribes speech and analyzes both the text content and vocal delivery
- **Detailed prosody data**: Technical speech pattern data is available for those interested in the underlying metrics

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

[View Sarcasm Creator Sequence Diagram](./diagrams/images/Sarcasm%20Creator%20Sequence.png)

#### How to Use the Sarcasm Creator

1. Navigate to the "Sarcasm Creator" page using the navigation bar.
2. Enter the text for which you want to generate a sarcastic response.
3. Click the "Generate Sarcasm" button.
4. Review the generated sarcastic response displayed on the page.

#### Customizable Sarcasm Generation Parameters

The Sarcasm Creator includes a comprehensive configuration system for fine-tuning the generation:

- **Sarcasm style customization**: Various sarcastic styles can be:
  - Enabled or disabled based on preference
  - Adjusted for prominence with custom weight values
  - Each style includes a description explaining the sarcastic technique

- **Available styles include**:
  - Exaggeration
  - Fake Enthusiasm 
  - Mocking Repetition
  - Ironic Understatement
  - Rhetorical Questions
  - Fake Compliments
  - Literal Interpretation
  - Absurd Comparison
  - Dramatic Punctuation

- **Tone settings adjustment**: Control various aspects of the sarcastic tone:
  - Intensity (how strong the sarcasm will be)
  - Humor (balance between funny and serious)
  - Harshness (how cutting vs. gentle)
  - Subtlety (how obvious vs. subtle)

- **Real-time parameter updates**: Changes to the configuration take effect immediately when generating new responses

The Sarcasm Creator provides a fun and interactive way to explore the nuances of sarcastic language. It can be used for entertainment, educational purposes, or to enhance conversational AI systems.

**Note:** The Sarcasm Creator requires an OpenAI API key. Ensure that this is added to your `.env.local` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Sarcasm Voice Generator

The application includes a Sarcasm Voice Generator feature that transforms text into spoken sarcastic audio. This feature allows users to hear how their text would sound when spoken with a sarcastic tone.

[View Sarcasm Voice Sequence Diagram](./diagrams/images/Sarcasm%20Voice%20Sequence.png)

#### How to Use the Sarcasm Voice Generator

1. Navigate to the "Sarcasm Voice" page using the navigation bar.
2. Enter the text you want to convert to sarcastic speech.
3. Customize the voice settings using the provided controls.
4. Click the "Generate Voice" button.
5. Listen to the generated audio through the audio player.
6. Download the audio file by right-clicking on the player and selecting "Save audio as..."

#### Voice Customization Options

The Sarcasm Voice Generator offers several customization options:

- **Voice Selection**: Choose from multiple voice options with different characteristics:
  - Alloy (Neutral)
  - Echo (Male)
  - Fable (Female)
  - Onyx (Male)
  - Nova (Female)
  - Shimmer (Female)

- **Auto-Play**: Toggle automatic playback of newly generated audio.

**Note:** This feature requires an OpenAI API key. Ensure that this is added to your `.env.local` file as mentioned in the Required API Keys section.

### Required API Keys

Before running the application, you need to create the following files in the root directory:

1. `openai_api_key.txt`:
   - Create this file and paste your OpenAI API key
   - This is required for sarcasm detection and generation features

2. `hume_api_key.txt`:
   - Create this file and paste your Hume API key
   - Required for emotion analysis features

3. `hume_secret_key.txt`:
   - Create this file and paste your Hume secret key
   - Required for authentication with Hume API

These files are used both in development and when building the Docker container. Alternatively, you can set these as environment variables in a `.env.local` file:

```
OPENAI_API_KEY=your_openai_api_key_here
HUME_API_KEY=your_hume_api_key_here
HUME_SECRET_KEY=your_hume_secret_key_here
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [pnpm](https://pnpm.io/) package manager
- A Hume API key (for access to the Empathic Voice Interface)
- An OpenAI API key (for the Sarcasm Detector functionality)

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd sarcasm-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with your API keys:
   ```
   HUME_API_KEY=your_hume_api_key_here
   HUME_SECRET_KEY=your_hume_secret_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Alternatively, create the following files in the root directory:
   - `hume_api_key.txt`: Paste your Hume API key
   - `hume_secret_key.txt`: Paste your Hume secret key
   - `openai_api_key.txt`: Paste your OpenAI API key

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

This Next.js application is configured with `output: 'standalone'` for optimized production deployment:

1. Build the application:
   ```bash
   pnpm build
   ```

2. Run the production server:
   ```bash
   pnpm start
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000) by default.

### Running the Docker Image Locally

To build and run the Docker image locally, follow these steps:

1. **Build the Docker Image with Docker Secrets (Recommended)**:
   
   The Dockerfile is configured to use Docker secrets for secure handling of API keys:

   ```bash
   # For Linux/macOS
   docker build \
     --secret id=openai_key,src=openai_api_key.txt \
     --secret id=hume_key,src=hume_api_key.txt \
     --secret id=hume_secret,src=hume_secret_key.txt \
     -t sarcasm-app .
   ```

   On Windows PowerShell:
   ```powershell
   docker build `
     --secret id=openai_key,src=openai_api_key.txt `
     --secret id=hume_key,src=hume_api_key.txt `
     --secret id=hume_secret,src=hume_secret_key.txt `
     -t sarcasm-app .
   ```

2. **Run the Docker Container**:

   ```bash
   # For Linux/macOS
   docker run -p 3000:3000 \
     -e OPENAI_API_KEY="$(cat openai_api_key.txt)" \
     -e HUME_API_KEY="$(cat hume_api_key.txt)" \
     -e HUME_SECRET_KEY="$(cat hume_secret_key.txt)" \
     sarcasm-app
   ```

   On Windows PowerShell:
   ```powershell
   docker run -p 3000:3000 `
     -e OPENAI_API_KEY="$(Get-Content openai_api_key.txt)" `
     -e HUME_API_KEY="$(Get-Content hume_api_key.txt)" `
     -e HUME_SECRET_KEY="$(Get-Content hume_secret_key.txt)" `
     sarcasm-app
   ```

   This will start the Docker container and map port 3000 of the container to port 3000 on your local machine. You can then access the application at [http://localhost:3000](http://localhost:3000).

### In Production Environments

For production deployments, instead of using local files, you should use your deployment platform's secret management system:

1. Store your API keys in your cloud provider's secret manager (Azure KeyVault, AWS Secrets Manager, etc.)
2. Inject the secrets at build time using your CI/CD pipeline
3. Configure environment variables for runtime in your deployment configuration

For example, in a GitHub Actions workflow:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image with secrets
        run: |
          echo "${{ secrets.OPENAI_API_KEY }}" > openai_key.txt
          echo "${{ secrets.HUME_API_KEY }}" > hume_key.txt
          echo "${{ secrets.HUME_SECRET_KEY }}" > hume_secret.txt
          
          docker build \
            --secret id=openai_key,src=openai_key.txt \
            --secret id=hume_key,src=hume_key.txt \
            --secret id=hume_secret,src=hume_secret.txt \
            -t myapp:latest .
            
          # Clean up temporary files
          rm openai_key.txt hume_key.txt hume_secret.txt
```

### Azure Deployment

To deploy this application to Azure Container Apps, follow these steps:

1. **Build and Push Docker Image**:
   - Open a terminal and navigate to the project directory.
   - Run the following command to build and push the Docker image to Azure Container Registry (ACR):
     ```bash
     ./deploy-to-azure.sh
     ```
   - For Windows users, use the PowerShell script:
     ```powershell
     ./deploy-to-azure.ps1
     ```

2. **Access Your Application**:
   - After the deployment script completes, your application will be available at the URL provided in the script output.
   - The URL will be in the format: `https://<CONTAINER_APP_NAME>.<defaultDomain>`

### Prerequisites for Azure Deployment

- Ensure you have the Azure CLI installed and logged in.
- Customize the variables in the deployment script (`deploy-to-azure.sh` or `deploy-to-azure.ps1`) as needed.
- Make sure your Azure subscription has the necessary permissions to create resources like Container Registry and Container Apps.

### Troubleshooting

- **API routes not working in production**: Ensure that your Next.js configuration is properly set for API routes.
- **OpenAI API errors**: Verify that your OpenAI API key is correctly set and that you have sufficient quota for API calls.
- **Docker build errors**: Make sure your secret files exist in the root directory with the correct permissions.
- **Node.js version issues**: This application uses Next.js 14.2.3 which works best with Node.js v18+.
