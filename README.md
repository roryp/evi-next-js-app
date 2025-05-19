# Hear the Hidden: AI-Powered Sarcasm Detection

## Introduction

Sarcasm is a fundamental aspect of human communication that conveys complex emotional states. Yet, for many individuals—particularly those with neurodivergent conditions—detecting sarcasm can be a significant barrier to meaningful interaction.

This project bridges that gap by leveraging AI technology to detect sarcastic speech patterns through emotion analysis, creating more inclusive communication environments for everyone.

## Overview

This application includes several AI-powered sarcasm features:

1. **Sarcasm Detection**: A sophisticated system that analyzes text, facial expressions, and voice to detect even subtle forms of sarcasm with high accuracy.

2. **Sarcasm Creator**: A text generator that crafts sarcastic responses based on input text, with customizable sarcasm styles and tone settings.

3. **Sarcasm Voice Generator**: A text-to-speech feature that converts text into spoken audio with sarcastic intonation, using customizable voice options.

> **Note**: The Voice Chat feature has been hidden as the application has transitioned to focus on LLM-based solutions rather than Hume's Empathic Voice Interface.

## Sequence Diagrams

Each main feature has a corresponding sequence diagram that illustrates the data flow and component interactions:

- [Sarcasm Detector](./diagrams/images/Sarcasm%20Detector%20Sequence.png)
- [Sarcasm Creator](./diagrams/images/Sarcasm%20Creator%20Sequence.png)
- [Sarcasm Voice Generator](./diagrams/images/Sarcasm%20Voice%20Sequence.png)

## Key Features

### Standalone Sarcasm Detector

The application includes a dedicated Sarcasm Detector feature that can analyze:

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
- **Contextual understanding**: The analysis considers the full context of the text, detecting contradictions that might indicate sarcasm
- **Detailed sarcasm explanation**: When sarcasm is detected, the system provides a thorough explanation of the linguistic patterns identified

#### Facial Expression Analysis

The facial sarcasm detection feature analyzes visual cues associated with sarcastic expressions:

- **Real-time webcam integration**: Capture facial expressions directly through your browser
- **Snapshot capability**: Take and analyze still images of facial expressions
- **Analysis report**: Provides a detailed breakdown of detected facial cues and their connection to sarcastic intent
- **Privacy-focused**: All processing happens on your device with secure API calls (no images are stored)

#### Voice Sarcasm Analysis

The voice analysis component provides advanced prosodic analysis to detect sarcasm in speech:

- **High-quality audio recording**: Records voice with optimized settings for sarcasm detection
- **Prosody analysis**: Analyzes key speech features including pitch contour, volume patterns, and word flow
- **Combined text-audio analysis**: The system transcribes speech and analyzes both the text content and vocal delivery

### Sarcasm Creator Feature

The application includes a Sarcasm Creator feature that allows users to generate sarcastic responses based on input text. This feature leverages advanced natural language processing models to craft responses that mimic human sarcasm.

[View Sarcasm Creator Sequence Diagram](./diagrams/images/Sarcasm%20Creator%20Sequence.png)

#### Customizable Sarcasm Generation Parameters

The Sarcasm Creator includes a comprehensive configuration system for fine-tuning the generation:

- **Sarcasm style customization**: Various sarcastic styles can be enabled/disabled and adjusted
- **Available styles include**: Exaggeration, Fake Enthusiasm, Mocking Repetition, Ironic Understatement, Rhetorical Questions, and more
- **Tone settings adjustment**: Control various aspects of the sarcastic tone (intensity, humor, harshness, subtlety)

### Sarcasm Voice Generator

The application includes a Sarcasm Voice Generator feature that transforms text into spoken sarcastic audio.

[View Sarcasm Voice Sequence Diagram](./diagrams/images/Sarcasm%20Voice%20Sequence.png)

#### Voice Customization Options

The Sarcasm Voice Generator offers several customization options:

- **Voice Selection**: Choose from multiple voice options with different characteristics
- **Auto-Play**: Toggle automatic playback of newly generated audio

## Required API Keys

Before running the application, you need to create the following files in the root directory:

1. `openai_api_key.txt`:
   - Create this file and paste your OpenAI API key
   - Required for all sarcasm detection and generation features

2. `hume_api_key.txt` and `hume_secret_key.txt`:
   - These files contain Hume API credentials
   - Required for certain emotion analysis features (though Voice Chat is now hidden)

Alternatively, you can set these as environment variables in a `.env.local` file:

```
OPENAI_API_KEY=your_openai_api_key_here
HUME_API_KEY=your_hume_api_key_here
HUME_SECRET_KEY=your_hume_secret_key_here
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [pnpm](https://pnpm.io/) package manager
- An OpenAI API key (for all sarcasm functionalities)

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
   OPENAI_API_KEY=your_openai_api_key_here
   HUME_API_KEY=your_hume_api_key_here
   HUME_SECRET_KEY=your_hume_secret_key_here
   ```

   Alternatively, create the following files in the root directory:
   - `openai_api_key.txt`: Paste your OpenAI API key
   - `hume_api_key.txt`: Paste your Hume API key
   - `hume_secret_key.txt`: Paste your Hume secret key

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

To run the production server:

```bash
pnpm start
```

### Docker Deployment

To build and run the Docker image locally:

```bash
# Build Docker Image
docker build \
  --secret id=openai_key,src=openai_api_key.txt \
  --secret id=hume_key,src=hume_api_key.txt \
  --secret id=hume_secret,src=hume_secret_key.txt \
  -t sarcasm-app .

# Run Docker Container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY="$(cat openai_api_key.txt)" \
  -e HUME_API_KEY="$(cat hume_api_key.txt)" \
  -e HUME_SECRET_KEY="$(cat hume_secret_key.txt)" \
  sarcasm-app
```

### Azure Deployment

To deploy this application to Azure Container Apps:

```bash
./deploy-to-azure.sh
```
