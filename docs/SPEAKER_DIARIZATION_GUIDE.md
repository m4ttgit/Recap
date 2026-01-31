# Speaker Diarization Integration Guide

## Overview

This guide explains how the Meeting Transcriber app integrates speaker diarization capabilities using pyannote.audio.

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Port 3000)   │
└────────┬────────┘
         │
         │ 1. Upload Audio
         │ 2. Enable Diarization
         ▼
┌─────────────────┐
│  /api/transcribe│
│   Next.js API   │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────┐    ┌──────────────────┐
│   z-ai-web  │    │ Diarization      │
│   -dev-sdk  │    │ Service (Python) │
│   (ASR)     │    │ (Port 3002)      │
└─────────────┘    └──────────────────┘
         │                  │
         │                  │
         └────────┬─────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Merge Results │
         │ (Text+Speakers)│
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Frontend     │
         │   Display      │
         └────────────────┘
```

## Components

### 1. Diarization Service (Python)

**Location**: `mini-services/diarization-service/`

**Tech Stack**:
- FastAPI (Web framework)
- pyannote.audio (Speaker diarization)
- PyTorch (ML framework)
- HuggingFace (Model hosting)

**Key Features**:
- Speaker segmentation and labeling
- Timestamp extraction
- Multi-speaker detection
- REST API endpoints

### 2. Next.js Transcription API

**Location**: `src/app/api/transcribe/route.ts`

**Changes Made**:
- Added diarization service integration
- Merges transcription text with speaker segments
- Handles both diarization enabled/disabled modes
- Returns structured speaker-labeled output

### 3. Frontend UI

**Location**: `src/app/page.tsx`

**New Features**:
- Toggle switch for speaker diarization
- Speaker-labeled transcription display
- Visual speaker badges with timestamps
- Speaker count indicator

## Setup Instructions

### Step 1: Install Diarization Service

Navigate to the diarization service directory:
```bash
cd mini-services/diarization-service
```

Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

### Step 2: Get HuggingFace Token

1. Visit https://hf.co/settings/tokens
2. Create a new access token
3. Visit https://huggingface.co/pyannote/speaker-diarization-3.1
4. Accept the user conditions
5. Set environment variable:
   ```bash
   export HUGGINGFACE_TOKEN=your_token_here
   ```

### Step 3: Start Diarization Service

```bash
cd /home/z/my-project/mini-services/diarization-service
bun run dev
```

Or with Python directly:
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 3002 --reload
```

The service will be available at: `http://localhost:3002`

### Step 4: Verify Service is Running

```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "pipeline_loaded": true
}
```

## Usage

### From the UI

1. Upload an audio file
2. Toggle "Speaker Diarization" switch ON
3. Click "Transcribe Audio"
4. Wait for processing
5. View speaker-labeled transcription

### API Usage

Enable diarization in the API request:
```javascript
const formData = new FormData()
formData.append('audio', audioFile)
formData.append('enableDiarization', 'true') // Enable diarization

const response = await fetch('/api/transcribe', {
  method: 'POST',
  body: formData
})
```

### Response Format

```json
{
  "success": true,
  "transcription": "Full transcription text...",
  "wordCount": 150,
  "processingTime": 5234,
  "diarization": {
    "enabled": true,
    "speakerCount": 3,
    "totalDuration": 45.2,
    "segments": [
      {
        "text": "Hello everyone, let's begin the meeting.",
        "speaker": "SPEAKER_00",
        "start": 0.5,
        "end": 2.8
      },
      {
        "text": "Thanks for joining. Today we'll discuss the project timeline.",
        "speaker": "SPEAKER_01",
        "start": 3.2,
        "end": 6.5
      }
    ]
  }
}
```

## How It Works

### Diarization Process

1. **Audio Segmentation**: The audio is divided into short segments
2. **Speaker Embedding**: Each segment is converted to a speaker embedding
3. **Clustering**: Similar embeddings are clustered together
4. **Labeling**: Each cluster is assigned a speaker label
5. **Refinement**: Overlapping speech and silence are handled

### Merging with Transcription

The app uses a simple approach to merge transcription with diarization:

1. Split transcription into sentences
2. Match sentences to diarization time segments
3. Assign speaker labels to each sentence
4. Return structured speaker-labeled output

**Note**: For production use, consider using word-level timestamps from the ASR model for more accurate alignment.

## Limitations and Considerations

### Current Limitations

1. **Sentence-level alignment**: Current implementation aligns at sentence level, not word level
2. **Processing time**: Diarization adds additional processing time
3. **HuggingFace dependency**: Requires HuggingFace token and model access
4. **Audio quality**: Dependent on audio quality and speaker separation

### Best Practices

1. **Audio Quality**:
   - Use clear, noise-free audio
   - Mono audio format preferred
   - Sample rate: 16kHz or higher
   - Minimal background noise

2. **Speaker Characteristics**:
   - Distinct voice characteristics help
   - Avoid overlapping speech when possible
   - Consistent speaking pace

3. **File Size**:
   - Diarization service may struggle with very long files
   - Consider splitting files longer than 1 hour

## Troubleshooting

### Issue: Diarization service not responding

**Solution**:
- Check if the diarization service is running: `curl http://localhost:3002/health`
- Verify port 3002 is not in use by another service
- Check service logs for errors

### Issue: "Failed to load pipeline" error

**Solution**:
- Verify HUGGINGFACE_TOKEN is set
- Ensure you've accepted user conditions at HuggingFace
- Check internet connection (models downloaded on first run)

### Issue: Poor speaker separation

**Solution**:
- Improve audio quality
- Reduce background noise
- Ensure speakers are clearly distinguishable
- Try different audio formats (WAV recommended)

### Issue: CUDA out of memory

**Solution**:
- Service will fall back to CPU automatically
- For GPU, reduce batch size or use smaller model
- Process audio in chunks for very long files

## Future Improvements

1. **Word-level alignment**: Use word-level timestamps from ASR model
2. **Speaker identification**: Add capability to identify specific speakers by name
3. **Real-time diarization**: Support for streaming audio
4. **Custom models**: Support for fine-tuned diarization models
5. **Performance optimization**: Improve processing speed for long files

## NVIDIA Canary-Qwen-2.5b Integration

### Current Status

The app currently uses the z-ai-web-dev-sdk's built-in ASR model for transcription.

### About NVIDIA Canary-Qwen-2.5b

- **Model**: NVIDIA NeMo Canary-Qwen-2.5B
- **Type**: Speech recognition model
- **Performance**: 5.63% WER (state-of-the-art as of 2025)
- **Features**:
  - English speech-to-text
  - Punctuation and capitalization
  - ASR mode (transcription only)
  - LLM mode (with reasoning capabilities)
- **License**: CC-BY-4.0

### Integration Notes

To use NVIDIA Canary-Qwen-2.5b:

1. The model needs to be hosted (e.g., via NVIDIA NIM, HuggingFace Inference API)
2. Create a wrapper service similar to the diarization service
3. Update `/api/transcribe` to call the Canary-Qwen-2.5b service
4. Handle model-specific response format

**Note**: This would require additional infrastructure setup and is not currently implemented in the app.

## Support

For issues related to:
- **pyannote.audio**: Visit https://github.com/pyannote/pyannote-audio
- **HuggingFace**: Visit https://huggingface.co/pyannote/speaker-diarization-3.1
- **NVIDIA Canary-Qwen**: Visit https://huggingface.co/nvidia/canary-qwen-2.5b

For issues with the Next.js app integration, please check the app documentation or create an issue in the project repository.
