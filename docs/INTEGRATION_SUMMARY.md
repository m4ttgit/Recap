# Speaker Diarization & Advanced ASR Integration - Summary

## Overview

This document summarizes the integration of speaker diarization capabilities using pyannote.audio into the Meeting Transcriber application, along with information about NVIDIA Canary-Qwen-2.5b ASR model.

## What Was Implemented

### ✅ Completed Features

1. **Speaker Diarization Service** (Python/FastAPI)
   - Location: `mini-services/diarization-service/`
   - Uses pyannote.audio for speaker segmentation
   - REST API endpoints for diarization
   - Supports base64 and file upload
   - Automatic GPU/CPU detection

2. **Transcription API Enhancement**
   - Location: `src/app/api/transcribe/route.ts`
   - Integrated with diarization service
   - Merges transcription text with speaker labels
   - Optional diarization via request parameter
   - Structured speaker-segmented output

3. **Frontend UI Updates**
   - Location: `src/app/page.tsx`
   - Diarization toggle switch
   - Speaker-labeled transcription display
   - Visual speaker badges with timestamps
   - Speaker count indicator

4. **Report Generation Enhancement**
   - Location: `src/app/api/generate-report/route.ts`
   - Uses speaker information for better analysis
   - Tracks speaker contributions
   - Enhanced participant identification

5. **Documentation**
   - `mini-services/diarization-service/README.md`
   - `docs/SPEAKER_DIARIZATION_GUIDE.md`
   - Setup instructions and troubleshooting

## Current STT Model

The app currently uses the **z-ai-web-dev-sdk's built-in ASR model** for transcription.

**Model Details:**
- Provider: z-ai-web-dev-sdk
- Type: ASR (Automatic Speech Recognition)
- Features:
  - Audio-to-text conversion
  - Multiple format support (WAV, MP3, M4A, etc.)
  - Base64 encoding support
- Limitations:
  - Does not support speaker diarization natively
  - Does not provide word-level timestamps
  - Only returns plain text transcription

## About NVIDIA Canary-Qwen-2.5b

### Model Information

- **Name**: NVIDIA NeMo Canary-Qwen-2.5B
- **Type**: State-of-the-art speech recognition model
- **Parameters**: 2.5 billion
- **WER**: 5.63% (record-breaking as of July 2025)
- **License**: CC-BY-4.0
- **Speed**: 418 RTFx (real-time factor)

### Capabilities

1. **ASR Mode**
   - High-accuracy speech-to-text
   - Punctuation and capitalization
   - English language support

2. **LLM Mode**
   - Post-processing of transcripts
   - Summarization
   - Question answering
   - Requires transcript as input

### Integration Status

**NOT CURRENTLY INTEGRATED** - Documentation and research completed, but implementation requires:

1. **Model Hosting**
   - NVIDIA NIM (NVIDIA Inference Microservice)
   - HuggingFace Inference API
   - Self-hosted deployment

2. **Implementation Steps**
   - Create wrapper service (similar to diarization service)
   - Update `/api/transcribe` to use Canary-Qwen-2.5b
   - Handle model-specific response format
   - Add word-level timestamp extraction (if available)

3. **Requirements**
   - GPU resources (for self-hosting)
   - API access (for cloud services)
   - Additional dependencies (NVIDIA NeMo toolkit)

## Architecture

```
┌─────────────────────────────────────────────────┐
│           User Interface (Next.js)              │
│  - Audio Upload                                  │
│  - Diarization Toggle                           │
│  - Speaker-labeled Display                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         Transcription API (Next.js)             │
│  - Orchestrates ASR & Diarization               │
│  - Merges results                               │
└────────┬────────────────────┬───────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────────┐
│  z-ai-web-dev    │  │  Diarization Service │
│  SDK (ASR)       │  │  (pyannote.audio)    │
│  - Plain Text    │  │  - Speaker Labels    │
│  - No Speakers   │  │  - Timestamps        │
└──────────────────┘  └──────────────────────┘
         │                    │
         └────────┬───────────┘
                  ▼
         ┌─────────────────┐
         │  Merged Output  │
         │  Text + Speakers│
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Report Generation│
         │ (LLM with Speakers)│
         └─────────────────┘
```

## How to Use

### With Diarization Enabled

1. Upload an audio file
2. Toggle "Speaker Diarization" ON
3. Click "Transcribe Audio"
4. View speaker-labeled transcription
5. Generate report with speaker-aware analysis

### Without Diarization

1. Upload an audio file
2. Toggle "Speaker Diarization" OFF
3. Click "Transcribe Audio"
4. View plain text transcription
5. Generate report (speaker-agnostic)

## Setup Requirements

### For Diarization (Optional but Recommended)

1. **Install Python Dependencies**
   ```bash
   cd mini-services/diarization-service
   pip3 install -r requirements.txt
   ```

2. **Get HuggingFace Token**
   - Visit: https://hf.co/settings/tokens
   - Accept conditions: https://huggingface.co/pyannote/speaker-diarization-3.1
   - Set: `export HUGGINGFACE_TOKEN=your_token`

3. **Start Diarization Service**
   ```bash
   cd mini-services/diarization-service
   bun run dev
   ```

### For Basic Transcription (No Setup Required)

The app works out-of-the-box with z-ai-web-dev-sdk's ASR model without any additional setup.

## Key Features

### Speaker Diarization

- ✅ Multi-speaker detection
- ✅ Speaker labeling (SPEAKER_00, SPEAKER_01, etc.)
- ✅ Timestamp segmentation
- ✅ Visual speaker badges
- ✅ Speaker count display

### Transcription

- ✅ High-quality speech-to-text
- ✅ Multiple audio formats
- ✅ Word count tracking
- ✅ Processing time measurement
- ✅ Editable transcription

### Report Generation

- ✅ AI-powered summary
- ✅ Key points extraction
- ✅ Action items with assignees
- ✅ Participant identification
- ✅ Speaker-aware analysis (when diarization enabled)

## Technical Details

### Diarization Service

**Tech Stack:**
- FastAPI (Web Framework)
- pyannote.audio (Diarization)
- PyTorch (ML Framework)
- HuggingFace (Model Hosting)

**Endpoints:**
- `GET /health` - Health check
- `POST /diarize` - File upload
- `POST /diarize-base64` - Base64 audio

**Response Format:**
```json
{
  "segments": [
    {
      "start": 0.5,
      "end": 2.8,
      "duration": 2.3,
      "speaker": "SPEAKER_00"
    }
  ],
  "speaker_count": 2,
  "total_duration": 45.2
}
```

### Next.js API

**Endpoints:**
- `POST /api/transcribe` - Transcribe + Diarize (optional)
- `POST /api/generate-report` - Generate meeting report

**Transcription Response:**
```json
{
  "success": true,
  "transcription": "Full text...",
  "wordCount": 150,
  "diarization": {
    "enabled": true,
    "speakerCount": 2,
    "segments": [...]
  }
}
```

## Limitations

### Current Implementation

1. **Sentence-level alignment**: Transcription is aligned to speakers at sentence level, not word level
2. **No speaker names**: Speakers are labeled as SPEAKER_00, SPEAKER_01, etc.
3. **Diarization dependency**: Requires separate Python service (optional)
4. **Audio format**: z-ai-web-dev-sdk ASR only supports WAV and WebM

### NVIDIA Canary-Qwen-2.5b Limitations

1. **Not integrated**: Requires additional infrastructure
2. **English only**: Currently supports only English
3. **Resource intensive**: Requires GPU for optimal performance

## Future Enhancements

1. **Word-level alignment**: Use word-level timestamps from ASR
2. **Speaker identification**: Add capability to identify speakers by name
3. **Real-time processing**: Support for streaming audio
4. **NVIDIA Canary integration**: Implement Canary-Qwen-2.5b ASR
5. **Custom diarization models**: Support fine-tuned models
6. **Multi-language support**: Expand beyond English

## Troubleshooting

### Diarization Issues

- **Service not responding**: Check if diarization service is running on port 3002
- **HuggingFace errors**: Verify token is set and conditions accepted
- **Poor speaker separation**: Improve audio quality, reduce noise

### Transcription Issues

- **Format errors**: Use WAV or WebM format for best compatibility
- **Poor accuracy**: Ensure clear speech, minimal background noise
- **Empty results**: Check audio contains clear speech

## Files Modified/Created

### Created

1. `mini-services/diarization-service/main.py` - Diarization service
2. `mini-services/diarization-service/requirements.txt` - Python dependencies
3. `mini-services/diarization-service/package.json` - Service config
4. `mini-services/diarization-service/README.md` - Service docs
5. `mini-services/diarization-service/setup.sh` - Setup script
6. `docs/SPEAKER_DIARIZATION_GUIDE.md` - Integration guide
7. `docs/INTEGRATION_SUMMARY.md` - This file

### Modified

1. `src/app/api/transcribe/route.ts` - Added diarization integration
2. `src/app/api/generate-report/route.ts` - Enhanced with speaker info
3. `src/app/page.tsx` - Added diarization UI components

## Support

For detailed setup and troubleshooting, see:
- `docs/SPEAKER_DIARIZATION_GUIDE.md` - Complete integration guide
- `mini-services/diarization-service/README.md` - Diarization service docs

## Conclusion

The Meeting Transcriber app now supports speaker diarization through pyannote.audio integration. While NVIDIA Canary-Qwen-2.5b was researched and documented, it requires additional infrastructure for deployment and is not currently integrated. The app works effectively with the current z-ai-web-dev-sdk ASR model, with optional enhanced speaker analysis when the diarization service is enabled.
